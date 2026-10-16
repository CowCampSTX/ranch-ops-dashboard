// Grazing-rule reproductions for the ranch operations dashboard: grazingStatus and the grazing block of
// findExceptions (exceptions.js), and grazingTimeline (app.js).
//
// Run from the repo root:   node docs/audit/diagnostics/grazing.repro.mjs
//
// Part 1 (G-*)  imports the REAL functions from exceptions.js and feeds them tiny inline move lists, or the committed
//               data with one row changed.
// Part 2 (GB-*) loads the real page (index.html + app.js + exceptions.js + data/, copied to a throwaway folder) in
//               headless Chromium and swaps CSVs per case with request interception. Used for problems that only show
//               in app.js. Skipped (with a note) if Playwright cannot be imported.
//   env PLAYWRIGHT_PATH     default /opt/node22/lib/node_modules/playwright/index.mjs
//   env GRAZING_REPRO_PORT  first port to try (default 8850; tries up to 8859)
//
// Every case prints
//   CASE <id>  <title>
//     expected: <worked out by hand with a calendar; the arithmetic is in the comment above the case>
//     actual:   <what the code produced, or the error it threw>
//     MATCH | MISMATCH
// Cases whose id contains "-C" are controls (behaviour that is correct) and should MATCH. Every other MISMATCH is a
// reproduced defect or design limit. The script never throws (each case runs in its own try/catch) and changes no
// repo file.
process.env.TZ = "UTC";   // date-only strings parse as UTC either way; this pins the one case that uses a time of day

import { readFileSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../../", import.meta.url);
const ROOT_DIR = fileURLToPath(ROOT);
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const AS_OF = "2026-09-30T18:00";

let X = null, RAW = {}, REAL = {};
try {
  X = await import(new URL("exceptions.js", ROOT).href);
  RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));
  REAL = Object.fromEntries(FILES.map((f) => [f, X.parseCSV(RAW[f])]));
} catch (e) {
  console.log(`SETUP FAILED: ${e && e.message}`);
}

const mv = (group, pasture_id, in_date, out_date = "") => ({ group, pasture_id, in_date, out_date });
const isYOpen = (m) => m.group === "Yearlings" && !m.out_date;              // the Yearlings' Sand Hills stay
const movesWith = (drop, add = []) => [...REAL.moves.filter((m) => !drop(m)), ...add];
const run = (over = {}, asOf = AS_OF) => X.findExceptions({ ...REAL, ...over, meta: [{ as_of: asOf }] });
const graz = (exc) => exc.filter((e) => e.area === "Grazing");
const fmt = (rows) => (rows.length ? rows.map((e) => `[${e.severity}] ${e.subject} | ${e.problem} | ${e.action}`).join("  ||  ") : "(no rows)");
const attempt = (fn) => { try { return { v: fn(), err: null }; } catch (e) { return { v: null, err: e }; } };
const errText = (e) => `threw ${e.constructor.name}: ${e.message}`;

let nMatch = 0, nMismatch = 0, nCrash = 0;
const print = (id, title, expected, actual, ok) => {
  console.log(`CASE ${id}  ${title}\n  expected: ${expected}\n  actual:   ${actual}\n  ${ok ? "MATCH" : "MISMATCH"}\n`);
  ok ? nMatch++ : nMismatch++;
};
function cse(id, title, expected, fn) {
  try { const { actual, ok } = fn(); print(id, title, expected, actual, ok); }
  catch (e) { nCrash++; print(id, title, expected, `repro itself threw: ${e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e}`, false); }
}
async function acse(id, title, expected, fn) {
  try { const { actual, ok } = await fn(); print(id, title, expected, actual, ok); }
  catch (e) { nCrash++; print(id, title, expected, `repro itself threw: ${e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e}`, false); }
}

// Calendar used below (worked by hand): June 30 days, July 31, August 31, September 30.
// Committed data: Yearlings entered Sand Hills (P3, 21-day plan) on Sep 6 -> planned move Sep 27 -> Sep 30 is 3 days
// past it. Cows: South Divide (P7, 21) since Sep 12 -> due Oct 3, 3 days away. Heifers: Lone Tree (P4, 14) since
// Sep 19 -> due Oct 3, 3 days away. With a 2-day grace, only the Yearlings are flagged.

console.log("=== Part 1: real exceptions.js functions ===\n");

// ------------------------------------------------------------------------------------------------ controls
cse("G-C1", "control: committed data gives exactly the planted grazing alert",
  "one row: [serious] Yearlings in Sand Hills | ... (3 days over)", () => {
    const g = graz(run());
    return { actual: fmt(g), ok: g.length === 1 && g[0].severity === "serious" && g[0].subject === "Yearlings in Sand Hills" && g[0].problem.includes("(3 days over)") };
  });

// Sand Hills 21-day plan, as of Sep 30: in Sep 8 -> due Sep 29 -> 1 day over; Sep 10 -> due Oct 1 -> in 1 day;
// Sep 11 -> due Oct 2 -> in 2 days (inside the grace); Sep 12 -> due Oct 3 -> 3 days away -> nothing.
cse("G-C2", "control: thresholds and pluralisation around the plan and the 2-day grace",
  "Sep8 serious '(1 day over)'; Sep10 warning 'in 1 day'; Sep11 warning 'in 2 days'; Sep12 none", () => {
    const one = (d) => graz(run({ moves: [mv("Yearlings", "P3", d)] }));
    const r = { s8: one("2026-09-08"), s10: one("2026-09-10"), s11: one("2026-09-11"), s12: one("2026-09-12") };
    return { actual: Object.entries(r).map(([k, v]) => `${k}: ${fmt(v)}`).join("  ##  "),
      ok: r.s8[0]?.severity === "serious" && r.s8[0].problem.endsWith("(1 day over)") && r.s10[0]?.problem === "Planned move in 1 day" &&
          r.s11[0]?.problem === "Planned move in 2 days" && r.s12.length === 0 };
  });

