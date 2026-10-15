// CSV and input-integrity reproductions for the ranch operations dashboard.
// Run from the repo root:  node docs/audit/diagnostics/csv.repro.mjs
//
// Every case feeds a tiny inline CSV (or the committed data with one change) through the REAL parseCSV and
// findExceptions/gainStatus from exceptions.js, then prints:
//   CASE <id>  <title>
//     expected: <what a correct loader/rule would do, worked out by hand in the comment beside the case>
//     actual:   <what the code produced, or the error it threw>
//     MATCH | MISMATCH
// MISMATCH means the defect is present. Cases named OK-* are controls that should MATCH.
// The script never throws: each case runs in its own try/catch. It modifies no files.

import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, findExceptions, gainStatus } = await import(new URL("exceptions.js", ROOT).href);

// ------------------------------------------------------------------ fixtures
// A minimal, valid, alert-free dataset. Each case overrides only the file(s) it is about.
const H = {
  meta: "as_of\n2026-09-30T18:00",
  pastures: "pasture_id,name,acres,planned_graze_days,min_rest_days\nP1,North Flat,640,21,45\nP3,Sand Hills,720,21,60\nP4,Lone Tree,480,14,45\nP7,South Divide,700,21,60",
  groups: "group,class,head,target_adg_lbs",
  moves: "group,pasture_id,in_date,out_date",
  weights: "tag,group,date,weight_lbs",
  water: "tank_id,pasture_id,time,level_pct",
  health: "group,task,last_done,next_due,status",
  budget: "month,category,budget,actual",
};
const load = (over = {}) => Object.fromEntries(Object.keys(H).map((k) => [k, parseCSV(over[k] ?? H[k])]));
const run = (over) => findExceptions(load(over));
const FILES = Object.keys(H);
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));
const runReal = (mods = {}) => findExceptions(Object.fromEntries(FILES.map((f) => [f, parseCSV(mods[f] ? mods[f](RAW[f]) : RAW[f])])));

const fmt = (alerts) => (alerts.length ? alerts.map((e) => `${e.severity}|${e.subject}|${e.problem}`).join(" || ") : "(no alerts)");
// Order-insensitive comparison, for controls whose only difference could be the order of ties (same severity and area).
const same = (a, b) => JSON.stringify(a.map((e) => `${e.severity}|${e.subject}|${e.problem}`).sort()) === JSON.stringify(b.map((e) => `${e.severity}|${e.subject}|${e.problem}`).sort());
const area = (a, name) => a.filter((e) => e.area === name);
const has = (a, sev, subj, prob) => a.some((e) => e.severity === sev && e.subject === subj && (prob === undefined || e.problem === prob));

// Shared weigh-in fixtures. Jul 20 -> Sep 15 is 11 + 31 + 15 = 57 days (counted by hand).
// 700 -> 820 lbs = 120 / 57 = 2.105 lbs/day; 700 -> 720 = 20 / 57 = 0.351; 1000 -> 1040 = 40 / 57 = 0.702.
const YGROUP = "group,class,head,target_adg_lbs\nYearlings,steers,4,2.0";
const wt = (rows) => "tag,group,date,weight_lbs\n" + rows.map((r) => r.join(",")).join("\n");
const pair = (tag, group, w0, w1) => [[tag, group, "2026-07-20", w0], [tag, group, "2026-09-15", w1]];

