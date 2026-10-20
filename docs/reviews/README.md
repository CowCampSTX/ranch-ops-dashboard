# Reviews

Independent review reports, one file each, named `YYYY-MM-DD-<reviewer>-<checkpoint>.md`. The prompt given to the
reviewer for each one is in [prompts/](prompts/README.md) under the same name. The checkpoint templates are in
[CODEX_REVIEW_PROMPT.md](../audit/CODEX_REVIEW_PROMPT.md). A reviewer never reviews its own work, and a review edits
no repository file: the builder saves the report here ([AGENTS.md](../../AGENTS.md#reviews)).

| Date | Reviewer | Checkpoint | What was reviewed | Result |
|---|---|---|---|---|
| 2026-10-20 | Codex | [Checkpoint 1b](2026-10-20-codex-checkpoint-1b.md) | Pull request #3 (the Phase 1 specification update and the project files) at `fc2328e` | GO for Phase 1 after the owner merges #3. No blocking issue; four small documentation fixes, made in #3 after the review |
| 2026-10-20 | Codex | [Checkpoint 1](2026-10-20-codex-checkpoint-1.md) | Pull request #2 (the redesign) at `e9d7ab3`, and the audit | Redesign ready to merge; Phase 1 NO-GO until the specification matches the redesigned page (its R1 to R5) |

The Drive copy is the folder `reviews`.
