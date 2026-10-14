// Page wiring for the ranch operations dashboard: load the CSVs, run the rules in exceptions.js, draw the page.
import { RULES, parseCSV, findExceptions, waterStatus, grazingStatus, gainStatus, budgetStatus } from "./exceptions.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const AREAS = ["All", "Water", "Grazing", "Gain", "Health", "Budget"];
const DAY = 864e5;

function svg(tag, attrs = {}, parent) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  parent && parent.appendChild(el);
  return el;
}
function text(parent, x, y, s, attrs = {}) {
  const t = svg("text", { x, y, ...attrs }, parent);
  t.textContent = s;
  return t;
}
const money = (x) => (x < 0 ? "−$" : "$") + Math.abs(Math.round(x)).toLocaleString();
const fmtDate = (s) => new Date(s.length === 10 ? s + "T12:00" : s).toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ---------------------------------------------------------------- tooltip
const tip = $("tip");
function hover(el, html) {
  el.addEventListener("pointermove", (e) => {
    tip.innerHTML = html; tip.style.display = "block";
    tip.style.left = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 8) + "px";
    tip.style.top = e.clientY + 14 + "px";
  });
  el.addEventListener("pointerleave", () => (tip.style.display = "none"));
}

// ---------------------------------------------------------------- severity badge: shape + label + color
const ICON = {
  critical: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" fill="var(--critical)"/><path d="M8 4v5M8 11.5v.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
  serious: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5l7 13H1z" fill="var(--serious)"/><path d="M8 6v4M8 12.3v.2" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>',
  warning: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="var(--warning)"/><path d="M8 4.5v4.5M8 11.5v.3" stroke="#0b0b0b" stroke-width="1.8" stroke-linecap="round"/></svg>',
};
const badge = (sev) => `<span class="sev">${ICON[sev]}${sev[0].toUpperCase() + sev.slice(1)}</span>`;

// ---------------------------------------------------------------- sections
function tiles(d, exc) {
  const count = (s) => exc.filter((e) => e.severity === s).length;
  const tanks = waterStatus(d.water, d.meta[0].as_of);
  const tankIssues = new Set(exc.filter((e) => e.area === "Water").map((e) => e.subject.split(" ")[1]));
  const gain = gainStatus(d.weights, d.groups).find((g) => g.group === "Yearlings");
  const b = budgetStatus(d.budget), tb = b.reduce((s, x) => s + x.budget, 0), ta = b.reduce((s, x) => s + x.actual, 0);
  const head = d.groups.reduce((s, g) => s + g.head, 0);
  const tile = (k, v, s) => `<div class="card tile"><div class="k">${k}</div><div class="v">${v}</div><div class="d">${s}</div></div>`;
  $("tiles").innerHTML =
    tile("Needs attention", exc.length, `${count("critical")} critical, ${count("serious")} serious, ${count("warning")} warning`) +
    tile("Head on grass", head.toLocaleString(), d.groups.map((g) => `${g.head} ${g.group.toLowerCase()}`).join(", ")) +
    tile("Water tanks OK", `${tanks.length - tankIssues.size} of ${tanks.length}`, `${tankIssues.size} need a look`) +
    tile("Yearling gain", `${gain.adg.toFixed(2)} lbs/day`, `target ${gain.target.toFixed(1)}, since ${fmtDate(gain.from)}`) +
    tile("Spend vs budget", `${ta > tb ? "+" : "−"}${Math.abs(((ta - tb) / tb) * 100).toFixed(1)}%`, `${money(ta)} of ${money(tb)}, season to date`);
}

let area = "All";
function exceptionsTable(exc) {
  $("chips").innerHTML = AREAS.map((a) => {
    const n = a === "All" ? exc.length : exc.filter((e) => e.area === a).length;
    return `<button class="chip" type="button" data-a="${a}" aria-pressed="${a === area}">${a} (${n})</button>`;
  }).join("");
  const rows = exc.filter((e) => area === "All" || e.area === area);
  $("exceptions").innerHTML = "<tr><th>Severity</th><th>Area</th><th>What</th><th>Problem</th><th>First step</th></tr>" +
    (rows.length ? rows.map((e) => `<tr><td>${badge(e.severity)}</td><td>${e.area}</td><td>${e.subject}</td><td>${e.problem}</td><td class="action">${e.action}</td></tr>`).join("")
                 : `<tr><td colspan="5">Nothing in ${area.toLowerCase()} needs attention.</td></tr>`);
}

