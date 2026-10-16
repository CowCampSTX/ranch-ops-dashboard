# 01. Current implementation assessment and test results

This document records what the Ranch Operations Dashboard does today, how it is built, and what the baseline checks
showed before any change was made. It is the starting point for the rest of the audit.

The dashboard is a portfolio demonstration running on fictional data (Example Ranch). It is **not production-ready**,
and nothing in this document says otherwise. Every threshold in the code (25% / 40% tank level, 30-point drop,
24 hours of sensor silence, planned graze days, 2-day move grace, 80% / 50% of target gain, 2.0 / 1.0 lb daily gain
targets, 7 days to due, 5% / 10% over budget) is a demonstration setting, not a validated operating value.

## What was reviewed

| Item | Value |
|---|---|
| Repository | CowCampSTX/ranch-ops-dashboard |
| Commit reviewed | `cfd77e50a050163b542cadfc6b38882c0341e99d` (main), "Switch the dashboard to a black theme with green accents" |
| Work branch | `claude/project-thread-nu46kf`. At the time of the baseline it was identical to main. Its later commits add only `docs/audit/` files. |
| Worktree | baseline.json: "tracked files unchanged (\"git diff --stat\" empty); the only untracked path is docs/audit/." |
| Baseline run | 2026-10-15 (Playwright report `ranAt` 2026-10-15T18:08:26.848Z). The registrar re-ran the main checks on 2026-10-16 and got the same results (findings.json `spot_checks`). |
| Project guidance files | There is **no PROJECT_CONTEXT.md or AGENTS.md** in the repository. Behaviour was judged against README.md, the code and the committed data. |

The tracked files at that commit:

| File | Lines | Role |
|---|---|---|
| `index.html` | 118 | Page layout, styles, empty containers for each section |
| `app.js` | 225 | Loads the CSVs, runs the rules, draws tiles, the exception table and the charts |
| `exceptions.js` | 159 | `RULES`, `parseCSV`, `waterStatus`, `grazingStatus`, `gainStatus`, `budgetStatus`, `findExceptions`. Pure functions shared by the page and the tests. |
| `data/*.csv` | 8 files | Fictional example data (pastures, groups, moves, weights, water, health, budget, meta) |
| `scripts/generate_data.py` | 149 | Builds `data/` from a fixed seed, with 10 planted problems |
| `tests/exceptions.test.mjs` | 66 | 8 `node:test` tests |
| `.github/workflows/test.yml` | 18 | CI: regenerate the data, check it matches, run the tests |
| `README.md` | 98 | Description, rule table, run instructions |

## How to read this document

The audit keeps four kinds of statement apart. This document is mostly the first kind.

1. **Verified findings.** These are reproduced, with quoted evidence from `docs/audit/evidence/baseline.json`, the
   audit and verify files, or the registry `docs/audit/data/findings.json`. Finding IDs (for example `LOAD-01`) are
   the registry's stable IDs.
2. **Research conclusions.** These come with citations and live in `research_*.json`, `cite_*.json` and
   `docs/audit/data/rules.json`. This document uses them in one place only: the classification of the current
   rules (RULE IDs).
3. **Recommendations.** These are marked as such, and they follow the phases in the registry.
4. **Unresolved assumptions.** These are listed in their own section near the end.

---

## 1. How the code is structured and how data flows

### 1.1 The pipeline

```
data/*.csv  (8 files, fictional)
   |  app.js:221  fetch(`data/${f}.csv`) then res.text()    -- no res.ok check, no try/catch
   v
parseCSV(text)                                              -- exceptions.js:22-34
   |  trim, split lines on \r?\n, split every line on ",",
   |  turn any number-looking cell into a Number, keep blanks as ""
   v
d = { pastures, groups, moves, weights, water, health, budget, meta }
   |
   +--> findExceptions(d, RULES)                            -- exceptions.js:94-159
   |       as_of = d.meta[0].as_of
   |       waterStatus(water, as_of)       -> water rows    (:39-52, rules :101-116)
   |       grazingStatus(moves, pastures)  -> grazing rows  (:54-61, rules :118-125)
   |       gainStatus(weights, groups)     -> gain rows     (:64-80, rules :127-138)
   |       health loop (inline)            -> health rows   (:140-147)
   |       budgetStatus(budget)            -> budget rows   (:82-89, rules :149-156)
   |       sort by severity, then by area name A-Z          (:158)
   |       => exc = [{severity, area, subject, problem, action}, ...]
   |
   +--> app.js:223  as-of line (textContent)
   +--> app.js:225  draw, in this order, with no isolation between sections:
           tiles(d, exc) -> exceptionsTable(exc) -> waterMultiples(d) -> grazingTimeline(d)
           -> gainStrip(d) -> budget(d) -> rules()
```

Some points about the flow, all read from the code and confirmed in the audit traces (`audit_csv.json`,
`audit_render.json` and `audit_time.json`, field `trace`):

- **One reader, no contract.** `parseCSV` is the only parser. audit_csv trace: "There are no checks on schema, types,
  ranges, references or duplicates." A value that looks like a number becomes a Number, IDs included ("007"→7). A
  blank cell stays `""`.
- **The page recomputes summaries.** The tiles and charts call `waterStatus`, `gainStatus`, `grazingStatus` and
  `budgetStatus` again, separately from `findExceptions`. The "Water tanks OK" tile counts problem tanks by
  parsing the tank ID back out of the alert's display text: `e.subject.split(" ")[1]` (app.js:47, finding `UI-04`).
- **Hard-coded content.** The "Yearling gain" tile looks up a group literally named `"Yearlings"` (app.js:48,
  `LOAD-03`). The grazing month ticks are fixed to `2026-06-01` through `2026-09-01` (app.js:120, `UI-05`).
- **Two readings of `as_of`.** audit_time trace: the water rules parse `as_of` as a local date-time, but grazing and
  health use `as_of.slice(0,10)`, "which new Date() parses as UTC midnight". The header prints local time "with no
  zone label" (`TIME-02`, `TIME-03`, `LOAD-05`).
- **Rendering.** SVG chart labels use `textContent` (safe). Tiles, the exception table, water headings, tooltips and
  the budget table use `innerHTML`, and CSV text reaches it at 9 places (`SEC-01`).
- **Failure behaviour.** The load-and-draw block is a top-level `await` with no `try/catch`. audit_render trace: "a
  throw in one stops all the later ones" (`LOAD-02`, `LOAD-04`).

**Worked example: the T4 leak** (from the audit_render trace, values confirmed in the browser baseline):

1. `water.csv` holds T4's readings, and the latest one is 10%.
2. `waterStatus` finds the latest reading at least 24 h older (56%) and sets `drop24h = 46`.
3. `findExceptions` makes it critical. The subject is "Tank T4 (Lone Tree, Heifers here now)": the group name comes
   from the open stays in `moves.csv`. The problem reads "Dropped 46 points in 24 hours, now 10%", and the first
   step "Check for a leak or a stuck float; haul water if it can't be fixed today".
