// Gain-rule reproductions for the ranch operations dashboard: gainStatus and the Gain part of findExceptions in
// exceptions.js, and gainStrip plus the "Yearling gain" tile in app.js.
// Run from the repo root:  node docs/audit/diagnostics/gain.repro.mjs
//
// Part 1 (GN-*) feeds tiny inline weigh-in lists (or the committed data with one change) through the REAL gainStatus /
// findExceptions imported from exceptions.js.
// Part 2 (GB-*) loads the real page in headless Chromium against a throwaway copy of index.html, app.js,
// exceptions.js and data/, with CSVs swapped per case through request interception, for problems that only show in
// app.js (the Yearling tile, the gain strip chart, and what a crash or hang does to the rest of the page).
//   env PLAYWRIGHT_PATH   default /opt/node22/lib/node_modules/playwright/index.mjs (Part 2 is skipped if missing)
//   env GAIN_REPRO_PORT   first port to try, default 8860 (tries up to 8869)
//   env GAIN_REPRO_TMP    where the throwaway copy goes, default a new folder in the OS temp dir (removed at the end)
//
// Each case prints:
//   CASE <id>  <title>
//     expected: <worked out by hand or with a separate pooled calculation; the reasoning is in the comment by the case>
//     actual:   <what the code produced, or the error it threw>
//     MATCH | MISMATCH
// MISMATCH means the defect (or design limit) is present. Cases marked "control" should MATCH.
// The script never throws: every case runs in its own try/catch. It modifies no repo files.
//
// Independent reference numbers used below (computed in Python from data/weights.csv by looking up each animal's
// 2026-07-20 and 2026-09-15 weights and pooling: total lbs gained / total animal-days, NOT by calling gainStatus):
//   Heifers   45 animals, Jul 20 -> Sep 15 = 57 days, total gain 1119 lbs over 2565 animal-days = 0.436257 lbs/day
//   Yearlings 150 animals, same 57 days,  total gain 16608 lbs over 8550 animal-days = 1.942456 lbs/day
//   Yearlings under 1.0 lbs/day (50% of the 2.0 target): Y027, Y031, Y058, Y082, Y129, Y132
//   H001: 1100 (Jun 1), 1138 (Jul 20), 1169 (Sep 15).  Y001: 621, 711, 851.
process.env.TZ = "UTC";

import { readFileSync, mkdtempSync, cpSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../../", import.meta.url);
const ROOT_DIR = fileURLToPath(ROOT);
const { parseCSV, findExceptions, gainStatus, RULES } = await import(new URL("exceptions.js", ROOT).href);

const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));
const REAL = Object.fromEntries(FILES.map((f) => [f, parseCSV(RAW[f])]));

const wt = (tag, group, date, weight_lbs) => ({ tag, group, date, weight_lbs });
const GROUPS = REAL.groups;   // Cows target 0.0 (180 head), Heifers 1.0 (45), Yearlings 2.0 (150)
const run = (over = {}) => findExceptions({ ...REAL, ...over });
const gainRows = (exc) => exc.filter((e) => e.area === "Gain");
const num = (v) => (typeof v === "number" ? (Number.isFinite(v) ? +v.toFixed(4) : String(v)) : JSON.stringify(v));
const fmt = (alerts) => (alerts.length ? alerts.map((e) => `${e.severity} | ${e.subject} | ${e.problem.length > 110 ? e.problem.slice(0, 110) + "..." : e.problem}`).join("  ||  ") : "(no Gain rows)");
const groupsLine = (gs) => gs.map((g) => `${g.group}: head=${g.head} adg=${num(g.adg)} from=${g.from} to=${g.to}`).join("; ") || "(no groups)";
// Committed weights with rows dropped / changed / added.
const realWeights = ({ drop = () => false, map = (r) => r, add = [] } = {}) => [...REAL.weights.filter((r) => !drop(r)).map((r) => map({ ...r })), ...add];

let mismatches = 0, matches = 0, errors = 0;
function tally(ok) { console.log(`  ${ok ? "MATCH" : "MISMATCH"}`); ok ? matches++ : mismatches++; console.log(""); }
function report(id, title, expected, actualFn, okFn) {
  console.log(`CASE ${id}  ${title}`);
  console.log(`  expected: ${expected}`);
  try {
    const actual = actualFn();
    console.log(`  actual:   ${actual.text}`);
    tally(okFn(actual));
  } catch (e) {
    console.log(`  actual:   threw ${e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e}`);
    console.log("  MISMATCH\n");
    errors++; mismatches++;
  }
}
// For cases where throwing IS the observed defect: report the throw as the actual value.
const tryRun = (fn) => { try { return { value: fn(), threw: null }; } catch (e) { return { value: null, threw: e }; } };
const threwText = (e) => `threw ${e.constructor.name}: ${e.message} (findExceptions returned nothing: no water, grazing, health or budget alerts either)`;

console.log("=== Part 1: real exceptions.js functions, inline data ===\n");

// ------------------------------------------------------------------------------------------------------ controls
report("GN-C1", "control: committed data gives the two planted gain alerts, with values matching the pooled reference",
  "serious | Heifers | 0.44 lbs/day ... vs 1.0 target  ||  warning | 6 yearlings | Under 1.0 lbs/day: Y027, Y031, Y058, Y082, Y129, Y132",
  () => { const g = gainRows(run()); return { g, text: fmt(g) }; },
  ({ g }) => g.length === 2 && g[0].severity === "serious" && g[0].subject === "Heifers" && g[0].problem.startsWith("0.44 lbs/day") &&
    g[1].severity === "warning" && g[1].subject === "6 yearlings" && g[1].problem === "Under 1.0 lbs/day: Y027, Y031, Y058, Y082, Y129, Y132");

// When every animal shares the same 57-day period, the mean of per-animal ADG equals pooled gain / animal-days.
report("GN-C2", "control: mean of per-animal ADG equals the pooled figure when all animals share one weigh period",
  "Heifers 1119/2565 = 0.436257, Yearlings 16608/8550 = 1.942456 (to 6 decimals); both from 2026-07-20 to 2026-09-15",
  () => { const gs = gainStatus(REAL.weights, GROUPS); return { gs, text: groupsLine(gs) }; },
  ({ gs }) => gs.length === 2 && Math.abs(gs[0].adg - 1119 / 2565) < 1e-9 && Math.abs(gs[1].adg - 16608 / 8550) < 1e-9 &&
    gs.every((g) => g.from === "2026-07-20" && g.to === "2026-09-15"));

