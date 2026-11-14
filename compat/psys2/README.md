# compat/psys2 — one consumer's material, as a compatibility check

A small sample from PSys2 (https://github.com/ml-circuits-research/psys2, same owner, copied with permission), the first large user of this library. It is test material for the *compatibility suite* only: the library does not import from it and it is not in the npm package.

PSys2's own files are **not kept here** (reviewer 04:40): its specifications and the six
worlds the sample uses (`core`, `kids.common`, `lang.common`, `kids.shop`, `kids.arith`,
`kids.tasks`) are read from PSys2 at the commit in `repos.pin` (45ac4bf, the one the
matrices were built against), through `tools/worlds.mjs` (a checkout in `.cache/psys2`,
fetched on first use; the tests are skipped offline).

| Path | What it is |
| --- | --- |
| `cases/<world>.cases.jsonl` | For each test, in run order: `input`, `session`, `expect`, `expectStatus`, the `wires` PSys2 added for the turn. These are PSys2's answers recorded by running it, which PSys2 does not keep, so they stay here as the test data of the compatibility check. |
| `tools/dump-cases.mjs` | The script that produced the cases (runs inside a PSys2 checkout). |

## What is built on it

| Path | What it is |
| --- | --- |
| `mapping.sop` | How the library reads PSys2's legend wires (`core.schema.map`); the legends load unchanged. |
| `matrices/<world>/matrix.sop` | The three sample worlds rebuilt as matrices: rules, states, aggregates, denies, actions. `kids.tasks` also has `fns.mjs`, its actions. |
| `run.mjs` | `node compat/psys2/run.mjs [world ...] [--failures] [--json]`: runs every test dialogue against the matrices and compares status and value with PSys2's answers. |
| `demo.mjs` | `node compat/psys2/demo.mjs`: five things the matrices give beyond the answers (a question for a missing argument, a default withdrawn, undo, an explanation, an abduction). |
| `*.test.mjs` | The same checks as tests (`npm test` runs them). |

Nothing here is imported by the library, and nothing in `src/` names PSys2.
