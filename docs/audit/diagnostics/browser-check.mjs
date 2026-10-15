#!/usr/bin/env node
// Browser diagnostic for the ranch operations dashboard. Read-only: it loads the page, interacts with it and
// writes a JSON report plus screenshots. It never changes the page or its data files.
//
// Usage:
//   python3 -m http.server 8801 --directory <repo> &          # serve the repo (any static server works)
//   node docs/audit/diagnostics/browser-check.mjs http://127.0.0.1:8801/ <outDir> [keyScreenshotDir]
//
//   outDir            receives report.json and every screenshot
//   keyScreenshotDir  optional; when given, the four key screenshots (desktop full page, phone full page,
//                     keyboard focus state, tooltip state) go here instead of outDir
//
// Playwright is resolved from $PLAYWRIGHT_PATH, then the bare "playwright" package, then
// /opt/node22/lib/node_modules/playwright/index.mjs. chromium.launch() needs no arguments.
//
// What it checks, per viewport (desktop 1280x900; phone 390x844 with isMobile + hasTouch):
//   - console errors, page errors, failed requests (requestfailed) and responses with status >= 400
//   - tile values, table row counts, chart inventory and the rendered size of 12px chart text
//   - every filter chip: aria-pressed, visible rows, and whether the count in the chip label matches
//   - Tab order: what receives focus, :focus-visible, outline/box-shadow focused vs unfocused, a pixel diff of the
//     focus indicator and its best contrast ratio against the unfocused pixels
//   - keyboard activation of a chip: where focus goes after Enter
//   - chart details: reachable by keyboard focus? by mouse hover (desktop)? by a touch tap (phone)?
//   - horizontal overflow of the page and of each .scroll container; overlapping chart labels
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const [baseURL, outDirArg, keyDirArg] = process.argv.slice(2);
if (!baseURL || !outDirArg) {
  console.error("usage: node browser-check.mjs <baseURL> <outDir> [keyScreenshotDir]");
  process.exit(2);
}
const outDir = resolve(outDirArg);
const keyDir = resolve(keyDirArg || outDirArg);
mkdirSync(outDir, { recursive: true });
mkdirSync(keyDir, { recursive: true });

async function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_PATH, "playwright", "/opt/node22/lib/node_modules/playwright/index.mjs"].filter(Boolean);
  for (const t of tries) {
    try { return await import(t); } catch { /* try the next one */ }
  }
  throw new Error("Playwright not found; set PLAYWRIGHT_PATH to its index.mjs");
}
const { chromium } = await loadPlaywright();

const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  { name: "phone", viewport: { width: 390, height: 844 }, deviceScaleFactor: Number(process.env.PHONE_DSF || 2), isMobile: true, hasTouch: true },
];

const report = { baseURL, ranAt: new Date().toISOString(), playwrightBrowser: null, viewports: {}, screenshots: [] };
const shot = (dir, name) => { const p = join(dir, name); report.screenshots.push(p); return p; };

function attachLog(page) {
  const log = { consoleErrors: [], consoleWarnings: [], pageErrors: [], requestFailed: [], badResponses: [], requests: 0 };
  page.on("console", (m) => {
    if (m.type() === "error") log.consoleErrors.push(m.text());
    if (m.type() === "warning") log.consoleWarnings.push(m.text());
  });
  page.on("pageerror", (e) => log.pageErrors.push(String(e && e.stack ? e.stack.split("\n").slice(0, 3).join(" | ") : e)));
  page.on("requestfailed", (r) => log.requestFailed.push(`${r.url()} :: ${r.failure()?.errorText}`));
  page.on("request", () => log.requests++);
  page.on("response", (r) => { if (r.status() >= 400) log.badResponses.push(`${r.status()} ${r.url()}`); });
  return log;
}

async function waitReady(page, timeout = 10000) {
  // app.js renders the rules table last; once it has rows, every section has been drawn.
  try {
    await page.waitForFunction(() => document.querySelectorAll("#rules tr").length > 1, null, { timeout });
    return true;
  } catch { return false; }
}

