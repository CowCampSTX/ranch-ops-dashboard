# Audit evidence

The raw record behind the audit's statements, as JSON:

- `baseline.json`: the baseline run of the reviewed commit `cfd77e5`.
- `audit_<area>.json` and the skeptic's `verify_<area>.json`, for csv, time, water, grazing, gain, healthbudget and
  render.
- `research_<topic>.json` and the citation checker's `cite_<topic>.json`, for water, grazing, gain, health, budget,
  context and workflow.

They are the record of what the audit ran and found, so leave them as they are; a new check gets a new file. This folder stays on GitHub only
([docs/README.md](../../README.md)).
