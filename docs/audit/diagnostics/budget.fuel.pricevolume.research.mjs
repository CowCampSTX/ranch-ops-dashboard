// Budget research diagnostic (research-budget): how much of the committed Fuel overrun COULD be price rather than use,
// and how big each category's overrun is against the whole season budget. Illustration only (class D): the dashboard's
// budget.csv is fictional and has no gallons or $/gal, so the "implied gallons" below are what the fictional dollars
// would buy at a public reference price, not a measurement.
// Run from the repo root:  node docs/audit/diagnostics/budget.fuel.pricevolume.research.mjs
//
// Reference price: EIA "Midwest No 2 Diesel Retail Prices" (PADD 2), monthly, $/gal incl. all taxes, as returned by
// WebFetch of https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EMD_EPD2D_PTE_R20_DPG&f=M on 2026-10-16.
// On-highway retail includes road taxes that dyed farm diesel does not pay, so real farm $/gal is lower; the SHAPE
// (price rising through the season) is the point, not the level. It modifies no repo files.

import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, budgetStatus } = await import(new URL("exceptions.js", ROOT).href);
const rows = parseCSV(readFileSync(new URL("data/budget.csv", ROOT), "utf8"));

const EIA_PADD2 = { "2026-01": 3.444, "2026-06": 4.984, "2026-07": 4.825, "2026-08": 5.417, "2026-09": 6.351 };
const PLAN_PRICE = EIA_PADD2["2026-01"]; // hypothetical: budget priced in January at the January reference price

console.log(`Hypothetical: Fuel budget priced at $${PLAN_PRICE}/gal (EIA PADD2 Jan-2026); actual priced at that month's EIA PADD2 price`);
console.log("month    budget$ actual$  plan_gal  impl_gal  price_var$  volume_var$  total_var$");
let tp = 0, tv = 0;
for (const r of rows.filter((x) => x.category === "Fuel")) {
  const planGal = r.budget / PLAN_PRICE, px = EIA_PADD2[r.month], implGal = r.actual / px;
  const priceVar = (px - PLAN_PRICE) * implGal;          // actual gallons x price difference
  const volVar = (implGal - planGal) * PLAN_PRICE;        // gallon difference x planned price
  tp += priceVar; tv += volVar;
  console.log(`${r.month}  ${String(r.budget).padStart(7)} ${String(r.actual).padStart(7)}  ${planGal.toFixed(0).padStart(8)}  ${implGal.toFixed(0).padStart(8)}  ` +
    `${priceVar.toFixed(0).padStart(10)}  ${volVar.toFixed(0).padStart(11)}  ${(r.actual - r.budget).toFixed(0).padStart(10)}`);
}
console.log(`season   price variance $${tp.toFixed(0)}  volume variance $${tv.toFixed(0)}  sum $${(tp + tv).toFixed(0)}\n`);

// Overrun as a share of the whole season's operating budget: one way to make a dollar floor scale with ranch size.
const st = budgetStatus(rows), total = st.reduce((s, c) => s + c.budget, 0);
console.log(`Season-to-date total budget (all categories, Jun-Sep): $${total}`);
for (const c of st) console.log(`  ${c.category.padEnd(18)} over $${String(c.variance).padStart(6)}  ${(c.pct * 100).toFixed(1).padStart(6)}% of category  ` +
  `${((c.variance / total) * 100).toFixed(2).padStart(6)}% of total budget`);
