// Independent skeptic check of the gain-rule audit (gain.repro.mjs). Fresh minimal inputs, written separately from the
// auditor's script; reference numbers are computed here from the raw CSV text with a separate parser (no parseCSV, no
// gainStatus). Run from anywhere:  node docs/audit/diagnostics/gain.verify.mjs
// Modifies no repo files.
process.env.TZ = "UTC";
import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, findExceptions, gainStatus, RULES } = await import(new URL("exceptions.js", ROOT).href);
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));
const D = Object.fromEntries(FILES.map((f) => [f, parseCSV(RAW[f])]));
const out = (id, s) => console.log(`[${id}] ${s}`);
const tryIt = (fn) => { try { return fn(); } catch (e) { return `THREW ${e.constructor.name}: ${e.message}`; } };
const gain = (exc) => exc.filter((e) => e.area === "Gain").map((e) => `${e.severity} | ${e.subject} | ${e.problem}`);
const W = (extra = "", edit = (t) => t) => parseCSV(edit(RAW.weights) + extra);

// ---------------------------------------------------------------- independent reference (own parser)
{
  const rows = RAW.weights.trim().split("\n").slice(1).map((l) => l.split(","));
  const by = {};
  for (const [tag, group, date, w] of rows) ((by[tag] ??= { group, w: {} }).w[date] = Number(w));
  for (const [g, tgt] of [["Heifers", 1], ["Yearlings", 2]]) {
    const tags = Object.keys(by).filter((t) => by[t].group === g);
    const tot = tags.reduce((s, t) => s + by[t].w["2026-09-15"] - by[t].w["2026-07-20"], 0);
    const slow = tags.filter((t) => (by[t].w["2026-09-15"] - by[t].w["2026-07-20"]) / 57 < tgt / 2);
    out("REF", `${g}: n=${tags.length} gain=${tot} lbs / ${tags.length * 57} animal-days = ${(tot / (tags.length * 57)).toFixed(6)}; under ${tgt / 2}: ${slow.length}${slow.length < 10 ? " " + slow.join(",") : ""}`);
  }
  out("REF", `committed findExceptions length = ${findExceptions(D).length}; gain rows = ${JSON.stringify(gain(findExceptions(D)))}`);
}

// ---------------------------------------------------------------- F1 single weigh-in
out("F1", tryIt(() => findExceptions({ ...D, weights: W("Y151,Yearlings,2026-09-15,820\n") }).length));
out("F1-cow", tryIt(() => findExceptions({ ...D, weights: W("C017,Cows,2026-09-15,1310\n") }).length));
// minimal: one animal, one row
out("F1-min", tryIt(() => gainStatus(parseCSV("tag,group,date,weight_lbs\nX1,Yearlings,2026-09-15,800\n"), D.groups)));

// ---------------------------------------------------------------- F2 zero-day interval
for (const w of [1180, 1169, 1160]) {
  const r = tryIt(() => { const e = findExceptions({ ...D, weights: W(`H001,Heifers,2026-09-15,${w}\n`) });
    const h = gainStatus(W(`H001,Heifers,2026-09-15,${w}\n`), D.groups).find((g) => g.group === "Heifers");
    return `heifers adg=${h.adg} from=${h.from} | ${gain(e).map((s) => s.slice(0, 80)).join(" || ")}`; });
  out(`F2 dup ${w}`, r);
}
// The gridline loop from app.js:153-156, re-run here with an iteration guard so it can't hang.
const loopCount = (all, targets) => {
  const lo = Math.min(0, Math.floor(Math.min(...all) * 2) / 2), hi = Math.ceil(Math.max(...all, ...targets) * 2) / 2;
  let n = 0; for (let v = lo; v <= hi + 1e-9; v += 0.5) { if (++n > 1e6) return `lo=${lo} hi=${hi} >1e6 iterations (unbounded)`; }
  return `lo=${lo} hi=${hi} iterations=${n}`;
};
out("F2 loop +Inf", loopCount([0.4, Infinity], [1, 2]));
out("F2 loop -Inf", loopCount([0.4, -Infinity], [1, 2]));
out("F2 loop NaN", loopCount([0.4, NaN], [1, 2]));
out("F2 loop committed-like", loopCount([0.105, 2.70], [1, 2]));
// Regression-test arithmetic: keep later reading 1180 -> (1119 - 31 + 42) / 2565
out("F2 arith", `${(1119 - 31 + 42) / 2565} ${1119 / 2565}`);

