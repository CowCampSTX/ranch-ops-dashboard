#!/usr/bin/env node
// Preserve checks KEEP-01 to KEEP-34 for the redesigned dashboard page on main (pull request #2, merge commit 0315d09).
// They check what the page already does for keyboard, touch, mouse and phone use, which Phase 1 must keep. This script
// is the reference for docs/audit/06-phase1-spec.md section 6.3 (the keep-list; each of its rows names the KEEP checks
// that test it) and section 11.4 (the Phase 1 browser smoke test runs these checks, either ported into
// tests/browser/smoke.mjs or by running this script against the page it serves).
//
// What it checks:
//   KEEP-01 to KEEP-07, KEEP-34  charts in the tab order; readings by keyboard (arrow keys, Home, End, Escape), touch
//                                and mouse; every reading inside the window and below the sticky top bar
//   KEEP-08 to KEEP-12           phone layouts at 390 and 320 px: list rows as cards, no sideways scroll at 33 widths,
//                                the budget table inside its card, the tiles, the closed rules table and tap targets
//   KEEP-13 to KEEP-18           tank cards worst first with a pill each; the budget table, its pills, legend, season
//                                total and $0-budget rows
//   KEEP-19 to KEEP-24           charts drawn at their real width and redrawn on resize, chart text of 11 px or more, no
//                                overlapping labels, a line break at a sensor gap, the flagged gain readings and their
//                                marks (a flagged mark differs from the plain dot in shape as well as colour, and
//                                each legend key has the shape of its marks, at 1280, 390 and 320 px; judged from each
//                                mark element's own fill and each key's own box and corner radii, so a mark or key
//                                made invisible by its own or a parent's opacity, filter or CSS visibility (or a
//                                mark's fill-opacity), a mark's stroke, clips or masks on ancestors and shapes painted
//                                on top are not seen, and marks drawn with <use> are not counted)
//   KEEP-25 to KEEP-28           loading text, a failed file, one section failing on its own, escaped CSV text
//   KEEP-29 to KEEP-33           focus rings, reduced motion, area chips, skip link and top-bar links, an icon and a
//                                word on every badge and pill
// None reads rule wording or exact pixel positions: list rows are matched by area and subject, states by severity
// class, sizes against the window, the sticky top bar and the card.
//
// Read-only: it only loads pages in Chromium, edits data responses inside the browser (page.route) and reads the DOM.
// It writes no file and starts no server, so serve the page first.
//
// Usage (from the repository root):
//   python3 -m http.server 8766 --bind 127.0.0.1      # in another terminal, or any static server
//   node docs/audit/redesign/preserve.mjs [page]      # page default http://localhost:8766/
// Each line is PASS or FAIL with what was measured; the last line is {"pass":n,"fail":[ids],"seconds":s}.
// Exit code 0 when every check passes, 1 when any fails, 2 when Playwright cannot be loaded or nothing is served at the
// page URL (in servers mode, also at a case folder): a set-up problem, not a result about the page, reported on one
// line that starts "ENVIRONMENT:". The recorded runs are in docs/audit/08-redesign-coverage.md section 2.
//
// Odd-data cases (gap, gap12, gap18, t6old, longnames, hostile, zerobudget, allzerobudget, singleweigh, missing) are
// built by default in the browser from the page's own committed data (page.route edits each CSV by column name), so
// they test whatever code the page serves, Phase 1 code included. gap12 and gap18 are always built that way.
// PRESERVE_CASES=servers loads prebuilt case folders for the others instead, from two
// more arguments: node preserve.mjs [page] [cases-a] [cases-b] (defaults http://localhost:8800/cases/ for zerobudget,
// allzerobudget, missing and singleweigh, and http://localhost:8801/cases/ for gap, hostile, longnames and t6old). The
// audit used that mode once, on its own machine, to confirm that both modes measure the same.
//
// Needs Node 22 and Playwright with Chromium. Playwright is loaded from $PLAYWRIGHT_MODULE, else $PLAYWRIGHT_PATH, if
// set (a path to Playwright's index.mjs, or a package name), else from
// /opt/node22/lib/node_modules/playwright/index.mjs if that file exists (the audit machine), else from the "playwright"
// package. A path is imported as a file URL (pathToFileURL), so a Windows path such as C:\...\index.mjs works. Run so
// far only with Chromium on Linux.
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

const PW_DEFAULT = "/opt/node22/lib/node_modules/playwright/index.mjs";
const PW = process.env.PLAYWRIGHT_MODULE || process.env.PLAYWRIGHT_PATH || (existsSync(PW_DEFAULT) ? PW_DEFAULT : "playwright");
let chromium;
try {
  ({ chromium } = await import(existsSync(PW) ? pathToFileURL(PW).href : PW));
} catch (e) {
  console.error(`ENVIRONMENT: could not load Playwright from "${PW}" (${e.code ?? e.message}). Set PLAYWRIGHT_MODULE to the path of Playwright's index.mjs, for example $(npm root -g)/playwright/index.mjs for a global install. This is a set-up problem, not a result about the page.`);
  process.exit(2);
}

const PAGE = process.argv[2] ?? "http://localhost:8766/";
const CA = process.argv[3] ?? "http://localhost:8800/cases/";
const CB = process.argv[4] ?? "http://localhost:8801/cases/";
const T0 = Date.now();
const MODE = process.env.PRESERVE_CASES ?? "route";

// ---------------------------------------------------------------- odd-data cases (the edits coverage.mjs makes)
// Plain comma-separated files with a header row; cells are addressed by column name, so column order may change.
function editCSV(text, fn, add = []) {
  const nl = text.includes("\r\n") ? "\r\n" : "\n", lines = text.split(/\r?\n/).filter((l) => l !== "");
  const head = lines[0].split(",").map((h) => h.trim()), out = [lines[0]];
  for (const l of lines.slice(1)) {
    const cells = l.split(","), row = Object.fromEntries(head.map((h, i) => [h, cells[i]]));
    const r = fn(row);
    if (r) out.push(head.map((h) => r[h] ?? "").join(","));
  }
  for (const a of add) out.push(a.join(","));
  return out.join(nl) + nl;
}
const swap = (map) => (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v in map ? map[v] : v]));
const LONG = "Yearling steers on the north lease";
const GROUP_FILES = ["groups", "moves", "weights", "health", "weigh_sessions"];
const CASES = {
  gap: { water: { fn: (r) => (r.tank_id === "T1" && r.time >= "2026-09-26T00:00" && r.time <= "2026-09-27T12:00" ? null : r) } },
  // T1 reads every 6 hours: one reading out leaves a 12-hour gap (no break), two leave 18 hours (a break)
  gap12: { water: { fn: (r) => (r.tank_id === "T1" && r.time === "2026-09-26T06:00" ? null : r) } },
  gap18: { water: { fn: (r) => (r.tank_id === "T1" && (r.time === "2026-09-26T06:00" || r.time === "2026-09-26T12:00") ? null : r) } },
  t6old: { water: { fn: (r) => (r.tank_id === "T6" && r.time > "2026-09-22T12:00" ? null : r) } },
  longnames: { ...Object.fromEntries(GROUP_FILES.map((f) => [f, { fn: swap({ Yearlings: LONG }) }])), budget: { fn: swap({ "Water and fencing": "Water development and fencing repairs" }) } },
  hostile: { pastures: { fn: (r) => (r.pasture_id === "P2" ? { ...r, name: '<img src=x onerror="window.__xss=1">' } : r.pasture_id === "P4" ? { ...r, name: "Lone Tree <A" } : r) },
    weights: { fn: (r) => (r.group === "Heifers" ? { ...r, tag: `<i>${r.tag}</i>` } : r) } },
  zerobudget: { budget: { fn: (r) => (r.category === "Repairs" ? { ...r, budget: "0" } : r), add: [["2026-09", "Misc", "0", "0"]] } },
  allzerobudget: { budget: { fn: (r) => ({ ...r, budget: "0" }) } },
  singleweigh: { weights: { fn: (r) => (r.tag === "Y020" && r.date !== "2026-09-15" ? null : r) } },
  missing: { budget: { status: 404 } },
};
const SERVER = { gap: "B", t6old: "B", longnames: "B", hostile: "B", zerobudget: "A", allzerobudget: "A", singleweigh: "A", missing: "A" };
const routeEdits = (edits) => (p) => p.route("**/data/*.csv", async (r) => {
  const name = r.request().url().match(/data\/(\w+)\.csv/)[1], e = edits[name];
  if (!e) return r.continue();
  if (e.status) return r.fulfill({ status: e.status, body: "" });
  const resp = await r.fetch();
  await r.fulfill({ response: resp, body: editCSV(await resp.text(), e.fn, e.add) });
});
// open a case: in route mode the page under test with edited data, in servers mode the prebuilt folder
const openCase = (name, o = {}) => (MODE === "servers" ? open(`${SERVER[name] === "A" ? CA : CB}${name}/`, o) : open(PAGE, { ...o, route: routeEdits(CASES[name]) }));

const results = [];
function check(id, ok, measured) {
  results.push({ id, ok, measured });
  console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${measured}`);
}
const info = (s) => console.log(`     ${s}`);

// ---------------------------------------------------------------- set-up: the page (in servers mode, each case folder) is served
// Nothing served there is a set-up problem, not 34 FAILs about the page: say so on its own and stop with exit code 2.
for (const u of [PAGE, ...(MODE === "servers" ? Object.entries(SERVER).map(([n, s]) => `${s === "A" ? CA : CB}${n}/`) : [])]) {
  try {
    const r = await fetch(u, { signal: AbortSignal.timeout(10000) });
    await r.body?.cancel();
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
  } catch (e) {
    const hint = u === PAGE ? "Serve the page first, for example python3 -m http.server 8766 --bind 127.0.0.1 from the repository root"
      : "Serve the prebuilt case folders, or leave PRESERVE_CASES unset to build the cases in the browser";
    console.error(`ENVIRONMENT: could not reach ${u} (${e.cause?.code ?? e.message}). ${hint}. This is a set-up problem, not a result about the page.`);
    process.exit(2);
  }
}

// ---------------------------------------------------------------- precondition: in servers mode, the case folders run the page's code
if (MODE === "servers") {
  const get = async (u) => (await fetch(u)).text();
  const same = [];
  for (const f of ["app.js", "index.html", "exceptions.js", "format.js"]) {
    const a = await get(new URL(f, PAGE).href), c = await get(`${CB}gap/${f}`);
    same.push(`${f}: cases-b ${a === c ? "same" : "DIFFERENT"}`);
    const b2 = await get(`${CA}zerobudget/${f}`);
    same.push(`${f}: cases-a ${a === b2 ? "same" : "DIFFERENT"}`);
  }
  console.log(`PRE  odd-data cases: prebuilt folders; case pages vs ${PAGE}: ${same.join("; ")}`);
} else {
  console.log(`PRE  odd-data cases: built in the browser from the page's data (${PAGE})`);
}

const browser = await chromium.launch();
// A check that throws (a selector gone, a timeout) is reported as FAIL with the error, and the run goes on.
async function guard(ids, fn) {
  try { await fn(); }
  catch (e) { for (const id of ids) if (!results.some((r) => r.id === id)) check(id, false, `error: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}`); }
}
async function open(url, o = {}) {
  const ctx = await browser.newContext({
    viewport: { width: o.w ?? 1280, height: o.h ?? 900 }, hasTouch: !!o.touch, isMobile: !!o.touch,
    locale: "en-US", timezoneId: "America/Chicago", reducedMotion: o.motion ?? "reduce", deviceScaleFactor: 1,
  });
  if (o.init) await ctx.addInitScript(o.init, o.initArg);
  ctx.setDefaultTimeout(8000);
  const page = await ctx.newPage();
  const errs = [], cerrs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && cerrs.push(m.text()));
  if (o.route) await o.route(page);
  await page.goto(url, { waitUntil: o.wait ?? "networkidle" });
  if (!o.noWait) await page.waitForTimeout(500);
  return { page, ctx, errs, cerrs, close: () => ctx.close() };
}
const settle = (page, ms = 350) => page.waitForTimeout(ms);
const resize = async (page, w, h) => { await page.setViewportSize({ width: w, height: h }); await settle(page, 450); };

