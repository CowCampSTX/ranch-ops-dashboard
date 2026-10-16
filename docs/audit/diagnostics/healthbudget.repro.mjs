// Health and budget rule reproductions for the ranch operations dashboard: the health and budget parts of
// findExceptions, budgetStatus, and the "Spend vs budget" tile, budget chart, budget table and rules table in app.js.
// Run from the repo root:  node docs/audit/diagnostics/healthbudget.repro.mjs
//
// Part 1 (HB-C*, H-*, BU-*) feeds tiny inline rows, or the committed data with one change, through the REAL
// budgetStatus / findExceptions imported from exceptions.js.
// Part 2 (AB-*) loads the real page in headless Chromium against a throwaway copy of the app, swapping budget.csv
// (and, for one case, exceptions.js) per case through request interception, for problems that only show in app.js.
//   env PLAYWRIGHT_PATH  default /opt/node22/lib/node_modules/playwright/index.mjs (Part 2 is skipped if missing)
//   env HB_REPRO_PORT    first port to try, default 8870 (tries up to 8879)
//   env HB_REPRO_TMP     where the throwaway copy goes, default the OS temp dir
//
// Each case prints:
//   CASE <id>  <title>
//     expected: <worked out by hand; the arithmetic is in the comment beside the case>
//     actual:   <what the code produced, or the error it threw>
//     MATCH | MISMATCH
// MISMATCH means the defect (or design limit) is present. HB-C* and AB-00 are controls that should MATCH.
// The script never throws: every case runs in its own try/catch. It modifies no repo files.
//
// Health day counts compare date-only strings, so TZ is pinned to UTC; case H-08 switches TZ on purpose and restores it.
process.env.TZ = "UTC";

import { readFileSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../../", import.meta.url);
const ROOT_DIR = fileURLToPath(ROOT);
const { parseCSV, findExceptions, budgetStatus } = await import(new URL("exceptions.js", ROOT).href);

const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));
const REAL = Object.fromEntries(FILES.map((f) => [f, parseCSV(RAW[f])]));
const AS_OF = "2026-09-30T18:00";
const EMPTY = { pastures: [], groups: [], moves: [], weights: [], water: [], health: [], budget: [], meta: [{ as_of: AS_OF }] };

const HEALTH_HEAD = "group,task,last_done,next_due,status";
const BUDGET_HEAD = "month,category,budget,actual";
const budgetLines = RAW.budget.trim().split(/\r?\n/).slice(1);        // committed rows, no header, no CR
const budgetCSV = (lines) => [BUDGET_HEAD, ...lines].join("\n") + "\n";

// Alerts in one area for a dataset: inline rows on an otherwise empty ranch, or the committed data with one file swapped.
const healthOnly = (csvBody) => findExceptions({ ...EMPTY, health: parseCSV(HEALTH_HEAD + "\n" + csvBody) }).filter((e) => e.area === "Health");
const budgetOnly = (csvBody) => findExceptions({ ...EMPTY, budget: parseCSV(BUDGET_HEAD + "\n" + csvBody) }).filter((e) => e.area === "Budget");
const realWith = (over) => findExceptions({ ...REAL, ...over });
const fmt = (alerts) => (alerts.length ? alerts.map((e) => `${e.severity} | ${e.subject} | ${e.problem} | ${e.action}`).join("  ||  ") : "(no alerts)");
const has = (alerts, sev, subject, problemRe) => alerts.some((e) => e.severity === sev && e.subject === subject && (!problemRe || problemRe.test(e.problem)));

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

// ================================================================== controls (should MATCH)

// HB-C1. Committed health.csv, as_of Sep 30. Booster: Sep 15 -> Sep 30 = 15 days late (open) -> serious.
// Pinkeye: Sep 30 -> Oct 3 = 3 days (open, within 7) -> warning. Pregnancy check Oct 25 = 25 days, Deworm Nov 1 = 32 days:
// outside 7, no alert. The two "done" rows are not judged. So exactly two health alerts.
report("HB-C1", "committed health.csv gives exactly the two planted health alerts",
  "serious | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15)  and  warning | Cows: Pinkeye check | Due in 3 days (2026-10-03); nothing else",
  () => { const a = realWith({}).filter((e) => e.area === "Health"); return { a, text: fmt(a) }; },
  ({ a }) => a.length === 2 && has(a, "serious", "Yearlings: Booster vaccine", /^Overdue by 15 days \(due 2026-09-15\)$/) && has(a, "warning", "Cows: Pinkeye check", /^Due in 3 days \(2026-10-03\)$/));

