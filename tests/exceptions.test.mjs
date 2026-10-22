// Run: node --test tests/exceptions.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseCSV, findExceptions, waterStatus, grazingStatus, gainStatus, budgetStatus } from "../exceptions.js";

const load = () => Object.fromEntries(["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"]
  .map((f) => [f, parseCSV(readFileSync(new URL(`../data/${f}.csv`, import.meta.url), "utf8"))]));
const D = load();
const EXC = findExceptions(D);
const has = (area, subject, severity) => EXC.some((e) => e.area === area && e.subject.includes(subject) && e.severity === severity);

test("finds every problem planted in the data", () => {
  assert.ok(has("Water", "Tank T4", "critical"), "T4 leak");
  assert.ok(has("Water", "Tank T6", "serious"), "T6 silent sensor");
  assert.ok(has("Water", "Tank T2", "critical"), "T2 low");
  assert.ok(has("Grazing", "Yearlings in Sand Hills", "serious"), "yearlings over plan");
  assert.ok(has("Gain", "Heifers", "serious"), "heifers under target");
  assert.ok(has("Gain", "6 yearlings", "warning"), "six slow yearlings");
  assert.ok(has("Health", "Yearlings: Booster", "serious"), "booster overdue");
  assert.ok(has("Health", "Cows: Pinkeye", "warning"), "pinkeye due soon");
  assert.ok(has("Budget", "Fuel", "serious") && has("Budget", "Repairs", "serious"), "fuel and repairs over");
});

test("and nothing else: no false alarms on the healthy tanks, groups and categories", () => {
  assert.equal(EXC.length, 10);
});

test("worst first", () => {
  const rank = { critical: 0, serious: 1, warning: 2 };
  for (let i = 1; i < EXC.length; i++) assert.ok(rank[EXC[i - 1].severity] <= rank[EXC[i].severity]);
});

test("a silent sensor isn't also judged on its stale level", () => {
  assert.equal(EXC.filter((e) => e.subject.includes("Tank T6")).length, 1);
});

test("a water alert names the group drinking there", () => {
  assert.ok(EXC.find((e) => e.subject.includes("Tank T4")).subject.includes("Heifers here now"));
});

test("water rules at their thresholds", () => {
  const base = { ...D, water: [], moves: [] };
  const tank = (levels, endHour = 18) => levels.map((l, i) => ({ tank_id: "T1", pasture_id: "P1",
    time: new Date(Date.UTC(2026, 8, 30, endHour - 6 * (levels.length - 1 - i))).toISOString().slice(0, 16), level_pct: l }));
  const run = (water) => findExceptions({ ...base, water, meta: [{ as_of: "2026-09-30T18:00" }] }).filter((e) => e.area === "Water");
  assert.equal(run(tank([80, 80, 80, 80, 45])).length, 1);                       // a 35-point drop: leak
  assert.equal(run(tank([50, 50, 50, 50, 39]))[0].severity, "warning");         // under 40%
  assert.equal(run(tank([50, 50, 50, 50, 41])).length, 0);
  assert.equal(run(tank([50, 50, 50, 50, 24]))[0].severity, "critical");        // under 25%
  assert.equal(run(tank([90, 90], -8))[0].severity, "serious");                 // last reading 26 hours ago
});

test("summaries", () => {
  const w = waterStatus(D.water, D.meta[0].as_of);
  assert.equal(w.length, 8);
  assert.deepEqual(grazingStatus(D.moves, D.pastures, D.meta[0].as_of).map((g) => g.group).sort(), ["Cows", "Heifers", "Yearlings"]);
  const g = gainStatus(D.weights, D.groups);
  assert.deepEqual(g.map((x) => x.head), [45, 150]);
  const b = budgetStatus(D.budget);
  assert.equal(b.find((x) => x.category === "Fuel").variance, 2040);
});

test("CSV parsing keeps text as text and numbers as numbers", () => {
  assert.deepEqual(parseCSV("a,b,c\nP1,12.5,\n"), [{ a: "P1", b: 12.5, c: "" }]);
});

// Boundary tests for TEST-01 (water) and TEST-02 (grazing), 06 section 12 P1-17 part a. They pin today's rules before
// any refactor and encode the demonstration settings in RULES, not validated thresholds. Inputs go through parseCSV,
// as the committed files do. As of 2026-09-30T18:00. Water: one tank, T1 in P1 (North Flat), and no moves.
const AS_OF = parseCSV("as_of\n2026-09-30T18:00\n");
const pick = ({ severity, subject, problem, action }) => ({ severity, subject, problem, action });
const waterRows = (...readings) => findExceptions({ ...D, meta: AS_OF, moves: [],
  water: parseCSV("tank_id,pasture_id,time,level_pct\n" + readings.map((r) => `T1,P1,${r}`).join("\n")) })
  .filter((e) => e.area === "Water").map(pick);
