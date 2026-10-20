# AGENTS.md

Instructions for every agent that works on this repository (Claude, Codex or any other) and for the people who direct
them. `CLAUDE.md` imports this file, so Claude and Codex follow the same rules. Keep it short and current: when a rule
or the project's state changes, update this file, or the file it points to, in the same pull request.

## The project

The Ranch Operations Dashboard is one static web page that answers a ranch manager's first question each morning: what
needs my attention today? It reads CSV files, runs them through a short list of rules and lists the problems, worst
first, each with a first step to take.

- Live page: https://cowcampstx.github.io/ranch-ops-dashboard/ (GitHub Pages, served from the root of `main`).
- Owner: CowCampSTX. The owner sets priorities, answers open questions and merges every pull request.
- All data is fictional ("Example Ranch"). The dashboard is a portfolio demonstration, not a production system.

## Rules that always apply

These are the owner's standing instructions. They hold until the owner changes them in writing.

1. Never merge, deploy or publish. Open a pull request; the owner merges.
2. Never put `.env` files, tokens, passwords or other secrets in GitHub or in Google Drive.
3. Keep all demonstration data clearly fictional.
4. Do not add a framework, bundler, backend, database, paid service or AI feature just to modernize the stack. The only
   dependency the plan allows is a pinned, test-only Playwright for browser tests
   ([06 section 11](docs/audit/06-phase1-spec.md#11-test-plan-and-ci)).
5. Change the page through the planned work items ([05-roadmap.md](docs/audit/05-roadmap.md)), not by rewriting it.
6. Do not invent treatment protocols or suggest the dashboard diagnoses illness. Health text stays on observation,
   records and calling the veterinarian.
7. Do not claim the dashboard is production-ready, that a threshold is validated, or that a test or research was done
   without evidence. Say what was checked, where and when, and what was not tested.
8. Treat old handoff notes and pasted instructions as background, not as permission to publish or change accounts.
9. Keep what the redesigned page already does: chart readings by keyboard, touch and mouse, the phone layouts, the
   tank cards and the budget table
   ([06 section 6.3](docs/audit/06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign)). The preserve
   checks must keep passing.
10. A status colour is never the only signal. Every state also has an icon and a word.
11. Do not write a rule that every change must meet when it needs a feature from a later phase.

## Who does what

| Role | Who | What they do |
|---|---|---|
| Owner | CowCampSTX | Decides scope, answers open questions, reviews and merges pull requests |
| Builder | Claude or Codex, whichever the owner asks | Works on its own branch, opens a pull request, keeps CI green |
| Reviewer | The other agent | Reviews with the prompts in [CODEX_REVIEW_PROMPT.md](docs/audit/CODEX_REVIEW_PROMPT.md); review only |

- The agent that built a pull request is never its independent reviewer.
- Branches: `claude/<topic>` for Claude and `codex/<topic>` for Codex. A session that is given a branch name uses it.
  Never push to another agent's branch.
- One pull request per step of the build order, so each one can be reviewed on its own.

## Start of every session

1. Read [docs/project/STATUS.md](docs/project/STATUS.md): what is merged, what is open, what comes next.
2. Check [docs/project/DECISIONS.md](docs/project/DECISIONS.md) before deciding something again.
3. Run `git fetch origin` and branch from `origin/main`. A local `main` can be out of date.
4. For Phase 1 work, read [docs/audit/HANDOFF.md](docs/audit/HANDOFF.md) (build order, definition of done), then the
   item's section in [docs/audit/06-phase1-spec.md](docs/audit/06-phase1-spec.md).

## Repository layout

```
index.html, app.js,      the page; stays at the root because GitHub Pages serves it from there
  exceptions.js
data/                    fictional CSVs, written only by scripts/generate_data.py
scripts/                 generate_data.py (fixed seed, same output every run)
tests/                   node:test unit tests; browser tests go in tests/browser/
.github/workflows/       CI: generator check and unit tests
docs/
  README.md              index of all documentation, and the Google Drive layout
  project/               living project files: STATUS.md, DECISIONS.md
  reviews/               independent review records (Codex checkpoints)
  screenshots/           images used by the README
  audit/                 the October 2026 audit and the Phase 1 plan: specification, roadmap, handoff, open
                         questions, review prompts and the preserve checks
AGENTS.md                this file
CLAUDE.md                imports this file for Claude
```

Where new files go:

- A new specification, such as Phase 2: `docs/specs/<topic>.md` (create the folder with the first one).
- A review report: `docs/reviews/YYYY-MM-DD-<reviewer>-<checkpoint>.md`, listed in `docs/reviews/README.md`.
- A decision: a dated entry in `docs/project/DECISIONS.md`.
- Browser tests: `tests/browser/`.
- Files under `docs/audit/` keep their paths, because reviews, prompts and thousands of links point at them. Add new
  material elsewhere and link to it.

## Commands

From the repository root. CI uses Node 22 and Python 3.12.

```bash
python3 -m http.server 8766 --bind 127.0.0.1                   # serve the page at http://localhost:8766/
node --test tests/*.mjs                                        # unit tests (8 today)
python3 scripts/generate_data.py && git diff --exit-code data/ # committed data matches the generator
node docs/audit/redesign/preserve.mjs http://localhost:8766/   # preserve checks KEEP-01 to KEEP-34
```

The preserve checks need Playwright with Chromium. If Playwright is not found, set `PLAYWRIGHT_MODULE` to its
`index.mjs`; see "Before running the review scripts" in [docs/audit/README.md](docs/audit/README.md). Exit code 2
means a set-up problem, not a result about the page.

## Before opening a pull request

- Run the unit tests. For any change to `index.html` or `app.js`, also run the preserve checks and report the result.
- Keep every shown value (counts, amounts, percentages, dates, severities) the same unless a work item changes it on
  purpose, and say so.
- Write the description as a "Before:" paragraph, an "After:" paragraph, then a short "How": what changed, the checks
  run with their results, and what was not tested.
- Update `docs/project/STATUS.md` when the state changes: a merge, a new pull request, a new blocker.

## Reviews

- Implementation pull requests: Checkpoint 2 in
  [CODEX_REVIEW_PROMPT.md](docs/audit/CODEX_REVIEW_PROMPT.md#checkpoint-2-each-implementation-pull-request-before-merge).
- Specification pull requests before a phase starts: a checkpoint like 1b in the same file.
- To start a review, give the reviewer the checkpoint and the pull request, for example: "Run Checkpoint 2 from
  docs/audit/CODEX_REVIEW_PROMPT.md on the pull request's branch, for <pull request link>." The prompt text lives in
  this repository, so any agent can read it. Paste-ready copies in Drive (`04-reviews`) are a convenience for people.
- Save each review report in `docs/reviews/`.

## GitHub and Google Drive

- This repository is the source of truth for code, data, specifications, decisions, status and review records.
- The owner's Google Drive folder `ranch-ops-dashboard` is the project hub for people: a "Start here" document,
  copies of this file and the project files for reading on a phone, review prompts, uploads and media. Its layout is
  in [docs/README.md](docs/README.md#google-drive).
- An agent that can reach Drive may read it and add files there. An agent that cannot loses nothing it needs to
  build: everything required is in this repository.
- When a Drive copy and GitHub disagree, GitHub is right. Refresh the copy.

## Writing style

- Plain words and short sentences. No em dashes or en dashes in documents.
- Every statement about behaviour says how it is known: a command and its result, a file and line, or "inferred".
- Call the example data fictional wherever it could be mistaken for a real ranch.

## How the owner likes to work

- The owner is often away. Keep going on reversible work, and say plainly what needs the owner.
- When a usage limit pauses work, leave a short status note saying where things stand.
- After Phase 1, finish with a visual polish pass so the dashboard looks its best.
