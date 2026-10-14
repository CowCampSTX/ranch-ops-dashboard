// Exception rules and summaries for the ranch operations dashboard. Pure functions over the parsed CSVs, shared by
// the page (app.js) and the tests. Each rule turns a threshold a manager would act on into a row: what's wrong,
// how bad, and the first thing to do about it. Thresholds live in RULES so they're easy to find and change.

export const RULES = {
  waterCritical: 25,        // % full: someone goes now
  waterLow: 40,             // % full: check on the next pass
  waterDropPts: 30,         // points lost in 24 hours: likely a leak or stuck float
  sensorSilentHours: 24,    // no reading for this long: sensor or radio problem
  graceDays: 2,             // warn this many days before a planned move date
  adgSerious: 0.8,          // group gain below 80% of target since the last weigh-in
  animalShare: 0.5,         // individual animal below 50% of target
  dueSoonDays: 7,           // health task due within a week
  budgetWarn: 0.05,         // 5% over budget, season to date
  budgetSerious: 0.10,      // 10% over budget, season to date
};

export const SEVERITY = { critical: 0, serious: 1, warning: 2 };
const DAY = 864e5;

// ---------------------------------------------------------------- parsing
export function parseCSV(text) {
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const keys = head.split(",");
  return lines.filter(Boolean).map((line) => {
    const vals = line.split(",");
    const row = {};
    keys.forEach((k, i) => {
      const v = vals[i] ?? "";
      row[k] = v !== "" && !isNaN(+v) ? +v : v;
    });
    return row;
  });
}

const days = (a, b) => (new Date(b) - new Date(a)) / DAY;

// ---------------------------------------------------------------- summaries
export function waterStatus(water, asOf) {
  const byTank = new Map();
  for (const r of water) (byTank.get(r.tank_id) ?? byTank.set(r.tank_id, []).get(r.tank_id)).push(r);
  return [...byTank].map(([tank, rows]) => {
    rows.sort((a, b) => a.time.localeCompare(b.time));
    const last = rows[rows.length - 1];
    const dayAgo = [...rows].reverse().find((r) => days(r.time, last.time) >= 1);
    return {
      tank, pasture: last.pasture_id, rows, level: last.level_pct, lastTime: last.time,
      silentHours: days(last.time, asOf) * 24,
      drop24h: dayAgo ? dayAgo.level_pct - last.level_pct : 0,
    };
  });
}

export function grazingStatus(moves, pastures, asOf) {
  const byId = Object.fromEntries(pastures.map((p) => [p.pasture_id, p]));
  return moves.filter((m) => !m.out_date).map((m) => {
    const p = byId[m.pasture_id];
    const inDays = days(m.in_date, asOf.slice(0, 10));
    return { group: m.group, pasture: p.name, pastureId: p.pasture_id, inDate: m.in_date, days: inDays, planned: p.planned_graze_days };
  });
}

/** Average daily gain per animal between the last two weigh-ins, and per group. */
export function gainStatus(weights, groups) {
  const byTag = new Map();
  for (const r of weights) (byTag.get(r.tag) ?? byTag.set(r.tag, []).get(r.tag)).push(r);
  const animals = [...byTag].map(([tag, rows]) => {
    rows.sort((a, b) => a.date.localeCompare(b.date));
    const [a, b] = rows.slice(-2);
    return { tag, group: a.group, from: a.date, to: b.date, adg: (b.weight_lbs - a.weight_lbs) / days(a.date, b.date), weight: b.weight_lbs };
  });
  const out = [];
  for (const g of groups) {
    const mine = animals.filter((x) => x.group === g.group);
    if (!mine.length) continue;
    out.push({ group: g.group, head: mine.length, target: g.target_adg_lbs, from: mine[0].from, to: mine[0].to,
      adg: mine.reduce((s, x) => s + x.adg, 0) / mine.length, animals: mine });
  }
  return out;
}

export function budgetStatus(budget) {
  const cats = new Map();
  for (const r of budget) {
    const c = cats.get(r.category) ?? cats.set(r.category, { category: r.category, budget: 0, actual: 0 }).get(r.category);
    c.budget += r.budget; c.actual += r.actual;
  }
  return [...cats.values()].map((c) => ({ ...c, variance: c.actual - c.budget, pct: (c.actual - c.budget) / c.budget }));
}

