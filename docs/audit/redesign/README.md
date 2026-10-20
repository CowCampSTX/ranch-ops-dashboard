# Redesign checks

Two read-only Playwright scripts for the redesigned page. They are not part of the audit's evidence.

| Script | What it does | Run it |
|---|---|---|
| [preserve.mjs](preserve.mjs) | The 34 preserve checks (KEEP-01 to KEEP-34) behind [06 section 6.3](../06-phase1-spec.md#63-accessibility-and-layout-kept-from-the-redesign). Phase 1 keeps them passing; the browser smoke test that P1-17 part b adds will run the same checks, ported into it or by running this script ([06 section 11.4](../06-phase1-spec.md#114-browser-smoke-test) item 6). Until then, run this script against the served page | Serve the page, then `node docs/audit/redesign/preserve.mjs http://localhost:8766/` |
| [coverage.mjs](coverage.mjs) | The 23 checks behind [08-redesign-coverage.md](../08-redesign-coverage.md), on a temporary copy of the page with its own server. It records the redesign's claims and is not a Phase 1 gate | `node docs/audit/redesign/coverage.mjs [port]` (default port 8802) |

Both need Playwright with Chromium: see "Before running the review scripts" in [the audit README](../README.md). Exit
code 2 means a set-up problem, not a result about the page. This folder stays on GitHub only
([docs/README.md](../../README.md)).
