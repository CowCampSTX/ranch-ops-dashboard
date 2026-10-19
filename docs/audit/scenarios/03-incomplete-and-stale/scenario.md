# 03. Incomplete and stale data

**The case.** Four things a real export does, all on the same day:

- the health file is missing;
- the heifers missed their September weigh-in, so their newest weights are 72 days old;
- one tank sensor (T7) stopped reporting 30 hours ago;
- another tank (T8) does not appear in the water export at all;
- a September budget actual (Vet and health) was not entered yet.

A manager needs the dashboard to say plainly what it cannot judge. Missing, old or incomplete data must never read as
"OK". This scenario checks LOAD-01 ("Missing, unreadable or empty data files read as 'nothing needs attention' for
that area"), GAIN-08 ("Old weigh-ins are presented as current"), WAT-02 ("There is no tanks master list") and BUD-01 /
BUD-02 (blank actuals).

All data is fictional (Example Ranch). The thresholds are demonstration settings (`../settings.json`). The 45-day
weigh-in age limit is a demonstration value (GAIN-08), not a validated one.

## Files

| File | Status | Change |
|---|---|---|
| health.csv | **absent** | Removed from the folder. The browser gets a 404; node mode reads it as an empty body. |
| weights.csv | changed | The 45 heifer rows dated 2026-09-15 are removed. Each heifer's newest weigh-in is now 2026-07-20. |
| water.csv | changed | T7: the 5 rows after 2026-09-29T12:00 are removed, so the last reading is 2026-09-29T12:00 at 65.7%. T8: all 120 rows are removed. |
| budget.csv | changed | `2026-09,Vet and health,1500,` (actual blank; committed value 1520) |
| meta.csv | changed | `2026-09-30T18:00,America/Chicago` |
| tanks.csv | added | T1-T8 with pastures P1-P8 |
| pastures, groups, moves | copied unchanged | |

## Expected Phase-1 result (12 rows)

| State | Severity | Area | Subject | Key numbers |
|---|---|---|---|---|
| Needs attention | Critical | Water | T2 | 11.8% |
| Needs attention | Critical | Water | T4 | fell 46.0 points in the window, now 10.0% |
| Needs attention (or can't tell) | Serious | Water | T6 | 42 hours silent, last 98.5% |
| Needs attention (or can't tell) | Serious | Water | T7 | 30 hours silent, last 65.7% |
| Can't tell | Serious | Water | T8 | no readings in the export (listed in tanks.csv) |
| Needs attention | Serious | Grazing | Yearlings in Sand Hills | day 24 of 21, 3 over |
| Can't tell | - | Gain | Heifers | latest weigh-in 2026-07-20, 72 days old |
| Needs attention | Warning | Gain | 6 yearlings | Y027, Y031, Y058, Y082, Y129, Y132 under 1.0 |
| Data issue | - | Health | health.csv | the file is missing, so health cannot be judged |
| Needs attention | Serious | Budget | Fuel | 21.25%, $2,040 |
| Needs attention | Serious | Budget | Repairs | 25.0%, $1,800 |
| Data issue | - | Budget | Vet and health | 2026-09 actual not entered |

Area states: Water, Grazing, Gain and Budget need attention. **Health is CAN'T TELL, never OK.**

Must not appear:

- a Heifers group verdict;
- a heifer animal row built from the old June to July period;
- a Vet and health over or under figure (its season total is incomplete);
- `NaN`, `Infinity` or `undefined`.

| Tile | Expected |
|---|---|
| Water | 3 of 8 OK (T1, T3, T5); 5 need a look or can't be judged (T2, T4, T6, T7, T8) |
| Spend vs budget | A sane figure: no `NaN`, `Infinity` or `e+`, and a percent under 100. The tile names the incomplete category or says CAN'T TELL (checked by hand). |

## Arithmetic, by hand

- **T7:** the last reading is 2026-09-29T12:00 at 65.7. Sep 29 12:00 to Sep 30 18:00 is 12 + 18 = 30 hours, which is 24
  or more, so serious.
- **T8:** tanks.csv lists T8 in P8, and water.csv has no T8 row. The tank cannot be judged and is not counted as OK.
- **Heifers:** the newest weigh-in is Jul 20. Jul 20 to Sep 30 is 11 + 31 + 30 = 72 days, more than the 45-day demo
  limit, so CAN'T TELL. No group or animal verdict.
- **Yearlings, Fuel, Repairs, T2, T4, T6, Grazing:** the same as scenario 01 (yearlings 16,608 / 8,550 = 1.9425; Fuel
  11,640 vs 9,600; Repairs 9,000 vs 7,200).
- **Vet and health:** Jun to Aug actuals 1,555 + 1,476 + 1,394 = 4,425, with September blank. The season to date
  cannot be totalled, so no percent is shown.

## Current result (verified in this step by `scenarios.run.mjs`)

MISMATCH in both modes. 8 of 12 rows match, 1 row is unexpected, 2 of 3 absences hold, 4 of 5 area states and 0 of 2
tiles match.

- **Health shows OK.** In node mode the missing file is read as an empty body. In the browser, app.js:221 fetches
  `data/health.csv`, does not check the response status, and parses the 404 body as a CSV with a header and no rows.
  Either way: "MISMATCH Health   expected cant-tell, current ok". That is LOAD-01 reproduced.
- **An old-period alert is shown as current.** "[warning] Gain | 4 heifers | Under 0.5 lbs/day: H014, H017, H025,
  H033". The current code takes each heifer's last two weigh-ins (Jun 1 and Jul 20), so this verdict is about June and
  July. The row does not say so (GAIN-08). There is no Heifers group row: the 72-day-old data hides the September
  problem behind an animal warning.
- **T8 disappears.** "current 3 of 7 | 4 need a look". The tile counts the tanks it finds in water.csv (7), not the 8
  the ranch has (WAT-02).
- **T7 is reported correctly:** "[serious] Water | Tank T7 (South Divide, Cows here now) | No reading for 30 hours;
  last level 65.7%".
- **The budget tile shows joined text.** "+505005006043558.9% | $446,424,425,342,594,400 of $88,400". The blank cell is
  kept as '' and the actuals are joined as text instead of added (BUD-02, CSV-04). No Vet and health row appears, so
  the expected absence holds, but only by accident.

## Findings and rules exercised

LOAD-01, LOAD-02, GAIN-08, WAT-02, BUD-01, BUD-02, CSV-04; RULE-WF-14, RULE-WAT-04, RULE-GAIN-10, RULE-HLTH-03,
RULE-BUD-05.

## Assumptions

- The 45-day weigh-in age limit is a demonstration value (`gainMaxAgeDays`).
- T6 and T7 may be shown as "needs attention: sensor silent" or as "can't tell: level unknown". Both are accepted
  (`state_alternatives`). RULE-WAT-04's phase note also asks the row to say to check the tank by eye (listed under
  `also_expected_in_phase_1` for T6; it is not part of the match).
- Node mode emulates a missing file as an empty body. The browser run serves a real 404.