// Thresholds with target 2.0 over a 50-day period: 80 lbs = 1.60/day = exactly 80% (not under, so no group alert);
// 79 lbs = 1.58 (under 80%: serious). Animal at 50 lbs = 1.00 = exactly 50% (not flagged); 49 lbs = 0.98 (flagged).
report("GN-C3", "control: 80% group and 50% animal thresholds are strict 'under'",
  "group of 1 at 1.60: no group row, no animal row; group of 1 at 1.58: serious; two animals 1.00 and 2.40 (avg 1.70): none; 0.98 and 2.40 (avg 1.69): warning for the 0.98 one",
  () => {
    const g = (rows) => gainRows(findExceptions({ ...REAL, weights: rows, groups: [GROUPS[2]] }));
    const r = {
      at80: g([wt("A", "Yearlings", "2026-07-01", 700), wt("A", "Yearlings", "2026-08-20", 780)]),
      under80: g([wt("A", "Yearlings", "2026-07-01", 700), wt("A", "Yearlings", "2026-08-20", 779)]),
      at50: g([wt("A", "Yearlings", "2026-07-01", 700), wt("A", "Yearlings", "2026-08-20", 750), wt("B", "Yearlings", "2026-07-01", 700), wt("B", "Yearlings", "2026-08-20", 820)]),
      under50: g([wt("A", "Yearlings", "2026-07-01", 700), wt("A", "Yearlings", "2026-08-20", 749), wt("B", "Yearlings", "2026-07-01", 700), wt("B", "Yearlings", "2026-08-20", 820)]),
    };
    return { r, text: Object.entries(r).map(([k, v]) => `${k}: ${fmt(v)}`).join("  ##  ") };
  },
  ({ r }) => r.at80.length === 0 && r.under80.length === 1 && r.under80[0].severity === "serious" && r.at50.length === 0 &&
    r.under50.length === 1 && r.under50[0].severity === "warning" && r.under50[0].problem.endsWith(": A"));

// Every heifer loses 30 lbs between Jul 20 and Sep 15: -30/57 = -0.526 lbs/day -> serious "-0.53 lbs/day".
report("GN-C4", "control: a group that is losing weight is flagged serious with a negative figure",
  "serious | Heifers | -0.53 lbs/day since 2026-07-20 vs 1.0 target (and no separate per-animal row)",
  () => {
    const jul = Object.fromEntries(REAL.weights.filter((r) => r.date === "2026-07-20").map((r) => [r.tag, r.weight_lbs]));
    const g = gainRows(run({ weights: realWeights({ map: (r) => (r.group === "Heifers" && r.date === "2026-09-15" ? { ...r, weight_lbs: jul[r.tag] - 30 } : r) }) })).filter((e) => e.subject.includes("eifer"));
    return { g, text: fmt(g) };
  },
  ({ g }) => g.length === 1 && g[0].severity === "serious" && g[0].problem.startsWith("-0.53 lbs/day"));

// ------------------------------------------------------------------------------------------------------ crashes
// A newly bought yearling (Y151) weighed once, on Sep 15. It has no gain yet, so it should simply be left out (or
// noted as "first weigh-in"); every other alert should still come back: the committed data has 10.
report("GN-01", "animal with a single weigh-in (new purchase Y151, weighed once on Sep 15)",
  "no throw; the 10 committed alerts still returned; Y151 left out of the gain figures (or listed as 'first weigh-in')",
  () => {
    const r = tryRun(() => run({ weights: realWeights({ add: [wt("Y151", "Yearlings", "2026-09-15", 820)] }) }));
    return { r, text: r.threw ? threwText(r.threw) : `${r.value.length} rows` };
  },
  ({ r }) => !r.threw && r.value.length === 10);

// The crash happens before groups are filtered, so even a cow (target 0.0, never judged on gain) weighed once
// (e.g. a cull cow weighed at shipping) takes the whole report down.
report("GN-02", "a single weigh-in for a cow (target-0 group that is never judged) still crashes the report",
  "no throw; 10 alerts (cows aren't judged on gain)",
  () => {
    const r = tryRun(() => run({ weights: realWeights({ add: [wt("C017", "Cows", "2026-09-15", 1310)] }) }));
    return { r, text: r.threw ? threwText(r.threw) : `${r.value.length} rows` };
  },
  ({ r }) => !r.threw && r.value.length === 10);

// ------------------------------------------------------------------------------------------------------ silent omissions
// The heifers weren't weighed at all (rows missing). The heifers have a 1.0 target and 45 head in groups.csv.
// Expected: the report says the heifers have no current gain figure, not silence.
report("GN-03", "group with a gain target but zero weigh-ins (Heifers rows missing) disappears silently",
  "a row or note like 'Heifers: no weigh-ins on record (45 head, target 1.0)'; gainStatus lists Heifers with 0 weighed",
  () => {
    const weights = realWeights({ drop: (r) => r.group === "Heifers" });
    const gs = gainStatus(weights, GROUPS), g = gainRows(run({ weights }));
    return { gs, g, text: `gainStatus: ${groupsLine(gs)}  ||  Gain rows: ${fmt(g)}` };
  },
  ({ gs, g }) => gs.some((x) => x.group === "Heifers") || g.some((e) => e.subject.includes("Heifers")));

