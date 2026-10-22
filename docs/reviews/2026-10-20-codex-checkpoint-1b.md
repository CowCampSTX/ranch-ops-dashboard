<!-- Codex's Checkpoint 1b report on pull request #3, as the owner pasted it on 2026-10-20. The text below is
unchanged except that the reviewer's local folder and program paths in section 2 and section 6 are replaced with
placeholders in square brackets, because they named a personal account. It is a record, so it keeps Codex's own
wording and punctuation. -->

# Ranch Ops Dashboard: Checkpoint 1b review

Reviewed 2026-10-20, Windows, Node 24.19.0, Playwright Chromium. PR: https://github.com/CowCampSTX/ranch-ops-dashboard/pull/3

Base: 0315d09b2ddcb33eebfb1c5009c0e1ed1e9ccc9f. Reviewed head: fc2328e3a9b265124573f79766117ac4888b143c. The initial snapshot was 7ef6bc0; the later changes through fc2328e affect only AGENTS.md and docs/README.md and were reviewed separately. Page files and both browser scripts are unchanged between these snapshots. This is a specification review, not verification of a Phase 1 implementation. No repository file was edited; no commit, push, merge, deployment or external message was made. All reports and probes were written outside the repository.

## 1. R1 to R5

| Request | Result | Location and reason |
|---|---|---|
| R1 | Resolved | 06 sections 1.2, 6.3, 14 and 15; 05 sections 2 and 4; 04 redesign notes; HANDOFF; Checkpoint 2 tasks 1-2. Existing keyboard, touch, phone, responsive-chart and tank/table behavior is explicitly retained. Only remaining enhancements are deferred. Removal or weakening is blocking. Colour-only marks are known defects, with an explicit exception allowing KEEP-24 to change when fixed. |
| R2 | Resolved | 06 sections 11.4 and 12; 05 section 3.2. Tank cards, integrated budget table and responsive chart geometry replace retired controls. Expected future Phase 1 text remains an expectation, not a claim about today's page. |
| R3 | Resolved | 08 section 4; audit README, HANDOFF and review prompt. The claim is now about the same underlying values. The differences table includes the grazing-pasture count, season total, head counts, planned moves, tooltip wording and the gain flag distinction. |
| R4 | Resolved | 06 section 5.4 steps 2, 8-9, section 15; P1-10.7-12, P1-14.8 and P1-02.10. Head zero with recent weights is CAN'T TELL; without recent weights it is not judged. Blank head, zero matches, excess matches and the inclusive 45-day boundary are specified. No new head-count gate fires on the committed data. |
| R5 | Resolved | audit README, “Before running the review scripts”; both redesign scripts' imports. Node/Python/Playwright, Windows file URLs and tzdata prerequisites are documented. Both scripts successfully load Playwright from a native Windows path without source edits. |

## 2. Commands and results

Commands ran from the scratch checkout at [a temporary folder on the reviewer's machine] unless stated otherwise. PY below is [the reviewer's bundled Python executable]. PLAYWRIGHT_MODULE was set to [the reviewer's bundled Playwright index.mjs] and PLAYWRIGHT_BROWSERS_PATH to [a temporary browser folder on the reviewer's machine].

