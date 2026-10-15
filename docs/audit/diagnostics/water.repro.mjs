// Water-rule reproductions for the ranch operations dashboard (waterStatus, the water part of findExceptions, and
// the water charts / "Water tanks OK" tile in app.js).
// Run from the repo root:  node docs/audit/diagnostics/water.repro.mjs
//
// Part 1 (W-*, C-*) feeds tiny inline tank series, or the committed data with one change, through the REAL
// waterStatus / findExceptions from exceptions.js.
// Part 2 (B-*) loads the real page in headless Chromium against a throwaway copy of the app, with water.csv swapped
// per case through request interception, for problems that only show in app.js.
//   env PLAYWRIGHT_PATH   default /opt/node22/lib/node_modules/playwright/index.mjs (Part 2 is skipped if missing)
//   env WATER_REPRO_PORT  first port to try, default 8840 (tries up to 8849)
//   env WATER_REPRO_TMP   where the throwaway copy goes, default the OS temp dir
//
// Each case prints:
//   CASE <id>  <title>
//     expected: <worked out by hand; the reasoning is in the comment beside the case>
//     actual:   <what the code produced, or the error it threw>
//     MATCH | MISMATCH
// MISMATCH means the defect (or design limit) is present. C-* and B-00 are controls that should MATCH.
// The script never throws: every case runs in its own try/catch. It modifies no repo files.
//
// Times in the inline data are written out as literal strings (no Z, like data/water.csv); TZ is pinned to UTC so a
// daylight-saving change in the runner's zone cannot shift an hour count.
process.env.TZ = "UTC";

import { readFileSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../../", import.meta.url);
const ROOT_DIR = fileURLToPath(ROOT);
const { parseCSV, findExceptions, waterStatus } = await import(new URL("exceptions.js", ROOT).href);

const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));
const REAL = Object.fromEntries(FILES.map((f) => [f, parseCSV(RAW[f])]));
const AS_OF = "2026-09-30T18:00";

// Water alerts for a dataset that is the committed one with water.csv replaced (moves/pastures stay real, so the
// "here now" context is real: Cows are in P7 South Divide, Heifers in P4 Lone Tree, Yearlings in P3 Sand Hills).
const waterAlerts = (water, meta = [{ as_of: AS_OF }]) =>
  findExceptions({ ...REAL, water, meta }).filter((e) => e.area === "Water");
// Inline tank rows: [tank, pasture, time, level]
const rows = (...r) => r.map(([tank_id, pasture_id, time, level_pct]) => ({ tank_id, pasture_id, time, level_pct }));
const csvWater = (body) => parseCSV("tank_id,pasture_id,time,level_pct\n" + body);
const fmt = (alerts) => (alerts.length ? alerts.map((e) => `${e.severity} | ${e.subject} | ${e.problem}`).join("  ||  ") : "(no water alerts)");

let mismatches = 0, matches = 0, errors = 0;
function report(id, title, expected, actualFn, okFn) {
  console.log(`CASE ${id}  ${title}`);
  console.log(`  expected: ${expected}`);
  try {
    const actual = actualFn();
    console.log(`  actual:   ${actual.text}`);
    const ok = okFn(actual);
    console.log(`  ${ok ? "MATCH" : "MISMATCH"}`);
    ok ? matches++ : mismatches++;
  } catch (e) {
    console.log(`  actual:   threw ${e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e}`);
    console.log("  MISMATCH");
    errors++; mismatches++;
  }
  console.log("");
}

console.log("=== Part 1: exceptions.js (node) ===\n");

// ------------------------------------------------------------------ W-01 stale baseline after a reading gap
// Sensor reports every 6 h until Sep 27 18:00 (90%), radio outage, resumes Sep 30 12:00 (56%) and 18:00 (54%).
// Inside the true 24 h window (Sep 29 18:00 to Sep 30 18:00) the only readings are 56 -> 54: 2 points in 6 hours.
// The 36-point difference (90 - 54) spans 72 hours (Sep 27 18:00 -> Sep 30 18:00), i.e. 12 points/day.
// Correct: no "in 24 hours" leak claim (no water alert at all, since 54% is above 40%), or a text that says 72 hours.
report("W-01", "drop baseline is 3 days old after a sensor outage, still called '24 hours'",
  "no water alert (2 points in the last 6 h; 54% is above 40%), or a drop text that says 72 hours, not 24",
  () => {
    const a = waterAlerts(rows(["T1", "P1", "2026-09-27T12:00", 91], ["T1", "P1", "2026-09-27T18:00", 90],
      ["T1", "P1", "2026-09-30T12:00", 56], ["T1", "P1", "2026-09-30T18:00", 54]));
    return { a, text: fmt(a) };
  },
  ({ a }) => a.length === 0 || a.every((e) => !/in 24 hours/.test(e.problem)));

