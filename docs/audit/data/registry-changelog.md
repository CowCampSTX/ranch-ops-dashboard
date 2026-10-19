# Registry changelog

## 2026-10-16: citation critic pass (critic-rules)

**Scope.** I checked `rules.json` (98 rules, 152 data fields, 47 integrations) and `sources.json` (247 sources) against the checker files `docs/audit/evidence/cite_*.json`. Both files were edited in place. The app code, data, tests and README were not touched, and nothing was committed.

### 1. Checks run and results

| Check | Result |
|---|---|
| A source marked `no` is used as support | None, with one documented exception. RULE-BUD-11 still cites U Alberta from `cite_budget.json checked[2]`, which is marked `no`. That `no` covers the favorable-variance rule and a data field. The same checker entry says the reforecast claim is supported (s.1.g). The source stays as `partly`, and its `supports` text now says it describes a university deficit-funding plan, not a ranch reforecast. |
| Every rule source matches its checker entry (URL, verification, metadata flag, note) | Matches on all 334 uses, apart from the BUD-11 exception above. |
| A `partly` source used for more than it supports | Found in 30 `supports` texts and in the matching evidence lines. All fixed (section 2). |
| Dates and data years | 5 fixed (section 3). Where the checker found no date, the entry says "undated". |
| A current threshold classified A | None. RULE-WF-01, -06 and -07 are current and class A. They are WCAG conformance criteria (shape+text, 24x24 px, 3:1), not ranch operating thresholds. No classification changed in this pass. Counts stay A 14, B 28, C 45, D 11. |
| Vendor claims labelled | 8 fixes (section 4). The MLA "Water monitoring in the digital age" report is re-kinded to vendor. |
| Health rules contain no treatment protocol | Pass. Dose, route and lot appear only as record fields that must "never be shown as instructions" (HLTH-04, -06, WF-16). Actions stay at observe, record, schedule and "call your veterinarian". WAT-13 (algae) and CTX-13 (tank disinfection) concern water, not animal treatment. |

**Re-opened with WebFetch (5 sources).** Each holds a number that a phase 1-3 recommendation depends on. The result is stored as `critic_recheck` on each use in `rules.json` and on the source in `sources.json`.

1. **NDSU AS1763, Table 1.** Lactating 900 lb cows drink 11.4 / 12.6 / 14.5 / 16.9 / 17.9 / 16.2 gal/head/day at 40-90F. Growing 600 lb cattle go from 5.3 to 12.7. Revised March 2021. Confirmed, and the 90F value is not the highest for lactating cows. Used by RULE-WAT-06 (phase 3).
2. **NRCS CPS 614 (Aug 2023).** "consider supplying additional daily water storage volume (3–5 days)" when windmill, solar or other unreliable power is used. The wording is "consider", not "shall". Leak and float checks appear under O&M. Confirmed. Used by RULE-WAT-09 (phase 3), which keeps class B with 3 days as a ranch-set target.
3. **BIF feed-efficiency guidelines.** "a minimum of a 70-d test period is required to accurately compute average daily gain for individual animals." Weigh twice at the start and twice at the end. Regression "may enhance the accuracy ... somewhat". Feed must be ad libitum. Confirmed. This led to a new correction on RULE-GAIN-07 (section 5).
4. **USDM home page.** Released "each Thursday at 8:30 a.m. Eastern Time". Data cutoff "each Tuesday at 8 a.m. EDT". Map released Oct 15 2026, data valid Oct 13 2026. Confirmed. Used by RULE-CTX-01 and -02 (phase 3).
5. **Ranchbot alert help page.** Warning "e.g. ... 40-50%", critical "e.g. ... 10-20%", rapid drop "e.g. 11.81 inches in 60mins". These are examples, not defaults (Kadee Petty, 2023-09-20). Confirmed. This supports labelling the 25%/40% values as ranch-set demo settings (RULE-WAT-01, -02, -03).

### 2. Overclaims removed (`partly` sources and the evidence text built on them)

