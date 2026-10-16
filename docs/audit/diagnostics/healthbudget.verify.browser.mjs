// Skeptic's browser re-check of the budget tile/chart/table findings, plus missed-defect checks.
// Run: node docs/audit/diagnostics/healthbudget.verify.browser.mjs   (serves a throwaway copy; modifies no repo files)
// env PORT (default 8891), WORK (default: a fresh dir under the OS temp dir)
import { readFileSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const WORK = process.env.WORK || mkdtempSync(join(tmpdir(), "hb-verify-"));
for (const f of ["index.html", "app.js", "exceptions.js", "data"]) cpSync(join(ROOT, f), join(WORK, f), { recursive: true });
const PORT = +(process.env.PORT || 8891);
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", WORK], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1000));
const { chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs");
const browser = await chromium.launch();
const BUD = readFileSync(join(ROOT, "data/budget.csv"), "utf8").replace(/\r/g, "").trim();   // committed CSVs are CRLF
const EXJS = readFileSync(join(ROOT, "exceptions.js"), "utf8");

async function run(id, desc, { budget, exjs, hoverCategory } = {}) {
  const ctx = await browser.newContext({ locale: "en-US", timezoneId: "UTC", viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  page.on("pageerror", (e) => errs.push("pageerror " + e.message));
  if (budget != null) await page.route("**/data/budget.csv", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: budget }));
  if (exjs != null) await page.route("**/exceptions.js", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: exjs }));
  await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "load" });
  await page.waitForTimeout(500);
  const s = await page.evaluate(() => {
    const tile = [...document.querySelectorAll("#tiles .tile")].map((t) => t.innerText.replace(/\s+/g, " ")).find((t) => /SPEND|Spend/.test(t));
    const ch = document.querySelector("#budgetChart svg");
    const labels = ch ? [...ch.querySelectorAll("text.lbl")].map((t) => t.textContent) : [];
    const bars = ch ? [...ch.querySelectorAll("rect")].map((r) => `${r.getAttribute("x")}/${r.getAttribute("width")}/${r.getAttribute("fill")}`) : [];
    const nan = ch ? [...ch.querySelectorAll("*")].reduce((n, el) => n + [...el.attributes].filter((a) => /NaN|Infinity/.test(a.value)).length, 0) : 0;
    const table = [...document.querySelectorAll("#budgetTable tr")].map((r) => r.innerText.replace(/\s+/g, " "));
    const budgetRows = [...document.querySelectorAll("#exceptions tr")].map((r) => r.innerText.replace(/\s+/g, " ")).filter((t) => /Budget/.test(t) && !/^Severity/i.test(t));
    const rulesRows = [...document.querySelectorAll("#rules tr")].map((r) => r.innerText.replace(/\s+/g, " ")).filter((t) => /Budget/.test(t));
    // overlap test for the bottom-most category label and its value label
    let overlap = null;
    if (ch) {
      const texts = [...ch.querySelectorAll("text.lbl")];
      if (texts.length >= 2) {
        const cat = texts[texts.length - 2].getBBox(), val = texts[texts.length - 1].getBBox();
        overlap = { cat: [+cat.x.toFixed(1), +(cat.x + cat.width).toFixed(1)], val: [+val.x.toFixed(1), +(val.x + val.width).toFixed(1)], intersects: val.x < cat.x + cat.width && cat.x < val.x + val.width };
      }
    }
    return { tile, labels, bars, nan, table, budgetRows, rulesRows, overlap };
  });
  let tipText = null;
  if (hoverCategory) {
    const idx = s.labels.filter((_, i) => i % 2 === 0).indexOf(hoverCategory);
    const rect = page.locator("#budgetChart svg rect").nth(idx);
    await rect.hover({ force: true });
    await page.waitForTimeout(150);
    tipText = (await page.locator("#tip").innerText()).replace(/\s+/g, " ");
  }
  console.log(`\n${id}  ${desc}`);
  console.log(`  tile: ${s.tile}`);
  console.log(`  budget alert rows: ${JSON.stringify(s.budgetRows)}`);
  console.log(`  chart labels: ${JSON.stringify(s.labels)}`);
  console.log(`  bars x/width/fill: ${JSON.stringify(s.bars)}`);
  console.log(`  NaN/Infinity attributes: ${s.nan}; console/page errors: ${errs.length}${errs.length ? " first=" + JSON.stringify(errs[0]) : ""}`);
  console.log(`  table: ${JSON.stringify(s.table)}`);
  if (s.overlap) console.log(`  last category label x-range ${JSON.stringify(s.overlap.cat)} vs its value label ${JSON.stringify(s.overlap.val)} intersects=${s.overlap.intersects}`);
  if (exjs) console.log(`  rules rows: ${JSON.stringify(s.rulesRows)}`);
  if (tipText) console.log(`  tooltip on ${hoverCategory}: ${tipText}`);
  await ctx.close();
}