// ------------------------------------------------------------------ W-02 fast drop with under 24 h of history
// New sensor (or an export that starts at midnight): 95, 80, 65, 50 at 00:00, 06:00, 12:00, 18:00 on Sep 30.
// 95 - 50 = 45 points in 18 hours, which is more than the 30-point/24 h leak rule. Correct: critical leak alert.
report("W-02", "45-point drop in 18 hours missed because no reading is 24 h older than the last",
  "critical: drop of 45 points (95 -> 50) within 24 hours",
  () => {
    const t = waterStatus(rows(["T1", "P1", "2026-09-30T00:00", 95], ["T1", "P1", "2026-09-30T06:00", 80],
      ["T1", "P1", "2026-09-30T12:00", 65], ["T1", "P1", "2026-09-30T18:00", 50]), AS_OF)[0];
    const a = waterAlerts(t.rows);
    return { a, text: `drop24h=${t.drop24h}; ${fmt(a)}` };
  },
  ({ a }) => a.some((e) => e.severity === "critical"));

// ------------------------------------------------------------------ W-03 drop that ends with a refill
// 90 at Sep 29 18:00, 70 at 00:00, 50 at 06:00 (40 points down in 12 h), float catches up: 85 at 12:00, 86 at 18:00.
// Largest fall inside the last 24 h: 90 -> 50 = 40 points. Endpoint difference: 90 - 86 = 4.
report("W-03", "40-point fall inside the last 24 h that refilled before the last reading",
  "the 40-point fall (90 -> 50) reported (as at least a warning: intermittent float/leak), since the rule says 'a drop of 30+ points in 24 hours'",
  () => {
    const t = waterStatus(rows(["T1", "P1", "2026-09-29T18:00", 90], ["T1", "P1", "2026-09-30T00:00", 70],
      ["T1", "P1", "2026-09-30T06:00", 50], ["T1", "P1", "2026-09-30T12:00", 85], ["T1", "P1", "2026-09-30T18:00", 86]), AS_OF)[0];
    const a = waterAlerts(t.rows);
    return { a, text: `drop24h=${t.drop24h}; ${fmt(a)}` };
  },
  ({ a }) => a.length > 0);

// ------------------------------------------------------------------ W-04 conflicting duplicate timestamps
// Two rows for T1 at Sep 30 18:00: 78% and 20% (e.g. a re-sent packet or a manual check entered over the sensor).
// The same rows in a different file order must give the same answer; a conflict should be surfaced.
report("W-04", "duplicate timestamp with conflicting levels: result depends on file order",
  "same alerts for both file orders (and ideally a 'conflicting readings' flag)",
  () => {
    const base = ["T1", "P1", "2026-09-29T18:00", 80];
    const A = waterAlerts(rows(base, ["T1", "P1", "2026-09-30T18:00", 78], ["T1", "P1", "2026-09-30T18:00", 20]));
    const B = waterAlerts(rows(base, ["T1", "P1", "2026-09-30T18:00", 20], ["T1", "P1", "2026-09-30T18:00", 78]));
    return { A, B, text: `order 78-then-20: ${fmt(A)}   |   order 20-then-78: ${fmt(B)}` };
  },
  ({ A, B }) => fmt(A) === fmt(B));

// ------------------------------------------------------------------ W-05 mixed timestamp formats
// The latest reading is written with a space ("2026-09-30 18:00", as Excel or a hand entry writes it), the rest with T.
// By time, the order is 29 18:00 (80), 30 12:00 (75), 30 18:00 (20): the tank is at 20% now -> critical "Down to 20% full".
report("W-05", "latest row written '2026-09-30 18:00' (space) sorts before '2026-09-30T12:00'",
  "critical: Down to 20% full (the 18:00 reading is the newest)",
  () => {
    const t = waterStatus(rows(["T1", "P1", "2026-09-29T18:00", 80], ["T1", "P1", "2026-09-30T12:00", 75],
      ["T1", "P1", "2026-09-30 18:00", 20]), AS_OF)[0];
    const a = waterAlerts(t.rows.slice());
    return { a, text: `sorted order=${t.rows.map((r) => r.time).join(" , ")}; level used=${t.level}; ${fmt(a)}` };
  },
  ({ a }) => a.some((e) => e.severity === "critical" && /20%/.test(e.problem)));