**Water**
- WAT-05: SD TN9's ">1 mile to water" passage is about when season-long use can still allow recovery. The text no longer says such fields need herding or water relocation. Supplement placement is marked unconfirmed.
- WAT-06:
  - The SDSU 0.66-1 gal/lb DM figure is now credited to DiCostanzo and limited to feedlot animals.
  - "Intake doubles" now holds only for growing, finishing and bull classes; lactating cows rise about 1.4-1.6x.
  - The 16.2 vs 18.2 conflict is marked resolved: both published values are real.
  - The no-temperature fallback is no longer "90F column, conservative". It now uses the highest value in the class's row, which for lactating cows is 17.9 at 80F.
- WAT-12: nitrate 100 ppm is no longer called nitrate-N, because AS1764 does not state NO3 vs NO3-N.
- WAT-14: removed "MLA has its own product interest". The report is described as developer-authored. The sensor counts are a planned supply list.
- WAT-15: "BQA expects daily visual checks" is now "a BQA sample protocol template suggests daily checks". The assessment itself asks only for an adequate supply and a plan, and says nothing about sensors.
- WAT-04: the USU unit "will be sent back"; the text no longer says it was returned.

**Grazing**
- GRZ-01: G1908 covers seeded native warm-season pasture, not tame pasture. The CARM gain reduction is 12-16% in the abstract and 11.7-16.2% in the results.
- GRZ-02: using CPS 528 for a destination-water check is now labelled an inference.
- GRZ-03:
  - The CPS 528 "longer rest before dormancy" line is now marked as a purpose-specific soil-health criterion.
  - Manske's rotation implies about 30-60 days of rest, not about 30.
- GRZ-06: the SD Grassland Coalition harvest efficiencies are corrected. The 25% figure comes from Smart 2010, and intensive rotation is planned at 40%, with 35% only as an example.
- GRZ-08:
  - MF3232's 1 lb/head/day is described traditional practice, not a recommendation.
  - Derner 2022 does not say gain tests forage quality.
  - Two evidence_corrections were added.

**Gain**
- GAIN-04: the "+4.88 to -2.11 lb/d" swing is no longer presented as native-range summer data.
- GAIN-10: the Data.gov dataset is not confirmed to be per animal.
- GAIN-01 and GAIN-06: the Watson 2013 quote is completed ("...to decrease variance between weights").
- GAIN-06: Derner 2014's main finding (shrink insensitive to environment) is now noted.
- GAIN-03 and GAIN-08: Reeves 2014 R2 refers to beef production per hectare, not per-head ADG.

**Health**
- HLTH-05:
  - OSU's 80% is "up to 80 percent of the herd", not "at the peak".
  - The NDSU 200-fly threshold names no species.
- HLTH-06: the processing map records where injections went, not "how much".
- HLTH-10: the text now says to keep the carcass cool, not "fetus and placenta".

**Budget**
- BUD-01, -02, -03, -06 and -11: U Alberta's thresholds are year-end values that trigger funding or carry-forward plans. They are not monthly alerts.
- BUD-03:
  - "Common institutional design" is replaced by "two non-agricultural examples that disagree".
  - "The structure is supported" is replaced by "no ranch, extension or agency source recommends it (C); the numbers are demo settings (D)".
- BUD-04:
  - GFOA does not list seasonality as a basis of comparison.
  - The rule now points to BUD-05 for the closed-month cut-off, so the C element no longer sits under an A rule.
- BUD-05: neither Edwards nor GFOA addresses closed months. A correction was added.
- BUD-09: the 2026 diesel spring peak (May 5.732) is now stated, and "rose sharply through the grazing season" is removed.
- BUD-11: FCSAmerica's NE/SD/IA/WY service area is not on the cited page.
- BUD-13: U Alberta (rejected for this rule) is no longer cited as support in the evidence text.