cse("G-C3", "control: an unknown pasture_id in a CLOSED move does not break findExceptions",
  "no throw; same single Yearlings row as G-C1", () => {
    const r = attempt(() => graz(run({ moves: movesWith(() => false, [mv("Yearlings", "P9", "2026-05-01", "2026-05-20")]) })));
    return { actual: r.err ? errText(r.err) : fmt(r.v), ok: !r.err && r.v.length === 1 && r.v[0].subject === "Yearlings in Sand Hills" };
  });

// Bulls into Home Trap (P8, 10-day plan) Sep 1 -> due Sep 11 -> Sep 30 is 19 days past it.
cse("G-C4", "control: a group in moves.csv but not in groups.csv still gets its grazing alert",
  "[serious] Bulls in Home Trap | ... (19 days over)", () => {
    const g = graz(run({ moves: movesWith(() => false, [mv("Bulls", "P8", "2026-09-01")]) })).filter((e) => e.subject.startsWith("Bulls"));
    return { actual: fmt(g), ok: g.length === 1 && g[0].problem.includes("(19 days over)") };
  });

// Heifers leave Lone Tree Sep 25 and join the Cows in South Divide (P7). Tank T4 (the planted leak) re-pointed at P7
// so there is a water alert on that pasture to carry the "here now" context.
cse("G-C5", "control: the water alert names both groups when two share a pasture",
  "Tank T4 (South Divide, Cows and Heifers here now)", () => {
    const moves = movesWith((m) => m.group === "Heifers" && !m.out_date, [mv("Heifers", "P4", "2026-09-19", "2026-09-25"), mv("Heifers", "P7", "2026-09-25")]);
    const water = REAL.water.map((r) => (r.tank_id === "T4" ? { ...r, pasture_id: "P7" } : r));
    const w = run({ moves, water }).filter((e) => e.subject.startsWith("Tank T4"));
    return { actual: w.map((e) => e.subject).join(" | "), ok: w.length === 1 && w[0].subject === "Tank T4 (South Divide, Cows and Heifers here now)" };
  });

// The Yearlings' closed Creek Bottom stay edited to end Aug 30 although they entered South Divide Aug 25.
cse("G-C6", "control: an overlapping CLOSED stay does not change the alerts (only open moves are judged)",
  "same single Yearlings row as G-C1", () => {
    const g = graz(run({ moves: REAL.moves.map((m) => (m.group === "Yearlings" && m.pasture_id === "P5" ? { ...m, out_date: "2026-08-30" } : m)) }));
    return { actual: fmt(g), ok: g.length === 1 && g[0].subject === "Yearlings in Sand Hills" && g[0].problem.includes("(3 days over)") };
  });

// ------------------------------------------------------------------------------------------------ crashes
// One typo in the open Yearlings row (P9 is not in pastures.csv). The other alerts do not depend on it: the committed
// data has 10 alerts, 1 of them grazing, so at least 9 should still come back.
cse("G-01", "unknown pasture_id (P9) in an OPEN move",
  "no throw; the 9 non-grazing alerts (T2 low, T4 leak, T6 silent, ...) still returned, plus some data-problem row", () => {
    const r = attempt(() => run({ moves: movesWith(isYOpen, [mv("Yearlings", "P9", "2026-09-06")]) }));
    return { actual: r.err ? `${errText(r.err)} -> findExceptions returns nothing at all` : `${r.v.length} rows`, ok: !r.err && r.v.length >= 9 };
  });

cse("G-02", "pasture_id that differs only by case ('p3') or a trailing space ('P3 ') in an open move",
  "matched to Sand Hills or reported as unknown; never a throw", () => {
    const a = attempt(() => run({ moves: movesWith(isYOpen, [mv("Yearlings", "p3", "2026-09-06")]) }));
    const b = attempt(() => run({ moves: movesWith(isYOpen, [mv("Yearlings", "P3 ", "2026-09-06")]) }));
    return { actual: `'p3': ${a.err ? errText(a.err) : a.v.length + " rows"}; 'P3 ': ${b.err ? errText(b.err) : b.v.length + " rows"}`, ok: !a.err && !b.err };
  });

// ------------------------------------------------------------------------------------------------ which move is current
// The Yearlings' South Divide row (in Aug 25) is left open by mistake; the Sep 6 Sand Hills row is also open. A group
// is in one place; the later in_date is where they are. South Divide would read Aug 25 + 21 = Sep 15 -> 15 days over.
cse("G-03", "a group with two open moves (the previous move was never closed)",
  "one Yearlings row (Sand Hills, 3 days over); no 'Yearlings in South Divide ... 15 days over' false alarm", () => {
    const moves = REAL.moves.map((m) => (m.group === "Yearlings" && m.pasture_id === "P7" ? { ...m, out_date: "" } : m));
    const g = graz(run({ moves })).filter((e) => e.subject.startsWith("Yearlings"));
    return { actual: fmt(g), ok: g.length === 1 && g[0].subject === "Yearlings in Sand Hills" };
  });