// ------------------------------------------------------------------ W-05b whole file re-saved by Excel (US dates)
// Committed water.csv with every time rewritten the way Excel saves it in a US locale: "2026-09-30T18:00" ->
// "9/30/2026 18:00", "2026-09-01T06:00" -> "9/1/2026 6:00". Same instants, same levels, so the correct answer is
// unchanged from C-01: T2 critical (11.8%), T4 critical (46-point drop), T6 serious (42 h silent), nothing else.
report("W-05b", "water.csv re-saved by Excel (m/d/yyyy h:mm): string sort picks the wrong 'last' reading",
  "same 3 rows as C-01: T2 critical 11.8%, T4 critical 46-point drop, T6 serious 42 h; T1/T3/T5/T7/T8 no alert",
  () => {
    const us = (t) => { const m = t.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)$/); return `${+m[2]}/${+m[3]}/${m[1]} ${+m[4]}:${m[5]}`; };
    const water = REAL.water.map((r) => ({ ...r, time: us(r.time) }));
    const a = waterAlerts(water);
    const t1 = waterStatus(water, AS_OF).find((t) => t.tank === "T1");
    return { a, text: `T1 'last' row=${t1.lastTime} (${t1.level}%); ${a.length} rows: ${fmt(a.slice(0, 3))}${a.length > 3 ? "  || ..." : ""}` };
  },
  ({ a }) => a.length === 3 && /Tank T2/.test(a[0].subject) && /Tank T4/.test(a[1].subject) && /Tank T6/.test(a[2].subject));

// ------------------------------------------------------------------ W-16 level alone, no stock or capacity
// Real moves: Cows (180 pairs) are in P7 South Divide; P2 Windmill is empty. Two tanks at the same 38%: one where the
// cows are drinking, one in the empty pasture. Without capacity or head count the rule cannot tell them apart; a
// stock-aware rule ranks the P7 tank first or rates it higher.
report("W-16", "same 38% level gets the same warning with 180 pairs drinking or with the pasture empty",
  "TA (P7, Cows here now) rated or ranked above TB (P2, empty)",
  () => {
    const a = waterAlerts(rows(["TB", "P2", "2026-09-29T18:00", 40], ["TB", "P2", "2026-09-30T18:00", 38],
      ["TA", "P7", "2026-09-29T18:00", 40], ["TA", "P7", "2026-09-30T18:00", 38]));
    return { a, text: fmt(a) };
  },
  ({ a }) => a.length === 2 && (/Tank TA/.test(a[0].subject) || a[0].severity !== a[1].severity));

// ------------------------------------------------------------------ W-06 reading dated after as_of
// as_of is Sep 30 18:00. A reading stamped Oct 2 18:00 is 48 hours in the future: a clock or entry error.
// It can't be trusted as "the level now"; correct: a data-quality alert (unknown), not silence of -48 hours.
report("W-06", "last reading 48 h after as_of gives negative silentHours and passes as fresh",
  "a water alert for T1 saying the reading is after the as-of time (state unknown); silentHours never negative",
  () => {
    const t = waterStatus(rows(["T1", "P1", "2026-09-29T18:00", 80], ["T1", "P1", "2026-10-02T18:00", 80]), AS_OF)[0];
    const a = waterAlerts(t.rows);
    return { a, t, text: `silentHours=${t.silentHours}; ${fmt(a)}` };
  },
  ({ a, t }) => t.silentHours >= 0 && a.length > 0);

// ------------------------------------------------------------------ W-07 one mistyped future row hides a real silence
// Real T6 rows (last real reading Sep 29 00:00 = 42 h before as_of) plus one manual tank-check row with the month
// mistyped: 2026-10-29T00:00 instead of 2026-09-29T00:00. Correct: still serious "No reading for 42 hours".
report("W-07", "a single month-typo row (10 for 09) masks a 42-hour sensor silence",
  "serious: No reading for 42 hours (Tank T6)",
  () => {
    const water = [...REAL.water, { tank_id: "T6", pasture_id: "P6", time: "2026-10-29T00:00", level_pct: 95 }];
    const a = waterAlerts(water);
    const t6 = waterStatus(water, AS_OF).find((t) => t.tank === "T6");
    return { a, text: `T6 silentHours=${t6.silentHours}; ${fmt(a)}` };
  },
  ({ a }) => a.some((e) => e.severity === "serious" && /Tank T6/.test(e.subject) && /42 hours/.test(e.problem)));

