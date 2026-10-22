#!/usr/bin/env node
// Takes the four README images in this folder: screenshot.png, water.png, grazing-gain.png and phone.png.
// Each is taken at twice the pixel density with reduced motion. screenshot.png is a 1280 x 900 window, water.png and
// grazing-gain.png are the #water and .grid2 sections of that window, and phone.png is a 390 x 844 phone window with
// touch. The page shows the fictional Example Ranch data it is served with.
//
// Usage (from the repository root):
//   python3 -m http.server 8766 --bind 127.0.0.1           # in another terminal, or any static server
//   node docs/screenshots/capture.mjs [page] [folder]      # page default http://localhost:8766/, folder default this one
// It overwrites the four files in the folder. It checks nothing about the page: look at each image after a retake, and
// update the sizes in this folder's README.md.
//
// Exit code 0 when the four images are written, 1 when the page loads but a part to capture is missing, and 2 when
// Playwright cannot be loaded or nothing is served at the page URL: a set-up problem, not a result about the page,
// reported on one line that starts "ENVIRONMENT:". Playwright is loaded the way docs/audit/redesign/preserve.mjs loads
// it: from $PLAYWRIGHT_MODULE, else $PLAYWRIGHT_PATH (a path to Playwright's index.mjs, or a package name), else from
// /opt/node22/lib/node_modules/playwright/index.mjs if that file exists, else from the "playwright" package. Run so far
// only with Chromium on Linux.
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
const OUT = process.argv[3] ?? fileURLToPath(new URL(".", import.meta.url));

try {
  const r = await fetch(PAGE, { signal: AbortSignal.timeout(10000) });
  await r.body?.cancel();
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
} catch (e) {
  console.error(`ENVIRONMENT: could not reach ${PAGE} (${e.cause?.code ?? e.message}). Serve the page first, for example python3 -m http.server 8766 --bind 127.0.0.1 from the repository root. This is a set-up problem, not a result about the page.`);
  process.exit(2);
}
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
let failed = false;
// Open the page in a new window, wait until the network is quiet and the tiles are drawn, then half a second more.
async function open(options) {
  const ctx = await browser.newContext({ ...options, reducedMotion: "reduce", deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await page.waitForSelector("#tiles .tile", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
  return { ctx, page };
}
async function shot(page, selector, file) {
  const path = join(OUT, file);
  if (!selector) await page.screenshot({ path });
  else {
    const el = await page.$(selector);
    if (!el) { console.error(`MISSING: no ${selector} on the page, so ${file} was not written`); failed = true; return; }
    await el.screenshot({ path });
  }
  console.log(`wrote ${path}`);
}

let { ctx, page } = await open({ viewport: { width: 1280, height: 900 } });
await shot(page, null, "screenshot.png");
await shot(page, "#water", "water.png");
await shot(page, ".grid2", "grazing-gain.png");
await ctx.close();
({ ctx, page } = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }));
await shot(page, null, "phone.png");
await ctx.close();
await browser.close();
process.exit(failed ? 1 : 0);
