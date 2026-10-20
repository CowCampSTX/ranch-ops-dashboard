#!/usr/bin/env node
// Rendering, safety and failure states of the ranch operations dashboard, in headless Chromium.
//
// For each scenario this script copies the page (index.html, app.js, exceptions.js, data/*.csv) into its own folder
// under a scratch directory, edits the copied CSVs (the repo is never touched), serves the scratch directory with
// python3 -m http.server, loads the page and records what a manager would see: tiles, chips, exception rows, the empty
// message, which sections rendered, uncaught errors, console errors, failed requests, NaN/Infinity/undefined on the
// page, injected elements, and whether script from a CSV ran (window.__xss_* flags).
//
// Usage (from the repo root):
//   node docs/audit/diagnostics/render.browser.mjs [scratchDir] [port]
// Defaults: scratchDir = $RENDER_SCRATCH or <os tmpdir>/render-audit, port = 8880.
// Prints one block per scenario ending in MATCH (the page behaves as a manager would need) or MISMATCH.
import { mkdirSync, readFileSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SCRATCH = resolve(process.argv[2] || process.env.RENDER_SCRATCH || join(tmpdir(), "render-audit"));
const PORT = +(process.argv[3] || 8880);
const BASE = `http://127.0.0.1:${PORT}/`;

async function loadPlaywright() {
  for (const t of [process.env.PLAYWRIGHT_PATH, "playwright", "/opt/node22/lib/node_modules/playwright/index.mjs"].filter(Boolean)) {
    try { return await import(t); } catch { /* next */ }
  }
  throw new Error("Playwright not found; set PLAYWRIGHT_PATH");
}

// ------------------------------------------------------------------ CSV editing helpers (operate on copied text)
const lines = (t) => t.replace(/\n$/, "").split("\n");
const join_ = (ls) => ls.join("\n") + "\n";
const headerOnly = (t) => lines(t)[0] + "\n";
const replaceAll = (t, a, b) => t.split(a).join(b);
const mapRows = (t, fn) => { const [h, ...rs] = lines(t); return join_([h, ...rs.map((r) => fn(r.split(","))).filter(Boolean).map((c) => c.join(","))]); };

// ------------------------------------------------------------------ scenarios
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const HOSTILE = {
  pasture: '<img src=x onerror="window.__xss_pasture=1">',
  task: "Booster <b>vaccine</b>",
  category: '"><script>window.__xss_script=1</script>',
  tag: '<img src=x onerror="window.__xss_tag=1">',
  tipTag: '<img src=x onerror="window.__xss_tip=1">',
  groupSuffix: '<img src=x onerror="window.__xss_group=1">',
  hide: "Labor<img src=x onerror=\"document.querySelectorAll('#exceptions tr').forEach(r=>r.remove())\">",
};

const scenarios = [
  { id: "baseline", desc: "unchanged data", expect: (s) => ok(s.exceptionRows.length === 10 && !s.pageErrors.length && s.sections.rules > 1, "10 rows, no errors, every section drawn") },

  { id: "xss-onload", desc: "hostile pasture name (P4), task, budget category (Fuel), tag of slow yearling Y027, group Heifers suffix",
    mutate: (f) => {
      f.pastures = replaceAll(f.pastures, "Lone Tree", HOSTILE.pasture);
      f.health = replaceAll(f.health, "Booster vaccine", HOSTILE.task);
      f.budget = replaceAll(f.budget, ",Fuel,", `,${HOSTILE.category},`);
      f.weights = replaceAll(f.weights, "Y027,", `${HOSTILE.tag},`);
      for (const k of ["groups", "moves", "weights", "health"]) f[k] = replaceAll(f[k], "Heifers,", `Heifers${HOSTILE.groupSuffix},`);
    },
    expect: (s) => ok(!Object.values(s.xss).some(Boolean) && !s.injected.total, "CSV text shown as text: no window.__xss_* flag set, no injected <img>/<b>/<script> elements") },

  { id: "xss-tooltip", desc: "hostile tag on a non-slow yearling (Y001): appears only in the gain tooltip", hoverGain: true,
    mutate: (f) => { f.weights = replaceAll(f.weights, "Y001,", `${HOSTILE.tipTag},`); },
    expect: (s) => ok(!s.xss.tip && !s.tipHadImg, "hovering the dot shows the tag as text; no script runs") },

  { id: "xss-hides-alerts", desc: "budget category 'Labor' carries a payload that deletes the exception rows",
    mutate: (f) => { f.budget = replaceAll(f.budget, ",Labor,", `,${HOSTILE.hide},`); },
    expect: (s) => ok(s.exceptionRows.length === 10, "the 10 alerts stay in the table") },

  ...FILES.map((f) => ({ id: `404:${f}`, desc: `${f}.csv deleted (server answers 404)`, mutate: (x) => { x[f] = null; }, clickChips: f === "health" || f === "budget",
    expect: (s) => ok(s.tellsUser, "the page says a data file failed to load (and does not show an all-clear for that area)") })),
  { id: "abort:water", desc: "water.csv request fails at the network level", route: { pattern: "**/data/water.csv", abort: true },
    expect: (s) => ok(s.tellsUser, "the page says water data failed to load") },
  ...FILES.map((f) => ({ id: `empty:${f}`, desc: `${f}.csv has the header and no rows`, mutate: (x) => { x[f] = headerOnly(x[f]); }, clickChips: ["health", "water", "moves"].includes(f),
    expect: (s) => ok(s.tellsUser, "the page says the file has no rows instead of an all-clear or a crash") })),

  { id: "no-yearlings", desc: "'Yearlings' renamed 'Steers' in groups, moves, weights and health",
    mutate: (f) => { for (const k of ["groups", "moves", "weights", "health"]) f[k] = replaceAll(f[k], "Yearlings", "Steers"); },
    expect: (s) => ok(s.exceptionRows.length === 10 && !s.pageErrors.length, "the 10 alerts are still listed (only the yearling tile changes)") },

  { id: "numeric-group", desc: "the 'Heifers' group is named '2025' (a cohort year)",
    mutate: (f) => { for (const k of ["groups", "moves", "weights", "health"]) f[k] = replaceAll(f[k], "Heifers,", "2025,"); },
    expect: (s) => ok(s.exceptionRows.length === 10 && !s.pageErrors.length, "the 10 alerts are still listed") },

  { id: "sensor-dead-8d", desc: "T6 stops reporting 8+ days before as_of (no readings in the 7-day chart window)",
    mutate: (f) => { f.water = mapRows(f.water, (c) => (c[0] === "T6" && c[2] > "2026-09-22T12:00" ? null : c)); },
    expect: (s) => ok(s.exceptionRows.length === 10 && !s.pageErrors.length && s.sections.rules > 1 && s.sections.budgetRows > 1, "alerts listed AND the rest of the page (charts, budget, rules) still drawn") },

  { id: "zero-budget-category", desc: "an unbudgeted category: 'Drought feed' budget 0, actual 3200 in September",
    mutate: (f) => { f.budget = f.budget + "2026-09,Drought feed,0,3200\n"; },
    expect: (s) => ok(!s.badTokens.length, "no Infinity/NaN on the page; the unbudgeted spend is shown in dollars") },

  { id: "tank-ids-with-spaces", desc: "tank ids 'Well 2', 'Well 4', 'Well 6' instead of T2, T4, T6",
    mutate: (f) => { f.water = mapRows(f.water, (c) => (["T2", "T4", "T6"].includes(c[0]) ? ["Well " + c[0].slice(1), ...c.slice(1)] : c)); },
    expect: (s) => ok(/^5 of 8/.test(s.tileMap["Water tanks OK"] || "") && s.chips.includes("Water (3)"), "tile says 5 of 8 OK, 3 need a look, matching the 3 water rows") },

  { id: "blank-level", desc: "T1's last reading has an empty level_pct",
    mutate: (f) => { const ls = lines(f.water); const i = ls.map((l) => l.startsWith("T1,")).lastIndexOf(true); ls[i] = ls[i].replace(/,[^,]*$/, ","); f.water = join_(ls); },
    expect: (s) => ok(!s.exceptionRows.some((r) => /(now|to) % /.test(r + " ")), "a missing reading is not turned into a critical alert with a blank level ('now %')") },

  { id: "all-clear", desc: "data edited so no rule fires; then each chip clicked", clickChips: true,
    mutate: (f) => {
      f.water = mapRows(f.water, (c) => (["T2", "T4", "T6"].includes(c[0]) ? null : c));
      f.moves = replaceAll(f.moves, "Yearlings,P3,2026-09-06,", "Yearlings,P3,2026-09-15,");
      // heifer ADG: avg 0.436, min 0.105; yearling ADG: avg 1.942, min 0.404 (so targets 0.2 and 0.8 flag nothing)
      f.groups = mapRows(f.groups, (c) => (c[0] === "Heifers" ? [c[0], c[1], c[2], "0.2"] : c[0] === "Yearlings" ? [c[0], c[1], c[2], "0.8"] : c));
      f.health = replaceAll(f.health, ",open", ",done");
      f.budget = mapRows(f.budget, (c) => [c[0], c[1], c[2], c[2]]);
    },
    expect: (s) => ok(s.exceptionRows.length === 0 && /^Nothing needs attention/i.test(s.emptyMessage || ""), "a clean all-clear sentence, e.g. 'Nothing needs attention.'") },

  { id: "chip-keyboard-focus", desc: "focus the Water chip, press Enter, check where keyboard focus is",
    action: async (page) => {
      await page.focus('#chips [data-a="Water"]');
      await page.keyboard.press("Enter");
      return { focusedAfterEnter: await page.evaluate(() => document.activeElement.tagName + (document.activeElement.dataset?.a ? ":" + document.activeElement.dataset.a : "")),
        rowsShown: await page.evaluate(() => document.querySelectorAll("#exceptions tr").length - 1) };
    },
    expect: (s) => ok(s.extra.focusedAfterEnter === "BUTTON:Water" && s.extra.rowsShown === 3, "the Water filter applies (3 rows) and focus stays on the Water chip") },

  { id: "tooltip-edges", desc: "phone width (390x844): hover the right edge of a right-column water chart, and a gain dot near the bottom of the screen",
    viewport: { width: 390, height: 844 },
    action: async (page) => {
      const res = {};
      const hit = page.locator("#water .mini").nth(1).locator("rect[fill=transparent]");
      await hit.scrollIntoViewIfNeeded();
      let b = await hit.boundingBox();
      await page.mouse.move(b.x + b.width - 2, b.y + b.height / 2);
      res.water = await page.evaluate(() => { const r = document.getElementById("tip").getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(r.right), innerWidth }; });
      // put a gain dot 20px above the bottom of the viewport, then hover it
      const dot = page.locator("#gain circle").nth(0);
      await dot.scrollIntoViewIfNeeded();
      b = await dot.boundingBox();
      await page.evaluate((dy) => window.scrollBy(0, dy), b.y - (844 - 20));
      b = await dot.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      res.gain = await page.evaluate(() => { const r = document.getElementById("tip").getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), innerHeight, shown: document.getElementById("tip").style.display }; });
      return res;
    },
    expect: (s) => ok(s.extra && s.extra.water.right <= s.extra.water.innerWidth && s.extra.gain.bottom <= s.extra.gain.innerHeight, "tooltips stay inside the viewport") },
];
const ok = (pass, expected) => ({ pass, expected });

