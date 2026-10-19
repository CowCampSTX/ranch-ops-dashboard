#!/usr/bin/env python3
"""Build the synthetic Phase-1 test scenarios in docs/audit/scenarios/ and check every expected.json.

Run from the repository root:

    python3 -I docs/audit/diagnostics/scenarios.build.py

What it does
  1. Reads the committed data/*.csv (never changes them) and writes one folder per scenario under
     docs/audit/scenarios/<NN-name>/. Each folder is a complete, loadable data set: the committed files are copied
     byte for byte where the scenario does not change them; changed and added files are written the way the
     generator writes them (Python csv.writer, CRLF), except where a scenario changes the bytes on purpose.
  2. Writes expected.json for each scenario: the designed Phase-1 result. Every number in it is computed here, in
     Python, from that scenario's own CSV files by a small explicit calculation (and the arithmetic is repeated by
     hand in the scenario's scenario.md). Nothing here imports, runs or copies exceptions.js or app.js.
  3. Runs an independent reference sweep over every scenario: the Phase-1 rules written in Python from the rule
     text in docs/audit/data/findings.json and rules.json, with the demonstration settings in
     docs/audit/scenarios/settings.json. It reports any row the sweep finds that expected.json does not list (and the
     reverse). Each scenario should print "consistent".

All data is fictional (Example Ranch). Every threshold is a demonstration setting, not a validated value.
"""
import csv
import io
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from fractions import Fraction as F
from pathlib import Path
from zoneinfo import ZoneInfo

REPO = Path.cwd()
DATA = REPO / "data"
OUT = REPO / "docs" / "audit" / "scenarios"
if not (DATA / "water.csv").exists() or not (REPO / "exceptions.js").exists():
    sys.exit("run from the repository root")

FILES = ["pastures", "groups", "moves", "weights", "water", "health", "budget", "meta"]
RANCH_TZ = "America/Chicago"   # demonstration setting for the fictional ranch (see settings.json)
AS_OF = "2026-09-30T18:00"
TANKS = [("T1", "P1"), ("T2", "P2"), ("T3", "P3"), ("T4", "P4"), ("T5", "P5"), ("T6", "P6"), ("T7", "P7"), ("T8", "P8")]
COMPUTED_BY = ("docs/audit/diagnostics/scenarios.build.py: Python arithmetic on this folder's CSV files. "
               "It never calls exceptions.js or app.js.")

# ------------------------------------------------------------------------------------------------ settings
SETTINGS = {
    "note": ("Demonstration settings used to write the expected Phase-1 results. None is a validated operating value; "
             "each is to be tuned per ranch. Class D = synthetic demonstration setting, C = ranch-specific management "
             "choice (docs/audit/data/rules-index.json legend). 'scenario assumption' marks a value the registries do not "
             "give; it was chosen here only so a fixture has one expected answer."),
    "settings": [
        {"name": "waterCriticalPct", "value": 25, "comparison": "critical when the latest valid level < 25", "class": "C", "basis": "RULE-WAT-01 (current value, demo setting)"},
        {"name": "waterLowPct", "value": 40, "comparison": "warning when the latest valid level < 40", "class": "C", "basis": "RULE-WAT-02"},
        {"name": "waterDropPts", "value": 30, "comparison": "critical when (highest level in [last - 24 h, last]) - last level, rounded to 0.1, >= 30", "class": "D", "basis": "RULE-WAT-03; window per WAT-03's proposed fix (02-findings.md 7.2 item 6 records the alternative); rounding per WAT-08"},
        {"name": "dropWindowMinReadings", "value": 2, "comparison": "fewer than 2 valid readings in [last - 24 h, last]: the 24-hour change is CAN'T TELL ('not enough recent history'), the level is still judged", "class": "D", "basis": "WAT-03 proposed fix; lead default 'bounded 24-hour drop window'"},
        {"name": "sensorSilentHours", "value": 24, "comparison": "serious when as_of - last reading >= 24 h; level and drop not judged", "class": "C", "basis": "RULE-WAT-04 (measured against as_of)"},
        {"name": "graceDays", "value": 2, "comparison": "serious when days in pasture - planned_graze_days > 0; warning when it is between -2 and 0 inclusive ('due today' at 0)", "class": "D", "basis": "RULE-GRZ-01, RULE-GRZ-02, UI-06"},
        {"name": "plannedGrazeDays", "value": "per pasture (pastures.csv)", "comparison": "", "class": "D", "basis": "RULE-GRZ-01"},
        {"name": "adgSerious", "value": 0.8, "comparison": "serious when pooled group ADG < 0.8 x target (strict)", "class": "C", "basis": "RULE-GAIN-01; pooled sum(lbs)/sum(days) per GAIN-03 and GAIN-12"},
        {"name": "animalShare", "value": 0.5, "comparison": "warning when an animal's ADG < 0.5 x target (strict), only if the group is not already serious", "class": "C", "basis": "RULE-GAIN-02, RULE-WF-19"},
        {"name": "targetAdgLbs", "value": "Heifers 1.0, Yearlings 2.0, Cows 0.0 (not judged)", "comparison": "", "class": "D", "basis": "RULE-GAIN-03, RULE-GAIN-04, RULE-GAIN-05, GAIN-13"},
        {"name": "gainMinIntervalDays", "value": 21, "comparison": "the two weigh sessions compared must be at least 21 days apart; used for the group and, in these fixtures, for the individual rule too", "class": "D", "basis": "GAIN-03's example demo value. RULE-GAIN-07 recommends a separate 70-day individual default that the committed 57-day interval does not meet (02-findings.md 7.2 item 5); these fixtures do not adopt it"},
        {"name": "weighSessionShare", "value": 0.5, "comparison": "a weigh session is a date on which at least half of the group's head (groups.csv) crossed the scale", "class": "D", "basis": "scenario assumption, from GAIN-03's 'dates when most of the group crossed the scale'"},
        {"name": "gainMaxAgeDays", "value": 45, "comparison": "CAN'T TELL when the group's latest weigh session is more than 45 days before the as-of date", "class": "D", "basis": "GAIN-08 (demo limit)"},
        {"name": "gainMinCoverage", "value": 0.5, "comparison": "CAN'T TELL when animals weighed at both sessions / head < 0.5", "class": "D", "basis": "scenario assumption; RULE-GAIN-10 and GAIN-07 call for a labelled minimum but give no number. Scenario 06 uses 3 of 45, which any minimum above 7% treats the same way"},
        {"name": "dueSoonDays", "value": 7, "comparison": "warning when 0 <= days to next_due <= 7 ('due today' at 0); serious when next_due is before the as-of date", "class": "D", "basis": "RULE-HLTH-01, RULE-HLTH-02, UI-06"},
        {"name": "healthStatuses", "value": "open, done, cancelled (trimmed, lower case)", "comparison": "any other value is a data issue and is treated as open", "class": "C", "basis": "HLTH-01, RULE-HLTH-03"},
        {"name": "budgetWarn", "value": "5% and $500", "comparison": "warning when percent over >= 5% and dollars over >= $500", "class": "D", "basis": "RULE-BUD-03 demo values; BUD-05 inclusive 5% bound"},
        {"name": "budgetSerious", "value": "more than 10% and $1,000", "comparison": "serious when percent over > 10% (strict, as the rules table says 'more than 10%') and dollars over >= $1,000", "class": "D", "basis": "RULE-BUD-03 dollar line; BUD-05 and the current rule text for the strict 10% bound. RULE-BUD-03's own formula says p >= 10%: an open decision, see scenario 09"},
        {"name": "budgetLargeUsd", "value": 2500, "comparison": "warning when dollars over >= $2,500 whatever the percent", "class": "D", "basis": "RULE-BUD-03"},
        {"name": "unbudgetedUsd", "value": 250, "comparison": "a category with a zero budget and spending >= $250 gives a warning in dollars, never a percent", "class": "C", "basis": "RULE-BUD-06; severity 'warning' as in budget.materiality.research.mjs S4 (quoted in rules.json RULE-BUD-06 evidence)"},
        {"name": "monthClosed", "value": "a month counts when the ranch as-of date is on or after its last day", "comparison": "as_of 2026-09-30T18:00 closes September", "class": "C", "basis": "BUD-01 (assumption listed in findings.json unresolved_assumptions). RULE-BUD-05 and data-fields.json default books_closed_through to the month before as_of: an open decision, see scenario 08"},
        {"name": "ranchTimeZone", "value": RANCH_TZ, "comparison": "meta.csv timezone for every new fixture; readings are ranch wall-clock time", "class": "D", "basis": "TIME-02 (example zone); data-fields.json meta.timezone"},
    ],
}

# ------------------------------------------------------------------------------------------------ CSV helpers
def committed_bytes(name):
    return (DATA / f"{name}.csv").read_bytes()


def committed_rows(name):
    text = committed_bytes(name).decode("utf-8")
    rows = list(csv.reader(io.StringIO(text)))
    return rows[0], rows[1:]


def csv_text(header, rows, terminator="\r\n"):
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator=terminator)
    w.writerow(header)
    w.writerows(rows)
    return buf.getvalue()


def meta_text(as_of=AS_OF, tz=RANCH_TZ):
    return f"as_of,timezone\n{as_of},{tz}\n"


def tanks_text(tanks=TANKS):
    return csv_text(["tank_id", "pasture_id"], [list(t) for t in tanks])


HLTH03_FIXED_ROW = ["Cows", "Fly tag check", "2026-09-01", "", "done"]   # HLTH-03's proposed generator fix


def health_fixed_rows():
    h, rows = committed_rows("health")
    return h, [HLTH03_FIXED_ROW if r[1] == "Fly tag check" else r for r in rows]


# ------------------------------------------------------------------------------------------------ parsing for the sweep
DAY_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
STAMP_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$")
ASOF_RE = re.compile(r"^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})([+-]\d{2}:\d{2}|Z)?$")


def parse_day(s):
    if not DAY_RE.match(s or ""):
        return None
    try:
        return date.fromisoformat(s)
    except ValueError:
        return None


def parse_stamp(s):
    if not STAMP_RE.match(s or ""):
        return None
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return None


def parse_level(s):
    t = (s or "").strip()
    if t.endswith("%"):
        t = t[:-1]
    if not re.match(r"^-?\d+(\.\d+)?$", t):
        return None
    v = F(t)
    return v if 0 <= v <= 100 else None


def parse_weight(s):
    t = (s or "").replace(",", "").strip()
    return F(t) if re.match(r"^\d+(\.\d+)?$", t) else None


def parse_money_cents(s):
    t = (s or "").strip()
    if t == "":
        return "blank"
    neg = t.startswith("(") and t.endswith(")")
    t = t.strip("()").replace("$", "").replace(",", "").strip()
    if not re.match(r"^-?\d+(\.\d{1,2})?$", t):
        return None
    c = int(F(t) * 100)
    return -c if neg else c


def load_folder(folder):
    """RFC 4180 reading with the Phase-1 contract basics: BOM stripped, CRLF / CR / doubled CR accepted, cells and
    headers trimmed, blank and whitespace-only rows skipped and counted."""
    files = {}
    for name in FILES + ["tanks"]:
        p = folder / f"{name}.csv"
        if not p.exists():
            files[name] = None
            continue
        text = p.read_bytes().decode("utf-8-sig")
        text = text.replace("\r\r\n", "\n").replace("\r\n", "\n").replace("\r", "\n")
        rows = list(csv.reader(io.StringIO(text)))
        header = [h.strip() for h in rows[0]] if rows else []
        body, blanks = [], 0
        for i, r in enumerate(rows[1:], start=2):
            cells = [c.strip() for c in r]
            if not any(cells) or cells == header:
                blanks += 1
                continue
            body.append((i, dict(zip(header, cells + [""] * max(0, len(header) - len(cells))))))
        files[name] = {"header": header, "rows": body, "blanks": blanks}
    return files


REQUIRED = {
    "pastures": ["pasture_id", "name", "acres", "planned_graze_days", "min_rest_days"],
    "groups": ["group", "class", "head", "target_adg_lbs"],
    "moves": ["group", "pasture_id", "in_date", "out_date"],
    "weights": ["tag", "group", "date", "weight_lbs"],
    "water": ["tank_id", "pasture_id", "time", "level_pct"],
    "health": ["group", "task", "last_done", "next_due", "status"],
    "budget": ["month", "category", "budget", "actual"],
    "meta": ["as_of"],
    "tanks": ["tank_id", "pasture_id"],
}
AREA_OF = {"water": "Water", "tanks": "Water", "moves": "Grazing", "pastures": "Grazing", "weights": "Gain",
           "groups": "Gain", "health": "Health", "budget": "Budget", "meta": "Data"}


