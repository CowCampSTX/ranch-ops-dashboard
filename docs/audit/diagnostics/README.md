# Audit diagnostics

The 46 scripts (43 Node, 3 Python) the audit ran: baseline checks, one reproduction per audit area, the skeptics'
verification scripts, research diagnostics, the hand-value check, and the scenario builder and runner.
[01-baseline.md section 8](../01-baseline.md#8-how-to-re-run-every-diagnostic) gives the command for each audit
script, and [scenarios/README.md](../scenarios/README.md) covers the three scenario scripts. Read "Before running the
review scripts" in [the audit README](../README.md) first.

They check the page and its data and are not part of the page. Most only read, but two can write into the
repository: `scenarios.build.py` rewrites `docs/audit/scenarios/` (each scenario folder's CSV files, `settings.json`
and every `expected.json`; see [scenarios/README.md](../scenarios/README.md)), and `browser-check.mjs` writes its
screenshots to the folder given as its third argument, so give it a folder outside the repository unless you mean to
replace `docs/audit/screenshots/`. This folder stays on GitHub only ([docs/README.md](../../README.md)).