4. The row is written into the table with `innerHTML`. The tile reads "Water tanks OK 5 of 8 / 3 need a look", the
   chip "Water (3)", and the T4 chart heading "10%".

### 1.2 The current rules and how the research classifies them

The thresholds live in one object, `RULES` (exceptions.js:5-16). The research registry (`docs/audit/data/rules.json`)
classifies each current rule. **This table is a research conclusion, not a baseline measurement.** Key: A = supported
general guidance, B = context-dependent guidance, C = ranch-specific management choice, D = synthetic demonstration
setting.

| Rule (current code) | Setting | Rule ID | Class |
|---|---|---|---|
| Tank critical when level is under 25% | `waterCritical: 25` | RULE-WAT-01 | C |
| Tank warning when level is under 40% | `waterLow: 40` | RULE-WAT-02 | C |
| Tank critical on a drop of 30+ points in 24 hours | `waterDropPts: 30` | RULE-WAT-03 | D |
| Tank serious after 24 hours with no reading; its level is then not judged | `sensorSilentHours: 24` | RULE-WAT-04 | C |
| Group serious when past its pasture's planned graze days | `planned_graze_days` per pasture | RULE-GRZ-01 | C |
| Group warning when a planned move is 2 days away or less | `graceDays: 2` | RULE-GRZ-02 | D |
| Group gain serious under 80% of target | `adgSerious: 0.8` | RULE-GAIN-01 | C |
| Animals under 50% of target listed (warning) unless the group is already serious | `animalShare: 0.5` | RULE-GAIN-02 | C |
| Yearling target 2.0 lb/day, heifer target 1.0, cows 0.0 (skipped) | `groups.csv` | RULE-GAIN-03, -04, -05 | D, D, D |
| Open health task past due is serious; due within 7 days is a warning | `dueSoonDays: 7` | RULE-HLTH-01, -02 | D, D |
| Open task with a blank due date, or a status other than exactly "open", is skipped silently | (code) | RULE-HLTH-03 | C |
| Budget serious over 10%, warning 5-10%, season to date | `budgetSerious: 0.10`, `budgetWarn: 0.05` | RULE-BUD-01, -02 | D, D |
| Severity shown by icon shape plus a word, not colour alone | `badge()` | RULE-WF-01 | A |
| Every row carries a first step | action text | RULE-WF-09 | B |
| Duplicate and stale rows suppressed by design | `continue`, `!groupLow` | RULE-WF-19 | B |
| The as-of snapshot, the 10 planted problems and the 3 severity levels | demo data | RULE-WF-21 | D |

No ranch operating threshold in the current code is class A. The only current class-A rules (RULE-WF-01, -06, -07)
are WCAG display criteria, not ranch thresholds (registry-changelog.md, "A current threshold classified A: None").

---

## 2. What works well

These strengths were verified on the **committed example data**. Each one has a limit, which is noted with it. The
limits are findings in their own right.

| Strength | Evidence | Limit |
|---|---|---|
| **Worst first, with a first step on every row.** | Test "worst first" passes. RULE-WF-09 evidence: "all 10 rows have a non-empty First step". | Within one severity, rows are sorted A-Z by area name, so the Budget rows head the serious block, above an overdue vaccination and a silent sensor (`UI-09`). |
| **Duplicate noise is suppressed.** A silent sensor is not also judged on its stale level, and a group-wide gain problem is not repeated for each animal. | Test "a silent sensor isn't also judged on its stale level" passes. audit_water C-09: one row only, "No reading for 30 hours; last level 10%". audit_gain: "32 of 45 heifers are under 0.5 (Python), yet only the serious Heifers row is shown." | The suppression is designed, but the 24-hour silence rule can still judge a tank on an 18-hour-old reading and count it OK (`WAT-05`). |
| **Context in the alert.** A water alert names the pasture and the group drinking there. | Test "a water alert names the group drinking there" passes, giving "Tank T4 (Lone Tree, Heifers here now)". audit_grazing G-C5: two groups are named, "Tank T4 (South Divide, Cows and Heifers here now)". | "here now" means "as of the data's as_of", which the wording does not say. The context is lost with a stray space ("T4, P4", `CSV-05`), text in move cells (`GRZ-03`) or an empty moves export (`LOAD-01`). |
| **Severity is never colour alone.** Octagon = Critical, triangle = Serious, circle = Warning, each followed by the word. | `badge()` in app.js:36-41. RULE-WF-01 (class A, WCAG 2.2 SC 1.4.1) observed `bySeverity {"Critical":2,"Serious":6,"Warning":2}` read as text. The baseline judged the chip focus ring visible, and RULE-WF-06 measured chips at 30.1 px tall with 8 px gaps. | Chart details have no keyboard or touch path (`UI-01`). |
| **The arithmetic is right on the committed data.** | audit_time: "T6: last reading Sep 29 00:00 → as_of Sep 30 18:00 = 42 h". "Yearlings: in Sep 6, as of Sep 30 = 24 days". "Fuel 11,640 vs 9,600 → '21% over season to date ($2,040)'". audit_gain: Heifers "1119/2565 = 0.436257", from an independent Python calculation. baseline: five tooltip samples match a separate Python calculation. | Only clean, regular data was checked here. Messy data is covered in section 3.3. |
| **The committed data gives the same report in every viewer time zone.** | baseline: six browser zones, each "sameRowsAsBaseline=true sameTiles=true". audit_time TIME-C1: "10 rows, hash c4a56d0f" in four node zones. `fmtDate` appends `T12:00`, which keeps date-only labels on the right day. | This holds only for the committed data shapes. A date-only as_of, UTC-stamped readings or a UTC as_of do shift results (`TIME-02`, `TIME-03`). |
| **Deterministic example data.** The generator uses a fixed seed and lists its planted problems in `PLANTED`. | baseline: an isolated clone regenerated byte-identically, and two more runs under different hash seeds and time zones left the diff empty, with matching aggregate hashes. | The generator writes with Python's `csv.writer`, which quotes fields that contain commas, but `parseCSV` cannot read quotes. The registry calls this mismatch "latent today because the committed data has no commas or quotes" (`CSV-01`). |
| **CI guards the data and the rules.** | `.github/workflows/test.yml` runs `python scripts/generate_data.py && git diff --exit-code data/`, then `node --test tests/exceptions.test.mjs` (Node 22, Python 3.12). | The audit read the workflow file but did not check its run history on GitHub. CI runs only the unit tests: no browser check and nothing in `app.js`. |
| **Simple, inspectable architecture.** | No dependencies, no build step, no backend. `index.html` loads `app.js`, which imports only `exceptions.js`. The rules are pure functions shared by the page and the tests. SVG labels and the as-of line use `textContent`. | Tiles, tables and tooltips use `innerHTML` with CSV text (`SEC-01`). |
| **The data stays labelled as fictional.** | baseline: "Example Ranch (fictional), 4,300 acres in 8 pastures..." and the footer "Example Ranch and all of its data are fictional, generated by scripts/generate_data.py", with `fictionalLabel=true` at both viewports. The footer is still visible when loading fails. | None found. |