// ------------------------------------------------------------------ in-page helpers (serialised into the page)
const IN_PAGE = `
window.__audit = {
  desc(el) {
    if (!el) return null;
    if (el === document.body) return "body";
    let s = el.tagName.toLowerCase();
    if (el.id) s += "#" + el.id;
    const cls = el.getAttribute && el.getAttribute("class");
    if (cls) s += "." + cls.trim().split(/\\s+/).join(".");
    if (el.dataset && el.dataset.a) s += "[data-a=" + el.dataset.a + "]";
    const t = (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 40);
    return t ? s + ' "' + t + '"' : s;
  },
  key(el) {
    window.__auditKeys = window.__auditKeys || new Map();
    if (!window.__auditKeys.has(el)) window.__auditKeys.set(el, window.__auditKeys.size + 1);
    return window.__auditKeys.get(el);
  },
  rows(sel) { return [...document.querySelectorAll(sel + " tr")].filter((tr) => tr.querySelector("td")); },
  tip() {
    const t = document.getElementById("tip");
    const cs = getComputedStyle(t), r = t.getBoundingClientRect();
    return { visible: cs.display !== "none" && r.width > 0, text: t.innerText.trim(), rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom },
      insideViewport: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight };
  },
};`;

async function inventory(page) {
  return page.evaluate(() => {
    const A = window.__audit;
    const charts = [...document.querySelectorAll("svg.chart")].map((s) => {
      const vb = s.viewBox.baseVal, r = s.getBoundingClientRect();
      const scale = r.width / vb.width;
      const fs = s.querySelector("text") ? parseFloat(getComputedStyle(s.querySelector("text")).fontSize) : null;
      // label overlaps inside this chart (CSS px, intersection area > 2 px^2)
      const texts = [...s.querySelectorAll("text")].map((t) => ({ t: t.textContent, r: t.getBoundingClientRect() }));
      const overlaps = [];
      for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i].r, b = texts[j].r;
        const w = Math.min(a.right, b.right) - Math.max(a.left, b.left), h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (w > 0 && h > 0 && w * h > 2) overlaps.push(`"${texts[i].t}" x "${texts[j].t}" (${(w * h).toFixed(0)} px2)`);
      }
      const card = s.closest(".card")?.getBoundingClientRect();
      const outsideCard = card ? texts.filter(({ r }) => r.left < card.left - 0.5 || r.right > card.right + 0.5).map(({ t }) => t) : [];
      return {
        container: s.parentElement?.id || s.parentElement?.className, ariaLabel: s.getAttribute("aria-label"),
        viewBoxWidth: vb.width, renderedWidth: +r.width.toFixed(1), scale: +scale.toFixed(3),
        cssFontPx: fs, effectiveFontPx: fs ? +(fs * scale).toFixed(1) : null,
        marks: { circle: s.querySelectorAll("circle").length, rect: s.querySelectorAll("rect").length, path: s.querySelectorAll("path").length, text: texts.length },
        focusableDescendants: [...s.querySelectorAll("*")].filter((e) => e.tabIndex >= 0).length,
        svgFocusable: s.tabIndex >= 0, labelOverlaps: overlaps.slice(0, 8), labelOverlapCount: overlaps.length, textOutsideCard: outsideCard.slice(0, 8),
      };
    });
    const minis = [...document.querySelectorAll(".mini h4")].map((h) => ({ text: h.innerText.replace(/\s+/g, " "), height: +h.getBoundingClientRect().height.toFixed(1) }));
    const cards = [...document.querySelectorAll(".card")].map((c) => c.getBoundingClientRect());
    let cardOverlaps = 0;
    for (let i = 0; i < cards.length; i++) for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i], b = cards[j];
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) cardOverlaps++;
    }
    return {
      title: document.title,
      asof: document.getElementById("asof").textContent,
      tiles: [...document.querySelectorAll("#tiles .tile")].map((t) => ({ k: t.querySelector(".k")?.textContent, v: t.querySelector(".v")?.textContent, d: t.querySelector(".d")?.textContent,
        valueClipped: t.querySelector(".v").scrollWidth > t.querySelector(".v").clientWidth })),
      chips: [...document.querySelectorAll("#chips .chip")].map((b) => ({ text: b.textContent, pressed: b.getAttribute("aria-pressed") })),
      exceptionRows: A.rows("#exceptions").length,
      exceptionTable: A.rows("#exceptions").map((tr) => [...tr.cells].map((c) => c.innerText.trim())),
      budgetRows: A.rows("#budgetTable").length,
      rulesRows: A.rows("#rules").length,
      waterMinis: minis.length, miniHeaderHeights: minis,
      charts, cardOverlaps,
      fictionalLabel: /fictional/i.test(document.body.innerText),
    };
  });
}

