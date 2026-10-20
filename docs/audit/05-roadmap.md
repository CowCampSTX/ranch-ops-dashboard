# 05. Phased implementation roadmap

This roadmap turns the audit's verified findings and research conclusions into ordered work for the Ranch Operations
Dashboard: **Fix now** (Phase 1), **Build next** (Phase 2), **Add later** (Phase 3) and **Deferred**. Every work item
has a stable ID (P1-01, P2-01, P3-01 ...), names the findings and rules it answers, and states testable acceptance
criteria. The developer-ready detail for Phase 1 (module boundaries, data contract, rule logic, test plan) is in
[06-phase1-spec.md](06-phase1-spec.md).

The dashboard is a portfolio demonstration running on fictional data (Example Ranch). It is **not production-ready**,
and completing this roadmap would not make it so. No current threshold is a validated operating value: the 25% / 40%
tank levels, the 30-point drop in 24 hours, 24 hours of sensor silence, the planned graze days per pasture, the 2-day
move grace, 80% / 50% of target gain, the 2.0 / 1.0 lb daily gain targets, 7 days to due and 5% / 10% over budget are
demonstration settings or ranch choices, to be tuned per ranch. Every new number this roadmap proposes is also a
demonstration setting and is labelled that way. A public data feed or a sourced threshold never makes the example ranch
a real operation. Health content stays on observation, scheduling, records and escalation to a veterinarian; nothing
here is a diagnosis or a treatment protocol. Investment and return-on-investment economics are out of scope; they belong
to the separate Ranch Tech ROI project.

