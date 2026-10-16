// Research diagnostic (research-gain, second pass): ties the gain rules in exceptions.js to numbers re-verified from
// the sources on 2026-10-16. Read-only: imports exceptions.js and data/*.csv from the repo and modifies nothing.
//
// Run: node docs/audit/diagnostics/gain.evidence.research.mjs
//
// Sources for every published number (all fetched 2026-10-16):
//  [G02] Grings et al. 2002, J. Range Manage. 55:135-138, Fort Keogh MT, 1993-95.
//        https://ars.usda.gov/ARSUserFiles/30300500/Publications/JRM55-135-138.pdf
//  [C22] Cheng et al. 2022, Rangeland Ecol. Manage. 82:1-11, CPER CO, 2014-18 (observed ranges quoted in text).
//  [W22] Wheeler, UNL BeefWatch 2022-07-01, High Plains Ag Lab NE, crested wheatgrass.
//  [GL14] Gillespie et al., 2014 Nebraska Beef Cattle Report pp. 34-35, Gudmundsen Sandhills Lab, 2011-12.
//  [M86] Manske et al., NDSU DREC, "Complementary Rotation Grazing System in Western North Dakota", 1983-86.
//  [L18] Lansford et al., 2018 Nebraska Beef Cattle Report pp. 21-23, Gudmundsen Sandhills Lab.
//  [W12] Watson et al., 2012 Nebraska Beef Cattle Report pp. 45-46 (full vs limit-fed weights).
//  [W13] Watson et al. 2013, J. Anim. Sci. 91:5507-5517.
//  [H82] Heitschmidt 1982, J. Range Manage. 35:717-720 (Texas Experimental Ranch keyword; mature cows).
//  [D14] Derner, Mortenson & West 2014, SRM abstract, CPER CO 2009-12 (overnight shrink by month).
//  [BIF] BIF Guidelines for Feed Efficiency Testing as of 2019-03-26 (70-d minimum for individual ADG).
// Nothing here is a property of any real herd. The repo data are fictional.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../..");
const { parseCSV, gainStatus, RULES } = await import(path.join(repo, "exceptions.js"));
const load = (f) => parseCSV(fs.readFileSync(path.join(repo, "data", f), "utf8"));
const weights = load("weights.csv"), groups = load("groups.csv");
const KG = 2.2046;
const f2 = (x) => (x >= 0 ? " " : "") + x.toFixed(2);

console.log("== 1. Shipped data: coverage, intervals, and what the rules do ==");
for (const g of gainStatus(weights, groups)) {
  const inv = groups.find((r) => r.group === g.group);
  const intervals = new Set(g.animals.map((a) => `${a.from}..${a.to}`));
  const days = (Date.parse(g.to) - Date.parse(g.from)) / 864e5;
  const sd = Math.sqrt(g.animals.reduce((s, a) => s + (a.adg - g.adg) ** 2, 0) / (g.animals.length - 1));
  console.log(`${g.group}: inventory ${inv.head}, weighed ${g.head} (${((100 * g.head) / inv.head).toFixed(0)}%), ` +
    `distinct intervals ${intervals.size} [${[...intervals].join(", ")}], ${days} d; mean ADG ${g.adg.toFixed(2)} ` +
    `(SD ${sd.toFixed(2)}, synthetic); target ${g.target}; group serious < ${(g.target * RULES.adgSerious).toFixed(2)}; ` +
    `animal warning < ${(g.target * RULES.animalShare).toFixed(2)}; animals under: ` +
    `${g.animals.filter((a) => a.adg < g.target * RULES.animalShare).length}`);
}
const cows = groups.find((r) => r.group === "Cows");
console.log(`Cows: inventory ${cows.head}, target ${cows.target_adg_lbs} -> skipped by 'if (!g.target) continue'; ` +
  `weights.csv rows for Cows: ${weights.filter((r) => r.group === "Cows").length}; no BCS field exists in any CSV.`);

console.log("\n== 2. Published Northern/Central Plains gains vs the fixed thresholds (lb/d; kg x 2.2046) ==");
const pub = [
  ["Yearlings", 2.0, "[G02] 1993 season-long steers, late period 17 Sep-4 Oct (May-Aug precip ~169% of normal)", 1.11 * KG],
  ["Yearlings", 2.0, "[G02] 1994 season-long steers, late period 15 Jul-8 Sep (precip 44% of normal)", 0.59 * KG],
  ["Yearlings", 2.0, "[G02] 1995 season-long steers, late period 4 Aug-26 Sep (precip 104% of normal)", 0.66 * KG],
  ["Yearlings", 2.0, "[G02] 1993 season-long steers, whole season 19 May-4 Oct", 1.19 * KG],
  ["Yearlings", 2.0, "[G02] 1994 season-long steers, whole season 17 May-8 Sep", 1.07 * KG],
  ["Yearlings", 2.0, "[G02] 1995 season-long steers, whole season 15 May-26 Sep", 1.11 * KG],
  ["Yearlings", 2.0, "[C22] CPER traditional mgmt, low end of 2014-18 annual range (mid-May-early Oct)", 0.86 * KG],
  ["Yearlings", 2.0, "[C22] CPER traditional mgmt, high end of 2014-18 annual range", 1.14 * KG],
  ["Yearlings", 2.0, "[C22] CPER adaptive rotation, low end of 2014-18 annual range", 0.74 * KG],
  ["Yearlings", 2.0, "[W22] HPAL crested wheatgrass, unsupplemented, late May-early Sep", 1.51],
  ["Yearlings", 2.0, "[GL14] Sandhills spayed yearling heifers, control, 2011 (120-d season)", 1.17],
  ["Yearlings", 2.0, "[GL14] Sandhills spayed yearling heifers, control, 2012 drought", 0.73],
  ["Heifers", 1.0, "[L18] Sandhills 2-yr-old primiparous cows, ~5 Aug-pregnancy dx, unsupplemented", -0.15],
  ["Heifers", 1.0, "[L18] same, supplemented", 0.18],
  ["Heifers", 1.0, "[M86] NDSU Dickinson cows (pairs) on native range, 1984 (lowest year)", 0.25],
  ["Heifers", 1.0, "[M86] NDSU Dickinson cows (pairs) on native range, 1983-86 mean", 0.59],
  ["Heifers", 1.0, "[M86] NDSU Dickinson cows (pairs) on native range, 1983 (highest year)", 0.82],
];
for (const [grp, tgt, label, adg] of pub)
  console.log(`${grp.padEnd(9)} ${f2(adg)} vs serious < ${(tgt * RULES.adgSerious).toFixed(2)}: ` +
    `${(adg < tgt * RULES.adgSerious ? "would be SERIOUS" : "no group flag").padEnd(16)} | ${label}`);