---

## 3. Automated results

All quotes below come from `docs/audit/evidence/baseline.json` (`automated`) unless another file is named.

### 3.1 Commands and outputs

| Check | Command | Result | Quoted output |
|---|---|---|---|
| Branch and commit | `git -C /home/claude/ranch-ops-dashboard rev-parse HEAD; git branch --show-current; git status --porcelain` | pass | "cfd77e50a050163b542cadfc6b38882c0341e99d / claude/project-thread-nu46kf / porcelain was empty at the start. At the end porcelain shows only \"?? docs/audit/\"." |
| Unit tests | `cd /home/claude/ranch-ops-dashboard && node --test tests/exceptions.test.mjs` (node v22.22.0) | **pass (8/8)** | "# tests 8 / # suites 0 / # pass 8 / # fail 0 / # cancelled 0 / # skipped 0 / # todo 0 / # duration_ms 167.849356" |
| Regeneration in an isolated clone is byte-identical | `git clone -q /home/claude/ranch-ops-dashboard <scratch>/audit/baseline/regen && cd regen && python3 scripts/generate_data.py && git status --porcelain && git diff --stat data/` (Python 3.13.16) | pass | Clone HEAD cfd77e50...; the generator printed "wrote 8 files to .../regen/data"; the "--- status:" and "--- diff stat:" sections were both empty, followed by "(end diff)". |
| Generator is deterministic under another hash seed and time zone | `PYTHONHASHSEED=12345 TZ=Pacific/Auckland python3 scripts/generate_data.py && git status --porcelain && git diff --stat data/`; `PYTHONHASHSEED=random TZ=America/Denver python3 scripts/generate_data.py && git diff --exit-code data/`; `sha256sum data/*.csv \| sha256sum` in the clone and the repo | pass | Both runs left the status and diff empty, and the second printed "exit=0". Aggregate hashes: clone "37c0da714cd52d1068f257cac344904c3d92e65f16e563f2247d3934b9a80519  -", repo the same. |
| Browser diagnostic, desktop 1280x900 | `python3 -m http.server 8801 --bind 127.0.0.1 --directory /home/claude/ranch-ops-dashboard &` then `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ <scratch>/audit/baseline/out docs/audit/screenshots` (chromium 141.0.7390.37) | pass for load, errors and counts; **fail** for keyboard access to charts and tooltip edge placement | "errors: console=0 page=0 requestfailed=0 status>=400=0 []"; "rows: exceptions=10 budget=6 rules=11 waterMinis=8 charts=11 fictionalLabel=true"; "keyboard tooltips: {\"tabStopsInsideCharts\":0,\"tooltipShownOnAnyFocus\":false}"; "edge rightEdgeWater: insideViewport=false" |
| Browser diagnostic, phone 390x844 (isMobile, hasTouch, DSF 2) | same run, second viewport | pass for load and counts; **fail** for touch tooltips, chart text size and table columns | "page overflow: 390/390 exceptions: scrolls=true cut=[Problem,First step]; budgetTable: scrolls=true cut=[Difference]"; "chart text (effective px): mini:7 ... grazing:6.8 gain:6.8 budgetChart:6.8"; "tap gain: target=3.9x3.9px tipVisible=false" |
| Loading, missing-data, error, all-clear and time-zone states | `node docs/audit/diagnostics/states-check.mjs http://127.0.0.1:8801/ <scratch>/audit/baseline/states` | **fail** for missing, error and loading states; pass for time zones | "Missing or garbled data was silently reported as all-clear in 8 of 32 file scenarios ... The other 24 ended with \"ready=false pageErrors=1\". Loading showed \"loadingText=false\"." (Details in section 4.9.) |
| Tooltip values match the CSVs | An independent Python script reading `data/weights.csv`, `budget.csv`, `water.csv` and `moves.csv` | pass | "H026: weights 1130 (2026-07-20) to 1136 (2026-09-15), adg 0.10526 over 57 days, which matches the tooltip \"H026 (Heifers) / 0.11 lbs/day ...\". Repairs: budget 7200, actual 9000 ... T4 last row 2026-09-30T18:00 10.0 matches \"Sep 30, 6 PM: 10%\". ... Yearlings P3 in 2026-09-06 gives 24 days" |

The registrar re-ran the unit tests on 2026-10-16: "node --test tests/exceptions.test.mjs: 8 pass, 0 fail"
(findings.json `spot_checks`). audit_time also found the tests pass under `TZ=America/Chicago` and
`TZ=Pacific/Auckland`.

### 3.2 What the 8 tests check

| Test | What it asserts |
|---|---|
| finds every problem planted in the data | The T4 leak, T6 silent, T2 low, yearlings over plan, heifers under target, 6 slow yearlings, booster overdue, pinkeye due soon, fuel and repairs over, each with its severity |
| and nothing else | Exactly 10 rows on the committed data |
| worst first | Severity never increases down the list |
| a silent sensor isn't also judged on its stale level | One T6 row |
| a water alert names the group drinking there | The T4 subject includes "Heifers here now" |
| water rules at their thresholds | 35-point drop, 39 → warning, 41 → nothing, 24 → critical, 26 h silent → serious |
| summaries | 8 tanks; open stays for Cows, Heifers and Yearlings; gain head counts [45, 150]; Fuel variance 2040 |
| CSV parsing keeps text as text and numbers as numbers | `parseCSV("a,b,c\nP1,12.5,\n")` equals `[{ a: "P1", b: 12.5, c: "" }]` |

These are the committed example data, the generator's planted problems and a few water boundaries. There is no test
for `app.js`, the loading path, the health or budget boundaries, the grazing boundaries, or any malformed input.

### 3.3 Passing these tests is a baseline, not proof

**Passing the existing tests shows the dashboard handles its own clean example data. It does not show that the
dashboard handles real-world data.** The audit found 83 registered defects and design limitations (findings.json
`counts.total`), 18 of them high severity. Every one is present while all 8 tests pass. Some examples:

- **Messy but ordinary CSV input.** audit_csv summary: "The committed data is clean and the dashboard handles it
  correctly: 8 of 8 tests pass and there are 10 alerts. Real exports are different." `csv.repro.mjs` ran "66 cases:
  8 MATCH, 58 MISMATCH" (findings.json `spot_checks`). See `CSV-01` (quotes and line endings), `CSV-02` (blank and
  repeated-header rows), `CSV-03` (column names), `CSV-04` (blank cells), `CSV-05` (stray spaces), `CSV-06`
  (number-looking IDs), `DATA-01` (unknown references), `DATA-02` (dates), `WAT-01` (fault codes in levels),
  `HLTH-01` (status spelling), `BUD-01` (months after as_of), `BUD-02` (money text), `GAIN-01` and `GAIN-02`
  (single or same-day weigh-ins).
