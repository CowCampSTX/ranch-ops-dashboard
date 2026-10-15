// Time, timezone and reporting-period reproductions for the ranch operations dashboard.
// Run from the repo root:  node docs/audit/diagnostics/time.repro.mjs
//
// Every case feeds tiny inline data through the REAL functions in exceptions.js (parseCSV, findExceptions,
// waterStatus, grazingStatus, gainStatus, budgetStatus) and prints:
//   CASE <id>  <title>
//     expected: <worked out by hand; the arithmetic is in the comment beside the case>
//     actual:   <what the code produced, or the error it threw>
//     MATCH | MISMATCH
// MISMATCH means the defect is present. Cases named TIME-C* are controls that should MATCH; TIME-D* cases show a
// design limitation (the code does what it says, but the data model can't support a confident answer).
//
// Timezone cases re-run this same file as a child process under TZ=UTC, America/Chicago, America/Denver and
// Pacific/Auckland (`node time.repro.mjs --probe <name>`), because JavaScript parses "2026-09-30T18:00" (no offset)
// in the computer's local zone but "2026-09-30" (date only) as UTC midnight.
// The script never throws (each case has its own try/catch) and modifies no files.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../../", import.meta.url);
const X = await import(new URL("exceptions.js", ROOT).href);
const { parseCSV, findExceptions, waterStatus, grazingStatus, gainStatus, budgetStatus } = X;
const SELF = fileURLToPath(import.meta.url);
const TZS = ["UTC", "America/Chicago", "America/Denver", "Pacific/Auckland"];

// ------------------------------------------------------------------ fixtures
// A minimal alert-free dataset as CSV text; each case overrides only what it is about.
const H = {
  meta: "as_of\n2026-09-30T18:00",
  pastures: "pasture_id,name,acres,planned_graze_days,min_rest_days\nP1,North Flat,640,21,45\nP3,Sand Hills,720,21,60",
  groups: "group,class,head,target_adg_lbs",
  moves: "group,pasture_id,in_date,out_date",
  weights: "tag,group,date,weight_lbs",
  water: "tank_id,pasture_id,time,level_pct",
  health: "group,task,last_done,next_due,status",
  budget: "month,category,budget,actual",
};
const load = (over = {}) => Object.fromEntries(Object.keys(H).map((k) => [k, parseCSV(over[k] ?? H[k])]));
const REPO = (f) => readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8");
const loadRepo = (over = {}) => Object.fromEntries(Object.keys(H).map((k) => [k, parseCSV(over[k] ?? REPO(k))]));
const rows = (d, area) => findExceptions(d).filter((e) => !area || e.area === area).map((e) => `${e.severity}: ${e.subject}: ${e.problem}`);
const water = (pairs, tank = "T1", pid = "P1") => H.water + "\n" + pairs.map(([t, l]) => `${tank},${pid},${t},${l}`).join("\n");

