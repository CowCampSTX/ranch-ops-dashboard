// Second skeptic pass, browser half: the budget tile, chart, table, tooltip and rules table under modified data.
// Run: node docs/audit/diagnostics/healthbudget.skeptic.browser.mjs [scratchDir]
// Copies the repo into scratchDir/<case>/ (never touches the repo), serves scratchDir with python http.server,
// and loads each case in headless Chromium. Expected values are worked out by hand in the comments.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { mkdtempSync, mkdirSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("../../../", import.meta.url));
const OUT = process.argv[2] ?? mkdtempSync(join(tmpdir(), "hb-skeptic-"));
const PORT = 8000 + Math.floor(Math.random() * 900) + 100;
const BUDGET = readFileSync(join(REPO, "data/budget.csv"), "utf8");
const setW = (perMonth) => BUDGET.replace(/(20\d\d-\d\d,Water and fencing,1200,)\d+/g, `$1${perMonth}`);
const plan = { "Feed and mineral": 6200, Fuel: 2400, Repairs: 1800, "Vet and health": 1500, Labor: 9000, "Water and fencing": 1200 };

const CASES = [
  // id, description, edits {file: fn(text)}, options
  ["S0", "committed data (control): tile +1.0%, $89,303 of $88,400", {}],
  ["S1", "+ Hay 0/500", { "data/budget.csv": (t) => t.trim() + "\r\n2026-09,Hay,0,500\r\n" }],
  ["S2", "+ Hay 0/0", { "data/budget.csv": (t) => t.trim() + "\r\n2026-09,Hay,0,0\r\n" }],
  ["S3", "+ Hay blank budget, 500", { "data/budget.csv": (t) => t.trim() + "\r\n2026-09,Hay,,500\r\n" }],
  ["S4", "every actual = budget", { "data/budget.csv": (t) => t.replace(/^(20\d\d-\d\d,[^,]+,(\d+)),\d+/gm, "$1,$2") }],
  ["S5", "header-only budget.csv", { "data/budget.csv": () => "month,category,budget,actual\r\n" }],
  ["S6", "RULES.budgetWarn 0.07", { "exceptions.js": (t) => t.replace("budgetWarn: 0.05", "budgetWarn: 0.07") }],
  ["S7", "+ Oct/Nov plan rows actual 0", { "data/budget.csv": (t) => t.trim() + "\r\n" + ["2026-10", "2026-11"].flatMap((m) => Object.entries(plan).map(([c, b]) => `${m},${c},${b},0`)).join("\r\n") + "\r\n" }],
  ["S8", "Sep Fuel actual blank", { "data/budget.csv": (t) => t.replace("2026-09,Fuel,2400,3000", "2026-09,Fuel,2400,") }],
  ["S8b", "Jun Fuel actual blank", { "data/budget.csv": (t) => t.replace("2026-06,Fuel,2400,2592", "2026-06,Fuel,2400,") }],
  ["S9a", "Water and fencing 20% under (960/mo)", { "data/budget.csv": () => setW(960) }],
  ["S9b", "Water and fencing 25% under (900/mo)", { "data/budget.csv": () => setW(900) }],
  ["S9c", "Water and fencing 27% under (876/mo)", { "data/budget.csv": () => setW(876) }],
  ["S9d", "Water and fencing 30% under (840/mo)", { "data/budget.csv": () => setW(840) }],
  ["S9e", "Water and fencing 40% under (720/mo)", { "data/budget.csv": () => setW(720) }],
  ["S10", "+ Repairs (300)", { "data/budget.csv": (t) => t.trim() + "\r\n2026-09,Repairs,0,(300)\r\n" }],
  ["S11", "committed data, browser locale de-DE", {}, { locale: "de-DE" }],
  ["S12", "committed data, browser locale en-IN", {}, { locale: "en-IN" }],
];

for (const [id, , edits] of CASES) {
  const dir = join(OUT, id);
  mkdirSync(dir, { recursive: true });
  for (const f of ["index.html", "app.js", "exceptions.js"]) cpSync(join(REPO, f), join(dir, f));
  cpSync(join(REPO, "data"), join(dir, "data"), { recursive: true });
  for (const [f, fn] of Object.entries(edits)) writeFileSync(join(dir, f), fn(readFileSync(join(dir, f), "utf8")));
}
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", OUT], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1200));
console.log(`serving ${OUT} on ${PORT}`);

