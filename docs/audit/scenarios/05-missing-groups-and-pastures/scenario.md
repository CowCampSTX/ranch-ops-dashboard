# 05. Missing groups and pastures

**The case.** Three reference problems that come from ordinary ranch changes:

- the yearlings were renamed "Steers" in every file, so there is no group called 'Yearlings';
- the cows' open stay names pasture P9, which is not in pastures.csv (a new lease, or a typo);
- a group, Bulls, appears in moves.csv but not in groups.csv.

A manager needs each unknown reference reported once, plainly. Everything else must still be judged, including the
critical water tanks.

All data is fictional (Example Ranch). The thresholds are demonstration settings.

## Files

| File | Status | Change |
|---|---|---|
| groups.csv | changed | `Yearlings,yearling steers,150,2.0` becomes `Steers,yearling steers,150,2.0` |
| moves.csv | changed | The 7 Yearlings rows are renamed Steers. `Cows,P7,2026-09-12,` becomes `Cows,P9,2026-09-12,`. `Bulls,P8,2026-09-25,` is added. |
| weights.csv | changed | The group column 'Yearlings' becomes 'Steers' on all 450 yearling rows. The tags keep their Y prefix. |
| health.csv | changed | HLTH-03 fix. The Booster vaccine and Deworm rows now name 'Steers'. |
| meta.csv | changed | `2026-09-30T18:00,America/Chicago` |
| tanks.csv | added | T1-T8 |
| pastures, water, budget | copied unchanged | |

## Expected Phase-1 result (12 rows)

The 10 planted rows, with 'Steers' in place of 'Yearlings':

- T2 critical 11.8%;
- T4 critical, fell 46.0 points;
- T6 serious, 42 h;
- Steers in Sand Hills serious, day 24 of 21;
- Heifers serious, 0.4363;
- 6 steers warning: Y027, Y031, Y058, Y082, Y129, Y132;
- Steers: Booster vaccine serious, 15 days overdue;
- Cows: Pinkeye check warning, 3 days;
- Fuel serious, 21.25% / $2,040;
- Repairs serious, 25.0% / $1,800.

Two data issues are added:

| State | Area | Subject | Expected |
|---|---|---|---|
| Data issue (or can't tell) | Grazing | Cows | the open stay names P9, which is not in pastures.csv. No plan to judge against, so no grazing alarm. |
| Data issue | Grazing | Bulls | Bulls appear in moves.csv but not in groups.csv |

Must not appear:

- a Cows grazing alarm;
- a Bulls grazing alarm (Home Trap's plan is 10 days, and Sep 25 to Sep 30 is day 5, so no alarm either way);
- `undefined` anywhere.

| Tile | Expected |
|---|---|
| Gain | Draws for whatever groups exist. No hard-coded 'Yearlings' (LOAD-03). |

## Arithmetic

The numbers are those of scenario 01; only the name changes. Steers pooled 16,608 / 8,550 = 1.9425, which is at least
1.6. The six named steers are under 1.0.

## Current result (verified in this step by `scenarios.run.mjs`)

MISMATCH in both modes. 0 of 12 rows match, and every area is in error.

- **The rules crash.** "TypeError: Cannot read properties of undefined (reading 'name') (at exceptions.js:59)". The
  P9 stay has no pasture, and `p.name` throws. "ON THE PAGE: findExceptions throws at app.js:222: the page draws
  nothing below the header". In the browser: "CURRENT TILES ERROR: no tiles on the page" and "rules table never drawn
  within 4 s".
- The critical T2 and T4 tanks, the overdue booster and both budget overruns are all hidden, and the page gives no
  reason. This reproduces DATA-01 ("Unknown pasture, tank or group references crash the page or silently drop data").
  It is the same failure as the registry's evidence "G-01 'threw TypeError: Cannot read properties of undefined
  (reading 'name')'".
- **The gain tile would crash even with P9 fixed.** In node mode the runner ran its port of app.js `tiles()` with no
  exception rows. It reports: "the tiles() port would also throw TypeError: Cannot read properties of undefined
  (reading 'adg')". The tile looks up the 'Yearlings' group by name (LOAD-03).

## Findings and rules exercised

DATA-01, LOAD-02, LOAD-03; RULE-GRZ-01.

## Assumptions

- Whether a stay in an unknown pasture is a data issue or CAN'T TELL is a wording choice; both are accepted. Either
  way it must name P9 and must not raise an overstay alarm.
- The Bulls group is not judged on gain (it has no target and no weigh-ins). The expected result does not say whether
  Bulls count toward 'Head on grass'. That is a UI-18 / GRZ-07 question for phase 2.