# ------------------------------------------------------------------------------------------------ reference sweep
def sweep(folder):
    """The Phase-1 rules, written from the registry text with the settings above. Returns (rows, facts)."""
    out = []
    facts = {}

    def add(area, kind, key, state, severity=None, topic=None, **nums):
        out.append({"area": area, "kind": kind, "key": key, "state": state, "severity": severity, "topic": topic, "nums": nums})

    f = load_folder(folder)
    usable = {}
    for name, req in REQUIRED.items():
        if f[name] is None:
            if name == "tanks":
                add("Water", "file", "tanks.csv", "data-issue", topic="no-tank-list")
            else:
                add(AREA_OF[name], "file", f"{name}.csv", "data-issue", topic="missing-file")
            usable[name] = False
            continue
        missing = [c for c in req if c not in f[name]["header"]]
        if missing:
            add(AREA_OF[name], "file", f"{name}.csv", "data-issue", topic="missing-column", columns=missing)
            usable[name] = False
            continue
        usable[name] = True
        if f[name]["blanks"]:
            add(AREA_OF[name], "file", f"{name}.csv", "data-issue", topic="blank-rows", count=f[name]["blanks"])

    # ---- as_of in ranch wall-clock time
    m = f["meta"]["rows"][0][1]
    raw, tz = m.get("as_of", ""), m.get("timezone", "")
    mm = ASOF_RE.match(raw)
    naive = datetime.fromisoformat(mm.group(1))
    if mm.group(2):
        aware = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        as_of = aware.astimezone(ZoneInfo(tz)).replace(tzinfo=None) if tz else naive
    else:
        as_of = naive
    if not tz and not mm.group(2):
        add("Data", "file", "meta.csv", "data-issue", topic="no-timezone")
    as_of_date = as_of.date()
    facts["as_of_local"] = as_of.isoformat(timespec="minutes")
    areas_cant = set()

    pastures = {r["pasture_id"]: r for _, r in f["pastures"]["rows"]} if usable["pastures"] else {}
    groups = {r["group"]: r for _, r in f["groups"]["rows"]} if usable["groups"] else {}

    # ---- grazing: current stay per group, judged from as_of
    current_stay = {}
    if usable["moves"]:
        valid = defaultdict(list)
        unknown_groups = set()
        for _, r in f["moves"]["rows"]:
            g = r["group"]
            if g not in groups and g not in unknown_groups:
                unknown_groups.add(g)
                add("Grazing", "record", g, "data-issue", topic="unknown-group")
            i_d = parse_day(r["in_date"])
            o_d = parse_day(r["out_date"]) if r["out_date"] else None
            if i_d is None or (r["out_date"] and o_d is None):
                add("Grazing", "record", g, "data-issue", topic="bad-date")
                continue
            if i_d > as_of_date:
                add("Grazing", "record", g, "data-issue", topic="future", in_date=i_d.isoformat())
                continue
            valid[g].append((i_d, o_d, r["pasture_id"]))
        for g, stays in valid.items():
            opens = [s for s in stays if s[1] is None]
            if len(opens) > 1:
                add("Grazing", "record", g, "data-issue", topic="open-stays", count=len(opens))
            cur = [s for s in stays if s[0] <= as_of_date and (s[1] is None or s[1] > as_of_date)]
            if not cur:
                continue
            i_d, o_d, pid = max(cur)
            current_stay[g] = pid
            if pid not in pastures:
                add("Grazing", "record", g, "data-issue", topic="unknown-pasture", pasture_id=pid)
                continue
            plan_s = pastures[pid]["planned_graze_days"]
            if not re.match(r"^\d+$", plan_s) or int(plan_s) <= 0:
                add("Grazing", "record", g, "data-issue", topic="bad-plan")
                continue
            plan = int(plan_s)
            days = (as_of_date - i_d).days
            over = days - plan
            name = pastures[pid]["name"]
            if over > 0:
                add("Grazing", "stay", g, "needs-attention", "serious", pasture=name, days=days, plan=plan, over=over)
            elif over >= -2:
                add("Grazing", "stay", g, "needs-attention", "warning", pasture=name, days=days, plan=plan, days_left=-over)
    else:
        areas_cant.add("Grazing")

    # ---- water
    tank_pasture = {}
    if usable["tanks"]:
        tank_pasture = {r["tank_id"]: r["pasture_id"] for _, r in f["tanks"]["rows"]}
    if usable["water"]:
        per = defaultdict(list)
        future = []
        exact_dups = 0
        for _, r in f["water"]["rows"]:
            tid = r["tank_id"]
            if usable["tanks"] and tid not in tank_pasture:
                add("Water", "tank", tid, "data-issue", topic="unknown-tank")
            if not usable["tanks"]:
                tank_pasture.setdefault(tid, r["pasture_id"])
            t = parse_stamp(r["time"])
            if t is None:
                add("Water", "tank", tid, "data-issue", topic="bad-time")
                continue
            if t > as_of:
                future.append((tid, r["time"]))
                continue
            per[tid].append((t, parse_level(r["level_pct"]), r["level_pct"]))
        if future:
            add("Water", "file", "water.csv", "data-issue", topic="future", count=len(future),
                first=min(x[1] for x in future), last=max(x[1] for x in future))
        tile_ok, tile_n = 0, 0
        for tid in sorted(tank_pasture):
            tile_n += 1
            rows = per.get(tid, [])
            by_time = defaultdict(list)
            for t, lvl, rawv in rows:
                by_time[t].append((lvl, rawv))
            series = []
            for t in sorted(by_time):
                vals = by_time[t]
                distinct = sorted(set(v[1] for v in vals))
                if len(vals) > 1 and len(distinct) == 1:
                    exact_dups += len(vals) - 1
                elif len(distinct) > 1:
                    add("Water", "tank", tid, "data-issue", topic="conflicting-readings", values=distinct)
                good = [v[0] for v in vals if v[0] is not None]
                series.append((t, min(good) if good else None, vals[-1][1]))
            if not series:
                add("Water", "tank", tid, "cant-tell", "serious", topic="no-readings")
                continue
            newest = series[-1]
            valid = [s for s in series if s[1] is not None]
            if newest[1] is None:
                last_good = valid[-1] if valid else None
                add("Water", "tank", tid, "cant-tell", "serious", topic="bad-level", raw=newest[2],
                    last_good_level=float(last_good[1]) if last_good else None,
                    last_good_time=last_good[0].isoformat(timespec="minutes") if last_good else None)
                continue
            last = valid[-1]
            silent = (as_of - last[0]).total_seconds() / 3600
            if silent >= 24:
                add("Water", "tank", tid, "needs-attention", "serious", silent_hours=silent, level_pct=float(last[1]))
                continue
            window = [s for s in valid if last[0] - timedelta(hours=24) <= s[0] <= last[0]]
            drop = None
            if len(window) < 2:
                add("Water", "tank", tid, "cant-tell", None, topic="drop-history")
            else:
                drop = round(max(s[1] for s in window) - last[1], 1)
            lvl = last[1]
            if drop is not None and drop >= 30:
                add("Water", "tank", tid, "needs-attention", "critical", drop_pts=float(drop), level_pct=float(lvl))
            elif lvl < 25:
                add("Water", "tank", tid, "needs-attention", "critical", level_pct=float(lvl))
            elif lvl < 40:
                add("Water", "tank", tid, "needs-attention", "warning", level_pct=float(lvl))
            else:
                tile_ok += 1
        if exact_dups:
            add("Water", "file", "water.csv", "data-issue", topic="duplicates", count=exact_dups)
        facts["water_tile"] = {"ok": tile_ok, "of": tile_n}
    else:
        areas_cant.add("Water")

    # ---- gain: pooled ADG over the group's last two weigh sessions
    if usable["weights"] and usable["groups"]:
        seen = {}
        future = 0
        groups_of_tag = defaultdict(set)
        for _, r in f["weights"]["rows"]:
            d = parse_day(r["date"])
            w = parse_weight(r["weight_lbs"])
            if d is None or w is None:
                add("Gain", "record", r["tag"], "data-issue", topic="bad-value")
                continue
            if d > as_of_date:
                future += 1
                continue
            if r["group"] not in groups:
                add("Gain", "record", r["group"], "data-issue", topic="unknown-group")
            k = (r["tag"], d)
            if k in seen:
                if seen[k][1] != w:
                    add("Gain", "record", r["tag"], "data-issue", topic="same-day-duplicate", date=d.isoformat())
                continue          # keep the first reading
            seen[k] = (r["group"], w)
            groups_of_tag[r["tag"]].add(r["group"])
        if future:
            add("Gain", "file", "weights.csv", "data-issue", topic="future", count=future)
        for tag, gs in groups_of_tag.items():
            if len(gs) > 1:
                add("Gain", "record", tag, "data-issue", topic="group-change", groups=sorted(gs))
        facts["gain"] = {}
        for g, gr in groups.items():
            target = F(gr["target_adg_lbs"])
            head = int(gr["head"])
            mine = {(t, d): w for (t, d), (gg, w) in seen.items() if gg == g}
            per_date = Counter(d for (_, d) in mine)
            dates_of_tag = defaultdict(set)
            for (t, d) in mine:
                dates_of_tag[t].add(d)
            singles = sorted(t for t, ds in dates_of_tag.items() if len(ds) == 1)
            for t in singles:
                add("Gain", "record", t, "cant-tell", None, topic="first-weigh-in")
            if target == 0:
                continue
            sessions = sorted(d for d, n in per_date.items() if n >= F(head, 2))
            off = sorted({t for (t, d) in mine if d not in sessions})
            if off and len(sessions) >= 1:
                add("Gain", "record", f"{g} off-session", "data-issue", topic="off-session", tags=off,
                    dates=sorted({d.isoformat() for (t, d) in mine if d not in sessions}))
            if not sessions:
                add("Gain", "group", g, "cant-tell", None, topic="no-session")
                continue
            s2 = sessions[-1]
            earlier = [s for s in sessions if (s2 - s).days >= 21]
            if not earlier:
                add("Gain", "group", g, "cant-tell", None, topic="one-session")
                continue
            s1 = earlier[-1]
            age = (as_of_date - s2).days
            if age > 45:
                add("Gain", "group", g, "cant-tell", None, topic="stale", last_session=s2.isoformat(), age_days=age)
                continue
            matched = sorted(t for t in dates_of_tag if s1 in dates_of_tag[t] and s2 in dates_of_tag[t])
            if F(len(matched), head) < F(1, 2):
                add("Gain", "group", g, "cant-tell", None, topic="coverage", weighed=len(matched), head=head)
                continue
            n_days = (s2 - s1).days
            gain = sum(mine[(t, s2)] - mine[(t, s1)] for t in matched)
            pooled = gain / (len(matched) * n_days)
            facts["gain"][g] = {"from": s1.isoformat(), "to": s2.isoformat(), "lbs": float(gain), "animal_days": len(matched) * n_days,
                                "adg": float(pooled), "weighed": len(matched), "head": head}
            if pooled < F(4, 5) * target:
                add("Gain", "group", g, "needs-attention", "serious", adg=float(pooled), target=float(target),
                    weighed=len(matched), head=head, **{"from": s1.isoformat(), "to": s2.isoformat()})
            else:
                slow = [t for t in matched if F(mine[(t, s2)] - mine[(t, s1)], n_days) < F(1, 2) * target]
                if slow:
                    add("Gain", "animals", g, "needs-attention", "warning", count=len(slow), tags=slow,
                        threshold=float(F(1, 2) * target))
    else:
        areas_cant.add("Gain")

    # ---- health
    if usable["health"]:
        for _, r in f["health"]["rows"]:
            key = f"{r['group']}: {r['task']}"
            st = r["status"].strip().lower()
            if st not in ("open", "done", "cancelled"):
                add("Health", "task", key, "data-issue", topic="unknown-status", status=r["status"])
                st = "open"
            nd = parse_day(r["next_due"]) if r["next_due"] else None
            ld = parse_day(r["last_done"]) if r["last_done"] else None
            if st == "done" and nd and ld and ld < nd <= as_of_date:
                add("Health", "task", key, "data-issue", topic="contradiction")
            if st != "open":
                continue
            if nd is None:
                add("Health", "task", key, "data-issue", topic="no-due-date")
                continue
            left = (nd - as_of_date).days
            if left < 0:
                add("Health", "task", key, "needs-attention", "serious", overdue_days=-left, due=nd.isoformat())
            elif left <= 7:
                add("Health", "task", key, "needs-attention", "warning", due_in_days=left, due=nd.isoformat())
    else:
        areas_cant.add("Health")

    # ---- budget over closed months
    if usable["budget"]:
        def month_end(ym):
            y, mo = int(ym[:4]), int(ym[5:7])
            nxt = date(y + (mo == 12), mo % 12 + 1, 1)
            return nxt - timedelta(days=1)

        cats = defaultdict(lambda: {"b": 0, "a": 0, "blank": [], "months": []})
        keys = Counter()
        future_months = set()
        for _, r in f["budget"]["rows"]:
            ym = r["month"][:7]
            keys[(ym, r["category"])] += 1
            if keys[(ym, r["category"])] == 2:
                add("Budget", "category", r["category"], "data-issue", topic="duplicate-key", month=ym)
            start = date(int(ym[:4]), int(ym[5:7]), 1)
            if start > as_of_date:
                future_months.add(ym)
                continue
            if as_of_date < month_end(ym):
                continue            # the as-of month is still open
            b, a = parse_money_cents(r["budget"]), parse_money_cents(r["actual"])
            c = cats[r["category"]]
            c["months"].append(ym)
            if a == "blank":
                c["blank"].append(ym)
                continue
            if b in (None, "blank") or a is None:
                add("Budget", "category", r["category"], "data-issue", topic="bad-money", month=ym)
                continue
            c["b"] += b
            c["a"] += a
        if future_months:
            add("Budget", "file", "budget.csv", "data-issue", topic="future", months=sorted(future_months))
        tb = ta = 0
        incomplete = []
        for cat, c in cats.items():
            if c["blank"]:
                add("Budget", "category", cat, "data-issue", topic="not-entered", months=c["blank"])
                incomplete.append(cat)
                continue
            tb += c["b"]
            ta += c["a"]
            if c["b"] == 0:
                if c["a"] >= 25000:
                    add("Budget", "category", cat, "needs-attention", "warning", topic="unbudgeted", usd_spent=c["a"] / 100)
                continue
            v = c["a"] - c["b"]
            p = F(v, c["b"])
            nums = {"pct_over": float(p * 100), "usd_over": v / 100, "budget_usd": c["b"] / 100, "actual_usd": c["a"] / 100}
            if p > F(1, 10) and v >= 100000:
                add("Budget", "category", cat, "needs-attention", "serious", **nums)
            elif (p >= F(1, 20) and v >= 50000) or v >= 250000:
                add("Budget", "category", cat, "needs-attention", "warning", **nums)
        facts["budget_tile"] = {"budget_usd": tb / 100, "actual_usd": ta / 100,
                                "pct": float(F(ta - tb, tb) * 100) if tb else None, "incomplete": incomplete,
                                "months": sorted({m for c in cats.values() for m in c["months"]})}
    else:
        areas_cant.add("Budget")
    facts["areas_cant_tell"] = sorted(areas_cant)
    return out, facts


