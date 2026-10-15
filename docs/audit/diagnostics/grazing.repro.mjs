// Grazing-rule reproductions for the ranch operations dashboard (grazingStatus, the grazing part of findExceptions in
// exceptions.js, and grazingTimeline in app.js).
// Run from the repo root:  node docs/audit/diagnostics/grazing.repro.mjs
//
// Part 1 (G-*) feeds tiny inline move lists (or the committed data with one change) through the REAL grazingStatus /
// findExceptions imported from exceptions.js.
// Part 2 (GB-*) loads the real page in headless Chromium against a throwaway copy of index.html, app.js,
// exceptions.js and data/, with CSVs swapped per case through request interception, for problems that only show in
// app.js (the grazing timeline, and what a crash does to the rest of the page).
//   env PLAYWRIGHT_PATH     default /opt/node22/lib/node_modules/playwright/index.mjs (Part 2 is skipped if missing)
//   env GRAZING_REPRO_PORT  first port to try, default 8850 (tries up to 8859)
//   env GRAZING_REPRO_TMP   where the throwaway copy goes, default a new folder in the OS temp dir
//
// Each case prints:
//   CASE <id>  <title>
//     expected: <worked out by hand / with a calendar; the reasoning is in the comment beside the case>
//     actual:   <what the code produced, or the error it threw>
//     MATCH | MISMATCH
// MISMATCH means the defect (or design limit) is present. Cases marked "control" should MATCH.
// The script never throws: every case runs in its own try/catch. It modifies no repo files.
process.env.TZ = "UTC";

