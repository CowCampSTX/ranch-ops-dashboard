# 01. The ten planted problems (committed data)

**The case.** These are the committed `data/` files, copied byte for byte (`cmp` against `data/*.csv` shows all 8
identical). The Phase 1 acceptance bar is that these 10 rows are still found with the same severities and that no new
false alarm is added (findings.json `policies.phase_1_acceptance`). This scenario writes that bar down as a fixture.
Every other scenario changes something relative to it.

All data is fictional (Example Ranch). Each threshold is a demonstration setting (`../settings.json`), not a validated
value. Finding these 10 rows shows that the rules find what the generator planted. It does not validate the
thresholds (RULE-WF-21, class D).

## Files

| File | Status |
|---|---|
| pastures, groups, moves, weights, water, health, budget, meta | copied unchanged from `data/` |
| tanks.csv | absent: Phase 1 adds it through the generator (WAT-02) |

## Expected Phase-1 result: exactly these 10 rows

| Severity | Area | Subject | Key numbers |
|---|---|---|---|
| Critical | Water | T2 (Windmill) | level 11.8% |
| Critical | Water | T4 (Lone Tree; Heifers there) | fell 46.0 points in the 24-hour window, now 10.0% |
| Serious | Water | T6 (Cedar Draw) | no reading for 42 hours, last level 98.5% |
| Serious | Grazing | Yearlings in Sand Hills | day 24 of a 21-day plan, 3 days over |
| Serious | Gain | Heifers | 0.4363 lb/day (shows as 0.44) vs 1.0 target, period from Jul 20 |
| Warning | Gain | 6 yearlings | under 1.0 lb/day: Y027, Y031, Y058, Y082, Y129, Y132 |
| Serious | Health | Yearlings: Booster vaccine | overdue by 15 days (due 2026-09-15) |
| Warning | Health | Cows: Pinkeye check | due in 3 days (2026-10-03) |
| Serious | Budget | Fuel | 21.25% over (shows as 21% or 21.3%), $2,040 |
| Serious | Budget | Repairs | 25.0% over, $1,800 |

Totals: 2 critical, 6 serious, 2 warning.

## Arithmetic, by hand from the CSV files

- **T2:** the last reading, 2026-09-30T18:00, is 11.8. 11.8 < 25, so critical.
- **T4:** the readings in [Sep 29 18:00, Sep 30 18:00] are 56.0, 44.5, 33.0, 21.5 and 10.0. Highest minus last:
  56.0 - 10.0 = 46.0 points, which is 30 or more, so critical. The reading before the window (Sep 29 12:00) is 67.5,
  so the fall began inside the window.
- **T6:** the last reading is 2026-09-29T00:00 at 98.5. From Sep 29 00:00 to Sep 30 18:00 is 24 + 18 = 42 hours, which
  is 24 or more, so serious. The level is not judged.
- **Yearlings grazing:** the open stay in P3 Sand Hills began 2026-09-06. Sep 6 to Sep 30 is 24 days. The plan is 21,
  so 24 - 21 = 3 days over.
- **Heifers gain:** the pooled gain from Jul 20 to Sep 15 (57 days) for 45 heifers is 1,119 lbs over 45 x 57 = 2,565
  animal-days, so 1,119 / 2,565 = 0.4363 lb/day. The line is 0.8 x 1.0 = 0.8, and 0.4363 < 0.8, so serious.
- **Yearlings gain:** 16,608 / 8,550 = 1.9425 lb/day. That is not under 0.8 x 2.0 = 1.6, so there is no group row.
  The animals under 0.5 x 2.0 = 1.0 lb/day are Y027 27/57 = 0.474, Y031 33/57 = 0.579, Y058 38/57 = 0.667,
  Y082 44/57 = 0.772, Y129 23/57 = 0.404 and Y132 29/57 = 0.509. That is 6 animals.
