// Skeptic pass on the CSV and input-integrity findings: what the manager actually sees for the cases in csv.verify.mjs
// plus three scope checks on the first audit's findings.
// Run from the repo root:  node docs/audit/diagnostics/csv.verify.browser.mjs [port] [workdir]
//   port defaults to 8957; workdir defaults to a fresh folder under the OS temp dir. The repo itself is never modified.
// Needs Playwright (default /opt/node22/lib/node_modules/playwright/index.mjs, or PLAYWRIGHT_PATH) and python3.

import { readFileSync, writeFileSync, mkdirSync, cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const PORT = Number(process.argv[2] || 8957);
const WORK = process.argv[3] || mkdtempSync(join(tmpdir(), "csv-verify-"));
const PW = process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs";
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(join(ROOT, "data", `${f}.csv`), "utf8")]));
const DEL = "__delete__";
const dblCR = (t) => t.replaceAll("\r\n", "\r\r\n");
const repeatHeader = (t) => { const [h, ...r] = t.trim().split("\r\n"); const m = r.length >> 1; return [h, ...r.slice(0, m), h, ...r.slice(m)].join("\r\n") + "\r\n"; };

// [id, title, mods, expected, check(state)]
const S = [
  ["VB-00", "committed data (control)", {}, "10 rows, tile 'Water tanks OK 5 of 8', no page error",
    (s) => !s.errors.length && s.rows.length === 10 && /5 of 8/.test(s.tiles.join(" "))],
  ["VB-01", "water.csv with doubled-CR line endings", { water: dblCR }, "T2 and T4 critical rows shown; '3 need a look'",
    (s) => s.rows.some((r) => /Tank T2/.test(r) && /Critical/.test(r)) && /3 need a look/.test(s.tiles.join(" "))],
  ["VB-02", "every file with doubled-CR line endings", Object.fromEntries(FILES.map((f) => [f, dblCR])), "10 rows, no page error",
    (s) => !s.errors.length && s.rows.length === 10],
  ["VB-03", "weights.csv = two exports joined with their headers", { weights: repeatHeader }, "10 rows, no page error",
    (s) => !s.errors.length && s.rows.length === 10],
  ["VB-04", "water.csv = two exports joined with their headers", { water: repeatHeader }, "8 water charts, 'of 8' in the tile, rules table drawn",
    (s) => s.water === 8 && /of 8/.test(s.tiles.join(" ")) && s.rules === 12],
  ["VB-05", "budget.csv = two exports joined with their headers", { budget: repeatHeader }, "no NaN in the spend tile or budget table",
    (s) => !/NaN/.test(s.tiles.join(" ") + s.budget.join(" "))],
  ["VB-06", "health.csv missing (server answers 404)", { health: DEL }, "a visible error naming health.csv; not 'Health (0)'",
    (s) => /health\.csv/i.test(s.body)],
  ["VB-07", "pastures.csv in Windows-1252 with 'La Peña' for P3", { pastures: (t) => Buffer.from(t.replace("Sand Hills", "La Peña"), "latin1") },
    "'Yearlings in La Peña' (or an encoding warning)", (s) => s.rows.some((r) => /La Peña/.test(r))],
  // scope checks on the first audit's findings
  ["VB-08", "Yearlings target_adg_lbs blank (finding 10 scope)", { groups: (t) => t.replace("Yearlings,yearling steers,150,2.0", "Yearlings,yearling steers,150,") },
    "exception rows drawn; no page error", (s) => !s.errors.length && s.rows.length > 0],
  ["VB-09", "weights.csv header only: no weigh-ins yet (finding 10 scope)", { weights: (t) => t.split("\r\n")[0] + "\r\n" },
    "exception rows drawn; no page error", (s) => !s.errors.length && s.rows.length > 0],
  ["VB-10", "Cows group renamed '2025', no slow-animal warning involved (finding 7 scope)",
    { groups: (t) => t.replace("Cows,", "2025,"), moves: (t) => t.replaceAll("Cows,", "2025,"), health: (t) => t.replaceAll("Cows,", "2025,") },
    "10 rows; no page error", (s) => !s.errors.length && s.rows.length === 10],
];

for (const [id, , mods] of S) {
  const dir = join(WORK, id);
  mkdirSync(join(dir, "data"), { recursive: true });
  for (const f of ["index.html", "app.js", "exceptions.js"]) cpSync(join(ROOT, f), join(dir, f));
  for (const f of FILES) if (mods[f] !== DEL) writeFileSync(join(dir, "data", `${f}.csv`), mods[f] ? mods[f](RAW[f]) : RAW[f]);
}

let server, browser;
try {
  server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", WORK], { stdio: "ignore" });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://localhost:${PORT}/`); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
  const { chromium } = await import(PW);
  browser = await chromium.launch();
  let match = 0;
  for (const [id, title, , expected, check] of S) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`http://localhost:${PORT}/${id}/index.html`);
    await page.waitForTimeout(800);
    const s = await page.evaluate(() => ({
      tiles: [...document.querySelectorAll("#tiles .tile")].map((t) => t.innerText.replace(/\n+/g, " / ")),
      chips: document.getElementById("chips").innerText.replace(/\n+/g, " "),
      rows: [...document.querySelectorAll("#exceptions tr")].slice(1).map((tr) => tr.innerText.replace(/\s+/g, " ").trim()),
      water: document.querySelectorAll("#water .mini").length,
      heads: [...document.querySelectorAll("#water h4")].map((h) => h.textContent),
      budget: [...document.querySelectorAll("#budgetTable tr")].map((r) => r.innerText.replace(/\s+/g, " ")),
      rules: document.querySelectorAll("#rules tr").length,
      body: document.body.innerText,
    }));
    s.errors = errors;
    await page.close();
    const ok = !!check(s);
    if (ok) match++;
    console.log(`CASE ${id}  ${title}`);
    console.log(`  expected: ${expected}`);
    console.log(`  actual:   page errors ${JSON.stringify(errors)}; tiles ${JSON.stringify(s.tiles)}; chips "${s.chips}"; ${s.rows.length} rows; ` +
      `${s.water} water charts ${JSON.stringify(s.heads)}; budget last row ${JSON.stringify(s.budget.slice(-1))}; rules rows ${s.rules}`);
    if (s.rows.some((r) => /La Pe/.test(r))) console.log(`  row: ${JSON.stringify(s.rows.find((r) => /La Pe/.test(r)))}`);
    console.log(`  ${ok ? "MATCH" : "MISMATCH"}`);
  }
  console.log(`\n${S.length} cases: ${match} MATCH, ${S.length - match} MISMATCH (workdir ${WORK})`);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) server.kill();
}