// ------------------------------------------------------------------ probes (run in a child process per TZ)
const PROBES = {
  // Committed data: every rule output and summary, hashed.
  committed: () => {
    const d = loadRepo();
    const s = JSON.stringify([findExceptions(d), waterStatus(d.water, d.meta[0].as_of).map(({ rows, ...t }) => t),
      grazingStatus(d.moves, d.pastures, d.meta[0].as_of), gainStatus(d.weights, d.groups).map(({ animals, ...g }) => g), budgetStatus(d.budget)]);
    let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return `${findExceptions(d).length} rows, hash ${h.toString(16)}`;
  },
  // US DST ends 2026-11-01. Moved in Oct 30, as of Nov 2: Oct 30->31->Nov 1->Nov 2 = 3 calendar days.
  grazingNov: () => rows(load({ meta: "as_of\n2026-11-02T18:00", pastures: H.pastures.replace("P1,North Flat,640,21", "P1,North Flat,640,2"),
    moves: H.moves + "\nCows,P1,2026-10-30," })).join(" / "),
  // US DST starts 2027-03-14. Moved in Mar 12, as of Mar 15 = 3 days on a 2-day plan; booster due Mar 12 = 3 days overdue.
  grazingHealthMar: () => rows(load({ meta: "as_of\n2027-03-15T18:00", pastures: H.pastures.replace("P1,North Flat,640,21", "P1,North Flat,640,2"),
    moves: H.moves + "\nCows,P1,2027-03-12,", health: H.health + "\nCows,Booster,,2027-03-12,open" })).join(" / "),
  // Due Nov 5, as of Nov 2 (crosses Nov 1 DST end): Nov 2->5 = 3 days.
  healthNov: () => rows(load({ meta: "as_of\n2026-11-02T18:00", health: H.health + "\nCows,Pinkeye check,,2026-11-05,open" })).join(" / "),
  // Oct 1 -> Nov 15 is 30 (rest of Oct) + 15 = 45 days; 1000 -> 1090 lbs = 90/45 = 2.00 lbs/day.
  gainDst: () => gainStatus(parseCSV(H.weights + "\nY1,Yearlings,2026-10-01,1000\nY1,Yearlings,2026-11-15,1090"),
    [{ group: "Yearlings", head: 1, target_adg_lbs: 2 }]).map((g) => g.adg.toFixed(4)).join(),
  // Ordinary day, no DST: last reading Sep 29 18:00, as of Sep 30 18:00 = 24 hours.
  silentNormal: () => rows(load({ water: water([["2026-09-29T18:00", 80]]) })).join(" / "),
  // Spring forward (US 2027-03-14 02:00 -> 03:00). Tank refilled to 80 at Mar 13 18:00 and lost 32 points by
  // Mar 14 18:00 (80 -> 48). That's a leak by the README rule (30+ points in 24 hours) whatever zone the ranch is in.
  springLeak: () => rows(load({ meta: "as_of\n2027-03-14T18:00", water: water([["2027-03-13T12:00", 60], ["2027-03-13T18:00", 80],
    ["2027-03-14T00:00", 70], ["2027-03-14T06:00", 60], ["2027-03-14T12:00", 55], ["2027-03-14T18:00", 48]]) })).join(" / ") || "(no alert)",
  // Fall back (US 2026-11-01 02:00 -> 01:00). Last reading Oct 31 19:00, as of Nov 1 18:00: 23 wall-clock hours.
  fallSilent: () => (rows(load({ meta: "as_of\n2026-11-01T18:00", water: water([["2026-10-31T19:00", 80]]) })).join(" / ") || "(no alert)"),
  // as_of written as a date only. Last reading Sep 29 06:00.
  asofDateOnly: () => { const d = load({ meta: "as_of\n2026-09-30", water: water([["2026-09-29T06:00", 80]]) });
    return `silentHours=${waterStatus(d.water, d.meta[0].as_of)[0].silentHours}; ${rows(d).join(" / ") || "(no alert)"}`; },
  // Telemetry exported in UTC ("Z"); as_of in local wall-clock time as the generator writes it.
  utcStamp: () => { const d = load({ water: water([["2026-09-29T20:00Z", 80]]) });
    return `silentHours=${waterStatus(d.water, d.meta[0].as_of)[0].silentHours}; ${rows(d).join(" / ") || "(no alert)"}`; },
  // Excel-style US dates (M/D/YYYY). Moved in Sep 8, as of Sep 30 = 22 days on a 21-day plan = 1 day over.
  mdyMove: () => rows(load({ moves: H.moves + "\nCows,P1,9/8/2026," })).join(" / "),
  // Booster due 9/30/2026, as of Sep 30 = due today (0 days): a warning, the same for every viewer.
  mdyDue: () => rows(load({ health: H.health + "\nYearlings,Booster vaccine,,9/30/2026,open" })).join(" / "),
};

if (process.argv[2] === "--probe") {
  try { console.log(JSON.stringify(PROBES[process.argv[3]]())); } catch (e) { console.log(JSON.stringify("ERROR " + e.message)); }
  process.exit(0);
}

