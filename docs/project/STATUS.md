# Project status

Last updated 2026-10-26 by Claude. Update this file whenever a pull request opens or merges, or a blocker appears (a
merge is recorded in the next pull request).

## Where things stand

| What | State |
|---|---|
| `main` | `3251d37`: the redesign follow-up pull request #4 and the documentation pull request #3 (`fa22dc8`), both merged 2026-10-22, on top of the visual redesign (pull request #2, `0315d09`) and the audit (pull request #1, `71f3492`) |
| Live page | https://cowcampstx.github.io/ranch-ops-dashboard/, served from `main` |
| Phase 1 ("Fix now") | Step 1 of 7 (P1-17 part a and P1-13) is open as pull request #5. Steps 2 to 7 follow, one pull request each |
| Checks on `main` (`3251d37`, 2026-10-26, Linux, Chromium) | Unit tests 8 of 8 pass; preserve checks 34 of 34 pass. Firefox, WebKit, real phones and screen readers not tested |

## Open pull requests

| Pull request | What it does | Waiting on |
|---|---|---|
| [#5](https://github.com/CowCampSTX/ranch-ops-dashboard/pull/5) | Phase 1 step 1: boundary tests that pin today's water and grazing rules (P1-17 part a), and safe rendering (P1-13): `esc()` moves to `format.js` with a unit test, and `tests/browser/safe-rendering.mjs` checks that markup in CSV values shows as text. No shown count, amount, percentage, date or severity changes | Codex Checkpoint 2, then the owner's merge, and three owner choices listed in its description |

Codex reviewed #3 at `fc2328e` with Checkpoint 1b and said GO, with no blocking issue
([report](../reviews/2026-10-20-codex-checkpoint-1b.md), [prompt](../reviews/prompts/2026-10-20-codex-checkpoint-1b.txt)).
The owner merged #3 and #4 on 2026-10-22. No review report on #4 was passed on to be saved here.

## Next, in order

1. **Phase 1 step 1, pull request #5.** Codex reviews it with Checkpoint 2, then the owner merges it.
2. **Phase 1 steps 2 to 7**, in the build order of [HANDOFF.md](../audit/HANDOFF.md#build-order), one pull request
   per step, each reviewed with Codex Checkpoint 2. Step 2 is P1-01, then P1-02.
3. **Visual polish pass** after Phase 1, so the dashboard looks its best (the owner's request).

## Where the files are

GitHub holds the code, data, specifications, decisions, status and review records ([docs/README.md](../README.md)). The owner's Google Drive folder
`ranch-ops-dashboard` holds readable copies, private records and work that is not on GitHub yet
([AGENTS.md](../../AGENTS.md#github-and-google-drive)).

## Open questions for the owner

[07-open-questions.md](../audit/07-open-questions.md) lists them with the defaults used until they are answered.
OQ-13 (merge the redesign first) is answered. OQ-01 (time zone), OQ-03 (tank T6), OQ-04 (budget dollar lines) and
OQ-05 (closed months) change Phase 1 output.
