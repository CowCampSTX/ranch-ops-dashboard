// Browser-level CSV reproductions (problems that only show in app.js, i.e. what the manager actually sees).
// Run from the repo root:  node docs/audit/diagnostics/csv.browser.mjs [port] [workdir]
//   port    defaults to 8821
//   workdir defaults to a fresh folder under the OS temp dir; the repo itself is never modified.
// Needs Playwright (default path /opt/node22/lib/node_modules/playwright/index.mjs, or set PLAYWRIGHT_PATH) and python3.
// For each scenario it copies index.html, app.js, exceptions.js and data/ into <workdir>/<scenario>/, changes one
// data file, loads the page in headless Chromium and prints CASE / expected / actual / MATCH|MISMATCH.

import { readFileSync, writeFileSync, mkdirSync, cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const PORT = Number(process.argv[2] || 8821);
const WORK = process.argv[3] || mkdtempSync(join(tmpdir(), "csv-browser-"));
const PW = process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs";
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(join(ROOT, "data", `${f}.csv`), "utf8")]));

// [id, title, data changes, expected, check(state) -> boolean]
const S = [
  ["B-00", "committed data (control)", {},
    "10 exception rows, 5 tiles, 8 water charts, budget and rules tables drawn, no page error",
    (s) => !s.errors.length && s.excRows.length === 10 && s.tiles.length === 5 && s.waterBoxes === 8 && s.rulesRows === 12],
  ["B-01", "moves.csv ends with an Excel blank row (,,,)", { moves: (t) => t + ",,,\r\n" },
    "the 10 exception rows still shown (the blank row ignored), or a visible error message naming moves.csv",
    (s) => s.excRows.length === 10 || /moves\.csv/i.test(s.bodyText)],
  ["B-02", "an animal with one weigh-in (bought mid-season) in weights.csv", { weights: (t) => t + "Y151,Yearlings,2026-09-15,700\r\n" },
    "the 10 exception rows still shown",
    (s) => s.excRows.length === 10],
  ["B-03", "groups named Steers instead of Yearlings (real ranch naming)", {
      groups: (t) => t.replaceAll("Yearlings", "Steers"), weights: (t) => t.replaceAll("Yearlings", "Steers"),
      moves: (t) => t.replaceAll("Yearlings", "Steers"), health: (t) => t.replaceAll("Yearlings", "Steers") },
    "the 10 exception rows shown (findExceptions itself succeeds on this data)",
    (s) => s.excRows.length === 10],
  ["B-04", "tank T6 silent for 10 days (no rows after Sep 20)", { water: (t) => t.split("\r\n").filter((l) => !(l.startsWith("T6,") && l.slice(6, 16) > "2026-09-20")).join("\r\n") },
    "T6 flagged as silent and all charts, the budget table and the rules table drawn",
    (s) => s.excRows.some((r) => /Tank T6/.test(r)) && s.waterBoxes === 8 && s.grazingSvg && s.gainSvg && s.budgetRows === 7 && s.rulesRows === 12],
  ["B-05", "water.csv exported with a header and no rows", { water: (t) => t.split("\r\n")[0] + "\r\n" },
    "a water alert or a visible 'no tank readings' message; never 'Water tanks OK 0 of 0' with Water (0)",
    (s) => !/WATER TANKS OK \/ 0 of 0/i.test(s.tiles.join(" ")) || s.chips.includes("Water (0)") === false],
  ["B-06", "T2's latest reading is the sensor text ERR", { water: (t) => t.replace("T2,P2,2026-09-30T18:00,11.8", "T2,P2,2026-09-30T18:00,ERR") },
    "T2 counted as needing a look (3 of 8 need a look) and no 'ERR%' label",
    (s) => /3 need a look/.test(s.tiles.join(" ")) && !s.waterHeads.some((h) => /ERR%/.test(h))],
  ["B-07", "September Fuel actual not entered yet (blank)", { budget: (t) => t.replace("2026-09,Fuel,2400,3000", "2026-09,Fuel,2400,") },
    "a plausible 'Spend vs budget' tile (a few percent) and the Fuel row still flagged or marked missing",
    (s) => /SPEND VS BUDGET \/ [+−-]\d{1,2}\.\d%/.test(s.tiles.join(" ")) && s.excRows.some((r) => /Fuel/.test(r))],
  ["B-08", "Heifers head count left blank in groups.csv", { groups: (t) => t.replace("Heifers,first-calf heifers,45,", "Heifers,first-calf heifers,,") },
    "'Head on grass' 330 (180 + 150) with heifers marked unknown, or a load error; never 180150",
    (s) => !/180150/.test(s.tiles.join(" "))],
  ["B-09", "pasture name with a quoted comma (\"Sand Hills, east\")", { pastures: (t) => t.replace("P3,Sand Hills,", 'P3,"Sand Hills, east",') },
    "header '4,300 acres in 8 pastures' and the Yearlings over-plan row still shown",
    (s) => /4,300 acres/.test(s.asof) && s.excRows.some((r) => /Yearlings in Sand Hills/.test(r))],
];