- **Missing or failed files.** The page shows an area as clear, or goes blank (`LOAD-01`, `LOAD-02`, `WAT-02`).
- **Group names and history.** The page crashes when the yearlings are renamed or shipped (`LOAD-03`), or when a
  tank has no reading in 7 days (`LOAD-04`).
- **Time.** Rows dated after as_of are used as current (`TIME-01`), and there is no time-zone contract (`TIME-02`,
  `TIME-03`).
- **The tests cannot catch a broken rule.** With the "don't judge a silent tank" line removed, the suite still
  passes: "SURVIVES silent tank also judged (continue removed) (pass 8, fail 0)". Six more water mutants also survive
  (`TEST-01`). No test covers the grazing boundaries: "SURVIVES grace boundary >= -> > (pass 8, fail 0)" (`TEST-02`).
- **One test locks in a defect.** The parsing test asserts the blanket number coercion: the registry location for
  `CSV-06` cites "tests/exceptions.test.mjs:64-66 (a test asserts the blanket coercion)". The same test also expects
  a blank cell to come back as `""`, the behaviour `CSV-04` reports. Fixing either one means changing this test, not
  just adding to it.

---

## 4. Manual browser observations

Quotes come from `baseline.json` (`manual`) unless another file is named. The setup was Playwright Chromium
141.0.7390.37 at two sizes: desktop 1280x900, and a phone at 390x844 with `isMobile`, `hasTouch` and device scale
factor 2. The page was served by `python3 -m http.server`.

### 4.1 Summary

| Check | Result | Related findings |
|---|---|---|
| Desktop layout | partial | `UI-12` |
| Phone layout | fail | `UI-02`, `UI-03`, `UI-12` |
| Every filter chip and its count | pass (focus lost after use) | `UI-10` |
| Every chart renders | pass | none |
| Tooltip content (desktop hover) | partial: values correct, edges wrong | `UI-11` |
| Console errors and failed requests | pass: none at either size | none |
| Keyboard order and focus visibility | partial | `UI-01`, `UI-10` |
| Chart details by keyboard or screen reader | fail | `UI-01` |
| Touch access to chart details | fail | `UI-01` |
| Loading state | fail | `LOAD-02` |
| Empty (all-clear) state | partial | `UI-07` |
| Missing-data state | fail | `LOAD-01`, `LOAD-02` |
| Error (garbled file) state | fail | `LOAD-01`, `LOAD-02` |
| Browser time zone does not change the report | pass | none (but see `TIME-02`, `TIME-03`) |
| Data stays labelled fictional | pass | none |

### 4.2 Desktop layout (1280x900)

"cardOverlaps 0, no text outside cards, no clipped tile values, no page overflow (1280/1280). Chart text renders at
11.8 to 13 px. One label collision in the gain chart: '\"3.0\" x \"lbs per day\" (20 px2)'." This is `UI-12`.

Screenshots: [desktop full page](screenshots/desktop-full.png),
[gain tooltip](screenshots/desktop-tooltip-gain.png).

### 4.3 Phone layout (390x844)

- The page itself does not scroll sideways ("390/390").
- The exception table hides **Problem** and **First step**: "scrollWidth 413 vs 316". The budget table cuts
  **Difference**, and the screenshot shows "+$1,80" and "DIFFERENC" (`UI-02`).
- Chart text renders at "6.8 to 7.0 CSS px" (`UI-03`).
- The T6 heading wraps to two lines ("height 40.3 vs 20.1"), so the T6 chart sits lower than T5's. The gain tick
  "3.0" overlaps "lbs per day" (12 px2) (`UI-12`).
- Exception dates wrap as "2026-" / "07-20" (`UI-13`).

Screenshot: [phone full page](screenshots/phone-full.png).

### 4.4 Filters

"On both viewports every label count equals the visible rows: All 10, Water 3, Grazing 1, Gain 2, Health 2, Budget
2. Exactly one chip has aria-pressed=true, and areasShown matches the chip. After every click, activeElement is
\"body\" (focus is lost)." The lost focus is `UI-10`. The real data has no chip with zero rows; the empty state was
tested in the all-clear scenario (section 4.9).

### 4.5 Charts and tiles

"11 charts at both sizes: 8 water minis, grazing, gain and budget. T6 shows 'no signal' with a shaded 'no data' band.
Budget table has 6 rows, rules table 11. Tiles read: Needs attention 10, Head on grass 375, Water tanks OK 5 of 8,
Yearling gain 1.94 lbs/day, Spend vs budget +1.0%."

The "Head on grass 375" tile counts 180 cow-calf pairs as 180 head. This is graded plausible, a domain wording
judgement that no skeptic reviewed (`UI-18`).

The 10 rows on the committed data, as drawn in the baseline run (states-check `baseline` scenario):

| Severity | Area | What | Problem |
|---|---|---|---|
| Critical | Water | Tank T2 (Windmill) | Down to 11.8% full |
| Critical | Water | Tank T4 (Lone Tree, Heifers here now) | Dropped 46 points in 24 hours, now 10% |
| Serious | Budget | Fuel | 21% over season to date ($2,040) |
| Serious | Budget | Repairs | 25% over season to date ($1,800) |
| Serious | Gain | Heifers | 0.44 lbs/day since 2026-07-20 vs 1.0 target |
| Serious | Grazing | Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over) |
| Serious | Health | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15) |
| Serious | Water | Tank T6 (Cedar Draw) | No reading for 42 hours; last level 98.5% |
| Warning | Gain | 6 yearlings | Under 1.0 lbs/day: Y027, Y031, Y058, Y082, Y129, Y132 |
| Warning | Health | Cows: Pinkeye check | Due in 3 days (2026-10-03) |

These are the 10 planted problems. The registry's Phase 1 acceptance bar is that they are "still found with the same
severities, with no new false alarms on the committed data" (findings.json `policies.phase_1_acceptance`).

### 4.6 Tooltips (desktop hover)

All five sampled values are correct (section 3.1). Two placements are wrong (`UI-11`):

- The water tooltip on the right-hand column "renders 53 px wide and 179 px tall, one word per line, with its right
  edge at 1281.66 (past 1280)".
- A budget tooltip near the bottom "opens at top 893.7, bottom 992.3, with innerHeight 900".

### 4.7 Console errors and failed requests

At both viewports: "errors: console=0 page=0 requestfailed=0 status>=400=0 []".

### 4.8 Keyboard, focus and touch

- **Tab order.** Desktop: "the 6 chips in DOM order, then focus leaves the page (step 7 \"body\")". Phone: "the 6
  chips, then 2 div.scroll table containers (Chromium makes scrollers focusable), then body. Nothing else is
  focusable."
- **Focus after activating a chip.** "After Enter on Water, active becomes \"body\" and the next Tab goes to \"All
  (10)\"" (`UI-10`).
