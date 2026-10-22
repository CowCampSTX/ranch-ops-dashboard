<!-- Codex's Checkpoint 1 report on pull request #2, as the owner uploaded it on 2026-10-20. The text below is
unchanged except one edit: the reviewer's local folder path in the last paragraph is replaced with a placeholder,
because it named a personal account. It is a record, so it keeps Codex's own wording and punctuation. -->

# Ranch Ops Dashboard — independent Checkpoint 1 review

Reviewed October 20, 2026. PR: https://github.com/CowCampSTX/ranch-ops-dashboard/pull/2

Head reviewed: `e9d7ab3db5566545c8542425de42291c467c9fc6`. Baseline: `cfd77e50a050163b542cadfc6b38882c0341e99d`. Audit merge: `71f3492ca5b661b8aefca54314ac6f33f13ca745`. PR remained open at the same head at the final check.

**Merge recommendation: READY for PR #2 as a fictional-data visual redesign. No new blocking implementation defect was found in the checks below. Phase 1 implementation: NO-GO until its acceptance contract is reconciled with the redesigned starting point (section 4).** These are separate decisions. Existing rule defects remain intentionally unfixed by this PR.

Review only: no project source edited, commit, push, merge, deployment, or GitHub comment submitted. Execution used temporary copies outside the user's repositories.

## 1. Findings and reproduced checks

“Agree” below means the original finding holds at cfd77e5. It does not mean the redesign still has the original defect. Independent reproductions used new small inputs in `ranch-independent.mjs` and real-browser request interception in `ranch-extra-browser.mjs`, alongside the audit scripts.

| Finding ID | Verdict | Evidence |
|---|---|---|
| LOAD-01 | Agree | Own browser check: header-only water and a 404 body both yield “Water tanks OK / 0 of 0 / 0 need a look.” |
| LOAD-02 | Agree | Aborted water request produces “Failed to fetch,” no rows and empty tiles in the original page. |
| LOAD-03 | Agree | Renaming Yearlings consistently to Steers produces an undefined `adg` error before any original exception rows render. |
| CSV-01 | Agree | A quoted `North, west` field splits into two columns in the independent parser example. |
| CSV-02 | Agree | Empty-delimiter and whitespace rows become extra records, including numeric zero. |
| CSV-03 | Agree | `level` instead of `level_pct`, with a 10% tank, produces no water alert or validation error. |
| CSV-04 | Agree | Blank weight remains an empty string and subtracts as zero. |
| CSV-05 | Agree | Inner cell whitespace remains; parser does not trim individual fields. |
| CSV-06 | Agree | Both tags `007` and `7` become numeric 7; group `2025` becomes a number. |
| DATA-01 | Agree | A current stay in P404 throws while reading the missing pasture's name. |
| DATA-02 | Agree | Due date `2026-09-31` is accepted and shown as due in one day on September 30. |
| WAT-01 | Agree | A latest `ERR` level produces no water row. |
| WAT-02 | Agree, design limitation | Removing every T6 reading leaves seven tanks and no T6 alert. Inventory cannot be reconstructed from readings alone. |
| GAIN-01 | Agree | One weight for an animal throws while reading the second date. |
| GAIN-02 | Agree | Two different weights on the same date produce Infinity ADG. |
| HLTH-01 | Agree | An overdue task with status `OPEN` produces no health row. |
| BUD-01 | Agree | A future $100 budget with $0 actual hides a current $50 overspend on a $100 budget. |
| BUD-02 | Agree | `$150` becomes concatenated `0$150`, then non-finite variance. |
| TIME-02 | Agree | Identical mixed-offset inputs give 22 silent hours under UTC and 27 under America/Chicago. |
| UI-18 | Agree with its cautious “plausible” status | 375 sums the inventory column, but labeling 180 cow-calf pairs as 180 cows obscures calves. 555 is an assumption-dependent alternative, not a verified real inventory. |
| GRZ-05 | Partly agree | The independent arithmetic confirms overlaps and short rests. Those facts do not alone prove that intentional co-grazing is invalid; the example needs explanation or a revised rotation. |
| SEC-01 | Agree; addressed in tested redesign paths | Literal hostile strings survive without executing, in six field types and keyboard readouts. |
| LOAD-04 | Agree; addressed in tested redesign case | Coverage check with T6 outside seven days preserves eight tank cards and the later sections. |
| UI-01 | Agree; addressed in tested paths | Coverage script reaches chart details by Tab and by touch; own keyboard sweep reaches 443 readings. |
| UI-02 | Agree; addressed in tested phone case | Ten first-step cards and Repairs dollars fit at 390px. |
| UI-03 | Agree; addressed in tested case | Coverage measurement reports 11.5px rendered chart text across ten charts. |
| UI-04 | Agree; partly addressed structurally | Well 2/Well 4 counts work, but `tankAlert` still parses a display-subject prefix. Structured refs remain Phase 1 work. |
| UI-05 | Agree; limited coverage | Committed-season months are correct; the coverage script does not test all shifted-season fixtures. |
| UI-07 | Agree; addressed for checked zero and empty cases | On-budget display has 0.0%, no minus zero; selected empty Budget message is correct. |
| UI-08 | Agree; code inspection supports display fix | Rule percentages use `pct`; no separate changed-threshold browser test was run. |
| UI-10 | Agree; addressed | Water chip keeps focus, shows three rows, and Tab advances to Grazing. |
| UI-11 | Agree; addressed for swept keyboard cases | All 443 readings stay within 1280×900 and below the sticky header. This is not a proof for arbitrary-length labels or every pointer location. |
| UI-12 | Agree; addressed in phone case | No overlapping gain labels in the 390px coverage check. |
| UI-14 | Agree; addressed for supplied long names | Labels end before bars; budget category cells fit. |
| UI-15 | Agree; addressed for supplied gap | A 36-hour gap produces two line segments. |
| UI-16 | Agree; addressed | Six flagged yearling dots and reference labels appear. |
| GRZ-06 | Agree; chart-note claim holds | Redesigned card explicitly describes current-stay plan markings. |
| GAIN-13 | Agree; partly addressed | Chart says cows have no target; rules-table/README work remains. |
| GRZ-03 | Agree; display-only fix holds | TBD plan shows No plan; original rule behavior remains. |
| BUD-03 | Agree; display-only fix holds | Table avoids Infinity, but the exception list still contains Infinity for unbudgeted spending, as disclosed. |
| GAIN-04 | Agree with limited redesign claim | Non-number weight case displays Can't tell without NaN; this is not comprehensive numeric validation. |

