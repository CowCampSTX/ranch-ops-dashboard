"""Re-derive, from data/*.csv alone, the committed-data hand values that the regression tests in
docs/audit/02-findings.md depend on. It does not import or run exceptions.js or app.js.

    python3 -I docs/audit/diagnostics/findings.handvalues.py        (run from the repository root)

Each line prints CHECK <name>: <computed> | expected <value from findings.json> | MATCH or MISMATCH.
All data is fictional (Example Ranch). Every threshold used here is a demo setting from the dashboard.
"""
import csv
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path.cwd()
DATA = ROOT / "data"
results = []


def rows(name):
    with open(DATA / name, newline="") as f:
        return list(csv.DictReader(f))


def check(name, got, expected, tol=None):
    if tol is None:
        ok = got == expected
    else:
        ok = abs(got - expected) <= tol
    results.append(ok)
    print(f"CHECK {name}: {got!r} | expected {expected!r} | {'MATCH' if ok else 'MISMATCH'}")


def d(s):
    return date.fromisoformat(s)


def t(s):
    return datetime.fromisoformat(s)


meta = rows("meta.csv")
AS_OF = t(meta[0]["as_of"])
AS_OF_DAY = AS_OF.date()

# ---- Health (LOAD-01, LOAD-02, CSV-01, CSV-05, HLTH-01, TIME-03, HLTH-03)
health = rows("health.csv")
booster = next(h for h in health if h["task"] == "Booster vaccine")
pinkeye = next(h for h in health if h["task"] == "Pinkeye check")
fly = next(h for h in health if h["task"] == "Fly tag check")
check("booster days overdue on the as-of date", (AS_OF_DAY - d(booster["next_due"])).days, 15)
check("pinkeye days until due", (d(pinkeye["next_due"]) - AS_OF_DAY).days, 3)
check("open health tasks overdue or due within 7 days",
      sum(1 for h in health if h["status"] == "open" and h["next_due"] and (d(h["next_due"]) - AS_OF_DAY).days <= 7), 2)
check("fly tag row: status done, next_due days before as_of", (fly["status"], (AS_OF_DAY - d(fly["next_due"])).days), ("done", 29))

# ---- Water (LOAD-04, WAT-01..WAT-10, TEST-01)
water = defaultdict(list)
for r in rows("water.csv"):
    water[r["tank_id"]].append((t(r["time"]), float(r["level_pct"]), r["pasture_id"]))
for k in water:
    water[k].sort()
check("tank count in water.csv", len(water), 8)
check("T2 last level", water["T2"][-1][1], 11.8)
check("T2 level at 2026-09-30T12:00", dict((x[0], x[1]) for x in water["T2"])[t("2026-09-30T12:00")], 14.8)
check("T4 last level", water["T4"][-1][1], 10.0)
t6_last = water["T6"][-1]
check("T6 last reading time and level", (t6_last[0].isoformat(timespec="minutes"), t6_last[1]), ("2026-09-29T00:00", 98.5))
check("T6 hours silent at as_of", (AS_OF - t6_last[0]) / timedelta(hours=1), 42.0)
tanks_reporting_at_asof = sorted(k for k, v in water.items() if v[-1][0] == AS_OF)
check("tanks whose newest reading is at the as-of time", tanks_reporting_at_asof, ["T1", "T2", "T3", "T4", "T5", "T7", "T8"])


def worst_drawdown(series):
    """Largest (max level in the trailing 24 h) minus (level now), over every reading."""
    best = 0.0
    for i, (ti, li, _) in enumerate(series):
        window = [lv for (tj, lv, _) in series[: i + 1] if ti - tj <= timedelta(hours=24)]
        best = max(best, max(window) - li)
    return round(best, 1)


check("worst 24-hour drawdown per tank (WAT-03 no-new-alarm check)",
      {k: worst_drawdown(v) for k, v in sorted(water.items())},
      {"T1": 16.1, "T2": 15.3, "T3": 16.2, "T4": 46.0, "T5": 14.5, "T6": 12.4, "T7": 17.1, "T8": 18.2})


def endpoint_fall(series):
    """Largest (level exactly 24 h earlier) minus (level now): the measure quoted in rules.json RULE-WAT-03."""
    lv = {ti: li for ti, li, _ in series}
    return round(max([0.0] + [lv[ti - timedelta(hours=24)] - li for ti, li in lv.items() if ti - timedelta(hours=24) in lv]), 1)


