# Documentation

Everything about the Ranch Operations Dashboard beyond the page code. Agents start with [AGENTS.md](../AGENTS.md);
people can start here. GitHub is the source of truth. The owner's Google Drive holds readable copies in folders with
the same names (My Drive > `ranch-ops-dashboard`). Change a file here first, then refresh the Drive copy.

## Folders

| Folder | What is in it | In Drive (`ranch-ops-dashboard/...`) |
|---|---|---|
| [project/](project/README.md) | [STATUS.md](project/STATUS.md): what is merged, what is open, what comes next. [DECISIONS.md](project/DECISIONS.md): the owner's decisions, newest first | `project`: every file |
| [reviews/](reviews/README.md) | Independent review reports (Codex checkpoints), one file each; [prompts/](reviews/prompts/README.md) holds the prompt given to the reviewer for each one | `reviews` and `reviews/prompts`: every file |
| [screenshots/](screenshots/README.md) | The images on the repository's front page | `screenshots`: every file |
| [audit/](audit/README.md) | The October 2026 audit of the dashboard and the Phase 1 plan: baseline, findings, research, workflow, roadmap, specification, open questions, coverage of the redesign, the handoff and the review prompts | `audit`: the documents (`README.md`, `01` to `08`, `HANDOFF.md`, `CODEX_REVIEW_PROMPT.md`). Its subfolders (`data`, `diagnostics`, `evidence`, `redesign`, `scenarios`, `screenshots`) hold scripts and machine-readable records and stay on GitHub only |

Every folder here has a `README.md` saying what belongs in it. The ten scenario data folders are described by
[audit/scenarios/README.md](audit/scenarios/README.md) instead, because a script rebuilds them.

The most used files in `audit/`:

| File | Use it for |
|---|---|
| [audit/HANDOFF.md](audit/HANDOFF.md) | Phase 1 build order, definition of done, what must not change |
| [audit/06-phase1-spec.md](audit/06-phase1-spec.md) | The Phase 1 build specification and acceptance criteria |
| [audit/05-roadmap.md](audit/05-roadmap.md) | All work items for Phases 1 to 3, decisions D1 to D16 |
| [audit/07-open-questions.md](audit/07-open-questions.md) | Questions for the owner, with the defaults used until answered |
| [audit/CODEX_REVIEW_PROMPT.md](audit/CODEX_REVIEW_PROMPT.md) | The prompts for each independent review checkpoint |
| [audit/redesign/preserve.mjs](audit/redesign/preserve.mjs) | The preserve checks KEEP-01 to KEEP-34 |

Adding material: put it in the folder it belongs to.

- A new specification, such as Phase 2: `docs/specs/<topic>.md`. Create the folder with the first one, with its
  `README.md`, the same folder in Drive, and a row above.
- A review report: `docs/reviews/YYYY-MM-DD-<reviewer>-<checkpoint>.md`, and its prompt in `docs/reviews/prompts/`
  with the same name ending in `.txt`.
- A decision: a dated entry at the top of `docs/project/DECISIONS.md`.
- Any other new kind of material: a new folder, here and in Drive, with a `README.md` and a row above. Name dated
  material `YYYY-MM-DD-what`.

## Google Drive

The owner's Drive folder `ranch-ops-dashboard` sits at the top of My Drive, next to the folders of the owner's other
projects. It is private to the owner. The filing rules are in [AGENTS.md](../AGENTS.md#github-and-google-drive).

| In Drive | What it is |
|---|---|
| `AGENTS.md` | A copy of [AGENTS.md](../AGENTS.md), the instructions for every agent |
| `README.md` | A copy of the repository's front page, [README.md](../README.md) |
| `Docs index.md` | A copy of this file |
| `project`, `reviews`, `screenshots`, `audit` | Copies of the folders above, as the table says |
| `archive` | Drive only. Superseded copies, renamed `YYYY-MM-DD-<name>` with the date they were replaced, and private records that must not go in this public repository, such as the original handoff note of 2026-10-14 |
| `work-in-progress` | Drive only. Work that cannot go to GitHub yet, one dated subfolder each, with a `README.md` saying what it is and where it goes. It moves to `archive` once it is on GitHub |

Material that more than one project uses lives in My Drive outside the project folders, and the folders that use it
link to it from their `README.md`.