### Attempts to refute findings

1. **UI-18:** “375 is simply the sum of groups.head.” True, so 555 must not be imposed as fact. The misleading head/pair wording concern survives; retain plausible status.
2. **GRZ-05:** “Groups may intentionally share a pasture, and minimum rest is a plan.” True. Downgrade categorical claims about impossibility; retain the need to explain the fictional schedule and departures from its own plan.
3. **WAT-02:** “A chart only promises to show the readings supplied.” That is a defensible scope limitation, but the whole-operation OK count creates false reassurance. Keep design-limitation status and the inventory requirement.
4. **CSV-02:** “Skipping repeated headers is not required by RFC 4180.” Correct; frame that behavior as a product import policy. The reproduced bogus blank records and misleading output still justify the finding.
5. **TIME-02:** “All committed timestamps are naive and the demo looks the same across zones.” True for the baseline dataset, insufficient for mixed-offset exports. The independent 22-versus-27-hour example confirms the defect.

### Commit hygiene and recorded results

- `git diff --stat cfd77e5 71f3492 -- . ':(exclude)docs/audit'`: empty. Audit merge touched no production files.
- `f9ef651`: app.js, index.html, README.md, docs/screenshot.png, docs/water.png, docs/grazing-gain.png, docs/phone.png only.
- `e9d7ab3`: docs/audit/{07-open-questions.md,08-redesign-coverage.md,CODEX_REVIEW_PROMPT.md,HANDOFF.md,README.md,redesign/coverage.mjs} only.
- Unit tests at PR head and baseline: **8 pass / 0 fail** each.
- Generator at PR head followed by data diff: **no difference**.
- Hand-value script: **85/85 match** using bundled Python. System Python initially lacked tzdata; rerunning with the bundled runtime resolved that environment issue.
- Baseline CSV repro: **66 cases, 8 MATCH / 58 MISMATCH**, exactly the quoted result.
- Baseline rendering repro: **23 cases, 3 MATCH / 20 MISMATCH**.
- Baseline water repro: **9 MATCH / 17 MISMATCH**.
- Baseline gain repro, Node portion: **4 MATCH / 22 MISMATCH**. Its optional Playwright portion was skipped on that invocation because the script defaults to a Linux path. Independent browser and scenario checks were run separately.
- Scenarios, both Node and real-browser modes on baseline: **01 and 02 MATCH; 03–10 MISMATCH**, as documented. A mismatch here reproduces an unfixed defect, not a regression introduced by this PR.
- Redesign coverage: **23 PASS / 0 FAIL**. A scratch copy adapted only dynamic-import path handling for Windows (`pathToFileURL`); no assertion or production source changed.
- Runtime caveat: available Node was **24.19.0**, not the prompt's requested Node 22. No claim of a Node-22-specific run or of remote CI status.

