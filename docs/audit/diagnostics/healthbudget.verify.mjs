// Skeptic's re-check of the health and budget findings (independent of healthbudget.repro.mjs).
// Run from anywhere:  node docs/audit/diagnostics/healthbudget.verify.mjs
// Every expected value below is computed by hand in the comment beside it, never from the code under test.
// Each case prints one line: <id> | <what was fed in> | <what came out>. Modifies no repo files.
process.env.TZ = "UTC";
import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, findExceptions, budgetStatus, RULES } = await import(new URL("exceptions.js", ROOT).href);
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));
const D = Object.fromEntries(FILES.map((f) => [f, parseCSV(RAW[f])]));
const BLANK = { pastures: [], groups: [], moves: [], weights: [], water: [], health: [], budget: [], meta: [{ as_of: "2026-09-30T18:00" }] };
const HH = "group,task,last_done,next_due,status\n", BH = "month,category,budget,actual\n";
const show = (a) => (a.length ? a.map((e) => `${e.severity}|${e.area}|${e.subject}|${e.problem}`).join(" ;; ") : "(none)");
const health = (body) => findExceptions({ ...BLANK, health: parseCSV(HH + body) });
const budget = (body) => findExceptions({ ...BLANK, budget: parseCSV(BH + body) });
const real = (over) => findExceptions({ ...D, ...over });
const line = (id, input, out) => console.log(`${id} | ${input} | ${out}`);

// ---- F1 status spelling. Sep 15 -> Sep 30 = 15 days overdue.
for (const s of ["open", "Open", "OPEN", "open ", "in progress", "scheduled", "overdue", "Overdue"]) {
  const body = `Yearlings,Booster vaccine,2026-06-02,2026-09-15,${s}\nYearlings,Deworm,2026-06-02,2026-11-01,open`;
  line("F1", JSON.stringify(s), show(health(body)));
}
// does a CRLF file still give 'open'? (split(/\r?\n/) should strip the CR)
line("F1-crlf", "CRLF line endings, status open", show(health("Yearlings,Booster vaccine,2026-06-02,2026-09-15,open\r\nYearlings,Deworm,2026-06-02,2026-11-01,open\r\n")));

// ---- F2 month column ignored. Committed + Oct/Nov plan rows (actual 0).
// Plan per month: Feed 6200, Fuel 2400, Repairs 1800, Vet 1500, Labor 9000, Water 1200 = 22,100.
// Expected season-to-date (Jun-Sep) unchanged: Fuel 11,640 vs 9,600 (+21.25%), Repairs 9,000 vs 7,200 (+25%).
// What the code does if it sums everything: Fuel 11,640 vs 9,600+4,800=14,400 -> -19.17%; Repairs 9,000 vs 10,800 -> -16.67%.
const plan = { "Feed and mineral": 6200, Fuel: 2400, Repairs: 1800, "Vet and health": 1500, Labor: 9000, "Water and fencing": 1200 };
const future = ["2026-10", "2026-11"].flatMap((m) => Object.entries(plan).map(([c, b]) => `${m},${c},${b},0`)).join("\n");
const withFuture = parseCSV(RAW.budget.trim() + "\n" + future);
const bsF = budgetStatus(withFuture);
line("F2-future", "committed + Oct/Nov plan rows actual 0",
  `Fuel ${bsF.find((x) => x.category === "Fuel").actual}/${bsF.find((x) => x.category === "Fuel").budget} pct=${bsF.find((x) => x.category === "Fuel").pct.toFixed(4)}; Repairs pct=${bsF.find((x) => x.category === "Repairs").pct.toFixed(4)}; alerts: ${show(real({ budget: withFuture }).filter((e) => e.area === "Budget"))}; total budget=${bsF.reduce((s, x) => s + x.budget, 0)} (hand: 88,400 + 2 x 22,100 = 132,600)`);
// mid-month as_of: as_of moved to Sep 10 with the full Sep plan row in place; the code result does not change at all.
line("F2-asof", "committed data, as_of moved to 2026-09-10T18:00",
  show(real({ meta: [{ as_of: "2026-09-10T18:00" }] }).filter((e) => e.area === "Budget")));

