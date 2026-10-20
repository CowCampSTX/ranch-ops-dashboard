// Second skeptic pass on the health and budget findings. Independent of healthbudget.repro.mjs and healthbudget.verify.mjs.
// Run: node docs/audit/diagnostics/healthbudget.skeptic.mjs      (set TZ in the environment to test other zones)
// Expected values are worked out by hand in the comments; the script only prints what the code does.
// Modifies no repo file.
import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, findExceptions, budgetStatus } = await import(new URL("exceptions.js", ROOT).href);
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));
const D = Object.fromEntries(FILES.map((f) => [f, parseCSV(RAW[f])]));
const EMPTY = { pastures: [], groups: [], moves: [], weights: [], water: [], health: [], budget: [], meta: [{ as_of: "2026-09-30T18:00" }] };
const HH = "group,task,last_done,next_due,status\n", BH = "month,category,budget,actual\n";
const fmt = (a) => (a.length ? a.map((e) => `${e.severity} | ${e.area} | ${e.subject} | ${e.problem} | ${e.action}`).join("  ||  ") : "(none)");
const H = (body, asOf = "2026-09-30T18:00") => findExceptions({ ...EMPTY, health: parseCSV(HH + body), meta: [{ as_of: asOf }] });
const B = (body) => findExceptions({ ...EMPTY, budget: parseCSV(BH + body) });
const committedPlus = (extra) => parseCSV(RAW.budget.trim() + "\n" + extra);
const say = (id, s) => console.log(`${id}: ${s}`);
say("TZ", process.env.TZ ?? "(unset)");

// ---------------- F1: status spelling. Sep 15 -> Sep 30 = 15 days.
for (const s of ["open", "Open", "OPEN", "open ", " open", "in progress", "scheduled", "overdue", "Done", "cancelled"])
  say(`F1 ${JSON.stringify(s)}`, fmt(H(`Yearlings,Booster vaccine,2026-06-02,2026-09-15,${s}\nYearlings,Deworm,2026-06-02,2026-11-01,open`)));
say("F1 'open ' as LAST row (trim)", fmt(H(`Yearlings,Booster vaccine,2026-06-02,2026-09-15,open `)));

// ---------------- F2: month ignored.
const plan = { "Feed and mineral": 6200, Fuel: 2400, Repairs: 1800, "Vet and health": 1500, Labor: 9000, "Water and fencing": 1200 };
const fut = ["2026-10", "2026-11"].flatMap((m) => Object.entries(plan).map(([c, b]) => `${m},${c},${b},0`)).join("\n");
const bF = committedPlus(fut);
const sF = budgetStatus(bF);
say("F2 future rows", `Fuel ${sF.find((x) => x.category === "Fuel").actual}/${sF.find((x) => x.category === "Fuel").budget}; budget alerts: ${fmt(findExceptions({ ...D, budget: bF }).filter((e) => e.area === "Budget"))}; tb=${sF.reduce((s, x) => s + x.budget, 0)} ta=${sF.reduce((s, x) => s + x.actual, 0)} tile=${(((sF.reduce((s, x) => s + x.actual, 0) - sF.reduce((s, x) => s + x.budget, 0)) / sF.reduce((s, x) => s + x.budget, 0)) * 100).toFixed(1)}%`);
// as_of moved back to Sep 10: hand -> Sep rows (whole month budget AND actual) still counted.
say("F2 as_of Sep 10", fmt(findExceptions({ ...D, meta: [{ as_of: "2026-09-10T18:00" }] }).filter((e) => e.area === "Budget")));
// as_of moved to Jul 31: season to date should be Jun-Jul. Hand: Fuel 2592+2928=5520 vs 4800 = +15%; Repairs 1620+2520=4140 vs 3600 = +15%.
say("F2 as_of Jul 31 (expect Fuel 15%, Repairs 15% if month were honoured)", fmt(findExceptions({ ...D, meta: [{ as_of: "2026-07-31T18:00" }] }).filter((e) => e.area === "Budget")));
// Sep Fuel row deleted. Hand: Jun-Aug 8640 vs 7200 = +20%, $1,440.
say("F2 Sep Fuel row deleted", fmt(findExceptions({ ...D, budget: parseCSV(RAW.budget.replace(/2026-09,Fuel,2400,3000\r?\n/, "")) }).filter((e) => e.area === "Budget")));

