// Research diagnostic (water): what "% full" does and does not tell a manager.
// Read-only: imports exceptions.js and data/*.csv, changes nothing. Run: node docs/audit/diagnostics/water.research.mjs
// Every capacity, inflow and per-head figure below is an ASSUMPTION for illustration; the repo has no tank capacity,
// inflow or temperature field. Per-head daily intake ranges come from extension tables (cited in the audit notes):
//   NRC table as adapted in NDSU AS1763 (rev. 2021) / UNL G2060 (2011); K-State MF3303 (2016); UNL BeefWatch 2020 (calf 5-10 gal).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseCSV, waterStatus, grazingStatus, findExceptions, RULES } from "../../../exceptions.js";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const D = Object.fromEntries(["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"].map((n) => [n, parseCSV(readFileSync(root + "data/" + n + ".csv", "utf8"))]));
const asOf = D.meta[0].as_of;

// gal/head/day, [70F, 90F]; ranges are deliberately wide.
const INTAKE = {
  "cow-calf pairs": [16.9 + 5, 17.4 + 10],     // lactating cow (NRC 70F; K-State 1,300 lb/15 lb milk at 90F) + calf 5-10 gal
  "first-calf heifers": [10.5, 15.7],          // K-State 1,100 lb cow, 10 lb milk: 40F 10.5 ... 90F 15.7 (lower bound uses 40F value)
  "yearling steers": [7.8, 12.7],              // NRC growing 600 lb: 70F 7.8, 90F 12.7
};
const TANKS = { small: 1000, mid: 1690, storage: 10000 };  // gal: 10 ft and 12 ft stock tanks (CSU table), 10,000 gal storage (assumed)

console.log(`as_of ${asOf} (no timezone in meta.csv). Rules: critical <${RULES.waterCritical}%, warning <${RULES.waterLow}%, drop >=${RULES.waterDropPts} pts/24h, silent >=${RULES.sensorSilentHours} h`);
const grazing = grazingStatus(D.moves, D.pastures, asOf);
const groupBy = Object.fromEntries(D.groups.map((g) => [g.group, g]));
console.log("\n1) Same reading, different meaning: hours of water left with ZERO inflow, by assumed tank size and temperature");
for (const t of waterStatus(D.water, asOf)) {
  const here = grazing.filter((g) => g.pastureId === t.pasture).map((g) => groupBy[g.group]);
  if (!here.length) { console.log(`  ${t.tank} ${t.pasture} level ${t.level}%: no group here now (the level and drop rules apply the same severity whether or not cattle are here)`); continue; }
  for (const g of here) {
    const [lo, hi] = INTAKE[g.class];
    const parts = Object.entries(TANKS).map(([k, cap]) => {
      const gal = (t.level / 100) * cap;
      return `${k} ${cap} gal -> ${(gal / (g.head * hi / 24)).toFixed(1)}-${(gal / (g.head * lo / 24)).toFixed(1)} h`;
    });
    console.log(`  ${t.tank} ${t.pasture} level ${t.level}% | ${g.group} ${g.head} hd (${g.class}) | ${parts.join(" | ")}`);
  }
}

console.log("\n2) Same threshold, different hours: what 25% and 40% mean for each group (90F high, zero inflow)");
for (const g of D.groups) {
  const daily = g.head * INTAKE[g.class][1];
  const row = Object.entries(TANKS).map(([k, cap]) => `${k}: 25%=${(0.25 * cap / daily * 24).toFixed(1)} h, 40%=${(0.40 * cap / daily * 24).toFixed(1)} h`);
  console.log(`  ${g.group} ${g.head} hd ~${Math.round(daily)} gal/day | ${row.join(" | ")}`);
}

console.log("\n3) Normal draw-down in points/24h on a storage tank with the pump off (e.g. a cloudy day on solar)");
for (const g of D.groups) for (const cap of [TANKS.storage, 20000]) {
  const pts = (g.head * INTAKE[g.class][1]) / cap * 100;
  console.log(`  ${g.group} on ${cap} gal: ${pts.toFixed(0)} pts/day at 90F -> ${pts >= RULES.waterDropPts ? "WOULD trip the leak rule with no leak" : "below leak rule"}`);
}

console.log("\n4) Synthetic data check: largest 24h fall on each tank over September (6-hourly rows)");
const worst = {};
for (const t of waterStatus(D.water, asOf)) for (let i = 4; i < t.rows.length; i++) {
  const d = t.rows[i - 4].level_pct - t.rows[i].level_pct; worst[t.tank] = Math.max(worst[t.tank] ?? -1e9, +d.toFixed(1));
}
console.log("  ", JSON.stringify(worst));
const lows = {}; for (const t of waterStatus(D.water, asOf)) lows[t.tank] = Math.min(...t.rows.map((r) => r.level_pct));
console.log("   lowest level per tank:", JSON.stringify(lows));

console.log("\n5) Hypothetical tank TX in P7 (where the Cows are now), run through findExceptions with the real rules");
const mk = (lv, times) => times.map((t, i) => ({ tank_id: "TX", pasture_id: "P7", time: t, level_pct: lv[i] }));
const run = (label, water) => console.log(`  ${label} ->`, findExceptions({ ...D, water }).filter((e) => e.area === "Water").map((e) => `${e.severity}: ${e.problem}`));
run("A: silent 26 h, last reading 20%, cows present", mk([60, 40, 20], ["2026-09-29T04:00", "2026-09-29T10:00", "2026-09-29T16:00"]));
run("A2: reporting, 24% now, cows present", mk([60, 40, 24], ["2026-09-30T06:00", "2026-09-30T12:00", "2026-09-30T18:00"]));
run("C: storage tank, normal 35-pt draw with pump off, 60% now", mk([95, 86, 77, 68, 60], ["2026-09-29T18:00", "2026-09-30T00:00", "2026-09-30T06:00", "2026-09-30T12:00", "2026-09-30T18:00"]));
