# 08. Historical reporting: as_of earlier than the newest rows

**The case.** The as-of time is moved back to 2026-09-27T18:00-05:00 (18:00 CDT, ranch zone America/Chicago), while
the files still run to Sep 30. The folder also holds records about the future:

- the yearlings' Sand Hills stay has a planned out_date of Oct 3;
- the next stay starts Oct 3;
- ten heifers were re-weighed on Sep 29.

A manager running "the report as it stood on Sep 27" needs exactly what was known then. Later rows must be left out
and counted, not used.

All data is fictional (Example Ranch). The thresholds are demonstration settings.

## Files

| File | Status | Change |
|---|---|---|
| meta.csv | changed | `as_of,timezone` = `2026-09-27T18:00-05:00,America/Chicago` |
| moves.csv | changed | `Yearlings,P3,2026-09-06,2026-10-03` (planned out_date), then `Yearlings,P2,2026-10-03,` (planned next stay) |
| weights.csv | changed | H001-H010 get a row dated 2026-09-29 at their Sep 15 weight + 6 lbs (for example `H001,Heifers,2026-09-29,1175`) |
| health.csv | changed | HLTH-03 fix |
| tanks.csv | added | T1-T8 |
| water, budget, pastures, groups | copied unchanged (they run to Sep 30) | |

## Expected Phase-1 result (10 rows)

| State | Severity | Area | Subject | Expected |
|---|---|---|---|---|
| Needs attention | Warning | Grazing | Yearlings in Sand Hills | the move is **due today**: day 21 of a 21-day plan. Must not say "in 0 days". |
| Data issue | - | Grazing | Yearlings | a stay starting 2026-10-03, after the as-of date: not judged |
| Needs attention | Serious | Gain | Heifers | 0.4363 lb/day over Jul 20 to Sep 15. Must not say "since 2026-09-15". |
| Needs attention | Warning | Gain | 6 yearlings | Y027, Y031, Y058, Y082, Y129, Y132 |
| Data issue | - | Gain | weights.csv | 10 weigh-ins dated 2026-09-29, after the as-of date |
| Data issue | - | Water | water.csv | 89 readings after the as-of time |
| Needs attention | Serious | Health | Yearlings: Booster vaccine | 12 days overdue (due 2026-09-15) |
| Needs attention | Warning | Health | Cows: Pinkeye check | due in 6 days (2026-10-03) |
| Needs attention | Serious | Budget | Fuel | Jun-Aug: 20.0%, $1,440. Must not say $2,040. |
| Needs attention | **Warning** | Budget | Repairs | Jun-Aug: 13.3%, $720 (under the $1,000 serious line) |

Must not appear: any water alert (as of Sep 27 18:00 every tank is above 40% with no 30-point fall), and no Cows or
Heifers grazing row (day 15 of 21 and day 8 of 14).

Area states: **Water OK**; Grazing, Gain, Health and Budget need attention.

| Tile | Expected |
|---|---|
| Water | 8 of 8 OK |
| Spend vs budget | **-1.4%**: $65,367 of $66,300 (Jun-Aug) |

## Arithmetic, by hand

- **Water as of Sep 27 18:00.** Using only readings at or before the as-of time, each tank's last reading is Sep 27
  18:00 (T6 included: its outage starts later). The lowest level is T2 at 47.8, above 40. The largest fall in
  [Sep 26 18:00, Sep 27 18:00] is T4's 81.6 - 66.6 = 15.0, under 30. No tank is silent. Readings after the as-of time:
  12 per tank for the 7 tanks reporting to Sep 30 18:00 (7 x 12 = 84), plus 5 for T6 (to Sep 29 00:00): 89.
- **Yearlings grazing.** The Sand Hills row's out_date (Oct 3) is after the as-of date, so the yearlings are still
  there. Sep 6 to Sep 27 is 21 days of 21, so the move is due today. The Oct 3 stay has not started.
- **Heifers.** The Sep 29 weigh-ins are after the as-of date and are left out. Jul 20 to Sep 15 gives 1,119 / 2,565 =
  0.4363, under 0.8.
- **Health.** Sep 15 to Sep 27 is 12 days overdue. Sep 27 to Oct 3 is 6 days.
- **Budget, closed months Jun-Aug** (September has not closed on Sep 27).
  - Fuel: 2,592 + 2,928 + 3,120 = 8,640 vs 7,200, so $1,440 and 20.0%. That is more than 10% and at least $1,000, so
    serious.
  - Repairs: 1,620 + 2,520 + 1,980 = 6,120 vs 5,400, so $720 and 13.3%. That is more than 10%, but $720 is under
    $1,000, so it is not serious. It is at least 5% and at least $500, so a warning.
  - Tile: 65,367 vs 66,300 = -933, and -933 / 66,300 = -1.41%.

## Current result (verified in this step by `scenarios.run.mjs`)

MISMATCH in both modes. 3 of 10 rows match, 2 rows are unexpected, 8 of 10 absences hold, 3 of 5 area states and 0 of
2 tiles match.

- **Alarms for events that had not happened yet.** "[critical] Water | Tank T2 (Windmill, Yearlings here now) | Down
  to 11.8% full" and "[critical] Water | Tank T4 (Lone Tree, Heifers here now) | Dropped 46 points in 24 hours, now
  10%". As of Sep 27 18:00 T2 read 47.8% and T4 66.6%. The T2 subject also says "Yearlings here now". The current code
  takes the open (blank out_date) Oct 3 stay in P2 as current. That reproduces TIME-01 and GRZ-01 ("The current grazing
  stay is chosen by a blank out_date, not by as_of").
- **The due move is missed.** "MISMATCH Grazing  expected needs-attention, current ok". The Sand Hills row has an
  out_date, so the current code treats the stay as closed.
- **The wrong weigh-in period.** "[serious] Gain | Heifers | 0.43 lbs/day since 2026-09-15 vs 1.0 target". The Sep 29
  re-weigh is used for H001-H010, and the label takes H001's period.
- **Budget ignores the as-of date.** "Fuel | 21% over season to date ($2,040)" and "Repairs | 25% over season to date
  ($1,800)". Those are the Sep 30 figures. The tile shows "+1.0% | $89,303 of $88,400" instead of Jun-Aug.
- **Health is right:** "Overdue by 12 days" and "Due in 6 days". The health rule already measures from as_of.

## Findings and rules exercised

TIME-01, TIME-02, GRZ-01, GAIN-03, BUD-01, UI-06; RULE-WF-14, RULE-GRZ-02, RULE-BUD-03, RULE-BUD-05.

## Open decision (unresolved)

**Repairs is a warning here only because of RULE-BUD-03's $1,000 serious line.** The same Jun-Aug arithmetic applies
to the committed data on Sep 30 if `books_closed_through` defaults to the month before as_of (RULE-BUD-05,
data-fields.json). BUD-01's proposed fix covers this case: "If the ranch prefers 'closed once the last day has ended',
September drops out on Sep 30 and the committed rows read Fuel 20.0% over ($1,440: 8,640 vs 7,200) and Repairs 13.3%
over ($720: 6,120 vs 5,400), both still serious". That holds under the percent-only rule. Under RULE-BUD-03's dollar
line, Repairs becomes a warning and the Phase 1 acceptance bar fails. Decide the closed-month convention before
adopting both rules.

## Assumptions

- The as-of time carries an offset (-05:00) and a zone. The day counts use the ranch calendar date (Sep 27).
- Rows dated after the as-of time are counted and reported, not silently dropped (the lead's as-of policy, TIME-01's
  proposed fix).
