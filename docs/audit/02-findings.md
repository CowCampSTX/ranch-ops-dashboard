# 02. Prioritized defect and operational-rule audit

This document lists every defect and design limitation in the audit's findings registry
(`docs/audit/data/findings.json`, 83 entries), in the order they should be worked: by phase, then by severity. It then
audits the dashboard's current operating rules (the thresholds in `RULES` and the per-pasture and per-group settings in
the CSVs) against the research registry (`docs/audit/data/rules.json`).

The dashboard is a portfolio demonstration running on fictional data (Example Ranch). It is **not production-ready**,
and fixing everything below would not make it so. The registry says the same: "it is not production-ready, and this list
is not a claim that fixing it makes it so." Every current threshold (25% / 40% tank level, 30-point drop in 24 hours,
24 hours of sensor silence, planned graze days per pasture, 2-day move grace, gain under 80% / 50% of target, 2.0 / 1.0
lb daily gain targets, health tasks due within 7 days, 5% / 10% over budget) is a demonstration setting, not a validated
operating value. Any new setting proposed below is also a demonstration setting, to be tuned per ranch.

## Contents

- [1. Summary](#1-summary): every finding in one table, the counts, and what the findings say
- [How to read this document](#how-to-read-this-document): sources, labels, evidence and the Phase 1 acceptance bar
- [2. Phase 1: Fix now](#2-phase-1-fix-now)
- [3. Phase 2: Build next](#3-phase-2-build-next)
- [4. Phase 3: Add later](#4-phase-3-add-later)
- [5. Deferred](#5-deferred)
- [6. Operational-rule audit](#6-operational-rule-audit)
- [7. Unresolved assumptions and registry disagreements](#7-unresolved-assumptions-and-registry-disagreements)
- [8. Sources for this document](#8-sources-for-this-document)

## 1. Summary

### 1.1 All findings

Every finding in `findings.json`, ordered as in the body: by phase, then severity, then registry order. Each ID links
to its entry. Severity, status, phase and effort are the registry's values; the labels are defined under
[How to read this document](#how-to-read-this-document).

| ID | Title | Severity | Status | Phase | Effort |
|---|---|---|---|---|---|
| [LOAD-01](#load-01) | Missing, unreadable or empty data files read as 'nothing needs attention' for that area | high | confirmed | 1 | M |
| [LOAD-02](#load-02) | A failed or slow load leaves a blank page: no loading state, no error message, no isolation between sections | high | confirmed | 1 | M |
| [LOAD-03](#load-03) | The hard-coded 'Yearlings' tile throws before the exception table is drawn (group renamed or shipped, not yet weighed, or a bad target) | high | confirmed | 1 | S |
| [CSV-01](#csv-01) | The CSV reader is not RFC 4180: quoted commas shift columns, quotes stay in the text, and CR-only or doubled-CR line endings break whole files | high | confirmed | 1 | M |
| [CSV-02](#csv-02) | Blank, whitespace-only, ',,,' and repeated-header rows are read as records: false critical alerts or a blank page | high | confirmed | 1 | S |
| [CSV-03](#csv-03) | No column checks: a renamed, misspelled or space-padded header, or a vendor title line above the header, silently turns a rule off | high | confirmed | 1 | S |
| [CSV-04](#csv-04) | Blank cells are kept as '' instead of 'missing', so they act as 0 or join as text: a blank weight hides the heifer alert or flags a healthy animal, and blank head or acres cells give absurd headline numbers | high | confirmed | 1 | M |
| [CSV-05](#csv-05) | Cells and keys are not trimmed: a stray space in a pasture ID ('P3 ') blanks the page, 'T4, P4' drops which group drinks at the leaking tank, and 'open ' hides every health task | high | confirmed | 1 | S |
| [CSV-06](#csv-06) | Number-looking IDs, tags, group names and dates are turned into numbers: tags merge, pastures collide, and a digits-only group name blanks the page | high | confirmed | 1 | S |
| [DATA-01](#data-01) | Unknown pasture, tank or group references crash the page or silently drop data | high | confirmed | 1 | M |
| [DATA-02](#data-02) | Dates and times are never validated or parsed once: day-first, impossible, numeric, space-separated or M/D/YYYY values silently drop alerts, invent alerts or crash | high | confirmed | 1 | M |
| [WAT-01](#wat-01) | Tank levels are never validated: a fault code ('ERR', 'NaN', '11.8%') hides a critical tank as fine, and a blank, -999 or 140 reading raises a false critical leak | high | confirmed | 1 | M |
| [WAT-02](#wat-02) | There is no tanks master list: a tank with no readings in the export, or an empty water file, disappears and the page reports water as fine | high | design-limitation | 1 | M |
| [GAIN-01](#gain-01) | An animal with only one weigh-in crashes the rules and the page shows no alerts at all | high | confirmed | 1 | S |
| [GAIN-02](#gain-02) | A same-day duplicate weigh-in (scale re-check or EID double read) gives +-Infinity or NaN gain: the group alert is lost or garbled and the page can hang | high | confirmed | 1 | S |
| [HLTH-01](#hlth-01) | A health task is shown only when its status is exactly 'open': 'Open', 'OPEN' or an unlisted status such as 'in progress' silently drops an overdue vaccination | high | confirmed | 1 | S |
| [BUD-01](#bud-01) | Budget 'season to date' ignores the month column and as_of: future plan rows hide both real overspends, a blank or lagging month changes the total, and a mid-month as_of compares part of a month with a full month's budget | high | confirmed | 1 | M |
| [BUD-02](#bud-02) | Budget amounts are not read as money: a blank, '(300)' or '\$3000' cell turns totals into joined text, erases real overspend alerts and puts \$884,000, e+22% or NaN on the headline tile | high | confirmed | 1 | M |
| [LOAD-04](#load-04) | A tank with no reading in the last 7 days crashes the water charts and every section drawn after them | medium | confirmed | 1 | S |
| [DATA-03](#data-03) | Duplicate and contradictory records are not detected: re-exported budget rows, a pasture listed twice, repeated health tasks or groups double or distort alerts | medium | confirmed | 1 | S |
| [TIME-01](#time-01) | Rows dated after as_of are used as current: a later reading hides a silent sensor, a back-dated report shows problems that had not happened yet, and later weigh-ins change the gain period | medium | confirmed | 1 | M |
| [TIME-02](#time-02) | No time-zone contract: a date-only as_of, UTC-stamped readings and daylight-saving days make silent hours, the 24-hour drop and the header depend on the viewer's zone | medium | confirmed | 1 | M |
| [TIME-03](#time-03) | A UTC-stamped as_of shifts every calendar-day count by one day for evening exports, the same way for every viewer | medium | confirmed | 1 | S |
| [WAT-03](#wat-03) | The 24-hour drop is not a 24-hour window: after a reading gap a multi-day change is reported as 'in 24 hours', a new sensor's fast drop is missed, and a fall that refills before the last reading is not seen | medium | confirmed | 1 | S |
| [WAT-04](#wat-04) | Readings are grouped by tank_id alone: two tanks sharing an ID in different pastures merge (a low tank is hidden), and a moved portable trough raises a false leak | medium | design-limitation | 1 | S |
| [GRZ-01](#grz-01) | The current grazing stay is chosen by a blank out_date, not by as_of: a planned or early-entered out_date hides an overstay, and the alert's advice to 'record a new move date' has nowhere to go but the column that silences it | medium | confirmed | 1 | M |
| [GRZ-02](#grz-02) | A group with two open moves gets a false '15 days over' alert and the timeline contradicts it; a duplicated row doubles the alert and garbles the T4 subject | medium | confirmed | 1 | S |
| [GRZ-03](#grz-03) | Text or blanks in move and plan cells ('-', 'TBD', '21 days', a blank in_date or plan) silently remove the grazing alert, strip 'here now' from the T4 leak, or blank the whole rotation chart | medium | confirmed | 1 | S |
| [GAIN-03](#gain-03) | Group gain is not computed over one consistent pair of weigh-in sessions: a short re-weigh, animals that missed the last weigh-in, and the first animal's dates distort the verdict and the 'since' date | medium | confirmed | 1 | M |
| [GAIN-04](#gain-04) | No plausibility check on weights or daily gain: one keying slip masks the heifer alert and wrecks the gain chart's scale | medium | confirmed | 1 | S |
| [GAIN-05](#gain-05) | A non-numeric target ('2.O') silently turns off a group's gain alerts, and on the Yearlings row blanks the report | medium | confirmed | 1 | S |
| [GAIN-06](#gain-06) | Animals are keyed by tag alone, so the same tag number in two groups merges into one 'animal' | medium | confirmed | 1 | M |
| [GAIN-07](#gain-07) | No coverage disclosure: a group verdict can rest on a handful of animals and the page does not say how many were weighed | medium | design-limitation | 1 | S |
| [GAIN-08](#gain-08) | Old weigh-ins are presented as current: no age check, so a skipped weigh-in gives an all-clear on 72-day-old data | medium | design-limitation | 1 | S |
| [BUD-03](#bud-03) | A zero-budget category prints 'Infinity% over' and a 0/0 row gives NaN; either one blanks the budget chart | medium | confirmed | 1 | M |
| [BUD-04](#bud-04) | Budget severity is percent only: \$30 over on \$200 is serious, \$9,500 over on \$100,000 is a warning, and \$4,000 over is ignored | medium | design-limitation | 1 | S |
| [SEC-01](#sec-01) | CSV text is written into the page with innerHTML at 9 places: markup in a pasture, tag or group name runs script, can empty the alert table, and plain '&lt;' text silently deletes alert context | medium | confirmed | 1 | S |
| [CSV-07](#csv-07) | A CSV saved as Windows-1252 ('CSV (Comma delimited)') shows garbled names | low | confirmed | 1 | S |
| [WAT-07](#wat-07) | Two different readings at the same timestamp: the alert depends on which line comes last in the file | low | confirmed | 1 | S |
| [WAT-08](#wat-08) | An exact 30.0-point drop is missed because of floating-point subtraction | low | confirmed | 1 | S |
| [GRZ-06](#grz-06) | Past overstays are never marked on the rotation chart although the card note says days past plan are marked | low | design-limitation | 1 | S |
| [GAIN-11](#gain-11) | Gain wording: 'since &lt;date>' hides that the period ended at the last weigh-in, '1 yearlings', and toFixed(1) shows thresholds that differ from the ones applied | low | confirmed | 1 | S |
| [GAIN-12](#gain-12) | A group exactly at 80% of target is flagged serious or not depending on row order (floating-point mean) | low | confirmed | 1 | S |
| [GAIN-13](#gain-13) | Groups with a 0.0 target (the cows) are skipped silently in the report and the chart | low | design-limitation | 1 | S |
| [HLTH-02](#hlth-02) | An open health task with a blank or unreadable due date is never shown anywhere | low | design-limitation | 1 | S |
| [HLTH-03](#hlth-03) | The example 'Fly tag check' row (done, last done Jun 5, next due Sep 1) contradicts itself and the meaning of next_due on a done row is undefined | low | design-limitation | 1 | S |
| [BUD-05](#bud-05) | Budget boundaries are inconsistent: exactly 5.0% gets no row though the rules say '5-10%', 9.6% and 10.4% both print '10% over' at different severities, and summed cents can tip an exact 10.00% into serious | low | confirmed | 1 | S |
| [BUD-06](#bud-06) | Budget money formatting: raw toLocaleString gives '\$104.5', warning rows carry no dollars, and a non-US browser locale shows '\$2.040' and '\$89.303 of \$88.400' | low | confirmed | 1 | S |
| [UI-04](#ui-04) | The 'Water tanks OK' tile re-reads tank IDs from the alert text and undercounts when tank names share a first word ('Well 2', 'Well 4') | low | confirmed | 1 | S |
| [UI-05](#ui-05) | Grazing timeline month ticks are hard-coded to June-September 2026 | low | confirmed | 1 | S |
| [UI-06](#ui-06) | On the due day the text says 'Due in 0 days' and 'Planned move in 0 days' | low | confirmed | 1 | S |
| [UI-07](#ui-07) | Empty and zero wording: 'Nothing in all needs attention.', and '−0.0%', '−0%' and 'Under by \$0' when exactly on budget | low | confirmed | 1 | S |
| [UI-08](#ui-08) | The rules table prints floating-point noise when a threshold is changed (0.07 shows as '7.000000000000001-10%') | low | confirmed | 1 | S |
| [TEST-01](#test-01) | The water tests cannot catch a broken rule: removing the 'don't judge a silent tank' line and moving every threshold boundary still pass | low | confirmed | 1 | S |
| [TEST-02](#test-02) | No test covers the grazing rule boundaries: changing the over-plan or grace comparisons, or the plural wording, still passes the suite | low | confirmed | 1 | S |
| [WAT-05](#wat-05) | A tank whose sensor stopped less than 24 hours ago is judged on its old reading and counted OK, with no sign of how old the shown level is | medium | design-limitation | 2 | S |
| [GRZ-04](#grz-04) | min_rest_days is never read: stays that start inside a pasture's own minimum rest go unflagged | medium | design-limitation | 2 | S |
| [GRZ-05](#grz-05) | The example season is not credible as a rotation: two pastures held two groups at once and 11 of 13 sequential re-entries are short of the file's own minimum rest | medium | confirmed | 2 | M |
| [GAIN-09](#gain-09) | An individual animal losing weight is never named while its whole group is flagged | medium | design-limitation | 2 | S |
| [UI-01](#ui-01) | Chart details can only be opened with a mouse hover: a tap on a phone shows nothing, gain dots are 3.9 px targets, and keyboard or screen-reader users cannot reach any chart detail | medium | confirmed | 2 | M |
| [UI-02](#ui-02) | On a phone the 'Problem' and 'First step' columns are off-screen and budget differences are cut mid-number, with no cue that the table scrolls | medium | confirmed | 2 | M |
| [UI-03](#ui-03) | Chart text renders at about 7 px on a phone | medium | confirmed | 2 | M |
| [LOAD-05](#load-05) | No data-age check: an old export is shown as the current report, and the as-of line has no time zone | low | design-limitation | 2 | S |
| [WAT-09](#wat-09) | A silent tank last seen nearly empty and falling is only 'serious', ranked below every critical row | low | design-limitation | 2 | S |
| [WAT-10](#wat-10) | A sensor that keeps sending the same frozen value is treated as a healthy tank | low | design-limitation | 2 | S |
| [GRZ-07](#grz-07) | A group with no current stay drops out of grazing silently while the 'Head on grass' tile still counts it | low | design-limitation | 2 | S |
| [GRZ-08](#grz-08) | The serious grazing action is one blanket line based only on elapsed days: no escalation and no destination | low | design-limitation | 2 | M |
| [GAIN-14](#gain-14) | An animal that changes group between weigh-ins is counted in its earlier group without saying so | low | confirmed | 2 | S |
| [HLTH-04](#hlth-04) | An open task whose last_done is after its next_due is reported as overdue with 'Schedule it this week' | low | design-limitation | 2 | S |
| [BUD-07](#bud-07) | A large under-spend is never surfaced: a category 50% under budget gets no row | low | design-limitation | 2 | S |
| [UI-09](#ui-09) | Rows with the same severity are ordered A-Z by area name, so the Budget overruns head the serious block above an overdue vaccination and a silent water sensor | low | design-limitation | 2 | S |
| [UI-10](#ui-10) | Keyboard focus is lost after activating a filter chip | low | confirmed | 2 | S |
| [UI-11](#ui-11) | Tooltips near the right or bottom edge are squeezed or open off-screen | low | confirmed | 2 | S |
| [UI-12](#ui-12) | Small chart label collisions: the '3.0' tick overlaps 'lbs per day', and the T6 heading wraps on a phone | low | confirmed | 2 | S |
| [UI-13](#ui-13) | Exception text shows raw ISO dates ('2026-07-20') while the rest of the page uses 'Jul 20' | low | confirmed | 2 | S |
| [UI-14](#ui-14) | Long group or budget category names overflow their fixed label space: they overlap the bars and dots, or are cut off at the card edge | low | confirmed | 2 | S |
| [UI-15](#ui-15) | The water chart draws a straight line across sensor outages inside the 7-day window | low | confirmed | 2 | S |
| [UI-16](#ui-16) | The gain chart does not mark the animals the report flags, or the 50% and 80% lines | low | confirmed | 2 | S |
| [UI-17](#ui-17) | Budget chart extremes: a category well under budget draws its value label over its name, and one large percentage overrun squashes the chart and stacks every axis label | low | confirmed | 2 | S |
| [UI-18](#ui-18) | 'Head on grass 375' counts 180 cow-calf pairs as 180 head | low | plausible | 2 | S |
| [WAT-06](#wat-06) | Water severity uses level percent alone: it ignores stock on the pasture, tank capacity and use, and ties are broken by file order, so an empty-pasture tank outranks a leaking tank 45 heifers drink from | medium | design-limitation | 3 | M |
| [GAIN-10](#gain-10) | Weigh conditions (shrink and gut fill) are not recorded, and an ordinary few-percent difference is larger than the serious rule's margin | medium | design-limitation | defer | L |
| [GRZ-09](#grz-09) | Two groups in one pasture are each judged alone against a single per-pasture plan | low | design-limitation | defer | L |

### 1.2 Counts

| Phase | High | Medium | Low | Total |
|---|---|---|---|---|
| Phase 1 (Fix now) | 18 | 19 | 18 | 55 |
| Phase 2 (Build next) | 0 | 7 | 18 | 25 |
| Phase 3 (Add later) | 0 | 1 | 0 | 1 |
| Deferred | 0 | 1 | 1 | 2 |
| **All** | **18** | **28** | **37** | **83** |

By status: 59 confirmed, 23 design limitations, 1 plausible. Every high-severity finding is in Phase 1.

### 1.3 What the findings say

These points summarise the registry; each names the entries it rests on.

1. **Ordinary data problems can make an area look clear when the page cannot tell.** A missing or header-only file
   ([LOAD-01](#load-01)), a tank absent from the export ([WAT-02](#wat-02)), a fault code on a tank's newest reading ([WAT-01](#wat-01)), a renamed
   column ([CSV-03](#csv-03)), a health status typed 'Open' ([HLTH-01](#hlth-01)), future budget plan rows ([BUD-01](#bud-01)) and a blank or '(300)'
   budget cell ([BUD-02](#bud-02)) each remove real alerts with no message. Phase 1 answers this with a third state, CAN'T TELL,
   and visible data issue rows.
2. **One bad row or file can blank the whole page.** A failed request ([LOAD-02](#load-02)), a group not named exactly 'Yearlings'
   ([LOAD-03](#load-03)), ',,,' rows ([CSV-02](#csv-02)), a stray space in a pasture ID ([CSV-05](#csv-05)), a digits-only group name ([CSV-06](#csv-06)), an
   unknown pasture ([DATA-01](#data-01)), an animal with one weigh-in ([GAIN-01](#gain-01)) and a same-day duplicate weigh-in, which can hang
   the tab ([GAIN-02](#gain-02)), each stop the page before the alert table or the sections after it are drawn. Phase 1 adds a
   loading state, a visible error and per-section isolation.
3. **The CSV reader and the missing data contract are a shared cause.** The reader is not RFC 4180 ([CSV-01](#csv-01)), keeps
   blanks as text ([CSV-04](#csv-04)), never trims ([CSV-05](#csv-05)), converts IDs and dates to numbers ([CSV-06](#csv-06)), and nothing checks
   columns, types, references or duplicates ([CSV-02](#csv-02), [CSV-03](#csv-03), [DATA-01](#data-01) to [DATA-03](#data-03)). The same gap lets bad tank levels,
   weights, targets, statuses and money through ([WAT-01](#wat-01), [GAIN-04](#gain-04), [GAIN-05](#gain-05), [HLTH-01](#hlth-01), [BUD-02](#bud-02)).
4. **There is no single as-of policy or time zone.** Rows after as_of are used as current ([TIME-01](#time-01)), results depend on
   the viewer's time zone ([TIME-02](#time-02), [TIME-03](#time-03)), the current grazing stay ignores as_of ([GRZ-01](#grz-01)), and budget ignores the
   month column ([BUD-01](#bud-01)).
5. **Several rules are right on the demo data but fragile at their edges.** The 24-hour drop is not a 24-hour window
   ([WAT-03](#wat-03)); exact boundaries fail on floating-point arithmetic ([WAT-08](#wat-08), [GAIN-12](#gain-12), [BUD-05](#bud-05)); group gain does not use one
   consistent pair of weigh-ins ([GAIN-03](#gain-03)).
6. **Design limitations.** 23 entries are design limitations: the code does what its rule says, but the rule or data
   model cannot support a confident answer. The most serious is [WAT-02](#wat-02) (no master list of tanks, high). Others are
   water severity from percent alone ([WAT-06](#wat-06)), budget severity from percent alone ([BUD-04](#bud-04)), gain verdicts with no
   coverage or age check ([GAIN-07](#gain-07), [GAIN-08](#gain-08)) and an unused min_rest_days column ([GRZ-04](#grz-04)).
7. **The example data undercuts its own credibility in places.** The fictional rotation has pastures shared by two
   groups and short re-entries ([GRZ-05](#grz-05)), a health row contradicts itself ([HLTH-03](#hlth-03)), and 180 cow-calf pairs are counted
   as 180 head ([UI-18](#ui-18), plausible).
8. **The tests pass but do not pin the boundaries.** Changing water or grazing thresholds, or removing the silent-tank
   rule, keeps CI green ([TEST-01](#test-01), [TEST-02](#test-02)).
9. **Safe rendering.** CSV text reaches innerHTML unescaped at nine places ([SEC-01](#sec-01)). Today the CSVs sit in the same
   repository as the code; the risk becomes real when exports come from outside it.
10. **The interface needs work for the field (Phase 2).** Chart details cannot be opened by touch or keyboard ([UI-01](#ui-01)),
    the 'First step' column is off-screen on a phone ([UI-02](#ui-02)), and chart text is about 7 px on a phone ([UI-03](#ui-03)).

## How to read this document

### About this audit

| Item | Value |
|---|---|
| Repository | CowCampSTX/ranch-ops-dashboard |
| Commit reviewed | `cfd77e50a050163b542cadfc6b38882c0341e99d` (main). The work branch `claude/project-thread-nu46kf` adds only `docs/audit/` files, so the reviewed code is unchanged at its HEAD. |
| Findings registry | `findings.json`, generated 2026-10-16. It merges 144 raw findings (baseline, seven audit areas and seven skeptic passes) into 83 entries. No skeptic verdict was "refuted", so nothing was dropped. A completeness critic then edited it in place (findings.json `revisions`). |
| Rules registry | `rules.json`: 98 rules (classes A 14, B 28, C 45, D 11), 152 data fields and 47 integrations, checked by a citation critic on 2026-10-16 (`registry-changelog.md`). |
| Project guidance files | There is **no PROJECT_CONTEXT.md or AGENTS.md** in the repository. Findings are judged against README.md, the code and the committed data. |
| Blocked checks | The published GitHub Pages site could not be reached (the environment's proxy answered 403), so its 404 page and caching are unverified, and LOAD-02's statement about the live site is an inference. Only Playwright Chromium (with mobile and touch emulation) was run: no real phones, screen readers, Firefox or WebKit. |
| Earlier document | `01-baseline.md`: how the code works today and the baseline test results. |

### Four kinds of statement

1. **Verified findings** (sections 2 to 5). Each entry was reproduced. Its evidence is a repro command and output
   quoted from the registry, which copies them from the evidence files (`baseline.json`, `audit_<area>.json`,
   `verify_<area>.json`). The registrar re-ran repro commands for every high-severity entry on 2026-10-16, and every
   quoted output matched (findings.json `spot_checks`).
2. **Research conclusions** (section 6 only). They come from `rules.json`, which was built from `research_<topic>.json`
   and checked against the citation checkers' `cite_<topic>.json`. Each comes with its sources.
3. **Recommendations.** Every "Proposed fix", every proposed regression test and every phase assignment is a
   recommendation. Nothing in the dashboard's code, data, tests or README was changed by the audit.
4. **Unresolved assumptions** (section 7), including places where the two registries disagree.

### What each finding entry contains

- **Heading:** the stable finding ID and the registry's title. Later documents must use these IDs exactly.
- **Severity, status, phase, effort and area**, as in the registry.
- **Problem:** what the code does and why it goes wrong, in plain words, followed by the code locations from the
  registry.
- **Evidence:** the commands that reproduce it (run from the repository root), the actual output quoted from the
  evidence, and how it was verified: which skeptic pass confirmed it, and any correction the skeptic made.
- **Expected behaviour** and **operational consequence** (what it means for the manager or the crew).
- **Proposed regression test**, with its expected values worked out by hand (the arithmetic is shown, for example
  "Sep 15 to Sep 30 = 15 calendar days"). Where an expected value depends on the committed data or on arithmetic that
  can be redone, a "Hand values re-checked" line lists the same values recomputed independently (see below).
- **Proposed fix**, **files affected** and **related findings**.

The code locations, the reproduce line, the actual output, how it was verified, the expected behaviour, the operational
consequence, the proposed regression test, the proposed fix, the related findings and any scope note (`status_note`)
are quoted verbatim from `findings.json`. The Problem paragraph and the Files affected line were written for this
document from those same fields; the only file reference in them that the registry does not give, `index.html:95` (the
gain chart note, [GAIN-13](#gain-13)), was checked against the code.

**Test-case labels are not finding IDs.** The diagnostic scripts name their test cases with labels such as W-01, G-05,
GN-07, BU-06 or R17, and two scripts use labels that look like finding IDs: `csv.repro.mjs` (CSV-01 to CSV-57) and
`time.repro.mjs` (TIME-01 to TIME-19). In the Reproduce, Actual output and How it was verified text, a label after
"CASE", or at the start of a quoted output, is a test case. For example, in the [TIME-02](#time-02) entry "TIME-03: UTC
'silentHours=18'" is `time.repro.mjs` case TIME-03, not finding [TIME-03](#time-03). Finding IDs are the ones in entry
headings, in the summary table and in the Related findings lines.

### Labels

- **confirmed:** reproduced and accepted as a defect by the skeptic pass. Partially-confirmed verdicts are kept as
  confirmed with the narrower scope stated in the entry. Four baseline-only entries (UI-02, UI-03, UI-12, UI-13) had no
  skeptic review; they are confirmed because the measurement was reproduced, and each says so.
- **design-limitation:** reproduced, but the code does what its documented rule says; the gap is in the rule set or the
  data model, so the page cannot support a confident conclusion. Each of these entries carries a "Label: design
  limitation" line.
- **plausible:** observed, but a judgement call no skeptic reviewed (one entry, UI-18).

Severity, from the registry:

- **high:** likely with ordinary data or a routine change (a common export shape, a blank or mistyped cell, a renamed
  group, a missing file), and it hides a whole area or a critical alert with no sign, raises a false critical alarm
  from a common data slip, or blanks or freezes the page.
- **medium:** hides, invents or distorts an alert under a narrower or less common trigger, or is visibly wrong or
  misleading; also rule-design gaps with a real operational or credibility cost.
- **low:** cosmetic or wording, a rare edge or boundary case, or a gap where the alert itself stays visible.

Effort: **S** a focused change, usually under a day; **M** several functions or files; **L** a data-model change.

### Independent check of the hand values

`python3 -I docs/audit/diagnostics/findings.handvalues.py` (run from the repository root) checks the expected values in
the proposed regression tests without importing `exceptions.js` or `app.js`. It does three things: it re-derives, from
`data/*.csv` alone, the committed-data values the tests depend on; it rebuilds the 10 report rows from the rule text in
README.md and rules.json (the demonstration settings listed at the top of this document); and it redoes the arithmetic
quoted in tests that use small inline fixtures. It was written with this document on 2026-10-16 (72 checks), then
extended during review with the rebuilt report rows and more inline arithmetic, and re-run on 2026-10-19: "85 of 85
checks match". The "Hand values re-checked" line under an entry quotes the script's printed output for the checks that
apply to it. A match shows the expected values follow from the data and the documented rules; it does not test the
dashboard, and it does not validate any threshold.

### Files and tests

- The repository's only automated tests are `tests/exceptions.test.mjs`: 8 `node:test` tests, which pass
  ("# pass 8 / # fail 0", baseline.json). CI (`.github/workflows/test.yml`) regenerates the data, checks that it matches
  the commit, and runs those tests. Tests marked "browser test (new)" need a browser test (for example Playwright),
  which the repository does not have yet. Adding one is a recommendation, not an existing capability.
- The files in `data/` are written by `scripts/generate_data.py`, and CI fails if the committed data differs from the
  generator's output. Any change listed under a data file must be made in the generator.
- **One owner per cause.** Where one cause shows up in several areas, one entry owns the fix and its test
  (findings.json `policies.ownership`): CSV-04 (blank means missing) with WAT-01, BUD-01, BUD-02 and GRZ-03; CSV-05
  (trimming) with HLTH-01; LOAD-01 (missing or empty files) with WAT-02, BUD-03 and UI-07.
- **Requirements apply by phase.** A Phase 1 fix does not depend on a Phase 2 or Phase 3 feature. A few entries span
  phases (LOAD-05, WAT-06, GAIN-08, GRZ-06, UI-01); their phase is where the main work lands, and the entry says which
  part belongs earlier or later.

### The Phase 1 acceptance bar

From findings.json `policies.phase_1_acceptance`: "The 10 planted problems are still found with the same severities,
with no new false alarms on the committed data. Data issue rows and CAN'T TELL states are new row types; on the
committed data none should appear after HLTH-03's generator fix."

The 10 rows the committed data gives today (`01-baseline.md`, section 4.5, from the baseline browser run):

| Severity | Area | What | Problem |
|---|---|---|---|
| Critical | Water | Tank T2 (Windmill) | Down to 11.8% full |
| Critical | Water | Tank T4 (Lone Tree, Heifers here now) | Dropped 46 points in 24 hours, now 10% |
| Serious | Budget | Fuel | 21% over season to date (\$2,040) |
| Serious | Budget | Repairs | 25% over season to date (\$1,800) |
| Serious | Gain | Heifers | 0.44 lbs/day since 2026-07-20 vs 1.0 target |
| Serious | Grazing | Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over) |
| Serious | Health | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15) |
| Serious | Water | Tank T6 (Cedar Draw) | No reading for 42 hours; last level 98.5% |
| Warning | Gain | 6 yearlings | Under 1.0 lbs/day: Y027, Y031, Y058, Y082, Y129, Y132 |
| Warning | Health | Cows: Pinkeye check | Due in 3 days (2026-10-03) |

`findings.handvalues.py` rebuilds these 10 rows from the documented rules without running `exceptions.js` and gets the
same 10 subjects (by tank, group, task and category) and the same severity counts ("report rows rebuilt from the documented rules: count by severity:
{'critical': 2, 'serious': 6, 'warning': 2}", MATCH). Finding these 10 shows the rules find what the generator planted.
It does not validate the thresholds (RULE-WF-21).

## 2. Phase 1: Fix now

Correctness, data integrity and misleading outputs, keeping plain HTML and JavaScript with no build step. The lead's
defaults for this phase: a real CSV reader and a per-file data contract; three states everywhere (OK, needs attention,
CAN'T TELL); a loading state, a visible load error and sections that fail on their own; one as-of policy with a time
zone; the rule fixes named in each entry; safe rendering; and honest rule copy that calls every threshold a demonstration
setting to be tuned per ranch. The registry's phase assignments follow these defaults; [GAIN-08](#gain-08) was moved here from Phase
2 by the completeness critic because stale weigh-ins otherwise give an all-clear.

Acceptance: the 10 planted problems are still found with the same severities, and the new checks add no false alarm on
the committed data (see "The Phase 1 acceptance bar" above).

### 2.1 High severity (18)

<a id="load-01"></a>
#### LOAD-01: Missing, unreadable or empty data files read as 'nothing needs attention' for that area

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Data loading

**Problem.** The loader never checks that a file arrived or has rows. `app.js:221` passes any response body, including a 404 page, to `parseCSV`, which accepts any text. An area whose file is missing, unreadable or header-only then shows zero alerts and the sentence 'Nothing in &lt;area> needs attention', which reads as an all-clear.

**Where in the code.** app.js:221 (no res.ok check; any body goes to parseCSV); exceptions.js:22-34 (any text parses); exceptions.js:141 (rows without status 'open' are skipped); exceptions.js:82-89 and app.js:57 (budget NaN); app.js:46-55 (tile '0 of 0'); app.js:69 (empty message)

**Evidence.**

- Reproduce (from the repository root): `python3 -m http.server 8801 --bind 127.0.0.1 --directory . &` then `node docs/audit/diagnostics/states-check.mjs http://127.0.0.1:8801/ <outDir>` (scenarios health:404, health:header-only, budget:404, water:header-only, moves:header-only). Also `node docs/audit/diagnostics/render.repro.mjs` (CASE R05, R06, R07); `node docs/audit/diagnostics/csv.verify.mjs` (CASE CV-05); `node docs/audit/diagnostics/csv.verify.browser.mjs` (CASE VB-06). Minimal input: a copy of the site with data/health.csv deleted.
- Actual output, quoted from the evidence:

  > [health:404] 'ready=true pageErrors=0 rows=8 warnsUser=false ... chips: All (8), Water (3), Grazing (1), Gain (2), Health (0), Budget (2)'; Health filter 'Nothing in health needs attention.' budget:404: 'Budget (0)' and 'Spend vs budget: −NaN% (\$NaN of \$NaN, season to date)'. water:header-only: 'Water (0)', 'Water tanks OK: 0 of 0 (0 need a look)' and '0 critical'. moves:header-only: 'Grazing (0)' and the T4 row becomes 'Tank T4 (Lone Tree)'. The only trace is a console line 'Failed to load resource: the server responded with a status of 404 (File not found)'.

- How it was verified: confirmed (verify_render F2; the CSV skeptic's own missed finding M3; baseline B0 was not skeptic-reviewed). Evidence: with health.csv answering 404 the chips read 'All (8) ... Health (0)' and the Health filter says 'Nothing in health needs attention.' The render skeptic added a header-only moves.csv: 'Grazing (0)', 12 NaN attributes in the grazing chart, and the T4 row loses 'Heifers here now'. Registrar re-ran states-check.mjs on 2026-10-16: same chips and the same '−NaN% (\$NaN of \$NaN ...)' budget tile. The empty or missing budget file parts of verify_render F5 and verify_healthbudget F11 are registered here (split from BUD-03 and UI-07 by the completeness critic).

**Expected behaviour.** The page names the file that could not be loaded or is empty (for example 'health.csv could not be loaded (404)') and shows that area as CAN'T TELL, never as clear. With full data the Health chip reads 'Health (2)': the booster due 2026-09-15 is 15 days overdue on 2026-09-30, and pinkeye due 2026-10-03 is 3 days away.

**Operational consequence.** The overdue yearling booster and the pinkeye check vanish while the page looks normal and current. An empty water export hides both critical tanks (T2 at 11.8% and the T4 leak) and the page reports zero critical items. A manager who trusts the page skips work that needs doing.

**Proposed regression test.** Playwright with page.route: (1) health.csv answers 404: visible text matches /health\\.csv/ and /could not load|missing/i, and the Health chip is not 'Health (0)'. (2) water.csv is header-only: an error names water.csv and the tile does not read '0 of 0'. (3) moves.csv is header-only: a 'no grazing data' state, not 'Grazing (0)'. (4) Unit: the loader given a fetch stub {ok:false,status:404} rejects with a message matching /health\\.csv.\*404/. Hand values with full data: Health (2) = booster (Sep 15 to Sep 30 = 15 days overdue) + pinkeye (Sep 30 to Oct 3 = 3 days). (5) budget.csv is header-only or answers 404: no 'NaN' anywhere on the page, and the budget tile and chip show a CAN'T TELL state naming budget.csv (today: 'Spend vs budget: −NaN% (\$NaN of \$NaN ...)' for 404 and '−NaN% \$0 of \$0' for header-only).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): booster days overdue on the as-of date = `15`; pinkeye days until due = `3`; open health tasks overdue or due within 7 days = `2`.

**Proposed fix (recommendation).** Load every file through one helper that throws on !res.ok, checks that file's required columns and requires at least one data row (meta.csv must have as_of). Track per area whether its data loaded. An area without data shows "CAN'T TELL: &lt;file> missing or empty" in its chip, tile and table, and the 'Nothing in X needs attention' sentence appears only when that area's data is present.

**Files affected.** `app.js` (loader, per-area loaded state, chips, tiles, empty message); `exceptions.js` (required columns per file); `tests/exceptions.test.mjs`; browser test (new; the repository has none yet).

**Related findings.** [LOAD-02](#load-02), [CSV-03](#csv-03), [WAT-02](#wat-02), [UI-07](#ui-07), [BUD-03](#bud-03)

<a id="load-02"></a>
#### LOAD-02: A failed or slow load leaves a blank page: no loading state, no error message, no isolation between sections

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Data loading

**Problem.** `app.js` loads every file with a top-level `await` and no `try/catch`, then draws the sections one after another. A failed, aborted or slow request leaves only the static headings: no loading message, no error, and one exception stops every section drawn after it.

**Where in the code.** app.js:221-225 (top-level await fetch with no res.ok and no try/catch; sections rendered in sequence); index.html:72-112 (empty containers, no loading text); exceptions.js:43, :58, :69, :95 (where empty inputs throw)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/states-check.mjs http://127.0.0.1:8801/ <outDir>` (scenarios loading, water:404, water:abort, health:abort, meta:404, meta:header-only); `node docs/audit/diagnostics/render.repro.mjs` (CASE R08 water 404, R09 meta 404/header-only, R10 fetch rejects). Minimal input: abort the request for data/water.csv.
- Actual output, quoted from the evidence:

  > loading: 'ready=false pageErrors=0 rows=0 warnsUser=false loadingText=false'. water:404: uncaught 'Cannot read properties of undefined (reading 'localeCompare')', empty as-of line, every section count 0. water:abort: uncaught ['Failed to fetch']. meta:header-only: '(reading 'as_of')'. R10: 'error=TypeError: Failed to fetch; page tells user: false'.

- How it was verified: confirmed (verify_render F1) with a correction: 'empty' was overgeneralised. A header-only water.csv or moves.csv does not throw (that is LOAD-01); only an empty pastures.csv or meta.csv blanks the page through findExceptions; a header-only weights.csv or groups.csv throws through the tile (LOAD-03). High stands for a 404 or aborted request on pastures, moves, weights, water or meta. Baseline B1 (not skeptic-reviewed) graded the blank-skeleton state medium; the registry takes the verified high. That the GitHub Pages 404 page behaves the same is an inference (the proxy refused the site). Registrar re-ran states-check.mjs on 2026-10-16: 'loading: ready=false ... loadingText=false', and 24 of the 32 per-file failure scenarios end blank.

**Expected behaviour.** While files load, a visible 'Loading example data...' message. If a file fails, a visible error naming it ('water.csv could not be loaded (404)'), and every area whose data did load still drawn, for example the Health row 'Overdue by 15 days (due 2026-09-15)'. No uncaught exception.

**Operational consequence.** When one nightly export fails or is cut off, the manager sees only static headings with no as-of time and no error, and can't tell 'still loading' from 'broken'. Every alert in every area is hidden, including areas whose files loaded fine, and finding the cause needs developer tools.

**Proposed regression test.** Stub fetch so water.csv returns 404 and the other files are the small inline set from render.repro.mjs (one health task due 2026-09-15, status open; as_of 2026-09-30T18:00). Expect a banner containing 'water.csv' and '404', and the table still containing 'Overdue by 15 days (due 2026-09-15)' (Sep 15 to Sep 30 = 15 calendar days). Delay every CSV by 3 s: at 1 s, text matching /loading/i is visible. Abort budget.csv: a banner names budget.csv, the other areas are drawn, and there are zero pageerror events.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): booster days overdue on the as-of date = `15`.

**Proposed fix (recommendation).** Put a 'Loading example data...' placeholder in index.html. Wrap loading in try/catch and collect per-file failures into a banner at the top. Run each area's rules and each section's render in its own try/catch; a failed area becomes a visible "CAN'T TELL: water data unavailable (&lt;reason>)" row instead of throwing. A missing or empty meta.csv is a fatal error with its own message.

**Files affected.** `index.html` (loading placeholder); `app.js` (try/catch per file and per section, error banner); browser test (new; the repository has none yet).

**Related findings.** [LOAD-01](#load-01), [LOAD-03](#load-03), [LOAD-04](#load-04)

<a id="load-03"></a>
#### LOAD-03: The hard-coded 'Yearlings' tile throws before the exception table is drawn (group renamed or shipped, not yet weighed, or a bad target)

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Data loading

**Problem.** The gain tile looks for a group named exactly 'Yearlings' (`app.js:48`) and reads its gain and target. If that group is renamed, shipped, not yet weighed, or has a non-numeric target, the tile throws. Because `tiles()` runs before `exceptionsTable()`, no alerts are drawn at all.

**Where in the code.** app.js:48 (.find((g) => g.group === "Yearlings")), app.js:54 (g.group.toLowerCase()), app.js:56 (gain.adg, gain.target.toFixed), app.js:225 (tiles() runs before exceptionsTable())

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/csv.browser.mjs` (CASE B-03: Yearlings renamed Steers in groups, weights, moves and health); `node docs/audit/diagnostics/time.browser.mjs` (CASE TB-03: yearlings shipped and removed from groups.csv); `node docs/audit/diagnostics/gain.repro.mjs` (CASE GB-02 rename, GB-03 no yearling weigh-ins, GB-06 target '2.O'); `node docs/audit/diagnostics/render.repro.mjs` (CASE R11, R12); `node docs/audit/diagnostics/csv.verify.browser.mjs` (CASE VB-08 blank target, VB-09 header-only weights.csv).
- Actual output, quoted from the evidence:

  > B-03: page errors ["Cannot read properties of undefined (reading 'adg')"]; tiles []; chips ""; 0 exception rows; no water, grazing, gain, budget or rules output. TB-03: 'exception rows 0 | tiles 0 | errors: Cannot read properties of undefined (reading 'adg')'. GB-06: 'pageerrors=["gain.target.toFixed is not a function"]; ... tiles=0; exception rows=0'.

- How it was verified: confirmed by four skeptics (verify_csv F9, verify_time F0, verify_gain F2, verify_render F0). Evidence: csv.browser B-03 page errors ["Cannot read properties of undefined (reading 'adg')"], tiles [], chips "", 0 exception rows. Corrections applied: the page looks broken rather than like an all-clear (no chips, no rows, no 'Nothing needs attention' sentence), but every alert is hidden with no error under a current-looking as-of line; the trigger also covers a 'Yearlings' group with no weigh-ins yet (VB-09, GB-03) and a blank or non-numeric target (VB-08, GB-06), so the fix must check the gainStatus result and a finite target, not groups.csv. Registrar re-ran csv.browser B-03, time.browser TB-03 and gain.repro GB-02/03/06 on 2026-10-16: same output.

**Expected behaviour.** findExceptions succeeds on this data, so the exception table is drawn: 10 rows for the rename; 7 rows after the yearlings ship (T2 low, T4 leak, T6 silent, Fuel, Repairs, Heifers gain, Cows pinkeye). Only the gain tile changes, for example to 'No yearling weigh-ins'.

**Operational consequence.** Yearlings are usually sold in the fall, and many operations call them steers or stockers. The first export without a group named exactly 'Yearlings', or before they are re-weighed, gives a page with no alerts at all: the leaking tank, the dead sensor and the low tank are hidden, and nothing says why.

**Proposed regression test.** Move the tile maths into a pure tileSummary(d, exc); with groups.csv minus Yearlings it must not throw. Playwright with Yearlings renamed Steers: #exceptions has 10 data rows (11 tr with the header) and no pageerror. Shipped case: 7 data rows, counted by hand from the committed 10 minus the 3 yearling rows (overstay, 6 slow yearlings, booster). Blank target and header-only weights.csv: the table still draws.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): report rows rebuilt from the documented rules: count by severity = `{'critical': 2, 'serious': 6, 'warning': 2}`; rows left when the Yearlings group is gone (LOAD-03 shipped case) = `7`.

**Proposed fix (recommendation).** Draw the exception table first. Build the gain tile from gainStatus results (one line per group with a target, or the worst group against its target) and fall back to 'No weigh-ins yet' when there is no result or the target is not a finite number. Use String(g.group). Isolate each section (LOAD-02).

**Files affected.** `app.js` (tile built from `gainStatus` results; draw order); browser test (new; the repository has none yet).

**Related findings.** [LOAD-02](#load-02), [GAIN-05](#gain-05), [CSV-06](#csv-06)

<a id="csv-01"></a>
#### CSV-01: The CSV reader is not RFC 4180: quoted commas shift columns, quotes stay in the text, and CR-only or doubled-CR line endings break whole files

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: CSV reading

**Problem.** `parseCSV` splits lines on `\r?\n` and every line on commas. Quoted fields, which Python's `csv.writer` and spreadsheets produce for any value containing a comma, are cut in the middle and keep their quote marks. CR-only or doubled-CR line endings break whole files. The committed data has no commas or quotes, so the mismatch is latent today.

**Where in the code.** exceptions.js:22-34 (line 23 split(/\\r?\\n/); line 24 header split with no trim; line 26 line.split(",")); scripts/generate_data.py:42-46 (csv.writer quotes such fields); README.md:74 ('replace the CSVs with exports in the same columns')

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-01..CSV-08); `node docs/audit/diagnostics/csv.verify.mjs` (CASE CV-01, CV-01b, CV-01c: doubled-CR); `node docs/audit/diagnostics/csv.verify.browser.mjs` (CASE VB-01, VB-02); `node docs/audit/diagnostics/gain.missed.mjs` (CASE M2: weights written "1,169"); `node docs/audit/diagnostics/csv.browser.mjs` (CASE B-09). Minimal input: health row Yearlings,"Booster vaccine, 2nd round",2026-06-02,2026-09-15,open with as_of 2026-09-30T18:00.
- Actual output, quoted from the evidence:

  > CSV-01/02/03/04/06/08: '(no alerts)'. CSV-07: 'THROWS TypeError: Cannot read properties of undefined (reading 'localeCompare')'. CV-01b (water.csv with \\r\\r\\n): LOST both critical water rows; NEW 'serious|Tank T6 (Cedar Draw)|No reading for 42 hours; last level undefined%'. CV-01c (moves.csv): '30 alerts' including 'Day 121 of a 21-day plan (100 days over)'. VB-02 (all files): page errors ["Cannot read properties of undefined (reading 'toFixed')"], 0 rows. gain M2: weight_lbs parsed as the text '"1'; 'Heifers adg=NaN'; 'total exceptions=9'.

- How it was verified: confirmed (verify_csv F0), plus two skeptic missed findings merged here (verify_csv M0 doubled-CR line endings; verify_gain M0 quoted thousands separators). Evidence: csv.repro '66 cases: 8 MATCH, 58 MISMATCH'; CSV-01 '(no alerts)'; CSV-07 'THROWS TypeError: Cannot read properties of undefined (reading 'localeCompare')'; parseCSV('a,b,c\\n"x, y",2,3') gives a = '"x', b = ' y"', c = 2. Corrections applied: the writer is generate_data.py write() at lines 42-46 (not 108-112); the writer/reader mismatch is latent today because the committed data has no commas or quotes; CR-only is a rare trigger, so high rests on the quoted-comma, fully quoted and doubled-CR cases. Registrar re-ran csv.repro.mjs and gain.missed.mjs on 2026-10-16: same totals and outputs.

**Expected behaviour.** CSV-01: serious 'Yearlings: Booster vaccine, 2nd round | Overdue by 15 days (due 2026-09-15)'. CSV-07 (fully quoted water.csv): critical 'Down to 11.8% full', no crash. Doubled-CR files: the same 10 alerts as the committed data. Quoted weights "1,169": serious Heifers 0.44 lbs/day (1119/2565 = 0.4363).

**Operational consequence.** Real exports quote any field that contains a comma, and spreadsheets often write formatted numbers such as "1,169". One such field silently removes the alert for that row (an overdue vaccination, an overstay, an overspend, the heifer gain problem). A fully quoted export crashes the page, and a file written in text mode on Windows hides both critical water alerts or floods grazing with false over-plan rows.

**Proposed regression test.** assert.deepEqual(parseCSV('a,b,c\\n"x, y","say ""hi"" now",3'), [{a:'x, y', b:'say "hi" now', c:3}]); parseCSV('a,b\\r1,2') gives [{a:1,b:2}]; parseCSV('a,b\\r\\r\\n1,x\\r\\r\\n') gives [{a:1,b:'x'}]. Round trip: a row written by Python csv.writer parses back to the same values. CSV-01 fixture gives {severity:'serious', subject:'Yearlings: Booster vaccine, 2nd round', problem:'Overdue by 15 days (due 2026-09-15)'} (Sep 15 to Sep 30 = 15 calendar days). For each data file, text.replaceAll('\\r\\n','\\r\\r\\n') gives the committed 10 alerts.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): booster days overdue on the as-of date = `15`; Heifers pooled gain lbs / animal-days = `(1119, 2565)`; Heifers ADG = `0.4363`.

**Proposed fix (recommendation).** Replace line.split(',') with a small RFC 4180 tokenizer (quoted fields, "" escapes, commas and line breaks inside quotes, CRLF/LF/CR line ends, a leading BOM stripped), about 35 lines with no dependency. Trim header names. Numeric columns accept a value like "1,169" only where the per-file data contract says so, never by guessing. Reword README.md:74 to state the accepted format.

**Files affected.** `exceptions.js` (`parseCSV`); `README.md` (line 74: accepted format); `tests/exceptions.test.mjs`; `scripts/generate_data.py` is the writer side of the mismatch and needs no change.

**Related findings.** [CSV-02](#csv-02), [CSV-04](#csv-04), [DATA-02](#data-02), [GAIN-04](#gain-04)

<a id="csv-02"></a>
#### CSV-02: Blank, whitespace-only, ',,,' and repeated-header rows are read as records: false critical alerts or a blank page

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: CSV reading

**Problem.** The reader drops only completely empty lines. Rows such as ',,,' (what Excel writes for formatted empty rows), whitespace-only lines and a header repeated mid-file are read as records, with blank or header-text values.

**Where in the code.** exceptions.js:25 (filter(Boolean) keeps ',,,' and '   '), :30 ('   ' becomes 0), :57-59, :69-70; app.js:49 (budget tile reduce), :90-93; app.js:221-225 (no error message)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-12, CSV-14, CSV-15, CSV-16); `node docs/audit/diagnostics/csv.browser.mjs` (CASE B-01: ',,,' appended to moves.csv); `node docs/audit/diagnostics/csv.verify.mjs` (CASE CV-02, CV-02b); `node docs/audit/diagnostics/csv.verify.browser.mjs` (CASE VB-03, VB-04, VB-05). Minimal input: the committed moves.csv with ',,,' appended.
- Actual output, quoted from the evidence:

  > CSV-15: 'THROWS TypeError: Cannot read properties of undefined (reading 'name')'. CSV-16: 'THROWS TypeError: ... (reading 'date')'. CSV-14: 'critical|Tank  (undefined)|Down to % full'. B-01: page errors ["Cannot read properties of undefined (reading 'name')"]; empty header; tiles []; 0 exception rows. CV-02b: '9 tanks ["T1","T2","T3","T4","tank_id",...]'; VB-04 tile 'WATER TANKS OK / 6 of 9 / 3 need a look'; VB-05 tile 'SPEND VS BUDGET / +NaN% / \$NaN of \$NaN'.

- How it was verified: confirmed (verify_csv F1; the CSV skeptic's own missed finding M1 for repeated headers). Evidence: CSV-15 'THROWS TypeError: ... (reading 'name')', CSV-16 '(reading 'date')', CSV-14 'critical|Tank  (undefined)|Down to % full'; CV-02 (weights.csv with its header repeated) throws '(reading 'date')'; CV-02b invents a ninth tank named 'tank_id'. Corrections applied: the B-01 page looks failed rather than like an all-clear; ',,,' is the realistic trigger (whitespace-only lines are unusual) and it only hurts in moves, weights and water. Registrar re-ran CSV-14/15/16 on 2026-10-16: same.

**Expected behaviour.** Empty rows and repeated header rows are skipped and counted in a visible data note. The committed data plus a ',,,' row, or with its header repeated mid-file, still gives the same 10 alerts and 8 tanks, and the spend tile still reads '+1.0% / \$89,303 of \$88,400'.

**Operational consequence.** Excel writes ',,,' for formatted but empty rows, and pasting a new export under the old one repeats the header. In moves.csv or weights.csv that blanks the whole report (both critical water alerts included) with no error text; in water.csv it raises a critical 'go now' alert for a tank with no name.

**Proposed regression test.** assert.deepEqual(parseCSV('a,b\\n1,2\\n,\\n   \\n3,4'), [{a:1,b:2},{a:3,b:4}]). For moves, weights and water, append ',,,\\r\\n' to the committed file: findExceptions does not throw and returns the committed 10 alerts. Repeat the header mid-file: weights.csv gives 10 alerts; water.csv gives 8 tanks (T1-T8); budget.csv gives the tile '+1.0% / \$89,303 of \$88,400' (89,303 / 88,400 = 1.010).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): tank count in water.csv = `8`; season totals and tile percent = `(88400, 89303, 1.0)`.

**Proposed fix (recommendation).** In the reader, drop rows whose cells are all empty after trim and rows whose trimmed cells equal the header names, and report the count as a visible data note. The typed data contract (DATA entries) then rejects text such as 'level_pct' in a numeric column.

**Files affected.** `exceptions.js` (`parseCSV`); `tests/exceptions.test.mjs`.

**Related findings.** [CSV-01](#csv-01), [LOAD-02](#load-02)

<a id="csv-03"></a>
#### CSV-03: No column checks: a renamed, misspelled or space-padded header, or a vendor title line above the header, silently turns a rule off

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: CSV reading

**Problem.** Header names are used exactly as written: no trim, and no check that the columns a rule needs exist. A renamed, misspelled or space-padded column, or a vendor title line above the header, makes the rule that reads it see `undefined` and stay silent.

**Where in the code.** exceptions.js:24 (header split, no trim, no validation); consumers read r.level_pct, h.status and d.meta[0].as_of directly (exceptions.js:47, :141, :95)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-09, CSV-24, CSV-25, CSV-31); `node docs/audit/diagnostics/csv.verify.mjs` (CASE CV-04, CV-04b). Minimal input: water.csv with the header 'tank_id,pasture_id,time,level'.
- Actual output, quoted from the evidence:

  > CSV-24 (column 'level'): '(no alerts)'. CSV-25 (no status column): '(no alerts)'. CSV-31: 'THROWS TypeError: Cannot read properties of undefined (reading 'as_of')'. Header 'level_pct ': LOST 'critical|Water|Tank T2 (Windmill)|Down to 11.8% full' and the T4 leak; NEW 'serious|Water|Tank T6 (Cedar Draw)|No reading for 42 hours; last level undefined%'.

- How it was verified: confirmed (verify_csv F5). Evidence: committed data with the header 'level_pct ' (trailing space) gives '8 alerts (base 10)': lost the T2 and T4 critical rows, new 'No reading for 42 hours; last level undefined%'. CSV-24 and CSV-25 print '(no alerts)'; CSV-31 throws '(reading 'as_of')'. The skeptic added more common triggers covered by the same fix: a one-line vendor preamble (CV-04 throws '(reading 'localeCompare')'; CV-04b loses the booster and pinkeye rows) and doubled-CR line ends (CSV-01). Registrar re-ran CSV-24/25/31 on 2026-10-16: same.

**Expected behaviour.** A visible load error naming the file and the missing column (for example 'water.csv: column level_pct not found'). For 'level_pct ' (trailing space) the trimmed header works normally: T2 critical 'Down to 11.8% full'.

**Operational consequence.** A vendor export that calls the column 'level' or 'Level %' turns off every low-tank and leak alert while the page still looks normal: a misleading all-clear on water. A health export without a status column hides every vaccination reminder.

**Proposed regression test.** Header 'tank_id,pasture_id,time,level': the loader reports an error whose message includes 'water.csv' and 'level_pct'. Header 'level_pct ': T2 critical 'Down to 11.8% full' is still reported (11.8 is T2's 2026-09-30T18:00 value in data/water.csv). A vendor title line above the header: a data issue naming the file, not a crash.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): T2 last level = `11.8`.

**Proposed fix (recommendation).** Declare the required columns per file in the data contract, trim header names, tolerate and report a known title line, and on a missing column show that area as CAN'T TELL with the file and column named.

**Files affected.** `exceptions.js` (data contract: required columns, trimmed headers); `app.js` (CAN'T TELL display); `tests/exceptions.test.mjs`.

**Related findings.** [LOAD-01](#load-01), [CSV-01](#csv-01)

<a id="csv-04"></a>
#### CSV-04: Blank cells are kept as '' instead of 'missing', so they act as 0 or join as text: a blank weight hides the heifer alert or flags a healthy animal, and blank head or acres cells give absurd headline numbers

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: CSV reading

**Scope note.** Root-cause entry for the Phase 1 rule 'blank means missing'. Each area's blank-cell consequence has one owner for its fix and test: blank tank levels WAT-01; blank budget amounts BUD-01 (counted as 0) and BUD-02 (joined as text); blank plans and move dates GRZ-03; blank targets GAIN-05 and LOAD-03. This entry owns the reader rule (a blank parses to null) and the cases with no area entry: blank weights (GN-09, gain.missed M5, CSV-48) and blank head or acres in the tiles. CSV-43 to CSV-46 stay in 'actual' and 'repro' as evidence of the shared cause, not as separate defects.

**Problem.** A blank cell is kept as the empty string `''`. In comparisons it acts as 0 (`'' < 25` is true), and in sums it joins as text. A missing weight, level, plan, head count or acres value therefore invents alerts, hides real ones, or prints absurd headline numbers.

**Where in the code.** exceptions.js:29-30 ('' kept as a string), :49 and :109-115 ('' &lt; 25 is true), :58 and :119 (a blank plan acts as 0), :70 (blank weight), :86 (+= joins strings); app.js:49-50 and :223 (tile and acres sums)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-13, CSV-43, CSV-44, CSV-45, CSV-46, CSV-48); `node docs/audit/diagnostics/csv.browser.mjs` (CASE B-07, B-08); `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-09); `node docs/audit/diagnostics/gain.missed.mjs` (CASE M5: H001's Jul 20 weight blank); `node docs/audit/diagnostics/render.skeptic.browser.mjs <scratchDir> 8932` (section M3: blank head, blank acres).
- Actual output, quoted from the evidence:

  > CSV-45: 'serious|Fuel|2700324931% over season to date (\$259,231,193,400)'. CSV-46: 'serious|Cows in South Divide|Day 18 of a -day plan (18 days over)'. CSV-48: 'serious|Yearlings|-1.49 lbs/day since 2026-07-20 vs 2.0 target'. GN-09: 'Y001 adg=-12.4737 weight=""  ||  ... warning | 7 yearlings | Under 1.0 lbs/day: Y001, ...'. M5: 'H001 adg=20.50877192982456; Heifers adg=0.8799220272904481' and the serious heifer row is gone. B-08 tile 'HEAD ON GRASS / 180150'; blank acres give '4100 acres' with no separator.

- How it was verified: confirmed (verify_csv F3, verify_gain F6; the render skeptic's own missed finding M2). Evidence: CSV-45 'serious|Fuel|2700324931% over season to date (\$259,231,193,400)'; CSV-46 'Day 18 of a -day plan (18 days over)'; B-08 tile 'HEAD ON GRASS / 180150'. Corrections applied: the lost Fuel alert in CSV-44 comes from a blank actual counted as 0 against a season budget that includes the unbooked month (BUD-01), while string joining drives CSV-45 and the B-07 tile (BUD-02); CSV-43 does need attention, but as a sensor or data alert, not 'Down to % full'; the gain skeptic showed a blank EARLIER weight hides the serious heifer alert (gain.missed M5); regression tests must go through the loader or pass null. Registrar re-ran CSV-43/44/45 and gain.missed M5 on 2026-10-16: same. Severity high is the CSV skeptic's grade for the shared cause across files (verify_csv F3); taken alone, the gain-weight cases were graded medium by the gain skeptic and the tile sums low by the render skeptic. The critic re-ran csv.repro CSV-48 and gain.missed M5 on 2026-10-16: same output.

**Expected behaviour.** A blank numeric cell becomes null (missing), never 0 and never text. GN-09: Y001 left out and reported as missing; the slow list stays Y027, Y031, Y058, Y082, Y129, Y132. M5: serious Heifers at 1088/2508 = 0.4338. Head tile: 330 known head (180 + 150) with a 'Heifers count missing' note.

**Operational consequence.** One missed scale reading tells the crew to pull a normal animal, or hides the group-wide heifer problem. One blank cell in an earlier budget month prints a 2.7-billion-percent overrun. Absurd headline numbers make every figure on the page hard to trust.

**Proposed regression test.** Through the loader (not by feeding '' into budgetStatus): a blank numeric cell parses to null. CSV-48 fixture: no Gain alerts. GN-09 data: slow list exactly [Y027, Y031, Y058, Y082, Y129, Y132]; Yearlings without Y001 = 16468/8493 = 1.939. M5 data: serious Heifers 0.43 (1088/2508). Blank Heifers head: the tile is not a 5-digit run like '180150' and shows 330 or a missing marker. Blank P8 acres: '4,100 acres' plus a note.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): total acres (header '4,300 acres') = `4300`; acres without P8 (CSV-04 blank P8 case) = `4100`; known head without Heifers (CSV-04 blank-head case) = `330`; Heifers without H001 = `(1088, 2508, 0.4338)`; Yearlings without Y001 = `(16468, 8493, 1.939)`; yearlings under 1.0 lb/day (50% of the 2.0 demo target) = `['Y027', 'Y031', 'Y058', 'Y082', 'Y129', 'Y132']`.

**Proposed fix (recommendation).** Typed per-file contract: numeric columns become finite Numbers or null, never ''. Each consumer handles null explicitly: water uses the last valid reading and reports the bad row (WAT-01); gain leaves the animal out and lists it as 'missing weight'; budget treats a blank actual as 'not entered' (BUD-01); grazing reports 'no plan recorded' (GRZ-03); tiles sum only finite values and say how many are missing.

**Files affected.** `exceptions.js` (reader and every consumer); `app.js` (tile and acres sums); `tests/exceptions.test.mjs`.

**Related findings.** [WAT-01](#wat-01), [BUD-01](#bud-01), [BUD-02](#bud-02), [GRZ-03](#grz-03)

<a id="csv-05"></a>
#### CSV-05: Cells and keys are not trimmed: a stray space in a pasture ID ('P3 ') blanks the page, 'T4, P4' drops which group drinks at the leaking tank, and 'open ' hides every health task

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: CSV reading

**Scope note.** Split by the completeness critic: whitespace (all files) is owned here; the case and unlisted-status parts of the same raw findings are owned by HLTH-01, so the 'Open' defect has one ID.

**Problem.** Cells and keys are never trimmed. Pasture lookups, tank-to-pasture links and the status test (`status !== 'open'`) compare raw text, so one stray space changes the result.

**Where in the code.** exceptions.js:26-30 (cells never trimmed), :57, :97, :103 (lookups by raw text), :141 (status !== 'open')

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-10, CSV-11); `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE H-01c 'open '); `node docs/audit/diagnostics/healthbudget.skeptic.mjs` (section F1, ' open'). Minimal input: the moves row 'Yearlings,P3 ,2026-09-06,', or committed health.csv with ',open' replaced by ',open '.
- Actual output, quoted from the evidence:

  > CSV-10: 'THROWS TypeError: Cannot read properties of undefined (reading 'name')'. CSV-11: 'critical|Tank T4 (undefined)|Down to 10% full'. H-01c ('open '): '(no alerts)'. Committed data with ',open ': LOST 'serious|Health|Yearlings: Booster vaccine|Overdue by 15 days (due 2026-09-15)' and 'warning|Health|Cows: Pinkeye check|Due in 3 days (2026-10-03)'.

- How it was verified: confirmed (verify_csv F7). Evidence: CSV-10 ('P3 ') 'THROWS TypeError: Cannot read properties of undefined (reading 'name')', the same blank page as an unknown pasture (DATA-01); CSV-11 ('T4, P4') 'critical|Tank T4 (undefined)|Down to 10% full', and on the committed data the T4 row loses 'Heifers here now'; committed health.csv with ',open ' (trailing space) loses the booster and pinkeye rows ('8 alerts (base 10)'). The auditor graded medium; the skeptic said that a trailing space or a capital letter silently removing a whole rule is the same class as CSV-06 and should be high for consistency. Registry: high, because a stray space in a pasture ID blanks the page and a trailing space empties the Health area, the standard applied to DATA-01 and CSV-06. Ownership (completeness critic, 2026-10-16): this entry owns trimming every cell and key in the reader; letter case and unlisted values in the status column ('Open', 'OPEN', 'in progress') belong to HLTH-01. The critic re-ran csv.repro.mjs on 2026-10-16: CSV-10 and CSV-11 gave the output quoted below.

**Expected behaviour.** CSV-10: serious 'Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over)' (Sep 6 to Sep 30 = 24 days). CSV-11: 'Tank T4 (Lone Tree)' with its group context. A status written 'open ' or ' open' reads as open: serious 'Overdue by 15 days (due 2026-09-15)'.

**Operational consequence.** A stray space after a pasture ID blanks the whole page. A space after a comma drops which group is drinking at a leaking tank. A trailing space typed after 'open' hides every overdue health task.

**Proposed regression test.** assert.deepEqual(parseCSV('a,b\\n x , y '), [{a:'x', b:'y'}]) (every cell and header name trimmed). Moves row 'Yearlings,P3 ,2026-09-06,': serious 'Day 24 of a 21-day plan (3 days over)'. Water 'T4, P4': subject 'Tank T4 (Lone Tree, Heifers here now)'. Committed health.csv with ',open' changed to ',open ' and to ', open': the booster serious row and the pinkeye warning are still present. The case variants ('Open', 'OPEN') are tested under HLTH-01.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): booster days overdue on the as-of date = `15`; Yearlings in Sand Hills: day, plan, days over = `(24, 21, 3)`.

**Proposed fix (recommendation).** Trim every cell and header name in the reader. Compare IDs after trim, with the case policy for IDs stated in the data contract (an unknown ID is a data issue, DATA-01). Status values are normalised and checked against a list under HLTH-01.

**Files affected.** `exceptions.js` (`parseCSV`); `tests/exceptions.test.mjs`.

**Related findings.** [HLTH-01](#hlth-01), [DATA-01](#data-01)

<a id="csv-06"></a>
#### CSV-06: Number-looking IDs, tags, group names and dates are turned into numbers: tags merge, pastures collide, and a digits-only group name blanks the page

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: CSV reading

**Problem.** Any cell that looks like a number becomes a Number (`exceptions.js:30`), including IDs, tags, group names and dates. Tags lose their form ('007' becomes 7, '0x10' becomes 16), pasture '01' collides with '1', and a group named '2025' breaks `g.group.toLowerCase()`. A current unit test asserts this blanket conversion (`tests/exceptions.test.mjs:64-66`).

**Where in the code.** exceptions.js:30 (blanket +v coercion), :66, :74, :135 (g.group.toLowerCase()); app.js:54; tests/exceptions.test.mjs:64-66 (a test asserts the blanket coercion)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-18..CSV-23); `node docs/audit/diagnostics/csv.verify.browser.mjs` (CASE VB-10); `node docs/audit/diagnostics/render.repro.mjs` (CASE R12). Minimal input: groups.csv with Cows renamed 2025.
- Actual output, quoted from the evidence:

  > CSV-18: 'head 1, tags [7], adg -Infinity'. CSV-20: 'warning|1 yearlings|Under 1.0 lbs/day: 16' (tag 0x10). CSV-21: 'warning|Cows in South|Planned move in 1 day'. CSV-22: 'THROWS TypeError: g.group.toLowerCase is not a function'. CSV-23: 'THROWS TypeError: a.time.localeCompare is not a function'. VB-10: page errors ["g.group.toLowerCase is not a function"], tiles [], 0 rows.

- How it was verified: confirmed (verify_csv F6). Evidence: parseCSV('tag\\n007\\n1e3\\n0x10\\n 12 ') gives tags 7, 1000, 16, 12; CSV-21 'warning|Cows in South|Planned move in 1 day' instead of 19 days over; CSV-22 'THROWS TypeError: g.group.toLowerCase is not a function'; CSV-23 'a.time.localeCompare is not a function'. The skeptic said medium fits the contrived merge cases, but showed the browser crash is wider: app.js:54 calls g.group.toLowerCase() on every group, so VB-10 (Cows renamed '2025') gives page errors ["g.group.toLowerCase is not a function"], tiles [] and 0 rows. The registry keeps high because that blank page meets the high rubric. Registrar re-ran CSV-21/22 on 2026-10-16: same.

**Expected behaviour.** IDs, tags, group names and dates stay trimmed strings: '007' and '7' are two animals; CSV-21 gives serious 'Cows in North | Day 29 of a 10-day plan (19 days over)' (Sep 1 to Sep 30 = 29; 29 - 10 = 19); a group named '2025' draws normally.

**Operational consequence.** A ranch that names groups by calf-crop year ('2025') gets a blank page. A pull list can name the wrong tag (16 for 0x10, 7 for 007). A group 19 days past its plan can be reported as 'move in 1 day' because pasture 01 is judged against pasture 1's plan.

**Proposed regression test.** With the data contract, parseCSV of 'tag,group,date,weight_lbs\\n007,Y,2026-07-20,700' gives tag === '007' (a string) and weight_lbs === 700. CSV-21 fixture: serious 'Day 29 of a 10-day plan (19 days over)'. CSV-22 fixture: no throw, and a warning subject '1 2025'. Browser with Cows renamed 2025: 10 rows, no pageerror. Update tests/exceptions.test.mjs:64-66, which currently asserts blanket coercion.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): report rows rebuilt from the documented rules: count by severity = `{'critical': 2, 'serious': 6, 'warning': 2}`.

**Proposed fix (recommendation).** Convert only the declared numeric columns (level_pct, weight_lbs, acres, head, target_adg_lbs, planned_graze_days, min_rest_days, budget, actual). Keep every \*\_id, tag, group, name, task, category, status and date as a trimmed string.

**Files affected.** `exceptions.js` (convert declared numeric columns only); `tests/exceptions.test.mjs` (update lines 64-66); browser test (new; the repository has none yet).

**Related findings.** [LOAD-03](#load-03), [GAIN-06](#gain-06), [DATA-02](#data-02)

<a id="data-01"></a>
#### DATA-01: Unknown pasture, tank or group references crash the page or silently drop data

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Data contract

**Problem.** Rules and charts look up pastures, tanks and groups by ID and use the result without checking that it exists. An ID missing from its master file either throws (blanking the page) or silently drops the rows that use it.

**Where in the code.** exceptions.js:57-59 (p = byId[m.pasture_id]; p.name), :97 and :103 (pName undefined), :73-75 (weights groups not in groups.csv never matched); app.js:82 and :104 (names[t.pasture]), :115 (timeline rows from groups.csv only), :129, :140, :143 (p.pasture_id, p.name), :222

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/grazing.repro.mjs` (CASE G-01, G-02, GB-01: open move to P9, 'p3', 'P3 '; G-C3, GB-02: closed move to P9; G-C4, GB-06: group 'Bulls' not in groups.csv); `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-26, CSV-27, CSV-28); `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-15 'yearlings', GN-03 no heifer rows); `node docs/audit/diagnostics/water.repro.mjs` (CASE W-15). Minimal input: committed moves.csv with 'Yearlings,P3,2026-09-06,' changed to 'Yearlings,P9,2026-09-06,'.
- Actual output, quoted from the evidence:

  > G-01: 'threw TypeError: Cannot read properties of undefined (reading 'name') -> findExceptions returns nothing at all'. GB-01: 'pageErrors=["Cannot read properties of undefined (reading 'name')"] asofLine="" tiles=0 alertRows=0 waterCharts=0 grazingChart=false gainChart=false budgetChart=false rulesRows=0'. GB-02 (closed move to P9): '(reading 'pasture_id')', grazingChart=false, gainChart=false, budgetChart=false, rulesRows=0. CSV-28: '(no alerts)'. GN-15: 'Yearlings head=144' and the slow-yearling warning is gone. CSV-27: 'critical|Tank T9 (undefined)|Down to 11.8% full'. GB-06: Bulls alerted '(19 days over)' but the timeline rows are only Cows, Heifers, Yearlings.

- How it was verified: confirmed by four skeptics (verify_csv F8; verify_grazing F0, F1, F10; verify_gain F8; verify_water F14). Evidence: grazing G-01 'threw TypeError: Cannot read properties of undefined (reading 'name')' and GB-01 'pageErrors=[...] asofLine="" tiles=0 alertRows=0'; a closed move to P9 (GB-02) throws '(reading 'pasture_id')' with rulesRows=0; CSV-28 '(no alerts)'; W-15 'Tank T9 (undefined)'; the water skeptic ran the app.js:82 path: heading 'T8 undefined 84.5%'. Correction applied: the blank page reads as broken or still loading rather than as an all-clear; the accurate wording is 'all alerts, including the critical T4 and T2 tanks, are hidden and the page gives no reason'. Registrar re-ran grazing.repro.mjs (G-01, GB-01, GB-02) and csv.repro CSV-26/27/28 on 2026-10-16: same.

**Expected behaviour.** No crash. Each unknown reference becomes a visible data issue naming the file, row and ID ("Yearlings: pasture P9 isn't in pastures.csv"), and everything else is judged as usual: with the open move to P9 the 9 non-grazing alerts (T2 low, T4 leak, T6 silent, gain, health, budget) still show. A tank in P9 reads 'Tank T9 (P9)'. Weigh-ins under 'Heifer' are reported as an unknown group, or matched so the Heifers stay serious (CSV-28: 40/57 = 0.702 &lt; 0.8).

**Operational consequence.** One typo in the grazing log, or a pasture added to moves.csv before pastures.csv, hides every alert on the ranch with no reason given. A misspelled group in the scale export makes that group's poor gain vanish. The crew is told to check a tank 'in undefined'.

**Proposed regression test.** Committed data with the open Yearlings move to P9: findExceptions does not throw, returns critical rows for 'Tank T2' and 'Tank T4' and at least 9 non-grazing rows (the committed data has 10 alerts, 1 of them grazing), and exactly one row mentions 'P9'. Repeat with 'p3' and 'P3 ': matched to Sand Hills or reported. Closed move to P9: Playwright shows #grazing svg, #gain svg, #budgetChart svg and 12 #rules tr (11 rules + header). CSV-28 fixture: an unknown-group data issue naming 'Heifer', or serious '0.70 lbs/day'. W-15: the subject contains 'P9' and never 'undefined'.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): DATA-01 CSV-28 40/57 = `0.7018`.

**Proposed fix (recommendation).** After loading, run reference checks in the data contract: pasture_id in moves and water against pastures.csv, tank_id against tanks.csv (WAT-02), group in weights, moves and health against groups.csv. Each miss becomes a visible data issue row, and lookups fall back to the raw ID (pName[id] ?? id) instead of dereferencing undefined. Timeline rows are groups.csv plus any extra group found in moves, flagged.

**Files affected.** `exceptions.js` (reference checks, lookups with fallback); `app.js` (lookups, timeline rows); `data/tanks.csv` (new, from WAT-02); `tests/exceptions.test.mjs`; browser test (new; the repository has none yet).

**Related findings.** [CSV-05](#csv-05), [LOAD-02](#load-02), [WAT-02](#wat-02)

<a id="data-02"></a>
#### DATA-02: Dates and times are never validated or parsed once: day-first, impossible, numeric, space-separated or M/D/YYYY values silently drop alerts, invent alerts or crash

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Data contract

**Problem.** Dates are never checked against a format. They are sorted as strings and passed raw to `new Date()`. Day-first, impossible, numeric (spreadsheet serial), space-separated or M/D/YYYY values give NaN, wrong day counts or a wrong 'latest' row.

**Where in the code.** exceptions.js:36 (days() uses new Date on raw strings), :43 and :68 (string localeCompare sort), :48, :58, :95, :142; exceptions.js:30 (number-looking dates become Numbers); app.js:113, :223

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/time.repro.mjs` (CASE TIME-05, TIME-06, TIME-07, TIME-08, TIME-09, TIME-10, TIME-19); `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-38..CSV-42, CSV-40b); `node docs/audit/diagnostics/water.repro.mjs` (CASE W-05: newest row written '2026-09-30 18:00'; W-05b); `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-16); `node docs/audit/diagnostics/gain.missed.mjs` (CASE M6: day-first weigh dates); `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE H-08, run with TZ=America/Chicago and TZ=Europe/Berlin); `node docs/audit/diagnostics/healthbudget.skeptic.missed.mjs` (CASE M2: next_due 46327); `node docs/audit/diagnostics/time.verify.mjs` (CASE F7+); `node docs/audit/diagnostics/csv.verify.mjs` (CASE CV-06); `node docs/audit/diagnostics/time.browser.mjs` (CASE TB-09). Minimal input: health row 'Yearlings,Booster vaccine,2026-06-02,15/09/2026,open' with as_of 2026-09-30T18:00.
- Actual output, quoted from the evidence:

  > TIME-07: '(no alert)'. TIME-08: 'serious: Yearlings in Sand Hills: Day 113 of a 21-day plan (92 days over)'. TIME-09: 'silentHours=NaN; (no alert)'. TIME-19: '6 rows (critical 2, serious 3, warning 1); missing: T6, Yearlings in Sand Hills, Booster, Pinkeye'; TB-09 header 'Data as of Invalid Date.'. CSV-39: 'warning|Cows: Pinkeye check|Due in 1 day (2026-09-31)'. TIME-05 (Chicago): 'Day 21.791666666666668 of a 21-day plan (0.7916666666666679 days over)'. W-05: 'sorted order=2026-09-29T18:00 , 2026-09-30 18:00 , 2026-09-30T12:00; level used=75; (no water alerts)'. GN-16 compact dates: 'threw TypeError: a.date.localeCompare is not a function'. gain M6: 'Heifers adg=NaN ... rows=[]; total exceptions=8'. Health M2: 'serious | Yearlings: Deworm | Overdue by 20725.99946380787 days (due 46327)'. H-08 (Berlin): 'serious | Cows: Pinkeye check | Overdue by 0.08333333333333333 days'.

- How it was verified: confirmed (verify_time F1, F5, F6; verify_gain F9; verify_healthbudget F13), partially-confirmed (verify_csv F14, verify_water F3), plus the health/budget skeptic's own missed finding M1. Evidence: TIME-07 '(no alert)' for a due date of 15/09/2026; TIME-08 'Day 113 of a 21-day plan (92 days over)'; TIME-19 '6 rows ... missing: T6, Yearlings in Sand Hills, Booster, Pinkeye'; CSV-39 'Due in 1 day (2026-09-31)'; health M2 case 'Overdue by 20725.99946380787 days (due 46327)'. Corrections applied: that an Excel re-save turns 'YYYY-MM-DDTHH:MM' into M/D/YYYY is unverified (no Excel was run); the realistic triggers are date-only columns re-saved by a spreadsheet, space-separated ISO timestamps, hand-typed rows and typos. M/D/YYYY fails visibly with fractions in US zones rather than silently, and a whole water file in M/D form is loud (8 silent tanks), which the water skeptic graded medium; day-first weigh dates make every ADG NaN (gain.missed M6); a day-first as_of shows 'Data as of Invalid Date.' High stands for the silent loss of an overdue health task and the silent drops from typos. Registrar re-ran TIME-07/08/09/19, W-05/W-05b and gain.missed M6 on 2026-10-16: same.

**Expected behaviour.** Each date column accepts one documented form (YYYY-MM-DD for days; YYYY-MM-DDTHH:MM for timestamps, read in the ranch zone, TIME-02). Anything else, including '2026-09-31', '15/09/2026', '46327' and '2026-13-01', becomes a visible data issue naming the file, row and value, and is never judged silently. Valid data gives whole-day counts for every viewer: booster 'Overdue by 15 days' (Sep 15 to Sep 30); Sand Hills 'Day 24 of a 21-day plan (3 days over)'; the newest water reading is chosen by parsed time.

**Operational consequence.** Spreadsheet re-saves, hand-typed rows and database exports change date formats. When that happens an overdue booster, an overstay or a dead sensor can disappear while the shorter list still looks complete; a day-first move date raises a false '92 days over'; spreadsheet serial dates turn open health tasks into 'Overdue by 20725 days'; a space-separated newest reading hides a tank at 20%.

**Proposed regression test.** For each date column, feed '15/09/2026', '2026-09-31', '2026-13-01', '46327' and '' (where a date is required): findExceptions returns a data issue row naming the file and value, and never silently returns fewer rows. Valid committed data: 10 rows. Water rows 2026-09-30T06:00 50, 2026-09-30T12:00 49 and '2026-09-30 18:00' 20 with as_of 2026-09-30T18:00: a data issue for the space form or, if that form is accepted, critical 'Down to 20% full'. Under TZ=America/Chicago and TZ=Pacific/Auckland every Grazing and Health problem matches /\\b\\d+ days?\\b/ with no decimal point. Health next_due 46327: no 'Overdue' row (spreadsheet serial 46327 is 2026-11-01, 32 days after Sep 30).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): booster days overdue on the as-of date = `15`; Yearlings in Sand Hills: day, plan, days over = `(24, 21, 3)`.

**Proposed fix (recommendation).** Strict parsers in the data contract: parseDay accepts only /^\\d{4}-\\d{2}-\\d{2}\$/ and checks that the day exists (round trip through Date.UTC); parseStamp accepts YYYY-MM-DDTHH:MM (optionally with an offset) and reads it in the ranch zone (TIME-02). Parse once at load into numbers, sort numerically, count whole days from Date.UTC parts, and report anything else as a data issue with file, row and value. Date columns are never turned into numbers.

**Files affected.** `exceptions.js` (strict date parsers); `app.js` (header, timeline); `tests/exceptions.test.mjs` (including child processes under several TZ values).

**Related findings.** [TIME-02](#time-02), [TIME-03](#time-03), [CSV-06](#csv-06), [GRZ-03](#grz-03)

<a id="wat-01"></a>
#### WAT-01: Tank levels are never validated: a fault code ('ERR', 'NaN', '11.8%') hides a critical tank as fine, and a blank, -999 or 140 reading raises a false critical leak

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Water

**Problem.** `level_pct` is used without checking that it is a number from 0 to 100. Text such as 'ERR' or 'NaN' fails every comparison, so the tank raises nothing; a blank, -999 or 140 passes the low or drop tests and raises a false critical.

**Where in the code.** exceptions.js:30 (non-numbers stay strings; 'Infinity' becomes Infinity), :47-49 (level and drop from the last row, unchecked), :109-115 (comparisons against a string or NaN); app.js:47, :55, :82, :91, :93 (tile, heading and SVG from the raw value)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.repro.mjs` (CASE W-09 blank level, W-10 'ERR', B-05 committed T2 newest row set to ERR in Chromium); `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-43, CSV-49..CSV-56); `node docs/audit/diagnostics/csv.browser.mjs` (CASE B-06); `node docs/audit/diagnostics/render.repro.mjs` (CASE R16). Minimal input: rows 'T1,P1,2026-09-29T18:00,80' and 'T1,P1,2026-09-30T18:00,ERR' with as_of 2026-09-30T18:00.
- Actual output, quoted from the evidence:

  > W-10: 'level="ERR" drop24h=NaN; (no water alerts)'. B-05: T2's critical row disappears; tile 'WATER TANKS OK 6 of 8 2 need a look'; heading 'T2 Windmill ERR%'; console 'Error: &lt;path> attribute d: Expected number, "...45.9,79.6L254.0,NaN".' W-09: 'critical | Tank T1 (North Flat) | Dropped 80 points in 24 hours, now %'. CSV-53: 'critical|Tank T1 (North Flat)|Dropped 1079 points in 24 hours, now -999%'. CSV-54: 'Dropped 40 points in 24 hours, now 100%' for a 140 spike. CSV-50/51/52: '(no alerts)'.

- How it was verified: confirmed (verify_water F1, verify_csv F4, verify_render F6). Evidence: W-10 'level="ERR" drop24h=NaN; (no water alerts)'; B-05 (T2's newest row set to ERR) removes T2's critical row, tile 'WATER TANKS OK 6 of 8 2 need a look', heading 'T2 Windmill ERR%'; W-09 'critical | Tank T1 (North Flat) | Dropped 80 points in 24 hours, now %'; CSV-53 'Dropped 1079 points in 24 hours, now -999%'. Corrections applied: regression test (c) was garbled; T2's last good reading is 14.8 at 2026-09-30T12:00 (data/water.csv line 240). An ERR on the 24-hour baseline row silently disables the leak rule (T4 becomes 'Down to 10% full'). The render skeptic showed any blank latest level gives a critical row because '' &lt; 25 is true ('Down to % full' with a prior level of 28). The CSV skeptic noted high rests on the silent all-clear cases; '-999' and '140' still make someone look. Registrar re-ran water.repro W-09/W-10 and csv.repro CSV-43/51 on 2026-10-16: same.

**Expected behaviour.** A reading that is not a finite number from 0 to 100 is not used as a level. The tank is flagged as a sensor or data problem (serious: 'last reading ERR is not a level; last good level 80% at Sep 29 18:00') and counted as needing a look. With T2's newest row set to ERR: a T2 row still appears ('last good level 14.8% at Sep 30 12:00') and the tile reads '5 of 8, 3 need a look'. A blank last level never produces 'now %' or 'Down to % full'.

**Operational consequence.** Fault codes and blanks are common in tank-sensor exports. A fault code on the newest row turns the most urgent tank (T2 at 11.8%) into an all-clear, so nobody goes and cattle can run out of water. A blank or out-of-range last row raises a false critical leak with garbled text and sends a crew to haul water to a full tank.

**Proposed regression test.** (a) Water rows 'T1,P1,2026-09-29T18:00,80' and 'T1,P1,2026-09-30T18:00,ERR': exactly one Water row for T1, severity serious, problem containing 'ERR' and '80%'. (b) The same with a blank level: the same serious row and no problem matching /Dropped|now %\$|Down to % full/. (c) Committed data with T2's 2026-09-30T18:00 row set to ERR: a T2 Water row exists and names 'last good level 14.8%' (T2's 2026-09-30T12:00 value, line 240 of data/water.csv). (d) -999 and 140: no 'Dropped' row; a sensor-problem row instead.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): T2 last level = `11.8`; T2 level at 2026-09-30T12:00 = `14.8`.

**Proposed fix (recommendation).** In the data contract, accept level_pct only as a finite number from 0 to 100 (optionally strip a trailing '%', stated in the contract). In waterStatus take level, drop and last-good time from valid rows only. If the newest row is invalid, mark the tank 'unknown' with the bad value and time, emit a serious 'Last reading &lt;v> at &lt;time> is not a level; last good level &lt;L>% at &lt;t>', and count it as needing a look. The chart skips invalid points and says 'bad reading' in the heading.

**Files affected.** `exceptions.js` (level validation in the contract and `waterStatus`); `app.js` (tile, heading, chart); `tests/exceptions.test.mjs`.

**Related findings.** [CSV-04](#csv-04), [WAT-10](#wat-10), [UI-04](#ui-04)

<a id="wat-02"></a>
#### WAT-02: There is no tanks master list: a tank with no readings in the export, or an empty water file, disappears and the page reports water as fine

Severity **high** · Status **design-limitation** · Phase 1 (Fix now) · Effort **M** · Area: Water

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Scope note.** Ownership: LOAD-01 owns the file-level check (a missing or header-only water.csv shows CAN'T TELL); this entry owns per-tank visibility from a tanks master list, including a tank absent from an otherwise good export.

**Problem.** The tank list is built only from `water.csv` rows. A tank with no rows in the export does not exist for the page, so the silent-sensor rule cannot see it. The generator defines `TANKS` (`scripts/generate_data.py:39`) but never writes a tanks file.

**Where in the code.** exceptions.js:39-52 (the tank list is built from water rows only); app.js:46, :55, :78 (tile and charts); scripts/generate_data.py:39 (TANKS defined, never written)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.repro.mjs` (CASE W-08, B-02: every T6 row removed); `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-29, CSV-30); `node docs/audit/diagnostics/csv.browser.mjs` (CASE B-05: water.csv header only).
- Actual output, quoted from the evidence:

  > W-08: 'tanks=7; critical | Tank T2 (Windmill) | Down to 11.8% full || critical | Tank T4 (Lone Tree, Heifers here now) | Dropped 46 points in 24 hours, now 10%'. B-02: tile 'WATER TANKS OK 5 of 7 2 need a look', 7 charts. B-05: tile 'WATER TANKS OK / 0 of 0 / 0 need a look', chips 'Water (0)'.

- How it was verified: design-limitation (verify_water F2, verify_csv F11). Evidence: W-08 (every T6 row removed) gives 'tanks=7' and only the T2 and T4 rows; B-02 tile 'WATER TANKS OK 5 of 7 2 need a look', 7 charts, no T6 anywhere; CSV-29 '(no alerts)'; B-05 (header-only water.csv) tile 'WATER TANKS OK / 0 of 0 / 0 need a look' and 'Water (0)'. scripts/generate_data.py:39 defines TANKS but main() never writes a tanks file. The water skeptic said high is defensible on consequence (a confident all-clear on water) and that likelihood depends on the export shape: a full-period export loses a tank only if it never reported; a rolling-window export or a sensor replaced under a new device ID makes it likely ('consider medium-high'). The registry keeps high because the result is a false all-clear on the most time-critical area. The empty-file case is also listed under LOAD-01.

**Expected behaviour.** 8 tanks, from a tanks master file (tanks.csv). T6 (Cedar Draw) flagged serious 'no readings in this export'; tile 'Water tanks OK 5 of 8, 3 need a look'. A header-only water.csv gives a 'no water readings loaded' state (CAN'T TELL) for all 8 tanks, never '0 of 0'. A tank_id in water.csv that is not in tanks.csv is a data issue.

**Operational consequence.** The silent-sensor rule only works while the dead sensor's old rows are still in the file. With a rolling export, a replaced sensor or a gateway that exports nothing, a tank nobody is watching vanishes and the page shows a confident all-clear on water.

**Proposed regression test.** With a data/tanks.csv listing T1-T8 and their pastures, and every T6 row removed from water.csv: waterStatus returns 8 tanks; one serious T6 Water row whose problem contains 'No readings'; the tile reads '5 of 8' and '3 need a look'. Header-only water.csv: 8 CAN'T TELL tanks, no '0 of 0'. A tank_id T9 in water.csv but not in tanks.csv: one data issue row naming T9.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): tank count in water.csv = `8`.

**Proposed fix (recommendation).** Have generate_data.py write data/tanks.csv (tank_id, pasture_id; capacity_gal can come later for WAT-06). waterStatus iterates the master list and left-joins readings; a tank with no readings gets state 'no data' and a serious alert. Load tanks.csv in app.js and the tests and document it in the README. Treat tanks.csv as the master for the tile count.

**Files affected.** `data/tanks.csv` (new) via `scripts/generate_data.py` (data files are generated; CI checks they match); `exceptions.js` (`waterStatus` iterates the master list); `app.js` (load tanks.csv; tile count); `README.md`; `tests/exceptions.test.mjs` (load tanks.csv).

**Related findings.** [LOAD-01](#load-01), [DATA-01](#data-01), [WAT-04](#wat-04)

<a id="gain-01"></a>
#### GAIN-01: An animal with only one weigh-in crashes the rules and the page shows no alerts at all

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Gain

**Problem.** `gainStatus` takes each animal's last two weigh-ins with `rows.slice(-2)` and reads the second one's date. An animal with one weigh-in has no second row, so the code throws inside `findExceptions` and the page draws no alerts.

**Where in the code.** exceptions.js:69-70 (const [a, b] = rows.slice(-2); ... b.date); app.js:222 (findExceptions at module top level)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-01: committed weights plus 'Y151,Yearlings,2026-09-15,820'; GN-02: plus 'C017,Cows,2026-09-15,1310'; GB-01 in Chromium); `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-17); `node docs/audit/diagnostics/csv.browser.mjs` (CASE B-02).
- Actual output, quoted from the evidence:

  > GN-01/GN-02: "threw TypeError: Cannot read properties of undefined (reading 'date')". GB-01: 'pageerrors=["Cannot read properties of undefined (reading 'date')"]; asof=""; tiles=0; exception rows=0; gain chart=false'.

- How it was verified: confirmed (verify_gain F0, verify_csv F2). Evidence: GN-01/GN-02 "threw TypeError: Cannot read properties of undefined (reading 'date')"; GB-01 'pageerrors=["Cannot read properties of undefined (reading 'date')"]; asof=""; tiles=0; exception rows=0; gain chart=false'; CSV-17 and csv.browser B-02 the same. Corrections applied: 'the most common kind of real weigh-in file' overstates it ('common in a cumulative weigh-in file: purchases, replacements'); the CSV skeptic noted the trigger is broader, since between the first and second weigh-in of a season every animal has one row, so the page is unusable until a second weigh-in exists. Registrar re-ran gain.repro GN-01/GN-02/GB-01 and csv.repro CSV-17 on 2026-10-16: same.

**Expected behaviour.** No throw; all 10 committed alerts returned. Y151 is left out of the gain figures and listed as 'first weigh-in, no gain yet'. Yearlings ADG stays 16608/8550 = 1.94246 (Jul 20 to Sep 15, by hand).

**Operational consequence.** One newly bought or replacement animal weighed once, or any season before its second weigh-in, wipes the whole dashboard: the leaking tank, the overdue booster and the budget overrun all disappear with no message.

**Proposed regression test.** Committed data plus {tag:'Y151', group:'Yearlings', date:'2026-09-15', weight_lbs:820}: findExceptions does not throw and returns 10 rows; Yearlings adg is about 1.94246 (16608/8550); Y151 appears in a 'not yet re-weighed' list. CSV-17 fixture: Y1 and Y2 at 700 then 820 give head 2 and adg 2.105 (120/57).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Yearlings pooled gain lbs / animal-days = `(16608, 8550)`; Yearlings ADG = `1.94246`; GAIN-01 CSV-17 120/57 = `2.1053`.

**Proposed fix (recommendation).** In gainStatus, skip animals with fewer than two usable weigh-ins and return them as a 'not yet re-weighed' count shown in the gain coverage line (GAIN-07). Section isolation (LOAD-02) keeps any other failure local.

**Files affected.** `exceptions.js` (`gainStatus`); `tests/exceptions.test.mjs`.

**Related findings.** [LOAD-02](#load-02), [GAIN-03](#gain-03), [GAIN-07](#gain-07)

<a id="gain-02"></a>
#### GAIN-02: A same-day duplicate weigh-in (scale re-check or EID double read) gives +-Infinity or NaN gain: the group alert is lost or garbled and the page can hang

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Gain

**Problem.** Two weigh-ins for one animal on one day give a 0-day interval, so the per-animal gain divides by zero (plus or minus Infinity, or NaN). The group mean absorbs it, and the gain chart's gridline loop (`app.js:156`) never ends for minus Infinity.

**Where in the code.** exceptions.js:36 and :70 (division by days(a.date, b.date) = 0), :77 (mean absorbs NaN or Infinity); app.js:152-158 (axis from Math.min/Math.max of the ADGs; gridline loop with no bound at :156)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-04 'H001,Heifers,2026-09-15,1180', GN-05 1169, GN-06 1160; GB-04, GB-07, GB-08 in Chromium); `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-32); `python3 -m http.server 8931 --bind 127.0.0.1 --directory . &` then `node docs/audit/diagnostics/gain.verify.browser.mjs http://127.0.0.1:8931/ dupMinus`.
- Actual output, quoted from the evidence:

  > GN-04: 'Heifers adg=Infinity ... warning | 32 heifers | Under 0.5 lbs/day: H002, ...'. GN-05: 'Heifers adg=NaN', the same downgrade. GN-06: 'serious | Heifers | -Infinity lbs/day since 2026-09-15 vs 1.0 target'. GB-04: 'dots=195 (NaN cx: 195) gridlines=0 labels=["avg NaN",...]'. GB-07/GB-08: 'PAGE HUNG: main thread did not answer page.evaluate within 2.5 s; screenshot timed out (nothing painted)'. CSV-32 (3-head fixture): '(no alerts)'.

- How it was verified: confirmed (verify_gain F1, verify_csv F12). Evidence: GN-04 (+Inf) 'Heifers adg=Infinity ... warning | 32 heifers | Under 0.5 lbs/day' (the serious row is gone); GN-06 'serious | Heifers | -Infinity lbs/day since 2026-09-15 vs 1.0 target'; GB-07/GB-08 'PAGE HUNG: main thread did not answer page.evaluate within 2.5 s'. The gain skeptic proved the gridline loop at app.js:156 never terminates for -Infinity (and stalls near 2^52 for +Infinity). The CSV skeptic noted that on the committed data the serious heifer alert is downgraded to a 32-heifer warning, not erased, and suggested medium; the registry keeps high because the hang blanks the page. The '270 MB in 3 s' memory figure was not re-verified by the skeptic; the registrar's 2026-10-16 run of gain.verify.browser.mjs dupMinus printed 'main thread: NO ANSWER in 3 s; renderer RSS kB before/after the 3 s wait: 181780 -> 343232'. That the tab would eventually crash is an inference.

**Expected behaviour.** The duplicate is collapsed and reported as a data issue. Heifers stay 'serious ... 0.44 lbs/day' (keeping the first reading 1119/2565 = 0.4363; keeping the later one 1130/2565 = 0.4405). No Infinity or NaN anywhere; the page renders within a few seconds with 7 gain gridlines.

**Operational consequence.** A routine scale re-check silently downgrades a group-wide gain problem to a long animal list, or prints '-Infinity lbs/day'. In the +-Infinity cases the tab freezes before anything paints, so the manager sees a blank, unresponsive page with no alerts.

**Proposed regression test.** Committed data plus {H001, Heifers, 2026-09-15, 1180}: every animal's adg is finite; a serious Heifers row whose problem starts '0.44'; a data issue naming H001 2026-09-15. Browser: '#rules tr' present within 2 s and the gain chart has 7 gridlines. CSV-32 fixture: exactly one serious Heifers row '0.70 lbs/day' (40/57).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Heifers pooled gain lbs / animal-days = `(1119, 2565)`; Heifers ADG = `0.4363`; DATA-01 CSV-28 40/57 = `0.7018`; GAIN-02 later reading 1130/2565 = `0.4405`.

**Proposed fix (recommendation).** Detect (tag, date) duplicates in the data contract (DATA-03) and keep one reading with a visible data issue. Never divide by a zero interval (GAIN-03's minimum interval). Drop non-finite values before averaging. In gainStrip, build the axis from finite values only and bound the gridline loop.

**Files affected.** `exceptions.js` (duplicate check, finite values only); `app.js` (`gainStrip` axis and bounded loop); `tests/exceptions.test.mjs`; browser test (new; the repository has none yet).

**Related findings.** [DATA-03](#data-03), [GAIN-03](#gain-03), [GAIN-04](#gain-04)

<a id="hlth-01"></a>
#### HLTH-01: A health task is shown only when its status is exactly 'open': 'Open', 'OPEN' or an unlisted status such as 'in progress' silently drops an overdue vaccination

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Health

**Scope note.** Case variants ('Open', 'OPEN') are confirmed defects; unlisted statuses such as 'in progress', 'scheduled' and 'overdue' are a design limitation fixed by the same status list. Whitespace around the value ('open ', ' open') is the reader's missing trim, owned by CSV-05; this entry's end-to-end test still checks those spellings.

**Problem.** The health rule shows a task only if its status is exactly the string 'open'. Any other spelling, or an unlisted status such as 'in progress', is skipped with no message.

**Where in the code.** exceptions.js:141 (if (h.status !== "open" || !h.next_due) continue)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE H-01a 'Open', H-01b 'OPEN', H-01c 'open ', H-02a 'in progress', H-02b 'scheduled', H-02c 'overdue'); `node docs/audit/diagnostics/healthbudget.skeptic.mjs` (section F1); `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-57). Minimal input: health row 'Yearlings,Booster vaccine,2026-06-02,2026-09-15,Open' followed by another row, as_of 2026-09-30T18:00.
- Actual output, quoted from the evidence:

  > H-01a 'Open': '(no alerts)'. H-01b 'OPEN': '(no alerts)'. H-01c 'open ': '(no alerts)'. H-02a 'in progress', H-02b 'scheduled', H-02c 'overdue': '(no alerts)' each.

- How it was verified: confirmed (verify_healthbudget F0; the case part also in verify_csv F7). Evidence: H-01a/b/c and H-02a/b/c all '(no alerts)'; healthbudget.skeptic.mjs 'F1 "Open": (none)', 'F1 "open ": (none)', 'F1 " open": (none)'. Corrections applied: high is fair for the case and whitespace variants (one capitalised status column empties the whole Health area with no message); 'in progress', 'scheduled' and 'overdue' are a different problem (the data model never lists allowed statuses), treated as a design limitation fixed by the same contract; a leading space also drops the row; capitalised 'Done' is skipped too, which happens to be correct. Registrar re-ran healthbudget.verify F1 on 2026-10-16: open / Open / OPEN / 'open ' / in progress matched. The CSV skeptic's 'Open' evidence (verify_csv F7: committed health.csv with ',Open' gives '8 alerts (base 10)' and loses the booster and pinkeye rows; csv.repro CSV-57 '(no alerts)', re-run by the critic on 2026-10-16) is registered here.

**Expected behaviour.** 'serious | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15)' (Sep 15 to Sep 30 = 15 calendar days) for every spelling of open. A status outside the documented list gives a data issue ('status "in progress" not recognised; treated as open').

**Operational consequence.** A booster 15 days overdue vanishes from the report, the Health chip and the 'Needs attention' tile because someone typed 'Open' or marked it 'in progress'. Health has no other view on the page, so the manager gets a false all-clear on herd health tasks.

**Proposed regression test.** For s in ['Open','OPEN','open ',' open']: rows `Yearlings,Booster vaccine,2026-06-02,2026-09-15,${s}` plus `Yearlings,Deworm,2026-06-02,2026-11-01,open` give exactly [['serious','Overdue by 15 days (due 2026-09-15)']]. For 'in progress' and 'scheduled': a Health row whose subject is 'Yearlings: Booster vaccine' plus a data issue for the status. 'done' and 'cancelled': no row.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): booster days overdue on the as-of date = `15`.

**Proposed fix (recommendation).** Normalise status (trim, lower case) in the data contract; document the accepted list (open, done, cancelled); treat an unknown status as open and add a visible data issue naming it.

**Files affected.** `exceptions.js` (status normalisation and list); `README.md` (accepted statuses); `tests/exceptions.test.mjs`.

**Related findings.** [CSV-05](#csv-05), [HLTH-02](#hlth-02)

<a id="bud-01"></a>
#### BUD-01: Budget 'season to date' ignores the month column and as_of: future plan rows hide both real overspends, a blank or lagging month changes the total, and a mid-month as_of compares part of a month with a full month's budget

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Budget

**Scope note.** The future-rows and ignored-as_of parts are confirmed defects; the mid-month comparison (verify_time F14) is a design limitation resolved by the closed-months policy.

**Problem.** `budgetStatus` sums every row in `budget.csv` per category and never reads the month column or as_of. Future plan rows, a month whose bookkeeping lags, and a mid-month as_of all change 'season to date'.

**Where in the code.** exceptions.js:82-89 (budgetStatus never reads r.month or as_of), :149-156; app.js:49, :57 (tile totals); README.md:28

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE BU-06 and AB-07: committed data plus '2026-10,&lt;cat>,&lt;plan>,0' and '2026-11,&lt;cat>,&lt;plan>,0' for all 6 categories; BU-04 and AB-08: Sep Fuel actual blank; BU-07: Sep Fuel row deleted); `node docs/audit/diagnostics/time.repro.mjs` (CASE TIME-14, TIME-15, TIME-D1); `node docs/audit/diagnostics/time.browser.mjs` (CASE TB-06, TB-07).
- Actual output, quoted from the evidence:

  > BU-06: 'Fuel 11640/14400 = -19.2%; Repairs 9000/10800 = -16.7%; (no alerts)'. AB-07 tile: 'SPEND VS BUDGET −32.7% \$89,303 of \$132,600, season to date', no budget rows in the report. BU-04: 'Fuel actual="8640" (string) pct=-0.1' and the Fuel alert is gone. BU-07: 'serious | Fuel | 20% over season to date (\$1,440)' with no mention that September is missing. TIME-D1: 'warning: Fuel: 6% over season to date'.

- How it was verified: confirmed (verify_healthbudget F1, verify_time F2), design-limitation (verify_time F14). Evidence: BU-06 / TIME-14 'Fuel 11640/14400 = -19.2%; Repairs 9000/10800 = -16.7%; (no alerts)'; AB-07 / TB-06 tile 'SPEND VS BUDGET −32.7% \$89,303 of \$132,600'; the skeptic added that as_of is also ignored (as_of 2026-07-31 still gives 'Fuel 21% over season to date (\$2,040)'); TIME-D1 (as_of Sep 15, half-month actual) 'warning: Fuel: 6% over season to date'. Corrections applied: 'the normal way to load a budget' overstates it a little; high stands because a full-season plan with future actuals at 0 is a common shape and the result is a silent all-clear; the blank Sep Fuel case belongs here (blank counted as 0), not to the string bug (BUD-02). The time skeptic showed the fix needs a season start bound (2025 rows at 95% of budget are kept by a 'month &lt;= as_of month' filter) and month normalisation ('2026-09-01' &lt;= '2026-09' is false); front-loaded costs make pro-rating risky, so closed months only is the safer default. Registrar re-ran BU-06, AB-07 and TIME-14 on 2026-10-16: same.

**Expected behaviour.** One as-of policy: budget counts closed months from the season start through the last month that closed on or before as_of, and the tile names those months. On the committed data (as_of Sep 30, so Jun-Sep closed): Fuel serious '21% over season to date (\$2,040)' (11,640 vs 9,600) and Repairs serious '25% over (\$1,800)' (9,000 vs 7,200); tile '+1.0% \$89,303 of \$88,400'. Future rows change nothing. A blank or missing month for a category is reported as a data issue ('Fuel: 2026-09 actual not entered'), never counted as 0.

**Operational consequence.** Loading the season's whole plan up front makes both real overspends disappear and tells the manager spending is 32.7% under budget. Bookkeeping that lags a month does the same for that category, and a mid-month review understates overspend.

**Proposed regression test.** Committed budget.csv plus Oct and Nov rows (budget = monthly plan, actual 0): Budget rows deep-equal [['serious','Fuel','21% over season to date (\$2,040)'], ['serious','Repairs','25% over season to date (\$1,800)']]; tile '+1.0%' and '\$89,303 of \$88,400'. Hand sums: Fuel 2592 + 2928 + 3120 + 3000 = 11,640 vs 4 x 2,400 = 9,600; Repairs 9,000 vs 7,200; totals 89,303 vs 4 x 22,100 = 88,400. 2025 rows appended: no change. Months written '2026-09-01': September still counted. Sep Fuel actual blank: a data issue naming 2026-09 and Fuel. TIME-D1 (as_of 2026-09-15): Jun-Aug only, Fuel 8,640 vs 7,200 = 20% over, serious. These values assume a month closes on its last calendar day (see proposed_fix).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): months in budget.csv = `['2026-06', '2026-07', '2026-08', '2026-09']`; Fuel budget, actual, over \$, over % = `(9600, 11640, 2040, 21.25)`; Repairs budget, actual, over \$, over % = `(7200, 9000, 1800, 25.0)`; season totals and tile percent = `(88400, 89303, 1.0)`; Jun-Aug only: Fuel and Repairs over % and \$ (BUD-01 alternative) = `(('Fuel', 20.0, 1440), ('Repairs', 13.3, 720))`.

**Proposed fix (recommendation).** Add a season start to meta.csv; normalise month to YYYY-MM in the data contract; pass as_of into budgetStatus and count only closed months in [season start, last month closed on or before as_of]; treat a blank actual as 'not entered' (data issue) and check each category has every month in range. Show the months covered in the tile and rules copy. A month counts as closed when the ranch-zone as-of date is on or after its last day, so as_of 2026-09-30T18:00 closes September (an assumption, listed in unresolved_assumptions). If the ranch prefers 'closed once the last day has ended', September drops out on Sep 30 and the committed rows read Fuel 20.0% over (\$1,440: 8,640 vs 7,200) and Repairs 13.3% over (\$720: 6,120 vs 5,400), both still serious.

**Files affected.** `data/meta.csv` (season start) via `scripts/generate_data.py` (data files are generated; CI checks they match); `exceptions.js` (`budgetStatus`: month, as_of, closed months); `app.js` (tile, rules copy); `README.md` (line 28); `tests/exceptions.test.mjs`.

**Related findings.** [TIME-01](#time-01), [BUD-02](#bud-02), [CSV-04](#csv-04)

<a id="bud-02"></a>
#### BUD-02: Budget amounts are not read as money: a blank, '(300)' or '\$3000' cell turns totals into joined text, erases real overspend alerts and puts \$884,000, e+22% or NaN on the headline tile

Severity **high** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Budget

**Problem.** Budget and actual cells go through the generic reader, so blanks, '(300)' and '\$3000' stay text and are joined by `+=` instead of added.

**Where in the code.** exceptions.js:30 (non-numeric cells stay strings), :86 (c.budget += r.budget; c.actual += r.actual); app.js:49 (tile reduce), :57

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE BU-03, AB-03: '2026-09,Hay,,500'; BU-05, AB-10: '2026-09,Repairs,0,(300)'; AB-08: '2026-09,Fuel,2400,'); `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-44, CSV-45); `node docs/audit/diagnostics/csv.browser.mjs` (CASE B-07).
- Actual output, quoted from the evidence:

  > BU-03: 'budget="0" (string)'. AB-03 tile: 'SPEND VS BUDGET −89.8% \$89,803 of \$884,000, season to date'. AB-08 tile: 'SPEND VS BUDGET +2.715256118778953e+22% \$24,002,864,090,005,946,000,000,000 of \$88,400'. BU-05: 'Repairs actual="9000(300)" pct=NaN'. AB-10 tile: 'SPEND VS BUDGET −NaN% \$NaN of \$88,400', Repairs bar label '−NaN%'.

- How it was verified: confirmed (verify_healthbudget F2; the joining-as-text part also in verify_csv F3 and verify_time F2). Evidence: AB-03 (committed data plus '2026-09,Hay,,500') tile 'SPEND VS BUDGET −89.8% \$89,803 of \$884,000'; BU-05 ('2026-09,Repairs,0,(300)') 'Repairs actual="9000(300)" pct=NaN' and the Repairs alert is gone; AB-10 tile '−NaN% \$NaN of \$88,400'. The skeptic added: a blank first-month cell creates a huge false alarm ('serious | Budget | Fuel | 3050324931% over season to date (\$292,831,193,400)'), and '\$3000' gives 'Fuel actual="8640\$3000"' and the Fuel alert disappears; the blank Sep Fuel lost alert belongs to BUD-01. Registrar re-ran AB-01..AB-10 and csv.repro CSV-45 on 2026-10-16: same (CSV-45 '2700324931% ...').

**Expected behaviour.** Amounts are parsed by a strict money parser: '' means not entered (data issue, never added), '(300)' is -300, '\$3,000' is 3000, anything else is a data issue. AB-03 tile: '+1.6% \$89,803 of \$88,400' (89,303 + 500; 1,403/88,400 = 1.59%). BU-05: Repairs serious, 8,700 vs 7,200 = 20.8% over (\$1,500).

**Operational consequence.** One blank cell or one refund typed the accountant's way erases a real serious overspend, or invents a 3-billion-percent overrun, and the headline tile shows nonsense or, worse, a believable '−89.8%' that reads as well under budget.

**Proposed regression test.** budgetStatus(parseCSV(committed + '\\n2026-09,Hay,,500')): every budget and actual is a Number; totals 88,400 and 89,803. Committed + '2026-09,Repairs,0,(300)': a Repairs serious row containing '21% over' and '\$1,500' (9,000 - 300 = 8,700; 1,500/7,200 = 20.8%). Browser AB-03: tile contains '+1.6%' and '\$89,803 of \$88,400'. Blank Jun Fuel actual: a data issue, no '%' figure above 1000.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): season totals and tile percent = `(88400, 89303, 1.0)`; BUD-02 1,500 / 7,200 = `20.8333`; BUD-02 1,403 / 88,400 = `1.5871`.

**Proposed fix (recommendation).** Money columns in the data contract use a strict parser (accounting parentheses, '\$' and thousands separators accepted and stated; blank = not entered; anything else a data issue). budgetStatus adds only finite Numbers, and the tile uses the same totals.

**Files affected.** `exceptions.js` (money parser); `app.js` (tile uses the same totals); `tests/exceptions.test.mjs`; browser test (new; the repository has none yet).

**Related findings.** [BUD-01](#bud-01), [BUD-03](#bud-03), [CSV-04](#csv-04)

---

### 2.2 Medium severity (19)

<a id="load-04"></a>
#### LOAD-04: A tank with no reading in the last 7 days crashes the water charts and every section drawn after them

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Data loading

**Problem.** The water charts take the last row inside a 7-day window (`app.js:90-93`) without checking that the window holds any rows, and a `reduce` has no initial value (`app.js:103`). A tank silent for more than 7 days throws, and every chart and table drawn after the water charts is lost.

**Where in the code.** app.js:90-93 (rows filtered to the 7-day window, then rows[rows.length-1].time), app.js:103 (reduce with no initial value), app.js:225 (no isolation between sections)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.repro.mjs` (CASE B-01: every T6 row after 2026-09-22T12:00 removed); `node docs/audit/diagnostics/time.browser.mjs` (CASE TB-02); `node docs/audit/diagnostics/csv.browser.mjs` (CASE B-04); `node docs/audit/diagnostics/render.repro.mjs` (CASE R13).
- Actual output, quoted from the evidence:

  > B-01: page errors=["Cannot read properties of undefined (reading 'time')"]; water charts=0; grazing svg=false; gain svg=false; budget svg=false; rules rows=0. The table, drawn earlier, still shows 'Serious Water Tank T6 (Cedar Draw) No reading for 198 hours; last level 100%'.

- How it was verified: confirmed by four skeptics (verify_water F0, verify_csv F10, verify_time F8, verify_render F4). The water auditor graded high; the water skeptic said the operational impact is closer to medium because every alert is still listed; the CSV, time and render audits graded medium. Registry: medium, because the alert table survives, so the crash neither hides an alert nor blanks the page. Precise trigger: the tank's newest reading is strictly older than as_of minus 168 h (a reading exactly 168 h old renders, since app.js:90 uses >=). Registrar re-ran water.repro B-01 on 2026-10-16: same page error and section counts.

**Expected behaviour.** No page error; 8 water charts with T6 marked 'no readings in the last 7 days'; grazing, gain and budget charts drawn; budget table 7 rows (header + 6 categories); rules table 12 rows (header + 11 rules); the T6 row reads 'No reading for 198 hours' (Sep 22 12:00 to Sep 30 18:00 = 8 x 24 + 6 = 198 h).

**Operational consequence.** The longer a sensor stays dead, the more of the page breaks. The alert row survives, but the manager loses the water charts, the grazing rotation, the gain plot, the budget chart and table, and the rules table that explain the alerts.

**Proposed regression test.** Playwright with the committed CSVs and T6 rows filtered to time &lt;= '2026-09-22T12:00': no pageerror; 8 '#water .mini' boxes; the T6 heading ends with 'no signal'; #grazing svg, #gain svg and #budgetChart svg exist; #budgetTable has 7 rows; #rules has 12 tr. Render R13 data (T2's last reading 2026-09-21T12:00): 'No reading for 222 hours' (9 d 6 h by hand).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): tank count in water.csv = `8`; LOAD-04 Sep 22 12:00 to Sep 30 18:00, h = `198`; LOAD-04 R13 9 d 6 h = `222`.

**Proposed fix (recommendation).** In waterMultiples, when the window has no rows, draw the axes and a full-width 'no reading since &lt;date>' wash, skip the path, dot and hover handler, and guard the reduce. Section isolation from LOAD-02 keeps any other failure local.

**Files affected.** `app.js` (`waterMultiples`); browser test (new; the repository has none yet).

**Related findings.** [LOAD-02](#load-02), [WAT-05](#wat-05), [UI-15](#ui-15)

<a id="data-03"></a>
#### DATA-03: Duplicate and contradictory records are not detected: re-exported budget rows, a pasture listed twice, repeated health tasks or groups double or distort alerts

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Data contract

**Problem.** No file has a uniqueness check. Re-exported or pasted-twice rows are all counted: budget sums double, health tasks repeat, and a pasture listed twice is judged against whichever plan comes last.

**Where in the code.** exceptions.js:55 (the last duplicate pasture wins), :84-87 (budget rows summed blindly), :97, :140-147 (each health row judged), :56 (several open moves per group allowed)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-33..CSV-37). Minimal input: the committed budget.csv with its data rows appended a second time.
- Actual output, quoted from the evidence:

  > CSV-33: 'warning|Fuel|7% over season to date'. CSV-34 (pasture listed twice): '(no alerts)'. CSV-35: two identical 'serious|Yearlings: Booster vaccine|Overdue by 15 days' rows. CSV-36: two identical Heifers rows. Doubled budget: 'serious|Budget|Fuel|21% over season to date (\$4,080)' and Repairs '\$3,600'.

- How it was verified: confirmed (verify_csv F13). Evidence: CSV-33 'warning|Fuel|7% over season to date' where the de-duplicated figures (9,600 and 10,000) give 4.2%, under the 5% demo warning line; the committed budget.csv appended to itself gives 'NEW serious|Budget|Fuel|21% over season to date (\$4,080)' and Repairs '\$3,600'; CSV-35 prints the booster row twice. Related duplicate cases with their own entries: two open moves for one group (GRZ-02), two readings at one timestamp (WAT-07), a same-day weigh-in (GAIN-02).

**Expected behaviour.** Duplicate keys are detected and shown as data issue rows; exact duplicates are dropped and counted. CSV-33: no alerts, or one duplicate data issue. CSV-35 and CSV-36: one alert each. Doubled budget: Fuel still '\$2,040', not '\$4,080'.

**Operational consequence.** A re-export or a block pasted twice creates false budget warnings and doubles dollar figures; repeated health rows inflate the 'Needs attention' count; a pasture listed twice is judged against whichever plan comes last.

**Proposed regression test.** CSV-33 fixture: no alerts, or one duplicate data issue. Committed budget.csv appended to itself: Fuel '21% over season to date (\$2,040)' (11,640 - 9,600) plus a duplicate note. CSV-35 fixture: exactly one booster row.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Fuel budget, actual, over \$, over % = `(9600, 11640, 2040, 21.25)`.

**Proposed fix (recommendation).** Key uniqueness per file in the data contract: pasture_id, group, tank_id, (month, category), (group, task, next_due), (tank_id, time), (tag, date), and at most one open move per group. Exact duplicates are dropped and counted; conflicting duplicates become data issue rows.

**Files affected.** `exceptions.js` (key uniqueness per file); `tests/exceptions.test.mjs`.

**Related findings.** [GRZ-02](#grz-02), [WAT-07](#wat-07), [GAIN-02](#gain-02)

<a id="time-01"></a>
#### TIME-01: Rows dated after as_of are used as current: a later reading hides a silent sensor, a back-dated report shows problems that had not happened yet, and later weigh-ins change the gain period

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Time and as-of

**Problem.** The water, gain and budget rules use every row in the file, including rows dated after `meta.as_of`. A later row changes the 'latest' tank reading (silent hours go negative), the gain period and the budget totals, in a report that says it is as of an earlier time.

**Where in the code.** exceptions.js:43-48 (water: last row with no cutoff; silentHours can be negative), :64-70 (gainStatus takes no asOf), :82-89 (budget, see BUD-01), :56 (grazing, see GRZ-01); app.js:76 and :90-93 (a later point is drawn past the plot edge)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/time.repro.mjs` (CASE TIME-11, TIME-12, TIME-13); `node docs/audit/diagnostics/time.verify.mjs` (CASE F4+: as_of 2026-09-15T18:00); `node docs/audit/diagnostics/water.repro.mjs` (CASE W-06, W-07, B-04); `node docs/audit/diagnostics/water.verify.mjs` (CASE V-W06); `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-12). Minimal input: the committed data plus 'T6,P6,2026-10-29T00:00,95'.
- Actual output, quoted from the evidence:

  > W-07: 'T6 silentHours=-678; critical | Tank T2 (Windmill) | Down to 11.8% full || critical | Tank T4 (Lone Tree, Heifers here now) | Dropped 46 points in 24 hours, now 10%' (T6 gone). W-06: 'silentHours=-48; (no water alerts)'. B-04: the last-point dot at cx=319.14, past the plot edge at 254. F4+: 'critical: Tank T2 (Windmill): Down to 11.8% full / critical: Tank T4 (Lone Tree, Heifers here now): Dropped 46 points in 24 hours, now 10%' with T2/T4 silentHours = -360. GN-12: 'Heifers from=2026-09-15 to=2026-10-15  ||  serious | Heifers | 0.45 lbs/day since 2026-09-15 vs 1.0 target'.

- How it was verified: confirmed (verify_time F3, verify_water F6, verify_gain F15). Evidence: W-07 'T6 silentHours=-678' and T6's serious row disappears; TIME-11 'T6 silentHours=-6; (no T6 alert)'; GN-12 'serious | Heifers | 0.45 lbs/day since 2026-09-15'. Corrections applied: TIME-11 does not make a dead sensor read as fresh (T6 really reported again); the defect is an inconsistent report under a Sep 30 header. The stronger repro is a back-dated as_of: the committed data with as_of 2026-09-15T18:00 shows the T2 and T4 critical alerts that only happened Sep 26-30 and 'Heifers here now' at Lone Tree before they arrived (time.verify F4+). A stale meta.csv (as_of 2026-09-28T18:00) also hides T6 (water.verify V-W06). Registrar re-ran TIME-11, W-06, W-07 and GN-12 on 2026-10-16: same.

**Expected behaviour.** One as-of policy: every rule sees only rows dated at or before as_of; later rows are left out and listed in a data issue ('1 water reading dated after the as-of time'). W-07: T6 still serious 'No reading for 42 hours; last level 98.5%' (Sep 29 00:00 to Sep 30 18:00 = 42 h). GN-12: '0.44 lbs/day since 2026-07-20'. As of 2026-09-15T18:00 the committed data gives no water alerts (T2's fall starts Sep 26, the T4 leak Sep 29).

**Operational consequence.** If meta.csv lags the exports, or a reading is typed with the wrong month, the report mixes times: a tank nobody has seen for nearly two days drops off the list, a back-dated review shows emergencies that had not happened yet, and the gain alert names the wrong period.

**Proposed regression test.** W-07 data: a serious T6 row 'No reading for 42 hours; last level 98.5%' plus a data issue naming '2026-10-29'. W-06 data: silentHours >= 0 for every tank. Committed data with as_of 2026-09-15T18:00: no Water rows. GN-12 data: Heifers '0.44 lbs/day since 2026-07-20' plus a note of 1 weigh-in after as_of.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): T6 last reading time and level = `('2026-09-29T00:00', 98.5)`; T6 hours silent at as_of = `42.0`.

**Proposed fix (recommendation).** Apply one as_of cutoff before any rule: water time &lt;= as_of; weigh date &lt;= the as-of date; budget months closed on or before as_of (BUD-01); the current grazing stay judged from as_of (GRZ-01). Rows after as_of are left out and reported as a data issue. Clamp chart x positions to the plot.

**Files affected.** `exceptions.js` (one as-of cutoff); `app.js` (clamp chart x positions); `tests/exceptions.test.mjs`.

**Related findings.** [GRZ-01](#grz-01), [BUD-01](#bud-01), [LOAD-05](#load-05)

<a id="time-02"></a>
#### TIME-02: No time-zone contract: a date-only as_of, UTC-stamped readings and daylight-saving days make silent hours, the 24-hour drop and the header depend on the viewer's zone

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Time and as-of

**Problem.** Timestamps are parsed with `new Date()` in the viewer's local zone, and `meta.csv` carries no zone. The same files give different silent-sensor hours, 24-hour drops and header times depending on the viewer's computer, and on daylight-saving days.

**Where in the code.** exceptions.js:36, :45, :48 (elapsed time from local-time parsing); app.js:223 (header in the viewer's zone, no zone shown); app.js:73 (water window)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/time.repro.mjs` (CASE TIME-01, TIME-02, TIME-03, TIME-04; each runs under TZ=UTC, America/Chicago, America/Denver and Pacific/Auckland); `node docs/audit/diagnostics/time.browser.mjs` (CASE TB-01, TB-08).
- Actual output, quoted from the evidence:

  > TIME-03: UTC 'silentHours=18; (no alert)'; Chicago 13; Denver 12; Auckland 'silentHours=31; serious: ... No reading for 31 hours'. TIME-04: UTC 22 (no alert); Chicago 27 (serious); Denver 28 (serious); Auckland 9 (no alert). TB-01 header: UTC 'September 30, 2026 at 12:00 AM'; Chicago 'September 29, 2026 at 7:00 PM'. TIME-01: UTC and Auckland critical; Chicago and Denver '(no alert)'.

- How it was verified: confirmed (verify_time F4, F10). Evidence: TIME-03 (date-only as_of) gives silentHours 18 (UTC), 13 (Chicago), 12 (Denver) and 31 (Auckland, 'serious: No reading for 31 hours'); TIME-04 (a 'Z' reading) gives 22 / 27 serious / 28 serious / 9; the TIME-01 spring-forward leak is critical in UTC and Auckland but '(no alert)' in Chicago and Denver. Corrections applied: with explicit offsets on both stamps the elapsed hours agree for every viewer, but the calendar-day rules still need the ranch-zone date (TIME-03); on the fall-back day the Chicago answer 'No reading for 24 hours' is physically right, so the defect is the dependence on the viewer, not a wrong Chicago value.

**Expected behaviour.** The same CSVs give the same alerts for every viewer. With meta 'as_of,timezone' = '2026-09-30T18:00,America/Chicago' and a reading at 2026-09-29T20:00Z, silentHours = 27 in every zone (18:00 CDT = 23:00Z; 23:00Z minus 20:00Z the day before = 27 h). TIME-01: critical 'Dropped 32 points in 24 hours, now 48%' for every viewer. The header shows the zone ('Sep 30, 2026 6:00 PM CDT').

**Operational consequence.** The same export gives different alerts depending on whose laptop opens it, and CI runs in UTC, so tests cannot catch what a Central-time viewer sees. Sensor data stamped in UTC misses or invents a silent sensor by the UTC offset, and twice a year a Central viewer can miss a leak.

**Proposed regression test.** Run one fixture in child processes under TZ=UTC and TZ=America/Chicago: meta as_of 2026-09-30T18:00 with timezone America/Chicago and a reading at 2026-09-29T20:00Z gives silentHours 27 in both. The TIME-01 fixture gives critical 'Dropped 32 points' in both (the maximum in the trailing 24 h is 80; 80 - 48 = 32). A date-only as_of gives a data issue.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): TIME-02 as_of 2026-09-30T18:00 America/Chicago minus a reading at 2026-09-29T20:00Z, h = `27.0`.

**Proposed fix (recommendation).** Add a ranch time zone to meta.csv (or require full offsets in exports, and still derive calendar dates in the ranch zone). Read stamps as ranch wall-clock time with Intl and compute elapsed time from those values, never from new Date(string). Show the zone in the header. One as-of policy for the whole page.

**Files affected.** `data/meta.csv` (ranch time zone) via `scripts/generate_data.py` (data files are generated; CI checks they match); `exceptions.js` (stamp parsing); `app.js` (header shows the zone); `tests/exceptions.test.mjs` (child processes under several TZ values).

**Related findings.** [TIME-03](#time-03), [DATA-02](#data-02), [WAT-03](#wat-03)

<a id="time-03"></a>
#### TIME-03: A UTC-stamped as_of shifts every calendar-day count by one day for evening exports, the same way for every viewer

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Time and as-of

**Problem.** The grazing and health rules and the timeline take the calendar date from `as_of.slice(0, 10)`. If as_of is stamped in UTC, an evening export in Central time takes the next day's date, so every day count is one too high, for every viewer alike.

**Where in the code.** exceptions.js:58 and :142 (asOf.slice(0, 10)); app.js:113 (grazing chart end = as_of.slice(0,10)); app.js:223 (header shows the local date)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/time.verify.mjs` (CASE MISSED-1; re-runs itself under TZ=UTC, America/Chicago and Pacific/Auckland). Minimal input: the committed data with data/meta.csv set to 'as_of\\n2026-10-01T01:00Z'; control 'as_of\\n2026-09-30T20:00-05:00'.
- Actual output, quoted from the evidence:

  > 'serious: Yearlings in Sand Hills: Day 25 of a 21-day plan (4 days over) / serious: Yearlings: Booster vaccine: Overdue by 16 days (due 2026-09-15) / warning: Cows in South Divide: Planned move in 2 days / warning: Heifers in Lone Tree: Planned move in 2 days / warning: Cows: Pinkeye check: Due in 2 days (2026-10-03)'. Browser (Chicago): 12 rows and '+4d'. Boundary fixture: 'serious: Day 22 of a 21-day plan (1 day over)' and 'serious: Overdue by 1 day (due 2026-09-30)' instead of two warnings at 0 days.

- How it was verified: confirmed (the time skeptic's own missed finding MISSED-1). Evidence: with meta as_of '2026-10-01T01:00Z' (= Sep 30 20:00 CDT) the output is identical in UTC, Chicago and Auckland: 'Day 25 of a 21-day plan (4 days over)', 'Overdue by 16 days' and two false 'Planned move in 2 days' warnings; the -05:00 control gives the committed rows. Browser (Chicago): header 'September 30, 2026 at 8:00 PM.', 12 rows, '+4d'. Registrar re-ran time.verify.mjs MISSED-1 on 2026-10-16: same.

**Expected behaviour.** The ranch calendar date is Sep 30, so the committed rows appear: 'Yearlings in Sand Hills: Day 24 of a 21-day plan (3 days over)', 'Yearlings: Booster vaccine: Overdue by 15 days (due 2026-09-15)', 'Cows: Pinkeye check: Due in 3 days (2026-10-03)', 10 rows, overstay label '+3d'.

**Operational consequence.** Exports stamped in UTC after 7 PM Central count from the next day: groups are flagged over plan and health tasks overdue a day early (a warning becomes serious), two false move warnings appear, and the header's 'September 30' contradicts the rows. Testing across viewer zones will not catch it because every viewer gets the same wrong answer.

**Proposed regression test.** Meta 'as_of\\n2026-10-01T01:00Z' with ranch zone America/Chicago, run under TZ=UTC and TZ=America/Chicago: the Grazing and Health rows equal the committed ones and there are 10 rows. By hand: 01:00Z Oct 1 minus 5 h (CDT) = 20:00 Sep 30; Sep 6 to Sep 30 = 24 days; Sep 15 to Sep 30 = 15; Sep 30 to Oct 3 = 3. The -05:00 control keeps passing.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): booster days overdue on the as-of date = `15`; pinkeye days until due = `3`; Yearlings in Sand Hills: day, plan, days over = `(24, 21, 3)`.

**Proposed fix (recommendation).** Compute the ranch calendar date of as_of once (Intl.DateTimeFormat('en-CA', {timeZone: ranchTZ, year: 'numeric', month: '2-digit', day: '2-digit'})) and pass it to the grazing and health rules and the timeline instead of as_of.slice(0,10). Never slice an offset-bearing timestamp.

**Files affected.** `exceptions.js` (ranch calendar date); `app.js` (timeline end, header); `tests/exceptions.test.mjs`.

**Related findings.** [TIME-02](#time-02), [DATA-02](#data-02)

<a id="wat-03"></a>
#### WAT-03: The 24-hour drop is not a 24-hour window: after a reading gap a multi-day change is reported as 'in 24 hours', a new sensor's fast drop is missed, and a fall that refills before the last reading is not seen

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Water

**Problem.** The 'dropped in 24 hours' baseline is the latest reading at least 24 hours before the last one, however old, and only the two endpoints are compared. After a reading gap a multi-day fall is reported as a 24-hour drop; a sensor with under 24 hours of history is never judged; a fall that refilled before the last reading is missed.

**Where in the code.** exceptions.js:45 (dayAgo = latest row at least 1 day before the last, any age), :49 (endpoint difference only), :110 (hard-coded 'in 24 hours'); app.js:204 and README.md (rule text)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.repro.mjs` (CASE W-01 gap, W-02 new sensor, W-03 refill); `node docs/audit/diagnostics/time.repro.mjs` (CASE TIME-16). Minimal input: T1 rows 2026-09-27T12:00 91, 2026-09-27T18:00 90, 2026-09-30T12:00 56, 2026-09-30T18:00 54; as_of 2026-09-30T18:00.
- Actual output, quoted from the evidence:

  > W-01: 'critical | Tank T1 (North Flat) | Dropped 36 points in 24 hours, now 54%'. W-02: 'drop24h=0; (no water alerts)'. W-03: 'drop24h=4; (no water alerts)'. TIME-16: 'critical: Tank T1 (North Flat): Dropped 32 points in 24 hours, now 48%'.

- How it was verified: confirmed (verify_water F4, F5; verify_time F7), design-limitation (verify_water F12). Evidence: W-01 'critical | Tank T1 (North Flat) | Dropped 36 points in 24 hours, now 54%' (baseline 72 h old); W-02 'drop24h=0; (no water alerts)' for 95, 80, 65, 50 on one day; TIME-16 'Dropped 32 points in 24 hours, now 48%' across a 4-day gap; W-03 'drop24h=4' after a 90 to 50 fall that refilled. Corrections applied: 'resumed sensor' is wrong for W-02 (a resumed sensor has a pre-gap row and takes the W-01 path); the trigger is a new sensor or an export starting less than 24 h before the last reading. The time skeptic said do not skip the rule when no reading is 18-30 h old; judge max-in-window minus last whenever the window has a reading and add a coverage note. Both skeptics checked the max-in-window rule on the committed data: worst 24-h drawdowns T1 16.1, T2 15.3, T3 16.2, T4 46, T5 14.5, T6 12.4, T7 17.1, T8 18.2, so no new alarm and T4 stays at 46. The daylight-saving variant is in TIME-02. Registrar re-ran W-01/W-02/W-03 and TIME-16 on 2026-10-16: same.

**Expected behaviour.** W-01: no water alert (inside the true 24 h the readings are 56 then 54; 54% is above the 40% demo line), or text that states the real span ('36 points over 72 hours'). W-02: critical, 45 points in 18 hours (95 - 50). W-03: the 40-point fall inside the window (90 - 50) reported. Committed data: the same 3 Water rows.

**Operational consequence.** After a radio outage, a slow decline is reported as a critical overnight leak and a crew is sent to haul water. A brand-new sensor's tank can drain about 2.5 points an hour with no alert. A sticking float that refills before the next reading goes unreported until it fails. The '24 hours' wording in the README and rules table is untrue whenever readings are irregular.

**Proposed regression test.** W-01 rows: 0 Water rows (window max 56, last 54). W-02 rows: one critical T1 row containing '45 points' and '18 hours'. W-03 rows: one T1 row mentioning 40 points (90 - 50). Contiguous control 2026-09-29T18:00 80 ... 2026-09-30T18:00 48: critical 'Dropped 32 points in 24 hours, now 48%'. Committed data: still exactly 3 Water rows and T4 at 46 points.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): worst 24-hour drawdown per tank (WAT-03 no-new-alarm check) = `{'T1': 16.1, 'T2': 15.3, 'T3': 16.2, 'T4': 46.0, 'T5': 14.5, 'T6': 12.4, 'T7': 17.1, 'T8': 18.2}`.

**Proposed fix (recommendation).** Use only readings in [last.time - 24 h, last.time] in the same pasture placement; drop = max level in that window minus the last level (or the max drawdown inside it); state the real span in hours; when the window holds only the last reading, say the 24-hour change can't be judged rather than reporting 0. The 30-point line stays a demo setting.

**Files affected.** `exceptions.js` (bounded window); `app.js` (rules text, line 204); `README.md` (rule text); `tests/exceptions.test.mjs`.

**Related findings.** [TIME-02](#time-02), [WAT-08](#wat-08), [UI-15](#ui-15), [TEST-01](#test-01)

<a id="wat-04"></a>
#### WAT-04: Readings are grouped by tank_id alone: two tanks sharing an ID in different pastures merge (a low tank is hidden), and a moved portable trough raises a false leak

Severity **medium** · Status **design-limitation** · Phase 1 (Fix now) · Effort **S** · Area: Water

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Readings are grouped by `tank_id` alone, and the data model does not say tank IDs are unique across pastures. Two tanks sharing an ID merge into one, and a portable trough that moves is compared with its level in the old pasture.

**Where in the code.** exceptions.js:41 (series keyed by tank_id only), :45 (baseline can come from another pasture), :47 (pasture taken from the last row)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/csv.verify.mjs` (CASE CV-03); `node docs/audit/diagnostics/water.repro.mjs` (CASE W-11).
- Actual output, quoted from the evidence:

  > CV-03: '(no alerts)'; waterStatus [["T1","P3",90,0]]. W-11: 'critical | Tank T9 (Sand Hills, Yearlings here now) | Dropped 35 points in 24 hours, now 55%'.

- How it was verified: design-limitation (the CSV skeptic's own missed finding M2; verify_water F10). Evidence: CV-03 (T1 at 12% in P1 and T1 at 90% in P3, interleaved) gives '(no alerts)' and waterStatus [["T1","P3",90,0]]; W-11 (portable T9 moved from P1 at 90 to P3) gives 'critical | Tank T9 (Sand Hills, Yearlings here now) | Dropped 35 points in 24 hours, now 55%'. The water skeptic graded the moved-trough case low; the CSV skeptic graded the merged-tank case medium; the registry takes medium for the hidden low tank. Two tanks sharing an ID is inferred to be a real naming habit (per-pasture 'T1' or 'North'), not observed in data.

**Expected behaviour.** CV-03: critical 'Tank T1 (North Flat) | Down to 12% full', or a data issue naming T1 in two pastures at the same time. W-11: no water alert (only the P3 readings count, 15 to 55, a rise).

**Operational consequence.** If tanks are numbered per pasture, a tank at 12% is hidden behind a full tank with the same name elsewhere. The day a portable trough moves with the yearlings, the crew gets a false critical leak alarm.

**Proposed regression test.** CV-03 fixture: a critical row whose subject starts 'Tank T1 (North Flat' with 'Down to 12% full', or a data issue naming T1 with both P1 and P3. W-11 rows: 0 Water rows.

**Proposed fix (recommendation).** State in the data contract that tank_id is unique across the ranch, with its pasture in tanks.csv (WAT-02). Flag a tank_id with readings in two pastures at the same timestamp as a data issue. Start a new series (and a new 24-hour baseline) when a tank's pasture changes.

**Files affected.** `exceptions.js` (series per tank and pasture); `data/tanks.csv` (from WAT-02); `tests/exceptions.test.mjs`.

**Related findings.** [WAT-02](#wat-02), [WAT-03](#wat-03)

<a id="grz-01"></a>
#### GRZ-01: The current grazing stay is chosen by a blank out_date, not by as_of: a planned or early-entered out_date hides an overstay, and the alert's advice to 'record a new move date' has nowhere to go but the column that silences it

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Grazing

**Scope note.** Replaying an earlier as_of (G-06) is a design limitation; the out_date-after-as_of, future-move and action-text parts are confirmed.

**Problem.** The current stay is the move row with a blank `out_date`, not the stay that covers as_of. Writing a planned move date into `out_date`, which the alert's own advice ('record a new move date') invites, closes the stay and silences the overstay; a move keyed early is treated as current.

**Where in the code.** exceptions.js:56 (moves.filter((m) => !m.out_date)), :119-122 (action text); app.js:129 (cur = !mv.out_date; end = mv.out_date || asOf)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/grazing.repro.mjs` (CASE G-05: the Sand Hills row given out_date 2026-10-03; G-06: as_of 2026-08-20T18:00; G-07: Sand Hills closed 2026-10-02 plus an open 'Yearlings,P2,2026-10-02,'; GB-04, GB-05 in Chromium).
- Actual output, quoted from the evidence:

  > G-05: '(no rows)  ## grazingStatus places the Yearlings in: (nowhere)'. G-06: '(no rows)  ## grazingStatus: Cows@P7 days=-23, Heifers@P4 days=-30, Yearlings@P3 days=-17'. G-07: 'grazing: (no rows)  ## T2: [critical] Tank T2 (Windmill, Yearlings here now)'. GB-05: 'current bars on the Yearlings row: [{x:558.9,w:1,...cur:true}]; overrun labels=[]'.

- How it was verified: partially-confirmed (verify_grazing F2). All three cases reproduce: 'F3a out_date after as_of total=9 :: (no rows)'; 'F3b as_of Aug 20 total=6 :: (no rows)'; 'F3c future move total=9 :: [critical] Tank T2 (Windmill, Yearlings here now)'. Corrections applied: the code follows its documented contract (the current stay has no out date, and as_of is the export time); moving as_of back to replay an earlier date (G-06) is a design limitation, not a defect; G-05 and G-07 expose a real robustness gap (as_of is available and ignored; 'Yearlings here now' is wrongly attached to the critical T2 alert). The strongest part is the action text: 'record a new move date' has no column, and the only date column silences the alert. Medium kept on that basis. The browser grey-bar coordinates in GB-04 rest on arithmetic plus the auditor's output.

**Expected behaviour.** The current stay is the one with in_date on or before the as-of date and out_date blank or after it. G-05: '[serious] Yearlings in Sand Hills ... (3 days over)' (Sep 6 + 21 = Sep 27). G-07: the same alert, and T2's subject 'Tank T2 (Windmill)' (nobody has been in Windmill since Aug 11). A planned move date can be recorded without closing the stay.

**Operational consequence.** A manager who follows the alert's advice by writing the planned move date into out_date closes the stay, and the 3-days-over alert disappears although the cattle have not moved. A move keyed a day early silences the overrun and tells the crew the yearlings are drinking at Windmill, the critically low tank, when they are not there yet.

**Proposed regression test.** (a) Committed moves with the Yearlings Sand Hills row given out_date 2026-10-03, as_of 2026-09-30T18:00: exactly one Grazing row, serious, 'Yearlings in Sand Hills', '(3 days over)'. (b) Sand Hills closed 2026-10-02 plus open 'Yearlings,P2,2026-10-02': the same serious row, and the T2 subject is exactly 'Tank T2 (Windmill)'. (c) A planned_move_date column, when present, is what the rule judges against.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Yearlings in Sand Hills: day, plan, days over = `(24, 21, 3)`.

**Proposed fix (recommendation).** One as-of policy (TIME-01): a stay is current when in_date &lt;= as-of date and (out_date blank or out_date > as-of date); pick the latest such stay per group. Use the same predicate in app.js and clip bars to the as-of date. Add an optional planned_move_date column for 'record a new move date' and name it in the action text, so following the advice does not close the stay.

**Files affected.** `exceptions.js` (current-stay predicate, action text); `app.js` (same predicate, bars clipped to as_of); `data/moves.csv` (optional `planned_move_date`) via `scripts/generate_data.py` (data files are generated; CI checks they match); `tests/exceptions.test.mjs`.

**Related findings.** [TIME-01](#time-01), [GRZ-02](#grz-02), [GRZ-08](#grz-08)

<a id="grz-02"></a>
#### GRZ-02: A group with two open moves gets a false '15 days over' alert and the timeline contradicts it; a duplicated row doubles the alert and garbles the T4 subject

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Grazing

**Problem.** Nothing limits a group to one open stay. A forgotten close on the previous move gives a second, false overstay alert, and a duplicated row doubles the alert and repeats the group name in the T4 subject.

**Where in the code.** exceptions.js:56 (no one-current-stay-per-group rule), :118-125; app.js:124 (current keyed by group, last wins), :129-138

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/grazing.repro.mjs` (CASE G-03, GB-03: 'Yearlings,P7,2026-08-25,2026-09-06' changed to 'Yearlings,P7,2026-08-25,'; G-04: a second copy of 'Yearlings,P3,2026-09-06,').
- Actual output, quoted from the evidence:

  > G-03: '[serious] Yearlings in South Divide | Day 36 of a 21-day plan (15 days over) | ...  ||  [serious] Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over)'. G-04: '11 alerts in total' with Sand Hills twice. GB-03: 'overrun labels: [+3d@549, +3d@549]'; the 15-day red segment is painted under the Sand Hills bar.

- How it was verified: confirmed (verify_grazing F3). Evidence: 'F4a stale open P7 total=11 :: [serious] Yearlings in South Divide | Day 36 of a 21-day plan (15 days over) || [serious] Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over)'; 'F4b dup Yearlings total=11'; in the browser the Sand Hills green bar covers the 15-day red segment so the chart shows only '+3d'. The skeptic added: a duplicated Heifers open row garbles the critical T4 alert to 'Tank T4 (Lone Tree, Heifers and Heifers here now)'; and corrected 'the most common grazing-log slip' to 'a common slip' (unsupported superlative).

**Expected behaviour.** One Yearlings row (Sand Hills, 3 days over) plus a data issue: 'Yearlings have 2 open moves (South Divide since Aug 25, Sand Hills since Sep 6); close the older one'. No 'South Divide' overstay. A duplicated row gives one grazing row and 10 alerts in total.

**Operational consequence.** Forgetting to close the previous move, a common slip, produces a false serious alarm that 150 yearlings are 15 days over in a pasture they left on Sep 6, while the chart beside it says +3d. A duplicated export row inflates the 'Needs attention' count and garbles which group drinks at the leaking tank.

**Proposed regression test.** G-03 moves: the Grazing rows starting 'Yearlings' are exactly one serious 'Yearlings in Sand Hills' containing '(3 days over)', plus at most one data issue naming both 'South Divide' and 'Sand Hills'; no row contains '15 days over' (Aug 25 + 21 = Sep 15, 15 days before Sep 30). G-04: findExceptions(...).length === 10 and one grazing row. Duplicated Heifers row: the T4 subject is 'Tank T4 (Lone Tree, Heifers here now)'.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Yearlings in Sand Hills: day, plan, days over = `(24, 21, 3)`.

**Proposed fix (recommendation).** In the data contract, allow at most one open stay per group; report extra open rows as a data issue and judge only the latest. Drop exact duplicates (DATA-03). In app.js set cur = (mv === currentMove[g]) so only one bar is green.

**Files affected.** `exceptions.js` (one open stay per group); `app.js` (one current bar); `tests/exceptions.test.mjs`.

**Related findings.** [GRZ-01](#grz-01), [DATA-03](#data-03)

<a id="grz-03"></a>
#### GRZ-03: Text or blanks in move and plan cells ('-', 'TBD', '21 days', a blank in_date or plan) silently remove the grazing alert, strip 'here now' from the T4 leak, or blank the whole rotation chart

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Grazing

**Problem.** Move dates and plan days are not validated. Any text in `out_date` ('-', 'TBD') counts as a closed stay; text or a blank in `planned_graze_days` gives NaN or acts as 0; one blank `in_date` makes every timeline bar NaN.

**Where in the code.** exceptions.js:30 (text kept as a string), :56 (!m.out_date treats any text as a closed stay), :58 (raw in_date vs as_of date), :119-125 (NaN fails both tests, so no row; a blank plan acts as 0); app.js:113 (start = '' when an in_date is blank), :117-118, :129-131 (NaN bar width)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/registry.extra.mjs` (Part 1: CASE X-GRZ-a, X-GRZ-b, X-GRZ-c, X-GRZ-control); `node docs/audit/diagnostics/grazing.repro.mjs` (CASE G-09 and GB-08 blank in_date 'Yearlings,P3,,'; G-10 in_date '2026-09-06T06:00'; G-11 blank P3 planned_graze_days).
- Actual output, quoted from the evidence:

  > X-GRZ-a: 'total=9; grazing=[]'. X-GRZ-b: T4 subject 'Tank T4 (Lone Tree)'. X-GRZ-c: 'total=9; grazing=[]'. G-09: '(no rows)  ## grazingStatus days=NaN -> over=NaN'. GB-08: 'bars with a numeric x: 0 of 23; months=Jun@x=NaN Jul@x=NaN Aug@x=NaN Sep@x=NaN', console 'Error: &lt;line> attribute x1: Expected length, "NaN"'. G-11: '[serious] Yearlings in Sand Hills | Day 24 of a -day plan (24 days over)'. G-10 (TZ=UTC): 'Day 23.75 of a 21-day plan (2.75 days over)'.

- How it was verified: confirmed (the grazing skeptic's own missed finding M0; verify_grazing F12) and partially-confirmed (the blank in_date part of verify_grazing F4). The skeptic's scripts lived in scratch space, so the registrar wrote a durable repro, docs/audit/diagnostics/registry.extra.mjs, and ran it on 2026-10-16: X-GRZ-a (out_date '-') 'total=9; grazing=[]; T4 subject="Tank T4 (Lone Tree, Heifers here now)"'; X-GRZ-b (Heifers out_date 'TBD') 'total=10; grazing=["serious | Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over)"]; T4 subject="Tank T4 (Lone Tree)"'; X-GRZ-c (P3 plan '21 days') 'total=9; grazing=[]'; control total=10. The F4 skeptic confirmed at medium that one blank in_date wipes all 23 bars and silently drops the planted serious alert. F12 is low on its own (garbled but visible text: 'Day 24 of a -day plan', 'Day 23.75 of a 21-day plan'). Registrar also re-ran grazing.repro.mjs on 2026-10-16: G-09, G-10, G-11 and GB-08 gave the same output as quoted below.

**Expected behaviour.** Each bad cell becomes a Grazing data issue naming the group or pasture and the value ("Yearlings: out_date '-' isn't a date; leave it blank for the current stay"; "No usable plan for Sand Hills"), and the rest is judged as usual: at least 10 rows on otherwise committed data; T4 still reads 'Tank T4 (Lone Tree, Heifers here now)'; the other 22 timeline bars still drawn; never '-day plan' or fractional days.

**Operational consequence.** Typing '-', 'TBD' or 'current' into an open stay, or '21 days' into a plan cell, is a common spreadsheet habit. Either one makes the planted serious overrun disappear and the count drop from 10 to 9 with no explanation, or tells the crew nothing about which group drinks from the leaking T4. One blank date wipes the whole rotation chart.

**Proposed regression test.** Committed data with as_of 2026-09-30T18:00: (1) Yearlings open row out_date '-': length >= 10 and a Grazing row mentions 'Yearlings' and matches /3 days over|not a date|out_date/i (Sep 6 + 21 = Sep 27). (2) P3 plan '21 days': length >= 10, a Grazing row mentions 'Sand Hills' and /plan/i, and no row matches / -day plan/. (3) Heifers out_date 'TBD': the T4 subject includes 'Heifers' or a data issue names it. (4) Blank in_date: a data issue for Yearlings, and 22 bars with finite x (23 rows in moves.csv minus the bad one). (5) in_date '2026-09-06T06:00': 'Day 24' and '(3 days over)', no decimal. (6) Blank P3 planned_graze_days (G-11; csv.repro CSV-46 is the same case for South Divide): a 'no usable plan' data issue naming the pasture, and no row matching / -day plan/.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Yearlings in Sand Hills: day, plan, days over = `(24, 21, 3)`.

**Proposed fix (recommendation).** In the data contract: in_date and out_date must be blank (out_date only) or valid YYYY-MM-DD dates; planned_graze_days must be a positive whole number. Anything else becomes a Grazing data issue, never a closed stay or a plan of 0. The timeline skips invalid rows with a visible note.

**Files affected.** `exceptions.js` (date and plan validation); `app.js` (timeline skips invalid rows); `tests/exceptions.test.mjs`.

**Related findings.** [DATA-02](#data-02), [CSV-04](#csv-04), [GRZ-01](#grz-01)

<a id="gain-03"></a>
#### GAIN-03: Group gain is not computed over one consistent pair of weigh-in sessions: a short re-weigh, animals that missed the last weigh-in, and the first animal's dates distort the verdict and the 'since' date

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Gain

**Problem.** Each animal's gain uses its own last two rows whatever the gap, the group figure is the plain mean of those, and the printed period comes from the first animal in the file. A short re-weigh, animals that missed the last session, or file order change the verdict and the dates.

**Where in the code.** exceptions.js:67-70 (per-animal last two rows, whatever the gap), :76 (from/to taken from mine[0]), :77 (unweighted mean of per-animal ADG)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-07: committed weights plus 'H001,Heifers,2026-09-16,1189'; GN-11a: H001's Sep 15 row removed; GN-11b: the six slow yearlings' Sep 15 rows removed; control GN-C2); `node docs/audit/diagnostics/time.repro.mjs` (CASE TIME-17); `node docs/audit/diagnostics/time.verify.mjs` (CASE F10+).
- Actual output, quoted from the evidence:

  > GN-07: 'Heifers adg=0.8686 (H001 20 lbs/day over 2026-09-15..2026-09-16) || warning | 32 heifers | Under 0.5 lbs/day: ...'. GN-11b: 'the six now: Y027 2.0816 (2026-06-01..2026-07-20), ... || serious | Heifers | ...' and no yearling row. GN-11a: 'serious | Heifers | 0.44 lbs/day since 2026-06-01 vs 1.0 target'. TIME-17: 'group adg=0.998 from=2026-06-01 to=2026-07-20; warning: 1 heifers: Under 0.5 lbs/day: H001'.

- How it was verified: confirmed (verify_gain F4, F7), partially-confirmed (verify_time F9). Evidence: GN-07 (H001 re-weighed next morning 20 lbs heavier) 'Heifers adg=0.8686 ... warning | 32 heifers' (the serious row is gone); GN-11b (six slow yearlings missed Sep 15) gives no yearling row at all; GN-11a 'serious | Heifers | 0.44 lbs/day since 2026-06-01 vs 1.0 target'; TIME-17 'group adg=0.998 from=2026-06-01 to=2026-07-20'. Corrections applied: the missing minimum interval is the primary cause (pooling alone would keep the serious row at 0.4416); part (a) of F7 happens only when the absent animal is first in file order; the time skeptic showed the committed serious heifer alert survives until 34 of 45 heifers miss the weigh-in, so for that path the realistic harm is a wrong period in the message, not a missed alert. Medium kept on the strength of GN-07 and GN-11b. Registrar re-ran GN-07 and GN-11a/b on 2026-10-16: same.

**Expected behaviour.** The group figure uses the group's last two weigh sessions (dates when most of the group crossed the scale), at least a minimum interval apart, for animals weighed at both. GN-07: Heifers stay serious at 1119/2565 = 0.436 and the Sep 16 reading is reported as a short-interval re-weigh. GN-11b: a Gain row naming Y027, Y031, Y058, Y082, Y129 and Y132 as not weighed Sep 15. GN-11a: 'Jul 20 to Sep 15', adg 1088/2508 = 0.43.

**Operational consequence.** A next-day re-weigh turns gut fill into lbs/day and can sink or lift a group verdict. The poor-doers, often exactly the animals missing from a gather, are judged on their early-summer gain and drop out of the report, and nothing says they were not weighed. The printed period can be weeks off.

**Proposed regression test.** GN-07 data: a serious Heifers row with adg 0.43-0.45 (1119/2565 = 0.4363) and H001's Sep 16 reading reported, not used. GN-11b data: a Gain row containing 'Y027' that says the animals missed the Sep 15 weigh-in. GN-11a data: the heifer row names Jul 20 (not Jun 1), adg 0.43 (1088/2508). Control: committed data unchanged (Heifers 0.44, Yearlings 1.94).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): days between the last two weigh-ins = `57`; Heifers pooled gain lbs / animal-days = `(1119, 2565)`; Heifers ADG = `0.4363`; Heifers without H001 = `(1088, 2508, 0.4338)`; yearlings under 1.0 lb/day (50% of the 2.0 demo target) = `['Y027', 'Y031', 'Y058', 'Y082', 'Y129', 'Y132']`; weigh-in sessions and head weighed = `['2026-06-01', '2026-07-20', '2026-09-15']`.

**Proposed fix (recommendation).** Find each group's last two weigh sessions with at least a minimum interval between them (demo setting, for example 21 days). Compute pooled gain sum(lbs) / sum(days) over animals weighed at both sessions, take the period from the session dates, and list animals missing from the latest session in their own row. Off-session readings are listed separately.

**Files affected.** `exceptions.js` (`gainStatus`: sessions, pooled gain); `tests/exceptions.test.mjs`.

**Related findings.** [GAIN-01](#gain-01), [GAIN-02](#gain-02), [GAIN-07](#gain-07), [GAIN-12](#gain-12)

<a id="gain-04"></a>
#### GAIN-04: No plausibility check on weights or daily gain: one keying slip masks the heifer alert and wrecks the gain chart's scale

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Gain

**Problem.** Weights and daily gains have no plausible range. One keying slip (11690 for 1169) lifts the group mean above the line and stretches the chart axis to hundreds of gridlines.

**Where in the code.** exceptions.js:70 and :77; app.js:152-158 (axis spans every ADG)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-08, GB-05: H001's Sep 15 weight keyed as 11690 instead of 1169).
- Actual output, quoted from the evidence:

  > GN-08: 'Heifers adg=4.538 || warning | 32 heifers | Under 0.5 lbs/day: ...'. GB-05: 'gridlines=372 labels=["avg 4.54",...]; dot x min/median/max=[74.3,78.7,545] of a 74..546 plot'.

- How it was verified: confirmed (verify_gain F5), no corrections. Evidence: GN-08 (H001's Sep 15 weight keyed 11690) 'Heifers adg=4.538 || warning | 32 heifers'; GB-05 'gridlines=372 labels=["avg 4.54",...]'. The skeptic checked 372 = 185.5/0.5 + 1 by hand. The quoted-thousands variant ('"1,169"') is part of CSV-01. Registrar re-ran GN-08 on 2026-10-16: same.

**Expected behaviour.** H001 reported as a data issue (185 lbs/day is impossible). Heifers stay serious at 1088/2508 = 0.4338. The chart axis stays 0.0 to 3.0 with 7 gridlines.

**Operational consequence.** One keying slip turns a serious group alert into a long animal list (a missed alert), and every real dot crowds into about 5 px of the chart under 372 overlapping labels. A low-side slip would instead raise a false alarm on a healthy animal.

**Proposed regression test.** Committed data with H001's Sep 15 weight 11690: a data issue naming H001 ((11690 - 1138)/57 = 185.1 lbs/day); a serious Heifers row at 0.43 (1088/2508); the gain chart has 7 gridlines.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Heifers without H001 = `(1088, 2508, 0.4338)`; GAIN-04 (11690-1138)/57 = `185.1228`; GAIN-04 gridlines 185.5/0.5 + 1 = `372.0`.

**Proposed fix (recommendation).** In the data contract, reject weights outside a plausible range and per-animal daily gain outside a plausible band (both demo settings, stated in the rules copy), list them as data issues and exclude them from group figures and the axis.

**Files affected.** `exceptions.js` (plausible ranges); `app.js` (axis from valid values); `tests/exceptions.test.mjs`; browser test (new; the repository has none yet).

**Related findings.** [GAIN-02](#gain-02), [CSV-01](#csv-01)

<a id="gain-05"></a>
#### GAIN-05: A non-numeric target ('2.O') silently turns off a group's gain alerts, and on the Yearlings row blanks the report

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Gain

**Problem.** `target_adg_lbs` is used as typed. A non-numeric target ('2.O') makes every comparison false, so the group is never flagged, and `target.toFixed` throws in the tile and the gain chart.

**Where in the code.** exceptions.js:128-133 ('2.O' \* 0.8 = NaN, so every comparison is false); app.js:56 and :173 (target.toFixed)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-20: groups.csv Yearlings target '2.O' with the yearlings' Sep 15 weights set to Jul 20 + 50 lbs; GB-06 in Chromium).
- Actual output, quoted from the evidence:

  > GN-20: 'Yearlings adg=0.8772 target="2.O" || serious | Heifers | 0.44 ...' (no yearling row). GB-06: 'pageerrors=["gain.target.toFixed is not a function"]; ... exception rows=0'.

- How it was verified: confirmed (verify_gain F10). Evidence: GN-20 'Yearlings adg=0.8772 target="2.O" || serious | Heifers | 0.44 ...' (no yearling row; with a good target the row is 'serious|Yearlings|0.88 lbs/day'); GB-06 'pageerrors=["gain.target.toFixed is not a function"]; ... exception rows=0'. Correction applied: the report blanks only when the bad target is on the Yearlings row (through the tile, LOAD-03); for another group (Heifers '1.O') the report draws without that group's alert, and gainStrip then throws at app.js:173 so the gain chart, budget chart and rules table never render. The blank-target variant is CSV-47 / VB-08.

**Expected behaviour.** A data issue naming the Yearlings target, or the yearlings judged serious at 0.88 (50/57 = 0.877). The exception table always draws.

**Operational consequence.** A single keying slip in a settings file turns off gain alerting for the main group with no message, and can blank the page or the charts below it.

**Proposed regression test.** Committed data with the Yearlings target '2.O': a data issue naming the Yearlings target, and the exception table renders. Heifers target '1.O': a data issue, the gain chart, budget chart and rules table render.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): GAIN-05 50/57 = `0.8772`.

**Proposed fix (recommendation).** In the data contract, require target_adg_lbs and head to be finite numbers >= 0; an invalid target becomes a data issue and the group is shown as 'not judged (bad target)'.

**Files affected.** `exceptions.js` (target validation); `app.js` (tile, chart); `tests/exceptions.test.mjs`; browser test (new; the repository has none yet).

**Related findings.** [LOAD-03](#load-03), [CSV-04](#csv-04)

<a id="gain-06"></a>
#### GAIN-06: Animals are keyed by tag alone, so the same tag number in two groups merges into one 'animal'

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Gain

**Problem.** Animals are grouped by tag alone. The same tag number in two groups merges into one 'animal', with nonsense gain and, through the zero-interval path (GAIN-02), a frozen page.

**Where in the code.** exceptions.js:65-66 (byTag keyed on r.tag only), :70 (group from row a)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-17, GB-09: weights '101,Heifers,2026-07-20,1100 / 101,Heifers,2026-09-15,1130 / 101,Yearlings,2026-07-20,800 / 101,Yearlings,2026-09-15,910').
- Actual output, quoted from the evidence:

  > GN-17: 'Heifers: 101 adg=-Infinity 2026-09-15..2026-09-15'. GB-09: 'PAGE HUNG ... paused stack: svg (app.js:12) &lt;- gainStrip (app.js:157)'.

- How it was verified: confirmed (verify_gain F3). Evidence: GN-17 'Heifers: 101 adg=-Infinity 2026-09-15..2026-09-15' (the yearling disappears); GB-09 'PAGE HUNG'. Correction noted: that numeric tag series are reused across groups (told apart by tag colour) is the auditor's inference, not shown. The '007' vs '7' coercion part is CSV-06. Registrar re-ran GN-17 and GB-09 on 2026-10-16: same.

**Expected behaviour.** Two animals: heifer 101 at 30/57 = 0.5263 lbs/day and yearling 101 at 110/57 = 1.9298, or a data issue 'tag 101 appears in Heifers and Yearlings'.

**Operational consequence.** Where tag numbers repeat across groups, merged records produce nonsense gains, mislabelled animals and, through the zero-interval path (GAIN-02), a frozen page.

**Proposed regression test.** The four rows above: gainStatus returns Heifers with one animal at about 0.5263 and Yearlings with one at about 1.9298, or a data issue naming tag 101; no non-finite ADG.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): GAIN-06 30/57 and 110/57 = `(0.5263, 1.9298)`.

**Proposed fix (recommendation).** Key animals by (group, tag) or a unique animal ID stated in the data contract; report a tag seen in two groups on the same date as a data issue. Keep tags as strings (CSV-06).

**Files affected.** `exceptions.js` (key by group and tag); `tests/exceptions.test.mjs`.

**Related findings.** [CSV-06](#csv-06), [GAIN-02](#gain-02), [GAIN-14](#gain-14)

<a id="gain-07"></a>
#### GAIN-07: No coverage disclosure: a group verdict can rest on a handful of animals and the page does not say how many were weighed

Severity **medium** · Status **design-limitation** · Phase 1 (Fix now) · Effort **S** · Area: Gain

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** The group figure is drawn from whichever animals were weighed, and the page never compares that count with the group's head in `groups.csv`.

**Where in the code.** exceptions.js:76 (head: mine.length, the number weighed, never compared with groups.csv head), :129-131 (no count in the text); app.js:56 (tile has no count)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-13: only Y001-Y003 weighed, 700 then 785.5 lbs; groups.csv says 150 head).
- Actual output, quoted from the evidence:

  > 'gainStatus Yearlings head=3 (groups.csv head=150) || serious | Yearlings | 1.50 lbs/day since 2026-07-20 vs 2.0 target'.

- How it was verified: design-limitation (verify_gain F11), no corrections. Evidence: GN-13 'gainStatus Yearlings head=3 (groups.csv head=150) || serious | Yearlings | 1.50 lbs/day since 2026-07-20 vs 2.0 target' (85.5/57 = 1.5). Phase 1 because the default plan requires gain coverage to be shown.

**Expected behaviour.** The row says '3 of 150 weighed', or the rule reports 'too few weighed to judge' below a minimum coverage (a demo setting).

**Operational consequence.** A manager could change supplement for a whole group on a verdict drawn from 2% of it, with no way to tell from the report. A reassuring average from a few animals can also hide the rest.

**Proposed regression test.** GN-13 data: the Yearlings row contains '3 of 150' or is replaced by a 'too few weighed (3 of 150)' row. Committed data: '45 of 45' and '150 of 150' shown in the gain coverage line.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): weigh-in sessions and head weighed = `['2026-06-01', '2026-07-20', '2026-09-15']`; GAIN-07 85.5/57 = `1.5`.

**Proposed fix (recommendation).** Pass groups.csv head into the gain summary; show 'n of head weighed' (and 'not yet re-weighed' from GAIN-01) in the row, tile and chart label; below a minimum coverage (demo setting) report 'insufficient weigh-in coverage' instead of a verdict. Rename the internal 'head' field to 'weighed'.

**Files affected.** `exceptions.js` (coverage in the gain summary); `app.js` (row, tile and chart label); `tests/exceptions.test.mjs`.

**Related findings.** [GAIN-01](#gain-01), [GAIN-03](#gain-03), [GAIN-08](#gain-08)

<a id="gain-08"></a>
#### GAIN-08: Old weigh-ins are presented as current: no age check, so a skipped weigh-in gives an all-clear on 72-day-old data

Severity **medium** · Status **design-limitation** · Phase 1 (Fix now) · Effort **S** · Area: Gain

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Scope note.** Moved from Phase 2 to Phase 1 by the completeness critic: the phase defaults list stale data as a CAN'T TELL reason in Phase 1, and here stale weigh-ins produce an all-clear. The page-wide freshness strip stays in Phase 2.

**Problem.** The gain rules never compare the last weigh-in date with as_of, so a group whose latest weigh-in is months old is judged on that old period as though it were current.

**Where in the code.** exceptions.js:127-138 (no comparison with as_of); app.js:56 (tile shows only the start date)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-18: all Sep 15 weigh-in rows removed; as_of still 2026-09-30).
- Actual output, quoted from the evidence:

  > 'Heifers: head=45 adg=0.917 from=2026-06-01 to=2026-07-20; Yearlings: head=150 adg=1.9807 ... || warning | 4 heifers | Under 0.5 lbs/day: H014, H017, H025, H033'.

- How it was verified: design-limitation (verify_gain F12), no corrections. Evidence: GN-18 (all Sep 15 rows removed) 'Heifers: head=45 adg=0.917 from=2026-06-01 to=2026-07-20; ... || warning | 4 heifers | Under 0.5 lbs/day: H014, H017, H025, H033'; the warning row carries no date. Jul 20 to Sep 30 = 11 + 31 + 30 = 72 days.

**Expected behaviour.** A row or note: last weigh-in Jul 20, 72 days before the as-of date.

**Operational consequence.** If a weigh-in is skipped or not exported, the report quietly judges an old period; here the serious heifer slump vanishes and a small early-summer warning takes its place.

**Proposed regression test.** GN-18 data with a 45-day demo limit: Heifers and Yearlings each show CAN'T TELL naming the last weigh-in 2026-07-20 and its age of 72 days (Jul 20 to Sep 30 = 11 + 31 + 30), and the old-period 'warning | 4 heifers' is not shown as a current alert. Committed data (last weigh-in Sep 15, 15 days before as_of): no CAN'T TELL row, so the committed count stays 10.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): days from the last weigh-in to the as-of date = `15`; days from Jul 20 to the as-of date (GAIN-08) = `72`.

**Proposed fix (recommendation).** Phase 1 (three states): when a group's latest weigh-in is older than a demo-setting limit before the as-of date (for example 45 days), its gain verdict is CAN'T TELL ('last weigh-in Jul 20, 72 days before the as-of date') instead of an all-clear or an old-period warning shown as current. Phase 2: the freshness and coverage strip shows each group's weigh dates beside the other files' ages. GAIN-11 already prints both weigh dates in the gain rows.

**Files affected.** `exceptions.js` (age check against as_of); `tests/exceptions.test.mjs`; Phase 2: `app.js` (freshness strip).

**Related findings.** [LOAD-05](#load-05), [GAIN-07](#gain-07), [GAIN-11](#gain-11)

<a id="bud-03"></a>
#### BUD-03: A zero-budget category prints 'Infinity% over' and a 0/0 row gives NaN; either one blanks the budget chart

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **M** · Area: Budget

**Scope note.** The empty or missing budget.csv part of verify_render F5 (NaN on the tile) is owned by LOAD-01, whose CAN'T TELL state replaces the tile; on-budget wording is UI-07.

**Problem.** Percent over budget is `variance / budget` with no check for a zero budget, giving Infinity or NaN, which also breaks the chart scale.

**Where in the code.** exceptions.js:88 (pct = variance / budget), :150-152; app.js:181 (lim = Math.max(0.3, ...|pct|)), :182, :191-193

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE BU-01, AB-01: committed data plus '2026-09,Hay,0,500'; BU-02, AB-02: '2026-09,Hay,0,0'); `node docs/audit/diagnostics/render.repro.mjs` (CASE R14, R15); `node docs/audit/diagnostics/csv.repro.mjs` (CASE CSV-56).
- Actual output, quoted from the evidence:

  > BU-01: 'serious | Hay | Infinity% over season to date (\$500)'. AB-01: chart bars 'NaN/NaN' x7, 36 attributes with NaN/Infinity, label '+Infinity%', console 'Error: &lt;line> attribute x1: Expected length, "NaN".' BU-02: 'pct=NaN; (no alerts)'. AB-02: 21 NaN attributes, label '−NaN%'.

- How it was verified: confirmed (verify_healthbudget F3, verify_render F5). Evidence: BU-01 'serious | Hay | Infinity% over season to date (\$500)'; AB-01 chart bars 'NaN/NaN' x7, 36 NaN/Infinity attributes; BU-02 'pct=NaN; (no alerts)'; AB-02 label '−NaN%'. Correction applied: the alert and the budget table do show the dollars ('Hay \$0 \$500 +\$500'), so the harm is the broken-looking 'Infinity%' and the blank chart. Medium kept. Registrar re-ran AB-01/AB-02 on 2026-10-16: same.

**Expected behaviour.** Spending with no budget line is shown in dollars as unbudgeted spending ('\$500 spent with no budget line'), never 'Infinity%'. A 0/0 placeholder gives no alert. The six real categories keep finite bars (Repairs +25%, Fuel +21%).

**Operational consequence.** A new unbudgeted line (hay bought in a dry year) or an empty placeholder category blanks the whole spending chart, and the alert text looks broken.

**Proposed regression test.** budgetStatus([{category:'Hay',budget:0,actual:0}])[0].pct is 0 or null, not NaN. Hay 0/500: exactly one Hay row containing '\$500' and not matching /Infinity|NaN/. Browser: #budgetChart has 0 attributes matching /NaN|Infinity/ and Repairs still reads '+25%' (9,000/7,200 - 1).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Repairs budget, actual, over \$, over % = `(7200, 9000, 1800, 25.0)`.

**Proposed fix (recommendation).** pct = budget > 0 ? variance / budget : null; a separate 'unbudgeted spending' rule in dollars; the chart scale uses finite pct only and draws null-pct rows as a labelled 'no budget' marker ('n/a').

**Files affected.** `exceptions.js` (`pct` null for zero budget; unbudgeted rule); `app.js` (chart scale and 'n/a' marker); `tests/exceptions.test.mjs`; browser test (new; the repository has none yet).

**Related findings.** [BUD-02](#bud-02), [UI-07](#ui-07), [UI-17](#ui-17)

<a id="bud-04"></a>
#### BUD-04: Budget severity is percent only: \$30 over on \$200 is serious, \$9,500 over on \$100,000 is a warning, and \$4,000 over is ignored

Severity **medium** · Status **design-limitation** · Phase 1 (Fix now) · Effort **S** · Area: Budget

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Severity uses percent alone (the 5% and 10% demo lines), so a small category a few dollars over outranks a large overrun, and a large-dollar overrun under 5% raises nothing.

**Where in the code.** exceptions.js:14-15 (RULES.budgetWarn / budgetSerious), :149-156

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE BU-12: rows '2026-09,Ear tags,200,230', '2026-09,Feed,100000,109500', '2026-09,Hay,100000,104000').
- Actual output, quoted from the evidence:

  > 'serious | Ear tags | 15% over season to date (\$30) | Find what drove it and decide whether to re-forecast  ||  warning | Feed | 10% over season to date | Watch it next month'. No Hay row.

- How it was verified: design-limitation (verify_healthbudget F6). Evidence: BU-12 'serious | Ear tags | 15% over season to date (\$30) ... || warning | Feed | 10% over season to date'; no Hay row (\$4,000, 4%). The skeptic noted nothing goes wrong on the committed data (every category is at least \$1,200 a month) and that medium is acceptable as a rule-design critique, since combined percent-and-dollar materiality lines are common in variance reporting. Phase 1 because the default plan adds a dollar materiality line, labelled as a demo setting.

**Expected behaviour.** A \$9,500 overrun ranked at least as high as a \$30 one; a \$4,000 overrun shown at least as a note. Every budget row shows dollars.

**Operational consequence.** False alarms on small categories and under-ranking of the overruns that actually hurt cash flow.

**Proposed regression test.** With demo settings stated in full (no row under \$500 over; warning at 5% or more over, or \$2,500 or more over; serious above 10% over, or \$5,000 or more over): Ear tags 230/200 (\$30, 15%) gives no row; Feed 109,500/100,000 (\$9,500, 9.5%) gives serious; Hay 104,000/100,000 (\$4,000, 4%) gives a warning only because of the \$2,500 dollar line (without a dollar warning line it gives no row). Committed data: Fuel and Repairs still serious (both above 10% and above \$500), 10 rows in total.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): categories over 5% (demo warning line) = `['Fuel', 'Repairs']`; smallest monthly category budget (BUD-04 control) = `1200`.

**Proposed fix (recommendation).** Add dollar lines next to the 5%/10% percent lines, all labelled as demo settings in the rules table and README. Show dollars in every budget row.

**Files affected.** `exceptions.js` (`RULES` dollar lines); `app.js` (rules table); `README.md`; `tests/exceptions.test.mjs`.

**Related findings.** [BUD-05](#bud-05), [BUD-06](#bud-06), [UI-09](#ui-09)

<a id="sec-01"></a>
#### SEC-01: CSV text is written into the page with innerHTML at 9 places: markup in a pasture, tag or group name runs script, can empty the alert table, and plain '&lt;' text silently deletes alert context

Severity **medium** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Security and safe rendering

**Problem.** `app.js` writes CSV-derived text into the page with `innerHTML` at nine places, unescaped. Markup in a name is run as HTML, and an ordinary '&lt;' cuts off the text that follows it. Today the CSVs live in the same repository as the code, so there is no trust boundary yet; the script risk becomes real when exports come from outside the repository.

**Where in the code.** app.js:28 (hover), :54 (tile group names), :68 (exception subject and problem), :82 (water heading), :104 (water tooltip), :143 (grazing tooltip), :170 (gain tooltip), :194 (budget tooltip), :198 (budget table)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/render.repro.mjs` (CASE R01, R02, R03, R04); `node docs/audit/diagnostics/render.browser.mjs` (scenarios xss-onload, xss-tooltip, xss-hides-alerts). Minimal input: data/pastures.csv with P4 named &lt;img src=x onerror="window.\_\_xss_pasture=1">, or the harmless name 'Lone Tree &lt;A'.
- Actual output, quoted from the evidence:

  > xss-onload: 'xss flags: {"pasture":true,"script":false,"tag":true,"group":true,"tip":false}; injected elements: {"img in #exceptions":4,"b in #exceptions":1,"img in #tiles":1,"img in #water h4":1,"script in #budgetTable":1,"total":8}'. xss-hides-alerts: exception rows (0) while chips read ["All (10)","Water (3)",...]. 'Lone Tree &lt;A': the T4 row reads 'Tank T4 (Lone Tree' and its HTML is 'Tank T4 (Lone Tree &lt;a, heifers="" here="" now)&lt;="" td="">&lt;/a,>'.

- How it was verified: confirmed (verify_render F3). Evidence: browser xss-onload 'xss flags: {"pasture":true,"script":false,"tag":true,"group":true,"tip":false}; injected elements: {... "total":8}'; xss-hides-alerts empties the exception table while the chips still read 'All (10)'; the skeptic showed a harmless name 'Lone Tree &lt;A' turns the T4 critical row into 'Tank T4 (Lone Tree' and drops 'Heifers here now'. Qualification applied: in the shipped static site the CSVs live in the same repo as app.js, so whoever can edit them can already edit the code; there is no trust boundary today. The script risk becomes real only when exports come from outside the repo (the README's real-data path). The more likely everyday harm is ordinary '&lt;' text deleting context from an alert row. Medium kept.

**Expected behaviour.** CSV text is shown as text: '&amp;lt;img' in the HTML, no window.\_\_xss_\* flag set, no injected elements, and 'Lone Tree &lt;A' shown in full with 'Heifers here now' kept.

**Operational consequence.** Once real exports come from outside the repo, anyone who can edit an upstream sheet can run script in the page or empty the alert table while the chips still claim 10 problems. Today, an ordinary '&lt;' in a name silently removes which group drinks at the leaking tank. Unescaped innerHTML is also a red flag for technical reviewers.

**Proposed regression test.** A pasture named '&lt;b>x&lt;/b>' with T2 steady at 20%: #exceptions innerHTML contains '&amp;lt;b&amp;gt;x&amp;lt;/b&amp;gt;' and not '&lt;b>x'; the T2 heading contains '&amp;lt;b&amp;gt;'. A tag '&lt;i>t&lt;/i>' on a hovered gain dot: the tooltip contains '&amp;lt;i&amp;gt;t&amp;lt;/i&amp;gt;'. 'Lone Tree &lt;A': the T4 subject is exactly 'Tank T4 (Lone Tree &lt;A, Heifers here now)'. render.repro.mjs R01-R04 flip to MATCH.

**Proposed fix (recommendation).** Add one esc() helper (& &lt; > " ') and apply it to every CSV-derived value at the nine sinks, or build rows and tooltips with createElement and textContent. Keep the icon SVGs as trusted constants.

**Files affected.** `app.js` (nine `innerHTML` sinks); browser test (new; the repository has none yet).

**Related findings.** [UI-14](#ui-14)

---

### 2.3 Low severity (18)

<a id="csv-07"></a>
#### CSV-07: A CSV saved as Windows-1252 ('CSV (Comma delimited)') shows garbled names

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: CSV reading

**Problem.** `Response.text()` always decodes as UTF-8, so a file saved by a spreadsheet as Windows-1252 shows replacement characters in names such as 'La Peña'. No alert is lost.

**Where in the code.** app.js:221 (Response.text() always decodes as UTF-8)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/csv.verify.browser.mjs` (CASE VB-07: pastures.csv written as latin1 bytes with 'La Peña' for P3); `node docs/audit/diagnostics/csv.verify.mjs` (CASE CV-07).
- Actual output, quoted from the evidence:

  > VB-07: 'Serious Grazing Yearlings in La Pe�a Day 24 of a 21-day plan (3 days over)' and chart heading 'T3 La Pe�a91.5%'. CV-07: 'La Pe�a'.

- How it was verified: confirmed (the CSV skeptic's own missed finding M4). Evidence: VB-07 row 'Serious Grazing Yearlings in La Pe�a Day 24 of a 21-day plan (3 days over)'; CV-07 gives 'La Pe�a'. Cosmetic: lookups still match because every file decodes the same way.

**Expected behaviour.** 'Yearlings in La Peña', or a visible note that pastures.csv is not UTF-8.

**Operational consequence.** Spanish pasture names are common in South Texas; replacement characters make the page look broken even though no alert is lost.

**Proposed regression test.** Serve pastures.csv as Windows-1252 bytes containing 'La Peña': the exception subject equals 'Yearlings in La Peña', or a data note names pastures.csv as not UTF-8.

**Proposed fix (recommendation).** Read arrayBuffer() and decode with new TextDecoder('utf-8', {fatal: true}); on failure decode as windows-1252 and show a data note naming the file.

**Files affected.** `app.js` (decode with `TextDecoder`); browser test (new; the repository has none yet).

**Related findings.** [CSV-01](#csv-01)

<a id="wat-07"></a>
#### WAT-07: Two different readings at the same timestamp: the alert depends on which line comes last in the file

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Water

**Problem.** When two readings share a timestamp, the stable sort keeps file order and the last line wins, so the alert depends on line order.

**Where in the code.** exceptions.js:43-44 (stable sort; the last of equal times wins)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.repro.mjs` (CASE W-04: T1 2026-09-29T18:00 80, then two rows at 2026-09-30T18:00, 78 and 20, run in both orders).
- Actual output, quoted from the evidence:

  > 'order 78-then-20: critical | Tank T1 (North Flat) | Dropped 60 points in 24 hours, now 20%   |   order 20-then-78: (no water alerts)'.

- How it was verified: confirmed (verify_water F7) with the severity lowered from medium to low: two very different levels at the identical minute are rare (a re-sent packet carries the same value). Evidence: 'order 78-then-20: critical | Tank T1 (North Flat) | Dropped 60 points in 24 hours, now 20%   |   order 20-then-78: (no water alerts)'.

**Expected behaviour.** The same result for both orders plus a 'readings disagree' data issue; a conservative rule uses the lower value (20%).

**Operational consequence.** A manual check entered alongside the sensor value decides between 'critical, haul water' and nothing, depending on line order.

**Proposed regression test.** For both orders: one critical T1 row with 'now 20%' (80 - 20 = 60 points) plus a data issue naming both 78% and 20%.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): WAT-07 80 to 20, points = `60`.

**Proposed fix (recommendation).** Group readings by (tank, parsed time) in the data contract's duplicate check (DATA-03). Identical values: drop the duplicate. Different values: report a data issue and use the lower level.

**Files affected.** `exceptions.js` (duplicate check); `tests/exceptions.test.mjs`.

**Related findings.** [DATA-03](#data-03)

<a id="wat-08"></a>
#### WAT-08: An exact 30.0-point drop is missed because of floating-point subtraction

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Water

**Problem.** The drop is a raw floating-point subtraction compared with `>= 30`, so some exact 30.0-point drops compute as 29.999... and are missed.

**Where in the code.** exceptions.js:49 and :109 (raw float subtraction compared with >= 30)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.repro.mjs` (CASE W-13: T1 2026-09-29T18:00 80.1, 2026-09-30T18:00 50.1).
- Actual output, quoted from the evidence:

  > 'drop24h=29.999999999999993; (no water alerts)'.

- How it was verified: confirmed (verify_water F11). Evidence: W-13 'drop24h=29.999999999999993; (no water alerts)'; the skeptic's scan found 48 of 301 one-decimal pairs from 70.0 to 100.0 that are exactly 30.0 apart compute below 30. Registrar re-ran W-13 on 2026-10-16: same.

**Expected behaviour.** Critical 'Dropped 30 points in 24 hours, now 50.1%' (80.1 - 50.1 = 30.0 meets the 30-point demo setting).

**Operational consequence.** Rare. A leak exactly at the line is not flagged, and the rule disagrees with its own documentation at the boundary.

**Proposed regression test.** Rows 80.1 then 50.1 over 24 h: one critical Water row with 'Dropped 30 points'. Also covered by TEST-01 case (3).

**Proposed fix (recommendation).** Compare a value rounded to the recorded precision: Math.round(drop \* 10) / 10 >= R.waterDropPts.

**Files affected.** `exceptions.js` (compare at recorded precision); `tests/exceptions.test.mjs`.

**Related findings.** [WAT-03](#wat-03), [TEST-01](#test-01)

<a id="grz-06"></a>
#### GRZ-06: Past overstays are never marked on the rotation chart although the card note says days past plan are marked

Severity **low** · Status **design-limitation** · Phase 1 (Fix now) · Effort **S** · Area: Grazing

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Overrun marks are drawn only on the current stay (`app.js:132-138`), but the card note (`index.html:90`) and the README say days past the planned move are marked, without qualification.

**Where in the code.** app.js:132-138 (overrun marks only inside if (cur)); index.html:90 (card note)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/grazing.repro.mjs` (CASE GB-13, committed data). The hover tooltip reads 'Cows in Cedar Draw / Jul 31 to Aug 22 (22 days) / Plan: 18 days'.
- Actual output, quoted from the evidence:

  > 'overrun labels=[{"s":"+3d","x":549,"y":104}]; red segments=[{"x":538.2,"w":10.8,"y":106}]'.

- How it was verified: design-limitation (verify_grazing F13). Evidence: browser baseline 'red:[{x:538.2,w:10.8,y:106}], over:["+3d@549"]': one mark, on the Yearlings row only; the Cows' Cedar Draw stay ran 22 days on an 18-day plan (Jul 31 + 18 = Aug 18, out Aug 22). The skeptic noted it is arguably a mismatch with documentation, because index.html:90 and the README say without qualification that 'days past the planned move are marked'. Phase 1 because the honest-copy fix is a one-line reword.

**Expected behaviour.** Either a '+4d' mark on the Cows' Cedar Draw bar (22 - 18 = 4) beside the Yearlings' '+3d', or a card note that says only the current stay's days past plan are marked.

**Operational consequence.** A season review cannot see which past moves ran long, and the chart note promises something the chart does not do.

**Proposed regression test.** Phase 1: the grazing card note text matches /current stay/i. If the marks are added: a '+4d' label on the Cows row and the existing '+3d' on the Yearlings row.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Cows in Cedar Draw: days vs plan (GRZ-06) = `(22, 18)`.

**Proposed fix (recommendation).** Phase 1: reword the note to 'the current stay's days past plan are marked'. Optional later: draw muted overrun segments for closed stays too.

**Files affected.** `index.html` (line 90 card note); `README.md` (same claim); optional later: `app.js`.

**Related findings.** [GRZ-05](#grz-05), [UI-05](#ui-05)

<a id="gain-11"></a>
#### GAIN-11: Gain wording: 'since &lt;date>' hides that the period ended at the last weigh-in, '1 yearlings', and toFixed(1) shows thresholds that differ from the ones applied

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Gain

**Problem.** The gain text says 'since &lt;date>' for a period that ended at the last weigh-in, does not singularise '1 yearlings', and prints thresholds with `toFixed(1)`, so the printed line can differ from the one applied.

**Where in the code.** exceptions.js:131 (g.target.toFixed(1)), :135-136 (plural; (g.target \* R.animalShare).toFixed(1)); app.js:56, :173, :209; index.html:94 ('Daily gain since the last weigh-in')

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-21, GB-C1); `node docs/audit/diagnostics/gain.missed.mjs` (CASE M4).
- Actual output, quoted from the evidence:

  > '0.44 lbs/day since 2026-07-20 vs 1.0 target'; subject '1 yearlings'; '1.60 lbs/day ... vs 2.0 target' for 1.598; 'Under 0.6 lbs/day: A' with A at 0.61; heading 'Daily gain since the last weigh-in'.

- How it was verified: confirmed (verify_gain F17; the gain skeptic's own missed finding M3). Evidence: '0.44 lbs/day since 2026-07-20 vs 1.0 target' on Sep 30 for a period ending Sep 15; subject '1 yearlings'; 'serious | 1.60 lbs/day since 2026-06-01 vs 2.0 target' for 1.598; gain.missed M4 '["warning | 1 heifers | Under 0.6 lbs/day: A","warning | 1 yearlings | Under 1.1 lbs/day: E"]; A adg=0.6100, E adg=1.1200' with targets 1.25 and 2.25. The skeptic added: the table prints ISO dates while the tile prints 'Jul 20' for the same date. Registrar re-ran gain.missed M4 on 2026-10-16: same.

**Expected behaviour.** '0.44 lbs/day between the Jul 20 and Sep 15 weigh-ins (target 1.0)'; '1 yearling'; thresholds printed as applied ('Under 0.625 lbs/day', 'target 2.25'); a figure under the line never shown as equal to it.

**Operational consequence.** Small slips that make a careful reader doubt the numbers: an animal listed as 'under 0.6' at 0.61, and a period described as running to today that ended two weeks earlier.

**Proposed regression test.** Committed heifer problem contains 'Sep 15' (or '09-15'); one slow animal gives '1 yearling'; targets 1.25/2.25 give 'Under 0.625' and 'Under 1.125' and each listed animal is below the printed number (0.61 &lt; 0.625, 1.12 &lt; 1.125); 1.598 is not printed as '1.60' against a 1.6 line.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): GAIN-11 half of 1.25 and 2.25; listed 0.61 and 1.12 below them = `(0.625, 1.125, True, True)`; short dates for the heifer period start, booster due, pinkeye due (UI-13) = `('Jul 20', 'Sep 15', 'Oct 3')`.

**Proposed fix (recommendation).** Name both weigh dates in the row, tile and chart heading; fix the plural; format thresholds with up to 3 decimals trimmed of trailing zeros; show each listed animal's own ADG.

**Files affected.** `exceptions.js` (row text); `app.js` (tile, chart heading); `index.html` (line 94 heading); `tests/exceptions.test.mjs`.

**Related findings.** [GAIN-12](#gain-12), [UI-13](#ui-13)

<a id="gain-12"></a>
#### GAIN-12: A group exactly at 80% of target is flagged serious or not depending on row order (floating-point mean)

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Gain

**Problem.** The group mean is a floating-point average compared with a strict `<`. A group exactly at 80% of target can compute just under it in one row order and exactly at it in another.

**Where in the code.** exceptions.js:77 (mean of per-animal ADG via reduce), :129 (strict &lt;)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.missed.mjs` (CASE M1: five yearlings at 700 on Jul 20 and 700 + [104, 79, 97, 105, 71] on Sep 15, then the same rows with Y005 first).
- Actual output, quoted from the evidence:

  > 'file order: adg=1.5999999999999999 rows=["serious | Yearlings | 1.60 lbs/day since 2026-07-20 vs 2.0 target"]  ||  Y005 first: adg=1.6 rows=[]'.

- How it was verified: confirmed (the gain skeptic's own missed finding M2). Evidence: gain.missed M1 'file order: adg=1.5999999999999999 rows=["serious | Yearlings | 1.60 lbs/day since 2026-07-20 vs 2.0 target"]  ||  Y005 first: adg=1.6 rows=[]'. Registrar re-ran gain.missed M1 on 2026-10-16: same.

**Expected behaviour.** 456 lbs / 285 animal-days = 1.6 exactly = 80% of 2.0, so no Gain row in either order (the rule says 'under 80%').

**Operational consequence.** At the boundary the verdict depends on how the export ordered rows, and the row reads '1.60 vs 2.0', which looks like a rule violation.

**Proposed regression test.** The five yearlings: no Gain row in file order or rotated (456/285 = 1.6). 455 lbs (1.5965) gives a serious row.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): GAIN-12 456/285 = `1.6`; GAIN-12 455/285 = `1.5965`.

**Proposed fix (recommendation).** Use pooled gain sum(lbs) / sum(days) (GAIN-03), or round to 3 decimals before comparing.

**Files affected.** `exceptions.js` (pooled gain or rounding); `tests/exceptions.test.mjs`.

**Related findings.** [GAIN-03](#gain-03)

<a id="gain-13"></a>
#### GAIN-13: Groups with a 0.0 target (the cows) are skipped silently in the report and the chart

Severity **low** · Status **design-limitation** · Phase 1 (Fix now) · Effort **S** · Area: Gain

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Groups with a 0 target are skipped by the rules (`if (!g.target) continue`) and the chart, and nothing on the page says so.

**Where in the code.** exceptions.js:128 (if (!g.target) continue); app.js:150 (.filter((g) => g.target)); app.js:209-210 and the README rules table

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-14).
- Actual output, quoted from the evidence:

  > 'gainStatus Cows adg=-1.4912 target=0 || serious | Heifers | ... || warning | 6 yearlings | ...'. No cow row; the chart note reads 'One dot per animal; the line is the group's target.'

- How it was verified: design-limitation (verify_gain F14), no corrections. Evidence: GN-14 (five cows 1300 then 1215 lbs, -85/57 = -1.49 lbs/day) 'gainStatus Cows adg=-1.4912 target=0 || serious | Heifers | ... || warning | 6 yearlings | ...'; no cow row and no cows in the chart; the rules table and chart note say nothing. Phase 1 because the honest rule copy fix is a sentence.

**Expected behaviour.** A visible line in the rules table, README and chart note: groups without a gain target are not judged on gain.

**Operational consequence.** A viewer can't tell whether the cows were judged and passed or were not judged at all.

**Proposed regression test.** The rules table includes a line matching /no gain target.\*not judged/i. If a maintenance rule is added later, GN-14 data gives a Cows row at -1.49 lbs/day.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): GAIN-13 -85/57 = `-1.4912`.

**Proposed fix (recommendation).** Add the sentence to the rules table, README and chart note. A weight-loss check for target-0 groups can follow with GAIN-09 in Phase 2.

**Files affected.** `app.js` (rules table); `index.html` (line 95 chart note); `README.md`.

**Related findings.** [GAIN-09](#gain-09)

<a id="hlth-02"></a>
#### HLTH-02: An open health task with a blank or unreadable due date is never shown anywhere

Severity **low** · Status **design-limitation** · Phase 1 (Fix now) · Effort **S** · Area: Health

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** An open task with a blank or unreadable `next_due` is skipped. The documented rule covers only overdue and due-soon tasks, and the page has no other health list.

**Where in the code.** exceptions.js:141 (|| !h.next_due -> continue), :142-146 (a NaN 'left' falls through both branches)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE H-03 'Heifers,Pregnancy check,2026-09-20,,open'; H-04 next_due 'TBD').
- Actual output, quoted from the evidence:

  > H-03: '(no alerts)'. H-04: '(no alerts)'.

- How it was verified: design-limitation (verify_healthbudget F4), severity lowered from medium to low: the documented rule covers only overdue and due-within-7-days tasks, and an open task with no date is backlog more than a time-critical exception. Evidence: H-03 (blank next_due) '(no alerts)'; H-04 ('TBD') '(no alerts)'. Phase 1 because the default plan requires open tasks with no due date to appear as data issues.

**Expected behaviour.** A data issue row for 'Heifers: Pregnancy check': 'Open, with no due date recorded' or 'Due date "TBD" can't be read', with the action 'Set a due date'.

**Operational consequence.** An open pregnancy check or vaccination that nobody has scheduled is invisible, because the page has no health list.

**Proposed regression test.** Only the health row 'Heifers,Pregnancy check,2026-09-20,,open' (as_of 2026-09-30T18:00): exactly one Health data issue for 'Heifers: Pregnancy check' matching /no due date/i. 'TBD': one matching /TBD|can't be read/i.

**Proposed fix (recommendation).** In the data contract, an open task needs a valid due date; a blank or unreadable one becomes a visible data issue with 'Set a due date'. Add the rule to the rules table and README.

**Files affected.** `exceptions.js`; `app.js` (rules table); `README.md`; `tests/exceptions.test.mjs`.

**Related findings.** [HLTH-01](#hlth-01), [DATA-02](#data-02)

<a id="hlth-03"></a>
#### HLTH-03: The example 'Fly tag check' row (done, last done Jun 5, next due Sep 1) contradicts itself and the meaning of next_due on a done row is undefined

Severity **low** · Status **design-limitation** · Phase 1 (Fix now) · Effort **S** · Area: Health

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** In the example data, the 'Fly tag check' row is 'done' with last done Jun 5 and a `next_due` of Sep 1, before as_of. The meaning of `next_due` on a done row is not documented, and `last_done` is never read.

**Where in the code.** scripts/generate_data.py:114; data/health.csv; exceptions.js:140-147 (last_done never read)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE H-05, committed data unmodified).
- Actual output, quoted from the evidence:

  > H-05 health alerts: 'serious | Yearlings: Booster vaccine | Overdue by 15 days ... || warning | Cows: Pinkeye check | Due in 3 days ...'. No Fly tag row.

- How it was verified: design-limitation (verify_healthbudget F5), severity lowered from medium to low (it only affects how credible the sample data looks to someone who opens health.csv). Correction applied: the generator row is scripts/generate_data.py:114, not :180. Evidence: H-05 (committed data) gives only the booster and pinkeye rows; data/health.csv has 'Cows,Fly tag check,2026-06-05,2026-09-01,done'.

**Expected behaviour.** Consistent example data with a documented meaning of next_due: either the row is changed (for example last_done 2026-09-01, next_due blank) so the committed count stays 10, or it is planted on purpose and listed.

**Operational consequence.** A ranch-manager reviewer reading the fictional health.csv sees a recurring task apparently 29 days overdue (Sep 1 to Sep 30) with nothing on the page.

**Proposed regression test.** After the generator fix: the committed data still gives 10 rows and no health row contradicts itself (no 'done' row with last_done &lt; next_due &lt;= as_of). Documented semantics tested with an inline row.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): fly tag row: status done, next_due days before as_of = `('done', 29)`.

**Proposed fix (recommendation).** Fix the generator row and document next_due in the README as the next scheduled date for open tasks only. Do not add a planted problem unless it is listed in PLANTED and the README.

**Files affected.** `scripts/generate_data.py` (line 114), regenerating `data/health.csv`; `README.md` (meaning of `next_due`); `tests/exceptions.test.mjs`.

**Related findings.** [HLTH-04](#hlth-04)

<a id="bud-05"></a>
#### BUD-05: Budget boundaries are inconsistent: exactly 5.0% gets no row though the rules say '5-10%', 9.6% and 10.4% both print '10% over' at different severities, and summed cents can tip an exact 10.00% into serious

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Budget

**Problem.** The code tests `pct > 0.05` and `pct > 0.10` (strict), rounds the printed percent to a whole number, and sums dollars in floating point. The printed rule says '5-10%'.

**Where in the code.** exceptions.js:86-88 (float sums), :150 (Math.round(pct\*100)), :151 (> budgetSerious), :154 (> budgetWarn); app.js:213-214; README.md:28

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE BU-08, BU-09, BU-10, HB-C7).
- Actual output, quoted from the evidence:

  > BU-08: '(no alerts)'. BU-09: '9.6%: warning | X | 10% over season to date | Watch it next month  ##  10.4%: serious | X | 10% over season to date (\$104)'. HB-C7: 'warning | X | 10% over season to date'. BU-10: 'code budget=7419 actual=8160.900000000001 pct=0.10000000000000007; serious | X | 10% over season to date (\$741.9)'.

- How it was verified: confirmed (verify_healthbudget F8, F9). Evidence: BU-08 ('2026-09,X,1000,1050') '(no alerts)'; BU-09 '9.6%: warning | X | 10% over ... ## 10.4%: serious | X | 10% over season to date (\$104)'; BU-10 'pct=0.10000000000000007; serious | X | 10% over season to date (\$741.9)'. Corrections applied: the README rule text is README.md:28, not :243; 1,051 vs 1,000 prints '5% over' and is flagged while 1,050 prints nothing; the cents case came from a search and needs an overrun of exactly 10.000% to the cent.

**Expected behaviour.** Stated, consistent bounds (for example warning at 5% or more up to 10%, serious above 10%), one-decimal percentages so two severities never show the same number, and integer-cent arithmetic so 10.00% is never serious.

**Operational consequence.** Two rows that both read '10% over' get different severities and actions, and an exact 5% overrun contradicts the published rule text.

**Proposed regression test.** 1,050 vs 1,000: warning '5.0% over'. 1,096: warning '9.6% over'. 1,104: serious '10.4% over'. 1,100: warning '10.0% over'. BU-10 rows: warning (integer cents 74,190 x 10 = 741,900).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Fuel budget, actual, over \$, over % = `(9600, 11640, 2040, 21.25)`; BUD-02 1,500 / 7,200 = `20.8333`; BUD-05 integer cents 74,190 x 10 = `741900`.

**Proposed fix (recommendation).** Pick and state inclusive bounds; compare in integer cents; print one decimal; make the rules table and README.md:28 match. If one-decimal printing is adopted, update the whole-percent strings quoted in the BUD-01, BUD-02, BUD-07 and DATA-03 tests: Fuel 21.3% (2,040 / 9,600 = 21.25%, rounded half up from integer cents), Repairs 25.0%, BUD-02's Repairs case 20.8% (1,500 / 7,200), BUD-07's rows 50.0% under.

**Files affected.** `exceptions.js` (inclusive bounds, integer cents, one decimal); `app.js` (lines 213-214); `README.md` (line 28); `tests/exceptions.test.mjs`.

**Related findings.** [BUD-04](#bud-04), [BUD-06](#bud-06), [UI-08](#ui-08)

<a id="bud-06"></a>
#### BUD-06: Budget money formatting: raw toLocaleString gives '\$104.5', warning rows carry no dollars, and a non-US browser locale shows '\$2.040' and '\$89.303 of \$88.400'

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Budget

**Problem.** Money is formatted with raw `toLocaleString()`, which follows the browser's locale and keeps cents, and warning rows print no dollars.

**Where in the code.** exceptions.js:152 (\$\${b.variance.toLocaleString()}), :155 (no dollars); app.js:21 (money uses toLocaleString()), :50, :54, :223 (head and acres)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE BU-11: '2026-09,X,1000,1104.5' and '2026-09,X,1000,1060'); `node docs/audit/diagnostics/time.verify.mjs --browser` (CASE MISSED-2, locales en-US and de-DE).
- Actual output, quoted from the evidence:

  > BU-11: '(\$104.5)' and a warning row with no dollars. de-DE: '21% over season to date (\$2.040) | Spend vs budget+1.0%\$89.303 of \$88.400 | 4.300 acres'.

- How it was verified: confirmed (verify_healthbudget F10; the time skeptic's own missed finding MISSED-2, filed as time M1). Evidence: BU-11 'serious | X | 10% over season to date (\$104.5) ... ## warning | X | 6% over season to date'; with browser locale de-DE: '21% over season to date (\$2.040)' and 'Spend vs budget+1.0%\$89.303 of \$88.400', '4.300 acres', while the header date stays 'September 30, 2026 at 6:00 PM.' Registrar re-ran BU-11 on 2026-10-16: same.

**Expected behaviour.** One fixed en-US number format everywhere: '(\$105)', '\$60' on the warning row, '\$2,040', '\$89,303 of \$88,400', '4,300 acres' for every viewer.

**Operational consequence.** Money shown as '\$104.5' looks unpolished, a warning gives no dollar figure to judge by, and a European-locale reader sees '\$2.040' in an English sentence.

**Proposed regression test.** 1,104.50 vs 1,000: '(\$105)'. 1,060 vs 1,000: warning contains '\$60'. With LANG=de_DE.UTF-8 in node and locale de-DE in Playwright: Fuel '21% over season to date (\$2,040)', tile '\$89,303 of \$88,400', header '4,300 acres'.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): total acres (header '4,300 acres') = `4300`.

**Proposed fix (recommendation).** One shared formatter (Intl.NumberFormat('en-US')) used in exceptions.js and app.js for dollars, head and acres; dollars on every budget row.

**Files affected.** `exceptions.js` and `app.js` (one shared en-US formatter); `tests/exceptions.test.mjs` (with `LANG=de_DE.UTF-8`); browser test (new; the repository has none yet).

**Related findings.** [BUD-04](#bud-04), [UI-13](#ui-13)

<a id="ui-04"></a>
#### UI-04: The 'Water tanks OK' tile re-reads tank IDs from the alert text and undercounts when tank names share a first word ('Well 2', 'Well 4')

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Interface

**Problem.** The tile counts tanks needing a look by taking the second word of each Water alert's subject text, not a structured tank key.

**Where in the code.** app.js:47 (e.subject.split(" ")[1]), :55

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.repro.mjs` (CASE B-03: T2 renamed 'Well 2' and T4 'Well 4'); `node docs/audit/diagnostics/time.browser.mjs` (CASE TB-05); `node docs/audit/diagnostics/render.repro.mjs` (CASE R17).
- Actual output, quoted from the evidence:

  > B-03: tile 'WATER TANKS OK 6 of 8 2 need a look'. TB-05: 'Water tanks OK6 of 82 need a look | water rows: 3'. R17: '"Water tanks OK: 1 of 2 | 1 need a look"; chip 'Water (2)''.

- How it was verified: confirmed (verify_time F12, verify_water F13), partially-confirmed (verify_render F7). Evidence: water B-03 tile 'WATER TANKS OK 6 of 8 2 need a look' while the report lists Well 2, Well 4 and T6; TB-05 'Water tanks OK6 of 82 need a look | water rows: 3'; render 'Water tanks OK: 7 of 8 | 1 need a look' with three tanks named Well 2/4/6. Correction applied: one tank name with a space on its own is counted correctly; the undercount needs two alerting tanks with the same first word, or a first word equal to another alerting tank's ID. Phase 1 because the default plan has the tile read structured results.

**Expected behaviour.** Tile 'Water tanks OK 5 of 8, 3 need a look' (Well 2, Well 4, T6); R17 'Water tanks OK: 0 of 2 | 2 need a look'.

**Operational consequence.** With real tank names the headline tile says fewer tanks need a look than the report lists, on the same screen.

**Proposed regression test.** B-03 data: the tile contains '5 of 8' and '3 need a look'. R17 data: 'Water tanks OK: 0 of 2 | 2 need a look' and 'Water (2)'.

**Proposed fix (recommendation).** Carry a structured tank key on each water result (and the tanks master list from WAT-02) and count distinct keys, never display text.

**Files affected.** `exceptions.js` (structured tank key on water results); `app.js` (tile); browser test (new; the repository has none yet).

**Related findings.** [WAT-02](#wat-02), [WAT-01](#wat-01)

<a id="ui-05"></a>
#### UI-05: Grazing timeline month ticks are hard-coded to June-September 2026

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Interface

**Problem.** The month ticks are a hard-coded list of June-September 2026 dates (`app.js:120`).

**Where in the code.** app.js:120 (for (const mo of ["2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01"]))

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/time.browser.mjs` (CASE TB-04); `node docs/audit/diagnostics/grazing.repro.mjs` (CASE GB-09, GB-10, GB-11, GB-12); `node docs/audit/diagnostics/render.repro.mjs` (CASE R20).
- Actual output, quoted from the evidence:

  > TB-04: Jun..Sep at x -1358.9 to -997. GB-11: x 1512.9 to 1874.8 in a 560-wide viewBox. GB-12: 'months=Jun@x=-1.7 Jul@x=116.3 Aug@x=238.3 Sep@x=360.2' (no Oct). GB-10: 'Jun@x=14.7'.

- How it was verified: confirmed (verify_time F11, verify_grazing F9, verify_render F11). Evidence: TB-04 (every '2026-' replaced by '2027-') 'ticks [{"m":"Jun","x":-1358.9},...,{"m":"Sep","x":-997}]'; GB-11 (2025 season) 'months=Jun@x=1512.9 ... Sep@x=1874.8 (viewBox width 560)'; GB-12 (as_of Oct 20) no Oct tick; GB-10 a June label drawn in the group-name column. The skeptics checked the x values by hand and asked to report it once across areas. The render skeptic noted the regression test should say whether the season's start month counts as a tick.

**Expected behaviour.** Ticks on the first of each month inside the axis for whatever season is loaded: GB-09 May-Sep; GB-10 Jul-Sep; GB-11 Jun-Sep inside x 74..550; GB-12 Jul-Oct.

**Operational consequence.** With any other season's data, including this ranch's own next export in October, the rotation chart has no month labels or labels in the wrong place.

**Proposed regression test.** For each of GB-09..GB-12 and TB-04, the month labels equal the hand-worked set and every x lies within 74..550; whether the first day of the start month gets a tick is stated in the test.

**Proposed fix (recommendation).** Generate ticks from the data: first of each month after the season start up to the as-of date (Date.UTC), labelled with the short month name, adding the year when the span crosses one.

**Files affected.** `app.js` (generated ticks); browser test (new; the repository has none yet).

**Related findings.** [GRZ-06](#grz-06)

<a id="ui-06"></a>
#### UI-06: On the due day the text says 'Due in 0 days' and 'Planned move in 0 days'

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Interface

**Scope note.** Only the 'in 0 days' wording is confirmed; the grazing day-numbering complaint was judged a convention and is not registered as a defect.

**Problem.** The day-count messages have no special case for 0 days.

**Where in the code.** exceptions.js:124 (Planned move in \${-over} day...), :145-146 (Due in \${left} day...)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/time.repro.mjs` (CASE TIME-18); `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE H-07); `node docs/audit/diagnostics/grazing.repro.mjs` (CASE G-13).
- Actual output, quoted from the evidence:

  > 'warning: Cows in North Flat: Planned move in 0 days'; 'warning | Cows: Pinkeye check | Due in 0 days (2026-09-30) | Plan it with the next gather'.

- How it was verified: confirmed (verify_time F13, verify_healthbudget F12), partially-confirmed (verify_grazing F11). Evidence: TIME-18 'warning: Cows in North Flat: Planned move in 0 days / warning: Cows: Booster: Due in 0 days (2026-09-30)'; H-07 'warning | Cows: Pinkeye check | Due in 0 days (2026-09-30) | Plan it with the next gather'; G-13 'Planned move in 0 days'. Correction applied: the grazing 'Day 24 vs Day 25' counting complaint is a matter of convention (Day 24 agrees with '(3 days over)' and the tooltip), so it is an optional rewording, not a defect; only the 'in 0 days' wording is registered. The time skeptic asked for one agreed wording.

**Expected behaviour.** 'Due today (2026-09-30)' and 'Move planned for today', with a same-day action ('Do it today or set a new date').

**Operational consequence.** Reads like a bug, and 'plan it with the next gather' for something due today means it goes overdue tomorrow unless someone acts.

**Proposed regression test.** TIME-18 fixture: problems 'Move planned for today' and 'Due today (2026-09-30)'; a row due Oct 1 still reads 'Due in 1 day (2026-10-01)'.

**Proposed fix (recommendation).** Special-case 0 days in both messages with one agreed wording and a same-day action.

**Files affected.** `exceptions.js` (0-day wording); `tests/exceptions.test.mjs`.

**Related findings.** [UI-13](#ui-13)

<a id="ui-07"></a>
#### UI-07: Empty and zero wording: 'Nothing in all needs attention.', and '−0.0%', '−0%' and 'Under by \$0' when exactly on budget

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Interface

**Scope note.** The '−NaN% \$0 of \$0' tile with no budget rows (AB-05) is kept here as evidence but owned by LOAD-01: an empty or missing budget file must show CAN'T TELL, not a number.

**Problem.** The empty message is built as 'Nothing in &lt;filter> needs attention.' for every filter, including All, and the sign of the spend figure is taken before rounding.

**Where in the code.** app.js:69 (empty message), :57 (tile sign; divides by tb), :193 (label sign), :194 (tooltip Over/Under)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/render.repro.mjs` (CASE R18, R19); `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE AB-04, AB-05); `node docs/audit/diagnostics/states-check.mjs http://127.0.0.1:8801/ <outDir>` (scenario all-clear).
- Actual output, quoted from the evidence:

  > 'Nothing in all needs attention.'; 'SPEND VS BUDGET −0.0% \$88,400 of \$88,400, season to date'; '−0%' bar labels; 'Under by \$0'; 'SPEND VS BUDGET −NaN% \$0 of \$0, season to date'.

- How it was verified: confirmed (baseline B10, verify_render F8, verify_healthbudget F11). Evidence: R18 'Nothing in all needs attention.'; AB-04 tile 'SPEND VS BUDGET −0.0% \$88,400 of \$88,400', labels '−0%' x6, tooltip 'Under by \$0'; AB-05 tile 'SPEND VS BUDGET −NaN% \$0 of \$0'. The render skeptic extended the fix to the chart labels and tooltip.

**Expected behaviour.** 'Nothing needs attention.' on All; '0.0%' and 'On budget' when spend equals budget; a 'No budget loaded' state (CAN'T TELL, LOAD-01) instead of NaN.

**Operational consequence.** The good-day message reads like a template bug, and on budget is shown as under budget.

**Proposed regression test.** All-clear data: the message equals 'Nothing needs attention.'; the Water filter still says 'Nothing in water needs attention.' Every actual equal to budget: tile '0.0%' and '\$88,400 of \$88,400', no '−0%' label, tooltip 'On budget'. The header-only budget.csv case is tested under LOAD-01.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): season totals and tile percent = `(88400, 89303, 1.0)`.

**Proposed fix (recommendation).** Special-case the All filter; take the sign from the rounded value; 'On budget' when variance is 0; no budget figure when the budget file is empty or missing (LOAD-01).

**Files affected.** `app.js` (empty message, tile sign, chart labels, tooltip); browser test (new; the repository has none yet).

**Related findings.** [LOAD-01](#load-01), [BUD-03](#bud-03)

<a id="ui-08"></a>
#### UI-08: The rules table prints floating-point noise when a threshold is changed (0.07 shows as '7.000000000000001-10%')

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Interface

**Problem.** The rules table multiplies settings by 100 and prints the raw floating-point result.

**Where in the code.** app.js:213-214 (R.budgetSerious \* 100, R.budgetWarn \* 100); the gain rows use the same pattern

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE AB-06).
- Actual output, quoted from the evidence:

  > 'Budget Warning A category is 7.000000000000001-10% over budget'.

- How it was verified: confirmed (verify_healthbudget F16), no corrections. Evidence: AB-06 (exceptions.js served with budgetWarn 0.07) 'Budget Warning A category is 7.000000000000001-10% over budget'.

**Expected behaviour.** 'A category is 7-10% over budget'.

**Operational consequence.** The README invites changing the settings, and the first change puts visible float noise in the rules copy.

**Proposed regression test.** With budgetWarn 0.07 the Budget warning rules row contains '7-10% over budget'.

**Proposed fix (recommendation).** Format every settings-derived percentage with one helper (+(v \* 100).toFixed(2)), and label the settings as demo values in the same table.

**Files affected.** `app.js` (`rules()`); browser test (new; the repository has none yet).

**Related findings.** [BUD-05](#bud-05)

<a id="test-01"></a>
#### TEST-01: The water tests cannot catch a broken rule: removing the 'don't judge a silent tank' line and moving every threshold boundary still pass

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Tests

**Problem.** The water tests check one point per rule, and the silent-sensor test uses a tank at 98.5%, which no level rule could flag. Removing the silent-tank `continue` or moving any threshold boundary still passes.

**Where in the code.** tests/exceptions.test.mjs:34-36 (the silent-sensor test uses T6 at 98.5%, which no level rule could flag), :42-52 (one point per rule, no boundaries); exceptions.js:107

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.verify.mjs` (Part B: copies exceptions.js, data/ and tests/ to a temp dir, applies one change at a time and runs `node --test tests/exceptions.test.mjs`).
- Actual output, quoted from the evidence:

  > 'SURVIVES silent tank also judged (continue removed) (pass 8, fail 0)'; SURVIVES for silence >= to >, drop >= to >, critical &lt; to &lt;=, low &lt; to &lt;=, no sort, drop window 24 h to 18 h. Only 'drop window 24 h -> 30 h' is killed (pass 7, fail 1).

- How it was verified: confirmed (the water skeptic's own missed finding M1). Evidence: water.verify.mjs Part B 'SURVIVES silent tank also judged (continue removed) (pass 8, fail 0)'; also surviving: silence >= to >, drop >= to >, critical &lt; to &lt;=, low &lt; to &lt;=, no sort, and drop window 24 h to 18 h; only 'drop window 24 h -> 30 h' is killed. The skeptic verified six added cases pass on the current code and each kills a surviving mutant. Registrar re-ran water.verify.mjs Part B on 2026-10-16: 7 mutants survive.

**Expected behaviour.** Each change fails at least one test.

**Operational consequence.** A later edit could double-flag silent tanks or shift an alert boundary with CI green; the README's claim that the tests check the thresholds is only partly true.

**Proposed regression test.** Add, with as_of 2026-09-30T18:00, T1 in P1 and no moves: (1) readings 09-29T06:00 12 and 12:00 10 give exactly 1 serious row; (2) a last reading at 09-29T18:00 gives serious and at 09-29T19:00 gives no row; (3) 80 to 50 over 24 h gives critical and 80 to 50.1 gives no row; (4) flat levels 24.9 / 25 / 39.9 / 40 give critical / warning / warning / none; (5) 09-29T18:00 80, 09-30T00:00 50, 09-30T18:00 45 give 'Dropped 35 points in 24 hours, now 45%'; (6) the same rows newest-first give the same message. Re-run Part B: no mutant survives.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): TEST-01 hours silent for last readings 09-29T12:00, 09-29T18:00, 09-29T19:00 = `(30.0, 24.0, 23.0)`; TEST-01 falls 80 to 50, 80 to 50.1 (one decimal), 80 to 45 = `(30, 29.9, 35)`.

**Proposed fix (recommendation).** Add the six boundary cases to tests/exceptions.test.mjs (they encode the current demo settings, not validated thresholds), and optionally run the small mutation check in CI.

**Files affected.** `tests/exceptions.test.mjs`; optional: `.github/workflows/test.yml` (mutation check in CI).

**Related findings.** [WAT-03](#wat-03), [WAT-08](#wat-08), [WAT-09](#wat-09), [TEST-02](#test-02)

<a id="test-02"></a>
#### TEST-02: No test covers the grazing rule boundaries: changing the over-plan or grace comparisons, or the plural wording, still passes the suite

Severity **low** · Status **confirmed** · Phase 1 (Fix now) · Effort **S** · Area: Tests

**Problem.** The grazing rule has only two assertions, neither at a boundary, so changing the over-plan or grace comparisons, or the plural wording, still passes.

**Where in the code.** tests/exceptions.test.mjs:17 and :57 (the only grazing assertions); exceptions.js:120 (over > 0), :123 (over >= -R.graceDays), :121 and :124 (plurals)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/registry.extra.mjs` (Part 2: copies data/ and tests/ to a temp dir with a mutated exceptions.js and runs `node --test tests/exceptions.test.mjs` per mutation).
- Actual output, quoted from the evidence:

  > 'SURVIVES grace boundary >= -> > (pass 8, fail 0)'; 'SURVIVES over-plan boundary > -> >='; 'SURVIVES warning plural always 's''; 'SURVIVES serious plural always 's''. Only 'grace window widened by 5 days' is killed (pass 7, fail 1), through the total-count test.

- How it was verified: confirmed (the grazing skeptic's own missed finding M1). The skeptic's mutation scripts lived in scratch space, so the registrar added the same mutations to docs/audit/diagnostics/registry.extra.mjs (Part 2) and ran it on 2026-10-16: 'SURVIVES grace boundary >= -> > (pass 8, fail 0)', 'SURVIVES over-plan boundary > -> >=', 'SURVIVES warning plural always 's'', 'SURVIVES serious plural always 's'', 'killed grace window widened by 5 days (pass 7, fail 1)', matching the skeptic's output.

**Expected behaviour.** At least one test fails for each boundary mutation, as the water threshold test intends.

**Operational consequence.** A change could flag cattle as over plan on the day the move is due, or cut the 2-day heads-up to 1 day, with CI green.

**Proposed regression test.** 'grazing rules at their thresholds': one open Sand Hills move (P3, 21-day plan), as_of 2026-09-30T18:00: in_date 2026-09-08 gives one serious '(1 day over)'; 2026-09-09 gives a warning (due today, worded per UI-06); 2026-09-10 'Planned move in 1 day'; 2026-09-11 'Planned move in 2 days'; 2026-09-12 no Grazing row. Re-run registry.extra.mjs Part 2: every mutant killed.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): TEST-02 days over a 21-day plan on Sep 30 for in_dates Sep 8..12 = `[1, 0, -1, -2, -3]`.

**Proposed fix (recommendation).** Add the threshold test above to tests/exceptions.test.mjs, mirroring the water threshold test. The 2-day grace is a demo setting; the test pins current behaviour, not a validated value.

**Files affected.** `tests/exceptions.test.mjs`.

**Related findings.** [TEST-01](#test-01), [UI-06](#ui-06)

---

## 3. Phase 2: Build next

Manager workflow and usability: the morning review, filters, alert explanations with readings and thresholds, a data
freshness and coverage strip, keyboard and touch access to chart details, phone-friendly tables, a printable crew
briefing, rest-period checks using min_rest_days, consequence-aware ranking within a severity, and optional per-device
notes labelled "this device only" that never clear a condition. No Phase 2 finding is high severity.

The rest-period check ([GRZ-04](#grz-04)) has to land together with the generator fix for the example season ([GRZ-05](#grz-05)), or it adds
new alarms to the committed data.

### 3.1 Medium severity (7)

<a id="wat-05"></a>
#### WAT-05: A tank whose sensor stopped less than 24 hours ago is judged on its old reading and counted OK, with no sign of how old the shown level is

Severity **medium** · Status **design-limitation** · Phase 2 (Build next) · Effort **S** · Area: Water

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Until a tank has been silent for 24 hours, its last reading is treated as current, and the page never shows how old that reading is.

**Where in the code.** exceptions.js:104-115 (silence flagged only at 24 h or more; the level and drop rules treat the last reading as current and never state its age); app.js:82 (heading prints the old level); app.js:47, :55 (tile counts the tank OK)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.verify.mjs` (CASE V-M3, node and Chromium). Input: committed data with the T4 rows after 2026-09-30T00:00 removed (T4 ends 67.5 at 09-29T12:00, 56.0 at 18:00, 44.5 at 09-30T00:00).
- Actual output, quoted from the evidence:

  > node: 'T4 last=2026-09-30T00:00 level=44.5 silentHours=18 drop24h=20.5; water rows: ["critical | Tank T2 (Windmill) | Down to 11.8% full","serious | Tank T6 (Cedar Draw) | No reading for 42 hours; last level 98.5%"]'. Chromium: tile 'WATER TANKS OK 6 of 8 2 need a look', heading 'T4 Lone Tree 44.5%', 9 exception rows.

- How it was verified: design-limitation (the water skeptic's own missed finding M0). Evidence: V-M3 (T4 rows after 2026-09-30T00:00 removed): node 'T4 last=2026-09-30T00:00 level=44.5 silentHours=18 drop24h=20.5' and only the T2 and T6 water rows; Chromium tile 'WATER TANKS OK 6 of 8 2 need a look', heading 'T4 Lone Tree 44.5%', 9 exception rows. Registrar re-ran water.verify.mjs V-M3 on 2026-10-16: same.

**Expected behaviour.** T4 flagged: the last reading is 18 h old (09-30T00:00 to 18:00) at 44.5% after falling 23 points in 12 h (67.5 to 44.5). Tile '5 of 8, 3 need a look'. The shown level carries its time ('44.5% at 00:00').

**Operational consequence.** A power or radio fault often takes out the sensor along with the pump or solar. Mid-leak, the report can show an all-clear for up to 24 hours (four missed 6-hour readings), and a once-a-morning check can miss a dry tank by a full day.

**Proposed regression test.** V-M3 data: one T4 Water row whose problem contains '18 hours' and '44.5%'. Committed data: still exactly 3 Water rows (every other tank reports at 18:00 and T6 is already silent, so a 12-hour 'late' rule adds no false alarm).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): tanks whose newest reading is at the as-of time = `['T1', 'T2', 'T3', 'T4', 'T5', 'T7', 'T8']`; T4 levels 09-29T12:00, 18:00, 09-30T00:00 (WAT-05) = `(67.5, 56.0, 44.5)`.

**Proposed fix (recommendation).** Add a 'sensor late' warning (demo setting: 12 hours, two missed 6-hour readings): 'Last reading N h ago (L%)'. Escalate when the readings before it were falling faster than the drop rule's rate. Show the reading time in the chart heading and in the low and leak rows ('10% at 18:00'). Belongs with the Phase 2 freshness and coverage strip.

**Files affected.** `exceptions.js` ('sensor late' rule); `app.js` (reading time in headings and rows); `tests/exceptions.test.mjs`.

**Related findings.** [LOAD-04](#load-04), [WAT-09](#wat-09), [LOAD-05](#load-05)

<a id="grz-04"></a>
#### GRZ-04: min_rest_days is never read: stays that start inside a pasture's own minimum rest go unflagged

Severity **medium** · Status **design-limitation** · Phase 2 (Build next) · Effort **S** · Area: Grazing

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** `pastures.csv` carries `min_rest_days`, but no code reads it. Neither the README nor the rules table claims a rest rule; the README only lists the column.

**Where in the code.** exceptions.js:54-61 and :118-125 (no rest logic); data/pastures.csv column min_rest_days; README.md (pastures.csv 'minimum rest days')

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/grazing.repro.mjs` (CASE G-14, G-15). Committed data, unchanged.
- Actual output, quoted from the evidence:

  > G-14: 'exceptions.js: 0 references, app.js: 0 references'. G-15: 'rows mentioning rest: 0  ## occupancy calendar says: Cows@P7 rest 6/60, Heifers@P4 rest 34/45, Yearlings@P3 rest 76/60'.

- How it was verified: design-limitation (verify_grazing F5; the auditor said confirmed). Evidence: 'exceptions.js: 0 references, app.js: 0 references'; the skeptic's independent Python check gives 'P7 Cows 2026-09-12 rest 6 min 60 SHORT', 'P4 Heifers 2026-09-19 rest 34 min 45 SHORT', 'P3 Yearlings 2026-09-06 rest 76 min 60 ok'. Correction applied: neither the README nor the rules table claims a rest rule (the README only lists the column), so this is a gap in the rule set, not a code defect. Medium kept for the credibility cost of a shipped but unused column.

**Expected behaviour.** Two rows: Cows in South Divide (Yearlings left Sep 6, Cows entered Sep 12: 6 of a 60-day minimum) and Heifers in Lone Tree (left Aug 16, re-entered Sep 19: 34 of 45). The rest minimums are the example file's own values, not validated agronomic guidance.

**Operational consequence.** Rest is the other half of a rotation. A grazing-literate reviewer sees the column and assumes it is enforced, while the page says nothing about 180 pairs grazing a pasture 54 days short of its own rest setting.

**Proposed regression test.** On data that meets GRZ-05 first (or with the committed data and the 'nothing else' count updated): rows matching /rest/i for 'Cows in South Divide' containing 6 and 60, and 'Heifers in Lone Tree' containing 34 and 45. Hand values as above.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): rest before the current stays (GRZ-04) = `{('P7', 'Cows'): (6, 60), ('P4', 'Heifers'): (34, 45), ('P3', 'Yearlings'): (76, 60)}`.

**Proposed fix (recommendation).** Phase 2: compute rest before each stay (in_date minus the latest out_date in that pasture by any group) and warn when it is below min_rest_days ('Went in after 6 of 60 rest days'). Add the rule to RULES, the rules table and the README, marked as a demo setting. Do this together with GRZ-05 so the example season does not flood with rest warnings.

**Files affected.** `exceptions.js` (rest rule and setting); `app.js` (rules table); `README.md`; `scripts/generate_data.py` (data files are generated; CI checks they match) with GRZ-05; `tests/exceptions.test.mjs`.

**Related findings.** [GRZ-05](#grz-05), [GRZ-08](#grz-08)

<a id="grz-05"></a>
#### GRZ-05: The example season is not credible as a rotation: two pastures held two groups at once and 11 of 13 sequential re-entries are short of the file's own minimum rest

Severity **medium** · Status **confirmed** · Phase 2 (Build next) · Effort **M** · Area: Grazing

**Problem.** The generator builds each group's moves independently, with no shared pasture calendar (`scripts/generate_data.py:49-64`). The fictional season therefore has two pastures holding two groups at once and 11 of 13 sequential re-entries short of the file's own minimum rest, and the page reports none of it.

**Where in the code.** scripts/generate_data.py:49-64 (moves(): each group's plan built independently, no shared pasture calendar); tests/exceptions.test.mjs:26-28 ('nothing else' asserts 10)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/grazing.repro.mjs` (CASE G-16: day-by-day occupancy calendar over data/moves.csv and data/pastures.csv).
- Actual output, quoted from the evidence:

  > G-16: 'pastures with two groups at once: P2 2026-07-24..2026-07-30 (7 days, Cows+Yearlings); P4 2026-06-25..2026-07-05 (11 days, Heifers+Yearlings) ... dashboard rows about any of this: 0'. Skeptic: 'P5 Heifers 2026-08-26 rest 1 min 45 SHORT', 'P6 Cows 2026-07-31 rest 7'.

- How it was verified: partially-confirmed (verify_grazing F6). The skeptic's independent Python check found the same overlaps ('P2' Cows and Yearlings Jul 24-30, 7 days; 'P4' Heifers and Yearlings Jun 25-Jul 5, 11 days) and 're-entries 13 short 11'. Corrections applied: the counts are restated as 11 of 13 sequential re-entries short of minimum rest plus 2 entries into a pasture another group still occupied (the auditor's '13 of 15' counted the overlaps twice); the regression test should expect 2 overlaps and 11 short rests today; moves() is at scripts/generate_data.py:49-64 (not 51-66). The Cows' 22-day Cedar Draw stay is hard-coded ('P6', 22) and is not in PLANTED.

**Expected behaviour.** For an example presented as a realistic season: no unplanned pasture sharing and re-entries that respect min_rest_days, or the dashboard reports them. Hand-checked overlaps: Windmill Jul 24-30 (Cows Jul 13-31 with Yearlings Jul 24-Aug 11); Lone Tree Jun 25-Jul 5 (Yearlings Jun 22-Jul 6 with Heifers Jun 25-Jul 9).

**Operational consequence.** The page claims it finds exactly the 10 planted problems and nothing else, which holds only because no rule looks at rest or sharing. A ranch-manager reviewer reading the rotation chart sees cattle sent back into pastures 1-7 days after the last group left, against the file's own 45-60 day minimums, which undercuts the piece's credibility.

**Proposed regression test.** A data test over data/moves.csv and data/pastures.csv with an independent day-by-day occupancy calendar: no date on which a pasture holds two groups and every re-entry has rest >= min_rest_days, unless listed in PLANTED. Today it would report 2 overlaps and 11 short rests; after the generator fix, 0 and 0 (or only the planted ones).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): pastures holding two groups at once (GRZ-05) = `{'P2 Cows+Yearlings': ('2026-07-24', '2026-07-30', 7), 'P4 Heifers+Yearlings': ('2026-06-25', '2026-07-05', 11)}`; sequential re-entries and how many are short of min_rest_days (GRZ-05) = `(13, 11)`.

**Proposed fix (recommendation).** Rebuild moves() with one shared pasture calendar that assigns each group the next unoccupied pasture whose rest meets min_rest_days, adjusting planned days so a 3-group, 8-pasture rotation is feasible. Plant at most one or two rest or sharing problems on purpose, list them in PLANTED and the README, and update the 'nothing else' count when GRZ-04 lands. The example ranch stays fictional.

**Files affected.** `scripts/generate_data.py` (`moves()`), regenerating `data/moves.csv`; `README.md` (planted list); `tests/exceptions.test.mjs` ('nothing else' count; occupancy test).

**Related findings.** [GRZ-04](#grz-04), [GRZ-06](#grz-06)

<a id="gain-09"></a>
#### GAIN-09: An individual animal losing weight is never named while its whole group is flagged

Severity **medium** · Status **design-limitation** · Phase 2 (Build next) · Effort **S** · Area: Gain

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Individual animals are listed only when their group is not already serious (the README's 'No noise' choice), so an animal losing weight is not named while its whole group is flagged.

**Where in the code.** exceptions.js:134 (if (slow.length && !groupLow)); README 'No noise' design choice

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.missed.mjs` (CASE M3).
- Actual output, quoted from the evidence:

  > 'H026 Jul 20=1130; rows=["serious | Heifers | 0.37 lbs/day since 2026-07-20 vs 1.0 target","warning | 6 yearlings | ..."]; any row mentions H026: false'.

- How it was verified: design-limitation (the gain skeptic's own missed finding M1). Evidence: gain.missed M3 (H026's Sep 15 weight 959, Jul 20 1130, -171/57 = -3.0 lbs/day) 'rows=["serious | Heifers | 0.37 lbs/day since 2026-07-20 vs 1.0 target", ...]; any row mentions H026: false'. Python: no committed heifer or yearling has a negative ADG, so an 'ADG below 0' row keeps the committed count at 10. Registrar re-ran gain.missed.mjs M3 on 2026-10-16: same.

**Expected behaviour.** A row naming H026 (losing 3.0 lbs/day) next to the serious Heifers row.

**Operational consequence.** An animal losing weight for eight weeks needs to be seen as an individual. The report gives only the group-level action, with no tag to pull and look at.

**Proposed regression test.** H026 Jul 20 1130 and Sep 15 959: a Gain row whose text includes 'H026'. Committed data: findExceptions length still 10 if the extra rule is 'ADG below 0'.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): H026 Jul 20 and Sep 15 weights, ADG = `(1130.0, 1136.0, 0.105)`; any committed heifer or yearling with negative ADG (GAIN-09 control) = `False`; GAIN-09 -171/57 = `-3.0`.

**Proposed fix (recommendation).** Always list animals whose ADG is below 0 (or below a low demo floor) in their own row, even when the group is flagged, with the action 'pull and look at these animals; call the veterinarian if one looks unwell'. Observation and escalation only, no treatment advice.

**Files affected.** `exceptions.js`; `README.md` ('No noise' text); `tests/exceptions.test.mjs`.

**Related findings.** [GAIN-07](#gain-07), [UI-16](#ui-16)

<a id="ui-01"></a>
#### UI-01: Chart details can only be opened with a mouse hover: a tap on a phone shows nothing, gain dots are 3.9 px targets, and keyboard or screen-reader users cannot reach any chart detail

Severity **medium** · Status **confirmed** · Phase 2 (Build next) · Effort **M** · Area: Interface

**Problem.** Chart details appear only on `pointermove`/`pointerleave`. A tap delivers no `pointermove`, chart marks are not focusable, and gain dots are 3.9 px targets.

**Where in the code.** app.js:26-33 (hover() listens only for pointermove and pointerleave), :100-107 (water hit rect, same pattern), :169 (dot r 3.5 in a 560-wide viewBox), :83, :119, :155, :183 (role=img only, no focusable marks); index.html:59, :95 ('Hover a dot for the tag.'); README.md:52 ('Every chart has hover details ... works on a phone')

**Evidence.**

- Reproduce (from the repository root): `python3 -m http.server 8801 --bind 127.0.0.1 --directory . &` then `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ <outDir>` (phone taps, keyboardWalk); `node docs/audit/diagnostics/render.skeptic.browser.mjs <scratchDir> 8932` (section M1).
- Actual output, quoted from the evidence:

  > 'tap water: target=132.4x48.8px tipVisible=false', 'tap grazing: target=52.1x14.7px tipVisible=false', 'tap gain: target=3.9x3.9px tipVisible=false', 'tap budget: target=86x10.2px tipVisible=false'. Desktop tab stops: the six chips, then '7:body (focus left the page content)'. 40 Tab presses reach only the chips and BODY.

- How it was verified: confirmed (baseline B2 and B3, not skeptic-reviewed; the render skeptic's own missed finding M0, which also corrects render F10's 'on a phone' framing). Evidence: 'tap gain: target=3.9x3.9px tipVisible=false'; 'tooltip display after a tap: {"gain dot":"none","budget bar":"none","water chart":"none","grazing bar":"none"}'; 'pointer events a tap delivers to a gain dot: ["pointerdown","pointerup","pointerleave","click"]'; 'keyboard tooltips: {"tabStopsInsideCharts":0,"tooltipShownOnAnyFocus":false}'. No alert is lost (the table works), so medium. Only Chromium with touch emulation was run; real phones and screen readers were not tested. Registrar re-ran browser-check.mjs on 2026-10-16: tipVisible=false on every tap, gain target 3.9x3.9 px, 'tabStopsInsideCharts:0'.

**Expected behaviour.** A tap shows a mark's details and keeps them until the next tap (the first gain dot: 'H001 (Heifers)', 0.54 lbs/day, (1169 - 1138)/57 = 0.544); targets are big enough to hit; keyboard users reach the same details, or each chart has a short data table.

**Operational consequence.** On the phone a manager carries, which tag a gain dot is, when a tank reading was taken, move dates and budget dollars in the charts are all unavailable, and the README's phone claim does not hold. Keyboard and screen-reader users get only a generic chart label.

**Proposed regression test.** Playwright 390x844 with isMobile and hasTouch: tap the H026 dot; #tip is visible and contains 'H026', '0.11 lbs/day' and 'Now 1136 lbs' ((1136 - 1130)/57 = 0.105). Tap the Repairs bar: 'Budget \$7,200', 'Actual \$9,000', 'Over by \$1,800'. Desktop: Tab past the chips reaches a control in #gain or #water, or each chart has a data table where T4 reads 'Sep 30, 6 PM: 10%'.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): H001 Jul 20 and Sep 15 weights, ADG = `(1138.0, 1169.0, 0.544)`; H026 Jul 20 and Sep 15 weights, ADG = `(1130.0, 1136.0, 0.105)`; Repairs budget, actual, over \$, over % = `(7200, 9000, 1800, 25.0)`.

**Proposed fix (recommendation).** Phase 2: show and pin the tooltip on pointerdown or click for touch and dismiss it on a tap elsewhere; pick the nearest gain dot within about 16 px of a tap; give each chart a 'Show data' table or focusable marks with focus handlers; change the note to 'Hover or tap'. Until then, reword the README's phone claim (honest copy).

**Files affected.** `app.js` (tap and focus handlers, data tables); `index.html` (notes at lines 59 and 95); `README.md` (line 52 phone claim); browser test (new; the repository has none yet).

**Related findings.** [UI-02](#ui-02), [UI-03](#ui-03), [UI-11](#ui-11)

<a id="ui-02"></a>
#### UI-02: On a phone the 'Problem' and 'First step' columns are off-screen and budget differences are cut mid-number, with no cue that the table scrolls

Severity **medium** · Status **confirmed** · Phase 2 (Build next) · Effort **M** · Area: Interface

**Scope note.** Baseline finding; no skeptic reviewed it. 'Confirmed' here means the registrar re-ran browser-check.mjs on 2026-10-16 and measured the same result.

**Problem.** The exception table has five columns inside a horizontally scrolling box. At phone width the last two columns are out of view and nothing shows that the table scrolls.

**Where in the code.** index.html:45 (.scroll { overflow-x: auto }); app.js:66-69 (5-column exceptions table); app.js:203-205 (budget table)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ <outDir>` (phone viewport, overflow()).
- Actual output, quoted from the evidence:

  > 'exceptions: scrolls=true cut=[Problem,First step]'; 'budgetTable: scrolls=true cut=[Difference]'.

- How it was verified: confirmed (baseline B4; not skeptic-reviewed). Evidence: 'exceptions: scrolls=true cut=[Problem,First step]' (clientWidth 316, scrollWidth 413); 'budgetTable: scrolls=true cut=[Difference]'; screenshots show 'DIFFERENC' and '+\$1,80'. Registrar re-ran browser-check.mjs on 2026-10-16: the same cut columns.

**Expected behaviour.** At 390 px every exception row shows what is wrong and the first step without sideways scrolling, and dollar values are fully visible.

**Operational consequence.** The page's main design point is that every row says what to do so it can go to a crew lead; on a phone the 'what to do' column is hidden and over-budget amounts are truncated.

**Proposed regression test.** At 390x844, with a stacked layout, each exception row's First step text is inside the viewport; the Repairs Difference '+\$1,800' (9,000 - 7,200) is fully inside its container.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Repairs budget, actual, over \$, over % = `(7200, 9000, 1800, 25.0)`.

**Proposed fix (recommendation).** Phase 2 phone tables: below about 600 px render each exception as a stacked row (severity and subject, problem, first step) and tighten the budget table.

**Files affected.** `index.html` (CSS); `app.js` (stacked rows); browser test (new; the repository has none yet).

**Related findings.** [UI-01](#ui-01), [UI-03](#ui-03)

<a id="ui-03"></a>
#### UI-03: Chart text renders at about 7 px on a phone

Severity **medium** · Status **confirmed** · Phase 2 (Build next) · Effort **M** · Area: Interface

**Scope note.** Baseline finding; no skeptic reviewed it. 'Confirmed' here means the registrar re-ran browser-check.mjs on 2026-10-16 and measured the same result.

**Problem.** Charts use a fixed `viewBox` (260 or 560 units wide) scaled to the container, so 12-unit chart text shrinks to about 7 px on a phone.

**Where in the code.** index.html:50 (svg.chart text 12px in viewBox units); app.js:79 (W=260), :115, :151, :179 (W=560) scaled by width:100%

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ <outDir>` (inventory: effective px = 12 x rendered width / viewBox width).
- Actual output, quoted from the evidence:

  > Phone: 'mini:7 mini:7 mini:7 mini:7 mini:7 mini:7 mini:7 mini:7 grazing:6.8 gain:6.8 budgetChart:6.8'.

- How it was verified: confirmed (baseline B5; not skeptic-reviewed). Evidence: phone 'chart text (effective px): mini:7 ... grazing:6.8 gain:6.8 budgetChart:6.8'; desktop 11.8 to 13. Registrar re-ran browser-check.mjs on 2026-10-16: mini 7 px, others 6.8 px.

**Expected behaviour.** Chart labels at least about 11 px as rendered.

**Operational consequence.** Outdoors on a phone, axis labels, pasture IDs on grazing bars, the '+3d' marker and budget percentages are hard to read.

**Proposed regression test.** At 390 px, for each svg.chart, 12 x rendered width / viewBox width >= 11 (today 316/560 x 12 = 6.8).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): UI-03 12 x 316 / 560 px = `6.7714`.

**Proposed fix (recommendation).** Phase 2: draw each chart at its container's CSS width (viewBox from clientWidth, redraw on resize), or a one-column water grid on small screens.

**Files affected.** `app.js` (draw at container width); `index.html` (CSS); browser test (new; the repository has none yet).

**Related findings.** [UI-02](#ui-02), [UI-12](#ui-12)

---

### 3.2 Low severity (18)

<a id="load-05"></a>
#### LOAD-05: No data-age check: an old export is shown as the current report, and the as-of line has no time zone

Severity **low** · Status **design-limitation** · Phase 2 (Build next) · Effort **S** · Area: Data loading

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Scope note.** The missing zone in the as-of line is fixed in Phase 1 by TIME-02 (one as-of policy; the header shows the ranch zone). This entry's Phase 2 part is the age check against the clock and the freshness strip.

**Problem.** The only freshness signal is the 'Data as of ...' line, taken from `meta.csv` with no time zone and never compared with the clock. For the frozen demo that is accurate; with real data an old export would be shown as the current report.

**Where in the code.** app.js:223 (the as-of line is the only freshness signal); exceptions.js:95 (every rule is relative to meta.as_of); data/meta.csv (as_of typed by hand in the generator)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/render.skeptic.browser.mjs <scratchDir> 8932` (section M4: page.clock fixed at 2026-10-16T09:00); `node docs/audit/diagnostics/time.browser.mjs` (CASE TB-C1: header under four zones).
- Actual output, quoted from the evidence:

  > {"now":"Fri Oct 16 2026 09:00","asof":"Example Ranch (fictional), 4,300 acres in 8 pastures. Data as of September 30, 2026 at 6:00 PM.","ageWords":null}; TB-C1 header 'Data as of September 30, 2026 at 6:00 PM.' in all four zones.

- How it was verified: design-limitation (verify_time F15; the render skeptic's own missed finding M3, also a design limitation). Evidence: with the browser clock fixed at 2026-10-16 09:00 the page shows 'Data as of September 30, 2026 at 6:00 PM.' and no age wording (ageWords null); grep finds no clock read or zone in app.js or exceptions.js. The label fits the frozen demo; the back-dated as_of consequence belongs to TIME-01.

**Expected behaviour.** Real-data mode: a banner such as 'Data is 15 days old (as of Sep 30, 6:00 PM CDT); check the export' when the clock is well past as_of (Sep 30 18:00 to Oct 16 09:00 = 15 d 15 h), and the zone in the header. Demo mode: an explicit 'example data frozen at Sep 30, 2026' label instead of an age alarm.

**Operational consequence.** Fine for the frozen fictional demo. With real data, a stalled export keeps showing the last run's alerts as current, and every sensor looks recently reported because the silent-sensor rule is measured against as_of, not the clock.

**Proposed regression test.** freshness(asOf, now): as_of 2026-09-30T18:00 and now 2026-10-16T09:00 gives 15 days 15 hours and a banner containing '15 days'; now 2026-09-30T20:00 gives no banner. With the demo flag on: the label says example data and no banner shows.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): LOAD-05 as_of to a clock of 2026-10-16T09:00: days, hours = `(15, 15)`.

**Proposed fix (recommendation).** Phase 2 freshness strip: compute age from the clock against as_of (and against the newest observation per file), show it with the ranch zone, and warn past a demo-setting threshold. Keep a demo flag so the fictional page says 'example data' rather than raising a false alarm.

**Files affected.** `app.js` (freshness strip); a demo flag (its location is not specified in the registry).

**Related findings.** [TIME-01](#time-01), [TIME-02](#time-02), [GAIN-08](#gain-08)

<a id="wat-09"></a>
#### WAT-09: A silent tank last seen nearly empty and falling is only 'serious', ranked below every critical row

Severity **low** · Status **design-limitation** · Phase 2 (Build next) · Effort **S** · Area: Water

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** A silent tank is always 'serious', and its last level and trend are discarded (`continue` at `exceptions.js:107`), even when it was last seen nearly empty and falling.

**Where in the code.** exceptions.js:104-108 (silence always gives serious; the last level and trend are discarded by continue at :107)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.repro.mjs` (CASE W-12: T1 2026-09-28T18:00 60, 2026-09-29T06:00 30, 2026-09-29T12:00 8, then nothing).
- Actual output, quoted from the evidence:

  > 'serious | Tank T1 (North Flat) | No reading for 30 hours; last level 8%'.

- How it was verified: design-limitation (verify_water F8), severity lowered from medium to low: the row already shows 'last level 8%', its action says 'today', and the README documents that a silent sensor's last level 'isn't judged'. Evidence: W-12 'serious | Tank T1 (North Flat) | No reading for 30 hours; last level 8%' after a 52-point fall in 18 hours. The existing test for 'not judged' cannot fail (TEST-01).

**Expected behaviour.** Critical: last known level 8% (under the 25% demo line) after a 52-point fall in 18 hours (60 - 8), and no reading for 30 hours.

**Operational consequence.** The tank most likely to be dry, whose sensor may have lost power with the pump, is listed below an empty-pasture low tank, with 'check by eye today' rather than 'go now'.

**Proposed regression test.** W-12 data: one T1 row, severity critical, problem containing '30 hours' and '8%'. Keep: a silent tank last seen at 98.5% (T6 in the committed data) stays serious.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): T6 last reading time and level = `('2026-09-29T00:00', 98.5)`.

**Proposed fix (recommendation).** If a tank is silent and its last valid level was under the critical line or falling at the leak rate, emit critical ('No reading for N hours; last seen L% and falling'). Update the README's 'isn't judged' line and add a test (TEST-01).

**Files affected.** `exceptions.js`; `README.md` ('isn't judged' line); `tests/exceptions.test.mjs`.

**Related findings.** [WAT-05](#wat-05), [TEST-01](#test-01)

<a id="wat-10"></a>
#### WAT-10: A sensor that keeps sending the same frozen value is treated as a healthy tank

Severity **low** · Status **design-limitation** · Phase 2 (Build next) · Effort **S** · Area: Water

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Sensor health is judged only by the time of the last reading. A sensor that repeats one value looks like a steady, healthy tank.

**Where in the code.** exceptions.js:104 (sensor health judged only by the time of the last row); exceptions.js:109-115

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.verify.mjs` (CASE V-M4, V-M4b).
- Actual output, quoted from the evidence:

  > '["critical | Tank T2 (Windmill) | Down to 11.8% full","serious | Tank T6 (Cedar Draw) | No reading for 42 hours; last level 98.5%"]'. No T4 row.

- How it was verified: design-limitation (the water skeptic's own missed finding M3). Evidence: V-M4 (every T4 level from 2026-09-29T18:00 set to 67.5) gives only the T2 and T6 water rows; T4 is counted OK. Control V-M4b: in the committed data the longest run of identical readings below 98% is 2, so a '4 or more identical readings below 98%' rule adds no false alarm. Registrar re-ran water.verify.mjs V-M4 on 2026-10-16: same.

**Expected behaviour.** A T4 flag such as 'Reading unchanged at 67.5% for 30 hours; check the sensor' (09-29T12:00 to 09-30T18:00 = 30 h).

**Operational consequence.** A fouled sensor or a logger repeating its last value reads as a steady, healthy tank; in this repro the T4 leak on the heifers' tank is invisible.

**Proposed regression test.** V-M4 data: one T4 Water row containing '67.5%' and '30 hours'. Committed data: still exactly 3 Water rows.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): longest run of identical readings below 98% (WAT-10 control) = `2`.

**Proposed fix (recommendation).** Add a stuck-sensor check (demo setting: 4 identical valid readings below 98%, since full float-fed tanks sit at 100%): serious 'Reading unchanged at L% for H hours; check the sensor'.

**Files affected.** `exceptions.js` (stuck-sensor rule and its setting in `RULES`); `tests/exceptions.test.mjs`.

**Related findings.** [WAT-01](#wat-01), [WAT-05](#wat-05)

<a id="grz-07"></a>
#### GRZ-07: A group with no current stay drops out of grazing silently while the 'Head on grass' tile still counts it

Severity **low** · Status **design-limitation** · Phase 2 (Build next) · Effort **S** · Area: Grazing

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** A group with no open stay drops out of the grazing section, while the 'Head on grass' tile still counts it from `groups.csv`. A closed last stay can legitimately mean shipped or drylotted, and the data model cannot tell which.

**Where in the code.** exceptions.js:56-60 (only open moves considered); app.js:50 (head tile sums groups.csv), :54

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/grazing.repro.mjs` (CASE G-08, GB-07).
- Actual output, quoted from the evidence:

  > G-08: 'grazing rows naming Yearlings: (no rows)  ## groups with a current pasture: Cows, Heifers  ## total alerts 9'; the tile still counts 375 head. GB-07: 'timeline rows=[Cows,Heifers,Yearlings,Bulls]; bars on the Bulls row=0; alert rows naming Bulls=0'.

- How it was verified: design-limitation (the 'no open move' part of verify_grazing F4). Evidence: G-08 (Sand Hills closed Sep 28 with no next move) 'grazing rows naming Yearlings: (no rows)  ## groups with a current pasture: Cows, Heifers  ## total alerts 9'; GB-07 (Bulls added to groups.csv) 'bars on the Bulls row=0; alert rows naming Bulls=0'. Correction applied: a closed last stay can legitimately mean shipped or in a drylot, so a blanket 'no current pasture' warning would raise false alarms after shipping; the real inconsistency is that the Head on grass tile still reports 375 head while grazing knows only 2 groups. The fix is a group status or off-grass flag. The blank in_date part is in GRZ-03.

**Expected behaviour.** The tile and the grazing section agree: either the group is marked off grass (status column) and left out of 'Head on grass', or it shows as 'no current pasture recorded'.

**Operational consequence.** 150 head can vanish from the grazing report because the next move wasn't keyed in, while the headline still counts them as on grass.

**Proposed regression test.** With a status column: G-08 data with Yearlings marked 'shipped' gives 'Head on grass' 225 (180 + 45) and no warning; with Yearlings still 'on grass' and no current stay, one Grazing row matching /no current pasture/i.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): head on grass (tile 375) = `375`.

**Proposed fix (recommendation).** Add an optional status (on grass / off grass / shipped) to groups.csv. Count only on-grass groups in the tile; warn only for on-grass groups with no current stay.

**Files affected.** `data/groups.csv` (optional `status`) via `scripts/generate_data.py` (data files are generated; CI checks they match); `app.js` (tile); `exceptions.js`; `tests/exceptions.test.mjs`.

**Related findings.** [GRZ-03](#grz-03), [UI-18](#ui-18)

<a id="grz-08"></a>
#### GRZ-08: The serious grazing action is one blanket line based only on elapsed days: no escalation and no destination

Severity **low** · Status **design-limitation** · Phase 2 (Build next) · Effort **M** · Area: Grazing

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Every overstay gets the same action text whatever its length, and the action never names a destination, although the data holds rest and water status for every pasture.

**Where in the code.** exceptions.js:119-122

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/grazing.repro.mjs` (CASE G-18: one open Sand Hills move with in_date 2026-09-08, 2026-08-10 or 2026-06-11; G-19 committed data).
- Actual output, quoted from the evidence:

  > G-18: '[serious] Day 22 of a 21-day plan (1 day over) -> Move them, or check the grass and record a new move date  ##  [serious] Day 51 ... (30 days over) -> (same)  ##  [serious] Day 111 ... (90 days over) -> (same)'. G-19: 'free pastures (rest/min): P1 North Flat 18/45, P2 Windmill 50/45 READY, P5 Creek Bottom 21/45, P6 Cedar Draw 39/45, P8 Home Trap 11/30'.

- How it was verified: design-limitation (verify_grazing F7), severity lowered from medium to low-medium ('medium is generous for a missing feature'). Evidence: in_dates giving 1, 30 and 90 days over all give serious with the same action 'Move them, or check the grass and record a new move date'; on Sep 30 the only free pasture past its minimum rest is Windmill (50/45), whose tank T2 is at 11.8%. Corrections applied: the advice never names Windmill and the T2 critical row sits in the same table, so 'moving the yearlings there as advised' overstates it; the auditor's sentence about re-grazing contradicts itself. The 'record a new move date' trap is part of GRZ-01.

**Expected behaviour.** Advice that scales with the overrun (1 vs 30 vs 90 days over) and a first step that names candidate pastures past their minimum rest, with any open water alert on them shown.

**Operational consequence.** A crew lead gets 'Move them' with no destination, and a 90-day overrun is ranked the same as a 1-day one. The dashboard holds the rest, occupancy and water facts but never connects them.

**Proposed regression test.** Committed data: the Yearlings action mentions 'Windmill' and its tank problem, or says no rested pasture has water (Windmill rest Sep 30 - Aug 11 = 50 >= 45; T2 11.8% &lt; 25). If escalation is adopted: severity for in_date 2026-06-11 (90 over) differs from 2026-09-08 (1 over).

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): free pastures on the as-of date: rest / minimum (GRZ-08) = `{'P1': (18, 45), 'P2': (50, 45), 'P5': (21, 45), 'P6': (39, 45), 'P8': (11, 30)}`.

**Proposed fix (recommendation).** Phase 2, with GRZ-04: build the action from the data (unoccupied pastures past minimum rest, annotated with open water alerts) and an escalation step past a demo threshold. Part of the Phase 2 alert explanations.

**Files affected.** `exceptions.js` (action built from the data); `tests/exceptions.test.mjs`.

**Related findings.** [GRZ-01](#grz-01), [GRZ-04](#grz-04), [WAT-06](#wat-06)

<a id="gain-14"></a>
#### GAIN-14: An animal that changes group between weigh-ins is counted in its earlier group without saying so

Severity **low** · Status **confirmed** · Phase 2 (Build next) · Effort **S** · Area: Gain

**Scope note.** The behaviour is reproduced; the defect is limited to the missing disclosure.

**Problem.** An animal's group for a gain period is taken from its earlier row (`group: a.group`). If it moved groups between weigh-ins, the page does not say so.

**Where in the code.** exceptions.js:70 (group: a.group)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-10).
- Actual output, quoted from the evidence:

  > 'H001 counted in Heifers; Heifers: head=45 adg=0.4363 ...'. Nothing mentions the change.

- How it was verified: partially-confirmed (verify_gain F16). Evidence: GN-10 (H001's Sep 15 row labelled Cows) 'H001 counted in Heifers; Heifers: head=45 adg=0.4363'. Correction applied: attributing the measured period to Heifers is defensible because H001 grazed with them for the whole period; the real defect is that the group change is not disclosed, so a pull list could send the crew to the heifer herd for an animal now with the cows. The regression test asserts disclosure, not a new head count.

**Expected behaviour.** H001's gain stays with Heifers for the measured period, and the row or a note says 'H001 moved to Cows on Sep 15'.

**Operational consequence.** An animal already sorted off can be listed in a 'pull and check' row for a herd it no longer runs with.

**Proposed regression test.** GN-10 data: a Gain note or row names H001 and 'Cows'.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Heifers ADG = `0.4363`.

**Proposed fix (recommendation).** List animals whose group changed within the period, with their current group.

**Files affected.** `exceptions.js`; `tests/exceptions.test.mjs`.

**Related findings.** [GAIN-06](#gain-06)

<a id="hlth-04"></a>
#### HLTH-04: An open task whose last_done is after its next_due is reported as overdue with 'Schedule it this week'

Severity **low** · Status **design-limitation** · Phase 2 (Build next) · Effort **S** · Area: Health

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** `last_done` is never read, so an open task done after its due date is still reported overdue with 'Schedule it this week'.

**Where in the code.** exceptions.js:140-147 (last_done unused)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE H-06).
- Actual output, quoted from the evidence:

  > 'serious | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15) | Schedule it this week'.

- How it was verified: design-limitation (verify_healthbudget F14), no corrections. Evidence: H-06 ('Yearlings,Booster vaccine,2026-09-20,2026-09-15,open') 'serious | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15) | Schedule it this week'. last_done is never read.

**Expected behaviour.** A 'record conflict' warning: done 2026-09-20 after due 2026-09-15 but still open; confirm the record before scheduling.

**Operational consequence.** If the crew gave the booster on Sep 20 and nobody updated the status, the report tells them to schedule it again, wasting product and labour with a risk of giving it twice. Whether a repeat is a problem is a question for the veterinarian; the page should only flag the record conflict.

**Proposed regression test.** The inline row (as_of 2026-09-30): one Health warning matching /last done 2026-09-20.\*after.\*due 2026-09-15/i whose action is not 'Schedule it this week'.

**Proposed fix (recommendation).** When status is open and last_done >= next_due, show 'Done &lt;last_done> after due &lt;next_due> but still open: confirm the record with the crew' instead of the overdue row. Record-keeping only; no treatment guidance.

**Files affected.** `exceptions.js`; `tests/exceptions.test.mjs`.

**Related findings.** [HLTH-03](#hlth-03)

<a id="bud-07"></a>
#### BUD-07: A large under-spend is never surfaced: a category 50% under budget gets no row

Severity **low** · Status **design-limitation** · Phase 2 (Build next) · Effort **S** · Area: Budget

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Only overspending is checked. A large under-spend never produces a row.

**Where in the code.** exceptions.js:149-156 (only pct above the warn and serious lines is checked); README.md:28

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.skeptic.missed.mjs` (CASE M3: '2026-09,Vet and health,6000,3000' and '2026-09,Labor,36000,18000').
- Actual output, quoted from the evidence:

  > 'M3 pct=[["Vet and health",-0.5],["Labor",-0.5]]; alerts: (none)'.

- How it was verified: design-limitation (the health/budget skeptic's own missed finding M2). Evidence: healthbudget.skeptic.missed M3 'pct=[["Vet and health",-0.5],["Labor",-0.5]]; alerts: (none)'. The committed data's largest under-spend is Water and fencing at 4,457/4,800 = -7.1%, so a 25% under-spend rule adds no row. Registrar re-ran healthbudget.skeptic.missed.mjs M3 on 2026-10-16: same.

**Expected behaviour.** Under a variance-review rule, a warning such as 'Vet and health 50% under season to date (\$3,000)', prompting a check for skipped work or bills not yet entered.

**Operational consequence.** A vet line at half its plan can mean scheduled work was skipped or invoices are not yet entered, and unentered bills also understate every overspend check.

**Proposed regression test.** With a demo setting of 25% under: exactly two warnings, 'Vet and health 50% under season to date (\$3,000)' and 'Labor 50% under season to date (\$18,000)'. Committed data: no under-budget row.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): largest under-spend, % (BUD-07 control) = `(-7.1, 'Water and fencing', 4457, 4800)`.

**Proposed fix (recommendation).** Phase 2: an under-budget warning (demo setting, percent plus dollar floor) with the action 'Confirm the work was done and the bills are entered'.

**Files affected.** `exceptions.js`; `app.js` (rules table); `README.md`; `tests/exceptions.test.mjs`.

**Related findings.** [BUD-04](#bud-04)

<a id="ui-09"></a>
#### UI-09: Rows with the same severity are ordered A-Z by area name, so the Budget overruns head the serious block above an overdue vaccination and a silent water sensor

Severity **low** · Status **design-limitation** · Phase 2 (Build next) · Effort **S** · Area: Interface

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Within a severity, rows are sorted by area name A-Z (`exceptions.js:158`), so Budget comes first.

**Where in the code.** exceptions.js:158 (SEVERITY, then a.area.localeCompare(b.area)); README.md ('Worst first')

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE BU-13, committed data).
- Actual output, quoted from the evidence:

  > '1. Budget: Fuel | 2. Budget: Repairs | 3. Gain: Heifers | 4. Grazing: Yearlings in Sand Hills | 5. Health: Yearlings: Booster vaccine | 6. Water: Tank T6 (Cedar Draw)'.

- How it was verified: design-limitation (verify_healthbudget F7), severity lowered from medium to low: no group is currently in Cedar Draw, the booster is already 15 days overdue rather than a same-day item, and the README's 'worst first' holds at the severity level. Evidence: BU-13 '1. Budget: Fuel | 2. Budget: Repairs | 3. Gain: Heifers | 4. Grazing: Yearlings in Sand Hills | 5. Health: Yearlings: Booster vaccine | 6. Water: Tank T6 (Cedar Draw)'. Within-area order by stock and capacity is WAT-06.

**Expected behaviour.** Under a stated consequence-aware order, the Water and Health serious rows come before the Budget rows.

**Operational consequence.** A crew lead reading top-down sees the fuel bill before a tank nobody can see and an overdue vaccination; budget items are month-end decisions sharing a tier with field problems.

**Proposed regression test.** Committed data: the serious rows' areas in order are ['Water','Health','Grazing','Gain','Budget','Budget'], or at least the Water and Health rows come before the first Budget row.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): serious rows' areas, A-Z tie-break as today (UI-09) = `['Budget', 'Budget', 'Gain', 'Grazing', 'Health', 'Water']`; serious rows' areas, Water-Health-Grazing-Gain-Budget tie-break (UI-09 fix) = `['Water', 'Health', 'Grazing', 'Gain', 'Budget', 'Budget']`.

**Proposed fix (recommendation).** Phase 2 consequence-aware ranking: an explicit area priority (Water, Health, Grazing, Gain, Budget) as the tie-break, described in the README.

**Files affected.** `exceptions.js` (sort tie-break); `README.md`; `tests/exceptions.test.mjs`.

**Related findings.** [WAT-06](#wat-06), [BUD-04](#bud-04)

<a id="ui-10"></a>
#### UI-10: Keyboard focus is lost after activating a filter chip

Severity **low** · Status **confirmed** · Phase 2 (Build next) · Effort **S** · Area: Interface

**Problem.** The filter chips are rebuilt with `innerHTML` on every click, which destroys the element that had keyboard focus.

**Where in the code.** app.js:62-65 (chips rebuilt with innerHTML on every click), :224

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ <outDir>` (chipKeyboardActivation); `node docs/audit/diagnostics/render.browser.mjs` (scenario chip-keyboard-focus).
- Actual output, quoted from the evidence:

  > '{"focusedBeforeEnter":"button.chip[data-a=Water] \\"Water (3)\\"","afterEnter":{"active":"body","pressed":["Water (3)"]},"afterNextTab":"button.chip[data-a=All] \\"All (10)\\""}'.

- How it was verified: confirmed (verify_render F9, graded low; baseline B6 graded medium but was not skeptic-reviewed, so the verified low is used). Evidence: {"active":"BODY","rows":3,"pressed":["Water"]}; a Tab afterwards lands on 'All (10)'. The focus ring itself was judged visible by the baseline, so that is not a finding. Registrar re-ran browser-check.mjs on 2026-10-16: chip Enter leaves focus on body and the next Tab goes to 'All (10)'.

**Expected behaviour.** The filter applies (3 rows), focus stays on the Water chip (aria-pressed true), and the next Tab goes to Grazing.

**Operational consequence.** Keyboard and screen-reader users lose their place after each filter and must tab from the start.

**Proposed regression test.** Focus the Water chip, press Enter: document.activeElement.dataset.a === 'Water', 3 data rows, aria-pressed 'true' on Water only; Tab goes to data-a 'Grazing'.

**Proposed fix (recommendation).** Create the chips once and update aria-pressed and counts in place (Phase 2 filters work).

**Files affected.** `app.js` (chips updated in place); browser test (new; the repository has none yet).

**Related findings.** [UI-01](#ui-01)

<a id="ui-11"></a>
#### UI-11: Tooltips near the right or bottom edge are squeezed or open off-screen

Severity **low** · Status **confirmed** · Phase 2 (Build next) · Effort **S** · Area: Interface

**Problem.** `hover()` keeps the tooltip inside the left edge only, and the water tooltip has no clamping at all.

**Where in the code.** app.js:29-30 (hover() clamps only the left edge), :105 (water tooltip clamps nothing)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ <outDir>` (edgeTooltips at 1280x900); `node docs/audit/diagnostics/render.browser.mjs` (scenario tooltip-edges at 390x844 with a mouse).
- Actual output, quoted from the evidence:

  > 'edge rightEdgeWater: insideViewport=false rect={"left":1228.5,"top":463.625,"right":1281.65625,"bottom":642.75}'; 'edge bottomEdgeBudget: insideViewport=false rect={"left":479.5,"top":893.6875,"right":594.828125,"bottom":992.25}'.

- How it was verified: confirmed (baseline B7, not skeptic-reviewed), partially-confirmed (verify_render F10). Evidence: 'edge rightEdgeWater: insideViewport=false rect={"left":1228.5,...,"right":1281.65625,...}' (53 px wide, one word per line); 'edge bottomEdgeBudget: insideViewport=false ... "bottom":992.25' with innerHeight 900. Correction applied: this is a narrow or edge-of-window mouse problem; on a touch phone tooltips do not appear at all (UI-01). Registrar re-ran browser-check.mjs on 2026-10-16: both edge tooltips outside the viewport.

**Expected behaviour.** The tooltip stays inside the viewport at its natural width.

**Operational consequence.** The latest reading of the right-column tanks (T4, the leaking one, and T8) shows as a crushed sliver, and tooltips for marks low on the screen are mostly hidden.

**Proposed regression test.** 1280x900: hover T4 at its right edge, tip.right &lt;= 1280 and width >= 120; hover the Repairs bar 30 px above the bottom, tip.bottom &lt;= 900 with 'Over by \$1,800'.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Repairs budget, actual, over \$, over % = `(7200, 9000, 1800, 25.0)`.

**Proposed fix (recommendation).** One placeTip(e) helper for every tooltip that clamps both axes and flips near the edges.

**Files affected.** `app.js` (one tooltip placement helper); browser test (new; the repository has none yet).

**Related findings.** [UI-01](#ui-01)

<a id="ui-12"></a>
#### UI-12: Small chart label collisions: the '3.0' tick overlaps 'lbs per day', and the T6 heading wraps on a phone

Severity **low** · Status **confirmed** · Phase 2 (Build next) · Effort **S** · Area: Interface

**Scope note.** Baseline finding; no skeptic reviewed it. 'Confirmed' here means the registrar re-ran browser-check.mjs on 2026-10-16 and measured the same result.

**Problem.** The gain axis title sits under the last tick label, and the small-multiple headings can wrap.

**Where in the code.** app.js:158-160 (axis title under the last tick label); index.html:55 (.mini h4 flex with no nowrap)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ <outDir>` (inventory).
- Actual output, quoted from the evidence:

  > Desktop: '"3.0" x "lbs per day" (20 px2)'. Phone: the same at 12 px2; the T6 heading is 40.3 px tall.

- How it was verified: confirmed (baseline B8; not skeptic-reviewed). Evidence: '"3.0" x "lbs per day" (20 px2)' on desktop, 12 px2 on a phone; 'T6 Cedar Draw no signal' heading 40.3 px tall against 20.1 for the others. Registrar re-ran browser-check.mjs on 2026-10-16: 'label overlaps: gain:1'.

**Expected behaviour.** No intersecting labels and every small-multiple heading on one line.

**Operational consequence.** Small polish issues a reviewer notices on the first scroll.

**Proposed regression test.** In #gain svg no two text bounding boxes intersect (today 1 pair); at 390 px all 8 .mini h4 heights are equal.

**Proposed fix (recommendation).** Move 'lbs per day' below the tick row; nowrap with ellipsis on the heading name.

**Files affected.** `app.js` (axis title); `index.html` (`.mini h4` CSS); browser test (new; the repository has none yet).

**Related findings.** [UI-03](#ui-03), [UI-14](#ui-14)

<a id="ui-13"></a>
#### UI-13: Exception text shows raw ISO dates ('2026-07-20') while the rest of the page uses 'Jul 20'

Severity **low** · Status **confirmed** · Phase 2 (Build next) · Effort **S** · Area: Interface

**Scope note.** Baseline finding; no skeptic reviewed it. 'Confirmed' because the ISO dates appear verbatim in skeptic-quoted output in every area and the gain skeptic noted the mismatch (verify_gain F17).

**Problem.** Exception text prints ISO dates while tiles and tooltips print 'Jul 20'.

**Where in the code.** exceptions.js:131, :144, :146

**Evidence.**

- Reproduce (from the repository root): Load the page at any viewport and read the exceptions table; `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ <outDir>` (inventory.exceptionTable).
- Actual output, quoted from the evidence:

  > '0.44 lbs/day since 2026-07-20 vs 1.0 target', 'Overdue by 15 days (due 2026-09-15)', 'Due in 3 days (2026-10-03)'.

- How it was verified: confirmed (baseline B9; not skeptic-reviewed). The gain skeptic noted the same mismatch ('table prints ISO dates while the tile prints Jul 20'). Evidence: '0.44 lbs/day since 2026-07-20 vs 1.0 target', 'Overdue by 15 days (due 2026-09-15)'; on a phone the dates wrap as '2026-' / '07-20'.

**Expected behaviour.** The same short date format as the tiles and tooltips: 'since Jul 20', 'due Sep 15', 'Oct 3'.

**Operational consequence.** Minor inconsistency in the table meant to be handed to a crew lead.

**Proposed regression test.** The Heifers row contains 'Jul 20'; the health rows contain 'Sep 15' and 'Oct 3'.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): short dates for the heifer period start, booster due, pinkeye due (UI-13) = `('Jul 20', 'Sep 15', 'Oct 3')`.

**Proposed fix (recommendation).** One shared short-date helper (en-US month and day) used in exceptions.js, alongside the number formatter from BUD-06.

**Files affected.** `exceptions.js` (short-date helper); `tests/exceptions.test.mjs`.

**Related findings.** [GAIN-11](#gain-11), [BUD-06](#bud-06)

<a id="ui-14"></a>
#### UI-14: Long group or budget category names overflow their fixed label space: they overlap the bars and dots, or are cut off at the card edge

Severity **low** · Status **confirmed** · Phase 2 (Build next) · Effort **S** · Area: Interface

**Problem.** Label space is fixed (74 units for groups, 140 for budget categories), so long names overlap the plot or are cut off.

**Where in the code.** app.js:116 and :127 (grazing m.l = 74), :151 and :165 (gain m.l = 74), :180 and :190 (budget m.l = 140, label end-anchored at x=130)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/render.skeptic.browser.mjs <scratchDir> 8932` (section M2: Heifers renamed 'Replacement heifers'; 'Water and fencing' renamed 'Water development and fencing repairs').
- Actual output, quoted from the evidence:

  > 'Replacement heifers: x 0..116 (plot starts at 74)' in grazing and gain; 'Water development and fencing repairs: x -93..130 (svg starts at 0)'.

- How it was verified: confirmed (the render skeptic's own missed finding M1). Evidence: grazing and gain 'Replacement heifers: x 0..116 (plot starts at 74)'; budget 'Water development and fencing repairs: x -93..130 (svg starts at 0)'.

**Expected behaviour.** Each group label ends before its plot (x &lt;= 70) and each budget label starts at x >= 0; long names are truncated with a full-name title or the label space grows.

**Operational consequence.** Real group and ledger names longer than about 9 characters sit under the bars and dots, or are cut off.

**Proposed regression test.** Long-names data: every text.lbl in #grazing and #gain has getBBox().x + width &lt;= 70; every budget category label has getBBox().x >= 0.

**Proposed fix (recommendation).** Measure labels after drawing, size the label space to the longest one, and cap it with an ellipsis plus a &lt;title> holding the full name.

**Files affected.** `app.js` (measured label space); browser test (new; the repository has none yet).

**Related findings.** [UI-12](#ui-12), [SEC-01](#sec-01)

<a id="ui-15"></a>
#### UI-15: The water chart draws a straight line across sensor outages inside the 7-day window

Severity **low** · Status **confirmed** · Phase 2 (Build next) · Effort **S** · Area: Interface

**Problem.** The water line is one path through every reading in the window, with no break at gaps.

**Where in the code.** app.js:90-91 (one path through every row in the window, no break at gaps), :94-97 (the 'no data' wash is drawn only after the last reading)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.verify.mjs` (CASE V-GAP, Chromium).
- Actual output, quoted from the evidence:

  > '"firstPathM":1,"firstPathWidestStepPx":89.6'.

- How it was verified: confirmed (the water skeptic's own missed finding M2). Evidence: V-GAP (T1 rows removed for a 66-hour outage) '"firstPathM":1,"firstPathWidestStepPx":89.6' (66 h x 228/168 = 89.6 px); no wash and no 'no data' label. Not re-run by the registrar.

**Expected behaviour.** The line breaks at the gap (two 'M' commands) or the gap is shaded like the silent-sensor wash; no segment wider than a normal 6-hour step (8.1 px).

**Operational consequence.** An outage earlier in the week is drawn as a smooth line of readings that never existed, and can appear to back up a false 'Dropped N points in 24 hours' alert (WAT-03).

**Proposed regression test.** V-GAP data: T1's path has 2 'M' commands and no segment wider than 12 h x 228/168 = 16.3 px, or a wash rect spans x 156.3 to 245.9.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): UI-15 66 h x 228 / 168 px = `89.5714`; UI-15 12 h x 228 / 168 px = `16.2857`.

**Proposed fix (recommendation).** Start a new subpath when consecutive readings are more than 12 hours apart and shade the gap with the same 'no data' wash.

**Files affected.** `app.js` (path breaks at gaps); browser test (new; the repository has none yet).

**Related findings.** [WAT-03](#wat-03), [LOAD-04](#load-04)

<a id="ui-16"></a>
#### UI-16: The gain chart does not mark the animals the report flags, or the 50% and 80% lines

Severity **low** · Status **confirmed** · Phase 2 (Build next) · Effort **S** · Area: Interface

**Problem.** Every gain dot is drawn the same way; the animals the report flags and the 50% / 80% lines are not marked.

**Where in the code.** app.js:167-173 (every circle gets the same fill, opacity and radius; 'Under half of target' exists only in the hover text at :170); index.html:95

**Evidence.**

- Reproduce (from the repository root): `python3 -m http.server 8931 --bind 127.0.0.1 --directory . &` then `node docs/audit/diagnostics/gain.verify.browser.mjs http://127.0.0.1:8931/ control`
- Actual output, quoted from the evidence:

  > dotFills ["var(--s1)/0.55/3.5"] for all 195 dots; titledDots=0.

- How it was verified: confirmed (the gain skeptic's own missed finding M4). Evidence: 'dots=195, dotFills=["var(--s1)/0.55/3.5"] (one style for all 195), titledDots=0'. The skeptic's page script lived in scratch space; the registrar re-ran the committed equivalent on 2026-10-16: gain.verify.browser.mjs control gave dotFills ["var(--s1)/0.55/3.5"], 195 dots, 7 gridlines.

**Expected behaviour.** The six yearlings in the warning row (Y027, Y031, Y058, Y082, Y129, Y132) visibly distinct and labelled, with reference marks at 50% and 80% of each target.

**Operational consequence.** The chart can't answer 'which ones?' for the report's pull list without hovering over up to 150 overlapping dots, which is not possible on a phone (UI-01).

**Proposed regression test.** Committed data: exactly 6 marked dots in the Yearlings row labelled Y027, Y031, Y058, Y082, Y129, Y132 (the only yearlings under 1.0); reference marks at x(1.0) for yearlings and x(0.5) for heifers.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): yearlings under 1.0 lb/day (50% of the 2.0 demo target) = `['Y027', 'Y031', 'Y058', 'Y082', 'Y129', 'Y132']`.

**Proposed fix (recommendation).** Phase 2 alert explanations: draw flagged animals with a distinct outline and tag label, and add the 50%/80% reference ticks (labelled as demo settings).

**Files affected.** `app.js` (flagged dots, reference ticks); `index.html` (chart note); browser test (new; the repository has none yet).

**Related findings.** [UI-01](#ui-01), [GAIN-09](#gain-09)

<a id="ui-17"></a>
#### UI-17: Budget chart extremes: a category well under budget draws its value label over its name, and one large percentage overrun squashes the chart and stacks every axis label

Severity **low** · Status **confirmed** · Phase 2 (Build next) · Effort **S** · Area: Interface

**Problem.** The budget chart's scale grows to the largest percentage while its tick labels stay fixed, and a negative bar's value label is placed at the bar's end, where a long negative bar puts it over the category name.

**Where in the code.** app.js:180-193 (m.l = 140; value label at a - 6, end-anchored; lim = max(0.3, |pct|); fixed ticks [-0.2, -0.1, 0, 0.1, 0.2]), :184

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/healthbudget.repro.mjs` (CASE AB-09); `node docs/audit/diagnostics/healthbudget.skeptic.missed.mjs` (CASE M1).
- Actual output, quoted from the evidence:

  > AB-09: "'Water and fencing' label overlaps its value label: true". M1: 'overlapping tick pairs=4; bar widths Hay=183px, Repairs=22.9px, Fuel=19.4px, Vet and health=1px'.

- How it was verified: confirmed (verify_healthbudget F15; the health/budget skeptic's own missed finding M0). Evidence: AB-09 (Water and fencing at -40%) "'Water and fencing' label overlaps its value label: true"; M1 ('2026-09,Hay,500,1500', +200%) 'overlapping tick pairs=4; bar widths Hay=183px, Repairs=22.9px, Fuel=19.4px'. Correction applied: the label overlap starts a little past -25% and is relative to the chart's scale limit, not a fixed percent. Registrar re-ran AB-09 on 2026-10-16: same.

**Expected behaviour.** Value labels never cover category names; tick labels never overlap; the real categories stay readable when one category is far over (Fuel bar at least about 39 px under a +-100% cap).

**Operational consequence.** The most under-budget category, often the one worth asking about, becomes unreadable, and a small category's large percentage hides the \$2,040 Fuel overrun.

**Proposed regression test.** AB-09 data: the two label boxes do not intersect. M1 data: no two tick label boxes intersect and the Fuel bar is at least 39 px wide.

**Proposed fix (recommendation).** Derive ticks from the scale limit, cap the scale with clipped bars that keep their true label, and place negative value labels inside the bar or right of zero. Use the same minus sign on ticks and bars.

**Files affected.** `app.js` (`budget()` chart); browser test (new; the repository has none yet).

**Related findings.** [BUD-03](#bud-03), [BUD-04](#bud-04)

<a id="ui-18"></a>
#### UI-18: 'Head on grass 375' counts 180 cow-calf pairs as 180 head

Severity **low** · Status **plausible** · Phase 2 (Build next) · Effort **S** · Area: Interface

**Label: plausible.** Observed, but a judgement call that no skeptic reviewed (baseline only).

**Problem.** The tile sums `groups.csv` head, so 180 cow-calf pairs count as 180 head. This is a domain wording judgement, not a code error.

**Where in the code.** app.js:50 (head = sum of groups.head), :54 (tile text); data/groups.csv ('Cows,cow-calf pairs,180')

**Evidence.**

- Reproduce (from the repository root): Load the page and read the second tile; `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ <outDir>` (tiles line).
- Actual output, quoted from the evidence:

  > 'Head on grass: 375 (180 cows, 45 heifers, 150 yearlings)'.

- How it was verified: plausible (baseline B11; not skeptic-reviewed). A domain wording judgement, not a code error. Evidence: tile 'Head on grass: 375 (180 cows, 45 heifers, 150 yearlings)' with groups.csv class 'cow-calf pairs'. Registrar re-ran browser-check.mjs on 2026-10-16: 'Head on grass=375'.

**Expected behaviour.** Either '180 pairs' in the detail with a label that does not imply a total head count, or calves counted with the assumption stated.

**Operational consequence.** A ranch reviewer may read 375 as leaving out the roughly 180 calves on the place.

**Proposed regression test.** The tile detail reads '180 pairs'; if calves are counted, the total is 180 x 2 + 45 + 150 = 555 under a stated one-calf-per-pair assumption.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): head on grass (tile 375) = `375`; cow-calf pairs counted as two head plus the others (UI-18) = `555`.

**Proposed fix (recommendation).** Reword to '180 pairs, 45 heifers, 150 yearlings' and rename the tile (for example 'Cattle on grass').

**Files affected.** `app.js` (tile text); browser test (new; the repository has none yet).

**Related findings.** [GRZ-07](#grz-07), [CSV-04](#csv-04)

---

## 4. Phase 3: Add later

At most three additions. The defaults to evaluate are water supply coverage from tank capacity and head count, forage
observations at moves, and a dated drought or precipitation snapshot. Only the first comes from a defect ([WAT-06](#wat-06), below);
its research rules are RULE-WAT-06 (hours of water left from usable capacity and the head on the pasture; class C) and
RULE-WAT-09 (storage days for tanks on windmill, solar or other undependable supply; class B), both placed in Phase 3 by
`rules.json`. Choosing and ranking the three additions is a research decision, not a finding, and is not made here.
The other two are research recommendations, not findings: forage observations (RULE-GRZ-05, RULE-GRZ-06) and dated
drought context (RULE-CTX-01, RULE-CTX-02, RULE-CTX-03, RULE-CTX-10, with RULE-CTX-15 and RULE-CTX-16 on keeping public
data pinned to the fictional as_of and not redistributing restricted data). Any public data shown beside the fictional
ranch never makes the example a real operation.

<a id="wat-06"></a>
#### WAT-06: Water severity uses level percent alone: it ignores stock on the pasture, tank capacity and use, and ties are broken by file order, so an empty-pasture tank outranks a leaking tank 45 heifers drink from

Severity **medium** · Status **design-limitation** · Phase 3 (Add later) · Effort **M** · Area: Water

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Water severity comes from level percent and the drop alone. The data has no tank capacity, no head count per tank and no consumption, and rows of equal severity are left in file order.

**Where in the code.** exceptions.js:109-115 (level and drop thresholds only); exceptions.js:158 (within a severity, order is file order); no capacity or head data in water.csv

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/water.repro.mjs` (CASE W-14 committed data; W-16: TA in P7 with Cows here now and TB in empty P2, both at 38%).
- Actual output, quoted from the evidence:

  > W-14: 'critical | Tank T2 (Windmill) | Down to 11.8% full || critical | Tank T4 (Lone Tree, Heifers here now) | Dropped 46 points in 24 hours, now 10% || serious | Tank T6 ...'. W-16: 'warning | Tank TB (Windmill) | 38% full || warning | Tank TA (South Divide, Cows here now) | 38% full'.

- How it was verified: design-limitation (verify_water F9). Evidence: W-14 lists 'critical | Tank T2 (Windmill) | Down to 11.8% full' before 'critical | Tank T4 (Lone Tree, Heifers here now) | Dropped 46 points in 24 hours, now 10%' although P2 Windmill is empty (open moves put Cows in P7, Heifers in P4, Yearlings in P3); W-16 lists the empty-pasture TB before TA with 180 pairs, both at 38%. Correction applied: T2 comes before T4 only because T2 comes first in water.csv; within a severity the sort has no level or stock key, so the order is file-order chance. The gallons illustration (a 1,000-gal tank at 38% with 180 pairs at about 20 gal per pair per day lasts about 2.5 hours) uses assumed figures that are not in the data. Area-name ordering across areas is UI-09.

**Expected behaviour.** Rows where stock is drinking come first or rate higher: on the committed data the first Water row is Tank T4 (Lone Tree, Heifers here now); in W-16, TA ranks or rates above TB.

**Operational consequence.** The top row of the report sends the crew to an empty pasture while the leaking tank 45 heifers depend on is second. A 38% tank with 180 pairs on it gets 'look at it on the next pass'. The data model cannot say whether water is actually short.

**Proposed regression test.** Phase 1 (honest copy): the rules table says water severity uses level percent only. Phase 2 (with UI-09's consequence-aware ranking): committed data, the first Water row's subject contains 'Tank T4'; W-16, TA comes before TB. Phase 3: with capacity_gal and a stated gallons-per-head assumption (a demo setting, labelled as such), a 1,000-gal tank at 38% with 180 head at 20 gal/day gives hours left = 380 / (180 x 20 / 24) = 2.53 h by hand.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): WAT-06 380 / (180 x 20 / 24) hours = `2.5333`.

**Proposed fix (recommendation).** Phase 1 (honest copy): state in the rules table that water severity uses level percent only. Phase 2, with UI-09's consequence-aware ranking: rank stocked-pasture water rows first and show the head count in 'here now'. Phase 3 (one of the three allowed additions): water supply coverage from tank capacity and head count, with the gallons-per-head figure labelled as an assumption.

**Files affected.** Phase 1: `app.js` (rules table copy); Phase 2: `exceptions.js` (ranking); Phase 3: `data/tanks.csv` (`capacity_gal`) via `scripts/generate_data.py` (data files are generated; CI checks they match), `exceptions.js`; `tests/exceptions.test.mjs`.

**Related findings.** [UI-09](#ui-09), [WAT-02](#wat-02)

---

## 5. Deferred

Two findings need a model or data beyond the planned phases: a forage model in animal-unit-days ([GRZ-09](#grz-09)) and
weigh-condition records with a shrink policy ([GAIN-10](#gain-10)). Each still has a small change that can be made now, stated in
its entry.

<a id="gain-10"></a>
#### GAIN-10: Weigh conditions (shrink and gut fill) are not recorded, and an ordinary few-percent difference is larger than the serious rule's margin

Severity **medium** · Status **design-limitation** · Deferred · Effort **L** · Area: Gain

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** `weights.csv` records only tag, group, date and weight. Weigh conditions (time off feed and water) are not recorded, and a routine shrink or fill difference between sessions can be larger than the serious rule's margin.

**Where in the code.** data/weights.csv schema (tag, group, date, weight_lbs only); exceptions.js:129 (0.8 x target margin)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/gain.repro.mjs` (CASE GN-19).
- Actual output, quoted from the evidence:

  > 'Heifers: head=45 adg=1.0203 ...; Yearlings: head=150 adg=1.4973 ... || serious | Yearlings | 1.50 lbs/day since 2026-07-20 vs 2.0 target'.

- How it was verified: design-limitation (verify_gain F13). Evidence: GN-19 (yearlings' Sep 15 weights x 0.97, heifers' x 1.03) 'Heifers: head=45 adg=1.0203 ...; Yearlings: head=150 adg=1.4973 ... || serious | Yearlings | 1.50 lbs/day': the planted heifer alert is gone and a false yearling alert appears. Corrections applied: opposite conditions on the two groups is a constructed case; the point that stands is that one ordinary shrink difference (3% of the 846.74-lb mean yearling over 57 days = 0.4457 lbs/day (0.03 x 846.74 / 57 = 0.44565; the skeptic printed 0.4458)) exceeds the 0.4 lbs/day serious margin. The 3% figure is an assumption, not a measured value.

**Expected behaviour.** With consistent weigh conditions the verdicts are unchanged: no serious yearling row, heifers serious.

**Operational consequence.** Without weigh conditions recorded, the rule can't tell a real gain problem from a weigh-day difference.

**Proposed regression test.** After a data-model change: weights with a condition column; a pair with mismatched conditions is flagged, or adjusted by a stated, labelled shrink assumption before judging.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): days between the last two weigh-ins = `57`; mean yearling weight on Sep 15 (GAIN-10) = `846.74`; 3% of that mean over 57 days, lb/day (GAIN-10) = `0.4457`.

**Proposed fix (recommendation).** Deferred: add weigh-condition columns (time off feed and water) and a stated shrink policy. Until then, say in the rules copy that gain compares weights as recorded, and that the 80%/50% lines and 2.0/1.0 lb targets are demo settings.

**Files affected.** Deferred: `data/weights.csv` schema via `scripts/generate_data.py` (data files are generated; CI checks they match); Now (copy): `app.js` (rules table), `README.md`.

**Related findings.** [GAIN-03](#gain-03)

---

<a id="grz-09"></a>
#### GRZ-09: Two groups in one pasture are each judged alone against a single per-pasture plan

Severity **low** · Status **design-limitation** · Deferred · Effort **L** · Area: Grazing

**Label: design limitation.** Reproduced, but the code does what its documented rule says. The gap is in the rule set or the data model, so the page cannot support a confident conclusion here; the fix is a rule or data-model change, not a bug fix.

**Problem.** Each group is judged alone against its pasture's single `planned_graze_days`. There is no head count or stocking term, so two groups sharing a pasture both look inside plan.

**Where in the code.** exceptions.js:54-61, :118-125 (planned_graze_days per pasture, no head or stocking term)

**Evidence.**

- Reproduce (from the repository root): `node docs/audit/diagnostics/grazing.repro.mjs` (CASE G-17: Heifers leave Lone Tree 2026-09-25 and enter South Divide with the Cows; control G-C5).
- Actual output, quoted from the evidence:

  > 'rows naming South Divide: (no rows)  ## grazingStatus in P7: Cows day 18 of 21, Heifers day 5 of 21'.

- How it was verified: design-limitation (verify_grazing F8), no corrections. Evidence: 'F9 Heifers join Cows in P7 total=10': no row names South Divide; the auditor's G-17 shows 'Cows day 18 of 21, Heifers day 5 of 21' (Sep 12 to Sep 30 = 18; Sep 25 to Sep 30 = 5).

**Expected behaviour.** At least a note that South Divide carries Cows (180 pairs) and Heifers (45) together, with the plan shortened or flagged.

**Operational consequence.** When groups are combined the grass goes faster than the one-group plan assumes, and both groups show as inside plan until the pasture is overgrazed.

**Proposed regression test.** G-17 moves: a Grazing row whose subject includes 'South Divide' and whose text names both 'Cows' and 'Heifers'.

Hand values re-checked by `findings.handvalues.py` (each printed MATCH): Cows in South Divide: day of plan = `(18, 21)`.

**Proposed fix (recommendation).** Deferred: proper handling needs pasture capacity in animal-unit-days and per-group consumption, which is a forage model beyond the planned phases. A Phase 2 informational note when two groups share a pasture is optional.

**Files affected.** Deferred; an optional Phase 2 note would touch `exceptions.js`.

**Related findings.** [GRZ-05](#grz-05)

---

## 6. Operational-rule audit

This section is a **research conclusion**, not a set of verified defects. It summarises, for each current threshold
rule, how `rules.json` classifies it, which findings touch it, and which proposed rules would replace or support it.
Classification key: **A** supported general guidance; **B** context-dependent guidance; **C** ranch-specific management
choice; **D** synthetic demonstration setting. Where the citation checker disputed a class credibly, the stricter class
was applied (rules.json `legend.classification_rule`).

Three conclusions hold across the table:

- **No current ranch operating threshold is class A.** The only current class-A rules are display rules from WCAG
  (RULE-WF-01, RULE-WF-06, RULE-WF-07), not ranch thresholds (registry-changelog.md: "A current threshold classified
  A: None").
- **Every current value is a demonstration setting until a ranch sets it.** Class C means the right value is the
  ranch's own choice; class D means the value was picked to fit the fictional data. Neither is a validated operating
  threshold. The proposed Phase 1 copy rule (RULE-WF-20) adds a basis column, "Demo setting (D)", to the rules table
  for every current value.
- **The 10-of-10 match does not validate the thresholds** (RULE-WF-21, class D): it shows the rules find what the
  generator planted.

### 6.1 Current threshold rules

| Rule ID | Current rule | Setting | Class | Sources (checker result) | Research phase | Related findings | Related RULE IDs |
|---|---|---|---|---|---|---|---|
| RULE-WAT-01 | Tank critical when its latest level is under 25% | `waterCritical: 25` | C | 4 (4 verified; 3 vendor) | 1 | [WAT-01](#wat-01), [WAT-02](#wat-02), [WAT-05](#wat-05), [WAT-06](#wat-06), [WAT-09](#wat-09), [UI-04](#ui-04), [TEST-01](#test-01) | RULE-WAT-04, RULE-WAT-06, RULE-WAT-14, RULE-WAT-15, RULE-WF-20 |
| RULE-WAT-02 | Tank warning when its latest level is under 40% | `waterLow: 40` | C | 2 (2 verified; 1 vendor) | 1 | [WAT-01](#wat-01), [WAT-06](#wat-06), [TEST-01](#test-01) | RULE-WAT-06, RULE-WAT-15, RULE-WF-20 |
| RULE-WAT-03 | Tank critical on a fall of 30 points or more against the latest reading at least 24 h earlier | `waterDropPts: 30` | D | 3 (3 verified; 1 vendor) | 1 | [WAT-03](#wat-03), [WAT-04](#wat-04), [WAT-07](#wat-07), [WAT-08](#wat-08), [TIME-02](#time-02), [UI-15](#ui-15), [TEST-01](#test-01) | RULE-WAT-08, RULE-WAT-06, RULE-WF-20 |
| RULE-WAT-04 | Tank serious after 24 h with no reading; its level and drop are then not judged | `sensorSilentHours: 24` | C | 5 (5 verified; 3 vendor) | 1 | [TIME-01](#time-01), [TIME-02](#time-02), [WAT-02](#wat-02), [WAT-05](#wat-05), [WAT-09](#wat-09), [WAT-10](#wat-10), [LOAD-04](#load-04), [LOAD-05](#load-05), [TEST-01](#test-01) | RULE-WAT-07, RULE-WAT-15, RULE-WF-14, RULE-WF-19 |
| RULE-GRZ-01 | Group serious when its open stay has run past the pasture's planned graze days (hard-coded, not in `RULES`) | `planned_graze_days` per pasture | C | 5 (3 partly, 2 verified) | 1 | [GRZ-01](#grz-01), [GRZ-02](#grz-02), [GRZ-03](#grz-03), [GRZ-06](#grz-06), [GRZ-08](#grz-08), [GRZ-09](#grz-09), [DATA-01](#data-01), [TIME-03](#time-03), [TEST-02](#test-02) | RULE-GRZ-03, RULE-GRZ-04, RULE-GRZ-05, RULE-GRZ-06, RULE-GRZ-07, RULE-WAT-05 |
| RULE-GRZ-02 | Group warning when a planned move is 2 days away or less | `graceDays: 2` | D | 2 (1 partly, 1 verified) | 1 | [UI-06](#ui-06), [TIME-03](#time-03), [TEST-02](#test-02) | RULE-GRZ-03, RULE-WAT-05, RULE-WF-20 |
| RULE-GAIN-01 | Group serious when its mean daily gain since the last weigh-in is under 80% of target | `adgSerious: 0.8` | C | 7 (7 verified) | 1 | [GAIN-01](#gain-01), [GAIN-02](#gain-02), [GAIN-03](#gain-03), [GAIN-04](#gain-04), [GAIN-07](#gain-07), [GAIN-08](#gain-08), [GAIN-10](#gain-10), [GAIN-12](#gain-12) | RULE-GAIN-06, RULE-GAIN-07, RULE-GAIN-10, RULE-GAIN-08, RULE-HLTH-11 |
| RULE-GAIN-02 | Animals under 50% of target listed (warning), unless the group is already serious | `animalShare: 0.5` | C | 5 (5 verified) | 1 | [GAIN-03](#gain-03), [GAIN-09](#gain-09), [GAIN-11](#gain-11), [GAIN-14](#gain-14), [UI-16](#ui-16) | RULE-GAIN-07, RULE-HLTH-11, RULE-WF-19 |
| RULE-GAIN-03 | Yearling target 2.0 lb/day, applied to any interval | `groups.csv` target_adg_lbs | D (changed) | 6 (6 verified) | 1 | [GAIN-05](#gain-05), [GAIN-10](#gain-10), [GAIN-11](#gain-11), [LOAD-03](#load-03) | RULE-GAIN-06, RULE-GAIN-07, RULE-GAIN-08 |
| RULE-GAIN-04 | First-calf heifer target 1.0 lb/day, judged by the same 80% / 50% rules | `groups.csv` target_adg_lbs | D | 4 (1 partly, 3 verified) | 1 | [GAIN-03](#gain-03), [GAIN-05](#gain-05), [GAIN-10](#gain-10) | RULE-CTX-12 |
| RULE-GAIN-05 | Cows (cow-calf pairs) target 0.0, so the gain rules skip them | `groups.csv` target_adg_lbs | D (changed) | 3 (3 verified) | 1 | [GAIN-13](#gain-13) | RULE-CTX-12 |
| RULE-HLTH-01 | Open health task past its due date is serious ('Schedule it this week') | (code) | D | 3 (3 verified) | 1 | [HLTH-01](#hlth-01), [HLTH-04](#hlth-04), [CSV-05](#csv-05), [DATA-02](#data-02), [TIME-03](#time-03), [UI-13](#ui-13) | RULE-HLTH-03, RULE-HLTH-04, RULE-HLTH-11 |
| RULE-HLTH-02 | Open health task due within 7 days is a warning ('Plan it with the next gather') | `dueSoonDays: 7` | D | 3 (3 verified) | 1 | [HLTH-01](#hlth-01), [TIME-03](#time-03), [UI-06](#ui-06) | RULE-HLTH-04, RULE-HLTH-11 |
| RULE-HLTH-03 | Open task with a blank due date, or a status other than exactly 'open', is skipped silently | (code) | C | 1 (1 verified) | 1 | [HLTH-01](#hlth-01), [HLTH-02](#hlth-02), [HLTH-03](#hlth-03), [CSV-05](#csv-05) | RULE-HLTH-01 |
| RULE-BUD-01 | Category serious when more than 10% over budget, season to date | `budgetSerious: 0.10` | D | 4 (2 partly, 2 verified) | 1 | [BUD-01](#bud-01), [BUD-02](#bud-02), [BUD-03](#bud-03), [BUD-04](#bud-04), [BUD-05](#bud-05), [BUD-06](#bud-06), [DATA-03](#data-03), [UI-09](#ui-09) | RULE-BUD-03, RULE-BUD-04, RULE-BUD-05, RULE-BUD-06, RULE-BUD-14 |
| RULE-BUD-02 | Category warning when 5-10% over budget (strict comparisons; no dollars on the row) | `budgetWarn: 0.05` | D | 2 (1 partly, 1 verified) | 1 | [BUD-04](#bud-04), [BUD-05](#bud-05), [BUD-06](#bud-06), [BUD-07](#bud-07), [UI-08](#ui-08) | RULE-BUD-03, RULE-BUD-13 |

"(changed)" means the class was made stricter after a checker dispute (rules.json `classification_changed`). "Research phase" is the phase `rules.json` recommends for acting on the rule itself (usually relabelling it and fixing its edges), not a phase for validating the value. "Sources (checker result)" counts the rule's `sources` and their `verification` values, and the vendor count is `evidence_mix.vendor_sources`.

How the two link columns were drawn up: `rules.json` does not link rules to findings, and its `related_rules` field is empty for all 16 rules above. So the links are this document's judgement, made by matching subjects. A finding is listed when its code location is in the code that applies the rule, or its proposed fix changes how the rule is applied or worded. A RULE ID is listed when one of the two rules names the other in `rules.json`, or when the proposed rule covers the same decision. The cross-references that `rules.json` itself makes are: RULE-WAT-01 names RULE-WAT-04; RULE-WAT-04 names RULE-WAT-07; RULE-WAT-08 names RULE-WAT-03; RULE-GAIN-01 names RULE-GAIN-06; RULE-GAIN-02 names RULE-GAIN-07 and RULE-HLTH-11; RULE-GAIN-03 names RULE-GAIN-06 and RULE-GAIN-08; RULE-GAIN-04 and RULE-GAIN-05 name RULE-CTX-12, which names them back; RULE-HLTH-01 names RULE-HLTH-03; RULE-BUD-01 names RULE-BUD-05 and RULE-BUD-06. The other links are topical.

### 6.2 Notes on each rule, with sources

**RULE-WAT-01: Tank critical when its latest level is under 25%.** Class C (ranch-specific management choice).
Research found no extension, NRCS or peer-reviewed source that sets a percent-full alarm level. Vendor help pages treat it as a user setting and give examples only: warning "e.g. you may set this at 40-50% level", critical "e.g. you may set this to 10-20% level" (Ranchbot, re-read by the citation critic on 2026-10-16). Percent full also depends on where the sensor's "true bottom" is set (Ranchbot offset article). The research diagnostic `water.research.mjs`, using assumed tank capacities and intake, found that the same 25% reading means "about 1 hour of water or about 3.5 days depending on tank and herd". In the fictional data healthy tanks never go below about 55%, so only the planted T2 tests the line. Research recommendation (Phase 1): keep it, label 25% as a ranch-set demo value, and judge only tanks that reported recently; a silent tank is CAN'T TELL. Hours of water left is the Phase 3 replacement (RULE-WAT-06).

Key sources:

  - Ranchbot Help Center (vendor), "How to set up water tank alerts & notifications", 2023-09-20. Checker: verified. <https://intercom.help/ranchbot/en/articles/8388692-how-to-set-up-water-tank-alerts-notifications>
  - Ranchbot Help Center (vendor), "What is offset and how to update it", 2023-08-11. Checker: verified. <https://intercom.help/ranchbot/en/articles/7941241-what-is-offset-and-how-to-update-it>
  - Colorado State University Extension, Golden Plains Area, "Calculating Water for Cattle", 2021-06-17. Checker: verified. <https://goldenplains.extension.colostate.edu/wp-content/uploads/sites/56/2021/06/PR_CalculatingWaterforCattle.pdf>

**RULE-WAT-02: Tank warning when its latest level is under 40%.** Class C (ranch-specific management choice).
The only 40% figure found is the same Ranchbot vendor example. An NDSU release notes that "With 100-degree weather, checking water supplies on a daily basis may not be often enough", so the right check interval depends on heat. In the fictional month no healthy tank drops below 55.1%, so the warning never fires on normal data. Phase 1: label 40% as a ranch-set demo value.

Key sources:

  - Ranchbot Help Center (vendor), "How to set up water tank alerts & notifications", 2023-09-20. Checker: verified. <https://intercom.help/ranchbot/en/articles/8388692-how-to-set-up-water-tank-alerts-notifications>
  - NDSU Agriculture Communication, "Water Essential for Cattle in High Heat (NDSU news release, Karl Hoppe)", undated on page (URL path 2007-07-26). Checker: verified. <https://www.ag.ndsu.edu/news/newsreleases/2007/july-26-2007/water-essential-for-cattle-in-high-heat>

**RULE-WAT-03: Tank critical on a fall of 30 points or more against the latest reading at least 24 h earlier.** Class D (synthetic demonstration setting).
The 30-point line sits between the generator's noise and its planted leak. `findings.handvalues.py` prints the largest exact 24-hour fall per tank as `{'T1': 16.1, 'T2': 15.3, 'T3': 16.2, 'T4': 46.0, 'T5': 14.5, 'T6': 11.8, 'T7': 14.9, 'T8': 18.2}` (MATCH): every healthy tank is at or under 18.2 points and the T4 leak is 46, so 30 separates the fictional data by construction. NRCS CPS 614 (2023) asks for regular checks for leaks and of the automatic water level device but gives no numeric leak rate. A storage tank's normal pump-off draw can exceed 30 points a day (the research's example: 49 points/day for the cows on a 10,000-gal tank at 90F, with assumed figures). Phase 1: bound the comparison window, measure it against as_of, and word the row as an unexplained fall, leak not confirmed.

Key sources:

  - USDA NRCS, "Watering Facility (Code 614) Conservation Practice Standard", 2023-08. Checker: verified. <https://www.nrcs.usda.gov/sites/default/files/2023-08/614_NHCP_CPS_Watering_Facility_2023.pdf>
  - LPES Small Farms Fact Sheets / MidWest Plan Service, "The ABCs of Livestock Watering Systems (Ben Bartlett)", 2006 (copyright year). Checker: verified. <https://extension.wvu.edu/files/d/102b1da9-9f1a-40d7-90ad-5de2cd6101a8/watering-systems-by-ben-bartlett.pdf>

**RULE-WAT-04: Tank serious after 24 h with no reading; its level and drop are then not judged.** Class C (ranch-specific management choice).
Vendor pages describe a "Delay" status for data that is "likely out of date" and suggest a manual inspection if it lasts more than 3-4 days (Ranchbot 2024; Farmbot 2026); none sets 24 hours for this ranch. A satellite unit making "4 measurements per day" (Myriota partner page) misses about four reports in 24 hours. The code already measures silence against as_of (`exceptions.js:48`); the gaps are that the "last" reading can be dated after as_of ([TIME-01](#time-01)) and that a sensor silent for under 24 hours is judged on its old reading ([WAT-05](#wat-05)). Phase 1: a silent tank is CAN'T TELL, shown with its last level and time and "check by eye". Escalation by last-known level, head and heat is Phase 2 (RULE-WAT-07).

Key sources:

  - Ranchbot Help Center (vendor), "What does Monitor Status 'Delay' mean?", 2024-02-16. Checker: verified. <https://intercom.help/ranchbot/en/articles/7944517-what-does-monitor-status-delay-mean>
  - Farmbot Help Centre (vendor), "What does Device Status 'Delay' mean?", 2026-04-13. Checker: verified. <https://intercom.help/farmbot-helpcentre/en/articles/5666871-what-does-device-status-delay-mean>
  - Myriota (vendor), "Satellite Water Tank Monitoring System (LoneStar Tracking partner page)", 2025-02-03 (last modified). Checker: verified. <https://myriota.com/partner-products/satellite-water-tank-monitoring-system/>

**RULE-GRZ-01: Group serious when its open stay has run past the pasture's planned graze days (hard-coded, not in `RULES`).** Class C (ranch-specific management choice).
Extension and NRCS guidance says moves should follow plant growth and use, not the calendar. NRCS South Dakota Range Technical Note 9 (2017): "Livestock movements should be based on plant growth and utilization and not calendar dates." SDSU Extension MC-04340: "movement to the next pasture should follow plant growth – not the calendar." A planned stay length is therefore the ranch's own plan. The "any day over is serious" threshold is hard-coded in `findExceptions`, not in `RULES`. Phase 1: keep it (the planted Sand Hills overstay must still be found), label planned_graze_days as the ranch's demo plan, and make an unknown pasture or a second open stay a data issue rather than a grazing row.

Key sources:

  - USDA NRCS South Dakota, "Prescribed Grazing, Range Technical Note No. 9 (South Dakota Technical Guide, Section I, Notice SD-424)", April 2017. Checker: partly. <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf>
  - SDSU Extension (Krista Ehlert), "Designing a Grazing Plan That Guides Decisions (MC-04340)", undated (URL folder 2026-07; page shows (c) 2026 South Dakota Board of Regents). Checker: verified. <https://extension.sdstate.edu/sites/default/files/2026-07/MC-04340.pdf>
  - Elsevier / Society for Range Management (author PDF hosted by USDA ARS), "Adaptive, Multipaddock Rotational Grazing Management: A Ranch-Scale Assessment of Effects on Vegetation and Livestock Performance in Semiarid Rangeland. Rangeland Ecology & Management 73:796-810, doi:10.1016/j.rama.2020.07.005", 2020. Checker: verified. <https://www.ars.usda.gov/ARSUserFiles/51815/67.%202020%20REM%20-%20CARM%20-%20adaptive%20multipaddock%20rotational%20grazing%20-%20vegetation%20and%20livestock%20responses.pdf>

**RULE-GRZ-02: Group warning when a planned move is 2 days away or less.** Class D (synthetic demonstration setting).
No extension or NRCS source sets a lead time for move reminders. The CARM study's checks three days a week (Augustine et al. 2020) show how often monitoring was done, not how much warning a move needs. The rule raises nothing on the committed data. Phase 1: label 2 days as a demo setting.

Key sources:

  - Elsevier / SRM (USDA ARS-hosted PDF), "Adaptive, Multipaddock Rotational Grazing Management ... Rangeland Ecology & Management 73:796-810", 2020. Checker: verified. <https://www.ars.usda.gov/ARSUserFiles/51815/67.%202020%20REM%20-%20CARM%20-%20adaptive%20multipaddock%20rotational%20grazing%20-%20vegetation%20and%20livestock%20responses.pdf>

**RULE-GAIN-01: Group serious when its mean daily gain since the last weigh-in is under 80% of target.** Class C (ranch-specific management choice).
Gains normally fall late in the season, so a fixed 80% test fires in normal years without a period-specific expectation. Grings et al. (2002) report late-period gains for season-long steers of 0.59 kg/day (1994) and 0.66 kg/day (1995) against whole-season 1.07-1.11 kg/day; the research diagnostic shows those late-period figures (1.30 and 1.46 lb/day) would be flagged serious against 80% of 2.0. Weighing method alone moves gain: full weights overstated daily gain by 0.22 lb/day for pasture steers over 165 days and by 0.51 lb/day for pasture heifers over 20 days (UNL 2012 Beef Report). Phase 1: apply the weigh-basis, minimum-interval and coverage gates first (RULE-GAIN-06, RULE-GAIN-07, RULE-GAIN-10) and label 80% as a demo setting. The planted heifer problem must still be flagged.

Key sources:

  - Society for Range Management / USDA-ARS Fort Keogh (PDF hosted by USDA-ARS), "Intensive-early stocking for yearling cattle in the Northern Great Plains (J. Range Manage. 55:135-138)", 2002. Checker: verified. <https://ars.usda.gov/ARSUserFiles/30300500/Publications/JRM55-135-138.pdf>
  - University of Nebraska-Lincoln, "Research Results are Dependent on Accurate Cattle Weights (2012 Nebraska Beef Cattle Report pp. 45-46)", 2012. Checker: verified. <https://Beef.unl.edu/7a4f176f-73e2-4fa9-b86c-ed95f8543602.pdf>

**RULE-GAIN-02: Animals under 50% of target listed (warning), unless the group is already serious.** Class C (ranch-specific management choice).
Beef Improvement Federation guidelines (2019): "a minimum of a 70-d test period is required to accurately compute average daily gain for individual animals", weighing twice at the start and twice at the end (re-read by the citation critic). The demo's last weigh-in interval is 57 days (`findings.handvalues.py`, MATCH). The research's sensitivity sweep, with assumed weighing noise, estimated about 2 false individual flags per 150 yearlings per weigh-in at 57 days ("2.0 of 150") and 15.1 at 28 days. Phase 1: use the minimum-interval gate (RULE-GAIN-07) and reword the action to observe, record and refer to the herd veterinarian (RULE-HLTH-11). The six planted slow yearlings must still appear; see section 7 on the interval question.

Key sources:

  - Beef Improvement Federation (hosted on docs.c-lockinc.com), "Beef Improvement Federation Guidelines for Feed Efficiency Testing as of March 26th, 2019 (copy hosted by C-Lock Inc., a vendor)", 2019-03-26. Checker: verified. <https://docs.c-lockinc.com/Document%20-%20Beef%20Improvement%20Federation%20Guidelines%20for%20FE%20Testing.pdf>
  - American Society of Animal Science (University of Adelaide repository), "Optimum postweaning test for measurement of growth rate, feed intake, and feed efficiency in British breed cattle (J. Anim. Sci. 75:2024-2032)", 1997. Checker: verified. <https://eres.library.adelaide.edu.au/dspace/handle/2440/13249>

**RULE-GAIN-03: Yearling target 2.0 lb/day, applied to any interval.** Class D (synthetic demonstration setting, changed).
2.0 lb/day is reasonable as a season average (Grings et al. 2002 whole-season 2.36-2.62 lb/day; Cheng et al. 2022, 1.90-2.51 lb/day under traditional management), which alone would be class B. Applying a season figure to any part of the season has no support, since late-period gains of 1.30-1.46 lb/day were reported, so the rule as implemented is class D (changed from B). Phase 1: label it a demo season-average target. Period-specific expectations (RULE-GAIN-08) are deferred.

Key sources:

  - USDA-ARS / Society for Range Management, "Intensive-early stocking for yearling cattle in the Northern Great Plains", 2002. Checker: verified. <https://ars.usda.gov/ARSUserFiles/30300500/Publications/JRM55-135-138.pdf>
  - Elsevier / Society for Range Management (PDF hosted by USDA-ARS), "Evaluation of the APEX cattle weight gain component for grazing decision-support in the Western Great Plains (Rangeland Ecol. Manage. 82:1-11)", 2022. Checker: verified. <https://www.ars.usda.gov/ARSUserFiles/30123025/Publications/2022/Cheng%20et%20al%202022%20REM%20-%20APEX%20cattle%20weight%20gain%20component.pdf>

**RULE-GAIN-04: First-calf heifer target 1.0 lb/day, judged by the same 80% / 50% rules.** Class D (synthetic demonstration setting).
No source sets 1.0 lb/day for first-calf heifers. The supported measure is body condition: body condition score (BCS) 6 at calving for first-calf heifers (UNL 2020; SDSU 2022). Phase 1: label 1.0 lb/day as a demo setting with no source. The BCS-based replacement (RULE-CTX-12) is deferred. The planted heifer problem must still be found.

Key sources:

  - Nebraska Extension (BeefWatch), "Guide to Body Condition Scoring Your Beef Cow Herd", 2020-02-02. Checker: verified. <https://beef.unl.edu/learning/condition1a.shtml>
  - SDSU Extension, "Management of Body Condition Score Throughout the Year", updated 2022-09-09. Checker: verified. <https://extension.sdstate.edu/management-body-condition-score-throughout-year>

**RULE-GAIN-05: Cows (cow-calf pairs) target 0.0, so the gain rules skip them.** Class D (synthetic demonstration setting, changed).
Only the narrow point "do not judge mature cows on ADG" (average daily gain) is general guidance (rules.json `classification_note`). The supported practice is to monitor cows by body condition score (UNL 2020; SDSU 2022; Angus AHIR), and the current rule does neither: it silently skips 180 head. Class D (changed from A). Phase 1 is copy only: say on the page that cows are not monitored by the gain rules and that no body condition records exist.

Key sources:

  - Nebraska Extension, "Guide to Body Condition Scoring Your Beef Cow Herd", 2020-02-02. Checker: verified. <https://beef.unl.edu/learning/condition1a.shtml>
  - American Angus Association, "AHIR Guidelines (mature cow weight and BCS)", undated. Checker: verified. <https://aimsdata.angus.org/performance/AhirGuidelines>

**RULE-HLTH-01: Open health task past its due date is serious ('Schedule it this week').** Class D (synthetic demonstration setting).
The demo booster's next_due is 105 days after the first dose. The BQA National Manual says "almost all products recommend a second vaccination two (2) to four (4) weeks after the initial vaccination" (an undated PDF that is likely superseded by a 2026 edition the checker could not fetch), and UC Davis Extension (Maas 2008) says booster needs are on the label and that "The best source of vaccine information is from your cattle veterinarian." So "Schedule it this week" does not fit the demo case. Phase 1: normalise status first, keep the overdue booster found, and reword the action to scheduling plus "check the label or your veterinarian's plan for the booster window". No treatment or diagnosis appears on the page.

Key sources:

  - Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor), "Beef Quality Assurance National Manual (bqa_manual_final.pdf)", undated (no date in the PDF; newest data cited are the 2016 NBQA, a 2018 footnote and a 1998-2017 series). Likely superseded: NCBA announced an updated manual on 2024-12-19 (2025-01-06 is a trade-press reprint date), and bqa.org now links a 2026 edition that could not be fetched.. Checker: verified. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf>
  - UC Davis School of Veterinary Medicine Extension (J. Maas), in California Cattlemen's Magazine, "Booster Vaccines (UC Davis Vet Views, cca0810)", 2008-10. Checker: verified. <https://vetext.vetmed.ucdavis.edu/sites/g/files/dgvnsk5616/files/local_resources/pdfs/pdfs_beef/cca0810-booster-vaccines.pdf>

**RULE-HLTH-02: Open health task due within 7 days is a warning ('Plan it with the next gather').** Class D (synthetic demonstration setting).
The 7-day lead time has no source; the code comment reads "health task due within a week". NDSU (2025) advises checking cattle closely in pasture for early pinkeye signs, which is observation in place rather than a gather. Phase 1: label 7 days as a demo setting; the pinkeye check must still be found.

Key sources:

  - NDSU Agriculture Communication (J. Galbreath, L. Quail), "Summer brings raised pinkeye concerns in cowherds", 2025-07-02. Checker: verified. <https://www.ag.ndsu.edu/news/newsreleases/2025/july/summer-brings-raised-pinkeye-concerns-in-cowherds>

**RULE-HLTH-03: Open task with a blank due date, or a status other than exactly 'open', is skipped silently.** Class C (ranch-specific management choice).
The research gave class C, but the citation checker (health dispute 6) and the registry treat silently dropping open tasks as a data-integrity defect, not a management choice. The replacement, trimming and lower-casing status and showing an open task with no date as a data issue, is a fixed data-contract rule, not a setting. BQA's record-keeping guidance ("Keep records of all products administered including date, animal identification, product used") is the basis for not dropping outstanding tasks.

Key sources:

  - Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor), "Beef Quality Assurance National Manual (bqa_manual_final.pdf)", undated (no date in the PDF; newest data cited are the 2016 NBQA, a 2018 footnote and a 1998-2017 series). Likely superseded: NCBA announced an updated manual on 2024-12-19 (2025-01-06 is a trade-press reprint date), and bqa.org now links a 2026 edition that could not be fetched.. Checker: verified. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf>

**RULE-BUD-01: Category serious when more than 10% over budget, season to date.** Class D (synthetic demonstration setting).
No extension, agency or peer-reviewed source sets 10% for ranch budget categories. Institutional examples pair a percent with a dollar test and disagree on the logic: the University of Washington requires an explanation at 10% or more and \$5,000 or more (both; the page is marked "ON HOLD"), while the University of Alberta uses 5% or \$100,000 for year-end variances that trigger a funding plan, not monthly alerts (checker: partly). GFOA names no numeric threshold. Phase 1: count closed months only (RULE-BUD-05), exclude rows after as_of, judge a zero budget in dollars (RULE-BUD-06), and fold 10% into the combined percent-and-dollar rule (RULE-BUD-03) as a labelled demo setting. Fuel and Repairs must still be found.

Key sources:

  - University of Washington Finance, Management Accounting & Analysis, "Recharge Center Variance Analysis \*ON HOLD", 2014-02-28 (page submission date; page marked ON HOLD, replaced by monthly financial reporting). Checker: verified. <https://finance.uw.edu/maa/node/228>
  - University of Alberta (UAPPOL), "Budget Variance Accountability Procedure", Approved 2006-07-17; editorial amendments 2025-05-20. Checker: partly. <https://ualberta.ca/en/alfresco/uappol/finance/budget-variance-accountability/procedure/budget-variance-accountability-procedure.pdf>
  - Government Finance Officers Association (GFOA), "Budget Monitoring (best practice)", Board approved 2018-03-31. Checker: partly. <https://gfoa.org/materials/budget-monitoring>

**RULE-BUD-02: Category warning when 5-10% over budget (strict comparisons; no dollars on the row).** Class D (synthetic demonstration setting).
Same evidence as RULE-BUD-01; 5% appears only with a dollar alternative and at institutional scale. Phase 1: make the bounds inclusive so the code matches "5-10%", print one decimal place, and show dollars on every row.

Key sources:

  - University of Alberta (UAPPOL), "Budget Variance Accountability Procedure", Approved 2006-07-17; editorial amendments 2025-05-20. Checker: partly. <https://ualberta.ca/en/alfresco/uappol/finance/budget-variance-accountability/procedure/budget-variance-accountability-procedure.pdf>
  - University of Washington Finance, Management Accounting & Analysis, "Recharge Center Variance Analysis \*ON HOLD", 2014-02-28 (page submission date). Checker: verified. <https://finance.uw.edu/maa/node/228>

### 6.3 Current gaps that the research turns into proposed rules

| Rule ID | Gap | Class | Research phase | Related findings |
|---|---|---|---|---|
| RULE-WAT-05 | Water severity does not consider whether cattle are on the tank's pasture or due to move there. | C (changed) | 2 | [WAT-06](#wat-06), [UI-09](#ui-09), [GRZ-08](#grz-08) |
| RULE-GRZ-03 | `pastures.csv` carries min_rest_days, but no code reads it. | B | 2 | [GRZ-04](#grz-04), [GRZ-05](#grz-05) |

**RULE-WAT-05.** The occupancy principle is general guidance: "Provide adequate quantity, quality, and distribution of
drinking water for animals during periods of occupancy" (NRCS CPS 528, 2025). Showing tank status on the grazing row and
letting a destination tank's status delay a move are ranch choices, so the merged rule is class C. It belongs with the
Phase 2 consequence-aware ranking.

**RULE-GRZ-03.** Recovery minimums depend on region and growth rate. NDSU R1780 gives 45 days in fast growth and 65 days
in slow growth for western North Dakota rangeland; NRCS South Dakota Technical Note 9 gives at least 45 consecutive days
of growing-season rest for once-over rangeland. The check must land with the generator fix ([GRZ-05](#grz-05)).

Key sources:

  - USDA NRCS, "Grazing Management (Code 528) Conservation Practice Standard", June 2025. Checker: partly. <https://www.nrcs.usda.gov/sites/default/files/2025-07/528-nhcp-cps-grazing-management-2025-rev.pdf>
  - NDSU Extension (Meehan, Sedivec, Printz), "The North Dakota Grazing Monitoring Stick: A Way to Measure Range and Pasture Utilization (R1780)", Revised October 2024 (original date not shown). Checker: verified. <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/R1780%20The%20North%20Dakota%20Grazing%20Monitoring%20Stick%20%281%29.pdf>
  - USDA NRCS South Dakota, "Prescribed Grazing, Range Technical Note No. 9", April 2017. Checker: partly. <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf>

### 6.4 Current workflow rules (not thresholds)

| Rule ID | Current rule | Class | Related findings and notes |
|---|---|---|---|
| RULE-WF-01 | Severity shown by icon shape plus a word, never colour alone | A | No finding against it. Phase 1 extends the same shape-and-word treatment to CAN'T TELL. |
| RULE-WF-06 | Pointer targets at least 24 x 24 CSS px (WCAG 2.5.8); passes for the filter chips | A | [UI-01](#ui-01) measures chart marks (gain dots 3.9 x 3.9 px), which the registry files under [UI-01](#ui-01). |
| RULE-WF-07 | Keyboard focus visible and not hidden (WCAG 2.4.7, 2.4.11); passes in Chromium | A | [UI-10](#ui-10) is a different problem: focus is lost after a chip is activated. |
| RULE-WF-09 | Every exception row carries a first step | B | [GRZ-08](#grz-08) (one blanket action), [UI-02](#ui-02) (the First step column is off-screen on a phone). CAN'T TELL rows also need a first step. |
| RULE-WF-19 | Duplicate and stale rows suppressed by design | B | [WAT-09](#wat-09) (a silent tank's last level is discarded), [GAIN-09](#gain-09) (an animal losing weight is not named while its group is flagged). |
| RULE-WF-21 | The as_of snapshot, the 10 planted problems and the 3 severity levels are demonstration settings | D | Keep the fictional labels on screen and in print. |

## 7. Unresolved assumptions and registry disagreements

### 7.1 Assumptions recorded in the findings registry

Quoted from findings.json `unresolved_assumptions`:

- That opening and re-saving the committed CSVs in Excel rewrites ISO timestamps as M/D/YYYY is unverified; no spreadsheet program was run ([DATA-02](#data-02)).
- The 3% shrink and fill swing in [GAIN-10](#gain-10) is an assumed figure, not a measurement.
- The gallons-per-head-per-day figure in [WAT-06](#wat-06) is an assumption for illustration; the data has no capacity or consumption.
- How the GitHub Pages 404 page behaves is inferred from the local server, because the site was unreachable.
- Real-device touch behaviour and screen-reader announcements are untested ([UI-01](#ui-01), [UI-10](#ui-10)).
- Firefox and WebKit rendering are untested.
- That the browser tab would eventually crash in [GAIN-02](#gain-02) is inferred from rising memory; only the hang was observed.
- How common reused tag numbers across groups ([GAIN-06](#gain-06)), per-pasture tank names ([WAT-04](#wat-04)) and comma-formatted weight exports ([CSV-01](#csv-01)) are in real ranch data is inferred, not measured.
- Whether a budget month counts as closed on its last calendar day ([BUD-01](#bud-01) assumes yes, so as_of 2026-09-30T18:00 includes September) or only after that day has ended is a ranch bookkeeping choice; the committed severities are the same either way ([BUD-01](#bud-01)).

### 7.2 Where the findings and rules registries disagree

These were found while cross-reading the two registries for this document. Each needs one decision before the fix and
its test are written. None changes a finding's severity.

1. **When a budget month counts as closed.** [BUD-01](#bud-01) assumes a month closes on its last calendar day, so as_of
   2026-09-30T18:00 includes September (Fuel 21% over, \$2,040; Repairs 25% over, \$1,800). RULE-BUD-05's phase note
   defaults `books_closed_through` to "the month before as_of's month, labelled 'assumed'", which would leave September
   out. On the committed data that gives Fuel 20.0% over (\$1,440) and Repairs 13.3% over (\$720), both still serious
   (`findings.handvalues.py`: "Jun-Aug only ... (('Fuel', 20.0, 1440), ('Repairs', 13.3, 720))", MATCH). This is a ranch
   bookkeeping choice and is already listed in 7.1.
2. **The dollar lines in the combined budget rule.** RULE-BUD-03 uses demo values of warning at 5% and \$500, serious
   at 10% and \$1,000 (both conditions), a large-dollar warning at \$2,500, and \$250 for unbudgeted spending.
   [BUD-04](#bud-04)'s regression test states different demo values: no row under \$500 over; warning at 5% or more, or \$2,500 or
   more; serious above 10%, or \$5,000 or more. Applying each set as stated, the two rate [BUD-04](#bud-04)'s Feed case (\$9,500
   over, 9.5%) differently: serious under [BUD-04](#bud-04)'s values, a warning under RULE-BUD-03's (9.5% is under its 10% serious
   line). Choose one set, label it as demo settings, then write the test.
3. **Whether a large under-spend is a warning.** [BUD-07](#bud-07) proposes a Phase 2 under-budget warning; RULE-BUD-13 proposes
   showing large favourable variances as information only, with no severity, and defers it.
4. **How many re-entries are short of minimum rest.** RULE-GRZ-03's phase note says "13 of 15 short re-entries". The
   grazing skeptic corrected this in [GRZ-05](#grz-05) to 11 of 13 sequential re-entries short of minimum rest, plus 2 entries into a
   pasture another group still occupied. `findings.handvalues.py` agrees with the corrected figures: sequential
   re-entries and short ones "(13, 11)", and two shared pastures (P2 Cows and Yearlings for 7 days; P4 Heifers and
   Yearlings for 11 days). Use the findings registry's figures.
5. **The minimum interval for individual gain.** RULE-GAIN-07 recommends a 70-day individual default. Its phase note
   says that default "is met only by a method that uses all three weigh-ins; an ADG from the last 57-day interval alone
   falls under it (not tested in this audit)", and asks for a check that the planted heifer and six-yearling problems
   remain. [GAIN-03](#gain-03) proposes a group minimum interval (demo value, for example 21 days). The individual and group
   minimums are separate settings; the individual one must be chosen and tested against the planted problems before
   it is adopted.
6. **How the 24-hour drop window is bounded.** RULE-WAT-03's phase note compares the latest reading with "the reading
   about 24 h before the latest, within one reporting interval". [WAT-03](#wat-03)'s fix uses the highest level inside
   [last − 24 h, last] minus the last level. Both keep the committed result (T4 at 46 points; every healthy tank at or
   under 18.2 by either measure in `findings.handvalues.py`), but only the second sees a fall that refilled inside the
   window (W-03). Choose one and test it.
7. **Where the completeness critic's edits are described.** `registry-changelog.md` covers only the citation critic's
   pass on `rules.json` and `sources.json`. The completeness critic's edits to `findings.json` (for example [GAIN-08](#gain-08) moved
   to Phase 1, and the [CSV-05](#csv-05) / [HLTH-01](#hlth-01) split) are recorded in each entry's `status_note`, in findings.json `revisions`
   and `spot_checks`, and in `findings-map.json`, but the changelog has no section for them.

### 7.3 Blocked or untested

- The published GitHub Pages site was not reachable (proxy 403); its 404 page and caching are unverified.
- Only Playwright Chromium was run. Real phones, screen readers, Firefox and WebKit were not tested ([UI-01](#ui-01), [UI-10](#ui-10)).
- The registrar did not re-run water.verify V-GAP ([UI-15](#ui-15)), render.repro R13 and later cases, time.verify F4+ and F10+,
  or the render.browser scenarios (findings.json `spot_checks`); their quoted outputs come from the original runs.

## 8. Sources for this document

- `docs/audit/data/findings.json`: every finding, its fields and quoted evidence, the definitions, policies, counts,
  spot checks, context notes and unresolved assumptions. The compact index is `findings-index.json`; the raw-to-registry
  map is `findings-map.json`.
- `docs/audit/data/rules.json` (rules, classifications, sources and checker results) and `rules-index.json`.
- `docs/audit/data/registry-changelog.md`: the citation critic's pass.
- `docs/audit/evidence/baseline.json`: the unit-test result and the blocked checks.
- `docs/audit/01-baseline.md`, section 4.5: the 10 rows on the committed data.
- `docs/audit/diagnostics/findings.handvalues.py`: the independent hand-value check, written on 2026-10-16 (72 checks),
  extended during review and re-run on 2026-10-19 ("85 of 85 checks match").
- Diagnostic scripts named in each entry's "Reproduce" line, all under `docs/audit/diagnostics/`. `01-baseline.md`
  section 8 explains how to run each one and which need a local server.

All ranch data in the repository is fictional (Example Ranch). Health content in this document stays on observation,
scheduling, records and escalation to a veterinarian; it gives no diagnosis and no treatment. Investment and return
economics are out of scope here.
