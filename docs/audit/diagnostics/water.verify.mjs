// Skeptic re-check of the water audit (verify-water). Run from anywhere:
//   node docs/audit/diagnostics/water.verify.mjs
// Part A (node): new water cases the first audit did not cover, plus two wording checks on its findings.
// Part B (node): mutation check. Copies exceptions.js, data/ and tests/ to a temp dir, applies one change at a time
//                to the water rules, and runs the existing test suite. "SURVIVES" = the 8 tests still pass.
// Part C (headless Chromium): chart gap, sensor stopped 18 h ago, unknown pasture in the chart heading, and what
//                still renders when waterMultiples throws.
// Modifies no repo file. TZ pinned to UTC for the node parts.
process.env.TZ = "UTC";
import { readFileSync, mkdtempSync, cpSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const { parseCSV, findExceptions, waterStatus } = await import(join(ROOT, "exceptions.js"));
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(join(ROOT, `data/${f}.csv`), "utf8")]));
const D = Object.fromEntries(FILES.map((f) => [f, parseCSV(RAW[f])]));
const AS = "2026-09-30T18:00";
const W = (water, meta = D.meta) => findExceptions({ ...D, water, meta }).filter((e) => e.area === "Water").map((e) => `${e.severity} | ${e.subject} | ${e.problem}`);
const csv = (b) => parseCSV("tank_id,pasture_id,time,level_pct\n" + b);
const show = (id, expected, actual) => console.log(`CASE ${id}\n  expected: ${expected}\n  actual:   ${actual}\n`);

console.log("=== Part A: node ===\n");
// V-M3: T4 (planted leak, 45 heifers) stops reporting after 2026-09-30T00:00 (44.5%), 18 h before as_of.
// By hand: 18 h < 24 h so not silent; baseline = 09-29T00:00 65.0, drop 20.5 < 30; 44.5 >= 40 -> nothing.
// Its last 12 h of data fell 67.5 -> 44.5 = 23 points (1.92/h); projected to as_of: 44.5 - 1.92*18 = 10.0.
{
  const w = D.water.filter((r) => !(r.tank_id === "T4" && r.time > "2026-09-30T00:00"));
  const t = waterStatus(w, AS).find((x) => x.tank === "T4");
  show("V-M3 T4 sensor stops 18 h before as_of, mid-leak",
    "a T4 row saying the last reading is 18 h old and was falling (projected ~10%)",
    `T4 last=${t.lastTime} level=${t.level} silentHours=${t.silentHours} drop24h=${t.drop24h}; water rows: ${JSON.stringify(W(w))}`);
}
// V-M4: T4's sensor freezes at 67.5 from 09-29T12:00 on (keeps sending the same value, 6 identical readings).
{
  const w = D.water.map((r) => (r.tank_id === "T4" && r.time >= "2026-09-29T18:00" ? { ...r, level_pct: 67.5 } : r));
  show("V-M4 T4 sensor frozen at 67.5% for 30 h", "a T4 'reading has not changed' flag", JSON.stringify(W(w)));
  const runs = Object.entries(Object.groupBy(D.water, (r) => r.tank_id)).map(([t, rs]) => {
    let run = 1, best = 1; for (let i = 1; i < rs.length; i++) { run = rs[i].level_pct === rs[i - 1].level_pct ? run + 1 : 1; if (rs[i].level_pct < 98) best = Math.max(best, run); }
    return `${t}:${best}`; });
  show("V-M4b committed data: longest run of identical readings below 98%", "(control for a flatline rule)", runs.join(" "));
}
// V-W02: the first audit's W-02 title includes "resumed sensor". A resumed sensor has a pre-gap row, so the stale
// baseline path (W-01) applies and the drop IS reported.
show("V-W02 resumed sensor (row 5 days old, then 95, 80, 65, 50 on Sep 30)", "(wording check)",
  JSON.stringify(W(csv("T1,P1,2026-09-25T12:00,95\nT1,P1,2026-09-30T00:00,95\nT1,P1,2026-09-30T06:00,80\nT1,P1,2026-09-30T12:00,65\nT1,P1,2026-09-30T18:00,50"))));
// V-W06: meta.csv left two days stale while water.csv is replaced (README: "replace the CSVs with exports").
show("V-W06 stale meta.csv (as_of 2026-09-28T18:00, committed water.csv)", "T6 still reported silent",
  `T6 silentHours=${waterStatus(D.water, "2026-09-28T18:00").find((t) => t.tank === "T6").silentHours}; ${JSON.stringify(W(D.water, [{ as_of: "2026-09-28T18:00" }]))}`);

