# Implementation handoff

For the developer who builds Phase 1 ("Fix now") of the Ranch Operations Dashboard. The full build specification is
[06-phase1-spec.md](06-phase1-spec.md); this page says where to start, in what order, when Phase 1 is done, and what
must not change.

- **Reviewed commit:** `cfd77e50a050163b542cadfc6b38882c0341e99d` (main). **Branch:** `claude/project-thread-nu46kf`.
- **No PROJECT_CONTEXT.md or AGENTS.md** exists in the repository; the audit and this handoff are the guidance.
- **The dashboard is not production-ready**, and finishing Phase 1 will not make it so. The audit changed no production
  code.

## Read this first: the redesign commit

The same pull request carries a **separate commit** that replaces `index.html` and `app.js` (plus the README
screenshots) with the owner's visual redesign: black background, green accent, charts drawn at their real width,
keyboard and touch chart reading, phone layouts. `exceptions.js`, `data/`, `tests/` and `scripts/` are unchanged by it,
and every number on the page is meant to stay identical.

- **Start Phase 1 from the redesigned `app.js`**, not from `cfd77e5`.
- **`app.js` and `index.html` line numbers in the findings and the specification refer to `cfd77e5`.** Read the old
  code with `git show cfd77e5:app.js`, then find the matching code in the redesign. Example: the nine `innerHTML`
  places of [SEC-01](02-findings.md#sec-01) are listed by their `cfd77e5` lines in
  [06 section 7](06-phase1-spec.md#7-safe-rendering).
- [08-redesign-coverage.md](08-redesign-coverage.md) (written separately) maps which findings the redesign already
  addresses. Use it to find work already done, but count a finding as fixed only when its acceptance test passes.
- If the redesign replaced hover tooltips with keyboard or touch readouts, the safe-rendering tests must cover every
  place that now shows CSV text.

## Before writing code

1. Get answers to [07-open-questions.md](07-open-questions.md), or accept its defaults. OQ-01 (time zone), OQ-03
   (T6), OQ-04 (budget dollar lines) and OQ-05 (closed months) change Phase 1 output; OQ-10 (test-only Playwright
   dependency) changes CI; OQ-11 covers README edits.
2. Run Codex Checkpoint 1 ([CODEX_REVIEW_PROMPT.md](CODEX_REVIEW_PROMPT.md)) and act on its required changes.
3. Agree with the owner whether this pull request is merged first or Phase 1 stacks on it (OQ-13). Nothing is merged
   or deployed without the owner.

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
| 7 | P1-17 part b | Browser smoke test and CI changes |

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
   a de-DE, Auckland browser shows the same 10 rows.
6. CI runs the generator check (including new untracked files), the three-zone suite and the smoke test
   ([06 section 11.5](06-phase1-spec.md#115-ci-changes-githubworkflowstestyml)).
7. The generator's random draws are unchanged, the six unchanged data files are byte-identical to the reviewed commit,
   and `PLANTED` still lists the same 10 problems.
8. Page copy and the rules table match [06 section 10](06-phase1-spec.md#10-rules-table-and-page-copy); README changes
   follow OQ-11; screenshots are retaken.
9. Nothing claims the dashboard is production-ready, that a threshold is validated, or how long a review takes.
10. Codex Checkpoint 2 reports no blocking issue, and the owner approves the merge.

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

## How to run the checks

Run from the repository root with Node 22 and python3. Browser scripts need Playwright
(`/opt/node22/lib/node_modules/playwright/index.mjs` in the audit environment, or `$PLAYWRIGHT_PATH`).

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
scripts exercise the page, and they were written for `cfd77e5`'s page; on the redesign they may need their selectors
adapted before their output means anything. To reproduce a finding as recorded, run the scripts against an extracted
copy of the reviewed commit (the scripts find the code relative to their own folder):

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
- **Scope.** Requirements apply by phase: no Phase 2 or Phase 3 feature in Phase 1. No investment or ROI economics
  (the separate Ranch Tech ROI project covers them).
- **Tests are the referee.** Do not edit the audit's diagnostics to fit the new code. An `expected.json` result
  changes only when the lead decides the folder, not the rule, is wrong, and records why in both places.
- **No merge, deploy or push to main without the owner.** Codex reviews only.