// HB-C2. Committed budget.csv summed by hand (4 months each):
// Fuel actual 2592+2928+3120+3000 = 11,640 vs 4 x 2400 = 9,600 -> +2,040 = 21.25% -> serious "21% over ... ($2,040)".
// Repairs 1620+2520+1980+2880 = 9,000 vs 4 x 1800 = 7,200 -> +1,800 = 25% -> serious "25% over ... ($1,800)".
// Feed 24,002 vs 24,800 (-3.2%), Vet 5,945 vs 6,000 (-0.9%), Labor 34,259 vs 36,000 (-4.8%), Water 4,457 vs 4,800 (-7.1%): no alert.
report("HB-C2", "committed budget.csv gives exactly Fuel and Repairs, serious, with the hand-summed dollars",
  "serious | Fuel | 21% over season to date ($2,040)  and  serious | Repairs | 25% over season to date ($1,800); nothing else",
  () => { const a = realWith({}).filter((e) => e.area === "Budget"); return { a, text: fmt(a) }; },
  ({ a }) => a.length === 2 && has(a, "serious", "Fuel", /^21% over season to date \(\$2,040\)$/) && has(a, "serious", "Repairs", /^25% over season to date \(\$1,800\)$/));

// HB-C3. Day counting and plurals around as_of date Sep 30: Sep 29 = 1 day late, Oct 1 = 1 day ahead,
// Oct 7 = 7 days ahead (inside "within 7 days"), Oct 8 = 8 days ahead (outside).
report("HB-C3", "singular/plural wording and the 7-day window edge",
  "serious 'Overdue by 1 day (due 2026-09-29)'; warning 'Due in 1 day (2026-10-01)'; warning 'Due in 7 days (2026-10-07)'; nothing for Oct 8",
  () => {
    const a = healthOnly(["Cows,A,,2026-09-29,open", "Cows,B,,2026-10-01,open", "Cows,C,,2026-10-07,open", "Cows,D,,2026-10-08,open"].join("\n"));
    return { a, text: fmt(a) };
  },
  ({ a }) => a.length === 3 && has(a, "serious", "Cows: A", /^Overdue by 1 day \(due 2026-09-29\)$/) && has(a, "warning", "Cows: B", /^Due in 1 day \(2026-10-01\)$/) && has(a, "warning", "Cows: C", /^Due in 7 days \(2026-10-07\)$/));

// HB-C4. A group that is not in groups.csv (Bulls) still gets its overdue task reported: Sep 20 -> Sep 30 = 10 days.
report("HB-C4", "health task for a group not in groups.csv is still reported",
  "serious | Bulls: Trich test | Overdue by 10 days (due 2026-09-20)",
  () => { const a = healthOnly("Bulls,Trich test,,2026-09-20,open"); return { a, text: fmt(a) }; },
  ({ a }) => has(a, "serious", "Bulls: Trich test", /^Overdue by 10 days \(due 2026-09-20\)$/));

// HB-C5. 'cancelled' and 'done' one-off tasks with a past due date are not alerts.
report("HB-C5", "cancelled and done one-off tasks are not flagged",
  "(no alerts)",
  () => { const a = healthOnly("Cows,Old task,,2026-09-01,cancelled\nCows,One-off,2026-09-02,2026-09-01,done"); return { a, text: fmt(a) }; },
  ({ a }) => a.length === 0);

// HB-C6. A credit written with a minus sign: Repairs 1620 + 2520 + 1980 + (-300) = 5,820 vs 7,200 -> -1,380 (-19.2%).
report("HB-C6", "a credit (-300) with a minus sign sums as a number",
  "Repairs actual 5820, variance -1380, no alert",
  () => {
    const rows = parseCSV(BUDGET_HEAD + "\n2026-06,Repairs,1800,1620\n2026-07,Repairs,1800,2520\n2026-08,Repairs,1800,1980\n2026-09,Repairs,1800,-300");
    const s = budgetStatus(rows)[0], a = budgetOnly("2026-06,Repairs,1800,1620\n2026-07,Repairs,1800,2520\n2026-08,Repairs,1800,1980\n2026-09,Repairs,1800,-300");
    return { s, a, text: `actual=${JSON.stringify(s.actual)} variance=${s.variance} pct=${s.pct}; ${fmt(a)}` };
  },
  ({ s, a }) => s.actual === 5820 && s.variance === -1380 && a.length === 0);

// HB-C7. Whole dollars exactly 10% over: 1,100 vs 1,000. (1100-1000)/1000 is computed exactly as the double 0.1,
// so the "more than 10%" rule is not met: warning.
report("HB-C7", "whole-dollar exact 10% over is a warning (no float drift)",
  "pct 0.1 exactly; warning | X | 10% over season to date",
  () => { const s = budgetStatus(parseCSV(BUDGET_HEAD + "\n2026-09,X,1000,1100"))[0], a = budgetOnly("2026-09,X,1000,1100"); return { s, a, text: `pct=${s.pct}; ${fmt(a)}` }; },
  ({ s, a }) => s.pct === 0.1 && has(a, "warning", "X", /^10% over season to date$/));