// ---------------------------------------------------------------- page-side probes
// The readout and the chart that has keyboard focus. The highlight is whatever the chart made visible for the reading.
const SNAP = () => {
  const t = document.getElementById("tip"), s = document.activeElement, hb = document.querySelector("header").getBoundingClientRect().bottom;
  const r = t.getBoundingClientRect();
  let mx = null, my = null;
  if (s?.matches?.("svg.chart")) {
    let m = [...s.querySelectorAll('[visibility="visible"]')][0];
    if (m && m.tagName === "g") m = m.querySelector("circle") ?? m;
    const b = m?.getBoundingClientRect();
    if (b && (b.width || b.height)) { mx = +((b.left + b.right) / 2).toFixed(2); my = +((b.top + b.bottom) / 2).toFixed(2); }
  }
  const bad = [...t.querySelectorAll("*")].filter((e) => /^(img|script|iframe|object|embed)$/i.test(e.tagName) || [...e.attributes].some((a) => /^on/i.test(a.name)));
  return {
    hidden: t.hidden, text: t.textContent, l: r.left, t: r.top, r: r.right, b: r.bottom, bar: hb,
    vw: document.documentElement.clientWidth, vh: innerHeight, mx, my, sy: scrollY,
    chart: s?.matches?.("svg.chart") ? s.getAttribute("aria-label") : null,
    first: t.firstElementChild?.textContent ?? "", tl: t.querySelector(".tl")?.textContent ?? "",
    flag: !!t.querySelector(".tf"), flagIcon: !!t.querySelector(".tf svg"), flagText: t.querySelector(".tf")?.textContent.trim() ?? "",
    bad: bad.length,
  };
};
const snap = (page) => page.evaluate(SNAP);
const same = (a, b) => a.text === b.text && a.mx === b.mx && a.my === b.my && a.hidden === b.hidden;
const inside = (s) => !s.hidden && s.l >= -0.5 && s.r <= s.vw + 0.5 && s.t >= s.bar - 0.5 && s.b <= s.vh + 0.5;
const chartIndex = (page) => page.evaluate(() => [...document.querySelectorAll("svg.chart")].indexOf(document.activeElement));
const focusableCharts = (page) => page.evaluate(() => [...document.querySelectorAll("svg.chart")].map((s, i) => (s.getAttribute("tabindex") === "0" ? i : -1)).filter((i) => i >= 0));
async function tabToChart(page, k, max = 90) {
  for (let i = 0; i < max; i++) {
    if ((await chartIndex(page)) === k) return true;
    await page.keyboard.press("Tab");
  }
  return (await chartIndex(page)) === k;
}
// Step through every reading of the focused chart with the keyboard: top row, then Home and ArrowRight to the row's end,
// then ArrowDown to the next row.
async function sweep(page) {
  const out = [];
  let cur = await snap(page);
  for (let i = 0; i < 60; i++) { await page.keyboard.press("ArrowUp"); const n = await snap(page); if (same(n, cur)) break; cur = n; }
  for (let row = 0; row < 60; row++) {
    await page.keyboard.press("Home"); cur = await snap(page); out.push({ ...cur, row });
    for (let i = 0; i < 500; i++) { await page.keyboard.press("ArrowRight"); const n = await snap(page); if (same(n, cur)) break; cur = n; out.push({ ...cur, row }); }
    await page.keyboard.press("ArrowDown"); const n = await snap(page); if (same(n, cur)) break; cur = n;
  }
  return out;
}
async function sweepAll(page) {
  const ks = await focusableCharts(page), per = [];
  for (const k of ks) {
    const ok = await tabToChart(page, k);
    const label = await page.evaluate((k) => document.querySelectorAll("svg.chart")[k].getAttribute("aria-label"), k);
    per.push({ k, label, reached: ok, readings: ok ? await sweep(page) : [] });
  }
  return per;
}
// List rows as {area, subject, sev, text}, read by column role, not by rule wording.
const LIST = () => [...document.querySelectorAll("#exceptions tbody tr")].filter((r) => r.cells.length > 1).map((r) => ({
  area: (r.querySelector(".c-area") ?? r.cells[1]).textContent.trim(),
  subject: (r.querySelector(".c-what") ?? r.cells[2]).textContent.trim(),
  sev: ["critical", "serious", "warning"].find((s) => r.classList.contains(`sev-${s}`)) ?? r.querySelector(".sev")?.textContent.trim().toLowerCase(),
  word: r.querySelector(".sev")?.textContent.trim() ?? "",
  text: r.innerText.replace(/\s+/g, " ").trim(),
}));
const listRows = (page) => page.evaluate(LIST);
// Distinct values of one column of a data file (and of tanks.csv once Phase 1 adds it).
const distinct = (page, file, col) => page.evaluate(async ([file, col]) => {
  const res = await fetch(`data/${file}.csv`); if (!res.ok) return null;
  const lines = (await res.text()).trim().split(/\r?\n/), h = lines[0].split(",").map((x) => x.trim()), c = h.indexOf(col);
  return [...new Set(lines.slice(1).map((l) => l.split(",")[c]?.trim()).filter(Boolean))];
}, [file, col]);
const money = (s) => { const m = String(s).replace(/−/g, "-").match(/(-?)\$([\d,]+)/); return m ? (m[1] ? -1 : 1) * +m[2].replace(/,/g, "") : NaN; };

// ================================================================ keyboard reading
let sweep1280 = null;
await guard(["KEEP-01", "KEEP-02", "KEEP-03", "KEEP-04"], async () => {
  const { page, errs, close } = await open(PAGE);
  // KEEP-01: every chart with readings is in the tab order, labelled, and described by the chart hint (#chart-help)
  const a = await page.evaluate(() => [...document.querySelectorAll("svg.chart")].map((s) => {
    const d = s.getAttribute("aria-describedby"), help = d && document.getElementById(d);
    return { tab: s.getAttribute("tabindex"), label: s.getAttribute("aria-label") ?? "", role: s.getAttribute("role"), rd: s.getAttribute("aria-roledescription"), help: d === "chart-help" && help ? help.textContent.trim().length : 0 };
  }));
  const reached = [];
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press("Tab");
    const k = await chartIndex(page);
    if (k >= 0 && !reached.includes(k)) reached.push(k);
  }
  const inOrder = reached.every((k, i) => i === 0 || k > reached[i - 1]);
  const t6 = await openCase("t6old");
  const t6c = await t6.page.evaluate(() => { const s = [...document.querySelectorAll("#tanks svg.chart")].find((x) => /^Tank T6 /.test(x.getAttribute("aria-label"))); return { exists: !!s, tab: s?.getAttribute("tabindex") ?? null, focusable: document.querySelectorAll("svg.chart[tabindex='0']").length }; });
  await t6.close();
  check("KEEP-01", a.length === 10 && a.every((c) => c.tab === "0" && c.label && c.rd && c.help > 0) && reached.length === a.length && inOrder && t6c.exists && t6c.tab === null && t6c.focusable === 9,
    `${a.length} charts; tabindex=0 on ${a.filter((c) => c.tab === "0").length}; aria-label on ${a.filter((c) => c.label).length}; role ${[...new Set(a.map((c) => c.role))]}; aria-roledescription on ${a.filter((c) => c.rd).length}; aria-describedby="chart-help" with text on ${a.filter((c) => c.help).length}; Tab from the top reaches ${reached.length} charts in document order ${inOrder}; t6old case: T6 chart with no readings has tabindex ${t6c.tab} and ${t6c.focusable} charts stay focusable`);

  // KEEP-02: keyboard focus shows a reading in #tip (role=status, polite), value first, and a highlight on the chart
  await page.reload({ waitUntil: "networkidle" }); await settle(page);
  const ks = await focusableCharts(page), shown = [];
  for (const k of ks) {
    await tabToChart(page, k);
    const s = await snap(page);
    await page.keyboard.press("End"); const e = await snap(page);
    await page.keyboard.press("Home"); await page.keyboard.press("End"); const e2 = await snap(page);
    shown.push({ k, chart: s.chart.slice(0, 18), visible: !s.hidden && s.text.length > 0, valueFirst: /\d/.test(s.first), mark: s.mx !== null, startIsLatest: e.text === s.text, endStable: e2.text === e.text });
  }
  const tipAttr = await page.evaluate(() => { const t = document.getElementById("tip"); return { role: t.getAttribute("role"), live: t.getAttribute("aria-live") }; });
  const tanks = shown.filter((x) => /^Tank /.test(x.chart));
  check("KEEP-02", shown.length === 10 && shown.every((x) => x.visible && x.valueFirst && x.mark) && tanks.every((x) => x.startIsLatest) && tipAttr.role === "status" && tipAttr.live === "polite",
    `on Tab focus: readout shown on ${shown.filter((x) => x.visible).length}/${shown.length} charts, value element first on ${shown.filter((x) => x.valueFirst).length}, highlight drawn on ${shown.filter((x) => x.mark).length}; tank charts open on their latest reading (End gives the same reading) ${tanks.filter((x) => x.startIsLatest).length}/${tanks.length}; #tip role=${tipAttr.role} aria-live=${tipAttr.live}`);

  // KEEP-03: arrow keys, Home, End; up and down between rows; the page does not scroll
  await page.reload({ waitUntil: "networkidle" }); await settle(page);
  const k0 = ks[0], kGraz = await page.evaluate(() => [...document.querySelectorAll("svg.chart")].findIndex((s) => s.closest("#grazing"))), kGain = await page.evaluate(() => [...document.querySelectorAll("svg.chart")].findIndex((s) => s.closest("#gain")));
  await tabToChart(page, k0);
  const s0 = await snap(page), y0 = s0.sy;
  await page.keyboard.press("ArrowLeft"); const sl = await snap(page);
  await page.keyboard.press("ArrowRight"); const sr = await snap(page);
  await page.keyboard.press("Home"); const sh = await snap(page);
  await page.keyboard.press("ArrowLeft"); const shl = await snap(page);
  await page.keyboard.press("End"); const se = await snap(page);
  await page.keyboard.press("ArrowRight"); const ser = await snap(page);
  await page.keyboard.press("ArrowUp"); const su = await snap(page);
  await page.keyboard.press("ArrowDown"); const sd = await snap(page);
  const tank = { left: sl.text !== s0.text && sl.mx < s0.mx, right: sr.text === s0.text, home: sh.mx < s0.mx && shl.text === sh.text, end: se.text === s0.text && ser.text === se.text, upDown: su.text === s0.text && sd.text === s0.text, noScroll: [sl, sr, sh, shl, se, ser, su, sd].every((x) => x.sy === y0) };
  const rows = async (k) => {
    await tabToChart(page, k);
    const a = await snap(page); await page.keyboard.press("ArrowDown"); const b = await snap(page); await page.keyboard.press("ArrowUp"); const c = await snap(page);
    await page.keyboard.press("Home"); const h = await snap(page); await page.keyboard.press("End"); const e = await snap(page);
    return { down: b.text !== a.text && b.my > a.my, up: c.my < b.my && c.text !== b.text, homeEnd: h.mx <= e.mx, noScroll: [b, c, h, e].every((x) => x.sy === a.sy) };
  };
  const graz = await rows(kGraz), gain = await rows(kGain);
  check("KEEP-03", Object.values(tank).every(Boolean) && Object.values(graz).every(Boolean) && Object.values(gain).every(Boolean),
    `tank chart: ArrowLeft earlier reading ${tank.left}, ArrowRight back ${tank.right}, Home to first and stops there ${tank.home}, End to latest and stops there ${tank.end}, Up/Down no change on a one-row chart ${tank.upDown}, page not scrolled ${tank.noScroll}; grazing: Down next row ${graz.down}, Up back ${graz.up}, Home<=End ${graz.homeEnd}, no scroll ${graz.noScroll}; gain: Down next group ${gain.down}, Up back ${gain.up}, Home<=End ${gain.homeEnd}, no scroll ${gain.noScroll}`);

  // KEEP-04: Escape hides the readout, keeps focus, and the next arrow key resumes; leaving the chart hides it
  await page.reload({ waitUntil: "networkidle" }); await settle(page);
  await tabToChart(page, k0);
  await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft"); const r2 = await snap(page);
  await page.keyboard.press("ArrowLeft"); const r3 = await snap(page); await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape"); const esc = await snap(page);
  await page.keyboard.press("ArrowLeft"); const res = await snap(page);
  await page.keyboard.press("Shift+Tab"); await settle(page, 100); const away = await snap(page);
  check("KEEP-04", esc.hidden && esc.chart === r2.chart && esc.mx === null && !res.hidden && res.text === r3.text && away.hidden && away.chart === null,
    `after Escape: readout hidden ${esc.hidden}, focus still on the chart ${esc.chart === r2.chart}, highlight cleared ${esc.mx === null}; next ArrowLeft shows the reading one step on from where it was ${res.text === r3.text}; Shift+Tab off the chart hides the readout ${away.hidden}`);
  await close();
  if (errs.length) info(`page errors: ${errs.join(" | ")}`);
});

