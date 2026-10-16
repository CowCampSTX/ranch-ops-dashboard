#!/usr/bin/env node
// Rendering, safety and failure-state repros for the ranch operations dashboard.
//
// Run from the repo root:  node docs/audit/diagnostics/render.repro.mjs
//
// Every case runs the REAL code: exceptions.js functions are imported directly, and the REAL app.js is imported
// (a fresh instance per case) against a minimal DOM stub and a stubbed fetch() that serves tiny inline CSVs. The stub
// records every innerHTML write, every SVG attribute that came out NaN, and whether app.js threw (an uncaught error in
// the browser). Expected values are worked out by hand from the inline data, not from the implementation.
// Each case prints CASE, expected, actual and MATCH or MISMATCH. The script never throws.
// Browser confirmation of the same behaviour (script execution, screenshots): render.browser.mjs in this folder.
import { readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = pathToFileURL(resolve(REPO, "app.js")).href;
const X = await import(pathToFileURL(resolve(REPO, "exceptions.js")).href);

// ------------------------------------------------------------------ tiny inline data (no rule fires on it)
// Hand check: water T1 80/80/80, T2 70/70/70 (no low, no drop, last reading = as_of); Cows day 10 of 21, Yearlings
// day 15 of 18 (3 days left > 2-day grace); yearling ADG 114/57 = 2.00, 2.00, 100/57 = 1.754, average 1.918 >= 1.6
// and every animal >= 1.0; pinkeye due in 20 days > 7; Fuel 0% over, Labor 5% under.
const BASE = {
  meta: "as_of\n2026-09-30T18:00\n",
  pastures: "pasture_id,name,acres,planned_graze_days,min_rest_days\nP1,North Flat,640,21,45\nP2,Windmill,560,18,45\n",
  groups: "group,class,head,target_adg_lbs\nCows,cow-calf pairs,10,0.0\nYearlings,yearling steers,3,2.0\n",
  moves: "group,pasture_id,in_date,out_date\nCows,P1,2026-09-20,\nYearlings,P2,2026-09-15,\n",
  weights: "tag,group,date,weight_lbs\nY1,Yearlings,2026-07-20,600\nY1,Yearlings,2026-09-15,714\nY2,Yearlings,2026-07-20,600\nY2,Yearlings,2026-09-15,714\nY3,Yearlings,2026-07-20,600\nY3,Yearlings,2026-09-15,700\n",
  water: "tank_id,pasture_id,time,level_pct\nT1,P1,2026-09-29T18:00,80\nT1,P1,2026-09-30T12:00,80\nT1,P1,2026-09-30T18:00,80\nT2,P2,2026-09-29T18:00,70\nT2,P2,2026-09-30T12:00,70\nT2,P2,2026-09-30T18:00,70\n",
  health: "group,task,last_done,next_due,status\nCows,Pinkeye check,2026-08-01,2026-10-20,open\n",
  budget: "month,category,budget,actual\n2026-09,Fuel,1000,1000\n2026-09,Labor,2000,1900\n",
};
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const header = (t) => t.split("\n")[0] + "\n";
const parseAll = (files) => Object.fromEntries(FILES.map((f) => [f, X.parseCSV(files[f])]));
// python3 -m http.server's real 404 body (captured with curl from this machine)
const PY404 = `<!DOCTYPE HTML>\n<html lang="en">\n    <head>\n        <meta charset="utf-8">\n        <title>Error response</title>\n    </head>\n    <body>\n        <h1>Error response</h1>\n        <p>Error code: 404</p>\n        <p>Message: File not found.</p>\n        <p>Error code explanation: 404 - Nothing matches the given URI.</p>\n    </body>\n</html>\n`;

// ------------------------------------------------------------------ minimal DOM + fetch stub, then the real app.js
let runNo = 0;
async function runApp(files, { networkFail = [] } = {}) {
  const els = {}, nanAttrs = [], textNodes = [];
  const make = (tag, id) => {
    const el = {
      tag, id, attrs: {}, children: [], listeners: {}, style: {}, dataset: {}, className: "", offsetWidth: 120, _html: "", writes: 0, _text: "",
      setAttribute(k, v) { this.attrs[k] = String(v); if (/NaN|Infinity/.test(String(v))) nanAttrs.push(`<${tag} ${k}="${v}">`); },
      appendChild(c) { this.children.push(c); return c; },
      replaceChildren(...cs) { this.children = cs; this.writes++; },
      addEventListener(t, f) { (this.listeners[t] ??= []).push(f); },
      getBoundingClientRect() { return { left: 0, top: 0, width: 260, height: 110 }; },
      get innerHTML() { return this._html; }, set innerHTML(v) { this._html = String(v); this.writes++; },
      get textContent() { return this._text; }, set textContent(v) { this._text = String(v); if (tag === "text") textNodes.push(this); },
    };
    return el;
  };
  globalThis.document = {
    getElementById: (id) => (els[id] ??= make("div", id)),
    createElementNS: (_ns, tag) => make(tag),
    createElement: (tag) => make(tag),
  };
  globalThis.innerWidth = 1280;
  globalThis.fetch = async (url) => {
    const f = String(url).replace(/^data\/|\.csv$/g, "");
    if (networkFail.includes(f)) throw new TypeError("Failed to fetch");
    const body = files[f];
    return body == null ? { ok: false, status: 404, text: async () => PY404 } : { ok: true, status: 200, text: async () => body };
  };
  let error = null;
  try { await import(`${APP}?run=${++runNo}`); } catch (e) { error = `${e.name}: ${e.message}`; }
  const $ = (id) => (els[id] ??= make("div", id));
  const allListeners = (type) => {
    const out = [];
    const walk = (el) => { if (!el) return; if (el.listeners?.[type]) out.push(el); (el.children || []).forEach(walk); };
    Object.values(els).forEach(walk);
    return out;
  };
  return {
    error, nanAttrs, textNodes, $,
    all: () => Object.values(els).map((e) => e._html + " " + e._text),
    html: (id) => $(id)._html, writes: (id) => $(id).writes, asof: $("asof")._text,
    waterBoxes: () => $("water").children.map((b) => b._html),
    // fire every pointermove listener under a section and collect what the tooltip received
    hoverAll(sectionId) {
      const seen = [];
      const walk = (el) => { (el.listeners?.pointermove || []).forEach((f) => { f({ clientX: 50, clientY: 50 }); seen.push($("tip")._html); }); (el.children || []).forEach(walk); };
      walk($(sectionId));
      return seen;
    },
    clickChip(a) { ($("chips").listeners.click || []).forEach((f) => f({ target: { dataset: { a } } })); return $("exceptions")._html; },
    allListeners,
  };
}
const cells = (html) => [...html.matchAll(/<tr><td>(.*?)<\/tr>/g)].map((m) => m[1].replace(/<svg.*?<\/svg>/g, "").replace(/<\/?t[dh][^>]*>/g, " | ").replace(/\s+/g, " ").trim());
const tilesText = (html) => [...html.matchAll(/<div class="k">(.*?)<\/div><div class="v">(.*?)<\/div><div class="d">(.*?)<\/div>/g)].map((m) => `${m[1]}: ${m[2]} | ${m[3]}`);

// ------------------------------------------------------------------ cases
const results = [];
async function CASE(id, title, expected, fn) {
  let actual, match;
  try { [match, actual] = await fn(); } catch (e) { match = false; actual = `repro threw ${e.name}: ${e.message}`; }
  results.push(match);
  console.log(`\nCASE ${id}  ${title}\n  expected: ${expected}\n  actual:   ${actual}\n  ${match ? "MATCH" : "MISMATCH"}`);
}
const with_ = (over) => ({ ...BASE, ...over });
const T2_LOW = BASE.water.replace(/(T2,P2,[^,]+),70/g, "$1,20");   // T2 steady at 20%: by hand one critical 'Down to 20% full'
const told = (r) => /could not|couldn't|failed|missing|no data|no rows|not load/i.test(r.all().join(" "));

await CASE("R00", "control: tiny clean data renders every section with hand-computed tiles",
  "no error; tiles 'Needs attention: 0 | 0 critical, 0 serious, 0 warning', 'Head on grass: 13 | 10 cows, 3 yearlings', 'Water tanks OK: 2 of 2 | 0 need a look', 'Yearling gain: 1.92 lbs/day | target 2.0, since Jul 20', 'Spend vs budget: −3.3% | $2,900 of $3,000, season to date'",
  async () => {
    const r = await runApp(BASE);
    const t = tilesText(r.html("tiles"));
    const want = ["Needs attention: 0 | 0 critical, 0 serious, 0 warning", "Head on grass: 13 | 10 cows, 3 yearlings", "Water tanks OK: 2 of 2 | 0 need a look", "Yearling gain: 1.92 lbs/day | target 2.0, since Jul 20", "Spend vs budget: −3.3% | $2,900 of $3,000, season to date"];
    return [!r.error && JSON.stringify(t) === JSON.stringify(want) && r.writes("rules") === 1, `error=${r.error}; tiles=${JSON.stringify(t)}; rules written=${r.writes("rules")}`];
  });

// ---------- CSV text reaching innerHTML unescaped
const IMG = '<img src=x onerror="window.__xss=1">';
const rawIn = (html) => html.includes(IMG) || html.includes("<b>") || html.includes("<script>");
await CASE("R01", "pasture name with HTML reaches the exception table and the water chart heading unescaped (app.js:68, :82)",
  "pasture name shown as text: innerHTML of #exceptions and the T2 heading contain '&lt;img', never a live '<img ... onerror'",
  async () => {
    const r = await runApp(with_({
      pastures: BASE.pastures.replace("Windmill", IMG),
      water: T2_LOW,
    }));
    const row = cells(r.html("exceptions")).find((c) => c.includes("T2")) || "(no T2 row)";
    const h4 = r.waterBoxes().find((b) => b.includes("T2")) || "";
    return [!rawIn(r.html("exceptions")) && !rawIn(h4), `error=${r.error}; #exceptions row: ${JSON.stringify(row)}; T2 heading: ${JSON.stringify(h4)}`];
  });

await CASE("R02", "health task and budget category with HTML reach the exception table and budget table unescaped (app.js:68, :198)",
  "task '<b>Booster</b>' and category '<script>x</script>' shown as text (escaped as &lt;b&gt; / &lt;script&gt;)",
  async () => {
    const r = await runApp(with_({
      health: "group,task,last_done,next_due,status\nCows,<b>Booster</b>,2026-06-01,2026-09-15,open\n",                 // overdue by hand: Sep 15 < Sep 30
      budget: "month,category,budget,actual\n2026-09,<script>x</script>,1000,1300\n2026-09,Labor,2000,1900\n",           // 30% over: serious
    }));
    const ex = cells(r.html("exceptions")).filter((c) => /Booster|script/.test(c));
    const bt = cells(r.html("budgetTable"));
    return [!rawIn(r.html("exceptions")) && !rawIn(r.html("budgetTable")), `error=${r.error}; #exceptions rows: ${JSON.stringify(ex)}; #budgetTable rows: ${JSON.stringify(bt)}`];
  });

await CASE("R03", "group name with HTML reaches the 'Head on grass' tile unescaped (app.js:54)",
  "tile detail shows the group name as text",
  async () => {
    const g = "Cows" + IMG;
    const r = await runApp(with_({ groups: BASE.groups.replace("Cows,", g + ","), moves: BASE.moves.replace("Cows,", g + ","), health: BASE.health.replace("Cows,", g + ",") }));
    const t = tilesText(r.html("tiles")).find((x) => x.startsWith("Head on grass")) || "(no tile)";
    return [!r.html("tiles").includes("<img src=x"), `error=${r.error}; ${JSON.stringify(t)}`];
  });

await CASE("R04", "tooltips: ear tag, pasture name and budget category reach tip.innerHTML unescaped on hover (app.js:28, :104, :143, :170, :194)",
  "every tooltip shows CSV text as text",
  async () => {
    const r = await runApp(with_({
      weights: BASE.weights.replaceAll("Y1,", IMG + ","),
      pastures: BASE.pastures.replace("North Flat", IMG),
      budget: BASE.budget.replace(",Labor,", "," + IMG + ","),
    }));
    const tips = { gain: r.hoverAll("gain"), water: r.hoverAll("water"), grazing: r.hoverAll("grazing"), budget: r.hoverAll("budgetChart") };
    const bad = Object.fromEntries(Object.entries(tips).map(([k, v]) => [k, v.find((h) => h.includes("<img src=x")) || null]));
    return [!Object.values(bad).some(Boolean), `error=${r.error}; tooltip HTML with a live <img>: ${JSON.stringify(bad)}`];
  });

// ---------- failure states: missing / empty files
await CASE("R05", "health.csv missing (404): health alerts vanish and the Health filter reports an all-clear",
  "the page says health data could not be loaded; it does not show 'Health (0)' / 'Nothing in health needs attention.'",
  async () => {
    // by hand: the inline task is overdue (due Sep 15, as_of Sep 30) so with the file present there is 1 Health row
    const files = with_({ health: "group,task,last_done,next_due,status\nCows,Booster,2026-06-01,2026-09-15,open\n" });
    const present = X.findExceptions(parseAll(files)).filter((e) => e.area === "Health").length;
    const r = await runApp({ ...files, health: null });
    const chip = (r.html("chips").match(/Health \(\d+\)/) || ["(none)"])[0];
    const msg = (r.clickChip("Health").match(/colspan="5">(.*?)</) || [, "(rows)"])[1];
    const parsed = X.parseCSV(PY404);
    return [told(r) && !/Nothing in health/.test(msg), `with file: ${present} Health row; with 404: error=${r.error}; chip '${chip}'; Health filter says '${msg}'; parseCSV(404 body) -> ${parsed.length} rows with keys ${JSON.stringify(Object.keys(parsed[0]))}`];
  });

await CASE("R06", "health.csv header only: same silent all-clear",
  "an empty health export is reported as missing data, not as 'Nothing in health needs attention.'",
  async () => {
    const r = await runApp(with_({ health: header(BASE.health) }));
    const msg = (r.clickChip("Health").match(/colspan="5">(.*?)</) || [, "(rows)"])[1];
    return [told(r) && !/Nothing in health/.test(msg), `error=${r.error}; Health filter says '${msg}'; page tells user: ${told(r)}`];
  });

await CASE("R07", "water.csv header only: no tanks, no water alerts, tile '0 of 0', empty water section",
  "the page says there are no tank readings (a water all-clear must not come from an empty file)",
  async () => {
    const r = await runApp(with_({ water: header(BASE.water) }));
    const t = tilesText(r.html("tiles")).find((x) => x.startsWith("Water")) || "(no tile)";
    const msg = (r.clickChip("Water").match(/colspan="5">(.*?)</) || [, "(rows)"])[1];
    return [told(r) && !/Nothing in water/.test(msg), `error=${r.error}; ${JSON.stringify(t)}; water charts drawn: ${r.$("water").children.length}; Water filter says '${msg}'`];
  });

await CASE("R08", "water.csv missing (404): uncaught TypeError, nothing below the header is drawn, no message",
  "a visible 'water data could not be loaded' message and the other areas' alerts still listed",
  async () => {
    const r = await runApp(with_({ water: null }));
    return [!r.error && told(r) && r.writes("exceptions") > 0, `error=${r.error}; asof='${r.asof}'; page tells user: ${told(r)}; innerHTML writes: tiles=${r.writes("tiles")}, exceptions=${r.writes("exceptions")}, rules=${r.writes("rules")}`];
  });

await CASE("R09", "meta.csv missing (404) or header only: uncaught TypeError, blank page",
  "a visible message that the as-of time is missing",
  async () => {
    const a = await runApp(with_({ meta: null }));
    const b = await runApp(with_({ meta: header(BASE.meta) }));
    return [told(a) && told(b), `404: error=${a.error}, exceptions writes=${a.writes("exceptions")}; header-only: error=${b.error}, exceptions writes=${b.writes("exceptions")}`];
  });

await CASE("R10", "network failure on one CSV: uncaught 'Failed to fetch', blank page",
  "a visible load-error message",
  async () => {
    const r = await runApp(BASE, { networkFail: ["budget"] });
    return [told(r), `error=${r.error}; page tells user: ${told(r)}; exceptions writes=${r.writes("exceptions")}`];
  });

await CASE("R11", "no group named 'Yearlings': the tile code throws and the exception table is never drawn although alerts exist (app.js:48, :56, :225)",
  "1 alert computed (T2 steady at 20% < 25%, by hand) and 1 alert row shown; only the yearling tile changes",
  async () => {
    const files = with_({
      groups: BASE.groups.replace("Yearlings", "Steers"), moves: BASE.moves.replace("Yearlings", "Steers"), weights: BASE.weights.replaceAll("Yearlings", "Steers"),
      water: T2_LOW,
    });
    const computed = X.findExceptions(parseAll(files)).length;
    const r = await runApp(files);
    const shown = cells(r.html("exceptions")).length;
    return [!r.error && shown === 1, `findExceptions -> ${computed} row(s); app.js error=${r.error}; asof shown='${r.asof.slice(0, 60)}...'; #exceptions writes=${r.writes("exceptions")}, rows shown=${shown}`];
  });

await CASE("R12", "a group named with digits only ('2025'): parseCSV turns it into a number and the tile code throws",
  "the group is listed as '2025' and every alert row is drawn",
  async () => {
    const files = with_({ groups: BASE.groups.replace("Cows,", "2025,"), moves: BASE.moves.replace("Cows,", "2025,"), health: BASE.health.replace("Cows,", "2025,") });
    const parsed = X.parseCSV(files.groups)[0].group;
    const r = await runApp(files);
    return [!r.error, `parseCSV group value: ${JSON.stringify(parsed)} (${typeof parsed}); app.js error=${r.error}; #exceptions writes=${r.writes("exceptions")}`];
  });

await CASE("R13", "tank with no reading in the last 7 days: alert is listed, then the water chart throws and grazing, gain, budget and rules never draw (app.js:90-93)",
  "T2 listed as 'No reading for 222 hours' (Sep 21 12:00 -> Sep 30 18:00 = 9 d 6 h, by hand) AND every section drawn",
  async () => {
    const r = await runApp(with_({ water: BASE.water.replace(/T2,P2,.*\n/g, "") + "T2,P2,2026-09-21T06:00,70\nT2,P2,2026-09-21T12:00,70\n" }));
    const row = cells(r.html("exceptions")).find((c) => c.includes("T2")) || "(none)";
    return [!r.error && r.writes("rules") === 1, `T2 row: ${JSON.stringify(row)}; error=${r.error}; writes: water=${r.writes("water")}, grazing=${r.writes("grazing")}, gain=${r.writes("gain")}, budgetTable=${r.writes("budgetTable")}, rules=${r.writes("rules")}`];
  });

// ---------- NaN / Infinity reaching the display
await CASE("R14", "a category with a zero budget and real spending: 'Infinity% over' and a NaN budget chart",
  "the $500 of unbudgeted spending is reported in dollars (e.g. 'unbudgeted, $500'); no Infinity/NaN text or attributes",
  async () => {
    const files = with_({ budget: BASE.budget + "2026-09,Drought feed,0,500\n" });
    const e = X.findExceptions(parseAll(files)).find((x) => x.subject === "Drought feed");
    const r = await runApp(files);
    return [!/Infinity|NaN/.test(e?.problem ?? "") && !r.nanAttrs.length, `findExceptions problem: ${JSON.stringify(e?.problem)}; NaN/Infinity SVG attributes in app: ${r.nanAttrs.length} (e.g. ${JSON.stringify(r.nanAttrs.slice(0, 2))})`];
  });

await CASE("R15", "budget.csv header only / missing: the spend tile shows NaN",
  "tile says there is no budget data; no 'NaN' text",
  async () => {
    const a = await runApp(with_({ budget: header(BASE.budget) }));
    const b = await runApp(with_({ budget: null }));
    const ta = tilesText(a.html("tiles")).find((x) => x.startsWith("Spend")), tb = tilesText(b.html("tiles")).find((x) => x.startsWith("Spend"));
    return [!/NaN/.test(ta + tb), `header only: ${JSON.stringify(ta)}; 404: ${JSON.stringify(tb)}; 404 budget table: ${JSON.stringify(cells(b.html("budgetTable")))}`];
  });

await CASE("R16", "blank last tank reading: reported as a critical leak 'Dropped 70 points ... now %'",
  "a missing reading is reported as a sensor/data problem (or the last good reading is used); no 'now %' with an empty level",
  async () => {
    const files = with_({ water: BASE.water.replace("T2,P2,2026-09-30T18:00,70", "T2,P2,2026-09-30T18:00,") });
    const e = X.findExceptions(parseAll(files)).find((x) => x.subject.includes("T2"));
    const r = await runApp(files);
    const h4 = r.waterBoxes().find((b) => b.includes("T2"));
    return [!(e && /now %|to %/.test(e.problem)), `exception: ${e ? `${e.severity} ${JSON.stringify(e.problem)}` : "none"}; T2 chart heading: ${JSON.stringify(h4)}`];
  });

// ---------- counts that disagree
await CASE("R17", "tank ids containing a space: the 'Water tanks OK' tile undercounts tanks needing a look (app.js:47)",
  "2 water rows (Well 1 and Well 2 steady at 20% < 25%, by hand) -> tile 'Water tanks OK: 0 of 2 | 2 need a look'",
  async () => {
    const files = with_({ water: BASE.water.replace(/,(80|70)\n/g, ",20\n").replaceAll("T1,", "Well 1,").replaceAll("T2,", "Well 2,") });
    const r = await runApp(files);
    const t = tilesText(r.html("tiles")).find((x) => x.startsWith("Water"));
    const chip = (r.html("chips").match(/Water \(\d+\)/) || ["?"])[0];
    return [t === "Water tanks OK: 0 of 2 | 2 need a look", `${JSON.stringify(t)}; chip '${chip}'`];
  });

// ---------- wording
await CASE("R18", "all-clear wording on the 'All' filter",
  "a plain sentence such as 'Nothing needs attention.'",
  async () => {
    const r = await runApp(BASE);
    const msg = (r.html("exceptions").match(/colspan="5">(.*?)</) || [, "(rows)"])[1];
    return [msg === "Nothing needs attention.", JSON.stringify(msg)];
  });

await CASE("R19", "spend exactly on budget shows a minus sign",
  "'0.0%' (Fuel 1000/1000 and Labor 2000/2000: 3000 of 3000, by hand)",
  async () => {
    const r = await runApp(with_({ budget: "month,category,budget,actual\n2026-09,Fuel,1000,1000\n2026-09,Labor,2000,2000\n" }));
    const t = tilesText(r.html("tiles")).find((x) => x.startsWith("Spend"));
    return [/^Spend vs budget: [+±]?0\.0%/.test(t), JSON.stringify(t)];
  });

await CASE("R20", "grazing timeline month lines are hard-coded to June-September 2026 (app.js:120)",
  "month lines only inside the plotted range [74, 550] for a season starting 2026-09-15",
  async () => {
    const r = await runApp(BASE);
    const svgEl = r.$("grazing").children[0];
    const lines = (svgEl?.children || []).filter((c) => c.tag === "line").map((c) => Math.round(+c.attrs.x1));
    const labels = (svgEl?.children || []).filter((c) => c.tag === "text" && /^(Jun|Jul|Aug|Sep)$/.test(c._text)).map((c) => `${c._text}@x=${Math.round(+c.attrs.x)}`);
    return [lines.every((x) => x >= 74 && x <= 550), `month line x positions: ${JSON.stringify(lines)}; labels: ${JSON.stringify(labels)}`];
  });

// ---------- things that hold (controls)
await CASE("C01", "counts agree on the real data: tile = 'All' chip = table rows = sum of area chips",
  "10 = 10 = 10 = 3+1+2+2+2 (the 10 planted problems, README)",
  async () => {
    const files = Object.fromEntries(FILES.map((f) => [f, readFileSync(resolve(REPO, "data", f + ".csv"), "utf8")]));
    const r = await runApp(files);
    const tile = +(r.html("tiles").match(/Needs attention<\/div><div class="v">(\d+)/) || [])[1];
    const chips = [...r.html("chips").matchAll(/>(\w+) \((\d+)\)</g)].map((m) => [m[1], +m[2]]);
    const all = chips.find(([a]) => a === "All")[1], sum = chips.filter(([a]) => a !== "All").reduce((s, [, n]) => s + n, 0);
    const rows = cells(r.html("exceptions")).length;
    return [!r.error && tile === 10 && all === 10 && rows === 10 && sum === 10 && !r.nanAttrs.length, `error=${r.error}; tile=${tile}, All chip=${all}, rows=${rows}, area chips=${JSON.stringify(chips.slice(1))} sum=${sum}; NaN attrs=${r.nanAttrs.length}`];
  });

await CASE("C02", "SVG labels use textContent, so hostile text in chart labels stays text (app.js:16-19, :190)",
  "the budget chart's category label holds the raw string as text content (no innerHTML on #budgetChart)",
  async () => {
    const r = await runApp(with_({ budget: BASE.budget.replace(",Labor,", "," + IMG + ",") }));
    const t = r.textNodes.find((n) => n._text === IMG);
    return [!!t && !r.html("budgetChart"), `text node with the payload as plain text: ${!!t}; #budgetChart innerHTML used: ${JSON.stringify(r.html("budgetChart"))}`];
  });

console.log(`\n${results.length} cases: ${results.filter(Boolean).length} MATCH, ${results.filter((x) => !x).length} MISMATCH`);