// HB-C8. Date-only due dates: asOf.slice(0, 10) and next_due are both "YYYY-MM-DD", both read as UTC midnight, so the
// day counts are whole numbers and the same for every viewer's zone. Same two committed health alerts as HB-C1 in each.
report("HB-C8", "committed health alerts identical in UTC, America/Chicago and Australia/Sydney",
  "the HB-C1 pair (Overdue by 15 days; Due in 3 days) in all three zones",
  () => {
    const run = (tz) => { process.env.TZ = tz; try { return fmt(realWith({}).filter((e) => e.area === "Health")); } finally { process.env.TZ = "UTC"; } };
    const r = ["UTC", "America/Chicago", "Australia/Sydney"].map(run);
    return { r, text: r.map((x, i) => `${["UTC", "Chicago", "Sydney"][i]}: ${x}`).join("  ##  ") };
  },
  ({ r }) => r.every((x) => x === r[0]) && /Overdue by 15 days/.test(r[0]) && /Due in 3 days/.test(r[0]));

// ================================================================== health
// H-01. The committed overdue booster, status typed the way people type it in a spreadsheet. By hand every one of these
// is the same open task, 15 days late (Sep 15 -> Sep 30) -> serious. The variant row is followed by an ordinary row
// (Deworm, due Nov 1, no alert) because parseCSV trims the whole file, which would hide a trailing space on the last row.
for (const [id, st] of [["H-01a", "Open"], ["H-01b", "OPEN"], ["H-01c", "open "]]) {
  report(id, `status '${st}' (case/space variant of open) on an overdue booster`,
    "serious | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15)",
    () => { const a = healthOnly(`Yearlings,Booster vaccine,2026-06-02,2026-09-15,${st}\nYearlings,Deworm,2026-06-02,2026-11-01,open`); return { a, text: fmt(a) }; },
    ({ a }) => has(a, "serious", "Yearlings: Booster vaccine", /Overdue by 15 days/));
}

// H-02. Status values the rule doesn't know. None of them means "done", so the task is still outstanding and 15 days
// late; at minimum the row should be surfaced (e.g. "unknown status 'in progress'") rather than silently dropped.
for (const [id, st] of [["H-02a", "in progress"], ["H-02b", "scheduled"], ["H-02c", "overdue"]]) {
  report(id, `unsupported status '${st}' on a task due Sep 15`,
    "some Health row for Yearlings: Booster vaccine (overdue, or 'status not recognised')",
    () => { const a = healthOnly(`Yearlings,Booster vaccine,2026-06-02,2026-09-15,${st}`); return { a, text: fmt(a) }; },
    ({ a }) => a.some((e) => e.subject === "Yearlings: Booster vaccine"));
}

// H-03 / H-04. Open task with no usable due date. The health data appears nowhere else on the page, so a skipped row is
// invisible. Expected: a row saying the open task has no (readable) due date.
report("H-03", "open task with a blank next_due",
  "a Health row for Heifers: Pregnancy check saying it has no due date",
  () => { const a = healthOnly("Heifers,Pregnancy check,2026-09-20,,open"); return { a, text: fmt(a) }; },
  ({ a }) => a.some((e) => e.subject === "Heifers: Pregnancy check"));
report("H-04", "open task with next_due 'TBD'",
  "a Health row for Heifers: Pregnancy check saying its due date can't be read",
  () => { const a = healthOnly("Heifers,Pregnancy check,2026-09-20,TBD,open"); return { a, text: fmt(a) }; },
  ({ a }) => a.some((e) => e.subject === "Heifers: Pregnancy check"));

// H-05. The committed row "Cows, Fly tag check, last_done 2026-06-05, next_due 2026-09-01, done". Read as a recurring
// task, the next check fell due Sep 1 and nothing records it done since June 5: 29 days overdue (Sep 1 -> Sep 30).
// Read as a one-off, last_done (Jun 5) before next_due (Sep 1) contradicts "done". Either way it needs a look.
report("H-05", "committed 'done' row whose next_due (Sep 1) passed with last_done still June 5",
  "a Health row for Cows: Fly tag check (overdue 29 days, or 'done but next due date passed')",
  () => { const a = realWith({}).filter((e) => e.area === "Health"); return { a, text: fmt(a) }; },
  ({ a }) => a.some((e) => e.subject === "Cows: Fly tag check"));

// H-06. Open task done on Sep 20, after its Sep 15 due date (status not updated). last_done > next_due means the
// record contradicts itself; telling the crew to schedule it risks a second dose. Expected: a conflict/confirm row, not
// "Overdue ... Schedule it this week".
report("H-06", "open task whose last_done (Sep 20) is after its next_due (Sep 15)",
  "a 'record conflict: done Sep 20 after due Sep 15, still open' row, not 'Overdue by 15 days' + 'Schedule it this week'",
  () => { const a = healthOnly("Yearlings,Booster vaccine,2026-09-20,2026-09-15,open"); return { a, text: fmt(a) }; },
  ({ a }) => a.length > 0 && !a.some((e) => /^Overdue by 15 days/.test(e.problem) && /Schedule it this week/.test(e.action)));