// ---------------------------------------------------------------- F4 tag merge
{
  const w = parseCSV("tag,group,date,weight_lbs\n101,Heifers,2026-07-20,1100\n101,Heifers,2026-09-15,1130\n101,Yearlings,2026-07-20,800\n101,Yearlings,2026-09-15,910\n");
  out("F4", JSON.stringify(gainStatus(w, D.groups).map((g) => [g.group, g.animals.map((a) => [a.tag, a.adg, a.from, a.to])])));
  const z = parseCSV("tag,group,date,weight_lbs\n0101,Yearlings,2026-07-20,800\n101,Yearlings,2026-07-20,810\n0101,Yearlings,2026-09-15,910\n101,Yearlings,2026-09-15,925\n");
  out("F4-leading-zero", `parsed tags=${JSON.stringify(z.map((r) => r.tag))} -> ` + JSON.stringify(gainStatus(z, D.groups).map((g) => [g.group, g.head, g.animals.map((a) => [a.tag, a.adg])])));
}

// ---------------------------------------------------------------- F5 short re-weigh
{
  const g = gainStatus(W("H001,Heifers,2026-09-16,1189\n"), D.groups).find((x) => x.group === "Heifers");
  out("F5", `heifers mean adg=${g.adg.toFixed(4)}; H001=${g.animals.find((a) => a.tag === "H001").adg}; pooled-last-two=${(1119 - 31 + 20) / (44 * 57 + 1)} | ${gain(findExceptions({ ...D, weights: W("H001,Heifers,2026-09-16,1189\n") })).map((s) => s.slice(0, 60)).join(" || ")}`);
  // the negative direction claim: can one -20 lb next-day reading flip yearlings (150 head) to serious? need mean < 1.6
  const y = gainStatus(W("Y001,Yearlings,2026-09-16,831\n"), D.groups).find((x) => x.group === "Yearlings");
  out("F5-neg", `one yearling re-weighed next day 20 lbs lighter: yearling mean adg=${y.adg.toFixed(4)} (serious needs < 1.6)`);
  // smallest yearling group (n) where one -20 lb/day animal flips 1.94 to < 1.6: (1.94*(n-1) - 20)/n < 1.6
  let n = 2; while ((1.9425 * (n - 1) - 20) / n < 1.6) n++; out("F5-neg", `one -20 lbs/day reading flips a 1.94 group to serious for groups up to ${n - 1} head`);
}

// ---------------------------------------------------------------- F6 implausible weight
{
  const w = W("", (t) => t.replace("H001,Heifers,2026-09-15,1169", "H001,Heifers,2026-09-15,11690"));
  const g = gainStatus(w, D.groups).find((x) => x.group === "Heifers");
  out("F6", `H001 adg=${g.animals[0].adg.toFixed(2)} heifer mean=${g.adg.toFixed(3)} excl H001 pooled=${(1088 / 2508).toFixed(4)} | ${gain(findExceptions({ ...D, weights: w })).map((s) => s.slice(0, 50)).join(" || ")}`);
  out("F6 loop", loopCount(gainStatus(w, D.groups).flatMap((x) => x.animals.map((a) => a.adg)), [1, 2]));
}

// ---------------------------------------------------------------- F7 blank weight, and a missed variant: text weight
for (const cell of ["", "NA"]) {
  const w = W("", (t) => t.replace("Y001,Yearlings,2026-09-15,851", `Y001,Yearlings,2026-09-15,${cell}`));
  const y = gainStatus(w, D.groups).find((x) => x.group === "Yearlings");
  out(`F7 Y001='${cell}'`, `Y001 adg=${y.animals[0].adg} yearling mean=${y.adg} | ${gain(findExceptions({ ...D, weights: w })).map((s) => s.slice(0, 90)).join(" || ")}`);
}
for (const cell of ["", "NA"]) {
  const w = W("", (t) => t.replace("H001,Heifers,2026-09-15,1169", `H001,Heifers,2026-09-15,${cell}`));
  const h = gainStatus(w, D.groups).find((x) => x.group === "Heifers");
  out(`MISSED-NA H001='${cell}'`, `H001 adg=${h.animals[0].adg} heifer mean=${h.adg} | ${gain(findExceptions({ ...D, weights: w })).map((s) => s.slice(0, 60)).join(" || ")}`);
}
out("F7 arith", `${(16608 - 140) / (149 * 57)}`);

