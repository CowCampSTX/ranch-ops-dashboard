# Codex review prompts

Three ready-to-paste prompts that ask OpenAI Codex to act as an independent reviewer of this work.

**When to use them.** Checkpoint 1 reviews the audit before any change to the dashboard's code. It was run once, on
2026-10-20, against pull request #2 at `e9d7ab3`. Use Checkpoint 1b once, on the documentation pull request that
brings the Phase 1 specification in line with the redesign, before any Phase 1 code. Use Checkpoint 2 every time a
pull request that changes the dashboard's code is ready, before you merge it.

How to use: copy everything inside the grey box, paste it into Codex, and replace the text in square brackets with the
pull request link. Codex only reviews. It must not merge, deploy, push or edit the dashboard's files; you decide what
happens next.

**About the redesign.** The audit was merged into main in pull request #1 (merge commit `71f3492`). Pull request #2
carried the visual redesign the owner asked for and was merged into main on 2026-10-20 (merge commit `0315d09`; its
head was `e9d7ab3`). It replaced `index.html` and `app.js`, the README's chart text and the screenshots in `docs/`:
black background, green accent, charts drawn at their real width, keyboard and touch chart reading, phone layouts.
`exceptions.js`, `data/`, `tests/` and `scripts/` are unchanged by it. The underlying values are the same; the
redesign adds some figures worked out from the same data. Line numbers in the findings refer to the reviewed commit
`cfd77e5`, not to the redesign. [08-redesign-coverage.md](08-redesign-coverage.md) maps which findings the redesign
already addresses. Checkpoint 1 reviewed the audit and pull request #2 and cleared the redesign to merge. Phase 1
work starts from main and keeps the redesign's behaviour listed in
[06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign), checked by
[redesign/preserve.mjs](redesign/preserve.mjs).

## Checkpoint 1: audit review, before any production code