// KEEP-05: every reading of every chart, stepped with the keyboard, keeps its readout inside the window and below the bar
await guard(["KEEP-05"], async () => {
  const lines = [];
  let all = true;
  for (const [w, h] of [[1280, 900], [390, 844], [320, 640]]) {
    const { page, close } = await open(PAGE, { w, h });
    const per = await sweepAll(page);
    if (w === 1280) sweep1280 = per;
    const rs = per.flatMap((p) => p.readings.map((r) => ({ ...r, label: p.label })));
    const out = rs.filter((r) => !inside(r)), offPoint = rs.filter((r) => r.my !== null && (r.my < r.bar || r.my > r.vh));
    const ok = per.every((p) => p.reached) && rs.length > 0 && out.length === 0;
    all &&= ok;
    lines.push(`${w}x${h}: ${rs.length} readings on ${per.length} charts (${per.map((p) => p.readings.length).join("/")}), outside the window or under the bar ${out.length}${out.length ? ` (first: ${out[0].label.slice(0, 24)} "${out[0].text.slice(0, 30)}" box ${Math.round(out[0].l)},${Math.round(out[0].t)}-${Math.round(out[0].r)},${Math.round(out[0].b)} bar ${Math.round(out[0].bar)} window ${out[0].vw}x${out[0].vh})` : ""}; marks off screen while stepping ${offPoint.length}; hostile markup in readouts ${rs.filter((r) => r.bad).length}`);
    await close();
  }
  check("KEEP-05", all, lines.join("; "));
});

// KEEP-34: a keyboard reading follows its chart when the page scrolls, hides while its point is under the bar, and returns
await guard(["KEEP-34"], async () => {
  const lines = []; let all = true;
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const { page, close } = await open(PAGE, { w, h });
    const ks = await focusableCharts(page);
    await tabToChart(page, ks[0]);
    const a = await snap(page);
    await page.evaluate(() => scrollBy({ top: 120, behavior: "instant" })); await settle(page, 150);
    const b = await snap(page);
    await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(), bar = document.querySelector("header").getBoundingClientRect().bottom; scrollBy({ top: r.bottom - (bar - 5), behavior: "instant" }); }); await settle(page, 150);
    const c = await snap(page);
    await page.evaluate(() => document.activeElement.scrollIntoView({ block: "center", behavior: "instant" })); await settle(page, 150);
    const d = await snap(page);
    const moved = b.sy !== a.sy, attached = (s) => s.my !== null && Math.abs(s.t - s.my) < 160;
    const ok = inside(a) && moved && inside(b) && b.text === a.text && attached(b) && c.hidden && c.chart === a.chart && inside(d) && d.text === a.text && attached(d);
    all &&= ok;
    lines.push(`${w}px: page scrolled 120 px: readout stays with its point ${attached(b)} and inside the window ${inside(b)}, same reading ${b.text === a.text}; chart scrolled under the bar: readout hidden ${c.hidden}, focus kept ${c.chart === a.chart}; scrolled back: shown again inside the window ${inside(d)} with the same reading ${d.text === a.text}`);
    await close();
  }
  check("KEEP-34", all, lines.join("; "));
});

// ================================================================ touch
await guard(["KEEP-06"], async () => {
  const { page, ctx, errs, close } = await open(PAGE, { w: 390, h: 844, touch: true });
  const hint = await page.evaluate(() => { const f = document.querySelector("#chart-help .h-fine"), t = document.querySelector("#chart-help .h-touch"); return { fine: f && getComputedStyle(f).display, touch: t && getComputedStyle(t).display, ta: [...new Set([...document.querySelectorAll("svg.chart")].map((s) => getComputedStyle(s).touchAction))].join() }; });
  const center = (sel) => page.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: "center", behavior: "instant" }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, sel);
  const tapAt = async (p) => { await page.touchscreen.tap(p.x, p.y); await settle(page, 200); return snap(page); };
  const tank = await tapAt(await center("#tanks .tank svg.chart circle[r='4']"));
  const gainDot = await tapAt(await center("#gain svg.chart circle[fill='var(--s1)']"));
  const grazBar = await tapAt(await center("#grazing svg.chart rect[fill='var(--s1)']"));
  const mark = await page.evaluate(() => [...document.querySelectorAll("#grazing svg.chart [visibility='visible']")].length);
  const off = await tapAt(await center("#budget h2"));
  // slide a finger along a tank chart (CDP touch events)
  const p = await center("#tanks .tank:nth-child(4) svg.chart circle[r='4']");
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: p.x, y: p.y }] }); await settle(page, 80);
  const s1 = await snap(page);
  for (let i = 1; i <= 8; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: p.x - i * 10, y: p.y }] }); await settle(page, 30); }
  const s2 = await snap(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await settle(page, 150);
  const s3 = await snap(page);
  const ok = hint.fine === "none" && hint.touch !== "none" && hint.ta === "pan-y" && inside(tank) && /%/.test(tank.first) && inside(gainDot) && gainDot.text !== tank.text && inside(grazBar) && grazBar.text !== gainDot.text && mark === 1 && off.hidden && !s1.hidden && !s2.hidden && s2.text !== s1.text && !s3.hidden && !errs.length;
  check("KEEP-06", ok,
    `390x844 hasTouch: hint shows its touch line (fine ${hint.fine}, touch ${hint.touch}); touch-action on every chart: ${hint.ta}; tap a tank's latest point -> readout "${tank.text.slice(0, 34)}" inside window ${inside(tank)}; tap a gain dot -> "${gainDot.text.slice(0, 30)}" inside ${inside(gainDot)}; tap a grazing bar -> "${grazBar.text.slice(0, 30)}" inside ${inside(grazBar)}, one highlight ${mark}; tap outside any chart hides it ${off.hidden}; slide a finger 80 px left along a tank chart: readout changes ${s2.text !== s1.text} ("${s1.text.slice(0, 22)}" -> "${s2.text.slice(0, 22)}") and stays after lifting ${!s3.hidden}; page errors ${errs.length}`);
  await close();
});

// ================================================================ mouse
await guard(["KEEP-07"], async () => {
  const { page, errs, close } = await open(PAGE);
  const pt = (sel) => page.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: "center", behavior: "instant" }); const b = e.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2 }; }, sel);
  const hov = async (p) => { await page.mouse.move(p.x, p.y, { steps: 2 }); await settle(page, 120); return snap(page); };
  const p1 = await pt("#tanks .tank svg.chart circle[r='4']");
  const a = await hov(p1);
  const b = await hov({ x: p1.x - 60, y: p1.y });
  const near = Math.abs(a.l - p1.x) < 320 && Math.abs(a.t - p1.y) < 200;
  const away = await hov({ x: 30, y: p1.y - 150 });
  const g = await hov(await pt("#gain svg.chart circle[fill='var(--s1)']"));
  const gr = await hov(await pt("#grazing svg.chart rect[fill='var(--s1)']"));
  await page.keyboard.press("Escape"); await settle(page, 80); const escd = await snap(page);
  const focusMoved = await page.evaluate(() => document.activeElement.matches("svg.chart"));
  check("KEEP-07", inside(a) && /%/.test(a.first) && near && !b.hidden && b.text !== a.text && away.hidden && inside(g) && g.text !== a.text && inside(gr) && escd.hidden && !focusMoved && !errs.length,
    `1280x900: hover a tank's latest point -> readout "${a.text.slice(0, 34)}" inside window ${inside(a)}, beside the pointer ${near}; 60 px left -> another reading ${b.text !== a.text}; pointer off the chart hides it ${away.hidden}; hover a gain dot -> "${g.text.slice(0, 26)}" inside ${inside(g)}; hover a grazing bar -> "${gr.text.slice(0, 26)}" inside ${inside(gr)}; Escape hides a hover readout ${escd.hidden}; hovering does not move focus ${!focusMoved}`);
  await close();
});

// ================================================================ phone layouts
await guard(["KEEP-08"], async () => {
  const lines = []; let all = true;
  for (const [w, h] of [[390, 844], [320, 640], [1280, 900]]) {
    const { page, close } = await open(PAGE, { w, h, touch: w < 600 });
    const r = await page.evaluate(() => {
      const top = (id) => document.getElementById(id).getBoundingClientRect().top + scrollY;
      const rows = [...document.querySelectorAll("#exceptions tbody tr")], vw = document.documentElement.clientWidth;
      const th = document.querySelector("#exceptions thead"), tb = th?.getBoundingClientRect();
      return {
        summary: top("summary"), attention: top("attention"), tiles: top("tiles"), water: top("water"),
        display: [...new Set(rows.map((x) => getComputedStyle(x).display))],
        radius: Math.min(...rows.map((x) => parseFloat(getComputedStyle(x).borderTopLeftRadius) || 0)),
        rows: rows.length,
        cellsOk: rows.filter((x) => [...x.cells].every((c) => { const b = c.getBoundingClientRect(), rb = x.getBoundingClientRect(); return getComputedStyle(c).display !== "none" && b.width > 0 && b.height > 0 && b.left >= rb.left - 0.5 && b.right <= rb.right + 0.5 && b.left >= 0 && b.right <= vw && c.scrollWidth <= c.clientWidth + 1; })).length,
        theadText: th ? th.textContent.trim().length > 0 : false, theadHidden: tb ? tb.width <= 1 && tb.height <= 1 : false,
      };
    });
    const phone = w < 600;
    const ok = phone
      ? r.summary < r.attention && r.attention < r.tiles && r.attention < r.water && !r.display.includes("table-row") && r.radius > 0 && r.rows === 10 && r.cellsOk === r.rows && r.theadText && r.theadHidden
      : r.tiles < r.attention && r.display.join() === "table-row";
    all &&= ok;
    lines.push(`${w}x${h}: order summary ${Math.round(r.summary)} < attention ${Math.round(r.attention)} vs tiles ${Math.round(r.tiles)}, water ${Math.round(r.water)}; rows ${r.rows} display ${r.display} corner radius ${r.radius}px; rows with every cell visible, inside the row and the window ${r.cellsOk}/${r.rows}; header kept for screen readers ${r.theadText} and visually hidden ${r.theadHidden}`);
    await close();
  }
  check("KEEP-08", all, lines.join("; ") + " (1280 is the contrast case: tiles first, rows as a table)");
});