- **Booster:** open, due Sep 15. Sep 15 to Sep 30 is 15 days overdue.
- **Pinkeye check:** open, due Oct 3. Sep 30 to Oct 3 is 3 days, which is within 7.
- **Fuel:** actual 2,592 + 2,928 + 3,120 + 3,000 = 11,640 against a budget of 4 x 2,400 = 9,600. That is $2,040 over,
  and 2,040 / 9,600 = 21.25%. Both parts of the serious line are met: more than 10% and at least $1,000.
- **Repairs:** actual 1,620 + 2,520 + 1,980 + 2,880 = 9,000 against 7,200. That is $1,800 over, and 1,800 / 7,200 = 25.0%.

## Must not appear

- No alert for T1, T3, T5, T7 or T8.
- No Yearlings group row, and no separate heifer animal row (the group row covers them, RULE-WF-19).
- No Cows or Heifers grazing row: each is on day 18 of 21 or day 11 of 14, with 3 days left, outside the 2-day grace.
- No Pregnancy check row (25 days away) and no Deworm row (32 days away).
- No row for the four categories under budget.
- No `NaN`, `Infinity` or `undefined` anywhere.

## Tiles

| Tile | Expected |
|---|---|
| Needs attention | 10: 2 critical, 6 serious, 2 warning |
| Water | 5 of 8 OK, 3 need a look. Phase 1 may rename the tile 'Sensors normal' (RULE-WAT-15). |
| Gain | draws without error; today it shows the yearlings' 1.94. Phase 1 must not hard-code a group (LOAD-03). |
| Spend vs budget | +1.0%: $89,303 of $88,400 (903 / 88,400 = 1.02%) |
| Head on grass | 375. UI-18 (phase 2) may change how cow-calf pairs are counted. |

## Allowed extra rows, until the generator changes land

The current generator does not yet write the Phase-1 additions, so this folder lacks them. Phase-1 code may report
these three data issues on this folder. They are not false alarms.

1. `meta.csv` has no time zone (TIME-02, RULE-WF-14).
2. `tanks.csv` was not provided (WAT-02).
3. The Cows 'Fly tag check' row contradicts itself: it is done, last done Jun 5, next due Sep 1 (HLTH-03).

## Current result (verified in this step by `scenarios.run.mjs`)

MATCH in both node and browser modes: 10 of 10 rows, 15 of 15 expected absences, 5 of 5 area states and 5 of 5 tiles.
The 10 rows are the ones listed in `01-baseline.md` 4.5 and `02-findings.md` ("The Phase 1 acceptance bar").

## Preconditions and open decisions

These are recommendations and unresolved assumptions, not verified findings.

1. **A time zone is required first.** data-fields.json (meta.csv `timezone`) says that without an offset or a time
   zone, the time-based rules are CAN'T TELL. Phase-1 code that does this would not give these 10 rows on this folder.
   Once the generator writes `meta.timezone`, `tanks.csv` and HLTH-03's row fix, rebuild this folder from the
   regenerated `data/` by re-running the builder. The 10 expected rows do not change. Scenarios 02 to 10 already
   carry those additions.
2. **Which months count as closed.** BUD-01 counts a month once the as-of date reaches its last day, so September
   counts here. RULE-BUD-05 and data-fields.json default `books_closed_through` to the month before as_of. Under that
   default, Repairs becomes 6,120 vs 5,400: $720 over, 13.3%. That is below RULE-BUD-03's $1,000 serious line, so
   Repairs drops to a warning and the acceptance bar fails. (02-findings.md 7.2 item 1 noted the percent-only effect
   but not the dollar line.) Pick one convention before adopting both rules. Scenario 08 shows the same arithmetic.
3. **The individual gain minimum.** RULE-GAIN-07 recommends a 70-day individual minimum. On this data, only the
   three-weigh-in regression spans 70 days. `python3 -I docs/audit/diagnostics/scenarios.gain70.py`, run in this
   step, gives 6 yearlings under 1.0 lb/day with the last 57-day interval. It gives 1 (Y129, 0.984) with the
   three-point regression and 0 with Jun 1 to Sep 15. A 70-day individual default would therefore lose 5 of the 6
   planted yearlings. That resolves 02-findings.md 7.2 item 5's "not tested" by calculation. These fixtures use one
   21-day minimum (GAIN-03's example demo value).
