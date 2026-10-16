#!/usr/bin/env node
// Skeptic re-check of the render audit, plus the defects it missed. Headless Chromium against the REAL page.
//
// Usage (from anywhere):  node docs/audit/diagnostics/render.skeptic.browser.mjs [scratchDir] [port]
//
// Copies index.html, app.js, exceptions.js and data/ into scratchDir/sites/<case>/ (the repo is never modified),
// edits the copied CSVs, serves scratchDir/sites with `python3 -m http.server`, loads each case and prints what the
// page shows. Expected values are worked out by hand in the comments. The server is killed on exit.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { cpSync, mkdirSync, readFileSync, writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SCRATCH = process.argv[2] || mkdtempSync(join(tmpdir(), "render-skeptic-"));
const PORT = Number(process.argv[3] || 8932);
const SITES = join(SCRATCH, "sites");
rmSync(SITES, { recursive: true, force: true });
mkdirSync(SITES, { recursive: true });

const rd = (d, f) => readFileSync(`${d}/data/${f}.csv`, "utf8");
const wr = (d, f, t) => writeFileSync(`${d}/data/${f}.csv`, t);
const hdr = (d, f) => wr(d, f, rd(d, f).split("\n")[0] + "\n");
const sub = (d, files, a, b) => files.forEach((f) => wr(d, f, rd(d, f).split(a).join(b)));
const CASES = {
  baseline: () => {},
  // M3: blank head count. Hand value: 180 + 150 = 330 head with a 'missing count' note; never a concatenated string.
  "blank-head": (d) => sub(d, ["groups"], "Heifers,first-calf heifers,45,", "Heifers,first-calf heifers,,"),
  "blank-head-first": (d) => sub(d, ["groups"], "Cows,cow-calf pairs,180,", "Cows,cow-calf pairs,,"),
  // M3: blank acres on P8 (last row). Hand value: 4,300 - 200 = 4,100 known acres, shown with a separator and a note.
  "blank-acres": (d) => sub(d, ["pastures"], "P8,Home Trap,200,", "P8,Home Trap,,"),
  // M2: long names. Grazing plot starts at x=74; budget labels end at x=130 and must start at x >= 0.
  "long-names": (d) => { sub(d, ["groups", "moves", "weights", "health"], "Heifers", "Replacement heifers"); sub(d, ["budget"], "Water and fencing", "Water development and fencing repairs"); },
  // Correction to F2/F3: header-only moves.csv does not throw; it is another silent all-clear.
  "empty-moves": (d) => hdr(d, "moves"),
  // Correction to F6: a zero-and-unspent category (budget 0, actual 0).
  "zero-zero-budget": (d) => wr(d, "budget", rd(d, "budget").trimEnd() + "\n2026-09,Contingency,0,0\n"),
  // Correction to F9: Fuel exactly on budget -> chart label and tooltip.
  "on-budget": (d) => wr(d, "budget", "month,category,budget,actual\n2026-09,Fuel,1000,1000\n2026-09,Labor,2000,1900\n"),
};
for (const [n, mut] of Object.entries(CASES)) {
  const d = join(SITES, n);
  mkdirSync(d, { recursive: true });
  for (const f of ["index.html", "app.js", "exceptions.js"]) cpSync(join(REPO, f), join(d, f));
  cpSync(join(REPO, "data"), join(d, "data"), { recursive: true });
  mut(d);
}
const srv = spawn("python3", ["-m", "http.server", String(PORT), "--directory", SITES], { stdio: "ignore" });
for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${PORT}/`); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }
const URL = (n) => `http://127.0.0.1:${PORT}/${n}/index.html`;
const browser = await chromium.launch();
const show = (k, v) => console.log(`  ${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`);
async function open(n, opts = {}, clock) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  if (clock) await page.clock.setFixedTime(clock);
  await page.goto(URL(n));
  await page.waitForTimeout(700);
  return { ctx, page, errors };
}
const tiles = (page) => page.evaluate(() => [...document.querySelectorAll("#tiles .tile")].map((t) => t.innerText.replace(/\n+/g, " | ")));
try {
  console.log("M1 chart details on a touch phone (390x844, isMobile, hasTouch) and by keyboard");
  {
    const { ctx, page } = await open("baseline", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const res = {};
    for (const [k, sel] of [["gain dot", "#gain circle"], ["budget bar", "#budgetChart rect"], ["water chart", "#water .mini svg rect[fill=transparent]"], ["grazing bar", "#grazing rect[fill=transparent]"]]) {
      const el = await page.$(sel); await el.scrollIntoViewIfNeeded(); const b = await el.boundingBox();
      await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(250);
      res[k] = await page.evaluate(() => tip.style.display || "(never shown)");
    }
    show("tooltip display after a tap (expected: block, showing the detail)", res);
    await page.evaluate(() => { window.__ev = []; const c = document.querySelector("#gain circle"); for (const t of ["pointerdown", "pointermove", "pointerup", "pointerleave", "click"]) c.addEventListener(t, () => window.__ev.push(t)); });
    const el = await page.$("#gain circle"); const b = await el.boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(250);
    show("pointer events a tap delivers to a gain dot", await page.evaluate(() => window.__ev));
    const cdp = await ctx.newCDPSession(page); const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: cx, y: cy }] });
    for (let i = 1; i <= 3; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: cx + i, y: cy }] });
    const during = await page.evaluate(() => tip.style.display);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await page.waitForTimeout(200);
    show("press-and-drag: tooltip while finger down / after lift", [during, await page.evaluate(() => tip.style.display)]);
    await ctx.close();
  }
  {
    const { ctx, page } = await open("baseline");
    const seen = [];
    for (let i = 0; i < 40; i++) { await page.keyboard.press("Tab"); seen.push(await page.evaluate(() => { const a = document.activeElement; return a.tagName + (a.dataset?.a ? ":" + a.dataset.a : "") + (a.closest("svg") ? " (in a chart)" : ""); })); }
    show("distinct elements reached by 40 Tab presses (expected: some chart detail)", [...new Set(seen)]);
    await ctx.close();
  }

  console.log("M2 long group / category names overflow their label gutters");
  {
    const { ctx, page } = await open("long-names");
    show("labels", await page.evaluate(() => ({
      grazing: [...document.querySelectorAll("#grazing text.lbl")].map((t) => { const b = t.getBBox(); return `${t.textContent}: x ${Math.round(b.x)}..${Math.round(b.x + b.width)} (plot starts at 74)`; }),
      gain: [...document.querySelectorAll("#gain text.lbl")].map((t) => { const b = t.getBBox(); return `${t.textContent}: x ${Math.round(b.x)}..${Math.round(b.x + b.width)} (plot starts at 74)`; }),
      budget: [...document.querySelectorAll("#budgetChart text.lbl")].filter((t) => t.getAttribute("x") === "130").map((t) => { const b = t.getBBox(); return `${t.textContent}: x ${Math.round(b.x)}..${Math.round(b.x + b.width)} (svg starts at 0)`; }),
    })));
    await page.screenshot({ path: join(SCRATCH, "long-names.png"), fullPage: true });
    await ctx.close();
  }

  console.log("M3 blank head / acres cells are string-concatenated into headline numbers");
  for (const n of ["blank-head", "blank-head-first", "blank-acres"]) {
    const { ctx, page, errors } = await open(n);
    show(n, { uncaught: errors, head: (await tiles(page))[1], asof: await page.evaluate(() => document.getElementById("asof").textContent.slice(0, 70)) });
    await ctx.close();
  }

  console.log("M4 no stale-data warning: browser clock 2026-10-16 09:00, data as_of 2026-09-30T18:00");
  {
    const { ctx, page } = await open("baseline", {}, new Date("2026-10-16T09:00:00"));
    show("now / asof line / age wording on the page", await page.evaluate(() => ({ now: new Date().toString().slice(0, 21), asof: document.getElementById("asof").textContent,
      ageWords: document.body.innerText.match(/[^\n]{0,20}\b(ago|stale|out of date|not updated|days old|hours old)\b[^\n]{0,20}/gi) })));
    await ctx.close();
  }

  console.log("Correction F2/F3: header-only moves.csv");
  {
    const { ctx, page, errors } = await open("empty-moves");
    await page.click('#chips [data-a="Grazing"]');
    show("result", await page.evaluate(() => ({ chips: [...document.querySelectorAll("#chips .chip")].map((c) => c.textContent),
      grazingFilter: document.querySelector("#exceptions tr:nth-child(2)").innerText,
      grazingBars: document.querySelectorAll("#grazing rect").length,
      nanAttrs: [...document.querySelectorAll("#grazing svg *")].flatMap((e) => [...e.attributes].filter((a) => /NaN/.test(a.value))).length })));
    show("uncaught", errors);
    await ctx.close();
  }
  console.log("Correction F6: Contingency budget 0, actual 0");
  {
    const { ctx, page } = await open("zero-zero-budget");
    show("result", await page.evaluate(() => ({ budgetChips: document.querySelector('#chips [data-a="Budget"]').textContent,
      labels: [...document.querySelectorAll("#budgetChart text.lbl")].map((t) => t.textContent).filter((s) => /%/.test(s)),
      nanAttrs: [...document.querySelectorAll("#budgetChart svg *")].flatMap((e) => [...e.attributes].filter((a) => /NaN/.test(a.value))).length })));
    await ctx.close();
  }
  console.log("Correction F9: Fuel 1000/1000 in the budget chart");
  {
    const { ctx, page } = await open("on-budget");
    const bar = await page.$("#budgetChart rect"); await bar.scrollIntoViewIfNeeded(); const b = await bar.boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(150);
    show("result", await page.evaluate(() => ({ labels: [...document.querySelectorAll("#budgetChart text.lbl")].map((t) => t.textContent), firstBarTooltip: tip.innerText.replace(/\n/g, " | ") })));
    await ctx.close();
  }
} finally { await browser.close(); srv.kill(); }
