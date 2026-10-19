# 07. Zero budgets, unbudgeted spending, a credit and future plan months

**The case.** Common bookkeeping shapes:

- **Unbudgeted categories.** Two lines carry no budget: Hay, with $500 spent in September, and Ear tags, with $200
  spent in July.
- **A credit.** A September refund on Water and fencing is written the accountant's way, as "(150)".
- **Future plan rows.** The plan for October and November is already in the file, with blank actuals.

A manager needs real overspends to stay visible. Unbudgeted spending should be shown in dollars, not as "Infinity%".
Future plan months must not dilute season-to-date figures.

All data is fictional (Example Ranch). The budget percentages, dollar lines and the $250 unbudgeted line are
demonstration settings (`../settings.json`).

## Files

| File | Status | Change |
|---|---|---|
| budget.csv | changed | `2026-09,Water and fencing,1200,(150)`. Hay rows Jun-Sep with budget 0 and actuals 0, 0, 0, 500. Ear tags rows Jun-Sep with budget 0 and actuals 0, 200, 0, 0. 2026-10 and 2026-11 rows for all 8 categories, at the monthly plan with blank actuals. |
| health.csv | changed | HLTH-03 fix |
| meta.csv | changed | `2026-09-30T18:00,America/Chicago` |
| tanks.csv | added | T1-T8 |
| others | copied unchanged | |

## Expected Phase-1 result (11 rows)

The 10 planted rows, with scenario 01's numbers (Fuel and Repairs unchanged: future months are not counted), plus:

| State | Severity | Subject | Expected |
|---|---|---|---|
| Needs attention | Warning | Hay | unbudgeted spending, $500, shown in dollars only. Must not contain '%' or 'Infinity'. |

Must not appear:

- an Ear tags row ($200 is under the $250 demo line);
- a Water and fencing row (under budget after the credit);
- a Feed, Vet or Labor row;
- `NaN` or `Infinity` anywhere.

Allowed extra: a plain note that the October and November plan rows are not counted yet. Calling their blank actuals
"not entered" is **not** allowed, because those months have not happened.

| Tile | Expected |
|---|---|
| Spend vs budget | **+0.3%**: $88,705 of $88,400 (Jun-Sep only) |

## Arithmetic, by hand

- **Fuel:** Jun-Sep 2,592 + 2,928 + 3,120 + 3,000 = 11,640 vs 9,600, so $2,040 and 21.25%. The October and November
  plan rows are after the as-of date and are not counted.
- **Repairs:** 9,000 vs 7,200, so $1,800 and 25.0%.
- **Water and fencing:** 1,126 + 1,100 + 1,083 + (-150) = 3,159 vs 4 x 1,200 = 4,800, under budget.
- **Hay:** budget 0. Actual 0 + 0 + 0 + 500 = $500, which is at least $250, so a warning in dollars. A percent over
  zero is undefined, so none is shown.
- **Ear tags:** budget 0. Actual $200, under $250, so no row.
- **Tile:** committed Jun-Sep actuals 89,303. Replacing Sep Water and fencing (1,148 to -150) gives -1,298; Hay and
  Ear tags add +700. 89,303 - 1,298 + 700 = 88,705. The budget is 88,400 (Hay and Ear tags add 0). 305 / 88,400 =
  +0.345%.

## Current result (verified in this step by `scenarios.run.mjs`)

MISMATCH in both modes. 8 of 11 rows match, 1 row is unexpected, 4 of 5 absences hold, 5 of 5 area states match, and
0 of 1 tile.

- **"Infinity%" rows.** "[serious] Budget | Hay | Infinity% over season to date ($500)" and "[serious] Budget | Ear
  tags | Infinity% over season to date ($200)". This reproduces BUD-03 ("A zero-budget category prints 'Infinity% over'").
- **The two real overspends disappear.** "MISMATCH FUEL ... current: none" and "MISMATCH REPAIRS ... current: none".
  The current code adds the October and November plan to the budget, but their blank actuals add nothing. Fuel is
  compared as 11,640 against 9,600 + 4,800 = 14,400, and Repairs as 9,000 against 10,800, so both look under budget.
  This reproduces BUD-01 ("future plan rows hide both real overspends"); the registry's BU-06 evidence gives the same
  pair of figures.
- **The tile breaks.** "current −NaN% | $NaN of $132,600". $132,600 is 88,400 plus two months of plan at 22,100
  (44,200). The "(150)" cell is kept as text and turns the actual into NaN (BUD-02).
- **Water and fencing is absent only by accident.** It has no row, which matches, but its variance is NaN rather than
  a real under-budget figure (exceptions.js:86-88: `c.actual += r.actual` with a text value).

## Findings and rules exercised

BUD-01, BUD-02, BUD-03, BUD-04, TIME-01; RULE-BUD-03, RULE-BUD-05, RULE-BUD-06, RULE-BUD-07.

## Assumptions

- The unbudgeted line ($250) and its severity (warning) follow RULE-BUD-06. The severity follows
  budget.materiality.research.mjs S4, quoted in RULE-BUD-06's evidence. Both are ranch choices, not validated values.
- "(150)" is read as -150, the accounting convention for a credit (BUD-02's proposed money parser).
- A month counts as closed when the as-of date is on or after its last day (BUD-01). See scenario 01, open decision 2.