async function overflow(page) {
  return page.evaluate(() => {
    const de = document.documentElement, A = window.__audit;
    const offenders = [...document.querySelectorAll("body *")].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width && r.right > de.clientWidth + 0.5 && getComputedStyle(e).position !== "fixed" && !e.closest(".scroll");
    }).slice(0, 10).map((e) => A.desc(e).slice(0, 80));
    const scrollers = [...document.querySelectorAll(".scroll")].map((s) => {
      const box = s.getBoundingClientRect();
      const heads = [...s.querySelectorAll("th")].map((th) => ({ th: th.textContent, r: th.getBoundingClientRect() }));
      return { table: s.querySelector("table")?.id, clientWidth: s.clientWidth, scrollWidth: s.scrollWidth, scrollsSideways: s.scrollWidth > s.clientWidth + 1,
        columnsCutOff: heads.filter((h) => h.r.right > box.right + 1).map((h) => h.th), focusable: s.tabIndex >= 0 };
    });
    return { docScrollWidth: de.scrollWidth, docClientWidth: de.clientWidth, pageOverflowsSideways: de.scrollWidth > de.clientWidth, offenders, scrollers };
  });
}

// Pixel diff of two PNG buffers, done in a helper page with a canvas (no image libraries needed).
async function diffPngs(helper, a, b) {
  return helper.evaluate(async ([a, b]) => {
    const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
    const px = (img) => { const c = new OffscreenCanvas(w, h), x = c.getContext("2d"); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const A = px(ia), B = px(ib);
    const lum = (r, g, b) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    let changed = 0, maxDelta = 0;
    const ratios = [];
    for (let p = 0; p < A.length; p += 4) {
      const d = Math.max(Math.abs(A[p] - B[p]), Math.abs(A[p + 1] - B[p + 1]), Math.abs(A[p + 2] - B[p + 2]));
      maxDelta = Math.max(maxDelta, d);
      if (d > 24) {
        changed++;
        const la = lum(A[p], A[p + 1], A[p + 2]), lb = lum(B[p], B[p + 1], B[p + 2]);
        ratios.push((Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05));
      }
    }
    ratios.sort((x, y) => x - y);
    return { width: w, height: h, changedPixels: changed, maxChannelDelta: maxDelta,
      bestContrast: ratios.length ? +ratios[ratios.length - 1].toFixed(2) : 1, medianContrast: ratios.length ? +ratios[ratios.length >> 1].toFixed(2) : 1 };
  }, ["data:image/png;base64," + a.toString("base64"), "data:image/png;base64," + b.toString("base64")]);
}

async function chipCheck(page, vp) {
  const n = await page.locator("#chips .chip").count();
  const out = [];
  for (let i = 0; i < n; i++) {
    const chip = page.locator("#chips .chip").nth(i);   // chips are re-rendered on every click, so re-query each time
    const label = await chip.textContent();
    if (vp.hasTouch) await chip.tap(); else await chip.click();
    const r = await page.evaluate(() => {
      const rows = window.__audit.rows("#exceptions");
      const data = rows.filter((tr) => !tr.querySelector("td[colspan]"));
      const pressed = [...document.querySelectorAll("#chips .chip")].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent);
      const areas = [...new Set(data.map((tr) => tr.cells[1].textContent))];
      return { pressed, visibleRows: data.length, emptyMessage: rows.find((tr) => tr.querySelector("td[colspan]"))?.innerText || null, areasShown: areas,
        activeElement: window.__audit.desc(document.activeElement) };
    });
    const m = /\((\d+)\)/.exec(label);
    out.push({ chip: label, ...r, labelCount: m ? +m[1] : null, countMatches: m ? +m[1] === r.visibleRows : null });
  }
  await page.locator("#chips .chip").first().click();
  return out;
}

