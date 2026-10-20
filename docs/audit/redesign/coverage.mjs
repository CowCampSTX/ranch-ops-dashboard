#!/usr/bin/env node
// Checks the redesigned page (the commit after the audit) against the audit findings that
// docs/audit/08-redesign-coverage.md says it addresses. Read-only: it copies the page and data to a temporary folder,
// builds the edited-data cases there, serves them itself and changes no repository file.
//
// Usage (from the repository root):
//   node docs/audit/redesign/coverage.mjs [port]      # default port 8802
//
// Needs Node 22 and Playwright ($PLAYWRIGHT_PATH, else /opt/node22/lib/node_modules/playwright/index.mjs).
// Each line is PASS or FAIL with what was measured. A PASS shows the page behaves as the finding expects in that one
// case; it is not the finding's Phase 1 acceptance test.
//
// Cases (each is the committed data with one edit)
//   hostile    pasture P2 named '<img src=x onerror="window.__xss=1">', P4 named 'Lone Tree <A', heifer tags '<i>H001</i>'
//   wells      tanks T2 and T4 renamed 'Well 2' and 'Well 4'
//   onbudget   every month's actual equal to its budget
//   longnames  Yearlings renamed 'Yearling steers on the north lease'; 'Water and fencing' renamed to a longer name
//   gap        tank T1 has no readings from Sep 26 00:00 to Sep 27 12:00
//   shipped    every Yearlings row removed from groups, weights, moves and health
//   t6old      tank T6 has no reading after Sep 22 12:00
//   faultcode  tank T7's last reading is 'ERR'
//   badweight  every weigh-in of Y010 reads 'n/a'
//   zerobudget Repairs has a $0 budget, and a Misc category is $0 of $0
//   tbdplan    pasture P3 (the yearlings' current stay) has 'TBD' planned days
//   singleweigh Y020 has only its last weigh-in
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, extname, resolve, sep } from "node:path";

const PW = [process.env.PLAYWRIGHT_PATH, "/opt/node22/lib/node_modules/playwright/index.mjs"].filter(Boolean).find((p) => existsSync(p));
if (!PW) throw new Error("Playwright not found; set PLAYWRIGHT_PATH");
const { chromium } = await import(PW);
const PORT = +(process.argv[2] ?? 8802);

