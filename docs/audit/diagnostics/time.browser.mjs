// Browser-level time/timezone reproductions (problems that only show in app.js, i.e. what the manager actually sees).
// Run from the repo root:  node docs/audit/diagnostics/time.browser.mjs [port] [workdir]
//   port    defaults to 8831
//   workdir defaults to a fresh folder under the OS temp dir; the repo itself is never modified.
// Needs Playwright (default /opt/node22/lib/node_modules/playwright/index.mjs, or set PLAYWRIGHT_PATH) and python3.
// For each scenario it copies index.html, app.js, exceptions.js and data/ into <workdir>/<scenario>/, changes the
// data, opens the page in headless Chromium with the browser timezone set per scenario, and prints
// CASE / expected / actual / MATCH|MISMATCH. TB-C* cases are controls that should MATCH. Never throws.

import { readFileSync, writeFileSync, mkdirSync, cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const PORT = Number(process.argv[2] || 8831);
const WORK = process.argv[3] || mkdtempSync(join(tmpdir(), "time-browser-"));
const PW = process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs";
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(join(ROOT, "data", `${f}.csv`), "utf8")]));
const TZS = ["UTC", "America/Chicago", "America/Denver", "Pacific/Auckland"];

const CATS = ["Feed and mineral,6200", "Fuel,2400", "Repairs,1800", "Vet and health,1500", "Labor,9000", "Water and fencing,1200"];
const springWater = "tank_id,pasture_id,time,level_pct\r\n" + [["2027-03-13T12:00", 60], ["2027-03-13T18:00", 80], ["2027-03-14T00:00", 70],
  ["2027-03-14T06:00", 60], ["2027-03-14T12:00", 55], ["2027-03-14T18:00", 48]].map(([t, l]) => `T1,P1,${t},${l}`).join("\r\n") + "\r\n";

// Scenario data sets: id -> { file: (text) => text }
const DATA = {
  committed: {},
  asofDate: { meta: () => "as_of\r\n2026-09-30\r\n" },
  t6silent8d: { water: (t) => t.split("\r\n").filter((l) => !(l.startsWith("T6,") && l.slice(6, 22) > "2026-09-22T12:00")).join("\r\n") },
  yearlingsShipped: {
    groups: (t) => t.split("\r\n").filter((l) => !l.startsWith("Yearlings,")).join("\r\n"),
    moves: (t) => t.replace("Yearlings,P3,2026-09-06,", "Yearlings,P3,2026-09-06,2026-09-28"),
    health: (t) => t.replace("Yearlings,Booster vaccine,2026-06-02,2026-09-15,open", "Yearlings,Booster vaccine,2026-06-02,2026-09-15,done"),
  },
  season2027: Object.fromEntries(FILES.map((f) => [f, (t) => t.replaceAll("2026-", "2027-")])),
  spacedTankIds: { water: (t) => t.replaceAll("\r\nT2,", "\r\nW 2,").replaceAll("\r\nT4,", "\r\nW 4,") },
  budgetPlanZero: { budget: (t) => t + ["2026-10", "2026-11"].flatMap((m) => CATS.map((c) => `${m},${c},0`)).join("\r\n") + "\r\n" },
  budgetPlanBlank: { budget: (t) => t + CATS.map((c) => `2026-10,${c},`).join("\r\n") + "\r\n" },
  springLeak: { meta: () => "as_of\r\n2027-03-14T18:00\r\n", water: () => springWater },
  asofDayFirst: { meta: () => "as_of\r\n30/09/2026 18:00\r\n" },
};

function prepare(id) {
  const dir = join(WORK, id);
  mkdirSync(join(dir, "data"), { recursive: true });
  for (const f of ["index.html", "app.js", "exceptions.js"]) cpSync(join(ROOT, f), join(dir, f));
  for (const f of FILES) writeFileSync(join(dir, "data", `${f}.csv`), (DATA[id][f] ?? ((t) => t))(RAW[f]));
}

