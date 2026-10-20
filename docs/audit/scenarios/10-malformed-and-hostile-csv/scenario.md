# 10. Malformed and hostile CSV text

**The case.** Real CSV exports from spreadsheets, scale heads and accounting software contain:

- quoted commas;
- escaped quotes;
- a byte-order mark;
- Windows line endings;
- blank rows;
- tags with leading zeros;
- a misspelled header.

A shared file can also carry markup in a name. The manager needs the same report as on clean data. Every unreadable
part must be named, and nothing in a file may run as code on the page.

All data is fictional (Example Ranch). The `<img onerror>` text is a harmless probe: it only sets
`window.__scenarioXss = 1`.

## Files

| File | Status | Change |
|---|---|---|
| pastures.csv | changed | P3's name is `"Sand Hills, East"` (quoted, with a comma). P2's name is `Windmill <img src=x onerror=window.__scenarioXss=1>`. |
| groups.csv | changed | Yearlings' class is `"yearling steers, ""fall"" set"`: escaped quotes plus a comma. |
| weights.csv | changed | Yearling tags lose the Y (`001` ... `150`). H001's Sep 15 weight is the quoted `"1,169"`. |
| water.csv | changed | Starts with a UTF-8 BOM (bytes EF BB BF). After the T1 block there are an empty line, a whitespace-only line and a `,,,` line. |
| health.csv | changed | The header says `staus` instead of `status`. The rows carry the HLTH-03 fix. |
| budget.csv | changed | Every line ends with CR CR LF (`\r\r\n`). |
| meta.csv | changed | `2026-09-30T18:00,America/Chicago` |
| tanks.csv | added | T1-T8 |
| moves.csv | copied unchanged (CRLF, as committed) | |

## Expected Phase-1 result (10 rows)

| State | Severity | Area | Subject | Expected |
|---|---|---|---|---|
| Needs attention | Critical | Water | T2 | 11.8%. The pasture name is shown **as text**: "Windmill <img ...". |
| Needs attention | Critical | Water | T4 | fell 46.0 points, now 10.0% |
| Needs attention | Serious | Water | T6 | 42 h silent, 98.5% |
| Needs attention | Serious | Grazing | Yearlings in "Sand Hills, East" | day 24 of 21 |
| Needs attention | Serious | Gain | Heifers | 0.4363 (H001's "1,169" read as 1169) |
| Needs attention | Warning | Gain | 6 yearlings | **027, 031, 058, 082, 129, 132**: leading zeros kept |
| Needs attention | Serious | Budget | Fuel | 21.25%, $2,040 |
| Needs attention | Serious | Budget | Repairs | 25.0%, $1,800 |
| Data issue | - | Health | health.csv | the required 'status' column is missing (the header says 'staus') |
| Data issue | - | Water | water.csv | 3 non-data lines skipped and counted. Whether the empty line is counted is a choice. |

Area states: Water, Grazing, Gain and Budget need attention. **Health is CAN'T TELL**: its file cannot be read, so it
is not OK.

Must not appear:

- a Yearlings group row (the target is 2.0, and 1.9425 is at least 1.6);
- a heifer animal row;
- a phantom tank;
- `NaN` or `undefined`.

| Tile | Expected |
|---|---|
| Water | 5 of 8 OK, 3 need a look |
| Spend vs budget | +1.0%: $89,303 of $88,400 (the CR CR LF endings read correctly) |

Render checks (browser only):

1. No `<img>` element is created inside the exception table, water section, tiles or budget table.
2. `window.__scenarioXss` is not set.
3. The text "Windmill <img" is visible on the page as text.

## Arithmetic

Once the files are read correctly, every number equals scenario 01: the content is the same, only the encoding changed.
H001's quoted "1,169" equals its committed Sep 15 weight of 1169.

## Current result (verified in this step by `scenarios.run.mjs`)

MISMATCH in both modes. Node: 3 of 10 rows match, with 4 unexpected rows. Browser: 2 of 10, with 4 unexpected rows,
and 0 of 3 render checks pass.

- **Phantom critical tanks** (CSV-02). "[critical] Water | Tank 0 (undefined) | Down to % full" and "[critical] Water
  | Tank  (undefined) | Down to % full". The whitespace-only line becomes tank `0`, because `+"   "` is 0 (CSV-06).
  The `,,,` line becomes tank `""`. Both have a blank level, and `'' < 25` is true. Water tile: "current 5 of 10 | 5
  need a look".
- **Shifted columns** (CSV-01).
  - The quoted comma in the Yearlings class shifts the head count (150) into the target column: "[serious] Gain |
    Yearlings | 1.94 lbs/day since 2026-07-20 vs 150.0 target".
  - P3's quoted comma pushes the 720 acres into `planned_graze_days`. The yearlings' overstay is lost, and Grazing reads
    OK.
- **The heifer alarm turns into 32 animal rows.** H001's `"1,169"` splits into `"1` and `169"`. H001's gain becomes
  NaN, so the group average is NaN and the group row is lost. Instead: "[warning] Gain | 32 heifers | Under 0.5
  lbs/day: H002, H004, ...".
- **Health silently OK** (CSV-03). With no `status` column, every task is skipped: "MISMATCH Health   expected
  cant-tell, current ok".
- **Budget silently OK, with a broken tile.** With CR CR LF endings the header's last key is `actual\r`, so `r.actual`
  is undefined for every row. No budget rows, and the tile reads "−NaN% | $NaN of $88,400".
- **Leading-zero tags.** Not reached as a separate result: the group row above suppresses the animal row. In the node
  parse, `001` would be read as the number 1 (CSV-06).
- **The markup runs in the browser** (SEC-01).
  - "MISMATCH no_injected_element ... 1 element(s)".
  - "MISMATCH global_not_set __scenarioXss: 1".
  - "MISMATCH text_visible Windmill <img: not visible as text".
  - The T2 subject reads "Tank T2 (Windmill )" because the browser parsed the rest as an element.
- **The page stops partway.** In the browser: "TypeError: Cannot read properties of undefined (reading 'time') (at
  app.js:93)". The phantom tanks have no readable time, so the water chart finds no last reading. Everything drawn after
  the water charts is missing: "rules table never drawn within 4 s". This matches LOAD-04's mechanism.
- **The BOM is harmless today.** Both node (TextDecoder) and the browser (`Response.text()`) strip it before
  `parseCSV`, and `trim()` would strip it too. The fixture keeps it so that a Phase-1 parser must not regress.

## Findings and rules exercised

CSV-01, CSV-02, CSV-03, CSV-05, CSV-06, SEC-01, LOAD-01, LOAD-04.

## Assumptions

- Whether an empty line counts as a skipped non-data line is a choice. The expected row only requires that the skipped
  lines are reported.
- The render checks look in `#exceptions`, `#water`, `#tiles` and `#budgetTable`. Phase-1 markup may use other IDs, so
  update the selectors if it does.
- The browser checks ran in Chromium only (Playwright).
