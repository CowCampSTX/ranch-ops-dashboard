#!/usr/bin/env node
// Workflow / usability diagnostic for the ranch operations dashboard (research-workflow audit). Read-only: it loads
// the page, interacts with it and prints a JSON report. It never changes the page or its data files.
//
// Usage:
//   python3 -m http.server 8862 --directory <repo> &
//   node docs/audit/diagnostics/workflow.research.mjs http://127.0.0.1:8862/ <outDir>
//
// What it checks (each maps to a WCAG 2.2 success criterion or a morning-review workflow question):
//   freshness     data as_of vs. the clock at run time, and whether the page says anything about staleness
//   reportShape   exception-table columns and rows, words to read, whether any row carries an age / owner / status
//   pointerOnly   elements given pointer listeners by app.js, and how many of them can take keyboard focus (2.1.1)
//   tabStops      every Tab stop and its computed outline (2.4.7)
//   tooltip       hover a gain dot, press Escape, then move onto the tooltip: still shown? (1.4.13)
//   targets       filter-chip boxes vs. 24x24 CSS px and the 24px-circle spacing test (2.5.8)
//   liveRegions   role=status / aria-live / role=alert nodes, and whether a chip click changes any of them (4.1.3)
//   chartAlts     svg[role=img] labels, <title>/<desc>/aria-describedby, and whether a data table sits beside it (1.1.1)
//   contrast      chart marks vs. the card surface (1.4.11), computed from the CSS custom properties
//   storage       any localStorage / sessionStorage writes by the page
//   print         print-media colours, then a PDF with browser-default settings (no backgrounds), rasterised
//                 with pdftoppm to measure how dark the printed text actually is
// Playwright is resolved from $PLAYWRIGHT_PATH, then "playwright", then /opt/node22/lib/node_modules/playwright/index.mjs.
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const [baseURL, outDirArg] = process.argv.slice(2);
if (!baseURL || !outDirArg) { console.error("usage: node workflow.research.mjs <baseURL> <outDir>"); process.exit(2); }
const outDir = resolve(outDirArg);
mkdirSync(outDir, { recursive: true });

async function loadPlaywright() {
  for (const t of [process.env.PLAYWRIGHT_PATH, "playwright", "/opt/node22/lib/node_modules/playwright/index.mjs"].filter(Boolean)) {
    try { return await import(t); } catch { /* next */ }
  }
  throw new Error("Playwright not found");
}
const { chromium } = await loadPlaywright();

// Record which elements app.js gives pointer/mouse/key listeners, and any Web Storage writes, before app.js runs.
const INIT = `
  window.__listen = [];
  const orig = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opts) {
    if (this instanceof Element) window.__listen.push({ el: this, type });
    return orig.call(this, type, fn, opts);
  };
  window.__storageWrites = [];
  const set = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { window.__storageWrites.push(k); return set.call(this, k, v); };
`;

// WCAG relative luminance / contrast (https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio)
const hex = (h) => { h = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
const mix = (fg, bg, a) => fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));