// ---------------------------------------------------------------- build the cases in a temporary folder
const ROOT = mkdtempSync(join(tmpdir(), "redesign-coverage-"));
const site = (dir) => { for (const f of ["index.html", "app.js", "exceptions.js", "data"]) cpSync(f, join(dir, f), { recursive: true }); };
site(ROOT);
const read = (n) => readFileSync(`data/${n}.csv`, "utf8").trim().split("\n").map((l) => l.split(","));
function makeCase(name, edits) {
  const dir = join(ROOT, "cases", name);
  site(dir);
  for (const [file, rows] of Object.entries(edits)) writeFileSync(join(dir, "data", `${file}.csv`), rows.map((r) => r.join(",")).join("\n") + "\n");
}
const isHead = (r, k) => r[0] === k;
makeCase("hostile", {
  pastures: read("pastures").map((r) => (r[0] === "P2" ? [r[0], '<img src=x onerror="window.__xss=1">', ...r.slice(2)] : r[0] === "P4" ? [r[0], "Lone Tree <A", ...r.slice(2)] : r)),
  weights: read("weights").map((r) => (r[1] === "Heifers" ? [`<i>${r[0]}</i>`, ...r.slice(1)] : r)),
});
makeCase("wells", { water: read("water").map((r) => [{ T2: "Well 2", T4: "Well 4" }[r[0]] ?? r[0], ...r.slice(1)]) });
makeCase("onbudget", { budget: read("budget").map((r) => (isHead(r, "month") ? r : [r[0], r[1], r[2], r[2]])) });
const LONG = "Yearling steers on the north lease";
makeCase("longnames", {
  ...Object.fromEntries(["groups", "moves", "weights", "health"].map((n) => [n, read(n).map((r) => r.map((v) => (v === "Yearlings" ? LONG : v)))])),
  budget: read("budget").map((r) => (r[1] === "Water and fencing" ? [r[0], "Water development and fencing repairs", ...r.slice(2)] : r)),
});
makeCase("gap", { water: read("water").filter((r) => !(r[0] === "T1" && r[2] >= "2026-09-26T00:00" && r[2] <= "2026-09-27T12:00")) });
makeCase("shipped", Object.fromEntries(["groups", "weights", "moves", "health"].map((n) => [n, read(n).filter((r) => !r.includes("Yearlings"))])));
makeCase("t6old", { water: read("water").filter((r) => !(r[0] === "T6" && r[2] > "2026-09-22T12:00")) });
const lastT7 = read("water").map((r, i) => [r, i]).filter(([r]) => r[0] === "T7").at(-1)[1];
makeCase("faultcode", { water: read("water").map((r, i) => (i === lastT7 ? [...r.slice(0, 3), "ERR"] : r)) });
makeCase("badweight", { weights: read("weights").map((r) => (r[0] === "Y010" ? [...r.slice(0, 3), "n/a"] : r)) });
makeCase("zerobudget", { budget: [...read("budget").map((r) => (r[1] === "Repairs" ? [r[0], r[1], "0", r[3]] : r)), ["2026-09", "Misc", "0", "0"]] });
makeCase("tbdplan", { pastures: read("pastures").map((r) => (r[0] === "P3" ? [...r.slice(0, 3), "TBD", ...r.slice(4)] : r)) });
makeCase("singleweigh", { weights: read("weights").filter((r) => !(r[0] === "Y020" && r[2] !== "2026-09-15")) });

// ---------------------------------------------------------------- serve it
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".csv": "text/csv" };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const f = resolve(ROOT, "." + p);
  if (!f.startsWith(ROOT + sep) || !existsSync(f)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": TYPES[extname(f)] ?? "application/octet-stream" });
  res.end(readFileSync(f));
}).listen(PORT, "127.0.0.1");
const PAGE = `http://127.0.0.1:${PORT}/`, CASES = `${PAGE}cases/`;

