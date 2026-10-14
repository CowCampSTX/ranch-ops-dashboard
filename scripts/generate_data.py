"""Builds the fictional dataset in data/ for the ranch operations dashboard.

Everything here is made up: a 4,300-acre cow-calf and yearling operation called "Example Ranch", one grazing season
(June 1 to September 30, 2026). A fixed random seed makes the files identical on every run. A handful of problems are
planted on purpose so the exception report has something real to find; they're listed in PLANTED below and in the
README, and tests/exceptions.test.mjs checks the dashboard finds each one.

    python3 scripts/generate_data.py
"""
import csv
import random
from datetime import date, datetime, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data"
AS_OF = datetime(2026, 9, 30, 18, 0)
START = date(2026, 6, 1)
rng = random.Random(2026)

PLANTED = [
    "Tank T4 (Lone Tree) loses about 45 points in a day: a leak or a stuck float",
    "Tank T6 (Cedar Draw) stops reporting about 40 hours before the as-of time",
    "Tank T2 (Windmill) runs low, under 25%",
    "The yearlings have been in Sand Hills 3 days past the plan",
    "The first-calf heifers gained well under target since the last weigh-in",
    "Six yearlings gained less than half of target",
    "The yearlings' booster is overdue; the cows' pinkeye check is due within a week",
    "Fuel and repairs are over budget for the season",
]

PASTURES = [  # id, name, acres, planned graze days per move, minimum rest days
    ("P1", "North Flat", 640, 21, 45), ("P2", "Windmill", 560, 18, 45), ("P3", "Sand Hills", 720, 21, 60),
    ("P4", "Lone Tree", 480, 14, 45), ("P5", "Creek Bottom", 400, 14, 45), ("P6", "Cedar Draw", 600, 18, 45),
    ("P7", "South Divide", 700, 21, 60), ("P8", "Home Trap", 200, 10, 30),
]
GROUPS = [  # group, class, head, target ADG (lbs/day)
    ("Cows", "cow-calf pairs", 180, 0.0), ("Heifers", "first-calf heifers", 45, 1.0), ("Yearlings", "yearling steers", 150, 2.0),
]
TANKS = [("T1", "P1"), ("T2", "P2"), ("T3", "P3"), ("T4", "P4"), ("T5", "P5"), ("T6", "P6"), ("T7", "P7"), ("T8", "P8")]