const report = { baseURL, ranAt: new Date().toISOString() };
const browser = await chromium.launch();
try {
  // ------------------------------------------------------------------ desktop
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.addInitScript(INIT);
  await page.goto(baseURL, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelectorAll("#rules tr").length > 1, null, { timeout: 10000 });
  report.pageErrors = errors;

  report.freshness = await page.evaluate(async () => {
    const asOfRaw = (await (await fetch("data/meta.csv")).text()).trim().split(/\r?\n/)[1];
    const asOf = new Date(asOfRaw);
    const headerText = document.querySelector("header").innerText;
    return {
      asOfRaw, asOfHasTimezone: /Z|[+-]\d\d:?\d\d$/.test(asOfRaw),
      browserTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      ageHoursAtRun: Math.round((Date.now() - asOf) / 36e5),
      headerAsOfLine: document.getElementById("asof").textContent,
      pageMentionsStaleOrAge: /stale|out of date|hours ago|days ago|old data|last updated/i.test(document.body.innerText),
      headerText,
    };
  });

  report.reportShape = await page.evaluate(() => {
    const t = document.getElementById("exceptions");
    const headers = [...t.querySelectorAll("th")].map((th) => th.textContent);
    const rows = [...t.querySelectorAll("tr")].slice(1).map((tr) => [...tr.cells].map((c) => c.innerText.trim()));
    const words = rows.flat().join(" ").split(/\s+/).filter(Boolean).length;
    const has = (re) => headers.some((h) => re.test(h));
    return {
      headers, rowCount: rows.length, wordsInRows: words,
      hasAgeOrFirstSeenColumn: has(/\bage\b|first seen|opened|since/i), hasOwnerColumn: has(/owner|who|assigned/i),
      hasStatusOrAckColumn: has(/status|ack|done|note/i),
      bySeverity: rows.reduce((m, r) => ((m[r[0]] = (m[r[0]] || 0) + 1), m), {}),
      byArea: rows.reduce((m, r) => ((m[r[1]] = (m[r[1]] || 0) + 1), m), {}),
      rows,
    };
  });

  report.pointerOnly = await page.evaluate(() => {
    const ptr = window.__listen.filter((l) => /^pointer|^mouse/.test(l.type));
    const els = [...new Set(ptr.map((l) => l.el))].filter((el) => el.isConnected);
    const focusable = els.filter((el) => el.tabIndex >= 0 || el.hasAttribute("tabindex"));
    const keyListeners = window.__listen.filter((l) => /^key|^focus|^blur/.test(l.type)).length;
    const byTag = els.reduce((m, el) => ((m[el.tagName] = (m[el.tagName] || 0) + 1), m), {});
    return { elementsWithPointerListeners: els.length, byTag, focusableAmongThem: focusable.length, keyOrFocusListenersOnElements: keyListeners };
  });

  // Tab through the page (desktop). Stop when focus wraps or after 60 presses.
  await page.mouse.move(1, 1);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const stops = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      return { tag: el.tagName, text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40),
        focusVisible: el.matches(":focus-visible"), outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}` };
    });
    if (!s || (stops.length && s.text === stops[0].text && s.tag === stops[0].tag)) break;
    stops.push(s);
  }
  report.tabStops = stops;

  // Tooltip: hover the first gain dot, press Escape, then move the pointer onto the tooltip box.
  const dot = page.locator("#gain svg circle").first();
  await dot.scrollIntoViewIfNeeded();
  const box = await dot.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + box.width / 2 + 0.5, box.y + box.height / 2);
  const tipState = () => page.evaluate(() => { const t = document.getElementById("tip"); const r = t.getBoundingClientRect();
    return { shown: getComputedStyle(t).display !== "none", text: t.innerText.replace(/\n/g, " | "), role: t.getAttribute("role"),
      pointerEvents: getComputedStyle(t).pointerEvents, box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }; });
  const afterHover = await tipState();
  await page.keyboard.press("Escape");
  const afterEscape = await tipState();
  await page.mouse.move(afterHover.box.x + afterHover.box.w / 2, afterHover.box.y + afterHover.box.h / 2, { steps: 8 });
  const afterMoveOntoTip = await tipState();
  report.tooltip = { afterHover, shownAfterEscape: afterEscape.shown, shownAfterMovingPointerOntoTooltip: afterMoveOntoTip.shown };

  // Filter chips: size and spacing (2.5.8), and whether a filter click produces a status message (4.1.3).
  const chipGeom = async (p) => p.evaluate(() => {
    const rs = [...document.querySelectorAll(".chip")].map((c) => { const r = c.getBoundingClientRect();
      return { label: c.textContent, w: +r.width.toFixed(1), h: +r.height.toFixed(1), cx: r.x + r.width / 2, cy: r.y + r.height / 2, x: r.x, y: r.y, r: r.right, b: r.bottom }; });
    let minGap = Infinity;
    for (const a of rs) for (const b of rs) if (a !== b) {
      const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.r, b.r)), dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.b, b.b));
      minGap = Math.min(minGap, Math.hypot(dx, dy));
    }
    return { chips: rs.map(({ label, w, h }) => ({ label, w, h })), minW: Math.min(...rs.map((r) => r.w)), minH: Math.min(...rs.map((r) => r.h)),
      allAtLeast24: rs.every((r) => r.w >= 24 && r.h >= 24), minGapPx: +minGap.toFixed(1) };
  });
  report.targetsDesktop = await chipGeom(page);

  report.liveRegions = await page.evaluate(() => [...document.querySelectorAll('[role=status],[role=alert],[role=log],[aria-live]')]
    .map((n) => ({ id: n.id, role: n.getAttribute("role"), ariaLive: n.getAttribute("aria-live"), className: n.className })));
  const before = await page.evaluate(() => [...document.querySelectorAll('[role=status],[aria-live],[role=alert]')].map((n) => n.textContent).join("|"));
  await page.locator('.chip[data-a="Water"]').click();
  const after = await page.evaluate(() => ({
    live: [...document.querySelectorAll('[role=status],[aria-live],[role=alert]')].map((n) => n.textContent).join("|"),
    pressed: document.querySelector('.chip[aria-pressed="true"]').textContent,
    focusedAfterClick: document.activeElement.tagName + (document.activeElement.id ? "#" + document.activeElement.id : ""),
    rows: document.querySelectorAll("#exceptions tr").length - 1 }));
  report.filterClick = { ...after, liveRegionTextChanged: before !== after.live };
  await page.locator('.chip[data-a="All"]').click();
  // Keyboard activation: focus the Water chip with Tab, press Enter, then see where focus is and where the next Tab goes.
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.keyboard.press("Tab"); await page.keyboard.press("Tab");
  const focusedBeforeEnter = await page.evaluate(() => document.activeElement.textContent);
  await page.keyboard.press("Enter");
  const afterEnter = await page.evaluate(() => ({ active: document.activeElement.tagName, pressed: document.querySelector('.chip[aria-pressed="true"]').textContent }));
  await page.keyboard.press("Tab");
  const nextTab = await page.evaluate(() => document.activeElement.tagName + " " + (document.activeElement.textContent || "").trim().slice(0, 20));
  report.keyboardChip = { focusedBeforeEnter, activeElementAfterEnter: afterEnter.active, pressedAfterEnter: afterEnter.pressed, nextTabLandsOn: nextTab };
  await page.locator('.chip[data-a="All"]').click();

  report.chartAlts = await page.evaluate(() => [...document.querySelectorAll("section")].map((sec) => {
    const svgs = [...sec.querySelectorAll("svg.chart")];
    if (!svgs.length) return null;
    return { section: sec.querySelector("h2").textContent, charts: svgs.length,
      labels: [...new Set(svgs.map((s) => s.getAttribute("aria-label")))],
      withTitleOrDesc: svgs.filter((s) => s.querySelector(":scope > title, :scope > desc")).length,
      withDescribedBy: svgs.filter((s) => s.hasAttribute("aria-describedby")).length,
      dataTableInSection: !!sec.querySelector("table") };
  }).filter(Boolean));

  // Chart marks vs the card surface (cards use a gradient from --surface-2 to --surface; test against both ends).
  const vars = await page.evaluate(() => { const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(["--surface", "--surface-2", "--grid", "--axis", "--bar", "--muted", "--s1", "--serious", "--critical", "--warning", "--div-pos", "--div-neg", "--ink", "--ink-2"].map((k) => [k, cs.getPropertyValue(k).trim()])); });
  const S = hex(vars["--surface"]), S2 = hex(vars["--surface-2"]);
  const vs = (c) => ({ vsSurface: ratio(c, S), vsSurface2: ratio(c, S2) });
  report.contrast = {
    vars,
    "gridlines (--grid)": vs(hex(vars["--grid"])),
    "zero / axis lines (--axis)": vs(hex(vars["--axis"])),
    "chip border (--axis) vs chip fill (--surface)": ratio(hex(vars["--axis"]), S),
    "past grazing stays (--bar)": vs(hex(vars["--bar"])),
    "water threshold dashes (--muted)": vs(hex(vars["--muted"])),
    "gain dot (--s1 at fill-opacity .55)": vs(mix(hex(vars["--s1"]), S, 0.55)),
    "over-plan overlay (--serious) vs current stay (--s1)": ratio(hex(vars["--serious"]), hex(vars["--s1"])),
    "budget over (--div-neg) vs under (--div-pos)": ratio(hex(vars["--div-neg"]), hex(vars["--div-pos"])),
    "warning icon (--warning) vs critical icon (--critical)": ratio(hex(vars["--warning"]), hex(vars["--critical"])),
  };

  report.storage = await page.evaluate(() => ({ writes: window.__storageWrites, localStorageKeys: Object.keys(localStorage), sessionStorageKeys: Object.keys(sessionStorage) }));
  await page.screenshot({ path: join(outDir, "desktop-tooltip-escape.png") });

  // ------------------------------------------------------------------ print
  await page.emulateMedia({ media: "print" });
  report.print = await page.evaluate(() => {
    const b = getComputedStyle(document.body), card = getComputedStyle(document.querySelector(".card"));
    const sheets = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } });
    return { bodyColor: b.color, bodyBackground: b.backgroundColor, cardBackgroundImage: card.backgroundImage.slice(0, 60),
      printColorAdjust: b.printColorAdjust || b.webkitPrintColorAdjust || null,
      mediaPrintRules: sheets.filter((r) => r.media && /print/.test(r.media.mediaText)).length,
      pageRules: sheets.filter((r) => r.constructor.name === "CSSPageRule").length };
  });
  const pdfPath = join(outDir, "print-default.pdf");
  await page.pdf({ path: pdfPath, format: "Letter" }); // printBackground defaults to false, like the browser print dialog default
  try {
    const info = execFileSync("pdfinfo", [pdfPath]).toString();
    report.print.pdfPages = +(/Pages:\s+(\d+)/.exec(info) || [])[1];
  } catch { report.print.pdfPages = "pdfinfo unavailable"; }
  try {
    execFileSync("pdftoppm", ["-r", "60", "-f", "1", "-l", "1", "-png", pdfPath, join(outDir, "print-p1")]);
    const png = ["print-p1-1.png", "print-p1-01.png", "print-p1-001.png"].map((f) => join(outDir, f)).find(existsSync);
    // Measure page 1 with a tiny inline PNG reader via Playwright (decode in the browser canvas).
    const b64 = readFileSync(png).toString("base64");
    report.print.page1Raster = await page.evaluate(async (src) => {
      const img = new Image(); img.src = src; await img.decode();
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const L = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      let n = 0, nonWhite = 0, darkest = 1;
      for (let i = 0; i < d.length; i += 4) {
        n++; const y = 0.2126 * L(d[i]) + 0.7152 * L(d[i + 1]) + 0.0722 * L(d[i + 2]);
        if (y < 0.97) { nonWhite++; darkest = Math.min(darkest, y); }
      }
      return { width: c.width, height: c.height, nonWhitePixelShare: +(nonWhite / n).toFixed(4),
        darkestPixelLuminance: +darkest.toFixed(3), darkestPixelContrastOnWhite: +((1.05) / (darkest + 0.05)).toFixed(2) };
    }, `data:image/png;base64,${b64}`);
    report.print.page1Png = png;
  } catch (e) { report.print.rasterError = String(e).slice(0, 200); }
  try { report.print.pdfTextFirst300 = execFileSync("pdftotext", ["-l", "1", pdfPath, "-"]).toString().replace(/\s+/g, " ").slice(0, 300); } catch { /* optional */ }
  await ctx.close();

  // ------------------------------------------------------------------ phone
  const pctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const pp = await pctx.newPage();
  await pp.addInitScript(INIT);
  await pp.goto(baseURL, { waitUntil: "load" });
  await pp.waitForFunction(() => document.querySelectorAll("#rules tr").length > 1, null, { timeout: 10000 });
  report.targetsPhone = await chipGeom(pp);
  const pdot = pp.locator("#gain svg circle").first();
  await pdot.scrollIntoViewIfNeeded();
  const pb = await pdot.boundingBox();
  report.phoneGainDot = { w: +pb.width.toFixed(1), h: +pb.height.toFixed(1) };
  await pp.touchscreen.tap(pb.x + pb.width / 2, pb.y + pb.height / 2);
  report.phoneTapShowsTooltip = await pp.evaluate(() => getComputedStyle(document.getElementById("tip")).display !== "none");
  report.phoneHorizontalOverflowPx = await pp.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await pctx.close();
} finally {
  await browser.close();
}
writeFileSync(join(outDir, "workflow-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