**Context**
- CTX-05: the annual Grass-Cast grid is XLSX, not CSV.
- CTX-09: the KFYR specialist's employer is not named, so the article is not evidence of NDAWN or Extension endorsement. The "6 MT stations" claim is removed.
- CTX-15: "Map courtesy of NDMC" applies to maps only.
- CTX-16: the Nebraska "Coming Soon" page is attributed correctly.

**Workflow**
- WF-03: "Escape failure is unambiguous" is qualified by SC 1.4.13's exception.
- WF-07: Understanding 2.4.7 never says "must be highly visible".
- WF-08: "leave gridlines faint" now applies only where the values are labelled.
- WF-09: the exida quote is now verbatim.
- WF-12 and WF-20: the merged exida metric quote is split into its two rows.
- WF-17: "frequently used" removed.
- WF-19: "suppression by design" is not an exida phrase.

### 3. Dates and metadata

- **BQA National Manual (8 uses).** The PDF is undated. Its newest data are the 2016 NBQA and a 1998-2017 series. It is likely superseded: NCBA announced an update on 2024-12-19, which corrects the earlier 2025-01-06 (a trade-press reprint date), and bqa.org now links a 2026 edition. The publisher line now says the PDF names no publisher. All uses are now consistent.
- **BQA Field Guide (2 uses).** Undated (the only year shown is a 1996 NRC table credit). Likely superseded by the 2026 file.
- **UNL IANR 2016 (CTX-07).** No writer is named; R. Eirich is quoted.
- **NMSU LoRaWAN (WAT-07).** The 2022-01-25 archive date is marked unverified.

### 4. Vendor labelling

- MLA "Water monitoring in the digital age" (WAT-14) is now kind `vendor`. It is developer-authored, and MLA appears only as funder and publisher.
- "(vendor)" was added to statements from Ranchbot, Farmbot, Myriota/LoneStar, Gallagher and Tru-Test in WAT-01, WAT-04 and GAIN-11.
- exida is labelled as a consultancy white paper in WF-09, -10 and -18.
- The WAT-04 battery "recovers by itself" claim is now attributed to vendor battery pages and marked as not independently tested.
- `evidence_mix` was recounted for every rule.

### 5. New finding from the re-check (RULE-GAIN-07)

BIF uses regression inside a test of at least 70 days. It does not say that a regression on 3 or more weights over a shorter span replaces the 70-day minimum, so this was added as an evidence correction.

The demo weigh-ins (2026-06-01, 07-20, 09-15) span 106 days, and the last interval is 57 days. A 70-day individual default is therefore met only by a method that uses all three weigh-ins. Per-animal ADG from the last interval alone, which the current individual rule uses for the six planted yearlings, would fall under it. I added this to the phase note. It was not tested.

### 6. Data fields and integrations

**Evidence URLs removed** (each the checker said has no bearing on the field), with a note on each:
- water.csv tank_id (NRCS 614)
- health.csv task (21 CFR 530.3)
- health.csv status (BQA)
- health.csv task_id (BQA)

`sources.json` moves these into `rejected_for_fields_or_integrations`.

**Notes added** where the source supports only part of the field: meta vet fields, responsible/vet_needed, head_done/head_planned, visual_checks, water.time, weights.tag, budget.budget, entry_type, fuel.gallons, planned_next_pasture, source_provenance and usdm_valid_date.

**Field text corrected:**
- intake fallback (not "90F conservative")
- forecast cadence (not stated)
- condition_score (the "not rangeland" restriction is an inference)
- usdm_pct (thousands separators are unsupported)
- NASS 4 pm time (from a 2007 document)
- eid (the 15-digit format is unsourced)
- fly_count (no species)
- supply_type ("before summer" removed)
- sensor_offset (vendor validation)

**Integrations corrected:**
- SD Mesonet: cost not stated; the 5-minute updates are attributed to the weather page.
- ARS heat maps: "daily intent" removed; Drovers says weekly.
- Gallagher: the quote is now verbatim.
- Grass-Cast: the CC BY licence is attributed to the Data.gov page.
- NDAWN: station counts are unverified.
- Nebraska Mesonet: the "63" figure and "Request Data" are unverified.
- PRISM: cost and commercial-use terms are not in the cited PDF. Verification is now `partly`.
- NASS: the 4 pm release time comes from a 2007 document.
- RAP: the licence quote is from the products page.