for (const [id, , mods] of S) {
  const dir = join(WORK, id);
  mkdirSync(join(dir, "data"), { recursive: true });
  for (const f of ["index.html", "app.js", "exceptions.js"]) cpSync(join(ROOT, f), join(dir, f));
  for (const f of FILES) writeFileSync(join(dir, "data", `${f}.csv`), mods[f] ? mods[f](RAW[f]) : RAW[f]);
}

let server, browser;
try {
  server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", WORK], { stdio: "ignore" });
  for (let i = 0; i < 50; i++) {
    try { await fetch(`http://localhost:${PORT}/`); break; } catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  const { chromium } = await import(PW);
  browser = await chromium.launch();
  let match = 0;
  for (const [id, title, , expected, check] of S) {
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(`http://localhost:${PORT}/${id}/index.html`);
      await page.waitForTimeout(700);
      const s = await page.evaluate(() => ({
        asof: document.getElementById("asof").textContent,
        tiles: [...document.querySelectorAll("#tiles .tile")].map((t) => t.innerText.replace(/\n+/g, " / ")),
        chips: document.getElementById("chips").innerText.replace(/\n+/g, " "),
        excRows: [...document.querySelectorAll("#exceptions tr")].slice(1).map((tr) => tr.innerText.replace(/\s+/g, " ").trim()),
        waterBoxes: document.querySelectorAll("#water .mini").length,
        waterHeads: [...document.querySelectorAll("#water h4")].map((h) => h.textContent),
        grazingSvg: !!document.querySelector("#grazing svg"),
        gainSvg: !!document.querySelector("#gain svg"),
        budgetRows: document.querySelectorAll("#budgetTable tr").length,
        rulesRows: document.querySelectorAll("#rules tr").length,
        bodyText: document.body.innerText,
      }));
      s.errors = errors;
      await page.close();
      const ok = !!check(s);
      if (ok) match++;
      console.log(`CASE ${id}  ${title}`);
      console.log(`  expected: ${expected}`);
      console.log(`  actual:   page errors ${JSON.stringify(errors)}; header "${s.asof}"; tiles ${JSON.stringify(s.tiles)}; chips "${s.chips}"; ` +
        `${s.excRows.length} exception rows; ${s.waterBoxes} water charts ${JSON.stringify(s.waterHeads)}; grazing chart ${s.grazingSvg}; gain chart ${s.gainSvg}; ` +
        `budget table rows ${s.budgetRows}; rules rows ${s.rulesRows}`);
      console.log(`  ${ok ? "MATCH" : "MISMATCH"}`);
    } catch (err) {
      console.log(`CASE ${id}  ${title}\n  expected: ${expected}\n  actual:   harness error ${err.message}\n  MISMATCH`);
    }
  }
  console.log(`\n${S.length} cases: ${match} MATCH, ${S.length - match} MISMATCH (workdir ${WORK})`);
} catch (err) {
  console.log(`harness error: ${err.message}`);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) server.kill();
}