// ------------------------------------------------------------------ W-08 tank with zero rows is invisible
// Committed data with every T6 row removed (sensor never reported in this export, or it died before a rolling
// export window began). There is no tank list, so nothing knows T6 exists. Correct: T6 still reported as unknown
// (serious, no reading), and 8 tanks counted.
report("W-08", "tank with zero rows (no tanks master table): T6 vanishes from alerts and counts",
  "8 tanks; Tank T6 (Cedar Draw) serious: no reading in this export",
  () => {
    const water = REAL.water.filter((r) => r.tank_id !== "T6");
    const a = waterAlerts(water);
    return { a, n: waterStatus(water, AS_OF).length, text: `tanks=${waterStatus(water, AS_OF).length}; ${fmt(a)}` };
  },
  ({ a, n }) => n === 8 && a.some((e) => /Tank T6/.test(e.subject)));

// ------------------------------------------------------------------ W-09 blank level on the last row
// Last row written without a level (truncated write / sensor fault): "T1,P1,2026-09-30T18:00,". The tank was at 80%
// 24 h earlier and 79% at 12:00. There is no valid level now: correct is "no valid reading" (unknown), not a leak.
report("W-09", "blank level on the newest row becomes an 80-point 'leak' with 'now % full'",
  "an unknown/no-valid-reading alert for T1; never 'Dropped 80 points' or 'now %'",
  () => {
    const a = waterAlerts(csvWater("T1,P1,2026-09-29T18:00,80\nT1,P1,2026-09-30T12:00,79\nT1,P1,2026-09-30T18:00,"));
    return { a, text: fmt(a) };
  },
  ({ a }) => a.length > 0 && a.every((e) => !/Dropped 80 points/.test(e.problem) && !/now %( full)?$/.test(e.problem)));

// ------------------------------------------------------------------ W-10 sensor error text on the last row
// Last row "ERR" (the sensor's fault code). Level now unknown: correct is an unknown alert, not a silent all-clear.
report("W-10", "sensor error text 'ERR' on the newest row passes as healthy",
  "an unknown/no-valid-reading alert for T1",
  () => {
    const t = waterStatus(csvWater("T1,P1,2026-09-29T18:00,80\nT1,P1,2026-09-30T18:00,ERR"), AS_OF)[0];
    const a = waterAlerts(t.rows);
    return { a, text: `level=${JSON.stringify(t.level)} drop24h=${t.drop24h}; ${fmt(a)}` };
  },
  ({ a }) => a.length > 0);

// ------------------------------------------------------------------ W-11 portable tank moved between pastures
// Portable tank T9 sat in P1 North Flat at 90% yesterday; it was drained, moved to P3 Sand Hills with the yearlings
// and is refilling (15% at 12:00, 55% at 18:00). The 90 -> 55 difference compares two different placements.
// Correct: no leak alert (series restarts at the move); 55% is above 40%, so no water alert at all.
report("W-11", "tank whose pasture_id changes: cross-pasture difference reported as a leak in the new pasture",
  "no water alert (the 90% reading was in another pasture; 55% now)",
  () => {
    const a = waterAlerts(rows(["T9", "P1", "2026-09-29T18:00", 90], ["T9", "P3", "2026-09-30T12:00", 15],
      ["T9", "P3", "2026-09-30T18:00", 55]));
    return { a, text: fmt(a) };
  },
  ({ a }) => a.length === 0);

// ------------------------------------------------------------------ W-12 silent tank last seen nearly empty
// T1: 60 at Sep 28 18:00, 30 at Sep 29 06:00, 8 at Sep 29 12:00, then nothing (30 h before as_of).
// Last known level 8% (under the 25% critical line) after a 52-point fall in 18 h: likely dry now.
// Correct: critical (someone goes now), not the same serious row as a full tank whose radio died.
report("W-12", "silent tank whose last level was 8% and falling is only 'serious'",
  "critical for T1 (last known 8%, fell 52 points in 18 h, then silent 30 h)",
  () => {
    const a = waterAlerts(rows(["T1", "P1", "2026-09-28T18:00", 60], ["T1", "P1", "2026-09-29T06:00", 30],
      ["T1", "P1", "2026-09-29T12:00", 8]));
    return { a, text: fmt(a) };
  },
  ({ a }) => a.some((e) => e.severity === "critical"));

