# 01. Current implementation assessment and test results

This document records what the Ranch Operations Dashboard does today, how it is built, and what the baseline checks
showed before any change was made. It is the starting point for the rest of the audit.

The dashboard is a portfolio demonstration running on fictional data (Example Ranch). It is **not production-ready**,
and nothing in this document says otherwise. Every threshold in the code (25% / 40% tank level, 30-point drop,
24 hours of sensor silence, planned graze days, 2-day move grace, 80% / 50% of target gain, 2.0 / 1.0 lb daily gain
targets, 7 days to due, 5% / 10% over budget) is a demonstration setting to be tuned per ranch, not a validated
operating value.

## In short

- **On its own example data the dashboard works.** All 8 unit tests pass. The 10 planted problems show up worst
  first, each with a first step. The page gives the same report in six browser time zones.
- **When data is missing or broken, the page misleads.** In the 32 single-file failure scenarios, 8 showed the
  affected area as clear and 24 left a blank page. No scenario told the user that anything was wrong (`LOAD-01`,
  `LOAD-02`).
- **Chart details need a mouse.** A tap on a phone or a keyboard user gets nothing (`UI-01`). On a phone the
  **Problem** and **First step** columns sit off-screen (`UI-02`).
- **Passing the tests is a baseline, not proof.** The audit registered 83 findings against the same code, 18 of them
  high severity (section 3.3).
- **Some checks could not be run:** the published GitHub Pages site (the proxy returned 403), real phones and screen
  readers, and Firefox and WebKit (section 5).

## What was reviewed

| Item | Value |
|---|---|
| Repository | CowCampSTX/ranch-ops-dashboard |
| Commit reviewed | `cfd77e50a050163b542cadfc6b38882c0341e99d` (main), "Switch the dashboard to a black theme with green accents". The commit before it is `6d82b81` "Add ranch operations dashboard". |
| Work branch | `claude/project-thread-nu46kf`. At the baseline it was identical to main. findings.json `reviewed_commit`: "work branch claude/project-thread-nu46kf, whose later commits add only docs/audit files". |
| Worktree | baseline.json: "tracked files unchanged (\"git diff --stat\" empty); the only untracked path is docs/audit/." |
| Baseline run | 2026-10-15. The browser report's `ranAt` is 2026-10-15T18:08:26.848Z; that report is kept in session scratch space and is not committed. The registrar re-ran the main checks on 2026-10-16 with matching output (findings.json `spot_checks`). |
| Tools | node v22.22.0, Python 3.13.16 (regeneration), Playwright Chromium 141.0.7390.37 |
| Project guidance files | There is **no PROJECT_CONTEXT.md or AGENTS.md** in the repository. Behaviour was judged against README.md, the code and the committed data (findings.json `context_notes`). |

## How to read this document

The audit keeps four kinds of statement apart. This document is mostly the first kind.

1. **Verified findings.** These were reproduced, and the evidence is quoted from
   [`evidence/baseline.json`](evidence/baseline.json), the `audit_<area>.json` and `verify_<area>.json` files, or the
   registry [`data/findings.json`](data/findings.json). Finding IDs (for example `LOAD-01`) are the registry's stable
   IDs.
2. **Research conclusions.** These come with citations and live in `research_*.json`, `cite_*.json` and
   [`data/rules.json`](data/rules.json). This document uses them in two places only: the classification of the current
   rules (section 1.5), and three workflow measurements noted in section 4.8. Both are labelled.
3. **Recommendations.** These are marked as such (section 7.2) and follow the registry's phases.
4. **Unresolved assumptions.** These are listed in section 7.1.

---

## 1. How the code is structured and how data flows

### 1.1 Files at the reviewed commit

| File | Lines | Role |
|---|---|---|
| `index.html` | 118 | Page layout, styles, and an empty container for each section. The tooltip `<div id="tip">` carries `role="status"`. |
| `app.js` | 225 | Loads the CSVs, runs the rules, and draws the tiles, the exception table, the charts and the rules table |
| `exceptions.js` | 159 | `RULES`, `parseCSV`, `waterStatus`, `grazingStatus`, `gainStatus`, `budgetStatus` and `findExceptions`. These are pure functions shared by the page and the tests. |
| `data/*.csv` | 8 files | Fictional example data: pastures, groups, moves, weights, water, health, budget and meta |
| `scripts/generate_data.py` | 149 | Builds `data/` from a fixed seed, with 10 planted problems |
| `tests/exceptions.test.mjs` | 66 | 8 `node:test` tests |
| `.github/workflows/test.yml` | 18 | CI: regenerate the data, check that it matches, run the tests |
| `README.md` | 98 | Description, rule table, run instructions |
| Other | | `LICENSE`, `.nojekyll`, and three README images in `docs/` (`screenshot.png`, `water.png`, `grazing-gain.png`) |

There are no dependencies, no build step and no backend. `index.html` loads `app.js` as an ES module, and `app.js`
imports only `exceptions.js`.

### 1.2 The pipeline

```
data/*.csv  (8 files, fictional)
   |  app.js:221  Promise.all over the 8 files: fetch(`data/${f}.csv`), then res.text()
   |              (no res.ok check, no try/catch, a top-level await)
   v
parseCSV(text)                                              -- exceptions.js:22-34
   |  trim the text, split lines on \r?\n, split every line on ",",
   |  turn any number-looking cell into a Number, keep blank cells as ""
   v
d = { pastures, groups, moves, weights, water, health, budget, meta }
   |
   +--> findExceptions(d, RULES)                            -- exceptions.js:94-159
   |       as_of = d.meta[0].as_of
   |       grazingStatus(moves, pastures, as_of) -> open stays      (:54-61; also names who is at each tank)
   |       waterStatus(water, as_of)       -> water rows    (:39-52, rules :101-116)
   |       grazing rules                   -> grazing rows  (rules :118-125)
   |       gainStatus(weights, groups)     -> gain rows     (:64-80, rules :127-138)
   |       health loop (inline)            -> health rows   (:140-147)
   |       budgetStatus(budget)            -> budget rows   (:82-89, rules :149-156)
   |       sort by severity, then by area name A-Z          (:158)
   |       => exc = [{severity, area, subject, problem, action}, ...]
   |
   +--> app.js:223  the as-of line (textContent)
   +--> app.js:225  draw, in this order, with no isolation between sections:
           tiles(d, exc) -> exceptionsTable(exc) -> waterMultiples(d) -> grazingTimeline(d)
           -> gainStrip(d) -> budget(d) -> rules()
```

### 1.3 Points about the flow

All of these were read from the code and match the audit traces (`audit_csv.json`, `audit_time.json` and
`audit_render.json`, field `trace`).

- **One reader, no data contract.** `parseCSV` is the only parser. audit_csv trace: "There are no checks on schema,
  types, ranges, references or duplicates." A cell that looks like a number becomes a Number, IDs included
  ("007"→7). A blank cell stays `""`.
- **The page recomputes the summaries.** The tiles and charts call `waterStatus`, `gainStatus`, `grazingStatus` and
  `budgetStatus` again, separately from `findExceptions`. The "Water tanks OK" tile counts problem tanks by reading
  the tank ID back out of the alert's display text with `e.subject.split(" ")[1]` (app.js:47, `UI-04`).
- **Hard-coded content.** The "Yearling gain" tile looks up a group literally named `"Yearlings"` (app.js:48,
  `LOAD-03`). The grazing chart's month ticks are fixed to `2026-06-01` through `2026-09-01` (app.js:120, `UI-05`).
- **Two readings of `as_of`.** audit_time trace: the water rules read `as_of` as a date-time in the viewer's local
  time, while grazing and health use `as_of.slice(0,10)`, "which new Date() parses as UTC midnight". The header
  prints local time with no zone label (`TIME-02`, `TIME-03`, `LOAD-05`).
- **Rendering.** SVG chart labels and the as-of line use `textContent`, which is safe. The tiles, exception table,
  water headings, tooltips and budget table use `innerHTML`, and CSV text reaches `innerHTML` at 9 places
  (`SEC-01`).
- **Failure behaviour.** The load-and-draw block has no `try/catch`. audit_render trace: the draw calls "are
  synchronous and not isolated from each other, so a throw in one stops all the later ones" (`LOAD-02`, `LOAD-04`).

### 1.4 Worked example: the T4 leak

From the audit_render trace, with the values confirmed in the browser baseline:

