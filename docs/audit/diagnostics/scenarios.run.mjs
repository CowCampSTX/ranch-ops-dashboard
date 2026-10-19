#!/usr/bin/env node
// Runs every scenario in docs/audit/scenarios/ through the CURRENT dashboard code and prints the current output next to
// the scenario's expected.json, with MATCH / MISMATCH per expected row. Most Phase-1 scenarios are expected to
// MISMATCH today: expected.json describes the Phase-1 behaviour, not the current one. Only 01 should match in full.
//
// It never throws. Any error (a rule that crashes, a missing file, a page that never finishes) is caught and printed
// as part of the current output.
//
// Usage, from the repository root:
//   node docs/audit/diagnostics/scenarios.run.mjs                       node mode (default)
//   node docs/audit/diagnostics/scenarios.run.mjs --browser             also drive the real page (Playwright Chromium)
//   node docs/audit/diagnostics/scenarios.run.mjs --only 04 --json out.json
//
// Node mode loads each scenario's CSVs the way the page does (UTF-8 decoded with a leading BOM stripped, as
// Response.text() does; a file missing from the folder is read as an empty body, which the current parser turns into
// zero rows, the same result the page gets from a 404 page in the baseline's states check), runs parseCSV and
// findExceptions from exceptions.js, and computes the five headline tiles with a line-for-line port of app.js tiles()
// (app.js itself needs a DOM). Browser mode serves the repository with a small built-in static server, routes
// data/*.csv to the scenario's files (404 when absent), loads index.html in Chromium (time zone America/Chicago,
// locale en-US) and reads the exception table, the tiles, page errors and the render checks from the real page.
//
// The time zone is fixed to America/Chicago (the scenarios' ranch zone) unless TZ is set, so results are repeatable.
if (!process.env.TZ) process.env.TZ = "America/Chicago";

import { readFileSync, existsSync, readdirSync, writeFileSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";
import { createServer } from "node:http";

const REPO = resolve(".");
const SCEN = join(REPO, "docs", "audit", "scenarios");
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i < 0 ? null : (args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : true); };
const ONLY = opt("--only");
const JSON_OUT = opt("--json");
const BROWSER = args.includes("--browser");

let X = null, loadError = null;
try { X = await import(pathToFileURL(join(REPO, "exceptions.js")).href); } catch (e) { loadError = e; }

// ------------------------------------------------------------------------------------------------ current output (node)
function readScenario(folder) {
  const d = {}, notes = [];
  for (const f of FILES) {
    const p = join(folder, `${f}.csv`);
    let text = "";
    if (existsSync(p)) text = new TextDecoder("utf-8").decode(readFileSync(p));
    else notes.push(`${f}.csv missing: read as an empty body`);
    try { d[f] = X.parseCSV(text); } catch (e) { d[f] = []; notes.push(`parseCSV(${f}) threw ${e.name}: ${e.message}`); }
  }
  return { d, notes };
}