// ------------------------------------------------------------------ W-13 floating-point miss at exactly 30 points
// 80.1% -> 50.1% over exactly 24 h. By hand: 80.1 - 50.1 = 30.0 points, which meets "a drop of 30+ points".
report("W-13", "exact 30.0-point drop (80.1 -> 50.1) computed as 29.999... and missed",
  "critical: Dropped 30 points in 24 hours, now 50.1%",
  () => {
    const t = waterStatus(rows(["T1", "P1", "2026-09-29T18:00", 80.1], ["T1", "P1", "2026-09-30T18:00", 50.1]), AS_OF)[0];
    const a = waterAlerts(t.rows);
    return { a, text: `drop24h=${t.drop24h}; ${fmt(a)}` };
  },
  ({ a }) => a.some((e) => e.severity === "critical"));

// ------------------------------------------------------------------ W-14 empty-pasture tank ranked above a stocked leak
// Committed data. moves.csv rows with no out_date: Cows P7, Heifers P4, Yearlings P3, so P2 Windmill is empty.
// Both T2 (empty, 11.8%) and T4 (45 heifers drinking, leaking) are critical; the one with stock on it is the one
// someone must go to now, so a stock-aware order lists T4 first.
report("W-14", "critical tank in an empty pasture listed above the leaking tank 45 heifers depend on",
  "first water row is Tank T4 (Lone Tree, Heifers here now); T2 (no stock) after it or lower severity",
  () => {
    const a = waterAlerts(REAL.water);
    return { a, text: fmt(a) };
  },
  ({ a }) => /Tank T4/.test(a[0].subject));

// ------------------------------------------------------------------ W-15 tank in a pasture missing from pastures.csv
// T9 in P9 (e.g. a headquarters trap not in pastures.csv) at 20%. Correct subject names the id: "Tank T9 (P9)".
report("W-15", "pasture_id not in pastures.csv prints 'Tank T9 (undefined)'",
  "critical with subject 'Tank T9 (P9)' (or 'unknown pasture P9'); never 'undefined'",
  () => {
    const a = waterAlerts(rows(["T9", "P9", "2026-09-29T18:00", 22], ["T9", "P9", "2026-09-30T18:00", 20]));
    return { a, text: fmt(a) };
  },
  ({ a }) => a.length === 1 && !/undefined/.test(a[0].subject));

// ------------------------------------------------------------------ controls
// C-01: the committed data. By reading data/water.csv: T2 last 11.8 (under 25); T4 56 at Sep 29 18:00 -> 10 at
// Sep 30 18:00 = 46 points; T6 last row Sep 29 00:00 = 42 h before as_of, last level 98.5. Heifers are in P4.
report("C-01", "committed data: exactly the three planted water problems",
  "critical | Tank T2 (Windmill) | Down to 11.8% full  ||  critical | Tank T4 (Lone Tree, Heifers here now) | Dropped 46 points in 24 hours, now 10%  ||  serious | Tank T6 (Cedar Draw) | No reading for 42 hours; last level 98.5%",
  () => { const a = waterAlerts(REAL.water); return { a, text: fmt(a) }; },
  ({ text }) => text === "critical | Tank T2 (Windmill) | Down to 11.8% full  ||  critical | Tank T4 (Lone Tree, Heifers here now) | Dropped 46 points in 24 hours, now 10%  ||  serious | Tank T6 (Cedar Draw) | No reading for 42 hours; last level 98.5%");

// C-02: refill. T8 committed: 65 at Sep 29 18:00 -> 84.5 at Sep 30 18:00, a 19.5-point rise. No alert.
report("C-02", "a refill (level rises 19.5 points, T8) is not flagged",
  "no T8 alert; drop24h = -19.5",
  () => {
    const t8 = waterStatus(REAL.water, AS_OF).find((t) => t.tank === "T8");
    const a = waterAlerts(REAL.water).filter((e) => /Tank T8/.test(e.subject));
    return { a, d: t8.drop24h, text: `drop24h=${t8.drop24h}; ${fmt(a)}` };
  },
  ({ a, d }) => a.length === 0 && Math.abs(d + 19.5) < 1e-9);

