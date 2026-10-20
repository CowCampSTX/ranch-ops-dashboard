# Decisions

The owner's decisions that shape the project, newest first. Each entry says who decided, when, and where the detail
is. Detailed design decisions live with the documents they shape:

- Roadmap decisions D1 to D16: [05-roadmap.md section 1.4](../audit/05-roadmap.md#14-decisions-this-roadmap-makes-where-the-evidence-disagrees).
- Choices made in the Phase 1 specification (recommendations, not evidence): [06 section 15](../audit/06-phase1-spec.md#15-open-decisions-and-assumptions).
- Answers to open questions: [07-open-questions.md](../audit/07-open-questions.md).

Add a new entry at the top when the owner decides something. Do not rewrite old entries; add a new one that replaces
them and say which.

## 2026-10-20: How files are filed in Drive

Owner. Each project has its own folder in My Drive, and everything for this project lives inside
`ranch-ops-dashboard`, filed by kind in subfolders with a `README.md` in every folder, as the Ranch Tech ROI project's
folder is. Material that more than one project uses lives in My Drive outside the project folders. Every file the
agents need is in GitHub or in Drive; Drive may hold code when it is needed there. The rules are in
[AGENTS.md](../../AGENTS.md#github-and-google-drive).

## 2026-10-20: One instruction file for both agents, and a Drive hub

Owner. Claude and Codex both work on the project. `AGENTS.md` at the repository root holds the shared instructions,
and `CLAUDE.md` imports it. Project essentials are kept in the owner's Google Drive folder `ranch-ops-dashboard`, and
the GitHub and Drive files are organized so both agents can find them ([docs/README.md](../README.md)). GitHub stays
the source of truth.

## 2026-10-20: Keep the redesign's features in Phase 1; review the specification first

Owner, after Codex Checkpoint 1 ([report](../reviews/2026-10-20-codex-checkpoint-1.md)). Before Phase 1, the
specification keeps the redesign's keyboard, touch and phone features, and its browser checks test the tank cards,
the budget table and the responsive charts. Those documentation changes go to review before any Phase 1 code.

## 2026-10-20: Merge the redesign before Phase 1

Owner. Pull request #2 (the black and green redesign) merged as `0315d09` after Codex Checkpoint 1 found it ready.
Phase 1 starts from the redesigned page (OQ-13).

## 2026-10-20: How the work runs while the owner is away

Owner. Claude keeps building and resumes after usage limits without waiting to be asked, and leaves a short status
note each time a limit pauses the work. The owner merges pull requests. When the planned work is done, or earlier if
it fits better, Claude does a visual polish pass to make the dashboard look its best.

## October 2026: Codex reviews, the owner merges

Owner. Codex reviews independently at the checkpoints in
[CODEX_REVIEW_PROMPT.md](../audit/CODEX_REVIEW_PROMPT.md). A review never merges or deploys. Only the owner merges.

## October 2026: Theme

Owner. The page uses a black background with a green accent (shipped in pull request #2).

## October 2026: Ground rules for the audit and after

Owner, in the audit request. Fictional data stays clearly fictional; nothing is merged, deployed or published by an
agent; historical handoff notes are background, not permission; no claims without evidence; no framework, backend,
paid service or AI feature just to modernize the stack; no treatment protocols or diagnosis; no claim of production
readiness from sample-data tests; no rule that every change must meet when it needs a later-phase feature; no secrets
in the repository. These are the "Rules that always apply" in [AGENTS.md](../../AGENTS.md).
