# 04. Manager workflow and additional features

This document has two parts.

- **Part 1** proposes a morning review of about two minutes and evaluates each workflow element the owner asked
  about: a top-priority action list, filters, alert explanations, data freshness and coverage, the difference between
  "no issues detected" and "insufficient information", chart details on phones and keyboards, a printable crew
  briefing, and optional acknowledgement, assignment, notes and resolution history.
- **Part 2** scores the candidate additional features, recommends no more than three of them for Phase 3, ranked, and
  says what is deferred or excluded and why.

The dashboard is a portfolio demonstration running on fictional data (Example Ranch). It is **not production-ready**,
and nothing below would make it so. Every current threshold (25% / 40% tank level, 30-point drop in 24 hours, 24 hours
of sensor silence, planned graze days per pasture, 2-day move grace, gain under 80% / 50% of target, 2.0 / 1.0 lb daily
gain targets, health tasks due within 7 days, 5% / 10% over budget) is a demonstration setting to be tuned per ranch,
not a validated operating value. Any setting proposed below is also a demonstration setting. Health content stays on
observation, scheduling, records and escalation to a veterinarian. Investment and return-on-investment economics are
left to the separate Ranch Tech ROI project.

## Contents

- [About this document](#about-this-document)
- [How to read this document](#how-to-read-this-document)
- [Part 1. Recommended morning workflow](#part-1-recommended-morning-workflow)
  - [1.1 The job and the time budget](#11-the-job-and-the-time-budget)
  - [1.2 Keep what already works](#12-keep-what-already-works)
  - [1.3 The morning review, step by step](#13-the-morning-review-step-by-step)
  - [1.4 Wireframes](#14-wireframes)
  - [1.5 Evaluation of each element the owner listed](#15-evaluation-of-each-element-the-owner-listed)
  - [1.6 What a static site can remember](#16-what-a-static-site-can-remember)
  - [1.7 Acknowledging never makes a condition healthy](#17-acknowledging-never-makes-a-condition-healthy)
  - [1.8 Part 1 by phase](#18-part-1-by-phase)
- [Part 2. Additional features](#part-2-additional-features)
  - [2.1 How the candidates were scored](#21-how-the-candidates-were-scored)
  - [2.2 Scores](#22-scores)
  - [2.3 Evidence behind each score](#23-evidence-behind-each-score)
  - [2.4 Recommendation: three additions, ranked](#24-recommendation-three-additions-ranked)
  - [2.5 Deferred or excluded, and why](#25-deferred-or-excluded-and-why)
  - [2.6 Why transparent rules are enough](#26-why-transparent-rules-are-enough)
  - [2.7 Investment economics stay in the Ranch Tech ROI project](#27-investment-economics-stay-in-the-ranch-tech-roi-project)
- [3. Unresolved assumptions](#3-unresolved-assumptions)
- [4. Sources cited in this document](#4-sources-cited-in-this-document)
- [5. Index of finding and rule IDs used](#5-index-of-finding-and-rule-ids-used)

## About this document

| Item | Value |
|---|---|
| Repository | CowCampSTX/ranch-ops-dashboard |
| Commit reviewed | `cfd77e50a050163b542cadfc6b38882c0341e99d` (main when this document was written). "Today" and "Verified, today" below describe this commit. Pull request #2 has since merged a redesigned page into main (merge commit `0315d09`, 2026-10-20); [section 1.5](#15-evaluation-of-each-element-the-owner-listed) and [section 1.8](#18-part-1-by-phase) note what it changed. |
| Registries used | `docs/audit/data/findings.json` (83 findings), `docs/audit/data/rules.json` (98 rules, 152 data fields, 47 integrations; split copies in `data-fields.json` and `integrations.json`), `docs/audit/data/sources.json`, and the critic notes in `docs/audit/data/registry-changelog.md`. |
| Evidence used | `docs/audit/evidence/baseline.json`, the `audit_*`/`verify_*` files, and `research_workflow.json`, `research_context.json`, `research_water.json`, `research_grazing.json`, `research_health.json`, `research_gain.json`, `research_budget.json` with their `cite_*` checks. |
| Earlier documents | `01-baseline.md` (how the code works today, baseline test results) and `02-findings.md` (every finding, by phase). Finding IDs below link to their entries in `02-findings.md`. |
| Project guidance files | At the reviewed commit `cfd77e5` there was **no PROJECT_CONTEXT.md or AGENTS.md**. The workflow is judged against README.md, the code, the committed data and the lead's phase defaults. The repository now has [AGENTS.md](../../AGENTS.md) (added 2026-10-20) with the instructions for every agent. |
| Blocked checks | The published GitHub Pages site could not be reached (the environment's proxy answered 403), so the live deployment is unverified. Only Playwright Chromium, with phone and touch emulation, was run. No real phones, screen readers, Firefox or WebKit were tested. |
| What this document did not do | No new test, browser run or user test was made for it. Every observed number is quoted from the evidence files or the registries. The few readings shown in the wireframes are copied from the committed fictional data files, which are named where they are used. **No user testing of any workflow was done.** |

## How to read this document

Each statement is one of four kinds, and is marked as such where the difference matters:

1. **Verified** statements were reproduced or measured in the audit. Most carry a finding ID (for example `UI-09`) and
   quote the registry's evidence; finding IDs link to `02-findings.md`. A few quote a measurement that a research rule
   records as "OBSERVED" in its evidence (for example the print measurements in `RULE-WF-17`); those name the rule ID.
2. **Research** conclusions come from `rules.json`. They carry a rule ID (for example `RULE-WF-11`), the rule's
   classification and recommended phase, and the sources behind it, with the citation checker's verification status.
3. **Recommendations** are this document's proposals. Nothing in the dashboard's code, data, tests or README was
   changed.
4. **Assumptions** are things that could not be supported from the evidence. They are marked in the text and collected
   in [section 3](#3-unresolved-assumptions).

**Classification of rules** (from `rules.json`): **A** supported general guidance; **B** context-dependent guidance;
**C** ranch-specific management choice; **D** synthetic demonstration setting. A rule that bundles supported guidance
with a design choice takes the stricter class.

**Phases** (the lead's defaults, which the registries follow): **Phase 1** "Fix now" (correctness, data integrity,
misleading outputs); **Phase 2** "Build next" (manager workflow and usability); **Phase 3** "Add later" (at most three
additions); **Defer** (out of the planned phases). Requirements apply by phase: nothing below asks a Phase 1 change to
depend on a Phase 2 or Phase 3 feature.

**Effort** (from `findings.json`): **S** a focused change, usually under a day; **M** several functions or files;
**L** a data-model change. Where no finding gives an effort, the effort shown is this document's estimate and says so.

---

# Part 1. Recommended morning workflow

## 1.1 The job and the time budget

The README states the page's purpose: "One page that answers a ranch manager's first question each morning: **what
needs my attention today?**" The research rule for the morning review names the decision it supports: "What the
manager assigns before the crew leaves" (`RULE-WF-18`, class C, Phase 2).

**Verified.** Today's report is short. `RULE-WF-18` records: "today's report has 10 rows and 215 words in the row cells
(rowCount 10, wordsInRows 215), plus 5 tiles." The workflow research adds that this "is plausibly scannable in about 2
minutes, but this was not user-tested" (`research_workflow.json`, feature notes).

**Research.** `RULE-WF-18` is "PROPOSED design target (not validated): a ~2-minute morning review." Its limitations say:
"No user testing was done. The 2-minute figure is a design target, not evidence." The alarm-management sources behind
it are clinical and process-industry studies (Drew et al. 2014 in PLOS ONE; the exida white paper on ISA-18.2; UK HSE
CHIS6). The rule says they "do not transfer numerically to a once-a-day review; they support only the principle that
every row should be actionable and duplicate or non-actionable rows removed."

**Assumption.** The two-minute total and the seconds per step in section 1.3 are design targets. Before anyone claims
"two minutes", `RULE-WF-18` recommends: "Measure it with a stopwatch test on 2-3 managers."

## 1.2 Keep what already works

These behaviours are verified on the committed example data. The morning review should be built on them, not around
them. Each has a limit, which is a finding in its own right.

| Keep | Evidence (verified) | Limit to fix |
|---|---|---|
| **Worst first, with a first step on every row.** | README: problems "at the top, worst first, each with a first step to take". `RULE-WF-09` (class B, Phase 1): "all 10 rows have a non-empty First step". | Within one severity, rows sort A-Z by area, so "1. Budget: Fuel \| 2. Budget: Repairs" head the serious block, above an overdue vaccination and a silent sensor ([UI-09](02-findings.md#ui-09)). |
| **Duplicate noise is suppressed.** A silent sensor is not also judged on its stale level; a group-wide gain problem is not repeated per animal. | `RULE-WF-19` (class B, Phase 1): "The run produced exactly one T6 row ('No reading for 42 hours; last level 98.5%') and no per-animal heifer row." `01-baseline.md` quotes audit_gain: "32 of 45 heifers are under 0.5 (Python), yet only the serious Heifers row is shown." | The hidden detail must stay reachable: `RULE-WF-19` recommends giving the group row "its count of individual slow animals". An animal losing weight is never named while its group is flagged ([GAIN-09](02-findings.md#gain-09)). A sensor that stopped less than 24 hours ago is still judged on its old reading ([WAT-05](02-findings.md#wat-05)). |
| **Context in the alert.** A water alert names the pasture and the group drinking there. | The committed row reads "Tank T4 (Lone Tree, Heifers here now)". | "here now" means "as of the data's as_of", which the wording does not say; Phase 1 honest copy changes it to "as of <date>". The group name is lost with a stray space, a text cell in moves, or an empty moves file ([CSV-05](02-findings.md#csv-05), [GRZ-03](02-findings.md#grz-03), [LOAD-01](02-findings.md#load-01)). |
| **Severity by shape and text, not colour alone.** Octagon = Critical, triangle = Serious, circle = Warning, each followed by the word. | `RULE-WF-01` (class A, WCAG 2.2 SC 1.4.1, Phase 1): the table read as text gave `bySeverity {"Critical":2,"Serious":6,"Warning":2}`, and "On the Chromium print PDF the icons and words survived". | Extend the same shape and text to the new CAN'T TELL and data-issue states (`RULE-WF-01` phase note). |
| **Large enough controls and a visible focus ring.** | `RULE-WF-06` (class A, Phase 1): chips measured "69.3-92.3 x 30.1 CSS px with 8 px minimum gap, "allAtLeast24": true". `RULE-WF-07` (class A, Phase 1): every chip Tab stop showed a visible focus ring in Chromium. | Firefox and Safari were not tested. Any new control keeps 24 x 24 CSS px targets (`RULE-WF-06`). |
| **The data stays labelled as fictional.** | The as-of line reads "Example Ranch (fictional), 4,300 acres in 8 pastures. Data as of September 30, 2026 at 6:00 PM." ([LOAD-05](02-findings.md#load-05), actual output). `RULE-WF-21` (class D). | The line has no time zone ([TIME-02](02-findings.md#time-02)) and no age ([LOAD-05](02-findings.md#load-05)). |

**What the 10 rows show and do not show.** The committed data gives 10 rows: Critical 2, Serious 6, Warning 2 (the table
is in `01-baseline.md`, section 4.5). `RULE-WF-21` is plain about what that proves: "The 10-of-10 match shows the rules
find what the generator planted. It does not validate the thresholds or the workflow against real operations."

## 1.3 The morning review, step by step

Four steps, about two minutes in total. The seconds are design targets (an assumption, see section 1.1).

| Step | Question the manager answers | About | What the page shows | Phase | IDs |
|---|---|---|---|---|---|
| 1. Freshness and coverage | Can I trust today's data, and is any area blind? | 15 s | As-of line with the ranch time zone and a "Fictional snapshot, not live" badge (Phase 1). A one-line-per-area strip: what reported, how old, how much is covered, and a count of CAN'T TELL areas and data issues (Phase 2). | 1 and 2 | [TIME-02](02-findings.md#time-02), [LOAD-01](02-findings.md#load-01), [LOAD-02](02-findings.md#load-02), [LOAD-05](02-findings.md#load-05), [WAT-02](02-findings.md#wat-02), [WAT-05](02-findings.md#wat-05), [GAIN-07](02-findings.md#gain-07), [GAIN-08](02-findings.md#gain-08); `RULE-WF-14`, `RULE-WAT-15`, `RULE-GAIN-10` |
| 2. New or changed, worst first | What is new or worse since I last looked, and what must happen today? | 35 s | Counts as "2 today / 6 this week / 2 plan", "new since your last review on this device", then the list grouped Today / This week / Plan, ranked by consequence within each group. | 2 | [UI-09](02-findings.md#ui-09), [WAT-06](02-findings.md#wat-06), [WAT-09](02-findings.md#wat-09); `RULE-WF-10`, `RULE-WF-13`, `RULE-WF-18`, `RULE-BUD-14`, `RULE-WAT-05`, `RULE-WAT-07` |
| 3. Why each one is there | What reading crossed which line, and when was it taken? | 45 s | Open the 2-4 rows that are new, worse or about to be acted on. Each opens to the readings used, their times, the threshold and its basis ("Demo setting"), who is on the pasture, and coverage. | 1 (basis copy) and 2 | [GRZ-08](02-findings.md#grz-08), [UI-16](02-findings.md#ui-16), [GAIN-09](02-findings.md#gain-09), [GAIN-11](02-findings.md#gain-11), [UI-13](02-findings.md#ui-13); `RULE-WF-04`, `RULE-WF-19`, `RULE-WF-20` |
| 4. Assign or print | Who does what before the crew leaves? | 25 s | "Print crew briefing": one black-on-white Letter page grouped by place, each line with its first step, a check box, a space for the reading and initials. Budget rows stay with the manager. | 2 | `RULE-WF-17`, `RULE-WAT-15`, `RULE-HLTH-11` |

### Step 1. Freshness and coverage (about 15 seconds)

**Verified, today.** The only freshness signal is the as-of line, and it has no zone or age. With the clock fixed 15
days later, the page still showed "Data as of September 30, 2026 at 6:00 PM." with no age wording ([LOAD-05](02-findings.md#load-05)).
`RULE-WF-14` measured the same snapshot as "ageHoursAtRun": 368 hours old, with "pageMentionsStaleOrAge": false. A
missing or empty file reads as "nothing needs attention": with health.csv answering 404 the chips read "Health (0)" and
the Health filter says "Nothing in health needs attention." ([LOAD-01](02-findings.md#load-01)). A tank absent from the
export disappears, and a header-only water.csv gives "WATER TANKS OK / 0 of 0 / 0 need a look" ([WAT-02](02-findings.md#wat-02)).

**Recommendation.**

- *Phase 1 (prerequisites, already in the plan).* The as-of line shows the ranch time zone ([TIME-02](02-findings.md#time-02)).
  The demo shows "Fictional snapshot, not live" instead of a staleness alarm (`RULE-WF-14` phase note). An area with
  missing, unreadable, stale or insufficient data shows CAN'T TELL, never all-clear ([LOAD-01](02-findings.md#load-01),
  [WAT-02](02-findings.md#wat-02), [GAIN-07](02-findings.md#gain-07), [GAIN-08](02-findings.md#gain-08)). A loading
  message and per-file error messages replace the blank page ([LOAD-02](02-findings.md#load-02)). The tile "Water tanks
  OK" becomes "Sensors normal" until a visual check is recorded (`RULE-WAT-15`, class C, Phase 1 copy only).
- *Phase 2.* Add the freshness and coverage strip. `RULE-WF-14` gives its wording: "Water: 7 of 8 tanks reported in the
  last 24 h; weigh-in Sep 15; budget through Sep". Add the age check against the clock with a demo flag, so the
  fictional page says "example data" rather than raising a false alarm ([LOAD-05](02-findings.md#load-05)). Add the
  "sensor late" warning for a tank that stopped reporting less than 24 hours ago ([WAT-05](02-findings.md#wat-05);
  demo setting 12 hours; each tank card already shows the time of its shown level since the redesign, by code reading
  of `app.js` on main `0315d09`, [08 section 3.2](08-redesign-coverage.md#32-partly-addressed)). Show weighed head
  against inventory head beside every group gain figure (`RULE-GAIN-10`, class C, Phase 1; on the committed data
  "45 of 45 heifers, 150 of 150 yearlings").

### Step 2. New or changed, worst first (about 35 seconds)

**Verified, today.** The list is worst first by severity, but ties are broken alphabetically by area
([UI-09](02-findings.md#ui-09)) and, within water, by file order: "T2 comes before T4 only because T2 comes first in
water.csv", although "P2 Windmill is empty" and 45 heifers drink at T4 ([WAT-06](02-findings.md#wat-06)). A silent tank
last seen at 8% and falling is only Serious ([WAT-09](02-findings.md#wat-09)). The page has no first-seen date and no
"new since" marker (`RULE-WF-13` evidence: "hasAgeOrFirstSeenColumn false").

**Research.** `RULE-WF-10` (class B, Phase 2) assigns severity "by consequence of no response and the time available to
respond", with "about 3 documented levels (e.g. Critical = act today ...; Serious = act this week; Warning = plan at
the next gather or month)". Its sources are the exida white paper (a consultancy, labelled vendor) and HSE CHIS6, by
analogy from process control. `RULE-BUD-14` (class C, Phase 2) puts budget rows below animal-welfare rows at equal
severity; the registry calls this "unsupported management judgement" because its only citation was rejected.
`RULE-WAT-05` (class C, Phase 2) ranks tanks with cattle on them first; "Tanks in empty pastures keep their row but rank
lower; they are never hidden."

**Recommendation (Phase 2).**

- Group rows as **Today** (Critical), **This week** (Serious) and **Plan** (Warning), with the counts on top ("2 today / 6
  this week / 2 plan", the example wording in `RULE-WF-18`).
- Within a group, rank by area in the order Water, Health, Grazing, Gain, Budget ([UI-09](02-findings.md#ui-09) proposed
  fix), then water rows with cattle on the pasture first, with the head count shown ([WAT-06](02-findings.md#wat-06),
  Phase 2 part). Escalate a silent tank last seen under the critical line or falling at the leak rate
  ([WAT-09](02-findings.md#wat-09); `RULE-WAT-07`).
- Mark rows **New** or **Worse** since the last review *on this device*. `RULE-WF-13` says a "'New since your last
  review' marker ... needs last_review_at per viewer and is fine to keep in localStorage". To know which rows are new,
  the device also keeps the list of row IDs and severities it showed at the last review (a design inference; the row ID
  is `exception_id`, "area + subject id + rule id" in `data-fields.json`). With no stored history, show "history
  unavailable", never "new" (`RULE-WF-18`, `RULE-WF-13` missing-data rules). An "Open for N days" column needs shared
  history across loads and is deferred (`RULE-WF-13`, Defer).
- Keep budget rows in the list, last within their group, and mark them as manager or month-end items. `RULE-WF-10`
  suggests "showing budget variances as a separate weekly or monthly review list"; that is an option the ranch can
  choose, not a requirement.

### Step 3. Why each one is there (about 45 seconds)

**Verified, today.** A row gives one sentence and a first step. The readings behind it are only in hover tooltips,
which a phone tap does not open ([UI-01](02-findings.md#ui-01)). The grazing action is the same blanket line for 1, 30
or 90 days over and names no destination ([GRZ-08](02-findings.md#grz-08)). The gain chart draws all 195 dots in one
style, so the flagged animals cannot be picked out ([UI-16](02-findings.md#ui-16)). The rules table lists thresholds
but no basis (`RULE-WF-20` evidence).

**Research.** `RULE-WF-04` (class A, WCAG 2.2 SC 1.1.1, Phase 2): each chart needs a short text alternative stating
"the decision-relevant state" and a data table. `RULE-WF-20` (class B, Phase 1): the rules table shows each threshold's
basis, "'Demo setting (D)' for every current value until it is sourced or set by the ranch".

**Recommendation.**

- *Phase 1.* Add the Basis column to the rules table (`RULE-WF-20`), name both weigh dates in gain rows
  ([GAIN-11](02-findings.md#gain-11)), and reword Health and gain follow-ups to observation and escalation
  (`RULE-HLTH-11`, class C, Phase 1).
- *Phase 2.* Give each row a "Why this row?" panel (wireframe 1.4b): the readings used and their times, the threshold
  and its basis, the change computed, who is on the pasture as of the as-of date, and for gain the weighed coverage.
  For grazing, build the first step from the data: pastures past their minimum rest, with any open water alert on them
  ([GRZ-08](02-findings.md#grz-08), with [GRZ-04](02-findings.md#grz-04)). Show dates as "Sep 15", not "2026-09-15"
  ([UI-13](02-findings.md#ui-13)). Name animals with negative gain even when the group is flagged
  ([GAIN-09](02-findings.md#gain-09)). The gain chart's flagged-animal readings, legend key and 50% / 80% lines are on
  the page since the redesign and Phase 1 keeps them ([UI-16](02-findings.md#ui-16);
  [06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)). The flagged dots differed
  from the others by colour alone at `0315d09`; the follow-up pull request of
  [06 section 15](06-phase1-spec.md#15-open-decisions-and-assumptions) draws them as amber squares, and Phase 1 keeps
  them.

### Step 4. Assign or print the crew briefing (about 25 seconds)

**Verified, today.** There is no print stylesheet. `RULE-WF-17` measured: "mediaPrintRules": 0, the default Chromium PDF
ran to "pdfPages": 4, and the main text printed at 2.71:1 on white, so "the print hierarchy is inverted: the most
important text is the faintest". The page has no owner or acknowledgement column (`RULE-WF-11` evidence:
"hasOwnerColumn false, hasStatusOrAckColumn false").

**Research.** `RULE-WF-17` (class B, Phase 2) recommends "a one-page printable crew briefing in black on white, large
text, grouped by place or route, each item with its first step, a check box and space for a written result". Its
sources: MDN on print stylesheets and `print-color-adjust` (the default "economy" mode "might opt to leave out all
background images and to adjust text colors"), the Penn State SOP writing guide (Stup 2001) and Cornell (Skellie 2019)
on posted, large-text instructions. The classification note warns that the SOP guidance is dairy-oriented and that
print was measured in Chromium only.

**Recommendation (Phase 2).** A "Print crew briefing" button and an `@media print` stylesheet with explicit black-on-white
colours ("do not rely on print-color-adjust", integration entry "Browser print / @media print"). One Letter page,
a heading for each pasture, then columns `[ ] | What | Problem | First step | Result / reading | Who` (the "Where"
column in `RULE-WF-17` becomes the pasture heading), and a footer with as-of time, print time and "Example Ranch -
fictional data" (wireframe 1.4c). The "Who" column is filled in by hand: assignment is
not stored in Phase 2 (section 1.6). Tanks to check by eye go on the sheet so the crew can bring back a written
reading (`RULE-WAT-15`: "Recording visual checks comes with the phase-2 printable crew briefing").

## 1.4 Wireframes

The wireframes use the committed fictional data. Rows, wording and counts come from the 10 rows in `01-baseline.md`
section 4.5, reworded the way the Phase 1 and Phase 2 recommendations say. Numbers in brackets refer to the legend under
each wireframe. They are design sketches, not tested layouts.

### 1.4a Morning view

```text
+--------------------------------------------------------------------------------------------+
| (1) EXAMPLE RANCH - FICTIONAL DATA         [ Fictional snapshot, not live ]  [ Print crew ] |
|     Data as of Sep 30, 2026, 6:00 PM <ranch time zone>                       [ briefing   ] |
+--------------------------------------------------------------------------------------------+
| (2) DATA FRESHNESS AND COVERAGE                                                            |
|     Water    7 of 8 tanks reported in the last 24 h (T6: no reading for 42 h, see list)    |
|     Grazing  3 of 3 groups have a current stay                                             |
|     Gain     last weigh-in Sep 15 | Heifers 45 of 45 weighed | Yearlings 150 of 150 weighed |
|              Cows: no gain target, not judged                                              |
|     Health   4 open tasks, all with a due date                                             |
|     Budget   months closed through Sep                                                     |
|     [?] Can't tell: 0 areas, 1 row (T6)        [i] Data issues: 0                          |
+--------------------------------------------------------------------------------------------+
| (3) [#] 2 TODAY    [^] 6 THIS WEEK    [o] 2 PLAN                                           |
|     New since your last review (this device only): history unavailable on first visit      |
|     Area: [All] [Water] [Grazing] [Gain] [Health] [Budget]   Severity: [All] [Today]       |
|     Pasture: [ Any v ]   Group: [ Any v ]                              [Week] [Plan]       |
|     Showing 10 of 10                                                                       |
+--------------------------------------------------------------------------------------------+
| (4) TODAY                                                                                  |
| [#] Critical  Water   Tank T4, Lone Tree - Heifers (45 head) on this pasture as of Sep 30   |
|               Dropped 46 points in 24 hours, now 10% (reading at Sep 30 18:00)             |
|               First step: Check for a leak or a stuck float; haul water if it can't be    |
|               fixed today                                                                  |
|               [ Why this row? v ]   [ Mark seen (this device only) ]                       |
| [#] Critical  Water   Tank T2, Windmill - no cattle on this pasture as of Sep 30            |
|               Down to 11.8% full (reading at Sep 30 18:00)                                 |
|               First step: Check the float and the supply line today                        |
|     THIS WEEK                                                                              |
| [^] Serious   Water   Tank T6, Cedar Draw - [?] Can't tell: no reading for 42 hours; last  |
|               98.5% at Sep 29 00:00. First step: Check the tank by eye today, then the     |
|               sensor battery and signal                                                    |
| [^] Serious   Health  Yearlings: Booster vaccine - overdue by 15 days (due Sep 15)         |
| [^] Serious   Grazing Yearlings in Sand Hills - day 24 of a 21-day plan (3 days over)     |
| [^] Serious   Gain    Heifers - 0.44 lb/day from Jul 20 to Sep 15 vs 1.0 target;           |
|               45 of 45 weighed                                                             |
| [^] Serious   Budget  Fuel - 21% over season to date ($2,040)         (manager, month-end) |
| [^] Serious   Budget  Repairs - 25% over season to date ($1,800)      (manager, month-end) |
|     PLAN                                                                                   |
| [o] Warning   Health  Cows: Pinkeye check - due in 3 days (Oct 3)                          |
| [o] Warning   Gain    6 yearlings under 1.0 lb/day: Y027, Y031, Y058, Y082, Y129, Y132     |
+--------------------------------------------------------------------------------------------+
| (5) Status, not alerts: Sensors normal 5 of 8 | On grass: 180 pairs, 45 heifers,           |
|     150 yearlings | Charts below, each with [ Show data ]                                  |
+--------------------------------------------------------------------------------------------+
  Shapes: [#] octagon = Critical, [^] triangle = Serious, [o] circle = Warning,
          [?] = CAN'T TELL, [i] = data issue. Each is drawn as a shape followed by its word.
```

| Mark | What it is | Phase | IDs |
|---|---|---|---|
| (1) | Fictional label, as-of with ranch time zone, "not live" badge, print button | 1 (label, zone, badge); 2 (print) | [TIME-02](02-findings.md#time-02), [LOAD-05](02-findings.md#load-05); `RULE-WF-14`, `RULE-WF-17`, `RULE-WF-21` |
| (2) | Freshness and coverage strip with explicit CAN'T TELL and data-issue counts | 1 (the states and counts); 2 (the strip) | [LOAD-01](02-findings.md#load-01), [WAT-02](02-findings.md#wat-02), [WAT-05](02-findings.md#wat-05), [GAIN-07](02-findings.md#gain-07), [GAIN-08](02-findings.md#gain-08), [GAIN-13](02-findings.md#gain-13), [HLTH-02](02-findings.md#hlth-02); `RULE-WF-14`, `RULE-GAIN-10` |
| (3) | Counts by time window, "new since last review" (this device), filters with a visible "Showing N of M" | 2 | [UI-10](02-findings.md#ui-10); `RULE-WF-05`, `RULE-WF-13` (device part only; the rule itself is Defer), `RULE-WF-15`, `RULE-WF-18` |
| (4) | Grouped list, consequence-aware order, "as of" wording, reading times, explanation and per-device mark | 1 (wording); 2 (grouping, ranking, panel, mark) | [UI-09](02-findings.md#ui-09), [WAT-06](02-findings.md#wat-06), [WAT-05](02-findings.md#wat-05), [GAIN-11](02-findings.md#gain-11), [UI-13](02-findings.md#ui-13); `RULE-WF-10`, `RULE-WF-11`, `RULE-BUD-14`, `RULE-WAT-05` |
| (5) | Status moved out of anything styled as an alert; "Sensors normal" counted from structured results; pairs counted as pairs; no hard-coded group tile; charts as drill-down with a data table | 1 ("Sensors normal" copy, structured count, no hard-coded tile); 2 (pairs counted as pairs, data tables) | [UI-04](02-findings.md#ui-04), [UI-18](02-findings.md#ui-18), [LOAD-03](02-findings.md#load-03), [UI-01](02-findings.md#ui-01); `RULE-WF-09`, `RULE-WAT-15`, `RULE-WF-02` |

The values in the strip: "7 of 8 tanks reported in the last 24 h" and "weigh-in Sep 15" are `RULE-WF-14`'s wording;
"45 of 45 heifers, 150 of 150 yearlings" is from `RULE-GAIN-10`; the three current stays are the water research's
"Cows@P7, Heifers@P4, Yearlings@P3"; the 4 open health tasks and the 45-head heifer count are read from the committed
`data/health.csv` and `data/groups.csv`. "Months closed through Sep" assumes the proposed `books_closed_through` field
counts September as closed at the Sep 30 18:00 as-of; the registry lists that as a ranch bookkeeping choice
(findings.json `unresolved_assumptions`). On the committed data the data-issue count is 0 and no area is CAN'T TELL;
the one CAN'T TELL row is T6, kept that way with its serious severity by
[05-roadmap.md decision D7](05-roadmap.md#14-decisions-this-roadmap-makes-where-the-evidence-disagrees). That is the
Phase 1 acceptance bar (findings.json `policies.phase_1_acceptance`, with D7's stated exception). Showing "0" rather than nothing is what tells the
manager that every area had data to judge.

### 1.4b "Why this row?" panels

```text
| [#] Critical  Water   Tank T4, Lone Tree - Heifers (45 head) on this pasture as of Sep 30   |
|     WHY THIS ROW?                                                                          |
|       Rule            24-hour drop (RULE-WAT-03). Threshold: a fall of 30 points or more   |
|                       in 24 hours. Basis: demo setting (D), to be set by the ranch.        |
|       Readings used   Sep 29 18:00  56.0%   ->   Sep 30 18:00  10.0%   (fall: 46 points)   |
|       Also            10% is under the 25% critical line (demo setting)                    |
|       Last reading    Sep 30 18:00, 0 hours before the as-of time                          |
|       On this pasture Heifers, 45 head, as of Sep 30                                       |
|       Not shown       Gallons or hours of water left: no tank capacity on record (Phase 3) |
|       [ Show the last 8 readings ]                                                         |

| [^] Serious   Grazing Yearlings in Sand Hills - day 24 of a 21-day plan (3 days over)     |
|     WHY THIS ROW?                                                                          |
|       Rule            Days in pasture past planned graze days (RULE-GRZ-01).               |
|                       Planned days come from pastures.csv. Basis: demo setting.            |
|       Stay            In Sand Hills since Sep 6; as of Sep 30 that is day 24 of 21         |
|       Forage reading  None recorded (no forage observation field exists yet)               |
|       Where to go     Pastures past their minimum rest (example file values):              |
|                       Windmill 50 of 45 days - but Tank T2 there is Critical (11.8%)       |
```

The T4 readings are the committed rows of `data/water.csv` (`T4,P4,2026-09-29T18:00,56.0` and
`T4,P4,2026-09-30T18:00,10.0`). The grazing panel uses the [GRZ-08](02-findings.md#grz-08) evidence ("P2 Windmill
50/45 READY", and T2 at 11.8%). Those rest figures come from a generator that [GRZ-05](02-findings.md#grz-05) found "not
credible as a rotation", so they change when the generator is fixed together with the rest check
([GRZ-04](02-findings.md#grz-04)). Every threshold shown is labelled as a demo setting, never as a validated value.

### 1.4c Printed crew briefing (one Letter page, black on white)

```text
EXAMPLE RANCH - FICTIONAL DATA - CREW BRIEFING                                    Page 1 of 1
Data as of Sep 30, 2026, 6:00 PM <ranch time zone>         Printed <date and time>
Not live data. Check conditions before acting. Call the vet about any animal that looks unwell.

[ ] | What          | Problem                       | First step                     | Result / reading | Who
----+---------------+-------------------------------+--------------------------------+------------------+----
    P4 LONE TREE (Heifers, 45 head)
[ ] | Tank T4       | Fell 46 points in 24 h,       | Check for a leak or a stuck    | ___ % by eye     | ___
    |               | now 10%                       | float; haul water if not fixed | float ok / fault |
    |               |                               | today                          |                  |
[ ] | Heifers       | Gain 0.44 lb/day vs 1.0       | Check forage and mineral;      | ________________ | ___
    |               | target                        | watch for illness or lameness; |                  |
    |               |                               | call the vet if you see any    |                  |
    P3 SAND HILLS (Yearlings, 150 head)
[ ] | Yearlings     | Day 24 of a 21-day plan       | Move them, or check the grass  | ________________ | ___
[ ] | Yearlings     | Booster vaccine 15 days late  | Schedule it this week          | date set: ______ | ___
[ ] | 6 yearlings   | Under 1.0 lb/day: Y027, Y031, | Look at them at the next       | ________________ | ___
    |               | Y058, Y082, Y129, Y132        | gather; record what you see    |                  |
    P2 WINDMILL (no cattle)
[ ] | Tank T2       | 11.8% full                    | Check the float and the supply | ___ % by eye     | ___
    |               |                               | line                           |                  |
    P6 CEDAR DRAW (no cattle)
[ ] | Tank T6       | No sensor reading for 42 h    | Check the tank by eye; then    | ___ % by eye     | ___
    |               |                               | the sensor battery and signal  |                  |
    P7 SOUTH DIVIDE (Cows, 180 pairs)
[ ] | Cows          | Pinkeye check due Oct 3       | Plan it with the next gather   | ________________ | ___

Budget items (Fuel, Repairs) are not printed: they are manager items for the month-end review.
Example Ranch - fictional data. Thresholds are demonstration settings, not validated values.
```

The heifer and yearling first steps use the `RULE-HLTH-11` rewording ("Check forage and mineral; watch the group for
illness or lameness and call your veterinarian if you see any" and "Look at these animals at the next gather and
record what you see"). Other first steps are the current text; they change wherever a Phase 1 fix changes the row
wording (for example [GRZ-01](02-findings.md#grz-01) on "record a new move date"). Leaving budget rows off the crew
sheet is this document's recommendation; `RULE-BUD-14` notes that budget overruns "are reviewed at month close and are
rarely same-day actions". Whether it fits on one page with a full day's list was not tested.

## 1.5 Evaluation of each element the owner listed

### Summary

| Element | At `cfd77e5` (verified) | Recommendation | Phase | IDs |
|---|---|---|---|---|
| a. Top-priority action list | Worst first with a first step; ties by area A-Z and file order | Keep; group Today / This week / Plan; rank by consequence; mark new or worse on this device | 2 | [UI-09](02-findings.md#ui-09), [WAT-06](02-findings.md#wat-06), [WAT-09](02-findings.md#wat-09); `RULE-WF-09`, `RULE-WF-10`, `RULE-BUD-14`, `RULE-WAT-05` |
| b. Filters by severity, pasture, herd group and area | Area chips only; counts correct; focus lost after a chip; result not announced | Keep area chips; add severity; add pasture and group selectors built from the master lists; always show "Showing N of M" | 2 | [UI-10](02-findings.md#ui-10); `RULE-WF-05`, `RULE-WF-06` |
| c. Alert explanations with readings and thresholds | One sentence per row; readings only in hover tooltips; rules table without basis | Basis column now; "Why this row?" panel with readings, times, threshold and basis | 1 (basis) and 2 | [GRZ-08](02-findings.md#grz-08), [UI-16](02-findings.md#ui-16), [GAIN-09](02-findings.md#gain-09), [GAIN-11](02-findings.md#gain-11); `RULE-WF-04`, `RULE-WF-20` |
| d. Visible data freshness and coverage | As-of line only, no zone, no age, no coverage | Zone and fictional badge now; freshness and coverage strip next | 1 and 2 | [TIME-02](02-findings.md#time-02), [LOAD-05](02-findings.md#load-05), [WAT-05](02-findings.md#wat-05), [GAIN-07](02-findings.md#gain-07), [GAIN-08](02-findings.md#gain-08); `RULE-WF-14`, `RULE-GAIN-10` |
| e. "No issues detected" vs "insufficient information" | Missing or empty data reads as all-clear | Three states everywhere: OK, needs attention, CAN'T TELL; visible data-issue rows | 1 | [LOAD-01](02-findings.md#load-01), [LOAD-02](02-findings.md#load-02), [WAT-02](02-findings.md#wat-02), [GAIN-08](02-findings.md#gain-08), [HLTH-02](02-findings.md#hlth-02), [UI-07](02-findings.md#ui-07); `RULE-WAT-15`, `RULE-WF-14` |
| f. Chart details on phones and keyboard | Hover only; a tap shows nothing; no chart detail reachable by keyboard; 7 px chart text on a phone | "Show data" table under each chart (tap and keyboard readings and stacked rows on phones are on the page since the redesign and Phase 1 keeps them) | 2 | [UI-01](02-findings.md#ui-01), [UI-02](02-findings.md#ui-02), [UI-03](02-findings.md#ui-03), [UI-11](02-findings.md#ui-11); `RULE-WF-02`, `RULE-WF-03`, `RULE-WF-04`, `RULE-WF-08` |
| g. Printable or exportable crew briefing | No print styles; 4 pages; key text faintest | One-page black-on-white briefing grouped by place | 2 | `RULE-WF-17`, `RULE-WAT-15` |
| h. Acknowledgement, assignment, notes, resolution history | None; the page stores nothing | Optional "this device only" mark and notes that never clear a condition; shared owners, history and shelving deferred | 2 (device only); Defer (shared) | `RULE-WF-11`, `RULE-WF-12`, `RULE-WF-13`, `RULE-WF-15`, `RULE-WF-16` |

**Since the redesign** (pull request #2, merged into main as `0315d09` on 2026-10-20;
[08-redesign-coverage.md](08-redesign-coverage.md#3-coverage)): the page now does part of a, b, c and f. It opens with
a summary card that counts the rows by severity (part of a). The area chips keep focus
([UI-10](02-findings.md#ui-10); part of b). The gain chart marks the animals the report flags and draws the 50% and
80% lines ([UI-16](02-findings.md#ui-16); part of c); the flagged dots differed from the others by colour alone, and
the follow-up pull request of [06 section 15](06-phase1-spec.md#15-open-decisions-and-assumptions) fixed that on main
with amber squares. Chart readings open by mouse, tap and keyboard and stay on screen
([UI-01](02-findings.md#ui-01), [UI-11](02-findings.md#ui-11)); list rows become cards on a phone and chart text is
11.5 px ([UI-02](02-findings.md#ui-02), [UI-03](02-findings.md#ui-03)) (part of f). Phase 1 keeps these
([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)). The rest of a, b, c and f
stays in Phase 2: Today / This week / Plan grouping and consequence ranking, severity, pasture and group filters with
an announced result, "Why this row?" panels, and "Show data" tables. These page facts were measured with Playwright
Chromium on main `0315d09` on 2026-10-20; real phones, screen readers, Firefox and WebKit were not tested.

### a. Top-priority action list

**Verified.** Worst-first ordering works at the severity level, and every row has a first step (`RULE-WF-09`). Within a
severity the order is "1. Budget: Fuel | 2. Budget: Repairs | 3. Gain: Heifers | 4. Grazing: Yearlings in Sand Hills
| 5. Health: Yearlings: Booster vaccine | 6. Water: Tank T6 (Cedar Draw)" ([UI-09](02-findings.md#ui-09)). The
consequence the registry gives: "A crew lead reading top-down sees the fuel bill before a tank nobody can see and an
overdue vaccination". Within water, "The top row of the report sends the crew to an empty pasture while the leaking
tank 45 heifers depend on is second" ([WAT-06](02-findings.md#wat-06)). The tiles mix status with exceptions
(`RULE-WF-18` evidence: "The tiles mix status ('Head on grass 375') with exceptions").

**Research.** Every alarm needs a defined response, and status indicators should not be alarms (`RULE-WF-09`, class B,
from HSE CHIS6 and exida by analogy). Priority comes from consequence and response time with about three levels
(`RULE-WF-10`, class B). Both rest on process-industry guidance and were "not validated in ranching".

**Recommendation (Phase 2).** Keep worst first, the first step on every row, and the suppression of duplicates. Group by
Today / This week / Plan; rank within a group by area priority, then by cattle present; move pure status ("Head on
grass", "Sensors normal") into a status line below the list (`RULE-WF-09` recommendation). Mark rows new or worse on
this device (step 2). Add "Why this level" (consequence and response window) to the rules table (`RULE-WF-10`).

### b. Filters by severity, pasture, herd group and area

**Verified.** Filters exist for area only (All, Water, Grazing, Gain, Health, Budget). "On both viewports every label
count equals the visible rows: All 10, Water 3, Grazing 1, Gain 2, Health 2, Budget 2" (`01-baseline.md`, section
4.4). After a chip is pressed, focus moves to the page body and the next Tab returns to "All (10)"
([UI-10](02-findings.md#ui-10)). The filter result is not announced (`RULE-WF-05`: "liveRegionTextChanged": false).
The empty-filter message reads "Nothing in all needs attention." ([UI-07](02-findings.md#ui-07)).

**Research.** `RULE-WF-05` (class A, WCAG 2.2 SC 4.1.3, Phase 2): announce the result ("Showing 3 of 10: Water") and keep
focus on the chip. No source in the evidence studies how useful pasture or group filters are to a ranch manager.

**Recommendation (Phase 2).**

- Keep the area chips; create them once and update `aria-pressed` and counts in place ([UI-10](02-findings.md#ui-10)
  proposed fix). The redesign already does this and Phase 1 keeps it
  ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)). Add a hidden
  `role="status"` line that announces the result (`RULE-WF-05`).
- Add severity filters that match the time windows (Today, This week, Plan), plus CAN'T TELL and data issues.
- Add **pasture** and **group** selectors whose options come from `pastures.csv` and `groups.csv`, never from row text or
  hard-coded names (the lesson of [LOAD-03](02-findings.md#load-03) and [UI-04](02-findings.md#ui-04)). A pasture
  filter shows the tanks in that pasture and the groups on it (P4 shows Tank T4 and the Heifers' rows).
- A filter must never hide that other rows exist: always show "Showing N of M". Remember the chosen filter only as a
  per-device convenience (`RULE-WF-15`).

**Assumption.** On a 10-row day, pasture and group filters add little to the screen view; their main value is grouping
the printed briefing by place, which `RULE-WF-17` asks for. Their value with real data was not tested.

### c. Alert explanations with the underlying readings and thresholds

**Verified.** See step 3 in section 1.3. In addition, "Chart details can only be opened with a mouse hover"
([UI-01](02-findings.md#ui-01)), so on a phone the readings behind a row cannot be seen at all.

**Research.** `RULE-WF-04` (class A): chart alternatives should state the decision-relevant state, for example "Tank T4,
Lone Tree: 10% now, dropped 46 points in 24 hours, below the 25% line". `RULE-WF-20` (class B): show each threshold's
basis. `RULE-WF-19` (class B): when a group row hides per-animal rows, give the count of slow individuals.

**Recommendation.** Phase 1: the Basis column (`RULE-WF-20`) and honest row wording ("as of <date>" for "here now"; both
weigh dates, [GAIN-11](02-findings.md#gain-11)). Phase 2: the "Why this row?" panel (wireframe 1.4b), built from the same
structured results the rules use, never from display text ([UI-04](02-findings.md#ui-04) is what happens otherwise). It
shows readings and their times, the threshold and basis, the computed change, who is on the pasture, coverage, and what
the page cannot tell (for example "no tank capacity on record").

### d. Visible data freshness and coverage

**Verified.** See step 1 in section 1.3. Coverage is never shown: "gainStatus Yearlings head=3 (groups.csv head=150) ||
serious | Yearlings | 1.50 lbs/day since 2026-07-20 vs 2.0 target" ([GAIN-07](02-findings.md#gain-07)). Old weigh-ins
are presented as current: with the Sep 15 rows removed, the page judges the "72-day-old" Jul 20 data with no age note
([GAIN-08](02-findings.md#gain-08)).

**Research.** `RULE-WF-14` (class C, Phase 1) asks the page to "state when the data is from (with a time zone) and how
old it is". Its only cited source was rejected by the checker ("the only cited source (exida) has nothing on data
timestamps or freshness"), so the rule rests on observation and design inference, not on a source.

**Recommendation.** Phase 1: zone in the as-of line, fictional badge, CAN'T TELL for stale weigh-ins
([GAIN-08](02-findings.md#gain-08) was moved to Phase 1 for this reason) and coverage beside every group gain
(`RULE-GAIN-10`). Phase 2: the per-area strip, the clock-age check with a demo flag ([LOAD-05](02-findings.md#load-05))
and the "sensor late" warning ([WAT-05](02-findings.md#wat-05)).

### e. "No issues detected" versus "insufficient information"

**Verified.** This is the largest workflow risk in the audit. Missing, unreadable or empty files read as "nothing needs
attention" ([LOAD-01](02-findings.md#load-01), high). A failed or slow load leaves a blank page with no message: "24 of
the 32 per-file failure scenarios end blank" ([LOAD-02](02-findings.md#load-02), high). A tank missing from the export
vanishes and "the page shows a confident all-clear on water" ([WAT-02](02-findings.md#wat-02), high). An open health task
with no due date is "never shown anywhere" ([HLTH-02](02-findings.md#hlth-02)). An empty budget file gives "SPEND VS
BUDGET −NaN% \$0 of \$0" ([UI-07](02-findings.md#ui-07), owned by [LOAD-01](02-findings.md#load-01)).

**Research.** `RULE-WAT-15` (class C, Phase 1): if no visual check is recorded, "the dashboard should not describe the
tank as 'OK', only as 'sensor normal'". Several research rules give the same instruction for their own inputs, for
example `RULE-GRZ-05` ("missing observations show 'recovery not checked', never 'OK'") and `RULE-CTX-02` ("Never read a
missing or failed fetch as 'no drought'").

**Recommendation (Phase 1, already in the plan).** Three states everywhere: **OK**, **needs attention**, and **CAN'T
TELL** (missing, stale, invalid or insufficient data), each drawn with its own shape and word (`RULE-WF-01` phase note).
The empty-state sentence appears only when an area's data loaded and was judged, and it says what was judged, for
example "Nothing needs attention in Water: all 8 tanks reported in the last 24 hours." A CAN'T TELL area says why and
what to do, for example "Water: can't tell. water.csv could not be loaded (404). Check tanks by eye." A CAN'T TELL row
also needs a first step (`RULE-WF-09` phase note: "CAN'T TELL rows also need a first step (for example 'check the tank by
eye')"). The morning view always prints the CAN'T TELL and data-issue counts, even when they are 0 (wireframe 1.4a).

### f. Chart details on phones and keyboard

**Verified.** "tap gain: target=3.9x3.9px tipVisible=false" and "keyboard tooltips: {"tabStopsInsideCharts":0,
"tooltipShownOnAnyFocus":false}" ([UI-01](02-findings.md#ui-01)). `RULE-WF-02` counted 232 chart elements with pointer
listeners and "focusableAmongThem": 0. On a phone the exception table hides the "Problem" and "First step" columns
("exceptions: scrolls=true cut=[Problem,First step]", [UI-02](02-findings.md#ui-02)) and chart text renders at about 7
px ([UI-03](02-findings.md#ui-03)). Tooltips near the right or bottom edge open off-screen
([UI-11](02-findings.md#ui-11)). The README says the page "works on a phone"; [UI-01](02-findings.md#ui-01) says "the
README's phone claim does not hold".

**Research.** `RULE-WF-02` (class A, SC 2.1.1): every hover-only detail must also be reachable by keyboard and touch.
`RULE-WF-03` (class A, SC 1.4.13): the tooltip must be dismissible and hoverable, "or it must be replaced by
click-to-pin details"; the checker notes the Escape failure holds only if the tooltip is shown to cover chart data.
`RULE-WF-04` (class A, SC 1.1.1): each chart needs a text alternative and a data table. `RULE-WF-08` (class B, SC
1.4.11): past grazing stays (1.38:1) and the over-plan segment against the current stay (1.25:1) are below 3:1.

Already on the page since the redesign and kept in Phase 1
([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)): details show and stay on tap
and close on a tap elsewhere ([UI-01](02-findings.md#ui-01)); readings stay inside the window
([UI-11](02-findings.md#ui-11)); charts are drawn at their container width ([UI-03](02-findings.md#ui-03)); exception
rows become stacked cards at 760 px wide or less ([UI-02](02-findings.md#ui-02)).

**Recommendation (Phase 2).** Put a `<details><summary>Show data</summary>` table under each chart: per tank the last 8
readings, per group the stays, per animal tag, weight and gain, slow animals first (`RULE-WF-02` recommendation: "This
one change also satisfies 1.1.1 and gives the crew briefing its source tables"). Give past stays and the over-plan
segment an outline or label as well as hue (`RULE-WF-08`).

### g. Printable or exportable crew briefing

**Verified, research and recommendation:** see step 4 in section 1.3 and wireframe 1.4c. Two additions:

- **Export.** The "Show data" tables and the briefing are the export for Phase 2: the page prints, and the data stays in
  the CSV files the page already reads. An iCalendar export of health tasks for crew phones is listed as an optional,
  deferred integration ("Optional low-cost way to put the schedule on crew phones; not needed now", integration entry
  "iCalendar RFC 5545 VTODO export").
- **Language.** `RULE-WF-17` recommends an "Optional Spanish column or second page"; the translation advice comes from
  Skellie (Cornell 2019), not from Stup (`RULE-WF-17` evidence correction). A crew roster with language preference is a
  later data field (`crew_roster.csv` in `data-fields.json`).

### h. Optional acknowledgement, assignment, notes and resolution history

**Verified.** Nothing exists today: "the table headers are Severity|Area|What|Problem|First step (hasOwnerColumn false,
hasStatusOrAckColumn false)" (`RULE-WF-11` evidence), and "the page writes nothing to storage today ("writes": [],
"localStorageKeys": [])" (`RULE-WF-15` evidence).

**Research.** `RULE-WF-11` (class B, Phase 2): "acknowledging an exception never clears it" (section 1.7).
`RULE-WF-15` (class B, Phase 2): shared acknowledgements, notes and owners "cannot live only in localStorage"
(section 1.6). `RULE-WF-12` (class C, Defer): shelving needs a reason, a person and an expiry, and the shelved count
stays visible. `RULE-WF-13` (class C, Defer): "Open for" needs first-seen history. `RULE-WF-16` (class C, Defer):
shared logs are operational records, append-only and kept at least two years by analogy to BQA record keeping.

**Recommendation.**

- *Phase 2, optional.* A per-device **"Mark seen (this device only)"** button and a short **note (this device only)** on
  each row. Both are labelled on screen as saved on this device only and not shared. The row keeps its severity, its
  place in the list and its count. If the row's severity rises, the mark is dropped (a design inference in
  `RULE-WF-11`). A note can be printed on the crew briefing, which is the honest way to hand it to the crew without a
  shared store.
- *Phase 2.* A "Resolved since your last review (this device)" strip that lists, once, rows that were on the list at the
  last review on this device and are now gone (`RULE-WF-11` names this state).
- *Deferred.* Shared assignment (owner, due by), shared acknowledgement, first-seen history, "open for" ages, shelving
  and resolution history. They need a shared store (section 1.6). Until then, assignment happens on paper (the "Who"
  column) or by word.

## 1.6 What a static site can remember

The dashboard is a set of static files served by GitHub Pages: "No dependencies, no build step, no backend"
(`01-baseline.md`, section 2). In plain terms:

- **The page can read files, but it cannot save anything back to them.** There is no server and no shared database. The
  page reads `data/*.csv` from the repository on every load.
- **Browser storage (localStorage) belongs to one browser on one device.** MDN says localStorage is specific to the
  page's origin and protocol, persists across sessions, is cleared when the last private tab closes, and can throw an
  error when storage is blocked. MDN's storage-quota page adds that storage is best-effort by default and can be evicted
  under storage pressure, and that Safari deletes script-created data after seven days of browser use with no
  interaction when tracking prevention is on. WHATWG says user agents "may ... automatically delete stored data after a
  period of time" (`RULE-WF-15` sources). None of the sources mentions cross-device sync, and the research labels the
  one-device conclusion as its own inference: "that localStorage is tied to one browser profile on one device is my
  inference from per-origin, per-user-agent storage" (`RULE-WF-15` evidence).
- **So localStorage is not a crew record.** A mark made on the office computer is not on the foreman's phone, can
  vanish when the browser is cleared, and leaves no trace anyone else can audit. Nothing in this document proposes
  synchronising it.
- **Use it only for conveniences**: the chosen filter, the last review time, the per-device "seen" marks and note
  drafts, each labelled "this device only" (`RULE-WF-15`; integration "Browser localStorage (Web Storage)", Phase 2).
  Every storage call is wrapped in try/catch, and the page renders fully with an empty store: "If storage throws or
  comes back empty, the page must still render every exception as unacknowledged. It must never hide rows because of
  missing local state." `navigator.storage.persist()` is not needed: it "does not share data" (integration "Storage API
  persistence", excluded).

**Shared records need one of two things, both deferred:**

| Option | How it works | Limits (from the integration entries) | Status |
|---|---|---|---|
| A shared-file workflow: a committed, append-only `data/acknowledgements.csv` | A person edits the file and commits it (or opens a pull request); the page reads it like the other CSVs after the Pages deploy. | "On each commit and Pages deploy (minutes)". "it has no write path for live crew use". If missing or unreadable, "show all rows unacknowledged and a 'acknowledgement log unavailable' note". In the public demo, entries must be clearly fictional. | Defer |
| A backend or hosted shared store | A server or service the page writes to. | Adds a service to run and secure, against the project's constraint of no backend unless a demonstrated requirement justifies one. A published Google Sheet is listed "Only for a real deployment, published to the organisation rather than the public web. Not for the public demo", and Google warns "Be careful when publishing private or sensitive info." | Defer |

## 1.7 Acknowledging never makes a condition healthy

**Research.** `RULE-WF-11` (class B, Phase 2): "acknowledging an exception never clears it. Acknowledge records who,
when, a note and the planned action. The row stays on the list, marked Acknowledged, until the data shows a return to
normal. A condition that clears and later recurs is a new event that needs a new acknowledgement." The decision it
protects: "Stops 'I saw it' being mistaken for 'it is fixed' (e.g. tank T4 acknowledged at 7 am but still leaking at
noon)."

Sources and their limits, as the registry states them:

- **Ignition 8.1 manual (vendor documentation, verification "partly").** It treats Active/Cleared and
  Acknowledged/Unacknowledged as separate conditions, giving four states, and says alarm events "never transition from
  Cleared to Active"; a recurrence creates a new event. `RULE-WF-11` adds: "This is my reading of the fetched summary;
  the page does not literally say 'ack does not clear'."
- **UK HSE CHIS6 (agency, verified).** Acknowledging is distinct from acting, and "rapid acknowledgement and routine
  silencing" are nuisance-alarm warning signs.
- **Limit.** "The ISA-18.2 normative state diagram itself was not fetched (the standard is paywalled ...)". The state
  model rests on vendor and consultancy documentation and on analogy from process control.

**Recommendation.** Use these states. The condition is always recomputed from the data on every load; the mark never
feeds back into the rules.

| State | Meaning | Phase |
|---|---|---|
| New | Condition active; not marked on this device | 2 |
| Seen (this device only) | Condition still active; marked on this device; still counted and ranked as before | 2 |
| Resolved since your last review (this device) | Condition no longer in the data; listed once | 2 |
| Acknowledged with owner and note (shared) | Needs a shared store | Defer |
| Shelved with reason, person and expiry | Needs shared, accountable records (`RULE-WF-12`); critical water rows should not be shelvable | Defer |

Without a stable row ID a mark cannot be matched to the next day's row, "so the row must be shown as new and
unacknowledged, never hidden" (`RULE-WF-11` missing-data rule).

## 1.8 Part 1 by phase

| Item | Phase | Finding IDs (effort from the registry) | Rule IDs |
|---|---|---|---|
| Three states (OK, needs attention, CAN'T TELL) and visible data-issue rows | 1 | [LOAD-01](02-findings.md#load-01) (M), [WAT-02](02-findings.md#wat-02) (M), [GAIN-07](02-findings.md#gain-07) (S), [GAIN-08](02-findings.md#gain-08) (S), [HLTH-02](02-findings.md#hlth-02) (S) | `RULE-WAT-15`, `RULE-GAIN-10` |
| Loading state, per-file errors, sections isolated | 1 | [LOAD-02](02-findings.md#load-02) (M), [LOAD-03](02-findings.md#load-03) (S), [LOAD-04](02-findings.md#load-04) (S) | |
| As-of with ranch time zone; fictional snapshot badge | 1 | [TIME-02](02-findings.md#time-02) (M) | `RULE-WF-14`, `RULE-WF-21` |
| Honest copy: Basis column, "as of <date>", "Sensors normal", observation wording, structured tile counts, cows not judged | 1 | [UI-04](02-findings.md#ui-04) (S), [GAIN-11](02-findings.md#gain-11) (S), [GAIN-13](02-findings.md#gain-13) (S), [UI-06](02-findings.md#ui-06) (S), [UI-07](02-findings.md#ui-07) (S) | `RULE-WF-20`, `RULE-WAT-15`, `RULE-HLTH-11` |
| Safe rendering of CSV text | 1 | [SEC-01](02-findings.md#sec-01) (S) | |
| Morning review layout: counts, Today / This week / Plan, new or worse on this device | 2 (a summary card with counts by severity: on the page since the redesign, kept from 1) | | `RULE-WF-18`, `RULE-WF-13` (device part), `RULE-WF-15` |
| Consequence-aware ranking within a severity | 2 | [UI-09](02-findings.md#ui-09) (S), [WAT-09](02-findings.md#wat-09) (S), [WAT-06](02-findings.md#wat-06) (Phase 2 part) | `RULE-WF-10`, `RULE-BUD-14`, `RULE-WAT-05`, `RULE-WAT-07` |
| Filters (severity, pasture, group, area) with announced results | 2 (area chips that keep focus, [UI-10](02-findings.md#ui-10): on the page since the redesign, kept from 1) | [UI-10](02-findings.md#ui-10) (S) | `RULE-WF-05`, `RULE-WF-06` |
| "Why this row?" explanations | 2 (the gain chart's flagged-animal readings and 50% / 80% lines, [UI-16](02-findings.md#ui-16): on the page since the redesign, kept from 1) | [GRZ-08](02-findings.md#grz-08) (M), [UI-16](02-findings.md#ui-16) (S), [GAIN-09](02-findings.md#gain-09) (S), [UI-13](02-findings.md#ui-13) (S) | `RULE-WF-04`, `RULE-WF-19` |
| Freshness and coverage strip; sensor-late warning | 2 | [LOAD-05](02-findings.md#load-05) (S), [WAT-05](02-findings.md#wat-05) (S) | `RULE-WF-14` (strip part) |
| Keyboard and touch chart details; phone tables | On the page since the redesign and kept from 1 ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)); 2 for "Show data" tables, chart text alternatives, a reading the mouse can move onto, short dates and the budget scale cap (the rest of P2-05 and P2-06) | [UI-01](02-findings.md#ui-01) (M), [UI-02](02-findings.md#ui-02) (M), [UI-03](02-findings.md#ui-03) (M), [UI-11](02-findings.md#ui-11) (S) | `RULE-WF-02`, `RULE-WF-03`, `RULE-WF-04`, `RULE-WF-08` |
| Printable crew briefing | 2 | none (no finding; effort not estimated in the registry) | `RULE-WF-17`, `RULE-WAT-15` |
| Optional per-device mark and notes; "resolved since last review" strip | 2 | none (no finding) | `RULE-WF-11`, `RULE-WF-15` |
| Shared acknowledgement, owners, first-seen history, shelving, resolution history | Defer | none | `RULE-WF-12`, `RULE-WF-13`, `RULE-WF-16` |

"On the page since the redesign" means pull request #2 (main `0315d09`, 2026-10-20) already does that part; Phase 1
keeps it ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)), and only the rest is
Phase 2 work ([05-roadmap.md section 4](05-roadmap.md#4-phase-2-build-next)). The redesign also already shows a
loading message and draws each section inside its own guard; the Phase 1 loading row adds the per-file messages. See
the note in [section 1.5](#15-evaluation-of-each-element-the-owner-listed).

One Phase 2 grazing item also touches the morning list. The rest check ([GRZ-04](02-findings.md#grz-04)) must ship
together with the generator fix ([GRZ-05](02-findings.md#grz-05)), because in the example season "11 of 13 sequential
re-entries are short of the file's own minimum rest" and the check would otherwise flood the list with alerts the
generator did not plant.

---

# Part 2. Additional features

## 2.1 How the candidates were scored

The owner listed seven candidates. Rainfall and drought context and heat context are scored separately below, because
the evidence and the recommendation differ between them, which gives eight rows.

Each candidate is scored on six criteria. The scores are this document's judgement, drawn from the evidence quoted in
section 2.3; they are recommendations, not measurements.

| Criterion | What it asks | Scale |
|---|---|---|
| Decision value | Does it change what the manager or crew does, and how often? | High / Medium / Low |
| Evidence quality | How well do the sources support the rule and its inputs (class, verification, independence)? | Strong / Moderate / Weak |
| Input availability | Are the inputs in the repository or easy to get without live integrations? | Yes / Partly / No |
| Maintenance burden | How much ongoing record-keeping or refreshing does it need? | Low / Medium / High (lower is better) |
| Implementation effort | Registry effort where a finding exists, otherwise this document's estimate | S / M / L |
| Risk of misleading | How easily could it show a false all-clear or a false precision? | Low / Medium / High (lower is better) |

## 2.2 Scores

| # | Candidate | Decision value | Evidence quality | Inputs available | Maintenance burden | Effort | Risk of misleading | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | Water storage capacity and estimated supply coverage | High | Moderate | Partly | Low | M (registry, [WAT-06](02-findings.md#wat-06)) | Medium | **Recommend, rank 1** |
| 2 | Pasture recovery and forage observations | High | Moderate | No | Medium | M (estimate) | Low to medium | **Recommend, rank 2** |
| 3 | Rainfall and drought context (dated snapshot) | Medium | Strong for timing; Weak for thresholds | Partly | Medium | M (estimate) | Medium | **Recommend, rank 3** |
| 4 | Heat (and cold) stress context | Medium in season; none at the Sep 30 as-of | Weak for pasture cattle | No | Medium to high | M (estimate) | High | Defer |
| 5 | Fence and equipment maintenance | Medium | Weak | No | High | M (estimate; L with shared status) | Medium | Defer |
| 6 | Calving and breeding tasks | High in season; none at the Sep 30 as-of | Moderate for records; Weak for schedules | No | Medium to high | L (estimate) | High | Defer |
| 7 | Feed and mineral inventory | Medium | Weak | No | High | S to M (estimate) | High | Defer |
| 8 | Crew task tracking | High for a real crew; Low in a demo | Weak | No | High | L (estimate) | High | Defer |

## 2.3 Evidence behind each score

### 1. Water storage capacity and estimated supply coverage

- **Decision value: High.** It answers "Who goes, and how soon: haul water, fix the float, or move cattle" (`RULE-WAT-06`).
  The verified gap is [WAT-06](02-findings.md#wat-06) (medium, design limitation, Phase 3): severity uses level percent
  alone, so "an empty-pasture tank outranks a leaking tank 45 heifers drink from". The water research observed that
  "T7, the tank serving the 180 pairs, reads 61.3% and raises nothing. At the 90F intake rate that is about 3.0-3.7 h of
  water if it were a 1,000-gal float tank with no inflow, and 30-37 h if it were 10,000-gal storage. Capacity is an
  assumption; the repo has no capacity field."
- **Evidence quality: Moderate.** `RULE-WAT-06` is "Class C with B inputs": only the intake by class and temperature is
  sourced (NDSU AS1763; UNL G2060; K-State MF3303). The critic re-read AS1763 on 2026-10-16: lactating 900 lb cows drink
  "11.4 / 12.6 / 14.5 / 16.9 / 17.9 / 16.2 gal/head/day at 40-90F" (`registry-changelog.md`). The formula and the alert
  threshold are unsourced design or ranch choices. "The tables are old (1956 data underlie NRC)", and the lactating row
  is not monotonic. `RULE-WAT-09` (class B, Phase 3) adds storage days for windmill or solar supply: NRCS CPS 614 says
  "consider supplying additional daily water storage volume (3–5 days)" ("consider", not "shall"); the 3-day figure is
  "a ranch-set target".
- **Inputs: Partly.** Head and class per pasture can be derived from `groups.csv` and `moves.csv` today. Capacity,
  usable fraction and supply type are one-time ranch records that the repository lacks ("water.csv carries level_pct
  only, so gallons on hand = level_pct x capacity is NOT computable from repo data", `RULE-WAT-06` evidence). The
  Phase 1 `tanks.csv` master list ([WAT-02](02-findings.md#wat-02)) is the natural home for them.
- **Maintenance: Low.** Capacities change only when tanks change.
- **Risk of misleading: Medium.** An estimate in gallons or hours looks more precise than it is. The rule's own guards:
  "Do not compute or show hours-of-water when capacity or head is missing. Show 'capacity unknown'"; "Never compute days
  from % alone"; with no temperature, use the highest value in the class's row "and label it an assumed hot-day figure
  (for lactating cows in AS1763 that is the 80F value, 17.9 gal, not the 90F value)".

### 2. Pasture recovery and forage observations

- **Decision value: High.** Every grazing judgement today is elapsed days against a per-pasture plan (grazing research).
  A residual reading supports "Move now, or not yet. This replaces elapsed days as the main move trigger"
  (`RULE-GRZ-06`, class B, Phase 3). `RULE-GRZ-05` (class C, Phase 3) supports "Whether a pasture is ready to graze
  again and whether planned graze days held".
- **Evidence quality: Moderate.** The protocol is well sourced: NDSU R1780 (verified) says to measure before turnout,
  during grazing and "within three days of livestock removal", with "a minimum of 30 measurements for each key species";
  SDSU MC-04340 says "Short, consistent checks outperform occasional, detailed assessments"; Interagency TR 1734-3 says
  residual measurement "may be preferable" to utilization. Targets are site-, species- and season-specific, and the
  sources disagree on use ceilings ("SD TN9 caps seasonal use at 50% and temporal use at 30%, while NDSU R1780 suggests
  about 50% per grazing period", `RULE-GRZ-06` correction). The check interval is a ranch choice (C).
- **Inputs: No.** "the repo has no stubble, residual or forage observation field at all" (`RULE-GRZ-06`). It needs a
  manual `forage_obs.csv` (`data-fields.json`). Public products do not replace it: Grass-Cast uses 10 km cells and
  "cannot tell the difference between desirable forage species and undesirable species", and RAP gives no current-year
  data through its API (`RULE-GRZ-05` evidence).
- **Maintenance: Medium.** A reading at each move-out and before each re-entry. "Adds a data-entry burden" and "observer
  variation is real" (`RULE-GRZ-05` limitations).
- **Risk of misleading: Low to medium,** provided a missing observation reads "recovery not checked", never "ready" or
  "OK" (`RULE-GRZ-05` phase note), and fewer readings than the ranch's minimum are shown as low confidence and never
  escalated to serious (`RULE-GRZ-06`).
- **Context for credibility.** The grazing research warns that "rotation should not be presented as inherently better"
  (Briske et al. 2008; CARM, Augustine et al. 2020; UNL EC127), and concludes: "The dashboard's value is
  record-keeping, plan adherence and observation-driven triggers, not a claim that rotation itself improves outcomes."

### 3. Rainfall and drought context, as a dated snapshot

- **Decision value: Medium.** It feeds the drought-plan review: "Whether to start the drought contingency steps
  (destock, buy feed, defer pastures) on schedule" (`RULE-CTX-10`, class C, Phase 3). It is context, not an exception:
  "These prompts feed the plan review; they do not create move exceptions."
- **Evidence quality: Strong for timing, Weak for thresholds.** `RULE-CTX-01` (class A, Phase 3) is confirmed by the
  checker: the U.S. Drought Monitor's data cutoff is Tuesday and maps are "released each Thursday at 8:30 a.m. Eastern
  Time". The NDMC ranch drought plan recommends "Setting dates on the calendar when specific conditions warrant action"
  but "gives no numeric thresholds", so triggers are ranch choices (C).
- **Inputs: Partly.** USDM county statistics are free, with "no API key mentioned", but browser CORS is unverified, so
  the integration entry recommends a build-time fetch that commits a dated CSV with provenance. A ranch rain gauge (an
  optional, later part of this addition) is a manual record. The fictional ranch has no location: the context diagnostic printed "ABSENT ranch location (lat/lon,
  county FIPS, or state)" (`RULE-CTX-15` evidence), so a real county must be named as a labelled stand-in.
- **Maintenance: Medium.** A weekly snapshot, refreshed by a separate manual or scheduled workflow, never by the test
  workflow (`RULE-CTX-15`).
- **Risk of misleading: Medium.** Observed: a naive lookup "picks MapDate 20260929 (D0 31.55%), which was released
  2026-10-01 08:30 ET, after as_of", while the release-aware lookup picks the 2026-09-22 map (`RULE-CTX-01`). Live data
  would not match the fictional as-of ("live USDM valid 2026-10-13 versus ranch as_of 2026-09-30", context research). A
  real county beside a fictional ranch must not imply a real ranch (`RULE-CTX-15`). FSA eligibility must never be
  computed (`RULE-CTX-03`).

### 4. Heat (and cold) stress context

- **Decision value: Medium in season.** Rescheduling cattle work and checking water on hot days (`RULE-CTX-07`, class C,
  Defer). At the Sep 30 as-of the panel would be suppressed ("Off-season (as_of Sept 30), suppress the panel instead of
  showing an empty one"). Cold stress (CCI) is tied to calving season, "Out of season at as_of 2026-09-30"
  (`RULE-CTX-09`, class B, Defer).
- **Evidence quality: Weak for pasture cattle.** The USDA-ARS maps estimate breathing rate for "cattle in a feedlot";
  "applying them to pasture cattle is extrapolation", and the page says they "cannot predict individual animal stress
  levels". "Whether the ARS maps are still published in 2026 is UNVERIFIED." The BQA handling rule of thumb (work cattle
  before THI reaches 84) comes from a manual the critic calls "likely superseded". NWS HeatRisk is a human index and is
  excluded (`RULE-CTX-08`, class A).
- **Inputs: No.** A dated forecast snapshot and a location. Live weather integration is deferred.
- **Risk of misleading: High.** A feedlot model shown as a pasture warning, or "Normal" shown by default when no
  forecast exists ("Do not show 'Normal' by default").

### 5. Fence and equipment maintenance

- **Decision value: Medium.** "Who does what this week; preventing water and fence failures" (`RULE-CTX-13`, class C,
  Defer).
- **Evidence quality: Weak.** "No extension or peer-reviewed source on maintenance intervals or crew tracking was
  gathered (search budget exhausted)." One sourced interval exists: NDSU's weekly waterer disinfection. Sensor battery
  and status thresholds come only from vendor help pages.
- **Inputs: No.** A new `maintenance.csv` (asset, task, interval or next due, status, assignee).
- **Maintenance: High.** Useful only if status and assignee are kept current, which needs shared records (section 1.6).
- **Risk of misleading: Medium.** "No next_due and no interval: list the item without an overdue judgement" is the
  rule's own guard.

### 6. Calving and breeding tasks

- **Decision value: High in season** for a cow-calf herd: "Scheduling preg checks, BCS checks and calving-season
  staffing" (`RULE-CTX-12`, class C, Defer). It is also "how cows, which the gain rules skip, would be monitored"
  (the cows are not judged today, [GAIN-13](02-findings.md#gain-13)). None of it applies at the Sep 30 as-of.
- **Evidence quality: Moderate for records, Weak for schedules.** BIF guidelines (verified) say pregnancy status "should
  be recorded on each breeding female that was exposed to a bull" and BCS "60-90 days pre-calving, at calving and at
  weaning". The checker found that the preg-check timing is a derivation and the pre-calving prompt "needs an unsourced
  gestation length"; scheduling is "a ranch and veterinarian choice".
- **Inputs: No.** Breeding dates, preg-check results and BCS records.
- **Risk of misleading: High.** It sits next to animal health, where the dashboard must stay on scheduling, records and
  escalation to a veterinarian (`RULE-HLTH-11`; `RULE-HLTH-09` and `RULE-HLTH-10`, both deferred).

### 7. Feed and mineral inventory

- **Decision value: Medium.** "When to reorder hay, supplement or mineral; drought feed planning" (`RULE-CTX-11`, class C,
  Defer).
- **Evidence quality: Weak.** One "partly" source (the NDMC drought plan, on feed flexibility and an inventory
  worksheet). "I found no extension intake rate for mineral in this pass: web search budget was exhausted."
- **Inputs: No.** Counts, count dates, and a daily use rate that must be "measured from ranch records".
- **Effort: S to M.** "Low build cost; credible only if the use rate is measured, not assumed."
- **Risk of misleading: High.** Days on hand from an assumed use rate looks exact and is not; counts go stale.

### 8. Crew task tracking

- **Decision value: High for a real crew, Low in a public demo.** Who is doing what, linked to the exception that created
  it (`crew_task.csv` in `data-fields.json`; `RULE-CTX-13`).
- **Evidence quality: Weak.** "Northern Plains-specific sources on crew briefing or work orders were not found (SDSU
  covers records and EID only). The SOP guidance is dairy-oriented (Penn State and Cornell)" (workflow research caveats).
  The checker removed the only evidence URL for `crew_task` ("the NDMC 'Plan for Drought' page does not support a
  crew_task field").
- **Inputs: No.** It needs a shared write path, which a static site does not have (section 1.6).
- **Risk of misleading: High.** A task list kept in one browser looks like a crew record and is not. The printed briefing
  (Phase 2) covers the morning hand-off without that risk.

## 2.4 Recommendation: three additions, ranked

The evidence supports the lead's three defaults. It does not contradict them, so no other candidate replaces one. Each
addition keeps the static architecture: new CSV files read like the existing ones, and any public data is fetched at
build time and committed as a dated snapshot.

### Rank 1: Water supply coverage from tank capacity and head count

**Why first.** It closes a verified design limitation in the most time-critical area ([WAT-06](02-findings.md#wat-06)).
Its new inputs are one-time records, and it reuses the head and pasture data the page already has. It builds on two
earlier steps: the Phase 1 tanks master list ([WAT-02](02-findings.md#wat-02)) and the Phase 2 ranking with cattle
present (the Phase 2 part of [WAT-06](02-findings.md#wat-06), and `RULE-WAT-05`).

**What to build.**

- Add `capacity_gal`, a usable fraction and `supply_type` to `tanks.csv` (later fields in `data-fields.json`), with
  fictional values from the generator, clearly labelled.
- In the "Why this row?" panel and the tank chart heading, show estimated hours or days of water for the head present,
  with the assumptions beside it: capacity, head, class, the intake column used, and whether inflow is counted
  (`RULE-WAT-06` recommendation: "Show the assumptions (capacity, head, temperature, intake column) beside each
  estimate").
- Show storage days for windmill or solar tanks as a planning tile, not a real-time alarm (`RULE-WAT-09`
  recommendation), with the 3-day figure marked as a ranch-set target.
- For a silent tank, show "last seen X h ago at Y% (about Z h of water then)" (`RULE-WAT-07` recommendation, which
  says to implement it "after capacity and head fields exist"). This extends the Phase 2 sensor-late warning
  ([WAT-05](02-findings.md#wat-05)).
- When capacity or head is missing, show "capacity unknown" and keep the labelled % rules.

**Recommendation on severity.** `RULE-WAT-06` recommends adopting the estimate "as the primary water severity driver
once capacity and head are recorded". This document recommends a more careful order: show the estimate first as an
explanation and as a ranking key within a severity, and let it change severities only after the ranch has entered real
capacities and compared the estimates with its own tanks. Any planted problem the new rule creates in the fictional data
is listed in `PLANTED` and the README, as [GRZ-05](02-findings.md#grz-05) proposes for rest.

**IDs.** [WAT-06](02-findings.md#wat-06), [WAT-02](02-findings.md#wat-02), [WAT-05](02-findings.md#wat-05);
`RULE-WAT-06`, `RULE-WAT-09`, `RULE-WAT-05`, `RULE-WAT-07`.

### Rank 2: Forage observations at moves

**Why second.** It turns the grazing area from "days elapsed" into an observation-backed decision, and it is "the
cheapest, most credible forage signal for a portfolio dashboard" (`RULE-GRZ-05` recommendation). It ranks below water
because it adds a recurring data-entry burden and does not close a registered finding on its own.

**What to build.**

- A manual `forage_obs.csv`: date, pasture, observer, residual height or utilization with its method, number of
  readings, recovery ready (yes / no / unsure), optional photo point (`data-fields.json`).
- Per-pasture `key_species` and `target_stubble_in`, set by the ranch and labelled with their source (SD TN9 or NDSU
  R1780, cited with date), as context-dependent defaults (B).
- A warning when an occupied pasture has no forage check within a ranch-set number of days (`RULE-GRZ-05`; the demo's
  7 days is "a placeholder"), and "recovery not checked" before a planned move-in with no observation.
- Residual readings as the main move signal, with the day-count rule kept as a secondary "past planned date" reason
  (`RULE-GRZ-06` recommendation). It works alongside the Phase 2 rest check ([GRZ-04](02-findings.md#grz-04),
  `RULE-GRZ-03`).

**IDs.** [GRZ-04](02-findings.md#grz-04), [GRZ-05](02-findings.md#grz-05), [GRZ-08](02-findings.md#grz-08);
`RULE-GRZ-05`, `RULE-GRZ-06`, `RULE-GRZ-03`; integration "NDSU Grazing Monitoring Stick protocol (R1780)" (Phase 3).

### Rank 3: Drought and precipitation context as a dated snapshot

**Why third.** It is context for the drought-plan review, not a daily action, so its decision value per day is lowest.
It also carries the most risk of making a fictional example look real. It is worth adding because it is the context a
Northern and Central Plains reviewer expects, and the sources that make it safe to show are strong.

**What to build, and its limits.**

- A separate manual or scheduled `refresh-context` workflow (never the test workflow) writes `data/context.csv` with
  value, unit, area, valid date, release time, retrieval time, source URL and attribution (context research).
- USDM county category mix for a named, labelled stand-in county, chosen by **release time on or before the as-of**,
  labelled "valid <Tue>, released <Thu>" (`RULE-CTX-01`). Show its age; mark it stale past a configurable limit with a
  holiday allowance (`RULE-CTX-02`).
- Weeks at D2 or worse as information only, with a link to FSA, never an eligibility claim (`RULE-CTX-03`).
- Optional, and later than the snapshot itself: a ranch rain gauge record and drought-plan trigger dates that create a
  "review the grazing plan" prompt, never a move exception (`RULE-CTX-10`). They are not needed for the dated snapshot
  and are not a fourth addition; addition 3 is complete without them. Gauge gaps block a percent-of-normal figure ("do
  not treat missing days as zero rain"). A public precipitation normal (PRISM) only if its terms fit, with the
  retrieval time stored, because daily values are "updated 'eight times before becoming stable'".
- Pinned to the fictional as-of and labelled "Public data: <County>, <State>; ranch data fictional" (`RULE-CTX-15`).
  No SD Mesonet data is committed or redistributed: its request page says "Redistribution of these data is not
  allowed" (`RULE-CTX-16`).
- A missing, failed or stale fetch shows "unavailable" with the last valid date, never "no drought".

**IDs.** `RULE-CTX-01`, `RULE-CTX-02`, `RULE-CTX-03`, `RULE-CTX-10`, `RULE-CTX-15`, `RULE-CTX-16`; integrations "U.S.
Drought Monitor data services (REST statistics)" (Phase 3), "Iowa Environmental Mesonet JSON services" (Phase 3,
optional fallback), "PRISM gridded climate web service" (Phase 3, optional; check terms), "USDA FSA Livestock Forage
Disaster Program" (Phase 3, link only).

## 2.5 Deferred or excluded, and why

| Item | Decision | Reason (from the registries) | IDs |
|---|---|---|---|
| Heat-stress days and handling-day warnings | Defer | The ARS model is for feedlot cattle, its 2026 status is unverified, the trigger is a ranch choice, and it needs a forecast snapshot; out of season at the as-of. | `RULE-CTX-07` |
| NWS HeatRisk | Exclude | "HeatRisk is a human heat-health index." | `RULE-CTX-08` |
| Cold-stress (CCI) outlook | Defer | Tied to a calving calendar; "Out of season at as_of 2026-09-30"; NDAWN offers no download or API. | `RULE-CTX-09` |
| NASS pasture condition, Grass-Cast outlook | Defer | Regional and seasonal context; NASS needs an API key; Grass-Cast "should not be the sole basis for stocking or turnout decisions" and is not one of the three Phase 3 items. | `RULE-CTX-04`, `RULE-CTX-05` |
| RAP production history; NRCS soils and ecological sites | Defer | Need real pasture polygons; "for this fictional demo it would imply a real place". | `RULE-CTX-06`, `RULE-CTX-14` |
| Forage-demand planned days (AU-days) | Defer | "Needs forage production and harvest-efficiency inputs the demo lacks." | `RULE-GRZ-07`; [GRZ-09](02-findings.md#grz-09) |
| Leak and stuck-float screen from expected consumption | Defer | "Needs the phase-3 demand estimate and validation on real tank data"; no validation study was found. | `RULE-WAT-08` |
| Sensor trust band and calibration record | Defer | "Vendor-only evidence"; "I found no independent accuracy trial for livestock tank sensors." | `RULE-WAT-14` |
| Fence, water-system and equipment maintenance log | Defer | Weak evidence; needs shared, current records. | `RULE-CTX-13` |
| Crew task tracking with shared records | Defer | No shared write path on a static site; no ranch-specific source; the printed briefing covers the morning hand-off. | `RULE-CTX-13`, `RULE-WF-16` |
| Shared acknowledgement, owners, shelving, first-seen history | Defer | Need a shared store (section 1.6). | `RULE-WF-12`, `RULE-WF-13`, `RULE-WF-16` |
| Feed and mineral inventory | Defer | Weak evidence; use rate must be measured; counts go stale. | `RULE-CTX-11` |
| Calving, breeding and body-condition module | Defer | Scheduling is a ranch and veterinarian choice; needs new records; out of season. | `RULE-CTX-12`, `RULE-HLTH-09`, `RULE-HLTH-10` |
| Health completion records, observation logs, withdrawal dates | Defer | Shared records are deferred; dose and route "are never shown as instructions". | `RULE-HLTH-05`, `RULE-HLTH-06`, `RULE-HLTH-08` |
| Full weigh-condition records and a shrink policy | Defer | A data-model change; "an ordinary few-percent difference is larger than the serious rule's margin". Note: `rules.json` places a minimal `weight_basis` per weigh session in Phase 1 (`RULE-GAIN-06`, class C); only the fuller records stay deferred. | [GAIN-10](02-findings.md#gain-10) |
| Live integrations (NWS API, vendor tank feeds, scale indicators) | Defer | "live integrations are deferred"; vendor claims are "Vendor specification only". | integrations "NWS API (api.weather.gov)", "Ranchbot / Farmbot remote tank monitors (vendor)", "Chute scale indicator with EID reader" |
| SD Mesonet data in the repository | Exclude (link only) | "Redistribution of these data is not allowed." | `RULE-CTX-16` |
| Walk-over scales; FARAD integration | Exclude | Walk-over scales show "bias and the need for outlier cleaning"; the dashboard "never computes extralabel withdrawal". | integrations "In-pasture walk-over scales", "FARAD" |
| Predictive or AI recommendations | Exclude | See section 2.6. | |
| Investment and ROI economics | Exclude here | Kept in the separate Ranch Tech ROI project (section 2.7). | |

## 2.6 Why transparent rules are enough

No predictive model and no AI recommendation is proposed. The reasons come from the evidence:

1. **The job is triage with a defined response.** The page's own note says "Every row is a rule a manager would act on"
   (`index.html`), and every row carries a defined first step (`RULE-WF-09`). A rule whose reading, threshold and basis
   can be shown (sections 1.5c and 1.4b) can be checked, tuned and argued with by the manager. The audit found no
   decision in scope that the transparent rules cannot express.
2. **The failures found are data and wording failures.** 55 of the 83 findings are Phase 1 (findings.json `counts`):
   reading CSV files, missing data read as all-clear, time zones, unsafe rendering. A model would sit on the same
   inputs and inherit every one of them.
3. **There is nothing to validate a model against.** The data is fictional and built around 10 planted problems. "The
   10-of-10 match shows the rules find what the generator planted. It does not validate the thresholds or the workflow
   against real operations" (`RULE-WF-21`).
4. **Even published models carry only their developers' validation.** Grass-Cast's "60-80% accuracy figure comes from
   the developers"; "RAP accuracy (cover MAE 2.6-10.2%) comes from RAP's own product page. No independent validation of
   either was gathered" (context research caveats). The ARS heat maps "cannot predict individual animal stress levels".
   A vendor tank monitor describes its projected values as "based on all previous data points, trend predictions",
   with no accuracy figure (water research), and the integration entries say to keep vendor projections apart from measurements.
5. **False alarms cost trust.** By analogy only, Drew et al. 2014 found 88.8% of 12,671 annotated ICU arrhythmia alarms
   were false positives (`RULE-WF-18`). An alert source with an unknown false-alarm rate adds rows the crew learns to
   ignore.
6. **Where models are useful, they are context.** Public model outputs appear as dated context with their caveats, never
   as triggers: "Do not let regional products directly raise or lower pasture-level move severity" (`RULE-CTX-10`).

**If a predictive feature were ever proposed** (a recommendation, not sourced), it should be validated before it can
raise or rank a row: real records from the operation with known outcomes; a held-out period; a comparison of missed
events and false alarms against the transparent rule it would replace; inputs, data date and uncertainty shown beside
every output; context-only display until it beats the rule; and a recorded owner decision in the rules table's Basis
column (`RULE-WF-20`).

## 2.7 Investment economics stay in the Ranch Tech ROI project

None of the recommended additions needs a cost or payback figure to do its job. Cost and payback evidence the research
met, such as a sensor demonstration with a "\$1,800 unit, payback estimate from a single rancher example" (water
research), belongs in the separate Ranch Tech ROI project. The budget area keeps its operational role (variance against
plan, `RULE-BUD-03` and `RULE-BUD-04`). The fuel price-and-volume split (`RULE-BUD-09`, class B, Defer) is an operating
variance explanation, not an investment case, and stays deferred until gallons from delivery tickets exist.

---

# 3. Unresolved assumptions

| Assumption | Where it matters |
|---|---|
| The two-minute review and the seconds per step are design targets. No user testing was done; `RULE-WF-18` asks for a stopwatch test on 2-3 managers before claiming a time. | Sections 1.1, 1.3 |
| The value of pasture and group filters with real data is untested; on a 10-row day they mainly help group the printed briefing. | Section 1.5b |
| "New or worse since your last review on this device" needs the device to store the row IDs and severities it last showed. This storage scheme is a design inference; the registry supports only `last_review_at` in localStorage and a deterministic `exception_id` (itself "a design assumption"). | Sections 1.3, 1.7 |
| Dropping a per-device "seen" mark when severity rises is a design inference (`RULE-WF-11`: "Re-alarming when severity escalates is my own design inference, not sourced"). | Section 1.7 |
| The acknowledgement state model rests on vendor and consultancy documentation (Ignition, exida) and HSE by analogy; the ISA-18.2 text was not read. | Section 1.7 |
| That localStorage is tied to one browser profile on one device is the research's inference from per-origin storage; no source states cross-device behaviour. | Section 1.6 |
| Whether the crew briefing fits one Letter page with a full day's list, and how Firefox and Safari print it, was not tested (Chromium PDF only). | Section 1.4c |
| "Months closed through Sep" assumes September counts as closed at the Sep 30 18:00 as-of, a ranch bookkeeping choice (findings.json `unresolved_assumptions`). | Wireframe 1.4a |
| Real-device touch behaviour, screen-reader announcements, Firefox and WebKit are untested. | Sections 1.5b, 1.5f |
| The scores in section 2.2 are this document's judgement from the cited evidence, not measurements. Efforts marked "estimate" are not from the registry. | Section 2.2 |
| Gallons-per-head figures and tank capacities used to illustrate water coverage are assumptions; the repository has no capacity data. | Section 2.3 (1) |
| The choice of a stand-in county for public context is arbitrary and must not imply a real ranch. | Section 2.4 |
| The web search budget ran out during research, so crew-task evidence, maintenance intervals and mineral intake rates were not researched. | Section 2.3 (5, 7, 8) |
| The BQA manual cited for record keeping and handling is likely superseded by a 2026 edition that could not be fetched. | Sections 1.5h, 2.3 (4) |
| The published GitHub Pages site was unreachable (proxy 403); the live deployment is unverified. | All |

# 4. Sources cited in this document

Verification status is the citation checker's or critic's, from `rules.json`. "Vendor" marks vendor or consultancy
material, kept apart from independent evidence.

**Workflow, accessibility and storage**

| Source | Publisher, date | Verification | Used for |
|---|---|---|---|
| [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/) | W3C, 2024-12-12 | verified (partly for SC 1.4.13 text) | `RULE-WF-01`, `RULE-WF-03` |
| [Understanding SC 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) | W3C WAI, updated 2025-09-16 | verified | `RULE-WF-01` |
| [Understanding SC 2.1.1 Keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) | W3C WAI, updated 2026-05-11 | verified | `RULE-WF-02` |
| [Understanding SC 1.4.13 Content on Hover or Focus](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) | W3C WAI, updated 2026-07-12 | verified | `RULE-WF-02`, `RULE-WF-03` |
| [Understanding SC 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html) | W3C WAI, updated 2026-09-06 | verified | `RULE-WF-04` |
| [Understanding SC 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) | W3C WAI, updated 2026-05-11 | verified | `RULE-WF-05` |
| [Understanding SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | W3C WAI, updated 2026-05-11 | verified | `RULE-WF-06` |
| [Understanding SC 1.4.11 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) | W3C WAI, updated 2026-09-06 | verified (partly for `RULE-WF-08`) | `RULE-WF-07`, `RULE-WF-08` |
| [Window: localStorage property](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) | MDN, modified 2026-10-12 | verified | `RULE-WF-15` |
| [Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) | MDN, modified 2026-01-05 | verified | `RULE-WF-15` |
| [HTML Living Standard: Web storage](https://html.spec.whatwg.org/multipage/webstorage.html) | WHATWG, updated 2026-10-14 | verified | `RULE-WF-15` |
| [Printing (CSS media queries guide)](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing) | MDN, modified 2025-11-07 | verified | `RULE-WF-17` |
| [print-color-adjust](https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust) | MDN, modified 2026-08-27 | verified | `RULE-WF-17` |
| [Better alarm handling (CHIS6)](https://www.hse.gov.uk/pubns/chis6.pdf) | UK Health and Safety Executive, 2000-03 | verified | `RULE-WF-09`, `RULE-WF-10`, `RULE-WF-11`, `RULE-WF-19`, `RULE-WF-20` |
| [Alarm Management and ISA-18: A Journey, Not a Destination](http://www.exida.com/articles/ALARM-MANAGEMENT-AND-ISA-18-A-JOURNEY-NOT-A-DESTINATION.pdf) | exida.com LLC (consultancy, vendor), copyright 2018-2020 | verified for most uses; partly for `RULE-WF-12` and `RULE-WF-20`; rejected for `RULE-WF-14` | `RULE-WF-09`, `RULE-WF-10`, `RULE-WF-18` |
| [Alarming, Ignition User Manual 8.1](https://docs.inductiveautomation.com/docs/8.1/platform/alarming) | Inductive Automation (vendor documentation), updated 2026-04-17 | partly | `RULE-WF-11` |
| [Insights into the Problem of Alarm Fatigue with Physiologic Monitor Devices](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0110274) | PLOS ONE (Drew et al.), 2014-10-22 | verified | `RULE-WF-18`, `RULE-WF-19` |
| [Standard Operating Procedures: A Writing Guide](https://bpb-us-e1.wpmucdn.com/blogs.cornell.edu/dist/7/8192/files/2018/03/SOPManual-1-2drpn48.pdf) | Penn State Extension (R. Stup), 2001 | verified | `RULE-WF-17` |
| [Make SOPs Available to Employees](https://bpb-us-e1.wpmucdn.com/blogs.cornell.edu/dist/7/8192/files/2019/07/Make-SOPS-Available-to-Employees.pdf) | Cornell (J. Skellie), 2019-07-18 | verified | `RULE-WF-17` |
| [Assessor's Guide to the BQA Cow-Calf Assessment](https://www.bqa.org/Media/BQA/Docs/bqa-cow-calf-assessment-cover-fy26.pdf) | Beef Quality Assurance, undated (FY26) | partly | `RULE-WAT-15` |
| [BQA Field Guide (2026 file)](https://www.bqa.org/Media/BQA/Docs/bqa-field-guide-2026.pdf) | Beef Quality Assurance, undated | verified | `RULE-WF-16` |

**Water**

| Source | Publisher, date | Verification | Used for |
|---|---|---|---|
| [Livestock Water Requirements (AS1763)](https://www.ndsu.edu/agriculture/sites/default/files/2024-04/as1763.pdf) | NDSU Extension, revised 2021-03 (a February 2026 revision is also cited) | verified; re-read by the critic 2026-10-16 | `RULE-WAT-06` |
| [Water Requirements for Beef Cattle (G2060)](https://extensionpubs.unl.edu/publication/g2060/2011/pdf/view/g2060-2011.pdf) | University of Nebraska-Lincoln, 2011-03 | verified | `RULE-WAT-06` |
| [Estimating Water Requirements for Mature Beef Cows (MF3303)](https://bookstore.ksre.ksu.edu/download/estimating-water-requirements-for-mature-beef-cows_MF3303) | Kansas State University, 2016-12 | verified | `RULE-WAT-06` |
| [Watering Facility (Code 614) Conservation Practice Standard](https://www.nrcs.usda.gov/sites/default/files/2023-08/614_NHCP_CPS_Watering_Facility_2023.pdf) | USDA NRCS, 2023-08 | verified; re-read by the critic 2026-10-16 | `RULE-WAT-09`, `RULE-WAT-05` |

**Grazing and forage**

| Source | Publisher, date | Verification | Used for |
|---|---|---|---|
| [The North Dakota Grazing Monitoring Stick (R1780)](https://www.ndsu.edu/agriculture/sites/default/files/2026-06/R1780%20The%20North%20Dakota%20Grazing%20Monitoring%20Stick%20%281%29.pdf) | NDSU Extension, revised October 2024 | verified | `RULE-GRZ-05`, `RULE-GRZ-06`, `RULE-GRZ-03` |
| [Designing a Grazing Plan That Guides Decisions (MC-04340)](https://extension.sdstate.edu/sites/default/files/2026-07/MC-04340.pdf) | SDSU Extension, undated (c) 2026 | verified | `RULE-GRZ-05` |
| [Prescribed Grazing, Range Technical Note No. 9](https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf) | USDA NRCS South Dakota, April 2017 | partly | `RULE-GRZ-06`, `RULE-GRZ-03` |
| [Utilization Studies and Residual Measurements (TR 1734-3)](https://extension.arizona.edu/sites/extension.arizona.edu/files/attachment/utilstudies.pdf) | BLM, USFS, NRCS and Extension, 1996-1999 | verified | `RULE-GRZ-06` |
| [About Our Maps (Grass-Cast)](https://grasscast.unl.edu/Outlook/About.aspx) | NDMC and partners, undated | verified (product documentation) | `RULE-GRZ-05`, `RULE-CTX-10` |

**Drought, weather and other context**

| Source | Publisher, date | Verification | Used for |
|---|---|---|---|
| [U.S. Drought Monitor home](https://droughtmonitor.unl.edu/?stream=top) | National Drought Mitigation Center, map released 2026-10-15 | verified; re-read by the critic 2026-10-16 | `RULE-CTX-01`, `RULE-CTX-02` |
| [USDM Web Service Info](https://droughtmonitor.unl.edu/DmData/DataDownload/WebServiceInfo.aspx) | National Drought Mitigation Center, undated | partly | `RULE-CTX-03`; integration "U.S. Drought Monitor data services" |
| [Livestock Forage Disaster Program (LFP)](https://www.fsa.usda.gov/resources/programs/livestock-forage-disaster-program-lfp) | USDA Farm Service Agency, undated | verified | `RULE-CTX-03` |
| [Plan for Drought](https://ranchdrought.unl.edu/Plan.aspx) | National Drought Mitigation Center, undated | partly | `RULE-CTX-10`, `RULE-CTX-11`, `RULE-CTX-13` |
| [PRISM Downloads via Web Service](https://www.prism.oregonstate.edu/documents/PRISM_downloads_web_service.pdf) | PRISM Group, Oregon State University, 2025-03-26 | verified (integration entry partly: cost and commercial-use terms not in the PDF) | `RULE-CTX-10` |
| [SD Mesonet Daily Data Request](https://climate.sdstate.edu/request/daily/) | South Dakota State University, undated | partly | `RULE-CTX-16` |
| [Forecasting Heat Stress](https://www.ars.usda.gov/plains-area/clay-center-ne/marc/documents/heat-stress/forecastingheatstress/) | USDA ARS USMARC, modified 2016-08-12 | verified | `RULE-CTX-07` |
| [HeatRisk Overview](https://www.wpc.ncep.noaa.gov/heatrisk/overview.html) | NOAA NWS Weather Prediction Center, undated | verified | `RULE-CTX-08` |
| [Cattle Comfort Index](https://ndawn.info/agriculture_cci.html) | NDAWN (NDSU), undated | partly | `RULE-CTX-09` |
| [BIF Guidelines: Pregnancy Data](https://guidelines.beefimprovement.org/index.php/Pregnancy_Data) | Beef Improvement Federation, edited 2026-03-27 | verified | `RULE-CTX-12` |
| [BIF Guidelines: Body Condition Scores](https://guidelines.beefimprovement.org/index.php/Body_Condition_Scores) | Beef Improvement Federation, edited 2022-06-02 | verified | `RULE-CTX-12` |

# 5. Index of finding and rule IDs used

Every ID below appears in this document and is copied from the registries. Severity, status, phase and class are the
registries' values.

**Findings** (from `findings.json`; links go to `02-findings.md`)

| ID | Title | Severity | Status | Phase | Effort |
|---|---|---|---|---|---|
| [CSV-05](02-findings.md#csv-05) | Cells and keys are not trimmed: a stray space in a pasture ID ('P3 ') blanks the page, 'T4, P4' drops which group drinks at the leaking tank, and 'open ' hides every health task | high | confirmed | 1 | S |
| [GAIN-07](02-findings.md#gain-07) | No coverage disclosure: a group verdict can rest on a handful of animals and the page does not say how many were weighed | medium | design-limitation | 1 | S |
| [GAIN-08](02-findings.md#gain-08) | Old weigh-ins are presented as current: no age check, so a skipped weigh-in gives an all-clear on 72-day-old data | medium | design-limitation | 1 | S |
| [GAIN-09](02-findings.md#gain-09) | An individual animal losing weight is never named while its whole group is flagged | medium | design-limitation | 2 | S |
| [GAIN-10](02-findings.md#gain-10) | Weigh conditions (shrink and gut fill) are not recorded, and an ordinary few-percent difference is larger than the serious rule's margin | medium | design-limitation | defer | L |
| [GAIN-11](02-findings.md#gain-11) | Gain wording: 'since <date>' hides that the period ended at the last weigh-in, '1 yearlings', and toFixed(1) shows thresholds that differ from the ones applied | low | confirmed | 1 | S |
| [GAIN-13](02-findings.md#gain-13) | Groups with a 0.0 target (the cows) are skipped silently in the report and the chart | low | design-limitation | 1 | S |
| [GRZ-01](02-findings.md#grz-01) | The current grazing stay is chosen by a blank out_date, not by as_of: a planned or early-entered out_date hides an overstay, and the alert's advice to 'record a new move date' has nowhere to go but the column that silences it | medium | confirmed | 1 | M |
| [GRZ-03](02-findings.md#grz-03) | Text or blanks in move and plan cells ('-', 'TBD', '21 days', a blank in_date or plan) silently remove the grazing alert, strip 'here now' from the T4 leak, or blank the whole rotation chart | medium | confirmed | 1 | S |
| [GRZ-04](02-findings.md#grz-04) | min_rest_days is never read: stays that start inside a pasture's own minimum rest go unflagged | medium | design-limitation | 2 | S |
| [GRZ-05](02-findings.md#grz-05) | The example season is not credible as a rotation: two pastures held two groups at once and 11 of 13 sequential re-entries are short of the file's own minimum rest | medium | confirmed | 2 | M |
| [GRZ-08](02-findings.md#grz-08) | The serious grazing action is one blanket line based only on elapsed days: no escalation and no destination | low | design-limitation | 2 | M |
| [GRZ-09](02-findings.md#grz-09) | Two groups in one pasture are each judged alone against a single per-pasture plan | low | design-limitation | defer | L |
| [HLTH-02](02-findings.md#hlth-02) | An open health task with a blank or unreadable due date is never shown anywhere | low | design-limitation | 1 | S |
| [LOAD-01](02-findings.md#load-01) | Missing, unreadable or empty data files read as 'nothing needs attention' for that area | high | confirmed | 1 | M |
| [LOAD-02](02-findings.md#load-02) | A failed or slow load leaves a blank page: no loading state, no error message, no isolation between sections | high | confirmed | 1 | M |
| [LOAD-03](02-findings.md#load-03) | The hard-coded 'Yearlings' tile throws before the exception table is drawn (group renamed or shipped, not yet weighed, or a bad target) | high | confirmed | 1 | S |
| [LOAD-04](02-findings.md#load-04) | A tank with no reading in the last 7 days crashes the water charts and every section drawn after them | medium | confirmed | 1 | S |
| [LOAD-05](02-findings.md#load-05) | No data-age check: an old export is shown as the current report, and the as-of line has no time zone | low | design-limitation | 2 | S |
| [SEC-01](02-findings.md#sec-01) | CSV text is written into the page with innerHTML at 9 places: markup in a pasture, tag or group name runs script, can empty the alert table, and plain '<' text silently deletes alert context | medium | confirmed | 1 | S |
| [TIME-02](02-findings.md#time-02) | No time-zone contract: a date-only as_of, UTC-stamped readings and daylight-saving days make silent hours, the 24-hour drop and the header depend on the viewer's zone | medium | confirmed | 1 | M |
| [UI-01](02-findings.md#ui-01) | Chart details can only be opened with a mouse hover: a tap on a phone shows nothing, gain dots are 3.9 px targets, and keyboard or screen-reader users cannot reach any chart detail | medium | confirmed | 2 | M |
| [UI-02](02-findings.md#ui-02) | On a phone the 'Problem' and 'First step' columns are off-screen and budget differences are cut mid-number, with no cue that the table scrolls | medium | confirmed | 2 | M |
| [UI-03](02-findings.md#ui-03) | Chart text renders at about 7 px on a phone | medium | confirmed | 2 | M |
| [UI-04](02-findings.md#ui-04) | The 'Water tanks OK' tile re-reads tank IDs from the alert text and undercounts when tank names share a first word ('Well 2', 'Well 4') | low | confirmed | 1 | S |
| [UI-06](02-findings.md#ui-06) | On the due day the text says 'Due in 0 days' and 'Planned move in 0 days' | low | confirmed | 1 | S |
| [UI-07](02-findings.md#ui-07) | Empty and zero wording: 'Nothing in all needs attention.', and '−0.0%', '−0%' and 'Under by \$0' when exactly on budget | low | confirmed | 1 | S |
| [UI-09](02-findings.md#ui-09) | Rows with the same severity are ordered A-Z by area name, so the Budget overruns head the serious block above an overdue vaccination and a silent water sensor | low | design-limitation | 2 | S |
| [UI-10](02-findings.md#ui-10) | Keyboard focus is lost after activating a filter chip | low | confirmed | 2 | S |
| [UI-11](02-findings.md#ui-11) | Tooltips near the right or bottom edge are squeezed or open off-screen | low | confirmed | 2 | S |
| [UI-13](02-findings.md#ui-13) | Exception text shows raw ISO dates ('2026-07-20') while the rest of the page uses 'Jul 20' | low | confirmed | 2 | S |
| [UI-16](02-findings.md#ui-16) | The gain chart does not mark the animals the report flags, or the 50% and 80% lines | low | confirmed | 2 | S |
| [UI-18](02-findings.md#ui-18) | 'Head on grass 375' counts 180 cow-calf pairs as 180 head | low | plausible | 2 | S |
| [WAT-02](02-findings.md#wat-02) | There is no tanks master list: a tank with no readings in the export, or an empty water file, disappears and the page reports water as fine | high | design-limitation | 1 | M |
| [WAT-05](02-findings.md#wat-05) | A tank whose sensor stopped less than 24 hours ago is judged on its old reading and counted OK, with no sign of how old the shown level is | medium | design-limitation | 2 | S |
| [WAT-06](02-findings.md#wat-06) | Water severity uses level percent alone: it ignores stock on the pasture, tank capacity and use, and ties are broken by file order, so an empty-pasture tank outranks a leaking tank 45 heifers drink from | medium | design-limitation | 3 | M |
| [WAT-09](02-findings.md#wat-09) | A silent tank last seen nearly empty and falling is only 'serious', ranked below every critical row | low | design-limitation | 2 | S |

**Rules** (from `rules.json`)

| ID | Rule (first sentence) | Class | Phase |
|---|---|---|---|
| RULE-BUD-03 | PROPOSED: Combined percent-and-dollar materiality per category over closed months (V = actual - plan to date; p = V / plan). | C | 1 |
| RULE-BUD-04 | PROPOSED: Compare season-to-date actual against a monthly phased plan through the same month (which months count as closed is set by RULE-BUD-05, class C), not against... | A | 1 |
| RULE-BUD-09 | PROPOSED: Split fuel variance into price and volume (gallons x \$/gal). | B | Defer |
| RULE-BUD-14 | PROPOSED: At equal severity, budget rows sort below animal welfare rows (Water, Health, Grazing, Gain) instead of alphabetically first. | C | 2 |
| RULE-CTX-01 | PROPOSED: Choose public context by when it was released, not by the week it covers. | A | 3 |
| RULE-CTX-02 | PROPOSED: Mark the drought context stale when (as_of minus USDM valid date) is more than about 9.1 days, meaning a weekly release was missed or the fetch failed. | C | 3 |
| RULE-CTX-03 | PROPOSED: Show the county USDM category mix and a count of weeks at D2 or worse in the last 8 weeks as information only, with a link to FSA. | B | 3 |
| RULE-CTX-04 | PROPOSED: Show state-level NASS Crop Progress pasture and range condition (% very poor+poor and % good+excellent) with its week-ending date, as regional context only. | B | Defer |
| RULE-CTX-05 | PROPOSED: Show the Grass-Cast seasonal grassland production outlook (% above or below the grid cell's ~38-year average) with its map date. | B | Defer |
| RULE-CTX-06 | PROPOSED: Show RAP annual herbaceous production (lbs/acre) history per pasture polygon as retrospective context. | B | Defer |
| RULE-CTX-07 | PROPOSED: heat-stress days. | C | Defer |
| RULE-CTX-08 | PROPOSED (exclusion): Do not use NWS HeatRisk as a cattle heat indicator. | A | Defer |
| RULE-CTX-09 | PROPOSED: In calving season, show a cold-stress outlook using the Comprehensive Climate Index (CCI). | B | Defer |
| RULE-CTX-10 | PROPOSED: drought-plan review prompts. | C | 3 |
| RULE-CTX-11 | PROPOSED: Feed and mineral inventory. | C | Defer |
| RULE-CTX-12 | PROPOSED (deferred module): breeding, calving and body-condition records. | C | Defer |
| RULE-CTX-13 | PROPOSED (deferred): a fence, water-system and equipment maintenance log plus a crew task list. | C | Defer |
| RULE-CTX-14 | PROPOSED: Per-pasture ecological site and reference production as static attributes from NRCS soil and ecological site data, looked up once and stored in pastures.csv. | B | Defer |
| RULE-CTX-15 | PROPOSED (demo setting): Any real public context shown next to the fictional ranch must be (a) pinned to the fictional as_of, not today's live data; (b) for a named re... | D | 3 |
| RULE-CTX-16 | PROPOSED (data-source rule): Do not commit or redistribute SD Mesonet data in a public repository or site. | A | 3 |
| RULE-GAIN-06 | PROPOSED: Weigh-condition consistency gate. | C | 1 |
| RULE-GAIN-10 | PROPOSED: Coverage and matched-interval gate for group ADG. | C | 1 |
| RULE-GRZ-01 | CURRENT: Serious when an open stay's days in pasture (as_of date minus in_date) is more than the pasture's planned_graze_days (exceptions.js, grazing block of findExce... | C | 1 |
| RULE-GRZ-03 | UNUSED DATA -> PROPOSED: Rest/recovery check. | B | 2 |
| RULE-GRZ-05 | PROPOSED: record a forage observation (residual height or utilization estimate, regrowth or recovery note, photo point) at move-out and before re-entry, and warn when... | C | 3 |
| RULE-GRZ-06 | PROPOSED: key-species residual check during and at the end of each stay. | B | 3 |
| RULE-GRZ-07 | PROPOSED: Derive planned graze days from forage demand (AU-days) instead of a fixed per-pasture day count: planned days = (acres x usable forage lb/ac x harvest effici... | B | Defer |
| RULE-HLTH-05 | PROPOSED: In fly season, each pastured group gets a recurring eye and condition observation. | C | Defer |
| RULE-HLTH-06 | PROPOSED: A health task can be marked done only with a BQA-style completion record: date, group or animal ID, product and lot/serial (product tasks), route and locatio... | C | Defer |
| RULE-HLTH-08 | PROPOSED: Serious when a recorded withdrawal clear date falls after the group's planned ship or sale date. | A | Defer |
| RULE-HLTH-09 | PROPOSED: Low-stress timing for sensitive groups. | B | Defer |
| RULE-HLTH-10 | PROPOSED: Escalate-to-veterinarian triggers from observation records. | C | Defer |
| RULE-HLTH-11 | PROPOSED: wording rule for every Health row and for gain follow-ups. | C | 1 |
| RULE-WAT-03 | CURRENT: critical when the level fell >= 30 points between the latest reading and the most recent reading at least 24 h earlier (RULES.waterDropPts). | D | 1 |
| RULE-WAT-05 | CURRENT GAP + PROPOSED: water severity should account for whether cattle are on the tank's pasture now or are planned to move there. | C | 2 |
| RULE-WAT-06 | PROPOSED: estimate how long the water in each tank will last for the cattle on it. | C | 3 |
| RULE-WAT-07 | PROPOSED: silence escalation. | C | 2 |
| RULE-WAT-08 | PROPOSED: leak and stuck-float screen. | C | Defer |
| RULE-WAT-09 | PROPOSED: storage-days check. | B | 3 |
| RULE-WAT-14 | PROPOSED: sensor trust band and calibration record. | C | Defer |
| RULE-WAT-15 | PROPOSED: sensor readings supplement, and do not replace, eyes-on tank checks. | C | 1 |
| RULE-WF-01 | CURRENT: severity is shown by icon shape plus a text label, never by colour alone (badge() in app.js: octagon=Critical, triangle=Serious, circle=Warning, each followed... | A | 1 |
| RULE-WF-02 | PROPOSED (current fails): every detail now shown only on pointer hover (tank reading at a time, grazing stay dates and plan, animal tag and ADG, budget dollars) must a... | A | 2 |
| RULE-WF-03 | PROPOSED (current fails): the custom tooltip must be dismissible with Escape without moving the pointer, and hoverable (the pointer can move onto it without it disappe... | A | 2 |
| RULE-WF-04 | PROPOSED (partly met): each chart needs a short text alternative that states the decision-relevant state, plus a long alternative or data table. | A | 2 |
| RULE-WF-05 | PROPOSED (current fails): when a filter chip changes the exception list, announce the result as a status message ('Showing 3 of 10: Water') and keep keyboard focus on... | A | 2 |
| RULE-WF-06 | CURRENT (passes): pointer targets are at least 24x24 CSS px (2.5.8). | A | 1 |
| RULE-WF-07 | CURRENT (passes in Chromium): keyboard focus is visible (2.4.7) and never fully hidden by author content (2.4.11). | A | 1 |
| RULE-WF-08 | PROPOSED: chart marks a reader needs to make the decision (past grazing stays, the over-plan segment, target lines) should reach 3:1 against adjacent colours, or carry... | B | 2 |
| RULE-WF-09 | CURRENT: every exception row carries a defined first response (the 'First step' column), and a condition with no response is not an exception. | B | 1 |
| RULE-WF-10 | PROPOSED: assign severity by consequence of no response and the time available to respond, with about 3 documented levels (e.g. | B | 2 |
| RULE-WF-11 | PROPOSED: acknowledging an exception never clears it. | B | 2 |
| RULE-WF-12 | PROPOSED: shelving (temporarily hiding a row) must have a reason, a person and an expiry, and the count of shelved rows must stay visible. | C | Defer |
| RULE-WF-13 | PROPOSED: show how long each exception has been open (first seen), and flag rows open longer than N days as 'standing' for the weekly review. | C | Defer |
| RULE-WF-14 | PROPOSED: the page must state when the data is from (with a time zone) and how old it is, and flag stale data before the manager acts on it. | C | 1 |
| RULE-WF-15 | PROPOSED: acknowledgements, notes and owners that the crew must share cannot live only in localStorage. | B | 2 |
| RULE-WF-16 | PROPOSED (deferred): health completion history and any shared acknowledgement or notes log are operational records. | C | Defer |
| RULE-WF-17 | PROPOSED (current fails in print): a one-page printable crew briefing in black on white, large text, grouped by place or route, each item with its first step, a check... | B | 2 |
| RULE-WF-18 | PROPOSED design target (not validated): a ~2-minute morning review. | C | 2 |
| RULE-WF-19 | CURRENT: duplicate and stale rows are suppressed by design (a silent sensor is not also judged on its stale level; a group-wide gain problem is not repeated per animal). | B | 1 |
| RULE-WF-20 | PROPOSED: the rules table shows each threshold's basis: 'Demo setting (D)' for every current value until it is sourced or set by the ranch, then 'Ranch choice, set by... | B | 1 |
| RULE-WF-21 | CURRENT demo settings used by the workflow (the as_of snapshot of 2026-09-30T18:00, 10 planted problems, the 3 severity levels and their mapping to areas) are syntheti... | D | 1 |
