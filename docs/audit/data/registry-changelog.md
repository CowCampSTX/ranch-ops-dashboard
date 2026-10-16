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