**sources.json**
- Metadata for 5 sources is synced with `rules.json`.
- `critic_recheck` was added to the 5 re-opened sources.
- The note now explains why the Cornell onboarding page is kept with `failed`: it is rejected for its only use.
- The count stays at 247: 246 URLs cited in the registry plus that one rejected-only page. The registrar's note said 246.

### 7. Unresolved, and left as stated

- The BQA 2026 manual has not been read (the checker's fetches failed). Every BQA-based A or B rule (HLTH-08, WF-16 and others) rests on a likely superseded edition.
- The RCC ACIS page rendered empty, so it stays `unverified`. The PRISM /orders terms have not been checked.
- The BUD-11 U Alberta use stays `partly` (see section 1).
- Classes were not changed in this pass. The registrar's 30 stricter reclassifications were checked against the disputes and are consistent with them.
- `docs/audit/diagnostics/registry.extra.mjs` (untracked, not created by this pass) was left alone.

## 2026-10-19: Review fixes (editor pass after the consistency and recalculation reviews)

This pass changed only audit documents, the scenario builder and the files it writes. `findings.json`, `rules.json`,
`sources.json` and the other registry files were **not** edited: the consistency review treated them as read-only.
Section 4 lists the registry wording that is now out of step, for the registry's owner. No CSV file in any scenario
folder changed. Finding, rule, P-item, decision and fixture IDs are unchanged.

### 1. Consistency review

| # | Issue (severity) | What changed |
|---|---|---|
| 1 | SEC-01 places to change; no tooltip test (must-fix) | 06 section 7 now lists the 9 registry places by line (`app.js:28, :54, :68, :82, :104, :143, :170, :194, :198`). It names the water tooltip at `:104`, which sets `tip.innerHTML` itself, and calls 143 and 194 tooltips. Chart labels (`text()`, `textContent`, `app.js:16-18`) are marked already safe; the chips (`:62`) and rules table (`:216`) are marked as holding no CSV text. New P1-13 item 6 (browser) hovers the water, grazing, gain and budget charts with injected names. 06 section 7 and 05 P1-13 point to it. |
| 2 | Fixtures that contradict section 5.2 once `tanks.csv` exists (must-fix) | 06 section 11.2 has a new "What each fixture replaces" paragraph covering three kinds of case: committed data plus a change, inline water rows, and render.repro's set. The render.repro set now gets a time zone and a `tanks.csv`. 06 section 5.2 says a tank found only in water.csv takes the pasture of its newest reading, and its readings elsewhere give `REF_PASTURE_MISMATCH`. P1-07 items 7 and 8 are restated per tank (W-01 "for T1"; W-11 "for T9", with its tanks.csv contents). P1-14 item 6 gives B-03's and R17's contents, and P1-14 item 5 does the same for R13. P1-17 item 1(2) now gives the reading count (two readings) and says what a single reading at 19:00 would give. 05 P1-07 matches. |
| 3 | No-zone severity drops T2 (should-fix) | Applied the reviewer's first option: without a zone, steps 1, 2 and 4 still run, and every other tank gets step 4's severity, so T2 and T4 stay critical. Changed: 06 section 5.2 (also covers a date-only `as_of`), the 11.2 inputs row (now lists every tank), the section 13 row and section 15. |
| 4 | Acceptance bar ignores D7 (should-fix) | 02's acceptance bar now states the D7 exception: T6 is a CAN'T TELL row, still serious. 04's acceptance-bar sentence and mock also show T6 as CAN'T TELL. That 04 change was not raised by the reviewer. |
| 5 | Budget statements that stop holding under D2 (should-fix) | 02: a note under BUD-01, a note on 7.1's last item and a qualified 7.2 item 1 each say "under today's percent-only rule". Under D2, Repairs at \$720 becomes a warning; D1 avoids that. 7.2 items 1-6 each name the decision that settles them. |
| 6 | "Highest minus last" credited with catching a refilled fall (should-fix) | 02 7.2 item 6 is rewritten: only the maximum drawdown gives 40 points for W-03; "highest minus last" gives 4. 02's WAT-03 proposed fix now names only the maximum drawdown (D5), with a note on the registry's wording. settings.json has a `phase_1` note on the drop setting. |
| 7 | Scenarios README out of date (should-fix) | Recommendation 3 lists the D16 inputs: `books_closed_through`, and `weigh_sessions.csv` with `weight_basis`. Section 4 marks items 1-5 as settled (D1, D2, D5, D6, D15, D16); item 6 stays open. The README now says scenario.md files are hand-written and not regenerated by the builder, and has a settings paragraph. settings.json (there is one, shared) has `phase_1` notes. |
| 8 | Group with no current stay lets grazing read OK (should-fix) | Applied the reviewer's second option and added an info note. 06 section 5.3 adds `GROUP_NO_CURRENT_STAY` (info) and calls the case a known exception to section 6.2, deferred to GRZ-07 (P2-08); it is also in the 4.2 issue table. 06 6.2, 05 2.1 item 3 and 05 P1-08 say the same, and there is a new P1-08 item 8 test. Declined: the warning-level data issue. A closed last stay can mean the group was shipped or drylotted (GRZ-07's severity policy), so a warning would be a false alarm on a ranch that ships groups. |
| 9 | index.html "already contains" (nit) | Reworded to "Phase 1 changes index.html so that ...". |
| 10 | Test-case labels look like finding IDs (nit) | 06 section 12's intro and 05's naming note give the convention. Labels that collide are written with their script: `csv.repro:CSV-07`, `water.repro:B-03`, `grazing.repro:GB-09`, `time.repro:TIME-18`, `time.repro:TIME-D1`, `time.browser:TB-04`, `render.repro:R13`/`R17`, `csv.verify:CV-03`. Deviation: the reviewer suggested `render.repro:B-03`, but render.repro.mjs has no B-03. The case is water.repro.mjs's (line 390), and csv.browser.mjs has a different B-03. |
| 11 | settings.json classes and undocumented differences (nit) | Changed in the builder: `plannedGrazeDays` is now C and `unbudgetedUsd` is D (structure C), matching 06 section 9. The note says the values predate Phase 1. `phase_1` notes cover the drop, the coverage minimum (0.8), the individual interval (D6), the 10% bound (D2) and closed months (D1, D16). 06 11.2 says this as well. |
| 12 | "no network request at load" (nit) | 05 P3-03 now says "no request to any other origin at load (it still fetches its own CSV files)". |
| 13 | Rain gauge stretches addition 3 (nit) | 04 (in two places), 05 P3-03 and 05's Phase 3 rules table now mark the rain-gauge record and drought-plan prompts as an optional, later part of addition 3. `rules.json` RULE-CTX-10 is not edited; see section 4. |
| 14 | `npm ci` with no lock file (nit) | 06 section 11.4 adds `package-lock.json` next to `package.json`. |
| 15 | Two wordings for unbudgeted spend (nit) | The on-screen string is now 06 5.6's: "\$500 spent with no budget, season to date through 2026-09". 05 P1-12 uses it, and 02 BUD-03 has a note. The test checks only "\$500" and the absence of NaN and Infinity, so it is unaffected. |

