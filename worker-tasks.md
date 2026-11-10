# Worker tasks for sopworld — making the library fit PSys2

Written by the PSys2 reviewer session (Claude) at the user's request, 2026-11-10. The user will ask the session that builds this library to read this file and follow it.

## 0. Protocol

| File | Who writes | What it is |
| --- | --- | --- |
| `worker-tasks.md` (this file) | reviewer only | The tasks. Read the current version (`git pull`) before each task. When a task is validated the reviewer moves it to "Validated" at the end. |
| `worker-log.md` | worker only | One entry per task: status (`done` / `partial` / `blocked`), commands run, numbers, commit hash, deviations. Push as soon as a task is done; the reviewer validates from it. |
| `questions.md` | worker asks, reviewer answers | For questions that do not block. Take the most reasonable choice, note it in the log, and continue. |

Rules:
1. Everything on disk is in English.
2. Work in the order given. Commit after each task (`Sn: <summary>`), keep `npm test` green on the sources and on the built file, and rebuild `docs/`.
3. Every number in the log comes from a command written in the log.
4. Zero dependencies, one built file, browser and Node: these stay.
5. **Everything you need from PSys2 is in `psys2/`** (see `psys2/README.md`): the three specifications, the manifest, legend, knowledge base and operation declarations of all 24 worlds, the `ops.mjs`, templates and tests of the small worlds, and `psys2/cases/<world>.cases.jsonl` — for every test, the wires PSys2 produced and the answer it gave. The owner allows copying (both repositories are his). `psys2/` is reference and test material only: it is not in the npm package, and the library does not import from it at run time. If you need something else from PSys2, ask in `questions.md` and the reviewer adds it.

## 1. Why

PSys2 (natural language to SOP Lang circuits, a neurosymbolic webchat in the browser) has 24 worlds. Each keeps its state and does its reasoning in hand-written JavaScript (`worlds/<ns>/ops.mjs`, about 12,000 lines in total) on top of a small interpreter (`src/interpreter/`, about 900 lines) and a session memory. The user's decision: **this library becomes the centre of those worlds** — representation and reasoning for every world go through it — and it is to be made **for PSys2**, not adapted to it by a shim layer on the PSys2 side.

The reviewer's check of version 0.4 (commit 72e22c7):
- The parser reads all 114 `.sop` files of the PSys2 worlds (13,759 wires) without an error.
- A 15-line matrix reproduces the core of `kids.shop` (asks "How much do you pay?", computes the change, refuses "not enough money" and names the wires).
- Speed is fine: 1–2 ms per `tell` / `step` in small worlds, 12 ms to load 300 fact wires.
- `npm test`: 78 of 81 pass on the reviewer's machine. The 3 failures are in `test/solvers.test.mjs` (lines 25, 95, 290: comparisons with clingo and CaDiCaL, which are not installed there). README says such tests are skipped when the solver is missing; they fail instead. Fix in S0.

What does not fit yet is the list of tasks below.

## 2. The PSys2 formats the library must speak natively

Read `psys2/specs/01-soplang.md`, `02-legends-and-worlds.md` and `04-interpreter.md`. The essentials:

**Legend** (`worlds/<ns>/legend.sop`): three wire types.
```
@legend.kids.arith core.legend
    namespace=kids.arith
    version=0.1.0
    imports=core
    imports=kids.common

@kids.arith.holding core.type
    extends=core.state
    doc="Someone has a number of items of one kind"

@kids.arith.holding.count core.key
    value=integer
    card=one
    ask="How many are there?"
    observe=true
    compute=true
```
- `core.type`: the id is the full type name; `extends` names the parent type (default `core.thing`); `closed=true` exists.
- `core.key`: the id is `<type>.<key>`; `value` is a literal kind (`integer`, `number`, `string`, `atom`, `boolean`, `quantity.<kind>`, `time.<kind>`) or a reference to a type (`$kids.common.agent`); `card` is `one` or `many`; `ask` is the question; `required`; `compute=true` means an operation can produce it.
- Key resolution: a short key `k` on a wire of type `T` resolves to `T.k`, else to the nearest ancestor's key. `core.*` keys are always allowed in full form.

**Fact wires in a session** use full type names, short keys, and bookkeeping keys:
```
@w1 kids.arith.holding owner=$e.tom item=apple count=5 core.seq=1 core.source=...
@w2 kids.arith.give who=$e.ana to=$e.tom item=apple count=3 core.seq=2
```
`core.seq` is the order in the dialogue. Ids contain dots (`e.tom`, `op.kids.arith.currentCount`).

**Questions and answers** (spec 04):
```
@w5 core.question type=kids.arith.holding seek=count where.owner=$e.tom where.item=apple mode=value
@a3 core.answer to=$w5 value=8 core.status=supported core.via=$op.kids.arith.currentCount core.from=$w1 core.from=$w2
```
`mode` is `value`, `exists`, `list` or `count`. Statuses: `supported`, `missing`, `conflicting`, `ambiguous`, `unsupported`, `budget`, `error`. Refusals carry `reason` (`precondition_failed`, `unknown_argument`, `unsupported_operation`, `execution_error`).

