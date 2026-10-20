// Page wiring for the ranch operations dashboard: load the CSVs, run the rules in exceptions.js, draw the page.
import { RULES, parseCSV, findExceptions, waterStatus, grazingStatus, gainStatus, budgetStatus } from "./exceptions.js";

const $ = (id) => document.getElementById(id);
const NS = "http://www.w3.org/2000/svg";
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const AREAS = ["All", "Water", "Grazing", "Gain", "Health", "Budget"];
const SEVS = ["critical", "serious", "warning"];
const DAY = 864e5;
const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

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
// CSV text is data, not markup: escape it before it goes into innerHTML.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const money = (x) => (x < 0 ? "−$" : "$") + Math.abs(Math.round(x)).toLocaleString();
const signed = (v, s) => (v > 0 ? "+" : v < 0 ? "−" : "") + s;
const pct = (v) => +(v * 100).toFixed(1);   // 0.07 -> 7, not 7.000000000000001
const fmtDate = (s) => new Date(s.length === 10 ? s + "T12:00" : s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtTime = (s) => new Date(s).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" });
// Move dates are calendar days. A date-only string parses as UTC midnight, so the sum can't slip a day in any time zone.
const addDays = (s, n) => new Date(Date.parse(s) + n * DAY).toISOString().slice(0, 10);
const ctx = document.createElement("canvas").getContext("2d");
const measure = (s, size = 12.5, weight = 400) => ((ctx.font = `${weight} ${size}px ${FONT}`), ctx.measureText(s).width);
// Shorten s with an ellipsis until it is at most max pixels wide.
function fitText(s, max, size, weight) {
  if (measure(s, size, weight) <= max) return s;
  while (s.length > 1 && measure(s + "…", size, weight) > max) s = s.slice(0, -1);
  return s + "…";
}
const safe = (f) => { try { f(); } catch (err) { console.error(err); } };

// ---------------------------------------------------------------- tooltip: mouse, touch and keyboard
const tip = $("tip");
let tipOwner = null;   // the chart whose reading the tooltip shows
const barBottom = () => document.querySelector(".topbar").getBoundingClientRect().bottom;
function showTip(html, x, y, above) {
  if (tip._html !== html) { tip.innerHTML = html; tip._html = html; }   // a live region: rewrite it only for a new reading
  tip.hidden = false;
  // The sticky top bar is the top edge: a tooltip that would cover it flips below the point.
  const w = tip.offsetWidth, h = tip.offsetHeight, pad = 8, gap = 14, minTop = barBottom() + pad;
  let left = above ? x - w / 2 : x + gap, top = above ? y - h - 12 : y + gap;
  if (left + w > innerWidth - pad) left = above ? innerWidth - pad - w : x - w - gap;
  if (top + h > innerHeight - pad) top = y - h - gap;
  if (top < minTop) top = y + 16;
  tip.style.transform = `translate(${Math.round(Math.max(pad, left))}px, ${Math.round(Math.max(minTop, top))}px)`;
}
const hideTip = () => { tip.hidden = true; tip._html = null; tipOwner = null; };
addEventListener("keydown", (e) => e.key === "Escape" && tipOwner?._clear());
document.addEventListener("pointerdown", (e) => !e.target.closest?.("[data-explore]") && tipOwner?._clear());
// The tooltip is fixed to the window, so it would drift off its chart as the page scrolls. It follows a reading picked
// with the keyboard (hiding while that reading is under the top bar or off screen) and lets go of one picked with a pointer.
function follow() {
  const s = tipOwner;
  if (!s) return;
  if (s !== document.activeElement || !s.matches(":focus-visible")) return s._clear();
  const y = s._y();
  if (y < barBottom() || y > innerHeight) tip.hidden = true;
  else s._place();
}
addEventListener("scroll", follow, { passive: true });

/**
 * Make a chart readable without a mouse. pts are [{x, y, row, html}] in the chart's own units, in reading order.
 * Pointers (mouse, pen, finger) pick the point nearest them; with the chart focused, the arrow keys step left and right
 * through a row and up and down between rows. mark(i) draws the highlight for point i (-1 clears it); keyboard reading
 * begins at point `start`. A chart with no points is left out of the tab order.
 */
function explore(s, pts, pick, mark, start = 0) {
  if (!pts.length) return;
  if (!(start >= 0 && start < pts.length)) start = 0;
  s.setAttribute("tabindex", "0");
  s.setAttribute("aria-roledescription", "interactive chart");
  s.setAttribute("aria-describedby", "chart-help");
  s.dataset.explore = "";
  let i = -1;
  const scale = () => s.viewBox.baseVal.width / s.getBoundingClientRect().width;
  const at = (j) => {
    const r = s.getBoundingClientRect(), k = 1 / scale();
    return [r.left + pts[j].x * k, r.top + pts[j].y * k];
  };
  // A chart taking the tooltip first clears the highlight of the chart that had it (that chart keeps its reading index).
  const show = (j, x, y, above) => { if (tipOwner !== s) tipOwner?._mark(-1); i = j; mark(j); showTip(pts[j].html, x, y, above); tipOwner = s; };
  const clear = () => { i = -1; mark(-1); if (tipOwner === s) hideTip(); };
  const near = (e) => { const r = s.getBoundingClientRect(), k = scale(); return pick((e.clientX - r.left) * k, (e.clientY - r.top) * k); };
  s._clear = clear;
  s._mark = mark;
  s._dismiss = () => { mark(-1); if (tipOwner === s) hideTip(); };   // keeps i: the next arrow resumes there
  s._place = (j = i) => j >= 0 && j < pts.length && show(j, ...at(j), true);
  s._index = () => i;
  s._y = () => at(i)[1];   // window y of the current reading (i >= 0 whenever this chart owns the tooltip)
  s.addEventListener("pointermove", (e) => {
    const j = near(e);
    j < 0 ? clear() : e.pointerType === "mouse" ? show(j, e.clientX, e.clientY) : show(j, ...at(j), true);
  });
  s.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") { const j = near(e); j >= 0 && show(j, ...at(j), true); } });
  // A keyboard reading outlives the mouse leaving the chart, which often happens only because the page scrolled under it.
  s.addEventListener("pointerleave", (e) => { if (e.pointerType !== "mouse") return; if (!s.matches(":focus-visible")) clear(); else if (tipOwner === s) follow(); });
  s.addEventListener("pointercancel", clear);
  s.addEventListener("focus", () => s.matches(":focus-visible") && s._place(i < 0 ? start : i));
  s.addEventListener("blur", clear);
  s.addEventListener("keydown", (e) => {
    const k = e.key;
    if (k === "Escape") return s._dismiss();
    let j = i < 0 ? start : i;
    const row = pts[j].row, inRow = (r) => pts.map((p, n) => n).filter((n) => pts[n].row === r);
    if (k === "ArrowRight") { if (pts[j + 1]?.row === row) j++; }
    else if (k === "ArrowLeft") { if (pts[j - 1]?.row === row) j--; }
    else if (k === "ArrowDown" || k === "ArrowUp") {
      // the next row in that direction that has points
      const dir = k === "ArrowDown" ? 1 : -1;
      const next = [...new Set(pts.map((p) => p.row))].filter((r) => (r - row) * dir > 0).sort((a, b) => (a - b) * dir)[0];
      if (next !== undefined) j = inRow(next).reduce((a, b) => (Math.abs(pts[b].x - pts[j].x) < Math.abs(pts[a].x - pts[j].x) ? b : a));
    } else if (k === "Home") j = inRow(row)[0];
    else if (k === "End") j = inRow(row).at(-1);
    else return;
    e.preventDefault();
    s._place(j);
  });
}

// ---------------------------------------------------------------- severity badge: shape + label + colour
const ICON = {
  critical: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 1h6l4 4v6l-4 4H5l-4-4V5z" fill="var(--critical)"/><path d="M8 4.2v4.6M8 11.4v.4" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
  serious: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.2l7.2 13.3H.8z" fill="var(--serious)" stroke-linejoin="round"/><path d="M8 6v4M8 12.2v.3" stroke="#1a0b05" stroke-width="1.8" stroke-linecap="round"/></svg>',
  warning: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="var(--warning)"/><path d="M8 4.5v4.5M8 11.5v.3" stroke="#1a1204" stroke-width="1.8" stroke-linecap="round"/></svg>',
  good: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="var(--good)"/><path d="M4.8 8.3l2.2 2.2 4.2-4.6" stroke="#04150a" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  // not a status: the page can't tell, so it says so in ink rather than in a status colour
  unknown: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.3" fill="none" stroke="var(--muted)" stroke-width="1.5"/><path d="M6.2 6.3a1.9 1.9 0 1 1 2.6 1.8c-.5.2-.8.6-.8 1.1v.3M8 11.4v.3" stroke="var(--ink-2)" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
};
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const badge = (sev) => `<span class="sev">${ICON[sev]}${cap(sev)}</span>`;
const pill = (sev, label) => `<span class="pill ${sev}">${ICON[sev]}${esc(label)}</span>`;
const SVGI = {
  tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l7 5v10.4a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3V7.8z"/><circle cx="12" cy="8.6" r="1.6"/></svg>',
  drop: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.7c-3.3 4-6 7.4-6 10.8a6 6 0 0 0 12 0c0-3.4-2.7-6.8-6-10.8z"/></svg>',
  gain: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>',
  money: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M17 5.5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
};

// Each tank's alert, read from the report itself so the page and the list always agree.
const tankAlert = (exc, tank) => exc.find((e) => e.area === "Water" && e.subject.startsWith(`Tank ${tank} (`));
function tankState(t, alert) {
  // A last reading that isn't a number gets no alert from the rules, but it isn't an OK either.
  if (!alert) return Number.isFinite(t.level) ? { sev: "good", label: "OK" } : { sev: "unknown", label: "Can't tell" };
  if (t.silentHours >= RULES.sensorSilentHours) return { sev: alert.severity, label: "No signal" };
  if (t.drop24h >= RULES.waterDropPts) return { sev: alert.severity, label: "Fast drop" };
  return { sev: alert.severity, label: t.level < RULES.waterCritical ? "Go now" : "Check soon" };
}

// Copy that quotes a threshold reads it from RULES, so it can't disagree with the rules table.
function ruleCopy() {
  $("waterNote").textContent = `Percent full, read every 6 hours. The shaded bands are under ${RULES.waterLow}% (check soon) and under ${RULES.waterCritical}% (go now).`;
  $("lgFlag").textContent = `Flagged: under ${pct(RULES.animalShare)}% of target`;
  $("lgRefs").textContent = `${pct(RULES.adgSerious)}% and ${pct(RULES.animalShare)}% of target`;
}

// ---------------------------------------------------------------- summary and tiles
function summary(exc) {
  const n = Object.fromEntries(SEVS.map((s) => [s, exc.filter((e) => e.severity === s).length]));
  $("summary").innerHTML = `
    <div class="summary-top"><div class="hero-num">${exc.length}</div>
      <div><div class="hero-label">${exc.length === 1 ? "item needs" : "items need"} attention</div><div class="note">across ${new Set(exc.map((e) => e.area)).size} of ${AREAS.length - 1} areas</div></div></div>
    <div class="sevbar" role="img" aria-label="${SEVS.map((s) => `${n[s]} ${s}`).join(", ")}">${SEVS.filter((s) => n[s]).map((s) => `<span style="flex:${n[s]};background:var(--${s})"></span>`).join("")}</div>
    <ul class="sevlegend">${SEVS.map((s) => `<li><div class="sl">${badge(s)}<div class="n">${n[s]}</div></div></li>`).join("")}</ul>
    <a class="cta" href="#attention">Review the list <span aria-hidden="true">→</span></a>`;
  // the red wash behind the count means something only when there is a critical item
  $("summary").classList.toggle("has-critical", n.critical > 0);
}

// Why there is no gain to show: no target set at all, or no group with a target has two weigh-ins.
const gainNote = (d) => (d.groups.some((g) => g.target_adg_lbs > 0) ? "No group with a gain target has two weigh-ins yet." : "No group has a gain target set.");
// An animal whose weigh-in isn't a number has no gain; the rules then give its group no average either.
const readable = (a) => Number.isFinite(a.adg);
const unreadable = (g) => { const n = g.animals.filter((a) => !readable(a)).length; return `${n} animal${n === 1 ? "'s" : "s'"} weights can't be read`; };

function tiles(d, exc) {
  const tanks = waterStatus(d.water, d.meta[0].as_of);
  const states = tanks.map((t) => ({ t, ...tankState(t, tankAlert(exc, t.tank)) }));
  const flagged = states.filter((s) => s.sev !== "good");
  // Yearlings if they have a gain target, else the first group with one (0 or blank means none, as in the gain chart).
  const gs = gainStatus(d.weights, d.groups).filter((g) => g.target > 0);
  const gain = gs.find((g) => g.group === "Yearlings") ?? gs[0];
  const b = budgetStatus(d.budget), tb = b.reduce((s, x) => s + x.budget, 0), ta = b.reduce((s, x) => s + x.actual, 0);
  const over = (ta - tb) / tb, overPct = +(over * 100).toFixed(1);   // signed as shown: a hair under budget is 0.0%, not −0.0%
  // A blank or non-number head count is left out of the total (shown as "?"), not glued onto it as text.
  const count = (g) => (Number.isFinite(g.head) ? g.head.toLocaleString() : "?");
  const head = d.groups.reduce((s, g) => s + (Number.isFinite(g.head) ? g.head : 0), 0);
  const headUnknown = d.groups.some((g) => !Number.isFinite(g.head));
  const tile = (i, k, ico, v, mid, sub) =>
    `<div class="card tile rise" style="--i:${2 + i * 0.5}"><div class="top"><span class="k">${k}</span><span class="ico">${ico}</span></div><div class="v">${v}</div>${mid}<div class="d">${sub}</div></div>`;
  const gainMax = gain ? gain.target * 1.25 : 1, gainLow = !!gain && gain.adg < gain.target * RULES.adgSerious;
  const gainName = gain && (gain.group === "Yearlings" ? "Yearling gain" : `${esc(gain.group)} gain`);
  const spendMax = 1 + RULES.budgetSerious * 2.5;
  const spendColor = over > RULES.budgetSerious ? "var(--serious)" : over > RULES.budgetWarn ? "var(--warning)" : "var(--s1)";
  $("tiles").innerHTML =
    tile(0, "Head on grass", SVGI.tag, head.toLocaleString() + (headUnknown ? " <small>+ ?</small>" : ""),
      `<div class="split">${d.groups.map((g) => `<span><b>${count(g)}</b> ${esc(g.group.toLowerCase())}</span>`).join("")}</div>`,
      `Grazing ${new Set(grazingStatus(d.moves, d.pastures, d.meta[0].as_of).map((g) => g.pastureId)).size} of ${d.pastures.length} pastures`) +
    // one status icon per tank, the same glyphs as every other status on the page, so a state never rides on colour alone
    // no readings at all is not "all reading normally"
    (!tanks.length ? tile(1, "Water tanks OK", SVGI.drop, "No data", "", "No tank readings were loaded")
    : tile(1, "Water tanks OK", SVGI.drop, `${tanks.length - flagged.length} <small>of ${tanks.length}</small>`,
      `<div class="pips" role="img" aria-label="${esc(states.map((s) => `${s.t.tank} ${s.label}`).join(", "))}">${states.map((s) => `<span title="${esc(s.t.tank)}: ${s.label}">${ICON[s.sev]}</span>`).join("")}</div>`,
      flagged.length ? `${flagged.length} need a look: ${flagged.map((s) => `${esc(s.t.tank)} ${s.label.toLowerCase()}`).join(", ")}` : "All reading normally")) +
    (!gain ? tile(2, "Daily gain", SVGI.gain, "None yet", "", gainNote(d))
      // a weight that isn't a number leaves the group with no average: say so rather than print NaN
      : !Number.isFinite(gain.adg) ? tile(2, gainName, SVGI.gain, "Can't tell", "", `No average: ${unreadable(gain)}`)
      : tile(2, gainName, SVGI.gain, `${gain.adg.toFixed(2)} <small>lbs/day</small>`,
        `<div class="meter" role="img" aria-label="${gain.adg.toFixed(2)} against a target of ${gain.target.toFixed(1)}"><i style="width:${Math.min(100, (gain.adg / gainMax) * 100)}%;background:${gainLow ? "var(--serious)" : "var(--s1)"}"></i><b style="left:${(gain.target / gainMax) * 100}%"></b></div>`,
        `Target ${gain.target.toFixed(1)}, since ${fmtDate(gain.from)}`)) +
    (tb > 0
      ? tile(3, "Spend vs budget", SVGI.money, `${signed(overPct, Math.abs(overPct).toFixed(1))}<small>%</small>`,
        `<div class="meter" role="img" aria-label="${money(ta)} spent of ${money(tb)} budgeted"><i style="width:${Math.min(100, (ta / tb / spendMax) * 100)}%;background:${spendColor}"></i><b style="left:${(1 / spendMax) * 100}%"></b></div>`,
        `${money(ta)} of ${money(tb)}, season to date`)
      : tile(3, "Spend vs budget", SVGI.money, "No budget", "", `${money(ta)} spent, season to date`));
}

// ---------------------------------------------------------------- what needs attention
let area = "All";
function exceptionsTable(exc) {
  const chips = $("chips");
  if (!chips.children.length) {
    chips.innerHTML = AREAS.map((a) => {
      const n = a === "All" ? exc.length : exc.filter((e) => e.area === a).length;
      return `<button class="chip" type="button" data-a="${a}" aria-pressed="false">${a}<span class="n">${n}</span></button>`;
    }).join("");
    chips.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b) { area = b.dataset.a; exceptionsTable(exc); }
    });
  }
  for (const b of chips.children) b.setAttribute("aria-pressed", b.dataset.a === area);
  const rows = exc.filter((e) => area === "All" || e.area === area);
  $("exceptions").innerHTML = "<thead><tr><th>Severity</th><th>Area</th><th>What</th><th>Problem</th><th>First step</th></tr></thead><tbody>" +
    (rows.length
      ? rows.map((e) => `<tr class="sev-${e.severity}"><td class="c-sev">${badge(e.severity)}</td><td class="c-area"><span class="tag">${esc(e.area)}</span></td><td class="c-what">${esc(e.subject)}</td><td class="c-problem">${esc(e.problem)}</td><td class="c-action">${esc(e.action)}</td></tr>`).join("")
      : `<tr class="empty"><td colspan="5">${area === "All" ? "Nothing needs attention." : `Nothing in ${area.toLowerCase()} needs attention.`}</td></tr>`) + "</tbody>";
}