**Done.** Run once, on 2026-10-20, on pull request #2 at `e9d7ab3`. Result: pull request #2 READY to merge (the owner
merged it as `0315d09`); Phase 1 NO-GO until R1 (the Phase 1 scope excluded features the redesign already ships) and
R2 (browser criteria named elements the redesign removed) are fixed. R3 to R5 were recommendations for the same
follow-up, with R4 to be resolved before the gain logic is built. The prompt below is the one that was run, updated on
2026-10-20 after the merge (the pull request line, the set-up notes, "values" in place of "numbers", the recorded gain
readout and output item 8). The text as run is `git show e9d7ab3:docs/audit/CODEX_REVIEW_PROMPT.md`. The follow-up
review is
[Checkpoint 1b](#checkpoint-1b-specification-follow-up-before-phase-1).

```text
You are an independent reviewer. This is a REVIEW ONLY task.
Do not merge, deploy, commit or push to any branch (main included). Do not edit any production file:
index.html, app.js, exceptions.js, data/, scripts/, tests/, README.md, .github/. Use a scratch folder outside the
repository for anything you write. If you cannot run or reach something, say "can't verify" and why; do not guess.

REPOSITORY: CowCampSTX/ranch-ops-dashboard
PULL REQUEST: [paste the link to pull request #2 here]. It is merged into main (merge commit 0315d09, 2026-10-20). Its
head was e9d7ab3, and main at 0315d09 has the same files (git diff --stat e9d7ab3 0315d09 prints nothing).
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
   exceptions.js, data/, tests/ and scripts/ are meant to be unchanged by it. Every value the old page showed is meant
   to stay the same; the redesign adds some figures worked out from the same data. The docs commit adds
   docs/audit/08-redesign-coverage.md (which findings the redesign claims to address) and
   docs/audit/redesign/coverage.mjs, and updates the audit's README, HANDOFF.md, 07-open-questions.md and this prompt
   to say the redesign is in #2.
IMPORTANT: app.js and index.html line numbers in the findings refer to cfd77e5, not to the redesign.

SETUP: Node 22 and python3; Playwright with Chromium for browser scripts. Run commands from the repository root.
The scripts were written and run on Linux. Read "Before running the review scripts" in docs/audit/README.md first.
In short: on Windows, findings.handvalues.py and scenarios.build.py need the tzdata package in the Python that runs
them (they run with -I, which ignores --user installs); a script that imports a file path (Playwright, or
exceptions.js in five diagnostics) needs pathToFileURL; and python3, /opt/node22/... and /tmp may not exist.
Report environment failures (a missing tool, a path, the time zone database, a different Node version) in their own
list, with the command and the error. They are not findings, FAILs or MISMATCHes and say nothing about the dashboard.
If you change a script to make it run, change only how it finds files or tools, and say exactly what you changed.
To reproduce findings exactly as recorded at cfd77e5, use an extracted copy (the scripts locate the code relative to
their own folder; the commands are POSIX shell, so on Windows use Git Bash or WSL):
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
   - Values identical. Serve $REF and the pull request head on two ports
     (python3 -m http.server PORT --bind 127.0.0.1 --directory DIR) and compare on the committed data: the as-of line;
     the tiles (recorded at cfd77e5: "Needs attention 10" with 2 critical, 6 serious, 2 warning; "Head on grass 375";
     "Water tanks OK 5 of 8"; "Yearling gain 1.94 lbs/day"; "Spend vs budget +1.0%"); the filter chip counts ("All (10)",
     "Water (3)", "Grazing (1)", "Gain (2)", "Health (2)", "Budget (2)"); the 10 exception rows word for word; the
     budget table; the chart headings; and the chart details for T4, animal H026, Repairs and the Yearlings' Sand Hills
     stay (recorded: "Sep 30, 6 PM: 10%"; "0.11 lbs/day, Jul 20 to Sep 15 / Now 1136 lbs / Under half of target";
     "Budget $7,200 / Actual $9,000 / Over by $1,800"; "Sep 6 to now (24 days) / Plan: 21 days"). The redesign
     changes the wording, order and layout of some of these on purpose, and adds figures worked out from the same
     data; 08 section 4 lists every difference in visible text on the committed data at 1280 and 390 px. Any value
     that differs, or any such difference not in that list, is a finding.
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
5. Redesign: values identical (yes / no, listing every difference), console errors, escaping, and the 08 claims.
6. New issues not in docs/audit/data/findings.json, each with a way to reproduce it.
7. GO or NO-GO for starting Phase 1, with the required changes before GO (blocking) listed separately from
   suggestions (non-blocking).
8. Environment problems, kept apart from everything above: each command that could not run as written in your
   set-up, its error, and any change you made to run it.
```

## Checkpoint 1b: specification follow-up, before Phase 1

Use once, on the documentation pull request that answers Checkpoint 1's R1 to R5. Paste its link into the prompt.
Phase 1 code starts only after this review gives GO and the owner merges that pull request.

```text
You are an independent reviewer. This is a REVIEW ONLY task.
Do not merge, deploy, commit or push to any branch (main included), and do not edit any file in the repository. Use
a scratch folder outside the repository for anything you write. If you cannot run or reach something, say "can't
verify" and why; do not guess.

REPOSITORY: CowCampSTX/ranch-ops-dashboard
PULL REQUEST: [paste the link to the documentation pull request here]. It should change only documentation: files
under docs/ (including README screenshots moved to docs/screenshots/), the root README.md, AGENTS.md, CLAUDE.md and
.gitignore. It changes no page code, data, script, test or CI file.
BASE: main at 0315d09, the merge of pull request #2 (the visual redesign; its head was e9d7ab3). Phase 1 starts from
this page and keeps what it already does.
WHAT THE PROJECT IS: a static ranch dashboard on FICTIONAL data (Example Ranch), a portfolio demonstration, NOT
production-ready. Every threshold is a demonstration setting or a ranch choice.
THE OWNER'S REQUEST: before Phase 1, update the specification so it keeps the redesign's keyboard, touch and phone
features, and replace outdated browser-test requirements with checks for the tank cards, the integrated budget table
and the responsive charts.
CHECKPOINT 1 (2026-10-20) asked for:
  R1 06-phase1-spec.md sections 1.2 and 14, and Checkpoint 2, excluded as later-phase features things the redesigned
     page already does (keyboard and touch chart readings, phone layouts, flagged-animal marks, outage gaps, tooltip
     fixes). Keep them; defer only what the redesign does not ship.
  R2 06 section 12 browser criteria named things the redesigned page no longer has (#water .mini, #budgetChart svg, a
     budget tooltip, a seven-row budget table, fixed x bounds 74..550).
  R3 08-redesign-coverage.md section 4 left out differences (such as "Grazing 3 of 8 pastures" and the season-total
     budget row) and should say "same underlying values".
  R4 the gain rule did not say what happens when a group's head count is 0.
  R5 the review scripts' prerequisites (pathToFileURL on Windows, IANA tzdata for Python) were not written down.

SETUP: read "Before running the review scripts" in docs/audit/README.md first. Check out the pull request head. It
should change no page code, so its page files are main's. Serve it from the repository root:
    python3 -m http.server 8766 --bind 127.0.0.1
Report environment failures (a missing tool, a path, the time zone database, a different Node version) in their own
list, with the command and the error. They are not findings and say nothing about the documents or the page.

TASKS
A. Scope. git diff --stat 0315d09...HEAD -- index.html app.js exceptions.js data scripts tests .github prints
   nothing. List the files the pull request changes. Outside docs/, expect only AGENTS.md, CLAUDE.md, .gitignore and
   README.md (its image paths and its file list).
B. R1 to R5. For each, say resolved / partly / not resolved, with file and section:
   - R1: 06 section 6.3 ("Accessibility and layout kept from the redesign") lists what Phase 1 keeps; 06 sections 1.2
     and 14, 04, 05, HANDOFF.md and Checkpoint 2 below defer only what the redesign does not ship; Checkpoint 2 flags
     a removal or weakening of kept behaviour as BLOCKING. The colour-only marks on main (flagged gain dots, gain and
     spend tile meters) are recorded as known issues for a separate pull request, not as features to keep.
   - R2: every [browser] criterion in 06 sections 11.4 and 12, and the headline criteria in 05 section 3.2.
   - R3: 08 section 4 and every place that said "every number ... identical".
   - R4: 06 sections 5.4 and 15 and the P1-10 and P1-14 criteria cover head 0 with and without a recent weigh-in,
     matched = 0, matched > head and a blank head, with no change to the committed-data result.
   - R5: the README section above, and the pathToFileURL import in docs/audit/redesign/coverage.mjs and preserve.mjs.
C. Run, from the pull request head with the page served:
   - node docs/audit/redesign/preserve.mjs http://localhost:8766/ (recorded on main: 34 PASS, 0 FAIL). Say whether
     each KEEP check tests what 06 section 6.3 says it tests.
   - node docs/audit/redesign/coverage.mjs PORT, with any free PORT (recorded: 23 PASS, 0 FAIL).
   - node --test tests/exceptions.test.mjs (recorded: 8 pass, 0 fail).
D. Values and security kept. With git diff 0315d09...HEAD -- docs/audit/05-roadmap.md docs/audit/06-phase1-spec.md,
   compare every changed acceptance criterion with its old text. Every expected value (counts, amounts, percentages,
   wording, severities) and every escaping or no-injection assertion must still be there, unless the change says
   why. Where the expected text is a Phase 1 output that does not exist yet ("Sensors normal", CAN'T TELL rows, the
   banner, "No weigh-ins yet", "+25.0%"), only the selector or the interaction may change.
E. Selectors. Every selector or element a [browser] criterion or 06 section 11.4 names exists on main's page at
   1280x900 and at 390x844 with touch, or is a Phase 1 element that 06 defines (such as the banner or the data checks
   panel).
F. Contradictions. Look for statements that disagree among 05-roadmap.md, 06-phase1-spec.md, Checkpoint 2 below,
   HANDOFF.md and 08-redesign-coverage.md (and 04 and 07 where they touch the same point): what is kept, what is
   deferred, the starting point, the area chip badges, the tiles, the zero-head case and the review route. Flag any
   rule that every change must meet but that needs a later-phase feature. Also check that AGENTS.md,
   docs/project/STATUS.md and docs/project/DECISIONS.md agree with HANDOFF.md and 06, that AGENTS.md's commands run
   as written, and that every link in AGENTS.md, CLAUDE.md, README.md and docs/README.md resolves.
G. Claims. Nothing says the dashboard is production-ready, that a threshold is validated, or how long a review takes.
   Each statement about what was measured says where and when, and what was not tested (real phones, screen readers,
   Firefox, WebKit). Health text stays on observation, records and calling the veterinarian.

OUTPUT, in this order:
1. R1 to R5: resolved / partly / not resolved, each with file and section and one line of why.
2. The commands you ran, each with a one-line summary of its output.
3. Criteria that lost or weakened a value or a security assertion, and criteria that name a selector missing on main.
4. Contradictions, each with both locations.
5. Other issues: BLOCKING (must fix before Phase 1) and NON-BLOCKING.
6. Environment problems, kept apart from everything above: each command that could not run as written in your
   set-up, its error, and any change you made to run it.
7. GO or NO-GO for starting Phase 1. You do not merge; the owner does.
```

## Checkpoint 2: each implementation pull request, before merge

```text
You are an independent reviewer for ONE implementation pull request. This is a REVIEW ONLY task.
Do not merge, deploy, commit or push, and do not edit any tracked file by hand. Run the commands in task 2 in your
own checkout of the pull request head: they may rewrite data/ (which must then show no difference) and create
node_modules/. Write your report and anything else outside the repository. The owner decides whether to merge.

REPOSITORY: CowCampSTX/ranch-ops-dashboard
PULL REQUEST: [paste the pull request link here]

THE STANDARD TO REVIEW AGAINST:
- docs/audit/06-phase1-spec.md: the Phase 1 specification. Section 12 has the acceptance criteria for each work item
  (P1-01 to P1-17), section 5.7 the exact result on the committed data, section 7 safe rendering, section 11 the test
  plan and CI, section 14 what Phase 1 must not include, section 6.3 what Phase 1 keeps from the redesigned page.
- docs/audit/05-roadmap.md: work items, decisions D1-D16, and the Phase 1 acceptance bar (section 3.1).
- docs/audit/07-open-questions.md: the owner's answers, or the defaults used.
- docs/audit/HANDOFF.md: build order, definition of done, constraints.
Note: app.js and index.html line numbers in the findings refer to the reviewed commit cfd77e5. Phase 1 work started
from the redesigned app.js, so match code by what it does, not by line number. The dashboard is a demonstration on
fictional data and is not production-ready; every threshold is a demonstration setting or ranch choice.
If the pull request is Phase 2 or Phase 3 work, review it against that item's acceptance criteria in
docs/audit/05-roadmap.md instead of 06 section 12, and allow only the data changes the item names (for example, P2-08
changes moves.csv). Everything else below still applies, except that a planted problem the item adds on purpose (05
section 4, "Phase 2 rule for the committed data") may add its row in task 3 and its entry in PLANTED in task 6 when it
is listed in PLANTED and the README, and a preserve check may change under that item as task 2 allows for a P1 item.
If the pull request is the follow-up to the redesign named in 06 section 15, it delivers no P1 item: review it against
that section's list, the preserve checks (KEEP-24 may change to count the new mark) and tasks 2 to 7.
Phase 1 lands one step of HANDOFF.md's build order at a time. Tasks 3, 5 and 6 describe the finished Phase 1: for a
pull request before the last step, require them only for the P1 items already merged and the ones it delivers (05
section 3.1's "Changed by" column names the items behind each row's wording). For everything else, the page must be no
worse than on main: the same 10 problems with the same severities, and no new NaN, Infinity, blank section or uncaught
page error.

TASKS
1. Scope. Say which P1 items the pull request claims to deliver. Read the diff against 06 for those items. For each of
   their acceptance criteria in 06 section 12, find the test, check it asserts the stated values, and check it passes.
   List criteria that are missing, weakened or untested. Flag any new Phase 2 or Phase 3 feature (06 section 14). Do
   not flag behaviour the redesigned page already had on main before the pull request (06 section 6.3: chart readings
   by pointer, touch and keyboard, the phone layouts, chart text size, label fitting, line breaks at sensor outages,
   the flagged-animal readings and legend, the tank cards and the budget table). Flag instead, as BLOCKING, any change
   that removes or weakens it. The colour-only marks on main (the flagged gain dots and the gain and spend tile meters)
   are known issues, not features to keep: a fix to them is not a weakening, and a new mark like them is an issue.
2. Run everything, from the repository root:
   - for tz in UTC America/Chicago Pacific/Auckland; do TZ=$tz node --test "tests/**/*.test.mjs"; done
     (results must be identical in all three zones);
   - python3 scripts/generate_data.py && git diff --exit-code data/ && test -z "$(git status --porcelain data/)";
   - the scenario tests (tests/scenarios.test.mjs, or docs/audit/diagnostics/scenarios.run.mjs adapted to the new
     output);
   - the browser smoke test if present: npm ci && npx playwright install chromium && node tests/browser/smoke.mjs;
   - the preserve checks KEEP-01 to KEEP-34 (06 sections 6.3 and 11.4), if the smoke test does not carry them yet:
     serve the pull request head (python3 -m http.server 8766 --bind 127.0.0.1) and run
     node docs/audit/redesign/preserve.mjs http://localhost:8766/ (recorded on main at 0315d09: 34 PASS). A FAIL is
     BLOCKING unless the pull request changes that behaviour on purpose, under the work item it delivers (a P1 item,
     or the 05 item for Phase 2 or 3) or as the fix for the colour-only marks (06 section 15), and says which and why.
   Also check that CI passed on the pull request.
   If a command fails because of your set-up rather than the code (see "Before running the review scripts" in
   docs/audit/README.md), list it under Environment problems, not as an issue.
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
- Environment problems: commands that could not run as written in your set-up, with the error, kept apart from the
  issues above.
- The commands you ran, each with a one-line summary of its output.
- Verdict: READY or NOT READY to merge. You do not merge; the owner does.
```