1. `water.csv` holds T4's readings. The latest is 10% at 2026-09-30T18:00.
2. `waterStatus` finds the latest reading at least 24 hours older, which is 56%, so `drop24h = 46`.
3. `findExceptions` makes it critical. The subject is "Tank T4 (Lone Tree, Heifers here now)"; the group name comes
   from the open stays in `moves.csv`. The problem reads "Dropped 46 points in 24 hours, now 10%", and the first step
   "Check for a leak or a stuck float; haul water if it can't be fixed today".
4. The row is written into the table with `innerHTML`. The tile reads "Water tanks OK 5 of 8 / 3 need a look", the
   filter chip "Water (3)", and the T4 chart heading "10%".

### 1.5 The current rules and how the research classifies them

> **Research conclusion, not a baseline measurement.** Source: [`data/rules.json`](data/rules.json) via
> [`data/rules-index.json`](data/rules-index.json). Key: A = supported general guidance, B = context-dependent
> guidance, C = ranch-specific management choice, D = synthetic demonstration setting.

The thresholds live in one object, `RULES` (exceptions.js:5-16).

| Rule (current code) | Setting | Rule ID | Class |
|---|---|---|---|
| Tank critical when level is under 25% | `waterCritical: 25` | RULE-WAT-01 | C |
| Tank warning when level is under 40% | `waterLow: 40` | RULE-WAT-02 | C |
| Tank critical on a drop of 30+ points in 24 hours | `waterDropPts: 30` | RULE-WAT-03 | D |
| Tank serious after 24 hours with no reading; its level is then not judged | `sensorSilentHours: 24` | RULE-WAT-04 | C |
| (Gap) Water severity ignores whether cattle are on the pasture now | none | RULE-WAT-05 | C |
| Group serious when past its pasture's planned graze days | `planned_graze_days` per pasture | RULE-GRZ-01 | C |
| Group warning when a planned move is 2 days away or less | `graceDays: 2` | RULE-GRZ-02 | D |
| (Unused data) `pastures.csv` carries `min_rest_days`, but no code reads it | none | RULE-GRZ-03 | B |
| Group gain serious under 80% of target | `adgSerious: 0.8` | RULE-GAIN-01 | C |
| Animals under 50% of target listed (warning), unless the group is already serious | `animalShare: 0.5` | RULE-GAIN-02 | C |
| Yearling target 2.0 lb/day, heifer target 1.0, cows 0.0 (skipped) | `groups.csv` | RULE-GAIN-03, -04, -05 | D, D, D |
| Open health task past due is serious; due within 7 days is a warning | `dueSoonDays: 7` | RULE-HLTH-01, -02 | D, D |
| Open task with a blank due date, or a status other than exactly "open", is skipped silently | (code) | RULE-HLTH-03 | C |
| Budget serious over 10%, warning 5-10%, season to date | `budgetSerious: 0.10`, `budgetWarn: 0.05` | RULE-BUD-01, -02 | D, D |
| Severity shown by icon shape plus a word, not colour alone | `badge()` | RULE-WF-01 | A |
| Pointer targets at least 24x24 CSS px (passes) | chip size | RULE-WF-06 | A |
| Keyboard focus visible (passes in Chromium) | focus outline not suppressed | RULE-WF-07 | A |
| Every row carries a first step | action text | RULE-WF-09 | B |
| Duplicate and stale rows suppressed by design | `continue`, `!groupLow` | RULE-WF-19 | B |
| The as-of snapshot, the 10 planted problems and the 3 severity levels | demo data | RULE-WF-21 | D |