# ------------------------------------------------------------------------------------------------ expected rows
def R(rid, area, kind, key, state, severity, *, nums=None, dates=None, tags=None, text_any=None, must_not=None,
      also=None, findings=(), rules=(), arithmetic="", alt=(), topic=None, note=None):
    row = {"id": rid, "area": area, "kind": kind, "subject_key": key, "state": state}
    if alt:
        row["state_alternatives"] = list(alt)
    row["severity"] = severity
    if topic:
        row["topic"] = topic
    row["key_numbers"] = nums or {}
    if dates:
        row["key_dates"] = dates
    if tags:
        row["key_tags"] = tags
    if text_any:
        row["key_text_any"] = text_any
    row["must_not_appear"] = must_not or []
    if also:
        row["also_expected_in_phase_1"] = also
    row["findings"] = list(findings)
    row["rules"] = list(rules)
    row["arithmetic"] = arithmetic
    if note:
        row["note"] = note
    return row


def A(area, kind, key, reason, findings=()):
    return {"area": area, "kind": kind, "subject_key": key, "reason": reason, "findings": list(findings)}


# small explicit calculations used by the scenarios (all from the scenario's own files)
def water_series(folder, tank):
    rows = [r for _, r in load_folder(folder)["water"]["rows"] if r["tank_id"] == tank]
    return sorted((r["time"], r["level_pct"]) for r in rows)


def pooled(folder, group, d1, d2, exclude=()):
    seen = {}
    for _, r in load_folder(folder)["weights"]["rows"]:
        if r["group"] == group and (r["tag"], r["date"]) not in seen:
            seen[(r["tag"], r["date"])] = parse_weight(r["weight_lbs"])
    tags = sorted(t for (t, d) in seen if d == d2 and (t, d1) in seen and t not in exclude)
    days = (date.fromisoformat(d2) - date.fromisoformat(d1)).days
    lbs = sum(seen[(t, d2)] - seen[(t, d1)] for t in tags)
    slow = {t: F(seen[(t, d2)] - seen[(t, d1)], days) for t in tags}
    return {"lbs": int(lbs), "n": len(tags), "days": days, "animal_days": len(tags) * days,
            "adg": lbs / (len(tags) * days) if tags else None, "per": slow}


