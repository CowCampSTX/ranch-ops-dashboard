#!/usr/bin/env node
// Safe rendering: the browser checks of P1-13 (docs/audit/06-phase1-spec.md section 7, and section 12, P1-13 items 1,
// 2, 3, 4 and 6). Every CSV value must reach the page as text: no injected element, no script run, and the text shown
// literally. Run by hand until the Phase 1 browser job runs it (06 section 11.4; P1-17 part b, step 7).
//
// What it checks (one PASS or FAIL line each, then one JSON summary line):
//   ITEM-1     pasture P2 named <b>x</b>, T2 at 20%: the list, T2's tank card, T2's chart reading by ArrowLeft
//   ITEM-2     tag <i>t</i> for H026 (the first gain reading): hover at 1280 x 900; Home, then ArrowRight until the
//              reading names the tag, at 1280 x 900 and 390 x 844; a tap at 390 x 844 (hasTouch and isMobile); a tap
//              at 1280 x 900 (hasTouch)
//   ITEM-3     pasture P4 named "Lone Tree <A": T4's What cell and tank card name at 1280 x 900 and 390 x 844 (where
//              list rows are cards). Today's wording (SEC-01); P1-07 restates the subject, then T4_SUBJECT changes
//   ITEM-4     the audit's xss-onload file set (render.browser.mjs), the category quoted with its quotes doubled, at
//              1280 x 900 and 390 x 844: the list's Problem cell shows the tag literally, and every reading of every
//              chart is stepped by keyboard, to the last reading of each chart (the chart itself gives the count)
//   ITEM-6     one <img onerror> payload as tank T2, pasture P3's name, group Heifers and category Repairs: a reading
//              of that tank, a stay of that group, a stay in that pasture and a gain dot of that group, each by keys
//              and hover at 1280 x 900, keys at 390 x 844 and a hasTouch tap at 1280 x 900; the Repairs budget row;
//              and the payload shown literally in the water tile's "need a look" list and in Now grazing (the group,
//              and the pasture name)
//   SET-G      places no item reaches (06 section 7, places and "Attributes"): the gain note's "Not shown" groups
//              (no target; a target and no weigh-ins), the gain tile's group name, the head tile's group names, and a
//              tank ID that closes a quoted attribute, in the water tile's icon title and aria-label
//   SET-G2     markup in a pasture ID (pastures, moves, water) and in planned_graze_days: Now grazing and every
//              grazing reading
//   ASOF       markup appended to every acres cell: the facts line under the title (#asof)
//   FOLDER-10  docs/audit/scenarios/10-malformed-and-hostile-csv served as the data, at 1280 x 900 and 390 x 844,
//              every reading of every chart, to the last reading of each (Checkpoint 2 task 4). The number of list
//              rows is not checked
//
// How: each file set is the page's own committed CSVs with cells edited by column name inside the browser
// (page.route), so there are no fixture files and the checks follow whatever data and code the page serves. A hover or
// a tap goes to the centre of the highlight the chart draws for a reading reached by keyboard, never to fixed pixels.
// A page that does not draw its data (a file not served, a script error) fails each check with the reason: what
// #stamp reads, the failed requests and the page errors. The script writes no file and starts no server, so serve the
// page first.
//
// --mutants: a self-check that the checks can fail. It reads the page's app.js and, one "esc(" at a time, serves a
// copy with that "esc(" replaced by "String(" (the escaping dropped at that one place), runs every check and prints
// which checks catch it. A call no check can catch is accepted only if it is listed in CONSTANT_ONLY with the reason
// (it only ever receives text the code writes, or a number); any other uncaught call is a gap and fails the run. Each
// key covers exactly one call, so a second call with the same argument is a gap until its entry is re-checked. If the
// unmutated page fails a check, --mutants stops there and runs no mutant.
//
// Usage (from the repository root):
//   python3 -m http.server 8766 --bind 127.0.0.1         # in another terminal
//   node tests/browser/safe-rendering.mjs [page]          # page default http://localhost:8766/
//   node tests/browser/safe-rendering.mjs [page] --mutants
// A run took about 35 seconds, and --mutants (every check once per "esc(") about 17 minutes, when this was written.
// Exit code 0 when every check passes (with --mutants: the unmutated page passes and every uncaught call is listed in
// CONSTANT_ONLY), 1 otherwise, 2 for a set-up problem (Playwright not found, nothing served at the page URL, scenario
// folder 10 missing, or the page stopped answering during the run), reported on one line that starts "ENVIRONMENT:".
//
// Needs Node 22 and Playwright with Chromium, loaded as docs/audit/redesign/preserve.mjs loads it: $PLAYWRIGHT_MODULE,
// else $PLAYWRIGHT_PATH, if set (a path to Playwright's index.mjs, or a package name), else
// /opt/node22/lib/node_modules/playwright/index.mjs if that file exists, else the "playwright" package. A path is
// imported as a file URL (pathToFileURL). Not named *.test.mjs, so node --test does not run it. All data is fictional
// (Example Ranch).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const T0 = Date.now();
const setupProblem = (msg) => {
  console.error(`ENVIRONMENT: ${msg} This is a set-up problem, not a result about the page.`);
  process.exit(2);
};
const PW_DEFAULT = "/opt/node22/lib/node_modules/playwright/index.mjs";
const PW = process.env.PLAYWRIGHT_MODULE || process.env.PLAYWRIGHT_PATH || (existsSync(PW_DEFAULT) ? PW_DEFAULT : "playwright");
let chromium;
try {
  ({ chromium } = await import(existsSync(PW) ? pathToFileURL(PW).href : PW));
} catch (e) {
  setupProblem(`could not load Playwright from "${PW}" (${e.code ?? e.message}). Set PLAYWRIGHT_MODULE to the path of Playwright's index.mjs, for example $(npm root -g)/playwright/index.mjs for a global install.`);
}