// KEEP-09: no sideways page scroll from 320 to 1920 px, with the rules opened, and on long-name and hostile data
await guard(["KEEP-09"], async () => {
  const widths = [320, 340, 360, 375, 390, 412, 430, 480, 520, 521, 600, 640, 641, 700, 760, 761, 768, 820, 860, 861, 900, 901, 960, 961, 994, 1024, 1080, 1081, 1100, 1280, 1440, 1600, 1920];
  const bad = [];
  const measure = (page) => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bsw: document.body.scrollWidth }));
  for (const url of ["committed", "longnames", "hostile"]) {
    const { page, close } = url === "committed" ? await open(PAGE, { w: 1280, h: 900 }) : await openCase(url, { w: 1280, h: 900 });
    for (const w of url === "committed" ? widths : [320, 390, 768, 1280]) {
      await resize(page, w, 800);
      await page.evaluate(() => { const d = document.getElementById("rulesMore"); if (d) d.open = true; });
      await settle(page, 60);
      const m = await measure(page);
      if (m.sw > m.cw || m.bsw > m.cw) bad.push(`${url} ${w}px scrollWidth ${m.sw}/${m.cw}`);
    }
    await close();
  }
  check("KEEP-09", bad.length === 0, `${widths.length} widths 320-1920 on the committed data plus 320/390/768/1280 on longnames and hostile, rules opened: pages wider than the window ${bad.length}${bad.length ? ": " + bad.join(", ") : ""}`);
});

// KEEP-10: the budget table fits its card on a phone, and each row still shows its amounts
await guard(["KEEP-10"], async () => {
  const lines = []; let all = true;
  for (const [w, h] of [[390, 844], [320, 640]]) {
    const { page, close } = await open(PAGE, { w, h, touch: true });
    const r = await page.evaluate(() => {
      const t = document.getElementById("budgetTable"), sec = t.closest("section"), cs = getComputedStyle(sec), sr = sec.getBoundingClientRect();
      const right = sr.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth), left = sr.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
      const cells = [...t.querySelectorAll("th, td")].filter((c) => getComputedStyle(c).display !== "none");
      return {
        tl: t.getBoundingClientRect().left, tr: t.getBoundingClientRect().right, left, right, cardL: sr.left + parseFloat(cs.borderLeftWidth), cardR: sr.right - parseFloat(cs.borderRightWidth), vw: document.documentElement.clientWidth,
        clipped: cells.filter((c) => c.scrollWidth > c.clientWidth + 1).map((c) => c.textContent.trim().slice(0, 24)),
        outside: cells.filter((c) => { const b = c.getBoundingClientRect(); return b.right > sr.right - parseFloat(cs.borderRightWidth) + 0.5 || b.left < sr.left - 0.5 || b.right > document.documentElement.clientWidth; }).length,
        amounts: [...t.querySelectorAll("tbody tr, tfoot tr")].map((x) => (x.innerText.match(/[−-]?\$[\d,]+/g) || []).length),
      };
    });
    // the gate is the card and the window; running into the card's padding is reported, not failed
    const ok = r.tr <= r.cardR + 0.5 && r.tl >= r.cardL - 0.5 && r.tr <= r.vw && !r.clipped.length && !r.outside && r.amounts.every((n) => n >= 3);
    all &&= ok;
    lines.push(`${w}px: table ${Math.round(r.tl)}-${Math.round(r.tr)} inside the card ${Math.round(r.cardL)}-${Math.round(r.cardR)} ${ok}; inside the card's content box ${Math.round(r.left)}-${Math.round(r.right)} ${r.tr <= r.right + 0.5}${r.tr > r.right + 0.5 ? ` (runs ${(r.tr - r.right).toFixed(1)} px into the right padding)` : ""}; cells cut off ${r.clipped.length}${r.clipped.length ? " " + JSON.stringify(r.clipped) : ""}; cells outside the card or window ${r.outside}; dollar amounts shown per row ${r.amounts.join("/")}`);
    await close();
  }
  check("KEEP-10", all, lines.join("; "));
});

// KEEP-11: tiles: four tiles, one row on a wide screen, two columns on a phone; nothing cut off; one status icon per tank
await guard(["KEEP-11"], async () => {
  const lines = []; let all = true;
  for (const [w, h] of [[1280, 900], [390, 844], [320, 640]]) {
    const { page, close } = await open(PAGE, { w, h, touch: w < 600 });
    const r = await page.evaluate(() => {
      const t = [...document.querySelectorAll("#tiles .tile")], vw = document.documentElement.clientWidth;
      const pips = document.querySelector("#tiles .pips"), tanks = document.querySelectorAll("#tanks .tank").length;
      const ids = [...document.querySelectorAll("#tanks .tank-name span")].map((s) => s.textContent);
      return {
        n: t.length, lefts: new Set(t.map((x) => Math.round(x.getBoundingClientRect().left))).size, tops: new Set(t.map((x) => Math.round(x.getBoundingClientRect().top))).size,
        inside: t.every((x) => { const b = x.getBoundingClientRect(); return b.left >= 0 && b.right <= vw; }),
        cut: t.filter((x) => x.scrollWidth > x.clientWidth + 1 || [...x.querySelectorAll("*")].some((c) => { const b = c.getBoundingClientRect(), tb = x.getBoundingClientRect(); return b.width > 0 && (b.right > tb.right + 0.5 || b.left < tb.left - 0.5); })).length,
        pipIcons: pips ? pips.querySelectorAll(":scope > * > svg").length : 0, tanks, pipLabel: pips?.getAttribute("aria-label") ?? "", pipRole: pips?.getAttribute("role"),
        labelNamesAll: !!pips && ids.every((id) => pips.getAttribute("aria-label").includes(id)),
      };
    });
    const ok = r.n === 4 && (w >= 994 ? r.lefts === 4 && r.tops === 1 : r.lefts === 2 && r.tops === 2) && r.inside && r.cut === 0 && r.pipIcons === r.tanks && r.pipRole === "img" && r.labelNamesAll;
    all &&= ok;
    lines.push(`${w}px: ${r.n} tiles in ${r.lefts} columns x ${r.tops} rows, inside the window ${r.inside}, tiles with content cut off ${r.cut}; water tile ${r.pipIcons} status icons for ${r.tanks} tanks, role=${r.pipRole}, label names every tank ${r.labelNamesAll}`);
    await close();
  }
  check("KEEP-11", all, lines.join("; "));
});

// KEEP-12: phone touch targets and the rules behind a disclosure
await guard(["KEEP-12"], async () => {
  const { page, close } = await open(PAGE, { w: 390, h: 844, touch: true });
  const r = await page.evaluate(() => {
    const nav = [...document.querySelectorAll("header nav a")].map((a) => a.getBoundingClientRect().height);
    const chips = [...document.querySelectorAll("#chips button")], cr = chips.map((c) => c.getBoundingClientRect());
    const d = document.getElementById("rulesMore"), s = d.querySelector("summary");
    return { nav: Math.min(...nav), chips: Math.min(...cr.map((b) => b.height)), cols: new Set(cr.map((b) => Math.round(b.left))).size, open: d.open, sum: s.getBoundingClientRect().height, rulesShown: document.getElementById("rules").checkVisibility() };
  });
  await page.evaluate(() => document.querySelector("#rulesMore summary").scrollIntoView({ block: "center", behavior: "instant" }));
  const sb = await page.locator("#rulesMore summary").boundingBox();
  await page.touchscreen.tap(sb.x + sb.width / 2, sb.y + sb.height / 2); await settle(page, 200);
  const after = await page.evaluate(() => ({ open: document.getElementById("rulesMore").open, rows: document.querySelectorAll("#rules tbody tr").length, h: document.getElementById("rules").checkVisibility() ? document.getElementById("rules").getBoundingClientRect().height : 0 }));
  await page.reload({ waitUntil: "networkidle" }); await settle(page);
  await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
  await page.locator('header nav a[href="#rules-sec"]').tap(); await settle(page, 300);
  const viaLink = await page.evaluate(() => document.getElementById("rulesMore").open);
  await resize(page, 320, 640);
  const c320 = await page.evaluate(() => new Set([...document.querySelectorAll("#chips button")].map((c) => Math.round(c.getBoundingClientRect().left))).size);
  await close();
  const wide = await open(PAGE);
  const w = await wide.page.evaluate(() => ({ open: document.getElementById("rulesMore").open, sum: getComputedStyle(document.querySelector("#rulesMore summary")).display }));
  await wide.close();
  check("KEEP-12", r.nav >= 44 && r.chips >= 42 && r.cols === 3 && c320 === 2 && !r.open && r.sum >= 44 && r.rulesShown === false && after.open && after.rows > 0 && after.h > 0 && viaLink && w.open && w.sum === "none",
    `390px: nav links at least ${r.nav}px tall, chips at least ${r.chips}px tall in ${r.cols} columns (320px: ${c320} columns); rules closed at first ${!r.open} and not rendered ${r.rulesShown === false}, toggle ${r.sum}px tall; tapping it opens ${after.rows} rule rows ${after.open}; the top-bar Rules link opens it ${viaLink}; 1280px: open ${w.open}, toggle hidden ${w.sum === "none"}`);
});