// H-07. Due on the as_of date itself.
report("H-07", "task due today (next_due = as_of date)",
  "warning wording 'Due today (2026-09-30)'",
  () => { const a = healthOnly("Cows,Pinkeye check,2026-08-01,2026-09-30,open"); return { a, text: fmt(a) }; },
  ({ a }) => a.some((e) => /^Due today/.test(e.problem)));

// H-08. next_due exported with a time ("2026-09-30 00:00:00", a common database/Excel export). It is still due on the
// as_of date, so by hand: "due today", whole days, the same in every viewer's time zone.
report("H-08", "next_due '2026-09-30 00:00:00' viewed in America/Chicago and Europe/Berlin",
  "the same whole-day text and severity in both zones (due today, warning)",
  () => {
    const run = (tz) => { process.env.TZ = tz; try { return healthOnly("Cows,Pinkeye check,2026-08-01,2026-09-30 00:00:00,open"); } finally { process.env.TZ = "UTC"; } };
    const chi = run("America/Chicago"), ber = run("Europe/Berlin");
    return { chi, ber, text: `Chicago: ${fmt(chi)}  ##  Berlin: ${fmt(ber)}` };
  },
  ({ chi, ber }) => fmt(chi) === fmt(ber) && chi.length === 1 && chi[0].severity === "warning" && !/\.\d/.test(chi[0].problem.split("(")[0]));

// ================================================================== budget
// BU-01. New category with no budget (0) and $500 spent. budgetStatus divides 500 by 0.
report("BU-01", "zero budget with $500 spent",
  "an alert that reads as money ('$500 spent with no budget'); never 'Infinity%'",
  () => { const a = budgetOnly("2026-09,Hay,0,500"); return { a, text: fmt(a) }; },
  ({ a }) => a.some((e) => e.subject === "Hay") && !a.some((e) => /Infinity|NaN/.test(e.problem)));

// BU-02. Placeholder category, 0 budget and 0 spent. Nothing to flag; pct should be a number (0) so the chart can use it.
report("BU-02", "zero budget, zero spent (placeholder category)",
  "no alert; pct a finite number (0)",
  () => { const s = budgetStatus(parseCSV(BUDGET_HEAD + "\n2026-09,Hay,0,0"))[0], a = budgetOnly("2026-09,Hay,0,0"); return { s, a, text: `pct=${s.pct}; ${fmt(a)}` }; },
  ({ s, a }) => Number.isFinite(s.pct) && a.length === 0);

// BU-03. Unbudgeted line left blank in the budget column (",,500"). By hand the budget is $0, actual $500.
report("BU-03", "blank budget cell on an unbudgeted category",
  "budget 0 (a number), actual 500; alert reads as money, no 'Infinity'",
  () => { const s = budgetStatus(parseCSV(BUDGET_HEAD + "\n2026-09,Hay,,500"))[0], a = budgetOnly("2026-09,Hay,,500"); return { s, a, text: `budget=${JSON.stringify(s.budget)} (${typeof s.budget}) actual=${JSON.stringify(s.actual)}; ${fmt(a)}` }; },
  ({ s, a }) => s.budget === 0 && !a.some((e) => /Infinity|NaN/.test(e.problem)));

// BU-04. Committed data with September's Fuel actual not entered yet (blank). Months entered: Jun-Aug actual
// 2592+2928+3120 = 8,640 vs Jun-Aug budget 7,200 -> +1,440 = 20% -> serious; or a "September Fuel actual missing" row.
report("BU-04", "committed data, September Fuel actual blank (not entered yet)",
  "serious Fuel row (20% over on Jun-Aug: 8,640 vs 7,200) or a 'Sep actual missing' row",
  () => {
    const t = budgetCSV(budgetLines.map((l) => (l === "2026-09,Fuel,2400,3000" ? "2026-09,Fuel,2400," : l)));
    const s = budgetStatus(parseCSV(t)).find((x) => x.category === "Fuel"), a = realWith({ budget: parseCSV(t) }).filter((e) => e.area === "Budget");
    return { a, text: `Fuel actual=${JSON.stringify(s.actual)} (${typeof s.actual}) pct=${s.pct}; ${fmt(a)}` };
  },
  ({ a }) => a.some((e) => e.subject === "Fuel"));

