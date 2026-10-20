#!/usr/bin/env node
// Independent skeptic re-check of the rendering / safety / failure-state findings, in headless Chromium.
// Written separately from render.browser.mjs (different scenarios, different measurements) so the two can disagree.
//
// Usage (from anywhere): node docs/audit/diagnostics/render.verify.browser.mjs <scratchDir> [port]
// Each scenario copies index.html, app.js, exceptions.js and data/*.csv into <scratchDir>/<id>/, edits ONLY the copy,
// serves <scratchDir> with python3 -m http.server, loads the page and prints what is on screen.
// The repo is never modified.
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SCR = resolve(process.argv[2] || "/tmp/render-verify");
const PORT = +(process.argv[3] || 8931);
const BASE = `http://127.0.0.1:${PORT}/`;
const { chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs");

const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const orig = Object.fromEntries(FILES.map((f) => [f, readFileSync(join(REPO, "data", f + ".csv"), "utf8")]));
const hdr = (t) => t.split("\n")[0] + "\n";
const dropRows = (t, pred) => { const [h, ...rs] = t.trimEnd().split("\n"); return [h, ...rs.filter((r) => !pred(r.split(",")))].join("\n") + "\n"; };
const mapRows = (t, fn) => { const [h, ...rs] = t.trimEnd().split("\n"); return [h, ...rs.map((r) => fn(r.split(",")).join(","))].join("\n") + "\n"; };

const S = [
  { id: "baseline" },
  // F1: a cow-calf + heifer ranch: the Yearlings group is removed from every file (not renamed)
  { id: "f1-no-yearlings", mutate: (f) => { for (const k of ["groups", "moves", "weights", "health"]) f[k] = dropRows(f[k], (c) => c[0] === "Yearlings" || c[1] === "Yearlings"); } },
  { id: "f1-numeric-group", mutate: (f) => { for (const k of ["groups", "moves", "weights", "health"]) f[k] = f[k].split("Cows,").join("2026,"); } },
  // F2: load failures
  { id: "f2-404-water", mutate: (f) => { f.water = null; } },
  { id: "f2-abort-budget", route: "**/data/budget.csv" },
  { id: "f2-404-meta", mutate: (f) => { f.meta = null; } },
  // F3 (+ missed: moves): header-only and missing files that do NOT throw
  { id: "f3-404-health", mutate: (f) => { f.health = null; }, chips: ["Health"] },
  { id: "f3-empty-health", mutate: (f) => { f.health = hdr(f.health); }, chips: ["Health"] },
  { id: "f3-empty-water", mutate: (f) => { f.water = hdr(f.water); }, chips: ["Water"] },
  { id: "f3-empty-budget", mutate: (f) => { f.budget = hdr(f.budget); }, chips: ["Budget"] },
  { id: "m-empty-moves", mutate: (f) => { f.moves = hdr(f.moves); }, chips: ["Grazing"] },
  // F4: markup in CSV text
  { id: "f4-markup", mutate: (f) => {
      f.pastures = f.pastures.replace("Lone Tree", "<b>Lone</b> Tree");
      f.budget = f.budget.split(",Repairs,").join(",<i>Repairs</i>,");
      f.pastures = f.pastures.replace("Windmill", 'Windmill<img src=x onerror="window.__v=1">');
    } },
  // F5: T2 silent for 8+ days (last reading Sep 22 12:00)
  { id: "f5-t2-dead-8d", mutate: (f) => { f.water = dropRows(f.water, (c) => c[0] === "T2" && c[2] > "2026-09-22T12:00"); } },
  // F6: unbudgeted category
  { id: "f6-zero-budget", mutate: (f) => { f.budget += "2026-09,Drought feed,0,500\n"; } },
  // F7: blank level on T3's latest reading (T3 is otherwise healthy at 91.5%)
  { id: "f7-blank-level-t3", mutate: (f) => { f.water = mapRows(f.water, (c) => (c[0] === "T3" && c[2] === "2026-09-30T18:00" ? [c[0], c[1], c[2], ""] : c)); } },
  // F8: tank ids with spaces
  { id: "f8-well-ids", mutate: (f) => { f.water = mapRows(f.water, (c) => (["T2", "T4"].includes(c[0]) ? ["Well " + c[0].slice(1), ...c.slice(1)] : c)); } },
  // F9: on-budget everywhere
  { id: "f9-on-budget", mutate: (f) => { f.budget = mapRows(f.budget, (c) => [c[0], c[1], c[2], c[2]]); }, chips: ["Budget", "All"] },
  // F12: next season (every 2026 date shifted to 2027)
  { id: "f12-season-2027", mutate: (f) => { for (const k of FILES) f[k] = f[k].split("2026-").join("2027-"); } },
  // missed candidates
  { id: "m-blank-head", mutate: (f) => { f.groups = f.groups.replace("Heifers,first-calf heifers,45,", "Heifers,first-calf heifers,,"); } },
  { id: "m-blank-acres", mutate: (f) => { f.pastures = f.pastures.replace("P8,Home Trap,200,", "P8,Home Trap,,"); } },
  { id: "m-long-group-name", mutate: (f) => { for (const k of ["groups", "moves", "weights", "health"]) f[k] = f[k].split("Heifers,").join("Replacement heifers,"); } },
];

rmSync(SCR, { recursive: true, force: true });
for (const s of S) {
  const dir = join(SCR, s.id);
  mkdirSync(join(dir, "data"), { recursive: true });
  for (const f of ["index.html", "app.js", "exceptions.js"]) writeFileSync(join(dir, f), readFileSync(join(REPO, f)));
  const files = { ...orig };
  s.mutate?.(files);
  for (const [k, v] of Object.entries(files)) if (v !== null) writeFileSync(join(dir, "data", k + ".csv"), v);
}
const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", SCR], { stdio: "ignore" });
process.on("exit", () => { try { server.kill(); } catch {} });
for (let i = 0; i < 60; i++) { try { await fetch(BASE); break; } catch { await new Promise((r) => setTimeout(r, 100)); } }

const look = () => {
  const q = (s) => document.querySelectorAll(s).length;
  const nan = [...document.querySelectorAll("svg *")].flatMap((el) => [...el.attributes].filter((a) => /NaN|Infinity/.test(a.value)).map((a) => `${el.tagName}.${a.name}=${a.value}`));
  const rows = [...document.querySelectorAll("#exceptions tr")].filter((tr) => tr.querySelector("td") && !tr.querySelector("td[colspan]"));
  return {
    asof: document.getElementById("asof").textContent,
    tiles: [...document.querySelectorAll("#tiles .tile")].map((t) => [...t.children].map((c) => c.textContent).join(" | ")),
    chips: [...document.querySelectorAll("#chips button")].map((b) => b.textContent).join(", "),
    rows: rows.map((tr) => [...tr.cells].slice(0, 4).map((c) => c.textContent.trim()).join(" | ")),
    empty: document.querySelector("#exceptions td[colspan]")?.textContent ?? null,
    sections: { tiles: q("#tiles .tile"), rows: rows.length, minis: q("#water .mini"), grazing: q("#grazing svg"), gain: q("#gain svg"), budgetSvg: q("#budgetChart svg"), budgetTr: q("#budgetTable tr"), rulesTr: q("#rules tr") },
    nanAttrs: nan.length, nanSample: nan.slice(0, 3),
    bodyBad: [...new Set(document.body.innerText.match(/NaN|undefined|Infinity/g) || [])],
    h4: [...document.querySelectorAll("#water h4")].map((h) => h.textContent),
    budgetTable: [...document.querySelectorAll("#budgetTable tr")].slice(1).map((tr) => tr.textContent),
    budgetLabels: [...document.querySelectorAll("#budgetChart text.lbl")].map((t) => t.textContent),
    grazingText: [...document.querySelectorAll("#grazing text")].map((t) => `${t.textContent}@${Math.round(+t.getAttribute("x"))}`),
    excHTML: document.getElementById("exceptions").innerHTML,
    flag: !!window.__v,
    injected: { b: q("#exceptions b, #water h4 b"), i: q("#exceptions i, #budgetTable i"), img: q("#exceptions img, #water h4 img") },
    labelOverlap: (() => { // widest group label in the grazing chart vs the plot's left edge (viewBox x=74)
      const s = document.querySelector("#grazing svg"); if (!s) return null;
      const ls = [...s.querySelectorAll("text.lbl")].map((t) => ({ t: t.textContent, right: Math.round(t.getBBox().x + t.getBBox().width) }));
      return ls;
    })(),
  };
};

const browser = await chromium.launch();
for (const s of S) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: "America/Chicago" });
  const page = await ctx.newPage();
  const errs = [], cons = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && cons.push(m.text()));
  if (s.route) await page.route(s.route, (r) => r.abort());
  await page.goto(BASE + s.id + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const chipMsgs = [];
  for (const a of s.chips || []) { await page.click(`#chips [data-a="${a}"]`); chipMsgs.push(`${a}: ${await page.evaluate(() => document.querySelector("#exceptions td[colspan]")?.textContent ?? "(" + (document.querySelectorAll("#exceptions tr").length - 1) + " rows)")}`); }
  const r = await page.evaluate(look);
  console.log(`\n### ${s.id}`);
  console.log(`pageerror: ${JSON.stringify(errs)} | console errors: ${cons.length}`);
  console.log(`asof: ${JSON.stringify(r.asof)}`);
  console.log(`tiles: ${JSON.stringify(r.tiles)}`);
  console.log(`chips: ${r.chips}`);
  console.log(`sections: ${JSON.stringify(r.sections)} | NaN/Inf svg attrs: ${r.nanAttrs} ${JSON.stringify(r.nanSample)} | NaN/undefined/Infinity in page text: ${JSON.stringify(r.bodyBad)}`);
  if (chipMsgs.length) console.log(`after chip clicks: ${JSON.stringify(chipMsgs)}`);
  if (/f3|m-empty|f6|f7|f8|f5|f1-no|f9/.test(s.id)) console.log(`rows: ${JSON.stringify(r.rows)}`);
  if (/f7|f8|f5/.test(s.id)) console.log(`water h4: ${JSON.stringify(r.h4)}`);
  if (/f6|f9|f4|budget/.test(s.id)) console.log(`budget table: ${JSON.stringify(r.budgetTable)} | budget chart labels: ${JSON.stringify(r.budgetLabels)}`);
  if (/f4/.test(s.id)) console.log(`window.__v set: ${r.flag} | injected elements: ${JSON.stringify(r.injected)} | #exceptions has raw '<b>Lone</b>': ${r.excHTML.includes("<b>Lone</b>")} | has '&lt;b&gt;': ${r.excHTML.includes("&lt;b&gt;")} | T4 heading: ${JSON.stringify(r.h4[3])}`);
  if (/f12|m-empty-moves/.test(s.id)) console.log(`grazing text: ${JSON.stringify(r.grazingText.slice(0, 8))}`);
  if (/long-group|baseline/.test(s.id)) console.log(`grazing group label right edges (plot starts at x=74): ${JSON.stringify(r.labelOverlap)}`);
  await page.screenshot({ path: join(SCR, s.id + ".png"), fullPage: true });
  await ctx.close();
}
await browser.close();
server.kill();
console.log("\ndone");