| Command or check | Result |
|---|---|
| git fetch origin main claude/project-thread-nu46kf; checkout detached PR head | Reviewed the PR snapshot, then its two-file documentation follow-up. |
| git diff --stat 0315d09...HEAD -- index.html app.js exceptions.js data scripts tests .github | Empty. No page, data, generator, application test or CI changes. |
| git diff --name-status 0315d09...HEAD | Only the permitted root files and docs files; four screenshot moves are R100. See file inventory below. |
| git diff 0315d09...HEAD -- docs/audit/05-roadmap.md docs/audit/06-phase1-spec.md | Compared changed criteria with their former text; results in section 3. |
| node --test tests/exceptions.test.mjs | 8 passed, 0 failed. |
| node --test tests/*.mjs | AGENTS command also runs on this Windows setup: 8 passed, 0 failed. |
| node docs/audit/redesign/coverage.mjs 8833 | 23 PASS, 0 FAIL. No script changes. |
| node docs/audit/redesign/preserve.mjs http://localhost:8766/ | Incomplete due connection refusal; environment details below. |
| node docs/audit/redesign/preserve.mjs http://127.0.0.1:8766/ | Incomplete due another connection refusal; environment details below. |
| node checkpoint1b-server.mjs (scratch wrapper) | 34 PASS, 0 FAIL in 127 seconds. The wrapper served the scratch checkout on IPv4 and invoked the unmodified preserve.mjs. |
| node checkpoint1b-selectors.mjs | Browser probe ran with Node: all 28 extracted current-page ID-based selectors matched at 1280x900 and 390x844 with touch. Existing classes, chart elements and interactions were also checked by reading app.js and the preserve suite. |
| PY checkpoint1b-links.py | 27 Markdown relative links in AGENTS.md, CLAUDE.md, README.md and docs/README.md: no missing file or anchor. CLAUDE.md's @AGENTS.md import resolves. Four README image targets exist, including the HTML img target; renames preserve image bytes. |
| PY checkpoint1b-generator.py | Copied the generator to an outside scratch directory, generated all 8 CSVs there and compared bytes: 0 mismatches. Did not run the write-producing generator in the repository. |
| git status --short | Scratch checkout clean after the checks. |
| Open public Pages and private Drive links | Can't verify either external destination through the available web tool; both returned “not accessible via this tool.” No claim that either link is broken. |

Scope inventory (paths relative to the repository):

- Root: .gitignore, AGENTS.md, CLAUDE.md, README.md.
- docs/README.md.
- docs/audit/01-baseline.md, 04-workflow-and-features.md, 05-roadmap.md, 06-phase1-spec.md, 07-open-questions.md, 08-redesign-coverage.md, CODEX_REVIEW_PROMPT.md, HANDOFF.md, README.md.
- docs/audit/redesign/coverage.mjs and preserve.mjs. These are explicitly permitted review helpers under docs, not production script changes.
- docs/project/DECISIONS.md and STATUS.md.
- docs/reviews/2026-10-20-codex-checkpoint-1.md and README.md.
- docs/{grazing-gain,phone,screenshot,water}.png moved unchanged to docs/screenshots/.

### What each preserve check actually verifies

These checks match the corresponding section 6.3 claims within their sampled fixtures. Passing them is not proof of every possible input, assistive technology or device. Section 6.3 explicitly lists retained behavior without preserve assertions; those omissions are acknowledged, not concealed.

| Check | Assertion inspected |
|---|---|
| KEEP-01 | Ten labelled/described charts reached by Tab in order; an empty-window tank chart loses its tab stop. |
| KEEP-02 | Focus opens a value-first live readout with a highlight; tanks open at the latest reading. |
| KEEP-03 | Keyboard navigation, row changes and Home/End behavior without unwanted scrolling. |
| KEEP-04 | Escape hides readout and highlight while preserving focus; moving off hides it. |
| KEEP-05 | Sweeps 443 readings at desktop, 390 and 320 widths; checks readout bounds, sticky-bar clearance and visible marks. |
| KEEP-06 | Touch sample on each chart type, sliding on a tank chart, outside dismissal and pan-y. Not every individual point tapped. |
| KEEP-07 | Hover sample on each chart type, pointer departure, Escape and focus retention. |
| KEEP-08 | Phone row cards, cell visibility and order at 390/320; desktop table contrast. |
| KEEP-09 | Overflow at 33 committed-data widths plus four widths for long-name and limited hostile fixtures. Not every hostile category. |
| KEEP-10 | Phone budget cell visibility, amounts and card/window bounds; padding intrusion is reported separately. |
| KEEP-11 | Four tiles, desktop/phone arrangement, contents and one accessible status icon per tank. |
| KEEP-12 | Phone nav/chip/toggle target sizes and rules disclosure; no full desktop target-size audit. |
| KEEP-13 | Cards per tank, state ordering, icon/word pills, levels, timestamps and one chart per card. |
| KEEP-14 | Category/total table structure, signed bar direction and label bounds. No zero-difference fixture here. |
| KEEP-15 | Budget table flags agree with exception-row severity and text. |
| KEEP-16 | Total budget, actual and difference equal the row sums. |
| KEEP-17 | Legend names flagged states with icons and matches the neutral key. |
| KEEP-18 | Zero-budget fixtures have no NaN/Infinity in text/attributes and fit labels. |
| KEEP-19 | ViewBox tracks rendered width at five sampled widths from 320 to 1920. |
| KEEP-20 | Resize redraws charts while retaining focus/readout or dismissed state. |
| KEEP-21 | Rendered chart labels are at least 11 px at the sampled widths. |
| KEEP-22 | Label overlaps and long grazing-name bounds. Ellipsis itself is not asserted. |
| KEEP-23 | Sensor gap creates two paths; 12 hours stays joined and 18 hours splits. |
| KEEP-24 | Flagged dot count, corresponding keyboard readings, icon/word flag and legend colour agree. Does not independently assert every reference line, note or grazing decoration. |
| KEEP-25 | Delayed-data loading message, absence of premature zero/clear counts, then populated page. |
| KEEP-26 | Failure message replaces loading/blank page. Retry-button and uncaught-error counts are reported, not gates. P1-06 strengthens these separately. |
| KEEP-27 | Injected DOM failures isolate seven renderer sections and do not leak page errors. |
| KEEP-28 | Six hostile field types remain literal in the relevant DOM/readouts; no injected elements, event attributes or script flags. Keyboard sweep, not full three-input-method coverage; P1-13 adds that. |
| KEEP-29 | Sampled Tab stops have 2 px outlines and are visible at desktop/phone sizes. |
| KEEP-30 | Reduced motion disables entrance/shimmer/smooth scrolling. Forced-colors styles are not asserted. |
| KEEP-31 | Water/Grazing/All chip interaction preserves focus, selected state and row counts. Group accessible label is not asserted. |
| KEEP-32 | Skip link, section links, sticky bar and sampled current-link behavior. Side-by-side Grazing/Gain active-link ambiguity is disclosed. |
| KEEP-33 | Existing pills and severity badges have an SVG and nonempty word. Does not assert future CAN'T TELL shapes. |
| KEEP-34 | Readout follows its point on scroll, hides under the bar and returns with focus retained. |

## 3. Lost values, security assertions and missing selectors

No unexplained loss of a required numeric value or escaping/no-injection assertion found in the changed Phase 1 acceptance criteria.

| Changed criteria | Comparison with base |
|---|---|
| 11.4.1-6 | Original row count, amounts, loading/error/security and locale checks retained; detailed keyboard/touch/phone checks added. Obsolete budget SVG becomes the table. |
| P1-02.6, .10-.11 | Ten rows, 330 known head, missing-head verdict and 4,100 acres retained. The optional “+ ?” display is explicitly explained. |
| P1-03.15; P1-04.3 | As-of/timezone wording preserved. Budget chart existence becomes table structure with 6 categories and a total. |
| P1-06.1-.3, .5-.6, .8-.10 | File names, 8 unaffected rows, no 0-of-0/NaN, loading delay and zero page errors retained or strengthened. Chip badge asserts can't tell directly. |
| P1-07.11 | No T2 row, 5 of 7 and out-of-service text retained; text moves to its tank card. |
| P1-08.6-.7 | 22 valid stays, finite geometry and as-of clipping retained. Future planned shading is distinguished from actual stay bars. |
| P1-09.5; P1-10.1-.2 | Seven gridlines and existing figures/verdicts retained; gridline selectors made explicit. |
| P1-10.7-.12; P1-14.8 | New head-zero/blank/excess/zero-match cases, not deletion of existing criteria. Derived row-count changes follow the specified rule replacements. |
| P1-12.6 | No NaN/Infinity now checked on table text and attributes. Repairs stays +25.0%, although today's page says +25%. |
| P1-13.1-.6 | Literal escaped payloads, script flags and exact T4 subject retained; mouse/keyboard/touch expanded. Budget payload assertion moves to the visible table. Correct RFC quoting of the old hostile fixture is explained. |
| P1-14.2-.7 | 10/7 rows, 198/222 hours, 5 of 8, 0 of 2 and month sets retained. No-weigh-ins wording becomes the reason under Can't tell. Responsive bounds replace 74..550. Narrow-card empty wording and clipping of an unfittable month label are explicitly explained. |
| P1-15.3, .5, .7; P1-16.2, .4 | Dollar totals, on-budget wording, forbidden-number patterns and Sensors normal preserved; hidden rules text and keyboard readouts explicitly included. |
| 05 section 3.2 | Headline criteria agree with these replacements. Later-phase criteria distinguish regression checks from newly required work. |

The existing-page selectors tested all matched. Retired #water .mini and #budgetChart references occur only in explanatory old-to-new mappings. The banner, data checks panel, Show notes button, new CAN'T TELL markers, generated RULE_INFO rows, Sensors normal label, updated timestamp and +25.0% label are defined future Phase 1 outputs. They are not missing-main defects. Hidden #stamp and rules content still exist in the phone DOM; the criteria account for their visibility.

## 4. Contradictions and ambiguities

No blocking contradiction remains in the Phase 1 preservation/defer rules, chip counts, tile placement or zero-head expectations. Checkpoint 2 now scopes finished-Phase-1 obligations to work already delivered, so early PRs do not need to implement later steps merely to pass review.

Non-blocking documentation inconsistencies:

1. 04-workflow-and-features.md:54 and 05-roadmap.md:26 still say there is no AGENTS.md “in the repository.” This disagrees with root AGENTS.md, 06:17 and HANDOFF:13-14. Change those metadata rows to “at the reviewed commit cfd77e5” and link current guidance. The surrounding historical framing makes the intended meaning recoverable.
2. 06:2027-2028 calls the redesign review “not in this repository,” but docs/reviews/2026-10-20-codex-checkpoint-1.md is now included. Link the saved report, and identify any different review intended by that statement.
3. AGENTS.md:122 and :126-128 universally require saving reviews in the repository and pushing/saving work before session end. The checkpoint review prompt explicitly prohibits repository edits/pushes and requires scratch output. The owner's explicit review instructions take precedence, which is what this review follows. Add an explicit reviewer exception and describe who copies an approved review into docs/reviews, so both agents use the same handoff rule.
4. STATUS.md “Next, in order” puts the redesign follow-up before Phase 1. HANDOFF “Starting point” and 06 section 15 describe main after the docs PR with page files at 0315d09. Treat 0315d09 as the reviewed preservation baseline, not a requirement to discard the follow-up when branching from newer main. Update these baseline/status descriptions when that follow-up merges.

## 5. Other issues

BLOCKING: none found in the reviewed documentation changes.

NON-BLOCKING:

- The preservation suite intentionally does not assert every listed retained detail. In particular reference lines, some grazing decorations, retry-button presence, forced-colors styling and on-budget no-bar behavior need manual review or added regression coverage when affected. Section 6.3 already discloses these limits; do not equate 34 passes with complete accessibility coverage.
- The known colour-only marks, hostile long-category phone overflow and missing no-weigh-in note remain separate follow-up work. They are documented defects, not newly introduced by PR #3 or requirements to preserve the defect.
- No new production-ready or validated-threshold claim found. Two-minute workflow references are expressly untested design targets, not measured completion times. The changed health guidance stays on observations, records and veterinarian escalation. No dose or treatment protocol was added.
- Measurements in the changed spec/coverage descriptions identify the main commit, date, Chromium and viewport context. Historical audit measurements remain attributed to cfd77e5. Real phones, screen readers, Firefox and WebKit remain untested here. Private Drive contents and synchronization cannot be verified through the tools used in this review.

## 6. Environment problems and adaptations

These are not findings against the page or documents.

- python3 --version could not launch the WindowsApps python3.exe alias: “The file cannot be accessed by the system.” Consequently the exact python3 server and generator commands cannot run in this setup. Used the bundled Python executable for the initial server and scratch generator comparison. No Python packages were installed.
- node --version is v24.19.0, not the requested CI version 22. Tests were run on Node 24; can't verify Node 22 results in this session.
- The first preserve invocation against localhost:8766 terminated with route.fetch ECONNREFUSED ::1:8766. The server was bound to IPv4. Changed only the URL to 127.0.0.1.
- The IPv4 retry also terminated with route.fetch ECONNREFUSED 127.0.0.1:8766 during water.csv loading. The Python process was still running; the exact cause of this second intermittent refusal was not established. Used an outside-repository Node static-server wrapper on 127.0.0.1:8767, running the repository's preserve.mjs unchanged.
- Browser/server commands required execution outside the network-restricted sandbox. This changes execution permissions, not assertions.
- The first scratch generator wrapper encountered WinError 5 while making scripts/ under the sandbox-specific temporary directory. Set its scratch parent to [an explicit temporary directory on the reviewer's machine], then it completed with eight byte-identical files.
- The write-producing command python3 scripts/generate_data.py && git diff --exit-code data/ was not run as written because this task forbids editing repository files. The outside-repository regeneration and byte comparison verifies the same data invariant without a repository write.
- Web opens of the Pages and private Drive URLs returned “not accessible via this tool.” Can't verify those remote links or Drive copies. Localhost URLs are local-server instructions, not permanent external links.

## 7. Verdict

GO for starting Phase 1 after the owner merges PR #3, following the project status order for the separate redesign follow-up. R1-R5 are resolved. No blocking documentation issue found. The final GitHub check confirmed PR #3 is open, unmerged and mergeable at fc2328e, with base 0315d09. All 34 preserve checks, 23 coverage checks and 8 unit tests passed in this Windows/Node 24/Chromium review. Results do not establish Node 22 or other-browser behavior.

The owner merges. This report does not authorize a production deployment or certify Phase 1 as implemented. The dashboard remains a fictional portfolio demonstration.
