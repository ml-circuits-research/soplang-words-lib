# compat/psys2 — one consumer's material, as a compatibility check

A small sample from PSys2 (https://github.com/ml-circuits-research/psys2, same owner, copied with permission), the first large user of this library. It is test material for the *compatibility suite* only: the library does not import from it and it is not in the npm package.

| Path | What it is |
| --- | --- |
| `specs/` | PSys2's specifications of its SOP Lang dialect, its legends and its interpreter (questions, answers, result envelope). |
| `worlds/{core,kids.common,lang.common}` | The shared legends the three sample worlds import. |
| `worlds/{kids.shop,kids.arith,kids.tasks}` | Three small worlds: legend, knowledge base, operation declarations, the JavaScript that computes their answers today, reply templates, tests. |
| `cases/<world>.cases.jsonl` | For each test, in run order: `input`, `session` (same session = one dialogue), `expect`, `expectStatus`, the `wires` PSys2 added for the turn (facts, events, questions, requests, and PSys2's own `core.answer` wires) and `psys2.answers` (status, value, values, text, via, from, reason). 147, 217 and 232 cases. |
| `tools/dump-cases.mjs` | The script that produced the cases (runs inside a PSys2 checkout). |
