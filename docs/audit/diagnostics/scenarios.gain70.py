#!/usr/bin/env python3
"""Would RULE-GAIN-07's 70-day individual minimum keep the planted 'six slow yearlings' warning?

Run:  python3 -I docs/audit/diagnostics/scenarios.gain70.py   (reads data/weights.csv relative to this file)

The committed weigh-ins are 2026-06-01, 07-20 and 09-15 (days 0, 49, 106). Only a method that uses all three spans
70 days or more. This prints, for the six planted yearlings, the ADG of the last 57-day interval (what the dashboard
uses today), the least-squares slope over all three weigh-ins, and the Jun 1 to Sep 15 two-point ADG, then counts the
yearlings under 0.5 x 2.0 = 1.0 lb/day by each method. Plain Python on data/weights.csv; it never runs exceptions.js.
"""
import csv
from collections import defaultdict
from datetime import date
from fractions import Fraction as F
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]  # docs/audit/diagnostics/ -> repository root

by = defaultdict(dict)
for r in csv.DictReader(open(REPO / "data" / "weights.csv", newline="")):
    by[r["tag"]][r["date"]] = int(r["weight_lbs"])
d0 = date(2026, 6, 1)


def slope(tag):
    xs = [(date.fromisoformat(d) - d0).days for d in sorted(by[tag])]
    ys = [by[tag][d] for d in sorted(by[tag])]
    mx, my = F(sum(xs), len(xs)), F(sum(ys), len(ys))
    return sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)


last = lambda t: F(by[t]["2026-09-15"] - by[t]["2026-07-20"], 57)
season = lambda t: F(by[t]["2026-09-15"] - by[t]["2026-06-01"], 106)
print("tag    last 57 d   3-point slope   Jun 1-Sep 15")
for t in ["Y027", "Y031", "Y058", "Y082", "Y129", "Y132"]:
    print(f"{t}   {float(last(t)):8.3f}   {float(slope(t)):12.3f}   {float(season(t)):11.3f}")
ys = [t for t in by if t.startswith("Y")]
for name, fn in [("last 57-day interval", last), ("3-point regression (106 days)", slope), ("Jun 1-Sep 15 two-point", season)]:
    under = sorted(t for t in ys if fn(t) < 1)
    print(f"yearlings under 1.0 lb/day by {name}: {len(under)} {under}")
hs = [t for t in by if t.startswith("H")]
mean_h = sum(slope(t) for t in hs) / len(hs)
print(f"heifers: mean 3-point regression slope {float(mean_h):.4f} lb/day over {len(hs)} heifers "
      f"({'under' if mean_h < F(8, 10) else 'not under'} 0.8 x 1.0 = 0.8)")