function waterMultiples(d) {
  const asOf = new Date(d.meta[0].as_of), from = asOf - 7 * DAY;
  const names = Object.fromEntries(d.pastures.map((p) => [p.pasture_id, p.name]));
  const W = 260, H = 110, m = { l: 26, r: 6, t: 8, b: 18 };
  const x = (t) => m.l + ((new Date(t) - from) / (asOf - from)) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - v / 100) * (H - m.t - m.b);
  $("water").replaceChildren(...waterStatus(d.water, d.meta[0].as_of).map((t) => {
    const box = document.createElement("div");
    box.className = "mini";
    const silent = t.silentHours >= RULES.sensorSilentHours;
    box.innerHTML = `<h4>${t.tank} ${names[t.pasture]}<span>${silent ? "no signal" : t.level + "%"}</span></h4>`;
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": `Tank ${t.tank} level, last 7 days` }, box);
    for (const v of [0, 50, 100]) {
      svg("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: v ? "var(--grid)" : "var(--axis)" }, s);
      text(s, m.l - 4, y(v) + 4, v, { "text-anchor": "end" });
    }
    for (const v of [RULES.waterLow, RULES.waterCritical])
      svg("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: "var(--muted)", "stroke-dasharray": "2 3" }, s);
    const rows = t.rows.filter((r) => new Date(r.time) >= from);
    svg("path", { d: rows.map((r, i) => `${i ? "L" : "M"}${x(r.time).toFixed(1)},${y(r.level_pct).toFixed(1)}`).join(""), fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-linejoin": "round" }, s);
    const last = rows[rows.length - 1];
    svg("circle", { cx: x(last.time), cy: y(last.level_pct), r: 4, fill: "var(--s1)", stroke: "var(--surface)", "stroke-width": 2 }, s);
    if (silent) {
      svg("rect", { x: x(last.time), y: m.t, width: W - m.r - x(last.time), height: H - m.t - m.b, fill: "var(--wash)" }, s);
      text(s, (x(last.time) + W - m.r) / 2, m.t + 30, "no data", { "text-anchor": "middle", class: "lbl" });
    }
    text(s, m.l, H - 3, fmtDate(new Date(from).toISOString()));
    text(s, W - m.r, H - 3, fmtDate(d.meta[0].as_of), { "text-anchor": "end" });
    const hit = svg("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: "transparent" }, s);
    hit.addEventListener("pointermove", (e) => {
      const r = s.getBoundingClientRect(), tx = from + ((e.clientX - r.left) / r.width * W - m.l) / (W - m.l - m.r) * (asOf - from);
      const near = rows.reduce((a, b) => (Math.abs(new Date(b.time) - tx) < Math.abs(new Date(a.time) - tx) ? b : a));
      tip.innerHTML = `<b>${t.tank} ${names[t.pasture]}</b><br>${new Date(near.time).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" })}: ${near.level_pct}%`;
      tip.style.display = "block"; tip.style.left = e.clientX + 14 + "px"; tip.style.top = e.clientY + 14 + "px";
    });
    hit.addEventListener("pointerleave", () => (tip.style.display = "none"));
    return box;
  }));
}

function grazingTimeline(d) {
  const asOf = d.meta[0].as_of.slice(0, 10), start = d.moves.map((m) => m.in_date).sort()[0];
  const names = Object.fromEntries(d.pastures.map((p) => [p.pasture_id, p]));
  const groups = d.groups.map((g) => g.group);
  const W = 560, rowH = 46, m = { l: 74, r: 10, t: 6, b: 24 }, H = m.t + m.b + groups.length * rowH;
  const span = (new Date(asOf) - new Date(start)) / DAY;
  const x = (dt) => m.l + ((new Date(dt) - new Date(start)) / DAY / span) * (W - m.l - m.r);
  const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": "Grazing rotation by group" });
  for (const mo of ["2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01"]) {
    svg("line", { x1: x(mo), x2: x(mo), y1: m.t, y2: H - m.b, stroke: "var(--grid)" }, s);
    text(s, x(mo) + 3, H - 6, new Date(mo + "T12:00").toLocaleDateString("en-US", { month: "short" }));
  }
  const current = Object.fromEntries(grazingStatus(d.moves, d.pastures, d.meta[0].as_of).map((g) => [g.group, g]));
  groups.forEach((g, i) => {
    const y = m.t + i * rowH + 8;
    text(s, 0, y + 18, g, { class: "lbl" });
    for (const mv of d.moves.filter((mv) => mv.group === g)) {
      const end = mv.out_date || asOf, cur = !mv.out_date, p = names[mv.pasture_id];
      const x0 = x(mv.in_date) + 1, x1 = x(end) - 1;
      svg("rect", { x: x0, y, width: Math.max(1, x1 - x0), height: 26, rx: 4, fill: cur ? "var(--s1)" : "var(--bar)" }, s);
      if (cur) {
        const c = current[g], over = c.days - c.planned;
        if (over > 0) {
          const xp = x(new Date(new Date(mv.in_date).getTime() + c.planned * DAY).toISOString().slice(0, 10));
          svg("rect", { x: xp, y, width: x1 - xp, height: 26, rx: 4, fill: "var(--serious)" }, s);
          text(s, x1, y - 2 + 0, `+${over}d`, { "text-anchor": "end", class: "ink", dy: "-1" });
        }
      }
      if (x1 - x0 > 34) text(s, x0 + 4, y + 17, p.pasture_id, { fill: cur ? "var(--on-s1)" : "var(--ink-2)", style: `fill:${cur ? "var(--on-s1)" : "var(--ink-2)"}` });
      const hit = svg("rect", { x: x0, y, width: Math.max(4, x1 - x0), height: 26, fill: "transparent" }, s);
      const len = Math.round((new Date(end) - new Date(mv.in_date)) / DAY);
      hover(hit, `<b>${g} in ${p.name}</b><br>${fmtDate(mv.in_date)} to ${cur ? "now" : fmtDate(end)} (${len} days)<br>Plan: ${p.planned_graze_days} days`);
    }
  });
  $("grazing").replaceChildren(s);
}

function gainStrip(d) {
  const gs = gainStatus(d.weights, d.groups).filter((g) => g.target);
  const W = 560, rowH = 70, m = { l: 74, r: 14, t: 6, b: 30 }, H = m.t + m.b + gs.length * rowH;
  const all = gs.flatMap((g) => g.animals.map((a) => a.adg));
  const lo = Math.min(0, Math.floor(Math.min(...all) * 2) / 2), hi = Math.ceil(Math.max(...all, ...gs.map((g) => g.target)) * 2) / 2;
  const x = (v) => m.l + ((v - lo) / (hi - lo)) * (W - m.l - m.r);
  const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": "Average daily gain per animal by group" });
  for (let v = lo; v <= hi + 1e-9; v += 0.5) {
    svg("line", { x1: x(v), x2: x(v), y1: m.t, y2: H - m.b, stroke: v === 0 ? "var(--axis)" : "var(--grid)" }, s);
    text(s, x(v), H - 12, v.toFixed(1), { "text-anchor": "middle" });
  }
  text(s, W - m.r, H, "lbs per day", { "text-anchor": "end" });
  let seed = 7;
  const jitter = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280 - 0.5);
  gs.forEach((g, i) => {
    const cy = m.t + i * rowH + rowH / 2;
    text(s, 0, cy - 2, g.group, { class: "lbl" });
    text(s, 0, cy + 14, `avg ${g.adg.toFixed(2)}`);
    for (const a of g.animals) {
      const slow = a.adg < g.target * RULES.animalShare;
      const c = svg("circle", { cx: x(a.adg), cy: cy + jitter() * 34, r: 3.5, fill: "var(--s1)", "fill-opacity": 0.55, stroke: "var(--surface)", "stroke-width": 1 }, s);
      hover(c, `<b>${a.tag}</b> (${g.group})<br>${a.adg.toFixed(2)} lbs/day, ${fmtDate(a.from)} to ${fmtDate(a.to)}<br>Now ${a.weight} lbs${slow ? "<br>Under half of target" : ""}`);
    }
    svg("line", { x1: x(g.target), x2: x(g.target), y1: cy - 26, y2: cy + 26, stroke: "var(--ink)", "stroke-width": 2 }, s);
    text(s, x(g.target) + 4, cy - 18, `target ${g.target.toFixed(1)}`, { class: "ink" });
  });
  $("gain").replaceChildren(s);
}

function budget(d) {
  const rows = budgetStatus(d.budget).sort((a, b) => b.pct - a.pct);
  const W = 560, rowH = 32, m = { l: 140, r: 54, t: 6, b: 24 }, H = m.t + m.b + rows.length * rowH;
  const lim = Math.max(0.3, ...rows.map((r) => Math.abs(r.pct)));
  const x = (v) => m.l + ((v + lim) / (2 * lim)) * (W - m.l - m.r);
  const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": "Percent over or under budget by category" });
  for (const v of [-0.2, -0.1, 0, 0.1, 0.2].filter((v) => Math.abs(v) <= lim)) {
    svg("line", { x1: x(v), x2: x(v), y1: m.t, y2: H - m.b, stroke: v ? "var(--grid)" : "var(--axis)" }, s);
    text(s, x(v), H - 6, (v > 0 ? "+" : "") + Math.round(v * 100) + "%", { "text-anchor": "middle" });
  }
  rows.forEach((r, i) => {
    const cy = m.t + i * rowH + rowH / 2;
    text(s, m.l - 10, cy + 4, r.category, { "text-anchor": "end", class: "lbl" });
    const a = Math.min(x(0), x(r.pct)), w = Math.max(1, Math.abs(x(r.pct) - x(0)));
    const bar = svg("rect", { x: a, y: cy - 9, width: w, height: 18, rx: 3, fill: r.pct > 0 ? "var(--div-neg)" : "var(--div-pos)" }, s);
    text(s, r.pct > 0 ? a + w + 6 : a - 6, cy + 4, (r.pct > 0 ? "+" : "−") + Math.abs(r.pct * 100).toFixed(0) + "%", { "text-anchor": r.pct > 0 ? "start" : "end", class: "lbl" });
    hover(bar, `<b>${r.category}</b><br>Budget ${money(r.budget)}<br>Actual ${money(r.actual)}<br>${r.variance > 0 ? "Over" : "Under"} by ${money(Math.abs(r.variance))}`);
  });
  $("budgetChart").replaceChildren(s);
  $("budgetTable").innerHTML = '<tr><th>Category</th><th class="num">Budget</th><th class="num">Actual</th><th class="num">Difference</th></tr>' +
    rows.map((r) => `<tr><td>${r.category}</td><td class="num">${money(r.budget)}</td><td class="num">${money(r.actual)}</td><td class="num">${r.variance > 0 ? "+" : ""}${money(r.variance)}</td></tr>`).join("");
}

function rules() {
  const R = RULES;
  const list = [
    ["Water", "critical", `Level under ${R.waterCritical}%, or a drop of ${R.waterDropPts}+ points in 24 hours`],
    ["Water", "warning", `Level under ${R.waterLow}%`],
    ["Water", "serious", `No reading for ${R.sensorSilentHours} hours or more`],
    ["Grazing", "serious", "A group is past its pasture's planned graze days"],
    ["Grazing", "warning", `A planned move is ${R.graceDays} days away or less`],
    ["Gain", "serious", `A group's average daily gain is under ${R.adgSerious * 100}% of target since the last weigh-in`],
    ["Gain", "warning", `Animals under ${R.animalShare * 100}% of target (skipped when the whole group is already flagged)`],
    ["Health", "serious", "An open health task is past its due date"],
    ["Health", "warning", `An open health task is due within ${R.dueSoonDays} days`],
    ["Budget", "serious", `A category is more than ${R.budgetSerious * 100}% over budget, season to date`],
    ["Budget", "warning", `A category is ${R.budgetWarn * 100}-${R.budgetSerious * 100}% over budget`],
  ];
  $("rules").innerHTML = "<tr><th>Area</th><th>Severity</th><th>Flags when</th></tr>" +
    list.map(([a, s, w]) => `<tr><td>${a}</td><td>${badge(s)}</td><td>${w}</td></tr>`).join("");
}

// ---------------------------------------------------------------- start
const d = Object.fromEntries(await Promise.all(FILES.map(async (f) => [f, parseCSV(await (await fetch(`data/${f}.csv`)).text())])));
const exc = findExceptions(d);
$("asof").textContent = `Example Ranch (fictional), ${d.pastures.reduce((s, p) => s + p.acres, 0).toLocaleString()} acres in ${d.pastures.length} pastures. Data as of ${new Date(d.meta[0].as_of).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}.`;
$("chips").addEventListener("click", (e) => { if (e.target.dataset.a) { area = e.target.dataset.a; exceptionsTable(exc); } });
tiles(d, exc); exceptionsTable(exc); waterMultiples(d); grazingTimeline(d); gainStrip(d); budget(d); rules();
