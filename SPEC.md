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

**One key, declared twice.** Two matrices may both declare the same key of the same
type (two modules, a schema and a refinement of it). Equal declarations are one
declaration. Different ones are refused with a `schema` violation that names both
wires, unless one of them says how they combine:

- `combine=intersect`: what both allow. Enums, kinds and reference types intersect, the
  tighter `min` and `max` hold, `required` and `id` hold if either says so, `many` only
  if both do. A combination that allows no value is itself refused.
- `combine=override`: that declaration replaces the other.

`world.schema(type).keys[key].combined` records `{ how, from: [wire ids] }`. A subtype
that declares an inherited key again is not a conflict: the nearest declaration holds
(3.8). The same rule covers a type declared twice with different parents, two
`core.schema.map` wires for one wire type, and a module named twice with different
imports.

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
- `if=` `core.check` wires: `fn=name args=...`, all must be true.
- `not=` pattern wires that must have no match (negation as failure). The matrix must be
  stratified: a rule may not negate (or aggregate over) a type that its own consequences
  can produce, directly or through other rules. A matrix that is not is refused. A
  template with `core.on=` (below) adds keys to a wire that is already there, so it
  counts only against patterns that name one of those keys. Negation is
  maintained: when a wire arrives that matches the negated pattern of an earlier firing,
  that firing and what it produced are withdrawn.
- `then=` template wires. A template that is already satisfied changes nothing; otherwise
  an existing wire is completed or a new wire is created (section 4.3). A template value
  whose variable is unbound is left out: the new wire has an open key.
- A template with `core.on=$<pattern>` does not describe a wire of its own: its keys are
  added to the wire that `when=` pattern matched (`@f line core.on=$l total=?t`). Use it
  for "compute a key of the thing itself"; two wires that look alike each get their own
  value, and no search for a similar wire is made.

Variables are local to a rule. Inside a rule, `$b` means "the wire matched by pattern
`?b`" or "the wire produced by template `@b`".

### 3.4 `core.deny`: a forbidden circuit

```
?ma meeting room=?r time=?t
?mb meeting room=?r time=?t
@t_other core.check fn=neq args=?ma args=?mb
@no_double_booking core.deny when=$ma when=$mb if=$t_other why="room already booked"
```

Same body as a rule (`when`, `with`, `if`, `not`), no `then`. Any match makes the pending
change invalid.

**Soft constraints.** A deny, or a slot with `min` / `max`, may say `soft=true`. Then
nothing is refused: the change is accepted and the problem is kept as a standing wire,

```
@issue... core.issue rule=$<the deny or slot> about=$<each wire involved> why="..."
```

which is there exactly as long as the problem is (it is a derived wire: retract the
cause and it goes). A query whose answer rests on a wire that an issue is about answers
`conflicting`, with `reason`, `issues` and the value under `alternatives` (4.10). Rules
may read issue wires like any others. Use it where what was said must be kept even
when it cannot be right (a dialogue, a sensor log); strict is the default.

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

### 3.6.1 More functions, and comparison by value

| Function | Meaning |
| --- | --- |
| `abs(x)`, `round(x)`, `round(x, digits)` | keep the unit |
| `mod(a, b)` | remainder with the sign of `b`, the unit of `a` |
| `idiv(a, b)` | the whole part of `a / b` |
| `time_add(t, d)` | a clock time plus a duration (`10:40 + 35min = 11:15`, wraps at midnight), or a date plus days (`2026-01-30 + 3d = 2026-02-02`). A bare number is minutes for a clock, days for a date |
| `time_diff(a, b)` | minutes between two clock times, days between two dates |
| `weekday(date)` | `monday` ... `sunday` |

Durations take the units `s`, `min`, `h`, `d`, `w`. Clock times are `H:MM`, `HH:MM` or
`HH:MM:SS`; dates are `YYYY-MM-DD` and must be real dates.

`eq`, `neq`, `lt`, `lte`, `gt`, `gte` compare by value when both sides are numbers with
compatible units, clock times, or dates: `5` equals `5.0`, `9:05` is before `10:00`.
Otherwise they compare as text. Pattern matching itself stays textual: a pattern value
`5` does not match a wire value `5.0`.