import { readFileSync, mkdtempSync, cpSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = new URL("../../../", import.meta.url);
const ROOT_DIR = fileURLToPath(ROOT);
const { parseCSV, findExceptions, grazingStatus } = await import(new URL("exceptions.js", ROOT).href);

const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8")]));
const REAL = Object.fromEntries(FILES.map((f) => [f, parseCSV(RAW[f])]));
const AS_OF = "2026-09-30T18:00";

const mv = (group, pasture_id, in_date, out_date = "") => ({ group, pasture_id, in_date, out_date });
// The committed moves with some rows replaced: drop rows matching `drop`, then append `add`.
const realMovesWith = (drop, add = []) => [...REAL.moves.filter((m) => !drop(m)), ...add];
const run = (over = {}, asOf = AS_OF) => findExceptions({ ...REAL, ...over, meta: [{ as_of: asOf }] });
const grazingRows = (exc) => exc.filter((e) => e.area === "Grazing");
const fmt = (alerts) => (alerts.length ? alerts.map((e) => `${e.severity} | ${e.subject} | ${e.problem} | ${e.action}`).join("  ||  ") : "(none)");

let mismatches = 0, matches = 0, errors = 0;
function report(id, title, expected, actualFn, okFn) {
  console.log(`CASE ${id}  ${title}`);
  console.log(`  expected: ${expected}`);
  try {
    const actual = actualFn();
    console.log(`  actual:   ${actual.text}`);
    const ok = okFn(actual);
    console.log(`  ${ok ? "MATCH" : "MISMATCH"}`);
    ok ? matches++ : mismatches++;
  } catch (e) {
    console.log(`  actual:   threw ${e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e}`);
    console.log("  MISMATCH");
    errors++; mismatches++;
  }
  console.log("");
}
// For cases where throwing IS the observed defect: report the throw as the actual value.
const tryRun = (fn) => { try { return { value: fn(), threw: null }; } catch (e) { return { value: null, threw: e }; } };

console.log("=== Part 1: real exceptions.js functions, inline data ===\n");

// ---------------------------------------------------------------------------------------------------- controls
// Committed data: Yearlings into Sand Hills (P3, 21-day plan) on Sep 6. Planned move = Sep 6 + 21 = Sep 27. As of
// Sep 30 that is 3 days past the planned move. Cows (P7, Sep 12, 21-day plan: due Oct 3, 3 days away) and Heifers
// (P4, Sep 19, 14-day plan: due Oct 3, 3 days away) are outside the 2-day grace, so exactly one grazing row.
report("G-C1", "control: committed data gives exactly the planted grazing alert",
  "1 row: serious | Yearlings in Sand Hills | ...(3 days over)",
  () => { const g = grazingRows(run()); return { g, text: fmt(g) }; },
  ({ g }) => g.length === 1 && g[0].severity === "serious" && g[0].subject === "Yearlings in Sand Hills" && g[0].problem.includes("(3 days over)"));

// Boundaries, with the 21-day Sand Hills plan and as-of Sep 30. Planned move = in_date + 21.
//   in Sep 8  -> move due Sep 29 -> 1 day over -> serious, "1 day over" (singular)
//   in Sep 10 -> move due Oct 1  -> 1 day away -> warning "Planned move in 1 day"
//   in Sep 11 -> move due Oct 2  -> 2 days away -> warning (grace is 2 days)
//   in Sep 12 -> move due Oct 3  -> 3 days away -> nothing
report("G-C2", "control: boundary days around the plan and the 2-day grace",
  "Sep8: serious '1 day over'; Sep10: warning 'in 1 day'; Sep11: warning 'in 2 days'; Sep12: none",
  () => {
    const one = (d) => grazingRows(run({ moves: [mv("Yearlings", "P3", d)] }));
    const r = { s8: one("2026-09-08"), s10: one("2026-09-10"), s11: one("2026-09-11"), s12: one("2026-09-12") };
    return { r, text: Object.entries(r).map(([k, v]) => `${k}: ${fmt(v)}`).join("  ##  ") };
  },
  ({ r }) => r.s8.length === 1 && r.s8[0].severity === "serious" && r.s8[0].problem.endsWith("(1 day over)") &&
    r.s10[0]?.problem === "Planned move in 1 day" && r.s11[0]?.problem === "Planned move in 2 days" && r.s12.length === 0);

// Two groups sharing a pasture: water context names both (Cows already in P7; Heifers join P7 on Sep 25).
report("G-C3", "control: water alert context names both groups when two share a pasture",
  "with tank T4 (the planted leak) re-pointed at P7: 'Tank T4 (South Divide, Cows and Heifers here now)'",
  () => {
    const moves = realMovesWith((m) => m.group === "Heifers" && !m.out_date, [mv("Heifers", "P4", "2026-09-19", "2026-09-25"), mv("Heifers", "P7", "2026-09-25")]);
    const water = REAL.water.map((r) => (r.tank_id === "T4" ? { ...r, pasture_id: "P7" } : r));   // put the leaking tank in P7
    const w = run({ moves, water }).filter((e) => e.subject.startsWith("Tank T4"));
    return { w, text: fmt(w) };
  },
  ({ w }) => w.length === 1 && w[0].subject.includes("Cows and Heifers here now"));

// Unknown pasture in a CLOSED (historical) move: exceptions.js only looks at open moves, so it must not crash.
report("G-C4", "control: unknown pasture_id in a closed move does not break findExceptions",
  "same 1 grazing row as G-C1, no throw",
  () => { const g = grazingRows(run({ moves: realMovesWith(() => false, [mv("Yearlings", "P9", "2026-05-01", "2026-05-20")]) })); return { g, text: fmt(g) }; },
  ({ g }) => g.length === 1 && g[0].subject === "Yearlings in Sand Hills");

// ---------------------------------------------------------------------------------------------------- crashes
// One typo (P9 is not in pastures.csv) in the Yearlings' open move. Expected: the water, gain, health and budget alerts
// still come back (10 rows on the committed data minus the 1 grazing row = at least 9), plus some data-problem row.
report("G-01", "unknown pasture_id (P9) in an open move",
  "no throw; the 9 non-grazing alerts still returned (T4 leak, T2 low, T6 silent, ...) plus a data-problem row",
  () => {
    const r = tryRun(() => run({ moves: realMovesWith((m) => m.group === "Yearlings" && !m.out_date, [mv("Yearlings", "P9", "2026-09-06")]) }));
    return { r, text: r.threw ? `threw ${r.threw.constructor.name}: ${r.threw.message} (no alerts at all returned)` : `${r.value.length} rows` };
  },
  ({ r }) => !r.threw && r.value.length >= 9);

// Same crash from a case difference: 'p3' instead of 'P3' (a hand-typed or spreadsheet-edited row).
report("G-02", "pasture_id differs only by case ('p3') in an open move",
  "either matched to Sand Hills, or flagged as unknown; never a throw",
  () => {
    const r = tryRun(() => run({ moves: realMovesWith((m) => m.group === "Yearlings" && !m.out_date, [mv("Yearlings", "p3", "2026-09-06")]) }));
    return { r, text: r.threw ? `threw ${r.threw.constructor.name}: ${r.threw.message}` : `${r.value.length} rows` };
  },
  ({ r }) => !r.threw);

// ---------------------------------------------------------------------------------------------------- open-move logic
// A stale open row: the Yearlings' South Divide move (in Aug 25) was never closed, and the Sep 6 Sand Hills move was
// added. A group can only be in one place; the latest in_date (Sand Hills) is where they are. Expected: one Yearlings
// row (Sand Hills, 3 over). Without the fix, South Divide gets 'Sep 30 - Aug 25 = 36 days, 36 - 21 = 15 over'.
report("G-03", "a group with two open moves (previous move never closed)",
  "1 Yearlings grazing row (Sand Hills, 3 days over) + a data warning; no 'South Divide' row",
  () => {
    const moves = realMovesWith((m) => m.group === "Yearlings" && m.pasture_id === "P7", [mv("Yearlings", "P7", "2026-08-25")]);
    const g = grazingRows(run({ moves })).filter((e) => e.subject.startsWith("Yearlings"));
    const gs = grazingStatus(moves, REAL.pastures, AS_OF).filter((x) => x.group === "Yearlings").map((x) => `${x.pastureId}:${x.days}d`);
    return { g, text: `${fmt(g)}  ## grazingStatus Yearlings: ${gs.join(", ")}` };
  },
  ({ g }) => g.length === 1 && g[0].subject === "Yearlings in Sand Hills");

// Historical reconstruction: the export was taken after the as-of time, so the Sand Hills stay already has its out
// date (Oct 2) and the next move (Creek Bottom, Oct 2) is open. As of Sep 30 18:00 the Yearlings were still in Sand
// Hills: Sep 6 + 21 = Sep 27, so 3 days over -> serious.
report("G-04", "out_date after as_of (data exported after the as-of time)",
  "serious | Yearlings in Sand Hills | ...(3 days over)",
  () => {
    const moves = realMovesWith((m) => m.group === "Yearlings" && !m.out_date, [mv("Yearlings", "P3", "2026-09-06", "2026-10-02"), mv("Yearlings", "P5", "2026-10-02")]);
    const g = grazingRows(run({ moves })).filter((e) => e.subject.startsWith("Yearlings"));
    const gs = grazingStatus(moves, REAL.pastures, AS_OF).filter((x) => x.group === "Yearlings").map((x) => `${x.pasture} days=${x.days}`);
    return { g, text: `${fmt(g)}  ## grazingStatus says Yearlings are in: ${gs.join(", ") || "(nowhere)"}` };
  },
  ({ g }) => g.length === 1 && g[0].subject === "Yearlings in Sand Hills" && g[0].severity === "serious");

// Same shape, next pasture Windmill (P2), whose tank T2 has the planted low-level alert. On Sep 30 nobody is in
// Windmill (Cows left Jul 31, Yearlings left Aug 11), so the T2 subject should be just "Tank T2 (Windmill)".
report("G-05", "a future open move puts the group 'here now' in a pasture it has not entered",
  "Tank T2 (Windmill)   [no 'here now': the Yearlings arrive Oct 2]",
  () => {
    const moves = realMovesWith((m) => m.group === "Yearlings" && !m.out_date, [mv("Yearlings", "P3", "2026-09-06", "2026-10-02"), mv("Yearlings", "P2", "2026-10-02")]);
    const t2 = run({ moves }).filter((e) => e.subject.startsWith("Tank T2"));
    return { t2, text: fmt(t2) };
  },
  ({ t2 }) => t2.length === 1 && t2[0].subject === "Tank T2 (Windmill)");

// The serious alert's own advice is "check the grass and record a new move date". The only date column is out_date,
// so a manager who records the new date (Oct 3) on the current stay closes it. Expected as of Sep 30: still a
// Yearlings row (in Sand Hills, move now set for Oct 3, 3 days away). As of Oct 5: Sep 6 -> Oct 5 is 29 days, 8 over
// the 21-day plan and 2 days past the recorded Oct 3 date -> serious. The water rows are filtered out (the committed
// sensor data ends Sep 30).
report("G-06", "following the alert's advice ('record a new move date') silences it for good",
  "Sep 30: a Yearlings row (Sand Hills); Oct 5: serious Yearlings row (2 days past the recorded Oct 3 move)",
  () => {
    const moves = realMovesWith((m) => m.group === "Yearlings" && !m.out_date, [mv("Yearlings", "P3", "2026-09-06", "2026-10-03")]);
    const a = grazingRows(run({ moves })).filter((e) => e.subject.startsWith("Yearlings"));
    const b = grazingRows(run({ moves }, "2026-10-05T18:00")).filter((e) => e.subject.startsWith("Yearlings"));
    return { a, b, text: `Sep 30: ${fmt(a)}  ## Oct 5: ${fmt(b)}` };
  },
  ({ a, b }) => a.length >= 1 && b.length === 1 && b[0].severity === "serious");

// The Yearlings are moved out of Sand Hills on Sep 28 and the next move is not entered yet. groups.csv still lists
// 150 yearlings on grass, so their location is unknown: a manager would want that said.
report("G-07", "a group in groups.csv with no open move (next move not recorded)",
  "a row saying the Yearlings (150 head) have no current pasture recorded",
  () => {
    const moves = realMovesWith((m) => m.group === "Yearlings" && !m.out_date, [mv("Yearlings", "P3", "2026-09-06", "2026-09-28")]);
    const exc = run({ moves });
    const y = exc.filter((e) => e.subject.includes("Yearlings") && e.area === "Grazing");
    const located = grazingStatus(moves, REAL.pastures, AS_OF).map((g) => g.group);
    return { y, text: `grazing rows naming Yearlings: ${fmt(y)}  ## groups with a current pasture: ${located.join(", ")}` };
  },
  ({ y }) => y.length >= 1);

// ---------------------------------------------------------------------------------------------------- wording
// Arrival Sep 6, as-of Sep 30. Counting the arrival day as Day 1 (Sep 6 = Day 1, Sep 7 = Day 2, ...), Sep 30 is
// Day 25 (30 - 6 + 1). Days elapsed is 24. So the text should say "Day 25" or "24 days in", not "Day 24".
// (The "3 days over" part is right: planned move Sep 27, as-of Sep 30.)
report("G-08", "'Day N of a P-day plan' counts days elapsed but labels it as the day number",
  "'Day 25 of a 21-day plan' (arrival day = Day 1) or '24 days in ...'; not 'Day 24'",
  () => { const g = grazingRows(run()); return { g, text: g[0]?.problem ?? "(none)" }; },
  ({ g }) => /Day 25 |24 days in/.test(g[0]?.problem ?? ""));

// in Sep 9 + 21 = Sep 30 = the as-of date: the move is due today.
report("G-09", "move due on the as-of date",
  "warning, wording like 'Planned move is today'",
  () => { const g = grazingRows(run({ moves: [mv("Yearlings", "P3", "2026-09-09")] })); return { g, text: fmt(g) }; },
  ({ g }) => g.length === 1 && /today/i.test(g[0].problem));

// A pasture row with planned_graze_days left blank (a new pasture with no plan yet). Expected: a data-problem row
// ("no plan for Sand Hills"), not a garbled serious alert.
report("G-10", "blank planned_graze_days for the pasture a group is in",
  "a 'no plan recorded' row; no text like 'a -day plan'",
  () => {
    const pastures = REAL.pastures.map((p) => (p.pasture_id === "P3" ? { ...p, planned_graze_days: "" } : p));
    const g = grazingRows(run({ pastures })); return { g, text: fmt(g) };
  },
  ({ g }) => g.every((e) => !/ -day plan/.test(e.problem)));

// ---------------------------------------------------------------------------------------------------- rules not implemented
// pastures.csv carries min_rest_days but no code reads it.
report("G-11", "min_rest_days is read anywhere in exceptions.js or app.js",
  "at least one reference (it is a column in pastures.csv and listed in the README)",
  () => {
    const src = ["exceptions.js", "app.js"].map((f) => [f, (readFileSync(new URL(f, ROOT), "utf8").match(/min_rest|rest_days|minRest/g) || []).length]);
    return { src, text: src.map(([f, n]) => `${f}: ${n} references`).join(", ") };
  },
  ({ src }) => src.some(([, n]) => n > 0));

// Committed data, worked out with a calendar from moves.csv (latest out date of anyone in that pasture before the
// current stay began):
//   Cows into South Divide (P7) Sep 12; Yearlings left P7 Sep 6  -> 6 days rest, minimum 60 -> short by 54
//   Heifers into Lone Tree (P4) Sep 19; Heifers left P4 Aug 16    -> 34 days rest (15 in Aug + 19 in Sep), minimum 45
//   Yearlings into Sand Hills (P3) Sep 6; Yearlings left P3 Jun 22 -> 76 days rest, minimum 60 -> fine
// Expected: two rows about short rest (Cows/South Divide, Heifers/Lone Tree).
report("G-12", "current stays that began before the pasture's minimum rest (committed data)",
  "2 rows: Cows in South Divide (6 of 60 days rest), Heifers in Lone Tree (34 of 45)",
  () => {
    const all = run();
    const rest = all.filter((e) => /rest/i.test(e.problem + e.action));
    const named = all.filter((e) => e.area === "Grazing").map((e) => e.subject);
    return { rest, text: `rows mentioning rest: ${rest.length}; grazing rows: ${named.join(", ")}` };
  },
  ({ rest }) => rest.length === 2);

// Two groups in one pasture. Cows (180 pairs) in South Divide since Sep 12; Heifers (45) leave Lone Tree and join them
// on Sep 25. The 21-day South Divide plan is a single number per pasture; with both groups on it the grass goes faster
// than planned. Expected: at least a note that two groups share South Divide.
report("G-13", "two groups in one pasture are each judged alone against the one-group plan",
  "a row naming South Divide that says two groups (Cows and Heifers) share it",
  () => {
    const moves = realMovesWith((m) => m.group === "Heifers" && !m.out_date, [mv("Heifers", "P4", "2026-09-19", "2026-09-25"), mv("Heifers", "P7", "2026-09-25")]);
    const g = grazingRows(run({ moves })).filter((e) => e.subject.includes("South Divide"));
    const gs = grazingStatus(moves, REAL.pastures, AS_OF).filter((x) => x.pastureId === "P7").map((x) => `${x.group} day ${x.days}/${x.planned}`);
    return { g, text: `rows naming South Divide: ${fmt(g)}  ## grazingStatus in P7: ${gs.join(", ")}` };
  },
  ({ g }) => g.length >= 1);

// The serious action is one fixed sentence whatever the overrun and whatever pasture is ready to take the group.
// On the committed data, worked out by hand from moves.csv (as-of Sep 30), only Windmill (P2) is free AND past its
// minimum rest (left Aug 11 -> 50 days, minimum 45); P1 18/45, P5 21/45, P6 39/45, P8 11/30 are not; P3, P4, P7 are
// occupied. Windmill is also the pasture whose tank T2 is critically low. Expected: the action differs with the
// overrun (1 vs 30 days) or names a destination / the T2 problem.
report("G-14", "'Move them, or check the grass...' is the same advice for 1 day or 30 days over",
  "different action (or severity) for 1 day over vs 30 days over, or a named destination",
  () => {
    const a1 = grazingRows(run({ moves: [mv("Yearlings", "P3", "2026-09-08")] }))[0];
    const a30 = grazingRows(run({ moves: [mv("Yearlings", "P3", "2026-08-10")] }))[0];   // Aug 10 + 21 = Aug 31; Sep 30 is 30 days later
    return { a1, a30, text: `1 over: [${a1.severity}] ${a1.problem} -> ${a1.action}  ## 30 over: [${a30.severity}] ${a30.problem} -> ${a30.action}` };
  },
  ({ a1, a30 }) => a1.action !== a30.action || a1.severity !== a30.severity);

// Overlapping stays for one group (Yearlings' Creek Bottom stay recorded as ending Aug 30, but they entered South
// Divide Aug 25). Alerts only use the open move, so the grazing rows should be unchanged from G-C1. This is a
// control for the alert path; the overlap itself is not reported anywhere.
report("G-C5", "control: an overlapping closed stay does not change the grazing alerts",
  "same 1 grazing row as G-C1",
  () => {
    const moves = realMovesWith((m) => m.group === "Yearlings" && m.pasture_id === "P5", [mv("Yearlings", "P5", "2026-08-11", "2026-08-30")]);
    const g = grazingRows(run({ moves })); return { g, text: fmt(g) };
  },
  ({ g }) => g.length === 1 && g[0].subject === "Yearlings in Sand Hills" && g[0].problem.includes("(3 days over)"));

// A group that is in moves.csv but not groups.csv (Bulls in Home Trap since Sep 1: Sep 1 + 10 = Sep 11; Sep 30 is
// 19 days later). The alert path is moves-driven, so it should still fire.
report("G-C6", "control: a group missing from groups.csv still gets its grazing alert",
  "serious | Bulls in Home Trap | ...(19 days over)",
  () => { const g = grazingRows(run({ moves: realMovesWith(() => false, [mv("Bulls", "P8", "2026-09-01")]) })).filter((e) => e.subject.startsWith("Bulls")); return { g, text: fmt(g) }; },
  ({ g }) => g.length === 1 && g[0].problem.includes("(19 days over)"));

// ======================================================================================================== Part 2
console.log("=== Part 2: app.js in headless Chromium ===\n");

const PW = process.env.PLAYWRIGHT_PATH || "/opt/node22/lib/node_modules/playwright/index.mjs";
let chromium = null;
try { ({ chromium } = await import(PW)); } catch (e) { console.log(`(Part 2 skipped: cannot import Playwright from ${PW}: ${e.message})\n`); }

const csvMoves = (rows) => "group,pasture_id,in_date,out_date\n" + rows.map((m) => [m.group, m.pasture_id, m.in_date, m.out_date].join(",")).join("\n") + "\n";
const movesText = (drop, add = []) => csvMoves(realMovesWith(drop, add));

async function startServer(dir) {
  const first = Number(process.env.GRAZING_REPRO_PORT || 8850);
  for (let port = first; port < first + 10 && port <= 8859; port++) {
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

async function pageState(browser, base, overrides) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.route("**/data/*.csv", (route) => {
    const f = new URL(route.request().url()).pathname.split("/").pop().replace(".csv", "");
    if (f in overrides) return route.fulfill({ status: 200, contentType: "text/csv", body: overrides[f] });
    return route.continue();
  });
  await page.goto(`${base}/index.html`, { waitUntil: "load" });
  await page.waitForTimeout(700);
  const s = await page.evaluate(() => {
    const gz = document.querySelector("#grazing svg");
    const rects = gz ? [...gz.querySelectorAll("rect")].filter((r) => r.getAttribute("fill") !== "transparent") : [];
    const num = (el, a) => +(+el.getAttribute(a)).toFixed(1);
    return {
      tiles: document.querySelectorAll("#tiles .tile").length,
      excRows: [...document.querySelectorAll("#exceptions tr")].slice(1).map((r) => r.textContent.replace(/\s+/g, " ").trim()),
      grazing: !!gz, gain: !!document.querySelector("#gain svg"), budgetChart: !!document.querySelector("#budgetChart svg"),
      rules: document.querySelectorAll("#rules tr").length,
      rowLabels: gz ? [...gz.querySelectorAll("text.lbl")].map((t) => t.textContent) : [],
      overLabels: gz ? [...gz.querySelectorAll("text.ink")].map((t) => ({ s: t.textContent, x: num(t, "x"), y: num(t, "y") })) : [],
      overRects: rects.filter((r) => r.getAttribute("fill") === "var(--serious)").map((r) => ({ x: num(r, "x"), w: num(r, "width"), y: num(r, "y") })),
      bars: rects.filter((r) => r.getAttribute("fill") !== "var(--serious)").map((r) => ({ x: num(r, "x"), w: num(r, "width"), y: num(r, "y"), cur: r.getAttribute("fill") === "var(--s1)" })),
      months: gz ? [...gz.querySelectorAll("text")].filter((t) => /^[A-Z][a-z]{2}$/.test(t.textContent)).map((t) => ({ m: t.textContent, x: num(t, "x") })) : [],
      vbW: gz ? gz.viewBox.baseVal.width : 0,
    };
  });
  await page.close();
  return { ...s, errs };
}

async function breport(id, title, expected, fn, okFn) {
  console.log(`CASE ${id}  ${title}`);
  console.log(`  expected: ${expected}`);
  try {
    const actual = await fn();
    console.log(`  actual:   ${actual.text}`);
    const ok = okFn(actual);
    console.log(`  ${ok ? "MATCH" : "MISMATCH"}`);
    ok ? matches++ : mismatches++;
  } catch (e) {
    console.log(`  actual:   threw ${e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e}`);
    console.log("  MISMATCH");
    errors++; mismatches++;
  }
  console.log("");
}

// Timeline geometry (app.js grazingTimeline): viewBox width 560, left margin 74, right margin 10, so the plot runs
// x = 74 .. 550 and the as-of date sits at x = 550. With the committed data the axis runs Jun 1 .. Sep 30 = 121 days.
const PLOT_L = 74, PLOT_R = 550;
const pageSummary = (s) => `errors=${JSON.stringify(s.errs)} tiles=${s.tiles} exceptionRows=${s.excRows.length} grazingChart=${s.grazing} gainChart=${s.gain} budgetChart=${s.budgetChart} rulesRows=${s.rules}`;

if (chromium) {
  let server = null, browser = null, work = null;
  try {
    work = process.env.GRAZING_REPRO_TMP ? join(process.env.GRAZING_REPRO_TMP, "grazing-repro-site") : mkdtempSync(join(tmpdir(), "grazing-repro-"));
    mkdirSync(work, { recursive: true });
    for (const f of ["index.html", "app.js", "exceptions.js"]) cpSync(join(ROOT_DIR, f), join(work, f));
    cpSync(join(ROOT_DIR, "data"), join(work, "data"), { recursive: true });
    server = await startServer(work);
    browser = await chromium.launch();
    const base = `http://127.0.0.1:${server.port}`;
    console.log(`(serving a throwaway copy from ${work} on port ${server.port})\n`);

    // Control: committed data. One overrun mark "+3d" on the Yearlings' (third row) current bar; its red segment
    // starts at Sep 27 (Jun 1 + 118 days): x = 74 + 118/121*476 = 538.2. Month labels Jun..Sep inside the plot.
    await breport("GB-C0", "control: committed data renders the whole page and one '+3d' overrun",
      "no page errors; 10 exception rows; one '+3d' label; red segment starts near x=538.2; months Jun,Jul,Aug,Sep all within x 74..560",
      async () => { const s = await pageState(browser, base, {}); return { s, text: `${pageSummary(s)} over=${JSON.stringify(s.overLabels)} red=${JSON.stringify(s.overRects)} months=${JSON.stringify(s.months)}` }; },
      ({ s }) => !s.errs.length && s.excRows.length === 10 && s.overLabels.length === 1 && s.overLabels[0].s === "+3d" &&
        Math.abs(s.overRects[0].x - 538.2) < 0.6 && s.months.map((m) => m.m).join() === "Jun,Jul,Aug,Sep" && s.months.every((m) => m.x >= PLOT_L && m.x <= 560));

    // Unknown pasture in the open move: what the manager sees. Expected: the water/gain/health/budget rows still shown.
    await breport("GB-01", "unknown pasture_id (P9) in an open move: what the page shows",
      "the 9 non-grazing alerts still listed (T4 leak, T2 low, T6 silent, ...), tiles and charts drawn",
      async () => { const s = await pageState(browser, base, { moves: movesText((m) => m.group === "Yearlings" && !m.out_date, [mv("Yearlings", "P9", "2026-09-06")]) }); return { s, text: pageSummary(s) }; },
      ({ s }) => s.excRows.length >= 9 && s.tiles === 5);

    // Unknown pasture in a CLOSED move: exceptions.js is fine (G-C4) but the timeline reads p.pasture_id / p.name.
    // Expected: the rest of the page (gain chart, budget chart, rules table) still renders.
    await breport("GB-02", "unknown pasture_id (P9) in a closed move from May: the rest of the page",
      "10 exception rows AND grazing, gain and budget charts and the 12-row rules table all drawn",
      async () => { const s = await pageState(browser, base, { moves: movesText(() => false, [mv("Yearlings", "P9", "2026-05-01", "2026-05-20")]) }); return { s, text: pageSummary(s) }; },
      ({ s }) => s.excRows.length === 10 && s.grazing && s.gain && s.budgetChart && s.rules === 12);

    // Two open Yearlings moves (South Divide Aug 25 never closed, Sand Hills Sep 6). The exception table (G-03) says
    // South Divide is 15 days over. If the chart draws both bars, the South Divide one should say +15d and its red
    // segment start at Aug 25 + 21 = Sep 15 (x = 74 + 106/121*476 = 491.0) and run to Sep 30 - i.e. not "+3d" twice.
    await breport("GB-03", "two open moves for one group: overrun marks on the timeline",
      "labels {+15d, +3d} (or a single current bar); never the Sand Hills '+3d' painted on the South Divide bar",
      async () => {
        const s = await pageState(browser, base, { moves: movesText((m) => m.group === "Yearlings" && m.pasture_id === "P7", [mv("Yearlings", "P7", "2026-08-25")]) });
        return { s, text: `over labels=${JSON.stringify(s.overLabels)} red segments=${JSON.stringify(s.overRects)} exception rows naming Yearlings=${JSON.stringify(s.excRows.filter((r) => r.includes("Yearlings in")))}` };
      },
      ({ s }) => !(s.overLabels.filter((l) => l.s === "+3d").length > 1));

    // Following the alert's advice: out_date Oct 3 recorded on the current Sand Hills stay (see G-06). Oct 3 is
    // 124 days after Jun 1, so x(Oct 3) = 74 + 124/121*476 = 561.8: past the plot's right edge (550) and past the
    // viewBox (560). Expected: the stay still drawn as current (green) and ending at the as-of line, with its +3d.
    await breport("GB-04", "out_date after as_of: the Yearlings' Sand Hills bar",
      "Yearlings' last bar is current (green), ends at x <= 550, and the '+3d' mark is still shown",
      async () => {
        const s = await pageState(browser, base, { moves: movesText((m) => m.group === "Yearlings" && !m.out_date, [mv("Yearlings", "P3", "2026-09-06", "2026-10-03")]) });
        const rowY = Math.max(...s.bars.map((b) => b.y));
        const last = s.bars.filter((b) => b.y === rowY).sort((a, b) => a.x - b.x).pop();
        return { s, last, text: `Yearlings last bar x=${last.x} right end=${(last.x + last.w).toFixed(1)} current=${last.cur}; over labels=${JSON.stringify(s.overLabels)}; viewBox width=${s.vbW}` };
      },
      ({ s, last }) => last.cur && last.x + last.w <= PLOT_R + 0.5 && s.overLabels.some((l) => l.s === "+3d"));

    // A group in moves.csv but not in groups.csv (Bulls in Home Trap since Sep 1). The exception table shows the
    // Bulls alert (G-C6); the timeline should show a Bulls row so the chart backs up the alert.
    await breport("GB-05", "group in moves.csv but not in groups.csv: timeline row",
      "exception table has 'Bulls in Home Trap' AND the timeline has a 'Bulls' row",
      async () => {
        const s = await pageState(browser, base, { moves: movesText(() => false, [mv("Bulls", "P8", "2026-09-01")]) });
        return { s, text: `exception rows with Bulls=${s.excRows.filter((r) => r.includes("Bulls")).length}; timeline rows=${JSON.stringify(s.rowLabels)}` };
      },
      ({ s }) => s.excRows.some((r) => r.includes("Bulls")) && s.rowLabels.includes("Bulls"));

    // Season that starts Apr 15 (Cows on Home Trap Apr 15 - Jun 1 before the rotation). Month starts inside
    // Apr 15 .. Sep 30 are May 1, Jun 1, Jul 1, Aug 1, Sep 1, so the expected labels are May..Sep.
    await breport("GB-06", "moves before June: month ticks are hard-coded to Jun..Sep 2026",
      "month labels May,Jun,Jul,Aug,Sep",
      async () => { const s = await pageState(browser, base, { moves: movesText(() => false, [mv("Cows", "P8", "2026-04-15", "2026-06-01")]) }); return { s, text: `months=${JSON.stringify(s.months)}` }; },
      ({ s }) => s.months.map((m) => m.m).join() === "May,Jun,Jul,Aug,Sep");

    // Season that starts Jun 15 (all in dates on/after Jun 15). Jun 1 is before the axis start, so no June tick
    // should be drawn; app.js puts it at x = 74 + (-14/107)*476 = 11.7, in the group-label column.
    await breport("GB-07", "moves that start after June 1: the June tick lands in the label column",
      "no month label left of the plot (all x >= 74): labels Jul,Aug,Sep",
      async () => {
        const moves = csvMoves([mv("Cows", "P7", "2026-06-15", "2026-07-20"), mv("Cows", "P1", "2026-07-20"), mv("Heifers", "P8", "2026-06-20", "2026-07-10"), mv("Heifers", "P4", "2026-09-19"), mv("Yearlings", "P3", "2026-09-06")]);
        const s = await pageState(browser, base, { moves }); return { s, text: `months=${JSON.stringify(s.months)}` };
      },
      ({ s }) => s.months.every((m) => m.x >= PLOT_L) && s.months.map((m) => m.m).join() === "Jul,Aug,Sep");

    // The same season one year earlier (every 2026- date becomes 2025-, as-of 2025-09-30). Axis Jun 1 .. Sep 30 2025;
    // expected Jun..Sep labels inside the plot. app.js still places 2026-06-01 at x = 74 + 365/121*476 = 1509.9.
    await breport("GB-08", "a season in another year (2025): month labels",
      "months Jun,Jul,Aug,Sep all inside x 74..560",
      async () => {
        const shift = (t) => t.replaceAll("2026-", "2025-");
        const s = await pageState(browser, base, Object.fromEntries(FILES.map((f) => [f, shift(RAW[f])])));
        return { s, text: `months=${JSON.stringify(s.months)} errors=${JSON.stringify(s.errs)}` };
      },
      ({ s }) => s.months.length === 4 && s.months.every((m) => m.x >= PLOT_L && m.x <= 560));
  } catch (e) {
    console.log(`(Part 2 aborted: ${e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e})\n`);
    errors++;
  } finally {
    try { browser && (await browser.close()); } catch {}
    try { server && server.proc.kill(); } catch {}
    try { if (work && !process.env.GRAZING_REPRO_TMP) rmSync(work, { recursive: true, force: true }); } catch {}
  }
}

console.log(`SUMMARY  ${matches} MATCH, ${mismatches} MISMATCH (${errors} of them threw unexpectedly)`);