No ranch operating threshold in the current code is class A. The only current class-A rules (RULE-WF-01, -06 and
-07) are WCAG display criteria, not ranch thresholds (registry-changelog.md: "A current threshold classified A:
None").

---

## 2. What works well

These strengths were verified on the **committed example data**. Each one has a limit, noted beside it. The limits
are findings in their own right.

| Strength | Evidence | Limit |
|---|---|---|
| **Worst first, with a first step on every row.** | The test "worst first" passes. RULE-WF-09 evidence: "all 10 rows have a non-empty First step". | Within one severity, rows are sorted A-Z by area name, so the Budget rows head the serious block, above an overdue vaccination and a silent sensor (`UI-09`). |
| **Duplicate noise is suppressed.** A silent sensor is not also judged on its stale level, and a group-wide gain problem is not repeated for each animal. | The test "a silent sensor isn't also judged on its stale level" passes. audit_water C-09: a single row, "No reading for 30 hours; last level 10%". audit_gain: "On the committed data 32 of 45 heifers are under 0.5 (Python), yet only the serious Heifers row is shown." | The suppression works as designed, but a sensor that stopped less than 24 hours ago is still judged on its old reading and counted OK (`WAT-05`). |
| **Context in the alert.** A water alert names the pasture and the group drinking there. | The test "a water alert names the group drinking there" passes ("Tank T4 (Lone Tree, Heifers here now)"). audit_grazing control G-C5 names two groups: "Tank T4 (South Divide, Cows and Heifers here now)". | "here now" means "as of the data's as_of", which the wording does not say. The group name is lost with a stray space ("T4, P4", `CSV-05`), text in a move cell (`GRZ-03`) or an empty moves export (`LOAD-01`). |
| **Severity is never colour alone.** Octagon = Critical, triangle = Serious, circle = Warning, each followed by the word, in the severity colour. | `badge()` at app.js:36-41. RULE-WF-01 (class A, WCAG 2.2 SC 1.4.1) read the table as text: `bySeverity {"Critical":2,"Serious":6,"Warning":2}`. | Chart details have no keyboard or touch path (`UI-01`). |
| **The arithmetic is right on the committed data.** | audit_time: "T6: last reading Sep 29 00:00 → as_of Sep 30 18:00 = 42 h"; "Yearlings: in Sep 6, as of Sep 30 = 24 days"; "Fuel 11,640 vs 9,600 → '21% over season to date ($2,040)'". audit_gain, from an independent Python calculation: Heifers "1119/2565 = 0.436257". Baseline: five tooltip samples match a separate Python calculation (section 3.1). | Only clean, regular data was checked here. Messy data is covered in section 3.3. |
| **The committed data gives the same report in every viewer time zone.** | Baseline: six browser zones, each "sameRowsAsBaseline=true sameTiles=true". audit_time: "TIME-C1, 10 rows, hash c4a56d0f" in four node zones, and "The unit tests pass 8/8 under Chicago and Auckland too." | This holds for the committed data shapes only. A date-only as_of, UTC-stamped readings or a UTC as_of do shift the results (`TIME-02`, `TIME-03`). |
| **Deterministic example data.** The generator uses a fixed seed and lists its planted problems in `PLANTED`. | Baseline: an isolated clone regenerated byte-identically. Two more runs, under different hash seeds and time zones, left the diff empty, with matching aggregate hashes. | The generator writes with Python's `csv.writer`, which quotes fields that contain commas, but `parseCSV` cannot read quotes. The registry calls this mismatch "latent today because the committed data has no commas or quotes" (`CSV-01`). |
| **CI guards the data and the rules.** | `.github/workflows/test.yml` runs `python scripts/generate_data.py && git diff --exit-code data/`, then `node --test tests/exceptions.test.mjs` (Node 22, Python 3.12) on every push and pull request. | CI runs only the unit tests: no browser check and nothing in `app.js`. audit_time: "CI runs in UTC, so tests cannot catch a problem a Central-time viewer sees." No evidence file records the CI run history on GitHub. |
| **Simple, inspectable architecture.** | No dependencies, no build step, no backend. The rules are pure functions shared by the page and the tests. | Tiles, tables and tooltips use `innerHTML` with CSV text (`SEC-01`). |
| **The data stays labelled as fictional.** | Baseline: the as-of line reads "Example Ranch (fictional), 4,300 acres in 8 pastures..." and the footer "Example Ranch and all of its data are fictional, generated by scripts/generate_data.py", with `fictionalLabel=true` at both viewports. "The footer stays visible even when loading fails." | None found. |

---

## 3. Automated results

All quotes below come from [`evidence/baseline.json`](evidence/baseline.json) (`automated`) unless another file is
named. `<scratch>` is the audit's session scratch folder; nothing there is committed.

### 3.1 Commands and outputs

| Check | Command | Result | Quoted output |
|---|---|---|---|
| Branch and commit | `git -C /home/claude/ranch-ops-dashboard rev-parse HEAD; git branch --show-current; git status --porcelain` | pass | "cfd77e50a050163b542cadfc6b38882c0341e99d / claude/project-thread-nu46kf / porcelain was empty at the start. At the end porcelain shows only \"?? docs/audit/\"." |
| **Unit tests** | `cd /home/claude/ranch-ops-dashboard && node --test tests/exceptions.test.mjs` (node v22.22.0) | **pass (8/8)** | "# tests 8 / # suites 0 / # pass 8 / # fail 0 / # cancelled 0 / # skipped 0 / # todo 0 / # duration_ms 167.849356" |
| **Regeneration in an isolated clone is byte-identical** | `git clone -q /home/claude/ranch-ops-dashboard <scratch>/audit/baseline/regen && cd regen && python3 scripts/generate_data.py && git status --porcelain && git diff --stat data/` (Python 3.13.16) | pass | "Clone HEAD cfd77e50a050163b542cadfc6b38882c0341e99d; generator printed \"wrote 8 files to .../regen/data\"; the \"--- status:\" and \"--- diff stat:\" sections were both empty, followed by \"(end diff)\"." |
| Generator is deterministic under another hash seed and time zone | `PYTHONHASHSEED=12345 TZ=Pacific/Auckland python3 scripts/generate_data.py && git status --porcelain && git diff --stat data/`; `PYTHONHASHSEED=random TZ=America/Denver python3 scripts/generate_data.py && git diff --exit-code data/`; `sha256sum data/*.csv \| sha256sum` in the clone and the repo | pass | "Both runs left the status and diff empty. The second printed \"exit=0\". Aggregate hashes matched: clone \"37c0da714cd52d1068f257cac344904c3d92e65f16e563f2247d3934b9a80519  -\", repo \"37c0da714cd52d1068f257cac344904c3d92e65f16e563f2247d3934b9a80519  -\"." |
| Browser diagnostic, desktop 1280x900 | `python3 -m http.server 8801 --bind 127.0.0.1 --directory /home/claude/ranch-ops-dashboard &` then `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ <scratch>/audit/baseline/out docs/audit/screenshots` (chromium 141.0.7390.37) | pass for load, errors and counts; **fail** for keyboard access to charts and tooltip edge placement | "errors: console=0 page=0 requestfailed=0 status>=400=0 []"; "rows: exceptions=10 budget=6 rules=11 waterMinis=8 charts=11 fictionalLabel=true"; "chips: All (10)->10 \| Water (3)->3 \| Grazing (1)->1 \| Gain (2)->2 \| Health (2)->2 \| Budget (2)->2"; "page overflow: 1280/1280"; "keyboard tooltips: {\"tabStopsInsideCharts\":0,\"tooltipShownOnAnyFocus\":false}"; "edge rightEdgeWater: insideViewport=false"; "edge bottomEdgeBudget: insideViewport=false" |
| Browser diagnostic, phone 390x844 (isMobile, hasTouch, device scale factor 2) | same run, second viewport | pass for load and counts; **fail** for touch tooltips, chart text size and table columns | "errors: console=0 page=0 requestfailed=0 status>=400=0 []"; "page overflow: 390/390 exceptions: scrolls=true cut=[Problem,First step]; budgetTable: scrolls=true cut=[Difference]"; "chart text (effective px): mini:7 ... grazing:6.8 gain:6.8 budgetChart:6.8"; "tap gain: target=3.9x3.9px tipVisible=false \"\"" |
| Loading, missing-data, error, all-clear and time-zone states | `node docs/audit/diagnostics/states-check.mjs http://127.0.0.1:8801/ <scratch>/audit/baseline/states` | **fail** for missing, error and loading states; pass for time zones | "Missing or garbled data was silently reported as all-clear in 8 of 32 file scenarios, e.g. \"[health:404] ready=true pageErrors=0 rows=8 warnsUser=false ... Health (0)  <-- SILENT ALL-CLEAR\". The other 24 ended with \"ready=false pageErrors=1\". Loading showed \"loadingText=false\"." Details in section 4.9. |
| Tooltip values match the CSVs | An independent Python script reading `data/weights.csv`, `budget.csv`, `water.csv` and `moves.csv` | pass | "H026: weights 1130 (2026-07-20) to 1136 (2026-09-15), adg 0.10526 over 57 days, which matches the tooltip \"H026 (Heifers) / 0.11 lbs/day, Jul 20 to Sep 15 / Now 1136 lbs / Under half of target\". Repairs: budget 7200, actual 9000, matching \"Budget $7,200 / Actual $9,000 / Over by $1,800\". T4 last row 2026-09-30T18:00 10.0 matches \"Sep 30, 6 PM: 10%\". T8 84.5 matches. Yearlings P3 in 2026-09-06 gives 24 days, matching \"Sep 6 to now (24 days) / Plan: 21 days\"." |

The registrar re-ran the unit tests on 2026-10-16: "node --test tests/exceptions.test.mjs: 8 pass, 0 fail"
(findings.json `spot_checks`).

### 3.2 What the 8 tests check

| Test | What it asserts |
|---|---|
| finds every problem planted in the data | The T4 leak, T6 silent, T2 low, yearlings over plan, heifers under target, 6 slow yearlings, booster overdue, pinkeye due soon, fuel and repairs over, each with its severity |
| and nothing else | Exactly 10 rows on the committed data |
| worst first | Severity never increases down the list |
| a silent sensor isn't also judged on its stale level | One T6 row |
| a water alert names the group drinking there | The T4 subject includes "Heifers here now" |
| water rules at their thresholds | A 35-point drop gives one water row (its severity is not checked); 39% gives a warning; 41% gives nothing; 24% gives a critical; a last reading 26 hours old gives a serious |
| summaries | 8 tanks; open stays for Cows, Heifers and Yearlings; gain head counts [45, 150]; Fuel variance 2040 |
| CSV parsing keeps text as text and numbers as numbers | `parseCSV("a,b,c\nP1,12.5,\n")` equals `[{ a: "P1", b: 12.5, c: "" }]` |

The tests cover the committed example data, the generator's planted problems and a few water levels. There is no
test for `app.js`, the loading path, the grazing, health or budget boundaries, or any malformed input.

### 3.3 Passing these tests is a baseline, not proof

**Passing the existing tests shows that the dashboard handles its own clean example data. It does not show that the
dashboard handles real-world data.** The registry holds 83 findings (findings.json `counts`: 18 high, 28 medium,
37 low; 59 confirmed, 23 design limitations, 1 plausible). All of them were reproduced or observed against the same
reviewed code on which the 8 tests pass. audit_csv summary: "The committed data is clean and the dashboard handles it
correctly: 8 of 8 tests pass and there are 10 alerts. Real exports are different."

Examples of what the tests do not catch:

- **Messy but ordinary CSV input.** `csv.repro.mjs` ran "66 cases: 8 MATCH, 58 MISMATCH" (findings.json
  `spot_checks`). See `CSV-01` (quotes and line endings), `CSV-02` (blank and repeated-header rows), `CSV-03`
  (column names), `CSV-04` (blank cells), `CSV-05` (stray spaces), `CSV-06` (number-looking IDs), `DATA-01` (unknown
  references), `DATA-02` (dates), `WAT-01` (fault codes in levels), `HLTH-01` (status spelling), `BUD-01` (months
  after as_of), `BUD-02` (money text), and `GAIN-01` and `GAIN-02` (single or same-day weigh-ins).
- **Missing or failed files.** The page shows an area as clear, or goes blank (`LOAD-01`, `LOAD-02`, `WAT-02`).
- **Group names and history.** The page shows no alerts when the yearlings are renamed or shipped (`LOAD-03`). The
  water charts and every section drawn after them fail when a tank has no reading in 7 days (`LOAD-04`).
- **Time.** Rows dated after as_of are used as current (`TIME-01`), and there is no time-zone contract (`TIME-02`,
  `TIME-03`).
- **The tests cannot catch a broken rule.** The audit ran the suite against deliberately broken copies of the rules.
  With the "don't judge a silent tank" line removed, the suite still passes: "SURVIVES silent tank also judged
  (continue removed) (pass 8, fail 0)". Six more broken water rules also pass (`TEST-01`). No test covers the grazing
  boundaries: "SURVIVES grace boundary >= -> > (pass 8, fail 0)" (`TEST-02`).
- **One test locks in a defect.** The parsing test asserts the blanket number coercion; the registry location for
  `CSV-06` cites "tests/exceptions.test.mjs:64-66 (a test asserts the blanket coercion)". The same test expects a
  blank cell to come back as `""`, which is the behaviour `CSV-04` reports. Fixing either one means changing this
  test, not just adding to it.

---

## 4. Manual browser observations

Quotes come from [`evidence/baseline.json`](evidence/baseline.json) (`manual`) unless another file is named. The setup
was Playwright Chromium 141.0.7390.37 at two sizes: desktop 1280x900, and a phone at 390x844 with `isMobile`,
`hasTouch` and device scale factor 2. The page was served by `python3 -m http.server`.

### 4.1 Summary

| Check | Result | Related findings |
|---|---|---|
| Desktop layout | partial | `UI-12` |
| Phone layout | fail | `UI-02`, `UI-03`, `UI-12`, `UI-13` |
| Every filter chip and its count | pass (focus is lost after use) | `UI-10` |
| Every chart renders | pass | none |
| Tooltip content (desktop hover) | partial: values correct, edge placement wrong | `UI-11` |
| Console errors and failed requests | pass: none at either size | none |
| Keyboard order | partial | `UI-01`, `UI-10` |
| Focus visibility on chips | pass | none |
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

Screenshots: [desktop full page](screenshots/desktop-full.png), [gain tooltip](screenshots/desktop-tooltip-gain.png).

### 4.3 Phone layout (390x844)

- The page itself does not scroll sideways ("390/390").
- The exception table hides **Problem** and **First step**: "scrollWidth 413 vs 316". The budget table cuts
  **Difference**: "the screenshot shows \"+$1,80\" and \"DIFFERENC\"" (`UI-02`).
- Chart text renders at "6.8 to 7.0 CSS px" (`UI-03`).
- "The T6 header wraps to 2 lines (height 40.3 vs 20.1), so the T6 chart sits lower than T5's. The gain tick '3.0'
  overlaps 'lbs per day' (12 px2)" (`UI-12`).
- Exception dates wrap as "2026-" / "07-20" (`UI-13` verifier).

Screenshot: [phone full page](screenshots/phone-full.png).

### 4.4 Filters

"On both viewports every label count equals the visible rows: All 10, Water 3, Grazing 1, Gain 2, Health 2, Budget 2.
Exactly one chip has aria-pressed=true, and areasShown matches the chip. After every click, activeElement is \"body\"
(focus is lost)." The lost focus is `UI-10`. The real data has no chip with zero rows, so the empty state was tested
in the all-clear scenario (section 4.9).

### 4.5 Charts and tiles

"11 charts at both sizes: 8 water minis, grazing, gain and budget. T6 shows 'no signal' with a shaded 'no data' band.
Budget table has 6 rows, rules table 11. Tiles read: Needs attention 10, Head on grass 375, Water tanks OK 5 of 8,
Yearling gain 1.94 lbs/day, Spend vs budget +1.0%."

The "Head on grass 375" tile counts 180 cow-calf pairs as 180 head. This is graded plausible: a domain wording
judgement that no skeptic reviewed (`UI-18`).

The 10 rows on the committed data, as drawn in the baseline run (states-check `baseline` scenario, raw report):

| Severity | Area | What | Problem | First step |
|---|---|---|---|---|
| Critical | Water | Tank T2 (Windmill) | Down to 11.8% full | Check the float and the supply line today |
| Critical | Water | Tank T4 (Lone Tree, Heifers here now) | Dropped 46 points in 24 hours, now 10% | Check for a leak or a stuck float; haul water if it can't be fixed today |
| Serious | Budget | Fuel | 21% over season to date ($2,040) | Find what drove it and decide whether to re-forecast |
| Serious | Budget | Repairs | 25% over season to date ($1,800) | Find what drove it and decide whether to re-forecast |
| Serious | Gain | Heifers | 0.44 lbs/day since 2026-07-20 vs 1.0 target | Check forage quality and mineral; look for a health problem in the group |
| Serious | Grazing | Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over) | Move them, or check the grass and record a new move date |
| Serious | Health | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15) | Schedule it this week |
| Serious | Water | Tank T6 (Cedar Draw) | No reading for 42 hours; last level 98.5% | Check the tank by eye today, then the sensor battery and signal |
| Warning | Gain | 6 yearlings | Under 1.0 lbs/day: Y027, Y031, Y058, Y082, Y129, Y132 | Pull and check these animals at the next gather |
| Warning | Health | Cows: Pinkeye check | Due in 3 days (2026-10-03) | Plan it with the next gather |

