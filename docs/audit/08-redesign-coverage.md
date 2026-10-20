# Redesign coverage

Which audit findings the visual redesign already addresses, and which it leaves for Phase 1 and Phase 2. The audit
reviewed `cfd77e5`. The redesign is commit `f9ef651` ("Redesign the dashboard page"). It and this page were merged
into main in pull request #2 on 2026-10-20 (merge commit `0315d09`). Phase 1 starts from main and keeps what the
redesigned page already does: [06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)
lists it, and the read-only script [redesign/preserve.mjs](redesign/preserve.mjs) checks it (KEEP-01 to KEEP-34).

**How to read this page.** A finding counts as fixed only when its acceptance test passes
([06 section 12](06-phase1-spec.md#12-acceptance-criteria-per-p1-item) for Phase 1,
[05 section 4](05-roadmap.md#4-phase-2-build-next) for Phase 2). None of those tests exists yet. "Addressed on the
page" below means the redesigned page behaved as the finding expects in the case that was checked. The tests still
have to be written.

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

Run from the repository root at `e9d7ab3`, the head of pull request #2 (main at `0315d09` has the same files). Its page
files are identical to `f9ef651`'s; `coverage.mjs` was added in `e9d7ab3`. The preserve checks were added after the
merge and run against main.

| Check | Command or tool | Result |
|---|---|---|
| Unit tests | `node --test tests/*.mjs` | 8 pass, 0 fail |
| Findings on the page | `node docs/audit/redesign/coverage.mjs` (own server, temporary copy, read-only) | 23 PASS, 0 FAIL (the checks named in section 3). Re-run on 2026-10-20 on main's page files (`0315d09`) after the `pathToFileURL` change (`coverage.mjs 8852`): 23 PASS, 0 FAIL. |
| Preserve checks | `node docs/audit/redesign/preserve.mjs http://localhost:8766/`, with the working tree served on port 8766 (page files identical to main at `0315d09`; read-only, Playwright Chromium) | 34 PASS, 0 FAIL on 2026-10-20 (KEEP-01 to KEEP-34, [06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)). After the Checkpoint 1b dry run made KEEP-01 (`aria-describedby="chart-help"`), KEEP-06 (`touch-action: pan-y` on every chart), KEEP-13 (the time on each tank card) and KEEP-23 (no break at a 12-hour gap, a break at 18 hours) stricter, re-run the same day: 34 PASS, 0 FAIL on main, and each of three scratch copies of main broken on purpose fails only the check meant to catch it (charts set to `touch-action: none`: KEEP-06; the tank card time removed: KEEP-13; the outage break moved from 12 to 30 hours: KEEP-23). Scratch runs of the same checks before they were committed: 34 PASS with prebuilt odd-data folders, 34 PASS on a copy of main given the Phase 1 wording, and 1 PASS, 33 FAIL on the `cfd77e5` page (only KEEP-09, no sideways scroll, holds there). |
| Values unchanged | Compared every data-bearing string with the `cfd77e5` page during the redesign's review, then with the pre-polish redesign after the polish. On 2026-10-20, compared the visible text of each section at 1280 px and at 390 px with touch, and every chart reading, with the `cfd77e5` page (scratch scripts, not committed) | The underlying values are the same. The 10 rows, the tile figures, the six budget rows and the 443 chart readings both pages have (225 tank, 23 grazing, 195 gain) give the same values. The redesign also shows figures worked out from the same data, such as the season total and "Grazing 3 of 8 pastures". Section 4 lists every difference in what is shown. |
| Time zones | All visible text, chart text and every chart reading in UTC, America/Denver, America/Chicago, America/Los_Angeles, Pacific/Auckland, Pacific/Kiritimati and Pacific/Pago_Pago (scratch script) | Identical in all seven zones |
| Widths | Chromium at 320, 390, 768, 1280 and 1920 px | No page error and no sideways scroll |
| Keyboard | Every reading of every chart stepped through with the arrow keys at 1280 px | 443 of 443 readings inside the window and below the top bar; Escape hides the reading |
| Odd data | Ten edited-data cases: zero budget, all-zero budget, Yearlings renamed, no gain target, no moves, non-number cells, T5 with blank levels, blank plan, negative gain, single weigh-in | No page error except the single weigh-in case. There `exceptions.js` itself throws (GAIN-01), and the page now says so. |

The scratch scripts are not in the repository. The committed `redesign/coverage.mjs` re-runs the finding checks; it
records the redesign's claims and is not a Phase 1 gate, because several of its checks assert wording Phase 1 changes
on purpose ("Heifers here now", "Water tanks OK"). The committed [redesign/preserve.mjs](redesign/preserve.mjs) checks
what Phase 1 must keep; the Phase 1 smoke test runs the same checks
([06 section 11.4](06-phase1-spec.md#114-browser-smoke-test)). Both were run with Playwright Chromium only: real phones,
screen readers, Firefox and WebKit were not tested. The audit's own diagnostics in `diagnostics/` still describe
`cfd77e5` (section 5).

## 3. Coverage

Phase and work item come from [05 sections 3.4 and 4.1](05-roadmap.md#34-coverage-every-phase-1-finding-to-exactly-one-item).
"Check" names the line in `redesign/coverage.mjs` that tests the claim, or says "code reading" where no case was run.

### 3.1 Addressed on the page

| Finding | Item | What the page does now | Check |
|---|---|---|---|
| [SEC-01](02-findings.md#sec-01) | P1-13 | Every CSV value goes through `esc()` before `innerHTML`, including the chart readouts. | SEC-01. It covers pasture names, the `Lone Tree <A` case and ear tags in the gain readout. Codex task I covers the other fields. |
| [LOAD-03](02-findings.md#load-03) | P1-14 | The gain tile uses Yearlings if they have a target, otherwise the first group that does, otherwise "None yet". Tiles are drawn inside a section guard. | LOAD-03: with the yearlings shipped there are 7 rows and no error. The "Yearlings renamed" case (10 rows, no error) was a scratch run, not in `coverage.mjs`. |
| [LOAD-04](02-findings.md#load-04) | P1-14 | A tank with no readings in the 7-day window draws "No readings in the last 7 days", and every later section still draws. | LOAD-04 |
| [UI-04](02-findings.md#ui-04) | P1-14 | Tank states come from the rule's own subject (`Tank <id> (`), not from the first word of the subject. | UI-04: "Well 2" and "Well 4" give 5 of 8 and 3 need a look. |
| [UI-05](02-findings.md#ui-05) | P1-14 | Month lines run from the first `in_date` to the later of `as_of` and the last planned move. | UI-05, on the committed season only. The GB-09 to GB-12 seasons were not run. |
| [UI-07](02-findings.md#ui-07) | P1-15 | The All filter shows "Nothing needs attention.". A spend exactly on budget shows 0.0% and 0%, never −0. A $0 total budget shows "No budget". | UI-07 for the on-budget case; code reading for the All message. The finding's "On budget" wording is not added; the difference reads $0. |
| [UI-08](02-findings.md#ui-08) | P1-15 | Every percentage that comes from `RULES` goes through `pct()` (`+(v * 100).toFixed(1)`). | Code reading only. No threshold was changed in a run. |
| [GRZ-06](02-findings.md#grz-06) | P1-16 | The card note now reads "A current stay shows the days left on its plan, or the days past it." Past stays carry no mark. The finding accepts a note in place of the marks; its test asks only that the note name the current stay, and this note does not say "only". | GRZ-06 |
| [UI-01](02-findings.md#ui-01) | P2-05 | Readings open on tap. They are also reachable from the keyboard: Tab to a chart, then use the arrow keys. Each tooltip shows the value first. | UI-01. The budget readout the finding names is now a table row: "Repairs Serious +25% $7,200 $9,000 +$1,800". |
| [UI-11](02-findings.md#ui-11) | P2-05 | Tooltips flip and clamp at the right, bottom and top edges, and stay below the sticky top bar. | Scratch keyboard sweep (section 2): 443 of 443 inside. Not in `coverage.mjs`; preserve check KEEP-05 repeats the sweep at 1280, 390 and 320 px. |
| [UI-10](02-findings.md#ui-10) | P2-03 | Chips are built once. A click updates `aria-pressed` without rebuilding them, so focus stays on the chip. | UI-10 |
| [UI-02](02-findings.md#ui-02) | P2-06 | On a phone each attention row is a card that shows the problem and the first step. Budget amounts fit their cells. | UI-02 |
| [UI-03](02-findings.md#ui-03) | P2-06 | Chart text renders at 11.5 px at every width. | UI-03, at 390 px only. Preserve check KEEP-21 measures 320, 390, 768, 1280 and 1920 px (11.48 to 11.5 px). |
| [UI-12](02-findings.md#ui-12) | P2-06 | No gain labels overlap. Tank names sit on one line, cut short with an ellipsis if needed. | UI-12 |
| [UI-14](02-findings.md#ui-14) | P2-06 | Group names get up to 30% of the width and are shortened with an ellipsis. Budget categories wrap inside a table cell. | UI-14. The finding's x <= 70 test assumes the old fixed margin; on the new page the check is that each label ends before the bars start. |
| [UI-15](02-findings.md#ui-15) | P2-06 | The line breaks where readings stop for more than 12 hours. | UI-15: two segments around a 36-hour gap |
| [UI-16](02-findings.md#ui-16) | P2-04 | The animals the warning rule flags are drawn in the warning colour, with a legend. The 50% and 80% lines are drawn and labelled. | UI-16: 6 flagged dots. A flagged dot differs from the others by colour only; that is a known issue a separate pull request fixes, not a feature to keep ([06 section 15](06-phase1-spec.md#15-open-decisions-and-assumptions)). |

### 3.2 Partly addressed

| Finding | Item | Done | Still to do |
|---|---|---|---|
| [LOAD-02](02-findings.md#load-02) | P1-06 | A loading message shows while the files load. A failed load says so and offers a retry button. Sections drawn after the load are isolated from each other. | Name the failed file, and still draw the areas whose files loaded. (Today one failed file stops the whole report.) |
| [LOAD-01](02-findings.md#load-01) | P1-06 | A missing file (404) no longer reads as "nothing needs attention": the whole report says it didn't load. A header-only `water.csv` shows "No data" on the tile and "No readings" on the water card, not "0 of 0, all reading normally". | Name the file. The list still says "Nothing in water needs attention." for an empty water file, and other empty files (health, for one) still read as clear, with no per-area CAN'T TELL. Check: LOAD-01 (partly). |
| [GAIN-13](02-findings.md#gain-13) | P1-16 | The gain chart says "Not shown: Cows, with no gain target set." | Add the line to the rules table and the README. |
| [UI-17](02-findings.md#ui-17) | P2-06 | Value labels can no longer cover category names: the names sit in their own table column, and labels are placed outside the bar, inside it, or across zero. | The scale has no cap, so one very large overrun still shrinks the other bars. The AB-09 and M1 cases were not run. |
| [WAT-01](02-findings.md#wat-01) | P1-07 | A last level that is text (a fault code such as "ERR") shows "Can't tell" on its tank card and in the tile, not "OK". Readings that aren't numbers are left off the line rather than drawn at 0%. | The rules still give a text level no row in the list, and still read a blank last level as 0. That tank's card and the tile then say "Go now" or "Fast drop" (the level shows a dash), and its list row reads "Down to % full" or ends "now %". Check: WAT-01 (display only, the "ERR" case). |
| [WAT-05](02-findings.md#wat-05) | P2-01 | Each tank card shows the time of its last reading ("at 6:00 PM", or the date and hour if the reading is from an earlier day). | The rules still judge a tank that has been silent for under 24 hours on its old level and count it OK. Check: code reading (`app.js` tank card). |
| [GRZ-03](02-findings.md#grz-03) | P1-08 | "TBD" shows "No plan" and draws no move date. A blank plan also draws no move date ("no planned move date"), but its pill reads "Past plan". | The rules still drop the alert for "TBD", and read a blank plan as 0 days and flag the stay: the list says "Day 24 of a -day plan (24 days over)". A blank `in_date` is not handled. Check: GRZ-03 (display only, the "TBD" case). The blank plan was a scratch run. |
| [BUD-03](02-findings.md#bud-03) | P1-12 | The budget table shows "no budget" for a $0 budget, and the tile shows "No budget" when the total is $0. | The list still reads "Infinity% over". Check: BUD-03 (display only). |
| [CSV-04](02-findings.md#csv-04) | P1-02 | A head count that isn't a number shows "330 + ?" and "? heifers". A weight that isn't a number shows "Can't tell" with the count of unreadable animals, never NaN. | A blank cell still counts as 0 in the rules. Check: the "weight that is not a number" line, for weights. The head-count case was a scratch run. |
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
- [LOAD-05](02-findings.md#load-05): the as-of list and the top-bar stamp still show no time zone and no data age.

**The display guards are placeholders.** They are the page's own guesses: a tank card's "Can't tell", the gain tile's
"Can't tell" and "No plan". Once Phase 1 returns CAN'T TELL rows from the rules (P1-06, P1-07), the page should take
those states from the rules and drop its own guesses. It keeps showing them in the same places, with the same pills
and words; only the source of the state changes.

## 4. Intentional differences from `cfd77e5`

The underlying values are the same. Every figure the `cfd77e5` page works out from the data has the same value on the
redesign: the 10 rows, the tile figures, the budget amounts and every chart reading. What changed is how they are
shown: wording, order and layout. The redesign also shows some new figures, worked out from the same data: the season
total, the number of pastures in use, planned move dates and head counts per group.

The table lists every difference in visible text on the committed data. It was checked on 2026-10-20 by comparing the
text of each page section at 1280 px, and at 390 px with touch, and every chart reading (Playwright Chromium; scratch
scripts, not committed). It does not cover colour, shape or spacing, other widths, or other data. Edited data can bring
up states the committed data never shows, such as "Can't tell" and "No plan" (section 3). Codex task I and Phase 1
should treat these differences as expected.

| Where | `cfd77e5` | Redesign |
|---|---|---|
| Top bar | None | A bar that stays at the top: "Example Ranch Operations", links to Attention, Water, Grazing, Gain, Budget and Rules, and "Data as of Sep 30, 6:00 PM". At 860 px and narrower the name and the date are hidden. A "Skip to what needs attention" link appears on keyboard focus. |
| Heading | "Ranch Operations Dashboard" and the one-line description | "Daily report" (shown in capitals) above the same heading and description. At 520 px and narrower the description is hidden. |
| As-of line | "Example Ranch (fictional), 4,300 acres in 8 pastures. Data as of September 30, 2026 at 6:00 PM." | A list: "Example Ranch (fictional)", "4,300 acres", "8 pastures", "As of September 30, 2026 at 6:00 PM" |
| Summary | Tile "Needs attention 10 / 2 critical, 6 serious, 2 warning" | Card "10 items need attention across 5 of 5 areas", with Critical 2, Serious 6 and Warning 2, and a "Review the list →" link (hidden at 520 px and narrower) |
| Tiles | Five tiles with labels in capitals, Needs attention first | Four tiles with labels in sentence case: "Head on grass", "Water tanks OK", "Yearling gain", "Spend vs budget". The gain and spend tiles add a bar. |
| Head on grass | "375 / 180 cows, 45 heifers, 150 yearlings" | "375", the three counts set apart, and a new line "Grazing 3 of 8 pastures" |
| Water tile | "5 of 8 / 3 need a look" | "5 of 8" with one status icon per tank, plus "3 need a look: T2 go now, T4 fast drop, T6 no signal" |
| Gain tile | "target 2.0, since Jul 20" | "Target 2.0, since Jul 20" |
| Phone order | Tiles, then the list | At 520 px and narrower: the summary card, the list, then the tiles |
| List note | "Thresholds are listed at the bottom of the page." | "The thresholds are listed under Rules at the bottom of the page." |
| Chips | "All (10)", "Water (3)" | "All 10", "Water 3" (count in a badge) |
| List on a phone | A table that scrolls sideways, with column headings | At 760 px and narrower each row is a card. The column headings are hidden, and the first step starts "First step: ". |
| Water card | Note "Dashed lines mark 40% (check soon) and 25% (go now)." | Note "The shaded bands are under 40% (check soon) and under 25% (go now)." (the dashed lines stay). A "5 of 8 OK" pill, with the critical icon on the committed data. A hint: "Hover, tap or focus a chart and use the arrow keys to read each reading.", or on a touch screen "Tap a chart, or slide a finger along it, to read each reading." |
| Tank order | T1 to T8 | Worst first, then by number: T2, T4, T6, then T1, T3, T5, T7, T8 |
| Tank status | The heading shows the level ("T2 Windmill 11.8%"), or "no signal" for T6 | A pill on each tank card: "Go now", "Check soon", "Fast drop", "No signal", "OK", or "Can't tell" |
| Tank level | In the heading, with no time. None for T6, whose chart says "no data". | Under the name, with the time of the reading: "11.8% at 6:00 PM". T6 shows "98.5%" and "last heard 42 h ago". Its chart shades the hours with no reading and, on the committed data, has no label at either width. |
| T4 reading | "Sep 30, 6 PM: 10%" | "10% / T4 Lone Tree · Sep 30, 6 PM" (value first). All 225 tank readings take this form. |
| Grazing chart | Bars, with "+3d" on the current overstay. Note "The current stay is green; days past the planned move are marked." | Note "A current stay shows the days left on its plan, or the days past it." A legend: Current stay, Earlier stays, Planned move date, Past the planned move. "3 days past plan" in place of "+3d". The head count under each group ("180 head"). A "Today" line. At 390 px a pasture ID that doesn't fit its bar is left off (6 of 23 bars); its reading still names it. |
| Now grazing | None | A list under the chart: "Cows in P7 South Divide, Day 18 of 21, move by Oct 3", "Heifers in P4 Lone Tree, Day 11 of 14, move by Oct 3" and "Yearlings in P3 Sand Hills, Day 24 of 21, move was due Sep 27". Each has an "On plan", "Move soon", "Past plan" or "No plan" pill. |
| Grazing readings | "Cows in North Flat / Jun 1 to Jun 22 (21 days) / Plan: 21 days" | "21 days / Cows in P1 North Flat / Jun 1 to Jun 22 · plan 21 days" (value first, with the pasture ID). The two current stays still on plan add "Planned move Oct 3, 3 days left". All 23 readings take this form. |
| Sand Hills reading | "Sep 6 to now (24 days) / Plan: 21 days" | "24 days / Yearlings in P3 Sand Hills / Sep 6 to now · plan 21 days / 3 days past the planned move" |
| Gain chart | Group name, "avg 0.44" and "target 1.0". Axis title "lbs per day". Note "One dot per animal; the line is the group's target. Hover a dot for the tag." | "45 weighed · average 0.44 vs 1.0 target", an "Under 80% of target" badge on a flagged group, and "50%" and "80%" labels on the reference lines ("50% · 80%" as one label when the lines sit close, as for Heifers at 390 px). Axis title "Average daily gain, lbs per day". Note "One dot per animal against the group's target." A legend. Under the chart: "Not shown: Cows, with no gain target set." |
| H026 reading | "H026 (Heifers) / 0.11 lbs/day, Jul 20 to Sep 15 / Now 1136 lbs / Under half of target" | "0.11 lbs/day / H026 · Heifers / Jul 20 to Sep 15, now 1,136 lbs", with no flag line (next row) |
| Gain flag | "Under half of target" on each reading under 50% of its group's target: 38 readings (32 heifers, 6 yearlings) | "Flagged: under 50% of target" on the 6 yearlings the warning rule flags, which are also drawn in the warning colour. Heifer readings carry no flag, because the rule skips a group that is already flagged as a whole. All 195 readings keep their values. |
| Budget | A chart and a table. Chart axis "-20% -10% 0% +10% +20%". Key "Under budget / Over budget". | One table, in the same order. Axis "−25% 0 +25%" in the column heading. Note "Categories sorted from most over budget to most under." Rows the rules flag are coloured by severity and carry its pill. Key "Serious: more than 10% over / Warning: 5–10% over / Not flagged". |
| Budget readings | A tooltip on each bar, such as "Vet and health / Budget $6,000 / Actual $5,945 / Under by $55" | None. The table row has the same amounts ("−$55"). |
| Repairs | A chart tooltip: "Budget $7,200 / Actual $9,000 / Over by $1,800" | A table row: "Repairs Serious +25% $7,200 $9,000 +$1,800". There is no separate budget chart. |
| Season total | None | A total row: "Season total +1% $88,400 $89,303 +$903". These are the Spend tile's totals. |
| Budget on a phone | The table scrolls sideways | At 640 px and narrower the Budget and Actual columns are hidden, and each name has "actual of budget" under it: "Repairs Serious $9,000 of $7,200 +25% +$1,800", "Season total $89,303 of $88,400 +1% +$903" |
| Rules table | Water rows in the order critical, warning, serious. The area on every row. | Grouped by area, worst first within each area (Water: critical, serious, warning). Above 640 px the area is printed once per group. Note "The demo's thresholds. A ranch would set its own." At 640 px and narrower the table sits behind "Show the rules". |
| Footer | "Example Ranch and all of its data are fictional, generated by scripts/generate_data.py." under the rules | The same sentence in a footer, plus "The page flags readings and records for a person to check; it does not diagnose animals or replace a vet." and "One static page: plain HTML, CSS and JavaScript reading CSV files." |
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
| `.mini h4` (tank heading and level) | `.tank-name` and `.tank-head .pill`; the level is `.tank-level b` and its time `.tank-level span` |
| `#budgetChart svg` | None. The bars are `#budgetTable .track .bar`, and the labels are `.track .val`. On the committed data there are 7 tracks, the 6 categories and the `tfoot` season total; a 0% row has no `.bar`. |
| `#budgetTable` (header and 6 rows) | `#budgetTable` (`thead`, 6 `tbody` rows, and a `tfoot` season total) |
| `#rules` (12 rows including the header) | `#rules` (`thead` and 11 `tbody` rows) inside `<details id="rulesMore">` |
| Hover tooltips in `#tip` | `#tip`, opened by hover, tap, or focus plus the arrow keys |
| Tiles `#tiles .tile` (5: Needs attention, Head on grass, Water tanks OK, Yearling gain, Spend vs budget; labels in capitals) | `#tiles .tile` (4: Head on grass, Water tanks OK, the gain tile, Spend vs budget; labels in sentence case). The count moved to `#summary` (`.hero-num`, `.sevlegend`), so `cfd77e5`'s `tiles[3]` is `tiles[2]` here. |

The preserve checks in [redesign/preserve.mjs](redesign/preserve.mjs) were written for the redesigned page and need no
mapping.

Start Phase 1 from main, which has the redesigned `app.js`, and keep what
[06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign) lists. The findings' `app.js`
and `index.html` line numbers refer to `cfd77e5` (`git show cfd77e5:app.js`).
