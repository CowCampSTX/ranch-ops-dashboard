# 07. Open questions for the owner

These are the questions only the owner can answer. Each one can be answered in a word or a line. Each also gives the
**default** the plan follows if no answer comes, so work is never blocked waiting for a reply.

Everything else that was open has either been decided in [05-roadmap.md section 1.4](05-roadmap.md#14-decisions-this-roadmap-makes-where-the-evidence-disagrees)
(decisions D1-D16, any of which the owner can reverse) or is a technical choice left to the lead developer
([06-phase1-spec.md section 15](06-phase1-spec.md#15-open-decisions-and-assumptions)). The dashboard stays a
demonstration on fictional data whatever the answers; none of them makes it production-ready.

## Quick answer sheet

| ID | Question | Answer with | Default if unanswered |
|---|---|---|---|
| [OQ-01](#oq-01-the-ranchs-time-zone) | Which time zone does the example ranch keep its clock in? | A zone name | America/Chicago (Central) |
| [OQ-02](#oq-02-cattle-classes-and-the-heifer-gain-alert) | Keep the three cattle classes and the planted heifer gain alert? | Keep / change later | Keep for Phase 1, labelled as a demo setting |
| [OQ-03](#oq-03-the-silent-tank-t6) | Show the silent tank T6 as CAN'T TELL or as an ordinary alert? | CAN'T TELL / alert | CAN'T TELL, still serious |
| [OQ-04](#oq-04-budget-dollar-lines) | Are the demo budget dollar lines acceptable? | Yes / your numbers | \$500 warning, \$1,000 serious, \$2,500 any percent, \$250 unbudgeted |
| [OQ-05](#oq-05-when-the-books-close) | At the Sep 30 snapshot, is September a closed month? | Yes / no | Yes |
| [OQ-06](#oq-06-anything-remembered-on-one-device) | Should the page remember anything on one device? | Yes / no | Yes, labelled "this device only" |
| [OQ-07](#oq-07-a-stopwatch-test-for-the-morning-review) | Can you arrange a stopwatch test with 2-3 ranch managers? | Yes / no | No review time is claimed anywhere |
| [OQ-08](#oq-08-a-dated-public-drought-snapshot) | Add a dated public drought snapshot, and for which stand-in county? | Yes + county / no | Kept as the third addition, but not started until a county is named |
| [OQ-09](#oq-09-which-phase-3-addition-comes-first) | Water supply coverage first, or forage observations first? | Water / forage | Water first |
| [OQ-10](#oq-10-a-test-only-browser-dependency) | May CI use a pinned, test-only Playwright dependency? | Yes / no | Yes |
| [OQ-11](#oq-11-readme-edits-in-phase-1) | May Phase 1 pull requests edit README.md and retake its screenshots? | Yes / show me first | Yes, only the changes listed in 06 section 10.2 |
| [OQ-12](#oq-12-fictional-demo-only-or-real-data-later) | Public fictional demo only, or might it run on a real ranch's data later? | Demo only / real later | Demo only |
| [OQ-13](#oq-13-merging-the-redesign-pull-request) | Merge the redesign pull request (#2) before Phase 1 starts? | Yes / not yet | Phase 1 waits for the first Codex review and your merge |

## Data and time

### OQ-01: The ranch's time zone

**Question.** Which time zone should the example ranch keep its clock in? Answer with a zone name, for example
`America/Chicago` (Central) or `America/Denver` (Mountain).

**Why it matters.** Today the page reads times in whatever zone the viewer's browser is set to, so silent-sensor
hours, the 24-hour drop and day counts can change with the viewer ([TIME-02](02-findings.md#time-02),
[TIME-03](02-findings.md#time-03)). Phase 1 fixes this with one ranch zone in `meta.csv`, used for every rule and for
the header ([06-phase1-spec.md section 3.3](06-phase1-spec.md#33-as-of-and-time-zone-policy)). The policy itself
(ranch time, never the viewer's) is settled; only the zone needs your answer.

**Default.** `America/Chicago`. The header reads "Data as of Sep 30, 2026, 6:00 PM CDT (America/Chicago)" with a
"Fictional snapshot, not live" badge. Choosing another zone changes the header, the browser smoke test's "CDT" check
and scenario 08's "-05:00" offset. The 10 planted problems should not change, because the example data carries no
offsets and is read as ranch wall-clock time (reasoning, not tested).

## Demo content

### OQ-02: Cattle classes and the heifer gain alert

**Question.** Should the demo keep its three classes (180 cow-calf pairs, 45 first-calf heifers, 150 yearling steers)
and its planted alert "Heifers: 0.44 lbs/day ... vs 1.0 target"?

**Why it matters.** The research classes the 1.0 lb/day heifer target as a demonstration setting with no source, and
warns that published Plains studies report about -0.15 to +0.8 lb/day as typical for lactating young cows, so "an
experienced ranch reader would see the planted 'heifers gaining well under target' alert as a likely false alarm"
([RULE-GAIN-04](03-research-and-data.md#rule-gain-04)). It recommends judging first-calf heifers by body condition
instead, which is part of a deferred module ([RULE-CTX-12](03-research-and-data.md#rule-ctx-12)). Phase 1 must keep
all 10 planted problems with the same severities, so this alert cannot change in Phase 1.

**Options.** (a) Keep it in Phase 1, labelled "Demo setting (D)", and revisit after Phase 1. (b) Keep it in Phase 1,
then replace it in a later phase with a different planted problem; that changes `PLANTED`, the README and the
acceptance bar, so it needs your sign-off.

**Default.** (a). Related: the minimum gap between weigh-ins for judging one animal is set at 42 days (a demo setting,
decision D6) so the six planted slow yearlings stay visible; the research's 70-day figure comes from controlled feeding
tests and is shown in the rules table but not used ([RULE-GAIN-07](03-research-and-data.md#rule-gain-07)).

### OQ-03: The silent tank T6

**Question.** Tank T6 has sent no reading for 42 hours. Should its row show the CAN'T TELL marker (still serious, same
text), or stay an ordinary serious alert?

**Why it matters.** Phase 1 treats "no reading" the same way for every tank: silent, never reported, or last reading
not a level. That makes T6 the only CAN'T TELL row on the committed data, which is an exception to the findings
registry's acceptance wording (decision D7 in [05-roadmap.md](05-roadmap.md#14-decisions-this-roadmap-makes-where-the-evidence-disagrees)).

**Default.** CAN'T TELL, severity serious, text "No reading for 42 hours; last level 98.5% at 2026-09-29 00:00". The
counts stay 2 critical, 6 serious, 2 warning either way.

## Budget

### OQ-04: Budget dollar lines

**Question.** Are these demo dollar lines acceptable? Or give your own numbers, or say "share of the season budget".

**Why it matters.** Today the budget rule uses percent alone, so \$30 over on \$200 is serious while \$9,500 over on
\$100,000 is only a warning ([BUD-04](02-findings.md#bud-04)). The research found no ranch, extension or agency source
for any percent or dollar line; the combined structure is a management choice and the numbers are demonstration
settings ([RULE-BUD-03](03-research-and-data.md#rule-bud-03)).

**Default** (decision D2, all labelled demo settings): serious when more than 10% **and** at least \$1,000 over; warning
when at least 5% and at least \$500 over, or at least \$2,500 over at any percent; a warning for \$250 or more spent
with no budget. With these, Fuel (\$2,040, 21.3% over) and Repairs (\$1,800, 25.0% over) stay serious. The research
also offers dollar lines set as a share of the total season budget (for example 0.5% and 1%, also demo values). If you
choose other numbers, the planted Fuel and Repairs rows must still come out serious.

### OQ-05: When the books close

**Question.** At the Sep 30, 6:00 PM snapshot, should September count as a closed month in the example ranch's books?

**Why it matters.** Phase 1 compares the budget over closed months only ([BUD-01](02-findings.md#bud-01),
[RULE-BUD-05](03-research-and-data.md#rule-bud-05)). If September is left open, Repairs is \$720 over (13.3%) for June
to August, under the \$1,000 serious line, so the planted Repairs row would fall from serious to warning and break the
Phase 1 acceptance bar.

**Default.** Yes. The generator writes `books_closed_through = 2026-09` in `meta.csv` (decision D1).

## Workflow (Phase 2)

### OQ-06: Anything remembered on one device

**Question.** Do you want the page to remember anything on one device: a "Seen" mark and a short note per row
([P2-11](05-roadmap.md#p2-11-optional-per-device-acknowledgements-and-notes)), and "new since your last review" and
"resolved since" counts (P2-02)?

**Why it matters.** A static site cannot save anything others can see. Browser storage belongs to one browser on one
device, can be cleared, and leaves no record the crew can check ([RULE-WF-15](03-research-and-data.md#rule-wf-15)).
Marking a row "seen" must never clear it ([RULE-WF-11](03-research-and-data.md#rule-wf-11)).

**Default.** Yes, as specified: labelled "this device only"; a mark never hides, clears or re-ranks a row; a condition
that clears and returns shows as new; the page works fully when storage is empty or blocked. If you answer no, P2-11
is dropped and P2-02 shows no new or resolved counts; nothing else changes. Shared acknowledgements, owners and history
stay deferred either way.

### OQ-07: A stopwatch test for the morning review

**Question.** Once the Phase 2 morning view exists, can you arrange for 2-3 ranch managers to try it with a stopwatch?

**Why it matters.** "About two minutes" is a design target. No user testing was done
([RULE-WF-18](03-research-and-data.md#rule-wf-18)).

**Default.** No review time is claimed on the page or in the README until such a test is recorded.

## Phase 3

### OQ-08: A dated public drought snapshot

**Question.** Should Phase 3 show a dated drought and precipitation snapshot from public data beside the fictional
ranch? If yes, which real county should stand in for it?

**Why it matters.** It gives context a Northern and Central Plains reader expects, but it carries the most risk of
making the fictional ranch look real ([RULE-CTX-15](03-research-and-data.md#rule-ctx-15)). Any choice of county is
arbitrary and must not imply a real ranch. Hughes County, South Dakota was used during the research only to test data
services; it is not a recommendation.

**Default.** Kept as the third addition ([P3-03](05-roadmap.md#p3-03-rank-3-drought-and-precipitation-context-as-a-dated-snapshot)),
but not started until you name a county; the builder will not choose one for you. Without an answer, Phase 3 delivers
the first two additions only. If built, it is labelled "Public data: <County>, <State>; ranch data fictional", pinned
to the as-of date, committed as a snapshot, never fetched live, and includes no SD Mesonet data
([RULE-CTX-16](03-research-and-data.md#rule-ctx-16)).

### OQ-09: Which Phase 3 addition comes first

**Question.** Water supply coverage from tank capacity and head count first, or forage observations at moves first?

**Why it matters.** Water ranks first because a water failure is the most urgent animal-welfare risk the page covers.
The research notes that forage observations could move to first place if credibility with Plains ranch managers is
weighted above same-day usefulness
([03-research-and-data.md section 1.4](03-research-and-data.md#14-research-view-of-the-three-phase-3-additions-recommendation)).

**Default.** Water first, as in [05-roadmap.md section 5](05-roadmap.md#5-phase-3-add-later).

## Project

### OQ-10: A test-only browser dependency

**Question.** May the repository gain a `package.json` and `package-lock.json` that pin Playwright as a development
dependency, used only by the CI browser smoke test?

**Why it matters.** The repository has no dependencies today. Several Phase 1 acceptance criteria are browser checks
(a failed file shows a banner, no injected markup, the same rows in another locale and zone;
[06-phase1-spec.md section 11.4](06-phase1-spec.md#114-browser-smoke-test)).

**Default.** Yes ([05-roadmap.md section 2.1](05-roadmap.md#21-apply-from-phase-1-immediately), item 12). The page
itself still loads nothing from npm and has no build step. If you answer no, the browser checks are run by hand with
the audit's scripts and the results are recorded in each pull request.

### OQ-11: README edits in Phase 1

**Question.** May Phase 1 pull requests edit `README.md` and retake its screenshots, or do you want to approve the
wording first?

**Why it matters.** The README is the portfolio's front page. Phase 1 changes some of the page text it quotes ("Water
tanks OK" becomes "Sensors normal", "here now" becomes "there as of <date>"), and some README claims ("works on a
phone", "replace the CSVs with exports in the same columns") would no longer be accurate
([06-phase1-spec.md section 10.2](06-phase1-spec.md#102-page-copy-changes)).

**Default.** Yes, limited to the changes listed in 06 section 10.2, in the same pull request as the code they describe,
and reviewed by you before merge like every other change.

### OQ-12: Fictional demo only, or real data later

**Question.** Will this page only ever show fictional data in public, or might it later run privately on a real
ranch's exports?

**Why it matters.** Phase 1 makes the page read real-shaped exports honestly, but a real deployment would raise needs
the plan defers: shared records, access control and private hosting
([04-workflow-and-features.md section 1.6](04-workflow-and-features.md#16-what-a-static-site-can-remember)).

**Default.** Public fictional demo only. If the answer is "real data later", those needs get their own plan; nothing
in Phases 1 to 3 adds a backend or a shared store.

### OQ-13: Merging the redesign pull request

**Question.** The audit was merged in pull request #1. Will you merge the redesign pull request (#2) into main before
Phase 1 starts?

**Why it matters.** Phase 1 work must start from the redesigned `app.js` ([HANDOFF.md](HANDOFF.md)). Nothing is merged
or deployed without you.

**Default.** Phase 1 waits for the first Codex review ([CODEX_REVIEW_PROMPT.md](CODEX_REVIEW_PROMPT.md), Checkpoint 1)
and your merge, then each Phase 1 pull request branches from main. If you would rather not merge yet, Phase 1 branches
from the redesign pull request's branch and its pull requests stack on it.
