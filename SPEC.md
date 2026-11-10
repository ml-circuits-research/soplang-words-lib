# sopworld: consistency matrices for SOP Lang circuits

Specification, version 0.4. Guides with worked use cases, a playground and a browser
self-test are in `docs/` (open `docs/index.html`).

## 1. Purpose

A **world** is a set of SOP Lang wires (a circuit) that stays consistent with a
**consistency matrix**: a second set of wires that says which circuits are possible, how
missing values are decided, and which states are forbidden. The matrix is written in SOP
Lang itself, as *pattern circuits*.

The world accepts wires from outside (a user turn, a sensor, another world), extends
itself with what follows logically, and refuses what its matrix does not allow. The same
structure supports:

| Operation | Question it answers | API |
| --- | --- | --- |
| Deduction | What follows from what is known? | `tell`, `fill` (automatic) |
| Completion | What is missing, and which values are still possible? | `open`, `suggest`, `next`, `complete` |
| Search | Is there a way to fill everything that is open? | `solve`, `solveReport`, `solveAsync`, `apply` |
| Abduction | What would have to be true for this to hold? | `abduce`, `adopt` |
| Induction | Which rule or slot explains these examples? | `induce`, `induceSlots` |
| Revision | What changes when a fact goes away or is replaced? | `retract`, `replace` |
| Explanation | Where does this wire or value come from? | `explain`, `history`, `on` |

## 2. Data model

### 2.1 Wire

```
@id type key=value key=value ...      a wire
?id type key=?x key=$other ...        a pattern wire (matched against fact wires)
```

- A wire may span several lines. `#` starts a comment.
- A key may repeat (several values).
- Values: **atom** (`water`, `10`, `10:00`), **string** (`"free text"`), **reference**
  (`$id`), **variable** (`?x`, only in the matrix and in queries).
- Facts and matrix wires have separate id spaces: a pattern `?m1` does not clash with a
  fact `@m1`. Within each space an id is declared once.
- A missing key is an open question, not a false statement (open world).

In memory: `{ id, type, attrs: { key: [values] }, pattern, meta }`. Values are kept as their
source token; `str()` unquotes a string.

### 2.2 The three layers

1. **Instance**: fact wires, indexed by id and by type. Append-only apart from filling
   open keys. `meta` holds provenance (`told`, `via`, `from`, `depth`, `fills`).
2. **Matrix**: slot, rule, deny, pattern and template wires.
3. **Compiled matrix**: rules indexed by the type of each of their patterns, slots by
   type and key, identity keys by type. Rebuilt when the matrix changes.

The engine also keeps a record of every rule firing: the wires it read (`from`), the
wires it created (`made`), the values it filled (`fills`) and the existing wires that
already satisfied a template (`hits`). Retraction and revision work from this record.

Facts are also indexed by `type|key|value`, and by the wires that refer to them. A pattern starts from the smallest set among
"all wires of its type" and "wires having a value the pattern already fixes", so joins do
not scan a whole type.

### 2.3 Log and history

- `world.log`: what was told, in order (`tell` and `fill` entries). It is the durable
  form of a world: `toJSON()` returns it and `World.fromJSON(data, options)` rebuilds the
  world from it (functions and the library are passed again). `fork()` does the same in memory.
- `world.history()`: every event (`tell`, `derive`, `fill`, `merge`, `remove`, `unfill`,
  `retract`, `revise`) with the rule that caused it (`via`) and the wires it came from.
- `world.on(listener)`: the listener receives the events of each committed change.
  Refused changes and dry runs emit nothing.

## 3. The matrix language

Ten wire types (`core.schema.map` and `core.namespace` are in section 3.9), plus any
foreign schema wires a `core.schema.map` declares. Everything else is a fact.

### 3.1 `core.slot`: one key of one type

```
@k core.slot of=meeting key=room
     required=true        # missing value = open question
     many=true            # several values allowed (default: one)
     id=true              # identity key (section 4.3)
     type=room            # value must refer to a wire of this type
     enum=10:00 enum=14:00  # allowed values
     min=1 max=6 step=1   # numeric bounds; with step the key can be enumerated
     default=30           # revisable assumption used by completion (section 4.5)
     ask="Which room?"    # the natural-language question of this key
```

### 3.2 `core.type`

`@t core.type of=meeting closed=true`: keys without a slot are refused (keys in the
`core.` namespace are always allowed).