These are the 10 planted problems. The registry's Phase 1 acceptance bar is that they are "still found with the same
severities, with no new false alarms on the committed data" (findings.json `policies.phase_1_acceptance`). Finding
them shows the rules find what the generator planted; it does not validate the thresholds (RULE-WF-21 phase note).

### 4.6 Tooltips (desktop hover)

All five sampled values are correct (section 3.1). Two placements are wrong (`UI-11`):

- "The water tooltip on the right-hand column renders 53 px wide and 179 px tall, one word per line, with its right
  edge at 1281.66 (past 1280)."
- "A budget tooltip near the bottom of the viewport opens at top 893.7, bottom 992.3, with innerHeight 900."

### 4.7 Console errors and failed requests

At both viewports: "errors: console=0 page=0 requestfailed=0 status>=400=0 []".

### 4.8 Keyboard, focus and touch

- **Tab order: partial.** "Desktop: the 6 chips in DOM order, then focus leaves the page (step 7 \"body\"). Phone:
  the 6 chips, then 2 div.scroll table containers (Chromium makes scrollers focusable), then body. Nothing else is
  focusable."
- **Focus after activating a chip.** "After Enter on Water, active becomes \"body\" and the next Tab goes to \"All
  (10)\", so focus is lost after activation" (`UI-10`).
- **Focus visibility: pass.** "The outline is not suppressed. Focused: outlineStyle \"auto\" ..." The pressed "All"
  chip scored lower on the pixel metric (3.19 desktop, 2.06 phone), but "In the screenshots the white ring is still
  clearly visible against the black page, so I count it as visible." The registry lists this under
  `unregistered_observations`, not as a finding. Screenshot: [focused chip](screenshots/desktop-focus-chip.png).
- **Chart details by keyboard: fail.** "focusableDescendants = 0 and svgFocusable = false for all 11 charts.
  tabStopsInsideCharts 0, tooltipShownOnAnyFocus false. Each chart is role=img with a generic aria-label such as
  \"Average daily gain per animal by group\". The budget chart is the only one with an equivalent data table."
  (`UI-01`)
- **Touch: fail.** "No tooltip appeared for any of them: tipVisible=false with empty text. Rendered target sizes:
  gain dot 3.9x3.9 px, budget bar 86x10.2, grazing bar 52.1x14.7, water hit area 132.4x48.8. The page text still says
  \"Hover a dot for the tag.\"" The README says "Every chart has hover details" and that the page "works on a phone";
  for the charts, that does not hold on a touch screen (`UI-01`).

Three later browser measurements come from the workflow research (`research_workflow.json`, Chromium only). They are
**research observations recorded under rules, not baseline findings**:

- The custom tooltip is not dismissed by Escape and cannot be hovered: "shownAfterEscape": true,
  "shownAfterMovingPointerOntoTooltip": false (RULE-WF-03).
- A filter change is not announced to assistive technology: "liveRegionTextChanged": false (RULE-WF-05).
- The default print ran to "pdfPages": 4, and the main text printed at "2.71:1 on white" (RULE-WF-17).

### 4.9 Loading, empty, missing-data and error states (states-check)

`states-check.mjs` changes the responses in flight with `page.route`, so no file on disk is touched. baseline.json
describes it as "40 scenarios via page.route". Its raw report (`states-report.json`, listed in baseline.json, kept in
session scratch space and not committed) holds 42 entries:

- the unmodified baseline
- `loading` (every CSV delayed 3 s, snapshot at 1 s) and `stalled-water` (water.csv never answers, snapshot at 6 s)
- 32 per-file failures: 8 files x `404`, `abort`, `garbage` and `header-only`
- `all-clear`
- 6 time zones

**Loading: fail (`LOAD-02`).** "The user sees the header, the section headings and notes, empty cards, an empty
as-of line and no tiles. There is no loading text or spinner (loadingText=false). The stalled case looks identical
after 6 s and would stay that way indefinitely." The "indefinitely" is an inference: the case was watched for 6 s,
and the code has no timeout.

