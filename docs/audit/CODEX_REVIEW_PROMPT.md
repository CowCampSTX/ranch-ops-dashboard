# Codex review prompts

Two ready-to-paste prompts that ask OpenAI Codex to act as an independent reviewer of this work.

**When to use them.** Use Checkpoint 1 once, now, before anyone changes the dashboard's code: it asks Codex to
double-check this audit and the redesign and to say whether Phase 1 can start. Use Checkpoint 2 every time a pull
request that changes the dashboard's code is ready, before you merge it.

How to use: copy everything inside the grey box, paste it into Codex, and replace the text in square brackets with the
pull request link. Codex only reviews. It must not merge, deploy, push or edit the dashboard's files; you decide what
happens next.

**About the redesign.** The audit was merged into main in pull request #1 (merge commit `71f3492`). A second pull
request (#2) carries the visual redesign the owner asked for. It replaces `index.html` and `app.js`, the README's chart
text and the screenshots in `docs/`: black background, green accent, charts drawn at their real width, keyboard and
touch chart reading, phone layouts. `exceptions.js`, `data/`, `tests/` and `scripts/` are unchanged by it, and every
number on the page is meant to stay identical. Line numbers in the findings refer to the reviewed commit `cfd77e5`,
not to the redesign. [08-redesign-coverage.md](08-redesign-coverage.md) maps which findings the redesign already
addresses. Checkpoint 1 reviews the audit and the redesign pull request; Phase 1 work starts from the redesigned
`app.js`. Paste the link to pull request #2 into Checkpoint 1.

## Checkpoint 1: audit review, before any production code

```text
You are an independent reviewer. This is a REVIEW ONLY task.
Do not merge, deploy, commit or push to any branch (main included). Do not edit any production file:
index.html, app.js, exceptions.js, data/, scripts/, tests/, README.md, .github/. Use a scratch folder outside the
repository for anything you write. If you cannot run or reach something, say "can't verify" and why; do not guess.

REPOSITORY: CowCampSTX/ranch-ops-dashboard
PULL REQUEST: [paste the link to the redesign pull request, #2, here]. It is the open pull request from branch
claude/project-thread-nu46kf into main (gh pr list --head claude/project-thread-nu46kf).
REVIEWED COMMIT: cfd77e50a050163b542cadfc6b38882c0341e99d ("cfd77e5"), the code the audit reviewed.
AUDIT MERGED: pull request #1, merge commit 71f3492 on main.

WHAT THE PROJECT IS: a static ranch operations dashboard (plain HTML and JavaScript ES modules, no build step) that
answers "What needs my attention today, why, and what should happen next?". It is a portfolio demonstration on
FICTIONAL data (Example Ranch). It is NOT production-ready. Every threshold in it (25%/40% tank level, 30-point drop
in 24 h, 24 h sensor silence, planned graze days, 2-day grace, 80%/50% of target gain, 2.0/1.0 lb/day targets,
7 days to due, 5%/10% over budget) is a demonstration setting or ranch choice, not validated guidance.

WHAT TO REVIEW:
1. The audit under docs/audit/, already on main (pull request #1). Start at docs/audit/README.md. Deliverables: 01-baseline.md (current state and test
   results), 02-findings.md (83 findings with stable IDs such as LOAD-01; the registry is data/findings.json),
   03-research-and-data.md (98 rules classed A-D, 247 sources), 04-workflow-and-features.md, 05-roadmap.md (work items
   P1-01..P1-17, P2-01..P2-11, P3-01..P3-03; decisions D1-D16), 06-phase1-spec.md (Phase 1 specification; acceptance
   criteria in section 12), 07-open-questions.md, HANDOFF.md. Supporting: evidence/ (raw audit, skeptic, research and
   citation-check records), diagnostics/ (repro scripts), scenarios/ (10 fictional data sets with expected.json).
   Classes: A supported general guidance; B context-dependent guidance; C ranch-specific management choice;
   D synthetic demonstration setting.
2. Pull request #2, with two kinds of commit. The redesign commit replaces index.html and app.js, the README's chart
   text and the screenshots docs/screenshot.png, docs/water.png, docs/grazing-gain.png and the new docs/phone.png:
   black background, green accent, charts drawn at their real width, keyboard/touch chart reading, phone layouts.
   exceptions.js, data/, tests/ and scripts/ are meant to be unchanged by it, and every number on the page is meant
   to stay identical. The docs commit adds docs/audit/08-redesign-coverage.md (which findings the redesign claims to
   address) and docs/audit/redesign/coverage.mjs, and updates the audit's README, HANDOFF.md, 07-open-questions.md
   and this prompt to say the redesign is in #2.
IMPORTANT: app.js and index.html line numbers in the findings refer to cfd77e5, not to the redesign.

SETUP: Node 22 and python3; Playwright with Chromium for browser scripts. Run commands from the repository root.
To reproduce findings exactly as recorded at cfd77e5, use an extracted copy (the scripts locate the code relative to
their own folder):
    REF=$(mktemp -d); git archive cfd77e5 | tar -x -C "$REF"
    mkdir -p "$REF/docs" && cp -r docs/audit "$REF/docs/audit" && cd "$REF"
Node-only scripts that import only exceptions.js should give the same results at the pull request head. The browser
scripts were written for cfd77e5's page; on the redesign they may need selectors adapted, so a script that cannot find
an element on the redesign is not evidence either way.

TASKS
A. Commit hygiene. Confirm that the merged audit changed nothing outside docs/audit/
   (git diff --stat cfd77e5 71f3492 -- . ':(exclude)docs/audit' prints nothing). List pull request #2's commits and
   the files each one touches. Confirm that the redesign commit touches only index.html, app.js, README.md and
   docs/*.png, and that every other commit touches only docs/audit/. Flag anything else, especially any change to
   exceptions.js, data/, tests/, scripts/ or .github/.
B. Re-run the recorded checks and compare with what the documents quote:
   - node --test tests/exceptions.test.mjs (recorded: 8 pass, 0 fail), at the pull request head and in $REF;
   - python3 scripts/generate_data.py && git diff --exit-code data/ (recorded: no difference);
   - python3 -I docs/audit/diagnostics/findings.handvalues.py (recorded: "85 of 85 checks match");
   - at least four of docs/audit/diagnostics/*.repro.mjs in $REF, including csv.repro.mjs (recorded: "66 cases:
     8 MATCH, 58 MISMATCH") and render.repro.mjs; a MISMATCH means the defect is present;
   - node docs/audit/diagnostics/scenarios.run.mjs (recorded: 01 and 02 MATCH, 03 to 10 MISMATCH; see
     docs/audit/scenarios/run-output.txt), and with --browser if Playwright is available.
   Report every output that differs from the documents.
C. Independently reproduce the high-severity findings at cfd77e5, with your own minimal inputs where you can, not only
   the audit's scripts: LOAD-01, LOAD-02, LOAD-03, CSV-01, CSV-02, CSV-03, CSV-04, CSV-05, CSV-06, DATA-01, DATA-02,
   WAT-01, WAT-02, GAIN-01, GAIN-02, HLTH-01, BUD-01, BUD-02. If time is short, do at least ten and say which.
D. Try to refute at least five findings. Pick the ones you doubt most (for example a design limitation, the plausible
   UI-18, or a medium time-zone finding). Make the strongest case that each is wrong, overstated, mis-graded or a
   duplicate, then say whether that case holds.
E. Spot-check at least ten citations in docs/audit/03-research-and-data.md, spread across water, grazing, gain,
   health, budget, context and workflow, including at least two vendor sources. For each: does the link work, does
   the page support the claim as the entry states it, and is the publication date right? The audit read pages through
   a summarising fetch tool, so check quotes against the source itself where you can.
F. Check the A/B/C/D classes: every current threshold rule (RULE-WAT-01 to -04, RULE-GRZ-01 and -02, RULE-GAIN-01 to
   -05, RULE-HLTH-01 to -03, RULE-BUD-01 and -02) and at least five proposed rules. Flag any number shown as A or B
   without a source that names the cattle class, season and region, and any class you would make stricter.
G. Check docs/audit/05-roadmap.md and docs/audit/06-phase1-spec.md for: contradictions (between 05 and 06, with
   02-findings.md, with decisions D1-D16, and with scenarios/*/expected.json and scenarios/settings.json); Phase 1
   findings not covered by exactly one P1 item (05 section 3.4); acceptance criteria in 06 section 12 that cannot be
   tested as written; any Phase 1 requirement that depends on a Phase 2 or Phase 3 feature.
H. Check claims across docs/audit/: nothing says the dashboard is production-ready, that a threshold is validated, that
   the morning review takes two minutes, or that Example Ranch is real; health text stays on observation, scheduling,
   records and calling the veterinarian, with no diagnosis, treatment or dose; no investment or ROI economics.
I. Review the redesign on its own:
   - Run node docs/audit/redesign/coverage.mjs at the pull request head (recorded: 23 PASS, 0 FAIL) and say whether
     each check tests what docs/audit/08-redesign-coverage.md says it tests.
   - Numbers identical. Serve $REF and the pull request head on two ports
     (python3 -m http.server PORT --bind 127.0.0.1 --directory DIR) and compare on the committed data: the as-of line;
     the tiles (recorded at cfd77e5: "Needs attention 10" with 2 critical, 6 serious, 2 warning; "Head on grass 375";
     "Water tanks OK 5 of 8"; "Yearling gain 1.94 lbs/day"; "Spend vs budget +1.0%"); the filter chip counts ("All (10)",
     "Water (3)", "Grazing (1)", "Gain (2)", "Health (2)", "Budget (2)"); the 10 exception rows word for word; the
     budget table; the chart headings; and the chart details for T4, animal H026, Repairs and the Yearlings' Sand Hills
     stay (recorded: "Sep 30, 6 PM: 10%"; "0.11 lbs/day, Jul 20 to Sep 15 / Now 1136 lbs"; "Budget $7,200 / Actual
     $9,000 / Over by $1,800"; "Sep 6 to now (24 days) / Plan: 21 days"). The redesign changes the wording, order
     and layout of some of these on purpose; 08 section 4 lists every intended difference. Any number that differs,
     or any difference not in that list, is a finding.
   - No new console errors, page errors or failed requests at 1280x900 and 390x844 (recorded at cfd77e5: none).
   - CSV text escaped. In a copy of the site (or with request interception), put <img src=x onerror="window.__xss=1">,
     <b>x</b> and a plain "<A" into a pasture name, tank ID, ear tag, group, health task and budget category. Check
     every place the redesign shows them, including the keyboard and touch chart readouts: no injected element,
     window.__xss not set, the text shown literally. (SEC-01 lists nine innerHTML places at cfd77e5.)
   - For each finding docs/audit/08-redesign-coverage.md says is addressed, check the claim against the finding's
     evidence and proposed regression test in 02-findings.md: holds / partly holds / does not hold.

OUTPUT, in this order:
1. Findings table: Finding ID | agree / disagree / can't verify | why (one line, naming the command or source used).
   Include every finding from tasks C, D and I.
2. Citations table: rule ID | source | link works? | claim matches? | date correct? | note.
3. Classification disagreements.
4. Roadmap and specification issues: contradiction, missing coverage, untestable criterion or phase dependency, each
   with file and section.
5. Redesign: numbers identical (yes / no, listing every difference), console errors, escaping, and the 08 claims.
6. New issues not in docs/audit/data/findings.json, each with a way to reproduce it.
7. GO or NO-GO for starting Phase 1, with the required changes before GO (blocking) listed separately from
   suggestions (non-blocking).
```

## Checkpoint 2: each implementation pull request, before merge

```text
You are an independent reviewer for ONE implementation pull request. This is a REVIEW ONLY task.
Do not merge, deploy, commit, push or edit files. The owner decides whether to merge.

REPOSITORY: CowCampSTX/ranch-ops-dashboard
PULL REQUEST: [paste the pull request link here]

THE STANDARD TO REVIEW AGAINST:
- docs/audit/06-phase1-spec.md: the Phase 1 specification. Section 12 has the acceptance criteria for each work item
  (P1-01 to P1-17), section 5.7 the exact result on the committed data, section 7 safe rendering, section 11 the test
  plan and CI, section 14 what Phase 1 must not include.
- docs/audit/05-roadmap.md: work items, decisions D1-D16, and the Phase 1 acceptance bar (section 3.1).
- docs/audit/07-open-questions.md: the owner's answers, or the defaults used.
- docs/audit/HANDOFF.md: build order, definition of done, constraints.
Note: app.js and index.html line numbers in the findings refer to the reviewed commit cfd77e5. Phase 1 work started
from the redesigned app.js, so match code by what it does, not by line number. The dashboard is a demonstration on
fictional data and is not production-ready; every threshold is a demonstration setting or ranch choice.
If the pull request is Phase 2 or Phase 3 work, review it against that item's acceptance criteria in
docs/audit/05-roadmap.md instead of 06 section 12, and allow only the data changes the item names (for example, P2-08
changes moves.csv). Everything else below still applies.

TASKS
1. Scope. Say which P1 items the pull request claims to deliver. Read the diff against 06 for those items. For each of
   their acceptance criteria in 06 section 12, find the test, check it asserts the stated values, and check it passes.
   List criteria that are missing, weakened or untested. Flag any Phase 2 or Phase 3 feature (06 section 14).
2. Run everything, from the repository root:
   - for tz in UTC America/Chicago Pacific/Auckland; do TZ=$tz node --test "tests/**/*.test.mjs"; done
     (results must be identical in all three zones);
   - python3 scripts/generate_data.py && git diff --exit-code data/ && test -z "$(git status --porcelain data/)";
   - the scenario tests (tests/scenarios.test.mjs, or docs/audit/diagnostics/scenarios.run.mjs adapted to the new
     output);
   - the browser smoke test if present: npm ci && npx playwright install chromium && node tests/browser/smoke.mjs.
   Also check that CI passed on the pull request.
3. Acceptance bar. On the committed data the page must give exactly the 10 rows of 06 section 5.7, in that order:
   2 critical, 6 serious, 2 warning, tank T6 as decided (decision D7 or the owner's answer to OQ-03), and no data
   issue. These are the 10 planted problems with their original severities; any other row is a false alarm. Scenario
   folder 02 must still give zero rows. No scenarios/*/expected.json result may change unless a lead decision is
   recorded in both the folder and the pull request.
4. Safe rendering. Search the whole app, not only the diff, for innerHTML, outerHTML and insertAdjacentHTML. Every
   CSV-derived value must pass through esc() or be set with textContent; data must never go into on* attributes,
   style, href or src. Load scenario folder 10 (hostile CSV) in a browser, including every chart readout: no injected
   element and no script flag set.
5. Three states. Try a missing file (404), an empty or header-only file, an aborted request, a missing column and an
   invalid value. Expected: a banner naming the file; the affected area shows CAN'T TELL with a reason and a first
   step; never "Nothing needs attention", "0 of 0", "NaN", "Infinity" or "undefined"; the other sections still draw;
   a loading message shows while files load.
6. Constraints. No framework, bundler, backend, database, paid service, live integration or AI feature. The only
   allowed dependency is a pinned, test-only Playwright development dependency with its lock file. Data changes only
   through scripts/generate_data.py; its random draws are unchanged, the six unchanged data files are byte-identical
   to cfd77e5, and PLANTED still lists the same 10 problems. Every threshold is labelled a demonstration setting or
   ranch choice in RULES and in the rules table. No text claims production readiness, a validated threshold or a
   review time. Health text has no diagnosis, treatment or dose. Fictional-data labels stay on screen and in print.
7. Correctness risks the tests might miss: time handled through Intl with an explicit timeZone; no Date.now() or
   viewer-locale formatting in the pure modules; floating-point comparisons at rule boundaries; any code path that
   can still throw past a section guard.

OUTPUT
- BLOCKING issues (must fix before merge): file and line, what is wrong, how to reproduce it, and which acceptance
  criterion or constraint it breaks.
- NON-BLOCKING issues.
- Table: acceptance criterion | test name | pass / fail / missing.
- The commands you ran, each with a one-line summary of its output.
- Verdict: READY or NOT READY to merge. You do not merge; the owner does.
```