async function keyboardWalk(page, helper, vp, maxSteps = 40) {
  await page.mouse.move(1, 1);
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  const stops = [];
  const seen = new Set();
  for (let i = 0; i < maxSteps; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement, A = window.__audit;
      if (!el || el === document.body || el === document.documentElement) return null;
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      return { key: A.key(el), el: A.desc(el), focusVisible: el.matches(":focus-visible"), inChart: !!el.closest("svg.chart"),
        style: { outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor, outlineOffset: cs.outlineOffset, boxShadow: cs.boxShadow },
        rect: { x: r.left, y: r.top, w: r.width, h: r.height }, scroll: { x: scrollX, y: scrollY }, tip: A.tip() };
    });
    if (!info) { stops.push({ step: i + 1, el: "body (focus left the page content)" }); break; }
    if (seen.has(info.key)) { stops.push({ step: i + 1, el: info.el, note: "cycled back to an element already visited" }); break; }
    seen.add(info.key);
    const pad = 8, W = vp.viewport.width, H = vp.viewport.height;
    const clip = { x: Math.max(0, info.rect.x - pad), y: Math.max(0, info.rect.y - pad) };
    clip.width = Math.max(1, Math.min(W, info.rect.x + info.rect.w + pad) - clip.x);
    clip.height = Math.max(1, Math.min(H, info.rect.y + info.rect.h + pad) - clip.y);
    info.clip = clip;
    info.focusedPng = await page.screenshot({ clip });
    stops.push({ step: i + 1, ...info });
  }
  // second pass: same scroll position and clip, nothing focused
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  for (const s of stops) {
    if (!s.focusedPng) continue;
    const st = await page.evaluate(([k, sc]) => {
      window.scrollTo(sc.x, sc.y);
      const el = [...window.__auditKeys].find(([, v]) => v === k)[0];
      const cs = getComputedStyle(el);
      return { outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor, outlineOffset: cs.outlineOffset, boxShadow: cs.boxShadow };
    }, [s.key, s.scroll]);
    const unfocusedPng = await page.screenshot({ clip: s.clip });
    s.unfocusedStyle = st;
    s.styleDiffers = JSON.stringify(st) !== JSON.stringify(s.style);
    s.pixels = await diffPngs(helper, s.focusedPng, unfocusedPng);
    // Heuristic in the spirit of WCAG 2.4.13: at least 20 changed pixels, and at least one changed pixel with 3:1
    // contrast against the same pixel unfocused. A white ring drawn over a pressed (green) chip's own edge can score
    // ~2:1 here while still being plainly visible against the black page, so confirm false results by eye.
    s.visibleIndicator = s.pixels.changedPixels >= 20 && s.pixels.bestContrast >= 3;
    delete s.focusedPng;
  }
  return stops;
}

async function chipKeyboardActivation(page, vp) {
  // Tab to the "Water" chip, press Enter, then see where focus is and where the next Tab goes.
  await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    const a = await page.evaluate(() => document.activeElement?.dataset?.a || null);
    if (a === "Water") break;
  }
  const before = await page.evaluate(() => window.__audit.desc(document.activeElement));
  await page.keyboard.press("Enter");
  const afterEnter = await page.evaluate(() => ({ active: window.__audit.desc(document.activeElement),
    pressed: [...document.querySelectorAll("#chips .chip")].filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.textContent) }));
  await page.keyboard.press("Tab");
  const afterNextTab = await page.evaluate(() => window.__audit.desc(document.activeElement));
  await page.locator("#chips .chip").first().click();
  return { focusedBeforeEnter: before, afterEnter, afterNextTab };
}

async function centerOf(page, selectorFn) {
  return page.evaluate((src) => {
    const el = new Function("return (" + src + ")")()();
    if (!el) return null;
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: +r.width.toFixed(1), h: +r.height.toFixed(1), right: r.right, left: r.left };
  }, selectorFn.toString());
}