// ------------------------------------------------------------------------------------------------------ zero-length intervals
// H001 weighed twice on Sep 15 (a re-weigh after the scale was re-zeroed: 1169 then 1180). Zero days between the
// last two rows. Expected: the duplicate is collapsed or flagged, and the heifers keep their serious alert at 0.44.
for (const [id, second, label] of [["GN-04", 1180, "+11 lbs (=> +Infinity)"], ["GN-05", 1169, "same weight (=> 0/0 = NaN)"], ["GN-06", 1160, "-9 lbs (=> -Infinity)"]]) {
  report(id, `same-day duplicate weigh-in for H001 on Sep 15, second reading ${label}`,
    "serious | Heifers | 0.44 lbs/day ... (duplicate ignored or flagged); no Infinity/NaN anywhere",
    () => {
      const weights = realWeights({ add: [wt("H001", "Heifers", "2026-09-15", second)] });
      const h = gainStatus(weights, GROUPS).find((x) => x.group === "Heifers"), g = gainRows(run({ weights }));
      return { h, g, text: `Heifers adg=${num(h.adg)}, H001 adg=${num(h.animals.find((a) => a.tag === "H001").adg)}  ||  ${fmt(g)}` };
    },
    ({ h, g }) => Number.isFinite(h.adg) && g.some((e) => e.severity === "serious" && e.subject === "Heifers" && e.problem.startsWith("0.44")));
}

// H001 re-weighed the next morning (Sep 16) 20 lbs heavier after drinking (about 1.7% of body weight). The last two
// rows are now one day apart: 20 lbs/day. Group figure for the Jul 20 -> Sep 15 weigh period is unchanged at
// 1119/2565 = 0.436 (pooled over the last-two-rows intervals it would be (1119-31+20)/(44*57+1) = 0.4416). Either way
// the heifers are under 0.8 and must stay serious.
report("GN-07", "one-day re-weigh (H001 Sep 16, +20 lbs fill): averaging per-animal ADG lets one animal mask the group",
  "serious | Heifers | 0.44 lbs/day ... (period Jul 20 -> Sep 15, or a minimum interval); pooled reference 0.436",
  () => {
    const weights = realWeights({ add: [wt("H001", "Heifers", "2026-09-16", 1189)] });
    const h = gainStatus(weights, GROUPS).find((x) => x.group === "Heifers"), g = gainRows(run({ weights }));
    return { h, g, text: `Heifers adg=${num(h.adg)} (H001 ${num(h.animals[0].adg)} lbs/day over ${h.animals[0].from}..${h.animals[0].to})  ||  ${fmt(g)}` };
  },
  ({ g }) => g.some((e) => e.severity === "serious" && e.subject === "Heifers"));

// ------------------------------------------------------------------------------------------------------ implausible / missing values
// A typo: H001's Sep 15 weight keyed as 11690 instead of 1169. That is (11690-1138)/57 = 185 lbs/day for one heifer.
// Expected: an implausible ADG (a 1,100-lb heifer cannot gain 185 lbs/day) is rejected or flagged as a data error, and
// the group keeps its serious alert at 0.44 (or 0.43 without H001: (1119-31)/(44*57) = 0.4338).
report("GN-08", "implausible weight (typo 11690 for 1169) inflates the group average and masks the serious alert",
  "serious | Heifers | 0.43-0.44 lbs/day, plus a data-error row for H001",
  () => {
    const weights = realWeights({ map: (r) => (r.tag === "H001" && r.date === "2026-09-15" ? { ...r, weight_lbs: 11690 } : r) });
    const h = gainStatus(weights, GROUPS).find((x) => x.group === "Heifers"), g = gainRows(run({ weights }));
    return { h, g, text: `Heifers adg=${num(h.adg)}  ||  ${fmt(g)}` };
  },
  ({ g }) => g.some((e) => e.severity === "serious" && e.subject === "Heifers"));

// Y001's Sep 15 weight cell left blank (scale didn't record). parseCSV gives "" and "" - 711 = -711, so Y001 gets
// -711/57 = -12.47 lbs/day and is listed for pulling. Expected: the blank row is skipped (or flagged as missing),
// Y001 is not listed as slow, and the slow list stays the planted six.
report("GN-09", "blank weight cell is treated as 0 lbs",
  "warning | 6 yearlings | Under 1.0 lbs/day: Y027, Y031, Y058, Y082, Y129, Y132 (Y001 not listed; blank flagged as missing)",
  () => {
    const text = RAW.weights.replace("Y001,Yearlings,2026-09-15,851", "Y001,Yearlings,2026-09-15,");
    const weights = parseCSV(text);
    const y = gainStatus(weights, GROUPS).find((x) => x.group === "Yearlings"), g = gainRows(run({ weights }));
    const y1 = y.animals.find((a) => a.tag === "Y001");
    return { g, text: `Y001 adg=${num(y1.adg)} weight=${JSON.stringify(y1.weight)}  ||  ${fmt(g)}` };
  },
  ({ g }) => g.some((e) => e.subject === "6 yearlings" && !e.problem.includes("Y001")));

// ------------------------------------------------------------------------------------------------------ attribution / periods
// H001 was sorted into the cow herd at the Sep 15 weigh-in (row group = Cows). gainStatus takes the group from the
// EARLIER row, so H001 still counts as a heifer. Expected: attributed to her current group (Cows), or the change
// flagged; heifers weighed = 44, heifer pooled ADG without H001 = (1119-31)/(44*57) = 1088/2508 = 0.4338.
report("GN-10", "animal whose group changes between weigh-ins is counted in the earlier group",
  "H001 in Cows (current group) or flagged; Heifers head=44, adg 0.4338",
  () => {
    const weights = realWeights({ map: (r) => (r.tag === "H001" && r.date === "2026-09-15" ? { ...r, group: "Cows" } : r) });
    const gs = gainStatus(weights, GROUPS);
    const h1 = gs.flatMap((g) => g.animals).find((a) => a.tag === "H001");
    return { gs, h1, text: `H001 counted in ${h1.group}; ${groupsLine(gs)}` };
  },
  ({ gs, h1 }) => h1.group === "Cows" || gs.find((g) => g.group === "Heifers").head === 44);

// H001 missed the Sep 15 weigh-in (still out in the far corner). Her last two rows are Jun 1 and Jul 20, so her
// early-summer ADG (38/49 = 0.78) is averaged into a group figure that the alert labels with H001's dates, because
// the group's from/to come from the first animal only. Expected: "since 2026-07-20" (the period 44 of 45 heifers were
// measured over), H001 left out or noted as missing the last weigh-in.
report("GN-11a", "one animal missed the last weigh-in: the whole group's 'since' date comes from that animal",
  "serious | Heifers | 0.43 lbs/day since 2026-07-20 ... (H001 noted as not weighed Sep 15)",
  () => {
    const weights = realWeights({ drop: (r) => r.tag === "H001" && r.date === "2026-09-15" });
    const h = gainStatus(weights, GROUPS).find((x) => x.group === "Heifers"), g = gainRows(run({ weights }));
    return { h, g, text: `Heifers from=${h.from} to=${h.to} adg=${num(h.adg)}  ||  ${fmt(g)}` };
  },
  ({ g }) => g.some((e) => e.subject === "Heifers" && e.problem.includes("since 2026-07-20")));

