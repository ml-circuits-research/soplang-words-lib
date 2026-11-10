# PSys2 material for the sopworld tasks

Copied from https://github.com/ml-circuits-research/psys2 at commit 45ac4bf by the PSys2 reviewer, with the owner's permission (both repositories belong to the same owner; PSys2 itself is AGPL-3.0-only). This directory is reference and test material: it is not part of the npm package (`files` in package.json does not list it) and the library must not import from it at run time.

| Path | What it is |
| --- | --- |
| `specs/01-soplang.md`, `02-legends-and-worlds.md`, `04-interpreter.md` | The PSys2 specifications of the language, the legends and world directories, and the interpreter (questions, answers, operations, the result envelope). |
| `worlds/<ns>/world.sop`, `legend.sop`, `kb.sop`, `operations.sop` | Manifest, legend, knowledge base and operation declarations of all 24 worlds (S1 loads all of them). |
| `worlds/kids.{shop,arith,tasks,time,common,animals,shapes}/ops.mjs`, `templates.sop`, `tests.sop` | The JavaScript the pilot replaces, the reply templates and the competency tests of the small worlds. |
| `cases/<world>.cases.jsonl` | One line per test of the world's `tests.sop`, in run order: `id`, `session` (tests with the same session share one dialogue, in this order), `input`, `expect` (substrings of the reply), `expectStatus`, `expectState`, and what PSys2 produced: `wires` (the SOP Lang wires the turn added to the session: entities, facts, events, questions, requests **and** PSys2's own `core.answer` wires) and `psys2.answers` (status, value, values, text, via, from, reason, missing). PSys2 passes every case. |
| `tools/dump-cases.mjs` | The script that produced the cases (run inside a PSys2 checkout; replace `<PSYS2_DIR>`). |

Counts: kids.shop 147, kids.arith 217, kids.tasks 232, kids.time 217, kids.animals 497, kids.shapes 476 cases.

For the pilot (S7), feed the non-answer wires of each case to the World (same session = same World) and compare your answer's status and value with `psys2.answers`; `core.answer` wires in `wires` are PSys2's output, not input.
