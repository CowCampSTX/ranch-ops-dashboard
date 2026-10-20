// Research diagnostic (research-grazing): what the committed data says about rest periods and shared pastures,
// which exceptions.js never checks (pastures.csv carries min_rest_days; no code reads it).
//
// Run from the repo root:   node docs/audit/diagnostics/grazing.rest.research.mjs
//
// Read-only: imports parseCSV from exceptions.js and reads data/*.csv. Changes no file.
// Rest = days between one stay's out_date and the next stay's in_date in the SAME pasture, by ANY group
// (rest is a property of the plants, not of the herd). Open stays (no out_date) are treated as running to as_of.
process.env.TZ = "UTC";
import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, findExceptions } = await import(new URL("exceptions.js", ROOT).href);
const load = (f) => parseCSV(readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8"));
const pastures = load("pastures"), moves = load("moves"), meta = load("meta");
const asOf = meta[0].as_of.slice(0, 10);
const DAY = 864e5;
const d = (a, b) => Math.round((new Date(b) - new Date(a)) / DAY);

console.log(`as_of=${meta[0].as_of}`);
console.log("\n--- 1. Is min_rest_days read anywhere in the shipped JS? ---");
for (const f of ["exceptions.js", "app.js"]) {
  const src = readFileSync(new URL(f, ROOT), "utf8");
  console.log(`${f}: occurrences of "min_rest_days" = ${(src.match(/min_rest_days/g) || []).length}`);
}

console.log("\n--- 2. Rest between stays, per pasture (all groups) ---");
let violations = 0;
for (const p of pastures) {
  const stays = moves.filter((m) => m.pasture_id === p.pasture_id)
    .map((m) => ({ ...m, out: m.out_date || asOf }))
    .sort((a, b) => a.in_date.localeCompare(b.in_date));
  const lines = [];
  for (let i = 1; i < stays.length; i++) {
    const prev = stays[i - 1], cur = stays[i];
    const rest = d(prev.out, cur.in_date);
    const flag = rest < 0 ? "OVERLAP (two groups in at once)" : rest < p.min_rest_days ? `SHORT by ${p.min_rest_days - rest}` : "ok";
    if (flag !== "ok") violations++;
    lines.push(`   ${prev.group} out ${prev.out} -> ${cur.group} in ${cur.in_date}: rest ${rest} d (min ${p.min_rest_days})  ${flag}`);
  }
  console.log(`${p.pasture_id} ${p.name} (${p.acres} ac, plan ${p.planned_graze_days} d, min rest ${p.min_rest_days} d): ${stays.length} stays`);
  lines.forEach((l) => console.log(l));
}
console.log(`total re-entries shorter than min_rest_days or overlapping: ${violations}`);

console.log("\n--- 3. Grazing exceptions the dashboard raises on the same data ---");
const all = { pastures, moves, meta, groups: load("groups"), weights: load("weights"), water: load("water"),
  health: load("health"), budget: load("budget") };
const g = findExceptions(all).filter((e) => e.area === "Grazing");
g.forEach((e) => console.log(`[${e.severity}] ${e.subject} | ${e.problem} | ${e.action}`));
console.log(`grazing exception rows: ${g.length}`);

console.log("\n--- 4. Stocking context the data allows (head x days per acre; no forage or AU weights in data) ---");
const groups = all.groups;
const headOf = Object.fromEntries(groups.map((x) => [x.group, x.head]));
for (const p of pastures) {
  const hd = moves.filter((m) => m.pasture_id === p.pasture_id)
    .reduce((s, m) => s + headOf[m.group] * d(m.in_date, m.out_date || asOf), 0);
  console.log(`${p.pasture_id} ${p.name}: ${hd} head-days on ${p.acres} ac = ${(hd / p.acres).toFixed(1)} head-days/ac (season to as_of)`);
}

console.log("\n--- 5. Closed stays vs the pasture's planned_graze_days (history; the exception rule only looks at open stays) ---");
for (const m of moves.filter((x) => x.out_date)) {
  const p = pastures.find((x) => x.pasture_id === m.pasture_id);
  const len = d(m.in_date, m.out_date);
  if (len !== p.planned_graze_days)
    console.log(`${m.group} (${headOf[m.group]} hd) in ${p.pasture_id} ${p.name} ${m.in_date}..${m.out_date}: ${len} d vs plan ${p.planned_graze_days} d (${len > p.planned_graze_days ? "+" : ""}${len - p.planned_graze_days})`);
}

console.log("\n--- 6. Same planned_graze_days applied to groups of different size (plan is per pasture, not per herd) ---");
for (const p of pastures) {
  const users = [...new Set(moves.filter((m) => m.pasture_id === p.pasture_id).map((m) => `${m.group}(${headOf[m.group]} hd)`))];
  if (users.length > 1) console.log(`${p.pasture_id} ${p.name}: plan ${p.planned_graze_days} d used for ${users.join(", ")}`);
}

console.log("\n--- 7. Days of overlap when two groups share a pasture, and combined head ---");
for (const p of pastures) {
  const st = moves.filter((m) => m.pasture_id === p.pasture_id).map((m) => ({ ...m, out: m.out_date || asOf }));
  for (let i = 0; i < st.length; i++) for (let j = i + 1; j < st.length; j++) {
    const a = st[i], b = st[j];
    if (a.group === b.group) continue;
    const s = a.in_date > b.in_date ? a.in_date : b.in_date, e = a.out < b.out ? a.out : b.out;
    if (d(s, e) > 0) console.log(`${p.pasture_id} ${p.name}: ${a.group} + ${b.group} together ${s}..${e} (${d(s, e)} d), ${headOf[a.group] + headOf[b.group]} head combined`);
  }
}