// ---- F3 blank / '(300)'. Committed + 'Hay' with blank budget, actual 500.
const hayBlank = parseCSV(RAW.budget.trim() + "\n2026-09,Hay,,500");
const bsH = budgetStatus(hayBlank).find((x) => x.category === "Hay");
line("F3-blankbudget", "committed + '2026-09,Hay,,500'", `Hay budget=${JSON.stringify(bsH.budget)} (${typeof bsH.budget}) pct=${bsH.pct}; tile tb via app.js reduce = ${JSON.stringify(budgetStatus(hayBlank).reduce((s, x) => s + x.budget, 0))}`);
// Sep Fuel actual blank: hand Jun-Aug 2592+2928+3120 = 8,640 vs 7,200 = +20%.
const fuelBlank = parseCSV(RAW.budget.replace("2026-09,Fuel,2400,3000", "2026-09,Fuel,2400,"));
const bsFB = budgetStatus(fuelBlank).find((x) => x.category === "Fuel");
line("F3-blankactual", "Sep Fuel actual blank", `Fuel actual=${JSON.stringify(bsFB.actual)} (${typeof bsFB.actual}) pct=${bsFB.pct}; alerts: ${show(real({ budget: fuelBlank }).filter((e) => e.area === "Budget"))}; tile ta=${JSON.stringify(budgetStatus(fuelBlank).reduce((s, x) => s + x.actual, 0))}`);
// '(300)' credit on Repairs: hand 9,000 - 300 = 8,700 vs 7,200 -> +1,500 = 20.83% -> serious '21% over ($1,500)'.
const paren = parseCSV(RAW.budget.trim() + "\n2026-09,Repairs,0,(300)");
const bsP = budgetStatus(paren).find((x) => x.category === "Repairs");
line("F3-paren", "committed + '2026-09,Repairs,0,(300)'", `Repairs actual=${JSON.stringify(bsP.actual)} pct=${bsP.pct}; alerts: ${show(real({ budget: paren }).filter((e) => e.area === "Budget"))}`);

// ---- F4 zero budget.
line("F4-hay500", "'2026-09,Hay,0,500'", show(budget("2026-09,Hay,0,500")) + ` pct=${budgetStatus(parseCSV(BH + "2026-09,Hay,0,500"))[0].pct}`);
line("F4-hay0", "'2026-09,Hay,0,0'", show(budget("2026-09,Hay,0,0")) + ` pct=${budgetStatus(parseCSV(BH + "2026-09,Hay,0,0"))[0].pct}`);
// chart scale copied from app.js:181-182 (re-typed, not imported, since app.js needs a DOM)
const lim = (rows) => Math.max(0.3, ...rows.map((r) => Math.abs(r.pct)));
line("F4-lim", "lim over committed+Hay 0/500 and committed+Hay 0/0",
  `${lim(budgetStatus(parseCSV(RAW.budget.trim() + "\n2026-09,Hay,0,500")))} / ${lim(budgetStatus(parseCSV(RAW.budget.trim() + "\n2026-09,Hay,0,0")))}`);

// ---- F5 blank / TBD next_due on an open task.
line("F5-blank", "'Heifers,Pregnancy check,2026-09-20,,open'", show(health("Heifers,Pregnancy check,2026-09-20,,open")));
line("F5-tbd", "next_due TBD", show(health("Heifers,Pregnancy check,2026-09-20,TBD,open")));

// ---- F6 Fly tag check row in committed data: Sep 1 -> Sep 30 = 29 days.
line("F6", "committed health alerts", show(real({}).filter((e) => e.area === "Health")));
console.log("F6-row | committed health.csv Fly tag line | " + RAW.health.split("\n").find((l) => l.includes("Fly tag")));

// ---- F7 percent only. 230/200 = 15% ($30); 109,500/100,000 = 9.5% ($9,500); 104,000/100,000 = 4% ($4,000).
line("F7", "Ear tags 200/230, Feed 100000/109500, Hay 100000/104000", show(budget("2026-09,Ear tags,200,230\n2026-09,Feed,100000,109500\n2026-09,Hay,100000,104000")));

// ---- F8 ordering of the committed serious rows.
line("F8", "committed data, all rows in order", real({}).map((e, i) => `${i + 1}.${e.severity[0]}:${e.area}:${e.subject.slice(0, 24)}`).join("  "));

// ---- F9 boundaries. 1050/1000 = 5.0%; 1096 = 9.6%; 1104 = 10.4%; 1100 = 10.0%.
for (const a of [1050, 1051, 1096, 1100, 1104]) line("F9", `X 1000/${a}`, show(budget(`2026-09,X,1000,${a}`)) + ` pct=${budgetStatus(parseCSV(BH + `2026-09,X,1000,${a}`))[0].pct}`);