Kinds for time: `time.clock`, `time.date`, `time.datetime` (ISO 8601) and
`time.duration` are checked; any other `time.<name>` accepts any literal.

**When a function cannot answer.** A function that has no result returns nothing and
the rule does not fire. It may first say why: the built-in arithmetic does for a
division by zero and for units that differ, and a host function can with
`world.cannot(reason)` (the world is the second argument of every function). A query
that finds no value for that reason answers `unsupported` with the `reason`, where
`missing` would mean "nobody said".

**Precision.** Derived numbers keep 12 significant digits. `new World({ decimals: 2 })`,
or a wire `@p core.precision decimals=2` in the matrix, rounds every number a calc,
an aggregate or an effect produces to that many decimals (whole numbers stay whole,
`2.50` is written `2.5`). Told values are never rewritten.

### 3.6.2 Aggregates

A `core.calc` with `over=` computes over every match of one or more patterns, under the
bindings of the rule's own patterns. Those shared bindings are the group.

```
?o order customer=?c
?l line of=$o item=?item amount=?a
@c_n     core.calc out=?n     fn=count   over=$l
@c_total core.calc out=?total fn=sum     over=$l args=?a
@c_which core.calc out=?which fn=argmax  over=$l args=?a pick=?item
@c_all   core.calc out=?all   fn=collect over=$l args=?item
@s summary of=$o lines=?n total=?total largest_item=?which items=?all
@summarise core.rule when=$o with=$c_n with=$c_total with=$c_which with=$c_all then=$s
```

| `fn` | Result | With no match |
| --- | --- | --- |
| `count` | number of matches | `0` |
| `sum` | sum of `args` (units must agree) | `0` |
| `min`, `max` | smallest, largest `args` (numbers, clock times, dates, else text) | not applicable |
| `argmin`, `argmax` | `pick=` at the smallest, largest `args`; without `pick`, a reference to the matched wire | not applicable |
| `collect` | the distinct values of `args`, in sequence order; a template key bound to it gets them all | not applicable |

"Not applicable" means the rule does not fire for that group.

- Aggregates are kept up to date: when a wire of an aggregated pattern arrives, changes
  or leaves, the groups it belongs to are evaluated again, the firings whose result
  changed are withdrawn and the new ones applied. Other groups are not touched.
- A deny may use aggregates ("the order exceeds the customer's limit"); it is checked
  for the groups that changed, also when a wire leaves a group.
- Stratified like negation: a rule may not aggregate over a type its own consequences
  can produce; such a matrix is refused.

**Ties.** When several wires share the best value, `argmax` and `argmin` still put one
pick on the wire (the first in sequence order), and remember the others: a query for
that key answers `ambiguous` with all of them as alternatives (4.10), and stops doing
so when the tie is broken. `ties=first` on the calc turns this off: the first is simply
the answer.

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
in this version), `any` (any literal or reference); a kind the library does not know
accepts any literal. `type=` names
the type a reference must point to (descendants included); several are alternatives. A
slot with both accepts either. Kinds are checked on every `tell` and `fill`.

**One value, several spellings.** Under a key whose every kind is `integer` or `number`,
`5`, `5.0` and `05` are the same value. The wire keeps the text it was told; the indexes
hold one canonical spelling (no sign on zero, no leading zeros, no trailing zeros after
the point; the digits are kept, nothing is rounded). So a pattern `price=5` finds a wire
with `price=5.0` and the other way round, a join through a variable pairs them, an
identity key recognises them as one wire, and telling the other spelling is neither a
second value nor a conflict. A variable is bound to the text of the wire it was read
from. Keys without such a kind are text: `label=1.0` is not `label=1`. Declaring the
kind later re-indexes the wires that are already there.

**Key names.** A key may be written short (`seats=`) or qualified with the wire's type or
one of its ancestors (`fleet.vehicle.seats=`): both are the same key, in facts, `fill`,
patterns and queries.