- **Focus visibility: pass.** "The outline is not suppressed. Focused: outlineStyle \"auto\" ...". The pressed "All"
  chip scored lower on the pixel metric (3.19 desktop, 2.06 phone), but "the white ring is still clearly visible
  against the black page, so I count it as visible." The registry lists this under `unregistered_observations`, not
  as a finding. Screenshot: [focused chip](screenshots/desktop-focus-chip.png).
- **Chart details by keyboard: fail.** "focusableDescendants = 0 and svgFocusable = false for all 11 charts ... Each
  chart is role=img with a generic aria-label such as \"Average daily gain per animal by group\". The budget chart is
  the only one with an equivalent data table." (`UI-01`)
- **Touch: fail.** "No tooltip appeared for any of them: tipVisible=false with empty text. Rendered target sizes:
  gain dot 3.9x3.9 px, budget bar 86x10.2, grazing bar 52.1x14.7, water hit area 132.4x48.8. The page text still says
  \"Hover a dot for the tag.\"" The README says the page "works on a phone"; that does not hold for the charts
  (`UI-01`).

Later browser measurements by the workflow research (`research_workflow.json`, Chromium only) add more in this area.
They are research observations, recorded under rules, not baseline findings:

- The custom tooltip is not dismissed by Escape and cannot be hovered (RULE-WF-03).
- A filter change is not announced to assistive technology (RULE-WF-05).
- The default print is "4 pages, with main text at 2.71:1 on white" (RULE-WF-17).

### 4.9 Loading, empty, missing-data and error states (states-check)

`states-check.mjs` changes responses in flight with `page.route`, so no file on disk is touched. baseline.json calls
it the 40-scenario check. Its raw report (`states-report.json`, listed in baseline.json, kept in session scratch
space and not committed) has 42 entries:

- the unmodified baseline
- `loading` (every CSV delayed 3 s, snapshot at 1 s) and `stalled-water` (water.csv never answers, snapshot at 6 s)
- 32 per-file failures: 8 files x `404`, `abort`, `garbage` and `header-only`
- `all-clear`
- 6 time zones

**Loading: fail (`LOAD-02`).** "The user sees the header, the section headings and notes, empty cards, an empty
as-of line and no tiles. There is no loading text or spinner (loadingText=false). The stalled case looks identical
after 6 s." The code has no timeout, so the baseline concludes the stalled case "would stay that way indefinitely".

**Per-file failures: 8 silent all-clears, 24 blank pages, 0 visible messages.** From the raw report. "Blank" means
`ready=false` with one uncaught page error, and the quoted text is that error:

| File | 404 (server's real 404 page) | abort (network failure) | garbage (200, not a CSV) | header-only (200, no rows) |
|---|---|---|---|---|
| pastures | blank: "(reading 'name')" | blank: "Failed to fetch" | blank: "(reading 'name')" | blank: "(reading 'name')" |
| groups | blank: "(reading 'toLowerCase')" | blank: "Failed to fetch" | blank: "(reading 'toLowerCase')" | blank: "(reading 'adg')" |
| moves | blank: "(reading 'name')" | blank: "Failed to fetch" | blank: "(reading 'name')" | **silent**: "Grazing (0)", "All (9)" |
| weights | blank: "(reading 'localeCompare')" | blank: "Failed to fetch" | blank: "(reading 'localeCompare')" | blank: "(reading 'adg')" |
| water | blank: "(reading 'localeCompare')" | blank: "Failed to fetch" | blank: "(reading 'localeCompare')" | **silent**: "Water (0)", "Water tanks OK: 0 of 0 (0 need a look)", "0 critical" |
| health | **silent**: "Health (0)", "All (8)" | blank: "Failed to fetch" | **silent**: "Health (0)" | **silent**: "Health (0)" |
| budget | **silent**: "Budget (0)", "Spend vs budget: −NaN% ($NaN of $NaN, season to date)" | blank: "Failed to fetch" | **silent**: same as 404 | **silent**: "Budget (0)", "−NaN% ($0 of $0, season to date)" |
| meta | blank: "(reading 'slice')" | blank: "Failed to fetch" | blank: "(reading 'slice')" | blank: "(reading 'as_of')" |

In every one of the 42 runs, nothing on the page told the user that data was missing or had failed to load
(`tellsUserSomethingIsWrong=false`). For `health:404` the only trace is a console line: "Failed to load resource: the
server responded with a status of 404 (File not found)". baseline.json gives the consequence: "The overdue yearling
booster and the pinkeye check disappear from the morning list while the page looks normal and the as-of line is
intact."

The registry graded this high (`LOAD-01`), along with the blank-page cases (`LOAD-02`). The baseline had graded the
blank skeleton medium; the registry took the verified high from verify_render. The `groups` and `weights` header-only
failures come through the hard-coded Yearlings tile (`LOAD-03`).

**Empty (all-clear) state: partial (`UI-07`).** The data was edited in flight so that no rule fires. "All chips show
(0) and the tile reads \"Needs attention: 0 (0 critical, 0 serious, 0 warning)\". The messages are \"Nothing in all
needs attention.\" and \"Nothing in water needs attention.\" ... The tile reads \"Spend vs budget: −0.0% ($88,400 of
$88,400 ...)\". It works, but the copy is awkward."

**Time zones: pass, on the committed data.** "Identical in every zone: \"Data as of September 30, 2026 at 6:00
PM.\", with sameRowsAsBaseline=true and sameTiles=true". The zones were UTC, America/Chicago, America/Los_Angeles,
Pacific/Auckland, Asia/Kolkata and Pacific/Kiritimati. Other data shapes (a date-only or UTC-stamped as_of, UTC
readings) do change the results (`TIME-02`, `TIME-03`).

### 4.10 Screenshots

Committed: [desktop-full.png](screenshots/desktop-full.png), [phone-full.png](screenshots/phone-full.png),
[desktop-focus-chip.png](screenshots/desktop-focus-chip.png),
[desktop-tooltip-gain.png](screenshots/desktop-tooltip-gain.png).

The state screenshots (`state-loading.png`, `state-health-404.png`, `state-water-header-only.png`,
`state-all-clear.png`, `state-meta-404.png`, `state-stalled-water.png`) and the per-card phone screenshots are listed
in baseline.json but were saved to session scratch space and are not committed. Re-run the commands in section 8 to
regenerate them.

---

## 5. Blocked checks

These checks could not be done in the audit environment. Their results are **unknown**, not passed.