// ---- F10 cents. Sums by hand: budgets 1265.97+1631.60+1855.07+2666.36 = 7,419.00; actuals 2041.13+2043.68+2039.34+2036.75 = 8,160.90.
// 8,160.90 / 7,419.00 = 1.1 exactly (7,419 x 1.1 = 8,160.9) -> exactly 10% -> should be warning like 1100/1000.
const cents = "2026-06,X,1265.97,2041.13\n2026-07,X,1631.6,2043.68\n2026-08,X,1855.07,2039.34\n2026-09,X,2666.36,2036.75";
const bc = budgetStatus(parseCSV(BH + cents))[0];
line("F10", "four cent rows, exact 10%", `budget=${bc.budget} actual=${bc.actual} pct=${bc.pct}; ${show(budget(cents))}`);
// how often does this happen with cents? random search over exact-10% cases with 4 monthly cent rows
{
  let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  let n = 0, flipped = 0;
  for (let i = 0; i < 20000; i++) {
    const bud = [0, 0, 0, 0].map(() => Math.round(100000 + rnd() * 400000));          // cents
    const tot = bud.reduce((s, x) => s + x, 0); if (tot % 10) continue;                // need actual = 1.1 x budget in whole cents
    const act = [0, 0, 0].map(() => Math.round(100000 + rnd() * 400000)); act.push(tot * 11 / 10 - act.reduce((s, x) => s + x, 0));
    if (act[3] <= 0) continue;
    n++;
    const rows = bud.map((b, k) => `2026-0${6 + k},X,${b / 100},${act[k] / 100}`).join("\n");
    if (budgetStatus(parseCSV(BH + rows))[0].pct > 0.1) flipped++;
  }
  line("F10-rate", "random exact-10% four-month cent ledgers", `${flipped} of ${n} computed as > 10% (serious)`);
}

// ---- F11 formatting. 1104.5 - 1000 = 104.5; 1060 - 1000 = 60.
line("F11", "X 1000/1104.5 and X 1000/1060", show(budget("2026-09,X,1000,1104.5")) + " ## " + show(budget("2026-09,X,1000,1060")));

// ---- F13 due today.
line("F13", "due 2026-09-30", show(health("Cows,Pinkeye check,2026-08-01,2026-09-30,open")));

// ---- F14 time part, two zones.
for (const tz of ["America/Chicago", "Europe/Berlin"]) {
  process.env.TZ = tz;
  line("F14", `TZ=${tz}, next_due '2026-09-30 00:00:00'`, show(health("Cows,Pinkeye check,2026-08-01,2026-09-30 00:00:00,open")));
}
process.env.TZ = "UTC";

// ---- F15 last_done after next_due.
line("F15", "'Yearlings,Booster vaccine,2026-09-20,2026-09-15,open'", show(health("Yearlings,Booster vaccine,2026-09-20,2026-09-15,open")));

// ---- F17 rules-table float.
line("F17", "0.07*100, 0.1*100, 0.05*100, 0.8*100, 0.5*100, 0.07*100 via template", `${0.07 * 100} ${0.1 * 100} ${0.05 * 100} ${0.8 * 100} ${0.5 * 100} \`${`${0.07 * 100}-${0.1 * 100}%`}\``);

// ================================================================ MISSED candidates
// M1 negative budget line (a credit/contra-expense such as NRCS cost-share or a fuel-tax refund, planned as -2,000).
// Received only 500 of the 2,000 credit -> net spend is 1,500 MORE than planned -> variance +1,500, 75% short of the plan.
const negRows = parseCSV(BH + "2026-09,Cost-share credit,-2000,-500");
const bn = budgetStatus(negRows)[0];
line("M1-neg", "'2026-09,Cost-share credit,-2000,-500'", `variance=${bn.variance} pct=${bn.pct}; alerts: ${show(budget("2026-09,Cost-share credit,-2000,-500"))}`);
// and the opposite: credit came in bigger than plan (-3,000 vs -2,000): variance -1,000 (good news) but pct +0.5
const bn2 = budgetStatus(parseCSV(BH + "2026-09,Cost-share credit,-2000,-3000"))[0];
line("M1-neg2", "'2026-09,Cost-share credit,-2000,-3000'", `variance=${bn2.variance} pct=${bn2.pct}; alerts: ${show(budget("2026-09,Cost-share credit,-2000,-3000"))}`);

// M2 order within one area and severity is file order, not worst first.
// Hand: A due Sep 29 = 1 day overdue; B due Jul 1 = 91 days overdue (Jul 1 -> Sep 30: 30 + 31 + 30 = 91).
line("M2-health", "A due 2026-09-29 listed before B due 2026-07-01", show(health("Yearlings,A shot,,2026-09-29,open\nCows,B shot,,2026-07-01,open")));
// Budget: Small 1000/1110 (11%, $110) listed before Big 10000/15000 (50%, $5,000).
line("M2-budget", "Small 1000/1110 before Big 10000/15000", show(budget("2026-09,Small,1000,1110\n2026-09,Big,10000,15000")));