### 3.3 `core.rule`: if the `when` circuit is there, the `then` circuit must be there

```
?b body mass=?m
?f force on=$b magnitude=?F
@a acceleration of=$b magnitude=?A
@c core.calc out=?A fn=div args=?F args=?m
@newton2 core.rule when=$b when=$f with=$c then=$a
```

- `when=` pattern wires, all must match (a join on shared variables and on `$` links
  between the patterns).
- `with=` `core.calc` wires, applied in order: `out=?var fn=name args=...`. If the
  function returns nothing the match is dropped.
- `if=` `core.test` wires: `fn=name args=...`, all must be true.
- `not=` pattern wires that must have no match (negation as failure). The matrix must be
  stratified: a rule may not negate a type that its own consequences can produce,
  directly or through other rules. A matrix that is not is refused. Negation is
  maintained: when a wire arrives that matches the negated pattern of an earlier firing,
  that firing and what it produced are withdrawn.
- `then=` template wires. A template that is already satisfied changes nothing; otherwise
  an existing wire is completed or a new wire is created (section 4.3). A template value
  whose variable is unbound is left out: the new wire has an open key.

Variables are local to a rule. Inside a rule, `$b` means "the wire matched by pattern
`?b`" or "the wire produced by template `@b`".

### 3.4 `core.deny`: a forbidden circuit

```
?ma meeting room=?r time=?t
?mb meeting room=?r time=?t
@t_other core.test fn=neq args=?ma args=?mb
@no_double_booking core.deny when=$ma when=$mb if=$t_other why="room already booked"
```

Same body as a rule (`when`, `with`, `if`, `not`), no `then`. Any match makes the pending
change invalid.

### 3.5 `core.abducible`

- `@ab core.abducible of=rain cost=2`: a whole wire of this type may be assumed.
- `@ab core.abducible of=patient key=condition`: a value for this open key of an
  existing wire may be assumed.

`cost` (default 1) says how reluctant the world is to make the assumption; explanations
are ranked by total cost.

### 3.6 Functions

Numbers may carry a unit suffix (`10N`, `2kg`, `9.81m/s2`, `95%`). `add sub min max`
need equal units and keep them; `mul div` combine them as text (`10N / 2kg = 5N/kg`,
`6m / 2m = 3`); comparisons accept equal units or a bare number on one side. When units
do not fit, the function is not applicable and the rule does not fire.

Code lives only in named functions, `(args: string[], world) => value | boolean`.
Built in: `add sub mul div min max concat` (calc) and `eq neq lt lte gt gte before`
(test; `before($a,$b)` compares the order in which two wires entered the world). More are
passed to `new World({ fns })`. Because rules stay declarative, a matrix can be
translated to Datalog, ASP or SMT for independent checking.

### 3.7 `core.use`: load another matrix

`@u core.use world=garden` loads the matrix registered under that name in
`new World({ library: { garden: text } })`, once. Every wire of the module gets the
module name as an id prefix (`garden.rain_wets`), so modules cannot clash. Types are not
prefixed: modules meet through shared types or through bridge rules. The `core.use` wire
is what the log records, so a snapshot stays small and follows the library.

### 3.8 Type inheritance

`core.type` may carry `extends=<parent>`. A wire of a type is also a wire of every type
its type extends:

- a pattern of type `T` matches wires of `T` and of its descendants, so rules, denies,
  queries and abduction goals written for a type apply to the types that extend it;
- keys (slots) are inherited, the nearest declaration winning; identity keys too;
- a key that refers to a type (`type=T`, `value=$T`) accepts wires of its descendants;
- `ofType(T)` includes descendants. Wires are indexed under their type and under each
  ancestor; when a change alters the hierarchy the indexes are rebuilt inside the same
  transaction, and restored if the change is refused;
- `closed=true` applies to the type that declares it; its keys are its own and the
  inherited ones.

### 3.9 Kinds, key names, and schemas in another notation

**Literal kinds.** A slot may say what kind of literal its values are, with one or more
`kind=` (alternatives): `integer`, `number` (no unit), `boolean`, `string`, `atom` (not
quoted), `quantity.<name>` (a number with an optional unit), `time.<name>` (any literal
in this version); a kind the library does not know accepts any literal. `type=` names
the type a reference must point to (descendants included); several are alternatives. A
slot with both accepts either. Kinds are checked on every `tell` and `fill`.

