# Worker tasks for sopworld

Written by the reviewer session (Claude, also the reviewer of PSys2) at the user's request, 2026-11-10; rewritten at 14:45 after the user's correction.

**The user's direction: sopworld is a general, useful library for self-consistent worlds of SOP Lang wires. It must be *compatible* with the PSys2 worlds, but it is not built *for* them.** Nothing PSys2-specific goes into the core: no PSys2 type names, no PSys2 envelope, no PSys2 file layout. Every feature below must make sense for any user of the library (a scheduler, a digital twin, a tutoring system, a game) and be documented with a neutral example. PSys2 is the first demanding user: its needs show what is missing, and a small compatibility suite (`compat/psys2/`) proves that such a system can sit on the library through its public, general mechanisms.

## Where things stand (reviewer, 2026-11-10 15:15) — read this first

The reviewer's first two commits to this repository were a false start; ignore them. One list is valid: **G1–G9 below**. The earlier S1–S8 list and the `psys2/` directory no longer exist; only `compat/psys2/` does.

| Task | State |
| --- | --- |
| S0, G1, G2 | validated |
| G8 pilot (feeb300, 5f80fe7, ed4d9f6), G9 docs (09d310f) | **validated** (reviewer, 17:05): `npm test` 161 pass, 0 fail, 1 skipped; `node compat/psys2/run.mjs`: kids.shop 147/147, kids.arith 207/217, kids.tasks 231/232; `demo.mjs` shows the five demonstrations; no PSys2 name in `src/`; the runner has no per-world logic. The report is honest about the line counts and the tasks world (text handling stays code). Thank you: this is what was asked. |
| G7 budgets, stats, structural fork, one spelling of numbers (455f4a3); G5 abduction through calcs (3ef1b78) | **validated** (reviewer, 16:45): `npm test` 154 pass, 0 fail, 1 skipped; compat tests pass; no PSys2 name in `src/`. Reviewer probes: fork of a 2,000-wire world 0.007 ms and isolated; the shop abduction now answers `b1.paid=19` for "change of 5" (was `[]`); a self-feeding rule is refused in 2 ms. **Q11 answered:** your choice is right — the compiled cost is the figure that matters (reviewer run: cold 33 ms, best of ten 24 ms on a slower host). Close it; no further tuning. |
| G4 aggregates, arithmetic, time (823e3b3); Q8–Q10 applied (cb4f036) | **validated** (reviewer, 16:00): `npm test` 135 pass, 0 fail, 1 skipped; compat tests pass; no PSys2 name in `src/`. On your G4 note: keep pattern matching textual (`5` does not match `5.0`); instead normalise numeric literals **on tell** for slots whose kind is `integer` or `number` (store `5.0` as given but index its canonical form), so hosts never meet the difference. Do it in G7 with the index work, or say why not. |
| `core.check` rename (1b4541b), G6 queries (0d2cb6a), G3 sequence and fluents (5519782) | **validated** (reviewer, 15:50): `npm test` 123 pass, 0 fail, 1 skipped on sources and built file; `compat/psys2` schema and cases tests pass; `git grep -i psys2 src/` empty. |

**Answers to your open questions:**
- **Q8** (`refused` as a sixth status): keep it. "Cannot be" and "several values" are different things; the compatibility runner maps `refused` to PSys2's `conflicting`.
- **Q9** (`complete=true` decides `no` against `unknown`): accepted, and it is the right separation. In the PSys2 mapping read it from `closed`: PSys2 uses `closed=true` to mean "the world knows every instance".
- **Q10** (references to entities outside the session): accepted. The library keeps refusing a reference to a wire that does not exist. In PSys2 `e.user` is a built-in agent that every session has from the start, so the runner telling an `e.user` wire first is correct. The one `$e.tom` case: check whether the agent wire is created by an earlier turn of the same session in the cases file (PSys2 creates an agent wire on first mention, in the same turn); if the wire really is absent from `wires`, list the case as a failure with that reason and I will look at the dump.