cse("G-04", "the open move row duplicated (export or copy-paste)",
  "one Yearlings row; 10 alerts in total (as on the committed data)", () => {
    const exc = run({ moves: [...REAL.moves, mv("Yearlings", "P3", "2026-09-06")] });
    const g = graz(exc);
    return { actual: `${exc.length} alerts in total; grazing: ${fmt(g)}`, ok: g.length === 1 && exc.length === 10 };
  });

// Data exported on Oct 3, dashboard set to as-of Sep 30: the Sand Hills stay already carries out_date Oct 3. On Sep 30
// the Yearlings were still in Sand Hills (Sep 6 + 21 = Sep 27, so 3 days over).
cse("G-05", "out_date AFTER as_of (the stay was still current at the as-of time)",
  "[serious] Yearlings in Sand Hills | ... (3 days over)", () => {
    const moves = movesWith(isYOpen, [mv("Yearlings", "P3", "2026-09-06", "2026-10-03")]);
    const g = graz(run({ moves })).filter((e) => e.subject.startsWith("Yearlings"));
    const where = X.grazingStatus(moves, REAL.pastures, AS_OF).filter((s) => s.group === "Yearlings").map((s) => s.pasture);
    return { actual: `${fmt(g)}  ## grazingStatus places the Yearlings in: ${where.join(", ") || "(nowhere)"}`, ok: g.length === 1 && g[0].severity === "serious" };
  });

// Historical reconstruction on the committed moves: set as_of to Aug 20. The Cows were in Cedar Draw (P6, 18-day plan)
// from Jul 31 to Aug 22: Jul 31 + 18 = Aug 18 -> Aug 20 is 2 days over. Heifers: Home Trap Aug 16 (+10 = Aug 26, 6
// days away). Yearlings: Creek Bottom Aug 11 (+14 = Aug 25, 5 days away). So exactly one grazing row.
cse("G-06", "as_of earlier than the latest moves (look at the board as it was on Aug 20)",
  "one row: [serious] Cows in Cedar Draw | ... (2 days over)", () => {
    const g = graz(run({}, "2026-08-20T18:00"));
    const gs = X.grazingStatus(REAL.moves, REAL.pastures, "2026-08-20T18:00").map((s) => `${s.group}@${s.pastureId} days=${s.days}`);
    return { actual: `${fmt(g)}  ## grazingStatus: ${gs.join(", ")}`, ok: g.length === 1 && g[0].subject === "Cows in Cedar Draw" && g[0].problem.includes("(2 days over)") };
  });

// A move entered ahead of time: Sand Hills closes Oct 2 and an open Windmill (P2) row starts Oct 2. On Sep 30 the
// Yearlings are still in Sand Hills (3 days over), and nobody is in Windmill (Cows left Jul 31, Yearlings Aug 11), so
// the planted critical T2 alert should carry no "here now".
cse("G-07", "a FUTURE move (in_date after as_of) entered ahead of time",
  "[serious] Yearlings in Sand Hills (3 days over) AND water subject 'Tank T2 (Windmill)'", () => {
    const moves = movesWith(isYOpen, [mv("Yearlings", "P3", "2026-09-06", "2026-10-02"), mv("Yearlings", "P2", "2026-10-02")]);
    const exc = run({ moves });
    const g = graz(exc).filter((e) => e.subject.startsWith("Yearlings"));
    const t2 = exc.filter((e) => e.subject.startsWith("Tank T2"));
    return { actual: `grazing: ${fmt(g)}  ## T2: ${t2.map((e) => `[${e.severity}] ${e.subject}`).join(" | ")}`,
      ok: g.length === 1 && g[0].subject === "Yearlings in Sand Hills" && t2.length === 1 && t2[0].subject === "Tank T2 (Windmill)" };
  });

// The Yearlings' Sand Hills stay is closed Sep 28 and the next move has not been entered. groups.csv still lists
// 150 yearlings on grass, so where they are is unknown.
cse("G-08", "a group in groups.csv with no open move (next move not yet recorded)",
  "a row saying the Yearlings (150 head) have no current pasture on record", () => {
    const moves = movesWith(isYOpen, [mv("Yearlings", "P3", "2026-09-06", "2026-09-28")]);
    const exc = run({ moves });
    const y = exc.filter((e) => e.area === "Grazing" && e.subject.includes("Yearlings"));
    const located = X.grazingStatus(moves, REAL.pastures, AS_OF).map((s) => s.group);
    return { actual: `grazing rows naming Yearlings: ${fmt(y)}  ## groups with a current pasture: ${located.join(", ")}  ## total alerts ${exc.length}`, ok: y.length >= 1 };
  });

// ------------------------------------------------------------------------------------------------ bad values
cse("G-09", "blank in_date on the open move",
  "a data-problem row for the Yearlings (they cannot be judged), not silence", () => {
    const exc = run({ moves: movesWith(isYOpen, [mv("Yearlings", "P3", "")]) });
    const y = exc.filter((e) => e.subject.includes("Yearlings") && e.area === "Grazing");
    const gs = X.grazingStatus(movesWith(isYOpen, [mv("Yearlings", "P3", "")]), REAL.pastures, AS_OF).find((s) => s.group === "Yearlings");
    return { actual: `grazing rows naming Yearlings: ${fmt(y)}  ## grazingStatus days=${gs.days} -> over=${gs.days - gs.planned}; (NaN > 0) and (NaN >= -2) are both false`, ok: y.length >= 1 };
  });