const args = process.argv.slice(2);
const MUTANTS = args.includes("--mutants");
const PAGE = args.find((a) => !a.startsWith("--")) ?? "http://localhost:8766/";

// ---------------------------------------------------------------- set-up: the page is served, scenario folder 10 is here
let APP = "";
try {
  const r = await fetch(PAGE, { signal: AbortSignal.timeout(10000) });
  await r.body?.cancel();
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const a = await fetch(new URL("app.js", PAGE), { signal: AbortSignal.timeout(10000) });
  if (!a.ok) throw new Error(`app.js: HTTP ${a.status}`);
  APP = await a.text();
} catch (e) {
  setupProblem(`could not reach ${PAGE} (${e.cause?.code ?? e.message}). Serve the page first, for example python3 -m http.server 8766 --bind 127.0.0.1 from the repository root.`);
}
const S10_DIR = fileURLToPath(new URL("../../docs/audit/scenarios/10-malformed-and-hostile-csv/", import.meta.url));
let S10 = {};
try {
  S10 = Object.fromEntries(readdirSync(S10_DIR).filter((f) => f.endsWith(".csv")).map((f) => [f.slice(0, -4), readFileSync(join(S10_DIR, f))]));
  if (!S10.pastures || !S10.water) throw new Error("pastures.csv or water.csv missing");
} catch (e) {
  setupProblem(`could not read scenario folder 10 at ${S10_DIR} (${e.code ?? e.message}).`);
}
// Folder 10 names pasture P2 "Windmill <img ...>" (its scenario.md); tank T2 stands in P2.
const S10_P2 = S10.pastures.toString("utf8").split(/\r?\n/).find((l) => l.startsWith("P2,"))?.split(",")[1];

// ---------------------------------------------------------------- file sets: the committed CSVs, cells edited by column name
// Plain comma-separated files with a header row, as committed. Keeps the file's line endings. Returns the new text, how
// many rows changed, and how many edits matched no row: each part of a chain counts on its own, so a set with an edit
// that no longer applies (the data changed) fails instead of passing on less.
function editCSV(text, fn = null, add = []) {
  const nl = text.includes("\r\n") ? "\r\n" : "\n", lines = text.split(/\r?\n/).filter((l) => l !== "");
  const head = lines[0].split(","), out = [lines[0]];
  const parts = fn ? (fn.parts ?? [fn]) : [], hits = parts.map(() => 0);
  let changed = add.length;
  for (const l of lines.slice(1)) {
    const cells = l.split(","), row = Object.fromEntries(head.map((h, i) => [h, cells[i]]));
    const r = parts.reduce((x, f, i) => { if (!x) return x; const y = f(x); if (y !== x) hits[i]++; return y; }, row);
    if (!r) { changed++; continue; }
    const line = head.map((h) => r[h] ?? "").join(",");
    if (line !== l) changed++;
    out.push(line);
  }
  for (const a of add) out.push(head.map((h) => a[h] ?? "").join(","));
  return { text: out.join(nl) + nl, changed, missed: hits.filter((h) => !h).length };
}
const swapCol = (col, map) => (r) => (Object.hasOwn(map, r[col] ?? "") ? { ...r, [col]: map[r[col]] } : r);
const chain = (...fs) => Object.assign((r) => fs.reduce((x, f) => (x ? f(x) : x), r), { parts: fs });
// Files Phase 1 adds (P1-03: tanks.csv and weigh_sessions.csv). Today's page does not ask for them; once it does, the
// same edits apply to them.
const LATER = new Set(["tanks", "weigh_sessions"]);
const GROUP_FILES = ["groups", "moves", "weights", "health", "weigh_sessions"];
const groupSwap = (map) => Object.fromEntries(GROUP_FILES.map((f) => [f, swapCol("group", map)]));

const IMG = '<img src=x onerror="window.__xss_tip=1">';                     // P1-13 item 6, written bare
const H4 = { Heifers: 'Heifers<img src=x onerror="window.__xss_group=1">' };  // render.browser.mjs xss-onload
const TAG4 = '<img src=x onerror="window.__xss_tag=1">';                     // the same set's tag for Y027
const T4_SUBJECT = "Tank T4 (Lone Tree <A, Heifers here now)";              // SEC-01 (02-findings.md); P1-07 restates it
const COWS = 'Cows<img src=x onerror="window.__xss_cows=1">';
const BULLS = 'Bulls<img src=x onerror="window.__xss_b=1">';
const T1X = 'T1"><img src=x onerror="window.__xss_attr=1">';
const PID = 'P3<img src=x onerror="window.__xss_id=1">';
const PG = '<img src=x onerror="window.__xss_pg=1">';
const ACRES = 'x"><img src=x onerror="window.__xss_acres=1">';

