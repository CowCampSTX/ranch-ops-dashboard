// Research diagnostic (research-health): what the committed health.csv can and cannot tell a reader, measured
// against the record and scheduling fields that BQA and extension guidance name. No treatment logic, no diagnosis.
//
// Run from the repo root:   node docs/audit/diagnostics/health.research.mjs
//
// Read-only: imports parseCSV / findExceptions / RULES from exceptions.js and reads data/*.csv. Changes no file.
process.env.TZ = "UTC";
import { readFileSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const { parseCSV, findExceptions, RULES } = await import(new URL("exceptions.js", ROOT).href);
const FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"];
const D = Object.fromEntries(FILES.map((f) => [f, parseCSV(readFileSync(new URL(`data/${f}.csv`, ROOT), "utf8"))]));
const asOf = D.meta[0].as_of;
const DAY = 864e5;
const days = (a, b) => Math.round((new Date(b) - new Date(a)) / DAY);

console.log(`as_of=${asOf}  dueSoonDays=${RULES.dueSoonDays}`);

console.log("\n--- 1. health.csv columns vs the fields BQA treatment/processing records name ---");
const head = readFileSync(new URL("data/health.csv", ROOT), "utf8").split(/\r?\n/)[0].split(",");
console.log(`health.csv columns: ${head.join(", ")}`);
// BQA record items (individual or group/lot), plus scheduling items extension calendars use.
const wanted = {
  "group or lot id": ["group"],
  "date done (completion date)": ["last_done", "done_date"],
  "product / task type": ["task", "task_type"],
  "lot/serial number": ["lot", "serial"],
  "route and location": ["route"],
  "withdrawal clear date": ["withdrawal_clear", "withdrawal"],
  "person administering / responsible": ["done_by", "responsible", "person"],
  "head count worked": ["head_count", "head"],
  "label or vet window (earliest/latest)": ["window_start", "window_end", "window"],
  "who set the schedule (label / vet plan / ranch)": ["schedule_source", "source"],
};
for (const [item, cols] of Object.entries(wanted)) {
  const hit = cols.find((c) => head.includes(c));
  console.log(`  ${hit ? "present" : "MISSING"}  ${item}${hit ? ` (${hit})` : ""}`);
}

console.log("\n--- 2. Per-row reading of the committed rows ---");
for (const h of D.health) {
  const gap = h.last_done && h.next_due ? days(h.last_done, h.next_due) : null;
  const left = h.next_due ? days(asOf.slice(0, 10), h.next_due) : null;
  const group = D.groups.find((g) => g.group === h.group);
  console.log(`  ${h.group} | ${h.task} | last_done=${h.last_done || "(blank)"} next_due=${h.next_due || "(blank)"} status=${h.status}` +
    ` | last_done->next_due=${gap === null ? "n/a" : gap + " d"} | as_of->next_due=${left === null ? "n/a" : left + " d"}` +
    ` | head in groups.csv=${group ? group.head : "(group not found)"}`);
}

console.log("\n--- 3. Health rows the dashboard shows, with the action text it prints ---");
for (const e of findExceptions(D).filter((x) => x.area === "Health"))
  console.log(`  ${e.severity} | ${e.subject} | ${e.problem} | action: "${e.action}"`);

console.log("\n--- 4. Words in health actions/tasks that read as diagnosis or treatment ---");
const risky = /\b(treat|diagnos|sick|infect|disease|cure|dose|inject)\w*/i;
const texts = [...D.health.map((h) => `task: ${h.task}`), ...findExceptions(D).filter((x) => x.area === "Health").map((e) => `action: ${e.action}`)];
for (const t of texts) console.log(`  ${risky.test(t) ? "FLAG" : "ok  "}  ${t}`);
const gainAction = findExceptions(D).filter((x) => x.area === "Gain").map((e) => e.action);
for (const a of gainAction) console.log(`  ${/health problem/i.test(a) ? "NOTE" : "ok  "}  gain action: ${a}`);
