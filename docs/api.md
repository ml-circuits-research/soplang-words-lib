# API: every public name, with what it takes and returns

`import { World, parse, ... } from 'sopworld'` (or from the single file
`docs/sopworld.mjs`). This page lists everything the library exports and every public
method of a world. Names that start with `_` are internal and may change. The language
is in [language.md](language.md), the wire types in [reference.md](reference.md), the
behaviour in [semantics.md](semantics.md).

**Conventions used on this page**

- *input* is SOP Lang text or an array of parsed wires.
- A **change result** is `{ ok, added, derived, filled, merged, removed, violations }`:
  ids of the facts added, ids of the wires rules derived, values put on existing wires
  (`{ id, key, value, via }`), facts merged into others (`{ id, into }`), ids removed,
  and the [violations](semantics.md#violations) (empty when `ok`). It may also have
  `revised` (assumptions that gave way) and `issues` (soft violations recorded).
- **Errors.** Methods do not throw for anything a matrix or a fact can cause: they
  return `ok: false` with violations. They throw `SopError` for text that does not
  parse, and `Error` for a call that is wrong in itself (an unknown tier, a host
  function that would replace a built-in). `load` is the exception: it throws on
  refusal.
- **Budget.** Every method that computes takes `{ budget: { steps, ms } }` (default
  5,000,000 steps, no time limit; the world option `budget` changes the default). When
  it runs out, a change is refused with a `budget` violation and the world is unchanged;
  a reader returns what its entry says. `world.stats()` reports the last call.
- **Cost** is given in: *n* facts, *r* rules, *m* matches of the bodies concerned,
  *h* statements in the log.

The examples on this page use this world:

```js setup
const shop = () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=item key=name id=true
    @k2 core.slot of=item key=price kind=number min=0 required=true ask="What does it cost?"
    @k3 core.slot of=line key=item type=item required=true
    @k4 core.slot of=line key=qty kind=integer min=1 default=1
    @it item price=?p
    @l line item=$it qty=?q
    @c core.calc out=?cost fn=mul args=?q args=?p
    @t line core.on=$l cost=?cost
    @r core.rule when=$l when=$it with=$c then=$t
  `);
  return w;
};
```

## Making a world

### new World(options?)

Options, all optional: `ns` (the [namespace](language.md#12-scope) of every
statement of this world), `facts` (below), `fns`, `actions`, `producers`, `filters` (host functions by name), `lemma` (the host's lemma function; see
[register](#worldregisterkind-name-fn-options)), `override` (let `fns` replace
built-ins: `true` or names), `library` (module name to matrix text, for `core.use`),
`maxDepth` (12), `maxSteps` (rule firings per change), `budget`, `decimals`, `strict`
(refuse a change that leaves no completion), `lookahead` (true), `solver`,
`searchBudget`, `rank` (reorder suggestions and explanations), `vocabulary` (names of
the question, answer and request wires and their keys).

Properties: `wires` (Map of facts by id), `matrix` (Map of matrix wires by id), `log`
(the statements), `warnings`, `version`, `stamp`, `actions`, `producers`, `options`.
`version` is the token to cache by: a fork is born with its world's version, a statement
that adds nothing (re-telling what the world holds), a dry run and a refused change
leave it, and any change gives a version that no world of the process had before.
`stamp` is internal (it identifies a state within one world, moves with every step of a
transaction, and two forks may reuse a number for different states).

Throws if `fns` would replace a built-in without `override`. Cost: constant.

**Facts the host keeps.** `facts: { city: (where, world) => [...] }` gives the facts of a
type from the host's own data (a large static table). A pattern of that type asks the
provider with the values it fixes (`where`, keys to values, strings as their text) and
matches what comes back like wires: `{ id, ...keys }` or `{ id, attrs }`, values as
values or arrays. They are read in rules, denies, aggregates, queries and `ask`, are
`told` for tiers, and are never stored, forked, logged or snapshotted. A provider must be
pure and stable (the same answer for the same `where` for the life of the world: what a
rule concluded from it is never re-examined), may return more than asked (every pattern
value is checked), and should be bounded: each fact it returns costs one step of the
budget, so a pattern that fixes nothing pages through the whole table under the budget.
A rule needs a wire of the world to fire: a provider's facts alone start nothing.
Returned facts are kept by id while the world lives. Cost: a city table of 1,000 rows
takes 0.2 ms to build, against 28 ms as wires, and the snapshot is 1 kB instead of 113 kB
(`node bench/facts.mjs`).

```js run
const w = new World({ decimals: 2, fns: { double: ([x]) => Number(x) * 2 } });
print(w.wires.size, w.matrix.size, w.stamp, w.options.decimals);
```

```output
0 0 0 2
```

### World.fromJSON(snapshot, options?)

Rebuilds a world from what `toJSON()` returned, by replaying its log. Host functions
are not in a snapshot: pass the same options. Returns the world. Cost: that of telling
the log again, O(h) changes; the open marks of a timeline are forks taken on the way, not
replays of their own. A snapshot written with `since: base` is restored with `{ base }`:
the base is forked (its options and functions come with it), checked against the
fingerprint in the snapshot, and only the rest is replayed.

```js run
const base = shop();
base.tell('@a item name=pen price=2');
const w = base.fork();
w.mark('before'); w.tell('@b item name=ink price=3');
const d = w.toJSON({ timeline: true, since: base });
const r = World.fromJSON(JSON.parse(JSON.stringify(d)), { base });
r.rewind(r.marks()[0].mark);
print(d.log.length, r.has('b'), base.has('b'));
```

```output
1 false false
```

```js run
const w = shop();
w.tell('@a item name=pen price=2');
const copy = World.fromJSON(JSON.parse(JSON.stringify(w.toJSON())));
print(copy.get('a').attrs.price, w.diff(copy).same);
```

```output
["2"] true
```

### World.audit(wires, matrix?, options?)

Checks wires that came from somewhere else against a matrix, without refusing at the
first problem. Returns `{ ok, violations, issues, world }`; `world` holds the wires
that could be loaded. Cost: one validation of everything.

```js run
const r = World.audit('@a item name=pen price=-2\n@b item name=ink price=3', '@k core.slot of=item key=price kind=number min=0');
print(r.ok, r.violations.map((v) => [v.id, v.why]));
```

```output
false [["a","must be at least 0"]]
```

### World.diff(a, b)

The same as `a.diff(b)`.

```js run
const a = shop(), b = a.fork();
b.tell('@x item name=pen price=2');
print(World.diff(a, b).added.map((x) => x.id));
```

```output
["x"]
```

## Changing a world

### world.tell(input, options?)

States wires: facts, matrix wires, or both. Options: `dry` (evaluate and undo), `strict`,
`tier` (default `told`; a tier name for the whole statement, or `{ key: tier }` for some
keys, which are then assumptions that `assumptions()` lists and a told value replaces;
a fact marked `derived=true` with `core.source="rule <id>"`, as a knowledge world ships what
its rules derive, has its values at the tier `derived`, value by value, so a merge with told
values of the same identity keeps each value's origin, and `why` names the rule),
`ns` (the facts go in that [namespace](language.md#12-scope): `b1` becomes `ns::b1`, a
reference without a namespace points into it), `budget`. Returns a change result. Cost: O(matches the new
wires take part in) for the chase, plus validation of the touched wires; telling matrix
wires recompiles the matrix and validates everything, O(n·r).

```js run
const w = shop();
const r = w.tell('@pen item name=pen price=2  @l1 line item=$pen qty=3');
print(r.ok, r.added, r.filled);
print(w.tell('@ink item name=ink price=-3').violations[0].why);
```

```output
true ["pen","l1"] [{"id":"l1","key":"cost","value":"6","via":"r"}]
must be at least 0
```

### world.load(input)

`tell` that throws an `Error` when the change is refused. For matrices and fixtures,
where a refusal is a mistake in the program.

```js run
const w = new World();
try { w.load('@r core.rule when=$nothing then=$nothing'); } catch (e) { print(e.message); }
```

```output
sopworld: refused (schema) r: when=$nothing is not a wire of the matrix
```

### world.use(name)

Loads the module `name` from the library; the same as telling a `core.use` wire. The
module declares types and slots under its own name (see [core.module](reference.md#coremodule)).
Returns a change result.

```js run
const w = new World({ library: { money: '@k core.slot of=money.price key=amount kind=number' } });
print(w.use('money').ok, w.matrix.has('money.k'));
```

```output
true true
```

### world.fill(id, key, value, options?)

Gives a value to a key of an existing fact. Options as for `tell`. A different value
for a single-valued key that already has one is a `conflict` (use `revise`), except for
a fluent, where it is a new statement of the state. Returns a change result.

```js run
const w = shop();
w.tell('@pen item name=pen');
print(w.fill('pen', 'price', 2).filled);
print(w.fill('pen', 'price', 3).violations[0].kind);
```

```output
[{"id":"pen","key":"price","value":"2","via":"core.tell"}]
conflict
```

### world.revise(id, key, value, options?) and world.revise(id, values, options?)

Replaces told values, with everything that followed from them, in one transaction.
Returns a change result with `revised`: the cells that were replaced or recomputed.

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @l1 line item=$pen qty=3');
const r = w.revise('pen', 'price', 5);
print(r.ok, w.get('l1').attrs.cost);
```

```output
true ["15"]
```

### world.retract(id, options?)

Removes a told fact, the facts that refer to it, and what was derived from them alone.
Refused (`unknown-wire`) for a wire that was not told, and when the world that remains
is not valid. Returns a change result with `removed`. Cost: O(what depended on the
wire).

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @l1 line item=$pen qty=3');
print(w.retract('l1').removed, w.retract('nobody').violations[0].kind);
w.tell('@l2 line item=$pen qty=1');
print(w.retract('pen').removed);
```

```output
["l1"] unknown-wire
["pen","l2"]
```

### world.replace(id, input, options?)

Retracts the fact `id` and tells `input` in one transaction; references to the fact
stay valid when the new wire has the same id or identity. Returns a change result.

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @l1 line item=$pen qty=3');
print(w.replace('l1', '@l1 line item=$pen qty=4').ok, w.get('l1').attrs.cost);
```

```output
true ["8"]
```

### world.applyPatch(patch, options?)

Applies several changes that must hold together, all or nothing. A patch is an array
of `{ id, key, value }` fills, or `{ wires, fills, sets, retract, replace }`: wires to
tell, values to add, values to replace, ids to retract, and wires to replace in place.
`replace: { id, attrs }` (or a list of them) gives a told wire exactly the keys in
`attrs` (keys it had and `attrs` lacks are dropped) and keeps its id, so the wires that
refer to it stay; what was derived from the old content is withdrawn. Options:
`strict`, `tier`, `budget`. Returns a change result, with `replaced` (ids) when there
were replacements. `undo` takes a patch back as one statement.

```js run
const w = shop();
const r = w.applyPatch({ wires: '@pen item name=pen  @l1 line item=$pen', fills: [{ id: 'pen', key: 'price', value: 2 }, { id: 'l1', key: 'qty', value: 5 }] });
print(r.ok, w.get('l1').attrs.cost);
w.undo();
print(w.has('pen'), w.has('l1'));
```

```output
true ["10"]
false false
```

### world.sync(collection, input, options?)

Makes a collection of told wires equal to a list, in one transaction. `collection` is a
type (its told facts and those of its subtypes) or `{ prefix }` (the told facts whose id
starts with it); `input` is SOP text or parsed wires. A wire with a new id is told; one
whose content differs from what was told is replaced in place (its id, and the wires
that refer to it, stay); one that is the same is left alone; a wire of the collection
that is not in the list is retracted. Returns the change result with `told`, `replaced`,
`retracted` and `same` (ids). All or nothing. `undo` takes back what it told and
replaced; what it retracted is not given back (use a mark). Options:
`strict`, `tier`, `budget`. Cost: one pass over the told wires, then the patch.

With `{ ns }` the list is told in that namespace and the collection is its part.

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @ink item name=ink price=3');
const r = w.sync('item', '@pen item name=pen price=2  @ink item name=ink price=4  @cap item name=cap price=1');
print(r.told, r.replaced, r.retracted, r.same);
```

```output
["cap"] ["ink"] [] ["pen"]
```

### world.apply(assignment, options?)

Fills the values of an assignment (`[{ id, key, value }]`, as `solve` returns) in one
transaction. Option `via` names where they came from. Returns a change result.

```js run
const w = shop();
w.tell('@pen item name=pen');
print(w.apply([{ id: 'pen', key: 'price', value: 2 }]).filled);
```

```output
[{"id":"pen","key":"price","value":"2","via":"core.complete"}]
```

### world.undo(n = 1, options?)

Takes back the last `n` statements. Returns `{ ok, undone, removed, added, changed,
violations }`; `nothing-to-undo` when the log is empty. Statements that only touched
wires of `transient` types are passed over and kept. A retraction is a statement like
the others: undo gives the wire back. Cost: O(h) changes, since the world is rebuilt from the statements that
remain.

```js run
const w = shop();
w.tell('@pen item name=pen price=2');
w.tell('@ink item name=ink price=3');
const r = w.undo();
print(r.ok, r.removed, w.has('ink'));
```

```output
true ["ink"] false
```

### world.redo(n = 1, options?)

Tells again what the last undo took back (or the last `n` undos), as the statements
they were. Returns `{ ok, redone, removed, added, changed, violations }`;
`nothing-to-redo` when nothing was undone since the last statement that is not
transient. If a statement cannot be told again, nothing is, and the world stays as it
was. Cost: that of telling the statements again.

```js run
const w = shop();
w.tell('@pen item name=pen price=2');
w.tell('@ink item name=ink price=3');
w.undo();
const r = w.redo();
print(r.ok, r.redone, w.has('ink'));
```

```output
true [{"op":"tell","ids":["ink"]}] true
```

### world.mark(label?), world.marks() and world.rewind(mark, options?)

`mark(label)` returns a point to come back to (a fork: the world's next change copies
only what it touches); `marks()` lists the open ones, oldest first, as `{ label, seq,
mark }`. `rewind(mark)` makes the world exactly what it was and returns `{ ok, removed,
added, changed }`; the marks made after it are closed. A mark can be used again.
`rewind(mark, { only })` takes back one unit only: the told wires of a type (`only:
'note'`) or of an id prefix (`only: { prefix: 'ui.' }`) become what they were at the mark,
in one transaction, and everything else stays. What a rewind takes back is kept as after
`undo()`: `redo()` tells it again, as one step, until the next statement (for `only`, the
unit as it was before the rewind). `toJSON({ timeline: true })` also writes
the open marks and what `redo` would tell again, and `World.fromJSON` restores them, so a
host that restarts keeps undo, redo and rewind; with `since: base` only what came after
the base is written (see `World.fromJSON`).

```js run
const w = shop();
w.tell('@pen item name=pen price=2');
const m = w.mark();
w.retract('pen');
print(w.has('pen'), w.rewind(m).added, w.has('pen'));
```

```output
false ["pen"] true
```

### world.act(request, options?)

Runs an [action](reference.md#coreaction). `request` is `{ action, args }`, a
`core.request` wire, or its text. Returns `{ ok, status, value, result, missing,
violations }` with status `done`, `missing` (arguments to ask for), `refused`, `error`
(the host function threw), `unsupported` (no such action) or `budget`.

**The undo contract.** One request is one undo step, and so is one sentence (an array of
requests, all or nothing). Requests that carry the same `options.message` tag are one step
together, however many calls they took, so a host that runs the clauses of one message
one by one undoes them with one `undo`. Tags must be unique per message.

A host function gets `(ctx, args)`. `ctx.tell(input, { now })` queues a statement and
returns `{ ok: true, queued: true }`; the queue is propagated and validated together at
the first read (`ctx.find`, `ctx.val`, `ctx.vals`, `ctx.get`, `ctx.query`, `ctx.ask`,
any use of `ctx.world`), before `ctx.fill`, `ctx.replace`, `ctx.retract`, and at the
end ([S57](semantics.md#queries)). `ctx.flush()` does it now and returns the change
result; `{ now: true }` checks one tell as it is told. A refusal's violations carry
`queued: [{ index, ids }]`, the queued tells involved. Cost: one propagation for the
queued tells, against one per tell (`node bench/act.mjs`).

```js run
const w = new World({ actions: { rename: ({ find, replace }, { from, to }) => {
  const [it] = find('item', { name: from });
  return it ? replace(it.id, `@${it.id} item name=${to}`).ok : { ok: false, why: `no item named ${from}` };
} } });
w.load('@a core.action name=rename fn=rename required=from required=to');
w.tell('@i1 item name=pen');
print(w.act({ action: 'rename', args: { from: 'pen', to: 'pencil' } }).status, w.get('i1').attrs.name);
print(w.act({ action: 'rename', args: { from: 'pen' } }).missing);
```

```output
done ["pencil"]
[{"action":"rename","key":"to"}]
```

**One sentence, all or nothing.** `world.act([request, ...])` runs the requests of one
sentence in turn inside one transaction: if one is not done (`missing`, `refused`,
`unsupported`, `error`) none is kept, and the result says which (`failed`, its index),
with every result so far (`results`) and, for a missing argument, what to ask (`missing`).
What they did together is one step for `undo` and `redo`, also after `toJSON` and
`fromJSON`. A retraction inside is undone with the rest.
To know beforehand whether each request would be refused, without applying anything,
give the readings to `score` ([integration §5b](integration.md#5b-readings-the-present-state-would-refuse)).

```js run
const w = new World();
w.load(`@k core.slot of=item key=name id=true
  @k2 core.slot of=item key=place enum=table enum=shelf
  @it item name=?x place=?p
  @to item core.on=$it place=?q
  @move core.action name=move param=x param=q when=$it set=$to`);