// ------------------------------------------------------------------ build scratch copies
rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(SCRATCH, { recursive: true });
const original = Object.fromEntries(FILES.map((f) => [f, readFileSync(join(REPO, "data", f + ".csv"), "utf8")]));
for (const sc of scenarios) {
  const dir = join(SCRATCH, sc.id.replace(/[:]/g, "_"));
  mkdirSync(join(dir, "data"), { recursive: true });
  for (const f of ["index.html", "app.js", "exceptions.js"]) writeFileSync(join(dir, f), readFileSync(join(REPO, f)));
  const files = { ...original };
  try { sc.mutate?.(files); } catch (e) { console.log(`mutate failed for ${sc.id}: ${e.message}`); }
  for (const [f, t] of Object.entries(files)) if (t !== null) writeFileSync(join(dir, "data", f + ".csv"), t);
  sc.url = BASE + sc.id.replace(/[:]/g, "_") + "/";
}

// ------------------------------------------------------------------ serve and drive
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", SCRATCH], { stdio: "ignore" });
const cleanup = () => { try { server.kill(); } catch { /* gone */ } };
process.on("exit", cleanup);
for (let i = 0; i < 50; i++) { try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }

const snapshot = () => {
  const rows = [...document.querySelectorAll("#exceptions tr")].filter((tr) => tr.querySelector("td"));
  const body = document.body.innerText;
  const tiles = [...document.querySelectorAll("#tiles .tile")].map((t) => [t.querySelector(".k").textContent, `${t.querySelector(".v").textContent} | ${t.querySelector(".d").textContent}`]);
  const q = (s) => document.querySelectorAll(s).length;
  const injected = {
    "img in #exceptions": q("#exceptions img"), "b in #exceptions": q("#exceptions b"), "img in #tiles": q("#tiles img"),
    "img in #water h4": q("#water h4 img"), "script in #budgetTable": q("#budgetTable script"),
  };
  injected.total = Object.values(injected).reduce((a, b) => a + b, 0);
  return {
    asof: document.getElementById("asof").textContent,
    tiles: tiles.map(([k, v]) => `${k}: ${v}`), tileMap: Object.fromEntries(tiles),
    chips: [...document.querySelectorAll("#chips .chip")].map((b) => b.textContent),
    exceptionRows: rows.filter((tr) => !tr.querySelector("td[colspan]")).map((tr) => [...tr.cells].map((c) => c.innerText.replace(/\s+/g, " ").trim()).join(" | ")),
    emptyMessage: rows.find((tr) => tr.querySelector("td[colspan]"))?.innerText || null,
    sections: { tiles: q("#tiles .tile"), chips: q("#chips .chip"), exceptionTableRows: q("#exceptions tr"), waterMinis: q("#water .mini"),
      grazingSvg: q("#grazing svg"), gainSvg: q("#gain svg"), budgetSvg: q("#budgetChart svg"), budgetRows: q("#budgetTable tr"), rules: q("#rules tr") },
    badTokens: [...new Set(body.match(/NaN|undefined|Infinity|\[object Object\]/g) || [])],
    tellsUser: /error|failed|missing|could not|couldn't|unavailable|not load|no rows/i.test(body.replace(/Error response/g, "")),
    xss: { pasture: !!window.__xss_pasture, script: !!window.__xss_script, tag: !!window.__xss_tag, group: !!window.__xss_group, tip: !!window.__xss_tip },
    injected,
    waterH4: [...document.querySelectorAll("#water h4")].map((h) => h.textContent),
    budgetTable: [...document.querySelectorAll("#budgetTable tr")].slice(1).map((tr) => tr.innerText.replace(/\s+/g, " ").trim()),
  };
};

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
let mismatches = 0;
for (const sc of scenarios) {
  let out;
  try {
    const ctx = await browser.newContext({ viewport: sc.viewport || { width: 1280, height: 900 }, timezoneId: "America/Denver" });
    const page = await ctx.newPage();
    const pageErrors = [], consoleErrors = [], failed = [];
    page.on("pageerror", (e) => pageErrors.push(String(e.message || e)));
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
    page.on("requestfailed", (r) => failed.push(`FAILED ${r.url().replace(BASE, "")} ${r.failure()?.errorText}`));
    page.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url().replace(BASE, "")}`));
    if (sc.route) await page.route(sc.route.pattern, (r) => (sc.route.abort ? r.abort() : r.continue()));
    await page.goto(sc.url, { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    let tipHadImg = false, tipHTML = null;
    if (sc.hoverGain) {
      // 1) find which dot's tooltip carries the hostile tag (synthetic pointermove on each dot, no script needed yet)
      const idx = await page.evaluate(() => {
        const cs = [...document.querySelectorAll("#gain circle")];
        for (const [i, c] of cs.entries()) {
          c.dispatchEvent(new PointerEvent("pointermove", { bubbles: true, clientX: 10, clientY: 10 }));
          if (/onerror/.test(document.getElementById("tip").innerHTML)) return i;
        }
        return -1;
      });
      // 2) fresh load, then a real mouse hover on that dot (scrolled into view first)
      await page.goto(sc.url, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const flagBefore = await page.evaluate(() => !!window.__xss_tip);
      if (idx >= 0) {
        const dot = page.locator("#gain circle").nth(idx);
        await dot.scrollIntoViewIfNeeded();
        const box = await dot.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        tipHadImg = await page.evaluate(() => !!document.querySelector("#tip img"));
        tipHTML = await page.evaluate(() => document.getElementById("tip").innerHTML);
      }
      await page.waitForTimeout(800);
      tipHTML = `[dot ${idx}; __xss_tip before hover: ${flagBefore}] ${tipHTML}`;
    }
    let chipMessages = null;
    if (sc.clickChips) {
      chipMessages = [];
      for (const a of ["Water", "Grazing", "Gain", "Health", "Budget", "All"]) {
        await page.click(`#chips [data-a="${a}"]`);
        chipMessages.push(await page.evaluate(() => document.querySelector("#exceptions td[colspan]")?.innerText || "(rows)"));
      }
    }
    const extra = sc.action ? await sc.action(page) : null;
    const s = await page.evaluate(snapshot);
    Object.assign(s, { extra, pageErrors, consoleErrors: [...new Set(consoleErrors)].slice(0, 6), consoleErrorCount: consoleErrors.length, failed, tipHadImg, tipHTML, chipMessages });
    if (["xss-onload", "xss-hides-alerts", "404_health", "no-yearlings", "sensor-dead-8d", "zero-budget-category"].includes(sc.id.replace(":", "_")))
      await page.screenshot({ path: join(SCRATCH, sc.id.replace(":", "_") + ".png"), fullPage: true });
    await ctx.close();
    out = s;
  } catch (e) {
    console.log(`SCENARIO ${sc.id}: harness error ${e.message}`);
    mismatches++;
    continue;
  }
  const verdict = sc.expect(out);
  if (!verdict.pass) mismatches++;
  console.log(`\n=== SCENARIO ${sc.id}: ${sc.desc}`);
  console.log(`expected: ${verdict.expected}`);
  console.log(`uncaught: ${JSON.stringify(out.pageErrors)}`);
  console.log(`console errors (${out.consoleErrorCount}): ${JSON.stringify(out.consoleErrors)}`);
  console.log(`failed/4xx requests: ${JSON.stringify(out.failed.filter((x) => !/\/x$/.test(x)))}${out.failed.some((x) => /\/x$/.test(x)) ? " (+ /x image probes)" : ""}`);
  console.log(`asof: ${JSON.stringify(out.asof)}`);
  console.log(`tiles: ${JSON.stringify(out.tiles)}`);
  console.log(`chips: ${JSON.stringify(out.chips)}`);
  console.log(`exception rows (${out.exceptionRows.length}): ${JSON.stringify(out.exceptionRows)}`);
  console.log(`empty message: ${JSON.stringify(out.emptyMessage)}`);
  console.log(`sections: ${JSON.stringify(out.sections)}`);
  console.log(`NaN/undefined/Infinity on page: ${JSON.stringify(out.badTokens)}; page tells user data is missing: ${out.tellsUser}`);
  if (sc.id.startsWith("xss")) {
    console.log(`xss flags: ${JSON.stringify(out.xss)}; injected elements: ${JSON.stringify(out.injected)}`);
    console.log(`water h4: ${JSON.stringify(out.waterH4.slice(0, 4))}`);
    console.log(`budget table: ${JSON.stringify(out.budgetTable)}`);
    if (sc.hoverGain) console.log(`tooltip had <img>: ${out.tipHadImg}; tooltip HTML: ${JSON.stringify(out.tipHTML)}`);
  }
  if (sc.id === "blank-level" || sc.id === "tank-ids-with-spaces") console.log(`water h4: ${JSON.stringify(out.waterH4)}`);
  if (sc.id === "zero-budget-category") console.log(`budget table: ${JSON.stringify(out.budgetTable)}`);
  if (out.extra) console.log(`measured: ${JSON.stringify(out.extra)}`);
  if (out.chipMessages) console.log(`messages after clicking Water, Grazing, Gain, Health, Budget, All: ${JSON.stringify(out.chipMessages)}`);
  console.log(`=> ${verdict.pass ? "MATCH" : "MISMATCH"}`);
}
await browser.close();
cleanup();
console.log(`\n${scenarios.length} scenarios, ${mismatches} MISMATCH. Scratch copies and screenshots: ${SCRATCH}`);