async function state(page, url) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(600);
  const s = await page.evaluate(() => {
    const txt = (sel) => [...document.querySelectorAll(sel)].map((e) => e.textContent.replace(/\s+/g, " ").trim());
    const gz = document.querySelector("#grazing svg");
    const vb = gz ? gz.viewBox.baseVal : null;
    return {
      asof: document.getElementById("asof")?.textContent ?? "",
      tiles: txt("#tiles .tile").map((t) => t),
      excRows: txt("#exceptions tr").slice(1),
      chips: txt("#chips .chip"),
      waterBoxes: document.querySelectorAll("#water .mini").length,
      waterLabels: [...document.querySelectorAll("#water .mini")].map((m) => [...m.querySelectorAll("svg > text")].slice(-2).map((t) => t.textContent).join("..")),
      monthTicks: gz ? [...gz.querySelectorAll("text")].filter((t) => /^[A-Z][a-z]{2}$/.test(t.textContent)).map((t) => ({ m: t.textContent, x: +(+t.getAttribute("x")).toFixed(1) })) : [],
      grazingW: vb ? vb.width : 0,
      grazingSvg: !!gz, gainSvg: !!document.querySelector("#gain svg"),
      budgetRows: document.querySelectorAll("#budgetTable tr").length, rulesRows: document.querySelectorAll("#rules tr").length,
    };
  });
  return { ...s, errors };
}

// [id, title, dataset, timezones, expected, check(states by tz) -> { actual, ok }]
const sig = (s) => JSON.stringify([s.asof, s.tiles, s.excRows, s.waterLabels, s.monthTicks, s.errors]);
const CASES = [
  ["TB-C1", "committed data renders the same text in UTC, Chicago, Denver and Auckland", "committed", TZS,
    "identical header, tiles, exception rows, water chart date labels and grazing month labels in all four zones; header says September 30, 2026 at 6:00 PM",
    (S) => ({ actual: TZS.map((tz) => `\n      ${tz.padEnd(17)} ${S[tz].asof.slice(-50)} | ${S[tz].excRows.length} rows | water ${S[tz].waterLabels[0]} | ticks ${S[tz].monthTicks.map((t) => t.m).join(",")} | ${S[tz].tiles[3]}`).join(""),
      ok: TZS.every((tz) => sig(S[tz]) === sig(S.UTC)) && /September 30, 2026 at 6:00 PM/.test(S.UTC.asof) })],
  ["TB-01", "as_of written as a date only (2026-09-30): the header shows the previous evening in US zones", "asofDate", TZS,
    "header 'Data as of September 30, 2026' in every zone, matching the water charts' right-hand label 'Sep 30'",
    (S) => ({ actual: TZS.map((tz) => `\n      ${tz.padEnd(17)} header: ${S[tz].asof.replace(/^.*Data as of /, "")} | water chart end label: ${S[tz].waterLabels[0]?.split("..")[1]}`).join(""),
      ok: TZS.every((tz) => /September 30, 2026/.test(S[tz].asof)) })],
  ["TB-02", "a tank silent for more than 7 days (T6 nothing after Sep 22 12:00) stops the rest of the page", "t6silent8d", ["UTC"],
    "T6 flagged as silent, 8 water charts, grazing and gain charts, budget table (7 rows) and rules table (12 rows) all drawn, no page error",
    (S) => { const s = S.UTC; return { actual: `T6 row: ${s.excRows.find((r) => /T6/.test(r)) ?? "none"} | water charts ${s.waterBoxes} | grazing ${s.grazingSvg} | gain ${s.gainSvg} | budget rows ${s.budgetRows} | rules rows ${s.rulesRows} | errors: ${s.errors.join("; ") || "none"}`,
      ok: s.excRows.some((r) => /T6/.test(r)) && s.waterBoxes === 8 && s.grazingSvg && s.gainSvg && s.budgetRows === 7 && s.rulesRows === 12 && !s.errors.length }; }],
  ["TB-03", "yearlings shipped Sep 28 (Yearlings row removed from groups.csv, current move closed): the exception table never draws", "yearlingsShipped", ["UTC"],
    "the exception table is drawn (water, heifer gain, cows pinkeye, fuel and repairs rows); the Yearling tile is dropped or says 'no yearlings'",
    (S) => { const s = S.UTC; return { actual: `exception rows ${s.excRows.length} | tiles ${s.tiles.length} | errors: ${s.errors.join("; ") || "none"}`,
      ok: s.excRows.length > 0 && !s.errors.length }; }],
  ["TB-04", "a 2027 season (every 2026- date moved to 2027-): grazing month labels are hard-coded to 2026", "season2027", ["UTC"],
    "4 month labels Jun, Jul, Aug, Sep inside the grazing chart (x between 74 and 560), as with the 2026 data",
    (S) => { const s = S.UTC; return { actual: `ticks ${JSON.stringify(s.monthTicks)} | exception rows ${s.excRows.length}`,
      ok: s.monthTicks.length === 4 && s.monthTicks.every((t) => t.x >= 74 && t.x <= s.grazingW) }; }],
  ["TB-05", "tank ids with a space ('W 2', 'W 4'): the 'Water tanks OK' tile undercounts tanks needing a look", "spacedTankIds", ["UTC"],
    "Water tanks OK 5 of 8, 3 need a look (W 2 low, W 4 leak, T6 silent: the same three tanks as the committed data)",
    (S) => { const s = S.UTC; const t = s.tiles.find((x) => /Water tanks OK/i.test(x)) ?? "";
      return { actual: `${t} | water rows: ${s.excRows.filter((r) => /Water/.test(r)).length}`, ok: /5 of 8/.test(t) && /3 need a look/.test(t) }; }],
  ["TB-06", "budget.csv holding Oct and Nov plan rows (actual 0): the 'season to date' tile and alerts flip to under budget", "budgetPlanZero", ["UTC"],
    "Spend vs budget +1.0%, $89,303 of $88,400, season to date (Jun-Sep only), and Fuel/Repairs still flagged",
    (S) => { const s = S.UTC; const t = s.tiles.find((x) => /Spend vs budget/i.test(x)) ?? "";
      return { actual: `${t} | budget rows in report: ${s.excRows.filter((r) => /Budget/.test(r)).length}`,
        ok: /\+1\.0%/.test(t) && /\$89,303 of \$88,400/.test(t) && s.excRows.filter((r) => /Budget/.test(r)).length === 2 }; }],
  ["TB-07", "October plan rows with actual left blank: the spend tile is built from concatenated text", "budgetPlanBlank", ["UTC"],
    "Spend vs budget +1.0%, $89,303 of $88,400, season to date (October has no actuals yet)",
    (S) => { const s = S.UTC; const t = s.tiles.find((x) => /Spend vs budget/i.test(x)) ?? "";
      return { actual: `${t} | errors: ${s.errors.join("; ") || "none"}`, ok: /\+1\.0%/.test(t) && /\$89,303 of \$88,400/.test(t) }; }],
  ["TB-08", "spring-forward day (as of 2027-03-14 18:00): the leak alert depends on the viewer's computer zone", "springLeak", ["UTC", "America/Chicago"],
    "the same Tank T1 row for both viewers: Critical, Dropped 32 points in 24 hours, now 48%",
    (S) => { const r = (tz) => S[tz].excRows.find((x) => /Tank T1/.test(x)) ?? "(no Tank T1 row)";
      return { actual: `\n      UTC               ${r("UTC")}\n      America/Chicago   ${r("America/Chicago")}`, ok: r("UTC") === r("America/Chicago") && /Dropped 32/.test(r("UTC")) }; }],
  ["TB-09", "as_of in day-first form (30/09/2026 18:00): what the manager sees", "asofDayFirst", ["America/Chicago"],
    "the 10 committed-data rows, or a visible error naming meta.csv; never a shorter list that looks complete",
    (S) => { const s = S["America/Chicago"]; return { actual: `header: ...${s.asof.slice(-40)} | ${s.excRows.length} rows | tile: ${s.tiles[0]} | errors: ${s.errors.join("; ") || "none"}`,
      ok: s.excRows.length === 10 || /meta\.csv/.test(s.asof) }; }],
];