check("largest exact 24-hour endpoint fall per tank (RULE-WAT-03 evidence)",
      {k: endpoint_fall(v) for k, v in sorted(water.items())},
      {"T1": 16.1, "T2": 15.3, "T3": 16.2, "T4": 46.0, "T5": 14.5, "T6": 11.8, "T7": 14.9, "T8": 18.2})

t4 = {x[0]: x[1] for x in water["T4"]}
check("T4 levels 09-29T12:00, 18:00, 09-30T00:00 (WAT-05)",
      (t4[t("2026-09-29T12:00")], t4[t("2026-09-29T18:00")], t4[t("2026-09-30T00:00")]), (67.5, 56.0, 44.5))


def longest_identical_run_below(series, ceiling):
    best = run = 0
    prev = None
    for _, lv, _ in series:
        if lv < ceiling and lv == prev:
            run += 1
        else:
            run = 1 if lv < ceiling else 0
        prev = lv
        best = max(best, run)
    return best


check("longest run of identical readings below 98% (WAT-10 control)",
      max(longest_identical_run_below(v, 98) for v in water.values()), 2)

# ---- Pastures, groups and grazing (GRZ-04, GRZ-05, GRZ-06, GRZ-08, UI-18, CSV-04)
pastures = {p["pasture_id"]: p for p in rows("pastures.csv")}
groups = {g["group"]: g for g in rows("groups.csv")}
check("total acres (header '4,300 acres')", sum(int(p["acres"]) for p in pastures.values()), 4300)
check("acres without P8 (CSV-04 blank P8 case)", sum(int(p["acres"]) for k, p in pastures.items() if k != "P8"), 4100)
check("head on grass (tile 375)", sum(int(g["head"]) for g in groups.values()), 375)
check("known head without Heifers (CSV-04 blank-head case)", sum(int(g["head"]) for k, g in groups.items() if k != "Heifers"), 330)
check("cow-calf pairs counted as two head plus the others (UI-18)", 180 * 2 + 45 + 150, 555)

moves = rows("moves.csv")
open_moves = {m["group"]: m for m in moves if not m["out_date"]}
ys = open_moves["Yearlings"]
days_in = (AS_OF_DAY - d(ys["in_date"])).days
plan = int(pastures[ys["pasture_id"]]["planned_graze_days"])
check("Yearlings in Sand Hills: day, plan, days over", (days_in, plan, days_in - plan), (24, 21, 3))
check("Cows in South Divide: day of plan", ((AS_OF_DAY - d(open_moves["Cows"]["in_date"])).days,
                                            int(pastures[open_moves["Cows"]["pasture_id"]]["planned_graze_days"])), (18, 21))


def stays():
    out = []
    for m in moves:
        end = d(m["out_date"]) if m["out_date"] else AS_OF_DAY
        out.append((m["pasture_id"], m["group"], d(m["in_date"]), end, bool(m["out_date"])))
    return out


S = stays()
# rest before each entry: in_date minus the latest earlier out_date in that pasture by any group
rest_rows = []
for pid, grp, a, b, _ in S:
    prior = [e for (p2, g2, a2, e, closed) in S if p2 == pid and closed and e <= a and (a2, g2) != (a, grp)]
    if prior:
        rest_rows.append((pid, grp, a, (a - max(prior)).days, int(pastures[pid]["min_rest_days"])))
current_rest = {(p, g): (r, mn) for (p, g, a, r, mn) in rest_rows
                if (g in open_moves and open_moves[g]["pasture_id"] == p and d(open_moves[g]["in_date"]) == a)}
check("rest before the current stays (GRZ-04)", current_rest,
      {("P7", "Cows"): (6, 60), ("P4", "Heifers"): (34, 45), ("P3", "Yearlings"): (76, 60)})
# overlaps: a pasture holding two groups on the same day (stay = in_date up to the day before out_date)
occ = defaultdict(set)
for pid, grp, a, b, closed in S:
    last = b - timedelta(days=1) if closed else AS_OF_DAY
    x = a
    while x <= last:
        occ[(pid, x)].add(grp)
        x += timedelta(days=1)
shared = defaultdict(list)
for (pid, x), gs in occ.items():
    if len(gs) > 1:
        shared[(pid, tuple(sorted(gs)))].append(x)
check("pastures holding two groups at once (GRZ-05)",
      {f"{p} {'+'.join(g)}": (min(v).isoformat(), max(v).isoformat(), len(v)) for (p, g), v in sorted(shared.items())},
      {"P2 Cows+Yearlings": ("2026-07-24", "2026-07-30", 7), "P4 Heifers+Yearlings": ("2026-06-25", "2026-07-05", 11)})