**Do next, in this order, one commit each:**
**Round 3 (reviewer, 17:45).** The user sent an outside design review of the library (made at commit e9a6551, before G7 and G5) and asked the reviewer to judge it and organise the work. The reviewer checked each claim on the current code. The result is the order below, one commit each. Finish what you have in hand of G10–G14 first if a commit is nearly done; otherwise follow this order.

**A. Two defects the review found, reproduced by the reviewer on a7a8e16. Do these first.**

1. **H1 — a whole assignment is checked atomically; search must not reject on invalid prefixes.**
   - Repro:
     ```
     @s1 core.slot of=box key=a required=true enum=1
     @s2 core.slot of=box key=b required=true enum=1
     ?x box a=?v core.absent=b
     @d1 core.deny when=$x why="a without b"
     ?y box b=?v2 core.absent=a
     @d2 core.deny when=$y why="b without a"
     ```
     then `tell('@b1 box')`. `tell('@t box a=1 b=1', {dry:true})` is accepted, but `solveReport()` says **`unsat`** and `next()` reports both keys **dead**. The domains are filtered by trying each value alone, and a solution is verified by applying values one after another, so an intermediate state that a deny (with absence or negation) refuses kills a valid joint completion.
   - Fix:
     - a public `world.check(patch)` (a list of fills and wires applied together in one scratch transaction; returns ok, violations, support; always rolled back) and `world.applyPatch(patch)`;
     - the solvers' oracle verifies whole assignments with it;
     - single-value filtering is used only where it is sound (no deny or rule with negation / absence / selector reads the key), otherwise the value stays in the domain and the search decides;
     - `unsat` is reported only with a complete justification in the declared finite fragment; anything else is `unknown`;
     - `next()` and `suggest()` must not call a key dead on single-value trials in that situation.
   - Tests: the repro; a three-key variant; a random comparison against brute-force enumeration with `check` on small problems with absence-based denies.
2. **H2 — two declarations of one slot are a composition conflict, not "last one wins".**
   - Repro: `@k1 core.slot of=t key=color enum=red enum=blue` and `@k2 core.slot of=t key=color enum=blue enum=green` in one matrix are accepted, and then `red` is refused and `green` accepted: the second silently replaced the first.
   - Rule:
     - identical declarations are shared;
     - different declarations of the same type and key are refused with a `schema` violation naming both, unless one says how to combine: `combine=intersect` (enums and numeric bounds intersect; an empty result is itself a violation) or `combine=override` (explicit replacement, recorded).
     - A subtype redeclaring an inherited key is the existing "nearest wins" and stays.
     - The same for `core.schema.map` mappings and module loads.
     - Check that the PSys2 legends in `compat/psys2` still load (they should have no duplicates; if they do, list them in the log: they are real findings).

**B. The general follow-ups from the pilot (already given): G10 ties → `ambiguous`; G11 soft constraints; G12 calc failure reasons; G13 precision option; G14 fluent delta.** Then rerun the pilot and say which of the ten arith failures closed.

**C. What the user asked for next, and what the review rightly proposes.**

3. **H3 — certainty tiers and value-level provenance.** The user wants the world to know which of its data is solid and which is only guessed, because that is where attention must go.
   - Every value (wire, key, value) carries a **tier**: `told` > `derived` (from told only) > `forced` (the only value a closed domain left) > `default` > `guessed` (chosen by `complete({choose})`, a solver, or adopted abduction). A derived value takes the weakest tier among its inputs (propagated through rules, calcs, aggregates, fluents). Tiers are an ordered set a host may extend (declared as wires), with an optional numeric `cost`; they are ranks, not probabilities.
   - Provenance at value level: the justification of a value names the cells it came from (wire and key), the rule / calc / relation, and the tier; alternative justifications are kept (it already works for wires: keep that behaviour, extend it to values). Changing one input cell invalidates only what depends on that cell.
   - API: `world.tier(id, key)`, `world.assumptions()` (everything below `derived`, weakest first, with what depends on each), `query` results carry the tier and the weakest inputs, `explain` shows tiers, `next()` orders its questions by "weakest value with the most dependants first".
   - A told value always replaces a weaker one for the same key (the existing default revision, generalised to every tier below `told`), with the `revised` list.
