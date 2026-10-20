# Documentation

Where everything about the Ranch Operations Dashboard lives. Agents start with [AGENTS.md](../AGENTS.md); people can
start here.

## In this repository

| Folder or file | What it holds | Changes |
|---|---|---|
| [project/STATUS.md](project/STATUS.md) | What is merged, what is open, what comes next | Updated with every merge or new pull request |
| [project/DECISIONS.md](project/DECISIONS.md) | Dated decisions by the owner, and where the detailed ones are recorded | A new entry per decision |
| [reviews/](reviews/README.md) | Independent review reports (Codex checkpoints) | A new file per review |
| [audit/](audit/README.md) | The October 2026 audit of the dashboard and the Phase 1 plan | Paths stay fixed; files are revised in place |
| [screenshots/](screenshots/) | The images on the project README | Retaken when the page changes |

The most used files in `audit/`:

| File | Use it for |
|---|---|
| [audit/HANDOFF.md](audit/HANDOFF.md) | Phase 1 build order, definition of done, what must not change |
| [audit/06-phase1-spec.md](audit/06-phase1-spec.md) | The Phase 1 build specification and acceptance criteria |
| [audit/05-roadmap.md](audit/05-roadmap.md) | All work items for Phases 1 to 3, decisions D1 to D16 |
| [audit/07-open-questions.md](audit/07-open-questions.md) | Questions for the owner, with the defaults used until answered |
| [audit/CODEX_REVIEW_PROMPT.md](audit/CODEX_REVIEW_PROMPT.md) | The prompts for each independent review checkpoint |
| [audit/redesign/preserve.mjs](audit/redesign/preserve.mjs) | The preserve checks KEEP-01 to KEEP-34 |

When the project grows:

- A new specification goes in `docs/specs/<topic>.md`.
- A review report goes in `docs/reviews/YYYY-MM-DD-<reviewer>-<checkpoint>.md`.
- A decision goes in `docs/project/DECISIONS.md`.

## Google Drive

The owner's Drive folder [ranch-ops-dashboard](https://drive.google.com/drive/folders/1CpX3CHkWxbXsJHb_VNAh_uLJTCrzX8Hz)
is the project hub for people. It is private to the owner. GitHub stays the source of truth: when a copy in Drive and
a file here disagree, the file here is right.

| Drive folder | What goes there |
|---|---|
| `00-start-here` | The "Start here" document: what the project is, where things are, what to do next |
| `01-agent-instructions` | Copies of `AGENTS.md` and `CLAUDE.md` |
| `02-project-status` | Copies of `STATUS.md` and `DECISIONS.md` |
| `03-plans-and-specs` | Copies of the handoff and open questions, and links to the full specification and roadmap |
| `04-reviews` | Review prompts ready to paste into Codex, and the review reports |
| `05-design-and-media` | Screenshots, design references and other media |
| `06-inbox` | Files the owner drops in for an agent to sort |
| `99-archive` | Superseded files, kept for reference |

Large files (the full specification, roadmap, findings and research) stay in GitHub only, with links from Drive, so
there is one copy to keep current.