// ================================================================ tank cards
await guard(["KEEP-13"], async () => {
  const lines = []; let all = true;
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const { page, close } = await open(PAGE, { w, h, touch: w < 600 });
    const ids = new Set([...(await distinct(page, "water", "tank_id")) ?? [], ...(await distinct(page, "tanks", "tank_id")) ?? []]);
    const cards = await page.evaluate(() => [...document.querySelectorAll("#tanks .tank")].map((c) => {
      const pill = c.querySelector(".tank-head .pill"), lvl = c.querySelector(".tank-level b");
      return {
        state: [...c.classList].filter((x) => x !== "tank"), id: c.querySelector(".tank-name span")?.textContent.trim(), name: c.querySelector(".tank-name b")?.textContent.trim(),
        pill: pill ? [...pill.classList].filter((x) => x !== "pill") : null, icon: !!pill?.querySelector("svg"), word: pill?.textContent.trim() ?? "",
        level: lvl?.textContent.trim() ?? "", when: c.querySelector(".tank-level span")?.textContent.trim() ?? "", charts: c.querySelectorAll("svg.chart").length, nameH: Math.round(c.querySelector(".tank-name b")?.getBoundingClientRect().height ?? 0),
      };
    }));
    const list = await listRows(page);
    const named = new Set([...ids].filter((id) => list.some((r) => r.area === "Water" && new RegExp(`\\b${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(r.subject))));
    const rank = { critical: 0, serious: 1, warning: 2, good: 4 };
    const st = (c) => c.state[0];
    const known = cards.filter((c) => st(c) in rank);
    const orderOk = known.every((c, i) => i === 0 || rank[st(c)] >= rank[st(known[i - 1])]) && cards.every((c, i) => st(c) in rank || cards.slice(0, i).every((p) => st(p) !== "good"));
    const tieOk = cards.every((c, i) => i === 0 || st(c) !== st(cards[i - 1]) || cards[i - 1].id.localeCompare(c.id, "en", { numeric: true }) < 0);
    const notGood = new Set(cards.filter((c) => st(c) !== "good").map((c) => c.id));
    const ok = cards.length === ids.size && new Set(cards.map((c) => c.id)).size === cards.length && cards.every((c) => ids.has(c.id) && c.name && c.pill && c.icon && c.word && c.pill.join() === c.state.join() && /^(\d+(\.\d+)?%|\S+)$/.test(c.level) && !/NaN|undefined/.test(c.level) && /^(at |last heard )\S/.test(c.when) && c.charts === 1)
      && orderOk && tieOk && [...notGood].sort().join() === [...named].sort().join() && new Set(cards.map((c) => c.nameH)).size === 1;
    all &&= ok;
    lines.push(`${w}px: ${cards.length} cards for ${ids.size} tank ids in the data; order ${cards.map((c) => `${c.id}:${st(c)}`).join(" ")}; worst first ${orderOk}, same state by tank number ${tieOk}; pills with icon and word ${cards.filter((c) => c.icon && c.word).length}/${cards.length} (${[...new Set(cards.map((c) => c.word))].join(", ")}), pill state = card state ${cards.every((c) => c.pill?.join() === c.state.join())}; levels ${cards.map((c) => c.level).join(" ")}; times ${cards.map((c) => c.when).join(", ")}; one chart per card ${cards.every((c) => c.charts === 1)}; cards not OK ${[...notGood].sort()} = tanks named in Water rows ${[...named].sort()}; tank names one line ${new Set(cards.map((c) => c.nameH)).size === 1}`);
    await close();
  }
  check("KEEP-13", all, lines.join("; "));
});

// ================================================================ budget table
const BT = () => {
  const t = document.getElementById("budgetTable");
  const body = [...(t.tBodies[0]?.rows ?? [])], foot = [...(t.tFoot?.rows ?? [])];
  const row = (r) => {
    const tr = r.querySelectorAll(".track"), track = tr[0], bar = r.querySelector(".track .bar"), val = r.querySelector(".track .val"), cell = track?.closest("td"), name = r.cells[0];
    const cb = cell?.getBoundingClientRect(), kb = track?.getBoundingClientRect(), bb = bar?.getBoundingClientRect(), vb = val?.getBoundingClientRect(), nb = name.getBoundingClientRect();
    const zero = kb ? kb.left + kb.width / 2 : null;
    const pill = name.querySelector(".pill");
    return {
      first: name.textContent.trim(), tracks: tr.length, bars: r.querySelectorAll(".track .bar").length,
      barSev: bar ? ["critical", "serious", "warning"].filter((s) => bar.classList.contains(s)) : [],
      side: bb ? (bb.left >= zero - 1 ? "right" : bb.right <= zero + 1 ? "left" : "both") : "none", barW: bb ? +bb.width.toFixed(1) : 0,
      valIn: vb && cb ? vb.left >= cb.left - 0.5 && vb.right <= cb.right + 0.5 : false, valOverName: vb ? vb.left < nb.right - 0.5 && vb.right > nb.left : false,
      pill: pill ? { cls: [...pill.classList].filter((x) => x !== "pill"), icon: !!pill.querySelector("svg"), word: pill.textContent.trim() } : null,
      budget: r.querySelector(".c-budget")?.textContent ?? "", actual: r.querySelector(".c-actual")?.textContent ?? "", diff: r.cells[r.cells.length - 1].textContent.trim(),
      attrs: [...r.querySelectorAll("*")].flatMap((e) => [...e.attributes].map((a) => a.value)).filter((v) => /NaN|Infinity/.test(v)).length,
    };
  };
  return { head: !!t.tHead, body: body.map(row), foot: foot.map(row), text: t.innerText, legend: [...document.querySelectorAll("#budgetLegend > *")].map((e) => ({ icon: !!e.querySelector("svg"), key: !!e.querySelector(".key"), text: e.textContent.trim(), keyColor: e.querySelector(".key") ? getComputedStyle(e.querySelector(".key")).backgroundColor : null })), unflaggedBar: (() => { const b = [...t.querySelectorAll("tbody .bar")].find((x) => !/critical|serious|warning/.test(x.className)); return b ? getComputedStyle(b).backgroundColor : null; })() };
};
await guard(["KEEP-14", "KEEP-15", "KEEP-16", "KEEP-17"], async () => {
  const lines14 = [], lines15 = []; let ok14 = true, ok15 = true, t1280 = null, list1280 = null;
  for (const [w, h] of [[1280, 900], [390, 844], [320, 640]]) {
    const { page, close } = await open(PAGE, { w, h, touch: w < 600 });
    const cats = await distinct(page, "budget", "category");
    const t = await page.evaluate(BT), list = await listRows(page);
    if (w === 1280) { t1280 = t; list1280 = list; }
    // KEEP-14
    const sideOk = t.body.every((r) => { const d = money(r.diff); return d > 0 ? r.side === "right" : d < 0 ? r.side === "left" : r.bars === 0; });
    const ok = t.head && t.body.length === cats.length && t.foot.length === 1 && t.body.every((r) => r.tracks === 1 && r.bars <= 1 && r.valIn && !r.valOverName) && sideOk && cats.every((c) => t.body.filter((r) => r.first.startsWith(c)).length >= 1);
    ok14 &&= ok;
    lines14.push(`${w}px: thead ${t.head}, ${t.body.length} body rows for ${cats.length} categories, ${t.foot.length} total row; one bar track per row ${t.body.every((r) => r.tracks === 1)}; bar on the side of zero that matches the sign of Difference ${sideOk} (${t.body.map((r) => `${r.diff}:${r.side}`).join(" ")}); % labels inside their cell ${t.body.every((r) => r.valIn)} and off the category name ${t.body.every((r) => !r.valOverName)}`);
    // KEEP-15
    const flagged = list.filter((r) => r.area === "Budget");
    const per = flagged.map((f) => { const m = t.body.filter((r) => r.first.startsWith(f.subject)); const r = m[0]; return { subj: f.subject, sev: f.sev, rows: m.length, pill: r?.pill, bar: r?.barSev, word: f.word }; });
    const okF = per.every((p) => p.rows === 1 && p.pill && p.pill.cls.includes(p.sev) && p.pill.icon && p.pill.word === p.word && p.bar.join() === p.sev)
      && t.body.filter((r) => !flagged.some((f) => r.first.startsWith(f.subject))).every((r) => !r.pill && r.barSev.length === 0) && flagged.length > 0;
    ok15 &&= okF;
    lines15.push(`${w}px: Budget rows in the list ${flagged.length}: ${per.map((p) => `${p.subj} list ${p.sev} -> table pill ${p.pill?.cls} icon ${p.pill?.icon} word "${p.pill?.word}" (list badge "${p.word}"), bar colour ${p.bar}`).join("; ")}; rows the list does not flag carry no pill and no status colour ${t.body.filter((r) => !flagged.some((f) => r.first.startsWith(f.subject))).every((r) => !r.pill && r.barSev.length === 0)}`);
    await close();
  }
  check("KEEP-14", ok14, lines14.join("; "));
  check("KEEP-15", ok15, lines15.join("; "));
  // KEEP-16: the season-total row adds up the category rows
  const sb = t1280.body.reduce((s, r) => s + money(r.budget), 0), sa = t1280.body.reduce((s, r) => s + money(r.actual), 0), f = t1280.foot[0];
  const fb = money(f.budget), fa = money(f.actual), fd = money(f.diff);
  check("KEEP-16", t1280.foot.length === 1 && fb === sb && fa === sa && fd === sa - sb && f.tracks === 1,
    `total row "${f.first.slice(0, 13)}": budget ${fb} = sum ${sb} ${fb === sb}; actual ${fa} = sum ${sa} ${fa === sa}; difference ${fd} = ${sa - sb} ${fd === sa - sb}; it has its own bar track ${f.tracks === 1} (side ${f.side})`);
  // KEEP-17: the budget legend names each status the table uses, with its icon, and the quiet key for rows not flagged
  const used = [...new Set(t1280.body.flatMap((r) => r.pill?.cls ?? []))];
  const L = t1280.legend;
  const okL = L.length >= 2 && L.every((e) => (e.icon || e.key) && e.text) && used.every((s) => L.some((e) => e.icon && e.text.toLowerCase().includes(s))) && L.some((e) => e.key && e.keyColor === t1280.unflaggedBar);
  check("KEEP-17", okL, `#budgetLegend entries ${L.length}: ${L.map((e) => `[${e.icon ? "icon" : e.key ? "key" : "none"}] ${e.text}`).join(" | ")}; statuses used by table pills ${used} each named with an icon ${used.every((s) => L.some((e) => e.icon && e.text.toLowerCase().includes(s)))}; the plain key matches the colour of unflagged bars ${L.some((e) => e.key && e.keyColor === t1280.unflaggedBar)}`);
});

// KEEP-18: a $0 budget, and a season with no budget at all, draw no NaN or Infinity and keep labels in their cells
await guard(["KEEP-18"], async () => {
  const lines = []; let all = true;
  for (const c of ["zerobudget", "allzerobudget"]) for (const [w, h] of [[1280, 900], [320, 640]]) {
    const { page, errs, close } = await openCase(c, { w, h });
    const t = await page.evaluate(BT);
    const rows = [...t.body, ...t.foot];
    const noBar = rows.filter((r) => r.bars === 0 && money(r.budget) === 0 && r.budget !== "").length;
    const ok = !/NaN|Infinity/.test(t.text) && rows.every((r) => r.attrs === 0 && r.tracks === 1 && r.valIn) && !errs.length;
    all &&= ok;
    lines.push(`${c} ${w}px: NaN/Infinity in table text ${/NaN|Infinity/.test(t.text)}, in attributes ${rows.reduce((s, r) => s + r.attrs, 0)}; $0-budget rows drawn without a bar ${noBar}; labels inside cells ${rows.every((r) => r.valIn)}; page errors ${errs.length}`);
    await close();
  }
  check("KEEP-18", all, lines.join("; "));
});

// ================================================================ responsive charts
const CHARTS = () => [...document.querySelectorAll("svg.chart")].map((s) => {
  const r = s.getBoundingClientRect(), k = r.width / s.viewBox.baseVal.width;
  const texts = [...s.querySelectorAll("text")].filter((t) => t.textContent.trim());
  const px = texts.map((t) => parseFloat(getComputedStyle(t).fontSize) * k);
  const boxes = texts.map((t) => t.getBoundingClientRect());
  const ov = [];
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) ov.push(`${texts[i].textContent} / ${texts[j].textContent}`);
  }
  return { label: s.getAttribute("aria-label").slice(0, 22), vb: s.viewBox.baseVal.width, w: +r.width.toFixed(2), min: Math.min(...px), n: texts.length, ov };
});
await guard(["KEEP-19", "KEEP-21", "KEEP-22"], async () => {
  const l19 = [], l21 = [], l22 = []; let ok19 = true, ok21 = true, ok22 = true;
  const { page, close } = await open(PAGE);
  for (const [w, h] of [[320, 640], [390, 844], [768, 900], [1280, 900], [1920, 1080]]) {
    await resize(page, w, h);
    const c = await page.evaluate(CHARTS);
    const off = c.filter((x) => Math.abs(x.vb - x.w) > 1);
    ok19 &&= c.length === 10 && !off.length;
    l19.push(`${w}px: ${c.length} charts, viewBox width within 1 px of drawn width on ${c.length - off.length}`);
    const min = Math.min(...c.map((x) => x.min));
    ok21 &&= min >= 11 - 0.01;
    l21.push(`${w}px: smallest rendered chart text ${min.toFixed(2)} px over ${c.reduce((s, x) => s + x.n, 0)} labels`);
    const ov = c.flatMap((x) => x.ov.map((o) => `${x.label}: ${o}`));
    ok22 &&= !ov.length;
    l22.push(`${w}px: overlapping label pairs ${ov.length}${ov.length ? " " + JSON.stringify(ov.slice(0, 4)) : ""}`);
  }
  await close();
  for (const [w, h] of [[320, 640], [1280, 900]]) {
    const { page, close } = await openCase("longnames", { w, h });
    const c = await page.evaluate(CHARTS);
    const ov = c.flatMap((x) => x.ov.map((o) => `${x.label}: ${o}`));
    const g = await page.evaluate(() => { const s = document.querySelector("#grazing svg"); return { lab: Math.max(...[...s.querySelectorAll("text.hd")].map((t) => t.getBBox().x + t.getBBox().width)), bar: Math.min(...[...s.querySelectorAll("rect[rx='4']")].map((r) => r.getBBox().x)) }; });
    ok22 &&= !ov.length && g.lab <= g.bar;
    l22.push(`longnames ${w}px: overlapping pairs ${ov.length}${ov.length ? " " + JSON.stringify(ov.slice(0, 3)) : ""}, grazing names end at ${g.lab.toFixed(0)} before the first bar at ${g.bar.toFixed(0)}`);
    await close();
  }
  check("KEEP-19", ok19, l19.join("; "));
  check("KEEP-21", ok21, l21.join("; "));
  check("KEEP-22", ok22, l22.join("; "));
});

// KEEP-20: a new window size redraws every chart at its new width and keeps the keyboard reading
await guard(["KEEP-20"], async () => {
  const { page, close } = await open(PAGE);
  const kGain = await page.evaluate(() => [...document.querySelectorAll("svg.chart")].findIndex((s) => s.closest("#gain")));
  await tabToChart(page, kGain);
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
  const before = await snap(page);
  await page.evaluate(() => { document.querySelectorAll("svg.chart").forEach((s) => (s.__old = 1)); });
  await resize(page, 390, 844);
  const after = await snap(page);
  const r = await page.evaluate(() => ({ fresh: [...document.querySelectorAll("svg.chart")].every((s) => !s.__old), fit: [...document.querySelectorAll("svg.chart")].every((s) => Math.abs(s.viewBox.baseVal.width - s.getBoundingClientRect().width) <= 1), focusFresh: !document.activeElement.__old, vals: [...document.querySelectorAll("#budgetTable .track[data-p]")].every((t) => { const v = t.querySelector(".val").getBoundingClientRect(), c = t.closest("td").getBoundingClientRect(); return v.left >= c.left - 0.5 && v.right <= c.right + 0.5; }) }));
  await page.keyboard.press("Escape");
  await resize(page, 1280, 900);
  const dismissed = await snap(page);
  check("KEEP-20", r.fresh && r.fit && r.focusFresh && after.chart === before.chart && after.text === before.text && inside(after) && r.vals && dismissed.hidden && dismissed.chart === before.chart,
    `1280 -> 390: every chart replaced ${r.fresh} and drawn at its new width ${r.fit}; focus on the redrawn chart of the same name ${after.chart === before.chart && r.focusFresh}; same reading "${after.text.slice(0, 28)}" ${after.text === before.text}, inside the window ${inside(after)}; budget labels re-placed inside cells ${r.vals}; after Escape, 390 -> 1280 keeps it dismissed ${dismissed.hidden} with focus kept ${dismissed.chart === before.chart}`);
  await close();
});

// KEEP-23: an outage draws a broken line
await guard(["KEEP-23"], async () => {
  const count = (page) => page.evaluate(() => { const s = [...document.querySelectorAll("#tanks svg.chart")].find((x) => /^Tank T1 /.test(x.getAttribute("aria-label"))); const p = [...s.querySelectorAll("path[fill='none']")].map((x) => x.getBBox()).sort((a, b) => a.x - b.x); return { n: p.length, gap: p.length > 1 ? +(p[1].x - (p[0].x + p[0].width)).toFixed(1) : 0, w: s.viewBox.baseVal.width }; });
  const g = await openCase("gap"), base = await open(PAGE);
  const a = await count(g.page), b = await count(base.page);
  await g.page.setViewportSize({ width: 390, height: 844 }); await settle(g.page, 450);
  const c = await count(g.page);
  await g.close(); await base.close();
  // the 12-hour threshold: built in the browser in either mode (no prebuilt folder)
  const g12 = await open(PAGE, { route: routeEdits(CASES.gap12) }), g18 = await open(PAGE, { route: routeEdits(CASES.gap18) });
  const d = await count(g12.page), e = await count(g18.page);
  await g12.close(); await g18.close();
  check("KEEP-23", a.n === 2 && b.n === 1 && c.n === 2 && a.gap > 0 && c.gap > 0 && d.n === 1 && e.n === 2, `gap case (T1 silent Sep 26 00:00 to Sep 27 12:00): T1 line in ${a.n} pieces with a ${a.gap} px break at 1280 (chart ${a.w} wide) and ${c.n} pieces with a ${c.gap} px break at 390; committed data: ${b.n} piece; a 12-hour gap (gap12): ${d.n} piece(s), expected 1; an 18-hour gap (gap18): ${e.n} piece(s), expected 2`);
});

// KEEP-24: animals the warning rule flags are marked on the gain chart by a shape as well as a colour, and their
// readouts say so with an icon and words. Changed by the follow-up pull request of 06-phase1-spec.md section 15: it
// used to count the chart's circles and find the flagged ones by fill alone. It now counts every mark drawn in a legend
// key's colour (the plain dots and the flagged marks), at 1280 x 900, 390 x 844 with touch and 320 x 640 with touch. At
// each size the flagged marks must differ in shape from the plain marks, and each legend key must have the shape of the
// marks in its colour. What it judges: each mark element's own fill geometry, not its element name or the text of a
// style (nine points of its box tested with the browser's isPointInFill, in the chart's coordinates, so a transform
// counts), and each legend key's own box and border radii in px. A shape is "round" when the points near its box's
// corners fall outside it and the points on the diagonals, 85% of the way out to the circle that fits the box, fall
// inside; it has "corners" when the points near its box's corners fall inside; anything else (a diamond, say) is
// "other" and fails. A mark with its own clip-path or mask, or a key with its own clip-path, mask or transform, is "not
// judged" and fails too. What it does not see: whether a mark or key can be seen at all. Its own or a parent's opacity,
// filter or CSS visibility, or a mark's fill-opacity, can hide the flagged marks or the flag key and the check still
// passes (a visibility attribute on the mark itself drops it from the count, and display none leaves no fill to test,
// so those fail). Nor does it see a mark's stroke; clips or masks on its ancestors; shapes painted on top of a mark; a
// key's background image or a clip on its wrapper. It counts only shape elements, so marks drawn with <use> are not
// counted and the check fails. A reviewer still looks at the gain chart and its legend.
const gainShapes = () => {
  // the shape of a box's fill: points 12% of the box's smaller side in from each of its corners, its centre, and
  // points on its diagonals 85% of the way out to the ellipse that fits it
  const classify = (inFill, x, y, w, h) => {
    if (!(w > 0 && h > 0) || !inFill(x + w / 2, y + h / 2)) return "other";
    const t = 0.12 * Math.min(w, h), d = 0.85 * Math.SQRT1_2;
    const near = [[x + t, y + t], [x + w - t, y + t], [x + t, y + h - t], [x + w - t, y + h - t]].filter(([a, b]) => inFill(a, b)).length;
    const diag = [[-1, -1], [1, -1], [-1, 1], [1, 1]].filter(([a, b]) => inFill(x + (w / 2) * (1 + a * d), y + (h / 2) * (1 + b * d))).length;
    return near === 4 ? "corners" : near === 0 && diag === 4 ? "round" : "other";
  };
  const unjudged = (c, props) => props.filter((p) => (c[p] ?? "none") !== "none").map((p) => `${p} ${c[p]}`).join("; ");
  // a key's fill: its border box with its corner radii in px (a percentage is that share of the box's width, or of its
  // height for a vertical radius; radii too large for a side are scaled down together, as CSS draws them)
  const keyShape = (k) => {
    const c = getComputedStyle(k), no = unjudged(c, ["clipPath", "maskImage", "webkitMaskImage", "transform"]);
    if (no) return `not judged (${no})`;
    const { width: w, height: h } = k.getBoundingClientRect();
    const len = (v, side) => (v.endsWith("%") ? (parseFloat(v) / 100) * side : parseFloat(v) || 0);
    const R = ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map((corner) => { const [rh, rv = rh] = c[`border${corner}Radius`].split(" "); return [len(rh, w), len(rv, h)]; });
    const f = Math.min(1, w / (R[0][0] + R[1][0]), w / (R[3][0] + R[2][0]), h / (R[0][1] + R[3][1]), h / (R[1][1] + R[2][1]));
    const inFill = (x, y) => x >= 0 && y >= 0 && x <= w && y <= h && R.every(([rh, rv], i) => {
      const dx = i === 0 || i === 3 ? x : w - x, dy = i < 2 ? y : h - y, a = rh * f, b = rv * f;
      return !(dx < a && dy < b) || ((dx - a) / a) ** 2 + ((dy - b) / b) ** 2 <= 1;
    });
    return classify(inFill, 0, 0, w, h);
  };
  // the legend's filled keys, found by their background colour (the target and reference line keys have none; a key
  // drawn as an SVG or by its border would not be found, and the check would fail)
  const keys = [...document.querySelectorAll("#gain-sec .legend .key")].map((k) => ({ fill: getComputedStyle(k).backgroundColor, shape: keyShape(k) }))
    .filter((k) => k.fill !== "rgba(0, 0, 0, 0)");
  // a mark is a filled shape in a key's colour (not the hidden highlight ring, nor the group badge in another colour)
  const s = document.querySelector("#gain svg.chart"), toChart = s.getScreenCTM().inverse();
  const marks = [...s.querySelectorAll("*")].filter((m) => m instanceof SVGGeometryElement && m.tagName !== "line" && m.getAttribute("visibility") === null && keys.some((k) => k.fill === getComputedStyle(m).fill));
  // a mark's shape, as drawn: its box in the chart's coordinates, each point mapped back into the mark's own
  const markShape = (m) => {
    const no = unjudged(getComputedStyle(m), ["clipPath", "maskImage", "webkitMaskImage"]);
    if (no) return `not judged (${no})`;
    const M = toChart.multiply(m.getScreenCTM()), back = M.inverse(), b = m.getBBox();
    const p = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => new DOMPoint(x, y).matrixTransform(M));
    const xs = p.map((q) => q.x), ys = p.map((q) => q.y), x0 = Math.min(...xs), y0 = Math.min(...ys);
    return classify((x, y) => m.isPointInFill(new DOMPoint(x, y).matrixTransform(back)), x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0);
  };
  const counts = {};
  for (const m of marks) { const c = (counts[getComputedStyle(m).fill] ??= { n: 0, shapes: {} }), sh = markShape(m); c.n++; c.shapes[sh] = (c.shapes[sh] ?? 0) + 1; }
  return { counts, keys, total: marks.length };
};
await guard(["KEEP-24"], async () => {
  // the list rows and the keyboard readouts at 1280 x 900 (KEEP-05's sweep); the marks and keys at each of three sizes
  let list = [];
  const sizes = [];
  for (const [w, h, touch] of [[1280, 900, false], [390, 844, true], [320, 640, true]]) {
    const { page, close } = await open(PAGE, { w, h, touch });
    if (w === 1280) list = await listRows(page);
    sizes.push({ at: `${w}x${h}${touch ? " touch" : ""}`, r: await page.evaluate(gainShapes) });
    await close();
  }
  const gainRows = list.filter((x) => x.area === "Gain" && x.sev === "warning");
  const listTags = new Set(gainRows.flatMap((x) => x.text.match(/\b[A-Z]\d{3}\b/g) ?? []));
  const gainSweep = sweep1280.find((p) => /^Average daily gain/.test(p.label))?.readings ?? [];
  const flaggedReadouts = gainSweep.filter((x) => x.flag);
  const readTags = new Set(flaggedReadouts.map((x) => (x.tl.match(/\b[A-Z]\d{3}\b/) ?? [""])[0]));
  // at each size: the plain colour is the most common mark colour; the flag colours are the other key colours used by
  // marks. Each colour's marks must share one shape, round or with corners; the flagged shape must differ from the plain
  // one, and each key must have the shape of its colour's marks
  const judge = ({ at, r }) => {
    const [plain, plainC] = Object.entries(r.counts).sort((a, b) => b[1].n - a[1].n)[0] ?? ["", { n: 0, shapes: {} }];
    const flagColors = Object.keys(r.counts).filter((c) => c !== plain), flagN = flagColors.reduce((s, c) => s + r.counts[c].n, 0);
    const shapeOf = (c) => Object.keys(r.counts[c]?.shapes ?? {}).join("+") || "none", judged = (sh) => sh === "round" || sh === "corners";
    const plainShape = shapeOf(plain), flagShapes = flagColors.map(shapeOf);
    const shapeDiffers = judged(plainShape) && flagShapes.length > 0 && flagShapes.every((sh) => judged(sh) && sh !== plainShape);
    const plainKey = r.keys.find((k) => k.fill === plain), flagKeys = flagColors.map((c) => r.keys.find((k) => k.fill === c));
    const keysMatch = judged(plainKey?.shape) && plainKey.shape === plainShape && flagKeys.length > 0 && flagKeys.every((k, i) => judged(k?.shape) && k.shape === flagShapes[i]);
    const ok = flagN === listTags.size && shapeDiffers && keysMatch && r.total === gainSweep.length;
    return { ok, text: `at ${at}: ${r.total} marks in a legend colour, ${plainC.n} plain (${plainShape}), ${flagN} flagged (${flagShapes.join(",") || "none"}), flagged marks differ in shape from the plain marks ${shapeDiffers}; legend keys: plain ${plainKey?.shape ?? "missing"}, flag ${flagKeys.map((k) => k?.shape ?? "missing").join(",") || "missing"}, each the shape of its colour's marks ${keysMatch}` };
  };
  const per = sizes.map(judge);
  const words = flaggedReadouts.every((x) => x.flagIcon && x.flagText.length > 3);
  const ok = listTags.size > 0 && flaggedReadouts.length === listTags.size && [...readTags].sort().join() === [...listTags].sort().join() && words && per.every((p) => p.ok);
  check("KEEP-24", ok, `gain chart ${per.map((p) => p.text).join("; ")}; Gain warning rows name ${listTags.size} tags ${[...listTags].join(",")}; keyboard readouts with a flag line ${flaggedReadouts.length}, tags ${[...readTags].sort().join(",")}, each with an icon and words ${words} ("${flaggedReadouts[0]?.flagText ?? ""}"); every mark reachable by keyboard ${gainSweep.length}/${sizes[0].r.total}`);
});

// ================================================================ loading, failure, guards
// KEEP-25: the summary card says the report is loading until the data arrives; meanwhile no tile, chip or list row is
// drawn and nothing reads as zero or all clear
await guard(["KEEP-25"], async () => {
  const { page, close } = await open(PAGE, { wait: "commit", noWait: true, route: (p) => p.route("**/data/*.csv", async (r) => { await new Promise((ok) => setTimeout(ok, 3000)); r.continue(); }) });
  await page.waitForTimeout(1000);
  const at1 = await page.evaluate(() => ({ text: document.body.innerText, rows: document.querySelectorAll("#exceptions tbody tr").length, live: document.getElementById("summary").getAttribute("aria-live"),
    summary: document.getElementById("summary").innerText, tiles: document.querySelectorAll("#tiles .tile").length, chips: document.querySelectorAll("#chips button").length }));
  await page.waitForLoadState("networkidle"); await settle(page, 400);
  const done = await page.evaluate(() => ({ loading: /loading/i.test(document.body.innerText), rows: document.querySelectorAll("#exceptions tbody tr").length }));
  check("KEEP-25", /loading/i.test(at1.summary) && at1.tiles === 0 && at1.chips === 0 && at1.rows === 0 && !/Nothing needs attention|\b0 items?\b/i.test(at1.text) && !done.loading && done.rows > 0,
    `every CSV delayed 3 s: at 1 s summary "${at1.summary.trim().slice(0, 30)}", tiles ${at1.tiles}, chips ${at1.chips}, first line with "loading" on the page ("${(at1.text.match(/[^\n]*loading[^\n]*/i) ?? [""])[0].trim().slice(0, 40)}"), list rows ${at1.rows}, all-clear or zero count shown ${/Nothing needs attention|\b0 items?\b/i.test(at1.text)}, summary aria-live=${at1.live}; after load: loading text gone ${!done.loading}, rows ${done.rows}`);
  await close();
});

// KEEP-26: a failed load says so in plain words instead of leaving a blank or loading page
await guard(["KEEP-26"], async () => {
  const FAIL = /(did ?n['’]?t|could ?n['’]?t|could not|not) (be )?load/i;
  const lines = []; let all = true;
  const cases = [
    ["budget.csv 404 (case missing)", "missing", null],
    ["water.csv aborted", null, (p) => p.route("**/data/water.csv", (r) => r.abort())],
    ["health.csv 404", null, (p) => p.route("**/data/health.csv", (r) => r.fulfill({ status: 404, body: "" }))],
  ];
  for (const [name, kase, route] of cases) {
    const { page, errs, close } = kase ? await openCase(kase) : await open(PAGE, { route });
    const r = await page.evaluate((src) => {
      const t = document.body.innerText, b = [...document.querySelectorAll("button")].find((x) => x.offsetParent);
      return { msg: (t.match(new RegExp(src, "i")) ?? [""])[0], line: t.split("\n").find((l) => new RegExp(src, "i").test(l)) ?? "", loading: /loading/i.test(t), len: t.trim().length, btn: b ? { text: b.textContent.trim(), h: b.getBoundingClientRect().height } : null };
    }, FAIL.source);
    const ok = !!r.msg && !r.loading && r.len > 0;
    all &&= ok;
    lines.push(`${name}: message "${r.line.trim().slice(0, 50)}" ${!!r.msg}, loading text left ${r.loading}; retry button ${r.btn ? `"${r.btn.text}" ${Math.round(r.btn.h)}px` : "none"}; uncaught page errors ${errs.length}`);
    await close();
  }
  const sw = await openCase("singleweigh");
  const s = await sw.page.evaluate(() => ({ text: document.getElementById("summary").innerText.replace(/\s+/g, " ").trim(), loading: /loading/i.test(document.body.innerText) }));
  await sw.close();
  all &&= s.text.length > 0 && !s.loading;
  lines.push(`singleweigh (the rules throw): summary "${s.text.slice(0, 70)}", loading text left ${s.loading}`);
  check("KEEP-26", all, lines.join("; "));
});

// KEEP-27: each section is drawn in its own guard: a throw in one leaves the others drawn
await guard(["KEEP-27"], async () => {
  const SECTIONS = { exceptions: "list rows", tiles: "tiles", tanks: "tank cards", grazing: "grazing chart", gain: "gain chart", budgetTable: "budget rows", rules: "rule rows" };
  const inject = (target) => {
    const boom = (el) => { if (el && el.id === target) throw new Error(`injected failure in #${target}`); };
    const ih = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    Object.defineProperty(Element.prototype, "innerHTML", { configurable: true, get() { return ih.get.call(this); }, set(v) { boom(this); ih.set.call(this, v); } });
    const rc = Element.prototype.replaceChildren;
    Element.prototype.replaceChildren = function (...a) { boom(this); return rc.apply(this, a); };
    const iah = Element.prototype.insertAdjacentHTML;
    Element.prototype.insertAdjacentHTML = function (...a) { boom(this); return iah.apply(this, a); };
    const cw = Object.getOwnPropertyDescriptor(Element.prototype, "clientWidth");
    Object.defineProperty(Element.prototype, "clientWidth", { configurable: true, get() { boom(this); return cw.get.call(this); } });
    for (const m of ["append", "prepend"]) { const f = Element.prototype[m]; Element.prototype[m] = function (...a) { boom(this); return f.apply(this, a); }; }
    const ac = Node.prototype.appendChild;
    Node.prototype.appendChild = function (c) { boom(this); return ac.call(this, c); };
    const tc = Object.getOwnPropertyDescriptor(Node.prototype, "textContent");
    Object.defineProperty(Node.prototype, "textContent", { configurable: true, get() { return tc.get.call(this); }, set(v) { boom(this); tc.set.call(this, v); } });
  };
  const COUNT = () => ({
    exceptions: document.querySelectorAll("#exceptions tbody tr").length, tiles: document.querySelectorAll("#tiles .tile").length, tanks: document.querySelectorAll("#tanks .tank").length,
    grazing: document.querySelectorAll("#grazing svg.chart").length, gain: document.querySelectorAll("#gain svg.chart").length, budgetTable: document.querySelectorAll("#budgetTable tbody tr").length,
    rules: document.querySelectorAll("#rules tbody tr").length, summary: document.getElementById("summary").innerText.trim().length > 0,
  });
  const base = await open(PAGE); const want = await base.page.evaluate(COUNT); await base.close();
  const lines = []; let all = true;
  for (const target of Object.keys(SECTIONS)) {
    const { page, errs, cerrs, close } = await open(PAGE, { init: inject, initArg: target });
    const got = await page.evaluate(COUNT);
    const others = Object.keys(SECTIONS).filter((k) => k !== target);
    const okOthers = others.every((k) => got[k] === want[k]) && got.summary;
    const logged = cerrs.some((m) => m.includes(`injected failure in #${target}`));
    all &&= okOthers && got[target] !== want[target] && !errs.length;
    lines.push(`#${target} throws: it shows ${got[target]} (normally ${want[target]}), the other ${others.length} sections drawn in full ${okOthers}, error logged ${logged}, uncaught ${errs.length}`);
    await close();
  }
  check("KEEP-27", all, lines.join("; "));
});

// ================================================================ safe rendering
// KEEP-28: CSV text is shown as text everywhere, including every chart readout
await guard(["KEEP-28"], async () => {
  const P = {
    pasture: '<img src=x onerror="window.__xss_p=1">Windmill', lone: "Lone Tree <A", tank: '<img src=x onerror="window.__xss_t=1">T2',
    group: '<b onmouseover="window.__xss_g=1">Heifers</b>', tag: "<i>H001</i>", task: '<img src=x onerror="window.__xss_h=1">Pinkeye check',
    cat: '<img src=x onerror="window.__xss_c=1">Repairs',
  };
  const cells = swap({ Heifers: P.group, H001: P.tag, "Pinkeye check": P.task, Repairs: P.cat });
  const tankId = { fn: (r) => (r.tank_id === "T2" ? { ...r, tank_id: P.tank } : r) };
  const six = { pastures: { fn: (r) => (r.pasture_id === "P2" ? { ...r, name: P.pasture } : r.pasture_id === "P4" ? { ...r, name: P.lone } : r) }, water: tankId, tanks: tankId,
    ...Object.fromEntries([...GROUP_FILES, "budget"].map((f) => [f, { fn: cells }])) };
  const { page, errs, close } = await open(PAGE, { route: routeEdits(six) });
  const flags = () => page.evaluate(() => Object.keys(window).filter((k) => k.startsWith("__xss")).length);
  const dom = await page.evaluate((P) => ({
    imgs: document.querySelectorAll("img, iframe, object, embed, script:not([src])").length,
    onattr: [...document.querySelectorAll("*")].filter((e) => [...e.attributes].some((a) => /^on/i.test(a.name))).length,
    list: ["tank", "pasture", "group", "task", "cat", "lone"].filter((k) => document.getElementById("exceptions").textContent.includes(P[k])),
    tanks: ["tank", "pasture"].filter((k) => document.getElementById("tanks").textContent.includes(P[k])),
    budget: document.getElementById("budgetTable").textContent.includes(P.cat),
    tiles: document.getElementById("tiles").textContent.includes(P.group.toLowerCase()),
    now: ["lone", "group"].filter((k) => document.getElementById("nowGrazing").textContent.includes(P[k])),
  }), P);
  const per = await sweepAll(page);
  const rs = per.flatMap((p) => p.readings.map((r) => ({ ...r, label: p.label })));
  const inTip = (s) => rs.some((r) => r.text.includes(s));
  const tipFound = { tank: inTip(P.tank), pasture: inTip(P.pasture), lone: inTip(P.lone), group: inTip(P.group), tag: inTip(P.tag) };
  const f = await flags();
  const hostile = await openCase("hostile");
  await hostile.page.focus("#gain svg.chart"); await hostile.page.keyboard.press("Home");
  const h = await hostile.page.evaluate(() => ({ xss: Object.keys(window).filter((k) => k.startsWith("__xss")).length, imgs: document.querySelectorAll("img").length, tip: document.getElementById("tip").textContent, list: document.getElementById("exceptions").textContent.includes("Lone Tree <A") }));
  await hostile.close();
  const ok = f === 0 && dom.imgs === 0 && dom.onattr === 0 && dom.list.length === 6 && dom.tanks.length === 2 && dom.budget && dom.tiles && dom.now.length === 2 && Object.values(tipFound).every(Boolean) && rs.every((r) => !r.bad) && !errs.length && h.xss === 0 && h.imgs === 0 && /<i>H\d+<\/i>/.test(h.tip) && h.list;
  check("KEEP-28", ok, `six-field payload (pasture, tank id, group, ear tag, health task, budget category): window flags set ${f}; injected img/iframe/script elements ${dom.imgs}; elements with on* attributes ${dom.onattr}; shown literally in the list ${dom.list.length}/6, tank cards ${dom.tanks.length}/2, budget table ${dom.budget}, tiles ${dom.tiles}, Now grazing ${dom.now.length}/2; ${rs.length} readouts stepped with the keyboard, readouts with markup elements ${rs.filter((r) => r.bad).length}, literal text found in readouts ${JSON.stringify(tipFound)}; page errors ${errs.length}; hostile case (coverage.mjs edits): flags ${h.xss}, img ${h.imgs}, gain readout "${h.tip.slice(0, 26)}", "Lone Tree <A" in the list ${h.list}`);
  await close();
});

// ================================================================ focus, motion, chips, skip link, status
// KEEP-29: every Tab stop shows a visible focus ring and is not hidden under the sticky bar
await guard(["KEEP-29"], async () => {
  const lines = []; let all = true;
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const { page, close } = await open(PAGE, { w, h, touch: w < 600 });
    const stops = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab"); await settle(page, 30);
      const s = await page.evaluate(() => {
        const e = document.activeElement; if (!e || e === document.body) return null;
        const cs = getComputedStyle(e), r = e.getBoundingClientRect(), bar = document.querySelector("header").getBoundingClientRect().bottom;
        // seen: the middle of its visible part (whole window, else the part below the bar) hits the element itself
        const hit = (top) => { const t = Math.max(r.top, top), b = Math.min(r.bottom, innerHeight), l = Math.max(r.left, 0), rr = Math.min(r.right, innerWidth);
          if (b - t < 1 || rr - l < 1) return false; const h = document.elementFromPoint((l + rr) / 2, (t + b) / 2); return !!h && (h === e || e.contains(h)); };
        return { el: e.tagName.toLowerCase() + (e.className?.baseVal ?? e.className ? "." + String(e.className?.baseVal ?? e.className).split(" ")[0] : ""), style: cs.outlineStyle, width: parseFloat(cs.outlineWidth), color: cs.outlineColor,
          seen: hit(0) || hit(bar) };
      });
      if (!s) break;
      stops.push(s);
    }
    const noRing = stops.filter((s) => s.style === "none" || s.width < 2), hidden = stops.filter((s) => !s.seen);
    const ok = stops.length > 10 && !noRing.length && !hidden.length;
    all &&= ok;
    lines.push(`${w}px: ${stops.length} Tab stops (${[...new Set(stops.map((s) => s.el))].join(", ")}); without a 2px ring ${noRing.length}${noRing.length ? " " + noRing.map((s) => s.el).join(",") : ""}; off screen or under the bar ${hidden.length}${hidden.length ? " " + hidden.map((s) => s.el).join(",") : ""}`);
    await close();
  }
  check("KEEP-29", all, lines.join("; "));
});