**Per-file failures: 8 silent all-clears, 24 blank pages, 0 visible messages.** Cells come from the raw report.
"Blank" means `ready=false` with one uncaught page error, and the quoted text is that error. "Silent" means the page
rendered normally with the area at zero.

| File | 404 (server's real 404 page) | abort (network failure) | garbage (200, not a CSV) | header-only (200, no rows) |
|---|---|---|---|---|
| pastures | blank: "(reading 'name')" | blank: "Failed to fetch" | blank: "(reading 'name')" | blank: "(reading 'name')" |
| groups | blank: "(reading 'toLowerCase')" | blank: "Failed to fetch" | blank: "(reading 'toLowerCase')" | blank: "(reading 'adg')" |
| moves | blank: "(reading 'name')" | blank: "Failed to fetch" | blank: "(reading 'name')" | **silent**: "Grazing (0)", "All (9)" |
| weights | blank: "(reading 'localeCompare')" | blank: "Failed to fetch" | blank: "(reading 'localeCompare')" | blank: "(reading 'adg')" |
| water | blank: "(reading 'localeCompare')" | blank: "Failed to fetch" | blank: "(reading 'localeCompare')" | **silent**: "Water (0)", "Water tanks OK: 0 of 0 (0 need a look)" |
| health | **silent**: "Health (0)", "All (8)" | blank: "Failed to fetch" | **silent**: "Health (0)" | **silent**: "Health (0)" |
| budget | **silent**: "Budget (0)", "Spend vs budget: −NaN% ($NaN of $NaN, season to date)" | blank: "Failed to fetch" | **silent**: same as 404 | **silent**: "Budget (0)", "Spend vs budget: −NaN% ($0 of $0, season to date)" |
| meta | blank: "(reading 'slice')" | blank: "Failed to fetch" | blank: "(reading 'slice')" | blank: "(reading 'as_of')" |

What the silent cases hide, from baseline.json and the raw report:

- **health:404** shows "Needs attention: 8 (2 critical, 5 serious, 1 warning)". The only trace is a console line:
  "Failed to load resource: the server responded with a status of 404 (File not found)". baseline.json: "The overdue
  yearling booster and the pinkeye check disappear from the morning list while the page looks normal and the as-of
  line is intact."
- **water:header-only** shows "Needs attention: 7 (0 critical, 5 serious, 2 warning)": both critical tank alerts
  disappear, and no water charts are drawn.
- **moves:header-only** shows "Grazing (0)", the T4 row loses its group ("Tank T4 (Lone Tree)"), and the console
  logs SVG errors such as "Error: <line> attribute x1: Expected length, \"NaN\"."

The raw report has `tellsUserSomethingIsWrong=false` in all 42 entries. For the garbage cases, baseline.json says:
"No case shows the user any error text (warnsUser=false in all of them)."

The registry grades the silent all-clear high (`LOAD-01`) and the blank page high (`LOAD-02`). The baseline had
graded the blank page medium; the registry took the verified high from verify_render (findings.json
`policies.severity`). The `groups` and `weights` header-only failures come through the hard-coded Yearlings tile
(`LOAD-03`).

**Empty (all-clear) state: partial (`UI-07`).** The data was edited in flight so that no rule fires. "All chips show
(0) and the tile reads \"Needs attention: 0 (0 critical, 0 serious, 0 warning)\". The messages are \"Nothing in all
needs attention.\" and \"Nothing in water needs attention.\" (and the same for each other area). The tile reads
\"Spend vs budget: −0.0% ($88,400 of $88,400 ...)\". It works, but the copy is awkward."

**Time zones: pass, on the committed data.** "Identical in every zone: \"Data as of September 30, 2026 at 6:00 PM.\",
with sameRowsAsBaseline=true and sameTiles=true." The zones were UTC, America/Chicago, America/Los_Angeles,
Pacific/Auckland, Asia/Kolkata and Pacific/Kiritimati. Other data shapes (a date-only or UTC-stamped as_of, or UTC
readings) do change the results (`TIME-02`, `TIME-03`).

### 4.10 Screenshots

Committed: [desktop-full.png](screenshots/desktop-full.png), [phone-full.png](screenshots/phone-full.png),
[desktop-focus-chip.png](screenshots/desktop-focus-chip.png),
[desktop-tooltip-gain.png](screenshots/desktop-tooltip-gain.png).

The state screenshots (`state-loading.png`, `state-stalled-water.png`, `state-health-404.png`,
`state-water-header-only.png`, `state-all-clear.png`, `state-meta-404.png`), the edge-tooltip and focus screenshots,
and the per-card phone screenshots are listed in baseline.json but were saved to session scratch space and are not
committed. Re-run the commands in section 8 to regenerate them.

---

## 5. Blocked checks

These checks could not be done in the audit environment. Their results are **unknown**, not passed.

| Check | Why it was blocked | What stays unverified |
|---|---|---|
| Published GitHub Pages site, https://cowcampstx.github.io/ranch-ops-dashboard/ | The environment's network proxy refused it. baseline.json: "A single plain curl -m 20 returned \"curl: (56) CONNECT tunnel failed, response 403\" (http_code=000). I made no attempt to bypass it." | The live deployment's paths, its 404 page and caching. `LOAD-02`'s statement about the live site is an inference from the local server. |
| Real mobile browsers (iOS Safari, Android Chrome) and screen readers (VoiceOver, TalkBack) | "Only Playwright Chromium 141 with isMobile/hasTouch emulation was available." | Real-device tap behaviour, and how the `role=status` tooltip is announced (`UI-01`, `UI-10`). |
| Firefox and WebKit rendering | "Only Chromium was run." | Layout, focus rings and print output in other engines. |

Also not done (not blocked, but outside the baseline run):

- No evidence file records a check of the CI run history on GitHub. Only the workflow file was read.
- No user testing was done. The "2-minute morning review" is a design target, not a measured result
  (research_workflow.json caveats: "No user testing was done; the '2-minute review' is a design target.").
- No spreadsheet program was run, so whether Excel rewrites the ISO timestamps is unverified (`DATA-02`; registry
  `unresolved_assumptions`).

---

## 6. Findings this baseline produced, and related findings

### 6.1 Baseline findings in the registry

Twelve baseline findings (B0-B11) were merged into the registry (findings-map.json). Their IDs and grades as
registered:

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

\* No skeptic reviewed these four. The registry marks them confirmed because the measurement was reproduced: the
registrar re-ran `browser-check.mjs` on 2026-10-16 for `UI-02`, `UI-03` and `UI-12`, and for `UI-13` "the ISO dates
appear verbatim in skeptic-quoted output in every area" (each entry's `status_note`). `UI-18` stays plausible.

### 6.2 Every finding referenced in sections 1-7

Generated from [`data/findings-index.json`](data/findings-index.json). Full entries are in
[`data/findings.json`](data/findings.json).

| ID | Severity | Status | Phase | Title |
|---|---|---|---|---|
| `LOAD-01` | high | confirmed | 1 | Missing, unreadable or empty data files read as 'nothing needs attention' for that area |
| `LOAD-02` | high | confirmed | 1 | A failed or slow load leaves a blank page: no loading state, no error message, no isolation between sections |
| `LOAD-03` | high | confirmed | 1 | The hard-coded 'Yearlings' tile throws before the exception table is drawn (group renamed or shipped, not yet weighed, or a bad target) |
| `LOAD-04` | medium | confirmed | 1 | A tank with no reading in the last 7 days crashes the water charts and every section drawn after them |
| `LOAD-05` | low | design-limitation | 2 | No data-age check: an old export is shown as the current report, and the as-of line has no time zone |
| `CSV-01` | high | confirmed | 1 | The CSV reader is not RFC 4180: quoted commas shift columns, quotes stay in the text, and CR-only or doubled-CR line endings break whole files |
| `CSV-02` | high | confirmed | 1 | Blank, whitespace-only, ',,,' and repeated-header rows are read as records: false critical alerts or a blank page |
| `CSV-03` | high | confirmed | 1 | No column checks: a renamed, misspelled or space-padded header, or a vendor title line above the header, silently turns a rule off |
| `CSV-04` | high | confirmed | 1 | Blank cells are kept as '' instead of 'missing', so they act as 0 or join as text: a blank weight hides the heifer alert or flags a healthy animal, and blank head or acres cells give absurd headline numbers |
| `CSV-05` | high | confirmed | 1 | Cells and keys are not trimmed: a stray space in a pasture ID ('P3 ') blanks the page, 'T4, P4' drops which group drinks at the leaking tank, and 'open ' hides every health task |
| `CSV-06` | high | confirmed | 1 | Number-looking IDs, tags, group names and dates are turned into numbers: tags merge, pastures collide, and a digits-only group name blanks the page |
| `DATA-01` | high | confirmed | 1 | Unknown pasture, tank or group references crash the page or silently drop data |
| `DATA-02` | high | confirmed | 1 | Dates and times are never validated or parsed once: day-first, impossible, numeric, space-separated or M/D/YYYY values silently drop alerts, invent alerts or crash |
| `TIME-01` | medium | confirmed | 1 | Rows dated after as_of are used as current: a later reading hides a silent sensor, a back-dated report shows problems that had not happened yet, and later weigh-ins change the gain period |
| `TIME-02` | medium | confirmed | 1 | No time-zone contract: a date-only as_of, UTC-stamped readings and daylight-saving days make silent hours, the 24-hour drop and the header depend on the viewer's zone |
| `TIME-03` | medium | confirmed | 1 | A UTC-stamped as_of shifts every calendar-day count by one day for evening exports, the same way for every viewer |
| `WAT-01` | high | confirmed | 1 | Tank levels are never validated: a fault code ('ERR', 'NaN', '11.8%') hides a critical tank as fine, and a blank, -999 or 140 reading raises a false critical leak |
| `WAT-02` | high | design-limitation | 1 | There is no tanks master list: a tank with no readings in the export, or an empty water file, disappears and the page reports water as fine |
| `WAT-05` | medium | design-limitation | 2 | A tank whose sensor stopped less than 24 hours ago is judged on its old reading and counted OK, with no sign of how old the shown level is |
| `GRZ-03` | medium | confirmed | 1 | Text or blanks in move and plan cells ('-', 'TBD', '21 days', a blank in_date or plan) silently remove the grazing alert, strip 'here now' from the T4 leak, or blank the whole rotation chart |
| `GAIN-01` | high | confirmed | 1 | An animal with only one weigh-in crashes the rules and the page shows no alerts at all |
| `GAIN-02` | high | confirmed | 1 | A same-day duplicate weigh-in (scale re-check or EID double read) gives +-Infinity or NaN gain: the group alert is lost or garbled and the page can hang |
| `HLTH-01` | high | confirmed | 1 | A health task is shown only when its status is exactly 'open': 'Open', 'OPEN' or an unlisted status such as 'in progress' silently drops an overdue vaccination |
| `BUD-01` | high | confirmed | 1 | Budget 'season to date' ignores the month column and as_of: future plan rows hide both real overspends, a blank or lagging month changes the total, and a mid-month as_of compares part of a month with a full month's budget |
| `BUD-02` | high | confirmed | 1 | Budget amounts are not read as money: a blank, '(300)' or '$3000' cell turns totals into joined text, erases real overspend alerts and puts $884,000, e+22% or NaN on the headline tile |
| `SEC-01` | medium | confirmed | 1 | CSV text is written into the page with innerHTML at 9 places: markup in a pasture, tag or group name runs script, can empty the alert table, and plain '<' text silently deletes alert context |
| `UI-01` | medium | confirmed | 2 | Chart details can only be opened with a mouse hover: a tap on a phone shows nothing, gain dots are 3.9 px targets, and keyboard or screen-reader users cannot reach any chart detail |
| `UI-02` | medium | confirmed | 2 | On a phone the 'Problem' and 'First step' columns are off-screen and budget differences are cut mid-number, with no cue that the table scrolls |
| `UI-03` | medium | confirmed | 2 | Chart text renders at about 7 px on a phone |
| `UI-04` | low | confirmed | 1 | The 'Water tanks OK' tile re-reads tank IDs from the alert text and undercounts when tank names share a first word ('Well 2', 'Well 4') |
| `UI-05` | low | confirmed | 1 | Grazing timeline month ticks are hard-coded to June-September 2026 |
| `UI-07` | low | confirmed | 1 | Empty and zero wording: 'Nothing in all needs attention.', and '−0.0%', '−0%' and 'Under by $0' when exactly on budget |
| `UI-09` | low | design-limitation | 2 | Rows with the same severity are ordered A-Z by area name, so the Budget overruns head the serious block above an overdue vaccination and a silent water sensor |
| `UI-10` | low | confirmed | 2 | Keyboard focus is lost after activating a filter chip |
| `UI-11` | low | confirmed | 2 | Tooltips near the right or bottom edge are squeezed or open off-screen |
| `UI-12` | low | confirmed | 2 | Small chart label collisions: the '3.0' tick overlaps 'lbs per day', and the T6 heading wraps on a phone |
| `UI-13` | low | confirmed | 2 | Exception text shows raw ISO dates ('2026-07-20') while the rest of the page uses 'Jul 20' |
| `UI-18` | low | plausible | 2 | 'Head on grass 375' counts 180 cow-calf pairs as 180 head |
| `TEST-01` | low | confirmed | 1 | The water tests cannot catch a broken rule: removing the 'don't judge a silent tank' line and moving every threshold boundary still pass |
| `TEST-02` | low | confirmed | 1 | No test covers the grazing rule boundaries: changing the over-plan or grace comparisons, or the plural wording, still passes the suite |

---

## 7. Unresolved assumptions and recommendations

### 7.1 Unresolved assumptions that touch this baseline

- How the GitHub Pages 404 page behaves is inferred from the local server, because the site was unreachable
  (registry `unresolved_assumptions`).
- Real-device touch behaviour and screen-reader announcements are untested (`UI-01`, `UI-10`).
- Firefox and WebKit rendering are untested.
- The stalled-load case is assumed to stay blank indefinitely. It was observed for 6 s, and the code has no timeout.
- Four baseline findings had no skeptic review (`UI-02`, `UI-03`, `UI-12`, `UI-13`), and `UI-18` is still only
  plausible.
- The time-zone pass covers the committed data only. It is not a general time-zone guarantee (`TIME-02`, `TIME-03`).
- baseline.json counts the states check as 40 scenarios; its raw report holds 42 entries (section 4.9). This document
  quotes the raw report for the per-file table.

### 7.2 Recommendations from the baseline

These are recommendations, not verified results. They follow the registry's phases.

- **Phase 1 (fix now): never show "clear" when data is missing.** This fixes `LOAD-01` and `LOAD-02`:
  - Add a loading message to the static HTML.
  - Check each file's response and its required columns.
  - Show a visible error that names the failed file.
  - Mark the affected area CAN'T TELL.
  - Draw each page section in isolation, so one failure cannot blank the others.

  The table in section 4.9 is the before-picture. After the fix, the 8 silent cells and the 24 blank cells should
  each show a named file and a CAN'T TELL state, and the 10 planted problems must still appear with the same
  severities and no new false alarms.
- **Phase 1: remove the hard-coded content the baseline exposed.** The Yearlings tile (`LOAD-03`), the tank tile
  that re-reads display text (`UI-04`), the fixed 2026 month ticks (`UI-05`) and the empty-state wording (`UI-07`).
- **Phase 1: strengthen the tests alongside the fixes.**
  - Add tests that fail on the broken copies of the water and grazing rules that the current suite lets through
    (`TEST-01`, `TEST-02`).
  - Replace the parsing test that asserts blanket coercion (`CSV-06`, `CSV-04`).
  - Keep the "10 planted problems, same severities, no false alarms" tests as the acceptance bar.
- **Phase 2 (build next): fix the phone and keyboard gaps.**
  - Keyboard and touch access to chart details (`UI-01`).
  - Phone-friendly tables and chart text (`UI-02`, `UI-03`).
  - Chip focus (`UI-10`), tooltip placement (`UI-11`), label collisions (`UI-12`) and date format (`UI-13`).
- **Wording.** Until the Phase 2 work lands, the README's "Every chart has hover details" and "works on a phone"
  should not be read as covering touch or keyboard use of the charts.

---

## 8. How to re-run every diagnostic

There are 43 scripts in [`diagnostics/`](diagnostics/): 42 Node scripts and one Python script. The header of each
script says it is read-only or changes no repository file, except `render.repro.mjs` and `findings.handvalues.py`,
whose code contains no file writes. Scripts that need changed data either copy the site to a temporary folder or
swap file contents in flight.

Before you start:

- Run every command from the repository root.
- You need Node 22 and python3.
- Browser scripts need Playwright. Most use `$PLAYWRIGHT_PATH` when it is set and otherwise
  `/opt/node22/lib/node_modules/playwright/index.mjs`; `browser-check`, `states-check`, `render.browser` and
  `workflow.usability.research` also try the bare `playwright` package. Six scripts import the `/opt/node22/...` path
  directly and ignore `$PLAYWRIGHT_PATH`; they are noted below.
- Write outputs outside the repository.

```bash
cd /home/claude/ranch-ops-dashboard
OUT=$(mktemp -d)                                   # any folder outside the repo

# The repo's own checks
node --test tests/exceptions.test.mjs              # 8 tests
python3 scripts/generate_data.py && git diff --exit-code data/   # data matches the generator (as CI does)

# Only for the scripts marked "your server" below
python3 -m http.server 8801 --bind 127.0.0.1 --directory . &
```

**Server key** (the "Server" column below):

- **your server**: start a static server first (as above) and pass its URL.
- **own server**: the script starts `python3 -m http.server` itself, on the port shown, against a temporary copy of
  the site (or, where noted, the repo served read-only).
- **none**: Node or Python only, no browser.

**"Covers"** lists the finding IDs whose registry entry names the script. Where the registry does not name a script,
its cases are matched to findings by topic, and the row says so.

### 8.1 Baseline checks

| Script | Command | Server | Covers |
|---|---|---|---|
| browser-check.mjs | `node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ "$OUT/browser"` | your server | `UI-01`, `UI-02`, `UI-03`, `UI-10`, `UI-11`, `UI-12`, `UI-13`, `UI-18`. An optional third argument is a folder for the four key screenshots. The baseline passed `docs/audit/screenshots`; passing it again overwrites the committed screenshots. |
| states-check.mjs | `node docs/audit/diagnostics/states-check.mjs http://127.0.0.1:8801/ "$OUT/states"` | your server | `LOAD-01`, `LOAD-02`, `UI-07`. Writes `states-report.json` and the state screenshots. |

### 8.2 Defect reproductions (one per audit area)

Each prints `CASE` / `expected` / `actual` / `MATCH` or `MISMATCH`. A MISMATCH means the defect is present. Controls
should MATCH.

| Script | Command | Server | Covers |
|---|---|---|---|
| csv.repro.mjs | `node docs/audit/diagnostics/csv.repro.mjs` | none | 66 cases. `CSV-01` to `CSV-06`, `DATA-01` to `DATA-03`, `WAT-01`, `WAT-02`, `GAIN-01`, `GAIN-02`, `HLTH-01`, `BUD-02`, `BUD-03` |
| csv.browser.mjs | `node docs/audit/diagnostics/csv.browser.mjs [port] [workdir]` | own server (8821) | `LOAD-03`, `LOAD-04`, `CSV-01`, `CSV-02`, `CSV-04`, `WAT-01`, `WAT-02`, `GAIN-01`, `BUD-02` |
| time.repro.mjs | `node docs/audit/diagnostics/time.repro.mjs` | none (re-runs itself under TZ=UTC, America/Chicago, America/Denver and Pacific/Auckland) | `DATA-02`, `TIME-01`, `TIME-02`, `WAT-03`, `GAIN-03`, `BUD-01`, `UI-06` |
| time.browser.mjs | `node docs/audit/diagnostics/time.browser.mjs [port] [workdir]` | own server (8831) | `LOAD-03`, `LOAD-04`, `LOAD-05`, `DATA-02`, `TIME-02`, `BUD-01`, `UI-04`, `UI-05` |
| water.repro.mjs | `node docs/audit/diagnostics/water.repro.mjs` | Part 1 none; Part 2 own server (`WATER_REPRO_PORT`, 8840-8849; `WATER_REPRO_TMP`), skipped if Playwright is missing | `LOAD-04`, `DATA-01`, `DATA-02`, `TIME-01`, `WAT-01` to `WAT-04`, `WAT-06` to `WAT-09`, `UI-04` |
| grazing.repro.mjs | `node docs/audit/diagnostics/grazing.repro.mjs` | Part 1 none; Part 2 own server (`GRAZING_REPRO_PORT`, 8850-8859), skipped if Playwright is missing | `DATA-01`, `GRZ-01` to `GRZ-09`, `UI-05`, `UI-06` |
| gain.repro.mjs | `node docs/audit/diagnostics/gain.repro.mjs` | Part 1 none; Part 2 own server (`GAIN_REPRO_PORT`, 8860-8869; `GAIN_REPRO_TMP`), skipped if Playwright is missing | `LOAD-03`, `CSV-04`, `DATA-01`, `DATA-02`, `TIME-01`, `GAIN-01` to `GAIN-08`, `GAIN-10`, `GAIN-11`, `GAIN-13`, `GAIN-14` |
| healthbudget.repro.mjs | `node docs/audit/diagnostics/healthbudget.repro.mjs` | Part 1 none; Part 2 own server (`HB_REPRO_PORT`, 8870-8879; `HB_REPRO_TMP`), skipped if Playwright is missing | `CSV-05`, `DATA-02`, `HLTH-01` to `HLTH-04`, `BUD-01` to `BUD-06`, `UI-06` to `UI-09`, `UI-17` |
| render.repro.mjs | `node docs/audit/diagnostics/render.repro.mjs` | none (imports the real app.js against a DOM stub and a stubbed fetch) | `LOAD-01` to `LOAD-04`, `CSV-06`, `WAT-01`, `BUD-03`, `SEC-01`, `UI-04`, `UI-05`, `UI-07` |
| render.browser.mjs | `node docs/audit/diagnostics/render.browser.mjs [scratchDir] [port]` | own server (8880; scratch defaults to `$RENDER_SCRATCH` or `<tmp>/render-audit`) | `SEC-01`, `UI-10`, `UI-11` |

### 8.3 Skeptic verification, the registrar's extra repro and the hand-value check

Verdicts are recorded in `docs/audit/evidence/verify_<area>.json`. The skeptic scripts number their cases from F1;
the registry's `verify_<area>` references count from F0, so a script's F8 is the registry's F7.

| Script | Command | Server | Covers |
|---|---|---|---|
| csv.verify.mjs | `node docs/audit/diagnostics/csv.verify.mjs` | none | `LOAD-01`, `CSV-01` to `CSV-03`, `CSV-07`, `DATA-02`, `WAT-04` |
| csv.verify.browser.mjs | `node docs/audit/diagnostics/csv.verify.browser.mjs [port] [workdir]` | own server (8957) | `LOAD-01`, `LOAD-03`, `CSV-01`, `CSV-02`, `CSV-06`, `CSV-07` |
| time.verify.mjs | `node docs/audit/diagnostics/time.verify.mjs`; add `--browser [port]` for the locale case | none (child processes per TZ); own server (8861) with `--browser` | `DATA-02`, `TIME-01`, `TIME-03`, `GAIN-03`, `BUD-06` |
| water.verify.mjs | `node docs/audit/diagnostics/water.verify.mjs` | Parts A and B none (Part B runs the tests against broken copies of the rules in a temp folder); Part C own server (`WATER_VERIFY_PORT`, 8876) | `TIME-01`, `WAT-05`, `WAT-10`, `UI-15`, `TEST-01` |
| grazing.verify.mjs | `node docs/audit/diagnostics/grazing.verify.mjs` | Part 1 none (child processes per TZ); Part 2 own server, the repo served read-only on a free port | By topic (the registry names it only in `unregistered_observations`): Part 1 M/D/YYYY in_date under four viewer time zones (`DATA-02`); Part 2 cases V-B0 to V-B4, of which V-B1 and V-B4 are the two grazing probes listed under `unregistered_observations` |
| gain.verify.mjs | `node docs/audit/diagnostics/gain.verify.mjs` | none (reference values come from its own parser, not `parseCSV`) | By topic: F1 `GAIN-01`, F2 `GAIN-02`, F4 `GAIN-06`, F5 and F8 `GAIN-03`, F6 `GAIN-04`, F7 `CSV-04`, F9 `DATA-01`, F10 `DATA-02`, F11 `GAIN-05`, F17 `GAIN-14`, plus threshold display rounding (`GAIN-11`) and a duplicate group row (`DATA-03`) |
| gain.missed.mjs | `node docs/audit/diagnostics/gain.missed.mjs` | none | `CSV-01`, `CSV-04`, `DATA-02`, `GAIN-09`, `GAIN-11`, `GAIN-12` |
| gain.verify.browser.mjs | Serve the site (its header asks for a **copy** of `index.html`, `app.js`, `exceptions.js` and `data/`; the registrar served the repo with `python3 -m http.server 8931 --bind 127.0.0.1 --directory . &`), then `node docs/audit/diagnostics/gain.verify.browser.mjs http://127.0.0.1:8931/ [case]` | your server | Cases `control`, `single`, `steers`, `blanktarget`, `naHeifer`, `naYearling`, `target175`, `dupPlus`, `dupMinus`, `dupEqual`; default `all`. `dupPlus` and `dupMinus` check for a page hang. Imports Playwright from `/opt/node22/...` only. `GAIN-02`, `UI-16` |
| healthbudget.verify.mjs | `node docs/audit/diagnostics/healthbudget.verify.mjs` | none | By topic: F1 `HLTH-01`, F2 `BUD-01`, F3 `BUD-02`, F4 `BUD-03`, F5 `HLTH-02`, F6 `HLTH-03`, F7 `BUD-04`, F8 `UI-09`, F9 and F10 `BUD-05`, F11 `BUD-06`, F13 `UI-06`, F14 `DATA-02`, F15 `HLTH-04`, F17 `UI-08` |
| healthbudget.verify.browser.mjs | `node docs/audit/diagnostics/healthbudget.verify.browser.mjs` | own server (env `PORT`, 8891; env `WORK`). Imports Playwright from `/opt/node22/...` only. | By topic: budget tile, chart and table under changed data (`BUD-01`, `BUD-02`, `BUD-03`, `UI-07`, `UI-08`, `UI-17`, `LOAD-01`), plus a negative-budget credit line (cases M1, M1b) that has no registry entry |
| healthbudget.skeptic.mjs | `node docs/audit/diagnostics/healthbudget.skeptic.mjs` (set `TZ=...` to try other zones) | none | `CSV-05`, `HLTH-01`; by topic the same F1-F17 set as healthbudget.verify.mjs |
| healthbudget.skeptic.browser.mjs | `node docs/audit/diagnostics/healthbudget.skeptic.browser.mjs [scratchDir]` | own server (random port 8100-8999). Imports Playwright from `/opt/node22/...` only. | By topic: cases S0-S12 on the budget tile, chart, table, tooltip and rules table (`BUD-01`, `BUD-02`, `BUD-03`, `BUD-06`, `UI-07`, `UI-08`, `UI-17`, `LOAD-01`) |
| healthbudget.skeptic.missed.mjs | `node docs/audit/diagnostics/healthbudget.skeptic.missed.mjs` | own server for the browser case (random port 8600-8899). Imports Playwright from `/opt/node22/...` only. | `DATA-02`, `BUD-07`, `UI-17` |
| render.verify.browser.mjs | `node docs/audit/diagnostics/render.verify.browser.mjs <scratchDir> [port]` | own server (8931; scratch defaults to `/tmp/render-verify`). Imports Playwright from `/opt/node22/...` only. | By topic: F1 `LOAD-03`, F2 `LOAD-02`, F3 `LOAD-01`, F4 `SEC-01`, F5 `LOAD-04`, F6 `BUD-03`, F7 `WAT-01`, F8 `UI-04`, F9 `UI-07`, F12 `UI-05` |
| render.skeptic.browser.mjs | `node docs/audit/diagnostics/render.skeptic.browser.mjs [scratchDir] [port]` | own server (8932). Imports Playwright from `/opt/node22/...` only. | `LOAD-05`, `CSV-04`, `UI-01`, `UI-14` |
| registry.extra.mjs | `node docs/audit/diagnostics/registry.extra.mjs` | none (Part 2 runs the tests against broken copies of the grazing rules in a temp folder) | `GRZ-03`, `TEST-02` |
| findings.handvalues.py | `python3 -I docs/audit/diagnostics/findings.handvalues.py` | none (Python standard library; reads `data/*.csv` only and never runs `exceptions.js` or `app.js`) | Re-derives, from the CSVs alone, the committed-data hand values that the registry's regression tests depend on. Prints `CHECK <name>: <computed> \| expected <value from findings.json> \| MATCH or MISMATCH`. |

`render.verify.browser.mjs` and `gain.verify.browser.mjs` both default to port 8931. Run them one at a time, or pass a
different port.

### 8.4 Research diagnostics

These support research conclusions (`research_<topic>.json`, `rules.json`), not defects. They are listed so that
every script has a command.

| Script | Command | Server / network | Topic |
|---|---|---|---|
| water.research.mjs | `node docs/audit/diagnostics/water.research.mjs` | none | Water: what "% full" does and does not tell a manager (capacities and intake are labelled assumptions) |
| grazing.rest.research.mjs | `node docs/audit/diagnostics/grazing.rest.research.mjs` | none | Grazing rest periods (`min_rest_days`, never read by the code) |
| grazing.forage.research.mjs | `node docs/audit/diagnostics/grazing.forage.research.mjs` | none | Grazing data against published recovery periods |
| gain.noise.research.mjs | `node docs/audit/diagnostics/gain.noise.research.mjs` | none | Gain: sensitivity to weighing noise (the noise levels are assumptions) |
| gain.evidence.research.mjs | `node docs/audit/diagnostics/gain.evidence.research.mjs` | none | Gain: thresholds against cited figures |
| health.research.mjs | `node docs/audit/diagnostics/health.research.mjs` | none | Health records and scheduling fields (no treatment logic, no diagnosis) |
| health.schedule.research.mjs | `node docs/audit/diagnostics/health.schedule.research.mjs` | none | Health schedule windows (its values are synthetic) |
| budget.materiality.research.mjs | `node docs/audit/diagnostics/budget.materiality.research.mjs` | none | Budget: combined percent-and-dollar materiality (demo settings) |
| budget.fuel.pricevolume.research.mjs | `node docs/audit/diagnostics/budget.fuel.pricevolume.research.mjs` | none (reference prices are copied into the script) | Budget: fuel price against volume (illustration only) |
| context.research.mjs | `node docs/audit/diagnostics/context.research.mjs` | none | Context data: fields, release timing, water days of supply |
| context.usdm-asof.research.mjs | `node docs/audit/diagnostics/context.usdm-asof.research.mjs` | none (rows copied into the script) | Which drought-map week belongs to as_of |
| context.cors.research.mjs | `node docs/audit/diagnostics/context.cors.research.mjs` | **needs open internet** | Whether a static page could fetch public sources. Its header: in the audit sandbox "every request failed before reaching the host ... So NO CORS header was observed in the audit". |
| workflow.research.mjs | `python3 -m http.server 8873 --bind 127.0.0.1 --directory . &` then `node docs/audit/diagnostics/workflow.research.mjs http://127.0.0.1:8873/ "$OUT/workflow"` | your server; `pdftoppm` for the by-hand print check | Workflow: freshness, scan load, print |
| workflow.usability.research.mjs | `python3 -m http.server 8862 --bind 127.0.0.1 --directory . &` then `node docs/audit/diagnostics/workflow.usability.research.mjs http://127.0.0.1:8862/ "$OUT/usability"` | your server; uses `pdfinfo` / `pdftoppm` if present | WCAG checks, storage, print. Its header's usage line names `workflow.research.mjs` by mistake; run it by its own name. |

### 8.5 What has been re-run

The registrar re-ran these on 2026-10-16 against the unchanged code, and every quoted output matched the evidence
(findings.json `spot_checks`). Where only some cases were re-run, they are named in brackets. These are the scripts'
own case labels, not registry IDs: for example, `time.repro` case TIME-07 is not a registry finding.

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

The completeness critic also re-ran `csv.repro.mjs`, `gain.missed.mjs` (M2, M5) and `registry.extra.mjs` on
2026-10-16 with matching output, and "recomputed regression-test hand values from data/*.csv in Python without
exceptions.js".

The registry says these were **not** re-run by the registrar: "water.verify V-GAP (UI-15), render.repro R13 and later
cases, time.verify F4+ and F10+, render.browser scenarios." Some scripts are not named in the re-run record at all:
`gain.verify`, `grazing.verify`, `healthbudget.verify.browser`, `healthbudget.skeptic`, `healthbudget.skeptic.browser`,
`render.verify.browser` and the research scripts. `findings.handvalues.py` is not named either; the record says only
that the completeness critic "recomputed regression-test hand values from data/*.csv in Python without
exceptions.js".