**Requests**: `core.request action=<name> arg.<k>=<v>` runs an operation declared in `operations.sop` (`core.operation` with `outputs=`, `inputs=`, `impl=`, `semantics=query|compute|action`), implemented in `ops.mjs` as `fn(ctx, args) -> envelope`, where `ctx` offers `find(type, where)`, `val(wire, key)`, `name(id)` and the world state.

**Knowledge bases** (`kb.sop`) are plain fact wires; some worlds have a few hundred.

## 3. Tasks

### S0 — housekeeping (small, first)
1. Tests that need clingo or a DIMACS solver are skipped when the program is not installed (see section 1). `npm test` must be 0 failures on a machine without them.
2. `AGENTS.md`: the rules of this file's section 0 in five lines, so every session starts from them.

### S1 — legends are the schema (no converter on the PSys2 side)
The world accepts PSys2 legend wires directly as matrix wires:
1. `core.type` with `extends`: **type inheritance**. A pattern of type `T` matches wires of `T` and its descendants. Slots (keys) are inherited; indexes by type include the ancestors. `closed=true` as today.
2. `core.key` with id `<type>.<key>`: equal in effect to `core.slot of=<type> key=<key>`. Map `card=one|many`, `required`, `ask`, and `value`:
   - literal kinds are checked (`integer`, `number`, `boolean`; `quantity.*` with the unit handling you have; `time.*` at least as an ordered value, see S3);
   - `value=$type` is a reference type, descendants allowed.
   - Extra attributes (`doc`, `example`, `observe`, `compute`, `negative`) are kept and readable (`world.schema(type)`), never refused.
3. `core.legend` with `namespace` and `imports`: a legend is a module. `imports` loads the imported legends from the library (like `core.use`, but **without** prefixing ids — legend ids are already fully qualified).
4. Short and full keys: a fact may use `count=` or `kids.arith.holding.count=`; both are the same key. `core.*` keys are always allowed and are ignored by validation unless a slot declares them.
5. `core.slot` stays as the native form; both forms may be mixed.
6. **Test:** load every `psys2/worlds/*/legend.sop` in dependency order into one world: 0 violations. Then load every `kb.sop`: report violations per world (they may reveal real PSys2 data errors — list them in the log, do not hide them).

### S2 — order, events and state over time
PSys2 worlds are event-driven: "Tom has 5 apples. Ana gives him 3. He eats 2. How many?" is answered by replaying the events in dialogue order. Version 0.4 has no notion of time (SPEC section 6).
1. **Sequence.** Every told wire has a sequence number (use `core.seq` when the wire carries it, else the tell order). Tests `before`, `after`, `latest` and `first` over it.
2. **Fluents.** A way to say in the matrix "this key of this type is a state that events change", for example
   ```
   @f core.fluent of=kids.arith.holding key=count by=owner by=item
   @e1 core.effect on=$give fluent=$f for.owner=?to   for.item=?i op=add amount=?n
   @e2 core.effect on=$give fluent=$f for.owner=?who  for.item=?i op=sub amount=?n
   ```
   (the syntax is yours to design; keep it wires). The current value of a fluent is derived by applying the effects in sequence order from the last explicit statement. An unknown start stays unknown (open world). An effect that would break a slot bound (`min=0`) is a `conflict` that names the event.
3. Retracting or replacing an event recomputes the fluent incrementally (your withdrawal machinery).
4. `world.at(seq)` or `ask(..., { at })`: the value as of an earlier point ("how many did he have before that?").
5. **Test:** the `kids.arith` cases of `psys2/cases/kids.arith.cases.jsonl` that are pure state replay (give, get, eat, lose, buy, break; unknown start; impossible event), using the wires given there.

### S3 — aggregates, arithmetic and literal kinds
1. Aggregates as `core.calc` over a pattern: `count`, `sum`, `min`, `max`, `argmax`, `argmin`, `collect` (list), with grouping by bound variables. Maintained incrementally, stratified like negation.
2. Functions: `mod`, `abs`, `round`, integer division; date and clock arithmetic for `time.*` (add minutes to a clock time, days between dates, weekday of a date, season after n) — look at what `psys2/worlds/kids.time/ops.mjs` computes and cover it (`psys2/cases/kids.time.cases.jsonl` has 217 cases).
3. Comparison and equality on typed literals (`5` equals `5.0`; `10:00` before `14:30`).

### S4 — abduction through calculations (the reviewer's failed probe)
In the shop matrix of section 1, `abduce('?x change amount=5')` returns `[]`: the backward step ignores `core.calc`, so "what must I pay to get 5 back?" has no answer.
1. Invert calcs during abduction: `add`, `sub`, `mul`, `div` are invertible when all but one argument is known; for other functions and for enumerable domains (`enum`, stepped ranges, reference types) try the candidates forwards.
2. An abducible **key** with a numeric slot and no enum can be solved for when one calc chain determines it.
3. Tests: the shop case (answer: paid = total + 5), a two-step chain, a non-invertible function with an enum domain, and a case with no solution (returns `[]` quickly, within the budget).