let server, browser, mismatches = 0;
try {
  for (const id of Object.keys(DATA)) prepare(id);
  server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", WORK], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 900));
  const { chromium } = await import(PW);
  browser = await chromium.launch();
  for (const [id, title, ds, zones, expected, check] of CASES) {
    console.log(`CASE ${id}  ${title}`);
    console.log(`  expected: ${expected}`);
    try {
      const S = {};
      for (const tz of zones) {
        const ctx = await browser.newContext({ timezoneId: tz, locale: "en-US", viewport: { width: 1280, height: 900 } });
        S[tz] = await state(await ctx.newPage(), `http://127.0.0.1:${PORT}/${ds}/index.html`);
        await ctx.close();
      }
      const { actual, ok } = check(S);
      console.log(`  actual:   ${actual}`);
      console.log(`  ${ok ? "MATCH" : "MISMATCH"}`);
      if (!ok) mismatches++;
    } catch (e) {
      console.log(`  actual:   ERROR ${e && e.message}`);
      console.log("  MISMATCH");
      mismatches++;
    }
    console.log("");
  }
  console.log(`${CASES.length} cases, ${mismatches} mismatches (workdir ${WORK})`);
} catch (e) {
  console.log(`SETUP ERROR ${e && e.message}`);
} finally {
  try { await browser?.close(); } catch {}
  try { server?.kill(); } catch {}
}
