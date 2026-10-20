// Skeptic pass on the CSV and input-integrity findings: node reproductions of defects the first audit did not cover.
// Run from the repo root:  node docs/audit/diagnostics/csv.verify.mjs
// Each case feeds the committed data (or a tiny fixture) with one change through the REAL parseCSV / findExceptions /
// gainStatus / waterStatus and prints CASE / expected / actual / MATCH|MISMATCH. MISMATCH means the defect is present.
// It modifies no files. Browser-level checks for the same cases are in csv.verify.browser.mjs.

import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, findExceptions, gainStatus, waterStatus } = await import(new URL("exceptions.js", ROOT).href);
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));
const load = (mods = {}) => Object.fromEntries(FILES.map((f) => [f, parseCSV(typeof mods[f] === "function" ? mods[f](RAW[f]) : mods[f] ?? RAW[f])]));
const key = (e) => `${e.severity}|${e.subject}|${e.problem}`;
const BASE = findExceptions(load()).map(key).sort();
const sameAsBase = (alerts) => JSON.stringify(alerts.map(key).sort()) === JSON.stringify(BASE);
const fmt = (a) => (a.length ? a.map(key).join(" || ") : "(no alerts)");
const diff = (a) => {
  const k = a.map(key);
  const lost = BASE.filter((x) => !k.includes(x)), added = k.filter((x) => !BASE.includes(x));
  return `${a.length} alerts; LOST [${lost.join(" ; ")}]; NEW ${added.length} [${added.slice(0, 3).join(" ; ")}${added.length > 3 ? " ; ..." : ""}]`;
};

// python3 -m http.server's 404 body (what fetch().text() returns for a missing file; app.js never checks res.ok)
const PY404 = `<!DOCTYPE HTML>\n<html lang="en">\n    <head>\n        <meta charset="utf-8">\n        <title>Error response</title>\n    </head>\n    <body>\n        <h1>Error response</h1>\n        <p>Error code: 404</p>\n        <p>Message: File not found.</p>\n        <p>Error code explanation: 404 - Nothing matches the given URI.</p>\n    </body>\n</html>\n`;
const dblCR = (t) => t.replaceAll("\r\n", "\r\r\n");
const repeatHeader = (t) => { const [h, ...r] = t.trim().split("\r\n"); const m = r.length >> 1; return [h, ...r.slice(0, m), h, ...r.slice(m)].join("\r\n") + "\r\n"; };

