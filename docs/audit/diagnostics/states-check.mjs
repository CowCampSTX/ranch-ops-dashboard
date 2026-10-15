#!/usr/bin/env node
// Loading, empty, missing-data and error states of the ranch operations dashboard, driven with page.route so the
// files on disk are never touched. Read-only: writes a JSON report and a few screenshots.
//
// Usage:
//   python3 -m http.server 8801 --directory <repo> &
//   node docs/audit/diagnostics/states-check.mjs http://127.0.0.1:8801/ <outDir>
//
// Scenarios
//   baseline              the real data, for comparison
//   loading               every CSV delayed 3 s; what the page shows 1 s in
//   stalled-water         water.csv never answers; what the page shows after 6 s
//   <file>:404            the request is redirected to a file that does not exist (the server's real 404 page)
//   <file>:abort          the request fails at the network level
//   <file>:garbage        200 OK with a body that is not a CSV
//   <file>:header-only    200 OK with the right header and no rows (an export that came out empty)
//   all-clear             the real data edited in flight so no rule should fire; then every chip is clicked
//   tz:<zone>             the real data under several browser time zones; the rendered text should not change
//
// For each scenario it records: page errors, whether the page finished rendering, the tile values, the chip
// labels, the exception rows, the empty-table message, any visible "NaN"/"undefined"/"Infinity", and whether
// anything on the page tells the user that data is missing or failed to load.
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const [baseArg, outArg] = process.argv.slice(2);
if (!baseArg || !outArg) { console.error("usage: node states-check.mjs <baseURL> <outDir>"); process.exit(2); }
const base = baseArg.endsWith("/") ? baseArg : baseArg + "/";
const outDir = resolve(outArg);
mkdirSync(outDir, { recursive: true });

async function loadPlaywright() {
  for (const t of [process.env.PLAYWRIGHT_PATH, "playwright", "/opt/node22/lib/node_modules/playwright/index.mjs"].filter(Boolean)) {
    try { return await import(t); } catch { /* next */ }
  }
  throw new Error("Playwright not found; set PLAYWRIGHT_PATH");
}
const { chromium } = await loadPlaywright();

const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const HEADERS = {};
for (const f of FILES) HEADERS[f] = (await (await fetch(`${base}data/${f}.csv`)).text()).split(/\r?\n/)[0];

const snapshot = () => {
  const rows = [...document.querySelectorAll("#exceptions tr")].filter((tr) => tr.querySelector("td"));
  const body = document.body.innerText;
  return {
    ready: document.querySelectorAll("#rules tr").length > 1,
    asof: document.getElementById("asof").textContent,
    tiles: [...document.querySelectorAll("#tiles .tile")].map((t) => `${t.querySelector(".k").textContent}: ${t.querySelector(".v").textContent} (${t.querySelector(".d").textContent})`),
    chips: [...document.querySelectorAll("#chips .chip")].map((b) => b.textContent),
    exceptionRows: rows.filter((tr) => !tr.querySelector("td[colspan]")).map((tr) => [...tr.cells].map((c) => c.innerText.replace(/\s+/g, " ").trim()).join(" | ")),
    emptyMessage: rows.find((tr) => tr.querySelector("td[colspan]"))?.innerText || null,
    waterMinis: document.querySelectorAll("#water .mini").length,
    charts: document.querySelectorAll("svg.chart").length,
    budgetRows: [...document.querySelectorAll("#budgetTable tr")].filter((tr) => tr.querySelector("td")).length,
    badTokens: [...new Set(body.match(/NaN|undefined|Infinity|\[object Object\]/g) || [])],
    tellsUserSomethingIsWrong: /error|failed|missing|could not|couldn't|unavailable|not load|no data loaded/i.test(body.replace(/no data\b/g, "")),
    loadingIndicator: /loading/i.test(body),
    visibleText: body.replace(/\s+/g, " ").slice(0, 400),
  };
};

const results = {};
const browser = await chromium.launch();

async function run(name, { route, timezoneId, waitMs = 0, settleMs = 1500, after } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, timezoneId });
  const page = await ctx.newPage();
  const log = { pageErrors: [], consoleErrors: [], badResponses: [] };
  page.on("pageerror", (e) => log.pageErrors.push(String(e.message || e)));
  page.on("console", (m) => m.type() === "error" && log.consoleErrors.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && log.badResponses.push(`${r.status()} ${r.url().replace(base, "")}`));
  if (route) await page.route("**/data/*.csv", route);
  await page.goto(base, { waitUntil: "domcontentloaded" });
  if (waitMs) await page.waitForTimeout(waitMs);
  else {
    await page.waitForFunction(() => document.querySelectorAll("#rules tr").length > 1, null, { timeout: settleMs + 3000 }).catch(() => {});
    await page.waitForTimeout(200);
  }
  const snap = await page.evaluate(snapshot);
  const extra = after ? await after(page) : undefined;
  results[name] = { ...snap, log, extra };
  if (["loading", "stalled-water", "health:404", "water:header-only", "all-clear", "meta:404"].includes(name))
    await page.screenshot({ path: join(outDir, `state-${name.replace(/[:/]/g, "-")}.png`) });
  await ctx.close();
  return results[name];
}

const fileOf = (url) => /data\/(\w+)\.csv/.exec(url)?.[1];

// ---------------------------------------------------------------- scenarios
await run("baseline");
await run("loading", { waitMs: 1000, route: async (r) => { await new Promise((ok) => setTimeout(ok, 3000)); await r.continue().catch(() => {}); } });
const held = [];
await run("stalled-water", { waitMs: 6000, route: (r) => (fileOf(r.request().url()) === "water" ? held.push(r) : r.continue()) });

