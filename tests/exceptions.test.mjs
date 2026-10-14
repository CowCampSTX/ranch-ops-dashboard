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