// ---------------------------------------------------------------- water
function waterMultiples(d, exc) {
  const asOf = new Date(d.meta[0].as_of), from = asOf - 7 * DAY, asOfDay = d.meta[0].as_of.slice(0, 10);
  const names = Object.fromEntries(d.pastures.map((p) => [p.pasture_id, p.name]));
  const all = waterStatus(d.water, d.meta[0].as_of), allStates = all.map((t) => tankState(t, tankAlert(exc, t.tank)));
  // Worst first, like the list; tanks with the same status keep their number order.
  const rank = { critical: 0, serious: 1, warning: 2, unknown: 3, good: 4 };
  const order = all.map((t, i) => i).sort((a, b) => rank[allStates[a].sev] - rank[allStates[b].sev] || a - b);
  const tanks = order.map((i) => all[i]), states = order.map((i) => allStates[i]);
  const ok = states.filter((s) => s.sev === "good").length;
  const worst = SEVS.find((v) => states.some((s) => s.sev === v)) ?? "good";
  const grid = $("tanks");
  if (!tanks.length) {
    $("waterSum").className = "pill unknown";
    $("waterSum").innerHTML = `${ICON.unknown}No readings`;
    grid.innerHTML = '<p class="empty-note" style="grid-column:1/-1">No tank readings were loaded.</p>';
    return;
  }
  $("waterSum").className = `pill ${worst}`;
  $("waterSum").innerHTML = `${ICON[worst]}${ok} of ${tanks.length} OK`;
  grid.replaceChildren(...tanks.map((t, i) => {
    const st = states[i], silent = t.silentHours >= RULES.sensorSilentHours, name = names[t.pasture] ?? t.pasture;
    // A reading from an earlier day shows its date, so it can't pass for one later than the as-of time.
    const when = silent ? `last heard ${Math.round(t.silentHours)} h ago`
      : t.lastTime.slice(0, 10) === asOfDay ? `at ${new Date(t.lastTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
      : `at ${fmtTime(t.lastTime)}`;
    const box = document.createElement("div");
    box.className = `tank ${st.sev}`;
    box.innerHTML = `<div class="tank-head"><div class="tank-name"><span>${esc(t.tank)}</span><b>${esc(name)}</b></div>${pill(st.sev, st.label)}</div>
      <div class="tank-level"><b>${Number.isFinite(t.level) ? `${t.level}<small>%</small>` : "–"}</b><span>${when}</span></div>`;
    const chart = document.createElement("div");
    chart.className = "chart-box";
    box.appendChild(chart);
    return box;
  }));
  // Charts are drawn at the size they show, so their text stays readable on a phone.
  [...grid.children].forEach((box, i) => tankChart(box.lastChild, tanks[i], names[tanks[i].pasture] ?? tanks[i].pasture, from, asOf));
}

function tankChart(box, t, name, from, asOf) {
  const W = box.clientWidth || 240, H = 96, m = { l: 24, r: 6, t: 6, b: 20 };
  const x = (tm) => m.l + ((new Date(tm) - from) / (asOf - from)) * (W - m.l - m.r);
  const y = (v) => m.t + (1 - v / 100) * (H - m.t - m.b);
  const silent = t.silentHours >= RULES.sensorSilentHours;
  // A level that isn't a number (a fault code, a blank) is left off the line rather than drawn as 0%.
  const recent = t.rows.filter((r) => new Date(r.time) >= from), rows = recent.filter((r) => Number.isFinite(r.level_pct));
  const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img",
    "aria-label": `Tank ${t.tank} ${name}, percent full over the last 7 days, ${Number.isFinite(t.level) ? `last reading ${t.level}%` : "no usable reading"}` });
  svg("rect", { x: m.l, y: y(RULES.waterLow), width: W - m.l - m.r, height: y(RULES.waterCritical) - y(RULES.waterLow), class: "zone-warn" }, s);
  svg("rect", { x: m.l, y: y(RULES.waterCritical), width: W - m.l - m.r, height: y(0) - y(RULES.waterCritical), class: "zone-crit" }, s);
  for (const v of [0, 50, 100]) {
    svg("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: v ? "var(--grid)" : "var(--axis)" }, s);
    text(s, m.l - 5, y(v) + 4, v, { "text-anchor": "end", class: "num" });
  }
  for (const v of [RULES.waterLow, RULES.waterCritical]) {
    svg("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: v === RULES.waterLow ? "var(--warning)" : "var(--critical)", "stroke-opacity": 0.8, "stroke-dasharray": "3 3" }, s);
  }
  text(s, m.l, H - 4, fmtDate(new Date(from).toISOString()));
  text(s, W - m.r, H - 4, fmtDate(asOf.toISOString()), { "text-anchor": "end" });
  if (!rows.length) {
    // the longest message that fits; on a narrow chart two short lines, both above the 40% line
    const room = W - m.l - m.r - 8, cx = (m.l + W - m.r) / 2, o = { "text-anchor": "middle", class: "lbl" };
    const lines = recent.length ? ["No usable readings in the last 7 days", "No usable readings this week", "No usable", "readings"]
      : ["No readings in the last 7 days", "No readings this week", "No readings", "this week"];
    const msg = lines.slice(0, 2).find((l) => measure(l, 12.5) <= room);
    if (msg) text(s, cx, y(50) + 4, msg, o);
    else { text(s, cx, y(50) - 11, lines[2], o); text(s, cx, y(50) + 4, lines[3], o); }
    box.replaceChildren(s);
    return;
  }
  // Break the line where readings stop for more than two intervals, so an outage isn't drawn as a straight line.
  const runs = [[rows[0]]];
  for (let k = 1; k < rows.length; k++) {
    if (new Date(rows[k].time) - new Date(rows[k - 1].time) > 12 * 36e5) runs.push([]);
    runs.at(-1).push(rows[k]);
  }
  for (const run of runs) {
    const line = run.map((r, k) => `${k ? "L" : "M"}${x(r.time).toFixed(1)},${y(r.level_pct).toFixed(1)}`).join("");
    if (run.length > 1) svg("path", { d: `${line}L${x(run.at(-1).time).toFixed(1)},${y(0)}L${x(run[0].time).toFixed(1)},${y(0)}Z`, fill: "url(#g-area)" }, s);
    svg("path", { d: run.length > 1 ? line : `${line}h0.1`, fill: "none", stroke: "var(--s1)", "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, s);
  }
  const last = rows.at(-1);
  if (silent) {
    const x0 = x(last.time);
    svg("rect", { x: x0, y: m.t, width: Math.max(0, W - m.r - x0), height: y(0) - m.t, fill: "var(--wash)" }, s);
    svg("line", { x1: x0, x2: x0, y1: m.t, y2: y(0), stroke: "var(--axis)", "stroke-dasharray": "2 3" }, s);
    if (W - m.r - x0 > measure("no signal", 12.5) + 16) text(s, (x0 + W - m.r) / 2, m.t + 16, "no signal", { "text-anchor": "middle", class: "lbl" });
  }
  svg("circle", { cx: x(last.time), cy: y(last.level_pct), r: 4, fill: silent ? "var(--surface-2)" : "var(--s1)", stroke: silent ? "var(--s1)" : "var(--surface-2)", "stroke-width": 2 }, s);
  // crosshair
  const cross = svg("g", { visibility: "hidden" }, s);
  const vline = svg("line", { y1: m.t, y2: y(0), stroke: "var(--ink-2)", "stroke-width": 1 }, cross);
  const vdot = svg("circle", { r: 4.5, fill: "var(--s1)", stroke: "var(--ink)", "stroke-width": 2 }, cross);
  const pts = rows.map((r) => ({ x: x(r.time), y: y(r.level_pct), row: 0,
    html: `<span class="tv">${esc(r.level_pct)}%</span><span>${esc(t.tank)} ${esc(name)} · ${fmtTime(r.time)}</span>` }));
  explore(s, pts, (px) => (px < m.l - 8 || px > W - m.r + 8 ? -1 : pts.reduce((a, p, k) => (Math.abs(p.x - px) < Math.abs(pts[a].x - px) ? k : a), 0)),
    (j) => {
      cross.setAttribute("visibility", j < 0 ? "hidden" : "visible");
      if (j < 0) return;
      for (const [k, v] of [["x1", pts[j].x], ["x2", pts[j].x]]) vline.setAttribute(k, v);
      vdot.setAttribute("cx", pts[j].x); vdot.setAttribute("cy", pts[j].y);
    }, pts.length - 1);
  box.replaceChildren(s);
}

// ---------------------------------------------------------------- grazing
function grazingTimeline(d, exc) {
  const box = $("grazing");
  if (!d.moves.length) {
    box.innerHTML = '<p class="empty-note">No pasture moves recorded yet.</p>';
    $("nowGrazing").innerHTML = "";
    return;
  }
  const asOf = d.meta[0].as_of.slice(0, 10), start = d.moves.map((m) => m.in_date).sort()[0];
  const names = Object.fromEntries(d.pastures.map((p) => [p.pasture_id, p]));
  const groups = d.groups.map((g) => g.group);
  const current = Object.fromEntries(grazingStatus(d.moves, d.pastures, d.meta[0].as_of).map((g) => [g.group, g]));
  // A pasture without a number of planned days has no move date to draw.
  const planEnd = (c) => (Number.isFinite(c.planned) ? addDays(c.inDate, c.planned) : null);
  const end = [asOf, ...Object.values(current).map(planEnd).filter(Boolean)].sort().at(-1);
  const W = box.clientWidth || 600, rowH = 50, barH = 26;
  // Group names get up to 30% of the width; longer ones are shortened with an ellipsis (the tooltip has them in full).
  const m = { l: Math.min(Math.ceil(Math.max(0, ...groups.map((g) => measure(g, 13, 600)))) + 14, Math.round(W * 0.3)), r: 8, t: 22, b: 24 };
  const H = m.t + m.b + groups.length * rowH;
  const span = Math.max(1, (new Date(end) - new Date(start)) / DAY);
  const x = (dt) => m.l + ((new Date(dt) - new Date(start)) / DAY / span) * (W - m.l - m.r);
  const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": "Grazing rotation by group, this season" });
  // first of each month in range, in UTC like the dates themselves
  for (let mo = new Date(start.slice(0, 8) + "01"); mo <= new Date(end); mo.setUTCMonth(mo.getUTCMonth() + 1)) {
    const iso = mo.toISOString().slice(0, 10);
    if (iso < start) continue;
    svg("line", { x1: x(iso), x2: x(iso), y1: m.t - 4, y2: H - m.b, stroke: "var(--grid)" }, s);
    const lab = mo.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
    if (x(iso) + 4 + measure(lab, 11.5) <= W) text(s, x(iso) + 4, H - 6, lab);
  }
  const pts = [], marks = [];
  groups.forEach((g, i) => {
    const y = m.t + i * rowH + (rowH - barH) / 2;
    const head = d.groups.find((x) => x.group === g).head;
    text(s, 0, y + barH / 2 - 1, fitText(g, m.l - 8, 13, 600), { class: "hd" });
    text(s, 0, y + barH / 2 + 13, fitText(`${head.toLocaleString()} head`, m.l - 8, 11.5, 400));
    const c = current[g];
    for (const mv of d.moves.filter((mv) => mv.group === g)) {
      const cur = !mv.out_date, e = mv.out_date || asOf, p = names[mv.pasture_id] ?? { name: mv.pasture_id, planned_graze_days: "?" };
      const x0 = x(mv.in_date) + 1, x1 = x(e) - 1, w = Math.max(2, x1 - x0);
      const len = Math.round((new Date(e) - new Date(mv.in_date)) / DAY);
      // value first, like the other charts' tooltips; a blank plan says nothing rather than "plan  days"
      const pg = p.planned_graze_days, plan = Number.isFinite(pg) ? ` · plan ${pg} days` : pg === "" ? "" : ` · plan ${esc(pg)}`;
      let html = `<span class="tv">${len} day${len === 1 ? "" : "s"}</span><span class="tl">${esc(g)} in ${esc(mv.pasture_id)} ${esc(p.name)}</span>${fmtDate(mv.in_date)} to ${cur ? "now" : fmtDate(e)}${plan}`;
      if (cur && c) {
        const pe = planEnd(c), over = pe ? c.days - c.planned : 0, xp = pe ? x(pe) : x1;
        svg("rect", { x: x0, y, width: w, height: barH, rx: 4, fill: "var(--s1)" }, s);
        if (pe && over > 0) {
          svg("rect", { x: xp, y, width: Math.max(2, x1 - xp), height: barH, rx: 4, fill: "var(--serious)" }, s);
          svg("rect", { x: xp, y, width: Math.min(4, x1 - xp), height: barH, fill: "var(--serious)" }, s);
          svg("line", { x1: xp, x2: xp, y1: y - 4, y2: y + barH + 4, stroke: "var(--ink)", "stroke-width": 2 }, s);
          // the status colour ships with its icon and its words
          const lab = `${over} day${over === 1 ? "" : "s"} past plan`, lw = measure(lab, 11.5, 600), tx = x1 - lw - 15;
          text(s, x1, y - 6, lab, { "text-anchor": "end", class: "ink halo", style: "font-size:11.5px" });
          svg("path", { d: `M${tx + 5},${y - 15} l5,9 h-10 z`, fill: "var(--serious)", stroke: "var(--surface)", "stroke-width": 2, "paint-order": "stroke", "stroke-linejoin": "round" }, s);
          html += `<span class="tf">${ICON.serious}${over} day${over === 1 ? "" : "s"} past the planned move</span>`;
        } else if (pe) {
          // days left: a wash of the series hue, closed by a tick on the planned move date
          svg("rect", { x: x1 + 2, y, width: Math.max(0, xp - x1 - 2), height: barH, fill: "var(--s1-soft)" }, s);
          svg("line", { x1: xp, x2: xp, y1: y - 4, y2: y + barH + 4, stroke: "var(--ink-2)", "stroke-width": 2 }, s);
          html += `<br>Planned move ${fmtDate(pe)}${over === 0 ? " (today)" : `, ${-over} day${over === -1 ? "" : "s"} left`}`;
        } else html += "<br>No planned move date";
        const lab = `${mv.pasture_id} ${p.name}`;
        const fit = measure(lab, 12, 600) + 14 < Math.min(x1, over > 0 ? xp : x1) - x0 ? lab : measure(mv.pasture_id, 12, 600) + 12 < w ? mv.pasture_id : "";
        if (fit) text(s, x0 + 7, y + barH / 2 + 4, fit, { class: "on" });
      } else {
        // earlier stays: the muted step of the series hue (3.3:1 on the card, so no outline), thinner than the current stay
        svg("rect", { x: x0, y: y + 3, width: w, height: barH - 6, rx: 4, fill: "var(--s1-mute)" }, s);
        if (measure(mv.pasture_id, 12) + 10 < w) text(s, x0 + 6, y + barH / 2 + 4, mv.pasture_id, { class: "lbl", style: "font-size:12px;fill:var(--ink)" });
      }
      const inset = cur && c ? 0 : 3;
      const ring = svg("rect", { x: x0 - 2, y: y + inset - 2, width: w + 4, height: barH - 2 * inset + 4, rx: 6, fill: "none", stroke: "var(--ink)", "stroke-width": 2, visibility: "hidden" }, s);
      marks.push(ring);
      pts.push({ x: x0 + w / 2, y, row: i, html, x0, x1, y0: y });
    }
  });
  // today
  const xt = x(asOf);
  svg("line", { x1: xt, x2: xt, y1: m.t - 8, y2: H - m.b, stroke: "var(--ink-2)", "stroke-width": 1.5 }, s);
  text(s, xt, m.t - 10, "Today", { "text-anchor": xt > W - 30 ? "end" : "middle", class: "ink", style: "font-size:11.5px" });
  $("nowGrazing").innerHTML = groups.filter((g) => current[g]).map((g) => {
    const c = current[g], pe = planEnd(c), e = exc.find((e) => e.area === "Grazing" && e.subject === `${g} in ${c.pasture}`);
    const left = c.planned - c.days;
    const when = !pe ? "no planned move date" : left > 0 ? `move by ${fmtDate(pe)}` : left === 0 ? "move due today" : `move was due ${fmtDate(pe)}`;
    return `<li><span class="who"><b>${esc(g)}</b> in ${esc(c.pastureId)} ${esc(c.pasture)}<span>Day ${c.days}${pe ? ` of ${esc(c.planned)}` : ""}, ${when}</span></span>` +
      (e ? pill(e.severity, e.severity === "serious" ? "Past plan" : "Move soon") : pe ? pill("good", "On plan") : pill("unknown", "No plan")) + "</li>";
  }).join("");
  explore(s, pts, (px, py) => {
    const row = Math.floor((py - m.t) / rowH);
    let best = -1, bd = 1e9;
    pts.forEach((p, k) => { if (p.row !== row) return; const dd = px < p.x0 ? p.x0 - px : px > p.x1 ? px - p.x1 : 0; if (dd < bd) { bd = dd; best = k; } });
    return bd <= 12 ? best : -1;
  }, (j) => marks.forEach((r, k) => r.setAttribute("visibility", k === j ? "visible" : "hidden")), pts.findLastIndex((p) => p.row === 0));
  box.replaceChildren(s);
}

// ---------------------------------------------------------------- gain
// Lay dots out as a beeswarm: each dot takes the free spot nearest the row's centre line.
function swarm(xs, r, maxOff) {
  const placed = [], out = new Array(xs.length), dmin = 2 * r + 2;   // a 2px surface gap between dots
  for (const [px, i] of xs.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0])) {
    const near = placed.filter((p) => px - p.x < dmin);
    const cands = [0];
    for (const p of near) { const dy = Math.sqrt(dmin * dmin - (px - p.x) ** 2); cands.push(p.y + dy, p.y - dy); }
    cands.sort((a, b) => Math.abs(a) - Math.abs(b));
    const free = (c) => near.every((p) => (px - p.x) ** 2 + (c - p.y) ** 2 >= dmin * dmin - 0.01);
    // past the soft cap, take the nearest free spot further out rather than one that overlaps another dot
    const y = cands.find((c) => Math.abs(c) <= maxOff && free(c)) ?? cands.find(free) ?? Math.max(0, ...near.map((p) => p.y)) + dmin;
    placed.push({ x: px, y });
    while (placed.length && px - placed[0].x >= dmin) placed.shift();
    out[i] = y;
  }
  return out;
}

function gainStrip(d) {
  const box = $("gain");
  const gs = gainStatus(d.weights, d.groups).filter((g) => g.target > 0);
  if (!gs.length) {
    box.innerHTML = `<p class="empty-note">${gainNote(d)}</p>`;
    return;
  }
  const W = box.clientWidth || 600, m = { l: 6, r: 14, t: 4, b: 40 }, r = W < 460 ? 3.5 : 4;
  // only animals with a gain are drawn; the group's line says how many weren't
  const all = gs.flatMap((g) => g.animals.filter(readable).map((a) => a.adg));
  const lo = Math.min(0, Math.floor(Math.min(...all) * 2) / 2), hi = Math.ceil(Math.max(...all, ...gs.map((g) => g.target)) * 2) / 2;
  const x = (v) => m.l + ((v - lo) / (hi - lo)) * (W - m.l - m.r);
  const layouts = gs.map((g) => {
    const shown = g.animals.filter(readable);
    const offs = swarm(shown.map((a) => x(a.adg)), r, W < 460 ? 104 : 72);
    const half = Math.max(22, ...offs.map(Math.abs)) + r + 4;
    return { g, shown, offs, half };
  });
  const headH = 48;
  const H = m.t + m.b + layouts.reduce((s, L) => s + headH + 2 * L.half + 22, 0);
  const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": "Average daily gain per animal since the last weigh-in, by group" });
  // Half steps only when they leave room: the first label is start-anchored, and a negative one ("-0.5") is ~25px wide.
  const tickStep = (hi - lo) / 0.5 > 8 || (W - m.l - m.r) / ((hi - lo) / 0.5) < (lo < 0 ? 46 : 34) ? 1 : 0.5;
  for (let v = Math.ceil(lo / tickStep - 1e-9) * tickStep; v <= hi + 1e-9; v += tickStep) {
    const v0 = Math.abs(v) < 1e-9 ? 0 : v;
    svg("line", { x1: x(v), x2: x(v), y1: m.t, y2: H - m.b, stroke: v0 === 0 ? "var(--axis)" : "var(--grid)" }, s);
    text(s, x(v), H - m.b + 16, v0.toFixed(1), { "text-anchor": Math.abs(v - lo) < 1e-9 ? "start" : v >= hi - 1e-9 ? "end" : "middle", class: "num" });
  }
  text(s, m.l, H - 4, "Average daily gain, lbs per day");
  const pts = [], dots = [];
  const ring = svg("circle", { r: r + 3, fill: "none", stroke: "var(--ink)", "stroke-width": 2, visibility: "hidden" });
  const badgeLab = `Under ${pct(RULES.adgSerious)}% of target`, badgeW = measure(badgeLab, 11.5, 600) + 26;
  let top = m.t;
  layouts.forEach(({ g, shown, offs, half }, gi) => {
    const groupLow = g.adg < g.target * RULES.adgSerious;
    const cy = top + headH + half;
    // a long name gives way to the badge, not the other way round
    const name = fitText(g.group, W - m.r - x(lo) - (groupLow ? badgeW + 10 : 0), 13, 600);
    text(s, x(lo), top + 14, name, { class: "hd halo" });
    const line = Number.isFinite(g.adg) ? `average ${g.adg.toFixed(2)} vs ${g.target.toFixed(1)} target` : `no average, ${unreadable(g)}`;
    text(s, x(lo), top + 30, fitText(`${g.head} weighed · ${line}`, W - m.r - x(lo), 11.5), { class: "num halo" });
    if (groupLow) {
      const bx = x(lo) + measure(name, 13, 600) + 10;
      svg("rect", { x: bx, y: top + 1, width: badgeW, height: 18, rx: 9, fill: "var(--serious)", "fill-opacity": 0.14, stroke: "var(--serious)", "stroke-opacity": 0.5 }, s);
      svg("path", { d: `M${bx + 11},${top + 5} l5,9 h-10 z`, fill: "var(--serious)" }, s);
      text(s, bx + 20, top + 14, badgeLab, { class: "ink", style: "font-size:11.5px" });
    }
    // 80% and 50% of target; when the two lines sit close, one label names both
    const refs = [RULES.animalShare, RULES.adgSerious].map((share) => ({ x: x(g.target * share), lab: `${pct(share)}%` })).sort((a, b) => a.x - b.x);
    for (const rf of refs) svg("line", { x1: rf.x, x2: rf.x, y1: cy - half + 2, y2: cy + half - 2, stroke: "var(--muted)", "stroke-opacity": 0.7, "stroke-dasharray": "3 3" }, s);
    const [ra, rb] = refs, ly = cy + half + 11;
    if (rb.x - ra.x < (measure(ra.lab, 11.5) + measure(rb.lab, 11.5)) / 2 + 6) text(s, (ra.x + rb.x) / 2, ly, `${ra.lab} · ${rb.lab}`, { "text-anchor": "middle", class: "halo" });
    else for (const rf of refs) text(s, rf.x, ly, rf.lab, { "text-anchor": "middle", class: "halo" });
    // target first: each dot's surface ring then cuts it, so no dot is drawn half-hidden under the line
    const xt = x(g.target);
    svg("line", { x1: xt, x2: xt, y1: cy - half - 2, y2: cy + half + 2, stroke: "var(--ink)", "stroke-width": 2, "stroke-linecap": "round" }, s);
    const order = shown.map((a, k) => k).sort((a, b) => shown[a].adg - shown[b].adg);
    for (const k of order) {
      const a = shown[k], flagged = !groupLow && a.adg < g.target * RULES.animalShare;
      const cx = x(a.adg), py = cy + offs[k];
      const c = svg("circle", { cx, cy: py, r, fill: flagged ? "var(--warning)" : "var(--s1)", stroke: "var(--surface)", "stroke-width": 4, "paint-order": "stroke" }, s);
      dots.push(c);
      pts.push({ x: cx, y: py, row: gi, html: `<span class="tv">${a.adg.toFixed(2)} lbs/day</span><span class="tl">${esc(a.tag)} · ${esc(g.group)}</span>${fmtDate(a.from)} to ${fmtDate(a.to)}, now ${esc(a.weight.toLocaleString())} lbs${flagged ? `<span class="tf">${ICON.warning}Flagged: under ${pct(RULES.animalShare)}% of target</span>` : ""}` });
    }
    const tl = `target ${g.target.toFixed(1)}`, tw = measure(tl, 11.5, 600);
    text(s, xt + tw + 6 > W ? xt - 5 : xt + 5, cy - half - 2, tl, { class: "ink halo", style: "font-size:11.5px", "text-anchor": xt + tw + 6 > W ? "end" : "start" });
    top += headH + 2 * half + 22;
  });
  s.appendChild(ring);
  explore(s, pts, (px, py) => {
    let best = -1, bd = 24 * 24;
    pts.forEach((p, k) => { const dd = (p.x - px) ** 2 + (p.y - py) ** 2; if (dd < bd) { bd = dd; best = k; } });
    return best;
  }, (j) => {
    ring.setAttribute("visibility", j < 0 ? "hidden" : "visible");
    if (j >= 0) { ring.setAttribute("cx", pts[j].x); ring.setAttribute("cy", pts[j].y); }
  });
  box.replaceChildren(s);
  // groups with no gain target aren't judged on gain; say so rather than leave them out silently
  const skipped = d.groups.filter((g) => !(g.target_adg_lbs > 0)).map((g) => esc(g.group));
  if (skipped.length) box.insertAdjacentHTML("beforeend", `<p class="hint">Not shown: ${skipped.join(", ")}, with no gain target set.</p>`);
}

// ---------------------------------------------------------------- budget: one table, with the over/under bar in a column
function budget(d, exc) {
  // Colour does one job here: it marks the rows a budget rule flags, in that rule's status colour and beside the same
  // pill the list uses. The side of the zero line and the sign already say over or under.
  const sevOf = (cat) => exc.find((e) => e.area === "Budget" && e.subject === cat)?.severity ?? "";
  // A category with a $0 budget has no percentage (Infinity or NaN): keep it off the scale and list it last.
  const ok = (r) => Number.isFinite(r.pct);
  const rows = budgetStatus(d.budget).sort((a, b) => ok(b) - ok(a) || b.pct - a.pct || 0);
  const lim = Math.max(0.25, Math.ceil(Math.max(0, ...rows.filter(ok).map((r) => Math.abs(r.pct))) * 20) / 20);
  const pos = (v) => ((v + lim) / (2 * lim)) * 100;
  const tb = rows.reduce((s, r) => s + r.budget, 0), ta = rows.reduce((s, r) => s + r.actual, 0);
  const bar = (r, sev = "") => {
    if (!ok(r)) return `<div class="track"><span class="val nb">no budget</span></div>`;
    const p = pos(r.pct), z = pos(0), v = Math.round(r.pct * 100);
    return `<div class="track" data-p="${p}" data-z="${z}" data-dir="${r.pct > 0 ? 1 : -1}" data-sev="${sev}">` +
      (r.pct ? `<span class="bar ${r.pct > 0 ? "over" : "under"} ${sev}" style="left:${Math.min(p, z)}%;width:${Math.abs(p - z)}%"></span>` : "") +
      `<span class="val">${signed(v, Math.abs(v) + "%")}</span></div>`;
  };
  $("budgetTable").innerHTML =
    `<thead><tr><th>Category</th><th class="c-bar">Over or under<div class="scale"><span>${signed(-lim, pct(lim) + "%")}</span><span>0</span><span>${signed(lim, pct(lim) + "%")}</span></div></th>` +
    `<th class="num c-budget">Budget</th><th class="num c-actual">Actual</th><th class="num">Difference</th></tr></thead><tbody>` +
    rows.map((r) => {
      const sev = sevOf(r.category);
      return `<tr><td>${esc(r.category)}${sev ? ` ${pill(sev, cap(sev))}` : ""}<span class="cat-sub">${money(r.actual)} of ${money(r.budget)}</span></td><td class="c-bar">${bar(r, sev)}</td>` +
        `<td class="num c-budget">${money(r.budget)}</td><td class="num c-actual">${money(r.actual)}</td><td class="num">${signed(r.variance, money(Math.abs(r.variance)))}</td></tr>`;
    }).join("") +
    `</tbody><tfoot><tr><td>Season total<span class="cat-sub">${money(ta)} of ${money(tb)}</span></td><td class="c-bar">${bar({ pct: (ta - tb) / tb })}</td>` +
    `<td class="num c-budget">${money(tb)}</td><td class="num c-actual">${money(ta)}</td><td class="num">${signed(ta - tb, money(Math.abs(ta - tb)))}</td></tr></tfoot>`;
  // the thresholds come from RULES, so the key can't disagree with the rules table
  $("budgetLegend").innerHTML = `<span>${ICON.serious}Serious: more than ${pct(RULES.budgetSerious)}% over</span>` +
    `<span>${ICON.warning}Warning: ${pct(RULES.budgetWarn)}–${pct(RULES.budgetSerious)}% over</span>` +
    `<span><i class="key box" style="background:var(--s1-mute)"></i>Not flagged</span>`;
  placeBudgetLabels();
}

// Each % label goes past the end of its bar if there's room, else inside the bar, else across the zero line.
function placeBudgetLabels() {
  for (const t of document.querySelectorAll("#budgetTable .track[data-p]")) {
    const val = t.querySelector(".val"), W = t.clientWidth, lw = val.offsetWidth, gap = 6;
    const p = (t.dataset.p / 100) * W, z = (t.dataset.z / 100) * W, over = t.dataset.dir === "1";
    let left = over ? p + gap : p - gap - lw, color = "";
    if (left < 0 || left + lw > W) {
      // inside the bar: dark ink on a status colour, light ink on the muted green
      if (Math.abs(p - z) >= lw + 2 * gap) { left = over ? p - gap - lw : p + gap; color = t.dataset.sev ? "var(--on-status)" : "var(--ink)"; }
      // across the zero line: it may use the cell's padding, but never leaves the cell
      else { const cs = getComputedStyle(t.parentElement); left = over ? Math.max(-parseFloat(cs.paddingLeft), z - gap - lw) : Math.min(W + parseFloat(cs.paddingRight) - lw, z + gap); }
    }
    val.style.left = `${Math.round(left)}px`;
    val.style.color = color;
  }
}

function rules() {
  const R = RULES;
  const list = [
    ["Water", "critical", `Level under ${R.waterCritical}%, or a drop of ${R.waterDropPts}+ points in 24 hours`],
    ["Water", "warning", `Level under ${R.waterLow}%`],
    ["Water", "serious", `No reading for ${R.sensorSilentHours} hours or more`],
    ["Grazing", "serious", "A group is past its pasture's planned graze days"],
    ["Grazing", "warning", `A planned move is ${R.graceDays} days away or less`],
    ["Gain", "serious", `A group's average daily gain is under ${pct(R.adgSerious)}% of target since the last weigh-in`],
    ["Gain", "warning", `Animals under ${pct(R.animalShare)}% of target (skipped when the whole group is already flagged)`],
    ["Health", "serious", "An open health task is past its due date"],
    ["Health", "warning", `An open health task is due within ${R.dueSoonDays} days`],
    ["Budget", "serious", `A category is more than ${pct(R.budgetSerious)}% over budget, season to date`],
    ["Budget", "warning", `A category is ${pct(R.budgetWarn)}-${pct(R.budgetSerious)}% over budget`],
  ];
  // One block per area, worst first inside it; on wide screens the area is printed once per block (screen readers still
  // hear it on every row).
  const rank = (s) => SEVS.indexOf(s);
  const rows = [...new Set(list.map(([a]) => a))].flatMap((a) => list.filter((r) => r[0] === a).sort((x, y) => rank(x[1]) - rank(y[1])));
  $("rules").innerHTML = "<thead><tr><th>Area</th><th>Severity</th><th>Flags when</th></tr></thead><tbody>" +
    rows.map(([a, s, w], i) => {
      const first = rows[i - 1]?.[0] !== a, last = rows[i + 1]?.[0] !== a;
      return `<tr class="${[first && "grp", last && "end"].filter(Boolean).join(" ")}"><td class="${first ? "" : "rep"}"><span>${a}</span></td><td>${badge(s)}</td><td>${w}</td></tr>`;
    }).join("") + "</tbody>";
}

// ---------------------------------------------------------------- start
let d, exc, loaded = false;
try {
  d = Object.fromEntries(await Promise.all(FILES.map(async (f) => {
    const res = await fetch(`data/${f}.csv`);
    if (!res.ok) throw new Error(`data/${f}.csv: HTTP ${res.status}`);   // a missing file is a failed load, not an empty one
    return [f, parseCSV(await res.text())];
  })));
  if (!d.meta[0]?.as_of) throw new Error("data/meta.csv has no as_of");
  loaded = true;
  exc = findExceptions(d);
} catch (err) {
  // Say so plainly instead of leaving a page that looks like it is still loading. Trying again helps a failed load,
  // not data the rules can't work through.
  document.body.classList.add("failed");
  $("summary").innerHTML = `<div class="load-error"><p class="hero-label">${ICON.serious}The report didn't load</p>` +
    (loaded ? `<p class="note">The data files loaded, but the report couldn't be worked out from them. A file may have a row in a form the report can't handle.</p></div>`
      : `<p class="note">The data files couldn't be loaded or read. Check the connection, then try again.</p><button class="btn" type="button" id="retry">Try again</button></div>`);
  $("retry")?.addEventListener("click", () => location.reload());
  $("stamp").innerHTML = "<i></i>Data not loaded";
  throw err;
}
const asOf = new Date(d.meta[0].as_of);
$("stamp").innerHTML = `<i></i>Data as of ${asOf.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`;
$("asof").innerHTML = [
  ["Example Ranch", "(fictional)"],
  [d.pastures.reduce((s, p) => s + p.acres, 0).toLocaleString(), "acres"],
  [d.pastures.length, "pastures"],
  ["As of", asOf.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })],
].map(([a, b]) => `<li><b>${esc(a)}</b> ${esc(b)}</li>`).join("");
// One section failing (odd data) shouldn't take the rest of the page with it.
[ruleCopy, () => summary(exc), () => tiles(d, exc), () => exceptionsTable(exc), () => budget(d, exc), rules].forEach(safe);
const charts = () => [() => waterMultiples(d, exc), () => grazingTimeline(d, exc), () => gainStrip(d)].forEach(safe);
charts();
// Keep a focused nav link clear of the phone nav's fade. Only the nav scrolls, sideways: scrollIntoView would also scroll
// the page, because the sticky bar sits inside html's scroll-padding-top. 56 matches .nav a's scroll-margin-inline.
const nav = document.querySelector(".nav");
nav.addEventListener("focusin", (e) => {
  const nr = nav.getBoundingClientRect(), r = e.target.getBoundingClientRect(), pad = 56;
  if (r.left - pad < nr.left) nav.scrollLeft -= nr.left - (r.left - pad);
  else if (r.right + pad > nr.right) nav.scrollLeft += r.right + pad - nr.right;
});
const main = document.querySelector("main");
let width = main.clientWidth, queued = 0, wasShown = null;
// A new window size fires a scroll event before the observer below runs, and follow() hides a reading the new layout
// pushed off screen. The window's resize event comes first, so note there whether a keyboard reading was on screen;
// the note is dropped after two frames if no redraw picked it up.
addEventListener("resize", () => {
  if (wasShown !== null) return;
  wasShown = !!tipOwner && tipOwner === document.activeElement && !tip.hidden;
  requestAnimationFrame(() => requestAnimationFrame(() => { if (!queued) wasShown = null; }));
});
new ResizeObserver(() => {
  const w = main.clientWidth;
  if (w === width || queued) return;
  queued = requestAnimationFrame(() => {
    queued = 0; width = w;
    // Redrawing replaces the charts: put keyboard focus back on the same chart and reading, in the state it was in.
    const all = () => [...document.querySelectorAll("svg.chart")];
    const k = all().indexOf(document.activeElement), j = k >= 0 ? document.activeElement._index() : -1;
    const owned = k >= 0 && tipOwner === document.activeElement;   // false after Escape or a pointer elsewhere
    const shown = owned && (wasShown ?? !tip.hidden);              // its reading was on screen
    wasShown = null;
    hideTip(); charts(); safe(placeBudgetLabels);
    const s = k >= 0 && all()[k];
    if (s) {
      s.focus({ preventScroll: true });
      // a reading that was on screen stays on screen, however far the new layout moved its chart
      if (shown && s.matches(":focus-visible")) s.scrollIntoView({ block: "nearest", behavior: "instant" });
      if (j >= 0) s._place?.(j);
      owned ? follow() : s._dismiss?.();
    }
  });
}).observe(main);