// The six poor-doing yearlings were the ones not gathered for the Sep 15 weigh-in (hospital pen). Their last two rows
// are Jun 1 -> Jul 20, when they were gaining normally, so the slow-animal warning disappears and nothing says six
// head were not weighed. Expected: a row naming the six as missing the Sep 15 weigh-in (the slow list can't be judged).
report("GN-11b", "the slow animals missed the last weigh-in: their stale early-summer ADG hides them",
  "a Gain row naming Y027, Y031, Y058, Y082, Y129, Y132 (missing Sep 15 weigh-in, or still slow)",
  () => {
    const six = new Set(["Y027", "Y031", "Y058", "Y082", "Y129", "Y132"]);
    const weights = realWeights({ drop: (r) => six.has(r.tag) && r.date === "2026-09-15" });
    const y = gainStatus(weights, GROUPS).find((x) => x.group === "Yearlings"), g = gainRows(run({ weights }));
    const theirs = y.animals.filter((a) => six.has(a.tag)).map((a) => `${a.tag} ${num(a.adg)} (${a.from}..${a.to})`).join(", ");
    return { g, text: `the six now: ${theirs}  ||  ${fmt(g)}` };
  },
  ({ g }) => g.some((e) => e.problem.includes("Y027")));

// A weigh-in dated after the as-of time (2026-10-15 vs as_of 2026-09-30T18:00): the page says "Data as of September
// 30", so this row should be ignored (or flagged). Expected: heifers unchanged, "0.44 lbs/day since 2026-07-20".
report("GN-12", "weigh-in dated after as_of is used, and its date becomes the group's 'since' date",
  "serious | Heifers | 0.44 lbs/day since 2026-07-20 vs 1.0 target (the Oct 15 row ignored or flagged)",
  () => {
    const weights = realWeights({ add: [wt("H001", "Heifers", "2026-10-15", 1200)] });
    const h = gainStatus(weights, GROUPS).find((x) => x.group === "Heifers"), g = gainRows(run({ weights }));
    return { g, text: `Heifers from=${h.from} to=${h.to}  ||  ${fmt(g)}` };
  },
  ({ g }) => g.some((e) => e.subject === "Heifers" && e.problem === "0.44 lbs/day since 2026-07-20 vs 1.0 target"));

// ------------------------------------------------------------------------------------------------------ coverage
// Only 3 of the 150 yearlings (groups.csv head) were weighed, each at 1.5 lbs/day (85.5 lbs over 57 days). The group
// verdict rests on 2% of the group, and nothing in the row says so. Expected: the row discloses "3 of 150 weighed"
// (or the rule declines to judge below a minimum coverage).
report("GN-13", "sample coverage: 3 of 150 yearlings weighed decide the group verdict, undisclosed (design limit)",
  "a Gain row for Yearlings that mentions '3 of 150' (or a 'too few weighed' note instead of a verdict)",
  () => {
    const weights = [...REAL.weights.filter((r) => r.group !== "Yearlings"),
      ...["Y001", "Y002", "Y003"].flatMap((t) => [wt(t, "Yearlings", "2026-07-20", 700), wt(t, "Yearlings", "2026-09-15", 785.5)])];
    const y = gainStatus(weights, GROUPS).find((x) => x.group === "Yearlings"), g = gainRows(run({ weights })).filter((e) => /earling/i.test(e.subject));
    return { g, text: `gainStatus Yearlings head=${y.head} (groups.csv head=150)  ||  ${fmt(g)}` };
  },
  ({ g }) => g.some((e) => /3 of 150/.test(e.problem)));

// Five cows weighed Jul 20 (1300) and Sep 15 (1215): -85/57 = -1.49 lbs/day, i.e. losing condition while nursing.
// Cows have target 0.0, so `if (!g.target) continue` skips them, and the gain chart filters them out too.
// Expected: either a rule for maintenance groups (e.g. flag a loss beyond some lbs/day) or a visible note that
// groups without a gain target are not judged. Neither exists.
report("GN-14", "target-0 group (Cows) losing 1.5 lbs/day is skipped silently (design limit)",
  "a Gain row for Cows, or a disclosed 'not judged' note",
  () => {
    const weights = realWeights({ add: [1, 2, 3, 4, 5].flatMap((i) => [wt(`C00${i}`, "Cows", "2026-07-20", 1300), wt(`C00${i}`, "Cows", "2026-09-15", 1215)]) });
    const c = gainStatus(weights, GROUPS).find((x) => x.group === "Cows"), g = gainRows(run({ weights }));
    return { g, text: `gainStatus Cows adg=${num(c.adg)} target=${c.target}  ||  ${fmt(g)}` };
  },
  ({ g }) => g.some((e) => e.subject.includes("Cows") || e.subject.includes("cows")));

// The six slow yearlings' rows were keyed with group "yearlings" (lower case) - or any label not in groups.csv.
// gainStatus loops over groups.csv, so those animals vanish. Expected: an "unknown group" data row, or a
// case-insensitive match; either way the six are not silently dropped.
report("GN-15", "weights whose group label isn't in groups.csv (here 'yearlings') are silently dropped",
  "warning | 6 yearlings | ... still reported, or a data row naming the unknown group 'yearlings'",
  () => {
    const six = new Set(["Y027", "Y031", "Y058", "Y082", "Y129", "Y132"]);
    const weights = realWeights({ map: (r) => (six.has(r.tag) ? { ...r, group: "yearlings" } : r) });
    const y = gainStatus(weights, GROUPS).find((x) => x.group === "Yearlings"), g = gainRows(run({ weights }));
    return { g, text: `Yearlings head=${y.head} adg=${num(y.adg)}  ||  ${fmt(g)}` };
  },
  ({ g }) => g.some((e) => e.problem.includes("Y027") || e.problem.includes("yearlings")));

