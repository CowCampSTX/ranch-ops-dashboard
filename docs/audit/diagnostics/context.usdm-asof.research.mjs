// Which U.S. Drought Monitor (USDM) week belongs to the dashboard's as_of? (research-context worker)
// Run from the repo root:  node docs/audit/diagnostics/context.usdm-asof.research.mjs
// Offline: no network, writes nothing. Reads data/meta.csv only.
//
// ROWS below are copied verbatim from the USDM data service response fetched 2026-10-16 (Hughes County, SD, FIPS 46065,
// a real county picked only as an example; the dashboard's ranch is fictional and has no location):
//   https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=46065&startdate=9/1/2026&enddate=10/15/2026&statisticsType=1
// Schedule (droughtmonitor.unl.edu, fetched 2026-10-16): data cutoff "each Tuesday at 8 a.m. EDT"; maps "released each
// Thursday at 8:30 a.m. Eastern Time". So MapDate is the Tuesday valid date and the map becomes public two days later.
//
// The point: ValidStart..ValidEnd is the week a map stands for, NOT when it was available. Picking the row whose
// ValidStart <= as_of <= ValidEnd shows a map that had not been released yet at as_of.

import { readFileSync } from "node:fs";

const ROWS = `MapDate,FIPS,County,State,None,D0,D1,D2,D3,D4,ValidStart,ValidEnd,StatisticFormatID
20261013,46065,Hughes County,SD,68.45,31.55,0.00,0.00,0.00,0.00,2026-10-13,2026-10-19,1
20261006,46065,Hughes County,SD,68.45,31.55,0.00,0.00,0.00,0.00,2026-10-06,2026-10-12,1
20260929,46065,Hughes County,SD,68.45,31.55,0.00,0.00,0.00,0.00,2026-09-29,2026-10-05,1
20260922,46065,Hughes County,SD,91.73,8.27,0.00,0.00,0.00,0.00,2026-09-22,2026-09-28,1
20260915,46065,Hughes County,SD,88.87,11.13,0.00,0.00,0.00,0.00,2026-09-15,2026-09-21,1`;

const [head, ...lines] = ROWS.split("\n");
const keys = head.split(",");
const rows = lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [keys[i], v])));

// wall-clock time in an IANA zone -> UTC Date (two-pass offset correction)
function zonedToUtc(localIso, tz) {
  const [d, t = "00:00"] = localIso.split("T");
  const [Y, M, D] = d.split("-").map(Number);
  const [h, m] = t.split(":").map(Number);
  let guess = Date.UTC(Y, M - 1, D, h, m);
  for (let i = 0; i < 2; i++) {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric",
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
    guess += Date.UTC(Y, M - 1, D, h, m) - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
  }
  return new Date(guess);
}
const addDays = (ymd, n) => { const t = new Date(ymd + "T00:00Z"); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
const summary = (r) => r ? `MapDate ${r.MapDate} (None ${r.None}%, D0 ${r.D0}%, D1+ ${(+r.D1).toFixed(2)}%)` : "none";

const asOf = readFileSync(new URL("../../../data/meta.csv", import.meta.url), "utf8").trim().split(/\r?\n/)[1].trim();
console.log(`meta.csv as_of = "${asOf}" (no offset in the file)\n`);
for (const tz of ["America/Chicago", "America/Denver"]) {
  const at = zonedToUtc(asOf, tz);
  const asOfDay = asOf.slice(0, 10);
  const naive = rows.find((r) => r.ValidStart <= asOfDay && asOfDay <= r.ValidEnd);
  const released = rows.filter((r) => zonedToUtc(`${addDays(r.ValidStart, 2)}T08:30`, "America/New_York") <= at)
    .sort((a, b) => b.MapDate.localeCompare(a.MapDate))[0];
  console.log(`ranch in ${tz}: as_of instant ${at.toISOString()}`);
  console.log(`  naive (ValidStart <= as_of <= ValidEnd): ${summary(naive)}  <- released ${addDays(naive.ValidStart, 2)} 08:30 ET, AFTER as_of`);
  console.log(`  release-aware (released by as_of):       ${summary(released)}`);
}
