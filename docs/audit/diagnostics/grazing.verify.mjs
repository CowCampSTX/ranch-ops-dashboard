// Skeptic pass on the grazing audit: reproductions of grazing defects that grazing.repro.mjs does not cover.
// Run from anywhere:   node docs/audit/diagnostics/grazing.verify.mjs
// Changes no repo file. Serves the repo read-only on a free port and swaps CSVs per case with request interception.
// Part 1 runs the real exceptions.js in child processes with different TZ values; Part 2 loads the real page in
// headless Chromium (skipped with a note if Playwright cannot be imported).
import { readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

const ROOT_DIR = fileURLToPath(new URL("../../../", import.meta.url));
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(`${ROOT_DIR}data/${f}.csv`, "utf8")]));
const rep = (t, a, b) => { if (!t.includes(a)) throw new Error("pattern not found: " + a); return t.replace(a, b); };
const addRow = (t, row) => t.trimEnd() + "\r\n" + row + "\r\n";
const shift = (t, n) => t.replace(/(\d{4})-(\d{2})-(\d{2})/g, (m) => { const d = new Date(m + "T00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); });
const mdy = (t) => t.replace(/(\d{4})-(\d{2})-(\d{2})(?!T)/g, (m, y, mo, d) => `${+mo}/${+d}/${y}`);   // what US-locale Excel writes back

// ------------------------------------------------------------------ Part 1: grazing verdict vs viewer timezone
// Yearlings in Sand Hills (21-day plan), as of 2026-09-30. Worked by hand:
//   in 9/11/2026 -> due Oct 2 -> "Planned move in 2 days" (warning)   in 9/9/2026 -> due Sep 30 -> "Planned move in 0 days"
//   in 9/8/2026  -> due Sep 29 -> "Day 22 ... (1 day over)"            in 9/6/2026 (committed) -> "Day 24 ... (3 days over)"
console.log("=== Part 1: exceptions.js with US-format (M/D/YYYY) in_date, by viewer timezone ===\n");
const child = `
  const X = await import(${JSON.stringify(ROOT_DIR + "exceptions.js")});
  const raw = JSON.parse(process.env.RAW);
  for (const d of ["9/11/2026", "9/9/2026", "9/8/2026", "9/6/2026"]) {
    const data = Object.fromEntries(Object.entries(raw).map(([f, t]) => [f, X.parseCSV(f === "moves" ? t.replace("Yearlings,P3,2026-09-06,", "Yearlings,P3," + d + ",") : t)]));
    const g = X.findExceptions(data).filter((e) => e.area === "Grazing");
    console.log("  in " + d.padEnd(10) + " -> " + (g.length ? g.map((e) => "[" + e.severity + "] " + e.problem).join(" | ") : "(no grazing row)"));
  }`;
for (const tz of ["UTC", "America/Denver", "America/Chicago", "Australia/Brisbane"]) {
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", child], { env: { ...process.env, TZ: tz, RAW: JSON.stringify(RAW) }, encoding: "utf8" });
  console.log(`TZ=${tz}\n${r.stdout}${r.stderr ? "  stderr: " + r.stderr.slice(0, 200) : ""}`);
}

// ------------------------------------------------------------------ Part 2: the page
let chromium = null;
try { ({ chromium } = await import(process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs")); }
catch (e) { console.log("Part 2 skipped: Playwright not importable (" + e.message + ")"); process.exit(0); }
const port = await new Promise((res) => { const s = createServer().listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
const srv = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", ROOT_DIR], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 800));
const CASES = [
  ["V-B0", "control: committed data", {}, "UTC"],
  ["V-B1", "season day one: every in_date 2026-06-01 and as_of 2026-06-01T18:00", {
    moves: () => "group,pasture_id,in_date,out_date\r\nCows,P1,2026-06-01,\r\nHeifers,P8,2026-06-01,\r\nYearlings,P3,2026-06-01,\r\n",
    meta: () => "as_of\r\n2026-06-01T18:00\r\n" }, "UTC"],
  ["V-B2", "moves.csv re-saved as M/D/YYYY, viewer in America/Denver", { moves: mdy }, "America/Denver"],
  ["V-B3", "moves.csv as M/D/YYYY with the season shifted +20 days (as_of 2026-10-20)", {
    moves: (t) => mdy(shift(t, 20)), water: (t) => shift(t, 20), health: (t) => shift(t, 20), weights: (t) => shift(t, 20), meta: (t) => shift(t, 20) }, "UTC"],
  ["V-B4", "closed move with out_date before in_date (Cows,P2,2026-07-13,2026-07-03)", { moves: (t) => rep(t, "Cows,P2,2026-07-13,2026-07-31", "Cows,P2,2026-07-13,2026-07-03") }, "UTC"],
];
const browser = await chromium.launch();
try {
  for (const [id, title, edits, tz] of CASES) {
    const ctx = await browser.newContext({ timezoneId: tz, viewport: { width: 1280, height: 2400 } });
    const page = await ctx.newPage();
    const errs = []; let nConsoleErr = 0;
    page.on("pageerror", (e) => errs.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") nConsoleErr++; });
    await page.route("**/data/*.csv", (route) => {
      const f = new URL(route.request().url()).pathname.split("/").pop().replace(".csv", "");
      return route.fulfill({ status: 200, contentType: "text/csv", body: edits[f] ? edits[f](RAW[f]) : RAW[f] });
    });
    await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "networkidle" });
    const info = await page.evaluate(() => {
      const g = document.querySelector("#grazing svg"), r1 = (v) => Math.round(+v * 10) / 10;
      const texts = g ? [...g.querySelectorAll("text")] : [];
      const bars = g ? [...g.querySelectorAll("rect")].filter((r) => /s1|bar/.test(r.getAttribute("fill"))) : [];
      return {
        grazingRows: [...document.querySelectorAll("#exceptions tr")].map((tr) => tr.innerText.replace(/\s+/g, " ")).filter((t) => / Grazing /.test(t)),
        months: texts.filter((t) => /^[A-Z][a-z]{2}$/.test(t.textContent)).map((t) => `${t.textContent}@${r1(t.getAttribute("x"))}`).join(" "),
        overLabels: texts.filter((t) => /^\+/.test(t.textContent)).map((t) => t.textContent),
        bars: bars.length, barsFiniteX: bars.filter((r) => isFinite(+r.getAttribute("x"))).length,
        minBarX: bars.length ? r1(Math.min(...bars.map((r) => +r.getAttribute("x")).filter(isFinite))) : null,
      };
    });
    const tips = [];
    for (const h of await page.$$("#grazing svg rect[fill=transparent]")) {
      await h.hover({ force: true }).catch(() => {});
      const t = await page.$eval("#tip", (e) => e.innerText.replace(/\n/g, " / "));
      if (/to now|-\d+ days|Cows in Windmill/.test(t) && !tips.includes(t)) tips.push(t);
    }
    console.log(`CASE ${id}  ${title}  [tz ${tz}]\n  pageErrors=${JSON.stringify(errs)} consoleErrors=${nConsoleErr}\n  ${JSON.stringify(info)}\n  hovers=${JSON.stringify(tips)}\n`);
    await ctx.close();
  }
} finally { await browser.close(); srv.kill(); }
