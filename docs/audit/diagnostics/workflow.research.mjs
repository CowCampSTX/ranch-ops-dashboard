#!/usr/bin/env node
// Manager-workflow and usability diagnostic for the ranch operations dashboard (research-workflow worker).
// Read-only: it loads the served page, measures it and writes a JSON report, a print PDF and screenshots.
// It never changes the page or its data files.
//
// Usage:
//   python3 -m http.server 8873 --directory <repo> &
//   node docs/audit/diagnostics/workflow.research.mjs http://127.0.0.1:8873/ <outDir>
//
// Questions it answers (each maps to a WCAG 2.2 SC or a workflow question in the research notes):
//   wcag-2.5.8   rendered size of every pointer target: filter chips (click) and chart hover targets (dots, bars)
//   wcag-1.4.11  contrast of the chip states (pressed fill, unpressed border) against the card surface
//   wcag-2.4.7   computed outline of a chip focused from the keyboard (:focus-visible)
//   wcag-2.1.1   every Tab stop on the page; whether any chart or chart detail can be reached without a pointer
//   wcag-1.1.1   accessible name and description of every chart SVG; whether a data table sits next to it
//   wcag-1.4.13  custom tooltip: does Escape dismiss it? can the pointer move onto it without it disappearing?
//   wcag-4.1.3   live regions on the page; how many live-region text changes a sweep across the gain chart causes;
//                whether choosing a filter chip produces any status message
//   storage      whether the page reads or writes localStorage / sessionStorage / IndexedDB (instrumented)
//   ack-ui       whether any acknowledge / note / assign control exists (buttons other than chips, inputs, textareas)
//   print        @media print rules present? text and background colours under print emulation, page count of
//                Chromium's default PDF (backgrounds off, the browser default), and the text colour's contrast on paper
//                NOTE: textOnWhitePaperContrast is computed from the CSS colour under print emulation. Chromium's
//                actual PDF output (printBackground off) recolours text, so check the PDF itself, e.g.
//                  pdftoppm -r 300 -f 1 -l 1 -png <outDir>/print-default.pdf p300
//                and sample the darkest glyph pixel per column of the exception table (done by hand in the audit:
//                What/Problem printed rgb(158,157,154), about 2.7:1 on white; First step rgb(112,111,106), about 5.0:1).
//   freshness    the "as of" text the manager sees, and whether it states a time zone or the data's age
//   scan         words and rows in the exception report and tiles (the 2-minute morning review budget)
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const [baseArg, outArg] = process.argv.slice(2);
if (!baseArg || !outArg) { console.error("usage: node workflow.research.mjs <baseURL> <outDir>"); process.exit(2); }
const base = baseArg.endsWith("/") ? baseArg : baseArg + "/";
const outDir = resolve(outArg);
mkdirSync(outDir, { recursive: true });

const pwPath = process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs";
const { chromium } = await import(pwPath);

// ------------------------------------------------------------------ colour helpers (WCAG 2.x relative luminance)
function parseColor(s) {
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) { const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r, g, b, a }; }
  const h = s.replace("#", "");
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 };
}
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ({ r, g, b }) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(parseColor(a)), lum(parseColor(b))].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2); };

const report = { base, ranAt: new Date().toISOString(), desktop: {}, phone: {}, print: {} };
const browser = await chromium.launch();

// Instrument storage before any page script runs.
const STORAGE_PROBE = () => {
  window.__storage = [];
  for (const kind of ["localStorage", "sessionStorage"]) {
    try {
      const s = window[kind];
      for (const fn of ["getItem", "setItem", "removeItem", "clear"]) {
        const orig = s[fn].bind(s);
        s[fn] = (...a) => { window.__storage.push(`${kind}.${fn}(${a.map(String).join(",").slice(0, 60)})`); return orig(...a); };
      }
    } catch (e) { window.__storage.push(`${kind} unavailable: ${e.name}`); }
  }
  try {
    const open = indexedDB.open.bind(indexedDB);
    indexedDB.open = (...a) => { window.__storage.push(`indexedDB.open(${a[0]})`); return open(...a); };
  } catch (e) { window.__storage.push(`indexedDB unavailable: ${e.name}`); }
};

