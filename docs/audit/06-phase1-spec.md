# 06. Phase 1 developer specification

This is the developer-ready specification for **Phase 1: Fix now** of the [phased roadmap](05-roadmap.md). It says what
to build for work items P1-01 to P1-17: module boundaries, the data contract for every file, the validation and result
models, the exact rule logic with its boundaries and wording, loading and error states, safe rendering, the generator
changes, configuration, the test plan and the acceptance criteria for each item.

The dashboard is a portfolio demonstration on fictional data (Example Ranch). Phase 1 makes it read real-shaped exports
honestly; it does **not** make it production-ready. Every threshold in this document is a demonstration setting (D) or a
ranch choice (C), not validated guidance, and is labelled that way on the page. Health content is limited to
observation, scheduling, records and escalation to a veterinarian.

| Item | Value |
|---|---|
| Commit reviewed | `cfd77e50a050163b542cadfc6b38882c0341e99d` (main when the audit was written). Phase 1 branches from main after the documentation pull request that adds this section and `docs/audit/redesign/preserve.mjs` is merged; its page files are those of `0315d09`, which adds the redesigned `index.html` and `app.js` (pull request #2); see [section 1.2](#12-non-goals) and [section 6.3](#63-accessibility-and-layout-kept-from-the-redesign). |
| Built from | [05-roadmap.md](05-roadmap.md) (work items and decisions D1-D16), `docs/audit/data/findings.json`, `rules.json`, `data-fields.json`, `integrations.json`, the code at the reviewed commit, and [02-findings.md](02-findings.md) / [03-research-and-data.md](03-research-and-data.md). The page terms and the keep-list come from the redesigned page on main at `0315d09`, [08-redesign-coverage.md](08-redesign-coverage.md) and the preserve checks in `docs/audit/redesign/preserve.mjs`. |
| Project guidance files | [AGENTS.md](../../AGENTS.md) at the repository root (added 2026-10-20; `CLAUDE.md` imports it), with the project status in [docs/project/STATUS.md](../project/STATUS.md). The reviewed commit had no PROJECT_CONTEXT.md or AGENTS.md. |
| Scenario files | `docs/audit/scenarios/`: 10 end-to-end folders (01-planted-problems to 10-malformed-and-hostile-csv), each with CSV files, `expected.json` and `scenario.md`, plus `settings.json`. A parallel audit step wrote them while this specification was being finished; they are committed on the work branch only in the work-in-progress commit `b548e4f` and were read on 2026-10-19. The 2026-10-19 review fixes then revised `expected.json` in 03, 04, 06, 08 and 09 and `settings.json` (no CSV changed; see `data/registry-changelog.md`, "Review fixes"). Section 11.2 says how Phase 1 runs them, which inputs must be added first (decision D16), and where their settings differ from section 9. The audit's single-change test cases (W-02, GN-07 ...) are built under `tests/fixtures/`. |
| Not verified | The published GitHub Pages site (proxy 403). Only Chromium was used in the audit. Nothing in this document has been implemented. The selectors and values that describe the redesigned page (sections 5.1 to 5.6, 6.1 to 6.3, 7, 10.2, 11.4 and 12; the `app.js` function names and line numbers are from reading the code on main) were measured with Playwright Chromium on main at `0315d09` on 2026-10-20; real phones, screen readers, Firefox and WebKit were not tested. |

Statement types follow the roadmap: **verified findings** carry a finding ID and quoted evidence; **research
conclusions** carry a RULE ID and class; everything else here is a **recommendation**; open points are in
[section 15](#15-open-decisions-and-assumptions). Names such as W-02, GN-07 or CSV-35 are audit test-case IDs from the
diagnostics scripts, not finding IDs.

## Contents

- [1. Goals and non-goals](#1-goals-and-non-goals)
- [2. Architecture](#2-architecture)
- [3. Data contract](#3-data-contract)
- [4. Validation result model](#4-validation-result-model)
- [5. Area results and rule logic](#5-area-results-and-rule-logic)
- [6. Loading, error, empty and partial states](#6-loading-error-empty-and-partial-states)
- [7. Safe rendering](#7-safe-rendering)
- [8. Generator changes](#8-generator-changes)
- [9. Configuration](#9-configuration)
- [10. Rules table and page copy](#10-rules-table-and-page-copy)
- [11. Test plan and CI](#11-test-plan-and-ci)
- [12. Acceptance criteria per P1 item](#12-acceptance-criteria-per-p1-item)
- [13. Migration and compatibility](#13-migration-and-compatibility)
- [14. What Phase 1 does not include](#14-what-phase-1-does-not-include)
- [15. Open decisions and assumptions](#15-open-decisions-and-assumptions)
- [Sources](#sources)

---

## 1. Goals and non-goals

### 1.1 Goals

1. **Read ordinary exports correctly.** RFC 4180 CSV, UTF-8 with a Windows-1252 fallback, any common line ending,
   trimmed cells, skipped blank and repeated-header rows ([CSV-01](02-findings.md#csv-01), [CSV-02](02-findings.md#csv-02),
   [CSV-05](02-findings.md#csv-05), [CSV-07](02-findings.md#csv-07)).
2. **One typed data contract per file.** Required columns, types, ranges, IDs as strings, blank means missing,
   references and duplicates checked; every rejected value is a visible data issue ([CSV-03](02-findings.md#csv-03),
   [CSV-04](02-findings.md#csv-04), [CSV-06](02-findings.md#csv-06), [DATA-01](02-findings.md#data-01),
   [DATA-03](02-findings.md#data-03)).
3. **One as-of policy with a ranch time zone.** The same files give the same rows for every viewer
   ([DATA-02](02-findings.md#data-02), [TIME-01](02-findings.md#time-01), [TIME-02](02-findings.md#time-02),
   [TIME-03](02-findings.md#time-03)).
4. **Three states.** Every area and subject is OK, needs attention, or CAN'T TELL; missing, stale, invalid or
   insufficient data is never shown as all-clear ([LOAD-01](02-findings.md#load-01)).
5. **No blank page.** A loading state, a visible error naming any failed file, and sections that fail on their own
   ([LOAD-02](02-findings.md#load-02), [LOAD-03](02-findings.md#load-03), [LOAD-04](02-findings.md#load-04)).
6. **Rule fixes** in water, grazing, gain, health and budget that keep the 10 planted problems with the same severities
   and add no false alarm on the committed data ([05-roadmap.md section 3.1](05-roadmap.md#31-phase-1-acceptance-bar)).
7. **Safe rendering** of all CSV-derived text ([SEC-01](02-findings.md#sec-01)).
8. **Honest copy.** Thresholds labelled with their class; "as of <date>", never "here now"; rules that are not
   judged say so ([GRZ-06](02-findings.md#grz-06), [GAIN-13](02-findings.md#gain-13),
   [RULE-WF-20](03-research-and-data.md#rule-wf-20)).
9. **Tests that can catch a broken rule**, run under several time zones, plus a browser smoke test in CI
   ([TEST-01](02-findings.md#test-01), [TEST-02](02-findings.md#test-02)).

### 1.2 Non-goals

- No framework, bundler, backend, database, paid service, live integration or AI feature. No build step for the page.
- No new operating thresholds presented as validated. New numbers are demo settings (D) and say so.
- Phase 1 starts from the redesigned page on main (pull request #2, merge commit `0315d09`) and keeps what it already
  does: chart readings by pointer, touch and keyboard, the phone layouts, charts drawn at their real width, the tank
  cards and the budget table ([section 6.3](#63-accessibility-and-layout-kept-from-the-redesign)). These are not
  Phase 2 features.
- No new Phase 2 features: no filters beyond the area chips, no "Why this row?" panels, no freshness strip, no "Show
  data" tables, no print view, no rest checks, no consequence-aware ranking, no browser storage (see
  [section 14](#14-what-phase-1-does-not-include)).
- No change to the 10 planted problems or to the random draws that produce the example data.
- No treatment protocols, doses or diagnoses; no investment or ROI economics.

---

## 2. Architecture

### 2.1 Principles

- **Static site.** `index.html` loads `app.js` as an ES module; every other module is a plain ES module imported by
  relative path. GitHub Pages serves the files as they are.
- **Pure core.** `csv.js`, `time.js`, `schema.js`, `exceptions.js` and `format.js` have no DOM access, no `fetch`, no
  `Date.now()`, and no dependence on the viewer's locale or time zone (every `Intl` call passes an explicit locale
  `"en-US"` and an explicit `timeZone`). The same modules run in the browser and under `node --test`.
- **One direction of data.** bytes → text → records → typed dataset with issues → rule results → page. No rule reads
  raw CSV text; no renderer re-parses or matches rule output text. The redesigned page still matches it in three
  places: `tankAlert()` finds a tank's row by the subject prefix `Tank <id> (` (tank cards and water tile), `budget()`
  finds a category's row by its subject, and the Now grazing list matches "{group} in {pasture}"
  ([UI-04](02-findings.md#ui-04)). Phase 1 moves them to the rows' `refs` (section 5.1), so a wording change cannot
  drop a tank, budget or grazing pill.
- **Never throw past a boundary.** `load.js` never rejects; `buildDataset` and `evaluate` never throw on bad data (they
  return issues and CAN'T TELL results); each page section is drawn inside its own guard.

### 2.2 Modules

| Module | Kind | Exports (proposed) | Responsibility |
|---|---|---|---|
| `load.js` | browser I/O | `loadAll(names, fetchImpl = fetch)` | Fetches each CSV as bytes; returns `{ name: { status, httpStatus, bytes, message } }` with status `ok`, `missing` (404), `failed` (other HTTP error or network error), `empty` (0 bytes). Never rejects. |
| `csv.js` | pure | `decodeBytes(bytes, file)`, `parseCSV(text, file)` | Decoding and RFC 4180 parsing (section 3.1). Returns `{ text, encoding, issues }` and `{ header, records: [{ row, cells }], issues }`. No type conversion. |
| `time.js` | pure | `parseDate`, `parseMonth`, `parseStamp`, `wallTimeToInstant`, `ranchDate`, `daysBetween`, `hoursBetween`, `isValidZone` | Strict date and time parsing in the ranch zone (section 3.2). |
| `schema.js` | pure | `CONTRACT`, `buildDataset(files, options)` | Column matching, typing, required values, ranges, references, duplicates, as-of cut-off. Returns `{ meta, data, issues, fileStatus }`. |
| `exceptions.js` | pure | `RULES`, `RULE_INFO`, `evaluate(dataset, R = RULES)`, `tileSummary(result)`, `findExceptions(d, R)` (compatibility) | Area rules and the result model (section 5). |
| `format.js` | pure | `esc`, `fmtInt`, `fmtNum`, `fmtUsd`, `fmtPct1`, `fmtSetting`, `fmtBelow`, `plural`, `fmtStampHeader` | Fixed en-US formatting and HTML escaping (sections 7 and 10). |
| `app.js` | browser DOM | none | Starts from the redesigned `app.js` on main. Loading state, banner, summary card, tiles, exception table and chips, data checks panel, tank cards and their charts, grazing chart and Now grazing list, gain chart, budget table, rules table. Keeps the redesign's chart readings by pointer, touch and keyboard (`explore()`, `#tip`) and its redraw when the width changes (section 6.3). Each section in a guard. |

`findExceptions(d, R)` stays as a thin wrapper for the existing test file and any caller: it accepts the old shape (an
object of arrays of row objects), converts every value to a string, runs `buildDataset` and `evaluate`, and returns
`rows` mapped to the old `{severity, area, subject, problem, action}` shape (CAN'T TELL rows included, with their
severity).

### 2.3 Data flow

```
loadAll(FILES) ─► for each file: decodeBytes ─► parseCSV ─┐
                                                          ├─► buildDataset ─► evaluate ─► app.js renders
meta.csv (as_of, timezone, ...) ──────────────────────────┘        │              │
                                                         issues ◄──┴──────────────┘
```

`FILES` becomes: `meta.csv`, `pastures.csv`, `groups.csv`, `tanks.csv`, `moves.csv`, `weights.csv`,
`weigh_sessions.csv`, `water.csv`, `health.csv`, `budget.csv` (two new files, [section 8](#8-generator-changes)).

### 2.4 Which files each area needs

| Area | Required files | Optional files | If a required file is missing, failed, empty or has no usable rows |
|---|---|---|---|
| All | `meta.csv` | | Fatal for rules: every area CAN'T TELL; the rules table still draws. |
| Water | `water.csv`, `pastures.csv` | `tanks.csv` (fallback: tanks seen in water.csv, warning TANK_LIST_MISSING), `moves.csv`, `groups.csv` (for "there as of") | Water area CAN'T TELL; with `tanks.csv` present, every listed tank shows CAN'T TELL. |
| Grazing | `moves.csv`, `pastures.csv`, `groups.csv` | | Grazing area CAN'T TELL. |
| Gain | `weights.csv`, `groups.csv` | `weigh_sessions.csv` (without it every pair has an unknown basis, so the serious and individual flags are CAN'T TELL) | Gain area CAN'T TELL. |
| Health | `health.csv` | `groups.csv` (reference check only) | Health area CAN'T TELL. |
| Budget | `budget.csv` | | Budget area CAN'T TELL. |

A header-only file counts as "no usable rows" ([LOAD-01](02-findings.md#load-01)), except `tanks.csv`'s absence, which
falls back as stated.

---

## 3. Data contract

The contract is consistent with `data-fields.json` (43 Phase 1 required fields, 22 optional). Where this specification
departs from it, the departure is a decision in [05-roadmap.md section 1.4](05-roadmap.md#14-decisions-this-roadmap-makes-where-the-evidence-disagrees)
and is marked here.

### 3.1 Reading every file

**Decoding.** Strip a UTF-8 byte-order mark. Decode with `new TextDecoder("utf-8", { fatal: true })`; on failure decode
with `new TextDecoder("windows-1252")` and add issue `FILE_NOT_UTF8` (warning): "pastures.csv is not UTF-8; it was read
as Windows-1252. Save it as 'CSV UTF-8' to avoid wrong characters." ([CSV-07](02-findings.md#csv-07)).

**Records.** RFC 4180 with these allowances:

- A record ends at CRLF, LF or CR outside quotes; CR CR LF counts as one line end ([CSV-01](02-findings.md#csv-01):
  "doubled-CR line endings break whole files"). A line end at the very end of the file does not start a record (the
  generator's files end with CRLF, so they must not report a blank row).
- A field that starts with `"` is quoted: it may contain commas, line ends and doubled quotes (`""` is one `"`). Text
  after the closing quote and before the next comma is appended (lenient). A quote inside an unquoted field is kept as
  text.
- An unclosed quote at the end of the file is an error `CSV_UNCLOSED_QUOTE` naming the row where the quoted field
  began; the file is treated as unreadable.
- The separator is the comma only. When the header has one cell that contains `;`, the `COL_MISSING` message adds "This
  file looks semicolon-separated; save it as comma-separated (CSV)."

**Row numbers.** `row` is the 1-based position of the record in the file, counting the header and any blank or title
rows, which is the row number a spreadsheet shows.

**Header.** Header cells are trimmed and compared ignoring case. The header is the first non-blank record that contains
every required column of that file. Records before it (at most 5 are searched) are reported as `CSV_TITLE_LINE`
(warning, "row 1 looks like a title line, not the header; it was skipped"). If no record within the first 6 non-blank
ones qualifies, the first non-blank record is the header and each missing required column is a `COL_MISSING` error
("water.csv: column level_pct not found"). A column name that appears twice is `COL_DUPLICATE` (error; the first is
used). Unknown columns are `COL_UNKNOWN` (info) and ignored.

**Cells.** Every cell is trimmed of spaces and tabs ([CSV-05](02-findings.md#csv-05)). A record whose cells are all
empty (blank, whitespace-only, `,,,`) is skipped and counted in one `CSV_BLANK_ROWS` info issue per file
([CSV-02](02-findings.md#csv-02)). A record equal to the header (after trimming, ignoring case) is skipped and counted
in `CSV_REPEATED_HEADER` (info). A record with fewer cells than the header is padded with blanks (`CSV_SHORT_ROW`,
info, counted). A record with more cells than the header is rejected when any extra cell is non-empty
(`CSV_EXTRA_CELLS`, warning, per row); empty extra cells are ignored.

### 3.2 Types

| Type | Accepted text (after trimming) | Value | Rejected as |
|---|---|---|---|
| `id` | any non-empty text | the trimmed string, never a number ('007' stays '007') | `VALUE_MISSING` when required and blank |
| `text` | any text | string, or `null` when blank | |
| `int` | `^[+-]?\d+$`, or digits with correctly grouped thousands `^[+-]?\d{1,3}(,\d{3})+$` | integer | `VALUE_NOT_NUMBER` |
| `number` | as `int`, with an optional decimal part `\.\d+`; no exponent, no other symbols | finite number (commas removed) | `VALUE_NOT_NUMBER` |
| `percent` (level_pct only) | a `number`, optionally followed by `%` (one optional space before it) | number | `VALUE_NOT_NUMBER` |
| `money` | optional leading `$`; digits or grouped thousands; optional `.d` or `.dd`. For `actual` only, also a leading `-` (before or after `$`) or accounting parentheses `(300)`, `($300)` | integer cents (`"(300)"` → -30000) | `VALUE_NOT_MONEY` |
| `date` | `YYYY-MM-DD` that round-trips through `Date.UTC` (no 2026-09-31, no 2026-13-01) | the same string | `VALUE_NOT_DATE`. A timestamp in a date column uses its date part and adds `VALUE_TIME_IGNORED` (info) ([GRZ-03](02-findings.md#grz-03) case 5). |
| `month` | `YYYY-MM`, or `YYYY-MM-01` ([BUD-01](02-findings.md#bud-01): "Months written '2026-09-01': September still counted") | `YYYY-MM` | `VALUE_NOT_MONTH` |
| `timestamp` | `YYYY-MM-DD` + `T` or one space + `HH:MM`, optional `:SS`, optional `Z` or `±HH:MM` / `±HHMM` | instant in ms (section 3.3) | `VALUE_NOT_TIMESTAMP` |
| `enum` | compared after trimming and lower-casing | the lower-case value | `VALUE_NOT_IN_LIST` (handling per column) |
| `bool` | true / false / yes / no / 1 / 0, any case | boolean | `VALUE_NOT_IN_LIST` |

Notes: day-first dates ('15/09/2026'), M/D/YYYY, spreadsheet serial numbers ('46327') and 12-hour clock times are rejected, never guessed ([DATA-02](02-findings.md#data-02)). Correctly grouped
thousands are accepted in numeric columns although `data-fields.json` says "no thousands separators" (decision D4);
money accepts `$`, grouped thousands and, for `actual`, parentheses although `data-fields.json` says plain digits
(decision D3). A blank cell is `null` for every type ([CSV-04](02-findings.md#csv-04)).

### 3.3 As-of and time-zone policy

This is the one policy every rule and chart uses ([TIME-01](02-findings.md#time-01),
[TIME-02](02-findings.md#time-02), [TIME-03](02-findings.md#time-03); [RULE-WF-14](03-research-and-data.md#rule-wf-14)).

1. **Ranch zone.** `meta.timezone` is an IANA name (America/Chicago in the demo), checked with
   `Intl.DateTimeFormat("en-US", { timeZone })` inside try/catch.
   - Valid zone: used for every local stamp and every calendar date.
   - Missing or invalid zone, and `as_of` carries an offset: the offset is used as a fixed zone, with
     `META_NO_TIMEZONE` (warning): "Time zone not set; using the -05:00 offset from as_of for every time. Daylight-saving
     changes are not applied." (`data-fields.json` meta.timezone: "If as_of carries an offset, use it and show the
     offset".)
   - Missing or invalid zone and no offset: `META_NO_TIMEZONE` (error), header "time zone not set", and the rules that
     measure hours (water silence and the 24-hour drop) are CAN'T TELL (`data-fields.json`: "treat time-based rules as
     CAN'T TELL"). Rules that count calendar days use the date written in `as_of`. This reads "time-based" as
     hour-based. `data-fields.json` also says "drop 'today' wording"; this specification keeps day counts and "today"
     on the written date, because the date a ranch writes is its own calendar date. That is an interpretation, listed
     in section 15.
2. **As-of instant.** `meta.as_of` is a timestamp. With an offset or `Z`, it is that instant (TIME-03's
   '2026-10-01T01:00Z' is 2026-09-30 20:00 in America/Chicago). Without one, it is wall-clock time in the ranch zone. A
   date-only `as_of` is `META_DATE_ONLY_AS_OF` (warning): day-count rules use that date; hour-based rules are CAN'T
   TELL. An `as_of` that does not parse is fatal (`VALUE_NOT_TIMESTAMP` on meta.csv; every area CAN'T TELL). When both
   an offset and a zone are given and they disagree at that instant, the offset fixes the instant and the zone fixes
   the calendar, with `META_OFFSET_MISMATCH` (warning).
3. **Local stamps.** A stamp with `Z` or an offset is an exact instant. A stamp without one is wall-clock time in the
   ranch zone, converted with `wallTimeToInstant`: compute the zone's offset with `Intl.DateTimeFormat(...).formatToParts`
   at the candidate instant and iterate (at most twice). A wall time that does not exist (spring-forward gap) is
   `TIME_NONEXISTENT` (warning) and the value is rejected; a wall time that occurs twice (fall-back overlap) uses the
   earlier instant and adds `TIME_AMBIGUOUS` (info).
4. **As-of date.** `D = ranchDate(asOfInstant)`, the calendar date in the ranch zone. Every day count uses `D`.
5. **Whole days.** `daysBetween(a, b)` for `YYYY-MM-DD` strings is `(Date.UTC(b) - Date.UTC(a)) / 86400000`, always an
   integer, never affected by daylight saving or the viewer's zone ([DATA-02](02-findings.md#data-02): "Day
   21.791666666666668").
6. **Hours.** `hoursBetween(i1, i2) = (i2 - i1) / 3600000` on instants; compared unrounded and shown rounded down to a
   whole hour.
7. **Cut-off.** Rows dated after the as-of time are left out of every rule, tile and chart, and reported in one
   `AFTER_AS_OF` info issue per file and column, with the count and the earliest value ("1 water reading dated after the
   as-of time: T6 at 2026-10-29 12:00"). Event columns: `water.time` (instant > as-of instant), `weights.date`,
   `weigh_sessions.date`, `moves.in_date`, `health.last_done` (date > D). Not cut off: `moves.out_date` and
   `moves.planned_out_date` after D (the stay is open as of D), `health.next_due` (a due date), and budget months after
   the closed-through month (plan rows, section 5.6).
8. **Header.** "Data as of Sep 30, 2026, 6:00 PM CDT (America/Chicago)", formatted with `Intl.DateTimeFormat("en-US",
   { timeZone, timeZoneName: "short", ... })`. When `meta.demo` is true, a badge reads "Fictional snapshot, not live"
   ([RULE-WF-14](03-research-and-data.md#rule-wf-14) phase note). The per-source freshness strip is Phase 2.

### 3.4 File contracts

"Required" means the column must exist; a required value that is blank is `VALUE_MISSING`. Keys are checked for
duplicates as described in [section 3.5](#35-references-and-duplicates).

**meta.csv** (one data row; extra rows are `META_EXTRA_ROWS`, warning, first row used)

| Column | Type | Required | Rule | If missing or invalid |
|---|---|---|---|---|
| `as_of` | timestamp | yes | section 3.3 | Fatal for rules (every area CAN'T TELL). |
| `timezone` | IANA zone | yes (Phase 1 contract) | section 3.3 | Fallbacks in section 3.3. |
| `season_start` | date | no | First day counted for budget. The grazing chart does not use it (section 5.3). | Default: the earliest month in `budget.csv`, labelled "assumed" (`META_SEASON_ASSUMED`, info). |
| `books_closed_through` | month | no | Last closed budget month; must not be after the month of `as_of`, and its last day must be on or before `D` (decision D1). | Default: the month before the as-of month, labelled "assumed closed through" (`META_BOOKS_CLOSED_ASSUMED`, info; [RULE-BUD-05](03-research-and-data.md#rule-bud-05)). A later value is clamped to the latest month whose last day is on or before `D` (`META_BOOKS_CLOSED_AFTER_AS_OF`, warning). |
| `demo` | bool | no | `true` shows the "Fictional snapshot, not live" badge. | Default `false`. |

**pastures.csv** (key `pasture_id`)

| Column | Type | Required | Rule | If missing or invalid |
|---|---|---|---|---|
| `pasture_id` | id | yes | unique | Row rejected. |
| `name` | text | no | shown as text | Show `pasture_id`. |
| `acres` | number > 0 | no | header tile only | Tile shows the known total with "acres missing for 1 pasture" ([CSV-04](02-findings.md#csv-04): "'4,100 acres' plus a note"). |
| `planned_graze_days` | int > 0 | yes | default plan length | Stays in that pasture with no valid `planned_out_date` are CAN'T TELL ("No usable plan for Sand Hills"). |
| `min_rest_days` | int > 0 | no | not used in Phase 1 (Phase 2 rest check) | none |

**groups.csv** (key `group`)

| Column | Type | Required | Rule | If missing or invalid |
|---|---|---|---|---|
| `group` | id | yes | unique; may be digits ('2025') | Row rejected. |
| `class` | text | yes (data-fields) | shown only | "class not recorded" (info). |
| `head` | int >= 0 | yes | gain coverage; head tile. `0` means groups.csv records no animals in the group now (sold or shipped): the head tile adds 0 with no note, and the group's gain is not judged, or is CAN'T TELL when the group has a weigh-in dated within `gainMaxAgeDays` before `D` (section 5.4 step 2) | Gain for that group CAN'T TELL ("Head count missing" or "can't be read"); the tile shows the known head with a note, never a joined number like '180150'. |
| `target_adg_lbs` | number, 0 to 5 | yes | 0 = not judged on gain (stated on the page) | Gain for that group CAN'T TELL ("Gain target '2.O' isn't a number") ([GAIN-05](02-findings.md#gain-05)). |

**tanks.csv** (new; key `tank_id`)

| Column | Type | Required | Rule | If missing or invalid |
|---|---|---|---|---|
| `tank_id` | id | yes | unique | Row rejected. |
| `pasture_id` | id → pastures | yes | the tank's pasture; the authority over water.csv | `REF_UNKNOWN`; the tank is judged and named "Tank T9 (P9)". |
| `name` | text | no | chart heading | Show `tank_id`. |
| `in_service` | bool | no | `false`: shown "out of service", not judged, never hidden | Default `true`. |

If `tanks.csv` is absent, the tank list is the set of tank IDs in `water.csv`, each in the pasture of its newest
reading, with `TANK_LIST_MISSING` (warning): "tanks.csv not provided; a tank with no readings cannot be shown".

**moves.csv** (key `group` + `in_date`)

| Column | Type | Required | Rule | If missing or invalid |
|---|---|---|---|---|
| `group` | id → groups | yes | | `REF_UNKNOWN`; the stay is not judged. |
| `pasture_id` | id → pastures | yes | | `REF_UNKNOWN`; the group's grazing is CAN'T TELL if this is its current stay. |
| `in_date` | date | yes | on or before `D` to be judged | Blank or invalid: the stay is not judged (`VALUE_MISSING` / `VALUE_NOT_DATE`); after `D`: `AFTER_AS_OF`. |
| `out_date` | date or blank | yes (column) | blank = open; on or after `in_date` | Invalid or before `in_date`: the stay is not judged and the group's grazing is CAN'T TELL if no other stay is current. |
| `planned_out_date` | date | no | on or after `in_date`; the plan for this stay (decision D11) | Fall back to `in_date + planned_graze_days`, labelled "default plan" (`data-fields.json`). |

**water.csv** (key `tank_id` + `time`)

| Column | Type | Required | Rule | If missing or invalid |
|---|---|---|---|---|
| `tank_id` | id → tanks | yes | | `TANK_NOT_IN_LIST` (warning); the tank is still judged, in the pasture of its newest reading. |
| `pasture_id` | id → pastures | yes | must match the tank's pasture in tanks.csv (for a tank not in tanks.csv, the pasture of its newest reading) | `REF_PASTURE_MISMATCH` (warning, counted per tank and pasture): those readings are left out ([WAT-04](02-findings.md#wat-04)). |
| `time` | timestamp | yes | section 3.3 | Reading rejected. |
| `level_pct` | percent, 0 to 100 | yes | | `LEVEL_INVALID` (warning): the row stays as a "not a level" reading for section 5.2, never 0 ([WAT-01](02-findings.md#wat-01)). |

**weights.csv** (key `group` + `tag` + `date`)

| Column | Type | Required | Rule | If missing or invalid |
|---|---|---|---|---|
| `tag` | id | yes | string; animals are keyed by group and tag ([GAIN-06](02-findings.md#gain-06)) | Row rejected. |
| `group` | id → groups | yes | | `REF_UNKNOWN`; the row is left out of group figures. |
| `date` | date | yes | on or before `D` | Row rejected; after `D`: `AFTER_AS_OF`. |
| `weight_lbs` | number, 200 to 2,500 (demo setting, D) | yes | | Blank: `VALUE_MISSING`; outside: `WEIGHT_OUT_OF_RANGE`; the reading is left out ([GAIN-04](02-findings.md#gain-04)). |

**weigh_sessions.csv** (new; key `group` + `date`)

| Column | Type | Required | Rule | If missing or invalid |
|---|---|---|---|---|
| `group` | id → groups | yes | | `REF_UNKNOWN`. |
| `date` | date | yes | a session date in weights.csv | A row with no matching weigh-ins is `SESSION_WITHOUT_WEIGHTS` (info). |
| `weight_basis` | enum: full, overnight_shrunk, limit_fed, pencil_shrunk | yes | [RULE-GAIN-06](03-research-and-data.md#rule-gain-06) | Unknown basis: section 5.4 treats the pair as not comparable. |

**health.csv** (exact duplicates dropped; see section 3.5 for repeated tasks)

| Column | Type | Required | Rule | If missing or invalid |
|---|---|---|---|---|
| `group` | id → groups | yes | | `REF_UNKNOWN` (warning); the task is still judged. |
| `task` | text | yes | a schedule label, shown as text | Row rejected. |
| `last_done` | date or blank | no (`data-fields.json`: optional; blank allowed for a task never done) | on or before `D` | Invalid: `VALUE_NOT_DATE`; after `D`: `AFTER_AS_OF` and ignored. A missing column changes no Phase 1 result. |
| `next_due` | date | yes when open | | Open with blank or invalid: CAN'T TELL row (section 5.5). Done or cancelled with a value: `HEALTH_DONE_WITH_NEXT_DUE` (info). |
| `status` | enum: open, done, cancelled | yes | trimmed, lower-cased ([HLTH-01](02-findings.md#hlth-01)) | Anything else, including "deferred", is `STATUS_UNKNOWN` (warning) and treated as open (decision D10). |

**budget.csv** (key `month` + `category`)

| Column | Type | Required | Rule | If missing or invalid |
|---|---|---|---|---|
| `month` | month | yes | | Row rejected (`VALUE_NOT_MONTH`). |
| `category` | text | yes | | Row rejected. |
| `budget` | money >= 0 | yes | blank = "no budget entered", never 0 | Category CAN'T TELL if the month is closed. |
| `actual` | money, signed | yes | blank = "actual not entered", never 0 | Category CAN'T TELL if the month is closed. |

### 3.5 References and duplicates

**References** ([DATA-01](02-findings.md#data-01)). Checked: `moves.group`, `weights.group`, `weigh_sessions.group`,
`health.group` → `groups.group`; `moves.pasture_id`, `tanks.pasture_id`, `water.pasture_id` → `pastures.pasture_id`;
`water.tank_id` → `tanks.tank_id`. An exact match (after trimming) is used. Otherwise, if exactly one master ID matches
ignoring case, it is used and `REF_CASE_MISMATCH` (warning) is added. Otherwise `REF_UNKNOWN` (or
`TANK_NOT_IN_LIST`), naming the file, row and ID ("Yearlings: pasture P9 isn't in pastures.csv"). Names shown on the
page fall back to the raw ID, never 'undefined'.

**Duplicates** ([DATA-03](02-findings.md#data-03); decision D15). All resolutions are order-independent.

| File | Key | Exact duplicate rows | Same key, different values |
|---|---|---|---|
| any | whole row | Dropped; one `DUP_EXACT` info per file with the count. | see below |
| pastures, groups, tanks | ID | | `DUP_CONFLICT` (error). Every rule that uses that master record returns CAN'T TELL for it ("pastures.csv lists P3 twice with different values"). |
| moves | group + in_date | | `DUP_CONFLICT` (error); the group's grazing is CAN'T TELL. |
| water | tank_id + time | | The lower level is used; `DUP_CONFLICT` (warning) names both values ([WAT-07](02-findings.md#wat-07)). |
| weights | group + tag + date | | The mean of the weights is used; `DUP_CONFLICT` (warning) names both ([GAIN-02](02-findings.md#gain-02)). |
| weigh_sessions | group + date | | Basis unknown for that session; `DUP_CONFLICT` (warning). |
| health | group + task, open rows only | | Judged once, on the earliest valid `next_due`; `DUP_CONFLICT` (warning) names the others. |
| budget | month + category | | Amounts added together; `BUDGET_ROWS_ADDED` (warning) names the rows ("2 rows for Repairs in 2026-09 were added together; if one replaces the other, delete the old row"). |

The same tag in two groups is two animals (key includes the group) with `TAG_IN_TWO_GROUPS` (info).

---

## 4. Validation result model

### 4.1 The issue object

```js
{
  file: "water.csv",          // or "meta.csv", "(page)" for load-level problems
  row: 241,                   // spreadsheet row number, or null for file-level issues
  column: "level_pct",        // canonical column name, or null
  value: "ERR",               // the raw cell text (shown escaped, cut to 60 characters), or null
  code: "LEVEL_INVALID",
  severity: "warning",        // "error" | "warning" | "info"
  message: "Tank T2: 'ERR' at 2026-09-30 18:00 is not a level from 0 to 100.",
  action: "Check the sensor export; the reading was not used.",
  area: "Water",              // area it affects, or null
  count: 1,                   // > 1 when identical issues are summarised
  rows: [241]                 // first five row numbers when summarised
}
```

**Severity meaning.** `error`: a file, column, conflicting duplicate (section 3.5) or meta problem that stops an area, a
subject, or every rule that uses a master record, from being judged (always shown together with a CAN'T TELL result).
`warning`: a value rejected, replaced or combined, or two records that disagree; the subject is still judged or, when
it needs that value or record, gets its own CAN'T TELL row that the issue explains (an unreadable gain target or head,
`GROUP_HEAD_ZERO_RECENT_WEIGHINS`). `info`: clean-up that does not change any conclusion (rows skipped, exact
duplicates dropped, rows after the as-of time), and notes that say why a group is not a subject of a rule
(`GROUP_NO_CURRENT_STAY`, `GROUP_HEAD_ZERO`).

**Summarising.** Issues with the same file, column, code and area are combined when there are more than 5: one issue
with `count` and the first five row numbers ("12 rows: 4, 9, 15, 22, 31 and 7 more").

### 4.2 Issue codes

| Code | Severity | When | Effect |
|---|---|---|---|
| `FILE_MISSING` | error | HTTP 404 | Areas needing the file are CAN'T TELL. |
| `FILE_FAILED` | error | other HTTP error, network error or abort | as above |
| `FILE_EMPTY` | error | 0 bytes, or header only | as above |
| `FILE_NOT_UTF8` | warning | decoded as Windows-1252 | none |
| `CSV_UNCLOSED_QUOTE` | error | quote never closed | file unreadable |
| `CSV_TITLE_LINE` | warning | rows before the header | skipped |
| `CSV_BLANK_ROWS`, `CSV_REPEATED_HEADER`, `CSV_SHORT_ROW` | info | section 3.1 | skipped or padded |
| `CSV_EXTRA_CELLS` | warning | non-empty cells beyond the header | row rejected |
| `COL_MISSING` | error | required column absent | areas needing it are CAN'T TELL |
| `COL_DUPLICATE` | error | column named twice | first used |
| `COL_UNKNOWN` | info | extra column | ignored |
| `VALUE_MISSING` | warning (error for meta.as_of) | required value blank | per column table |
| `VALUE_NOT_NUMBER`, `VALUE_NOT_MONEY`, `VALUE_NOT_DATE`, `VALUE_NOT_MONTH`, `VALUE_NOT_TIMESTAMP`, `VALUE_NOT_IN_LIST`, `VALUE_OUT_OF_RANGE` | warning (error for meta.as_of) | type or range check failed | per column table |
| `VALUE_TIME_IGNORED` | info | timestamp in a date column | date part used |
| `TIME_NONEXISTENT` | warning | wall time in a spring-forward gap | value rejected |
| `TIME_AMBIGUOUS` | info | wall time in a fall-back overlap | earlier instant used |
| `AFTER_AS_OF` | info | event dated after the as-of time | row left out |
| `META_NO_TIMEZONE` | warning or error | section 3.3 | section 3.3 |
| `META_DATE_ONLY_AS_OF`, `META_OFFSET_MISMATCH`, `META_EXTRA_ROWS` | warning | section 3.3 / 3.4 | as stated |
| `META_SEASON_ASSUMED`, `META_BOOKS_CLOSED_ASSUMED` | info | default used | labelled "assumed" on the page |
| `META_BOOKS_CLOSED_AFTER_AS_OF` | warning | closed-through month not yet over | clamped |
| `REF_UNKNOWN` | warning | reference not in its master file | per column table |
| `REF_CASE_MISMATCH` | warning | matched ignoring case | match used |
| `REF_PASTURE_MISMATCH` | warning | water reading in a pasture other than the tank's | readings left out |
| `TANK_NOT_IN_LIST`, `TANK_LIST_MISSING` | warning | section 3.4 | tank judged / fallback list |
| `DUP_EXACT` | info | identical rows | dropped |
| `DUP_CONFLICT` | error or warning | section 3.5 | section 3.5 |
| `BUDGET_ROWS_ADDED` | warning | section 3.5 | amounts added |
| `TAG_IN_TWO_GROUPS` | info | same tag in two groups | two animals |
| `MULTIPLE_OPEN_STAYS` | warning | a group has two or more current stays | latest judged (decision D8) |
| `GROUP_NO_CURRENT_STAY` | info | a group in groups.csv has no current stay as of `D` | none; the group is not judged on grazing (section 5.3) |
| `GROUP_HEAD_ZERO` | info | a group with a gain target above 0 has head 0 in groups.csv and no weigh-in dated within `gainMaxAgeDays` before `D` | none; the group is not judged on gain (section 5.4 step 2) |
| `GROUP_HEAD_ZERO_RECENT_WEIGHINS` | warning | a group with a gain target above 0 has head 0 in groups.csv but a weigh-in dated within `gainMaxAgeDays` before `D` (one issue per group, naming the date and the animals weighed) | the group's gain is CAN'T TELL (section 5.4 step 2) |
| `LEVEL_INVALID` | warning | level not a number from 0 to 100 | section 5.2 |
| `WEIGHT_OUT_OF_RANGE` | warning | weight outside 200-2,500 lbs | reading left out |
| `GAIN_IMPLAUSIBLE_ADG` | warning | an animal's gain outside -3 to +5 lbs/day | animal left out |
| `GAIN_OFF_SESSION` | info | weigh-in on a date that is not a group session | not used |
| `GAIN_NOT_REWEIGHED` | info | animals weighed at the latest session but not at the earlier one (one issue per group, naming the tags) | left out of the pair; listed in the gain section |
| `GAIN_MORE_THAN_HEAD` | warning | more animals weighed at both sessions of the pair than the group's head in groups.csv (one issue per group, naming both numbers) | group still judged (section 5.4 step 8) |
| `SESSION_WITHOUT_WEIGHTS` | info | weigh_sessions row with no weigh-ins | none |
| `STATUS_UNKNOWN` | warning | health status not open, done or cancelled | treated as open |
| `HEALTH_DONE_WITH_NEXT_DUE` | info | done or cancelled row with a next_due | not judged |

### 4.3 How issues appear on the page

- **Banner** (`role="alert"`, top of the page): only for `FILE_*`, `CSV_UNCLOSED_QUOTE`, `COL_MISSING`, `COL_DUPLICATE`
  and meta errors. One line per file: "health.csv could not be loaded (404). Health can't be judged."
- **Data checks panel** (new card directly under the exception table): heading "Data checks" with counts ("2 problems,
  3 notes"). A table with columns Severity (shape plus word: the error and warning shapes reuse Serious and Warning
  styling; info uses a plain "Note"), File, Row, Column, Value (escaped), What's wrong, What to do. Errors and warnings
  are listed; info notes sit behind a "Show 3 notes" button (a real `<button>`, at least 24 x 24 px and at least 42 px
  tall on a phone, visible focus; section 6.3).
  With none: "No data problems found in the loaded files."
- **Rows.** Issues are never exception rows. Where an issue stops a subject from being judged, the subject gets a CAN'T
  TELL row (section 5.1) and the issue explains why.
- On the committed data the panel shows "No data problems found in the loaded files." (no error, warning or info).

---

## 5. Area results and rule logic

### 5.1 Common result model

**Row.**

```js
{
  id: "Water|T4|RULE-WAT-03",   // area + subject key + rule; stable across loads (used by Phase 2)
  area: "Water",                // Water | Grazing | Gain | Health | Budget
  kind: "alert",                // "alert" (needs attention) | "cant_tell"
  severity: "critical",         // critical | serious | warning
  subject: "Tank T4 (Lone Tree, Heifers there as of 2026-09-30)",
  subjectKey: "T4",
  refs: { tankId: "T4", pastureId: "P4", group: "Heifers", category: null, task: null },
  problem: "Dropped 46 points in 24 hours, now 10% (unexplained fall; leak not confirmed)",
  action: "Check for a leak or a stuck float; haul water if it can't be fixed today",
  rule: "RULE-WAT-03",
  evidence: [ { label: "2026-09-29 18:00", value: 56 }, { label: "2026-09-30 18:00", value: 10 } ]
}
```

`subject`, `problem` and `action` are plain text built from data; the renderer sets them as text (section 7). A CAN'T
TELL row still has a severity, which says how urgent finding out is (table in each area section), and always a first
step ([RULE-WF-09](03-research-and-data.md#rule-wf-09) phase note: "CAN'T TELL rows also need a first step").

**Area state.**

```js
{ area: "Water", state: "attention", counts: { critical: 2, serious: 1, warning: 0, cantTell: 1 }, reason: null }
```

- `cant_tell` when a required file or column for the area is missing, failed, empty or unreadable (section 2.4);
  `reason` names it.
- otherwise `attention` when the area has at least one `alert` row;
- otherwise `cant_tell` when it has only `cant_tell` rows (`reason`: "1 tank can't be judged");
- otherwise `ok`.

**Sorting** (unchanged in Phase 1): severity (critical, serious, warning), then area A-Z, then subject A-Z (added so
that ties never depend on file order). CAN'T TELL rows sort with their severity. Consequence-aware ranking is Phase 2
(P2-09).

**Area-level rows.** When an area is CAN'T TELL because a required file or column is unusable, `evaluate` returns one
CAN'T TELL row for the whole area instead of one per subject: subject "{Area}", problem naming the file and the
reason ("health.csv could not be loaded (404)", "water.csv has no rows; 8 tanks can't be judged"), first step "Check
the export and load the file again". Its severity is serious for Water and warning for the other areas (the same
levels as the subject-level CAN'T TELL rows below). Per-subject results (for example each tank) still carry their
CAN'T TELL state for tiles and charts.

**Display.** The Severity column keeps the redesign's shape plus word ([RULE-WF-01](03-research-and-data.md#rule-wf-01)). A
CAN'T TELL row also shows, at the start of the Problem cell, a hollow diamond containing "?" and the words "Can't
tell", so the state is never carried by colour or shape alone. Area chips keep the redesign's form: the area name with
its row count in a badge (`.n`), "Water 3" for all rows. When the area has an area-level row, the badge reads "can't
tell" in place of the count, never "0".

**Needs attention summary.** The redesigned page shows this in the summary card (`#summary`) above the list, not in a
tile ("10 items need attention across 5 of 5 areas", then Critical 2, Serious 6 and Warning 2). Phase 1 keeps the card
and the four tiles, and adds no "Needs attention" tile. The card's number is the number of rows in the exception table (alert and CAN'T TELL rows), and it adds a
Can't tell count when any row is CAN'T TELL. `tileSummary` returns the same counts as text: "{c} critical, {s} serious,
{w} warning", plus " ({k} can't tell)" when any row is CAN'T TELL. Committed data: "10" and "2 critical, 6 serious, 2
warning (1 can't tell)", the totals that scenario 01's `expected.json` checks.

**Empty states.** All filter, no rows, every area `ok`: "Nothing needs attention." ([UI-07](02-findings.md#ui-07)). An
area filter with state `ok`: "Nothing in water needs attention." An area filter on an area-level CAN'T TELL shows that
one row.

### 5.2 Water

Rules: [RULE-WAT-01](03-research-and-data.md#rule-wat-01) (C), [RULE-WAT-02](03-research-and-data.md#rule-wat-02) (C),
[RULE-WAT-03](03-research-and-data.md#rule-wat-03) (D), [RULE-WAT-04](03-research-and-data.md#rule-wat-04) (C).
Findings: [WAT-01](02-findings.md#wat-01), [WAT-02](02-findings.md#wat-02), [WAT-03](02-findings.md#wat-03),
[WAT-04](02-findings.md#wat-04), [WAT-07](02-findings.md#wat-07), [WAT-08](02-findings.md#wat-08).

**Tank list.** Every tank in `tanks.csv` (or the fallback in section 3.4), plus any tank found only in `water.csv`
(`TANK_NOT_IN_LIST`). A tank found only in `water.csv` belongs to the pasture of its newest reading; its readings in
any other pasture give `REF_PASTURE_MISMATCH` and are left out, as for a listed tank. Tanks with `in_service = false`
are listed as "out of service", not judged and not counted.

**Readings for a tank.** Rows of `water.csv` with that `tank_id`, the tank's pasture, and `time` at or before the as-of
instant. Each reading is either *valid* (a level from 0 to 100) or *invalid* (`LEVEL_INVALID`, kept with its raw
text). Same-time conflicts use the lower value (section 3.5).

**Evaluation, in this order, per in-service tank** (`newestAny` = the latest reading of either kind; `newestValid` =
the latest valid reading; `H` = hours from `newestAny.time` to the as-of instant):

| Step | Condition | Kind | Severity | Problem | First step |
|---|---|---|---|---|---|
| 1 | no reading at all | CAN'T TELL | serious | "No readings in this export" | "Check the tank by eye today, then the sensor battery and signal" |
| 2 | readings, but none valid | CAN'T TELL | serious | "No valid level in this export; last reading '{raw}' at {stamp}" | as step 1 |
| 3 | `H >= sensorSilentHours` (24) | CAN'T TELL | serious | "No reading for {floor(H)} hours; last level {L}% at {stamp}" | as step 1 |
| 4 | `newestAny` is invalid | CAN'T TELL | the higher of serious and what `newestValid`'s level gives in steps 6-7 | "Last reading '{raw}' at {stamp} is not a level; last good level {L}% at {stamp}" | "Check the sensor and look at the tank by eye today" |
| 5 | 24-hour drop (below) >= `waterDropPts` (30) | alert | critical | "Dropped {N} points in {S} hours, now {L}% (unexplained fall; leak not confirmed)" | "Check for a leak or a stuck float; haul water if it can't be fixed today" |
| 6 | `L < waterCritical` (25) | alert | critical | "Down to {L}% full" | "Check the float and the supply line today" |
| 7 | `L < waterLow` (40) | alert | warning | "{L}% full" | "Look at it on the next pass" |
| 8 | the 24-hour window holds fewer than two valid readings | CAN'T TELL | warning | "Not enough recent history to judge the 24-hour change; level {L}% at {stamp}" (plus "; previous reading {stamp}" when there is one) | "Look at the tank on the next pass and check the sensor's reporting" |
| 9 | otherwise | OK | | | |

The first matching step wins, so a silent or faulty tank is never also judged on a stale level
([RULE-WF-19](03-research-and-data.md#rule-wf-19)). `L` is `newestValid`'s level, shown as written in the data with up
to one decimal ("11.8", "10"). `{raw}` is the cell text, or "(blank)". `{stamp}` is "YYYY-MM-DD HH:MM" in the ranch
zone. Without a usable zone, or with a date-only `as_of` (section 3.3), the hour-based steps 3, 5 and 8 cannot run.
Steps 1, 2 and 4 run as written; every other in-service tank is CAN'T TELL "Time zone not set; silence and 24-hour
change can't be judged; last level {L}% at {stamp}" (date-only `as_of`: "The as-of time has no hour; ..."), with step
4's severity: the higher of serious and what `L` gives in steps 6-7. A tank whose last good level is critical therefore
stays critical (on the committed data without a zone: T2 at 11.8% and T4 at 10.0%), and the others are serious.

**24-hour drop (step 5).** Window = valid readings with time in [`t` - 24 h, `t`], where `t` = `newestValid.time`
(both ends included). If the window holds fewer than two readings, the drop is not judged: a level alert (steps 6-7)
still wins, and otherwise step 8 makes the tank CAN'T TELL, never a 0-point change ([WAT-03](02-findings.md#wat-03)'s
fix: "when the window holds only the last reading, say the 24-hour change can't be judged rather than reporting 0";
scenario 04's T1, with nothing between 2026-09-27T18:00 and 2026-09-30T18:00). Otherwise the drop is the largest fall from
an earlier to a later reading in the window (the maximum drawdown: one pass keeping the running maximum), rounded to
0.1 point (`Math.round(x * 10) / 10`) before it is compared with `waterDropPts` using `>=`
([WAT-08](02-findings.md#wat-08): "'drop24h=29.999999999999993; (no water alerts)'"). `N` is the rounded drop
(trailing ".0" removed); `S` is the whole hours from the high reading to the low reading of that fall (24 for T4: 56.0
at 2026-09-29 18:00 to 10.0 at 2026-09-30 18:00). Decision D5. The scenario folders' `settings.json` uses "(highest
level in [last - 24 h, last]) - last level" instead; section 11.2 compares the two.

**Subject.** "Tank {tank_id} ({pasture name}{, {groups} there as of {D}})", where the groups are those whose current
stay (section 5.3) is in the tank's pasture, joined with " and ". Pasture name falls back to the pasture ID. Examples:
"Tank T4 (Lone Tree, Heifers there as of 2026-09-30)", "Tank T2 (Windmill)", "Tank T9 (P9)".

**Tile** ("Sensors normal", [RULE-WAT-15](03-research-and-data.md#rule-wat-15)): value "{ok} of {judged}", detail
"{n} need a look" plus "({c} can't tell)" when any. `judged` counts in-service tanks; `need a look` counts tanks with
any row. Committed data: "5 of 8", "3 need a look (1 can't tell)". Out-of-service tanks add "1 out of service".

**Chart.** One small chart per tank in the tank list, in that tank's card (section 6.3), drawn from the readings above
(valid readings only). A tank with no valid reading in the last 7 days draws an empty frame with "No readings in the
last 7 days" ([LOAD-04](02-findings.md#load-04)). As the redesign does today, a card too narrow for that line shows the
shorter "No readings this week" (on two lines, "No readings" and "this week", at the narrowest), and a window that
holds only readings that are not levels says "No usable readings" in the same forms. An out-of-service tank keeps its
card and chart, and the card says "out of service".

### 5.3 Grazing

Rules: [RULE-GRZ-01](03-research-and-data.md#rule-grz-01) (C), [RULE-GRZ-02](03-research-and-data.md#rule-grz-02) (D).
Findings: [GRZ-01](02-findings.md#grz-01), [GRZ-02](02-findings.md#grz-02), [GRZ-03](02-findings.md#grz-03).

**Current stay.** A stay is *usable* when its group and pasture are known, `in_date` is a valid date on or before `D`,
and `out_date` is blank or a valid date on or after `in_date`. A usable stay is *current* when `out_date` is blank or
after `D`. Per group:

- no current stay: no row in Phase 1, one `GROUP_NO_CURRENT_STAY` info note naming the group and its last stay, and
  the grazing chart shows the group without a current bar. This is a known exception to section 6.2's "partial data
  never produces an all-clear": the grazing area can read OK while such a group's location is unknown. A closed last
  stay can mean shipped or drylotted (findings.json `policies.severity` on [GRZ-07](02-findings.md#grz-07)), and only
  GRZ-07's group status (Phase 2, P2-08) can tell that apart from a missing record, so the "no current pasture
  recorded" row waits for it;
- one current stay: judged;
- two or more: the one with the latest `in_date` is judged; `MULTIPLE_OPEN_STAYS` names every current stay ("Yearlings
  have 2 open stays (South Divide since 2026-08-25, Sand Hills since 2026-09-06); close the older one"). Decision D8.
- the current stay's pasture unknown, or the pasture or group record in conflict: CAN'T TELL (below).

**Plan.** `planDate` = `planned_out_date` when valid and on or after `in_date`; otherwise `in_date +
planned_graze_days` (labelled "default plan" in the chart reading); otherwise none. `day = daysBetween(in_date, D)`;
`planned = daysBetween(in_date, planDate)`; `over = daysBetween(planDate, D)`.

| Condition | Kind | Severity | Problem | First step |
|---|---|---|---|---|
| no usable plan, unknown pasture, conflicting records, or no current stay while one of the group's stays has an unusable date | CAN'T TELL | warning | "No usable plan for {pasture}: planned_graze_days '{raw}'" / "Pasture {id} isn't in pastures.csv" / "{file} lists {id} twice with different values" / "out_date '{raw}' isn't a date; leave it blank for the current stay" | "Fix the record in {file}" (names the file and row) |
| `over > 0` | alert | serious | "Day {day} of a {planned}-day plan ({over} day/days over)" | "Move them, or check the grass and record a new planned move date (planned_out_date in moves.csv)" |
| `over == 0` | alert | warning | "Move planned for today" | "Move them today, or record a new planned_out_date" |
| `-graceDays <= over < 0` | alert | warning | "Planned move in {-over} day/days" | "Line up the move" |
| `over < -graceDays` | OK | | | |

Subject: "{group} in {pasture name}". Boundaries ([TEST-02](02-findings.md#test-02)), one open Sand Hills stay (21-day
plan), as-of 2026-09-30: in_date 09-08 serious "(1 day over)"; 09-09 "Move planned for today"; 09-10 "Planned move in
1 day"; 09-11 "Planned move in 2 days"; 09-12 no row.

**Chart.** The rotation chart uses the same predicate and draws only usable stays. Every stay bar ends at or before `D`,
the Today line. As on the redesigned page, the axis starts at the earliest `in_date`, not at `season_start` (Phase 1
takes it from the usable stays), and runs to the later of `D` and the latest planned move of a current stay, and the
month ticks cover that whole axis ([UI-05](02-findings.md#ui-05)); a tick near the right edge has no label when the label would not fit. Only the current
stay is marked. Days left on its plan are shaded from the Today line to the planned move, with a tick at the planned
move. Days past plan are drawn from the planned move to the Today line, with a line at the planned move and a "days past
plan" label with an icon. Earlier stays are not marked. The card note reads "Each group's pasture moves this season.
Only the current stay shows the days left on its plan, or the days past it; earlier stays are not marked."
([GRZ-06](02-findings.md#grz-06); section 10.2). The Now grazing list under the chart stays (section 6.3).

### 5.4 Gain

Rules: [RULE-GAIN-01](03-research-and-data.md#rule-gain-01) (C), [RULE-GAIN-02](03-research-and-data.md#rule-gain-02)
(C), [RULE-GAIN-06](03-research-and-data.md#rule-gain-06) (C), [RULE-GAIN-07](03-research-and-data.md#rule-gain-07)
(C), [RULE-GAIN-10](03-research-and-data.md#rule-gain-10) (C), [RULE-WF-19](03-research-and-data.md#rule-wf-19) (B).
Findings: [GAIN-01](02-findings.md#gain-01) to [GAIN-08](02-findings.md#gain-08), [GAIN-11](02-findings.md#gain-11),
[GAIN-12](02-findings.md#gain-12), [GAIN-13](02-findings.md#gain-13).

Per group in `groups.csv`, using its weigh-ins (rows with that group, a valid date on or before `D`, and a weight from
200 to 2,500 lbs; same-day conflicts averaged, section 3.5):

1. **Target.** Invalid or blank → CAN'T TELL. `0` → not judged; the gain section says "Cows: no gain target, not judged
   on gain" ([GAIN-13](02-findings.md#gain-13), [RULE-GAIN-05](03-research-and-data.md#rule-gain-05)); no row.
2. **Head.** Blank → CAN'T TELL ("Head count missing; gain not judged"); not a whole number of 0 or more → CAN'T TELL
   ("Head count '{raw}' can't be read; gain not judged"). `0` means groups.csv records no animals in the group now
   (sold or shipped). Step 1 runs first, so a group with target 0 gets only the "no gain target" line. Steps 3 to 12
   run only when head is 1 or more, so no step divides by 0. With head 0:
   - *No weigh-in dated within `gainMaxAgeDays` (45, D) before `D`* (`daysBetween(date, D) <= 45`), *or none at all*:
     not judged. No row; the gain section says "{group}: head 0 in groups.csv, not judged on gain", and one
     `GROUP_HEAD_ZERO` info note says "Yearlings: head is 0 in groups.csv, so gain is not judged; 300 weigh-ins up to
     2026-07-20 were not used" (without the weigh-in clause when there are none), with the action "If the group still
     has animals, enter its head count in groups.csv". The weigh-ins stay in the file as history. The Gain area can
     still be OK (section 6.2).
   - *At least one weigh-in dated within `gainMaxAgeDays` before `D`*: an inconsistent record (animals were weighed
     recently, but the file says none are left). A CAN'T TELL row (warning, gain's CAN'T TELL severity) "Head is 0 in
     groups.csv, but {n} animals were weighed on {date}" ({date} is the latest such weigh-in date and {n} the animals
     weighed that day; "1 animal was" when n = 1), with the first step "Enter the group's head count in groups.csv, or
     record that the group was sold or shipped"; and one `GROUP_HEAD_ZERO_RECENT_WEIGHINS` warning, for example
     "Heifers: head is 0 in groups.csv, but 45 animals were weighed on 2026-09-15". This keeps a 0 typed by mistake
     from silently hiding a planted problem.
3. **Sessions.** A *session* is a date on which at least `max(1, ceil(gainSessionMinShare × head))` animals of the group
   were weighed (0.5, demo setting; 23 of 45 heifers, 75 of 150 yearlings). Weigh-ins on other dates are `GAIN_OFF_SESSION` (info) and not used ([GAIN-03](02-findings.md#gain-03): H001's Sep 16 re-weigh).
4. **Pair.** `S2` = the latest session on or before `D`. `S1` = the latest session on or before `S2 - gainMinDaysGroup`
   (21 days, D). `interval = daysBetween(S1, S2)`.
5. **Age.** `daysBetween(S2, D) > gainMaxAgeDays` (45, D) → CAN'T TELL ([GAIN-08](02-findings.md#gain-08)).
6. **Basis.** The `weight_basis` of `S1` and `S2` from `weigh_sessions.csv`. Either one unknown, or the two different →
   the group figure is shown in the gain section as "provisional" and the serious and individual flags are CAN'T TELL
   ([RULE-GAIN-06](03-research-and-data.md#rule-gain-06); decision D9).
7. **Matched animals.** Tags (within the group) with a usable weight at both `S1` and `S2`. Per animal `adg = (w2 - w1) /
   interval`. An animal with `adg` outside -3 to +5 lbs/day (D) is `GAIN_IMPLAUSIBLE_ADG` and left out.
8. **Coverage.** `matched / head`, with head 1 or more (step 2). Below `gainMinCoverage` (0.8, D), or no matched
   animal at all whatever the setting, → CAN'T TELL ([GAIN-07](02-findings.md#gain-07)). More matched animals than head
   (`matched > head`) means groups.csv and weights.csv disagree: animals were sold, died or moved after `S2`, or the head
   count or a group label is wrong. The data cannot tell which, so the group is still judged. The gain section line
   reads "{matched} weighed at both {S1} and {S2}, more than the {head} head in groups.csv" instead of "{matched} of
   {head}", and one `GAIN_MORE_THAN_HEAD` warning says "Yearlings: 150 weighed at both 2026-07-20 and 2026-09-15, more
   than the 100 head in groups.csv", with the action "Check head in groups.csv. If animals left the group after
   2026-09-15, it is already right."
9. **Group figure.** Only when at least one animal is matched (step 8): pooled
   `G = Σ(w2 - w1) / (matched × interval)` (total pounds over total animal-days). With no matched animal there is no
   figure, provisional or not, and the group gets step 8's CAN'T TELL row.
10. **Group serious.** `round3(G) < round3(target × adgSerious)` (0.8). `round3(x) = Math.round(x * 1000) / 1000`, so
    row order can never change the result ([GAIN-12](02-findings.md#gain-12): 456 / 285 = 1.6 is exactly 80% of 2.0 and
    gives no row).
11. **Individuals.** Only when `interval >= gainMinDaysAnimal` (42, D) and the group is not serious: animals with
    `round3(adg) < round3(target × animalShare)` (0.5). When the group is serious, no individual row
    ([RULE-WF-19](03-research-and-data.md#rule-wf-19)); the gain section says "{k} of {matched} under {line} lbs/day".
12. **Missed and new animals.** Tags with a weigh-in at `S1` and no row at all at `S2` get a CAN'T TELL row. Tags with a
    weigh-in only at `S2` are listed in the gain section as "not yet re-weighed" and in one `GAIN_NOT_REWEIGHED` info
    issue per group ([GAIN-01](02-findings.md#gain-01); scenario 06's Y151).
    Tags whose `S2` reading was rejected as a data issue are not repeated in that row; the data issue names them.

| Condition | Kind | Severity | Subject | Problem | First step |
|---|---|---|---|---|---|
| target invalid | CAN'T TELL | warning | {group} | "Gain target '{raw}' isn't a number" | "Fix target_adg_lbs for {group} in groups.csv" |
| head missing or unreadable | CAN'T TELL | warning | {group} | "Head count missing; gain not judged" or "Head count '{raw}' can't be read; gain not judged" | "Enter the head count in groups.csv" |
| head 0, weigh-in within 45 days | CAN'T TELL | warning | {group} | "Head is 0 in groups.csv, but {n} animals were weighed on {date}" | "Enter the group's head count in groups.csv, or record that the group was sold or shipped" |
| no weigh-ins | CAN'T TELL | warning | {group} | "No weigh-ins recorded" | "Weigh the group, or load the weigh-in file" |
| no session | CAN'T TELL | warning | {group} | "Too few weighed to judge ({max n} of {head} on {date})" | "Weigh the whole group at the next gather" |
| no `S1` | CAN'T TELL | warning | {group} | "Only one weigh-in at least 21 days apart so far ({S2})" | "Weigh again at the next gather" |
| too old | CAN'T TELL | warning | {group} | "Last weigh-in {S2} was {age} days before the as-of date" | "Weigh the group, or record the weigh-in" |
| coverage low, or no matched animal | CAN'T TELL | warning | {group} | "Too few weighed at both weigh-ins to judge ({matched} of {head})" | "Weigh the whole group at the next gather" |
| basis differs or unknown | CAN'T TELL | warning | {group} | "Weighing conditions differ ({b1} on {S1}, {b2} on {S2}); {G} lbs/day is provisional" or "Weighing conditions not recorded for {date}" | "Record weight_basis in weigh_sessions.csv, or compare like with like" |
| group serious | alert | serious | {group} | "{G} lbs/day between the {S1} and {S2} weigh-ins (target {target})" | "Check forage and mineral; watch the group for illness or lameness and call your veterinarian if you see any" |
| slow animals | alert | warning | "{n} {group, lower case, singular when n = 1}" | "Under {line} lbs/day between the {S1} and {S2} weigh-ins: {tags}" | "Look at these animals at the next gather and record what you see" |
| missed weigh-in | CAN'T TELL | warning | "{n} {group, lower case}" | "Weighed on {S1}, missed the {S2} weigh-in: {tags}" | "Weigh them at the next gather, or record why they are gone" |

Number formats ([GAIN-11](02-findings.md#gain-11)): `G` and `line` with `fmtBelow`: two decimals, but when the
two-decimal text of a value judged *below* a line would read equal to or above the line's text, three decimals are
shown (1.598 against 1.6 prints "1.598"). Lines and targets print as applied with `fmtSetting` (up to 3 decimals,
trailing zeros removed: 0.625, 1.125, 1.0 prints "1.0" for targets). Tags are sorted with
`localeCompare(b, "en", { numeric: true })`. First steps follow [RULE-HLTH-11](03-research-and-data.md#rule-hlth-11):
nothing names a diagnosis, drug or treatment.

**Gain section lines** (under the chart): per group, "Heifers: 45 of 45 weighed at both 2026-07-20 and 2026-09-15
(full); 0.44 lbs/day; 32 of 45 under 0.5" and "Yearlings: 150 of 150 weighed at both ...; 1.94 lbs/day"; "Cows: no
gain target, not judged on gain". A group with head 0 reads "Yearlings: head 0 in groups.csv, not judged on gain", or,
when it has a weigh-in within `gainMaxAgeDays` (step 2), "Heifers: head 0 in groups.csv, but 45 animals were weighed on
2026-09-15; gain can't be judged". A group with more matched animals than head reads "Yearlings: 150 weighed at both
2026-07-20 and 2026-09-15 (full), more than the 100 head in groups.csv; 1.94 lbs/day". No line reads "{n} of 0". A group
with target 0 or head 0 draws no dots on the chart; its line says why, and the redesign's "Not shown" note under the
chart (`#gain p.hint`) names it with its own reason ("Not shown: Cows, with no gain target set; Yearlings, head 0 in
groups.csv."). When some group has a gain target but no group draws dots, the gain card shows the gain section lines
in place of the redesign's "No group with a gain target has two weigh-ins yet.", which is false when a group with head
0 has two weigh-ins. The chart heading reads "Daily gain between the last two weigh-ins".

**Gain tile.** Built from the results, never from a fixed group name ([LOAD-03](02-findings.md#load-03)): the
judged group with the lowest ratio of G to its target (ties: the first in groups.csv), as "{G} lbs/day {group}
(target {target})". A group with head 0 is never chosen. When weights.csv has usable rows, some group has a gain
target, no group has a figure and the head-0 cases below do not apply, it reads "No weigh-ins yet" if no group with a
gain target has a weigh-in on or before D, and otherwise "Can't tell" with "{groups} can't be judged on gain", naming
the groups with a gain target and no figure, except a group with head 0 and no weigh-in within `gainMaxAgeDays`, which
is not judged (step 2) and is not named. With weights.csv missing, failed, empty
or header-only, the tile is section 6.2's "Can't tell" with its reason; for an empty or header-only weights.csv that
reason is "No weigh-ins yet" (P1-14 item 4). When at least one group has a gain target and every such group has
head 0, the tile reads "Not judged" with "Head 0 in groups.csv: {groups}"; when any of those groups has a weigh-in
within `gainMaxAgeDays` (step 2), it reads "Can't tell" with the same detail. It never reads "No weigh-ins yet" or a
figure in either case. When no group has a gain target, the tile keeps the redesign's "None yet" and its note "No
group has a gain target set."

### 5.5 Health

Rules: [RULE-HLTH-01](03-research-and-data.md#rule-hlth-01) (D), [RULE-HLTH-02](03-research-and-data.md#rule-hlth-02) (D),
[RULE-HLTH-03](03-research-and-data.md#rule-hlth-03) (C), [RULE-HLTH-11](03-research-and-data.md#rule-hlth-11) (C).
Findings: [HLTH-01](02-findings.md#hlth-01), [HLTH-02](02-findings.md#hlth-02).

Per row (status trimmed and lower-cased; open, done and cancelled accepted; anything else treated as open with
`STATUS_UNKNOWN`). Done and cancelled rows are not judged. For open rows, `left = daysBetween(D, next_due)`:

| Condition | Kind | Severity | Problem | First step |
|---|---|---|---|---|
| `next_due` blank | CAN'T TELL | warning | "Open, with no due date recorded" | "Set a due date" |
| `next_due` not a valid date | CAN'T TELL | warning | "Due date '{raw}' can't be read" | "Set a due date" |
| `left < 0` | alert | serious | "Overdue by {-left} day/days (due {next_due})" | "Schedule it, and check the label or your veterinarian's plan for the allowed window" |
| `left == 0` | alert | warning | "Due today ({next_due})" | "Do it today or set a new date" |
| `1 <= left <= dueSoonDays` (7) | alert | warning | "Due in {left} day/days ({next_due})" | "Plan it with the next gather" |
| otherwise | OK | | | |

Subject: "{group}: {task}". The serious and warning levels and the 7 days are demo settings (D) and labelled so. The
first step changes from "Schedule it this week" per the [RULE-HLTH-01](03-research-and-data.md#rule-hlth-01) phase note.

### 5.6 Budget

Rules: [RULE-BUD-01](03-research-and-data.md#rule-bud-01) (D), [RULE-BUD-02](03-research-and-data.md#rule-bud-02) (D),
[RULE-BUD-03](03-research-and-data.md#rule-bud-03) (C), [RULE-BUD-04](03-research-and-data.md#rule-bud-04) (A),
[RULE-BUD-05](03-research-and-data.md#rule-bud-05) (C), [RULE-BUD-06](03-research-and-data.md#rule-bud-06) (C).
Findings: [BUD-01](02-findings.md#bud-01) to [BUD-05](02-findings.md#bud-05); formatting [BUD-06](02-findings.md#bud-06).

1. **Closed months.** From the month of `season_start` through `C` = `books_closed_through` (section 3.4). If `C` is
   before the first month, the area is CAN'T TELL ("No closed months yet"). Later months are plan rows and are not
   counted (they produce no issue).
2. **Per category** (every category that appears in any row): the closed months from the category's first row onward
   (months before its first row are "not started" and count as nothing). For each of those months, the row for that
   month and category (rows added together per section 3.5). A month with no row (a gap), a blank budget, a blank
   actual, or a value that failed to parse makes the category CAN'T TELL ([BUD-01](02-findings.md#bud-01): BU-07 left
   September out "with no mention that September is missing").
3. **Sums in whole cents.** `B` = budget, `A` = actual, `V = A - B`, all integers.
4. **Severity** (decision D2; `warnBp = round(budgetWarnPct × 10000)`, `seriousBp = round(budgetSeriousPct × 10000)`,
   dollar settings × 100):

| Condition (first match wins) | Kind | Severity | Problem | First step |
|---|---|---|---|---|
| category CAN'T TELL | CAN'T TELL | warning | "Can't total: actual not entered for 2026-09" (or "no row for 2026-08", "no budget entered for 2026-09", "amount '{raw}' can't be read in 2026-07") | "Enter the missing amounts in budget.csv" |
| `B == 0` and `V >= unbudgetedUsd` | alert | warning | "\${V} spent with no budget, season to date through {C}" | "Add a budget line or re-forecast" |
| `B > 0`, `V × 10000 > B × seriousBp` and `V >= budgetSeriousUsd` | alert | serious | "{p}% over budget, season to date through {C} (\${V})" | "Find what drove it and decide whether to re-forecast" |
| `B > 0`, (`V × 10000 >= B × warnBp` and `V >= budgetWarnUsd`) or `V >= budgetLargeUsd` | alert | warning | as above | "Watch it next month" |
| otherwise | OK | | | |

Boundaries: serious is strictly above 10.0% and at least \$1,000 over; warning is at least 5.0% (inclusive) and at
least \$500 over, which includes more than 10.0% over with less than \$1,000 (scenario 09's Vet and health, 10.5% and
\$630), or at least \$2,500 over at any percent; unbudgeted is at least \$250. `p` is `V / B` as a percent,
rounded half up to one decimal with integer arithmetic (2,040 / 9,600 → 21.25 → "21.3"); `\${V}` is whole dollars,
rounded half up ("\$105" for \$104.50) ([BUD-05](02-findings.md#bud-05), [BUD-06](02-findings.md#bud-06)). 0 / 0 gives no
row and no NaN ([BUD-03](02-findings.md#bud-03)).

**Tile** ("Spend vs budget"): over the closed months, whatever each category's state, `A` is the sum of every valid
actual and `B` the sum of the budgets of the month-and-category rows whose actual is valid. A budget whose actual is
blank or unreadable is left out, so a missing amount can never make spending look under budget. Value "{signed p}%"
("+1.0%", "0.0%" when equal, never "−0.0%"), detail "\${A} of \${B}, season to date through {C}", plus "(1 category
can't tell)" when any. "No budget loaded" (CAN'T TELL) when the area is CAN'T TELL. When `B` is 0 and the area is not
CAN'T TELL (every closed-month budget beside a valid actual is 0 or blank), the tile keeps the redesign's "No budget"
with "\${A} spent, season to date through {C}", never a percent, and the season-total row shows "no budget" in place
of a percent. Committed data: "+1.0%",
"\$89,303 of \$88,400, season to date through 2026-09". Scenario folder 03 (Vet and health's September actual blank):
"+1.0%", "\$87,783 of \$86,900" and "(1 category can't tell)"; counting the \$1,500 budget against the blank actual
would read "\$87,783 of \$88,400", under budget. [BUD-02](02-findings.md#bud-02)'s case (Hay with a blank budget and
\$500 spent) keeps its expected "+1.6%" and "\$89,803 of \$88,400": the \$500 is a valid actual.

**Budget table.** The redesign draws the budget as one table, `#budgetTable`, with a bar in each row, and Phase 1 keeps
it (section 6.3); there is no separate budget chart. Bars for categories with `B > 0`; unbudgeted spending as a labelled
bar "\$500, no budget"; a CAN'T TELL category shows "can't tell" instead of a bar. The season-total row shows the same
totals as the spend tile; a CAN'T TELL category's Budget and Actual cells count the same month-and-category rows as the
tile (a month's budget only where its actual is valid), so the rows still add up to the season total (scenario folder
03: \$86,900 and \$87,783, with Vet and health's September \$1,500 left out). On the committed data the season-total
row is the sum of the six rows (\$88,400, \$89,303, +\$903).
Percentages in the table, the bar labels included, show one decimal ("+25.0%"), as the rows do
([05 P1-12](05-roadmap.md#p1-12-budget-rules): "Percent is shown to one decimal"). No attribute may contain NaN or
Infinity.

### 5.7 The committed data after Phase 1

With the generator changes in section 8 and the settings in section 9, `evaluate` on the committed data returns exactly
these rows and no issue (decision D7 for T6). This is the Phase 1 acceptance bar
([05-roadmap.md section 3.1](05-roadmap.md#31-phase-1-acceptance-bar)).

| # | Severity | Kind | Area | Subject | Problem |
|---|---|---|---|---|---|
| 1 | critical | alert | Water | Tank T2 (Windmill) | Down to 11.8% full |
| 2 | critical | alert | Water | Tank T4 (Lone Tree, Heifers there as of 2026-09-30) | Dropped 46 points in 24 hours, now 10% (unexplained fall; leak not confirmed) |
| 3 | serious | alert | Budget | Fuel | 21.3% over budget, season to date through 2026-09 (\$2,040) |
| 4 | serious | alert | Budget | Repairs | 25.0% over budget, season to date through 2026-09 (\$1,800) |
| 5 | serious | alert | Gain | Heifers | 0.44 lbs/day between the 2026-07-20 and 2026-09-15 weigh-ins (target 1.0) |
| 6 | serious | alert | Grazing | Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over) |
| 7 | serious | alert | Health | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15) |
| 8 | serious | CAN'T TELL | Water | Tank T6 (Cedar Draw) | No reading for 42 hours; last level 98.5% at 2026-09-29 00:00 |
| 9 | warning | alert | Gain | 6 yearlings | Under 1.0 lbs/day between the 2026-07-20 and 2026-09-15 weigh-ins: Y027, Y031, Y058, Y082, Y129, Y132 |
| 10 | warning | alert | Health | Cows: Pinkeye check | Due in 3 days (2026-10-03) |

Values behind them, from the audit: Heifers 1119 / 2565 = 0.4363 and Yearlings 16608 / 8550 = 1.94246
([CSV-01](02-findings.md#csv-01), [GAIN-01](02-findings.md#gain-01)); Fuel 11,640 vs 9,600 and Repairs 9,000 vs 7,200
([BUD-01](02-findings.md#bud-01)); T4 56.0 to 10.0 (data/water.csv). Checks made for this specification from
`data/*.csv` (not audit evidence): weights range 524-1,195 lbs; per-animal gains 0.105-2.735 lbs/day; levels 10.0-100.0;
32 of 45 heifers under 0.5; exactly 6 yearlings under 1.0; 45 heifers and 150 yearlings weighed on each of the three
dates; no duplicate tag and date; no head is 0 and the matched counts equal the heads (45 and 150). So no plausibility,
coverage, session, age or head-count check fires on the committed data.

---

## 6. Loading, error, empty and partial states

Findings: [LOAD-01](02-findings.md#load-01), [LOAD-02](02-findings.md#load-02), [LOAD-03](02-findings.md#load-03),
[LOAD-04](02-findings.md#load-04), [UI-07](02-findings.md#ui-07).

### 6.1 Page sequence

1. **Before any fetch.** The redesigned `index.html` already shows "Loading today's report…" in the summary card and
   "Loading data" in the top bar, and draws no tile, chip or row until the data arrives (with every CSV delayed 3 s,
   at 1 s: 0 tiles, 0 chips, 0 rows, and `/loading/i` visible). Phase 1 keeps that and adds `aria-busy="true"` on each
   section until it is drawn. Nothing reads "0" or "Nothing needs attention" while loading
   ([LOAD-02](02-findings.md#load-02), at the reviewed commit: "'ready=false ... loadingText=false'").
2. **Load.** `loadAll(FILES)` fetches all files in parallel. Each result is one of `ok`, `missing` (404), `failed` (other
   status, network error, abort; the message includes the status or error name), `empty`. A response is read with
   `res.ok` checked first; nothing calls `res.text()` on a failed response.
3. **Build.** `decodeBytes` → `parseCSV` → `buildDataset` → `evaluate`. These never throw on data; a programming error
   inside them is caught by the section guard of whatever uses the result, which shows "This section could not be
   drawn" plus the error name, and logs the error to the console.
4. **Render, in this order, each inside its own guard** (`try { ... } catch (e) { showSectionError(section, e) }`):
   banner, header (as-of line and top-bar stamp), summary card, exception table and chips, data checks panel, tiles,
   tank cards and their charts, grazing chart and Now grazing list, gain chart and its lines, budget table, rules table.
   The exception table comes before the tiles so that a tile failure can never hide it
   ([LOAD-03](02-findings.md#load-03)). The three chart sections are redrawn, each in its guard, when the page width
   changes, as the redesign does (section 6.3).

### 6.2 States

| Situation | Banner | Area state | Exception table | Tiles and charts |
|---|---|---|---|---|
| All files load, valid data | none | per rules | rows, sorted | drawn |
| A file 404, failed or aborted | "{file} could not be loaded ({status})." | areas needing it: CAN'T TELL | one area-level CAN'T TELL row per affected area, plus rows from other areas; each affected area's chip badge (`.n`) reads "can't tell", not "0" (for health.csv, the Health chip) | that area's tile "Can't tell" with the reason; its chart (for Budget, the budget table) replaced by the reason; others drawn |
| A file empty or header-only | "{file} has no rows." | as above | as above | as above, never "0 of 0" or "NaN" |
| A required column missing | "{file}: column {name} not found." | as above | as above | as above |
| Some rows invalid | none (data checks panel lists them) | per rules on the valid rows, CAN'T TELL where a subject depends on a bad value | rows, including CAN'T TELL rows | drawn from valid rows |
| `meta.csv` missing, empty or `as_of` unreadable | "meta.csv could not be read; nothing can be judged without the as-of time." | every area CAN'T TELL | one area-level row per area | tiles "Can't tell"; charts not drawn; the rules table is still drawn |
| A rendering error in one section | none | unchanged | unchanged | only that section shows "This section could not be drawn" |

Partial data never produces an all-clear: an area is `ok` only when its required files loaded and every subject in it
could be judged (section 5.1). One known exception, deferred to [GRZ-07](02-findings.md#grz-07) (Phase 2): a group with
no current stay is not judged on grazing and gets only an info note (section 5.3). A group with target 0, or with head
0 and no weigh-in within `gainMaxAgeDays`, is not partial data: it has no gain target or no animals on record, so it is
not a gain subject, and the gain section says so (section 5.4). A group with head 0 and a more recent weigh-in is an
inconsistent record and gets a CAN'T TELL row.

These per-file states replace the redesign's failed-load state, which hides the whole report when any file fails
(`body.failed`). Its "Try again" button stays, in the banner.

### 6.3 Accessibility and layout kept from the redesign

Phase 1 starts from main with the redesign merged (pull request #2, merge commit `0315d09`). The page already does what
this section lists, and Phase 1 keeps it: a change may move the code behind it, but must not remove or weaken it. None
of it is a Phase 2 feature, and a reviewer does not flag it as one (section 14). Each line names the finding or rule it
answers and the preserve checks that test it (KEEP-01 to KEEP-34, kept as the read-only reference script
`docs/audit/redesign/preserve.mjs` and run by the smoke test, section 11.4). The values were measured with Playwright
Chromium on the committed data on main (`0315d09`) on 2026-10-20, where all 34 checks pass; real phones, screen readers,
Firefox and WebKit were not tested.

| Kept | What the page does | Finding or rule | Checks |
|---|---|---|---|
| Severity by shape plus a word | Every badge and pill has an icon and a word: the list, the summary card, the tank cards ("Go now", "Check soon", "Fast drop", "No signal", "OK", "Can't tell"), the Now grazing list ("On plan", "Move soon", "Past plan", "No plan"), the budget table and its legend ("Serious", "Warning"), and the water tile's one icon per tank. A flagged budget row carries the same pill as its list row. The CAN'T TELL marker adds a shape and words. | [RULE-WF-01](03-research-and-data.md#rule-wf-01) (A) | KEEP-11, KEEP-15, KEEP-17, KEEP-33 |
| Charts in the tab order | Every `svg.chart` with readings has `tabindex="0"`, an `aria-label`, an `aria-roledescription` and `aria-describedby="chart-help"`. The 10 charts (8 tanks, grazing, gain) are tab stops in page order (KEEP-01 checks this at 1280 x 900, and section 11.4 item 4 at 390 x 844 and 320 x 640); a chart with no readings in its window is not. | [UI-01](02-findings.md#ui-01), [RULE-WF-02](03-research-and-data.md#rule-wf-02) (A) | KEEP-01 |
| Readings by keyboard | Focus shows a reading in `#tip` (`role="status"`, `aria-live="polite"`), value first, with a highlight; a tank chart opens on its latest reading. The arrow keys, Home and End step through readings, ArrowUp and ArrowDown change rows, and no key scrolls the page. Escape hides the reading and keeps focus; leaving the chart hides it. | [UI-01](02-findings.md#ui-01), [RULE-WF-02](03-research-and-data.md#rule-wf-02), [RULE-WF-03](03-research-and-data.md#rule-wf-03) (Escape part) | KEEP-02, KEEP-03, KEEP-04 |
| Readings by touch and mouse | On a touch screen the hint reads "Tap a chart, or slide a finger along it, to read each reading."; a tap shows a reading, a sliding finger moves it, a tap outside the charts clears it, and charts keep `touch-action: pan-y`. Hovering shows a reading beside the pointer without moving focus. | [UI-01](02-findings.md#ui-01), [RULE-WF-02](03-research-and-data.md#rule-wf-02) | KEEP-06, KEEP-07 |
| Readings stay on screen | All 443 readings of the 10 charts lie inside the window and below the sticky top bar at 1280 x 900, 390 x 844 and 320 x 640, and a reading follows its point when the page scrolls. At 1280 x 900 the T4 reading spans x 514 to 714. | [UI-11](02-findings.md#ui-11) | KEEP-05, KEEP-34 |
| Charts at their real width | Each chart is drawn at the width it is shown (viewBox within 1 px of the drawn width from 320 to 1920 px) and redrawn when that width changes, with focus and the reading kept. Chart text renders at 11 px or more (11.48 to 11.5 px), no two labels overlap, and long names end with an ellipsis. | [UI-03](02-findings.md#ui-03), [UI-12](02-findings.md#ui-12), [UI-14](02-findings.md#ui-14) | KEEP-19, KEEP-20, KEEP-21, KEEP-22 |
| Tank cards | `#tanks .tank`: one card per tank, worst first, each with its name, a status pill, the last level and its time, and one 7-day chart whose line breaks where readings stop for more than 12 hours. A tank with no readings in the window says so (section 5.2). | [UI-15](02-findings.md#ui-15), [LOAD-04](02-findings.md#load-04) | KEEP-13, KEEP-23 |
| Grazing and gain charts | The grazing chart marks only the current stay's days left or days past plan, with the Now grazing list below it (section 5.3). The gain chart draws the target, 80% and 50% lines; each animal the rules flag has "Flagged: under 50% of target", with an icon, in its reading, and the legend names the flag. The "Not shown" note names the groups with no gain target (a group with a target but no weigh-ins is in neither the chart nor the note, a known issue of the redesign for the follow-up pull request of section 15). | [UI-16](02-findings.md#ui-16), [GRZ-06](02-findings.md#grz-06) | KEEP-24 |
| Budget as one table | `#budgetTable`: a header, one row per category with one bar (right of zero when over budget, left when under, none when on budget), a pill on each flagged category, a legend, and a season-total row in `tfoot` that adds up. Labels stay inside their cells, and a \$0 budget draws no NaN or Infinity. There is no separate budget chart. | [UI-17](02-findings.md#ui-17), [BUD-03](02-findings.md#bud-03) | KEEP-14, KEEP-15, KEEP-16, KEEP-17, KEEP-18 |
| Area chips | One group labelled "Filter by area", built once, each chip with its count badge (section 5.1). A chip sets `aria-pressed`, keeps focus and shows only its area's rows; Tab moves on to the next chip. | [UI-10](02-findings.md#ui-10), [RULE-WF-05](03-research-and-data.md#rule-wf-05) (focus part) | KEEP-31 |
| Phone layouts | At 760 px wide or less each list row is a card with every cell on screen (right edge x 358 at 390 px). At 640 px or less the budget table hides its Budget and Actual columns and shows "\$9,000 of \$7,200" under the category name, inside its card at 390 and 320 px, and the rules table sits closed behind "Show the rules". At 520 px or less the list comes right after the summary card and the tank cards stack one per row; the tiles sit two by two. The page does not scroll sideways at 33 widths from 320 to 1920 px on the committed data, or at 320, 390, 768 and 1280 px with long group and category names and with markup in pasture names and ear tags. | [UI-02](02-findings.md#ui-02) | KEEP-08, KEEP-09, KEEP-10, KEEP-11, KEEP-12 |
| Targets and focus | Buttons, chips, nav links and the rules toggle are at least 24 x 24 CSS px; the summary card's "Review the list" link is 21.7 px tall at 641 px and wider (measured; no check covers target size above 640 px). On a phone the nav links are 44 px tall, the chips 42 px and "Show the rules" 46 px. Every Tab stop shows the 2 px focus ring, not covered by the sticky top bar. The skip link ("Skip to what needs attention") and the top bar's section links work, and the forced-colors and reduced-motion rules stay. | [RULE-WF-06](03-research-and-data.md#rule-wf-06), [RULE-WF-07](03-research-and-data.md#rule-wf-07) (A) | KEEP-12, KEEP-29, KEEP-30, KEEP-32 |
| Loading, failure and guards | "Loading today's report…" shows until the data arrives, with no tile, chip or row drawn. A file that fails to load gives a plain message, never a blank or stuck page (in Phase 1, the banner of section 6.2, with the "Try again" button). Each section is drawn inside its own guard. | [LOAD-02](02-findings.md#load-02), [LOAD-03](02-findings.md#load-03) | KEEP-25, KEEP-26, KEEP-27 |
| Escaped text | Every CSV value is escaped before it reaches the page: the list, the tank cards, the tiles, the Now grazing list, the budget table and every chart reading. | [SEC-01](02-findings.md#sec-01) | KEEP-28 |

New controls (the data checks panel's "Show {n} notes" button) follow the same rules: a real button, at least 24 x 24 CSS px, at
least 42 px tall on a phone, with the 2 px focus ring. New tables (the data checks panel, and the rules table with its
Basis column) fit at 320 px without sideways scroll. The banner uses `role="alert"`; `#tip` keeps `role="status"`.

**Not kept as a feature.**

- Two kinds of mark show status by colour without an icon or word of their own: the flagged gain dots (the dot differs
  by hue only, although its reading and the legend name the flag) and the meters on the gain and spend tiles. They are
  known issues of the redesign that a separate pull request fixes (section 15). KEEP-24 counts the gain chart's dots
  as `circle` elements, one per keyboard reading, and the flagged ones by a fill that differs from the other dots and
  matches a legend key; the separate pull request that fixes the colour-only marks may change KEEP-24 to count its new
  mark, and says so. Phase 1 does not count them as features to keep, and Phase 1 adds no mark like them.
- `#tip` cannot be hovered or clicked to keep it open (`pointer-events: none`). That part of
  [RULE-WF-03](03-research-and-data.md#rule-wf-03) stays in P2-05 (section 14).
- The whole-page failed-load state, and the uncaught page error it throws today, are replaced by section 6.2's
  per-file states; P1-06 item 8 asks for no `pageerror`.

**Kept, but not asserted by a preserve check:** the "Try again" button (measured at 44 px); a budget row with no bar
when the category is exactly on budget (the committed data has no such row); the gain chart's "Under 80%
of target" group badge; the gain chart's target, 80% and 50% lines and its "Not shown" note; the grazing chart's "days
past plan" label and triangle; the grazing chart's days-left shading and planned-move tick (P1-08 item 7 allows them
past the Today line but does not require them); the chip group's "Filter by area" label; the ellipsis on long chart
names; a silent tank's shading and "no signal" label; the Now grazing list beyond its pills; `aria-current` on the
Grazing and Gain links at 961 px and wider; the phone nav keeping a focused link clear of its fade; the forced-colors
styles. The empty-chart message is tested by P1-06 item 2 and P1-14 item 5.

**Limits of the checks.** At 320 px the budget table runs 8.7 px into its card's right padding (inside the card, with
no cell cut off). A budget category whose markup has a long unbroken run of characters still widens `#budgetTable`
past a phone window (414 to 480 px at 390 px with the categories of section 7 and P1-13 items 4 and 6; Playwright
Chromium on main `0315d09`, 2026-10-20). No check keeps it; the follow-up pull request of section 15 fixes it. KEEP-09
has not been run on Phase 1's new tables. The touch slide uses Chromium touch events. KEEP-27
depends on the section container ids staying.

---

## 7. Safe rendering

Finding: [SEC-01](02-findings.md#sec-01) ("CSV text is written into the page with innerHTML at 9 places").

- **Rule.** No string that contains CSV-derived text is assigned to `innerHTML`, `outerHTML` or `insertAdjacentHTML`
  unless every CSV-derived part has passed through `esc()`. Prefer building nodes and setting `textContent`; SVG text
  uses `textContent` as well.
- **`esc(s)`** in `format.js` replaces `&`, `<`, `>`, `"` and `'` with entities and converts `null` to "". It is the
  only escaping function.
- **Places at the reviewed commit** (the 9 places in [SEC-01](02-findings.md#sec-01)'s location; the redesign rewrote
  them, see the next point):
  `app.js:28` the tooltip helper `hover()` (`tip.innerHTML = html`); `:54` tiles (group names); `:68` exception rows
  (subject and problem); `:82` water chart headings (tank and pasture names); `:104` the water tooltip (tank and pasture
  names; it sets `tip.innerHTML` itself, not through `hover()`); `:143` the grazing tooltip (group and pasture names,
  through `hover()`); `:170` the gain tooltip (tag and group, through `hover()`); `:194` the budget tooltip (category,
  through `hover()`); `:198` the budget table (category). Already safe: chart axis and bar labels, drawn by `text()`
  with `textContent` (`app.js:16-18`). No CSV text today: the area chips (`:62`) and the rules table (`:216`); the
  rules table becomes generated from `RULES` and `RULE_INFO` (section 10.1) and must stay free of CSV text. Static
  markup written by the code (no data) may keep `innerHTML`.
- **On main (the redesign), the places to change.** The redesigned `app.js` already passes every CSV value through
  `esc()` (`app.js:24`) before it goes into markup ([08 section 3.1](08-redesign-coverage.md#31-addressed-on-the-page)).
  The places that write CSV text, by function: `showTip()` (the readings built in `tankChart()`, `grazingTimeline()`
  and `gainStrip()`); `tiles()` (group names, and tank IDs in the water tile's icons and their `title` and
  `aria-label`); `exceptionsTable()` (subject and problem); `waterMultiples()` (tank cards); `grazingTimeline()` (the
  Now grazing list); `gainStrip()` (the "Not shown" note, through `insertAdjacentHTML`); `budget()` (`#budgetTable`).
  No CSV text: the summary card, the chips, `#budgetLegend`, `#waterSum` and the rules table. Phase 1 moves `esc` to
  `format.js`, keeps every one of these escaped, and tests each.
- **Attributes.** Data never goes into `on*` attributes, `style`, `href` or `src`. Data in `data-*` attributes is
  set with `setAttribute` or `dataset`. Data in `title` or `aria-label` attributes is set with `setAttribute`, or, when
  it is written as markup, passes through `esc()` inside a double-quoted attribute (the redesign does this for the tank
  IDs in the water tile's icons, `app.js:213`).
- **Test.** A test file set with `<img src=x onerror=...>`, `<b>x</b>`, `<script>` and a plain "<A" in pasture, tank,
  tag, group, task and category names: no injected element (no `img` or `script` element in `main` or `#tip`, and no
  `b` element whose text is "x"; the page's own `<b>`, `<i>` and `<small>` markup is allowed), no `window.__xss_*`
  flag set, the text shown literally wherever it appears (the head tile prints group names in lower case). The same
  names in each of the three chart readings in `#tip` (a tank chart in `#tanks`, `#grazing svg.chart` and
  `#gain svg.chart`), each reached three ways: hovering a data point, focusing the `svg.chart` and pressing the arrow
  keys, and a touch tap (Playwright `hasTouch`). The redesign replaced the budget chart and its tooltip with the budget
  table, so category names are checked in `#budgetTable` (section 12, P1-13 items 4 and 6; preserve check KEEP-28,
  section 6.3).

---

## 8. Generator changes

File: `scripts/generate_data.py`. Finding: [HLTH-03](02-findings.md#hlth-03). Constraint: the 10 planted problems keep
their severities, and `rng` (seeded 2026) is called exactly as today, in the same order, so `pastures.csv`,
`groups.csv`, `moves.csv`, `weights.csv`, `water.csv` and `budget.csv` stay byte-identical.

| Change | Detail | Random draws |
|---|---|---|
| `tanks.csv` (new) | `write("tanks.csv", ["tank_id", "pasture_id"], TANKS)` from the existing `TANKS` list (T1-P1 ... T8-P8). | none |
| `weigh_sessions.csv` (new) | `group,date,weight_basis` with six rows: Heifers and Yearlings on 2026-06-01, 2026-07-20 and 2026-09-15, each `full`. The dates are the weigh dates the generator already uses. | none |
| `meta.csv` | `as_of,timezone,season_start,books_closed_through,demo` / `2026-09-30T18:00,America/Chicago,2026-06-01,2026-09,true`, written with the same `write()` helper as the other files. | none |
| `health.csv` | The Fly tag row becomes `Cows,Fly tag check,2026-09-01,,done` (HLTH-03's own example: "last_done 2026-09-01, next_due blank"). | none (the list is literal) |
| Order in `main()` | New writes are added after the existing ones, so no existing call moves. | |
| `PLANTED` and README | Unchanged list of 10. README's data table gains the two new files and the meta columns. | |

Check after the change: `python scripts/generate_data.py` twice gives identical files; the six unchanged files match
the reviewed commit byte for byte (SHA-256); `evaluate` on the committed data gives the 10 rows of section 5.7 and no
issue.

In the same change, update the scenario folders' inputs with `docs/audit/diagnostics/scenarios.build.py` (decision D16;
details in [section 11.2](#112-scenario-tests)): rebuild `01-planted-problems` from the regenerated `data/`, which is
that folder's own stated precondition, and add `books_closed_through` and `weigh_sessions.csv` to the other folders.
No `expected.json` result changes.

---

## 9. Configuration

`RULES` in `exceptions.js` stays the single place for thresholds; `RULE_INFO` beside it gives each key its class,
basis label and the rule ID it belongs to, and the rules table is generated from both. Classes: A supported general
guidance; B context-dependent guidance; C ranch-specific management choice; D synthetic demonstration setting. No
threshold below is validated operating guidance.

| Key | Value | Unit | Class | Used by | Basis shown on the page |
|---|---|---|---|---|---|
| `waterCritical` | 25 | % full | C | [RULE-WAT-01](03-research-and-data.md#rule-wat-01) | Ranch choice (C); demo value |
| `waterLow` | 40 | % full | C | [RULE-WAT-02](03-research-and-data.md#rule-wat-02) | Ranch choice (C); demo value |
| `waterDropPts` | 30 | points | D | [RULE-WAT-03](03-research-and-data.md#rule-wat-03) | Demo setting (D) |
| `waterDropWindowHours` | 24 | hours | D | [RULE-WAT-03](03-research-and-data.md#rule-wat-03) | Demo setting (D) |
| `sensorSilentHours` | 24 | hours | C | [RULE-WAT-04](03-research-and-data.md#rule-wat-04) | Ranch choice (C); an assumption until each device's reporting interval is recorded |
| `graceDays` | 2 | days | D | [RULE-GRZ-02](03-research-and-data.md#rule-grz-02) | Demo setting (D) |
| `planned_graze_days` (data) | per pasture | days | C | [RULE-GRZ-01](03-research-and-data.md#rule-grz-01) | Ranch plan (C), from pastures.csv |
| `adgSerious` | 0.8 | share of target | C | [RULE-GAIN-01](03-research-and-data.md#rule-gain-01) | Ranch choice (C); demo value |
| `animalShare` | 0.5 | share of target | C | [RULE-GAIN-02](03-research-and-data.md#rule-gain-02) | Ranch choice (C); demo value |
| `target_adg_lbs` (data) | 2.0 / 1.0 / 0.0 | lbs/day | D | [RULE-GAIN-03](03-research-and-data.md#rule-gain-03), [-04](03-research-and-data.md#rule-gain-04), [-05](03-research-and-data.md#rule-gain-05) | Demo setting (D), from groups.csv |
| `gainMinDaysGroup` | 21 | days | D (the minimum is a C rule) | [RULE-GAIN-07](03-research-and-data.md#rule-gain-07) | Demo setting (D) |
| `gainMinDaysAnimal` | 42 | days | D | [RULE-GAIN-07](03-research-and-data.md#rule-gain-07) | Demo setting (D); the research default for controlled tests is about 70 days and is not used (decision D6) |
| `gainSessionMinShare` | 0.5 | share of head | D | section 5.4 | Demo setting (D) |
| `gainMinCoverage` | 0.8 | share of head | D | [RULE-GAIN-10](03-research-and-data.md#rule-gain-10) | Demo setting (D) |
| `gainMaxAgeDays` | 45 | days | D | [GAIN-08](02-findings.md#gain-08) | Demo setting (D) |
| `weightMinLbs`, `weightMaxLbs` | 200, 2,500 | lbs | D | [GAIN-04](02-findings.md#gain-04) | Demo setting (D); per-class ranges later |
| `adgMinLbs`, `adgMaxLbs` | -3, 5 | lbs/day | D | [GAIN-04](02-findings.md#gain-04) | Demo setting (D) |
| weigh-basis gate | on | | C | [RULE-GAIN-06](03-research-and-data.md#rule-gain-06) | Ranch choice (C) |
| `dueSoonDays` | 7 | days | D | [RULE-HLTH-02](03-research-and-data.md#rule-hlth-02) | Demo setting (D) |
| overdue is serious | | | D | [RULE-HLTH-01](03-research-and-data.md#rule-hlth-01) | Demo setting (D) |
| `budgetWarnPct` | 0.05 | share | D | [RULE-BUD-02](03-research-and-data.md#rule-bud-02), [RULE-BUD-03](03-research-and-data.md#rule-bud-03) | Demo setting (D) |
| `budgetSeriousPct` | 0.10 | share | D | [RULE-BUD-01](03-research-and-data.md#rule-bud-01), [RULE-BUD-03](03-research-and-data.md#rule-bud-03) | Demo setting (D) |
| `budgetWarnUsd` | 500 | USD | D (structure C) | [RULE-BUD-03](03-research-and-data.md#rule-bud-03) | Demo setting (D) |
| `budgetSeriousUsd` | 1,000 | USD | D (structure C) | [RULE-BUD-03](03-research-and-data.md#rule-bud-03) | Demo setting (D) |
| `budgetLargeUsd` | 2,500 | USD | D (structure C) | [RULE-BUD-03](03-research-and-data.md#rule-bud-03) | Demo setting (D) |
| `unbudgetedUsd` | 250 | USD | D (structure C) | [RULE-BUD-06](03-research-and-data.md#rule-bud-06) | Demo setting (D) |
| closed months only | | | C | [RULE-BUD-05](03-research-and-data.md#rule-bud-05) | Ranch choice (C); `books_closed_through` in meta.csv |
| compare with the phased plan | | | A | [RULE-BUD-04](03-research-and-data.md#rule-bud-04) | Supported general guidance (A) |

Rules on settings: each value is validated when the module loads (numbers finite, `waterLow > waterCritical`, shares
from 0 to 1, `gainMinDaysGroup` and `gainMinDaysAnimal` whole numbers of at least 1); an invalid setting makes its rule CAN'T TELL with "threshold not set" rather than throwing
(`data-fields.json`: "Not configured: show levels without severity and say 'threshold not set'"). The rules table
prints each value with `fmtSetting`, so 0.07 prints as "7" and never "7.000000000000001" ([UI-08](02-findings.md#ui-08)).

---

## 10. Rules table and page copy

### 10.1 Rules table

Generated from `RULES` and `RULE_INFO`. Columns: Area, Severity, Flags when, Basis. Rows (wording at the demo values):

| Area | Severity | Flags when | Basis |
|---|---|---|---|
| Water | Critical | A fall of 30 points or more within the last 24 hours (unexplained fall; leak not confirmed) | Demo setting (D) |
| Water | Critical | Level under 25% | Ranch choice (C) |
| Water | Warning | Level under 40% | Ranch choice (C) |
| Water | Serious, can't tell | No reading for 24 hours, no readings at all, or the last reading is not a level; the last level is not judged | Ranch choice (C) |
| Water | (note) | Water severity uses level percent only; it does not yet use tank size or the cattle drinking from it. Sensors supplement, and do not replace, checking tanks by eye. | |
| Grazing | Serious | A group is past its planned move date (planned_out_date, or the pasture's planned graze days) | Ranch plan (C) |
| Grazing | Warning | A planned move is today or within 2 days | Demo setting (D) |
| Gain | Serious | A group's pooled daily gain between its last two weigh-ins (at least 21 days apart) is under 80% of target | Ranch choice (C); interval demo setting (D) |
| Gain | Warning | Animals under 50% of target over at least 42 days (skipped when the whole group is flagged) | Ranch choice (C); interval demo setting (D) |
| Gain | Can't tell | Fewer than 80% of the group weighed at both weigh-ins, last weigh-in over 45 days old, weighing conditions differ, or head 0 in groups.csv while animals were weighed in the last 45 days | Demo settings (D); weigh basis ranch choice (C) |
| Gain | (note) | Groups with no gain target (Cows), and groups with head 0 in groups.csv and no weigh-in in the last 45 days, are not judged on gain. | |
| Health | Serious | An open task is past its due date | Demo setting (D) |
| Health | Warning | An open task is due today or within 7 days | Demo setting (D) |
| Health | Can't tell | An open task has no readable due date | Ranch choice (C) |
| Budget | Serious | More than 10% and at least \$1,000 over budget, closed months season to date | Demo settings (D) |
| Budget | Warning | 5-10% and at least \$500 over (or more than 10% but under \$1,000 over), or at least \$2,500 over at any percent | Demo settings (D) |
| Budget | Warning | \$250 or more spent with no budget | Demo setting (D) |
| Budget | Can't tell | A closed month is missing an amount | Ranch choice (C) |

Under the table: "Thresholds are demonstration settings (D) or ranch choices (C) for a fictional ranch, not validated
guidance; tune them in RULES. Finding the 10 planted problems shows the rules find what the generator planted; it does
not show the thresholds are right." ([RULE-WF-20](03-research-and-data.md#rule-wf-20),
[RULE-WF-21](03-research-and-data.md#rule-wf-21)).

### 10.2 Page copy changes

| Where | Today | Phase 1 |
|---|---|---|
| Tank tile label | "Water tanks OK" | "Sensors normal" ([RULE-WAT-15](03-research-and-data.md#rule-wat-15)) |
| Water subject | "Heifers here now" | "Heifers there as of 2026-09-30" |
| Gain period | "since 2026-07-20" | "between the 2026-07-20 and 2026-09-15 weigh-ins" ([GAIN-11](02-findings.md#gain-11)) |
| Gain chart heading | "Daily gain since the last weigh-in" | "Daily gain between the last two weigh-ins" |
| Gain tile | "Yearling gain", "1.94 lbs/day", "Target 2.0, since Jul 20" (Yearlings when they have a target, else the first group with one) | the judged group with the lowest G / target, "{G} lbs/day {group} (target {target})": on the committed data "0.44 lbs/day Heifers (target 1.0)" (section 5.4) |
| Gain chart note | "One dot per animal against the group's target." The hint above the charts reads "Hover, tap or focus a chart and use the arrow keys to read each reading.", or "Tap a chart, or slide a finger along it, to read each reading." on a touch screen | unchanged: the page already gives chart readings by touch and keyboard (section 6.3) |
| Grazing chart reading, current stay | "{n} days", "{group} in {pasture id} {name}", "{in date} to now · plan {p} days" (`app.js:398` on main; `app.js:143` at `cfd77e5`) | "{in date} to {as-of date} (as of) · plan {p} days"; the value stays first |
| Grazing note | "Each group's pasture moves this season. A current stay shows the days left on its plan, or the days past it." | "Each group's pasture moves this season. Only the current stay shows the days left on its plan, or the days past it; earlier stays are not marked." ([GRZ-06](02-findings.md#grz-06)) |
| Exception card note | "Every row is a rule a manager would act on, worst first. The thresholds are listed under Rules at the bottom of the page." | adds "Rows marked Can't tell need a check before anyone can say all is well." |
| Header | Top bar "Data as of Sep 30, 6:00 PM" (hidden at 860 px wide or less) and the as-of facts "As of September 30, 2026 at 6:00 PM", both in the viewer's zone | "Data as of Sep 30, 2026, 6:00 PM CDT (America/Chicago)" plus "Fictional snapshot, not live" in the as-of facts (`#asof`), shown at every width; the top-bar stamp also names the zone ("6:00 PM CDT") |
| Empty All filter | "Nothing needs attention." (the redesign already fixed it) | unchanged ([UI-07](02-findings.md#ui-07)) |
| Footer | fictional data note | unchanged |

README changes in the same release: the rules table matches 10.1; the chart paragraph ("Every chart can be read with a
mouse, a tap or the keyboard ... On a phone the report turns into cards and the tables fit the screen.") stays, because
the page already does this (section 6.3); "To use real data, replace the CSVs with exports in the same columns" becomes a short
pointer to the data contract (section 3) and says the dashboard is a demonstration; "the group grazing that pasture
right now" becomes "the group in that pasture as of the data date".

---

## 11. Test plan and CI

### 11.1 Unit tests (`node --test`)

| File | Covers |
|---|---|
| `tests/csv.test.mjs` | Decoding (BOM, UTF-8, Windows-1252 fallback), RFC 4180 cases, line endings, trimming, blank, title, repeated-header, short and long rows, row numbers, unclosed quote. |
| `tests/time.test.mjs` | Date, month and timestamp grammar; impossible dates; offsets and `Z`; ranch-zone conversion including a spring-forward gap and a fall-back overlap in America/Chicago (2026-03-08 02:30 does not exist; 2026-11-01 01:30 occurs twice); `daysBetween` across a daylight-saving change; header formatting. |
| `tests/schema.test.mjs` | Every column of every file: required, type, range, blank → null, IDs as strings, references, case mismatch, duplicates and their resolutions, as-of cut-off, meta fallbacks. |
| `tests/water.test.mjs`, `grazing.test.mjs`, `gain.test.mjs`, `health.test.mjs`, `budget.test.mjs` | Each step of section 5 at its boundary (just inside and just outside), with exact problem and action text. |
| `tests/format.test.mjs` | `esc`, money and percent rounding, negative zero, `fmtSetting`, `fmtBelow`, plurals; run with `LANG=de_DE.UTF-8` too. |
| `tests/exceptions.test.mjs` | The existing 8 tests, updated where wording changes (section 13), plus the 10-row committed-data test of section 5.7 and "no issue on committed data". |

The water and grazing boundary tests from [TEST-01](02-findings.md#test-01) and [TEST-02](02-findings.md#test-02) are
written **first**, against today's code where its wording allows, so the refactor is pinned (P1-17 part a).

### 11.2 Scenario tests

Scenario tests come from two sources. Both run under `node --test` in the time-zone matrix of section 11.3.

**1. End-to-end folders: `docs/audit/scenarios/`.** Ten complete fictional data sets, each with `expected.json` (the
expected Phase 1 rows, absences, area states and tiles, with the hand arithmetic behind each number) and `scenario.md`.
`settings.json` lists the demonstration settings the expected results assume ("None is a validated operating value").
`docs/audit/diagnostics/scenarios.build.py` writes the folders ("Python arithmetic on this folder's CSV files. It never
calls exceptions.js or app.js."); `scenarios.run.mjs` runs them against today's code. Its recorded result
(`run-results.json`) is MATCH for 01 and 02 and MISMATCH for 03 to 10 in both node and browser modes; for example, 05
stops with "TypeError: Cannot read properties of undefined (reading 'name') (at exceptions.js:59)".

| Folder | What it exercises (from its `expected.json`) | Findings it names |
|---|---|---|
| 01-planted-problems | The committed data byte for byte: the 10 rows of section 5.7 | LOAD-01, HLTH-03, TIME-02, WAT-02 |
| 02-healthy-operation | Every planted problem removed: no rows, every area OK | UI-07, LOAD-01 |
| 03-incomplete-and-stale | health.csv missing; heifers' last weigh-in 72 days old; T7 silent 30 hours; T8 not in the export; a blank actual | LOAD-01, GAIN-08, WAT-02, BUD-01, BUD-02 |
| 04-irregular-sensor-readings | A 72-hour gap (T1), conflicting (T3) and exact (T5) duplicates, out-of-order rows (T7), a future reading (T6), a fault code (T8) | WAT-01, WAT-03, WAT-07, DATA-03, TIME-01 |
| 05-missing-groups-and-pastures | Yearlings renamed Steers everywhere; an open stay in unknown P9; Bulls in moves.csv only | DATA-01, LOAD-03, LOAD-02 |
| 06-sparse-and-conflicting-weigh-ins | One weigh-in (Y151), a same-day duplicate (Y001), a group change (H004), an off-session re-weigh, 3 of 45 heifers on Sep 15 | GAIN-01, GAIN-02, GAIN-03, GAIN-06, GAIN-07, GAIN-08, GAIN-14 |
| 07-zero-budgets-credits-future-months | \$500 with no budget (Hay), \$200 with no budget (Ear tags), a "(150)" credit, October and November plan rows | BUD-01, BUD-02, BUD-03, BUD-04 |
| 08-historical-as-of-and-future-records | as_of 2026-09-27T18:00-05:00 while the files run to Sep 30 | TIME-01, TIME-02, GRZ-01, BUD-01, UI-06 |
| 09-exact-rule-boundaries | Demonstration thresholds hit exactly, most with a neighbour (levels 25 and 40, the 30-point drop, 24 h silence, the planned move, animal ADG, due-soon and overdue, the 5% and 10% budget lines). The 2-day grace and the group ADG lines are hit exactly with no neighbour; the \$500, \$1,000, \$2,500 and \$250 dollar lines, the 45-day age, the 21-day interval and the 50% session share are at a boundary in no folder | WAT-08, GAIN-11, GAIN-12, BUD-04, BUD-05, BUD-06, UI-06, TEST-01, TEST-02 |
| 10-malformed-and-hostile-csv | Quoted commas and quotes, a quoted "1,169", BOM, blank rows, a header typo ("staus"), doubled-CR line ends, `<img onerror>` in a pasture name | CSV-01, CSV-02, CSV-03, CSV-05, CSV-06, SEC-01, LOAD-01 |

`tests/scenarios.test.mjs` reads each folder's files as bytes (a file absent from the folder is status `missing`, as
the page gets a 404), runs `decodeBytes`, `parseCSV`, `buildDataset`, `evaluate` and `tileSummary`, and applies the
folder's own matching rule, quoted from `expected.json`: "every needs-attention row the implementation shows must be
one of expected_rows (or allowed_extra_rows); data-issue and CAN'T TELL rows may carry extra wording. A row matches on
area, kind and subject_key; state (or a listed alternative) and severity must agree; every key number must be shown,
correctly rounded to the precision shown". The terms map to this specification as follows:

| `expected.json` | Phase 1 result |
|---|---|
| state `needs-attention` | a row with `kind: "alert"` |
| state `cant-tell` | a row with `kind: "cant_tell"` |
| state `data-issue` | an issue (section 4.1) in that area whose message names the subject or one of `key_text_any`, or a CAN'T TELL row for that subject |
| area `Data` | a file-level issue (meta.csv) |
| `severity: null` | severity not compared |
| `subject_key` by `kind` | `tank` → `refs.tankId`; `stay`, `group`, `animals` → `refs.group` (case-insensitive for `animals`); `task` → "{group}: {task}"; `category` → `refs.category`; `record`, `file` → the issue's subject, file or message |
| `expected_absent` | no `alert` row with that area, kind and subject |
| `area_states` `ok` / `needs-attention` / `cant-tell` | `ok` / `attention` / `cant_tell` |
| `tile_expectations` | `tileSummary(result)`, with the same checks as `compareTiles` in `scenarios.run.mjs`; the `needs_attention` entry is checked against the counts `tileSummary` returns (section 5.1), which the page shows in the summary card `#summary`, not in a tile |
| `render_expectations` (folder 10) | the browser smoke test (section 11.4) |
| `must_not_appear_anywhere` | every row text, issue message and tile text |

**Inputs to add before the folders can pass (decision D16).** The folders were built before the Phase 1 contract
fields existed. Four gaps change the result under this specification. Each is fixed in the inputs with
`scenarios.build.py`, in the same change as the generator (section 8); no `expected.json` result changes.

| Gap | Folders | Result under this specification if left | Input fix |
|---|---|---|---|
| `meta.csv` has no `timezone` | 01 | `META_NO_TIMEZONE` (error; `data-fields.json`: "treat time-based rules as CAN'T TELL"). On its own this gap makes every tank CAN'T TELL "Time zone not set" under section 5.2: T2 (11.8%) and T4 (10.0%) critical, the other six serious. T2's level alert and T4's drop alert become CAN'T TELL rows, the water tile reads 0 of 8, and the exception table has 15 rows (2 critical, 11 serious, 2 warning; 8 can't tell) instead of 10 (computed for this specification from section 5.2; not audit evidence) | Rebuild 01 from the regenerated `data/`, as its `scenario.md` asks ("Once the generator writes `meta.timezone`, `tanks.csv` and HLTH-03's row fix, rebuild this folder ... The 10 expected rows do not change.") |
| no `tanks.csv` | 01 | `TANK_LIST_MISSING` (warning; `expected.json` allows it as X-TANKS) | covered by the rebuild |
| no `books_closed_through`, as-of 2026-09-30 | 01 to 07, 09, 10 | the default closes 2026-08 (decision D1, [RULE-BUD-05](03-research-and-data.md#rule-bud-05)); see the budget check below | add `books_closed_through` = 2026-09. Folder 08 (as of 2026-09-27) keeps none, so it tests the default; `expected.json` allows the note as X-BUDGET-OPEN |
| no `weigh_sessions.csv` | all 10 | every judged gain group is CAN'T TELL (`data-fields.json` weight_basis: "Basis unknown or different between the two sessions: ADG shown as provisional, with no serious or individual flags (CAN'T TELL)") | add `weigh_sessions.csv`: one row per group and weigh date in `weights.csv`, `weight_basis` = `full` |

Folders 02 to 10 also have no `season_start`. That changes no result: the default (the earliest month in `budget.csv`,
2026-06 in every folder) is the generator's value, and it adds only the `META_SEASON_ASSUMED` note. Extra notes and
data issues are allowed by the folders' matching rule, which is exact only for needs-attention rows.

Budget check (computed for this specification with D2's lines from the folders' `budget.csv`; not audit evidence):

| Folders | Closed through 2026-09 (the folders' convention, and the value D16 writes) | Closed through 2026-08 (the default if nothing is written) |
|---|---|---|
| 01, 03 to 06, 10 | Fuel serious 21.25% (\$2,040); Repairs serious 25.0% (\$1,800), as expected; in 03 also Vet and health CAN'T TELL (2026-09 actual blank), as expected | Fuel serious 20.0% (\$1,440); Repairs warning 13.3% (\$720); in 03 the Vet and health CAN'T TELL row is lost (its blank actual is in September) |
| 07 | as above, plus Hay warning "\$500" with no budget, as expected | as above; no Hay row (its \$500 is in September) |
| 09 | Feed 10.0% (\$2,480), Labor 5.0% (\$1,800), Repairs 10.0% (\$720), Vet and health 10.5% (\$630), all warnings, as expected | Feed 10.0% (\$1,860), Labor 5.0% (\$1,350), Repairs 10.0% (\$540); no Vet and health row |
| 02 | no rows, as expected | no rows |
| 08 | (not applicable: September is open on 2026-09-27) | Fuel serious 20.0% (\$1,440); Repairs warning 13.3% (\$720), as expected |

**Settings that differ from `settings.json`.** Computed for this specification from the folders' CSV files (not audit
evidence, and not run against any implementation):

| Setting | `settings.json` | This specification | Effect on the 10 folders |
|---|---|---|---|
| 24-hour drop | "(highest level in [last - 24 h, last]) - last level, rounded to 0.1, >= 30" | largest fall inside the same window (max drawdown, decision D5) | Same verdict for every tank in every folder. The values differ only where a fall recovered, partly or fully, inside the window, all far under 30 (largest gap among judged tanks: T8 in 01, 02, 05, 06, 07 and 10, 0.0 against 9.9; folder 04's T8 would give 0.0 against 15.6, but its newest reading is 'ERR', so step 4 applies first). The shown drops agree: T4 46.0, folder 04's T3 67.6, folder 09's T6 30.0. |
| Fewer than 2 readings in the window | "the 24-hour change is CAN'T TELL ('not enough recent history'), the level is still judged" | the same (section 5.2 step 8, added to match folder 04's T1) | none |
| Individual gain minimum | 21 days ("used for the group and, in these fixtures, for the individual rule too") | 42 days (decision D6) | none: every judged pair is 2026-07-20 to 2026-09-15, 57 days |
| Coverage gate | 0.5 ("scenario assumption") | 0.8 (D) | none: wherever a group is judged, 45 of 45 heifers and 150 of 150 yearlings are matched; folder 06's heifers fail on age (72 days) at either value |
| Closed months | "a month counts when the ranch as-of date is on or after its last day" | `books_closed_through`, default the month before as_of (decision D1) | none once D16's inputs are added |
| Weigh basis | not modelled | the gate of section 5.4 step 6 (decision D9) | none once D16's inputs are added |

The other settings agree: tank levels below 25 (critical) and 40 (warning), silence at 24 hours or more, a 2-day
grace with "due today" at 0, 0.8 and 0.5 of target (strict), a 45-day age limit, a session at half the head, 7 days to
due, open / done / cancelled, budget warning at 5% and \$500, serious above 10% and at least \$1,000, \$2,500 at any
percent, and \$250 with no budget. No folder tests a coverage share between 0.5 and 0.8 or an individual interval of 21
to 41 days, and no folder puts the \$500, \$1,000, \$2,500 or \$250 dollar lines, the 45-day age limit, the 21-day
interval or the 50% session share exactly at its boundary (folder 09's own list), so the unit tests of section 11.1
must. `settings.json` carries a `phase_1` note on each setting above that differs, and its classes for
`plannedGrazeDays` (C) and `unbudgetedUsd` (D, structure C) match section 9.

**Changes this specification made to match the folders.** Section 5.2 step 8 (folder 04's T1 expects a CAN'T TELL row,
not a note); `GAIN_NOT_REWEIGHED` (folder 06's Y151 expects a CAN'T TELL row or a data issue); the needs attention
summary (section 5.1) counts CAN'T TELL rows (folder 01 expects "2 critical, 6 serious, 2 warning" with T6 CAN'T TELL).

**Expected outcome.** With the inputs added, every folder should pass. This is reasoning from the folders' arithmetic
and section 5, not a test result: nothing has been implemented. If a folder and the new code disagree, the lead decides
whether the rule or the folder is wrong, and the decision is recorded in both places.

**2. Single-change fixtures: `tests/fixtures/<case-id>/`.** Built from the case definitions in the audit's diagnostics
scripts (`csv.repro.mjs`, `water.repro.mjs`, `grazing.repro.mjs`, `gain.repro.mjs`, `healthbudget.repro.mjs`,
`time.repro.mjs`, `render.repro.mjs` and their `verify` and `browser` variants). Each fixture is the committed data
(after section 8) plus the change the case describes (which may replace whole files, as set out below), stored as
complete CSV files so the test does not depend on the
diagnostics scripts. The same test file runs them through `buildDataset` and `evaluate` and checks the rows and issues
listed in section 12.

**What each fixture replaces.** Unless section 12 says otherwise, the base is the committed data after section 8: meta
as_of 2026-09-30T18:00 with timezone America/Chicago, and `tanks.csv` listing T1-T8. Three kinds of case use it:

- *Committed data plus a change* ("with every T6 row removed", "T2's 2026-09-30T18:00 level set to ERR"): only the
  named rows change. `tanks.csv` keeps T1-T8, so the other tanks keep their committed results (T2 and T4 critical, T6
  CAN'T TELL), and water expectations are stated per tank.
- *Inline water rows* (water.repro:W-01 to W-04, W-11, csv.verify:CV-03, the rows written out in P1-03 items 2 and 9,
  P1-07 items 1, 2, 4, 9 and 10, and P1-17 item 1): `water.csv` holds only the listed rows and `tanks.csv` lists only
  the tanks in them, each in the pasture its rows give, unless the item names the pasture. The other files stay
  committed, so "there as of" context still comes from the committed moves.
- *render.repro cases* (R13, R17): that script's small inline set (two tanks, two groups), which has no time zone and no
  `tanks.csv`. The Phase 1 fixture adds `timezone` America/Chicago to its meta.csv and a `tanks.csv` for its tanks;
  without the zone, section 5.2 would make every tank CAN'T TELL "Time zone not set".

### 11.3 Time-zone matrix

The whole unit and scenario suite runs three times: `TZ=UTC`, `TZ=America/Chicago`, `TZ=Pacific/Auckland`. Results
must be identical ([TIME-02](02-findings.md#time-02)).

### 11.4 Browser smoke test

`tests/browser/smoke.mjs` with Playwright Chromium, pinned as a development dependency in a new `package.json`, with its
`package-lock.json` committed beside it (the CI step in section 11.5 runs `npm ci`, which fails without the lock file).
No runtime dependency, no build step; the page itself still loads nothing from npm. It serves the repository with a small
static server and checks the redesigned page, using the page terms of section 12:

1. **Committed page** at 1280 x 900: no `pageerror`; 10 rows in `#exceptions tbody`; the data checks panel says "No
   data problems found"; 4 tiles, found by label ("Head on grass", "Sensors normal", the gain tile and "Spend vs
   budget"); 8 tank cards (`#tanks .tank`), each with one `svg.chart`; one `svg.chart` in `#grazing` and one in
   `#gain`; `#budgetTable` with 6 category rows in `tbody`, the Repairs row reading "+\$1,800" beside a "Serious" pill
   with its icon, 1 season-total row in `tfoot` reading "Season total", "\$88,400", "\$89,303" and "+\$903", and no
   separate budget chart; the rules table drawn from section 10.1; `#asof` contains "CDT" and "Fictional snapshot".
   Keyboard: all 10 `svg.chart` have `tabindex="0"` and Tab reaches them in page order (8 tanks, then grazing, then
   gain); on each, focus plus an arrow key shows a reading in `#tip` (`role="status"`) that lies inside the window and
   below the top bar (`.topbar`); with T4 focused `#tip` reads "10%" and "T4 Lone Tree · Sep 30, 6 PM"; ArrowLeft shows
   the reading before it; Escape hides `#tip`. Mouse: hovering a data point on each chart shows its reading.
2. **Failure states**, with `page.route`: health.csv 404 (banner; the Health chip's badge `.n` reads "can't tell", not
   "0"); water.csv header-only (no "0 of 0"; 8 tank cards, each saying it has no readings); budget.csv aborted (banner,
   other sections drawn, no "NaN" on the page); every CSV delayed 3 s (`/loading/i` visible at 1 s).
3. **Hostile file set** (section 7) at 1280 x 900 with `hasTouch`: no injected elements, and the names shown literally
   in the three chart readings, each reached by hover, by keyboard and by a touch tap. (At 390 px a hostile category
   name with a long unbroken run of characters, such as `onerror="window.__xss_c=1">`, widens `#budgetTable`, the page then zooms out under `isMobile` and taps miss, so this item runs
   at 1280 px; item 4 checks the phone layout on the committed data.)
4. **Phone layout**, committed data with `hasTouch` and `isMobile`, at 390 x 844 and at 320 x 640: no `pageerror`; no
   horizontal scroll (`document.documentElement.scrollWidth` <= its `clientWidth`); each of the 10
   `#exceptions tbody tr` is shown as a card (`display: grid`) with its `.c-problem` and `.c-action` cells inside the
   window (right edge 358 at 390 px today); the 8 tank cards in one column; every `svg.chart` drawn at the width of its
   box (viewBox width within 1 px of its rendered width), with chart text at least 11 px as rendered (computed font
   size x rendered width / viewBox width; 11.5 px today); the Repairs row of `#budgetTable` shows "\$9,000 of \$7,200"
   and "+\$1,800" inside the window, with the Budget and Actual columns hidden; `#rulesMore` stays closed until "Show
   the rules" is pressed, and one tap then shows the rules rows; the keyboard checks of item 1 pass. At 390 x 844 also:
   a tap on a data point of each chart shows its reading in `#tip`, inside the window and below the top bar; a tap on
   T4 shows "10%" and "T4 Lone Tree", and a tap on the H026 dot shows "0.11 lbs/day" and "H026". These checks keep the
   redesign's behaviour (section 6.3).
5. `locale: "de-DE"`, `timezoneId: "Pacific/Auckland"`: the same 10 rows and "\$89,303 of \$88,400".
6. **Preserve checks.** KEEP-01 to KEEP-34 (section 6.3) pass against the Phase 1 page. They are kept as the read-only
   reference script `docs/audit/redesign/preserve.mjs`, which passed 34 of 34 on main at `0315d09` and failed 33 of 34
   on the old page at `cfd77e5` (Playwright Chromium, 2026-10-20). The Phase 1 pull request either ports them into
   `tests/browser/smoke.mjs` or runs the reference script against the page it serves; either way they run in CI
   (section 11.5). The checks read structure and behaviour, not rule wording or pixel positions: all 34 also passed on
   a copy of main given the Phase 1 wording of sections 5.7 and 10.2. A check changes only where a Phase 1 item changes
   the behaviour it tests, or where the pull request is the fix for the colour-only marks of section 15 (KEEP-24 counts
   the flagged gain dots as circles in a second colour, section 6.3), and the pull request says which and why.
   `docs/audit/redesign/coverage.mjs` is not a Phase 1 gate: it asserts pre-Phase 1 wording ("Heifers here now",
   "Water tanks OK") and stays as the record of the redesign's claims.

### 11.5 CI changes (`.github/workflows/test.yml`)

```yaml
      - name: The committed data matches the generator
        run: |
          python scripts/generate_data.py
          git diff --exit-code data/
          test -z "$(git status --porcelain data/)"   # also fails on new, untracked files
      - name: Unit and scenario tests in three time zones
        run: |
          for tz in UTC America/Chicago Pacific/Auckland; do TZ=$tz node --test "tests/**/*.test.mjs"; done
      - name: Browser smoke test
        run: |
          npm ci
          npx playwright install --with-deps chromium
          node tests/browser/smoke.mjs
```

The browser smoke test step includes the preserve checks of section 11.4 item 6, ported into `smoke.mjs` or run from the
reference script. `git diff --exit-code` alone does not see new untracked files such as `tanks.csv`, hence the
`git status` check. An
optional mutation check (re-running the audit's mutants in `water.verify.mjs` Part B and `registry.extra.mjs` Part 2
against the new code) can run on demand;
it is not a required CI step.

---

## 12. Acceptance criteria per P1 item

Each criterion is a test. **[unit]** and **[scenario]** run under `node --test` in the three-zone matrix;
**[browser]** runs in the Playwright smoke job. Unless stated, a case starts from the committed data after the
section 8 changes, with as-of 2026-09-30T18:00 America/Chicago. Expected values come from each finding's
`regression_test` or `expected` field in `findings.json`. **(restated)** marks a criterion whose expected text differs
from the finding's because of a decision in [05-roadmap.md section 1.4](05-roadmap.md#14-decisions-this-roadmap-makes-where-the-evidence-disagrees)
or new Phase 1 wording; the finding's intent is kept. Fixture IDs (W-02, GN-07, CSV-35 ...) refer to the cases in
`docs/audit/diagnostics/`, rebuilt under `tests/fixtures/` (section 11.2), which also says which files each kind of
fixture replaces. Test-case labels are not finding IDs. Where a label is also a finding ID or is used by two scripts,
or looks like a finding ID, it is written with its script: `csv.repro:CSV-07` (CSV-07 is also a finding),
`water.repro:B-03` (csv.browser.mjs has another B-03), `grazing.repro:GB-09` (gain.repro.mjs has another GB-09),
`time.repro:TIME-18`, `time.repro:TIME-D1`. The other labels are unique: W- in water.repro.mjs, CV- in csv.verify.mjs,
CSV-10 and higher in csv.repro.mjs, G- in grazing.repro.mjs, GN- in gain.repro.mjs, M5 in gain.missed.mjs, R in
render.repro.mjs, TB- in time.browser.mjs.

Phase-wide (all items): the committed data gives the 10 planted problems with their severities, each row in the
wording of section 5.7 once the items in its "Changed by" column ([05 section 3.1](05-roadmap.md#31-phase-1-acceptance-bar))
have landed, and, when Phase 1 is complete, exactly the 10 rows of section 5.7 and no issue; the suite passes under
TZ=UTC, America/Chicago and Pacific/Auckland; the preserve checks pass (section 11.4 item 6; until P1-17 part b adds
the smoke test, by running `docs/audit/redesign/preserve.mjs` against the served page); once the smoke test exists, it
has no `pageerror` and passes its keyboard, touch, 390 x 844 and 320 x 640 checks. No item may remove or weaken what
section 6.3 keeps, such as the chart readings by keyboard and touch or the phone layout that the redesigned page already has.

Page terms in **[browser]** criteria name elements of the redesigned page (main at `0315d09`, after pull request #2).
Exception rows are `#exceptions tbody tr`. An area chip is `#chips button[data-a="Health"]` (and so on); it shows its
count in a badge, `.n`, which reads "can't tell" for an area with an area-level CAN'T TELL row (section 5.1). The needs
attention counts are in the summary card `#summary`, not in a tile. A tile is the `#tiles .tile` whose label `.k`
names it ("Head on grass", "Sensors normal", "Spend vs budget"; the gain tile is the one whose label ends in "gain");
a criterion never picks a tile by position. Tank cards are `#tanks .tank`, listed worst first, so a tank is found by
its name (`.tank-name span`); each card has one chart, `svg.chart`. The grazing and gain charts are
`#grazing svg.chart` and `#gain svg.chart`. There is no budget chart: the budget table `#budgetTable` has one
`tbody tr` per category, each with its bar, and one "Season total" `tfoot tr`. The rules table is `#rules tbody tr`,
inside `#rulesMore`, which is open from 641 px wide and one tap away on a phone. "The header" is the as-of facts
`#asof`; the top-bar stamp `#stamp` is hidden at 860 px wide and narrower. A chart reading ("the tooltip") is the text
of `#tip`, reached by hovering a data point, by focusing the `svg.chart` and pressing an arrow key, or by a touch tap.
Each chart is drawn at the width of its box, so a position inside a chart is checked against bounds read from that
chart (its viewBox, gridlines and bars), never against fixed numbers. Unless stated, a [browser] criterion runs at
1280 x 900.

### P1-01

CSV reader and file decoding ([CSV-01](02-findings.md#csv-01), [CSV-02](02-findings.md#csv-02), [CSV-05](02-findings.md#csv-05), [CSV-07](02-findings.md#csv-07)).

1. [unit] `parseCSV('a,b,c\n"x, y","say ""hi"" now",3')` gives header `a,b,c` and one record with cells `x, y`,
   `say "hi" now`, `3` (restated: cells stay text; typing is P1-02).
2. [unit] `'a,b\r1,2'` gives one record `1,2`; `'a,b\r\r\n1,x\r\r\n'` gives one record `1,x`.
3. [unit] Round trip: a committed fixture written by Python `csv.writer` (commas, doubled quotes and a line break inside
   cells) parses back to the same cells.
4. [scenario] Every committed file with `\r\n` replaced by `\r\r\n` gives the 10 rows of section 5.7.
5. [scenario] Quoted weights such as `"1,169"` give Heifers serious "0.44" (1119 / 2565 = 0.4363) (decision D4).
6. [scenario] The fully quoted water.csv (case csv.repro:CSV-07) gives critical "Down to 11.8% full" and no error.
7. [unit] `parseCSV('a,b\n1,2\n,\n   \n3,4')` gives records `1,2` and `3,4` and one `CSV_BLANK_ROWS` info with count 2.
8. [scenario] `,,,\r\n` appended to moves.csv, weights.csv and water.csv gives the 10 rows and 8 tanks; the header
   repeated mid-file gives the 10 rows (weights), 8 tanks (water) and the tile "+1.0%" "\$89,303 of \$88,400" (budget).
9. [unit] `parseCSV('a,b\n x , y ')` gives header `a,b` and cells `x`, `y`.
10. [scenario] Case CSV-10 (`Yearlings,P3 ,2026-09-06,`) gives serious "Yearlings in Sand Hills" "Day 24 of a 21-day
    plan (3 days over)"; water rows `T4, P4` give the subject "Tank T4 (Lone Tree, Heifers there as of 2026-09-30)"
    (restated); health status `open ` and ` open` keep the booster serious row and the pinkeye warning.
11. [unit] Windows-1252 bytes for "La Peña" decode to "La Peña" with `FILE_NOT_UTF8` naming pastures.csv; [scenario]
    the subject reads "Yearlings in La Peña".
12. [unit] An unclosed quote gives `CSV_UNCLOSED_QUOTE` naming the row where the field began, and the file's areas are
    CAN'T TELL.
13. [unit] The committed files produce no `CSV_*` issue (their final CRLF is not a blank row).

### P1-02

Data contract ([CSV-03](02-findings.md#csv-03), [CSV-04](02-findings.md#csv-04), [CSV-06](02-findings.md#csv-06)).

1. [scenario] Header `tank_id,pasture_id,time,level` gives `COL_MISSING` whose message includes "water.csv" and
   "level_pct", a banner, and an area-level Water CAN'T TELL row; the other areas are unchanged.
2. [scenario] Header `level_pct ` (trailing space) still gives T2 critical "Down to 11.8% full".
3. [scenario] A vendor title line above the water.csv header gives `CSV_TITLE_LINE` and the 10 rows.
4. [scenario] health.csv without a `status` column (case CSV-25) gives `COL_MISSING` naming status and an area-level
   Health CAN'T TELL row.
5. [unit] Typing `tag,group,date,weight_lbs\n007,Y,2026-07-20,700` gives `tag === "007"` and `weight_lbs === 700`.
6. [scenario] Case CSV-21 gives serious "Day 29 of a 10-day plan (19 days over)"; case CSV-22 does not throw and the
   group "2025" appears as text; [browser] Cows renamed "2025" in every file gives 10 rows in `#exceptions`, and
   `#tiles` has its 4 tiles, the head tile listing "2025".
7. [scenario] Case CSV-48 gives no Gain row of kind alert and a `VALUE_MISSING` issue.
8. [scenario] Case GN-09 (blank weight for Y001) gives the slow list exactly Y027, Y031, Y058, Y082, Y129, Y132, a
   `VALUE_MISSING` naming Y001, and the Yearlings figure 16468 / 8493 = 1.939 in the gain section.
9. [scenario] Case M5 gives serious Heifers "0.43" (1088 / 2508).
10. [scenario] A blank Heifers head gives a head tile ("Head on grass") of "330" with a note naming Heifers, never
    "180150" (on the page the redesign's "+ ?" mark for an unknown count may follow the 330), and a Heifers gain
    CAN'T TELL row "Head count missing; gain not judged".
11. [scenario] A blank P8 acres gives "4,100 acres" in the as-of facts (`#asof`) plus a note.
12. [scenario] Case CSV-45 shows no percentage above 1,000 anywhere and a data issue; case CSV-46 never prints
    "-day plan" and gives a Grazing CAN'T TELL row "No usable plan for ...".

### P1-03

Dates, times, ranch time zone and one as-of policy ([DATA-02](02-findings.md#data-02), [TIME-01](02-findings.md#time-01), [TIME-02](02-findings.md#time-02), [TIME-03](02-findings.md#time-03)).

1. [scenario] For each date column (moves.in_date, moves.out_date, weights.date, health.next_due, health.last_done) and
   water.time, the values '15/09/2026', '2026-09-31', '2026-13-01', '46327' and a blank (where required) each give a
   data issue naming the file and value, and the affected subject is left out or CAN'T TELL as section 3.4 says; the
   row count never drops without an issue.
2. [scenario] Water rows `2026-09-30T06:00` 50, `2026-09-30T12:00` 49 and `2026-09-30 18:00` 20 (space form accepted)
   give one critical row for the tank: "Dropped 30 points in 12 hours, now 20% (unexplained fall; leak not confirmed)"
   (restated: DATA-02 expected "Down to 20% full"; the bounded drop rule of decision D5 matches first; both are
   critical).
3. [scenario] Under TZ=America/Chicago and TZ=Pacific/Auckland every Grazing and Health problem matches
   `/\b\d+ days?\b/` and none contains a decimal point.
4. [scenario] Health next_due `46327` gives `VALUE_NOT_DATE`, a CAN'T TELL row "Due date '46327' can't be read", and no
   "Overdue" row.
5. [scenario] Case W-07 gives T6 serious CAN'T TELL "No reading for 42 hours; last level 98.5%" and an `AFTER_AS_OF`
   issue naming 2026-10-29.
6. [scenario] Case W-06: hours since the last reading are >= 0 for every tank.
7. [scenario] The committed data with as_of 2026-09-15T18:00 gives no Water rows.
8. [scenario] Case GN-12 gives Heifers "0.44 lbs/day between the 2026-07-20 and 2026-09-15 weigh-ins" (restated) and an
   `AFTER_AS_OF` issue for 1 weigh-in.
9. [scenario] meta as_of 2026-09-30T18:00 with timezone America/Chicago and a reading at 2026-09-29T20:00Z: 27 hours
   of silence (18:00 CDT = 23:00Z) under TZ=UTC and TZ=America/Chicago, and a serious CAN'T TELL "No reading for 27
   hours".
10. [scenario] The TIME-01 fixture gives critical "Dropped 32 points in 24 hours, now 48% (unexplained fall; leak not
    confirmed)" under both zones.
11. [unit] A date-only as_of gives `META_DATE_ONLY_AS_OF`; water silence and drop are CAN'T TELL; day counts use that
    date.
12. [scenario] meta as_of `2026-10-01T01:00Z` with timezone America/Chicago gives the committed Grazing and Health rows
    ("Day 24 of a 21-day plan (3 days over)", "Overdue by 15 days", "Due in 3 days") and 10 rows in total; the
    `-05:00` form gives the same.
13. [unit] Wall time 2026-03-08 02:30 in America/Chicago gives `TIME_NONEXISTENT`; 2026-11-01 01:30 gives the earlier
    instant and `TIME_AMBIGUOUS`; `daysBetween("2026-03-07", "2026-03-09") === 2`.
14. [unit] meta without timezone and an as_of with `-05:00` uses the fixed offset with `META_NO_TIMEZONE` (warning);
    without either, `META_NO_TIMEZONE` (error) and water hour rules CAN'T TELL.
15. [browser] At 1280 x 900 and at 390 x 844, `#asof` contains "Sep 30, 2026, 6:00 PM CDT" and "Fictional snapshot, not
    live"; the top-bar stamp `#stamp` (shown at 1280 x 900, hidden at 860 px wide and narrower) contains
    "6:00 PM CDT".

### P1-04

References and duplicates ([DATA-01](02-findings.md#data-01), [DATA-03](02-findings.md#data-03)).

1. [scenario] The open Yearlings move changed to P9: no error; critical rows for Tank T2 and Tank T4; at least 9
   non-grazing rows; exactly one exception row mentions "P9" (Yearlings Grazing CAN'T TELL "Pasture P9 isn't in
   pastures.csv"); a `REF_UNKNOWN` issue.
2. [scenario] The same move with `p3` uses Sand Hills with `REF_CASE_MISMATCH` and gives "(3 days over)"; with `P3 `
   it gives the same row and no issue.
3. [browser] A closed move to P9: `#grazing svg.chart` and `#gain svg.chart` exist, `#budgetTable` has its 6 category
   rows and 1 "Season total" row, and the rules table is drawn (restated: the redesign has no budget chart, so the
   budget table stands in for `#budgetChart svg`; the `#rules tbody tr` count follows `RULE_INFO`, not the 11 rows
   drawn before Phase 1, 12 with the header).
4. [scenario] Case CSV-28 (weigh-ins under "Heifer") gives `REF_UNKNOWN` naming "Heifer".
5. [scenario] Case W-15: the subject contains "P9" and never "undefined".
6. [scenario] Case CSV-33 gives no rows and a `DUP_EXACT` issue.
7. [scenario] The committed budget.csv appended to itself keeps Fuel at "21.3% over budget, season to date through
   2026-09 (\$2,040)" (restated wording) with a `DUP_EXACT` issue.
8. [scenario] Case CSV-35 gives exactly one booster row; case CSV-36 exactly one Heifers gain row.
9. [scenario] Case CSV-34 (P3 listed with 21 and then 30 planned days) gives `DUP_CONFLICT` (error) naming P3 and a
   Yearlings Grazing CAN'T TELL row (CSV-34 accepts "a duplicate-id error").
10. [scenario] Case G-04 (a duplicated move row) gives 10 rows and one Yearlings grazing row.

### P1-05

Generator and example data ([HLTH-03](02-findings.md#hlth-03)).

1. Running the generator twice gives identical files; pastures, groups, moves, weights, water and budget CSVs have the
   same SHA-256 as at the reviewed commit.
2. `data/tanks.csv` has 8 rows, T1-T8 in P1-P8, and every water.csv row's pasture matches its tank.
3. `data/weigh_sessions.csv` has 6 rows (Heifers and Yearlings on 2026-06-01, 2026-07-20, 2026-09-15), all `full`.
4. `data/meta.csv` gives as_of 2026-09-30T18:00, timezone America/Chicago, season_start 2026-06-01,
   books_closed_through 2026-09, demo true.
5. No health row is done with last_done < next_due <= as_of; the Fly tag row is `Cows,Fly tag check,2026-09-01,,done`.
6. `evaluate` on the committed data gives the 10 rows of section 5.7 and zero issues of any severity.
7. The CI data step passes, including the untracked-file check.

### P1-06

Loading, errors, three states, section isolation ([LOAD-01](02-findings.md#load-01), [LOAD-02](02-findings.md#load-02)).

1. [browser] health.csv answers 404: visible text matches `/health\.csv/` and `/could not load|missing/i`; the Health
   chip (`#chips button[data-a="Health"]`) does not show 0: its badge `.n` reads "can't tell", not "0" (restated: the
   chip shows its count in `.n`, so the text "Health (0)" can no longer appear); the other 8 rows are present in
   `#exceptions`.
2. [browser] water.csv header-only: a banner names water.csv; the water tile (label "Sensors normal") does not read
   "0 of 0"; `#tanks .tank` has 8 cards, T1 to T8 from tanks.csv, and each card's `svg.chart` text matches `/no readings/i` (section 5.2: "No readings in the last 7 days", or
   "No readings this week" on a narrow card).
3. [browser] moves.csv header-only: Grazing shows CAN'T TELL: the Grazing chip (`#chips button[data-a="Grazing"]`)
   badge `.n` reads "can't tell", not "0" (restated from "not Grazing (0)": the chip shows its count in `.n`).
4. [unit] `loadAll` with a fetch stub answering `{ ok: false, status: 404 }` for health.csv resolves (never rejects)
   with `{ status: "missing", httpStatus: 404 }`, and the banner text matches `/health\.csv.*404/` (restated: the
   loader reports instead of rejecting).
5. [browser] budget.csv header-only, and separately 404: no "NaN" anywhere on the page; the "Spend vs budget" tile and
   the Budget chip (`#chips button[data-a="Budget"]`, whose badge `.n` reads "can't tell", not "0") show CAN'T TELL;
   `#budgetTable` shows the reason in place of its rows, with no category row and no "Season total" row (section 6.2:
   the area's chart, here the table, is replaced by the reason).
6. [browser] water.csv 404 with the small inline set (one open health task due 2026-09-15; as_of 2026-09-30T18:00): a
   banner containing "water.csv" and "404", and `#exceptions` contains "Overdue by 15 days (due 2026-09-15)".
7. [browser] Every CSV delayed 3 s: text matching `/loading/i` is visible at 1 s.
8. [browser] budget.csv aborted: a banner names budget.csv; the other areas are drawn (8 `#tanks .tank` cards,
   `#grazing svg.chart`, `#gain svg.chart`, and the 8 Water, Grazing, Gain and Health rows of section 5.7 in
   `#exceptions`); zero `pageerror`.
9. [browser] meta.csv 404: a banner, every area CAN'T TELL, the rules table drawn (`#rules tbody tr` rows from
   `RULE_INFO`, in a `#rules-sec` that is shown, not hidden by the redesign's failed-load style `.failed`), zero
   `pageerror`.
10. [browser] The T6 row in `#exceptions` contains "Can't tell" and the CAN'T TELL marker (section 5.1); with `,,,\r\n`
    appended to moves.csv (one `CSV_BLANK_ROWS` note, P1-01 item 8), the data checks panel's button that shows the
    notes ("Show {n} notes", section 4.3) is at least 24 x 24 CSS px at 1280 x 900, and at least 42 px tall at 390 x 844 (section 6.3), and,
    reached by Tab, shows the page's focus ring (`:focus-visible`, a solid 2 px outline, which every control on the
    page already has).
11. [unit] Area state follows section 5.1 for: a missing file; alerts plus CAN'T TELL rows; only CAN'T TELL rows; no
    rows.

### P1-07

Water ([WAT-01](02-findings.md#wat-01), [WAT-02](02-findings.md#wat-02), [WAT-03](02-findings.md#wat-03), [WAT-04](02-findings.md#wat-04), [WAT-07](02-findings.md#wat-07), [WAT-08](02-findings.md#wat-08)).

1. [scenario] Rows `T1,P1,2026-09-29T18:00,80` and `T1,P1,2026-09-30T18:00,ERR`: exactly one Water row for T1,
   serious, CAN'T TELL, problem containing "ERR" and "80%".
2. [scenario] The same with a blank level: the same row ("(blank)") and no problem matching
   `/Dropped|now %$|Down to % full/`.
3. [scenario] The committed data with T2's 2026-09-30T18:00 level set to ERR: a T2 row naming "last good level 14.8%",
   severity critical.
4. [scenario] Inline T1 rows ending in -999, and separately in 140: no "Dropped" row; a "not a level" CAN'T TELL row
   instead.
5. [scenario] With every T6 row removed: 8 tanks; one serious T6 CAN'T TELL "No readings in this export"; the tile
   reads "Sensors normal" "5 of 8" "3 need a look" (restated label).
6. [scenario] A tank T9 in water.csv but not in tanks.csv: one `TANK_NOT_IN_LIST` naming T9.
7. [scenario] Inline T1 rows (section 11.2; `tanks.csv` lists T1 in P1 only). Case W-01: 0 Water rows for T1 (the
   window holds 56 and 54; 54% is above 40) (restated: "for T1"). Case W-02: one critical T1 row containing "45
   points" and "18 hours". Case W-03: one T1 row containing "40 points" (the maximum drawdown, 90 to 50; "highest minus
   last" would give 4). The contiguous control (80 at 2026-09-29T18:00 ... 48 at 2026-09-30T18:00): "Dropped 32 points
   in 24 hours, now 48%". Committed data: exactly 3 Water rows, T4 at 46 points.
8. [scenario] Case csv.verify:CV-03 (`tanks.csv` lists T1 in P1 only): a critical row whose subject starts "Tank T1
   (North Flat" with "Down to 12% full", and a `REF_PASTURE_MISMATCH` naming T1 and P3. Case W-11 (`tanks.csv` lists
   T9 in P3, where it now stands): 0 Water rows for T9 and a `REF_PASTURE_MISMATCH` naming T9 and P1 (restated: "for
   T9"); with T9 left out of `tanks.csv` instead, `TANK_NOT_IN_LIST` takes P3 from its newest reading and the Water
   result is the same.
9. [scenario] Both orders of 78 and 20 at one time: one critical T1 row containing "now 20%" and "60 points", and a
   `DUP_CONFLICT` naming 78 and 20.
10. [scenario] 80.1 then 50.1 over 24 hours: one critical row with "Dropped 30 points".
11. [scenario] T2 with `in_service` false: no T2 row; the tile reads "5 of 7" and "1 out of service". [browser] The
    same data: T2's tank card (the `#tanks .tank` whose `.tank-name span` reads "T2") is still shown with its
    `svg.chart`, and the card's text contains "out of service".

### P1-08

Grazing ([GRZ-01](02-findings.md#grz-01), [GRZ-02](02-findings.md#grz-02), [GRZ-03](02-findings.md#grz-03)).

1. [scenario] The Yearlings Sand Hills row given out_date 2026-10-03: exactly one Grazing row, serious, "Yearlings in
   Sand Hills", "(3 days over)".
2. [scenario] Sand Hills closed 2026-10-02 plus `Yearlings,P2,2026-10-02,`: the same serious row; the T2 subject is
   exactly "Tank T2 (Windmill)"; an `AFTER_AS_OF` issue for the future stay.
3. [scenario] `planned_out_date` 2026-10-02 on the open Sand Hills row gives warning "Planned move in 2 days";
   2026-09-29 gives serious "Day 24 of a 23-day plan (1 day over)" (the column is what the rule judges against,
   GRZ-01 test c).
4. [scenario] Case G-03: the Grazing rows for Yearlings are exactly one serious "Yearlings in Sand Hills" containing
   "(3 days over)"; one `MULTIPLE_OPEN_STAYS` names South Divide and Sand Hills; no row contains "15 days over".
5. [scenario] A duplicated Heifers move row: the T4 subject is "Tank T4 (Lone Tree, Heifers there as of 2026-09-30)"
   (restated).
6. [scenario] GRZ-03's six cases: (1) out_date "-": at least 10 rows and a Yearlings Grazing row matching
   `/not a date|out_date/i`; (2) P3 plan "21 days": at least 10 rows, a Grazing row naming Sand Hills and `/plan/i`,
   none matching `/ -day plan/`; (3) Heifers out_date "TBD": a data issue naming Heifers; (4) a blank in_date: a data
   issue for Yearlings, and [browser] the grazing chart still draws the other 22 stays as 22 stay bars
   (`#grazing svg.chart rect[rx='4']` with fill `var(--s1)` or `var(--s1-mute)`), each with a finite x and width;
   (5) in_date `2026-09-06T06:00`: "Day 24" and "(3 days over)" with no decimal, plus `VALUE_TIME_IGNORED`; (6) a blank
   P3 planned_graze_days: a CAN'T TELL row "No usable plan for Sand Hills".
7. [browser] At 1280 x 900 and at 390 x 844, every stay bar on the grazing chart (`#grazing svg.chart rect[rx='4']`:
   current, earlier and past-plan bars) has a finite x and width and ends (x + width) at or before the x of the Today
   line, which marks the as-of date (the `line` whose x1 equals the "Today" label's `x` attribute; the label is
   end-anchored at the line near the right edge, so its box is not centred on it). A current stay's days-left shading
   (`rect` with fill `var(--s1-soft)`) and its planned-move tick may run past the Today line, up to the planned move
   date (section 5.3).
8. [scenario] The Cows' open South Divide stay given out_date 2026-09-20 (no later Cows stay): no Cows Grazing row, one
   `GROUP_NO_CURRENT_STAY` info naming Cows, and the Yearlings row unchanged (the known exception of section 5.3).

### P1-09

Gain from a consistent pair of weigh sessions ([GAIN-01](02-findings.md#gain-01), [GAIN-02](02-findings.md#gain-02), [GAIN-03](02-findings.md#gain-03), [GAIN-06](02-findings.md#gain-06), [GAIN-12](02-findings.md#gain-12)).

1. [scenario] Committed data plus `Y151,Yearlings,2026-09-15,820`: no error; 10 rows; Yearlings 1.94246 (16608 /
   8550); Y151 listed as "not yet re-weighed".
2. [scenario] Case CSV-17 (with groups.csv head set to the animals in the fixture): Y1 and Y2 give 2.105 (120 / 57); Y3
   is listed as not yet re-weighed; no Gain alert.
3. [scenario] Committed data plus `H001,Heifers,2026-09-15,1180`: every gain is finite; serious Heifers starting "0.44"
   ((1119 + 5.5) / 2565 = 0.4384 with the two Sep 15 weights averaged, decision D15); a `DUP_CONFLICT` naming H001 and
   2026-09-15.
4. [scenario] Case CSV-32: exactly one serious Heifers row "0.70 lbs/day between the 2026-07-20 and 2026-09-15
   weigh-ins (target 1.0)" (restated wording; 40 / 57).
5. [browser] With the H001 duplicate: the rules table (`#rules tbody tr`; on a phone it sits closed inside
   `details#rulesMore`) is present within 2 s, and the gain chart's axis stays 0.0 to 3.0: at 1280 x 900 and at
   390 x 844, `#gain svg.chart` has 7 gridlines (`line` with stroke `var(--grid)` or `var(--axis)`), one at each tick
   label 0.0, 0.5, 1.0, 1.5, 2.0, 2.5 and 3.0.
6. [scenario] Case GN-07: Heifers serious between 0.43 and 0.45 (1119 / 2565 = 0.4363); H001's 2026-09-16 reading is a
   `GAIN_OFF_SESSION` issue and not used.
7. [scenario] Case GN-11b: a Gain CAN'T TELL row containing "Y027" and "missed the 2026-09-15 weigh-in". Case GN-11a:
   the heifer row names 2026-07-20 (not 2026-06-01) and "0.43" (1088 / 2508). Control: committed data unchanged
   (Heifers 0.44, Yearlings 1.94).
8. [scenario] Case GAIN-06's four rows (tag 101 in Heifers and Yearlings; group heads set to the fixture's animals):
   Heifers 101 at about 0.5263 and Yearlings 101 at about 1.9298; a `TAG_IN_TWO_GROUPS` issue; no non-finite gain.
9. [scenario] Case GAIN-12's five yearlings (head 5): 456 lbs over 285 animal-days gives no Gain row in file order or
   rotated; 455 lbs gives a serious row with "1.596" (fmtBelow).

### P1-10

Gain plausibility, target, coverage, age, weigh basis ([GAIN-04](02-findings.md#gain-04), [GAIN-05](02-findings.md#gain-05), [GAIN-07](02-findings.md#gain-07), [GAIN-08](02-findings.md#gain-08)).

1. [scenario] H001's 2026-09-15 weight set to 11690: `WEIGHT_OUT_OF_RANGE` naming H001; serious Heifers "0.43" (1088 /
   2508); H001 is not repeated in a missed-weigh-in row; [browser] the gain chart's axis stays 0.0 to 3.0 with 7
   gridlines, checked as in P1-09 item 5.
2. [scenario] Yearlings target "2.O": `VALUE_NOT_NUMBER` naming the Yearlings target, a Yearlings CAN'T TELL row
   "Gain target '2.O' isn't a number"; [browser] the exception table draws (`#exceptions tbody tr`). Heifers target
   "1.O": a data issue; the gain chart (`#gain svg.chart`), the budget table (`#budgetTable`: 6 body rows and the
   season-total row) and the rules table (`#rules tbody tr`) draw (restated: the redesign has no budget chart).
3. [scenario] Case GN-13 (3 of 150 yearlings weighed): a Yearlings CAN'T TELL row containing "3 of 150". Committed data:
   the gain section shows "45 of 45" and "150 of 150".
4. [scenario] Case GN-18 (last weigh-in 2026-07-20): Heifers and Yearlings each CAN'T TELL naming 2026-07-20 and "72
   days"; no "4 heifers" warning. Committed data: no Gain CAN'T TELL row.
5. [scenario] weigh_sessions.csv with Heifers 2026-09-15 `overnight_shrunk`: a Heifers CAN'T TELL "Weighing
   conditions differ (full on 2026-07-20, overnight_shrunk on 2026-09-15)" and no serious Heifers row; without
   weigh_sessions.csv, each judged group is CAN'T TELL "Weighing conditions not recorded ...".
6. [unit] An animal gaining 10 lbs/day gives `GAIN_IMPLAUSIBLE_ADG` and is left out of the pooled figure.
7. [scenario] Head 0, not judged (section 5.4 step 2). Committed data with the Yearlings head set to 0 in groups.csv
   and their 2026-09-15 weigh-ins removed from weights.csv and weigh_sessions.csv (the last one left, 2026-07-20, is 72
   days before the as-of date): no Gain row names yearlings (no "6 yearlings" warning and no Yearlings CAN'T TELL row);
   one `GROUP_HEAD_ZERO` info naming Yearlings, "300 weigh-ins" and "2026-07-20"; the gain section says "Yearlings:
   head 0 in groups.csv, not judged on gain"; Heifers serious "0.44" unchanged; the Yearlings Grazing and Health rows
   stay (those rules do not read head); 9 rows, "2 critical, 6 serious, 1 warning (1 can't tell)"; the head tile
   reads "225". With every Yearlings row removed from weights.csv and weigh_sessions.csv instead: the same, with one
   `GROUP_HEAD_ZERO` naming Yearlings without a weigh-in count. Control: head 150 with every Yearlings weigh-in removed
   gives one Yearlings Gain CAN'T TELL row "No weigh-ins recorded"; 10 rows, "2 critical, 6 serious, 2 warning (2
   can't tell)". [browser] In the first case, the "Not shown" note under `#gain svg.chart` (`#gain p.hint`) contains
   "Yearlings, head 0 in groups.csv" and does not contain "Yearlings, with no gain target".
8. [scenario] Head 0 with recent weigh-ins, an inconsistent record (section 5.4 step 2). Committed data with the
   Yearlings head set to 0 in groups.csv, every other file unchanged (their last weigh-in, 2026-09-15, is 15 days before
   the as-of date): no "6 yearlings" warning; one Yearlings Gain CAN'T TELL row, severity warning, "Head is 0 in
   groups.csv, but 150 animals were weighed on 2026-09-15", first step "Enter the group's head count in groups.csv, or
   record that the group was sold or shipped"; one `GROUP_HEAD_ZERO_RECENT_WEIGHINS` warning naming Yearlings, 150 and
   2026-09-15; Heifers serious "0.44" unchanged; the Yearlings Grazing and Health rows stay; 10 rows, "2 critical, 6
   serious, 2 warning (2 can't tell)"; the gain tile reads "0.44 lbs/day Heifers (target 1.0)" and the head tile
   "225"; no row, issue or tile text matches `/\d of 0\b|NaN|Infinity/`. The same with the Heifers head set to 0
   instead: no serious Heifers row, and a Heifers Gain CAN'T TELL row naming 45 animals and 2026-09-15 in its place
   (the planted problem is not hidden behind a note); 10 rows, "2 critical, 5 serious, 3 warning (2 can't tell)".
   [browser] The Yearlings case at 1280 x 900 and at 390 x 844: `#exceptions tbody` has 10 rows and no page text
   matches that pattern.
9. [unit] The 45-day boundary of step 2: Yearlings with target 2.0 and head 0 whose only weigh-ins are dated
   2026-08-16 (45 days before the as-of date) give the CAN'T TELL row and `GROUP_HEAD_ZERO_RECENT_WEIGHINS` of item 8;
   dated 2026-08-15 (46 days), no row and one `GROUP_HEAD_ZERO`.
10. [unit] No division by 0. Yearlings with target 2.0, two weigh-ins that share no tag (A1 700 lbs on 2026-07-20, A2
    810 lbs on 2026-09-15) and weigh_sessions rows for both dates (full). Head 0: the CAN'T TELL row of item 8 ("1
    animal was weighed on 2026-09-15"), no step 3 to 12 result, and no NaN or Infinity in `result.gain.groups`. Head 2:
    a Yearlings Gain CAN'T TELL row containing "0 of 2", with `gainMinCoverage` 0.8, again with 0, and again with the
    2026-09-15 session recorded as overnight_shrunk (no "provisional" figure in any row or gain-section line); no NaN
    or Infinity in `result.gain.groups`.
11. [scenario] More matched animals than head (section 5.4 step 8). Committed data with the Yearlings head set to 100:
    one `GAIN_MORE_THAN_HEAD` warning naming Yearlings, 150 and 100; the 10 rows of section 5.7 unchanged; the gain
    section line contains "150 weighed at both" and "more than the 100 head in groups.csv" and never "150 of 100"; the
    head tile reads "325". Committed data: no `GAIN_MORE_THAN_HEAD`, no `GROUP_HEAD_ZERO` and no
    `GROUP_HEAD_ZERO_RECENT_WEIGHINS`.
12. [scenario] Blank or unreadable head. Yearlings head "12.5": `VALUE_NOT_NUMBER` naming the Yearlings head and a
    Yearlings CAN'T TELL row "Head count '12.5' can't be read; gain not judged". Head "-5": `VALUE_OUT_OF_RANGE` and
    the same row with '-5'. In both, the head tile reads "225" with a note naming Yearlings. (A blank head is P1-02
    item 10.)

### P1-11

Health ([HLTH-01](02-findings.md#hlth-01), [HLTH-02](02-findings.md#hlth-02)).

1. [scenario] For s in `Open`, `OPEN`, `open `, ` open`: rows `Yearlings,Booster vaccine,2026-06-02,2026-09-15,{s}` and
   `Yearlings,Deworm,2026-06-02,2026-11-01,open` give exactly one row, serious, "Overdue by 15 days (due 2026-09-15)".
2. [scenario] Status `in progress`, `scheduled` and `deferred`: the booster row plus `STATUS_UNKNOWN` naming the value.
   `done` and `cancelled`: no row.
3. [scenario] Only `Heifers,Pregnancy check,2026-09-20,,open`: exactly one Health CAN'T TELL row for "Heifers:
   Pregnancy check" matching `/no due date/i`, first step "Set a due date". With next_due "TBD": one row matching
   `/TBD|can't be read/i`.
4. [unit] Boundaries: due 2026-10-07 is a warning "Due in 7 days"; 2026-10-08 gives no row; 2026-09-29 is serious
   "Overdue by 1 day".
5. [unit] The overdue first step is "Schedule it, and check the label or your veterinarian's plan for the allowed
   window".

### P1-12

Budget ([BUD-01](02-findings.md#bud-01), [BUD-02](02-findings.md#bud-02), [BUD-03](02-findings.md#bud-03), [BUD-04](02-findings.md#bud-04), [BUD-05](02-findings.md#bud-05)).

1. [scenario] Committed budget.csv plus October and November plan rows (actual 0): Budget rows exactly
   [serious Fuel "21.3% over budget, season to date through 2026-09 (\$2,040)", serious Repairs "25.0% over budget,
   season to date through 2026-09 (\$1,800)"] (restated wording); tile "+1.0%" and "\$89,303 of \$88,400". 2025 rows
   appended: no change. Months written `2026-09-01`: September counted. A blank September Fuel actual: Fuel CAN'T TELL
   naming 2026-09.
2. [scenario] Case time.repro:TIME-D1 (as_of 2026-09-15T18:00 with books_closed_through 2026-09): clamped to 2026-08 with
   `META_BOOKS_CLOSED_AFTER_AS_OF`; Fuel serious "20.0% ... (\$1,440)" (8,640 vs 7,200).
3. [scenario] Committed plus `2026-09,Hay,,500`: every amount is a number; the tile reads "+1.6%" and "\$89,803 of
   \$88,400" with "(1 category can't tell)"; Hay is CAN'T TELL "no budget entered for 2026-09".
4. [scenario] Committed plus `2026-09,Repairs,0,(300)`: Repairs serious "20.8% over budget ... (\$1,500)" (8,700 vs
   7,200) and `BUDGET_ROWS_ADDED` (restated: "20.8%" to one decimal).
5. [scenario] A blank June Fuel actual: Fuel CAN'T TELL; no percentage above 1,000 anywhere.
6. [scenario] Committed plus `2026-09,Hay,0,500`: exactly one Hay row containing "\$500" and not matching
   `/Infinity|NaN/`; `2026-09,Hay,0,0`: no Hay row; [browser] in both cases no element of `#budgetTable` has an
   attribute matching `/NaN|Infinity/` (the bars' `style` and the tracks' `data-p` and `data-z` included) and its text
   does not match it; Repairs reads "+25.0%" in its bar label (`.track .val` in the `#budgetTable tbody` row whose first
   cell starts "Repairs") (restated: the redesign has no `#budgetChart`; BUD-03's test read "+25%", and the redesign's
   bar label reads "+25%" today, but Phase 1 shows every percent to one decimal, the table's bar labels included,
   section 5.6).
7. [scenario] Single closed-month categories: Ear tags 230 / 200 gives no row; Feed 109,500 / 100,000 gives a warning
   with "\$9,500" (restated: BUD-04's own demo values made it serious; decision D2); Hay 104,000 / 100,000 gives a
   warning with "\$4,000". Committed data: Fuel and Repairs serious, 10 rows.
8. [unit] On a 10,000 budget (restated from BUD-05's 1,000 base so the dollar lines of decision D2 apply): 10,500 is a
   warning "5.0%"; 10,960 a warning "9.6%"; 11,000 a warning "10.0%"; 11,040 serious "10.4%"; 10,499 no row. Budget
   7,419 with actual 8,160.90 is a warning (integer cents: 74,190 x 10 = 741,900).
9. [unit] Unbudgeted: 0 / 249 no row; 0 / 250 warning "\$250 spent with no budget". Large: 100,000 / 102,500 warning;
   100,000 / 102,499 no row.
10. [scenario] Scenario folder 03 (Vet and health's 2026-09 actual blank): Vet and health CAN'T TELL; the tile reads
    "+1.0%" and "\$87,783 of \$86,900" with "(1 category can't tell)", never a negative percent (section 5.6).

### P1-13

Safe rendering ([SEC-01](02-findings.md#sec-01)).

1. [browser] A pasture named `<b>x</b>` with T2 steady at 20%: `#exceptions` innerHTML contains
   `&lt;b&gt;x&lt;/b&gt;` and not `<b>x`. T2's tank card (the `#tanks .tank` whose `.tank-name span` reads "T2") takes
   the place of the old chart heading: its `.tank-name` innerHTML contains `&lt;b&gt;`, and its pasture name
   (`.tank-name b`) has the text `<b>x</b>` and no child element. T2's chart reading (focus its `svg.chart`, press
   ArrowLeft) shows `<b>x</b>` as text in `#tip`, with no `b` element there.
2. [browser] A tag `<i>t</i>` (given to H026, the slowest heifer, whose dot is the first gain reading): `#tip` has
   `&lt;i&gt;t&lt;/i&gt;` in its innerHTML and no `i` element each time the dot's reading is shown: by hovering the dot
   with the mouse at 1280 x 900; by focusing `#gain svg.chart` and pressing Home, then ArrowRight until `#tip` names
   the tag, at 1280 x 900 and at 390 x 844; and by tapping the dot in a touch context (`hasTouch` and `isMobile`, as in
   `redesign/coverage.mjs`) at 390 x 844.
3. [browser] A pasture "Lone Tree <A": the T4 subject (the What cell, `#exceptions tbody td.c-what`, of the T4 row) is
   exactly "Tank T4 (Lone Tree <A, Heifers there as of 2026-09-30)" (restated), at 1280 x 900 and at 390 x 844, where
   the rows are laid out as cards; T4's tank card name (`.tank-name b`) reads "Lone Tree <A".
4. [browser] The audit's xss-onload file set (`render.browser.mjs`), at 1280 x 900 and at 390 x 844: no
   `window.__xss_*` flag set; no `img` or `script` element in `main` or `#tip`; and in #exceptions, #tiles, #water (the
   tank cards in `#tanks`), #nowGrazing, #grazing, #gain and #budgetTable only the `b` and `i` elements the page builds
   itself, the same counts as the same page shows on the committed data. The fixture writes that category cell quoted,
   with its quotes doubled (`"""><script>window.__xss_script=1</script>"`), so the reader of section 3.1 reads one
   category name; written bare, as `render.browser.mjs` writes it for the old reader, its leading quote opens a quoted
   field and budget.csv reads as 12 records instead of 24.
5. [unit] `esc('<a href="x">&\'')` returns `&lt;a href=&quot;x&quot;&gt;&amp;&#39;`.
6. [browser] `<img src=x onerror="window.__xss_tip=1">` as a tank ID (in water.csv and tanks.csv), a pasture name, a
   group name and a budget category. Show a reading on that tank's water chart (the `#tanks .tank` whose
   `.tank-name span` is the ID; `app.js:344` at `0315d09`, `:104` at `cfd77e5`), on a stay of that group and a stay in
   that pasture on the grazing chart (`:398`; `:143` at `cfd77e5`), and on a dot of that group on the gain chart
   (`:532`; `:170` at `cfd77e5`), three ways each: hovering with the mouse at 1280 x 900; focusing the `svg.chart` and
   pressing arrow keys until `#tip` names it (Home and ArrowDown reach a group's row), at 1280 x 900 and at 390 x 844;
   and tapping in a context with `hasTouch` at 1280 x 900, as in section 11.4 item 3 (at 390 x 844 this file set's
   category widens `#budgetTable` to 422 px, so under `isMobile` the page zooms out and taps miss). Each time `#tip` contains no `img` or `script` element,
   `window.__xss_tip` stays unset, and `#tip`'s text contains the name literally. The page has no budget chart and no
   budget reading (the budget tooltip was `:194` at `cfd77e5`): the category's `#budgetTable tbody` row (`:576`) shows
   the name literally at the start of its first cell's text, and `#budgetTable` has no `img` or `script` element.
   (Static formatting such as `<b>` built by the code is allowed.)

### P1-14

Tiles and charts from structured results ([LOAD-03](02-findings.md#load-03), [LOAD-04](02-findings.md#load-04), [UI-04](02-findings.md#ui-04), [UI-05](02-findings.md#ui-05)).

1. [unit] `tileSummary` with groups.csv minus Yearlings does not throw.
2. [browser] Yearlings renamed Steers in every file: `#exceptions tbody` has 10 rows (`tr:not(.empty)`) and there is no
   `pageerror`.
3. [browser] Yearlings shipped (removed from groups, moves, weights, weigh_sessions and health): `#exceptions tbody` has
   7 rows (T2, T4, T6, Fuel, Repairs, Heifers gain, Cows pinkeye).
4. [browser] A blank Yearlings target, and separately a header-only weights.csv: the exception table draws
   (`#exceptions tbody tr`); with the header-only weights.csv the gain tile (the `#tiles .tile` whose label ends in
   "gain", "Daily gain" on the redesigned page when no group has a figure) reads "Can't tell" with the reason "No
   weigh-ins yet" (sections 5.4 and 6.2), never a figure, "0" or "NaN".
5. [browser] T6 rows filtered to time <= 2026-09-22T12:00: no `pageerror`; 8 tank cards (`#tanks .tank`); the T6 card's
   chart says it has no readings in the last 7 days (restated from "no signal"): "No readings in the last 7 days" at
   1280 x 900, or the shorter "No readings this week" that the redesign draws on a narrow card, as at 390 x 844
   (section 5.2); `#grazing svg.chart` and `#gain svg.chart` exist; `#budgetTable` has 6 body rows (`tbody tr`) and one
   season-total row (`tfoot tr`), the Repairs body row reads "Serious", "\$7,200", "\$9,000" and "+\$1,800", and the
   season-total row reads "\$88,400", "\$89,303" and "+\$903" (restated: the redesign replaced the 8 `#water .mini`
   boxes, `#budgetChart svg` and the 7-row budget table); the rules table is drawn (`#rules tbody tr`); the T6 row reads
   "No reading for 198 hours". Case render.repro:R13 (T2's last reading 2026-09-21T12:00; the fixture adds timezone
   America/Chicago, section 11.2): "No reading for 222 hours".
6. [browser] Case water.repro:B-03, with T2 and T4 renamed "Well 2" and "Well 4" in both water.csv and tanks.csv: the
   water tile (the `#tiles .tile` labelled "Sensors normal") reads "5 of 8" and "3 need a look". Case render.repro:R17,
   with timezone America/Chicago and a tanks.csv listing Well 1 (P1) and Well 2 (P2) added (section 11.2): "0 of 2", "2
   need a look" and the Water chip (`#chips [data-a='Water']`) shows 2 in its count badge (`.n`), read as "Water 2"
   (restated label and chip form).
7. [browser] Cases grazing.repro:GB-09 to GB-12 and time.browser:TB-04, at 1280 x 900 and at 390 x 844: the grazing
   chart's month labels (the `#grazing svg.chart text` elements that are a three-letter month) equal the hand-worked
   sets (GB-09 May-Sep, GB-10 Jul-Sep, GB-11 Jun-Sep, GB-12 Jul-Oct, TB-04 Jun-Sep). The chart is drawn at the card's
   width, so its plot area is measured on the page, not fixed (restated from "every x lies within 74..550", the old
   fixed plot): the left edge is the left end of the earliest stay bar (`rect[rx='4']`, allowing 1 px), which is right
   of every group name (`text.hd`); the right edge is the right-most of the Today line and the planned-move ticks (the
   chart's other `line` elements). Every month line (`line` with stroke `var(--grid)`) lies inside the plot area;
   every month label starts inside it and ends inside the svg's `viewBox` width. A month line near the right edge may
   have no label when the label would not fit (section 5.3). The test states whether the first day of the start month
   gets a tick.
8. [unit] `tileSummary` with the Heifers and Yearlings heads set to 0 and every weigh-in dated 2026-09-15 removed from
   weights.csv and weigh_sessions.csv (so no weigh-in is within 45 days of the as-of date): the gain tile reads "Not
   judged" with "Head 0 in groups.csv: Heifers, Yearlings", never "No weigh-ins yet" or a figure; the head tile reads
   "180"; the summary counts read "8" and "2 critical, 5 serious, 1 warning (1 can't tell)". With the weigh-ins kept:
   the gain tile reads "Can't tell" with the same detail, never "No weigh-ins yet" or a figure; the summary counts read
   "10" and "2 critical, 5 serious, 3 warning (3 can't tell)" (section 5.4 step 2).

### P1-15

Wording and number formatting ([UI-06](02-findings.md#ui-06), [UI-07](02-findings.md#ui-07), [UI-08](02-findings.md#ui-08), [BUD-06](02-findings.md#bud-06), [GAIN-11](02-findings.md#gain-11)).

1. [scenario] Case time.repro:TIME-18: "Move planned for today" and "Due today (2026-09-30)"; a task due 2026-10-01 reads "Due in
   1 day (2026-10-01)".
2. [scenario] All-clear data: "Nothing needs attention."; the Water filter on all-clear data: "Nothing in water needs
   attention."
3. [browser] Every actual equal to its budget: the "Spend vs budget" tile reads "0.0%" and "\$88,400 of \$88,400"; no
   "−0" anywhere (page text and chart readings, as in item 7); each `#budgetTable` body row and the season-total row
   (`tfoot`) say "On budget" (restated: the page has no budget tooltip; the table carries what it said).
4. [unit] `budgetWarnPct` 0.07: the Budget warning line of the rules table contains "7-10%".
5. [unit] `fmtUsd(104.5) === "$105"`; [scenario] 10,600 against 10,000 gives a warning containing "\$600" (restated from
   "\$60" because of decision D2's \$500 line); with `LANG=de_DE.UTF-8` in node and locale de-DE in Playwright: Fuel
   "(\$2,040)", the "Spend vs budget" tile "\$89,303 of \$88,400", and the as-of facts under the page title (`#asof`)
   "4,300 acres".
6. [scenario] The committed heifer problem contains "2026-09-15"; one slow animal gives the subject "1 yearling";
   targets 1.25 and 2.25 give "Under 0.625" and "Under 1.125" and each listed animal is below the printed number.
7. [browser] At 1280 x 900 and at 390 x 844, no page text matches `/in 0 days|−0(\.0)?%|NaN|Infinity/`: not
   `document.body.innerText`, not the rules table's textContent (it is closed on a phone), and no chart reading in
   `#tip` (each one shown by stepping through every focusable `svg.chart` with Home, ArrowRight and ArrowDown).

### P1-16

Honest rule copy and labels ([GRZ-06](02-findings.md#grz-06), [GAIN-13](02-findings.md#gain-13); [RULE-WAT-15](03-research-and-data.md#rule-wat-15), [RULE-GAIN-03](03-research-and-data.md#rule-gain-03), [RULE-GAIN-04](03-research-and-data.md#rule-gain-04), [RULE-GAIN-05](03-research-and-data.md#rule-gain-05), [RULE-HLTH-11](03-research-and-data.md#rule-hlth-11), [RULE-WF-20](03-research-and-data.md#rule-wf-20), [RULE-WF-21](03-research-and-data.md#rule-wf-21)).

1. [browser] The grazing card note matches `/current stay/i`.
2. [browser] The rules table has a row (`#rules tbody tr`) matching `/no gain target.*not judged/i`, read with
   textContent: on a phone the table is closed inside `details#rulesMore`, so its innerText is empty.
3. [unit] Every `RULES` key appears in the generated rules table with a Basis of "Demo setting (D)", "Ranch choice
   (C)", "Ranch plan (C)" or "Supported general guidance (A)"; the table says water severity uses level percent only;
   the footnote says finding the planted problems does not show the thresholds are right.
4. [browser] No page text contains "here now" or "Water tanks OK"; one `#tiles .tile` has the label (`.k`) "Sensors
   normal", the tank tile.
5. [unit] No Health or Gain row (problem or first step) matches `/\b(mg|ml|cc|dose|dosage|inject|treat with|diagnos)/i`.

### P1-17

Tests and CI ([TEST-01](02-findings.md#test-01), [TEST-02](02-findings.md#test-02)).

1. [unit] Water boundaries, as-of 2026-09-30T18:00, `tanks.csv` listing T1 in P1 only, no moves: (1) readings
   2026-09-29T06:00 12 and 12:00 10 give exactly one serious row; (2) readings of 80 at 2026-09-29T06:00 and 18:00 give
   serious (24 hours without a reading), and readings of 80 at 2026-09-29T07:00 and 19:00 give no row (23 hours, two
   readings in the window) (restated: with a single reading at 19:00, step 8 gives a "not enough recent history"
   warning); (3) 80 to 50 over 24 hours gives critical, 80 to 50.1 gives no row; (4) flat levels (two readings 24 hours
   apart at each level) 24.9 / 25 / 39.9 / 40 give critical / warning / warning / none; (5) 2026-09-29T18:00 80, 2026-09-30T00:00 50, 2026-09-30T18:00 45 give "Dropped 35 points
   in 24 hours, now 45% (unexplained fall; leak not confirmed)" (restated suffix); (6) the same rows newest-first give
   the same row.
2. [unit] Grazing boundaries: the five cases of section 5.3.
3. The audit's mutants (`water.verify.mjs` Part B for water, as TEST-01's repro names it; `registry.extra.mjs` Part 2
   for grazing, as TEST-02's names it): with the part (a) tests added to `tests/exceptions.test.mjs` and today's code,
   the scripts run unchanged and every mutant is killed. The scripts patch today's source text, so after the refactor
   the same mutations are re-expressed against the new modules: none survives. Recorded in the pull request; not a CI step.
4. CI runs the unit and scenario tests under three zones, the browser smoke test, and the data check with the
   untracked-file test.
5. `tests/exceptions.test.mjs` is updated as listed in section 13 and still passes.

---

## 13. Migration and compatibility

**Data files.**

| Old input | Phase 1 behaviour | What a user does |
|---|---|---|
| meta.csv with `as_of` only and no offset | `META_NO_TIMEZONE` (error); water silence and drop can't be judged, so every tank is CAN'T TELL (critical when its last level is critical, otherwise serious; section 5.2); day counts still run on the written date | Add a `timezone` column (for example America/Chicago). |
| meta.csv with an offset in `as_of` and no zone | Fixed offset used, warning | Add `timezone` so daylight-saving changes are handled. |
| No `tanks.csv` | Tanks from water.csv, `TANK_LIST_MISSING` (warning); a tank with no readings cannot be shown | Add tanks.csv. |
| No `weigh_sessions.csv` | Gain serious and individual flags CAN'T TELL ("Weighing conditions not recorded") | Add one row per group weigh day with `weight_basis`. |
| groups.csv head 0 for a sold or shipped group whose weigh-ins are kept | With no weigh-in in the last 45 days (`gainMaxAgeDays`): gain not judged for that group and one `GROUP_HEAD_ZERO` note. With a more recent weigh-in: a gain CAN'T TELL row and a `GROUP_HEAD_ZERO_RECENT_WEIGHINS` warning (section 5.4 step 2). Today the page still judges the group, for example the "6 yearlings" row with the Yearlings head at 0 | Enter the head count if the group still has animals. |
| No `books_closed_through` / `season_start` | Defaults labelled "assumed" | Add them to meta.csv. |
| Day-first or M/D/YYYY dates, spreadsheet serials | Rejected as data issues, never guessed | Export ISO dates (YYYY-MM-DD). |
| Budget amounts with `$`, grouped thousands, parentheses | Accepted (decision D3) | none |
| Several rows for one month and category | Added together with a warning (decision D15) | Delete replaced rows. |

**Code.** `findExceptions(d, R)` remains and returns rows in the old shape, so callers keep working; it accepts an
optional third argument `{ timezone }` for callers whose meta has none. `exceptions.js` also keeps a `parseCSV(text)`
export with the old return shape (an array of row objects), built on `csv.js`, but every value is now a trimmed string
or `null`; typing happens in `buildDataset`. `waterStatus`, `grazingStatus`, `gainStatus`
and `budgetStatus` are replaced by the per-area results of `evaluate` (`result.water.tanks`, `result.grazing.groups`,
`result.gain.groups`, `result.budget.categories`, with money in integer cents). The redesigned `app.js` calls all four:
`tiles()` calls each, `waterMultiples()` calls `waterStatus`, `grazingTimeline()` calls `grazingStatus` for the chart
and the Now grazing list, `gainStrip()` calls `gainStatus`, and `budget()` calls `budgetStatus`. The change that
replaces them moves each caller to `evaluate` in the same pull request and keeps what it draws (section 6.3).

**Existing tests** (`tests/exceptions.test.mjs`):

| Test | Change |
|---|---|
| `load()` helper | its file list gains `tanks` and `weigh_sessions`; without `weigh_sessions` the gain flags would be CAN'T TELL |
| "finds every problem planted in the data" | none (T6 stays serious) |
| "and nothing else" (length 10) | none |
| "worst first" | none |
| "a silent sensor isn't also judged on its stale level" | none |
| "a water alert names the group drinking there" | expects "Heifers there as of 2026-09-30" instead of "Heifers here now" |
| "water rules at their thresholds" | its meta gains `timezone: "UTC"` (the test builds UTC wall times), and its base data sets `tanks` to T1 in P1 only: with the full tank list, T2-T8 have no readings in that test and would each add a serious CAN'T TELL Water row, breaking the row counts and `[0].severity`; the 35-point case expects the new suffix if it checks text |
| "summaries" | rewritten against `evaluate`: 8 tanks; current groups Cows, Heifers, Yearlings; matched heads 45 and 150; Fuel variance 204,000 cents |
| "CSV parsing keeps text as text and numbers as numbers" (lines 64-66, asserts blanket conversion) | replaced: `parseCSV` returns text; typing keeps `"P1"` and `"007"` as strings and `12.5` as a number only in a number column; a blank is `null` |

**Strings that change on the page** (and in any screenshot or README text that quotes them): "Water tanks OK" →
"Sensors normal"; "here now" → "there as of {date}"; "21% over season to date" → "21.3% over budget, season to date
through 2026-09"; "since 2026-07-20 vs 1.0 target" → "between the 2026-07-20 and 2026-09-15 weigh-ins (target 1.0)";
the gain tile "Yearling gain 1.94 lbs/day" → the Heifers figure "0.44 lbs/day Heifers (target 1.0)";
"Schedule it this week" → the new first step; "Pull and check these animals at the next gather" → "Look at these
animals at the next gather and record what you see"; the T6 row gains "at 2026-09-29 00:00" and the CAN'T TELL marker.
The README screenshots (`docs/screenshots/screenshot.png`, `water.png`, `grazing-gain.png` and `phone.png`, moved
from `docs/` on 2026-10-20) should be retaken.

**Audit files.** The diagnostics scripts in `docs/audit/diagnostics/` stay as the audit's record of the behaviour at the
reviewed commit; they are not updated to the new code. `docs/audit/redesign/coverage.mjs` stays as the record of the
redesign's claims and is not a Phase 1 gate; `docs/audit/redesign/preserve.mjs` is the read-only reference for the
preserve checks of section 11.4 item 6.

---

## 14. What Phase 1 does not include

Phase 1 adds none of the following. Where the redesigned page already does part of an item, that part is kept and is
not a Phase 2 feature ([section 6.3](#63-accessibility-and-layout-kept-from-the-redesign)).

- Freshness and coverage strip, sensor-late warning, real-data age banner (P2-01).
- A freshness line, Today / This week / Plan grouping, new and resolved counts, any "2-minute" claim (P2-02). The
  summary card with counts by severity stays.
- Filters by severity, pasture or group, and an announced filter result (P2-03). The area chips keep their counts,
  `aria-pressed` and focus.
- "Why this row?" panels and grazing destinations (P2-04). The gain chart keeps its flagged-animal readings, legend
  and 50% and 80% lines.
- "Show data" tables, a text alternative that states each chart's decision-relevant state, and a tooltip the mouse can
  move onto or click to keep open (P2-05). Chart readings by pointer, touch and keyboard, and the tooltip kept on
  screen, stay.
- Short dates in rows (decision D14) and a cap on the budget bar scale (P2-06). The phone layouts, chart text size,
  label fitting and line breaks at sensor outages stay.
- The fix for the colour-only marks the redesign shipped (the flagged gain dots and the gain and spend tile meters). A
  separate pull request makes it (section 15).
- Printable crew briefing and visual-check capture (P2-07).
- Rest checks, concurrent-occupancy check, a credible example rotation, "no current pasture recorded" (P2-08).
- Consequence-aware ranking and silence escalation (P2-09).
- Frozen-sensor check, weight-loss naming, group changes, health record conflicts, under-spend lines, "180 pairs"
  (P2-10).
- Any browser storage, acknowledgement or note (P2-11).
- Water supply coverage, forage observations, drought and precipitation context (P3-01 to P3-03).
- Full weigh-condition records and shrink policy ([GAIN-10](02-findings.md#gain-10)), combined-group planning
  ([GRZ-09](02-findings.md#grz-09)), live integrations, shared records, inventory, calving and breeding, maintenance logs,
  predictive or AI features, and investment economics (deferred or excluded; [05-roadmap.md section 6](05-roadmap.md#6-deferred-and-excluded)).

---

## 15. Open decisions and assumptions

**Decisions this specification depends on** (reasons in [05-roadmap.md section 1.4](05-roadmap.md#14-decisions-this-roadmap-makes-where-the-evidence-disagrees)):
D1 explicit `books_closed_through`; D2 combined percent and dollar lines; D3 money formats; D4 grouped thousands; D5
max-drawdown window; D6 21-day group and 42-day individual minimums; D7 T6 as CAN'T TELL; D8 latest open stay judged;
D9 weigh basis in Phase 1; D10 health status list; D11 `planned_out_date`; D14 ISO dates in rows; D15 duplicate rows;
D16 scenario-folder inputs updated to the data contract. Each can be reversed by the lead or owner; the affected acceptance criteria are the ones marked "(restated)".

**Starting point** (owner, 2026-10-20). Phase 1 starts from main with the redesign merged (pull request #2, merge
commit `0315d09`), once the documentation pull request that adds `docs/audit/redesign/preserve.mjs` is merged, and
keeps what section 6.3 lists. Only enhancements the redesign does not ship stay deferred
(section 14). The preserve checks behind section 6.3 are kept in `docs/audit/redesign/preserve.mjs` and run by the
smoke test (section 11.4 item 6).

**Known issues of the redesign, not features to keep** (recorded 2026-10-20). Two kinds of mark on main show status by
colour without an icon or word of their own, against the rule that a status colour comes only with an icon and a
label: the flagged gain dots, which differ from the others by hue only (1.10:1; their readings and the legend name
the flag), and the meters on the gain and spend tiles, both noted in the review of the redesign, which is not in this
repository. A separate pull request fixes them. Phase 1 adds no mark like them, and does not count them as features to
keep (section 6.3). A budget category with a long unbroken run of characters widens `#budgetTable` past a phone
window, and a group with a gain target but no weigh-ins is in neither the gain chart nor its "Not shown" note; the
same separate pull request fixes both. That pull request delivers no P1 item and is reviewed with Checkpoint 2 against
this list: each flagged gain dot differs from the other dots by more than colour, and KEEP-24 is changed to count that
mark; the gain and spend tile meters no longer carry a state by colour alone; at 390 x 844 a budget category of 60
characters with no space leaves `document.documentElement.scrollWidth <= clientWidth`; a group with a gain target and
no weigh-ins is named in `#gain p.hint`; KEEP-01 to KEEP-34 otherwise pass unchanged.

**Choices made in this specification** (recommendations, not evidence):

- The severity of CAN'T TELL rows: serious for water (or critical when the last good level is critical: section 5.2
  step 4 and the no-zone case), warning for grazing, gain, health and budget. This reflects how fast each area can harm animals; it is a design choice (C), not
  sourced.
- One area-level CAN'T TELL row when a whole file or column is unusable, instead of one row per subject.
- A gain session is a date with at least half the group weighed (`max(1, ceil(0.5 x head))`); averaging two same-day
  weights; months before a budget category's first row count as "not started".
- The gain tile shows the judged group with the lowest ratio of G to its target, ties going to the first in groups.csv
  (the redesign prefers Yearlings, then the first group
  with a target; `cfd77e5` hard-coded Yearlings, [LOAD-03](02-findings.md#load-03)).
- Head 0 means groups.csv records no animals in the group now. With no weigh-in in the last `gainMaxAgeDays` (45, D),
  the group's gain is not judged: a note and the gain line say so, the weigh-ins stay in the file as history, and the
  Gain area can still read OK. `data-fields.json` allows 0 ("Integer >= 0"); its rule "Coverage cannot be computed, so
  the group gain verdict is withheld (CAN'T TELL)" is read as applying to a blank or unreadable head. Trade-off: an old
  0 typed by mistake hides that group's gain behind a note until GRZ-07's group status (P2-08) lets the data say which.
- Head 0 with a weigh-in in the last 45 days is an inconsistent record: a gain CAN'T TELL row and a warning, not a
  note. This keeps a 0 typed by mistake from silently hiding a planted problem (a Heifers head of 0 would otherwise
  hide the serious 0.44 row). Trade-off: a group sold within 45 days of its last weigh-in shows a CAN'T TELL row until
  that weigh-in is more than 45 days old.
- More animals weighed at both sessions than the head count (`matched > head`) is a warning, and the group is still
  judged, because a sale after the last weigh-in gives the same numbers. Trade-off: a head count that is too low is
  reported but does not withhold the verdict. The trigger is `matched > head`, not the animals weighed at `S2`, so
  folder 06 (151 Yearlings tags weighed on 2026-09-15 against head 150) and P1-09 item 1 (Y151) get no new warning.
- With no usable time zone, only the hour-based water rules are CAN'T TELL; day counts and "today" wording run on the
  date written in `as_of` (section 3.3). `data-fields.json` could be read more broadly ("treat time-based rules as
  CAN'T TELL", "drop 'today' wording"); if the lead reads it that way, grazing and health also become CAN'T TELL
  without a zone.
- The settings in section 9 marked D are new demonstration values; none is sourced or validated.

**Assumptions about fixtures.** Several cases (GAIN-06's four rows, GAIN-12's five yearlings, CSV-17) need groups.csv
heads equal to the animals in the fixture, or no weigh session forms; LOAD-03's "shipped" case removes the Yearlings
from every file; BUD-04's cases use one closed month per category. The audit's scripts define these cases, but their
group files were not re-read for this specification. If a fixture differs, the criterion should be adjusted to the
fixture, not the rule.

**Not verified.** Nothing here was implemented. The statements about the redesigned page (sections 5.1 to 5.6, 6.1
to 6.3, 7, 10.2, 11.4 and 12; the `app.js` function names and line numbers are from reading the code on main) were
measured with Playwright Chromium on main at `0315d09` on 2026-10-20, at 1280 x 900, at 390 x 844 with touch, and
at 320 x 640 where stated; the new P1-10 and P1-14 head-count criteria are expectations derived from section 5.7 and
have not been run. The browser behaviour of Firefox, WebKit, real phones and screen readers, and the GitHub Pages
deployment, remain untested (the site returned 403 through the proxy). The values in
section 5.7 marked as checks for this specification were computed from `data/*.csv` with a short Python script and are
not audit evidence.

---

## Sources

- [05-roadmap.md](05-roadmap.md): work items, coverage tables and decisions D1-D16.
- `docs/audit/scenarios/` (README, `settings.json`, each folder's `expected.json` and `scenario.md`, `run-results.json`)
  and `docs/audit/diagnostics/scenarios.build.py`, `scenarios.run.mjs` (matching and `compareTiles`) and
  `scenarios.gain70.py`, read on 2026-10-19.
- `docs/audit/data/findings.json` (quoted `actual`, `expected` and `regression_test` text; `policies`;
  `unresolved_assumptions`), `rules.json` (rule text, classes, phase notes, recommendations), `data-fields.json`
  (Phase 1 required and optional fields, validation and missing behaviour), `integrations.json`.
- [02-findings.md](02-findings.md), [03-research-and-data.md](03-research-and-data.md),
  [04-workflow-and-features.md](04-workflow-and-features.md), [01-baseline.md](01-baseline.md).
- Code and data at the reviewed commit: `exceptions.js`, `app.js`, `index.html`, `scripts/generate_data.py`,
  `tests/exceptions.test.mjs`, `.github/workflows/test.yml`, README.md, `data/*.csv`.
- Audit test cases: `docs/audit/diagnostics/*.mjs` (case definitions only; not re-run for this specification).
- The redesigned page on main at `0315d09` (`index.html`, `app.js`), [08-redesign-coverage.md](08-redesign-coverage.md)
  and `docs/audit/redesign/coverage.mjs`, and the preserve checks in `docs/audit/redesign/preserve.mjs` (34 of 34 pass
  on main), read and measured with Playwright Chromium on 2026-10-20.