| Check | Why it was blocked | What stays unverified |
|---|---|---|
| Published GitHub Pages site, https://cowcampstx.github.io/ranch-ops-dashboard/ | The environment's proxy refused it. baseline.json: "A single plain curl -m 20 returned \"curl: (56) CONNECT tunnel failed, response 403\" (http_code=000). I made no attempt to bypass it." | The live deployment's paths, its 404 page and caching. `LOAD-02`'s statement about the live site is an inference from the local server. |
| Real mobile browsers (iOS Safari, Android Chrome) and screen readers (VoiceOver, TalkBack) | "Only Playwright Chromium 141 with isMobile/hasTouch emulation was available." | Real-device tap behaviour, and how the `role=status` tooltip is announced (`UI-01`, `UI-10`). |
| Firefox and WebKit rendering | "Only Chromium was run." | Layout, focus rings and print output in other engines. |

Also not done (not blocked, simply outside the baseline run):

- The CI run history on GitHub was not checked. Only the workflow file was read.
- No user testing was done. The "2-minute morning review" is a design target, not a measured result
  (research_workflow.json caveats).
- No spreadsheet program was run, so whether Excel rewrites the ISO timestamps is unverified (`DATA-02`, registry
  `unresolved_assumptions`).

---

## 6. Findings this baseline produced

Twelve baseline findings (B0-B11) were merged into the registry. Their IDs and grades as registered:

| Baseline | Registry ID | Severity | Phase | Status | Title (registry) |
|---|---|---|---|---|---|
| B0 | `LOAD-01` | high | 1 | confirmed | Missing, unreadable or empty data files read as 'nothing needs attention' for that area |
| B1 | `LOAD-02` | high (baseline said medium) | 1 | confirmed | A failed or slow load leaves a blank page: no loading state, no error message, no isolation between sections |
| B2, B3 | `UI-01` | medium | 2 | confirmed | Chart details can only be opened with a mouse hover: a tap on a phone shows nothing, gain dots are 3.9 px targets, and keyboard or screen-reader users cannot reach any chart detail |
| B4 | `UI-02` | medium | 2 | confirmed* | On a phone the 'Problem' and 'First step' columns are off-screen and budget differences are cut mid-number, with no cue that the table scrolls |
| B5 | `UI-03` | medium | 2 | confirmed* | Chart text renders at about 7 px on a phone |
| B6 | `UI-10` | low (baseline said medium) | 2 | confirmed | Keyboard focus is lost after activating a filter chip |
| B7 | `UI-11` | low | 2 | confirmed | Tooltips near the right or bottom edge are squeezed or open off-screen |
| B8 | `UI-12` | low | 2 | confirmed* | Small chart label collisions: the '3.0' tick overlaps 'lbs per day', and the T6 heading wraps on a phone |
| B9 | `UI-13` | low | 2 | confirmed* | Exception text shows raw ISO dates ('2026-07-20') while the rest of the page uses 'Jul 20' |
| B10 | `UI-07` | low | 1 | confirmed | Empty and zero wording: 'Nothing in all needs attention.', and '−0.0%', '−0%' and 'Under by $0' when exactly on budget |
| B11 | `UI-18` | low | 2 | plausible | 'Head on grass 375' counts 180 cow-calf pairs as 180 head |

\* No skeptic reviewed these. The registry marks them confirmed because the registrar re-ran `browser-check.mjs` on
2026-10-16 and measured the same result (`UI-13`: because the ISO dates appear verbatim in skeptic-quoted output).

Findings that section 3.3 links to the limits of the existing tests: `CSV-01` to `CSV-06`, `DATA-01`, `DATA-02`,
`LOAD-03`, `LOAD-04`, `WAT-01`, `WAT-02`, `TIME-01` to `TIME-03`, `GAIN-01`, `GAIN-02`, `HLTH-01`, `BUD-01`,
`BUD-02`, `TEST-01` and `TEST-02`. Findings that section 1 links to the structure: `UI-04`, `UI-05`, `UI-09`,
`SEC-01` and `LOAD-05`.

---

## 7. Unresolved assumptions and recommendations

### 7.1 Unresolved assumptions that touch this baseline

- How the GitHub Pages 404 page behaves is inferred from the local server, because the site was unreachable
  (registry `unresolved_assumptions`).
- Real-device touch behaviour and screen-reader announcements are untested (`UI-01`, `UI-10`).
- Firefox and WebKit rendering are untested.
- The stalled-load case is assumed to stay blank indefinitely. It was observed for 6 s, and the code has no timeout.
- Five baseline findings had no skeptic review (`UI-02`, `UI-03`, `UI-12`, `UI-13`, and `UI-18`, which is still
  only plausible).
- The time-zone pass covers the committed data only. It is not a general time-zone guarantee (`TIME-02`,
  `TIME-03`).

### 7.2 Recommendations from the baseline

These are recommendations, not verified results. They follow the registry's phases.

- **Phase 1 (fix now): never show "clear" when data is missing.** Fixes `LOAD-01` and `LOAD-02`:
  - Add a loading message to the static HTML.
  - Check each file's response and required columns.
  - Show a visible error that names the failed file.
  - Mark the affected area as CAN'T TELL.
  - Draw each page section in isolation, so one failure cannot blank the others.

  The `states-check.mjs` table in section 4.9 is the before-picture. After the fix, the 8 silent rows and the 24
  blank rows should all show a named file and a CAN'T TELL state.
- **Phase 1: strengthen the tests alongside the fixes.**
  - Add tests that kill the surviving water and grazing mutants (`TEST-01`, `TEST-02`).
  - Replace the parsing test that asserts blanket coercion (`CSV-06`, `CSV-04`).
  - Keep the "10 planted problems, same severities, no false alarms" tests as the acceptance bar.
- **Phase 2 (build next): fix the phone and keyboard gaps.**
  - Keyboard and touch access to chart details (`UI-01`).
  - Phone-friendly tables and chart text (`UI-02`, `UI-03`).
  - Chip focus (`UI-10`), tooltip placement (`UI-11`), label collisions (`UI-12`) and date format (`UI-13`).
- **Wording.** Until Phase 2 lands, the README's "works on a phone" and "Every chart has hover details" should not be
  read as covering touch or keyboard use of the charts.

---

## 8. How to re-run every diagnostic

All 42 scripts in `docs/audit/diagnostics/` are read-only: they never change tracked files. Scripts that need
different data copy the site to a temporary folder, or swap file contents in flight.

Before you start:

- Run every command from the repository root.
- You need Node 22 and python3.
- Browser scripts need Playwright. Most look for `$PLAYWRIGHT_PATH`, then the `playwright` package, then
  `/opt/node22/lib/node_modules/playwright/index.mjs`. A few import the `/opt/node22/...` path directly (noted below).
- Write outputs outside the repository.

```bash
cd /home/claude/ranch-ops-dashboard
OUT=$(mktemp -d)                                   # any folder outside the repo

# The repo's own checks
node --test tests/exceptions.test.mjs              # 8 tests
python3 scripts/generate_data.py && git diff --exit-code data/   # data matches the generator (CI does this)

# Only for the scripts marked "your server" below
python3 -m http.server 8801 --bind 127.0.0.1 --directory . &
```

**Server key** (used in the "Server" column of the tables below):

