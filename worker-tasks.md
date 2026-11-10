# Worker tasks for sopworld

Written by the reviewer session (Claude, also the reviewer of PSys2) at the user's request, 2026-11-10; rewritten at 14:45 after the user's correction.

**The user's direction: sopworld is a general, useful library for self-consistent worlds of SOP Lang wires. It must be *compatible* with the PSys2 worlds, but it is not built *for* them.** Nothing PSys2-specific goes into the core: no PSys2 type names, no PSys2 envelope, no PSys2 file layout. Every feature below must make sense for any user of the library (a scheduler, a digital twin, a tutoring system, a game) and be documented with a neutral example. PSys2 is the first demanding user: its needs show what is missing, and a small compatibility suite (`compat/psys2/`) proves that such a system can sit on the library through its public, general mechanisms.

## Where things stand (reviewer, 2026-11-10 15:15) — read this first

The reviewer's first two commits to this repository were a false start; ignore them. One list is valid: **G1–G9 below**. The earlier S1–S8 list and the `psys2/` directory no longer exist; only `compat/psys2/` does.

| Task | State |
| --- | --- |
| S0, G1, G2 | validated |
| G7 budgets, stats, structural fork, one spelling of numbers (455f4a3); G5 abduction through calcs (3ef1b78) | **validated** (reviewer, 16:45): `npm test` 154 pass, 0 fail, 1 skipped; compat tests pass; no PSys2 name in `src/`. Reviewer probes: fork of a 2,000-wire world 0.007 ms and isolated; the shop abduction now answers `b1.paid=19` for "change of 5" (was `[]`); a self-feeding rule is refused in 2 ms. **Q11 answered:** your choice is right — the compiled cost is the figure that matters (reviewer run: cold 33 ms, best of ten 24 ms on a slower host). Close it; no further tuning. |
| G4 aggregates, arithmetic, time (823e3b3); Q8–Q10 applied (cb4f036) | **validated** (reviewer, 16:00): `npm test` 135 pass, 0 fail, 1 skipped; compat tests pass; no PSys2 name in `src/`. On your G4 note: keep pattern matching textual (`5` does not match `5.0`); instead normalise numeric literals **on tell** for slots whose kind is `integer` or `number` (store `5.0` as given but index its canonical form), so hosts never meet the difference. Do it in G7 with the index work, or say why not. |
| `core.check` rename (1b4541b), G6 queries (0d2cb6a), G3 sequence and fluents (5519782) | **validated** (reviewer, 15:50): `npm test` 123 pass, 0 fail, 1 skipped on sources and built file; `compat/psys2` schema and cases tests pass; `git grep -i psys2 src/` empty. |

**Answers to your open questions:**
- **Q8** (`refused` as a sixth status): keep it. "Cannot be" and "several values" are different things; the compatibility runner maps `refused` to PSys2's `conflicting`.
- **Q9** (`complete=true` decides `no` against `unknown`): accepted, and it is the right separation. In the PSys2 mapping read it from `closed`: PSys2 uses `closed=true` to mean "the world knows every instance".
- **Q10** (references to entities outside the session): accepted. The library keeps refusing a reference to a wire that does not exist. In PSys2 `e.user` is a built-in agent that every session has from the start, so the runner telling an `e.user` wire first is correct. The one `$e.tom` case: check whether the agent wire is created by an earlier turn of the same session in the cases file (PSys2 creates an agent wire on first mention, in the same turn); if the wire really is absent from `wires`, list the case as a failure with that reason and I will look at the dump.

**Do next, in this order, one commit each:**
1. **G8** — the proof of value. The three matrices (`kids.shop`, `kids.arith`, `kids.tasks`) in `compat/psys2/matrices/`, the runner over `compat/psys2/cases/*.jsonl`, and the report: cases passed / total, lines of matrix + fns against the `ops.mjs` logic replaced, ms per case, and the five demonstrations (question for a missing argument, default withdrawn, retract as undo, explain, abduction). One commit per world is fine. Be honest in the report: a case that needs logic the matrix cannot express is listed with the reason, not hidden in `fns.mjs`.
2. **G9** — documentation and the integration recipe.

Working rules for commits: pull with rebase before each commit; the reviewer only ever changes `worker-tasks.md` (tasks and answers) and, when you ask for more material, files under `compat/psys2/` — never `src/`, tests, docs, `questions.md` or your log. If a reviewer commit lands while you work, rebase onto it; it will not touch your files.

## 0. Protocol