function inZones(name) {
  return Object.fromEntries(TZS.map((tz) => {
    const r = spawnSync(process.execPath, [SELF, "--probe", name], { env: { ...process.env, TZ: tz }, encoding: "utf8" });
    let v; try { v = JSON.parse(r.stdout.trim()); } catch { v = `ERROR exit ${r.status}: ${r.stderr.trim().split("\n").pop()}`; }
    return [tz, v];
  }));
}
const perZone = (m) => TZS.map((tz) => `\n      ${tz.padEnd(17)} ${m[tz]}`).join("");
const allEqual = (m, want) => TZS.every((tz) => (want === undefined ? m[tz] === m[TZS[0]] : m[tz] === want));

// ------------------------------------------------------------------ cases
// [id, title, expected text, fn -> { actual: string, ok: boolean }]
const CASES = [
  // ---------------- controls: these behave correctly
  ["TIME-C1", "committed data gives identical rule output in all four zones",
    "the same 10 rows and the same hash in UTC, Chicago, Denver and Auckland",
    () => { const m = inZones("committed"); return { actual: perZone(m), ok: allEqual(m) && /^10 rows/.test(m.UTC) }; }],
  ["TIME-C2", "grazing day count across the US DST end (in Oct 30, as of Nov 2 18:00, 2-day plan)",
    "serious: Cows in North Flat: Day 3 of a 2-day plan (1 day over), whole numbers, in every zone",
    () => { const m = inZones("grazingNov"); return { actual: perZone(m), ok: allEqual(m, "serious: Cows in North Flat: Day 3 of a 2-day plan (1 day over)") }; }],
  ["TIME-C3", "grazing and health day counts across the US DST start (March 2027)",
    "Day 3 of a 2-day plan (1 day over) and Overdue by 3 days (due 2027-03-12), in every zone",
    () => { const m = inZones("grazingHealthMar"); return { actual: perZone(m),
      ok: allEqual(m, "serious: Cows in North Flat: Day 3 of a 2-day plan (1 day over) / serious: Cows: Booster: Overdue by 3 days (due 2027-03-12)") }; }],
  ["TIME-C4", "health days-left across the US DST end (due Nov 5, as of Nov 2)",
    "warning: Cows: Pinkeye check: Due in 3 days (2026-11-05), in every zone",
    () => { const m = inZones("healthNov"); return { actual: perZone(m), ok: allEqual(m, "warning: Cows: Pinkeye check: Due in 3 days (2026-11-05)") }; }],
  ["TIME-C5", "daily gain across a DST change (Oct 1 -> Nov 15 = 45 days, +90 lbs)",
    "2.0000 lbs/day in every zone (90 / 45)",
    () => { const m = inZones("gainDst"); return { actual: perZone(m), ok: allEqual(m, "2.0000") }; }],
  ["TIME-C6", "silent-sensor hours on an ordinary day (last Sep 29 18:00, as of Sep 30 18:00)",
    "serious ... No reading for 24 hours, in every zone",
    () => { const m = inZones("silentNormal"); return { actual: perZone(m), ok: allEqual(m, "serious: Tank T1 (North Flat): No reading for 24 hours; last level 80%") }; }],

  // ---------------- defects
  ["TIME-01", "spring-forward day: a 32-point overnight drop (80 -> 48) is a leak alert only for some viewers",
    "critical: Tank T1 (North Flat): Dropped 32 points in 24 hours, now 48%, for every viewer",
    () => { const m = inZones("springLeak"); return { actual: perZone(m), ok: allEqual(m, "critical: Tank T1 (North Flat): Dropped 32 points in 24 hours, now 48%") }; }],
  ["TIME-02", "fall-back day: whether a sensor is 'silent 24 hours' depends on the viewer's computer zone",
    "the same answer for every viewer (23 wall-clock hours in the data; one result, not two)",
    () => { const m = inZones("fallSilent"); return { actual: perZone(m), ok: allEqual(m) }; }],
  ["TIME-03", "as_of written as a date only (2026-09-30): silent hours shift by the viewer's UTC offset",
    "one silentHours value for every viewer (the same CSV must give the same report)",
    () => { const m = inZones("asofDateOnly"); return { actual: perZone(m), ok: allEqual(m) }; }],
  ["TIME-04", "water times exported in UTC (…Z) against a local as_of: silent hours shift by the viewer's offset",
    "one silentHours value for every viewer; never negative",
    () => { const m = inZones("utcStamp"); return { actual: perZone(m), ok: allEqual(m) && !/silentHours=-/.test(Object.values(m).join()) }; }],
  ["TIME-05", "Excel-style move date 9/8/2026 (accepted by new Date) gives fractional, zone-dependent day counts",
    "serious: Cows in North Flat: Day 22 of a 21-day plan (1 day over), in every zone (Sep 8 -> Sep 30 = 22 days)",
    () => { const m = inZones("mdyMove"); return { actual: perZone(m), ok: allEqual(m, "serious: Cows in North Flat: Day 22 of a 21-day plan (1 day over)") }; }],
  ["TIME-06", "Excel-style due date 9/30/2026: severity flips between warning and serious by viewer zone",
    "warning: Yearlings: Booster vaccine: Due in 0 days (9/30/2026) (or 'due today'), the same for every viewer",
    () => { const m = inZones("mdyDue"); return { actual: perZone(m), ok: allEqual(m, "warning: Yearlings: Booster vaccine: Due in 0 days (9/30/2026)") }; }],
  ["TIME-07", "day-first due date 15/09/2026 is unparseable (NaN): the overdue booster silently disappears",
    "serious overdue row (Sep 15 -> Sep 30 = 15 days), or a visible 'bad date in health.csv' row; never nothing",
    () => { const r = rows(load({ health: H.health + "\nYearlings,Booster vaccine,2026-06-02,15/09/2026,open" }));
      return { actual: r.join(" / ") || "(no alert)", ok: r.length > 0 }; }],
  ["TIME-08", "day-first move date 06/09/2026 (6 September) is read as June 9: false 'months over plan'",
    "Day 24 of a 21-day plan (3 days over) (Sep 6 -> Sep 30), or the date rejected as ambiguous",
    () => { const r = rows(load({ moves: H.moves + "\nYearlings,P3,06/09/2026," }));
      return { actual: r.join(" / "), ok: r.length === 1 && /Day 24 of a 21-day plan \(3 days over\)/.test(r[0]) }; }],
  ["TIME-09", "unparseable water timestamp: the tank is neither judged nor reported silent",
    "a Water row for T1 (silent / bad timestamp); never nothing",
    () => { const d = load({ water: water([["29/09/2026 06:00", 80]]) });
      return { actual: `silentHours=${waterStatus(d.water, d.meta[0].as_of)[0].silentHours}; ${rows(d).join(" / ") || "(no alert)"}`, ok: rows(d).length > 0 }; }],
  ["TIME-10", "M/D/YYYY water timestamps are sorted as text: a September reading is taken as the latest",
    "critical: Down to 20% full (latest reading is 10/1/2026 06:00 at 20%)",
    () => { const d = load({ meta: "as_of\n10/1/2026 06:00", water: water([["9/30/2026 12:00", 50], ["9/30/2026 18:00", 45], ["10/1/2026 06:00", 20]]) });
      const t = waterStatus(d.water, d.meta[0].as_of)[0];
      return { actual: `lastTime=${t.lastTime} level=${t.level}; ${rows(d).join(" / ") || "(no alert)"}`, ok: rows(d).some((r) => /20% full/.test(r)) }; }],
  ["TIME-11", "a water reading dated after as_of hides a silent sensor (committed data + one T6 row at Oct 1 00:00)",
    "the as-of Sep 30 18:00 report still says T6: No reading for 42 hours (Sep 29 00:00 -> Sep 30 18:00), or rejects the future row",
    () => { const d = loadRepo({ water: REPO("water").trimEnd() + "\nT6,P6,2026-10-01T00:00,97.0" });
      const t = waterStatus(d.water, d.meta[0].as_of).find((x) => x.tank === "T6");
      const r = rows(d, "Water").filter((s) => /T6/.test(s));
      return { actual: `T6 silentHours=${t.silentHours}; ${r.join(" / ") || "(no T6 alert)"}`, ok: r.some((s) => /No reading for 42 hours/.test(s)) }; }],
  ["TIME-12", "weigh-ins dated after as_of are used (committed data + all 45 heifers weighed Oct 20 at 1200 lbs)",
    "as-of Sep 30 report unchanged: serious: Heifers: 0.44 lbs/day since 2026-07-20 vs 1.0 target",
    () => { const extra = Array.from({ length: 45 }, (_, i) => `H${String(i + 1).padStart(3, "0")},Heifers,2026-10-20,1200`).join("\n");
      const r = rows(loadRepo({ weights: REPO("weights").trimEnd() + "\n" + extra }), "Gain");
      return { actual: r.join(" / "), ok: r.includes("serious: Heifers: 0.44 lbs/day since 2026-07-20 vs 1.0 target") }; }],
  ["TIME-13", "a planned move written into moves.csv (Yearlings out of Sand Hills Oct 2, into North Flat Oct 2)",
    "serious: Yearlings in Sand Hills: Day 24 of a 21-day plan (3 days over) (they are still there on Sep 30)",
    () => { const mv = REPO("moves").replace("Yearlings,P3,2026-09-06,", "Yearlings,P3,2026-09-06,2026-10-02").trimEnd() + "\nYearlings,P1,2026-10-02,";
      const d = loadRepo({ moves: mv });
      const cur = grazingStatus(d.moves, d.pastures, d.meta[0].as_of).find((g) => g.group === "Yearlings");
      return { actual: `current=${cur.pasture} day ${cur.days}; grazing rows: ${rows(d, "Grazing").join(" / ") || "(none)"}`,
        ok: rows(d, "Grazing").some((s) => /Yearlings in Sand Hills: Day 24/.test(s)) }; }],
  ["TIME-14", "budget.csv holding the whole season plan (Oct and Nov budget, actual 0) hides overspend 'season to date'",
    "Fuel 21% over ($2,040) and Repairs 25% over ($1,800) still serious: Jun-Sep Fuel 11,640 vs 9,600; Repairs 9,000 vs 7,200",
    () => { const fut = ["2026-10", "2026-11"].flatMap((m) => ["Feed and mineral,6200", "Fuel,2400", "Repairs,1800", "Vet and health,1500", "Labor,9000", "Water and fencing,1200"].map((x) => `${m},${x},0`)).join("\n");
      const d = loadRepo({ budget: REPO("budget").trimEnd() + "\n" + fut });
      const r = rows(d, "Budget"), f = budgetStatus(d.budget).find((b) => b.category === "Fuel");
      return { actual: `${r.join(" / ") || "(no budget alerts)"}; Fuel budget=${f.budget} actual=${f.actual} pct=${(f.pct * 100).toFixed(1)}%`,
        ok: r.some((s) => /Fuel: 21% over/.test(s)) && r.some((s) => /Repairs: 25% over/.test(s)) }; }],
  ["TIME-15", "October plan rows with actual left blank (not yet spent): totals turn into text and alerts vanish",
    "Fuel and Repairs still serious (October has no actuals yet, so it is not 'to date'); actual stays a number",
    () => { const fut = ["Feed and mineral,6200", "Fuel,2400", "Repairs,1800", "Vet and health,1500", "Labor,9000", "Water and fencing,1200"].map((x) => `2026-10,${x},`).join("\n");
      const d = loadRepo({ budget: REPO("budget").trimEnd() + "\n" + fut });
      const r = rows(d, "Budget"), f = budgetStatus(d.budget).find((b) => b.category === "Fuel");
      return { actual: `${r.join(" / ") || "(no budget alerts)"}; Fuel actual=${JSON.stringify(f.actual)} (${typeof f.actual}) budget=${f.budget}`,
        ok: r.length === 2 && typeof f.actual === "number" }; }],
  ["TIME-16", "'Dropped N points in 24 hours' after a 4-day gap in readings (80 on Sep 26 18:00, 48 now)",
    "no '24 hours' leak claim (48% is above the 40% line; the only 24-hour-old reading is missing)",
    () => { const r = rows(load({ water: water([["2026-09-26T18:00", 80], ["2026-09-30T12:00", 50], ["2026-09-30T18:00", 48]]) }));
      return { actual: r.join(" / ") || "(no alert)", ok: !r.some((s) => /in 24 hours/.test(s)) }; }],
  ["TIME-17", "group gain mixes weigh-in periods: one heifer missed the Sep 15 weigh-in",
    "serious: Heifers: 0.40 lbs/day since 2026-07-20 vs 1.0 target (only H001 was weighed Jul 20 and Sep 15: 23 lbs / 57 days)",
    () => { const w = H.weights + "\nH002,Heifers,2026-06-01,1000\nH002,Heifers,2026-07-20,1078\nH001,Heifers,2026-06-01,1050\nH001,Heifers,2026-07-20,1100\nH001,Heifers,2026-09-15,1123";
      const d = load({ groups: H.groups + "\nHeifers,first-calf heifers,2,1.0", weights: w });
      const g = gainStatus(d.weights, d.groups)[0];
      return { actual: `group adg=${g.adg.toFixed(3)} from=${g.from} to=${g.to}; ${rows(d).join(" / ") || "(no alert)"}`,
        ok: rows(d).some((s) => /serious: Heifers: 0\.40 lbs\/day since 2026-07-20/.test(s)) }; }],
  ["TIME-19", "as_of in day-first form (30/09/2026 18:00, committed data otherwise): silent-sensor, grazing and health rules all go quiet",
    "the same 10 rows as the committed data (2 critical, 6 serious, 2 warning), or one visible 'bad as_of' error",
    () => { const r = rows(loadRepo({ meta: "as_of\n30/09/2026 18:00" }));
      const by = (a) => r.filter((s) => s.startsWith(a)).length;
      return { actual: `${r.length} rows (critical ${by("critical")}, serious ${by("serious")}, warning ${by("warning")}); missing: ${["T6", "Yearlings in Sand Hills", "Booster", "Pinkeye"].filter((k) => !r.some((s) => s.includes(k))).join(", ") || "none"}`,
        ok: r.length === 10 }; }],
  ["TIME-18", "the due day itself reads 'Due in 0 days' / 'Planned move in 0 days'",
    "'Due today' and 'Move planned today' (day 21 of a 21-day plan, booster due Sep 30)",
    () => { const r = rows(load({ moves: H.moves + "\nCows,P1,2026-09-09,", health: H.health + "\nCows,Booster,,2026-09-30,open" }));
      return { actual: r.join(" / "), ok: r.every((s) => !/ in 0 days/.test(s)) }; }],

  // ---------------- design limitation
  ["TIME-D1", "mid-month as_of: a full month's budget is compared with half a month of spending",
    "as of Sep 15 with Fuel Sep actual 1,500 for half the month: Jun-Aug 8,640 + 1,500 = 10,140 vs 7,200 + 1,200 (half of Sep) = 8,400 -> 20.7% over, serious",
    () => { const b = REPO("budget").replace("2026-09,Fuel,2400,3000", "2026-09,Fuel,2400,1500");
      const d = loadRepo({ meta: "as_of\n2026-09-15T18:00", budget: b });
      const r = rows(d, "Budget").filter((s) => /Fuel/.test(s));
      return { actual: r.join(" / ") || "(no Fuel alert)", ok: r.some((s) => /serious: Fuel: 21% over/.test(s)) }; }],
];

let mismatches = 0;
for (const [id, title, expected, fn] of CASES) {
  console.log(`CASE ${id}  ${title}`);
  console.log(`  expected: ${expected}`);
  try {
    const { actual, ok } = fn();
    console.log(`  actual:   ${actual}`);
    console.log(`  ${ok ? "MATCH" : "MISMATCH"}`);
    if (!ok) mismatches++;
  } catch (e) {
    console.log(`  actual:   ERROR ${e && e.message}`);
    console.log("  MISMATCH");
    mismatches++;
  }
  console.log("");
}
console.log(`${CASES.length} cases, ${mismatches} mismatches (run in TZ=${process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone})`);