const T1 = "Tank T1 (North Flat)";
const LOOK = "Check the tank by eye today, then the sensor battery and signal";
const LEAK = "Check for a leak or a stuck float; haul water if it can't be fixed today";

test("water boundary 1: a silent tank is one serious row, not also judged on its stale level", () => {
  assert.deepEqual(waterRows("2026-09-29T06:00,12", "2026-09-29T12:00,10"),
    [{ severity: "serious", subject: T1, problem: "No reading for 30 hours; last level 10%", action: LOOK }]);
});

test("water boundary 2: silent at 24 hours without a reading, not at 23", () => {
  assert.deepEqual(waterRows("2026-09-29T06:00,80", "2026-09-29T18:00,80"),
    [{ severity: "serious", subject: T1, problem: "No reading for 24 hours; last level 80%", action: LOOK }]);
  assert.deepEqual(waterRows("2026-09-29T07:00,80", "2026-09-29T19:00,80"), []);
});

test("water boundary 3: a 30-point fall in 24 hours is critical, 29.9 is not", () => {
  assert.deepEqual(waterRows("2026-09-29T18:00,80", "2026-09-30T18:00,50"),
    [{ severity: "critical", subject: T1, problem: "Dropped 30 points in 24 hours, now 50%", action: LEAK }]);
  assert.deepEqual(waterRows("2026-09-29T18:00,80", "2026-09-30T18:00,50.1"), []);
});

test("water boundary 4: level lines at 25% and 40%", () => {
  const flat = (level) => waterRows(`2026-09-29T18:00,${level}`, `2026-09-30T18:00,${level}`);
  assert.deepEqual(flat(24.9), [{ severity: "critical", subject: T1, problem: "Down to 24.9% full", action: "Check the float and the supply line today" }]);
  assert.deepEqual(flat(25), [{ severity: "warning", subject: T1, problem: "25% full", action: "Look at it on the next pass" }]);
  assert.deepEqual(flat(39.9), [{ severity: "warning", subject: T1, problem: "39.9% full", action: "Look at it on the next pass" }]);
  assert.deepEqual(flat(40), []);
});

const FALL = ["2026-09-29T18:00,80", "2026-09-30T00:00,50", "2026-09-30T18:00,45"];
const FALL_ROW = [{ severity: "critical", subject: T1, problem: "Dropped 35 points in 24 hours, now 45%", action: LEAK }];

test("water boundary 5: the drop is taken from the reading 24 hours back", () => {
  assert.deepEqual(waterRows(...FALL), FALL_ROW);
});

test("water boundary 6: the same readings newest first give the same row", () => {
  assert.deepEqual(waterRows(...[...FALL].reverse()), FALL_ROW);
});

// Grazing: one open stay, Yearlings in Sand Hills (P3, 21-day plan), as of 2026-09-30.
const grazingRows = (inDate) => findExceptions({ ...D, meta: AS_OF,
  moves: parseCSV(`group,pasture_id,in_date,out_date\nYearlings,P3,${inDate},\n`) })
  .filter((e) => e.area === "Grazing").map(pick);
const YS = "Yearlings in Sand Hills";
const LINE_UP = "Line up the move";

test("grazing boundary: one day over plan is serious", () => {
  assert.deepEqual(grazingRows("2026-09-08"),
    [{ severity: "serious", subject: YS, problem: "Day 22 of a 21-day plan (1 day over)", action: "Move them, or check the grass and record a new move date" }]);
});

test("grazing boundary: the planned move day is a warning, not over plan", () => {
  // Today's wording. P1-08 or P1-15, whichever lands first, changes it to "Move planned for today" (UI-06).
  assert.deepEqual(grazingRows("2026-09-09"), [{ severity: "warning", subject: YS, problem: "Planned move in 0 days", action: LINE_UP }]);
});

test("grazing boundary: a move 1 day out is a warning, in the singular", () => {
  assert.deepEqual(grazingRows("2026-09-10"), [{ severity: "warning", subject: YS, problem: "Planned move in 1 day", action: LINE_UP }]);
});

test("grazing boundary: a move 2 days out is still in the grace window", () => {
  assert.deepEqual(grazingRows("2026-09-11"), [{ severity: "warning", subject: YS, problem: "Planned move in 2 days", action: LINE_UP }]);
});

test("grazing boundary: a move 3 days out gives no row", () => {
  assert.deepEqual(grazingRows("2026-09-12"), []);
});