**Key names.** A key may be written short (`seats=`) or qualified with the wire's type or
one of its ancestors (`fleet.vehicle.seats=`): both are the same key, in facts, `fill`,
patterns and queries.

**Open namespaces.** Keys under `core.` are always allowed, also on closed types, and are
not validated unless a slot declares them. `@n core.namespace prefix=audit. open=true`
declares another such prefix (for bookkeeping keys such as provenance or sequence).

**A schema in another notation.** A system that already has schema wires loads them
unchanged by telling the world how to read them. `core.schema.map` is data, not code:

```
@m1 core.schema.map from=field                 # wires of type `field` declare a key
    owner=id.prefix key=id.suffix              # of the type and key named by their id
    value=is many=multi:yes required=must ask=prompt default=usually
@m2 core.schema.map from=class as=type name=id extends=parent closed=sealed:yes root=object
@m3 core.schema.map from=package as=module name=name imports=needs

@fleet.vehicle.seats field is=integer must=true prompt="How many seats?" audited=true
```

| Where a field is read from | Meaning |
| --- | --- |
| `id`, `id.prefix`, `id.suffix` | the wire id, the part up to its last dot, the part after it |
| `<attr>` | the attribute of that name (all its values where a list is expected) |
| `<attr>:<value>` | true when the attribute has that value |

- `as=slot` (default) fields: `owner`, `key`, `required`, `many`, `id`, `ask`, `default`,
  `enum`, `min`, `max`, `step`, `kind`, `type`, and `value` for an attribute that mixes
  literal kinds with `$type` references.
- `as=type` fields: `name`, `extends`, `closed`, and `root` (the parent of a type that
  names none). A map with `from=core.type` changes how native type wires are read.
- `as=module` fields: `name`, `imports`. Such a wire makes its text a module that names
  what it needs; each import found in the library is loaded once, **without** prefixing
  ids. An import that is neither loaded nor in the library is a `schema` violation.
- Attributes of schema wires that the engine does not use are kept and never refused.
  `world.schema(type)` returns the parent, the lineage, `closed`, the type wire's
  attributes, and the keys (own and inherited, marked) with every attribute of their wires.
- `core.type` without `of=` takes its wire id as the type name.
- `core.use world=<name> prefix=false` loads a library module whose ids are already
  qualified without prefixing them.
- Matrix wires of one `tell` are read before its facts, whatever their order in the text.

### 3.10 Order, sequence and parallelism

Wires with no `$` path between them are independent (parallel). Sequence comes from
references (a wire cannot refer to one that does not exist yet) or from a deny using
`before`. Mutual exclusion is a deny over the two wires.

## 4. Semantics

### 4.1 One change = one transaction

`tell(wires)` and `fill(id, key, value)`:

1. **Ingest**: classify each wire as matrix or fact; refuse duplicate ids and facts with
   variables; merge a fact into an existing wire with the same identity.
2. **Chase**: run rules to a fixpoint. Evaluation is delta-driven: only rules with a
   pattern of the type of a changed wire are tried, seeded with that wire. A firing is
   applied once per distinct binding. Rules with `not=` are re-evaluated in full when the
   rest is quiet.
3. **Validate**: slots of every touched wire (closed type, cardinality, enum, reference
   type, dangling references), then every deny.
4. **Commit or roll back**: with any violation the world is exactly as before, and the
   result lists the violations with the rule and the wires involved.

Result: `{ ok, added, derived, filled, merged, removed, violations, revised? }`.
`load(input)` is `tell` for set-up code: it throws when the world refuses.

Every violation that involves wires carries `support`: the told wires it rests on,
found by following provenance. A refusal can therefore be reported in terms of what
was said.

A deny without negation is checked only from the wires a change touched; denies with
negation are checked in full.

**Strict mode** (`new World({ strict: true })` or `{ strict: true }` per call) adds a
step after validation: if the open keys with a closed domain have no joint completion,
the change is refused with `dead-end`, `unsupported`.

Violation kinds: `deny`, `conflict`, `domain`, `cardinality`, `unknown-key`,
`dangling-ref`, `duplicate-id`, `syntax`, `schema`, `depth`, `budget`, `unknown-wire`,
`dead-end`, `unsupported`.

### 4.2 Termination