// in_date exported with a time of day (06:00 Sep 6). Whole days from Sep 6 to Sep 30 = 24; 3 past the Sep 27 move.
cse("G-10", "in_date that carries a time of day ('2026-09-06T06:00')",
  "whole days: 'Day 24 of a 21-day plan (3 days over)' (or the time used consistently on both ends)", () => {
    const g = graz(run({ moves: [mv("Yearlings", "P3", "2026-09-06T06:00")] }));
    return { actual: fmt(g), ok: g[0]?.problem === "Day 24 of a 21-day plan (3 days over)" };
  });

cse("G-11", "blank planned_graze_days for the pasture a group is in",
  "a 'no plan recorded for Sand Hills' row; no text like 'a -day plan'", () => {
    const g = graz(run({ pastures: REAL.pastures.map((p) => (p.pasture_id === "P3" ? { ...p, planned_graze_days: "" } : p)) }));
    return { actual: fmt(g), ok: g.every((e) => !/ -day plan/.test(e.problem)) };
  });

// ------------------------------------------------------------------------------------------------ wording
// Arrival Sep 6. Counting the arrival day as Day 1 (Sep 6 = Day 1, Sep 7 = Day 2, ...), Sep 30 is Day 25. Days
// elapsed is 24. "(3 days over)" is right (planned move Sep 27). The label should say Day 25, or "24 days in".
cse("G-12", "'Day N of a P-day plan' prints days elapsed as if it were the day number",
  "'Day 25 of a 21-day plan' (arrival day = Day 1) or '24 days in'", () => {
    const g = graz(run());
    return { actual: g[0]?.problem ?? "(none)", ok: /Day 25 |24 days in/.test(g[0]?.problem ?? "") };
  });

// In Sep 9 + 21 = Sep 30 = the as-of date: the move is due today.
cse("G-13", "move due on the as-of date",
  "warning worded like 'Planned move is today'", () => {
    const g = graz(run({ moves: [mv("Yearlings", "P3", "2026-09-09")] }));
    return { actual: fmt(g), ok: g.length === 1 && /today/i.test(g[0].problem) };
  });

// ------------------------------------------------------------------------------------------------ rules that do not exist
cse("G-14", "min_rest_days (a column of pastures.csv, listed in the README) is read by any code",
  "at least one reference in exceptions.js or app.js", () => {
    const n = ["exceptions.js", "app.js"].map((f) => [f, (readFileSync(new URL(f, ROOT), "utf8").match(/min_rest|rest_days|minRest|\brest\b/gi) || []).length]);
    return { actual: n.map(([f, k]) => `${f}: ${k} references`).join(", "), ok: n.some(([, k]) => k > 0) };
  });

// Independent method (day-by-day occupancy calendar over the committed moves; open stays run to Sep 30):
// rest before a stay = days between the previous out_date in that pasture (any group) and this in_date.
// Worked by hand for the two current stays that started inside the minimum rest:
//   Cows into South Divide (P7) Sep 12; Yearlings left P7 Sep 6        -> 6 days of a 60-day minimum
//   Heifers into Lone Tree (P4) Sep 19; Heifers left P4 Aug 16         -> 15 (Aug 17-31) + 19 = 34 of 45
//   Yearlings into Sand Hills (P3) Sep 6; Yearlings left P3 Jun 22      -> 8 + 31 + 31 + 6 = 76 of 60: fine
const DAYMS = 864e5, iso = (t) => new Date(t).toISOString().slice(0, 10);
function occupancy(moves, from = "2026-06-01", to = "2026-09-30") {
  const cal = {};                                  // pasture -> date -> [groups]
  for (const m of moves) {
    const end = m.out_date || iso(Date.parse(to) + DAYMS);    // open stays occupy through the as-of day
    for (let t = Date.parse(m.in_date); t < Date.parse(end) && t <= Date.parse(to); t += DAYMS)
      ((cal[m.pasture_id] ??= {})[iso(t)] ??= []).push(m.group);
  }
  return cal;
}
function restBefore(cal, pid, inDate, from = "2026-06-01") {
  let n = 0, t = Date.parse(inDate) - DAYMS;
  for (; t >= Date.parse(from); t -= DAYMS, n++) if (cal[pid]?.[iso(t)]?.length) return n;
  return null;                                     // never grazed earlier this season
}
cse("G-15", "current stays that began inside the pasture's minimum rest (committed data)",
  "2 rows about rest: Cows in South Divide (6 of 60 days), Heifers in Lone Tree (34 of 45)", () => {
    const cal = occupancy(REAL.moves);
    const minRest = Object.fromEntries(REAL.pastures.map((p) => [p.pasture_id, p.min_rest_days]));
    const cur = REAL.moves.filter((m) => !m.out_date).map((m) => `${m.group}@${m.pasture_id} rest ${restBefore(cal, m.pasture_id, m.in_date)}/${minRest[m.pasture_id]}`);
    const rows = run().filter((e) => /rest/i.test(e.problem + " " + e.action));
    return { actual: `rows mentioning rest: ${rows.length}  ## occupancy calendar says: ${cur.join(", ")}`, ok: rows.length === 2 };
  });