// One mark per chart. The gain target is the slowest yearling (leftmost dot in the second strip).
const TARGETS = {
  water: () => document.querySelectorAll("#water svg")[3]?.querySelector('rect[fill="transparent"]'),
  waterLastColumn: () => { const s = document.querySelectorAll("#water svg"); return s[s.length - 1]?.querySelector('rect[fill="transparent"]'); },
  grazing: () => { const r = document.querySelectorAll('#grazing rect[fill="transparent"]'); return r[r.length - 1]; },
  gain: () => [...document.querySelectorAll("#gain circle")].sort((a, b) => a.cx.baseVal.value - b.cx.baseVal.value)[0],
  budget: () => document.querySelector('#budgetChart rect[fill="var(--div-neg)"]'),
};

async function pointerTooltips(page) {
  const out = {};
  for (const [name, fn] of Object.entries(TARGETS)) {
    await page.mouse.move(1, 1);
    const c = await centerOf(page, fn);
    if (!c) { out[name] = { error: "target not found" }; continue; }
    // water hit areas: aim at the right end (latest reading) to also test edge clamping
    const x = name.startsWith("water") ? c.right - 2 : c.x;
    await page.mouse.move(x, c.y, { steps: 3 });
    out[name] = { target: c, tip: await page.evaluate(() => window.__audit.tip()) };
  }
  return out;
}

// Tooltip placement near the viewport edges (desktop): the rightmost water chart's latest reading, and a budget
// bar scrolled to 30 px above the bottom of the viewport. A tooltip should stay fully inside the viewport.
async function edgeTooltips(page) {
  const out = {};
  await page.mouse.move(1, 1);
  const c = await centerOf(page, TARGETS.water);
  await page.mouse.move(c.right - 2, c.y, { steps: 3 });
  out.rightEdgeWater = await page.evaluate(() => ({ ...window.__audit.tip(), innerWidth }));
  await page.mouse.move(1, 1);
  await page.evaluate(() => {
    const el = document.querySelector('#budgetChart rect[fill="var(--div-neg)"]'), r = el.getBoundingClientRect();
    window.scrollBy(0, r.top - (innerHeight - 30));
  });
  const b = await page.evaluate(() => { const r = document.querySelector('#budgetChart rect[fill="var(--div-neg)"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.move(b.x, b.y, { steps: 3 });
  out.bottomEdgeBudget = await page.evaluate(() => ({ ...window.__audit.tip(), innerHeight }));
  await page.mouse.move(1, 1);
  return out;
}

async function touchTooltips(page) {
  const out = {};
  for (const [name, fn] of Object.entries(TARGETS)) {
    const c = await centerOf(page, fn);
    if (!c) { out[name] = { error: "target not found" }; continue; }
    await page.touchscreen.tap(c.x, c.y);
    await page.waitForTimeout(150);
    out[name] = { renderedTargetCssPx: { w: c.w, h: c.h }, tipAfterTap: await page.evaluate(() => window.__audit.tip()) };
  }
  return out;
}

async function keyboardTooltips(stops) {
  return { tabStopsInsideCharts: stops.filter((s) => s.inChart).length, tooltipShownOnAnyFocus: stops.some((s) => s.tip && s.tip.visible) };
}

// ------------------------------------------------------------------ run
const browser = await chromium.launch();
report.playwrightBrowser = `chromium ${browser.version()}`;
const helperCtx = await browser.newContext();
const helper = await helperCtx.newPage();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: vp.viewport, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
  await ctx.addInitScript(IN_PAGE);
  const page = await ctx.newPage();
  const log = attachLog(page);
  const r = { viewport: vp, log };
  report.viewports[vp.name] = r;
  await page.goto(baseURL, { waitUntil: "networkidle" });
  r.ready = await waitReady(page);
  if (!r.ready) { r.note = "page never finished rendering (rules table empty)"; await page.screenshot({ path: shot(outDir, `${vp.name}-not-ready.png`), fullPage: true }); await ctx.close(); continue; }
  r.inventory = await inventory(page);
  r.overflow = await overflow(page);
  await page.screenshot({ path: shot(keyDir, `${vp.name}-full.png`), fullPage: true });
  r.chips = await chipCheck(page, vp);

  r.keyboard = { stops: await keyboardWalk(page, helper, vp) };
  r.keyboard.tooltips = await keyboardTooltips(r.keyboard.stops);
  r.keyboard.chipActivation = await chipKeyboardActivation(page, vp);

  if (vp.name === "desktop") {
    // focus-state screenshot: Tab to the second chip and capture the chip row
    await page.evaluate(() => { document.activeElement && document.activeElement.blur(); window.scrollTo(0, 0); });
    await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
    const box = await page.locator("#chips").boundingBox();
    await page.screenshot({ path: shot(keyDir, "desktop-focus-chip.png"), clip: { x: Math.max(0, box.x - 12), y: Math.max(0, box.y - 12), width: Math.min(700, box.width + 24), height: box.height + 24 } });
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    r.pointerTooltips = await pointerTooltips(page);
    r.edgeTooltips = await edgeTooltips(page);
    // tooltip-state screenshot: hover the slowest yearling's dot
    const c = await centerOf(page, TARGETS.gain);
    await page.mouse.move(c.x, c.y, { steps: 3 });
    await page.screenshot({ path: shot(keyDir, "desktop-tooltip-gain.png") });
  } else {
    r.touchTooltips = await touchTooltips(page);
    await page.screenshot({ path: shot(outDir, "phone-after-tap-gain.png") });
  }
  await ctx.close();
}
await browser.close();

writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));