for (const f of FILES) {
  const only = (fn) => (r) => (fileOf(r.request().url()) === f ? fn(r) : r.continue());
  await run(`${f}:404`, { route: only((r) => r.continue({ url: `${base}data/__missing_${f}.csv` })) });
  await run(`${f}:abort`, { route: only((r) => r.abort("failed")) });
  await run(`${f}:garbage`, { route: only((r) => r.fulfill({ status: 200, contentType: "text/csv", body: "\u0000\u0001 this is not a csv\n<html><body>oops</body></html>\n;;;\n" })) });
  await run(`${f}:header-only`, { route: only((r) => r.fulfill({ status: 200, contentType: "text/csv", body: HEADERS[f] + "\n" })) });
}

// all-clear: edit the real data in flight so that no rule should fire
const allClear = {
  water: (t) => { // replace the three problem tanks with a copy of T1's healthy readings
    const lines = t.trim().split("\n"), head = lines[0], t1 = lines.filter((l) => l.startsWith("T1,"));
    const keep = lines.slice(1).filter((l) => !/^T[246],/.test(l));
    const copies = ["2", "4", "6"].flatMap((n) => t1.map((l) => l.replace(/^T1,P1,/, `T${n},P${n},`)));
    return [head, ...keep, ...copies].join("\n") + "\n";
  },
  moves: (t) => t.replace("Yearlings,P7,2026-08-25,2026-09-06", "Yearlings,P7,2026-08-25,2026-09-16").replace("Yearlings,P3,2026-09-06,", "Yearlings,P3,2026-09-16,"),
  weights: (t) => { // last weigh-in set so every animal gains exactly its group's target
    const target = { Heifers: 1.0, Yearlings: 2.0 }, lines = t.trim().split("\n"), prev = {};
    return lines.map((l, i) => {
      if (!i) return l;
      const [tag, group, d, w] = l.split(",");
      if (d === "2026-07-20") prev[tag] = +w;
      if (d === "2026-09-15") return `${tag},${group},${d},${prev[tag] + Math.round(target[group] * 57)}`;
      return l;
    }).join("\n") + "\n";
  },
  health: (t) => t.replace("Cows,Pinkeye check,2026-08-01,2026-10-03,open", "Cows,Pinkeye check,2026-08-01,2026-10-20,open").replace("Yearlings,Booster vaccine,2026-06-02,2026-09-15,open", "Yearlings,Booster vaccine,2026-09-14,,done"),
  budget: (t) => t.trim().split("\n").map((l, i) => { if (!i) return l; const c = l.split(","); c[3] = c[2]; return c.join(","); }).join("\n") + "\n",
};
await run("all-clear", {
  route: async (r) => {
    const f = fileOf(r.request().url());
    if (!allClear[f]) return r.continue();
    const res = await r.fetch();
    await r.fulfill({ response: res, body: allClear[f](await res.text()) });
  },
  after: async (page) => {
    const out = [];
    for (let i = 0; i < 6; i++) {
      await page.locator("#chips .chip").nth(i).click();
      out.push(await page.evaluate(() => ({ chip: document.querySelector('#chips .chip[aria-pressed="true"]').textContent,
        message: document.querySelector("#exceptions td[colspan]")?.innerText || null })));
    }
    return out;
  },
});

for (const tz of ["UTC", "America/Chicago", "America/Los_Angeles", "Pacific/Auckland", "Asia/Kolkata", "Pacific/Kiritimati"]) await run(`tz:${tz}`, { timezoneId: tz });
await browser.close();
held.length = 0;

writeFileSync(join(outDir, "states-report.json"), JSON.stringify(results, null, 2));

// ---------------------------------------------------------------- summary
const B = results.baseline;
const chipCounts = (s) => Object.fromEntries(s.chips.map((c) => { const m = /^(\w+) \((\d+)\)/.exec(c); return m ? [m[1], +m[2]] : [c, null]; }));
const bc = chipCounts(B);
console.log(`baseline: ready=${B.ready} rows=${B.exceptionRows.length} chips=${B.chips.join(", ")}`);
for (const [name, s] of Object.entries(results)) {
  if (name === "baseline") continue;
  const cc = chipCounts(s);
  const lost = Object.keys(bc).filter((k) => k !== "All" && bc[k] > 0 && cc[k] === 0);
  const silent = s.ready && lost.length && !s.tellsUserSomethingIsWrong;
  console.log(`\n[${name}] ready=${s.ready} pageErrors=${s.log.pageErrors.length}${s.log.pageErrors.length ? " (" + s.log.pageErrors[0].slice(0, 90) + ")" : ""} rows=${s.exceptionRows.length}` +
    ` warnsUser=${s.tellsUserSomethingIsWrong} loadingText=${s.loadingIndicator} badTokens=[${s.badTokens}]`);
  console.log(`   chips: ${s.chips.join(", ") || "(none)"}${lost.length ? `   areas that went to zero: ${lost.join(", ")}${silent ? "  <-- SILENT ALL-CLEAR" : ""}` : ""}`);
  console.log(`   tiles: ${s.tiles.join(" ; ") || "(none)"}`);
  if (s.emptyMessage) console.log(`   empty message: "${s.emptyMessage}"`);
  if (name.startsWith("tz:")) console.log(`   asof: ${s.asof}  sameRowsAsBaseline=${JSON.stringify(s.exceptionRows) === JSON.stringify(B.exceptionRows)} sameTiles=${JSON.stringify(s.tiles) === JSON.stringify(B.tiles)}`);
  if (name === "loading" || name === "stalled-water") console.log(`   visible: ${s.visibleText}`);
  if (s.extra) console.log(`   chips clicked: ${s.extra.map((e) => `${e.chip} -> "${e.message}"`).join(" | ")}`);
}
console.log(`\nreport: ${join(outDir, "states-report.json")}`);
