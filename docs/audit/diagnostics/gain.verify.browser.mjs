// Independent browser check for the gain-rule audit. Serves nothing itself: point it at a running static server that
// hosts a COPY of index.html, app.js, exceptions.js and data/ (CSV bodies are swapped per case with request routing).
//   node docs/audit/diagnostics/gain.verify.browser.mjs http://127.0.0.1:8931/
// Modifies no repo files.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
const { chromium } = await import("/opt/node22/lib/node_modules/playwright/index.mjs");
const BASE = process.argv[2] || "http://127.0.0.1:8931/";
const ROOT = new URL("../../../", import.meta.url);
const RAW = Object.fromEntries(["weights", "groups"].map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));

const rendererRSS = () => {
  try {
    return execSync("ps -eo rss,args | grep -- '--type=renderer' | grep -v grep | awk '{s+=$1} END {print s}'").toString().trim();
  } catch { return "?"; }
};

async function run(id, over = {}, { hangCheck = false } = {}) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.route("**/data/*.csv", (route) => {
    const f = new URL(route.request().url()).pathname.split("/").pop().replace(".csv", "");
    return f in over ? route.fulfill({ status: 200, contentType: "text/csv", body: over[f] }) : route.continue();
  });
  try {
    await page.goto(BASE, { waitUntil: "commit" });
    if (hangCheck) {
      await new Promise((r) => setTimeout(r, 1500));
      const rss0 = rendererRSS();
      const alive = await Promise.race([page.evaluate(() => "answered").catch((e) => "err " + e.message), new Promise((r) => setTimeout(() => r("NO ANSWER in 3 s"), 3000))]);
      const rss1 = rendererRSS();
      console.log(`[${id}] main thread: ${alive}; renderer RSS kB before/after the 3 s wait: ${rss0} -> ${rss1}; pageerrors=${JSON.stringify(errs)}`);
      return;
    }
    await page.waitForLoadState("load");
    await page.waitForTimeout(800);
    const s = await page.evaluate(() => {
      const q = (sel) => [...document.querySelectorAll(sel)];
      const gainSvg = document.querySelector("#gain svg");
      const circles = gainSvg ? [...gainSvg.querySelectorAll("circle")] : [];
      return {
        asof: document.getElementById("asof")?.textContent.slice(0, 40),
        tiles: q("#tiles .tile").map((t) => t.innerText.replace(/\n/g, " / ")),
        excRows: q("#exceptions tr").length - 1,
        gainRows: q("#exceptions tr").slice(1).map((tr) => tr.innerText.replace(/\t/g, " | ")).filter((t) => /Gain/.test(t)).map((t) => t.slice(0, 90)),
        dots: circles.length,
        nanDots: circles.filter((c) => c.getAttribute("cx") === "NaN").length,
        dotFills: [...new Set(circles.map((c) => `${c.getAttribute("fill")}/${c.getAttribute("fill-opacity")}/${c.getAttribute("r")}`))],
        gridlines: gainSvg ? [...gainSvg.querySelectorAll("line")].filter((l) => l.getAttribute("y1") === "6").length : 0,
        labels: gainSvg ? [...gainSvg.querySelectorAll("text")].map((t) => t.textContent).filter((t) => /avg|target/.test(t)) : [],
        rulesRows: q("#rules tr").length - 1,
      };
    });
    console.log(`[${id}] pageerrors=${JSON.stringify(errs)} ${JSON.stringify(s)}`);
  } catch (e) {
    console.log(`[${id}] harness error ${e.message.split("\n")[0]} pageerrors=${JSON.stringify(errs)}`);
  } finally {
    const killer = setTimeout(() => { try { browser.process?.()?.kill("SIGKILL"); } catch {} }, 3000);
    await browser.close().catch(() => {});
    clearTimeout(killer);
  }
}

const which = process.argv[3] || "all";
const cases = {
  control: () => run("control"),
  single: () => run("single weigh-in Y151", { weights: RAW.weights + "Y151,Yearlings,2026-09-15,820\n" }),
  steers: () => run("Yearlings renamed Steers", { weights: RAW.weights.replaceAll("Yearlings", "Steers"), groups: RAW.groups.replace("Yearlings", "Steers") }),
  blanktarget: () => run("Yearlings target blank", { groups: RAW.groups.replace("Yearlings,yearling steers,150,2.0", "Yearlings,yearling steers,150,") }),
  naHeifer: () => run("H001 Sep 15 weight 'NA'", { weights: RAW.weights.replace("H001,Heifers,2026-09-15,1169", "H001,Heifers,2026-09-15,NA") }),
  naYearling: () => run("Y001 Sep 15 weight 'NA'", { weights: RAW.weights.replace("Y001,Yearlings,2026-09-15,851", "Y001,Yearlings,2026-09-15,NA") }),
  target175: () => run("Yearlings target 1.75", { groups: RAW.groups.replace("Yearlings,yearling steers,150,2.0", "Yearlings,yearling steers,150,1.75") }),
  dupPlus: () => run("dup H001 Sep 15 1180 (+Inf)", { weights: RAW.weights + "H001,Heifers,2026-09-15,1180\n" }, { hangCheck: true }),
  dupMinus: () => run("dup H001 Sep 15 1160 (-Inf)", { weights: RAW.weights + "H001,Heifers,2026-09-15,1160\n" }, { hangCheck: true }),
  dupEqual: () => run("dup H001 Sep 15 1169 (NaN)", { weights: RAW.weights + "H001,Heifers,2026-09-15,1169\n" }),
};
for (const [k, fn] of Object.entries(cases)) if (which === "all" || which === k) await fn();