// ------------------------------------------------------------------ console summary
for (const [name, r] of Object.entries(report.viewports)) {
  const L = r.log;
  console.log(`\n== ${name} ${r.viewport.viewport.width}x${r.viewport.viewport.height} ready=${r.ready}`);
  console.log(`errors: console=${L.consoleErrors.length} page=${L.pageErrors.length} requestfailed=${L.requestFailed.length} status>=400=${L.badResponses.length}`, [...L.consoleErrors, ...L.pageErrors, ...L.requestFailed, ...L.badResponses].slice(0, 5));
  if (!r.ready) continue;
  const I = r.inventory;
  console.log(`rows: exceptions=${I.exceptionRows} budget=${I.budgetRows} rules=${I.rulesRows} waterMinis=${I.waterMinis} charts=${I.charts.length} fictionalLabel=${I.fictionalLabel}`);
  console.log("tiles:", I.tiles.map((t) => `${t.k}=${t.v}`).join(" | "));
  console.log("chart text (effective px):", I.charts.map((c) => `${c.container}:${c.effectiveFontPx}`).join(" "));
  console.log("label overlaps:", I.charts.filter((c) => c.labelOverlapCount).map((c) => `${c.container}:${c.labelOverlapCount}`).join(" ") || "none");
  console.log("chips:", r.chips.map((c) => `${c.chip}->${c.visibleRows}${c.countMatches ? "" : " MISMATCH"}`).join(" | "));
  console.log(`page overflow: ${r.overflow.docScrollWidth}/${r.overflow.docClientWidth}`, r.overflow.scrollers.map((s) => `${s.table}: scrolls=${s.scrollsSideways} cut=[${s.columnsCutOff}]`).join("; "));
  console.log("tab stops:", r.keyboard.stops.map((s) => `${s.step}:${(s.el || "").slice(0, 40)}${s.pixels ? ` [diff=${s.pixels.changedPixels}px contrast=${s.pixels.bestContrast} visible=${s.visibleIndicator}]` : ""}`).join("\n  "));
  console.log("keyboard tooltips:", JSON.stringify(r.keyboard.tooltips), "chip Enter:", JSON.stringify(r.keyboard.chipActivation));
  if (r.pointerTooltips) for (const [k, v] of Object.entries(r.pointerTooltips)) console.log(`hover ${k}: visible=${v.tip?.visible} inside=${v.tip?.insideViewport} "${v.tip?.text.replace(/\n/g, " / ")}"`);
  if (r.edgeTooltips) for (const [k, v] of Object.entries(r.edgeTooltips)) console.log(`edge ${k}: insideViewport=${v.insideViewport} rect=${JSON.stringify(v.rect)} "${v.text.replace(/\n/g, " / ")}"`);
  if (r.touchTooltips) for (const [k, v] of Object.entries(r.touchTooltips)) console.log(`tap ${k}: target=${v.renderedTargetCssPx?.w}x${v.renderedTargetCssPx?.h}px tipVisible=${v.tipAfterTap?.visible} "${v.tipAfterTap?.text}"`);
}
console.log("\nscreenshots:\n  " + report.screenshots.join("\n  "));
console.log("report: " + join(outDir, "report.json"));