// The same calendar over the whole season: the example rotation the README presents as realistic.
cse("G-16", "the committed example season: shared pastures and short rest that no rule reports",
  "for a credible example either none, or the dashboard reports them; hand-checked: Windmill shared Jul 24-30 (Cows+Yearlings), Lone Tree shared Jun 25-Jul 5 (Yearlings+Heifers)", () => {
    const cal = occupancy(REAL.moves);
    const shared = [];
    for (const [pid, days] of Object.entries(cal)) {
      const ds = Object.entries(days).filter(([, g]) => new Set(g).size > 1).map(([d, g]) => [d, [...new Set(g)].join("+")]);
      if (ds.length) shared.push(`${pid} ${ds[0][0]}..${ds[ds.length - 1][0]} (${ds.length} days, ${ds[0][1]})`);
    }
    const minRest = Object.fromEntries(REAL.pastures.map((p) => [p.pasture_id, p.min_rest_days]));
    let reentries = 0, short = 0;
    for (const m of REAL.moves) {
      const r = restBefore(cal, m.pasture_id, m.in_date);
      if (r === null) continue;
      reentries++; if (r < minRest[m.pasture_id]) short++;
    }
    const flagged = run().filter((e) => /rest|share|overlap/i.test(e.problem + " " + e.action)).length;
    return { actual: `pastures with two groups at once: ${shared.join("; ")}  ## stays re-entering a grazed pasture: ${reentries}, of them short of min rest: ${short}  ## dashboard rows about any of this: ${flagged}`,
      ok: shared.length === 0 || flagged > 0 };
  });

// Heifers join the Cows in South Divide on Sep 25. The 21-day plan is one number per pasture; with 180 pairs plus 45
// heifers on it the grass goes faster. Cows: Sep 12 -> day 18 of 21; Heifers: Sep 25 -> day 5 of 21. Neither crosses.
cse("G-17", "two groups in one pasture are each judged alone against a one-group plan",
  "at least a note that South Divide carries two groups (Cows and Heifers)", () => {
    const moves = movesWith((m) => m.group === "Heifers" && !m.out_date, [mv("Heifers", "P4", "2026-09-19", "2026-09-25"), mv("Heifers", "P7", "2026-09-25")]);
    const g = graz(run({ moves })).filter((e) => e.subject.includes("South Divide"));
    const gs = X.grazingStatus(moves, REAL.pastures, AS_OF).filter((s) => s.pastureId === "P7").map((s) => `${s.group} day ${s.days} of ${s.planned}`);
    return { actual: `rows naming South Divide: ${fmt(g)}  ## grazingStatus in P7: ${gs.join(", ")}`, ok: g.length >= 1 };
  });

// One fixed sentence whatever the overrun. In Sep 8 -> 1 day over; Aug 10 -> due Aug 31 -> 30 over; Jun 11 -> due
// Jul 2 -> 90 over (Jul 2 + 29 = Jul 31, + 31 = Aug 31, + 30 = Sep 30: 90).
cse("G-18", "the serious grazing action is the same for 1, 30 or 90 days over",
  "severity or advice changes with the size of the overrun", () => {
    const at = (d) => graz(run({ moves: [mv("Yearlings", "P3", d)] }))[0];
    const a = at("2026-09-08"), b = at("2026-08-10"), c = at("2026-06-11");
    return { actual: [a, b, c].map((e) => `[${e.severity}] ${e.problem} -> ${e.action}`).join("  ##  "),
      ok: new Set([a, b, c].map((e) => e.severity + e.action)).size > 1 };
  });

// Where could the Yearlings go on Sep 30? Rest = as-of date minus the last out_date (same convention as G-15), by hand:
// P3, P4, P7 occupied; P1 North Flat Sep 30 - Sep 12 = 18 of 45; P5 Creek Bottom Sep 30 - Sep 9 = 21 of 45;
// P6 Cedar Draw Sep 30 - Aug 22 = 9 (Aug 22 -> Aug 31) + 30 = 39 of 45; P8 Home Trap Sep 30 -
// Sep 19 = 11 of 30; P2 Windmill Sep 30 - Aug 11 = 20 + 30 = 50 of 45. Windmill is the only rested pasture, and its
// tank T2 is the planted critical (11.8%). Neither alert says so.
cse("G-19", "'Move them' with no destination: the only rested pasture is the one with a critically low tank",
  "the grazing row, or the T2 row, connects the two (e.g. names Windmill as the only rested pasture)", () => {
    const cal = occupancy(REAL.moves);
    const occ = new Set(REAL.moves.filter((m) => !m.out_date).map((m) => m.pasture_id));
    const ready = REAL.pastures.filter((p) => !occ.has(p.pasture_id)).map((p) => {
      const r = restBefore(cal, p.pasture_id, "2026-09-30");
      return `${p.pasture_id} ${p.name} ${r}/${p.min_rest_days}${r >= p.min_rest_days ? " READY" : ""}`;
    });
    const exc = run();
    const y = graz(exc)[0], t2 = exc.find((e) => e.subject.startsWith("Tank T2"));
    return { actual: `free pastures (rest/min): ${ready.join(", ")}  ## grazing: ${y.action}  ## T2: [${t2.severity}] ${t2.subject} | ${t2.problem}`,
      ok: /Windmill/.test(y.action) || /Yearlings|rested/.test(t2.subject + t2.problem + t2.action) };
  });

// ================================================================================================ Part 2
console.log("=== Part 2: app.js grazingTimeline in headless Chromium ===\n");

