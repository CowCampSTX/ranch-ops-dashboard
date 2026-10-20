# Redesign coverage

Which audit findings the visual redesign already addresses, and which it leaves for Phase 1 and Phase 2. The audit
reviewed `cfd77e5`; the redesign is a separate commit, `f9ef651` ("Redesign the dashboard page"), in the pull request
that follows the audit's.

**How to read this page.** A finding counts as fixed only when its acceptance test passes
([06 section 12](06-phase1-spec.md#12-acceptance-criteria-per-p1-item) for Phase 1,
[05 section 4](05-roadmap.md) for Phase 2). None of those tests exists yet. "Addressed on the page" below means the
redesigned page behaved as the finding expects in the case that was checked. The tests still have to be written.

## 1. What the redesign changed

- **Files.** Only `index.html` and `app.js` change, plus the README text about the charts and the screenshots in
  `docs/` (`screenshot.png`, `water.png`, `grazing-gain.png`, and a new `phone.png`).
- **Unchanged.** `exceptions.js`, `data/`, `tests/`, `scripts/` and `.github/` are untouched. Every rule, threshold and
  line of report text is exactly what the audit reviewed.
- **Look.** A black background with a green accent.
  - The first screen leads with the day's count of items that need attention, split by severity.
  - On a phone, the attention list comes first and is laid out as cards.
- **Charts.** Every chart is drawn at its real width, so its text stays readable on a phone. Each chart can be read with
  a mouse, a tap or the keyboard.
- **Tanks.** Listed worst first, each with a status label.
- **Budget.** Shown as one table with an over/under bar for each category. Rows the rules flag carry the same status
  pill as the list.
- **Safety and states.**
  - CSV text is escaped before it reaches the page.
  - A failed load shows a message and a retry button.
  - Each section is drawn inside its own guard, so a failure in one section doesn't blank the others.
- **Display guards.** The page shows "Can't tell" or "No plan" where it used to print NaN, 0% or OK. Two examples: a
  level that isn't a number, and a weight that isn't a number. These guards change only what the page draws. The rules
  still judge the same input the same way (section 3.3).

## 2. How it was checked

Run from the repository root at `f9ef651`.

| Check | Command or tool | Result |
|---|---|---|
| Unit tests | `node --test tests/*.mjs` | 8 pass, 0 fail |
| Findings on the page | `node docs/audit/redesign/coverage.mjs` (own server, temporary copy, read-only) | 23 PASS, 0 FAIL (the checks named in section 3) |
| Numbers unchanged | Compared every data-bearing string with the `cfd77e5` page during the redesign's review, then with the pre-polish redesign after the polish (scratch scripts, not committed) | No number differs. The only differences are the wording and order changes in section 4. |
| Time zones | All visible text, chart text and every chart reading in UTC, America/Denver, America/Chicago, America/Los_Angeles, Pacific/Auckland, Pacific/Kiritimati and Pacific/Pago_Pago (scratch script) | Identical in all seven zones |
| Widths | Chromium at 320, 390, 768, 1280 and 1920 px | No page error and no sideways scroll |
| Keyboard | Every reading of every chart stepped through with the arrow keys at 1280 px | 443 of 443 readings inside the window and below the top bar; Escape hides the reading |
| Odd data | Ten edited-data cases: zero budget, all-zero budget, Yearlings renamed, no gain target, no moves, non-number cells, T5 with no readings, blank plan, negative gain, single weigh-in | No page error except the single weigh-in case. There `exceptions.js` itself throws (GAIN-01), and the page now says so. |

The scratch scripts are not in the repository. The committed `redesign/coverage.mjs` re-runs the finding checks. The
audit's own diagnostics in `diagnostics/` still describe `cfd77e5` (section 5).

## 3. Coverage

Phase and work item come from [05 sections 3.4 and 4.1](05-roadmap.md#34-coverage-every-phase-1-finding-to-exactly-one-item).
"Check" names the line in `redesign/coverage.mjs` that tests the claim, or says "code reading" where no case was run.

### 3.1 Addressed on the page

| Finding | Item | What the page does now | Check |
|---|---|---|---|
| [SEC-01](02-findings.md#sec-01) | P1-13 | Every CSV value goes through `esc()` before `innerHTML`, including the chart readouts. | SEC-01. It covers pasture names, the `Lone Tree <A` case and ear tags in the gain readout. Codex task I covers the other fields. |
| [LOAD-03](02-findings.md#load-03) | P1-14 | The gain tile uses Yearlings if they have a target, otherwise the first group that does, otherwise "None yet". Tiles are drawn inside a section guard. | LOAD-03: with the yearlings shipped there are 7 rows and no error. The "Yearlings renamed" odd-data case gives 10 rows. |
| [LOAD-04](02-findings.md#load-04) | P1-14 | A tank with no readings in the 7-day window draws "No readings in the last 7 days", and every later section still draws. | LOAD-04 |
| [UI-04](02-findings.md#ui-04) | P1-14 | Tank states come from the rule's own subject (`Tank <id> (`), not from the first word of the subject. | UI-04: "Well 2" and "Well 4" give 5 of 8 and 3 need a look. |
| [UI-05](02-findings.md#ui-05) | P1-14 | Month lines run from the first `in_date` to the later of `as_of` and the last planned move. | UI-05, on the committed season only. The GB-09 to GB-12 seasons were not run. |
| [UI-07](02-findings.md#ui-07) | P1-15 | The All filter shows "Nothing needs attention.". A spend exactly on budget shows 0.0% and 0%, never −0. A $0 total budget shows "No budget". | UI-07 for the on-budget case; code reading for the All message. |
| [UI-08](02-findings.md#ui-08) | P1-15 | Every percentage that comes from `RULES` goes through `pct()` (`+(v * 100).toFixed(1)`). | Code reading only. No threshold was changed in a run. |
| [GRZ-06](02-findings.md#grz-06) | P1-16 | The card note now says that only a current stay shows days left or days past plan. The finding accepts this note in place of marks on past stays. | GRZ-06 |
| [UI-01](02-findings.md#ui-01) | P2-05 | Readings open on tap. They are also reachable from the keyboard: Tab to a chart, then use the arrow keys. Each tooltip shows the value first. | UI-01. The budget readout the finding names is now a table row: "Repairs Serious +25% $7,200 $9,000 +$1,800". |
| [UI-11](02-findings.md#ui-11) | P2-05 | Tooltips flip and clamp at the right, bottom and top edges, and stay below the sticky top bar. | Keyboard sweep in section 2: 443 of 443 inside |
| [UI-10](02-findings.md#ui-10) | P2-03 | Chips are built once. A click updates `aria-pressed` without rebuilding them, so focus stays on the chip. | UI-10 |
| [UI-02](02-findings.md#ui-02) | P2-06 | On a phone each attention row is a card that shows the problem and the first step. Budget amounts fit their cells. | UI-02 |
| [UI-03](02-findings.md#ui-03) | P2-06 | Chart text renders at 11.5 px at every width. | UI-03 |
| [UI-12](02-findings.md#ui-12) | P2-06 | No gain labels overlap. Tank names sit on one line, cut short with an ellipsis if needed. | UI-12 |
| [UI-14](02-findings.md#ui-14) | P2-06 | Group names get up to 30% of the width and are shortened with an ellipsis. Budget categories wrap inside a table cell. | UI-14. The finding's x <= 70 test assumes the old fixed margin; on the new page the check is that each label ends before the bars start. |
| [UI-15](02-findings.md#ui-15) | P2-06 | The line breaks where readings stop for more than 12 hours. | UI-15: two segments around a 36-hour gap |
| [UI-16](02-findings.md#ui-16) | P2-04 | The animals the warning rule flags are drawn in the warning colour, with a legend. The 50% and 80% lines are drawn and labelled. | UI-16: 6 flagged dots |

### 3.2 Partly addressed

| Finding | Item | Done | Still to do |
|---|---|---|---|
| [LOAD-02](02-findings.md#load-02) | P1-06 | A loading message shows while the files load. A failed load says so and offers a retry button. Sections drawn after the load are isolated from each other. | Name the failed file, and still draw the areas whose files loaded. (Today one failed file stops the whole report.) |
| [LOAD-01](02-findings.md#load-01) | P1-06 | Check: LOAD-01 (partly). A missing file (404) no longer reads as "nothing needs attention": the whole report says it didn't load. A header-only `water.csv` shows "No data" on the tile and "No readings" on the water card, not "0 of 0, all reading normally". | Name the file. The list still says "Nothing in water needs attention." for an empty water file, and other empty files (health, for one) still read as clear, with no per-area CAN'T TELL. |
| [GAIN-13](02-findings.md#gain-13) | P1-16 | The gain chart says "Not shown: Cows, with no gain target set." | Add the line to the rules table and the README. |
| [UI-17](02-findings.md#ui-17) | P2-06 | Value labels can no longer cover category names: the names sit in their own table column, and labels are placed outside the bar, inside it, or across zero. | The scale has no cap, so one very large overrun still shrinks the other bars. The AB-09 and M1 cases were not run. |
| [WAT-01](02-findings.md#wat-01) | P1-07 | A last level that isn't a number shows "Can't tell" on its tank card and in the tile, not "OK". Non-number readings are left off the line rather than drawn at 0%. | The rules still give such a tank no row in the list, and a blank last level still gives "Down to % full". Check: WAT-01 (display only). |
| [GRZ-03](02-findings.md#grz-03) | P1-08 | "TBD" or a blank plan shows "No plan" and draws no move date. | The rules still drop the alert or treat a blank plan as 0 days. A blank `in_date` is not handled. Check: GRZ-03 (display only). |
| [BUD-03](02-findings.md#bud-03) | P1-12 | The budget table shows "no budget" for a $0 budget, and the tile shows "No budget" when the total is $0. | The list still reads "Infinity% over". Check: BUD-03 (display only). |
| [CSV-04](02-findings.md#csv-04) | P1-02 | A head count that isn't a number shows "330 + ?" and "? heifers". A weight that isn't a number shows "Can't tell" with the count of unreadable animals, never NaN. | A blank cell still counts as 0 in the rules. Check: the "weight that is not a number" line. |
| [GAIN-01](02-findings.md#gain-01) | P1-09 | The page shows "The data files loaded, but the report couldn't be worked out from them" instead of a blank page. | The rules still throw on an animal with one weigh-in. Check: GAIN-01 (message only). |

### 3.3 Not addressed

- **Rules and report text.** Findings whose fix is in `exceptions.js`, the data contract or the generator are not
  addressed. The redesign does not change those files. This covers every CSV-, DATA-, TIME-, WAT-, GRZ-, GAIN-, HLTH-,
  BUD- and TEST- finding not listed above.
- **Words in the list.** The redesign leaves the rules' wording alone, so these remain:
  - [UI-06](02-findings.md#ui-06): the list still says "Planned move in 0 days". The page's own "Now grazing" line
    already says "move due today".
  - [UI-09](02-findings.md#ui-09): rows of the same severity are still sorted A-Z by area.
  - [UI-13](02-findings.md#ui-13): the list still shows ISO dates.
- [UI-18](02-findings.md#ui-18): the tile still reads "180 cows" and totals head without counting calves.

**The display guards are placeholders.** They are the page's own guesses: a tank card's "Can't tell", the gain tile's
"Can't tell" and "No plan". Once Phase 1 returns CAN'T TELL rows from the rules (P1-06, P1-07), the page should take
those states from the rules and drop its own guesses.

## 4. Intentional differences from `cfd77e5`

These change wording, order or layout. They don't change any number. Codex task I and Phase 1 should treat them as
expected.

| Where | `cfd77e5` | Redesign |
|---|---|---|
| Summary | Tile "Needs attention 10 / 2 critical, 6 serious, 2 warning" | Card "10 items need attention across 5 of 5 areas", with Critical 2, Serious 6 and Warning 2 |
| Chips | "All (10)", "Water (3)" | "All 10", "Water 3" (count in a badge) |
| Tank order | T1 to T8 | Worst first, then by number: T2, T4, T6, then T1, T3, T5, T7, T8 |
| Tank status | The heading shows the level ("T2 Windmill 11.8%"), or "no signal" for T6 | A pill on each tank card: "Go now", "Fast drop", "No signal", "OK", or "Can't tell" |
| Water tile | "5 of 8 / 3 need a look" | "5 of 8" with one status icon per tank, plus "3 need a look: T2 go now, T4 fast drop, T6 no signal" |
| T4 reading | "Sep 30, 6 PM: 10%" | "10% / T4 Lone Tree · Sep 30, 6 PM" (value first) |
| H026 reading | "0.11 lbs/day, Jul 20 to Sep 15 / Now 1136 lbs" | "0.11 lbs/day / H026 · Heifers / Jul 20 to Sep 15, now 1,136 lbs" |
| Sand Hills reading | "Sep 6 to now (24 days) / Plan: 21 days" | "24 days / Yearlings in P3 Sand Hills / Sep 6 to now · plan 21 days / 3 days past the planned move" |
| Repairs | A chart tooltip: "Budget $7,200 / Actual $9,000 / Over by $1,800" | A table row: "Repairs Serious +25% $7,200 $9,000 +$1,800". There is no separate budget chart. |
| Budget rows | One colour per side of zero | Rows the rules flag are coloured by severity and carry its pill. The key reads "Serious: more than 10% over / Warning: 5–10% over / Not flagged". |
| Gain chart | Group name, "avg 0.44" and "target 1.0" | "45 weighed · average 0.44 vs 1.0 target", an "Under 80% of target" badge on a flagged group, and "50% · 80%" as one label when the two lines sit close |
| Grazing | Bars only | A "Now grazing" list beneath: each group's pasture, day and planned move date, with an "On plan", "Past plan" or "No plan" pill |
| Rules table | Water rows in the order critical, warning, serious | Grouped by area, worst first within each area (Water: critical, serious, warning). On a phone it sits behind "Show the rules". |
| Numbers | Weights in chart readings without a separator ("Now 1136 lbs") | A thousands separator in every reading too ("now 1,136 lbs") |
| Failed load | Blank page | "The report didn't load" with a retry button; a loading message while files load |

## 5. Audit scripts on the redesigned page

The diagnostics in `diagnostics/` were written for `cfd77e5`, and they stay the record of that commit
([06 section 13](06-phase1-spec.md#13-migration-and-compatibility)). Node-only scripts that import only
`exceptions.js` give the same results on the redesign. Browser scripts and `render.repro.mjs` need their selectors
mapped first:

| `cfd77e5` | Redesign |
|---|---|
| `#water .mini` (one box per tank) | `#tanks .tank` (worst first; the chart is `svg.chart` inside it) |
| `.mini h4` (tank heading) | `.tank-name` and `.tank-head .pill` |
| `#budgetChart svg` | None. The bars are `#budgetTable .track .bar`, and the labels are `.track .val`. |
| `#budgetTable` (header and 6 rows) | `#budgetTable` (`thead`, 6 `tbody` rows, and a `tfoot` season total) |
| `#rules` (12 rows including the header) | `#rules` (`thead` and 11 `tbody` rows) inside `<details id="rulesMore">` |
| Hover tooltips in `#tip` | `#tip`, opened by hover, tap, or focus plus the arrow keys |
| Tiles `#tiles .tile` | The same, plus a separate `#summary` card for the count |

Start Phase 1 from the redesigned `app.js`. The findings' `app.js` and `index.html` line numbers refer to `cfd77e5`
(`git show cfd77e5:app.js`).