w.tell('@a item name=cup place=table  @b item name=pen place=table');
const r = w.act([{ action: 'move', args: { x: 'cup', q: 'shelf' } }, { action: 'move', args: { x: 'pen', q: 'sky' } }]);
print(r.ok, r.failed, w.get('a').attrs.place);
w.act([{ action: 'move', args: { x: 'cup', q: 'shelf' } }, { action: 'move', args: { x: 'pen', q: 'shelf' } }]);
w.undo();
print(w.get('a').attrs.place, w.get('b').attrs.place);
```

```output
false 1 ["table"]
["table"] ["table"]
```

## Completing a world

### world.open(id?)

The open keys (required, no value) of the world or of one wire: `[{ id, type, key,
ask }]`. Cost: O(n), or O(keys of the wire).

```js run
const w = shop();
w.tell('@pen item name=pen');
print(w.open());
```

```output
[{"id":"pen","type":"item","key":"price","ask":"What does it cost?"}]
```

### world.suggest(id, key, options?)

The values that could go in a key, most plausible first: `[{ value, source, count }]`,
`source` being `default`, `enum`, `range` or `wire` (a wire of the slot's type). Only
values the world accepts are returned; with lookahead, only values that some complete
assignment contains. On budget: the array found so far, with a `budget` property.
Cost: one trial per candidate, or one search per candidate with lookahead.

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @ink item name=ink price=3  @l1 line qty=2');
print(w.suggest('l1', 'item').map((c) => c.value));
```

```output
["$pen","$ink"]
```

### world.next(options?)

What can be done about the open keys without changing anything: `{ fills, questions,
dead }`. `fills` are values that are forced or defaults (`kind`), `questions` the keys
that need an answer (as question wires with the options), `dead` the keys with no
possible value. With `{ review: true }` also `review`: the assumptions a host may want
confirmed, weakest first; it is a pass over every value, so it is computed only when
asked for. Cost: one trial per candidate of each empty slot; nothing at all when the
matrix has no required slot and no default.

```js run
const w = shop();
w.tell('@pen item name=pen  @l1 line item=$pen');
const n = w.next();
print(n.fills.map((f) => [f.id, f.key, f.value, f.kind]), n.questions.map((q) => [q.attrs.about[0], q.attrs.seek[0]]), n.dead);
```

```output
[["l1","qty","1","default"]] [["$pen","price"]] []
```

### world.canComplete(id?)

Cheap: whether some empty slot of the world (or of one wire) has a candidate that
completion could try: an optional key with a default, or a required key with a default,
an enum, a range, or a type that has wires. It does not try the values, so `true` does
not promise that `complete()` fills anything. For a host that completes after every
change and wants to skip the call when there is nothing to look at. Cost: one pass over
the wires whose type has such a slot; constant when the matrix has none.

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @l1 line item=$pen qty=2');
print(w.canComplete(), w.canComplete('pen'));
w.tell('@l2 line item=$pen');
print(w.canComplete(), w.canComplete('l2'));
```

```output
false false
true true
```

### world.complete(options?)

Applies what `next` found: forced values, with `{ defaults: true }` the defaults, with
`{ choose: true }` one full solution of what is left (tier `guessed`). Returns
`{ filled, questions, dead, pending }`. A call on a world that has not changed since a call with
the same options that filled nothing returns that answer again at once. The std.acts act
`complete` is different: it applies what `std.fill` chose for a thing; the solver runs
only here.

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @l1 line item=$pen');
const c = w.complete({ defaults: true });
print(c.filled.map((f) => [f.id, f.key, f.value]), w.get('l1').attrs.cost, w.tier('l1', 'cost'));
```

```output
[["l1","qty","1"],["l1","cost","2"]] ["2"] default
```

### world.step(input, options?)

One turn of a dialogue: `tell(input)`, then `complete(options)`. Returns the change
result with `questions`, `dead` and `pending` added.

```js run
const w = shop();
const s = w.step('@pen item name=pen', { defaults: true });
print(s.ok, s.questions.map((q) => str(q.attrs.text[0])));
```

```output
true ["What does it cost?"]
```

### world.answer(question, value)

Fills the key a question wire (from `next`, `complete` or `step`) is about. Returns a
change result.

```js run
const w = shop();
const q = w.step('@pen item name=pen').questions[0];
print(w.answer(q, 2).ok, w.get('pen').attrs.price, w.open());
```

```output
true ["2"] []
```

### world.solve(options?), world.solveReport(options?), world.satisfiable(options?)