const SETS = {
  committed: {},
  item1: { pastures: (r) => (r.pasture_id === "P2" ? { ...r, name: "<b>x</b>" } : r), water: (r) => (r.tank_id === "T2" ? { ...r, level_pct: "20" } : r) },
  item2: { weights: swapCol("tag", { H026: "<i>t</i>" }) },
  item3: { pastures: (r) => (r.pasture_id === "P4" ? { ...r, name: "Lone Tree <A" } : r) },
  item4: {
    pastures: swapCol("name", { "Lone Tree": '<img src=x onerror="window.__xss_pasture=1">' }),
    health: chain(swapCol("group", H4), swapCol("task", { "Booster vaccine": "Booster <b>vaccine</b>" })),
    budget: swapCol("category", { Fuel: '"""><script>window.__xss_script=1</script>"' }),
    weights: chain(swapCol("group", H4), swapCol("tag", { Y027: TAG4 })),
    groups: swapCol("group", H4), moves: swapCol("group", H4), weigh_sessions: swapCol("group", H4),
  },
  item6: {
    water: swapCol("tank_id", { T2: IMG }), tanks: swapCol("tank_id", { T2: IMG }),
    pastures: (r) => (r.pasture_id === "P3" ? { ...r, name: IMG } : r),
    ...groupSwap({ Heifers: IMG }), budget: swapCol("category", { Repairs: IMG }),
  },
  setG: {
    water: swapCol("tank_id", { T1: T1X }), tanks: swapCol("tank_id", { T1: T1X }),
    ...groupSwap({ Cows: COWS, Heifers: IMG, Yearlings: "Steers" }),
    // a group with a gain target and no weigh-ins: the note's second list
    groups: { fn: swapCol("group", { Cows: COWS, Heifers: IMG, Yearlings: "Steers" }), add: [{ group: BULLS, class: "bulls", head: "4", target_adg_lbs: "1.5" }] },
  },
  setG2: {
    pastures: chain(swapCol("pasture_id", { P3: PID }), (r) => (r.pasture_id === "P1" ? { ...r, planned_graze_days: PG } : r)),
    moves: swapCol("pasture_id", { P3: PID }), water: swapCol("pasture_id", { P3: PID }), tanks: swapCol("pasture_id", { P3: PID }),
  },
  asof: { pastures: (r) => ({ ...r, acres: r.acres + ACRES }) },
  folder10: Object.fromEntries(Object.entries(S10).map(([f, body]) => [f, { body }])),
};

// ---------------------------------------------------------------- browser
const browser = await chromium.launch().catch((e) => setupProblem(`could not start Chromium (${e.message.split("\n")[0]}).`));

