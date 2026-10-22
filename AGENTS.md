# AGENTS.md

Instructions for every agent that works on this repository (Claude, Codex or any other) and for the people who direct
them. `CLAUDE.md` imports this file, so Claude and Codex follow the same rules. Keep it short and current: when a rule
or the project's state changes, update this file, or the file it points to, in the same pull request (a merge, or an
owner decision made outside a pull request, goes in the next one).

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
  README.md              index of all documentation, and the matching Google Drive folders
  project/               living project files: STATUS.md, DECISIONS.md
  reviews/               independent review reports (Codex checkpoints)
    prompts/             the prompt given to the reviewer for each report
  screenshots/           images used by the README, and capture.mjs that retakes them
  audit/                 the October 2026 audit and the Phase 1 plan: specification, roadmap, handoff, open
                         questions, review prompts and the preserve checks
AGENTS.md                this file
CLAUDE.md                imports this file for Claude
```

Every folder under `docs/` has a `README.md` saying what belongs in it, except the ten scenario data folders, which
`docs/audit/scenarios/README.md` and each folder's own `scenario.md` describe (filing rule 5 below). Where new files
go:

- A new specification, such as Phase 2: `docs/specs/<topic>.md` (create the folder, with its `README.md`, with the
  first one).
- A review report: `docs/reviews/YYYY-MM-DD-<reviewer>-<checkpoint>.md`, listed in `docs/reviews/README.md`, with the
  prompt given to the reviewer in `docs/reviews/prompts/` under the same name ending in `.txt`.
- A decision: a dated entry in `docs/project/DECISIONS.md`.
- Browser tests: `tests/browser/`.
- A new kind of material: a new folder under `docs/` with its `README.md`, the same folder in Drive, and a row in
  `docs/README.md`.
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
  this repository, so any agent can read it. A prompt filled in for one pull request is saved in
  `docs/reviews/prompts/`, where the reviewer can read it from the pull request's branch.
- A review is review only. The reviewer works in its own clone or detached checkout of the pull request head, never in
  a builder's working copy. It may run the checkpoint's commands there, including the ones that rewrite `data/` or
  create `node_modules/`. It changes no tracked file by hand, commits nothing and pushes nothing, and writes its report
  and any other file outside the repository. So the rule below about saving work before a session ends does not
  apply to it. Its report goes to the owner.
- The owner passes the report to the builder. The builder saves it in `docs/reviews/`, replacing local folder paths
  with placeholders, lists it in `docs/reviews/README.md` and fixes what it asks for, in the pull request it reviewed
  if that is still open, otherwise in the next one.

## GitHub and Google Drive

Everything the project needs lives in this repository or in the project's Drive folder, so Claude and Codex always work
from the same files. Nothing important lives only in a chat, a session or a local machine: before a session ends, push
the work to a branch, or save it to Drive when it cannot go to GitHub yet. (A review-only task is the exception; see
Reviews.)

- **GitHub is the source of truth** for code, data, specifications, decisions, status and review records. The
  repository is public, so nothing private goes in it.
- **Google Drive** is the owner's My Drive, folder `ranch-ops-dashboard`. It holds readable copies of the
  documentation, private records and work that cannot go to GitHub yet. Change the repository first, then refresh
  the copy. When a copy and GitHub disagree, GitHub is right.
- A Drive connector can be signed in to a different Google account. Once per session, before the first write through
  one, check that its My Drive shows `ranch-ops-dashboard` with `Docs index.md` at its top. If it does not, write
  nothing and tell the owner. The one exception is when the owner asks for the folder to be set up or rebuilt: then
  check that My Drive shows the owner's other project folders, such as `Ranch Tech ROI`, create
  `ranch-ops-dashboard` there and add `Docs index.md` to it first.
- An agent that cannot reach Drive, or whose connector fails that check, can still build: the code, data,
  specifications, decisions, status and review records are in this repository. Only work parked in Drive's
  `work-in-progress` is out of its reach; when a task needs it, ask the owner. Such an agent does the GitHub part of
  each rule below and lists the Drive steps still to do (a new folder with its `README.md`, copies to refresh) in its
  pull request, so the owner or an agent with Drive can do them.

Filing rules for Drive:

1. Everything for this project lives inside `ranch-ops-dashboard`: never at the top of My Drive, loose anywhere else,
   or in another project's folder (such as `Ranch Tech ROI`).
2. Material that more than one project uses lives in My Drive outside the project folders. The folders that use it
   link to it from their `README.md`; do not copy it into a project folder.
3. The folders mirror `docs/` with the same names: `project`, `reviews` (with `prompts`), `screenshots` and `audit`.
   Only `AGENTS.md`, `README.md` (the repository's front page) and `Docs index.md` (a copy of `docs/README.md`) sit at
   the top. [docs/README.md](docs/README.md#google-drive) says which files are copied.
4. Two folders exist only in Drive. `archive` holds superseded copies and private records, such as the original
   handoff note, which names personal details. `work-in-progress` holds work that cannot go to GitHub yet, one dated
   subfolder per piece; it moves to `archive` once the work is on GitHub.
5. Every folder and subfolder, in Drive and under `docs/`, has a `README.md` saying what belongs in it, with two
   exceptions. At the top of the Drive folder, `Docs index.md` does this job, because `README.md` there is the
   repository's front page. The ten scenario data folders under `docs/audit/scenarios/` are described by
   `docs/audit/scenarios/README.md` and by each folder's own `scenario.md`. A new kind of material gets a new folder
   in both places, with its `README.md`, and a row in `docs/README.md`.
6. Dated material is named `YYYY-MM-DD-what`.
7. Nothing in Drive is deleted or trashed without the owner's OK. The Google Drive connector Claude used on
   2026-10-20 can change a file's name, folder and details but not its content (its update tool has no content
   field). To refresh a copy through a connector like that, move the old copy to `archive`, renamed
   `YYYY-MM-DD-<name>` with the date it was replaced, then add the new copy.

## Writing style

- Plain words and short sentences. No em dashes or en dashes in documents.
- Every statement about behaviour says how it is known: a command and its result, a file and line, or "inferred".
- Call the example data fictional wherever it could be mistaken for a real ranch.

## How the owner likes to work

- The owner is often away. Keep going on reversible work, and say plainly what needs the owner.
- When a usage limit pauses work, leave a short status note saying where things stand.
- After Phase 1, finish with a visual polish pass so the dashboard looks its best.