def write(name, header, rows):
    with open(OUT / name, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def moves():
    """Each group's pasture rotation. Yearlings are left in Sand Hills past the plan (planted)."""
    plan = {
        "Cows": [("P1", 21), ("P7", 21), ("P2", 18), ("P6", 22), ("P1", 21), ("P7", 21)],
        "Heifers": [("P8", 10), ("P5", 14), ("P4", 14), ("P8", 10), ("P5", 14), ("P4", 14), ("P8", 10), ("P5", 14), ("P8", 10), ("P4", 14)],
        "Yearlings": [("P3", 21), ("P4", 14), ("P6", 18), ("P2", 18), ("P5", 14), ("P7", 12), ("P3", 24)],
    }
    rows = []
    for group, steps in plan.items():
        day = START
        for i, (pid, days) in enumerate(steps):
            out = day + timedelta(days=days)
            last = i == len(steps) - 1
            rows.append((group, pid, day.isoformat(), "" if last else out.isoformat()))
            day = out
    return rows


def weights():
    """Individual weigh-ins for heifers and yearlings on June 1, July 20 and September 15."""
    days = [date(2026, 6, 1), date(2026, 7, 20), date(2026, 9, 15)]
    rows = []
    slow = set(rng.sample(range(150), 6))                     # planted: six poor-doing yearlings
    for group, start_wt, adg, sd, n in [("Heifers", 1050, 1.0, 0.25, 45), ("Yearlings", 640, 2.0, 0.3, 150)]:
        for i in range(n):
            tag = f"{group[0]}{i + 1:03d}"
            wt = start_wt + rng.gauss(0, 45)
            for k, d in enumerate(days):
                if k:
                    gap = (d - days[k - 1]).days
                    rate = adg + rng.gauss(0, sd)
                    if group == "Heifers" and k == 2:
                        rate = 0.45 + rng.gauss(0, 0.15)     # planted: heifers slipped in late summer
                    if group == "Yearlings" and i in slow and k == 2:
                        rate = 0.6 + rng.gauss(0, 0.15)
                    wt += rate * gap
                rows.append((tag, group, d.isoformat(), round(wt)))
    return rows


def water():
    """Tank level (% full) every 6 hours. Normal tanks cycle between refills; three are planted problems."""
    rows = []
    t0 = datetime(2026, 9, 1)
    for tank, pid in TANKS:
        level, t = rng.uniform(70, 95), t0
        while t <= AS_OF:
            if tank == "T6" and t > AS_OF - timedelta(hours=40):
                break                                         # planted: sensor goes quiet
            if tank == "T4" and t >= AS_OF - timedelta(hours=24):
                level -= 11.5                                 # planted: leak
            elif tank == "T2" and t >= AS_OF - timedelta(days=4):
                level -= 3.0                                  # planted: refill not keeping up
            else:
                level += rng.uniform(-6, 6)
                if level < 55:
                    level += 30                               # float valve refills
            level = max(2, min(100, level))
            rows.append((tank, pid, t.isoformat(timespec="minutes"), round(level, 1)))
            t += timedelta(hours=6)
    return rows


def health():
    return [
        ("Cows", "Fly tag check", "2026-06-05", "2026-09-01", "done"),
        ("Cows", "Pinkeye check", "2026-08-01", "2026-10-03", "open"),       # planted: due within a week
        ("Heifers", "Pre-breeding vaccine", "2026-06-10", "", "done"),
        ("Heifers", "Pregnancy check", "2026-09-20", "2026-10-25", "open"),
        ("Yearlings", "Booster vaccine", "2026-06-02", "2026-09-15", "open"),  # planted: overdue
        ("Yearlings", "Deworm", "2026-06-02", "2026-11-01", "open"),
    ]


def budget():
    """Monthly budget and actual by category. Fuel and repairs run over (planted)."""
    plan = {"Feed and mineral": 6200, "Fuel": 2400, "Repairs": 1800, "Vet and health": 1500, "Labor": 9000, "Water and fencing": 1200}
    over = {"Fuel": [1.08, 1.22, 1.30, 1.25], "Repairs": [0.9, 1.4, 1.1, 1.6]}
    rows = []
    for m, month in enumerate(["2026-06", "2026-07", "2026-08", "2026-09"]):
        for cat, amt in plan.items():
            factor = over.get(cat, [None] * 4)[m] or rng.uniform(0.9, 1.04)
            rows.append((month, cat, amt, round(amt * factor)))
    return rows


def main():
    OUT.mkdir(exist_ok=True)
    write("pastures.csv", ["pasture_id", "name", "acres", "planned_graze_days", "min_rest_days"], PASTURES)
    write("groups.csv", ["group", "class", "head", "target_adg_lbs"], GROUPS)
    write("moves.csv", ["group", "pasture_id", "in_date", "out_date"], moves())
    write("weights.csv", ["tag", "group", "date", "weight_lbs"], weights())
    write("water.csv", ["tank_id", "pasture_id", "time", "level_pct"], water())
    write("health.csv", ["group", "task", "last_done", "next_due", "status"], health())
    write("budget.csv", ["month", "category", "budget", "actual"], budget())
    (OUT / "meta.csv").write_text(f"as_of\n{AS_OF.isoformat(timespec='minutes')}\n")
    print(f"wrote {len(list(OUT.glob('*.csv')))} files to {OUT}")


if __name__ == "__main__":
    main()