const PW = process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs";
let chromium = null;
try { ({ chromium } = await import(PW)); } catch (e) { console.log(`(Part 2 skipped: cannot import Playwright from ${PW}: ${e.message})\n`); }

const toCSV = (rows) => "group,pasture_id,in_date,out_date\n" + rows.map((m) => [m.group, m.pasture_id, m.in_date, m.out_date].join(",")).join("\n") + "\n";
const shiftDates = (text, n) => text.replace(/\b(\d{4})-(\d{2})-(\d{2})/g, (_, y, mo, d) => iso(Date.UTC(+y, +mo - 1, +d) + n * DAYMS));

async function startServer(dir) {
  const first = Number(process.env.GRAZING_REPRO_PORT || 8850);
  for (let port = first; port <= 8859; port++) {
    const proc = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", dir], { stdio: "ignore" });
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 100));
      if (proc.exitCode !== null) break;
      try { const r = await fetch(`http://127.0.0.1:${port}/index.html`); if (r.ok) return { proc, port }; } catch {}
    }
    try { proc.kill(); } catch {}
  }
  throw new Error("no free port in 8850-8859");
}

async function pageState(browser, base, over) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.route("**/data/*.csv", (route) => {
    const f = new URL(route.request().url()).pathname.split("/").pop().replace(".csv", "");
    return f in over ? route.fulfill({ status: 200, contentType: "text/csv", body: over[f] }) : route.continue();
  });
  await page.goto(`${base}/index.html`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  const s = await page.evaluate(() => {
    const gz = document.querySelector("#grazing svg");
    const num = (el, a) => +(+el.getAttribute(a)).toFixed(1);
    const rects = gz ? [...gz.querySelectorAll("rect")] : [];
    return {
      asof: document.getElementById("asof").textContent,
      tiles: document.querySelectorAll("#tiles .tile").length,
      rows: [...document.querySelectorAll("#exceptions tr")].slice(1).map((r) => r.textContent.replace(/\s+/g, " ").trim()),
      water: document.querySelectorAll("#water .mini").length,
      grazing: !!gz, gain: !!document.querySelector("#gain svg"), budget: !!document.querySelector("#budgetChart svg"),
      rules: document.querySelectorAll("#rules tr").length,
      labels: gz ? [...gz.querySelectorAll("text.lbl")].map((t) => t.textContent) : [],
      months: gz ? [...gz.querySelectorAll("text")].filter((t) => /^[A-Z][a-z]{2}$/.test(t.textContent)).map((t) => ({ m: t.textContent, x: num(t, "x") })) : [],
      over: gz ? [...gz.querySelectorAll("text.ink")].map((t) => ({ s: t.textContent, x: num(t, "x"), y: num(t, "y") })) : [],
      red: rects.filter((r) => r.getAttribute("fill") === "var(--serious)").map((r) => ({ x: num(r, "x"), w: num(r, "width"), y: num(r, "y") })),
      bars: rects.filter((r) => ["var(--s1)", "var(--bar)"].includes(r.getAttribute("fill")))
        .map((r) => ({ x: num(r, "x"), w: num(r, "width"), y: num(r, "y"), cur: r.getAttribute("fill") === "var(--s1)" })),
    };
  });
  await page.close();
  return { ...s, errs };
}
const summary = (s) => `pageErrors=${JSON.stringify(s.errs)} asofLine=${JSON.stringify(s.asof.slice(0, 30))} tiles=${s.tiles} alertRows=${s.rows.length} waterCharts=${s.water} grazingChart=${s.grazing} gainChart=${s.gain} budgetChart=${s.budget} rulesRows=${s.rules}`;
const months = (s) => s.months.map((m) => `${m.m}@x=${m.x}`).join(" ") || "(none)";

// Timeline geometry (app.js): viewBox width 560, margins l=74 r=10, so the plot is x = 74..550 and the as-of date sits
// at 550. Committed data: axis Jun 1 .. Sep 30 = 121 days, x(day n) = 74 + n/121*476. Season day numbers by hand:
// Sep 6 = 97, Sep 15 = 106, Sep 27 = 118, Oct 2 = 123, Oct 3 = 124.
const PLOT_L = 74, PLOT_R = 550, VB_W = 560;

