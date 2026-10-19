# Ranch Operations Dashboard: audit

This folder is an audit of the Ranch Operations Dashboard: what it does today, what goes wrong with real-shaped data,
what the published guidance says about each rule, and what to build next, in what order. It is written for two readers:
a ranch manager deciding what matters, and a developer who will make the changes.

The dashboard is a portfolio demonstration running on fictional data (Example Ranch). **It is not production-ready**,
and nothing in this audit says otherwise (see [Not production-ready](#not-production-ready)). **The audit changed no
production code**: every file it added is under `docs/audit/`.

| Item | Value |
|---|---|
| Repository | CowCampSTX/ranch-ops-dashboard |
| Commit reviewed | `cfd77e50a050163b542cadfc6b38882c0341e99d` (main), "Switch the dashboard to a black theme with green accents" |
| Work branch | `claude/project-thread-nu46kf` (the pull request from this branch into main) |
| When | Baseline run 2026-10-15; registries built 2026-10-16; documents reviewed and fixed 2026-10-19 |
| Project guidance files | **There is no PROJECT_CONTEXT.md and no AGENTS.md in the repository.** The audit judged the code against README.md, the code itself, the committed fictional data and the project's stated purpose. |
| Blocked checks | The published GitHub Pages site could not be reached (the environment's proxy answered 403), so the live deployment is unverified. Only Playwright Chromium, with phone and touch emulation, was run: no real phones, screen readers, Firefox or WebKit. No user testing was done. |
| Separate commit in the same pull request | A visual redesign of `index.html` and `app.js` that the owner asked for. It is not part of the audit; see [The redesign commit](#the-redesign-commit). |

## The five improvements most likely to make the dashboard more reliable and useful

These are recommendations. The finding IDs (for example `LOAD-01`) are the stable IDs in
[`data/findings.json`](data/findings.json); the work-item IDs (P1-01 ...) are in [05-roadmap.md](05-roadmap.md).

1. **Never show "all clear" when the page cannot tell.** Add a third state, CAN'T TELL, plus a loading message, a
   visible error naming any file that failed, a master list of tanks, and page sections that draw on their own
   (P1-06, P1-07; [LOAD-01](02-findings.md#load-01), [LOAD-02](02-findings.md#load-02),
   [LOAD-03](02-findings.md#load-03), [LOAD-04](02-findings.md#load-04), [WAT-02](02-findings.md#wat-02)). Today, of 32
   single-file failure cases, 8 showed the affected area as clear and the other 24 left a blank page.
2. **Read real exports correctly, and show what cannot be read.** Replace the CSV reader with one that handles quotes,
   line endings and blank rows, and give every file a data contract (blank means missing, IDs stay text, required
   columns, references, duplicates) whose violations appear as visible data-issue rows (P1-01, P1-02, P1-04;
   [CSV-01](02-findings.md#csv-01) to [CSV-06](02-findings.md#csv-06), [DATA-01](02-findings.md#data-01),
   [DATA-03](02-findings.md#data-03), [WAT-01](02-findings.md#wat-01), [BUD-02](02-findings.md#bud-02),
   [HLTH-01](02-findings.md#hlth-01)). Against today's reader, 58 of 66 CSV test cases did not behave as expected.
3. **Use one as-of time, in the ranch's time zone.** Every rule counts from the same as-of instant and ranch calendar
   date, rows dated after it are left out and reported, and the budget counts only closed months (P1-03, P1-12;
   [DATA-02](02-findings.md#data-02), [TIME-01](02-findings.md#time-01), [TIME-02](02-findings.md#time-02),
   [TIME-03](02-findings.md#time-03), [GRZ-01](02-findings.md#grz-01), [BUD-01](02-findings.md#bud-01)).
4. **Judge gain and water only on enough data, and pin every rule with tests.** Compute group gain from one consistent
   pair of weigh sessions with coverage and age shown, use a true 24-hour window for tank drops, and add boundary tests
   and the ten scenario folders so that a broken rule fails CI (P1-07, P1-09, P1-10, P1-17;
   [GAIN-01](02-findings.md#gain-01), [GAIN-02](02-findings.md#gain-02), [GAIN-03](02-findings.md#gain-03),
   [GAIN-07](02-findings.md#gain-07), [GAIN-08](02-findings.md#gain-08), [WAT-03](02-findings.md#wat-03),
   [TEST-01](02-findings.md#test-01), [TEST-02](02-findings.md#test-02)).
5. **Then build the morning review around trust and consequence (Phase 2).** A freshness and coverage line,
   "Why this row?" explanations that show the readings and the threshold, ranking by consequence within a severity, and
   a one-page printable crew briefing (P2-01, P2-04, P2-09, P2-07; [LOAD-05](02-findings.md#load-05),
   [WAT-05](02-findings.md#wat-05), [UI-09](02-findings.md#ui-09), [GRZ-08](02-findings.md#grz-08)).

Items 1 to 4 are Phase 1 and must keep the 10 planted problems with the same severities and add no false alarm on the
committed data. Item 5 starts only when Phase 1 meets that bar.

## Deliverables, in reading order

| # | Deliverable | File | What it holds |
|---|---|---|---|
| 1 | Current implementation assessment and test results | [01-baseline.md](01-baseline.md) | How the code and data flow work, what works well, the 8 unit tests, browser observations at desktop and phone size, blocked checks, and how to re-run every diagnostic |
| 2 | Prioritized defect and operational-rule audit | [02-findings.md](02-findings.md) | All 83 findings by phase and severity, each with evidence, expected behaviour, a proposed regression test and fix; then an audit of the current thresholds against the research |
| 3 | Research and data requirements, with citations | [03-research-and-data.md](03-research-and-data.md) | 98 rules classed A-D with their sources and checker results, 152 data fields, the case for CSV import before integrations, 47 candidate integrations, and a 247-entry bibliography |
| 4 | Recommended morning workflow | [04-workflow-and-features.md, Part 1](04-workflow-and-features.md#part-1-recommended-morning-workflow) | A four-step morning review (a design target of about two minutes, not user-tested), wireframes, and an evaluation of each workflow element the owner asked about |
| 5 | Ranked feature shortlist and exclusions | [04-workflow-and-features.md, Part 2](04-workflow-and-features.md#part-2-additional-features) | Eight candidates scored; three Phase 3 additions ranked; what is deferred or excluded and why |
| 6 | Phased roadmap | [05-roadmap.md](05-roadmap.md) | Work items P1-01 to P1-17, P2-01 to P2-11 and P3-01 to P3-03 with acceptance criteria, the order of work, and decisions D1-D16 where the evidence disagreed |
| 7 | Phase 1 specification | [06-phase1-spec.md](06-phase1-spec.md) | Modules, data contract, as-of and time-zone policy, rule logic, states, safe rendering, generator changes, settings, test plan and the acceptance criteria for each P1 item |
| 8 | Open questions for the owner | [07-open-questions.md](07-open-questions.md) | Only the questions that need the owner's answer, each with the default the plan assumes |

Also in this folder:

- [HANDOFF.md](HANDOFF.md): a short implementation handoff (what to build first, the Phase 1 definition of done, how to
  run the checks, the constraints).
- [CODEX_REVIEW_PROMPT.md](CODEX_REVIEW_PROMPT.md): two ready-to-paste prompts for an independent review by OpenAI
  Codex, one before any production code and one for each implementation pull request.
- [08-redesign-coverage.md](08-redesign-coverage.md): which findings the redesign commit already addresses. It is being
  written separately and is not part of this audit's evidence.

Supporting folders:

| Folder | Contents |
|---|---|
| [scenarios/](scenarios/README.md) | Ten complete fictional data sets (01-planted-problems to 10-malformed-and-hostile-csv), each with `expected.json` (the Phase 1 result, with the arithmetic) and `scenario.md`, plus the shared `settings.json` and the recorded run against today's code. Today 01 and 02 match; 03 to 10 mismatch, as expected, and each mismatch is a reproduced finding. |
| [diagnostics/](diagnostics/) | 46 scripts (43 Node, 3 Python): baseline checks, one reproduction per audit area, the skeptics' verification scripts, research diagnostics, the hand-value check and the scenario builder and runner. [01-baseline.md section 8](01-baseline.md#8-how-to-re-run-every-diagnostic) gives the command for each audit script; [scenarios/README.md](scenarios/README.md) covers the three scenario scripts. |
| [evidence/](evidence/) | The raw record: `baseline.json`; `audit_<area>.json` and the skeptic's `verify_<area>.json` for csv, time, water, grazing, gain, healthbudget and render; `research_<topic>.json` and the citation checker's `cite_<topic>.json` for water, grazing, gain, health, budget, context and workflow. |
| [data/](data/) | The registries the documents are built from: `findings.json` (83 findings; stable IDs), `rules.json` (98 rules), `data-fields.json`, `integrations.json`, `sources.json`, their compact indexes, `findings-map.json`, and `registry-changelog.md` (the citation critic's pass and the review fixes). |
| [screenshots/](screenshots/) | Baseline screenshots of the reviewed commit: desktop full page, focus on a filter chip, a gain tooltip, and the phone layout. |

## What was verified, what the research concluded, what is recommended, and what is still assumption

Every document keeps these four kinds of statement apart. In short:

**Verified (reproduced, with evidence), all at the reviewed commit `cfd77e5`.**

- On its own example data the dashboard works: the 8 unit tests pass, the 10 planted problems appear worst first with
  a first step each, and six browser time zones give the same report
  ([01-baseline.md](01-baseline.md#2-what-works-well)).
- The audit registered 83 findings against the same code: 18 high, 28 medium, 37 low; 59 confirmed, 23 design
  limitations, 1 plausible ([02-findings.md](02-findings.md#11-all-findings)). An independent skeptic re-checked each
  audit area and refuted none of its findings. Four findings from the baseline run had no skeptic review and are
  marked confirmed because their measurement was reproduced; one more (`UI-18`) is a judgement call no skeptic
  reviewed, and stays plausible. The registrar re-ran the repro command of every high-severity finding on 2026-10-16 and
  every quoted output matched.
- Missing or broken data misleads: 8 of 32 single-file failures read as all-clear and 24 blank the page; 58 of 66 CSV
  cases mismatch; chart details cannot be reached by touch or keyboard
  ([01-baseline.md](01-baseline.md#33-passing-these-tests-is-a-baseline-not-proof)).
- The tests pass but do not pin the rules: deliberately broken copies of the water and grazing rules still pass
  ([TEST-01](02-findings.md#test-01), [TEST-02](02-findings.md#test-02)).

**Research conclusions (with citations).**

- No current ranch operating threshold is supported general guidance (class A). The 25% / 40% tank levels, 30-point
  drop, 24 hours of silence, planned graze days, 2-day grace, 80% / 50% of target gain, 2.0 / 1.0 lb/day targets,
  7-day due window and 5% / 10% budget bands are ranch choices (C) or demonstration settings (D)
  ([03-research-and-data.md](03-research-and-data.md#12-what-the-research-concludes)). Matching the 10 planted problems
  shows only that the rules find what the generator planted.
- The research supports the shape of better rules more than any number: hours of water from capacity and head count,
  grazing moves based on plant growth rather than calendar dates, gain judged only with a known weigh basis, a minimum
  interval and coverage, and budget compared month by month over closed months with percent and dollars together.
- Build validated CSV import before any integration; no live integration is recommended for Phase 1
  ([03-research-and-data.md section 5](03-research-and-data.md#5-csv-import-before-integrations)).
- 247 sources: 205 verified by the citation checker, 40 partly, 1 unverified, 1 failed. Vendor material is listed
  apart from independent sources, and no rule rests on vendor material alone.

**Recommendations.**

- The phases and work items in [05-roadmap.md](05-roadmap.md), the Phase 1 specification in
  [06-phase1-spec.md](06-phase1-spec.md), the morning workflow and the Phase 3 ranking in
  [04-workflow-and-features.md](04-workflow-and-features.md) (water supply coverage first, forage observations at moves
  second, a dated drought and precipitation snapshot third), and the decisions D1-D16 where the evidence disagreed.
- Every new number these documents propose is a demonstration setting, labelled that way, to be tuned per ranch.

**Unresolved assumptions and unchecked items.**

- No user testing was done; "about two minutes" is a design target.
- Real phones, screen readers, Firefox, WebKit and the live GitHub Pages site were not tested.
- Some figures are assumptions for illustration: the 3% weighing shrink, gallons per head per day, tank capacities.
- Whether Excel rewrites ISO timestamps on re-save, and how common reused tags or per-pasture tank names are in real
  exports, are inferred, not measured.
- Nothing in the roadmap or specification has been implemented or run against new code.
- The owner's open questions are in [07-open-questions.md](07-open-questions.md); the collected assumptions are in
  [02-findings.md section 7](02-findings.md#7-unresolved-assumptions-and-registry-disagreements),
  [03-research-and-data.md section 6](03-research-and-data.md#6-unresolved-assumptions-and-open-questions) and
  [05-roadmap.md section 7](05-roadmap.md#7-unresolved-assumptions-and-open-decisions).

## Not production-ready

The dashboard is not production-ready today, and completing Phase 1, or the whole roadmap, would not make it so.

- **It runs on fictional data.** Example Ranch and all of its records are generated by `scripts/generate_data.py`. A
  public data feed or a sourced threshold would not make it a real operation.
- **Its thresholds are not validated.** Every current threshold is a ranch choice or a demonstration setting.
- **It misreads ordinary data.** At the reviewed commit 18 high-severity findings are open: missing files read as
  all-clear, one bad row can blank the page, blank cells act as zero, and dates and IDs are mis-read. The redesign
  does not change `exceptions.js`, where most of their causes sit (see
  [08-redesign-coverage.md](08-redesign-coverage.md) for what it does claim to address).
- **It has not been tested where it would be used.** No real phones, screen readers, other browsers, live deployment
  check or user testing.
- **It has no shared records.** A static site cannot store acknowledgements, owners or crew notes that others can
  see; those stay deferred.

**This audit changed no production code.** Every audit commit on the work branch touches only files under
`docs/audit/`. When this page was written, before the redesign commit was added,
`git diff --stat cfd77e5 HEAD -- . ':(exclude)docs/audit'` printed nothing: `index.html`, `app.js`, `exceptions.js`,
`data/`, `scripts/`, `tests/`, `README.md` and `.github/` were exactly as reviewed. The redesign commit described
below is separate from the audit; it is the one commit in the pull request meant to change production files.

## The redesign commit

The same pull request also carries a **separate commit** that replaces `index.html` and `app.js` (and the README
screenshots) with a visual redesign the owner asked for: black background, green accent, charts drawn at their real
width, keyboard and touch chart reading, and phone layouts.

- `exceptions.js`, `data/`, `tests/` and `scripts/` are unchanged by it, and every number on the page is meant to stay
  identical.
- **Line numbers in the findings refer to the reviewed commit `cfd77e5`, not to the redesign.** For example,
  [SEC-01](02-findings.md#sec-01)'s nine `innerHTML` places (`app.js:28, :54, :68, :82, :104, :143, :170, :194, :198`)
  are positions in `cfd77e5`'s `app.js`. Read them with `git show cfd77e5:app.js`.
- Where 01-06 say the work branch "adds only `docs/audit/` files", they describe the branch before the redesign commit.
- Which findings the redesign already addresses is mapped in [08-redesign-coverage.md](08-redesign-coverage.md),
  written separately. A finding counts as fixed only when its acceptance test passes, not because the mapping says so.
- **Phase 1 work starts from the redesigned `app.js`.**
- The first Codex review checks the redesign commit on its own
  ([CODEX_REVIEW_PROMPT.md](CODEX_REVIEW_PROMPT.md)).

## Scope limits that apply everywhere

- All ranch data stays fictional and labelled as fictional.
- Health content stays on observation, scheduling, records and escalation to a veterinarian: no diagnosis, no
  treatment protocol, no dose.
- Investment and return-on-investment economics are out of scope; they belong to the separate Ranch Tech ROI project.
- The architecture stays a static site in plain HTML and JavaScript ES modules: no framework, backend, paid service or
  AI feature unless a demonstrated requirement justifies it.