4. **H4 — `world.describe()`.** A structured summary a host can turn into text, as plain data (no prose): per type the count and the instances; per instance the keys with value and tier; what is open; what is assumed; standing issues (soft violations); the last N changes with their cause. Options: `{ about: id | type, depth, since: seq }`. And `world.diff(a, b)` between two states or forks ("what changes if we choose B").
5. **H5 — relations that solve in more than one direction** (the review's first extension; G5 already inverts calcs inside abduction, this makes it a first-class, forward mechanism).
   - `core.relation` wires over cells of matched wires, linear in the first version: `sum` / `sub` with constant coefficients, written as wires (your syntax; it must be data), with exact rational arithmetic and unit checks.
   - Semantics (the review's table): after substituting known cells — no unknown and true: satisfied; no unknown and false: conflict naming the cells; **one** unknown with non-zero coefficient: the value is derived (tier = weakest input) if it fits the cell's kind and domain (an integer cell does not take 3/2: conflict); several unknowns: the relation is kept, nothing invented.
   - Propagation by a queue over the relations that use a changed cell, to a fixpoint or a conflict, inside the transaction and under the budget. Finite-domain relations may prune domains by support (table constraint); **this is local propagation, not a complete solver**: the search of H1 still decides (test: the x≠y, y≠z, z≠x triangle over {0,1} must come out `unsat` from search, not from propagation, and not `sat`).
   - A `core.calc` with an invertible function may be declared `relation=true` to get the same behaviour without rewriting matrices. `abduce` uses relations.
   - Tests from the review's prototype: paid − total − change = 0 solved for each of the three (198 cases), the chain x+y=10, y+z=8, z=3 → x=5, y=5; undetermined and conflict cases.
6. **H6 — declarative actions** (the concrete half of the review's second extension). An action declared as wires: parameters, a guard (conditions over cells and parameters), and **simultaneous writes** (every expression reads the state before the action), executed as one patch through `check` / `applyPatch`. It replaces registered JavaScript functions where the logic is "check and update values"; functions stay for everything else. A refused guard returns `refused` with the failing condition. Use it in the pilot where it fits (the shop purchase) and report the lines of `fns.mjs` or matrix it removes.

**D. Postponed, with the reviewer's reasons (do not start):**
- **Symbolic execution of actions and invariant proofs** (conservation and so on): coherent and feasible on top of H5 + H6, but no user of the library needs proofs over families of inputs yet. Revisit after H6 with one concrete use.
- **Bounded planning** (breadth-first over declared actions): after H6, when a host asks for it.
- **A persistent structure of contexts / scenarios:** `fork()` is structural since G7 (0.007 ms at 2,000 wires); scenarios are forks plus a list of assumptions (H3 gives that list).
- **E-graphs, general abstract interpretation, a probabilistic or causal engine, epistemic or deontic logic, general induction, holographic algorithms, VSA retrieval:** agreed with the review, not now; each lacks a concrete problem here.
- The review's point about abduction missing `paid=15` is **already fixed** by G5 (reviewer rerun: `p1.paid=15`), and its recursion worry (p→q, q→p after retracting the last outside premise) **already behaves correctly** (both gone).

**E. Housekeeping at the end of this round:** old HTML pages; version **0.5.0** and a tag, with a short changelog. The PSys2 worker pins that tag.

**Order:** H1, H2, G10–G14 (those not yet done), H3, H4, H5, H6, housekeeping + tag. Report the pilot numbers again after G10–G14 and after H6.

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
- G8 pilot and G9 docs (feeb300, 5f80fe7, ed4d9f6, 09d310f): reviewer rerun 161 pass / 0 fail / 1 skipped; pilot 147/147, 207/217, 231/232; five demonstrations run.