### S5 — questions, answers and the PSys2 envelope, natively
1. `world.query(questionWire)` takes a PSys2 `core.question` (`type`, `seek`, `where.<key>`, `about`, `mode`) and returns the PSys2 envelope: `{ status, value | values, from, assumptions, missing, alternatives, note, reason }` with the statuses of section 2. One value → `supported`; several distinct → `conflicting` with the alternatives; none → `missing` with the key's `ask`; `mode=exists` gives `no` only for a closed type, else `unknown`.
2. It writes a `core.answer` wire with `core.status`, `core.via`, `core.from` exactly as in spec 04, with provenance from `explain`.
3. `next()` / `step()` questions use the same `core.question` shape PSys2 uses (`type`, `seek`, `about`), so a missing required argument of a request becomes a question the PSys2 dialogue can ask and `answer()` can fill.
4. Operations as functions: a `core.operation` wire (`outputs=`, `inputs=`, `impl=`, `semantics=`) registers `fns[impl]` with the PSys2 signature `(ctx, args) => envelope`. Give the library a `ctx` with `find(type, where)`, `val(wire, key)`, `name(id)`, `tell`, `replace`, so an existing `ops.mjs` function can run unchanged against a `World` during migration. Query resolution order as in spec 04 (computed key → lookup → operation → missing).
5. `core.request action=… arg.…` runs an action operation inside one transaction: a refusal leaves the world unchanged and returns the envelope with `reason`.

### S6 — compute budgets everywhere (a PSys2 P0 principle)
PSys2 had browser freezes; the user's rule is that no loop may run unbounded.
1. One `budget` object per call (`{ steps, ms? }`, steps deterministic) passed through every loop: matching and joins, the chase, negation re-evaluation, completion lookahead, `suggest`, search (all solvers, the SAT solver), abduction, induction alignment, retraction, aggregates, `fromJSON` replay.
2. Out of budget is never an exception out of the library and never a hang: the call returns `{ ok: false, violations: [{ kind: 'budget', site, steps }] }` (or `status: 'unknown'` for solvers) and the world is unchanged.
3. `world.stats()` gives steps per site for the last call.
4. A test per site with a matrix built to explode (recursive rule, cross-product join, hard search): each returns within its budget. A static test that every `while` / `for(;;)` / recursion in `src/` ticks the budget or carries a `// bounded:` comment.
5. `fork()` and `trial()`: `trial` is the cheap what-if; make `fork()` structural (copy-on-write or snapshot) instead of replaying the log — PSys2 does a dry run on a fork for many candidate readings per message. Target: fork of a 2,000-wire world < 1 ms.

### S7 — pilot worlds (proof of value)
Rebuild three small PSys2 worlds **as matrices** in `examples/psys2/<world>/`: `kids.shop`, `kids.arith`, `kids.tasks`. If time allows, also `kids.time`, `kids.animals` and `kids.shapes`: their cases are there too.
- **Input:** the world's legend, knowledge base and operation declarations from `psys2/worlds/<world>/`, plus a `matrix.sop` you write (rules, fluents, aggregates, denies, defaults) and, only where really needed, a small `fns.mjs`. The existing `ops.mjs` is there to read what must be computed; the goal is to replace its logic, not to call it.
- **Runner** (`tools/psys2-pilot.mjs`): for each line of `psys2/cases/<world>.cases.jsonl`, in order (same `session` = same World), tell the non-answer wires of `wires` to the World, run `query` / the request for each question or request wire, and compare the status and the value (or values) with `psys2.answers`. Reply wording is not compared (that stays in PSys2 templates), except where the value is only in the note: then compare the facts the note states.
- **Report per world:** cases passed / total (147, 217, 232), lines of `matrix.sop` + `fns.mjs` against the lines of the `ops.mjs` it replaces (159, 237, 231), and ms per case.
- **Also show what the matrix gives that the JavaScript did not:** a missing argument asked as a question, a default withdrawn by a later statement, `retract` as undo, `explain` for an answer, one abduction ("what must I pay to get 5 lei back?").
- **Done when** each world passes ≥ 95% of its cases with the matrix at most half the size of the `ops.mjs` logic it replaces (reply wording excluded), and every failure is listed with its reason.

### S8 — documentation for the integrators
`docs/psys2.md`: how a PSys2 world directory maps to a `World` (legend, kb, operations, session wires), the fluent and aggregate syntax, the query envelope, the budgets, and a migration recipe for one world, with the pilot as the worked example. The PSys2 worker on the DGX will integrate from this document.

## 4. Order

S0, S1, S5 (items 1–3), S2, S3, S6, S4, S5 (items 4–5), S7, S8. S7 can start with `kids.shop` as soon as S1, S3 and S5.1–3 are in.

## Validated

(nothing yet)