A rule that creates wires can feed itself. Each derived wire has a depth (1 + the
deepest wire it came from); beyond `maxDepth` (default 12) the change is refused. A
`maxSteps` budget bounds the number of firings.

### 4.3 Same wire or new wire

For a template instance, and for a told fact:

- If the type has identity keys and all are present: the wire with the same identity
  values is the same entity. Missing keys are filled. A different value on a single-valued
  key is a `conflict`. A told wire merged this way becomes an alias of the existing one.
- Otherwise (templates only): an existing wire that already contains every key/value of
  the instance satisfies it. If none does, a new wire is created with id
  `_<template>_<hash of the firing>`, stable across replays.

### 4.4 Completion

- `open(id?)`: required slots without a value.
- `suggest(id, key, { deep })`: candidates from the slot (`default`, `enum`, wires of
  `type`, stepped range), each tried in a scratch transaction. A candidate stays if the
  world accepts it and, with lookahead (the default), if the other open keys with a
  closed domain can still be completed together with it (section 4.9). A value that
  appears in a solution already found is not searched again.
  Order: the default first, then values most used for that key in the world.
- `next()`: for every open key, without changing anything:
  - one candidate in a closed domain: a **forced** fill;
  - a consistent default: a **default** fill (an assumption);
  - several candidates, or a free key: a `core.question` wire with `about=`, `seek=`,
    `option=`, `text=`;
  - no candidate in a closed domain: a **dead** key.
- `complete({ defaults, choose })`: commits forced fills one at a time and recomputes,
  so a fill can force the next. `defaults: true` commits defaults too. `choose: true`
  then commits one full solution for the keys that are still open, as assumptions.
  Fills are recorded with `via=core.complete` or `via=core.default`.
- `step(input, { defaults, choose })`: `tell` then `complete`, one call per dialogue
  turn or event. `answer(question, value)` fills the key a `core.question` wire asks for.
- `rank(items, { kind, world })`, a constructor option, may reorder suggestions
  (`kind: 'value'`) and explanations (`kind: 'explanation'`).
- `trial(fn)`: runs `fn(world)` and undoes everything it did; the general what-if.

This is the logical counterpart of next-token generation: given the current circuit, the
world produces the wires and values that must follow, and questions for the rest.

### 4.5 Defaults are assumptions

A value committed with `via=core.default` is weaker than anything told. When a `tell` or
`fill` is refused and default fills are involved (on a wire named by a violation, or on a
wire that one was derived from), the world withdraws those defaults together with
everything that followed from them, and tries the change again, all in one transaction. If it now succeeds the result
carries `revised: [{ id, key, value }]`, the keys are open again, and a `revise` event is
added to the history. If it still fails nothing changes. Values that were told or forced
are never revised this way.

### 4.6 Abduction

`abduce(goalPatterns, { maxDepth, max, maxAssumptions })`

1. Backward search. A goal pattern is satisfied by an existing fact; or by an existing
   wire of its type if some of its open keys had the right value (those keys must be
   abducible); or by a new assumed wire (its type must be abducible); or it is reduced to
   the `when` patterns of a rule that has a template of the same shape (up to `maxDepth`
   rule steps). An assumption made for one goal is reused by the next.
2. Each candidate is verified forwards in a scratch transaction: it must be accepted by
   the world and make the goal hold. This applies calcs, tests and denies, which the
   backward step ignores.
3. Only minimal candidates are returned, cheapest first:
   `[{ assume: [wires], fills: [{ id, key, value }], text, cost }]`. Both lists empty
   means the goal already holds. `adopt(world, explanation)` commits one.

### 4.7 Induction

`induce(examples, { name, kind, why, tolerant })` with `examples = [{ when, then }]` of
ground wires returns `{ text, skipped, calcs, variables, examples }`.

- The rule is the least general generalisation of the examples. Wires are aligned by
  type (all alignments are tried, the one needing fewest variables wins). Equal values
  stay constant, references inside an example stay links between patterns, and each
  distinct pair of differing values becomes one variable, which recovers co-reference.
  Keys not present in every example are dropped.
- A variable of the conclusion that no premise binds is tested against `add`, `sub`,
  `mul` and `div` of two numeric premise variables. If one explains every example it is
  written as a `core.calc`. Otherwise the key stays open in derived wires.