| Item | Value |
|---|---|
| Repository | CowCampSTX/ranch-ops-dashboard |
| Commit reviewed | `cfd77e50a050163b542cadfc6b38882c0341e99d` (main when the audit was written). Findings, quoted outputs and line numbers describe this commit unless a line says otherwise. |
| Updated for the redesign | 2026-10-20. Pull request #2 merged a redesigned page into main (merge commit `0315d09`). Phase 1 starts from that page and keeps what it already does ([section 1.3](#13-order-of-work), [section 2.1](#21-apply-from-phase-1-immediately) item 13). Statements about the redesigned page come from Playwright Chromium runs on main `0315d09` on 2026-10-20, at widths from 320 to 1920 px (mostly 1280 x 900 and 390 x 844), with touch emulated at phone width: `docs/audit/redesign/coverage.mjs` (23 checks pass) and the keep checks that [06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign) lists (34 pass). Real phones, screen readers, Firefox and WebKit were not tested. |
| Built from | `docs/audit/data/findings.json` (83 findings; compact index `findings-index.json`), `docs/audit/data/rules.json` (98 rules; compact index `rules-index.json`; data fields split into `data-fields.json`, integrations into `integrations.json`), `sources.json`, `registry-changelog.md`, and the evidence files in `docs/audit/evidence/` (`baseline.json`, `audit_*`, `verify_*`, `research_*`, `cite_*`). |
| Earlier documents | [01-baseline.md](01-baseline.md) (how the code works today), [02-findings.md](02-findings.md) (every finding, with evidence), [03-research-and-data.md](03-research-and-data.md) (rules research and data requirements), [04-workflow-and-features.md](04-workflow-and-features.md) (morning workflow and the Phase 3 ranking). |
| Project guidance files | At the reviewed commit `cfd77e5` there was **no PROJECT_CONTEXT.md or AGENTS.md**. This roadmap is judged against README.md, the code, the committed fictional data, the project purpose and the lead's phase defaults. The repository now has [AGENTS.md](../../AGENTS.md) (added 2026-10-20) with the instructions for every agent. |
| Scenario folders | `docs/audit/scenarios/` (10 end-to-end scenarios, each with CSV files, `expected.json` and `scenario.md`, plus a shared `settings.json`; built by `docs/audit/diagnostics/scenarios.build.py` and run against today's code by `scenarios.run.mjs`) was written by a parallel audit step while this roadmap was being finished. It is committed on the work branch in the work-in-progress commit `b548e4f` (2026-10-19) and may still change. P1-17 runs it; decision D16 reconciles its inputs with the Phase 1 data contract. |
| Blocked checks | The published GitHub Pages site (https://cowcampstx.github.io/ranch-ops-dashboard/) could not be reached; the environment's proxy answered 403. Only Playwright Chromium (with phone and touch emulation) was run in the audit. Real phones, screen readers, Firefox and WebKit were not tested. |
| What this roadmap did not do | It changed no code, data, test or README file and ran no new test of the dashboard. A few numbers were computed for it from `data/*.csv`; each is marked "(roadmap check)" (see "How to read this roadmap"). |

## Contents

- [How to read this roadmap](#how-to-read-this-roadmap)
- [1. Summary](#1-summary)
- [2. Requirements by phase](#2-requirements-by-phase)
- [3. Phase 1: Fix now](#3-phase-1-fix-now)
- [4. Phase 2: Build next](#4-phase-2-build-next)
- [5. Phase 3: Add later](#5-phase-3-add-later)
- [6. Deferred and excluded](#6-deferred-and-excluded)
- [7. Unresolved assumptions and open decisions](#7-unresolved-assumptions-and-open-decisions)
- [8. Sources for this document](#8-sources-for-this-document)

## How to read this roadmap

### Four kinds of statement

1. **Verified findings.** Defects and design limitations that the audit reproduced and a skeptic pass checked. They
   carry a finding ID such as [WAT-03](02-findings.md#wat-03), exactly as in `findings.json`. Quoted outputs (in
   quotation marks) are copied from that file's `actual`, `expected`, `verifier` or `regression_test` fields.
2. **Research conclusions.** Rules, classifications and data requirements from `rules.json`. They carry a rule ID such
   as [RULE-BUD-03](03-research-and-data.md#rule-bud-03) and the rule's class (A-D).
3. **Recommendations.** Everything in the work items (proposed behaviour, files, dependencies, effort, acceptance
   criteria), the order of work and the decisions table in section 1.4. Nothing in the dashboard was changed.
4. **Unresolved assumptions and open decisions.** Collected in [section 7](#7-unresolved-assumptions-and-open-decisions).

### Classification of thresholds and rules

| Class | Meaning |
|---|---|
| A | Supported general guidance |
| B | Context-dependent guidance |
| C | Ranch-specific management choice |
| D | Synthetic demonstration setting |

The research found no current ranch operating threshold in class A. The only current class-A rules are display rules
from WCAG ([RULE-WF-01](03-research-and-data.md#rule-wf-01), [RULE-WF-06](03-research-and-data.md#rule-wf-06),
[RULE-WF-07](03-research-and-data.md#rule-wf-07)); the citation critic's check reads "A current threshold classified A:
None." (`registry-changelog.md`).

### What each work item contains

- **Problem and evidence:** the findings (with severity) and rules the item answers, with a short quote of the observed
  behaviour.
- **Proposed behaviour:** what the dashboard should do after the change, in terms a ranch manager and a developer can
  both check.
- **Files and data affected.**
- **Dependencies:** items that must land first (or in the same change).
- **Effort:** S, M or L, using the registry's key: "S: Small: a focused change, usually under a day. M: Medium: several
  functions or files. L: Large: a data-model change." An item's effort is this roadmap's estimate for the whole item;
  the effort of each finding is in the coverage tables.
- **Acceptance criteria:** testable statements. For Phase 1 the headline criteria are listed here and the full list,
  case by case, is in [06-phase1-spec.md section 12](06-phase1-spec.md#12-acceptance-criteria-per-p1-item).

### Test-case names

Names such as W-02, GN-07, CSV-35, TIME-18 or GB-09 are test-case IDs from the audit's diagnostics scripts
(`docs/audit/diagnostics/*.mjs`), quoted in the findings' evidence. They are not finding IDs. Finding IDs always link to
[02-findings.md](02-findings.md), and rule IDs always start with RULE-. Where a test-case label is also a finding ID
(CSV-07), is used by two scripts (B-03, GB-09) or looks like a finding ID (TIME-18, TIME-D1), the acceptance criteria
write it with its script, for example `water.repro:B-03` or `grazing.repro:GB-09`
([06 section 12](06-phase1-spec.md#12-acceptance-criteria-per-p1-item)).

### Numbers in this roadmap

Numbers in quotation marks come from the evidence. Hand values in acceptance criteria come from each finding's
`regression_test` or `expected` field; the audit re-checked them with `docs/audit/diagnostics/findings.handvalues.py`
("85 of 85 checks match", run 2026-10-19 according to [02-findings.md](02-findings.md)). A few numbers were computed for
this roadmap from `data/*.csv` with a short Python script on 2026-10-19. They are marked **(roadmap check)**. They are
not part of the audit's verified evidence and do not test the dashboard.

---

## 1. Summary

### 1.1 The phases at a glance

| Phase | Items | Findings covered | Rules covered | Outcome for the manager |
|---|---|---|---|---|
| 1. Fix now | 17 (P1-01 to P1-17) | 55 (18 high, 19 medium, 18 low), each by exactly one item | 33 Phase 1 rules | The page reads ordinary exports correctly, never shows a missing or unreadable area as all-clear, says CAN'T TELL with a reason and a first step, uses one as-of time with a time zone, cannot be blanked by one bad file, renders CSV text safely, and labels every threshold as a demonstration setting. |
| 2. Build next | 11 (P2-01 to P2-11) | 25 | 15 Phase 2 rules | A morning review built around freshness, consequence-ranked rows, filters by severity, pasture and group, "why this row" explanations, "Show data" tables, short dates in rows, a printable crew briefing, rest checks, and optional per-device marks labelled "this device only". Chart readings by mouse, touch and keyboard, the phone layouts, the tank cards' reading times, the summary card and area chips that keep focus are already on the page (the redesign, pull request #2; [08 section 3](08-redesign-coverage.md#3-coverage)) and are kept from Phase 1 on ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)); P2-01 to P2-06 say what each item still adds. |
| 3. Add later | 3, ranked (P3-01 to P3-03) | 1 ([WAT-06](02-findings.md#wat-06)) | 10 Phase 3 rules | Water supply coverage from tank capacity and head count; forage observations at moves; drought and precipitation context as a dated snapshot. |
| Deferred | none | 2 ([GAIN-10](02-findings.md#gain-10), [GRZ-09](02-findings.md#grz-09)) | 40 deferred rules | Recorded with reasons in [section 6](#6-deferred-and-excluded). |

Every phase keeps the current architecture: a static site of plain HTML and JavaScript ES modules, `node:test` unit
tests, no framework, no backend, no paid service and no AI feature.

### 1.2 What Phase 1 changes, in plain terms

- **A blank cell means "missing", never zero.** IDs and tags stay text ("007" stays "007"). Dates must be real dates.
  Anything the page cannot read becomes a visible **data issue** naming the file, row, column and value.
- **Three states everywhere.** Each area, tank, group, task and budget category is **OK**, **needs attention**, or
  **CAN'T TELL** (missing, stale, invalid or insufficient data). An area whose file is missing or empty says so; it
  never says "Nothing needs attention".
- **One as-of time.** `meta.csv` gains the ranch time zone. Rows dated after the as-of time are left out and reported.
  Day counts are the same for every viewer, wherever they are.
- **One bad file cannot blank the page.** A loading message, a banner naming any file that failed, and sections that
  fail on their own.
- **Rule fixes that keep the 10 planted problems.** A true 24-hour drop window, a tank master list, gain from a
  consistent pair of weigh sessions with coverage shown, normalised health status, budget over closed months with
  percent and dollar lines.
- **Safe rendering and honest copy.** CSV text is shown as text. The rules table shows each threshold's basis ("Demo
  setting"); "here now" becomes "as of <date>"; the tank tile becomes "Sensors normal".
- **What the redesign already does stays.** Chart readings by mouse, touch and keyboard, the phone layout, the tank
  cards, the budget table and charts drawn at their card's width are kept, not rebuilt (section 2.1, item 13).

### 1.3 Order of work

Phase 1 starts from main, whose page files are the redesigned page of `0315d09` (pull request #2), and only after the
documentation pull request that brings this roadmap and [06-phase1-spec.md](06-phase1-spec.md) in line with that page
has been reviewed (Checkpoint 1b in `CODEX_REVIEW_PROMPT.md`) and merged by the owner. That pull request changes no
page code. Every step below keeps what the redesigned page already does
([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign); section 2.1, item 13).

Phase 1 items can be built in this order. Items on the same line can run in parallel.

| Step | Items | Why this order |
|---|---|---|
| 1 | P1-17 (boundary tests that pin today's behaviour, part a), P1-13 | The water and grazing boundary tests ([TEST-01](02-findings.md#test-01), [TEST-02](02-findings.md#test-02)) pin today's demo behaviour before anything is refactored. Safe rendering ([SEC-01](02-findings.md#sec-01)) is independent and low-risk. |
| 2 | P1-01, then P1-02 | The reader and the typed data contract are the base for everything else. |
| 3 | P1-05 together with P1-03, then P1-04 | The generator writes the new `meta.csv` fields, `tanks.csv` and `weigh_sessions.csv` in the same change as the code that reads them, so CI's "committed data matches the generator" check stays green. The scenario folders' inputs are updated in the same change (decision D16). |
| 4 | P1-06 | Loading, error and partial-data states, the row model with CAN'T TELL, and section isolation. |
| 5 | P1-07, P1-08, P1-09, P1-10, P1-11, P1-12 | Area rules, in parallel. P1-10 follows P1-09. |
| 6 | P1-14, P1-15, P1-16 | Tiles, charts, wording and rule copy, once the structured results exist. |
| 7 | P1-17 (part b) | Browser smoke test, including the checks that the redesign's keyboard, touch and phone behaviour is kept ([06 section 11.4](06-phase1-spec.md#114-browser-smoke-test)), and the CI changes. |

Phase 2 starts when the Phase 1 acceptance bar ([section 3.1](#31-phase-1-acceptance-bar)) is met. Phase 3 items depend
on named Phase 1 and Phase 2 items (see each item).

### 1.4 Decisions this roadmap makes where the evidence disagrees

The findings registry and the rules registry disagree in a few places ([02-findings.md section 7.2](02-findings.md#72-where-the-findings-and-rules-registries-disagree),
[03-research-and-data.md section 6.3](03-research-and-data.md#63-where-the-registries-disagree)). Each needs one decision
before code is written. These are recommendations; the lead or the owner can reverse any of them.

| # | Topic | Options in the evidence | Decision | Why |
|---|---|---|---|---|
| D1 | When a budget month counts as closed | [BUD-01](02-findings.md#bud-01) assumes a month closes on its last calendar day. [RULE-BUD-05](03-research-and-data.md#rule-bud-05) defaults `books_closed_through` to "the month before as_of's month, labelled 'assumed'". | `meta.csv` carries `books_closed_through`; the generator writes `2026-09`. When the field is absent, use the RULE-BUD-05 default and label it "assumed". A value whose last day is after the as-of date is a data issue and is clamped. The scenario folders count a month by BUD-01's convention (`docs/audit/scenarios/settings.json` `monthClosed`: "a month counts when the ranch as-of date is on or after its last day"); under D16 they carry the field explicitly instead. | The committed severities must not depend on the default. On the committed data the default would give "Fuel 20.0% over (\$1,440) and Repairs 13.3% over (\$720)" ([02-findings.md 7.2](02-findings.md#72-where-the-findings-and-rules-registries-disagree)); under the combined rule in D2, \$720 is under the \$1,000 serious line, so Repairs would fall from serious to warning (roadmap check, arithmetic on those quoted values). Writing the field explicitly keeps the planted severity. |
| D2 | Budget percent and dollar lines | [RULE-BUD-03](03-research-and-data.md#rule-bud-03) demo values: "warn 5% and \$500, serious 10% and \$1,000, large \$2,500, unbudgeted \$250". [BUD-04](02-findings.md#bud-04)'s test states OR-based values. [BUD-05](02-findings.md#bud-05) asks for "warning at 5% or more up to 10%, serious above 10%". | RULE-BUD-03's values and structure, with BUD-05's boundaries: serious when more than 10% over **and** at least \$1,000 over; warning when at least 5% over **and** at least \$500 over, or at least \$2,500 over whatever the percent; \$250 for spending with no budget. All demo settings (D). | RULE-BUD-03 is the rules registry's lead default; BUD-05's bounds match the rule text "more than 10%" and "5-10%". BUD-04's expected outcomes still hold: Ear tags (\$30 over) gives no row, Feed (\$9,500, 9.5%) gives a warning, Hay (\$4,000, 4%) gives a warning. |
| D3 | Money formats in `budget.csv` | [BUD-02](02-findings.md#bud-02) accepts "accounting parentheses, '\$' and thousands separators" if the contract states it. `data-fields.json` (budget.budget) says plain digits only. [RULE-BUD-07](03-research-and-data.md#rule-bud-07) (deferred) prefers a plain minus sign. | Accept plain numbers, a leading "\$", correctly grouped thousands separators, a leading minus, and accounting parentheses for `actual` only. Anything else is a data issue. | Bookkeeping exports commonly use these forms; all registries agree an unreadable amount must block that category's conclusion and never become NaN or silence. |
| D4 | Thousands separators in numeric columns | [CSV-01](02-findings.md#csv-01) expects a quoted "1,169" weight to be read as 1169. `data-fields.json` (weights.weight_lbs) says "no thousands separators". | Accept correctly grouped thousands separators in numeric columns (a quoted "1,169"), and nothing looser. | CSV-01's verified expected result; the strict pattern cannot be confused with two cells once quotes are read properly. |
| D5 | 24-hour drop window | [RULE-WAT-03](03-research-and-data.md#rule-wat-03): compare with "the reading about 24 h before the latest, within one reporting interval". [WAT-03](02-findings.md#wat-03)'s fix: use only readings in [last - 24 h, last]; "drop = max level in that window minus the last level (or the max drawdown inside it); state the real span in hours". | The largest fall from an earlier to a later valid reading inside [last - 24 h, last] (the max drawdown), with the real span in hours. When the window holds only the last reading, the 24-hour change is CAN'T TELL: the tank gets a warning CAN'T TELL row "Not enough recent history to judge the 24-hour change" unless its level already gives an alert, and it is still judged on level and silence (WAT-03's fix: "say the 24-hour change can't be judged rather than reporting 0"; scenario 04's T1 expects such a row). The row adds RULE-WAT-03's wording "unexplained fall; leak not confirmed". | Only the drawdown form sees a fall that refilled inside the window (W-03: "the 40-point fall inside the window (90 - 50) reported"), and the window form finds a new sensor's fast drop (W-02: "45 points in 18 hours"). Both forms keep the committed result ("T4 at 46 points; every healthy tank at or under 18.2 by either measure"). The scenario folders use the other form ("(highest level in [last - 24 h, last]) - last level"); the two give the same verdict for every tank in all 10 folders (roadmap check). |
| D6 | Minimum interval for gain | [RULE-GAIN-07](03-research-and-data.md#rule-gain-07) recommends a 70-day individual default (from controlled-feed test standards) and says it "is met only by a method that uses all three weigh-ins; an ADG from the last 57-day interval alone falls under it (not tested in this audit)". [GAIN-03](02-findings.md#gain-03) proposes a group minimum "for example 21 days". | Two settings: a group minimum of 21 days and an individual minimum of 42 days between the two weigh sessions. Both are demo settings (D). The 70-day figure is documented in the rules table as the research default for controlled tests, not adopted for the demo. | The six planted slow yearlings are slow only in the last 57-day interval (the generator sets their rate only for the third weigh-in, `scripts/generate_data.py`), so any individual minimum above 57 days, or a method that blends all three weigh-ins, would drop or dilute a planted problem. A calculation written after the registries answers RULE-GAIN-07's "not tested": `docs/audit/diagnostics/scenarios.gain70.py` prints "yearlings under 1.0 lb/day by last 57-day interval: 6", "by 3-point regression (106 days): 1 ['Y129']" and "by Jun 1-Sep 15 two-point: 0 []". The scenario folders use 21 days for animals as well (`settings.json` `gainMinIntervalDays`); on their data the result is the same, because every judged pair is 57 days apart (roadmap check). |
| D7 | A silent tank: alert or CAN'T TELL | [RULE-WAT-04](03-research-and-data.md#rule-wat-04) phase note: "A silent tank is CAN'T TELL". findings.json `policies.phase_1_acceptance`: CAN'T TELL states should not appear on the committed data. | The T6 row becomes a CAN'T TELL row with severity **serious**, the same subject and the same "No reading for 42 hours; last level 98.5%" text. It is the only CAN'T TELL row on the committed data. | Treating "no reading" the same way for every tank (silent, no readings at all, last reading not a level) is clearer for the manager. The planted severity does not change. |
| D8 | A group with two open stays | [RULE-GRZ-01](03-research-and-data.md#rule-grz-01) phase note: a data issue (CAN'T TELL), "not a grazing row". [GRZ-02](02-findings.md#grz-02): judge only the latest stay and report the extra one. | Judge the latest stay and add a data issue naming both stays. | GRZ-02's verified expected result keeps the real overstay visible ("One Yearlings row (Sand Hills, 3 days over) plus a data issue"). |
| D9 | Weigh basis in Phase 1 | [RULE-GAIN-06](03-research-and-data.md#rule-gain-06) (class C, Phase 1) and `data-fields.json` put `weigh_sessions.csv` `weight_basis` in Phase 1. The lead's Phase 1 list does not name it. [GAIN-10](02-findings.md#gain-10) defers the fuller weigh-condition records. | Include the minimal `weight_basis` per weigh session in Phase 1 (P1-10). Keep the fuller records deferred. No scenario folder has `weigh_sessions.csv`; D16 adds one to each. | A routine shrink difference can exceed the serious margin ([GAIN-10](02-findings.md#gain-10): "3% of the 846.74-lb mean yearling over 57 days = 0.4457 lbs/day" against a 0.4 lbs/day margin; the 3% is an assumption). If Phase 1 must shrink, this is the first item to move to Phase 2. |
| D10 | Health status values | [HLTH-01](02-findings.md#hlth-01): open, done, cancelled. `data-fields.json`: open, done, cancelled, deferred. | Accept open, done and cancelled. Any other value, including "deferred", is treated as open and reported as a data issue. | Nothing is hidden; the ranch can decide later what "deferred" means. |
| D11 | Name of the optional planned move date | [GRZ-01](02-findings.md#grz-01) says `planned_move_date`; `data-fields.json` says `moves.csv planned_out_date`. | `planned_out_date`. | Matches the data-fields registry. |
| D12 | Under-spend (Phase 2) | [BUD-07](02-findings.md#bud-07) proposes a Phase 2 warning. [RULE-BUD-13](03-research-and-data.md#rule-bud-13) (deferred) proposes information only, with no severity. | Phase 2 shows a large under-spend as an information line in the budget section, not as a warning row. | The morning list is for things to act on today or this week; the prompt "Confirm the work was done and the bills are entered" fits the monthly budget review. |
| D13 | Grazing re-entry counts | RULE-GRZ-03 says "13 of 15"; [GRZ-05](02-findings.md#grz-05) says 11 of 13 sequential re-entries, plus 2 shared pastures. | Use GRZ-05's figures. | The skeptic's correction, confirmed by `findings.handvalues.py` ("(13, 11)"). |
| D14 | Dates in row text | [UI-13](02-findings.md#ui-13) (Phase 2) changes raw ISO dates to "Jul 20". Several Phase 1 tests quote ISO strings. | Phase 1 keeps ISO dates (YYYY-MM-DD) in row text, including new text. Phase 2 switches every row in one change (P2-06). | Phase 1 does not depend on Phase 2, and the Phase 1 tests stay stable. |
| D15 | Several rows for one record | [BUD-02](02-findings.md#bud-02)'s test adds a separate credit row ('2026-09,Repairs,0,(300)') and expects it summed. `data-fields.json`: "(month, category) unique; a duplicate pair is a data issue". [DATA-03](02-findings.md#data-03): "exact duplicates are dropped and counted". | Exact duplicate rows are dropped and counted in every file. In `budget.csv`, rows that share a month and category but differ are added together and reported as a warning. In `weights.csv`, two different weights for one animal on one day are averaged and reported. In the master files (pastures, groups, tanks), one ID with two different definitions is an error, and whatever depends on it is CAN'T TELL. Several open rows for one health task are judged once, on the earliest due date, and reported. | Every resolution is order-independent and visible. Separate credit lines are normal in bookkeeping exports (BU-05 is "a warranty refund entered as an accounting-style credit"); a revised re-export would be double-counted, which is why the warning names both rows. Averaging keeps GAIN-02's expected "0.44" for H001. |
| D16 | Scenario folders and the Phase 1 data contract | `docs/audit/scenarios/` expects the planted rows on inputs that lack the Phase 1 contract fields: folder 01 is the committed data with "as_of" only and no `tanks.csv`; no folder has `weigh_sessions.csv` or `books_closed_through`; `settings.json` counts closed months by BUD-01's convention. `data-fields.json` says a missing zone means "treat time-based rules as CAN'T TELL", an unknown weigh basis gives "no serious or individual flags (CAN'T TELL)" ("The demo must record a basis for every session so the planted gain problems still show"), and `books_closed_through` defaults "to the month before as_of's month". Folder 01's own `scenario.md` says: "Once the generator writes `meta.timezone`, `tanks.csv` and HLTH-03's row fix, rebuild this folder from the regenerated `data/` by re-running the builder. The 10 expected rows do not change." | Keep the data contract as `data-fields.json` states it and keep every `expected.json` result unchanged. In the same change as P1-05, update the folders' inputs with `scenarios.build.py`: rebuild 01 from the regenerated `data/`; add `books_closed_through` = 2026-09 to the folders whose as-of date is 2026-09-30 (01 to 07, 09, 10); add `weigh_sessions.csv` (one row per group and weigh date in `weights.csv`, basis `full`) to all 10. Folder 08 (as of 2026-09-27) keeps no `books_closed_through`, so it tests the default. | The expected results are the scenario author's hand arithmetic and remain the reference; only inputs the contract requires are added. Left unchanged, the folders would fail for contract reasons, not rule reasons: Repairs falls to a warning (13.3%, \$720) in 01, 03 to 07 and 10, folder 09 loses its "Vet and health" warning, and every judged gain group becomes CAN'T TELL (roadmap check). The alternative, making `settings.json`'s conventions the defaults, would depart from `data-fields.json` in three places (zone, weigh basis, closed months). |

---

## 2. Requirements by phase

Requirements apply from the phase that introduces the feature they govern. No Phase 1 requirement depends on a Phase 2
or Phase 3 feature, and no "every change must" rule below requires a later-phase feature.

### 2.1 Apply from Phase 1 (immediately)

1. **The 10 planted problems stay found with the same severities**, and the committed data adds no other row and no data
   issue ([section 3.1](#31-phase-1-acceptance-bar)).
2. **Blank means missing.** No rule treats a blank cell as 0 or as text; IDs, tags, names and dates stay strings.
3. **Three states.** Every rule added or changed in any phase returns OK, needs attention or CAN'T TELL; missing,
   stale, invalid or insufficient inputs give CAN'T TELL with a reason and a first step, never an all-clear
   ([RULE-WF-09](03-research-and-data.md#rule-wf-09) phase note: "CAN'T TELL rows also need a first step"). One
   documented exception until P2-08: a group with no current stay gets only an information note, because without
   GRZ-07's group status a shipped or drylotted group cannot be told from a missing record (P1-08). A group whose
   recorded head is 0 and that has no weigh-in in the 45 days (D) before the as-of date is not missing data: it has no
   animals to judge on gain, and the page says so in a note (P1-10). Head 0 with a weigh-in inside those 45 days is an
   inconsistent record and gives CAN'T TELL.
4. **Visible data issues.** Any value the contract rejects becomes a data issue with file, row, column, value, code,
   message and severity. Nothing is dropped silently.
5. **One as-of policy.** Every rule uses the same as-of instant and ranch calendar date; rows dated after it are left
   out and reported.
6. **Section isolation.** A failure in one file, rule area or page section never stops the others from drawing.
7. **Safe rendering.** No CSV-derived text reaches `innerHTML` unescaped.
8. **Honest copy.** Every threshold in `RULES` has a class (A-D) and a basis label in the rules table; demo values say
   so. Snapshot wording is tied to the as-of date: "there as of <date>", never "here now" or "to now"; "today" means
   the ranch as-of date stated in the header (for example "Due today (2026-09-30)", UI-06).
9. **Severity by shape plus a word**, now extended to the CAN'T TELL state ([RULE-WF-01](03-research-and-data.md#rule-wf-01),
   class A). Any control added in any phase keeps targets of at least 24 x 24 CSS px and a visible focus ring
   ([RULE-WF-06](03-research-and-data.md#rule-wf-06), [RULE-WF-07](03-research-and-data.md#rule-wf-07), class A).
10. **Health scope.** Health and gain rows describe what is scheduled or observed and who to call. They never state a
    diagnosis, cause, drug, dose or treatment ([RULE-HLTH-11](03-research-and-data.md#rule-hlth-11)).
11. **Tests with every rule change.** A changed or new rule gets unit tests at its boundaries, and the suite passes under
    more than one viewer time zone.
12. **The architecture stays simple.** Static site, plain ES modules, `node:test`; a pinned test-only browser dependency
    in CI is allowed (P1-17).
13. **Keep the redesigned page's access and layout.** Every chart reading stays reachable by mouse, touch and keyboard
    and stays inside the window; the page stays usable at 390 px wide with no sideways page scroll; the tank cards, the
    budget table with its season-total row, the summary card, the area chips that keep focus, and charts drawn at the
    width of their card with readable text all stay
    ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign);
    [RULE-WF-02](03-research-and-data.md#rule-wf-02), [RULE-WF-06](03-research-and-data.md#rule-wf-06),
    [RULE-WF-07](03-research-and-data.md#rule-wf-07)). The redesign already does all of this, so the rule asks Phase 1
    to keep it, not to build a later-phase feature; the browser smoke test checks it
    ([06 section 11.4](06-phase1-spec.md#114-browser-smoke-test)). Two marks on that page show a state by colour alone
    (the flagged gain dots and the gain and spend tile meters). They are known issues that a separate pull request
    fixes, not features to keep, and Phase 1 adds no mark like them (item 9).

### 2.2 Apply from Phase 2

1. Every chart also gets a "Show data" table and a short text alternative that states its decision-relevant state
   ([RULE-WF-02](03-research-and-data.md#rule-wf-02), [RULE-WF-04](03-research-and-data.md#rule-wf-04)). Reaching chart
   details by keyboard and touch already applies from Phase 1 (section 2.1, item 13).
2. Any browser storage is a per-device convenience labelled "this device only", wrapped in try/catch, and never hides
   or clears a row; the page renders fully with an empty or blocked store
   ([RULE-WF-11](03-research-and-data.md#rule-wf-11), [RULE-WF-15](03-research-and-data.md#rule-wf-15)).
3. Ranking within a severity follows the documented consequence order (P2-09); any new rule states where its rows rank.
4. Each row can explain itself: the readings, their times, the threshold and its basis (P2-04).
5. The page prints a one-page crew briefing (P2-07). Staying usable at 390 px wide already applies from Phase 1
   (section 2.1, item 13).
6. No claim of "a 2-minute review" appears on the page or in the README until a stopwatch test with 2-3 managers is
   recorded ([RULE-WF-18](03-research-and-data.md#rule-wf-18)).

### 2.3 Apply from Phase 3

1. Public context is pinned to the fictional as-of time, labelled with a named stand-in county, committed as a dated
   snapshot, and never fetched live at page load ([RULE-CTX-15](03-research-and-data.md#rule-ctx-15)).
2. No SD Mesonet data is committed or redistributed ([RULE-CTX-16](03-research-and-data.md#rule-ctx-16)).
3. Estimates built on assumptions (gallons per head, tank capacity) show those assumptions beside the number, and are
   not computed when an input is missing ([RULE-WAT-06](03-research-and-data.md#rule-wat-06)).
4. A missing, failed or stale context fetch reads "unavailable", never "no drought"
   ([RULE-CTX-02](03-research-and-data.md#rule-ctx-02)).

### 2.4 Never, in any phase

- No claim that the dashboard is production-ready, and no claim that a threshold is validated.
- No framework, backend, paid service or AI feature without a demonstrated requirement.
- No live integration from the public demo page.
- No treatment protocol, dose or diagnosis on the page.
- No investment or ROI economics (the separate Ranch Tech ROI project covers them).
- No change that makes the fictional Example Ranch look like a real operation.

---

## 3. Phase 1: Fix now

Correctness, data integrity and misleading outputs. Phase 1 keeps plain HTML and JavaScript ES modules with no build
step. It adds no framework, backend, paid service, live integration or AI feature. The full developer specification is
[06-phase1-spec.md](06-phase1-spec.md); each item below names the sections that carry its detail.

### 3.1 Phase 1 acceptance bar

From findings.json `policies.phase_1_acceptance`: "The 10 planted problems are still found with the same severities,
with no new false alarms on the committed data. Data issue rows and CAN'T TELL states are new row types; on the
committed data none should appear after HLTH-03's generator fix."

This roadmap adds one stated exception: the silent T6 tank becomes a CAN'T TELL row with the same serious severity
(decision D7). After Phase 1 the committed data should give exactly these 10 rows, in this order (severity, then area
A-Z, as today), and no data issue. Text in **bold** is new wording; everything else is today's text.

| Severity | Area | What | Problem | Changed by |
|---|---|---|---|---|
| Critical | Water | Tank T2 (Windmill) | Down to 11.8% full | none |
| Critical | Water | Tank T4 (Lone Tree, **Heifers there as of 2026-09-30**) | Dropped 46 points in 24 hours, now 10% **(unexplained fall; leak not confirmed)** | P1-07, P1-16 |
| Serious | Budget | Fuel | **21.3% over budget, season to date through 2026-09** (\$2,040) | P1-12, P1-15 |
| Serious | Budget | Repairs | **25.0% over budget, season to date through 2026-09** (\$1,800) | P1-12, P1-15 |
| Serious | Gain | Heifers | 0.44 lbs/day **between the 2026-07-20 and 2026-09-15 weigh-ins (target 1.0)** | P1-09, P1-15 |
| Serious | Grazing | Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over) | none |
| Serious | Health | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15) | none (new first step) |
| Serious, **CAN'T TELL** | Water | Tank T6 (Cedar Draw) | No reading for 42 hours; last level 98.5% **at 2026-09-29 00:00** | P1-06, P1-07 |
| Warning | Gain | 6 yearlings | Under 1.0 lbs/day **between the 2026-07-20 and 2026-09-15 weigh-ins**: Y027, Y031, Y058, Y082, Y129, Y132 | P1-09, P1-15 |
| Warning | Health | Cows: Pinkeye check | Due in 3 days (2026-10-03) | none |

The severity counts stay "{'critical': 2, 'serious': 6, 'warning': 2}" (`findings.handvalues.py`, quoted in
[02-findings.md](02-findings.md)). The Fuel percent is 2,040 / 9,600 = 21.25%, shown to one decimal as 21.3% (roadmap
check; [RULE-BUD-03](03-research-and-data.md#rule-bud-03) quotes "Fuel (\$2,040, 21.3% over)"). T6's last reading time
(2026-09-29 00:00) follows from "No reading for 42 hours" before 2026-09-30 18:00. The pooled gains behind the two gain
rows are unchanged: Heifers 1119 / 2565 = 0.4363 and Yearlings 16608 / 8550 = 1.94246 (quoted in
[CSV-01](02-findings.md#csv-01) and [GAIN-01](02-findings.md#gain-01)). Matching these 10 rows shows that the rules find what the
generator planted; it does not validate any threshold ([RULE-WF-21](03-research-and-data.md#rule-wf-21)).

Scenario folder `docs/audit/scenarios/01-planted-problems/` writes this bar down as a fixture: its `expected.json` lists
the same 10 rows, totals "2 critical, 6 serious, 2 warning", and accepts T6 as either needs attention or CAN'T TELL.
`scenarios.run.mjs` records it as a MATCH for today's code (`run-results.json`). P1-17 runs it against the new code
after the input update of decision D16.

### 3.2 Work items

#### P1-01: CSV reader and file decoding

- **Findings:** [CSV-01](02-findings.md#csv-01) (high), [CSV-02](02-findings.md#csv-02) (high), [CSV-05](02-findings.md#csv-05) (high), [CSV-07](02-findings.md#csv-07) (low).
- **Related:** under findings.json `policies.ownership`, CSV-05 owns the trimming fix that HLTH-01's 'open ' case also needs; HLTH-01 itself (case and unknown status) is P1-11.
- **Problem and evidence:** the reader splits on line breaks and commas. A doubled-CR moves.csv gives "'30 alerts' including
  'Day 121 of a 21-day plan (100 days over)'" (CSV-01); a ',,,' row gives "'critical|Tank  (undefined)|Down to % full'"
  (CSV-02); a status written 'open ' loses "'serious|Health|Yearlings: Booster vaccine|Overdue by 15 days (due
  2026-09-15)'" (CSV-05); a Windows-1252 file shows "'La Pe�a'" (CSV-07).
- **Proposed behaviour:** a new pure module `csv.js`. It decodes bytes as UTF-8 (removing a byte-order mark) and, when
  the bytes are not valid UTF-8, decodes them as Windows-1252 and adds a visible note naming the file. It reads RFC 4180
  CSV: quoted fields with commas, doubled quotes and line breaks, and CRLF, LF, CR or CR CR LF line endings. It trims
  every cell and header name, skips blank, whitespace-only and all-empty (',,,') rows, and skips a repeated header row,
  counting each kind in one data note. It returns text cells with their spreadsheet row numbers and does no type
  conversion (that is P1-02).
- **Files and data:** new `csv.js`; `exceptions.js` (the old `parseCSV` is replaced or becomes a wrapper);
  `tests/exceptions.test.mjs` lines 64-66, which assert blanket number conversion, are rewritten under P1-17.
- **Dependencies:** none.
- **Effort:** M.
- **Acceptance criteria (headline):** `parseCSV('a,b,c\n"x, y","say ""hi"" now",3')` gives the cells `x, y`,
  `say "hi" now` and `3`; `'a,b\r1,2'` and `'a,b\r\r\n1,x\r\r\n'` each give one record; each committed file with
  `\r\n` replaced by `\r\r\n` gives the committed 10 rows; a ',,,' row or a repeated header gives the same 10 rows, 8
  tanks and the tile "+1.0%" "\$89,303 of \$88,400"; `'Yearlings,P3 ,2026-09-06,'` gives "Day 24 of a 21-day plan (3
  days over)"; ',open ' and ', open' keep the booster and pinkeye rows; Windows-1252 'La Peña' gives "Yearlings in La
  Peña" plus a note naming pastures.csv. Full list: [06 section 12, P1-01](06-phase1-spec.md#p1-01).

#### P1-02: Data contract: columns, types, blanks and IDs

- **Findings:** [CSV-03](02-findings.md#csv-03) (high), [CSV-04](02-findings.md#csv-04) (high, owns blank-means-missing for WAT-01, BUD-01, BUD-02 and GRZ-03), [CSV-06](02-findings.md#csv-06) (high).
- **Problem and evidence:** a header 'level_pct ' loses "'critical|Water|Tank T2 (Windmill)|Down to 11.8% full'"
  (CSV-03); blank cells act as 0 or join as text: "'serious|Fuel|2700324931% over season to date
  (\$259,231,193,400)'" and the tile "'HEAD ON GRASS / 180150'" (CSV-04); a digits-only group name gives "'THROWS
  TypeError: g.group.toLowerCase is not a function'" (CSV-06).
- **Proposed behaviour:** a new pure module `schema.js` holds one contract per file (columns, types, required or
  optional, allowed ranges and values), consistent with `data-fields.json`. Header names match after trimming, ignoring
  case. A missing required column is an error that names the file and column ("water.csv: column level_pct not found")
  and makes the areas that need it CAN'T TELL. A vendor title line above the header is reported, not a crash. A blank
  cell is `null` (missing), never 0 or text. IDs, tags, names and dates stay strings ('007' stays '007'). Numbers must
  be finite and in range; correctly grouped thousands separators are accepted (decision D4). Every rejected value
  becomes a data issue with file, row, column, value, code, message and severity.
- **Files and data:** new `schema.js`; `exceptions.js` reads typed rows only.
- **Dependencies:** P1-01.
- **Effort:** M.
- **Acceptance criteria (headline):** header 'level' gives an issue naming 'water.csv' and 'level_pct' and a CAN'T
  TELL water area; header 'level_pct ' still gives T2 "Down to 11.8% full"; tag '007' stays the string '007'; GN-09
  (blank weight for Y001) keeps the slow list exactly Y027, Y031, Y058, Y082, Y129, Y132 and reports Y001; M5 keeps
  Heifers serious at 0.43 (1088 / 2508); a blank Heifers head never gives '180150'; Cows renamed '2025' gives 10 rows
  and no error. Full list: [06 section 12, P1-02](06-phase1-spec.md#p1-02).

#### P1-03: Dates, times, the ranch time zone and one as-of policy

- **Findings:** [DATA-02](02-findings.md#data-02) (high), [TIME-01](02-findings.md#time-01) (medium), [TIME-02](02-findings.md#time-02) (medium), [TIME-03](02-findings.md#time-03) (medium).
- **Rules:** [RULE-WF-14](03-research-and-data.md#rule-wf-14) (C), the Phase 1 part: "Show 'Data as of <date time zone>'
  and a 'Fictional snapshot, not live' badge in the demo. The per-source freshness strip is phase 2."
- **Problem and evidence:** "TIME-08: 'serious: Yearlings in Sand Hills: Day 113 of a 21-day plan (92 days over)'" and
  the header "'Data as of Invalid Date.'" (DATA-02); a later reading hides the silent T6 sensor (TIME-01, W-07); the
  same files give "UTC 22 (no alert); Chicago 27 (serious); Denver 28 (serious); Auckland 9 (no alert)" hours of
  silence (TIME-02); a UTC-stamped as_of gives "Overdue by 16 days" instead of 15 (TIME-03).
- **Proposed behaviour:** a new pure module `time.js`. Dates are YYYY-MM-DD only; timestamps are YYYY-MM-DDTHH:MM
  (with optional seconds, 'T' or one space, and an optional Z or offset). `meta.csv` gains `timezone` (an IANA name,
  America/Chicago in the demo); stamps without an offset are read as ranch wall-clock time. Every rule uses one as-of
  instant and one ranch calendar date; whole-day counts are the same for every viewer. Rows dated after the as-of time
  are left out of every rule and chart and reported in one note per file. The header reads, for example, "Data as of
  Sep 30, 2026, 6:00 PM CDT (America/Chicago)" with a "Fictional snapshot, not live" badge when `meta.demo` is true.
- **Files and data:** new `time.js`; `schema.js`; `exceptions.js`; `app.js` header; `meta.csv` (P1-05).
- **Dependencies:** P1-02; ships with P1-05 so the generator check stays green.
- **Effort:** L.
- **Acceptance criteria (headline):** '15/09/2026', '2026-09-31', '2026-13-01', '46327' and a required blank each
  give a data issue naming the file and value; under TZ=America/Chicago and TZ=Pacific/Auckland every Grazing and Health
  problem matches `/\b\d+ days?\b/` with no decimal point; W-07 keeps T6 "No reading for 42 hours; last level 98.5%"
  and reports the reading dated '2026-10-29'; the TIME-02 fixture gives 27 silent hours under TZ=UTC and
  TZ=America/Chicago; an as_of of 2026-10-01T01:00Z with zone America/Chicago gives the committed Grazing and Health
  rows and 10 rows in total. Full list: [06 section 12, P1-03](06-phase1-spec.md#p1-03).

#### P1-04: References and duplicates

- **Findings:** [DATA-01](02-findings.md#data-01) (high), [DATA-03](02-findings.md#data-03) (medium).
- **Problem and evidence:** an open move to an unknown pasture "threw TypeError ... -> findExceptions returns nothing
  at all" and the page shows "tiles=0 alertRows=0" (DATA-01); a re-exported budget doubles the overrun to "'serious |
  Budget | Fuel | 21% over season to date (\$4,080)'" (DATA-03).
- **Proposed behaviour:** every reference (pasture, group, tank) is checked against its master file. An exact match
  after trimming is used; a unique match that differs only in letter case is used and reported; anything else is a
  "not in the list" data issue naming the file, row and ID, and the rest of the data is judged as usual (a tank in an
  unknown pasture reads "Tank T9 (P9)", never 'undefined'). Each file has a key; exact duplicate rows are dropped and
  counted, and conflicting duplicates are data issues with a stated, order-independent resolution (for example the
  lower of two tank levels at the same time, [WAT-07](02-findings.md#wat-07)).
- **Files and data:** `schema.js`; `exceptions.js`.
- **Dependencies:** P1-02, P1-05 (`tanks.csv`).
- **Effort:** M.
- **Acceptance criteria (headline):** the open Yearlings move to P9 gives no error, the two critical tank rows, at least
  9 non-grazing rows and exactly one exception row mentioning 'P9'; the closed move to P9 still draws the grazing and
  gain charts and the budget table; the committed budget appended to itself keeps Fuel at \$2,040 plus a duplicate
  note; CSV-35 gives exactly one booster row. Full list: [06 section 12, P1-04](06-phase1-spec.md#p1-04).

#### P1-05: Generator and example data

- **Findings:** [HLTH-03](02-findings.md#hlth-03) (low).
- **Problem and evidence:** the example 'Fly tag check' row is done, last done Jun 5 and next due Sep 1, so it
  "contradicts itself and the meaning of next_due on a done row is undefined" (HLTH-03). The generator also knows each
  tank's pasture (`TANKS` in `scripts/generate_data.py`) but never writes it, and `meta.csv` holds only "as_of
  2026-09-30T18:00" with no zone.
- **Proposed behaviour:** `scripts/generate_data.py` writes `tanks.csv` (tank_id, pasture_id for T1-T8),
  `weigh_sessions.csv` (group, date, weight_basis 'full' for the 6 Heifer and Yearling sessions), and a `meta.csv` with
  `as_of, timezone, season_start, books_closed_through, demo` = `2026-09-30T18:00, America/Chicago, 2026-06-01,
  2026-09, true`. The Fly tag row becomes last_done 2026-09-01, next_due blank, done (HLTH-03's own example). No random
  draw is added or moved, so pastures, groups, moves, weights, water and budget stay byte-identical. The README's data
  table is updated in the same change.
- **Files and data:** `scripts/generate_data.py`; `data/meta.csv`, `data/health.csv`; new `data/tanks.csv` and
  `data/weigh_sessions.csv`; README.md; the inputs of `docs/audit/scenarios/` through
  `docs/audit/diagnostics/scenarios.build.py` (decision D16; `expected.json` files unchanged).
- **Dependencies:** none to write; it lands with P1-03 (meta fields), P1-07 (tanks) and P1-10 (weigh sessions) so CI
  stays green.
- **Effort:** M.
- **Acceptance criteria (headline):** the committed data gives the 10 rows of [section 3.1](#31-phase-1-acceptance-bar)
  and no data issue; no 'done' row has last_done < next_due <= as_of; the six unchanged files have the same SHA-256 as
  at the reviewed commit; CI's regenerate-and-compare step passes, including the new files. Full list:
  [06 section 12, P1-05](06-phase1-spec.md#p1-05).

#### P1-06: Loading, errors, three states and section isolation

- **Findings:** [LOAD-01](02-findings.md#load-01) (high, owns the missing-file part of WAT-02, BUD-03 and UI-07), [LOAD-02](02-findings.md#load-02) (high).
- **Rules:** [RULE-WF-01](03-research-and-data.md#rule-wf-01) (A), [RULE-WF-06](03-research-and-data.md#rule-wf-06) (A),
  [RULE-WF-07](03-research-and-data.md#rule-wf-07) (A), [RULE-WF-09](03-research-and-data.md#rule-wf-09) (B).
- **Problem and evidence:** with health.csv answering 404 the page shows "Health filter 'Nothing in health needs
  attention.'" and with budget.csv missing "'Spend vs budget: −NaN% (\$NaN of \$NaN, season to date)'" (LOAD-01); while
  loading "'ready=false ... loadingText=false'", and one failed file gives an uncaught error, "empty as-of line, every
  section count 0" (LOAD-02).
- **Proposed behaviour:** a new `load.js` that never throws and reports each file as loaded, missing, failed, empty or
  unreadable. The redesign's loading message ("Loading today's report…") stays on screen while files load
  ([06 section 6.1](06-phase1-spec.md#61-page-sequence)). A banner naming each failed file ("health.csv
  could not be loaded (404)"). Each area, tank, group, task and category is **OK**, **needs attention** or **CAN'T TELL**;
  an area whose file is missing or empty is CAN'T TELL with a reason and a first step, never "Nothing ... needs
  attention". CAN'T TELL has its own marker shape plus the words "Can't tell" (extending RULE-WF-01). Data issues are
  listed in a "Data checks" panel under the exception table. Each section draws inside its own error boundary, so one
  failure never blanks the others. New controls keep 24 x 24 px targets and a visible focus ring. The redesigned page
  already shows a loading message, a "Try again" button after a failed load and a guard around each section, but one
  failed file still stops the whole report ([08 section 3.2](08-redesign-coverage.md#32-partly-addressed)); Phase 1
  keeps the button and the guards and replaces the whole-report failure with the per-file banner and per-area states.
- **Files and data:** new `load.js`; `app.js`; `index.html`; `exceptions.js` (row model).
- **Dependencies:** P1-02 (issue model).
- **Effort:** M.
- **Acceptance criteria (headline):** health.csv 404 shows text matching `/health\.csv/` and `/could not load|missing/i`
  and the Health chip's count badge reads "can't tell", never "0"; header-only water.csv names water.csv and the tile
  never reads "0 of 0"; budget.csv 404 or header-only puts no 'NaN' on the page; with water.csv 404 the Health row
  "Overdue by 15 days (due 2026-09-15)" still draws; a 3-second delay shows `/loading/i` at 1 second; aborting
  budget.csv gives a banner and zero page errors. Full list: [06 section 12, P1-06](06-phase1-spec.md#p1-06).

#### P1-07: Water rules

- **Findings:** [WAT-01](02-findings.md#wat-01) (high), [WAT-02](02-findings.md#wat-02) (high), [WAT-03](02-findings.md#wat-03) (medium), [WAT-04](02-findings.md#wat-04) (medium), [WAT-07](02-findings.md#wat-07) (low), [WAT-08](02-findings.md#wat-08) (low).
- **Rules:** [RULE-WAT-01](03-research-and-data.md#rule-wat-01) (C), [RULE-WAT-02](03-research-and-data.md#rule-wat-02) (C),
  [RULE-WAT-03](03-research-and-data.md#rule-wat-03) (D), [RULE-WAT-04](03-research-and-data.md#rule-wat-04) (C).
- **Problem and evidence:** a fault code hides a critical tank ("W-10: 'level="ERR" drop24h=NaN; (no water alerts)'")
  and a -999 reading invents a leak ("'Dropped 1079 points in 24 hours, now -999%'") (WAT-01); an empty water file
  gives "'WATER TANKS OK / 0 of 0 / 0 need a look'" (WAT-02); after a gap "'Dropped 36 points in 24 hours, now 54%'"
  compares with a 3-day-old reading (WAT-03); a moved trough raises "'Dropped 35 points in 24 hours, now 55%'"
  (WAT-04); the result depends on line order (WAT-07); "'drop24h=29.999999999999993; (no water alerts)'" (WAT-08).
- **Proposed behaviour:** the tank list comes from `tanks.csv`, so a tank with no readings is CAN'T TELL ("No readings
  in this export"), never missing. A level must be a finite number from 0 to 100 ('11.8%' is accepted); anything else is
  a data issue, and when the newest reading is not a level the tank is CAN'T TELL with its last good level and time.
  Readings are grouped by tank and the tank's pasture from `tanks.csv`; readings from another pasture are reported and
  left out. Silence is measured from the as-of time. The 24-hour drop is the largest fall inside [last - 24 h, last],
  rounded to 0.1 point before it is compared with 30, with the real span stated (decision D5); when the window holds
  only the last reading and the level is fine, the tank is CAN'T TELL (warning) "Not enough recent history to judge the
  24-hour change", never a 0-point change. Two different readings at one time use the lower value and are reported. Rows say "Heifers there as of 2026-09-30", never "here now".
- **Files and data:** `exceptions.js` (water); `data/tanks.csv` (P1-05).
- **Dependencies:** P1-02, P1-03, P1-04, P1-05, P1-06.
- **Effort:** M.
- **Acceptance criteria (headline):** 'T1 ... 80' then 'T1 ... ERR' gives exactly one serious T1 row containing 'ERR'
  and '80%'; T2's newest row set to ERR still gives a T2 row naming "last good level 14.8%"; -999 and 140 give no
  'Dropped' row; with every T6 row removed the tile reads "5 of 8" and "3 need a look" and T6 says "No readings";
  on inline T1 rows with `tanks.csv` listing T1 only (06 section 11.2), W-01 gives no Water row for T1, W-02 gives one
  critical row with '45 points' and '18 hours', and W-03 reports 40 points (the maximum drawdown); W-11 with T9 listed
  in P3 gives no Water row for T9 and a pasture-mismatch data issue;
  80.1 to 50.1 gives "Dropped 30 points"; both orders of 78 and 20 give "now 20%" plus a data issue; scenario 04's T1
  (no reading between 2026-09-27T18:00 and 2026-09-30T18:00) gives a CAN'T TELL row and no "Dropped"; the committed data
  gives exactly 3 Water rows and T4 at 46 points. Full list: [06 section 12, P1-07](06-phase1-spec.md#p1-07).

#### P1-08: Grazing rules

- **Findings:** [GRZ-01](02-findings.md#grz-01) (medium), [GRZ-02](02-findings.md#grz-02) (medium), [GRZ-03](02-findings.md#grz-03) (medium).
- **Rules:** [RULE-GRZ-01](03-research-and-data.md#rule-grz-01) (C), [RULE-GRZ-02](03-research-and-data.md#rule-grz-02) (D).
- **Problem and evidence:** a planned out_date hides the overstay ("G-05: '(no rows)'") and "the alert's advice to
  'record a new move date' has nowhere to go but the column that silences it" (GRZ-01); two open moves give "'Day 36 of
  a 21-day plan (15 days over)'" for a pasture the group has left (GRZ-02); 'TBD' or '21 days' in a cell silently
  removes the grazing alert or blanks the chart ("'bars with a numeric x: 0 of 23'") (GRZ-03).
- **Proposed behaviour:** the current stay is the latest one with in_date on or before the as-of date and out_date
  blank or after it. An optional `planned_out_date` column (decision D11) holds a new move date without closing the
  stay, and the serious action names it. When a group has two open stays, the latest is judged and the extra one is a
  data issue (decision D8). Bad dates or plans are data issues naming the group, pasture and value; the group's
  grazing is CAN'T TELL when its current stay cannot be judged. A group with no current stay is not judged in Phase 1
  and gets only an information note, a known exception to the three-state rule until GRZ-07's group status (P2-08) can
  tell a shipped group from a missing record ([06 section 5.3](06-phase1-spec.md#53-grazing)). On the due day the
  warning reads "Move planned for today". The chart uses the same predicate and ends every stay bar at or before the
  as-of date; as on the redesigned page, its axis runs on to the latest planned move of a current stay, with the days
  left shaded ([06 section 5.3](06-phase1-spec.md#53-grazing)).
- **Files and data:** `exceptions.js` (grazing); `app.js` (rotation chart); optional `moves.csv` column.
- **Dependencies:** P1-02, P1-03, P1-04, P1-06.
- **Effort:** M.
- **Acceptance criteria (headline):** the Sand Hills row given out_date 2026-10-03 still gives one serious "Yearlings
  in Sand Hills ... (3 days over)"; Sand Hills closed 2026-10-02 plus a future stay in P2 keeps that row and the T2
  subject exactly "Tank T2 (Windmill)"; G-03 gives one Yearlings row with "(3 days over)", a data issue naming South
  Divide and Sand Hills, and no "15 days over"; G-04 gives 10 rows; the six bad-cell cases in GRZ-03's test give a data
  issue or the correct row, never ' -day plan' or a fraction. Full list: [06 section 12, P1-08](06-phase1-spec.md#p1-08).

#### P1-09: Gain from a consistent pair of weigh sessions

- **Findings:** [GAIN-01](02-findings.md#gain-01) (high), [GAIN-02](02-findings.md#gain-02) (high), [GAIN-03](02-findings.md#gain-03) (medium), [GAIN-06](02-findings.md#gain-06) (medium), [GAIN-12](02-findings.md#gain-12) (low).
- **Rules:** [RULE-GAIN-01](03-research-and-data.md#rule-gain-01) (C), [RULE-GAIN-02](03-research-and-data.md#rule-gain-02) (C),
  [RULE-GAIN-07](03-research-and-data.md#rule-gain-07) (C), [RULE-WF-19](03-research-and-data.md#rule-wf-19) (B).
- **Problem and evidence:** one animal with a single weigh-in "threw TypeError ... (reading 'date')" and the page shows
  no alerts at all (GAIN-01); a same-day re-weigh gives "'serious | Heifers | -Infinity lbs/day since 2026-09-15 vs 1.0
  target'" or hangs the page (GAIN-02); a short re-weigh turns the heifer problem into "'Heifers adg=0.8686'" (GAIN-03);
  tag 101 in two groups gives "'adg=-Infinity'" (GAIN-06); exactly 80% of target is serious or not "depending on row
  order" (GAIN-12).
- **Proposed behaviour:** a weigh session is a date on which at least half the group crossed the scale (demo setting,
  D). Group gain uses the latest session on or before the as-of date and the latest earlier session at least 21
  days before it (decision D6), pooled over animals weighed at both: total pounds gained divided by total animal-days.
  The period is named from the two session dates. Animals are keyed by group and tag. Animals weighed only at the
  latest session are "not yet re-weighed" (a note in the gain section and in the data checks); animals missing from the latest session get their own CAN'T TELL row; a
  same-day duplicate is a data issue and never divides by zero. Individual flags need at least 42 days between the
  sessions and are skipped when the whole group is already serious (RULE-WF-19). Comparisons are made on values rounded
  to 3 decimals so row order never changes the result.
- **Files and data:** `exceptions.js` (gain); `app.js` (gain chart reads the same results).
- **Dependencies:** P1-02, P1-03, P1-04, P1-06.
- **Effort:** M.
- **Acceptance criteria (headline):** the committed data plus Y151 weighed only on Sep 15 gives 10 rows, Yearlings
  1.94246 (16608 / 8550) and Y151 listed as not yet re-weighed; H001 weighed twice on Sep 15 gives finite gains, Heifers
  serious starting '0.44' and a data issue naming H001 2026-09-15; GN-07 keeps Heifers at 0.436 and reports the Sep 16
  re-weigh; GN-11b gives a row naming Y027 that says the animals missed the Sep 15 weigh-in; tag 101 in two groups gives
  0.5263 and 1.9298 or a data issue; 456 lbs over 285 animal-days gives no row in either order and 455 lbs gives a
  serious row. Full list: [06 section 12, P1-09](06-phase1-spec.md#p1-09).

#### P1-10: Gain plausibility, target, coverage, age and weigh-basis checks

- **Findings:** [GAIN-04](02-findings.md#gain-04) (medium), [GAIN-05](02-findings.md#gain-05) (medium), [GAIN-07](02-findings.md#gain-07) (medium), [GAIN-08](02-findings.md#gain-08) (medium).
- **Rules:** [RULE-GAIN-06](03-research-and-data.md#rule-gain-06) (C), [RULE-GAIN-10](03-research-and-data.md#rule-gain-10) (C).
- **Problem and evidence:** a keying slip of 11690 lbs gives "'Heifers adg=4.538'" and "'gridlines=372'" on the chart
  (GAIN-04); a target typed '2.O' gives "'gain.target.toFixed is not a function'" and no exception rows (GAIN-05); a
  verdict rests on "'Yearlings head=3 (groups.csv head=150)'" (GAIN-07); a skipped weigh-in leaves a 72-day-old all-clear
  (GAIN-08).
- **Proposed behaviour:** weights outside 200-2,500 lbs and per-animal gains outside -3 to +5 lbs/day are data issues
  and left out (demo settings, D). A target that is not a number is a data issue and the group's gain is CAN'T TELL. The
  group verdict is withheld (CAN'T TELL) below 80% coverage of matched animals or when the latest session is more than
  45 days before the as-of date (demo settings, D); the gain section shows "45 of 45 weighed" style coverage lines.
  Each weigh session records a `weight_basis` in `weigh_sessions.csv`; a pair with different or unknown bases is CAN'T
  TELL for the serious and individual flags (RULE-GAIN-06; decision D9). A head of 0 in groups.csv means the group has
  no animals now. With no weigh-in in the 45 days before the as-of date, the group is not judged on gain: a note and a
  gain-section line, no row, and its weigh-ins stay in the file as history. With a weigh-in inside those 45 days the
  record is inconsistent (animals were weighed recently, but the file says none are left): a gain CAN'T TELL row and a
  warning naming the head and the weigh-in, so a mistyped 0 cannot hide a problem. Coverage is computed only when head
  is 1 or more, so nothing divides by 0, and no matched animal at all is always CAN'T TELL. When more animals were
  weighed at both sessions than the head count, the group is still judged and a warning names both numbers. A blank or
  unreadable head is CAN'T TELL. These choices and their trade-offs are recorded in
  [06 section 15](06-phase1-spec.md#15-open-decisions-and-assumptions).
- **Files and data:** `exceptions.js` (gain); `app.js`; `data/weigh_sessions.csv` (P1-05).
- **Dependencies:** P1-09, P1-05.
- **Effort:** M.
- **Acceptance criteria (headline):** H001 at 11690 gives a data issue naming H001, Heifers serious at 0.43 (1088 /
  2508) and 7 gain gridlines; target '2.O' gives a data issue naming the Yearlings target and the exception table still
  draws; GN-13 gives a "too few weighed (3 of 150)" CAN'T TELL row; GN-18 with the 45-day limit gives CAN'T TELL naming
  2026-07-20 and 72 days, and no 'warning | 4 heifers'; the committed data shows "45 of 45" and "150 of 150" and still
  gives 10 rows; sessions with bases 'full' and 'overnight_shrunk' give CAN'T TELL; the Yearlings head set to 0 with
  their 2026-09-15 weigh-ins kept gives a Yearlings gain CAN'T TELL row and a `GROUP_HEAD_ZERO_RECENT_WEIGHINS` warning
  in place of the "6 yearlings" row (10 rows); the same with their 2026-09-15 weigh-ins removed (the last one left is
  72 days old) gives no Yearlings gain row and a `GROUP_HEAD_ZERO` note (9 rows); the Heifers head set to 0 gives a
  Heifers gain CAN'T TELL row in place of the serious row, so the planted problem is not hidden behind a note; the
  Yearlings head at 100 gives a `GAIN_MORE_THAN_HEAD` warning and the same 10 rows; no row, issue or tile text matches
  `/\d of 0\b|NaN|Infinity/`. Full list: [06 section 12, P1-10](06-phase1-spec.md#p1-10).

#### P1-11: Health rules

- **Findings:** [HLTH-01](02-findings.md#hlth-01) (high), [HLTH-02](02-findings.md#hlth-02) (low).
- **Rules:** [RULE-HLTH-01](03-research-and-data.md#rule-hlth-01) (D), [RULE-HLTH-02](03-research-and-data.md#rule-hlth-02) (D),
  [RULE-HLTH-03](03-research-and-data.md#rule-hlth-03) (C).
- **Problem and evidence:** "H-01a 'Open': '(no alerts)'. H-01b 'OPEN': '(no alerts)'" and "'in progress' ... '(no
  alerts)'" (HLTH-01); an open task with a blank due date is "never shown anywhere" (HLTH-02).
- **Proposed behaviour:** status is trimmed and lower-cased; open, done and cancelled are accepted, and any other value
  is treated as open and reported (decision D10). Overdue stays serious; due today reads "Due today (2026-09-30)" with
  "Do it today or set a new date"; due in 1-7 days stays a warning. An open task with a blank or unreadable due date is
  a CAN'T TELL row "Open, with no due date recorded" with "Set a due date". The overdue first step becomes "Schedule
  it, and check the label or your veterinarian's plan for the allowed window" (RULE-HLTH-01 phase note). Severity and
  the 7 days are labelled demo settings. Nothing names a drug, dose or diagnosis.
- **Files and data:** `exceptions.js` (health).
- **Dependencies:** P1-01 (trimming), P1-02, P1-03, P1-06.
- **Effort:** S.
- **Acceptance criteria (headline):** for 'Open', 'OPEN', 'open ' and ' open' the two-row fixture gives exactly
  [['serious', 'Overdue by 15 days (due 2026-09-15)']]; 'in progress' and 'scheduled' give the booster row plus a data
  issue; 'done' and 'cancelled' give no row; 'Heifers,Pregnancy check,2026-09-20,,open' gives one row matching `/no due
  date/i`; 'TBD' gives one row matching `/TBD|can't be read/i`. Full list: [06 section 12, P1-11](06-phase1-spec.md#p1-11).

#### P1-12: Budget rules

- **Findings:** [BUD-01](02-findings.md#bud-01) (high), [BUD-02](02-findings.md#bud-02) (high), [BUD-03](02-findings.md#bud-03) (medium), [BUD-04](02-findings.md#bud-04) (medium), [BUD-05](02-findings.md#bud-05) (low).
- **Rules:** [RULE-BUD-01](03-research-and-data.md#rule-bud-01) (D), [RULE-BUD-02](03-research-and-data.md#rule-bud-02) (D),
  [RULE-BUD-03](03-research-and-data.md#rule-bud-03) (C), [RULE-BUD-04](03-research-and-data.md#rule-bud-04) (A),
  [RULE-BUD-05](03-research-and-data.md#rule-bud-05) (C), [RULE-BUD-06](03-research-and-data.md#rule-bud-06) (C).
- **Problem and evidence:** plan rows for future months hide both overspends ("'Fuel 11640/14400 = -19.2%; Repairs
  9000/10800 = -16.7%; (no alerts)'") (BUD-01); "'(300)'" or "'\$3000'" cells give "'+2.715256118778953e+22%'" on the
  tile (BUD-02); a zero budget gives "'serious | Hay | Infinity% over season to date (\$500)'" (BUD-03); "\$30 over on
  \$200 is serious, \$9,500 over on \$100,000 is a warning, and \$4,000 over is ignored" (BUD-04); "exactly 5.0% gets no
  row" and "9.6% and 10.4% both print '10% over'" (BUD-05).
- **Proposed behaviour:** months are YYYY-MM; only closed months from `season_start` through `books_closed_through`
  count (decision D1). Amounts are read by a strict money parser (decision D3) and summed in whole cents. A closed
  month with no row or a blank actual makes that category CAN'T TELL. A zero budget with spending is judged in dollars
  only ("\$500 spent with no budget, season to date through 2026-09", the wording of
  [06 section 5.6](06-phase1-spec.md#56-budget)). Severity uses percent and dollars together (decision D2), with stated
  boundaries: serious when more than 10.0% over and at least \$1,000 over; warning when at least 5.0% over and at least
  \$500 over (this includes more than 10.0% over with less than \$1,000, as scenario 09's "Vet and health" 10.5% and
  \$630 shows), or at least \$2,500 over at any percent; \$250 for unbudgeted spending. Every value is a demo setting (D)
  and labelled so. Percent is shown to one decimal.
- **Files and data:** `exceptions.js` (budget); `app.js` (tile and budget table; the redesign has no budget chart);
  `meta.csv` fields (P1-05).
- **Dependencies:** P1-02, P1-03, P1-05, P1-06.
- **Effort:** M.
- **Acceptance criteria (headline):** committed budget plus Oct and Nov plan rows still gives exactly the Fuel and
  Repairs serious rows with \$2,040 and \$1,800, and the tile "+1.0%" "\$89,303 of \$88,400"; a blank actual leaves
  that month's budget out of the tile, so scenario folder 03 reads "+1.0%" "\$87,783 of \$86,900", never under budget; 'Repairs,0,(300)' in
  2026-09 gives Repairs serious 20.8% (\$1,500) and a warning that two rows were added together; Hay 0 / 500 gives one row with '\$500' and no 'Infinity' or 'NaN', and
  0 / 0 gives no row; Ear tags 230 / 200 gives no row, Feed 109,500 / 100,000 gives a warning, Hay 104,000 / 100,000 a
  warning; on a 10,000 base, 10,500 is a warning "5.0%", 11,000 a warning "10.0%", 11,040 serious "10.4%"; budget
  7,419 and actual 8,160.90 is a warning. Full list: [06 section 12, P1-12](06-phase1-spec.md#p1-12).

#### P1-13: Safe rendering

- **Findings:** [SEC-01](02-findings.md#sec-01) (medium).
- **Problem and evidence:** "CSV text is written into the page with innerHTML at 9 places"; a test file set "'injected
  elements: {"img in #exceptions":4, ... "script in #budgetTable":1,"total":8}'", and a plain '<' in a pasture name
  "silently deletes alert context".
- **Proposed behaviour:** every value that comes from a CSV file is set as text (`textContent` or DOM nodes), or passed
  through one tested `esc()` function before any `innerHTML`. The same applies to the chart readings in `#tip`. The
  redesigned page already passes its values through an `esc()` function, chart readings included
  ([08 section 3.1](08-redesign-coverage.md#31-addressed-on-the-page)); P1-13 moves it into `format.js`, tests it, and
  uses it on every path Phase 1 adds.
- **Files and data:** `app.js`; new `format.js` (`esc`).
- **Dependencies:** none; it can land first.
- **Effort:** S.
- **Acceptance criteria (headline):** a pasture named '<b>x</b>' appears as '&lt;b&gt;x&lt;/b&gt;' in #exceptions and
  as text on T2's tank card and in its chart reading; a tag '<i>t</i>' appears escaped in the gain reading (`#tip`)
  when it is opened by mouse, by keyboard and by tap; markup in a tank, pasture or group name shows as text in the
  water, grazing and gain readings, each opened by mouse, by keyboard and by tap, and markup in a budget category shows
  as text in its budget table row (the page has no budget chart); 'Lone Tree <A' gives the T4 subject in full at
  1280 x 900 and at 390 x 844; the audit's render.repro.mjs cases R01-R04, with their selectors mapped to the
  redesigned page ([08 section 5](08-redesign-coverage.md#5-audit-scripts-on-the-redesigned-page)) and R04's budget
  tooltip replaced by the budget table row, show the text escaped. Full list:
  [06 section 12, P1-13](06-phase1-spec.md#p1-13).

#### P1-14: Tiles and charts built from structured results

- **Findings:** [LOAD-03](02-findings.md#load-03) (high), [LOAD-04](02-findings.md#load-04) (medium), [UI-04](02-findings.md#ui-04) (low), [UI-05](02-findings.md#ui-05) (low).
- **Problem and evidence:** a renamed or shipped Yearlings group gives "page errors ["Cannot read properties of
  undefined (reading 'adg')"]; tiles []; ... 0 exception rows" (LOAD-03); a tank with no reading in 7 days gives "water
  charts=0; grazing svg=false; gain svg=false; budget svg=false" (LOAD-04); the tank tile re-reads IDs from alert text
  and shows "'6 of 8 2 need a look'" when names share a first word (UI-04); month ticks are fixed to June-September 2026
  (UI-05).
- **Proposed behaviour:** the exception table draws first. Tiles read the structured results (per-tank, per-group,
  per-category states), not alert text and not a fixed group name; the gain tile falls back to "No weigh-ins yet" (under "Can't tell" when weights.csv has no rows), and
  a group with head 0 never supplies its figure ([06 section 5.4](06-phase1-spec.md#54-gain)). A tank with no recent
  readings keeps its tank card and draws an empty chart marked "no readings in the last 7 days" (or the shorter text the
  redesign draws on a narrow card). Month ticks come from the loaded season, on a chart still drawn at its card's width.
- **Files and data:** `app.js`; new pure `tileSummary()` in `exceptions.js` or `format.js`.
- **Dependencies:** P1-06, P1-07, P1-09.
- **Effort:** M.
- **Acceptance criteria (headline):** Yearlings renamed Steers gives 10 data rows and no page error; Yearlings shipped
  (removed from every file) gives 7 rows; T6 filtered to readings on or before 2026-09-22T12:00 gives no page error, 8
  tank cards (`#tanks .tank`), the grazing and gain charts, the budget table with its 6 category rows and its
  season-total row, and "No reading for 198 hours"; the water.repro:B-03 data (T2 and T4 renamed "Well 2" and "Well 4"
  in water.csv and tanks.csv) gives a water tile, found by its label, reading "Sensors normal", "5 of 8" and "3 need a
  look"; month labels for grazing.repro:GB-09 to GB-12 and time.browser:TB-04 equal the hand-worked sets and lie inside
  the chart's plot area as measured on the page at 1280 x 900 and at 390 x 844 (the chart is drawn at its card's width,
  so the bounds are read from the chart, not fixed); with a header-only weights.csv the gain tile reads "Can't tell"
  with "No weigh-ins yet"; with
  every group that has a gain target at head 0 it reads "Not judged" or "Can't tell", never "No weigh-ins yet" or a
  figure. Full list: [06 section 12, P1-14](06-phase1-spec.md#p1-14).

#### P1-15: Wording and number formatting

- **Findings:** [UI-06](02-findings.md#ui-06) (low), [UI-07](02-findings.md#ui-07) (low), [UI-08](02-findings.md#ui-08) (low), [BUD-06](02-findings.md#bud-06) (low), [GAIN-11](02-findings.md#gain-11) (low).
- **Problem and evidence:** "'Due in 0 days (2026-09-30)'" (UI-06); "'Nothing in all needs attention.'" and "'−0.0%'"
  (UI-07); "'7.000000000000001-10% over budget'" (UI-08); "'(\$104.5)'" and, in a de-DE browser, "'\$89.303 of
  \$88.400'" (BUD-06); "'1 yearlings'" and "'Under 0.6 lbs/day: A' with A at 0.61" (GAIN-11).
- **Proposed behaviour:** one `format.js` used everywhere: fixed en-US numbers and whole-dollar money for every viewer;
  one-decimal percentages with no negative zero; thresholds printed as applied (up to 3 decimals, trailing zeros
  removed); singular and plural; "today" wording on the due day; "Nothing needs attention." on the All filter; gain
  periods named by both weigh-in dates. Dates in row text stay YYYY-MM-DD in Phase 1 (decision D14).
- **Files and data:** new `format.js`; `exceptions.js`; `app.js`.
- **Dependencies:** P1-06.
- **Effort:** S.
- **Acceptance criteria (headline):** the TIME-18 fixture gives "Move planned for today" and "Due today (2026-09-30)";
  all-clear data gives "Nothing needs attention."; budgetWarnPct 0.07 gives "7-10%" in the rules table; \$104.50 prints
  as "\$105"; under LANG=de_DE.UTF-8 and a de-DE browser, Fuel shows "(\$2,040)", the tile "\$89,303 of \$88,400" and
  the as-of facts (`#asof`) "4,300 acres"; one slow animal gives "1 yearling"; targets 1.25 and 2.25 give "Under
  0.625" and "Under 1.125". Full list: [06 section 12, P1-15](06-phase1-spec.md#p1-15).

#### P1-16: Honest rule copy and labels

- **Findings:** [GRZ-06](02-findings.md#grz-06) (low), [GAIN-13](02-findings.md#gain-13) (low).
- **Rules:** [RULE-WAT-15](03-research-and-data.md#rule-wat-15) (C), [RULE-GAIN-03](03-research-and-data.md#rule-gain-03) (D),
  [RULE-GAIN-04](03-research-and-data.md#rule-gain-04) (D), [RULE-GAIN-05](03-research-and-data.md#rule-gain-05) (D),
  [RULE-HLTH-11](03-research-and-data.md#rule-hlth-11) (C), [RULE-WF-20](03-research-and-data.md#rule-wf-20) (B),
  [RULE-WF-21](03-research-and-data.md#rule-wf-21) (D).
- **Problem and evidence:** the grazing card says days past the planned move are marked, but past overstays are not
  (GRZ-06: "'overrun labels=[{"s":"+3d",...}]'"); groups with a 0.0 target are skipped silently (GAIN-13); the rules
  table shows thresholds with no basis, the tile says "Water tanks OK", and row text says "here now".
- **Proposed behaviour:** the rules table gains a Basis column: "Demo setting (D)" or "Ranch choice (C)" for every
  threshold, with the class from [06 section 9](06-phase1-spec.md#9-configuration). It states that groups without a gain
  target are not judged on gain, that water severity uses level percent only (a [WAT-06](02-findings.md#wat-06) Phase 1
  note), and that the 10 planted problems show the rules find what was planted, not that the thresholds are right. The
  tile becomes "Sensors normal". The grazing note says only the current stay's days past plan are marked. Gain and
  health first steps follow RULE-HLTH-11 ("Look at these animals at the next gather and record what you see"; "watch
  the group for illness or lameness and call your veterinarian if you see any"). "here now" becomes "there as of
  <date>", and the grazing chart reading's "to now" (`app.js:398` on main; line 143 at `cfd77e5`) becomes "to <as-of
  date> (as of)". README's rules table and claims ("To use real data, replace the CSVs", "the group grazing that
  pasture right now") are updated to match; its chart paragraph ("Every chart can be read with a mouse, a tap or the
  keyboard ...") stays, because the page already does this.
- **Files and data:** `app.js` (rules table, notes); `index.html` (notes); `exceptions.js` (`RULE_INFO`, wording);
  README.md.
- **Dependencies:** P1-06 to P1-12 (final wording).
- **Effort:** S.
- **Acceptance criteria (headline):** the grazing note matches `/current stay/i`; the rules table has a line matching
  `/no gain target.*not judged/i`; every `RULES` key appears in the rules table with a Basis of "Demo setting (D)" or
  "Ranch choice (C)"; no page text contains "here now" or "Water tanks OK"; no Health or Gain row names a drug, dose or
  diagnosis. Full list: [06 section 12, P1-16](06-phase1-spec.md#p1-16).

#### P1-17: Tests and CI

- **Findings:** [TEST-01](02-findings.md#test-01) (low), [TEST-02](02-findings.md#test-02) (low).
- **Problem and evidence:** "'SURVIVES silent tank also judged (continue removed) (pass 8, fail 0)'" and the same for
  every water boundary (TEST-01); "'SURVIVES grace boundary >= -> > (pass 8, fail 0)'" (TEST-02). The repository has 8
  unit tests and no browser test.
- **Proposed behaviour:** (a) before any refactor, boundary tests for the water and grazing rules exactly as the two
  findings specify; (b) unit tests for every module and each Phase 1 item's acceptance cases; scenario tests that run
  the 10 folders of `docs/audit/scenarios/` through the new pipeline and compare with each `expected.json` under its own
  matching rule, plus single-change fixtures for the audit's test cases (W-02, GN-07 ...) under `tests/fixtures/`; the
  suite run under TZ=UTC, America/Chicago and Pacific/Auckland; a Playwright Chromium smoke test pinned as a
  development-only dependency; CI checks that regenerated data has no diff and no untracked file.
- **Files and data:** `tests/`; `.github/workflows/test.yml`; new `package.json` (dev dependency only, no build step);
  reads `docs/audit/scenarios/` (inputs updated by P1-05, decision D16).
- **Dependencies:** part (a) none; part (b) the items it tests.
- **Effort:** M.
- **Acceptance criteria (headline):** each of the 6 water cases and 5 grazing cases in the two findings passes; re-running
  the audit's mutation checks (`water.verify.mjs` Part B for water, `registry.extra.mjs` Part 2 for grazing), no mutant
  survives (run unchanged after part (a); re-expressed against the new modules after the refactor, since the scripts
  patch today's source text); all 10 scenario folders pass under their
  `expected.json` matching rule in all three time zones (`run-results.json` records today's code as MATCH for 01 and 02
  and MISMATCH for 03 to 10); CI runs the unit and scenario tests under
  three time zones and the browser smoke test, and fails on a stray file in `data/`. Full list: [06 section 12, P1-17](06-phase1-spec.md#p1-17).

### 3.3 Phase 1 effort at a glance

| Item | Title | Findings | Effort |
|---|---|---|---|
| P1-01 | CSV reader and file decoding | 4 | M |
| P1-02 | Data contract: columns, types, blanks and IDs | 3 | M |
| P1-03 | Dates, times, ranch time zone, one as-of policy | 4 | L |
| P1-04 | References and duplicates | 2 | M |
| P1-05 | Generator and example data | 1 | M |
| P1-06 | Loading, errors, three states, section isolation | 2 | M |
| P1-07 | Water rules | 6 | M |
| P1-08 | Grazing rules | 3 | M |
| P1-09 | Gain from a consistent pair of weigh sessions | 5 | M |
| P1-10 | Gain plausibility, target, coverage, age, weigh basis | 4 | M |
| P1-11 | Health rules | 2 | S |
| P1-12 | Budget rules | 5 | M |
| P1-13 | Safe rendering | 1 | S |
| P1-14 | Tiles and charts from structured results | 4 | M |
| P1-15 | Wording and number formatting | 5 | S |
| P1-16 | Honest rule copy and labels | 2 | S |
| P1-17 | Tests and CI | 2 | M |
| | **Total** | **55** | 1 L, 12 M, 4 S |

### 3.4 Coverage: every Phase 1 finding to exactly one item

All 55 findings that `findings.json` places in Phase 1, in the order of [02-findings.md section 1.1](02-findings.md#11-all-findings).
Each appears once. Severity, status and effort are copied from `findings.json`.

| Finding | Severity | Status | Effort | Title | Item |
|---|---|---|---|---|---|
| [LOAD-01](02-findings.md#load-01) | high | confirmed | M | Missing, unreadable or empty data files read as 'nothing needs attention' for that area | P1-06 |
| [LOAD-02](02-findings.md#load-02) | high | confirmed | M | A failed or slow load leaves a blank page: no loading state, no error message, no isolation between sections | P1-06 |
| [LOAD-03](02-findings.md#load-03) | high | confirmed | S | The hard-coded 'Yearlings' tile throws before the exception table is drawn (group renamed or shipped, not yet weighed, or a bad target) | P1-14 |
| [LOAD-04](02-findings.md#load-04) | medium | confirmed | S | A tank with no reading in the last 7 days crashes the water charts and every section drawn after them | P1-14 |
| [CSV-01](02-findings.md#csv-01) | high | confirmed | M | The CSV reader is not RFC 4180: quoted commas shift columns, quotes stay in the text, and CR-only or doubled-CR line endings break whole files | P1-01 |
| [CSV-02](02-findings.md#csv-02) | high | confirmed | S | Blank, whitespace-only, ',,,' and repeated-header rows are read as records: false critical alerts or a blank page | P1-01 |
| [CSV-03](02-findings.md#csv-03) | high | confirmed | S | No column checks: a renamed, misspelled or space-padded header, or a vendor title line above the header, silently turns a rule off | P1-02 |
| [CSV-04](02-findings.md#csv-04) | high | confirmed | M | Blank cells are kept as '' instead of 'missing', so they act as 0 or join as text: a blank weight hides the heifer alert or flags a healthy animal, and blank head or acres cells give absurd headline numbers | P1-02 |
| [CSV-05](02-findings.md#csv-05) | high | confirmed | S | Cells and keys are not trimmed: a stray space in a pasture ID ('P3 ') blanks the page, 'T4, P4' drops which group drinks at the leaking tank, and 'open ' hides every health task | P1-01 |
| [CSV-06](02-findings.md#csv-06) | high | confirmed | S | Number-looking IDs, tags, group names and dates are turned into numbers: tags merge, pastures collide, and a digits-only group name blanks the page | P1-02 |
| [CSV-07](02-findings.md#csv-07) | low | confirmed | S | A CSV saved as Windows-1252 ('CSV (Comma delimited)') shows garbled names | P1-01 |
| [DATA-01](02-findings.md#data-01) | high | confirmed | M | Unknown pasture, tank or group references crash the page or silently drop data | P1-04 |
| [DATA-02](02-findings.md#data-02) | high | confirmed | M | Dates and times are never validated or parsed once: day-first, impossible, numeric, space-separated or M/D/YYYY values silently drop alerts, invent alerts or crash | P1-03 |
| [DATA-03](02-findings.md#data-03) | medium | confirmed | S | Duplicate and contradictory records are not detected: re-exported budget rows, a pasture listed twice, repeated health tasks or groups double or distort alerts | P1-04 |
| [TIME-01](02-findings.md#time-01) | medium | confirmed | M | Rows dated after as_of are used as current: a later reading hides a silent sensor, a back-dated report shows problems that had not happened yet, and later weigh-ins change the gain period | P1-03 |
| [TIME-02](02-findings.md#time-02) | medium | confirmed | M | No time-zone contract: a date-only as_of, UTC-stamped readings and daylight-saving days make silent hours, the 24-hour drop and the header depend on the viewer's zone | P1-03 |
| [TIME-03](02-findings.md#time-03) | medium | confirmed | S | A UTC-stamped as_of shifts every calendar-day count by one day for evening exports, the same way for every viewer | P1-03 |
| [WAT-01](02-findings.md#wat-01) | high | confirmed | M | Tank levels are never validated: a fault code ('ERR', 'NaN', '11.8%') hides a critical tank as fine, and a blank, -999 or 140 reading raises a false critical leak | P1-07 |
| [WAT-02](02-findings.md#wat-02) | high | design-limitation | M | There is no tanks master list: a tank with no readings in the export, or an empty water file, disappears and the page reports water as fine | P1-07 |
| [WAT-03](02-findings.md#wat-03) | medium | confirmed | S | The 24-hour drop is not a 24-hour window: after a reading gap a multi-day change is reported as 'in 24 hours', a new sensor's fast drop is missed, and a fall that refills before the last reading is not seen | P1-07 |
| [WAT-04](02-findings.md#wat-04) | medium | design-limitation | S | Readings are grouped by tank_id alone: two tanks sharing an ID in different pastures merge (a low tank is hidden), and a moved portable trough raises a false leak | P1-07 |
| [WAT-07](02-findings.md#wat-07) | low | confirmed | S | Two different readings at the same timestamp: the alert depends on which line comes last in the file | P1-07 |
| [WAT-08](02-findings.md#wat-08) | low | confirmed | S | An exact 30.0-point drop is missed because of floating-point subtraction | P1-07 |
| [GRZ-01](02-findings.md#grz-01) | medium | confirmed | M | The current grazing stay is chosen by a blank out_date, not by as_of: a planned or early-entered out_date hides an overstay, and the alert's advice to 'record a new move date' has nowhere to go but the column that silences it | P1-08 |
| [GRZ-02](02-findings.md#grz-02) | medium | confirmed | S | A group with two open moves gets a false '15 days over' alert and the timeline contradicts it; a duplicated row doubles the alert and garbles the T4 subject | P1-08 |
| [GRZ-03](02-findings.md#grz-03) | medium | confirmed | S | Text or blanks in move and plan cells ('-', 'TBD', '21 days', a blank in_date or plan) silently remove the grazing alert, strip 'here now' from the T4 leak, or blank the whole rotation chart | P1-08 |
| [GRZ-06](02-findings.md#grz-06) | low | design-limitation | S | Past overstays are never marked on the rotation chart although the card note says days past plan are marked | P1-16 |
| [GAIN-01](02-findings.md#gain-01) | high | confirmed | S | An animal with only one weigh-in crashes the rules and the page shows no alerts at all | P1-09 |
| [GAIN-02](02-findings.md#gain-02) | high | confirmed | S | A same-day duplicate weigh-in (scale re-check or EID double read) gives +-Infinity or NaN gain: the group alert is lost or garbled and the page can hang | P1-09 |
| [GAIN-03](02-findings.md#gain-03) | medium | confirmed | M | Group gain is not computed over one consistent pair of weigh-in sessions: a short re-weigh, animals that missed the last weigh-in, and the first animal's dates distort the verdict and the 'since' date | P1-09 |
| [GAIN-04](02-findings.md#gain-04) | medium | confirmed | S | No plausibility check on weights or daily gain: one keying slip masks the heifer alert and wrecks the gain chart's scale | P1-10 |
| [GAIN-05](02-findings.md#gain-05) | medium | confirmed | S | A non-numeric target ('2.O') silently turns off a group's gain alerts, and on the Yearlings row blanks the report | P1-10 |
| [GAIN-06](02-findings.md#gain-06) | medium | confirmed | M | Animals are keyed by tag alone, so the same tag number in two groups merges into one 'animal' | P1-09 |
| [GAIN-07](02-findings.md#gain-07) | medium | design-limitation | S | No coverage disclosure: a group verdict can rest on a handful of animals and the page does not say how many were weighed | P1-10 |
| [GAIN-08](02-findings.md#gain-08) | medium | design-limitation | S | Old weigh-ins are presented as current: no age check, so a skipped weigh-in gives an all-clear on 72-day-old data | P1-10 |
| [GAIN-11](02-findings.md#gain-11) | low | confirmed | S | Gain wording: 'since <date>' hides that the period ended at the last weigh-in, '1 yearlings', and toFixed(1) shows thresholds that differ from the ones applied | P1-15 |
| [GAIN-12](02-findings.md#gain-12) | low | confirmed | S | A group exactly at 80% of target is flagged serious or not depending on row order (floating-point mean) | P1-09 |
| [GAIN-13](02-findings.md#gain-13) | low | design-limitation | S | Groups with a 0.0 target (the cows) are skipped silently in the report and the chart | P1-16 |
| [HLTH-01](02-findings.md#hlth-01) | high | confirmed | S | A health task is shown only when its status is exactly 'open': 'Open', 'OPEN' or an unlisted status such as 'in progress' silently drops an overdue vaccination | P1-11 |
| [HLTH-02](02-findings.md#hlth-02) | low | design-limitation | S | An open health task with a blank or unreadable due date is never shown anywhere | P1-11 |
| [HLTH-03](02-findings.md#hlth-03) | low | design-limitation | S | The example 'Fly tag check' row (done, last done Jun 5, next due Sep 1) contradicts itself and the meaning of next_due on a done row is undefined | P1-05 |
| [BUD-01](02-findings.md#bud-01) | high | confirmed | M | Budget 'season to date' ignores the month column and as_of: future plan rows hide both real overspends, a blank or lagging month changes the total, and a mid-month as_of compares part of a month with a full month's budget | P1-12 |
| [BUD-02](02-findings.md#bud-02) | high | confirmed | M | Budget amounts are not read as money: a blank, '(300)' or '\$3000' cell turns totals into joined text, erases real overspend alerts and puts \$884,000, e+22% or NaN on the headline tile | P1-12 |
| [BUD-03](02-findings.md#bud-03) | medium | confirmed | M | A zero-budget category prints 'Infinity% over' and a 0/0 row gives NaN; either one blanks the budget chart | P1-12 |
| [BUD-04](02-findings.md#bud-04) | medium | design-limitation | S | Budget severity is percent only: \$30 over on \$200 is serious, \$9,500 over on \$100,000 is a warning, and \$4,000 over is ignored | P1-12 |
| [BUD-05](02-findings.md#bud-05) | low | confirmed | S | Budget boundaries are inconsistent: exactly 5.0% gets no row though the rules say '5-10%', 9.6% and 10.4% both print '10% over' at different severities, and summed cents can tip an exact 10.00% into serious | P1-12 |
| [BUD-06](02-findings.md#bud-06) | low | confirmed | S | Budget money formatting: raw toLocaleString gives '\$104.5', warning rows carry no dollars, and a non-US browser locale shows '\$2.040' and '\$89.303 of \$88.400' | P1-15 |
| [SEC-01](02-findings.md#sec-01) | medium | confirmed | S | CSV text is written into the page with innerHTML at 9 places: markup in a pasture, tag or group name runs script, can empty the alert table, and plain '<' text silently deletes alert context | P1-13 |
| [UI-04](02-findings.md#ui-04) | low | confirmed | S | The 'Water tanks OK' tile re-reads tank IDs from the alert text and undercounts when tank names share a first word ('Well 2', 'Well 4') | P1-14 |
| [UI-05](02-findings.md#ui-05) | low | confirmed | S | Grazing timeline month ticks are hard-coded to June-September 2026 | P1-14 |
| [UI-06](02-findings.md#ui-06) | low | confirmed | S | On the due day the text says 'Due in 0 days' and 'Planned move in 0 days' | P1-15 |
| [UI-07](02-findings.md#ui-07) | low | confirmed | S | Empty and zero wording: 'Nothing in all needs attention.', and '−0.0%', '−0%' and 'Under by \$0' when exactly on budget | P1-15 |
| [UI-08](02-findings.md#ui-08) | low | confirmed | S | The rules table prints floating-point noise when a threshold is changed (0.07 shows as '7.000000000000001-10%') | P1-15 |
| [TEST-01](02-findings.md#test-01) | low | confirmed | S | The water tests cannot catch a broken rule: removing the 'don't judge a silent tank' line and moving every threshold boundary still pass | P1-17 |
| [TEST-02](02-findings.md#test-02) | low | confirmed | S | No test covers the grazing rule boundaries: changing the over-plan or grace comparisons, or the plural wording, still passes the suite | P1-17 |

### 3.5 Phase 1 rules

The 33 rules that `rules.json` places in Phase 1, each assigned to the item that carries it. Class and the short rule text are
copied from `rules.json`; the full entries are in [03-research-and-data.md](03-research-and-data.md).

| Rule | Class | Current or proposed | Rule (short) | Item |
|---|---|---|---|---|
| [RULE-WAT-01](03-research-and-data.md#rule-wat-01) | C | current | critical when a tank's latest level_pct < 25 (RULES.waterCritical) | P1-07 |
| [RULE-WAT-02](03-research-and-data.md#rule-wat-02) | C | current | warning when the latest level_pct < 40 (RULES.waterLow) | P1-07 |
| [RULE-WAT-03](03-research-and-data.md#rule-wat-03) | D | current | critical when the level fell >= 30 points between the latest reading and the most recent reading at least 24 h earlier (RULES.waterDropPts) | P1-07 |
| [RULE-WAT-04](03-research-and-data.md#rule-wat-04) | C | current | serious when the last reading is >= 24 h before as_of (RULES.sensorSilentHours) | P1-07 |
| [RULE-WAT-15](03-research-and-data.md#rule-wat-15) | C | proposed | sensor readings supplement, and do not replace, eyes-on tank checks | P1-16 |
| [RULE-GRZ-01](03-research-and-data.md#rule-grz-01) | C | current | Serious when an open stay's days in pasture (as_of date minus in_date) is more than the pasture's planned_graze_days (exceptions.js, grazing block of ... | P1-08 |
| [RULE-GRZ-02](03-research-and-data.md#rule-grz-02) | D | current | Warning when a planned move is 2 days away or less (RULES.graceDays = 2; over >= -2). | P1-08 |
| [RULE-GAIN-01](03-research-and-data.md#rule-gain-01) | C | current | Group 'serious' when the mean of per-animal ADG since the last weigh-in is < 80% of the group's fixed target (exceptions.js: g.adg < g.target * R.adgS... | P1-09 |
| [RULE-GAIN-02](03-research-and-data.md#rule-gain-02) | C | current | Individual 'warning' when an animal's ADG between its last two weigh-ins is < 50% of the group target (RULES.animalShare 0.5) | P1-09 |
| [RULE-GAIN-03](03-research-and-data.md#rule-gain-03) | D | current | Yearling steer target ADG = 2.0 lb/d, applied to any interval (groups.csv). | P1-16 |
| [RULE-GAIN-04](03-research-and-data.md#rule-gain-04) | D | current | First-calf heifer target ADG = 1.0 lb/d over the summer (groups.csv Heifers, class 'first-calf heifers'), judged by the same 80%/50% rules. | P1-16 |
| [RULE-GAIN-05](03-research-and-data.md#rule-gain-05) | D | current | Cows (cow-calf pairs) target 0.0, so the gain rules skip them ('if (!g.target) continue') | P1-16 |
| [RULE-GAIN-06](03-research-and-data.md#rule-gain-06) | C | proposed | Weigh-condition consistency gate | P1-10 |
| [RULE-GAIN-07](03-research-and-data.md#rule-gain-07) | C | proposed | Minimum interval / number of weights before ADG is judged | P1-09 |
| [RULE-GAIN-10](03-research-and-data.md#rule-gain-10) | C | proposed | Coverage and matched-interval gate for group ADG | P1-10 |
| [RULE-HLTH-01](03-research-and-data.md#rule-hlth-01) | D | current | An open health task past its next_due date is 'serious', and the action reads 'Schedule it this week' (exceptions.js:140-144; app.js:211 rules row 'An... | P1-11 |
| [RULE-HLTH-02](03-research-and-data.md#rule-hlth-02) | D | current | An open health task due within RULES.dueSoonDays = 7 days is a 'warning', and the action reads 'Plan it with the next gather' (exceptions.js:13, 145-1... | P1-11 |
| [RULE-HLTH-03](03-research-and-data.md#rule-hlth-03) | C | current | An open task with a blank next_due is skipped silently (exceptions.js:141 'if (h.status !== "open" // !h.next_due) continue') | P1-11 |
| [RULE-HLTH-11](03-research-and-data.md#rule-hlth-11) | C | proposed | wording rule for every Health row and for gain follow-ups | P1-16 |
| [RULE-BUD-01](03-research-and-data.md#rule-bud-01) | D | current | Serious when a category is more than 10% over budget, season to date (exceptions.js RULES.budgetSerious = 0.10; budgetStatus sums every row in budget.... | P1-12 |
| [RULE-BUD-02](03-research-and-data.md#rule-bud-02) | D | current | Warning when a category is 5-10% over budget season to date (RULES.budgetWarn = 0.05; code tests pct > 0.05 and pct > 0.10 with strict inequalities; w... | P1-12 |
| [RULE-BUD-03](03-research-and-data.md#rule-bud-03) | C | proposed | Combined percent-and-dollar materiality per category over closed months (V = actual - plan to date; p = V / plan) | P1-12 |
| [RULE-BUD-04](03-research-and-data.md#rule-bud-04) | A | proposed | Compare season-to-date actual against a monthly phased plan through the same month (which months count as closed is set by RULE-BUD-05, class C), not ... | P1-12 |
| [RULE-BUD-05](03-research-and-data.md#rule-bud-05) | C | proposed | Count only closed months (on or before a books-closed-through month) and show a data-completeness row when a closed month has no actual for a category | P1-12 |
| [RULE-BUD-06](03-research-and-data.md#rule-bud-06) | C | proposed | Zero-budget or unbudgeted spending is judged in dollars only ('\$X spent with no budget'), with a configurable dollar trigger | P1-12 |
| [RULE-WF-01](03-research-and-data.md#rule-wf-01) | A | current | severity is shown by icon shape plus a text label, never by colour alone (badge() in app.js: octagon=Critical, triangle=Serious, circle=Warning, each ... | P1-06 |
| [RULE-WF-06](03-research-and-data.md#rule-wf-06) | A | current (passes) | pointer targets are at least 24x24 CSS px (2.5.8) | P1-06 |
| [RULE-WF-07](03-research-and-data.md#rule-wf-07) | A | current (passes in Chromium) | keyboard focus is visible (2.4.7) and never fully hidden by author content (2.4.11) | P1-06 |
| [RULE-WF-09](03-research-and-data.md#rule-wf-09) | B | current | every exception row carries a defined first response (the 'First step' column), and a condition with no response is not an exception. | P1-06 |
| [RULE-WF-14](03-research-and-data.md#rule-wf-14) | C | proposed | the page must state when the data is from (with a time zone) and how old it is, and flag stale data before the manager acts on it | P1-03 |
| [RULE-WF-19](03-research-and-data.md#rule-wf-19) | B | current | duplicate and stale rows are suppressed by design (a silent sensor is not also judged on its stale level; a group-wide gain problem is not repeated pe... | P1-09 |
| [RULE-WF-20](03-research-and-data.md#rule-wf-20) | B | proposed | the rules table shows each threshold's basis: 'Demo setting (D)' for every current value until it is sourced or set by the ranch, then 'Ranch choice, ... | P1-16 |
| [RULE-WF-21](03-research-and-data.md#rule-wf-21) | D | current | Demo settings used by the workflow (the as_of snapshot of 2026-09-30T18:00, 10 planted problems, the 3 severity levels and their mapping to areas) are... | P1-16 |

---

## 4. Phase 2: Build next

Phase 2 makes the morning review faster and easier to trust, on the Phase 1 foundation. It stays a static site: any
memory is per-device browser storage labelled "this device only", and nothing shared is stored. The workflow behind these
items is in [04-workflow-and-features.md Part 1](04-workflow-and-features.md#part-1-recommended-morning-workflow).

**What the redesign already ships.** The redesigned page (pull request #2, on main since `0315d09`) already does part
of P2-01 to P2-06 ([08 section 3](08-redesign-coverage.md#3-coverage)). Each of those items says what is already on
the page, which Phase 1 keeps ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)),
and keeps only the rest as Phase 2 work. Its acceptance criteria say which checks already pass on that page and stay
as regression checks, and which are new. Measurements quoted in these items are Playwright Chromium on main `0315d09`,
2026-10-20; real phones, screen readers, Firefox and WebKit were not tested.

**Phase 2 rule for the committed data.** Phase 2 items may add rows only where a planted problem is added on purpose
and listed in `PLANTED` and the README. Unless an item says so, the committed data still gives the 10 rows of
[section 3.1](#31-phase-1-acceptance-bar).

#### P2-01: Freshness and coverage strip

- **Findings:** [LOAD-05](02-findings.md#load-05) (low), [WAT-05](02-findings.md#wat-05) (medium). **Rules:** [RULE-WF-14](03-research-and-data.md#rule-wf-14) (C), the strip part.
- **Problem and evidence:** at `cfd77e5`, "an old export is shown as the current report" (LOAD-05); a tank whose sensor
  stopped less than 24 hours ago "is judged on its old reading and counted OK, with no sign of how old the shown level
  is" (WAT-05).
- **Already on the page (redesign):** each tank card shows the time of its last reading ("11.8% at 6:00 PM"; a silent
  tank "last heard 42 h ago"), and Phase 1 keeps it
  ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)). P2-01 adds the "late"
  state, its CAN'T TELL row and the freshness strip.
- **Proposed behaviour:** one line under the header per source, for example "Water: 7 of 8 tanks reported in the last
  24 h; weigh-in Sep 15; budget through Sep" (RULE-WF-14 recommendation). In demo mode the page says "Fictional
  snapshot, not live" instead of an age alarm; with real data, a banner when the viewer's clock is well past the as-of
  time. A tank whose newest reading is more than 12 hours old (demo setting, D) is "late": it shows its reading time
  and gets a CAN'T TELL warning row.
- **Files and data:** `app.js`, `index.html`, `exceptions.js`, `format.js`.
- **Dependencies:** P1-03, P1-06, P1-07.
- **Effort:** M.
- **Acceptance criteria:** `freshness('2026-09-30T18:00', '2026-10-16T09:00')` gives 15 days 15 hours and a banner
  containing '15 days', and no banner at 2026-09-30T20:00; with the demo flag on, the label says example data and no
  banner shows; the V-M3 data gives one T4 Water row containing '18 hours' and '44.5%'; the committed data still gives
  exactly 3 Water rows.

#### P2-02: Morning review layout

- **Findings:** none directly. **Rules:** [RULE-WF-18](03-research-and-data.md#rule-wf-18) (C, "design target (not validated)").
- **Problem and evidence:** the page answers the morning question, but the order of reading is not designed around it
  ([04-workflow-and-features.md section 1.3](04-workflow-and-features.md#13-the-morning-review-step-by-step)).
- **Already on the page (redesign):** a summary card (`#summary`) leads the page with the number of rows and counts by
  severity, and the list comes before the charts. On the committed data at 1280 x 900 the counts and the first three
  rows are visible without scrolling (row 3 ends at y 872); at 390 x 844 the counts are visible (they end at y 424)
  and the first row ends at y 846, just below the fold. There is no freshness line, no Today / This week / Plan
  grouping and no new or resolved counts. Phase 1 keeps the card and the order
  ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)).
- **Proposed behaviour:** the four steps from 04: freshness and coverage; new or changed, worst first, with counts
  ("2 today / 6 this week / 2 plan"), built on the summary card; why each row is there (P2-04); assign or print
  (P2-07). Charts stay below as drill-down. "New" and "Resolved since last review" use the per-device last-review time
  (P2-11).
- **Files and data:** `index.html`, `app.js`.
- **Dependencies:** P2-01, P2-03, P2-04, P2-07; P2-11 for the new and resolved counts.
- **Effort:** M.
- **Acceptance criteria:** at 1280 x 900 and 390 x 844 the freshness line, the severity counts in the summary card and
  the first three rows are visible without scrolling on the committed data (new at 390 x 844, where today the first row
  ends just below the fold); the rows still become cards at 390 x 844 and the page has no sideways scroll (kept from
  Phase 1); no page or README text claims a review time until a stopwatch test with 2-3 managers is recorded
  (RULE-WF-18 phase note: "Measure with a stopwatch test before claiming a time").

#### P2-03: Filters by severity, pasture, group and area

- **Findings:** [UI-10](02-findings.md#ui-10) (low). **Rules:** [RULE-WF-05](03-research-and-data.md#rule-wf-05) (A).
- **Problem and evidence:** at `cfd77e5`, "Keyboard focus is lost after activating a filter chip" (UI-10).
- **Already on the page (redesign):** the area chips are built once, set `aria-pressed`, keep focus and let Tab move
  on to the next chip, so the UI-10 part of the acceptance criteria passes today (`docs/audit/redesign/coverage.mjs`,
  check UI-10). Each chip shows its count in a badge ("Water 3"). Nothing is announced when a chip changes the list.
  Phase 1 keeps the chips ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)).
- **Proposed behaviour:** filter chips for severity (including CAN'T TELL), pasture and group beside the area chips,
  combinable. Focus stays on the chip; the result is announced as a status message ("Showing 3 of 10: Water"). The
  selected filter may be remembered on this device (P2-11).
- **Files and data:** `app.js`, `index.html`.
- **Dependencies:** P1-06 (row model with `refs`).
- **Effort:** S.
- **Acceptance criteria:** this check passes on the redesigned page and stays as a regression check: focusing the Water
  chip and pressing Enter leaves `document.activeElement.dataset.a === 'Water'`, shows 3 data rows and
  `aria-pressed="true"` on Water only, and Tab goes to Grazing (UI-10). New in P2-03: a live region announces "Showing
  3 of 10: Water"; the Pasture filter "Lone Tree" shows the T4 row; a severity filter and an area chip combine.

#### P2-04: Alert explanations ("Why this row?")

- **Findings:** [GRZ-08](02-findings.md#grz-08) (low), [UI-16](02-findings.md#ui-16) (low).
- **Problem and evidence:** the serious grazing action is "one blanket line based only on elapsed days: no escalation
  and no destination" (GRZ-08); at `cfd77e5` the gain chart "does not mark the animals the report flags, or the 50%
  and 80% lines" (UI-16).
- **Already on the page (redesign):** the gain chart draws the 6 yearlings the warning rule flags (Y027, Y031, Y058,
  Y082, Y129, Y132) in the warning colour, with a legend and "Flagged: under 50% of target" in their reading, and
  draws and labels the target, 80% and 50% lines (`docs/audit/redesign/coverage.mjs`, check UI-16: 6 flagged dots).
  Phase 1 keeps the flagged readings, the legend and the lines
  ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)). The flagged dots differ
  from the other dots by colour alone (1.10:1 against them): a known issue of the redesign that a separate pull request
  fixes ([06 section 15](06-phase1-spec.md#15-open-decisions-and-assumptions)), not a feature to keep as it is.
- **Proposed behaviour:** each row opens a panel with the readings and their times, the threshold, its basis (A-D) and
  the rule ID (wireframe in [04 section 1.4b](04-workflow-and-features.md#14b-why-this-row-panels)). The grazing
  first step names candidate pastures past their minimum rest, with any open water problem on them. The gain chart
  keeps its flagged-animal readings, its legend and its 50% and 80% lines.
- **Files and data:** `app.js`, `exceptions.js` (rows already carry `evidence`).
- **Dependencies:** P1-06, P2-08 (rest days for candidate pastures).
- **Effort:** M.
- **Acceptance criteria:** committed data: the Yearlings action mentions 'Windmill' and its tank problem, or says no
  rested pasture has water (Windmill rest Sep 30 - Aug 11 = 50 >= 45; T2 11.8% < 25) (GRZ-08); the T4 panel lists the
  readings from 2026-09-29 18:00 (56.0%) to 2026-09-30 18:00 (10.0%). The UI-16 check passes on the redesigned page
  and stays as a regression check: exactly 6 flagged dots in the Yearlings row, whose readings name Y027, Y031, Y058,
  Y082, Y129 and Y132 (measured by check UI-16 and KEEP-24 of 06 section 6.3; restated from "marked dots ...
  labelled": the redesign names each flagged animal in its reading, as `cfd77e5` already did for every dot, so on the
  chart the dot is marked by colour only; making that mark more than colour is the follow-up pull request of 06
  section 15, and P2-05 keeps it), with the 50% line at 1.0 lbs/day for yearlings and at 0.5 for heifers (half of each
  target; by code reading, `app.js:518` draws the lines per group).

#### P2-05: Chart details by keyboard and touch

- **Findings:** [UI-01](02-findings.md#ui-01) (medium), [UI-11](02-findings.md#ui-11) (low). **Rules:** [RULE-WF-02](03-research-and-data.md#rule-wf-02) (A), [RULE-WF-03](03-research-and-data.md#rule-wf-03) (A), [RULE-WF-04](03-research-and-data.md#rule-wf-04) (A), [RULE-WF-08](03-research-and-data.md#rule-wf-08) (B).
- **Problem and evidence:** at `cfd77e5`, "a tap on a phone shows nothing, gain dots are 3.9 px targets, and keyboard
  or screen-reader users cannot reach any chart detail" (UI-01); tooltips near an edge "are squeezed or open
  off-screen" (UI-11).
- **Already on the page (redesign):** every chart reading opens on hover, on a tap or a finger slid along the chart,
  and from the keyboard (Tab to the chart, then the arrow keys, Home and End); the reading shows the value first; it
  flips and clamps to stay inside the window and below the top bar, and Escape hides it. The budget chart is now a
  table, so its amounts are table cells. Phase 1 keeps all of this
  ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)).
- **Proposed behaviour:** a "Show data" table per chart; a short text alternative per chart that states its
  decision-relevant state (for example "T4 Lone Tree: 10% now, down 46 points in the last 24 hours"; today the label
  gives only the last reading); a reading the mouse can move onto, or that a click keeps open (RULE-WF-03; today the
  reading ignores the pointer and a click does not keep it open); decision marks at 3:1 contrast or with the same
  information in text (RULE-WF-08). The flagged gain dots, which today differ from the other dots by colour alone
  (1.10:1), are left to a separate follow-up pull request to the redesign
  ([06 section 15](06-phase1-spec.md#15-open-decisions-and-assumptions)); P2-05 keeps that fix.
- **Files and data:** `app.js`, `index.html`.
- **Dependencies:** P1-13, P1-14.
- **Effort:** M.
- **Acceptance criteria:** these pass on the redesigned page and stay as regression checks: at 390 x 844 with touch,
  tapping the H026 dot shows '0.11 lbs/day', 'H026 · Heifers' and 'now 1,136 lbs' (restated for the redesign's
  reading; [08 section 4](08-redesign-coverage.md#4-intentional-differences-from-cfd77e5)), and the Repairs row of
  `#budgetTable` reads 'Serious', '\$9,000 of \$7,200' and '+\$1,800' (restated: there is no budget chart) (UI-01);
  at 1280 x 900, Tab reaches T4's chart in `#tanks` and `#tip` reads '10%' and 'T4 Lone Tree · Sep 30, 6 PM'; the T4
  reading's right edge is <= 1280 with width >= 120 (UI-11); Escape hides the reading without moving the pointer.
  New in P2-05: each chart has a "Show data" table, where T4's reads 'Sep 30, 6 PM: 10%'; T4's text alternative
  contains '10%' and '46 points'; moving the mouse from a data point onto its reading keeps the reading shown, or a
  click keeps it shown until Escape or a click elsewhere.

#### P2-06: Phone tables and chart legibility

- **Findings:** [UI-02](02-findings.md#ui-02) (medium), [UI-03](02-findings.md#ui-03) (medium), [UI-12](02-findings.md#ui-12) (low), [UI-13](02-findings.md#ui-13) (low), [UI-14](02-findings.md#ui-14) (low), [UI-15](02-findings.md#ui-15) (low), [UI-17](02-findings.md#ui-17) (low).
- **Problem and evidence:** at `cfd77e5`, "On a phone the 'Problem' and 'First step' columns are off-screen" (UI-02);
  "Chart text renders at about 7 px on a phone" (UI-03); plus label collisions, raw ISO dates, long-name overflow,
  lines drawn across sensor outages and budget-chart extremes (UI-12 to UI-17).
- **Already on the page (redesign):** list rows become cards at 760 px or less, and the budget table drops its Budget
  and Actual columns at 640 px or less (UI-02); chart text renders at 11.5 px at every width (UI-03); tank names sit on
  one line and no gain labels overlap (UI-12); long group names end with an ellipsis and budget names wrap in their
  cell (UI-14); the water line breaks where readings stop for more than 12 hours (UI-15); budget value labels sit
  outside, inside or across the bar and never cover a category name (part of UI-17). Phase 1 keeps all of this
  ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)).
- **Proposed behaviour:** short dates ("Jul 20") in every row in one change (decision D14), and a cap on the budget
  bar scale so one very large overrun does not shrink the other bars (today the scale grows with the largest
  percentage; `budget()` in `app.js`).
- **Files and data:** `app.js`, `format.js`; the Phase 1 tests that quote ISO dates.
- **Dependencies:** P1-14, P1-15.
- **Effort:** M.
- **Acceptance criteria:** the regression tests of UI-02, UI-03, UI-12, UI-14 and UI-15 pass on the redesigned page
  (`docs/audit/redesign/coverage.mjs`) and stay, restated for it: UI-03 uses the computed font size ("at 390 px, for
  each svg.chart, computed font size x rendered width / viewBox width >= 11"; 11.5 today); UI-12 checks that no two
  text boxes in `#gain svg.chart` intersect and that the tank names (`#tanks .tank-name`) all have one height at 390 px;
  UI-14 checks, on the long-names data (the `longnames` case of `coverage.mjs`), that each grazing label ends before the
  first bar, that no gain group name (`#gain svg.chart text.hd`) covers a dot (the redesign writes each name above its
  row; measured with Playwright Chromium on main `0315d09` on 2026-10-20 at 1280, 390 and 320 px, not yet in
  `coverage.mjs`), and that each budget name fits its cell. New in P2-06: "The Heifers row contains 'Jul 20'; the
  health rows contain 'Sep 15' and 'Oct 3'" (UI-13); and UI-17 restated for the budget table: with M1's data
  (committed plus `2026-09,Hay,500,1500`, +200%) the bar scale stops at +-100%, Hay's bar is clipped and keeps its
  "+200.0%" label (one decimal, [06 section 5.6](06-phase1-spec.md#56-budget)), no two scale labels overlap, and the Fuel bar (+21%) is at least 21% of its track's half width
  (UI-17's "at least 39 px" of a 183 px half plot); with AB-09's data no value label covers a category name (the AB-09
  case was not run on the redesign). On main `0315d09` with M1's data (Playwright Chromium, 2026-10-20) the scale runs
  to +-200% and Fuel's bar is 24.9 of 234 px at 1280 x 900, so the cap and the Fuel width are new in P2-06; the three
  scale labels do not overlap there at 1280, 390 or 320 px.

#### P2-07: Printable crew briefing

- **Findings:** none directly. **Rules:** [RULE-WF-17](03-research-and-data.md#rule-wf-17) (B); the visual-check part of [RULE-WAT-15](03-research-and-data.md#rule-wat-15).
- **Problem and evidence:** RULE-WF-17 is "current fails in print".
- **Proposed behaviour:** a "Print crew briefing" view: one Letter page, black on white, large text, grouped by place,
  each item with its first step, a check box and space for a written result; tanks get a "level seen by eye" column;
  the footer carries the as-of time, the print time and "Example Ranch - fictional data"
  ([04 section 1.4c](04-workflow-and-features.md#14c-printed-crew-briefing-one-letter-page-black-on-white)).
- **Files and data:** `index.html` (`@media print`), `app.js`.
- **Dependencies:** P1-06, P2-03.
- **Effort:** M.
- **Acceptance criteria:** Playwright `page.pdf` in Letter size on the committed data gives one page; every exception
  row and its first step appear; computed text colour is black and background white; the footer contains "fictional".

#### P2-08: Rest checks and a credible example rotation

- **Findings:** [GRZ-04](02-findings.md#grz-04) (medium), [GRZ-05](02-findings.md#grz-05) (medium), [GRZ-07](02-findings.md#grz-07) (low). **Rules:** [RULE-GRZ-03](03-research-and-data.md#rule-grz-03) (B), [RULE-GRZ-04](03-research-and-data.md#rule-grz-04) (C).
- **Problem and evidence:** "min_rest_days is never read" (GRZ-04); "two pastures held two groups at once and 11 of 13
  sequential re-entries are short of the file's own minimum rest" (GRZ-05); a group with no current stay "drops out of
  grazing silently while the 'Head on grass' tile still counts it" (GRZ-07).
- **Proposed behaviour:** first make the example season credible in the generator (no unplanned sharing, re-entries
  that respect `min_rest_days`), keeping the Yearlings' Sand Hills stay from Sep 6 and the Heifers in Lone Tree on the
  as-of date, because the planted overstay and the T4 subject depend on them. Then add a rest check (rest counts from
  the last out_date of any group), a concurrent-occupancy data check, and a "no current pasture recorded" row or a group
  status column. The rest minimums are the example file's own values (C), not validated agronomic guidance.
- **Files and data:** `scripts/generate_data.py` (`moves()` uses no random draw, so other files stay unchanged);
  `data/moves.csv`; `exceptions.js`; README.
- **Dependencies:** P1-08, P1-05.
- **Effort:** M.
- **Acceptance criteria:** an independent day-by-day occupancy test over `data/moves.csv` and `data/pastures.csv`
  reports 0 overlaps and 0 short rests, or only planted ones listed in `PLANTED` (GRZ-05); on fixture data the rest rows
  for 'Cows in South Divide' (6 of 60) and 'Heifers in Lone Tree' (34 of 45) appear (GRZ-04); with Yearlings marked
  'shipped', 'Head on grass' is 225 (180 + 45) (GRZ-07); the committed data still gives the 10 rows.

#### P2-09: Consequence-aware ranking

- **Findings:** [UI-09](02-findings.md#ui-09) (low), [WAT-09](02-findings.md#wat-09) (low); the Phase 2 part of [WAT-06](02-findings.md#wat-06). **Rules:** [RULE-WAT-05](03-research-and-data.md#rule-wat-05) (C), [RULE-WAT-07](03-research-and-data.md#rule-wat-07) (C), [RULE-BUD-14](03-research-and-data.md#rule-bud-14) (C), [RULE-WF-10](03-research-and-data.md#rule-wf-10) (B).
- **Problem and evidence:** same-severity rows sort A-Z by area, "so the Budget overruns head the serious block above an
  overdue vaccination and a silent water sensor" (UI-09); "A silent tank last seen nearly empty and falling is only
  'serious'" (WAT-09).
- **Proposed behaviour:** within a severity, order by area priority Water, Health, Grazing, Gain, Budget (RULE-BUD-14),
  then tanks with cattle on the pasture first (RULE-WAT-05), then by subject. A silent tank's severity is the higher of
  serious and what its last known level and fall would give (RULE-WAT-07). The rules table says what each level means
  ("act today", "act this week", "plan at the next gather or month"; RULE-WF-10).
- **Files and data:** `exceptions.js` (sort, water severity), `app.js` (rules table).
- **Dependencies:** P1-07, P1-08.
- **Effort:** S.
- **Acceptance criteria:** committed data: the serious rows' areas are in the order ['Water', 'Health', 'Grazing',
  'Gain', 'Budget', 'Budget'] (UI-09) and the first Water row's subject contains 'Tank T4' (WAT-06, Phase 2); W-16: TA
  before TB; W-12: one T1 row, critical, containing '30 hours' and '8%' (WAT-09); T6 (last seen at 98.5%) stays serious.

#### P2-10: Further record and sensor checks

- **Findings:** [WAT-10](02-findings.md#wat-10) (low), [GAIN-09](02-findings.md#gain-09) (medium), [GAIN-14](02-findings.md#gain-14) (low), [HLTH-04](02-findings.md#hlth-04) (low), [BUD-07](02-findings.md#bud-07) (low), [UI-18](02-findings.md#ui-18) (low).
- **Problem and evidence:** a frozen sensor "is treated as a healthy tank" (WAT-10); "An individual animal losing weight
  is never named while its whole group is flagged" (GAIN-09); a group change between weigh-ins is not mentioned
  (GAIN-14); a task done after its due date but still open is reported as overdue (HLTH-04); "A large under-spend is
  never surfaced" (BUD-07); "'Head on grass 375' counts 180 cow-calf pairs as 180 head" (UI-18).
- **Proposed behaviour:** a frozen-value check (same reading for 30 hours or more, demo setting); any animal losing
  weight named even when the group is flagged; a note when an animal changed group; a "record conflict" warning instead
  of "overdue"; a large under-spend as an information line in the budget section, not a warning (decision D12); "180
  pairs" in the head tile detail.
- **Files and data:** `exceptions.js`, `app.js`.
- **Dependencies:** P1-07, P1-09, P1-11, P1-12, P1-14.
- **Effort:** M.
- **Acceptance criteria:** V-M4 data gives one T4 row containing '67.5%' and '30 hours', and the committed data still
  gives 3 Water rows (WAT-10); H026 at 1130 then 959 gives a Gain row naming 'H026', and the committed data still gives
  10 rows (GAIN-09); GN-10 data names H001 and 'Cows' (GAIN-14); the HLTH-04 inline row gives one warning matching
  `/last done 2026-09-20.*after.*due 2026-09-15/i` whose action is not a scheduling instruction; with a 25%-under demo
  setting, two information lines name Vet and health (\$3,000) and Labor (\$18,000), and the committed data gives none
  (BUD-07, restated as information under D12); the head tile detail reads '180 pairs' (UI-18).

#### P2-11: Optional per-device acknowledgements and notes

- **Findings:** none directly. **Rules:** [RULE-WF-11](03-research-and-data.md#rule-wf-11) (B), [RULE-WF-15](03-research-and-data.md#rule-wf-15) (B).
- **Problem and evidence:** RULE-WF-11: "acknowledging an exception never clears it"; RULE-WF-15: shared
  acknowledgements "cannot live only in localStorage".
- **Proposed behaviour:** an optional "Seen" mark and a short note per row, stored in this browser and labelled "this
  device only". The row stays on the list with its severity until the data clears it; a condition that clears and comes
  back is new again; a severity increase clears the mark. Row IDs are area + subject ID + rule. Every storage call is
  wrapped in try/catch, and the page works fully with storage empty or blocked. Shared acknowledgements, owners and
  history stay deferred.
- **Files and data:** `app.js`; new `store.js`.
- **Dependencies:** P1-06 (stable row IDs).
- **Effort:** M.
- **Acceptance criteria:** with `localStorage` throwing on every call, the page renders all 10 rows and no page error;
  marking T4 "Seen" leaves the row in the table with severity Critical and the words "this device only" beside the mark;
  a fixture where T4 recovers and drops again shows the row as New; raising a row from warning to critical clears its
  mark.

### 4.1 Coverage: Phase 2 findings

The redesigned page (pull request #2) already does what UI-01, UI-02, UI-03, UI-10, UI-12, UI-14, UI-15 and UI-16 ask,
and UI-11 except its budget tooltip, which no longer exists. It does part of UI-17
([08 section 3](08-redesign-coverage.md#3-coverage)). Each of these keeps that behaviour as a regression check from
Phase 1 on. A finding counts as fixed only when its test exists and passes. The titles below describe `cfd77e5`.

| Finding | Severity | Status | Effort | Title | Item |
|---|---|---|---|---|---|
| [LOAD-05](02-findings.md#load-05) | low | design-limitation | S | No data-age check: an old export is shown as the current report, and the as-of line has no time zone | P2-01 |
| [WAT-05](02-findings.md#wat-05) | medium | design-limitation | S | A tank whose sensor stopped less than 24 hours ago is judged on its old reading and counted OK, with no sign of how old the shown level is | P2-01 |
| [WAT-09](02-findings.md#wat-09) | low | design-limitation | S | A silent tank last seen nearly empty and falling is only 'serious', ranked below every critical row | P2-09 |
| [WAT-10](02-findings.md#wat-10) | low | design-limitation | S | A sensor that keeps sending the same frozen value is treated as a healthy tank | P2-10 |
| [GRZ-04](02-findings.md#grz-04) | medium | design-limitation | S | min_rest_days is never read: stays that start inside a pasture's own minimum rest go unflagged | P2-08 |
| [GRZ-05](02-findings.md#grz-05) | medium | confirmed | M | The example season is not credible as a rotation: two pastures held two groups at once and 11 of 13 sequential re-entries are short of the file's own minimum rest | P2-08 |
| [GRZ-07](02-findings.md#grz-07) | low | design-limitation | S | A group with no current stay drops out of grazing silently while the 'Head on grass' tile still counts it | P2-08 |
| [GRZ-08](02-findings.md#grz-08) | low | design-limitation | M | The serious grazing action is one blanket line based only on elapsed days: no escalation and no destination | P2-04 |
| [GAIN-09](02-findings.md#gain-09) | medium | design-limitation | S | An individual animal losing weight is never named while its whole group is flagged | P2-10 |
| [GAIN-14](02-findings.md#gain-14) | low | confirmed | S | An animal that changes group between weigh-ins is counted in its earlier group without saying so | P2-10 |
| [HLTH-04](02-findings.md#hlth-04) | low | design-limitation | S | An open task whose last_done is after its next_due is reported as overdue with 'Schedule it this week' | P2-10 |
| [BUD-07](02-findings.md#bud-07) | low | design-limitation | S | A large under-spend is never surfaced: a category 50% under budget gets no row | P2-10 |
| [UI-01](02-findings.md#ui-01) | medium | confirmed | M | Chart details can only be opened with a mouse hover: a tap on a phone shows nothing, gain dots are 3.9 px targets, and keyboard or screen-reader users cannot reach any chart detail | P2-05 |
| [UI-02](02-findings.md#ui-02) | medium | confirmed | M | On a phone the 'Problem' and 'First step' columns are off-screen and budget differences are cut mid-number, with no cue that the table scrolls | P2-06 |
| [UI-03](02-findings.md#ui-03) | medium | confirmed | M | Chart text renders at about 7 px on a phone | P2-06 |
| [UI-09](02-findings.md#ui-09) | low | design-limitation | S | Rows with the same severity are ordered A-Z by area name, so the Budget overruns head the serious block above an overdue vaccination and a silent water sensor | P2-09 |
| [UI-10](02-findings.md#ui-10) | low | confirmed | S | Keyboard focus is lost after activating a filter chip | P2-03 |
| [UI-11](02-findings.md#ui-11) | low | confirmed | S | Tooltips near the right or bottom edge are squeezed or open off-screen | P2-05 |
| [UI-12](02-findings.md#ui-12) | low | confirmed | S | Small chart label collisions: the '3.0' tick overlaps 'lbs per day', and the T6 heading wraps on a phone | P2-06 |
| [UI-13](02-findings.md#ui-13) | low | confirmed | S | Exception text shows raw ISO dates ('2026-07-20') while the rest of the page uses 'Jul 20' | P2-06 |
| [UI-14](02-findings.md#ui-14) | low | confirmed | S | Long group or budget category names overflow their fixed label space: they overlap the bars and dots, or are cut off at the card edge | P2-06 |
| [UI-15](02-findings.md#ui-15) | low | confirmed | S | The water chart draws a straight line across sensor outages inside the 7-day window | P2-06 |
| [UI-16](02-findings.md#ui-16) | low | confirmed | S | The gain chart does not mark the animals the report flags, or the 50% and 80% lines | P2-04 |
| [UI-17](02-findings.md#ui-17) | low | confirmed | S | Budget chart extremes: a category well under budget draws its value label over its name, and one large percentage overrun squashes the chart and stacks every axis label | P2-06 |
| [UI-18](02-findings.md#ui-18) | low | plausible | S | 'Head on grass 375' counts 180 cow-calf pairs as 180 head | P2-10 |

### 4.2 Phase 2 rules

The "Current or proposed" column describes `cfd77e5`. On the redesigned page, in Chromium: RULE-WF-02 is met by
keyboard and touch, without "Show data" tables; RULE-WF-03 is partly met (Escape hides the reading and a tap keeps it
open, but the mouse cannot move onto it and a click does not keep it open); RULE-WF-04 is partly met (the tank charts'
labels give the last reading; no chart label states the decision-relevant state); RULE-WF-05 keeps focus on the chip
but announces nothing; RULE-WF-08 is met for the earlier grazing stays (3.28:1) and the over-plan segment (a line and
a "days past plan" label), and not met for the flagged gain dots (1.10:1 against the other dots; a separate pull
request fixes them, [06 section 15](06-phase1-spec.md#15-open-decisions-and-assumptions)). Phase 1 keeps what is met
([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)).

| Rule | Class | Current or proposed | Rule (short) | Item |
|---|---|---|---|---|
| [RULE-WAT-05](03-research-and-data.md#rule-wat-05) | C | current gap + proposed | water severity should account for whether cattle are on the tank's pasture now or are planned to move there | P2-09 |
| [RULE-WAT-07](03-research-and-data.md#rule-wat-07) | C | proposed | silence escalation | P2-09 |
| [RULE-GRZ-03](03-research-and-data.md#rule-grz-03) | B | current (unused data) -> proposed | Rest/recovery check | P2-08 |
| [RULE-GRZ-04](03-research-and-data.md#rule-grz-04) | C | proposed | Concurrent-occupancy check | P2-08 |
| [RULE-BUD-14](03-research-and-data.md#rule-bud-14) | C | proposed | At equal severity, budget rows sort below animal welfare rows (Water, Health, Grazing, Gain) instead of alphabetically first. | P2-09 |
| [RULE-WF-02](03-research-and-data.md#rule-wf-02) | A | proposed (current fails) | every detail now shown only on pointer hover (tank reading at a time, grazing stay dates and plan, animal tag and ADG, budget dollars) must also be re... | P2-05 |
| [RULE-WF-03](03-research-and-data.md#rule-wf-03) | A | proposed (current fails) | the custom tooltip must be dismissible with Escape without moving the pointer, and hoverable (the pointer can move onto it without it disappearing), o... | P2-05 |
| [RULE-WF-04](03-research-and-data.md#rule-wf-04) | A | proposed (partly met) | each chart needs a short text alternative that states the decision-relevant state, plus a long alternative or data table | P2-05 |
| [RULE-WF-05](03-research-and-data.md#rule-wf-05) | A | proposed (current fails) | when a filter chip changes the exception list, announce the result as a status message ('Showing 3 of 10: Water') and keep keyboard focus on the chip | P2-03 |
| [RULE-WF-08](03-research-and-data.md#rule-wf-08) | B | proposed | chart marks a reader needs to make the decision (past grazing stays, the over-plan segment, target lines) should reach 3:1 against adjacent colours, o... | P2-05 |
| [RULE-WF-10](03-research-and-data.md#rule-wf-10) | B | proposed | assign severity by consequence of no response and the time available to respond, with about 3 documented levels (e.g | P2-09 |
| [RULE-WF-11](03-research-and-data.md#rule-wf-11) | B | proposed | acknowledging an exception never clears it | P2-11 |
| [RULE-WF-15](03-research-and-data.md#rule-wf-15) | B | proposed | acknowledgements, notes and owners that the crew must share cannot live only in localStorage | P2-11 |
| [RULE-WF-17](03-research-and-data.md#rule-wf-17) | B | proposed (current fails in print) | a one-page printable crew briefing in black on white, large text, grouped by place or route, each item with its first step, a check box and space for ... | P2-07 |
| [RULE-WF-18](03-research-and-data.md#rule-wf-18) | C | proposed (design target) | a ~2-minute morning review | P2-02 |

---

## 5. Phase 3: Add later

At most three additions, ranked. The ranking is the same in [03-research-and-data.md section 1.4](03-research-and-data.md#14-research-view-of-the-three-phase-3-additions-recommendation)
and [04-workflow-and-features.md section 2.4](04-workflow-and-features.md#24-recommendation-three-additions-ranked): water supply coverage first, forage
observations second, drought and precipitation context third. Each keeps the static architecture: new CSV files are
read like the existing ones, and any public data is fetched at build time and committed as a dated snapshot.

#### P3-01 (rank 1): Water supply coverage from tank capacity and head count

- **Findings:** [WAT-06](02-findings.md#wat-06) (medium; its Phase 1 copy note is in P1-16 and its ranking part in P2-09). **Rules:** [RULE-WAT-06](03-research-and-data.md#rule-wat-06) (C), [RULE-WAT-09](03-research-and-data.md#rule-wat-09) (B).
- **Problem and evidence:** "Water severity uses level percent alone: it ignores stock on the pasture, tank capacity and
  use" (WAT-06).
- **Proposed behaviour:** `tanks.csv` gains `capacity_gal`, a usable fraction and `supply_type`, with fictional values
  from the generator, labelled. The tank heading and "Why this row?" panel show estimated hours or days of water for the
  head present, with the assumptions beside the number (capacity, head, class, the intake figure used, inflow counted or
  not). Windmill or solar tanks get a storage-days planning tile, with the 3-day figure marked as a ranch-set target
  (RULE-WAT-09). A silent tank shows "last seen X h ago at Y% (about Z h of water then)". The estimate is first an
  explanation and a ranking key within a severity; it changes severities only after the ranch has entered real
  capacities and compared the estimates with its own tanks
  ([04 section 2.4](04-workflow-and-features.md#rank-1-water-supply-coverage-from-tank-capacity-and-head-count)).
- **Files and data:** `scripts/generate_data.py`, `data/tanks.csv`, `exceptions.js`, `app.js`.
- **Dependencies:** P1-07 (tank master list), P2-09 (ranking with cattle present), P2-04 (panel).
- **Effort:** M.
- **Acceptance criteria:** with `capacity_gal` and a stated gallons-per-head figure labelled as a demo setting, a
  1,000-gal tank at 38% with 180 head at 20 gal/day gives 380 / (180 x 20 / 24) = 2.53 hours (WAT-06's hand value; the
  20 gal/day is an assumption for illustration); a tank with no capacity shows "capacity unknown" and no hours; the
  committed data keeps the Phase 2 row set unless a planted case is added and listed in `PLANTED`.

#### P3-02 (rank 2): Forage observations at moves

- **Findings:** none directly. **Rules:** [RULE-GRZ-05](03-research-and-data.md#rule-grz-05) (C), [RULE-GRZ-06](03-research-and-data.md#rule-grz-06) (B).
- **Problem and evidence:** the grazing rule is "days elapsed" only; RULE-GRZ-05 calls a manual forage record "the
  cheapest, most credible forage signal for a portfolio dashboard".
- **Proposed behaviour:** a manual `forage_obs.csv` (date, pasture, observer, residual height or utilization with its
  method, number of readings, recovery ready yes / no / unsure, optional photo point); per-pasture `key_species` and
  `target_stubble_in`, labelled with their source (for example NDSU R1780, cited with its date) as context-dependent
  defaults (B). A warning when an occupied pasture has had no forage check within N days (demo N = 7, a synthetic
  setting), and "recovery not checked" before a planned move-in without an observation, never "OK". The day-count rule
  stays as a secondary "past planned date" reason.
- **Files and data:** new `data/forage_obs.csv`; `pastures.csv` columns; generator; `exceptions.js`; `app.js`.
- **Dependencies:** P2-08 (rest check), P1-08.
- **Effort:** M.
- **Acceptance criteria:** an occupied pasture whose last observation is 8 days before the as-of date gives a warning
  and one at 7 days gives none (demo N = 7); a planned move-in with no observation reads "recovery not checked"; a
  stubble reading below `target_stubble_in` with cattle still in gives a row naming the reading, the target and its
  source.

#### P3-03 (rank 3): Drought and precipitation context as a dated snapshot

- **Findings:** none directly. **Rules:** [RULE-CTX-01](03-research-and-data.md#rule-ctx-01) (A), [RULE-CTX-02](03-research-and-data.md#rule-ctx-02) (C), [RULE-CTX-03](03-research-and-data.md#rule-ctx-03) (B), [RULE-CTX-10](03-research-and-data.md#rule-ctx-10) (C), [RULE-CTX-15](03-research-and-data.md#rule-ctx-15) (D), [RULE-CTX-16](03-research-and-data.md#rule-ctx-16) (A).
- **Problem and evidence:** context for the drought-plan review, not a daily action. Its main risk is making the
  fictional ranch look real (RULE-CTX-15).
- **Proposed behaviour:** a separate manual or scheduled `refresh-context` workflow (never the test workflow) writes
  `data/context.csv` with value, unit, area, valid date, release time, retrieval time, source URL and attribution. The
  USDM county category mix for a named stand-in county is chosen by **release time** on or before the as-of time and
  labelled "valid <Tue>, released <Thu>" (RULE-CTX-01). It is marked stale when the as-of time is more than about 9.1
  days after the valid date (RULE-CTX-02). Weeks at D2 or worse are information only, with a link to FSA and no
  eligibility claim (RULE-CTX-03). Optional, and later than the snapshot itself: a ranch rain-gauge record and
  drought-plan trigger dates that create a "review the grazing plan" prompt, never a move exception (RULE-CTX-10). They
  are not needed for the dated snapshot and do not count as a separate addition; if they are not built, P3-03 is still
  complete. Everything is labelled "Public data: <County>, <State>; ranch data
  fictional" (RULE-CTX-15). No SD Mesonet data is committed (RULE-CTX-16). A missing or failed fetch shows
  "unavailable", never "no drought".
- **Files and data:** new workflow file under `.github/workflows/`; `data/context.csv`; `app.js`.
- **Dependencies:** P1-03 (as-of time with a zone), P2-01 (freshness strip).
- **Effort:** M.
- **Acceptance criteria:** for as_of 2026-09-30T18:00 America/Chicago, the selection picks the map valid 2026-09-22,
  not the one valid 2026-09-29 (RULE-CTX-01 phase note: "A naive lookup picks the 2026-09-29 map, released after as_of;
  the correct one is valid 2026-09-22"); an as-of 10 days after the valid date shows "stale"; an empty `context.csv`
  shows "unavailable"; the page makes no request to any other origin at load (it still fetches its own CSV files;
  checked in the browser smoke test); the test workflow does not run the refresh.

### 5.1 Coverage: Phase 3 findings

| Finding | Severity | Status | Effort | Title | Item |
|---|---|---|---|---|---|
| [WAT-06](02-findings.md#wat-06) | medium | design-limitation | M | Water severity uses level percent alone: it ignores stock on the pasture, tank capacity and use, and ties are broken by file order, so an empty-pasture tank outranks a leaking tank 45 heifers drink from | P3-01 |

### 5.2 Phase 3 rules

| Rule | Class | Current or proposed | Rule (short) | Item |
|---|---|---|---|---|
| [RULE-WAT-06](03-research-and-data.md#rule-wat-06) | C | proposed | estimate how long the water in each tank will last for the cattle on it | P3-01 |
| [RULE-WAT-09](03-research-and-data.md#rule-wat-09) | B | proposed | storage-days check | P3-01 |
| [RULE-GRZ-05](03-research-and-data.md#rule-grz-05) | C | proposed | record a forage observation (residual height or utilization estimate, regrowth or recovery note, photo point) at move-out and before re-entry, and war... | P3-02 |
| [RULE-GRZ-06](03-research-and-data.md#rule-grz-06) | B | proposed | key-species residual check during and at the end of each stay | P3-02 |
| [RULE-CTX-01](03-research-and-data.md#rule-ctx-01) | A | proposed | Choose public context by when it was released, not by the week it covers | P3-03 |
| [RULE-CTX-02](03-research-and-data.md#rule-ctx-02) | C | proposed | Mark the drought context stale when (as_of minus USDM valid date) is more than about 9.1 days, meaning a weekly release was missed or the fetch failed | P3-03 |
| [RULE-CTX-03](03-research-and-data.md#rule-ctx-03) | B | proposed | Show the county USDM category mix and a count of weeks at D2 or worse in the last 8 weeks as information only, with a link to FSA | P3-03 |
| [RULE-CTX-10](03-research-and-data.md#rule-ctx-10) | C | proposed | drought-plan review prompts | P3-03 (optional, later part) |
| [RULE-CTX-15](03-research-and-data.md#rule-ctx-15) | D | proposed (demo setting) | Any real public context shown next to the fictional ranch must be (a) pinned to the fictional as_of, not today's live data; (b) for a named real count... | P3-03 |
| [RULE-CTX-16](03-research-and-data.md#rule-ctx-16) | A | proposed (data-source rule) | Do not commit or redistribute SD Mesonet data in a public repository or site | P3-03 |

---

## 6. Deferred and excluded

Nothing in this section is required by any Phase 1, 2 or 3 item. Each can be reconsidered when the stated condition is
met.

### 6.1 Deferred findings

| Finding | Severity | Status | Effort | Title | Why deferred |
|---|---|---|---|---|---|
| [GAIN-10](02-findings.md#gain-10) | medium | design-limitation | L | Weigh conditions (shrink and gut fill) are not recorded, and an ordinary few-percent difference is larger than the serious rule's margin | A data-model change (full weigh-condition records and a shrink policy). Phase 1 adds only a minimal `weight_basis` per session (P1-10, decision D9). The 3% swing is an assumption ("The 3% shrink and fill swing in GAIN-10 is an assumed figure, not a measurement", findings.json). |
| [GRZ-09](02-findings.md#grz-09) | low | design-limitation | L | Two groups in one pasture are each judged alone against a single per-pasture plan | Needs planned days from combined forage demand ([RULE-GRZ-07](03-research-and-data.md#rule-grz-07), deferred: "Needs forage production and harvest-efficiency inputs the demo lacks"). P2-08's concurrent-occupancy check reports shared pastures in the meantime. |

### 6.2 Deferred rules

The 40 rules that `rules.json` defers, with the reason recorded there.

| Rule | Class | Rule (short) | Why deferred |
|---|---|---|---|
| [RULE-WAT-08](03-research-and-data.md#rule-wat-08) | C | leak and stuck-float screen | Needs the phase-3 demand estimate and validation on real tank data. In the meantime the bounded 24 h drop rule (RULE-WAT-03) finds the demo leak. |
| [RULE-WAT-10](03-research-and-data.md#rule-wat-10) | B | float-fed tank adequacy | An infrastructure design check that needs design_inflow_gpm and tank volume; not a daily exception. |
| [RULE-WAT-11](03-research-and-data.md#rule-wat-11) | A | water quality screening by TDS (field EC/TDS meter) | Needs a water-quality test log; not one of the three phase-3 items. Observation, records and escalation only. |
| [RULE-WAT-12](03-research-and-data.md#rule-wat-12) | B | sulfate and nitrate screening flags with class and diet context | Needs lab results entered by hand. A flag must not imply a diagnosis. |
| [RULE-WAT-13](03-research-and-data.md#rule-wat-13) | A | blue-green algae (cyanobacteria) observation and escalation | Needs an observation log. Observation and escalation only; no treatment instructions. |
| [RULE-WAT-14](03-research-and-data.md#rule-wat-14) | C | sensor trust band and calibration record | Vendor-only evidence; revisit with real devices and a calibration record. |
| [RULE-GRZ-07](03-research-and-data.md#rule-grz-07) | B | Derive planned graze days from forage demand (AU-days) instead of a fixed per-pasture day count: planned days = (acres x... | Needs forage production and harvest-efficiency inputs the demo lacks. |
| [RULE-GRZ-08](03-research-and-data.md#rule-grz-08) | C | Cattle behaviour and performance as a move signal (manual note: herd walking fence, bunching at gates or water, selectin... | Needs an observation log; revisit after the phase-3 forage observations exist. |
| [RULE-GRZ-09](03-research-and-data.md#rule-grz-09) | B | Range readiness | Needs growth-stage observations; the demo season starts after turnout. |
| [RULE-GAIN-08](03-research-and-data.md#rule-gain-08) | B | Period-specific expected ADG | Needs a gain_expectations table built for a real ranch; the demo cannot validate it. It is the main accuracy follow-up for the gain rules. |
| [RULE-GAIN-09](03-research-and-data.md#rule-gain-09) | B | Replacement heifer target-weight rule | Part of the deferred breeding and heifer-development records. |
| [RULE-GAIN-11](03-research-and-data.md#rule-gain-11) | C | Scale check per weigh session | An optional weigh-session record; not needed for phase 1. |
| [RULE-HLTH-04](03-research-and-data.md#rule-hlth-04) | C | For vaccination and parasite-control tasks, evaluate against a window (window_start..window_end) recorded from the produ... | Needs window_start, window_end and schedule_source fields; not in the phase lists. |
| [RULE-HLTH-05](03-research-and-data.md#rule-hlth-05) | C | In fly season, each pastured group gets a recurring eye and condition observation | Needs an observation log. Observation and escalation wording only; no diagnosis. |
| [RULE-HLTH-06](03-research-and-data.md#rule-hlth-06) | C | A health task can be marked done only with a BQA-style completion record: date, group or animal ID, product and lot/seri... | Shared records are deferred. Dose and route stay in the record system and are never shown as instructions. |
| [RULE-HLTH-07](03-research-and-data.md#rule-hlth-07) | C | Coverage gap | Needs head_done on completion records. |
| [RULE-HLTH-08](03-research-and-data.md#rule-hlth-08) | A | Serious when a recorded withdrawal clear date falls after the group's planned ship or sale date | Needs withdrawal_clear_date and planned_ship_date records. The dashboard never computes a withdrawal. |
| [RULE-HLTH-09](03-research-and-data.md#rule-hlth-09) | B | Low-stress timing for sensitive groups | Needs breeding dates (deferred breeding module). |
| [RULE-HLTH-10](03-research-and-data.md#rule-hlth-10) | C | Escalate-to-veterinarian triggers from observation records | Needs loss and observation records. Wording stays observational; the veterinarian handles any state reporting. |
| [RULE-HLTH-12](03-research-and-data.md#rule-hlth-12) | C | Herd veterinarian and VCPR currency | An information row; needs vet contact records. |
| [RULE-BUD-07](03-research-and-data.md#rule-bud-07) | C | Credits, refunds and rebates (warranty refunds, returned supplies, patronage or fuel-tax credits) are entered as separat... | Needs an entry_type column; phase 1 only rejects malformed amounts. |
| [RULE-BUD-08](03-research-and-data.md#rule-bud-08) | B | Declare the accounting basis (cash or accrual-adjusted) on the page | Needs meta.accounting_basis. Phase-1 copy may say 'accounting basis not stated (demo)' without adding the field. |
| [RULE-BUD-09](03-research-and-data.md#rule-bud-09) | B | Split fuel variance into price and volume (gallons x \$/gal) | Needs gallons from delivery tickets. |
| [RULE-BUD-10](03-research-and-data.md#rule-bud-10) | B | Treat repairs as lumpy | Needs repair event records. |
| [RULE-BUD-11](03-research-and-data.md#rule-bud-11) | C | Record reforecasts | Needs a reforecast column. |
| [RULE-BUD-12](03-research-and-data.md#rule-bud-12) | B | Align budget categories with standard extension and ERS cost categories, and separate operating from capital and cash fr... | Category mapping and a capital/operating split; not needed for the demo's six categories. |
| [RULE-BUD-13](03-research-and-data.md#rule-bud-13) | C | Show favorable (under-budget) variances informationally when both percent and dollars are large, with a 'timing or savin... | Information only; not in the phase lists. |
| [RULE-CTX-04](03-research-and-data.md#rule-ctx-04) | B | Show state-level NASS Crop Progress pasture and range condition (% very poor+poor and % good+excellent) with its week-en... | NASS Quick Stats needs an API key (a build-time secret); low priority. |
| [RULE-CTX-05](03-research-and-data.md#rule-ctx-05) | B | Show the Grass-Cast seasonal grassland production outlook (% above or below the grid cell's ~38-year average) with its m... | Seasonal context only; not one of the three phase-3 items. |
| [RULE-CTX-06](03-research-and-data.md#rule-ctx-06) | B | Show RAP annual herbaceous production (lbs/acre) history per pasture polygon as retrospective context | Needs real pasture polygons, which the fictional ranch lacks. |
| [RULE-CTX-07](03-research-and-data.md#rule-ctx-07) | C | heat-stress days | Needs a dated weather-forecast snapshot; live integrations are deferred. Could later run on a manually entered forecast high. |
| [RULE-CTX-08](03-research-and-data.md#rule-ctx-08) | A | Do not use NWS HeatRisk as a cattle heat indicator. | A standing exclusion that applies whenever a heat feature is built (RULE-CTX-07). |
| [RULE-CTX-09](03-research-and-data.md#rule-ctx-09) | B | In calving season, show a cold-stress outlook using the Comprehensive Climate Index (CCI) | Calving modules and live weather are deferred; the demo season has no calving. |
| [RULE-CTX-11](03-research-and-data.md#rule-ctx-11) | C | Feed and mineral inventory | Feed inventory is on the lead's defer list. |
| [RULE-CTX-12](03-research-and-data.md#rule-ctx-12) | C | breeding, calving and body-condition records | Calving and breeding modules are on the lead's defer list. |
| [RULE-CTX-13](03-research-and-data.md#rule-ctx-13) | C | a fence, water-system and equipment maintenance log plus a crew task list | Maintenance logs and crew task tracking with shared records are on the lead's defer list. |
| [RULE-CTX-14](03-research-and-data.md#rule-ctx-14) | B | Per-pasture ecological site and reference production as static attributes from NRCS soil and ecological site data, looke... | Needs real pasture locations; not for the demo. |
| [RULE-WF-12](03-research-and-data.md#rule-wf-12) | C | shelving (temporarily hiding a row) must have a reason, a person and an expiry, and the count of shelved rows must stay ... | Hiding rows needs shared, accountable records, which are deferred. The phase-2 per-device acknowledgement never hides a row. |
| [RULE-WF-13](03-research-and-data.md#rule-wf-13) | C | show how long each exception has been open (first seen), and flag rows open longer than N days as 'standing' for the wee... | Needs first_seen history kept across loads (shared, persisted state). |
| [RULE-WF-16](03-research-and-data.md#rule-wf-16) | C | health completion history and any shared acknowledgement or notes log are operational records | Shared records are on the lead's defer list. |

### 6.3 Deferred or excluded features and integrations

From [04-workflow-and-features.md section 2.5](04-workflow-and-features.md#25-deferred-or-excluded-and-why) and
`integrations.json` (47 integrations; none is Phase 1; browser storage and print are Phase 2, with the NRCS eFOTG
technical notes as a Phase 2 reference for rest defaults; the USDM statistics
service, the IEM fallback, PRISM (optional), NDSU R1780 and the FSA link are Phase 3).

| Item | Decision | Reason |
|---|---|---|
| Live integrations (NWS API, vendor tank feeds, scale indicators) | Defer | "live integrations are deferred"; vendor claims are "Vendor specification only". The public demo never fetches live data at page load. |
| Crew task tracking with shared records; shared acknowledgements, owners, shelving, history | Defer | No shared write path on a static site; the printed briefing (P2-07) covers the morning hand-off; per-device marks (P2-11) are labelled "this device only". |
| Feed and mineral inventory | Defer | Weak evidence; use rate must be measured; counts go stale. |
| Calving, breeding and body-condition module | Defer | Scheduling is a ranch and veterinarian choice; needs new records; out of season at the as-of date. |
| Fence, water-system and equipment maintenance log | Defer | Weak evidence; needs shared, current records. |
| Health completion records, observation logs, withdrawal dates | Defer | Shared records are deferred; dose and route "are never shown as instructions". |
| Heat-stress and cold-stress context; NASS pasture condition; Grass-Cast; RAP; soils and ecological sites | Defer | Out of season, regional, or would imply a real place for the fictional ranch (04 section 2.5). |
| NWS HeatRisk | Exclude | "HeatRisk is a human heat-health index." |
| SD Mesonet data in the repository | Exclude (link only) | "Redistribution of these data is not allowed." |
| Walk-over scales; FARAD integration | Exclude | Walk-over scales show "bias and the need for outlier cleaning"; the dashboard "never computes extralabel withdrawal". |
| Predictive or AI recommendations | Exclude | Transparent, testable rules answer the morning question ([04 section 2.6](04-workflow-and-features.md#26-why-transparent-rules-are-enough)); no demonstrated requirement. |
| Investment and ROI economics | Exclude here | Kept in the separate Ranch Tech ROI project. |

---

## 7. Unresolved assumptions and open decisions

### 7.1 Assumptions carried from the audit

From findings.json `unresolved_assumptions` and [03-research-and-data.md section 6](03-research-and-data.md#6-unresolved-assumptions-and-open-questions):

- Every current threshold is a demonstration setting or a ranch choice; "The research found no extension, NRCS or
  peer-reviewed source for the 25% / 40% tank levels, the 30-point drop, 24 hours of silence, the 2-day grace, the
  80% / 50% gain shares, the 7-day lead time or the 5% / 10% budget bands."
- Whether a budget month counts as closed on its last calendar day is a ranch bookkeeping choice. Decision D1 makes it
  explicit in `meta.csv` for the demo.
- "The 3% shrink and fill swing in GAIN-10 is an assumed figure, not a measurement."
- "The gallons-per-head-per-day figure in WAT-06 is an assumption for illustration."
- That Excel rewrites ISO timestamps as M/D/YYYY on re-save is unverified; how common reused tags, per-pasture tank
  names and comma-formatted weights are in real exports is inferred, not measured.
- Real-device touch behaviour, screen-reader announcements, Firefox and WebKit are untested; the GitHub Pages site
  was unreachable (proxy 403), so its 404 behaviour is inferred.
- No user testing was done; the 2-minute review is a design target.

### 7.2 Assumptions and open points introduced by this roadmap

- **New demo settings.** The group and individual minimum intervals (21 and 42 days), the 80% coverage gate, the 45-day
  weigh-in age limit, the session share (half the group), the weight and gain plausibility bands (200-2,500 lbs; -3 to
  +5 lbs/day), the 12-hour "late" sensor line, the 30-hour frozen-value line, the 25%-under information line and the
  dollar lines in decision D2 are synthetic demonstration settings (D). None is sourced or validated.
- **The 42-day individual minimum** is chosen so the six planted slow yearlings (slow only in the last 57-day interval)
  remain. RULE-GAIN-07 says the 70-day alternative was "not tested in this audit"; `scenarios.gain70.py`, written later
  by the scenario step, gives 6 slow yearlings by the last 57-day interval, 1 (Y129) by a three-point regression and 0
  by Jun 1 to Sep 15. That is a calculation on the fictional data. It shows what a longer minimum would do to the
  planted problem; it does not show which minimum is right for a real herd.
- **The max-drawdown window** (decision D5) finds a fall that refilled inside the window and reports it as critical; on
  real data this may flag a fixed float. It is untested on real tank data.
- **The weigh-basis gate** (decision D9) needs the generator to write `weigh_sessions.csv`, and the scenario folders
  need one too (decision D16); if Phase 1 must shrink, it moves to Phase 2 and the gain rows carry a "weighing
  conditions not recorded" note instead.
- **The scenario folders** (`docs/audit/scenarios/`) were written in parallel with this roadmap and committed only in
  the work-in-progress commit `b548e4f`; they may change before Phase 1 starts. Decision D16 assumes their
  `expected.json` results stay as read on 2026-10-19. Their
  `settings.json` differs from this roadmap's settings in five places (drop formula, individual minimum, coverage
  share, closed months, weigh basis); [06-phase1-spec.md section 11.2](06-phase1-spec.md#112-scenario-tests) lists each
  difference and its effect, which on the 10 folders is nil once D16's inputs are added (roadmap check, not run against
  any implementation). No folder tests a coverage share between 0.5 and 0.8 or an individual interval between 21 and
  41 days, so unit fixtures must cover those.
- **T6 as CAN'T TELL** (decision D7) is an exception to the findings registry's statement that no CAN'T TELL state
  should appear on the committed data; the lead or owner may prefer to keep T6 as an ordinary serious alert.
- **Fixture details.** Some acceptance cases name audit fixtures by ID (for example W-02, GN-07, CSV-35). Their
  definitions are in `docs/audit/diagnostics/*.mjs`; P1-17 builds them as single-change fixtures under
  `tests/fixtures/`, alongside the 10 end-to-end folders in `docs/audit/scenarios/`. For LOAD-03's
  "shipped" case this roadmap assumes the Yearlings are removed from every file, which is how the finding's 7-row count
  is reached.
- **Effort** is this roadmap's estimate using the registry's S / M / L key; no time measurement backs it.
- **The roadmap check numbers** (Fuel 21.25%, Repairs falling to a warning under D1's default with D2's lines, and the
  comparisons of the scenario folders under both drop formulas and both closed-month conventions) were computed for this
  document with short Python scripts; they are not audit evidence.

---

## 8. Sources for this document

- `docs/audit/data/findings.json` and `findings-index.json`: finding IDs, severity, status, effort, phase, quoted
  `actual`, `expected` and `regression_test` text, `policies` (phase 1 acceptance, ownership) and
  `unresolved_assumptions`.
- `docs/audit/data/rules.json` and `rules-index.json`: rule IDs, classes, recommended phases, phase notes and
  recommendations; `data-fields.json` (152 fields, 43 required in Phase 1); `integrations.json` (47 integrations);
  `registry-changelog.md`.
- [01-baseline.md](01-baseline.md), [02-findings.md](02-findings.md), [03-research-and-data.md](03-research-and-data.md),
  [04-workflow-and-features.md](04-workflow-and-features.md).
- Repository files at the reviewed commit, read for this roadmap: `exceptions.js`, `app.js`, `index.html`, README.md,
  `scripts/generate_data.py`, `tests/exceptions.test.mjs`, `.github/workflows/test.yml`, `data/*.csv`.
- The scenario step's files, read on 2026-10-19: `docs/audit/scenarios/` (10 folders with `expected.json` and
  `scenario.md`, `settings.json`, `run-results.json`) and `docs/audit/diagnostics/scenarios.build.py`,
  `scenarios.run.mjs` and `scenarios.gain70.py` (run with `python3 -I` for the output quoted in D6).
- External sources are cited in [03-research-and-data.md section 7](03-research-and-data.md#7-bibliography); this
  roadmap adds none.