// KEEP-30: reduced motion turns off the entrance animation, smooth scrolling and the loading shimmer
await guard(["KEEP-30"], async () => {
  const get = async (motion) => {
    const { page, close } = await open(PAGE, { motion, wait: "commit", noWait: true, route: (p) => p.route("**/data/*.csv", async (r) => { await new Promise((ok) => setTimeout(ok, 1500)); r.continue(); }) });
    await page.waitForTimeout(600);
    const a = await page.evaluate(() => ({ skel: document.querySelector(".skel i") ? getComputedStyle(document.querySelector(".skel i")).animationName : "(none drawn)" }));
    await page.waitForLoadState("networkidle"); await settle(page, 200);
    const b = await page.evaluate(() => ({ rise: [...new Set([...document.querySelectorAll(".rise")].map((e) => getComputedStyle(e).animationName))].join(), scroll: getComputedStyle(document.documentElement).scrollBehavior, chevron: getComputedStyle(document.querySelector("#rulesMore summary svg")).transitionDuration }));
    await close();
    return { ...a, ...b };
  };
  const r = await get("reduce"), n = await get("no-preference");
  check("KEEP-30", r.rise === "none" && r.scroll === "auto" && r.skel === "none" && n.rise !== "none" && n.scroll === "smooth" && n.skel !== "none",
    `reduce: entrance animation ${r.rise}, scroll-behavior ${r.scroll}, loading shimmer ${r.skel}, chevron transition ${r.chevron}; no-preference: ${n.rise}, ${n.scroll}, ${n.skel}, ${n.chevron}`);
});