- `kind: 'deny'` generalises examples of forbidden states (only `when`) into a `core.deny`.
- `tolerant: true` skips examples whose shape differs from the first and lists them.
- Telling the text to a world validates it there: a rule whose consequences hit a deny
  is refused.

`induceRule(examples, options)` returns the text only. `induceSlots(wires)` proposes
slots per type and key: `required` if present in every wire, `many` if ever repeated,
`type` if all values refer to one type, `enum` for a small set of repeated atoms.

### 4.8 Retraction and replacement

`retract(id)` removes a told wire. In one transaction:

1. The wire is removed. Every firing that read it is undone: wires it made are removed,
   values it filled are taken back, recursively. Firings that only wrote to a removed or
   changed wire are forgotten so that they can fire again.
2. The inputs of every undone or forgotten firing go back on the agenda and the chase
   runs, which derives again whatever still has support.
3. Told wires left with a dangling reference are removed the same way, until none is left.
4. The result is validated. If a deny now matches (possible with negation), or a derived
   wire is left dangling, the retraction is refused and nothing changes.
5. The log is rewritten without the removed told wires.

The result lists every wire that no longer exists in `removed`. Only told wires can be
retracted. The incremental result is tested against a rebuild from the log on five worlds.
One case still uses the rebuild: a derived wire that absorbed a told wire of the same
identity.

`replace(id, input)` swaps a told wire for new wires in one transaction; if anything is
refused nothing changes. Told wires that refer to the old wire stay when a new wire
takes its id, and go with it otherwise. With an identity slot this is how a state
changes over time.

### 4.9 Search and solver strategies

Filling many open keys at once is stated as a finite-domain problem (`new Problem(world)`):

- **variables**: one per open key with a closed domain; the domain holds the values the
  world accepts one at a time;
- **nogoods**: sets of values ruled out by a deny. All candidate values are put on their
  wires at once, each deny without negation is matched once from those wires, and every
  match names the values it used. Capped at 200,000;
- **oracle**: `push(index, value)` / `pop()` apply one value on top of the others, and
  `verify(values)` checks a whole assignment in a scratch transaction. A refusal returns
  the variables whose wires are in the provenance closure of the violation. With negation
  in the matrix all assigned variables are returned, because a violation may then depend
  on what is absent.

A solver is `{ name, solve(problem, { preset, budget }) }` returning
`{ status: 'sat' | 'unsat' | 'unknown', assignment, stats }`. It is given to the world
(`new World({ solver })`) or to one call (`solveReport({ solver })`).

| Solver | Works by |
| --- | --- |
| `solvers.cdcl()` (default) | Nogoods and exactly-one-value clauses for the built-in SAT solver `Sat` (two watched literals, first-UIP learning with minimisation, activity order, phase saving, Luby restarts, learnt-clause reduction). Each model is verified by the oracle; a refusal becomes a clause |
| `solvers.backtrack()` | Depth-first, smallest live domain first, every step checked by the oracle |
| `solvers.external({ run })` | `run(data)` gets `{ variables, nogoods, preset }` and returns one value per variable or `null`. Answers are verified; a refused answer is added as a nogood and the solver is asked again |
| `solvers.dimacs({ exec })`, `solvers.clingo({ exec })` | `external` with a DIMACS CNF or answer-set encoding (`toDimacs`, `toASP`); `exec(text)` returns the solver's output |

- An answer is returned only after the world has verified it, whatever the solver.
- `exec` or `run` may return a promise; use `await world.solveAsync({ solver })` then.
- `solve()` returns the assignment or `null`; `satisfiable()` is false only for `unsat`.
  `apply(assignment)` commits an assignment in one transaction.
- `node/solvers.mjs` starts clingo or a SAT solver as a process (`clingoProcess`,
  `dimacsProcess`). It is the only Node-specific code and is not part of the single file.
- With negation in the matrix, a partial completion that is refused is abandoned even if
  a later value would have repaired it.

## 5. Composition of worlds

- A micro-world is a matrix, usually with a type prefix (`phys.mech.*`), stored in a library.
- A world loads the ones it needs with `core.use` (section 3.7). After loading there is
  one matrix, so deduction, completion, abduction and retraction cross module borders.
- Modules interact through shared types or through **bridge rules** (`when` in one
  module's types, `then` in another's).
- An instance of a micro-world is an ordinary wire, so it can be the value of a key in a
  larger world.

