# 09. Exact rule boundaries

**The case.** The demonstration thresholds are hit exactly, most of them with a neighbour on one or both sides. This
pins down whether each rule uses "under" or "at or under", and whether floating-point arithmetic moves a value across a
line. Coverage, from the table below:

- **Hit exactly, with a neighbour:** tank level 25 (24.9, 25.0, 25.1) and 40 (39.9, 40.0); 24-hour drop 30 (29.9,
  30.0); silence 24 h (23.9, 24.0); the planned move (1 day over, due today); the animal ADG line (0.982, 1.000); due
  within 7 days (7, 8) and overdue (1 day over, due today); the 5% and 10% budget lines (5.0%; 10.0% and 10.5%).
- **Hit exactly, without a neighbour:** the 2-day grace (2 days left only; no 1 or 3) and the group ADG lines (both
  groups at exactly 0.8 x target; no group just under).
- **Not at a boundary in any folder:** the $500 budget line (only $480, below it), the $1,000 serious line, the
  $2,500 large-dollar line, the $250 unbudgeted line (only $200 and $500, in scenario 07), the 45-day weigh-in age
  (only 72 days), the 21-day interval (only 49 and 57 days) and the 50% session share (only 3 of 45 and 10 of 150).
  The unit tests of 06-phase1-spec.md section 11.1 must cover these.

A manager needs a tank at 25.0%, or a group at exactly 80% of target, to get the same answer every time.

All data is fictional (Example Ranch). **These thresholds are demonstration settings, not validated values.** The
scenario tests that the code applies the settings as written. It does not test whether the settings are right for a
ranch (RULE-WF-21).

## Files

| File | Status | Change |
|---|---|---|
| water.csv | changed | Rebuilt so the series end as follows. Final levels: T1 24.9, T2 25.0, T3 25.1, T4 39.9, T5 40.0. T6: 80.1 at Sep 29 18:00, then 72.0, 64.0, 57.0, 50.1. T7: 80.0 at Sep 29 18:00, then 72.0, 64.0, 57.0, 50.1. T8: the series ends at 2026-09-29T18:06 (70.2). New tank T9 (in P5, Creek Bottom): the series ends at 2026-09-29T18:00 (75.3). |
| tanks.csv | added | T1-T8 and `T9,P5` |
| moves.csv | changed | Cows into P7 on 2026-09-11 (was Sep 12). Heifers into P4 on 2026-09-16 (was Sep 19). Yearlings into P3 on 2026-09-08 (was Sep 6). Each previous stay's out_date is moved to match. |
| weights.csv | changed | Sep 15 weights set so the gains are exact. Heifers: 27 gain 46 lbs and 18 gain 45 lbs. Yearlings: Y027 gains 56, Y031 gains 57, 99 others gain 92 and 49 gain 91. |
| health.csv | changed | HLTH-03 fix. Pinkeye check due 2026-10-07; Pregnancy check due 2026-10-08; Booster vaccine due 2026-09-29; Deworm due 2026-09-30. |
| budget.csv | changed | Every monthly actual is replaced (budgets unchanged) so the Jun-Sep totals are: Feed 27,280 (6,820 a month); Labor 37,800 (9,450 a month); Fuel 10,080 (2,520 a month); Repairs 7,920 (1,980 a month); Vet 6,630 (1,658 + 1,657 + 1,658 + 1,657); Water and fencing 5,035 (1,259 x 3 + 1,258). |
| meta.csv | changed | `2026-09-30T18:00,America/Chicago` |
| pastures, groups | copied unchanged | |

## Expected Phase-1 result (17 rows)