// BU-05. A warranty refund entered as an accounting-style credit "(300)" on its own Repairs row. By hand Repairs actual
// = 9,000 - 300 = 8,700 vs 7,200 -> +1,500 = 20.8% -> serious; or the row reported as unreadable.
report("BU-05", "committed data + a Repairs credit written '(300)'",
  "serious Repairs row (8,700 vs 7,200 = 21% over) or an 'unreadable amount' row",
  () => {
    const t = budgetCSV([...budgetLines, "2026-09,Repairs,0,(300)"]);
    const s = budgetStatus(parseCSV(t)).find((x) => x.category === "Repairs"), a = realWith({ budget: parseCSV(t) }).filter((e) => e.area === "Budget");
    return { a, text: `Repairs actual=${JSON.stringify(s.actual)} pct=${s.pct}; ${fmt(a)}` };
  },
  ({ a }) => a.some((e) => e.subject === "Repairs"));

// BU-06. The season plan loaded up front: Oct and Nov rows with budget and actual 0 (not spent yet), appended to the
// committed data. Season to date (as_of Sep 30) is still Jun-Sep, so Fuel and Repairs stay 21% / 25% over -> serious.
report("BU-06", "committed data + Oct/Nov plan rows (actual 0) after as_of",
  "serious Fuel (21%, $2,040) and serious Repairs (25%, $1,800), as without the future rows",
  () => {
    const plan = ["Feed and mineral,6200", "Fuel,2400", "Repairs,1800", "Vet and health,1500", "Labor,9000", "Water and fencing,1200"];
    const t = budgetCSV([...budgetLines, ...["2026-10", "2026-11"].flatMap((m) => plan.map((c) => `${m},${c},0`))]);
    const a = realWith({ budget: parseCSV(t) }).filter((e) => e.area === "Budget");
    const s = budgetStatus(parseCSV(t)).filter((x) => x.category === "Fuel" || x.category === "Repairs").map((x) => `${x.category} ${x.actual}/${x.budget} = ${(x.pct * 100).toFixed(1)}%`);
    return { a, text: `${s.join("; ")}; ${fmt(a)}` };
  },
  ({ a }) => has(a, "serious", "Fuel", /^21% over/) && has(a, "serious", "Repairs", /^25% over/));

// BU-07. September Fuel row missing entirely (all other categories have Sep). By hand Fuel then covers Jun-Aug only
// (8,640 vs 7,200 = 20%), but every other category covers Jun-Sep; "season to date" no longer means the same months.
// Expected: a notice that Fuel has no September row.
report("BU-07", "committed data with the September Fuel row deleted",
  "some row saying Fuel has no 2026-09 entry (alerts otherwise: Fuel 20% over, Repairs 25% over)",
  () => {
    const t = budgetCSV(budgetLines.filter((l) => !l.startsWith("2026-09,Fuel,")));
    const a = realWith({ budget: parseCSV(t) }).filter((e) => e.area === "Budget");
    return { a, text: fmt(a) };
  },
  ({ a }) => a.some((e) => /2026-09|September|Sep/.test(e.problem)));

// BU-08. Exactly 5.0% over: 1,050 vs 1,000. The rules table and README say "5-10% over budget" -> warning.
report("BU-08", "exactly 5.0% over (1,050 vs 1,000)",
  "warning | X | 5% over season to date (rules text '5-10%')",
  () => { const a = budgetOnly("2026-09,X,1000,1050"); return { a, text: fmt(a) }; },
  ({ a }) => has(a, "warning", "X"));

// BU-09. 9.6% (1,096 vs 1,000) and 10.4% (1,104 vs 1,000): one is a warning, the other serious, so their texts must
// differ; by hand they are "9.6%" and "10.4%".
report("BU-09", "9.6% and 10.4% over print the same '10% over' at different severities",
  "different percentages in the two texts (e.g. '9.6% over' warning vs '10.4% over' serious)",
  () => {
    const lo = budgetOnly("2026-09,X,1000,1096"), hi = budgetOnly("2026-09,X,1000,1104");
    return { lo, hi, text: `9.6%: ${fmt(lo)}  ##  10.4%: ${fmt(hi)}` };
  },
  ({ lo, hi }) => lo[0] && hi[0] && lo[0].problem.split(" season")[0] !== hi[0].problem.split(" season")[0]);

// BU-10. Exactly 10.00% over in cents. Budgets 1,265.97 + 1,631.60 + 1,855.07 + 2,666.36 = 7,419.00 (741,900 cents);
// actuals 2,041.13 + 2,043.68 + 2,039.34 + 2,036.75 = 8,160.90 (816,090 cents). Over = 74,190 cents = 10.000% exactly,
// so by the same rule as HB-C7 (1,100 vs 1,000) it's a warning. Checked here with integer cents (BigInt), not floats.
report("BU-10", "exactly 10.00% over when amounts have cents",
  "warning (same as the whole-dollar 1,100 vs 1,000 case)",
  () => {
    const B = ["1265.97", "1631.6", "1855.07", "2666.36"], A = ["2041.13", "2043.68", "2039.34", "2036.75"];
    const cents = (s) => BigInt(Math.round(+s * 100));
    const sb = B.map(cents).reduce((x, y) => x + y), sa = A.map(cents).reduce((x, y) => x + y);
    const exactTenPct = (sa - sb) * 10n === sb;
    const body = B.map((b, i) => `2026-0${6 + i},X,${b},${A[i]}`).join("\n");
    const s = budgetStatus(parseCSV(BUDGET_HEAD + "\n" + body))[0], a = budgetOnly(body);
    return { a, exactTenPct, text: `integer-cent check: budget ${sb}c actual ${sa}c exactly 10% = ${exactTenPct}; code budget=${s.budget} actual=${s.actual} pct=${s.pct}; ${fmt(a)}` };
  },
  ({ a, exactTenPct }) => exactTenPct && has(a, "warning", "X"));