- **your server**: start the static server above first, and pass its URL.
- **own server**: the script starts `python3 -m http.server` itself, on the port shown, against a temporary copy of
  the site (or, where noted, the repo served read-only).
- **none**: Node only, no browser.

### 8.1 Baseline checks

| Script | Command | Server | Covers |
|---|---|---|---|
| browser-check.mjs | `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ "$OUT/browser"` | your server | `UI-01`, `UI-02`, `UI-03`, `UI-10`, `UI-11`, `UI-12`, `UI-13`, `UI-18`. An optional third argument is a folder for the four key screenshots. The baseline passed `docs/audit/screenshots`, and passing it again overwrites the committed screenshots. |
| states-check.mjs | `node docs/audit/diagnostics/states-check.mjs http://127.0.0.1:8801/ "$OUT/states"` | your server | `LOAD-01`, `LOAD-02`, `UI-07`. Writes `states-report.json` and the state screenshots. |

### 8.2 Defect reproductions (one per audit area)

Each prints `CASE` / `expected` / `actual` / `MATCH` or `MISMATCH`. A MISMATCH means the defect is present. Controls
should MATCH.

| Script | Command | Server | Covers |
|---|---|---|---|
| csv.repro.mjs | `node docs/audit/diagnostics/csv.repro.mjs` | none | 66 cases. `CSV-01` to `CSV-06`, `DATA-01` to `DATA-03`, `WAT-01`, `WAT-02`, `GAIN-01`, `GAIN-02`, `HLTH-01`, `BUD-02`, `BUD-03` |
| csv.browser.mjs | `node docs/audit/diagnostics/csv.browser.mjs [port] [workdir]` | own server (8821) | `LOAD-03`, `LOAD-04`, `CSV-01`, `CSV-02`, `CSV-04`, `WAT-01`, `WAT-02`, `GAIN-01`, `BUD-02` |
| time.repro.mjs | `node docs/audit/diagnostics/time.repro.mjs` | none | Re-runs itself under TZ=UTC, America/Chicago, America/Denver and Pacific/Auckland. `DATA-02`, `TIME-01`, `TIME-02`, `WAT-03`, `GAIN-03`, `BUD-01`, `UI-06` |
| time.browser.mjs | `node docs/audit/diagnostics/time.browser.mjs [port] [workdir]` | own server (8831) | `LOAD-03`, `LOAD-04`, `LOAD-05`, `DATA-02`, `TIME-02`, `BUD-01`, `UI-04`, `UI-05` |
| water.repro.mjs | `node docs/audit/diagnostics/water.repro.mjs` | own server for Part 2 (`WATER_REPRO_PORT`, 8840-8849; `WATER_REPRO_TMP`) | `LOAD-04`, `DATA-01`, `DATA-02`, `TIME-01`, `WAT-01` to `WAT-04`, `WAT-06` to `WAT-09`, `UI-04`. Part 2 is skipped if Playwright is missing. |
| grazing.repro.mjs | `node docs/audit/diagnostics/grazing.repro.mjs` | own server for Part 2 (`GRAZING_REPRO_PORT`, 8850-8859) | `DATA-01`, `GRZ-01` to `GRZ-09`, `UI-05`, `UI-06` |
| gain.repro.mjs | `node docs/audit/diagnostics/gain.repro.mjs` | own server for Part 2 (`GAIN_REPRO_PORT`, 8860-8869; `GAIN_REPRO_TMP`) | `LOAD-03`, `CSV-04`, `DATA-01`, `DATA-02`, `TIME-01`, `GAIN-01` to `GAIN-08`, `GAIN-10`, `GAIN-11`, `GAIN-13`, `GAIN-14` |
| healthbudget.repro.mjs | `node docs/audit/diagnostics/healthbudget.repro.mjs` | own server for Part 2 (`HB_REPRO_PORT`, 8870-8879; `HB_REPRO_TMP`) | `CSV-05`, `DATA-02`, `HLTH-01` to `HLTH-04`, `BUD-01` to `BUD-06`, `UI-06` to `UI-09`, `UI-17` |
| render.repro.mjs | `node docs/audit/diagnostics/render.repro.mjs` | none (imports the real app.js against a DOM stub and a stubbed fetch) | `LOAD-01` to `LOAD-04`, `CSV-06`, `WAT-01`, `BUD-03`, `SEC-01`, `UI-04`, `UI-05`, `UI-07` |
| render.browser.mjs | `node docs/audit/diagnostics/render.browser.mjs [scratchDir] [port]` | own server (8880; scratch defaults to `$RENDER_SCRATCH` or `<tmp>/render-audit`) | `SEC-01`, `UI-10`, `UI-11` |

### 8.3 Skeptic verification and the registrar's extra repro

Verdicts are recorded in `docs/audit/evidence/verify_<area>.json`.

| Script | Command | Server | Covers |
|---|---|---|---|
| csv.verify.mjs | `node docs/audit/diagnostics/csv.verify.mjs` | none | `LOAD-01`, `CSV-01` to `CSV-03`, `CSV-07`, `DATA-02`, `WAT-04` |
| csv.verify.browser.mjs | `node docs/audit/diagnostics/csv.verify.browser.mjs [port] [workdir]` | own server (8957) | `LOAD-01`, `LOAD-03`, `CSV-01`, `CSV-02`, `CSV-06`, `CSV-07` |
| time.verify.mjs | `node docs/audit/diagnostics/time.verify.mjs`, and `node docs/audit/diagnostics/time.verify.mjs --browser [port]` for the locale case | none; own server (8861) with `--browser` | `DATA-02`, `TIME-01`, `TIME-03`, `GAIN-03`, `BUD-06` |
| water.verify.mjs | `node docs/audit/diagnostics/water.verify.mjs` | Parts A and B none (Part B mutates a temp copy and runs the tests); Part C own server (`WATER_VERIFY_PORT`, 8876) | `TIME-01`, `WAT-05`, `WAT-10`, `UI-15`, `TEST-01` |
| grazing.verify.mjs | `node docs/audit/diagnostics/grazing.verify.mjs` | Part 1 none (child processes per TZ); Part 2 own server, repo served read-only on a free port | Grazing skeptic re-check (verify_grazing.json) |
| gain.verify.mjs | `node docs/audit/diagnostics/gain.verify.mjs` | none (own parser, no `parseCSV`) | Gain skeptic re-check (verify_gain.json) |
| gain.missed.mjs | `node docs/audit/diagnostics/gain.missed.mjs` | none | `CSV-01`, `CSV-04`, `DATA-02`, `GAIN-09`, `GAIN-11`, `GAIN-12` |
| gain.verify.browser.mjs | Serve a **copy** of `index.html`, `app.js`, `exceptions.js` and `data/` (as its header asks), e.g. `python3 -m http.server 8931 --bind 127.0.0.1 --directory <copy> &`, then `node docs/audit/diagnostics/gain.verify.browser.mjs http://127.0.0.1:8931/ [case]` | your server | Cases: `control`, `single`, `steers`, `blanktarget`, `naHeifer`, `naYearling`, `target175`, `dupPlus`, `dupMinus`, `dupEqual`, default `all`. `dupPlus` and `dupMinus` check for a page hang. Imports Playwright from `/opt/node22/...` only. `GAIN-02`, `UI-16` |
| healthbudget.verify.mjs | `node docs/audit/diagnostics/healthbudget.verify.mjs` | none | Health and budget skeptic re-check (verify_healthbudget.json) |
| healthbudget.verify.browser.mjs | `node docs/audit/diagnostics/healthbudget.verify.browser.mjs` | own server (env `PORT`, 8891; env `WORK`) | Budget tile, chart and table re-check |
| healthbudget.skeptic.mjs | `node docs/audit/diagnostics/healthbudget.skeptic.mjs` (set `TZ=...` to try other zones) | none | `CSV-05`, `HLTH-01` |
| healthbudget.skeptic.browser.mjs | `node docs/audit/diagnostics/healthbudget.skeptic.browser.mjs [scratchDir]` | own server (random port 8100-8999) | Budget tile, chart, table, tooltip and rules table under modified data |
| healthbudget.skeptic.missed.mjs | `node docs/audit/diagnostics/healthbudget.skeptic.missed.mjs` | own server for the browser case (random port 8600-8899) | `DATA-02`, `BUD-07`, `UI-17` |
| render.verify.browser.mjs | `node docs/audit/diagnostics/render.verify.browser.mjs <scratchDir> [port]` | own server (8931; scratch defaults to `/tmp/render-verify`) | Render skeptic re-check (verify_render.json) |
| render.skeptic.browser.mjs | `node docs/audit/diagnostics/render.skeptic.browser.mjs [scratchDir] [port]` | own server (8932) | `LOAD-05`, `CSV-04`, `UI-01`, `UI-14` |
| registry.extra.mjs | `node docs/audit/diagnostics/registry.extra.mjs` | none (Part 2 mutates a temp copy and runs the tests) | `GRZ-03`, `TEST-02` |

