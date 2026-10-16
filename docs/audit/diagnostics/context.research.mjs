// Context-data research diagnostic for the ranch operations dashboard (research-context worker).
// Run from the repo root:  node docs/audit/diagnostics/context.research.mjs
//
// It answers three questions with arithmetic only (no network, modifies no files):
//   1. What does the dashboard's data model hold today that a public-context feature would need?
//      (reads the CSV headers in data/ and reports which fields exist)
//   2. If public context were added, which U.S. Drought Monitor (USDM) map and which NASS Crop Progress release
//      would be the latest one available at the dashboard's as_of, and how old would its valid date be?
//      Schedules used (documented, fetched 2026-10-15):
//        USDM: "released each Thursday at 8:30 a.m. Eastern Time"; data cutoff "each Tuesday at 8 a.m. EDT"
//              (https://droughtmonitor.unl.edu/CurrentMap.aspx)
//        NASS Crop Progress: weekly April-November, releases listed at "4:00 PM"; 1999 report text says
//              "released after 4 p.m. each Monday, except for holidays" (esmis.nal.usda.gov). Holidays ignored here.
//   3. What would a water days-of-supply figure need, using the NDSU AS1763 (rev. Feb 2026) intake table
//      (adapted from NRC/NASEM Nutrient Requirements of Beef Cattle, 8th rev. ed., 2016)?
//
// meta.csv as_of has no offset. Because the fictional ranch could sit in Central or Mountain time (South Dakota and
// Nebraska each span both), each answer is computed for both zones.

import { readFileSync, readdirSync } from "node:fs";

