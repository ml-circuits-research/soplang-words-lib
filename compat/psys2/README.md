# compat/psys2 — one consumer's material, as a compatibility check

A small sample from PSys2 (https://github.com/ml-circuits-research/psys2, same owner, copied with permission), the first large user of this library. It is test material for the *compatibility suite* only: the library does not import from it and it is not in the npm package.

| Path | What it is |
| --- | --- |
| `specs/` | PSys2's specifications of its SOP Lang dialect, its legends and its interpreter (questions, answers, result envelope). |
| `worlds/{core,kids.common,lang.common}` | The shared legends the three sample worlds import. |
| `worlds/{kids.shop,kids.arith,kids.tasks}` | Three small worlds: legend, knowledge base, operation declarations, the JavaScript that computes their answers today, reply templates, tests. |
| `cases/<world>.cases.jsonl` | For each test, in run order: `input`, `session` (same session = one dialogue), `expect`, `expectStatus`, the `wires` PSys2 added for the turn (facts, events, questions, requests, and PSys2's own `core.answer` wires) and `psys2.answers` (status, value, values, text, via, from, reason). 147, 217 and 232 cases. |
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