// KEEP-31: the area chips filter the list and keep keyboard focus on the chip pressed
await guard(["KEEP-31"], async () => {
  const { page, close } = await open(PAGE);
  const chip = (name) => page.evaluate((name) => { const b = [...document.querySelectorAll("#chips button")].find((x) => x.textContent.trim().startsWith(name)); b.__mark = name; return true; }, name);
  const state = () => page.evaluate(() => { const a = document.activeElement, n = (a.textContent.match(/\d+/) ?? [null])[0]; return { mark: a.__mark ?? null, pressed: [...document.querySelectorAll("#chips button")].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent.trim().replace(/\s*[\d(].*$/, "")), count: n === null ? null : +n, tag: a.tagName }; });
  await chip("Water"); await chip("Grazing"); await chip("All");
  await page.evaluate(() => [...document.querySelectorAll("#chips button")].find((x) => x.__mark === "Water").focus());
  await page.keyboard.press("Enter"); await settle(page, 100);
  const a = await state(), rowsA = await listRows(page);
  await page.keyboard.press("Tab"); await page.keyboard.press("Space"); await settle(page, 100);
  const b = await state(), rowsB = await listRows(page);
  await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Enter"); await settle(page, 100);
  const c = await state(), rowsC = await listRows(page);
  const ok = a.mark === "Water" && a.pressed.join() === "Water" && rowsA.length === a.count && rowsA.every((r) => r.area === "Water") && b.mark === "Grazing" && b.pressed.join() === "Grazing" && rowsB.length === b.count && rowsB.every((r) => r.area === "Grazing") && c.pressed.join() === "All" && rowsC.length === c.count;
  check("KEEP-31", ok, `Enter on Water: focus stays on that chip ${a.mark === "Water"}, pressed ${a.pressed}, ${rowsA.length} rows (chip says ${a.count}), all Water ${rowsA.every((r) => r.area === "Water")}; Tab then Space on Grazing: focus ${b.mark}, pressed ${b.pressed}, ${rowsB.length} rows (chip ${b.count}); back to All: ${rowsC.length} rows (chip ${c.count}), focus ${c.mark}`);
  await close();
});