// Light the nav link for the section in view, and keep it in sight in the phone's scrolling nav.
{
  const links = [...nav.querySelectorAll("a")], targets = links.map((a) => document.getElementById(a.hash.slice(1)));
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  let cur = null, q = 0;
  const spy = () => {
    q = 0;
    const line = document.querySelector(".topbar").offsetHeight + innerHeight * 0.3;
    let k = -1, kt = -Infinity;
    targets.forEach((t, n) => { const top = t?.getBoundingClientRect().top; if (top <= line && top > kt + 1) { k = n; kt = top; } });
    if (k >= 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 2) k = targets.length - 1;
    const a = links[k] ?? null;
    if (a === cur) return;
    cur?.removeAttribute("aria-current");
    cur = a;
    if (!a) return;
    a.setAttribute("aria-current", "location");
    const nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect();
    if (ar.left < nr.left || ar.right > nr.right - 40) nav.scrollTo({ left: nav.scrollLeft + ar.left - nr.left - 12, behavior: calm.matches ? "instant" : "smooth" });
  };
  addEventListener("scroll", () => { q ||= requestAnimationFrame(spy); }, { passive: true });
  spy();
}
// The rules are reference: open on wide screens, one tap away on a phone, and opened by any link that points at them.
{
  const more = $("rulesMore"), wide = matchMedia("(min-width: 641px)");
  const sync = () => { if (wide.matches) more.open = true; };
  sync(); wide.addEventListener("change", sync);
  document.querySelectorAll('a[href="#rules-sec"]').forEach((a) => a.addEventListener("click", () => { more.open = true; }));
  if (location.hash === "#rules-sec") more.open = true;
}
