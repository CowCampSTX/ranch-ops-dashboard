// Research diagnostic (research-gain): how much of an individual or group ADG reading can come from weighing
// conditions rather than tissue gain, and how published Northern/Central Plains gains sit against the dashboard's
// fixed thresholds. Read-only: imports exceptions.js and data/*.csv from the repo, modifies nothing.
//
// Run: node docs/audit/diagnostics/gain.noise.research.mjs
//
// Every noise level below is an ASSUMPTION used for a sensitivity sweep, anchored loosely to published ranges:
//  - Heitschmidt 1982 (J. Range Manage. 35:717): cow early-morning weights ~2.5% below late-morning weights.
//  - Watson et al. 2013 (J. Anim. Sci. 91:5507): consecutive-day full-fed weights differed -14 to +34 kg.
// Nothing here is a measured property of any real herd.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../..");
const { parseCSV, gainStatus, RULES } = await import(path.join(repo, "exceptions.js"));
const load = (f) => parseCSV(fs.readFileSync(path.join(repo, "data", f), "utf8"));
const weights = load("weights.csv"), groups = load("groups.csv");

// Deterministic PRNG + normal deviate so the output is reproducible.
let seed = 20261015;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
const gauss = () => { let u = 0, v = 0; while (!u) u = rand(); v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

console.log("== 1. What the shipped data and rules produce ==");
for (const g of gainStatus(weights, groups)) {
  const a = g.animals.map((x) => x.adg);
  const sd = Math.sqrt(a.reduce((s, x) => s + (x - g.adg) ** 2, 0) / (a.length - 1));
  const days = (Date.parse(g.to) - Date.parse(g.from)) / 864e5;
  console.log(`${g.group}: head weighed ${g.head}, interval ${g.from}..${g.to} (${days} d), mean ADG ${g.adg.toFixed(2)}, ` +
    `SD ${sd.toFixed(2)}, target ${g.target}, group serious if < ${(g.target * RULES.adgSerious).toFixed(2)}, ` +
    `individuals < ${(g.target * RULES.animalShare).toFixed(2)}: ${a.filter((x) => x < g.target * RULES.animalShare).length}`);
}

console.log("\n== 2. Individual rule: false flags from weighing noise alone (no animal truly below 50% of target) ==");
console.log("Assumed: 150 yearlings, true ADG ~ N(2.0, 0.25) truncated at 1.05, start 711 lb; per-weight noise = k% of BW, independent.");
const N = 150, REPS = 2000;
for (const days of [28, 42, 57, 84]) {
  for (const k of [0.01, 0.02, 0.03]) {
    let flagged = 0;
    for (let r = 0; r < REPS; r++) for (let i = 0; i < N; i++) {
      let t = 2.0 + 0.25 * gauss(); if (t < 1.05) t = 1.05;          // every animal truly >= 52% of target
      const w0 = 711, w1 = w0 + t * days;
      const o0 = w0 * (1 + k * gauss()), o1 = w1 * (1 + k * gauss());
      if ((o1 - o0) / days < 2.0 * RULES.animalShare) flagged++;
    }
    console.log(`interval ${String(days).padStart(2)} d, noise ${(k * 100).toFixed(0)}% BW: mean false individual flags per weigh-in = ${(flagged / REPS).toFixed(1)} of ${N}`);
  }
}

console.log("\n== 3. Group rule: one systematic fill difference between weigh days (e.g. gather time) ==");
for (const days of [28, 57, 84]) for (const bias of [-0.025, -0.015, 0.015]) {
  const w0 = 711, w1 = w0 + 2.0 * days;                               // true group ADG exactly on target
  const adg = (w1 * (1 + bias) - w0) / days;
  console.log(`interval ${String(days).padStart(2)} d, 2nd weigh-in ${(bias * 100).toFixed(1)}% fill shift: reported ADG ${adg.toFixed(2)} ` +
    `(${adg < 2.0 * RULES.adgSerious ? "SERIOUS" : "no flag"}; threshold ${(2.0 * RULES.adgSerious).toFixed(2)})`);
}

console.log("\n== 4. Published gains vs the fixed thresholds (values as reported by the sources; kg converted at 2.2046) ==");
const kg = (x) => +(x * 2.2046).toFixed(2);
const pub = [
  ["Yearlings", 2.0, "Grings 2002 Fort Keogh MT 1993 season-long, 17 Sep-4 Oct period", kg(1.11)],
  ["Yearlings", 2.0, "Grings 2002 Fort Keogh MT 1994 season-long, 15 Jul-8 Sep period", kg(0.59)],
  ["Yearlings", 2.0, "Grings 2002 Fort Keogh MT 1995 season-long, 4 Aug-26 Sep period", kg(0.66)],
  ["Yearlings", 2.0, "Grings 2002 Fort Keogh MT 1994 season-long, full season", kg(1.07)],
  ["Yearlings", 2.0, "Cheng 2022 CPER CO 2014-18 traditional, low end of annual range", kg(0.86)],
  ["Yearlings", 2.0, "Cheng 2022 CPER CO 2014-18 adaptive rotation, low end of annual range", kg(0.74)],
  ["Yearlings", 2.0, "UNL High Plains Ag Lab crested wheatgrass, unsupplemented (BeefWatch 2022)", 1.51],
  ["Heifers", 1.0, "Lansford 2018 Sandhills primiparous cows, breeding season, unsupplemented", -0.15],
  ["Heifers", 1.0, "Lansford 2018 Sandhills primiparous cows, breeding season, supplemented", 0.18],
  ["Heifers", 1.0, "Manske (NDSU DREC) cows on native range, summer, 4.5-mo twice-over", 0.62],
];
for (const [grp, tgt, label, adg] of pub)
  console.log(`${grp.padEnd(9)} ${String(adg.toFixed(2)).padStart(5)} lb/d vs serious < ${(tgt * RULES.adgSerious).toFixed(2)}: ` +
    `${adg < tgt * RULES.adgSerious ? "would be SERIOUS" : "no group flag"}  | ${label}`);