// ---------------------------------------------------------------- F8 missed last weigh-in
{
  const slow6 = ["Y027", "Y031", "Y058", "Y082", "Y129", "Y132"];
  const w = parseCSV(RAW.weights).filter((r) => !(slow6.includes(r.tag) && r.date === "2026-09-15"));
  out("F8b", gain(findExceptions({ ...D, weights: w })).join(" || "));
  const w2 = parseCSV(RAW.weights).filter((r) => !(r.tag === "H001" && r.date === "2026-09-15"));
  out("F8a", gain(findExceptions({ ...D, weights: w2 })).map((s) => s.slice(0, 70)).join(" || "));
  // Order dependence: same data, H001 moved to the end of the file -> different 'since' date
  const w3 = [...w2.filter((r) => r.tag !== "H001"), ...w2.filter((r) => r.tag === "H001")];
  out("F8a reordered", gain(findExceptions({ ...D, weights: w3 })).map((s) => s.slice(0, 70)).join(" || "));
}

// ---------------------------------------------------------------- F9 unknown group / missing group
{
  const w = parseCSV(RAW.weights).map((r) => (r.tag === "Y027" ? { ...r, group: "Yearlings " } : r));
  out("F9 trailing space", gain(findExceptions({ ...D, weights: w })).join(" || "));
}

// ---------------------------------------------------------------- F10 dates
{
  const us = parseCSV("tag,group,date,weight_lbs\nY001,Yearlings,6/1/2026,621\nY001,Yearlings,7/20/2026,711\nY001,Yearlings,9/15/2026,851\nY001,Yearlings,10/12/2026,880\n");
  const a = gainStatus(us, D.groups)[0].animals[0];
  out("F10 US", `from=${a.from} to=${a.to} adg=${a.adg.toFixed(4)} weight=${a.weight}; expected 29/27=${(29 / 27).toFixed(4)}`);
  out("F10 compact", tryIt(() => gainStatus(parseCSV("tag,group,date,weight_lbs\nY001,Yearlings,20260720,711\nY001,Yearlings,20260915,851\n"), D.groups)));
}

// ---------------------------------------------------------------- F11 bad target, plus blank target
for (const t of ["2.O", ""]) {
  const groups = parseCSV(RAW.groups.replace("Yearlings,yearling steers,150,2.0", `Yearlings,yearling steers,150,${t}`));
  const g = gainStatus(D.weights, groups).find((x) => x.group === "Yearlings");
  out(`F11 target='${t}'`, `target=${JSON.stringify(g.target)} | ${gain(findExceptions({ ...D, groups })).map((s) => s.slice(0, 60)).join(" || ")} | tile expr: ${tryIt(() => g.target.toFixed(1))}`);
}

// ---------------------------------------------------------------- F17 group change
{
  const w = parseCSV(RAW.weights).map((r) => (r.tag === "H001" && r.date === "2026-09-15" ? { ...r, group: "Cows" } : r));
  const gs = gainStatus(w, D.groups);
  out("F17", gs.map((g) => `${g.group} head=${g.head} adg=${g.adg.toFixed(4)} hasH001=${g.animals.some((a) => a.tag === "H001")}`).join("; "));
}

// ---------------------------------------------------------------- MISSED: target / threshold display rounding
{
  const groups = [{ group: "Yearlings", class: "x", head: 3, target_adg_lbs: 1.5 }];
  const mk = (adgs) => adgs.flatMap((r, i) => [{ tag: `A${i}`, group: "Yearlings", date: "2026-07-20", weight_lbs: 700 },
    { tag: `A${i}`, group: "Yearlings", date: "2026-09-15", weight_lbs: 700 + r * 57 }]);
  const ws = mk([0.74, 0.77, 1.8, 1.8, 1.8]);
  out("MISSED-round t=1.5", `per-animal adg=${gainStatus(ws, groups)[0].animals.map((a) => a.adg.toFixed(2)).join(",")} | ${gain(findExceptions({ ...D, groups, weights: ws })).join(" || ")}`);
  const g2 = [{ group: "Yearlings", class: "x", head: 3, target_adg_lbs: 1.75 }];
  const ws2 = mk([1.38, 1.38, 1.38]);
  out("MISSED-round t=1.75", `${gain(findExceptions({ ...D, groups: g2, weights: ws2 })).join(" || ")}  (80% of 1.75 = ${1.75 * 0.8})`);
  const g3 = [{ group: "Yearlings", class: "x", head: 3, target_adg_lbs: 2.25 }];
  const ws3 = mk([1.12, 2.4, 2.4]);
  out("MISSED-round t=2.25", `${gain(findExceptions({ ...D, groups: g3, weights: ws3 })).join(" || ")}  (50% of 2.25 = ${2.25 * 0.5})`);
}

// ---------------------------------------------------------------- MISSED: duplicate group row in groups.csv
{
  const groups = parseCSV(RAW.groups + "Yearlings,yearling steers (2nd pasture),0,2.0\n");
  out("MISSED-dupgroup", gain(findExceptions({ ...D, groups })).join(" || "));
}