**Open namespaces.** Keys under `core.` are always allowed, also on closed types, and are
not validated unless a slot declares them. `@n core.namespace prefix=audit. open=true`
declares another such prefix (for bookkeeping keys such as provenance or sequence). A
key of an open namespace that no slot declares has no cardinality: when a wire is told
again (same identity keys), the bookkeeping of each statement is kept side by side
instead of being a conflict.

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
- A reference under a key of an open namespace that no slot declares may point outside
  the world (a source, a pattern): it is not checked and does not tie the wire to the
  one it mentions when that one is retracted.
- Attributes of schema wires that the engine does not use are kept and never refused.
  `world.schema(type)` returns the parent, the lineage, `closed`, the type wire's
  attributes, and the keys (own and inherited, marked) with every attribute of their wires.
- `core.type` without `of=` takes its wire id as the type name.
- `core.use world=<name> prefix=false` loads a library module whose ids are already
  qualified without prefixing them.
- Matrix wires of one `tell` are read before its facts, whatever their order in the text.

### 3.10 Order, sequence and parallelism

Wires with no `$` path between them are independent (parallel). A wire cannot refer to
one that does not exist, so references give an order of construction. Mutual exclusion
is a deny over the two wires.

**Sequence.** Every wire also has a place in a sequence. By default it is the order of
arrival. `@s core.sequence key=<key>` declares a key that carries the place: a wire that
has it is ordered by that number whatever the order it was told in; a wire that does not
takes the place of the last one that had. Ties are broken by arrival. A wire told again
(same identity) moves the sequence on to the place it declares. If the key is declared
after wires have arrived, they are given their places again, in order of arrival.

- `world.seqOf(id)` and `world.compare(a, b)` read it.
- The checks `before` and `after` compare two wires: `core.check fn=after args=$b args=$a`.
- A pattern with `core.absent=<key>` matches only a wire that has no value for that key
  (`?t task core.absent=owner`), in rules, denies and `ask`. What a rule concluded from
  it is withdrawn when the key is filled. A rule may not fill a key that it requires to
  be absent; such a matrix is refused.
- A pattern with `core.select=latest` (or `first`) matches one wire: the latest (first)
  in sequence among those that fit the bindings made by the patterns before it. A rule or
  deny that uses a selector is re-evaluated in full when the rest is quiet, and a firing
  whose selected wire has been overtaken is withdrawn.

### 3.11 State over time: fluents and effects

```
@f_balance core.fluent of=account key=balance
@e_in    core.effect on=deposit    fluent=$f_balance op=add amount=amount where.name=account
@e_out   core.effect on=withdrawal fluent=$f_balance op=sub amount=amount where.name=account
@e_audit core.effect on=audit      fluent=$f_balance op=set amount=found  where.name=account
```

- `core.fluent of=<type> key=<key>` declares the key as a state that events change.
- `core.effect on=<event type> fluent=$<fluent> op=<op> ...` says how. `op` is `add`,
  `sub`, `set`, or a registered function called with `[current, amount]`. The amount is
  read from the event's key named by `amount=`, or is the literal given by `value=`.
  The wire whose state changes is the one the event's key refers to (`for=<event key>`),
  or the one whose keys equal the event's (`where.<holder key>=<event key>`, one or more).
- The value on the wire is always the current one: the last explicit statement, then
  the effects of the later events, in sequence order. Events before the last statement
  are behind it. Without any statement the value stays unknown, whatever the events.
- A statement is a value told with the wire, or told later with `fill` (or by telling
  the same entity again): for a fluent key that is a new statement at the current point,
  not a conflict.
