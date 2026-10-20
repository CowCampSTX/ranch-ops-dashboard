// Skeptic pass (verify-gain): gain-rule defects NOT in the gain auditor's report, plus variants that change the
// severity of reported ones. Imports the real exceptions.js and data/*.csv read-only; modifies no repo files.
// Run from anywhere:  node docs/audit/diagnostics/gain.missed.mjs
// Expected values in each line are worked out by hand (stated next to them), not by calling gainStatus.
process.env.TZ = "UTC";
import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, findExceptions, gainStatus, RULES } = await import(new URL("exceptions.js", ROOT).href);
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));
const D = Object.fromEntries(FILES.map((f) => [f, parseCSV(RAW[f])]));
const gainRows = (d) => findExceptions(d).filter((e) => e.area === "Gain").map((e) => `${e.severity} | ${e.subject} | ${e.problem.length > 90 ? e.problem.slice(0, 90) + "..." : e.problem}`);
const pair = (tag, group, a, b, from = "2026-07-20", to = "2026-09-15") => [{ tag, group, date: from, weight_lbs: a }, { tag, group, date: to, weight_lbs: b }];
const say = (id, expected, actual) => console.log(`[${id}]\n  expected: ${expected}\n  actual:   ${actual}\n`);

// M1 Group exactly at 80% of target is flagged, depending on CSV row order (floating-point mean of per-animal ADGs).
// 5 yearlings, integer weights, Jul 20 -> Sep 15 (57 days), gains 104+79+97+105+71 = 456 lbs over 285 animal-days
// = 1.6 exactly = 80% of 2.0. The rule is strict 'under 80%', so no serious row is expected in either order.
{
  const gains = [104, 79, 97, 105, 71];
  const w = gains.flatMap((g, i) => pair(`Y00${i + 1}`, "Yearlings", 700, 700 + g));
  const wr = [...w.slice(8), ...w.slice(0, 8)];   // same ten rows, Y005 listed first
  say("M1", "456/285 = 1.6 exactly; no Gain row in either row order",
    `file order: adg=${gainStatus(w, D.groups)[0].adg} rows=${JSON.stringify(gainRows({ ...D, weights: w }))}  ||  ` +
    `Y005 first: adg=${gainStatus(wr, D.groups)[0].adg} rows=${JSON.stringify(gainRows({ ...D, weights: wr }))}`);
}

// M2 Weight column exported with a thousands separator ("1,169", quoted, as CSV-04 shows for money): every animal at
// 1,000 lbs or more parses as the string '"1', its ADG is NaN, the group mean is NaN and the serious heifer alert
// disappears with no error. Yearlings (all under 1,000 lbs) are unaffected.
{
  const q = RAW.weights.replace(/,(\d)(\d{3})(\r?)$/gm, ',"$1,$2"$3');
  const d = { ...D, weights: parseCSV(q) };
  const h = gainStatus(d.weights, D.groups).find((g) => g.group === "Heifers");
  say("M2", "serious | Heifers | 0.44 lbs/day ... (1119/2565 = 0.4363), or a data error naming weight_lbs; 10 exceptions",
    `sample row ${JSON.stringify(q.split(/\r?\n/)[3])} parsed weight_lbs=${JSON.stringify(d.weights[2].weight_lbs)}; Heifers adg=${h.adg}; ` +
    `rows=${JSON.stringify(gainRows(d))}; total exceptions=${findExceptions(d).length}`);
}

// M3 (design limit) A heifer losing weight is never named while the whole group is flagged.
// H026: Jul 20 1130 lbs; Sep 15 set to 1130 - 171 = 959 lbs = -3.0 lbs/day over 57 days.
{
  const jul = D.weights.find((r) => r.tag === "H026" && r.date === "2026-07-20").weight_lbs;
  const w = D.weights.map((r) => (r.tag === "H026" && r.date === "2026-09-15" ? { ...r, weight_lbs: jul - 171 } : r));
  const all = findExceptions({ ...D, weights: w });
  say("M3", "a row naming H026 (losing 3.0 lbs/day, -171/57) alongside the serious Heifers row",
    `H026 Jul 20=${jul}; rows=${JSON.stringify(gainRows({ ...D, weights: w }))}; any row mentions H026: ${all.some((e) => (e.subject + e.problem).includes("H026"))}`);
}

// M4 Displayed thresholds disagree with the applied ones for non-round targets (toFixed(1) on target and 50% of it).
// Heifers target 1.25 -> applied animal threshold 0.625; animal A at 34.77/57 = 0.61 is listed. Yearlings target
// 2.25 -> 1.125; animal E at 63.84/57 = 1.12 is listed. Expected text states the threshold actually used.
{
  const groups = D.groups.map((g) => (g.group === "Heifers" ? { ...g, target_adg_lbs: 1.25 } : g.group === "Yearlings" ? { ...g, target_adg_lbs: 2.25 } : g));
  const w = [...pair("A", "Heifers", 700, 734.77), ...pair("B", "Heifers", 700, 814), ...pair("C", "Heifers", 700, 825.4),
    ...pair("E", "Yearlings", 600, 663.84), ...pair("F", "Yearlings", 600, 731.1), ...pair("G", "Yearlings", 600, 736.8)];
  say("M4", "'Under 0.625 lbs/day: A' and 'Under 1.125 lbs/day: E' (or 0.63 / 1.13 with an animal figure shown)",
    `${JSON.stringify(gainRows({ ...D, weights: w, groups }))}; A adg=${(34.77 / 57).toFixed(4)}, E adg=${(63.84 / 57).toFixed(4)}`);
}

// M5 (variant of the auditor's blank-weight finding) A blank in the EARLIER weigh-in coerces to 0, so the animal's ADG
// is its whole body weight / 57 and the serious heifer alert is masked. H001 Jul 20 blank: (1169 - 0)/57 = 20.51.
// Without H001: (1119 - 31)/(44*57) = 1088/2508 = 0.4338 -> still serious.
{
  const d = { ...D, weights: parseCSV(RAW.weights.replace("H001,Heifers,2026-07-20,1138", "H001,Heifers,2026-07-20,")) };
  const h = gainStatus(d.weights, D.groups).find((g) => g.group === "Heifers");
  say("M5", "serious | Heifers | 0.43 lbs/day ... (H001 skipped and reported as missing)",
    `H001 adg=${h.animals.find((a) => a.tag === "H001").adg}; Heifers adg=${h.adg}; rows=${JSON.stringify(gainRows(d))}`);
}

// M6 (variant of the auditor's date-format finding) Day-first dates (DD/MM/YYYY): V8 cannot parse 15/09/2026 or
// 20/07/2026, so every ADG is NaN and every gain alert vanishes silently (no throw, unlike the compact-date case).
{
  const t = RAW.weights.replace(/(\d{4})-(\d{2})-(\d{2})/g, "$3/$2/$1");
  const d = { ...D, weights: parseCSV(t) };
  say("M6", "the two committed gain rows, or a data error naming the date format",
    `${gainStatus(d.weights, D.groups).map((g) => `${g.group} adg=${g.adg} from=${g.from} to=${g.to}`).join("; ")}; rows=${JSON.stringify(gainRows(d))}; total exceptions=${findExceptions(d).length}`);
}
console.log(`RULES used: adgSerious=${RULES.adgSerious} animalShare=${RULES.animalShare}`);