const CASES = [
  ["CV-01", "every file with doubled-CR line endings (\\r\\r\\n), e.g. CSV written in text mode on Windows",
    "the same 10 alerts as the committed data",
    () => ({ alerts: findExceptions(load(Object.fromEntries(FILES.map((f) => [f, dblCR])))) }),
    (r) => r.alerts && sameAsBase(r.alerts), (r) => diff(r.alerts)],
  ["CV-01b", "water.csv only with doubled-CR line endings",
    "critical T2 'Down to 11.8% full' and critical T4 'Dropped 46 points in 24 hours, now 10%' still reported",
    () => ({ alerts: findExceptions(load({ water: dblCR })) }),
    (r) => r.alerts && sameAsBase(r.alerts), (r) => diff(r.alerts)],
  ["CV-01c", "moves.csv only with doubled-CR line endings",
    "the same 10 alerts; header key is 'out_date', not 'out_date\\r'",
    () => ({ alerts: findExceptions(load({ moves: dblCR })), keys: Object.keys(parseCSV(dblCR(RAW.moves))[0]) }),
    (r) => r.alerts && sameAsBase(r.alerts), (r) => `keys ${JSON.stringify(r.keys)}; ${diff(r.alerts)}`],
  ["CV-02", "weights.csv = two exports joined with their headers (header line repeated mid-file)",
    "no crash; the same 10 alerts",
    () => ({ alerts: findExceptions(load({ weights: repeatHeader })) }),
    (r) => r.alerts && sameAsBase(r.alerts), (r) => diff(r.alerts)],
  ["CV-02b", "water.csv = two exports joined with their headers",
    "8 tanks (T1-T8); no phantom tank named 'tank_id'",
    () => ({ value: waterStatus(load({ water: repeatHeader }).water, RAW.meta.split(/\r?\n/)[1].trim()).map((t) => t.tank) }),
    (r) => r.value && r.value.length === 8, (r) => `${r.value.length} tanks ${JSON.stringify(r.value)}`],
  ["CV-03", "two different tanks share tank_id T1 (one in P1 at 12%, one in P3 at 90%), rows interleaved by time",
    "critical | Tank T1 (North Flat) | Down to 12% full  [12 < 25; the P1 tank reads 12 at every time, so drop 0], or a data error naming T1",
    () => {
      const times = ["2026-09-29T18:00", "2026-09-30T00:00", "2026-09-30T06:00", "2026-09-30T12:00", "2026-09-30T18:00"];
      const water = "tank_id,pasture_id,time,level_pct\n" + times.flatMap((t) => [`T1,P1,${t},12`, `T1,P3,${t},90`]).join("\n");
      return { alerts: findExceptions(load({ water })).filter((e) => e.area === "Water") };
    },
    (r) => r.alerts && r.alerts.some((e) => e.severity === "critical" && e.subject.startsWith("Tank T1 (North Flat") && e.problem === "Down to 12% full"),
    (r) => fmt(r.alerts)],
  ["CV-04", "water.csv with a one-line vendor preamble above the header",
    "a load error naming water.csv, or the committed T2/T4 critical alerts; never a bare TypeError",
    () => ({ alerts: findExceptions(load({ water: (t) => "Exported from tank portal 2026-09-30 18:05\r\n" + t })) }),
    (r) => (r.alerts && sameAsBase(r.alerts)) || (r.error && /water\.csv/.test(r.error)), (r) => diff(r.alerts)],
  ["CV-04b", "health.csv with a one-line title above the header",
    "serious | Yearlings: Booster vaccine | Overdue by 15 days (due 2026-09-15), or a load error naming health.csv",
    () => ({ alerts: findExceptions(load({ health: (t) => "Herd health tasks\r\n" + t })) }),
    (r) => r.alerts && sameAsBase(r.alerts), (r) => diff(r.alerts)],
  ["CV-05", "health.csv missing: the server's 404 HTML page is parsed as the file",
    "a load error naming health.csv; never a silent 'no health alerts'",
    () => ({ alerts: findExceptions(load({ health: PY404 })), keys: Object.keys(parseCSV(PY404)[0] ?? {}) }),
    (r) => !!r.error && /health\.csv/.test(r.error), (r) => `header key ${JSON.stringify(r.keys)}; ${diff(r.alerts)}`],
  ["CV-06", "weigh-in dates re-saved as M/D/YYYY (US Excel converts date-only cells) with an October weigh-in",
    "Y1 adg 0.370 from 9/15/2026 to 10/12/2026  [(830 - 820) / 27 days = 0.370]",
    () => {
      const w = "tag,group,date,weight_lbs\nY1,Yearlings,7/20/2026,700\nY1,Yearlings,9/15/2026,820\nY1,Yearlings,10/12/2026,830";
      const g = gainStatus(parseCSV(w), parseCSV("group,class,head,target_adg_lbs\nYearlings,steers,1,2.0"))[0];
      return { value: `adg ${g.adg.toFixed(3)} from ${g.from} to ${g.to}` };
    },
    (r) => r.value === "adg 0.370 from 9/15/2026 to 10/12/2026", (r) => r.value],
  ["CV-07", "pastures.csv saved by Excel as 'CSV (Comma delimited)' (Windows-1252) with the name 'La Peña'",
    "name decodes as 'La Peña', or the page reports the file is not UTF-8",
    () => {
      const bytes = Buffer.from(RAW.pastures.replace("Sand Hills", "La Peña"), "latin1");
      const text = new TextDecoder("utf-8").decode(bytes);   // what Response.text() does
      return { value: parseCSV(text).find((p) => p.pasture_id === "P3").name };
    },
    (r) => r.value === "La Peña", (r) => JSON.stringify(r.value)],
];

let mism = 0, match = 0;
for (const [id, title, expected, fn, ok, show] of CASES) {
  let r;
  try { r = fn(); } catch (err) { r = { error: `${err.constructor.name}: ${err.message}` }; }
  let good;
  try { good = !!ok(r); } catch { good = false; }
  console.log(`CASE ${id}  ${title}`);
  console.log(`  expected: ${expected}`);
  console.log(`  actual:   ${r.error ? `THROWS ${r.error}` : show(r)}`);
  console.log(`  ${good ? "MATCH" : "MISMATCH"}`);
  good ? match++ : mism++;
}
console.log(`\n${CASES.length} cases: ${match} MATCH, ${mism} MISMATCH`);