if (chromium && X) {
  let server = null, browser = null, work = null;
  try {
    work = mkdtempSync(join(tmpdir(), "grazing-repro-"));
    for (const f of ["index.html", "app.js", "exceptions.js"]) cpSync(join(ROOT_DIR, f), join(work, f));
    cpSync(join(ROOT_DIR, "data"), join(work, "data"), { recursive: true });
    server = await startServer(work);
    browser = await chromium.launch();
    const base = `http://127.0.0.1:${server.port}`;
    console.log(`(serving a throwaway copy from ${work} on port ${server.port})\n`);
    const st = (over) => pageState(browser, base, over);

    // Sep 27 (day 118): 74 + 118/121*476 = 538.2. One overrun label "+3d" at the as-of end of the Yearlings row.
    await acse("GB-C0", "control: committed data renders the whole page and one '+3d' overrun",
      "no page errors, 10 alert rows, 5 tiles; one '+3d'; red segment from x=538.2; months Jun,Jul,Aug,Sep inside x 74..560", async () => {
        const s = await st({});
        return { actual: `${summary(s)} over=${JSON.stringify(s.over)} red=${JSON.stringify(s.red)} months=${months(s)}`,
          ok: !s.errs.length && s.rows.length === 10 && s.tiles === 5 && s.over.length === 1 && s.over[0].s === "+3d" && Math.abs(s.red[0].x - 538.2) < 0.15 &&
            s.months.map((m) => m.m).join() === "Jun,Jul,Aug,Sep" && s.months.every((m) => m.x >= PLOT_L && m.x <= VB_W) };
      });

    await acse("GB-01", "unknown pasture_id (P9) in an OPEN move: what the manager sees",
      "the 9 non-grazing alerts (T2 low, T4 leak, T6 silent, ...) listed; tiles and charts drawn; the problem named", async () => {
        const s = await st({ moves: toCSV(movesWith(isYOpen, [mv("Yearlings", "P9", "2026-09-06")])) });
        return { actual: summary(s), ok: s.rows.length >= 9 && s.tiles === 5 };
      });

    await acse("GB-02", "unknown pasture_id (P9) in a CLOSED May move: the rest of the page",
      "10 alert rows AND the grazing, gain and budget charts and the 12-row rules table", async () => {
        const s = await st({ moves: toCSV(movesWith(() => false, [mv("Yearlings", "P9", "2026-05-01", "2026-05-20")])) });
        return { actual: summary(s), ok: s.rows.length === 10 && s.grazing && s.gain && s.budget && s.rules === 12 };
      });

    // Two open Yearlings moves (G-03). The table says South Divide is 15 days over (red would start Sep 15: x=491.0).
    await acse("GB-03", "two open moves for one group: what the timeline shows next to the table's '15 days over'",
      "the chart agrees with the table: a '+15d' mark for South Divide (or a single current bar and no 15-day alert)", async () => {
        const s = await st({ moves: toCSV(REAL.moves.map((m) => (m.group === "Yearlings" && m.pasture_id === "P7" ? { ...m, out_date: "" } : m))) });
        const y = s.rows.filter((r) => r.includes("Yearlings in"));
        const yRow = Math.max(...s.bars.map((b) => b.y));
        return { actual: `table: ${JSON.stringify(y)} ## overrun labels: ${JSON.stringify(s.over)} ## red: ${JSON.stringify(s.red)} ## current bars on the Yearlings row: ${JSON.stringify(s.bars.filter((b) => b.y === yRow && b.cur))}`,
          ok: !(y.some((r) => r.includes("15 days over")) && !s.over.some((o) => o.s === "+15d")) };
      });

    // out_date Oct 3 on the Sand Hills stay (G-05). x(Oct 3) = 74 + 124/121*476 = 561.8, past the plot edge (550).
    await acse("GB-04", "out_date after as_of: the Yearlings' Sand Hills bar",
      "still drawn as current (green), ending at the as-of line (x <= 550), with its '+3d'", async () => {
        const s = await st({ moves: toCSV(movesWith(isYOpen, [mv("Yearlings", "P3", "2026-09-06", "2026-10-03")])) });
        const yRow = Math.max(...s.bars.map((b) => b.y));
        const last = s.bars.filter((b) => b.y === yRow).sort((a, b) => a.x - b.x).pop();
        return { actual: `last Yearlings bar x=${last.x} right end=${(last.x + last.w).toFixed(1)} current=${last.cur}; overrun labels=${JSON.stringify(s.over)}`,
          ok: last.cur && last.x + last.w <= PLOT_R + 0.5 && s.over.some((o) => o.s === "+3d") };
      });

    // Future move (G-07): open Windmill row from Oct 2. x(Oct 2) = 74 + 123/121*476 = 557.9 -> bar at 558.9, past 550.
    await acse("GB-05", "future open move: where the 'current' bar is drawn",
      "the current (green) bar is Sand Hills, ending at x <= 550 with '+3d'; nothing drawn right of the as-of line", async () => {
        const s = await st({ moves: toCSV(movesWith(isYOpen, [mv("Yearlings", "P3", "2026-09-06", "2026-10-02"), mv("Yearlings", "P2", "2026-10-02")])) });
        const yRow = Math.max(...s.bars.map((b) => b.y));
        const cur = s.bars.filter((b) => b.y === yRow && b.cur);
        return { actual: `current bars on the Yearlings row: ${JSON.stringify(cur)}; overrun labels=${JSON.stringify(s.over)}`,
          ok: cur.length === 1 && cur[0].x + cur[0].w <= PLOT_R + 0.5 && cur[0].x < 500 && s.over.some((o) => o.s === "+3d") };
      });

    await acse("GB-06", "group in moves.csv but not in groups.csv: timeline row",
      "the table shows 'Bulls in Home Trap' AND the timeline has a Bulls row", async () => {
        const s = await st({ moves: toCSV(movesWith(() => false, [mv("Bulls", "P8", "2026-09-01")])) });
        return { actual: `alert rows naming Bulls=${s.rows.filter((r) => r.includes("Bulls")).length}; timeline rows=${JSON.stringify(s.labels)}`,
          ok: s.rows.some((r) => r.includes("Bulls")) && s.labels.includes("Bulls") };
      });

    await acse("GB-07", "group in groups.csv with no moves at all (6 bulls added to groups.csv)",
      "the Bulls row says no pasture on record (a label or an alert), not an empty row", async () => {
        const s = await st({ groups: RAW.groups.trimEnd() + "\r\nBulls,herd bulls,6,0.0\r\n" });
        const bullRowY = 6 + 3 * 46 + 8;        // m.t + i*rowH + 8 for the 4th row
        return { actual: `timeline rows=${JSON.stringify(s.labels)}; bars on the Bulls row=${s.bars.filter((b) => b.y === bullRowY).length}; alert rows naming Bulls=${s.rows.filter((r) => r.includes("Bulls")).length}`,
          ok: s.rows.some((r) => r.includes("Bulls")) };
      });

    // A blank in_date on the open move. Expected: the rest of the timeline still drawn, the bad row named.
    await acse("GB-08", "blank in_date on one open move: the whole timeline",
      "the other 22 bars drawn at real positions; an alert or label naming the bad row", async () => {
        const s = await st({ moves: toCSV(movesWith(isYOpen, [mv("Yearlings", "P3", "")])) });
        const finite = s.bars.filter((b) => Number.isFinite(b.x)).length;
        return { actual: `bars with a numeric x: ${finite} of ${s.bars.length}; months=${months(s)}; alert rows naming Yearlings in a pasture: ${s.rows.filter((r) => r.includes("Yearlings in")).length}; alert rows total: ${s.rows.length}`,
          ok: finite >= 22 };
      });

    // Grazing that started Apr 15 (Cows on Home Trap Apr 15 - Jun 1). Month starts inside Apr 15..Sep 30: May 1 ..Sep 1.
    await acse("GB-09", "moves before June 1: month ticks are hard-coded to Jun..Sep 2026",
      "month labels May,Jun,Jul,Aug,Sep", async () => {
        const s = await st({ moves: toCSV([mv("Cows", "P8", "2026-04-15", "2026-06-01"), ...REAL.moves]) });
        return { actual: `months=${months(s)}`, ok: s.months.map((m) => m.m).join() === "May,Jun,Jul,Aug,Sep" };
      });

    // First move Jun 15: axis Jun 15..Sep 30 = 107 days. Jun 1 is 14 days before the axis start:
    // x = 74 - 14/107*476 = 11.7 (label at 14.7), inside the group-name column.
    await acse("GB-10", "season starting after June 1: the June tick lands in the group-name column",
      "no month label left of the plot (all x >= 74): Jul,Aug,Sep", async () => {
        const s = await st({ moves: toCSV([mv("Cows", "P7", "2026-06-15", "2026-07-20"), mv("Cows", "P1", "2026-07-20", "2026-08-22"), mv("Cows", "P7", "2026-09-12"),
          mv("Heifers", "P8", "2026-06-20", "2026-07-10"), mv("Heifers", "P4", "2026-09-19"), mv("Yearlings", "P3", "2026-06-15", "2026-07-01"), mv("Yearlings", "P3", "2026-09-06")]) });
        return { actual: `months=${months(s)}`, ok: s.months.every((m) => m.x >= PLOT_L) && s.months.map((m) => m.m).join() === "Jul,Aug,Sep" };
      });

    // The whole dataset one year earlier (2025). 2026-06-01 is 365 days after the axis start: x = 74 + 365/121*476 = 1509.9.
    await acse("GB-11", "the same season in 2025: month labels",
      "Jun,Jul,Aug,Sep labels inside the viewBox (x 74..560)", async () => {
        const s = await st(Object.fromEntries(FILES.map((f) => [f, RAW[f].replaceAll("2026-", "2025-")])));
        return { actual: `months=${months(s)} (viewBox width ${VB_W}); pageErrors=${JSON.stringify(s.errs)}`, ok: s.months.length === 4 && s.months.every((m) => m.x >= PLOT_L && m.x <= VB_W) };
      });

    // Every date in every CSV moved 20 days later: axis Jun 21 .. Oct 20 (as-of). Month starts inside: Jul, Aug, Sep, Oct.
    // Jun 1 is 20 days before the start: x = 74 - 20/121*476 = -4.7 (label -1.7, off the left edge).
    await acse("GB-12", "season running into October (all dates +20 days, as-of Oct 20)",
      "month labels Jul,Aug,Sep,Oct inside the plot", async () => {
        const s = await st(Object.fromEntries(FILES.map((f) => [f, shiftDates(RAW[f], 20)])));
        return { actual: `months=${months(s)}; pageErrors=${JSON.stringify(s.errs)}`, ok: s.months.filter((m) => m.x >= PLOT_L && m.x <= VB_W).map((m) => m.m).join() === "Jul,Aug,Sep,Oct" };
      });

    // Committed data: the Cows stayed in Cedar Draw (P6, 18-day plan) Jul 31 - Aug 22 = 22 days, 4 past the plan.
    // The card note says "days past the planned move are marked". Only current stays get marks.
    await acse("GB-13", "a past overstay (Cows, Cedar Draw, 22 days on an 18-day plan) on the timeline",
      "a mark on the Cows' Cedar Draw bar (+4d) as well as the Yearlings' current '+3d'", async () => {
        const s = await st({});
        return { actual: `overrun labels=${JSON.stringify(s.over)}; red segments=${JSON.stringify(s.red)}`, ok: s.over.some((o) => o.s === "+4d") };
      });
  } catch (e) {
    nCrash++;
    console.log(`(Part 2 aborted: ${e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e})\n`);
  } finally {
    try { browser && (await browser.close()); } catch {}
    try { server && server.proc.kill(); } catch {}
    try { work && rmSync(work, { recursive: true, force: true }); } catch {}
  }
}

console.log(`SUMMARY  ${nMatch} MATCH, ${nMismatch} MISMATCH (${nCrash} of them because the repro itself failed)`);