| Boundary | Subject | Value | Expected |
|---|---|---|---|
| Critical < 25 | T1 | 24.9 | **critical** |
| | T2 | 25.0 | warning (25.0 is not under 25) |
| | T3 | 25.1 | warning |
| Warning < 40 | T4 | 39.9 | **warning** |
| | T5 | 40.0 | none (40.0 is not under 40) |
| Drop >= 30 | T6 | 80.1 to 50.1 = **30.0** | **critical**, fell 30.0 points, now 50.1% |
| | T7 | 80.0 to 50.1 = 29.9 | none |
| Silent >= 24 h | T8 | 23.9 h (last reading 18:06) | none |
| | T9 | **24.0 h** | **serious**, 75.3% |
| Grace 2 days | Cows in South Divide | day 19 of 21 | **warning**, 2 days left |
| | Heifers in Lone Tree | day 14 of 14 | **warning, "due today"**. Must not say "in 0 days". |
| Over plan > 0 | Yearlings in Sand Hills | day 22 of 21 | **serious**, 1 day over. Must not say "1 days". |
| Group < 80% of target | Heifers | pooled exactly **0.8** | none |
| | Yearlings | pooled exactly **1.6** | none |
| Animal < 50% of target | Y027 | 56 / 57 = 0.982 | **warning, "1 yearling"**. Must not say "1 yearlings". |
| | Y031 | 57 / 57 = 1.000 | not listed |
| Overdue < 0 days | Yearlings: Booster vaccine | due Sep 29 | **serious**, 1 day overdue. Must not say "1 days". |
| Due within 7 days | Yearlings: Deworm | due Sep 30 | **warning, "due today"**. Must not say "in 0 days". |
| | Cows: Pinkeye check | due Oct 7 | **warning**, 7 days (inclusive) |
| | Heifers: Pregnancy check | due Oct 8 | none (8 days) |
| Budget warning: 5% and $500 | Labor | 5.0%, $1,800 | **warning** (5% inclusive) |
| | Fuel | 5.0%, $480 | none ($480 is under $500) |
| | Water and fencing | 4.9%, $235 | none |
| Budget serious: over 10% and $1,000 | Feed and mineral | **10.0%, $2,480** | **warning**. 10.0% is not over 10% (open decision 1, settled by 05-roadmap.md D2). The $2,500 large-dollar line cannot change this row (it only gives a warning); it is not tested here. |
| | Repairs | 10.0%, $720 | warning |
| | Vet and health | 10.5%, $630 | **warning**: over 10%, but $630 is under $1,000 |

Every budget warning shows its dollars (BUD-06).

| Tile | Expected |
|---|---|
| Water | 3 of 9 OK (T5, T7, T8); 6 need a look |
| Spend vs budget | **+7.2%**: $94,745 of $88,400 |

## Arithmetic, by hand

- **T6:** the window [Sep 29 18:00, Sep 30 18:00] includes the 80.1 reading, which is exactly 24 h before the last.
  80.1 - 50.1 = 30.0, rounded to 0.1, which is at least 30, so critical. **T7:** 80.0 - 50.1 = 29.9, under 30, and
  50.1 is at least 40, so nothing.
- **T8:** Sep 29 18:06 to Sep 30 18:00 is 23 h 54 min = 23.9 h, under 24. **T9:** Sep 29 18:00 to Sep 30 18:00 is
  exactly 24.0 h, which is at least 24.
- **Grazing:** Sep 11 to Sep 30 is 19 days (21 - 19 = 2 left). Sep 16 to Sep 30 is 14 days (14 - 14 = 0, due today).
  Sep 8 to Sep 30 is 22 days (22 - 21 = 1 over).
- **Heifers:** 27 x 46 + 18 x 45 = 1,242 + 810 = 2,052 lbs over 45 x 57 = 2,565 animal-days. 2,052 / 2,565 = 0.8
  exactly, which is not under 0.8 x 1.0. The slowest heifer, 45 / 57 = 0.789, is not under 0.5.
- **Yearlings:** 56 + 57 + 99 x 92 + 49 x 91 = 56 + 57 + 9,108 + 4,459 = 13,680 lbs over 150 x 57 = 8,550 animal-days.
  13,680 / 8,550 = 1.6 exactly, which is not under 0.8 x 2.0. Y027: 56 / 57 = 0.982, under 1.0. Y031: 57 / 57 = 1.0,
  not under.
