// Registrar's durable repros for two skeptic 'missed' findings whose original scripts lived only in scratch space:
//   GRZ-03 (verify_grazing missed: "Text in out_date or planned_graze_days silently removes the grazing alert ...")
//   TEST-02 (verify_grazing missed: "No test covers the grazing rule boundaries ...")
// Run from anywhere:  node docs/audit/diagnostics/registry.extra.mjs
// Feeds the committed CSVs (one edit per case) through the REAL parseCSV/findExceptions, and runs the existing test
// suite against one-line mutations of a temp copy of exceptions.js. Modifies no repo file. TZ pinned to UTC.
process.env.TZ = "UTC";
import { readFileSync, mkdtempSync, cpSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const { parseCSV, findExceptions } = await import(join(ROOT, "exceptions.js"));
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const RAW = Object.fromEntries(FILES.map((f) => [f, readFileSync(join(ROOT, `data/${f}.csv`), "utf8")]));
const run = (edits = {}) => {
  const d = { ...RAW };
  for (const [f, fn] of Object.entries(edits)) {
    const next = fn(d[f]);
    if (next === d[f]) throw new Error(`edit to ${f}.csv did not apply`);
    d[f] = next;
  }
  return findExceptions(Object.fromEntries(Object.entries(d).map(([k, v]) => [k, parseCSV(v)])));
};
const show = (id, expected, actual) => console.log(`CASE ${id}\n  expected: ${expected}\n  actual:   ${actual}\n`);
const summary = (e) => `total=${e.length}; grazing=${JSON.stringify(e.filter((x) => x.area === "Grazing").map((x) => `${x.severity} | ${x.subject} | ${x.problem}`))}; T4 subject=${JSON.stringify(e.find((x) => x.subject.startsWith("Tank T4"))?.subject)}`;

console.log("=== Part 1: text in move/plan cells (GRZ-03) ===\n");
// Hand check: Yearlings went into Sand Hills (P3, 21-day plan) on Sep 6; Sep 6 + 21 = Sep 27, 3 days before Sep 30.
show("X-GRZ-a  open Yearlings row with out_date '-'",
  ">= 10 rows and a Grazing row for Yearlings ('3 days over') or a data-issue row naming the out_date",
  summary(run({ moves: (t) => t.replace("Yearlings,P3,2026-09-06,", "Yearlings,P3,2026-09-06,-") })));
show("X-GRZ-b  open Heifers row with out_date 'TBD'",
  "T4 subject still names the Heifers ('Tank T4 (Lone Tree, Heifers here now)') or a data-issue row",
  summary(run({ moves: (t) => t.replace("Heifers,P4,2026-09-19,", "Heifers,P4,2026-09-19,TBD") })));
show("X-GRZ-c  pastures.csv P3 planned_graze_days '21 days'",
  ">= 10 rows and a Grazing row naming Sand Hills's plan; never silence",
  summary(run({ pastures: (t) => t.replace(/^P3,Sand Hills,720,21,/m, "P3,Sand Hills,720,21 days,") })));
show("X-GRZ-control  committed data",
  "total=10; one serious 'Yearlings in Sand Hills | Day 24 of a 21-day plan (3 days over)'",
  summary(run()));

console.log("=== Part 2: grazing boundary mutations vs tests/exceptions.test.mjs (TEST-02) ===\n");
const MUTANTS = [
  ["grace boundary >= -> >", "else if (over >= -R.graceDays)", "else if (over > -R.graceDays)"],
  ["over-plan boundary > -> >=", "if (over > 0)", "if (over >= 0)"],
  ["warning plural always 's'", 'over === -1 ? "" : "s"', '"s"'],
  ["serious plural always 's'", 'over === 1 ? "" : "s"', '"s"'],
  ["grace window widened by 5 days", "else if (over >= -R.graceDays)", "else if (over >= -R.graceDays - 5)"],
];
const SRC = readFileSync(join(ROOT, "exceptions.js"), "utf8");
for (const [name, from, to] of MUTANTS) {
  const dir = mkdtempSync(join(tmpdir(), "grazing-mut-"));
  try {
    for (const f of ["data", "tests"]) cpSync(join(ROOT, f), join(dir, f), { recursive: true });
    if (SRC.split(from).length !== 2) throw new Error("mutation anchor not unique: " + from);
    writeFileSync(join(dir, "exceptions.js"), SRC.replace(from, to));
    const r = spawnSync(process.execPath, ["--test", "tests/exceptions.test.mjs"], { cwd: dir, encoding: "utf8" });
    const pass = /# pass (\d+)/.exec(r.stdout)?.[1], fail = /# fail (\d+)/.exec(r.stdout)?.[1];
    console.log(`  ${fail === "0" ? "SURVIVES" : "killed  "}  ${name}  (pass ${pass}, fail ${fail})`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