// C-03: regular 6-hour cadence, 80 -> 45 over exactly 24 h = 35 points: critical leak row.
report("C-03", "regular 6-h readings, 35-point drop over exactly 24 h",
  "critical: Dropped 35 points in 24 hours, now 45%",
  () => {
    const a = waterAlerts(rows(["T1", "P1", "2026-09-29T18:00", 80], ["T1", "P1", "2026-09-30T00:00", 80],
      ["T1", "P1", "2026-09-30T06:00", 80], ["T1", "P1", "2026-09-30T12:00", 80], ["T1", "P1", "2026-09-30T18:00", 45]));
    return { a, text: fmt(a) };
  },
  ({ a }) => a.length === 1 && a[0].severity === "critical" && a[0].problem === "Dropped 35 points in 24 hours, now 45%");

// C-04: level thresholds are strict "under": 24.9 critical, 25 warning, 39.9 warning, 40 nothing.
report("C-04", "level boundaries 24.9 / 25 / 39.9 / 40",
  "critical, warning, warning, none",
  () => {
    const sev = (l) => { const a = waterAlerts(rows(["T1", "P1", "2026-09-29T18:00", l], ["T1", "P1", "2026-09-30T18:00", l])); return a.length ? a[0].severity : "none"; };
    const s = [24.9, 25, 39.9, 40].map(sev);
    return { s, text: s.join(", ") };
  },
  ({ s }) => s.join(",") === "critical,warning,warning,none");

// C-05: silence boundaries. Last reading Sep 29 18:00 = 24 h before as_of: serious. Sep 30 00:00 = 18 h: not silent.
report("C-05", "silence at exactly 24 h is flagged, 18 h is not",
  "24 h: serious 'No reading for 24 hours; last level 80%'; 18 h: no alert",
  () => {
    const a24 = waterAlerts(rows(["T1", "P1", "2026-09-29T12:00", 80], ["T1", "P1", "2026-09-29T18:00", 80]));
    const a18 = waterAlerts(rows(["T1", "P1", "2026-09-29T18:00", 80], ["T1", "P1", "2026-09-30T00:00", 80]));
    return { a24, a18, text: `24 h: ${fmt(a24)}   |   18 h: ${fmt(a18)}` };
  },
  ({ a24, a18 }) => a24.length === 1 && a24[0].severity === "serious" && a24[0].problem === "No reading for 24 hours; last level 80%" && a18.length === 0);

// C-06: out-of-order rows in one uniform ISO format give the same result as sorted rows (C-03's data reversed).
report("C-06", "rows out of order (uniform ISO format) are sorted before judging",
  "same as C-03: critical: Dropped 35 points in 24 hours, now 45%",
  () => {
    const a = waterAlerts(rows(["T1", "P1", "2026-09-30T18:00", 45], ["T1", "P1", "2026-09-30T06:00", 80],
      ["T1", "P1", "2026-09-29T18:00", 80], ["T1", "P1", "2026-09-30T12:00", 80], ["T1", "P1", "2026-09-30T00:00", 80]));
    return { a, text: fmt(a) };
  },
  ({ a }) => a.length === 1 && a[0].problem === "Dropped 35 points in 24 hours, now 45%");

// C-07: a single reading is still judged on level (39% -> warning); its drop is unknown and reported as 0.
report("C-07", "one reading only: judged on level",
  "warning: 39% full",
  () => {
    const t = waterStatus(rows(["T1", "P1", "2026-09-30T18:00", 39]), AS_OF)[0];
    const a = waterAlerts(t.rows);
    return { a, text: `drop24h=${t.drop24h}; ${fmt(a)}` };
  },
  ({ a }) => a.length === 1 && a[0].severity === "warning" && a[0].problem === "39% full");

// C-08: waterStatus does not reorder the caller's array (it sorts per-tank copies).
report("C-08", "waterStatus leaves d.water in file order",
  "first three times unchanged: 2026-09-30T18:00, 2026-09-29T18:00, 2026-09-30T00:00",
  () => {
    const w = rows(["T1", "P1", "2026-09-30T18:00", 45], ["T1", "P1", "2026-09-29T18:00", 80], ["T1", "P1", "2026-09-30T00:00", 80]);
    waterStatus(w, AS_OF);
    return { w, text: w.map((r) => r.time).join(", ") };
  },
  ({ w }) => w.map((r) => r.time).join(",") === "2026-09-30T18:00,2026-09-29T18:00,2026-09-30T00:00");