## 6. Limits of version 0.4

- Matching is indexed and delta-seeded but does not cache partial matches (no Rete network).
- Only deny constraints are grounded for the solvers. A conflict that arises through a
  rule is found when the world verifies an answer, one refusal at a time.
- Search covers keys with a closed domain. Free keys become questions.
- With negation, completion is incomplete in the sense of section 4.9.
- Ranking is symbolic: usage counts, declared costs, or the caller's `rank` function.
- Induction is exact generalisation: it skips examples of a different shape and uses
  negative examples to add comparisons, but does not handle noise or learn negation.
- There is no built-in notion of time or context.
- `fork` and `fromJSON` replay the log.
- The build does not minify (about 110 kB, 31 kB gzipped).

## 7. Architecture

| Module | Responsibility |
| --- | --- |
| `parser.mjs` | Text to wires and back |
| `unify.mjs` | Terms and unification |
| `matrix.mjs` | Compiles matrix wires into slots, rules and denies; checks stratification; prefixes modules |
| `world.mjs` | Kernel: store and indexes, transactions, ingest, matching, chase, validation, withdrawal |
| `complete.mjs` | Open keys, suggestions, questions, `step` and `answer` |
| `solve.mjs` | The completion problem in neutral form, the SAT solver, the solver strategies |
| `revise.mjs` | `retract`, `replace`, revision of default assumptions |
| `abduce.mjs`, `induce.mjs` | Abduction and induction, built on the public kernel operations |
| `builtins.mjs` | Calc and test functions, quantities with units |
| `bin/sopworld.mjs` | `check`, `run`, `ask` on `.sop` files |
| `node/solvers.mjs` | Starts outside solvers as processes (Node only) |
| `tools/build.mjs` | Bundles `src/` into `docs/sopworld.mjs` and `docs/sopworld.js` |

### Build and platforms

`npm run build` writes the library as one file, with no dependency at build time or at
run time. Each source module becomes one function scope; the bundler accepts exactly the
import and export forms used in `src/` and refuses Node-only APIs.

| File | For |
| --- | --- |
| `docs/sopworld.mjs` | ES module: browsers (`<script type="module">`) and Node |
| `docs/sopworld.js` | Classic script (global `sopworld`) and CommonJS (`require`) |
| `docs/sopworld.d.ts` | Type declarations |

`npm test` runs the suite on the sources and again on `docs/sopworld.mjs`.
`npm run test:browser` runs `docs/selftest.html` and the playground in headless Chrome.
`docs/` is self-contained and can be served as it is (GitHub Pages).

Invariants the tests rely on:

- A refused change leaves the world byte-for-byte as it was (journal of undo steps).
- Everything speculative (dry run, suggestion, search, abduction check) is the ordinary
  change operation inside a transaction that is rolled back.
- Derived wire ids are a hash of the rule and its bindings, so re-derivation gives the
  same id.
- The log alone rebuilds the world.
- `world.stamp` identifies the state: it changes with every mutation and is restored by
  a rollback, so anything computed for a state (the completion problem) can be cached.
- No solver answer is used before the world has verified it.

## 8. API summary

```js
import { World, solvers, parse, format, str, quote, induce, induceSlots, adopt,
         Problem, Sat, toDimacs, toASP, quantity, version } from './docs/sopworld.mjs';

const w = new World({ fns, library, solver, maxDepth, maxSteps, lookahead, strict, searchBudget, rank });
w.tell(textOrWires, { dry, strict })   w.load(textOrWires)   w.use(name)
w.fill(id, key, value, { dry, strict })
w.retract(id)   w.replace(id, textOrWires)   w.fork()   w.trial(fn)
w.step(textOrWires, { defaults, choose, strict })   w.answer(questionWire, value)
w.get(id)  w.has(id)  w.ofType(type)
w.ask(patternText)   w.holds(patternText)
w.open(id?)  w.suggest(id, key, { deep })  w.next()  w.complete({ defaults, choose })
w.solve()  w.solveReport({ solver, budget })  await w.solveAsync({ solver })
w.satisfiable()  w.apply(assignment)
w.abduce(goalText, { maxDepth, max, maxAssumptions })
w.explain(id)  w.history()  w.on(listener)
w.toSOP({ schema, derived, provenance })   w.toJSON()   World.fromJSON(data, options)
```