try {
  await run("V-00", "committed data (control)", { hoverCategory: "Water and fencing" });
  await run("V-03", "committed + '2026-09,Hay,,500' (blank budget cell)", { budget: BUD + "\n2026-09,Hay,,500\n" });
  await run("V-08", "committed, Sep Fuel actual blank", { budget: BUD.replace("2026-09,Fuel,2400,3000", "2026-09,Fuel,2400,") + "\n" });
  await run("V-10", "committed + '2026-09,Repairs,0,(300)'", { budget: BUD + "\n2026-09,Repairs,0,(300)\n" });
  await run("V-01", "committed + '2026-09,Hay,0,500'", { budget: BUD + "\n2026-09,Hay,0,500\n" });
  await run("V-02", "committed + '2026-09,Hay,0,0'", { budget: BUD + "\n2026-09,Hay,0,0\n" });
  const plan = { "Feed and mineral": 6200, Fuel: 2400, Repairs: 1800, "Vet and health": 1500, Labor: 9000, "Water and fencing": 1200 };
  const fut = ["2026-10", "2026-11"].flatMap((m) => Object.entries(plan).map(([c, b]) => `${m},${c},${b},0`)).join("\n");
  await run("V-07", "committed + Oct/Nov plan rows, actual 0", { budget: BUD + "\n" + fut + "\n" });
  const onBudget = BUD.split("\n").map((l, i) => { if (!i) return l; const p = l.split(","); p[3] = p[2]; return p.join(","); }).join("\n");
  await run("V-04", "every actual = its budget", { budget: onBudget + "\n", hoverCategory: "Water and fencing" });
  await run("V-05", "header-only budget.csv", { budget: "month,category,budget,actual\n" });
  const w40 = BUD.split("\n").map((l) => (/Water and fencing/.test(l) ? l.replace(/,\d+$/, ",720") : l)).join("\n");
  await run("V-09", "Water and fencing actual 720 every month (-40%)", { budget: w40 + "\n" });
  const w26 = BUD.split("\n").map((l) => (/Water and fencing/.test(l) ? l.replace(/,\d+$/, ",888") : l)).join("\n");
  await run("V-09b", "Water and fencing actual 888 every month (-26%)", { budget: w26 + "\n" });
  const w20 = BUD.split("\n").map((l) => (/Water and fencing/.test(l) ? l.replace(/,\d+$/, ",960") : l)).join("\n");
  await run("V-09c", "Water and fencing actual 960 every month (-20%)", { budget: w20 + "\n" });
  await run("V-06", "exceptions.js with budgetWarn 0.07", { exjs: EXJS.replace("budgetWarn: 0.05", "budgetWarn: 0.07") });
  // MISSED M1: a planned credit line (negative budget): -2,000 planned, -500 received -> spend 1,500 higher than plan.
  await run("M1", "committed + '2026-09,Cost-share credit,-2000,-500'", { budget: BUD + "\n2026-09,Cost-share credit,-2000,-500\n", hoverCategory: "Cost-share credit" });
  await run("M1b", "committed + '2026-09,Cost-share credit,-2000,-3000' (credit bigger than plan)", { budget: BUD + "\n2026-09,Cost-share credit,-2000,-3000\n", hoverCategory: "Cost-share credit" });
} finally {
  await browser.close();
  server.kill();
  if (!process.env.WORK) rmSync(WORK, { recursive: true, force: true });
}