- **Budget:**
  - Feed 27,280 - 24,800 = 2,480, and 2,480 / 24,800 = 10.0%.
  - Labor 37,800 - 36,000 = 1,800, and 1,800 / 36,000 = 5.0%.
  - Fuel 10,080 - 9,600 = 480, and 480 / 9,600 = 5.0%.
  - Repairs 7,920 - 7,200 = 720, and 720 / 7,200 = 10.0%.
  - Vet 6,630 - 6,000 = 630, and 630 / 6,000 = 10.5%.
  - Water and fencing 5,035 - 4,800 = 235, and 235 / 4,800 = 4.9%.
  - Total 94,745 - 88,400 = 6,345, and 6,345 / 88,400 = 7.18%.

## Current result (verified in this step by `scenarios.run.mjs`)

MISMATCH in both modes. 9 of 17 rows match, 1 row is unexpected, 8 of 9 absences hold, 5 of 5 area states and 1 of 2
tiles match. The budget tile "+7.2% | $94,745 of $88,400" matches.

- **An exact 30.0-point drop is missed** (WAT-08). There is no T6 row. In JavaScript `80.1 - 50.1` is
  `29.999999999999993` (checked with node in this step), which is not at least 30.
- **A false group alarm at exactly 80%** (GAIN-12). "[serious] Gain | Yearlings | 1.60 lbs/day since 2026-07-20 vs 2.0
  target". The current code averages 150 per-animal rates in floating point and lands just under 1.6. The group row
  then suppresses the Y027 animal warning (RULE-WF-19), so "1 yearling" never appears. The heifers' exact 0.8 happens
  to come out not under, so there is no heifer row.
- **"0 days" wording** (UI-06). "Planned move in 0 days" and "Due in 0 days (2026-09-30)".
- **Labor at exactly 5.0% gets no row** (BUD-05). The current rule uses `pct > 0.05`, and `1800/36000 > 0.05` is
  false.
- **Vet is serious on $630.** "[serious] Budget | Vet and health | 11% over season to date ($630)". The rule is
  percent only (BUD-04).
- **Warnings carry no dollars.** "[warning] Budget | Feed and mineral | 10% over season to date" and "Repairs | 10%
  over season to date" (BUD-06).
- **The water tile counts T6 as OK:** "current 4 of 9 | 5 need a look".
- **Correct today:** T1-T5, T7, T8, T9, Cows (2 days), Yearlings (1 day over), Booster (1 day), Pinkeye (7 days) and
  Pregnancy check (none). The current comparisons for level, silence, grace and due-soon already match the settings.

## Findings and rules exercised

WAT-08, GAIN-11, GAIN-12, BUD-04, BUD-05, BUD-06, UI-06, TEST-01, TEST-02; RULE-WAT-01, RULE-WAT-02, RULE-WAT-03,
RULE-WAT-04, RULE-GRZ-01, RULE-GRZ-02, RULE-GAIN-01, RULE-GAIN-02, RULE-HLTH-01, RULE-HLTH-02, RULE-BUD-02,
RULE-BUD-03.

## Open decisions (settled for Phase 1)

All three are settled in 05-roadmap.md and 06-phase1-spec.md; the expected rows were already written that way.

1. **Exactly 10.0% with $1,000 or more.** Settled by 05-roadmap.md decision D2: serious needs more than 10%, so Feed
   (10.0%, $2,480) stays a warning, as the current rule text and BUD-05 ("serious above 10%") say. RULE-BUD-03's
   formula ("serious if p >= seriousPct AND V >= seriousUsd") would have made it serious.
2. **Drop window edge.** Settled by 05-roadmap.md decision D5 (the maximum drawdown inside [last - 24 h, last], both
   ends included), which also gives 30.0 here. The 80.1 reading sits exactly at last - 24 h and is inside the window.
   RULE-WAT-03's phase note ("the reading about 24 h before the latest, within one reporting interval") gives the same
   30.0 for this series. The definitions differ on other series (02-findings.md 7.2 item 6).
3. **Rounding before comparing.** Adopted in 06-phase1-spec.md section 5.2: the drop is rounded to 0.1 before the
   comparison (WAT-08's fix), as this fixture expects. Comparing in integer tenths would give the same results.