const ROOT = new URL("../../../", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");

// ------------------------------------------------------------------ helpers
// Convert a wall-clock time in an IANA zone to a UTC Date (two-pass offset correction, no dependencies).
function zonedToUtc(localIso, tz) {
  const [d, t = "00:00"] = localIso.split("T");
  const [Y, M, D] = d.split("-").map(Number);
  const [h, m] = t.split(":").map(Number);
  let guess = Date.UTC(Y, M - 1, D, h, m);
  for (let i = 0; i < 2; i++) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    }).formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
    const asIfUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
    guess += Date.UTC(Y, M - 1, D, h, m) - asIfUtc;
  }
  return new Date(guess);
}
const fmt = (date, tz) => new Intl.DateTimeFormat("en-US", {
  timeZone: tz, weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(date);
const ymdInTz = (date, tz) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const addDays = (ymd, n) => { const t = new Date(ymd + "T00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const dow = (ymd) => new Date(ymd + "T00:00Z").getUTCDay(); // 0 Sun .. 6 Sat

// Latest release (weekday `releaseDow` at `hhmm` Eastern) at or before instant `at`.
function latestRelease(at, releaseDow, hhmm) {
  let ymd = ymdInTz(at, "America/New_York");
  for (let i = 0; i < 8; i++, ymd = addDays(ymd, -1)) {
    if (dow(ymd) !== releaseDow) continue;
    const rel = zonedToUtc(`${ymd}T${hhmm}`, "America/New_York");
    if (rel <= at) return { ymd, rel };
  }
  return null;
}

// ------------------------------------------------------------------ 1. what the data model holds
console.log("== 1. Fields present in data/*.csv (header row of each file)");
const files = readdirSync(new URL("data/", ROOT)).filter((f) => f.endsWith(".csv")).sort();
const headers = Object.fromEntries(files.map((f) => [f, read(`data/${f}`).split(/\r?\n/)[0].split(",")]));
for (const [f, h] of Object.entries(headers)) console.log(`  ${f.padEnd(12)} ${h.join(", ")}`);
const all = new Set(Object.values(headers).flat());
const wanted = {
  "tank capacity (gallons)": ["capacity_gal", "capacity_gallons", "usable_gal"],
  "ranch location (lat/lon, county FIPS, or state)": ["lat", "lon", "latitude", "longitude", "county_fips", "fips", "state"],
  "ranch timezone": ["tz", "timezone", "time_zone"],
  "rain gauge / precipitation": ["precip_in", "rain_in", "precip"],
  "forage observation (residual, utilization, recovery)": ["residual", "utilization_pct", "stubble_in", "recovery"],
  "feed / mineral inventory": ["on_hand", "feed_tons", "mineral_lbs"],
  "maintenance / crew tasks": ["asset", "assignee", "work_order"],
};
for (const [label, keys] of Object.entries(wanted)) {
  const hit = keys.filter((k) => all.has(k));
  console.log(`  ${hit.length ? "present" : "ABSENT "}  ${label}${hit.length ? " -> " + hit.join(", ") : ""}`);
}

// ------------------------------------------------------------------ 2. latest public context at as_of
const asOf = read("data/meta.csv").trim().split(/\r?\n/)[1].trim();
console.log(`\n== 2. Latest public context available at meta.csv as_of = "${asOf}" (no offset in the file)`);
for (const tz of ["America/Chicago", "America/Denver"]) {
  const at = zonedToUtc(asOf, tz);
  const usdm = latestRelease(at, 4, "08:30");             // Thursday 08:30 ET
  const usdmValid = addDays(usdm.ymd, -2);                 // valid Tuesday (data cutoff 8 a.m. ET)
  const usdmAgeDays = (at - zonedToUtc(`${usdmValid}T08:00`, "America/New_York")) / 864e5;
  const nass = latestRelease(at, 1, "16:00");              // Monday 16:00 ET
  const nassWeekEnding = addDays(nass.ymd, -1);            // week ending Sunday
  const nassAgeDays = (at - zonedToUtc(`${nassWeekEnding}T23:59`, tz)) / 864e5;
  console.log(`  if ranch is in ${tz}: as_of instant = ${at.toISOString()} (${fmt(at, "America/New_York")} Eastern)`);
  console.log(`    USDM: latest map released ${usdm.ymd} (Thu 08:30 ET), data valid ${usdmValid} (Tue 08:00 ET) -> valid date is ${usdmAgeDays.toFixed(1)} days old at as_of`);
  console.log(`    NASS Crop Progress: latest release ${nass.ymd} (Mon 16:00 ET), week ending ${nassWeekEnding} -> ${nassAgeDays.toFixed(1)} days after week end`);
}
// Range of USDM valid-date age over a full week of viewing times (Thursday 08:30 ET release to the next one).
{
  const relThu = "2026-10-01";
  const first = zonedToUtc(`${relThu}T08:30`, "America/New_York");
  const valid = zonedToUtc(`${addDays(relThu, -2)}T08:00`, "America/New_York");
  const min = (first - valid) / 864e5, max = (first.getTime() + 7 * 864e5 - 1 - valid) / 864e5;
  console.log(`  USDM valid-date age seen by a viewer ranges from ${min.toFixed(2)} to ${max.toFixed(2)} days (release lag + 7-day cycle), before any mirror delay.`);
}

// ------------------------------------------------------------------ 3. days of supply inputs
console.log("\n== 3. Water days-of-supply: inputs and an illustration (NDSU AS1763 table, gal/head/day)");
const NDSU = { // as printed in AS1763 (rev. Feb 2026); blank cells are null
  "lactating 900 lb": { 40: 11.4, 50: 12.6, 60: 14.5, 70: 16.9, 80: 17.9, 90: 16.2 },
  "pregnant 1,110 lb": { 40: 6.0, 50: 6.5, 60: 7.4, 70: 8.7, 80: null, 90: null },
  "growing 600 lb": { 40: 5.3, 50: 5.8, 60: 6.6, 70: 7.8, 80: 8.9, 90: 12.7 },
};
for (const [cls, row] of Object.entries(NDSU)) console.log(`  ${cls.padEnd(18)} ${Object.entries(row).map(([t, v]) => `${t}F:${v ?? "--"}`).join("  ")}`);
const groups = read("data/groups.csv").trim().split(/\r?\n/).slice(1).map((l) => l.split(","));
console.log(`  groups.csv: ${groups.map((g) => `${g[0]} (${g[1]}, ${g[2]} head)`).join("; ")}`);
console.log("  water.csv carries level_pct only, so gallons on hand = level_pct x capacity is NOT computable from repo data.");
const capacityGal = 10000; // ASSUMPTION for illustration only; not in the repo
for (const [label, perHead, head] of [["Cows @70F (lactating 900 lb row)", 16.9, 180], ["Cows @80F", 17.9, 180], ["Yearlings @90F (growing 600 lb row)", 12.7, 150]]) {
  const demand = perHead * head;
  for (const pct of [40, 25]) {
    const onHand = capacityGal * pct / 100;
    console.log(`  ${label}: ${head} head x ${perHead} = ${demand.toFixed(0)} gal/day; tank ${pct}% of an ASSUMED ${capacityGal} gal = ${onHand} gal -> ${(onHand / demand).toFixed(2)} days with zero refill`);
  }
}
console.log("  Note: days-of-supply also needs refill rate (well/pipeline gpm or haul schedule); with an operating float the tank level alone is not supply.");
console.log("  Note: the printed lactating-900-lb row is not monotonic (80F 17.9 > 90F 16.2): the table is an estimate, not a threshold.");