## 2. Citation spot-checks

Twelve sources were opened across all seven requested topics, including two vendor sources. This is a sample, not a revalidation of all 247 entries. “Date unverified” does not mean the citation's date is necessarily wrong.

| Rule ID | Source | Link works? | Claim matches? | Date correct? | Note |
|---|---|---|---|---|---|
| RULE-WAT-06 | [OSU mature-cow water requirements](https://extension.okstate.edu/fact-sheets/estimating-water-requirements-for-mature-beef-cows.html) | Yes, redirect | Yes, context only | July 2017 confirmed; day 1 not established | Requirements vary with size, lactation, environment and feed moisture; no universal tank-percentage alarm. |
| RULE-WAT-09 | [NRCS Watering Facility 614](https://www.nrcs.usda.gov/sites/default/files/2023-08/614_NHCP_CPS_Watering_Facility_2023.pdf) | Yes | Design guidance yes; automatic alarm no | August 2023 confirmed | Discusses considering 3–5 days of extra storage for unreliable power, alongside alternatives. |
| RULE-WAT-04/07 | [Ranchbot delayed monitor](https://intercom.help/ranchbot/en/articles/7944517-what-does-monitor-status-delay-mean) | Yes | Yes | February 16, 2024 confirmed | Vendor explains stale values and delay causes; it does not validate a universal 24-hour ranch alarm. |
| RULE-WAT-01/02/03 | [Ranchbot alert configuration](https://intercom.help/ranchbot/en/articles/8388692-how-to-set-up-water-tank-alerts-notifications) | Yes | Yes | September 20, 2023 confirmed | Configurable vendor examples differ from this demo's values; classification as management choice/demo remains justified. |
| RULE-GRZ-09 | [SDSU grazing readiness](https://extension.sdstate.edu/reading-range-range-readiness-grazing-timing-and-drought-considerations) | Yes | Yes | April 13, 2022 confirmed | Supports native versus tame cool-season leaf-stage distinctions with South Dakota spring/drought context. |
| RULE-GAIN-01/03 | [UNL summer yearling supplementation](https://beef.unl.edu/beefwatch/2022/supplementing-yearlings-summer-grazing-season-it-worth-it) | Yes | Yes, context only | July 1, 2022 confirmed | Seasonal forage/gain discussion supports contextual targets, not an 80% alarm or a universal 2 lb/day target. |
| RULE-HLTH-05 | [UNL pinkeye article](https://beef.unl.edu/beefwatch/2021/do-not-let-pinkeye-decrease-efficiencies-summer-grazing/) | Yes with trailing slash | Yes for observation/seasonality context | August 1, 2021 confirmed | Source contains clinical material; dashboard scope should remain observation and veterinarian escalation. |
| RULE-BUD-04 | [UNL cash-flow budgeting](https://cropwatch.unl.edu/2018/cash-flow-budgeting-farms-and-ranches) | Yes | Yes for actual-versus-plan comparison | January 8, 2018 confirmed | Does not validate 5%/10% alarm bands or the demo's dollar lines. |
| RULE-CTX-15 | [USDM permission](https://droughtmonitor.unl.edu/About/Permission.aspx) | Yes | Attribution requirement yes | Undated; 2026 copyright visible | Current attribution includes NASA. This page does not prescribe fictional-snapshot dates; that is a product choice. |
| RULE-WF-02 | [W3C keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html) | Yes | Yes | Claimed May 11, 2026 update unverified in retrieved text | Keyboard access is supported; no real screen-reader certification was performed. |
| RULE-WF-03 | [W3C hover/focus content](https://www.w3.org/WAI/WCAG22/Understanding/content-on-hover-or-focus.html) | Yes | Yes, including exceptions | Claimed July 12, 2026 update unverified in retrieved text | Dismissible, hoverable, persistent; code having keyboard support alone does not establish complete conformance. |
| RULE-WF-01 | [W3C use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) | Yes | Yes | Claimed September 16, 2025 update unverified in retrieved text | Text and shape should continue accompanying severity colors. |

## 3. Classification disagreements

All 16 requested current operating rules are C or D: WAT-01/02/04 C, WAT-03 D; GRZ-01 C, GRZ-02 D; GAIN-01/02 C, GAIN-03/04/05 D; HLTH-01/02 D, HLTH-03 C; BUD-01/02 D. None is incorrectly promoted to A/B in that set.

Five proposed rules checked:

- **WAT-06 C:** reasonable. Water-demand evidence informs the estimate, but warning thresholds and usable-capacity assumptions remain ranch choices.
- **WAT-07 C:** reasonable. Device intervals and escalation are configurable, not universal livestock guidance.
- **WAT-09 B:** split the statement. B is defensible for contextual infrastructure planning; the proposed automatic “below 3 days” alarm should be **C**, since the cited standard offers design considerations and alternatives, not that operating alarm. Its existing note already acknowledges this distinction; the main rule should match it.
- **GRZ-09 B:** retain only with the named native/tame species and South Dakota spring context. Do not turn the leaf stages into a universal calendar-day move rule.
- **GAIN-07 C:** retain. The 21/42-day implementation choices are explicit demo settings; the specification must not imply that they are validated by the research discussing longer intervals.

No exhaustive classification opinion is offered for the other proposed rules.

## 4. Roadmap and specification issues

### Required before Phase 1 starts

**R1 — Reconcile the Phase 1 exclusions with the required redesigned starting point.**

- `docs/audit/HANDOFF.md`, “Read this first,” says to start from redesigned app.js and preserve its keyboard/touch readouts.
- `docs/audit/06-phase1-spec.md` §1.2 (around line 79) and §14 (around lines 1631–1637) exclude keyboard/touch details, phone layouts, flagged-animal marks, outage gaps and tooltip fixes as later-phase features. Several are already in the required baseline.
- Checkpoint 2 also instructs reviewers to flag Phase 2 features. This leaves a future implementer/reviewer with contradictory scope rules.
- **Fix:** explicitly grandfather the redesign's existing behavior, require its preservation, and identify only the remaining enhancements as deferred. Update the specification, roadmap/build order and implementation review prompt together. Do not remove useful accessibility features to satisfy outdated exclusions.

**R2 — Replace obsolete UI acceptance requirements with equivalent redesigned-page checks.**

- `06-phase1-spec.md` §12, P1-13.4/.6 and P1-14.5/.7 (around lines 1496–1526) still require `#water .mini`, `#budgetChart svg`, hovering a budget chart, a seven-row budget table, and fixed x bounds 74..550.
- The redesign uses `#tanks .tank`, removes the standalone budget chart in favor of a table, adds a totals row, and draws at actual widths. These are not merely shifted source line numbers. Several criteria cannot pass literally while retaining the required redesign.
- `08-redesign-coverage.md` §5 provides helpful mappings for old diagnostics, but does not rewrite the normative acceptance requirements.
- **Fix:** map each criterion to current semantics and selectors, explicitly test Repairs in its table, assert table body versus total rows separately, and replace fixed-coordinate checks with responsive bounds. Preserve intended values and security coverage. Then use those revised criteria for implementation PRs.

### Non-blocking refinements

**R3 — Complete the intentional-differences inventory.** `08-redesign-coverage.md` §4 says it lists every expected difference, but the redesign additionally displays “Grazing 3 of 8 pastures” in the head tile and adds a season-total budget row ($88,400 / $89,303 / +$903). These are correct derived additions, not altered old results. Add them to the table, and describe “same underlying values” rather than implying exactly the same set of displayed numbers.

**R4 — Specify the zero-head gain case.** §3.4 permits head = 0, while §5.4 uses a minimum session of one animal and `matched / head`. If historical weights remain for a zero-head group, the written algorithm can evaluate infinite coverage and still judge gain. Define no-current-head versus inconsistent-record behavior and test it. This is a specification gap, not a demonstrated new PR regression.

**R5 — Make diagnostic prerequisites portable.** The coverage script's filesystem-path import needs `pathToFileURL` on Windows; the hand-value script needs IANA tzdata. Document those prerequisites and report environment failures separately from product failures.

Coverage check: all **55 Phase 1 findings map exactly once** in roadmap §3.4; no omissions or duplicates found. D1/D2/D5/D6/D9/D16 and scenario §11.2 explicitly describe the changed closed-month, drop, interval, coverage and weigh-basis conventions; those differences are not undisclosed contradictions. Scenario-input updates remain necessary before applying the proposed engine. No hidden requirement for live integrations, shared storage, ROI calculations, or a backend was found in the reviewed Phase 1 contract.

The audit's two-minute workflow is explicitly a design target, not a tested claim. Fictional-data and non-production-ready qualifications are consistent in the reviewed deliverables. Clinical instructions appearing in cited source material are not implementation permission; proposed health behavior stays focused on records, observation and escalation.

## 5. Redesign verification

**Existing numbers identical: yes, in the compared committed-data outputs.**

- All ten exception rows match word for word, cell for cell, including severity and action, at both 1280×900 and 390×844.
- Counts: 10 total; 2 critical, 6 serious, 2 warning. Area counts 10/3/1/2/2/2.
- Head 375; water 5 of 8 with 3 needing a look; yearling gain 1.94 versus target 2.0; spending +1.0%, $89,303 against $88,400.
- Same as-of date/time and 4,300-acre/eight-pasture values; only presentation changes. Chart headings match.
- Six category budget/actual/difference amounts match; the added totals row is correct (see R3).
- T4 latest reading 10% at Sep 30, 6 PM; H026 0.11 lb/day, Jul 20–Sep 15, current 1,136 lb; Repairs $7,200/$9,000/+$1,800; current Yearlings Sand Hills stay 24 days against 21 planned, 3 days over.
- No console errors, page errors or failed requests on either committed-data page at the two requested widths. No whole-page horizontal overflow. Phone screenshot inspected.
- Independent keyboard sweep: **443 readings, zero outside the viewport/header bounds**.

**Escaping:** six independent data-interception cases used a combined `<img ... onerror>`, `<b>x</b>` and `<A` payload in pasture name, tank ID, ear tag, group, health task and budget category. No script flag or injected image appeared; literal text was present in the relevant rendered locations. Pasture/tank/tag/group payloads also appeared literally in keyboard chart details; health and budget have no chart readout to exercise. Source inspection of dynamic HTML paths supports the escaping results. Ear tags are exposed through chart details rather than always-visible page text. Standard touch access passed the coverage script; the full six-field hostile matrix was not separately repeated using touch gestures.

**08 coverage claims:** the 23 checks accurately exercise their named narrow cases, but are not full acceptance coverage. In particular UI-05 tests only the existing season, UI-07 does not itself test all-clear All, UI-08 is code reading, UI-11 depends on a separate sweep, UI-17's large-overrun cases remain unrun, and invalid-data display guards do not fix rule conclusions. Section 08 appropriately labels most of these limitations. Preserve that distinction in merge notes.

## 6. New issues outside the findings registry

R1/R2 are newly identified documentation-contract problems introduced by combining the original Phase 1 plan with the redesigned baseline. R3 is an incomplete PR verification inventory. R4 is a future-model boundary gap. R5 is review-script portability. Reproduction details are in section 4.

No additional production-code defect requiring PR #2 to be held was established. This does not certify real-data readiness, full WCAG conformance, real phones, screen readers, WebKit/Firefox, arbitrary datasets, all seven reported browser zones, or every source in the bibliography.

## 7. Verdict and handoff

**PR #2: READY to merge as the visual redesign of the fictional demo.** The rules/data were not changed, baseline values remain intact, and the tested presentation/security behavior improves. Existing audit defects remain Phase 1 work.

**Phase 1: NO-GO until R1 and R2 are corrected.** A small documentation follow-up can establish the new acceptance contract before implementation; it need not delay merging this UI-only baseline. R3–R5 are recommendations to include in that follow-up, with R4 resolved before implementing gain logic.

Suggested message to Claude:

> Codex reviewed PR #2 at e9d7ab3. The visual redesign is ready to merge; Phase 1 must first reconcile its specification with that baseline. Update 06 §§1.2/14 and Checkpoint 2 to preserve already-implemented keyboard/touch, phone, chart and tooltip behavior. Rewrite P1-13/P1-14 browser criteria for #tanks .tank, the integrated budget table and responsive coordinates, preserving all values/security assertions. Add the new grazing-count and budget-total displays to 08 §4. Define the zero-head gain case and document Windows review prerequisites. Keep this as a documentation follow-up, then bring the reconciled contract back for review before implementing Phase 1.

Scratch evidence is in `[local temporary folder on the reviewer's machine]`: ranch-independent.mjs/.txt, ranch-browser.mjs, ranch-browser-results.json, ranch-browser.txt, ranch-extra-browser.mjs/.txt, ranch-coverage.mjs/.txt, ranch-baseline-tests.txt, ranch-csv.txt, ranch-render.txt, ranch-water.txt, ranch-gain.txt, ranch-scenarios.txt and ranch-scenarios-browser.txt. Temporary review checkouts are ranch-ops-review-20261020 and ranch-ops-baseline-20261020. Evidence is local and was not published.
