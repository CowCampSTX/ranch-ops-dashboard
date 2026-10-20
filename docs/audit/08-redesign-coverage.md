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
| Preserve checks | `node docs/audit/redesign/preserve.mjs http://localhost:8766/`, with the working tree served on port 8766 (page files identical to main at `0315d09`; read-only, Playwright Chromium) | 34 PASS, 0 FAIL on 2026-10-20 with the script before the follow-up pull request of section 6 (KEEP-01 to KEEP-34, [06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)). After the Checkpoint 1b dry run made KEEP-01 (`aria-describedby="chart-help"`), KEEP-06 (`touch-action: pan-y` on every chart), KEEP-13 (the time on each tank card) and KEEP-23 (no break at a 12-hour gap, a break at 18 hours) stricter, re-run the same day: 34 PASS, 0 FAIL on main, and each of three scratch copies of main broken on purpose fails only the check meant to catch it (charts set to `touch-action: none`: KEEP-06; the tank card time removed: KEEP-13; the outage break moved from 12 to 30 hours: KEEP-23). Scratch runs of the same checks before they were committed: 34 PASS with prebuilt odd-data folders, 34 PASS on a copy of main given the Phase 1 wording, and 1 PASS, 33 FAIL on the `cfd77e5` page (only KEEP-09, no sideways scroll, holds there). |
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
| [UI-16](02-findings.md#ui-16) | P2-04 | The animals the warning rule flags are drawn in the warning colour, with a legend. The 50% and 80% lines are drawn and labelled. | UI-16: 6 flagged dots. On `0315d09` a flagged dot differed from the others by colour only, a known issue of [06 section 15](06-phase1-spec.md#15-open-decisions-and-assumptions). Since the follow-up pull request it is an amber square (section 6). |

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

## 6. The follow-up pull request

The follow-up pull request fixes the four known issues of
[06 section 15](06-phase1-spec.md#15-open-decisions-and-assumptions) on main, and other findings of the review of the
redesign and of the checks run on its own fixes. Neither report is saved in this repository; the ids below are theirs.
It changes `index.html`, `app.js`, KEEP-24 in [redesign/preserve.mjs](redesign/preserve.mjs), the UI-16 selector in
[redesign/coverage.mjs](redesign/coverage.mjs), the four README images in `docs/screenshots/` with a new script that
takes them ([capture.mjs](../screenshots/capture.mjs)) and that folder's README, the repository's README (one sentence
about the gain chart, and its file list), `AGENTS.md` (its line for `docs/screenshots/`), `docs/README.md` (that
folder's row), this page and [06](06-phase1-spec.md). It also brings the Phase 1 guidance in line with 06 section 6.3:
[HANDOFF.md](HANDOFF.md), Checkpoint 2 of [CODEX_REVIEW_PROMPT.md](CODEX_REVIEW_PROMPT.md), [05](05-roadmap.md) and
[04](04-workflow-and-features.md), and [README.md](README.md) in this folder says which script its preserve record came
from and which changes before Phase 1 touch production files.
`exceptions.js`, `data/`, `tests/` and `scripts/` are untouched. No count, amount, percentage or date shown changes.
Sections 1 to 5 above describe the page at `0315d09` and the scripts as they were then. Section 2's preserve record
(34 PASS) came from KEEP-24 as it was before this pull request; the changed script gives 33 PASS on `0315d09`'s page
files, with only KEEP-24 failing, by design ("Checks run", below).

Each fix was checked on 2026-10-20 or 2026-10-21 with Playwright Chromium, against a copy of `0315d09`'s page files or
of the page just before that fix, with scratch scripts that are not in the repository. Odd-data cases edit the
fictional CSVs in the browser (`page.route`). Findings about the wording of this page and of the pull request
description (REG-R1-01, VF1-01, VIS2-03 and SPEC-V1-01) were fixed in the text. So were the eighth check round's
findings about the documents: REG-R1-01 of that round (the widths where the water tile's note wraps, VISUAL-05 below),
DOC-01 (05's P2-04 criteria), DOC-02 (records of 34 PASS that came from the script before this pull request; it missed
three, two of them fixed since, DOCS-R2-01 below), DOC-03 (VISUAL-10's figures without the pad), DOC-04 (`app.js` line
numbers, now tied to `0315d09`), DOC-05 (REG-01's list of image changes), DOC-06 (06 section 14 and 05's RULE-WF-08
paragraph) and DOC-07 (the description's list of changed 06 sections). A ninth check round ran on 2026-10-21, after the
last of these fixes, and a final check after that. What each found, and what this pull request did about each finding,
is listed under "Found by the ninth check round" and "Found by the final check", below the table.

| Finding | What changed | How it was checked |
|---|---|---|
| A11Y-02, VIS-R1-01, VIS-R1-04, VIS-R1-05, SPEC-R3-01 (section 15), VR4-01, VF4-01, K24-PATH, K24-PCTRX, K24-KEYTOL, K24-KEYMATCH, VIS-R2-01, V2-01 to V2-04, DOCS-V1-01 | A flagged gain animal is an amber square, not a dot. [06 section 5.1](06-phase1-spec.md#51-common-result-model) keeps the hollow diamond for the CAN'T TELL marker, so the flag uses a shape that no other state uses. The square is as wide as a dot (VR4-01): at 8.5 px against an 8 px dot it had about 1.42 times a dot's ink, so a flagged group looked larger than its count, while the two legend keys are the same size. The legend's flag key is a square in the same 9 px box as the dot key. The swarm measures each pair of marks by their shapes (VIS-R2-01): two squares keep 2 px between their sides, a square and a dot keep 2 px between the dot and the square's nearest point, and two dots keep the rule of `0315d09`. So squares stack 2r + 2 apart, as dots do (10 px where a dot's radius r is 4 px, 9 px where it is 3.5 px). Before, the swarm spaced a square by the circle through its corners, and two stacked squares sat 12.49 and 11.07 px apart. A square cannot sit in the hollow between two marks below it as a dot can, so a flagged stack can still be taller than the same animals drawn as dots. The keyboard highlight ring and the row's height still use the circle through a square's corners (5.2 px from its centre where r is 4 px, 4.5 px where it is 3.5 px), so the ring clears the corners. KEEP-24 judges each mark element's own fill, not the element's name or the text of a style (VF4-01). It tests nine points of each mark's box with the browser's `isPointInFill`, in the chart's coordinates (K24-PATH, K24-PCTRX), and works out a key's corners from the key's own box and border radii in px. A shape is round when the points near its box's corners fall outside it and points on its diagonals fall inside, and has corners when the points near its corners fall inside; an 8 px `rect` counts as round from an `rx` of 3.3 px, and a 9 px key from a radius of 3.7 px (41% of the side). The flagged marks must differ in shape from the plain dots, and each key must have the shape of the marks in its colour (K24-KEYMATCH), at 1280 x 900, 390 x 844 with touch and 320 x 640 with touch, each size reported on its own (V2-03). A mark with its own `clip-path` or mask, or a key with its own `clip-path`, mask or transform, cannot be judged and fails (K24-KEYTOL). KEEP-24 does not see whether a mark or key can be seen at all: an `opacity`, `filter` or `visibility` on it or on its parent, or a mark's own `fill-opacity`, can hide the flagged marks or the flag key while it passes (DOCS-V1-01; a `visibility` attribute on the mark itself, or `display: none`, fails it). Nor does it see a mark's stroke, a clip or mask on a mark's ancestors, a shape painted on top of a mark, or a key's background image or a clip on its wrapper; it counts no mark drawn with `<use>`, so such marks fail it (V2-01, V2-02, V2-04). Those limits are written in [06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign) ("Limits of the checks") and in the check's comment, not closed by a stricter check, and a reviewer still looks at the gain chart and its legend. | Committed data at 1280 x 900, 390 x 844 (touch) and 320 x 640: 189 dots and 6 squares, 8 px wide at 1280 and 7 px at 390 and 320, the dots' diameter, corners rounded by 1 px. After the VIS-R2-01 change, on the committed data and with 18 flagged animals: a keyboard sweep of the gain chart gives 195 readings in the same order and with the same text as on `0315d09` at 1440, 1280, 1024 and 768 px and at 390 and 320 px with touch; hovering (1280 px) and tapping (390 and 320 px) each square, 6 and 18, shows its tag and "Flagged: under 50% of target", with the ring centred on the square and 2.0 px clear of its corners. One page resized in 1 px steps from 320 to 1920 px, each gap worked out from the marks' attributes (`rx` corners included): between two squares at least 2.000 px, between a square and a dot at least 2.003 px (with 18 flagged; on the committed data no square sits near a dot), and between two dots at least 1.999 px, at 346 px: the dot rule, unchanged from `0315d09`, accepts a spot whose squared distance is up to 0.01 px² short. The gain chart's height is the same as before the change at all 1601 widths, in both cases. The flagged marks' stack, against the same animals drawn as dots on `0315d09` (`getBBox`, fresh loads): with 18 flagged, 48.0 against 40.8 px at 1280 px (1.18 times; 1.65 before the change), 43.0 against 41.1 px at 1024 px (1.05; 1.49), 61.0 against 55.8 px at 390 px (1.09; 1.50) and 79.0 against 75.3 px at 320 px (1.05; 1.37); on the committed data 18.0 against 15.9 px at 1280 px (1.13; 1.19), 16.0 against 14.5 px at 1024 px (1.10; 1.17), 16.0 against 15.3 px at 390 px (1.05; 1.24) and 25.0 against 17.8 px at 320 px (1.40; 1.36). Over the 1601 widths the median is 1.18 times with 18 flagged (1.57 before) and 1.13 on the committed data (1.19 before); the new packing gives a shorter stack than the old at 1414 and 1352 widths and a taller one at 182 and 237. It is tallest against the dots at 950 to 957 px, where the dots lie in one line and the squares need two: 18 against 8 px on the committed data (15.5 px before) and 48 against 28 px with 18 flagged (42 px before). 3x crops at 1280, 390 and 320 px, both cases: the squares sit in an even grid with a clear gap, and the square key and the dot key match them in size. The changed KEEP-24 passes on the fixed page at all three sizes and fails on `0315d09` at all three, on the eighth check round's copies whose flagged marks or flag key are round, on copies whose keys are swapped, and on the ninth round's copy that is round only under 460 px, at 390 and 320 px ("Checks run", below); the old KEEP-24 fails on the fixed page ("189 dots, 0 in a second colour"). It still passes the ninth round's copies that show round flagged marks or a round flag key in the ways it does not see (V2-01, V2-02), and copies that hide the flagged marks or the flag key (DOCS-V1-01). On this page, at all three sizes, no element from a flagged square or the flag key up to `body` has an opacity or `fill-opacity` under 1, a filter, hidden visibility or `display: none`. |
| CODE-03, VISUAL-01, VIS-R1-02, VIS-R1-03, VR3-01, VQ3-01, VQ3-02, VF1-02, A11Y-R1-01 of the fourth check round, A11Y-R2-01 (section 15) | The gain tile's meter takes the rule's severity colour only when the rules flag the tile's group, with the severity icon and "Under 80% of target" under it. Otherwise it is in the series colour. The spend meter is always in `--s1-mute`, the colour the budget table gives the season total and its "Not flagged" key, because the rules never judge the season total. A meter's empty track is the page's faint `--wash` (3.5% white, 7% before), so that muted fill keeps 3:1 against it; the track's 1 px edge still shows the meter's length. In a dark forced-colours theme the spend meter alone takes a lighter step of that green, #3a9a58, so it keeps 3:1 on a dark Canvas that is not black. The budget bars, the earlier stays bars and their keys keep #2a7140: their labels are CanvasText, which has 5.94:1 on #2a7140 and only 3.53:1 on #3a9a58. | Committed data: the gain meter in the series colour, and the tile text the same as on `0315d09` at 18 widths from 320 to 1440 px. Yearlings removed (Heifers on the tile): a serious meter with the icon and the words, on one line from 390 px (a 5 px gap leaves 0.88 px to spare at 390 px) and as "Under 80%" and "of target" at 320 to 375 px. That is in Inter, which the test machine has installed; the page loads no web font, so a phone without Inter uses its own system font. Liberation Sans, with Arial's widths, also keeps one line at 390 px; DejaVu Sans, a wider font, takes two balanced lines at 390 and 412 px. Roboto and San Francisco, the usual phone fonts, are not on the test machine and were not checked. Before that line was balanced, nothing in the tile ran past its edge at 1440, 1280, 390 and 320 px. Spend at +1.0% (committed) and +14.2% (Fuel doubled), at 1440, 1280, 390 and 320 px: the meter is rgb(42, 113, 64), the colour of the table's Season total bar, with the same text as on `0315d09` (where +14.2% was serious orange). Sampled pixels at 1280, 390 and 320 px, device pixel ratio 1 and 2: its fill has 3.03 to 3.07:1 contrast with the empty track (2.78 to 2.80:1 with the 7% track), and 3.24 to 3.26:1 with the tile; the track's edge has 3.39 to 3.43:1 with the tile (3.69 to 3.71:1 before). The fill carries no state, and the words give the amount. Forced colours, dark, at 1280, 390 and 320 px, committed and +14.2% (A11Y-R2-01): the spend fill is rgb(58, 154, 88), 5.94:1 on the black Canvas (3.53:1 with #2a7140). With the tile painted in Dusk #2D3236 and Aquatic #202020, a simulation because this Chromium's emulation has only a black or a white Canvas, it is 3.67:1 and 4.61:1 (2.18:1 and 2.74:1 with #2a7140). Plain dark and forced light are unchanged: rgb(42, 113, 64) and rgb(79, 154, 100). The budget bars, the earlier stays bars and the "Not flagged" and "Earlier stays" keys stay rgb(42, 113, 64), 2.18:1 on Dusk and 2.74:1 on Aquatic, as on `0315d09` (see "Seen and not changed"). Not tested on real Windows. |
| BUDGET-WIDTH, VF-01, VV2-01, BUDGET-WIDTH-NBSP, VF-01-SPACING-AFTER-LOAD (section 15) | A run of 16 or more characters with no space (a no-break space counts as part of the run) may break where it does not fit in a list cell. In the budget category cell it may break only when `placeBudgetLabels()` finds the table too wide for its card or the window. That test runs again when the table's size changes, for example when text spacing is added. | 390 x 844 with touch, `scrollWidth`/`clientWidth`: a 60-character category with no space gives 655/390 before and 390/390 after, on Repairs (flagged) and on Labor; the category `<img src=x onerror="window.__xss_c=1">Repairs` gives 465/390 before and 390/390 after. All three fit at 14 widths from 320 to 1280 px, with the name shown literally and no `img` element. At 1024 px and wider the 60-character name stays on one line, in the columns `0315d09` gives it. Committed and long-name data: every budget table and list cell box the same as on `0315d09` at 18 widths. With Labor or Repairs renamed "Communications", "Transportation" or the 60-character name, at 320, 360 and 390 px: the page keeps its width, and the name breaks with no hyphen ("Communica" and "tions" at 320 px; VQ3-03, below). |
| CODE-06, SPEC-R1-02, SPEC-R2-01 (section 15) | The "Not shown" note under the gain chart also names each group that has a target but no weigh-ins, and it shows when no group draws dots. A group name made only of digits no longer stops the note. | A fictional Bulls group with a target and no weigh-ins: `#gain p.hint` reads "Not shown: Cows, with no gain target set; Bulls, with no weigh-ins yet." at 1280 and 390 px. A name with markup shows literally. Committed data: "Not shown: Cows, with no gain target set." as before. No weigh-ins at all: the note shows inside the empty-chart placeholder. Heifers renamed "2025": no error from the gain chart, and the note shows. |
| A11Y-03, VF-02, SPEC-R1-01, A11Y-R1-01, A11Y-R1-02 | Under WCAG 1.4.12 text spacing: the grazing chart's triangle moves clear of "3 days past plan"; the gain badge grows to hold its words and the group name before it is shortened so the badge stays inside the chart; a gain group line that would run past the chart is shortened; a tank chart's first date hides when it would touch the last. These re-place when the text changes size. | Spacing added before and after load at 1280 x 900 and 390 x 844: the triangle overlaps the label by 0 px (10.0 px before), and the badge text sits inside its pill (it ran 25.6 px past it before). Five group names at 320, 390, 768 and 1280 px, with and without spacing: no badge past the chart (6 cases before). Without spacing the badge, lines and dates are drawn as on `0315d09`. Resizing and toggling the spacing logged no errors. |
| VISUAL-09 | The "days past plan" label ends 5 px short of the bar end, clear of the Today line. | 6.0 px from the Today line at 1440, 1024, 768, 390 and 320 px (1.0 px before). |
| VISUAL-10, SPEC-R3-02, REG-R3-01 (second part), REG-R1-02, VIS2-02, SPEC-V1-02 | The gain chart's text starts at its left edge, in line with the legend and the note. Its marks, grid, reference and target lines sit inside a pad 1 px wider than a keyboard ring reaches (10.2 px where the chart is 460 px wide or more, 9.5 px where it is narrower; a square's ring reaches 9.2 and 8.5 px from its centre), so a gain at the axis start keeps its whole mark and ring inside the chart. The first axis label ("0.0" on the committed data) is start-anchored at the chart's left edge, so its gridline, at the pad, lies inside the label's box and not at the label's `x`. Every other label has its gridline's `x`: centred on it, or end-anchored at the axis end. A Phase 1 check that pairs labels with gridlines (P1-09 item 5) should pair them by the label's box, not by `x`. | The chart text, the legend and the note start at the same x at 1440, 1024, 768, 390 and 320 px (the chart text sat 6 px further in at 1440, 768, 390 and 320 px before). A gain of 0.00 (Y027, a flagged square, and H026, a dot) and of -0.50 (Y001 and Y027), at 161 widths from 320 to 1920 px with a mouse and with touch: the mark starts 6.0 to 6.2 px inside the chart and its keyboard ring 1.0 to 2.2 px inside (with a left margin of 0 and no pad, the mark reached 4.0 px and a square's ring 9.2 px outside at 1280 px, and 3.5 and 8.5 px on a chart under 460 px). On the committed data the 195 readings are the same as on `0315d09` at 1440, 1280, 1024, 768, 390 and 320 px, and the axis labels are the same at every width from 320 to 1920 px (1 px steps). With a gain of -0.50 the axis changes from whole to half steps at 412 px (408 px on `0315d09`). On the committed data, compared with `0315d09`: the marks, grid and reference lines sit further right by up to 3.5 px (chart under 460 px) or 4.2 px (wider chart) at the axis start, and by less towards the far end (the leftmost mark moves 3.4 or 4.1 px); the plot is that much narrower, so the swarm packs differently and the gain chart's height changes with the width (one page resized in 1 px steps from 320 to 1920 px), from 23.0 px shorter (at 322 px) to 41.9 px taller (at 456 px): +22.5 px at 390 px, +41.8 px at 457 px, +2.5 px at 1240 px and wider, and within 1.3 px at 360, 412, 768 and 1024 px; and at 402 to 405 px the Heifers row's "50%" and "80%" labels share one label, "50% · 80%", as they do at 401 px and narrower on both pages. No reading, value or tick label changes, and no label overlaps another or leaves the chart. |
| VISUAL-11 | A tank whose last level is not a number ends in a hollow dot, as a silent sensor does. | T7's last level set to "err" and to blank: a hollow dot. The other seven charts, and all eight on the committed data, are the same as on `0315d09`. |
| VISUAL-02 | In the two-up row, a chart with nothing to draw becomes a dashed placeholder that fills its card, with the reason centred. | No moves at 1440, 1024 and 961 px, and no gain targets at 1440 and 1024 px: no gap under the placeholder (431.6 px of empty card before, no moves at 1440 px). 140 px tall when the cards stack. Committed data: this change moves nothing in either card. |
| VISUAL-03 | From 641 to 900 px a flagged budget row's pill sits on its own line under the name. | At 641 to 900 px the pill's left edge equals the name's; at 901 px and wider the rows are unchanged. |
| VISUAL-04, REG-R4-01 | From 901 px the summary card spans the right half of the tile row. It is 594 px wide at 1280 px and wider (500 px before). | Its left and right edges meet the tile columns at 9 widths from 901 to 1920 px. A resize in 1 px steps from 895 to 1060 px: only at 1013 to 1032 px does the card's height differ from `0315d09`. There the wider card puts each count beside its label, as `0315d09` does from 1033 px, so the card is 26.9 px shorter (189.2 px against 216.1 px), with the same text. |
| VISUAL-05, VF-04 | A tank and its state, a move date, and "8 pastures" stay together on one line; notes avoid a one-word last line. | Rendered lines at 320, 390 and 1024 px, with the same text as before. At 320 to 391 px the water tile's note takes 4 lines (3 on `0315d09`). From 382 to 391 px that makes the top row of tiles grow from 183 to 200 px (`#tiles` 16.3 to 16.7 px taller); at 381 px and narrower the row keeps its height, because the Head on grass tile is as tall there (a check of the eighth round resized one page in 1 px steps from 1920 to 320 px, with a mouse and with touch; fresh loads at 13 widths from 320 to 400 px agree). |
| VISUAL-06, VF-03 | A click on a top-bar link, and Back after it, lights that link when Grazing and Gain sit side by side. | At 1440, 1024 and 961 px. KEEP-32 now reports "Gain->#gain-sec". |
| VISUAL-08, REG-R3-01 (first part) | The water pill names its state: "Critical · 5 of 8 OK" on the committed data. With every tank OK it reads "N of N OK" with the check icon and no word added. | Committed data at 1440, 390 and 320 px, on one line; an all-OK water file. The wider pill no longer fits beside "Water tanks, last 7 days" at 847 to 898 px, so there it sits under the note, as it already did at 846 px and narrower on `0315d09`; the water card is 38.6 px taller at those widths (1046.1 px against 1007.5 px at 860 and 880 px). |
| A11Y-05 | The brand link's name is "Example Ranch Operations, back to top", and its text reads "Example Ranch Operations" with a space. | Playwright `ariaSnapshot` and `textContent` at 1280 and 390 px. axe-core is not installed here. A later check ran axe-core 4.10.2 from a downloaded copy, not added to the repository, with the WCAG 2.0, 2.1 and 2.2 A and AA tags: 0 violations on this page and on `0315d09`, on the committed data and three odd-data cases, at 1280 px and at 390 px with touch, with and without text spacing. In the same run a name-against-label probe found the brand link's mismatch on `0315d09` ("Example Ranch, back to top") and none on this page. |
| REG-01 | The README images `screenshot.png`, `water.png`, `grazing-gain.png` and `phone.png` were retaken from the fixed page with [capture.mjs](../screenshots/capture.mjs), a new script in their folder. `grazing-gain.png` is now 1312 px tall (1306 before). They were retaken on 2026-10-21 after the VIS-R2-01 change: only `grazing-gain.png` changed, at the same size, and the other three came out the same byte for byte. | The script run on `0315d09`'s page files gives the four images committed before this pull request, byte for byte, so it takes them the way they were taken. Run on the fixed page, it gives images that differ from those only where the page changed: the summary card, the tile meters and the line breaks of two tile notes, the water pill, the "days past plan" label on the grazing chart, the gain chart, and one re-wrapped note on the phone. Each image was looked at: the six squares, as wide as the dots, their square key and the note "One mark per animal against the group's target." in `grazing-gain.png`, the spend meter in rgb(42, 113, 64) beside the gain meter's rgb(62, 207, 115) in `screenshot.png`, "Critical · 5 of 8 OK" in `water.png`, and no card cut off. |
| VF4-02 | The note above the gain chart reads "One mark per animal against the group's target." ("One dot per animal" before), because a flagged animal is now a square. The repository's README and the "Today" cell of [06 section 10.2](06-phase1-spec.md#102-page-copy-changes) quote the new sentence. | Before the change, `grep` found the sentence in no check or criterion: not in 06, 05, `preserve.mjs` or `coverage.mjs`, apart from the 06 section 10.2 row that quotes it. The preserve and finding checks pass after it (below). One page resized in 1 px steps from 320 to 1920 px: the new note is a little wider, so at 351 to 362 px it takes two lines where the old one took one, and the gain card is 20.2 px taller there. At every other width it wraps as before. The README image `grazing-gain.png` shows the new note. |
| SPEC-R4-01 | The Phase 1 guidance now matches 06 section 6.3 ("Status marks beyond colour"). [HANDOFF.md](HANDOFF.md) says the follow-up fixed the colour-only marks on main and Phase 1 keeps them, and its definition of done drops the exemption for "the fix for the colour-only marks", as 06 section 11.4 item 6 did. Checkpoint 2 of [CODEX_REVIEW_PROMPT.md](CODEX_REVIEW_PROMPT.md) adds the squares and their key, the gain tile's flag line and the tile meter colours to what must be kept (removing them is BLOCKING), and its item 2 drops the same exemption. [05](05-roadmap.md) section 2.1 item 13, P2-04, P2-05 and section 4, and [04](04-workflow-and-features.md) step 3 and "Since the redesign", say the marks were colour-only at `0315d09` and are fixed on main. Checkpoint 1b is unchanged, as the record of what was run. | `grep -n -i "colour-only\|colour only\|colour alone\|known issue\|separate pull request"` over those four files now finds Checkpoint 1b's lines, RULE-WF-01's text ("never by colour alone"), and sentences that say the marks were colour-only at `0315d09` and fixed on main; no line says a separate pull request fixes them or that the marks are colour-only now. The grep without "colour only" and "colour alone" missed the P2-04 criteria (DOC-01), fixed since. No page change. |

**Found by the ninth check round.** The ninth check round ran on 2026-10-21 with Playwright Chromium, after the last
fixes above, on scratch copies of this page that are not in the repository. All but DOCS-R2-05 come from this pull
request. None of them changes a reading or a value shown. Each entry says what was found and what was done.

- VIS-R2-01. The swarm spaced a square by the circle through its corners, so two squares one above the other sat
  12.49 px apart, centre to centre, where two dots sit 10 px apart (11.07 against 9 px on a chart under 460 px). With 18
  flagged animals their stack was 1.65 times as tall as the same animals drawn as dots on `0315d09` at 1280 px (67.2
  against 40.8 px). Fixed: the swarm measures each pair by its shapes, and squares stack 2r + 2 apart, as dots do
  (A11Y-02 row above, with the measurements). The fix leaves the gain chart's height as it was at every width from 320
  to 1920 px, on the committed data and with 18 flagged animals.
- V2-03. KEEP-24 judged the shapes at 1280 x 900 only, so a copy that drew round flagged marks and a round flag key on
  a chart under 460 px gave 34 PASS. Fixed: KEEP-24 now judges the marks and keys at 1280 x 900, 390 x 844 with touch
  and 320 x 640 with touch, and reports each size. That copy now fails it at 390 and 320 px ("Checks run", below).
- V2-01. KEEP-24 judges each mark element's own fill only. Five copies of this page show the six flagged animals as
  round amber discs and still pass it with "6 flagged (corners)": a 0.2 px square with an 8 px amber stroke and round
  joins; the square inside a `<g>` with a round `clip-path`; the same with a `mask`; the square under a shape in the
  surface colour that covers its corners; and near-amber circles (`color-mix(var(--warning) 99%, white)`) beside amber
  squares hidden by their own `opacity: 0` (a mark's own opacity, which the list of limits left out until DOCS-V1-01,
  below).
- V2-02. KEEP-24 reads only the flag key's own box and corner radii. A key made round by its parent (a round
  `clip-path`, or `border-radius: 50%` with `overflow: hidden`) or by a background image painted over its corners
  still passes. With round marks as in V2-01 as well, the whole script gave 34 PASS on two such copies.
- V2-04. KEEP-24 counts shape elements only. A copy that draws correct squares with `<use>` fails it ("1 flagged
  (corners)": it counts the one `rect` inside `<defs>` and none of the six `<use>`).
- For V2-01, V2-02 and V2-04, KEEP-24 was not made stricter against copies built to slip past it. Instead the check's
  comment in [redesign/preserve.mjs](redesign/preserve.mjs), 06 section 6.3 ("Status marks beyond colour" and "Limits of
  the checks"), the A11Y-02 row above and the pull request description say what it judges (each mark element's own fill
  and each key's own box and corner radius, at three sizes) and what it does not see (whether a mark or key can be seen
  at all, added by DOCS-V1-01 below; a mark's stroke; clips or masks on ancestors; shapes painted on top; a key's
  background image or a wrapper's clip; marks drawn with `<use>`, which fail it), and that a reviewer still looks at the
  gain chart and its legend. This page draws a `rect` for each square, and a probe of the ninth round at 1280 px found
  no clip, mask, filter, transform, hidden overflow or opacity under 1 on the parents of a flagged mark or of the flag
  key; the squares' stroke is the surface colour, rgb(11, 13, 11).
- DOCS-R2-01. [HANDOFF.md](HANDOFF.md) ("Keep what the redesign already does") and section 2 of this page recorded
  "34 of 34 on main" without saying it came from the script before this pull request. Fixed in both: the changed
  script gives 33 PASS on `0315d09`'s page files, with KEEP-24 failing, by design. `docs/project/STATUS.md` (not in
  this pull request) has the same record; its line for this pull request should say the same.
- DOCS-R2-02. 06 section 6.3 ("Grazing and gain charts") said the gain chart's inset is as wide as the keyboard ring
  reaches. It is 1 px wider: at 1280 px the pad is 10.24 px and a square's ring reaches 9.24 px from its centre
  (`pad = m.l + rq + 5` in `app.js`). Fixed in 06; VISUAL-10 above and the description already said so.
- DOCS-R2-03. `AGENTS.md` ("Repository layout") and the repository's README (its file list) described
  `docs/screenshots/` as images only. Both now name `capture.mjs`.
- DOCS-R2-04. 06 section 15 said, in the present tense, that two kinds of mark on main show status by colour and that
  "a separate pull request fixes them", and dated the fix 2026-10-20 only. It now says they did so at `0315d09`, that
  "the follow-up pull request below fixes them", and dates the fix 2026-10-20 and 2026-10-21.
- DOCS-R2-05 (also on `300bbac`). [README.md](README.md) in this folder said the redesign is the only change meant to
  touch production files. It now says the redesign (#2) and its follow-up pull request are the changes before Phase 1
  that touch production files.

**Found by the final check.** A final check on 2026-10-21, with Playwright Chromium on scratch copies of this page that
are not in the repository, found one more gap in what this page and the check say about KEEP-24. It changes no reading
or value shown.

- DOCS-V1-01. The list of what KEEP-24 does not see left out whether a mark or key can be seen at all. Copies of this
  page whose six flagged squares had `opacity: 0`, `fill-opacity` 0 or `visibility: hidden` in a style passed KEEP-24 at
  all three sizes with "6 flagged (corners)", and so did a copy whose flag key had `opacity: 0` ("flag corners"). The
  whole script gave 34 PASS on the `opacity: 0` copy, with no flagged animal left on the chart. More copies passed the
  same way: `filter: opacity(0)` or an `opacity` of 0.01 on the squares; `opacity: 0`, `filter: opacity(0)` or a
  `visibility="hidden"` attribute on a `<g>` around each square; `visibility: hidden` or `filter: opacity(0)` on the
  flag key; and `opacity: 0`, `visibility: hidden` or `filter: opacity(0)` on the key's wrapper. In all, 14 such copies
  pass it, and three fail it: a `visibility` attribute on the squares themselves takes them out of the count, and
  `display: none` on the squares or on the key leaves nothing to test. The fp-decoy copy of V2-01 hid its squares the
  first way, by their own `opacity: 0`. As for V2-01, KEEP-24 was not made stricter: the check's comment, 06 section 6.3
  ("Limits of the checks"), the A11Y-02 row above, V2-01 and the pull request description now name this limit. On this
  page, at 1280, 390 and 320 px, no element from a flagged square or the flag key up to `body` has an opacity or
  `fill-opacity` under 1, a filter, hidden visibility or `display: none`.

**Left to Phase 1.** CODE-01 and CODE-02 (a blank plan or a blank last level read as 0: P1-08, P1-07 and P1-14),
CODE-04 (a water pill with only a "Can't tell" tank shows the check: P1-07 and P1-14), CODE-07 (the cut "no average"
line: P1-02 and P1-10), and CODE-05, VISUAL-07 and A11Y-01 (the whole-page failed-load state, which
[06 section 6.2](06-phase1-spec.md#62-states) replaces with per-file states: P1-03 and P1-06). Each Phase 1 item
replaces the code the finding is about.

**Left to the visual polish pass after Phase 1.** VIS-R1-06 and VQ3-04: above 900 px, a flagged budget category whose
name wraps keeps an 8 px indent before its pill (the name starts at x 49 and the pill at x 57 at 1024 px with Repairs
renamed "Equipment repairs and maintenance"). `0315d09` does the same; the committed data does not show it. VQ3-03 and
VIS2-01: in the narrow budget table at 320 px a long name breaks with no hyphen ("Communica" and "tions").
`hyphens: auto` was tried and taken out. Chrome never hyphenates an English word that starts with a capital letter
(`ShouldHyphenateWord` in Chromium's `third_party/blink/renderer/platform/text/hyphenation.h`, read on 2026-10-20), so
it would not add the hyphen to such a name, and in that column it could split short words such as "total" in "Season
total". This headless Chromium has no hyphenation dictionary, so neither effect could be seen here. VR4-03: at 320 and
340 px the gain chart's target line ends on the merged "50% · 80%" label with no gap (at 320 to 390 px with a gain of
exactly -0.50). `0315d09` does the same; this pull request only moves the line with the inset.

**Seen and not changed** (the same on `0315d09`). A link to a section lands far above it, and a link to `#gain-sec`
lights "Attention", because the page scrolls before the data draws (A11Y-R3-01 of the third check round). At 1440 px
`/#gain-sec` leaves the page at scrollY 492 with the section's top at 1915, on both pages. The first Tab still focuses
the gain chart. It needs its own work item. At 320 px with 1.4.12 text spacing the committed budget table runs to
x 312.7, past its card's right edge at x 304, with no sideways page scroll. Larger amounts do make the page scroll
(A11Y-R3-01 of the sixth check round). With Fuel's actual doubled (+143%, +$13,680) and the same spacing, the scale
labels "−145%", "0" and "+145%" touch and widen the "Over or under" column from 96 to 108.5 px. The table then runs to
x 325.2, and the page scrolls 5 px sideways at 320 to 324 px (measured at 320, 322, 324, 325 and 326 px, touch).
Without text spacing it fits (x 295.7). Data tables are an exception to 1.4.10, so this is left to the polish pass: a
scrolling wrapper for the table alone, or a scale that fits the narrow column. A group name made only of digits still
stops the tiles (P1-02 reads group names as text). On touch, a reading sits above the tapped mark, and its drop shadow
(`0 16px 40px -12px`) falls over the mark and its highlight ring (VIS2-04): a tapped flagged mark samples
rgb(173, 123, 17) at 390 px and rgb(171, 122, 17) at 320 px against `--warning` rgb(250, 178, 25), as on `0315d09`
(rgb(175, 125, 17) and rgb(173, 123, 17)). With
a mouse the reading sits below and to the right, and the mark keeps its colour. In a dark forced-colours theme whose
Canvas is not black, the budget bars, the earlier stays bars and the "Not flagged" and "Earlier stays" keys
(`--s1-mute`, #2a7140) have 2.18:1 contrast on Dusk #2D3236 and 2.74:1 on Aquatic #202020 (computed; part of
A11Y-R2-01). The lighter step the spend meter takes would leave their CanvasText labels at 3.53:1, under 4.5:1, so they
need another answer, such as an outline in forced colours. In forced colours the tile meters also lose their track
(VR4-02): the 1 px edge is a box shadow, which forced colours drop, and the faint track is painted in the Canvas
colour, so only the fill and the tick show and the end of the scale cannot be seen. An outline in CanvasText in
the forced-colours block would draw it.

**Checks run** on the branch's working tree, served locally, on 2026-10-20 and 2026-10-21 (the latest run of each; Playwright Chromium on Linux):

| Check | Command | Result |
|---|---|---|
| Unit tests | `node --test tests/*.mjs` | 8 pass, 0 fail |
| Preserve checks | `node docs/audit/redesign/preserve.mjs http://localhost:8820/` | 34 PASS, 0 FAIL (`{"pass":34,"fail":[],"seconds":132}`, exit 0, 2026-10-21, after the VIS-R2-01 and V2-03 changes and the DOCS-V1-01 change to the check's comment). KEEP-24 reads, at each of 1280x900, 390x844 touch and 320x640 touch, "195 marks in a legend colour, 189 plain (round), 6 flagged (corners)" and "legend keys: plain round, flag corners, each the shape of its colour's marks true". No other check was changed. |
| Changed KEEP-24 on the old page | the same script against `0315d09`'s page files (served at :8766) | 33 pass (`{"pass":33,"fail":["KEEP-24"],"seconds":131}`, exit 1, 2026-10-21); KEEP-24 fails at all three sizes, because the flagged marks are round like the dots ("6 flagged (round)"), and so is their key ("legend keys: plain round, flag round") |
| Changed KEEP-24 on rounded squares (VF4-01) | the same script against a copy of the page whose flagged `rect` has `rx` equal to half its side and whose flag key has a 4.5 px radius in its 9 px box | 33 pass (`{"pass":33,"fail":["KEEP-24"]}`); KEEP-24 fails with "6 flagged (round)" and "flagged marks differ in shape from the plain marks false". With the check this pull request had before VF4-01, the same copy passed all 34 |
| Changed KEEP-24 on more copies (K24-PATH, K24-PCTRX, K24-KEYTOL, K24-KEYMATCH) | KEEP-24, with KEEP-05 that it reads, against 26 copies of the page that each change the flagged mark or its key; the whole script against four of them | Fails on all 17 of these copies that break the rule: flagged marks drawn round (a `path` of two arcs, a 24-sided `polygon`, an `ellipse`, a `circle`, a `rect` with `rx` "2%" or with `rx` equal to half its side), with the square key and, for three of them, with a round key; a round flag key alone (radius 49%); the two keys swapped; a turned `rect` (a diamond), with the square key or a turned one; a `clip-path` on the mark and the key, or on the key alone; a mask on the mark or on the key. Passes on the 7 copies that keep squares: a `path` square, a `rect` with `rx` 0, 1.5 or 2 or none, and a flag key with a 0 or 2 px radius. A flag key drawn as an SVG or by its border is not found, so KEEP-24 fails there too ("flag missing"). The whole script gives 33 pass, only KEEP-24 failing, on the `path` circle and on the "2%" `rx`, each with a 49% key, on the swapped keys and on the 49% key alone. KEEP-24 as it was before these four findings passed all 34 on the first three, and KEEP-24 on the fourth (runs of the eighth check round). KEEP-24 judged 1280 x 900 only then. The three-size check runs the same test at 1280 x 900 and adds 390 x 844 and 320 x 640, so a copy it failed then still fails (inferred from the code; not re-run) |
| KEEP-24 on the ninth check round's copies (V2-01 to V2-04) | KEEP-24, with KEEP-05 that it reads, against the ninth round's 19 copies of the page and its unchanged copy, after KEEP-24 was changed to judge three sizes (V2-03); before that, the ninth round ran the whole script against four of the copies | Fails the copy that draws round flagged marks and a round flag key only on a chart under 460 px, at 390 x 844 and 320 x 640 ("6 flagged (round)", "flag round"; V2-03), where the whole script gave 34 PASS before. Fails the copy that draws correct squares with `<use>`, at all three sizes ("1 flagged (corners)"; V2-04). Passes the 11 copies that show round flagged marks or a round flag key in ways it does not see (V2-01, V2-02): an amber stroke, a round clip or mask on a parent, a shape drawn over the corners, amber squares hidden by their own `opacity: 0` beside near-amber circles (DOCS-V1-01), a key rounded by its parent or by a background image, and three pairs of these together; before, the whole script gave 34 PASS on three of them. Passes the 6 copies that keep squares (a `path` square, a `polygon` square, a `rect` with `rx` 0, 1.5 or 2.5, and a half-size square in a moved and scaled `<g>`) and the unchanged copy. On this page it passes, and on `0315d09` it fails, at all three sizes |
| KEEP-24 on hidden marks and keys (DOCS-V1-01) | KEEP-24, with KEEP-05 that it reads, against 17 copies of the page that each hide the flagged squares or the flag key in one way; the whole script against the copy whose squares have `opacity: 0` | Passes the 14 copies that hide them by an `opacity`, `filter` or `visibility` on the square or key or on its parent, or by the squares' `fill-opacity`, at all three sizes ("6 flagged (corners)", "flag corners"); the whole script gives 34 PASS on the `opacity: 0` copy (`{"pass":34,"fail":[],"seconds":132}`, exit 0). Fails the 3 copies with a `visibility` attribute on the squares themselves ("0 flagged (none)") or `display: none` on the squares ("6 flagged (other)") or on the key ("flag other") |
| Finding checks | `node docs/audit/redesign/coverage.mjs 8873` | 23 PASS, 0 FAIL (`{"pass":23,"fail":[]}`, exit 0, 2026-10-21, the same PASS lines as the run before the last changes to the swarm and to KEEP-24). UI-16 now counts `#gain svg [fill='var(--warning)']`, not `circle[fill='var(--warning)']`, because a flagged animal is a `rect`; it still needs exactly 6. Its detail still says "6 flagged dots", the words [05-roadmap.md](05-roadmap.md) quotes for P2-04. LOAD-03's detail now includes the gain tile's flag line; it still passes. |
| README images | `node docs/screenshots/capture.mjs http://localhost:8766/ <folder>` on `0315d09`'s page files, then on the fixed page into `docs/screenshots/` | The first run gives the four images committed before this pull request, byte for byte (REG-01 above) |
| Accessibility rules | axe-core 4.10.2 from a downloaded copy, not added to the repository, run by a later check | 0 violations on the fixed page and on `0315d09`, in 16 set-ups (A11Y-05 above) |
| Links | the relative Markdown links and their anchors in the changed documents | all resolve |

Firefox, WebKit, real phones and screen readers were not tested.