def budget_sums(folder, months):
    out = defaultdict(lambda: [0, 0])
    for _, r in load_folder(folder)["budget"]["rows"]:
        if r["month"][:7] in months:
            b, a = parse_money_cents(r["budget"]), parse_money_cents(r["actual"])
            out[r["category"]][0] += b if isinstance(b, int) else 0
            out[r["category"]][1] += a if isinstance(a, int) else 0
    return {k: (v[0] // 100, v[1] // 100) for k, v in out.items()}


def r1(x):
    return round(float(x), 4)


GLOBAL_MUST_NOT = ["NaN", "Infinity", "undefined", "[object Object]"]
COMMON_FILES_NOTE = ("tanks.csv (tank master list, WAT-02) and meta.csv's timezone column (TIME-02) are the Phase-1 additions "
                     "the lead's defaults call for; the current code ignores both. health.csv carries HLTH-03's proposed "
                     "generator fix (Cows Fly tag check: done 2026-09-01, next_due blank) unless the scenario says otherwise.")


def base_files(*, tanks=True, meta=True, health_fix=True):
    files = {n: committed_bytes(n) for n in FILES}
    changed = {}
    if meta:
        changed["meta"] = meta_text()
    if tanks:
        changed["tanks"] = tanks_text()
    if health_fix:
        changed["health"] = csv_text(*health_fixed_rows())
    return files, changed


def committed_ten(folder, *, renames=None, subject_ctx=None):
    """The 10 planted rows, numbers computed from this folder's files (committed values unless the scenario changed them)."""
    rn = renames or {}
    Y = rn.get("Yearlings", "Yearlings")
    t2 = water_series(folder, "T2")[-1]
    t4 = water_series(folder, "T4")
    t4_last = t4[-1]
    t4_win = [x for x in t4 if x[0] >= "2026-09-29T18:00"]
    t4_max = max(F(x[1]) for x in t4_win)
    t6 = water_series(folder, "T6")
    t6_last = [x for x in t6 if x[0] <= AS_OF][-1]
    t6_h = (datetime.fromisoformat(AS_OF) - datetime.fromisoformat(t6_last[0])).total_seconds() / 3600
    hf = pooled(folder, "Heifers", "2026-07-20", "2026-09-15")
    if hf["adg"] is None:
        hf = {"adg": F(0), "n": 0, "lbs": 0, "animal_days": 0}      # not used by scenarios without Sep 15 heifer weights
    yf = pooled(folder, Y, "2026-07-20", "2026-09-15")
    slow = sorted(t for t, a in yf["per"].items() if a < 1)
    bs = budget_sums(folder, {"2026-06", "2026-07", "2026-08", "2026-09"})
    fb, fa = bs["Fuel"]
    rb, ra = bs["Repairs"]
    rows = [
        R("T2", "Water", "tank", "T2", "needs-attention", "critical", nums={"level_pct": float(F(t2[1]))},
          must_not=["here now"] if not subject_ctx else [],
          findings=["WAT-01"], rules=["RULE-WAT-01"],
          arithmetic=f"T2's last reading {t2[0]} is {t2[1]}%; {t2[1]} < 25 (demo critical line)."),
        R("T4", "Water", "tank", "T4", "needs-attention", "critical",
          nums={"drop_pts": float(round(t4_max - F(t4_last[1]), 1)), "level_pct": float(F(t4_last[1]))},
          also=["the real span of the fall in hours (WAT-03)", "'unexplained fall; leak not confirmed' wording (RULE-WAT-03 phase note)"],
          findings=["WAT-03", "WAT-08"], rules=["RULE-WAT-03"],
          arithmetic=(f"Readings in [{t4_last[0][:10]}T18:00 - 24 h, {t4_last[0]}]: " + ", ".join(x[1] for x in t4_win)
                      + f"; highest {float(t4_max)} - last {t4_last[1]} = {float(round(t4_max - F(t4_last[1]), 1))} points >= 30.")),
        R("T6", "Water", "tank", "T6", "needs-attention", "serious", alt=["cant-tell"],
          nums={"silent_hours": t6_h, "level_pct": float(F(t6_last[1]))},
          also=["the tank's level is CAN'T TELL; the row says to check it by eye (RULE-WAT-04 phase note)"],
          findings=["TIME-01"], rules=["RULE-WAT-04"],
          arithmetic=f"Last reading {t6_last[0]} ({t6_last[1]}%); {AS_OF} - {t6_last[0]} = {t6_h:g} hours >= 24."),
        R("GRZ", "Grazing", "stay", Y, "needs-attention", "serious", nums={"days": 24, "plan": 21, "over": 3},
          text_any=["Sand Hills"], findings=["GRZ-01"], rules=["RULE-GRZ-01"],
          arithmetic="Open stay in P3 Sand Hills since 2026-09-06; Sep 6 to Sep 30 = 24 days; plan 21; 24 - 21 = 3 days over."),
        R("GAIN-H", "Gain", "group", "Heifers", "needs-attention", "serious",
          nums={"adg": float(hf["adg"]), "target": 1.0}, dates=["2026-07-20"],
          also=[f"coverage {hf['n']} of 45 weighed (GAIN-07)", "both weigh dates, Jul 20 and Sep 15 (GAIN-11)"],
          findings=["GAIN-03", "GAIN-11", "GAIN-07"], rules=["RULE-GAIN-01", "RULE-GAIN-04"],
          arithmetic=(f"Pooled gain Jul 20 to Sep 15 (57 days) over {hf['n']} heifers: {hf['lbs']} lbs / {hf['animal_days']} animal-days "
                      f"= {float(hf['adg']):.4f} lb/day; 0.8 x 1.0 = 0.8; {float(hf['adg']):.4f} < 0.8.")),
        R("GAIN-Y", "Gain", "animals", Y, "needs-attention", "warning",
          nums={"count": len(slow), "threshold": 1.0}, tags=slow,
          findings=["GAIN-11"], rules=["RULE-GAIN-02", "RULE-GAIN-03"],
          arithmetic=(f"{Y} pooled {yf['lbs']} / {yf['animal_days']} = {float(yf['adg']):.4f} lb/day, not under 0.8 x 2.0 = 1.6, so no group row. "
                      "Animals under 0.5 x 2.0 = 1.0 lb/day over the 57 days: "
                      + ", ".join(f"{t} {float(yf['per'][t]):.3f}" for t in slow) + ".")),
        R("BOOST", "Health", "task", f"{Y}: Booster vaccine", "needs-attention", "serious",
          nums={"overdue_days": 15}, dates=["2026-09-15"], findings=["HLTH-01"], rules=["RULE-HLTH-01"],
          arithmetic="Open, next_due 2026-09-15; Sep 15 to Sep 30 = 15 days overdue."),
        R("PINK", "Health", "task", "Cows: Pinkeye check", "needs-attention", "warning",
          nums={"due_in_days": 3}, dates=["2026-10-03"], rules=["RULE-HLTH-02"],
          arithmetic="Open, next_due 2026-10-03; Sep 30 to Oct 3 = 3 days, within 7."),
        R("FUEL", "Budget", "category", "Fuel", "needs-attention", "serious",
          nums={"pct_over": float(F(fa - fb, fb) * 100), "usd_over": fa - fb},
          findings=["BUD-01", "BUD-04", "BUD-05"], rules=["RULE-BUD-01", "RULE-BUD-03"],
          arithmetic=f"Jun-Sep actual {fa:,} vs budget {fb:,}: {fa:,} - {fb:,} = ${fa - fb:,}; {fa - fb:,} / {fb:,} = {float(F(fa - fb, fb) * 100):.2f}% (> 10% and >= $1,000)."),
        R("REPAIRS", "Budget", "category", "Repairs", "needs-attention", "serious",
          nums={"pct_over": float(F(ra - rb, rb) * 100), "usd_over": ra - rb},
          findings=["BUD-01", "BUD-04"], rules=["RULE-BUD-01", "RULE-BUD-03"],
          arithmetic=f"Jun-Sep actual {ra:,} vs budget {rb:,}: ${ra - rb:,}; {ra - rb:,} / {rb:,} = {float(F(ra - rb, rb) * 100):.2f}% (> 10% and >= $1,000)."),
    ]
    rows[0]["must_not_appear"] = []
    return {r["id"]: r for r in rows}


def tile(tid, **kw):
    return {"tile": tid, **kw}


# ------------------------------------------------------------------------------------------------ water designs
def six_hourly(start, end):
    t, out = datetime.fromisoformat(start), []
    while t <= datetime.fromisoformat(end):
        out.append(t.isoformat(timespec="minutes"))
        t += timedelta(hours=6)
    return out


WIGGLE = [0.0, 0.6, -0.4, 0.3]


def designed_tank(tank, pid, base, finals, last="2026-09-30T18:00"):
    times = six_hourly("2026-09-01T00:00", last)
    n = len(times) - len(finals)
    vals = [round(base + WIGGLE[i % 4], 1) for i in range(n)] + list(finals)
    return [[tank, pid, t, f"{v:.1f}"] for t, v in zip(times, vals)]


def healthy_tail(start_level, deltas):
    out, v = [], start_level
    for d in deltas:
        v = round(min(98.0, max(55.0, v + d)), 1)
        out.append(v)
    return out


# ------------------------------------------------------------------------------------------------ scenarios
SCEN = []


def scenario(fn):
    SCEN.append(fn)
    return fn


@scenario
def s01():
    name = "01-planted-problems"
    files = {n: committed_bytes(n) for n in FILES}
    return name, files, {}, lambda folder: {
        "title": "The ten planted problems on the committed data",
        "purpose": ("The committed data/ files, byte for byte. Expected = the 10 rows the dashboard shows today, with the same "
                    "severities (the Phase 1 acceptance bar, findings.json policies.phase_1_acceptance)."),
        "as_of": "2026-09-30T18:00 (no time zone in meta.csv)",
        "alerts_exact": True,
        "expected_rows": list(committed_ten(folder).values()),
        "expected_absent": [A("Water", "tank", t, "healthy tank in the committed data") for t in ["T1", "T3", "T5", "T7", "T8"]]
                           + [A("Gain", "group", "Yearlings", "pooled 1.9425 lb/day is not under 1.6"),
                              A("Gain", "animals", "Heifers", "the group-wide row already covers the heifers (RULE-WF-19)"),
                              A("Grazing", "stay", "Cows", "day 18 of 21: 3 days left, outside the 2-day grace"),
                              A("Grazing", "stay", "Heifers", "day 11 of 14: 3 days left"),
                              A("Health", "task", "Heifers: Pregnancy check", "due 2026-10-25, 25 days away"),
                              A("Health", "task", "Yearlings: Deworm", "due 2026-11-01, 32 days away")]
                           + [A("Budget", "category", c, "under budget season to date") for c in ["Feed and mineral", "Vet and health", "Labor", "Water and fencing"]],
        "allowed_extra_rows": [
            R("X-HLTH03", "Health", "task", "Cows: Fly tag check", "data-issue", None, topic="contradiction", findings=["HLTH-03"],
              note="Allowed only until HLTH-03's generator fix: the committed row is done, last_done 2026-06-05, next_due 2026-09-01."),
            R("X-TZ", "Data", "file", "meta.csv", "data-issue", None, topic="no-timezone", findings=["TIME-02"], rules=["RULE-WF-14"],
              note=("Allowed until the generator writes meta.timezone. data-fields.json says that without a zone the time-based rules are "
                    "CAN'T TELL; if Phase 1 does that, this folder must first be regenerated with the zone (see scenario.md).")),
            R("X-TANKS", "Water", "file", "tanks.csv", "data-issue", None, topic="no-tank-list", findings=["WAT-02"],
              note="Allowed until the generator writes tanks.csv: 'tank list not provided' (data-fields.json tanks.csv)."),
        ],
        "area_states": {"Water": "needs-attention", "Grazing": "needs-attention", "Gain": "needs-attention", "Health": "needs-attention", "Budget": "needs-attention"},
        "tile_expectations": [
            tile("needs_attention", critical=2, serious=6, warning=2, total=10),
            tile("water", ok=5, of=8, need_look=3),
            tile("gain", renders=True, contains_any=["1.94", "0.44"], note="Today the tile shows Yearlings only; Phase 1 must not hard-code a group (LOAD-03)."),
            tile("budget", pct=1.0, actual_usd=89303, budget_usd=88400),
            tile("head", value=375, note="UI-18 (phase 2) may change how pairs are counted."),
        ],
        "findings": ["LOAD-01", "HLTH-03", "TIME-02", "WAT-02"], "rules": ["RULE-WF-21"],
    }


@scenario
def s02():
    name = "02-healthy-operation"
    files, ch = base_files()
    # water: remove the three planted water problems
    h, rows = committed_rows("water")
    t2_pre = next(F(r[3]) for r in rows if r[0] == "T2" and r[2] == "2026-09-26T12:00")
    t2_new = healthy_tail(float(t2_pre), [4.1, -2.3, 1.6, -3.4, 2.8, -1.2] * 3)
    t4_new = healthy_tail(67.5, [-2.1, 3.4, -1.7, 2.2, -0.9])
    out, i2, i4 = [], 0, 0
    for r in rows:
        if r[0] == "T2" and r[2] >= "2026-09-26T18:00":
            r = [r[0], r[1], r[2], f"{t2_new[i2]:.1f}"]; i2 += 1
        if r[0] == "T4" and r[2] >= "2026-09-29T18:00":
            r = [r[0], r[1], r[2], f"{t4_new[i4]:.1f}"]; i4 += 1
        out.append(r)
        if r[0] == "T6" and r[2] == "2026-09-29T00:00":
            for t, v in zip(six_hourly("2026-09-29T06:00", AS_OF), [95.3, 92.7, 94.6, 90.5, 92.9, 91.4, 93.0]):
                out.append(["T6", "P6", t, f"{v:.1f}"])
    ch["water"] = csv_text(h, out)
    # moves: the yearlings left Sand Hills on the planned day (Sep 6 + 21 = Sep 27) for Windmill
    h, rows = committed_rows("moves")
    out = []
    for r in rows:
        if r[0] == "Yearlings" and r[1] == "P3" and r[2] == "2026-09-06":
            out += [["Yearlings", "P3", "2026-09-06", "2026-09-27"], ["Yearlings", "P2", "2026-09-27", ""]]
        else:
            out.append(r)
    ch["moves"] = csv_text(h, out)
    # weights: heifers gain 0.80-1.16 lb/day Jul 20-Sep 15; the six slow yearlings gain 1.9 lb/day
    h, rows = committed_rows("weights")
    jul = {r[0]: int(r[3]) for r in rows if r[2] == "2026-07-20"}
    slow6 = {"Y027", "Y031", "Y058", "Y082", "Y129", "Y132"}
    out = []
    for r in rows:
        if r[2] == "2026-09-15" and r[1] == "Heifers":
            i = int(r[0][1:]) - 1
            r = [r[0], r[1], r[2], str(jul[r[0]] + round(57 * (0.80 + 0.04 * (i % 10))))]
        elif r[2] == "2026-09-15" and r[0] in slow6:
            r = [r[0], r[1], r[2], str(jul[r[0]] + round(57 * 1.9))]
        out.append(r)
    ch["weights"] = csv_text(h, out)
    # health: booster done on time, pinkeye check scheduled for Oct 14
    h, rows = health_fixed_rows()
    out = []
    for r in rows:
        if r[1] == "Booster vaccine":
            r = ["Yearlings", "Booster vaccine", "2026-09-15", "", "done"]
        elif r[1] == "Pinkeye check":
            r = ["Cows", "Pinkeye check", "2026-08-01", "2026-10-14", "open"]
        out.append(r)
    ch["health"] = csv_text(h, out)
    # budget: fuel and repairs on plan
    h, rows = committed_rows("budget")
    fuel = {"2026-06": 2350, "2026-07": 2480, "2026-08": 2440, "2026-09": 2390}
    rep = {"2026-06": 1620, "2026-07": 1890, "2026-08": 1710, "2026-09": 1830}
    ch["budget"] = csv_text(h, [[r[0], r[1], r[2], str(fuel[r[0]] if r[1] == "Fuel" else rep[r[0]] if r[1] == "Repairs" else r[3])] for r in rows])

    def exp(folder):
        hf = pooled(folder, "Heifers", "2026-07-20", "2026-09-15")
        yf = pooled(folder, "Yearlings", "2026-07-20", "2026-09-15")
        bs = budget_sums(folder, {"2026-06", "2026-07", "2026-08", "2026-09"})
        tb = sum(v[0] for v in bs.values()); ta = sum(v[1] for v in bs.values())
        hmin = min(hf["per"].values()); ymin = min(yf["per"].values())
        absent = [A("Water", "tank", t, "healthy tank") for t in ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"]]
        absent += [A("Grazing", "stay", g, why) for g, why in [("Cows", "day 18 of 21 (3 days left)"), ("Heifers", "day 11 of 14 (3 days left)"), ("Yearlings", "day 3 of 18 in Windmill")]]
        absent += [A("Gain", "group", "Heifers", f"pooled {hf['lbs']}/{hf['animal_days']} = {float(hf['adg']):.4f} >= 0.8"),
                   A("Gain", "group", "Yearlings", f"pooled {yf['lbs']}/{yf['animal_days']} = {float(yf['adg']):.4f} >= 1.6"),
                   A("Gain", "animals", "Heifers", f"slowest heifer {float(hmin):.3f} >= 0.5"),
                   A("Gain", "animals", "Yearlings", f"slowest yearling {float(ymin):.3f} >= 1.0")]
        absent += [A("Health", "task", k, why) for k, why in [("Cows: Pinkeye check", "due 2026-10-14, 14 days away"), ("Yearlings: Booster vaccine", "done"), ("Heifers: Pregnancy check", "25 days away"), ("Yearlings: Deworm", "32 days away")]]
        absent += [A("Budget", "category", c, f"{bs[c][1]:,} vs {bs[c][0]:,}") for c in bs]
        return {
            "title": "A healthy operation with sufficient data",
            "purpose": "Every planted problem removed, every file present and current. Expected: no rows, every area OK, nothing CAN'T TELL.",
            "as_of": f"{AS_OF} {RANCH_TZ}",
            "alerts_exact": True,
            "expected_rows": [],
            "expected_absent": absent,
            "allowed_extra_rows": [],
            "area_states": {a: "ok" for a in ["Water", "Grazing", "Gain", "Health", "Budget"]},
            "tile_expectations": [
                tile("needs_attention", critical=0, serious=0, warning=0, total=0),
                tile("water", ok=8, of=8, need_look=0),
                tile("budget", pct=round(float(F(ta - tb, tb) * 100), 4), actual_usd=ta, budget_usd=tb),
            ],
            "computed": {"heifers": {k: hf[k] for k in ("lbs", "n", "animal_days")}, "heifers_adg": r1(hf["adg"]),
                         "yearlings": {k: yf[k] for k in ("lbs", "n", "animal_days")}, "yearlings_adg": r1(yf["adg"]),
                         "slowest_heifer": r1(hmin), "slowest_yearling": r1(ymin), "budget_totals": [tb, ta]},
            "findings": ["UI-07", "LOAD-01"], "rules": ["RULE-WF-09"],
        }
    return name, files, ch, exp


@scenario
def s03():
    name = "03-incomplete-and-stale"
    files, ch = base_files()
    del files["health"]; ch.pop("health")
    h, rows = committed_rows("weights")
    ch["weights"] = csv_text(h, [r for r in rows if not (r[1] == "Heifers" and r[2] == "2026-09-15")])
    h, rows = committed_rows("water")
    ch["water"] = csv_text(h, [r for r in rows if r[0] != "T8" and not (r[0] == "T7" and r[2] > "2026-09-29T12:00")])
    h, rows = committed_rows("budget")
    ch["budget"] = csv_text(h, [[r[0], r[1], r[2], "" if (r[0] == "2026-09" and r[1] == "Vet and health") else r[3]] for r in rows])

    def exp(folder):
        ten = committed_ten(folder)
        t7 = water_series(folder, "T7")[-1]
        t7_h = (datetime.fromisoformat(AS_OF) - datetime.fromisoformat(t7[0])).total_seconds() / 3600
        age = (date(2026, 9, 30) - date(2026, 7, 20)).days
        rows = [ten[k] for k in ["T2", "T4", "T6", "GRZ", "GAIN-Y", "FUEL", "REPAIRS"]]
        rows += [
            R("T7", "Water", "tank", "T7", "needs-attention", "serious", alt=["cant-tell"],
              nums={"silent_hours": t7_h, "level_pct": float(F(t7[1]))}, rules=["RULE-WAT-04"],
              arithmetic=f"Last T7 reading {t7[0]} ({t7[1]}%); {AS_OF} - {t7[0]} = {t7_h:g} hours >= 24."),
            R("T8", "Water", "tank", "T8", "cant-tell", "serious", alt=["needs-attention"], topic="no-readings",
              text_any=["no readings", "No readings"], findings=["WAT-02"], rules=["RULE-WAT-04"],
              arithmetic="tanks.csv lists T8 (P8); water.csv has no T8 row, so the tank cannot be judged and is not counted as OK."),
            R("GAIN-H-STALE", "Gain", "group", "Heifers", "cant-tell", None, topic="stale",
              nums={"age_days": age}, dates=["2026-07-20"], findings=["GAIN-08"], rules=["RULE-GAIN-10"],
              arithmetic=f"Heifers' latest weigh-in 2026-07-20; Jul 20 to Sep 30 = 11 + 31 + 30 = {age} days > 45 (demo limit)."),
            R("HEALTH-FILE", "Health", "file", "health.csv", "data-issue", None, topic="missing-file",
              text_any=["health.csv"], findings=["LOAD-01", "LOAD-02"], rules=["RULE-HLTH-03"],
              arithmetic="health.csv is not in the folder (the browser gets a 404)."),
            R("VET-BLANK", "Budget", "category", "Vet and health", "data-issue", None, topic="not-entered",
              text_any=["2026-09"], findings=["BUD-01", "BUD-02", "CSV-04"], rules=["RULE-BUD-05"],
              arithmetic="2026-09 Vet and health actual is blank: 'not entered', never $0 and never joined as text."),
        ]
        return {
            "title": "Incomplete and stale information",
            "purpose": "health.csv missing, the heifers' last weigh-in 72 days old, T7 silent for 30 hours, T8 absent from the export, one budget actual not entered.",
            "as_of": f"{AS_OF} {RANCH_TZ}",
            "alerts_exact": True,
            "expected_rows": rows,
            "expected_absent": [A("Gain", "group", "Heifers", "no current verdict on 72-day-old weigh-ins", ["GAIN-08"]),
                                A("Gain", "animals", "Heifers", "old-period slow heifers must not be shown as a current alert", ["GAIN-08"]),
                                A("Budget", "category", "Vet and health", "its season total is incomplete")],
            "allowed_extra_rows": [],
            "area_states": {"Water": "needs-attention", "Grazing": "needs-attention", "Gain": "needs-attention", "Health": "cant-tell", "Budget": "needs-attention"},
            "tile_expectations": [
                tile("water", ok=3, of=8, need_look=5, note="OK: T1, T3, T5. Need a look or can't tell: T2, T4, T6, T7, T8."),
                tile("budget", sane=True, note="No NaN, Infinity or e+ and |percent| under 100; the tile names the incomplete category or shows CAN'T TELL (manual check)."),
            ],
            "findings": ["LOAD-01", "GAIN-08", "WAT-02", "BUD-01", "BUD-02"], "rules": ["RULE-WF-14", "RULE-WAT-04", "RULE-GAIN-10"],
        }
    return name, files, ch, exp


@scenario
def s04():
    name = "04-irregular-sensor-readings"
    files, ch = base_files()
    h, rows = committed_rows("water")
    t1_base = next(r for r in rows if r[0] == "T1" and r[2] == "2026-09-27T18:00")
    t1_last = round(F(t1_base[3]) - 35, 1)
    out = []
    for r in rows:
        if r[0] == "T1" and "2026-09-27T18:00" < r[2] < AS_OF:
            continue                                   # a 72-hour gap
        if r[0] == "T1" and r[2] == AS_OF:
            r = ["T1", "P1", AS_OF, f"{float(t1_last):.1f}"]
        if r[0] == "T3" and r[2] == AS_OF:
            out.append(["T3", "P3", AS_OF, "20.0"])      # conflicting reading, listed first
        if r[0] == "T8" and r[2] == AS_OF:
            r = ["T8", "P8", AS_OF, "ERR"]
        out.append(r)
        if r[0] == "T5" and r[2] == "2026-09-30T12:00":
            out.append(list(r))                         # exact duplicate
        if r[0] == "T6" and r[2] == "2026-09-29T00:00":
            out.append(["T6", "P6", "2026-10-29T00:00", "97.0"])   # dated after as_of
    t7 = [r for r in out if r[0] == "T7"]
    first7 = out.index(t7[0])
    out = [r for r in out if r[0] != "T7"]
    out[first7:first7] = list(reversed(t7))            # T7 rows in reverse order
    ch["water"] = csv_text(h, out)

    def exp(folder):
        ten = committed_ten(folder)
        t3 = water_series(folder, "T3")
        win3 = [F(v) for t, v in t3 if "2026-09-29T18:00" <= t < AS_OF]
        t8 = [x for x in water_series(folder, "T8") if x[1] != "ERR"][-1]
        rows = [ten[k] for k in ["T2", "T4", "T6", "GRZ", "GAIN-H", "GAIN-Y", "BOOST", "PINK", "FUEL", "REPAIRS"]]
        rows += [
            R("T1-HIST", "Water", "tank", "T1", "cant-tell", None, topic="drop-history",
              text_any=["not enough recent history", "can't be judged"], must_not=["Dropped"],
              findings=["WAT-03"], rules=["RULE-WAT-03"],
              arithmetic=(f"T1 readings: ... 2026-09-27T18:00 {t1_base[3]}, then nothing until {AS_OF} {float(t1_last):.1f}. "
                          f"[{AS_OF} - 24 h, {AS_OF}] holds only the last reading, so the 24-hour change can't be judged. "
                          f"The level {float(t1_last):.1f}% is above 40. The old rule compares with the 72-hour-old reading: "
                          f"{t1_base[3]} - {float(t1_last):.1f} = 35.0 'in 24 hours'.")),
            R("T3", "Water", "tank", "T3", "needs-attention", "critical", nums={"level_pct": 20.0},
              must_not=["91.5% full"], findings=["WAT-07"], rules=["RULE-WAT-01", "RULE-WAT-03"],
              arithmetic=(f"Two readings at {AS_OF}: 20.0 and 91.5. The conservative rule uses the lower, 20.0 (< 25). "
                          f"Under the bounded window the fall is also a leak-sized drop: highest earlier reading in the window "
                          f"{float(max(win3))} - 20.0 = {float(max(win3)) - 20:.1f} points.")),
            R("T3-DUP", "Water", "tank", "T3", "data-issue", None, topic="conflicting-readings",
              text_any=["91.5", "20"], findings=["WAT-07", "DATA-03"],
              arithmetic="Same tank, same time, different values: one data issue naming both."),
            R("T5-DUP", "Water", "file", "water.csv", "data-issue", None, topic="duplicates", nums={"count": 1},
              findings=["DATA-03"], note="An exact duplicate is dropped and counted; it never changes T5's result.",
              arithmetic="T5 2026-09-30T12:00 58.8 appears twice with the same value."),
            R("T6-FUTURE", "Water", "file", "water.csv", "data-issue", None, topic="future", nums={"count": 1},
              text_any=["2026-10-29"], findings=["TIME-01"], rules=["RULE-WF-14"],
              arithmetic="T6 2026-10-29T00:00 is after as_of 2026-09-30T18:00: left out of every rule and reported."),
            R("T8", "Water", "tank", "T8", "cant-tell", "serious", alt=["data-issue", "needs-attention"], topic="bad-level",
              nums={"last_good_level": float(F(t8[1]))}, text_any=["ERR"], findings=["WAT-01"], rules=["RULE-WAT-04"],
              arithmetic=f"T8's newest reading at {AS_OF} is 'ERR', not a level; last good level {t8[1]}% at {t8[0]}."),
        ]
        return {
            "title": "Irregular sensor readings",
            "purpose": "A 72-hour gap (T1), a conflicting duplicate (T3), an exact duplicate (T5), out-of-order rows (T7), a reading dated after as_of (T6) and a fault code (T8).",
            "as_of": f"{AS_OF} {RANCH_TZ}",
            "alerts_exact": True,
            "expected_rows": rows,
            "expected_absent": [A("Water", "tank", "T1", "no leak can be claimed from a 72-hour-old baseline", ["WAT-03"]),
                                A("Water", "tank", "T5", "an exact duplicate changes nothing", ["DATA-03"]),
                                A("Water", "tank", "T7", "row order changes nothing; T7 is healthy", ["DATA-02"])],
            "allowed_extra_rows": [],
            "area_states": {"Water": "needs-attention", "Grazing": "needs-attention", "Gain": "needs-attention", "Health": "needs-attention", "Budget": "needs-attention"},
            "tile_expectations": [tile("water", ok_at_most=3, of=8, note="T3, T6 and T8 are never OK; T1's 24-hour change is unknown.")],
            "findings": ["WAT-01", "WAT-03", "WAT-07", "DATA-03", "TIME-01"], "rules": ["RULE-WAT-03", "RULE-WAT-04"],
        }
    return name, files, ch, exp


@scenario
def s05():
    name = "05-missing-groups-and-pastures"
    files, ch = base_files()
    ren = lambda v: "Steers" if v == "Yearlings" else v
    for n in ["groups", "weights"]:
        h, rows = committed_rows(n)
        ch[n] = csv_text(h, [[ren(r[0]), *r[1:]] if n == "groups" else [r[0], ren(r[1]), *r[2:]] for r in rows])
    h, rows = health_fixed_rows()
    ch["health"] = csv_text(h, [[ren(r[0]), *r[1:]] for r in rows])
    h, rows = committed_rows("moves")
    out = []
    for r in rows:
        r = [ren(r[0]), *r[1:]]
        if r[0] == "Cows" and r[2] == "2026-09-12":
            r = ["Cows", "P9", "2026-09-12", ""]
        out.append(r)
    out.append(["Bulls", "P8", "2026-09-25", ""])
    ch["moves"] = csv_text(h, out)

    def exp(folder):
        ten = committed_ten(folder, renames={"Yearlings": "Steers"})
        rows = [ten[k] for k in ["T2", "T4", "T6", "GRZ", "GAIN-H", "GAIN-Y", "BOOST", "PINK", "FUEL", "REPAIRS"]]
        rows[0]["must_not_appear"] = ["undefined"]
        rows += [
            R("COWS-P9", "Grazing", "record", "Cows", "data-issue", None, alt=["cant-tell"], topic="unknown-pasture",
              text_any=["P9"], findings=["DATA-01"], rules=["RULE-GRZ-01"],
              arithmetic="Cows' open stay names P9; pastures.csv has P1-P8, so there is no plan to judge against."),
            R("BULLS", "Grazing", "record", "Bulls", "data-issue", None, topic="unknown-group",
              text_any=["Bulls"], findings=["DATA-01"],
              arithmetic="moves.csv has 'Bulls,P8,2026-09-25,'; groups.csv has Cows, Heifers, Steers."),
        ]
        return {
            "title": "Missing groups and pastures",
            "purpose": "No 'Yearlings' group (renamed Steers in every file), an open stay in unknown pasture P9, and a group (Bulls) in moves.csv but not groups.csv.",
            "as_of": f"{AS_OF} {RANCH_TZ}",
            "alerts_exact": True,
            "expected_rows": rows,
            "expected_absent": [A("Grazing", "stay", "Cows", "no plan for an unknown pasture: a data issue, not an alarm", ["DATA-01"]),
                                A("Grazing", "stay", "Bulls", "day 5 of Home Trap's 10 if judged; no alarm either way")],
            "allowed_extra_rows": [],
            "area_states": {"Water": "needs-attention", "Grazing": "needs-attention", "Gain": "needs-attention", "Health": "needs-attention", "Budget": "needs-attention"},
            "tile_expectations": [tile("gain", renders=True, note="No hard-coded 'Yearlings' (LOAD-03): the tile draws for whatever groups exist.")],
            "findings": ["DATA-01", "LOAD-03", "LOAD-02"], "rules": [],
        }
    return name, files, ch, exp


@scenario
def s06():
    name = "06-sparse-and-conflicting-weigh-ins"
    files, ch = base_files()
    h, rows = committed_rows("weights")
    out = []
    sep15 = {r[0]: int(r[3]) for r in rows if r[2] == "2026-09-15"}
    for r in rows:
        if r[1] == "Heifers" and r[2] == "2026-09-15":
            if r[0] in ("H001", "H002", "H003"):
                out.append(r)
            elif r[0] == "H004":
                out.append(["H004", "Cows", "2026-09-15", r[3]])   # group change
            continue
        out.append(r)
        if r[0] == "Y001" and r[2] == "2026-09-15":
            out.append(["Y001", "Yearlings", "2026-09-15", str(int(r[3]) + 2)])   # same-day re-read
    out.append(["Y151", "Yearlings", "2026-09-15", "820"])                       # first weigh-in only
    for i in range(3, 13):
        t = f"Y{i:03d}"
        out.append([t, "Yearlings", "2026-09-22", str(sep15[t] + 3)])          # short re-weigh, 7 days later
    ch["weights"] = csv_text(h, out)

    def exp(folder):
        ten = committed_ten(folder)
        yk = pooled(folder, "Yearlings", "2026-07-20", "2026-09-15")
        y_hi = (yk["lbs"] + 2) / F(yk["animal_days"])
        rows = [ten[k] for k in ["T2", "T4", "T6", "GRZ", "GAIN-Y", "BOOST", "PINK", "FUEL", "REPAIRS"]]
        rows += [
            R("HEIFERS-CT", "Gain", "group", "Heifers", "cant-tell", None,
              text_any=["3 of 45", "2026-07-20", "Jul 20"], findings=["GAIN-07", "GAIN-08", "GAIN-03"], rules=["RULE-GAIN-10"],
              arithmetic=("Only H001, H002 and H003 crossed the scale as heifers on 2026-09-15: 3 of 45 = 6.7%, below any sensible "
                          "minimum coverage. If Sep 15 is not counted as a session, the last full session is Jul 20, 72 days before "
                          "Sep 30 (> 45). Either way the heifers' gain can't be judged.")),
            R("Y001-DUP", "Gain", "record", "Y001", "data-issue", None, topic="same-day-duplicate", dates=["2026-09-15"],
              findings=["GAIN-02", "DATA-03"],
              arithmetic=(f"Y001 has 851 and 853 on 2026-09-15. Keeping either: yearlings {yk['lbs']}/{yk['animal_days']} = "
                          f"{float(yk['adg']):.5f} or {yk['lbs'] + 2}/{yk['animal_days']} = {float(y_hi):.5f}; both 1.94.")),
            R("Y151", "Gain", "record", "Y151", "cant-tell", None, alt=["data-issue"], topic="first-weigh-in",
              text_any=["Y151"], findings=["GAIN-01"],
              arithmetic="Y151 has one weigh-in (2026-09-15, 820 lbs): no gain yet; left out of the yearlings' figures."),
            R("Y-OFF", "Gain", "record", "Yearlings off-session", "data-issue", None, alt=["cant-tell"], topic="off-session",
              tags=[f"Y{i:03d}" for i in range(3, 13)], dates=["2026-09-22"], findings=["GAIN-03"], rules=["RULE-GAIN-07"],
              arithmetic="10 of 150 yearlings re-weighed 2026-09-22, 7 days after Sep 15 (< 21-day minimum, and not a session): listed, not used."),
        ]
        return {
            "title": "Sparse and conflicting weigh-ins",
            "purpose": "A single weigh-in (Y151), a same-day duplicate (Y001), a group change (H004 weighed with the Cows), a short off-session re-weigh (Y003-Y012) and low coverage (3 of 45 heifers on Sep 15).",
            "as_of": f"{AS_OF} {RANCH_TZ}",
            "alerts_exact": True,
            "expected_rows": rows,
            "expected_absent": [A("Gain", "group", "Heifers", "coverage too low or data too old for a verdict", ["GAIN-07", "GAIN-08"]),
                                A("Gain", "animals", "Heifers", "no individual verdicts from a 3-animal session or from the June-July period", ["GAIN-07", "GAIN-08"]),
                                A("Gain", "group", "Yearlings", f"pooled {float(yk['adg']):.4f} >= 1.6")],
            "allowed_extra_rows": [
                R("X-H004", "Gain", "record", "H004", "data-issue", None, topic="group-change", findings=["GAIN-14", "GAIN-06"],
                  note="GAIN-14 (phase 2) wants 'H004 moved to Cows on Sep 15'; Phase 1 may or may not name it."),
                R("X-H-OFF", "Gain", "record", "Heifers off-session", "data-issue", None, topic="off-session",
                  note="An implementation that does not treat Sep 15 as a heifer session may list H001-H003's Sep 15 readings as off-session."),
                R("X-COWS-Y", "Gain", "record", "H004", "cant-tell", None, topic="first-weigh-in",
                  note="Keyed by (group, tag), H004 in Cows has one weigh-in; the Cows are not judged on gain (target 0)."),
            ],
            "area_states": {"Water": "needs-attention", "Grazing": "needs-attention", "Gain": "needs-attention", "Health": "needs-attention", "Budget": "needs-attention"},
            "tile_expectations": [tile("gain", renders=True, contains_any=["1.94"], note="The yearlings' 1.94 stands; the heifers are CAN'T TELL.")],
            "findings": ["GAIN-01", "GAIN-02", "GAIN-03", "GAIN-06", "GAIN-07", "GAIN-08", "GAIN-14"], "rules": ["RULE-GAIN-07", "RULE-GAIN-10"],
        }
    return name, files, ch, exp


@scenario
def s07():
    name = "07-zero-budgets-credits-future-months"
    files, ch = base_files()
    h, rows = committed_rows("budget")
    out = []
    for r in rows:
        if r[0] == "2026-09" and r[1] == "Water and fencing":
            r = [r[0], r[1], r[2], "(150)"]
        out.append(r)
    for m in ["2026-06", "2026-07", "2026-08", "2026-09"]:
        out.append([m, "Hay", "0", "500" if m == "2026-09" else "0"])
        out.append([m, "Ear tags", "0", "200" if m == "2026-07" else "0"])
    plan = {"Feed and mineral": 6200, "Fuel": 2400, "Repairs": 1800, "Vet and health": 1500, "Labor": 9000, "Water and fencing": 1200, "Hay": 0, "Ear tags": 0}
    for m in ["2026-10", "2026-11"]:
        for c, b in plan.items():
            out.append([m, c, str(b), ""])
    ch["budget"] = csv_text(h, out)

    def exp(folder):
        ten = committed_ten(folder)
        bs = budget_sums(folder, {"2026-06", "2026-07", "2026-08", "2026-09"})
        tb = sum(v[0] for v in bs.values()); ta = sum(v[1] for v in bs.values())
        wf = bs["Water and fencing"]
        rows = [ten[k] for k in ["T2", "T4", "T6", "GRZ", "GAIN-H", "GAIN-Y", "BOOST", "PINK", "FUEL", "REPAIRS"]]
        rows += [R("HAY", "Budget", "category", "Hay", "needs-attention", "warning", topic="unbudgeted",
                   nums={"usd_spent": 500}, must_not=["%", "Infinity"], findings=["BUD-03"], rules=["RULE-BUD-06"],
                   arithmetic="Hay budget 0 every month; actual 0 + 0 + 0 + 500 = $500 >= $250 (demo unbudgeted line): shown in dollars only.")]
        return {
            "title": "Zero budgets, unbudgeted spending, a credit and future plan months",
            "purpose": "A Hay line with no budget and $500 spent; an Ear tags line with no budget and $200 spent; a September credit '(150)' on Water and fencing; October and November plan rows with blank actuals.",
            "as_of": f"{AS_OF} {RANCH_TZ}",
            "alerts_exact": True,
            "expected_rows": rows,
            "expected_absent": [A("Budget", "category", "Ear tags", "$200 < $250 (demo unbudgeted line); never 'Infinity%'", ["BUD-03"]),
                                A("Budget", "category", "Water and fencing", f"{wf[1]:,} vs {wf[0]:,}: under budget after the credit", ["BUD-02"])]
                               + [A("Budget", "category", c, "under budget") for c in ["Feed and mineral", "Vet and health", "Labor"]],
            "allowed_extra_rows": [R("X-FUTURE", "Budget", "file", "budget.csv", "data-issue", None, topic="future", findings=["BUD-01", "TIME-01"],
                                     note=("A plain note that the October and November plan rows are not counted yet is allowed (the lead's "
                                           "as-of rule says rows after as_of are reported). Calling their blank actuals 'not entered' is not."))],
            "must_not_appear_anywhere_extra": ["not entered (2026-10", "not entered (2026-11"],
            "area_states": {"Water": "needs-attention", "Grazing": "needs-attention", "Gain": "needs-attention", "Health": "needs-attention", "Budget": "needs-attention"},
            "tile_expectations": [tile("budget", pct=round(float(F(ta - tb, tb) * 100), 4), actual_usd=ta, budget_usd=tb,
                                       note="Jun-Sep only; the credit counts as -150; Hay and Ear tags add 700 of actual and 0 of budget.")],
            "computed": {"water_and_fencing": wf, "totals": [tb, ta]},
            "findings": ["BUD-01", "BUD-02", "BUD-03", "BUD-04"], "rules": ["RULE-BUD-03", "RULE-BUD-05", "RULE-BUD-06", "RULE-BUD-07"],
        }
    return name, files, ch, exp


@scenario
def s08():
    name = "08-historical-as-of-and-future-records"
    files, ch = base_files()
    as_of = "2026-09-27T18:00-05:00"
    ch["meta"] = meta_text(as_of)
    h, rows = committed_rows("moves")
    out = []
    for r in rows:
        if r[0] == "Yearlings" and r[1] == "P3" and r[2] == "2026-09-06":
            out += [["Yearlings", "P3", "2026-09-06", "2026-10-03"], ["Yearlings", "P2", "2026-10-03", ""]]
        else:
            out.append(r)
    ch["moves"] = csv_text(h, out)
    h, rows = committed_rows("weights")
    sep15 = {r[0]: int(r[3]) for r in rows if r[2] == "2026-09-15"}
    ch["weights"] = csv_text(h, rows + [[f"H{i:03d}", "Heifers", "2026-09-29", str(sep15[f"H{i:03d}"] + 6)] for i in range(1, 11)])

    def exp(folder):
        local = "2026-09-27T18:00"
        hf = pooled(folder, "Heifers", "2026-07-20", "2026-09-15")
        yf = pooled(folder, "Yearlings", "2026-07-20", "2026-09-15")
        slow = sorted(t for t, a in yf["per"].items() if a < 1)
        wrows = [r for _, r in load_folder(folder)["water"]["rows"]]
        n_after = sum(1 for r in wrows if r["time"] > local)
        bs = budget_sums(folder, {"2026-06", "2026-07", "2026-08"})
        fb, fa = bs["Fuel"]; rb, ra = bs["Repairs"]
        tb = sum(v[0] for v in bs.values()); ta = sum(v[1] for v in bs.values())
        rows = [
            R("GRZ-TODAY", "Grazing", "stay", "Yearlings", "needs-attention", "warning", nums={},
              must_not=["in 0 days"], text_any=["today"], also=["day 21 of a 21-day plan"], findings=["GRZ-01", "UI-06", "TIME-01"], rules=["RULE-GRZ-02"],
              arithmetic=("The Sand Hills row has out_date 2026-10-03, after the as-of date, so it is still the current stay. "
                          "Sep 6 to Sep 27 = 21 days of a 21-day plan: the move is due today (0 days left).")),
            R("GRZ-FUTURE", "Grazing", "record", "Yearlings", "data-issue", None, topic="future", dates=["2026-10-03"],
              findings=["TIME-01", "GRZ-01"], arithmetic="'Yearlings,P2,2026-10-03,' starts after the as-of date: not judged, reported."),
            R("GAIN-H", "Gain", "group", "Heifers", "needs-attention", "serious", nums={"adg": float(hf["adg"]), "target": 1.0},
              dates=["2026-07-20"], must_not=["since 2026-09-15"], findings=["TIME-01", "GAIN-03"], rules=["RULE-GAIN-01"],
              arithmetic=(f"The Sep 29 re-weigh is after as_of and is left out. Jul 20 to Sep 15: {hf['lbs']} / {hf['animal_days']} = "
                          f"{float(hf['adg']):.4f} < 0.8.")),
            R("GAIN-Y", "Gain", "animals", "Yearlings", "needs-attention", "warning", nums={"count": len(slow), "threshold": 1.0}, tags=slow,
              rules=["RULE-GAIN-02"], arithmetic="Unchanged from the committed data: the same six yearlings under 1.0 lb/day."),
            R("W-FUTURE", "Gain", "file", "weights.csv", "data-issue", None, topic="future", nums={"count": 10}, dates=["2026-09-29"],
              findings=["TIME-01"], arithmetic="H001-H010 weighed 2026-09-29, after the as-of date: 10 rows left out and reported."),
            R("WATER-FUTURE", "Water", "file", "water.csv", "data-issue", None, topic="future", nums={"count": n_after},
              findings=["TIME-01"], arithmetic=(f"Readings after {local}: 12 per tank for the 7 tanks reporting to Sep 30 18:00 (7 x 12 = 84) "
                                                f"+ 5 for T6 (to Sep 29 00:00) = {n_after}.")),
            R("BOOST", "Health", "task", "Yearlings: Booster vaccine", "needs-attention", "serious", nums={"overdue_days": 12},
              dates=["2026-09-15"], rules=["RULE-HLTH-01"], arithmetic="Due 2026-09-15; Sep 15 to Sep 27 = 12 days overdue."),
            R("PINK", "Health", "task", "Cows: Pinkeye check", "needs-attention", "warning", nums={"due_in_days": 6},
              dates=["2026-10-03"], rules=["RULE-HLTH-02"], arithmetic="Due 2026-10-03; Sep 27 to Oct 3 = 6 days."),
            R("FUEL", "Budget", "category", "Fuel", "needs-attention", "serious",
              nums={"pct_over": float(F(fa - fb, fb) * 100), "usd_over": fa - fb}, must_not=["2,040"], findings=["BUD-01"], rules=["RULE-BUD-03", "RULE-BUD-05"],
              arithmetic=f"Closed months Jun-Aug: {fa:,} vs 3 x 2,400 = {fb:,}; ${fa - fb:,}; {fa - fb:,} / {fb:,} = {float(F(fa - fb, fb) * 100):.1f}% (> 10% and >= $1,000)."),
            R("REPAIRS", "Budget", "category", "Repairs", "needs-attention", "warning",
              nums={"pct_over": float(F(ra - rb, rb) * 100), "usd_over": ra - rb}, findings=["BUD-01", "BUD-04"], rules=["RULE-BUD-03", "RULE-BUD-05"],
              arithmetic=(f"Closed months Jun-Aug: {ra:,} vs 3 x 1,800 = {rb:,}; ${ra - rb:,}; {ra - rb:,} / {rb:,} = {float(F(ra - rb, rb) * 100):.1f}%. "
                          f"Over 10% but ${ra - rb:,} < $1,000, so not serious; >= 5% and >= $500, so a warning.")),
        ]
        return {
            "title": "Historical reporting and future records",
            "purpose": "as_of moved back to 2026-09-27T18:00-05:00 while the files run to Sep 30; a planned out_date and a planned next stay after as_of; a heifer re-weigh after as_of.",
            "as_of": f"{as_of} (ranch zone {RANCH_TZ}; 18:00 CDT)",
            "alerts_exact": True,
            "expected_rows": rows,
            "expected_absent": [A("Water", "tank", t, "as of Sep 27 18:00 every tank is above 40% with no 30-point fall", ["TIME-01"]) for t in ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"]]
                               + [A("Grazing", "stay", "Cows", "day 15 of 21"), A("Grazing", "stay", "Heifers", "day 8 of 14")],
            "allowed_extra_rows": [R("X-BUDGET-OPEN", "Budget", "file", "budget.csv", "data-issue", None, topic="future",
                                     note="A note that September is not yet closed is allowed; it is not an error.")],
            "area_states": {"Water": "ok", "Grazing": "needs-attention", "Gain": "needs-attention", "Health": "needs-attention", "Budget": "needs-attention"},
            "tile_expectations": [tile("water", ok=8, of=8, need_look=0),
                                  tile("budget", pct=round(float(F(ta - tb, tb) * 100), 4), actual_usd=ta, budget_usd=tb, note="Jun-Aug only.")],
            "open_decisions": [
                ("Repairs is a warning here only because of RULE-BUD-03's $1,000 serious line. The same Jun-Aug arithmetic is what the "
                 "committed data gives on Sep 30 if books_closed_through defaults to the month before as_of (RULE-BUD-05, data-fields.json): "
                 "Repairs would then drop from serious to warning on the committed data and break the Phase 1 acceptance bar. "
                 "Decide the closed-month convention (BUD-01: a month closes on its last day) before adopting both rules.")],
            "findings": ["TIME-01", "TIME-02", "GRZ-01", "BUD-01", "UI-06"], "rules": ["RULE-WF-14", "RULE-BUD-03", "RULE-BUD-05"],
        }
    return name, files, ch, exp


@scenario
def s09():
    name = "09-exact-rule-boundaries"
    files, ch = base_files()
    up = [56, 52, 48, 44, 40, 36, 33, 30]
    water = []
    water += designed_tank("T1", "P1", 60, up + [27.5, 24.9])
    water += designed_tank("T2", "P2", 60, up + [27.6, 25.0])
    water += designed_tank("T3", "P3", 60, up + [27.7, 25.1])
    water += designed_tank("T4", "P4", 60, [58, 56, 54, 52, 50, 48, 46, 44, 42, 39.9])
    water += designed_tank("T5", "P5", 60, [58, 56, 54, 52, 50, 48, 46, 44, 42, 40.0])
    water += designed_tank("T6", "P6", 80, [80.1, 72.0, 64.0, 57.0, 50.1])
    water += designed_tank("T7", "P7", 80, [80.0, 72.0, 64.0, 57.0, 50.1])
    t8 = designed_tank("T8", "P8", 70, [], last="2026-09-29T12:00") + [["T8", "P8", "2026-09-29T18:06", "70.2"]]
    water += t8
    water += designed_tank("T9", "P5", 75, [], last="2026-09-29T18:00")
    ch["water"] = csv_text(["tank_id", "pasture_id", "time", "level_pct"], water)
    ch["tanks"] = tanks_text(TANKS + [("T9", "P5")])
    h, rows = committed_rows("moves")
    edits = {("Cows", "P1", "2026-08-22"): ["Cows", "P1", "2026-08-22", "2026-09-11"], ("Cows", "P7", "2026-09-12"): ["Cows", "P7", "2026-09-11", ""],
             ("Heifers", "P8", "2026-09-09"): ["Heifers", "P8", "2026-09-09", "2026-09-16"], ("Heifers", "P4", "2026-09-19"): ["Heifers", "P4", "2026-09-16", ""],
             ("Yearlings", "P7", "2026-08-25"): ["Yearlings", "P7", "2026-08-25", "2026-09-08"], ("Yearlings", "P3", "2026-09-06"): ["Yearlings", "P3", "2026-09-08", ""]}
    ch["moves"] = csv_text(h, [edits.get((r[0], r[1], r[2]), r) for r in rows])
    h, rows = committed_rows("weights")
    jul = {r[0]: int(r[3]) for r in rows if r[2] == "2026-07-20"}
    others = [f"Y{i:03d}" for i in range(1, 151) if f"Y{i:03d}" not in ("Y027", "Y031")]
    gain = {f"H{i:03d}": (46 if i <= 27 else 45) for i in range(1, 46)}
    gain.update({"Y027": 56, "Y031": 57})
    gain.update({t: (92 if k < 99 else 91) for k, t in enumerate(others)})
    ch["weights"] = csv_text(h, [[r[0], r[1], r[2], str(jul[r[0]] + gain[r[0]])] if r[2] == "2026-09-15" else r for r in rows])
    ch["health"] = csv_text(["group", "task", "last_done", "next_due", "status"], [
        HLTH03_FIXED_ROW,
        ["Cows", "Pinkeye check", "2026-08-01", "2026-10-07", "open"],
        ["Heifers", "Pre-breeding vaccine", "2026-06-10", "", "done"],
        ["Heifers", "Pregnancy check", "2026-09-20", "2026-10-08", "open"],
        ["Yearlings", "Booster vaccine", "2026-06-02", "2026-09-29", "open"],
        ["Yearlings", "Deworm", "2026-06-02", "2026-09-30", "open"],
    ])
    h, rows = committed_rows("budget")
    totals = {"Feed and mineral": [6820] * 4, "Labor": [9450] * 4, "Fuel": [2520] * 4, "Repairs": [1980] * 4,
              "Vet and health": [1658, 1657, 1658, 1657], "Water and fencing": [1259, 1259, 1259, 1258]}
    mi = {"2026-06": 0, "2026-07": 1, "2026-08": 2, "2026-09": 3}
    ch["budget"] = csv_text(h, [[r[0], r[1], r[2], str(totals[r[1]][mi[r[0]]])] for r in rows])

    def exp(folder):
        hf = pooled(folder, "Heifers", "2026-07-20", "2026-09-15")
        yf = pooled(folder, "Yearlings", "2026-07-20", "2026-09-15")
        bs = budget_sums(folder, {"2026-06", "2026-07", "2026-08", "2026-09"})
        tb = sum(v[0] for v in bs.values()); ta = sum(v[1] for v in bs.values())

        def b(c):
            bb, aa = bs[c]
            return {"pct_over": float(F(aa - bb, bb) * 100), "usd_over": aa - bb}, f"{aa:,} vs {bb:,}: ${aa - bb:,}, {aa - bb:,} / {bb:,} = {float(F(aa - bb, bb) * 100):.1f}%"
        last = lambda t: water_series(folder, t)[-1]
        t9 = last("T9")
        rows = [
            R("T1", "Water", "tank", "T1", "needs-attention", "critical", nums={"level_pct": 24.9}, rules=["RULE-WAT-01"], arithmetic="24.9 < 25: critical."),
            R("T2", "Water", "tank", "T2", "needs-attention", "warning", nums={"level_pct": 25.0}, rules=["RULE-WAT-01", "RULE-WAT-02"], arithmetic="25.0 is not < 25; 25.0 < 40: warning."),
            R("T3", "Water", "tank", "T3", "needs-attention", "warning", nums={"level_pct": 25.1}, rules=["RULE-WAT-02"], arithmetic="25.1 < 40: warning."),
            R("T4", "Water", "tank", "T4", "needs-attention", "warning", nums={"level_pct": 39.9}, rules=["RULE-WAT-02"], arithmetic="39.9 < 40: warning."),
            R("T6", "Water", "tank", "T6", "needs-attention", "critical", nums={"drop_pts": 30.0, "level_pct": 50.1}, findings=["WAT-08"], rules=["RULE-WAT-03"],
              arithmetic="Window [Sep 29 18:00, Sep 30 18:00] holds 80.1, 72.0, 64.0, 57.0, 50.1 (the 80.1 is exactly 24 h before the last reading, inside the window); 80.1 - 50.1 = 30.0 >= 30."),
            R("T9", "Water", "tank", "T9", "needs-attention", "serious", alt=["cant-tell"], nums={"silent_hours": 24, "level_pct": float(F(t9[1]))}, rules=["RULE-WAT-04"],
              arithmetic=f"Last reading {t9[0]} ({t9[1]}%); Sep 29 18:00 to Sep 30 18:00 = 24.0 hours >= 24."),
            R("COWS", "Grazing", "stay", "Cows", "needs-attention", "warning", nums={"days_left": 2}, rules=["RULE-GRZ-02"],
              arithmetic="South Divide since Sep 11: Sep 11 to Sep 30 = 19 days of 21; 2 days left, inside the 2-day grace."),
            R("HEIFERS", "Grazing", "stay", "Heifers", "needs-attention", "warning", nums={},
              must_not=["in 0 days"], text_any=["today"], findings=["UI-06"], rules=["RULE-GRZ-02"],
              arithmetic="Lone Tree since Sep 16: Sep 16 to Sep 30 = 14 days of 14: the move is due today."),
            R("YEARLINGS", "Grazing", "stay", "Yearlings", "needs-attention", "serious", nums={"days": 22, "plan": 21, "over": 1},
              must_not=["1 days"], rules=["RULE-GRZ-01"], arithmetic="Sand Hills since Sep 8: Sep 8 to Sep 30 = 22 days; 22 - 21 = 1 day over."),
            R("Y-ANIMALS", "Gain", "animals", "Yearlings", "needs-attention", "warning", nums={"count": 1, "threshold": 1.0}, tags=["Y027"],
              must_not=["1 yearlings", "Y031"], findings=["GAIN-11", "GAIN-12"], rules=["RULE-GAIN-02"],
              arithmetic=("Y027 gained 56 lbs in 57 days = 0.982 < 1.0: listed. Y031 gained 57 lbs in 57 days = 1.000, not under 1.0: "
                          f"not listed. Group pooled {yf['lbs']} / {yf['animal_days']} = {float(yf['adg'])} = exactly 0.8 x 2.0, not under it.")),
            R("BOOST", "Health", "task", "Yearlings: Booster vaccine", "needs-attention", "serious", nums={"overdue_days": 1}, dates=["2026-09-29"],
              must_not=["1 days"], rules=["RULE-HLTH-01"], arithmetic="Due Sep 29; Sep 29 to Sep 30 = 1 day overdue."),
            R("DEWORM", "Health", "task", "Yearlings: Deworm", "needs-attention", "warning", nums={}, dates=["2026-09-30"],
              must_not=["in 0 days"], text_any=["today"], findings=["UI-06"], rules=["RULE-HLTH-02"], arithmetic="Due Sep 30, the as-of date: due today."),
            R("PINK", "Health", "task", "Cows: Pinkeye check", "needs-attention", "warning", nums={"due_in_days": 7}, dates=["2026-10-07"],
              rules=["RULE-HLTH-02"], arithmetic="Due Oct 7; Sep 30 to Oct 7 = 7 days, within 7 (inclusive)."),
        ]
        for rid, cat, extra in [("FEED", "Feed and mineral", "10.0% is not more than 10% (rule text), so warning; >= 5% and >= $500. $2,480 is just under the $2,500 large-dollar line."),
                                ("LABOR", "Labor", "exactly 5.0% and >= $500: warning (5% inclusive)."),
                                ("REPAIRS", "Repairs", "10.0% and $720: >= 5% and >= $500, warning; not serious (needs more than 10% and >= $1,000)."),
                                ("VET", "Vet and health", "10.5% is more than 10%, but $630 < $1,000: not serious; >= 5% and >= $500: warning.")]:
            nums, arith = b(cat)
            rows.append(R(rid, "Budget", "category", cat, "needs-attention", "warning", nums=nums, findings=["BUD-04", "BUD-05", "BUD-06"],
                          rules=["RULE-BUD-02", "RULE-BUD-03"], arithmetic=f"{arith}; {extra}"))
        fuel_n, fuel_a = b("Fuel"); wf_n, wf_a = b("Water and fencing")
        return {
            "title": "Exact rule boundaries",
            "purpose": "Every threshold hit exactly, and one step either side, so the comparison direction (< vs <=, > vs >=) and floating point are pinned down.",
            "as_of": f"{AS_OF} {RANCH_TZ}",
            "alerts_exact": True,
            "expected_rows": rows,
            "expected_absent": [A("Water", "tank", "T5", "40.0 is not < 40"), A("Water", "tank", "T7", "80.0 - 50.1 = 29.9 < 30; 50.1 >= 40"),
                                A("Water", "tank", "T8", "last reading Sep 29 18:06: 23.9 hours < 24; level 70.2"),
                                A("Gain", "group", "Heifers", f"pooled {hf['lbs']} / {hf['animal_days']} = {float(hf['adg'])} = exactly 0.8 x 1.0, not under it", ["GAIN-12"]),
                                A("Gain", "group", "Yearlings", f"pooled {yf['lbs']} / {yf['animal_days']} = {float(yf['adg'])} = exactly 0.8 x 2.0", ["GAIN-12"]),
                                A("Gain", "animals", "Heifers", "slowest heifer 45/57 = 0.789 >= 0.5"),
                                A("Health", "task", "Heifers: Pregnancy check", "due Oct 8: 8 days, outside 7"),
                                A("Budget", "category", "Fuel", f"{fuel_a}: exactly 5.0% but $480 < $500"),
                                A("Budget", "category", "Water and fencing", f"{wf_a}: under 5%")],
            "allowed_extra_rows": [],
            "area_states": {"Water": "needs-attention", "Grazing": "needs-attention", "Gain": "needs-attention", "Health": "needs-attention", "Budget": "needs-attention"},
            "tile_expectations": [tile("water", ok=3, of=9, need_look=6, note="OK: T5, T7, T8."),
                                  tile("budget", pct=round(float(F(ta - tb, tb) * 100), 4), actual_usd=ta, budget_usd=tb)],
            "open_decisions": [
                ("Feed and mineral is exactly 10.0% over with $2,480. Under the current rule text and BUD-05 ('serious above 10%') it is a "
                 "warning. RULE-BUD-03's formula ('serious if p >= seriousPct AND V >= seriousUsd') makes it serious. Pick one and update "
                 "this expected row if it is RULE-BUD-03's."),
                ("The 80.1 reading at exactly last - 24 h is inside the window here ([last - 24 h, last], WAT-03's fix). RULE-WAT-03's phase "
                 "note ('the reading about 24 h before the latest, within one reporting interval') gives the same 30.0 for this series.")],
            "computed": {"heifers": {k: hf[k] for k in ("lbs", "n", "animal_days")}, "heifers_adg": float(hf["adg"]),
                         "yearlings": {k: yf[k] for k in ("lbs", "n", "animal_days")}, "yearlings_adg": float(yf["adg"]), "budget_totals": [tb, ta]},
            "findings": ["WAT-08", "GAIN-11", "GAIN-12", "BUD-04", "BUD-05", "BUD-06", "UI-06", "TEST-01", "TEST-02"], "rules": ["RULE-WAT-01", "RULE-WAT-02", "RULE-WAT-03", "RULE-WAT-04", "RULE-GRZ-01", "RULE-GRZ-02", "RULE-GAIN-01", "RULE-GAIN-02", "RULE-HLTH-01", "RULE-HLTH-02", "RULE-BUD-02", "RULE-BUD-03"],
        }
    return name, files, ch, exp


@scenario
def s10():
    name = "10-malformed-and-hostile-csv"
    files, ch = base_files()
    hostile = "Windmill <img src=x onerror=window.__scenarioXss=1>"
    h, rows = committed_rows("pastures")
    ch["pastures"] = csv_text(h, [[r[0], "Sand Hills, East" if r[0] == "P3" else hostile if r[0] == "P2" else r[1], *r[2:]] for r in rows])
    h, rows = committed_rows("groups")
    ch["groups"] = csv_text(h, [[r[0], 'yearling steers, "fall" set' if r[0] == "Yearlings" else r[1], *r[2:]] for r in rows])
    h, rows = committed_rows("water")
    body = csv_text(h, rows)
    lines = body.split("\r\n")
    cut = 1 + sum(1 for r in rows if r[0] == "T1")
    lines[cut:cut] = ["", "   ", ",,,"]
    ch["water"] = ("﻿" + "\r\n".join(lines)).encode("utf-8")
    h, rows = committed_rows("weights")
    out = []
    for r in rows:
        if r[0].startswith("Y"):
            r = [r[0][1:], *r[1:]]
        if r[0] == "H001" and r[2] == "2026-09-15":
            r = ["H001", "Heifers", "2026-09-15", "1,169"]
        out.append(r)
    ch["weights"] = csv_text(h, out)
    h, rows = health_fixed_rows()
    ch["health"] = csv_text(["group", "task", "last_done", "next_due", "staus"], rows)
    h, rows = committed_rows("budget")
    ch["budget"] = csv_text(h, rows, terminator="\r\r\n")

    def exp(folder):
        ten = committed_ten(folder)
        yslow = ["027", "031", "058", "082", "129", "132"]
        rows = [ten[k] for k in ["T2", "T4", "T6", "GRZ", "GAIN-H", "FUEL", "REPAIRS"]]
        rows[0]["key_text_any"] = ["Windmill <img"]
        rows[0]["note"] = "The pasture name must reach the page as text (render_expectations)."
        rows[3]["key_text_any"] = ["Sand Hills, East"]
        rows[4]["arithmetic"] += " H001's Sep 15 weight is the quoted \"1,169\", read as 1169."
        rows += [
            R("GAIN-Y", "Gain", "animals", "Yearlings", "needs-attention", "warning", nums={"count": 6, "threshold": 1.0}, tags=yslow,
              findings=["CSV-06", "CSV-01"], rules=["RULE-GAIN-02"],
              arithmetic="Same six animals as the committed data, tags now written 027 ... 132: kept as text, leading zeros intact."),
            R("HEALTH-COL", "Health", "file", "health.csv", "data-issue", None, topic="missing-column", text_any=["status", "staus"],
              findings=["CSV-03", "LOAD-01"], arithmetic="health.csv's header says 'staus'; the required 'status' column is missing, so no health task can be judged."),
            R("WATER-BLANKS", "Water", "file", "water.csv", "data-issue", None, topic="blank-rows", findings=["CSV-02"],
              note="An empty line, a whitespace-only line and ',,,' are skipped and counted in a visible note (whether the empty line is counted is a choice).",
              arithmetic="3 non-data lines after the T1 block."),
        ]
        return {
            "title": "Malformed and hostile CSV text",
            "purpose": ("Quoted commas (a pasture name), escaped quotes plus a comma (a group class), a quoted '1,169' weight, a UTF-8 BOM and "
                        "blank, whitespace-only and ',,,' rows (water.csv), leading-zero tags, a header typo (health.csv 'staus'), "
                        "doubled-CR line endings (budget.csv) and '<img onerror>' markup in a pasture name. Every other file is CRLF, as committed."),
            "as_of": f"{AS_OF} {RANCH_TZ}",
            "alerts_exact": True,
            "expected_rows": rows,
            "expected_absent": [A("Gain", "group", "Yearlings", "target read as 2.0; pooled 1.9425 >= 1.6", ["CSV-01"]),
                                A("Gain", "animals", "Heifers", "the group-wide heifer row covers them")],
            "allowed_extra_rows": [],
            "area_states": {"Water": "needs-attention", "Grazing": "needs-attention", "Gain": "needs-attention", "Health": "cant-tell", "Budget": "needs-attention"},
            "tile_expectations": [tile("water", ok=5, of=8, need_look=3), tile("budget", pct=1.0, actual_usd=89303, budget_usd=88400)],
            "render_expectations": [
                {"check": "no_injected_element", "selector": "#exceptions img, #water img, #tiles img, #budgetTable img", "findings": ["SEC-01"]},
                {"check": "global_not_set", "name": "__scenarioXss", "findings": ["SEC-01"]},
                {"check": "text_visible", "text": "Windmill <img", "findings": ["SEC-01"]},
            ],
            "findings": ["CSV-01", "CSV-02", "CSV-03", "CSV-05", "CSV-06", "SEC-01", "LOAD-01"], "rules": [],
        }
    return name, files, ch, exp


# ------------------------------------------------------------------------------------------------ consistency check
def matches(exp_row, s):
    if exp_row["area"] != s["area"] or exp_row["kind"] != s["kind"] or exp_row["subject_key"] != s["key"]:
        return False
    states = [exp_row["state"]] + exp_row.get("state_alternatives", [])
    if s["state"] not in states:
        return False
    if exp_row.get("severity") and s["severity"] and exp_row["severity"] != s["severity"]:
        return False
    if exp_row.get("topic") and s.get("topic") and exp_row["topic"] != s["topic"]:
        return False
    return True


def num_ok(name, want, s):
    got = s["nums"].get(name)
    if got is None or isinstance(want, str):
        return True
    return abs(float(got) - float(want)) < 1e-9 or (name == "silent_hours" and abs(got - want) < 1e-6)


def check(expected, rows, facts):
    problems = []
    used = set()
    for e in expected["expected_rows"]:
        hit = [i for i, s in enumerate(rows) if matches(e, s)]
        if not hit:
            problems.append(f"expected row {e['id']} ({e['area']}/{e['subject_key']}/{e['state']}/{e['severity']}) not found by the sweep")
            continue
        i = hit[0]
        used.add(i)
        for k, v in e["key_numbers"].items():
            if not num_ok(k, v, rows[i]):
                problems.append(f"{e['id']}: {k} expected {v}, sweep {rows[i]['nums'].get(k)}")
        if e.get("key_tags") and rows[i]["nums"].get("tags") and sorted(e["key_tags"]) != sorted(rows[i]["nums"]["tags"]):
            problems.append(f"{e['id']}: tags differ: {e['key_tags']} vs {rows[i]['nums']['tags']}")
    for i, s in enumerate(rows):
        if i in used:
            continue
        if any(matches(x, s) for x in expected.get("allowed_extra_rows", [])):
            continue
        if any(matches(x, s) for x in expected["expected_rows"]):
            continue
        problems.append(f"sweep row not in expected.json: {s['area']}/{s['kind']}/{s['key']}/{s['state']}/{s['severity']} {s.get('topic') or ''} {s['nums']}")
    for a in expected["expected_absent"]:
        for s in rows:
            if s["area"] == a["area"] and s["kind"] == a["kind"] and s["key"] == a["subject_key"] and s["state"] == "needs-attention":
                problems.append(f"expected_absent {a['area']}/{a['subject_key']} but the sweep has {s}")
    for t in expected.get("tile_expectations", []):
        if t["tile"] == "water" and "water_tile" in facts and "ok" in t:
            if (facts["water_tile"]["ok"], facts["water_tile"]["of"]) != (t["ok"], t["of"]):
                problems.append(f"water tile {t} vs sweep {facts['water_tile']}")
        if t["tile"] == "budget" and "pct" in t and "budget_tile" in facts:
            bt = facts["budget_tile"]
            if (bt["budget_usd"], bt["actual_usd"]) != (t["budget_usd"], t["actual_usd"]):
                problems.append(f"budget tile {t} vs sweep {bt}")
    return problems


# ------------------------------------------------------------------------------------------------ main
def main():
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "settings.json").write_text(json.dumps(SETTINGS, indent=1, ensure_ascii=False) + "\n")
    all_ok = True
    for fn in SCEN:
        name, files, changed, exp_fn = fn()
        folder = OUT / name
        if folder.exists():
            for p in folder.glob("*.csv"):
                p.unlink()
        folder.mkdir(parents=True, exist_ok=True)
        status = {}
        for n in FILES + ["tanks"]:
            if n in changed:
                data = changed[n]
                (folder / f"{n}.csv").write_bytes(data if isinstance(data, bytes) else data.encode("utf-8"))
                status[n] = "added" if n not in files and n == "tanks" else "changed"
            elif n in files:
                (folder / f"{n}.csv").write_bytes(files[n])
                status[n] = "copied unchanged"
            else:
                status[n] = "absent"
        expected = exp_fn(folder)
        doc = {"scenario": name, "title": expected.pop("title"), "fictional": "All data is fictional (Example Ranch). Every threshold is a demonstration setting.",
               "purpose": expected.pop("purpose"), "as_of": expected.pop("as_of"),
               "files": {n: s for n, s in status.items()},
               "files_note": COMMON_FILES_NOTE if name != "01-planted-problems" else "The committed data/ files, byte for byte.",
               "settings": "../settings.json", "computed_by": COMPUTED_BY,
               "matching": ("alerts_exact: every needs-attention row the implementation shows must be one of expected_rows (or "
                            "allowed_extra_rows); data-issue and CAN'T TELL rows may carry extra wording. A row matches on area, "
                            "kind and subject_key; state (or a listed alternative) and severity must agree; every key number must "
                            "be shown, correctly rounded to the precision shown; key_dates may be ISO or 'Mon D'; key_tags must all "
                            "appear; must_not_appear strings must not."),
               **expected}
        doc["must_not_appear_anywhere"] = GLOBAL_MUST_NOT + doc.pop("must_not_appear_anywhere_extra", [])
        (folder / "expected.json").write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
        rows, facts = sweep(folder)
        problems = check(doc, rows, facts)
        all_ok &= not problems
        print(f"{name}: {len(doc['expected_rows'])} expected rows, {len(doc['expected_absent'])} expected absent; "
              f"sweep rows {len(rows)}; {'consistent' if not problems else 'INCONSISTENT'}")
        for p in problems:
            print("   ", p)
        if "--facts" in sys.argv:
            print("    facts:", json.dumps(facts, default=str))
    print("all scenarios consistent with the reference sweep" if all_ok else "SOME SCENARIOS INCONSISTENT")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