// BU-11. Dollar text in the alert. Over by $104.50 (1,104.50 vs 1,000). Money elsewhere on the page is whole dollars
// ("+$105" in the table), so expected "$105" (or "$104.50"); and a warning row should carry dollars too.
report("BU-11", "alert dollar amount formatting (over by 104.50) and warning rows without dollars",
  "serious text with '$105' or '$104.50'; warning text (1,060 vs 1,000) with '$60'",
  () => {
    const s = budgetOnly("2026-09,X,1000,1104.5"), w = budgetOnly("2026-09,X,1000,1060");
    return { s, w, text: `serious: ${fmt(s)}  ##  warning: ${fmt(w)}` };
  },
  ({ s, w }) => s[0] && /\$(105|104\.50)\b/.test(s[0].problem) && w[0] && /\$60/.test(w[0].problem));

// BU-12. Dollar significance. $30 over on a $200 category is 15% (serious); $9,500 over on $100,000 is 9.5% (warning);
// $4,000 over on $100,000 is 4% (no row). A manager would rank the $9,500 overrun above the $30 one.
report("BU-12", "a $30 overrun outranks a $9,500 overrun; $4,000 gets nothing",
  "the $9,500 overrun ranked at least as high as the $30 one",
  () => {
    const a = budgetOnly("2026-09,Ear tags,200,230\n2026-09,Feed,100000,109500\n2026-09,Hay,100000,104000");
    return { a, text: fmt(a) };
  },
  ({ a }) => { const r = { critical: 0, serious: 1, warning: 2 }; const t = a.find((e) => e.subject === "Ear tags"), f = a.find((e) => e.subject === "Feed"); return !!f && (!t || r[f.severity] <= r[t.severity]); });

// BU-13. Ranking on the committed data. Within "serious" the tie-break is the area name A-Z, so Budget comes first.
// Operational judgment: a silent water sensor on a pasture and an overdue vaccination come before a fuel overrun.
report("BU-13", "committed data: serious rows ordered Budget, Gain, Grazing, Health, Water (alphabetical)",
  "the serious Water (T6 silent) and Health (booster overdue) rows above the serious Budget rows",
  () => {
    const s = realWith({}).filter((e) => e.severity === "serious");
    return { s, text: s.map((e, i) => `${i + 1}. ${e.area}: ${e.subject}`).join(" | ") };
  },
  ({ s }) => { const i = (f) => s.findIndex(f); const bud = i((e) => e.area === "Budget"); return i((e) => e.area === "Water") < bud && i((e) => e.area === "Health") < bud; });

// ================================================================== Part 2: app.js in headless Chromium
console.log("=== Part 2: app.js (headless Chromium) ===\n");

const PW = process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs";
const add = (...rows) => budgetCSV([...budgetLines, ...rows]);
const PLAN = ["Feed and mineral,6200", "Fuel,2400", "Repairs,1800", "Vet and health,1500", "Labor,9000", "Water and fencing,1200"];
const tuned = (js) => js.replace("budgetWarn: 0.05,", "budgetWarn: 0.07,");