// ---------------------------------------------------------------- exceptions
const ex = (severity, area, subject, problem, action) => ({ severity, area, subject, problem, action });

export function findExceptions(d, R = RULES) {
  const asOf = d.meta[0].as_of;
  const out = [];
  const pName = Object.fromEntries(d.pastures.map((p) => [p.pasture_id, p.name]));
  const grazing = grazingStatus(d.moves, d.pastures, asOf);
  const whoIsThere = (pid) => grazing.filter((g) => g.pastureId === pid).map((g) => g.group).join(" and ");

  for (const t of waterStatus(d.water, asOf)) {
    const there = whoIsThere(t.pasture);
    const where = `Tank ${t.tank} (${pName[t.pasture]}${there ? ", " + there + " here now" : ""})`;
    if (t.silentHours >= R.sensorSilentHours) {
      out.push(ex("serious", "Water", where, `No reading for ${Math.round(t.silentHours)} hours; last level ${t.level}%`,
        "Check the tank by eye today, then the sensor battery and signal"));
      continue;   // its last level is stale, so don't also judge it
    }
    if (t.drop24h >= R.waterDropPts)
      out.push(ex("critical", "Water", where, `Dropped ${Math.round(t.drop24h)} points in 24 hours, now ${t.level}%`,
        "Check for a leak or a stuck float; haul water if it can't be fixed today"));
    else if (t.level < R.waterCritical)
      out.push(ex("critical", "Water", where, `Down to ${t.level}% full`, "Check the float and the supply line today"));
    else if (t.level < R.waterLow)
      out.push(ex("warning", "Water", where, `${t.level}% full`, "Look at it on the next pass"));
  }

  for (const g of grazing) {
    const over = g.days - g.planned;
    if (over > 0)
      out.push(ex("serious", "Grazing", `${g.group} in ${g.pasture}`, `Day ${g.days} of a ${g.planned}-day plan (${over} day${over === 1 ? "" : "s"} over)`,
        "Move them, or check the grass and record a new move date"));
    else if (over >= -R.graceDays)
      out.push(ex("warning", "Grazing", `${g.group} in ${g.pasture}`, `Planned move in ${-over} day${over === -1 ? "" : "s"}`, "Line up the move"));
  }

  for (const g of gainStatus(d.weights, d.groups)) {
    if (!g.target) continue;
    const groupLow = g.adg < g.target * R.adgSerious;
    if (groupLow)
      out.push(ex("serious", "Gain", g.group, `${g.adg.toFixed(2)} lbs/day since ${g.from} vs ${g.target.toFixed(1)} target`,
        "Check forage quality and mineral; look for a health problem in the group"));
    const slow = g.animals.filter((a) => a.adg < g.target * R.animalShare);
    if (slow.length && !groupLow)   // a group-wide problem already covers its animals
      out.push(ex("warning", "Gain", `${slow.length} ${g.group.toLowerCase()}`,
        `Under ${(g.target * R.animalShare).toFixed(1)} lbs/day: ${slow.map((a) => a.tag).join(", ")}`,
        "Pull and check these animals at the next gather"));
  }

  for (const h of d.health) {
    if (h.status !== "open" || !h.next_due) continue;
    const left = days(asOf.slice(0, 10), h.next_due);
    if (left < 0)
      out.push(ex("serious", "Health", `${h.group}: ${h.task}`, `Overdue by ${-left} day${left === -1 ? "" : "s"} (due ${h.next_due})`, "Schedule it this week"));
    else if (left <= R.dueSoonDays)
      out.push(ex("warning", "Health", `${h.group}: ${h.task}`, `Due in ${left} day${left === 1 ? "" : "s"} (${h.next_due})`, "Plan it with the next gather"));
  }

  for (const b of budgetStatus(d.budget)) {
    const pct = `${Math.round(b.pct * 100)}% over`;
    if (b.pct > R.budgetSerious)
      out.push(ex("serious", "Budget", b.category, `${pct} season to date ($${b.variance.toLocaleString()})`,
        "Find what drove it and decide whether to re-forecast"));
    else if (b.pct > R.budgetWarn)
      out.push(ex("warning", "Budget", b.category, `${pct} season to date`, "Watch it next month"));
  }

  return out.sort((a, b) => SEVERITY[a.severity] - SEVERITY[b.severity] || a.area.localeCompare(b.area));
}