`render.verify.browser.mjs` and `gain.verify.browser.mjs` both default to port 8931. Run them one at a time, or pass
a different port.

### 8.4 Research diagnostics

These support research conclusions (`research_<topic>.json`, `rules.json`), not defects. They are listed so that
every script has a command.

| Script | Command | Server / network | Topic |
|---|---|---|---|
| water.research.mjs | `node docs/audit/diagnostics/water.research.mjs` | none | Water (capacities and intake are labelled assumptions) |
| grazing.rest.research.mjs | `node docs/audit/diagnostics/grazing.rest.research.mjs` | none | Grazing rest periods (`min_rest_days`) |
| grazing.forage.research.mjs | `node docs/audit/diagnostics/grazing.forage.research.mjs` | none | Grazing vs published recovery periods |
| gain.noise.research.mjs | `node docs/audit/diagnostics/gain.noise.research.mjs` | none | Gain: weighing noise sensitivity (assumed noise levels) |
| gain.evidence.research.mjs | `node docs/audit/diagnostics/gain.evidence.research.mjs` | none | Gain: thresholds against cited figures |
| health.research.mjs | `node docs/audit/diagnostics/health.research.mjs` | none | Health records and scheduling fields (no treatment logic) |
| health.schedule.research.mjs | `node docs/audit/diagnostics/health.schedule.research.mjs` | none | Health schedule windows (synthetic values) |
| budget.materiality.research.mjs | `node docs/audit/diagnostics/budget.materiality.research.mjs` | none | Budget: percent-and-dollar materiality (demo settings) |
| budget.fuel.pricevolume.research.mjs | `node docs/audit/diagnostics/budget.fuel.pricevolume.research.mjs` | none (reference prices are copied into the script) | Budget: fuel price vs volume (illustration only) |
| context.research.mjs | `node docs/audit/diagnostics/context.research.mjs` | none | Context data: fields, release timing, water days of supply |
| context.usdm-asof.research.mjs | `node docs/audit/diagnostics/context.usdm-asof.research.mjs` | none (rows copied into the script) | Which drought-map week belongs to as_of |
| context.cors.research.mjs | `node docs/audit/diagnostics/context.cors.research.mjs` | **needs open internet** | Whether a static page could fetch public sources. Its header: in the audit sandbox "every request failed before reaching the host ... So NO CORS header was observed in the audit". |
| workflow.research.mjs | `python3 -m http.server 8873 --bind 127.0.0.1 --directory . &` then `node docs/audit/diagnostics/workflow.research.mjs http://127.0.0.1:8873/ "$OUT/workflow"` | your server; `pdftoppm` for the by-hand print check | Workflow: freshness, scan load, print |
| workflow.usability.research.mjs | `python3 -m http.server 8862 --bind 127.0.0.1 --directory . &` then `node docs/audit/diagnostics/workflow.usability.research.mjs http://127.0.0.1:8862/ "$OUT/usability"` | your server; uses `pdfinfo` / `pdftoppm` if present | WCAG checks, storage, print. Its header's usage line names `workflow.research.mjs` by mistake; run it by its own name, as research_workflow.json does. |

### 8.5 What has been re-run

The registrar re-ran these on 2026-10-16 against the unchanged code, and every quoted output matched the evidence
(findings.json `spot_checks`). Where only some cases were re-run, they are named in brackets.

- Baseline checks: `browser-check` and `states-check` (health:404, loading, water:404).
- Reproductions:
  - `csv.repro` ("66 cases: 8 MATCH, 58 MISMATCH") and `csv.browser` (B-03).
  - `time.repro` (TIME-07, TIME-08, TIME-14) and `time.browser`.
  - `water.repro` (W-08 to W-10, B-02, B-05) and `grazing.repro` (G-01, GB-01).
  - `gain.repro` (GN-01, GN-04, GB-01, GB-07) and `healthbudget.repro` (H-01a, H-01b, BU-05, BU-06, AB-03, AB-07).
  - `render.repro` (R05-R12).
- Verification:
  - `csv.verify`, `csv.verify.browser` and `time.verify` (MISSED-1).
  - `water.verify` (V-M3, V-M4, Part B).
  - `gain.missed` (M1-M6) and `gain.verify.browser` (control, dupMinus).
  - `healthbudget.verify` (F1) and `healthbudget.skeptic.missed` (M1-M3).
  - `render.skeptic.browser` (M1-M4).
  - `registry.extra`.
- The unit tests: "8 pass, 0 fail".

The registry says these were **not** re-run by the registrar: "water.verify V-GAP (UI-15), render.repro R13 and
later cases, time.verify F4+ and F10+, render.browser scenarios." Some scripts are not named in the re-run record at
all: `gain.verify`, `grazing.verify`, `healthbudget.verify.browser`, `healthbudget.skeptic`,
`healthbudget.skeptic.browser`, `render.verify.browser` and the research scripts.