// Each case: [id, title, budget.csv text (or null = committed), exceptions.js transform (or null), expected, check(state)]
// Tile arithmetic by hand: committed tb = 24,800 + 9,600 + 7,200 + 6,000 + 36,000 + 4,800 = 88,400;
// ta = 24,002 + 11,640 + 9,000 + 5,945 + 34,259 + 4,457 = 89,303 -> +903 / 88,400 = +1.02% -> "+1.0%".
const AB = [
  ["AB-00", "committed data (control)", null, null,
    "tile 'Spend vs budget +1.0% $89,303 of $88,400'; 6 bars, labels Repairs +25%, Fuel +21%, Vet and health −1%, Feed and mineral −3%, Labor −5%, Water and fencing −7%; no NaN attributes",
    (s) => /\+1\.0%/.test(s.tile) && /\$89,303 of \$88,400/.test(s.tile) && s.bars.length === 6 && s.nanAttrs === 0 &&
      s.labels.join(" ") === "Repairs +25% Fuel +21% Vet and health −1% Feed and mineral −3% Labor −5% Water and fencing −7%"],
  // Hay 0/500: tile tb 88,400, ta 89,803 -> +1,403 = +1.6%. The 6 real categories keep finite bars.
  ["AB-01", "committed data + 'Hay' budget 0, actual 500", add("2026-09,Hay,0,500"), null,
    "6 real categories drawn with finite coordinates (Hay shown as 'no budget'); no 'Infinity' text; tile +1.6%",
    (s) => s.nanAttrs === 0 && !/Infinity/.test(s.excText + s.labels.join(" ")) && /\+1\.6%/.test(s.tile)],
  ["AB-02", "committed data + 'Hay' budget 0, actual 0 (placeholder)", add("2026-09,Hay,0,0"), null,
    "chart drawn with finite coordinates; no 'NaN' label; tile +1.0%",
    (s) => s.nanAttrs === 0 && !/NaN/.test(s.labels.join(" ")) && /\+1\.0%/.test(s.tile)],
  // Blank budget cell: by hand budget total stays 88,400, actual 89,803 -> +1.6%.
  ["AB-03", "committed data + 'Hay' with a blank budget cell, actual 500", add("2026-09,Hay,,500"), null,
    "tile '+1.6%  $89,803 of $88,400'",
    (s) => /\+1\.6%/.test(s.tile) && /\$89,803 of \$88,400/.test(s.tile)],
  // Every actual set equal to its budget: by hand 88,400 of 88,400, 0.0%, every category exactly on budget.
  ["AB-04", "every category exactly on budget", budgetCSV(budgetLines.map((l) => { const c = l.split(","); c[3] = c[2]; return c.join(","); })), null,
    "tile '0.0%' with no minus sign (or 'on budget'); bar labels '0%' with no minus; tooltip not 'Under by $0'",
    (s) => /SPEND VS BUDGET 0\.0%|on budget/i.test(s.tile) && !s.labels.some((l) => /−0%/.test(l)) && !/Under by \$0/.test(s.tip)],
  ["AB-05", "budget.csv with only its header (no budget loaded yet)", BUDGET_HEAD + "\n", null,
    "tile says there is no budget data (no 'NaN')",
    (s) => !/NaN/.test(s.tile)],
  ["AB-06", "RULES.budgetWarn tuned to 0.07 (the README invites tuning)", null, tuned,
    "rules row 'A category is 7-10% over budget'",
    (s) => s.rules.some((r) => /7-10% over budget/.test(r))],
  // Season to date with Oct/Nov plan rows (actual 0): by hand still 89,303 of 88,400 = +1.0%, Fuel and Repairs flagged.
  ["AB-07", "committed data + Oct/Nov plan rows, actual 0", add(...["2026-10", "2026-11"].flatMap((m) => PLAN.map((c) => `${m},${c},0`))), null,
    "tile '+1.0%  $89,303 of $88,400'; Fuel and Repairs rows in the report",
    (s) => /\+1\.0%/.test(s.tile) && /\$89,303 of \$88,400/.test(s.tile) && /Fuel/.test(s.excText) && /Repairs/.test(s.excText)],
  // September Fuel actual blank: by hand, leaving Sep Fuel out of both sides, 86,303 of 86,000 = +0.4%.
  // Any honest answer is a small percentage and totals under $100,000.
  ["AB-08", "committed data, September Fuel actual blank", budgetCSV(budgetLines.map((l) => (l === "2026-09,Fuel,2400,3000" ? "2026-09,Fuel,2400," : l))), null,
    "tile a small finite percentage (about +0.4%) with totals under $100,000; Fuel still flagged or marked missing",
    (s) => /SPEND VS BUDGET [+−]\d{1,2}\.\d%/.test(s.tile) && !/\d{3},\d{3},\d{3}/.test(s.tile) && /Fuel/.test(s.excText)],
  // A category 40% under budget: Water and fencing actual = 60% of 1,200 = 720 each month.
  ["AB-09", "a category 40% under budget (Water and fencing 720 of 1,200 a month)",
    budgetCSV(budgetLines.map((l) => (l.includes(",Water and fencing,") ? l.replace(/,\d+$/, ",720") : l))), null,
    "the '−40%' bar label does not overlap the 'Water and fencing' category label",
    (s) => s.overlap === false],
  ["AB-10", "committed data + Repairs credit written '(300)'", add("2026-09,Repairs,0,(300)"), null,
    "chart drawn with finite coordinates; Repairs row in the report (8,700 vs 7,200)",
    (s) => s.nanAttrs === 0 && /Repairs/.test(s.excText)],
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
    work = mkdtempSync(join(process.env.HB_REPRO_TMP || tmpdir(), "healthbudget-repro-"));
    for (const f of ["index.html", "app.js", "exceptions.js", "data"]) cpSync(join(ROOT_DIR, f), join(work, f), { recursive: true });
    const EXC_JS = readFileSync(join(work, "exceptions.js"), "utf8");
    let port = Number(process.env.HB_REPRO_PORT || 8870), base = null;
    for (; port <= 8879 && !base; port++) {
      const busy = await fetch(`http://127.0.0.1:${port}/`).then(() => true, () => false);
      if (busy) continue;
      server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", work], { stdio: "ignore" });
      if (await waitFor(`http://127.0.0.1:${port}/index.html`, 5000)) base = `http://127.0.0.1:${port}`;
      else { server.kill(); server = null; }
    }
    if (!base) throw new Error("no free port in 8870-8879 or python3 http.server did not start");
    console.log(`(serving a copy from ${work} at ${base})\n`);
    browser = await chromium.launch();
    for (const [id, title, budgetText, excTransform, expected, check] of AB) {
      console.log(`CASE ${id}  ${title}`);
      console.log(`  expected: ${expected}`);
      let page = null;
      try {
        page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        const errorsSeen = [], consoleSeen = [];
        page.on("pageerror", (e) => errorsSeen.push(e.message));
        page.on("console", (m) => m.type() === "error" && consoleSeen.push(m.text()));
        if (budgetText !== null) await page.route("**/data/budget.csv", (route) => route.fulfill({ status: 200, contentType: "text/csv", body: budgetText }));
        if (excTransform) await page.route("**/exceptions.js", (route) => route.fulfill({ status: 200, contentType: "text/javascript", body: excTransform(EXC_JS) }));
        await page.goto(`${base}/index.html`, { waitUntil: "networkidle" });
        await page.waitForFunction(() => document.querySelectorAll("#rules tr").length > 1, null, { timeout: 5000 }).catch(() => {});
        const st = await page.evaluate(() => {
          const q = (s) => [...document.querySelectorAll(s)];
          const norm = (t) => t.replace(/\s+/g, " ").trim();
          const tile = q("#tiles .tile").map((t) => norm(t.innerText)).find((t) => /spend vs budget/i.test(t)) || "(no tile)";
          const svg = document.querySelector("#budgetChart svg");
          const all = svg ? [...svg.querySelectorAll("*")] : [];
          let nanAttrs = 0;
          for (const el of all) for (const a of el.attributes) if (/NaN|Infinity/.test(a.value)) nanAttrs++;
          const bars = svg ? [...svg.querySelectorAll("rect")].filter((r) => /div-(pos|neg)/.test(r.getAttribute("fill"))) : [];
          const lbls = svg ? [...svg.querySelectorAll("text.lbl")] : [];
          // category label and its value label alternate: [cat, value, cat, value, ...]
          const labels = lbls.map((t) => t.textContent);
          let overlap = null;
          const wf = lbls.findIndex((t) => t.textContent === "Water and fencing");
          if (wf >= 0 && lbls[wf + 1]) {
            const a = lbls[wf].getBBox(), b = lbls[wf + 1].getBBox();
            overlap = !(a.x + a.width <= b.x || b.x + b.width <= a.x);
          }
          let tip = "";
          if (bars[0]) {
            bars[bars.length - 1].dispatchEvent(new PointerEvent("pointermove", { clientX: 20, clientY: 20, bubbles: true }));
            tip = norm(document.getElementById("tip").innerText);
          }
          return {
            tile, bars: bars.map((b) => `${b.getAttribute("x")}/${b.getAttribute("width")}`), nanAttrs, labels, overlap, tip,
            excText: q("#exceptions tr").map((r) => norm(r.innerText)).filter((r) => /Budget/.test(r)).join(" || "),
            budgetTable: q("#budgetTable tr").map((r) => norm(r.innerText)),
            rules: q("#rules tr").map((r) => norm(r.innerText)).filter((r) => /^Budget/.test(r)),
          };
        });
        st.errors = errorsSeen; st.console = consoleSeen;
        console.log(`  actual:   tile="${st.tile}"`);
        console.log(`            budget report rows=${JSON.stringify(st.excText)}`);
        console.log(`            chart bars (x/width)=${JSON.stringify(st.bars)}; attributes with NaN/Infinity=${st.nanAttrs}`);
        console.log(`            chart labels=${JSON.stringify(st.labels)}`);
        if (id === "AB-00") console.log(`            budget table=${JSON.stringify(st.budgetTable)}`);
        if (id === "AB-04") console.log(`            tooltip on last bar="${st.tip}"; table=${JSON.stringify(st.budgetTable.slice(1, 3))}`);
        if (id === "AB-06") console.log(`            budget rules rows=${JSON.stringify(st.rules)}`);
        if (id === "AB-09") console.log(`            'Water and fencing' label overlaps its value label: ${st.overlap}`);
        console.log(`            page errors=${JSON.stringify(st.errors)}; console errors=${st.console.length} ${JSON.stringify(st.console.slice(0, 1))}`);
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