console.log("\n== 3. Weight error -> ADG error (error / days). Consistency check against [W12] first ==");
console.log(`[W12] pasture heifers, mean full-vs-limit-fed difference 10.2 lb over 20 d -> ${(10.2 / 20).toFixed(2)} lb/d ` +
  `(report states 0.51); pasture steers 37 lb over 165 d -> ${(37 / 165).toFixed(2)} lb/d (report states 0.22)`);
const errs = [
  ["[W12] mean full-weight offset, pasture heifers (lb)", 10.2],
  ["[D14] Jun-Aug vs Sep overnight shrink gap (8.9% vs 7.1%) on a 780-lb yearling (lb)", 0.018 * 780],
  ["[H82] early vs late morning, 2.5% of a 1,100-lb young cow (extrapolated from mature cows) (lb)", 0.025 * 1100],
  ["[W12] mean full-weight offset, pasture steers (lb)", 37],
];
const spans = [28, 42, 57, 70, 84, 112];
console.log("systematic error applied to one of the two weigh-ins (shifts the GROUP mean):");
console.log("  " + "error source".padEnd(92) + spans.map((d) => `${d} d`.padStart(7)).join(""));
for (const [label, e] of errs)
  console.log("  " + `${label} = ${e.toFixed(1)}`.padEnd(92) + spans.map((d) => (e / d).toFixed(2).padStart(7)).join(""));
console.log("minimum days so that the error stays within a share of target (days >= error / (share x target)):");
for (const [label, e] of errs) {
  const need = (share, tgt) => Math.ceil(e / (share * tgt));
  console.log(`  ${label.slice(0, 60).padEnd(60)} yearlings(2.0): 10% ${String(need(0.1, 2)).padStart(4)} d, 20% ${String(need(0.2, 2)).padStart(4)} d | ` +
    `heifers(1.0): 10% ${String(need(0.1, 1)).padStart(4)} d, 20% ${String(need(0.2, 1)).padStart(4)} d`);
}

console.log("\n== 4. Individual worst cases from published ranges (one weigh-in off by the stated amount) ==");
const indiv = [
  ["[W12] individual full vs limit-fed weight, high end (lb)", 99],
  ["[W12] individual full vs limit-fed weight, low end (lb)", -86],
  ["[W13] 2-day full-fed re-weigh difference, high end (34 kg)", 34 * KG],
  ["[W13] 2-day full-fed re-weigh difference, low end (-14 kg)", -14 * KG],
];
for (const [label, e] of indiv)
  console.log(`  ${label.padEnd(62)} ${e.toFixed(0).padStart(4)} lb -> ` +
    spans.map((d) => `${d}d ${f2(e / d)}`).join("  "));
console.log(`  Gap between target and the individual threshold: yearlings ${(2.0 * (1 - RULES.animalShare)).toFixed(2)} lb/d, ` +
  `heifers ${(1.0 * (1 - RULES.animalShare)).toFixed(2)} lb/d. An error larger than the gap can flag an on-target animal.`);

console.log("\n== 5. Precision of a group mean if only a sample is weighed (SE = SD / sqrt(n)); SD values are ASSUMED ==");
for (const sd of [0.25, 0.4]) {
  console.log(`  SD ${sd} lb/d: ` + [10, 20, 30, 45, 75, 150].map((n) => `n=${n} SE ${(sd / Math.sqrt(n)).toFixed(3)}`).join(", "));
}
console.log("  (Random sampling error is small at full coverage; a shared weighing-condition error from section 3 is not reduced by n.)");

console.log("\n== 6. Test-length reference ==");
console.log("  [BIF] 'a minimum of a 70-d test period is required to accurately compute average daily gain for individual animals'");
console.log("        (feed-efficiency test conditions: controlled diet, two start and two end weights on separate days).");
console.log(`  Shipped interval: ${(Date.parse("2026-09-15") - Date.parse("2026-07-20")) / 864e5} d between single full weights.`);
