# Review prompts

The prompt given to the reviewer for each review, with the pull request and commits filled in. Each one is saved
under the name of the report it produced, ending in `.txt`. The templates are the checkpoints in
[CODEX_REVIEW_PROMPT.md](../../audit/CODEX_REVIEW_PROMPT.md): change a checkpoint there, not here.

| Prompt | Report |
|---|---|
| [2026-10-20-codex-checkpoint-1.txt](2026-10-20-codex-checkpoint-1.txt) | [2026-10-20-codex-checkpoint-1.md](../2026-10-20-codex-checkpoint-1.md) |
| [2026-10-20-codex-checkpoint-1b.txt](2026-10-20-codex-checkpoint-1b.txt) | [2026-10-20-codex-checkpoint-1b.md](../2026-10-20-codex-checkpoint-1b.md) |

The Checkpoint 1 prompt is the copy prepared for the reviewer; the Checkpoint 1b prompt is the text the owner was
given to paste. A reviewer that can read the repository can be pointed at a file here instead of being sent its text.
The Drive copy is the folder `reviews/prompts`.