async function loadPage(viewport, extra = {}) {
  const ctx = await browser.newContext({ viewport, ...extra });
  await ctx.addInitScript(STORAGE_PROBE);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector("#exceptions tr");
  return { ctx, page, errors };
}

// ================================================================== desktop
{
  const { ctx, page, errors } = await loadPage({ width: 1280, height: 900 });
  const R = report.desktop;
  R.pageErrors = errors;

  // ---------------- freshness + scan
  R.freshness = await page.evaluate(() => {
    const t = document.getElementById("asof").textContent;
    return { asofText: t, mentionsTimeZone: /\b(UTC|GMT|CST|CDT|MST|MDT|Central|Mountain|[+-]\d\d:?\d\d)\b/.test(t),
             mentionsAge: /\b(ago|old|stale|hours? since|days? since)\b/i.test(t) };
  });
  R.scan = await page.evaluate(() => {
    const words = (el) => (el.innerText.trim().match(/\S+/g) || []).length;
    const tbl = document.getElementById("exceptions");
    const rows = [...tbl.querySelectorAll("tr")].slice(1);
    return {
      exceptionRows: rows.length,
      bySeverity: rows.reduce((m, r) => { const s = r.cells[0].innerText.trim(); m[s] = (m[s] || 0) + 1; return m; }, {}),
      exceptionTableWords: words(tbl), tileWords: words(document.getElementById("tiles")),
      wholePageWords: words(document.body),
      rowColumns: [...tbl.querySelectorAll("th")].map((th) => th.innerText.trim()),
      rowsHaveStableId: rows.some((r) => r.id || r.dataset.id || r.dataset.key),
      rowsHaveOwnerOrDue: [...tbl.querySelectorAll("th")].some((th) => /owner|assigned|who|due|by when/i.test(th.innerText)),
    };
  });

  // ---------------- 2.5.8 target sizes
  R.targets = await page.evaluate(() => {
    const box = (el) => { const r = el.getBoundingClientRect(); return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
    const chips = [...document.querySelectorAll(".chip")].map((c) => ({ label: c.textContent, ...box(c) }));
    const dots = [...document.querySelectorAll("#gain circle")].map(box);
    const bars = [...document.querySelectorAll("#budgetChart rect")].map(box);
    const grazeHits = [...document.querySelectorAll('#grazing rect[fill="transparent"]')].map(box);
    const stat = (a, k) => a.length ? { n: a.length, min: Math.min(...a.map((x) => x[k])), max: Math.max(...a.map((x) => x[k])) } : null;
    return { chips, gainDots: { w: stat(dots, "w"), h: stat(dots, "h") }, budgetBars: { h: stat(bars, "h"), w: stat(bars, "w") },
             grazingHoverTargets: { w: stat(grazeHits, "w"), h: stat(grazeHits, "h") } };
  });

  // ---------------- 1.4.11 chip state contrast
  R.chipContrast = await page.evaluate(() => {
    const cs = (el) => getComputedStyle(el);
    const pressed = document.querySelector('.chip[aria-pressed="true"]');
    const unpressed = document.querySelector('.chip[aria-pressed="false"]');
    const root = getComputedStyle(document.documentElement);
    return { pressedBg: cs(pressed).backgroundColor, unpressedBg: cs(unpressed).backgroundColor,
             unpressedBorder: cs(unpressed).borderTopColor, cardSurface: root.getPropertyValue("--surface").trim(),
             cardSurface2: root.getPropertyValue("--surface-2").trim() };
  });
  const C = R.chipContrast;
  C.ratios = {
    pressedFill_vs_surface2: ratio(C.pressedBg, C.cardSurface2),
    unpressedBorder_vs_surface2: ratio(C.unpressedBorder, C.cardSurface2),
    pressedFill_vs_unpressedFill: ratio(C.pressedBg, C.unpressedBg),
  };

  // ---------------- 2.1.1 + 2.4.7 Tab stops and focus outline
  await page.mouse.click(5, 5);
  const stops = [];
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const st = getComputedStyle(a);
      return { tag: a.tagName.toLowerCase(), text: (a.textContent || a.getAttribute("aria-label") || "").trim().slice(0, 30),
               focusVisible: a.matches(":focus-visible"), outline: `${st.outlineStyle} ${st.outlineWidth} ${st.outlineColor}`,
               boxShadow: st.boxShadow };
    });
    if (!s) break;
    if (stops.length && stops[0].text === s.text && stops[0].tag === s.tag) break; // wrapped
    stops.push(s);
  }
  R.tabStops = stops;
  R.chartsFocusable = await page.evaluate(() => [...document.querySelectorAll("svg.chart, svg.chart *")]
    .filter((e) => e.tabIndex >= 0 || e.hasAttribute("tabindex")).length);
  await page.screenshot({ path: join(outDir, "desktop-chip-focus.png"), clip: await page.locator("#chips").boundingBox() });

  // ---------------- 1.1.1 chart text alternatives
  R.charts = await page.evaluate(() => [...document.querySelectorAll("svg.chart")].map((s) => {
    const card = s.closest("section");
    return { role: s.getAttribute("role"), ariaLabel: s.getAttribute("aria-label"),
             describedBy: s.getAttribute("aria-describedby"), hasTitleEl: !!s.querySelector(":scope > title"),
             inFigure: !!s.closest("figure"), dataTableInSameCard: !!(card && card.querySelector("table")),
             section: card ? card.querySelector("h2").textContent : null };
  }));

  // ---------------- 1.4.13 tooltip behaviour (hover a gain dot)
  const dot = page.locator("#gain circle").first();
  await dot.scrollIntoViewIfNeeded();
  const db = await dot.boundingBox();          // viewport coordinates after scrolling
  await page.mouse.move(db.x + db.width / 2, db.y + db.height / 2);
  const tipShown = await page.evaluate(() => getComputedStyle(document.getElementById("tip")).display);
  const tipText = await page.evaluate(() => document.getElementById("tip").innerText);
  await page.screenshot({ path: join(outDir, "desktop-tooltip.png"), clip: { x: Math.max(0, db.x - 120), y: Math.max(0, db.y - 60), width: 460, height: 200 } });
  await page.keyboard.press("Escape");
  const afterEsc = await page.evaluate(() => getComputedStyle(document.getElementById("tip")).display);
  // try to move onto the tooltip (it is drawn 14px right/down of the pointer)
  const tb = await page.evaluate(() => { const r = document.getElementById("tip").getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.mouse.move(tb.x + tb.w / 2, tb.y + tb.h / 2, { steps: 8 });
  const afterMoveOnto = await page.evaluate(() => ({ display: getComputedStyle(document.getElementById("tip")).display, text: document.getElementById("tip").innerText }));
  R.tooltip = { shownOnHover: tipShown, text: tipText, displayAfterEscape: afterEsc, pointerEventsCss: await page.evaluate(() => getComputedStyle(document.getElementById("tip")).pointerEvents),
                afterMovingPointerOntoTooltip: afterMoveOnto, sameContentAfterMove: afterMoveOnto.text === tipText };
  await page.mouse.move(2, 2);

  // ---------------- 4.1.3 live regions
  R.liveRegions = await page.evaluate(() => [...document.querySelectorAll('[role="status"],[role="alert"],[role="log"],[aria-live]')]
    .map((e) => ({ id: e.id, role: e.getAttribute("role"), ariaLive: e.getAttribute("aria-live") })));
  await page.evaluate(() => {
    window.__tipChanges = 0;
    new MutationObserver(() => window.__tipChanges++).observe(document.getElementById("tip"), { childList: true, characterData: true, subtree: true });
  });
  await page.locator("#gain svg").scrollIntoViewIfNeeded();
  const gainBox = await page.locator("#gain svg").boundingBox();
  for (let i = 0; i <= 40; i++) await page.mouse.move(gainBox.x + (gainBox.width * i) / 40, gainBox.y + gainBox.height * 0.2);
  await page.mouse.move(2, 2);
  R.tipMutationsDuringGainSweep = await page.evaluate(() => window.__tipChanges);
  // choose a filter chip and look for a status message
  const before = await page.evaluate(() => [...document.querySelectorAll('[role="status"],[aria-live]')].map((e) => e.innerText).join("|"));
  await page.click('.chip[data-a="Water"]');
  const after = await page.evaluate(() => [...document.querySelectorAll('[role="status"],[aria-live]')].map((e) => e.innerText).join("|"));
  R.filterStatusMessage = { liveTextBefore: before, liveTextAfter: after, changed: before !== after,
                            focusAfterClick: await page.evaluate(() => document.activeElement && document.activeElement.outerHTML.slice(0, 80)) };

  // ---------------- storage + ack UI
  R.storageCalls = await page.evaluate(() => window.__storage);
  R.ackControls = await page.evaluate(() => ({
    buttonsOtherThanChips: [...document.querySelectorAll("button:not(.chip)")].length,
    inputs: document.querySelectorAll("input, textarea, select").length,
    textMentionsAcknowledge: /acknowledg|reviewed|assign|note/i.test(document.getElementById("exceptions").innerText),
  }));
  await ctx.close();
}

// ================================================================== phone
{
  const { ctx, page, errors } = await loadPage({ width: 390, height: 844 }, { isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const R = report.phone;
  R.pageErrors = errors;
  R.exceptionTable = await page.evaluate(() => {
    const t = document.getElementById("exceptions"), sc = t.parentElement;
    return { tableWidth: Math.round(t.scrollWidth), containerWidth: Math.round(sc.clientWidth), needsSideScroll: t.scrollWidth > sc.clientWidth + 1,
             firstStepColumnVisibleWithoutScroll: (() => { const th = t.querySelectorAll("th")[4]; const r = th.getBoundingClientRect(); return r.right <= sc.getBoundingClientRect().right + 1; })() };
  });
  R.chips = await page.evaluate(() => [...document.querySelectorAll(".chip")].map((c) => { const r = c.getBoundingClientRect(); return { label: c.textContent, w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; }));
  // Tap a gain dot: does the tooltip appear on touch?
  const dot = page.locator("#gain circle").first();
  await dot.scrollIntoViewIfNeeded();
  const b = await dot.boundingBox();
  await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
  R.tapGainDot = { tipDisplay: await page.evaluate(() => getComputedStyle(document.getElementById("tip")).display), dotRenderedDiameter: +b.width.toFixed(1) };
  await page.locator("section.card").first().screenshot({ path: join(outDir, "phone-exceptions.png") });
  await ctx.close();
}

// ================================================================== print
{
  const { ctx, page } = await loadPage({ width: 1280, height: 900 });
  const R = report.print;
  R.printRules = await page.evaluate(() => {
    let n = 0, sheets = 0;
    for (const s of document.styleSheets) { sheets++; try { for (const r of s.cssRules) if (r.media && /print/.test(r.media.mediaText)) n++; } catch {} }
    return { styleSheets: sheets, mediaPrintRules: n, linkMediaPrint: document.querySelectorAll('link[media*="print"]').length };
  });
  await page.emulateMedia({ media: "print" });
  R.underPrintEmulation = await page.evaluate(() => {
    const b = getComputedStyle(document.body), td = getComputedStyle(document.querySelector("#exceptions td"));
    return { bodyColor: b.color, bodyBackground: b.backgroundColor, tableTextColor: td.color, colorScheme: getComputedStyle(document.documentElement).colorScheme };
  });
  R.textOnWhitePaperContrast = ratio(R.underPrintEmulation.bodyColor, "#ffffff");
  const pdfDefault = join(outDir, "print-default.pdf");
  await page.pdf({ path: pdfDefault, format: "Letter" });          // printBackground: false = browser default
  const pdfBg = join(outDir, "print-with-backgrounds.pdf");
  await page.pdf({ path: pdfBg, format: "Letter", printBackground: true });
  R.pdfFiles = { pdfDefault, pdfBg };
  await ctx.close();
}

await browser.close();
writeFileSync(join(outDir, "workflow-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
