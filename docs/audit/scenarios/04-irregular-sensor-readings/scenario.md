# 04. Irregular sensor readings

**The case.** Real tank telemetry has these irregularities, and this folder puts one on each tank:

| Tank | Irregularity |
|---|---|
| T1 | A 72-hour gap |
| T3 | Two different readings at the same time |
| T5 | An exact duplicate row |
| T7 | Rows in reverse order |
| T6 | A reading stamped a month in the future |
| T8 | A fault code instead of a level |

A manager needs each tank judged on what is actually known. A drop over three days must not be reported as "in 24
hours". A future reading must not hide a silent sensor. A fault code must not count as a healthy tank.

All data is fictional (Example Ranch). The thresholds are demonstration settings.

## Files

| File | Status | Change |
|---|---|---|
| water.csv | changed | **T1:** the 12 rows from 2026-09-28T00:00 to 2026-09-30T18:00 are replaced by one row, `T1,P1,2026-09-30T18:00,56.2`. The reading before it is 2026-09-27T18:00 at 91.2. **T3:** `T3,P3,2026-09-30T18:00,20.0` is added just before the committed `T3,...,2026-09-30T18:00,91.5` row. **T5:** the 2026-09-30T12:00 row (58.8) appears twice. **T6:** `T6,P6,2026-10-29T00:00,97.0` is added. **T7:** its 120 rows are in reverse time order. **T8:** the 2026-09-30T18:00 level is `ERR` (committed 84.5). |
| health.csv | changed | HLTH-03 fix only |
| meta.csv | changed | `2026-09-30T18:00,America/Chicago` |
| tanks.csv | added | T1-T8 |
| others | copied unchanged | |

## Expected Phase-1 result (16 rows)

The 10 planted rows stay: T2, T4, T6, Yearlings grazing, Heifers gain, 6 yearlings, Booster, Pinkeye, Fuel and
Repairs, with the scenario 01 numbers. The irregular tanks add these:

| State | Severity | Subject | Expected |
|---|---|---|---|
| Can't tell | - | T1 | "not enough recent history" for the 24-hour change. The level, 56.2%, is above 40, so there is no level alarm. Must not contain "Dropped". |
| Needs attention | Critical | T3 | level **20.0%**: the lower of the two readings at the same time. Must not say "91.5% full". |
| Data issue | - | T3 | two different readings at 2026-09-30T18:00, both named (20.0 and 91.5) |
| Data issue | - | water.csv | 1 exact duplicate (T5 at 2026-09-30T12:00), dropped |
| Data issue | - | water.csv | 1 reading after the as-of time (T6, 2026-10-29), left out |
| Can't tell (or data issue) | Serious | T8 | the newest level is 'ERR'; the last good level was 80.4% at 2026-09-30T12:00 |

T6 is still serious: "No reading for 42 hours; last level 98.5%". The future row is left out, so the last real reading
is still 2026-09-29T00:00.

Must not appear: any T1 alert, any T5 alert, any T7 alert.

| Tile | Expected |
|---|---|
| Water | 2 of 8 OK (T5, T7); 6 need a look: T2, T3 and T4 critical; T1 (24-hour change unknown), T6 (silent) and T8 ('ERR') can't tell. |

## Arithmetic, by hand

- **T1:** the window [Sep 29 18:00, Sep 30 18:00] holds only the last reading, 56.2. With fewer than 2 readings, the
  24-hour change can't be judged. The old rule compares with the newest reading at least 24 h older (Sep 27 18:00,
  91.2): 91.2 - 56.2 = 35.0. That is a 72-hour change, reported as "in 24 hours" (WAT-03).
- **T3:** the lower reading is 20.0, which is under 25, so critical. Under the bounded window, the highest earlier
  reading in the window is 87.6, so 87.6 - 20.0 = 67.6 points. The tank is critical either way. The conservative choice
  (the lower value) follows WAT-07's proposed fix.
- **T5:** removing the duplicate leaves T5's readings unchanged. Its last level is 57.8, which is OK.
- **T6:** with the future row left out, the last reading is Sep 29 00:00, 42 hours before the as-of time.
- **T7:** after sorting, the series is the committed one. The last level is 61.3, which is OK.
- **T8:** 'ERR' is not a number between 0 and 100, so the newest level is unknown. The last good reading is 80.4 at
  Sep 30 12:00, 6 hours old.

## Current result (verified in this step by `scenarios.run.mjs`)

MISMATCH in both modes. 9 of 16 rows match, 1 row is unexpected, 2 of 3 absences hold, 5 of 5 area states match, and
0 of 1 tile.

- **False leak alarm on T1.** "[critical] Water | Tank T1 (North Flat) | Dropped 35 points in 24 hours, now 56.2%".
  This reproduces WAT-03.
- **T3 is missed.** The current code sorts by time, keeps the file order for equal times and takes the last row, 91.5.
  There is no T3 row (WAT-07, "the alert depends on which line comes last in the file").
- **T6's silent-sensor alert is lost.** "MISMATCH T6 ... current: none". The 2026-10-29 row becomes the last reading,
  so the silent hours are negative (TIME-01: "a later reading hides a silent sensor").
- **T8 is counted as OK.** No T8 row. `'ERR' < 25` is false and `80.4 - 'ERR'` is NaN, so every comparison fails
  (WAT-01).
- **T5 and T7 are handled correctly** (no rows), because the current sort and the last-row logic absorb them.
- **The water tile is too generous.** "current 5 of 8 | 3 need a look", where at most 3 OK are expected.

## Findings and rules exercised

WAT-01, WAT-03, WAT-07, DATA-02, DATA-03, TIME-01; RULE-WAT-01, RULE-WAT-03, RULE-WAT-04, RULE-WF-14.

## Assumptions

- The drop window is [last - 24 h, last] with at least 2 readings (`settings.json` `dropWindowMinReadings`, WAT-03's
  proposed fix). 02-findings.md 7.2 item 6 records the alternative ("the reading about 24 h before the latest").
  Under that alternative T1 also has no reading within one interval of 24 h, so it is still CAN'T TELL.
- Using the lower of two same-time readings is a recommendation (WAT-07), not a validated rule.
- T8 may be shown as CAN'T TELL, as a data issue or as an alert. Each is accepted (`state_alternatives`), as long as it
  is not counted as OK.