// ---------------------------------------------------------------- checks
const browser = await chromium.launch();
const out = [];
const check = (id, ok, detail) => { out.push({ id, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"} ${id}: ${detail}`); };
async function open(url, opt = {}) {
  const ctx = await browser.newContext({ viewport: { width: opt.w ?? 1280, height: opt.h ?? 900 }, isMobile: !!opt.touch, hasTouch: !!opt.touch,
    locale: "en-US", timezoneId: "America/Denver", reducedMotion: "reduce", deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  if (opt.route) await opt.route(page);
  await page.goto(url, { waitUntil: opt.wait ?? "networkidle" });
  if (!opt.noWait) await page.waitForTimeout(600);
  return { page, errs, close: () => ctx.close() };
}
const rows = (p) => p.$$eval("#exceptions tbody tr:not(.empty)", (t) => t.map((r) => r.innerText.replace(/\s+/g, " ").trim()));

// SEC-01
{
  const { page, errs, close } = await open(`${CASES}hostile/`);
  const html = await page.$eval("#exceptions", (e) => e.innerHTML);
  const xss = await page.evaluate(() => window.__xss);
  const imgs = await page.$$eval("main img", (i) => i.length);
  const t4 = (await rows(page)).find((r) => r.includes("Tank T4")) ?? "";
  await page.focus("#gain svg.chart"); await page.keyboard.press("Home");
  const tipText = await page.$eval("#tip", (t) => t.textContent), tipHtml = await page.$eval("#tip", (t) => t.innerHTML);
  check("SEC-01", !xss && !imgs && html.includes("&lt;img") && t4.includes("Tank T4 (Lone Tree <A, Heifers here now)") && /<i>H\d+<\/i>/.test(tipText) && tipHtml.includes("&lt;i&gt;") && !errs.length,
    `xss flag ${xss}, img elements ${imgs}, list escapes markup ${html.includes("&lt;img")}, T4 subject "${t4.slice(9, 52)}", gain tooltip shows tag as text ${/<i>H\d+<\/i>/.test(tipText)}, errors ${errs.length}`);
  await close();
}
// UI-01: tap and keyboard
{
  const { page, close } = await open(PAGE, { w: 390, h: 844, touch: true });
  const dot = await page.$("#gain svg.chart circle[fill='var(--s1)']");
  await dot.scrollIntoViewIfNeeded(); const b = await dot.boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(150);
  const tap = await page.$eval("#tip", (t) => (t.hidden ? "" : t.textContent));
  await close();
  const k = await open(PAGE);
  let reached = "";
  for (let i = 0; i < 40 && !reached; i++) { await k.page.keyboard.press("Tab"); reached = await k.page.evaluate(() => document.activeElement.matches("svg.chart") ? document.activeElement.getAttribute("aria-label") : ""); }
  const kt = await k.page.$eval("#tip", (t) => (t.hidden ? "" : t.textContent));
  check("UI-01", /lbs\/day/.test(tap) && !!reached && /%/.test(kt), `tap on a gain dot shows "${tap.slice(0, 60)}"; Tab reaches "${reached.slice(0, 40)}" and shows "${kt.slice(0, 40)}"`);
  await k.close();
}
// UI-02 and UI-03 at 390
{
  const { page, close } = await open(PAGE, { w: 390, h: 844, touch: true });
  const act = await page.$$eval("#exceptions tbody tr .c-action", (c) => c.map((e) => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && getComputedStyle(e).display !== "none"; }));
  const diff = await page.$$eval("#budgetTable tbody tr", (t) => { const r = t.find((x) => x.innerText.includes("Repairs")); const c = r.lastElementChild, cr = c.getBoundingClientRect(); return { text: c.innerText, inside: cr.right <= innerWidth && c.scrollWidth <= c.clientWidth + 1 }; });
  check("UI-02", act.length === 10 && act.every(Boolean) && diff.text === "+$1,800" && diff.inside, `${act.filter(Boolean).length}/${act.length} first steps on screen; Repairs difference "${diff.text}" fully visible ${diff.inside}`);
  const sizes = await page.$$eval("svg.chart", (s) => s.map((c) => { const fs = parseFloat(getComputedStyle(c.querySelector("text")).fontSize); return +(fs * c.getBoundingClientRect().width / c.viewBox.baseVal.width).toFixed(1); }));
  check("UI-03", sizes.every((x) => x >= 11), `rendered chart text ${Math.min(...sizes)}-${Math.max(...sizes)} px across ${sizes.length} charts`);
  const heights = await page.$$eval("#tanks .tank-name", (n) => [...new Set(n.map((e) => Math.round(e.getBoundingClientRect().height)))]);
  const ov = await page.evaluate(() => { const t = [...document.querySelectorAll("#gain svg text")].filter((x) => x.textContent.trim()).map((x) => x.getBoundingClientRect()); let n = 0;
    for (let i = 0; i < t.length; i++) for (let j = i + 1; j < t.length; j++) if (t[i].left < t[j].right - 1 && t[j].left < t[i].right - 1 && t[i].top < t[j].bottom - 1 && t[j].top < t[i].bottom - 1) n++; return n; });
  check("UI-12", heights.length === 1 && ov === 0, `tank name heights at 390 px ${JSON.stringify(heights)}; overlapping gain labels ${ov}`);
  await close();
}
// UI-04
{
  const { page, close } = await open(`${CASES}wells/`);
  const tile = await page.$$eval("#tiles .tile", (t) => t.map((x) => x.innerText.replace(/\s+/g, " ")).find((x) => x.includes("Water tanks")));
  check("UI-04", /5 of 8/.test(tile) && /3 need a look/.test(tile), tile.slice(0, 90));
  await close();
}
// UI-05: month labels come from the data
{
  const { page, close } = await open(PAGE);
  const months = await page.$$eval("#grazing svg text", (t) => t.map((x) => x.textContent).filter((s) => /^[A-Z][a-z]{2}$/.test(s)));
  check("UI-05", months.join() === "Jun,Jul,Aug,Sep", `labels ${months.join(", ")} (drawn from the moves' first in_date to the later of as_of and the planned move dates)`);
  await close();
}
// UI-07
{
  const { page, close } = await open(`${CASES}onbudget/`);
  const tile = await page.$$eval("#tiles .tile", (t) => t.map((x) => x.innerText.replace(/\s+/g, " ")).find((x) => x.includes("Spend")));
  const labels = await page.$$eval("#budgetTable .val", (v) => v.map((x) => x.textContent));
  await page.click("#chips [data-a='Budget']");
  const empty = await page.$eval("#exceptions tbody", (b) => b.innerText.trim());
  check("UI-07", tile.includes("0.0%") && !/[−-]0/.test(tile) && labels.every((l) => l === "0%") && empty === "Nothing in budget needs attention.", `tile "${tile.slice(15, 60)}", bar labels ${[...new Set(labels)].join()}, filter message "${empty}"`);
  await close();
}
// UI-10
{
  const { page, close } = await open(PAGE);
  await page.focus("#chips [data-a='Water']"); await page.keyboard.press("Enter"); await page.waitForTimeout(100);
  const a = await page.evaluate(() => document.activeElement.dataset.a);
  const n = (await rows(page)).length;
  const pressed = await page.$$eval("#chips button", (b) => b.filter((x) => x.getAttribute("aria-pressed") === "true").map((x) => x.dataset.a));
  await page.keyboard.press("Tab");
  const next = await page.evaluate(() => document.activeElement.dataset.a);
  check("UI-10", a === "Water" && n === 3 && pressed.join() === "Water" && next === "Grazing", `focus ${a}, ${n} rows, pressed ${pressed}, Tab goes to ${next}`);
  await close();
}
// UI-14
{
  const { page, errs, close } = await open(`${CASES}longnames/`);
  const g = await page.evaluate(() => { const s = document.querySelector("#grazing svg"); const firstBar = Math.min(...[...s.querySelectorAll("rect[rx='4']")].map((r) => r.getBBox().x));
    return { lab: Math.max(...[...s.querySelectorAll("text.hd")].map((t) => t.getBBox().x + t.getBBox().width)), firstBar, text: [...s.querySelectorAll("text.hd")].map((t) => t.textContent) }; });
  const cat = await page.$$eval("#budgetTable tbody td:first-child", (c) => c.map((e) => e.scrollWidth <= e.clientWidth + 1));
  check("UI-14", g.lab <= g.firstBar && cat.every(Boolean) && !errs.length, `grazing labels end at x ${g.lab.toFixed(0)}, first bar starts at ${g.firstBar.toFixed(0)} (${g.text.join(" | ")}); budget names fit their cells ${cat.every(Boolean)}`);
  await close();
}
// UI-15
{
  const { page, close } = await open(`${CASES}gap/`);
  const sel = "#tanks svg.chart[aria-label^='Tank T1 ']";   // tanks are listed worst first, so find T1 by name
  const ms = await page.$eval(sel, (s) => [...s.querySelectorAll("path[fill='none']")].length);
  const label = await page.$eval(sel, (s) => s.getAttribute("aria-label"));
  check("UI-15", ms === 2, `${label.slice(0, 22)}: ${ms} line segments around the 36-hour gap`);
  await close();
}
// UI-16
{
  const { page, close } = await open(PAGE);
  const warn = await page.$$eval("#gain svg circle[fill='var(--warning)']", (c) => c.length);
  const refs = await page.$$eval("#gain svg text", (t) => t.map((x) => x.textContent).filter((s) => /%/.test(s)));
  check("UI-16", warn === 6 && refs.length >= 2, `${warn} flagged dots; reference labels ${refs.join(", ")}`);
  await close();
}
// GRZ-06 and GAIN-13
{
  const { page, close } = await open(PAGE);
  const note = await page.$eval("#grazing-sec .note", (n) => n.textContent);
  check("GRZ-06", /current stay/i.test(note), `note: "${note}"`);
  const hint = await page.$eval("#gain .hint", (h) => h.textContent).catch(() => "");
  check("GAIN-13 (chart note only)", /Cows/.test(hint), `"${hint}"`);
  await close();
}
// LOAD-02: loading state, then a missing file
{
  const { page, close } = await open(PAGE, { wait: "commit", noWait: true, route: (p) => p.route("**/data/*.csv", async (r) => { await new Promise((ok) => setTimeout(ok, 3000)); r.continue(); }) });
  await page.waitForTimeout(1000);
  const loading = await page.$eval("#summary", (s) => s.innerText);
  await close();
  const m = await open(PAGE, { route: (p) => p.route("**/data/water.csv", (r) => r.fulfill({ status: 404, body: "" })) });
  const msg = await m.page.$eval("#summary", (s) => s.innerText.replace(/\s+/g, " "));
  check("LOAD-02 (partly)", /loading/i.test(loading) && /didn't load/.test(msg), `at 1 s: "${loading.trim()}"; water.csv 404: "${msg.slice(0, 80)}" (no file named, other areas not drawn)`);
  await m.close();
}
// LOAD-01: a header-only water file
{
  const { page, errs, close } = await open(PAGE, { route: (p) => p.route("**/data/water.csv", (r) => r.fulfill({ status: 200, contentType: "text/csv", body: "tank_id,pasture_id,time,level_pct\n" })) });
  const tile = await page.$$eval("#tiles .tile", (t) => t.map((x) => x.innerText.replace(/\s+/g, " ")).find((x) => x.includes("Water tanks")));
  const sum = await page.$eval("#waterSum", (x) => x.innerText);
  check("LOAD-01 (partly)", /No data/.test(tile) && !/0 of 0|normally/.test(tile) && sum === "No readings" && !errs.length, `tile "${tile}", water card "${sum}" (the list still has no water row and no file is named)`);
  await close();
}
// LOAD-03
{
  const r = await open(`${CASES}shipped/`);
  const n = (await rows(r.page)).length;
  const tile = await r.page.$$eval("#tiles .tile", (t) => t.map((x) => x.innerText.replace(/\s+/g, " "))[2]);
  check("LOAD-03", n === 7 && !r.errs.length, `yearlings shipped: ${n} rows, gain tile "${tile.slice(0, 50)}", errors ${r.errs.length}`);
  await r.close();
}
// LOAD-04
{
  const { page, errs, close } = await open(`${CASES}t6old/`);
  const tanks = await page.$$eval("#tanks .tank", (t) => t.length);
  const t6 = await page.$$eval("#tanks .tank", (t) => t.map((x) => x.innerText.replace(/\s+/g, " ")).find((x) => x.startsWith("T6")) ?? "");
  const t6row = (await rows(page)).find((r) => r.includes("T6")) ?? "";
  const body = await page.$$eval("#budgetTable tbody tr", (t) => t.length), rules = await page.$$eval("#rules tbody tr", (t) => t.length);
  const charts = await page.$$eval("#grazing svg, #gain svg", (s) => s.length);
  check("LOAD-04", !errs.length && tanks === 8 && /No readings/.test(t6) && /198 hours/.test(t6row) && body === 6 && rules === 11 && charts === 2,
    `errors ${errs.length}, ${tanks} tanks, T6 "${t6.slice(0, 60)}", list "${t6row.slice(0, 70)}", budget rows ${body}, rules ${rules}, grazing and gain charts ${charts}`);
  await close();
}
// Display guards: the rules are unchanged, so these show only that the page no longer prints NaN, 0% or OK for them.
const shown = (p) => p.evaluate(() => document.querySelector("main").innerText);
{
  const { page, errs, close } = await open(`${CASES}faultcode/`);
  const t7 = await page.$$eval("#tanks .tank", (t) => t.map((x) => x.innerText.replace(/\s+/g, " ")).find((x) => x.startsWith("T7")) ?? "");
  const tile = await page.$$eval("#tiles .tile", (t) => t.map((x) => x.innerText.replace(/\s+/g, " ")).find((x) => x.includes("Water tanks")));
  const nan = await page.$$eval("#tanks svg [d*='NaN'], #tanks svg [cy='NaN']", (n) => n.length);
  const listed = (await rows(page)).some((r) => r.includes("T7"));
  check("WAT-01 (display only)", /Can't tell/.test(t7) && /T7 can't tell/.test(tile) && !nan && !errs.length,
    `T7 card "${t7.slice(0, 40)}", tile "${tile.slice(15, 110)}", NaN in tank charts ${nan}; the list has a T7 row: ${listed} (rules unchanged)`);
  await close();
}
{
  const { page, errs, close } = await open(`${CASES}badweight/`);
  const tile = await page.$$eval("#tiles .tile", (t) => t.map((x) => x.innerText.replace(/\s+/g, " "))[2]);
  const text = await shown(page), nan = await page.$$eval("#gain svg [cx='NaN'], #gain svg [x='NaN']", (n) => n.length);
  check("Weight that is not a number (display only; related CSV-04, GAIN-04)", /Can't tell/.test(tile) && !/NaN/.test(text) && !nan && !errs.length, `gain tile "${tile.slice(0, 80)}", NaN on the page ${/NaN/.test(text)}, NaN in the gain chart ${nan}`);
  await close();
}
{
  const { page, errs, close } = await open(`${CASES}zerobudget/`);
  const table = await page.$eval("#budgetTable", (t) => t.innerText.replace(/\s+/g, " "));
  const listRow = (await rows(page)).find((r) => r.includes("Repairs")) ?? "";
  check("BUD-03 (display only)", !/Infinity|NaN/.test(table) && /no budget/.test(table) && !errs.length, `budget table shows Infinity or NaN: ${/Infinity|NaN/.test(table)}; the list still reads "${listRow.slice(0, 60)}" (rules unchanged)`);
  await close();
}
{
  const { page, errs, close } = await open(`${CASES}tbdplan/`);
  const now = await page.$$eval("#nowGrazing li", (l) => l.map((x) => x.innerText.replace(/\s+/g, " ")).find((x) => x.startsWith("Yearlings")) ?? "");
  const listed = (await rows(page)).some((r) => r.includes("Sand Hills"));
  check("GRZ-03 (display only)", /No plan/.test(now) && !/NaN|-day/.test(now) && !errs.length, `now grazing "${now}"; the list has a Sand Hills row: ${listed} (rules unchanged)`);
  await close();
}
{
  const { page, close } = await open(`${CASES}singleweigh/`);
  const msg = await page.$eval("#summary", (s) => s.innerText.replace(/\s+/g, " "));
  check("GAIN-01 (message only)", /couldn't be worked out/.test(msg), `"${msg.slice(0, 95)}" (the rules still fail on one weigh-in)`);
  await close();
}
console.log(JSON.stringify({ pass: out.filter((x) => x.ok).length, fail: out.filter((x) => !x.ok).map((x) => x.id) }));
await browser.close();
server.close();
rmSync(ROOT, { recursive: true, force: true });
process.exitCode = out.every((x) => x.ok) ? 0 : 1;