Search for values of all open keys that the world accepts together. Nothing changes.
Options: `solver`, `budget` (the solver's own), `limit` (the step budget of the call).
`solveReport` returns `{ status, assignment, reason, stats, solver }` with status
`sat`, `unsat` or `unknown` ([S46](semantics.md#search)); `solve` returns the
assignment or `null`; `satisfiable` is false only for `unsat`. Cost: exponential in
the number of open keys in the worst case; the default solver learns from conflicts.

```js run
const w = new World();
w.load(`
  @k1 core.slot of=seat key=who enum=ann enum=bob required=true
  @a seat who=?x
  @b seat who=?x
  @d core.check fn=neq args=$a args=$b
  @no core.deny when=$a when=$b if=$d why="?x sits twice"
`);
w.tell('@s1 seat  @s2 seat who=bob');
print(w.solve(), w.solveReport().status, w.satisfiable());
```

```output
[{"id":"s1","key":"who","value":"ann"}] sat true
```

### world.solveAsync(options?)

`solveReport` for a solver that runs outside (`solvers.external`, `dimacs`, `clingo`
with an asynchronous `exec`). Returns a promise of the report.

```js
const report = await world.solveAsync({ solver: solvers.dimacs({ exec: runMySatSolver }) });
```

### world.abduce(goal, options?)

What would have to be assumed for `goal` (wires, as text with ids) to hold:
`[{ assume, fills, text, cost }]`, cheapest first; empty when nothing is needed or
nothing works. Options: `max` (10), `maxDepth` (3 rule steps), `maxAssumptions` (4).
On budget: what was found, with a `budget` property. `adopt(world, explanation)`
applies one.

```js run
const w = shop();
w.load('@ab core.abducible of=item key=price');
w.tell('@pen item name=pen  @l1 line item=$pen qty=3');
print(w.abduce('@g line item=$pen qty=3 cost=12').map((e) => e.fills));
```

```output
[[{"id":"pen","key":"price","value":"4"}]]
```

## Asking

### world.ask(query, options?)

Matches patterns (text; ids may be left out) against the facts and returns the
bindings, one object per match: `[{ variable: value }]`. A pattern's own id binds to
the matched wire's id. Option `at`: as of that place in the sequence. On budget: the
matches so far, with a `budget` property. Cost: O(m), using the indexes for fixed
values.

With `{ ns }` the patterns see only that namespace, and a reference without a namespace
points into it. The same option on `query`.

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @ink item name=ink price=3');
print(w.ask('@x item name=?n price=3'));
```

```output
[{"x":"ink","n":"ink"}]
```

### world.holds(query, options?)

True when `ask` would return at least one match.

```js run
const w = shop();
w.tell('@pen item name=pen price=2');
print(w.holds('item name=pen'), w.holds('item name=ink'));
```

```output
true false
```

### world.query(question, options?)

Asks for a value, with a status. `question` is `{ type, where, absent, seek, mode }` or
`{ about, seek }`, a `core.question` wire, or its text. `absent` (keys) and
`core.absent=` on a question wire match only wires with no value for those keys, as the
pattern modifier does. Modes: `value` (default),
`list`, `count`, `exists`, `check` (is `where[seek]`, or `value`, the value the world
has? `yes`, or `no` with `actual`), `abduce`. Options: `record` (tell the
question and the answer as wires), `suppose` (default true: S53), `at`. Returns
`{ status, value | values, from, via, tier, rests, wires }` and, by status,
`alternatives`, `missing`, `reason`, `issues`, `howto`, `supposed`, `violations`. The
statuses are defined in [semantics](semantics.md#queries).

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @l1 line item=$pen qty=3');
const q = w.query({ about: 'l1', seek: 'cost' });
print(q.status, q.value, q.via, q.tier);
print(w.query({ type: 'item', where: { name: 'ink' }, seek: 'price' }).status);
```

```output
supported 6 ["r"] derived
missing
```

### world.words() and world.interpret(frame, options?)

`words()` maps each text to its `core.word` entries, with what each
means in the matrix (`meanings`: `{ kind: 'action' | 'type' | 'key' | 'value', ... }`).

**Order.** Words keep the order in which they were told: the texts of `words()`,
the entries of one text, the forms of one word, the readings `interpret` gives for a
word with several meanings, the near words at one distance, and the fillers `examples`
uses. So a host declares the most usual word first, and it comes first in examples and
in ties (`rank` keeps the given order). The order survives forks, undo and snapshots; a
word retracted and told again goes to the end.

`interpret(frame)` reads a frame (the host's: its tokens, lemmas, parse) into candidates
for `score`. A frame is `{ verb, args, numbers, question, mode, ns }`; an argument is a word or `{ word,
role }`, where `role` is a word for a key (`with`, `on`). A verb that means an action
gives `{ action, args }`, one that means a type gives `{ wires, refer }` (a slot that
holds a wire gets a described referent), and `question: true` gives `{ question }`. An
argument with no word wire is read as an entity it names by an identifying key, or an
enum value spelled as is. Returns `{ candidates, unresolved, dropped }`; each candidate
also has `reading` (which word went where), `used`, `unused` and `unresolved`. Nothing
is invented: every value comes from a word or a number of the frame. Options: `limit`
(default 50 candidates), `id` (of the new wire, default `new`), `near` (default true).

A word that is not known (no word wire, no name, no enum value) is read as the nearest
known words (a typo): within an edit distance of 1 for words of 4
letters or fewer, 2 for longer, adjacent swaps counting one; only those at the smallest
distance; for the verb only words that mean an action, a type or a key. Such a candidate
has `assumes: [{ word, read }]`, which `score` keeps, so `rank` puts exact readings
first and a host can say "(I read X as Y)". A known word is never corrected; `near:
false` turns this off.

Word forms: a `core.word` may carry several `text=` forms (`text=notebook
text=notebooks`). A token that is no known form goes through the host's `lemma` function,
if one is registered (`lemma: fn` or `register('lemma', fn)`), before near words are
tried; no language is built in.

Follow-ups ("no, a red one", "and the price?", "the other one", "tuesday then"): with
`{ previous }`, a frame with no verb or no arguments, or one the front end marks
`anaphor` (a pronoun or "one"), `correction` ("no, X") or `other` ("the other one"),
inherits the previous frame's verb, question flag and words; what it states takes the
place of what the previous frame said for the same slot (a correction even in a many
slot). `previous` is a frame, `{ frame, ids }` (the ids the previous reading resolved
to: `other` then describes another wire of the same type, `refer.not`), or `'told'`:
the last told statement, which the frame then revises (a candidate `{ revise: { id,
values } }`, which `score` judges like the rest). Candidates carry `inherited: { verb,
words, wire }` and `replaced` (inherited words the reading does not use). A frame with a
verb and arguments and no mark is read on its own.

Loose words ("pen two buy", "red house big"): a frame `{ words, numbers,
question }` has no verb and no order. Each word that may be a verb (it means an action,
a type or a key, or is near one) is tried as the verb with the others as arguments
(`verbWord`), then each action and type that has a word as an implied verb with all the
words (`implied`, kept when it uses one). `score` and `rank` order them by what they use;
a tie at the top is the host's cue to ask. Bounded by `limit` and charged to the budget
(site `interpret`; a run-out returns no candidates and `budget`).

One message may be several frames ("reserve the pen and order ink"). A list of frames
is one split of it; a list of lists is alternative splits. Each candidate is then `{
parts, split }`, one reading per frame (new wires `new1`, `new2`, ...), and `score`
judges the parts in order, each on the world with the parts before it, as one whole (a
frame of a split with no verb, "... and one ink", takes the verb of the frame before it
and its words replace that frame's for the same slots):
consistent when every part is, with the parts' lacks, assumptions and referents (each
marked `part`) and `parts`, the score of each. A frame that has no reading stays as an
unresolved part (`unread: true`, with its words in the candidate's `unresolved`), so a
split that leaves a word out loses on `words` and `veto` reports `words-left-out`.

```js run
const w = new World();
w.load(`@k1 core.slot of=item key=name id=true
  @k2 core.slot of=order key=item kind=ref to=item required=true
  @k3 core.slot of=order key=qty kind=integer min=1 default=1`);
w.tell('@i1 item name=pen  @w core.word text=order means=order');
const r = w.interpret({ verb: 'order', args: ['pen', 'spoon'], numbers: [2] });
print(r.candidates[0].wires, r.candidates[0].refer, r.unresolved);
```

```output
@new order item=$r1 qty=2 {"r1":{"type":"item","where":{"name":"pen"}}} ["spoon"]
```

### world.examples(templates?, options?)

Example sentences, generated from the tools (actions, types and keys that
have words), their slots and the words; the host gives the templates, the library what
fills them. `templates` is `{ action, statement, question }`, each a string with
`{verb}`, `{args}` and `{<key>}`, or a function `({ verb, args }) => string`; an argument
is written `role word` when its key has a word. Values come only from words and from
names the world holds (`sample` per type, default 2); a number slot takes its `min` (or
1). Each example is `{ tool, text, frame, expect }`: the frame a front end should
give `interpret` for `text`, and the reading it should then give, so a lexicon can be
tested by reading its own examples back. Options: `per` (default 3 a tool), `all` (every
slot with fillers, not only the required ones), `sample`.

```js run
const w = new World();
w.load(`@k6 core.slot of=person key=name id=true
  @k5 core.slot of=meeting key=with type=person required=true
  @k4 core.slot of=meeting key=day enum=mon enum=tue required=true`);
w.tell(`@p1 person name=ann  @w1 core.word text=meet means=meeting
  @w2 core.word text=with means=meeting.with  @w3 core.word text=monday means=mon of=meeting.day`);
const [e] = w.examples({ statement: '{verb} {day} {with}' });
print(e.text, e.frame.args, e.expect.attrs);
```

```output
meet monday with ann [{"role":"with","word":"ann"},"monday"] {"day":"mon"}
```

### world.score(candidates, options?)

Judges candidate readings of one utterance against the world and tells nothing. A
candidate is any of `{ wires, refer }` (a statement; `refer` maps a reference name used
in `wires` to `{ type, where, ns, not }`, a description resolved against the state,
`not` listing ids it is not), `{ revise: { id, values } }` (a change to a told wire), `{
action, args, of }`, or `{ question }` (as for `query`).

Every scored candidate says whether it was judged and by what (`judged`, `judgedBy`):
`statement`, `action` (a declared action, tried), `question`, or, for an action the matrix
does not declare (the host carries it out), a fallback with what the matrix does know:
`referents` (every `$id` argument is a wire), `slots` (the arguments, as keys of `of`,
by default the type named like the action, or as `type.key` names, told as a wire of
that type, fit their slots' kind, enum and range; required keys not given lack, with
their `ask`),
`denies` (no deny fires with that wire). `judgedBy` is the test that refused, or
`fallback` when all that could run passed (`checks` lists them); with nothing to check,
`judged` is false. `veto` does not report `action-unavailable` for a reading the fallback
judged. Returns `{ candidates, order }`;
each scored candidate has `ok`, `violations`, `referents` (`{ name, ids, unique, fits }`:
`fits` are the ids that keep the statement consistent when the description alone is
ambiguous), `lacks` (referents nothing matches, required keys still open, missing
arguments, a told subject of a question that is not there; not the value a question
asks for, on a subject that is there or on a computed one the matrix has not made yet; a
question may be given as an object, a `core.question` wire or its text), `assumes` (defaults the statement would rest on), `action` (`{ available,
status, missing }`), `answer`, `words` (for candidates from `interpret`), and its place:
`place`, `why`, and for a loser `lostTo` and `on`. `order` is best first by `rank` (below);
option `criteria` replaces the default ones. See
[design/formalization](design/formalization.md).

```js run
const w = new World();
w.load(`@k core.slot of=meeting key=with type=person required=true
  @m meeting with=$busy day=?d  @busy person name=?n off=?d
  @x core.deny when=$m when=$busy why="?n is off on ?d"`);
w.tell('@p1 person name=ann off=mon  @p2 person name=bob');
const r = w.score([{ wires: '@m meeting with=$who day=mon', refer: { who: { type: 'person' } } }]);
print(r.candidates[0].ok, r.candidates[0].referents[0].fits, w.has('m'));
```

```output
true ["p2"] false
```

### PatternIndex

`new PatternIndex(patterns, { normalize })` indexes a host's sentence patterns by the
words they need, so its matcher tries only the patterns a sentence can match. A pattern
is `{ id, kind, needs }` plus anything of the host's (handed back as given): `needs` is a
list of word sets, one word of each set must be in the sentence (a literal is a set of
one, an alternative a set of several; leave out what is optional and the slots). A
pattern that needs no word is tried on every sentence. `candidates(tokens, { kind })`
returns the patterns every set of which meets the sentence, in the order they were added
(so a host's priority order holds); `add(pattern)` adds one later; `stats()` says
`{ patterns, words, open, perSentence }`. Each pattern is kept under its rarest set, which
does not change the answer, only the work. The matching itself stays the host's; words
are lowercased unless `normalize` says otherwise. `node bench/patterns.mjs`: 3,000
synthetic patterns, 1,000 sentences, 51.5 handed out per sentence instead of 3,000.

```js run
const ix = new PatternIndex([
  { id: 'draw', kind: 'do', needs: [['draw', 'paint']] },
  { id: 'move', kind: 'do', needs: [['move', 'put'], ['left', 'right']] },
  { id: 'hangman', kind: 'do', needs: ['hangman', ['word', 'letter']] },
]);
print(ix.candidates('Paint it, then move it right'.replace(',', '')).map((p) => p.id), ix.candidates('hangman cat').length);
```

```output
["draw","move"] 0
```

### schemaCard(world, name?), schemaExamples(world, name?, options?), actReply(world, request, result)

What a host needs to read and to speak about worlds declared with
[std.schema](reference.md#stdschema-and-stdacts-worlds-that-do-things-declared-as-data),
generated from the schema, in plain English (hosts translate). `schemaCard` gives each
world (or one) as `{ world, doc, kinds }`, each kind with its `words` (`core.word means=`
the kind, else its name), `acts`, `attrs` (name, kind, values, min, max, step, default,
required, refers) and `limit`; a world that takes any kind of a knowledge type has a kind
`*` with `open` and `from`. `schemaExamples` gives sentences per act and kind with the
request each should become (`{ world, act, kind, text, request }`; `per: 2` adds a second
for make). `actReply` gives the reply for an act from its result: what was done (with the
old value, from `diff`), or why not and what is possible (from `reason`: the attributes
the kind has, the kinds that have the attribute, what the kind allows and where the act
works, which thing was meant). `actReply(world, request, result, { templates })` writes
in the host's words: a template per act and kind (`'change.seat'`, then `'change'`; for a
refusal `'refused.change.seat'`, `'refused.change'`, `'refused'`), a string with `{thing}`,
`{name}`, `{kind}`, `{attr}`, `{value}`, `{from}`, `{to}`, `{why}`, or a function of those;
with no template for the case, the plain English default. Pass it to `turn` as `reply`.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @face std.schema.world name=face
  @t core.type of=eye extends=std.schema.thing closed=true
  @s core.slot of=eye key=colour enum=brown enum=blue default=brown
  @k std.schema.kind of=eye world=face acts=make acts=change`);
print(schemaExamples(w).map((e) => e.text));
const req = { action: 'make', args: { kind: 'eye' } };
print(actReply(w, req, w.act(req)));
const bad = { action: 'change', args: { thing: 'eye', attr: 'size', value: 3 } };
print(actReply(w, bad, w.act(bad)));
```

```output
["make an eye","make the colour of the eye blue"]
I made an eye (eye1).
I can't change the size of an eye: an eye has no size. An eye has colour.
```

### createCatalog(options) and bundleReader(bundle)

Loading knowledge worlds by lookup. `createCatalog({ index, vocab, read, cache, lemma })`:
`index.worlds` lists each world's `schema`, `depends` and `shards` (`{ id, path }`), as in
sop-knowledge-worlds' `index.json`; `vocab` maps a word to shard ids (`vocab.json`);
`read(path)` is the host's (a file, `fetch`, a bundle; a promise or a text); `cache` is any
`{ get, set }` (a Map by default); `lemma(word)` gives other forms to look up (none by
default). `shardsOf(word)` lists the shards (nothing read); `plan(shards)` the paths to
tell, schemas of the worlds and of what they depend on first; `fetch(word)` reads them;
`into(world, word)` tells them (schemas once per world) and resolves to `{ shards, told,
ok, violations }`; `intoSync` does the same when `read` answers at once. A failed read is
not remembered. `bundleReader({ files })` reads a bundle written by
`node tools/build-bundle.mjs <catalog dir> <out.json> <word|shard|world> ...`.

```js run
const index = { worlds: [{ id: 'k.t', schema: 'k.t/schema.sop', shards: [{ id: 'k.t/a', path: 'k.t/a.sop' }] }] };
const cat = createCatalog({ index, vocab: { cup: ['k.t/a'] }, read: bundleReader({ files: { 'k.t/schema.sop': '@k core.slot of=k.thing key=name id=true', 'k.t/a.sop': '@c k.thing name=cup' } }) });
print(cat.shardsOf('cup'), cat.plan(cat.shardsOf('cup')), cat.intoSync(new World(), 'cup').ok);
```

```output
["k.t/a"] ["k.t/schema.sop","k.t/a.sop"] true
```


### bundleThenRead(bundle, read), listOf(world, type, slot?, value?), loadBundles(world, bundles)

Knowledge readers every host needs. `bundleThenRead` is a `read(path)` for a catalog that
answers from a bundled subset at once and asks `read` for the rest, so the first paint
needs no network; `.reachable()` says whether the catalog answered the last time.
`listOf` gives the names (or ids) of the loaded wires of a type, optionally those whose
`slot` has `value`. `loadBundles` tells `bundles[name]` once into a world for each
`std.schema.world ... bundle=<name>` (a world-level bundle) and returns the names told.
A catalog also looks a word up once, and finds a form its vocabulary lacks through a loaded
`core.word` (`ants` means `ant`) when given the world (`into`, `intoSync`).

```js run
const read = bundleThenRead({ files: { 'a.sop': '@ant k.animal name=ant legs=6' } }, () => null);
const w = new World();
w.load('@z std.schema.world name=zoo bundle=insects');
loadBundles(w, { insects: read('a.sop') + '\n@bee k.animal name=bee legs=6 flies=yes' });
print(listOf(w, 'k.animal'), listOf(w, 'k.animal', 'flies', 'yes'), read('b.sop'), read.reachable());
```

```output
["ant","bee"] ["bee"] null false
```

### createCatalogs(list, options?)

Several knowledge repositories at once, in an order of precedence: `list` is
`[{ name, index, vocab, read, cache? }]` (each as `createCatalog`; `options.lemma` is
shared), and the first catalog wins. `shardsOf(word)` gives `"<name>:<shard>"` from every
catalog that has the word. `into(world, word)` tells them catalog by catalog (`intoSync` when every `read` answers at once). Each wire
keeps its catalog in its source (`core.source="<name>: <source>"`). A wire that another
catalog already told, under the same id or as a fact of the same type about the same
`name`, is told only if it has the same values. If not, it is reported in `conflicts`
(`{ id, kept, dropped, path, keys }`) and the first catalog's version stays. `std.know.fill`
and typed needs then read what was kept.

```js run
const files = (shard) => ({ 'k.f/schema.sop': '@s core.slot of=k.f key=name id=true', 'k.f/s.sop': shard });
const cat = (name, shard) => ({ name, index: { worlds: [{ id: 'k.f', schema: 'k.f/schema.sop', shards: [{ id: 'k.f/s', path: 'k.f/s.sop' }] }] },
  vocab: { sofa: ['k.f/s'] }, read: bundleReader({ files: files(shard) }) });
const cats = createCatalogs([cat('one', '@a k.f name=sofa w=200'), cat('two', '@b k.f name=sofa w=210')]);
const w = new World();
const r = cats.intoSync(w, 'sofa');
print(r.conflicts.map((c) => [c.id, c.kept, c.dropped, c.keys]), w.ofType('k.f').map((x) => x.attrs.w[0]));
```

```output
[["b","one","two",["w"]]] ["200"]
```
### turn(world, readings, options?)

One request, end to end. `readings` are the candidate readings of one message, best
first: each a request `{ action, args }`, a list of requests (one sentence), or
`{ requests }`. Each is tried on a fork (nothing changes); the first the world takes is
applied as one sentence (all or nothing, one undo step) and the result has `status:
'done'`, `reading` (its index), `results`, `diff`, `why` (the chain of each changed
value), `guesses` (values filled by tiers, with their source) and `replies` (from
`actReply`, or `options.reply`). Otherwise a graded fallback: `ask` (a reading only lacks
an argument: `question`, `missing`), `elsewhere` (the kind is known but the act or the
attribute is not here: the reply says what it can do and where), `unknown` (the best
guess named in a `question`). Every result but `nothing` has `replies` (for `ask` and
`unknown`, the question), and lists the readings `dropped` with the reason.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @plan std.schema.world name=plan
  @t core.type of=chair extends=std.schema.thing closed=true
  @s core.slot of=chair key=colour enum=red enum=blue default=blue
  @k std.schema.kind of=chair world=plan acts=make acts=change`);
const t = turn(w, [{ action: 'make', args: { kind: 'table' } }, { action: 'make', args: { kind: 'chair', colour: 'red' } }]);
print(t.status, t.reading, t.replies, t.dropped[0].violation.why);
print(turn(w, [{ action: 'make', args: { kind: 'sofa' } }]).question);
```

```output
done 1 ["I made a chair (chair1)."] no world here has a table
Did you mean to make sofa? (no world here has a sofa)
```

### route(world, request, options?)

The world for a request, among the worlds declared with std.schema: each scored by its
card (it has the kind, or takes any kind of a catalog: +2; it allows the act: +1), by the
thing named (one of its things: +2), by a dry run (the act would be refused: −2), and by
the host's own signal per world (`scores`, an encoder's for instance). Best first, each
with the reasons: `[{ world, score, why }]`.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @a std.schema.world name=garden
  @b std.schema.world name=kitchen
  @t1 core.type of=rose extends=std.schema.thing closed=true
  @t2 core.type of=pot extends=std.schema.thing closed=true
  @k1 std.schema.kind of=rose world=garden acts=make
  @k2 std.schema.kind of=pot world=kitchen world=garden acts=make`);
print(route(w, { action: 'make', args: { kind: 'rose' } })[0], route(w, { action: 'make', args: { kind: 'pot' } }, { scores: { kitchen: 1 } })[0].world);
```

```output
{"world":"garden","score":3,"why":["has rose","allows make"]} kitchen
```

### schemaGrid(world, name?, options?) and gridTests(cases, options?)

The coverage grid: for every world × kind × act the schemas allow, the example request
(`schemaExamples`) run on a copy of the world that holds one thing of each kind, with what
came of it in `expect`: done, with the kinds added, the number removed and the keys
changed; or not, with the reason (the holes are the cases not done). `gridTests(cases, {
importFrom, make })` writes a node:test file that runs each case again on `make()` (a
function the host exports from `importFrom`) and checks it.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @face std.schema.world name=face
  @t core.type of=eye extends=std.schema.thing closed=true
  @s core.slot of=eye key=colour enum=brown enum=blue default=brown
  @k std.schema.kind of=eye world=face acts=make acts=change
  @l std.schema.limit of=eye max=1`);
print(schemaGrid(w).map((c) => [c.text, c.expect.ok ? c.expect.changed : c.expect.why]));
```

```output
[["make an eye","at most 1 eye"],["make a blue eye","at most 1 eye"],["make the colour of the eye blue",["colour"]]]
```

### ledgerAppend, ledgerGroups, ledgerKey, stageOf, STAGES

A failure ledger: a failing case is data. A row is `{ text, world, language, happened,
expected, stage, class, source, first_seen, build, was_passing }`; `ledgerKey` is its
source, text and world. `ledgerAppend(rows, add)` gives the rows of `add` that are new
(old rows are never rewritten or added again). `ledgerGroups(rows, { signals, examples })`
groups by `stage` (one of `STAGES`: reading, routing, filling, acting, replying), `class`
and the first of the host's cause signals (`[name, row => boolean]`) that holds, largest
first, with examples spread over sources. `stageOf(turnResult)` files a failed `turn`.
On disk: `node tools/ledger.mjs add <ledger.jsonl> <rows.jsonl>` and `node tools/ledger.mjs
report <ledger.jsonl> [--signals m.mjs] [--out r.md]`. `node tools/validate.mjs [--advise]
<files>` loads a world and lists what is refused, what is noted and the grid's holes.

```js run
const rows = [{ text: 'draw a cup', source: 'logs', stage: 'reading', class: 'miss' }, { text: 'a red one', source: 'logs', stage: 'filling', class: 'miss' }];
const more = ledgerAppend(rows, [{ text: 'draw a cup', source: 'logs' }, { text: 'paint a mug', source: 'pairs', stage: 'reading', class: 'miss' }]);
print(more.map((r) => r.text), ledgerGroups([...rows, ...more], { signals: [['a cup word', (r) => /cup|mug/.test(r.text)]] }).map((g) => [g.key, g.count]));
```

```output
["paint a mug"] [["reading / miss / a cup word",2],["filling / miss / other",1]]
```

### turnFlow(world, readings, options?)

`turn` with its path declared as data (`core.use world=std.turn`): the stages, their
order, their providers by tier and what an empty stage does are wires the application can
change by telling facts (see std.turn in the [reference](reference.md)). The providers are
functions `(ctx) => value` (nothing yielded: `undefined`); the library gives `given`,
`dryrun`, `apply`, `reply`, `fallback`, `confirm` (asks before an act on a whole set unless
`confirmed`) and `route` (fills the world of a make); the host adds its own in
`providers`. The result is `turn`'s, with `trace`: every stage taken, its provider, what it
yielded, why it yielded nothing, or why it was skipped. The declared default gives what
`turn` gives (tested on 30 requests).

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @t core.use world=std.turn
  @plan std.schema.world name=plan
  @c core.type of=chair extends=std.schema.thing closed=true
  @k std.schema.kind of=chair world=plan acts=make acts=remove
  @confirm std.turn.stage name=confirm before=apply on_empty=ask only=remove
  @pc std.turn.provider stage=confirm name=confirm`);
w.act({ action: 'make', args: { kind: 'chair' } }); w.act({ action: 'make', args: { kind: 'chair' } });
const t = turnFlow(w, [{ action: 'remove', args: { thing: 'chair', set: 'all' } }]);
print(t.status, t.question, t.trace.map((x) => x.stage));
```

```output
ask Remove all 2 chairs? ["read","dryrun","confirm"]
```

### parseText(world, text, options?), grammarOf(world, options?), nounPhrase(node, cats?)

The language-free part of reading: a grammar (a knowledge world about a language) holds the language as facts —
`g.word text= lemma= cat=` (more keys are features), `g.rule lhs= rhs= ...` (in order; `X?`
optional, `X*` any number, `X+` one or more), `g.coord word=` — and `parseText` reads text
with them: every complete parse of `start` (default `S`), best first (fewer nodes, then
the higher coordination), at most `max` (8). A node is `{ cat, span: [i, j], rule?, word?,
lemma?, feat?, children?, coord? }`; `rule` is the id of the rule that built it.

A grammar with names of its own says them in the options (they are the same for
`grammarOf`): `types: { rule, word, coord }` renames the three fact types; `classes: { DET:
'lang.det', ... }` makes each wire of a closed class a word of that category (its `text`,
its `value` as lemma, its other keys as features); `lexicon: { word: { cat, lemma? } }` is
the host's open classes (nouns, adjectives: the grammar owns none); `digits: 'NUM'` reads
digits as that category. In a rule, a lower-case or quoted part is a literal word,
`[all|each]` is one of several, a rule with `status=hole` is skipped, and `head=` names the
part the phrase is about. A text with `_` (`next_to`) is a word of several parts, read as
one token; `'s` is a token of its own. A left-recursive rule (`NP -> NP PP`) grows the
phrases found so far.

The result also says `tokens`, `unknown` (the words no lexicon entry, literal or digit
read: reported, never judged) and, past `budget` steps (20000), `truncated: true` with
what was complete by then: it never throws. `nounPhrase(node, cats)` reads a noun phrase
as `{ span, rule, quant, det, num, ord, name, pron, mods, head, lemma, pp, parts }` (a
coordination as `{ coord: [...] }`; `parts` are the phrases inside it of the same category,
such as the owner in "the house's door"); the category names are the grammar's (`cats`).
Verbs and argument frames are next (questions.md Q32).

```js run
const w = new World();
w.tell(`@a g.word text=two lemma=2 cat=Num  @b g.word text=red lemma=red cat=Adj  @c g.word text=cups lemma=cup cat=N
  @d g.word text=plate lemma=plate cat=N  @e g.word text=a lemma=a cat=Det
  @r g.rule lhs=NP rhs=Det? rhs=Num? rhs=Adj* rhs=N  @k g.coord word=and`);
print(nounPhrase(parseText(w, 'two red cups and a plate', { start: 'NP' })[0].tree).coord.map((x) => [x.num ?? x.det, x.mods, x.lemma]));
```

```output
[["2",["red"],"cup"],["a",[],"plate"]]
```

A grammar with its own type names, a closed class and a host lexicon:

```js run
const w = new World();
w.tell(`@d1 my.det text=the  @p1 my.prep text=next_to
  @r1 my.rule lhs=NP rhs=DET? rhs=N head=N  @r2 my.rule lhs=NP rhs=NP rhs=PP head=NP  @r3 my.rule lhs=PP rhs=PREP rhs=NP`);
const p = parseText(w, 'the star next to the house', { start: 'NP', types: { rule: 'my.rule' },
  classes: { DET: 'my.det', PREP: 'my.prep' }, lexicon: { star: { cat: 'N' }, house: { cat: 'N' } } });
const np = nounPhrase(p[0].tree, { det: 'DET', head: 'N', pp: 'PP' });
print([np.rule, np.head, np.pp[0].words, parseText(w, 'the moon', { start: 'NP', types: { rule: 'my.rule' }, classes: { DET: 'my.det' } }).unknown]);
```

```output
["r2","star",["next to","the","house"],[{"word":"moon","at":1}]]
```

### grammarCheck(world, options?)

Checks of a grammar that a host would otherwise find the hard way. It reports:
- `optional-shares-words`: an optional part right before a part that can read the same
  words. The chart keeps both readings, but a generated pattern would not.
- `lemmatised-away`: a lexicon word that `options.lemma` changes into a word the lexicon
  lacks.
- `too-many-words`: a lexicon entry longer than `options.maxWords`.

Parses are ranked so that order is data: the rules' `priority` first (a frame of the
world's own words declared above the generic act forms), then the literal words a parse
matched, then fewer nodes.

```js run
const w = new World();
w.tell('@r g.rule lhs=NP rhs=Kind? rhs=N  @a g.word text=borders lemma=border cat=N  @b g.word text=borders lemma=border cat=Kind');
print(grammarCheck(w).map((i) => [i.kind, i.optional, i.next, i.words]));
```

```output
[["optional-shares-words","Kind","N",["borders"]]]
```

### grammarView(world, type, view?), viewDiff(world, type, a, b)

A view is the set of wires of `type` whose `in=` names it; `grammarView` gives their
`text`s, sorted (every wire's without a view). Two callers that keep two lists of the same
words keep two views until their owner unifies them; `viewDiff` says which words differ,
so unifying is a measured decision.

```js run
const w = new World();
w.tell('@a x.det text=the in=v1 in=v2  @b x.det text=a in=v1  @c x.det text=every in=v2');
print(viewDiff(w, 'x.det', 'v1', 'v2'));
```

```output
{"only":{"v1":["a"],"v2":["every"]},"both":["the"]}
```

### resolve(world, phrase, options?)

The things a noun phrase names (`std.schema.thing` wires), and how sure the reading is.
`phrase` is text, read with `options.grammar` (parseText's options, start `NP`) and
`options.cats` (nounPhrase's), or a `nounPhrase` result. The kind is the head's lemma or a
word that means it (`core.word text= means=`), else a kind one swap or letter away (a
slip). Modifiers and a name are values of any key, and a `core.word ... of=<key>` word
counts for that key only. A PP narrows to things with a key that refers to the one thing
its noun phrase names. `quant` (all, each, both) and a phrase with no noun give the set.
An ordinal, or a number after the noun, picks one (the id `<kind><n>` first); a number
before the noun must be the count. A coordination is the union of its parts. A pronoun is
the newest thing in focus (`options.focus`, ids newest first, else the
`std.focus.last` wires that name things).

Also: a coordination whose word the grammar marks `kind=choice` (`x.coord word=or
kind=choice`) is asked, never both and never the last (`{ ids: [], ask: true, which }`).
A part without its noun borrows one: a bare number takes the noun of the part before
("tables 1 and 2"), any other part the noun of the next part ("the red or the blue
house"). A coordination inside a phrase is distributed ("red and blue cups"). A part of a
set (a number, quantifier or determiner with a PP and no noun: "two of the tables") is
the whole set when the count covers it, else asked. A modifier that `core.word` maps to
`std.other` ("the other one") keeps the things of the kind that are not in focus. A
pronoun also carries `guess: { word, ids }`, for the host's "I took it to mean ..."
sentence.

More of what it reads:
- A result that is not one reading carries `failure`: `unknown-word`, `unread`,
  `unknown-kind`, `none` (nothing fits), `no-number`, `no-focus` or `ambiguous` (also
  `ask: true`).
- A negation lead (the grammar's `cats.neg`, as in "not the blue table") keeps the things
  of the kind the modifiers do not pick.
- A relative clause after the noun ("the table that is red": a rule `NP -> NP RELPRON
  COP MOD`) folds into the modifiers.
- A bare name (`NP -> NAME`) is the one thing of that name.
- `focusFor: 'pronoun'` keeps the focus for pronouns only.
- Coordinating words are read from `word=` or `text=`.

Returns `{ ids, tier, how }`: `tier` is `user` (the words picked), `scene` (the only one of
its kind), `focus` (the focus chose among several) or `slip` (the least sure in a
coordination wins); `how` lists the steps, so a reply can say what it assumed. When it
cannot resolve, it returns `{ ids: [], why, which?, kind?, unknown? }`.

```js run
const w = new World();
w.tell(`@d x.det text=the  @r x.rule lhs=NP rhs=DET? rhs=MOD* rhs=N  @c x.coord word=and
  @t1 std.schema.thing kind=table color=red  @t2 std.schema.thing kind=table color=blue  @l std.schema.thing kind=lamp
  @syn core.word text=desk means=table`);
const opt = { grammar: { types: { rule: 'x.rule', coord: 'x.coord' }, classes: { DET: 'x.det' },
  lexicon: { desk: { cat: 'N' }, lamp: { cat: 'N' }, blue: { cat: 'MOD' } } }, cats: { det: 'DET', mod: 'MOD', head: 'N' } };
print(resolve(w, 'the blue desk and the lamp', opt));
print(resolve(w, 'the desk', { ...opt, focus: ['t1'] }).tier);
```

```output
{"ids":["t2","l"],"tier":"scene","how":["\"desk\" means table","blue: 1 left"]}
focus
```

### segment(world, text, options?) and actWords(world, extra?)

One segmenter that knows the act forms: a message cut into clauses, one act each. A
joiner (`options.types.joiner`, default `g.joiner`: wires with `text`, `cut`, `card_cut`)
cuts only when an act word starts what follows it. So "add a box and connect it to the
shelf" is two clauses, while "make a cup, a plate and a bowl" and "ann, bob and cy" stay
one. A run of joiners is one ("and then"). A comma right after a frame lead
(`options.types.frameLead`, default `g.frame_lead`: "from now on,") never cuts.
`actWords` gives the act words: the matrix's action names, the `core.word` texts that mean
one, and `extra` (`options.acts`). Returns `[{ text, from, to, joiner? }]` (token
positions). No language is built in: the joiners and leads are a language world's facts.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts  @j g.joiner text=and cut=yes card_cut=yes  @c g.joiner text="," cut=yes card_cut=yes
  @v core.word text=add means=make`);
print(segment(w, 'add a box and connect it to the shelf').map((c) => c.text), segment(w, 'make a cup, a plate and a bowl').length);
```

```output
["add a box","connect it to the shelf"] 1
```

### dialogueTurn(world, text, options?) and focusLog(world, dialogue?)

The kind of one turn, from the cue phrases the host names (`std.dialogue.cue kind= text=`,
with `core.use world=std.dialogue`, or a language world's facts mapped by type in
`options.cues`) and from the world's act words:
- `why`, `correction` (it replaces the last act), `continuation`;
- `list` (several things and no act), `ellipsis` (a thing and no act);
- `answer` (a reply, when `options.asked`), `request`.

`act` is the action carried over from `options.last`, and `rest` is the text after the cue.
A world declared modal and active (`std.dialogue.modal world= active=true`) is named in
`first`: it sees the turn before the others. `focusLog` lists what each turn of a dialogue
mentions, in order (std.focus wires). Every context hook a host registers
(`register('context', ...)`) is copied on fork, so a dry run sees what the real run sees.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts  @d core.use world=std.dialogue
  @c std.dialogue.cue kind=correction text="no wait"`);
const last = { action: 'make', args: { kind: 'circle' } };
print(dialogueTurn(w, 'no wait, a blue one', { last }), dialogueTurn(w, 'a square, a star', { last }).kind);
```

```output
{"kind":"correction","rest":"a blue one","cue":"no wait","act":"make"} list
```

### morphOf, generate, analyse, fold, splitClitics, dictionary, realise, templateFor

Morphology for language worlds (std.morph). The primitives are the same for every
language and run in both directions; nothing here knows a language.

A language world declares (type names can be changed with `morphOf(world, { types })`):
- paradigm classes: `m.class name= parent=? drop=? alt=<from>><to>`. A class inherits its
  parent's cells and overrides some; `drop` is what the lemma loses to give the stem;
  `alt` is a stem alternation, `from>to`, optionally anchored with `@vowel` (the stem's
  last vowel, from `m.vowel text=`) or `@end`. A cell may give its own ordered list
  (`alt=a>ă@vowel alt=t>ț@end`: several places at once) or `alt=yes` (the class's list).
- cells: `m.ending class= suffix= alt=yes? <feature>=<value>...`, where `suffix=_` means
  none.
- `m.irregular lemma= form= <features>` (consulted first), `m.fold from= to=` (spelling
  variants, such as diacritics), `m.split text=` (clitic joiners) and `m.template act=
  shape=? text=` (realisation).

The functions:
- `morphOf(world)` compiles these once, with a suffix index.
- `generate(m, lemma, class, features)` gives a form.
- `analyse(m, form, { dictionary })` gives `[{ lemma, class, features, form, exact }]`.
  It looks up the suffix index and checks each candidate by generating it again, so no
  form list is stored. With a dictionary it keeps only lemmas the dictionary has, in their
  class, and a folded spelling finds the lemma with its diacritics.
- `dictionary({ read, prefix, fold })` is the external lexicon: one row per lemma,
  `lemma<TAB>class<TAB>gender?<TAB>sense?`, split into files by the first `prefix` letters
  and read lazily, one file when a word needs it.
- `realise(m, template, roles, { dictionary, base })` fills `{role}`, `{role:f=v,...}`
  (that cell) and `{role@other}` (agreement with another role through unification of their
  feature bundles).
- `splitClitics(m, word)` splits a word at the clitic joiners.

```js run
const w = new World();
w.tell(`@c m.class name=n2 drop=a  @e1 m.ending class=n2 num=sg suffix=a  @e2 m.ending class=n2 num=pl suffix=e
  @c2 m.class name=a1  @a1 m.ending class=a1 gender=f num=sg suffix=a  @a2 m.ending class=a1 gender=m num=sg suffix=_
  @t m.template act=make text="made {thing:num=sg} {colour@thing}"`);
const m = morphOf(w);
const d = dictionary({ read: (p) => ({ k: 'kata\tn2\tf', r: 'rum\ta1' })[p] ?? null });
print(generate(m, 'kata', 'n2', { num: 'pl' }), analyse(m, 'kate', { dictionary: d }).map((x) => [x.lemma, x.features.num]),
  realise(m, templateFor(m, 'make'), { thing: 'kata', colour: 'rum' }, { dictionary: d, base: { num: 'sg' } }));
```

```output
kate [["kata","pl"]] made kata ruma
```

### motionPlan(world, events, options?) and motionRun(plan, apply, clock?)

States over time from rules (std.motion), for anything that changes by rules: a face that
blinks and talks, a drawing that moves, a diagram that highlights its steps. The rules
are facts:
- `mo.base key= value=`;
- `mo.rule name= on=<event>? when.<field>=<v>? priority=<n>? repeat=<min>-<max>? ease=<ms>?
  split=<splitter>? else=<value>?`;
- `mo.step rule= n= key= value=? dur=<min>-<max> per=unit?`;
- `mo.class rule= unit= value=` (a unit of a stream to a state).

`motionPlan` is pure and seeded: the same seed gives the same plan, `[{ t, key, value }]`
from 0 to `until`. `events` are `[{ t, type, fields?, stream? }]`. On a key, a higher
priority wins over a lower one while both hold it; other keys go on. A new event of the
same rule cancels what was left of the earlier one, and `ease` returns the keys to base. A
`per=unit` step plays one state per unit of the event's stream; the unit splitter is the
rule's parameter (`options.splitters`), supplied by the host or the animation world.
`motionRun` plays a plan through the host's clock and returns `cancel()`.

```js run
const w = new World();
w.tell(`@b mo.base key=light value=red  @r mo.rule name=go on=button
  @s1 mo.step rule=go n=1 key=light value=green dur=3000  @s2 mo.step rule=go n=2 key=light value=amber dur=1000`);
print(motionPlan(w, [{ t: 500, type: 'button' }], { until: 6000 }).map((p) => [p.t, p.value]));
```

```output
[[0,"red"],[500,"green"],[3500,"amber"],[4500,"red"]]
```

### planner(store, options?), factStore(worlds), PlanLive, readMethods, PLAN_LIMITS

std.plan: goals reached by methods that are knowledge (`k.procedures`, in the format of the
knowledge repository's Q44), decomposed into acts over a live world. `factStore(worlds)`
reads published worlds (`[{ id, schemaText, shards: [{ text }] }]`) into facts merged by
identity, read lazily per type. `planner(store, { chain, prefix, roles })` reads the methods
(`readMethods`). `chain` is `[{ type, keys }]`, what "is a kind of" is, or the store's
`std.know.chain of= key=` facts. `plan(goal, live)` takes a goal `{ act, roles }` and a
`PlanLive` (a working copy of the live world: things, history, the world schema's kinds).

The plan returns:
- `method`, `methods` (every method used, in order);
- `lines` (one per act), `explain` (one short line per step: the method, what the step
  is for, the act);
- `requests` (role-named requests for std.acts), `skipped`, `effects`;
- or `asks` (a needed role missing), or `refused` with `tried` (each alternative and why
  it failed); `truncated` past `PLAN_LIMITS`.

Alternatives are chosen by goal fit, world, preconditions, then rank, then name.
Decomposition goes to depth 3, never into the same method, with at most 200 acts.

**Choice points** (Q57). A binding with `choose=` (a number or a binding that gives one)
and `choose_min=` is a choice point.
- The choice points of a method are solved jointly before its steps, with `solveChoices`:
  one slot per value, the slots of a binding made in order and different, every hard
  match checked as soon as what it reads is chosen.
- Matches may read one key several times (`n=` tells them apart):
  - `differs=` names a binding whose values must not be shared, or the binding itself
    for values different among its own;
  - `soft=true` only doubles the weight of a candidate that holds it;
  - a binding's matches hold on every source, `together` included.
- `about=` gives the statements of the catalog about a binding's things, for the types
  in `planner`'s `about` option.
- `seed` sets the draw, and `chooseLimit` bounds the search (default 200,000 nodes).
- The plan says what was chosen in `chosen`, or refuses when no choice satisfies the
  matches.

```js run
const ids = { method: ['name'], goal: ['method', 'role'], binding: ['method', 'name'], step: ['method', 'n'], arg: ['method', 'step', 'role'] };
const schema = Object.entries(ids).flatMap(([t, keys]) => keys.map((k, i) => `@${t}${i} core.slot of=k.procedures.${t} key=${k} id=true`)).join('\n');
const facts = `@m k.procedures.method name=pair about="two of a kind" act=make  @g k.procedures.goal method=pair role=kind
  @b k.procedures.binding method=pair name=k goal=kind  @s1 k.procedures.step method=pair n=1 act=make  @a1 k.procedures.arg method=pair step=1 role=kind binding=k
  @s2 k.procedures.step method=pair n=2 act=make after=1  @a2 k.procedures.arg method=pair step=2 role=kind binding=k`;
const store = factStore([{ id: 'k.procedures', schemaText: schema, shards: [{ text: facts }] }, { id: 'k.actions', schemaText: '', shards: [] }]);
const r = planner(store).plan({ act: 'make', roles: { kind: 'sock' } }, new PlanLive({ store }));
print(r.method, r.lines, r.requests[0]);
```

```output
pair ["make kind=sock","make kind=sock"] {"action":"make","args":{"kind":"sock"}}
```

### readMotion(world, options?), planMotionFacts(motion, options?), splitText(splitter, text)

The full motion format, as the knowledge repository publishes it in `k.motion` (one
format, one scheduler). `readMotion(world, { prefix, style })` reads the facts. The type
names sit under `prefix` (default `k.motion`); `style` chooses the visemes. The facts are:
- layers with priorities over keys;
- rules: `on` an event, or `repeat` (min, max) with a `chance`; `during` / `not_during`
  other layers; `until` events that cancel them; `emits` an event when done;
- conditions on the event's fields, or on a feature of the shown value;
- steps with onset, hold and back ranges, `hold_until` an event, `with` another step,
  `per` a field of the event split by a splitter;
- sets with an optional `via`, visemes, and splitters with letter classes.

`planMotionFacts(motion, { events, seed, end, base, features, aliases, splitters, keys })`
is pure and seeded. It returns `{ segments, instances, emitted, stateAt(t), changes }`:
- `segments` have onset and back ramps, for hosts that blend, and `via`, for hosts that
  only switch;
- `changes` are the switch points;
- `base` is the host's current state.

A cancelled step eases back from where it is, and a repeat waits from the end of its last
run. A named host function in `splitters` overrides a splitter of the facts.
`splitText` applies a splitter. `motionRun` plays `changes` like any plan. The `mo.*` form
(`motionPlan`) stays as the minimal one.

```js run
const w = new World();
w.tell(`@l k.motion.layer name=idle priority=1 key=eyes about=x
  @r k.motion.rule name=blink about=x layer=idle repeat_min=3000 repeat_max=3000
  @s k.motion.step rule=blink n=1 about=x onset_min=0 onset_max=0 hold_min=150 hold_max=150 back_min=0 back_max=0
  @v k.motion.set rule=blink step=1 key=eyes value=closed`);
print(planMotionFacts(readMotion(w), { end: 7000, base: { eyes: 'open' } }).changes.map((c) => [c.t, c.value]));
```

```output
[[0,"open"],[3000,"closed"],[3150,"open"],[6150,"closed"],[6300,"open"]]
```

### sample(world, options?) and diversity(frames)

Random but relevant commands, legal in the current state: frames (`{ action, args, world,
why }`, language-free). The parts come from the worlds:
- the acts each kind allows (`std.schema.kind`);
- the slots' enums, ranges and joins to knowledge (`type=T by=k`);
- the open kinds of a catalog (`std.schema.kinds from=`);
- the things there (remove, change and ask need one) and the history (undo needs a step).

Weights: `prefer` (a world, a thing), recency (newer things), novelty (acts and kinds used
less in this session: the history of acts and `options.seen`), and chance. It is seeded.
Every frame works (a dry run). With `realise(frame) → text` and `read(text) → frame` (the
host's language world), only frames that read back are kept; `roundTrip` gives the rate.
Modes: `one` (a dice), `few` (3 or 4), `actions` (the acts that fit `prefer.thing`, for
buttons). `diversity` counts the distinct acts, kinds and attributes.

A kind declared with `needs=` (for example `needs=text`) is made only when `fillers`
has a filler for each need (`fillers: { text: (kind, rand) => ... }`). Sample never draws
a make it cannot fill.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts  @art std.schema.world name=art
  @t core.type of=shape extends=std.schema.thing closed=true  @s core.slot of=shape key=colour enum=red enum=blue
  @k std.schema.kind of=shape world=art acts=make acts=change acts=remove`);
print(sample(w, { seed: 1, n: 2 }).frames.map((f) => f.action));
w.act({ action: 'make', args: { kind: 'shape' } });
print([...new Set(sample(w, { mode: 'actions', prefer: { thing: 'shape1' }, seed: 2 }).frames.map((f) => f.action))].sort());
```

```output
["make","make"]
["change","remove"]
```

### actsOf(world), summarizeLog(entries, options?), summarizeText(text, options?), overlap(summary, reference)

Summaries with no model (std.summarize). `actsOf` reads a world's history into acts,
`[{ act, kind, things, step }]`. `summarizeLog(entries, { parentOf, length })` aggregates
by act and kind, generalises siblings up the chain of kinds (`parentOf`, as std.know or a
planner gives it: cat, dog and horse become 3 animals), keeps failures, and orders by
salience (changes, repetition, recency, failure). It gives frames for the language world
to render: `line` keeps 1, `paragraph` 3, `bullets` all. With `failed: 'separate'`, what
failed is a list of its own (`result.failed`), never mixed with what was done. `summarizeText(text, { n, words, stop,
redundancy })` is extractive. A sentence ends at a stop before a capital, a quote or a
parenthesis, but not after an abbreviation ("Sec. 219"). It scores sentences by centrality (the content words they
share with the others), information (numbers, names) and position, drops a sentence that
repeats a kept one, and keeps the top `n` in their order. With a budget of `words` instead, it keeps
sentences while they fit, never going over the budget. The content words are found
without a language (`stop`, or the words most sentences share). `overlap` is unigram
recall against a reference.

```js run
const parentOf = (k) => (['cat', 'dog'].includes(k) ? 'animal' : null);
print(summarizeLog([{ act: 'make', kind: 'cat' }, { act: 'make', kind: 'dog' }, { act: 'remove', kind: 'tree' }], { parentOf, length: 'bullets' }).map((f) => [f.act, f.kind, f.count]));
```

```output
[["make","animal",2],["remove","tree",1]]
```

### placeFor(world, size, at?, options?), boxesOf(world), relationsOf(world, kind?)

Single placement (std.space), so a host drops its own placement code. Things are boxes
(`x y w h` on std.schema things). `placeFor(world, { w, h }, at, { frame, gap, except })`
gives `{ x, y, how, overlaps? }` for one thing:
- relative to another thing: `at = { rel, ref }`, with `rel` one of left_of, right_of,
  above, below, near (the first free side), on, in;
- inside a named region: `at = { region }`, from `std.schema.region name= x y w h`;
- with no `at`, the first free spot of the frame.

Every spot avoids the other boxes when it can, and says `overlaps` when it cannot.
`relationsOf` lists the relation kinds a schema declares (`std.schema.relation name=
kind=spatial|containment|flow inverse=?`). `connect ... rel=` refuses a relation the
schema does not declare, when it declares some. A word for a relation is a `core.word`
that means the relation's name, kept apart from the words of attributes.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts  @p std.schema.world name=p  @t core.type of=box extends=std.schema.thing
  @x core.slot of=box key=x kind=number  @y core.slot of=box key=y kind=number  @w core.slot of=box key=w kind=number  @h core.slot of=box key=h kind=number
  @k std.schema.kind of=box world=p acts=make`);
w.act({ action: 'make', args: { kind: 'box', x: 40, y: 40, w: 20, h: 20 } });
print(placeFor(w, { w: 10, h: 10 }, { rel: 'right_of', ref: 'box1' }), placeFor(w, { w: 10, h: 10 }));
```

```output
{"x":62,"y":45,"how":"right_of"} {"x":0,"y":0,"how":"default"}
```

### compose(world, topic, options?) and interestOf(world, fact, options?)

A composition of a genre about a topic, from knowledge, with no model (std.compose, first
version). The genre gives the moves of a section (`k.genres.genre name= move=...`): the
first opens, the last closes, the middle ones take turns. The outline is the topic's
relations: the facts that name it, grouped by type. Relations that can fill a chapter come
first, then the most interesting. Every sentence cites its wire, and no fact is used twice.
The size `{ chapters, sections, sentences }` is a budget set before selection; what the
knowledge cannot fill is listed in `short`. The output is frames (`{ move, fact, about,
cites }`) for the language world to realise (`realise(frame)`).

`interestOf` is the arithmetic of the world's `k.interest` (published by the knowledge
repository): each feature adds `weight × share` to its appraisal, by its shape over a
measure, and the score is novelty × coping × relevance − penalty. A weight is the middle
of its range, or drawn inside it with `draw: seed`. The library computes the measures it
can from facts (`measuresOf`): world and topic distance by joins of names, contrast with
siblings, distance from the typical range, extremes, numbers with units, animacy,
obviousness, said before, the same move again, items since the last point. The host gives
the rest, or overrides any, in `measures`. Without a `k.interest` model the score is 0,
with `why`.

```js run
const w = new World();
w.tell(`@a k.interest.appraisal name=novelty combine=multiply base=0
  @b k.interest.appraisal name=penalty combine=subtract base=0
  @f k.interest.feature name=sibling_contrast appraisal=novelty measure=sibling_contrast shape=rising start_at=0.5 full_at=0.9 weight_min=0.4 weight_max=0.6
  @r1 k.animal name=robin kind=bird fly=yes  @r2 k.animal name=crow kind=bird fly=yes
  @r3 k.animal name=gull kind=bird fly=yes  @p k.animal name=penguin kind=bird fly=no`);
print(interestOf(w, w.get('p')).by, interestOf(w, w.get('r1')).score);
```

```output
{"sibling_contrast":0.5} 0
```

### compose by a published genre (k.genres)

When the world holds the knowledge repository's `k.genres` and `genre` names one of its
genres, `compose` lays the text out by it:
- parts in order, each repeated between `min` and `max` times;
- the steps of each part in order; several steps at one place are alternatives;
- sentences per step: the minimum, and more while `size.sentences` and the facts allow;
- every frame carries the step's tense (else the part's, else the register's); the register
  (person, tense, sentence lengths in words) is in `register`.

The choice points are solved jointly with `solveChoices`: how many times a repeated part
occurs, which relation each occurrence takes, and the move at each place with
alternatives. The constraints: no relation twice; a relation holds the facts its steps
need at their minimum (when no layout allows that, it is relaxed and said in `short`); a
compare move needs two facts. Interest weights the draw. Then the sentences are filled.
- `takes=topic` cites the topic.
- `outline` lists the relations of the repeated parts.
- `fact`, `facts` and `question` take a fact by interest, never one twice.
- A `facts` move after the repeated parts (a summary) restates their claims (`recalls`).
- `story` moves are left to `k.story`.
- A counterargument (or a rebuttal) needs a real contrast: a fact that differs from what its
  siblings say. Without one the move is left out, and `short` says so.
- Keys in `quiet` (and keys the knowledge marks `k.attributes.key name= narrate=no`) are
  never narrated.
- No sentence is said twice in a document.
The result is `{ genre, register, topic, parts: [{ part, heading?, layout?, relation?,
moves: [frame] }], choices, nodes, short? }`. A small genre written in the k.genres
format, made up for this example:

```js run
const w = new World();
w.tell(`@g k.genres.genre name=note  @m1 k.genres.move name=open takes=topic  @m2 k.genres.move name=tell takes=fact
  @p1 k.genres.part genre=note name=head n=1 min=1 max=1  @s1 k.genres.step genre=note part=head n=1 move=open min=1 max=1
  @p2 k.genres.part genre=note name=point n=2 min=1 max=2  @s2 k.genres.step genre=note part=point n=1 move=tell min=1 max=1
  @owl k.animal name=owl  @a k.diet about=owl eats=mice  @b k.home about=owl lives=barn`);
print(compose(w, 'owl', { genre: 'note' }).parts.map((p) => [p.part, p.relation ?? '', p.moves.map((m) => m.cites)]));
```

```output
[["head","",["owl"]],["point","k.home",["b"]],["point","k.diet",["a"]]]
```

### storyState(text, options?)

A story, then a question (abstraction round, item 6). The referents of a story and its
arithmetic frame stay in focus, and a following question is read against them.
- Each sentence changes the quantity an owner holds: a name, or a pronoun for the last
  owner; a number; an item.
- The verb's effect is data: `verbs` maps a word to `set`, `add`, `remove` or `give`, and
  `give` moves the quantity to the other name.
- A question asks what an owner holds, or all owners together (`all`).
- `numbers`, `pronouns`, `question` and `skip` come from the host or its language world.

The result is `{ state, steps, answers: [{ question, answer, owner?, item, why }],
unread }`. A sentence it cannot read is listed, never guessed.

```js run
const EN = { verbs: { has: 'set', buys: 'add' }, pronouns: ['she'], question: ['how', 'many'], skip: ['more', 'does'] };
print(storyState('Ana has 3 apples. She buys 2 more apples. How many apples does Ana have?', EN).answers[0].answer);
```

```output
5
```

### alignWorlds(a, b, options?)

Transfer by analogy between worlds (abstraction round, item 5). Two world schemas are
aligned by structure:
- A type's signature is its slots: a reference or a kind, many or one, a closed set.
- Types are paired by the share of their slots that match (at least `min`, default 0.5).
  A pairing whose references point to types that pair as well comes first.
- Slots inside a pair are matched by signature.

Whatever the aligned slot of `b` lacks (a default, a closed set of choices, being
required) is offered with the map, never told. The host measures an offer before taking
it. The result is `{ map: { typeA: typeB }, slots: { typeA: { keyA: keyB } }, score,
offers: [{ to, what, value, from }] }`.

```js run
const a = new World(); a.load('@s core.type of=seat  @s1 core.slot of=seat key=guest type=person  @s2 core.slot of=seat key=n kind=number default=1  @p core.type of=person  @p1 core.slot of=person key=name');
const b = new World(); b.load('@s core.type of=slot  @s1 core.slot of=slot key=event type=event  @s2 core.slot of=slot key=hour kind=number  @e core.type of=event  @e1 core.slot of=event key=name');
const r = alignWorlds(a, b);
print(r.map, r.offers[0].what);
```

```output
{"seat":"slot","person":"event"} default
```

### learnRules(world, cases, options?)

Induction from cases (abstraction round, item 4). Cases `[{ text, frame }]` that share a
frame (`ask` of a key) and a length are anti-unified by the library's own `induce` into
one reading rule:
- the words that differ become variables;
- a variable that fills the frame is lifted to the kind of the thing it names, by a
  pattern on that thing's fact.

The filler is taken as the text names it (the thing's name, not its id), so the word, the
fact's name and the frame's holder are one variable. Each rule is judged on a fork of the
world: first on its training cases (a rule that fails one is refused there), then on the
`heldOut` cases,
and on the valid cousins of its cases (`cousins(case)`, for example `cousins` of this
library). It is `admitted` only when every training case passes and the held-out share is
at least `admit` (default 1). The result is `[{ text, support, train, heldOut, admitted,
why? }]`. Nothing is told to the world: a rule is text to review.

```js run
const w = new World();
w.tell('@cow k.animal name=cow sound=moo  @duck k.animal name=duck sound=quack  @hen k.animal name=hen sound=cluck');
const C = (t, o) => ({ text: t, frame: { is: 'ask', key: 'sound', of: { id: o } } });
const [r] = learnRules(w, [C('cow sound', 'cow'), C('duck sound', 'duck')], { heldOut: [C('hen sound', 'hen')] });
print(r.admitted, r.heldOut);
```

```output
true {"pass":1,"of":1}
```

### learnFormOperators(pairs, options?), formOperator(canonical, variant), formEdits(canonical, variant), learnFormEdits(pairs), familyOf(edit) and liftTokens(world, text)

Form operators from aligned pairs (owner 16:12): a request is content × form × context,
and the form varies by few operators. `formOperator` takes a canonical sentence and a
variant with the same meaning. The shared runs of words become variables, and what is
left is the operator: `{ from, to }` in the language world's alternation format
(`could you {x1}` → `{x1}`; `{x1} is opened by {x2}` → `{x2} opens {x1}`).

`learnFormOperators([{ canonical, variant }], { heldOut })` clusters the operators of the
pairs; the same rule is one operator. Each operator is checked on held-out pairs: it must
bring the variant back to its canonical sentence. It is admitted with two supports or with
held-out passes. The result is `{ operators: [{ name, from, to, support, heldOut, admitted
}], coverage: { pairs, operators, at80, at95 }, unaligned }`, where `at80` and `at95` count
how many operators, most frequent first, cover 80 % and 95 % of the pairs. An operator is
both a generator (for `cousins`) and, read forwards, a normalisation rule (for
`normalise`).

Real variants combine several operators, such as a filler, an alternation and an extra
clause. `formEdits(canonical, variant)` splits a pair into atomic edits: an alignment of
the words, and each hunk where they differ, `{ del, ins, at: start | inside | end }`.
`learnFormEdits(pairs)` clusters them and counts how many operators cover 80 % and 95 %
of the edits, and of the pairs fully (`pairsAt80`, `pairsAt95`). Each edit also gets a
family by its shape alone, with no language: filler, extra clause, insertion, deletion,
inflection or substitution (`familyOf(edit)`); `families` counts them.

**Typed** (`{ world }` on all four): content words are lifted to their types through the
world's typed lexicon before aligning (`liftTokens(world, text)`):
- a thing becomes `<its type>`;
- a kind becomes `<kind>`, an attribute `<attr>`, a number `<num>`;
- function words stay.
So pairs about different things and attributes give one operator. A held-out pair passes
when one of the operator's readings gives its canonical sentence (adjacent variables may
split in several ways).
`tools/bench-form-pairs.mjs` runs both on PSys2's `form-pairs.jsonl`.

```js run
const r = learnFormOperators([{ canonical: 'open the door', variant: 'could you open the door' }, { canonical: 'add a cat', variant: 'could you add a cat' }]);
print(r.operators[0].from, r.coverage);
```

```output
could you {x1} {"pairs":2,"operators":1,"at80":1,"at95":1}
```

### normalise(world, text, options?) and alternationsOf(world, type?)

Alternations as general rules, written once (abstraction round, item 2). These are rules
of the language world (`w.lang.en.alternation name= from= to= mode=`):
- passive;
- wrappers: "could you", "I want you to", "please";
- question vs command;
- dative shift.

They bring a variant back to its canonical form, applied in order to a bounded fixpoint.

A pattern is made of words, `[a|b]` alternatives and `{x}` spans (shortest first). In
`to`, `{x:base}` gives a word's base form: the world's lemma, else the word without -ed or
-s. The result is `{ text, applied: [names], mode? }`. With `{ alternations: true }` (or the
same options), `parseText` normalises first, so one grammar rule for the canonical frame
reads every variant. The parses then carry `applied`, `normalised` and `mode`.

```js run
const w = new World();
w.tell(`@t core.type of=w.lang.en.alternation  @t1 core.slot of=w.lang.en.alternation key=name kind=atom kind=string
  @t2 core.slot of=w.lang.en.alternation key=from kind=atom kind=string  @t3 core.slot of=w.lang.en.alternation key=to kind=atom kind=string
  @t4 core.slot of=w.lang.en.alternation key=mode kind=atom kind=string
  @a w.lang.en.alternation name=could_you from="[could|can] you {x}" to="{x}" mode=request
  @b w.lang.en.alternation name=please from="please {x}" to="{x}" mode=request`);
print(normalise(w, 'Could you please open the door?'));
```

```output
{"text":"open the door","applied":["could_you","please"],"mode":"request"}
```

### canonicalise(world, text, options?), readCanonical(world, text, options?), fillersFrom(edits) and wordClassesOf(world)

The inverse of the form operators at read time (reviewer 00:40), as one pipeline step:
1. the text is cut into clauses at the `splitters` (an extra clause becomes a clause of its
   own);
2. the `fillers` are dropped at the start and end of each clause;
3. each clause is brought to its canonical form by the alternation rules (`normalise`).
4. Substitutions are read afterwards through word senses (`readByTypes`' `near`).

`canonicalise` returns `{ clauses: [{ text, applied, mode? }], dropped }`. `readCanonical`
also reads each clause by types: `[{ text, mode?, applied, frame, unread, near? }]`. The
fillers and splitters are data: the host's, or learnt (`fillersFrom(learnFormEdits(...))`
gives the words of the filler family).

`normalise` tries the rules in the order the language world tells (`n`). The innermost
rule's mode wins: "can you tell me where …" is a question. A pattern may name a word class,
`{q:wh}`, from `w.lang.en.word_class name= word=...` (`wordClassesOf`), instead of one fact
per alternative. On the published w.lang.en (368 rules), its 35 test sentences give the
canonical text, the rules applied and the mode, 35 of 35.

```js run
const w = new World();
w.tell(`@t core.type of=w.lang.en.alternation  @t1 core.slot of=w.lang.en.alternation key=name kind=atom kind=string
  @t2 core.slot of=w.lang.en.alternation key=from kind=atom kind=string  @t3 core.slot of=w.lang.en.alternation key=to kind=atom kind=string
  @t4 core.slot of=w.lang.en.alternation key=mode kind=atom kind=string
  @a w.lang.en.alternation name=could_you from="could you {x}" to="{x}" mode=request`);
print(canonicalise(w, 'um could you open the door and then close it', { fillers: ['um'], splitters: ['and then'] }).clauses.map((c) => c.text));
```

```output
["open the door","close it"]
```

### cousins(world, case, options?), ancestorsOf(world, id, options?), kindChain(world, id) and judgeFix(answer, case, cousins)

A case is never single (abstraction round, item 0). `cousins` goes up from a case `{ frame,
text? }` (a frame of `readByTypes`) along a dimension, then down to other members. The
dimensions:
- `filler`: up the chain of kinds (`kind`, `class`, `is`, `is_a`, then the type), and down
  to the other things below. The degree is how far up the case and the other thing must go
  to meet: 1 = siblings, 2 = first cousins, and so on.
- `key`: the other keys of the same holder.
- `wording`: the same frame in other forms. Each form operator is run backwards and tagged
  `form:<name>`:
  - the language world's alternations (`alternations`, from `alternationsOf`);
  - noise or learnt operators (`operators`, for example from `learnFormOperators`);
  - a word for its synonym through word senses (`form:synonym`).

  With these, the tester can say "fails under operator X".

A cousin is valid when it is legal in the world (it has an answer), when its wording, made
by substituting the filler, reads back to the same frame, and when it is not a `known`
case. Each cousin is tagged with its degree and the dimensions changed.

The graph is layered: a thing has several parents on several dimensions. `edges` (`{ key:
dimension }`, by default kind / class / is / is_a as `kind`) names them, and
`ancestorsOf(world, id, { depth, edges })` walks them breadth first. Cousins are
deduplicated by frame and stratified per degree and dimension (`n` each). The automatic
tester `tools/cousins-test.mjs` takes one example and a host and gives a table per degree ×
dimension, naming the pattern of breaks. With `split` and `oracle` it judges every clause
of a compound text: the host's answer to the whole text must hold the world's answer to
each clause, so answering one half fails. The skill `skills/expand-and-test-case` hands the
failures to `learnRules`. `judgeFix(answer,
case, cousins)` judges a fix both ways: on the case alone and on its valid cousins by
degree. Judged that way, a fix that passes only its case shows a share of 0.

```js run
const w = new World();
w.tell(`@cow k.animal name=cow kind=bovine sound=moo  @yak k.animal name=yak kind=bovine sound=grunt
  @sheep k.animal name=sheep kind=ovine sound=baa  @bovine k.kind name=bovine is_a=ruminant  @ovine k.kind name=ovine is_a=ruminant`);
const kase = { text: 'cow sound', frame: readByTypes(w, 'cow sound').best };
print(cousins(w, kase).filter((c) => c.valid).map((c) => [c.degree, c.text]));
```

```output
[[1,"yak sound"],[2,"sheep sound"]]
```

### readByTypes(world, text, options?), typedLexicon(world) and nearWords(world, word, options?)

Type-driven reading (abstraction round, item 1). Each content word is typed through the
world itself:
- a thing: a fact's name;
- a kind: a type, or a `kind`, `class` or `is` value;
- an attribute: a key that facts carry;
- a value: a key's value;
- an act: a word of an action;
- a known word: a `core.word`. A verb that means a key asks for that key.

The candidate frames are the relations, inverse relations and acts whose argument types the
words fill, each word used once:
- `ask`: the `key` of a thing or kind, with its `answer`;
- `find`: the holders of a kind with `key=value`;
- `act`: an act with typed arguments: the kind to make (a type), the thing to act on (a
  name), and values of a closed set by their key (`make a blue shape` → `{ kind: 'shape',
  colour: 'blue' }`).

Word order and function words only rank the frames, so paraphrases in any order read to one
frame. Options: `question` (words that make a question), `skip` (words passed over),
`lemma`. Words the world does not know are listed in `unread`. `typedLexicon` is the
lexicon, memoised per world. The language's own facts (k.words, w.lang, k.genres,
k.interest) are not content.

Lexical generalisation (item 3): `nearWords(world, word, { senses })` gives a word's near
words through word senses (`k.words.sense`: word, synonym, is_a, kind_of):
- a synonym costs 1, both ways;
- the nearest kind (`is_a`) costs 2;
- further kinds cost 3 or more.
By default the senses are the world's own; a host passes `senses(word)` from a lazy
catalog. `readByTypes` reads an unknown word as its nearest known word when the cost is
within `near` (default 3). The result lists each such reading in `near` (`{ word, as,
cost, via }`), and the cost lowers the frame's score.

```js run
const w = new World();
w.tell('@cow k.animal name=cow sound=moo  @s core.word text=make text=makes means=sound');
const O = { question: ['what', 'which', 'does'], skip: ['a', 'the', 'of'] };
print(['what sound does a cow make', 'a cow makes which sound', 'cow sound?'].map((t) => readByTypes(w, t, O).best.answer[0]));
```

```output
["moo","moo","moo"]
```

### inflectBy(world, word, op?, options?) and articleFor(world, word, options?)

Plurals and articles from a language world's facts (std.morph). `inflectBy` changes a word
by ordered suffix rules (`op= order= suffix= after=consonant|vowel unless_suffix=
min_length= replace= | add= drop=`), with irregular forms first (`singular= plural=
read_only=`). A rule with keys it does not know is not applied. `articleFor` gives the
determiner whose `before=` is the sound the word begins with, by the longest `onset`
(`begins= sound=`) that matches, else by its first letter. The types default to
w.lang.en's (`w.lang.en.inflect`, `.irregular`, `.det`, `.onset`). `discourseRealiser`
uses both when the language world has them: `{kind:num=pl}` gives the plural, and "a" or
"an" takes its form from the next word.

```js run
const w = new World();
w.tell(`@t core.type of=w.lang.en.inflect  @t1 core.slot of=w.lang.en.inflect key=op  @t2 core.slot of=w.lang.en.inflect key=order kind=number
  @t3 core.slot of=w.lang.en.inflect key=suffix many=true  @t4 core.slot of=w.lang.en.inflect key=add  @t5 core.slot of=w.lang.en.inflect key=drop kind=number  @t6 core.slot of=w.lang.en.inflect key=after
  @d core.type of=w.lang.en.det  @d1 core.slot of=w.lang.en.det key=text  @d2 core.slot of=w.lang.en.det key=before
  @r1 w.lang.en.inflect op=plural order=1 suffix=y after=consonant drop=1 add=ies  @r2 w.lang.en.inflect op=plural order=2 add=s
  @a w.lang.en.det text=a before=consonant  @an w.lang.en.det text=an before=vowel`);
print(inflectBy(w, 'baby'), inflectBy(w, 'day'), articleFor(w, 'owl'));
```

```output
babies days an
```

### discourseRealiser(world, options?) and discourseTemplates(world, type?)

Sentences for composition frames from a language world's discourse templates
(`w.lang.en.discourse`: a move, a register, a text with `{slots}`). The realiser picks, by
seed, a template of the frame's move and register whose slots it can all fill. It fills
them from the frame, the fact it cites, the story plan and the outline.
- A story sentence tells its own element, and only elements told before it.
- A move about the topic says the first claim.
- No sentence is used twice while another fits.
- What has no fitting template stays without text; `compose` lists it in `short`.

How a fact becomes a clause and a name a noun phrase is the language's, so the host gives
`clause(fact)`, `np(name)` and `inflect(word, features)`. The defaults only join words
("the penguin eats fish"). A host's own `fill(slot, frame, context)` is tried first.
`compose` uses this realiser when the world holds the templates and no `realise` is given.
Each frame then records its `template`, which `writeDocument` keeps.

```js run
const w = new World();
w.tell(`@t core.type of=w.lang.en.discourse  @t1 core.slot of=w.lang.en.discourse key=move kind=atom kind=string
  @t2 core.slot of=w.lang.en.discourse key=register kind=atom kind=string  @t3 core.slot of=w.lang.en.discourse key=slot kind=atom many=true
  @t4 core.slot of=w.lang.en.discourse key=text kind=atom kind=string
  @a w.lang.en.discourse move="introduce topic" register=presentation slot=topic text="Today we talk about {topic}."`);
print(discourseRealiser(w)({ move: 'introduce topic' }, 'presentation', { topic: 'owl' }).text);
```

```output
Today we talk about the owl.
```

### writeDocument(world, composition, options?) and readDocument(world, id)

`writeDocument` writes a composition by a genre as a `w.document` live world. The world
must use the knowledge repository's `w.document` schema. Each part becomes a slide, when
the genre's unit is slide, or a chapter with a paragraph. Each frame becomes a sentence
with its `move` and `fact` (the ids of the wires it states). Everything is written through
the acts of std.acts, so the schema's checks hold, and what was refused is listed.

The text of a sentence is the frame's own `text`, else `realise(frame, register)`. With
neither, it is a placeholder that says the move. Other options: `title`, `language`,
`slides`, and `facts(frame)`, which by default gives the cited wire or a wire named as the
story element's value. `readDocument` reads a document back in order, `{ title, genre,
parts: [{ part, title, sentences: [{ text, move, facts }] }] }`, for a summary or a check.

```js run
const w = new World();
w.tell(`@t core.type of=w.document.document  @t1 core.slot of=w.document.document key=title kind=atom kind=string
  @c core.type of=w.document.slide  @c1 core.slot of=w.document.slide key=document kind=ref ref=w.document.document
  @c2 core.slot of=w.document.slide key=n kind=number  @c3 core.slot of=w.document.slide key=part kind=atom kind=string
  @s core.type of=w.document.sentence  @s1 core.slot of=w.document.sentence key=slide kind=ref ref=w.document.slide
  @s2 core.slot of=w.document.sentence key=n kind=number  @s3 core.slot of=w.document.sentence key=text kind=atom kind=string
  @s4 core.slot of=w.document.sentence key=fact kind=atom many=true
  @d w.document.document title=Owls  @sl w.document.slide document=$d n=1 part=point
  @x w.document.sentence slide=$sl n=1 text="Owls eat mice." fact=a`);
print(readDocument(w, 'd').parts, writeDocument(w, { chapters: [] }).why);
```

```output
[{"part":"point","sentences":[{"text":"Owls eat mice.","facts":["a"]}]}] not a composition by a genre (no parts)
```


### readStory(world), storyPlan(kb, options?) and STORY_RELATIONS

Story plans from the knowledge repository's `k.story`. Each element (setting, protagonist,
goal, target, obstacle, attempts, helper, means, turning point, resolution, ending) is a
choice point. Its domain is the names of the facts of the types it is filled from
(`fills`). The constraints (`element relation other`) are read as facts: hard ones prune,
soft ones weight the draw (`soft`, default 30). `solveChoices` solves them jointly.
- Elements the constraints link to what is already decided are decided first; the host's
  `fixed` choices come before everything.
- An element that occurs several times (attempt, 0 to 3) is made in order, each different.
- `STORY_RELATIONS` says what each relation means over the catalog's facts. It is the one
  table that knows their shapes; a host adds to it or replaces it with `relations`.
`readStory(world)` gathers what a plan reads from a world holding `k.story` and the
catalog worlds it names.

The result is `{ plan: { element: value or [values] }, soft: [names held], nodes }`, or
`{ why, at }`. With a story genre, `compose` tells each story move from a plan: the
elements of that part and move, one sentence each. The topic is the protagonist when it
can be; otherwise another hero is chosen and `short` says so. The plan is in `story`.

```js run
const kb = { elements: [{ name: 'hero', n: 1, min: 1, max: 1 }, { name: 'friend', n: 2, min: 1, max: 1 }],
  constraints: [{ name: 'two', element: 'friend', relation: 'differs', other: 'hero', strength: 'hard' }],
  domains: { hero: ['cat'], friend: ['cat', 'owl'] } };
print(storyPlan(kb).plan);
```

```output
{"hero":"cat","friend":"owl"}
```

### solveChoices(vars, { domain, ok, weight, seed, limit })

Choice points solved jointly (std.plan). Variables are decided in order. `domain(v,
partial)` gives the candidates of a variable, given the choices made before it. `ok(partial)`
checks the hard constraints, and false prunes the branch. `weight` orders the candidates by
a seeded weighted draw, so the first solution found is a weighted sample; weight 0 is never
drawn. The search is bounded by `limit` nodes. The result is `{ values, nodes }`, or `{ why,
nodes, deepest }` with the variable that could not be filled.

```js run
const distinct = (p) => new Set(Object.values(p)).size === Object.keys(p).length;
print(solveChoices(['a', 'b', 'c', 'd'], { domain: () => [1, 2, 3], ok: distinct }).deepest);
```

```output
d
```

### measuresOf(world, fact, state?), shapeShare(feature, x) and interestModel(world)

The parts of `interestOf`. `measuresOf` gives the measures the library computes from facts
and the text being written (`state`: `topic`, `said`, `moves`, `move`, `since`, `session`,
`measures`). `shapeShare` is the share of a feature's shape (rising, falling, peak, step) at
a value. `interestModel` reads the world's `k.interest.appraisal` and `k.interest.feature`
facts, or gives null.

```js run
print(shapeShare({ shape: 'peak', start_at: 0, peak_at: 0.5, full_at: 1 }, 0.25), interestModel(new World()));
```

```output
0.5 null
```

### arbitrate(world, request, options?)

The arbitration contract: one verdict per declared world for one request. `own`: the
world has the kind (or the thing, or a view whose state has the attribute), allows the
act, and its dry run takes it. `decline`: it has no use for the kind, so it declines the
verb; this rule is the library's, not the host's. `refuse`: it has the kind, but the act
is not allowed or the dry run refuses. A refusal is given only in the `exact` pass; in a
`spelling` or `view` pass (`options.pass`) it stays a decline. When several worlds own,
`options.resolves(world, words)` (a host hook, with `options.words`) keeps the ones whose
things hold the words. Returns `{ verdicts: [{ world, verdict, why }], owner, ambiguous?, pass }`.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts  @a std.schema.world name=kitchen  @b std.schema.world name=garden
  @t core.type of=pot extends=std.schema.thing  @k std.schema.kind of=pot world=kitchen acts=make`);
const r = arbitrate(w, { action: 'make', args: { kind: 'pot' } });
print(r.verdicts.map((v) => [v.world, v.verdict]), r.owner, arbitrate(w, { action: 'remove', args: { kind: 'pot' } }).verdicts[0].verdict);
```

```output
[["kitchen","own"],["garden","decline"]] kitchen refuse
```

### needsOf(world, scope?)

The typed needs of a world or a view (`std.schema.needs of= type= from=`), each with
whether it is loaded (some wire of its `type` exists): `[{ of, type, from, loaded }]`, for
`{ world }`, `{ view }`, or all. An act there is refused while a need is not loaded
(`reason.needs`); `turn(world, readings, { load })` calls `load(need, world)` for each and
dry-runs again, and says what it `loaded`.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts  @home std.schema.world name=home
  @t core.type of=lamp extends=std.schema.thing  @k std.schema.kind of=lamp world=home acts=make
  @n std.schema.needs of=home type=k.furniture`);
print(needsOf(w, { world: 'home' }), w.act({ action: 'make', args: { kind: 'lamp' } }).violations[0].why);
const t = turn(w, [{ action: 'make', args: { kind: 'lamp' } }], { load: (need, world) => world.tell(`@f ${need.type} name=lamp`) });
print(t.status, t.loaded.map((n) => n.type));
```

```output
[{"of":"home","type":"k.furniture","loaded":false}] needs k.furniture loaded first
done ["k.furniture"]
```

### choose(world, kind, candidates, options?)

One way to choose (reviewer 01:00). The candidates of a choice point are ordered by the
criteria declared for its kind, as data: `std.decide.criterion of=<kind> n= name= measure=
dir=hard|min|max`, from the world, else std.decide's own facts. A criterion reads a field of
the candidate (`measure`; missing counts as 0): `hard` loses on anything but 0, while `min`
and `max` compare. Ties end in a seeded order. The result is `{ best, order, ranked,
criteria }`, where each loser carries `lostTo`, `on` and `why`. The kinds std.decide
declares are `reading`, `template`, `word`, `rule` and `fact`, and `criteria` gives a list
directly. The map of all choice points is in docs/decisions.md.

```js run
const r = choose(null, 'word', [{ word: 'kin', cost: 2 }, { word: 'sound', cost: 1 }, { word: 'nose', cost: 1, misfit: true }]);
print(r.best.word, r.ranked[0].why);
```

```output
sound cost 2; #1: cost 1
```

### rank(scored, criteria?) and RANKING

Orders scored readings best first and explains every place. `RANKING` is the default
list of criteria, each `{ name, measure, say }` (lower `measure` is better):
`consistent`, `referents` (how many are left ambiguous), `lacks`, `words` (words of the
frame left out), `assumes`; ties keep the given order. Returns `{ order, ranked }`;
`ranked[i]` is `{ index, place, why, lostTo, on }`: the first says what it satisfies,
any other names the first criterion on which the winner is better and what each is on
it, a tie says so. A host may put its own criteria before, after or instead of these.

```js run
const w = new World();
w.load(`@k1 core.slot of=item key=name id=true
  @a core.action name=reserve param=item when=$it if=$left set=$r
  @it item name=?item stock=?s
  @left core.check fn=gt args=?s args=0 why="?item is out of stock"
  @r item core.on=$it reserved=yes`);
w.tell('@i2 item name=ink stock=0');
const r = w.score([{ action: 'reserve', args: { item: 'ink' } }, { question: { type: 'item', where: { name: 'ink' }, seek: 'stock' } }]);
print(r.order, r.candidates[0].on, r.candidates[0].why);
print(RANKING.map((c) => c.name));
```

```output
[1,0] consistent inconsistent: ink is out of stock; #1: consistent with the world
["consistent","referents","lacks","words","assumes"]
```

### world.veto(result, options?) and veto(result, options?)

Whether a host should answer with the top reading of `score`, or say "not understood"
or ask. Returns `{ answer, index, reasons, ask, read }`; `answer` is false when any
reason is given, each `{ reason, why }`: `nothing` (no reading), `inconsistent` (the top
reading breaks the world, a refusing guard included), `no-referent`, `ambiguous` (a
referent still open), `action-unavailable` (an action the world does not have),
`words-left-out` (more than `leftOut`, default 0), `too-few-words` (fewer than
`minWords`, default 1), `tie` (the next reading is as good on every criterion). `ask`
lists what the reading lacks with its question, for a host that asks instead of
answering; `read` lists the words read as near known ones. Options: `minWords`,
`leftOut`, `criteria`.

```js run
const w = new World();
w.load(`@k1 core.slot of=item key=name id=true
  @a core.action name=reserve param=item when=$it if=$left set=$r
  @it item name=?item stock=?s
  @left core.check fn=gt args=?s args=0 why="?item is out of stock"
  @r item core.on=$it reserved=yes`);
w.tell('@i1 item name=pen stock=3  @i2 item name=ink stock=0  @w core.word text=reserve means=reserve');
const v = (args) => w.veto(w.score(w.interpret({ verb: 'reserve', args }).candidates));
print(v(['pen']).answer, v(['ink']).reasons.map((r) => [r.reason, r.why]), v(['pen', 'blue']).reasons[0].why);
```

```output
true [["inconsistent","ink is out of stock"]] leaves out blue
```

### world.get(id), world.has(id), world.resolve(id), world.ofType(type)

`get` returns the fact `{ id, type, attrs, meta }` or undefined; `attrs` maps each key
to an array of values. `has` says whether it exists. `resolve` returns the id of the
wire that an id names now (after a merge), or the id itself. `ofType` returns the
facts of a type and of its subtypes. Do not modify what they return. Cost: constant;
`ofType` O(result).

```js run
const w = shop();
w.tell('@pen item name=pen price=2');
w.tell('@again item name=pen');
print(w.get('pen').attrs, w.has('ink'), w.resolve('again'), w.ofType('item').length);
```

```output
{"name":["pen"],"price":["2"]} false pen 1
```

### world.schema(type)

What the matrix says about a type: `{ type, extends, lineage, closed, keys }`, each key
with its slot's attributes and `inherited`; `null` for a type the matrix does not
mention.

```js run
const s = shop().schema('line');
print(s.lineage, Object.keys(s.keys), s.keys.qty.default);
```

```output
["line"] ["item","qty"] 1
```

### world.explain(id)

Where a wire comes from: `{ id, wire, tier, told, via, from, fills }`: the wire as
text, whether it was `told`, else the rule (`via`) that derived it, the wires it was derived
`from` (each explained in turn), and the values that were added to it later (`fills`,
each with `key`, `value`, `via`, `from`); `null` for an unknown id.

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @l1 line item=$pen qty=3');
const e = w.explain('l1');
print(e.told, e.fills.map((f) => [f.key, f.value, f.via, f.from]));
```

```output
true [["cost","6","r",["l1","pen"]]]
```

### Advice at load (`advise`)

`new World({ advise: true })`: when the matrix is loaded, `world.warnings` gets advice
(kind `advice`, never an error) for an author: a kind of the application with the shape
of a kind of an imported module ("kind card here has the shape of shapes.box in module
shapes: import it?"), and a rule with the shape of a rule of another module, such as the
standard pack ("the rule mine is already in std.relations (std.relations.slotted)").
Off by default. The study behind it is [patterns](patterns.md); `tools/reuse.mjs` does the same
across whole worlds.

```js run
const w = new World({ advise: true, library: { shapes: '@s core.module name=shapes\n@b1 core.slot of=shapes.box key=x kind=number\n@b2 core.slot of=shapes.box key=y kind=number' } });
w.load('@m core.module name=app imports=shapes\n@a1 core.slot of=card key=x kind=number\n@a2 core.slot of=card key=y kind=number');
print(w.warnings.map((x) => x.why));
```

```output
["kind card here has the shape of shapes.box in module shapes: import it?"]
```

### world.why(id, key?)

Why a wire, or one of its values, is what it is, in one structure a host turns into a
sentence ("why is it so low?", "why did you open chess?"): `{ id, key, steps }`, the
steps from the cell asked about back to what was told, each wire once, depth first in
the order the rules read them. A step is `{ id, key, value }` (or `wire`, its text, for a
whole wire), its `tier`, and `how`: `told`; `action` (told or set by the action named in
`action`); `rule` (with `rule` and the wires it read, `from`); `aggregate` (a group
result); `default` (a slot default); `open` (no value). A `std.fill` need that was filled
says its `choice` (`{ key, value, tier, source }`) and goes on through the offer chosen.
`null` for an unknown id. `explain` gives the same as a tree, for one wire.

```js run
const w = new World();
w.load(`@b box h=?h
  @c core.calc out=?y fn=sub args=100 args=?h
  @t box core.on=$b y=?y
  @r core.rule when=$b with=$c then=$t
  @k core.slot of=box key=name id=true
  @it box name=?x
  @to box core.on=$it h=?v
  @grow core.action name=grow param=x param=v when=$it set=$to`);
w.tell('@a box name=cup');
w.act({ action: 'grow', args: { x: 'cup', v: 90 } });
print(w.why('a', 'y').steps.map((s) => [s.id, s.key, s.how, s.rule]));
print(w.why('a', 'h').steps[0].how, w.why('a', 'h').steps[0].action);
```

```output
[["a","y","rule","r"],["a",null,"told",null]]
action grow
```

### world.tier(id, key?) and world.assumptions(ids?)

`tier` is the certainty of a cell, or of a wire as a whole: `told`, `derived`,
`forced`, `default`, `guessed` or a declared tier; undefined when there is no such
cell. `assumptions()` lists every cell weaker than `derived`, weakest first:
`[{ id, key, value, tier, dependants }]`; `assumptions(ids)` only what those wires rest
on, with dependants among them, without a pass over the world.

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @l1 line item=$pen');
w.complete({ defaults: true });
print(w.tier('pen', 'price'), w.tier('l1', 'qty'), w.tier('l1', 'cost'));
print(w.assumptions().map((a) => [a.id, a.key, a.tier, a.dependants.length]));
```

```output
told default default
[["l1","qty","default",1]]
```

### world.told()

The facts as they were stated, without what rules, defaults and searches added: an
array of wires that can be told to another world.

```js run
const w = shop();
w.tell('@pen item name=pen price=2  @l1 line item=$pen qty=3');
print(w.told().map((x) => format(x)));
```

```output
["@pen item name=pen price=2","@l1 line item=$pen qty=3"]
```

### world.describe(options?) and world.diff(other)

`describe` returns a summary as plain data: `{ types, wires, open, assumed, issues,
changes }`. Options: `about` (one wire and what is within `depth` references of it),
`since` (changes after that sequence number), `last` (20 changes). `diff` returns what
is different in another world: `{ same, added, removed, changed }`. Cost: O(n).

```js run
const w = shop();
w.tell('@pen item name=pen price=2');
const f = w.fork();
f.revise('pen', 'price', 4);
print(w.describe().types, w.diff(f).changed);
```

```output
{"item":{"count":1,"instances":["pen"]}} [{"id":"pen","key":"price","from":"2","fromTier":"told","to":"4","toTier":"told"}]
```

### world.closeType(type)

Declares a type complete: all its facts are told. A `by=` join to that type stays open per
value until a target with that value is told, whatever order the shards are loaded in.
Each tell lists the joins it left open in `openJoins`; `check()` reports them as
`open-join` issues, and `check(undefined, { strict: true })` refuses them. After
`closeType`, a join to the type that finds no target is refused. It returns the joins
still open to the type when it was closed.

```js run
const w = new World();
w.load('@d core.slot of=pic key=drawing type=k.objects.object by=name  @o core.type of=k.objects.object  @on core.slot of=k.objects.object key=name');
w.tell('@h k.objects.object name=horse');
print(w.tell('@p pic drawing=unicorn').openJoins.length, w.closeType('k.objects.object').length, w.tell('@q pic drawing=pegasus').ok);
```

```output
1 1 false
```

### world.check(patch?, options?)

With a patch: what `applyPatch(patch)` would return, without changing anything. Without
one: validates the whole world and returns `{ ok, violations, issues }`; with `{ strict:
true }` a join still open is refused too.

With `{ query }` or `{ ask }` (a question for `query`, patterns for `ask`) the patch is
applied in a transaction that is then undone, and the result also has `answer` (what
`query` gives on the world with the patch) or `rows` (what `ask` gives there). The same
from the other side: `query(q, { given: patch })` and `ask(patterns, { given: patch })`
answer on the world as it would be with the patch; a patch the world refuses gives the
status `refused` with the violations. Nothing changes. The questions are asked in the
patch's namespace (`ns`, or the world's). A patch may also be SOP text: its wires.

```js run
const w = shop();
w.tell('@pen item name=pen price=2');
print(w.check({ wires: '@ink item name=ink price=-1' }).violations[0].why, w.has('ink'));
print(w.check());
```

```output
must be at least 0 false
{"ok":true,"violations":[],"issues":[]}
```

## Worlds, time and history

### world.fork()

An independent world with the same content. Nothing is copied: each of the two worlds,
at its first change, puts a copy-on-write layer over what they share and writes there,
so a change after a fork copies only the wires and index entries it touches. Cost:
constant; the first change after it costs about what the same change costs without a
fork, whatever the size of the world (`node bench/fork.mjs`).

```js run
const w = shop();
const f = w.fork();
f.tell('@pen item name=pen price=2');
print(w.has('pen'), f.has('pen'));
```

```output
false true
```

### world.trial(fn, options?)

Runs `fn(world)` and undoes whatever it changed; returns what `fn` returned, or
undefined on budget. For what-if questions without a fork.

```js run
const w = shop();
w.tell('@pen item name=pen price=2');
print(w.trial((x) => x.tell('@l1 line item=$pen qty=4').ok && x.get('l1').attrs.cost[0]), w.has('l1'));
```

```output
8 false
```

### world.asOf(at, fn, options?), world.seqOf(id), world.compare(idA, idB)

`seqOf` is the place of a wire in the sequence. `compare` is negative when the first
wire comes before the second, positive when after. `asOf` runs `fn` against the world
as it was at place `at` and returns its result; the world is unchanged. Cost of
`asOf`: O(wires after `at`).

```js run
const w = shop();
w.tell('@pen item name=pen price=2');
w.tell('@ink item name=ink price=3');
print(w.compare('pen', 'ink') < 0, w.asOf(w.seqOf('pen'), (x) => x.ofType('item').length));
```

```output
true 1
```

### world.history() and world.on(listener)

`history()` returns the committed events, oldest first: `[{ seq, op, ... }]`.
`on(listener)` calls `listener(events, world)` after every committed change and
returns a function that stops it.

```js run
const w = shop();
const seen = [];
const off = w.on((events) => seen.push(...events.map((e) => e.op)));
w.tell('@pen item name=pen price=2');
w.tell('@bad item name=ink price=-1');
off();
print(seen, w.history().length);
```

```output
["tell"] 1
```

### world.toSOP(options?) and world.toJSON()

`toSOP` writes the facts as text, in order of arrival. Options: `schema` (the matrix
too), `derived` (true; false leaves out derived wires), `provenance` (add `core.via`
and `core.from`). `toJSON` returns `{ format: 'sopworld', version, log }`, for
`World.fromJSON`. Options: `timeline` (also the open marks and the redo stack; a mark on
the way of the log is its position `at`, any other its own log), `since` (a world this
one grew from, such as the one it was forked from: only the entries after that world's
log are written, with `base: { length, last }`, a fingerprint).

```js run
const w = shop();
w.tell('@pen item name=pen price=2');
print(w.toSOP(), Object.keys(w.toJSON()));
```

```output
@pen item name=pen price=2 ["format","version","log"]
```

### world.register(kind, name, fn, options?)

Adds a host function after the world was made. Declare it in the matrix too
(`core.function`, see the [reference](reference.md#corefunction)): a
registered function with no declaration still works, with an `undeclared-function` note. `kind` is `function` (`(args, world)
=> value`, for calcs, checks and effects), `action` (`(context, args) => value`),
`producer` (`(context) => value`), `filter` (`(value, { world, name }) => text`, for
`?v:name` in a reason), `context` (a host hook such as the session's facts, read by the
host's actions as `ctx.world.context.<name>`; no matrix names it) or `lemma`, given as `register('lemma', fn)` with no name (`(token) => form | forms`:
the dictionary forms of a token that is not a known word, for `interpret`; it must be
pure and know nothing of the world). A `function` with the name of a built-in throws
unless `{ override: true }`. Returns the world.

```js run
const w = new World();
w.register('function', 'half', ([x]) => Number(x) / 2);
try { w.register('function', 'add', () => 0); } catch (e) { print(e.message.slice(0, 60)); }
print(typeof w.fns.half);
```

```output
sopworld: the function "add" would replace the built-in of t
function
```

### world.modules()

The modules of the matrix, in order: `{ name, version, imports, exports }` (`version`
and `exports` when the module declares them).

```js run
const w = new World();
w.load('@m core.module name=shop version=1.2.0 exports=item\n@k core.slot of=shop.item key=price kind=number');
print(w.modules());
```

```output
[{"name":"shop","version":"1.2.0","imports":[],"exports":["shop.item"]}]
```

### world.functions()

The host functions the matrix declares, in order: `{ name, out: { kind }, pure, doc,
args: [{ name, kind, optional, doc }], registered }`. A reader derives its tool
descriptions from them.

```js run
const w = new World({ fns: { near: ([a, b, d = 3]) => Math.abs(a - b) <= d } });
w.load(`@f core.function name=near out.kind=boolean pure=true doc="within a distance"
  @f.a core.function.arg of=$f name=a kind=number
  @f.b core.function.arg of=$f name=b kind=number
  @f.d core.function.arg of=$f name=within kind=number optional=true`);
print(w.functions()[0].args.map((a) => a.name + (a.optional ? '?' : '')), w.functions()[0].registered);
```

```output
["a","b","within?"] true
```

### world.cannot(reason)

For host functions: say why there is no result, before returning nothing. A query
that supposed a wire and needed the result answers `unsupported` with that reason.

```js run
const w = new World({ fns: { rate: ([c], world) => (c === 'eur' ? 5 : world.cannot(`no rate for ${c}`)) } });
w.load('@p price cur=?c\n@c core.calc out=?r fn=rate args=?c\n@t price core.on=$p rate=?r\n@r core.rule when=$p with=$c then=$t');
const q = w.query({ type: 'price', where: { cur: 'usd' }, seek: 'rate' });
print(q.status, q.reason, w.query({ type: 'price', where: { cur: 'eur' }, seek: 'rate' }).value);
```

```output
unsupported no rate for usd 5
```

### world.stats()

The cost of the last call: `{ steps, limit, exhausted, site, sites, ms }`, `sites`
giving the steps per place (`match`, `chase`, `negation`, `aggregate`, `fluent`,
`withdraw`, `validate`, `complete`, `ground`, `solve`, `abduce`, `induce`, `interpret`).

```js run
const w = shop();
const r = w.tell('@pen item name=pen price=2', { budget: { steps: 1 } });
print(r.violations[0].kind, w.stats().exhausted, w.has('pen'));
```

```output
budget true false
```

## Functions

### parse(text, options?), tokenize(text, options?)

`parse` returns the wires of a text: `[{ id, type, attrs, pattern }]`, `attrs` mapping
each key to the array of its value tokens. Options: `anonymous` (a declaration may
leave out its `@id`, for queries), `lenient` (read what versions before 0.6.1 read: an
id twice in one text, escapes JSON does not have, a quote or backslash in an atom). It
throws `SopError` listing every error of the text ([the list](language.md#9-errors)).
`tokenize` returns the tokens: `[{ t, line, column, offset }]`. Cost: linear in the
text.

```js run
const [w] = parse('@a item name="red pen" price=2 tag=x tag=y');
print(w);
print(parse('item price=?p', { anonymous: true })[0].id, tokenize('@a t k=v').map((x) => x.t));
```

```output
{"id":"a","type":"item","attrs":{"name":["\"red pen\""],"price":["2"],"tag":["x","y"]},"pattern":false}
_1 ["@a","t","k=v"]
```

### format(wire, options?) and serialize(wires, options?)

`format` writes one wire: on one line; with `{ multiline: true }` one entry per line;
with `{ canonical: true }` in the [canonical form](language.md#8-writing-wires-and-the-canonical-form)
(entries sorted by key, strings in one spelling). `serialize` writes several wires,
each followed by a line end, with the same options; `serialize(wires, { canonical:
true })` gives the same bytes for the same wires.

```js run
const ws = parse('@a item price=2 name="red pen"  @b item');
print(format(ws[0]));
print(serialize(ws, { canonical: true }));
```

```output
@a item price=2 name="red pen"
@a item
    name="red pen"
    price=2
@b item

```

### str(value), quote(text), readValue(token), writeValue(value)

`str` gives the text of a string token (escapes decoded) and returns any other value
unchanged; `quote` gives the string token of a text, in the canonical spelling (the
escapes of JSON). `readValue` gives a token as data, `{ kind, v }` with kind `atom`,
`string`, `ref` or `var`; `writeValue` is its inverse (and throws for another kind).
They are what a host with its own parser needs to hand over wires.

```js run
print(str('"a \\"b\\"\\n"') === 'a "b"\n', quote('a "b"\n'), str('5kg'));
print(readValue('"red pen"'), readValue('$a'), writeValue({ kind: 'var', v: 'x' }));
```

```output
true "a \"b\"\n" 5kg
{"kind":"string","v":"red pen"} {"kind":"ref","v":"a"} ?x
```

### SopError

What `parse`, `tell` and the other methods throw for text that is not SOP Lang. It has
`message`, `line`, `column` and `offset` of the first error, and `errors`: every error
of the text as `{ message, offset, line, column }`.

```js run
try { parse('@a item\n  name=\n  price'); } catch (e) { print(e instanceof SopError, e.line, e.column, e.errors.length); }
```

```output
true 2 3 2
```

### unify(a, b, bindings?) and walk(term, bindings)

`unify` matches two values (an atom, a `?variable`, a `$reference`, also `$?variable`)
and returns the bindings, extended from those given, or `null` when they cannot be the
same. `walk` returns what a value stands for under bindings.

```js run
const s = unify('$?w', '$pen', unify('?n', 'pen'));
print(walk('?n', s), walk('?w', s), unify('?n', 'ink', s));
```

```output
pen pen null
```

### abduce(world, goal, options?) and adopt(world, explanation)

`abduce` is `world.abduce`. `adopt` tells an explanation's wires and fills (tier
`guessed`) and returns `{ ok, results }`.

```js run
const w = new World();
w.load('@ab core.abducible of=rain\n@r rain place=?p\n@w wet place=?p\n@rule core.rule when=$r then=$w');
const [e] = abduce(w, '@g wet place=lawn');
print(adopt(w, e).ok, w.holds('wet place=lawn'), w.tier(w.ofType('rain')[0].id));
```

```output
true true guessed
```

### induce(examples, options?), induceRule(examples, options?), induceSlots(wires, options?)

`induce` generalises examples (`[{ when, then }]`, text or wires) into one rule, or
with `{ kind: 'deny' }` into a deny: `{ text, calcs, tests, skipped, coversNegative,
variables, examples }`. Options: `name`, `why`, `tolerant` (skip examples of another
shape), `negatives`, `budget`. `induceRule` returns only the text. `induceSlots`
proposes slots for observed wires. What they return is text to review and tell.

```js run
const rule = induceRule([
  { when: '@a parent of=ann child=bob', then: '@x child of=bob parent=ann' },
  { when: '@a parent of=cy child=di', then: '@x child of=di parent=cy' },
], { name: 'inverse' });
const w = new World();
w.load(rule);
w.tell('@p parent of=eve child=fay');
print(w.ask('child of=?c parent=?p'));
```

```output
[{"p":"eve","c":"fay"}]
```

### quantity(value)

Reads a number with an optional unit: `{ n, unit }`, or `null`.

```js run
print(quantity('2.5kg'), quantity('pen'));
```

```output
{"n":2.5,"unit":"kg"} null
```

### solvers, Problem, Sat, toDimacs(data), toASP(data)

`solvers.cdcl()` (the default) and `solvers.backtrack()` are built in.
`solvers.external({ run })`, `solvers.dimacs({ exec })` and `solvers.clingo({ exec })`
hand the problem to a program outside; what it proposes is verified by the world.
`new Problem(world)` is the search problem of a world (`variables`, `nogoods`,
`verify`, `toJSON`); `toDimacs` and `toASP` write it for a SAT or an ASP solver. `Sat`
is the built-in SAT solver (`addClause`, `solve`, `model`).

```js run
const s = new Sat(2);
s.addClause([1, 2]); s.addClause([-1]);
print(s.solve(), s.model().slice(1));
print(Object.keys(solvers));
```

```output
true [false,true]
["backtrack","cdcl","external","dimacs","clingo"]
```

### builtins, aggregates, GRAMMAR, MODIFIERS, SCHEMA_TYPES

Tables, for tools: the built-in [functions](reference.md#functions) and
[aggregates](reference.md#aggregates) by name; for each matrix wire type the
attributes it reads (`GRAMMAR`; a name that ends in `.` is a prefix); the attributes
that may stand on any pattern or template (`MODIFIERS`); the types that make a wire a
matrix wire (`SCHEMA_TYPES`).

```js run
print(GRAMMAR['core.deny'], MODIFIERS, SCHEMA_TYPES.has('core.rule'), typeof builtins.add, Object.keys(aggregates));
```

```output
["when","not","with","if","why","soft","priority"] {"core.select":"pattern","core.absent":"pattern","core.on":"template"} true function ["count","sum","min","max","argmin","argmax","collect"]
```

### version and build

`version` is the version of the library. `build` is `{ version, hash, date }`: which
build a single file is (`hash` and `date` are `null` when running from the sources);
`docs/version.md` says the same.

```js run
print(typeof version, Object.keys(build));
```

```output
string ["version","hash","date"]
```