// ------------------------------------------------------------------------------------------------------ date handling
// A spreadsheet export in US date format, with a fall weigh-in added (Oct 12, data as of mid-October). gainStatus
// sorts the dates as text, so "10/12/2026" sorts before "6/1/2026" and the latest weigh-in is never used.
// Expected: Y001's last two weigh-ins are Sep 15 (851) -> Oct 12 (880): 29/27 = 1.07 lbs/day, current weight 880.
// Second check: a compact numeric date (20260915) is turned into a number by parseCSV and crashes the sort.
report("GN-16", "non-ISO dates sort as text: the latest weigh-in is ignored; numeric dates crash",
  "US dates: Y001 from 9/15/2026 to 10/12/2026, adg 1.0741, weight 880; compact dates: no throw",
  () => {
    const us = parseCSV("tag,group,date,weight_lbs\nY001,Yearlings,6/1/2026,621\nY001,Yearlings,7/20/2026,711\nY001,Yearlings,9/15/2026,851\nY001,Yearlings,10/12/2026,880\n");
    const a = gainStatus(us, GROUPS)[0].animals[0];
    const compact = parseCSV("tag,group,date,weight_lbs\nY001,Yearlings,20260720,711\nY001,Yearlings,20260915,851\n");
    const c = tryRun(() => gainStatus(compact, GROUPS));
    return { a, c, text: `US dates: Y001 from ${a.from} to ${a.to}, adg ${num(a.adg)}, weight ${a.weight}  ||  compact dates: ${c.threw ? `threw ${c.threw.constructor.name}: ${c.threw.message}` : "ok"}` };
  },
  ({ a, c }) => a.to === "10/12/2026" && a.weight === 880 && !c.threw);

// Numeric tags are commonly reused across groups (tag 101 in the heifers and tag 101 in the yearlings, different tag
// colors). gainStatus keys animals by tag alone, so the two merge into one "animal". Expected: two animals, heifer 101
// at (1130-1100)/57 = 0.526 and yearling 101 at (910-800)/57 = 1.930 (or a duplicate-tag data row).
report("GN-17", "the same tag number in two groups is merged into one animal",
  "Heifers has animal 101 at 0.5263; Yearlings has animal 101 at 1.9298",
  () => {
    const w = parseCSV("tag,group,date,weight_lbs\n101,Heifers,2026-07-20,1100\n101,Heifers,2026-09-15,1130\n101,Yearlings,2026-07-20,800\n101,Yearlings,2026-09-15,910\n");
    const gs = gainStatus(w, GROUPS);
    return { gs, text: gs.map((g) => `${g.group}: ${g.animals.map((a) => `${a.tag} adg=${num(a.adg)} ${a.from}..${a.to}`).join(", ")}`).join("  ||  ") || "(no groups)" };
  },
  ({ gs }) => gs.length === 2 && gs.every((g) => g.animals.length === 1 && Number.isFinite(g.animals[0].adg)));

// ------------------------------------------------------------------------------------------------------ staleness / weigh conditions
// The Sep 15 weigh-in never happened (or wasn't exported). On Sep 30 the latest gain figure is Jun 1 -> Jul 20, 72 days
// old, when the heifers were still gaining 0.917 (pooled 2-row Python reference). The report shows no heifer problem and
// nothing says the gain data is 72 days old. Expected: a stale-data note (e.g. last weigh-in older than N days).
report("GN-18", "stale weigh-ins: all-clear based on a period that ended 72 days before as_of (design limit)",
  "a Gain row or note saying the last weigh-in was Jul 20 (72 days before as of Sep 30)",
  () => {
    const weights = realWeights({ drop: (r) => r.date === "2026-09-15" });
    const gs = gainStatus(weights, GROUPS), g = gainRows(run({ weights }));
    return { g, text: `${groupsLine(gs)}  ||  ${fmt(g)}` };
  },
  ({ g }) => g.some((e) => /Jul(y)? 20|07-20|72 days|stale|old/i.test(e.problem) && !e.problem.includes("since 2026-06-01")));

// Weigh conditions are not recorded. If the Sep 15 yearling weights were taken after an overnight stand (3% shrink,
// an assumed but ordinary figure) while Jul 20 was full, the computed yearling ADG drops from 1.94 to 1.497 (Python:
// sum(round(w_sep15*0.97) - w_jul20)/8550) - under the 1.6 line, a false serious alert. The reverse (3% fill on the
// heifers' Sep 15 weights) lifts the heifers to 1.020 and the planted problem vanishes. Expected from a rule that
// can be trusted: conditions recorded and either equalised or disclosed. This just demonstrates the sensitivity.
report("GN-19", "weigh conditions (shrink/fill) are not recorded; a 3% difference flips both verdicts (design limit)",
  "unchanged verdicts: Yearlings no serious row; Heifers serious",
  () => {
    const weights = realWeights({ map: (r) => (r.date !== "2026-09-15" ? r : { ...r, weight_lbs: Math.round(r.weight_lbs * (r.group === "Yearlings" ? 0.97 : 1.03)) }) });
    const gs = gainStatus(weights, GROUPS), g = gainRows(run({ weights }));
    return { g, text: `${groupsLine(gs)}  ||  ${fmt(g)}` };
  },
  ({ g }) => !g.some((e) => e.subject === "Yearlings") && g.some((e) => e.subject === "Heifers" && e.severity === "serious"));

// ------------------------------------------------------------------------------------------------------ target validation
// groups.csv target keyed as "2.O" (letter O). parseCSV keeps it as text; "2.O" * 0.8 = NaN, so every comparison is
// false and the yearlings are never judged. Here the yearlings' real Sep 15 weights are replaced to give 0.877
// lbs/day (50/57), far under 1.6. Expected: a data-error row for the bad target, or the group judged.
report("GN-20", "non-numeric target (2.O) silently disables the group's gain alerts",
  "a Gain row for the yearlings (serious at 0.88), or a data row naming the bad target",
  () => {
    const groups = REAL.groups.map((g) => (g.group === "Yearlings" ? { ...g, target_adg_lbs: "2.O" } : g));
    const jul = Object.fromEntries(REAL.weights.filter((r) => r.date === "2026-07-20").map((r) => [r.tag, r.weight_lbs]));
    const weights = realWeights({ map: (r) => (r.group === "Yearlings" && r.date === "2026-09-15" ? { ...r, weight_lbs: jul[r.tag] + 50 } : r) });
    const y = gainStatus(weights, groups).find((x) => x.group === "Yearlings"), g = gainRows(run({ weights, groups }));
    return { g, text: `Yearlings adg=${num(y.adg)} target=${JSON.stringify(y.target)}  ||  ${fmt(g)}` };
  },
  ({ g }) => g.some((e) => /earling/i.test(e.subject)));

