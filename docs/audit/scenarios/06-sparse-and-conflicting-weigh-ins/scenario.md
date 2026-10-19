# 06. Sparse and conflicting weigh-ins

**The case.** Chute-side records are messy. This folder holds five ordinary problems:

1. **A new animal with one weigh-in.** Y151 was weighed once.
2. **A same-day re-weigh.** Y001 was weighed twice on Sep 15 (a scale re-check or a double EID read).
3. **An animal weighed with another group.** H004 was weighed with the Cows on Sep 15.
4. **A short off-session re-weigh.** Ten yearlings were re-weighed a week after the session.
5. **Low coverage.** Only 3 of the 45 heifers crossed the scale on Sep 15.

A manager needs the gain verdicts to rest on enough animals over a long enough period. Every animal or reading left
out must be said so.

All data is fictional (Example Ranch). The thresholds, the 21-day minimum interval, the 45-day age limit and the
coverage and session rules are demonstration settings or scenario assumptions (`../settings.json`).

## Files

| File | Status | Change |
|---|---|---|
| weights.csv | changed | 42 heifer rows dated 2026-09-15 (H004 to H045) are removed; only H001-H003 keep a Sep 15 weight. `H004,Cows,2026-09-15,1125` is added (H004's real weight, recorded under Cows). `Y001,Yearlings,2026-09-15,853` is added next to the committed 851. `Y151,Yearlings,2026-09-15,820` is added. Y003-Y012 get a row dated 2026-09-22 at their Sep 15 weight + 3 lbs (for example `Y003,Yearlings,2026-09-22,846`). |
| health.csv | changed | HLTH-03 fix |
| meta.csv | changed | `2026-09-30T18:00,America/Chicago` |
| tanks.csv | added | T1-T8 |
| others | copied unchanged | |

## Expected Phase-1 result (13 rows)

The planted rows stay, except the Heifers serious row, which is replaced by CAN'T TELL:

- T2, T4, T6;
- Yearlings grazing;
- 6 yearlings warning (Y027, Y031, Y058, Y082, Y129, Y132);
- Booster, Pinkeye, Fuel and Repairs.

Added:

| State | Area | Subject | Expected |
|---|---|---|---|
| Can't tell | Gain | Heifers | Says why: "3 of 45" weighed on Sep 15, or the last full session (Jul 20) is too old |
| Data issue | Gain | Y001 | two weights on 2026-09-15 (851 and 853) |
| Can't tell (or data issue) | Gain | Y151 | one weigh-in, so no gain yet; left out of the figures |
| Data issue (or can't tell) | Gain | Yearlings off-session | 10 animals (Y003-Y012) re-weighed 2026-09-22, 7 days after the session; listed, not used |

Allowed extra rows (these are not false alarms):

- a note that H004 was weighed with the Cows (GAIN-14 is phase 2, so Phase 1 may or may not name it);
- a note that H001-H003's Sep 15 readings are off-session;
- H004-in-Cows shown as a first weigh-in.

Must not appear:

- a Heifers group verdict;
- any heifer animal row;
- a Yearlings group row.

| Tile | Expected |
|---|---|
| Gain | Draws, and still shows the yearlings' 1.94. The heifers are CAN'T TELL. |

## Arithmetic, by hand

- **Heifer coverage:** on Sep 15, 3 heifers (H001-H003) of 45 were weighed: 3 / 45 = 6.7%. That is below the
  scenario's 50% minimum, and below any minimum above 7%, so Sep 15 is not a heifer session. The last full heifer
  session is Jul 20, which is 72 days before Sep 30, more than the 45-day limit. Either way, CAN'T TELL.
- **Yearlings:** sessions are the dates on which at least half the head was weighed. Sep 15 qualifies (150 of 150).
  Sep 22 (10 of 150) does not. Over Jul 20 to Sep 15 the yearling figures are the committed ones: 16,608 / 8,550 =
  1.94246. If Y001's 853 is kept instead of 851: 16,610 / 8,550 = 1.94269. Both show as 1.94, so the duplicate changes
  no verdict and is reported, not guessed at.
- **Y003-Y012:** a 7-day interval is under the 21-day minimum, so the re-weigh is not used. If it were, each animal
  would show 3 / 7 = 0.43 lb/day and be flagged under 1.0. That would be a false alarm from scale noise (GAIN-03).
- **Y151:** one weight, so no interval. Left out and listed.

## Current result (verified in this step by `scenarios.run.mjs`)

MISMATCH in both modes. 0 of 13 rows match.

- **The rules crash on the single weigh-in.** "TypeError: Cannot read properties of undefined (reading 'date') (at
  exceptions.js:70)". Y151 has one row, so `rows.slice(-2)` gives one element and `b.date` throws. "ON THE PAGE:
  findExceptions throws at app.js:222: the page draws nothing below the header". This reproduces GAIN-01 ("An animal
  with only one weigh-in crashes the rules and the page shows no alerts at all").
- Because of the crash, the duplicate, coverage and off-session behaviour of the current code is not reached in this
  scenario. GAIN-02, GAIN-03 and GAIN-07 have their own reproductions in the registry.

## Findings and rules exercised

GAIN-01, GAIN-02, GAIN-03, GAIN-06, GAIN-07, GAIN-08, GAIN-14, DATA-03; RULE-GAIN-07, RULE-GAIN-10.

## Assumptions (unresolved)

- **Coverage minimum.** `gainMinCoverage` = 0.5 is a scenario assumption. RULE-GAIN-10 and GAIN-07 call for a
  labelled minimum but give no number. The 3-of-45 case was chosen so that any minimum above 7% gives the same answer.
- **Session rule.** A weigh session is a date on which at least half the group was weighed (`weighSessionShare`, a
  scenario assumption based on GAIN-03's "dates when most of the group crossed the scale").
- **Minimum interval.** These fixtures use one 21-day minimum (GAIN-03's example demo value). RULE-GAIN-07's 70-day
  individual default is not adopted. See scenario 01, open decision 3.
- How a same-day duplicate is resolved (keep both and flag, keep the later one, or average) is not decided. The
  fixture is built so that the verdict is the same whichever is kept.