// KEEP-32: skip link, sticky top bar and section links
await guard(["KEEP-32"], async () => {
  const lines = []; let all = true;
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const { page, close } = await open(PAGE, { w, h, touch: w < 600 });
    await page.keyboard.press("Tab");
    const skip = await page.evaluate(() => { const a = document.activeElement, r = a.getBoundingClientRect(); return { href: a.getAttribute("href"), text: a.textContent.trim(), seen: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 }; });
    await page.keyboard.press("Enter"); await settle(page, 300);
    const land = await page.evaluate(() => { const t = document.querySelector(location.hash || "#attention").getBoundingClientRect(); return { hash: location.hash, top: t.top, bar: document.querySelector("header").getBoundingClientRect().bottom, vh: innerHeight }; });
    await page.keyboard.press("Tab");
    const next = await page.evaluate(() => !!document.activeElement.closest("#attention"));
    const links = await page.evaluate(() => [...document.querySelectorAll("header nav a")].map((a) => ({ href: a.getAttribute("href"), ok: !!document.querySelector(a.getAttribute("href")) })));
    const per = [];
    for (const l of links) {
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" })); await settle(page, 100);
      await page.locator(`header nav a[href="${l.href}"]`).click(); await settle(page, 400);
      per.push(await page.evaluate((href) => { const t = document.querySelector(href).getBoundingClientRect(), bar = document.querySelector("header").getBoundingClientRect(); return { href, top: Math.round(t.top), clear: t.top >= bar.bottom - 1 && t.top < innerHeight, barTop: bar.top, current: [...document.querySelectorAll("header nav a[aria-current]")].map((a) => a.getAttribute("href")) }; }, l.href));
    }
    const sticky = await page.evaluate(() => { scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }); const b = document.querySelector("header").getBoundingClientRect(); return { pos: getComputedStyle(document.querySelector("header")).position, top: b.top, h: b.height }; });
    const fullWidth = ["#attention", "#water", "#budget", "#rules-sec"];
    const ok = skip.href === "#attention" && skip.seen && land.top >= land.bar - 1 && land.top < land.vh && next && links.length >= 6 && links.every((l) => l.ok) && per.every((p) => p.clear && p.barTop === 0 && p.current.length === 1) && per.filter((p) => fullWidth.includes(p.href)).every((p) => p.current[0] === p.href) && sticky.pos === "sticky" && sticky.top === 0;
    all &&= ok;
    lines.push(`${w}px: first Tab focuses the skip link (${skip.href}) on screen ${skip.seen}; Enter lands ${land.hash} at y ${Math.round(land.top)} below the bar (${Math.round(land.bar)}) ${land.top >= land.bar - 1}; next Tab goes into the list ${next}; ${links.length} section links, targets exist ${links.every((l) => l.ok)}; after each link the section top sits below the bar ${per.every((p) => p.clear)} (${per.map((p) => `${p.href}:${p.top}`).join(" ")}); one link marked current each time ${per.every((p) => p.current.length === 1)}, the clicked one for full-width sections ${per.filter((p) => fullWidth.includes(p.href)).every((p) => p.current[0] === p.href)} (Grazing->${per.find((p) => p.href === "#grazing-sec")?.current}, Gain->${per.find((p) => p.href === "#gain-sec")?.current}); bar position ${sticky.pos}, top ${sticky.top} at the page end`);
    await close();
  }
  check("KEEP-32", all, lines.join("; "));
});

// KEEP-33: every status badge and pill carries an icon and a word
await guard(["KEEP-33"], async () => {
  const lines = []; let all = true;
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const { page, close } = await open(PAGE, { w, h, touch: w < 600 });
    await page.evaluate(() => { document.getElementById("rulesMore").open = true; });
    const r = await page.evaluate(() => {
      const els = [...document.querySelectorAll(".pill, .sev")].filter((e) => !e.closest("#tip"));
      const bad = els.filter((e) => !e.querySelector("svg") || !e.textContent.trim());
      const where = {};
      for (const e of els) { const k = e.closest("[id]")?.id ?? "?"; where[k] = (where[k] ?? 0) + 1; }
      return { n: els.length, bad: bad.map((e) => e.outerHTML.slice(0, 60)), where };
    });
    all &&= r.n > 0 && !r.bad.length;
    lines.push(`${w}px: ${r.n} badges and pills (${Object.entries(r.where).map(([k, v]) => `${k} ${v}`).join(", ")}), missing an icon or a word ${r.bad.length}`);
    await close();
  }
  check("KEEP-33", all, lines.join("; "));
});

await browser.close();
const pass = results.filter((r) => r.ok).length;
console.log(JSON.stringify({ pass, fail: results.filter((r) => !r.ok).map((r) => r.id), seconds: Math.round((Date.now() - T0) / 1000) }));
process.exitCode = pass === results.length ? 0 : 1;