console.log("=== Part B: mutation check of tests/exceptions.test.mjs ===\n");
const MUTANTS = [
  ["silent tank also judged (continue removed)", "      continue;   // its last level is stale, so don't also judge it", "      // removed"],
  ["silence boundary >= -> >", "if (t.silentHours >= R.sensorSilentHours)", "if (t.silentHours > R.sensorSilentHours)"],
  ["drop boundary >= -> >", "if (t.drop24h >= R.waterDropPts)", "if (t.drop24h > R.waterDropPts)"],
  ["critical boundary < -> <=", "else if (t.level < R.waterCritical)", "else if (t.level <= R.waterCritical)"],
  ["low boundary < -> <=", "else if (t.level < R.waterLow)", "else if (t.level <= R.waterLow)"],
  ["no sort by time", "rows.sort((a, b) => a.time.localeCompare(b.time));", ";"],
  ["drop window 24 h -> 18 h", "days(r.time, last.time) >= 1)", "days(r.time, last.time) >= 0.75)"],
  ["drop window 24 h -> 30 h", "days(r.time, last.time) >= 1)", "days(r.time, last.time) >= 1.25)"],
];
const SRC = readFileSync(join(ROOT, "exceptions.js"), "utf8");
for (const [name, from, to] of MUTANTS) {
  const dir = mkdtempSync(join(tmpdir(), "water-mut-"));
  try {
    for (const f of ["data", "tests"]) cpSync(join(ROOT, f), join(dir, f), { recursive: true });
    if (SRC.split(from).length !== 2) throw new Error("mutation anchor not unique: " + from);
    writeFileSync(join(dir, "exceptions.js"), SRC.replace(from, to));
    const r = spawnSync(process.execPath, ["--test", "tests/exceptions.test.mjs"], { cwd: dir, encoding: "utf8" });
    const pass = /# pass (\d+)/.exec(r.stdout)?.[1], fail = /# fail (\d+)/.exec(r.stdout)?.[1];
    console.log(`  ${fail === "0" ? "SURVIVES" : "killed  "}  ${name}  (pass ${pass}, fail ${fail})`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
console.log("");

console.log("=== Part C: headless Chromium ===\n");
let chromium = null;
try { ({ chromium } = await import(process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs")); } catch (e) { console.log("Part C skipped: " + e.message); }
if (chromium) {
  const work = mkdtempSync(join(tmpdir(), "water-verify-"));
  for (const f of ["index.html", "app.js", "exceptions.js", "data"]) cpSync(join(ROOT, f), join(work, f), { recursive: true });
  const port = Number(process.env.WATER_VERIFY_PORT || 8876);
  const srv = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", work], { stdio: "ignore" });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 40; i++) { try { if ((await fetch(base + "/index.html")).ok) break; } catch {} await new Promise((r) => setTimeout(r, 150)); }
  const L = RAW.water.split("\r\n"), J = (ls) => ls.join("\r\n");
  const C = [
    ["V-GAP T1 rows removed between 09-27T18:00 and 09-30T12:00 (66 h outage)",
      "the line breaks at the gap (2 'M' commands) or the gap is shaded",
      J(L.filter((l) => !(l.startsWith("T1,") && l.split(",")[2] > "2026-09-27T18:00" && l.split(",")[2] < "2026-09-30T12:00")))],
    ["V-M3 T4 stops after 09-30T00:00", "T4 not counted OK; heading not a plain '44.5%'",
      J(L.filter((l) => !(l.startsWith("T4,") && l.split(",")[2] > "2026-09-30T00:00")))],
    ["V-W15 T8 placed in unknown pasture P9", "heading 'T8 P9 ...', never 'undefined'", RAW.water.replaceAll("\nT8,P8,", "\nT8,P9,")],
    ["V-B01 T6 rows after 09-22T12:00 removed", "(what still renders after the throw)",
      J(L.filter((l) => !(l.startsWith("T6,") && l.split(",")[2] > "2026-09-22T12:00")))],
  ];
  const browser = await chromium.launch();
  try {
    for (const [id, expected, body] of C) {
      const page = await browser.newPage();
      const errs = []; page.on("pageerror", (e) => errs.push(e.message));
      await page.route("**/data/water.csv", (r) => r.fulfill({ status: 200, contentType: "text/csv", body }));
      await page.goto(base + "/index.html", { waitUntil: "networkidle" }); await page.waitForTimeout(250);
      const s = await page.evaluate(() => {
        const q = (x) => [...document.querySelectorAll(x)];
        const d = document.querySelector("#water .mini path")?.getAttribute("d") ?? "";
        const pts = d.split(/(?=[ML])/).filter(Boolean).map((p) => p.slice(1).split(",").map(Number));
        let wide = 0; for (let i = 1; i < pts.length; i++) wide = Math.max(wide, pts[i][0] - pts[i - 1][0]);
        return { tile: q("#tiles .tile").map((t) => t.innerText.replace(/\s+/g, " ")).find((t) => /water/i.test(t)),
          heads: q("#water .mini h4").map((h) => h.innerText.replace(/\s+/g, " ").trim()),
          firstPathM: (d.match(/M/g) || []).length, firstPathWidestStepPx: +wide.toFixed(1),
          excRows: q("#exceptions tr").length - 1, charts: ["#grazing svg", "#gain svg", "#budgetChart svg"].map((x) => !!document.querySelector(x)) };
      });
      show(id, expected, `errors=${JSON.stringify(errs)} ${JSON.stringify(s)}`);
      await page.close();
    }
  } finally { await browser.close(); srv.kill(); rmSync(work, { recursive: true, force: true }); }
}