const browser = await chromium.launch();
try {
  for (const [id, desc, , opts = {}] of CASES) {
    const ctx = await browser.newContext({ locale: opts.locale ?? "en-US", timezoneId: "UTC" });
    const page = await ctx.newPage();
    const errs = [];
    page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
    page.on("pageerror", (e) => errs.push("PAGEERROR " + e.message));
    await page.goto(`http://127.0.0.1:${PORT}/${id}/index.html`);
    await page.waitForFunction(() => document.querySelector("#rules tr:nth-child(2)"), null, { timeout: 8000 }).catch(() => {});
    const r = await page.evaluate(() => {
      const tile = [...document.querySelectorAll("#tiles .tile")].map((t) => t.innerText.replace(/\s+/g, " ").trim());
      const rep = [...document.querySelectorAll("#exceptions tr")].slice(1).map((t) => t.innerText.replace(/\s+/g, " ").trim()).filter((s) => /Budget/.test(s));
      const svg = document.querySelector("#budgetChart svg");
      const nan = svg ? [...svg.querySelectorAll("*")].flatMap((el) => [...el.attributes].filter((a) => /NaN|Infinity/.test(a.value))).length : -1;
      const labels = svg ? [...svg.querySelectorAll("text.lbl")].map((t) => t.textContent) : [];
      // overlap check for every row: category label (anchor end at m.l-10) vs value label of the same row
      const lbl = svg ? [...svg.querySelectorAll("text.lbl")] : [];
      const overlaps = [];
      for (let i = 0; i + 1 < lbl.length; i += 2) {
        const a = lbl[i].getBBox(), b = lbl[i + 1].getBBox();
        if (a.x < b.x + b.width && b.x < a.x + a.width && Math.abs(a.y - b.y) < a.height) overlaps.push(`${lbl[i].textContent}[${a.x.toFixed(0)}-${(a.x + a.width).toFixed(0)}] vs ${lbl[i + 1].textContent}[${b.x.toFixed(0)}-${(b.x + b.width).toFixed(0)}]`);
      }
      const table = [...document.querySelectorAll("#budgetTable tr")].map((t) => t.innerText.replace(/\s+/g, " ").trim());
      const rules = [...document.querySelectorAll("#rules tr")].map((t) => t.innerText.replace(/\s+/g, " ").trim()).filter((s) => /^Budget/.test(s));
      const asof = document.querySelector("#asof")?.textContent;
      return { tile: tile.filter((t) => /SPEND|Spend|HEAD|Head/i.test(t)), rep, nan, labels, overlaps, table, rules, asof };
    });
    // hover the last bar for its tooltip text
    let tipText = "";
    const bars = await page.$$("#budgetChart svg rect");
    if (bars.length) {
      const bb = await bars[bars.length - 1].boundingBox();
      if (bb && Number.isFinite(bb.x)) { await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); tipText = await page.$eval("#tip", (t) => t.innerText.replace(/\s+/g, " ")); }
    }
    console.log(`\n${id}  ${desc}`);
    console.log(`  tiles: ${JSON.stringify(r.tile)}`);
    console.log(`  budget report rows: ${JSON.stringify(r.rep)}`);
    console.log(`  chart NaN/Infinity attrs: ${r.nan}; labels: ${JSON.stringify(r.labels)}`);
    console.log(`  label overlaps: ${JSON.stringify(r.overlaps)}`);
    console.log(`  table: ${JSON.stringify(r.table)}`);
    if (tipText) console.log(`  last-bar tooltip: ${tipText}`);
    if (id === "S6" || id === "S0") console.log(`  rules: ${JSON.stringify(r.rules)}`);
    if (id.startsWith("S1") && opts.locale) console.log(`  asof line: ${r.asof}`);
    console.log(`  console errors: ${errs.length}${errs.length ? " e.g. " + JSON.stringify(errs[0]) : ""}`);
    await ctx.close();
  }
} finally {
  await browser.close();
  server.kill();
}