- `delta=<key>` on the fluent names a second key that holds the known change since the
  last statement: what the `add` and `sub` effects since then amount to. It is there
  even when the start is unknown and the state itself therefore is too ("5 came in, 2
  went out: the stock is unknown, the change is 3"), and it starts again at each
  statement. It is a filled value like any other, with the events as `from`.
- An effect that would take the value outside the slot's `min` or `max` is a `conflict`
  that names the event (`event`, `wires`, `why`); the change is refused.
- The computed value is an ordinary filled value with `via` the fluent and `from` the
  events that changed it since it was last set (an event that changes nothing is not
  listed), so rules, denies, queries and `explain` use it like any other key. When it
  changes, what was derived from the old value is withdrawn and derived again.
- Retracting or replacing an event recomputes the states it touched. A new event that
  comes last in sequence is applied to the current value directly; anything else replays
  the line of that one wire. Both paths give the same value and provenance (tested).

### 3.12 As-of

`world.asOf(at, fn)` runs `fn(world)` against the world as it was at a point of the
sequence: wires told after it, statements made after it and everything that rested on
them are set aside inside a scratch transaction, then restored. `ask(pattern, { at })`
and `query(question, { at })` are shorthands. `at` is a number of the declared sequence
key, or an arrival number as returned by `seqOf`.

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
`maxSteps` budget bounds the number of firings of one change, and every call runs under
a step budget (4.11), so no matrix can make a call hang.

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

A default belongs to the slot, whether the key is required or not. `complete({ defaults:
true })` and `step()` apply it to every wire of the type that has no value for the key:
a required key would otherwise be a question, an optional one would otherwise stay
empty and the rules that read it would not fire. `tell` alone never applies a default.

### 4.6 Abduction

`abduce(goalPatterns, { maxDepth, max, maxAssumptions })`

1. Backward search. A goal pattern is satisfied by an existing fact; or by an existing
   wire of its type if some of its open keys had the right value (those keys must be
   abducible); or by a new assumed wire (its type must be abducible); or it is reduced to
   the `when` patterns of a rule that has a template of the same shape (up to `maxDepth`
   rule steps). An assumption made for one goal is reused by the next.
   The calcs of each rule gone through are kept as equations. When the search is
   through they are solved for what is still unknown: forwards when every argument is
   known, backwards for `add`, `sub`, `mul` and `div` when exactly one argument is
   missing (in any place, over any number of arguments, along a chain of rules). So an
   abducible key needs no `enum` when a chain of calcs determines its value: with
   "change = paid − total", a total of 15 and the goal `change amount=5`, the answer is
   `paid=20`. A value that nothing determines is tried from its slot's `enum` or
   `min`/`max`/`step` range, which is also how a function without an inverse is
   handled. The same holds for the keys of an assumed wire; a key still unknown at the
   end is left out of it.
2. Each candidate is verified forwards in a scratch transaction: it must be accepted by
   the world and make the goal hold. This applies checks and denies, which the
   backward step ignores, and the calcs once more, forwards.
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

### 4.9.1 Patches: several changes judged together

Some values are only valid together: with "a needs b" and "b needs a", each alone is
refused and the pair is fine. A **patch** is a set of changes that is judged as a whole:
`{ wires, fills: [{ id, key, value }] }`, or just the list of fills (the shape of an
assignment from `solve()`).

- `world.check(patch)` applies it in one scratch transaction, runs the rules once,
  validates once, and undoes everything. It returns what `tell` returns (`ok`,
  `violations` with their `support`). No state in between is judged.
- `world.applyPatch(patch)` does the same and keeps the result: all of it, or nothing.
  In the log the parts of a patch stay together, so a restored world applies them
  together again. `apply(assignment)` is `applyPatch` for a solver's answer.

Search uses it. A whole assignment is verified as one patch. Trying one value on its own
(to trim a domain, to call a key dead) is a sound test only when nothing in the matrix
reads what is absent; when a rule or a deny uses `not=`, `core.absent=`, a selector or
an aggregate, or a key is a state, no value is dropped on its own evidence: the domain
stays whole and the search decides. Then:

- `sat` means the world accepted that whole assignment;
- `unsat` means every assignment of the open keys with a closed domain was ruled out
  (by a grounded deny, or by the world refusing it);
- if some required key has no closed domain (only an outside answer can fill it) and
  absence matters, a refusal of every assignment proves nothing: the status is
  `unknown`, with a `reason`;
- `next()` and `suggest()` call a key dead, or drop a value, only on that same evidence.
  Forced values that depend on each other are committed together.

### 4.10 Queries with a status, answers as wires, producers and actions

`world.query(question, { record, suppose })` answers "what is the value of key K of the
thing that meets these constraints". The question is an object
`{ type, seek, where: { key: value }, about, mode }`, a question wire of the same shape
(`@q core.question type=item seek=stock where.name=bolt`, or the `about=` / `seek=` wires
that `next()` produces), the id of such a wire, or its text. It changes nothing.

| Status | When | Carries |
| --- | --- | --- |
| `supported` | exactly one value (or `mode=list`, `count`, a positive `exists`) | `value` or `values`, `from`, `via` |
| `conflicting` | several distinct values | `alternatives: [{ value, from }]` |
| `ambiguous` | the value was picked by `argmax` or `argmin` among several equally good | `alternatives: [{ value }]` |
| `unsupported` | a rule would answer, but one of its calculations cannot be done | `reason` |
| `missing` | no value | `missing: [{ id?, type, key, ask }]`: the open key and its question |
| `refused` | the thing asked about cannot exist | `violations`, as from `tell` |
| `no` / `unknown` | `mode=exists` finds nothing: `no` if the type is declared `complete=true`, else `unknown` | |

How a value is found, in this order:

1. **Lookup.** The wire named by `about`, or the wires of `type` (descendants included)
   that meet `where`. `from` lists the wires holding the value and, for a value a rule
   filled, the wires it was derived from; `via` names the rule.
2. **Supposition.** If no wire matches and the constraints are all values, a wire of
   that type with those keys is told in a scratch transaction; the rules run; the value
   is read from it or from a wire derived from it; everything is undone. A violation
   gives `refused`. `{ suppose: false }` turns this off.
3. **Producers.** `@p core.producer of=<type> key=<key> fn=<name>` declares a registered
   function that can compute the key: `fn({ world, wire, type, key, where, find, val, vals })`
   returns a value, a list, or nothing. Tried for wires that lack the key, and when
   nothing matched.
4. Otherwise `missing`.

`mode`: `value` (default), `list` (all distinct values), `count` (matching wires, or
those that have `seek`), `exists`.

`{ record: true }` writes the answer as a wire, and the question too when it was not one
already: `@a12 core.answer to=$q1 status=supported value=40 core.from=$i1 core.via=$rule`.

**Actions.** `@a core.action name=<name> fn=<fn> required=<arg> ask.<arg>="..."` declares
a registered function as an action. `world.act({ action, args })`, or a request wire
(`@r core.request action=take arg.item=bolt arg.count=5`), runs it inside one
transaction with a context that offers `find`, `val`, `tell`, `fill`, `replace`,
`retract`. Results: `{ ok: true, status: 'done', value }`; `missing` with the required
arguments that were not given and their questions; `refused` with the violations when a
change is refused or the function returns `{ ok: false, why }`; `error` when it throws;
`unsupported` for an unknown action. In every case but `done` the world is unchanged.

**Vocabulary.** The wire types and key names used here are defaults that a host can
replace: `new World({ vocabulary: { question, answer, request, type, seek, about, mode,
where, action, arg, to, value, status, via, from } })`.

**Prefix slots.** `core.slot of=<type> key=where prefix=true` declares every key
`where.<anything>` at once, so that question and request wires can belong to a closed type.

### 4.11 Budgets, and forks that cost nothing

**Budget.** Every public call runs under a budget of steps: `{ steps, ms }`, by default
`{ steps: 5000000 }`, set for a world with `new World({ budget })` and for one call with
the `budget` option (`solveReport`, `solve` and `satisfiable` call it `limit`, because
`budget` there is the solver's own search budget). A step is one turn of a loop whose
length depends on the data. Each loop belongs to a site:

| site | one step is |
|---|---|
| `match` | a candidate wire tried against a pattern |
| `chase` | a wire taken from the agenda, or a rule firing applied |
| `negation` | a rule with `not=`, a selector or an aggregate evaluated again |
| `aggregate` | a match fed to an aggregate |
| `fluent` | an event applied to a state |
| `withdraw` | a wire, value or firing taken back |
| `validate` | a wire checked against its slots and the denies |
| `complete` | a candidate value tried by `suggest`, `next` or `complete` |
| `ground` | a deny match turned into a nogood for the solvers |
| `solve` | a search step of a solver |
| `abduce` | a goal expanded, or an explanation verified |
| `induce` | an alignment of two examples tried |

The outermost call owns the budget; what it calls inside shares it. When the budget runs
out the call stops, everything it did is undone, and the caller gets the normal shape of
that call's result saying so. It never throws and never leaves a half-applied change:

| call | out of budget |
|---|---|
| `tell`, `fill`, `retract`, `replace`, `apply`, `step`, `use`, `answer` | `{ ok: false, violations: [{ kind: 'budget', site, steps, why }] }` |
| `load` | throws, as for any refused load |
| `ask`, `suggest`, `abduce` | an empty array with a `budget` property |
| `holds` | `false` |
| `next`, `complete` | empty lists and a `budget` property |
| `solveReport`, `solveAsync` | `{ status: 'unknown', stats: { budget } }` (`solve` returns `[]`, `satisfiable` returns `true`) |
| `query` | `{ status: 'budget', site, steps, why }` |
| `act` | `{ ok: false, status: 'budget', violations: [...] }` |
| `trial`, `asOf` | `undefined` |
| `induce` (a function, with its own budget of 200,000 alignments) | `{ text: null, budget }` |

Steps are counted, not timed: the same call on the same world stops at the same place
on any machine. `ms` adds a wall-clock limit for hosts that need one; it is looked at
every 1,024 steps. `world.stats()` returns the count of the last call:
`{ steps, limit, exhausted, site, sites: { match, chase, ... }, ms }`.

Loops whose length does not depend on the data in a way that can grow (the keys of one
wire, the journal of the call being undone, the trail of the SAT solver) do not tick;
each carries a `// bounded: <reason>` comment, and a test reads `src/` and fails on a
`while`, a `for (;;)` or a recursive function that has neither a tick nor that comment.

**Fork.** `fork()` returns a world that shares the whole state of the original and
copies nothing. The copy is made by whichever of the two changes first, at its first
change that is meant to stay (a `dry` tell, a `trial`, `suggest` and the searches do not
count). A fork therefore costs the same for a world of ten wires or ten thousand; the
first write pays for one copy of the indexes (not a replay of the log: no rule fires
again), and later writes cost what they always do. A world cannot know that a fork
of it was thrown away, so after a fork the original also pays for one copy at its next
write, unless the fork has written (and so left) before.

### 4.12 Certainty: what is solid and what is only assumed

Every value has a **tier** that says how it got into the world. Strongest first:

| Tier | The value |
| --- | --- |
| `told` | was stated (`tell`, `fill`, `applyPatch`, an action) |
| `derived` | follows from stated values, through rules, calcs, aggregates, effects |
| `forced` | was the only value its closed domain had left (`complete`) |
| `default` | is the slot's default, taken as an assumption |
| `guessed` | was chosen by a search (`complete({ choose })`), or is an explanation that was adopted |

A value that follows from others takes the weakest tier among them, and is never
stronger than `derived`: a total computed from a told quantity and a default price is
`default`. Tiers are ranks, not probabilities.

- **A host's own tiers.** `@t core.tier name=measured below=told cost=2` puts a tier
  right below the one it names; `cost` is carried along for the host's use. A statement
  can say its tier: `tell(text, { tier })`, `fill(id, key, value, { tier })`,
  `applyPatch(patch, { tier })`. An unknown tier is an error.
- **`world.tier(id, key)`** is the tier of a value; without a key, of the wire.
- **`world.assumptions()`** lists everything weaker than `derived`, weakest first and,
  among equals, the one most rests on first: `[{ id, key, value, tier, cost,
  dependants: [{ id, key }] }]` (`key` is null for a wire that was assumed as a whole).
- **Queries** carry `tier` (the weakest tier under the answer) and `rests` (the
  assumptions it rests on, when there are any). `explain(id)` shows the tier of each
  wire and filled value. `next()` adds `review`: the assumptions in the order above,
  with how many values rest on each, which is where a confirmation is worth most.
- **Provenance per value.** A derived value, or a derived wire, records the cells it
  was read from as `[wire id, key]` pairs (`cells`, next to `via` and `from`): for each
  matched wire the keys its pattern names, and the wires an aggregate ranged over.
- **What is told replaces what was assumed.** A statement that conflicts with a weaker
  value for the same key (a default, a forced or a guessed value, or something derived
  from one) takes its place; the result lists what gave way under `revised`, with its
  tier, and everything that followed from it is derived again. If dropping just that
  is not enough, every assumption on the wires involved gives way. Told against told
  stays a conflict. Stating again a value that was assumed confirms it: it is `told`.

### 4.13 Describing a world, and comparing two

`world.describe({ about, depth, since, last })` returns a summary as plain data, for a
host to turn into text or a screen. No prose is made by the library.

```
{ types:   { <type>: { count, instances: [ids] } },
  wires:   { <id>: { type, tier, via?, keys: { <key>: { value, tier } } } },
  open:    [{ id, type, key, ask }],                      required keys without a value
  assumed: [{ id, key, value, tier, dependants }],        weakest first (4.12)
  issues:  [{ id, rule, about: [ids], key?, why }],        standing soft violations (3.4)
  changes: [{ seq, op, id, ... }] }                        the last events, with their cause (via, from)
```

`about` is a wire id (that wire and what it refers to or is referred to by, up to
`depth` steps, default 1) or a type (its wires). `since` keeps only the changes after
that event number; `last` caps them (default 20).

`world.diff(other)`, or `World.diff(a, b)`, compares two worlds, typically a world and
a fork on which something was tried: `{ same, added, removed, changed }`, where
`added` and `removed` are `{ id, type, tier }` and `changed` is
`{ id, key, from, fromTier, to, toTier }`. A value that keeps its text but changes
tier (an assumption that was confirmed) is a change. Derived wires whose content
changed appear as one removed and one added.

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
- Abduction inverts `add`, `sub`, `mul`, `div` only, one unknown per calc, not through
  aggregates, and not a built-in name that the host has replaced. A division that does
  not come out even (12 significant digits are kept) may fail the forward check.
- Induction is exact generalisation: it skips examples of a different shape and uses
  negative examples to add comparisons, but does not handle noise or learn negation.
- There is no built-in notion of context: a wire holds in the whole world. `asOf` costs
  a withdrawal of everything later than the point asked about.
- `fromJSON` replays the log. `fork` does not (4.11).
- The budget counts steps of the library's own loops. A host function (`fns`) or a
  solver strategy that loops by itself is outside it; `ms` does not interrupt them either.
- The build does not minify (about 110 kB, 31 kB gzipped).

## 7. Architecture

| Module | Responsibility |
| --- | --- |
| `parser.mjs` | Text to wires and back |
| `unify.mjs` | Terms and unification |
| `matrix.mjs` | Compiles matrix wires into slots, rules and denies; checks stratification; prefixes modules |
| `world.mjs` | Kernel: store and indexes, transactions, ingest, matching, chase, validation, withdrawal |
| `complete.mjs` | Open keys, suggestions, questions, `step` and `answer` |
| `query.mjs` | Queries with a status, answer wires, producers, actions, the vocabulary |
| `time.mjs` | Sequence, fluents and effects, as-of |
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

const w = new World({ fns, library, solver, maxDepth, maxSteps, lookahead, strict, searchBudget, rank, budget });
w.tell(textOrWires, { dry, strict })   w.load(textOrWires)   w.use(name)
w.fill(id, key, value, { dry, strict })
w.retract(id)   w.replace(id, textOrWires)   w.fork()   w.trial(fn)
w.step(textOrWires, { defaults, choose, strict })   w.answer(questionWire, value)
w.get(id)  w.has(id)  w.ofType(type)
w.ask(patternText)   w.holds(patternText)
w.open(id?)  w.suggest(id, key, { deep })  w.next()  w.complete({ defaults, choose })
w.solve()  w.solveReport({ solver, budget, limit })  await w.solveAsync({ solver })
w.satisfiable()  w.apply(assignment)   w.check(patch)   w.applyPatch(patch)
w.query(question, { record, suppose, at })   w.act(request)   w.schema(type)
w.asOf(at, fn)   w.seqOf(id)   w.compare(idA, idB)
w.abduce(goalText, { maxDepth, max, maxAssumptions })
w.explain(id)  w.history()  w.on(listener)   w.stats()
w.tier(id, key)   w.assumptions()   w.describe({ about, depth, since, last })   w.diff(other)
// every call above also takes { budget: { steps, ms } }
w.toSOP({ schema, derived, provenance })   w.toJSON()   World.fromJSON(data, options)
```

## 9. Changes

Since 0.4.0 (the version first published in this repository):

- **`core.test` is now `core.check`** (the wire that states a condition of a rule or a
  deny). A wire of type `core.test` still works as a condition when a rule or deny links
  it with `if=`, for one more version. A `core.test` wire that nothing links is an
  ordinary fact, so a host may use that type for its own wires.
- **`world.schema` is now `world.matrix`** (the Map of matrix wires).
  `world.schema(type)` is a method that describes a type; it lists the kinds the library
  does not check in `unknownKinds`.
- Matrix wires of one `tell` are read before its facts, whatever their order in the text.
- `core.type` without `of=` takes its wire id as the type name.
- A reference under a key of an open namespace that no slot declares is no longer
  checked and no longer ties a wire to the one it mentions.
- New: type hierarchy (3.8), kinds, qualified keys, open namespaces and schema maps
  (3.9), sequence and selectors (3.10), fluents and effects (3.11), as-of (3.12),
  queries, answer wires, producers, actions and prefix slots (4.10).
- A value told for a fluent key of an existing wire is a new statement, not a conflict.
- `eq` and `neq` compare numbers, clock times and dates by value (`5` equals `5.0`);
  `lt`, `lte`, `gt`, `gte` order clock times and dates (`9:05` before `10:00`).
- New: aggregates (3.6.2), `abs`, `round`, `mod`, `idiv`, `time_add`, `time_diff`,
  `weekday`, checked time kinds (3.6.1).
- Rules with negation or a selector are re-evaluated only when a type they read changed.
- New: `core.on=` templates (3.3); the stratification check knows which keys a template
  adds, so a rule may aggregate over a type and fill a key on a wire of that type.
- New: `core.absent=` in patterns (3.10).
- **Changed:** `complete({ defaults: true })` and `step()` now apply a slot's default to
  an optional key too (it was applied only when the key was `required`).
- New: `world.describe()` and `world.diff()` (4.13).
- New: tiers of certainty and `cells` (4.12): `world.tier`, `world.assumptions`, `tier`
  and `rests` in query results, `review` in `next()`, `{ tier }` on statements.
- **Changed:** a told value now replaces a forced or chosen value for the same key, as
  it already replaced a default (it used to be a `conflict`). `revised` entries carry
  the `tier`. Values committed by `complete({ choose })` are recorded with
  `via: 'core.choose'` (was `core.default`). `adopt()` marks what it adopts as `guessed`.
- New: `delta=` on a fluent (3.11).
- New: `world.cannot(reason)` and the `unsupported` status; the `decimals` option and
  `core.precision` (3.6.1).
- New: soft constraints (`soft=true` on a deny or a bounded slot) and `core.issue`
  wires (3.4); a query over a flagged wire answers `conflicting` with the reason.
- New: a tie for `argmax` / `argmin` makes the query `ambiguous` with the alternatives
  (3.6.2); `ties=first` keeps the old behaviour.
- **Changed:** a second, different declaration of the same key of the same type used
  to replace the first silently. It is now refused unless one of the two carries
  `combine=intersect` or `combine=override` (3.1).
- **Fixed:** a completion that is only valid as a whole was reported `unsat`, its keys
  dead (values were tried one at a time). New: `world.check(patch)`,
  `world.applyPatch(patch)` (4.9.1); `apply()` is now atomic; `unsat` is reported only
  with a complete justification, else `unknown` with a `reason`.
- A bookkeeping key (open namespace, no slot) no longer conflicts when a wire is told
  again; the sequence key may be declared after wires arrived (3.9, 3.10).
- Abduction goes through calcs (4.6): arithmetic is inverted, other functions are
  tried over the slot's domain.
- New: budgets on every call, `world.stats()`, and a `fork()` that shares the state
  instead of replaying the log (4.11). `ask`, `holds`, `retract`, `replace`, `next`,
  `complete`, `suggest`, `abduce`, `apply`, `act`, `asOf` and `trial` take
  `{ budget }`; `solveReport({ limit })`.
- Under a key declared `integer` or `number`, values are compared by their canonical
  spelling: `5` and `5.0` match each other (3.9). Before, they were different texts.
- `apply()` no longer returns working fields in its result.

