# Audit registries

The machine-readable registries the audit documents are built from. The documents quote them; change a registry and
the document that quotes it together.

| File | What it holds |
|---|---|
| `findings.json` | The 83 findings, with stable IDs such as LOAD-01 ([02-findings.md](../02-findings.md) is built from it) |
| `findings-index.json`, `findings-map.json` | A compact index of the findings, and where each one is used |
| `rules.json` | The 98 rules, classed A to D, with their research ([03-research-and-data.md](../03-research-and-data.md)) |
| `rules-index.json` | A compact index of the rules |
| `data-fields.json`, `integrations.json` | The data fields and integrations, split out of `rules.json` |
| `sources.json` | The sources cited by the research |
| `registry-changelog.md` | The citation critic's pass and the review fixes |

All data here describes the fictional Example Ranch. This folder stays on GitHub only ([docs/README.md](../../README.md)).
