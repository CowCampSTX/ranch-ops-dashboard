# Project status

Last updated 2026-10-22 by Claude. Update this file whenever a pull request opens or merges, or a blocker appears (a
merge is recorded in the next pull request).

## Where things stand

| What | State |
|---|---|
| `main` | `fa22dc8`: the documentation pull request #3 (merged 2026-10-22) on top of the visual redesign (pull request #2, `0315d09`) and the audit (pull request #1, `71f3492`). The page files are still those of `0315d09` |
| Live page | https://cowcampstx.github.io/ranch-ops-dashboard/, served from `main` |
| Phase 1 ("Fix now") | Not started. Step 1 opens after the redesign follow-up pull request #4 merges, so each pull request can be reviewed on its own |
| Checks on `main` (2026-10-20, Linux, Chromium) | Unit tests 8 of 8 pass; preserve checks 34 of 34 pass with the preserve script as it is on main. #4 changes KEEP-24 to judge the shape of the flagged gain marks, so that script gives 33 of 34 on main's page files (KEEP-24 fails, as intended) and 34 of 34 on #4. Firefox, WebKit, real phones and screen readers not tested |

## Open pull requests

| Pull request | What it does | Waiting on |
|---|---|---|
| [#4](https://github.com/CowCampSTX/ranch-ops-dashboard/pull/4) | The redesign follow-up that [06 section 15](../audit/06-phase1-spec.md#15-open-decisions-and-assumptions) asks for: flagged gain marks are amber squares, the tile meters never show a state by colour alone, long budget names wrap inside the table, the gain note names every group the chart leaves out, and layout fixes from the review of the redesign. No shown count, amount, percentage, date or severity changes | Codex Checkpoint 2, then the owner's merge |

Codex reviewed #3 at `fc2328e` with Checkpoint 1b and said GO, with no blocking issue
([report](../reviews/2026-10-20-codex-checkpoint-1b.md), [prompt](../reviews/prompts/2026-10-20-codex-checkpoint-1b.txt)).
The owner merged #3 on 2026-10-22.

## Next, in order

1. **Redesign follow-up pull request #4.** Codex reviews it with Checkpoint 2, then the owner merges it.
2. **Phase 1, step by step**, in the build order of [HANDOFF.md](../audit/HANDOFF.md#build-order), one pull request
   per step, each reviewed with Codex Checkpoint 2. Step 1 is P1-17 part a (boundary tests) with P1-13 (safe
   rendering).
3. **Visual polish pass** after Phase 1, so the dashboard looks its best (the owner's request).

## Where the files are

GitHub holds the code, data, specifications, decisions, status and review records ([docs/README.md](../README.md)). The owner's Google Drive folder
`ranch-ops-dashboard` holds readable copies, private records and work that is not on GitHub yet
([AGENTS.md](../../AGENTS.md#github-and-google-drive)).

## Open questions for the owner

[07-open-questions.md](../audit/07-open-questions.md) lists them with the defaults used until they are answered.
OQ-13 (merge the redesign first) is answered. OQ-01 (time zone), OQ-03 (tank T6), OQ-04 (budget dollar lines) and
OQ-05 (closed months) change Phase 1 output.