// C-09: a silent tank is not also judged on its stale level (last level 10%, 30 h silent -> one serious row only).
report("C-09", "silent tank gets one row, not also a low-level row",
  "exactly one row: serious 'No reading for 30 hours; last level 10%'",
  () => {
    const a = waterAlerts(rows(["T1", "P1", "2026-09-29T06:00", 12], ["T1", "P1", "2026-09-29T12:00", 10]));
    return { a, text: fmt(a) };
  },
  ({ a }) => a.length === 1 && a[0].severity === "serious" && a[0].problem === "No reading for 30 hours; last level 10%");

// ================================================================== Part 2: app.js in headless Chromium
console.log("=== Part 2: app.js (headless Chromium) ===\n");

const PW = process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs";
const T6_CUT = "2026-09-22T12:00";   // B-01: T6 stops 8 days 6 hours before as_of (rows retained up to here)
const B = [
  // [id, title, water.csv transform, expected, check(state)]
  ["B-00", "committed data (control)", (t) => t,
    "no page error; 8 water charts; T6 heading 'no signal'; tile 'Water tanks OK 5 of 8 / 3 need a look'; grazing, gain, budget, rules drawn",
    (s) => !s.errors.length && s.minis === 8 && s.heads.some((h) => /^T6 Cedar Draw\s*no signal$/.test(h)) && /5 of 8/.test(s.tile) && /3 need a look/.test(s.tile) && s.grazing && s.gain && s.budget && s.rules === 12],
  // Rows kept to Sep 22 12:00 means none inside the 7-day chart window (from Sep 23 18:00). By hand T6 is silent
  // 8 days 6 hours = 198 h; the report should say so and every chart should still draw.
  ["B-01", `T6 silent 198 h (rows end ${T6_CUT}, none in the 7-day chart window)`,
    (t) => t.split("\r\n").filter((l) => !(l.startsWith("T6,") && l.split(",")[2] > T6_CUT)).join("\r\n"),
    "no page error; 8 water charts with T6 'no signal'; grazing, gain, budget and rules drawn; report row 'No reading for 198 hours'",
    (s) => !s.errors.length && s.minis === 8 && s.grazing && s.gain && s.budget && s.rules === 12],
  // All T6 rows removed. By hand there are 8 tanks and 3 need a look (T2 low, T4 leak, T6 not reporting).
  ["B-02", "no rows at all for T6", (t) => t.split("\r\n").filter((l) => !l.startsWith("T6,")).join("\r\n"),
    "tile 'Water tanks OK 5 of 8 / 3 need a look'; a T6 chart or row saying it has not reported",
    (s) => /5 of 8/.test(s.tile) && /3 need a look/.test(s.tile)],
  // Rename T2 -> "Well 2" and T4 -> "Well 4" (tank names with a space). Same 3 problem tanks: 5 of 8, 3 need a look.
  ["B-03", "tank ids with a space ('Well 2', 'Well 4')",
    (t) => t.replaceAll("\nT2,", "\nWell 2,").replaceAll("\nT4,", "\nWell 4,"),
    "tile 'Water tanks OK 5 of 8 / 3 need a look' (Well 2, Well 4, T6)",
    (s) => /5 of 8/.test(s.tile) && /3 need a look/.test(s.tile)],
  // One extra T1 row dated Oct 2 18:00 (after as_of Sep 30 18:00). The chart's right edge is x = 254 (W 260 - 6).
  ["B-04", "T1 reading dated 2 days after as_of", (t) => t.replace(/\r\n$/, "") + "\r\nT1,P1,2026-10-02T18:00,80\r\n",
    "T1 marked as a data problem (not '80%'), and its last-point dot inside the chart (cx <= 254)",
    (s) => !/^T1 North Flat\s*80%$/.test(s.heads[0]) && s.t1dot <= 254],
  // T2's newest row is the fault text ERR. Level unknown -> should count as needing a look, never print 'ERR%'.
  ["B-05", "T2 newest reading 'ERR'", (t) => t.replace("T2,P2,2026-09-30T18:00,11.8", "T2,P2,2026-09-30T18:00,ERR"),
    "T2 counted as needing a look (3 need a look); no 'ERR%' heading; no SVG NaN error",
    (s) => /3 need a look/.test(s.tile) && !s.heads.some((h) => /ERR%/.test(h)) && !s.console.some((c) => /NaN/.test(c))],
];

