// Skeptic's re-check of the time/timezone/reporting-period findings, plus defects the first pass missed.
// Run from anywhere:  node docs/audit/diagnostics/time.verify.mjs            (node cases, re-run per TZ)
//                     node docs/audit/diagnostics/time.verify.mjs --browser [port]   (adds the locale case; needs Playwright)
// Feeds the committed CSVs (with one change per case) through the REAL exceptions.js. Modifies no repo file;
// the browser case copies the app into a temp folder.
import { spawnSync, spawn } from "node:child_process";
import { readFileSync, mkdtempSync, mkdirSync, cpSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const SELF = fileURLToPath(import.meta.url);
const { parseCSV, findExceptions, waterStatus, gainStatus, budgetStatus } = await import(new URL("exceptions.js", "file://" + ROOT).href);
const F = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(F.map((f) => [f, readFileSync(join(ROOT, "data", `${f}.csv`), "utf8").trimEnd()]));
const load = (o = {}) => Object.fromEntries(F.map((f) => [f, parseCSV(o[f] ?? RAW[f])]));
const rows = (d, re) => findExceptions(d).map((e) => `${e.severity}: ${e.subject}: ${e.problem}`).filter((s) => !re || re.test(s));

const PROBES = {
  // MISSED-1: as_of exported in UTC. 2026-10-01T01:00Z is Sep 30 20:00 in US Central; the grazing/health rules take
  // as_of.slice(0,10) = "2026-10-01". Expected (ranch date Sep 30): the committed Day 24 / Overdue by 15 / Due in 3.
  asofZ: () => rows(load({ meta: "as_of\n2026-10-01T01:00Z" }), /Grazing|Health|Sand Hills|South Divide|Lone Tree|Booster|Pinkeye/).filter((s) => !/^.*Tank/.test(s)).join(" / "),
  asofCentral: () => rows(load({ meta: "as_of\n2026-09-30T20:00-05:00" })).filter((s) => !/Tank/.test(s) && /Sand Hills|South Divide|Lone Tree|Booster|Pinkeye/.test(s)).join(" / "),
};
if (process.argv[2] === "--probe") { console.log(JSON.stringify(PROBES[process.argv[3]]())); process.exit(0); }
const inZones = (name) => ["UTC", "America/Chicago", "Pacific/Auckland"].map((tz) =>
  `\n      ${tz.padEnd(17)} ${JSON.parse(spawnSync(process.execPath, [SELF, "--probe", name], { env: { ...process.env, TZ: tz }, encoding: "utf8" }).stdout)}`).join("");

const CASES = [
  ["MISSED-1", "UTC-stamped as_of (2026-10-01T01:00Z = Sep 30 8 PM Central): calendar-day rules use the UTC date, for every viewer",
    "Day 24 of a 21-day plan (3 days over) / Overdue by 15 days / Due in 3 days, and no extra rows (as with 2026-09-30T20:00-05:00)",
    () => `asofZ:${inZones("asofZ")}\n    asofCentral:${inZones("asofCentral")}`],
  ["F4+", "back-dated report: committed data with as_of 2026-09-15T18:00 (T4 leak starts Sep 29, T2 low Sep 26)",
    "no water alerts (rows up to Sep 15 18:00 show none)",
    () => { const d = load({ meta: "as_of\n2026-09-15T18:00" }); const cut = d.water.filter((r) => r.time <= "2026-09-15T18:00");
      return `all rows: ${rows(d, /Tank/).join(" / ")}\n    rows <= as_of: ${rows({ ...d, water: cut }, /Tank/).join(" / ") || "(no water alerts)"}`; }],
  ["F3+", "budget.csv with last season (2025-06..09 at 95% of budget) appended: 'season to date' sums two seasons",
    "Fuel 21% over ($2,040), Repairs 25% over ($1,800), both serious; note month <= '2026-09' keeps all 48 rows",
    () => { const cats = ["Feed and mineral,6200", "Fuel,2400", "Repairs,1800", "Vet and health,1500", "Labor,9000", "Water and fencing,1200"];
      const prior = cats.flatMap((c) => { const [n, b] = c.split(","); return ["2025-06", "2025-07", "2025-08", "2025-09"].map((m) => `${m},${n},${b},${Math.round(b * 0.95)}`); }).join("\n");
      const d = load({ budget: RAW.budget + "\n" + prior });
      return `${rows(d, /Budget|Fuel|Repairs/).join(" / ")}; rows kept by month <= "2026-09": ${d.budget.filter((r) => r.month <= "2026-09").length}; "2026-09-01" <= "2026-09" is ${"2026-09-01" <= "2026-09"}`; }],
  ["F2+", "impossible ISO day 2026-09-31 as the booster due date: V8 rolls it to Oct 1 instead of rejecting it",
    "a Data error, or at least not a quiet 'Due in 1 day'",
    () => rows(load({ health: RAW.health.replace("2026-09-15,open", "2026-09-31,open") }), /Booster/).join(" / ")],
  ["F7+", "ISO with a space instead of T on the newest reading ('2026-09-30 18:00' at 20%) sorts before '2026-09-30T12:00'",
    "critical: Down to 20% full",
    () => { const w = "tank_id,pasture_id,time,level_pct\nT1,P1,2026-09-30T06:00,50\nT1,P1,2026-09-30T12:00,49\nT1,P1,2026-09-30 18:00,20";
      const d = load({ water: w, moves: "group,pasture_id,in_date,out_date" }); const t = waterStatus(d.water, d.meta[0].as_of)[0];
      return `last=${t.lastTime} level=${t.level}; ${rows(d, /Tank/).join(" / ") || "(no alert)"}`; }],
  ["F10+", "committed heifers, H001-H003 (first in file order) missed the Sep 15 weigh-in",
    "serious Heifers ... since 2026-07-20 (the period 42 of 45 heifers were weighed in)",
    () => { const w = RAW.weights.split(/\r?\n/).filter((l) => !/^H00[1-3],Heifers,2026-09-15/.test(l)).join("\n");
      const d = load({ weights: w }); const g = gainStatus(d.weights, d.groups).find((x) => x.group === "Heifers");
      return `adg=${g.adg.toFixed(3)} from=${g.from} to=${g.to}; ${rows(d, /Heifers:/).join(" / ")}`; }],
];
for (const [id, title, expected, fn] of CASES) {
  console.log(`CASE ${id}  ${title}\n  expected: ${expected}`);
  try { console.log(`  actual:   ${fn()}`); } catch (e) { console.log(`  actual:   ERROR ${e.message}`); }
  console.log("");
}

if (process.argv[2] === "--browser") {
  // MISSED-2: money and acres are formatted in the viewer's locale while dates are pinned to en-US.
  const PORT = Number(process.argv[3] || 8861), WORK = mkdtempSync(join(tmpdir(), "time-verify-"));
  mkdirSync(join(WORK, "data"), { recursive: true });
  for (const f of ["index.html", "app.js", "exceptions.js"]) cpSync(join(ROOT, f), join(WORK, f));
  for (const f of F) writeFileSync(join(WORK, "data", `${f}.csv`), RAW[f] + "\n");
  const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1", "--directory", WORK], { stdio: "ignore" });
  await new Promise((r) => setTimeout(r, 900));
  const { chromium } = await import(process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs");
  const b = await chromium.launch();
  try {
    console.log("CASE MISSED-2  committed data viewed with browser locale de-DE vs en-US (timezone America/Chicago both)");
    console.log("  expected: the same '$2,040' / '$89,303 of $88,400' / '4,300 acres' for every viewer (dates are already pinned to en-US)");
    for (const locale of ["en-US", "de-DE"]) {
      const ctx = await b.newContext({ timezoneId: "America/Chicago", locale });
      const p = await ctx.newPage(); await p.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "load" }); await p.waitForTimeout(600);
      const s = await p.evaluate(() => ({ fuel: [...document.querySelectorAll("#exceptions tr")].map((t) => t.textContent).find((t) => /Fuel/.test(t)),
        spend: [...document.querySelectorAll("#tiles .tile")].map((t) => t.textContent).find((t) => /Spend/.test(t)),
        head: document.getElementById("asof").textContent }));
      console.log(`  actual (${locale}): ${s.fuel.match(/\d+% over[^)]*\)/)[0]} | ${s.spend.replace(/\s+/g, " ")} | ${s.head.match(/[\d.,]+ acres/)[0]} | ${s.head.match(/Data as of .*/)[0]}`);
      await ctx.close();
    }
  } finally { await b.close(); server.kill(); }
}