// ------------------------------------------------------------------------------------------------------ wording
// (a) The committed serious row says "since 2026-07-20" but the figure is Jul 20 -> Sep 15; the period ended 15 days
// before as_of. Expected text names the end of the period ("Jul 20 to Sep 15 weigh-ins" or similar).
// (b) A single slow animal: subject should read "1 yearling", not "1 yearlings".
// (c) Group at 1.598 lbs/day (159.8 lbs over 100 days) is under 1.6 and flagged, but displays as "1.60", which reads
// as exactly on the line. Expected: enough precision (or wording) that the number shown is visibly under the threshold.
report("GN-21", "wording: 'since' hides the period end; '1 yearlings'; 1.598 shown as 1.60 next to a 1.6 line",
  "(a) problem names Sep 15 / 09-15; (b) subject '1 yearling'; (c) displayed figure < 1.60",
  () => {
    const a = gainRows(run()).find((e) => e.subject === "Heifers");
    const one = gainRows(run({ weights: realWeights({ map: (r) => (r.tag === "Y027" || r.tag === "Y031" || r.tag === "Y058" || r.tag === "Y082" || r.tag === "Y129" ? { ...r, group: "Gone" } : r) }) })).find((e) => e.severity === "warning");
    const c = gainRows(findExceptions({ ...REAL, groups: [GROUPS[2]], weights: [wt("A", "Yearlings", "2026-06-01", 700), wt("A", "Yearlings", "2026-09-09", 859.8)] }))[0];
    return { a, one, c, text: `(a) ${a.problem}  ||  (b) subject '${one.subject}'  ||  (c) ${c.severity} | ${c.problem}` };
  },
  ({ a, one, c }) => /09-15|Sep 15/.test(a.problem) && one.subject === "1 yearling" && !c.problem.startsWith("1.60"));

// ======================================================================================================== Part 2
console.log("=== Part 2: app.js in headless Chromium ===\n");

const PW = process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs";
let chromium = null;
try { ({ chromium } = await import(PW)); } catch (e) { console.log(`(Part 2 skipped: cannot import Playwright from ${PW}: ${e.message})\n`); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const csv = (header, rows) => header.join(",") + "\n" + rows.map((r) => header.map((h) => r[h]).join(",")).join("\n") + "\n";
const weightsCSV = (rows) => csv(["tag", "group", "date", "weight_lbs"], rows);
const groupsCSV = (rows) => csv(["group", "class", "head", "target_adg_lbs"], rows);

async function startServer(dir) {
  const first = Number(process.env.GAIN_REPRO_PORT || 8860);
  for (let port = first; port <= 8869; port++) {
    const proc = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", dir], { stdio: "ignore" });
    for (let i = 0; i < 30; i++) {
      await sleep(100);
      if (proc.exitCode !== null) break;
      try { const r = await fetch(`http://127.0.0.1:${port}/index.html`); if (r.ok) return { proc, port }; } catch {}
    }
    try { proc.kill(); } catch {}
  }
  throw new Error("no free port in 8860-8869");
}

// Load the page with some CSVs swapped. Returns the rendered state, or { hung: true, stack } when the main thread
// never comes back (detected by page.evaluate not answering; the stack comes from a CDP Debugger.pause).
async function pageState(browser, base, overrides) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  const cdp = await page.context().newCDPSession(page);
  const scripts = {};
  cdp.on("Debugger.scriptParsed", (e) => { scripts[e.scriptId] = e.url.split("/").pop(); });
  await cdp.send("Debugger.enable");
  await page.route("**/data/*.csv", (route) => {
    const f = new URL(route.request().url()).pathname.split("/").pop().replace(".csv", "");
    if (f in overrides) return route.fulfill({ status: 200, contentType: "text/csv", body: overrides[f] });
    return route.continue();
  });
  await page.goto(`${base}/index.html`, { waitUntil: "commit" });
  // Wait until the last section (rules) is drawn, a page error is reported, or the main thread stops answering.
  let hung = false;
  for (let i = 0; i < 40; i++) {
    const r = await Promise.race([page.evaluate(() => document.querySelectorAll("#rules tr").length).then((n) => ({ n })), sleep(2500).then(() => ({ hung: true }))]);
    if (r.hung) { hung = true; break; }
    if (r.n > 0 || errs.length) { await sleep(300); break; }
    await sleep(150);
  }
  if (hung) {
    const paused = new Promise((res) => cdp.once("Debugger.paused", res));
    cdp.send("Debugger.pause").catch(() => {});
    const ev = await Promise.race([paused, sleep(3000).then(() => null)]);
    const stack = ev ? ev.callFrames.slice(0, 4).map((f) => `${f.functionName || "(module top level)"} (${scripts[f.location.scriptId] || "?"}:${f.location.lineNumber + 1})`).join(" <- ") : "(could not pause)";
    const shot = await page.screenshot({ timeout: 1500 }).then(() => "screenshot ok").catch(() => "screenshot timed out (nothing painted)");
    return { hung: true, stack, shot, errs };
  }
  const s = await page.evaluate(() => {
    const g = document.querySelector("#gain svg");
    const lines = g ? [...g.querySelectorAll("line")] : [];
    return {
      asof: document.getElementById("asof").textContent,
      tiles: [...document.querySelectorAll("#tiles .tile")].map((t) => [...t.children].map((c) => c.textContent).join(" / ")),
      excRows: [...document.querySelectorAll("#exceptions tr")].slice(1).map((r) => [...r.cells].map((c) => c.textContent.replace(/\s+/g, " ").trim()).join(" | ")),
      gainHeading: document.querySelector("#gain")?.parentElement?.querySelector("h2")?.textContent,
      gain: !!g, rules: document.querySelectorAll("#rules tr").length,
      dots: g ? g.querySelectorAll("circle").length : 0,
      nanDots: g ? [...g.querySelectorAll("circle")].filter((c) => !Number.isFinite(+c.getAttribute("cx"))).length : 0,
      grid: lines.filter((l) => /grid|axis/.test(l.getAttribute("stroke"))).length,
      targets: lines.filter((l) => l.getAttribute("stroke") === "var(--ink)").map((l) => l.getAttribute("x1")),
      labels: g ? [...g.querySelectorAll("text")].map((t) => t.textContent).filter((t) => /^avg |^target /.test(t)) : [],
      ticks: g ? [...g.querySelectorAll("text")].map((t) => t.textContent).filter((t) => /^-?\d+\.\d$/.test(t)) : [],
      dotSpread: g ? (() => { const xs = [...g.querySelectorAll("circle")].map((c) => +c.getAttribute("cx")).filter(Number.isFinite).sort((a, b) => a - b); return xs.length ? [+xs[0].toFixed(1), +xs[Math.floor(xs.length / 2)].toFixed(1), +xs[xs.length - 1].toFixed(1)] : []; })() : [],
    };
  });
  await page.close();
  return { ...s, errs };
}

