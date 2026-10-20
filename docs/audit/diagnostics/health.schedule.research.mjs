// Research diagnostic (research-health, part 2): compares the current health rule (serious = open task past next_due,
// warning = due within RULES.dueSoonDays, blank next_due skipped) with a window-based reading that needs the extra
// schedule/record fields BQA and extension guidance name. Scope: observation, scheduling, records, escalation wording.
// No treatment protocols, no diagnosis.
//
// Run from the repo root:   node docs/audit/diagnostics/health.schedule.research.mjs
//
// Read-only: imports parseCSV / findExceptions / RULES from exceptions.js and reads data/*.csv. Changes no file.
// Every value in ENRICH below is SYNTHETIC (invented for the demonstration, like the rest of the fictional data); it is
// not a label interval, vet plan or recommendation for any real product or herd.
process.env.TZ = "UTC";
import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, findExceptions, RULES } = await import(new URL("exceptions.js", ROOT).href);
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const D = Object.fromEntries(FILES.map((f) => [f, parseCSV(readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8"))]));
const asOf = D.meta[0].as_of, today = asOf.slice(0, 10);
const DAY = 864e5, days = (a, b) => Math.round((new Date(b) - new Date(a)) / DAY);

console.log(`as_of=${asOf}  dueSoonDays=${RULES.dueSoonDays}`);

// ---------------------------------------------------------------- 1. current rule, as committed
console.log("\n--- 1. Current Health rows (findExceptions on committed data) ---");
for (const e of findExceptions(D).filter((x) => x.area === "Health"))
  console.log(`  ${e.severity.padEnd(8)}| ${e.subject} | ${e.problem} | action: "${e.action}"`);

// ---------------------------------------------------------------- 2. what one due date cannot express
console.log("\n--- 2. One next_due per row: what the rule treats identically ---");
const kinds = { "Fly tag check": "observation/fly control", "Pinkeye check": "observation", "Pre-breeding vaccine": "vaccination",
  "Pregnancy check": "vet-dependent exam", "Booster vaccine": "vaccination (label booster)", "Deworm": "parasite control" };
for (const h of D.health) {
  const left = h.next_due ? days(today, h.next_due) : null;
  const sev = h.status !== "open" || left === null ? "(not judged)" : left < 0 ? "serious" : left <= RULES.dueSoonDays ? "warning" : "(none)";
  console.log(`  ${h.task.padEnd(21)} kind=${(kinds[h.task] || "?").padEnd(28)} status=${h.status.padEnd(5)} next_due=${h.next_due || "(blank)"}  -> ${sev}`);
}
const booster = D.health.find((h) => h.task === "Booster vaccine");
console.log(`  Booster: last_done ${booster.last_done} -> next_due ${booster.next_due} = ${days(booster.last_done, booster.next_due)} days apart` +
  " (BQA manual: almost all products recommend the second dose 2-4 weeks after the first; this row cannot say which product/label applies)");

// ---------------------------------------------------------------- 3. window-based reading with SYNTHETIC extra fields
// window_start/window_end: earliest/latest acceptable date from the label or the vet plan (synthetic here).
// source: who set the window. responsible: who owns it. head_planned/head_done: coverage. vet_needed: needs vet booking.
const ENRICH = {
  "Yearlings|Booster vaccine": { window_start: "2026-06-16", window_end: "2026-06-30", source: "product_label", responsible: "J. (crew lead)", head_planned: 150, head_done: 0, vet_needed: false, kind: "vaccination" },
  "Cows|Pinkeye check":        { window_start: "2026-09-26", window_end: "2026-10-03", source: "ranch_plan",    responsible: "",               head_planned: 180, head_done: 0, vet_needed: false, kind: "observation" },
  "Heifers|Pregnancy check":   { window_start: "2026-10-20", window_end: "2026-10-31", source: "vet_plan",      responsible: "Herd vet",       head_planned: 45,  head_done: 0, vet_needed: true,  kind: "vet_exam" },
  "Yearlings|Deworm":          { window_start: "2026-10-25", window_end: "2026-11-08", source: "vet_plan",      responsible: "J. (crew lead)", head_planned: 150, head_done: 0, vet_needed: false, kind: "parasite_control" },
};
const LEAD = { vaccination: 7, observation: 0, vet_exam: 21, parasite_control: 7 };   // SYNTHETIC planning lead times (ranch choice)

console.log("\n--- 3. Same open rows read against a window (SYNTHETIC window/source/owner values) ---");
for (const h of D.health.filter((x) => x.status === "open")) {
  const x = ENRICH[`${h.group}|${h.task}`];
  if (!x) { console.log(`  ${h.group}: ${h.task} -> no enrichment`); continue; }
  const toStart = days(today, x.window_start), toEnd = days(today, x.window_end);
  let state, wording;
  if (toEnd < 0 && x.kind === "vaccination") {
    state = "serious: label window passed";
    wording = `Window from the ${x.source.replace("_", " ")} closed ${-toEnd} days ago. Check the label and ask your veterinarian how to proceed before scheduling.`;
  } else if (toEnd < 0) {
    state = "serious: window passed";
    wording = x.kind === "observation" ? "No check recorded in the planned window. Look the group over on the next pasture check and record what you see."
      : "Planned window passed. Reschedule with the person responsible.";
  } else if (toStart <= LEAD[x.kind]) {
    state = toStart <= 0 ? "warning: window open now" : `warning: window opens in ${toStart} days`;
    wording = x.kind === "observation" ? "Look the group over on the next pasture check; record animals with watery eyes, squinting or a cloudy eye and call your veterinarian if you see any."
      : x.vet_needed ? "Confirm the date with your veterinarian and plan the gather." : "Plan it with the next gather.";
  } else { state = "(none yet)"; wording = ""; }
  const owner = x.responsible ? x.responsible : "UNASSIGNED";
  console.log(`  ${h.group}: ${h.task} | window ${x.window_start}..${x.window_end} (${x.source}) | owner=${owner} | done ${x.head_done}/${x.head_planned} head`);
  console.log(`      -> ${state}${wording ? ` | "${wording}"` : ""}`);
}

// ---------------------------------------------------------------- 4. completion coverage (SYNTHETIC completion record)
console.log("\n--- 4. Completion record with head count (SYNTHETIC) ---");
const done = { group: "Yearlings", task: "Booster vaccine", done_date: "2026-10-02", head_done: 142, head_planned: 150, lot: "(lot recorded)", done_by: "J.", withdrawal_days: 21, planned_ship: "2026-10-15" };
const clear = new Date(new Date(done.done_date).getTime() + done.withdrawal_days * DAY).toISOString().slice(0, 10);
console.log(`  ${done.group} ${done.task}: ${done.head_done}/${done.head_planned} head worked on ${done.done_date} -> ${done.head_planned - done.head_done} head still to do`);
console.log(`  withdrawal ${done.withdrawal_days} d -> clear ${clear}; planned ship ${done.planned_ship} -> ${clear > done.planned_ship ? "CONFLICT: ship date is before the withdrawal clear date" : "ok"}`);

// ---------------------------------------------------------------- 5. face-fly season cue (day length, astronomy only)
// UNL BeefWatch (Boxler, 2023): face flies aggregate to overwinter as day length falls below 12.5 hours.
// Day length via the CBM model (Forsythe et al. 1995), p = 0.8333 deg (sunrise/sunset at top of the disc).
function dayLength(lat, isoDate) {
  const d = new Date(isoDate), J = Math.round((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) / DAY) + 1;
  const theta = 0.2163108 + 2 * Math.atan(0.9671396 * Math.tan(0.00860 * (J - 186)));
  const phi = Math.asin(0.39795 * Math.cos(theta)), p = 0.8333, r = Math.PI / 180;
  return 24 - (24 / Math.PI) * Math.acos((Math.sin(p * r) + Math.sin(lat * r) * Math.sin(phi)) / (Math.cos(lat * r) * Math.cos(phi)));
}
console.log("\n--- 5. Day length (hours) at Northern/Central Plains latitudes ---");
for (const [place, lat] of [["Pierre SD 44.37N", 44.37], ["North Platte NE 41.12N", 41.12], ["Bismarck ND 46.81N", 46.81]]) {
  const row = ["2026-08-15", "2026-09-01", "2026-09-15", "2026-09-30", "2026-10-03"].map((dt) => `${dt.slice(5)}=${dayLength(lat, dt).toFixed(2)}`);
  console.log(`  ${place.padEnd(24)} ${row.join("  ")}`);
}
