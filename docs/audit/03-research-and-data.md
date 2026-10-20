# 03. Operational rules research and data requirements

This document sets out what the research found for each operating rule of the Ranch Operations Dashboard, what data each rule needs, and how that data should reach the page. It covers every rule in the rules registry (`docs/audit/data/rules.json`, 98 rules): the rules the code applies today come first, then the proposed rules. After the rules come the full data requirements table (152 fields), an assessment of CSV import and validation ahead of any integration, the 47 candidate integrations, and the bibliography (247 sources).

The dashboard is a portfolio demonstration running on fictional data (Example Ranch). It is **not production-ready**, and nothing in this document makes it so. No current threshold is a validated operating value. The 25% / 40% tank levels, the 30-point drop, 24 hours of sensor silence, the planned graze days, the 2-day move grace, 80% / 50% of target gain, the 2.0 / 1.0 lb daily gain targets, 7 days to due and 5% / 10% over budget are demonstration settings or ranch choices. Every number a proposed rule names is also a setting to be tuned per ranch, unless its entry says otherwise. A public data feed or a sourced threshold does not make the example ranch a real operation.

Health content stays on observation, scheduling, records and escalation to a veterinarian. Nothing here is a diagnosis or a treatment protocol. Where a record field names a product, dose, route or lot, it is a record of work done under the herd veterinarian's direction, and the dashboard must never show it as an instruction. Investment and return economics are out of scope; they belong to the separate Ranch Tech ROI project.

| Item | Value |
|---|---|
| Repository | CowCampSTX/ranch-ops-dashboard |
| Commit reviewed | `cfd77e50a050163b542cadfc6b38882c0341e99d` (main). The work branch `claude/project-thread-nu46kf` adds only `docs/audit/` files. |
| Rules registry | `rules.json`: 98 rules (classes A 14, B 28, C 45, D 11), 152 data fields and 47 integrations. Built from `research_<topic>.json` for seven topics (water, grazing, gain, health, budget, context, workflow) and checked against the citation checkers' `cite_<topic>.json`. A citation critic re-checked both registries on 2026-10-16 (`registry-changelog.md`). |
| Bibliography | `sources.json`: 247 sources. Strictest checker result across each source's uses: 205 verified, 40 partly, 1 unverified, 1 failed. |
| Findings registry | `findings.json`: 83 verified findings. This document refers to them by ID and links to their entries in `02-findings.md`. |
| Project guidance files | At the reviewed commit `cfd77e5` there was **no PROJECT_CONTEXT.md or AGENTS.md**. The research was judged against README.md, the code, the committed fictional data and the project purpose. The repository now has [AGENTS.md](../../AGENTS.md) (added 2026-10-20) with the instructions for every agent. |
| Blocked checks | The published GitHub Pages site could not be reached (the environment's proxy answered 403). Direct downloads of source documents were refused by the proxy, so every web check went through a summarising fetch tool. Browser access (CORS) to public data services could not be tested from the sandbox. |
| Earlier documents | `01-baseline.md` (how the code works and the baseline tests); `02-findings.md` (the verified findings, and a short audit of the current threshold rules in its section 6). |

## Contents

- [How to read this document](#how-to-read-this-document)
- [1. Summary](#1-summary)
- [2. Current rules](#2-current-rules)
- [3. Proposed rules](#3-proposed-rules)
- [4. Data requirements](#4-data-requirements)
- [5. CSV import before integrations](#5-csv-import-before-integrations)
- [6. Unresolved assumptions and open questions](#6-unresolved-assumptions-and-open-questions)
- [7. Bibliography](#7-bibliography)
- [Files this document was built from](#files-this-document-was-built-from)

## How to read this document

### Four kinds of statement

1. **Verified findings.** Defects that were reproduced and checked by a skeptic pass. They live in `findings.json` and are described in `02-findings.md`. This document only points to them by ID (for example [WAT-02](02-findings.md#wat-02)); it does not re-verify them. Where it quotes a finding's output, the quote is copied from `findings.json`.
2. **Research conclusions.** Everything under "Evidence", "Limitations" and "Classification" in the rule entries, the data requirements table and the integration entries. These come from `rules.json` and are quoted as written there. Lines marked OBSERVED report a diagnostic that the research worker ran on the committed fictional data (scripts in `docs/audit/diagnostics/`); those runs were not re-checked by a skeptic pass unless the entry says so. In the quoted evidence, "I" and "my" mean the research worker for that topic.
3. **Recommendations.** Every "Recommendation", "Phase", "Configurable?" line, the research view of the Phase 3 additions (section 1.4) and the CSV-first assessment (section 5). Nothing in the dashboard's code, data, tests or README was changed by the audit.
4. **Unresolved assumptions** (section 6), including two places where the rules and findings registries disagree.

### Classification

| Class | Meaning | What it means for a setting |
|---|---|---|
| A | Supported general guidance | Published and broadly applicable. It still says nothing about whether a number fits a particular ranch. |
| B | Context-dependent guidance | Supported for some cattle classes, seasons, regions or management systems; the entry says which. |
| C | Ranch-specific management choice | The ranch decides the value. Research can inform it, not set it. |
| D | Synthetic demonstration setting | Chosen to make the fictional data show the planted problems. It is not guidance. |

The registry's rule: "Where a checker dispute was credible, the stricter class was applied and classification_note says why. A rule that bundles supported guidance with a design choice takes the stricter class; the note names the supported part." 30 rules were moved to a stricter class this way; none was loosened.

### Source verification

| Result | Meaning (from the registry legend) |
|---|---|
| verified | the citation checker confirmed the claim on the page |
| partly | the page supports only part of the claim, or a detail is wrong (see checker_note) |
| unverified | the page could not be confirmed (empty, blocked, or not checked) |
| failed | unreachable, or (integrations only) checked and found not to support the use |

How the checks were done, in the registry's words: "Every web check in the evidence went through a summarising fetch tool; direct downloads were refused by the proxy. Quotes are as the tools returned them." The citation critic re-opened five sources on 2026-10-16 to confirm a number that a Phase 1-3 recommendation depends on; those carry a "Re-checked" line.

### Independent sources, vendor material and product documentation

Each rule lists its sources in up to three groups, so vendor claims never sit among independent evidence:

- **Independent sources:** extension, government agency, standards, peer-reviewed, field-study and other non-vendor publishers.
- **Product documentation:** an agency or university describing its own public product (for example Grass-Cast or PRISM pages). Accuracy figures there are developer-reported, not independent validation.
- **Vendor specifications and vendor-authored material:** help pages, spec sheets, manuals and vendor-written reports. They say what a product is claimed to do. None of them is an independently verified outcome.

Sources the checker found do not support the claim are listed separately as "not accepted as support".

### Phases

| Phase | Meaning |
|---|---|
| 1 | Fix now: correctness, data integrity and misleading outputs, keeping plain HTML and JavaScript. |
| 2 | Build next: the manager's workflow and usability. |
| 3 | Add later: at most three additions (water supply coverage, forage observations at moves, a dated drought and precipitation snapshot). |
| defer | Defer or exclude, with the reason in the entry. |

Requirements apply by phase. A Phase 1 rule never depends on a Phase 2 or Phase 3 feature, and where a rule's full form needs later data, its phase note says what the earlier phase does on its own.

### What each rule entry contains

- **Heading:** the stable RULE ID from `rules.json` and a short name written for this document.
- **Status line:** current or proposed, class, recommended phase, and the number of sources with their checker results and how many are vendor material.
- **Rule, decision it supports, required inputs** and **where it applies** (cattle class, season, geography, management).
- **Classification** with the reason, **evidence**, any **corrections from the citation checks**, and **limitations**.
- **Configurable?** and **missing data that should block a confident conclusion**: the cases where the page should say CAN'T TELL rather than OK or a problem.
- **Recommendation** and the **phase note**, then **related** rules and findings, then the **sources**: publisher, title, publication date, data years, checker result, link, and what the source supports for this rule.

The checker's full notes for each source are kept in `rules.json` (`sources[].checker_note`). They are not repeated here; the "Supports" line was rewritten by the citation critic so that it claims no more than the checker confirmed.

## 1. Summary

### 1.1 Counts

| Class | Phase 1 | Phase 2 | Phase 3 | Defer | Total |
|---|---|---|---|---|---|
| A (supported general guidance) | 4 | 4 | 2 | 4 | 14 |
| B (context-dependent guidance) | 3 | 6 | 3 | 16 | 28 |
| C (ranch-specific management choice) | 16 | 5 | 4 | 20 | 45 |
| D (synthetic demonstration setting) | 10 | 0 | 1 | 0 | 11 |
| Total | 33 | 15 | 10 | 40 | 98 |

- **Rules:** 22 describe what the code does today, 2 describe current gaps that the research turns into proposals ([RULE-WAT-05](#rule-wat-05), [RULE-GRZ-03](#rule-grz-03)), and 74 are proposed.
- **Source uses:** 334 citations across the rules: 277 verified and 57 partly. By kind: extension 116, agency 62, standard 47, other 31, vendor 29, peer-reviewed 26, product-documentation 12, field-study 11.
- **Rules with no supporting source after checking:** [RULE-BUD-14](#rule-bud-14), [RULE-WF-14](#rule-wf-14), [RULE-WF-21](#rule-wf-21). Each is a design or demonstration choice and says so.
- **No rule rests on vendor material alone** (`evidence_mix.vendor_only` is false for all 98).
- **Data fields:** 152 (43 required in Phase 1, 22 optional, 87 for later phases).
- **Integrations:** 47. None is recommended for Phase 1. Checker results: verified 28, partly 16, unverified 2, failed 1.

### 1.2 What the research concludes

These are research conclusions, each traceable to the rule entries below.

- **No current ranch operating threshold is class A.** The current water, grazing, gain, health and budget thresholds are class C (ranch choice) or D (demonstration setting). The only current class-A rules are display rules from WCAG ([RULE-WF-01](#rule-wf-01), [RULE-WF-06](#rule-wf-06), [RULE-WF-07](#rule-wf-07)). The citation critic's check reads: "A current threshold classified A: None."
- **The research supports the shape of better rules more than any particular number.**
  - Water: percent full means different things in different tanks. A diagnostic with assumed capacities found "the same 25% reading means about 1 hour of water or about 3.5 days depending on tank and herd" ([RULE-WAT-01](#rule-wat-01)). Hours or days of water from capacity, head count and published intake ([RULE-WAT-06](#rule-wat-06)), and a storage-days check where supply is undependable ([RULE-WAT-09](#rule-wat-09)), follow the evidence. NRCS CPS 614 says to "consider supplying additional daily water storage volume (3–5 days)" for windmill, solar or other unreliable power (re-checked by the citation critic).
  - Grazing: "Livestock movements should be based on plant growth and utilization and not calendar dates." (NRCS South Dakota Range Technical Note 9, 2017). Days against a plan stay as the ranch's own plan ([RULE-GRZ-01](#rule-grz-01)); forage observations at moves ([RULE-GRZ-05](#rule-grz-05), [RULE-GRZ-06](#rule-grz-06)) carry the signal the guidance names.
  - Gain: how and when cattle are weighed matters as much as the target. The Beef Improvement Federation guidelines say "a minimum of a 70-d test period is required to accurately compute average daily gain for individual animals" (re-checked). The Phase 1 gates are weigh basis, minimum interval and coverage ([RULE-GAIN-06](#rule-gain-06), [RULE-GAIN-07](#rule-gain-07), [RULE-GAIN-10](#rule-gain-10)).
  - Budget: compare against a monthly phased plan through the same month ([RULE-BUD-04](#rule-bud-04), class A), count only closed months ([RULE-BUD-05](#rule-bud-05)), judge spending with no budget in dollars ([RULE-BUD-06](#rule-bud-06)) and combine percent with dollars ([RULE-BUD-03](#rule-bud-03)). No extension, agency or peer-reviewed source sets a percent or dollar line for ranch budget categories.
  - Public context: pick data by when it was released, label its valid and release dates ([RULE-CTX-01](#rule-ctx-01)), and never read a missing or failed fetch as "no drought" ([RULE-CTX-02](#rule-ctx-02)).
  - Workflow: severity is already shown by shape plus a word ([RULE-WF-01](#rule-wf-01), passes); acknowledging must never clear a condition ([RULE-WF-11](#rule-wf-11)); chart details must be reachable by keyboard and touch ([RULE-WF-02](#rule-wf-02), fails today).
- **Tank-sensor evidence is mostly vendor material.** The water research reports: "I found no university trial that measures tank-sensor accuracy or false-alarm rates." Vendor alert levels are examples, not defaults: Ranchbot's help page says "e.g. you may set this to 10-20% level" for a critical alert (re-checked). The only stated accuracy figure is a vendor claim ("accurate to about 10%", LoneStar).
- **Health rules stay on schedules, observations, records and calls to the veterinarian.** Several rest on the BQA National Manual PDF, which is undated and likely superseded by a 2026 edition that the checkers could not fetch (registry-changelog.md section 7).
- **The 10-of-10 match does not validate anything.** The rules find what the generator planted ([RULE-WF-21](#rule-wf-21), class D). In the fictional data, healthy tanks never fall more than 18.2 points in 24 hours or below 55.1% (water research), so the current water lines separate the planted faults by construction.

### 1.3 All rules at a glance

Sources are counted per rule with the checker result for that use. "Vendor" is the number of those sources that are vendor material.

| Rule | Name | Status | Class | Phase | Sources | Vendor |
|---|---|---|---|---|---|---|
| [RULE-WAT-01](#rule-wat-01) | Tank critical below 25% full | current | C | 1 | 4 (4 verified, 0 partly) | 3 |
| [RULE-WAT-02](#rule-wat-02) | Tank warning below 40% full | current | C | 1 | 2 (2 verified, 0 partly) | 1 |
| [RULE-WAT-03](#rule-wat-03) | Tank critical on a 30-point fall in 24 hours | current | D | 1 | 3 (3 verified, 0 partly) | 1 |
| [RULE-WAT-04](#rule-wat-04) | Tank serious after 24 hours without a reading | current | C | 1 | 5 (5 verified, 0 partly) | 3 |
| [RULE-GRZ-01](#rule-grz-01) | Group serious when its stay passes the pasture's planned days | current | C | 1 | 5 (2 verified, 3 partly) | 0 |
| [RULE-GRZ-02](#rule-grz-02) | Group warning when a planned move is 2 days away | current | D | 1 | 2 (1 verified, 1 partly) | 0 |
| [RULE-GAIN-01](#rule-gain-01) | Group serious below 80% of target gain | current | C | 1 | 7 (7 verified, 0 partly) | 0 |
| [RULE-GAIN-02](#rule-gain-02) | Animal warning below 50% of target gain | current | C | 1 | 5 (5 verified, 0 partly) | 0 |
| [RULE-GAIN-03](#rule-gain-03) | Yearling target 2.0 lb/day | current | D | 1 | 6 (6 verified, 0 partly) | 0 |
| [RULE-GAIN-04](#rule-gain-04) | First-calf heifer target 1.0 lb/day | current | D | 1 | 4 (3 verified, 1 partly) | 0 |
| [RULE-GAIN-05](#rule-gain-05) | Cows skipped by the gain rules (target 0.0) | current | D | 1 | 3 (3 verified, 0 partly) | 0 |
| [RULE-HLTH-01](#rule-hlth-01) | Overdue open health task is serious | current | D | 1 | 3 (3 verified, 0 partly) | 0 |
| [RULE-HLTH-02](#rule-hlth-02) | Open health task due within 7 days is a warning | current | D | 1 | 3 (3 verified, 0 partly) | 0 |
| [RULE-HLTH-03](#rule-hlth-03) | Open tasks with no due date, or a status other than 'open', are skipped | current | C | 1 | 1 (1 verified, 0 partly) | 0 |
| [RULE-BUD-01](#rule-bud-01) | Category serious above 10% over budget | current | D | 1 | 4 (2 verified, 2 partly) | 0 |
| [RULE-BUD-02](#rule-bud-02) | Category warning 5-10% over budget | current | D | 1 | 2 (1 verified, 1 partly) | 0 |
| [RULE-WF-01](#rule-wf-01) | Severity by icon shape plus a word, never colour alone | current | A | 1 | 2 (2 verified, 0 partly) | 0 |
| [RULE-WF-06](#rule-wf-06) | Pointer targets at least 24 x 24 px | current (passes) | A | 1 | 1 (1 verified, 0 partly) | 0 |
| [RULE-WF-07](#rule-wf-07) | Visible keyboard focus | current (passes in Chromium) | A | 1 | 3 (2 verified, 1 partly) | 0 |
| [RULE-WF-09](#rule-wf-09) | Every exception row has a first step | current | B | 1 | 2 (2 verified, 0 partly) | 1 |
| [RULE-WF-19](#rule-wf-19) | Duplicate and stale rows suppressed by design | current | B | 1 | 2 (2 verified, 0 partly) | 0 |
| [RULE-WF-21](#rule-wf-21) | Snapshot, planted problems and severity levels are demo settings | current | D | 1 | 0 (none) | 0 |
| [RULE-WAT-05](#rule-wat-05) | Water severity that knows where the cattle are | current gap + proposed | C | 2 | 3 (1 verified, 2 partly) | 0 |
| [RULE-GRZ-03](#rule-grz-03) | Rest and recovery check (min_rest_days) | current (unused data) -> proposed | B | 2 | 5 (2 verified, 3 partly) | 0 |
| [RULE-WAT-06](#rule-wat-06) | Hours or days of water left in each tank | proposed | C | 3 | 10 (8 verified, 2 partly) | 0 |
| [RULE-WAT-07](#rule-wat-07) | Silence escalation by reporting interval and risk | proposed | C | 2 | 3 (3 verified, 0 partly) | 2 |
| [RULE-WAT-08](#rule-wat-08) | Leak and stuck-float screen | proposed | C | defer | 3 (2 verified, 1 partly) | 1 |
| [RULE-WAT-09](#rule-wat-09) | Storage-days check for undependable supply | proposed | B | 3 | 4 (4 verified, 0 partly) | 0 |
| [RULE-WAT-10](#rule-wat-10) | Float-fed tank adequacy | proposed | B | defer | 3 (3 verified, 0 partly) | 0 |
| [RULE-WAT-11](#rule-wat-11) | Water quality screening by TDS | proposed | A | defer | 3 (2 verified, 1 partly) | 0 |
| [RULE-WAT-12](#rule-wat-12) | Sulfate and nitrate screening flags | proposed | B | defer | 3 (2 verified, 1 partly) | 0 |
| [RULE-WAT-13](#rule-wat-13) | Blue-green algae observation and escalation | proposed | A | defer | 2 (2 verified, 0 partly) | 0 |
| [RULE-WAT-14](#rule-wat-14) | Sensor trust band and calibration record | proposed | C | defer | 6 (5 verified, 1 partly) | 5 |
| [RULE-WAT-15](#rule-wat-15) | Sensors supplement eyes-on tank checks | proposed | C | 1 | 1 (0 verified, 1 partly) | 0 |
| [RULE-GRZ-04](#rule-grz-04) | Two groups in one pasture at the same time | proposed | C | 2 | 1 (0 verified, 1 partly) | 0 |
| [RULE-GRZ-05](#rule-grz-05) | Forage observation at move-out and before re-entry | proposed | C | 3 | 4 (4 verified, 0 partly) | 0 |
| [RULE-GRZ-06](#rule-grz-06) | Key-species residual (stubble or utilization) check | proposed | B | 3 | 6 (3 verified, 3 partly) | 0 |
| [RULE-GRZ-07](#rule-grz-07) | Planned graze days from forage demand | proposed | B | defer | 2 (2 verified, 0 partly) | 0 |
| [RULE-GRZ-08](#rule-grz-08) | Cattle behaviour as a move signal | proposed | C | defer | 2 (0 verified, 2 partly) | 0 |
| [RULE-GRZ-09](#rule-grz-09) | Range readiness at season start | proposed | B | defer | 2 (2 verified, 0 partly) | 0 |
| [RULE-GAIN-06](#rule-gain-06) | Weigh-condition consistency gate | proposed | C | 1 | 6 (6 verified, 0 partly) | 0 |
| [RULE-GAIN-07](#rule-gain-07) | Minimum interval or number of weights before gain is judged | proposed | C | 1 | 3 (3 verified, 0 partly) | 0 |
| [RULE-GAIN-08](#rule-gain-08) | Period-specific expected gain | proposed | B | defer | 3 (3 verified, 0 partly) | 0 |
| [RULE-GAIN-09](#rule-gain-09) | Replacement heifer target-weight rule | proposed | B | defer | 5 (5 verified, 0 partly) | 0 |
| [RULE-GAIN-10](#rule-gain-10) | Coverage and matched-interval gate for group gain | proposed | C | 1 | 1 (0 verified, 1 partly) | 0 |
| [RULE-GAIN-11](#rule-gain-11) | Scale check at each weigh session | proposed | C | defer | 3 (3 verified, 0 partly) | 1 |
| [RULE-HLTH-04](#rule-hlth-04) | Vaccination and parasite-control windows from the label or vet plan | proposed | C | defer | 4 (4 verified, 0 partly) | 0 |
| [RULE-HLTH-05](#rule-hlth-05) | Fly-season eye and condition observations | proposed | C | defer | 6 (4 verified, 2 partly) | 0 |
| [RULE-HLTH-06](#rule-hlth-06) | Completion record before a task is marked done | proposed | C | defer | 4 (4 verified, 0 partly) | 0 |
| [RULE-HLTH-07](#rule-hlth-07) | Head not yet worked on a group task | proposed | C | defer | 1 (1 verified, 0 partly) | 0 |
| [RULE-HLTH-08](#rule-hlth-08) | Withdrawal clear date after the planned ship date | proposed | A | defer | 3 (3 verified, 0 partly) | 0 |
| [RULE-HLTH-09](#rule-hlth-09) | Low-stress timing for early-pregnant females | proposed | B | defer | 2 (2 verified, 0 partly) | 0 |
| [RULE-HLTH-10](#rule-hlth-10) | Escalate-to-veterinarian triggers from observations | proposed | C | defer | 4 (3 verified, 1 partly) | 0 |
| [RULE-HLTH-11](#rule-hlth-11) | Health and gain wording: observe, record, call the veterinarian | proposed | C | 1 | 4 (4 verified, 0 partly) | 0 |
| [RULE-HLTH-12](#rule-hlth-12) | Herd veterinarian and VCPR currency | proposed | C | defer | 3 (3 verified, 0 partly) | 0 |
| [RULE-BUD-03](#rule-bud-03) | Combined percent-and-dollar materiality | proposed | C | 1 | 5 (4 verified, 1 partly) | 0 |
| [RULE-BUD-04](#rule-bud-04) | Compare against a monthly phased plan | proposed | A | 1 | 8 (7 verified, 1 partly) | 0 |
| [RULE-BUD-05](#rule-bud-05) | Count only closed months | proposed | C | 1 | 2 (1 verified, 1 partly) | 0 |
| [RULE-BUD-06](#rule-bud-06) | Unbudgeted spending judged in dollars | proposed | C | 1 | 1 (0 verified, 1 partly) | 0 |
| [RULE-BUD-07](#rule-bud-07) | Credits and refunds as separate signed rows | proposed | C | defer | 3 (2 verified, 1 partly) | 0 |
| [RULE-BUD-08](#rule-bud-08) | Declare the accounting basis | proposed | B | defer | 4 (3 verified, 1 partly) | 0 |
| [RULE-BUD-09](#rule-bud-09) | Split fuel variance into price and volume | proposed | B | defer | 7 (5 verified, 2 partly) | 0 |
| [RULE-BUD-10](#rule-bud-10) | Treat repairs as lumpy | proposed | B | defer | 4 (3 verified, 1 partly) | 0 |
| [RULE-BUD-11](#rule-bud-11) | Record reforecasts | proposed | C | defer | 4 (3 verified, 1 partly) | 0 |
| [RULE-BUD-12](#rule-bud-12) | Align categories with extension and ERS cost categories | proposed | B | defer | 8 (8 verified, 0 partly) | 0 |
| [RULE-BUD-13](#rule-bud-13) | Show large under-spends as information | proposed | C | defer | 1 (0 verified, 1 partly) | 0 |
| [RULE-BUD-14](#rule-bud-14) | Budget rows rank below animal-welfare rows at equal severity | proposed | C | 2 | 0 (none) | 0 |
| [RULE-CTX-01](#rule-ctx-01) | Choose public context by release time | proposed | A | 3 | 5 (5 verified, 0 partly) | 0 |
| [RULE-CTX-02](#rule-ctx-02) | Mark drought context stale after about 9 days | proposed | C | 3 | 2 (2 verified, 0 partly) | 0 |
| [RULE-CTX-03](#rule-ctx-03) | County drought mix and weeks at D2 or worse (information only) | proposed | B | 3 | 2 (1 verified, 1 partly) | 0 |
| [RULE-CTX-04](#rule-ctx-04) | State pasture and range condition (NASS) | proposed | B | defer | 5 (5 verified, 0 partly) | 0 |
| [RULE-CTX-05](#rule-ctx-05) | Grass-Cast production outlook | proposed | B | defer | 6 (5 verified, 1 partly) | 0 |
| [RULE-CTX-06](#rule-ctx-06) | RAP production history per pasture | proposed | B | defer | 4 (4 verified, 0 partly) | 0 |
| [RULE-CTX-07](#rule-ctx-07) | Heat-stress days from a dated forecast snapshot | proposed | C | defer | 11 (10 verified, 1 partly) | 0 |
| [RULE-CTX-08](#rule-ctx-08) | Do not use NWS HeatRisk for cattle | proposed (exclusion) | A | defer | 3 (3 verified, 0 partly) | 0 |
| [RULE-CTX-09](#rule-ctx-09) | Cold-stress outlook in calving season (CCI) | proposed | B | defer | 3 (1 verified, 2 partly) | 0 |
| [RULE-CTX-10](#rule-ctx-10) | Drought-plan review prompts from a rain gauge and public normals | proposed | C | 3 | 10 (8 verified, 2 partly) | 0 |
| [RULE-CTX-11](#rule-ctx-11) | Feed and mineral days on hand | proposed | C | defer | 1 (0 verified, 1 partly) | 0 |
| [RULE-CTX-12](#rule-ctx-12) | Breeding, calving and body-condition records | proposed | C | defer | 6 (6 verified, 0 partly) | 0 |
| [RULE-CTX-13](#rule-ctx-13) | Maintenance log and crew task list | proposed | C | defer | 6 (5 verified, 1 partly) | 4 |
| [RULE-CTX-14](#rule-ctx-14) | Ecological site and reference production per pasture | proposed | B | defer | 3 (3 verified, 0 partly) | 0 |
| [RULE-CTX-15](#rule-ctx-15) | Real public data next to the fictional ranch: pinned, labelled, committed | proposed (demo setting) | D | 3 | 2 (2 verified, 0 partly) | 0 |
| [RULE-CTX-16](#rule-ctx-16) | Do not redistribute SD Mesonet data | proposed (data-source rule) | A | 3 | 2 (1 verified, 1 partly) | 0 |
| [RULE-WF-02](#rule-wf-02) | Chart details reachable by keyboard and touch | proposed (current fails) | A | 2 | 2 (2 verified, 0 partly) | 0 |
| [RULE-WF-03](#rule-wf-03) | Tooltip dismissible with Escape and hoverable | proposed (current fails) | A | 2 | 2 (1 verified, 1 partly) | 0 |
| [RULE-WF-04](#rule-wf-04) | Text alternatives for charts | proposed (partly met) | A | 2 | 1 (1 verified, 0 partly) | 0 |
| [RULE-WF-05](#rule-wf-05) | Announce filter results and keep focus on the chip | proposed (current fails) | A | 2 | 1 (1 verified, 0 partly) | 0 |
| [RULE-WF-08](#rule-wf-08) | Decision-relevant chart marks at 3:1 contrast, or in text | proposed | B | 2 | 1 (0 verified, 1 partly) | 0 |
| [RULE-WF-10](#rule-wf-10) | Severity by consequence and time to respond | proposed | B | 2 | 2 (2 verified, 0 partly) | 1 |
| [RULE-WF-11](#rule-wf-11) | Acknowledging never clears an exception | proposed | B | 2 | 2 (1 verified, 1 partly) | 1 |
| [RULE-WF-12](#rule-wf-12) | Shelving needs a reason, a person and an expiry | proposed | C | defer | 3 (2 verified, 1 partly) | 2 |
| [RULE-WF-13](#rule-wf-13) | Show how long each exception has been open | proposed | C | defer | 2 (2 verified, 0 partly) | 1 |
| [RULE-WF-14](#rule-wf-14) | State the data time, time zone and age | proposed | C | 1 | 0 (none) | 0 |
| [RULE-WF-15](#rule-wf-15) | Shared acknowledgements cannot live only in localStorage | proposed | B | 2 | 3 (3 verified, 0 partly) | 0 |
| [RULE-WF-16](#rule-wf-16) | Health history and shared logs are append-only records | proposed | C | defer | 5 (5 verified, 0 partly) | 0 |
| [RULE-WF-17](#rule-wf-17) | One-page printable crew briefing | proposed (current fails in print) | B | 2 | 4 (4 verified, 0 partly) | 0 |
| [RULE-WF-18](#rule-wf-18) | About 2-minute morning review (design target) | proposed (design target) | C | 2 | 2 (2 verified, 0 partly) | 1 |
| [RULE-WF-20](#rule-wf-20) | Rules table shows each threshold's basis | proposed | B | 1 | 2 (1 verified, 1 partly) | 1 |

### 1.4 Research view of the three Phase 3 additions (recommendation)

Phase 3 allows at most three additions. The research supports the three default candidates, and every Phase 3 rule in the registry belongs to one of them. This is a recommendation for ranking; the roadmap makes the final call.

| Rank | Addition | Rules | Why it ranks here | What it needs first |
|---|---|---|---|---|
| 1 | Water supply coverage from tank capacity and head count | [RULE-WAT-06](#rule-wat-06) (C), [RULE-WAT-09](#rule-wat-09) (B) | It changes the most time-critical decision on the page (does someone go to a tank today). Its intake figures come from an independent table the citation critic re-checked (NDSU AS1763 Table 1: lactating 900 lb cows "11.4 / 12.6 / 14.5 / 16.9 / 17.9 / 16.2 gal/head/day at 40-90F"). The water research observed that "T7, the tank serving the 180 pairs, reads 61.3% and raises nothing", while two of the three water rows are tanks with no cattle on them. | Tank capacity, usable fraction and supply type per tank (new `tanks.csv` columns), head by class per pasture (derived from `groups.csv` and `moves.csv`). The research notes "Capacity is an assumption; the repo has no capacity field." |
| 2 | Forage observations at moves | [RULE-GRZ-05](#rule-grz-05) (C), [RULE-GRZ-06](#rule-grz-06) (B) | It replaces calendar-only grazing judgement with the signal extension guidance names (plant growth and use). The context research calls it the "best value for credibility" and says public products are coarse or model-based, "So a manual forage observation at move-out and before move-in (class C) is the honest signal." The NDSU Grazing Monitoring Stick (R1780) gives a field protocol: "You should take a minimum of 30 measurements for each key species across a pasture." | A new manual record (`forage_obs.csv`) and crew time at each move. The fictional rotation re-enters pastures inside their own minimum rest ([GRZ-05](02-findings.md#grz-05)); a demo of checks before re-entry would show that unless the generator is fixed first (an inference made for this document). |
| 3 | Drought and precipitation context as a dated snapshot | [RULE-CTX-01](#rule-ctx-01), [RULE-CTX-02](#rule-ctx-02), [RULE-CTX-03](#rule-ctx-03), [RULE-CTX-10](#rule-ctx-10), [RULE-CTX-15](#rule-ctx-15), [RULE-CTX-16](#rule-ctx-16) | It explains low gain and slow regrowth but never raises an exception on its own. It needs the most new machinery: a build-time fetch, provenance columns and release-aware selection. The research observed that a naive lookup picks the USDM map for 2026-09-29 (D0 31.55%), released 2026-10-01 08:30 ET, after the as-of time; the release-aware lookup picks 2026-09-22 (D0 8.27%). | A stand-in county labelled as such, a pinned snapshot (`context.csv`) committed so tests stay offline, and the Phase 1 as-of policy with a time zone. |

If the portfolio goal (credibility with Plains ranch managers) is weighted above same-day usefulness, forage observations could move to first place on the context research's judgement. Water coverage ranks first here because a water failure is the most urgent welfare risk the page covers.

## 2. Current rules

These are the rules the code applies at the reviewed commit, with their settings in `exceptions.js` RULES or the CSVs. Apart from the three WCAG display rules (class A) and two workflow rules graded B ([RULE-WF-09](#rule-wf-09), [RULE-WF-19](#rule-wf-19)), every current rule is class C or D. Two further entries (the last subsection) describe gaps in the current rules that the research turns into proposals.

### 2.1 Water

<a id="rule-wat-01"></a>
#### RULE-WAT-01: Tank critical below 25% full

Status: current · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 4 sources (4 verified; 3 vendor)

**Rule.** CURRENT: critical when a tank's latest level_pct &lt; 25 (RULES.waterCritical). Action shown: 'Check the float and the supply line today'.

**Decision it supports.** Whether someone goes to a tank now.

**Required inputs.** Today: level_pct only. To be meaningful it also needs tank capacity in gallons, usable volume (sensor offset), head and class drinking there, daily high temperature, and supply type and inflow.

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: Grazing season (demo: 2026-06-01 to 2026-09-30; snapshot as_of 2026-09-30T18:00). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Remote level sensors on stock tanks (demo: 8 tanks, one tank per pasture, a reading every 6 h).

**Classification: C (ranch-specific management choice).** Unchanged (research C). No published cut-off was found; vendor help pages show the critical level as a user setting (Ranchbot example 10-20%). In this demo the 25% value acts as a synthetic setting and must be labelled that way.

**Evidence (research conclusion).** No extension, NRCS or peer-reviewed source I found sets a % full alarm level. Vendor documentation treats the level as user-set. Ranchbot's alert help page gives EXAMPLES only: 'Critical, low level ... example of 10-20%' and 'Warning, low level ... 40-50%'. My diagnostic (node docs/audit/diagnostics/water.research.mjs) converts 25% into hours of water with zero inflow at 90F. I assumed capacities and took intake from NRC/K-State tables. Output: 'Cows 180 hd \~4932 gal/day | small: 25%=1.2 h ... | storage: 25%=12.2 h' and 'Heifers 45 hd \~707 gal/day | small: 25%=8.5 h ... | storage: 25%=84.9 h'. So the same 25% reading means about 1 hour of water or about 3.5 days depending on tank and herd. In the synthetic data, healthy tanks never go below about 55% (the generator refills +30 when level &lt; 55). Observed: 'lowest level per tank: {"T1":56.3,"T2":11.8,"T3":65,"T4":10,"T5":56.2,"T6":59.9,"T7":55.7,"T8":55.1}'. So only the planted tanks ever test the 25% line. In this demo the specific value 25 behaves as a synthetic demonstration setting.

**Limitations.** Percent of what? Ranchbot's offset help article (vendor) shows that a probe sitting on 10 in of mud in an 80-in tank reads 50%, while usable water is 37.5%. An outlet pipe halfway up makes the lower half unusable. Percent also ignores inflow: a float-fed tank refilling at full flow is fine at 20% for minutes. A storage tank on solar is not fine at 30% before a cloudy stretch. LoneStar (vendor) claims accuracy of 'about 10%', which is as wide as the gap between some thresholds.

**Configurable?** Yes. It must be per tank. The right number depends on capacity, head, class, temperature and the time it takes to reach the tank. One global percentage cannot be right for a 1,000-gal float tank and a 10,000-gal storage tank at once.

**Missing data that should block a confident conclusion.** Without capacity_gal, head and class present, and a temperature or season, the dashboard should not say 'someone goes now' with confidence. It should say 'low by percent; hours of water unknown' and ask for capacity. Without a sensor offset or calibration record, near-threshold readings should be marked uncertain.

**Recommendation.** Keep a % line on the chart for orientation, but drive severity from estimated hours of water remaining (see the proposed hours-of-water rule). If % stays, store it per tank as a ranch setting and label the default as a demo value, not guidance.

**Phase 1 (Fix now).** Keep it, label 25% as a ranch-set demo value in the rules table, and judge only tanks that reported recently; a silent tank is CAN'T TELL ([RULE-WAT-04](#rule-wat-04)), not OK. T2 (planted) must still be found. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [WAT-01](02-findings.md#wat-01), [WAT-02](02-findings.md#wat-02), [WAT-05](02-findings.md#wat-05), [WAT-06](02-findings.md#wat-06), [WAT-09](02-findings.md#wat-09), [UI-04](02-findings.md#ui-04), [TEST-01](02-findings.md#test-01).

**Sources.**

*Independent sources:*

- Colorado State University Extension, Golden Plains Area, "Calculating Water for Cattle" (published 2021-06-17; data years n/a; extension). Checker: **verified**. <https://goldenplains.extension.colostate.edu/wp-content/uploads/sites/56/2021/06/PR_CalculatingWaterforCattle.pdf>
  - Supports: Tank volume formula and capacities at 24-in depth (10 ft = 1,000 gal; 12 ft = 1,690 gal). 2 gal per 100 lb body weight on days over 90F. Windmill or solar pumps deliver 2-4 gpm.

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- Ranchbot Help Center (vendor), "How to set up water tank alerts & notifications" (published 2023-09-20; data years n/a). Checker: **verified**. <https://intercom.help/ranchbot/en/articles/8388692-how-to-set-up-water-tank-alerts-notifications>
  - Supports: Low-level alerts are user-set percentages. The examples are warning 40-50% and critical 10-20%. Rapid-drop alert example: 11.81 in in 60 min. No defaults are stated.
  - Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): warning 'e.g. you may set this at 40-50% level'; critical 'e.g. you may set this to 10-20% level'; rapid drop 'e.g. 11.81 inches in 60mins'; examples, not defaults; Kadee Petty, 2023-09-20. Confirmed.
- Ranchbot Help Center (vendor), "What is offset and how to update it" (published 2023-08-11; data years n/a). Checker: **verified**. <https://intercom.help/ranchbot/en/articles/7941241-what-is-offset-and-how-to-update-it>
  - Supports: % full depends on where the 'true bottom' is set. A probe on 10 in of mud in an 80-in tank reads 50% when usable water is 37.5%. Offsets are not applied retrospectively.
- LoneStar Tracking (vendor), "Water Tank Level Monitoring System" (undated (page footer (c) 2026); data years n/a). Checker: **verified**. <https://www.lonestartracking.com/?p=60249>
  - Supports: Vendor claims the hydrostatic pressure sensor is 'accurate to about 10%', affected by water temperature, barometric pressure and sediment. Satellite 4 readings/day, cellular 24/day. Battery-life statements on the page conflict (2-3, 5 and 10 years).

<a id="rule-wat-02"></a>
#### RULE-WAT-02: Tank warning below 40% full

Status: current · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 2 sources (2 verified; 1 vendor)

**Rule.** CURRENT: warning when the latest level_pct &lt; 40 (RULES.waterLow). Action shown: 'Look at it on the next pass'.

**Decision it supports.** Whether to add the tank to the next routine check.

**Required inputs.** Today: level_pct only. It also needs capacity, head and class, temperature, inflow, and when the next pass is due.

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: Grazing season (demo: 2026-06-01 to 2026-09-30; snapshot as_of 2026-09-30T18:00). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Remote level sensors on stock tanks (demo: 8 tanks, one tank per pasture, a reading every 6 h).

**Classification: C (ranch-specific management choice).** Unchanged (research C). The only figure found is a Ranchbot vendor example (warning at 40-50%).

**Evidence (research conclusion).** No public guidance sets 40%. The only 40% figure I found is a Ranchbot vendor EXAMPLE ('Warning, low level ... example of 40-50%'). Diagnostic output at 90F with zero inflow: 'Cows 180 hd ... small: 40%=1.9 h' and 'Heifers 45 hd ... storage: 40%=135.9 h'. 'Next pass' is too slow in the first case and needlessly early in the second. In the synthetic month no healthy tank ever dropped below 55.1%, so the 40% warning never fires on normal data.

**Limitations.** 'Next pass' has no defined time. The dashboard has no route or check-schedule field, so it cannot tell whether the next pass comes before the water runs out.

**Configurable?** Yes. Per tank, expressed as hours of water left compared with the hours until the next scheduled check.

**Missing data that should block a confident conclusion.** No capacity, head or temperature means no time-to-empty estimate. No check schedule means the 'next pass' advice cannot be tested.

**Recommendation.** Replace with: warn when estimated hours of water (with expected inflow) is less than the hours until the next scheduled visual check plus a margin. Keep 40% only as a labelled demo default.

**Phase 1 (Fix now).** Keep it and label 40% as a ranch-set demo value. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [WAT-01](02-findings.md#wat-01), [WAT-06](02-findings.md#wat-06), [TEST-01](02-findings.md#test-01).

**Sources.**

*Independent sources:*

- NDSU Agriculture Communication, "Water Essential for Cattle in High Heat (NDSU news release, Karl Hoppe)" (undated on page (URL path 2007-07-26); data years n/a; extension). Checker: **verified**. <https://www.ag.ndsu.edu/news/newsreleases/2007/july-26-2007/water-essential-for-cattle-in-high-heat>
  - Supports: 'With 100-degree weather, checking water supplies on a daily basis may not be often enough.' The right check interval depends on heat.

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- Ranchbot Help Center (vendor), "How to set up water tank alerts & notifications" (published 2023-09-20; data years n/a). Checker: **verified**. <https://intercom.help/ranchbot/en/articles/8388692-how-to-set-up-water-tank-alerts-notifications>
  - Supports: A 40-50% warning is a vendor example of a user-set value, not a recommendation.
  - Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): warning 'e.g. you may set this at 40-50% level'; critical 'e.g. you may set this to 10-20% level'; rapid drop 'e.g. 11.81 inches in 60mins'; examples, not defaults; Kadee Petty, 2023-09-20. Confirmed.

<a id="rule-wat-03"></a>
#### RULE-WAT-03: Tank critical on a 30-point fall in 24 hours

Status: current · Class **D** (synthetic demonstration setting) · Phase **1** (Fix now) · 3 sources (3 verified; 1 vendor)

**Rule.** CURRENT: critical when the level fell >= 30 points between the latest reading and the most recent reading at least 24 h earlier (RULES.waterDropPts). Action shown: 'Check for a leak or a stuck float; haul water if it can't be fixed today'.

**Decision it supports.** Whether there is a supply failure: a leak, a float stuck shut, or a pump or pipeline failure.

**Required inputs.** Today: level_pct time series. To tell failure from normal use it also needs expected consumption (head x gal/head/day / capacity), inflow and pump schedule, tank type, and reporting interval.

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: Grazing season (demo: 2026-06-01 to 2026-09-30; snapshot as_of 2026-09-30T18:00). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Remote level sensors on stock tanks (demo: 8 tanks, one tank per pasture, a reading every 6 h).

**Classification: D (synthetic demonstration setting).** Unchanged (research D). Healthy demo tanks fall at most 18.2 points a day and the planted T4 leak 46, so 30 separates the fictional data only. A storage tank's normal pump-off draw can exceed it (49 points/day in the research example).

**Evidence (research conclusion).** The threshold sits between the generator's noise and its planted leak. Observed on repo data: 'max 24h fall per tank over September: {"T1":16.1,"T2":15.3,"T3":16.2,"T4":46,"T5":14.5,"T6":11.8,"T7":14.9,"T8":18.2}'. Healthy tanks max out at 18.2 points and the planted T4 leak is 46 points, so 30 separates them by construction. The generator moves level by uniform(-6,6) per 6 h, so a healthy 24 h fall can never exceed 24. On realistic tanks the rule misfires both ways. (1) False alarm: hypothetical storage tank TX with the Cows, normal 35-point draw with the pump off, gives "C: storage tank, normal 35-pt draw with pump off, 60% now -> [ 'critical: Dropped 35 points in 24 hours, now 60%' ]". Diagnostic section 3: 'Cows on 10000 gal: 49 pts/day at 90F -> WOULD trip the leak rule with no leak'. (2) A slow leak on a large tank below 30 points/day, or a small leak masked by refills, never fires. NRCS 614 lists leak checks in operation and maintenance but gives no rate. Vendors offer a user-set rate-of-change alert (Ranchbot example: 11.81 in per 60 min).

**Limitations.** Points per day mean nothing without capacity and head. A 24 h window on 6-hourly data only compares two snapshots. A float-fed tank that empties and refills within an hour (Bartlett: refill in 1 hour or less) can look normal at every 6 h snapshot. A float stuck OPEN (overflow) cannot be seen in level at all, since the tank reads full. That needs a flow meter or a visual check.

**Configurable?** Yes. Express it as observed fall minus expected consumption over the window, per tank type.

**Missing data that should block a confident conclusion.** Without capacity, head present, and supply type and schedule, a large fall should be reported as 'unexplained fall; leak not confirmed', not as a diagnosed leak.

**Recommendation.** Treat the 30-point figure as a demo setting. Propose an expected-versus-observed drawdown rule (see the proposed leak and stuck-float rule) and keep a separate per-device rapid-drop alert in inches per hour if the device supports it.

**Phase 1 (Fix now).** Bound the comparison window (the reading about 24 h before the latest, within one reporting interval, not any older reading) and measure it against as_of. Word the row 'unexplained fall; leak not confirmed'. T4 must still be found. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [WAT-03](02-findings.md#wat-03), [WAT-04](02-findings.md#wat-04), [WAT-07](02-findings.md#wat-07), [WAT-08](02-findings.md#wat-08), [TIME-02](02-findings.md#time-02), [UI-15](02-findings.md#ui-15), [TEST-01](02-findings.md#test-01).

**Sources.**

*Independent sources:*

- USDA NRCS, "Watering Facility (Code 614) Conservation Practice Standard" (published 2023-08; data years n/a; standard or specification). Checker: **verified**. <https://www.nrcs.usda.gov/sites/default/files/2023-08/614_NHCP_CPS_Watering_Facility_2023.pdf>
  - Supports: Operation and maintenance includes regular checks for leaks and checking 'the performance of the automatic water level device'. No numeric leak rate is given.
  - Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): 'When windmill, solar, or other potentially unreliable power sources are used, consider supplying additional daily water storage volume (3–5 days)' (Considerations; 'consider', not 'shall'). O&M: 'Check for leaks' and 'Checking the performance of the automatic water level device, if present.' August 2023. Confirmed.
- LPES Small Farms Fact Sheets / MidWest Plan Service, "The ABCs of Livestock Watering Systems (Ben Bartlett)" (published 2006 (copyright year); data years n/a; extension). Checker: **verified**. <https://extension.wvu.edu/files/d/102b1da9-9f1a-40d7-90ad-5de2cd6101a8/watering-systems-by-ben-bartlett.pdf>
  - Supports: Group-drinking tanks hold at least 1/4 of daily need and should refill within one hour. Typical floats have a 1/8-inch opening, which is a bottleneck. Hot weather and dry forage can raise needs more than fourfold.

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- Ranchbot Help Center (vendor), "How to set up water tank alerts & notifications" (published 2023-09-20; data years n/a). Checker: **verified**. <https://intercom.help/ranchbot/en/articles/8388692-how-to-set-up-water-tank-alerts-notifications>
  - Supports: Rapid-drop alert is user-set as distance over time (example 11.81 in in 60 min).
  - Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): warning 'e.g. you may set this at 40-50% level'; critical 'e.g. you may set this to 10-20% level'; rapid drop 'e.g. 11.81 inches in 60mins'; examples, not defaults; Kadee Petty, 2023-09-20. Confirmed.

<a id="rule-wat-04"></a>
#### RULE-WAT-04: Tank serious after 24 hours without a reading

Status: current · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 5 sources (5 verified; 3 vendor)

**Rule.** CURRENT: serious when the last reading is >= 24 h before as_of (RULES.sensorSilentHours). The tank's level and drop are then not judged at all ('continue').

**Decision it supports.** Whether to send someone to look at the tank and sensor because the data is stale.

**Required inputs.** Today: last reading time and as_of. It should also use the device's expected reporting interval, last-known level and hours of water, whether cattle are present, and temperature.

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: Grazing season (demo: 2026-06-01 to 2026-09-30; snapshot as_of 2026-09-30T18:00). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Remote level sensors on stock tanks (demo: 8 tanks, one tank per pasture, a reading every 6 h).

**Classification: C (ranch-specific management choice).** Unchanged (research C). Vendor pages describe a 'Delay' status and a 3-4 day inspection point; none sets 24 h for this ranch.

**Evidence (research conclusion).** Vendor documentation agrees the data goes stale but sets no hour figure. Ranchbot (vendor help page): Delay means values 'are likely out of date'. Monitors 'transmit data at irregular intervals'. If Delay lasts more than 3-4 days, a manual inspection may be needed. Farmbot's April 2026 help article (vendor) says the same in substance. The Myriota/LoneStar partner page (vendor) states '4 measurements per day' for satellite units (LoneStar's own page gives conflicting cadences), so 24 h is about 4 missed reports. On repo data T6 (empty pasture P6) is flagged: 'serious | Tank T6 (Cedar Draw) | ... No reading for 42 hours; last level 98.5%'. I ran a hypothetical through findExceptions. Same pasture as the Cows, last reading 26 h ago at 20%: "A: silent 26 h, last reading 20%, cows present -> [ 'serious: No reading for 26 hours; last level 20%' ]". A reporting tank at 24% with the same cows: "A2 ... -> [ 'critical: Down to 24% full' ]". Less information about a lower tank with cattle on it therefore gets a LOWER severity.

**Limitations.** 24 h is stricter than vendor guidance (3-4 days) but may be too slow in heat (NDSU: daily checks 'may not be often enough' at 100F). Satellite gaps and data spikes are common in field reports (USU). Vendor battery help pages (Farmbot; Ranchbot's battery page, not its Delay page) say a charged battery runs 3-5 days without sun, so a cloudy spell can cause a gap that clears by itself. This is a vendor statement, not an independent test.

**Configurable?** Yes. Set silence thresholds per device as a multiple of its expected interval. Escalate by the last-known hours of water and cattle presence.

**Missing data that should block a confident conclusion.** Without the expected reporting interval per device, the dashboard cannot tell 'late' from 'normal irregular transmission'. Without capacity and head, it cannot tell whether the last-known level outlasts the silence.

**Recommendation.** Keep a staleness flag, but (a) set severity to the higher of the stale flag and an 'assume the worst' estimate from the last-known level, head and heat, so silent + low + cattle present = critical; (b) show the silence as a device-maintenance task separate from the water-supply alarm; (c) downgrade when no cattle are in the pasture.

**Phase 1 (Fix now).** Measure silence from as_of, not from the newest reading in the file. A silent tank is CAN'T TELL: show its last level and time and 'check by eye'. T6 must still be found. The ranking inversion (silent at 20% with cattle ranks below a reporting tank at 24%) is handled in phase 2 by [RULE-WAT-07](#rule-wat-07). The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [TIME-01](02-findings.md#time-01), [TIME-02](02-findings.md#time-02), [WAT-02](02-findings.md#wat-02), [WAT-05](02-findings.md#wat-05), [WAT-09](02-findings.md#wat-09), [WAT-10](02-findings.md#wat-10), [LOAD-04](02-findings.md#load-04), [LOAD-05](02-findings.md#load-05), [TEST-01](02-findings.md#test-01).

**Sources.**

*Independent sources:*

- Utah State University Extension (Kevin Heaton), "Using Remote Sensing Technology To Monitor Stock Tanks" (undated; data years not stated; field study or demonstration). Checker: **verified**. <https://extension.usu.edu/rangelands/research/remote-sensing-stock-tanks.php>
  - Supports: Southern Utah field use of a satellite monitor (vendor not named). Data spikes from satellite transmission errors occur 'quite frequently'. One unit was unreliable and 'will be sent back' (the return itself is not reported). Cost \$1,800 plus \$100 install plus \$3-10/month.
- NDSU Agriculture Communication, "Water Essential for Cattle in High Heat" (undated on page (URL path 2007-07-26); data years n/a; extension). Checker: **verified**. <https://www.ag.ndsu.edu/news/newsreleases/2007/july-26-2007/water-essential-for-cattle-in-high-heat>
  - Supports: In 100F weather, daily checks may not be often enough.

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- Ranchbot Help Center (vendor), "What does Monitor Status 'Delay' mean?" (published 2024-02-16; data years n/a). Checker: **verified**. <https://intercom.help/ranchbot/en/articles/7944517-what-does-monitor-status-delay-mean>
  - Supports: Delay = values likely out of date. Irregular transmission intervals. Causes include cloud cover draining the battery, poor connectivity, and animal or weather damage. Manual inspection if Delay persists more than 3-4 days.
- Farmbot Help Centre (vendor), "What does Device Status 'Delay' mean?" (published 2026-04-13; data years n/a). Checker: **verified**. <https://intercom.help/farmbot-helpcentre/en/articles/5666871-what-does-device-status-delay-mean>
  - Supports: Same guidance. Also: pump automation pauses when a linked monitor is in Delay.
- Myriota (vendor), "Satellite Water Tank Monitoring System (LoneStar Tracking partner page)" (published 2025-02-03 (last modified); data years n/a). Checker: **verified**. <https://myriota.com/partner-products/satellite-water-tank-monitoring-system/>
  - Supports: '4 measurements per day' over satellite. Battery life 'up to 5 year'.

### 2.2 Grazing

<a id="rule-grz-01"></a>
#### RULE-GRZ-01: Group serious when its stay passes the pasture's planned days

Status: current · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 5 sources (2 verified, 3 partly; 0 vendor)

**Rule.** CURRENT: Serious when an open stay's days in pasture (as_of date minus in_date) is more than the pasture's planned_graze_days (exceptions.js, grazing block of findExceptions: over = g.days - g.planned; over > 0 gives 'serious'). The threshold is hard-coded; RULES has no setting for it.

**Decision it supports.** Move the group now, or check the grass and record a new move date.

**Required inputs.** moves.csv (group, pasture_id, in_date, empty out_date), pastures.csv planned_graze_days, meta.csv as_of. No forage, residual, growth-stage, herd-size or water input is used.

**Where it applies.** Cattle class: Any grazing group (demo: Cows, Heifers, Yearlings). Season: Grazing season (demo: 2026-06-01 to 2026-09-30; snapshot as_of 2026-09-30T18:00). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Rotational grazing on 8 pastures with a planned stay length per pasture.

**Classification: C (ranch-specific management choice).** Unchanged (research C). Planned stay length is the ranch's plan; extension sources say moves should follow plant growth and use, not a fixed count.

**Evidence (research conclusion).** OBSERVED (ran `node docs/audit/diagnostics/grazing.rest.research.mjs` and `node docs/audit/diagnostics/grazing.forage.research.mjs`): on the committed data the rule raises exactly one grazing row: "[serious] Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over)". The plan is per pasture, not per stay or herd: "P4 Lone Tree: one planned 14-d stay = Heifers 22 AUM, Yearlings 48 AUM (x2.2)" and "P2 Windmill: one planned 18-d stay = Cows 123 AUM, Yearlings 62 AUM (x2.0)" (AUE values assumed from NDSU R1810). Closed stays also deviate without being recorded as a problem: "Cows (180 hd) in P6 Cedar Draw 2026-07-31..2026-08-22: 22 d vs plan 18 d (+4)". GUIDANCE: NRCS SD Range Tech Note 9 (Apr 2017) p.4: "Livestock movements should be based on plant growth and utilization and not calendar dates." and "Calendar dates may be used as a guide when developing grazing schedules." SDSU MC-04340: "movement to the next pasture should follow plant growth – not the calendar." UNL G1908: move livestock when a predetermined criterion such as a stubble height is reached. CARM (Augustine et al. 2020) used a maximum days-in-pasture limit only alongside minimum-biomass thresholds and cattle-behaviour checks; the limit was dropped in 2015 and set to 14–21 days by 2018. CPS 528 (June 2025) asks for monitoring that 'documents decisions based upon ecological triggers and thresholds'.

**Limitations.** Elapsed days do not measure the plants. The same 14-day plan removes about 2.2x more forage with 150 yearlings than with 45 heifers. A dry year gives less forage for the same days (TR 1734-3: light use in a drought year can look like heavy use in a wet year). During fast growth, a long stay lets cattle regraze regrowth before the plant recovers (SD TN9 p.3). One day over is rated 'serious' no matter what the forage looks like, which overstates urgency when forage is ample and misses overuse when the pasture runs short before the planned date. Moves are dates with no time of day, so a move on the morning of the planned day still counts that day.

**Configurable?** Partly. planned_graze_days is editable per pasture in pastures.csv. The 'any day over is serious' threshold is hard-coded in findExceptions and is not in RULES, so a ranch cannot tune it without code changes.

**Missing data that should block a confident conclusion.** With no residual or stubble, utilization or forage-condition observation, the dashboard can say 'past the planned date' but must not imply overgrazing or 'grass is fine'. When a group's head count or average weight changed after the plan was written (for example, groups combined), the planned days are no longer comparable.

**Recommendation.** Keep it as a plan-deviation check, but: (1) store a planned_out_date on each stay in moves.csv instead of using a per-pasture day count, so plans can differ by herd size. (2) Make the default severity 'warning: past planned move date; check key-species stubble and water'. Escalate to serious only with corroborating observations, such as stubble below the pasture's target, utilization above the target, the water source failing, or no forage check during the stay. (3) Put the escalation thresholds in RULES. (4) Show one row per stay listing every reason (days, stubble, rest, water), in line with the README's no-noise principle. (5) In the README and rules table, describe it as a ranch planning choice, not an agronomic standard.

**Phase 1 (Fix now).** Keep it (the yearlings on day 24 of 21 must still be found). An open stay in an unknown pasture, or a group with more than one open stay, becomes a data issue (CAN'T TELL), not a grazing row. Label planned_graze_days as the ranch's plan (demo values). The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [GRZ-01](02-findings.md#grz-01), [GRZ-02](02-findings.md#grz-02), [GRZ-03](02-findings.md#grz-03), [GRZ-06](02-findings.md#grz-06), [GRZ-08](02-findings.md#grz-08), [GRZ-09](02-findings.md#grz-09), [DATA-01](02-findings.md#data-01), [TIME-03](02-findings.md#time-03), [TEST-02](02-findings.md#test-02).

**Sources.**

*Independent sources:*

- USDA NRCS South Dakota, "Prescribed Grazing, Range Technical Note No. 9 (South Dakota Technical Guide, Section I, Notice SD-424)" (published April 2017; data years n/a (guidance); government agency). Checker: **partly**. <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf>
  - Supports: p.4: 'Livestock movements should be based on plant growth and utilization and not calendar dates.' Calendar dates may be used as a guide when developing schedules. p.3: keep grazing periods as short as practical to minimise grazing of regrowth before recovery.
- SDSU Extension (Krista Ehlert), "Designing a Grazing Plan That Guides Decisions (MC-04340)" (undated (URL folder 2026-07; page shows (c) 2026 South Dakota Board of Regents); data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/sites/default/files/2026-07/MC-04340.pdf>
  - Supports: p.1 s.4: 'movement to the next pasture should follow plant growth – not the calendar.' Example 4 gives trigger points: green needlegrass 6-8 in by June 10; rainfall 30% below average by May 15 starts 15% destocking.
- Elsevier / Society for Range Management (author PDF hosted by USDA ARS), "Adaptive, Multipaddock Rotational Grazing Management: A Ranch-Scale Assessment of Effects on Vegetation and Livestock Performance in Semiarid Rangeland. Rangeland Ecology & Management 73:796-810, doi:10.1016/j.rama.2020.07.005" (published 2020; data years 2013 pretreatment; 2014-2018 treatment; Central Plains Experimental Range, Nunn CO; peer-reviewed). Checker: **verified**. <https://www.ars.usda.gov/ARSUserFiles/51815/67.%202020%20REM%20-%20CARM%20-%20adaptive%20multipaddock%20rotational%20grazing%20-%20vegetation%20and%20livestock%20responses.pdf>
  - Supports: Move timing used forage biomass thresholds (e.g. 300 lb/ac loamy in 2014, 450 lb/ac 2016-18), cattle behaviour checks 3 days/week, and a max-days cap (dropped 2015, 14-21 d by 2018). Adaptive rotation gave 12-16% lower cattle gain (abstract; the Results give 11.7-16.2%) than continuous grazing at the same stocking rate, with little vegetation benefit.
- University of Nebraska-Lincoln Extension, "Switchgrass, Big Bluestem, and Indiangrass for Grazing and Hay (NebGuide G1908)" (published December 2008; data years n/a; extension). Checker: **partly**. <https://extensionpubs.unl.edu/publication/g1908/na/pdf/view>
  - Supports: Move livestock when a predetermined criterion such as recommended stubble height or readiness of another pasture is reached. Big bluestem/indiangrass: stubble of half the original height or 4-6 in. Note: the guide calls these 'native warm-season grasses' and recommends certified cultivars, so it fits seeded native warm-season pasture rather than native range.
- USDA NRCS, "Grazing Management (Code 528) Conservation Practice Standard, 528-CPS-1" (published June 2025 (header/footer 'NRCS, NHCP June 2025'); data years n/a; standard or specification). Checker: **partly**. <https://www.nrcs.usda.gov/sites/default/files/2025-07/528-nhcp-cps-grazing-management-2025-rev.pdf>
  - Supports: General Criteria: 'Develop and implement a monitoring strategy that supports adaptive management and documents decisions based upon ecological triggers and thresholds...'; 'Manage livestock numbers and grazing periods to adjust the intensity, frequency, timing, duration, and distribution'.

<a id="rule-grz-02"></a>
#### RULE-GRZ-02: Group warning when a planned move is 2 days away

Status: current · Class **D** (synthetic demonstration setting) · Phase **1** (Fix now) · 2 sources (1 verified, 1 partly; 0 vendor)

**Rule.** CURRENT: Warning when a planned move is 2 days away or less (RULES.graceDays = 2; over >= -2).

**Decision it supports.** Line up the move (crew, gates, trailer or horseback, water at the next pasture).

**Required inputs.** Same as the over-plan rule: in_date, planned_graze_days, as_of.

**Where it applies.** Cattle class: Any grazing group. Season: Grazing season (demo: 2026-06-01 to 2026-09-30; snapshot as_of 2026-09-30T18:00). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Rotational grazing on 8 pastures with a planned stay length per pasture.

**Classification: D (synthetic demonstration setting).** Unchanged (research D). No extension or NRCS source sets a lead time for move reminders.

**Evidence (research conclusion).** OBSERVED: on the committed data the rule fires on no stay. Cows are on day 18 of 21 in P7 and Heifers on day 11 of 14 in P4 (3 days left each), so neither is within 2 days (diagnostic section B). I found no extension or NRCS source that sets a lead time for move reminders. CARM staff checked cattle and forage 3 days a week (Augustine et al. 2020), which shows how often monitoring was done, not how much warning a move needs.

**Limitations.** It does not check that the destination is ready: whether it has had its minimum rest, whether its tank level and sensor are OK, or whether the key species is at grazing height. A move that is 'due' into an unrested pasture produces no signal. As an exception row it competes with real problems, even though it is a routine scheduled task.

**Configurable?** Yes, through RULES.graceDays, but the value is a demonstration setting with no source behind it.

**Missing data that should block a confident conclusion.** Without a planned destination pasture on the stay, the dashboard cannot check readiness and should say 'destination not planned' rather than 'ready'.

**Recommendation.** Move this from the exception list to an 'upcoming moves' panel or task list. Add a planned_next_pasture field and show destination readiness: rest days elapsed vs that pasture's minimum, current tank level and sensor status, and the latest key-species height. Keep it as a warning exception only when the destination fails a readiness check (see the rest and water rules). Label graceDays as a ranch preference.

**Phase 1 (Fix now).** Label 2 days as a demo setting. It raises nothing on the demo data. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [UI-06](02-findings.md#ui-06), [TIME-03](02-findings.md#time-03), [TEST-02](02-findings.md#test-02).

**Sources.**

*Independent sources:*

- Elsevier / SRM (USDA ARS-hosted PDF), "Adaptive, Multipaddock Rotational Grazing Management ... Rangeland Ecology & Management 73:796-810" (published 2020; data years 2013-2018; peer-reviewed). Checker: **verified**. <https://www.ars.usda.gov/ARSUserFiles/51815/67.%202020%20REM%20-%20CARM%20-%20adaptive%20multipaddock%20rotational%20grazing%20-%20vegetation%20and%20livestock%20responses.pdf>
  - Supports: Monitoring cadence in a working adaptive rotation: staff checked herd distribution and attempts to leave the pasture 3 days/week. It says nothing about move lead time.
- USDA NRCS, "Grazing Management (Code 528) Conservation Practice Standard" (published June 2025; data years n/a; standard or specification). Checker: **partly**. <https://www.nrcs.usda.gov/sites/default/files/2025-07/528-nhcp-cps-grazing-management-2025-rev.pdf>
  - Supports: 'Provide adequate quantity, quality, and distribution of drinking water for animals during periods of occupancy.' Applying this to a destination-water check before a move is an inference; the standard does not say it.

### 2.3 Gain

<a id="rule-gain-01"></a>
#### RULE-GAIN-01: Group serious below 80% of target gain

Status: current · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 7 sources (7 verified; 0 vendor)

**Rule.** CURRENT: Group 'serious' when the mean of per-animal ADG since the last weigh-in is &lt; 80% of the group's fixed target (exceptions.js: g.adg &lt; g.target \* R.adgSerious, adgSerious 0.8). Action text: 'Check forage quality and mineral; look for a health problem in the group'.

**Decision it supports.** Whether a grazing group needs a look at forage, supplement/mineral, water, health observations or weighing conditions before the next move, sale or supplement decision.

**Required inputs.** Paired weights for the same animals over the same interval; weight basis (full / overnight-shrunk / pencil-shrunk) and gather time for both weigh-ins; interval length; period-specific expected ADG (not a whole-season target); inventory head to judge coverage; pasture/forage and precipitation context.

**Where it applies.** Cattle class: Growing cattle judged on ADG (demo: Yearlings target 2.0 lb/d, Heifers 1.0 lb/d). Season: Summer grazing, between weigh-ins. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Group weigh-ins on a chute scale (demo: 2026-06-01, 2026-07-20, 2026-09-15).

**Classification: C (ranch-specific management choice).** Unchanged (research C). Gains normally decline late in the season, so a fixed 80% test fires in normal years without a period-specific expectation.

**Evidence (research conclusion).** OBSERVED (node docs/audit/diagnostics/gain.evidence.research.mjs): 'Heifers: inventory 45, weighed 45 (100%), distinct intervals 1 [2026-07-20..2026-09-15], 57 d; mean ADG 0.44 ... group serious &lt; 0.80'; 'Yearlings: ... mean ADG 1.94 ... group serious &lt; 1.60'. Published period gains vs this threshold, from the same run: 'Yearlings 1.30 vs serious &lt; 1.60: would be SERIOUS | [G02] 1994 season-long steers, late period 15 Jul-8 Sep (precip 44% of normal)'; 'Yearlings 1.46 ... would be SERIOUS | [G02] 1995 ... late period 4 Aug-26 Sep (precip 104% of normal)'; 'Yearlings 2.36 ... no group flag | [G02] 1994 season-long steers, whole season'; 'Yearlings 1.51 ... would be SERIOUS | [W22] HPAL crested wheatgrass, unsupplemented'. Grings et al. 2002 attribute the low late-season gains to forage quality that 'had substantially declined'. Currie et al. 1989 (daily automatic weights, 1986-87): predicted live weight peaked in late July to early August and declined through the end of the September grazing period in 1986. Manual weighings from 1983-87 showed lower gain in the second half of summer every year. UNL BeefWatch 2022: 'Forage quality and yearling rate of gain decline throughout the summer, particularly in cool season grasses.' Gillespie et al. 2014 (Sandhills): unsupplemented yearling heifers gained 1.17 lb/d in 2011 and 0.73 lb/d in the 2012 drought. Diet CP fell from 9.5% in May to 6.3% in August. Weighing-condition error, from the run: '[D14] Jun-Aug vs Sep overnight shrink gap (8.9% vs 7.1%) on a 780-lb yearling (lb) = 14.0 ... 57 d 0.25'; '[W12] mean full-weight offset, pasture steers (lb) = 37.0 ... 57 d 0.65'. Watson et al. 2013: 'handling cattle in a similar manner when weighing is more important than limiting intakes to decrease variance between weights'.

**Limitations.** A fixed whole-season target applied to a late-summer interval (Jul 20-Sep 15 in the shipped data) flags normal seasonal decline as 'serious'. In Grings 2002 it would have fired in a near-normal precipitation year (1995). The 80% cut-off has no published basis. Nothing records whether both weigh-ins were taken under the same conditions, and a one-sided fill shift of 14-37 lb moves a 57-day group ADG by 0.25-0.65 lb/d. The mean of per-animal ADGs is not checked for mixed intervals or coverage (other auditors cover these code defects). The action text never says to check the weighing conditions.

**Configurable?** Yes. RULES.adgSerious and groups.csv target_adg_lbs are plain values. The 80% share should stay configurable because it is a management tolerance, but the target it multiplies should become period-specific (see the proposed period-expectation rule).

**Missing data that should block a confident conclusion.** Do not give a confident group verdict when the weight basis or gather time of either weigh-in is unknown or differs between them, the interval is shorter than the ranch's minimum (see the interval rule), fewer than the configured share of inventory head have matched pairs, animals in the group have different intervals, or no period-specific expectation exists. Show 'gain not assessable' with the reason rather than silence or 'serious'.

**Recommendation.** Keep the rule but present it as a ranch-set tolerance against a period-specific expected ADG, preferably from the ranch's own past weigh-ins for that pasture and season. Show the ADG with the interval, coverage and weighing basis. Downgrade to 'below expected - verify' when weigh conditions differ or are unknown. Add 'confirm both weigh-ins used the same gather/shrink routine' to the action text. Do not describe 80% as an industry standard.

**Phase 1 (Fix now).** Apply the weight-basis, minimum-interval and coverage gates first ([RULE-GAIN-06](#rule-gain-06), -07, -10) and label 80% as a demo setting. The heifers (planted) must still be flagged. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [GAIN-01](02-findings.md#gain-01), [GAIN-02](02-findings.md#gain-02), [GAIN-03](02-findings.md#gain-03), [GAIN-04](02-findings.md#gain-04), [GAIN-07](02-findings.md#gain-07), [GAIN-08](02-findings.md#gain-08), [GAIN-10](02-findings.md#gain-10), [GAIN-12](02-findings.md#gain-12).

**Sources.**

*Independent sources:*

- Society for Range Management / USDA-ARS Fort Keogh (PDF hosted by USDA-ARS), "Intensive-early stocking for yearling cattle in the Northern Great Plains (J. Range Manage. 55:135-138)" (published 2002; data years 1993-1995; peer-reviewed). Checker: **verified**. <https://ars.usda.gov/ARSUserFiles/30300500/Publications/JRM55-135-138.pdf>
  - Supports: Table 6: season-long steers' late-period ADG was 1.11 kg/d (17 Sep-4 Oct 1993), 0.59 (15 Jul-8 Sep 1994, 44% of normal precipitation) and 0.66 (4 Aug-26 Sep 1995, 104% of normal). Whole-season ADG was 1.19, 1.07 and 1.11 kg/d. Late-season decline attributed to forage quality.
- Society for Range Management (Univ. of Arizona repository), "Growth patterns of yearling steers determined from daily live weights (J. Range Manage. 42:393-396)" (published 1989; data years 1986-1987 (automatic weights); 1983-1987 (manual weights); peer-reviewed). Checker: **verified**. <https://repository.arizona.edu/handle/10150/645028>
  - Supports: Weight peaked late July to early August and then declined through September in 1986. Gains were lower in the second half of summer in every year. Within-day weight variability among steers was substantial. Study location is not shown on the fetched page.
- University of Nebraska-Lincoln BeefWatch, "Supplementing Yearlings in the Summer Grazing Season: Is it Worth it?" (published 2022-07-01; data years price analysis 2012-2021; trial years not stated; extension). Checker: **verified**. <https://beef.unl.edu/beefwatch/2022/supplementing-yearlings-summer-grazing-season-it-worth-it>
  - Supports: Unsupplemented yearlings on crested wheatgrass at High Plains Ag Lab (Sidney NE), late May-early Sep (\~112 d), gained 1.51 lb/d. Supplemented yearlings gained about 2 lb/d. Forage quality and rate of gain decline through summer.
- University of Nebraska-Lincoln, "Replacement of Grazed Forage and Animal Performance when Distillers Grains are Fed in a Bunk or on the Ground on Summer Range (2014 Nebraska Beef Cattle Report pp. 34-35)" (published 2014; data years 2011-2012; field study or demonstration). Checker: **verified**. <https://Beef.unl.edu/28d9d9d4-33f0-4075-b8ed-5a01a870ba0d.pdf>
  - Supports: Control spayed yearling heifers on Sandhills range gained 1.17 lb/d (2011) and 0.73 lb/d (2012 drought). Diet CP fell from 9.5% (May) to 6.3% (Aug) in 2012.
- University of Nebraska-Lincoln, "Research Results are Dependent on Accurate Cattle Weights (2012 Nebraska Beef Cattle Report pp. 45-46)" (published 2012; data years Four weighing events, October 2009 to May 2011; field study or demonstration). Checker: **verified**. <https://Beef.unl.edu/7a4f176f-73e2-4fa9-b86c-ed95f8543602.pdf>
  - Supports: Compared with limit-fed weights, full weights overstated ADG by 0.22 lb/d for pasture steers over 165 d and by 0.51 lb/d for pasture heifers over 20 d. Mean offsets were 37 lb and 10.2 lb. Individual full weights ranged from +99 to -86 lb against limit-fed weights.
- American Society of Animal Science (UNL Digital Commons record), "Impacts of a limit-feeding procedure on variation and accuracy of cattle weights (J. Anim. Sci. 91:5507-5517)" (published 2013; data years 18 experiments; years not stated on page; peer-reviewed). Checker: **verified**. <https://digitalcommons.unl.edu/animalscifacpub/790>
  - Supports: Two-day full-fed weight differences ranged from -14 to +34 kg. Limit-fed vs full-fed ADG differed by -0.29 to +0.31 kg/d. 'handling cattle in a similar manner when weighing is more important than limiting intakes to decrease variance between weights'.
- Society for Range Management (Rangelands Gateway), "Do Environmental Variables Influence Overnight Weight Loss of Yearling Steers in Semiarid Rangelands (SRM annual meeting abstract)" (published 2014; data years 2009-2012; field study or demonstration). Checker: **verified**. <https://rangelandsgateway.org/node/25589>
  - Supports: Overnight shrink of yearling steers at CPER, Colorado, was about 8.8-9.0% in June-August and 7.1% in September (16 weighings), so fill differs between summer and September weigh-ins.

<a id="rule-gain-02"></a>
#### RULE-GAIN-02: Animal warning below 50% of target gain

Status: current · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 5 sources (5 verified; 0 vendor)

**Rule.** CURRENT: Individual 'warning' when an animal's ADG between its last two weigh-ins is &lt; 50% of the group target (RULES.animalShare 0.5). Suppressed when the group is already serious. Action text: 'Pull and check these animals at the next gather'.

**Decision it supports.** Which individual animals to look at closely at the next gather (observation, records, escalation to the herd veterinarian when observations warrant).

**Required inputs.** At least two (preferably three or more) weights per animal over an adequate span; weight basis and gather time; animal ID that is stable across weigh-ins (visual tag + EID); class and lactation status; observation notes.

**Where it applies.** Cattle class: Growing cattle judged on ADG (demo: Yearlings target 2.0 lb/d, Heifers 1.0 lb/d). Season: Summer grazing, between weigh-ins. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Group weigh-ins on a chute scale (demo: 2026-06-01, 2026-07-20, 2026-09-15).

**Classification: C (ranch-specific management choice).** Unchanged (research C). The research's sensitivity sweep (assumed noise levels) estimated about 2 false individual flags per 150 yearlings per weigh-in at the demo's 57-day interval; BIF test standards require at least 70 days for individual ADG.

**Evidence (research conclusion).** OBSERVED (gain.evidence.research.mjs): 'Gap between target and the individual threshold: yearlings 1.00 lb/d, heifers 0.50 lb/d.' Individual worst cases at the shipped 57-d interval: '[W12] individual full vs limit-fed weight, high end (lb) 99 lb -> ... 57d 1.74'; '[W13] 2-day full-fed re-weigh difference, low end (-14 kg) -31 lb -> ... 57d -0.54'. Shipped data: 'Heifers ... animals under: 32' (of 45) and 'Yearlings ... animals under: 6'. The earlier sensitivity sweep (node docs/audit/diagnostics/gain.noise.research.mjs, assumed noise levels) printed 'interval 57 d, noise 2% BW: mean false individual flags per weigh-in = 2.0 of 150' and 'interval 28 d, noise 2% BW: ... 15.1 of 150'. BIF feed-efficiency guidelines (2019): 'a minimum of a 70-d test period is required to accurately compute average daily gain for individual animals', with two start and two end weights on separate days. Archer et al. 1997: a 70-d test with weights every 2 weeks was optimal for growth rate.

**Limitations.** A single full weight at each end of a 57-day interval can carry individual errors comparable to, or larger than, the 1.0 lb/d (yearling) or 0.5 lb/d (heifer) gap between target and threshold. Some flagged animals will be on target. The fixed 50% share has no published basis. Hiding individuals when the group is flagged also hides any animal that is actually losing weight (covered by another auditor as a design limit). 'Pull' implies sorting and handling. For range cattle a lower-cost first step is to observe and record at the next gather.

**Configurable?** Yes (RULES.animalShare). Also make these configurable: minimum interval, minimum number of weights, and whether lactating classes are included at all.

**Missing data that should block a confident conclusion.** Do not list an individual as slow when the interval is under the configured minimum (BIF uses 70 d for individual ADG under controlled test conditions), when the animal has fewer than two valid weights or a weight is blank or implausible, when weigh conditions differ between the two weigh-ins, or for lactating first-calf heifers (use BCS instead).

**Recommendation.** Reword as 'Observe at next gather' and require persistence: slow in two consecutive intervals, or a regression over 3 or more weights spanning at least about 70 d. Alternatively rank the bottom X% within the group (relative to herd-mates weighed under the same conditions) rather than a fixed share of a fixed target. Record what was observed. Escalate to the herd veterinarian per the ranch's health plan. No diagnosis or treatment is implied by the list.

**Phase 1 (Fix now).** Use the minimum-interval gate ([RULE-GAIN-07](#rule-gain-07)) and reword the action to observe, record and escalate ([RULE-HLTH-11](#rule-hlth-11)). The six planted slow yearlings must still appear: the demo has three weigh-ins and a 57-day last interval, so choose and test the phase-1 default with that in mind. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [GAIN-03](02-findings.md#gain-03), [GAIN-09](02-findings.md#gain-09), [GAIN-11](02-findings.md#gain-11), [GAIN-14](02-findings.md#gain-14), [UI-16](02-findings.md#ui-16).

**Sources.**

*Independent sources:*

- Beef Improvement Federation (hosted on docs.c-lockinc.com), "Beef Improvement Federation Guidelines for Feed Efficiency Testing as of March 26th, 2019 (copy hosted by C-Lock Inc., a vendor)" (published 2019-03-26; data years n/a; standard or specification). Checker: **verified**. <https://docs.c-lockinc.com/Document%20-%20Beef%20Improvement%20Federation%20Guidelines%20for%20FE%20Testing.pdf>
  - Supports: Test Period section: 70-d minimum to compute individual ADG accurately. Animals weighed twice (on separate days) at the start and end. Regression 'may enhance the accuracy' somewhat.
  - Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): 'a minimum of a 70-d test period is required to accurately compute average daily gain for individual animals'; weigh twice on separate days at start and end; regression 'may enhance the accuracy ... somewhat'; ad libitum feed required. Confirmed; the 70 d is a controlled-feeding test length.
- American Society of Animal Science (University of Adelaide repository), "Optimum postweaning test for measurement of growth rate, feed intake, and feed efficiency in British breed cattle (J. Anim. Sci. 75:2024-2032)" (published 1997; data years not stated on page; peer-reviewed). Checker: **verified**. <https://eres.library.adelaide.edu.au/dspace/handle/2440/13249>
  - Supports: 35 d was sufficient for feed intake, but 70 d was needed for growth rate. Weighing every 2 weeks lost little accuracy, while 5-week intervals reduced it.
- University of Nebraska-Lincoln, "Research Results are Dependent on Accurate Cattle Weights (2012 Nebraska Beef Cattle Report)" (published 2012; data years Four weighing events, October 2009 to May 2011; field study or demonstration). Checker: **verified**. <https://Beef.unl.edu/7a4f176f-73e2-4fa9-b86c-ed95f8543602.pdf>
  - Supports: Individual full weights ranged from +99 to -86 lb relative to limit-fed weights.
- American Society of Animal Science (UNL Digital Commons), "Impacts of a limit-feeding procedure on variation and accuracy of cattle weights" (published 2013; data years not stated; peer-reviewed). Checker: **verified**. <https://digitalcommons.unl.edu/animalscifacpub/790>
  - Supports: Two consecutive-day full-fed weights differed by -14 to +34 kg for individual cattle.
- Merck & Co. (author J. Smith, Texas A&M), "Disease Screening, Treatment, and Surveillance in Beef Cattle (Merck Veterinary Manual, professional version)" (reviewed 2023-07; modified 2024-09; data years n/a; other publisher). Checker: **verified**. <https://www.merckvetmanual.com/management-and-nutrition/preventative-health-care-and-husbandry-of-beef-cattle/disease-screening-treatment-and-surveillance-in-beef-cattle>
  - Supports: Records are 'essential to monitor the incidence of disease ... and impact of disease on performance'. Screening requires 'regular observation of the herd'. Records 'should be analyzed on a regular basis'. Cited only for observation and records practice, not for treatment.

<a id="rule-gain-03"></a>
#### RULE-GAIN-03: Yearling target 2.0 lb/day

Status: current · Class **D** (synthetic demonstration setting) · Phase **1** (Fix now) · 6 sources (6 verified; 0 vendor)

**Rule.** CURRENT: Yearling steer target ADG = 2.0 lb/d, applied to any interval (groups.csv).

**Decision it supports.** Expected performance benchmark for yearlings on summer grass, used to judge group and individual gain.

**Required inputs.** Forage type (native range vs. improved/introduced cool-season pasture), supplementation, grazing period dates, stocking rate, precipitation/forage outlook, ranch history for the pasture.

**Where it applies.** Cattle class: Yearling steers on summer grass. Season: Whole grazing season vs shorter intervals. Geography: Northern Great Plains. Management: Group weigh-ins on a chute scale (demo: 2026-06-01, 2026-07-20, 2026-09-15).

**Classification: D (synthetic demonstration setting).** CHANGED from B. Checker gain dispute 3: 2.0 lb/d is reasonable as a season-average figure (Grings whole-season 2.36-2.62; Cheng 1.90-2.51 lb/d), which is B. Applying a season figure to any sub-season interval has no support, and the research's own sources show late-period gains of 1.30-1.46 lb/d. The rule as implemented is the demo's simplification, so the stricter class D applies; the season-average value alone is B.

**Evidence (research conclusion).** OBSERVED (gain.evidence.research.mjs, kg x 2.2046): Grings 2002 whole-season 2.62 / 2.36 / 2.45 lb/d (1993-95), but late periods 2.45 / 1.30 / 1.46. Cheng et al. 2022 (CPER, Colorado, 2014-18): traditional management 0.86-1.14 kg/d = 1.90-2.51 lb/d, adaptive rotation 0.74-1.00 kg/d = 1.63-2.20 lb/d. HPAL crested wheatgrass unsupplemented 1.51 lb/d. Sandhills spayed yearling heifers 1.17 / 0.73 lb/d. Reeves et al. 2013 (Cheyenne WY, 1982-2011) found cattle not grazed in 1989, 2000 and 2002 because of drought. Reeves et al. 2014 (Mandan ND, 1936-2005) report that seasonal weather explained up to 74% (R2 0.44-0.74) of variation in steer beef production per hectare (not per-head ADG).

**Limitations.** 2.0 lb/d is inside the published season-long range for good years. Applied flat to a single late-summer interval, it overstates expectations. It also ignores forage type, supplementation and year. Steer data are not directly transferable to heifers.

**Configurable?** Yes. It should be set per period (early/late season) and per pasture/forage type, ideally from the ranch's own records.

**Missing data that should block a confident conclusion.** Without the period dates and forage/pasture context, label the comparison 'against a season-average target' rather than treating a shortfall as a problem.

**Recommendation.** Replace the single target with an expected-ADG table by period (for example turnout-mid July and mid July-removal) and pasture type. Seed it with the ranch's own history and show the source of each expectation. A flat 2.0 is acceptable for the fictional demo only if labelled as a season-average illustration.

**Phase 1 (Fix now).** Label 2.0 lb/d as a demo season-average target. The gates in [RULE-GAIN-06](#rule-gain-06) and -07 limit misuse; period-specific expectations ([RULE-GAIN-08](#rule-gain-08)) are deferred. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [GAIN-05](02-findings.md#gain-05), [GAIN-10](02-findings.md#gain-10), [GAIN-11](02-findings.md#gain-11), [LOAD-03](02-findings.md#load-03).

**Sources.**

*Independent sources:*

- USDA-ARS / Society for Range Management, "Intensive-early stocking for yearling cattle in the Northern Great Plains" (published 2002; data years 1993-1995; peer-reviewed). Checker: **verified**. <https://ars.usda.gov/ARSUserFiles/30300500/Publications/JRM55-135-138.pdf>
  - Supports: Season-long vs late-period steer ADG by year (Table 6 and text). Precipitation 169%, 44% and 104% of normal.
- Elsevier / Society for Range Management (PDF hosted by USDA-ARS), "Evaluation of the APEX cattle weight gain component for grazing decision-support in the Western Great Plains (Rangeland Ecol. Manage. 82:1-11)" (published 2022; data years 2014-2018; peer-reviewed). Checker: **verified**. <https://www.ars.usda.gov/ARSUserFiles/30123025/Publications/2022/Cheng%20et%20al%202022%20REM%20-%20APEX%20cattle%20weight%20gain%20component.pdf>
  - Supports: Observed yearling steer ADG at CPER: traditional management 0.86-1.14 kg/d, CARM 0.74-1.00 kg/d. Steers weighed at the start and end of the season.
- Elsevier / Society for Range Management (PDF hosted by USDA-ARS), "Adaptive, multipaddock rotational grazing management: a ranch-scale assessment of effects on vegetation and livestock performance in semiarid rangeland (Rangeland Ecol. Manage. 73:796-810)" (published 2020; data years 2013 (pretreatment), 2014-2018; peer-reviewed). Checker: **verified**. <https://www.ars.usda.gov/ARSUserFiles/51815/67.%202020%20REM%20-%20CARM%20-%20adaptive%20multipaddock%20rotational%20grazing%20-%20vegetation%20and%20livestock%20responses.pdf>
  - Supports: CARM gains averaged 14.1% below traditional management (12-16% each year per the abstract; the Results give 11.7-16.2%). Gains calculated from shrunk weights at mid-May and early October. Exact yearly ADG appears only in Fig. 9.
- UNL BeefWatch, "Supplementing Yearlings in the Summer Grazing Season: Is it Worth it?" (published 2022-07-01; data years not stated for trial; extension). Checker: **verified**. <https://beef.unl.edu/beefwatch/2022/supplementing-yearlings-summer-grazing-season-it-worth-it>
  - Supports: 1.51 lb/d unsupplemented on crested wheatgrass, and about 2.0 lb/d supplemented.
- Society for Range Management (PDF hosted by USDA-ARS), "Temperature and precipitation affect steer weight gains differentially by stocking rate in northern mixed-grass prairie (Rangeland Ecol. Manage. 66:438-444)" (published 2013; data years 1982-2011; peer-reviewed). Checker: **verified**. <https://ars.usda.gov/arsuserfiles/30300500/Publications/Uploaded1272012/REE66-438-444-Reeves-2013.pdf>
  - Supports: Steer gains depended on spring and summer temperature and precipitation. No grazing in the 1989, 2000 and 2002 droughts. Steers held overnight without feed or water before weighing.
- Elsevier (PDF hosted by USDA-ARS), "Seasonal weather influences on yearling beef steer production in C3-dominated Northern Great Plains rangeland (Agric. Ecosyst. Environ. 183:110-117)" (published 2014; data years 1936-2005; peer-reviewed). Checker: **verified**. <https://www.ars.usda.gov/ARSUserFiles/30640500/HistoricalPasturePubs/51%20Reeves%20et%20al%20%20AGEE%202014.pdf>
  - Supports: Weather models explained R2 0.44-0.74 of the variation in steer beef production (kg/ha, not per-head ADG) at Mandan ND.

<a id="rule-gain-04"></a>
#### RULE-GAIN-04: First-calf heifer target 1.0 lb/day

Status: current · Class **D** (synthetic demonstration setting) · Phase **1** (Fix now) · 4 sources (3 verified, 1 partly; 0 vendor)

**Rule.** CURRENT: First-calf heifer target ADG = 1.0 lb/d over the summer (groups.csv Heifers, class 'first-calf heifers'), judged by the same 80%/50% rules.

**Decision it supports.** Whether young lactating cows are being fed well enough to keep growing and rebreed.

**Required inputs.** BCS (1-9) at the standard scoring times; calving date and lactation status; pregnancy diagnosis; optional weight paired with BCS at weaning.

**Where it applies.** Cattle class: First-calf heifers nursing calves. Season: Summer grazing. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Group weigh-ins on a chute scale (demo: 2026-06-01, 2026-07-20, 2026-09-15).

**Classification: D (synthetic demonstration setting).** Unchanged (research D). No source sets 1.0 lb/d for first-calf heifers; the supported measure is body condition (about BCS 6 at calving).

**Evidence (research conclusion).** No extension or research source located in this pass sets a summer ADG target for lactating first-calf heifers. The standard monitoring tool is BCS: UNL (2020) and SDSU (2022) both target BCS 6 for first-calf heifers (5 for mature cows). Published weight change of lactating young cows on Plains range, from gain.evidence.research.mjs: 'Heifers -0.15 vs serious &lt; 0.80: would be SERIOUS | [L18] Sandhills 2-yr-old primiparous cows, \~5 Aug-pregnancy dx, unsupplemented'; 'Heifers 0.18 ... [L18] same, supplemented'. Pregnancy rate did not differ (75% vs 81%, P = 0.41; Lansford et al. 2018). Lactating cows (pairs) on native range at NDSU Dickinson 1983-86 gained 0.25-0.82 lb/d (mean 0.59). That class is not identical to first-calf heifers. Shipped data: 'Heifers ... mean ADG 0.44 ... group serious &lt; 0.80' and 'animals under: 32'.

**Limitations.** With a 1.0 lb/d target, the rule flags weight changes that published Plains studies report as typical for lactating young cows (about -0.15 to +0.8 lb/d). An experienced ranch reader would see the planted 'heifers gaining well under target' alert as a likely false alarm, which hurts the portfolio's credibility. The individual threshold (0.5 lb/d) is inside weighing noise (see the individual rule).

**Configurable?** Yes. Better: make 'judged on ADG' a per-class switch and judge this class on BCS.

**Missing data that should block a confident conclusion.** Without BCS, calving date and lactation status, do not issue a nutrition verdict on first-calf heifers from weights alone.

**Recommendation.** Set the first-calf heifer ADG target to 'not judged', like cows. Add BCS records with target BCS 6 at calving (configurable) and score at weaning, about 90 d pre-calving, at calving and at breeding start. Keep any weights as context, paired with BCS. If the demo must show a heifer alert, plant it as BCS below target before calving.

**Phase 1 (Fix now).** Label 1.0 lb/d as a demo setting with no source. The BCS-based replacement is [RULE-CTX-12](#rule-ctx-12) (deferred). The planted heifer problem must still be found. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [GAIN-03](02-findings.md#gain-03), [GAIN-05](02-findings.md#gain-05), [GAIN-10](02-findings.md#gain-10).

**Sources.**

*Independent sources:*

- Nebraska Extension (BeefWatch), "Guide to Body Condition Scoring Your Beef Cow Herd" (published 2020-02-02; data years n/a; extension). Checker: **verified**. <https://beef.unl.edu/learning/condition1a.shtml>
  - Supports: 1-9 BCS scale. Mature cows calve at BCS 5 or more. First-calf heifers at BCS 6 because they have only reached about 85% of mature weight. Scoring times: late summer/early fall, weaning, \~45 d after weaning, \~90 d before calving, calving, breeding start. Rumen fill and pregnancy can mislead visual scores.
- SDSU Extension, "Management of Body Condition Score Throughout the Year" (updated 2022-09-09; data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/management-body-condition-score-throughout-year>
  - Supports: 'Mature cows should have a BCS of 5, with a BCS of 6 for first-calf heifers' to rebreed within 80-85 days of calving.
- University of Nebraska-Lincoln, "Effect of Supplementation during the Breeding Season on a May-calving Herd in the Nebraska Sandhills" (published 2018; data years 4-year study (calendar years not stated); field study or demonstration). Checker: **verified**. <https://Beef.unl.edu/documents/2018-beef-report/2018-06-Effect-of-Supplementation-during-the-Breeding-Season-on-a-May-calving-Herd.pdf>
  - Supports: 2-yr-old primiparous cows (n = 135) at Gudmundsen Sandhills Lab. ADG from prebreeding to pregnancy diagnosis was -0.15 lb/d unsupplemented and 0.18 supplemented. Pregnancy 75% vs 81% (P = 0.41).
- NDSU Dickinson Research Extension Center, "Complementary Rotation Grazing System in Western North Dakota (Project 1906; file named 'Pasture Management for Western North Dakota')" (undated; data years 1983-1986; field study or demonstration). Checker: **partly**. <https://www.ndsu.edu/agriculture/sites/default/files/2022-10/Pasture%20Management%20for%20Western%20North%20Dakota.pdf>
  - Supports: Table 4: cow ADG on native range was 0.82, 0.25, 0.50 and 0.78 lb/d (mean 0.59) while nursing calves. That native range was a three-pasture twice-over rotation. (The '+4.88 to -2.11 lb/d' interval swing is not a native-range summer figure: +4.88 was crested wheatgrass, 13-30 May, and -2.11 was altai wildrye, 10 Nov-12 Dec.)

<a id="rule-gain-05"></a>
#### RULE-GAIN-05: Cows skipped by the gain rules (target 0.0)

Status: current · Class **D** (synthetic demonstration setting) · Phase **1** (Fix now) · 3 sources (3 verified; 0 vendor)

**Rule.** CURRENT: Cows (cow-calf pairs) target 0.0, so the gain rules skip them ('if (!g.target) continue'). No other cow condition measure exists.

**Decision it supports.** Whether mature cows need nutritional attention ahead of calving or breeding.

**Required inputs.** BCS (1-9) by cow or by sampled group, date, scorer; optional cow weight at weaning paired with BCS.

**Where it applies.** Cattle class: Mature cows nursing calves (demo: 180 pairs). Season: All year; key points at weaning and before calving. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: No condition records in the demo.

**Classification: D (synthetic demonstration setting).** CHANGED from A. Checker gain dispute 0: only the narrow point 'do not judge mature cows on ADG' is general guidance. The supported practice is to monitor cows by body condition score (UNL, SDSU, Angus AHIR), and the current rule does neither: it silently skips 180 head. As implemented in the demo it is D; the BCS replacement ([RULE-CTX-12](#rule-ctx-12)) carries the A part.

**Evidence (research conclusion).** OBSERVED (gain.evidence.research.mjs): 'Cows: inventory 180, target 0 -> skipped by 'if (!g.target) continue'; weights.csv rows for Cows: 0; no BCS field exists in any CSV.' Extension sources monitor cows by BCS (UNL 2020; SDSU 2022). Breed-association recording pairs cow weight with BCS around weaning: Angus AHIR says 'Dams must be weighed 45 days before or after weaning a calf' and 'Dams should be scored 45 days before or after weaning'.

**Limitations.** Not judging cows on ADG is the supported practice. But the dashboard then has no cow condition signal at all, and 'target 0' reads as 'no gain expected' rather than 'judged on BCS'.

**Configurable?** Yes. Make it an explicit per-class 'metric: ADG | BCS | none' setting instead of overloading target 0.

**Missing data that should block a confident conclusion.** Without a recent BCS (for example none since weaning, or none within \~90 d of calving), show 'condition not recorded', not 'no exceptions'.

**Recommendation.** Add a bcs.csv (group or tag, date, score, scorer). Add a rule that flags a group when its median or share-below-target BCS misses a ranch-set target at the standard scoring times (default 5 for mature cows, 6 for first-calf heifers).

**Phase 1 (Fix now).** Copy only: say on the page that cows are not monitored by the gain rules and that no body condition records exist. The BCS module is deferred ([RULE-CTX-12](#rule-ctx-12)).

**Related.** Related findings (as mapped in 02-findings.md section 6): [GAIN-13](02-findings.md#gain-13).

**Sources.**

*Independent sources:*

- Nebraska Extension, "Guide to Body Condition Scoring Your Beef Cow Herd" (published 2020-02-02; data years n/a; extension). Checker: **verified**. <https://beef.unl.edu/learning/condition1a.shtml>
  - Supports: BCS targets and scoring times.
- American Angus Association, "AHIR Guidelines (mature cow weight and BCS)" (undated; data years n/a; other publisher). Checker: **verified**. <https://aimsdata.angus.org/performance/AhirGuidelines>
  - Supports: Cow weight and BCS are recorded together within 45 d of weaning.
- SDSU Extension, "Management of Body Condition Score Throughout the Year" (updated 2022-09-09; data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/management-body-condition-score-throughout-year>
  - Supports: BCS 5 target for mature cows.

### 2.4 Health

<a id="rule-hlth-01"></a>
#### RULE-HLTH-01: Overdue open health task is serious

Status: current · Class **D** (synthetic demonstration setting) · Phase **1** (Fix now) · 3 sources (3 verified; 0 vendor)

**Rule.** CURRENT: An open health task past its next_due date is 'serious', and the action reads 'Schedule it this week' (exceptions.js:140-144; app.js:211 rules row 'An open health task is past its due date').

**Decision it supports.** Whether a scheduled herd-health job (vaccination, parasite control, exam or observation) needs attention now.

**Required inputs.** group, task, next_due (YYYY-MM-DD), status=='open', as_of date.

**Where it applies.** Cattle class: Any group with a scheduled task (demo: Yearlings booster). Season: Per task schedule. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Group health schedule in health.csv (scheduling and records only).

**Classification: D (synthetic demonstration setting).** Unchanged (research D). The demo booster is 105 days after the first dose, against the label's usual 2-4 week window, so 'Schedule it this week' does not fit the case.

**Evidence (research conclusion).** OBSERVED (node docs/audit/diagnostics/health.schedule.research.mjs): 'serious | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15) | action: "Schedule it this week"'. OBSERVED: 'Booster: last_done 2026-06-02 -> next_due 2026-09-15 = 105 days apart'. SOURCES: the BQA National Manual says 'almost all products recommend a second vaccination two (2) to four (4) weeks after the initial vaccination' and 'Follow all FDA/USDA/EPA guidelines and label directions'. UC Davis (Maas 2008) says booster needs are reviewed by USDA at licensing and 'will therefore, be on the label and should be followed', and that without the timed second dose the vaccine 'will probably not stimulate an effective immune response'. INFERENCE: lateness that matters for a label-driven booster is lateness against the label or vet window, not against a ranch-entered date. A 105-day gap does not fit the 2-4 week primary-series pattern. Either the row is a different kind of revaccination or the date is not from a label, and the data cannot show which.

**Limitations.** No task type, so a missed observation check and a missed label booster window get the same severity and the same action. No window_end or schedule_source, so 'Overdue' cannot say whether the label window is gone. The status match is exact: healthbudget.repro.mjs H-01 OBSERVED that status 'Open', 'OPEN' and 'open ' all give '(no alerts)' on a task 15 days late. 'Schedule it this week' implies a late booster can simply be given, which is a label and veterinarian question. None of the fetched sources gives a general rule on whether a late dose still counts.

**Configurable?** Partly. Keep an overdue flag. Severity and wording should depend on task_type and schedule_source (product_label / vet_plan / ranch_plan) rather than being one global rule.

**Missing data that should block a confident conclusion.** Without window_end and schedule_source the dashboard must not word a vaccination row as if the window is still usable. Without task_type it must not reuse vaccination wording for observation checks.

**Recommendation.** Compute overdue against window_end rather than a single next_due. For vaccination or parasite tasks whose window came from the label or vet plan and has passed: 'The window on the [label/vet plan] closed N days ago. Check the label and ask your veterinarian how to proceed before scheduling.' For ranch-plan tasks: 'Past the planned date. Reschedule with [responsible].' For observation tasks: 'No check recorded since [date]. Look the group over on the next pasture check and record what you see.' The rules table and README should say the threshold is a demonstration setting.

**Phase 1 (Fix now).** Normalise status first ([RULE-HLTH-03](#rule-hlth-03)). Keep the overdue booster found. Reword the action to scheduling plus 'check the label or your veterinarian's plan for the booster window', and label the severity as a demo setting. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [HLTH-01](02-findings.md#hlth-01), [HLTH-04](02-findings.md#hlth-04), [CSV-05](02-findings.md#csv-05), [DATA-02](02-findings.md#data-02), [TIME-03](02-findings.md#time-03), [UI-13](02-findings.md#ui-13).

**Sources.**

*Independent sources:*

- Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor), "Beef Quality Assurance National Manual (bqa_manual_final.pdf)" (undated (no date in the PDF; newest data cited are the 2016 NBQA, a 2018 footnote and a 1998-2017 series). Likely superseded: NCBA announced an updated manual on 2024-12-19 (2025-01-06 is a trade-press reprint date), and bqa.org now links a 2026 edition that could not be fetched.; data years newest data cited: 2016 National Beef Quality Audit; a 1998-2017 series; standard or specification). Checker: **verified**. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf>
  - Supports: Sec. 4.4 Vaccinations (p.47 per fetch): 'almost all products recommend a second vaccination two (2) to four (4) weeks after the initial vaccination'. p.42: 'Follow all FDA/USDA/EPA guidelines and label directions for each product.' p.44: booster vaccinations follow the herd health plan.
- UC Davis School of Veterinary Medicine Extension (J. Maas), in California Cattlemen's Magazine, "Booster Vaccines (UC Davis Vet Views, cca0810)" (published 2008-10; data years n/a; extension). Checker: **verified**. <https://vetext.vetmed.ucdavis.edu/sites/g/files/dgvnsk5616/files/local_resources/pdfs/pdfs_beef/cca0810-booster-vaccines.pdf>
  - Supports: Booster need is on the label and should be followed. Without the timed second dose the vaccine 'will probably not stimulate an effective immune response'. 'The best source of vaccine information is from your cattle veterinarian.'
- SDSU Extension (R. Daly), "Springtime Vaccines: Tools For Healthy Summer Calves" (published 2020-06-10 (updated); data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/springtime-vaccines-tools-healthy-summer-calves>
  - Supports: 'Some vaccines, especially killed vaccines, require booster doses'. Follow label instructions. Getting calves back off pasture for boosters is a practical challenge. Consult the local veterinarian before changing a program.

<a id="rule-hlth-02"></a>
#### RULE-HLTH-02: Open health task due within 7 days is a warning

Status: current · Class **D** (synthetic demonstration setting) · Phase **1** (Fix now) · 3 sources (3 verified; 0 vendor)

**Rule.** CURRENT: An open health task due within RULES.dueSoonDays = 7 days is a 'warning', and the action reads 'Plan it with the next gather' (exceptions.js:13, 145-146).

**Decision it supports.** When to start planning a gather, crew, products or a veterinarian visit for an upcoming task.

**Required inputs.** next_due, status, as_of, and the dueSoonDays setting.

**Where it applies.** Cattle class: Any group with a scheduled task (demo: Cows pinkeye check due 2026-10-03). Season: Per task schedule. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Group health schedule (scheduling and records only).

**Classification: D (synthetic demonstration setting).** Unchanged (research D).

**Evidence (research conclusion).** OBSERVED: 'warning | Cows: Pinkeye check | Due in 3 days (2026-10-03) | action: "Plan it with the next gather"'. OBSERVED (healthbudget.repro.mjs HB-C3): due in 7 days gives a warning and due in 8 days gives nothing. The code comment reads 'health task due within a week' and cites no source. SOURCES: NDSU 2025 says to check cattle closely in pasture for early pinkeye signs and that dust and crowding (tail switching) irritate eyes. That describes observation in place, not gathering. NDSU 2020 ties pregnancy-check timing to the breeding season and says to consult the veterinarian on method. SDSU 2020 notes the difficulty of getting cattle back off pasture for boosters, which argues for matching tasks to gathers well ahead.

**Limitations.** One horizon does not fit vet booking or a crew gather. The 'next gather' wording is wrong for observation tasks. No responsible person is shown, so nobody owns the warning.

**Configurable?** Yes. Lead time should be a per-task-type setting (for example observation 0 days, gather tasks about 7 days, vet-dependent tasks longer). Values are a ranch choice and should be labelled as such.

**Missing data that should block a confident conclusion.** Without task_type and vet_needed the dashboard cannot choose the right lead time or wording. Without responsible it should say 'Unassigned'.

**Recommendation.** Warn when window_start is within the task type's lead time. Use action text by type: observation 'Look the group over on the next pasture check…'; gather task 'Plan it with the next gather ([responsible])'; vet-dependent 'Confirm the date with your veterinarian and plan the gather.' Label 7 days as a demonstration setting in the rules table.

**Phase 1 (Fix now).** Label 7 days as a demo setting; the pinkeye check must still be found. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [HLTH-01](02-findings.md#hlth-01), [TIME-03](02-findings.md#time-03), [UI-06](02-findings.md#ui-06).

**Sources.**

*Independent sources:*

- NDSU Agriculture Communication (J. Galbreath, L. Quail), "Summer brings raised pinkeye concerns in cowherds" (published 2025-07-02; data years n/a; extension). Checker: **verified**. <https://www.ag.ndsu.edu/news/newsreleases/2025/july/summer-brings-raised-pinkeye-concerns-in-cowherds>
  - Supports: Check cattle closely in pasture and drylot for early signs. Dust and crowding (tail switching) irritate eyes. Treatment decisions are made 'in consultation with their veterinarian'.
- NDSU Agriculture Communication (J. Block, K. Hoppe, G. Stokka), "Consider Pregnancy Testing Beef Cattle Early" (published 2020-07-06 (URL) / 2020-07-09 (byline); data years n/a; extension). Checker: **verified**. <https://www.ag.ndsu.edu/news/newsreleases/2020/july-6-2020/consider-pregnancy-testing-beef-cattle-early>
  - Supports: Pregnancy testing 'as early as 30 to 45 days after the end of the breeding season'. Method timing differs (ultrasound about 30 d, palpation 1-2 weeks later, blood test 25-30 d post-breeding and 60-90 d post-calving depending on test). Consult the veterinarian on method.
- SDSU Extension (R. Daly), "Springtime Vaccines: Tools For Healthy Summer Calves" (published 2020-06-10 (updated); data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/springtime-vaccines-tools-healthy-summer-calves>
  - Supports: Branding or turnout is a natural time to work calves. Bringing calves back off pasture for boosters is a challenge.

<a id="rule-hlth-03"></a>
#### RULE-HLTH-03: Open tasks with no due date, or a status other than 'open', are skipped

Status: current · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 1 source (1 verified; 0 vendor)

**Rule.** CURRENT: An open task with a blank next_due is skipped silently (exceptions.js:141 'if (h.status !== "open" || !h.next_due) continue'). Statuses other than the exact string 'open' are also skipped silently.

**Decision it supports.** Whether an outstanding health task is visible to the manager at all.

**Required inputs.** status, next_due

**Where it applies.** Cattle class: Any group. Season: Any. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: health.csv rows with blank next_due or a status other than the exact string 'open'.

**Classification: C (ranch-specific management choice).** Class left at C as the research gave it, but reframed per checker health dispute 6: silently dropping open tasks is a data-integrity defect, not a ranch management choice. The replacement (trim and lower-case status; an open task with a blank due date is shown as a data issue) is a fixed data-contract rule, not a setting.

**Evidence (research conclusion).** OBSERVED (healthbudget.repro.mjs): H-03 open task with blank next_due gives '(no alerts)'. H-04 next_due 'TBD' gives '(no alerts)'. H-02 status 'in progress' etc. on a task due Sep 15 gives '(no alerts)'. H-05 is the committed row 'Cows,Fly tag check,2026-06-05,2026-09-01,done', whose next_due passed with last_done still June 5, and it is not surfaced. In the committed data the only blank next_due is on a 'done' row (Heifers Pre-breeding vaccine), so the demo output is unaffected today.

**Limitations.** Health data appears nowhere else on the page, so a skipped row means the task is invisible. A single row mixes schedule (next_due) with history (last_done), which makes 'done' ambiguous for recurring tasks.

**Configurable?** No for the visibility principle. Yes for the severity given to 'unscheduled' rows.

**Missing data that should block a confident conclusion.** An open task with no usable date or an unknown status must not be treated as 'nothing due'. Show it as a data issue.

**Recommendation.** Normalise status (trim, lower-case) and accept a fixed set (open, done, cancelled, deferred). Show an unknown status or an open task with no date as a row such as 'No due date recorded. Set one with [responsible] or your veterinarian.' Split the schedule (planned tasks with windows) from completion records (append-only).

**Phase 1 (Fix now).** Lead default 'health status normalisation and blank due dates as data issues'. The demo row 'Heifers, Pre-breeding vaccine, blank next_due, done' is done, so it raises nothing. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [HLTH-01](02-findings.md#hlth-01), [HLTH-02](02-findings.md#hlth-02), [HLTH-03](02-findings.md#hlth-03), [CSV-05](02-findings.md#csv-05).

**Sources.**

*Independent sources:*

- Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor), "Beef Quality Assurance National Manual (bqa_manual_final.pdf)" (undated (no date in the PDF; newest data cited are the 2016 NBQA, a 2018 footnote and a 1998-2017 series). Likely superseded: NCBA announced an updated manual on 2024-12-19 (2025-01-06 is a trade-press reprint date), and bqa.org now links a 2026 edition that could not be fetched.; data years newest data cited: 2016 National Beef Quality Audit; a 1998-2017 series; standard or specification). Checker: **verified**. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf>
  - Supports: Sec. 4.3 Herd Health Planning: 'Keep records of all products administered including date, animal identification, product used'. Records support a herd health plan, which is the basis for not dropping outstanding tasks.

### 2.5 Budget

<a id="rule-bud-01"></a>
#### RULE-BUD-01: Category serious above 10% over budget

Status: current · Class **D** (synthetic demonstration setting) · Phase **1** (Fix now) · 4 sources (2 verified, 2 partly; 0 vendor)

**Rule.** CURRENT: Serious when a category is more than 10% over budget, season to date (exceptions.js RULES.budgetSerious = 0.10; budgetStatus sums every row in budget.csv per category, pct = (actual - budget) / budget).

**Decision it supports.** Whether the manager should find out what drove a category overrun now and decide whether to reforecast.

**Required inputs.** Per-category monthly budget and actual. Today there is no as_of filter, no closed-month flag, no dollar test and no record of the accounting basis.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: D (synthetic demonstration setting).** Unchanged (research D). Today the rule sums every row in budget.csv, so future plan rows dilute the total and a zero budget gives 'Infinity%'.

**Evidence (research conclusion).** OBSERVED (node docs/audit/diagnostics/budget.materiality.research.mjs): committed data gives 'Fuel budget 9600 actual 11640 cur pct 21.3% -> current: serious' and 'Repairs budget 7200 actual 9000 cur pct 25.0% -> current: serious'. Scenario S2: 'Ear tags budget 200 actual 230 cur pct 15.0% -> current: serious', 'Labor budget 36000 actual 38700 cur pct 7.5% -> current: warning', 'Feed (big) budget 90000 actual 92700 cur pct 3.0% -> current: -'. OBSERVED (node docs/audit/diagnostics/healthbudget.repro.mjs): BU-01 'serious | Hay | Infinity% over season to date (\$500)'; BU-06 adding Oct/Nov plan rows with actual 0 gives 'Fuel 11640/14400 = -19.2%; Repairs 9000/10800 = -16.7%; (no alerts)'. EXTERNAL: no extension, agency or peer-reviewed source found that sets 10% for ranch budget categories. Institutional variance policies that use 10% pair it with a dollar test (UW MAA: '+/- 10% or more AND +/- \$5,000 or more'). Others use different percentages joined by OR (U Alberta: 5% or \$100,000 unfavorable). GFOA speaks only of 'significant' variances and gives no number.

**Limitations.** Percent-only: it ignores scale, so a \$30 overrun on a small line outranks a \$2,700 overrun on a large one. It compares against the full-season straight-line sum of whatever rows are in the file, not the plan to date. Division by zero produces Infinity or NaN. Future plan rows dilute the result. No source validates 10% for ranch use.

**Configurable?** Yes. RULES.budgetSerious is a single constant, but on its own it cannot express a dollar materiality test.

**Missing data that should block a confident conclusion.** A closed month with no actual for a category; a zero or blank budget (percent is undefined); plan rows after as_of; an unknown cash or accrual basis. Each should stop a confident serious call for that category.

**Recommendation.** Keep 10% only as a labelled demonstration setting inside the combined percent-and-dollar rule below. Compute it over closed months only, and label it in the UI and README as a ranch-chosen setting, not a validated standard.

**Phase 1 (Fix now).** Count closed months only ([RULE-BUD-05](#rule-bud-05)), exclude rows after as_of, and judge a zero budget in dollars ([RULE-BUD-06](#rule-bud-06)). Fuel and repairs (planted) must still be found. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [BUD-01](02-findings.md#bud-01), [BUD-02](02-findings.md#bud-02), [BUD-03](02-findings.md#bud-03), [BUD-04](02-findings.md#bud-04), [BUD-05](02-findings.md#bud-05), [BUD-06](02-findings.md#bud-06), [DATA-03](02-findings.md#data-03), [UI-09](02-findings.md#ui-09).

**Sources.**

*Independent sources:*

- University of Washington Finance, Management Accounting & Analysis, "Recharge Center Variance Analysis \*ON HOLD" (published 2014-02-28 (page submission date; page marked ON HOLD, replaced by monthly financial reporting); data years n/a; other publisher). Checker: **verified**. <https://finance.uw.edu/maa/node/228>
  - Supports: An institutional example of a combined rule: explanation required only if variance is >= 10% AND >= \$5,000 (both conditions).
- University of Alberta (UAPPOL), "Budget Variance Accountability Procedure" (Approved 2006-07-17; editorial amendments 2025-05-20; data years n/a; other publisher). Checker: **partly**. <https://ualberta.ca/en/alfresco/uappol/finance/budget-variance-accountability/procedure/budget-variance-accountability-procedure.pdf>
  - Supports: Different percentages and dollar amounts, joined by OR: unfavorable variance 'exceeds 5% ... or \$100,000'; favorable 'exceeds 5% ... or \$500,000'. Shows that thresholds and AND/OR logic are organizational choices. Both apply to YEAR-END variances and trigger a funding or carry-forward plan, not an in-year alert or a variance explanation.
- Government Finance Officers Association (GFOA), "Budget Monitoring (best practice)" (Board approved 2018-03-31; data years n/a; other publisher). Checker: **partly**. <https://gfoa.org/materials/budget-monitoring>
  - Supports: Monitoring should analyze 'why deviations occurred' and assign responsibility. It names no numeric threshold, only 'significant' variances.
- PCAOB, "AS 2105: Consideration of Materiality in Planning and Performing an Audit" (Effective for audits of fiscal years beginning on or after 2010-12-15; data years n/a; standard or specification). Checker: **verified**. <https://pcaobus.org/oversight/standards/auditing-standards/details/AS2105>
  - Supports: Para .03: materiality evaluation 'requires consideration of both qualitative and quantitative factors'. Para .07: lesser amounts can matter. This is an analogy only (audit materiality, not ranch budgeting).

<a id="rule-bud-02"></a>
#### RULE-BUD-02: Category warning 5-10% over budget

Status: current · Class **D** (synthetic demonstration setting) · Phase **1** (Fix now) · 2 sources (1 verified, 1 partly; 0 vendor)

**Rule.** CURRENT: Warning when a category is 5-10% over budget season to date (RULES.budgetWarn = 0.05; code tests pct > 0.05 and pct > 0.10 with strict inequalities; warning text omits dollars; action 'Watch it next month').

**Decision it supports.** Whether to keep an eye on a category before it becomes serious.

**Required inputs.** Same as the serious rule.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: D (synthetic demonstration setting).** Unchanged (research D).

**Evidence (research conclusion).** OBSERVED (healthbudget.repro.mjs): BU-08 'exactly 5.0% over (1,050 vs 1,000)' produced '(no alerts)', although the rules table and README say '5-10%'. BU-09 '9.6%: warning | X | 10% over season to date' vs '10.4%: serious | X | 10% over season to date (\$104)': both texts say 10% at different severities. BU-11 warning text '6% over season to date' has no dollar amount. EXTERNAL: 5% is used by U Alberta, but only with a dollar alternative and at institutional scale. No ranch-specific validation was found.

**Limitations.** The boundary does not match the documented text. Rounding hides which band applies. Without dollars the manager cannot judge materiality.

**Configurable?** Yes (RULES.budgetWarn).

**Missing data that should block a confident conclusion.** Same as the serious rule.

**Recommendation.** Make boundaries inclusive (>=) so the rule matches '5-10%'. Print one decimal place and always print dollars. Fold this into the combined rule's warning band.

**Phase 1 (Fix now).** Fix the boundary (exactly 5% over currently raises nothing) and show dollars beside the percent. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (as mapped in 02-findings.md section 6): [BUD-04](02-findings.md#bud-04), [BUD-05](02-findings.md#bud-05), [BUD-06](02-findings.md#bud-06), [BUD-07](02-findings.md#bud-07), [UI-08](02-findings.md#ui-08).

**Sources.**

*Independent sources:*

- University of Alberta (UAPPOL), "Budget Variance Accountability Procedure" (Approved 2006-07-17; editorial amendments 2025-05-20; data years n/a; other publisher). Checker: **partly**. <https://ualberta.ca/en/alfresco/uappol/finance/budget-variance-accountability/procedure/budget-variance-accountability-procedure.pdf>
  - Supports: A 5% threshold with a dollar alternative (5% or \$100,000 unfavorable), applied to the year-end variance to trigger a funding plan, not to monthly alerts.
- University of Washington Finance, Management Accounting & Analysis, "Recharge Center Variance Analysis \*ON HOLD" (published 2014-02-28 (page submission date); data years n/a; other publisher). Checker: **verified**. <https://finance.uw.edu/maa/node/228>
  - Supports: Thresholds are stated as 'equal to or greater than' (inclusive) for both percent and dollars.

### 2.6 Workflow and display

<a id="rule-wf-01"></a>
#### RULE-WF-01: Severity by icon shape plus a word, never colour alone

Status: current · Class **A** (supported general guidance) · Phase **1** (Fix now) · 2 sources (2 verified; 0 vendor)

**Rule.** CURRENT: severity is shown by icon shape plus a text label, never by colour alone (badge() in app.js: octagon=Critical, triangle=Serious, circle=Warning, each followed by the word).

**Decision it supports.** Lets the manager and crew rank exceptions at a glance, including people with colour-vision deficiency and readers of a greyscale printout.

**Required inputs.** Severity per exception row (computed by findExceptions).

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: A (supported general guidance).** Unchanged (research A; WCAG 2.2 SC 1.4.1).

**Evidence (research conclusion).** OBSERVED: app.js badge() renders ICON[sev] (distinct SVG shapes) followed by the capitalised severity word. My Playwright run read the table cells as text: bySeverity {"Critical":2,"Serious":6,"Warning":2}. On the Chromium print PDF the icons and words survived (page-1 render at 60 dpi shows the icon and 'Critical'/'Serious' words). SOURCE: WCAG 2.2 SC 1.4.1 (Level A), quoted by the fetch as 'Color is not used as the only visual means of conveying information, indicating an action'. The Understanding page says a specific-colour meaning (e.g. green = valid) needs an additional cue whatever the contrast.

**Limitations.** Charts encode some states mainly by hue. The over-plan grazing segment (--serious) sits next to the current stay (--s1) at 1.25:1 contrast, but it carries a '+3d' text label. Budget bars are red/green but carry +/-% labels and a dollar table, so 1.4.1 is met there through text. In print, the '+3d' label and the gain 'target' labels nearly vanished (see the print rule).

**Configurable?** No. This is an accessibility floor, not a ranch preference.

**Missing data that should block a confident conclusion.** None. It is a presentation rule.

**Recommendation.** Keep it. Extend the same shape+text treatment to any new state the report gains (Acknowledged, Shelved, Cleared since last review) and to chart annotations, so no state depends on hue.

**Phase 1 (Fix now).** Keep it, and extend the same shape + text treatment to the CAN'T TELL state.

**Related.** 02-findings.md section 6 lists no finding for this rule.

**Sources.**

*Independent sources:*

- W3C, "Web Content Accessibility Guidelines (WCAG) 2.2, W3C Recommendation" (published 2024-12-12; data years n/a; standard or specification). Checker: **verified**. <https://www.w3.org/TR/WCAG22/>
  - Supports: Normative text of SC 1.4.1 Use of Color (Level A)
- W3C WAI, "Understanding SC 1.4.1: Use of Color" (Updated 2025-09-16; data years n/a; standard or specification). Checker: **verified**. <https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html>
  - Supports: Colour must be paired with another visual cue. Identifying a specific colour's meaning requires an additional indicator (G14, G111, G205; failure F81).

<a id="rule-wf-06"></a>
#### RULE-WF-06: Pointer targets at least 24 x 24 px

Status: current (passes) · Class **A** (supported general guidance) · Phase **1** (Fix now) · 1 source (1 verified; 0 vendor)

**Rule.** CURRENT (passes): pointer targets are at least 24x24 CSS px (2.5.8). Any new acknowledge, note or shelve controls must keep this.

**Decision it supports.** Cuts mis-taps on a phone in a moving vehicle or with gloves.

**Required inputs.** None.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: A (supported general guidance).** Unchanged (research A; WCAG 2.2 SC 2.5.8).

**Evidence (research conclusion).** OBSERVED: desktop chips measured 69.3-92.3 x 30.1 CSS px with 8 px minimum gap, "allAtLeast24": true. Phone (390 px) gave minW 69.3, minH 30.1, minGapPx 8. SOURCE: SC 2.5.8 (AA), 'The size of the target for pointer inputs is at least 24 by 24 CSS pixels, except when...', with the Spacing, Equivalent, Inline, User agent control and Essential exceptions (Understanding page). Chart dots (4.5 px) only trigger hover and do nothing on tap, so they are not activation targets today. If they become tappable, they will fail unless an equivalent control exists (the Equivalent exception would be met by a data table).

**Limitations.** 24 px is the AA minimum. A larger size for gloved or outdoor use is a sensible design choice, but I did not fetch a source for a specific larger figure.

**Configurable?** Larger sizes, yes. The minimum, no.

**Missing data that should block a confident conclusion.** None.

**Recommendation.** Keep the chips as they are. Build 'Acknowledge', 'Add note' and 'Shelve' as full-width row buttons on phones, at least 24 px tall and comfortably more.

**Phase 1 (Fix now).** Keep it; any new control (filters, acknowledgement) must keep 24 x 24 CSS px targets.

**Related.** Related findings (as mapped in 02-findings.md section 6): [UI-01](02-findings.md#ui-01).

**Sources.**

*Independent sources:*

- W3C WAI, "Understanding SC 2.5.8: Target Size (Minimum)" (Updated 2026-05-11; data years n/a; standard or specification). Checker: **verified**. <https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>
  - Supports: The 24x24 CSS px rule, the five exceptions verbatim, and the 24 px circle spacing test

<a id="rule-wf-07"></a>
#### RULE-WF-07: Visible keyboard focus

Status: current (passes in Chromium) · Class **A** (supported general guidance) · Phase **1** (Fix now) · 3 sources (2 verified, 1 partly; 0 vendor)

**Rule.** CURRENT (passes in Chromium): keyboard focus is visible (2.4.7) and never fully hidden by author content (2.4.11). Pressed or unpressed chip state meets 3:1 (1.4.11).

**Decision it supports.** Lets keyboard users see where they are while triaging.

**Required inputs.** None.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: A (supported general guidance).** Unchanged (research A; WCAG 2.2 SC 2.4.7, 2.4.11, 1.4.11).

**Evidence (research conclusion).** OBSERVED: every chip Tab stop gave focusVisible true, outline 'auto 1px rgb(16, 16, 16)'. A 2x screenshot shows a clear white ring around 'Water (3)' (scratch file focus-chip.png). Fixed or sticky elements: ["tip"] only, and the tooltip is non-persistent. Pressed chip fill --s1 vs the card surface is 9.62:1. Unpressed chip border --axis vs fill is 1.61:1, but the chip is identified by its text label, which Understanding 1.4.11 says removes the need for a 3:1 boundary. SOURCE: SC 2.4.7, SC 2.4.11 (a focused component must not be 'entirely hidden due to author-created content'), and Understanding 1.4.11 (state indicators need 3:1; a boundary is needed only if nothing else identifies the control).

**Corrections from the citation checks.**

- Understanding 2.4.7 does not say default focus indicators 'must be highly visible'.

**Limitations.** Only the Chromium default focus ring was tested. Firefox and Safari were not tested. Understanding 2.4.7 lists the platform default focus indicator (G165) as sufficient but does not guarantee that every browser's default is easy to see.

**Configurable?** No.

**Missing data that should block a confident conclusion.** None.

**Recommendation.** Keep. If a sticky 'data as of / counts' bar is added for the morning review, add scroll-padding-top (technique C43) so focused rows are not hidden under it.

**Phase 1 (Fix now).** Keep it. Tested in headless Chromium only (research).

**Related.** Related findings (as mapped in 02-findings.md section 6): [UI-10](02-findings.md#ui-10).

**Sources.**

*Independent sources:*

- W3C WAI, "Understanding SC 2.4.7: Focus Visible" (Updated 2026-09-06; data years n/a; standard or specification). Checker: **partly**. <https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html>
  - Supports: Focus indicator visible in some mode; G165 platform default; F78
- W3C WAI, "Understanding SC 2.4.11: Focus Not Obscured (Minimum)" (Updated 2026-06-15; data years n/a; standard or specification). Checker: **verified**. <https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html>
  - Supports: Sticky headers are the common failure; C43 scroll-padding; non-persistent tooltips pass
- W3C WAI, "Understanding SC 1.4.11: Non-text Contrast" (Updated 2026-09-06; data years n/a; standard or specification). Checker: **verified**. <https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html>
  - Supports: 3:1 for component state indicators; a boundary is not required when text identifies the control

<a id="rule-wf-09"></a>
#### RULE-WF-09: Every exception row has a first step

Status: current · Class **B** (context-dependent guidance) · Phase **1** (Fix now) · 2 sources (2 verified; 1 vendor)

**Rule.** CURRENT: every exception row carries a defined first response (the 'First step' column), and a condition with no response is not an exception.

**Decision it supports.** Turns each row into something a crew lead can do, and keeps informational status off the attention list.

**Required inputs.** A response text per rule.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: B (context-dependent guidance).** Unchanged (research B; process-industry alarm guidance applied by analogy).

**Evidence (research conclusion).** OBSERVED: all 10 rows have a non-empty First step, e.g. 'Check for a leak or a stuck float; haul water if it can't be fixed today'. SOURCES: the exida white paper (a consultancy paper summarising ISA-18.2) says ISA-18.2 defines an alarm as an indication 'requiring a response', and 'if the operator does not need to respond, then there should not be an alarm'. HSE CHIS6 says every alarm needs an operator action, alarms without a defined response should be reviewed or removed, and process status indicators should not be configured as alarms.

**Corrections from the citation checks.**

- exida misquote: the paper says 'if the operator does not need to respond, then there should not be an alarm', not 'there should be no alarm'.

**Limitations.** The evidence comes from continuous process-control consoles, not once-a-day ranch reviews. It was not validated in ranching.

**Configurable?** The response text is ranch-specific (C). The principle itself is not configurable.

**Missing data that should block a confident conclusion.** None.

**Recommendation.** Keep. Move pure status (e.g. 'Head on grass 375') out of anything styled as an alert. Document each rule's consequence and the response time it assumes in the rules table.

**Phase 1 (Fix now).** Keep it; CAN'T TELL rows also need a first step (for example 'check the tank by eye').

**Related.** Related findings (as mapped in 02-findings.md section 6): [GRZ-08](02-findings.md#grz-08), [UI-02](02-findings.md#ui-02).

**Sources.**

*Independent sources:*

- UK Health and Safety Executive, "Better alarm handling (Chemicals Sheet No 6, CHIS6)" (published 2000-03; data years Incident case 1994 (Milford Haven); government agency). Checker: **verified**. <https://www.hse.gov.uk/pubns/chis6.pdf>
  - Supports: Every alarm needs a defined operator action; status indicators should not be alarms

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- exida.com LLC (consultancy). Authors Stauffer, Sands, Dunn., "Alarm Management and ISA-18 - A Journey, Not a Destination (white paper)" (Copyright 2018-2020. The revision history says it was presented in 2010; the document leaves this unresolved.; data years n/a). Checker: **verified**. <http://www.exida.com/articles/ALARM-MANAGEMENT-AND-ISA-18-A-JOURNEY-NOT-A-DESTINATION.pdf>
  - Supports: ISA-18.2 alarm definition 'requiring a response'; the 10-stage lifecycle; rationalization

<a id="rule-wf-19"></a>
#### RULE-WF-19: Duplicate and stale rows suppressed by design

Status: current · Class **B** (context-dependent guidance) · Phase **1** (Fix now) · 2 sources (2 verified; 0 vendor)

**Rule.** CURRENT: duplicate and stale rows are suppressed by design (a silent sensor is not also judged on its stale level; a group-wide gain problem is not repeated per animal).

**Decision it supports.** Keeps the list short and each row distinct.

**Required inputs.** Rule-ordering logic in findExceptions.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: B (context-dependent guidance).** Kept at B. Checker: the phrase 'suppression by design' is not in the exida paper; it describes 'advanced alarm design, like using process or equipment state to automatically suppress an alarm'.

**Evidence (research conclusion).** OBSERVED in exceptions.js: 'continue; // its last level is stale, so don't also judge it' and 'if (slow.length && !groupLow)'. The run produced exactly one T6 row ('No reading for 42 hours; last level 98.5%') and no per-animal heifer row. SOURCES: HSE CHIS6 recommends retuning nuisance alarms and suppressing alarms from out-of-service plant. Drew 2014 attributes alarm fatigue to 'inappropriate user settings, patient conditions, and algorithm deficiencies'. exida describes 'advanced alarm design, like using process or equipment state to automatically suppress an alarm' (the phrase 'suppression by design' is not in the paper).

**Limitations.** Suppression by design must be documented in the rules table so a reviewer knows the per-animal list is hidden when the group is flagged. The table already says '(skipped when the whole group is already flagged)'.

**Configurable?** Should be fixed logic, documented.

**Missing data that should block a confident conclusion.** When a sensor is silent, the tank's level state is unknown, and the briefing must say 'check by eye', which it does.

**Recommendation.** Keep. When the group row is shown, also give its count of individual slow animals (e.g. 'and 9 animals under 0.5') so information is not lost.

**Phase 1 (Fix now).** Keep it and document it in the rules table; when a group row is shown, also give its count of slow individuals.

**Related.** Related findings (as mapped in 02-findings.md section 6): [WAT-09](02-findings.md#wat-09), [GAIN-09](02-findings.md#gain-09).

**Sources.**

*Independent sources:*

- UK HSE, "Better alarm handling (CHIS6)" (published 2000-03; data years n/a; government agency). Checker: **verified**. <https://www.hse.gov.uk/pubns/chis6.pdf>
  - Supports: Nuisance alarm reduction; suppressing out-of-service items
- PLOS ONE, "Insights into the Problem of Alarm Fatigue with Physiologic Monitor Devices" (published 2014-10-22; data years March 2013; peer-reviewed). Checker: **verified**. <https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0110274>
  - Supports: Non-actionable alarm burden and its causes

<a id="rule-wf-21"></a>
#### RULE-WF-21: Snapshot, planted problems and severity levels are demo settings

Status: current · Class **D** (synthetic demonstration setting) · Phase **1** (Fix now) · no supporting source

**Rule.** CURRENT demo settings used by the workflow (the as_of snapshot of 2026-09-30T18:00, 10 planted problems, the 3 severity levels and their mapping to areas) are synthetic demonstration settings, not validated operating thresholds.

**Decision it supports.** Honest framing of the portfolio piece.

**Required inputs.** meta.csv; generate_data.py seed 2026.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: D (synthetic demonstration setting).** Unchanged (research D).

**Evidence (research conclusion).** OBSERVED: README says 'Example Ranch and all of its data are fictional' and the report finds 'exactly the 10 problems that were planted'. The run reproduced 10 rows. The header line reads 'Example Ranch (fictional) ...'.

**Limitations.** The 10-of-10 match shows the rules find what the generator planted. It does not validate the thresholds or the workflow against real operations.

**Configurable?** Yes.

**Missing data that should block a confident conclusion.** n/a

**Recommendation.** Keep the fictional labels on screen and in print. Add 'Demo setting' to each threshold in the rules table.

**Phase 1 (Fix now).** Keep the fictional labels on screen and in print. The 10-of-10 match shows the rules find what the generator planted; it does not validate the thresholds.

**Related.** 02-findings.md section 6 lists no finding for this rule.

**Sources.** No supporting source after the citation checks. The rule is a design or demonstration choice and is labelled as one.

### 2.7 Current gaps turned into proposals

<a id="rule-wat-05"></a>
#### RULE-WAT-05: Water severity that knows where the cattle are

Status: current gap + proposed · Class **C** (ranch-specific management choice) · Phase **2** (Build next) · 3 sources (1 verified, 2 partly; 0 vendor)

**Rule.** CURRENT GAP + PROPOSED: water severity should account for whether cattle are on the tank's pasture now or are planned to move there. Today the level and drop rules give the same severity with or without cattle, and the subject line only names a group when one is present. Proposed: a critical or silent tank in an occupied pasture is also shown as a reason on that group's grazing row, and a low or silent tank in the planned destination is flagged before the move. Tanks in empty pastures keep their row but rank lower; they are never hidden.

**Decision it supports.** [water research rule 4] Priority of a water exception. | [grazing research rule 7] Whether to move early (water failure), or delay or redirect a planned move (destination water not ready).

**Required inputs.** [water research rule 4] moves.csv open stays (already loaded), plus a planned move-in date for the pasture. | [grazing research rule 7] Tank-to-pasture mapping (water.csv already has pasture_id), latest level and sensor status, the stay's planned destination.

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: Grazing season (demo: 2026-06-01 to 2026-09-30; snapshot as_of 2026-09-30T18:00). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Rotational grazing on 8 pastures with a planned stay length per pasture; each tank serves one pasture (demo).

**Classification: C (ranch-specific management choice).** CHANGED for the grazing part. Water research rule 4 was C. Grazing research rule 7 was A; the checker (grazing dispute 0) found that only 'provide water during occupancy' (NRCS CPS 528) is general guidance. Showing tank status on the grazing row and letting the destination tank delay a move are ranch choices, and the SD TN9 '>1 mile' passage was misread. Stricter class C applied to the merged rule; the occupancy principle alone is A.

**Evidence (research conclusion).** [water research rule 4] Observed on repo data at as_of 2026-09-30T18:00: 'grazing now: Cows@P7, Heifers@P4, Yearlings@P3'. Exceptions: 'critical | Tank T2 (Windmill) | ... Down to 11.8% full' (no group in P2) and 'serious | Tank T6 (Cedar Draw)' (no group in P6). Only T4 has cattle: 'critical | Tank T4 (Lone Tree, Heifers here now) | Dropped 46 points in 24 hours, now 10%'. The tank actually serving the 180 pairs (T7) reads 61.3%, which my diagnostic converts to '3.0-3.7 h' if it were a 1,000-gal tank with no inflow. | [grazing research rule 7] CPS 528 (June 2025) General Criteria: 'Provide adequate quantity, quality, and distribution of drinking water for animals during periods of occupancy.' SD TN9 p.16: 'Monitor grazing lands frequently and ensure animals have access to dependable water.' SD TN9 (p.2-3): a 'very large field' is one where water is more than about one mile away; the passage concerns recovery under season-long use and does not require herding or water relocation. OBSERVED: exceptions.js already names the group present in a water alert (whoIsThere). Grazing rows never mention water, and no check looks at the destination's water.

**Corrections from the citation checks.**

- SD TN9's '>1 mile = very large field' passage is about when season-long use can still allow recovery, not a requirement to herd or relocate water (grazing checker).

**Limitations.** [water research rule 4] An empty pasture's low tank still matters before the next move-in, and a leak there still wastes water or drains shared storage. Some managers shut floats off in resting pastures on purpose, which makes 'low' expected. | [grazing research rule 7] Tank level thresholds are covered by the water topic (separate researcher). This rule only links them. Pastures with several water sources need all of them mapped.

**Configurable?** [water research rule 4] Yes. It is a ranch policy whether resting-pasture tanks alert, and how far ahead of a planned move. | [grazing research rule 7] Yes. Which water severities block a move is a ranch choice.

**Missing data that should block a confident conclusion.** [water research rule 4] There is no field saying a tank was deliberately shut off, and no planned move-in date, so the dashboard cannot tell 'resting, shut off' from 'resting, failing'. | [grazing research rule 7] A silent sensor at the destination should read 'water unknown: check by eye before moving', never 'ready'.

**Recommendation.** [water research rule 4] Rank tanks with cattle on them first. For resting pastures, flag 'needs attention before move-in on &lt;date>' at a lower severity, unless the tank feeds shared storage or a pipeline. | [grazing research rule 7] Add destination water status to the upcoming-moves view. Add a water reason to the grazing row when the occupied pasture's tank is critical or silent, without duplicating the water exception row (cross-reference only).

**Phase 2 (Build next).** Phase-2 default 'consequence-aware ranking'. Needs head present per pasture (derived from groups.csv and moves.csv) and, for the destination check, moves.planned_next_pasture. In the demo, T2 and T6 sit in empty pastures and T7 serves the cows.

**Related.** Related findings (as mapped in 02-findings.md section 6): [WAT-06](02-findings.md#wat-06), [UI-09](02-findings.md#ui-09), [GRZ-08](02-findings.md#grz-08).

**Sources.**

*Independent sources:*

- USDA NRCS, "Watering Facility (Code 614) Conservation Practice Standard" (published 2023-08; data years n/a; standard or specification). Checker: **verified**. <https://www.nrcs.usda.gov/sites/default/files/2023-08/614_NHCP_CPS_Watering_Facility_2023.pdf>
  - Supports: Size storage by 'availability of water, replenishment rate, location, and planned operation'. Planned use matters to adequacy.
  - Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): 'When windmill, solar, or other potentially unreliable power sources are used, consider supplying additional daily water storage volume (3–5 days)' (Considerations; 'consider', not 'shall'). O&M: 'Check for leaks' and 'Checking the performance of the automatic water level device, if present.' August 2023. Confirmed.
- USDA NRCS, "Grazing Management (Code 528) Conservation Practice Standard" (published June 2025; data years n/a; standard or specification). Checker: **partly**. <https://www.nrcs.usda.gov/sites/default/files/2025-07/528-nhcp-cps-grazing-management-2025-rev.pdf>
  - Supports: Drinking-water quantity, quality and distribution during occupancy.
- USDA NRCS South Dakota, "Prescribed Grazing, Range Technical Note No. 9" (published April 2017; data years n/a; government agency). Checker: **partly**. <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf>
  - Supports: Dependable water access (App. B p.16: 'ensure animals have access to dependable water'). The passage on fields more than 1 mile from water describes when continuous season-long use can still allow recovery; it does not say such fields need herding or water relocation. Supplement placement away from water was not confirmed by the checker.

<a id="rule-grz-03"></a>
#### RULE-GRZ-03: Rest and recovery check (min_rest_days)

Status: current (unused data) -> proposed · Class **B** (context-dependent guidance) · Phase **2** (Build next) · 5 sources (2 verified, 3 partly; 0 vendor)

**Rule.** UNUSED DATA -> PROPOSED: Rest/recovery check. pastures.csv carries min_rest_days (30-60 d), but no shipped code reads it. Proposed check: rest = days between the last out_date by ANY group and the next in_date in the same pasture, counting growing-season days only, compared with a recovery minimum that depends on growth rate (fast/slow) and region.

**Decision it supports.** Before a move: don't send cattle into a pasture that has not recovered, or record why you are doing it anyway. After the fact: record and review re-entries made short of the plan.

**Required inputs.** Stays per pasture across all groups (in/out dates). A per-pasture recovery minimum for fast and for slow growth (min_rest_fast_days, min_rest_slow_days). A growth-stage observation, or a date-based proxy marked as an assumption. Growing-season start and end dates. Optional: temporal utilization, drought status, and an override reason recorded by the manager.

**Where it applies.** Cattle class: Any grazing group. Season: Growing season; rest needs differ between fast-growth (May-June) and slow-growth (July-August) periods. Geography: Northern Plains native range and tame pasture. Management: Rotational grazing on 8 pastures with a planned stay length per pasture; pastures.csv already carries min_rest_days (30-60 d) that no code reads.

**Classification: B (context-dependent guidance).** Kept at B. Checker grazing dispute 3: the CPS 528 line on longer rest before dormancy sits under a purpose-specific soil-health criterion, not general guidance; and recovery minimums tied to utilization depend on use ceilings that SD TN9 (30% temporal) and NDSU R1780 (about 50% per period) set differently.

**Evidence (research conclusion).** OBSERVED: `grazing.rest.research.mjs` prints 'exceptions.js: occurrences of "min_rest_days" = 0' and 'app.js: occurrences of "min_rest_days" = 0', and 'total re-entries shorter than min_rest_days or overlapping: 13'. `grazing.forage.research.mjs` prints 're-entries: 15', 'short under data min_rest_days (synthetic): 13 of 15', 'short under NDSU R1780 western ND range: 14 of 15', 'short under SD TN9 West River range 20-30%: 13 of 15'. For current stays: 'Cows in P7 South Divide since 2026-09-12 ... entered after 6 d rest (previous: Yearlings out 2026-09-06); pasture min_rest_days=60 -> 54 d SHORT ... dashboard grazing rows for this stay: none' and 'Heifers in P4 Lone Tree since 2026-09-19 ... entered after 34 d rest ... min_rest_days=45 -> 11 d SHORT ... dashboard grazing rows for this stay: none'. GUIDANCE: SD TN9 Table 1 (range, 20-30% temporal use, the level it recommends for multiple grazings): West River 40 d fast / 60 d slow; East River 35 / 55. At 40-50% use: West 50/70, East 45/65. Drought: 'may need to be extended to 90 days or longer'. Each pasture grazed 2+ times is deferred at least 90 days during the growing season. NDSU R1780 (rev. Oct 2024), rangeland: fast growth (May/June) 45 d western ND / 30 d eastern; slow growth (July/Aug) 65 / 45. CPS 528: 'Provide desired plants sufficient recovery time from grazing/browsing to meet planned objectives' and, under a purpose-specific soil-health criterion rather than the General Criteria, 'Implement longer rest periods before perennial forage dormant seasons to extend root growth.'

**Corrections from the citation checks.**

- Manske (NDSU DREC): a 1999 research report on 1984-1994 data; its rotation implies rest of about 30-60 days, not 'about 30 days'.

**Limitations.** Published minimums are planning guides for one state or sub-region, not validated universal thresholds. They depend on utilization level, which the data do not record. The script's fast/slow split by calendar month is an assumption; SD TN9 defines it by growth stage. A September re-entry may be a deliberate late-season or dormant-season plan (dormant-season grazing has its own 60% utilization limit in SD TN9). The fictional generator plans each group independently, so 13 of 15 historical re-entries break the data's own minimums and 2 stays overlap. That is a generator artefact, not a planted problem.

**Configurable?** Must be. The minimums should be per pasture and per growth rate, with region-appropriate defaults (state NRCS FOTG technical notes), and editable. The override reason should be a recorded field.

**Missing data that should block a confident conclusion.** No growth-stage observation: label the minimum used as a 'calendar proxy'. No out_date for the previous stay, or an overlapping stay: report a data problem, not a rest violation. Outside the growing season: do not count the days as recovery and do not flag. Never report 'rested' when records for a pasture are incomplete.

**Recommendation.** Add it in two parts. (a) PROSPECTIVE (most useful): warning when a group's planned next pasture will not have reached its recovery minimum by the planned entry date. The action: pick another pasture, or record why the re-entry is planned. (b) RETROSPECTIVE: one warning per stay that began short of the minimum, giving rest days vs minimum and the growth period. Suppress it when an override reason is recorded (planned dormant-season use, targeted grazing of invasive cool-season grass, drought herd consolidation). Escalate to serious only when the short rest happened during fast growth AND a key-species stubble or utilization reading breaks its target, not on days alone. Replace the single min_rest_days with min_rest_fast_days and min_rest_slow_days. Before shipping, change the fictional generator so the planned rotation honours rest (or plants exactly one violation); otherwise the README's 'exactly the 10 problems that were planted' claim and its test will fail on data the project generated itself.

**Phase 2 (Build next).** Phase-2 default 'rest-period checks using min_rest_days'. The demo generator produces 13 of 15 short re-entries (an artefact; Cows in P7 after 6 days against 60, Heifers in P4 after 34 against 45), so scripts/generate_data.py and the tests must change in the same step or the check adds new alarms.

**Related.** Related findings (as mapped in 02-findings.md section 6): [GRZ-04](02-findings.md#grz-04), [GRZ-05](02-findings.md#grz-05).

**Sources.**

*Independent sources:*

- USDA NRCS South Dakota, "Prescribed Grazing, Range Technical Note No. 9" (published April 2017; data years n/a; government agency). Checker: **partly**. <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf>
  - Supports: p.3: once-over rangeland >= 45 consecutive days rest in the growing season (pasture 30). 90-day growing-season deferral for 2+ grazings. p.4 Table 1: recovery minimums by utilization, West/East River, fast/slow. 'Fast growth usually refers to grasses in a vegetative, pre-boot stage'. Drought: 90+ days.
- NDSU Extension (Meehan, Sedivec, Printz), "The North Dakota Grazing Monitoring Stick: A Way to Measure Range and Pasture Utilization (R1780)" (Revised October 2024 (original date not shown); data years n/a; extension). Checker: **verified**. <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/R1780%20The%20North%20Dakota%20Grazing%20Monitoring%20Stick%20%281%29.pdf>
  - Supports: Rangeland recovery: fast growth (May/June) 45 d western ND, 30 d eastern; slow growth (July/August) 65 d western, 45 d eastern. Introduced pasture 25/15 fast, 35/25 slow.
- USDA NRCS, "Grazing Management (Code 528) Conservation Practice Standard" (published June 2025; data years n/a; standard or specification). Checker: **partly**. <https://www.nrcs.usda.gov/sites/default/files/2025-07/528-nhcp-cps-grazing-management-2025-rev.pdf>
  - Supports: 'Provide desired plants sufficient recovery time from grazing/browsing to meet planned objectives.' 'Deferment or rest should be planned for critical periods of plant or animal needs.' 'Implement longer rest periods before perennial forage dormant seasons to extend root growth.' (This last item is under the purpose-specific 'Additional Criteria to Reduce Runoff and Compaction and Enhance or Maintain Key Soil Health Components', not a General Criterion.)
- USDA NRCS, "Grazing Management (Code 528) Conservation Practice Standard - landing page" (Page text: 'Updated in 2026, the next review of this national conservation practice standard is expected to begin October 2030.'; data years n/a; government agency). Checker: **verified**. <https://www.nrcs.usda.gov/resources/guides-and-instructions/grazing-management-code-528-conservation-practice-standard>
  - Supports: Shows the current national 528 is titled 'Grazing Management' and links the June 2025 CPS PDF. That it was renamed from 'Prescribed Grazing' is my inference from older state documents titled 'Prescribed Grazing'; the page does not say so.
- NDSU Dickinson Research Extension Center (L. Manske), "Grazing Management for Rangeland" (published 1999 (NDSU Dickinson REC research report); data years 1984-1994; extension). Checker: **partly**. <https://ndsu.edu/agriculture/sites/default/files/2022-10/Grazing_Mgmt_for_Rangeland.pdf>
  - Supports: Twice-over rotation in western ND: first rotation June 1-July 15, 15 d per pasture (3 pastures); second rotation 30 d per pasture to mid-October. Inferred rest between a pasture's first and second use is about 30-60 d (about 30, 45 and 60 d for the three pastures if the order repeats; the second-rotation order was not confirmed). An example of fixed calendars used deliberately within a growth-stage rationale (3rd leaf to flowering).

## 3. Proposed rules

Proposed rules are grouped by recommended phase, then by area. A proposed rule is a recommendation; none is implemented.

### 3.1 Phase 1: Fix now

These proposals are part of the Phase 1 correctness work. They add gates, wording and data-contract behaviour; they add no new module. The 10 planted problems must still be found with the same severities, with no new false alarms on the committed data.

One proposal goes beyond the Phase 1 defaults set for this audit's gain fixes: [RULE-GAIN-06](#rule-gain-06) records a weight basis (full, shrunk, pencil shrink) for each weigh session and refuses to compare gain across different or unknown bases. The registry puts it in Phase 1 because comparing across bases is a misleading output, and the gain research reports that "Watson 2012 measured full-vs-limit-fed ADG errors of 0.22-0.51 lb/d." It needs one new column, which the demo fills with the same basis for every session so the planted problems still show. The roadmap should confirm it or move it to Phase 2.

<a id="rule-wat-15"></a>
#### RULE-WAT-15: Sensors supplement eyes-on tank checks

Status: proposed · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 1 source (1 partly; 0 vendor)

**Rule.** PROPOSED: sensor readings supplement, and do not replace, eyes-on tank checks. The page says 'Sensors normal', not 'Water tanks OK', unless a visual check is recorded. The crew briefing lists tanks to check by eye, and the record captures who checked, when and what they saw. How often to check is a ranch choice.

**Decision it supports.** Which tanks the crew physically visits today, and whether a 'normal' sensor reading has been confirmed.

**Required inputs.** Tank list, sensor status, visual_check_at/by/result (manual observation).

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: Grazing season (demo: 2026-06-01 to 2026-09-30; snapshot as_of 2026-09-30T18:00). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Remote level sensors on stock tanks (demo: 8 tanks, one tank per pasture, a reading every 6 h); crew pasture checks.

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker workflow dispute 1: 'daily' appears only in a BQA sample Water Tank Protocol template with fill-in placeholders; the assessment's own Water point asks only for an adequate supply and a plan, and the guide says nothing about sensors. That a sensor does not replace an eyes-on check is the researcher's inference.

**Evidence (research conclusion).** SOURCE: a sample 'Water Tank Protocol' template in the BQA Cow-Calf Assessment guide reads '("X" crew) will monitor water tank function and cleanliness daily by visually inspecting the tanks and reporting any problems immediately to (the operation's manager)'; 'daily' and the cleaning interval ('at least every (two weeks)') are fill-in values. The assessment's own Water point asks only whether an adequate water supply and a plan are in place, and the guide says nothing about sensors. The guide notes 'Water is the most important nutrient for general animal well-being.' OBSERVED: the current T6 first step already says 'Check the tank by eye today, then the sensor battery and signal', but no data field records that an eyes-on check happened.

**Corrections from the citation checks.**

- Write 'a BQA sample protocol suggests daily visual checks', not 'the BQA Cow-Calf Assessment expects water tanks to be visually inspected daily'. The guide also does not say 'reported to management'.

**Limitations.** The assessment guide is undated (FY26 file). Daily checking may be impractical on large Plains pastures in some seasons, where frequency is a ranch decision informed by weather, stocking and sensor reliability.

**Configurable?** Frequency, yes (C). The principle that a sensor is not a substitute for a visual check, no.

**Missing data that should block a confident conclusion.** If no visual check is recorded for a tank in the period, the dashboard should not describe the tank as 'OK', only as 'sensor normal'.

**Recommendation.** Rename the tile 'Water tanks OK' to 'Sensors normal'. Add visual-check capture to the printed briefing and the acknowledgement log.

**Phase 1 (Fix now).** Phase 1 is copy only: rename the tile to 'Sensors normal'. Recording visual checks comes with the phase-2 printable crew briefing; the phase-1 change does not depend on it.

**Sources.**

*Independent sources:*

- Beef Quality Assurance program (beef checkoff), "Assessor's Guide to the BQA Cow-Calf Assessment" (undated (file name FY26); data years n/a; other publisher). Checker: **partly**. <https://www.bqa.org/Media/BQA/Docs/bqa-cow-calf-assessment-cover-fy26.pdf>
  - Supports: A sample 'Water Tank Protocol' template (fill-in placeholders) suggests daily visual tank checks with problems reported to the manager; the assessment's own Water point asks only for an adequate water supply and a plan. Also: written protocols; training records; treatment record contents. Says nothing about sensors.

<a id="rule-gain-06"></a>
#### RULE-GAIN-06: Weigh-condition consistency gate

Status: proposed · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 6 sources (6 verified; 0 vendor)

**Rule.** PROPOSED: Weigh-condition consistency gate. Every weigh-in records its weight basis (full, overnight-shrunk, pencil shrink %), gather/weigh time and hours off feed/water. ADG is only compared across weigh-ins with the same basis and routine, or after a stated adjustment.

**Decision it supports.** Whether a change in weight reflects tissue gain or a change in gut fill and handling.

**Required inputs.** weight_basis, pencil_shrink_pct, gather_time/weigh_time, hours_off_feed_water, handling notes per weigh session.

**Where it applies.** Cattle class: Growing cattle judged on ADG (demo: Yearlings target 2.0 lb/d, Heifers 1.0 lb/d). Season: Every weigh session. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Group weigh-ins on a chute scale (demo: 2026-06-01, 2026-07-20, 2026-09-15); full or shrunk weights.

**Classification: C (ranch-specific management choice).** CHANGED from A. Checker gain dispute 4: weighing under consistent conditions is well supported (A), but the gate behaviour (withholding serious and individual flags when the basis is unknown or differs) and the session metadata schema are design choices (C).

**Evidence (research conclusion).** Watson et al. 2013: 'handling cattle in a similar manner when weighing is more important than limiting intakes to decrease variance between weights'. Heitschmidt 1982 (Texas Experimental Ranch keyword, mature cows): early-morning weights were \~2.5% below late-morning weights, and cows lost 3.5% in the first 3 h, then \~1% every 3 h. OSU ANSI-3257: cattle gathered at 6 a.m. shrank 6.2% by 3 p.m. versus 3.3% when gathered at 9 a.m. Mississippi State P2577: \~1%/h for the first 3-4 h without feed and water, then \~0.25%/h; '2 percent to 4 percent pencil shrink' is common in sales. Derner et al. 2014: summer overnight shrink 8.8-9.0% vs 7.1% in September at CPER (its main finding was that shrink was insensitive to environmental variables, which sits uneasily with Derner 2016). Derner et al. 2016: shrink increased with air temperature and NDVI. OBSERVED consistency check: '[W12] pasture heifers, mean full-vs-limit-fed difference 10.2 lb over 20 d -> 0.51 lb/d (report states 0.51)'.

**Corrections from the citation checks.**

- Derner et al. 2014 found overnight shrink 'insensitive to environmental variables'; the research does not reconcile this with its Derner 2016 citation.
- Watson 2012 (Nebraska Beef Report) states its data years: four weighing events, October 2009 to May 2011.

**Limitations.** Most of the shrink rates come from shipping/sale contexts or from other regions (Texas, Mississippi, Oklahoma). Magnitudes vary with forage, weather and handling, so no single pencil-shrink value applies to every weigh-in.

**Configurable?** Yes. The ranch picks a standard routine and an optional pencil shrink.

**Missing data that should block a confident conclusion.** If the basis is unknown for either weigh-in, or differs between them, mark ADG 'unverified' and do not raise group-serious or individual flags from it.

**Recommendation.** Add weigh-session metadata. Show a 'weighing conditions differ' note beside any ADG.

**Phase 1 (Fix now).** Add weight_basis per weigh session. The demo must record a basis (for example 'full') for every session so the planted gain problems still show. Comparisons across different or unknown bases become CAN'T TELL for serious and individual flags. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (cross-reference made for this document): [GAIN-10](02-findings.md#gain-10).

**Sources.**

*Independent sources:*

- Society for Range Management (Rangelands Gateway / Univ. of Arizona repository), "Diurnal Variation in Weight and Rates of Shrink of Range Cows and Calves (J. Range Manage. 35:717-720)" (published 1982; data years not stated; peer-reviewed). Checker: **verified**. <https://rangelandsgateway.org/dlio/22019>
  - Supports: Early vs late morning cow weights differ by \~2.5%. Shrink rates over time.
- Oklahoma State University Extension, "Managing Shrink and Weighing Conditions in Beef Cattle (ANSI-3257)" (undated (footer code 0607); data years cites studies 1972-1997; extension). Checker: **verified**. <https://pods.okstate.edu/fact-sheets/ANSI-3257pod.pdf>
  - Supports: Gather-time effect (6.2% vs 3.3%), \~1%/h then 0.25%/h, \~0.5% per 30 min of corral movement, and a 2-3% shrink assumption for cattle near the scales.
- Mississippi State University Extension, "Understanding and Managing Cattle Shrink (P2577)" (undated (page code POD-12-23); data years n/a; extension). Checker: **verified**. <https://extension.msstate.edu/publications/understanding-and-managing-cattle-shrink>
  - Supports: Fill vs tissue shrink, hourly shrink rates, and the common 2-4% pencil shrink.
- Society for Range Management (Rangelands Gateway), "Estimating Overnight Weight Loss of Corralled Yearling Steers in Semiarid Rangeland (Rangelands 38(3):101-104)" (published 2016; data years four consecutive years (not named on page); peer-reviewed). Checker: **verified**. <https://rangelandsgateway.org/dlio/17936>
  - Supports: Percent overnight shrink rose with air temperature and NDVI. A prediction equation 'can provide temporal weight gain data within a grazing season'.
- Society for Range Management, "Do Environmental Variables Influence Overnight Weight Loss of Yearling Steers in Semiarid Rangelands" (published 2014; data years 2009-2012; field study or demonstration). Checker: **verified**. <https://rangelandsgateway.org/node/25589>
  - Supports: 8.8-9.0% (Jun-Aug) vs 7.1% (Sep) overnight shrink.
- American Society of Animal Science (UNL Digital Commons), "Impacts of a limit-feeding procedure on variation and accuracy of cattle weights" (published 2013; data years not stated; peer-reviewed). Checker: **verified**. <https://digitalcommons.unl.edu/animalscifacpub/790>
  - Supports: Similar handling matters more than limit feeding.

<a id="rule-gain-07"></a>
#### RULE-GAIN-07: Minimum interval or number of weights before gain is judged

Status: proposed · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 3 sources (3 verified; 0 vendor)

**Rule.** PROPOSED: Minimum interval / number of weights before ADG is judged. Individual ADG needs at least about 70 d, or a regression on 3 or more weights. Group ADG needs an interval long enough that a plausible one-sided weighing error stays under a chosen share of the expectation.

**Decision it supports.** Whether an ADG figure is precise enough to act on.

**Required inputs.** Weigh dates; count of weights per animal; ranch-chosen tolerance; an estimate of the weighing error for its routine.

**Where it applies.** Cattle class: Growing cattle judged on ADG (demo: Yearlings target 2.0 lb/d, Heifers 1.0 lb/d). Season: Between weigh-ins. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Group weigh-ins on a chute scale (demo: 2026-06-01, 2026-07-20, 2026-09-15).

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker gain dispute 5: the 70-day individual default comes from controlled-diet test standards (BIF 2019; Archer 1997), an extrapolation to pasture (B). The group minimum is the author's arithmetic on a ranch-chosen tolerance (C). The bundled rule takes the stricter class C.

**Evidence (research conclusion).** BIF 2019: 70-d minimum for individual ADG with paired start and end weights on separate days. Archer 1997: 70 d with 2-week weights is optimal. OBSERVED (gain.evidence.research.mjs) minimum days for error within 10% / 20% of target: '[D14] ... yearlings(2.0): 10% 71 d, 20% 36 d | heifers(1.0): 10% 141 d, 20% 71 d'; '[W12] mean full-weight offset, pasture steers (lb) yearlings(2.0): 10% 185 d, 20% 93 d'. Error rows at 57 d: 0.18, 0.25, 0.48 and 0.65 lb/d for the four error sources. Augustine et al. 2022 (CPER) used \~53-60-d intervals with weights corrected for estimated overnight shrink.

**Corrections from the citation checks.**

- Citation critic (critic-rules, 2026-10-16), WebFetch re-read of the BIF guidelines: 'a minimum of a 70-d test period is required to accurately compute average daily gain for individual animals', with animals weighed twice on separate days at the start and end; regression 'may enhance the accuracy of measured rate of gain somewhat'. BIF uses regression inside a test of at least 70 days. It does not say a regression on 3 or more weights over a shorter span replaces the 70-day minimum, so the 'or a regression' path should still span at least the minimum. BIF tests also require ad libitum feed, unlike pasture.

**Limitations.** The error magnitudes used come from published studies under other conditions. A ranch should estimate its own, for example from repeat weights of the same animals. BIF test conditions (controlled diet) are stricter than pasture conditions.

**Configurable?** Yes: minimum days, minimum weights per animal, tolerance.

**Missing data that should block a confident conclusion.** Below the minimum, show ADG as 'provisional' and raise no flag.

**Recommendation.** Add RULES.minIntervalDaysIndividual (default 70) and RULES.minIntervalDaysGroup (ranch-set; the README must state the basis). Prefer regression when 3 or more weights exist.

**Phase 1 (Fix now).** Lead default 'gain minimum interval'. Make the minimum a labelled setting and check it against the demo's 57-day last interval and three weigh-ins so the planted heifer and six-yearling problems remain. The demo weigh-ins (2026-06-01, 2026-07-20, 2026-09-15) span 106 days, so a 70-day individual default is met only by a method that uses all three weigh-ins; an ADG from the last 57-day interval alone falls under it (not tested in this audit). The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (cross-reference made for this document): [GAIN-03](02-findings.md#gain-03).

**Sources.**

*Independent sources:*

- Beef Improvement Federation (vendor-hosted copy, C-Lock Inc.), "Beef Improvement Federation Guidelines for Feed Efficiency Testing as of March 26th, 2019" (published 2019-03-26; data years n/a; standard or specification). Checker: **verified**. <https://docs.c-lockinc.com/Document%20-%20Beef%20Improvement%20Federation%20Guidelines%20for%20FE%20Testing.pdf>
  - Supports: 70-d minimum for individual ADG.
  - Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): 'a minimum of a 70-d test period is required to accurately compute average daily gain for individual animals'; weigh twice on separate days at start and end; regression 'may enhance the accuracy ... somewhat'; ad libitum feed required. Confirmed; the 70 d is a controlled-feeding test length.
- American Society of Animal Science (University of Adelaide repository), "Optimum postweaning test for measurement of growth rate, feed intake, and feed efficiency in British breed cattle" (published 1997; data years not stated; peer-reviewed). Checker: **verified**. <https://eres.library.adelaide.edu.au/dspace/handle/2440/13249>
  - Supports: 70-d test, fortnightly weights.
- CSIRO Publishing (PDF hosted by USDA-ARS), "Can measurements of foraging behaviour predict variation in weight gains of free-ranging cattle? (Animal Production Science)" (published 2022; data years 2019-2020; peer-reviewed). Checker: **verified**. <https://www.ars.usda.gov/ARSUserFiles/30123025/Publications/2022/Augustine_2022_foraging%20behavior%20and%20weight%20gain.pdf>
  - Supports: Rangeland research practice: interval ADG over \~53-60 d, weights corrected for estimated overnight shrink.

<a id="rule-gain-10"></a>
#### RULE-GAIN-10: Coverage and matched-interval gate for group gain

Status: proposed · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 1 source (1 partly; 0 vendor)

**Rule.** PROPOSED: Coverage and matched-interval gate for group ADG. Report weighed head / inventory head and the number of animals with both weigh-ins in the same interval. Withhold the group verdict below a ranch-set coverage share or when intervals are mixed.

**Decision it supports.** Whether the group figure represents the group.

**Required inputs.** groups.csv head (inventory), per-animal weigh dates, weigh session ID.

**Where it applies.** Cattle class: Growing cattle judged on ADG (demo: Yearlings target 2.0 lb/d, Heifers 1.0 lb/d). Season: Each weigh-in interval. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Group weigh-ins on a chute scale (demo: 2026-06-01, 2026-07-20, 2026-09-15).

**Classification: C (ranch-specific management choice).** Unchanged (research C).

**Evidence (research conclusion).** OBSERVED (gain.evidence.research.mjs): 'Heifers: inventory 45, weighed 45 (100%), distinct intervals 1'. Sampling precision at assumed SDs: 'SD 0.4 lb/d: n=10 SE 0.126, n=20 SE 0.089, ... n=150 SE 0.033'. A shared weighing-condition error is not reduced by n. No source located in this pass gives a recommended sample size for monitoring pasture gains, so the threshold is a ranch choice.

**Limitations.** The SD values are assumptions (the shipped data's SDs are synthetic: 0.16 heifers, 0.41 yearlings).

**Configurable?** Yes: minimum coverage share, minimum n.

**Missing data that should block a confident conclusion.** Coverage below the threshold, or mixed intervals: 'group gain not assessable'.

**Recommendation.** Show coverage beside every group ADG.

**Phase 1 (Fix now).** Lead default 'gain coverage'. Report weighed head / inventory head and matched animals, and withhold the group verdict (CAN'T TELL) below a labelled coverage share. Demo coverage is complete (45 of 45 heifers, 150 of 150 yearlings each session), so no planted problem is lost. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (cross-reference made for this document): [GAIN-03](02-findings.md#gain-03), [GAIN-07](02-findings.md#gain-07).

**Sources.**

*Independent sources:*

- USDA-ARS (Data.gov), "Data from: Can measurements of foraging behaviour predict variation in weight gains of free-ranging cattle?" (updated 2025-11-21; data years 2019-2020; government agency). Checker: **partly**. <https://catalog.data.gov/dataset/data-from-can-measurements-of-foraging-behaviour-predict-variation-in-weight-gains-of-free>
  - Supports: A public USDA-ARS steer dataset (CPER, 2019-2020) whose description says steers' average daily gains are included; the page does not show whether the values are per animal. If they are, it could help estimate a realistic within-herd SD. Not downloaded or inspected in this pass.

<a id="rule-hlth-11"></a>
#### RULE-HLTH-11: Health and gain wording: observe, record, call the veterinarian

Status: proposed · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 4 sources (4 verified; 0 vendor)

**Rule.** PROPOSED: wording rule for every Health row and for gain follow-ups. Describe what is scheduled or what was observed, and who to call. Never state a diagnosis, cause, drug, dose or treatment. For slow-gaining animals: list them, observe them at the next gather, record what was seen, and refer to the herd veterinarian under the ranch's health plan. Reword the current Gain action 'look for a health problem in the group' the same way.

**Decision it supports.** [health research rule 11] Keeping the dashboard inside the manager's role (observe, schedule, record, escalate) and the veterinarian's role (diagnose, prescribe). | [gain research rule 11] Who to look at, and how the observation is recorded.

**Required inputs.** [health research rule 11] Action strings in exceptions.js and the rules table in app.js. | [gain research rule 11] Tag, date, observation note, observer, whether escalated.

**Where it applies.** Cattle class: All classes. Season: Always. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Dashboard copy for health and gain rows.

**Classification: C (ranch-specific management choice).** CHANGED from A (both research rules). Checker health dispute 0: 21 CFR 530.3 defines when a VCPR exists for extralabel drug use; it does not govern what a producer or tool may say, and extension sources teach producers to recognise signs. Only the narrow sub-rule 'prescription, extralabel and VFD decisions need a VCPR' is A. Checker gain dispute 2: record-keeping is A, but 'observe at the next gather instead of pulling' is a management choice. The rule stays a fixed project scope rule (not configurable).

**Evidence (research conclusion).** [health research rule 11] 21 CFR 530.3(i): a valid VCPR is one in which 'A veterinarian has assumed the responsibility for making medical judgments regarding the health of (an) animal(s) and the need for medical treatment', with 'sufficient knowledge of the animal(s) … to initiate at least a general or preliminary diagnosis'. BQA Manual: 'A valid VCPR is required for all prescription medications, extra-label use of non-prescription medications,' (VFD feeds per field guide). FDA: a VCPR cannot be established by telemedicine alone. OBSERVED: current Health actions 'Schedule it this week' and 'Plan it with the next gather' contain no diagnosis words (health.research.mjs section 4 'ok'). The Gain action 'Check forage quality and mineral; look for a health problem in the group' was flagged NOTE because it asks the manager to find a health problem. | [gain research rule 11] Merck Veterinary Manual (reviewed 2023-07): screening relies on 'regular observation of the herd'. Records are 'essential to monitor the incidence of disease ... and impact of disease on performance' and should be 'analyzed on a regular basis'.

**Limitations.** [health research rule 11] Task names such as 'Pinkeye check' name a disease as the target of an observation, which is acceptable as a schedule label. Exception text about findings should list signs, not conditions. | [gain research rule 11] A low ADG alone is not evidence of disease, because weighing noise and forage effects are larger in many cases (see the individual rule).

**Configurable?** [health research rule 11] No. | [gain research rule 11] Yes (the action text).

**Missing data that should block a confident conclusion.** [health research rule 11] n/a | [gain research rule 11] Not applicable. This rule only routes to observation.

**Recommendation.** [health research rule 11] Use templates. Scheduled: '[Task] for [group]: due [window]. Owner: [responsible].' Observed: '[N] head in [group] with [signs] recorded [date]. Call your veterinarian.' Gain: 'Check forage and mineral; watch the group for illness or lameness and call your veterinarian if you see any.' | [gain research rule 11] Change 'Pull and check' to 'Look at these animals at the next gather and record what you see'. Link to a health observation record.

**Phase 1 (Fix now).** Lead default 'honest rule copy'. Applies to all health and gain row text from phase 1 on.

**Sources.**

*Independent sources:*

- Cornell Legal Information Institute (reproducing the Code of Federal Regulations), "21 CFR 530.3 Definitions (paragraph (i) veterinarian-client-patient relationship)" (undated on page; data years n/a; government agency). Checker: **verified**. <https://www.law.cornell.edu/cfr/text/21/530.3>
  - Supports: The three VCPR conditions. Medical judgments and diagnosis rest with the veterinarian. Requires recent examination or timely premises visits.
- Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor), "Beef Quality Assurance National Manual (bqa_manual_final.pdf)" (undated (no date in the PDF; newest data cited are the 2016 NBQA, a 2018 footnote and a 1998-2017 series). Likely superseded: NCBA announced an updated manual on 2024-12-19 (2025-01-06 is a trade-press reprint date), and bqa.org now links a 2026 edition that could not be fetched.; data years newest data cited: 2016 National Beef Quality Audit; a 1998-2017 series; standard or specification). Checker: **verified**. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf>
  - Supports: Sec. 4.5: a valid VCPR is required for prescription and extra-label use. 'A VCPR cannot exist based solely on phone, video, or other telemedical interactions.' Treatment protocols should define when to seek professional help (p.49).
- U.S. FDA Center for Veterinary Medicine, "Veterinarian-Client-Patient Relationships, Prescribing/Dispensing Animal Drugs, and Telemedicine" (content current as of 2024-09-04; data years n/a; government agency). Checker: **verified**. <https://www.fda.gov/animal-veterinary/product-safety-information/veterinarian-client-patient-relationships-prescribingdispensing-animal-drugs-and-telemedicine>
  - Supports: VCPR required for extralabel use and VFDs. Telemedicine alone cannot establish a federal VCPR. States may add requirements.
- Merck Veterinary Manual, "Disease Screening, Treatment, and Surveillance in Beef Cattle" (reviewed 2023-07; modified 2024-09; data years n/a; other publisher). Checker: **verified**. <https://www.merckvetmanual.com/management-and-nutrition/preventative-health-care-and-husbandry-of-beef-cattle/disease-screening-treatment-and-surveillance-in-beef-cattle>
  - Supports: Observation and records practice.

<a id="rule-bud-03"></a>
#### RULE-BUD-03: Combined percent-and-dollar materiality

Status: proposed · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 5 sources (4 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: Combined percent-and-dollar materiality per category over closed months (V = actual - plan to date; p = V / plan). Serious if p >= seriousPct AND V >= seriousUsd. Warning if p >= warnPct AND V >= warnUsd. Large-dollar override: warning if V >= largeUsd whatever p is. Dollar floors are either fixed dollars or a share of the total season-to-date operating budget, so they scale with ranch size. Demo values used in the diagnostic: warnPct 5%, seriousPct 10%, warnUsd \$500, seriousUsd \$1,000, largeUsd \$2,500, unbudgetedUsd \$250.

**Decision it supports.** Which category overruns deserve the manager's time this month, ranked by both relative and absolute size.

**Required inputs.** Monthly phased budget and actual per category; books-closed-through month; threshold config (pct and USD pairs, optionally per category); total season-to-date operating budget if floors are a share of total; optional reforecast column.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: C (ranch-specific management choice).** CHANGED from B; every number is D. Checker budget dispute 0: no ranch, extension or agency source recommends a combined percent-and-dollar trigger for monthly category monitoring. The structural support is two non-agricultural examples that disagree (UW recharge centers: AND, on hold; U Alberta year-end: OR) plus an audit analogy. The large-dollar override and 'share of total season budget' floors have no source.

**Evidence (research conclusion).** OBSERVED (budget.materiality.research.mjs, proposed rule with demo values): committed data unchanged in outcome, 'Fuel ... proposed ...: serious 21.3% and \$2040 over' and 'Repairs ...: serious 25.0% and \$1800 over'. S2: 'Ear tags ... proposed: -' (15%/\$30 no longer serious); 'Labor ... warning 7.5% and \$2700 over'; 'Feed (big) ... warning \$2700 over (only 3.0%)'. OBSERVED (budget.fuel.pricevolume.research.mjs): 'Fuel over \$ 2040 21.3% of category 2.31% of total budget'; 'Repairs over \$ 1800 25.0% of category 2.04% of total budget'. EXTERNAL: two non-agricultural institutional examples combine percent and dollar tests, and they disagree: UW (a recharge-center rate review, now on hold) uses AND (10% and \$5,000); U Alberta (year-end variances that trigger funding plans) uses OR (5% or \$100,000). PCAOB AS 2105 treats materiality as quantitative plus qualitative. Extension budgets show category sizes differ by an order of magnitude (UNL 2026 400-cow budget: feed \$801/cow vs fuel and energy \$35/cow, repairs \$38/cow; ND Farm Management Education 2020: feed and grazing \$412/cow vs fuel \$18.73/cow), so a single percent band treats very different dollar stakes alike.

**Corrections from the citation checks.**

- The UW page's real title is 'Recharge Center Variance Analysis \*ON HOLD'; it reviews recharge-center rates, not general budget-vs-actual.
- U Alberta's thresholds trigger year-end funding or carry-forward plans, not monthly alerts or variance explanations.
- 'Combined percent and dollar tests are a common institutional design' is not supported: two examples do not show that.

**Limitations.** No ranch, extension or agency source recommends a combined percent-and-dollar trigger for monthly category monitoring, so the structure is a management design choice (C). The specific numbers are demonstration settings (D): no ranch-specific study validating any percent or dollar pair was found. AND vs OR and the override amount are management choices. Qualitative triggers (e.g., a vet-and-health underspend reflecting missed scheduled work) are not captured by numbers alone.

**Configurable?** Yes, and it must be: the dollar floors depend on ranch scale and the owner's tolerance. Per-category overrides are useful (e.g., labor vs ear tags).

**Missing data that should block a confident conclusion.** Missing actual for any closed month in the category; no budget entered (route to the unbudgeted rule); thresholds not configured (show variance but no severity); basis unknown (show a label).

**Recommendation.** Adopt this as the budget rule, with the thresholds in RULES clearly labelled as demonstration settings and editable. Show both percent and dollars in every alert text. Offer 'share of total season budget' as the default way to scale dollar floors (e.g., warn at 0.5% of total, serious at 1%, both D-class demo values).

**Phase 1 (Fix now).** Lead default 'combined percent + dollar materiality labelled demo'. Demo values (warn 5% and \$500, serious 10% and \$1,000, large \$2,500, unbudgeted \$250) are labelled as demo settings. Fuel (\$2,040, 21.3% over) and repairs (\$1,800, 25% over) must still be found. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (cross-reference made for this document): [BUD-04](02-findings.md#bud-04).

**Sources.**

*Independent sources:*

- University of Washington Finance, Management Accounting & Analysis, "Recharge Center Variance Analysis \*ON HOLD" (published 2014-02-28 (page submission date); data years n/a; other publisher). Checker: **verified**. <https://finance.uw.edu/maa/node/228>
  - Supports: Combined percent AND dollar materiality test (10% and \$5,000).
- University of Alberta (UAPPOL), "Budget Variance Accountability Procedure" (Approved 2006-07-17; editorial amendments 2025-05-20; data years n/a; other publisher). Checker: **partly**. <https://ualberta.ca/en/alfresco/uappol/finance/budget-variance-accountability/procedure/budget-variance-accountability-procedure.pdf>
  - Supports: Percent OR dollar trigger (5% or \$100,000 unfavorable) for the year-end variance, which triggers a funding plan. Using it as the basis for a monthly large-dollar override is the researcher's inference.
- PCAOB, "AS 2105: Consideration of Materiality in Planning and Performing an Audit" (Effective for audits of fiscal years beginning on or after 2010-12-15; data years n/a; standard or specification). Checker: **verified**. <https://pcaobus.org/oversight/standards/auditing-standards/details/AS2105>
  - Supports: Materiality combines quantitative and qualitative factors (para .03, .07). Analogy only.
- University of Nebraska-Lincoln Center for Agricultural Profitability / Nebraska Extension, "2026 UNL Livestock Jan-Dec, 400 Head Cow Herd, Northern Panhandle (sample economic budget)" (undated in PDF (landing page says 'Updated July 2026'); data years 2026 prices; extension). Checker: **verified**. <https://cap.unl.edu/sites/unl.edu.ianr.agecon.center-for-ag-profitability/files/media/file/2026%20Northern%20Panhandle%20400%20Head%20Cow%20Herd%20budget.pdf>
  - Supports: Category sizes: total feed \$320,515 (\$801/cow); vet and health \$14,000 (\$35); fuel and energy \$14,000 (\$35); repairs and maintenance \$15,000 (\$38); supplies \$8,000 (\$20).
- Beef Magazine (reporting North Dakota Farm Management Education program data), "What is your cow-calf cost of production?" (published 2021-08-31; data years 2020 production year; 17 herds, 3,755 cows, ND excluding Red River Valley; other publisher). Checker: **verified**. <https://www.beefmagazine.com/beef/what-your-cow-calf-cost-production>
  - Supports: Actual direct costs per cow: feed and grazing \$412, repairs \$49.09, veterinary \$40.10, fuel \$18.73, supplies \$13.94; total direct \$566.24.

<a id="rule-bud-04"></a>
#### RULE-BUD-04: Compare against a monthly phased plan

Status: proposed · Class **A** (supported general guidance) · Phase **1** (Fix now) · 8 sources (7 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: Compare season-to-date actual against a monthly phased plan through the same month (which months count as closed is set by [RULE-BUD-05](#rule-bud-05), class C), not against a straight-line or full-season total.

**Decision it supports.** Whether spending is ahead of plan or only ahead of a flat average, e.g., a planned early-season overhaul or winter feed purchases.

**Required inputs.** A budget amount per category per month entered as the ranch expects to spend it (phased); actual per month; books-closed-through month.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: A (supported general guidance).** Kept at A: several extension budgeting sources support comparing actuals with a monthly phased plan. Checker caveat: GFOA lists seasonality only as a revenue-review item, not in its 'basis of comparison' list. Citation critic (critic-rules, 2026-10-16): the A covers comparing actual with a monthly phased plan over the same months; the closed-month cut-off is [RULE-BUD-05](#rule-bud-05) (C) and does not inherit A.

**Evidence (research conclusion).** OBSERVED (budget.materiality.research.mjs S3): the same June actual of \$4,300 against a straight-line plan gives 'Repairs budget 1800 actual 4300 cur pct 138.9% -> current: serious', and against a phased plan (4,200 in June) gives 'cur pct 2.4% -> current: -'. EXTERNAL: cash-flow budgets are built in monthly, bi-monthly or quarterly columns and used to monitor actual against plan (OSU AGEC-751; UNL CropWatch 2018: 'a cash flow budget as a monitor and control'). ISU (Edwards): review the cash-flow budget during the year using monthly bank statements. GFOA lists previous-year actuals, averages of prior-year actuals and projections or forecasts as bases of comparison (seasonality appears only as a revenue-review item). Tennessee Comptroller recommends monthly budget-to-actual reports. Wyoming enterprise budgets' operations calendars show activities concentrated in specific months.

**Limitations.** Extension enterprise budgets are annual (UNL 2026 is Jan-Dec; the Wyoming budgets have calendars but no monthly dollars), so the monthly phasing must come from the ranch's own records or prior-year actuals. The committed fictional data uses a flat monthly plan, so phasing cannot be demonstrated on it without a change.

**Configurable?** Yes: phasing is data, entered per month; a fallback can phase by prior-year actual shares.

**Missing data that should block a confident conclusion.** If only an annual budget exists, the dashboard should say 'plan not phased; comparison uses straight-line' rather than present the percent as authoritative.

**Recommendation.** Treat budget.csv as the phased plan and document that each month's budget is the expected spend in that month. Show a 'plan to date' column. Add an optional prior-year actual column to help phase.

**Phase 1 (Fix now).** budget.csv already has monthly rows; document that each month's budget is the planned spend for that month and compare through the same closed month. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (cross-reference made for this document): [BUD-01](02-findings.md#bud-01).

**Sources.**

*Independent sources:*

- Oklahoma State University Extension, "Developing a Cash Flow Plan (AGEC-751)" (published 2020-08; data years n/a; extension). Checker: **verified**. <https://extension.okstate.edu/fact-sheets/developing-a-cash-flow-plan>
  - Supports: 'For a monthly cash flow plan, the columns can be used to denote the 12 months'; 'Comparing budgeted flows with those that actually occur is a useful management technique for monitoring performance.'
- University of Nebraska-Lincoln CropWatch (Tigner and Duerfeldt), "Cash Flow Budgeting for Farms and Ranches" (published 2018-01-08; data years n/a; extension). Checker: **verified**. <https://cropwatch.unl.edu/2018/cash-flow-budgeting-farms-and-ranches>
  - Supports: Management can use a cash flow budget 'as a monitor and control' and study variances against the cash flow statement. Budgets can be monthly, bi-monthly or quarterly, and expense timing matters.
- Progressive Dairy / AgProud (author William Edwards, Iowa State University), "Twelve steps to cash flow budgeting (excerpt of ISU Ag Decision Maker)" (published 2010-11-12; data years n/a; extension). Checker: **verified**. <https://agproud.com/articles/29923-twelve-steps-to-cash-flow-budgeting>
  - Supports: 'Review your cash-flow budget from time to time during the year'; 'Monthly bank statements and canceled checks are a good source of cash-flow information'; 'You may even need to prepare a revised budget for the remainder of the year.'
- Government Finance Officers Association (GFOA), "Budget Monitoring (best practice)" (Board approved 2018-03-31; data years n/a; other publisher). Checker: **partly**. <https://gfoa.org/materials/budget-monitoring>
  - Supports: Section 2.4 'Basis of comparison' lists previous-year actuals, averages of several prior-year actuals, and projections and forecasts. Seasonality appears only as a revenue-review item, not as a basis of comparison.
- Tennessee Comptroller of the Treasury, Division of Local Government Finance, "Steps to a Well-Managed Budget" (Last modified 2025-01-30; data years n/a; government agency). Checker: **verified**. <https://comptroller.tn.gov/office-functions/lgf/budgets/municipalities-counties-metros-utilities/general-guidance/steps-to-a-well-managed-budget0.html>
  - Supports: Recommends a monthly budget-to-actual report and amending the budget throughout the year.
- University of Wyoming Extension, "Enterprise Budget for Beef Cattle: Cow-Calf Production, 200 Head, Southeastern Wyoming (B-1217)" (published November 2010 (published June 2011); data years 2010 budget year; extension). Checker: **verified**. <https://www.wyoextension.org/agpubs/pubs/B1217.pdf>
  - Supports: Operations calendar: calving March 20-May 20; supplemental feeding January to end of April (1.25 tons hay per pair).
- University of Wyoming Extension, "Enterprise Budget for a Cow-Calf-Yearling Operation, Northwestern Wyoming (MP-126.1)" (published 2014-08; data years 2010 dollars; extension). Checker: **verified**. <https://www.wyoextension.org/agpubs/pubs/MP-126.1.pdf>
  - Supports: Winter feeding November 15 to April 15. The budget is annual with no monthly dollars, so ranches must supply their own phasing.
- Western Livestock Journal (author Scott Clawson, OSU Extension), "Finance chores to tackle this fall" (published 2024-09-06; data years n/a; extension). Checker: **verified**. <https://www.wlj.net/finance-chores-to-tackle-this-fall>
  - Supports: 'The August to September period is a prime time for a spring calving cow-calf operation to experience a cash flow issue'; revenue concentrated in fall calf sales.

<a id="rule-bud-05"></a>
#### RULE-BUD-05: Count only closed months

Status: proposed · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 2 sources (1 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: Count only closed months (on or before a books-closed-through month) and show a data-completeness row when a closed month has no actual for a category. Never treat a blank as \$0 and never let future plan rows dilute the season total.

**Decision it supports.** Whether the variance shown is trustworthy enough to act on.

**Required inputs.** meta.books_closed_through (YYYY-MM) or a per-row closed flag; as_of with timezone; the expected category list per month.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: C (ranch-specific management choice).** CHANGED from A. Checker budget dispute 1: neither cited source discusses books-closed months, blank versus zero actuals or future plan rows; 'the month must be complete' is the researcher's inference. Sound data hygiene, but C on this evidence.

**Evidence (research conclusion).** OBSERVED (healthbudget.repro.mjs): BU-04 blank September Fuel actual gives 'Fuel actual="8640" (string) pct=-0.1', so the real 20% overrun disappears. BU-06 future rows give '(no alerts)' for Fuel and Repairs. BU-07 a deleted September Fuel row gives '20% over' with no note that a month is missing. EXTERNAL: ISU (Edwards) says monthly bank statements and cancelled checks are a good source of cash-flow information for checking the budget during the year; that a month must be complete before it counts is an inference, not stated. GFOA says reporting frequency should be agreed and the basis of comparison should be 'logical and appropriate'. Neither source discusses closed months, blanks or future rows.

**Corrections from the citation checks.**

- Edwards does not state that a month must be complete before it is compared, and GFOA says only frequency is to be agreed; neither addresses closed months, blank versus zero, or future rows (budget checker dispute 1).

**Limitations.** The closing lag is a ranch choice (C). Some months legitimately have no spend in a category; the rule needs an explicit '0 entered' vs 'not entered' distinction.

**Configurable?** Yes: closing lag in days, or an explicit closed-through month.

**Missing data that should block a confident conclusion.** Any missing closed-month actual blocks a severity call for that category; show 'actual not entered' instead.

**Recommendation.** Add books_closed_through to meta.csv. Filter budgetStatus to closed months. Emit a data-quality row for missing cells. Parse blanks as missing, not as strings or zero.

**Phase 1 (Fix now).** Lead default 'closed months'. Needs meta.books_closed_through (default: the month before as_of's month, labelled 'assumed'). The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (cross-reference made for this document): [BUD-01](02-findings.md#bud-01).

**Sources.**

*Independent sources:*

- Progressive Dairy / AgProud (author William Edwards, Iowa State University), "Twelve steps to cash flow budgeting (excerpt of ISU Ag Decision Maker)" (published 2010-11-12; data years n/a; extension). Checker: **verified**. <https://agproud.com/articles/29923-twelve-steps-to-cash-flow-budgeting>
  - Supports: Monthly bank statements are the source used to compare actual against budget.
- Government Finance Officers Association (GFOA), "Budget Monitoring (best practice)" (Board approved 2018-03-31; data years n/a; other publisher). Checker: **partly**. <https://gfoa.org/materials/budget-monitoring>
  - Supports: Reporting frequency 'should be agreed upon'; the basis of comparison should be 'logical and appropriate'. The page does not say to agree on the basis and says nothing about closed months.

<a id="rule-bud-06"></a>
#### RULE-BUD-06: Unbudgeted spending judged in dollars

Status: proposed · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · 1 source (1 partly; 0 vendor)

**Rule.** PROPOSED: Zero-budget or unbudgeted spending is judged in dollars only ('\$X spent with no budget'), with a configurable dollar trigger. It is never shown as a percent.

**Decision it supports.** Whether unplanned spending (e.g., emergency hay or a new category) needs a budget line or a reforecast.

**Required inputs.** Actual by category and month; an explicit budget of 0 vs a missing budget; the unbudgetedUsd threshold.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: C (ranch-specific management choice).** Unchanged (research C).

**Evidence (research conclusion).** OBSERVED: BU-01 'serious | Hay | Infinity% over season to date (\$500)'; BU-02 zero/zero gives 'pct=NaN'; budget.materiality.research.mjs S4 'Hay (unplanned) budget 0 actual 1800 cur pct Infinity -> current: serious | proposed ...: warning unbudgeted spend \$1800'. EXTERNAL: percent variance is undefined at a zero base (arithmetic). Institutional policies carry a dollar-only alternative trigger (U Alberta '\$100,000' OR clause).

**Limitations.** Whether unbudgeted spend is a warning or serious depends on the amount and on whether it was authorized. The dashboard cannot know authorization without a reforecast or note field.

**Configurable?** Yes (unbudgetedUsd; optionally a serious level).

**Missing data that should block a confident conclusion.** A missing budget cell (vs an explicit 0) should produce 'no budget entered', not an unbudgeted-spend alert.

**Recommendation.** Branch on budget &lt;= 0 before computing percent. Alert text shows dollars only. Suggest adding a budget line or reforecast.

**Phase 1 (Fix now).** Lead default 'zero-budget handling'. Show '\$X spent with no budget' against a labelled dollar trigger; never a percent. The 10 planted problems must still be found, with no new false alarms, after this change.

**Related.** Related findings (cross-reference made for this document): [BUD-03](02-findings.md#bud-03).

**Sources.**

*Independent sources:*

- University of Alberta (UAPPOL), "Budget Variance Accountability Procedure" (Approved 2006-07-17; editorial amendments 2025-05-20; data years n/a; other publisher). Checker: **partly**. <https://ualberta.ca/en/alfresco/uappol/finance/budget-variance-accountability/procedure/budget-variance-accountability-procedure.pdf>
  - Supports: A dollar-amount trigger that operates regardless of the percentage (\$100,000 unfavorable, joined by OR to 5%), for year-end variances that trigger a funding plan, not monthly alerts.

<a id="rule-wf-14"></a>
#### RULE-WF-14: State the data time, time zone and age

Status: proposed · Class **C** (ranch-specific management choice) · Phase **1** (Fix now) · no supporting source

**Rule.** PROPOSED: the page must state when the data is from (with a time zone) and how old it is, and flag stale data before the manager acts on it. The demo should say it is a fixed fictional snapshot.

**Decision it supports.** Whether today's plan can rely on these readings or someone must look first.

**Required inputs.** as_of with a UTC offset; per-source last-update times (sensors, weigh-ins, budget month).

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker workflow dispute: the only cited source (exida) has nothing on data timestamps or freshness ('stale alarms' there means standing alarms), so it is rejected and the rule has no supporting source. The observation (as_of has no zone; the page shows no age) and the JavaScript Date parsing behaviour stand as observation and inference.

**Evidence (research conclusion).** OBSERVED: meta.csv as_of is '2026-09-30T18:00' ("asOfHasTimezone": false). At run time the data was "ageHoursAtRun": 368 hours old (browser time zone UTC). The header said 'Data as of September 30, 2026 at 6:00 PM.' and "pageMentionsStaleOrAge": false. Per-tank silence is handled (the T6 row says 'No reading for 42 hours'), but there is no page-level freshness check. Because new Date() parses the string without an offset as viewer-local time, the same file maps to different absolute instants for viewers in different zones (inference from JS Date semantics; the displayed text stays 6:00 PM).

**Limitations.** The right staleness threshold depends on the source: sensors update every 6 h, weigh-ins every few months, budget monthly. Not sourced; ranch choice.

**Configurable?** Yes, per source.

**Missing data that should block a confident conclusion.** If as_of is missing or has no zone, show 'data time unknown' and suppress 'today' wording.

**Recommendation.** Header: 'Data as of Sep 30, 6:00 PM &lt;zone> (N h ago)', plus a per-source line: 'Water: 7 of 8 tanks reported in the last 24 h; weigh-in Sep 15; budget through Sep'. For the portfolio demo, show a 'Fictional snapshot, not live' badge instead of a staleness alarm (D).

**Phase 1 (Fix now).** Lead default 'as-of policy with time zone'. Show 'Data as of &lt;date time zone>' and a 'Fictional snapshot, not live' badge in the demo. The per-source freshness strip is phase 2.

**Related.** Related findings (cross-reference made for this document): [LOAD-05](02-findings.md#load-05), [TIME-02](02-findings.md#time-02), [GAIN-08](02-findings.md#gain-08).

**Sources.** No supporting source after the citation checks. The rule is a design or demonstration choice and is labelled as one.

*Not accepted as support (the checker found the page does not support the claim):*

- exida.com LLC, "Alarm Management and ISA-18 - A Journey, Not a Destination". <http://www.exida.com/articles/ALARM-MANAGEMENT-AND-ISA-18-A-JOURNEY-NOT-A-DESTINATION.pdf> Cited for: Monitoring and assessment stage; operators need trustworthy, current alarm states (general principle; the paper has no ranch-specific staleness figure) Checker (cite_workflow.json checked[14]): Used in rule 14 (as_of freshness and staleness) and as the evidence_url for data field source_last_update. A targeted fetch found nothing on data timestamps, data freshness, stale or bad instrument values, or operators needing trustworthy current alarm states. 'Stale alarms' in the paper means long-standing active alarms, not stale data. The Monitoring and Assessment stage is described as 'comparison of the alarm system performance against the stated performance goals in the philosophy', which concerns alarm-system KPIs, not data age. The paper does not support this rule or this field.

<a id="rule-wf-20"></a>
#### RULE-WF-20: Rules table shows each threshold's basis

Status: proposed · Class **B** (context-dependent guidance) · Phase **1** (Fix now) · 2 sources (1 verified, 1 partly; 1 vendor)

**Rule.** PROPOSED: the rules table shows each threshold's basis: 'Demo setting (D)' for every current value until it is sourced or set by the ranch, then 'Ranch choice, set by &lt;name>, &lt;date>'. A change log (rule, old value, new value, who, when, why) can follow later; until then the repository history is the record of changes.

**Decision it supports.** Whether the manager can trust that a threshold wasn't quietly loosened to empty the list.

**Required inputs.** A rule change log (rule_id, old, new, changed_by, changed_at, reason).

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: B (context-dependent guidance).** Unchanged (research B). HSE CHIS6 supports alarm change control and audit; exida's two Table 1 rows were merged into one quote by the research.

**Evidence (research conclusion).** OBSERVED: thresholds live in RULES with inline comments only. The rules table shows thresholds but no basis or change history. SOURCES: exida lists Management of Change and Audit as ISA-18.2 lifecycle stages, with the metric rows 'Zero alarms suppressed outside of controlled or approved methodologies' and 'Zero alarm attribute changes outside of approved methodologies or MOC'. HSE CHIS6 says new alarms should be formally justified, assessed for operator workload, and placed under change control, with regular audits.

**Limitations.** A small ranch may run this informally. A git commit history can serve as the change log.

**Configurable?** The process is ranch-specific (C). The record itself is recommended.

**Missing data that should block a confident conclusion.** None.

**Recommendation.** Add a 'Basis' column to the rules table: 'Demo setting (D)' for every current value until it is sourced, and later 'Ranch choice, set by &lt;name>, &lt;date>'.

**Phase 1 (Fix now).** Lead default 'honest rule copy': add the Basis column now. The change log is not required for phase 1.

**Sources.**

*Independent sources:*

- UK HSE, "Better alarm handling (CHIS6)" (published 2000-03; data years n/a; government agency). Checker: **verified**. <https://www.hse.gov.uk/pubns/chis6.pdf>
  - Supports: Change control and justification for new alarms; audit

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- exida.com LLC, "Alarm Management and ISA-18 - A Journey, Not a Destination" (Copyright 2018-2020; data years n/a). Checker: **partly**. <http://www.exida.com/articles/ALARM-MANAGEMENT-AND-ISA-18-A-JOURNEY-NOT-A-DESTINATION.pdf>
  - Supports: MOC and audit lifecycle stages; no unauthorized changes

### 3.2 Phase 2: Build next

Workflow and usability rules for the morning review, plus the next layer of water and grazing logic.

<a id="rule-wat-07"></a>
#### RULE-WAT-07: Silence escalation by reporting interval and risk

Status: proposed · Class **C** (ranch-specific management choice) · Phase **2** (Build next) · 3 sources (3 verified; 2 vendor)

**Rule.** PROPOSED: silence escalation. Mark a tank stale after N x its device's expected reporting interval. Severity = max(device-maintenance severity, worst-case water severity from the last-known level, head present and heat, projected to now).

**Decision it supports.** Whether a silent sensor is a maintenance chore or a reason to drive out now.

**Required inputs.** expected_report_interval_h per device, last reading time with timezone, last level, capacity, head present, temperature, device battery and status.

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: Grazing season (demo: 2026-06-01 to 2026-09-30; snapshot as_of 2026-09-30T18:00). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Remote level sensors on stock tanks (demo: 8 tanks, one tank per pasture, a reading every 6 h); devices with different reporting intervals.

**Classification: C (ranch-specific management choice).** Unchanged (research C).

**Evidence (research conclusion).** Repro case A (above): silent 26 h, last reading 20%, cows present gives only 'serious', while a reporting 24% tank is 'critical'. Vendor intervals vary: LoneStar satellite 4/day, cellular 24/day. Ranchbot and Farmbot say only 'irregular intervals'. NMSU LoRaWAN field test (2020 data): the water level sensor 'also timed out when the Wi-Fi system went down'.

**Limitations.** Vendor intervals are vendor claims. Real gaps depend on sky view, vegetation, snow on panels and backhaul.

**Configurable?** Yes. Interval multiple, and response time per tank.

**Missing data that should block a confident conclusion.** Without the expected interval, fall back to a fixed hour limit and label it as an assumption. Without capacity and head, treat silent + cattle present + last level below the ranch's comfort line as needing a visual check today.

**Recommendation.** Implement after capacity and head fields exist. Show 'last seen X h ago at Y% (about Z h of water then)'.

**Phase 2 (Build next).** Part of phase-2 consequence-aware ranking. Uses expected_report_interval_h per device (default 24 h, labelled an assumption) and the last-known level and head present, so a silent tank with cattle never ranks below a reporting tank in a better state.

**Related.** Related findings (cross-reference made for this document): [WAT-05](02-findings.md#wat-05), [WAT-09](02-findings.md#wat-09).

**Sources.**

*Independent sources:*

- NMSU Cooperative Extension / USDA-ARS Jornada (McIntosh et al.), "Testing of a LoRa-WAN digital ranching system on desert rangelands: some practical experiences" (published 2021 (NMSU ACES Beef, Dairy and Livestock Update); the archive entry date 2022-01-25 was not verified by the checker; data years 2020; field study or demonstration). Checker: **verified**. <https://archive.jornada.nmsu.edu/files/bibliography/21-059.pdf>
  - Supports: One Decentlab trough level sensor was more reliable than the GPS collars but timed out when backhaul Wi-Fi failed. The rancher checked it daily.

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- LoneStar Tracking (vendor), "Water Tank Level Monitoring System" (undated (page footer (c) 2026); data years n/a). Checker: **verified**. <https://www.lonestartracking.com/?p=60249>
  - Supports: 4 (satellite) or 24 (cellular) measurements per day.
- Ranchbot Help Center (vendor), "What does Monitor Status 'Delay' mean?" (published 2024-02-16; data years n/a). Checker: **verified**. <https://intercom.help/ranchbot/en/articles/7944517-what-does-monitor-status-delay-mean>
  - Supports: Irregular transmission. Delay = stale values. Inspect if Delay persists more than 3-4 days.

<a id="rule-grz-04"></a>
#### RULE-GRZ-04: Two groups in one pasture at the same time

Status: proposed · Class **C** (ranch-specific management choice) · Phase **2** (Build next) · 1 source (1 partly; 0 vendor)

**Rule.** PROPOSED: Concurrent-occupancy check. Flag when two groups have overlapping stays in the same pasture.

**Decision it supports.** Confirm whether herds were deliberately combined, which changes the stocking density and the planned days, or whether the move record is wrong.

**Required inputs.** moves.csv in/out dates for all groups, group head counts, and an optional 'combined_with' or note field.

**Where it applies.** Cattle class: Two or more grazing groups. Season: Grazing season (demo: 2026-06-01 to 2026-09-30; snapshot as_of 2026-09-30T18:00). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Rotational grazing on 8 pastures with a planned stay length per pasture.

**Classification: C (ranch-specific management choice).** Unchanged (research C).

**Evidence (research conclusion).** OBSERVED (`grazing.rest.research.mjs` section 7): 'P2 Windmill: Cows + Yearlings together 2026-07-24..2026-07-31 (7 d), 330 head combined' and 'P4 Lone Tree: Heifers + Yearlings together 2026-06-25..2026-07-06 (11 d), 195 head combined'. The dashboard raises no row for either. Both stays are closed, so the open-stay rule never sees them. whoIsThere() in exceptions.js joins the group names for water alerts, so the code tolerates co-occupancy but never checks it.

**Limitations.** Overlap can be legitimate. The fictional overlaps come from the generator planning each group independently, not from a planted scenario.

**Configurable?** Yes. Treat a recorded 'combined' flag as an override.

**Missing data that should block a confident conclusion.** If either stay lacks dates, report a records gap.

**Recommendation.** Add a data-check row: 'Two groups recorded in &lt;pasture> &lt;dates>: confirm combined or fix the record'. When groups are combined, compute planned days on combined AU. Low priority compared with the rest and stubble rules, but it protects record credibility.

**Phase 2 (Build next).** Show as information and use it in the rest check (rest counts from the last out_date of any group). The demo has overlaps in P2 and P4, so add it together with the generator and test update, not in phase 1.

**Related.** Related findings (cross-reference made for this document): [GRZ-05](02-findings.md#grz-05), [GRZ-09](02-findings.md#grz-09).

**Sources.**

*Independent sources:*

- USDA NRCS South Dakota, "Prescribed Grazing, Range Technical Note No. 9 (Appendix B drought contingency)" (published April 2017; data years n/a; government agency). Checker: **partly**. <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf>
  - Supports: Appendix B Phase III (pp.15-16): measure remaining forage, combine herds into one, remove 30% or more of the herd. Combining herds can be intentional.

<a id="rule-bud-14"></a>
#### RULE-BUD-14: Budget rows rank below animal-welfare rows at equal severity

Status: proposed · Class **C** (ranch-specific management choice) · Phase **2** (Build next) · no supporting source

**Rule.** PROPOSED: At equal severity, budget rows sort below animal welfare rows (Water, Health, Grazing, Gain) instead of alphabetically first.

**Decision it supports.** What the manager or crew looks at first in the exception table.

**Required inputs.** An area priority order (configurable).

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: C (ranch-specific management choice).** Unchanged (research C), presented as unsupported management judgement. Checker budget dispute 4: the GFOA citation says nothing about ordering exceptions, so it is rejected.

**Evidence (research conclusion).** OBSERVED (healthbudget.repro.mjs BU-13): '1. Budget: Fuel | 2. Budget: Repairs | 3. Gain: Heifers | 4. Grazing: Yearlings in Sand Hills | 5. Health: Yearlings: Booster vaccine | 6. Water: Tank T6 (Cedar Draw)'. Budget sorts first only because the tie-break is area.localeCompare.

**Limitations.** The priority order is a management judgement, not research-derived.

**Configurable?** Yes.

**Missing data that should block a confident conclusion.** n/a

**Recommendation.** Add an AREA_PRIORITY constant to the sort tie-break, or sort by severity then priority. Budget overruns are reviewed at month close and are rarely same-day actions.

**Phase 2 (Build next).** Part of phase-2 consequence-aware ranking ([RULE-WF-10](#rule-wf-10)).

**Related.** Related findings (cross-reference made for this document): [UI-09](02-findings.md#ui-09).

**Sources.** No supporting source after the citation checks. The rule is a design or demonstration choice and is labelled as one.

*Not accepted as support (the checker found the page does not support the claim):*

- Government Finance Officers Association (GFOA), "Budget Monitoring (best practice)". <https://gfoa.org/materials/budget-monitoring> Cited for: Reporting frequency may vary by program area. This weakly supports budget review on a monthly cadence rather than as a same-day exception. Checker (cite_budget.json checked[4]): This entry covers the meta.books_closed_through and meta.as_of fields and the area-sort rule. The page says nothing about books-closed months, data completeness, blank versus zero actuals, timestamps or time zones, so it does not support either field. For the area-sort rule, 'may vary for different program areas' is about how often reports go out. It says nothing about the order of exceptions or about animal welfare coming before budget. Even 'weakly supports' overstates it. The variance_note and owner field is supported, by the responsibility language quoted in the previous entry.

<a id="rule-wf-02"></a>
#### RULE-WF-02: Chart details reachable by keyboard and touch

Status: proposed (current fails) · Class **A** (supported general guidance) · Phase **2** (Build next) · 2 sources (2 verified; 0 vendor)

**Rule.** PROPOSED (current fails): every detail now shown only on pointer hover (tank reading at a time, grazing stay dates and plan, animal tag and ADG, budget dollars) must also be reachable by keyboard and by touch, through focusable marks or an equivalent 'Show data' table.

**Decision it supports.** Lets a manager on a phone in the truck, or a keyboard or screen-reader user, find which animals are slow, when a stay started, or a tank's recent readings without a mouse.

**Required inputs.** The rows already loaded (water, moves, weights, budget).

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: A (supported general guidance).** Unchanged (research A; WCAG 2.2 SC 2.1.1). Applying failure F54 to tooltips is the researcher's inference, as disclosed.

**Evidence (research conclusion).** OBSERVED (docs/audit/diagnostics/workflow.usability.research.mjs, Chromium via Playwright): "pointerOnly": {"elementsWithPointerListeners": 232, "byTag": {"rect": 37, "circle": 195}, "focusableAmongThem": 0, "keyOrFocusListenersOnElements": 0}. The Tab order reached only the six filter chips (tabStops: All (10), Water (3), Grazing (1), Gain (2), Health (2), Budget (2)). On a phone (390x844, hasTouch), "phoneTapShowsTooltip": false and a gain dot measured {"w": 4.5, "h": 4.5} CSS px. Animal tags of the 6 slow yearlings appear in the exception row text, but the other details are pointer-only. SOURCE: SC 2.1.1 Keyboard (Level A), 'All functionality of the content is operable through a keyboard interface'. Understanding 2.1.1 lists failure F54 (only pointing-device-specific event handlers). Understanding 1.4.13 says content triggered by pointer hover should also be triggered by keyboard focus.

**Limitations.** Understanding 2.1.1 does not say explicitly that hover-only tooltips are 'functionality'. My reading, an inference, is that they risk failing it through F54. Tested in Chromium only, with no screen reader.

**Configurable?** No.

**Missing data that should block a confident conclusion.** None.

**Recommendation.** Add a &lt;details>&lt;summary>Show data&lt;/summary>&lt;table>...&lt;/table>&lt;/details> under each chart: per tank the last 8 readings, per group the stays, per animal tag/ADG/weight (sortable, slow animals first). This one change also satisfies 1.1.1 and gives the crew briefing its source tables. Optionally make the dots and bars focusable with tabindex=0 and show the same tooltip on focus.

**Phase 2 (Build next).** Phase-2 default 'keyboard and touch chart details'. Observed: 232 pointer-only chart elements, none focusable.

**Related.** Related findings (cross-reference made for this document): [UI-01](02-findings.md#ui-01).

**Sources.**

*Independent sources:*

- W3C WAI, "Understanding SC 2.1.1: Keyboard" (Updated 2026-05-11; data years n/a; standard or specification). Checker: **verified**. <https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html>
  - Supports: All functionality operable via keyboard; failure F54 (pointing-device-specific handlers only)
- W3C WAI, "Understanding SC 1.4.13: Content on Hover or Focus" (Updated 2026-07-12; data years n/a; standard or specification). Checker: **verified**. <https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html>
  - Supports: Content triggered by pointer hover should also be triggered by keyboard focus (cross-reference to 2.1.1)

<a id="rule-wf-03"></a>
#### RULE-WF-03: Tooltip dismissible with Escape and hoverable

Status: proposed (current fails) · Class **A** (supported general guidance) · Phase **2** (Build next) · 2 sources (1 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED (current fails): the custom tooltip must be dismissible with Escape without moving the pointer, and hoverable (the pointer can move onto it without it disappearing), or it must be replaced by click-to-pin details.

**Decision it supports.** Lets screen-magnifier and large-cursor users read chart details. Stops the tooltip from covering the data the manager is comparing.

**Required inputs.** None (UI behaviour).

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: A (supported general guidance).** Kept at A (WCAG 2.2 SC 1.4.13). Checker workflow dispute: 'the Escape failure is unambiguous' overstates it; the Dismissible clause exempts content that does not obscure or replace other content, so the failure depends on showing that the tooltip covers chart data.

**Evidence (research conclusion).** OBSERVED: hovering the first gain dot gave "afterHover": {"shown": true, "text": "H001 (Heifers) | 0.54 lbs/day, Jul 20 to Sep 15 | Now 1169 lbs", "role": "status", "pointerEvents": "none"}, then "shownAfterEscape": true (Escape did not dismiss) and "shownAfterMovingPointerOntoTooltip": false (it vanished when the pointer moved toward it). CSS: .tip { position: fixed; pointer-events: none }. SOURCE: SC 1.4.13 (Level AA) requires 'A mechanism is available to dismiss the additional content without moving pointer hover or keyboard focus', hoverable, and persistent. Understanding 1.4.13 lists F95 (content shown on hover is not hoverable).

**Limitations.** The tooltip follows the pointer, so 'hoverable' may be argued differently. Whether Escape dismissal is required depends on SC 1.4.13's exception for content that 'does not obscure or replace other content'; the failure holds only if the tooltip is shown to cover chart data, which has not been shown.

**Configurable?** No.

**Missing data that should block a confident conclusion.** None.

**Recommendation.** Add a keydown Escape handler that hides #tip. Either let the tooltip stay while the pointer is over it (pointer-events:auto plus a short hide delay), or switch to click/tap-to-pin details in a fixed panel below each chart, which also fixes phone use.

**Phase 2 (Build next).** Phase 2 with the chart-detail work (click-to-pin details also satisfy it).

**Sources.**

*Independent sources:*

- W3C, "Web Content Accessibility Guidelines (WCAG) 2.2" (published 2024-12-12; data years n/a; standard or specification). Checker: **partly**. <https://www.w3.org/TR/WCAG22/>
  - Supports: Normative SC 1.4.13 text (dismissible, hoverable, persistent)
- W3C WAI, "Understanding SC 1.4.13: Content on Hover or Focus" (Updated 2026-07-12; data years n/a; standard or specification). Checker: **verified**. <https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html>
  - Supports: Intent and failure F95 (not hoverable). Browser title tooltips are excluded, but author tooltips are in scope.

<a id="rule-wf-04"></a>
#### RULE-WF-04: Text alternatives for charts

Status: proposed (partly met) · Class **A** (supported general guidance) · Phase **2** (Build next) · 1 source (1 verified; 0 vendor)

**Rule.** PROPOSED (partly met): each chart needs a short text alternative that states the decision-relevant state, plus a long alternative or data table. Currently the labels name the chart but carry no values.

**Decision it supports.** Lets a screen-reader user, or a printed or text-only briefing, get 'T4 Lone Tree 10%, down 46 points in 24 h' rather than 'Tank T4 level, last 7 days'.

**Required inputs.** waterStatus, grazingStatus, gainStatus and budgetStatus outputs (already computed).

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: A (supported general guidance).** Unchanged (research A; WCAG 2.2 SC 1.1.1).

**Evidence (research conclusion).** OBSERVED chartAlts: Water has 8 charts with labels like 'Tank T2 level, last 7 days', withTitleOrDesc 0, withDescribedBy 0, dataTableInSection false. Grazing is 'Grazing rotation by group' with no table. Gain is 'Average daily gain per animal by group' with no table. Budget is 'Percent over or under budget by category' with dataTableInSection true. The water card &lt;h4> does show the current level as text ('T2 Windmill 11.8%'). SOURCE: Understanding 1.1.1 says charts fall under Situation B and need a short alternative plus a long description that 'identifies the type of chart' and summarizes the data, and 'Where possible and practical, the actual data is provided in a table.'

**Limitations.** Labels exist, so this is not a total failure. The gap is the equivalence of purpose.

**Configurable?** No.

**Missing data that should block a confident conclusion.** If a tank has no reading within the sensor-silent window, the text alternative must say 'no reading since &lt;time>' and must not state the stale level as current.

**Recommendation.** Generate aria-label from the same status objects the rules use, e.g. 'Tank T4, Lone Tree: 10% now, dropped 46 points in 24 hours, below the 25% line'. Add the 'Show data' tables from the keyboard rule as the long alternative.

**Phase 2 (Build next).** Phase-2 defaults 'phone tables' and chart details: a data table or 'Show data' for each chart.

**Sources.**

*Independent sources:*

- W3C WAI, "Understanding SC 1.1.1: Non-text Content" (Updated 2026-09-06; data years n/a; standard or specification). Checker: **verified**. <https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html>
  - Supports: Charts need a short plus a long text alternative, with the data in a table where practical

<a id="rule-wf-05"></a>
#### RULE-WF-05: Announce filter results and keep focus on the chip

Status: proposed (current fails) · Class **A** (supported general guidance) · Phase **2** (Build next) · 1 source (1 verified; 0 vendor)

**Rule.** PROPOSED (current fails): when a filter chip changes the exception list, announce the result as a status message ('Showing 3 of 10: Water') and keep keyboard focus on the chip. Remove role=status from the hover tooltip.

**Decision it supports.** Lets a screen-reader or keyboard user filter to one area and keep going without losing their place.

**Required inputs.** Filtered row count; the area name.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: A (supported general guidance).** Unchanged (research A; WCAG 2.2 SC 4.1.3). Checker note: calling role=status on the tooltip a 'misuse' is the researcher's inference; the listed failure covers role=alert and aria-live=assertive.

**Evidence (research conclusion).** OBSERVED: the only live region is {"id": "tip", "role": "status"} (the hover tooltip). After clicking 'Water' the rows went from 10 to 3, but "liveRegionTextChanged": false, and the live region still held tooltip text. Keyboard: focus was on 'Water (3)', Enter gave "activeElementAfterEnter": "BODY", and the next Tab landed on "BUTTON All (10)" (focus is lost because exceptionsTable() rebuilds the chips with innerHTML). INFERENCE: role=status on a tooltip rewritten on every pointermove will make a screen reader announce hover text repeatedly (not tested with a screen reader). SOURCE: SC 4.1.3 (AA), status messages 'can be programmatically determined through role or properties such that they can be presented to the user by assistive technologies without receiving focus'. Examples include '5 results returned', and technique ARIA22 uses role=status.

**Limitations.** The focus-loss issue maps to focus order and predictability more than to 4.1.3. It is reported here because it breaks the same workflow.

**Configurable?** No.

**Missing data that should block a confident conclusion.** None.

**Recommendation.** Add &lt;p class="sr-only" role="status" id="filterStatus"> and set its text after filtering. Update aria-pressed on the existing buttons instead of replacing them. Drop role=status from #tip.

**Phase 2 (Build next).** Phase-2 default 'filters'.

**Related.** Related findings (cross-reference made for this document): [UI-10](02-findings.md#ui-10).

**Sources.**

*Independent sources:*

- W3C WAI, "Understanding SC 4.1.3: Status Messages" (Updated 2026-05-11; data years n/a; standard or specification). Checker: **verified**. <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>
  - Supports: SC text, the definition of a status message, the results-count example, ARIA22 role=status, and the failure note on misusing aria-live/alert

<a id="rule-wf-08"></a>
#### RULE-WF-08: Decision-relevant chart marks at 3:1 contrast, or in text

Status: proposed · Class **B** (context-dependent guidance) · Phase **2** (Build next) · 1 source (1 partly; 0 vendor)

**Rule.** PROPOSED: chart marks a reader needs to make the decision (past grazing stays, the over-plan segment, target lines) should reach 3:1 against adjacent colours, or carry the same information in text.

**Decision it supports.** Seeing at a glance where a group has been, and how far over plan it is, on a dim phone screen or in sunlight.

**Required inputs.** The CSS colour tokens.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: B (context-dependent guidance).** Kept at B. Checker workflow dispute: the recommendation 'leave the gridlines faint' conflicts with Understanding 1.4.11 Figure 20, which treats value gridlines as graphical objects needing 3:1 unless labels carry the same values.

**Evidence (research conclusion).** OBSERVED (WCAG contrast computed from the CSS custom properties): gridlines --grid 1.2:1 against the card surface; zero/axis lines 1.61:1; past grazing stays --bar 1.38:1; over-plan overlay --serious against the current stay --s1 1.25:1; water threshold dashes --muted 5.92:1; gain dots (--s1 at 0.55 opacity) 3.58:1. SOURCE: Understanding 1.4.11 requires 3:1 for graphical objects needed to understand the content, and says this does not apply when labels or values in the chart convey the same information.

**Corrections from the citation checks.**

- Drop 'gridlines are not needed to read the values' unless every value is labelled.

**Limitations.** Whether each mark is 'required to understand' is a judgement. Past stays carry pasture-ID text when wide enough, and the over-plan segment carries '+3d'. Gridlines can stay faint only if every value the reader needs is labelled in text; Understanding 1.4.11 Figure 20 treats value gridlines as graphical objects needing 3:1.

**Configurable?** Yes. These are palette choices.

**Missing data that should block a confident conclusion.** None.

**Recommendation.** Darken or outline past stays (or add pasture-ID text at every width). Give the over-plan segment a hatch or outline as well as hue. Leave the gridlines faint only where the values are labelled in text; otherwise give them 3:1.

**Phase 2 (Build next).** With the phase-2 chart work.

**Sources.**

*Independent sources:*

- W3C WAI, "Understanding SC 1.4.11: Non-text Contrast" (Updated 2026-09-06; data years n/a; standard or specification). Checker: **partly**. <https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html>
  - Supports: Chart lines, bars and gridlines needed for reading need 3:1, with exceptions when labels convey the information

<a id="rule-wf-10"></a>
#### RULE-WF-10: Severity by consequence and time to respond

Status: proposed · Class **B** (context-dependent guidance) · Phase **2** (Build next) · 2 sources (2 verified; 1 vendor)

**Rule.** PROPOSED: assign severity by consequence of no response and the time available to respond, with about 3 documented levels (e.g. Critical = act today, animals or water at risk; Serious = act this week; Warning = plan at the next gather or month).

**Decision it supports.** Decides what the crew does first this morning and what waits.

**Required inputs.** Per rule: consequence class and response window. Ranch staffing.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: B (context-dependent guidance).** Unchanged (research B). Analogy from process-industry and clinical alarm management; their numeric benchmarks are not ranch thresholds.

**Evidence (research conclusion).** OBSERVED: the current 10 rows are Critical 2, Serious 6, Warning 2. 'Fuel 21% over season to date' is Serious, the same level as 'Tank T6 ... No reading for 42 hours'. SOURCES: exida (a consultancy white paper summarising ISA-18.2) says ISA-18.2 sets priority by consequence severity and time to respond, recommends no more than 3-4 priorities, and gives roughly 80% Low / 15% Medium / 5% High as a long-run distribution. HSE CHIS6 recommends about 3 levels based on the consequences of failing to respond, with a suggested split of about 5/15/80.

**Limitations.** The 80/15/5 split describes long-run alarm counts at a process console. It does not apply to one day's snapshot or to a synthetic data set with planted problems, so the demo's top-heavy distribution is not itself a defect. The level definitions are the ranch's choice.

**Configurable?** Yes, per ranch (C), but the method (consequence x time) should be fixed and written down.

**Missing data that should block a confident conclusion.** If the response window for a rule is unknown, show it at the lowest level that is still visible, never silently drop it.

**Recommendation.** Add 'Why this level' (consequence and window) to the rules table. Consider showing budget variances as a separate weekly or monthly review list rather than in the daily attention list.

**Phase 2 (Build next).** Phase-2 default 'consequence-aware ranking'.

**Related.** Related findings (cross-reference made for this document): [UI-09](02-findings.md#ui-09), [WAT-09](02-findings.md#wat-09).

**Sources.**

*Independent sources:*

- UK Health and Safety Executive, "Better alarm handling (CHIS6)" (published 2000-03; data years n/a; government agency). Checker: **verified**. <https://www.hse.gov.uk/pubns/chis6.pdf>
  - Supports: About 3 priority levels based on consequence; suggested 5/15/80 split

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- exida.com LLC, "Alarm Management and ISA-18 - A Journey, Not a Destination" (Copyright 2018-2020 (presented 2010 per revision history); data years n/a). Checker: **verified**. <http://www.exida.com/articles/ALARM-MANAGEMENT-AND-ISA-18-A-JOURNEY-NOT-A-DESTINATION.pdf>
  - Supports: Priority from consequence and time to respond; 3-4 levels; \~80/15/5 distribution

<a id="rule-wf-11"></a>
#### RULE-WF-11: Acknowledging never clears an exception

Status: proposed · Class **B** (context-dependent guidance) · Phase **2** (Build next) · 2 sources (1 verified, 1 partly; 1 vendor)

**Rule.** PROPOSED: acknowledging an exception never clears it. Acknowledge records who, when, a note and the planned action. The row stays on the list, marked Acknowledged, until the data shows a return to normal. A condition that clears and later recurs is a new event that needs a new acknowledgement.

**Decision it supports.** Stops 'I saw it' being mistaken for 'it is fixed' (e.g. tank T4 acknowledged at 7 am but still leaking at noon). Shows the crew what is already claimed.

**Required inputs.** A stable exception_id, ack_by, ack_at, ack_note, and the recomputed condition on every data load.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: B (context-dependent guidance).** Unchanged (research B). Rests on vendor and consultancy documentation (Ignition, exida) and HSE by analogy, not on the paywalled ISA-18.2 text.

**Evidence (research conclusion).** OBSERVED: the page has no acknowledge, note or owner control, and the table headers are Severity|Area|What|Problem|First step (hasOwnerColumn false, hasStatusOrAckColumn false). SOURCES: the Ignition 8.1 manual (vendor) treats Active/Cleared and Acknowledged/Unacknowledged as separate conditions, giving four states (Active/Unacked, Active/Acked, Cleared/Unacked, Cleared/Acked). Alarm events 'never transition from Cleared to Active'; a new event is created if the criteria are met again. Clearing depends on the source value, not on acknowledgement. This is my reading of the fetched summary; the page does not literally say 'ack does not clear'. HSE CHIS6 names rapid acknowledgement and routine silencing as nuisance-alarm warning signs.

**Limitations.** The ISA-18.2 normative state diagram itself was not fetched (the standard is paywalled and web search was unavailable). The state model is supported by a vendor manual and by the analogy. Re-alarming when severity escalates is my own design inference, not sourced.

**Configurable?** No for the semantics. The ranch may choose who is allowed to acknowledge.

**Missing data that should block a confident conclusion.** Without a stable exception_id an acknowledgement cannot be matched to the next day's row, so the row must be shown as new and unacknowledged, never hidden.

**Recommendation.** States: New (active, unacked); Acknowledged (active, acked: who/when/note/owner); Resolved since last review (cleared, unacked, listed once in a 'Resolved' strip); Closed (cleared and acked or verified). If severity escalates (Warning to Critical), clear the acknowledgement (inference). Key the id as area + subject id (tank_id/group/task/category) + rule id.

**Phase 2 (Build next).** Phase-2 default: an optional per-device acknowledgement labelled 'this device only' that never clears a condition. Shared acknowledgement records are deferred.

**Sources.**

*Independent sources:*

- UK Health and Safety Executive, "Better alarm handling (CHIS6)" (published 2000-03; data years Milford Haven 1994: 275 alarms in the final 11 minutes; government agency). Checker: **verified**. <https://www.hse.gov.uk/pubns/chis6.pdf>
  - Supports: Acknowledging is distinct from acting. Alarm floods and routine acknowledgement are warning signs.

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- Inductive Automation (vendor documentation), "Alarming | Ignition User Manual 8.1" (Last updated 2026-04-17; data years n/a). Checker: **partly**. <https://docs.inductiveautomation.com/docs/8.1/platform/alarming>
  - Supports: Active/Cleared and Acked/Unacked are separate; four combined states; a cleared event never reactivates and recurrence creates a new event

<a id="rule-wf-15"></a>
#### RULE-WF-15: Shared acknowledgements cannot live only in localStorage

Status: proposed · Class **B** (context-dependent guidance) · Phase **2** (Build next) · 3 sources (3 verified; 0 vendor)

**Rule.** PROPOSED: acknowledgements, notes and owners that the crew must share cannot live only in localStorage. Use localStorage only for per-device conveniences (selected filter, last-review time, unsent note drafts) and label anything stored there 'saved on this device only'.

**Decision it supports.** Makes sure what the manager acknowledged on the office PC is what the foreman sees on his phone, and that it survives a cleared browser.

**Required inputs.** A shared store for the acknowledgement log.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: B (context-dependent guidance).** CHANGED from A. Checker workflow dispute: the storage facts (per-origin, eviction, private-mode clearing, Safari 7-day deletion) are A, but the conclusion that shared state cannot live there and the 'saved on this device only' labelling policy rest on inference no source states.

**Evidence (research conclusion).** OBSERVED: the page writes nothing to storage today ("writes": [], "localStorageKeys": []). SOURCES: MDN says localStorage is specific to the document's origin and protocol (http vs https are different stores), persists across sessions, is cleared when the last private tab closes, and can throw SecurityError when storage is blocked. MDN Storage quotas says data is managed per origin, is best-effort by default (evicted LRU under storage pressure unless persisted), Web Storage is limited to 5 MiB local plus 5 MiB session per origin, and Safari deletes script-created data after 7 days of browser use with no interaction when tracking prevention is on. WHATWG says 'Each site has its own separate storage area' and user agents 'may ... automatically delete stored data after a period of time'. None of the sources mentions cross-device sync; that localStorage is tied to one browser profile on one device is my inference from per-origin, per-user-agent storage.

**Limitations.** navigator.storage.persist() reduces eviction but still does not share data.

**Configurable?** No.

**Missing data that should block a confident conclusion.** If storage throws or comes back empty, the page must still render every exception as unacknowledged. It must never hide rows because of missing local state.

**Recommendation.** For the demo, keep acknowledgements in a committed data/acknowledgements.csv (append-only: exception_id, ack_by, ack_at, note, owner, shelved_until), read like the other CSVs. Mark any browser-only notes clearly. Wrap every storage call in try/catch.

**Phase 2 (Build next).** Phase-2 default: per-device conveniences only (filter, last review time), every storage call wrapped in try/catch, and the page renders fully with an empty store.

**Sources.**

*Independent sources:*

- MDN Web Docs (Mozilla), "Window: localStorage property" (Last modified 2026-10-12; data years n/a; standard or specification). Checker: **verified**. <https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage>
  - Supports: Origin- and protocol-specific; persists across sessions; cleared after private browsing; SecurityError when blocked
- MDN Web Docs (Mozilla), "Storage quotas and eviction criteria" (Last modified 2026-01-05; data years n/a; standard or specification). Checker: **verified**. <https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria>
  - Supports: Per-origin; best-effort vs persistent; LRU eviction; 5 MiB limits; Safari 7-day eviction
- WHATWG, "HTML Living Standard - Web storage" (Last updated 2026-10-14; data years n/a; standard or specification). Checker: **verified**. <https://html.spec.whatwg.org/multipage/webstorage.html>
  - Supports: Each site has its own storage area; user agents may delete stored data after a period

<a id="rule-wf-17"></a>
#### RULE-WF-17: One-page printable crew briefing

Status: proposed (current fails in print) · Class **B** (context-dependent guidance) · Phase **2** (Build next) · 4 sources (4 verified; 0 vendor)

**Rule.** PROPOSED (current fails in print): a one-page printable crew briefing in black on white, large text, grouped by place or route, each item with its first step, a check box and space for a written result. Generated by @media print or a separate 'Briefing' view.

**Decision it supports.** Hands the morning plan to a crew without phones or signal, and brings back written observations to enter as records.

**Required inputs.** The exception list (filtered to today and this week), owner or route, as_of, print time, and the fictional-data label.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: B (context-dependent guidance).** Unchanged (research B). SOP guidance is dairy-oriented (Penn State, Cornell); print was measured in Chromium only.

**Evidence (research conclusion).** OBSERVED: "mediaPrintRules": 0, "pageRules": 0, "printColorAdjust": "economy". The Chromium default PDF (backgrounds off) ran to "pdfPages": 4 on Letter. Measured at 300 dpi, the main text colour (--ink: title, tile values, Area, What, Problem, severity words) printed rgb(158,157,154), 2.71:1 on white. First step (--ink-2) printed rgb(112,111,106), 5.03:1. The faint notes and table headers (--muted) printed rgb(59,58,55), 11.37:1. So the print hierarchy is inverted: the most important text is the faintest. At 150 dpi the gain chart's target lines and 'target 1.0/2.0' labels are near-white on white and practically invisible, the budget legend swatches (CSS backgrounds) are gone, and card shadows print as grey bands. SOURCES: MDN Printing (@media print, @page, beforeprint/afterprint). MDN print-color-adjust says that by default (economy) a browser 'might opt to leave out all background images and to adjust text colors'. The Penn State SOP Writing Guide says to post SOPs at the workplace in text large enough to read while working, laminate them, use pictures because they help regardless of literacy or native language, and write short imperative sentences. Cornell (Skellie 2019) says to post procedures in plain view, keep grouped protocols in a binder, and translate if needed.

**Corrections from the citation checks.**

- Skellie (Cornell 2019) does not say 'frequently used' procedures, and the Stup (Penn State) guide has no translation advice; translation comes from Skellie.

**Limitations.** Print output was measured only in headless Chromium's PDF. Firefox and Safari were not tested and may differ. The extension SOP guidance is dairy-oriented (Penn State, Cornell), and I found no Northern Plains ranch-specific crew-briefing source (web search was unavailable).

**Configurable?** Content grouping (by person, route or pasture) and language are ranch choices (C).

**Missing data that should block a confident conclusion.** If as_of is stale or unknown, print it prominently at the top ('Data from Sep 30 - check before acting').

**Recommendation.** Add @media print { :root { --page:#fff; --ink:#000; --ink-2:#222; --muted:#444; ... } .chips, .tip { display:none } .card { box-shadow:none; background:#fff } } and a 'Print crew briefing' view. One Letter page. Columns: [ ] | Where (pasture/tank) | Problem | First step | Result / reading / initials. Footer: as_of, printed-at, 'Example Ranch - fictional data'. Optional Spanish column or second page.

**Phase 2 (Build next).** Phase-2 default 'printable crew briefing'.

**Sources.**

*Independent sources:*

- MDN Web Docs, "Printing (CSS media queries guide)" (Last modified 2025-11-07; data years n/a; standard or specification). Checker: **verified**. <https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing>
  - Supports: @media print, print stylesheets, @page, beforeprint/afterprint
- MDN Web Docs, "print-color-adjust" (Last modified 2026-08-27; data years n/a; standard or specification). Checker: **verified**. <https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust>
  - Supports: The default economy mode may drop backgrounds and adjust text colours; no guarantee that exact is honoured
- Penn State College of Agricultural Sciences, Cooperative Extension (R. Stup); hosted by Cornell, "Standard Operating Procedures: A Writing Guide" (published 2001; data years n/a; extension). Checker: **verified**. <https://bpb-us-e1.wpmucdn.com/blogs.cornell.edu/dist/7/8192/files/2018/03/SOPManual-1-2drpn48.pdf>
  - Supports: Post at the workplace in large text; laminate; pictures for literacy and language; short imperative steps; pair with training and feedback
- Cornell University (J. Skellie, Farm Management Specialist), "Make SOPs Available to Employees" (published 2019-07-18; data years n/a; extension). Checker: **verified**. <https://bpb-us-e1.wpmucdn.com/blogs.cornell.edu/dist/7/8192/files/2019/07/Make-SOPS-Available-to-Employees.pdf>
  - Supports: Post in plain view; binders for grouped protocols; laminate; translate; photo per step

<a id="rule-wf-18"></a>
#### RULE-WF-18: About 2-minute morning review (design target)

Status: proposed (design target) · Class **C** (ranch-specific management choice) · Phase **2** (Build next) · 2 sources (2 verified; 1 vendor)

**Rule.** PROPOSED design target (not validated): a \~2-minute morning review. Freshness line, then counts ('2 today / 6 this week / 2 plan', 'N new since last review, M resolved'), then the exception list with Open-for and Owner, with charts below as drill-down only.

**Decision it supports.** What the manager assigns before the crew leaves.

**Required inputs.** Exceptions with severity, first_seen, ack and owner; last_review_at per viewer; as_of.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: C (ranch-specific management choice).** Unchanged (research C). The 2-minute figure is a design target; no user testing was done.

**Evidence (research conclusion).** OBSERVED: today's report has 10 rows and 215 words in the row cells (rowCount 10, wordsInRows 215), plus 5 tiles. The tiles mix status ('Head on grass 375') with exceptions. SOURCES (by analogy only): Drew et al. 2014 (PLOS ONE) observed 2,558,760 alarms over 31 days in 77 ICU beds (187 audible alarms per bed per day), with 88.8% of 12,671 annotated arrhythmia alarms false positives. The authors recommend tailoring alarm settings and making delays configurable. exida (consultancy white paper) ISA-18.2 benchmarks put about 150 alarms/day per operator as 'very likely acceptable' and 300 as the maximum manageable, for a continuously staffed console. HSE says each alarm needs a defined response.

**Limitations.** No user testing was done. The 2-minute figure is a design target, not evidence. The clinical and process benchmarks are continuous-monitoring settings and do not transfer numerically to a once-a-day review; they support only the principle that every row should be actionable and duplicate or non-actionable rows removed.

**Configurable?** Yes.

**Missing data that should block a confident conclusion.** If first_seen or ack data is unavailable, still show the list, with the 'new/resolved' counts replaced by 'history unavailable'.

**Recommendation.** Order: (1) freshness and the fictional label; (2) severity counts and new/resolved counts; (3) the list grouped Today / This week / Plan, each row with Open-for, Owner/Ack and First step; (4) 'Print crew briefing'; (5) charts with 'Show data'. Measure it with a stopwatch test on 2-3 managers before claiming '2 minutes'.

**Phase 2 (Build next).** Phase-2 default 'morning review'. Measure with a stopwatch test before claiming a time.

**Sources.**

*Independent sources:*

- PLOS ONE (Drew BJ, Harris P, Zègre-Hemsey JK, et al.), "Insights into the Problem of Alarm Fatigue with Physiologic Monitor Devices: A Comprehensive Observational Study of Consecutive Intensive Care Unit Patients" (published 2014-10-22; data years 31 days, March 2013; 461 patients; 5 ICUs at UCSF; peer-reviewed). Checker: **verified**. <https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0110274>
  - Supports: Scale of non-actionable alarms (88.8% false-positive arrhythmia alarms; 187 audible alarms per bed per day); recommendations to tailor settings and make delays configurable

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- exida.com LLC, "Alarm Management and ISA-18 - A Journey, Not a Destination" (Copyright 2018-2020; data years Benchmarks based on at least 30 days of data). Checker: **verified**. <http://www.exida.com/articles/ALARM-MANAGEMENT-AND-ISA-18-A-JOURNEY-NOT-A-DESTINATION.pdf>
  - Supports: Per-operator alarm-rate benchmarks (150/day acceptable, 300/day maximum; about 1 per 10 minutes)

### 3.3 Phase 3: Add later

Grouped by the three additions (see section 1.4 for the ranking).

#### Addition 1: water supply coverage from tank capacity and head count

<a id="rule-wat-06"></a>
##### RULE-WAT-06: Hours or days of water left in each tank

Status: proposed · Class **C** (ranch-specific management choice) · Phase **3** (Add later) · 10 sources (8 verified, 2 partly; 0 vendor)

**Rule.** PROPOSED: estimate how long the water in each tank will last for the cattle on it. Usable gallons (level x usable capacity, with and without expected refill) divided by demand (head present by class x gal/head/day for the day's temperature) gives hours or days of water. Warn below a ranch-set figure, for example less than the time until the next check plus the time needed to respond.

**Decision it supports.** [water research rule 5] Who goes, and how soon: haul water, fix the float, or move cattle. | [context research rule 10] Whether to haul water, fix supply, or move cattle before a tank runs dry

**Required inputs.** [water research rule 5] tank_capacity_gal, sensor offset or usable volume, level, head and class per group present (groups.csv plus moves.csv), forecast or observed daily high, intake lookup table, supply type and design inflow, hours until next check, and travel time. | [context research rule 10] tank capacity (gal), usable fraction, refill rate or haul schedule, head per tank (from moves/groups), class, forecast max temp, intake table

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: Summer, when intake peaks. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Float-fed, storage or hauled tanks with known capacity and head counts.

**Classification: C (ranch-specific management choice).** CHANGED from B (both research rules). Checker water dispute 3 and context dispute 3: only the intake-by-class-and-temperature inputs are sourced (NDSU AS1763, UNL G2060, K-State MF3303). The formula (usable fraction, refill, head at the tank) and the alert threshold are unsourced design or ranch choices. Class C with B inputs.

**Evidence (research conclusion).** [water research rule 5] The intake tables agree in shape. NDSU AS1763 (rev. 2021, adapted from NRC updated 2016) and UNL G2060 (2011, adapted from NRC 1996 / Winchester and Morris 1956) give, in gal/head/day: growing 600 lb 5.3 at 40F to 12.7 at 90F; finishing 1,000 lb 8.7 to 20.6; lactating cows 900+ lb 11.4 (40F), 16.9 (70F), 17.9 (80F). K-State MF3303 (2016): a 1,100 lb cow with 25 lb milk needs 12.8 / 15.4 / 17.9 at 40/65/90F, plus about 1 gal per 10F above 40F. UNL BeefWatch adds 5-10 gal for the calf in heat. Rules of thumb: 1-2 gal per 100 lb (K-State 2018; UNL 2020). SDSU (2026), quoting A. DiCostanzo (UNL) for a feedlot animal: 0.66-1 gal per lb dry matter intake above 75F. Diagnostic output shows the spread this rule would capture: 'T4 P4 level 10% | Heifers 45 hd ... small 1000 gal -> 3.4-5.1 h | ... storage 10000 gal -> 34.0-50.8 h'. | [context research rule 10] NDSU AS1763 'Livestock Water Requirements' (revised Feb 2026; table from NRC 2016) gives gal/head/day by class and temperature. For example, Lactating 900 lb is 11.4 at 40 F, 16.9 at 70 F, 17.9 at 80 F, 16.2 at 90 F, and Growing 600 lb is 12.7 at 90 F. The page's extraction left the pregnant-cow columns unclear. Re-running context.research.mjs printed 'water.csv carries level_pct only, so gallons on hand = level_pct x capacity is NOT computable from repo data'. With an ASSUMED 10,000 gal tank it printed 'Cows @70F (lactating 900 lb row): 180 head x 16.9 = 3042 gal/day; tank 40% ... -> 1.31 days with zero refill'. NDMC Plan page: 'Upgrading or adding stock water tanks can improve grazing distribution and livestock health during drought.'

**Corrections from the citation checks.**

- 'Use the 90F column (conservative)' is wrong for lactating cows: AS1763 gives 17.9 gal at 80F but 16.2 at 90F (G2060 gives 18.2).
- 'Intake roughly doubles from 40F to 90F' holds for growing, finishing and bull classes (about 2.4x) but not for lactating cows (about 1.4-1.6x), the demo's largest group.
- SDSU hauling page: the 0.66-1 gal per lb dry matter figure is DiCostanzo's and refers to feedlot cattle.

**Limitations.** [water research rule 5] The tables are old (1956 data underlie NRC). The 90F lactating value differs between the two published tables: NDSU AS1763 gives 16.2 (lower than its 80F value of 17.9) and UNL G2060 gives 18.2. The citation checker confirmed both, and the citation critic re-read AS1763 on 2026-10-16 (80F 17.9, 90F 16.2). Moist forage lowers drinking, and humidity, solar load and salt raise it. Calves' share is uncertain. This gives an estimate, not a measurement. | [context research rule 10] Table values are estimates (the lactating row is not monotonic). Intake also varies with forage moisture and water quality (AS1764). Refill rate dominates for float-fed tanks. The 10,000 gal capacity is an assumption, not repo data.

**Configurable?** [water research rule 5] Yes. Intake table, temperature source, margin and response time should all be settings. | [context research rule 10] Yes. The alert threshold in days is C (ranch choice). Intake by class/temp is B, from a table. Current % thresholds are D (synthetic demo).

**Missing data that should block a confident conclusion.** [water research rule 5] Do not compute or show hours-of-water when capacity or head is missing. Show 'capacity unknown' and fall back to a visual-check task. If no temperature is available, use the highest value in the class's row and label it an assumed hot-day figure (for lactating cows in AS1763 that is the 80F value, 17.9 gal, not the 90F value). | [context research rule 10] No capacity or refill data: show % only and state 'days of supply unavailable'. Never compute days from % alone.

**Recommendation.** [water research rule 5] Adopt as the primary water severity driver once capacity and head are recorded. Show the assumptions (capacity, head, temperature, intake column) beside each estimate. | [context research rule 10] Add capacity_gal and supply_type/refill_gph to a tanks table. Keep % thresholds labelled as demo settings until then.

**Phase 3 (Add later).** Phase-3 item 'water supply coverage from capacity and head'. Needs tanks.capacity_gal, usable fraction, supply type and an intake lookup. Without them the page keeps the labelled % rules.

**Related.** Related findings (cross-reference made for this document): [WAT-06](02-findings.md#wat-06).

**Sources.**

*Independent sources:*

- NDSU Extension, "Livestock Water Requirements (AS1763)" (published 2021-03 (revision); data years Table adapted from NRC Nutrient Requirements of Beef Cattle, 8th rev. ed., updated 2016; extension). Checker: **verified**. <https://www.ndsu.edu/agriculture/sites/default/files/2024-04/as1763.pdf>
  - Supports: Table 1: gal/head/day by class, weight and temperature (40-90F). Intake rises with weight, pregnancy, lactation and temperature.
  - Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): Table 1, lactating cows 900 lb 11.4/12.6/14.5/16.9/17.9/16.2 gal/head/day at 40-90F; growing 600 lb 5.3 to 12.7. 'Revised March 2021'; adapted from NRC 2016. Confirmed; 90F is not the highest lactating value.
- University of Nebraska-Lincoln Extension, "Water Requirements for Beef Cattle (G2060)" (published 2011-03; data years Adapted from NRC 1996, derived from Winchester and Morris 1956; extension). Checker: **verified**. <https://extensionpubs.unl.edu/publication/g2060/2011/pdf/view/g2060-2011.pdf>
  - Supports: Same table with column headers (growing, finishing, wintering cows, lactating 900+ lb, mature bulls 1,400 and 1,600+ lb). Intake is constant up to 40F.
- Kansas State University Research and Extension, "Estimating Water Requirements for Mature Beef Cows (MF3303)" (published 2016-12; data years Equations from published literature: Murphy 1983, Hicks 1988, Meyer 2006, Winchester and Morris 1956, NRC 2000; extension). Checker: **verified**. <https://bookstore.ksre.ksu.edu/download/estimating-water-requirements-for-mature-beef-cows_MF3303>
  - Supports: Table 2: 1,100-1,500 lb cows at 0-35 lb milk, 40/65/90F. 0.85 lb (about 0.1 gal) more per F above 40F. 0.9 lb water per lb milk.
- Oklahoma State University Extension, "Estimating Water Requirements for Mature Beef Cows (AFS-3299)" (published 2017-07-01; data years Same underlying studies; notes NRC (2000) relies on 1956 data; extension). Checker: **verified**. <https://extension.okstate.edu/fact-sheets/estimating-water-requirements-for-mature-beef-cows.html>
  - Supports: Identifies the data age and the gap for cows over 1,100 lb. Free water intake can be 'substantially lower' on moist feed.
- Nebraska Extension BeefWatch (Walz and Berger), "How much water do cattle need and what water problems should cattle producers watch for?" (page dated 2025-04-30 (URL path says 2023); data years n/a; extension). Checker: **verified**. <https://beef.unl.edu/beefwatch/2023/how-much-water-do-cattle-need-and-what-water-problems-should-cattle-producers-watch-0>
  - Supports: Lactating cows about 2 gal per 100 lb. Spring-calving cows 20-24 gal in heat plus 5-10 gal for the calf. Calves struggle if cows empty a tank that refills slowly.
- K-State Beef Tips (Justin Waggoner), "Water: Questions and Answers" (published 2018-04-30; data years n/a; extension). Checker: **verified**. <https://www.k-state.edu/news/beef-tips/articles/2018/04/water-questions-and-answers.html>
  - Supports: 1-2 gal per 100 lb. About 1 more gal per 10F above 40F. At least 15 in of trough space per head. At least 10% of animals drinking at once, 30% where travel is long.
- SDSU Extension (Taylor Grussing), "Hauling Water to Cows: When water is not everywhere" (published 2026-07-17 (updated); data years n/a; extension). Checker: **partly**. <https://extension.sdstate.edu/hauling-water-cows-when-water-not-everywhere>
  - Supports: 0.66-1 gal per lb DM above 75F (the article credits this to A. DiCostanzo, UNL, for 'a feedlot animal'; it is not a general cattle rule). Example: 100 pairs need 3,750 gal/day. Keep at least half of daily needs in stationary storage for hot days. An 8 ft tank holds 625 gal.
- National Academies of Sciences, Engineering, and Medicine (National Academies Press), "Nutrient Requirements of Beef Cattle: Eighth Revised Edition (Summary; Chapter 9 Water)" (published 2016; data years not reviewed; standard or specification). Checker: **verified**. <https://www.nationalacademies.org/read/19014/chapter/2>
  - Supports: The Summary says Chapter 9 'provides an update of equations to predict water intake' and covers water quality. I did not read Chapter 9 itself.
- NDSU Extension, "Livestock Water Requirements (AS1763)" (Revised 2026-02 (first published 2021-04-01); data years NRC 2016 table; extension). Checker: **verified**. <https://www.ndsu.edu/agriculture/extension/publications/livestock-water-requirements>
  - Supports: gal/head/day by class and temperature
- National Drought Mitigation Center, UNL, "Plan for Drought" (undated; data years n/a; extension). Checker: **partly**. <https://ranchdrought.unl.edu/Plan.aspx>
  - Supports: Water deficits as an early indicator; stock water tanks

<a id="rule-wat-09"></a>
##### RULE-WAT-09: Storage-days check for undependable supply

Status: proposed · Class **B** (context-dependent guidance) · Phase **3** (Add later) · 4 sources (4 verified; 0 vendor)

**Rule.** PROPOSED: storage-days check. For tanks on windmill, solar or otherwise undependable supply, compare storage (gal) with daily herd demand and flag when storage covers fewer than 3 days.

**Decision it supports.** Whether a tank system can ride out a calm or cloudy spell or a pump failure, which drives a haul plan or a move decision.

**Required inputs.** Storage capacity, supply type, herd daily demand (head x intake at a seasonal high), backup source and haul capacity.

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: Summer and drought. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Tanks on windmill, solar or other undependable supply.

**Classification: B (context-dependent guidance).** Kept at B on the checker's condition (water dispute 6): the 3-day figure is presented as a ranch-set target at the low end of NRCS 614's 'consider (3-5 days)' storage range (Colorado 614, archived: 4 days minimum for undependable sources). Those are design criteria, not alarm levels.

**Evidence (research conclusion).** NRCS 614 national (2023): with windmill, solar or other unreliable power, 'consider supplying additional daily water storage volume (3-5 days)', or a battery backup or alternate source. Colorado 614 (2015, archived): minimum 4 days of storage for windmill or undependable sources. Frequently inspected tanks with adequate supply need at least 10% of the daily requirement. Bartlett (GLBGN/MSU, undated): solar storage of at least 3 days without pumping, compressed-air windmill 5-7 days. NRCS Illinois (2004): solar systems typically store up to 5 days.

**Limitations.** These are design criteria, not alarm levels, and state FOTG versions differ. I did not find a South Dakota, North Dakota or Nebraska 614 version (Nebraska showed only a CPPE file in search results, which I did not fetch).

**Configurable?** Yes. Days target per supply type.

**Missing data that should block a confident conclusion.** No supply type or capacity means no check. Show it as a setup gap.

**Recommendation.** Add as a planning tile (days of storage at current head and forecast heat) rather than a real-time alarm.

**Phase 3 (Add later).** Belongs to the phase-3 item 'water supply coverage from capacity and head'. Needs storage capacity, supply type and head present.

**Sources.**

*Independent sources:*

- USDA NRCS, "Watering Facility (Code 614) Conservation Practice Standard" (published 2023-08; data years n/a; standard or specification). Checker: **verified**. <https://www.nrcs.usda.gov/sites/default/files/2023-08/614_NHCP_CPS_Watering_Facility_2023.pdf>
  - Supports: 3-5 days of extra storage to consider for windmill or solar. Storage must provide water between replenishments.
  - Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): 'When windmill, solar, or other potentially unreliable power sources are used, consider supplying additional daily water storage volume (3–5 days)' (Considerations; 'consider', not 'shall'). O&M: 'Check for leaks' and 'Checking the performance of the automatic water level device, if present.' August 2023. Confirmed.
- USDA NRCS Colorado, "Conservation Practice Standard Watering Facility (614), Colorado" (published 2015-10 (marked ARCHIVED); data years n/a; standard or specification). Checker: **verified**. <https://efotg.sc.egov.usda.gov/api/CPSFile/3900/614_CO_CPS_Watering_Facility_2015>
  - Supports: Minimum 4 days of storage for undependable sources. 10% of daily requirement for frequently inspected tanks with adequate supply. Automatic controls keep water 2 in below the rim.
- Great Lakes Basin Grazing Network / Michigan State University Extension, "Watering Systems for Grazing Livestock (Ben Bartlett)" (undated; data years n/a; extension). Checker: **verified**. <https://www.uvm.edu/d10-files/documents/2024-10/watering_systems_for_grazing_livestock.pdf>
  - Supports: Solar storage of at least 3 days, windmill 5-7 days, gravity reservoir 3-7 days. Pumps should run about 4 h/day (12 h max). Design for double the intake.
- USDA NRCS Illinois (Illinois Grazing Manual fact sheet), "Water Resources Development for Managing Intensive Grazing of Beef" (published 2004; data years n/a; government agency). Checker: **verified**. <https://www.nrcs.usda.gov/sites/default/files/2022-12/Water-Res-Dev-for-Managing-Intens-Grazing-Beef.pdf>
  - Supports: Solar systems store up to 5 days. Beef needs run from about 9 gal per 1,000 lb in winter to nearly 30 in hot summer. Full-flow floats deliver up to 20 gpm, cheap floats 2-3 gpm.

#### Addition 2: forage observations at moves

<a id="rule-grz-05"></a>
##### RULE-GRZ-05: Forage observation at move-out and before re-entry

Status: proposed · Class **C** (ranch-specific management choice) · Phase **3** (Add later) · 4 sources (4 verified; 0 vendor)

**Rule.** PROPOSED: record a forage observation (residual height or utilization estimate, regrowth or recovery note, photo point) at move-out and before re-entry, and warn when an occupied pasture has had no forage check within a ranch-set number of days. Use it alongside min_rest_days; satellite or forecast products do not replace it.

**Decision it supports.** [grazing research rule 10] Schedule a pasture walk so that the move decision rests on an observation. | [context research rule 11] Whether a pasture is ready to graze again and whether planned graze days held

**Required inputs.** [grazing research rule 10] Date of the latest forage observation per pasture; occupancy from moves.csv; N in RULES. | [context research rule 11] obs_date, pasture_id, observer, residual/utilization, recovery_ready, photo id

**Where it applies.** Cattle class: Any grazing group. Season: In season, at each move-out and before each re-entry. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Rotational grazing on 8 pastures with a planned stay length per pasture; manual forage checks.

**Classification: C (ranch-specific management choice).** Unchanged (both research rules C). The check interval and what counts as a check are ranch choices (the demo's N=7 is a placeholder).

**Evidence (research conclusion).** [grazing research rule 10] SDSU MC-04340: 'Monitor regularly. Short, consistent checks outperform occasional, detailed assessments.' Derner et al. 2022: CARM read residual before entry, weekly during occupancy, and at exit. NDSU R1780: measure during the grazing period and within 3 days of removal. N itself has no universal value. | [context research rule 11] Public products cannot replace field observation at pasture scale. Grass-Cast uses 10 km cells and 'cannot tell the difference between desirable forage species and undesirable species'. Its developers note total production differs from grazable production (worked example: take half, half trampled, about 25% usable). RAP gives no current-year data through its API. NDSU R1780 (Grazing Monitoring Stick) could not be fetched in this pass (CLIENT_ERROR), so I do not quote its recovery periods here.

**Limitations.** [grazing research rule 10] Adds a data-entry burden; N is a ranch choice. | [context research rule 11] The method (stick height, utilization class, photo) is a ranch choice, and observer variation is real.

**Configurable?** [grazing research rule 10] Yes (RULES). | [context research rule 11] yes

**Missing data that should block a confident conclusion.** [grazing research rule 10] This rule IS the missing-data behaviour. The dashboard must not show an occupied pasture as fine when there is no observation. | [context research rule 11] No observation within N days before a planned move-in: show 'recovery not checked', not 'ready'.

**Recommendation.** [grazing research rule 10] Add it together with the stubble rule. Suggested demo setting: N = 7 days, labelled as a synthetic setting. | [context research rule 11] Adopt as a manual-observation CSV. It is the cheapest, most credible forage signal for a portfolio dashboard.

**Phase 3 (Add later).** Phase-3 item 'forage observations at moves'. Needs a forage_obs.csv; missing observations show 'recovery not checked', never 'OK'.

**Sources.**

*Independent sources:*

- SDSU Extension, "Designing a Grazing Plan That Guides Decisions (MC-04340)" (undated ((c) 2026; URL folder 2026-07); data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/sites/default/files/2026-07/MC-04340.pdf>
  - Supports: Short, consistent monitoring; records of rotation dates, cattle behaviour, forage conditions and rainfall.
- NDSU Extension, "The North Dakota Grazing Monitoring Stick (R1780)" (Revised October 2024; data years n/a; extension). Checker: **verified**. <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/R1780%20The%20North%20Dakota%20Grazing%20Monitoring%20Stick%20%281%29.pdf>
  - Supports: When to measure: before turnout, during grazing, within 3 days of removal.

*Product documentation (an agency or university describing its own product; not independent validation):*

- Grass-Cast / NDMC, "Examples of Total Production vs Grazing Production" (undated; data years n/a). Checker: **verified**. <https://grasscast.unl.edu/docs/Examples-of-Total-Production-vs-Grazing-Production.pdf>
  - Supports: Total vs grazable production; take-half example
- NDMC and partners, "About Our Maps (Grass-Cast)" (undated; data years n/a). Checker: **verified**. <https://grasscast.unl.edu/Outlook/About.aspx>
  - Supports: 10 km cells; cannot distinguish desirable species

<a id="rule-grz-06"></a>
##### RULE-GRZ-06: Key-species residual (stubble or utilization) check

Status: proposed · Class **B** (context-dependent guidance) · Phase **3** (Add later) · 6 sources (3 verified, 3 partly; 0 vendor)

**Rule.** PROPOSED: key-species residual check during and at the end of each stay. Use stubble height (warning near the ranch's target; serious below it with cattle still in) or, as an alternative or companion, utilization (% of current-year growth removed by weight) per grazing period and per season.

**Decision it supports.** [grazing research rule 4] Move now, or not yet. This replaces elapsed days as the main move trigger. | [grazing research rule 5] Whether a stay or a season's use stayed within the plan, and whether the stocking rate needs adjusting next season.

**Required inputs.** [grazing research rule 4] Per pasture: key species and a target residual height (inches). Observations: date, pasture, species, mean height, number of readings (NDSU recommends at least 30 per key species), observer, and optionally the ungrazed reference height. | [grazing research rule 5] Utilization estimate per pasture and key species, with the method (grazing stick height-weight, ocular, paired plot), date, and whether it is temporal (one period) or seasonal.

**Where it applies.** Cattle class: Any grazing group. Season: In season. Geography: Northern Plains native range and tame pasture; targets depend on key species and ecological site. Management: Rotational grazing on 8 pastures with a planned stay length per pasture; grazing-stick or ocular residual measurements.

**Classification: B (context-dependent guidance).** Unchanged (both research rules B). Targets come from state NRCS technical notes and extension protocols and must be set per pasture.

**Evidence (research conclusion).** [grazing research rule 4] SD TN9 Table 3 (stubble minimums and start heights, e.g. begin western wheatgrass at 6-10 in). NDSU R1780: measure before turnout, during the grazing period 'to prevent overuse', and within 3 days of livestock removal; at least 30 measurements per key species; avoid water, salt and gates; percent removal = [1 - grazed/ungrazed height] x 100; height-weight table, e.g. 75% height removal on western wheatgrass is about 58% by weight. UNL G1908 moves on a stubble target. Interagency TR 1734-3: residual measurement 'may be preferable' to utilization because remaining plant material drives regrowth. Derner et al. 2022: CARM moves on residual-biomass thresholds (visual obstruction) read before entry, weekly, and at exit. OBSERVED: the repo has no stubble, residual or forage observation field at all. | [grazing research rule 5] SD TN9 p.4 quotes: seasonal '...should not remove more than 50 percent by weight of the total current year's growth.' Temporal '...should not remove more than 30 percent by weight...'. NDSU R1810: 'Harvest efficiency includes the "take half, leave half" concept of forage disappearance within the pasture' (25% harvest efficiency for season-long native range). SD Grassland Coalition Range 101 (May 2021): 50% utilization under continuous season-long use gave about 25% harvest efficiency, with 29% lost to trampling, wildlife, insects and senescence. TR 1734-3: seasonal values 'cannot simply be added together' because of regrowth; utilization should not be used alone to set stocking rates.

**Corrections from the citation checks.**

- UNL G1908 covers native warm-season grasses, not tame pasture.
- Use ceilings differ: SD TN9 caps seasonal use at 50% and temporal use at 30%, while NDSU R1780 suggests about 50% per grazing period.

**Limitations.** [grazing research rule 4] The targets are site-, species- and season-specific, and some are pasture rather than range values. A reading is only as good as the sampling (key areas, enough readings). Stubble says nothing about weight removed without species height-weight curves. | [grazing research rule 5] 'Take half, leave half' is a rule of thumb for season-long native range, not a per-stay target. For multiple grazings the temporal ceiling is lower (30%). Ocular estimates vary between observers. Utilization measured mid-season is confounded by regrowth.

**Configurable?** [grazing research rule 4] Yes. Key species and target height must be per pasture and set by the ranch, with defaults from the state NRCS FOTG. | [grazing research rule 5] Yes. Temporal and seasonal ceilings per pasture.

**Missing data that should block a confident conclusion.** [grazing research rule 4] No reading during an occupied stay: do not say 'OK'. Show 'no forage check since &lt;date>' (see the stale-observation rule). Fewer readings than the ranch's minimum: show the value as low confidence and do not escalate to serious. | [grazing research rule 5] No utilization or stubble data: the dashboard must not report 'within take-half-leave-half'.

**Recommendation.** [grazing research rule 4] Add forage_obs.csv and per-pasture key_species and target_stubble_in. This should become the main grazing trigger. Keep the day-count rule as a secondary 'past planned date' reason. Put the margin (e.g. within 1 in of target) in RULES as a ranch setting. | [grazing research rule 5] Offer utilization as an optional field next to stubble (one or the other per pasture, set by the ranch). Default warning when temporal use is above 30% or seasonal above 50%, marked as context-dependent defaults from SD TN9. Show the method used next to the value.

**Phase 3 (Add later).** Part of the phase-3 item 'forage observations at moves'. Needs pastures.key_species and target_stubble_in plus forage_obs readings.

**Sources.**

*Independent sources:*

- USDA NRCS South Dakota, "Prescribed Grazing, Range Technical Note No. 9 (Table 3)" (published April 2017; data years n/a; government agency). Checker: **partly**. <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf>
  - Supports: Minimum stubble heights at end of grazing by species, and start-grazing heights. Riparian residual 4-8 in (Section IV). | p.4 utilization limits: 50% seasonal, 30% temporal, 65% browse, 60% dormant-season grasses.
- NDSU Extension, "The North Dakota Grazing Monitoring Stick (R1780)" (Revised October 2024; data years n/a; extension). Checker: **verified**. <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/R1780%20The%20North%20Dakota%20Grazing%20Monitoring%20Stick%20%281%29.pdf>
  - Supports: Field protocol (timing, at least 30 readings per key species, avoid water/salt/gates), percent-removal formula, height-weight tables by species, start/end heights for introduced species. | Degree-of-use classes and the about-50%-by-weight general rule for key species.
- BLM, USDA Forest Service, USDA NRCS Grazing Land Technology Institute, Cooperative Extension Service (copy hosted by University of Arizona Extension), "Utilization Studies and Residual Measurements, Interagency Technical Reference 1734-3" (published 1996, revised 1997 and 1999; data years n/a; government agency). Checker: **verified**. <https://extension.arizona.edu/sites/extension.arizona.edu/files/attachment/utilstudies.pdf>
  - Supports: Definitions of utilization, residual measurement, key species and key area; residual may be preferable to utilization; utilization data should not be used alone; seasonal utilization cannot simply be summed; weather changes interpretation.
- Elsevier / Society for Range Management (USDA ARS-hosted PDF), "Adaptive grazing management in semiarid rangelands: An outcome-driven focus. Rangelands 44(1):111-118, doi:10.1016/j.rala.2021.02.004" (published 2022; data years case studies (CARM, Rancho Largo, Red Canyon); years not summarised; peer-reviewed). Checker: **partly**. <https://www.ars.usda.gov/ARSUserFiles/30123025/Publications/2022/Derner%20et%20al%202022%20Rangelands%20-%20adaptive%20grazing%20management%20for%20outcome-driven%20focus.pdf>
  - Supports: Residual-biomass thresholds (visual obstruction) read before entry, weekly, and at exit as move triggers. Red Canyon uses stubble height for riparian removal. 'Short-term observations and monitoring procedures should be simple, quick, and based on consistent methods'.
- NDSU Extension (Meehan, Sedivec, Printz, Brummer), "Determining Carrying Capacity and Stocking Rates for Range and Pasture in North Dakota (R1810)" (published November 2018; reviewed April 2024 (page modified January 16, 2025); data years n/a; extension). Checker: **verified**. <https://www.ndsu.edu/agriculture/ag-hub/publications/determining-carrying-capacity-and-stocking-rates-range-and-pasture-north-dakota>
  - Supports: Harvest efficiency 25% for season-long native range, 12.5% wet meadow, 30% tame; harvest efficiency includes 'take half, leave half'.
- South Dakota Grassland Coalition (Sandy Smart), "Range 101: Efficiencies of Rotational Grazing" (published May 2021 (byline); page timestamp October 26, 2023; data years cites an NDSU long-term comparison and a 1986 Nebraska report; years not given; other publisher). Checker: **partly**. <https://sdgrass.org/range-101-efficiencies-of-rotational-grazing/>
  - Supports: About 25% harvest efficiency at 50% utilization under continuous grazing (from Smart's 2010 REM paper, cited on the page; the 29% loss figure comes from a separate NDSU comparison). Planning values: 30% harvest efficiency for simple rotation and 40% for intensive rotation; 35% appears only in an eight-paddock example.

#### Addition 3: drought and precipitation context as a dated snapshot

<a id="rule-ctx-01"></a>
##### RULE-CTX-01: Choose public context by release time

Status: proposed · Class **A** (supported general guidance) · Phase **3** (Add later) · 5 sources (5 verified; 0 vendor)

**Rule.** PROPOSED: Choose public context by when it was released, not by the week it covers. Show the latest U.S. Drought Monitor (USDM) map that was public by as_of: released Thursday 08:30 ET, valid on the Tuesday two days earlier. Label it 'valid &lt;Tue>, released &lt;Thu>'. as_of must carry an offset or IANA time zone.

**Decision it supports.** Whether the drought context shown beside the ranch snapshot was actually knowable at as_of, so the page does not seem to know the future

**Required inputs.** as_of with time zone; USDM MapDate/ValidStart; official release schedule

**Where it applies.** Cattle class: Not animal-specific (regional public context). Season: Any; weekly or seasonal public products. Geography: The ranch's county (demo: a named stand-in county, labelled as such). Management: Dated build-time snapshot pinned to as_of; never live in the demo.

**Classification: A (supported general guidance).** Unchanged (research A; confirmed by the checker).

**Evidence (research conclusion).** OBSERVED: the USDM home page states 'The data cutoff for Drought Monitor maps is each Tuesday at 8 a.m. EDT' and maps 'are released each Thursday at 8:30 a.m. Eastern Time'. It showed map released Oct 15 2026, data valid Oct 13 2026. The county data service for Hughes Co. SD returned rows such as '20260929,...,2026-09-29,2026-10-05,1' and '20260922,...,91.73,8.27,...,2026-09-22,2026-09-28,1'. I ran node docs/audit/diagnostics/context.usdm-asof.research.mjs and it printed 'naive (ValidStart &lt;= as_of &lt;= ValidEnd): MapDate 20260929 (None 68.45%, D0 31.55%...) &lt;- released 2026-10-01 08:30 ET, AFTER as_of' versus 'release-aware (released by as_of): MapDate 20260922 (None 91.73%, D0 8.27%...)' for both America/Chicago and America/Denver. The existing docs/audit/diagnostics/context.research.mjs, which I re-ran, printed 'valid date is 8.5 days old at as_of' and 'USDM valid-date age seen by a viewer ranges from 2.02 to 9.02 days'.

**Limitations.** Federal-holiday shifts are not modelled. The cutoff wording differs between official pages ('8 a.m. EDT' on USDM; '7 a.m. Eastern Time' on SD DANR and sdresponse.gov; '7 am Eastern'/'7 a.m. EST' on drought.gov). These agree only if read as 12:00 UTC. The ArcGIS layer stores MapDate/ReleaseDate as epoch values that convert to 07:30 UTC (3:30 a.m. ET on release day, before the real 08:30 release), so its times must be treated as date-only.

**Configurable?** Schedule: no, it is fixed by the publisher. Ranch time zone: yes, it must be set per ranch because SD and NE each span Central and Mountain time.

**Missing data that should block a confident conclusion.** If as_of has no offset or zone (true today: meta.csv holds '2026-09-30T18:00'), the page cannot decide confidently which map was public near Thursday morning. It should show 'time zone not set' and not pick silently.

**Recommendation.** Adopt. Store released_at and valid_date for every context row, and select rows by released_at &lt;= as_of. Add a time zone to meta.csv.

**Phase 3 (Add later).** Phase-3 item 'drought/precipitation context as a dated snapshot'. A naive lookup picks the 2026-09-29 map, released after as_of; the correct one is valid 2026-09-22.

**Sources.**

*Independent sources:*

- National Drought Mitigation Center, Univ. of Nebraska-Lincoln (with USDA, NOAA), "U.S. Drought Monitor home (Map released: October 15, 2026)" (published 2026-10-15 (map release shown); data years 2026; government agency). Checker: **verified**. <https://droughtmonitor.unl.edu/?stream=top>
  - Supports: Tuesday 8 a.m. EDT data cutoff; Thursday 8:30 a.m. ET release; latest valid date Oct 13 2026
  - Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): maps 'are released each Thursday at 8:30 a.m. Eastern Time'; 'The data cutoff for Drought Monitor maps is each Tuesday at 8 a.m. EDT'; map released Oct 15 2026, data valid Oct 13 2026. Confirmed.
- National Drought Mitigation Center, "USDM county statistics, Hughes County SD (API response)" (undated (live response fetched 2026-10-16); data years 2026-09-01 to 2026-10-13; government agency). Checker: **verified**. <https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=46065&startdate=9/1/2026&enddate=10/15/2026&statisticsType=1>
  - Supports: MapDate/ValidStart/ValidEnd semantics; rows used in the as_of selection diagnostic
- NOAA NIDIS (drought.gov), "National Current Conditions" (undated (shows Data Valid 10/13/26); data years 2026; government agency). Checker: **verified**. <https://www.drought.gov/drought/data-maps-tools/current-conditions>
  - Supports: 'released every Thursday morning, with data valid through Tuesday at 7 am Eastern'
- South Dakota Department of Agriculture and Natural Resources, "Drought Information" (undated; data years n/a; government agency). Checker: **verified**. <https://danr.sd.gov/AboutDANR/drought.aspx>
  - Supports: 'The data cutoff for Drought Monitor maps is Tuesday at 7 a.m. Eastern Time' (wording differs from USDM site)
- NDMC via ArcGIS Online, "USDM current (ArcGIS FeatureServer layer 0) and query" (Layer page 'Last Edit Date 10/1/2026'; features show MapDate 2026-10-13; data years 2026; government agency). Checker: **verified**. <https://services5.arcgis.com/0OTVzJS4K09zlixn/ArcGIS/rest/services/USDM_current/FeatureServer/0>
  - Supports: Epoch timestamps 1791876600000 (=2026-10-13T07:30Z) and ReleaseDate 2026-10-15T07:30Z; the layer's last-edit date is not a freshness signal

<a id="rule-ctx-02"></a>
##### RULE-CTX-02: Mark drought context stale after about 9 days

Status: proposed · Class **C** (ranch-specific management choice) · Phase **3** (Add later) · 2 sources (2 verified; 0 vendor)

**Rule.** PROPOSED: Mark the drought context stale when (as_of minus USDM valid date) is more than about 9.1 days, meaning a weekly release was missed or the fetch failed. Never read a missing or failed fetch as 'no drought'.

**Decision it supports.** Whether the drought panel can be trusted this week

**Required inputs.** USDM valid date; as_of with time zone; fetch/retrieval timestamp

**Where it applies.** Cattle class: Not animal-specific (regional public context). Season: Any; weekly or seasonal public products. Geography: The ranch's county (demo: a named stand-in county, labelled as such). Management: Dated build-time snapshot pinned to as_of; never live in the demo.

**Classification: C (ranch-specific management choice).** CHANGED from A. Checker context dispute 0: 'a missing or failed fetch is never no drought' is A, but the 9.1-day figure is the research's own derivation from the normal Tuesday-to-Thursday schedule and would wrongly trip on a holiday-delayed release. The checker proposed B or C; the stricter C is applied to the numeric threshold, which must be configurable with a holiday allowance.

**Evidence (research conclusion).** Derived from the published weekly schedule. Diagnostic output: 'USDM valid-date age seen by a viewer ranges from 2.02 to 9.02 days (release lag + 7-day cycle)'. IEM and ArcGIS copies both showed the current week (IEM GeoJSON 'date': '2026-10-13'; ArcGIS MapDate 2026-10-13), but the ArcGIS layer page's 'Last Edit Date' read 10/1/2026. Freshness must therefore come from the feature dates, not service metadata.

**Limitations.** Holidays can delay a release. Mirror services (IEM, ArcGIS) can lag the primary, which I did not measure.

**Configurable?** Threshold derives from the schedule. A small allowance for holidays could be configurable.

**Missing data that should block a confident conclusion.** No valid date means the panel shows 'unavailable' with the last known valid date; it must not show a category.

**Recommendation.** Adopt alongside rule 1. Show the age in days next to the category.

**Phase 3 (Add later).** Part of the phase-3 drought snapshot.

**Sources.**

*Independent sources:*

- National Drought Mitigation Center, "U.S. Drought Monitor home" (published 2026-10-15 (map release shown); data years 2026; government agency). Checker: **verified**. <https://droughtmonitor.unl.edu/?stream=top>
  - Supports: Weekly cadence used to derive the 9-day staleness bound
  - Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): maps 'are released each Thursday at 8:30 a.m. Eastern Time'; 'The data cutoff for Drought Monitor maps is each Tuesday at 8 a.m. EDT'; map released Oct 15 2026, data valid Oct 13 2026. Confirmed.
- Iowa Environmental Mesonet, Iowa State University, "IEM Provided JSON-P Webservices" (undated (footer Copyright 2001-2026); data years n/a; other publisher). Checker: **verified**. <https://mesonet.agron.iastate.edu/json/>
  - Supports: Lists /geojson/usdm.py; 'provided as-is'; usdm.py response showed date 2026-10-13

<a id="rule-ctx-03"></a>
##### RULE-CTX-03: County drought mix and weeks at D2 or worse (information only)

Status: proposed · Class **B** (context-dependent guidance) · Phase **3** (Add later) · 2 sources (1 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: Show the county USDM category mix and a count of weeks at D2 or worse in the last 8 weeks as information only, with a link to FSA. Do not compute or claim program eligibility.

**Decision it supports.** Awareness that drought designation may trigger FSA Livestock Forage Disaster Program paperwork, and drought-plan escalation

**Required inputs.** Ranch county FIPS; weekly USDM % area by category for that county

**Where it applies.** Cattle class: Not animal-specific (regional public context). Season: Any; weekly or seasonal public products. Geography: The ranch's county (demo: a named stand-in county, labelled as such). Management: Dated build-time snapshot pinned to as_of; never live in the demo.

**Classification: B (context-dependent guidance).** Unchanged (research B). Information only; never compute or claim program eligibility.

**Evidence (research conclusion).** The FSA LFP page (fetched) says payments 'will now trigger after four consecutive weeks of qualifying severe drought'. It says 'D3 (Extreme Drought) at any time' qualifies for three monthly payments, and D4 for four weeks for five payments. It notes the thresholds changed and gives no effective date. The county service returns % of area in None/D0-D4 per week (observed for Hughes Co. SD).

**Corrections from the citation checks.**

- The USDM Web Service Info page does not mention thousands separators in area-mode CSV values.

**Limitations.** FSA rules change (the page itself says the old 8-week trigger is now 4 weeks). Eligibility is decided by FSA, not by a % area rule chosen in a dashboard. County % area does not say which part of the county the ranch is in.

**Configurable?** Yes. The rule for summarising a county (e.g., the worst category covering at least X% of area) is a ranch/dashboard choice, so X is C-class.

**Missing data that should block a confident conclusion.** No county FIPS, or a gap in the weekly series, means no week count. Show 'incomplete series'.

**Recommendation.** Adopt as a context panel with no severity colour tied to eligibility. Link to FSA for the authoritative rules.

**Phase 3 (Add later).** Part of the phase-3 drought snapshot; link to FSA rather than restating LFP rules.

**Sources.**

*Independent sources:*

- USDA Farm Service Agency, "Livestock Forage Disaster Program (LFP)" (undated; data years n/a; government agency). Checker: **verified**. <https://www.fsa.usda.gov/resources/programs/livestock-forage-disaster-program-lfp>
  - Supports: D2 4-consecutive-week trigger; D3/D4 payment tiers; thresholds recently changed
- National Drought Mitigation Center, "USDM Web Service Info" (undated (Copyright 2026); data years n/a; government agency). Checker: **partly**. <https://droughtmonitor.unl.edu/DmData/DataDownload/WebServiceInfo.aspx>
  - Supports: County/state/HUC statistics endpoints, CSV default, JSON via Accept header, no API key mentioned; consecutive-weeks endpoint exists

<a id="rule-ctx-10"></a>
##### RULE-CTX-10: Drought-plan review prompts from a rain gauge and public normals

Status: proposed · Class **C** (ranch-specific management choice) · Phase **3** (Add later) · 10 sources (8 verified, 2 partly; 0 vendor)

**Rule.** PROPOSED: drought-plan review prompts. Record the ranch rain gauge and compare 30/60/90-day totals with a public normal; show a dated drought context line (county USDM category, optionally the Grass-Cast outlook); and at ranch-chosen trigger dates (for example spring rainfall as % of normal by a set date) prompt the drought-plan review. These prompts feed the plan review; they do not create move exceptions.

**Decision it supports.** [context research rule 9] Whether to start the drought contingency steps (destock, buy feed, defer pastures) on schedule | [grazing research rule 8] Lengthen recovery periods, slow the rotation, destock in stages, or bring feed in early.

**Required inputs.** [context research rule 9] Daily ranch gauge precip (in); public precip/normal (PRISM, IEM, ACIS); ranch trigger dates and actions | [grazing research rule 8] Ranch rain gauge totals vs normal; USDM category for the county (weekly); Grass-Cast % change in production for the grid cell (about every 2 weeks during its season); optional RAP production history; ranch-defined trigger dates and actions.

**Where it applies.** Cattle class: All classes. Season: Growing season; April-June precipitation largely drives annual production. Geography: Northern and Central Great Plains. Management: Written drought plan with trigger dates; ranch rain gauge.

**Classification: C (ranch-specific management choice).** CHANGED for the grazing part. Context research rule 9 was C; grazing research rule 8 was B. The merged rule's trigger dates and thresholds are ranch-set, so the stricter class C applies; the context banner alone is B.

**Evidence (research conclusion).** [context research rule 9] The NDMC 'Managing Drought Risk on the Ranch' plan page recommends 'Setting dates on the calendar when specific conditions warrant action'. It says monitoring 'helps you decide when it is time to act' and advises finding 'the earliest possible indicators of pending forage or water deficits'. It gives no numeric thresholds. Its Monitor page: 'If you suspect you may not produce enough forage to meet your herd's needs this year, it's time to take action', and it lists USDM, CoCoRaHS, VegDRI and Grass-Cast. PRISM web-service doc (26 Mar 2025): daily grids are updated 'eight times before becoming stable', and data older than six months are stable. So recent public precipitation values change after the fact. | [grazing research rule 8] SDSU 'Reading the Range' (updated Apr 13, 2022): April, May and June precipitation strongly predicts annual forage production in the central and northern Great Plains. SD TN9 App. B phases: Phase I remove 10% of the herd in the first month if drought is impending; Phase II 20-40%; Phase III 30%+, combine herds. SDSU MC-04340 example trigger: 'If rainfall totals fall 30% below average by May 15, initiate a 15% destocking plan.' Grass-Cast (Hartman et al. 2020, Ecosphere): agreed with the MODIS category 69% of the time; confidence 'increased substantially by late May or early June'; 'does not differentiate between desirable forage species and undesirable species'; does not account for prior-year grazing. The Grass-Cast site warns not to use it as the sole basis for stocking, turnout or permit decisions. The Grass-Cast home page says: 'As of August 31, 2026, all relevant precipitation data have been observed for the 2026 Grass-Cast season.' UNL BeefWatch (Aug 1, 2026): 'windshield green is not the same as cow days'; slow the rotation and extend recovery when regrowth is limited.

**Limitations.** [context research rule 9] No threshold is evidence-backed in what I gathered; they are ranch choices. PRISM limits: a file downloaded twice in 24 h is blocked; commercial use prohibited without arrangement; zipped grids are not browser-friendly. I could not verify ACIS and NCEI CDO terms or token rules (ACIS docs page rendered empty; the CDO page did not state token or limits). | [grazing research rule 8] These are coarse (10-km grid or county), lagged and model-based. They cannot say whether a given pasture is ready. Trigger values are ranch choices.

**Configurable?** [context research rule 9] Yes. Trigger dates, % of normal, and actions are all ranch-defined. | [grazing research rule 8] Yes. Triggers and actions are ranch-defined.

**Missing data that should block a confident conclusion.** [context research rule 9] Gauge gaps longer than a few days should block a % of normal; show 'gauge record incomplete' and do not treat missing days as zero rain. | [grazing research rule 8] A stale feed (e.g. Grass-Cast off-season, USDM not updated) should be shown with its valid date and never read as 'normal'.

**Recommendation.** [context research rule 9] Adopt the ranch-gauge field and trigger-date checklist (cheap, credible). Treat public precip as optional build-time context with retrieved_at recorded. | [grazing research rule 8] Show as a context strip with source, valid date and caveat. Let the ranch configure a few drought triggers that create a 'review the grazing plan' task. Do not let regional products directly raise or lower pasture-level move severity.

**Phase 3 (Add later).** Phase-3 item 'drought/precipitation context as a dated snapshot'. Needs a rain_gauge record and drought_plan.trigger rows; public precipitation is optional build-time context with retrieved_at.

**Sources.**

*Independent sources:*

- National Drought Mitigation Center, UNL, "Plan for Drought (Managing Drought Risk on the Ranch)" (undated (Copyright 2026); data years n/a; extension). Checker: **partly**. <https://ranchdrought.unl.edu/Plan.aspx>
  - Supports: Calendar trigger dates; early indicators; stock water tanks
- National Drought Mitigation Center, UNL, "Monitor Drought and Forage on the Ranch" (undated; data years n/a; extension). Checker: **verified**. <https://ranchdrought.unl.edu/Monitor.aspx>
  - Supports: Tools listed (USDM, CoCoRaHS, VegDRI, Grass-Cast); act when forage shortfall suspected
- Ecological Society of America / Wiley (USDA ARS-hosted PDF), "Seasonal grassland productivity forecast for the U.S. Great Plains using Grass-Cast. Ecosphere 11(11): e03280, doi:10.1002/ecs2.3280" (published 2020; data years Daymet 1980-2016; GIMMS NDVI 1982-2015; MODIS evaluation 2000-2018; forecasts 2017-2018; peer-reviewed). Checker: **verified**. <https://ars.usda.gov/ARSUserFiles/52548/207.%20Hartman%20et%20al%202020%20Ecoshpere%20-%20seasonal%20grassland%20productivity%20forcast%20for%20Great%20Plains%20using%20Grass-Cast.pdf>
  - Supports: Method, skill (same category as MODIS 69% of the time), when it becomes reliable (late May/early June), and its limits (total production not forage; no management effects).
- SDSU Extension (Krista Ehlert; originally Jessalyn Bachler), "Reading the Range: Range readiness, grazing timing and drought considerations" (Updated April 13, 2022; data years cites Smart et al. 2020/2021; extension). Checker: **verified**. <https://extension.sdstate.edu/reading-range-range-readiness-grazing-timing-and-drought-considerations>
  - Supports: April-June precipitation predicts annual production; drought delays turnout; heavily overgrazed pastures may need up to a year to recover.
- Nebraska Extension / UNL BeefWatch (Beckman, Benjamin, Stephenson), "Green Is Not Always Growth: Nebraska Pasture Conditions After Late Rains" (published August 1, 2026; data years USDA NASS condition ratings, week ending July 20, 2026; extension). Checker: **verified**. <https://beef.unl.edu/green-not-always-growth-nebraska-pasture-conditions-after-late-rains/>
  - Supports: Green colour is not forage; walk pastures for height, leaf area, residual and regrowth; slow rotations and extend recovery when regrowth is limited; NE pasture and range 35% very poor and 33% poor on July 20, 2026.
- USDA NRCS South Dakota, "Prescribed Grazing, Range Technical Note No. 9 (Appendix B)" (published April 2017; data years n/a; government agency). Checker: **partly**. <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf>
  - Supports: Drought-phase triggers and staged herd reductions; weekly monitoring of soil moisture and plant growth in Phase II.

*Product documentation (an agency or university describing its own product; not independent validation):*

- PRISM Group, Oregon State University, "PRISM Gridded Climate Data - Downloads via Web Service" (published 2025-03-26; data years daily 1981-present; monthly 1895-present). Checker: **verified**. <https://www.prism.oregonstate.edu/documents/PRISM_downloads_web_service.pdf>
  - Supports: Revisions over 6 months; download limits; formats
- PRISM Group, Oregon State University, "Ordering High-Resolution PRISM Data" (undated (states 'As of March 2025'); data years n/a). Checker: **verified**. <https://prism.oregonstate.edu/orders>
  - Supports: 800 m free since March 2025; commercial use prohibited without arrangement
- National Drought Mitigation Center (UNL), with CSU, USDA and the University of Arizona, "Grass-Cast: About Our Maps" (undated (example maps dated April 29, 2019; footer (c) 2026); data years about 38-40 years of historical weather and vegetation data). Checker: **verified**. <https://grasscast.unl.edu/Outlook/About.aspx>
  - Supports: 10 x 10 km grid; updated every two weeks in the growing season; not species-specific; does not include local management; should not be the sole basis for stocking or turnout decisions.
- National Drought Mitigation Center (UNL), "Grass-Cast home page" (undated; states 'As of August 31, 2026, all relevant precipitation data have been observed for the 2026 Grass-Cast season.'; data years 2026 season). Checker: **verified**. <https://grasscast.unl.edu/>
  - Supports: The service ran in 2026; the season is final by end of August; estimates are Total Production, not Grazeable Production; 'Data CSV' download links are offered (not tested).

<a id="rule-ctx-15"></a>
##### RULE-CTX-15: Real public data next to the fictional ranch: pinned, labelled, committed

Status: proposed (demo setting) · Class **D** (synthetic demonstration setting) · Phase **3** (Add later) · 2 sources (2 verified; 0 vendor)

**Rule.** PROPOSED (demo setting): Any real public context shown next to the fictional ranch must be (a) pinned to the fictional as_of, not today's live data; (b) for a named real county chosen as a stand-in and labelled as such ('Public data: &lt;County>, &lt;State>; ranch data fictional'); and (c) committed as a snapshot so CI stays deterministic.

**Decision it supports.** Keeping the portfolio piece honest and reproducible

**Required inputs.** Stand-in county FIPS and state; as_of; snapshot file with source URL, valid date, released_at, retrieved_at

**Where it applies.** Cattle class: Not animal-specific (regional public context). Season: Any; weekly or seasonal public products. Geography: The ranch's county (demo: a named stand-in county, labelled as such). Management: Dated build-time snapshot pinned to as_of; never live in the demo.

**Classification: D (synthetic demonstration setting).** Unchanged (research D).

**Evidence (research conclusion).** Observed: meta.csv as_of is 2026-09-30T18:00, while live sources fetched on 2026-10-16 already show USDM valid 2026-10-13 and a finished 2026 Grass-Cast season (as of Aug 31). Live fetches would therefore show a different week from the ranch data. CI (per task context) regenerates data with a fixed seed; a live fetch in CI would make tests depend on the network. Pasture P3 is named 'Sand Hills', which suggests Nebraska, but no location field exists (context.research.mjs printed 'ABSENT ranch location (lat/lon, county FIPS, or state)' and 'ABSENT ranch timezone').

**Limitations.** The choice of stand-in county is arbitrary; picking a real county must not imply a real ranch.

**Configurable?** yes (stand-in county)

**Missing data that should block a confident conclusion.** No stand-in county set: hide all public context panels.

**Recommendation.** Adopt if context is added at all. Use a separate scheduled or manual 'refresh-context' workflow, never the test workflow.

**Phase 3 (Add later).** Applies to every phase-3 public-context item: pin to the fictional as_of, label the stand-in county, and show it as a dated snapshot.

**Sources.**

*Independent sources:*

- National Drought Mitigation Center, "USDM county statistics (live response)" (undated (fetched 2026-10-16); data years 2026; government agency). Checker: **verified**. <https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=46065&startdate=9/1/2026&enddate=10/15/2026&statisticsType=1>
  - Supports: Historical weeks around as_of can be retrieved after the fact, so pinning is feasible
- National Drought Mitigation Center, "USDM permission / attribution" (undated (Copyright 2026); data years n/a; government agency). Checker: **verified**. <https://droughtmonitor.unl.edu/About/Permission.aspx>
  - Supports: Requested attribution wording when reproducing the USDM map: 'Map courtesy of NDMC' (maps only; the page says nothing about tabular statistics)

<a id="rule-ctx-16"></a>
##### RULE-CTX-16: Do not redistribute SD Mesonet data

Status: proposed (data-source rule) · Class **A** (supported general guidance) · Phase **3** (Add later) · 2 sources (1 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED (data-source rule): Do not commit or redistribute SD Mesonet data in a public repository or site. Link to the Mesonet pages instead.

**Decision it supports.** Licensing compliance for a public portfolio site

**Required inputs.** none

**Where it applies.** Cattle class: Not animal-specific (regional public context). Season: Any; weekly or seasonal public products. Geography: The ranch's county (demo: a named stand-in county, labelled as such). Management: Dated build-time snapshot pinned to as_of; never live in the demo.

**Classification: A (supported general guidance).** Unchanged (research A; confirmed by the checker: the SD Mesonet request page says redistribution and commercial use are not allowed).

**Evidence (research conclusion).** SD Mesonet daily request page: 'Redistribution of these data is not allowed.' 'Commercial use of these data is not allowed.' 'Data from the automated data request system are provisional.' 'not quality-controlled and is not intended for legal or research purposes.' Attribution required. Delivered as CSV by web form; no API described.

**Limitations.** I did not read the separate Terms of Use page. Nebraska Mesonet's data access page reads 'Coming Soon' (nemesonet.unl.edu/coming-soon per the checker, not the cited article; no API). NDAWN terms were not verified (robots-blocked).

**Configurable?** no

**Missing data that should block a confident conclusion.** n/a

**Recommendation.** Adopt. Prefer USDM, NWS and IEM-hosted public-domain or open sources for anything stored in the repo.

**Phase 3 (Add later).** A constraint on the phase-3 precipitation snapshot: link to SD Mesonet, never commit its data.

**Sources.**

*Independent sources:*

- South Dakota Mesonet, South Dakota State University, "Daily Data Request" (undated; data years 2015-2026 selectable; extension). Checker: **partly**. <https://climate.sdstate.edu/request/daily/>
  - Supports: Redistribution and commercial use prohibited; provisional data; CSV via form
- Nebraska Mesonet, UNL School of Natural Resources, "Nebraska Mesonet - Coming Soon" (undated (Copyright 2026); data years n/a; extension). Checker: **verified**. <https://nemesonet.unl.edu/coming-soon>
  - Supports: Data Access page not yet available; no API described

### 3.4 Deferred or excluded

These rules need data, modules or integrations outside the three phases (for example breeding records, shared crew records, live feeds or lab results), or they are exclusions recorded so they are not reintroduced. Each entry says why.

#### Deferred: Water

<a id="rule-wat-08"></a>
##### RULE-WAT-08: Leak and stuck-float screen

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 3 sources (2 verified, 1 partly; 1 vendor)

**Rule.** PROPOSED: leak and stuck-float screen. (a) Unexplained fall = observed fall minus expected consumption, over a window of at least two reporting intervals. (b) Any sustained fall in a pasture with no cattle. (c) A float-fed tank that fails to recover within its expected refill time. (d) A float stuck open or overflowing cannot be seen in level data, so add a flow-meter or visual check.

**Decision it supports.** Whether to send someone for a supply fault instead of a consumption problem.

**Required inputs.** Level series, capacity, head and class present, intake table, tank type (float-fed vs storage), pump schedule or supply type, optional flow meter (gal/day).

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: Grazing season (demo: 2026-06-01 to 2026-09-30; snapshot as_of 2026-09-30T18:00). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Remote level sensors on stock tanks (demo: 8 tanks, one tank per pasture, a reading every 6 h); float-fed and storage tanks.

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker water dispute 0: no cited source proposes or validates an 'observed fall minus expected consumption' detector. NRCS 614 says only 'check for leaks'; Bartlett and NRCS Missouri cover float sizing and refill; Tobin et al. detected water-system failure from cattle GPS and accelerometers, not tank level. The researcher found no validation study.

**Evidence (research conclusion).** NRCS 614 (2023) puts leak and float-performance checks in operation and maintenance. Bartlett (2006): tanks refill in an hour or less, with full-flow floats. The NRCS Missouri guide recommends full-flow floats and says small clamp-on floats 'do not refill tanks rapidly enough'. Diagnostic section 3 shows normal pump-off drawdown can exceed 30 pts/day (Cows on 10,000 gal: 49 pts/day), so a fixed point threshold cannot separate leak from use. Ranchbot (vendor) offers rapid-drop alerts, and its graphs give only Rising, Steady or Falling trend labels plus projections; it describes no leak signature. Farmbot's graph article also describes no leak or stuck-float signature. I found no independent study that validates level-curve leak detection. Tobin, Bailey and Trotter (2021, Arizona, 2018-2019 data) simulated water failure and detected it from cattle GPS and accelerometer behaviour, not from tank level.

**Corrections from the citation checks.**

- NRCS Missouri 'Watering Systems for Serious Graziers' never mentions flow meters (it was cited for flow_meter_gal).
- Tobin et al.: 2021-07-19 is the repository posting date; the article is REM 77(1):9-16, accepted 2021-02-24.

**Limitations.** Consumption estimates carry roughly ±30% uncertainty (temperature, forage moisture, calves). 6-hourly data cannot resolve fast float-tank cycles. Evaporation and ice confuse readings.

**Configurable?** Yes. Window, tolerance band, and refill time per tank type.

**Missing data that should block a confident conclusion.** Without capacity and head, report 'fall larger than usual for this tank' (compare to the tank's own history) rather than 'leak'.

**Recommendation.** Use per-tank baselines (its own typical daily fall at similar head and temperature) plus expected consumption. Word the alert as 'unexplained drop' with check-float and check-line actions.

**Phase defer (Defer or exclude).** Needs the phase-3 demand estimate and validation on real tank data. In the meantime the bounded 24 h drop rule ([RULE-WAT-03](#rule-wat-03)) finds the demo leak.

**Sources.**

*Independent sources:*

- USDA NRCS Missouri, "Watering Systems for Serious Graziers" (published 2006-08; data years n/a; government agency). Checker: **partly**. <https://www.nrcs.usda.gov/sites/default/files/2023-06/Watering_Systems_for_Serious_Graziers.pdf>
  - Supports: Full-flow floats for rapid refill. Clamp-on floats refill too slowly. 1 gpm = 1,440 gal/day, enough for 50 pairs. Keep backup water sources. Check pipelines for leaks.
- Rangeland Ecology and Management 77:9-16 (Elsevier); record at CQUniversity repository, "Tracking and sensor-based detection of livestock water system failure: A case study simulation" (published 2021 (Rangeland Ecology & Management 77(1):9-16; accepted 2021-02-24; 2021-07-19 is the repository posting date); data years 2018-2019; peer-reviewed). Checker: **verified**. <https://acquire.cqu.edu.au/articles/journal_contribution/Tracking_and_sensor-based_detection_of_livestock_water_system_failure_A_case_study_simulation/15001191>
  - Supports: On a 1,096-ha Arizona pasture, water failure was simulated by panelling off the only drinker for 4 h. Movement intensity rose (P = 0.03) and cows stayed near the drinker (P = 0.01). GPS tracking could detect failure remotely. The full text at bioone.org was blocked; I read only the repository abstract.

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- Ranchbot Help Center (vendor), "Reading my water level data and graphs" (published 2023-09-20; data years n/a). Checker: **verified**. <https://intercom.help/ranchbot/en/articles/8388698-reading-my-water-level-data-and-graphs>
  - Supports: Units are in, gal or %. Current values are projections 'based on all previous data points, trend predictions'. No accuracy figure. No leak-pattern guidance.

<a id="rule-wat-10"></a>
##### RULE-WAT-10: Float-fed tank adequacy

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 3 sources (3 verified; 0 vendor)

**Rule.** PROPOSED: float-fed tank adequacy. Flag when design inflow cannot deliver the herd's daily need within about 4 h, or a tank holds less than 1/4 of daily need for group drinking, or refill takes more than 1 h.

**Decision it supports.** Whether a tank and float are sized for the group placed on it, checked before a move.

**Required inputs.** Inflow gpm (measured), tank capacity, head and intake, drinking-space length.

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: Summer peak demand. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Float-fed tanks on pipeline or well supply.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** Bartlett (2006): supply daily needs in 4 h or less of pumping. Group-drinking tanks hold at least 1/4 of daily need, with 5-10% of animals drinking at once. If refill takes more than 1 h, use a larger tank. K-State (2018): at least 10% of the herd at once, 30% where travel is long, 15 in per head. CSU (2021): windmill or solar pumps produce 2-4 gpm. Example from my diagnostic: Cows (180 pairs) need about 4,932 gal/day at 90F. At 3 gpm a supply makes 4,320 gal in 24 h, so it cannot keep up even running continuously (inference from cited figures).

**Limitations.** These are rules of thumb from Midwest and Great Lakes grazing guides. Herds on large Great Plains pastures that travel more than 900 ft drink as a group (Bartlett), which raises peak demand.

**Configurable?** Yes.

**Missing data that should block a confident conclusion.** Without a measured inflow, show 'inflow unknown' and do not assert adequacy.

**Recommendation.** Add a pre-move water adequacy check per pasture (tank plus supply versus incoming group).

**Phase defer (Defer or exclude).** An infrastructure design check that needs design_inflow_gpm and tank volume; not a daily exception.

**Sources.**

*Independent sources:*

- LPES Small Farms Fact Sheets / MidWest Plan Service, "The ABCs of Livestock Watering Systems (Ben Bartlett)" (published 2006 (copyright year); data years n/a; extension). Checker: **verified**. <https://extension.wvu.edu/files/d/102b1da9-9f1a-40d7-90ad-5de2cd6101a8/watering-systems-by-ben-bartlett.pdf>
  - Supports: Daily needs in 4 h or less of pumping. Tank at least 1/4 of daily need. 5-10% of the herd drinking at once. Refill in 1 h or less. Worked gpm examples.
- Colorado State University Extension, Golden Plains Area, "Calculating Water for Cattle" (published 2021-06-17; data years n/a; extension). Checker: **verified**. <https://goldenplains.extension.colostate.edu/wp-content/uploads/sites/56/2021/06/PR_CalculatingWaterforCattle.pdf>
  - Supports: Cattle drink 2-5 gal per visit. Cows lower the level, leaving calves short. Windmill or solar pumps give 2-4 gpm, home wells 3-6 gpm.
- K-State Beef Tips (Justin Waggoner), "Water: Questions and Answers" (published 2018-04-30; data years n/a; extension). Checker: **verified**. <https://www.k-state.edu/news/beef-tips/articles/2018/04/water-questions-and-answers.html>
  - Supports: 15 in of trough per head. 10% of the herd at once, 30% for long travel.

<a id="rule-wat-11"></a>
##### RULE-WAT-11: Water quality screening by TDS

Status: proposed · Class **A** (supported general guidance) · Phase **defer** (Defer or exclude) · 3 sources (2 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: water quality screening by TDS (field EC/TDS meter). Below 3,000 ppm is usually satisfactory. 3,000-5,000 ppm: watch young stock. 5,000-7,000 ppm: not for pregnant or lactating females. 7,000-10,000 ppm: do not use for pregnant or lactating cattle (the source's wording; it does not say 'avoid' for every class). Above 10,000 ppm: not suitable for livestock. If a screen reads above 4,500 ppm, schedule a lab test. Screen surface and shallow sources during drought.

**Decision it supports.** Scheduling a water test, and choosing which water source a class of cattle can use (observation and records, not diagnosis).

**Required inputs.** Source id and type (well, pond or dugout, pipeline), TDS or EC reading, date, method, class of cattle using the source, drought status.

**Where it applies.** Cattle class: All classes; young stock and pregnant or lactating females are the sensitive groups. Season: Drought and late summer, when salts concentrate. Geography: Northern Plains surface water and shallow wells. Management: Field EC/TDS meter screening with lab confirmation.

**Classification: A (supported general guidance).** Kept at A for the published TDS bands (NDSU AS1764; SDSU P-00212). Rule wording corrected per checker water dispute 5: AS1764's 7,000-10,000 ppm band says 'Do not use for pregnant or lactating ruminants or horses', not 'avoid'. The drought-screening trigger and the testing interval are ranch choices (C).

**Evidence (research conclusion).** The TDS bands agree across sources. NDSU AS1764 (rev. Jan 2026): under 3,000 ppm usually satisfactory, 5,000-7,000 not for pregnant or lactating, 7,000-10,000 do not use for pregnant or lactating ruminants, over 10,000 possible death. Send to a lab if TDS is over 4,500 or sulfate over 800 on screening. SDSU P-00212 (Nov 2023) gives matching bands. UNL G2060 (2011): 3,000 ppm or less usually satisfactory, 5,000 may cut performance about 10%.

**Corrections from the citation checks.**

- AS1764's lab trigger is 'TDS over 4,500 ppm and/or sulfates over 800 ppm'.

**Limitations.** Screening meters need calibration (NDSU WQ1923). TDS does not identify which ion is the problem.

**Configurable?** Partly. The bands are published; the testing interval is a ranch choice.

**Missing data that should block a confident conclusion.** No reading on record for a surface source in drought should show 'not screened this season', never 'OK'.

**Recommendation.** Add a water-quality log per source, a 'due for screening' task in drought or when a new source is used, and a lab-follow-up flag. No health conclusions.

**Phase defer (Defer or exclude).** Needs a water-quality test log; not one of the three phase-3 items. Observation, records and escalation only.

**Sources.**

*Independent sources:*

- NDSU Extension, "Livestock Water Quality (AS1764)" (published 2026-01 (revision); data years n/a; extension). Checker: **partly**. <https://info.ext.nodak.edu/agriculture/sites/default/files/2026-01/as1764%20%281%29.pdf>
  - Supports: TDS bands. Lab triggers (TDS over 4,500, sulfate over 800). Screening with an EC/TDS meter and sulfate strips. Salts concentrate as levels fall in drought.
- SDSU Extension, "Interpretation of Water Analysis for Livestock Suitability (P-00212)" (published 2023-11 (original 2004); data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/sites/default/files/2023-11/P-00212.pdf>
  - Supports: TDS, sulfate and nitrate-N interpretation bands. Field 'quick test' with an EC or TDS meter.
- University of Nebraska-Lincoln Extension, "Water Requirements for Beef Cattle (G2060)" (published 2011-03; data years n/a; extension). Checker: **verified**. <https://extensionpubs.unl.edu/publication/g2060/2011/pdf/view/g2060-2011.pdf>
  - Supports: TDS 3,000 ppm or less satisfactory. 5,000-7,000 not for pregnant or lactating. Nitrate-N under 100 safe, 100-300 questionable, over 300 unsafe.

<a id="rule-wat-12"></a>
##### RULE-WAT-12: Sulfate and nitrate screening flags

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 3 sources (2 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: sulfate and nitrate screening flags with class and diet context. Sulfate: calves under 500 ppm, adults under 1,000 ppm (UNL and NDSU text), but limits vary with diet. Nitrate under 100 ppm (AS1764 Table 3; the source does not say whether this is NO3 or NO3-N, so record which basis the lab reports; also count feed nitrate).

**Decision it supports.** Whether to schedule lab confirmation and which class may use a source (records only).

**Required inputs.** Lab or strip results, source, date, class using it, diet type (forage vs concentrate), feed nitrate test if any.

**Where it applies.** Cattle class: All classes; calves are more sensitive to sulfate. Season: Drought; diet-dependent. Geography: Northern Plains wells and surface water. Management: Lab water tests; feed sulfur and nitrate also count.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** The sources disagree on cut-offs. UNL G2060 and BeefWatch: calves under 500, adults under 1,000 ppm. NDSU AS1764 Table 2: under 600 ppm on more than 85% concentrate diets, under 2,500 ppm on more than 40% forage diets with dietary S at or below 0.5%. SDSU P-00212: under 1,500 ppm no harmful effects except mild diarrhea, 3,500-4,500 not for pregnant or lactating, over 4,500 not recommended. Total sulfur from feed plus water matters (SDSU: 0.4% DM).

**Corrections from the citation checks.**

- AS1764 does not say whether its nitrate figure is NO3 or NO3-N, so 'nitrate-N 100 ppm' is not explicit in that source.

**Limitations.** Diet and feed sulfur change the safe limit. A dashboard flag must not imply a diagnosis.

**Configurable?** Yes. Choose and cite one reference set.

**Missing data that should block a confident conclusion.** No diet or class means show the result and the reference ranges side by side without a pass or fail.

**Recommendation.** Show results against cited ranges and flag 'discuss with nutritionist or veterinarian' above the lower limit.

**Phase defer (Defer or exclude).** Needs lab results entered by hand. A flag must not imply a diagnosis.

**Sources.**

*Independent sources:*

- NDSU Extension, "Livestock Water Quality (AS1764)" (published 2026-01 (revision); data years n/a; extension). Checker: **partly**. <https://info.ext.nodak.edu/agriculture/sites/default/files/2026-01/as1764%20%281%29.pdf>
  - Supports: Diet-dependent sulfate limits. Nitrate 100 ppm, nitrite 33 ppm safe upper limits (NO3 vs NO3-N basis not stated).
- SDSU Extension, "Interpretation of Water Analysis for Livestock Suitability (P-00212)" (published 2023-11; data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/sites/default/files/2023-11/P-00212.pdf>
  - Supports: Sulfate bands up to over 4,500 ppm. Divide sulfate by 3 for sulfur.
- Nebraska Extension BeefWatch (Troy Walz), "Water Requirements for Beef Cattle" (published 2020-07-02; data years n/a; extension). Checker: **verified**. <https://beef.unl.edu/water-requirements-for-beef-cattle/>
  - Supports: Sulfate: calves under 500 ppm, adults under 1,000 ppm. Nitrate-N under 100 ppm.

<a id="rule-wat-13"></a>
##### RULE-WAT-13: Blue-green algae observation and escalation

Status: proposed · Class **A** (supported general guidance) · Phase **defer** (Defer or exclude) · 2 sources (2 verified; 0 vendor)

**Rule.** PROPOSED: blue-green algae (cyanobacteria) observation and escalation. If scum, blue, green, red or yellow colour, or wind-blown accumulation is seen on a pond, dugout or stagnant tank in hot, sunny, calm weather (late summer to early autumn), log it. Then move cattle to an alternate or windward water point, collect a 500 ml or larger sample (gloves; cool, not frozen), and contact a veterinarian. Do not move dead stock until a vet is consulted.

**Decision it supports.** Restricting access to a water source, and lab and vet escalation (observation only).

**Required inputs.** Source id and type, observation (none, suspect, bloom), photo, date, weather, cattle using the source, sample sent (y/n), lab, vet contacted.

**Where it applies.** Cattle class: All classes. Season: Hot, sunny, calm weather, late summer to early fall. Geography: Ponds, dugouts and stagnant tanks. Management: Visual observation with a fixed escalation path (restrict access, sample, call the veterinarian).

**Classification: A (supported general guidance).** Unchanged (research A).

**Evidence (research conclusion).** NDSU V1136 (rev. June 2026) and UNL BeefWatch (2021) agree. Blooms are fed by nitrogen and phosphorus with hot, sunny weather. Numbers can double in a day or less. Wind concentrates them on the downwind side. Presence 'does not mean the water is toxic'. Sample at least 500 ml from surface and depth, keep cool, wear gloves. Contact a veterinarian. Use alternate water and the windward side.

**Limitations.** Toxicity cannot be judged by eye. Lab turnaround matters. A level sensor gives no quality signal.

**Configurable?** Partly. Which sources are surface water, and lab contacts.

**Missing data that should block a confident conclusion.** Without a recent observation on a surface source in late summer, show 'not observed', not 'safe'.

**Recommendation.** Add as a manual observation type with a fixed escalation path (restrict access, sample, vet). Exclude treatment instructions.

**Phase defer (Defer or exclude).** Needs an observation log. Observation and escalation only; no treatment instructions.

**Sources.**

*Independent sources:*

- NDSU Extension, "Cyanobacteria Poisoning (Blue-green Algae) (V1136)" (published 2026-06 (revision; original 1997); data years n/a; extension). Checker: **verified**. <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/56136%20Cyanobacteria.pdf>
  - Supports: Bloom conditions, visual signs, sampling protocol, management actions, contact a veterinarian.
- Nebraska Extension BeefWatch (Amy Timmerman), "Blue-Green Algae Impacts on Cattle" (published 2021-07-07; data years n/a; extension). Checker: **verified**. <https://beef.unl.edu/beefwatch/2021/blue-green-algae-impacts-cattle>
  - Supports: Same observation and sampling guidance. Fence off downwind corners. Pump from depth into a tank.

<a id="rule-wat-14"></a>
##### RULE-WAT-14: Sensor trust band and calibration record

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 6 sources (5 verified, 1 partly; 5 vendor)

**Rule.** PROPOSED: sensor trust band and calibration record. Store each device's stated accuracy and the sensor offset or usable-bottom setting. Mark readings within the accuracy band of a threshold as 'near threshold, verify'. Do not re-judge history when the offset changes.

**Decision it supports.** How far to trust a reading before sending someone.

**Required inputs.** device_model, stated accuracy, offset_in and the date it was set, tank shape and dimensions.

**Where it applies.** Cattle class: Any cattle on the tank's pasture (demo groups: Cows 180 cow-calf pairs, Heifers 45 first-calf heifers, Yearlings 150 yearling steers). Season: All year. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Remote level sensors on stock tanks (demo: 8 tanks, one tank per pasture, a reading every 6 h); vendor-stated accuracy and offsets.

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker water dispute 1: the only numeric accuracy is LoneStar's vendor statement 'accurate to about 10%'; Ranchbot, Farmbot, MLA, USU and NMSU give none, and no independent accuracy trial was found. The 'near threshold, verify' band is a design choice.

**Evidence (research conclusion).** Vendor claims only. LoneStar says 'accurate to about 10%' (temperature, barometric pressure and sediment affect it). Ranchbot and Farmbot give no numeric accuracy and display projected values ('based on all previous data points, trend predictions'). The Ranchbot offset is 'not applied retrospectively'. Tank shape is needed to turn level into gallons (Ranchbot shape and volume article, 2024; Farmbot shows a dash for volume until total volume is entered). Independent evaluations I found report no accuracy metrics: USU (spikes, one faulty unit), MLA producer and vendor reports (no accuracy data), NMSU LoRaWAN test (no accuracy).

**Corrections from the citation checks.**

- MLA 2021 report: 'MLA has its own product interest' is not supported; MLA appears only as funder and publisher, and the report gives no accuracy or uptime data.
- Ranchbot's tank-shape settings offer no rectangular option.

**Limitations.** I found no independent accuracy trial for livestock tank sensors.

**Configurable?** Yes.

**Missing data that should block a confident conclusion.** With no accuracy on record, label readings as 'vendor accuracy unknown'.

**Recommendation.** Record device metadata. Show projected versus measured values distinctly if a vendor feed supplies projections.

**Phase defer (Defer or exclude).** Vendor-only evidence; revisit with real devices and a calibration record.

**Sources.**

*Independent sources:*

- Meat & Livestock Australia (producer Stanbroke), "Evaluation of on-farm sensing devices using mobile technology" (published 2022-08-30; data years not stated; field study or demonstration). Checker: **verified**. <https://www.mla.com.au/research-and-development/reports/2023/evaluation-of-on-farm-sensing-devices-using-mobile-technology/>
  - Supports: Producer-run trial of 16 devices at 2 locations. Interim business case of 'up to 60%' fewer manual water-point checks. No accuracy or reliability metrics.

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- LoneStar Tracking (vendor), "Water Tank Level Monitoring System" (undated (page footer (c) 2026); data years n/a). Checker: **verified**. <https://www.lonestartracking.com/?p=60249>
  - Supports: 'About 10%' accuracy claim. 15 ft hydrostatic sensor.
- Ranchbot Help Center (vendor), "How to set water tank shape and volume alerts" (published 2024-11-21; data years n/a). Checker: **verified**. <https://intercom.help/ranchbot/en/articles/10173097-how-to-set-water-tank-shape-and-volume-alerts>
  - Supports: Tank shape and dimensions are needed to convert level to gallons. Alerts can be set in inches or gallons.
- Farmbot Help Centre (vendor), "How do I Read my Water Level Data and Graphs?" (published 2024-09-16; data years n/a). Checker: **verified**. <https://intercom.help/farmbot-helpcentre/en/articles/5322574-how-do-i-read-my-water-level-data-and-graphs>
  - Supports: Units cm, L or %. Volume needs total volume entered. Displayed values include trend projections. No accuracy stated.
- Meat & Livestock Australia, "Water monitoring in the digital age: Reducing stress and improving the efficiency of the 'water run'" (published 2022-11-08; data years project 2019-11 to 2021-11). Checker: **partly**. <https://mla.com.au/research-and-development/reports/2021/water-monitoring-in-the-digital-age-reducing-stress-and-improving-the-efficiency-of-the-water-run>
  - Supports: Planned supply list of 10 trough and 5 tank sensors (plus 1 silo sensor) for one working farm (no farm count is stated). Hardware revised after the trial. No accuracy or uptime data. Written in first-person developer language ('Waterwatch Live') with a subscription offer; the developer is not named and MLA appears only as funder and publisher. Treat it as developer-authored, not an independent evaluation.
- Meat & Livestock Australia (authored by Farmbot Australia, vendor), "Digital Livestock 4.0 2019/2020 Pilot: Farmbot Romani Pastoral Deployment Case Study (V.DIG.2022)" (published 2022-02-08; data years 2019-2020). Checker: **verified**. <https://www.mla.com.au/contentassets/0e15746c51c64adaa343ac5cd50ebab4/v.dig.2022-farmbot-final-report.pdf>
  - Supports: Vendor-authored. Claims no downtime for one satellite monitor at one station. Vegetation packet loss led to an antenna redesign. No accuracy data.

#### Deferred: Grazing

<a id="rule-grz-07"></a>
##### RULE-GRZ-07: Planned graze days from forage demand

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 2 sources (2 verified; 0 vendor)

**Rule.** PROPOSED: Derive planned graze days from forage demand (AU-days) instead of a fixed per-pasture day count: planned days = (acres x usable forage lb/ac x harvest efficiency) / (head x AUE x daily forage per AU).

**Decision it supports.** Writing the move plan, and re-planning when herd size, animal weight or forage estimates change.

**Required inputs.** Acres; a forage production or standing-crop estimate (lb/ac, from ecological site description, clipping, or RAP/Grass-Cast as context); harvest efficiency; group head and average weight or class to get AUE; forage per AUM.

**Where it applies.** Cattle class: Any grazing group; animal-unit equivalents by class and weight. Season: Start of season, revised mid-season. Geography: Site- and year-specific forage production. Management: Stocking plan from forage demand.

**Classification: B (context-dependent guidance).** CHANGED from A. Checker grazing dispute 1: the AU/AUM/harvest-efficiency method is general extension practice (A), but every constant it needs is not general (913 vs 780 lb per AUM; harvest efficiency 25%, 30-35% or 40% by source; site- and year-specific production). Any computed planned-days figure must be shown as B, not as supported general guidance.

**Evidence (research conclusion).** NDSU R1810: AU = 1,000-lb cow with calf up to 6 months; 913 lb air-dry forage per AUM; AUE table (1,000-lb cow+calf 1.00, 1,100 lb 1.07, 1,200 lb 1.15, yearling 600-800 lb 0.70, mature bull 1.40); worked example 100 cows x 1.15 x 5.5 months = 632.5 AUM. UNL EC127: 1 AUM about 780 lb air-dry forage; common Sandhills rate 0.75 AUM/ac; harvest efficiency about 25% continuous, 30-35% properly managed rotation. The two sources use different forage-per-AUM figures (913 vs 780 lb), which shows the constants are conventions. OBSERVED (`grazing.forage.research.mjs`, assumed AUE): 'season to as_of: 1433 AUM on 4300 ac = 0.33 AUM/ac'. One planned 14-d stay in P4 means 22 AUM for Heifers vs 48 AUM for Yearlings (x2.2).

**Limitations.** The data hold no forage production, so the dashboard cannot compute this today. AUE values are class averages; yearlings averaged 847 lb by Sep 15, above the 600-800 lb band, so 0.70 understates late-season demand. 0.33 AUM/ac falls between the two published context figures I saw (0.25 AUM/ac western ND SCS 1983 figure in an NDSU report; 0.75 Sandhills). That validates nothing; carrying capacity depends on the ecological site and the year.

**Configurable?** Yes. Every constant (AUE, lb/AUM, harvest efficiency) should be a visible setting, because published values differ (913 vs 780 lb/AUM).

**Missing data that should block a confident conclusion.** Without a forage estimate, show planned days as 'manager plan' and do not claim they match carrying capacity.

**Recommendation.** Short term: store planned_out_date per stay and group head/average weight, and show AU-days per stay next to the plan so differences between herds are visible. Longer term: optional forage-budget inputs. In a portfolio piece, being explicit about this is more credible than implying the per-pasture day count is agronomically derived.

**Phase defer (Defer or exclude).** Needs forage production and harvest-efficiency inputs the demo lacks.

**Sources.**

*Independent sources:*

- NDSU Extension, "Determining Carrying Capacity and Stocking Rates for Range and Pasture in North Dakota (R1810)" (published November 2018; reviewed April 2024; data years n/a; extension). Checker: **verified**. <https://www.ndsu.edu/agriculture/ag-hub/publications/determining-carrying-capacity-and-stocking-rates-range-and-pasture-north-dakota>
  - Supports: AU and AUM definitions, 913 lb/AUM, AUE table, harvest efficiencies, worked stocking-rate example, early stocking adjustment in drought.
- University of Nebraska-Lincoln Extension (Schacht, Volesky, Bauer, Stephenson), "Grazing Systems for Nebraska Sandhills Rangeland (EC127)" ((c) 2011; data years Barta Brothers Ranch 1999-2008; extension). Checker: **verified**. <https://extensionpubs.unl.edu/publication/ec127/na/pdf/view>
  - Supports: 0.75 AUM/ac Sandhills; 1 AUM about 780 lb; harvest efficiency 25% continuous vs 30-35% rotation; deferred-rotation grazing periods 30-45 d; short-duration 3-10 d; 8-pasture short-duration gave no vegetation or animal-performance advantage over 4-pasture deferred rotation.

<a id="rule-grz-08"></a>
##### RULE-GRZ-08: Cattle behaviour as a move signal

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 2 sources (2 partly; 0 vendor)

**Rule.** PROPOSED: Cattle behaviour and performance as a move signal (manual note: herd walking fence, bunching at gates or water, selecting less-preferred plants; plus a gain trend), giving a 'check forage now' warning.

**Decision it supports.** Check the pasture or move early; link a low-gain exception to the forage situation.

**Required inputs.** Dated behaviour observation (categorical) per group; the existing gain data (weights.csv).

**Where it applies.** Cattle class: Any grazing group. Season: In season. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Manual behaviour notes plus gain trend.

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker grazing dispute 2: K-State MF3232 describes traditional practice (stockers 'removed in early fall when weight gains had declined to less than 1 pound per head per day'), not a recommendation, and Derner et al. 2022 does not say gain 'indicates whether forage quality is adequate'. Only the CARM behaviour trigger (Augustine et al. 2020) is directly supported. As written, the gain-threshold element is a ranch choice.

**Evidence (research conclusion).** Augustine et al. 2020: CARM staff checked herd distribution and attempts to leave the pasture 3 days/week as a move criterion. Derner et al. 2022: selection of less-desirable plants is an early indicator of unmet nutritional needs, and weighing cattle is one way to track the effect of rotation decisions (the article does not say gain shows whether forage quality is adequate). K-State MF3232 (Feb 2016) describes the traditional practice of removing stockers in early fall once gains had declined below 1 lb/head/day (a description, not a recommendation); moving stockers within the season to rested areas can cut gain by 'as much as 30 to 40 pounds per animal'.

**Corrections from the citation checks.**

- K-State MF3232 describes removal below 1 lb/head/day as traditional Flint Hills practice; it does not recommend it (grazing checker).
- Derner et al. 2022 does not state that weight gain shows whether forage quality is adequate (grazing checker).

**Limitations.** Behaviour is subjective and confounded by weather, flies and water. The K-State thresholds apply to Flint Hills stocker systems and do not transfer to cow-calf herds or northern mixed-grass.

**Configurable?** Yes. Categories and the escalation rule are ranch choices.

**Missing data that should block a confident conclusion.** An absent behaviour note means unknown, not normal.

**Recommendation.** Optional quick-entry field (one tap, few categories). Use it only to add a 'check forage' reason to an existing grazing row or to raise a warning, never a serious, on its own.

**Phase defer (Defer or exclude).** Needs an observation log; revisit after the phase-3 forage observations exist.

**Sources.**

*Independent sources:*

- Kansas State University Agricultural Experiment Station and Cooperative Extension Service (Owensby, Fick), "Summer Grazing Strategies for Stocker Cattle in the Kansas Flint Hills (MF3232)" (published February 2016; data years 9-, 10-, 8- and 10-year averages (Table 5 uses 2003-2013 market values); extension). Checker: **partly**. <https://bookstore.ksre.ksu.edu/download/summer-grazing-strategies-for-stocker-cattle-in-the-kansas-flint-hills_MF3232>
  - Supports: Describes traditional practice, not a recommendation: stockers were 'removed in early fall when weight gains had declined to less than 1 pound per head per day'; about 4 acres/steer is the moderate season-long rate; in-season rotation to rested areas reduces stocker gains; continuous grazing called the most economically efficient system in the Flint Hills.
- Elsevier / SRM (USDA ARS-hosted PDF), "Adaptive grazing management in semiarid rangelands: An outcome-driven focus" (published 2022; data years case studies; peer-reviewed). Checker: **partly**. <https://www.ars.usda.gov/ARSUserFiles/30123025/Publications/2022/Derner%20et%20al%202022%20Rangelands%20-%20adaptive%20grazing%20management%20for%20outcome-driven%20focus.pdf>
  - Supports: Selection of less-desirable plants as an early indicator of unmet nutritional needs; weighing cattle as one way to track the effect of rotation decisions (the article does not present gain as a test of forage quality).

<a id="rule-grz-09"></a>
##### RULE-GRZ-09: Range readiness at season start

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 2 sources (2 verified; 0 vendor)

**Rule.** PROPOSED (season start): Range readiness. Warning when a planned first entry into a native pasture comes before its key cool-season species reaches about the 3.5-leaf stage (tame cool-season: 3-leaf), or before the ranch's height trigger.

**Decision it supports.** Delay turnout or start on tame pasture first.

**Required inputs.** Per pasture: key species and native/tame; planned turn-in date; leaf-stage or height observation; optional growing degree days.

**Where it applies.** Cattle class: Any grazing group. Season: Season start (spring turnout). Geography: Northern Plains native cool-season range and tame pasture. Management: Growth-stage observations before first entry.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** SDSU 'Reading the Range' (Apr 13, 2022): native cool-season grasses such as western wheatgrass and green needlegrass 'should not be grazed until they reach the 3.5-leaf stage'; tame at 3-leaf. SDSU Grazing Readiness Map (updated Apr 8, 2022; page timestamp Oct 4, 2024): growing degree days to 3.5-leaf are crested wheatgrass 516, western wheatgrass 1,170, green needlegrass 1,209, blue grama 1,296 (USDA-ARS Mandan; PRISM 40-yr); keep yearly turn-in records by pasture. NDSU R1780: native cool-season 3.5-leaf stage mid-late May or early June.

**Limitations.** GDD-based dates are averages; turnout varies by about a month between years.

**Configurable?** Yes.

**Missing data that should block a confident conclusion.** Without a readiness observation, show the planned date as unverified.

**Recommendation.** Lower priority for this demo (the data start June 1). Mention it in the README roadmap.

**Phase defer (Defer or exclude).** Needs growth-stage observations; the demo season starts after turnout.

**Sources.**

*Independent sources:*

- SDSU Extension (Brennan, Menendez, Ehlert), "South Dakota Grazing Readiness Spring Turnout Map" (Updated April 8, 2022 (page metadata October 4, 2024); data years PRISM 40-year climate normals; extension). Checker: **verified**. <https://extension.sdstate.edu/south-dakota-grazing-readiness-spring-turnout-map>
  - Supports: GDD thresholds for 3- and 3.5-leaf stages; Cottonwood average readiness May 29; keep turn-in records.
- SDSU Extension, "Reading the Range: Range readiness, grazing timing and drought considerations" (Updated April 13, 2022; data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/reading-range-range-readiness-grazing-timing-and-drought-considerations>
  - Supports: 3.5-leaf rule for native cool-season; calendar dates are rules of thumb.

#### Deferred: Gain

<a id="rule-gain-08"></a>
##### RULE-GAIN-08: Period-specific expected gain

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 3 sources (3 verified; 0 vendor)

**Rule.** PROPOSED: Period-specific expected ADG. The expectation used by the group rule depends on season segment, forage type, supplementation and the current year's forage outlook.

**Decision it supports.** Separating a management or health problem from normal seasonal and weather-driven decline.

**Required inputs.** Expected ADG by period and pasture (ranch history); supplementation flag; Grass-Cast or drought status as context.

**Where it applies.** Cattle class: Growing cattle judged on ADG (demo: Yearlings target 2.0 lb/d, Heifers 1.0 lb/d). Season: Early, mid and late season segments; supplemented or not. Geography: Northern Great Plains; year-to-year forage variation. Management: Group weigh-ins on a chute scale (demo: 2026-06-01, 2026-07-20, 2026-09-15).

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** Grings 2002 late-period values (1.30, 1.46 lb/d in 1994 and 1995) versus whole-season values (2.36-2.62). Currie 1989 found a decline from late July to September. Gillespie 2014 found a 1.17 vs 0.73 lb/d year effect. Reeves 2014: weather explains R2 0.44-0.74 of beef production per hectare (not per-head ADG). The Grass-Cast About page says it is 'updated every two weeks' at 10 km x 10 km, is experimental, and should not be the 'sole source for making management decisions'.

**Limitations.** Ranch-specific history is needed. Public forecasts are experimental and county or grid scale, so they cannot set a herd's expected ADG by themselves.

**Configurable?** Yes.

**Missing data that should block a confident conclusion.** If no period expectation exists, compare only to the ranch's own prior years for the same period, or report the ADG without a verdict.

**Recommendation.** Replace groups.csv target_adg_lbs with an expectations table (group, pasture or forage type, start_date, end_date, expected_adg, source).

**Phase defer (Defer or exclude).** Needs a gain_expectations table built for a real ranch; the demo cannot validate it. It is the main accuracy follow-up for the gain rules.

**Sources.**

*Independent sources:*

- Society for Range Management, "Growth patterns of yearling steers determined from daily live weights" (published 1989; data years 1983-1987; peer-reviewed). Checker: **verified**. <https://repository.arizona.edu/handle/10150/645028>
  - Supports: Gains lower in the second half of summer every year.
- USDA-ARS / SRM, "Intensive-early stocking for yearling cattle in the Northern Great Plains" (published 2002; data years 1993-1995; peer-reviewed). Checker: **verified**. <https://ars.usda.gov/ARSUserFiles/30300500/Publications/JRM55-135-138.pdf>
  - Supports: Late-period vs whole-season ADG.

*Product documentation (an agency or university describing its own product; not independent validation):*

- Grass-Cast (USDA-ARS, National Drought Mitigation Center, Colorado State Univ., Univ. of Arizona), "About Our Maps (Grass-Cast)" (undated; data years 38-year baseline). Checker: **verified**. <https://grasscast.unl.edu/Outlook/About.aspx>
  - Supports: Experimental, 10 km grid, updated every two weeks. Does not account for local management or species. Not to be used as a sole decision source.

<a id="rule-gain-09"></a>
##### RULE-GAIN-09: Replacement heifer target-weight rule

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 5 sources (5 verified; 0 vendor)

**Rule.** PROPOSED (class not in current data): Replacement heifer target-weight rule. Required ADG = (target % of mature BW x mature BW - current BW) / days to breeding start. Flag when the projected breeding weight falls short of the ranch's target.

**Decision it supports.** Whether developing heifers will reach the ranch's chosen breeding weight in time.

**Required inputs.** Mature cow weight estimate (own cows, weighed with BCS), target % (ranch choice), breeding start date, current weights.

**Where it applies.** Cattle class: Replacement heifers (a class not in the demo data). Season: Development period before breeding. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Target-weight development plan.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** SDSU (Grussing, updated 2021-10-25): '55 - 65% of mature weight by breeding'. Worked example: a 1,400-lb mature cow and 60% gives an 840-lb target. A 600-lb heifer then needs 240 lb over 151 d (the article states 1.5 lb/d; 240/151 = 1.59). UNL BeefWatch 2024: GSL data 2005-2019 (1,434 heifers and cows) at 50-70% of mature BW. Heifers at 60-70% had higher initial and 2-yr-old pregnancy rates, with no effect at ages 3-5. UNL G2215 (2013): lower-input systems target 50-57% vs the traditional 60-65%. SDSU (Ricardo, updated 2026-07-10): about 65% at breeding and 80% by calving historically; lower-input 50-55% with ADG \~1.0-1.5 lb/d. MU G2091 (2021): 65% traditional; 1.5 lb/d during development.

**Limitations.** The target % is a ranch trade-off between cost and reproduction. Mature-weight estimates are uncertain.

**Configurable?** Yes: target %, mature weight, breeding date.

**Missing data that should block a confident conclusion.** Without a mature-weight estimate and a breeding date, no projection.

**Recommendation.** Optional future feature. The repo's 'Heifers' group is first-calf heifers, so do not relabel it as replacements.

**Phase defer (Defer or exclude).** Part of the deferred breeding and heifer-development records.

**Sources.**

*Independent sources:*

- SDSU Extension, "Targeted Feeding for Heifer Development" (updated 2021-10-25; data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/targeted-feeding-heifer-development>
  - Supports: 55-65% target and the required-ADG worked example.
- UNL BeefWatch, "Heifer percent mature body weight at breeding: What does it mean for pregnancy rates and calf performance?" (published 2024-01-17; data years 2005-2019; extension). Checker: **verified**. <https://beef.unl.edu/beefwatch/2024/heifer-percent-mature-body-weight-breeding-what-does-it-mean-pregnancy-rates-and-calf/>
  - Supports: 50-70% comparison and pregnancy outcomes.
- University of Nebraska-Lincoln Extension, "Reducing Replacement Heifer Development Costs Using a Systems Approach (G2215)" (published 2013-09; data years n/a; extension). Checker: **verified**. <https://extensionpubs.unl.edu/publication/g2215/2013/pdf/view/g2215-2013.pdf>
  - Supports: 50-57% vs 60-65% of mature weight. BCS 5 or more at calving.
- SDSU Extension, "Developing Heifers to Fit Your Production Environment" (updated 2026-07-10; data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/developing-heifers-fit-your-production-environment>
  - Supports: 65% / 80% historical benchmarks. Lower-input 50-55% at \~1.0-1.5 lb/d.
- University of Missouri Extension, "Nutritional Management of Developing Heifers: Intensive Versus Extensive Systems (G2091)" (published 2021-09; data years n/a; extension). Checker: **verified**. <https://extension.missouri.edu/media/wysiwyg/Extensiondata/Pub/pdf/agguides/ansci/g02091.pdf>
  - Supports: 65% traditional target. 1.5 lb/d during development.

<a id="rule-gain-11"></a>
##### RULE-GAIN-11: Scale check at each weigh session

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 3 sources (3 verified; 1 vendor)

**Rule.** PROPOSED: Scale check per weigh session. Zero the scale and check it with a known weight at the start of each session (and after moving it). Record scale ID and the check result. Note that ranch management scales are not trade-certified.

**Decision it supports.** Whether a weigh session's numbers can be trusted.

**Required inputs.** scale_id, check_weight_lbs, check_reading_lbs, zero_ok, session date and time.

**Where it applies.** Cattle class: Any weighed group. Season: Every weigh session. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Ranch management scales (not trade-certified).

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker gain dispute 1: no cited source recommends zeroing plus a known-weight check every session for ranch scales. 9 CFR 201.72 covers trade weighing only, PAMI 654 is 1991 equipment evidence, and the Gallagher manual is a vendor statement.

**Evidence (research conclusion).** PAMI Evaluation Report 654 (July 1991) tested four livestock scales. One read 2% low to 1% high in final tests (about 2% high, or 20 lb on a 1,000-lb animal, initially). Re-zeroing was needed every \~15-50 cattle depending on model. Cold could cause a \~0.4% low reading. 9 CFR 201.72 requires scales used in trade under the Packers and Stockyards Act to be tested at least twice each calendar year, at least 120 days apart. The Gallagher load bar manual (vendor; Ed. 12, Mar 2014) states the product is 'not certified for trade use' and that uneven mounting 'may result in weighing errors'. The Tru-Test indicator info sheet (vendor; REV 12192023) gives no accuracy figure.

**Limitations.** PAMI tested 1991-era equipment. Current scales may perform differently, and no current independent test was located. 9 CFR 201.72 covers trade weighing, not ranch performance weighing.

**Configurable?** Yes: check-weight tolerance.

**Missing data that should block a confident conclusion.** If no check is recorded for a session, mark its ADGs 'scale not checked' (informational, not blocking).

**Recommendation.** Add session metadata. Do not import vendor-computed ADG without the underlying weights.

**Phase defer (Defer or exclude).** An optional weigh-session record; not needed for phase 1.

**Sources.**

*Independent sources:*

- Prairie Agricultural Machinery Institute, "Livestock Scales (Evaluation Report 654)" (published 1991-07; data years test year not stated; field study or demonstration). Checker: **verified**. <https://pami.ca/pdfs/reports_research_updates/(5e)%20Livestock%20Scales/654.PDF>
  - Supports: Measured accuracy, zero drift and temperature effects of four livestock scales.
- eCFR (USDA AMS Packers and Stockyards regulations), "9 CFR 201.72 Scales; testing of" (most recent change 88 FR 62696, 2023-09-13; data years n/a; government agency). Checker: **verified**. <https://www.ecfr.gov/current/title-9/chapter-II/part-201/subpart-K/section-201.72>
  - Supports: Trade scales tested at least twice per calendar year, at least 120 d apart.

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- Gallagher (vendor; PDF hosted by Valley Vet), "Load Bar User Manual 3E1045 Edition 12" (published 2014-03; data years n/a). Checker: **verified**. <https://www.valleyvet.com/library/lib_19258_-Manual1.pdf>
  - Supports: Not certified for trade use. Mounting affects accuracy (vendor statement, not independently verified).

#### Deferred: Health

<a id="rule-hlth-04"></a>
##### RULE-HLTH-04: Vaccination and parasite-control windows from the label or vet plan

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 4 sources (4 verified; 0 vendor)

**Rule.** PROPOSED: For vaccination and parasite-control tasks, evaluate against a window (window_start..window_end) recorded from the product label or the veterinarian's plan, with schedule_source stored. Warning when window_start is within the lead time. Serious when window_end has passed, with an escalate-to-vet action.

**Decision it supports.** Whether a booster or revaccination can still be done inside its label or vet window, or needs veterinarian input first.

**Required inputs.** task_type, window_start, window_end, schedule_source, product name (record only), as_of, responsible.

**Where it applies.** Cattle class: Groups on a vaccination or parasite-control program. Season: Per label or veterinarian plan. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Window recorded from the product label or the veterinarian's plan.

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker health dispute 5: the window concept is supported (BQA 2-4 weeks; BCRC 'at least 3 weeks apart'), but making a missed window_end 'serious' with an escalate-to-vet action is not sourced; it is a reasonable design choice.

**Evidence (research conclusion).** BQA Manual: 'Always read and follow label directions'; almost all products recommend the second dose 2-4 weeks after the first. BQA Field Guide: boosters given when the label calls for them. BCRC/University of Calgary clostridial guideline: 'Vaccines should always be given according to label instructions' and 'Specific recommendations for your operation should be discussed with your veterinarian.' UC Davis 2008: booster need is on the label. OBSERVED with SYNTHETIC window values: 'Yearlings: Booster vaccine | window 2026-06-16..2026-06-30 (product_label) … -> serious: label window passed | "Window from the product label closed 92 days ago. Check the label and ask your veterinarian how to proceed before scheduling."'

**Limitations.** The window values in the fictional data would themselves be synthetic and must be labelled so. No fetched source gives a general rule for what happens after a missed booster (restart or not). That is left to the label and the veterinarian, and the dashboard must not decide it.

**Configurable?** Yes. Window dates are data, not code. Lead time per task type is a ranch setting.

**Missing data that should block a confident conclusion.** If window_end or schedule_source is missing on a vaccination task, show 'Window not recorded. Check the label or vet plan' instead of a confident overdue or OK.

**Recommendation.** Add window_start, window_end and schedule_source to the health schedule. Keep next_due only as a planned date inside the window. Never print a dose or product instruction.

**Phase defer (Defer or exclude).** Needs window_start, window_end and schedule_source fields; not in the phase lists.

**Sources.**

*Independent sources:*

- Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor), "Beef Quality Assurance National Manual (bqa_manual_final.pdf)" (undated (no date in the PDF; newest data cited are the 2016 NBQA, a 2018 footnote and a 1998-2017 series). Likely superseded: NCBA announced an updated manual on 2024-12-19 (2025-01-06 is a trade-press reprint date), and bqa.org now links a 2026 edition that could not be fetched.; data years newest data cited: 2016 National Beef Quality Audit; a 1998-2017 series; standard or specification). Checker: **verified**. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf>
  - Supports: Label directions govern (p.42, p.44). Second vaccination 2-4 weeks after the initial for almost all products (p.47).
- Beef Quality Assurance program, "BQA Field Guide (bqa_field-_guide.pdf)" (undated (the only year shown is a 1996 NRC table credit); likely superseded by bqa-field-guide-2026.pdf; data years n/a; standard or specification). Checker: **verified**. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_field-_guide.pdf>
  - Supports: Vaccines follow label directions including 21- or 60-day withdrawal. Boosters are given when the label calls for them.
- University of Calgary Faculty of Veterinary Medicine / Beef Cattle Research Council (per title and URL; not named in fetched text), "BCRC Vaccine Project - Clostridial Vaccination Guidelines" (undated; data years n/a; extension). Checker: **verified**. <https://vet.ucalgary.ca/sites/default/files/teams/9/BCRC%20Vaccine%20Project%20-%20Clostridial%20Vaccination%20Guidelines.pdf>
  - Supports: 'Vaccines should always be given according to label instructions'. Operation-specific recommendations are to be discussed with the veterinarian. Does not say what to do when an interval is exceeded.
- UC Davis School of Veterinary Medicine Extension, "Booster Vaccines (UC Davis Vet Views, cca0810)" (published 2008-10; data years n/a; extension). Checker: **verified**. <https://vetext.vetmed.ucdavis.edu/sites/g/files/dgvnsk5616/files/local_resources/pdfs/pdfs_beef/cca0810-booster-vaccines.pdf>
  - Supports: Booster need is on the label and should be followed. The veterinarian is the best source of vaccine information.

<a id="rule-hlth-05"></a>
##### RULE-HLTH-05: Fly-season eye and condition observations

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 6 sources (4 verified, 2 partly; 0 vendor)

**Rule.** PROPOSED: In fly season, each pastured group gets a recurring eye and condition observation. Warn when a group has no recorded check in N days (N is a ranch setting). When an observation records animals with watery eyes, squinting or a cloudy eye, show 'N head with eye signs recorded. Call your veterinarian' and schedule a recheck within a few days. The current one-off 'Pinkeye check' row and its 'Plan it with the next gather' action become this.

**Decision it supports.** Early detection and timely veterinarian contact for eye problems during face-fly season, without the dashboard diagnosing.

**Required inputs.** observation records (date, group, observer, head_with_signs, sign codes), fly-season start/end dates (ranch-entered), optional fly counts.

**Where it applies.** Cattle class: Pastured groups. Season: Fly season (dates set per year). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Recurring group observations recorded by the crew.

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker health dispute 4: the default 'any head with eye signs: call your veterinarian' is a ranch or veterinarian choice; sources say to act promptly and treat in consultation with the veterinarian, and the N-day interval is a ranch setting.

**Evidence (research conclusion).** NDSU 2025: early signs are 'watery eyes or face staining from excess tear production', squinting, and a cloudy spot. 'The first signs of pinkeye occur 12 to 72 hours after exposure.' Progression 'can take place over just a few days'. Treat in consultation with the veterinarian. 'Records of affected cattle should be kept so that any potential retained breeding stock can be evaluated.' OSU VTMD-9128: 'Pinkeye rarely affects just one animal, but spreads throughout the herd'. Keep current health records. UNL 2021: act on tearing, squinting and blinking 'immediately'. Fly tags work best applied near fly season. UNL 2023: face flies peak late July, August and early September, and aggregate to overwinter as day length falls below 12.5 h. NDSU 2024: tags when flies near the economic threshold, which the article gives as '200 flies per animal'. Remove tags when no longer effective. OBSERVED (computed, astronomy only): day length 2026-09-30 is Pierre SD 11.83 h, North Platte NE 11.86 h, Bismarck ND 11.81 h, all under 12.5 h. INFERENCE: the committed Oct 3 'Pinkeye check' falls at the tail of face-fly season. That is plausible (an NDSU release dated 2017-09-25 reported pinkeye 'infecting cattle in some herds') but it is an observation job, not a gather job.

**Corrections from the citation checks.**

- The NDSU 2024 fly article's 200-fly threshold names no species; the research called it 'horn flies per animal'.
- OSU VTMD-9128 says pinkeye 'can range from a few cases up to 80 percent of the herd'; it does not say 80% are affected at the peak of an outbreak.

**Limitations.** Recheck interval and N are management choices. Season dates vary by year and location. The day-length cue is a seasonal indicator, not a fly count. Eye signs can have causes other than pinkeye (UNL 2023 notes face-fly lesions 'mimic the symptoms of bovine pinkeye'), so the dashboard must record signs, not name a disease.

**Configurable?** Yes: fly-season dates, observation interval, and the head count that triggers 'call your veterinarian' (default: any).

**Missing data that should block a confident conclusion.** No observation records means the dashboard shows 'No eye check recorded since [date]' rather than implying the group is clear.

**Recommendation.** Replace the dated 'Pinkeye check' task with an observation log and a fly-season window. Wording: 'Look the group over on the next pasture check; record animals with watery eyes, squinting or a cloudy eye and call your veterinarian if you see any.' Add an end-of-season 'fly tag removal' task (NDSU 2024) instead of a 'done' fly tag row whose next_due has passed (H-05).

**Phase defer (Defer or exclude).** Needs an observation log. Observation and escalation wording only; no diagnosis.

**Sources.**

*Independent sources:*

- NDSU Agriculture Communication, "Summer brings raised pinkeye concerns in cowherds" (published 2025-07-02; data years n/a; extension). Checker: **verified**. <https://www.ag.ndsu.edu/news/newsreleases/2025/july/summer-brings-raised-pinkeye-concerns-in-cowherds>
  - Supports: Signs to observe, 12-72 h onset, progression over a few days, keep records of affected cattle, involve the veterinarian, check cattle closely in pasture.
- Oklahoma State University Extension (Boileau, Lalman, Whitworth), "Pinkeye (VTMD-9128)" (published 2016-10; data years n/a; extension). Checker: **partly**. <https://extension.okstate.edu/fact-sheets/pinkeye>
  - Supports: 'excessive tearing and squinting are the initial clinical signs'. It rarely affects one animal. Infection 'can range from a few cases up to 80 percent of the herd', with cases usually peaking in the 3rd-4th week of an outbreak. Incubation 2-3 days. Maintain health records.
- Nebraska Extension BeefWatch (C. Biehler), "Do not let Pinkeye Decrease Efficiencies in Summer Grazing" (published 2021-08-01; data years n/a; extension). Checker: **verified**. <https://beef.unl.edu/beefwatch/2021/do-not-let-pinkeye-decrease-efficiencies-summer-grazing>
  - Supports: Act on early signs immediately. Season rises in spring, peaks in summer and declines in fall. Fly-tag timing relative to routine processing. Discuss vaccine timing with the veterinarian well in advance.
- Nebraska Extension BeefWatch (D. Boxler), "Face Flies on Pastured Cattle" (published 2023-06-01; data years n/a; extension). Checker: **verified**. <https://beef.unl.edu/beefwatch/2023/face-flies-pastured-cattle>
  - Supports: Face flies peak late July to early September and aggregate to overwinter when day length is under 12.5 h. Face-fly lesions mimic pinkeye.
- NDSU Extension and Ag Research News (Stokka, Tobin, Hoppe), "Controlling flies on cattle requires proper timing" (published 2024-05-22; data years n/a; extension). Checker: **partly**. <https://www.ag.ndsu.edu/news/newsreleases/2024/may/controlling-flies-on-cattle-requires-proper-timing>
  - Supports: Horn and face flies are not present at turnout. Tags go in when populations near the threshold, typically mid-June to July. Threshold given as 200 flies per animal (no species named). Remove tags when no longer effective. Scout and monitor.
- NDSU Agriculture Communication (Stokka, Webb, Dyer), "Pinkeye Infecting Some N.D. Cattle" (published 2017-09-25 (URL) / 2017-09-27 (footer); data years n/a; extension). Checker: **verified**. <https://www.ag.ndsu.edu/news/newsreleases/2017/sept-25-2017/pinkeye-infecting-some-n-d-cattle>
  - Supports: Pinkeye was reported in ND herds at the end of September 2017. Signs include teary eyes, squinting and aversion to light. 'Producers should contact their veterinarian or the VDL'.

<a id="rule-hlth-06"></a>
##### RULE-HLTH-06: Completion record before a task is marked done

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 4 sources (4 verified; 0 vendor)

**Rule.** PROPOSED: A health task can be marked done only with a BQA-style completion record: date, group or animal ID, product and lot/serial (product tasks), route and location, withdrawal clear date, person administering, and head count worked. Missing items show as 'record incomplete'.

**Decision it supports.** Whether the ranch can show what was done, to which animals, by whom, and when they clear withdrawal (BQA compliance and marketing).

**Required inputs.** done_date, group/animal_id, product, lot_serial, route_location, withdrawal_clear_date, done_by, head_done.

**Where it applies.** Cattle class: Any group or animal receiving a product. Season: Per completion. Geography: US beef operations following BQA. Management: Completion records for scheduled health tasks.

**Classification: C (ranch-specific management choice).** CHANGED from A. Checker health dispute 2: the BQA product-record items are A (manual Sec 6.2), but head_done (from the KS-BQA form), blocking 'done' until the record is complete, and the minimum record for observation tasks are design choices. BQA is voluntary; only VFD and extralabel records are legal requirements. Evidence-currency caveat (health dispute 7): the cited BQA manual is likely superseded by the 2026 edition.

**Evidence (research conclusion).** BQA Manual, Record Keeping (p.15 per fetch): treatment records must include 'Individual animal identification', 'Date treated', 'Product administered and manufacturer's lot/serial number', 'Dosage', 'Route and location of administration', 'Earliest date animal will have cleared the withdrawal period', 'Name of individual administering the treatment'. Group treatments need a group or lot ID plus the same items. Kansas BQA Processing/Treatment Map form includes 'No. of Head', 'Lot or Serial #', 'Route of Admin', 'Withdrawal Time (WD)' and 'Crew Initials'. OBSERVED (health.research.mjs): 'health.csv columns: group, task, last_done, next_due, status', with lot/serial, route and location, withdrawal clear date, person, head count, window and schedule source all MISSING.

**Limitations.** The dashboard needs only some of these to make decisions (date, head count, withdrawal clear date, person). Dose, route and lot are for the record, and the page should not display them as instructions.

**Configurable?** No for the BQA fields. Yes for which fields the page displays.

**Missing data that should block a confident conclusion.** A 'done' status without done_date and head_done should not count as complete. Show 'record incomplete'.

**Recommendation.** Add an append-only health_records.csv. Keep health.csv as the schedule. The dashboard reads both. Record dose and route but do not surface them in exception text.

**Phase defer (Defer or exclude).** Shared records are deferred. Dose and route stay in the record system and are never shown as instructions.

**Sources.**

*Independent sources:*

- Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor), "Beef Quality Assurance National Manual (bqa_manual_final.pdf)" (undated (no date in the PDF; newest data cited are the 2016 NBQA, a 2018 footnote and a 1998-2017 series). Likely superseded: NCBA announced an updated manual on 2024-12-19 (2025-01-06 is a trade-press reprint date), and bqa.org now links a 2026 edition that could not be fetched.; data years newest data cited: 2016 National Beef Quality Audit; a 1998-2017 series; standard or specification). Checker: **verified**. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf>
  - Supports: Required treatment-record items (p.15). Group records need a group or lot ID. Processing map records where each injection was given (Ch.1).
- Kansas Livestock Association / Kansas BQA (per URL and form text), "KS-BQA record keeping forms (Processing/Treatment Map etc.)" (undated; data years n/a; standard or specification). Checker: **verified**. <https://www.kla.org/Media/KLA/Docs/bqarecordkeeping.pdf>
  - Supports: The processing map records date and time, 'No. of Head', group number, product, 'Lot or Serial #', 'Route of Admin', dose, 'Withdrawal Time (WD)', 'Crew Initials', and owner and veterinarian signatures.
- Oklahoma State University Extension, Oklahoma BQA (per URL; not named in fetched text), "Health treatment record (Oklahoma BQA form)" (undated; data years n/a; extension). Checker: **verified**. <https://extension.okstate.edu:443/programs/beef-extension/oklahoma-beef-quality-assurance/site-files/documents/health-treatment-record.pdf>
  - Supports: Columns include ID/Group Description, Date of Treatment, Product Used Lot Numbers, Serial/Route and Location, Date of Withdrawal, Person Giving Treatment.
- University of Arkansas System Division of Agriculture (from nondiscrimination notice), "Beef Herd Health Record V2" (undated; data years n/a; extension). Checker: **verified**. <https://www.uaex.uada.edu/farm-ranch/animals-forages/beef-cattle/Beef%20Herd%20Health%20Record_V2.pdf>
  - Supports: Treatment record columns Group and/or Individual, Date, ID, Purpose, Product Name, Lot, Expiration, Dose, Withdrawal. Header includes BQA Number and Premise ID.

<a id="rule-hlth-07"></a>
##### RULE-HLTH-07: Head not yet worked on a group task

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 1 source (1 verified; 0 vendor)

**Rule.** PROPOSED: Coverage gap. When head_done is less than the group's head count for a group task, show a warning 'N head not yet worked (done X of Y on [date])'.

**Decision it supports.** Whether animals missed at a gather (strays, cut-backs, late arrivals) still need the task.

**Required inputs.** head_done, head_planned or groups.csv head, done_date, group.

**Where it applies.** Cattle class: Group tasks. Season: Per completion. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: head_done recorded against group head.

**Classification: C (ranch-specific management choice).** Unchanged (research C).

**Evidence (research conclusion).** The KS-BQA processing map records 'No. of Head'. OBSERVED with a SYNTHETIC record: 'Yearlings Booster vaccine: 142/150 head worked on 2026-10-02 -> 8 head still to do'. OBSERVED: health.csv has no head-count column. groups.csv head counts are Cows 180, Heifers 45, Yearlings 150.

**Limitations.** Group head counts change (sales, deaths, purchases), so the denominator must be the count at the time of the task. The tolerance (exact match or a few head) is a ranch choice.

**Configurable?** Yes (tolerance, and whether the gap is warning or info).

**Missing data that should block a confident conclusion.** Without head_done the dashboard cannot claim the group is covered. Show 'head count not recorded'.

**Recommendation.** Record head_done on every group completion and compare it with the group head at that date.

**Phase defer (Defer or exclude).** Needs head_done on completion records.

**Sources.**

*Independent sources:*

- Kansas Livestock Association / Kansas BQA, "KS-BQA record keeping forms" (undated; data years n/a; standard or specification). Checker: **verified**. <https://www.kla.org/Media/KLA/Docs/bqarecordkeeping.pdf>
  - Supports: 'No. of Head' is a field on the Processing/Treatment Map.

<a id="rule-hlth-08"></a>
##### RULE-HLTH-08: Withdrawal clear date after the planned ship date

Status: proposed · Class **A** (supported general guidance) · Phase **defer** (Defer or exclude) · 3 sources (3 verified; 0 vendor)

**Rule.** PROPOSED: Serious when a recorded withdrawal clear date falls after the group's planned ship or sale date. Action: 'Do not ship before [clear date]. Talk with your veterinarian.'

**Decision it supports.** Marketing timing that avoids residues: whether a group can leave on its planned date.

**Required inputs.** withdrawal_clear_date per completion record (from the label, or from the veterinarian for extralabel use), planned_ship_date per group.

**Where it applies.** Cattle class: Any animal or group with a recorded withdrawal. Season: Before shipping or sale. Geography: US. Management: Withdrawal clear dates from the label or the veterinarian; planned ship dates.

**Classification: A (supported general guidance).** Kept at A for the principle (do not ship before the recorded withdrawal clear date). Evidence-currency caveat (health dispute 7): the cited BQA manual is likely superseded and was not re-verified against the 2026 edition.

**Evidence (research conclusion).** BQA Manual: records must include the 'Earliest date animal will have cleared the withdrawal period'. Most vaccines have a 21- or 60-day withdrawal (p.45 per fetch). BQA Field Guide: consult pharmaceutical, veterinary or screening experts on high-risk animals before sale. FDA: extralabel use requires a VCPR. FARAD (AABP 2021) answers withdrawal-interval requests from veterinarians. OBSERVED with SYNTHETIC values: 'withdrawal 21 d -> clear 2026-10-23; planned ship 2026-10-15 -> CONFLICT: ship date is before the withdrawal clear date'.

**Limitations.** The dashboard must use the clear date recorded from the label or the vet. It must not compute withdrawal for extralabel use. groups.csv has no planned ship date today.

**Configurable?** No for the rule. Lead time for the warning before a ship date is configurable.

**Missing data that should block a confident conclusion.** A product task without a withdrawal_clear_date should block a 'clear to ship' reading. Show 'withdrawal not recorded'.

**Recommendation.** Add planned_ship_date to groups and withdrawal_clear_date to completion records. Flag conflicts as serious.

**Phase defer (Defer or exclude).** Needs withdrawal_clear_date and planned_ship_date records. The dashboard never computes a withdrawal.

**Sources.**

*Independent sources:*

- Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor), "Beef Quality Assurance National Manual (bqa_manual_final.pdf)" (undated (no date in the PDF; newest data cited are the 2016 NBQA, a 2018 footnote and a 1998-2017 series). Likely superseded: NCBA announced an updated manual on 2024-12-19 (2025-01-06 is a trade-press reprint date), and bqa.org now links a 2026 edition that could not be fetched.; data years newest data cited: 2016 National Beef Quality Audit; a 1998-2017 series; standard or specification). Checker: **verified**. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf>
  - Supports: Withdrawal clear date is a required record item. Vaccines carry 21- or 60-day withdrawals.
- American Association of Bovine Practitioners Conference Proceedings (Maunsell et al.), "FARAD: How we respond to withdrawal inquiries" (published 2021-10-09; data years n/a; other publisher). Checker: **verified**. <https://bovine-ojs-tamu.tdl.org/AABP/article/view/8283>
  - Supports: Veterinarians request withdrawal-interval advice after extralabel use. FARAD cannot give one where the FDA prohibits the extralabel use.
- U.S. FDA Center for Veterinary Medicine, "Veterinarian-Client-Patient Relationships, Prescribing/Dispensing Animal Drugs, and Telemedicine" (content current as of 2024-09-04; data years n/a; government agency). Checker: **verified**. <https://www.fda.gov/animal-veterinary/product-safety-information/veterinarian-client-patient-relationships-prescribingdispensing-animal-drugs-and-telemedicine>
  - Supports: Extralabel use and VFDs require a VCPR.

<a id="rule-hlth-09"></a>
##### RULE-HLTH-09: Low-stress timing for early-pregnant females

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 2 sources (2 verified; 0 vendor)

**Rule.** PROPOSED: Low-stress timing for sensitive groups. When a handling task is planned for females in early pregnancy (inside a configurable number of days after bull turn-in), show a note: 'Early-pregnant females: keep handling, transport and heat stress low. Confirm timing with your veterinarian.' Pregnancy-check windows are derived from breeding-season dates.

**Decision it supports.** Whether to combine, delay or move a gather for bred heifers or cows. When to book the pregnancy check.

**Required inputs.** bull_in_date, bull_out_date per group, planned task dates, vet-chosen method.

**Where it applies.** Cattle class: Females in early pregnancy. Season: Within a set number of days after bull turn-in. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Handling tasks planned against breeding dates.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** NDSU 2020: 'producers should minimize handling, transportation, and heat stress' for cows in early pregnancy. Pregnancy testing 'as early as 30 to 45 days after the end of the breeding season'. Consult the veterinarian on method. UW-Madison Extension summary of peer-reviewed work: Reinhardt, Busby & Corah 2009 J. Anim. Sci. 87:3030 (more than 20,000 cattle, 2002-2006) linked excitable disposition with lower ADG and carcass merit. Dewell et al. 2019 Bovine Practitioner: low-stress-handled cattle gained 2.92 vs 2.70 lb/d. These are associations or single trials, cited second-hand.

**Limitations.** The days-after-turn-in cut-off is a ranch and vet choice. The peer-reviewed results come from feeder and feedlot settings and were read through an extension summary, not the papers.

**Configurable?** Yes (days after turn-in, which groups).

**Missing data that should block a confident conclusion.** Without breeding dates the dashboard cannot derive the preg-check window or flag early pregnancy. Show 'breeding dates not recorded'.

**Recommendation.** Add bull_in and bull_out to groups. Derive a suggested preg-check window (end of breeding plus a vet-set offset) and show it as 'confirm with your veterinarian'.

**Phase defer (Defer or exclude).** Needs breeding dates (deferred breeding module).

**Sources.**

*Independent sources:*

- NDSU Agriculture Communication, "Consider Pregnancy Testing Beef Cattle Early" (published 2020-07-06 (URL) / 2020-07-09 (byline); data years n/a; extension). Checker: **verified**. <https://www.ag.ndsu.edu/news/newsreleases/2020/july-6-2020/consider-pregnancy-testing-beef-cattle-early>
  - Supports: Minimize handling, transport and heat stress in early pregnancy. Timing of methods after breeding. A follow-up check before winter feeding.
- University of Wisconsin-Madison Division of Extension (B. Halfman), "Cattle handling and stockmanship influence on animal performance" (undated (image uploaded 2022-07; not confirmed as article date); data years cites Reinhardt et al. 2009 (data 2002-2006), Dewell et al. 2019, Woiwode et al. 2016; extension). Checker: **verified**. <https://livestock.extension.wisc.edu/articles/cattle-handling-and-stockmanship-influence-on-animal-performance>
  - Supports: Summarises peer-reviewed evidence that calm handling and disposition are associated with gain and carcass merit.

<a id="rule-hlth-10"></a>
##### RULE-HLTH-10: Escalate-to-veterinarian triggers from observations

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 4 sources (3 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: Escalate-to-veterinarian triggers from observation records. (a) Any death without a known cause gives 'Call your veterinarian about a necropsy'. (b) Abortions or late pregnancy losses above the herd's own baseline give 'Call your veterinarian'. (c) Signs recorded in more than one animal of a group, or the same sign recurring, give 'Call your veterinarian'. Reportable diseases are left to the veterinarian, who reports to the state.

**Decision it supports.** When the manager should bring in the herd veterinarian, worded as observations, not diagnoses.

**Required inputs.** death records (date, group, ID, found-dead flag), abortion and loss records, herd baseline loss rate from past years, observation sign counts, herd vet contact.

**Where it applies.** Cattle class: Any group. Season: Any. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Loss and observation records; herd veterinarian.

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker health dispute 3: triggers (a) necropsy on an unexplained death (eXtension) and (b) losses above the herd's baseline (UNL 2023) stay B, but trigger (c) 'signs recorded in more than one animal of a group' has no source as a call-the-veterinarian threshold. The bundled rule takes the stricter class C.

**Evidence (research conclusion).** eXtension Beef Cattle: 'it is very important that any time an animal dies a necropsy is performed'. Without necropsy clues 'more animals may die'. UNL 2023 (Hille, Steffen): about 2-2.5% mid-to-late-term abortions expected in an average Nebraska herd. Published thresholds range from about 2% to 8%, so set your own from past records. 'If in doubt, call and discuss the situation with your veterinarian.' Keep the carcass cool until the veterinarian or lab can examine it, and obtain the placenta when possible. Record breeding, pregnancy and birth dates. SD ARSD 12:68:03:09: reportable diseases are reported 'immediately by telephone, fax, or writing' by licensed accredited veterinarians and diagnostic labs, not by producers. OSU and NDSU: pinkeye spreads through a herd within days.

**Corrections from the citation checks.**

- UNL 2023 (abortions): the source says to keep the carcass cool until the veterinarian or lab examines it and to obtain the placenta when possible; it does not say to keep the placenta cool.

**Limitations.** Thresholds for (b) and (c) are herd-specific and set with the veterinarian. The dashboard must not name a disease. The 'every death' necropsy guidance is strong, and some ranches will use judgment on cost.

**Configurable?** Yes (baseline rate, sign-count trigger). The 'call your veterinarian' wording should stay fixed.

**Missing data that should block a confident conclusion.** Without past-year loss records there is no baseline. Show raw counts and 'set a baseline with your veterinarian' instead of 'normal'.

**Recommendation.** Add deaths.csv or loss records and observation logs. The only action the dashboard gives on a health finding is 'record it and call your veterinarian'.

**Phase defer (Defer or exclude).** Needs loss and observation records. Wording stays observational; the veterinarian handles any state reporting.

**Sources.**

*Independent sources:*

- eXtension Beef Cattle (beef-cattle.extension.org), "What is causing my cattle to die suddenly?" (undated; data years n/a; extension). Checker: **verified**. <https://beef-cattle.extension.org/what-is-causing-my-cattle-to-die-suddenly>
  - Supports: Necropsy any time an animal dies. A veterinarian combines necropsy with history to reach a diagnosis.
- Nebraska Extension BeefWatch (M. Hille, D. Steffen), "Investigating the cause of cattle abortions: When to involve your veterinarian and what happens next" (published 2023-11-01; data years n/a; extension). Checker: **partly**. <https://beef.unl.edu/beefwatch/2023/investigating-cause-cattle-abortions-when-involve-your-veterinarian-and-what-happens/>
  - Supports: Baseline about 2-2.5% in Nebraska. Thresholds from 2-8%. Use the herd's own records. Call the vet when in doubt. What to save and record.
- Justia (reproducing South Dakota Administrative Rules), "SD Admin. Rules 12:68:03:09 List of reportable diseases" (current through SD Register Vol. 51 p.149, 2025-06-23; data years n/a; government agency). Checker: **verified**. <https://regulations.justia.com/states/south-dakota/title-12/article-12-68/chapter-12-68-03/section-12-68-03-09>
  - Supports: Licensed accredited veterinarians and diagnostic labs report listed diseases immediately. The board publishes the list each July 1.
- South Dakota Animal Industry Board, "SD Animal Industry Board - Veterinarians" (undated; data years n/a; government agency). Checker: **verified**. <https://aib.sd.gov/veterinarians.html>
  - Supports: Links the reportable disease list and gives the state veterinarian's contact. No producer reporting procedure on the page.

<a id="rule-hlth-12"></a>
##### RULE-HLTH-12: Herd veterinarian and VCPR currency

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 3 sources (3 verified; 0 vendor)

**Rule.** PROPOSED: Herd veterinarian and VCPR currency. Store the herd veterinarian's name and contact and the date of the vet's last visit to the premises. Show an info row when no visit is recorded within a ranch-set period. Escalation text uses the stored contact.

**Decision it supports.** Whether the ranch has a working vet relationship to escalate to and to authorize prescription, extralabel or VFD products.

**Required inputs.** vet_name, vet_phone, last_vet_premises_visit, state.

**Where it applies.** Cattle class: All classes. Season: Ranch-set review period. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Herd veterinarian contact and last premises visit.

**Classification: C (ranch-specific management choice).** Unchanged (research C).

**Evidence (research conclusion).** 21 CFR 530.3(i): the relationship 'can exist only when the veterinarian has recently seen and is personally acquainted with the keeping and care of the animal(s)… by medically appropriate and timely visits to the premises'. AVMA page: states may define 'timely', and the AVMA Model Act definition differs from the federal one. NAHMS Beef 2017 Report 2: 80.7% of cow-calf operations used a veterinarian for their cattle in 2017 (large operations 98.4%), so about 1 in 5 did not. The dashboard should not assume one.

**Limitations.** The dashboard cannot judge whether a VCPR is legally valid. It can only show the recorded facts.

**Configurable?** Yes (reminder period).

**Missing data that should block a confident conclusion.** No vet contact recorded means escalation rows say 'Call your veterinarian (no contact recorded)'.

**Recommendation.** Add a small config entry. Never present a VCPR as 'valid'. Present it as 'last vet visit recorded [date]'.

**Phase defer (Defer or exclude).** An information row; needs vet contact records.

**Sources.**

*Independent sources:*

- Cornell Legal Information Institute (reproducing the CFR), "21 CFR 530.3 Definitions" (undated on page; data years n/a; government agency). Checker: **verified**. <https://www.law.cornell.edu/cfr/text/21/530.3>
  - Supports: Recent examination or timely premises visits are a condition of a VCPR.
- American Veterinary Medical Association (atwork.avma.org; page does not name a publisher), "The veterinarian-client-patient relationship (VCPR)" (undated (mentions Model Act revisions 2003 and 2012); data years n/a; other publisher). Checker: **verified**. <https://atwork.avma.org/resources-tools/pet-owners/petcare/veterinarian-client-patient-relationship-vcpr>
  - Supports: VCPR elements including records and follow-up availability. The Model Act differs from 21 CFR 530.3(i). States may define 'timely'.
- USDA APHIS VS CEAH, National Animal Health Monitoring System, "Beef Cow-calf Health and Management Practices in the United States, 2017 (Beef 2017 Report 2)" (published 2021-05 (cover; suggested citation lists 2020); data years calendar year 2017; 24 states; government agency). Checker: **verified**. <https://www.aphis.usda.gov/sites/default/files/beef-2017-part2.pdf>
  - Supports: 80.7% of operations used a veterinarian in 2017 (Sec. I.D.4). 74.5% vaccinated any cattle (I.B.1.a). 20.8% vaccinated any cattle against pinkeye (Table I.B.1.c).

#### Deferred: Budget

<a id="rule-bud-07"></a>
##### RULE-BUD-07: Credits and refunds as separate signed rows

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 3 sources (2 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: Credits, refunds and rebates (warranty refunds, returned supplies, patronage or fuel-tax credits) are entered as separate signed rows with an entry_type. Net spend is used for variance, but gross spend and credits are shown separately. The period a credit lands in follows the declared accounting basis. Amounts use a plain minus sign ('-300'), not accounting parentheses.

**Decision it supports.** Whether an apparent improvement is real savings or a timing artefact of a refund.

**Required inputs.** entry_type (expense | refund | credit | rebate | tax_credit); signed amount; related month (accrual) or received month (cash); basis.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker budget dispute 5: only farm-use fuel tax credits (IRS Form 4136) and cash-versus-accrual timing (Penn State) are sourced. The entry_type list, the plain minus sign and the default of excluding tax credits from monthly fuel are format and policy choices.

**Evidence (research conclusion).** OBSERVED: BU-05 '(300)' on a Repairs row gives 'Repairs actual="9000(300)" pct=NaN' and the Repairs alert disappears. budget.materiality.research.mjs S4 'Fuel ... proposed ...: warning 15.0% and \$720 over includes \$300 of credits'. EXTERNAL: IRS Form 4136 (2024) lists 'Use on a farm for farming purposes' at \$.243/gal for undyed diesel (line 3b) and \$.183/gal for gasoline (line 1b). Penn State and OSU AGEC-753 describe adjusting cash expenses for timing (payables, prepaid).

**Limitations.** Whether to net a tax credit against monthly fuel depends on whether the budget was built net or gross of it. The research did not cover state fuel-tax refund rules for SD, NE or ND. Patronage refunds were not researched with a fetched source.

**Configurable?** Yes: netting policy per entry_type.

**Missing data that should block a confident conclusion.** An unparseable amount must block that category's conclusion and show 'unreadable amount', never NaN or silence.

**Recommendation.** Add entry_type and validate numeric amounts at load. Show 'includes \$X of credits' in the alert. Default to excluding tax credits from monthly fuel unless the budget assumed them.

**Phase defer (Defer or exclude).** Needs an entry_type column; phase 1 only rejects malformed amounts.

**Related.** Related findings (cross-reference made for this document): [BUD-02](02-findings.md#bud-02).

**Sources.**

*Independent sources:*

- Internal Revenue Service, "Form 4136 Credit for Federal Tax Paid on Fuels (2024)" (Form 4136 (2024); data years 2024 rates; government agency). Checker: **verified**. <https://irs.gov/pub/irs-prior/f4136--2024.pdf>
  - Supports: Line 1b gasoline on a farm for farming purposes \$.183; line 3b undyed diesel on a farm for farming purposes \$.243.
- Internal Revenue Service, "Instructions for Form 4136 and Schedule A (2025)" (published 2025 edition; page reviewed or updated 2026-04-30; data years n/a; government agency). Checker: **verified**. <https://www.irs.gov/node/40551>
  - Supports: Farm-use gasoline must have been used 'on a farm for farming purposes' during the period of claim, and the credit is claimed for a period. It is a separate claim, not a supplier credit.
- Penn State Extension (Miguel Antonio Saviroff), "Farm Accrual Adjustments to a Cash Basis Income Statement" (undated; data years n/a; extension). Checker: **partly**. <https://extension.psu.edu/farm-accrual-adjustments-to-a-cash-basis-income-statement>
  - Supports: Cash statements exclude unpaid expenses and mistime prepaid ones. Adjust for changes in accounts payable, prepaid expenses and supplies inventory.

<a id="rule-bud-08"></a>
##### RULE-BUD-08: Declare the accounting basis

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 4 sources (3 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: Declare the accounting basis (cash or accrual-adjusted) on the page. For operational monitoring prefer accrual-adjusted actuals (expense in the month the input was received or used), or at minimum flag prepaid and year-end purchases so they are not read as overruns.

**Decision it supports.** Whether a variance reflects operations or only payment timing (prepaying feed, paying a quarter's fuel bill late).

**Required inputs.** meta.basis; optional prepaid and payable adjustments per category and month; entry_type for prepayments.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** EXTERNAL: OSU AGEC-753 says FFSC recommends 'accrual adjusted' statements and that cash accounting 'can delay recognition of financial problems'. Penn State lists payables, prepaid and supplies inventory adjustments. ISU CALT says it is 'often beneficial' for cash-method farmers to prepay supplies, with a 50% limit. USU Rural Tax Education (revised Aug 2025) gives the same 50% limit and conditions. NOT OBSERVED in the repo: budget.csv has no basis field (inspected header 'month,category,budget,actual').

**Limitations.** Full accrual books are a heavy lift for small ranches. A pragmatic dashboard may stay cash basis with clear labelling and a prepaid flag.

**Configurable?** Yes (basis label; netting of prepaid).

**Missing data that should block a confident conclusion.** If the basis is unknown, label the variance 'basis not stated'. If a large prepaid row is present, avoid a serious call on that category until the manager tags it.

**Recommendation.** Add a basis field to meta.csv and show it next to the 'Spend vs budget' tile. Add entry_type 'prepaid' so prepayments are reported apart from operating overruns.

**Phase defer (Defer or exclude).** Needs meta.accounting_basis. Phase-1 copy may say 'accounting basis not stated (demo)' without adding the field.

**Sources.**

*Independent sources:*

- Oklahoma State University Extension, "Developing an Income Statement (AGEC-753)" (published 2021-02; data years n/a; extension). Checker: **verified**. <https://extension.okstate.edu/fact-sheets/developing-an-income-statement>
  - Supports: FFSC recommends accrual-adjusted statements. Cash accounting is simpler but can delay recognition of problems. Defines prepaid and payable adjustments.
- Penn State Extension, "Farm Accrual Adjustments to a Cash Basis Income Statement" (undated; data years n/a; extension). Checker: **partly**. <https://extension.psu.edu/farm-accrual-adjustments-to-a-cash-basis-income-statement>
  - Supports: Explicit expense adjustments for payables, prepaid expenses and supplies inventory.
- Iowa State University Center for Agricultural Law and Taxation (Kristine A. Tidgren), "End of Year Tax Planning Considerations for Farmers in 2021" (published 2022-01-01 (page date); data years tax year 2021; extension). Checker: **verified**. <https://www.calt.iastate.edu/post/end-year-tax-planning-considerations-farmers-2021>
  - Supports: Cash-method farmers often prepay supplies. 'Prepaid farm expenses cannot exceed 50% of other deductible farm expenses'.
- Rural Tax Education (Utah State University; Colorado State; University of Minnesota), "Prepaid Farm Expenses" (Revised 2025-08 (page dated 2025-08-18); data years n/a; extension). Checker: **verified**. <https://extension.usu.edu/ruraltax/tax-topics/prepaid-farm-expenses-2023>
  - Supports: 50% limit and the payment-not-deposit, business-purpose and no-material-distortion tests for prepaid feed and supplies.

<a id="rule-bud-09"></a>
##### RULE-BUD-09: Split fuel variance into price and volume

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 7 sources (5 verified, 2 partly; 0 vendor)

**Rule.** PROPOSED: Split fuel variance into price and volume (gallons x \$/gal). If price explains most of the overrun, the action is to reforecast or revisit purchasing. If volume does, check the use drivers (miles, hours, water hauling, feeding).

**Decision it supports.** Whether a fuel overrun is something the crew can manage (use) or a market condition to reforecast (price).

**Required inputs.** Gallons purchased or delivered per month by fuel type (dyed diesel, gasoline); actual \$/gal from invoices; planned gallons and planned \$/gal behind the budget; optional EIA regional reference price.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: B (context-dependent guidance).** Kept at B for the idea (checker budget dispute 6).

**Evidence (research conclusion).** OBSERVED (WebFetch of EIA monthly series): Midwest (PADD 2) No 2 diesel retail 2026 'Jan 3.444 ... Jun 4.984, Jul 4.825, Aug 5.417, Sep 6.351' vs 2025 'Jun 3.569 ... Sep 3.730'. Rocky Mountain (PADD 4) 2026 'Jun 4.989, Jul 4.790, Aug 5.415, Sep 6.155'. Weekly table: 'Midwest (PADD2) ... 10/12/26 6.259 ... year ago 2.653' (change). OBSERVED (node docs/audit/diagnostics/budget.fuel.pricevolume.research.mjs, hypothetical pricing at Jan-2026 EIA): 'season price variance \$4148 volume variance \$-2108 sum \$2040'. That is a D-class illustration only, because budget.csv has no gallons. EXTERNAL: extension machinery costing estimates fuel as quantity x price (MSU P3543: 0.044 gal/hp-hr x PTO hp x hours x price; ISU Edwards 2013: gal/acre x price). UNL, KSU and OSU budgets carry fuel as its own line (UNL 2026 'Fuel and energy' \$35/cow; KSU 'Fuel' \$20/cow and 'Utilities' \$14/cow; OSU 2026 stocker 'Machinery fuel, lube, repairs' \$29.37/head).

**Corrections from the citation checks.**

- The cited sources (MSU P3543, ISU) model fuel as quantity x price for ex-ante machinery costing; none describes price/volume variance analysis.
- EIA PADD 2 diesel peaked in May 2026 at 5.732, fell to 4.984 in June and 4.825 in July, then rose to 6.351 in September; 'rose sharply through the grazing season' holds only for a budget priced in January.

**Limitations.** EIA prices are on-highway retail including road taxes. Dyed farm diesel is priced differently, so EIA serves as an index, not the ranch's price. A WebFetch summarizer extracted the EIA numbers; a direct curl to eia.gov was refused by the session proxy (403), so the raw files were not independently downloaded.

**Configurable?** Yes: optional fields; the reference region (PADD 2 or 4) is selectable.

**Missing data that should block a confident conclusion.** Without gallons the dashboard must not claim a cause. It shows the dollar variance and says 'price vs use unknown: gallons not recorded'.

**Recommendation.** Add optional fuel_gallons and fuel_price fields (from delivery tickets). Show a price/volume split in the Fuel tooltip. Change the Fuel action text to 'check whether price or gallons drove it; reforecast if price'.

**Phase defer (Defer or exclude).** Needs gallons from delivery tickets.

**Sources.**

*Independent sources:*

- U.S. Energy Information Administration, "Midwest No 2 Diesel Retail Prices (Dollars per Gallon), monthly" (undated series page (fetched 2026-10-16); data years 2025-01 to 2026-09; government agency). Checker: **partly**. <https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EMD_EPD2D_PTE_R20_DPG&f=M>
  - Supports: Monthly PADD 2 diesel: 2026 Jan 3.444, Jun 4.984, Jul 4.825, Aug 5.417, Sep 6.351; 2025 Jun 3.569, Sep 3.730. The same 2026 series has a spring peak (Mar 4.785, Apr 5.246, May 5.732), so June-July prices were below May.
- U.S. Energy Information Administration, "Rocky Mountain No 2 Diesel Retail Prices (Dollars per Gallon), monthly" (undated series page (fetched 2026-10-16); data years 2025-01 to 2026-09; government agency). Checker: **verified**. <https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EMD_EPD2D_PTE_R40_DPG&f=M>
  - Supports: Monthly PADD 4 diesel: 2026 Jan 3.255, Jun 4.989, Jul 4.790, Aug 5.415, Sep 6.155.
- U.S. Energy Information Administration, "Gasoline and Diesel Fuel Update" (Release 2026-10-14 (next 2026-10-20); data years weeks of 2026-09-28, 10-05, 10-12; government agency). Checker: **verified**. <https://www.eia.gov/petroleum/gasdiesel/>
  - Supports: Weekly on-highway diesel incl. all taxes: Midwest 6.259 and Rocky Mountain 6.302 on 10/12/26, year-ago change +2.653 and +2.644.
- U.S. Energy Information Administration, "Diesel fuel price methodology" (undated (page shows release 2026-10-14); data years sample frame 2021; new sample effective 2022-06-13; government agency). Checker: **verified**. <https://www.eia.gov/PETROLEUM/GASDIESEL/diesel_methodology.php>
  - Supports: Monday 8 a.m. cash self-serve ULSD price incl. taxes; 590-outlet sample; published by PADD; Alaska and Hawaii excluded.
- Mississippi State University Extension (Jeff Johnson), "Farm Machinery Cost Calculations (P3543)" (revision code POD-10-23 (no explicit date shown); data years example prices only; extension). Checker: **partly**. <https://extension.msstate.edu/publications/farm-machinery-cost-calculations>
  - Supports: Fuel = 0.044 gal/hp-hr x PTO hp x annual hours x fuel price; lube about 15% of fuel; repairs from ASABE factors per 100 hours, or from records when available.
- Progressive Forage / AgProud (author William Edwards, Iowa State University), "Estimating costs for forage production machinery" (published 2013-09-30; data years example prices only; extension). Checker: **verified**. <https://agproud.com/articles/34062-estimating-costs-for-forage-production-machinery>
  - Supports: Fuel per acre from ISU A3-27 x fuel price (windrowing 0.45 gal/acre). Lubrication 10-15% of fuel.
- University of Nebraska-Lincoln Center for Agricultural Profitability / Nebraska Extension, "2026 UNL Livestock Jan-Dec, 400 Head Cow Herd, Northern Panhandle (sample economic budget)" (undated in PDF (landing page 'Updated July 2026'); data years 2026 prices; extension). Checker: **verified**. <https://cap.unl.edu/sites/unl.edu.ianr.agecon.center-for-ag-profitability/files/media/file/2026%20Northern%20Panhandle%20400%20Head%20Cow%20Herd%20budget.pdf>
  - Supports: 'Fuel and energy' \$14,000 (\$35/cow) for a 400-cow herd.

<a id="rule-bud-10"></a>
##### RULE-BUD-10: Treat repairs as lumpy

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 4 sources (3 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: Treat repairs as lumpy. Report large single repair events separately (by asset, with machine hours) from routine repairs. Phase known overhauls into the month they are planned. Judge repairs against the annual repair budget as well as season to date.

**Decision it supports.** Whether a repairs overrun is one breakdown (repair-versus-replace economics are out of scope) or a creeping pattern.

**Required inputs.** Repair events with date, asset_id, amount, planned/unplanned flag and hours or miles at repair; annual repair budget; phased plan.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** OBSERVED (budget.materiality.research.mjs S5): '2026-07 Repairs budget 1800 actual 2520 over \$720 (40.0%)' and '2026-09 Repairs budget 1800 actual 2880 over \$1080 (60.0%)', while season-to-date shows 25.0%. Spikes are visible only month by month. EXTERNAL: ISU A3-30 says 'repair costs tend to be quite variable from year to year' and that they 'eventually increase as parts wear out'. ISU (Edwards 2013): 'The best data for estimating repair costs are records of past repair expenses' and accumulated repair cost rises with accumulated hours. MSU P3543 uses ASABE repair factors per 100 hours. ND FME 2020 actual repairs \$49.09/cow; KSU default \$50/cow (2021); UNL 2026 \$38/cow.

**Limitations.** No source sets a dollar trigger for a 'large' single repair; that is ranch choice. Replacement economics are out of scope.

**Configurable?** Yes: single-event threshold, asset list.

**Missing data that should block a confident conclusion.** Without event-level records the dashboard can show only the monthly total and must not say 'one breakdown' vs 'pattern'.

**Recommendation.** Add an optional repairs_events.csv. In the Repairs alert, name the largest event in the period. Keep the category-level combined rule for severity.

**Phase defer (Defer or exclude).** Needs repair event records.

**Sources.**

*Independent sources:*

- Iowa State University Extension and Outreach (William Edwards), hosted copy on UVM blog, "Replacement Strategies for Farm Machinery (Ag Decision Maker A3-30 / PM 1860)" (Revised 2015-06; data years n/a; extension). Checker: **verified**. <https://blog.uvm.edu/groundwk/files/2016/05/Replacement-Strategies-for-Farm-Machinery.pdf>
  - Supports: Repair costs 'tend to be quite variable from year to year' and 'eventually increase as parts wear out'; breakdowns at critical times carry timeliness costs.
- Progressive Forage / AgProud (author William Edwards, Iowa State University), "Estimating costs for forage production machinery" (published 2013-09-30; data years n/a; extension). Checker: **verified**. <https://agproud.com/articles/34062-estimating-costs-for-forage-production-machinery>
  - Supports: Past repair records are the best estimate. Accumulated repair cost as a percent of list price rises with accumulated hours (about 2% at 600 hours, about 5% at 900 hours in the windrower example).
- Mississippi State University Extension, "Farm Machinery Cost Calculations (P3543)" (revision code POD-10-23 (no explicit date shown); data years example; extension). Checker: **partly**. <https://extension.msstate.edu/publications/farm-machinery-cost-calculations>
  - Supports: ASABE repair factor as percent of list price per 100 hours. Use actual repair records when available.
- Kansas State University Department of Agricultural Economics (AgManager.info), "Detailed Cow/Calf Budget" (Version 2021-09-01; data years 2021-2022 default prices; extension). Checker: **verified**. <https://agmanager.info/sites/default/files/pdf/Reid_Document_CowCalf.pdf>
  - Supports: Default 'Machinery, Facility/Equip. Repairs' \$50/cow; 'Fuel' \$20/cow; 'Utilities' \$14/cow (100-cow herd).

<a id="rule-bud-11"></a>
##### RULE-BUD-11: Record reforecasts

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 4 sources (3 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: Record reforecasts. Keep the original budget and add a reforecast (revised plan for the remaining months). Alert against the current approved plan, and always show the variance to the original as well.

**Decision it supports.** Re-planning the rest of the season after a known shift (price shock, drought feed, breakdown) without hiding the original commitment.

**Required inputs.** reforecast_usd per category per remaining month; reforecast date and author note.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: C (ranch-specific management choice).** CHANGED from A. Checker budget dispute 2: revising the budget mid-year is well supported (Edwards; TN Comptroller; FCSAmerica), but keeping the original and always showing variance to it, and alerting against the current approved plan, are design choices no cited source states.

**Evidence (research conclusion).** EXTERNAL: ISU (Edwards): 'You may even need to prepare a revised budget for the remainder of the year.' Tennessee Comptroller: 'It is very important to amend the budget throughout the year.' U Alberta requires a plan 'as an amendment to the budget' when an unfavorable year-end variance is expected. FCSAmerica: 'many producers update cash-flow projections quarterly or even monthly.' GFOA lists projections and forecasts as a basis of comparison. OBSERVED: the current serious action text says 'decide whether to re-forecast', but budget.csv has no column to record one (header 'month,category,budget,actual').

**Limitations.** The trigger for when to reforecast (e.g., two consecutive serious months, or a price index move) is ranch choice (C). A reforecast can mask overspending if the original is not shown.

**Configurable?** Yes.

**Missing data that should block a confident conclusion.** None. Without a reforecast, compare to the original.

**Recommendation.** Add an optional reforecast column, show 'vs original' and 'vs reforecast' in the budget table, and once a reforecast is recorded change the action text to point at it.

**Phase defer (Defer or exclude).** Needs a reforecast column.

**Sources.**

*Independent sources:*

- Progressive Dairy / AgProud (author William Edwards, Iowa State University), "Twelve steps to cash flow budgeting (excerpt of ISU Ag Decision Maker)" (published 2010-11-12; data years n/a; extension). Checker: **verified**. <https://agproud.com/articles/29923-twelve-steps-to-cash-flow-budgeting>
  - Supports: Revise the budget for the remainder of the year when prices, costs or plans change.
- Tennessee Comptroller of the Treasury, "Steps to a Well-Managed Budget" (Last modified 2025-01-30; data years n/a; government agency). Checker: **verified**. <https://comptroller.tn.gov/office-functions/lgf/budgets/municipalities-counties-metros-utilities/general-guidance/steps-to-a-well-managed-budget0.html>
  - Supports: Amend the budget throughout the year; review budget-to-actual frequently.
- Farm Credit Services of America, "Cash-flow Budgeting: About Amount and Timing" (published 2024-01-10; data years n/a; other publisher). Checker: **verified**. <https://www.fcsamerica.com/resources/learning-center/cash-flow-budgeting-about-amount-and-timing>
  - Supports: Lender guidance (Farm Credit Services of America; its service area is not stated on this page): 'many producers update cash-flow projections quarterly or even monthly.'
- University of Alberta (UAPPOL), "Budget Variance Accountability Procedure" (Approved 2006-07-17; editorial amendments 2025-05-20; data years n/a; other publisher). Checker: **partly**. <https://ualberta.ca/en/alfresco/uappol/finance/budget-variance-accountability/procedure/budget-variance-accountability-procedure.pdf>
  - Supports: Expected unfavorable variance requires a remedial plan submitted as a budget amendment (s.1.g; a university deficit-funding plan, not a ranch reforecast).

<a id="rule-bud-12"></a>
##### RULE-BUD-12: Align categories with extension and ERS cost categories

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 8 sources (8 verified; 0 vendor)

**Rule.** PROPOSED: Align budget categories with standard extension and ERS cost categories, and separate operating from capital and cash from non-cash (unpaid family labor, depreciation). The dashboard's 'Water and fencing' should state whether it means repairs and supplies or new construction.

**Decision it supports.** Whether the category totals can be compared with extension benchmarks and read by an outside reviewer (lender, owner).

**Required inputs.** Category list with a mapping to standard categories; an operating/capital flag; a cash/non-cash flag.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** EXTERNAL: ERS direct-cost items: 'Purchased feed', 'Veterinary and medicine', 'Bedding and litter', 'Marketing', 'Custom services', 'Fuel, lube, and electric', 'Repairs'. Also unpaid labor, operating interest, capital recovery, overhead, taxes and insurance. UNL 2026: feed lines, 'Veterinary and health', 'Labor, paid' / 'Labor, unpaid', 'Fuel and energy', 'Repairs and maintenance', 'Supplies', 'Marketing', interest, overhead, depreciation, opportunity costs. KSU 2018: 'Utilities, Gas, Fuel, Oil'; 'Machinery, Facility/Equipment Repairs'. ISU 2016: 'Machinery, equipment, fuel and repairs' as one line. OBSERVED: the dashboard uses six categories (Feed and mineral, Fuel, Repairs, Vet and health, Labor, Water and fencing). INFERENCE (not validated): fictional Fuel \$9,600 for Jun-Sep over 375 head is about \$25.60/head for four months, above whole-year per-cow defaults (KSU \$20 fuel, 2021; UNL \$35 fuel and energy, 2026; ND FME \$18.73 actual, 2020). It is plausible only with haying, hauling and 2026 diesel prices. The data is fictional and remains labelled so.

**Corrections from the citation checks.**

- ERS 'Plains' (KS, NE, ND, OK, SD, TX) does not match farms.com's 'Northern Great Plains'; the mismatch is unresolved.

**Limitations.** Extension budgets are annual, per-cow, economic budgets (including non-cash opportunity costs). A monthly cash monitor uses a subset of their categories.

**Configurable?** Yes: category mapping table.

**Missing data that should block a confident conclusion.** An unmapped category can still be monitored but should be excluded from benchmark comparisons.

**Recommendation.** Add a category-to-standard mapping in README or data. Keep unpaid labor and depreciation out of the monthly cash monitor (or label them). Mark capital purchases so they don't trigger operating overruns. Investment analysis is out of scope for this dashboard.

**Phase defer (Defer or exclude).** Category mapping and a capital/operating split; not needed for the demo's six categories.

**Sources.**

*Independent sources:*

- USDA Economic Research Service, "Commodity Costs and Returns: Documentation" (Updated 2026-03-18; data years Cow-calf ARMS survey years 1980, 1985, 1990, 1996, 2008, 2018; indexed between surveys; government agency). Checker: **verified**. <https://www.ers.usda.gov/data-products/commodity-costs-and-returns/documentation>
  - Supports: Standard livestock cost items including 'Fuel, lube, and electric' and 'Repairs'. The Plains region includes KS, NE, ND, OK, SD, TX.
- USDA Economic Research Service, "Commodity Costs and Returns" (Recent files last updated 2026-10-01; next update 2027-05-03; data years recent estimates (years not listed on page); government agency). Checker: **verified**. <https://www.ers.usda.gov/data-products/commodity-costs-and-returns>
  - Supports: Cow-calf recent estimates are available as XLSX and CSV.
- University of Nebraska-Lincoln Center for Agricultural Profitability, "Nebraska Cattle Budgets - Northern Panhandle" (Updated July 2026; data years 2026 budgets; extension). Checker: **verified**. <https://cap.unl.edu/cattlebudgets/northern-panhandle/>
  - Supports: Budget includes feed, vet, labor, fuel, marketing, machinery and facility costs (fuel, repairs, depreciation), overhead. About 400 cows.
- SDSU Extension (Heather Gessner), "Beef Cattle Budgets" (Updated 2026-05-22; data years not stated; extension). Checker: **verified**. <https://extension.sdstate.edu/beef-cattle-budgets>
  - Supports: South Dakota spreadsheet tool (P-00143-2026.xlsx). Feed is 'The most significant component of every cattle budget'. Items include fuel or trucking, water and electricity overhead, fence and building maintenance, veterinary and breeding. The spreadsheet itself was not opened.
- Kansas State University Department of Agricultural Economics, "KSU Beef Cow-Calf Budget, 2018 Production Year" (Version 2017-12-15; data years Prices as of 2017-12-04; KFMA data (95 farms, avg 133 cows); extension). Checker: **verified**. <https://www.agmanager.info/sites/default/files/pdf/KSU%20Beef%20CowCalf%20Budget.pdf>
  - Supports: Categories: 'Utilities, Gas, Fuel, Oil' \$28/cow; 'Machinery, Facility/Equipment Repairs' \$40/cow; Labor \$160; Vet \$30, and others.
- Oklahoma State University Agricultural Economics, "Stocker Enterprise Budget: 100 Steers, 2026 Planning Budget" (File dated 2025-12-02; data years 2026 planning prices; extension). Checker: **verified**. <https://extension.okstate.edu/programs/farm-management-and-finance/budgets/sample-budgets/site-files/docs/2026-sample-budgets/2026-stockers-a.pdf>
  - Supports: Stocker categories: pasture, hay, vet services and supplies, marketing, 'Machinery fuel, lube, repairs' \$29.37/head, labor, interest. 105-day Nov-Mar season.
- Iowa State University Extension (Ellis and Schulz), hosted copy at Purdue, "Livestock Enterprise Budgets for Iowa - 2016 (FM 1815, Ag Decision Maker B1-21)" (Revised 2016-06; data years 2016; extension). Checker: **verified**. <https://www.ansc.purdue.edu/SP/TBC/assets/b1-21-iowa-budgets-edited.pdf>
  - Supports: Cow-calf variable costs: feed, veterinary and health, 'Machinery, equipment, fuel and repairs', marketing, interest, labor. 'expected costs ... based on past results should be substituted whenever possible.'
- Farms.com (Will Secor), "Cow-Calf Costs and Returns Update" (published 2026-01-08; data years 2024 (USDA estimates); other publisher). Checker: **verified**. <https://www.farms.com/news/cow-calf-costs-and-returns-update-236952.aspx>
  - Supports: Northern Great Plains had the highest cow-calf operating costs at \$952/cow in 2024 (US average \$691).

<a id="rule-bud-13"></a>
##### RULE-BUD-13: Show large under-spends as information

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 1 source (1 partly; 0 vendor)

**Rule.** PROPOSED: Show favorable (under-budget) variances informationally when both percent and dollars are large, with a 'timing or saving?' prompt. This gives no severity and no diagnosis.

**Decision it supports.** Whether underspending reflects real savings or deferred work (e.g., postponed repairs, or scheduled health work not yet done per the health records).

**Required inputs.** Same as the overrun rule; a link to the health task schedule and repair records for context.

**Where it applies.** Cattle class: Not animal-specific (operating budget by category). Season: Season to date (demo: monthly rows June-September 2026). Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Monthly phased budget by category; actuals entered when the month's books close.

**Classification: C (ranch-specific management choice).** Unchanged (research C). Checker budget dispute 3: the cited U Alberta support ('favorable variances also require explanation') is wrong, so that source is rejected for this rule.

**Evidence (research conclusion).** OBSERVED (budget.fuel.pricevolume.research.mjs): 'Labor over \$ -1741 -4.8% of category'; 'Water and fencing over \$ -343 -7.1% of category'. The current rule ignores these. EXTERNAL: GFOA asks why deviations occurred, in either direction. (U Alberta's favorable threshold, 5% or \$500,000, governs year-end carry-forward plans, not explanations or monthly alerts; it is rejected as support for this rule.)

**Limitations.** No ranch source sets an underspend trigger. Overuse would add noise to the exception table.

**Configurable?** Yes.

**Missing data that should block a confident conclusion.** Same as overruns.

**Recommendation.** Show underspend in the budget table (already shown as a negative difference) and optionally as an info-level row. Never make it 'serious'.

**Phase defer (Defer or exclude).** Information only; not in the phase lists.

**Related.** Related findings (cross-reference made for this document): [BUD-07](02-findings.md#bud-07).

**Sources.**

*Independent sources:*

- Government Finance Officers Association (GFOA), "Budget Monitoring (best practice)" (Board approved 2018-03-31; data years n/a; other publisher). Checker: **partly**. <https://gfoa.org/materials/budget-monitoring>
  - Supports: Analyze why deviations occurred and whether they will continue.

*Not accepted as support (the checker found the page does not support the claim):*

- University of Alberta (UAPPOL), "Budget Variance Accountability Procedure". <https://ualberta.ca/en/alfresco/uappol/finance/budget-variance-accountability/procedure/budget-variance-accountability-procedure.pdf> Cited for: Favorable variances also require explanation above a threshold. Checker (cite_budget.json checked[2]): This entry covers the favorable-variance rule's source claim 'Favorable variances also require explanation above a threshold', and the total_season_budget_usd field. The source does not say that. Section 1.c requires a carry-forward request and 'a plan, as an amendment to the budget, for the use of these funds'. It does not require an explanation of the variance. On the field: the 5% is a share of the unit's own revised budget, used as a year-end carry-forward allowance. Nothing in the document scales dollar floors as a share of an organization-wide total. The reforecast rule's claim is supported: s.1.g says a unit expecting a deficit 'must submit a plan, as an amendment to the budget, to the appropriate Vice-President at the earliest possible opportunity'.

#### Deferred: Context and later modules

<a id="rule-ctx-04"></a>
##### RULE-CTX-04: State pasture and range condition (NASS)

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 5 sources (5 verified; 0 vendor)

**Rule.** PROPOSED: Show state-level NASS Crop Progress pasture and range condition (% very poor+poor and % good+excellent) with its week-ending date, as regional context only. No threshold triggers an exception.

**Decision it supports.** Whether the ranch's own forage picture is out of line with the state

**Required inputs.** State; weekly NASS pasture & range condition; week-ending date; release time

**Where it applies.** Cattle class: Not animal-specific (regional public context). Season: Any; weekly or seasonal public products. Geography: The ranch's county (demo: a named stand-in county, labelled as such). Management: Dated build-time snapshot pinned to as_of; never live in the demo.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** KS weekly, July 6 2026: 'Pasture and range conditions rated 5% very poor, 10% poor, 29% fair, 46% good, and 10% excellent'. SD weekly, Sept 12 2022: '24% very poor, 29% poor, 31% fair, 15% good, and 1% excellent'. Both say data were 'provided at the county level by USDA Farm Service Agency' and Extension reporters. NASS 2007: estimates 'are released after 4:00 pm ET on the first business day of the week'. NASS 2019 program review: 'Each state maintains a list of reporters, largely extension agents and Farm Service Agency staff'.

**Limitations.** Reporter judgement, state aggregate, seasonal. I did not verify the exact April-November window in this pass. The Quick Stats API needs a key (rnassqs vignette: 'the QuickStats API requires authentication'; 50,000-record limit), and the key would be exposed in browser JS.

**Configurable?** Any alert threshold would be a ranch choice (C); the display itself needs none.

**Missing data that should block a confident conclusion.** Off-season or missing week: show 'no report for week ending X'. Do not carry the last value forward silently.

**Recommendation.** Optional, low priority. If used, fetch at build time with the key in a GitHub Actions secret.

**Phase defer (Defer or exclude).** NASS Quick Stats needs an API key (a build-time secret); low priority.

**Sources.**

*Independent sources:*

- USDA NASS Kansas Field Office, "Kansas Crop Progress and Condition, week ending July 5, 2026" (published 2026-07-06; data years 2026; government agency). Checker: **verified**. <https://www.nass.usda.gov/Statistics_by_State/Kansas/Publications/Crop_Progress_and_Condition/2026/KS-weekly0706.pdf>
  - Supports: Format of state pasture & range condition; county-level reporters
- USDA NASS, "South Dakota Crop Progress and Condition, week ending Sept 11, 2022" (published 2022-09-12; data years 2022; government agency). Checker: **verified**. <https://www.nass.usda.gov/Statistics_by_State/South_Dakota/Publications/Crop_Progress_&_Condition/2022/SD-weekly0912.pdf>
  - Supports: SD statewide pasture/range and topsoil moisture ratings; SDSU Extension and FSA reporters
- USDA NASS (ESMIS), "Crop Progress, Nov 26 2007" (published 2007-11-26; data years 2007; government agency). Checker: **verified**. <https://esmis.nal.usda.gov/sites/default/release-files/8336h188j/sx61dn51w/m039k649s/CropProg-11-26-2007.txt>
  - Supports: 'released after 4:00 pm ET on the first business day of the week'
- USDA NASS, "Crop Progress and Condition Program (Program Review)" (published 2019-04; data years n/a; government agency). Checker: **verified**. <https://www.NASS.USDA.gov/Surveys/Program_Review/2019/Crop-Progress-and-Condition-Program.pdf>
  - Supports: Reporter network; condition category definitions
- rOpenSci, "Using rnassqs" (rnassqs v0.6.4, 2026-09-29; data years n/a; other publisher). Checker: **verified**. <https://docs.ropensci.org/rnassqs/articles/rnassqs.html>
  - Supports: Quick Stats API key required; 50,000-record limit

<a id="rule-ctx-05"></a>
##### RULE-CTX-05: Grass-Cast production outlook

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 6 sources (5 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: Show the Grass-Cast seasonal grassland production outlook (% above or below the grid cell's \~38-year average) with its map date. Context only; never the sole basis for stocking.

**Decision it supports.** Early-season forage expectation feeding drought-plan trigger dates and stocking reviews

**Required inputs.** Ranch location (grid cell or county); Grass-Cast map date and scenario; season window

**Where it applies.** Cattle class: Not animal-specific (regional public context). Season: Any; weekly or seasonal public products. Geography: The ranch's county (demo: a named stand-in county, labelled as such). Management: Dated build-time snapshot pinned to as_of; never live in the demo.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** About page: 'Grass-Cast is updated every two weeks to incorporate newly observed weather data'; 10 km grid cells; 'Producers should not rely on Grass-Cast as a sole source for making management decisions'. Climate Hubs: first published typically late April; 'provides forecast information only for vegetation quantity, not quality'. Home page: 'As of August 31, 2026, all relevant precipitation data have been observed for the 2026 Grass-Cast season.' FAQ: 'most accurate in grid cells that are dominated by grass species'. Developer PDF: Grass-Cast 'knows Total Production Loss' not 'Grazing Loss' and reports 60-80% accuracy. That accuracy figure is the developers' own; no independent validation was found in this pass, and the 2021 user-report PDF was robots-blocked.

**Corrections from the citation checks.**

- Grass-Cast pages are product documentation, not field studies (kind corrected).
- The annual grid download is XLSX; the CC BY licence belongs to the related data.gov research database and is not stated on the Grass-Cast data page.

**Limitations.** Maps are images. Downloads are historical (CSV for county and average grid, 1981-2018; the annual grid, 1982-2019, is XLSX), not the current forecast. No API. Cannot separate desirable from undesirable species. Does not account for local grazing history.

**Configurable?** Which scenario to show (above/near/below-normal precipitation) is a user choice.

**Missing data that should block a confident conclusion.** Out of season: show the final map with 'season closed', or nothing. No location means no panel.

**Recommendation.** Optional. Snapshot the relevant season value manually or at build time with the map date. Do not scrape images in the browser.

**Phase defer (Defer or exclude).** Seasonal context only; not one of the three phase-3 items.

**Sources.**

*Independent sources:*

- USDA Climate Hubs (Northern Plains), "Grass-Cast: Grassland Productivity Forecast" (undated; data years 1982-present baseline; government agency). Checker: **verified**. <https://www.climatehubs.usda.gov/hubs/northern-plains/tools/grass-cast-grassland-productivity-forecast>
  - Supports: Late-April start; quantity not quality; not a sole source for stocking rates

*Product documentation (an agency or university describing its own product; not independent validation):*

- National Drought Mitigation Center / USDA / Colorado State Univ. / Univ. of Arizona, "About Our Maps (Grass-Cast)" (undated (examples from 2019); data years \~38-year baseline). Checker: **verified**. <https://grasscast.unl.edu/Outlook/About.aspx>
  - Supports: Biweekly updates, 10 km cells, not a sole decision source
- National Drought Mitigation Center, "Grass-Cast home" (undated (states 'As of August 31, 2026'); data years 2026 season). Checker: **verified**. <https://grasscast.unl.edu/>
  - Supports: 2026 season final as of Aug 31
- National Drought Mitigation Center, "Grass-Cast Data" (undated; data years 1981-2019). Checker: **partly**. <https://grasscast.unl.edu/Data.aspx>
  - Supports: Only historical CSV/XLSX/shapefile downloads
- National Drought Mitigation Center, "Grass-Cast FAQ" (undated; data years n/a). Checker: **verified**. <https://grasscast.unl.edu/FAQ.aspx>
  - Supports: Accuracy best in grass-dominated cells; general vegetation not grass-only
- Grass-Cast / NDMC, "Examples of Total Production vs Grazing Production" (undated; data years n/a). Checker: **verified**. <https://grasscast.unl.edu/docs/Examples-of-Total-Production-vs-Grazing-Production.pdf>
  - Supports: Total vs grazable production; developer-reported 60-80% accuracy

<a id="rule-ctx-06"></a>
##### RULE-CTX-06: RAP production history per pasture

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 4 sources (4 verified; 0 vendor)

**Rule.** PROPOSED: Show RAP annual herbaceous production (lbs/acre) history per pasture polygon as retrospective context. Use it to sanity-check planned_graze_days, not to judge the current season.

**Decision it supports.** Whether a pasture's planned graze days are consistent with its production history; spotting long-run decline

**Required inputs.** Pasture polygons (GeoJSON, EPSG:4326); RAP productionV3 results by year

**Where it applies.** Cattle class: Not animal-specific (regional public context). Season: Any; weekly or seasonal public products. Geography: The ranch's county (demo: a named stand-in county, labelled as such). Management: Dated build-time snapshot pinned to as_of; never live in the demo.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** RAP API doc: POST a GeoJSON Feature to 'https://us-central1-rap-data-365417.cloudfunctions.net/productionV3'; 'Valid years run from 1986 through the previous year'; results are a weighted mean over the pixels. Products page: 16-day current-year estimates 'are provisional and will be recalculated at the end of the year'. Production comes from a process-based model, so 'traditional error metrics such as RMSE are not available'. Cover MAE is 2.6% (tree) to 10.2% (perennial forb/grass). TOS (last updated Sept 11 2024): AS IS, no warranty.

**Limitations.** Through the API, the current year is not available. Model estimates; no ground truth on this ranch. The ranch is fictional, so it has no real polygons.

**Configurable?** Mask flag (exclude cropland/water); year range

**Missing data that should block a confident conclusion.** No polygons means no RAP. Do not substitute a county average for a pasture.

**Recommendation.** Defer. Worthwhile only with real pasture boundaries; for this fictional demo it would imply a real place. If used, fetch once offline and commit with provenance.

**Phase defer (Defer or exclude).** Needs real pasture polygons, which the fictional ranch lacks.

**Sources.**

*Independent sources:*

- Rangeland Analysis Platform (USDA ARS and partners), "RAP API Documentation" (undated; data years 1986-previous year; government agency). Checker: **verified**. <https://rangelands.app/support/71-api-documentation>
  - Supports: Endpoints, POST GeoJSON, year range, tile URLs
- Rangeland Analysis Platform, "RAP Products" (undated; data years 1986-present; government agency). Checker: **verified**. <https://rangelands.app/products>
  - Supports: Provisional 16-day data; not for cropland; cover MAE
- Rangeland Analysis Platform, "RAP Terms of Service" (published 2024-09-11; data years n/a; government agency). Checker: **verified**. <https://rangelands.app/tos/>
  - Supports: AS IS / no warranty
- CRAN (A. Brown), "rapr README" (rapr 1.1.0 (2025); data years 1986-present (30 m), 2018-present (10 m); other publisher). Checker: **verified**. <https://cran.r-project.org/web/packages/rapr/readme/README.html>
  - Supports: Units lbs/acre; 30 m and 10 m sources

<a id="rule-ctx-07"></a>
##### RULE-CTX-07: Heat-stress days from a dated forecast snapshot

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 11 sources (10 verified, 1 partly; 0 vendor)

**Rule.** PROPOSED: heat-stress days. From a dated forecast snapshot, show the USDA-ARS breathing-rate heat category (Normal, Alert, Danger, Emergency) as information. On days at or above a ranch-set heat level: (a) schedule an in-person water check for every tank with cattle on it, whatever the sensor shows, and record who checked and what they saw; (b) warn when a planned gather or processing task falls in a period with forecast THI at or above 84 (the BQA handling rule of thumb) and suggest working early in the day; (c) show the category beside planned gathers and moves. Never use NWS HeatRisk for cattle ([RULE-CTX-08](#rule-ctx-08)).

**Decision it supports.** [context research rule 6] Rescheduling cattle work and moves, and checking water, on hot days | [water research rule 10] Crew scheduling. Confirms sensor data against reality. | [health research rule 8] Picking a day and time to gather and work cattle that keeps heat and handling stress low.

**Required inputs.** [context research rule 6] Location (lat/lon); NWS hourly forecast; planned work/move dates; cattle class | [water research rule 10] Forecast high (public dataset), tanks with cattle present, check log (manual observation). | [health research rule 8] planned work date and start/end time, location, hourly forecast temperature and relative humidity (or dewpoint), and THI computed from them.

**Where it applies.** Cattle class: All classes on pasture; handling days for any group. Season: Summer (mainly June-August in the Northern and Central Plains). Geography: Northern and Central Plains; the ARS model was built for feedlot cattle. Management: Forecast snapshot plus ranch-set heat level; planned work periods.

**Classification: C (ranch-specific management choice).** CHANGED from B (all three research rules). Checker water dispute 4: no source gives a single trigger temperature for pasture cattle, so the heat-day water check's operative parameter is a ranch choice. Checker context dispute 2: the ARS breathing-rate maps were designed for cattle feeders; warning on Danger days is a ranch choice and B fits only the category display. THI 84 is a BQA rule of thumb for handling (B). The merged rule takes the stricter class C.

**Evidence (research conclusion).** [context research rule 6] The ARS 'Forecasting Heat Stress' page gives the equation and category table (Last Modified 8/12/2016). It suggests \~1000 W/m2 if no solar data and says the maps are 'an estimate of general trends' and 'cannot predict individual animal stress levels since there is much variability among animals'. The ARS index region page lists 7-day regional maps (Last Modified 7/26/2017); the forecast date is only in an image, which I could not read (forecastDate.png robots-blocked; curl to www.marc.ars.usda.gov returned 'CONNECT tunnel failed, response 403'). Farm Progress (2020-07-08) and Drovers (2020-11-12) describe 7-day maps from NWS inputs. Drovers adds risk factors: 'high overnight lows (above 70 F)', low air movement, recent rain, and advises avoiding moving cattle during heat events. | [water research rule 10] NDSU (Hoppe): in 100F weather, daily checks 'may not be often enough'. Bartlett: hot weather can more than double needs. UNL BeefWatch (2024) and PREEC (2025) describe cameras and sensors as aids, without validated outcomes. The USDA ARS MARC heat stress forecast uses NWS 7-day forecasts (Normal, Alert, Danger, Emergency by predicted respiration rate), but it was built for feedlot cattle. | [health research rule 8] BQA Manual (p.27 per fetch): 'a general rule is to work them before the temperature humidity index (THI) reaches 84'. Avoid handling when heat-stress risk is high. Work heat-prone cattle first or earlier. UNL BeefWatch 2018 (Eirich, Woolsoncroft): 'Plan to handle cattle before 8:00 a.m. and never after 10:00 a.m. during summer months'. Core temperature peaks about 2 h after air temperature and takes 4-6 h to return. Keep holding to about 30 minutes or less. UNL IANR 2016 gives the same 8 a.m. / 10 a.m. guidance and says 'Work cattle slowly and use low-stress handling techniques.' USDA ARS MARC heat-stress forecast maps use NWS 7-day forecasts and are framed for feedlot cattle.

**Corrections from the citation checks.**

- The weather.gov documentation does not support 'several times daily' as the refresh rate for a forecast THI field.
- The ARS region-maps page does not support 'daily' updates; press coverage differs on cadence.
- The ARS maps estimate breathing rate for 'cattle in a feedlot'; applying them to pasture cattle is extrapolation.

**Limitations.** [context research rule 6] Whether the ARS maps are still published in 2026 is UNVERIFIED. Category boundaries at exactly 110 and 130 are ambiguous on the page. Cloud cover to solar conversion is an approximation. Night-time cooling and coat colour are not in the equation. | [water research rule 10] The trigger temperature is a ranch choice. I found no source that gives a single trigger temperature for pasture cattle. | [health research rule 8] THI leaves out wind and solar load. The ARS model is for feedlot cattle and estimates general trends, not individual animals. Forecasts are uncertain. The two UNL summaries differed on evening handling, so no evening rule is proposed.

**Configurable?** [context research rule 6] Category cut-offs should stay as published. Which events trigger a warning (gathers, moves, shipping) is a ranch choice. | [water research rule 10] Yes. | [health research rule 8] Yes: THI cut-off, time window, whether to use a forecast at all.

**Missing data that should block a confident conclusion.** [context research rule 6] No forecast or no location means no heat panel. Do not show 'Normal' by default. Off-season (as_of Sept 30), suppress the panel instead of showing an empty one. | [water research rule 10] If no forecast is available, keep the routine check schedule and say the heat adjustment is unavailable. | [health research rule 8] With no forecast available, show 'no forecast: check conditions on the day' and do not label the day safe.

**Recommendation.** [context research rule 6] Optional and seasonal. Compute at build time from an NWS forecast snapshot; label it 'estimate of general trend, not individual animals'. | [water research rule 10] Add a 'checked by eye' log. Show the last visual check per tank next to the sensor reading. | [health research rule 8] Optional phase-2 feature using the NWS API. For the static demo, any forecast must be clearly labelled synthetic.

**Phase defer (Defer or exclude).** Needs a dated weather-forecast snapshot; live integrations are deferred. Could later run on a manually entered forecast high.

**Sources.**

*Independent sources:*

- USDA ARS U.S. Meat Animal Research Center, Clay Center NE, "Forecasting Heat Stress" (Last Modified 2016-08-12; data years solar example 2001; cited papers 2005; government agency). Checker: **verified**. <https://www.ars.usda.gov/plains-area/clay-center-ne/marc/documents/heat-stress/forecastingheatstress/>
  - Supports: Breathing-rate equation, categories, caveats | 7-day NWS-based maps, breathing-rate categories (&lt;90 normal, 90-110 alert, 110-130 danger, >130 emergency). For feedlot cattle; general trends only. | 7-day maps from NWS forecasts with categories Normal (&lt;90 bpm), Alert, Danger and Emergency (>130 bpm). Framed for feedlot cattle. Does not predict individual animals.
- USDA ARS USMARC, "Heat Stress Forecast Maps (regions)" (Last Modified 2017-07-26; data years unknown (date only in image); government agency). Checker: **partly**. <https://www.ars.usda.gov/plains-area/clay-center-ne/marc/documents/heat-stress/indexregion>
  - Supports: 7-day regional maps exist; current status unverified
- Farm Progress, "USDA issues heat stress forecasts" (published 2020-07-08; data years n/a; other publisher). Checker: **verified**. <https://www.farmprogress.com/weather/usda-issues-heat-stress-forecasts>
  - Supports: 7-day horizon; NWS inputs
- Drovers (R. Brooks), "Worried about potential heat stress? Consult these forecast maps" (published 2020-11-12; data years n/a; other publisher). Checker: **verified**. <https://www.drovers.com/markets/worried-about-potential-heat-stress-consult-these-forecast-maps>
  - Supports: Risk factors (overnight lows >70 F); avoid moving cattle in heat events
- NOAA National Weather Service, "NWS API Web Service documentation" (Known issues 'Updated 3/24/2026'; data years n/a; government agency). Checker: **verified**. <https://www.weather.gov/documentation/services-web-API>
  - Supports: Hourly forecast endpoint, User-Agent required, open data
- NDSU Agriculture Communication, "Water Essential for Cattle in High Heat" (undated on page (URL path 2007-07-26); data years n/a; extension). Checker: **verified**. <https://www.ag.ndsu.edu/news/newsreleases/2007/july-26-2007/water-essential-for-cattle-in-high-heat>
  - Supports: Cattle can drink 20+ gal/day in heat. Daily checks may not be enough at 100F. Spring-fed ponds can go dry within a day.
- Nebraska Extension BeefWatch (Aquino and Xiong), "Using technology to monitor water on the ranch" (published 2024-03-27; data years n/a; extension). Checker: **verified**. <https://beef.unl.edu/beefwatch/2024/modern-water-monitoring-technology-ranch>
  - Supports: Survey of options (cameras \$400-700, drones, stand-alone monitors from Ranchbot, Gallagher and Lonestar, integrated systems). Cameras see only their field of view. No formal evaluation.
- Nebraska Extension (Aaron Berger), PREEC news, "Cameras and Cellular Technology: Checking water from afar" (published 2025-04-23; data years n/a; extension). Checker: **verified**. <https://preec.unl.edu/news/cameras-and-cellular-technology-checking-water-afar>
  - Supports: Cellular cameras, pipeline pressure sensors and ultrasonic level sensors. Solar panels and high-gain antennas for reliability. No outcome measurements.
- Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor), "Beef Quality Assurance National Manual (bqa_manual_final.pdf)" (undated (no date in the PDF; newest data cited are the 2016 NBQA, a 2018 footnote and a 1998-2017 series). Likely superseded: NCBA announced an updated manual on 2024-12-19 (2025-01-06 is a trade-press reprint date), and bqa.org now links a 2026 edition that could not be fetched.; data years newest data cited: 2016 National Beef Quality Audit; a 1998-2017 series; standard or specification). Checker: **verified**. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf>
  - Supports: Work cattle before THI reaches 84 (Ch.2 Temperature Conditions, p.27 per fetch). Low-stress handling (p.44).
- University of Nebraska-Lincoln BeefWatch (Eirich, Woolsoncroft), "Heat Stress: Handling Cattle Through High Heat Humidity Indexes" (published 2018-08-01 (archived story); data years n/a; extension). Checker: **verified**. <https://newsroom.unl.edu/announce/beef/8200/47172>
  - Supports: Handle before 8 a.m. and never after 10 a.m. in summer. Core temperature lag and 4-6 h recovery. Small groups with holding of about 30 minutes or less.
- University of Nebraska-Lincoln IANR News (no writer named; quotes R. Eirich), "Extension educator offers tips on handling cattle in hot weather" (published 2016-05-31; data years n/a; extension). Checker: **verified**. <https://ianrnews.unl.edu/extension-educator-offers-tips-handling-cattle-hot-weather>
  - Supports: Handle before 8 a.m. Low-stress handling. Process in small batches.

<a id="rule-ctx-08"></a>
##### RULE-CTX-08: Do not use NWS HeatRisk for cattle

Status: proposed (exclusion) · Class **A** (supported general guidance) · Phase **defer** (Defer or exclude) · 3 sources (3 verified; 0 vendor)

**Rule.** PROPOSED (exclusion): Do not use NWS HeatRisk as a cattle heat indicator.

**Decision it supports.** Avoid a mislabelled livestock alert

**Required inputs.** none

**Where it applies.** Cattle class: Not animal-specific (regional public context). Season: Any; weekly or seasonal public products. Geography: The ranch's county (demo: a named stand-in county, labelled as such). Management: Dated build-time snapshot pinned to as_of; never live in the demo.

**Classification: A (supported general guidance).** Unchanged (research A; confirmed by the checker). HeatRisk is a human heat-health index.

**Evidence (research conclusion).** The WPC HeatRisk overview describes an index for 'heat-related risk' to people, centred on sensitive groups (older adults, children, outdoor workers). The v2.5 overview PDF says it is human-health focused and adds 'no guarantee of timely availability'. The X3 2024 sheet says 'HeatRisk is divided into 5 categories'. None mentions livestock.

**Limitations.** Not tested here whether HeatRisk correlates with cattle stress; the point is that it is not designed for cattle.

**Configurable?** no

**Missing data that should block a confident conclusion.** n/a

**Recommendation.** Adopt as a documentation note.

**Phase defer (Defer or exclude).** A standing exclusion that applies whenever a heat feature is built ([RULE-CTX-07](#rule-ctx-07)).

**Sources.**

*Independent sources:*

- NOAA NWS Weather Prediction Center, "HeatRisk - Overview" (undated (mentions 2014 West; CONUS 2024); data years n/a; government agency). Checker: **verified**. <https://www.wpc.ncep.noaa.gov/heatrisk/overview.html>
  - Supports: Human-health purpose; 7-day horizon
- NOAA NWS WPC, "HeatRisk v2.5 Overview" (undated; data years n/a; government agency). Checker: **verified**. <https://www.wpc.ncep.noaa.gov/heatrisk/pdf/HeatRisk-v2.5-Overview.pdf>
  - Supports: Experimental; no guarantee of timely availability; human focus
- NOAA NWS, "NWS HeatRisk X3 2024" (published 2024 ('Available May 2024'); data years n/a; government agency). Checker: **verified**. <https://www.weather.gov/media/safety/NWS-HeatRisk-X3-2024.pdf>
  - Supports: 5 categories; no livestock mention

<a id="rule-ctx-09"></a>
##### RULE-CTX-09: Cold-stress outlook in calving season (CCI)

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 3 sources (1 verified, 2 partly; 0 vendor)

**Rule.** PROPOSED: In calving season, show a cold-stress outlook using the Comprehensive Climate Index (CCI). Use the newborn bands for calving pastures and the adult bands for others (e.g., Adult Cold Moderate -4 to 13 F; Newborn Cold Moderate 23 to 31 F). Raise it as a scheduling/observation prompt (check pairs, bedding, wind shelter), never as a treatment instruction.

**Decision it supports.** When to increase calving checks and plan shelter or feed logistics

**Required inputs.** Hourly forecast temperature, RH, wind, solar/cloud; calving dates or expected calving window; location

**Where it applies.** Cattle class: Newborn calves and adult cattle. Season: Calving season, cold months. Geography: North Dakota and nearby (NDAWN coverage). Management: Cold-stress outlook as a scheduling and observation prompt.

**Classification: B (context-dependent guidance).** Kept at B for the CCI bands (checker context dispute 4 raised an evidence problem, not a class problem).

**Evidence (research conclusion).** NDAWN CCI page: CCI is 'calculated by adjusting the air temperature using relative humidity, wind speed, and solar radiation'. It 'does not take into account precipitation' and is 'not designed to predict apparent temperature for animals with wet hair coats'. 'Non-acclimated or sick animals should be evaluated using the Newborn CCI'. It gives a full band table and cites Mader, Johnson and Gaughan 2010 (J. Anim. Sci. 88:2153-2165). Per that abstract, the index was developed from 9 summer and 6 winter periods. KFYR (2026-02-19) quotes a livestock management specialist (employer not named) who uses NDAWN's index to plan feeding and shelter moves.

**Corrections from the citation checks.**

- The KFYR article quotes a livestock management specialist whose employer is not named; it is not evidence of Extension or NDAWN endorsement.

**Limitations.** The NDAWN CCI page shows only North Dakota and Minnesota maps (Montana stations are not mentioned on it) and offers no download or API. SD/NE ranches would have to compute CCI themselves. Wet coats and precipitation are excluded, and calving losses depend on much more than weather.

**Configurable?** Bands should stay as published. Which band prompts extra checks is a ranch choice (C).

**Missing data that should block a confident conclusion.** No calving window means no CCI prompt. No forecast means no panel.

**Recommendation.** Optional future feature tied to a calving calendar. Out of season at as_of 2026-09-30.

**Phase defer (Defer or exclude).** Calving modules and live weather are deferred; the demo season has no calving.

**Sources.**

*Independent sources:*

- North Dakota Agricultural Weather Network (NDSU), "Cattle Comfort Index" (undated (Copyright 2026); data years current conditions; extension). Checker: **partly**. <https://ndawn.info/agriculture_cci.html>
  - Supports: CCI bands adult/newborn; wet-coat and precipitation limits
- Journal of Animal Science (Mader, Johnson, Gaughan), "A comprehensive index for assessing environmental stress in animals" (published 2010; data years 9 summer and 6 winter periods (years not in abstract); peer-reviewed). Checker: **verified**. <https://academic.oup.com/jas/article-abstract/88/6/2153/4779866?redirectedFrom=fulltext>
  - Supports: CCI derivation from RH, wind, radiation
- KFYR-TV, "Online index helps producers keep cattle warm during cold temperatures" (published 2026-02-19; data years n/a; other publisher). Checker: **partly**. <https://www.kfyrtv.com/2026/02/19/online-index-helps-producers-keep-cattle-warm-during-cold-temperatures/>
  - Supports: A livestock management specialist (employer not named in the article) describes using NDAWN's index to plan feeding and moving cattle near shelter; not evidence of Extension or NDAWN endorsement.

<a id="rule-ctx-11"></a>
##### RULE-CTX-11: Feed and mineral days on hand

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 1 source (1 partly; 0 vendor)

**Rule.** PROPOSED: Feed and mineral inventory. Days on hand = quantity on hand / measured daily use. Warn when days on hand fall below the supplier lead time plus a buffer, and when the last count is stale.

**Decision it supports.** When to reorder hay, supplement or mineral; drought feed planning

**Required inputs.** item, unit, on_hand, count_date, daily_use (measured from ranch records), lead_time_days

**Where it applies.** Cattle class: All classes on supplement. Season: Winter and drought feeding; mineral all season. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Feed and mineral inventory counts.

**Classification: C (ranch-specific management choice).** Unchanged (research C).

**Evidence (research conclusion).** The NDMC Plan page recommends 'Adding flexibility to the operation's forage/feed resources' and an inventory of resources (Worksheet 3), but gives no inventory method. I found no extension intake rate for mineral in this pass: web search budget was exhausted. Consumption therefore has to come from the ranch's own records.

**Limitations.** Thin evidence gathered; no published thresholds used.

**Configurable?** yes

**Missing data that should block a confident conclusion.** No count date or no use rate: show the quantity only, with no days on hand.

**Recommendation.** Optional. Low build cost; credible only if the use rate is measured, not assumed.

**Phase defer (Defer or exclude).** Feed inventory is on the lead's defer list.

**Sources.**

*Independent sources:*

- National Drought Mitigation Center, UNL, "Plan for Drought" (undated; data years n/a; extension). Checker: **partly**. <https://ranchdrought.unl.edu/Plan.aspx>
  - Supports: Feed/forage flexibility; resource inventory worksheet

<a id="rule-ctx-12"></a>
##### RULE-CTX-12: Breeding, calving and body-condition records

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 6 sources (6 verified; 0 vendor)

**Rule.** PROPOSED (deferred module): breeding, calving and body-condition records. Record breeding season start and end per group, and pregnant or open for every exposed female. Record body condition score (BCS, 1-9) for cows and first-calf heifers at set points (for example about 90 days before calving, at calving and at weaning). Prompt preg-check and BCS dates as schedule items set with the herd veterinarian (the research cites BIF for palpation after about 35 days post-breeding and rectal ultrasound from about 27 days). Escalate to the veterinarian; no treatment logic. This is how cows, which the gain rules skip, would be monitored.

**Decision it supports.** Scheduling preg checks, BCS checks and calving-season staffing

**Required inputs.** group, bull_in_date, bull_out_date, preg_check_date, method, result counts, BCS dates/scores

**Where it applies.** Cattle class: Cows and first-calf heifers; replacement heifers. Season: Breeding, preg check, pre-calving, calving and weaning. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Breeding records and BCS scoring.

**Classification: C (ranch-specific management choice).** CHANGED from A. Checker context dispute 1: the recording elements (breeding dates, pregnancy status, BCS at three points) are A, but 'no earlier than 35 days after bull removal' is a derivation (BIF gives earliest detectability for genetic-evaluation records, not a schedule) and the pre-calving prompt needs an unsourced gestation length. Scheduling is a ranch and veterinarian choice. The checker proposed B or C; the stricter C is applied to the bundled rule.

**Evidence (research conclusion).** BIF Pregnancy Data (last edited 27 Mar 2026): 'Pregnancy status (not pregnant or open vs. pregnant) should be recorded on each breeding female that was exposed to a bull'; palpation 'After 35 days post breeding'; rectal ultrasonography 'After 27 days post breeding'; methods 'should be conducted by trained personnel'. BIF Exposure Data (last edited 12 Apr 2021): 'producers should indicate breeding season start and end dates'. BIF Body Condition Scores (last edited 2 Jun 2022): 'scores should be recorded 60-90 days pre-calving, at calving and at weaning'.

**Limitations.** BIF guidelines are written for genetic-evaluation recording, so the timing is a minimum, not an optimum. Expected calving window needs a gestation length I did not source in this pass; label it as an assumption.

**Configurable?** Lead times and who performs checks: yes (ranch and veterinarian).

**Missing data that should block a confident conclusion.** No bull_out_date: the earliest valid preg-check date cannot be computed, so show 'breeding dates missing'.

**Recommendation.** Adopt as scheduling fields; it extends the existing health task list without any diagnosis.

**Phase defer (Defer or exclude).** Calving and breeding modules are on the lead's defer list.

**Related.** Related rules: [RULE-GAIN-04](#rule-gain-04), [RULE-GAIN-05](#rule-gain-05), [RULE-HLTH-09](#rule-hlth-09).

**Sources.**

*Independent sources:*

- Beef Improvement Federation Guidelines, "Pregnancy Data" (published 2026-03-27 (last edited); data years n/a; standard or specification). Checker: **verified**. <https://guidelines.beefimprovement.org/index.php/Pregnancy_Data>
  - Supports: Record status on every exposed female; earliest diagnosis timing
- Beef Improvement Federation Guidelines, "Exposure Data" (published 2021-04-12 (last edited); data years n/a; standard or specification). Checker: **verified**. <https://guidelines.beefimprovement.org/index.php/Exposure_Data>
  - Supports: Record breeding season start and end
- Beef Improvement Federation Guidelines, "Body Condition Scores" (published 2022-06-02 (last edited); data years n/a; standard or specification). Checker: **verified**. <https://guidelines.beefimprovement.org/index.php/Body_Condition_Scores>
  - Supports: 1-9 scale; record 60-90 d pre-calving, at calving, at weaning
- Nebraska Extension, "Guide to Body Condition Scoring Your Beef Cow Herd" (published 2020-02-02; data years n/a; extension). Checker: **verified**. <https://beef.unl.edu/learning/condition1a.shtml>
  - Supports: BCS targets and scoring times.
- American Angus Association, "AHIR Guidelines (mature cow weight and BCS)" (undated; data years n/a; other publisher). Checker: **verified**. <https://aimsdata.angus.org/performance/AhirGuidelines>
  - Supports: Cow weight and BCS are recorded together within 45 d of weaning.
- SDSU Extension, "Management of Body Condition Score Throughout the Year" (updated 2022-09-09; data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/management-body-condition-score-throughout-year>
  - Supports: BCS 5 target for mature cows.

<a id="rule-ctx-13"></a>
##### RULE-CTX-13: Maintenance log and crew task list

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 6 sources (5 verified, 1 partly; 4 vendor)

**Rule.** PROPOSED (deferred): a fence, water-system and equipment maintenance log plus a crew task list. Each item has asset, task, interval or next_due, status and assignee; overdue items appear as exceptions, and an exception can become a task. Sensor device health (battery voltage, Delay, No Data or Error status) is tracked here as maintenance, kept separate from water-supply alarms.

**Decision it supports.** [context research rule 14] Who does what this week; preventing water and fence failures | [water research rule 15] Scheduling sensor maintenance without crowding out real water alarms.

**Required inputs.** [context research rule 14] asset_id/type, task, last_done, interval_days or next_due, status, assignee | [water research rule 15] Battery voltage, device status, last transmission, solar panel condition notes.

**Where it applies.** Cattle class: Not animal-specific. Season: All year; intervals are ranch-specific. Geography: Northern Plains rangeland (the Example Ranch data are fictional). Management: Maintenance records and crew assignments; solar/battery satellite or cellular tank monitors.

**Classification: C (ranch-specific management choice).** CHANGED for the device-health part. Context research rule 14 was C; water research rule 15 was B. Checker water dispute 2: the voltage cut-offs and the 3-4 day Delay inspection come only from model-specific vendor help pages, and separating maintenance from water alarms is a design choice. Stricter class C.

**Evidence (research conclusion).** [context research rule 14] No extension or peer-reviewed source on maintenance intervals or crew tracking was gathered (search budget exhausted). Indirect support: the NDMC Plan page on stock-water infrastructure in drought. NDSU AS1763 recommends weekly waterer disinfection with 2-3 oz of 5.25% bleach per 50 gal of tank capacity, an example of a maintenance task with a published interval. | [water research rule 15] Vendor figures. Farmbot and Ranchbot: healthy 6.6-7.2 V (Ranchbot 6.6-7.4 V). Consistently below 6.5 V means the battery is likely to die. A charged battery lasts 3-5 days of cloud. Clean snow, dirt and droppings off panels. Ranchbot cold-weather article (2025): switch the monitor off if more snow is expected, to protect the battery. Ranchbot Xtend statuses (2026): No Data, Error, Error (High), Error (Low).

**Limitations.** [context research rule 14] Intervals and severity are management choices; no validation. | [water research rule 15] Thresholds are model-specific vendor values, not independently verified.

**Configurable?** [context research rule 14] yes | [water research rule 15] Yes. Per device model.

**Missing data that should block a confident conclusion.** [context research rule 14] No next_due and no interval: list the item without an overdue judgement. | [water research rule 15] No battery field means the dashboard cannot tell a flat battery from a lost signal. It should say 'cause unknown'.

**Recommendation.** [context research rule 14] Optional. It shows operational management well, but keep it small; the existing health table pattern can be reused. | [water research rule 15] Ingest status and voltage when the vendor export provides them. Show as a crew task with a due date.

**Phase defer (Defer or exclude).** Maintenance logs and crew task tracking with shared records are on the lead's defer list.

**Sources.**

*Independent sources:*

- NDSU Extension, "Livestock Water Requirements (AS1763)" (Revised 2026-02; data years n/a; extension). Checker: **verified**. <https://www.ndsu.edu/agriculture/extension/publications/livestock-water-requirements>
  - Supports: Weekly waterer cleaning/disinfection guidance
- National Drought Mitigation Center, UNL, "Plan for Drought" (undated; data years n/a; extension). Checker: **partly**. <https://ranchdrought.unl.edu/Plan.aspx>
  - Supports: Water infrastructure as a drought action

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- Farmbot Help Centre (vendor), "How do I Check my Monitor Battery?" (published 2024-09-16; data years n/a). Checker: **verified**. <https://intercom.help/farmbot-helpcentre/en/articles/5667006-how-do-i-check-my-monitor-battery>
  - Supports: 6.6-7.2 V healthy, below 6.5 V possibly flat, 3-5 days through cloud cover.
- Ranchbot Help Center (vendor), "Monitor Battery Low Notifications" (published 2023-01-05; data years n/a). Checker: **verified**. <https://intercom.help/ranchbot/en/articles/5702599-monitor-battery-low-notifications>
  - Supports: Low-battery notices with reminders every few days. Below 6.5 V or flatlining: replace. Does not say whether reporting stops.
- Ranchbot Help Center (vendor), "Ranchbot Monitor Cold Weather Care" (published 2025-10-29; data years n/a). Checker: **verified**. <https://intercom.help/ranchbot/en/articles/5702598-ranchbot-monitor-cold-weather-care>
  - Supports: Clear snow from the panel. Switch the monitor off ahead of more snow. Nothing on ice or sensor readings.
- Ranchbot Help Center (vendor), "Xtend Statuses Overview" (published 2026-06-30; data years n/a). Checker: **verified**. <https://intercom.help/ranchbot/en/articles/14331104-xtend-statuses-overview>
  - Supports: No Data, Error, Error (High) and Error (Low) statuses.

<a id="rule-ctx-14"></a>
##### RULE-CTX-14: Ecological site and reference production per pasture

Status: proposed · Class **B** (context-dependent guidance) · Phase **defer** (Defer or exclude) · 3 sources (3 verified; 0 vendor)

**Rule.** PROPOSED: Per-pasture ecological site and reference production as static attributes from NRCS soil and ecological site data, looked up once and stored in pastures.csv. Never fetched live.

**Decision it supports.** Grounding planned_graze_days and min_rest_days in site potential

**Required inputs.** Pasture polygons or soil map units; ecological site ID; reference production (normal, favorable, unfavorable years)

**Where it applies.** Cattle class: Not animal-specific. Season: Static attribute. Geography: Per pasture; NRCS ecological sites. Management: One-time offline lookup stored in pastures.csv.

**Classification: B (context-dependent guidance).** Unchanged (research B).

**Evidence (research conclusion).** Soil Data Access help: REST endpoint 'https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest', 'Request parameters must be submitted via POST', 'cannot be invoked by a URL submitted via a web browser', 'A maximum of 100,000 rows may be returned', JSON output options, no API key mentioned. EDIT moved to NRCS hosting 'as of April 2026' (edit.sc.egov.usda.gov). The landing page describes web search only, with no API.

**Limitations.** Requires real locations, which a fictional ranch lacks. ESD content quality varies. CORS for SDA is unverified.

**Configurable?** n/a (reference data)

**Missing data that should block a confident conclusion.** No ecosite: planned graze days remain ranch-set (C/D) and should be labelled so.

**Recommendation.** Defer for the demo. Mention in the README as how a real deployment would set planned_graze_days.

**Phase defer (Defer or exclude).** Needs real pasture locations; not for the demo.

**Sources.**

*Independent sources:*

- USDA NRCS, "Soil Data Access Web Service Help" (undated; data years n/a; government agency). Checker: **verified**. <https://sdmdataaccess.nrcs.usda.gov/WebServiceHelp.aspx>
  - Supports: POST-only REST, formats, 100,000-row limit
- USDA NRCS / ARS Jornada / NMSU, "Ecosystem Dynamics Interpretive Tool (EDIT)" (undated; data years n/a; government agency). Checker: **verified**. <https://edit.sc.egov.usda.gov>
  - Supports: ESD catalogs; web access only
- Jornada Experimental Range, "EDIT has moved" (undated (states NRCS hosting as of April 2026); data years n/a; government agency). Checker: **verified**. <https://jornada.nmsu.edu/edit/catalogs/esd>
  - Supports: Hosting change April 2026

#### Deferred: Workflow and display

<a id="rule-wf-12"></a>
##### RULE-WF-12: Shelving needs a reason, a person and an expiry

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 3 sources (2 verified, 1 partly; 2 vendor)

**Rule.** PROPOSED: shelving (temporarily hiding a row) must have a reason, a person and an expiry, and the count of shelved rows must stay visible. When it expires the row is re-evaluated. Permanent removal (e.g. a tank taken out of service) is a configuration change with a record, not a UI action.

**Decision it supports.** Lets the manager park a known item (e.g. 'T6 sensor: replacement radio ordered, checking tank by eye daily') without it vanishing from accountability.

**Required inputs.** shelved_until, shelve_reason, shelved_by; out-of-service flag in pasture or tank config.

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: C (ranch-specific management choice).** CHANGED from B. Checker workflow dispute: only the expiry or duration is sourced (exida 'preset time period'; Ignition 'always a duration'). Requiring a reason and a named person, and 'critical cannot be shelved', are design choices; exida attaches permits and approval to out-of-service, not to shelving.

**Evidence (research conclusion).** SOURCES: exida says shelving temporarily hides less important alarms and shelved alarms reappear after a preset time; out-of-service is an administrative, permit-based bypass that may need management approval; and its ISA-18.2 metrics table includes 'Zero alarms suppressed outside of controlled or approved methodologies' and 'Zero alarm attribute changes outside of approved methodologies or MOC' (two rows that the research had merged into one quote). The Ignition manual says shelving always has a duration, new events are blocked during it, and when it ends the alarm re-evaluates its source. HSE CHIS6 lists suppressing alarms from out-of-service plant as a legitimate quick fix. OBSERVED: no shelving exists today.

**Limitations.** Process-industry analogy. Shelving durations suited to a ranch are a management choice (C).

**Configurable?** Yes. Maximum shelve duration per severity (e.g. Critical cannot be shelved, Serious at most 7 days) is a ranch choice.

**Missing data that should block a confident conclusion.** Refuse a shelve with no expiry or no reason.

**Recommendation.** Show 'N shelved' in the header with a link. Don't allow Critical water rows to be shelved. Write every shelve and unshelve to the shared log.

**Phase defer (Defer or exclude).** Hiding rows needs shared, accountable records, which are deferred. The phase-2 per-device acknowledgement never hides a row.

**Sources.**

*Independent sources:*

- International Society of Automation, "ISA18 series of standards (product page)" (undated; data years n/a; standard or specification). Checker: **verified**. <https://www.isa.org/standards-and-publications/isa-standards/isa-18-series-of-standards>
  - Supports: The current edition is ANSI/ISA-18.2-2016. Shelving is covered in ISA-TR18.2.3; monitoring and audit in ISA-TR18.2.5.

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- exida.com LLC, "Alarm Management and ISA-18 - A Journey, Not a Destination" (Copyright 2018-2020; data years n/a). Checker: **partly**. <http://www.exida.com/articles/ALARM-MANAGEMENT-AND-ISA-18-A-JOURNEY-NOT-A-DESTINATION.pdf>
  - Supports: Shelving is temporary with a preset time; out-of-service is administrative with approval; no alarms suppressed outside controlled or approved methods, and no attribute changes outside approved methods or MOC (two separate metric rows)
- Inductive Automation, "Alarming | Ignition User Manual 8.1" (published 2026-04-17; data years n/a). Checker: **verified**. <https://docs.inductiveautomation.com/docs/8.1/platform/alarming>
  - Supports: Shelving always has a duration and is re-evaluated on expiry

<a id="rule-wf-13"></a>
##### RULE-WF-13: Show how long each exception has been open

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 2 sources (2 verified; 1 vendor)

**Rule.** PROPOSED: show how long each exception has been open (first seen), and flag rows open longer than N days as 'standing' for the weekly review.

**Decision it supports.** Separates new problems (act today) from chronic ones (fix the cause, or change the plan or threshold).

**Required inputs.** first_seen_at per exception_id (needs a history of daily runs or the shared log).

**Where it applies.** Cattle class: Not animal-specific (page design). Season: Every page load and print. Geography: Any; read on an office PC, a phone in the yard, or on paper. Management: One manager reviews daily; crew may have no signal in pastures.

**Classification: C (ranch-specific management choice).** Unchanged (research C).

**Evidence (research conclusion).** OBSERVED: hasAgeOrFirstSeenColumn false. The age appears only inside the Problem text for some rules, and not at all for water-low, gain or budget rows. SOURCES: exida (ISA-18.2 metrics) sets a target of fewer than 5 stale alarms on any day. HSE CHIS6 says to measure the number of standing alarms and reduce it.

**Limitations.** N (days before a row counts as standing) is a ranch choice. The process-industry stale-alarm metric is a different time scale.

**Configurable?** Yes.

**Missing data that should block a confident conclusion.** If first_seen is unknown (no history), show 'age unknown', not 'new'.

**Recommendation.** Add an 'Open for' column. Add a 'New since your last review' marker, which needs last_review_at per viewer and is fine to keep in localStorage.

**Phase defer (Defer or exclude).** Needs first_seen history kept across loads (shared, persisted state).

**Sources.**

*Independent sources:*

- UK HSE, "Better alarm handling (CHIS6)" (published 2000-03; data years n/a; government agency). Checker: **verified**. <https://www.hse.gov.uk/pubns/chis6.pdf>
  - Supports: Measure and reduce standing alarms

*Vendor specifications and vendor-authored material (claims, not independently verified outcomes):*

- exida.com LLC, "Alarm Management and ISA-18 - A Journey, Not a Destination" (Copyright 2018-2020; data years n/a (benchmarks based on at least 30 days of data)). Checker: **verified**. <http://www.exida.com/articles/ALARM-MANAGEMENT-AND-ISA-18-A-JOURNEY-NOT-A-DESTINATION.pdf>
  - Supports: Stale-alarm and nuisance-alarm metrics

<a id="rule-wf-16"></a>
##### RULE-WF-16: Health history and shared logs are append-only records

Status: proposed · Class **C** (ranch-specific management choice) · Phase **defer** (Defer or exclude) · 5 sources (5 verified; 0 vendor)

**Rule.** PROPOSED (deferred): health completion history and any shared acknowledgement or notes log are operational records. Keep them append-only (never overwrite last_done on a schedule row), exportable, and retained for at least 2 years (longer where law requires). Keep treatment details out of this dashboard; they belong in the health record system.

**Decision it supports.** [workflow research rule 16] Audit trail: who knew about a problem, when, and what was done. Supports BQA assessments and staff training records. | [health research rule 13] Audit trail for BQA and buyers. Recurring-task scheduling. Telling 'done this cycle' apart from 'done last cycle'.

**Required inputs.** [workflow research rule 16] The shared acknowledgement log; retention setting. | [health research rule 13] completion records with done_date, linked to task_id.

**Where it applies.** Cattle class: All classes. Season: Season records. Geography: US beef operations following BQA. Management: Shared records with retention.

**Classification: C (ranch-specific management choice).** CHANGED from A (both research rules). Checker workflow dispute and health dispute 1: the BQA 2-year minimum retention is A for producer records in general (BQA manual p.15; Field Guide p.8; the Oklahoma BQA form says 3 years), but applying it to a dashboard log is an extension, and 'append-only', 'exportable', 'do not overwrite last_done' and excluding treatment data are design choices.

**Evidence (research conclusion).** [workflow research rule 16] SOURCES: the BQA Field Guide says 'The BQA program recommends keeping records for a minimum of two years, or longer as required by laws/regulations' (p. 8, as extracted), with pesticide records 3 years and VFD records 2 years, and also says to 'Record training and education activities'. The BQA Cow-Calf Assessment expects written protocols, a documented training plan and records, and treatment records with product, date, animal ID, dose, route, person administering and withdrawal time. That treatment record content belongs in the health record system, not this dashboard. SDSU Extension runs programming on digital record keeping and EID ('simplify livestock records and improve animal-level data collection'). | [health research rule 13] BQA Manual: 'Keep records for a minimum of two years or longer as required by laws/regulations' (two fetches gave the same sentence). BQA Field Guide: keep herd health records at least two years from when cattle are transferred or sold. OBSERVED: the committed row 'Cows,Fly tag check,2026-06-05,2026-09-01,done' cannot show whether the Sep 1 occurrence was done (healthbudget.repro.mjs H-05 shows no Health row for it).

**Corrections from the citation checks.**

- The Oklahoma BQA treatment record form (a source of [RULE-HLTH-06](#rule-hlth-06)) says 'Keep This Record for 3 Years', which fits 'at least 2 years' (health checker).

**Limitations.** [workflow research rule 16] Page numbers come from the tool's extraction of the 2026 Field Guide PDF. The BQA National Manual 2026 PDF fetch failed. Retention is a BQA recommendation, not a legal rule for every record type. | [health research rule 13] The demo stores data as static CSV. Retention is a ranch process, not a page feature.

**Configurable?** [workflow research rule 16] Retention length, yes (at least 2 years). | [health research rule 13] Retention period: at least 2 years per BQA.

**Missing data that should block a confident conclusion.** [workflow research rule 16] If ack_by is missing, store the record as 'unattributed' rather than dropping it. | [health research rule 13] A recurring task with no completion record for the current cycle is outstanding, not done.

**Recommendation.** [workflow research rule 16] Use an append-only CSV with ISO timestamps including offsets, never rewritten. Export as part of the season records. Name the health-task source system, but don't copy treatment details into notes. | [health research rule 13] Use health.csv as the schedule (task_id, window, owner, source) and health_records.csv as append-only completions.

**Phase defer (Defer or exclude).** Shared records are on the lead's defer list.

**Sources.**

*Independent sources:*

- Beef Quality Assurance program, "BQA Field Guide (2026 file)" (undated in the extracted text (file name 2026); data years n/a; other publisher). Checker: **verified**. <https://www.bqa.org/Media/BQA/Docs/bqa-field-guide-2026.pdf>
  - Supports: Retention of at least 2 years; pesticide 3 years; VFD 2 years; record training; daily monitoring recommended for feedlot and stocker operations
- Beef Quality Assurance program, "Assessor's Guide to the BQA Cow-Calf Assessment" (undated (FY26); data years n/a; other publisher). Checker: **verified**. <https://www.bqa.org/Media/BQA/Docs/bqa-cow-calf-assessment-cover-fy26.pdf>
  - Supports: Training plan and records; treatment record fields; written protocols
- SDSU Extension, "Coffee at Cottonwood: Digital Record Keeping & Electronic Identification (event)" (Event dated Friday, January 22 (year inferred by the checker as 2027 from page metadata); data years n/a; extension). Checker: **verified**. <https://extension.sdstate.edu/event/coffee-cottonwood-digital-record-keeping-electronic-identification>
  - Supports: South Dakota extension programming on digital records and EID for animal-level data
- Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor), "Beef Quality Assurance National Manual (bqa_manual_final.pdf)" (undated (no date in the PDF; newest data cited are the 2016 NBQA, a 2018 footnote and a 1998-2017 series). Likely superseded: NCBA announced an updated manual on 2024-12-19 (2025-01-06 is a trade-press reprint date), and bqa.org now links a 2026 edition that could not be fetched.; data years newest data cited: 2016 National Beef Quality Audit; a 1998-2017 series; standard or specification). Checker: **verified**. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf>
  - Supports: Record retention minimum of two years (Ch.6, p.15 per fetch). VFD records two years (p.42).
- Beef Quality Assurance program, "BQA Field Guide (bqa_field-_guide.pdf)" (undated (the only year shown is a 1996 NRC table credit); likely superseded by bqa-field-guide-2026.pdf; data years n/a; standard or specification). Checker: **verified**. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_field-_guide.pdf>
  - Supports: Keep herd health records at least two years from transfer or sale. Record date, animal ID, serial/lot, dose, route, person and withdrawal.

## 4. Data requirements

### 4.1 How to read the tables

The tables reproduce every entry in `rules.json` `data_fields` (also split out as `data-fields.json`). Each file has two tables: what each field is, then where it comes from, how it is checked and which rules use it. Field names in a row that lists several columns (for example `capacity_gal, shape/dimensions, usable_fraction`) share one entry in the registry.

**Example status** says what kind of value the field holds. Keep these apart: a fictional example never becomes a real record, and a management assumption never becomes research.

| Example status | Fields | Meaning |
|---|---|---|
| fictional example | 38 | A column the committed demo data has (or a new Phase 1 column the demo will fill) with fictional values for Example Ranch. |
| user record | 75 | Something a real ranch would record or export: readings, observations, records of work done. Not in the demo data today. |
| public observation | 11 | A value from a public dataset (drought, condition, production, soils), always with its date and source. |
| research estimate | 5 | A value from a published table or model (for example intake by class and temperature, heat-stress category). It is an estimate, not a measurement of this ranch. |
| management assumption | 23 | A setting the ranch chooses (thresholds, plans, priorities). Class C or D, never validated by this audit. |

**Source type:** ranch records (79), assumption (27), manual observation (19), device (15), public dataset (12). **Required:** "phase-1 required" means a Phase 1 rule or the Phase 1 data contract needs it; "optional" means it is used when present or by a Phase 2 feature, and the page works without it; "later" means a Phase 3 or deferred rule.

**Evidence** gives the source the research cited for the field and that source's strictest checker result across all its uses, then any checker note. Several evidence links were removed by the citation critic because the page did not support the field; the note says so.

Validation in Phase 1 follows one pattern everywhere: blank means missing (null), never 0 or ""; IDs, tags, names and dates stay strings; numbers must be finite and in range; dates are ISO 8601; and anything that fails becomes a visible data issue row, never a silent drop or a crash. Where a missing input stops a rule from reaching a verdict, the area shows CAN'T TELL, never OK.

### 4.2 Phase 1 required (43 fields)

**meta.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `as_of` | fictional example | The moment the data snapshot represents. Every 'today', 'overdue', 'silent', 'days in pasture' and 'closed month' judgement is measured from it. | Current value '2026-09-30T18:00' has no UTC offset, so browsers read it as viewer-local time. Phase 1: ISO 8601 with offset (for example 2026-09-30T18:00-05:00), or a bare local time interpreted in meta.timezone. | One row; applies to every other file. | phase-1 required |
| `timezone` | fictional example | The ranch's IANA time zone, used to read local times and to display as_of. | IANA name, for example America/Chicago or America/Denver. | One value for the whole snapshot. | phase-1 required |
| `books_closed_through` | fictional example | Last month whose actuals are complete. | YYYY-MM, not after the month of as_of. | One value. | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `as_of` | ranch records | Set at each data export. | Reject a value that does not parse. Without an offset or meta.timezone, show 'data time unknown', drop 'today' wording and treat time-based rules as CAN'T TELL. Rows dated after as_of are excluded from rules and counted as data issues. | [RULE-WAT-03](#rule-wat-03), [RULE-WAT-04](#rule-wat-04), [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-02](#rule-grz-02), [RULE-GAIN-01](#rule-gain-01), [RULE-HLTH-01](#rule-hlth-01), [RULE-HLTH-02](#rule-hlth-02), [RULE-BUD-01](#rule-bud-01), [RULE-BUD-05](#rule-bud-05), [RULE-WF-14](#rule-wf-14), [RULE-CTX-01](#rule-ctx-01), [RULE-CTX-15](#rule-ctx-15) | No supporting source. Checker (workflow): MDN localStorage has nothing on timestamps, offsets or time zones. The rationale (JavaScript parses an offset-less date-time as viewer-local time) is an observation; cite MDN Date.parse or ECMA-262 if a source is wanted. Evidence URL removed. Checker (budget): GFOA says nothing about timestamps or time zones. No supporting source after checker review (MDN localStorage and GFOA were rejected for this field). The problem itself was observed in the repository. |
| `timezone` | ranch records | Set once. | If as_of carries an offset, use it and show the offset; otherwise show 'time zone not set' and treat time-based rules as CAN'T TELL. | [RULE-WAT-03](#rule-wat-03), [RULE-WAT-04](#rule-wat-04), [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-02](#rule-grz-02), [RULE-GAIN-01](#rule-gain-01), [RULE-HLTH-01](#rule-hlth-01), [RULE-HLTH-02](#rule-hlth-02), [RULE-BUD-01](#rule-bud-01), [RULE-BUD-05](#rule-bud-05), [RULE-WF-14](#rule-wf-14) | No supporting source. A data-contract decision (lead phase-1 default); no external source needed. |
| `books_closed_through` | ranch records | Monthly. | Default to the month before as_of's month and label it 'assumed closed through'. | [RULE-BUD-01](#rule-bud-01), [RULE-BUD-05](#rule-bud-05) | No supporting source. Checker (budget): GFOA 'Budget monitoring' says nothing about books-closed months or data completeness. Evidence URL removed. |

**pastures.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `pasture_id` | fictional example | Pasture key (demo P1-P8). | Non-empty string, unique in pastures.csv. | Primary key. Referenced by moves.pasture_id, water.pasture_id and tanks.pasture_id. | phase-1 required |
| `planned_graze_days` | management assumption | The ranch's planned stay length for one visit to this pasture (demo values 10-21 days). | Integer days > 0. A planning value, not a published standard. | Per pasture_id. | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `pasture_id` | ranch records | Static; changes when pastures are re-fenced. | Duplicate or blank id: data issue, and rows that reference it are CAN'T TELL. A moves or water row with an unknown pasture_id is a data issue, not a grazing or water alarm. | [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-03](#rule-grz-03), [RULE-WAT-05](#rule-wat-05) | No supporting source. |
| `planned_graze_days` | assumption | Set when the grazing plan is written; revised in season. | Blank or invalid: the open stay is CAN'T TELL (data issue), not 'over plan'. | [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-02](#rule-grz-02) | No supporting source. |

**groups.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `group` | fictional example | Management group name (demo: Cows, Heifers, Yearlings). | Non-empty string, unique. | Primary key. Referenced by moves.group, weights.group and health.group. | phase-1 required |
| `class` | fictional example | Animal class (demo: cow-calf pairs, first-calf heifers, yearling steers). Drives wording now and intake lookups later. | Text; later a controlled list matching the intake table classes. | Per group. | phase-1 required |
| `head` | fictional example | Current head count in the group. | Integer >= 0. | Per group. | phase-1 required |
| `target_adg_lbs` | management assumption | The ADG the group is judged against (demo: Yearlings 2.0, Heifers 1.0, Cows 0.0 = not judged). | lb/day >= 0. 0 means the gain rules skip the group; the page must say so ([RULE-GAIN-05](#rule-gain-05)). Demo values are demo settings. | Per group. | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `group` | ranch records | Changes when groups are formed or sold. | A row elsewhere naming an unknown group is a data issue shown on the page, not silently dropped. | [RULE-GRZ-01](#rule-grz-01), [RULE-GAIN-01](#rule-gain-01), [RULE-HLTH-01](#rule-hlth-01), [RULE-WAT-05](#rule-wat-05) | No supporting source. |
| `class` | ranch records | Per season. | Shown as 'class not recorded'; class-based lookups are skipped (CAN'T TELL). | [RULE-GAIN-05](#rule-gain-05), [RULE-WAT-06](#rule-wat-06) | No supporting source. |
| `head` | ranch records | On any move, sale, death or purchase. | Coverage cannot be computed, so the group gain verdict is withheld (CAN'T TELL). | [RULE-GAIN-10](#rule-gain-10), [RULE-WAT-06](#rule-wat-06), [RULE-HLTH-07](#rule-hlth-07) | No supporting source. Checker (gain): the Data.gov CPER dataset page does not support the groups.head field. Evidence URL removed. |
| `target_adg_lbs` | assumption | Per season. | Blank or non-numeric: the group is CAN'T TELL for gain, never silently skipped. | [RULE-GAIN-01](#rule-gain-01), [RULE-GAIN-02](#rule-gain-02), [RULE-GAIN-03](#rule-gain-03), [RULE-GAIN-04](#rule-gain-04), [RULE-GAIN-05](#rule-gain-05) | No supporting source. |

**moves.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `group` | fictional example | Group that made the stay. | Must match groups.csv group. | Foreign key to groups.csv. | phase-1 required |
| `pasture_id` | fictional example | Pasture of the stay. | Must match pastures.csv pasture_id. | Foreign key to pastures.csv. | phase-1 required |
| `in_date` | fictional example | Day the group entered the pasture. | ISO date YYYY-MM-DD, on or before as_of. | Per (group, stay). | phase-1 required |
| `out_date` | fictional example | Day the group left; blank means the stay is open. | ISO date, on or after in_date; blank = open stay. | At most one open stay per group; two or more is a data issue. | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `group` | ranch records | Per move. | Unknown group: data issue row. | [RULE-GRZ-01](#rule-grz-01), [RULE-WAT-05](#rule-wat-05) | No supporting source. |
| `pasture_id` | ranch records | Per move. | Unknown pasture: data issue (CAN'T TELL), not a grazing alarm. | [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-03](#rule-grz-03), [RULE-WAT-05](#rule-wat-05) | No supporting source. |
| `in_date` | ranch records | Per move. | Blank, invalid or after as_of: data issue; the stay is not judged. | [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-02](#rule-grz-02), [RULE-GRZ-03](#rule-grz-03) | No supporting source. |
| `out_date` | ranch records | Per move. | out_date before in_date, or a group with more than one open stay: data issue (CAN'T TELL), not a grazing alarm. | [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-03](#rule-grz-03), [RULE-GRZ-04](#rule-grz-04) | No supporting source. |

**water.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `tank_id` | fictional example | Tank the reading came from (demo T1-T8). | Non-empty string. | Must exist in tanks.csv (phase-1 master list). A tank in tanks.csv with no readings is CAN'T TELL, not absent. | phase-1 required |
| `pasture_id` | fictional example | Pasture the tank serves, repeated on each reading. | Must match pastures.csv. | Must agree with tanks.csv pasture_id for that tank; a mismatch is a data issue. tanks.csv becomes the authority. | phase-1 required |
| `time` | fictional example | Time of the reading. | Current values have no UTC offset. Phase 1: ISO 8601 with offset, or local time read in meta.timezone. | Per (tank_id, time); duplicates are a data issue. | phase-1 required |
| `level_pct` | fictional example | Tank level as percent full. | 0-100. | Per reading. | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `tank_id` | device | Per reading. | Unknown tank_id: data issue. | [RULE-WAT-01](#rule-wat-01), [RULE-WAT-02](#rule-wat-02), [RULE-WAT-03](#rule-wat-03), [RULE-WAT-04](#rule-wat-04) | No supporting source. Checker (water): the NRCS 614 citation has no bearing on this field. Evidence URL removed. |
| `pasture_id` | device | Per reading. | Mismatch or unknown: data issue; the tank keeps its tanks.csv pasture. | [RULE-WAT-05](#rule-wat-05) | No supporting source. |
| `time` | device | Per reading (demo every 6 h; vendors 4/day satellite to 24/day cellular). | Unparseable: reading rejected. Readings after as_of are excluded. Silence is measured from as_of. | [RULE-WAT-03](#rule-wat-03), [RULE-WAT-04](#rule-wat-04), [RULE-WAT-07](#rule-wat-07) | <https://intercom.help/ranchbot/en/articles/7944517-what-does-monitor-status-delay-mean> (Ranchbot Help Center (vendor); source result: verified) Checker (water): the Ranchbot Delay page supports irregular reporting and staleness; the time-zone requirement comes from the repo audit, not this page. |
| `level_pct` | device | Per reading. | Blank, non-numeric or outside 0-100: not a reading (never treated as 0); counted as a data issue. | [RULE-WAT-01](#rule-wat-01), [RULE-WAT-02](#rule-wat-02), [RULE-WAT-03](#rule-wat-03) | <https://intercom.help/ranchbot/en/articles/7941241-what-is-offset-and-how-to-update-it> (Ranchbot Help Center (vendor); source result: verified) |

**weights.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `tag` | fictional example | Animal identifier. | String, unique per animal; never reused. | One animal belongs to one group per weigh-in; the same tag twice on one date is a data issue. | phase-1 required |
| `group` | fictional example | Group at the weigh-in. | Must match groups.csv. | Foreign key to groups.csv. | phase-1 required |
| `date` | fictional example | Weigh-in date (demo: 2026-06-01, 2026-07-20, 2026-09-15). | ISO date, on or before as_of. | (group, date) identifies the weigh session (see weigh_sessions.csv). | phase-1 required |
| `weight_lbs` | fictional example | Live weight. | lb, number > 0; plausible range per class (for example 300-1,000 yearlings); no thousands separators. | Per (tag, date). | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `tag` | ranch records | Per weigh-in. | Row rejected and counted in a data-issues line. | [RULE-GAIN-02](#rule-gain-02), [RULE-GAIN-10](#rule-gain-10) | <https://docs.c-lockinc.com/Document%20-%20Beef%20Improvement%20Federation%20Guidelines%20for%20FE%20Testing.pdf> (Beef Improvement Federation (hosted on docs.c-lockinc.com); source result: verified) Checker (gain): the BIF guidelines (vendor-hosted copy) support per-animal pairing only indirectly and say nothing about tag uniqueness. |
| `group` | ranch records | Per weigh-in. | Row excluded from group figures and reported as a data issue. | [RULE-GAIN-01](#rule-gain-01), [RULE-GAIN-10](#rule-gain-10) | <https://ars.usda.gov/ARSUserFiles/30300500/Publications/JRM55-135-138.pdf> (Society for Range Management / USDA-ARS Fort Keogh (PDF hosted by USDA-ARS); source result: verified) |
| `date` | ranch records | Per weigh-in. | Row rejected; dates after as_of are excluded. | [RULE-GAIN-06](#rule-gain-06), [RULE-GAIN-07](#rule-gain-07) | <https://eres.library.adelaide.edu.au/dspace/handle/2440/13249> (American Society of Animal Science (University of Adelaide repository); source result: verified) |
| `weight_lbs` | device | Per weigh-in. | Blank or implausible: excluded and listed as a data issue, never coerced to 0. | [RULE-GAIN-01](#rule-gain-01), [RULE-GAIN-02](#rule-gain-02) | <https://Beef.unl.edu/7a4f176f-73e2-4fa9-b86c-ed95f8543602.pdf> (University of Nebraska-Lincoln; source result: verified) |

**health.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `group` | fictional example | Group the scheduled task applies to. | Must match groups.csv group. | Foreign key to groups.csv. | phase-1 required |
| `task` | fictional example | Schedule label (demo: Booster vaccine, Pinkeye check, Deworm, ...). | Text; a schedule label only, never a finding, diagnosis or treatment instruction. Rendered as text. | (group, task) identifies a schedule row today; a task_id is added later. | phase-1 required |
| `next_due` | fictional example | Planned date for the task (demo: Yearlings booster 2026-09-15, Cows pinkeye check 2026-10-03). | ISO date. Blank is allowed only on done or cancelled rows. | Per schedule row. | phase-1 required |
| `status` | fictional example | Task state. | open \| done \| cancelled \| deferred, compared after trimming and lower-casing. | Per schedule row. | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `group` | ranch records | Per task. | Show a 'group not recorded' data-issue row. | [RULE-HLTH-01](#rule-hlth-01), [RULE-HLTH-02](#rule-hlth-02), [RULE-HLTH-03](#rule-hlth-03) | <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf> (Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor); source result: verified) |
| `task` | ranch records | Per task. | Blank: data issue row. | [RULE-HLTH-01](#rule-hlth-01), [RULE-HLTH-11](#rule-hlth-11) | No supporting source. Checker (health): 21 CFR 530.3 defines the VCPR; it does not address task labels. Evidence URL removed. |
| `next_due` | ranch records | When scheduled. | Blank on an open task: show a 'No due date recorded' data-issue row (today it is skipped silently). | [RULE-HLTH-01](#rule-hlth-01), [RULE-HLTH-02](#rule-hlth-02), [RULE-HLTH-03](#rule-hlth-03) | <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf> (Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor); source result: verified) |
| `status` | ranch records | On change. | Any other value is a data-issue row (today it is dropped silently). | [RULE-HLTH-03](#rule-hlth-03) | No supporting source. Checker (health): the BQA manual does not address task status vocabularies. Evidence URL removed. |

**budget.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `month` | fictional example | Budget month (demo 2026-06 to 2026-09). | YYYY-MM. | (month, category) unique; a duplicate pair is a data issue. | phase-1 required |
| `category` | fictional example | Spending category (demo: Feed and mineral, Fuel, Labor, Repairs, Vet and health, Water and fencing). | Controlled list; later mapped to ERS cost items ([RULE-BUD-12](#rule-bud-12)). | Part of the (month, category) key. | phase-1 required |
| `budget` | fictional example | Planned spend for that category and month (the phased plan). | USD >= 0; plain digits with optional decimal (no '\$', no thousands separators, no '(300)'). | Per (month, category). | phase-1 required |
| `actual` | fictional example | Actual spend for that category and month. | USD, signed number (credits allowed later via entry_type). | Per (month, category). | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `month` | ranch records | Monthly. | Invalid month: row rejected with a data-quality message. Months after meta.books_closed_through count as plan only, not as season-to-date. | [RULE-BUD-01](#rule-bud-01), [RULE-BUD-04](#rule-bud-04), [RULE-BUD-05](#rule-bud-05) | <https://extension.okstate.edu/fact-sheets/developing-a-cash-flow-plan> (Oklahoma State University Extension; source result: verified) |
| `category` | ranch records | Set at budget time. | Blank: row rejected. An unmapped category is still monitored. | [RULE-BUD-01](#rule-bud-01), [RULE-BUD-12](#rule-bud-12) | <https://www.ers.usda.gov/data-products/commodity-costs-and-returns/documentation> (USDA Economic Research Service; source result: verified) |
| `budget` | ranch records | Set before the season; monthly columns. | Blank = 'no budget entered' data issue (not 0). An explicit 0 goes to the unbudgeted-spend rule in dollars ([RULE-BUD-06](#rule-bud-06)). | [RULE-BUD-01](#rule-bud-01), [RULE-BUD-03](#rule-bud-03), [RULE-BUD-04](#rule-bud-04), [RULE-BUD-06](#rule-bud-06) | <https://cropwatch.unl.edu/2018/cash-flow-budgeting-farms-and-ranches> (University of Nebraska-Lincoln CropWatch (Tigner and Duerfeldt); source result: verified) Checker (budget): UNL CropWatch supports monthly phasing only; the number-format and blank-versus-0 rules are the data contract's, not the source's. |
| `actual` | ranch records | Monthly at book close. | Blank in a closed month = 'actual not entered' row; no severity for that category. Never treated as \$0. | [RULE-BUD-01](#rule-bud-01), [RULE-BUD-03](#rule-bud-03), [RULE-BUD-05](#rule-bud-05) | <https://agproud.com/articles/29923-twelve-steps-to-cash-flow-budgeting> (Progressive Dairy / AgProud (author William Edwards, Iowa State University); source result: verified) |

**tanks.csv (new master list)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `tank_id` | fictional example | Every tank the ranch expects to hear from, so a tank with no readings is visible. | Unique string (demo T1-T8). | Primary key; water.tank_id must exist here. | phase-1 required |
| `pasture_id` | fictional example | Pasture the tank serves. | Must match pastures.csv. | Foreign key to pastures.csv; one tank per pasture in the demo, several allowed. | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `tank_id` | ranch records | On install or removal. | If tanks.csv is missing, fall back to tanks seen in water.csv and show 'tank list not provided'. | [RULE-WAT-01](#rule-wat-01), [RULE-WAT-04](#rule-wat-04), [RULE-WAT-15](#rule-wat-15) | No supporting source. |
| `pasture_id` | ranch records | On change. | Unknown pasture: data issue. | [RULE-WAT-05](#rule-wat-05) | No supporting source. |

**weigh_sessions.csv (new; keyed by group + date)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `weight_basis` | fictional example | How the weights in a session were taken, so ADG compares like with like. | full \| overnight_shrunk \| limit_fed \| pencil_shrunk. | One row per (group, date) in weights.csv. | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `weight_basis` | ranch records | Per weigh session. | Basis unknown or different between the two sessions: ADG shown as provisional, with no serious or individual flags (CAN'T TELL). The demo must record a basis for every session so the planted gain problems still show. | [RULE-GAIN-06](#rule-gain-06), [RULE-GAIN-01](#rule-gain-01), [RULE-GAIN-02](#rule-gain-02) | <https://digitalcommons.unl.edu/animalscifacpub/790> (American Society of Animal Science (UNL Digital Commons record); source result: verified) |

**exceptions.js RULES (configuration)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `waterCritical` | management assumption | Level below which a tank is critical (demo 25%). | Percent 0-100; label 'Demo setting (D)' or 'Ranch choice' in the rules table. | Applies to every in-service tank. | phase-1 required |
| `waterLow` | management assumption | Level below which a tank is a warning (demo 40%). | Percent 0-100, above waterCritical. | All tanks. | phase-1 required |
| `waterDropPts and drop window` | management assumption | Fall in points over a bounded window that counts as an unexplained fall (demo 30 points in 24 h). | Points 0-100; window in hours with a tolerance of one reporting interval. | All tanks. | phase-1 required |
| `sensorSilentHours` | management assumption | Hours without a reading, measured from as_of, before a tank is CAN'T TELL (demo 24 h). | Hours > 0; later per device from expected_report_interval_h. | All tanks. | phase-1 required |
| `graceDays` | management assumption | Days before a planned move date that raise a warning (demo 2). | Integer days >= 0. | All groups. | phase-1 required |
| `adgSerious` | management assumption | Share of the group target below which group gain is serious (demo 0.8). | Fraction 0-1. | Groups with target_adg_lbs > 0. | phase-1 required |
| `animalShare` | management assumption | Share of the group target below which an individual is listed (demo 0.5). | Fraction 0-1. | Animals in judged groups. | phase-1 required |
| `gain minimum interval and minimum coverage (new)` | management assumption | Shortest weigh interval (or number of weights) before ADG is judged, and the share of the group that must be weighed in both sessions. | Days > 0 (research default for individuals about 70 d or 3+ weights); coverage fraction 0-1. Values must be chosen and tested so the demo's planted gain problems are still found. | Per group. | phase-1 required |
| `dueSoonDays` | management assumption | Days ahead that an open health task becomes a warning (demo 7). | Integer days >= 0. | Open health tasks. | phase-1 required |
| `budget thresholds (budgetWarn, budgetSerious, warnUsd, seriousUsd, largeUsd, unbudgetedUsd)` | management assumption | Percent and dollar materiality for budget rows. Current: budgetWarn 0.05, budgetSerious 0.10. Phase-1 demo values: warn 5% and \$500, serious 10% and \$1,000, large \$2,500, unbudgeted \$250. | Fractions 0-1 and USD >= 0; inclusive comparisons; every value labelled 'Demo setting'. | Per category. | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `waterCritical` | assumption | On rule review. | Not configured: show levels without severity and say 'threshold not set'. | [RULE-WAT-01](#rule-wat-01), [RULE-WF-20](#rule-wf-20) | No supporting source. |
| `waterLow` | assumption | On rule review. | As waterCritical. | [RULE-WAT-02](#rule-wat-02), [RULE-WF-20](#rule-wf-20) | No supporting source. |
| `waterDropPts and drop window` | assumption | On rule review. | As waterCritical. | [RULE-WAT-03](#rule-wat-03), [RULE-WF-20](#rule-wf-20) | No supporting source. |
| `sensorSilentHours` | assumption | On rule review. | Use 24 h and label it an assumption. | [RULE-WAT-04](#rule-wat-04), [RULE-WAT-07](#rule-wat-07), [RULE-WF-20](#rule-wf-20) | No supporting source. |
| `graceDays` | assumption | On rule review. | No move-reminder warning. | [RULE-GRZ-02](#rule-grz-02), [RULE-WF-20](#rule-wf-20) | No supporting source. |
| `adgSerious` | assumption | On rule review. | Show ADG without verdict. | [RULE-GAIN-01](#rule-gain-01), [RULE-WF-20](#rule-wf-20) | No supporting source. |
| `animalShare` | assumption | On rule review. | No individual list. | [RULE-GAIN-02](#rule-gain-02), [RULE-WF-20](#rule-wf-20) | No supporting source. |
| `gain minimum interval and minimum coverage (new)` | assumption | On rule review. | Gain verdicts shown as provisional (CAN'T TELL). | [RULE-GAIN-07](#rule-gain-07), [RULE-GAIN-10](#rule-gain-10), [RULE-WF-20](#rule-wf-20) | No supporting source. |
| `dueSoonDays` | assumption | On rule review. | No due-soon warning. | [RULE-HLTH-02](#rule-hlth-02), [RULE-WF-20](#rule-wf-20) | No supporting source. |
| `budget thresholds (budgetWarn, budgetSerious, warnUsd, seriousUsd, largeUsd, unbudgetedUsd)` | assumption | Once a season or after review. | Show variances with no severity and a 'thresholds not set' note. | [RULE-BUD-01](#rule-bud-01), [RULE-BUD-02](#rule-bud-02), [RULE-BUD-03](#rule-bud-03), [RULE-BUD-06](#rule-bud-06), [RULE-WF-20](#rule-wf-20) | <https://finance.uw.edu/maa/node/228> (University of Washington Finance, Management Accounting & Analysis; source result: verified) |

**rules table (page copy)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `rule_basis` | management assumption | Why each threshold exists: 'Demo setting (D)' until sourced or set by the ranch, then 'Ranch choice, set by &lt;name>, &lt;date>'. | Text plus class A/B/C/D. | One per RULES key. | phase-1 required |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `rule_basis` | assumption | On rule review. | Label the threshold 'Demo setting (unvalidated)'. | [RULE-WF-20](#rule-wf-20), [RULE-WF-21](#rule-wf-21) | <https://www.hse.gov.uk/pubns/chis6.pdf> (UK Health and Safety Executive; source result: verified) Checker (workflow): HSE CHIS6 supports alarm change control and audits; the change-log schema is the researcher's design. |

### 4.3 Optional (22 fields)

**pastures.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `name` | fictional example | Display name (demo: North Flat, Windmill, ...). | Text; shown as text, never as HTML. | Display only; never used as a key. | optional |
| `acres` | fictional example | Pasture area. | Acres, number > 0. | Per pasture_id. | optional |
| `min_rest_days` | management assumption | Minimum recovery period before the pasture is grazed again (demo 30-60 days). No shipped code reads it today. | Integer days > 0. State technical notes give ranges by growth period and use level (for example NDSU R1780 and SD TN9). | Per pasture_id. | optional |
| `min_rest_fast_days / min_rest_slow_days` | management assumption | Recovery minimum before re-grazing during fast (vegetative, pre-boot) and slow (boot onward) growth | integer days, roughly 25-90; defaults from the state NRCS FOTG (e.g. SD TN9 West River range 40/60 at 20-30% use; NDSU western ND range 45/65) | Per pasture_id. | optional |
| `growing_season_start / end` | management assumption | Window in which rest counts as recovery | month-day | Per pasture_id. | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `name` | ranch records | Static. | Show the pasture_id instead. | [RULE-GRZ-01](#rule-grz-01), [RULE-WF-17](#rule-wf-17) | No supporting source. |
| `acres` | ranch records | Static. | Blank or non-numeric: shown as unknown; no current rule uses it. Needed later for AU-day planning ([RULE-GRZ-07](#rule-grz-07)). | [RULE-GRZ-07](#rule-grz-07) | No supporting source. |
| `min_rest_days` | assumption | Annually, or in drought (longer). | Rest check (phase 2) shows 'no rest target set' for that pasture. | [RULE-GRZ-03](#rule-grz-03), [RULE-GRZ-05](#rule-grz-05) | <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/R1780%20The%20North%20Dakota%20Grazing%20Monitoring%20Stick%20%281%29.pdf> (NDSU Extension (Meehan, Sedivec, Printz); source result: verified) |
| `min_rest_fast_days / min_rest_slow_days` | assumption | Annually, or in drought (extend to 90+) | Valid: integer days, roughly 25-90; defaults from the state NRCS FOTG (e.g. SD TN9 West River range 40/60 at 20-30% use; NDSU western ND range 45/65). Missing or invalid: Use the existing single min_rest_days and label it 'not growth-adjusted' | [RULE-GRZ-03](#rule-grz-03) | <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/R1780%20The%20North%20Dakota%20Grazing%20Monitoring%20Stick%20%281%29.pdf> (NDSU Extension (Meehan, Sedivec, Printz); source result: verified) |
| `growing_season_start / end` | assumption | Annually | Valid: month-day. Missing or invalid: Count all calendar days and label the rest figure 'calendar days' | [RULE-GRZ-03](#rule-grz-03) | <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf> (USDA NRCS South Dakota; source result: partly) |

**health.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `last_done` | fictional example | Date the task was last completed. | ISO date, on or before as_of; blank allowed for a task never done. | Per schedule row. Later, completions go to an append-only history ([RULE-WF-16](#rule-wf-16)). | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `last_done` | ranch records | Per completion. | Blank is allowed; an invalid date is a data issue. | [RULE-HLTH-01](#rule-hlth-01) | No supporting source. |

**tanks.csv (new master list)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `name` | fictional example | Display name. | Text, rendered as text. | Display only. | optional |
| `in_service` | fictional example | Whether the tank is in use (a tank drained for winter is out of service). | true \| false; default true. | Per tank. | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `name` | ranch records | Static. | Show tank_id. | [RULE-WF-17](#rule-wf-17) | No supporting source. |
| `in_service` | ranch records | Rare; record who changed it later ([RULE-WF-19](#rule-wf-19)). | Treat as in service. An out-of-service tank is shown as 'out of service' and not judged; it is never hidden. | [RULE-WAT-04](#rule-wat-04), [RULE-WF-19](#rule-wf-19) | <https://www.hse.gov.uk/pubns/chis6.pdf> (UK Health and Safety Executive; source result: verified) Checker (workflow): HSE CHIS6 supports suppressing out-of-service plant; the changed_by/at/reason audit fields are the researcher's design. |

**tanks.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `expected_report_interval_h, device_model` | user record | How often this device should report | hours > 0 | Per tank_id. | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `expected_report_interval_h, device_model` | device | on install | Valid: hours > 0. Missing or invalid: Use the fixed 24 h silence limit, labelled an assumption | [RULE-WAT-04](#rule-wat-04), [RULE-WAT-07](#rule-wat-07) | <https://www.lonestartracking.com/?p=60249> (LoneStar Tracking (vendor); source result: verified) |

**water.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `level_in (raw)` | user record | Measured water height above the sensor, before offset | inches, ≥0 | Per reading. | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `level_in (raw)` | device | per reading | Valid: inches, ≥0. Missing or invalid: Use level_pct and mark it uncalibrated | [RULE-WAT-14](#rule-wat-14) | <https://intercom.help/ranchbot/en/articles/7941241-what-is-offset-and-how-to-update-it> (Ranchbot Help Center (vendor); source result: verified) |

**derived from groups.csv + moves.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `head present by class per pasture` | fictional example | Animals drinking at this tank now | integer head; class in {cow-calf pairs, first-calf heifers, yearling steers, ...} | Open stays in moves.csv joined to groups.csv; a pasture with an unknown group is CAN'T TELL. | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `head present by class per pasture` | ranch records | on each move | Valid: integer head; class in {cow-calf pairs, first-calf heifers, yearling steers, ...}. Missing or invalid: Treat the tank as possibly in use. Do not downgrade severity. | [RULE-WAT-05](#rule-wat-05), [RULE-WAT-06](#rule-wat-06), [RULE-WAT-07](#rule-wat-07) | <https://www.ndsu.edu/agriculture/sites/default/files/2024-04/as1763.pdf> (NDSU Extension; source result: verified) |

**derived from water.csv + moves.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `water status of the occupied and destination pasture` | fictional example | Latest tank level and sensor freshness, already computed by waterStatus() | % full; hours since last reading | tanks.pasture_id joined to the group's open stay and planned_next_pasture. | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `water status of the occupied and destination pasture` | device | Every 6 h in demo data | Valid: % full; hours since last reading. Missing or invalid: Silent sensor gives 'water unknown: check by eye before moving' | [RULE-WAT-05](#rule-wat-05) | <https://www.nrcs.usda.gov/sites/default/files/2025-07/528-nhcp-cps-grazing-management-2025-rev.pdf> (USDA NRCS; source result: partly) |

**moves.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `planned_out_date` | user record | Planned move-out date for this stay (replaces the per-pasture planned_graze_days as the plan of record) | ISO date YYYY-MM-DD, on or after in_date | Per stay. | optional |
| `planned_next_pasture` | user record | Destination pasture for the next move | pasture_id in pastures.csv | Must match pastures.csv pasture_id. | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `planned_out_date` | ranch records | When the plan is written or revised | Valid: ISO date YYYY-MM-DD, on or after in_date. Missing or invalid: Fall back to in_date + pasture planned_graze_days and label it 'default plan' | [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-02](#rule-grz-02) | <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf> (USDA NRCS South Dakota; source result: partly) |
| `planned_next_pasture` | ranch records | Per stay | Valid: pasture_id in pastures.csv. Missing or invalid: Show 'destination not planned'; skip the destination readiness check (do not report ready) | [RULE-WAT-05](#rule-wat-05) | <https://www.nrcs.usda.gov/sites/default/files/2025-07/528-nhcp-cps-grazing-management-2025-rev.pdf> (USDA NRCS; source result: partly) Checker (grazing): CPS 528 supports only the general water and monitoring criteria; its link to this field is loose. |

**weights.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `eid` | user record | Electronic ID (RFID) read at the scale, used to match weights to animals | RFID string; confirm length and format against the reader's export (the 15-digit format is unsourced in this audit) | Per animal; maps to tag. | optional |
| `weigh_time` | user record | Clock time the animal (or session) was weighed | HH:MM local, with a stated timezone | Per weigh-in. | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `eid` | device | per weigh-in | Valid: RFID string in the format the reader exports. Missing or invalid: Fall back to tag | [RULE-GAIN-02](#rule-gain-02) | No supporting source. Checker (gain): the Tru-Test info sheet does not mention a 15-digit RFID format or any reduction in tag-entry errors. Evidence URL removed. |
| `weigh_time` | device | per weigh-in | Valid: HH:MM local, with a stated timezone. Missing or invalid: ADG marked 'conditions unknown' | [RULE-GAIN-06](#rule-gain-06) | <https://rangelandsgateway.org/dlio/22019> (Society for Range Management (Rangelands Gateway / Univ. of Arizona repository); source result: verified) |

**weigh_sessions.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `pencil_shrink_pct` | user record | Shrink deducted, if a pencil shrink is applied | 0-10 % | Per (group, date). | optional |
| `gather_time, hours_off_feed_water` | user record | When cattle were gathered and how long they stood off feed and water before weighing | HH:MM; hours 0-24 | Per (group, date). | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `pencil_shrink_pct` | ranch records | per weigh session | Valid: 0-10 %. Missing or invalid: Treated as 0 and stated | [RULE-GAIN-06](#rule-gain-06) | <https://rangelandsgateway.org/node/25589> (Society for Range Management (Rangelands Gateway); source result: verified) |
| `gather_time, hours_off_feed_water` | manual observation | per weigh session | Valid: HH:MM; hours 0-24. Missing or invalid: 'conditions unknown' note | [RULE-GAIN-06](#rule-gain-06) | <https://pods.okstate.edu/fact-sheets/ANSI-3257pod.pdf> (Oklahoma State University Extension; source result: verified) |

**page state (derived)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `source_last_update per source (water, weigh-ins, moves, health, budget)` | fictional example | When each input was last updated, so a fresh as_of cannot hide an old source | ISO 8601 timestamp per source | One per input file. | optional |
| `exception_id` | management assumption | Stable key for an exception across loads (area + subject id + rule id, e.g. Water\|T4\|drop24h) | String; deterministic | Deterministic: area + subject id + rule id (for example Water\|T4\|drop24h). | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `source_last_update per source (water, weigh-ins, moves, health, budget)` | device | Per export | Valid: ISO 8601 timestamp per source. Missing or invalid: Show 'unknown' for that source and do not mark its rows 'new' | [RULE-WF-14](#rule-wf-14), [RULE-WF-18](#rule-wf-18) | No supporting source. Checker (workflow): the exida paper has nothing on data freshness; its 'stale alarms' means standing alarms. Evidence URL removed. |
| `exception_id` | assumption | Computed every load | Valid: String; deterministic. Missing or invalid: Without it, acknowledgements cannot be matched, so show every row as New and unacknowledged and never hide it | [RULE-WF-11](#rule-wf-11), [RULE-WF-15](#rule-wf-15), [RULE-WF-13](#rule-wf-13) | No supporting source. Checker (workflow): the Ignition manual gives no deterministic ID scheme; exception_id is a design assumption. Evidence URL removed. |

**browser localStorage (this device only)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `local acknowledgement (exception_id, acked_at), selected filter, last_review_at` | user record | Per-device conveniences for the phase-2 morning review and the optional 'this device only' acknowledgement. Never shared, never clears or hides a condition. | Small key/value strings; ISO 8601 times. | Keyed by exception_id. | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `local acknowledgement (exception_id, acked_at), selected filter, last_review_at` | manual observation | On each visit or action. | Storage blocked, empty or cleared: every row shows as unacknowledged and the page renders fully. Every call wrapped in try/catch. | [RULE-WF-11](#rule-wf-11), [RULE-WF-15](#rule-wf-15), [RULE-WF-18](#rule-wf-18) | <https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria> (MDN Web Docs (Mozilla); source result: verified) |

**rules table (page copy)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `severity_consequence and response_window per rule` | management assumption | Consequence of no response and the time available, which justify the severity level | Enum (animal welfare / production / financial) plus hours or days | One per rule. | optional |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `severity_consequence and response_window per rule` | assumption | On rule review | Valid: Enum (animal welfare / production / financial) plus hours or days. Missing or invalid: Show the rule at Warning with 'basis not documented' | [RULE-WF-10](#rule-wf-10), [RULE-BUD-14](#rule-bud-14), [RULE-WAT-05](#rule-wat-05) | <http://www.exida.com/articles/ALARM-MANAGEMENT-AND-ISA-18-A-JOURNEY-NOT-A-DESTINATION.pdf> (exida.com LLC (consultancy). Authors Stauffer, Sands, Dunn.; source result: partly) |

### 4.4 Later phases (87 fields)

**tanks.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `capacity_gal, shape/dimensions, usable_fraction` | user record | Usable capacity, and the geometry that converts level to gallons Also: Tank volume and how it refills | gal > 0; shape in {vertical cylinder, horizontal cylinder, elliptical, rectangular}; ft | Per tank_id. | later |
| `tank_type` | user record | Float-fed drinking tank vs storage tank vs hauled-water tank vs pond/dugout | enum {float_fed, storage, hauled, surface} | Per tank_id. | later |
| `supply_type, design_inflow_gpm / refill_gph` | user record | Water source (electric well, solar, windmill, pipeline, rural water, hauled) and measured inflow Also: Tank volume and how it refills | enum; gpm ≥0 | Per tank_id. | later |
| `sensor_offset_in, offset_set_at` | user record | Distance between the sensor and the usable bottom (mud, outlet height) | inches, ±240 per Ranchbot (vendor) input validation; datetime | Per tank_id. | later |
| `out_of_service audit (changed_by, changed_at, reason), tank_shutoff, planned_move_in` | user record | Asset deliberately excluded from rules, e.g. a tank drained for winter Also: A float deliberately off in a resting pasture, and the next use | boolean plus audit fields | Per tank_id. | later |
| `backup water / haul capacity` | user record | Alternative source and gallons per haul | text; gal | Per tank or per ranch. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `capacity_gal, shape/dimensions, usable_fraction` | ranch records | once, and on any tank change | Valid: gal > 0; shape in {vertical cylinder, horizontal cylinder, elliptical, rectangular}; ft. Missing or invalid: Do not compute hours. Show 'capacity unknown'. Severity falls back to the labelled demo % rule. | [RULE-WAT-06](#rule-wat-06), [RULE-WAT-09](#rule-wat-09) | <https://goldenplains.extension.colostate.edu/wp-content/uploads/sites/56/2021/06/PR_CalculatingWaterforCattle.pdf> (Colorado State University Extension, Golden Plains Area; source result: verified) |
| `tank_type` | ranch records | once | Valid: enum {float_fed, storage, hauled, surface}. Missing or invalid: Do not apply leak or drawdown logic. Show the fall without interpretation. | [RULE-WAT-03](#rule-wat-03), [RULE-WAT-08](#rule-wat-08) | <https://extension.wvu.edu/files/d/102b1da9-9f1a-40d7-90ad-5de2cd6101a8/watering-systems-by-ben-bartlett.pdf> (LPES Small Farms Fact Sheets / MidWest Plan Service; source result: verified) |
| `supply_type, design_inflow_gpm / refill_gph` | ranch records | once a season or after repair (Bartlett: test well yield and drawdown with a driller, because summer use rises) | Valid: enum; gpm ≥0. Missing or invalid: Hours-of-water shown with zero inflow only, labelled worst case | [RULE-WAT-06](#rule-wat-06), [RULE-WAT-09](#rule-wat-09), [RULE-WAT-10](#rule-wat-10) | <https://www.uvm.edu/d10-files/documents/2024-10/watering_systems_for_grazing_livestock.pdf> (Great Lakes Basin Grazing Network / Michigan State University Extension; source result: verified) |
| `sensor_offset_in, offset_set_at` | device | on install or change | Valid: inches, ±240 per Ranchbot (vendor) input validation; datetime. Missing or invalid: Flag readings as 'offset unknown' near thresholds | [RULE-WAT-14](#rule-wat-14) | <https://intercom.help/ranchbot/en/articles/7941241-what-is-offset-and-how-to-update-it> (Ranchbot Help Center (vendor); source result: verified) |
| `out_of_service audit (changed_by, changed_at, reason), tank_shutoff, planned_move_in` | ranch records | Rare; under change control | Valid: boolean plus audit fields. Missing or invalid: Treat as in service | [RULE-WF-19](#rule-wf-19), [RULE-WAT-05](#rule-wat-05) | <https://www.hse.gov.uk/pubns/chis6.pdf> (UK Health and Safety Executive; source result: verified) Checker (workflow): HSE CHIS6 supports suppressing out-of-service plant; the changed_by/at/reason audit fields are the researcher's design. |
| `backup water / haul capacity` | ranch records | seasonal | Valid: text; gal. Missing or invalid: Action text cannot name a backup | [RULE-WAT-06](#rule-wat-06) | <https://extension.sdstate.edu/hauling-water-cows-when-water-not-everywhere> (SDSU Extension (Taylor Grussing); source result: partly) |

**water.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `device_status` | user record | Vendor status (OK, Delay, No Data, Error, Error High, Error Low) | enum per vendor | Per reading. | later |
| `battery_v` | user record | Monitor battery voltage | V (vendor: 6.6-7.2 healthy, &lt;6.5 likely failing) | Per reading. | later |
| `flow_meter_gal` | user record | Metered inflow per day | gal/day ≥0 | Per tank per day. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `device_status` | device | per transmission | Valid: enum per vendor. Missing or invalid: Infer only 'silent' from the timestamps | [RULE-CTX-13](#rule-ctx-13), [RULE-WAT-07](#rule-wat-07) | <https://intercom.help/ranchbot/en/articles/14331104-xtend-statuses-overview> (Ranchbot Help Center (vendor); source result: verified) |
| `battery_v` | device | per transmission | Valid: V (vendor: 6.6-7.2 healthy, &lt;6.5 likely failing). Missing or invalid: Cause of silence reported as unknown | [RULE-CTX-13](#rule-ctx-13) | <https://intercom.help/farmbot-helpcentre/en/articles/5667006-how-do-i-check-my-monitor-battery> (Farmbot Help Centre (vendor); source result: verified) Voltage bands are vendor statements (Farmbot), model-specific. |
| `flow_meter_gal` | device | daily | Valid: gal/day ≥0. Missing or invalid: No overflow or stuck-open detection; say so | [RULE-WAT-08](#rule-wat-08) | No supporting source. Checker (water): NRCS Missouri 'Watering Systems for Serious Graziers' never mentions flow or water meters. Evidence URL removed. |

**visual_checks.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `checked_at, checked_by, result (ok / low / dirty / float-fault / leak / dry), float_ok, overflow, ice, notes` | user record | In-person observation Also: Eyes-on confirmation of tank function and cleanliness | datetime; booleans; free text | Keyed by tank_id and time; tank_id must exist in tanks.csv. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `checked_at, checked_by, result (ok / low / dirty / float-fault / leak / dry), float_ok, overflow, ice, notes` | manual observation | each check (more often in heat) | Valid: datetime; booleans; free text. Missing or invalid: Show 'not checked by eye since &lt;date>' | [RULE-WAT-15](#rule-wat-15), [RULE-CTX-07](#rule-ctx-07), [RULE-WF-17](#rule-wf-17) | <https://www.ag.ndsu.edu/news/newsreleases/2007/july-26-2007/water-essential-for-cattle-in-high-heat> (NDSU Agriculture Communication; source result: verified) Checker (workflow): 'daily' appears only in a BQA sample protocol template; the assessment itself does not require daily checks. Checker (water): the NDSU 2007 release supports only more frequent checks in heat, not the log's structure. |

**water_quality.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `source_id, date, method (meter/strip/lab), tds_ppm, sulfate_ppm, nitrate_ppm (state NO3 or NO3-N)` | user record | Screening and lab results | ppm (mg/L); method enum | source_id = tank_id or a named pond/well. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `source_id, date, method (meter/strip/lab), tds_ppm, sulfate_ppm, nitrate_ppm (state NO3 or NO3-N)` | manual observation | per test (in drought, for new or surface sources) | Valid: ppm (mg/L); method enum. Missing or invalid: Show 'not screened'; never 'OK' | [RULE-WAT-11](#rule-wat-11), [RULE-WAT-12](#rule-wat-12) | <https://info.ext.nodak.edu/agriculture/sites/default/files/2026-01/as1764%20%281%29.pdf> (NDSU Extension; source result: partly) |

**water_observations.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `algae observation (source_id, date, status none/suspect/bloom, photo, sample_sent, vet_contacted)` | user record | Cyanobacteria watch on surface water | enum; booleans | source_id = tank_id or a named pond. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `algae observation (source_id, date, status none/suspect/bloom, photo, sample_sent, vet_contacted)` | manual observation | weekly or more in late summer heat (ranch choice) | Valid: enum; booleans. Missing or invalid: Show 'not observed' | [RULE-WAT-13](#rule-wat-13) | <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/56136%20Cyanobacteria.pdf> (NDSU Extension; source result: verified) |

**tanks.csv or route plan**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `response_time_h, next_check_at` | management assumption | Time to reach the tank, and the next scheduled pass | hours; datetime | Per tank or per route. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `response_time_h, next_check_at` | assumption | per route plan | Valid: hours; datetime. Missing or invalid: Use a ranch default and label it | [RULE-WAT-06](#rule-wat-06), [RULE-WAT-07](#rule-wat-07) | <https://extension.usu.edu/rangelands/research/remote-sensing-stock-tanks.php> (Utah State University Extension (Kevin Heaton); source result: verified) |

**groups.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `avg_weight_lb, lactation_status` | user record | Inputs to intake lookup Also: Calving date and whether the animal is nursing | lb; enum {dry, lactating, growing} | Per group (or per animal for calving dates). | later |
| `gain_metric` | management assumption | How the class is judged | ADG \| BCS \| none | Per group. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `avg_weight_lb, lactation_status` | ranch records | each weigh-in and calving season | Valid: lb; enum {dry, lactating, growing}. Missing or invalid: Use the class default and label the assumption | [RULE-WAT-06](#rule-wat-06), [RULE-GRZ-07](#rule-grz-07) | <https://bookstore.ksre.ksu.edu/download/estimating-water-requirements-for-mature-beef-cows_MF3303> (Kansas State University Research and Extension; source result: verified) |
| `gain_metric` | assumption | per season | Valid: ADG \| BCS \| none. Missing or invalid: Default by class: yearlings ADG; cows and first-calf heifers BCS | [RULE-GAIN-05](#rule-gain-05), [RULE-GAIN-04](#rule-gain-04), [RULE-CTX-12](#rule-ctx-12) | <https://beef.unl.edu/learning/condition1a.shtml> (Nebraska Extension (BeefWatch); source result: verified) |

**lookup (static table)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `intake_gal_per_head_day by class and temperature` | research estimate | Reference daily intake by class, weight and temperature Also: Estimated daily intake by class, weight and temperature | gal/head/day; table rows 40-90F | Rows by class; columns by temperature band (40-90F). | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `intake_gal_per_head_day by class and temperature` | public dataset | static (cite version) | Valid: gal/head/day; table rows 40-90F. Missing or invalid: Use the highest value in the class's row and label it an assumed hot-day figure (for lactating cows in AS1763 that is 80F, 17.9 gal) | [RULE-WAT-06](#rule-wat-06), [RULE-WAT-09](#rule-wat-09) | <https://extensionpubs.unl.edu/publication/g2060/2011/pdf/view/g2060-2011.pdf> (University of Nebraska-Lincoln Extension; source result: verified) Checker: the 90F column is not the most conservative for lactating cows (AS1763: 17.9 gal at 80F vs 16.2 at 90F). |

**weather snapshot (build-time, dated)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `daily_high_f and hourly forecast (temp_f, rh_pct, wind_mph, sky_cover_pct), forecast THI` | public observation | NWS gridpoint hourly forecast for the location Also: Temperature driving intake / Temperature-humidity index computed from hourly forecast temperature and RH or dewpoint for the ranch location | F, %, mph, % | Keyed by forecast point and hour; pinned to as_of in the demo. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `daily_high_f and hourly forecast (temp_f, rh_pct, wind_mph, sky_cover_pct), forecast THI` | public dataset | Not stated on the cited documentation page; record retrieved_at on each snapshot | Valid: F, %, mph, %. Missing or invalid: No heat/cold panel; never default to 'Normal' | [RULE-CTX-07](#rule-ctx-07), [RULE-WAT-06](#rule-wat-06) | <https://www.weather.gov/documentation/services-web-API> (NOAA National Weather Service; source result: verified) Checker (health): weather.gov documentation states no forecast update frequency; 'several times daily' is unsupported. |

**weather snapshot (derived)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `heat_stress_category` | research estimate | ARS breathing-rate category from the forecast | Normal &lt;90, Alert 90-110, Danger 110-130, Emergency >130 breaths/min | Per forecast hour. | later |
| `cci_f_adult / cci_f_newborn` | research estimate | Comprehensive Climate Index apparent temperature | degrees F; NDAWN bands | Per forecast hour. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `heat_stress_category` | assumption | with each forecast snapshot | Valid: Normal &lt;90, Alert 90-110, Danger 110-130, Emergency >130 breaths/min. Missing or invalid: Hide | [RULE-CTX-07](#rule-ctx-07) | <https://www.ars.usda.gov/plains-area/clay-center-ne/marc/documents/heat-stress/forecastingheatstress/> (USDA ARS U.S. Meat Animal Research Center, Clay Center NE; source result: verified) |
| `cci_f_adult / cci_f_newborn` | assumption | with each forecast snapshot (calving season) | Valid: degrees F; NDAWN bands. Missing or invalid: Hide | [RULE-CTX-09](#rule-ctx-09) | <https://ndawn.info/agriculture_cci.html> (North Dakota Agricultural Weather Network (NDSU); source result: partly) |

**moves.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `head_in, group average weight` | user record | Head count and average weight (or AUE) of the group on this stay | integer head > 0; lb (or AUE 0.5-1.5) | Per stay. | later |
| `override_reason` | user record | Recorded reason for an intentional deviation (early re-entry, combined herds, dormant-season use, targeted grazing, drought) | free text or enumerated code | Per stay. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `head_in, group average weight` | ranch records | At each move and weigh-in | Valid: integer head > 0; lb (or AUE 0.5-1.5). Missing or invalid: Use groups.csv head and a class-default AUE labelled as an assumption | [RULE-GRZ-07](#rule-grz-07) | <https://www.ndsu.edu/agriculture/ag-hub/publications/determining-carrying-capacity-and-stocking-rates-range-and-pasture-north-dakota> (NDSU Extension (Meehan, Sedivec, Printz, Brummer); source result: verified) |
| `override_reason` | ranch records | When a deviation is decided | Valid: free text or enumerated code. Missing or invalid: The deviation is reported as a warning | [RULE-GRZ-01](#rule-grz-01) | <https://www.nrcs.usda.gov/sites/default/files/2025-07/528-nhcp-cps-grazing-management-2025-rev.pdf> (USDA NRCS; source result: partly) |

**pastures.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `key_species, target_stubble_in` | user record | Species monitored in the pasture's key area and its minimum residual height at end of grazing | species name; inches (e.g. western wheatgrass 4, big bluestem 6, Kentucky bluegrass 2 per SD TN9 Table 3) | Per pasture_id. | later |
| `forage_lb_ac, harvest_efficiency` | research estimate | Forage available for planning graze days | lb/ac air-dry; harvest efficiency 0.125-0.40 (NDSU: 25% season-long native, 30% tame) | Per pasture_id. | later |
| `rap_production_lb_ac by year` | public observation | RAP annual herbaceous production, weighted mean over the pasture polygon Also: Modelled herbaceous production per pasture polygon (annual; 16-day provisional for current year) | lbs/acre; years 1986 to the previous year | Per pasture polygon (real locations only). | later |
| `ecosite_id, ref_production_lbs_ac` | public observation | NRCS ecological site and its reference production | ESD ID string; lbs/acre (normal/favorable/unfavorable) | Per pasture_id (one-time lookup). | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `key_species, target_stubble_in` | ranch records | Set once and reviewed annually | Valid: species name; inches (e.g. western wheatgrass 4, big bluestem 6, Kentucky bluegrass 2 per SD TN9 Table 3). Missing or invalid: Stubble rule disabled for the pasture; show 'no target set' | [RULE-GRZ-06](#rule-grz-06) | <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf> (USDA NRCS South Dakota; source result: partly) |
| `forage_lb_ac, harvest_efficiency` | manual observation | Start of season; mid-season revision | Valid: lb/ac air-dry; harvest efficiency 0.125-0.40 (NDSU: 25% season-long native, 30% tame). Missing or invalid: Label planned days 'manager plan, not forage-derived' | [RULE-GRZ-07](#rule-grz-07) | <https://www.ndsu.edu/agriculture/ag-hub/publications/determining-carrying-capacity-and-stocking-rates-range-and-pasture-north-dakota> (NDSU Extension (Meehan, Sedivec, Printz, Brummer); source result: verified) |
| `rap_production_lb_ac by year` | public dataset | annual (one-off snapshot) | Valid: lbs/acre; years 1986 to the previous year. Missing or invalid: No polygon: omit; no county substitute | [RULE-CTX-06](#rule-ctx-06) | <https://rangelands.app/support/71-api-documentation> (Rangeland Analysis Platform (USDA ARS and partners); source result: verified) |
| `ecosite_id, ref_production_lbs_ac` | public dataset | once | Valid: ESD ID string; lbs/acre (normal/favorable/unfavorable). Missing or invalid: Label planned_graze_days as ranch-set | [RULE-CTX-14](#rule-ctx-14) | <https://sdmdataaccess.nrcs.usda.gov/WebServiceHelp.aspx> (USDA NRCS; source result: verified) |

**forage_obs.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `date, pasture_id, observer, residual_in or utilization_pct, recovery_ready, photo_point` | user record | Field check of residual and regrowth | inches or %; yes/no/unsure; text | pasture_id must exist in pastures.csv; link to the stay by pasture and date. | later |
| `stubble_in (with n_readings, ungrazed_ref_in, species)` | user record | Mean grazed height of the key species in the key area | inches >= 0; n_readings integer (NDSU suggests at least 30 per key species) | Per pasture_id and date. | later |
| `utilization_pct (method; temporal or seasonal scope)` | user record | Percent of current-year growth removed by weight | 0-100; method in {grazing-stick height-weight, ocular, paired-plot} | Per pasture_id and stay or season. | later |
| `growth_stage` | user record | Phenology of the key species (vegetative/pre-boot = fast; boot, heading, seed = slow; dormant) | enum | Per pasture_id and date. | later |
| `condition_score` | user record | Quick ranch-defined condition/readiness score for the pasture. NRCS's 10-indicator 1-5 Pasture Condition Score is framed around improved (tame) pastures; that it does not apply to rangeland is an inference, not stated in the guide. | ordinal 1-5 (ranch rubric) or NRCS PCS total for tame pasture | Per pasture_id and date. | later |
| `behavior_note` | user record | Herd behaviour that signals forage shortfall (walking fence, bunching at gate/water, selecting less-preferred plants) | enum + free text | Per group, pasture and date. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `date, pasture_id, observer, residual_in or utilization_pct, recovery_ready, photo_point` | manual observation | at move-out and before move-in | Valid: inches or %; yes/no/unsure; text. Missing or invalid: 'Recovery not checked' before planned move-in | [RULE-GRZ-05](#rule-grz-05), [RULE-GRZ-06](#rule-grz-06), [RULE-GRZ-03](#rule-grz-03) | <https://grasscast.unl.edu/docs/Examples-of-Total-Production-vs-Grazing-Production.pdf> (Grass-Cast / NDMC; source result: verified) |
| `stubble_in (with n_readings, ungrazed_ref_in, species)` | manual observation | Before entry, about weekly during occupancy, within 3 days of exit | Valid: inches >= 0; n_readings integer (NDSU suggests at least 30 per key species). Missing or invalid: Stale-observation warning; never 'OK' | [RULE-GRZ-06](#rule-grz-06) | <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/R1780%20The%20North%20Dakota%20Grazing%20Monitoring%20Stick%20%281%29.pdf> (NDSU Extension (Meehan, Sedivec, Printz); source result: verified) |
| `utilization_pct (method; temporal or seasonal scope)` | manual observation | End of each stay (temporal); end of season (seasonal) | Valid: 0-100; method in {grazing-stick height-weight, ocular, paired-plot}. Missing or invalid: Do not report compliance with take-half-leave-half | [RULE-GRZ-06](#rule-grz-06) | <https://extension.arizona.edu/sites/extension.arizona.edu/files/attachment/utilstudies.pdf> (BLM, USDA Forest Service, USDA NRCS Grazing Land Technology Institute, Cooperative Extension Service (copy hosted by University of Arizona Extension); source result: verified) |
| `growth_stage` | manual observation | Every 1-2 weeks in season | Valid: enum. Missing or invalid: Use a month proxy (May/Jun fast, Jul/Aug slow) labelled as an assumption | [RULE-GRZ-09](#rule-grz-09), [RULE-GRZ-03](#rule-grz-03) | <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf> (USDA NRCS South Dakota; source result: partly) |
| `condition_score` | manual observation | Before grazing (NRCS PCS: best just before a pasture is grazed) and at critical periods | Valid: ordinal 1-5 (ranch rubric) or NRCS PCS total for tame pasture. Missing or invalid: Not shown | [RULE-GRZ-05](#rule-grz-05) | <https://www.nrcs.usda.gov/sites/default/files/2023-06/Guide_To_Pasture_Condition_Scoring_JAN2020.pdf> (Not recorded in the research (see checker notes); source result: partly) |
| `behavior_note` | manual observation | Each check | Valid: enum + free text. Missing or invalid: Treat as unknown, not normal | [RULE-GRZ-08](#rule-grz-08) | <https://www.ars.usda.gov/ARSUserFiles/51815/67.%202020%20REM%20-%20CARM%20-%20adaptive%20multipaddock%20rotational%20grazing%20-%20vegetation%20and%20livestock%20responses.pdf> (Elsevier / Society for Range Management (author PDF hosted by USDA ARS); source result: verified) |

**meta.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `context_county_fips, context_state` | management assumption | Real county/state used as a labelled stand-in for public context (the ranch is fictional) | 5-digit FIPS (e.g. 46065); state postal code | One value; the demo uses a labelled stand-in county. | later |
| `vet_name, vet_phone, last_vet_premises_visit` | user record | Herd veterinarian contact and last recorded premises visit | text; YYYY-MM-DD | One per ranch. | later |
| `accounting_basis` | user record | Whether actuals are cash basis or accrual-adjusted | enum: cash \| accrual_adjusted | One value per season. | later |
| `record_retention_years` | management assumption | How long acknowledgement, notes and visual-check logs are kept | Integer, at least 2 (BQA recommendation), longer if law requires | One value. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `context_county_fips, context_state` | assumption | set once | Valid: 5-digit FIPS (e.g. 46065); state postal code. Missing or invalid: Hide all public-context panels | [RULE-CTX-01](#rule-ctx-01), [RULE-CTX-03](#rule-ctx-03), [RULE-CTX-15](#rule-ctx-15) | <https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=46065&startdate=9/1/2026&enddate=10/15/2026&statisticsType=1> (National Drought Mitigation Center; source result: verified) |
| `vet_name, vet_phone, last_vet_premises_visit` | ranch records | on change; per visit | Valid: text; YYYY-MM-DD. Missing or invalid: Escalation reads 'Call your veterinarian (no contact recorded)' | [RULE-HLTH-12](#rule-hlth-12), [RULE-HLTH-10](#rule-hlth-10) | <https://www.law.cornell.edu/cfr/text/21/530.3> (Cornell Legal Information Institute (reproducing the Code of Federal Regulations); source result: verified) Checker (health): 21 CFR 530.3 does not address vet contact fields; its VCPR definition ('medically appropriate and timely visits to the premises') bears only on last_vet_premises_visit. |
| `accounting_basis` | ranch records | set once per season | Valid: enum: cash \| accrual_adjusted. Missing or invalid: Label 'basis not stated' beside the spend tile | [RULE-BUD-08](#rule-bud-08) | <https://extension.okstate.edu/fact-sheets/developing-an-income-statement> (Oklahoma State University Extension; source result: verified) |
| `record_retention_years` | assumption | Set once | Valid: Integer, at least 2 (BQA recommendation), longer if law requires. Missing or invalid: Default to 2 years; never auto-delete without export | [RULE-WF-16](#rule-wf-16) | <https://www.bqa.org/Media/BQA/Docs/bqa-field-guide-2026.pdf> (Beef Quality Assurance program; source result: verified) |

**context.csv (build-time snapshot)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `usdm_pct_none/d0/d1/d2/d3/d4 (county)` | public observation | Percent of county area in each USDM category Also: U.S. Drought Monitor category D0-D4 for the ranch county / U.S. Drought Monitor category for the county | 0-100 % | Keyed by county FIPS and valid date. | later |
| `usdm_valid_date, usdm_released_at` | public observation | MapDate (Tuesday valid date) and the release instant (Thursday 08:30 ET) | YYYY-MM-DD; ISO instant | Per USDM week; select the latest released at or before as_of. | later |
| `usdm_weeks_d2plus_8wk` | public observation | Count of the last 8 weekly maps with any (or at least X%) county area in D2+ | 0-8 weeks; X% is a ranch choice | Per county and valid date. | later |
| `source_provenance (source_url, retrieved_at, license_note)` | public observation | Where each context value came from and when | URL; ISO instant; text | One per public value. | later |
| `precip_public_in, normal_in, retrieved_at` | public observation | Public gridded or station precipitation and its normal for the location | inches; retrieval timestamp (values revised for \~6 months) | Per grid cell or station and date. | later |
| `nass_pasture_vp_p_pct, g_ex_pct, week_ending` | public observation | State pasture and range condition, % very poor+poor and % good+excellent | 0-100 %; week-ending Sunday date | Per state and week. | later |
| `grasscast_pct_vs_avg, map_date, scenario` | public observation | Forecast % change in grassland production vs the cell's \~38-year average under a precipitation scenario Also: Forecast % change in total grassland production vs the grid cell's long-term average / Grass-Cast forecast of rangeland production vs the long-term average for the ranch's grid cell, by precipitation scenario | percent; date; above/near/below-normal | Per 10 km cell and map date. | later |
| `diesel_price_padd (EIA PADD 2 or PADD 4)` | public observation | Public on-highway retail diesel price incl. all taxes, used as a market index | USD/gal; weekly (Monday) and monthly | Per week or month. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `usdm_pct_none/d0/d1/d2/d3/d4 (county)` | public dataset | weekly (valid Tuesday, released Thursday 08:30 ET) | Valid: 0-100 %. Missing or invalid: Show 'Drought Monitor unavailable, last valid &lt;date>'; never 'no drought' | [RULE-CTX-01](#rule-ctx-01), [RULE-CTX-03](#rule-ctx-03), [RULE-CTX-10](#rule-ctx-10) | <https://droughtmonitor.unl.edu/DmData/DataDownload/WebServiceInfo.aspx> (National Drought Mitigation Center; source result: partly) Checker (context, grazing, gain): the Web Service Info page does not mention thousands separators and states no release schedule; the Tuesday-valid, Thursday-released timing is on the USDM home page. |
| `usdm_valid_date, usdm_released_at` | public dataset | weekly | Valid: YYYY-MM-DD; ISO instant. Missing or invalid: Do not show the category without both dates | [RULE-CTX-01](#rule-ctx-01), [RULE-CTX-02](#rule-ctx-02) | <https://www.drought.gov/drought/data-maps-tools/current-conditions> (NOAA NIDIS (drought.gov); source result: verified) Checker (context): drought.gov says only 'Thursday morning'; the 08:30 ET release time is on the USDM home page (re-read by the citation critic 2026-10-16). |
| `usdm_weeks_d2plus_8wk` | public dataset | weekly | Valid: 0-8 weeks; X% is a ranch choice. Missing or invalid: Show 'incomplete series' if any week is missing | [RULE-CTX-03](#rule-ctx-03) | <https://www.fsa.usda.gov/resources/programs/livestock-forage-disaster-program-lfp> (USDA Farm Service Agency; source result: verified) |
| `source_provenance (source_url, retrieved_at, license_note)` | public dataset | each refresh | Valid: URL; ISO instant; text. Missing or invalid: Do not display a value without provenance | [RULE-CTX-15](#rule-ctx-15), [RULE-CTX-16](#rule-ctx-16) | <https://droughtmonitor.unl.edu/About/Permission.aspx> (National Drought Mitigation Center; source result: verified) Checker (context): the Permission page's 'Map courtesy of NDMC' wording is map guidance; applying it to data rows is an extension. |
| `precip_public_in, normal_in, retrieved_at` | public dataset | daily, revised up to 8 times over 6 months (PRISM) | Valid: inches; retrieval timestamp (values revised for \~6 months). Missing or invalid: Show the gauge only | [RULE-CTX-10](#rule-ctx-10) | <https://www.prism.oregonstate.edu/documents/PRISM_downloads_web_service.pdf> (PRISM Group, Oregon State University; source result: verified) |
| `nass_pasture_vp_p_pct, g_ex_pct, week_ending` | public dataset | weekly in season (the 4:00 pm ET release time comes from a 2007 NASS document and was not confirmed by a current source) | Valid: 0-100 %; week-ending Sunday date. Missing or invalid: Off-season or missing: 'no report for week ending X' | [RULE-CTX-04](#rule-ctx-04) | <https://www.nass.usda.gov/Statistics_by_State/Kansas/Publications/Crop_Progress_and_Condition/2026/KS-weekly0706.pdf> (USDA NASS Kansas Field Office; source result: verified) |
| `grasscast_pct_vs_avg, map_date, scenario` | public dataset | every two weeks, late April to Aug 31 | Valid: percent; date; above/near/below-normal. Missing or invalid: Out of season: show the final value with 'season closed' or hide | [RULE-CTX-05](#rule-ctx-05), [RULE-GAIN-08](#rule-gain-08) | <https://grasscast.unl.edu/Outlook/About.aspx> (NDMC and partners; source result: verified) |
| `diesel_price_padd (EIA PADD 2 or PADD 4)` | public dataset | weekly | Valid: USD/gal; weekly (Monday) and monthly. Missing or invalid: Hide the context line; never block budget alerts | [RULE-BUD-09](#rule-bud-09) | <https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EMD_EPD2D_PTE_R20_DPG&f=M> (U.S. Energy Information Administration; source result: partly) |

**rain_gauge.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `gauge_id, date, precip_in` | user record | Ranch-measured daily precipitation Also: Precipitation since a reference date vs normal | inches >= 0; one row per day; blank is not zero | One row per gauge per day; blank is not zero. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `gauge_id, date, precip_in` | manual observation | daily or after each event | Valid: inches >= 0; one row per day; blank is not zero. Missing or invalid: Gaps block % of normal; show 'gauge record incomplete' | [RULE-CTX-10](#rule-ctx-10) | <https://ranchdrought.unl.edu/Monitor.aspx> (National Drought Mitigation Center, UNL; source result: verified) |

**drought_plan.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `trigger (date, indicator, threshold, action)` | user record | Ranch-defined critical dates and actions | date; text; number; text | One row per trigger. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `trigger (date, indicator, threshold, action)` | ranch records | annual review | Valid: date; text; number; text. Missing or invalid: No trigger prompts | [RULE-CTX-10](#rule-ctx-10) | <https://ranchdrought.unl.edu/Plan.aspx> (National Drought Mitigation Center, UNL; source result: partly) |

**weigh_sessions.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `scale_id, check_weight_lbs, check_reading_lbs, zeroed` | user record | Which scale was used and the result of the zero/known-weight check | string; lb; lb; yes/no | Per (group, date). | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `scale_id, check_weight_lbs, check_reading_lbs, zeroed` | ranch records | per weigh session | Valid: string; lb; lb; yes/no. Missing or invalid: Informational 'scale not checked' note | [RULE-GAIN-11](#rule-gain-11) | <https://pami.ca/pdfs/reports_research_updates/(5e)%20Livestock%20Scales/654.PDF> (Prairie Agricultural Machinery Institute; source result: verified) |

**gain_expectations.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `group, forage type, start_date, end_date, expected_adg_lbs, supplemented` | research estimate | Expected ADG for a period of the season Also: Whether the group is receiving supplement in the period | lb/d, typically -0.5 to 3.0; dates ISO | Per group and season segment. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `group, forage type, start_date, end_date, expected_adg_lbs, supplemented` | ranch records | per season, revised with forage outlook | Valid: lb/d, typically -0.5 to 3.0; dates ISO. Missing or invalid: Report ADG without verdict, or compare to ranch prior years | [RULE-GAIN-08](#rule-gain-08) | <https://ars.usda.gov/ARSUserFiles/30300500/Publications/JRM55-135-138.pdf> (Society for Range Management / USDA-ARS Fort Keogh (PDF hosted by USDA-ARS); source result: verified) |

**bcs.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `group or tag, date, score, target` | user record | Body condition score of a cow or first-calf heifer (or a group median from a sample) Also: Ranch target BCS at a scoring point / Body condition score | 1-9, half points allowed | tag must exist in the animal list, or group in groups.csv. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `group or tag, date, score, target` | manual observation | weaning, \~45 d after weaning, \~90 d before calving, calving, breeding start, late summer in drought | Valid: 1-9, half points allowed. Missing or invalid: 'Condition not recorded' shown; no 'all clear' | [RULE-CTX-12](#rule-ctx-12), [RULE-GAIN-05](#rule-gain-05), [RULE-GAIN-04](#rule-gain-04) | <https://beef.unl.edu/learning/condition1a.shtml> (Nebraska Extension (BeefWatch); source result: verified) |

**replacement.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `mature_weight_lbs, target_pct_mature, breeding_start` | user record | Inputs for the replacement-heifer target-weight projection | lb; 50-70 %; ISO date | Per heifer group. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `mature_weight_lbs, target_pct_mature, breeding_start` | ranch records | per development season | Valid: lb; 50-70 %; ISO date. Missing or invalid: No projection | [RULE-GAIN-09](#rule-gain-09) | <https://extension.sdstate.edu/targeted-feeding-heifer-development> (SDSU Extension; source result: verified) |

**observations.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `date, group, tag(s), observer, head_with_signs, sign_code, note, escalated` | user record | What was seen on a pasture check, recorded as signs, not diagnoses Also: What was seen when a slow animal was checked | sign_code from a fixed list (watery_eyes, squinting, cloudy_eye, lame, off_feed, found_dead, abortion, other); head_with_signs integer >= 0 | group in groups.csv; tags in weights.csv. Observations only; no diagnosis. | later |
| `fly_count_per_animal` | user record | Scouted fly count per animal (record the species; the NDSU 200-per-animal threshold names none) | integer >= 0 | Per group and date. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `date, group, tag(s), observer, head_with_signs, sign_code, note, escalated` | manual observation | every pasture check; at least the ranch-set interval in fly season | Valid: sign_code from a fixed list (watery_eyes, squinting, cloudy_eye, lame, off_feed, found_dead, abortion, other); head_with_signs integer >= 0. Missing or invalid: 'No check recorded since [date]'. Never 'group clear'. | [RULE-HLTH-05](#rule-hlth-05), [RULE-HLTH-10](#rule-hlth-10), [RULE-HLTH-11](#rule-hlth-11), [RULE-GAIN-02](#rule-gain-02) | <https://www.ag.ndsu.edu/news/newsreleases/2025/july/summer-brings-raised-pinkeye-concerns-in-cowherds> (NDSU Agriculture Communication (J. Galbreath, L. Quail); source result: verified) |
| `fly_count_per_animal` | manual observation | weekly in season (ranch choice) | Valid: integer >= 0. Missing or invalid: Ignore | [RULE-HLTH-05](#rule-hlth-05) | <https://www.ag.ndsu.edu/news/newsreleases/2024/may/controlling-flies-on-cattle-requires-proper-timing> (NDSU Extension and Ag Research News (Stokka, Tobin, Hoppe); source result: partly) Checker (health): the NDSU 2024 article gives 200 flies per animal as the economic threshold but names no species. |

**health.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `task_id` | user record | Stable ID of a scheduled health task, so completions can link to it | string, unique | Unique per task. | later |
| `animal_ids` | user record | Individual IDs when the task or record is for specific animals (official 840 EID where applicable) | list of IDs; official ID format per APHIS for covered cattle | Official IDs where APHIS rules apply. | later |
| `task_type` | user record | Kind of job; sets lead time, severity and wording | vaccination \| parasite_control \| fly_control \| observation \| vet_exam (pregnancy check, BSE) \| other | Per task. | later |
| `schedule_source` | user record | Who set the timing | product_label \| vet_plan \| ranch_plan | Per task. | later |
| `window_start, window_end` | user record | Earliest acceptable date (from label, vet plan, or derived from breeding dates) Also: Latest acceptable date. Replaces the single next_due as the overdue test. | YYYY-MM-DD (date-only, as health dates already are; HB-C8 observed these are zone-safe) | Per task; window_end on or after window_start. | later |
| `responsible, vet_needed` | user record | Person or role who owns the task (crew lead, herd vet) Also: Task needs the veterinarian present or booked (preg check, BSE, prescription product) | text | Per task. | later |
| `fly_season_start / fly_season_end` | management assumption | Ranch-entered dates bounding face- and horn-fly season for observation cadence and fly-tag in and out tasks | YYYY-MM-DD | Per year. | later |
| `planned_work_start / planned_work_end` | user record | Planned gather or processing time for a task day | local datetime with a stated time zone (meta.csv as_of has no zone today) | Per handling task; local time with zone. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `task_id` | ranch records | when a task is planned | Valid: string, unique. Missing or invalid: Reject the row with a visible data-issue message. Do not drop it silently. | [RULE-HLTH-06](#rule-hlth-06), [RULE-WF-16](#rule-wf-16) | No supporting source. Checker (health): the BQA manual does not address task IDs. Evidence URL removed. |
| `animal_ids` | ranch records | per record | Valid: list of IDs; official ID format per APHIS for covered cattle. Missing or invalid: Treat the record as a group record | [RULE-HLTH-06](#rule-hlth-06) | <https://www.govinfo.gov/content/pkg/FR-2024-05-09/html/2024-09717.htm> (USDA APHIS Animal Disease Traceability EID rule; source result: verified) |
| `task_type` | ranch records | per task | Valid: vaccination \| parasite_control \| fly_control \| observation \| vet_exam (pregnancy check, BSE) \| other. Missing or invalid: Use neutral wording ('Past planned date') and no vaccination or observation wording | [RULE-HLTH-04](#rule-hlth-04), [RULE-HLTH-11](#rule-hlth-11) | <https://www.ag.ndsu.edu/news/newsreleases/2025/july/summer-brings-raised-pinkeye-concerns-in-cowherds> (NDSU Agriculture Communication (J. Galbreath, L. Quail); source result: verified) |
| `schedule_source` | ranch records | per task | Valid: product_label \| vet_plan \| ranch_plan. Missing or invalid: Show 'window source not recorded: check label or vet plan'. No confident overdue wording. | [RULE-HLTH-04](#rule-hlth-04) | <https://vetext.vetmed.ucdavis.edu/sites/g/files/dgvnsk5616/files/local_resources/pdfs/pdfs_beef/cca0810-booster-vaccines.pdf> (UC Davis School of Veterinary Medicine Extension (J. Maas), in California Cattlemen's Magazine; source result: verified) |
| `window_start, window_end` | ranch records | per task | Valid: YYYY-MM-DD (date-only, as health dates already are; HB-C8 observed these are zone-safe). Missing or invalid: Warn from window_end minus lead time | [RULE-HLTH-04](#rule-hlth-04) | <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf> (Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor); source result: verified) |
| `responsible, vet_needed` | ranch records | per task | Valid: text. Missing or invalid: Show 'Unassigned' in the row | [RULE-HLTH-04](#rule-hlth-04), [RULE-WF-17](#rule-wf-17) | <https://www.kla.org/Media/KLA/Docs/bqarecordkeeping.pdf> (Kansas Livestock Association / Kansas BQA (per URL and form text); source result: verified) Checker (health): the KS-BQA form's 'Crew Initials' records who did the work, not who owns an upcoming task. |
| `fly_season_start / fly_season_end` | assumption | yearly (adjust in-season) | Valid: YYYY-MM-DD. Missing or invalid: Do not run the fly-season observation rule; show a note | [RULE-HLTH-05](#rule-hlth-05) | <https://www.ag.ndsu.edu/news/newsreleases/2024/may/controlling-flies-on-cattle-requires-proper-timing> (NDSU Extension and Ag Research News (Stokka, Tobin, Hoppe); source result: partly) |
| `planned_work_start / planned_work_end` | ranch records | per scheduled gather | Valid: local datetime with a stated time zone (meta.csv as_of has no zone today). Missing or invalid: Skip the heat check | [RULE-CTX-07](#rule-ctx-07) | <https://newsroom.unl.edu/announce/beef/8200/47172> (University of Nebraska-Lincoln BeefWatch (Eirich, Woolsoncroft); source result: verified) |

**health_records.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `done_date, done_by` | user record | Date the task was completed (completion record, append-only) Also: Person administering or performing the task | YYYY-MM-DD, not after as_of | Per completion; task_id foreign key. | later |
| `head_done, head_planned` | user record | Number of head actually worked or treated Also: Group head count at the time of the task | integer 0..group head | Per completion; head_done &lt;= group head. | later |
| `product_and_lot, route_location` | user record | Product name and manufacturer lot/serial number (record only, never shown as an instruction) Also: Route and injection site (record only) | text | Per completion. | later |
| `withdrawal_clear_date` | user record | Earliest date the animals clear withdrawal (from label, or from the veterinarian for extralabel use) | YYYY-MM-DD | Per completion; from the label or the veterinarian, never computed by the dashboard. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `done_date, done_by` | ranch records | per completion | Valid: YYYY-MM-DD, not after as_of. Missing or invalid: 'done' without done_date shows as 'record incomplete' | [RULE-HLTH-06](#rule-hlth-06), [RULE-WF-16](#rule-wf-16) | <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf> (Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor); source result: verified) |
| `head_done, head_planned` | ranch records | per completion | Valid: integer 0..group head. Missing or invalid: 'head count not recorded'. Do not claim full coverage. | [RULE-HLTH-07](#rule-hlth-07) | <https://www.kla.org/Media/KLA/Docs/bqarecordkeeping.pdf> (Kansas Livestock Association / Kansas BQA (per URL and form text); source result: verified) Checker (health): the KS-BQA form's 'No. of Head' supports head_done (head processed), not head_planned. |
| `product_and_lot, route_location` | ranch records | per completion | Valid: text. Missing or invalid: 'record incomplete' | [RULE-HLTH-06](#rule-hlth-06) | <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf> (Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor); source result: verified) Record only. Never shown as an instruction; may stay in the ranch's health record system ([RULE-WF-16](#rule-wf-16)). |
| `withdrawal_clear_date` | ranch records | per completion | Valid: YYYY-MM-DD. Missing or invalid: Block any 'clear to ship' reading; show 'withdrawal not recorded' | [RULE-HLTH-08](#rule-hlth-08) | <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf> (Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor); source result: verified) |

**marketing plan**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `planned_ship_date` | user record | Planned sale, shipping or cull date per group | YYYY-MM-DD | Per group or lot. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `planned_ship_date` | ranch records | as marketing plans change | Valid: YYYY-MM-DD. Missing or invalid: Skip the conflict check and say so | [RULE-HLTH-08](#rule-hlth-08) | <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_field-_guide.pdf> (Beef Quality Assurance program; source result: verified) |

**breeding.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `group, bull_in_date, bull_out_date` | user record | Breeding season exposure dates Also: Breeding-season dates per group | dates | Per group and season. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `group, bull_in_date, bull_out_date` | ranch records | per season | Valid: dates. Missing or invalid: Cannot compute earliest preg-check date | [RULE-CTX-12](#rule-ctx-12), [RULE-HLTH-09](#rule-hlth-09) | <https://guidelines.beefimprovement.org/index.php/Exposure_Data> (Beef Improvement Federation Guidelines; source result: verified) |

**preg_check.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `group, date, method, pregnant_n, open_n` | user record | Pregnancy diagnosis results for exposed females | date; palpation\|ultrasound\|blood; counts | Per group and date. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `group, date, method, pregnant_n, open_n` | ranch records | per season | Valid: date; palpation\|ultrasound\|blood; counts. Missing or invalid: Task stays open | [RULE-CTX-12](#rule-ctx-12) | <https://guidelines.beefimprovement.org/index.php/Pregnancy_Data> (Beef Improvement Federation Guidelines; source result: verified) |

**losses.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `death_date, group, id, cause_known, abortion flag; baseline_loss_rate` | user record | Deaths and pregnancy losses, plus the herd's own historical rate | dates, IDs; baseline as % per season | Per event; group in groups.csv. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `death_date, group, id, cause_known, abortion flag; baseline_loss_rate` | ranch records | as events occur; baseline yearly | Valid: dates, IDs; baseline as % per season. Missing or invalid: Show counts only and 'set a baseline with your veterinarian' | [RULE-HLTH-10](#rule-hlth-10) | <https://beef.unl.edu/beefwatch/2023/investigating-cause-cattle-abortions-when-involve-your-veterinarian-and-what-happens/> (Nebraska Extension BeefWatch (M. Hille, D. Steffen); source result: partly) |

**budget.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `reforecast_usd` | user record | Revised plan for a remaining month after a reforecast | USD >= 0 | Per (month, category). | later |
| `entry_type` | user record | Kind of entry: expense, refund, credit, rebate, tax_credit, prepaid, capital | enum | Per entry. | later |
| `variance_note, owner` | user record | Manager's explanation and who is responsible for a serious variance | free text; name or role | Per (month, category) variance. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `reforecast_usd` | ranch records | when reforecast (monthly or quarterly) | Valid: USD >= 0. Missing or invalid: Compare against original budget only | [RULE-BUD-11](#rule-bud-11) | <https://www.fcsamerica.com/resources/learning-center/cash-flow-budgeting-about-amount-and-timing> (Farm Credit Services of America; source result: verified) |
| `entry_type` | ranch records | per entry | Valid: enum. Missing or invalid: Treated as expense; credits cannot be shown separately | [RULE-BUD-07](#rule-bud-07) | <https://extension.psu.edu/farm-accrual-adjustments-to-a-cash-basis-income-statement> (Penn State Extension (Miguel Antonio Saviroff); source result: partly) Checker (budget): Penn State supports only the prepaid and payable kinds; refund, credit, rebate, tax_credit and capital are design choices. |
| `variance_note, owner` | manual observation | per serious variance, monthly | Valid: free text; name or role. Missing or invalid: Alert stays open with 'no explanation recorded' | [RULE-BUD-03](#rule-bud-03), [RULE-BUD-13](#rule-bud-13) | <https://gfoa.org/materials/budget-monitoring> (Government Finance Officers Association (GFOA); source result: partly) |

**derived**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `total_season_budget_usd` | user record | Sum of all categories' phased budget to date, used to scale dollar floors | USD | Sum of budget.csv for the season. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `total_season_budget_usd` | ranch records | derived each refresh | Valid: USD. Missing or invalid: Use fixed-dollar floors | [RULE-BUD-03](#rule-bud-03) | No supporting source. Checker (budget): U Alberta's 5% is a share of a unit's own revised budget for year-end carry-forward; nothing scales dollar floors as a share of an organization-wide total. Evidence URL removed. |

**fuel.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `gallons, price_usd_per_gal (actual)` | user record | Gallons delivered or purchased in the month by fuel type Also: Average price paid per gallon from invoices | gal >= 0; fuel_type enum dyed_diesel \| diesel \| gasoline | Per delivery; summed by month. | later |
| `plan_gallons, plan_price_usd_per_gal` | user record | The quantity and price assumptions behind the fuel budget | gal; USD/gal | Per month. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `gallons, price_usd_per_gal (actual)` | ranch records | per delivery, summed monthly | Valid: gal >= 0; fuel_type enum dyed_diesel \| diesel \| gasoline. Missing or invalid: No price/volume split; say 'price vs use unknown' | [RULE-BUD-09](#rule-bud-09) | <https://extension.msstate.edu/publications/farm-machinery-cost-calculations> (Mississippi State University Extension (Jeff Johnson); source result: partly) Checker (budget): MSU P3543 supports modelling fuel as quantity x price for machinery costing only; it says nothing about delivery tickets or variance analysis. |
| `plan_gallons, plan_price_usd_per_gal` | ranch records | set at budget time; updated on reforecast | Valid: gal; USD/gal. Missing or invalid: No price/volume split | [RULE-BUD-09](#rule-bud-09) | No supporting source. Checker (budget): the UNL 2026 cow-herd budget gives fuel only in dollars, with no gallons or price per gallon. Evidence URL removed. |

**repairs.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `date, asset_id, amount_usd, planned flag, hours_or_miles` | user record | Individual repair events for lumpy-cost attribution | ISO date; text id; USD; boolean; hours or miles >= 0 | Per event. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `date, asset_id, amount_usd, planned flag, hours_or_miles` | ranch records | per event | Valid: ISO date; text id; USD; boolean; hours or miles >= 0. Missing or invalid: Repairs alert shows monthly total only, with no 'one breakdown' attribution | [RULE-BUD-10](#rule-bud-10) | <https://blog.uvm.edu/groundwk/files/2016/05/Replacement-Strategies-for-Farm-Machinery.pdf> (Iowa State University Extension and Outreach (William Edwards), hosted copy on UVM blog; source result: verified) |

**head_count.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `head by group and month` | user record | Head on hand for per-head context (cost per head vs extension benchmarks) | integer >= 0 | Per group and month. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `head by group and month` | ranch records | monthly or on change | Valid: integer >= 0. Missing or invalid: No per-head view | [RULE-BUD-12](#rule-bud-12) | <https://www.beefmagazine.com/beef/what-your-cow-calf-cost-production> (Beef Magazine (reporting North Dakota Farm Management Education program data); source result: verified) |

**budget_annual.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `annual_budget_usd per category` | user record | Full-year budget, so season-to-date can be read against the annual plan (extension budgets are annual) | USD >= 0 | Per category and year. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `annual_budget_usd per category` | ranch records | once per year; on reforecast | Valid: USD >= 0. Missing or invalid: Show season-to-date only | [RULE-BUD-10](#rule-bud-10), [RULE-BUD-12](#rule-bud-12) | <https://cap.unl.edu/cattlebudgets/northern-panhandle/> (University of Nebraska-Lincoln Center for Agricultural Profitability; source result: verified) |

**inventory.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `item, unit, on_hand, count_date, daily_use, lead_time_days` | user record | Feed, supplement and mineral stock | tons/bales/lbs/bags; numbers >= 0; date | Per item. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `item, unit, on_hand, count_date, daily_use, lead_time_days` | ranch records | weekly or at delivery/count | Valid: tons/bales/lbs/bags; numbers >= 0; date. Missing or invalid: Quantity only, no days on hand | [RULE-CTX-11](#rule-ctx-11) | <https://ranchdrought.unl.edu/Plan.aspx> (National Drought Mitigation Center, UNL; source result: partly) |

**maintenance.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `asset_id, asset_type, task, last_done, interval_days, next_due, status, assignee` | user record | Fence, water and equipment upkeep log | text; dates; integer days; open\|done | Per asset task. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `asset_id, asset_type, task, last_done, interval_days, next_due, status, assignee` | ranch records | as work is done | Valid: text; dates; integer days; open\|done. Missing or invalid: No overdue judgement without next_due/interval | [RULE-CTX-13](#rule-ctx-13) | <https://www.ndsu.edu/agriculture/extension/publications/livestock-water-requirements> (NDSU Extension; source result: verified) |

**crew_task.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `task_id, area, subject, assignee, due_date, status, source_exception` | user record | Who is doing what, linked to the exception that created it | text; date; open\|in-progress\|done | source_exception = exception_id. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `task_id, area, subject, assignee, due_date, status, source_exception` | ranch records | daily | Valid: text; date; open\|in-progress\|done. Missing or invalid: Unassigned tasks listed as 'unassigned' | [RULE-CTX-13](#rule-ctx-13) | No supporting source. Checker (context): the NDMC 'Plan for Drought' page does not support a crew_task field. Evidence URL removed. |

**acknowledgements.csv (shared log)**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `first_seen_at` | user record | First load or run at which this exception_id was active (current event) | ISO 8601 | Per exception_id event. | later |
| `cleared_at` | user record | When the data first showed the condition back to normal | ISO 8601 | Per exception_id event. | later |
| `ack_by, ack_at` | user record | Who acknowledged the current event, and when | Person name or initials from the crew roster; ISO 8601 | Per exception_id event. | later |
| `ack_note / planned_action` | user record | Free-text note: what was decided (e.g. 'hauling water 2 pm; float part ordered') | Text up to \~280 chars; no treatment details | Per exception_id event. | later |
| `owner (assigned_to), due_by` | user record | Who will do the first step, and by when | Crew roster name; date | Per exception_id event. | later |
| `shelved_until, shelve_reason, shelved_by` | user record | Time-limited hide of a known item, with justification | ISO 8601 (bounded max per severity); text; name | Per exception_id event. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `first_seen_at` | ranch records | Set once per event; a new event after clearing gets a new value | Valid: ISO 8601. Missing or invalid: Show 'age unknown' (not 'new') | [RULE-WF-13](#rule-wf-13) | <https://www.hse.gov.uk/pubns/chis6.pdf> (UK Health and Safety Executive; source result: verified) Checker (workflow): HSE CHIS6 supports reducing standing alarms; the first_seen_at field design is the researcher's. |
| `cleared_at` | ranch records | Computed every load | Valid: ISO 8601. Missing or invalid: If unknown, a row that disappears is listed as 'no longer flagged (time unknown)' in the Resolved strip | [RULE-WF-11](#rule-wf-11), [RULE-WF-13](#rule-wf-13) | <https://docs.inductiveautomation.com/docs/8.1/platform/alarming> (Inductive Automation (vendor documentation); source result: partly) Checker (workflow): Ignition supports separate event states and new events on recurrence, not the cleared_at field design itself. |
| `ack_by, ack_at` | assumption | On action | Valid: Person name or initials from the crew roster; ISO 8601. Missing or invalid: Row shown as unacknowledged. A missing ack_by is stored as 'unattributed'. | [RULE-WF-11](#rule-wf-11), [RULE-WF-16](#rule-wf-16) | No supporting source. Checker (workflow): the Ignition manual never mentions recording the acknowledging user or time; a design assumption. Evidence URL removed. |
| `ack_note / planned_action` | manual observation | On action | Valid: Text up to \~280 chars; no treatment details. Missing or invalid: Empty is allowed | [RULE-WF-11](#rule-wf-11), [RULE-WF-16](#rule-wf-16) | <https://www.bqa.org/Media/BQA/Docs/bqa-field-guide-2026.pdf> (Beef Quality Assurance program; source result: verified) Checker (workflow): the BQA Field Guide supports record keeping only; the \~280-character limit and 'no treatment details' are design choices. |
| `owner (assigned_to), due_by` | assumption | Daily at review | Valid: Crew roster name; date. Missing or invalid: Show 'unassigned', and list it in the briefing under 'unassigned' | [RULE-WF-18](#rule-wf-18), [RULE-CTX-13](#rule-ctx-13) | No supporting source. Checker (workflow): Cornell's 'Onboarding Farm Employees' page says nothing about task owners or due dates. Evidence URL removed. |
| `shelved_until, shelve_reason, shelved_by` | manual observation | On action; re-evaluated at expiry | Valid: ISO 8601 (bounded max per severity); text; name. Missing or invalid: Reject the shelve if the expiry or reason is missing. Critical rows cannot be shelved. | [RULE-WF-12](#rule-wf-12) | <http://www.exida.com/articles/ALARM-MANAGEMENT-AND-ISA-18-A-JOURNEY-NOT-A-DESTINATION.pdf> (exida.com LLC (consultancy). Authors Stauffer, Sands, Dunn.; source result: partly) |

**rules change log**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `rule_change_log (rule_id, old, new, changed_by, changed_at, reason)` | user record | Why each threshold and severity exists, and its history | Text and enum A/B/C/D; audit rows | Per change; until then the repository history is the record. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `rule_change_log (rule_id, old, new, changed_by, changed_at, reason)` | ranch records | On change | Valid: Text and enum A/B/C/D; audit rows. Missing or invalid: Label the threshold 'Demo setting (unvalidated)' | [RULE-WF-20](#rule-wf-20) | <https://www.hse.gov.uk/pubns/chis6.pdf> (UK Health and Safety Executive; source result: verified) Checker (workflow): HSE CHIS6 supports alarm change control and audits; the change-log schema is the researcher's design. |

**crew_roster.csv**

| Field | Example status | Meaning | Units and valid values | Identifier and relationship rules | Required |
|---|---|---|---|---|---|
| `name, role, language preference, route/pastures` | user record | Who can be assigned, and how their briefing is printed | Text; language code (e.g. en, es) | Per person; route pastures must exist in pastures.csv. | later |

| Field | Source type | Timestamp and update frequency | Validation and missing-data behaviour | Decisions supported (rules) | Evidence |
|---|---|---|---|---|---|
| `name, role, language preference, route/pastures` | ranch records | Seasonal | Valid: Text; language code (e.g. en, es). Missing or invalid: Print a single unassigned briefing in English | [RULE-WF-17](#rule-wf-17) | <https://bpb-us-e1.wpmucdn.com/blogs.cornell.edu/dist/7/8192/files/2018/03/SOPManual-1-2drpn48.pdf> (Penn State College of Agricultural Sciences, Cooperative Extension (R. Stup); hosted by Cornell; source result: verified) Checker (workflow): Stup (Penn State) has no translation advice; translation comes from Skellie (Cornell 2019). |

## 5. CSV import before integrations

### 5.1 Assessment (recommendation)

**Build CSV import and validation first, and bring every later data source in through it.** The evidence for this order:

1. **Every rule depends on the reader, and the reader is the weakest part of the page today.** The CSV audit's repro script reports "66 cases: 8 MATCH, 58 MISMATCH" against the expected behaviour ([CSV-01](02-findings.md#csv-01)). Of the 18 high-severity findings, 13 are fixed wholly or partly in the reader and the per-file data contract (grouping made for this document): [LOAD-01](02-findings.md#load-01), [CSV-01](02-findings.md#csv-01), [CSV-02](02-findings.md#csv-02), [CSV-03](02-findings.md#csv-03), [CSV-04](02-findings.md#csv-04), [CSV-05](02-findings.md#csv-05), [CSV-06](02-findings.md#csv-06), [DATA-01](02-findings.md#data-01), [DATA-02](02-findings.md#data-02), [WAT-01](02-findings.md#wat-01), [WAT-02](02-findings.md#wat-02), [HLTH-01](02-findings.md#hlth-01) and [BUD-02](02-findings.md#bud-02).
2. **The failures are silent, which is the worst outcome for a manager.** Quoted from `findings.json`:
   - A space after a header name: "Header 'level_pct ': LOST 'critical|Water|Tank T2 (Windmill)|Down to 11.8% full' and the T4 leak" ([CSV-03](02-findings.md#csv-03)).
   - A sensor fault code: "W-10: 'level=\"ERR\" drop24h=NaN; (no water alerts)'" ([WAT-01](02-findings.md#wat-01)).
   - A missing health file: "Health filter 'Nothing in health needs attention.'" ([LOAD-01](02-findings.md#load-01)).
   - One blank budget cell: "CSV-45: 'serious|Fuel|2700324931% over season to date (\$259,231,193,400)'" ([CSV-04](02-findings.md#csv-04)).
   - An unknown pasture ID: "alertRows=0 waterCharts=0 grazingChart=false" with a page error ([DATA-01](02-findings.md#data-01)).
3. **No integration can be relied on yet, and each would arrive as tabular data anyway.**
   - Browser access to public data services is unverified: "No CORS header was observed for any source", and "All browser-side claims are therefore UNVERIFIED" (context research).
   - Some services need things a static page cannot keep private or set: NASS Quick Stats "needs an API key; a key in browser code would be public", and the NWS API requires a User-Agent header that "Browsers may not let page scripts set".
   - Live data does not match a fictional snapshot. The context research observed "live USDM valid 2026-10-13 versus ranch as_of 2026-09-30".
   - Vendor devices and software have no verified export or API: Ranchbot and Farmbot, "no public export or API verified"; LoneStar, "No API or export is mentioned"; Tru-Test, "The CSV format was not confirmed in the fetched info sheet"; CattleMax, "The fetched article does not mention CSV export or an API"; a ranch accounting export, "Not researched; no vendor documentation fetched".
   - The research itself recommends a CSV contract for most of them: "Define a minimal CSV contract (tag, eid, date, time, weight_lbs, session) and ingest raw weights, never vendor-computed ADG" (chute scales); "Import a CSV export if one exists, carrying status and battery" (tank monitors); "Define a plain CSV contract ... rather than integrating a vendor; keep it vendor-neutral" (accounting); "commit a CSV with provenance" (drought statistics).
4. **It keeps the architecture simple.** A validated CSV reader needs no framework, backend, key or paid service, and the existing GitHub test workflow stays offline and deterministic. The context research's pattern for public data, used in Phase 3, is a build-time fetch that writes a dated CSV with provenance: "do not fetch public data from the browser at view time."

### 5.2 What the Phase 1 import must do

Each line is a recommendation tied to the finding it fixes. Details and regression tests are in `02-findings.md`.

| Check | Behaviour | Fixes |
|---|---|---|
| Read real CSV | RFC 4180 fields: quoted commas, escaped quotes, line breaks inside quotes; CRLF, LF and CR line ends; a leading BOM stripped. | [CSV-01](02-findings.md#csv-01) |
| Skip non-records, visibly | Blank, whitespace-only and `,,,` rows and repeated header rows are dropped and counted in a data note. | [CSV-02](02-findings.md#csv-02) |
| Required columns | Each file declares its required columns. Header names are trimmed. A missing column makes that area CAN'T TELL with the file and column named. | [CSV-03](02-findings.md#csv-03) |
| Blank means missing | An empty cell becomes null, never 0 or "". Each rule handles null explicitly. | [CSV-04](02-findings.md#csv-04) |
| Trim | Every cell and key is trimmed before use; ID case rules are stated in the contract. | [CSV-05](02-findings.md#csv-05) |
| Declared types only | Only declared numeric columns become numbers. IDs, tags, group names, task names, categories, statuses and dates stay strings, so leading zeros are kept. | [CSV-06](02-findings.md#csv-06) |
| Encoding | Decode as UTF-8; on failure decode as Windows-1252 and show a data note naming the file. | [CSV-07](02-findings.md#csv-07) |
| References | `pasture_id`, `tank_id` and `group` must exist in their master files; a miss is a data issue row and lookups fall back to the raw ID. | [DATA-01](02-findings.md#data-01), [WAT-02](02-findings.md#wat-02) |
| Dates and times | ISO 8601 only, checked to be real dates; times read in the ranch time zone; parsed once. | [DATA-02](02-findings.md#data-02), [TIME-02](02-findings.md#time-02), [TIME-03](02-findings.md#time-03) |
| Duplicates | Key uniqueness per file; exact duplicates dropped and counted, conflicting duplicates shown as data issues; at most one open stay per group. | [DATA-03](02-findings.md#data-03), [GRZ-02](02-findings.md#grz-02) |
| Ranges | Tank level a finite number from 0 to 100; weights and daily gain plausible; money parsed by a stated rule. | [WAT-01](02-findings.md#wat-01), [GAIN-04](02-findings.md#gain-04), [BUD-02](02-findings.md#bud-02) |
| Animal identity | Animals keyed by group and tag (or a unique animal ID), not tag alone. | [GAIN-06](02-findings.md#gain-06) |
| As-of cutoff | Rows dated after `as_of` are excluded from every rule and reported. | [TIME-01](02-findings.md#time-01) |
| Load failures | A file that is missing, empty or fails to load is named in a visible error; a loading state exists; each section renders on its own. | [LOAD-01](02-findings.md#load-01), [LOAD-02](02-findings.md#load-02) |
| Status values | Health status trimmed and lower-cased and checked against a list; an unknown status is a data issue. | [HLTH-01](02-findings.md#hlth-01) |
| Safe display | CSV text is escaped before it reaches the page (no unescaped innerHTML). | [SEC-01](02-findings.md#sec-01) |

Per-file keys proposed in [DATA-03](02-findings.md#data-03): `pasture_id` (pastures), `group` (groups), `tank_id` (tanks), (`month`, `category`) (budget), (`group`, `task`, `next_due`) (health), (`tank_id`, `time`) (water), (`tag`, `date`) (weigh-ins), and at most one open move per group. [GAIN-06](02-findings.md#gain-06) adds that animals are keyed by (`group`, `tag`) or a unique animal ID, not by tag alone. The field-level rules are in section 4.2.

### 5.3 How later data should arrive

- **Ranch records and device exports** (weigh sessions, tank readings, health records, fuel tickets, the general ledger): exported or typed into a CSV that meets the same contract, then committed. Vendor-computed values (projected levels, computed daily gain) are never taken in place of the raw readings.
- **Public context** (Phase 3): fetched at build time by a separate, manually triggered or scheduled workflow, written as a dated CSV with `source_url`, `retrieved_at`, `released_at`, `valid_date` and an attribution or licence note, pinned to the fictional as-of time ([RULE-CTX-15](#rule-ctx-15)). A missing week is shown as unavailable, never as "no drought".
- **Shared crew records** (acknowledgements, owners, visual checks): deferred. Browser storage is per device only ([RULE-WF-15](#rule-wf-15)); a committed append-only file has no write path for live crew use.

### 5.4 Integrations at a glance

No integration is recommended for Phase 1. "Reference only" means the document informs defaults or wording; "link only" means the page may link to it and must not copy its data.

| Integration | Group | Recommended phase | Checker | Used by |
|---|---|---|---|---|
| [U.S. Drought Monitor data services (REST statistics)](#int-us-drought-monitor-data-services-rest-statistics) | Public context data | 3 | partly | [RULE-CTX-01](#rule-ctx-01), [RULE-CTX-02](#rule-ctx-02), [RULE-CTX-03](#rule-ctx-03), [RULE-CTX-10](#rule-ctx-10) |
| [USDM current (ArcGIS Online FeatureServer)](#int-usdm-current-arcgis-online-featureserver) | Public context data | defer | verified | [RULE-CTX-01](#rule-ctx-01) |
| [Iowa Environmental Mesonet JSON services](#int-iowa-environmental-mesonet-json-services) | Public context data | 3 (optional fallback) | verified | [RULE-CTX-01](#rule-ctx-01), [RULE-CTX-10](#rule-ctx-10) |
| [NWS API (api.weather.gov)](#int-nws-api-apiweathergov) | Public context data | defer | partly | [RULE-CTX-07](#rule-ctx-07), [RULE-WAT-06](#rule-wat-06) |
| [USDA-ARS USMARC cattle heat-stress forecast maps](#int-usda-ars-usmarc-cattle-heat-stress-forecast-maps) | Public context data | defer (link only) | partly | [RULE-CTX-07](#rule-ctx-07) |
| [NWS HeatRisk](#int-nws-heatrisk) | Public context data | exclude | verified | [RULE-CTX-08](#rule-ctx-08) |
| [NDAWN (including Cattle Comfort Index)](#int-ndawn-including-cattle-comfort-index) | Public context data | defer (link only) | partly | [RULE-CTX-09](#rule-ctx-09) |
| [South Dakota Mesonet (SDSU)](#int-south-dakota-mesonet-sdsu) | Public context data | exclude (link only) | partly | [RULE-CTX-16](#rule-ctx-16), [RULE-CTX-10](#rule-ctx-10) |
| [Nebraska Mesonet](#int-nebraska-mesonet) | Public context data | defer | partly | [RULE-CTX-10](#rule-ctx-10) |
| [PRISM gridded climate web service](#int-prism-gridded-climate-web-service) | Public context data | 3 (optional; check terms) | partly | [RULE-CTX-10](#rule-ctx-10) |
| [NOAA NCEI Climate Data Online web services](#int-noaa-ncei-climate-data-online-web-services) | Public context data | exclude | verified | [RULE-CTX-10](#rule-ctx-10) |
| [RCC ACIS web services](#int-rcc-acis-web-services) | Public context data | exclude | unverified | [RULE-CTX-10](#rule-ctx-10) |
| [Grass-Cast grassland productivity forecast](#int-grass-cast-grassland-productivity-forecast) | Public context data | defer | partly | [RULE-CTX-05](#rule-ctx-05), [RULE-GAIN-08](#rule-gain-08), [RULE-CTX-10](#rule-ctx-10) |
| [Grass-Cast database on Data.gov (ANPP, NDVI, cattle weight gains)](#int-grass-cast-database-on-datagov-anpp-ndvi-cattle-weight-gains) | Public context data | defer | partly | [RULE-GAIN-08](#rule-gain-08) |
| [Rangeland Analysis Platform (RAP)](#int-rangeland-analysis-platform-rap) | Public context data | defer | verified | [RULE-CTX-06](#rule-ctx-06), [RULE-GRZ-07](#rule-grz-07) |
| [NRCS Soil Data Access + EDIT (ecological sites)](#int-nrcs-soil-data-access--edit-ecological-sites) | Public context data | defer | verified | [RULE-CTX-14](#rule-ctx-14) |
| [USDA NASS Crop Progress (Quick Stats API, state PDFs)](#int-usda-nass-crop-progress-quick-stats-api-state-pdfs) | Public context data | defer | verified | [RULE-CTX-04](#rule-ctx-04) |
| [USDA FSA Livestock Forage Disaster Program (rule source)](#int-usda-fsa-livestock-forage-disaster-program-rule-source) | Public context data | 3 (link only) | verified | [RULE-CTX-03](#rule-ctx-03) |
| [Ranchbot / Farmbot remote tank monitors (vendor)](#int-ranchbot--farmbot-remote-tank-monitors-vendor) | Devices and vendor software | defer | verified | [RULE-WAT-04](#rule-wat-04), [RULE-WAT-07](#rule-wat-07), [RULE-CTX-13](#rule-ctx-13) |
| [LoneStar Tracking water tank monitor (vendor)](#int-lonestar-tracking-water-tank-monitor-vendor) | Devices and vendor software | defer | verified | [RULE-WAT-07](#rule-wat-07), [RULE-WAT-14](#rule-wat-14) |
| [Gallagher Satellite Liquid Monitoring (vendor)](#int-gallagher-satellite-liquid-monitoring-vendor) | Devices and vendor software | defer | partly | [RULE-WAT-14](#rule-wat-14) |
| [PIR SA water monitoring comparison (Australia)](#int-pir-sa-water-monitoring-comparison-australia) | Devices and vendor software | reference only | verified | [RULE-WAT-14](#rule-wat-14) |
| [Chute scale indicator with EID reader (e.g. Tru-Test S3/ID5000/XR5000; vendor)](#int-chute-scale-indicator-with-eid-reader-eg-tru-test-s3id5000xr5000-vendor) | Devices and vendor software | defer | partly | [RULE-GAIN-06](#rule-gain-06), [RULE-GAIN-02](#rule-gain-02) |
| [Gallagher load bars / weigh scale (vendor)](#int-gallagher-load-bars--weigh-scale-vendor) | Devices and vendor software | defer | verified | [RULE-GAIN-11](#rule-gain-11) |
| [In-pasture walk-over scales](#int-in-pasture-walk-over-scales) | Devices and vendor software | exclude | verified | [RULE-GAIN-06](#rule-gain-06) |
| [CattleMax herd software (vendor)](#int-cattlemax-herd-software-vendor) | Devices and vendor software | defer | verified | [RULE-HLTH-04](#rule-hlth-04), [RULE-HLTH-08](#rule-hlth-08) |
| [Industrial SCADA alarm model (Ignition 8.1; vendor documentation)](#int-industrial-scada-alarm-model-ignition-81-vendor-documentation) | Devices and vendor software | reference only | verified | [RULE-WF-11](#rule-wf-11), [RULE-WF-12](#rule-wf-12) |
| [Water testing labs (NDSU Veterinary Diagnostic Lab and others)](#int-water-testing-labs-ndsu-veterinary-diagnostic-lab-and-others) | Reference documents, protocols and benchmarks | defer | partly | [RULE-WAT-11](#rule-wat-11), [RULE-WAT-12](#rule-wat-12), [RULE-WAT-13](#rule-wat-13) |
| [NRCS eFOTG state technical notes (e.g. SD Range Technical Note No. 9)](#int-nrcs-efotg-state-technical-notes-eg-sd-range-technical-note-no-9) | Reference documents, protocols and benchmarks | 2 (reference for defaults) | partly | [RULE-GRZ-03](#rule-grz-03), [RULE-GRZ-06](#rule-grz-06) |
| [NDSU Grazing Monitoring Stick protocol (R1780)](#int-ndsu-grazing-monitoring-stick-protocol-r1780) | Reference documents, protocols and benchmarks | 3 | verified | [RULE-GRZ-05](#rule-grz-05), [RULE-GRZ-06](#rule-grz-06) |
| [USDA-ARS CPER foraging behaviour and ADG dataset](#int-usda-ars-cper-foraging-behaviour-and-adg-dataset) | Reference documents, protocols and benchmarks | reference only | partly | [RULE-GAIN-02](#rule-gain-02) |
| [FARAD (Food Animal Residue Avoidance Databank)](#int-farad-food-animal-residue-avoidance-databank) | Reference documents, protocols and benchmarks | exclude | verified | [RULE-HLTH-08](#rule-hlth-08) |
| [USDA APHIS Animal Disease Traceability EID rule](#int-usda-aphis-animal-disease-traceability-eid-rule) | Reference documents, protocols and benchmarks | reference only | verified | [RULE-HLTH-06](#rule-hlth-06) |
| [South Dakota Animal Industry Board (reportable diseases, state veterinarian)](#int-south-dakota-animal-industry-board-reportable-diseases-state-veterinarian) | Reference documents, protocols and benchmarks | reference only | verified | [RULE-HLTH-10](#rule-hlth-10) |
| [BQA record forms and templates (KS-BQA, Oklahoma BQA, Arkansas; BQA templates page)](#int-bqa-record-forms-and-templates-ks-bqa-oklahoma-bqa-arkansas-bqa-templates-page) | Reference documents, protocols and benchmarks | reference only | verified | [RULE-HLTH-06](#rule-hlth-06), [RULE-WF-16](#rule-wf-16) |
| [EIA retail diesel prices (PADD 2 Midwest, PADD 4 Rocky Mountain)](#int-eia-retail-diesel-prices-padd-2-midwest-padd-4-rocky-mountain) | Reference documents, protocols and benchmarks | defer | verified | [RULE-BUD-09](#rule-bud-09) |
| [USDA ERS Commodity Costs and Returns (cow-calf)](#int-usda-ers-commodity-costs-and-returns-cow-calf) | Reference documents, protocols and benchmarks | defer | verified | [RULE-BUD-12](#rule-bud-12) |
| [UNL Center for Agricultural Profitability regional cattle budgets](#int-unl-center-for-agricultural-profitability-regional-cattle-budgets) | Reference documents, protocols and benchmarks | reference only | verified | [RULE-BUD-12](#rule-bud-12), [RULE-BUD-04](#rule-bud-04) |
| [SDSU Extension Beef Cattle Budgets spreadsheet](#int-sdsu-extension-beef-cattle-budgets-spreadsheet) | Reference documents, protocols and benchmarks | reference only | verified | [RULE-BUD-12](#rule-bud-12) |
| [Ranch accounting system export (general ledger by account and month)](#int-ranch-accounting-system-export-general-ledger-by-account-and-month) | Ranch records and exports | defer | failed | [RULE-BUD-05](#rule-bud-05), [RULE-BUD-07](#rule-bud-07) |
| [Fuel delivery tickets (gallons)](#int-fuel-delivery-tickets-gallons) | Ranch records and exports | defer | partly | [RULE-BUD-09](#rule-bud-09) |
| [Browser localStorage (Web Storage)](#int-browser-localstorage-web-storage) | Browser and repository mechanisms | 2 | partly | [RULE-WF-15](#rule-wf-15), [RULE-WF-11](#rule-wf-11), [RULE-WF-18](#rule-wf-18) |
| [Storage API persistence (navigator.storage.persist)](#int-storage-api-persistence-navigatorstoragepersist) | Browser and repository mechanisms | exclude | verified | [RULE-WF-15](#rule-wf-15) |
| [Committed append-only data/acknowledgements.csv](#int-committed-append-only-dataacknowledgementscsv) | Browser and repository mechanisms | defer | unverified | [RULE-WF-11](#rule-wf-11), [RULE-WF-16](#rule-wf-16) |
| [Google Sheets 'Publish to the web' as a read-only shared log](#int-google-sheets-publish-to-the-web-as-a-read-only-shared-log) | Browser and repository mechanisms | defer | verified | [RULE-WF-16](#rule-wf-16) |
| [Browser print / @media print (crew briefing)](#int-browser-print--media-print-crew-briefing) | Browser and repository mechanisms | 2 | verified | [RULE-WF-17](#rule-wf-17) |
| [iCalendar RFC 5545 VTODO export](#int-icalendar-rfc-5545-vtodo-export) | Browser and repository mechanisms | defer | verified | [RULE-HLTH-04](#rule-hlth-04) |

### 5.5 Integration details

Each entry lists access, cost, licensing, coverage, refresh, failure behaviour and the recommendation as recorded in `rules.json` `integrations`, with the checker result for the page cited. The research notes merged from several topics are kept in the registry (`merged_research_notes`).

#### Public context data: drought, weather, forage and soils

<a id="int-us-drought-monitor-data-services-rest-statistics"></a>
##### U.S. Drought Monitor data services (REST statistics)

- **Provides:** Weekly % area (or area, population, DSCI) by USDM category for US/state/county/HUC/climate division; consecutive-weeks endpoints
- **Access:** HTTPS GET, CSV default, JSON/XML via Accept header; no API key mentioned
- **Cost:** free
- **Licensing:** No license text on the service page. Attribution wording on the Permission page: 'Map courtesy of NDMC'
- **Coverage:** US incl. county level (observed Hughes Co. SD)
- **Refresh:** Weekly. Valid Tuesday (12:00 UTC cutoff), released Thursday 08:30 ET. Observed latest MapDate 20261013 on 2026-10-16. **Latency:** Research: maps are valid Tuesday (12:00 UTC cutoff) and released Thursday 08:30 ET, about 2 days later; the checked pages do not state the release day.
- **Failure behaviour:** Unknown; no status page seen. Treat a missing week as unavailable, not as 'no drought'. CORS UNVERIFIED (sandbox blocked all direct probes)
- **Browser, CORS and key issues:** No API key mentioned. CORS unverified (direct probes were blocked in the research sandbox). Fetch at build time (for example a scheduled GitHub Action writing a dated CSV with provenance) so browser CORS and keys never reach the page; the test workflow stays offline.
- **Recommendation (3):** Best fit for the phase-3 drought snapshot. Fetch at build time for a labelled stand-in county around as_of, select by release time ([RULE-CTX-01](#rule-ctx-01)), and commit a CSV with provenance. Treat a missing week as unavailable, never as 'no drought'.
- **Used by:** [RULE-CTX-01](#rule-ctx-01), [RULE-CTX-02](#rule-ctx-02), [RULE-CTX-03](#rule-ctx-03), [RULE-CTX-10](#rule-ctx-10)
- **Source checked:** <https://droughtmonitor.unl.edu/DmData/DataDownload/WebServiceInfo.aspx>. Result: **partly** (cite_context.json checked[7]: claim partly; cite_grazing.json checked[21]: claim partly; cite_gain.json checked[35]: claim partly; cite_water.json checked[45]: claim yes). Other pages: <https://droughtmonitor.unl.edu/Data.aspx>, <https://droughtmonitor.unl.edu/DmData/DataDownload/ComprehensiveStatistics.aspx>.

<a id="int-usdm-current-arcgis-online-featureserver"></a>
##### USDM current (ArcGIS Online FeatureServer)

- **Provides:** Current USDM polygons with DM, MapDate, ReleaseDate, ValidStart, ValidEnd
- **Access:** ArcGIS REST query, JSON/GeoJSON/PBF; maxRecordCount 2000
- **Cost:** free
- **Licensing:** Credits NDMC/USDA/NOAA; 'Map courtesy of NDMC'
- **Coverage:** US polygons (current week only; separate archive service exists)
- **Refresh:** Weekly. Features showed MapDate 2026-10-13 while the layer page's 'Last Edit Date' read 10/1/2026. **Latency:** Weekly; layer metadata ('Last Edit Date') is not a freshness signal.
- **Failure behaviour:** Timestamps convert to odd times (07:30Z), so treat them as dates. Metadata last-edit is not a freshness signal. CORS unverified
- **Browser, CORS and key issues:** ArcGIS REST query (JSON/GeoJSON/PBF); CORS unverified.
- **Recommendation (defer):** Use only if polygons or maps are needed; prefer the statistics service for a table.
- **Used by:** [RULE-CTX-01](#rule-ctx-01)
- **Source checked:** <https://services5.arcgis.com/0OTVzJS4K09zlixn/ArcGIS/rest/services/USDM_current/FeatureServer/0>. Result: **verified** (cite_context.json checked[4]: claim yes).

<a id="int-iowa-environmental-mesonet-json-services"></a>
##### Iowa Environmental Mesonet JSON services

- **Provides:** USDM GeoJSON, PRISM point JSON, NWS VTEC/alerts, COOP obs, climodat
- **Access:** HTTPS GET JSON/GeoJSON
- **Cost:** free
- **Licensing:** 'You are free to use these services for any lawful purpose'; 'provided as-is' and without warranty
- **Coverage:** US
- **Refresh:** Mirrors upstream; USDM response showed date 2026-10-13 on 2026-10-16. **Latency:** Mirrors upstream products (the USDM response showed the current week).
- **Failure behaviour:** University-run aggregator; 'bugs happen'. The prism.py help fetch failed (CLIENT_ERROR). CORS not stated on the page
- **Browser, CORS and key issues:** CORS not stated on the page; free for any lawful purpose, as-is.
- **Recommendation (3 (optional fallback)):** Optional fallback mirror for the phase-3 snapshot; do not depend on it as the only source.
- **Used by:** [RULE-CTX-01](#rule-ctx-01), [RULE-CTX-10](#rule-ctx-10)
- **Source checked:** <https://mesonet.agron.iastate.edu/json/>. Result: **verified** (cite_context.json checked[5]: claim yes).

<a id="int-nws-api-apiweathergov"></a>
##### NWS API (api.weather.gov)

- **Provides:** Point-to-grid lookup; 7-day 12-hour and hourly forecasts on about a 2.5 km grid; gridded data; alerts; station observations.
- **Access:** HTTPS GET, GeoJSON default; 'A User Agent is required'; no key now, 'will be replaced with an API key in the future'
- **Cost:** free (limits apply, unpublished)
- **Licensing:** 'intended to be open data, free to use for any purpose'
- **Coverage:** US, \~2.5 km grids
- **Refresh:** Forecasts updated by forecast offices; cadence not stated on the documentation page. **Latency:** Observations may be delayed up to 20 minutes (documentation). Forecast issuance lag not stated.
- **Failure behaviour:** Rate-limit errors, retry after \~5 s. Outages announced via NCEP admin messages. The API host was robots-blocked to WebFetch; CORS and browser User-Agent handling UNVERIFIED
- **Browser, CORS and key issues:** A User-Agent header identifying the application is required, and an API key is planned. Browsers may not let page scripts set User-Agent; CORS and browser handling were not verified (the API host was robots-blocked to the research tool). Fetch at build time (for example a scheduled GitHub Action writing a dated CSV with provenance) so browser CORS and keys never reach the page; the test workflow stays offline.
- **Recommendation (defer):** Defer (live integrations are deferred). If a heat panel is built ([RULE-CTX-07](#rule-ctx-07)), take a dated build-time snapshot; never call it live from the static demo, because a live forecast does not match the fictional as_of.
- **Used by:** [RULE-CTX-07](#rule-ctx-07), [RULE-WAT-06](#rule-wat-06)
- **Source checked:** <https://www.weather.gov/documentation/services-web-API>. Result: **partly** (cite_context.json checked[27]: claim yes; cite_water.json checked[43]: claim yes; cite_health.json checked[29]: claim partly).

<a id="int-usda-ars-usmarc-cattle-heat-stress-forecast-maps"></a>
##### USDA-ARS USMARC cattle heat-stress forecast maps

- **Provides:** 7-day regional maps of predicted peak heat-stress category (breathing-rate model from NWS inputs)
- **Access:** Web pages and PNG images; 'downloadable map data' link not examined
- **Cost:** free
- **Licensing:** US Government work (no terms read)
- **Coverage:** CONUS in 6 regions
- **Refresh:** Not stated on the ARS pages; Drovers calls them 'weekly forecasts' and Farm Progress gives no frequency. Region page last modified 2017-07-26 (forecasting page 2016-08-12); current forecast date only in an image. **Latency:** Not stated; the forecast date appears only inside an image.
- **Failure behaviour:** Status in 2026 UNVERIFIED. forecastDate.png robots-blocked; curl to www.marc.ars.usda.gov got 'CONNECT tunnel failed, response 403'; site banner says features may be temporarily unavailable
- **Browser, CORS and key issues:** No data feed or API documented ('Download Map Data' link not examined); images only. Site status in 2026 unverified.
- **Recommendation (defer (link only)):** Link from help text only; do not integrate. The model estimates breathing rate for feedlot cattle. If a heat panel is wanted, reuse the published equation on a forecast snapshot ([RULE-CTX-07](#rule-ctx-07)).
- **Used by:** [RULE-CTX-07](#rule-ctx-07)
- **Source checked:** <https://www.ars.usda.gov/plains-area/clay-center-ne/marc/documents/heat-stress/indexregion>. Result: **partly** (cite_context.json checked[24]: claim partly; cite_water.json checked[26]: claim yes; cite_health.json checked[19]: claim yes). Other pages: <https://www.ars.usda.gov/plains-area/clay-center-ne/marc/documents/heat-stress/forecastingheatstress/>.

<a id="int-nws-heatrisk"></a>
##### NWS HeatRisk

- **Provides:** 0-4 colour/number human heat-risk index, 7 days
- **Access:** Web maps; an ArcGIS ImageServer was seen in search results (not fetched)
- **Cost:** free
- **Licensing:** NOAA
- **Coverage:** CONUS since 2024
- **Refresh:** Daily (cadence not stated); experimental, 'no guarantee of timely availability'. **Latency:** Daily (cadence not stated); experimental.
- **Failure behaviour:** Experimental product
- **Browser, CORS and key issues:** Web maps.
- **Recommendation (exclude):** Do not use for cattle; it is a human heat-health index ([RULE-CTX-08](#rule-ctx-08)).
- **Used by:** [RULE-CTX-08](#rule-ctx-08)
- **Source checked:** <https://www.wpc.ncep.noaa.gov/heatrisk/overview.html>. Result: **verified** (cite_context.json checked[28]: claim yes).

<a id="int-ndawn-including-cattle-comfort-index"></a>
##### NDAWN (including Cattle Comfort Index)

- **Provides:** Weather station network (the research's 245 stations, incl. 6 in Montana, and 12 rain-gauge sites are not on the cited CCI page and are unverified); CCI adult/newborn current and forecast maps
- **Access:** Web pages; downloadable station data mentioned; no API documented
- **Cost:** free
- **Licensing:** Copyright NDSU; data-use terms not verified (ndawn.ndsu.nodak.edu robots-blocked)
- **Coverage:** North Dakota and NW Minnesota maps on the cited page (Montana sites unverified)
- **Refresh:** Current conditions; CCI today/tomorrow. **Latency:** Current conditions; CCI today and tomorrow.
- **Failure behaviour:** Unknown
- **Browser, CORS and key issues:** Web pages; no API documented; data-use terms not verified.
- **Recommendation (defer (link only)):** Link out for North Dakota ranches; use its CCI bands as reference; do not ingest.
- **Used by:** [RULE-CTX-09](#rule-ctx-09)
- **Source checked:** <https://ndawn.info/agriculture_cci.html>. Result: **partly** (cite_context.json checked[31]: claim partly).

<a id="int-south-dakota-mesonet-sdsu"></a>
##### South Dakota Mesonet (SDSU)

- **Provides:** 100+ stations (126 listed on the request form) updating every five minutes (per the SD Mesonet weather page); daily CSV of precip, temp, RH, wind, solar, soil moisture/temp
- **Access:** Web form CSV request; custom services by contact; no API described
- **Cost:** Not stated on the checked pages
- **Licensing:** 'Redistribution of these data is not allowed.' 'Commercial use of these data is not allowed.' Provisional, not QC'd
- **Coverage:** South Dakota
- **Refresh:** 5-minute real-time; daily archive from 2015 via form. **Latency:** Real-time stations update every 5 minutes; daily archive by web-form request.
- **Failure behaviour:** Manual process
- **Browser, CORS and key issues:** No API described; data come from a web form as CSV. Redistribution and commercial use are not allowed.
- **Recommendation (exclude (link only)):** Exclude from repository data ([RULE-CTX-16](#rule-ctx-16)). Link to the Mesonet pages only.
- **Used by:** [RULE-CTX-16](#rule-ctx-16), [RULE-CTX-10](#rule-ctx-10)
- **Source checked:** <https://climate.sdstate.edu/request/daily/>. Result: **partly** (cite_context.json checked[46]: claim partly; cite_water.json checked[44]: claim yes). Other pages: <https://climate.sdstate.edu/weather>.

<a id="int-nebraska-mesonet"></a>
##### Nebraska Mesonet

- **Provides:** 74 automated stations (Dec 2024 article), updating every minute (a figure of 63 from an uncited NSCO page is unverifiable)
- **Access:** Website; the article mentions a planned 'robust data access tool'; a data access page reads 'Coming Soon' (nemesonet.unl.edu/coming-soon, not the cited article); 'Request Data' by contact is unverified
- **Cost:** not stated
- **Licensing:** not stated
- **Coverage:** Nebraska
- **Refresh:** 1-minute real-time. **Latency:** 1-minute real-time updates.
- **Failure behaviour:** No public API yet
- **Browser, CORS and key issues:** No public data access tool yet.
- **Recommendation (defer):** Not usable for a static site today; revisit when a data access tool ships.
- **Used by:** [RULE-CTX-10](#rule-ctx-10)
- **Source checked:** <https://research.unl.edu/blog/nebraska-mesonet-launches-improved-real-time-weather-data/>. Result: **partly** (cite_context.json checked[48]: claim partly).

<a id="int-prism-gridded-climate-web-service"></a>
##### PRISM gridded climate web service

- **Provides:** Daily/monthly/annual gridded ppt, tmin, tmax, tmean, tdmean, vpd at 4 km and 800 m
- **Access:** HTTPS GET of one zipped grid per request (COG default; nc/asc/bil)
- **Cost:** Not stated in the cited PDF; the research reports 800 m free since March 2025 on the PRISM /orders page (not checked)
- **Licensing:** PRISM terms; 'commercial use is strictly prohibited unless you have made special arrangements in advance' (quoted by the research from the /orders page; not in the cited PDF and not checked)
- **Coverage:** CONUS; daily from 1981
- **Refresh:** Daily grids revised 8 times over 6 months before stable. **Latency:** Daily grids are revised up to 8 times over about 6 months before they are stable.
- **Failure behaviour:** 'if a file is downloaded twice in a 24-hour period, no more downloads of that file will be allowed'; IP blocking at their discretion
- **Browser, CORS and key issues:** One zipped grid per request; repeat downloads of a file within 24 h are refused and IP blocking is possible. Commercial use is reported (not checked) to be prohibited without arrangement, which would matter for a working ranch.
- **Recommendation (3 (optional; check terms)):** Optional build-time source for precipitation normals in the phase-3 snapshot, only if its terms fit; store retrieved_at because values change.
- **Used by:** [RULE-CTX-10](#rule-ctx-10)
- **Source checked:** <https://www.prism.oregonstate.edu/documents/PRISM_downloads_web_service.pdf>. Result: **partly** (cite_context.json checked[36]: claim yes; citation critic adjusted the result (registry-changelog.md)).

<a id="int-noaa-ncei-climate-data-online-web-services"></a>
##### NOAA NCEI Climate Data Online web services

- **Provides:** API v2 (search/access datasets and stations), Data Service API (CSV/JSON/PDF)
- **Access:** HTTPS JSON/CSV
- **Cost:** free
- **Licensing:** NOAA
- **Coverage:** US/global station data
- **Refresh:** varies. **Latency:** Varies by dataset.
- **Failure behaviour:** Token requirement and limits NOT shown on the fetched page; not verified
- **Browser, CORS and key issues:** Token requirement and limits not shown on the fetched page.
- **Recommendation (exclude):** Not recommended for this project.
- **Used by:** [RULE-CTX-10](#rule-ctx-10)
- **Source checked:** <https://www.ncei.noaa.gov/cdo-web/webservices>. Result: **verified** (cite_context.json checked[49]: claim yes).

<a id="int-rcc-acis-web-services"></a>
##### RCC ACIS web services

- **Provides:** Station and gridded climate data (StnData, GridData, etc.)
- **Access:** HTTPS JSON (per secondary references)
- **Cost:** free (not verified)
- **Licensing:** not verified
- **Coverage:** US
- **Refresh:** daily. **Latency:** Not stated in the evidence.
- **Failure behaviour:** Documentation page rendered empty in WebFetch; nothing verified
- **Browser, CORS and key issues:** Documentation page rendered empty; nothing verified.
- **Recommendation (exclude):** Unverified; do not rely on it without checking the documentation directly.
- **Used by:** [RULE-CTX-10](#rule-ctx-10)
- **Source checked:** <https://www.rcc-acis.org/docs_webservices.html>. Result: **unverified** (cite_context.json checked[50]: claim unverifiable). [cite_context.json checked[50], claim unverifiable] The fetch returned only the title 'RCC-ACIS' and the heading 'ACIS Web Services', with no body. The research's own statement that the page rendered empty is confirmed. The integration's descriptions (StnData, GridData, JSON, free, daily) cannot be verified from this URL.

<a id="int-grass-cast-grassland-productivity-forecast"></a>
##### Grass-Cast grassland productivity forecast

- **Provides:** Biweekly seasonal % change in grassland production vs \~38-yr average under 3 precipitation scenarios; 10 km cells
- **Access:** Web maps (images); historical CSV/XLSX/shapefile downloads; no API
- **Cost:** free
- **Licensing:** Download page states none. A related research database is CC BY 4.0 (data 1939-2018) per its Data.gov page (see the 'Grass-Cast database on Data.gov' integration), not this download page
- **Coverage:** Great Plains and Southwest rangeland (excludes cropland, shrubland, forest)
- **Refresh:** Every two weeks from \~late April; 2026 season final as of Aug 31. **Latency:** Updated about every two weeks in season (from about late April); the 2026 season was final as of August 31.
- **Failure behaviour:** Seasonal gaps; accuracy improves through the season; developer-reported 60-80% accuracy (not independently verified here)
- **Browser, CORS and key issues:** Web map images and historical downloads; no API. Licence not stated on the download page (the CC BY 4.0 licence belongs to the related data.gov research database).
- **Recommendation (defer):** Optional manual snapshot with its map date; context only, never a trigger for pasture exceptions.
- **Used by:** [RULE-CTX-05](#rule-ctx-05), [RULE-GAIN-08](#rule-gain-08), [RULE-CTX-10](#rule-ctx-10)
- **Source checked:** <https://grasscast.unl.edu/Data.aspx>. Result: **partly** (cite_context.json checked[15]: claim partly; cite_grazing.json checked[14]: claim yes; cite_gain.json checked[24]: claim yes). Other pages: <https://grasscast.unl.edu/Outlook/About.aspx>.

<a id="int-grass-cast-database-on-datagov-anpp-ndvi-cattle-weight-gains"></a>
##### Grass-Cast database on Data.gov (ANPP, NDVI, cattle weight gains)

- **Provides:** Long-term cattle weight gain, ANPP and NDVI records for benchmarking year-to-year variability
- **Access:** Data.gov / figshare download
- **Cost:** free
- **Licensing:** CC BY 4.0
- **Coverage:** 12 sites at about 32.5-43.9 N in western U.S. rangelands (at least one in Idaho, so not all Great Plains); 1939-2018.
- **Refresh:** static (modified 2025-11-21) **Latency:** Static dataset (modified 2025-11-21).
- **Failure behaviour:** Download FAILED in this session: curl to ndownloader.figshare.com returned 'CONNECT tunnel failed, response 403', and the WebFetch redirect URL exceeded the proxy length limit. Contents not inspected.
- **Browser, CORS and key issues:** Data.gov / figshare download; the download failed in the research session (proxy).
- **Recommendation (defer):** Worth inspecting offline to calibrate period expectations; contents not inspected.
- **Used by:** [RULE-GAIN-08](#rule-gain-08)
- **Source checked:** <https://catalog.data.gov/dataset/grass-cast-database-data-on-aboveground-net-primary-productivity-anpp-climate-data-ndvi-an>. Result: **partly** (cite_gain.json checked[37]: claim partly).

<a id="int-rangeland-analysis-platform-rap"></a>
##### Rangeland Analysis Platform (RAP)

- **Provides:** Annual and 16-day herbaceous production (lbs/acre), fractional cover, partitioned NPP
- **Access:** POST GeoJSON to Cloud Functions endpoints; PNG tiles on storage.googleapis.com; GEE; COGs; rapr R package
- **Cost:** free
- **Licensing:** 'freely available for use by the public' (products page); TOS (2024-09-11) AS IS, no warranty
- **Coverage:** CONUS rangelands (not for cropland); 30 m since 1986, 10 m West since 2018
- **Refresh:** Annual through the previous year via API; current-year 16-day is provisional in GEE. **Latency:** Annual products through the previous year; current-year 16-day production is provisional and recalculated at year end.
- **Failure behaviour:** Model estimates without RMSE for production. CORS for the POST endpoints unverified
- **Browser, CORS and key issues:** POST GeoJSON to cloud-function endpoints; CORS for the POST endpoints unverified. The rapr R package README was reachable (contrary to the research).
- **Recommendation (defer):** Defer: needs real pasture polygons, which the fictional ranch lacks.
- **Used by:** [RULE-CTX-06](#rule-ctx-06), [RULE-GRZ-07](#rule-grz-07)
- **Source checked:** <https://rangelands.app/support/71-api-documentation>. Result: **verified** (cite_context.json checked[19]: claim yes; cite_grazing.json checked[22]: claim yes; cite_gain.json checked[38]: claim yes). Other pages: <https://rangelands.app/products>, <https://ftp.fau.de/cran/web/packages/rapr/readme/README.html>.

<a id="int-nrcs-soil-data-access--edit-ecological-sites"></a>
##### NRCS Soil Data Access + EDIT (ecological sites)

- **Provides:** SSURGO tabular/spatial queries; ecological site descriptions and state-and-transition models
- **Access:** SDA: POST-only REST (XML/JSON), 100,000-row cap. EDIT: web catalog, no API documented; moved to NRCS hosting April 2026
- **Cost:** free
- **Licensing:** US Government (terms not read)
- **Coverage:** US
- **Refresh:** Static/reference. **Latency:** Static reference.
- **Failure behaviour:** Browser URLs cannot invoke SDA; CORS unverified
- **Browser, CORS and key issues:** Soil Data Access is POST-only and 'cannot be invoked by a URL submitted via a web browser'; CORS unverified.
- **Recommendation (defer):** One-time offline lookup per pasture for a real deployment; not for the demo.
- **Used by:** [RULE-CTX-14](#rule-ctx-14)
- **Source checked:** <https://sdmdataaccess.nrcs.usda.gov/WebServiceHelp.aspx>. Result: **verified** (cite_context.json checked[42]: claim yes).

<a id="int-usda-nass-crop-progress-quick-stats-api-state-pdfs"></a>
##### USDA NASS Crop Progress (Quick Stats API, state PDFs)

- **Provides:** Weekly state pasture and range condition, topsoil moisture (and stock water in some states)
- **Access:** Quick Stats API requires a key (50,000-record cap); weekly state PDFs
- **Cost:** free
- **Licensing:** US Government statistics
- **Coverage:** State level
- **Refresh:** Weekly in season; after 4:00 pm ET on the first business day (from a 2007 NASS document; not confirmed by a current source) **Latency:** Weekly in season, after 4:00 pm ET on the first business day (research; from a 2007 NASS document, not confirmed by a current source).
- **Failure behaviour:** Quick Stats API page robots-blocked to WebFetch. A key in browser JS would be public
- **Browser, CORS and key issues:** Quick Stats needs an API key; a key in browser code would be public. Keep it in a build-time secret.
- **Recommendation (defer):** Optional build-time fetch; low priority.
- **Used by:** [RULE-CTX-04](#rule-ctx-04)
- **Source checked:** <https://docs.ropensci.org/rnassqs/articles/rnassqs.html>. Result: **verified** (cite_context.json checked[12]: claim yes).

<a id="int-usda-fsa-livestock-forage-disaster-program-rule-source"></a>
##### USDA FSA Livestock Forage Disaster Program (rule source)

- **Provides:** USDM-based eligibility tiers for grazing-loss payments
- **Access:** Web page
- **Cost:** n/a
- **Licensing:** US Government
- **Coverage:** US counties rated by USDM
- **Refresh:** Rules change (page notes recent change, no date) **Latency:** Rules change (the page notes a recent change).
- **Failure behaviour:** n/a
- **Browser, CORS and key issues:** Web page.
- **Recommendation (3 (link only)):** Link only; never compute eligibility in the dashboard.
- **Used by:** [RULE-CTX-03](#rule-ctx-03)
- **Source checked:** <https://www.fsa.usda.gov/resources/programs/livestock-forage-disaster-program-lfp>. Result: **verified** (cite_context.json checked[6]: claim yes).

#### Devices and vendor software (vendor specifications)

<a id="int-ranchbot--farmbot-remote-tank-monitors-vendor"></a>
##### Ranchbot / Farmbot remote tank monitors (vendor)

- **Provides:** Tank level (in, gal, %), projected values, Delay/No Data/Error statuses, battery, alerts by SMS and email
- **Access:** Vendor apps (MyRanchbot, MyFarmbot). The help centres list an 'Integrations' collection, but I did not verify any public export or API.
- **Cost:** Subscription; figures not found on official pages. A South Australian agency comparison (undated) lists Farmbot at AUD 1,209 plus 342 per year, likely vendor-supplied.
- **Licensing:** Vendor terms (not reviewed)
- **Coverage:** Satellite or cellular; needs a clear sky view and panel care
- **Refresh:** 'Irregular intervals' (vendor) **Latency:** 'Irregular intervals' (vendor); Delay status means stale values.
- **Failure behaviour:** Delay status = stale values; inspect if more than 3-4 days. A battery lasts 3-5 days of cloud. Pump automation pauses when a linked monitor is in Delay (Farmbot).
- **Browser, CORS and key issues:** Vendor apps; no public export or API verified.
- **Recommendation (defer):** Vendor specification only. Import a CSV export if one exists, carrying status and battery. Treat accuracy and reliability claims as unverified and keep vendor projections apart from measurements.
- **Used by:** [RULE-WAT-04](#rule-wat-04), [RULE-WAT-07](#rule-wat-07), [RULE-CTX-13](#rule-ctx-13)
- **Source checked:** <https://intercom.help/farmbot-helpcentre/en/articles/5666871-what-does-device-status-delay-mean>. Result: **verified** (cite_water.json checked[8]: claim yes).

<a id="int-lonestar-tracking-water-tank-monitor-vendor"></a>
##### LoneStar Tracking water tank monitor (vendor)

- **Provides:** Hydrostatic level; low-water SMS and email alerts and back-to-normal notices
- **Access:** Vendor website; no API seen
- **Cost:** USD 250 device; first year included, then USD 99 per year (vendor page)
- **Licensing:** Vendor terms (not reviewed)
- **Coverage:** Satellite (Myriota) or LTE Cat-M1
- **Refresh:** 4/day satellite, 24/day cellular (the page also says 'once every 1 hour', which conflicts) **Latency:** 4 readings/day by satellite or 24/day by cellular (vendor page; it also says 'once every 1 hour', which conflicts).
- **Failure behaviour:** Not stated on the page
- **Browser, CORS and key issues:** Vendor website; no API seen.
- **Recommendation (defer):** Vendor specification only: an example of reporting cadence and an accuracy claim (about 10%). Use it to set an expected interval per device, not to validate thresholds.
- **Used by:** [RULE-WAT-07](#rule-wat-07), [RULE-WAT-14](#rule-wat-14)
- **Source checked:** <https://www.lonestartracking.com/?p=60249>. Result: **verified** (cite_water.json checked[2]: claim yes).

<a id="int-gallagher-satellite-liquid-monitoring-vendor"></a>
##### Gallagher Satellite Liquid Monitoring (vendor)

- **Provides:** Tank, trough and dam level via micro-satellite; alerts
- **Access:** Vendor app; no specifications for reading frequency, battery or accuracy on the official page
- **Cost:** Subscription; no figures given
- **Licensing:** Vendor terms
- **Coverage:** Areas without cell or Wi-Fi
- **Refresh:** 'a quick daily check-in or near-instant alerts' (plan-dependent; vendor page) **Latency:** Plan-dependent: 'a quick daily check-in or near-instant alerts' (vendor page).
- **Failure behaviour:** Not stated
- **Browser, CORS and key issues:** Vendor app; no specifications for reading frequency, battery or accuracy.
- **Recommendation (defer):** Vendor specification only; not enough official detail to rely on.
- **Used by:** [RULE-WAT-14](#rule-wat-14)
- **Source checked:** <https://am.gallagher.com/Products/liquid-level-monitoring>. Result: **partly** (cite_water.json checked[46]: claim partly).

<a id="int-pir-sa-water-monitoring-comparison-australia"></a>
##### PIR SA water monitoring comparison (Australia)

- **Provides:** Side-by-side table of Agbot, Alpha Group, Farmbot, Farmo Water Rat, Goanna Go Tank and OneTemp HOBO kits: power, connectivity, cost
- **Access:** PDF
- **Cost:** Free
- **Licensing:** Not stated
- **Coverage:** Australian products and prices (ex GST)
- **Refresh:** Undated. **Latency:** n/a (undated document).
- **Failure behaviour:** n/a
- **Browser, CORS and key issues:** PDF only.
- **Recommendation (reference only):** Background only. Not independent testing; the source of the figures is not stated.
- **Used by:** [RULE-WAT-14](#rule-wat-14)
- **Source checked:** <https://pir.sa.gov.au/__data/assets/pdf_file/0009/440559/water-monitoring-comparison.pdf>. Result: **verified** (cite_water.json checked[47]: claim yes).

<a id="int-chute-scale-indicator-with-eid-reader-eg-tru-test-s3id5000xr5000-vendor"></a>
##### Chute scale indicator with EID reader (e.g. Tru-Test S3/ID5000/XR5000; vendor)

- **Provides:** Per-animal weights matched to EID, with date and time; cloud upload
- **Access:** Vendor app/cloud and device export. The CSV format was not confirmed in the fetched info sheet.
- **Cost:** not verified
- **Licensing:** proprietary vendor software
- **Coverage:** any weigh session at the working facility
- **Refresh:** per weigh session. **Latency:** Per weigh session.
- **Failure behaviour:** Ingest only the raw weights. If the export is missing, accept manual CSV. Never trust a vendor-computed ADG without the underlying weights. Vendor 'Superdamp' stable-weight claims are not independently verified.
- **Browser, CORS and key issues:** Vendor app and cloud; the CSV export format was not confirmed.
- **Recommendation (defer):** Vendor specification only. Define a minimal CSV contract (tag, eid, date, time, weight_lbs, session) and ingest raw weights, never vendor-computed ADG.
- **Used by:** [RULE-GAIN-06](#rule-gain-06), [RULE-GAIN-02](#rule-gain-02)
- **Source checked:** <https://www.agproud.com/ext/resources/directories/files/Datamars/Tru-Test_WeighIndicators_InfoSheet.pdf>. Result: **partly** (cite_gain.json checked[34]: claim partly).

<a id="int-gallagher-load-bars--weigh-scale-vendor"></a>
##### Gallagher load bars / weigh scale (vendor)

- **Provides:** Weights (load bar manual only reviewed)
- **Access:** device
- **Cost:** not verified
- **Licensing:** proprietary
- **Coverage:** working facility
- **Refresh:** per session. **Latency:** Per weigh session.
- **Failure behaviour:** The manual states 'not certified for trade use' and that uneven mounting causes errors (vendor statement)
- **Browser, CORS and key issues:** Device only.
- **Recommendation (defer):** Vendor specification only ('not certified for trade use'). Same CSV contract; record scale checks per session.
- **Used by:** [RULE-GAIN-11](#rule-gain-11)
- **Source checked:** <https://www.valleyvet.com/library/lib_19258_-Manual1.pdf>. Result: **verified** (cite_gain.json checked[33]: claim yes).

<a id="int-in-pasture-walk-over-scales"></a>
##### In-pasture walk-over scales

- **Provides:** Near-daily weights at water points
- **Access:** vendor platform
- **Cost:** not verified
- **Licensing:** proprietary
- **Coverage:** animals that visit the instrumented water point
- **Refresh:** daily. **Latency:** Near-daily weights at instrumented water points.
- **Failure behaviour:** Independent studies needed outlier cleaning (Brennan et al., Cottonwood SD, removed 1.6% of weights; 2-3 day rolling means). In an Australian walk-over study, weights read high by 10 kg (calves) and 21 kg (cows), RMSPE was 5.1-5.5%, and averaging 5 or more records improved accuracy (Simanungkalit et al. 2020).
- **Browser, CORS and key issues:** Vendor platforms.
- **Recommendation (exclude):** Not needed for this dashboard. Independent studies show bias and the need for outlier cleaning and rolling means.
- **Used by:** [RULE-GAIN-06](#rule-gain-06)
- **Source checked:** <https://cambridge.org/core/journals/animal/article/evaluation-of-remote-monitoring-units-for-estimating-body-weight-and-supplement-intake-of-grazing-cattle/C4A9621209F16D437CCE3202DF41B118>. Result: **verified** (cite_gain.json checked[36]: claim yes).

<a id="int-cattlemax-herd-software-vendor"></a>
##### CattleMax herd software (vendor)

- **Provides:** Per the vendor help article, group treatments compute booster dates (Booster tab) and withdrawal periods (Withdrawal tab) from entered day counts
- **Access:** Vendor SaaS. The fetched article does not mention CSV export or an API.
- **Cost:** Not stated in fetched article
- **Licensing:** Proprietary
- **Coverage:** Vendor customers
- **Refresh:** User-entered. **Latency:** User-entered.
- **Failure behaviour:** Unknown
- **Browser, CORS and key issues:** Vendor SaaS; no export or API documented in the fetched article.
- **Recommendation (defer):** Vendor specification only. Evidence that commercial tools model boosters and withdrawals as day counts; consider CSV import only if export is documented.
- **Used by:** [RULE-HLTH-04](#rule-hlth-04), [RULE-HLTH-08](#rule-hlth-08)
- **Source checked:** <https://help.cattlemax.com/article/546-herd-health-preset-treatments-booster-and-withdrawal>. Result: **verified** (cite_health.json checked[30]: claim yes).

<a id="int-industrial-scada-alarm-model-ignition-81-vendor-documentation"></a>
##### Industrial SCADA alarm model (Ignition 8.1; vendor documentation)

- **Provides:** A worked state model: Active/Cleared x Acked/Unacked; shelving with duration
- **Access:** Documentation
- **Cost:** Commercial software (not proposed)
- **Licensing:** Vendor
- **Coverage:** n/a
- **Refresh:** n/a. **Latency:** n/a.
- **Failure behaviour:** n/a
- **Browser, CORS and key issues:** Documentation only.
- **Recommendation (reference only):** Design reference for the acknowledgement and shelving state model only. Do not integrate.
- **Used by:** [RULE-WF-11](#rule-wf-11), [RULE-WF-12](#rule-wf-12)
- **Source checked:** <https://docs.inductiveautomation.com/docs/8.1/platform/alarming>. Result: **verified** (cite_workflow.json checked[18]: claim yes).

#### Reference documents, protocols and benchmarks (manual lookup, no live feed)

<a id="int-water-testing-labs-ndsu-veterinary-diagnostic-lab-and-others"></a>
##### Water testing labs (NDSU Veterinary Diagnostic Lab and others)

- **Provides:** TDS, sulfate, nitrate, cyanotoxin analyses
- **Access:** Sample submission; enter results by hand
- **Cost:** Not researched
- **Licensing:** n/a
- **Coverage:** ND, SD, NE
- **Refresh:** Per sample. **Latency:** Lab turnaround per sample (not researched).
- **Failure behaviour:** Turnaround delays; the dashboard should show 'sample pending'
- **Browser, CORS and key issues:** Manual sample submission; results entered by hand.
- **Recommendation (defer):** Manual entry into a water-quality log; no automated integration. The cited AS1764 names only the NDSU Veterinary Diagnostic Lab.
- **Used by:** [RULE-WAT-11](#rule-wat-11), [RULE-WAT-12](#rule-wat-12), [RULE-WAT-13](#rule-wat-13)
- **Source checked:** <https://info.ext.nodak.edu/agriculture/sites/default/files/2026-01/as1764%20%281%29.pdf>. Result: **partly** (cite_water.json checked[29]: claim partly).

<a id="int-nrcs-efotg-state-technical-notes-eg-sd-range-technical-note-no-9"></a>
##### NRCS eFOTG state technical notes (e.g. SD Range Technical Note No. 9)

- **Provides:** State- and region-specific recovery periods, utilization limits, stubble heights and drought phases used as defaults
- **Access:** PDF documents on efotg.sc.egov.usda.gov. Manual lookup; no data API evaluated.
- **Cost:** Free
- **Licensing:** US Government publication
- **Coverage:** Per state (SD note covers West River and East River)
- **Refresh:** Irregular (SD TN9 dated April 2017) **Latency:** Irregular revisions (SD TN9 dated April 2017).
- **Failure behaviour:** Values may lag the national 528 revision (June 2025). Whether SD, NE, ND, WY or KS have adopted the 2025 national standard was not verified.
- **Browser, CORS and key issues:** PDF documents; manual lookup.
- **Recommendation (2 (reference for defaults)):** Use as the documented source of configurable defaults (rest periods, use limits, stubble heights), citing the exact document and date.
- **Used by:** [RULE-GRZ-03](#rule-grz-03), [RULE-GRZ-06](#rule-grz-06)
- **Source checked:** <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf>. Result: **partly** (cite_grazing.json checked[0]: claim partly).

<a id="int-ndsu-grazing-monitoring-stick-protocol-r1780"></a>
##### NDSU Grazing Monitoring Stick protocol (R1780)

- **Provides:** Field protocol and height-weight tables to turn stubble readings into utilization %
- **Access:** Printed or PDF publication R1780; manual readings entered into forage_obs.csv
- **Cost:** Free publication
- **Licensing:** Extension publication
- **Coverage:** North Dakota species; broadly applicable to northern mixed-grass
- **Refresh:** Revised October 2024. **Latency:** n/a (field method).
- **Failure behaviour:** Observer variability; needs an ungrazed reference
- **Browser, CORS and key issues:** Printed or PDF protocol; readings entered by hand.
- **Recommendation (3):** Recommended manual observation protocol for the phase-3 forage observations.
- **Used by:** [RULE-GRZ-05](#rule-grz-05), [RULE-GRZ-06](#rule-grz-06)
- **Source checked:** <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/R1780%20The%20North%20Dakota%20Grazing%20Monitoring%20Stick%20%281%29.pdf>. Result: **verified** (cite_grazing.json checked[5]: claim yes).

<a id="int-usda-ars-cper-foraging-behaviour-and-adg-dataset"></a>
##### USDA-ARS CPER foraging behaviour and ADG dataset

- **Provides:** Individual yearling steer ADG with behaviour metrics, 2019-2020
- **Access:** Data.gov CSV files
- **Cost:** free
- **Licensing:** public domain (usa.gov label)
- **Coverage:** Central Plains Experimental Range, CO
- **Refresh:** static. **Latency:** Static (2019-2020 data).
- **Failure behaviour:** n/a
- **Browser, CORS and key issues:** Data.gov CSV download.
- **Recommendation (reference only):** Optional reference for realistic within-herd ADG spread in the fictional generator; not inspected.
- **Used by:** [RULE-GAIN-02](#rule-gain-02)
- **Source checked:** <https://catalog.data.gov/dataset/data-from-can-measurements-of-foraging-behaviour-predict-variation-in-weight-gains-of-free>. Result: **partly** (cite_gain.json checked[30]: claim partly).

<a id="int-farad-food-animal-residue-avoidance-databank"></a>
##### FARAD (Food Animal Residue Avoidance Databank)

- **Provides:** Withdrawal-interval advice after extralabel drug use, answered to veterinarians
- **Access:** Veterinarian requests to FARAD call centers (per AABP 2021 proceedings)
- **Cost:** Not stated in fetched source
- **Licensing:** n/a
- **Coverage:** US food animals
- **Refresh:** Per inquiry. **Latency:** Per veterinarian inquiry.
- **Failure behaviour:** n/a
- **Browser, CORS and key issues:** Veterinarian requests only.
- **Recommendation (exclude):** Do not integrate. Record the withdrawal clear date the veterinarian provides; the dashboard never computes extralabel withdrawal.
- **Used by:** [RULE-HLTH-08](#rule-hlth-08)
- **Source checked:** <https://bovine-ojs-tamu.tdl.org/AABP/article/view/8283>. Result: **verified** (cite_health.json checked[15]: claim yes).

<a id="int-usda-aphis-animal-disease-traceability-eid-rule"></a>
##### USDA APHIS Animal Disease Traceability EID rule

- **Provides:** Official ID requirement: visually and electronically readable eartags for covered cattle moving interstate (effective 2024-11-05)
- **Access:** Federal Register rule text
- **Cost:** Free
- **Licensing:** US government
- **Coverage:** US interstate movement; sexually intact cattle 18 months or older, dairy, rodeo and exhibition
- **Refresh:** Rule changes only. **Latency:** Rule changes only.
- **Failure behaviour:** n/a
- **Browser, CORS and key issues:** Federal Register text.
- **Recommendation (reference only):** No live integration. Let animal_ids accept official IDs.
- **Used by:** [RULE-HLTH-06](#rule-hlth-06)
- **Source checked:** <https://www.govinfo.gov/content/pkg/FR-2024-05-09/html/2024-09717.htm>. Result: **verified** (cite_health.json checked[28]: claim yes).

<a id="int-south-dakota-animal-industry-board-reportable-diseases-state-veterinarian"></a>
##### South Dakota Animal Industry Board (reportable diseases, state veterinarian)

- **Provides:** Annual reportable-disease list and state veterinarian contacts. Veterinarians and labs report immediately.
- **Access:** PDF linked from aib.sd.gov/veterinarians.html
- **Cost:** Free
- **Licensing:** State government
- **Coverage:** South Dakota
- **Refresh:** Published each July 1 (per ARSD 12:68:03:09) **Latency:** List published yearly.
- **Failure behaviour:** n/a
- **Browser, CORS and key issues:** Web page and PDF.
- **Recommendation (reference only):** Reference in help text only. The dashboard's escalation is 'call your veterinarian', who handles any state reporting.
- **Used by:** [RULE-HLTH-10](#rule-hlth-10)
- **Source checked:** <https://aib.sd.gov/veterinarians.html>. Result: **verified** (cite_health.json checked[24]: claim yes).

<a id="int-bqa-record-forms-and-templates-ks-bqa-oklahoma-bqa-arkansas-bqa-templates-page"></a>
##### BQA record forms and templates (KS-BQA, Oklahoma BQA, Arkansas; BQA templates page)

- **Provides:** Field lists for processing, treatment and herd-health records
- **Access:** PDF forms
- **Cost:** Free
- **Licensing:** Not stated
- **Coverage:** US BQA programs
- **Refresh:** Undated. **Latency:** n/a.
- **Failure behaviour:** n/a
- **Browser, CORS and key issues:** PDF forms.
- **Recommendation (reference only):** Reference from a records section; use them to shape record columns. Do not reimplement treatment or inventory logs in this dashboard.
- **Used by:** [RULE-HLTH-06](#rule-hlth-06), [RULE-WF-16](#rule-wf-16)
- **Source checked:** <https://www.kla.org/Media/KLA/Docs/bqarecordkeeping.pdf>. Result: **verified** (cite_health.json checked[12]: claim yes; cite_workflow.json checked[37]: claim yes). Other pages: <https://www.bqa.org/resources/templates-assessments>.

<a id="int-eia-retail-diesel-prices-padd-2-midwest-padd-4-rocky-mountain"></a>
##### EIA retail diesel prices (PADD 2 Midwest, PADD 4 Rocky Mountain)

- **Provides:** On-highway No 2 / ULSD retail \$/gal including all taxes, by PADD. Weekly (Monday 8 a.m. survey of 590 outlets) and monthly series.
- **Access:** Public web pages and series history pages (fetched via WebFetch). A direct curl to eia.gov from this session was refused by the egress proxy (403). EIA API access and key requirements were not checked in this research.
- **Cost:** No paywall encountered on the pages fetched
- **Licensing:** US federal agency data. EIA's reuse terms page was not fetched; verify before redistribution.
- **Coverage:** Contiguous US by PADD and national; excludes Alaska and Hawaii. Not farm dyed-diesel prices (includes road taxes).
- **Refresh:** Weekly release (Tuesday, Wednesday after holidays); latest seen release 2026-10-14, next 2026-10-20. Monthly series through 2026-09. **Latency:** Weekly survey on Monday, released Tuesday (Wednesday after holidays); monthly series.
- **Failure behaviour:** Show the last fetched value with its date and 'reference only'. Never block or change budget severities.
- **Browser, CORS and key issues:** Public pages; EIA API and key requirements were not checked; a direct request was refused by the research proxy.
- **Recommendation (defer):** Optional context for fuel reforecasts only; ranch invoices stay the price source. Never changes budget severities.
- **Used by:** [RULE-BUD-09](#rule-bud-09)
- **Source checked:** <https://www.eia.gov/petroleum/gasdiesel/>. Result: **verified** (cite_budget.json checked[25]: claim yes).

<a id="int-usda-ers-commodity-costs-and-returns-cow-calf"></a>
##### USDA ERS Commodity Costs and Returns (cow-calf)

- **Provides:** Annual per-cow cost and return estimates by item ('Purchased feed', 'Veterinary and medicine', 'Fuel, lube, and electric', 'Repairs', and others) and region
- **Access:** XLSX and CSV download from the ERS data product page
- **Cost:** No paywall encountered
- **Licensing:** US federal agency data; reuse terms not fetched
- **Coverage:** US and regions. Cow-calf base survey ARMS 2018 (herds of 20 or more beef cows), indexed in non-survey years. Plains region includes KS, NE, ND, OK, SD, TX per documentation.
- **Refresh:** Recent files last updated 2026-10-01; next update 2027-05-03. **Latency:** Annual (last updated 2026-10-01; next 2027-05-03).
- **Failure behaviour:** Static annual benchmark; if unavailable, omit the benchmark column
- **Browser, CORS and key issues:** XLSX/CSV download.
- **Recommendation (defer):** Use for category mapping and an annual per-head sanity check, not for monthly alerts.
- **Used by:** [RULE-BUD-12](#rule-bud-12)
- **Source checked:** <https://www.ers.usda.gov/data-products/commodity-costs-and-returns>. Result: **verified** (cite_budget.json checked[33]: claim yes).

<a id="int-unl-center-for-agricultural-profitability-regional-cattle-budgets"></a>
##### UNL Center for Agricultural Profitability regional cattle budgets

- **Provides:** 2026 Nebraska regional cow-herd and heifer budgets with standard categories (feed lines, vet and health, paid and unpaid labor, fuel and energy, repairs and maintenance, supplies, marketing, interest, overhead)
- **Access:** PDF budgets (fetched). The ABC program at agbudget.unl.edu is mentioned on the page but was not fetched or evaluated.
- **Cost:** No paywall encountered
- **Licensing:** Not stated on pages fetched
- **Coverage:** Five Nebraska regions; about 400-cow Northern Panhandle example
- **Refresh:** Annual ('Updated July 2026') **Latency:** Annual ('Updated July 2026').
- **Failure behaviour:** Static template
- **Browser, CORS and key issues:** PDF budgets.
- **Recommendation (reference only):** Reference for a starting category list and an annual plausibility check of the fictional data.
- **Used by:** [RULE-BUD-12](#rule-bud-12), [RULE-BUD-04](#rule-bud-04)
- **Source checked:** <https://cap.unl.edu/cattlebudgets/northern-panhandle/>. Result: **verified** (cite_budget.json checked[34]: claim yes).

<a id="int-sdsu-extension-beef-cattle-budgets-spreadsheet"></a>
##### SDSU Extension Beef Cattle Budgets spreadsheet

- **Provides:** South Dakota cost and revenue estimates for six beef enterprises
- **Access:** Spreadsheet download from the SDSU page. The spreadsheet itself was not opened in this research.
- **Cost:** No paywall encountered
- **Licensing:** Not stated on page fetched
- **Coverage:** South Dakota
- **Refresh:** Page updated 2026-05-22. **Latency:** Page updated 2026-05-22.
- **Failure behaviour:** Static template
- **Browser, CORS and key issues:** Spreadsheet download (not opened in the research).
- **Recommendation (reference only):** Optional South Dakota category template; open the workbook before citing its labels.
- **Used by:** [RULE-BUD-12](#rule-bud-12)
- **Source checked:** <https://extension.sdstate.edu/beef-cattle-budgets>. Result: **verified** (cite_budget.json checked[35]: claim yes).

#### Ranch records and exports

<a id="int-ranch-accounting-system-export-general-ledger-by-account-and-month"></a>
##### Ranch accounting system export (general ledger by account and month)

- **Provides:** Actual spend by account and month, with refunds and credits
- **Access:** Not researched; no vendor documentation fetched
- **Cost:** Unknown
- **Licensing:** Unknown
- **Coverage:** Ranch-specific
- **Refresh:** Monthly at book close. **Latency:** Monthly at book close.
- **Failure behaviour:** Fall back to manual CSV entry; missing months show 'actual not entered'
- **Browser, CORS and key issues:** Not researched; no vendor documentation fetched.
- **Recommendation (defer):** Define a plain CSV contract (month, category, account, amount, entry_type, basis, closed flag) rather than integrating a vendor; keep it vendor-neutral.
- **Used by:** [RULE-BUD-05](#rule-bud-05), [RULE-BUD-07](#rule-bud-07)
- **Source checked:** no external page. Result: **failed** (cite_budget.json checked[10]: claim no). The research's URL (OSU AGEC-751 'Developing a Cash Flow Plan') was rejected by the checker as a placeholder: it says nothing about general-ledger exports, accounting software, closed flags or CSV contracts. No source documents this integration.

<a id="int-fuel-delivery-tickets-gallons"></a>
##### Fuel delivery tickets (gallons)

- **Provides:** Gallons delivered by fuel type, for the price/volume split
- **Access:** Manual entry from delivery tickets is assumed. No tank-monitor vendor documentation was researched.
- **Cost:** Manual: staff time only
- **Licensing:** n/a
- **Coverage:** Ranch-specific
- **Refresh:** Per delivery. **Latency:** Per delivery.
- **Failure behaviour:** No price/volume split; dashboard says 'price vs use unknown'
- **Browser, CORS and key issues:** Manual entry.
- **Recommendation (defer):** Start with manual gallons from tickets. Device integration is deferred.
- **Used by:** [RULE-BUD-09](#rule-bud-09)
- **Source checked:** <https://extension.msstate.edu/publications/farm-machinery-cost-calculations>. Result: **partly** (cite_budget.json checked[27]: claim partly).

#### Browser and repository mechanisms

<a id="int-browser-localstorage-web-storage"></a>
##### Browser localStorage (Web Storage)

- **Provides:** Per-device persistence of small key/value data
- **Access:** window.localStorage; synchronous; throws SecurityError when blocked or QuotaExceededError when full
- **Cost:** Free
- **Licensing:** Web platform standard (WHATWG HTML)
- **Coverage:** One browser profile on one device for one origin. http and https are separate stores.
- **Refresh:** Immediate locally; never shared. **Latency:** Immediate on this device; never shared.
- **Failure behaviour:** Cleared when the last private tab closes. Evicted LRU under storage pressure unless persisted. Safari deletes script-created data after 7 days with no interaction (tracking prevention on). The page must render fully with an empty store.
- **Browser, CORS and key issues:** Same-origin only; http and https are separate stores. Throws SecurityError when blocked (MDN) and QuotaExceededError when full (WHATWG).
- **Recommendation (2):** Phase 2: per-device conveniences only (selected filter, last review time, an acknowledgement labelled 'this device only'). Never for shared acknowledgements, owners or shelving. The page must render fully with an empty store.
- **Used by:** [RULE-WF-15](#rule-wf-15), [RULE-WF-11](#rule-wf-11), [RULE-WF-18](#rule-wf-18)
- **Source checked:** <https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage>. Result: **partly** (cite_workflow.json checked[23]: claim partly).

<a id="int-storage-api-persistence-navigatorstoragepersist"></a>
##### Storage API persistence (navigator.storage.persist)

- **Provides:** Asks the browser to exempt the origin from automatic eviction
- **Access:** navigator.storage.persist() promise; browser may prompt or decide
- **Cost:** Free
- **Licensing:** Web platform standard
- **Coverage:** Same device and origin only
- **Refresh:** n/a. **Latency:** n/a.
- **Failure behaviour:** May be denied. The user can still clear data. Does not share data across devices.
- **Browser, CORS and key issues:** Same device and origin; the browser may prompt or decide.
- **Recommendation (exclude):** Not needed while localStorage holds only conveniences; it does not share data.
- **Used by:** [RULE-WF-15](#rule-wf-15)
- **Source checked:** <https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria>. Result: **verified** (cite_workflow.json checked[24]: claim yes).

<a id="int-committed-append-only-dataacknowledgementscsv"></a>
##### Committed append-only data/acknowledgements.csv

- **Provides:** Shared acknowledgement, owner, shelve and visual-check log, read the same way as the other CSVs
- **Access:** Edit and commit (or PR) to the repository; the page fetches it like data/\*.csv
- **Cost:** Free
- **Licensing:** Repo MIT licence; the data is the ranch's own
- **Coverage:** Everyone viewing the published site
- **Refresh:** On each commit and Pages deploy (minutes) **Latency:** Minutes (each commit and Pages deploy).
- **Failure behaviour:** If missing or unparseable, show all rows unacknowledged and a 'acknowledgement log unavailable' note
- **Browser, CORS and key issues:** Same-origin file; no external service.
- **Recommendation (defer):** Deferred with shared records. If used for the demo later, seed it with clearly fictional entries; it has no write path for live crew use.
- **Used by:** [RULE-WF-11](#rule-wf-11), [RULE-WF-16](#rule-wf-16)
- **Source checked:** no external page. Result: **unverified**. Repository-local design proposal; no external page to check.

<a id="int-google-sheets-publish-to-the-web-as-a-read-only-shared-log"></a>
##### Google Sheets 'Publish to the web' as a read-only shared log

- **Provides:** A spreadsheet the crew can edit, published for the dashboard to read
- **Access:** Published sheet URL; owners and editors publish; output may be limited to an organisation
- **Cost:** Free tier
- **Licensing:** Vendor terms (Google)
- **Coverage:** Anyone the publish setting allows. Can be everyone on the web.
- **Refresh:** Auto-republish 'might take a few minutes'. **Latency:** Automatic republish 'might take a few minutes'.
- **Failure behaviour:** Delay of minutes. If unpublished or blocked, fall back to the committed CSV. The help page warns to be careful with private or sensitive information.
- **Browser, CORS and key issues:** Published URL; output format (CSV) not verified; Google's terms apply. Ranch locations, herd counts and finances are sensitive.
- **Recommendation (defer):** Only for a real deployment, published to the organisation rather than the public web. Not for the public demo.
- **Used by:** [RULE-WF-16](#rule-wf-16)
- **Source checked:** <https://support.google.com/docs/answer/183965>. Result: **verified** (cite_workflow.json checked[36]: claim yes).

<a id="int-browser-print--media-print-crew-briefing"></a>
##### Browser print / @media print (crew briefing)

- **Provides:** Paper briefing from the same page
- **Access:** CSS @media print, @page, beforeprint/afterprint; a 'Print briefing' button calling window.print()
- **Cost:** Free
- **Licensing:** Web standard
- **Coverage:** All browsers. Rendering differs; only Chromium was tested.
- **Refresh:** At print time. **Latency:** At print time.
- **Failure behaviour:** With no print CSS (current), Chromium prints 4 Letter pages, the key text at 2.71:1, and invisible target lines. print-color-adjust is not guaranteed to be honoured.
- **Browser, CORS and key issues:** Web standard; rendering differs by browser (only Chromium was measured).
- **Recommendation (2):** Phase 2: a print stylesheet with explicit black-on-white colours (do not rely on print-color-adjust), chips and tooltip hidden, one Letter page.
- **Used by:** [RULE-WF-17](#rule-wf-17)
- **Source checked:** <https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing>. Result: **verified** (cite_workflow.json checked[30]: claim yes).

<a id="int-icalendar-rfc-5545-vtodo-export"></a>
##### iCalendar RFC 5545 VTODO export

- **Provides:** Standard to-do items with DTSTART, DUE, COMPLETED and STATUS that crew phones and calendars can subscribe to
- **Access:** Generate a .ics file from health.csv (window_start maps to DTSTART, window_end to DUE, done_date to COMPLETED)
- **Cost:** Free
- **Licensing:** IETF standard
- **Coverage:** Any calendar client
- **Refresh:** Regenerated with the data. **Latency:** Regenerated with the data.
- **Failure behaviour:** Static file; no runtime failure
- **Browser, CORS and key issues:** Static .ics file; no runtime calls.
- **Recommendation (defer):** Optional low-cost way to put the schedule on crew phones; not needed now.
- **Used by:** [RULE-HLTH-04](#rule-hlth-04)
- **Source checked:** <https://icalendar.org/iCalendar-RFC-5545/3-6-2-to-do-component.html>. Result: **verified** (cite_health.json checked[31]: claim yes).

## 6. Unresolved assumptions and open questions

### 6.1 About the thresholds and settings

- Every current threshold is a demonstration setting or a ranch choice. The research found no extension, NRCS or peer-reviewed source for the 25% / 40% tank levels, the 30-point drop, 24 hours of silence, the 2-day grace, the 80% / 50% gain shares, the 7-day lead time or the 5% / 10% budget bands.
- Every new number in a proposed rule (for example the demo dollar lines in [RULE-BUD-03](#rule-bud-03), the 70-day individual minimum in [RULE-GAIN-07](#rule-gain-07), the 9.1-day staleness line in [RULE-CTX-02](#rule-ctx-02)) is a setting to be tuned per ranch unless its entry classes it A or B and names the cattle class, season and region.
- [RULE-GAIN-07](#rule-gain-07): the demo weigh-ins span 106 days and the last interval is 57 days, so a 70-day individual default "is met only by a method that uses all three weigh-ins; an ADG from the last 57-day interval alone falls under it (not tested in this audit)". The planted heifer and six-yearling problems must be checked before the default is adopted.
- Intake, capacity and hours-of-water figures in the water diagnostics use assumed tank capacities (1,000, 1,690 and 10,000 gal), zero inflow and table intakes. They show sensitivity, not ranch facts.

### 6.2 About the evidence

- All web content came through a summarising fetch tool; direct downloads were refused by the proxy. Quotes are as the tool returned them and were not compared with the raw documents. The context research adds that table cells "may be misaligned; check the originals before reusing numbers."
- The shared web-search budget ran out during the context, budget and workflow research. The context research lists what was left unresearched as a result: "extension sources for mineral and feed intake, maintenance intervals, crew-task evidence, gestation length, NWS API CORS behaviour, NASS's exact in-season window, and ACIS/NCEI terms." The budget research could not search for variance-investigation literature, NASS prices-paid fuel data, state fuel-tax refund rules or patronage dividends.
- The BQA National Manual and Field Guide PDFs cited are undated and likely superseded by 2026 editions that could not be fetched. Every BQA-based rule rests on the older edition (registry-changelog.md section 7).
- Unverified or partly verified access details: the RCC ACIS documentation page rendered empty; the PRISM ordering terms (cost and commercial use) were not checked; whether the USDA-ARS cattle heat-stress forecast is still published in 2026 is unverified.
- Browser access (CORS) was not observed for any public data service. `docs/audit/diagnostics/context.cors.research.mjs` probes ten endpoints and has to be run where the network is open.
- Several sources come from outside the Northern and Central Plains (for example Utah, Arizona, New Mexico, Texas, Oklahoma, Missouri and Australia), and several are older than the current season. Each rule's "Limitations" line says where this matters.
- The alarm-fatigue evidence behind the workflow rules (process industry and hospital monitoring) transfers to a once-daily ranch exception report by analogy only. The workflow research warns that its numeric benchmarks "must not be read as ranch thresholds". The ISA-18.2 standard itself was not read.
- No user testing was done. The "2-minute morning review" is a design target ([RULE-WF-18](#rule-wf-18)).
- The fictional ranch has no location. Hughes County, South Dakota was used only as an example real county for API checks; any public context shown later needs a stand-in county labelled as such.

### 6.3 Where the registries disagree

These need one decision each before the fix and its test are written.

1. **Negative amounts in budget.csv.** [BUD-02](02-findings.md#bud-02)'s proposed fix accepts "accounting parentheses, '\$' and thousands separators" in money columns if the contract states it. [RULE-BUD-07](#rule-bud-07) (deferred) says "Amounts use a plain minus sign ('-300'), not accounting parentheses." Phase 1 needs one stated rule. Either way, an unreadable amount must block that category's conclusion and never become NaN or silence.
2. **How many grazing re-entries are short of minimum rest.** [RULE-GRZ-03](#rule-grz-03)'s evidence and the grazing research say "13 of 15". The grazing skeptic corrected this in [GRZ-05](02-findings.md#grz-05) to 11 of 13 sequential re-entries, plus 2 entries into a pasture another group still occupied. Use the findings registry's figures.
3. Further disagreements between the two registries (when a budget month counts as closed, the demo dollar lines, whether a large under-spend is a warning, how the 24-hour drop window is bounded, and the individual versus group minimum interval) are set out in `02-findings.md` section 7.2.

## 7. Bibliography

All 247 entries in `sources.json`, grouped by kind and sorted by publisher. "Checker" is the strictest result across the source's uses; where the result differs between rules, the per-rule results follow. "Not accepted as support" lists uses the checker rejected. One source (the Cornell onboarding page) is used by no rule and is kept for traceability with the result "failed".

### Peer-reviewed (16)

- American Society of Animal Science (University of Adelaide repository). "Optimum postweaning test for measurement of growth rate, feed intake, and feed efficiency in British breed cattle (J. Anim. Sci. 75:2024-2032)". Date: 1997. Data years: not stated on page. Checker: **verified**. Used by: [RULE-GAIN-02](#rule-gain-02), [RULE-GAIN-07](#rule-gain-07). Data fields: weights.csv: date. <https://eres.library.adelaide.edu.au/dspace/handle/2440/13249>
- American Society of Animal Science (UNL Digital Commons record). "Impacts of a limit-feeding procedure on variation and accuracy of cattle weights (J. Anim. Sci. 91:5507-5517)". Date: 2013. Data years: 18 experiments; years not stated on page. Checker: **verified**. Used by: [RULE-GAIN-01](#rule-gain-01), [RULE-GAIN-02](#rule-gain-02), [RULE-GAIN-06](#rule-gain-06). Data fields: weigh_sessions.csv (new; keyed by group + date): weight_basis. <https://digitalcommons.unl.edu/animalscifacpub/790>
- CSIRO Publishing (PDF hosted by USDA-ARS). "Can measurements of foraging behaviour predict variation in weight gains of free-ranging cattle? (Animal Production Science)". Date: 2022. Data years: 2019-2020. Checker: **verified**. Used by: [RULE-GAIN-07](#rule-gain-07). <https://www.ars.usda.gov/ARSUserFiles/30123025/Publications/2022/Augustine_2022_foraging%20behavior%20and%20weight%20gain.pdf>
- Ecological Society of America / Wiley (USDA ARS-hosted PDF). "Seasonal grassland productivity forecast for the U.S. Great Plains using Grass-Cast. Ecosphere 11(11): e03280, doi:10.1002/ecs2.3280". Date: 2020. Data years: Daymet 1980-2016; GIMMS NDVI 1982-2015; MODIS evaluation 2000-2018; forecasts 2017-2018. Checker: **verified**. Used by: [RULE-CTX-10](#rule-ctx-10). <https://ars.usda.gov/ARSUserFiles/52548/207.%20Hartman%20et%20al%202020%20Ecoshpere%20-%20seasonal%20grassland%20productivity%20forcast%20for%20Great%20Plains%20using%20Grass-Cast.pdf>
- Elsevier (PDF hosted by USDA-ARS). "Seasonal weather influences on yearling beef steer production in C3-dominated Northern Great Plains rangeland (Agric. Ecosyst. Environ. 183:110-117)". Date: 2014. Data years: 1936-2005. Checker: **verified**. Used by: [RULE-GAIN-03](#rule-gain-03). <https://www.ars.usda.gov/ARSUserFiles/30640500/HistoricalPasturePubs/51%20Reeves%20et%20al%20%20AGEE%202014.pdf>
- Elsevier / Society for Range Management (author PDF hosted by USDA ARS). "Adaptive, Multipaddock Rotational Grazing Management: A Ranch-Scale Assessment of Effects on Vegetation and Livestock Performance in Semiarid Rangeland. Rangeland Ecology & Management 73:796-810, doi:10.1016/j.rama.2020.07.005". Date: 2020. Data years: 2013 pretreatment; 2014-2018 treatment; Central Plains Experimental Range, Nunn CO. Checker: **verified**. Used by: [RULE-GAIN-03](#rule-gain-03), [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-02](#rule-grz-02). Data fields: forage_obs.csv: behavior_note. <https://www.ars.usda.gov/ARSUserFiles/51815/67.%202020%20REM%20-%20CARM%20-%20adaptive%20multipaddock%20rotational%20grazing%20-%20vegetation%20and%20livestock%20responses.pdf>
- Elsevier / Society for Range Management (PDF hosted by USDA-ARS). "Evaluation of the APEX cattle weight gain component for grazing decision-support in the Western Great Plains (Rangeland Ecol. Manage. 82:1-11)". Date: 2022. Data years: 2014-2018. Checker: **verified**. Used by: [RULE-GAIN-03](#rule-gain-03). <https://www.ars.usda.gov/ARSUserFiles/30123025/Publications/2022/Cheng%20et%20al%202022%20REM%20-%20APEX%20cattle%20weight%20gain%20component.pdf>
- Elsevier / Society for Range Management (USDA ARS-hosted PDF). "Adaptive grazing management in semiarid rangelands: An outcome-driven focus. Rangelands 44(1):111-118, doi:10.1016/j.rala.2021.02.004". Date: 2022. Data years: case studies (CARM, Rancho Largo, Red Canyon); years not summarised. Checker: **partly**. Used by: [RULE-GRZ-06](#rule-grz-06), [RULE-GRZ-08](#rule-grz-08). <https://www.ars.usda.gov/ARSUserFiles/30123025/Publications/2022/Derner%20et%20al%202022%20Rangelands%20-%20adaptive%20grazing%20management%20for%20outcome-driven%20focus.pdf>
- Journal of Animal Science (Mader, Johnson, Gaughan). "A comprehensive index for assessing environmental stress in animals". Date: 2010. Data years: 9 summer and 6 winter periods (years not in abstract). Checker: **verified**. Used by: [RULE-CTX-09](#rule-ctx-09). <https://academic.oup.com/jas/article-abstract/88/6/2153/4779866?redirectedFrom=fulltext>
- PLOS ONE (Drew BJ, Harris P, Zègre-Hemsey JK, et al.). "Insights into the Problem of Alarm Fatigue with Physiologic Monitor Devices: A Comprehensive Observational Study of Consecutive Intensive Care Unit Patients". Date: 2014-10-22. Data years: 31 days, March 2013; 461 patients; 5 ICUs at UCSF. Checker: **verified**. Used by: [RULE-WF-18](#rule-wf-18), [RULE-WF-19](#rule-wf-19). <https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0110274>
- Rangeland Ecology and Management 77:9-16 (Elsevier); record at CQUniversity repository. "Tracking and sensor-based detection of livestock water system failure: A case study simulation". Date: 2021 (Rangeland Ecology & Management 77(1):9-16; accepted 2021-02-24; 2021-07-19 is the repository posting date). Data years: 2018-2019. Checker: **verified**. Used by: [RULE-WAT-08](#rule-wat-08). Metadata: Checker: the research's 2021-07-19 is the CQU repository posting date, not the online publication date. <https://acquire.cqu.edu.au/articles/journal_contribution/Tracking_and_sensor-based_detection_of_livestock_water_system_failure_A_case_study_simulation/15001191>
- Society for Range Management (PDF hosted by USDA-ARS). "Temperature and precipitation affect steer weight gains differentially by stocking rate in northern mixed-grass prairie (Rangeland Ecol. Manage. 66:438-444)". Date: 2013. Data years: 1982-2011. Checker: **verified**. Used by: [RULE-GAIN-03](#rule-gain-03). <https://ars.usda.gov/arsuserfiles/30300500/Publications/Uploaded1272012/REE66-438-444-Reeves-2013.pdf>
- Society for Range Management (Rangelands Gateway / Univ. of Arizona repository). "Diurnal Variation in Weight and Rates of Shrink of Range Cows and Calves (J. Range Manage. 35:717-720)". Date: 1982. Data years: not stated. Checker: **verified**. Used by: [RULE-GAIN-06](#rule-gain-06). Data fields: weights.csv: weigh_time. <https://rangelandsgateway.org/dlio/22019>
- Society for Range Management (Rangelands Gateway). "Estimating Overnight Weight Loss of Corralled Yearling Steers in Semiarid Rangeland (Rangelands 38(3):101-104)". Date: 2016. Data years: four consecutive years (not named on page). Checker: **verified**. Used by: [RULE-GAIN-06](#rule-gain-06). <https://rangelandsgateway.org/dlio/17936>
- Society for Range Management (Univ. of Arizona repository). "Growth patterns of yearling steers determined from daily live weights (J. Range Manage. 42:393-396)". Date: 1989. Data years: 1986-1987 (automatic weights); 1983-1987 (manual weights). Checker: **verified**. Used by: [RULE-GAIN-01](#rule-gain-01), [RULE-GAIN-08](#rule-gain-08). <https://repository.arizona.edu/handle/10150/645028>
- Society for Range Management / USDA-ARS Fort Keogh (PDF hosted by USDA-ARS). "Intensive-early stocking for yearling cattle in the Northern Great Plains (J. Range Manage. 55:135-138)". Date: 2002. Data years: 1993-1995. Checker: **verified**. Used by: [RULE-GAIN-01](#rule-gain-01), [RULE-GAIN-03](#rule-gain-03), [RULE-GAIN-08](#rule-gain-08). Data fields: gain_expectations.csv: group, forage type, start_date, end_date, expected_adg_lbs, supplemented; weights.csv: group. <https://ars.usda.gov/ARSUserFiles/30300500/Publications/JRM55-135-138.pdf>

### Extension publications (84)

- Colorado State University Extension, Golden Plains Area. "Calculating Water for Cattle". Date: 2021-06-17. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-01](#rule-wat-01), [RULE-WAT-10](#rule-wat-10). Data fields: tanks.csv: capacity_gal, shape/dimensions, usable_fraction. <https://goldenplains.extension.colostate.edu/wp-content/uploads/sites/56/2021/06/PR_CalculatingWaterforCattle.pdf>
- Cornell University (J. Skellie, Farm Management Specialist). "Make SOPs Available to Employees". Date: 2019-07-18. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-17](#rule-wf-17). <https://bpb-us-e1.wpmucdn.com/blogs.cornell.edu/dist/7/8192/files/2019/07/Make-SOPS-Available-to-Employees.pdf>
- eXtension Beef Cattle (beef-cattle.extension.org). "What is causing my cattle to die suddenly?". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-10](#rule-hlth-10). <https://beef-cattle.extension.org/what-is-causing-my-cattle-to-die-suddenly>
- Great Lakes Basin Grazing Network / Michigan State University Extension. "Watering Systems for Grazing Livestock (Ben Bartlett)". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-09](#rule-wat-09). Data fields: tanks.csv: supply_type, design_inflow_gpm / refill_gph. <https://www.uvm.edu/d10-files/documents/2024-10/watering_systems_for_grazing_livestock.pdf>
- Iowa State University Center for Agricultural Law and Taxation (Kristine A. Tidgren). "End of Year Tax Planning Considerations for Farmers in 2021". Date: 2022-01-01 (page date). Data years: tax year 2021. Checker: **verified**. Used by: [RULE-BUD-08](#rule-bud-08). <https://www.calt.iastate.edu/post/end-year-tax-planning-considerations-farmers-2021>
- Iowa State University Extension (Ellis and Schulz), hosted copy at Purdue. "Livestock Enterprise Budgets for Iowa - 2016 (FM 1815, Ag Decision Maker B1-21)". Date: Revised 2016-06. Data years: 2016. Checker: **verified**. Used by: [RULE-BUD-12](#rule-bud-12). <https://www.ansc.purdue.edu/SP/TBC/assets/b1-21-iowa-budgets-edited.pdf>
- Iowa State University Extension and Outreach (William Edwards), hosted copy on UVM blog. "Replacement Strategies for Farm Machinery (Ag Decision Maker A3-30 / PM 1860)". Date: Revised 2015-06. Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-10](#rule-bud-10). Data fields: repairs.csv: date, asset_id, amount_usd, planned flag, hours_or_miles. <https://blog.uvm.edu/groundwk/files/2016/05/Replacement-Strategies-for-Farm-Machinery.pdf>
- K-State Beef Tips (Justin Waggoner). "Water: Questions and Answers". Date: 2018-04-30. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-06](#rule-wat-06), [RULE-WAT-10](#rule-wat-10). <https://www.k-state.edu/news/beef-tips/articles/2018/04/water-questions-and-answers.html>
- Kansas State University Agricultural Experiment Station and Cooperative Extension Service (Owensby, Fick). "Summer Grazing Strategies for Stocker Cattle in the Kansas Flint Hills (MF3232)". Date: February 2016. Data years: 9-, 10-, 8- and 10-year averages (Table 5 uses 2003-2013 market values). Checker: **partly**. Used by: [RULE-GRZ-08](#rule-grz-08). Metadata: Checker: data years were given as '10-year and 8-year' only. <https://bookstore.ksre.ksu.edu/download/summer-grazing-strategies-for-stocker-cattle-in-the-kansas-flint-hills_MF3232>
- Kansas State University Department of Agricultural Economics. "KSU Beef Cow-Calf Budget, 2018 Production Year". Date: Version 2017-12-15. Data years: Prices as of 2017-12-04; KFMA data (95 farms, avg 133 cows). Checker: **verified**. Used by: [RULE-BUD-12](#rule-bud-12). <https://www.agmanager.info/sites/default/files/pdf/KSU%20Beef%20CowCalf%20Budget.pdf>
- Kansas State University Department of Agricultural Economics (AgManager.info). "Detailed Cow/Calf Budget". Date: Version 2021-09-01. Data years: 2021-2022 default prices. Checker: **verified**. Used by: [RULE-BUD-10](#rule-bud-10). <https://agmanager.info/sites/default/files/pdf/Reid_Document_CowCalf.pdf>
- Kansas State University Research and Extension. "Estimating Water Requirements for Mature Beef Cows (MF3303)". Date: 2016-12. Data years: Equations from published literature: Murphy 1983, Hicks 1988, Meyer 2006, Winchester and Morris 1956, NRC 2000. Checker: **verified**. Used by: [RULE-WAT-06](#rule-wat-06). Data fields: groups.csv: avg_weight_lb, lactation_status. <https://bookstore.ksre.ksu.edu/download/estimating-water-requirements-for-mature-beef-cows_MF3303>
- LPES Small Farms Fact Sheets / MidWest Plan Service. "The ABCs of Livestock Watering Systems (Ben Bartlett)". Date: 2006 (copyright year). Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-03](#rule-wat-03), [RULE-WAT-10](#rule-wat-10). Data fields: tanks.csv: tank_type. <https://extension.wvu.edu/files/d/102b1da9-9f1a-40d7-90ad-5de2cd6101a8/watering-systems-by-ben-bartlett.pdf>
- Mississippi State University Extension. "Understanding and Managing Cattle Shrink (P2577)". Date: undated (page code POD-12-23). Data years: n/a. Checker: **verified**. Used by: [RULE-GAIN-06](#rule-gain-06). <https://extension.msstate.edu/publications/understanding-and-managing-cattle-shrink>
- Mississippi State University Extension (Jeff Johnson). "Farm Machinery Cost Calculations (P3543)". Date: revision code POD-10-23 (no explicit date shown). Data years: example prices only. Checker: **partly**. Used by: [RULE-BUD-09](#rule-bud-09), [RULE-BUD-10](#rule-bud-10). Data fields: fuel.csv: gallons, price_usd_per_gal (actual). Integrations: Fuel delivery tickets (gallons). <https://extension.msstate.edu/publications/farm-machinery-cost-calculations>
- National Drought Mitigation Center, UNL. "Monitor Drought and Forage on the Ranch". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-10](#rule-ctx-10). Data fields: rain_gauge.csv: gauge_id, date, precip_in. <https://ranchdrought.unl.edu/Monitor.aspx>
- National Drought Mitigation Center, UNL. "Plan for Drought". Date: undated. Data years: n/a. Checker: **partly**. Used by: [RULE-CTX-10](#rule-ctx-10), [RULE-CTX-11](#rule-ctx-11), [RULE-CTX-13](#rule-ctx-13), [RULE-WAT-06](#rule-wat-06). Data fields: drought_plan.csv: trigger (date, indicator, threshold, action); inventory.csv: item, unit, on_hand, count_date, daily_use, lead_time_days. Not accepted for: data field crew_task.csv: task_id, area, subject, assignee, due_date, status, source_exception. <https://ranchdrought.unl.edu/Plan.aspx>
- NDSU Agriculture Communication. "Water Essential for Cattle in High Heat (NDSU news release, Karl Hoppe)". Date: undated on page (URL path 2007-07-26). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-07](#rule-ctx-07), [RULE-WAT-02](#rule-wat-02), [RULE-WAT-04](#rule-wat-04). Data fields: visual_checks.csv: checked_at, checked_by, result (ok / low / dirty / float-fault / leak / dry), float_ok, overflow, ice, notes. <https://www.ag.ndsu.edu/news/newsreleases/2007/july-26-2007/water-essential-for-cattle-in-high-heat>
- NDSU Agriculture Communication (J. Block, K. Hoppe, G. Stokka). "Consider Pregnancy Testing Beef Cattle Early". Date: 2020-07-06 (URL) / 2020-07-09 (byline). Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-02](#rule-hlth-02), [RULE-HLTH-09](#rule-hlth-09). <https://www.ag.ndsu.edu/news/newsreleases/2020/july-6-2020/consider-pregnancy-testing-beef-cattle-early>
- NDSU Agriculture Communication (J. Galbreath, L. Quail). "Summer brings raised pinkeye concerns in cowherds". Date: 2025-07-02. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-02](#rule-hlth-02), [RULE-HLTH-05](#rule-hlth-05). Data fields: health.csv: task_type; observations.csv: date, group, tag(s), observer, head_with_signs, sign_code, note, escalated. <https://www.ag.ndsu.edu/news/newsreleases/2025/july/summer-brings-raised-pinkeye-concerns-in-cowherds>
- NDSU Agriculture Communication (Stokka, Webb, Dyer). "Pinkeye Infecting Some N.D. Cattle". Date: 2017-09-25 (URL) / 2017-09-27 (footer). Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-05](#rule-hlth-05). <https://www.ag.ndsu.edu/news/newsreleases/2017/sept-25-2017/pinkeye-infecting-some-n-d-cattle>
- NDSU Dickinson Research Extension Center (L. Manske). "Grazing Management for Rangeland". Date: 1999 (NDSU Dickinson REC research report). Data years: 1984-1994. Checker: **partly**. Used by: [RULE-GRZ-03](#rule-grz-03). Metadata: Checker: listed under 1999 Research Reports; the study ran 1984-1994. <https://ndsu.edu/agriculture/sites/default/files/2022-10/Grazing_Mgmt_for_Rangeland.pdf>
- NDSU Extension. "Cyanobacteria Poisoning (Blue-green Algae) (V1136)". Date: 2026-06 (revision; original 1997). Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-13](#rule-wat-13). Data fields: water_observations.csv: algae observation (source_id, date, status none/suspect/bloom, photo, sample_sent, vet_contacted). <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/56136%20Cyanobacteria.pdf>
- NDSU Extension. "Livestock Water Quality (AS1764)". Date: 2026-01 (revision). Data years: n/a. Checker: **partly**. Used by: [RULE-WAT-11](#rule-wat-11), [RULE-WAT-12](#rule-wat-12). Data fields: water_quality.csv: source_id, date, method (meter/strip/lab), tds_ppm, sulfate_ppm, nitrate_ppm (state NO3 or NO3-N). Integrations: Water testing labs (NDSU Veterinary Diagnostic Lab and others). <https://info.ext.nodak.edu/agriculture/sites/default/files/2026-01/as1764%20%281%29.pdf>
- NDSU Extension. "Livestock Water Requirements (AS1763)". Date: Revised 2026-02 (first published 2021-04-01). Data years: NRC 2016 table. Checker: **verified**. Used by: [RULE-CTX-13](#rule-ctx-13), [RULE-WAT-06](#rule-wat-06). Data fields: maintenance.csv: asset_id, asset_type, task, last_done, interval_days, next_due, status, assignee. <https://www.ndsu.edu/agriculture/extension/publications/livestock-water-requirements>
- NDSU Extension. "Livestock Water Requirements (AS1763)". Date: 2021-03 (revision). Data years: Table adapted from NRC Nutrient Requirements of Beef Cattle, 8th rev. ed., updated 2016. Checker: **verified**. Used by: [RULE-WAT-06](#rule-wat-06). Data fields: derived from groups.csv + moves.csv: head present by class per pasture. Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): Table 1, lactating cows 900 lb 11.4/12.6/14.5/16.9/17.9/16.2 gal/head/day at 40-90F; growing 600 lb 5.3 to 12.7. 'Revised March 2021'; adapted from NRC 2016. Confirmed; 90F is not the highest lactating value. <https://www.ndsu.edu/agriculture/sites/default/files/2024-04/as1763.pdf>
- NDSU Extension (Meehan, Sedivec, Printz). "The North Dakota Grazing Monitoring Stick: A Way to Measure Range and Pasture Utilization (R1780)". Date: Revised October 2024 (original date not shown). Data years: n/a. Checker: **verified**. Used by: [RULE-GRZ-03](#rule-grz-03), [RULE-GRZ-05](#rule-grz-05), [RULE-GRZ-06](#rule-grz-06). Data fields: forage_obs.csv: stubble_in (with n_readings, ungrazed_ref_in, species); pastures.csv: min_rest_days; pastures.csv: min_rest_fast_days / min_rest_slow_days. Integrations: NDSU Grazing Monitoring Stick protocol (R1780). <https://www.ndsu.edu/agriculture/sites/default/files/2026-06/R1780%20The%20North%20Dakota%20Grazing%20Monitoring%20Stick%20%281%29.pdf>
- NDSU Extension (Meehan, Sedivec, Printz, Brummer). "Determining Carrying Capacity and Stocking Rates for Range and Pasture in North Dakota (R1810)". Date: November 2018; reviewed April 2024 (page modified January 16, 2025). Data years: n/a. Checker: **verified**. Used by: [RULE-GRZ-06](#rule-grz-06), [RULE-GRZ-07](#rule-grz-07). Data fields: moves.csv: head_in, group average weight; pastures.csv: forage_lb_ac, harvest_efficiency. <https://www.ndsu.edu/agriculture/ag-hub/publications/determining-carrying-capacity-and-stocking-rates-range-and-pasture-north-dakota>
- NDSU Extension and Ag Research News (Stokka, Tobin, Hoppe). "Controlling flies on cattle requires proper timing". Date: 2024-05-22. Data years: n/a. Checker: **partly**. Used by: [RULE-HLTH-05](#rule-hlth-05). Data fields: health.csv: fly_season_start / fly_season_end; observations.csv: fly_count_per_animal. <https://www.ag.ndsu.edu/news/newsreleases/2024/may/controlling-flies-on-cattle-requires-proper-timing>
- Nebraska Extension (Aaron Berger), PREEC news. "Cameras and Cellular Technology: Checking water from afar". Date: 2025-04-23. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-07](#rule-ctx-07). <https://preec.unl.edu/news/cameras-and-cellular-technology-checking-water-afar>
- Nebraska Extension (BeefWatch). "Guide to Body Condition Scoring Your Beef Cow Herd". Date: 2020-02-02. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-12](#rule-ctx-12), [RULE-GAIN-04](#rule-gain-04), [RULE-GAIN-05](#rule-gain-05). Data fields: bcs.csv: group or tag, date, score, target; groups.csv: gain_metric. <https://beef.unl.edu/learning/condition1a.shtml>
- Nebraska Extension / UNL BeefWatch (Beckman, Benjamin, Stephenson). "Green Is Not Always Growth: Nebraska Pasture Conditions After Late Rains". Date: August 1, 2026. Data years: USDA NASS condition ratings, week ending July 20, 2026. Checker: **verified**. Used by: [RULE-CTX-10](#rule-ctx-10). <https://beef.unl.edu/green-not-always-growth-nebraska-pasture-conditions-after-late-rains/>
- Nebraska Extension BeefWatch (Amy Timmerman). "Blue-Green Algae Impacts on Cattle". Date: 2021-07-07. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-13](#rule-wat-13). <https://beef.unl.edu/beefwatch/2021/blue-green-algae-impacts-cattle>
- Nebraska Extension BeefWatch (Aquino and Xiong). "Using technology to monitor water on the ranch". Date: 2024-03-27. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-07](#rule-ctx-07). <https://beef.unl.edu/beefwatch/2024/modern-water-monitoring-technology-ranch>
- Nebraska Extension BeefWatch (C. Biehler). "Do not let Pinkeye Decrease Efficiencies in Summer Grazing". Date: 2021-08-01. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-05](#rule-hlth-05). <https://beef.unl.edu/beefwatch/2021/do-not-let-pinkeye-decrease-efficiencies-summer-grazing>
- Nebraska Extension BeefWatch (D. Boxler). "Face Flies on Pastured Cattle". Date: 2023-06-01. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-05](#rule-hlth-05). <https://beef.unl.edu/beefwatch/2023/face-flies-pastured-cattle>
- Nebraska Extension BeefWatch (M. Hille, D. Steffen). "Investigating the cause of cattle abortions: When to involve your veterinarian and what happens next". Date: 2023-11-01. Data years: n/a. Checker: **partly**. Used by: [RULE-HLTH-10](#rule-hlth-10). Data fields: losses.csv: death_date, group, id, cause_known, abortion flag; baseline_loss_rate. <https://beef.unl.edu/beefwatch/2023/investigating-cause-cattle-abortions-when-involve-your-veterinarian-and-what-happens/>
- Nebraska Extension BeefWatch (Troy Walz). "Water Requirements for Beef Cattle". Date: 2020-07-02. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-12](#rule-wat-12). <https://beef.unl.edu/water-requirements-for-beef-cattle/>
- Nebraska Extension BeefWatch (Walz and Berger). "How much water do cattle need and what water problems should cattle producers watch for?". Date: page dated 2025-04-30 (URL path says 2023). Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-06](#rule-wat-06). <https://beef.unl.edu/beefwatch/2023/how-much-water-do-cattle-need-and-what-water-problems-should-cattle-producers-watch-0>
- Nebraska Mesonet, UNL School of Natural Resources. "Nebraska Mesonet - Coming Soon". Date: undated (Copyright 2026). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-16](#rule-ctx-16). <https://nemesonet.unl.edu/coming-soon>
- North Dakota Agricultural Weather Network (NDSU). "Cattle Comfort Index". Date: undated (Copyright 2026). Data years: current conditions. Checker: **partly**. Used by: [RULE-CTX-09](#rule-ctx-09). Data fields: weather snapshot (derived): cci_f_adult / cci_f_newborn. Integrations: NDAWN (including Cattle Comfort Index). <https://ndawn.info/agriculture_cci.html>
- Oklahoma State University Agricultural Economics. "Stocker Enterprise Budget: 100 Steers, 2026 Planning Budget". Date: File dated 2025-12-02. Data years: 2026 planning prices. Checker: **verified**. Used by: [RULE-BUD-12](#rule-bud-12). <https://extension.okstate.edu/programs/farm-management-and-finance/budgets/sample-budgets/site-files/docs/2026-sample-budgets/2026-stockers-a.pdf>
- Oklahoma State University Extension. "Developing a Cash Flow Plan (AGEC-751)". Date: 2020-08. Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-04](#rule-bud-04). Data fields: budget.csv: month. Not accepted for: integration Ranch accounting system export (general ledger by account and month). <https://extension.okstate.edu/fact-sheets/developing-a-cash-flow-plan>
- Oklahoma State University Extension. "Developing an Income Statement (AGEC-753)". Date: 2021-02. Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-08](#rule-bud-08). Data fields: meta.csv: accounting_basis. <https://extension.okstate.edu/fact-sheets/developing-an-income-statement>
- Oklahoma State University Extension. "Estimating Water Requirements for Mature Beef Cows (AFS-3299)". Date: 2017-07-01. Data years: Same underlying studies; notes NRC (2000) relies on 1956 data. Checker: **verified**. Used by: [RULE-WAT-06](#rule-wat-06). <https://extension.okstate.edu/fact-sheets/estimating-water-requirements-for-mature-beef-cows.html>
- Oklahoma State University Extension. "Managing Shrink and Weighing Conditions in Beef Cattle (ANSI-3257)". Date: undated (footer code 0607). Data years: cites studies 1972-1997. Checker: **verified**. Used by: [RULE-GAIN-06](#rule-gain-06). Data fields: weigh_sessions.csv: gather_time, hours_off_feed_water. <https://pods.okstate.edu/fact-sheets/ANSI-3257pod.pdf>
- Oklahoma State University Extension (Boileau, Lalman, Whitworth). "Pinkeye (VTMD-9128)". Date: 2016-10. Data years: n/a. Checker: **partly**. Used by: [RULE-HLTH-05](#rule-hlth-05). <https://extension.okstate.edu/fact-sheets/pinkeye>
- Oklahoma State University Extension, Oklahoma BQA (per URL; not named in fetched text). "Health treatment record (Oklahoma BQA form)". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-06](#rule-hlth-06). <https://extension.okstate.edu:443/programs/beef-extension/oklahoma-beef-quality-assurance/site-files/documents/health-treatment-record.pdf>
- Penn State College of Agricultural Sciences, Cooperative Extension (R. Stup); hosted by Cornell. "Standard Operating Procedures: A Writing Guide". Date: 2001. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-17](#rule-wf-17). Data fields: crew_roster.csv: name, role, language preference, route/pastures. <https://bpb-us-e1.wpmucdn.com/blogs.cornell.edu/dist/7/8192/files/2018/03/SOPManual-1-2drpn48.pdf>
- Penn State Extension (Miguel Antonio Saviroff). "Farm Accrual Adjustments to a Cash Basis Income Statement". Date: undated. Data years: n/a. Checker: **partly**. Used by: [RULE-BUD-07](#rule-bud-07), [RULE-BUD-08](#rule-bud-08). Data fields: budget.csv: entry_type. <https://extension.psu.edu/farm-accrual-adjustments-to-a-cash-basis-income-statement>
- Progressive Dairy / AgProud (author William Edwards, Iowa State University). "Twelve steps to cash flow budgeting (excerpt of ISU Ag Decision Maker)". Date: 2010-11-12. Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-04](#rule-bud-04), [RULE-BUD-05](#rule-bud-05), [RULE-BUD-11](#rule-bud-11). Data fields: budget.csv: actual. <https://agproud.com/articles/29923-twelve-steps-to-cash-flow-budgeting>
- Progressive Forage / AgProud (author William Edwards, Iowa State University). "Estimating costs for forage production machinery". Date: 2013-09-30. Data years: example prices only. Checker: **verified**. Used by: [RULE-BUD-09](#rule-bud-09), [RULE-BUD-10](#rule-bud-10). <https://agproud.com/articles/34062-estimating-costs-for-forage-production-machinery>
- Rural Tax Education (Utah State University; Colorado State; University of Minnesota). "Prepaid Farm Expenses". Date: Revised 2025-08 (page dated 2025-08-18). Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-08](#rule-bud-08). <https://extension.usu.edu/ruraltax/tax-topics/prepaid-farm-expenses-2023>
- SDSU Extension. "Coffee at Cottonwood: Digital Record Keeping & Electronic Identification (event)". Date: Event dated Friday, January 22 (year inferred by the checker as 2027 from page metadata). Data years: n/a. Checker: **verified**. Used by: [RULE-WF-16](#rule-wf-16). Metadata: Checker: an upcoming single event, not evidence of an established program. <https://extension.sdstate.edu/event/coffee-cottonwood-digital-record-keeping-electronic-identification>
- SDSU Extension. "Developing Heifers to Fit Your Production Environment". Date: updated 2026-07-10. Data years: n/a. Checker: **verified**. Used by: [RULE-GAIN-09](#rule-gain-09). <https://extension.sdstate.edu/developing-heifers-fit-your-production-environment>
- SDSU Extension. "Interpretation of Water Analysis for Livestock Suitability (P-00212)". Date: 2023-11 (original 2004). Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-11](#rule-wat-11), [RULE-WAT-12](#rule-wat-12). <https://extension.sdstate.edu/sites/default/files/2023-11/P-00212.pdf>
- SDSU Extension. "Management of Body Condition Score Throughout the Year". Date: updated 2022-09-09. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-12](#rule-ctx-12), [RULE-GAIN-04](#rule-gain-04), [RULE-GAIN-05](#rule-gain-05). <https://extension.sdstate.edu/management-body-condition-score-throughout-year>
- SDSU Extension. "Reading the Range: Range readiness, grazing timing and drought considerations". Date: Updated April 13, 2022. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-10](#rule-ctx-10), [RULE-GRZ-09](#rule-grz-09). <https://extension.sdstate.edu/reading-range-range-readiness-grazing-timing-and-drought-considerations>
- SDSU Extension. "Targeted Feeding for Heifer Development". Date: updated 2021-10-25. Data years: n/a. Checker: **verified**. Used by: [RULE-GAIN-09](#rule-gain-09). Data fields: replacement.csv: mature_weight_lbs, target_pct_mature, breeding_start. <https://extension.sdstate.edu/targeted-feeding-heifer-development>
- SDSU Extension (Brennan, Menendez, Ehlert). "South Dakota Grazing Readiness Spring Turnout Map". Date: Updated April 8, 2022 (page metadata October 4, 2024). Data years: PRISM 40-year climate normals. Checker: **verified**. Used by: [RULE-GRZ-09](#rule-grz-09). <https://extension.sdstate.edu/south-dakota-grazing-readiness-spring-turnout-map>
- SDSU Extension (Heather Gessner). "Beef Cattle Budgets". Date: Updated 2026-05-22. Data years: not stated. Checker: **verified**. Used by: [RULE-BUD-12](#rule-bud-12). Integrations: SDSU Extension Beef Cattle Budgets spreadsheet. <https://extension.sdstate.edu/beef-cattle-budgets>
- SDSU Extension (Krista Ehlert). "Designing a Grazing Plan That Guides Decisions (MC-04340)". Date: undated (URL folder 2026-07; page shows (c) 2026 South Dakota Board of Regents). Data years: n/a. Checker: **verified**. Used by: [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-05](#rule-grz-05). <https://extension.sdstate.edu/sites/default/files/2026-07/MC-04340.pdf>
- SDSU Extension (R. Daly). "Springtime Vaccines: Tools For Healthy Summer Calves". Date: 2020-06-10 (updated). Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-01](#rule-hlth-01), [RULE-HLTH-02](#rule-hlth-02). <https://extension.sdstate.edu/springtime-vaccines-tools-healthy-summer-calves>
- SDSU Extension (Taylor Grussing). "Hauling Water to Cows: When water is not everywhere". Date: 2026-07-17 (updated). Data years: n/a. Checker: **partly**. Used by: [RULE-WAT-06](#rule-wat-06). Data fields: tanks.csv: backup water / haul capacity. <https://extension.sdstate.edu/hauling-water-cows-when-water-not-everywhere>
- South Dakota Mesonet, South Dakota State University. "Daily Data Request". Date: undated. Data years: 2015-2026 selectable. Checker: **partly**. Used by: [RULE-CTX-16](#rule-ctx-16). Integrations: South Dakota Mesonet (SDSU). <https://climate.sdstate.edu/request/daily/>
- UC Davis School of Veterinary Medicine Extension (J. Maas), in California Cattlemen's Magazine. "Booster Vaccines (UC Davis Vet Views, cca0810)". Date: 2008-10. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-01](#rule-hlth-01), [RULE-HLTH-04](#rule-hlth-04). Data fields: health.csv: schedule_source. <https://vetext.vetmed.ucdavis.edu/sites/g/files/dgvnsk5616/files/local_resources/pdfs/pdfs_beef/cca0810-booster-vaccines.pdf>
- University of Arkansas System Division of Agriculture (from nondiscrimination notice). "Beef Herd Health Record V2". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-06](#rule-hlth-06). <https://www.uaex.uada.edu/farm-ranch/animals-forages/beef-cattle/Beef%20Herd%20Health%20Record_V2.pdf>
- University of Calgary Faculty of Veterinary Medicine / Beef Cattle Research Council (per title and URL; not named in fetched text). "BCRC Vaccine Project - Clostridial Vaccination Guidelines". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-04](#rule-hlth-04). Metadata: Checker: the document carries no title, publisher or date in its text; attribution comes from the file name and host. <https://vet.ucalgary.ca/sites/default/files/teams/9/BCRC%20Vaccine%20Project%20-%20Clostridial%20Vaccination%20Guidelines.pdf>
- University of Missouri Extension. "Nutritional Management of Developing Heifers: Intensive Versus Extensive Systems (G2091)". Date: 2021-09. Data years: n/a. Checker: **verified**. Used by: [RULE-GAIN-09](#rule-gain-09). <https://extension.missouri.edu/media/wysiwyg/Extensiondata/Pub/pdf/agguides/ansci/g02091.pdf>
- University of Nebraska-Lincoln BeefWatch. "Supplementing Yearlings in the Summer Grazing Season: Is it Worth it?". Date: 2022-07-01. Data years: price analysis 2012-2021; trial years not stated. Checker: **verified**. Used by: [RULE-GAIN-01](#rule-gain-01), [RULE-GAIN-03](#rule-gain-03). <https://beef.unl.edu/beefwatch/2022/supplementing-yearlings-summer-grazing-season-it-worth-it>
- University of Nebraska-Lincoln BeefWatch (Eirich, Woolsoncroft). "Heat Stress: Handling Cattle Through High Heat Humidity Indexes". Date: 2018-08-01 (archived story). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-07](#rule-ctx-07). Data fields: health.csv: planned_work_start / planned_work_end. <https://newsroom.unl.edu/announce/beef/8200/47172>
- University of Nebraska-Lincoln Center for Agricultural Profitability. "Nebraska Cattle Budgets - Northern Panhandle". Date: Updated July 2026. Data years: 2026 budgets. Checker: **verified**. Used by: [RULE-BUD-12](#rule-bud-12). Data fields: budget_annual.csv: annual_budget_usd per category. Integrations: UNL Center for Agricultural Profitability regional cattle budgets. <https://cap.unl.edu/cattlebudgets/northern-panhandle/>
- University of Nebraska-Lincoln Center for Agricultural Profitability / Nebraska Extension. "2026 UNL Livestock Jan-Dec, 400 Head Cow Herd, Northern Panhandle (sample economic budget)". Date: undated in PDF (landing page says 'Updated July 2026'). Data years: 2026 prices. Checker: **verified**. Used by: [RULE-BUD-03](#rule-bud-03), [RULE-BUD-09](#rule-bud-09). Not accepted for: data field fuel.csv: plan_gallons, plan_price_usd_per_gal. <https://cap.unl.edu/sites/unl.edu.ianr.agecon.center-for-ag-profitability/files/media/file/2026%20Northern%20Panhandle%20400%20Head%20Cow%20Herd%20budget.pdf>
- University of Nebraska-Lincoln CropWatch (Tigner and Duerfeldt). "Cash Flow Budgeting for Farms and Ranches". Date: 2018-01-08. Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-04](#rule-bud-04). Data fields: budget.csv: budget. <https://cropwatch.unl.edu/2018/cash-flow-budgeting-farms-and-ranches>
- University of Nebraska-Lincoln Extension. "Reducing Replacement Heifer Development Costs Using a Systems Approach (G2215)". Date: 2013-09. Data years: n/a. Checker: **verified**. Used by: [RULE-GAIN-09](#rule-gain-09). <https://extensionpubs.unl.edu/publication/g2215/2013/pdf/view/g2215-2013.pdf>
- University of Nebraska-Lincoln Extension. "Switchgrass, Big Bluestem, and Indiangrass for Grazing and Hay (NebGuide G1908)". Date: December 2008. Data years: n/a. Checker: **partly**. Used by: [RULE-GRZ-01](#rule-grz-01). <https://extensionpubs.unl.edu/publication/g1908/na/pdf/view>
- University of Nebraska-Lincoln Extension. "Water Requirements for Beef Cattle (G2060)". Date: 2011-03. Data years: Adapted from NRC 1996, derived from Winchester and Morris 1956. Checker: **verified**. Used by: [RULE-WAT-06](#rule-wat-06), [RULE-WAT-11](#rule-wat-11). Data fields: lookup (static table): intake_gal_per_head_day by class and temperature. <https://extensionpubs.unl.edu/publication/g2060/2011/pdf/view/g2060-2011.pdf>
- University of Nebraska-Lincoln Extension (Schacht, Volesky, Bauer, Stephenson). "Grazing Systems for Nebraska Sandhills Rangeland (EC127)". Date: (c) 2011. Data years: Barta Brothers Ranch 1999-2008. Checker: **verified**. Used by: [RULE-GRZ-07](#rule-grz-07). <https://extensionpubs.unl.edu/publication/ec127/na/pdf/view>
- University of Nebraska-Lincoln IANR News (no writer named; quotes R. Eirich). "Extension educator offers tips on handling cattle in hot weather". Date: 2016-05-31. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-07](#rule-ctx-07). Metadata: Checker (health): no writer is named; Rob Eirich is quoted, so he is the source, not the author. <https://ianrnews.unl.edu/extension-educator-offers-tips-handling-cattle-hot-weather>
- University of Wisconsin-Madison Division of Extension (B. Halfman). "Cattle handling and stockmanship influence on animal performance". Date: undated (image uploaded 2022-07; not confirmed as article date). Data years: cites Reinhardt et al. 2009 (data 2002-2006), Dewell et al. 2019, Woiwode et al. 2016. Checker: **verified**. Used by: [RULE-HLTH-09](#rule-hlth-09). <https://livestock.extension.wisc.edu/articles/cattle-handling-and-stockmanship-influence-on-animal-performance>
- University of Wyoming Extension. "Enterprise Budget for a Cow-Calf-Yearling Operation, Northwestern Wyoming (MP-126.1)". Date: 2014-08. Data years: 2010 dollars. Checker: **verified**. Used by: [RULE-BUD-04](#rule-bud-04). <https://www.wyoextension.org/agpubs/pubs/MP-126.1.pdf>
- University of Wyoming Extension. "Enterprise Budget for Beef Cattle: Cow-Calf Production, 200 Head, Southeastern Wyoming (B-1217)". Date: November 2010 (published June 2011). Data years: 2010 budget year. Checker: **verified**. Used by: [RULE-BUD-04](#rule-bud-04). <https://www.wyoextension.org/agpubs/pubs/B1217.pdf>
- UNL BeefWatch. "Heifer percent mature body weight at breeding: What does it mean for pregnancy rates and calf performance?". Date: 2024-01-17. Data years: 2005-2019. Checker: **verified**. Used by: [RULE-GAIN-09](#rule-gain-09). <https://beef.unl.edu/beefwatch/2024/heifer-percent-mature-body-weight-breeding-what-does-it-mean-pregnancy-rates-and-calf/>
- Western Livestock Journal (author Scott Clawson, OSU Extension). "Finance chores to tackle this fall". Date: 2024-09-06. Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-04](#rule-bud-04). <https://www.wlj.net/finance-chores-to-tackle-this-fall>

### Government agencies (47)

- BLM, USDA Forest Service, USDA NRCS Grazing Land Technology Institute, Cooperative Extension Service (copy hosted by University of Arizona Extension). "Utilization Studies and Residual Measurements, Interagency Technical Reference 1734-3". Date: 1996, revised 1997 and 1999. Data years: n/a. Checker: **verified**. Used by: [RULE-GRZ-06](#rule-grz-06). Data fields: forage_obs.csv: utilization_pct (method; temporal or seasonal scope). <https://extension.arizona.edu/sites/extension.arizona.edu/files/attachment/utilstudies.pdf>
- Cornell Legal Information Institute (reproducing the Code of Federal Regulations). "21 CFR 530.3 Definitions (paragraph (i) veterinarian-client-patient relationship)". Date: undated on page. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-11](#rule-hlth-11), [RULE-HLTH-12](#rule-hlth-12). Data fields: meta.csv: vet_name, vet_phone, last_vet_premises_visit. Not accepted for: data field health.csv: task. <https://www.law.cornell.edu/cfr/text/21/530.3>
- eCFR (USDA AMS Packers and Stockyards regulations). "9 CFR 201.72 Scales; testing of". Date: most recent change 88 FR 62696, 2023-09-13. Data years: n/a. Checker: **verified**. Used by: [RULE-GAIN-11](#rule-gain-11). <https://www.ecfr.gov/current/title-9/chapter-II/part-201/subpart-K/section-201.72>
- Internal Revenue Service. "Form 4136 Credit for Federal Tax Paid on Fuels (2024)". Date: Form 4136 (2024). Data years: 2024 rates. Checker: **verified**. Used by: [RULE-BUD-07](#rule-bud-07). <https://irs.gov/pub/irs-prior/f4136--2024.pdf>
- Internal Revenue Service. "Instructions for Form 4136 and Schedule A (2025)". Date: 2025 edition; page reviewed or updated 2026-04-30. Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-07](#rule-bud-07). Metadata: Checker: edition year missing from the research title; rates should be checked against the edition cited. <https://www.irs.gov/node/40551>
- Jornada Experimental Range. "EDIT has moved". Date: undated (states NRCS hosting as of April 2026). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-14](#rule-ctx-14). <https://jornada.nmsu.edu/edit/catalogs/esd>
- Justia (reproducing South Dakota Administrative Rules). "SD Admin. Rules 12:68:03:09 List of reportable diseases". Date: current through SD Register Vol. 51 p.149, 2025-06-23. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-10](#rule-hlth-10). <https://regulations.justia.com/states/south-dakota/title-12/article-12-68/chapter-12-68-03/section-12-68-03-09>
- National Drought Mitigation Center. "USDM county statistics, Hughes County SD (API response)". Date: undated (live response fetched 2026-10-16). Data years: 2026-09-01 to 2026-10-13. Checker: **verified**. Used by: [RULE-CTX-01](#rule-ctx-01), [RULE-CTX-15](#rule-ctx-15). Data fields: meta.csv: context_county_fips, context_state. <https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=46065&startdate=9/1/2026&enddate=10/15/2026&statisticsType=1>
- National Drought Mitigation Center. "USDM permission / attribution". Date: undated (Copyright 2026). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-15](#rule-ctx-15). Data fields: context.csv (build-time snapshot): source_provenance (source_url, retrieved_at, license_note). <https://droughtmonitor.unl.edu/About/Permission.aspx>
- National Drought Mitigation Center. "USDM Web Service Info". Date: undated (Copyright 2026). Data years: n/a. Checker: **partly**. Used by: [RULE-CTX-03](#rule-ctx-03). Data fields: context.csv (build-time snapshot): usdm_pct_none/d0/d1/d2/d3/d4 (county). Integrations: U.S. Drought Monitor data services (REST statistics). <https://droughtmonitor.unl.edu/DmData/DataDownload/WebServiceInfo.aspx>
- National Drought Mitigation Center, Univ. of Nebraska-Lincoln (with USDA, NOAA). "U.S. Drought Monitor home (Map released: October 15, 2026)". Date: 2026-10-15 (map release shown). Data years: 2026. Checker: **verified**. Used by: [RULE-CTX-01](#rule-ctx-01), [RULE-CTX-02](#rule-ctx-02). Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): maps 'are released each Thursday at 8:30 a.m. Eastern Time'; 'The data cutoff for Drought Monitor maps is each Tuesday at 8 a.m. EDT'; map released Oct 15 2026, data valid Oct 13 2026. Confirmed. <https://droughtmonitor.unl.edu/?stream=top>
- NDMC via ArcGIS Online. "USDM current (ArcGIS FeatureServer layer 0) and query". Date: Layer page 'Last Edit Date 10/1/2026'; features show MapDate 2026-10-13. Data years: 2026. Checker: **verified**. Used by: [RULE-CTX-01](#rule-ctx-01). Integrations: USDM current (ArcGIS Online FeatureServer). <https://services5.arcgis.com/0OTVzJS4K09zlixn/ArcGIS/rest/services/USDM_current/FeatureServer/0>
- NOAA National Weather Service. "NWS API Web Service documentation". Date: Known issues 'Updated 3/24/2026'. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-07](#rule-ctx-07). Data fields: weather snapshot (build-time, dated): daily_high_f and hourly forecast (temp_f, rh_pct, wind_mph, sky_cover_pct), forecast THI. Integrations: NWS API (api.weather.gov). <https://www.weather.gov/documentation/services-web-API>
- NOAA NIDIS (drought.gov). "National Current Conditions". Date: undated (shows Data Valid 10/13/26). Data years: 2026. Checker: **verified**. Used by: [RULE-CTX-01](#rule-ctx-01). Data fields: context.csv (build-time snapshot): usdm_valid_date, usdm_released_at. <https://www.drought.gov/drought/data-maps-tools/current-conditions>
- NOAA NWS. "NWS HeatRisk X3 2024". Date: 2024 ('Available May 2024'). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-08](#rule-ctx-08). <https://www.weather.gov/media/safety/NWS-HeatRisk-X3-2024.pdf>
- NOAA NWS Weather Prediction Center. "HeatRisk - Overview". Date: undated (mentions 2014 West; CONUS 2024). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-08](#rule-ctx-08). Integrations: NWS HeatRisk. <https://www.wpc.ncep.noaa.gov/heatrisk/overview.html>
- NOAA NWS WPC. "HeatRisk v2.5 Overview". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-08](#rule-ctx-08). <https://www.wpc.ncep.noaa.gov/heatrisk/pdf/HeatRisk-v2.5-Overview.pdf>
- Rangeland Analysis Platform. "RAP Products". Date: undated. Data years: 1986-present. Checker: **verified**. Used by: [RULE-CTX-06](#rule-ctx-06). Integrations: Rangeland Analysis Platform (RAP). <https://rangelands.app/products>
- Rangeland Analysis Platform. "RAP Terms of Service". Date: 2024-09-11. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-06](#rule-ctx-06). <https://rangelands.app/tos/>
- Rangeland Analysis Platform (USDA ARS and partners). "RAP API Documentation". Date: undated. Data years: 1986-previous year. Checker: **verified**. Used by: [RULE-CTX-06](#rule-ctx-06). Data fields: pastures.csv: rap_production_lb_ac by year. Integrations: Rangeland Analysis Platform (RAP). <https://rangelands.app/support/71-api-documentation>
- South Dakota Animal Industry Board. "SD Animal Industry Board - Veterinarians". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-10](#rule-hlth-10). Integrations: South Dakota Animal Industry Board (reportable diseases, state veterinarian). <https://aib.sd.gov/veterinarians.html>
- South Dakota Department of Agriculture and Natural Resources. "Drought Information". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-01](#rule-ctx-01). <https://danr.sd.gov/AboutDANR/drought.aspx>
- Tennessee Comptroller of the Treasury, Division of Local Government Finance. "Steps to a Well-Managed Budget". Date: Last modified 2025-01-30. Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-04](#rule-bud-04), [RULE-BUD-11](#rule-bud-11). <https://comptroller.tn.gov/office-functions/lgf/budgets/municipalities-counties-metros-utilities/general-guidance/steps-to-a-well-managed-budget0.html>
- U.S. Energy Information Administration. "Diesel fuel price methodology". Date: undated (page shows release 2026-10-14). Data years: sample frame 2021; new sample effective 2022-06-13. Checker: **verified**. Used by: [RULE-BUD-09](#rule-bud-09). <https://www.eia.gov/PETROLEUM/GASDIESEL/diesel_methodology.php>
- U.S. Energy Information Administration. "Gasoline and Diesel Fuel Update". Date: Release 2026-10-14 (next 2026-10-20). Data years: weeks of 2026-09-28, 10-05, 10-12. Checker: **verified**. Used by: [RULE-BUD-09](#rule-bud-09). Integrations: EIA retail diesel prices (PADD 2 Midwest, PADD 4 Rocky Mountain). <https://www.eia.gov/petroleum/gasdiesel/>
- U.S. Energy Information Administration. "Midwest No 2 Diesel Retail Prices (Dollars per Gallon), monthly". Date: undated series page (fetched 2026-10-16). Data years: 2025-01 to 2026-09. Checker: **partly**. Used by: [RULE-BUD-09](#rule-bud-09). Data fields: context.csv (build-time snapshot): diesel_price_padd (EIA PADD 2 or PADD 4). <https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EMD_EPD2D_PTE_R20_DPG&f=M>
- U.S. Energy Information Administration. "Rocky Mountain No 2 Diesel Retail Prices (Dollars per Gallon), monthly". Date: undated series page (fetched 2026-10-16). Data years: 2025-01 to 2026-09. Checker: **verified**. Used by: [RULE-BUD-09](#rule-bud-09). <https://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=EMD_EPD2D_PTE_R40_DPG&f=M>
- U.S. FDA Center for Veterinary Medicine. "Veterinarian-Client-Patient Relationships, Prescribing/Dispensing Animal Drugs, and Telemedicine". Date: content current as of 2024-09-04. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-08](#rule-hlth-08), [RULE-HLTH-11](#rule-hlth-11). <https://www.fda.gov/animal-veterinary/product-safety-information/veterinarian-client-patient-relationships-prescribingdispensing-animal-drugs-and-telemedicine>
- UK Health and Safety Executive. "Better alarm handling (Chemicals Sheet No 6, CHIS6)". Date: 2000-03. Data years: Incident case 1994 (Milford Haven). Checker: **verified**. Used by: [RULE-WF-09](#rule-wf-09), [RULE-WF-10](#rule-wf-10), [RULE-WF-11](#rule-wf-11), [RULE-WF-13](#rule-wf-13), [RULE-WF-19](#rule-wf-19), [RULE-WF-20](#rule-wf-20). Data fields: acknowledgements.csv (shared log): first_seen_at; rules change log: rule_change_log (rule_id, old, new, changed_by, changed_at, reason); rules table (page copy): rule_basis; tanks.csv (new master list): in_service; tanks.csv: out_of_service audit (changed_by, changed_at, reason), tank_shutoff, planned_move_in. <https://www.hse.gov.uk/pubns/chis6.pdf>
- USDA APHIS VS CEAH, National Animal Health Monitoring System. "Beef Cow-calf Health and Management Practices in the United States, 2017 (Beef 2017 Report 2)". Date: 2021-05 (cover; suggested citation lists 2020). Data years: calendar year 2017; 24 states. Checker: **verified**. Used by: [RULE-HLTH-12](#rule-hlth-12). <https://www.aphis.usda.gov/sites/default/files/beef-2017-part2.pdf>
- USDA ARS U.S. Meat Animal Research Center, Clay Center NE. "Forecasting Heat Stress". Date: Last Modified 2016-08-12. Data years: solar example 2001; cited papers 2005. Checker: **verified**. Used by: [RULE-CTX-07](#rule-ctx-07). Data fields: weather snapshot (derived): heat_stress_category. Integrations: USDA-ARS USMARC cattle heat-stress forecast maps. <https://www.ars.usda.gov/plains-area/clay-center-ne/marc/documents/heat-stress/forecastingheatstress/>
- USDA ARS USMARC. "Heat Stress Forecast Maps (regions)". Date: Last Modified 2017-07-26. Data years: unknown (date only in image). Checker: **partly**. Used by: [RULE-CTX-07](#rule-ctx-07). Integrations: USDA-ARS USMARC cattle heat-stress forecast maps. <https://www.ars.usda.gov/plains-area/clay-center-ne/marc/documents/heat-stress/indexregion>
- USDA Climate Hubs (Northern Plains). "Grass-Cast: Grassland Productivity Forecast". Date: undated. Data years: 1982-present baseline. Checker: **verified**. Used by: [RULE-CTX-05](#rule-ctx-05). <https://www.climatehubs.usda.gov/hubs/northern-plains/tools/grass-cast-grassland-productivity-forecast>
- USDA Economic Research Service. "Commodity Costs and Returns". Date: Recent files last updated 2026-10-01; next update 2027-05-03. Data years: recent estimates (years not listed on page). Checker: **verified**. Used by: [RULE-BUD-12](#rule-bud-12). Integrations: USDA ERS Commodity Costs and Returns (cow-calf). <https://www.ers.usda.gov/data-products/commodity-costs-and-returns>
- USDA Economic Research Service. "Commodity Costs and Returns: Documentation". Date: Updated 2026-03-18. Data years: Cow-calf ARMS survey years 1980, 1985, 1990, 1996, 2008, 2018; indexed between surveys. Checker: **verified**. Used by: [RULE-BUD-12](#rule-bud-12). Data fields: budget.csv: category. Metadata: Checker: the research said 'undated'. <https://www.ers.usda.gov/data-products/commodity-costs-and-returns/documentation>
- USDA Farm Service Agency. "Livestock Forage Disaster Program (LFP)". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-03](#rule-ctx-03). Data fields: context.csv (build-time snapshot): usdm_weeks_d2plus_8wk. Integrations: USDA FSA Livestock Forage Disaster Program (rule source). <https://www.fsa.usda.gov/resources/programs/livestock-forage-disaster-program-lfp>
- USDA NASS. "Crop Progress and Condition Program (Program Review)". Date: 2019-04. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-04](#rule-ctx-04). <https://www.NASS.USDA.gov/Surveys/Program_Review/2019/Crop-Progress-and-Condition-Program.pdf>
- USDA NASS. "South Dakota Crop Progress and Condition, week ending Sept 11, 2022". Date: 2022-09-12. Data years: 2022. Checker: **verified**. Used by: [RULE-CTX-04](#rule-ctx-04). <https://www.nass.usda.gov/Statistics_by_State/South_Dakota/Publications/Crop_Progress_&_Condition/2022/SD-weekly0912.pdf>
- USDA NASS (ESMIS). "Crop Progress, Nov 26 2007". Date: 2007-11-26. Data years: 2007. Checker: **verified**. Used by: [RULE-CTX-04](#rule-ctx-04). <https://esmis.nal.usda.gov/sites/default/release-files/8336h188j/sx61dn51w/m039k649s/CropProg-11-26-2007.txt>
- USDA NASS Kansas Field Office. "Kansas Crop Progress and Condition, week ending July 5, 2026". Date: 2026-07-06. Data years: 2026. Checker: **verified**. Used by: [RULE-CTX-04](#rule-ctx-04). Data fields: context.csv (build-time snapshot): nass_pasture_vp_p_pct, g_ex_pct, week_ending. <https://www.nass.usda.gov/Statistics_by_State/Kansas/Publications/Crop_Progress_and_Condition/2026/KS-weekly0706.pdf>
- USDA NRCS. "Grazing Management (Code 528) Conservation Practice Standard - landing page". Date: Page text: 'Updated in 2026, the next review of this national conservation practice standard is expected to begin October 2030.'. Data years: n/a. Checker: **verified**. Used by: [RULE-GRZ-03](#rule-grz-03). <https://www.nrcs.usda.gov/resources/guides-and-instructions/grazing-management-code-528-conservation-practice-standard>
- USDA NRCS. "Soil Data Access Web Service Help". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-14](#rule-ctx-14). Data fields: pastures.csv: ecosite_id, ref_production_lbs_ac. Integrations: NRCS Soil Data Access + EDIT (ecological sites). <https://sdmdataaccess.nrcs.usda.gov/WebServiceHelp.aspx>
- USDA NRCS / ARS Jornada / NMSU. "Ecosystem Dynamics Interpretive Tool (EDIT)". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-14](#rule-ctx-14). <https://edit.sc.egov.usda.gov>
- USDA NRCS Illinois (Illinois Grazing Manual fact sheet). "Water Resources Development for Managing Intensive Grazing of Beef". Date: 2004. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-09](#rule-wat-09). <https://www.nrcs.usda.gov/sites/default/files/2022-12/Water-Res-Dev-for-Managing-Intens-Grazing-Beef.pdf>
- USDA NRCS Missouri. "Watering Systems for Serious Graziers". Date: 2006-08. Data years: n/a. Checker: **partly**. Used by: [RULE-WAT-08](#rule-wat-08). Not accepted for: data field water.csv: flow_meter_gal. <https://www.nrcs.usda.gov/sites/default/files/2023-06/Watering_Systems_for_Serious_Graziers.pdf>
- USDA NRCS South Dakota. "Prescribed Grazing, Range Technical Note No. 9". Date: April 2017. Data years: n/a. Checker: **partly**. Used by: [RULE-CTX-10](#rule-ctx-10), [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-03](#rule-grz-03), [RULE-GRZ-04](#rule-grz-04), [RULE-GRZ-06](#rule-grz-06), [RULE-WAT-05](#rule-wat-05). Data fields: forage_obs.csv: growth_stage; moves.csv: planned_out_date; pastures.csv: growing_season_start / end; pastures.csv: key_species, target_stubble_in. Integrations: NRCS eFOTG state technical notes (e.g. SD Range Technical Note No. 9). <https://efotg.sc.egov.usda.gov/references/public/SD/No.9-PrescribedGrazing.pdf>
- USDA-ARS (Data.gov). "Data from: Can measurements of foraging behaviour predict variation in weight gains of free-ranging cattle?". Date: updated 2025-11-21. Data years: 2019-2020. Checker: **partly**. Used by: [RULE-GAIN-10](#rule-gain-10). Integrations: USDA-ARS CPER foraging behaviour and ADG dataset. Not accepted for: data field groups.csv: head. <https://catalog.data.gov/dataset/data-from-can-measurements-of-foraging-behaviour-predict-variation-in-weight-gains-of-free>

### Standards and specifications (28)

- Beef Improvement Federation (hosted on docs.c-lockinc.com). "Beef Improvement Federation Guidelines for Feed Efficiency Testing as of March 26th, 2019 (copy hosted by C-Lock Inc., a vendor)". Date: 2019-03-26. Data years: n/a. Checker: **verified**. Used by: [RULE-GAIN-02](#rule-gain-02), [RULE-GAIN-07](#rule-gain-07). Data fields: weights.csv: tag. Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): 'a minimum of a 70-d test period is required to accurately compute average daily gain for individual animals'; weigh twice on separate days at start and end; regression 'may enhance the accuracy ... somewhat'; ad libitum feed required. Confirmed; the 70 d is a controlled-feeding test length. <https://docs.c-lockinc.com/Document%20-%20Beef%20Improvement%20Federation%20Guidelines%20for%20FE%20Testing.pdf>
- Beef Improvement Federation Guidelines. "Body Condition Scores". Date: 2022-06-02 (last edited). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-12](#rule-ctx-12). <https://guidelines.beefimprovement.org/index.php/Body_Condition_Scores>
- Beef Improvement Federation Guidelines. "Exposure Data". Date: 2021-04-12 (last edited). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-12](#rule-ctx-12). Data fields: breeding.csv: group, bull_in_date, bull_out_date. <https://guidelines.beefimprovement.org/index.php/Exposure_Data>
- Beef Improvement Federation Guidelines. "Pregnancy Data". Date: 2026-03-27 (last edited). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-12](#rule-ctx-12). Data fields: preg_check.csv: group, date, method, pregnant_n, open_n. <https://guidelines.beefimprovement.org/index.php/Pregnancy_Data>
- Beef Quality Assurance program. "BQA Field Guide (bqa_field-_guide.pdf)". Date: undated (the only year shown is a 1996 NRC table credit); likely superseded by bqa-field-guide-2026.pdf. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-04](#rule-hlth-04), [RULE-WF-16](#rule-wf-16). Data fields: marketing plan: planned_ship_date. Metadata: Checker: likely superseded by bqa-field-guide-2026.pdf, which words several points differently (it keeps the 2-year retention). <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_field-_guide.pdf>
- Beef Quality Assurance program (the PDF names no publisher; 'Funded by Beef Farmers and Ranchers'; NCBA is the Beef Checkoff contractor). "Beef Quality Assurance National Manual (bqa_manual_final.pdf)". Date: undated (no date in the PDF; newest data cited are the 2016 NBQA, a 2018 footnote and a 1998-2017 series). Likely superseded: NCBA announced an updated manual on 2024-12-19 (2025-01-06 is a trade-press reprint date), and bqa.org now links a 2026 edition that could not be fetched.. Data years: newest data cited: 2016 National Beef Quality Audit; a 1998-2017 series. Checker: **verified**. Used by: [RULE-CTX-07](#rule-ctx-07), [RULE-HLTH-01](#rule-hlth-01), [RULE-HLTH-03](#rule-hlth-03), [RULE-HLTH-04](#rule-hlth-04), [RULE-HLTH-06](#rule-hlth-06), [RULE-HLTH-08](#rule-hlth-08), [RULE-HLTH-11](#rule-hlth-11), [RULE-WF-16](#rule-wf-16). Data fields: health.csv: group; health.csv: next_due; health.csv: window_start, window_end; health_records.csv: done_date, done_by; health_records.csv: product_and_lot, route_location; health_records.csv: withdrawal_clear_date. Not accepted for: data field health.csv: status; data field health.csv: task_id. Metadata: Checker: likely superseded. bqa.org now links 2026 editions (NCBA announced an updated manual 2024-12-19); the 2026 manual could not be fetched, so claims are not re-verified against the current edition. <https://WWW.BQA.ORG/Media/BQA/Docs/bqa_manual_final.pdf>
- International Society of Automation. "ISA18 series of standards (product page)". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-12](#rule-wf-12). <https://www.isa.org/standards-and-publications/isa-standards/isa-18-series-of-standards>
- Kansas Livestock Association / Kansas BQA (per URL and form text). "KS-BQA record keeping forms (Processing/Treatment Map etc.)". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-06](#rule-hlth-06), [RULE-HLTH-07](#rule-hlth-07). Data fields: health.csv: responsible, vet_needed; health_records.csv: head_done, head_planned. Integrations: BQA record forms and templates (KS-BQA, Oklahoma BQA, Arkansas; BQA templates page). <https://www.kla.org/Media/KLA/Docs/bqarecordkeeping.pdf>
- MDN Web Docs. "print-color-adjust". Date: Last modified 2026-08-27. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-17](#rule-wf-17). <https://developer.mozilla.org/en-US/docs/Web/CSS/print-color-adjust>
- MDN Web Docs. "Printing (CSS media queries guide)". Date: Last modified 2025-11-07. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-17](#rule-wf-17). Integrations: Browser print / @media print (crew briefing). <https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Printing>
- MDN Web Docs (Mozilla). "Storage quotas and eviction criteria". Date: Last modified 2026-01-05. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-15](#rule-wf-15). Data fields: browser localStorage (this device only): local acknowledgement (exception_id, acked_at), selected filter, last_review_at. Integrations: Storage API persistence (navigator.storage.persist). <https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria>
- MDN Web Docs (Mozilla). "Window: localStorage property". Date: Last modified 2026-10-12. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-15](#rule-wf-15). Integrations: Browser localStorage (Web Storage). Not accepted for: data field meta.csv: as_of. <https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage>
- National Academies of Sciences, Engineering, and Medicine (National Academies Press). "Nutrient Requirements of Beef Cattle: Eighth Revised Edition (Summary; Chapter 9 Water)". Date: 2016. Data years: not reviewed. Checker: **verified**. Used by: [RULE-WAT-06](#rule-wat-06). <https://www.nationalacademies.org/read/19014/chapter/2>
- PCAOB. "AS 2105: Consideration of Materiality in Planning and Performing an Audit". Date: Effective for audits of fiscal years beginning on or after 2010-12-15. Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-01](#rule-bud-01), [RULE-BUD-03](#rule-bud-03). <https://pcaobus.org/oversight/standards/auditing-standards/details/AS2105>
- USDA NRCS. "Grazing Management (Code 528) Conservation Practice Standard". Date: June 2025. Data years: n/a. Checker: **partly**. Used by: [RULE-GRZ-01](#rule-grz-01), [RULE-GRZ-02](#rule-grz-02), [RULE-GRZ-03](#rule-grz-03), [RULE-WAT-05](#rule-wat-05). Data fields: derived from water.csv + moves.csv: water status of the occupied and destination pasture; moves.csv: override_reason; moves.csv: planned_next_pasture. <https://www.nrcs.usda.gov/sites/default/files/2025-07/528-nhcp-cps-grazing-management-2025-rev.pdf>
- USDA NRCS. "Watering Facility (Code 614) Conservation Practice Standard". Date: 2023-08. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-03](#rule-wat-03), [RULE-WAT-05](#rule-wat-05), [RULE-WAT-09](#rule-wat-09). Not accepted for: data field water.csv: tank_id. Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): 'When windmill, solar, or other potentially unreliable power sources are used, consider supplying additional daily water storage volume (3–5 days)' (Considerations; 'consider', not 'shall'). O&M: 'Check for leaks' and 'Checking the performance of the automatic water level device, if present.' August 2023. Confirmed. <https://www.nrcs.usda.gov/sites/default/files/2023-08/614_NHCP_CPS_Watering_Facility_2023.pdf>
- USDA NRCS Colorado. "Conservation Practice Standard Watering Facility (614), Colorado". Date: 2015-10 (marked ARCHIVED). Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-09](#rule-wat-09). <https://efotg.sc.egov.usda.gov/api/CPSFile/3900/614_CO_CPS_Watering_Facility_2015>
- W3C. "Web Content Accessibility Guidelines (WCAG) 2.2, W3C Recommendation". Date: 2024-12-12. Data years: n/a. Checker: **partly** (by rule: RULE-WF-01 verified, RULE-WF-03 partly). Used by: [RULE-WF-01](#rule-wf-01), [RULE-WF-03](#rule-wf-03). <https://www.w3.org/TR/WCAG22/>
- W3C WAI. "Understanding SC 1.1.1: Non-text Content". Date: Updated 2026-09-06. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-04](#rule-wf-04). <https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html>
- W3C WAI. "Understanding SC 1.4.11: Non-text Contrast". Date: Updated 2026-09-06. Data years: n/a. Checker: **partly** (by rule: RULE-WF-07 verified, RULE-WF-08 partly). Used by: [RULE-WF-07](#rule-wf-07), [RULE-WF-08](#rule-wf-08). <https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html>
- W3C WAI. "Understanding SC 1.4.13: Content on Hover or Focus". Date: Updated 2026-07-12. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-02](#rule-wf-02), [RULE-WF-03](#rule-wf-03). <https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html>
- W3C WAI. "Understanding SC 1.4.1: Use of Color". Date: Updated 2025-09-16. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-01](#rule-wf-01). <https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html>
- W3C WAI. "Understanding SC 2.1.1: Keyboard". Date: Updated 2026-05-11. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-02](#rule-wf-02). <https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html>
- W3C WAI. "Understanding SC 2.4.11: Focus Not Obscured (Minimum)". Date: Updated 2026-06-15. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-07](#rule-wf-07). <https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html>
- W3C WAI. "Understanding SC 2.4.7: Focus Visible". Date: Updated 2026-09-06. Data years: n/a. Checker: **partly**. Used by: [RULE-WF-07](#rule-wf-07). <https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html>
- W3C WAI. "Understanding SC 2.5.8: Target Size (Minimum)". Date: Updated 2026-05-11. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-06](#rule-wf-06). <https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html>
- W3C WAI. "Understanding SC 4.1.3: Status Messages". Date: Updated 2026-05-11. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-05](#rule-wf-05). <https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html>
- WHATWG. "HTML Living Standard - Web storage". Date: Last updated 2026-10-14. Data years: n/a. Checker: **verified**. Used by: [RULE-WF-15](#rule-wf-15). <https://html.spec.whatwg.org/multipage/webstorage.html>

### Field studies and demonstrations (9)

- Meat & Livestock Australia (producer Stanbroke). "Evaluation of on-farm sensing devices using mobile technology". Date: 2022-08-30. Data years: not stated. Checker: **verified**. Used by: [RULE-WAT-14](#rule-wat-14). <https://www.mla.com.au/research-and-development/reports/2023/evaluation-of-on-farm-sensing-devices-using-mobile-technology/>
- NDSU Dickinson Research Extension Center. "Complementary Rotation Grazing System in Western North Dakota (Project 1906; file named 'Pasture Management for Western North Dakota')". Date: undated. Data years: 1983-1986. Checker: **partly**. Used by: [RULE-GAIN-04](#rule-gain-04). <https://www.ndsu.edu/agriculture/sites/default/files/2022-10/Pasture%20Management%20for%20Western%20North%20Dakota.pdf>
- NMSU Cooperative Extension / USDA-ARS Jornada (McIntosh et al.). "Testing of a LoRa-WAN digital ranching system on desert rangelands: some practical experiences". Date: 2021 (NMSU ACES Beef, Dairy and Livestock Update); the archive entry date 2022-01-25 was not verified by the checker. Data years: 2020. Checker: **verified**. Used by: [RULE-WAT-07](#rule-wat-07). <https://archive.jornada.nmsu.edu/files/bibliography/21-059.pdf>
- Prairie Agricultural Machinery Institute. "Livestock Scales (Evaluation Report 654)". Date: 1991-07. Data years: test year not stated. Checker: **verified**. Used by: [RULE-GAIN-11](#rule-gain-11). Data fields: weigh_sessions.csv: scale_id, check_weight_lbs, check_reading_lbs, zeroed. <https://pami.ca/pdfs/reports_research_updates/(5e)%20Livestock%20Scales/654.PDF>
- Society for Range Management (Rangelands Gateway). "Do Environmental Variables Influence Overnight Weight Loss of Yearling Steers in Semiarid Rangelands (SRM annual meeting abstract)". Date: 2014. Data years: 2009-2012. Checker: **verified**. Used by: [RULE-GAIN-01](#rule-gain-01), [RULE-GAIN-06](#rule-gain-06). Data fields: weigh_sessions.csv: pencil_shrink_pct. <https://rangelandsgateway.org/node/25589>
- University of Nebraska-Lincoln. "Effect of Supplementation during the Breeding Season on a May-calving Herd in the Nebraska Sandhills". Date: 2018. Data years: 4-year study (calendar years not stated). Checker: **verified**. Used by: [RULE-GAIN-04](#rule-gain-04). Metadata: Checker: the research title omitted 'in the Nebraska Sandhills'. <https://Beef.unl.edu/documents/2018-beef-report/2018-06-Effect-of-Supplementation-during-the-Breeding-Season-on-a-May-calving-Herd.pdf>
- University of Nebraska-Lincoln. "Replacement of Grazed Forage and Animal Performance when Distillers Grains are Fed in a Bunk or on the Ground on Summer Range (2014 Nebraska Beef Cattle Report pp. 34-35)". Date: 2014. Data years: 2011-2012. Checker: **verified**. Used by: [RULE-GAIN-01](#rule-gain-01). <https://Beef.unl.edu/28d9d9d4-33f0-4075-b8ed-5a01a870ba0d.pdf>
- University of Nebraska-Lincoln. "Research Results are Dependent on Accurate Cattle Weights (2012 Nebraska Beef Cattle Report pp. 45-46)". Date: 2012. Data years: Four weighing events, October 2009 to May 2011. Checker: **verified**. Used by: [RULE-GAIN-01](#rule-gain-01), [RULE-GAIN-02](#rule-gain-02). Data fields: weights.csv: weight_lbs. Metadata: Checker: data years are stated in the report. <https://Beef.unl.edu/7a4f176f-73e2-4fa9-b86c-ed95f8543602.pdf>
- Utah State University Extension (Kevin Heaton). "Using Remote Sensing Technology To Monitor Stock Tanks". Date: undated. Data years: not stated. Checker: **verified**. Used by: [RULE-WAT-04](#rule-wat-04). Data fields: tanks.csv or route plan: response_time_h, next_check_at. <https://extension.usu.edu/rangelands/research/remote-sensing-stock-tanks.php>

### Product documentation (agency or university products) (7)

- Grass-Cast / NDMC. "Examples of Total Production vs Grazing Production". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-05](#rule-ctx-05), [RULE-GRZ-05](#rule-grz-05). Data fields: forage_obs.csv: date, pasture_id, observer, residual_in or utilization_pct, recovery_ready, photo_point. <https://grasscast.unl.edu/docs/Examples-of-Total-Production-vs-Grazing-Production.pdf>
- National Drought Mitigation Center. "Grass-Cast Data". Date: undated. Data years: 1981-2019. Checker: **partly**. Used by: [RULE-CTX-05](#rule-ctx-05). Integrations: Grass-Cast grassland productivity forecast. <https://grasscast.unl.edu/Data.aspx>
- National Drought Mitigation Center. "Grass-Cast FAQ". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-05](#rule-ctx-05). <https://grasscast.unl.edu/FAQ.aspx>
- National Drought Mitigation Center. "Grass-Cast home". Date: undated (states 'As of August 31, 2026'). Data years: 2026 season. Checker: **verified**. Used by: [RULE-CTX-05](#rule-ctx-05), [RULE-CTX-10](#rule-ctx-10). <https://grasscast.unl.edu/>
- NDMC and partners. "About Our Maps (Grass-Cast)". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-05](#rule-ctx-05), [RULE-CTX-10](#rule-ctx-10), [RULE-GAIN-08](#rule-gain-08), [RULE-GRZ-05](#rule-grz-05). Data fields: context.csv (build-time snapshot): grasscast_pct_vs_avg, map_date, scenario. Integrations: Grass-Cast grassland productivity forecast. <https://grasscast.unl.edu/Outlook/About.aspx>
- PRISM Group, Oregon State University. "Ordering High-Resolution PRISM Data". Date: undated (states 'As of March 2025'). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-10](#rule-ctx-10). <https://prism.oregonstate.edu/orders>
- PRISM Group, Oregon State University. "PRISM Gridded Climate Data - Downloads via Web Service". Date: 2025-03-26. Data years: daily 1981-present; monthly 1895-present. Checker: **verified**. Used by: [RULE-CTX-10](#rule-ctx-10). Data fields: context.csv (build-time snapshot): precip_public_in, normal_in, retrieved_at. Integrations: PRISM gridded climate web service. <https://www.prism.oregonstate.edu/documents/PRISM_downloads_web_service.pdf>

### Vendor material (19)

- exida.com LLC (consultancy). Authors Stauffer, Sands, Dunn.. "Alarm Management and ISA-18 - A Journey, Not a Destination (white paper)". Date: Copyright 2018-2020. The revision history says it was presented in 2010; the document leaves this unresolved.. Data years: n/a. Checker: **partly** (by rule: RULE-WF-09 verified, RULE-WF-10 verified, RULE-WF-12 partly, RULE-WF-13 verified, RULE-WF-18 verified, RULE-WF-20 partly). Used by: [RULE-WF-09](#rule-wf-09), [RULE-WF-10](#rule-wf-10), [RULE-WF-12](#rule-wf-12), [RULE-WF-13](#rule-wf-13), [RULE-WF-18](#rule-wf-18), [RULE-WF-20](#rule-wf-20). Data fields: acknowledgements.csv (shared log): shelved_until, shelve_reason, shelved_by; rules table (page copy): severity_consequence and response_window per rule. Not accepted as support for: [RULE-WF-14](#rule-wf-14). Not accepted for: data field page state (derived): source_last_update per source (water, weigh-ins, moves, health, budget). <http://www.exida.com/articles/ALARM-MANAGEMENT-AND-ISA-18-A-JOURNEY-NOT-A-DESTINATION.pdf>
- Farmbot Help Centre (vendor). "How do I Check my Monitor Battery?". Date: 2024-09-16. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-13](#rule-ctx-13). Data fields: water.csv: battery_v. <https://intercom.help/farmbot-helpcentre/en/articles/5667006-how-do-i-check-my-monitor-battery>
- Farmbot Help Centre (vendor). "How do I Read my Water Level Data and Graphs?". Date: 2024-09-16. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-14](#rule-wat-14). <https://intercom.help/farmbot-helpcentre/en/articles/5322574-how-do-i-read-my-water-level-data-and-graphs>
- Farmbot Help Centre (vendor). "What does Device Status 'Delay' mean?". Date: 2026-04-13. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-04](#rule-wat-04). Integrations: Ranchbot / Farmbot remote tank monitors (vendor). <https://intercom.help/farmbot-helpcentre/en/articles/5666871-what-does-device-status-delay-mean>
- Gallagher (vendor; PDF hosted by Valley Vet). "Load Bar User Manual 3E1045 Edition 12". Date: 2014-03. Data years: n/a. Checker: **verified**. Used by: [RULE-GAIN-11](#rule-gain-11). Integrations: Gallagher load bars / weigh scale (vendor). <https://www.valleyvet.com/library/lib_19258_-Manual1.pdf>
- Inductive Automation (vendor documentation). "Alarming | Ignition User Manual 8.1". Date: Last updated 2026-04-17. Data years: n/a. Checker: **partly** (by rule: RULE-WF-11 partly, RULE-WF-12 verified). Used by: [RULE-WF-11](#rule-wf-11), [RULE-WF-12](#rule-wf-12). Data fields: acknowledgements.csv (shared log): cleared_at. Integrations: Industrial SCADA alarm model (Ignition 8.1; vendor documentation). Not accepted for: data field acknowledgements.csv (shared log): ack_by, ack_at; data field page state (derived): exception_id. <https://docs.inductiveautomation.com/docs/8.1/platform/alarming>
- Publisher not recorded. "Livestock Weight Management Solutions (Tru-Test/Datamars info sheet)". Date: REV 12192023, (c) 2024. Data years: not stated. Checker: **partly**. Integrations: Chute scale indicator with EID reader (e.g. Tru-Test S3/ID5000/XR5000; vendor). Not accepted for: data field weights.csv: eid. Metadata: Checker: actual title differs; no 15-digit RFID, EID error-reduction or export-format claim in the source. <https://www.agproud.com/ext/resources/directories/files/Datamars/Tru-Test_WeighIndicators_InfoSheet.pdf>
- LoneStar Tracking (vendor). "Water Tank Level Monitoring System". Date: undated (page footer (c) 2026). Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-01](#rule-wat-01), [RULE-WAT-07](#rule-wat-07), [RULE-WAT-14](#rule-wat-14). Data fields: tanks.csv: expected_report_interval_h, device_model. Integrations: LoneStar Tracking water tank monitor (vendor). <https://www.lonestartracking.com/?p=60249>
- Meat & Livestock Australia. "Water monitoring in the digital age: Reducing stress and improving the efficiency of the 'water run'". Date: 2022-11-08. Data years: project 2019-11 to 2021-11. Checker: **partly**. Used by: [RULE-WAT-14](#rule-wat-14). Metadata: Citation critic (critic-rules, 2026-10-16): kind changed from field-study to vendor. The checker found the report written in first-person developer language with a subscription offer; MLA is funder and publisher only. <https://mla.com.au/research-and-development/reports/2021/water-monitoring-in-the-digital-age-reducing-stress-and-improving-the-efficiency-of-the-water-run>
- Meat & Livestock Australia (authored by Farmbot Australia, vendor). "Digital Livestock 4.0 2019/2020 Pilot: Farmbot Romani Pastoral Deployment Case Study (V.DIG.2022)". Date: 2022-02-08. Data years: 2019-2020. Checker: **verified**. Used by: [RULE-WAT-14](#rule-wat-14). <https://www.mla.com.au/contentassets/0e15746c51c64adaa343ac5cd50ebab4/v.dig.2022-farmbot-final-report.pdf>
- Myriota (vendor). "Satellite Water Tank Monitoring System (LoneStar Tracking partner page)". Date: 2025-02-03 (last modified). Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-04](#rule-wat-04). <https://myriota.com/partner-products/satellite-water-tank-monitoring-system/>
- Ranchbot Help Center (vendor). "How to set up water tank alerts & notifications". Date: 2023-09-20. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-01](#rule-wat-01), [RULE-WAT-02](#rule-wat-02), [RULE-WAT-03](#rule-wat-03). Re-checked: Re-read 2026-10-16 (critic-rules, WebFetch): warning 'e.g. you may set this at 40-50% level'; critical 'e.g. you may set this to 10-20% level'; rapid drop 'e.g. 11.81 inches in 60mins'; examples, not defaults; Kadee Petty, 2023-09-20. Confirmed. <https://intercom.help/ranchbot/en/articles/8388692-how-to-set-up-water-tank-alerts-notifications>
- Ranchbot Help Center (vendor). "How to set water tank shape and volume alerts". Date: 2024-11-21. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-14](#rule-wat-14). <https://intercom.help/ranchbot/en/articles/10173097-how-to-set-water-tank-shape-and-volume-alerts>
- Ranchbot Help Center (vendor). "Monitor Battery Low Notifications". Date: 2023-01-05. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-13](#rule-ctx-13). <https://intercom.help/ranchbot/en/articles/5702599-monitor-battery-low-notifications>
- Ranchbot Help Center (vendor). "Ranchbot Monitor Cold Weather Care". Date: 2025-10-29. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-13](#rule-ctx-13). <https://intercom.help/ranchbot/en/articles/5702598-ranchbot-monitor-cold-weather-care>
- Ranchbot Help Center (vendor). "Reading my water level data and graphs". Date: 2023-09-20. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-08](#rule-wat-08). <https://intercom.help/ranchbot/en/articles/8388698-reading-my-water-level-data-and-graphs>
- Ranchbot Help Center (vendor). "What does Monitor Status 'Delay' mean?". Date: 2024-02-16. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-04](#rule-wat-04), [RULE-WAT-07](#rule-wat-07). Data fields: water.csv: time. <https://intercom.help/ranchbot/en/articles/7944517-what-does-monitor-status-delay-mean>
- Ranchbot Help Center (vendor). "What is offset and how to update it". Date: 2023-08-11. Data years: n/a. Checker: **verified**. Used by: [RULE-WAT-01](#rule-wat-01). Data fields: tanks.csv: sensor_offset_in, offset_set_at; water.csv: level_in (raw); water.csv: level_pct. <https://intercom.help/ranchbot/en/articles/7941241-what-is-offset-and-how-to-update-it>
- Ranchbot Help Center (vendor). "Xtend Statuses Overview". Date: 2026-06-30. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-13](#rule-ctx-13). Data fields: water.csv: device_status. <https://intercom.help/ranchbot/en/articles/14331104-xtend-statuses-overview>

### Other publishers (institutions, trade press, news, aggregators) (19)

- American Angus Association. "AHIR Guidelines (mature cow weight and BCS)". Date: undated. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-12](#rule-ctx-12), [RULE-GAIN-05](#rule-gain-05). <https://aimsdata.angus.org/performance/AhirGuidelines>
- American Association of Bovine Practitioners Conference Proceedings (Maunsell et al.). "FARAD: How we respond to withdrawal inquiries". Date: 2021-10-09. Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-08](#rule-hlth-08). Integrations: FARAD (Food Animal Residue Avoidance Databank). <https://bovine-ojs-tamu.tdl.org/AABP/article/view/8283>
- American Veterinary Medical Association (atwork.avma.org; page does not name a publisher). "The veterinarian-client-patient relationship (VCPR)". Date: undated (mentions Model Act revisions 2003 and 2012). Data years: n/a. Checker: **verified**. Used by: [RULE-HLTH-12](#rule-hlth-12). <https://atwork.avma.org/resources-tools/pet-owners/petcare/veterinarian-client-patient-relationship-vcpr>
- Beef Magazine (reporting North Dakota Farm Management Education program data). "What is your cow-calf cost of production?". Date: 2021-08-31. Data years: 2020 production year; 17 herds, 3,755 cows, ND excluding Red River Valley. Checker: **verified**. Used by: [RULE-BUD-03](#rule-bud-03). Data fields: head_count.csv: head by group and month. <https://www.beefmagazine.com/beef/what-your-cow-calf-cost-production>
- Beef Quality Assurance program. "BQA Field Guide (2026 file)". Date: undated in the extracted text (file name 2026). Data years: n/a. Checker: **verified**. Used by: [RULE-WF-16](#rule-wf-16). Data fields: acknowledgements.csv (shared log): ack_note / planned_action; meta.csv: record_retention_years. <https://www.bqa.org/Media/BQA/Docs/bqa-field-guide-2026.pdf>
- Beef Quality Assurance program (beef checkoff). "Assessor's Guide to the BQA Cow-Calf Assessment". Date: undated (file name FY26). Data years: n/a. Checker: **partly** (by rule: RULE-WAT-15 partly, RULE-WF-16 verified). Used by: [RULE-WAT-15](#rule-wat-15), [RULE-WF-16](#rule-wf-16). <https://www.bqa.org/Media/BQA/Docs/bqa-cow-calf-assessment-cover-fy26.pdf>
- CRAN (A. Brown). "rapr README". Date: rapr 1.1.0 (2025). Data years: 1986-present (30 m), 2018-present (10 m). Checker: **verified**. Used by: [RULE-CTX-06](#rule-ctx-06). <https://cran.r-project.org/web/packages/rapr/readme/README.html>
- Drovers (R. Brooks). "Worried about potential heat stress? Consult these forecast maps". Date: 2020-11-12. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-07](#rule-ctx-07). <https://www.drovers.com/markets/worried-about-potential-heat-stress-consult-these-forecast-maps>
- Farm Credit Services of America. "Cash-flow Budgeting: About Amount and Timing". Date: 2024-01-10. Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-11](#rule-bud-11). Data fields: budget.csv: reforecast_usd. <https://www.fcsamerica.com/resources/learning-center/cash-flow-budgeting-about-amount-and-timing>
- Farm Progress. "USDA issues heat stress forecasts". Date: 2020-07-08. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-07](#rule-ctx-07). <https://www.farmprogress.com/weather/usda-issues-heat-stress-forecasts>
- Farms.com (Will Secor). "Cow-Calf Costs and Returns Update". Date: 2026-01-08. Data years: 2024 (USDA estimates). Checker: **verified**. Used by: [RULE-BUD-12](#rule-bud-12). <https://www.farms.com/news/cow-calf-costs-and-returns-update-236952.aspx>
- Government Finance Officers Association (GFOA). "Budget Monitoring (best practice)". Date: Board approved 2018-03-31. Data years: n/a. Checker: **partly**. Used by: [RULE-BUD-01](#rule-bud-01), [RULE-BUD-04](#rule-bud-04), [RULE-BUD-05](#rule-bud-05), [RULE-BUD-13](#rule-bud-13). Data fields: budget.csv: variance_note, owner. Not accepted as support for: [RULE-BUD-14](#rule-bud-14). Not accepted for: data field meta.csv: as_of; data field meta.csv: books_closed_through. <https://gfoa.org/materials/budget-monitoring>
- Iowa Environmental Mesonet, Iowa State University. "IEM Provided JSON-P Webservices". Date: undated (footer Copyright 2001-2026). Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-02](#rule-ctx-02). Integrations: Iowa Environmental Mesonet JSON services. <https://mesonet.agron.iastate.edu/json/>
- KFYR-TV. "Online index helps producers keep cattle warm during cold temperatures". Date: 2026-02-19. Data years: n/a. Checker: **partly**. Used by: [RULE-CTX-09](#rule-ctx-09). <https://www.kfyrtv.com/2026/02/19/online-index-helps-producers-keep-cattle-warm-during-cold-temperatures/>
- Merck & Co. (author J. Smith, Texas A&M). "Disease Screening, Treatment, and Surveillance in Beef Cattle (Merck Veterinary Manual, professional version)". Date: reviewed 2023-07; modified 2024-09. Data years: n/a. Checker: **verified**. Used by: [RULE-GAIN-02](#rule-gain-02), [RULE-HLTH-11](#rule-hlth-11). <https://www.merckvetmanual.com/management-and-nutrition/preventative-health-care-and-husbandry-of-beef-cattle/disease-screening-treatment-and-surveillance-in-beef-cattle>
- rOpenSci. "Using rnassqs". Date: rnassqs v0.6.4, 2026-09-29. Data years: n/a. Checker: **verified**. Used by: [RULE-CTX-04](#rule-ctx-04). Integrations: USDA NASS Crop Progress (Quick Stats API, state PDFs). Metadata: Checker: third-party R package vignette, not NASS documentation. <https://docs.ropensci.org/rnassqs/articles/rnassqs.html>
- South Dakota Grassland Coalition (Sandy Smart). "Range 101: Efficiencies of Rotational Grazing". Date: May 2021 (byline); page timestamp October 26, 2023. Data years: cites an NDSU long-term comparison and a 1986 Nebraska report; years not given. Checker: **partly**. Used by: [RULE-GRZ-06](#rule-grz-06). <https://sdgrass.org/range-101-efficiencies-of-rotational-grazing/>
- University of Alberta (UAPPOL). "Budget Variance Accountability Procedure". Date: Approved 2006-07-17; editorial amendments 2025-05-20. Data years: n/a. Checker: **partly**. Used by: [RULE-BUD-01](#rule-bud-01), [RULE-BUD-02](#rule-bud-02), [RULE-BUD-03](#rule-bud-03), [RULE-BUD-06](#rule-bud-06), [RULE-BUD-11](#rule-bud-11). Not accepted as support for: [RULE-BUD-13](#rule-bud-13). Not accepted for: data field derived: total_season_budget_usd. <https://ualberta.ca/en/alfresco/uappol/finance/budget-variance-accountability/procedure/budget-variance-accountability-procedure.pdf>
- University of Washington Finance, Management Accounting & Analysis. "Recharge Center Variance Analysis \*ON HOLD". Date: 2014-02-28 (page submission date; page marked ON HOLD, replaced by monthly financial reporting). Data years: n/a. Checker: **verified**. Used by: [RULE-BUD-01](#rule-bud-01), [RULE-BUD-02](#rule-bud-02), [RULE-BUD-03](#rule-bud-03). Data fields: exceptions.js RULES (configuration): budget thresholds (budgetWarn, budgetSerious, warnUsd, seriousUsd, largeUsd, unbudgetedUsd). Metadata: Checker: real title; the page covers UW recharge-center rate reviews and is on hold. <https://finance.uw.edu/maa/node/228>

### Sources recorded only for an integration or data field (no kind recorded) (18)

- Publisher not recorded. "BQA templates (Animal Health Product Inventory/Temperature Logs, VCPR form, Cattle Care Tool Kit)". Date: undated. Data years: not stated. Checker: **verified**. Integrations: BQA record forms and templates (KS-BQA, Oklahoma BQA, Arkansas; BQA templates page). <https://www.bqa.org/resources/templates-assessments>
- Publisher not recorded. "CattleMax herd software (vendor)". Date: undated. Data years: not stated. Checker: **verified**. Integrations: CattleMax herd software (vendor). <https://help.cattlemax.com/article/546-herd-health-preset-treatments-booster-and-withdrawal>
- Cornell Agricultural Workforce Development. "Onboarding Farm Employees". Date: First published 2019-05-10; modified 2026-08-31. Data years: not stated. Checker: **failed**. Not accepted for: data field acknowledgements.csv (shared log): owner (assigned_to), due_by. <https://agworkforce.cals.cornell.edu/onboarding/>
- Publisher not recorded. "Gallagher Satellite Liquid Monitoring (vendor)". Date: undated. Data years: not stated. Checker: **partly**. Integrations: Gallagher Satellite Liquid Monitoring (vendor). <https://am.gallagher.com/Products/liquid-level-monitoring>
- Google. "Make Google Docs, Sheets, Slides & Forms public". Date: undated. Data years: not stated. Checker: **verified**. Integrations: Google Sheets 'Publish to the web' as a read-only shared log. <https://support.google.com/docs/answer/183965>
- Publisher not recorded. "Grass-Cast database (includes Cattle_weight_gains.xlsx, 12 Great Plains sites, 1939-2018)". Date: undated. Data years: not stated. Checker: **partly**. Integrations: Grass-Cast database on Data.gov (ANPP, NDVI, cattle weight gains). Metadata: Checker: covers 'Western U.S. rangelands'; at least one of the 12 points is in Idaho, so not all are Great Plains sites. <https://catalog.data.gov/dataset/grass-cast-database-data-on-aboveground-net-primary-productivity-anpp-climate-data-ndvi-an>
- Publisher not recorded. "iCalendar RFC 5545 VTODO export". Date: undated. Data years: not stated. Checker: **verified**. Integrations: iCalendar RFC 5545 VTODO export. <https://icalendar.org/iCalendar-RFC-5545/3-6-2-to-do-component.html>
- Publisher not recorded. "In-pasture partial-body-weight / walk-over scales (e.g. C-Lock SmartScale)". Date: undated. Data years: not stated. Checker: **verified**. Integrations: In-pasture walk-over scales. <https://cambridge.org/core/journals/animal/article/evaluation-of-remote-monitoring-units-for-estimating-body-weight-and-supplement-intake-of-grazing-cattle/C4A9621209F16D437CCE3202DF41B118>
- Publisher not recorded. "Nebraska Mesonet (NSCO / UNL)". Date: undated. Data years: not stated. Checker: **partly**. Integrations: Nebraska Mesonet. <https://research.unl.edu/blog/nebraska-mesonet-launches-improved-real-time-weather-data/>
- Publisher not recorded. "NOAA NCEI Climate Data Online web services". Date: undated. Data years: not stated. Checker: **verified**. Integrations: NOAA NCEI Climate Data Online web services. <https://www.ncei.noaa.gov/cdo-web/webservices>
- Publisher not recorded. "Not recorded in the research (see checker notes)". Date: undated. Data years: not stated. Checker: **partly**. Data fields: forage_obs.csv: condition_score. <https://www.nrcs.usda.gov/sites/default/files/2023-06/Guide_To_Pasture_Condition_Scoring_JAN2020.pdf>
- Publisher not recorded. "PIR SA water monitoring comparison (agency compilation, Australia)". Date: undated. Data years: not stated. Checker: **verified**. Integrations: PIR SA water monitoring comparison (Australia). <https://pir.sa.gov.au/__data/assets/pdf_file/0009/440559/water-monitoring-comparison.pdf>
- Publisher not recorded. "Rangeland Analysis Platform (via the rapr R package)". Date: undated. Data years: not stated. Checker: **verified**. Integrations: Rangeland Analysis Platform (RAP). <https://ftp.fau.de/cran/web/packages/rapr/readme/README.html>
- Publisher not recorded. "RCC ACIS web services". Date: undated. Data years: not stated. Checker: **unverified**. Integrations: RCC ACIS web services. <https://www.rcc-acis.org/docs_webservices.html>
- Publisher not recorded. "SD Mesonet (South Dakota State University)". Date: undated. Data years: not stated. Checker: **verified**. Integrations: South Dakota Mesonet (SDSU). <https://climate.sdstate.edu/weather>
- Publisher not recorded. "U.S. Drought Monitor". Date: undated. Data years: not stated. Checker: **verified**. Integrations: U.S. Drought Monitor data services (REST statistics). <https://droughtmonitor.unl.edu/Data.aspx>
- Publisher not recorded. "U.S. Drought Monitor statistics". Date: undated. Data years: not stated. Checker: **partly**. Integrations: U.S. Drought Monitor data services (REST statistics). <https://droughtmonitor.unl.edu/DmData/DataDownload/ComprehensiveStatistics.aspx>
- Publisher not recorded. "USDA APHIS Animal Disease Traceability EID rule". Date: undated. Data years: not stated. Checker: **verified**. Data fields: health.csv: animal_ids. Integrations: USDA APHIS Animal Disease Traceability EID rule. <https://www.govinfo.gov/content/pkg/FR-2024-05-09/html/2024-09717.htm>

## Files this document was built from

- `docs/audit/data/rules.json` (rules, classifications, sources, data fields, integrations) and its compact index `rules-index.json`; the split copies `data-fields.json` and `integrations.json` (identical to the registry sections).
- `docs/audit/data/sources.json` (bibliography) and `docs/audit/data/registry-changelog.md` (citation critic pass, 2026-10-16).
- `docs/audit/data/findings.json` and `findings-index.json` (finding IDs and quoted outputs);
  `docs/audit/02-findings.md` section 6 (the rule-to-finding links for current rules).
- `docs/audit/evidence/research_<topic>.json` (feature notes and caveats) and `cite_<topic>.json` (checker results), as referenced by the registry entries.

All ranch data in the repository is fictional (Example Ranch). Health content in this document stays on observation, scheduling, records and escalation to a veterinarian; it gives no diagnosis and no treatment.