async function breport(id, title, expected, fn, okFn) {
  console.log(`CASE ${id}  ${title}`);
  console.log(`  expected: ${expected}`);
  try {
    const actual = await fn();
    console.log(`  actual:   ${actual.text}`);
    tally(okFn(actual));
  } catch (e) {
    console.log(`  actual:   threw ${e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e}`);
    console.log("  MISMATCH\n");
    errors++; mismatches++;
  }
}
const brief = (s) => s.hung ? `PAGE HUNG: main thread did not answer page.evaluate within 2.5 s; ${s.shot}; paused stack: ${s.stack}`
  : `pageerrors=${JSON.stringify(s.errs)}; asof=${JSON.stringify(s.asof.slice(0, 40))}; tiles=${s.tiles.length}; exception rows=${s.excRows.length}; gain chart=${s.gain} dots=${s.dots} (NaN cx: ${s.nanDots}) gridlines=${s.grid} labels=${JSON.stringify(s.labels)}`;

if (chromium) {
  let tmp = null, created = false, server = null, browser = null;
  try {
    tmp = process.env.GAIN_REPRO_TMP ? join(process.env.GAIN_REPRO_TMP, "site-" + process.pid) : mkdtempSync(join(tmpdir(), "gain-repro-"));
    created = true;
    mkdirSync(tmp, { recursive: true });
    for (const f of ["index.html", "app.js", "exceptions.js"]) cpSync(join(ROOT_DIR, f), join(tmp, f));
    cpSync(join(ROOT_DIR, "data"), join(tmp, "data"), { recursive: true });
    server = await startServer(tmp);
    const base = `http://127.0.0.1:${server.port}`;
    console.log(`(serving a throwaway copy from ${tmp} on port ${server.port})\n`);
    browser = await chromium.launch();

    // Committed data: 5 tiles; Yearling tile 1.94 lbs/day, target 2.0, since Jul 20; 10 exception rows; 195 dots
    // (45 heifers + 150 yearlings); axis 0.0..3.0 (min ADG 0.105 floors to 0, max 2.702 ceils to 3.0) = 7 gridlines.
    await breport("GB-C1", "control: committed data renders the tile, report and gain chart",
      "no page errors; 5 tiles incl. 'Yearling gain / 1.94 lbs/day / target 2.0, since Jul 20'; 10 rows; 195 dots, 0 NaN; 7 gridlines 0.0..3.0",
      async () => {
        const s = await pageState(browser, base, {});
        const gainRowsShown = s.excRows.filter((r) => r.includes("| Gain |"));
        return { s, text: `${brief(s)}; yearling tile=${JSON.stringify(s.tiles[3])}; ticks=${s.ticks.join(",")}; gain heading=${JSON.stringify(s.gainHeading)}; gain rows shown=${JSON.stringify(gainRowsShown)}` };
      },
      ({ s }) => !s.hung && !s.errs.length && s.tiles.length === 5 && s.tiles[3] === "Yearling gain / 1.94 lbs/day / target 2.0, since Jul 20" &&
        s.excRows.length === 10 && s.dots === 195 && s.nanDots === 0 && s.grid === 7);

    // Same as GN-01 in the page: findExceptions throws at app.js top level, so nothing is drawn, not even the as-of line.
    await breport("GB-01", "single weigh-in (new yearling Y151) in the page",
      "page draws all 10 alerts and the tiles; Y151 left out of gain",
      async () => { const s = await pageState(browser, base, { weights: RAW.weights + "Y151,Yearlings,2026-09-15,820\n" }); return { s, text: brief(s) }; },
      ({ s }) => !s.hung && !s.errs.length && s.excRows.length === 10);

    // A ranch whose yearling group is called "Steers" (groups.csv and weights.csv agree). tiles() does
    // .find(g => g.group === "Yearlings") -> undefined -> gain.adg throws. tiles() runs before exceptionsTable(), so the
    // report is never drawn. Expected: the page draws everything; the gain tile shows some group or "no yearlings".
    await breport("GB-02", "no group named exactly 'Yearlings' (renamed 'Steers' consistently)",
      "no page errors; 10 exception rows (the 6 slow-animal names now under 'steers'); a gain tile that copes",
      async () => {
        const s = await pageState(browser, base, { groups: RAW.groups.replace("Yearlings,", "Steers,"), weights: RAW.weights.replaceAll(",Yearlings,", ",Steers,") });
        return { s, text: brief(s) };
      },
      ({ s }) => !s.hung && !s.errs.length && s.excRows.length === 10);

    // Early season: the yearlings are in groups.csv but have no weigh-ins yet (only heifer rows). Same crash.
    await breport("GB-03", "Yearlings in groups.csv but no yearling weigh-ins yet",
      "no page errors; exception table drawn (9 rows: the committed 10 minus the slow-yearling warning)",
      async () => { const s = await pageState(browser, base, { weights: weightsCSV(REAL.weights.filter((r) => r.group !== "Yearlings")) }); return { s, text: brief(s) }; },
      ({ s }) => !s.hung && !s.errs.length && s.excRows.length === 9);

    // Same-day duplicate giving NaN (GN-05) in the page: the serious heifer row turns into a warning listing 32 heifers,
    // and the chart loses its axis (lo = Math.min(0, NaN) = NaN, so the gridline loop never runs) and every dot.
    await breport("GB-04", "same-day duplicate with equal weight (NaN ADG) in the page",
      "heifers row stays 'Serious Gain Heifers 0.44 lbs/day...'; gain chart has 7 gridlines and 195+ finite dots",
      async () => {
        const s = await pageState(browser, base, { weights: RAW.weights + "H001,Heifers,2026-09-15,1169\n" });
        const heif = s.excRows ? s.excRows.filter((r) => /eifer/.test(r) && /Gain/.test(r)) : [];
        return { s, heif, text: `${brief(s)}; heifer gain rows=${JSON.stringify(heif.map((r) => r.slice(0, 70)))}` };
      },
      ({ s, heif }) => !s.hung && s.grid === 7 && s.nanDots === 0 && heif.some((r) => r.startsWith("Serious") && r.includes("0.44")));

    // Implausible value (GN-08) in the page: the 185 lbs/day dot stretches the axis to 0..185.5 (372 gridlines with
    // labels) and the 194 real dots crowd into a sliver; the heifer serious row is gone. Expected: data error flagged,
    // axis stays 0..3.0 (7 gridlines), heifers still serious.
    await breport("GB-05", "typo 11690 for 1169 in the page: axis stretched, serious heifer row gone",
      "7 gridlines (0.0..3.0); heifers 'Serious ... 0.44' row present",
      async () => {
        const s = await pageState(browser, base, { weights: RAW.weights.replace("H001,Heifers,2026-09-15,1169", "H001,Heifers,2026-09-15,11690") });
        const heif = s.excRows ? s.excRows.filter((r) => /eifer/.test(r) && /Gain/.test(r)) : [];
        return { s, heif, text: `${brief(s)}; target line x=${JSON.stringify(s.targets)}; dot x min/median/max=${JSON.stringify(s.dotSpread)} of a 74..546 plot; heifer gain rows=${JSON.stringify(heif.map((r) => r.slice(0, 60)))}` };
      },
      ({ s, heif }) => !s.hung && s.grid === 7 && heif.some((r) => r.startsWith("Serious")));

    // Control: a group losing weight draws a negative axis correctly. Every heifer loses 30 lbs Jul 20 -> Sep 15
    // (-0.526/day): axis from -1.0 (floor(-0.526*2)/2) to 3.0 = 9 gridlines, all dots finite, "avg -0.53".
    await breport("GB-C2", "control: negative gains draw on a negative axis",
      "no errors; 9 gridlines from -1.0 to 3.0; 195 finite dots; label 'avg -0.53'",
      async () => {
        const jul = Object.fromEntries(REAL.weights.filter((r) => r.date === "2026-07-20").map((r) => [r.tag, r.weight_lbs]));
        const s = await pageState(browser, base, { weights: weightsCSV(realWeights({ map: (r) => (r.group === "Heifers" && r.date === "2026-09-15" ? { ...r, weight_lbs: jul[r.tag] - 30 } : r) })) });
        return { s, text: `${brief(s)}; ticks=${s.ticks?.join(",")}` };
      },
      ({ s }) => !s.hung && !s.errs.length && s.grid === 9 && s.ticks[0] === "-1.0" && s.nanDots === 0 && s.dots === 195 && s.labels.includes("avg -0.53"));

    // Non-numeric target (GN-20) in the page: tiles() calls gain.target.toFixed on the string "2.O" and throws before
    // the report is drawn.
    await breport("GB-06", "non-numeric yearling target '2.O' in groups.csv",
      "no page errors; exception table drawn",
      async () => { const s = await pageState(browser, base, { groups: RAW.groups.replace("Yearlings,yearling steers,150,2.0", "Yearlings,yearling steers,150,2.O") }); return { s, text: brief(s) }; },
      ({ s }) => !s.hung && !s.errs.length && s.excRows.length > 0);

    // Hang cases last, each in its own browser, which is killed afterwards.
    // Same-day duplicate giving +Infinity (GN-04): hi = Infinity, so `for (v = lo; v <= hi + 1e-9; v += 0.5)` in
    // gainStrip never ends. The page never paints: no tiles, no report. Then -Infinity (GN-06; lo = -Infinity, v += 0.5
    // stays -Infinity) and the merged reused tag (GN-17, which yields -Infinity).
    for (const [id, title, weights] of [
      ["GB-07", "same-day duplicate weigh-in, second reading 11 lbs heavier (+Infinity ADG)", RAW.weights + "H001,Heifers,2026-09-15,1180\n"],
      ["GB-08", "same-day duplicate weigh-in, second reading 9 lbs lighter (-Infinity ADG)", RAW.weights + "H001,Heifers,2026-09-15,1160\n"],
      ["GB-09", "tag 101 used in both Heifers and Yearlings (merged animal, -Infinity ADG)", RAW.weights + "101,Heifers,2026-07-20,1100\n101,Heifers,2026-09-15,1130\n101,Yearlings,2026-07-20,800\n101,Yearlings,2026-09-15,910\n"],
    ]) {
      const hb = await chromium.launch();
      try {
        await breport(id, title,
          "page renders (tiles, report, chart) within a few seconds; the bad row is flagged, not drawn",
          async () => { const s = await pageState(hb, base, { weights }); return { s, text: brief(s) }; },
          ({ s }) => !s.hung && !s.errs.length && s.excRows.length >= 10);
      } finally {
        const killer = setTimeout(() => { try { hb.process?.()?.kill("SIGKILL"); } catch {} }, 3000);
        await hb.close().catch(() => {});
        clearTimeout(killer);
      }
    }
  } catch (e) {
    console.log(`(Part 2 aborted: ${e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e})\n`);
    errors++;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) try { server.proc.kill(); } catch {}
    if (tmp && created) try { rmSync(tmp, { recursive: true, force: true }); } catch {}
  }
}

console.log(`SUMMARY  ${matches} MATCH, ${mismatches} MISMATCH (${errors} of them unexpected throws)`);