# sequential re-entries: entries whose previous occupant had already left (rest >= 0), excluding the shared-pasture entries
seq = [r for r in rest_rows if r[3] >= 0]
check("sequential re-entries and how many are short of min_rest_days (GRZ-05)",
      (len(seq), sum(1 for r in seq if r[3] < r[4])), (13, 11))
cedar = next(s for s in S if s[0] == "P6" and s[1] == "Cows")
check("Cows in Cedar Draw: days vs plan (GRZ-06)", ((cedar[3] - cedar[2]).days, int(pastures["P6"]["planned_graze_days"])), (22, 18))
occupied = {m["pasture_id"] for m in open_moves.values()}
free = {}
for pid in pastures:
    if pid in occupied:
        continue
    outs = [e for (p2, _, _, e, closed) in S if p2 == pid and closed]
    free[pid] = ((AS_OF_DAY - max(outs)).days, int(pastures[pid]["min_rest_days"]))
check("free pastures on the as-of date: rest / minimum (GRZ-08)", free,
      {"P1": (18, 45), "P2": (50, 45), "P5": (21, 45), "P6": (39, 45), "P8": (11, 30)})

# ---- Gain (GAIN-01..GAIN-12, CSV-04, UI-01, UI-16)
weights = defaultdict(dict)
wgroup = {}
for r in rows("weights.csv"):
    weights[r["tag"]][r["date"]] = float(r["weight_lbs"])
    wgroup[r["tag"]] = r["group"]
A, B = "2026-07-20", "2026-09-15"
span = (d(B) - d(A)).days
check("days between the last two weigh-ins", span, 57)


def pooled(group, skip=()):
    tags = [k for k, g in wgroup.items() if g == group and k not in skip]
    lbs = sum(weights[k][B] - weights[k][A] for k in tags)
    return round(lbs), len(tags) * span, lbs / (len(tags) * span)


h_lbs, h_days, h_adg = pooled("Heifers")
check("Heifers pooled gain lbs / animal-days", (h_lbs, h_days), (1119, 2565))
check("Heifers ADG", round(h_adg, 4), 0.4363)
y_lbs, y_days, y_adg = pooled("Yearlings")
check("Yearlings pooled gain lbs / animal-days", (y_lbs, y_days), (16608, 8550))
check("Yearlings ADG", round(y_adg, 5), 1.94246)
check("Heifers without H001", pooled("Heifers", {"H001"})[:2] + (round(pooled("Heifers", {"H001"})[2], 4),), (1088, 2508, 0.4338))
check("Yearlings without Y001", pooled("Yearlings", {"Y001"})[:2] + (round(pooled("Yearlings", {"Y001"})[2], 3),), (16468, 8493, 1.939))
adg = {k: (weights[k][B] - weights[k][A]) / span for k in wgroup}
check("yearlings under 1.0 lb/day (50% of the 2.0 demo target)",
      sorted(k for k in adg if wgroup[k] == "Yearlings" and adg[k] < 1.0), ["Y027", "Y031", "Y058", "Y082", "Y129", "Y132"])
check("H001 Jul 20 and Sep 15 weights, ADG", (weights["H001"][A], weights["H001"][B], round(adg["H001"], 3)), (1138.0, 1169.0, 0.544))
check("H026 Jul 20 and Sep 15 weights, ADG", (weights["H026"][A], weights["H026"][B], round(adg["H026"], 3)), (1130.0, 1136.0, 0.105))
check("any committed heifer or yearling with negative ADG (GAIN-09 control)", any(v < 0 for v in adg.values()), False)
check("mean yearling weight on Sep 15 (GAIN-10)",
      round(sum(weights[k][B] for k in wgroup if wgroup[k] == "Yearlings") / 150, 2), 846.74)
check("3% of that mean over 57 days, lb/day (GAIN-10)", round(0.03 * 846.74 / 57, 4), 0.4457)
check("weigh-in sessions and head weighed", sorted({dt for v in weights.values() for dt in v}), ["2026-06-01", "2026-07-20", "2026-09-15"])
check("days from the last weigh-in to the as-of date", (AS_OF_DAY - d(B)).days, 15)
check("days from Jul 20 to the as-of date (GAIN-08)", (AS_OF_DAY - d(A)).days, 72)

# ---- Budget (BUD-01..BUD-07, DATA-03, UI-01, UI-11)
budget = rows("budget.csv")
by = defaultdict(lambda: [0, 0])
by_jun_aug = defaultdict(lambda: [0, 0])
for r in budget:
    by[r["category"]][0] += int(r["budget"])
    by[r["category"]][1] += int(r["actual"])
    if r["month"] <= "2026-08":
        by_jun_aug[r["category"]][0] += int(r["budget"])
        by_jun_aug[r["category"]][1] += int(r["actual"])