| File | Who writes | What it is |
| --- | --- | --- |
| `worker-tasks.md` (this file) | reviewer only | The tasks. `git pull` before each task. Validated tasks move to "Validated" at the end. |
| `worker-log.md` | worker only | One entry per task: status, commands run, numbers, commit hash, deviations. Push when a task is done. |
| `questions.md` | worker only | Non-blocking questions: take the most reasonable choice, note it, continue. The reviewer answers in this file, under "Where things stand". |

Rules:
1. Everything on disk is in English.
2. Commit after each task (`Gn: <summary>`); `npm test` stays green on the sources and on the built file; rebuild `docs/`.
3. Every number in the log comes from a command written in the log.
4. Zero dependencies, one built file, browser and Node.
5. **Generality test for every change:** could a user who has never heard of PSys2 want this, and is it named and documented without PSys2 words? If not, it belongs in `compat/psys2/` (test code and mapping files), not in `src/`.
6. `compat/psys2/` holds a small sample of PSys2 (see its README): three specifications and three small worlds with their test cases. It is reference and test material. If you need more of PSys2, ask in `questions.md`.

## 1. What the first real user showed is missing (reviewer's check of 0.4, commit 72e22c7)

- The parser already reads PSys2's `.sop` files (13,759 wires in 114 files, no error), and a 15-line matrix reproduces the core of its shop world. Speed is fine (1–2 ms per `tell` / `step`).
- Gaps, all general: no type inheritance; the schema can only be written as `core.slot`; no order or state over time; no aggregates; abduction does not go through calculations; budgets do not cover every loop; `fork()` replays the log.

## 2. Tasks (general features)

### G1 — type hierarchy
`core.type` gets `extends=<type>` (several allowed if you can keep it sound; one is enough). A pattern of type `T` matches wires of `T` and of its descendants; slots are inherited (nearest declaration wins); reference slots (`type=`) accept descendants; indexes follow. Cycles are refused. Neutral example: `vehicle` > `car`, `truck`.

### G2 — schema vocabulary: slots can be declared in more than one notation
Many systems already have their own schema wires. Give the library a **declared mapping from foreign schema wires to its own**, written as wires, so that a user loads an existing schema unchanged:
```
@m core.schema.map from=<wire type of the foreign key declaration>
     of=<how to get the owning type>  key=<how to get the key name>
     required=<attr>  many=<attr or attr=value>  ask=<attr>  type=<attr holding a reference>  kind=<attr holding a literal kind> ...
```
(the syntax is yours; it must be data, not code, and documented). With it:
- literal kinds (`integer`, `number`, `boolean`, `string`, `atom`, quantities, times) are a general slot attribute (`kind=`), checked on tell;
- keys may be written short (`count=`) or qualified (`<type>.count=`); a declared namespace prefix for keys that validation always allows (for bookkeeping keys such as provenance or sequence);
- unknown attributes of schema wires are kept and readable through `world.schema(type)`, never refused;
- a module can be loaded **without** id prefixing when its ids are already qualified (an option of `core.use` or of the library entry).

### G3 — order and state over time
Version 0.4 has no notion of time (SPEC section 6). Add, as wires:
1. **Sequence.** Every told wire has a sequence number (taken from a declared key when present, else the tell order). Tests `before`, `after`; selectors `latest`, `first` in patterns.
2. **Fluents and effects.** A key declared as a state that events change; effect wires say how an event type changes it (`set`, `add`, `sub`, custom function). The current value is derived by applying effects in sequence order from the last explicit statement; an unknown start stays unknown; an effect that breaks a slot bound is a `conflict` naming the event. Retract or replace of an event recomputes incrementally.
3. **As-of queries:** `ask(pattern, { at: seq })`.
Neutral example in the docs: a warehouse stock with deliveries and withdrawals, or an account.

### G4 — aggregates and more arithmetic
1. Aggregates as calc over a pattern, grouped by bound variables: `count`, `sum`, `min`, `max`, `argmin`, `argmax`, `collect`. Maintained incrementally; stratified like negation.
2. Functions: `mod`, `abs`, `round`, integer division; clock and date arithmetic (add a duration, difference, weekday).
3. Typed comparison (`5` equals `5.0`; `10:00` before `14:30`).

### G5 — abduction through calculations
Today `abduce('?x change amount=5')` on a "paid − total = change" rule returns `[]`: the backward step ignores `core.calc`.
1. Invert `add`, `sub`, `mul`, `div` when all but one argument is known; for other functions and enumerable domains, try candidates forwards.
2. An abducible numeric key without an enum can be solved for when one calc chain determines it.
3. Tests: one-step and two-step chains, a non-invertible function with an enum, and a case with no solution (returns `[]` within the budget).