// ------------------------------------------------------------------ cases
// Each case: [id, title, expected text, () => actual value, (actual) => boolean "is correct"]
// actual() returns { alerts } or { value }; a thrown error is caught and passed as { error }.
const CASES = [
  // ---------------- quoting and delimiters
  ["CSV-01", "health task containing a quoted comma",
    "serious | Yearlings: Booster vaccine, 2nd round | Overdue by 15 days (due 2026-09-15)   [Sep 15 -> Sep 30 = 15 days]",
    () => ({ alerts: run({ health: H.health + '\nYearlings,"Booster vaccine, 2nd round",2026-06-02,2026-09-15,open' }) }),
    (r) => r.alerts && has(r.alerts, "serious", "Yearlings: Booster vaccine, 2nd round", "Overdue by 15 days (due 2026-09-15)")],

  ["CSV-02", "pasture name containing a quoted comma",
    "serious | Yearlings in Sand Hills, east | Day 24 of a 21-day plan (3 days over)   [Sep 6 -> Sep 30 = 24; 24 - 21 = 3]",
    () => ({ alerts: run({ pastures: 'pasture_id,name,acres,planned_graze_days,min_rest_days\nP3,"Sand Hills, east",720,21,60', moves: H.moves + "\nYearlings,P3,2026-09-06," }) }),
    (r) => r.alerts && has(r.alerts, "serious", "Yearlings in Sand Hills, east", "Day 24 of a 21-day plan (3 days over)")],

  ["CSV-03", "budget category containing a quoted comma",
    "serious | Fuel, diesel | 25% over season to date ($600)   [3000 - 2400 = 600; 600 / 2400 = 25%]",
    () => ({ alerts: run({ budget: H.budget + '\n2026-09,"Fuel, diesel",2400,3000' }) }),
    (r) => r.alerts && has(r.alerts, "serious", "Fuel, diesel", "25% over season to date ($600)")],

  ["CSV-04", "money-formatted actual as a spreadsheet exports it: \"$3,000\"",
    "serious | Fuel | 25% over season to date ($600), or a load error naming the row; never silence",
    () => ({ alerts: run({ budget: H.budget + '\n2026-09,Fuel,2400,"$3,000"' }) }),
    (r) => (r.alerts && has(r.alerts, "serious", "Fuel", "25% over season to date ($600)")) || !!r.error],

  ["CSV-05", "escaped quotes (\"\") inside a quoted field",
    'subject text: Cows: Check "bad eye" calves',
    () => ({ alerts: run({ health: H.health + '\nCows,"Check ""bad eye"" calves",2026-08-01,2026-10-03,open' }) }),
    (r) => r.alerts && r.alerts.some((e) => e.subject === 'Cows: Check "bad eye" calves')],

  ["CSV-06", "fully quoted export (every field in quotes) of health.csv",
    "serious | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15)",
    () => ({ alerts: run({ health: '"group","task","last_done","next_due","status"\n"Yearlings","Booster vaccine","2026-06-02","2026-09-15","open"' }) }),
    (r) => r.alerts && has(r.alerts, "serious", "Yearlings: Booster vaccine", "Overdue by 15 days (due 2026-09-15)")],

  ["CSV-07", "fully quoted export of water.csv",
    "critical | Tank T2 (North Flat) | Down to 11.8% full; no crash",
    () => ({ alerts: run({ water: '"tank_id","pasture_id","time","level_pct"\n"T2","P1","2026-09-30T12:00","14.8"\n"T2","P1","2026-09-30T18:00","11.8"' }) }),
    (r) => r.alerts && has(r.alerts, "critical", "Tank T2 (North Flat)", "Down to 11.8% full")],

  ["CSV-08", "old-Mac CR-only line endings",
    "critical | Tank T2 (North Flat) | Down to 11.8% full",
    () => ({ alerts: run({ water: "tank_id,pasture_id,time,level_pct\rT2,P1,2026-09-30T12:00,14.8\rT2,P1,2026-09-30T18:00,11.8" }) }),
    (r) => r.alerts && has(r.alerts, "critical", "Tank T2 (North Flat)", "Down to 11.8% full")],

  // ---------------- whitespace
  ["CSV-09", "trailing space in a header name (level_pct )",
    "critical | Tank T2 (North Flat) | Down to 11.8% full, or a load error naming the column",
    () => ({ alerts: run({ water: "tank_id,pasture_id,time,level_pct \nT2,P1,2026-09-30T12:00,14.8\nT2,P1,2026-09-30T18:00,11.8" }) }),
    (r) => (r.alerts && has(r.alerts, "critical", "Tank T2 (North Flat)", "Down to 11.8% full")) || !!r.error],

  ["CSV-10", "trailing space in a pasture_id in moves.csv (\"P3 \")",
    "serious | Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over); no crash",
    () => ({ alerts: run({ moves: H.moves + "\nYearlings,P3 ,2026-09-06," }) }),
    (r) => r.alerts && has(r.alerts, "serious", "Yearlings in Sand Hills", "Day 24 of a 21-day plan (3 days over)")],

  ["CSV-11", "leading space after the comma in water.csv (\"T4, P4,...\")",
    "critical | Tank T4 (Lone Tree) | Down to 10% full",
    () => ({ alerts: run({ water: H.water + "\nT4, P4,2026-09-30T12:00,14\nT4, P4,2026-09-30T18:00,10" }) }),
    (r) => r.alerts && has(r.alerts, "critical", "Tank T4 (Lone Tree)", "Down to 10% full")],

  ["CSV-12", "whitespace-only line in the middle of water.csv",
    "(no alerts): the blank line is ignored",
    () => ({ alerts: run({ water: H.water + "\nT1,P1,2026-09-30T12:00,80\n   \nT1,P1,2026-09-30T18:00,80" }) }),
    (r) => r.alerts && r.alerts.length === 0],

  // ---------------- malformed rows
  ["CSV-13", "row with too few fields (level missing) as the latest reading",
    "no 'Dropped'/'Down to' alert computed from a missing level; a malformed-row error or a judgement on the last valid reading",
    () => ({ alerts: run({ water: H.water + "\nT1,P1,2026-09-29T18:00,80\nT1,P1,2026-09-30T18:00" }) }),
    (r) => !!r.error || (r.alerts && !r.alerts.some((e) => /now %|Down to % full/.test(e.problem)))],

  ["CSV-14", "Excel blank row (,,,) at the end of water.csv",
    "(no alerts): an all-empty row is ignored",
    () => ({ alerts: run({ water: H.water + "\nT1,P1,2026-09-30T18:00,80\n,,," }) }),
    (r) => r.alerts && r.alerts.length === 0],

  ["CSV-15", "Excel blank row (,,,) at the end of moves.csv",
    "no crash; (no alerts)",
    () => ({ alerts: run({ moves: H.moves + "\nCows,P1,2026-09-20,\n,,," }) }),
    (r) => r.alerts && r.alerts.length === 0],

  ["CSV-16", "Excel blank row (,,,) at the end of weights.csv",
    "no crash; (no alerts)  [Y1-Y2 gain 2.105 vs target 2.0]",
    () => ({ alerts: run({ groups: YGROUP, weights: wt([...pair("Y1", "Yearlings", 700, 820), ...pair("Y2", "Yearlings", 700, 820)]) + "\n,,," }) }),
    (r) => r.alerts && r.alerts.length === 0],

  ["CSV-17", "animal with only one weigh-in (bought mid-season)",
    "no crash; (no alerts) for Y1-Y2 at 2.105 lbs/day; Y3 skipped or noted as 'one weigh-in'",
    () => ({ alerts: run({ groups: YGROUP, weights: wt([...pair("Y1", "Yearlings", 700, 820), ...pair("Y2", "Yearlings", 700, 820), ["Y3", "Yearlings", "2026-09-15", 700]]) }) }),
    (r) => r.alerts && !r.alerts.some((e) => e.area === "Gain" && /lbs\/day/.test(e.problem) && !/Y3/.test(e.problem))],

  // ---------------- IDs coerced to numbers
  ["CSV-18", "tags 007 and 7 are two different animals",
    "head 2, tags ['007','7'] kept as text",
    () => ({ value: gainStatus(parseCSV(wt([...pair("007", "Yearlings", 700, 814), ...pair("7", "Yearlings", 650, 670)])), parseCSV(YGROUP)).map((g) => `head ${g.head}, tags ${JSON.stringify(g.animals.map((a) => a.tag))}, adg ${g.animals.map((a) => a.adg)}`).join("") }),
    (r) => r.value === `head 2, tags ["007","7"], adg 2,0.3508771929824561` || /head 2, tags \["007","7"\]/.test(r.value)],

  ["CSV-19", "tags 1e3 and 1000 are two different animals",
    "head 2, tags ['1e3','1000']",
    () => ({ value: gainStatus(parseCSV(wt([...pair("1e3", "Yearlings", 700, 814), ...pair("1000", "Yearlings", 650, 670)])), parseCSV(YGROUP)).map((g) => `head ${g.head}, tags ${JSON.stringify(g.animals.map((a) => a.tag))}, adg ${g.animals.map((a) => a.adg)}`).join("") }),
    (r) => /head 2, tags \["1e3","1000"\]/.test(r.value)],

  ["CSV-20", "slow animal with ear tag 0x10 named in the pull list",
    "warning | 1 yearlings | Under 1.0 lbs/day: 0x10   [0x10 = 0.351; group avg (0.351 + 3 x 2.105) / 4 = 1.667 >= 1.6, so no group alert]",
    () => ({ alerts: run({ groups: YGROUP, weights: wt([...pair("0x10", "Yearlings", 700, 720), ...pair("Y2", "Yearlings", 700, 820), ...pair("Y3", "Yearlings", 700, 820), ...pair("Y4", "Yearlings", 700, 820)]) }) }),
    (r) => r.alerts && has(r.alerts, "warning", "1 yearlings", "Under 1.0 lbs/day: 0x10")],

  ["CSV-21", "pasture ids 01 and 1 are different pastures",
    "serious | Cows in North | Day 29 of a 10-day plan (19 days over)   [Sep 1 -> Sep 30 = 29; 29 - 10 = 19]",
    () => ({ alerts: run({ pastures: "pasture_id,name,acres,planned_graze_days,min_rest_days\n01,North,100,10,30\n1,South,100,30,30", moves: H.moves + "\nCows,01,2026-09-01," }) }),
    (r) => r.alerts && has(r.alerts, "serious", "Cows in North", "Day 29 of a 10-day plan (19 days over)")],

  ["CSV-22", "group named by calf-crop year (2025)",
    "no crash; warning | 1 2025 | Under 1.0 lbs/day: Y1",
    () => ({ alerts: run({ groups: "group,class,head,target_adg_lbs\n2025,steers,4,2.0", weights: wt([...pair("Y1", "2025", 700, 720), ...pair("Y2", "2025", 700, 820), ...pair("Y3", "2025", 700, 820), ...pair("Y4", "2025", 700, 820)]) }) }),
    (r) => r.alerts && has(r.alerts, "warning", "1 2025", "Under 1.0 lbs/day: Y1")],

  ["CSV-23", "water time exported as epoch seconds (numeric)",
    "no crash; critical | Tank T2 (North Flat) | Down to 11.8% full, or a load error naming the column",
    () => ({ alerts: run({ water: H.water + "\nT2,P1,1790769600,14.8\nT2,P1,1790791200,11.8" }) }),
    (r) => (r.alerts && has(r.alerts, "critical", "Tank T2 (North Flat)", "Down to 11.8% full")) || (!!r.error && /time/i.test(r.error) && !/localeCompare/.test(r.error))],

  // ---------------- missing columns and unknown references
  ["CSV-24", "water.csv column named 'level' instead of 'level_pct'",
    "a load error naming the missing column (the T2 reading is 11.8%, which must not pass as OK)",
    () => ({ alerts: run({ water: "tank_id,pasture_id,time,level\nT2,P1,2026-09-30T12:00,14.8\nT2,P1,2026-09-30T18:00,11.8" }) }),
    (r) => !!r.error && /level_pct/.test(r.error)],

  ["CSV-25", "health.csv without a status column",
    "a load error naming the missing column (the booster is 15 days overdue)",
    () => ({ alerts: run({ health: "group,task,last_done,next_due\nYearlings,Booster vaccine,2026-06-02,2026-09-15" }) }),
    (r) => !!r.error && /status/.test(r.error)],

  ["CSV-26", "move into a pasture_id that is not in pastures.csv (P9)",
    "no crash; an alert or load error naming P9",
    () => ({ alerts: run({ moves: H.moves + "\nCows,P9,2026-09-12," }) }),
    (r) => (r.alerts && r.alerts.some((e) => /P9/.test(e.subject + e.problem))) || (!!r.error && /P9/.test(r.error))],

  ["CSV-27", "tank in a pasture_id that is not in pastures.csv (P9)",
    "critical alert whose subject names P9, not 'undefined'",
    () => ({ alerts: run({ water: H.water + "\nT9,P9,2026-09-30T12:00,14.8\nT9,P9,2026-09-30T18:00,11.8" }) }),
    (r) => r.alerts && r.alerts.some((e) => e.severity === "critical" && /P9/.test(e.subject) && !/undefined/.test(e.subject))],

  ["CSV-28", "weigh-ins under a group name not in groups.csv ('Heifer' for 'Heifers')",
    "serious | Heifers | 0.70 lbs/day since 2026-07-20 vs 1.0 target, or a load error naming 'Heifer'   [1000 -> 1040 / 57 = 0.702 < 0.8]",
    () => ({ alerts: run({ groups: "group,class,head,target_adg_lbs\nHeifers,first-calf heifers,3,1.0", weights: wt([...pair("H1", "Heifer", 1000, 1040), ...pair("H2", "Heifer", 1000, 1040), ...pair("H3", "Heifer", 1000, 1040)]) }) }),
    (r) => (r.alerts && r.alerts.some((e) => e.area === "Gain")) || (!!r.error && /Heifer/.test(r.error))],

  ["CSV-29", "water.csv with a header and no rows (gateway export empty)",
    "at least one Water alert (no readings at all); design limitation: there is no tank list to compare against",
    () => ({ alerts: run({ water: H.water }) }),
    (r) => r.alerts && r.alerts.some((e) => e.area === "Water")],

  ["CSV-30", "one tank (T6) missing from the export entirely, committed data",
    "serious | Tank T6 (Cedar Draw) | No reading ... (it is in the committed data with 42 silent hours)",
    () => ({ alerts: area(runReal({ water: (t) => t.split("\n").filter((l) => !l.startsWith("T6,")).join("\n") }), "Water") }),
    (r) => r.alerts && r.alerts.some((e) => e.subject.startsWith("Tank T6"))],

  ["CSV-31", "meta.csv with a header and no value",
    "a load error naming as_of (not a TypeError)",
    () => ({ alerts: run({ meta: "as_of\n" }) }),
    (r) => !!r.error && /as_of/.test(r.error) && !/Cannot read/.test(r.error)],

  // ---------------- duplicates
  ["CSV-32", "one animal's final weigh-in recorded twice (EID double read), same weight",
    "serious | Heifers | 0.70 lbs/day since 2026-07-20 vs 1.0 target   [each heifer 40 / 57 = 0.702; avg 0.702 < 0.8]",
    () => ({ alerts: run({ groups: "group,class,head,target_adg_lbs\nHeifers,first-calf heifers,3,1.0", weights: wt([...pair("H1", "Heifers", 1000, 1040), ["H1", "Heifers", "2026-09-15", 1040], ...pair("H2", "Heifers", 1000, 1040), ...pair("H3", "Heifers", 1000, 1040)]) }) }),
    (r) => r.alerts && has(r.alerts, "serious", "Heifers", "0.70 lbs/day since 2026-07-20 vs 1.0 target")],

  ["CSV-33", "September budget row appended twice (re-export)",
    "(no alerts): true totals 9,600 budget vs 10,000 actual = 4.2% over, under the 5% warning; or a duplicate-row error",
    () => ({ alerts: run({ budget: H.budget + "\n2026-06,Fuel,2400,2400\n2026-07,Fuel,2400,2400\n2026-08,Fuel,2400,2400\n2026-09,Fuel,2400,2800\n2026-09,Fuel,2400,2800" }) }),
    (r) => (r.alerts && r.alerts.length === 0) || !!r.error],

  ["CSV-34", "pasture P3 listed twice with different planned days (21, then 30)",
    "a duplicate-id error, or the first definition kept: serious | Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over)",
    () => ({ alerts: run({ pastures: H.pastures + "\nP3,Sand Hills,720,30,60", moves: H.moves + "\nYearlings,P3,2026-09-06," }) }),
    (r) => !!r.error || (r.alerts && has(r.alerts, "serious", "Yearlings in Sand Hills", "Day 24 of a 21-day plan (3 days over)"))],

  ["CSV-35", "health task row repeated",
    "exactly 1 alert for Yearlings: Booster vaccine",
    () => ({ alerts: run({ health: H.health + "\nYearlings,Booster vaccine,2026-06-02,2026-09-15,open\nYearlings,Booster vaccine,2026-06-02,2026-09-15,open" }) }),
    (r) => r.alerts && r.alerts.filter((e) => e.subject === "Yearlings: Booster vaccine").length === 1],

  ["CSV-36", "groups.csv row repeated",
    "exactly 1 Gain alert for Heifers",
    () => ({ alerts: run({ groups: "group,class,head,target_adg_lbs\nHeifers,first-calf heifers,3,1.0\nHeifers,first-calf heifers,3,1.0", weights: wt([...pair("H1", "Heifers", 1000, 1040), ...pair("H2", "Heifers", 1000, 1040), ...pair("H3", "Heifers", 1000, 1040)]) }) }),
    (r) => r.alerts && r.alerts.filter((e) => e.subject === "Heifers").length === 1],

  ["CSV-37", "earlier move left without an out_date (group shows open in two pastures)",
    "only serious | Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over), or an error that Yearlings has two open moves; NOT 'South Divide Day 36' [Aug 25 -> Sep 30 = 36]",
    () => ({ alerts: run({ moves: H.moves + "\nYearlings,P7,2026-08-25,\nYearlings,P3,2026-09-06," }) }),
    (r) => !!r.error || (r.alerts && !r.alerts.some((e) => e.subject === "Yearlings in South Divide"))],

  // ---------------- dates
  ["CSV-38", "health next_due with an impossible month (2026-13-15)",
    "a load error naming the date, or an alert; never silence",
    () => ({ alerts: run({ health: H.health + "\nYearlings,Booster vaccine,2026-06-02,2026-13-15,open" }) }),
    (r) => !!r.error || (r.alerts && r.alerts.length > 0)],

  ["CSV-39", "health next_due on a day that does not exist (2026-09-31)",
    "a load error naming the date (Chrome/V8 silently rolls it to Oct 1)",
    () => ({ alerts: run({ health: H.health + "\nCows,Pinkeye check,2026-08-01,2026-09-31,open" }) }),
    (r) => !!r.error],

  ["CSV-40", "water times exported as M/D/YYYY H:MM",
    "critical | Tank T1 (North Flat) | Down to 20% full   [last reading 9/30 18:00 at 20; 24 h earlier 30, drop 10 < 30]",
    () => ({ alerts: run({ water: H.water + "\nT1,P1,9/9/2026 18:00,80\nT1,P1,9/29/2026 18:00,30\nT1,P1,9/30/2026 18:00,20" }) }),
    (r) => r.alerts && has(r.alerts, "critical", "Tank T1 (North Flat)", "Down to 20% full")],

  ["CSV-40b", "committed water.csv re-saved by US-locale Excel (2026-09-30T18:00 -> 9/30/2026 18:00)",
    "the committed T2 (11.8%) and T4 (leak) critical alerts still present; T6 the only silent tank",
    () => ({ alerts: area(runReal({ water: (t) => t.replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/g, (_, y, m, d, hh, mm) => `${+m}/${+d}/${y} ${+hh}:${mm}`) }), "Water") }),
    (r) => r.alerts && r.alerts.some((e) => e.severity === "critical" && e.subject.startsWith("Tank T2")) && r.alerts.some((e) => e.severity === "critical" && e.subject.startsWith("Tank T4"))
      && r.alerts.filter((e) => /No reading/.test(e.problem)).length === 1],

  ["CSV-41", "health next_due in US format 9/15/2026, browser in America/Chicago",
    "serious | Yearlings: Booster vaccine | Overdue by 15 days (due 9/15/2026)",
    () => {
      const tz = process.env.TZ;
      process.env.TZ = "America/Chicago";
      try { return { alerts: run({ health: H.health + "\nYearlings,Booster vaccine,2026-06-02,9/15/2026,open" }) }; }
      finally { if (tz === undefined) delete process.env.TZ; else process.env.TZ = tz; }
    },
    (r) => r.alerts && has(r.alerts, "serious", "Yearlings: Booster vaccine", "Overdue by 15 days (due 9/15/2026)")],

  ["CSV-42", "as_of written day-first (30/09/2026 18:00)",
    "a load error naming as_of; (the booster due 2026-09-15 is overdue either way)",
    () => ({ alerts: run({ meta: "as_of\n30/09/2026 18:00", health: H.health + "\nYearlings,Booster vaccine,2026-06-02,2026-09-15,open" }) }),
    (r) => !!r.error || (r.alerts && r.alerts.some((e) => e.area === "Health"))],

  // ---------------- missing value vs zero, non-finite and impossible values
  ["CSV-43", "blank level_pct on the latest reading",
    "no 'Down to % full' alert from an empty cell; treat as a missing reading",
    () => ({ alerts: run({ water: H.water + "\nT1,P1,2026-09-30T12:00,80\nT1,P1,2026-09-30T18:00," }) }),
    (r) => !!r.error || (r.alerts && !r.alerts.some((e) => /Down to % full|now %/.test(e.problem)))],

  ["CSV-44", "current month's actual not entered yet (blank), committed data",
    "serious | Fuel | over budget on the months entered: Jun-Aug 8,640 vs 7,200 = 20% over; or a 'September actual missing' flag",
    () => ({ alerts: area(runReal({ budget: (t) => t.replace("2026-09,Fuel,2400,3000", "2026-09,Fuel,2400,") }), "Budget") }),
    (r) => !!r.error || (r.alerts && r.alerts.some((e) => e.subject === "Fuel"))],

  ["CSV-45", "earlier month's actual blank (July), committed data",
    "serious | Fuel | 21% over season to date ($1,512)   [Jun+Aug+Sep 2592+3120+3000 = 8712 vs 7200], or a missing-value flag; never a 10-digit %",
    () => ({ alerts: area(runReal({ budget: (t) => t.replace("2026-07,Fuel,2400,2928", "2026-07,Fuel,2400,") }), "Budget") }),
    (r) => !!r.error || (r.alerts && r.alerts.some((e) => e.subject === "Fuel" && /^\d{1,3}% over/.test(e.problem)))],

  ["CSV-46", "planned_graze_days blank for the pasture a group is in",
    "no 'Day 18 of a -day plan' alert; a missing-plan flag   [Sep 12 -> Sep 30 = 18]",
    () => ({ alerts: run({ pastures: H.pastures.replace("P7,South Divide,700,21,60", "P7,South Divide,700,,60"), moves: H.moves + "\nCows,P7,2026-09-12," }) }),
    (r) => !!r.error || (r.alerts && !r.alerts.some((e) => /of a -day plan/.test(e.problem)))],

  ["CSV-47", "target_adg_lbs blank (vs Cows' deliberate 0.0)",
    "a missing-target flag, or the Heifers gain alert; design limitation: blank and 0 both mean 'no target'",
    () => ({ alerts: run({ groups: "group,class,head,target_adg_lbs\nHeifers,first-calf heifers,3,", weights: wt([...pair("H1", "Heifers", 1000, 1040), ...pair("H2", "Heifers", 1000, 1040), ...pair("H3", "Heifers", 1000, 1040)]) }) }),
    (r) => !!r.error || (r.alerts && r.alerts.length > 0)],

  ["CSV-48", "one animal's final weight left blank (4 yearlings)",
    "(no alerts): Y2-Y4 gain 2.105 vs target 2.0; Y1 has no final weight, so no gain to judge",
    () => ({ alerts: run({ groups: YGROUP, weights: wt([...pair("Y1", "Yearlings", 700, ""), ...pair("Y2", "Yearlings", 700, 820), ...pair("Y3", "Yearlings", 700, 820), ...pair("Y4", "Yearlings", 700, 820)]) }) }),
    (r) => (r.alerts && r.alerts.length === 0) || !!r.error],

  ["CSV-49", "negative weight typed by mistake (-820)",
    "(no gain alert) or a data error; a negative weight is impossible",
    () => ({ alerts: run({ groups: YGROUP, weights: wt([...pair("Y1", "Yearlings", 700, -820), ...pair("Y2", "Yearlings", 700, 820), ...pair("Y3", "Yearlings", 700, 820), ...pair("Y4", "Yearlings", 700, 820)]) }) }),
    (r) => (r.alerts && r.alerts.length === 0) || !!r.error],

  ["CSV-50", "level written with a percent sign (11.8%)",
    "critical | Tank T2 (North Flat) | Down to 11.8% full, or a load error",
    () => ({ alerts: run({ water: H.water + "\nT2,P1,2026-09-30T12:00,14.8%\nT2,P1,2026-09-30T18:00,11.8%" }) }),
    (r) => (r.alerts && has(r.alerts, "critical", "Tank T2 (North Flat)", "Down to 11.8% full")) || !!r.error],

  ["CSV-51", "sensor error text on the latest reading (ERR)",
    "a Water alert for T2 (latest reading unusable); not silence",
    () => ({ alerts: run({ water: H.water + "\nT2,P1,2026-09-30T12:00,14.8\nT2,P1,2026-09-30T18:00,ERR" }) }),
    (r) => !!r.error || (r.alerts && r.alerts.some((e) => e.subject.startsWith("Tank T2")))],

  ["CSV-52", "non-finite level (NaN, Infinity) on the latest reading",
    "a Water alert for each tank (reading unusable); not silence",
    () => ({ alerts: run({ water: H.water + "\nT1,P1,2026-09-30T12:00,14.8\nT1,P1,2026-09-30T18:00,NaN\nT2,P1,2026-09-30T12:00,14.8\nT2,P1,2026-09-30T18:00,Infinity" }) }),
    (r) => !!r.error || (r.alerts && r.alerts.some((e) => e.subject.startsWith("Tank T1")) && r.alerts.some((e) => e.subject.startsWith("Tank T2")))],

  ["CSV-53", "sensor fault sentinel -999 after a normal 80%",
    "a sensor-fault alert, not 'Dropped 1079 points ... now -999%' [80 - (-999) = 1079]",
    () => ({ alerts: run({ water: H.water + "\nT1,P1,2026-09-29T18:00,80\nT1,P1,2026-09-30T18:00,-999" }) }),
    (r) => !!r.error || (r.alerts && r.alerts.length > 0 && !r.alerts.some((e) => /Dropped|-999%/.test(e.problem)))],

  ["CSV-54", "out-of-range glitch 140% the day before a full tank",
    "(no leak alert): the tank is at 100%; 140 is not a real level",
    () => ({ alerts: run({ water: H.water + "\nT1,P1,2026-09-29T18:00,140\nT1,P1,2026-09-30T12:00,100\nT1,P1,2026-09-30T18:00,100" }) }),
    (r) => r.alerts && !r.alerts.some((e) => /Dropped/.test(e.problem))],

  ["CSV-55", "latest level 140% (impossible) accepted as fine",
    "a data-quality flag for T1",
    () => ({ alerts: run({ water: H.water + "\nT1,P1,2026-09-30T12:00,100\nT1,P1,2026-09-30T18:00,140" }) }),
    (r) => !!r.error || (r.alerts && r.alerts.some((e) => e.subject.startsWith("Tank T1")))],

  ["CSV-56", "new budget category with no budget (0) but $500 spent",
    "an alert that reads as money, e.g. '$500 spent with no budget'; never 'Infinity% over'",
    () => ({ alerts: run({ budget: H.budget + "\n2026-09,Hay,0,500" }) }),
    (r) => r.alerts && r.alerts.some((e) => e.subject === "Hay") && !r.alerts.some((e) => /Infinity/.test(e.problem))],

  ["CSV-57", "health status typed 'Open' (capital O)",
    "serious | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15)",
    () => ({ alerts: run({ health: H.health + "\nYearlings,Booster vaccine,2026-06-02,2026-09-15,Open" }) }),
    (r) => r.alerts && has(r.alerts, "serious", "Yearlings: Booster vaccine", "Overdue by 15 days (due 2026-09-15)")],

  // ---------------- controls: these behave correctly today
  ["OK-01", "UTF-8 BOM on every committed file (Excel 'CSV UTF-8')",
    "the same 10 alerts as the committed data",
    () => ({ value: same(runReal(Object.fromEntries(FILES.map((f) => [f, (t) => "\uFEFF" + t]))), runReal()) ? "same 10 alerts" : "different" }),
    (r) => r.value === "same 10 alerts"],

  ["OK-02", "CRLF (committed files are CRLF) vs LF",
    "the same 10 alerts",
    () => ({ value: same(runReal(Object.fromEntries(FILES.map((f) => [f, (t) => t.replaceAll("\r\n", "\n")]))), runReal()) && runReal().length === 10 ? "same 10 alerts" : "different" }),
    (r) => r.value === "same 10 alerts"],

  ["OK-03", "extra trailing field on a row (too many fields)",
    "critical | Tank T2 (North Flat) | Down to 11.8% full",
    () => ({ alerts: run({ water: H.water + "\nT2,P1,2026-09-30T12:00,14.8,x\nT2,P1,2026-09-30T18:00,11.8,x" }) }),
    (r) => r.alerts && has(r.alerts, "critical", "Tank T2 (North Flat)", "Down to 11.8% full")],

  ["OK-04", "water rows out of time order, committed data reversed",
    "the same 10 alerts (ties between equal-severity tanks may be listed in a different order)",
    () => ({ value: same(runReal({ water: (t) => { const [h, ...r] = t.trim().split("\r\n"); return [h, ...r.reverse()].join("\r\n"); } }), runReal()) ? "same 10 alerts" : "different" }),
    (r) => r.value === "same 10 alerts"],

  ["OK-05", "exact duplicate water rows, committed data doubled",
    "the same 10 alerts",
    () => ({ value: same(runReal({ water: (t) => t + t.split("\n").slice(1).join("\n") }), runReal()) ? "same 10 alerts" : "different" }),
    (r) => r.value === "same 10 alerts"],

  ["OK-06", "spaces around a number ( 11.8 )",
    "critical | Tank T2 (North Flat) | Down to 11.8% full",
    () => ({ alerts: run({ water: H.water + "\nT2,P1,2026-09-30T12:00, 14.8 \nT2,P1,2026-09-30T18:00, 11.8 " }) }),
    (r) => r.alerts && has(r.alerts, "critical", "Tank T2 (North Flat)", "Down to 11.8% full")],

  ["OK-07", "numeric budget category (account code 6100)",
    "serious | 6100 | 25% over season to date ($600)",
    () => ({ alerts: run({ budget: H.budget + "\n2026-09,6100,2400,3000" }) }),
    (r) => r.alerts && r.alerts.some((e) => String(e.subject) === "6100" && e.problem === "25% over season to date ($600)")],

  ["OK-08", "blank next_due on a done task, and blank out_date on the current move",
    "(no alerts)",
    () => ({ alerts: run({ health: H.health + "\nHeifers,Pre-breeding vaccine,2026-06-10,,done", moves: H.moves + "\nCows,P1,2026-09-20," }) }),
    (r) => r.alerts && r.alerts.length === 0],
];

// ------------------------------------------------------------------ runner
let mism = 0, match = 0;
for (const [id, title, expected, actualFn, ok] of CASES) {
  let r;
  try { r = actualFn(); } catch (err) { r = { error: `${err.constructor.name}: ${err.message}` }; }
  let good;
  try { good = !!ok(r); } catch (err) { good = false; r = { ...r, checkError: String(err) }; }
  const shown = r.error ? `THROWS ${r.error}` : r.alerts ? fmt(r.alerts) : String(r.value);
  console.log(`CASE ${id}  ${title}`);
  console.log(`  expected: ${expected}`);
  console.log(`  actual:   ${shown}${r.checkError ? `  [check error: ${r.checkError}]` : ""}`);
  console.log(`  ${good ? "MATCH" : "MISMATCH"}`);
  good ? match++ : mism++;
}
console.log(`\n${CASES.length} cases: ${match} MATCH, ${mism} MISMATCH`);
