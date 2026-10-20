# Audit registries

The machine-readable registries the audit documents are built from. The documents quote them; change a registry and
the document that quotes it together.

| File | What it holds |
|---|---|
| `findings.json` | The 83 findings, with stable IDs such as LOAD-01 ([02-findings.md](../02-findings.md) is built from it) |
| `findings-index.json` | A compact index of the 83 findings in `findings.json` |
| `findings-map.json` | Each of the 144 raw findings in the [evidence](../evidence/README.md) files (`baseline.json`, `audit_*.json`, `verify_*.json`), with the registry ID it was merged into |
| `rules.json` | The 98 rules, classed A to D, with their research, and the `data_fields` (152) and `integrations` (47) sections ([03-research-and-data.md](../03-research-and-data.md)) |
| `rules-index.json` | A compact index of the rules |
| `data-fields.json`, `integrations.json` | Copies of the `data_fields` and `integrations` sections of `rules.json`. No script writes them, so change a section and its copy together |
| `sources.json` | The sources cited by the research |
| `registry-changelog.md` | The citation critic's pass and the review fixes |

The ranch data the findings, rules and data fields refer to is the fictional Example Ranch. The sources in
`sources.json`, the services in `integrations.json` and the research quoted in `rules.json` are real and public. This
folder stays on GitHub only ([docs/README.md](../../README.md)).