check("months in budget.csv", sorted({r["month"] for r in budget}), ["2026-06", "2026-07", "2026-08", "2026-09"])
check("Fuel budget, actual, over $, over %", (by["Fuel"][0], by["Fuel"][1], by["Fuel"][1] - by["Fuel"][0],
                                             round((by["Fuel"][1] / by["Fuel"][0] - 1) * 100, 2)), (9600, 11640, 2040, 21.25))
check("Repairs budget, actual, over $, over %", (by["Repairs"][0], by["Repairs"][1], by["Repairs"][1] - by["Repairs"][0],
                                                round((by["Repairs"][1] / by["Repairs"][0] - 1) * 100, 2)), (7200, 9000, 1800, 25.0))
tb, ta = sum(v[0] for v in by.values()), sum(v[1] for v in by.values())
check("season totals and tile percent", (tb, ta, round((ta / tb - 1) * 100, 1)), (88400, 89303, 1.0))
check("categories over 5% (demo warning line)", sorted(k for k, (b_, a_) in by.items() if a_ / b_ - 1 > 0.05), ["Fuel", "Repairs"])
check("largest under-spend, % (BUD-07 control)",
      min((round((a_ / b_ - 1) * 100, 1), k, a_, b_) for k, (b_, a_) in by.items()), (-7.1, "Water and fencing", 4457, 4800))
check("Jun-Aug only: Fuel and Repairs over % and $ (BUD-01 alternative)",
      tuple((k, round((by_jun_aug[k][1] / by_jun_aug[k][0] - 1) * 100, 1), by_jun_aug[k][1] - by_jun_aug[k][0]) for k in ("Fuel", "Repairs")),
      (("Fuel", 20.0, 1440), ("Repairs", 13.3, 720)))
check("smallest monthly category budget (BUD-04 control)", min(int(r["budget"]) for r in budget), 1200)

# ---- Arithmetic quoted in regression tests that use inline fixtures (not the committed data)
for label, got, want, tol in [
    ("GAIN-12 456/285", 456 / 285, 1.6, 1e-9), ("GAIN-12 455/285", 455 / 285, 1.5965, 5e-5),
    ("GAIN-07 85.5/57", 85.5 / 57, 1.5, 1e-9), ("GAIN-04 (11690-1138)/57", (11690 - 1138) / 57, 185.1, 0.05),
    ("GAIN-05 50/57", 50 / 57, 0.877, 5e-4), ("GAIN-06 30/57 and 110/57", (30 / 57, 110 / 57), (0.5263, 1.9298), None),
    ("GAIN-01 CSV-17 120/57", 120 / 57, 2.105, 5e-4), ("DATA-01 CSV-28 40/57", 40 / 57, 0.702, 5e-4),
    ("GAIN-02 later reading 1130/2565", 1130 / 2565, 0.4405, 5e-5), ("GAIN-09 -171/57", -171 / 57, -3.0, 1e-9),
    ("GAIN-13 -85/57", -85 / 57, -1.49, 5e-3), ("GAIN-04 gridlines 185.5/0.5 + 1", 185.5 / 0.5 + 1, 372, 1e-9),
    ("WAT-06 380 / (180 x 20 / 24) hours", 380 / (180 * 20 / 24), 2.53, 5e-3),
    ("BUD-02 1,500 / 7,200", 1500 / 7200 * 100, 20.8, 0.05), ("BUD-02 1,403 / 88,400", 1403 / 88400 * 100, 1.59, 0.005),
    ("BUD-05 integer cents 74,190 x 10", 74190 * 10, 741900, 0), ("UI-03 12 x 316 / 560 px", 12 * 316 / 560, 6.8, 0.05),
    ("UI-15 66 h x 228 / 168 px", 66 * 228 / 168, 89.6, 0.05), ("UI-15 12 h x 228 / 168 px", 12 * 228 / 168, 16.3, 0.05),
    ("LOAD-04 Sep 22 12:00 to Sep 30 18:00, h", 8 * 24 + 6, 198, 0), ("LOAD-04 R13 9 d 6 h", 9 * 24 + 6, 222, 0),
]:
    if tol is None:
        check(label, tuple(round(x, 4) for x in got), want)
    else:
        check(label, round(got, 4), want, tol)

print(f"\n{sum(results)} of {len(results)} checks match")
sys.exit(0 if all(results) else 1)