// First "file.js:line" in an error's stack, so a crash names the code that threw.
const where = (e) => { const m = String(e?.stack || "").match(/([A-Za-z0-9_.-]+\.m?js):(\d+):\d+/); return m ? ` (at ${m[1]}:${m[2]})` : ""; };
const fmtDate = (s) => new Date(s.length === 10 ? s + "T12:00" : s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const money = (x) => (x < 0 ? "−$" : "$") + Math.abs(Math.round(x)).toLocaleString();

// A line-for-line port of app.js tiles() (app.js:45-58). Like the page, it computes every value first and fails as a
// whole; on the page a throw here also stops the exception table and every later section (app.js:225).
function tilesPort(d, exc) {
  const count = (s) => exc.filter((e) => e.severity === s).length;
  const tanks = X.waterStatus(d.water, d.meta[0].as_of);
  const tankIssues = new Set(exc.filter((e) => e.area === "Water").map((e) => e.subject.split(" ")[1]));
  const gain = X.gainStatus(d.weights, d.groups).find((g) => g.group === "Yearlings");
  const b = X.budgetStatus(d.budget), tb = b.reduce((s, x) => s + x.budget, 0), ta = b.reduce((s, x) => s + x.actual, 0);
  const head = d.groups.reduce((s, g) => s + g.head, 0);
  const t = {};
  t.needs_attention = { label: "Needs attention", v: String(exc.length), d: `${count("critical")} critical, ${count("serious")} serious, ${count("warning")} warning` };
  t.head = { label: "Head on grass", v: head.toLocaleString(), d: d.groups.map((g) => `${g.head} ${g.group.toLowerCase()}`).join(", ") };
  t.water = { label: "Water tanks OK", v: `${tanks.length - tankIssues.size} of ${tanks.length}`, d: `${tankIssues.size} need a look` };
  t.gain = { label: "Yearling gain", v: `${gain.adg.toFixed(2)} lbs/day`, d: `target ${gain.target.toFixed(1)}, since ${fmtDate(gain.from)}` };
  t.budget = { label: "Spend vs budget", v: `${ta > tb ? "+" : "−"}${Math.abs(((ta - tb) / tb) * 100).toFixed(1)}%`, d: `${money(ta)} of ${money(tb)}, season to date` };
  return t;
}

function currentNode(folder) {
  const out = { mode: "node", rows: [], tiles: null, tilesError: null, excError: null, notes: [], pageStops: null };
  if (!X) { out.excError = `exceptions.js could not be imported: ${loadError}`; return out; }
  const { d, notes } = readScenario(folder);
  out.notes.push(...notes);
  let exc = [];
  try { exc = X.findExceptions(d); out.rows = exc.map((e) => ({ ...e })); }
  catch (e) { out.excError = `${e.name}: ${e.message}${where(e)}`; out.pageStops = "findExceptions throws at app.js:222: the page draws nothing below the header"; }
  if (!out.excError) {
    try { out.tiles = tilesPort(d, exc); }
    catch (e) { out.tilesError = `${e.name}: ${e.message}${where(e)}`; out.pageStops = "tiles() throws before exceptionsTable() (app.js:225): the page shows no tiles and no exception table"; }
  } else {
    // The page never reaches tiles(); say whether it would also fail there, so a second defect is not hidden by the first.
    try { tilesPort(d, []); out.notes.push("with no exception rows, the tiles() port would succeed"); }
    catch (e) { out.notes.push(`with no exception rows, the tiles() port would also throw ${e.name}: ${e.message}`); }
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ current output (browser)
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css", ".csv": "text/csv; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json", ".png": "image/png", ".ico": "image/x-icon" };
function startServer() {
  return new Promise((ok) => {
    const srv = createServer((req, res) => {
      try {
        let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
        if (p.endsWith("/")) p += "index.html";
        const f = join(REPO, p);
        if (!f.startsWith(REPO) || !existsSync(f) || !statSync(f).isFile()) { res.writeHead(404, { "content-type": "text/plain" }); return res.end("404: Not Found"); }
        res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" });
        res.end(readFileSync(f));
      } catch (e) { res.writeHead(500); res.end(String(e)); }
    });
    srv.listen(0, "127.0.0.1", () => ok(srv));
  });
}

async function loadPlaywright() {
  for (const t of [process.env.PLAYWRIGHT_PATH, "playwright", "/opt/node22/lib/node_modules/playwright/index.mjs"].filter(Boolean)) {
    try { return await import(t); } catch { /* next */ }
  }
  return null;
}

const TILE_KEYS = { "Needs attention": "needs_attention", "Head on grass": "head", "Water tanks OK": "water", "Yearling gain": "gain", "Spend vs budget": "budget" };

async function currentBrowser(browser, base, folder, renderChecks) {
  const out = { mode: "browser", rows: [], tiles: null, tilesError: null, excError: null, notes: [], pageStops: null, render: [] };
  const context = await browser.newContext({ timezoneId: "America/Chicago", locale: "en-US" });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`${e.name}: ${e.message}${where(e)}`));
    await page.route("**/data/*.csv", async (route) => {
      const name = new URL(route.request().url()).pathname.split("/").pop();
      const p = join(folder, name);
      if (existsSync(p)) await route.fulfill({ status: 200, contentType: "text/csv; charset=utf-8", body: readFileSync(p) });
      else await route.fulfill({ status: 404, contentType: "text/plain", body: "404: Not Found" });
    });
    await page.goto(base, { waitUntil: "load", timeout: 15000 });
    await page.waitForFunction(() => document.querySelectorAll("#rules tr").length > 1, null, { timeout: 4000 }).catch(() => out.notes.push("rules table never drawn within 4 s"));
    const snap = await page.evaluate((checks) => {
      const rows = [...document.querySelectorAll("#exceptions tr")].filter((tr) => tr.querySelector("td") && !tr.querySelector("td[colspan]"))
        .map((tr) => { const c = [...tr.cells].map((td) => td.innerText.replace(/\s+/g, " ").trim()); return { severity: c[0].toLowerCase(), area: c[1], subject: c[2], problem: c[3], action: c[4] }; });
      const tiles = [...document.querySelectorAll("#tiles .tile")].map((t) => ({ label: t.querySelector(".k")?.textContent, v: t.querySelector(".v")?.textContent, d: t.querySelector(".d")?.textContent }));
      const render = checks.map((c) => {
        if (c.check === "no_injected_element") { const n = document.querySelectorAll(c.selector).length; return { ...c, ok: n === 0, got: `${n} element(s)` }; }
        if (c.check === "global_not_set") { const v = window[c.name]; return { ...c, ok: v === undefined, got: String(v) }; }
        if (c.check === "text_visible") { const ok = document.body.innerText.includes(c.text); return { ...c, ok, got: ok ? "visible" : "not visible as text" }; }
        return { ...c, ok: false, got: "unknown check" };
      });
      return { rows, tiles, render, rulesDrawn: document.querySelectorAll("#rules tr").length > 1 };
    }, renderChecks);
    out.rows = snap.rows;
    out.render = snap.render;
    if (snap.tiles.length) { out.tiles = {}; for (const t of snap.tiles) out.tiles[TILE_KEYS[t.label] || t.label] = t; }
    else out.tilesError = "no tiles on the page";
    if (errors.length) { out.excError = errors.join(" | "); out.pageStops = snap.rows.length ? null : "page error before the exception table was drawn"; }
  } catch (e) {
    out.excError = `browser run failed: ${e.name}: ${e.message}`;
  } finally {
    await context.close().catch(() => {});
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ comparison
const ISO = /\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/g;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const word = (s) => new RegExp(`(^|[^A-Za-z0-9])${esc(s)}([^A-Za-z0-9]|$)`);

function subjectKey(row, kind) {
  const s = String(row.subject);
  if (kind === "tank") { const m = s.match(/^Tank (\S+) \(/); return m ? m[1] : null; }
  if (kind === "stay") { const m = s.match(/^(.+?) in /); return m ? m[1] : null; }
  if (kind === "animals") { const m = s.match(/^\d+ (.+)$/); return m ? m[1] : null; }
  if (kind === "group") return /^\d+ /.test(s) ? null : s;
  if (kind === "task" || kind === "category") return s;
  return null;                                   // record / file: the current code has no such rows
}
const sameKey = (row, e) => {
  const k = subjectKey(row, e.kind);
  if (k === null) return false;
  return e.kind === "animals" ? k.toLowerCase() === e.subject_key.toLowerCase() : k === e.subject_key;
};
const kindOf = (row) => {
  if (row.area === "Water") return "tank";
  if (row.area === "Grazing") return "stay";
  if (row.area === "Gain") return /^\d+ /.test(String(row.subject)) ? "animals" : "group";
  if (row.area === "Health") return "task";
  if (row.area === "Budget") return "category";
  return "?";
};

function shownNumbers(text, tags) {
  let t = text.replace(ISO, " ");
  for (const tag of tags) t = t.replace(new RegExp(word(tag).source, "g"), " ");
  t = t.replace(/\b[A-Za-z]+\d+[A-Za-z0-9]*\b/g, " ");
  return [...t.matchAll(/-?\$?\d[\d,]*(\.\d+)?/g)].map((m) => {
    const raw = m[0].replace(/[$,]/g, "");
    const dec = (raw.split(".")[1] || "").length;
    return { v: Number(raw), dec };
  }).filter((x) => Number.isFinite(x.v));
}
const numberShown = (want, shown) => shown.some((x) => Math.abs(x.v - want) <= 0.5 * 10 ** -x.dec + 1e-9 || Math.abs(Math.abs(x.v) - Math.abs(want)) <= 0.5 * 10 ** -x.dec + 1e-9);
const dateShown = (iso, text) => text.includes(iso) || text.includes(fmtDate(iso));

function compareRow(e, cur, used) {
  const states = [e.state, ...(e.state_alternatives || [])];
  const candidates = cur.rows.map((r, i) => ({ r, i })).filter(({ r, i }) => !used.has(i) && r.area === e.area && sameKey(r, e));
  const reasons = [];
  if (!states.includes("needs-attention")) {
    const other = candidates[0];
    return { ok: false, current: other ? other.r : null, reasons: [`the current code has no ${e.state.toUpperCase()} rows${other ? "; it shows an alert instead" : ""}`] };
  }
  if (!candidates.length) return { ok: false, current: null, reasons: ["no matching row"] };
  const pick = candidates.find(({ r }) => !e.severity || r.severity === e.severity) || candidates[0];
  used.add(pick.i);
  const r = pick.r, text = `${r.subject} ${r.problem}`, full = `${r.subject} ${r.problem} ${r.action}`;
  if (e.severity && r.severity !== e.severity) reasons.push(`severity ${r.severity}, expected ${e.severity}`);
  const shown = shownNumbers(text, e.key_tags || []);
  for (const [k, v] of Object.entries(e.key_numbers || {})) if (typeof v === "number" && !numberShown(v, shown)) reasons.push(`${k} ${+v.toFixed(4)} not shown`);
  for (const dt of e.key_dates || []) if (!dateShown(dt, text)) reasons.push(`date ${dt} not shown`);
  for (const tag of e.key_tags || []) if (!word(tag).test(text)) reasons.push(`tag ${tag} not shown`);
  const extraTags = (e.key_tags && e.kind === "animals") ? (r.problem.split(":")[1] || "").split(",").map((s) => s.trim()).filter((s) => s && !e.key_tags.includes(s)) : [];
  if (extraTags.length) reasons.push(`extra tags ${extraTags.join(", ")}`);
  if (e.key_text_any && e.state === "needs-attention" && !e.key_text_any.some((s) => full.toLowerCase().includes(s.toLowerCase()))) reasons.push(`none of ${JSON.stringify(e.key_text_any)} shown`);
  for (const s of e.must_not_appear || []) if (full.includes(s)) reasons.push(`shows '${s}'`);
  return { ok: !reasons.length, current: r, reasons };
}

function compareTiles(exp, cur) {
  const res = [];
  for (const t of exp.tile_expectations || []) {
    const got = cur.tiles?.[t.tile];
    const label = `tile ${t.tile}`;
    if (!got) { res.push({ label, ok: false, got: cur.tilesError ? `not drawn (${cur.tilesError})` : "not drawn", want: describeTile(t) }); continue; }
    const shown = `${got.v} | ${got.d}`;
    const bad = [];
    if (t.tile === "needs_attention") {
      const m = got.d.match(/(\d+) critical, (\d+) serious, (\d+) warning/);
      if (!m || +got.v !== t.total || +m[1] !== t.critical || +m[2] !== t.serious || +m[3] !== t.warning) bad.push("counts differ");
    } else if (t.tile === "water") {
      const m = got.v.match(/(-?\d+) of (\d+)/), n = got.d.match(/(\d+) need a look/);
      if (!m) bad.push("no 'N of M'");
      else {
        if (t.of !== undefined && +m[2] !== t.of) bad.push(`of ${m[2]}, expected ${t.of}`);
        if (t.ok !== undefined && +m[1] !== t.ok) bad.push(`ok ${m[1]}, expected ${t.ok}`);
        if (t.ok_at_most !== undefined && +m[1] > t.ok_at_most) bad.push(`ok ${m[1]}, expected at most ${t.ok_at_most}`);
        if (t.need_look !== undefined && (!n || +n[1] !== t.need_look)) bad.push(`need a look ${n ? n[1] : "?"}, expected ${t.need_look}`);
      }
    } else if (t.tile === "gain") {
      if (t.contains_any && !t.contains_any.some((s) => shown.includes(s))) bad.push(`none of ${t.contains_any.join(", ")}`);
    } else if (t.tile === "budget") {
      if (/NaN|Infinity|e\+/.test(shown)) bad.push("NaN, Infinity or e+ shown");
      const pm = got.v.match(/([+−-])([\d.]+)%/);
      const pct = pm ? (pm[1] === "+" ? 1 : -1) * Number(pm[2]) : NaN;
      if (t.sane && !(Math.abs(pct) < 100)) bad.push("percent not sane");
      if (t.pct !== undefined && !(Math.abs(pct - t.pct) <= 0.05 + 1e-9)) bad.push(`percent ${got.v}, expected ${t.pct.toFixed(1)}%`);
      if (t.actual_usd !== undefined) {
        const mm = got.d.match(/\$([\d,]+) of \$([\d,]+)/);
        if (!mm || Number(mm[1].replace(/,/g, "")) !== t.actual_usd || Number(mm[2].replace(/,/g, "")) !== t.budget_usd) bad.push(`dollars differ`);
      }
    } else if (t.tile === "head") {
      if (Number(String(got.v).replace(/,/g, "")) !== t.value) bad.push(`head ${got.v}, expected ${t.value}`);
    }
    res.push({ label, ok: !bad.length, got: shown, want: describeTile(t), why: bad.join("; ") });
  }
  return res;
}
function describeTile(t) {
  const { tile, note, ...rest } = t;
  return Object.entries(rest).map(([k, v]) => `${k}=${Array.isArray(v) ? v.join("/") : v}`).join(" ");
}

function areaStates(cur) {
  const s = {};
  for (const a of ["Water", "Grazing", "Gain", "Health", "Budget"]) s[a] = cur.excError && !cur.rows.length ? "error (no rows)" : cur.rows.some((r) => r.area === a) ? "needs-attention" : "ok";
  return s;
}

function compare(exp, cur) {
  const used = new Set();
  const rows = exp.expected_rows.map((e) => ({ e, ...compareRow(e, cur, used) }));
  const allowed = exp.allowed_extra_rows || [];
  const unexpected = cur.rows.filter((r, i) => !used.has(i) && !allowed.some((a) => a.state === "needs-attention" && a.area === r.area && sameKey(r, a)));
  const crashed = Boolean(cur.excError) && !cur.rows.length;
  const absent = (exp.expected_absent || []).map((a) => {
    const hit = cur.rows.find((r) => r.area === a.area && kindOf(r) === a.kind && sameKey(r, a));
    return { a, ok: crashed ? null : !hit, current: hit || null };   // N/A when the code produced no rows at all
  });
  const st = areaStates(cur);
  const areas = Object.entries(exp.area_states || {}).map(([a, want]) => ({ a, want, got: st[a], ok: st[a] === want }));
  const tiles = compareTiles(exp, cur);
  const allText = [...cur.rows.map((r) => `${r.subject} ${r.problem} ${r.action}`), ...Object.values(cur.tiles || {}).map((t) => `${t.v} ${t.d}`)].join(" \n ");
  const global = (exp.must_not_appear_anywhere || []).filter((s) => allText.includes(s));
  const render = cur.mode === "browser" ? (cur.render || []) : (exp.render_expectations || []).map((c) => ({ ...c, ok: null, got: "browser only" }));
  return { rows, unexpected, absent, areas, tiles, global, render };
}

// ------------------------------------------------------------------------------------------------ printing
const line = (r) => r ? `[${r.severity}] ${r.area} | ${r.subject} | ${r.problem}` : "none";
const tag = (ok) => (ok === null ? "N/A     " : ok ? "MATCH   " : "MISMATCH");

function printScenario(name, exp, cur, c) {
  const L = [];
  L.push("", "=".repeat(110), `${name}: ${exp.title}  [${cur.mode} mode]`, `as_of ${exp.as_of}`);
  for (const n of cur.notes) L.push(`  note: ${n}`);
  if (cur.excError) L.push(`  CURRENT ERROR: ${cur.excError}`);
  if (cur.tilesError) L.push(`  CURRENT TILES ERROR: ${cur.tilesError}`);
  if (cur.pageStops) L.push(`  ON THE PAGE: ${cur.pageStops}`);
  L.push(`  current rows (${cur.rows.length}):`);
  for (const r of cur.rows) L.push(`    ${line(r)}`);
  L.push("  expected rows:");
  for (const r of c.rows) {
    const e = r.e;
    L.push(`  ${tag(r.ok)} ${e.id.padEnd(12)} ${e.area}/${e.kind} '${e.subject_key}' ${e.state}${e.severity ? "/" + e.severity : ""}  ${JSON.stringify(e.key_numbers)}`);
    L.push(`             current: ${line(r.current)}${r.reasons.length ? "  <- " + r.reasons.join("; ") : ""}`);
  }
  for (const u of c.unexpected) L.push(`  MISMATCH UNEXPECTED   current row not in expected.json: ${line(u)}`);
  if (c.absent.length) L.push("  expected absent (no alert row for these):");
  for (const a of c.absent) L.push(`  ${tag(a.ok)} ${a.a.area}/${a.a.kind} '${a.a.subject_key}' (${a.a.reason})${a.ok === false ? "  <- current: " + line(a.current) : a.ok === null ? "  <- not checkable: the current code produced no rows" : ""}`);
  L.push("  area states:");
  for (const a of c.areas) L.push(`  ${tag(a.ok)} ${a.a.padEnd(8)} expected ${a.want}, current ${a.got}`);
  if (c.tiles.length) L.push("  tiles:");
  for (const t of c.tiles) L.push(`  ${tag(t.ok)} ${t.label.padEnd(20)} expected ${t.want}; current ${t.got}${t.why ? "  <- " + t.why : ""}`);
  if (c.render.length) L.push("  render:");
  for (const r of c.render) L.push(`  ${tag(r.ok)} ${r.check} ${r.selector || r.name || r.text}: ${r.got}`);
  L.push(`  must_not_appear_anywhere: ${c.global.length ? "MISMATCH shows " + c.global.join(", ") : "MATCH"}`);
  console.log(L.join("\n"));
}

function summarise(name, c) {
  const n = (arr, f = (x) => x.ok) => `${arr.filter(f).length}/${arr.length}`;
  const ok = c.rows.every((r) => r.ok) && !c.unexpected.length && c.absent.every((a) => a.ok !== false) && c.areas.every((a) => a.ok) && c.tiles.every((t) => t.ok) && !c.global.length && c.render.every((r) => r.ok !== false);
  const absent = c.absent.some((a) => a.ok === null) ? "n/a" : n(c.absent);
  return { name, rows: n(c.rows), unexpected: c.unexpected.length, absent, areas: n(c.areas), tiles: n(c.tiles), render: c.render.length ? n(c.render.filter((r) => r.ok !== null)) : "-", global: c.global.length ? c.global.join(",") : "-", verdict: ok ? "MATCH" : "MISMATCH" };
}

// ------------------------------------------------------------------------------------------------ main
const report = { generated_note: "current output vs expected.json; expected.json describes Phase-1 behaviour", tz: process.env.TZ, modes: {} };
try {
  const names = readdirSync(SCEN).filter((n) => /^\d\d-/.test(n) && existsSync(join(SCEN, n, "expected.json"))).filter((n) => !ONLY || n.startsWith(String(ONLY))).sort();
  const modes = ["node"];
  let browser = null, srv = null, base = null;
  if (BROWSER) {
    const pw = await loadPlaywright();
    if (!pw) console.log("browser mode skipped: Playwright not found (set PLAYWRIGHT_PATH)");
    else {
      try {
        browser = await pw.chromium.launch();
        srv = await startServer();
        base = `http://127.0.0.1:${srv.address().port}/`;
        modes.push("browser");
      } catch (e) { console.log(`browser mode skipped: ${e.name}: ${e.message}`); }
    }
  }
  console.log(`scenarios.run.mjs  TZ=${process.env.TZ}  modes: ${modes.join(", ")}  exceptions.js ${X ? "loaded" : "NOT LOADED: " + loadError}`);
  for (const mode of modes) {
    const sums = [];
    for (const name of names) {
      try {
        const folder = join(SCEN, name);
        const exp = JSON.parse(readFileSync(join(folder, "expected.json"), "utf8"));
        const cur = mode === "node" ? currentNode(folder) : await currentBrowser(browser, base, folder, exp.render_expectations || []);
        const c = compare(exp, cur);
        printScenario(name, exp, cur, c);
        const s = summarise(name, c);
        s.error = cur.excError || cur.tilesError || "";
        sums.push(s);
      } catch (e) {
        console.log(`\n${name}: runner error ${e.name}: ${e.message}`);
        sums.push({ name, verdict: "RUNNER ERROR", error: String(e) });
      }
    }
    report.modes[mode] = sums;
    console.log(`\n${"#".repeat(110)}\nSUMMARY (${mode} mode; MATCH means today's output already meets the Phase-1 expectation)`);
    console.log(["scenario".padEnd(42), "rows", "unexp", "absent", "areas", "tiles", "render", "verdict", "  current error"].join("  "));
    for (const s of sums) console.log([s.name.padEnd(42), String(s.rows).padEnd(5), String(s.unexpected).padEnd(5), String(s.absent).padEnd(6), String(s.areas).padEnd(5), String(s.tiles).padEnd(5), String(s.render).padEnd(6), String(s.verdict).padEnd(8), " " + (s.error || "").slice(0, 70)].join(" "));
  }
  if (browser) await browser.close().catch(() => {});
  if (srv) srv.close();
  if (JSON_OUT && JSON_OUT !== true) { writeFileSync(JSON_OUT, JSON.stringify(report, null, 1)); console.log(`\nwrote ${JSON_OUT}`); }
} catch (e) {
  console.log(`runner error: ${e.name}: ${e.message}`);
}