// A page with one file set (and, under --mutants, one mutated app.js). edits says, per file of the set the page asked
// for, how many rows the edit changed.
async function open(setName, o = {}, mutant = null) {
  const ctx = await browser.newContext({
    viewport: { width: o.w ?? 1280, height: o.h ?? 900 }, hasTouch: !!o.touch, isMobile: !!o.mobile,
    locale: "en-US", timezoneId: "America/Chicago", reducedMotion: "reduce", deviceScaleFactor: 1,
  });
  ctx.setDefaultTimeout(10000);
  const page = await ctx.newPage();
  const errs = [], failed = [], seen = {}, set = SETS[setName];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("response", (r) => { if (r.status() >= 400) failed.push(`${new URL(r.url()).pathname} HTTP ${r.status()}`); });
  if (mutant !== null) await page.route("**/app.js", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: mutant }));
  await page.route("**/data/*.csv", async (r) => {
    const name = r.request().url().match(/data\/([^/?#]+)\.csv/)[1], e = set[name];
    if (!e) return r.continue();
    if (e.body) { seen[name] = 1; return r.fulfill({ status: 200, contentType: "text/csv", body: e.body }); }
    const resp = await r.fetch();
    const { text, changed, missed } = editCSV(await resp.text(), e.fn ?? e, e.add);
    seen[name] = missed ? 0 : changed;
    await r.fulfill({ response: resp, body: text });
  });
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await page.waitForFunction(() => !/Loading/.test(document.getElementById("stamp")?.textContent ?? "Loading"), null, { timeout: 5000 }).catch(() => {});
  // A page that never drew its data (a file not served, a script error) fails here with the reason, not later on an
  // empty page.
  const stamp = (await page.textContent("#stamp").catch(() => null))?.trim() ?? null;
  if (!/^Data as of/.test(stamp ?? "")) {
    await ctx.close();
    throw new Error(`the page did not load (file set ${setName}): #stamp reads ${JSON.stringify(stamp)}; failed requests ${JSON.stringify(failed)}; page errors ${JSON.stringify(errs)}`);
  }
  await page.waitForTimeout(200);
  const missing = Object.keys(set).filter((f) => !LATER.has(f) && !seen[f]);
  return { page, errs, edits: missing.length ? `edit not applied to ${missing.join(", ")}` : "applied", applied: !missing.length, close: () => ctx.close() };
}

// ---------------------------------------------------------------- page-side probes
// The readout, and the centre of the highlight the focused chart draws for its reading.
const TIP = () => {
  const t = document.getElementById("tip"), s = document.activeElement?.matches?.("svg.chart") ? document.activeElement : null;
  let m = s && [...s.querySelectorAll('[visibility="visible"]')][0];
  if (m && m.tagName === "g") m = m.querySelector("circle") ?? m;
  const b = m?.getBoundingClientRect();
  const all = [...t.querySelectorAll("*")];
  return {
    hidden: t.hidden, text: t.textContent, html: t.innerHTML, tags: all.map((e) => e.localName), idx: s?._index?.() ?? null,
    bad: all.filter((e) => /^(img|script|iframe|object|embed)$/i.test(e.localName) || [...e.attributes].some((a) => /^on/i.test(a.name))).length,
    mx: b && (b.width || b.height) ? +((b.left + b.right) / 2).toFixed(2) : null, my: b && (b.width || b.height) ? +((b.top + b.bottom) / 2).toFixed(2) : null,
  };
};
const tipNow = (page) => page.evaluate(TIP);
// Two probes show the same reading when the chart's own reading index is the same. Text and position are not enough:
// two readings can share both (a repeated row).
const same = (a, b) => a.idx === b.idx;
// Injected markup: elements the page never builds itself, or any on* attribute, in main and in #tip; and any flag.
const INJECTED = () => {
  const els = [...document.querySelectorAll("main *, #tip *")];
  return {
    els: els.filter((e) => /^(img|script|iframe|object|embed)$/i.test(e.localName) || [...e.attributes].some((a) => /^on/i.test(a.name))).length,
    flags: Object.keys(window).filter((k) => /xss/i.test(k)),
  };
};
const injected = async (page) => { await page.waitForTimeout(150); return page.evaluate(INJECTED); };
const SECTIONS = ["#exceptions", "#tiles", "#tanks", "#nowGrazing", "#grazing", "#gain", "#budgetTable"];
const countBI = (page) => page.evaluate((S) => S.map((s) => `${s} b ${document.querySelectorAll(`${s} b`).length} i ${document.querySelectorAll(`${s} i`).length}`).join("; "), SECTIONS);

// Focus the k-th svg.chart. A key press first, so the browser treats the focus as keyboard focus.
async function focusChart(page, k) {
  await page.keyboard.press("Shift");
  await page.evaluate((k) => document.querySelectorAll("svg.chart")[k].focus(), k);
}
const chartIndex = (page, where) => page.evaluate((where) => {
  const all = [...document.querySelectorAll("svg.chart")];
  if (where.tank !== undefined) {
    const card = [...document.querySelectorAll("#tanks .tank")].find((t) => t.querySelector(".tank-name span")?.textContent === where.tank);
    return card ? all.indexOf(card.querySelector("svg.chart")) : -1;
  }
  return all.indexOf(document.querySelector(where.sel));
}, where);
// Step through the focused chart's readings by keyboard: up to the top row, then Home and ArrowRight to the end of each
// row, then ArrowDown. Stops early when stop(reading) is true. Returns every reading shown.
async function sweep(page, stop = () => false) {
  const out = [];
  let cur = await tipNow(page);
  for (let i = 0; i < 60; i++) { await page.keyboard.press("ArrowUp"); const n = await tipNow(page); if (same(n, cur)) break; cur = n; }
  for (let row = 0; row < 60; row++) {
    await page.keyboard.press("Home"); cur = await tipNow(page); out.push(cur);
    if (stop(cur)) return out;
    for (let i = 0; i < 2000; i++) {
      await page.keyboard.press("ArrowRight");
      const n = await tipNow(page);
      if (same(n, cur)) break;
      cur = n; out.push(cur);
      if (stop(cur)) return out;
    }
    await page.keyboard.press("ArrowDown");
    const n = await tipNow(page);
    if (same(n, cur)) break;
    cur = n;
  }
  return out;
}
// Every reading of every chart in the tab order. partial lists each chart whose sweep reached fewer readings than the
// chart has (the count comes from the chart's own _place(), not from the keys).
async function sweepAll(page) {
  const ks = await page.evaluate(() => [...document.querySelectorAll("svg.chart")].map((s, i) => (s.getAttribute("tabindex") === "0" ? i : -1)).filter((i) => i >= 0));
  const out = [], partial = [];
  for (const k of ks) {
    const n = await page.evaluate((k) => { const s = document.querySelectorAll("svg.chart")[k]; let n = 0; while (s._place(n) !== false) n++; s._clear(); return n; }, k);
    await focusChart(page, k);
    const rs = await sweep(page), got = new Set(rs.map((t) => t.idx)).size;
    if (got !== n) partial.push(`chart ${k} ${got} of ${n}`);
    out.push(...rs);
  }
  return { charts: ks.length, readings: out, partial };
}
// Reach the reading whose text includes want by keyboard. With how ("hover" or "tap"), then hide the tooltip and show
// the same reading with the pointer, at the centre of the highlight the chart drew for it.
async function reach(page, where, want, how = null) {
  if (how === "hover") await page.mouse.move(1, 1);   // park the pointer off the charts, over the top bar
  const k = await chartIndex(page, where);
  if (k < 0) return { key: { found: false, text: `no chart for ${JSON.stringify(where)}`, tags: [] } };
  await focusChart(page, k);
  const rs = await sweep(page, (t) => !t.hidden && t.text.includes(want));
  const last = rs.at(-1) ?? { text: "", hidden: true, tags: [] };
  const key = { ...last, found: !last.hidden && last.text.includes(want), steps: rs.length };
  if (!key.found || !how) return { key };
  const c = await page.evaluate(() => {
    const s = document.activeElement;
    let m = [...s.querySelectorAll('[visibility="visible"]')][0];
    if (m && m.tagName === "g") m = m.querySelector("circle") ?? m;
    m.scrollIntoView({ block: "center", behavior: "instant" });
    const b = m.getBoundingClientRect();
    return { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 };
  });
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForTimeout(100);
  const before = await tipNow(page);
  if (how === "hover") await page.mouse.move(c.x, c.y, { steps: 2 });
  else await page.touchscreen.tap(c.x, c.y);
  await page.waitForTimeout(150);
  const t = await tipNow(page);
  // the pointer shows the very reading the keyboard reached, after the tooltip was hidden
  const found = before.hidden && !t.hidden && t.text === key.text;
  const why = found ? undefined : !before.hidden ? "tooltip still shown before the pointer" : t.hidden ? "tooltip stayed hidden"
    : `pointer showed ${short(t.text, 40)}, keyboard showed ${short(key.text, 40)}`;
  return { key, ptr: { ...t, found, why } };
}
const clean = (t) => t.found && !t.bad && !t.tags.includes("img") && !t.tags.includes("script");
const short = (s, n = 60) => JSON.stringify(String(s ?? "").replace(/\s+/g, " ").slice(0, n));

// ---------------------------------------------------------------- the checks
// Each returns { ok, measured }. mutant is null, or the app.js text to serve instead of the page's.
const CHECKS = [
  ["ITEM-1", async (m) => {
    const { page, errs, edits, applied, close } = await open("item1", {}, m);
    const r = await page.evaluate(() => {
      const ex = document.getElementById("exceptions").innerHTML;
      const card = [...document.querySelectorAll("#tanks .tank")].find((t) => t.querySelector(".tank-name span")?.textContent === "T2");
      const b = card?.querySelector(".tank-name b");
      const bx = [...document.querySelectorAll("main b, #tip b")].filter((e) => e.textContent === "x").length;
      return { esc: ex.includes("&lt;b&gt;x&lt;/b&gt;"), raw: ex.includes("<b>x"), name: card?.querySelector(".tank-name").innerHTML ?? "", bText: b?.textContent, bKids: b?.childElementCount, bx };
    });
    const k = await chartIndex(page, { tank: "T2" });
    await focusChart(page, k);
    await page.keyboard.press("ArrowLeft");
    const t = await tipNow(page), inj = await injected(page);
    await close();
    const ok = applied && r.esc && !r.raw && r.name.includes("&lt;b&gt;") && r.bText === "<b>x</b>" && r.bKids === 0 && r.bx === 0 &&
      !t.hidden && t.text.includes("<b>x</b>") && !t.tags.includes("b") && !inj.els && !inj.flags.length && !errs.length;
    return { ok, measured: `1280 x 900, edits ${edits}: #exceptions has &lt;b&gt;x&lt;/b&gt; ${r.esc}, raw <b>x ${r.raw}; T2 card .tank-name has &lt;b&gt; ${r.name.includes("&lt;b&gt;")}, .tank-name b text ${short(r.bText)} with ${r.bKids} child elements; b elements reading "x" ${r.bx}; ArrowLeft on T2's chart: #tip ${short(t.text)}, tags ${JSON.stringify([...new Set(t.tags)])}; injected ${inj.els}, flags ${JSON.stringify(inj.flags)}, page errors ${errs.length}` };
  }],

  ["ITEM-2", async (m) => {
    const want = "<i>t</i>", ways = [];
    const run = async (label, o, how) => {
      const { page, errs, applied, close } = await open("item2", o, m);
      const { key, ptr } = await reach(page, { sel: "#gain svg.chart" }, want, how);
      const t = how ? ptr ?? { found: false, text: key.text, tags: [] } : key;
      const inj = await injected(page);
      await close();
      const ok = applied && clean(t) && t.html.includes("&lt;i&gt;t&lt;/i&gt;") && !t.tags.includes("i") && !inj.els && !inj.flags.length && !errs.length;
      ways.push({ label, ok, text: t.text, why: t.why, steps: how ? 0 : key.steps, flags: inj.flags });
    };
    await run("hover 1280", {}, "hover");
    await run("keys 1280", {}, null);
    await run("keys 390", { w: 390, h: 844 }, null);
    await run("tap 390 isMobile", { w: 390, h: 844, touch: true, mobile: true }, "tap");
    await run("tap 1280 hasTouch", { touch: true }, "tap");
    return { ok: ways.every((w) => w.ok), measured: ways.map((w) => `${w.label} ${w.ok ? "ok" : "FAIL"} ${w.why ?? short(w.text, 45)}${w.steps ? ` (step ${w.steps})` : ""}${w.flags.length ? ` flags ${w.flags}` : ""}`).join("; ") };
  }],

  ["ITEM-3", async (m) => {
    const res = [];
    for (const o of [{ w: 1280, h: 900 }, { w: 390, h: 844, touch: true, mobile: true }]) {
      const { page, errs, applied, close } = await open("item3", o, m);
      const r = await page.evaluate(() => {
        const tr = [...document.querySelectorAll("#exceptions tbody tr")].find((x) => x.querySelector("td.c-what")?.textContent.startsWith("Tank T4"));
        const card = [...document.querySelectorAll("#tanks .tank")].find((t) => t.querySelector(".tank-name span")?.textContent === "T4");
        return { what: tr?.querySelector("td.c-what").textContent, display: tr && getComputedStyle(tr).display, card: card?.querySelector(".tank-name b")?.textContent };
      });
      const inj = await injected(page);
      await close();
      // at 390 the list rows are laid out as cards, not table rows
      const ok = applied && r.what === T4_SUBJECT && r.card === "Lone Tree <A" && (o.w > 640 || r.display !== "table-row") && !inj.els && !inj.flags.length && !errs.length;
      res.push({ ok, s: `${o.w}: T4 What cell ${short(r.what)} (row display ${r.display}), card name ${short(r.card)}` });
    }
    return { ok: res.every((x) => x.ok), measured: `today's wording ${JSON.stringify(T4_SUBJECT)}; ${res.map((x) => x.s).join("; ")}` };
  }],

  ["ITEM-4", async (m) => {
    const res = [];
    for (const o of [{ w: 1280, h: 900 }, { w: 390, h: 844 }]) {
      const base = await open("committed", o, m);
      const want = await countBI(base.page);
      await base.close();
      const { page, errs, edits, applied, close } = await open("item4", o, m);
      const got = await countBI(page);
      // the list's Problem cell names the tag literally (Y027's gain row)
      const prob = await page.evaluate((T) => [...document.querySelectorAll("#exceptions td.c-problem")].some((c) => c.textContent.includes(T)), TAG4);
      const before = await page.evaluate(INJECTED);
      const sw = await sweepAll(page);
      const tipBad = sw.readings.filter((t) => t.bad || t.tags.includes("script") || t.tags.includes("img")).length;
      const inj = await injected(page);
      await close();
      const ok = applied && got === want && prob && !before.els && !inj.els && !inj.flags.length && !tipBad && sw.readings.length > 0 && !sw.partial.length && !errs.length;
      res.push({ ok, s: `${o.w}: edits ${edits}; b and i per section same as on the committed data ${got === want}${got === want ? "" : ` (committed ${want}; this set ${got})`}; Problem cell shows the Y027 tag literally ${prob}; img or script in main ${inj.els}; ${sw.charts} charts, ${sw.readings.length} readings by keyboard, charts not swept to the end ${JSON.stringify(sw.partial)}, readings with markup in #tip ${tipBad}; flags ${JSON.stringify(inj.flags)}; page errors ${errs.length}` });
    }
    return { ok: res.every((x) => x.ok), measured: res.map((x) => x.s).join(" | ") };
  }],

  ["ITEM-6", async (m) => {
    const targets = [
      ["tank T2", { tank: IMG }, IMG],
      ["grazing, a stay of the group", { sel: "#grazing svg.chart" }, `${IMG} in P`],
      ["grazing, a stay in pasture P3", { sel: "#grazing svg.chart" }, `in P3 ${IMG}`],
      ["gain, a dot of the group", { sel: "#gain svg.chart" }, IMG],
    ];
    const rows = [], fail = [];
    const way = async (label, o, how) => {
      const { page, errs, applied, close } = await open("item6", o, m);
      // the budget row, and the payload shown literally: the water tile's "need a look" list (T2 is flagged "go now"),
      // Now grazing's group (Heifers graze P4 now) and pasture name (Yearlings are in P3 now)
      const b = how === "hover" ? await page.evaluate((IMG) => ({
        first: [...document.querySelectorAll("#budgetTable tbody tr")].some((r) => r.cells[0].textContent.startsWith(IMG)),
        bad: document.querySelectorAll("#budgetTable img, #budgetTable script").length,
        look: [...document.querySelectorAll("#tiles .keep")].some((e) => e.textContent.startsWith(`${IMG} `)),
        nowG: [...document.querySelectorAll("#nowGrazing .who > b")].some((e) => e.textContent === IMG),
        nowP: (document.getElementById("nowGrazing")?.textContent ?? "").includes(`P3 ${IMG}`),
      }), IMG) : null;
      for (const [name, where, want] of targets) {
        const { key, ptr } = await reach(page, where, want, how);
        for (const [w, t] of [[`keys ${o.w ?? 1280}`, key], ...(how ? [[`${how} ${o.w ?? 1280}`, ptr ?? { found: false, text: "not shown", tags: [] }]] : [])]) {
          const ok = clean(t) && t.text.includes(want);
          rows.push(ok);
          if (!ok) fail.push(`${name}, ${w}: ${t.why ?? short(t.text, 50)}`);
        }
      }
      const inj = await injected(page);
      await close();
      if (!applied || inj.els || inj.flags.length || errs.length) fail.push(`${label}: edits applied ${applied}, injected ${inj.els}, flags ${JSON.stringify(inj.flags)}, page errors ${errs.length}`);
      if (b && (!b.first || b.bad)) fail.push(`budget: Repairs row starts with the payload ${b.first}, img or script in #budgetTable ${b.bad}`);
      if (b && !(b.look && b.nowG && b.nowP)) fail.push(`literal text: water tile list ${b.look}, Now grazing group ${b.nowG}, Now grazing pasture name ${b.nowP}`);
      return b;
    };
    const b = await way("1280 x 900", {}, "hover");
    await way("390 x 844", { w: 390, h: 844 }, null);
    await way("1280 x 900 hasTouch", { touch: true }, "tap");
    return { ok: !fail.length, measured: `4 places, each by keys and hover at 1280, keys at 390, and keys then a tap at 1280 hasTouch: ${rows.length} readings, ${rows.filter(Boolean).length} shown as text with no markup; Repairs budget row starts with the payload ${b?.first}, img or script in #budgetTable ${b?.bad}; shown literally in the water tile list ${b?.look}, as Now grazing's group ${b?.nowG} and as its pasture name ${b?.nowP}${fail.length ? `; failing: ${fail.join("; ")}` : ""}` };
  }],

  ["SET-G", async (m) => {
    const { page, errs, edits, applied, close } = await open("setG", {}, m);
    const r = await page.evaluate(({ COWS, BULLS, IMG, T1X }) => {
      const hint = document.querySelector("#gain p.hint")?.textContent ?? "";
      const pips = document.querySelector("#tiles .pips");
      const k = [...document.querySelectorAll("#tiles .tile .k")].map((e) => e.textContent).find((t) => / gain$/.test(t));
      return {
        hintCows: hint.includes(COWS), hintBulls: hint.includes(BULLS), gainTile: k === `${IMG} gain`, gainK: k,
        head: (document.querySelector("#tiles .split")?.textContent ?? "").includes(COWS.toLowerCase()),
        title: [...(pips?.querySelectorAll("span[title]") ?? [])].some((s) => s.getAttribute("title").startsWith(`${T1X}:`)),
        aria: !!pips?.getAttribute("aria-label")?.includes(T1X),
      };
    }, { COWS, BULLS, IMG, T1X });
    const inj = await injected(page);
    await close();
    const ok = applied && r.hintCows && r.hintBulls && r.gainTile && r.head && r.title && r.aria && !inj.els && !inj.flags.length && !errs.length;
    return { ok, measured: `edits ${edits}; gain note names the Cows payload ${r.hintCows} and the Bulls payload ${r.hintBulls}; gain tile name ${short(r.gainK, 50)} (${r.gainTile}); head tile names cows<img ...> ${r.head}; T1 icon title starts with the T1 payload ${r.title}; icons' aria-label has it ${r.aria}; injected ${inj.els}; flags ${JSON.stringify(inj.flags)}; page errors ${errs.length}` };
  }],

  ["SET-G2", async (m) => {
    const { page, errs, edits, applied, close } = await open("setG2", {}, m);
    const now = await page.evaluate((PID) => (document.getElementById("nowGrazing")?.textContent ?? "").includes(PID), PID);
    await focusChart(page, await chartIndex(page, { sel: "#grazing svg.chart" }));
    const rs = await sweep(page);
    const inj = await injected(page);
    await close();
    const id = rs.filter((t) => t.text.includes(PID)).length, pg = rs.filter((t) => t.text.includes(`plan ${PG}`)).length, bad = rs.filter((t) => t.bad).length;
    const ok = applied && now && id > 0 && pg > 0 && !bad && !inj.els && !inj.flags.length && !errs.length;
    return { ok, measured: `edits ${edits}; Now grazing shows the ID literally ${now}; ${rs.length} grazing readings by keyboard, ${id} show the ID, ${pg} show "plan " and the planned-days payload, ${bad} with markup in #tip; injected ${inj.els}; flags ${JSON.stringify(inj.flags)}; page errors ${errs.length}` };
  }],

  ["ASOF", async (m) => {
    const { page, errs, edits, applied, close } = await open("asof", {}, m);
    const lit = await page.evaluate((A) => (document.getElementById("asof")?.textContent ?? "").includes(A), ACRES);
    const inj = await injected(page);
    await close();
    const ok = applied && lit && !inj.els && !inj.flags.length && !errs.length;
    return { ok, measured: `edits ${edits}; #asof shows the acres payload literally ${lit}; injected ${inj.els}; flags ${JSON.stringify(inj.flags)}; page errors ${errs.length}` };
  }],

  ["FOLDER-10", async (m) => {
    const res = [];
    for (const o of [{ w: 1280, h: 900 }, { w: 390, h: 844 }]) {
      const { page, errs, applied, close } = await open("folder10", o, m);
      const name = await page.evaluate(() => [...document.querySelectorAll("#tanks .tank")].find((t) => t.querySelector(".tank-name span")?.textContent === "T2")?.querySelector(".tank-name b")?.textContent);
      const sw = await sweepAll(page);
      const bad = sw.readings.filter((t) => t.bad).length;
      const inj = await injected(page);
      await close();
      const ok = applied && name === S10_P2 && sw.readings.length > 0 && !sw.partial.length && !bad && !inj.els && !inj.flags.length && !errs.length;
      res.push({ ok, s: `${o.w}: T2 card name ${short(name)}; ${sw.charts} charts, ${sw.readings.length} readings by keyboard, charts not swept to the end ${JSON.stringify(sw.partial)}, ${bad} with markup in #tip; injected ${inj.els}; flags ${JSON.stringify(inj.flags)}; page errors ${errs.length}` });
    }
    return { ok: res.every((x) => x.ok), measured: res.map((x) => x.s).join(" | ") };
  }],
];

// A check that throws (a selector gone, a timeout) counts as FAIL with the error, and the browser contexts it left open
// are closed. A page that stops answering during the run (the server stopped) is a set-up problem, not a FAIL: the run
// stops there with exit code 2.
const served = async () => { try { const r = await fetch(PAGE, { signal: AbortSignal.timeout(10000) }); await r.body?.cancel(); return r.ok; } catch { return false; } };
async function runAll(mutant, print) {
  const fails = [];
  for (const [id, fn] of CHECKS) {
    let r;
    try { r = await fn(mutant); } catch (e) {
      r = { ok: false, measured: `error: ${String(e.message ?? e).split("\n")[0].slice(0, 200)}` };
      for (const c of browser.contexts()) await c.close().catch(() => {});
    }
    if (!r.ok && !(await served())) { await browser.close(); setupProblem(`${PAGE} stopped answering during ${id}; no result is reported for it or later checks.`); }
    if (!r.ok) fails.push(id);
    if (print) console.log(`${r.ok ? "PASS" : "FAIL"} ${id}: ${r.measured}`);
  }
  return fails;
}

if (!MUTANTS) {
  console.log(`PRE  page ${PAGE}; Playwright ${PW}; file sets built in the browser from the page's data`);
  const fails = await runAll(null, true);
  await browser.close();
  console.log(JSON.stringify({ pass: CHECKS.length - fails.length, fail: fails, seconds: Math.round((Date.now() - T0) / 1000) }));
  process.exitCode = fails.length ? 1 : 0;
} else {
  // Calls that only ever receive text the code writes, or a number. Keyed by the call's argument as written in app.js.
  // Each later step that changes one of these calls re-checks the reason. Each key covers exactly one call, so a second
  // call with the same argument is a gap until its entry is re-checked.
  const CONSTANT_ONLY = {
    "": "a comment, not a call: the mutant is the same program",
    label: "pill(): every caller passes a word the code writes (OK, Can't tell, No signal, Fast drop, Go now, Check soon, Past plan, Move soon, On plan, No plan, or a severity)",
    "e.area": "the area of a list row: one of the five area names exceptions.js writes",
    "e.action": "the first step of a list row: a sentence exceptions.js writes",
    "r.level_pct": "a tank reading's level: only readings whose level is a finite number are drawn",
    "c.planned": "Now grazing's planned days: shown only when the planned move date exists, which needs a finite number",
    "a.weight.toLocaleString()": "a weight formatted by toLocaleString: a number, or an empty cell (which counts as 0 in the gain), never markup",
    b: "the #asof labels: (fictional), acres, pastures and a date from toLocaleString",
  };
  const at = []; for (let i = APP.indexOf("esc("); i >= 0; i = APP.indexOf("esc(", i + 1)) if (!/[\w$.]/.test(APP[i - 1] ?? "")) at.push(i);
  const lineOf = (i) => APP.slice(0, i).split("\n").length;
  const argOf = (i) => { let d = 0, j = i + 3; for (; j < APP.length; j++) { if (APP[j] === "(") d++; else if (APP[j] === ")" && --d === 0) break; } return APP.slice(i + 4, j); };
  const inComment = (i) => { const ls = APP.lastIndexOf("\n", i) + 1, line = APP.slice(ls, i); return /^\s*\/\//.test(line) || /\s\/\/\s/.test(line); };
  const sites = {}; for (const i of at) { const a = inComment(i) ? "" : argOf(i); sites[a] = (sites[a] ?? 0) + 1; }
  console.log(`PRE  page ${PAGE}; Playwright ${PW}; ${at.length} "esc(" in the served app.js; each mutant replaces one with "String("`);
  // the control: the unmutated app.js, served through the same route as each mutant
  const base = await runAll(APP, true);
  console.log(`BASE unmutated app.js, served the way each mutant is: ${base.length ? `FAIL ${base.join(", ")}; no mutant is run, since a check that fails here would "catch" every one` : `all ${CHECKS.length} checks pass`}`);
  const rows = [];
  for (const i of base.length ? [] : at) {
    const line = lineOf(i), arg = inComment(i) ? "" : argOf(i);
    const caught = await runAll(APP.slice(0, i) + "String(" + APP.slice(i + 4), false);
    const listed = Object.hasOwn(CONSTANT_ONLY, arg) && (arg === "" || sites[arg] === 1);
    const reason = listed ? CONSTANT_ONLY[arg] : Object.hasOwn(CONSTANT_ONLY, arg) ? `NOT LISTED: CONSTANT_ONLY's "${arg}" covers one call; app.js has ${sites[arg]}` : "NOT LISTED: no check reaches this call";
    const row = { line, arg, listed, call: arg === "" ? "esc() in a comment" : `esc(${arg})`, caught, ...(caught.length ? {} : { reason }) };
    rows.push(row);
    console.log(`${caught.length ? "CAUGHT  " : listed ? "UNCAUGHT" : "GAP     "} app.js:${line} ${row.call} -> ${caught.length ? caught.join(", ") : row.reason}`);
  }
  await browser.close();
  const gaps = rows.filter((r) => !r.caught.length && !r.listed);
  console.log(JSON.stringify({ mutants: rows.length, caught: rows.filter((r) => r.caught.length).length, uncaught: rows.filter((r) => !r.caught.length).map((r) => `app.js:${r.line} ${r.call}`), gaps: gaps.map((r) => `app.js:${r.line} ${r.call}`), baselineFail: base, seconds: Math.round((Date.now() - T0) / 1000) }));
  process.exitCode = base.length || gaps.length ? 1 : 0;
}
