// Health/budget defects the first auditor did not report, reproduced by the second skeptic.
// Run: node docs/audit/diagnostics/healthbudget.skeptic.missed.mjs
// Copies the repo to a temp dir for the browser case; modifies no repo file. Hand-worked expectations in comments.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { mkdtempSync, mkdirSync, cpSync, appendFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = fileURLToPath(new URL("../../../", import.meta.url));
const { parseCSV, findExceptions, budgetStatus } = await import(new URL("exceptions.js", new URL("../../../", import.meta.url)).href);
const EMPTY = { pastures: [], groups: [], moves: [], weights: [], water: [], health: [], budget: [], meta: [{ as_of: "2026-09-30T18:00" }] };
const fmt = (a) => (a.length ? a.map((e) => `${e.severity} | ${e.subject} | ${e.problem}`).join("  ||  ") : "(none)");

// M2. Numeric next_due. Excel serial 46327 = 1899-12-30 + 46327 days = 2026-11-01 (32 days after Sep 30): expect no alert.
// 20261101 (compact yyyymmdd) is the same day. parseCSV turns both into Numbers; new Date(n) reads them as epoch ms (1970).
for (const nd of ["2026-11-01", "46327", "20261101"]) {
  const h = parseCSV(`group,task,last_done,next_due,status\nYearlings,Deworm,2026-06-02,${nd},open`);
  console.log(`M2 next_due=${nd} (typeof ${typeof h[0].next_due}): ${fmt(findExceptions({ ...EMPTY, health: h }))}`);
}

// M3. Large under-spend never surfaces. Vet and health 3,000 of 6,000 = -50%; Labor 18,000 of 36,000 = -50%.
const b = parseCSV("month,category,budget,actual\n2026-09,Vet and health,6000,3000\n2026-09,Labor,36000,18000");
console.log(`M3 pct=${JSON.stringify(budgetStatus(b).map((x) => [x.category, x.pct]))}; alerts: ${fmt(findExceptions({ ...EMPTY, budget: b }))}`);

// M1. One large overrun (Hay 1,500 vs 500 = +200%) sets lim = 2, so the fixed ticks -20..+20% are 0.1/4*366 = 9.15 px apart.
const dir = mkdtempSync(join(tmpdir(), "hb-missed-"));
mkdirSync(join(dir, "site"));
for (const f of ["index.html", "app.js", "exceptions.js"]) cpSync(join(REPO, f), join(dir, "site", f));
cpSync(join(REPO, "data"), join(dir, "site", "data"), { recursive: true });
mkdirSync(join(dir, "ctrl"));
for (const f of ["index.html", "app.js", "exceptions.js"]) cpSync(join(REPO, f), join(dir, "ctrl", f));
cpSync(join(REPO, "data"), join(dir, "ctrl", "data"), { recursive: true });
appendFileSync(join(dir, "site", "data", "budget.csv"), "2026-09,Hay,500,1500\r\n");
const PORT = 8600 + Math.floor(Math.random() * 300);
const srv = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", dir], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 1200));
const br = await chromium.launch();
try {
  const p = await (await br.newContext({ locale: "en-US", timezoneId: "UTC" })).newPage();
  for (const id of ["ctrl", "site"]) {
    await p.goto(`http://127.0.0.1:${PORT}/${id}/index.html`);
    await p.waitForSelector("#budgetChart svg rect");
    const r = await p.evaluate(() => {
      const svg = document.querySelector("#budgetChart svg");
      const ticks = [...svg.querySelectorAll("text:not(.lbl)")].map((t) => { const bb = t.getBBox(); return [t.textContent, +bb.x.toFixed(1), +(bb.x + bb.width).toFixed(1)]; });
      const overlapping = ticks.slice(1).filter((t, i) => t[1] < ticks[i][2]).length;
      const labels = [...svg.querySelectorAll("text.lbl")].map((t) => t.textContent);
      const widths = [...svg.querySelectorAll("rect")].map((r) => +(+r.getAttribute("width")).toFixed(1));
      return { ticks, overlapping, bars: labels.filter((_, i) => i % 2 === 0).map((c, i) => `${c}=${widths[i]}px`) };
    });
    console.log(`M1 ${id === "ctrl" ? "committed (control)" : "committed + Hay 500/1500"}: tick boxes ${JSON.stringify(r.ticks)}; overlapping tick pairs=${r.overlapping}; bar widths ${r.bars.join(", ")}`);
  }
} finally {
  await br.close();
  srv.kill();
}
