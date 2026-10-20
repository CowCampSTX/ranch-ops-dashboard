# Implementation handoff

For the developer who builds Phase 1 ("Fix now") of the Ranch Operations Dashboard. The full build specification is
[06-phase1-spec.md](06-phase1-spec.md); this page says where to start, in what order, when Phase 1 is done, and what
must not change.

- **Reviewed commit:** `cfd77e50a050163b542cadfc6b38882c0341e99d` (main when the audit ran).
  **Branch:** `claude/project-thread-nu46kf`.
- **Audit merged** into main in pull request #1 (merge commit `71f3492`). **Redesign merged** into main in pull
  request #2 from the same branch (redesign commit `f9ef651`, merge commit `0315d09`, 2026-10-20).
- **Starting point for Phase 1:** `origin/main` once the Checkpoint 1b documentation pull request is merged. Its page
  files are those of `0315d09` (the redesign); `redesign/preserve.mjs` is not in `0315d09`. Phase 1 has not started.
  `0315d09` is the reviewed baseline for what Phase 1 keeps, not a commit to branch from: each step branches from the
  newest `origin/main`, which includes the redesign follow-up pull request once it has merged
  ([06 section 15](06-phase1-spec.md#15-open-decisions-and-assumptions)). Update this line, 06's header row and 05
  section 1.3 when that pull request merges.
- **Agent instructions:** [AGENTS.md](../../AGENTS.md) at the repository root (`CLAUDE.md` imports it). Project status
  is in [docs/project/STATUS.md](../project/STATUS.md); this handoff and the specification are the Phase 1 guidance.
- **The dashboard is not production-ready**, and finishing Phase 1 will not make it so. The audit changed no production
  code.

## Read this first: the redesign

Pull request #2, merged into main on 2026-10-20 (merge commit `0315d09`), replaced `index.html` and `app.js` (plus the
README's chart text and screenshots) with the owner's visual redesign: black background, green accent, charts drawn
at their real width, keyboard and touch chart reading, phone layouts. `exceptions.js`, `data/`, `tests/` and
`scripts/` are unchanged by it. The underlying values are the same; the redesign adds some figures worked out from the
same data ([08 section 4](08-redesign-coverage.md#4-intentional-differences-from-cfd77e5)).

- **Start Phase 1 from main**, which has the redesigned `index.html` and `app.js`, not from `cfd77e5`.
- **Keep what the redesign already does.** Chart readings by pointer, touch and keyboard, the phone layouts, chart text
  size, the tank cards and the budget table are the starting point, not Phase 2 work
  ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)). A Phase 1 change may move
  the code behind them but must not remove or weaken them. The preserve checks KEEP-01 to KEEP-34 in
  [redesign/preserve.mjs](redesign/preserve.mjs) test this. They passed on main at `0315d09` (34 of 34 with the
  script before the follow-up pull request of 06 section 15, Playwright Chromium, 2026-10-20; real phones, screen
  readers, Firefox and WebKit not tested). That pull request changed KEEP-24: the changed script passes 34 of 34 on its
  page and gives 33 on `0315d09`'s page files, with KEEP-24 failing, by design. They must still pass on the Phase 1 page.
  The follow-up pull request of [06 section 15](06-phase1-spec.md#15-open-decisions-and-assumptions) fixed the two
  colour-only marks of `0315d09` on main: flagged gain animals are amber squares with a square legend key, and a tile
  meter shows a status colour only with the status icon and words. Phase 1 keeps these marks (06 section 6.3, "Status
  marks beyond colour") and adds no mark that shows a state by colour alone.
- **`app.js` and `index.html` line numbers in the findings and the specification refer to `cfd77e5`.** Read the old
  code with `git show cfd77e5:app.js`, then find the matching code in the redesign. Example: the nine `innerHTML`
  places of [SEC-01](02-findings.md#sec-01) are listed by their `cfd77e5` lines in
  [06 section 7](06-phase1-spec.md#7-safe-rendering).
- [08-redesign-coverage.md](08-redesign-coverage.md) maps which findings the redesign already addresses. Use it to
  find work already done, but count a finding as fixed only when its acceptance test passes.
- The redesign added keyboard and touch readouts (`#tip`), so the safe-rendering tests must cover every place that now
  shows CSV text, including those readouts.
- Its "Can't tell" and "No plan" labels are the page's own placeholders. Once the rules return CAN'T TELL rows, take
  those states from the rules ([08 section 3.3](08-redesign-coverage.md#33-not-addressed)). Keep the same pills and
  words in the same places; only the source of the state changes.

## Before writing code

1. Get answers to [07-open-questions.md](07-open-questions.md), or accept its defaults. OQ-01 (time zone), OQ-03
   (T6), OQ-04 (budget dollar lines) and OQ-05 (closed months) change Phase 1 output; OQ-10 (test-only Playwright
   dependency) changes CI; OQ-11 covers README edits.
2. Codex Checkpoint 1 ([CODEX_REVIEW_PROMPT.md](CODEX_REVIEW_PROMPT.md)) was run on 2026-10-20 on pull request #2 at
   `e9d7ab3`. It cleared the redesign to merge and gave Phase 1 a NO-GO until the specification keeps the redesign's
   behaviour (its R1) and its browser checks match the redesigned page (its R2).
3. The owner merged pull request #2 on 2026-10-20 (OQ-13). Each Phase 1 pull request branches from main: run
   `git fetch` first and branch from `origin/main`, because a local `main` that has not been updated still points at
   an older commit.
4. The documentation pull request that makes those specification changes (06 section 6.3, the browser criteria in
   06 sections 11.4 and 12, `redesign/preserve.mjs`, and the matching changes in 04, 05, 07, 08, this page, the audit
   README and the review prompts) is reviewed with Codex Checkpoint 1b
   ([CODEX_REVIEW_PROMPT.md](CODEX_REVIEW_PROMPT.md#checkpoint-1b-specification-follow-up-before-phase-1)) and merged
   by the owner before any Phase 1 code is written. Phase 1 starts only on a GO from that review.
5. Nothing is merged or deployed without the owner.

## Build order

From [05-roadmap.md section 1.3](05-roadmap.md#13-order-of-work). Items on one line can run in parallel. One pull
request per step is a reasonable size (a suggestion); run Codex Checkpoint 2 on each.

| Step | Items | What it does |
|---|---|---|
| 1 | P1-17 part a, P1-13 | Boundary tests that pin today's water and grazing rules before any refactor ([TEST-01](02-findings.md#test-01), [TEST-02](02-findings.md#test-02)); safe rendering ([SEC-01](02-findings.md#sec-01)) |
| 2 | P1-01, then P1-02 | RFC 4180 reader with decoding; typed data contract (blank means missing, IDs stay text, required columns, ranges) |
| 3 | P1-05 with P1-03, then P1-04 | Generator writes `meta.csv` (`timezone`, `season_start`, `books_closed_through`, `demo`), `tanks.csv`, `weigh_sessions.csv` and HLTH-03's row fix, in the same change as the code that reads them and the scenario-input update (decision D16); one as-of policy; then references and duplicates |
| 4 | P1-06 | Loading state, banner naming failed files, CAN'T TELL rows, section isolation |
| 5 | P1-07 to P1-12 | Area rules: water, grazing, gain (P1-10 after P1-09), health, budget |
| 6 | P1-14, P1-15, P1-16 | Tiles and charts from structured results; wording and number formats; rules table with each threshold's basis |
| 7 | P1-17 part b | Browser smoke test, with the preserve checks, and CI changes |

Estimated effort: 1 L, 12 M, 4 S ([05 section 3.3](05-roadmap.md#33-phase-1-effort-at-a-glance); an estimate, not a
measurement).

## Phase 1 definition of done

1. Every acceptance criterion in [06 section 12](06-phase1-spec.md#12-acceptance-criteria-per-p1-item) (P1-01 to
   P1-17) is an automated test, and all of them pass.
2. The committed data gives exactly the 10 rows in [06 section 5.7](06-phase1-spec.md#57-the-committed-data-after-phase-1),
   in that order: 2 critical, 6 serious, 2 warning, T6 as a serious CAN'T TELL row (or as decided in OQ-03), and no
   data issue. These are the 10 planted problems with their original severities.
3. All ten scenario folders pass through `tests/scenarios.test.mjs` after the D16 input update; folder 02 still shows
   zero rows. No `expected.json` result changes unless the lead decides a folder, not the rule, is wrong and records
   why in both places.
4. The whole suite gives identical results under `TZ=UTC`, `America/Chicago` and `Pacific/Auckland`.
5. The browser smoke test passes ([06 section 11.4](06-phase1-spec.md#114-browser-smoke-test)): no page error; a
   missing, empty or aborted file shows a banner and CAN'T TELL, never "0" or "NaN"; hostile CSV text injects nothing;
   a de-DE, Auckland browser shows the same 10 rows; and its keyboard, touch and phone checks (items 1 and 4) pass.
6. The preserve checks KEEP-01 to KEEP-34 pass against the Phase 1 page (06 section 11.4 item 6), ported into
   `tests/browser/smoke.mjs` or run from the reference script [redesign/preserve.mjs](redesign/preserve.mjs), so
   nothing listed in [06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign) is
   removed or weakened. A check changes only where a Phase 1 item changes the behaviour it tests, and the pull request
   says which and why.
7. CI runs the generator check (including new untracked files), the three-zone suite and the smoke test with the
   preserve checks ([06 section 11.5](06-phase1-spec.md#115-ci-changes-githubworkflowstestyml)).
8. The generator's random draws are unchanged, the six unchanged data files are byte-identical to the reviewed commit,
   and `PLANTED` still lists the same 10 problems.
9. Page copy and the rules table match [06 section 10](06-phase1-spec.md#10-rules-table-and-page-copy); README changes
   follow OQ-11; screenshots are retaken.
10. Nothing claims the dashboard is production-ready, that a threshold is validated, or how long a review takes.
11. Codex Checkpoint 2 reports no blocking issue, and the owner approves the merge.

## Where things are

| Need | Location |
|---|---|
| Modules, data contract, as-of policy, rule logic, states, settings | [06](06-phase1-spec.md) sections 2-9 |
| Acceptance criteria per item | [06 section 12](06-phase1-spec.md#12-acceptance-criteria-per-p1-item); headline criteria in [05 section 3.2](05-roadmap.md#32-work-items) |
| Decisions where the evidence disagreed (D1-D16) | [05 section 1.4](05-roadmap.md#14-decisions-this-roadmap-makes-where-the-evidence-disagrees) |
| Evidence, expected behaviour and hand-worked test values per finding | [02-findings.md](02-findings.md) |
| End-to-end scenario folders and their settings | [scenarios/](scenarios/README.md), `scenarios/settings.json` |
| Single-change test cases (W-02, GN-07, CSV-35 ...) | defined in `diagnostics/*.mjs`; rebuild them under `tests/fixtures/` ([06 section 11.2](06-phase1-spec.md#112-scenario-tests)) |
| What Phase 1 must not include | [06 section 14](06-phase1-spec.md#14-what-phase-1-does-not-include) |
| What Phase 1 must keep from the redesign | [06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign); checks in [redesign/preserve.mjs](redesign/preserve.mjs) |

## How to run the checks

Run from the repository root with Node 22 and python3. Browser scripts need Playwright
(`/opt/node22/lib/node_modules/playwright/index.mjs` in the audit environment, or `$PLAYWRIGHT_PATH`). On Windows or
another set-up, read [Before running the review scripts](README.md#before-running-the-review-scripts) first, and report
a failure caused by the set-up apart from the results.

```bash
node --test tests/exceptions.test.mjs                               # today: 8 pass
python3 scripts/generate_data.py && git diff --exit-code data/      # data matches the generator
python3 -I docs/audit/diagnostics/findings.handvalues.py            # recorded: "85 of 85 checks match"
node docs/audit/diagnostics/csv.repro.mjs                           # recorded: "66 cases: 8 MATCH, 58 MISMATCH"
python3 -I docs/audit/diagnostics/scenarios.build.py                # rebuild the scenario folders and check them
node docs/audit/diagnostics/scenarios.run.mjs                       # today: 01, 02 MATCH; 03-10 MISMATCH
node docs/audit/diagnostics/scenarios.run.mjs --browser --only 10   # also drives the page in Chromium
```

Every audit script, its command and whether it needs a local server is listed in
[01-baseline.md section 8](01-baseline.md#8-how-to-re-run-every-diagnostic). A MISMATCH in a repro script means the
defect is present.

**Against the reviewed commit.** Node-only scripts that import only `exceptions.js` should give the same results on the
redesign, because `exceptions.js` and `data/` are unchanged. `render.repro.mjs` (which imports `app.js`) and the browser
scripts exercise the page, and they were written for `cfd77e5`'s page; on the redesign they need their selectors
adapted before their output means anything ([08 section 5](08-redesign-coverage.md#5-audit-scripts-on-the-redesigned-page)
maps them). `node docs/audit/redesign/coverage.mjs` checks the redesign's claims (recorded: 23 PASS), and
`node docs/audit/redesign/preserve.mjs http://localhost:8766/` runs the preserve checks against a page you serve
(recorded: 34 PASS on main at `0315d09` with the script before the follow-up pull request of 06 section 15, see
[08 section 2](08-redesign-coverage.md#2-how-it-was-checked); the changed script passes 34 on that pull request's page
and fails only KEEP-24 on `0315d09`, see [08 section 6](08-redesign-coverage.md#6-the-follow-up-pull-request)). To
reproduce a finding as recorded, run the scripts against an extracted copy of the reviewed commit (the scripts find the
code relative to their own folder):

```bash
REF=$(mktemp -d)
git archive cfd77e5 | tar -x -C "$REF"
mkdir -p "$REF/docs" && cp -r docs/audit "$REF/docs/audit"
cd "$REF" && node docs/audit/diagnostics/render.repro.mjs
```

This was tried once while writing this handoff (not part of the audit evidence): the unit tests, `csv.repro.mjs` and
`scenarios.run.mjs` in node mode gave the recorded results. The browser scripts were not tried this way.

**After Phase 1.** The diagnostics stay as the record of `cfd77e5` and are not updated to the new code
([06 section 13](06-phase1-spec.md#13-migration-and-compatibility)). The scenario folders run through the new
`tests/scenarios.test.mjs`; `scenarios.run.mjs` can be adapted by changing its `currentNode()`, `currentBrowser()` and
`subjectKey()`.

## Constraints

- **Architecture.** A static site in plain HTML and JavaScript ES modules, with `node:test`. No framework, bundler,
  backend, database, paid service, live integration or AI feature. The one allowed addition is a pinned, test-only
  Playwright development dependency with its lock file (OQ-10); the page loads nothing from npm.
- **Fictional data.** Example Ranch stays fictional and labelled so, on screen and in print. A public feed or a sourced
  threshold never makes it a real operation.
- **The 10 planted problems.** Keep them, with the same severities, and add no false alarm on the committed data.
  Change data only through `scripts/generate_data.py`.
- **Thresholds.** Every threshold, old or new, stays configurable in `RULES` and shows its class and basis in the
  rules table; none is presented as validated.
- **Health.** Observation, scheduling, records and calling the veterinarian only: no diagnosis, treatment or dose.
- **Scope.** Requirements apply by phase: Phase 1 adds no new Phase 2 or Phase 3 feature
  ([06 section 14](06-phase1-spec.md#14-what-phase-1-does-not-include)). What the redesigned page already does is kept
  and is not counted as a Phase 2 feature
  ([06 section 6.3](06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)). No investment or ROI
  economics (the separate Ranch Tech ROI project covers them).
- **Tests are the referee.** Do not edit the audit's diagnostics to fit the new code. An `expected.json` result
  changes only when the lead decides the folder, not the rule, is wrong, and records why in both places.
- **No merge, deploy or push to main without the owner.** Codex reviews only.