async function waitFor(url, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { const r = await fetch(url); if (r.ok) return true; } catch {}
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

let chromium = null;
try { ({ chromium } = await import(PW)); } catch (e) { console.log(`Part 2 skipped: cannot import Playwright from ${PW} (${e.message})\n`); }

if (chromium) {
  let server = null, browser = null, work = null;
  try {
    work = mkdtempSync(join(process.env.WATER_REPRO_TMP || tmpdir(), "water-repro-"));
    for (const f of ["index.html", "app.js", "exceptions.js", "data"]) cpSync(join(ROOT_DIR, f), join(work, f), { recursive: true });
    let port = Number(process.env.WATER_REPRO_PORT || 8840), base = null;
    for (; port <= 8849 && !base; port++) {
      const busy = await fetch(`http://127.0.0.1:${port}/`).then(() => true, () => false);
      if (busy) continue;
      server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", work], { stdio: "ignore" });
      if (await waitFor(`http://127.0.0.1:${port}/index.html`, 5000)) base = `http://127.0.0.1:${port}`;
      else { server.kill(); server = null; }
    }
    if (!base) throw new Error("no free port in 8840-8849 or python3 http.server did not start");
    console.log(`(serving a copy from ${work} at ${base})\n`);
    browser = await chromium.launch();
    for (const [id, title, transform, expected, check] of B) {
      console.log(`CASE ${id}  ${title}`);
      console.log(`  expected: ${expected}`);
      let page = null;
      try {
        page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const errorsSeen = [], consoleSeen = [];
        page.on("pageerror", (e) => errorsSeen.push(e.message));
        page.on("console", (m) => m.type() === "error" && consoleSeen.push(m.text()));
        const body = transform(RAW.water);
        await page.route("**/data/water.csv", (route) => route.fulfill({ status: 200, contentType: "text/csv", body }));
        await page.goto(`${base}/index.html`, { waitUntil: "networkidle" });
        await page.waitForTimeout(300);
        const st = await page.evaluate(() => {
          const q = (s) => [...document.querySelectorAll(s)];
          const tile = q("#tiles .tile").map((t) => t.innerText.replace(/\s+/g, " ")).find((t) => /water tanks ok/i.test(t)) || "(no tile)";
          const dots = q("#water .mini").map((m) => { const c = m.querySelector("circle"); return c ? +c.getAttribute("cx") : null; });
          return {
            tile, minis: q("#water .mini").length,
            heads: q("#water .mini h4").map((h) => h.innerText.replace(/\s+/g, " ").trim()),
            t1dot: dots[0],
            grazing: !!document.querySelector("#grazing svg"), gain: !!document.querySelector("#gain svg"),
            budget: !!document.querySelector("#budgetChart svg"), rules: q("#rules tr").length,
            waterRows: q("#exceptions tr").map((r) => r.innerText.replace(/\s+/g, " ").trim()).filter((r) => /Water/.test(r)),
          };
        });
        st.errors = errorsSeen; st.console = consoleSeen;
        console.log(`  actual:   page errors=${JSON.stringify(st.errors)}; console errors=${JSON.stringify(st.console.slice(0, 2))}`);
        console.log(`            tile="${st.tile}"; water charts=${st.minis}; headings=${JSON.stringify(st.heads)}`);
        console.log(`            T1 dot cx=${st.t1dot}; grazing svg=${st.grazing}; gain svg=${st.gain}; budget svg=${st.budget}; rules rows=${st.rules}`);
        console.log(`            water report rows=${JSON.stringify(st.waterRows)}`);
        const ok = check(st);
        console.log(`  ${ok ? "MATCH" : "MISMATCH"}`);
        ok ? matches++ : mismatches++;
      } catch (e) {
        console.log(`  actual:   threw ${e && e.message ? e.message.split("\n")[0] : e}`);
        console.log("  MISMATCH");
        errors++; mismatches++;
      } finally {
        if (page) await page.close().catch(() => {});
      }
      console.log("");
    }
  } catch (e) {
    console.log(`Part 2 aborted: ${e && e.message ? e.message : e}\n`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) server.kill();
    if (work) { try { rmSync(work, { recursive: true, force: true }); } catch {} }
  }
}

console.log(`SUMMARY  ${matches} MATCH, ${mismatches} MISMATCH (${errors} threw inside a case)`);
