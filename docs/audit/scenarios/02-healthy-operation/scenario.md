# 02. A healthy operation with sufficient data

**The case.** All ten planted problems are removed, every file is present, and every file is current up to the as-of
time. A manager should see nothing to act on, every area should read OK, and no area should read CAN'T TELL. This is
the false-alarm control for Phase 1. The new checks (data contract, as-of policy, coverage, staleness, tank master
list, materiality) must stay quiet on clean, complete data.

All data is fictional (Example Ranch). The thresholds are demonstration settings (`../settings.json`).

## Files

| File | Status | Change |
|---|---|---|
| water.csv | changed | T2: from Sep 26 18:00 onward the planted 3-point fall is replaced by a refill cycle. It starts at 62.8 (the Sep 26 12:00 value) and moves +4.1, -2.3, +1.6, -3.4, +2.8, -1.2, repeating. T4: the planted leak (Sep 29 18:00 onward) is replaced by 65.4, 68.8, 67.1, 69.3, 68.4. T6: the 7 missing readings from Sep 29 06:00 to Sep 30 18:00 are added: 95.3, 92.7, 94.6, 90.5, 92.9, 91.4, 93.0. |
| moves.csv | changed | The yearlings leave Sand Hills on the planned day (Sep 6 + 21 = Sep 27) for Windmill: `Yearlings,P3,2026-09-06,2026-09-27` then `Yearlings,P2,2026-09-27,`. |
| weights.csv | changed | Heifers' Sep 15 weight = Jul 20 weight + round(57 x (0.80 + 0.04 x (n mod 10))), where n is tag number - 1. The six planted slow yearlings' Sep 15 weight = Jul 20 weight + round(57 x 1.9) = + 108. |
| health.csv | changed | HLTH-03 fix (Fly tag check: done 2026-09-01, next_due blank). Booster vaccine: done 2026-09-15. Pinkeye check: open, due 2026-10-14. |
| budget.csv | changed | Fuel actuals 2,350 / 2,480 / 2,440 / 2,390. Repairs actuals 1,620 / 1,890 / 1,710 / 1,830. |
| meta.csv | changed | `as_of,timezone` = `2026-09-30T18:00,America/Chicago` |
| tanks.csv | added | T1-T8 with pastures P1-P8 (the generator's TANKS list) |
| pastures.csv, groups.csv | copied unchanged | |

## Expected Phase-1 result

No rows. Every area is OK: Water, Grazing, Gain, Health and Budget.

| Tile | Expected |
|---|---|
| Needs attention | 0: 0 critical, 0 serious, 0 warning |
| Water | 8 of 8 OK, 0 need a look |
| Spend vs budget | -3.4%: $85,373 of $88,400 |

## Arithmetic, by hand

- **Water.** Each tank's last reading is at Sep 30 18:00, so none is silent (0 hours). The lowest last level is T5 at
  57.8, which is above 40. Within [Sep 29 18:00, Sep 30 18:00], the largest fall (highest minus last) is T5's
  63.5 - 57.8 = 5.7. T2's window holds 70.1, 67.8, 69.4, 66.0 and 68.8, so 70.1 - 68.8 = 1.3. T4's window gives
  69.3 - 68.4 = 0.9, and T6's gives 94.6 - 93.0 = 1.6. T8 ends on a refill (65.0 down to 55.1, then up to 84.5), so
  its last reading is the highest. All are under 30.
- **Grazing.** Cows: South Divide since Sep 12, Sep 12 to Sep 30 = 18 days of 21, with 3 days left (more than 2).
  Heifers: Lone Tree since Sep 19, 11 days of 14, 3 days left. Yearlings: Windmill since Sep 27, 3 days of 18.
- **Gain.** Heifers gained 2,487 lbs over 2,565 animal-days: 2,487 / 2,565 = 0.9696, which is at least 0.8. The slowest
  heifer gained 46 / 57 = 0.807, which is at least 0.5. Yearlings: 17,062 / 8,550 = 1.9956, which is at least 1.6. The
  slowest yearlings (Y068, Y071, Y143) gained 79 / 57 = 1.386, which is at least 1.0. The weigh-in is Sep 15, 15 days
  before the as-of date, inside the 45-day limit. Coverage is 45 of 45 and 150 of 150.
- **Health.** Pinkeye is due Oct 14, 14 days away, which is more than 7. Pregnancy check: 25 days. Deworm: 32 days.
  Booster: done.
- **Budget.** Fuel: 9,660 vs 9,600 is $60 and 0.6%, under 5% and under $500. Repairs: 7,050 vs 7,200, under budget.
  Total: 85,373 - 88,400 = -3,027, and -3,027 / 88,400 = -3.4%.

## Current result (verified in this step by `scenarios.run.mjs`)

MATCH in both modes: no rows, 25 of 25 expected absences, 5 of 5 area states and 3 of 3 tiles. The current code
already gives a correct all-clear on clean data. This scenario matters for Phase 1, which adds many new checks. Any
row Phase-1 code shows here is a false alarm.

## Findings and rules exercised

UI-07 (all-clear wording; Phase 1 should say 'Nothing needs attention.'), LOAD-01 (the all-clear is shown only when
every area's data loaded), RULE-WF-21 (the settings are synthetic demonstration settings, so an all-clear here does not
mean a real operation is healthy).

## Assumptions

- The healthy values are invented for the fixture. They are not a claim about what healthy looks like on a real
  ranch.
- The as-of time zone America/Chicago is a demonstration setting.
