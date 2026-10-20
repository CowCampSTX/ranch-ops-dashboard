// Budget research diagnostic: compares the CURRENT budget rule in exceptions.js (percent over, season to date:
// >10% serious, >5% warning) with a PROPOSED combined percent-and-dollar materiality rule, on the committed data and
// on a few small research-motivated scenarios (small category, large category, phased vs straight-line plan,
// zero budget, refund/credit).
// Run from the repo root:  node docs/audit/diagnostics/budget.materiality.research.mjs
//
// It imports the REAL parseCSV / budgetStatus / findExceptions / RULES from exceptions.js for the "current" column.
// The "proposed" rule is written here only to show behaviour; every threshold in PROPOSED is a synthetic
// demonstration setting (class D), not a validated value. It modifies no repo files.
//
// Mechanics defects in the current rule (Infinity%, NaN, future months, blank cells, rounding, ordering) are already
// reproduced in docs/audit/diagnostics/healthbudget.repro.mjs (BU-01..BU-13); this script does not repeat them.

import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, budgetStatus, findExceptions, RULES } = await import(new URL("exceptions.js", ROOT).href);
const load = (f) => parseCSV(readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8"));
const EMPTY = { pastures: [], groups: [], moves: [], weights: [], water: [], health: [], budget: [], meta: [{ as_of: "2026-09-30T18:00" }] };

// ------------------------------------------------------------------ proposed rule (demo settings, class D)
export const PROPOSED = {
  warnPct: 0.05, seriousPct: 0.10,    // same percent bands as today, kept so the comparison isolates the dollar test
  warnUsd: 500, seriousUsd: 1000,     // dollar floor: an overrun must be at least this many dollars to count
  largeUsd: 2500,                     // dollar override: an overrun this big is at least a warning whatever the percent
  unbudgetedUsd: 250,                 // spend in a category with no budget: warn at this many dollars
};

/** rows: {month, category, budget, actual}. asOfMonth 'YYYY-MM'; months after it are plan only and are left out. */
export function proposedBudgetStatus(rows, asOfMonth, P = PROPOSED) {
  const cats = new Map();
  for (const r of rows) {
    if (r.month > asOfMonth) continue;                          // only months that are closed as of the report date
    const c = cats.get(r.category) ?? cats.set(r.category, { category: r.category, budget: 0, actual: 0, credits: 0 }).get(r.category);
    c.budget += r.budget; c.actual += r.actual;
    if (r.actual < 0) c.credits += r.actual;                    // refunds/credits posted as negative amounts
  }
  return [...cats.values()].map((c) => {
    const over = c.actual - c.budget;
    const pct = c.budget > 0 ? over / c.budget : null;          // percent is undefined with no budget: judge dollars only
    let severity = null, why = "";
    if (c.budget <= 0) {
      if (c.actual >= P.unbudgetedUsd) { severity = "warning"; why = `unbudgeted spend $${c.actual}`; }
    } else if (pct > P.seriousPct && over >= P.seriousUsd) { severity = "serious"; why = `${(pct * 100).toFixed(1)}% and $${over} over`; }
    else if (pct > P.warnPct && over >= P.warnUsd) { severity = "warning"; why = `${(pct * 100).toFixed(1)}% and $${over} over`; }
    else if (over >= P.largeUsd) { severity = "warning"; why = `$${over} over (only ${(pct * 100).toFixed(1)}%)`; }
    return { ...c, over, pct, severity, why, creditNote: c.credits < 0 ? `includes $${-c.credits} of credits` : "" };
  });
}

const currentAlerts = (rows) => findExceptions({ ...EMPTY, budget: rows }).filter((e) => e.area === "Budget");
const pctTxt = (p) => (p === null || !isFinite(p) ? String(p) : (p * 100).toFixed(1) + "%");

function compare(title, rows, asOfMonth = "2026-09") {
  console.log(`SCENARIO  ${title}`);
  const cur = currentAlerts(rows);
  const cstat = budgetStatus(rows);
  for (const p of proposedBudgetStatus(rows, asOfMonth)) {
    const c = cstat.find((x) => x.category === p.category);
    const a = cur.find((x) => x.subject === p.category);
    console.log(`  ${p.category.padEnd(18)} budget ${String(c.budget).padStart(6)} actual ${String(c.actual).padStart(6)} ` +
      `cur pct ${pctTxt(c.pct).padStart(7)} -> current: ${(a ? a.severity : "-").padEnd(7)} | proposed (closed months ` +
      `${String(p.budget).padStart(6)} vs ${String(p.actual).padStart(6)}): ${(p.severity ?? "-").padEnd(7)} ${p.why} ${p.creditNote}`);
  }
  console.log("");
}

console.log(`Current RULES: budgetWarn=${RULES.budgetWarn} budgetSerious=${RULES.budgetSerious}`);
console.log(`Proposed (demo): ${JSON.stringify(PROPOSED)}\n`);

// S1. Committed data, as-is.
const real = load("budget");
compare("S1 committed budget.csv (Jun-Sep 2026, flat monthly plan)", real);

// S2. Small vs large categories: a $30 overrun at 15% and a $2,700 overrun at 7.5%.
compare("S2 small category 15%/$30 vs large category 7.5%/$2,700 vs large 3%/$2,700", [
  { month: "2026-09", category: "Ear tags", budget: 200, actual: 230 },
  { month: "2026-09", category: "Labor", budget: 36000, actual: 38700 },
  { month: "2026-09", category: "Feed (big)", budget: 90000, actual: 92700 },
]);

// S3. Phasing. Repairs planned as a June overhaul (pre-season) then light months; actual follows that plan.
// Straight-line plan spreads the same $7,200 evenly. As of end of June, the straight-line plan calls a planned
// overhaul a 140% overrun; the phased plan says it is on plan.
const actualRepairs = [{ m: "2026-06", a: 4300 }, { m: "2026-07", a: 950 }, { m: "2026-08", a: 1000 }, { m: "2026-09", a: 950 }];
const phased = { "2026-06": 4200, "2026-07": 1000, "2026-08": 1000, "2026-09": 1000 };
const asOfJune = (plan) => actualRepairs.filter((x) => x.m <= "2026-06").map((x) => ({ month: x.m, category: "Repairs", budget: plan(x.m), actual: x.a }));
compare("S3a as of 2026-06, STRAIGHT-LINE plan (1,800/month), June overhaul as planned", asOfJune(() => 1800), "2026-06");
compare("S3b as of 2026-06, PHASED plan (4,200 in June), same actual", asOfJune((m) => phased[m]), "2026-06");

// S4. Zero budget with spend (current code: Infinity%; see BU-01) and a refund posted as a negative amount.
compare("S4 unbudgeted category + a Fuel refund of -300 in September", [
  { month: "2026-09", category: "Hay (unplanned)", budget: 0, actual: 1800 },
  { month: "2026-08", category: "Fuel", budget: 2400, actual: 3120 },
  { month: "2026-09", category: "Fuel", budget: 2400, actual: 2700 },
  { month: "2026-09", category: "Fuel", budget: 0, actual: -300 },
]);

// S5. Month-level view of the committed data: which single months were furthest over (a spike can hide in STD).
console.log("SCENARIO  S5 committed data, single-month variances over 20% (context for 'what drove it')");
for (const r of real) {
  const v = (r.actual - r.budget) / r.budget;
  if (v > 0.2) console.log(`  ${r.month} ${r.category.padEnd(10)} budget ${r.budget} actual ${r.actual} over $${r.actual - r.budget} (${(v * 100).toFixed(1)}%)`);
}