### G6 — queries with a status, and answers as wires
A general query call for "what is the value of key K of the thing matching these constraints": `world.query({ type, seek, where, about, mode })` (also accepted as a `core.question` wire, the shape `next()` already produces) returning `{ status, value | values, from, missing, alternatives }` with statuses `supported` (one value), `conflicting` (several, listed), `missing` (none; names the open key and its `ask`), `unknown`/`no` for existence by open/closed type, `budget`. Optionally it records a `core.answer` wire with provenance. Registered functions can be declared as producers of a key (`outputs=`), tried when lookup finds nothing. Actions (`core.request`-like wires that run a registered function) execute inside one transaction: refusal leaves the world unchanged and returns the violations.
Keep the names neutral and configurable where another system's vocabulary differs (which key holds the status, which wire type is the answer): that is what the compatibility suite will configure.

### G7 — compute budgets everywhere, and cheap forks
1. One deterministic `budget` (`{ steps }`, optional `ms`) per call, ticked in every loop: joins, chase, negation re-evaluation, lookahead, `suggest`, all solvers and the SAT solver, abduction, induction alignment, retraction, aggregates, replay.
2. Out of budget is never a hang and never an exception: `{ ok: false, violations: [{ kind: 'budget', site, steps }] }` (or `unknown` for solvers), world unchanged. `world.stats()` gives steps per site of the last call.
3. A test per site with a matrix built to explode; a static test that every `while`, `for(;;)` and recursion in `src/` ticks the budget or carries `// bounded: <reason>`.
4. `fork()` becomes structural (snapshot or copy-on-write), not a replay: a fork of a 2,000-wire world in < 1 ms. Hosts make many what-if copies per user message.

### G8 — compatibility suite and proof of value (`compat/psys2/`, test code only)
Shows that a real system can sit on the general library **without changes to `src/` that name it**.
1. `compat/psys2/mapping.sop`: the G2 schema mapping for PSys2 legends (`core.key` with `value`, `card`, `ask`, `required`; `core.type` with `extends`; `core.legend` with `imports`), the bookkeeping namespace (`core.*`), and the G6 vocabulary (PSys2's `core.question` / `core.answer`, `core.status`). Loading the legends in `compat/psys2/worlds/` through it gives 0 violations.
2. Three small worlds rebuilt as matrices in `compat/psys2/matrices/<world>/matrix.sop` (rules, fluents, aggregates, denies, defaults; a small `fns.mjs` only where really needed): `kids.shop`, `kids.arith`, `kids.tasks`. The existing `ops.mjs` there shows what must be computed; the goal is to replace its logic, not call it.
3. Runner `compat/psys2/run.mjs`: for each line of `cases/<world>.cases.jsonl` (same `session` = same World), tell the non-answer wires, run the query or action for each question or request wire, and compare status and value(s) with `psys2.answers` (reply wording is not compared).
4. Report per world: cases passed / total (147, 217, 232), lines of matrix + fns against the lines of the `ops.mjs` logic replaced (159, 237, 231), ms per case; and one demonstration each of what the matrix adds: a missing argument asked as a question, a default withdrawn by a later statement, `retract` as undo, `explain` of an answer, one abduction.
5. **Done when** each world passes ≥ 95% with at most half the code, every failure is listed with its reason, and `git grep -i psys2 src/` is empty.

### G9 — documentation
SPEC and docs updated for G1–G7 with neutral examples; `docs/integration.md`: how a host system maps its schema, its questions and its operations onto the library (the general recipe), with `compat/psys2/` as the worked example.

## 3. Order

G1, G2, G6, G3, G4, G7, G5, G8, G9. G8 for the shop world can start as soon as G1, G2, G4 and G6 are in.

## Validated

- S0 (c583bfa): tests that need an outside solver are skipped when it is missing; `AGENTS.md` added. Accepted from the log (80 pass, 1 skipped, 0 fail).
- G1 + G2 (23f238b): type hierarchy; schema mapping as data, literal kinds, qualified keys. Reviewer rerun: 96 pass / 0 fail / 1 skipped twice, compat schema test 2 pass, no PSys2 name in `src/`. Open from it: the `replace` benchmark is slower than 0.4 (goes to G7).
- `core.check` rename (1b4541b), G6 (0d2cb6a), G3 (5519782): reviewer rerun 123 pass / 0 fail / 1 skipped twice; compat tests pass; no PSys2 name in `src/`.
- G4 (823e3b3), Q8–Q10 applied (cb4f036): reviewer rerun 135 pass / 0 fail / 1 skipped; compat tests pass.
- G7 (455f4a3) and G5 (3ef1b78): reviewer rerun 154 pass / 0 fail / 1 skipped; fork 0.007 ms at 2,000 wires; shop abduction answers paid=19; runaway rule refused in 2 ms. Q11 closed (compiled cost is the target).