### 2. Recalculation review

| # | Issue (severity) | What changed |
|---|---|---|
| 1 | 04 water tile only bounded (should-fix) | Pinned at `ok` 2, `of` 8, `need_look` 6; 04 scenario.md reads "2 of 8 OK (T5, T7); 6 need a look". The builder's reference sweep no longer counts a tank with a "not enough recent history" row as OK; that was why the bound had been 3. |
| 2 | Budget tile flips 03 to under budget (should-fix) | Applied the first option in 06 5.6: a budget counts only when that month's actual is valid. Folder 03's tile is pinned at pct 1.0161, \$87,783 of \$86,900, and 03 scenario.md shows the arithmetic. 06 P1-12 item 10 and 05 P1-12 are added. The sweep uses the same rule. Declined: leaving CAN'T TELL categories out of both sums. Under that option, BUD-02's case (Hay, blank budget, \$500 valid actual) would lose its expected "+1.6%" and "\$89,803 of \$88,400". The committed tile is unchanged under the option applied: +1.0%, \$89,303 of \$88,400. |
| 3 | 09 "every threshold, one step either side" overclaim (should-fix) | Reworded in 09 scenario.md, which lists the boundaries with a neighbour, those without, and those in no folder, and in 09 expected.json `purpose` (builder), the README row and the 06 11.2 row. 06 11.2 also leaves the uncovered lines to the section 11.1 unit tests. Declined: adding the missing cases. That would change folder 09's CSVs and expected rows; the reviewer's first option allows documenting the gaps instead. |
| 4 | Spec misstates 01's no-zone effect (nit) | The 06 11.2 row now says every tank is CAN'T TELL "Time zone not set", the water tile reads 0 of 8, and the table has 15 rows. The reviewer's counts (0 critical, 13 serious) are superseded by consistency issue 3's fix: T2 and T4 stay critical, giving 2 critical, 11 serious and 2 warning (8 can't tell). |
| 5 | 06 GAIN-Y ignores the same-day mean (nit) | Fixed in the builder. GAIN-Y reads 16609 / 8550 = 1.94257 (Y001's 851 and 853 averaged to 852). The absent-row reason is "pooled 1.9426 >= 1.6". Y001-DUP adds the mean case. 06 scenario.md matches. |
| 6 | gainMinCoverage basis (nit) | Reworded with the reviewer's text, in settings.json (builder) and in 06 scenario.md. |
| 7 | 09 FEED "just under \$2,500" (nit) | Reworded: the \$2,500 line cannot change this row, and this folder does not test it. 09 scenario.md matches. |

### 3. Other edits made with these fixes

- 01, 08 and 09 scenario.md and expected.json `open_decisions`: each now names the 05 decision that settles it.
- 06 header note: the 2026-10-19 review fixes revised expected.json in 03, 04, 06, 08 and 09, and settings.json.
- 02 section 8 sources: this changelog now also covers the review fixes.

### 4. Registry wording flagged for the owner (not edited)

- `findings.json` `policies.phase_1_acceptance` needs the D7 exception: T6 is a serious CAN'T TELL row.
- `findings.json` BUD-01 `proposed_fix` ("both still serious") and the `unresolved_assumptions` entry ("the same either way") hold only under today's percent-only rule. Under D2, Repairs becomes a warning.
- `findings.json` WAT-03 `proposed_fix` offers "max level in that window minus the last level (or the max drawdown inside it)". Only the maximum drawdown passes WAT-03's own regression test (W-03, 40 points), and it is decision D5.
- `findings.json` BUD-03's expected wording "no budget line" differs from the Phase 1 string "\$500 spent with no budget, season to date through 2026-09".
- `rules.json` RULE-CTX-10 `phase_note` should mark the drought-plan prompt as an optional, later part of feature addition 3.

### 5. Verification run in this pass

- `python3 -I docs/audit/diagnostics/scenarios.build.py`: "all scenarios consistent with the reference sweep". A second rebuild reproduced every folder byte for byte.
- `node docs/audit/diagnostics/scenarios.run.mjs` (node mode) and the browser mode: the summary tables are the same as before the fixes, with the same MATCH and MISMATCH verdicts and counts. `scenarios/run-output.txt` was regenerated; only the expectation text changed. `run-results.json` was not rewritten.
- `node --test tests/exceptions.test.mjs`: 8 pass, 0 fail.
- Relative links under `docs/audit/`: 2,652 checked, 0 broken.
- None of this validates any threshold; they remain demonstration settings.