// ---------------- F3: blank / '(300)'.
const blankSepFuel = parseCSV(RAW.budget.replace("2026-09,Fuel,2400,3000", "2026-09,Fuel,2400,"));
const sB = budgetStatus(blankSepFuel);
say("F3 blank Sep Fuel actual", `Fuel actual=${JSON.stringify(sB.find((x) => x.category === "Fuel").actual)}; pct=${sB.find((x) => x.category === "Fuel").pct}; alerts ${fmt(findExceptions({ ...D, budget: blankSepFuel }).filter((e) => e.area === "Budget"))}; ta=${JSON.stringify(sB.reduce((s, x) => s + x.actual, 0))}`);
// Same blank, but with blank treated as numeric 0, for comparison: Fuel 8640 vs 9600 = -10% -> no alert either.
const zeroSepFuel = parseCSV(RAW.budget.replace("2026-09,Fuel,2400,3000", "2026-09,Fuel,2400,0"));
say("F3 Sep Fuel actual typed 0 (control)", fmt(findExceptions({ ...D, budget: zeroSepFuel }).filter((e) => e.area === "Budget")));
// Blank in the FIRST month (June) of Fuel: string concat starts at "0".
const blankJunFuel = parseCSV(RAW.budget.replace("2026-06,Fuel,2400,2592", "2026-06,Fuel,2400,"));
const sJ = budgetStatus(blankJunFuel);
say("F3 blank Jun Fuel actual", `Fuel actual=${JSON.stringify(sJ.find((x) => x.category === "Fuel").actual)}; alerts ${fmt(findExceptions({ ...D, budget: blankJunFuel }).filter((e) => e.area === "Budget"))}`);
const hayBlank = committedPlus("2026-09,Hay,,500");
const sH = budgetStatus(hayBlank);
say("F3 Hay blank budget", `Hay budget=${JSON.stringify(sH.find((x) => x.category === "Hay").budget)}; tb=${JSON.stringify(sH.reduce((s, x) => s + x.budget, 0))}; ta=${sH.reduce((s, x) => s + x.actual, 0)}`);
const paren = committedPlus("2026-09,Repairs,0,(300)");
const sP = budgetStatus(paren);
say("F3 (300)", `Repairs actual=${JSON.stringify(sP.find((x) => x.category === "Repairs").actual)} pct=${sP.find((x) => x.category === "Repairs").pct}; alerts ${fmt(findExceptions({ ...D, budget: paren }).filter((e) => e.area === "Budget"))}`);
// '$3,000' can't even be written unquoted; '$3000' (no comma) stays a string:
const dollar = parseCSV(RAW.budget.replace("2026-09,Fuel,2400,3000", "2026-09,Fuel,2400,$3000"));
say("F3 '$3000'", `Fuel actual=${JSON.stringify(budgetStatus(dollar).find((x) => x.category === "Fuel").actual)}; alerts ${fmt(findExceptions({ ...D, budget: dollar }).filter((e) => e.area === "Budget"))}`);

// ---------------- F4: zero budget.
say("F4 Hay 0/500", fmt(B("2026-09,Hay,0,500")));
say("F4 Hay 0/0 pct", String(budgetStatus(parseCSV(BH + "2026-09,Hay,0,0"))[0].pct));

// ---------------- F5: open task with blank / unreadable due date.
say("F5 blank due", fmt(H("Heifers,Pregnancy check,2026-09-20,,open")));
say("F5 TBD", fmt(H("Heifers,Pregnancy check,2026-09-20,TBD,open")));

// ---------------- F6: Fly tag (committed). Sep 1 -> Sep 30 = 29 days.
say("F6 committed health", fmt(findExceptions(D).filter((e) => e.area === "Health")));

// ---------------- F7: percent only. 230/200: 30/200 = 15%. 109500/100000 = 9.5%. 104000/100000 = 4%.
say("F7", fmt(B("2026-09,Ear tags,200,230\n2026-09,Feed,100000,109500\n2026-09,Hay,100000,104000")));

// ---------------- F8: ordering on committed data.
say("F8 order", findExceptions(D).map((e, i) => `${i + 1}.${e.severity}/${e.area}/${e.subject}`).join(" | "));

// ---------------- F9: boundaries.  50/1000 = 0.05; 96/1000 = 9.6%; 104/1000 = 10.4%; 100/1000 = 10%.
for (const a of [1049, 1050, 1051, 1096, 1100, 1104]) say(`F9 1000/${a}`, `pct=${(a - 1000) / 1000} ${fmt(B(`2026-09,X,1000,${a}`))}`);
// 0.05 is exactly representable as the same double as 50/1000?
say("F9 50/1000 === 0.05", String(50 / 1000 === 0.05));

// ---------------- F10: cents.  Hand: budgets sum 7419.00, actuals 8160.90, over 741.90 = 10.000% exactly.
say("F10 cents", fmt(B("2026-06,X,1265.97,2041.13\n2026-07,X,1631.6,2043.68\n2026-08,X,1855.07,2039.34\n2026-09,X,2666.36,2036.75")));
// Single-row cents case: 1000.10 vs 1100.11 -> 100.01/1000.10 = 10.0000% (rounded) but > 0.1 by 1e-6? Hand: 100.01/1000.1 = 0.100000... check
say("F10 single row 1000 vs 1100.00 (cents)", fmt(B("2026-09,X,1000.00,1100.00")));

// ---------------- F11: dollars formatting.
say("F11", fmt(B("2026-09,X,1000,1104.5\n2026-09,Y,1000,1060")));
say("F11 locale de-DE", (2040).toLocaleString("de-DE") + "  (what a German-locale browser shows inside '($...)')");

// ---------------- F13: due today.
say("F13 due today", fmt(H("Cows,Pinkeye check,2026-08-01,2026-09-30,open")));

// ---------------- F14: time part.
say("F14 time part", fmt(H("Cows,Pinkeye check,2026-08-01,2026-09-30 00:00:00,open")));

// ---------------- F15: last_done after next_due.
say("F15", fmt(H("Yearlings,Booster vaccine,2026-09-20,2026-09-15,open")));

// ---------------- F17: rules text float noise.
say("F17", `${0.07 * 100} ${0.06 * 100} ${0.08 * 100} ${0.15 * 100} ${0.12 * 100}`);
