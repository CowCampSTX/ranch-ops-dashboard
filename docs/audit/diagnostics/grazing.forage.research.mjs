// Research diagnostic (research-grazing, pass 2): how the committed fictional grazing data looks when judged against
// published Northern/Central Great Plains guidance, instead of only against planned_graze_days.
//
// Run from the repo root:   node docs/audit/diagnostics/grazing.forage.research.mjs
//
// Read-only: imports parseCSV/findExceptions from exceptions.js and reads data/*.csv. Changes no file.
//
// Every threshold below is labelled with its source. None is "the" right number for Example Ranch: the ranch is
// fictional, has no stated location, and the data hold no forage, utilization, stubble or growth-stage observations.
// The point is sensitivity: does the verdict on a re-entry change with region and growth rate?
//
// Sources (fetched 2026-10-16):
//   NDSU R1780 (rev. Oct 2024) The North Dakota Grazing Monitoring Stick — rangeland recovery periods:
//     fast growth (May/June) 45 d western ND / 30 d eastern ND; slow growth (July/August) 65 d western / 45 d eastern.
//   NRCS South Dakota Range Technical Note No. 9, Prescribed Grazing (April 2017), Table 1 — rangeland, paddocks
//     grazed 2+ times, 20-30% temporal utilization (the level it recommends for multiple grazings):
//     West River 40 d fast / 60 d slow; East River 35 d fast / 55 d slow. Once-over: >= 45 consecutive days rest.
//   NDSU R1810 (reviewed Apr 2024) carrying capacity — AUE: 1,000 lb cow+calf 1.00, 1,100 lb 1.07, 1,200 lb 1.15,
//     yearling 600-800 lb 0.70; 913 lb air-dry forage per AUM; harvest efficiency 25% for season-long native range.
//   UNL EC127 (2011) Sandhills: common stocking 0.75 AUM/acre (May 15 - Oct 15).
process.env.TZ = "UTC";
import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, findExceptions } = await import(new URL("exceptions.js", ROOT).href);
const load = (f) => parseCSV(readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8"));
const d = Object.fromEntries(["pastures", "moves", "meta", "groups", "weights", "water", "health", "budget"].map((f) => [f, load(f)]));
const asOf = d.meta[0].as_of.slice(0, 10);
const DAY = 864e5;
const diff = (a, b) => Math.round((new Date(b) - new Date(a)) / DAY);
const addDays = (a, n) => new Date(new Date(a).getTime() + n * DAY).toISOString().slice(0, 10);
const P = Object.fromEntries(d.pastures.map((p) => [p.pasture_id, p]));
const head = Object.fromEntries(d.groups.map((g) => [g.group, g.head]));

// ASSUMPTION: growth rate by calendar month of the rest gap's midpoint, following NDSU R1780's month labels
// (May/June fast, July/August slow). September is treated as slow. SD Tech Note 9 defines fast/slow by growth stage
// (pre-boot vs boot), not by month, so this is a stand-in for an observation the data do not contain.
const growth = (iso) => (["05", "06"].includes(iso.slice(5, 7)) ? "fast" : "slow");
const STANDARDS = {
  "data min_rest_days (synthetic)": () => null,
  "NDSU R1780 western ND range": (g) => (g === "fast" ? 45 : 65),
  "NDSU R1780 eastern ND range": (g) => (g === "fast" ? 30 : 45),
  "SD TN9 West River range 20-30%": (g) => (g === "fast" ? 40 : 60),
  "SD TN9 East River range 20-30%": (g) => (g === "fast" ? 35 : 55),
};

console.log(`as_of=${d.meta[0].as_of}  (rest is counted per pasture across ALL groups; open stays run to as_of)`);
console.log("\n--- A. Each re-entry: rest days vs the data's min_rest_days and vs published minimums ---");
const names = Object.keys(STANDARDS);
const short = Object.fromEntries(names.map((n) => [n, 0]));
let reentries = 0;
for (const p of d.pastures) {
  const stays = d.moves.filter((m) => m.pasture_id === p.pasture_id).map((m) => ({ ...m, out: m.out_date || asOf }))
    .sort((a, b) => a.in_date.localeCompare(b.in_date));
  for (let i = 1; i < stays.length; i++) {
    const prev = stays[i - 1], cur = stays[i];
    const rest = diff(prev.out, cur.in_date);
    const mid = rest > 0 ? addDays(prev.out, Math.floor(rest / 2)) : cur.in_date;
    const g = growth(mid);
    reentries++;
    const verdicts = names.map((n) => {
      const min = n.startsWith("data") ? p.min_rest_days : STANDARDS[n](g);
      const bad = rest < min;
      if (bad) short[n]++;
      return `${bad ? "SHORT" : "ok   "}(${min})`;
    });
    console.log(`${p.pasture_id} ${p.name.padEnd(12)} ${prev.group.padEnd(9)} out ${prev.out} -> ${cur.group.padEnd(9)} in ${cur.in_date}` +
      ` rest ${String(rest).padStart(3)} d, gap mid ${mid} (${g})  ${verdicts.join(" ")}`);
  }
}
console.log(`columns: ${names.join(" | ")}`);
console.log(`re-entries: ${reentries}`);
for (const n of names) console.log(`  short under ${n}: ${short[n]} of ${reentries}`);

console.log("\n--- B. Current (open) stays: what the dashboard says vs what the rest record says ---");
const graz = findExceptions(d).filter((e) => e.area === "Grazing");
for (const m of d.moves.filter((x) => !x.out_date)) {
  const p = P[m.pasture_id];
  const before = d.moves.filter((x) => x.pasture_id === m.pasture_id && x !== m && (x.out_date || asOf) <= m.in_date)
    .sort((a, b) => (b.out_date || asOf).localeCompare(a.out_date || asOf))[0];
  const rest = before ? diff(before.out_date, m.in_date) : null;
  const flagged = graz.filter((e) => e.subject.startsWith(`${m.group} in ${p.name}`)).map((e) => `[${e.severity}] ${e.problem}`);
  console.log(`${m.group} in ${p.pasture_id} ${p.name} since ${m.in_date} (day ${diff(m.in_date, asOf)} of ${p.planned_graze_days} planned)`);
  console.log(`   entered after ${rest === null ? "no earlier stay this season" : `${rest} d rest (previous: ${before.group} out ${before.out_date})`}; pasture min_rest_days=${p.min_rest_days}` +
    `${rest !== null && rest < p.min_rest_days ? `  -> ${p.min_rest_days - rest} d SHORT` : ""}`);
  console.log(`   dashboard grazing rows for this stay: ${flagged.length ? flagged.join("; ") : "none"}`);
}

console.log("\n--- C. Forage demand implied by each stay (ASSUMED animal-unit equivalents; no forage data exist) ---");
// ASSUMPTIONS (NDSU R1810 Table 1): Cows = 1,200 lb cow with calf (1.15) — no cow weights in data;
// Heifers = 1,100 lb cow with calf (1.07) — weigh-in means 1,041 -> 1,110 lb; Yearlings = 0.70 (600-800 lb band) —
// weigh-in means 639 -> 847 lb, so 0.70 understates late-season demand. 913 lb forage per AUM => ~30 lb/AU/day.
const AUE = { Cows: 1.15, Heifers: 1.07, Yearlings: 0.70 };
const LB_PER_AU_DAY = 913 / 30.4;
let totAUM = 0;
for (const m of d.moves) {
  const p = P[m.pasture_id];
  const days = diff(m.in_date, m.out_date || asOf);
  const aum = (head[m.group] * AUE[m.group] * days) / 30.4;
  totAUM += aum;
  const lbAc = (aum * 913) / p.acres;
  console.log(`${m.group.padEnd(9)} ${String(head[m.group]).padStart(3)} hd x AUE ${AUE[m.group]} in ${p.pasture_id} ${p.name.padEnd(12)} ${String(days).padStart(2)} d` +
    ` (plan ${String(p.planned_graze_days).padStart(2)}): ${aum.toFixed(0).padStart(3)} AUM = ${(aum / p.acres).toFixed(3)} AUM/ac,` +
    ` intake ~${lbAc.toFixed(0)} lb/ac; at 25% harvest efficiency needs ~${(lbAc / 0.25).toFixed(0)} lb/ac standing`);
}
const acres = d.pastures.reduce((s, p) => s + p.acres, 0);
console.log(`season to as_of: ${totAUM.toFixed(0)} AUM on ${acres} ac = ${(totAUM / acres).toFixed(2)} AUM/ac`);
console.log("context only: UNL EC127 cites 0.75 AUM/ac as a common Sandhills rate; NDSU 1983 SCS figure for western ND native");
console.log("range was 4.07 ac/AUM (0.25 AUM/ac). Neither validates this fictional ranch; carrying capacity is site-specific.");

console.log("\n--- D. Same pasture, same planned_graze_days, different demand (per-stay AUM ratio) ---");
for (const p of d.pastures) {
  const users = [...new Set(d.moves.filter((m) => m.pasture_id === p.pasture_id).map((m) => m.group))];
  if (users.length < 2) continue;
  const per = users.map((g) => [g, (head[g] * AUE[g] * p.planned_graze_days) / 30.4]);
  const hi = Math.max(...per.map((x) => x[1])), lo = Math.min(...per.map((x) => x[1]));
  console.log(`${p.pasture_id} ${p.name}: one planned ${p.planned_graze_days}-d stay = ${per.map(([g, a]) => `${g} ${a.toFixed(0)} AUM`).join(", ")}  (x${(hi / lo).toFixed(1)})`);
}
