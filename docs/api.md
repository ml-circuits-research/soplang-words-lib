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
### turn(world, readings, options?) and TURN_STAGES

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

`turn` is `turnFlow` with `TURN_STAGES` (read the readings given, dry run, apply, reply;
the fallback when every reading is refused): the library has one request pipeline. A world
that declares its own std.turn stages runs them.

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
- `m.irregular lemma= form= <features> read_only=yes?` (consulted first; a `read_only`
  form is analysed but never generated), `m.fold from= to=` (spelling
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
  and read lazily, one file when a word needs it. `read` may be a list of readers (several
  dictionaries of one language, read in place, never merged into a copy): their rows are one
  dictionary, and the first reader's row wins for a lemma in both.
- `realise(m, template, roles, { dictionary, base, sentence })` fills `{role}`, `{role:f=v,...}`
  (that cell) and `{role@other}` (agreement with another role through unification of their
  feature bundles, which also takes the number and case written for the other). A word the
  dictionary lacks takes `num=pl` by the language world's rules, and `a`/`an` takes its form from
  the next word, when `morphOf` was given that world's types; `sentence: true` starts with a
  capital ("Add an orange house.", "Add 3 mice.").
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

### planner(store, options?), factStore(worlds), PlanLive, readMethods, PLAN_LIMITS

std.plan: goals reached by methods that are knowledge (`k.procedures`, in the format of the
knowledge repository's Q44), decomposed into acts over a live world. `factStore(worlds)`
reads published worlds (`[{ id, schemaText, shards: [{ text }] }]`) into facts merged by
identity, read lazily per type. `planner(store, { chain, prefix, roles })` reads the methods
(`readMethods`). `chain` is `[{ type, keys }]`, what "is a kind of" is, or the store's
`std.know.chain of= key=` facts. `plan(goal, live, { fixed })` takes a goal `{ act, roles }` and a
`PlanLive` (a working copy of the live world: things, history, the world schema's kinds);
`fixed` (`{ binding: value | [values] }`) gives choice points the host decided (still checked:
one that breaks a match is refused), and `seed: null` gives the first solution, the same every
time. A chosen statement row is shown by its key, a history entry by its act.

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

### readMotion(world, options?), planMotionFacts(motion, options?), splitText(splitter, text) and motionRun(plan, apply, clock?)

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
`splitText` applies a splitter. `motionRun(changes, apply, clock)` plays the change points
through the host's clock (`{ setTimeout, clearTimeout }`) and returns `cancel()`. This is the
library's one motion scheduler.

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

### arrange(nodes, layout, options?), arrangementOf(world, text, options?) and outlineOf(parts)

Many things laid out at once, for a diagram kind's layout or an arrangement request ("in a
circle", "evenly", "left to right"). `nodes` are `{ id, w?, h? }` (10 x 10 by default). The
layouts: `row` (left to right), `column` (top to bottom), `circle` (clockwise from the top),
`grid` (evenly), and `layers`, which puts each node one layer after its furthest source in
`edges` ([[from, to]]), layers left to right, or top to bottom with `direction: 'down'`. A
cycle is cut at the edge that closes it, walking from the nodes in their order. `radial`
puts the first node in the middle and the others round it; `scatter` spreads them apart at
seeded places. Options `frame` (0 0 100 100), `gap` (2), `reverse` (right to left, bottom to
top, anticlockwise) and `seed`. It returns a Map from id to `{ x, y, w, h }`.

`path` places the nodes evenly along `points` (closed unless `closed: false`); `outlineOf(parts)`
gives such a path: the convex hull of parts' boxes, for things in the shape of a thing ("a
diagram in the shape of a house").

`arrangementOf(world, text)` reads an arrangement request by the language world's phrases
(`w.lang.en.arrangement text= layout= relation= direction= inverse= diagram_layout=`): the
longest phrase in the text gives `{ text, layout, relation, direction, reverse, diagramLayout,
as }`, where `as` is the `arrange` layout. It returns null when the text names none.

```js run
const at = arrange([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 'layers', { edges: [['a', 'b'], ['a', 'c']] });
print([...at].map(([id, b]) => `${id} ${Math.round(b.x)},${Math.round(b.y)}`).join('; '));
```

```output
a 20,45; b 70,27; c 70,63
```

### composeDiagram(world, options), sampleDiagram(world, options?), diagramTopics(world, kind, options?) and diagramKinds(world)

A diagram from knowledge. A kind (`k.diagrams.kind name= form= layout= edges= role=`) says what
it shows and how it is laid out. Its fills (`k.diagrams.fill kind= type= key= gives= topic=`)
say which knowledge has that structure: the facts of `type` about the topic (through the key
`topic=`), read along `key`:
- `gives=edges`: a tree breadth first when the topic is a value of the key (`is_a`); an edge to
  each value of the topic's own fact (its parts, its neighbours); otherwise the facts about the
  topic joined by the key (`next=` points on, `after=` points back, by name or number).
- `gives=order`: the facts about the topic in the order of the key, one after the other (a
  cycle comes round).
- `gives=members`: the kinds under the topic as groups, with their members.
- `gives=values`: the topic in the middle and the values round it.

`composeDiagram(world, { kind, topic, seed, max, id, frame, into, layout })` tries the fills in
a seeded order and keeps the first with two nodes or more. It returns `{ kind, form, layout,
topic, fill, text, nodes, edges, groups }`, where `text` holds the w.diagram wires
(`w.diagram.diagram`, `.node` with role, shape from `k.diagrams.shape`, n, x, y and parent,
`.edge`, `.group`), laid out with `arrange` by the kind's layout or the `layout` asked for. With
no knowledge of the structure for the topic it returns `{ why }`. `into` is a world to tell the
wires into. `diagramTopics(world, kind)` lists topics with enough nodes, most first;
`sampleDiagram(world, { seed })` draws a kind × a topic; `diagramKinds(world)` lists the kinds
with their fills.

```js run
const w = new World();
w.tell(`@k k.diagrams.kind name=tree form=tree layout=top_down edges=undirected role=root role=item
@f k.diagrams.fill kind=tree type=ex.sort key=is_a gives=edges topic=is_a
@a ex.sort name=fruit is_a=food  @b ex.sort name=apple is_a=fruit  @c ex.sort name=bread is_a=food`);
print(composeDiagram(w, { kind: 'tree', topic: 'food' }).nodes.map((n) => `${n.label}:${n.role}`).join(' '));
```

```output
food:root fruit:item bread:item apple:item
```

### typedWorldFor(schema, knowledge, options?), schemaOf(world), fitsSlot(typed, type, key, text, options?) and freeTextType(key)

The typed readers (`readByTypes`, completeness, arbitration by coverage, `resolveEllipsis`,
`readEnsemble`) type words through a world's facts. A world made of patterns and a matrix has
none, so `typedWorldFor` builds the typed world it needs, at build time per world and at
runtime with the session's things. `schema` is a World (`schemaOf` reads its core.type,
core.slot and core.word) or a plain description, so a host with its own format maps it once:
`{ kinds: [{ type, words, keys: [{ key, value, many, enum, join: { type, by }, text, words }] }],
words: [{ text, means }] }`. The typed world holds:
- each kind with its words, and each key as a declared relation (`k.kinds.relation`), so a
  key is an attribute before any fact carries it, with its words;
- the values of closed sets;
- the things of each knowledge type a slot joins (`knowledge`, up to `max` per type, 5000),
  named by the join's key; when a kind's `name` joins a knowledge type, those things carry
  the kind's keys;
- the session's `things` (`[{ id, label, kind, attrs }]`).

It returns `{ world, slots, lexicon, counts }`. `slots` maps `type|key` to what the slot
expects: `thing` (of a joined type), `value` (a closed set or a yes/no), `number`, or, for a
free-text slot, `name`, `title` or `text` (`freeTextType(key)` guesses from the key; `text`
names it). `fitsSlot(typed, type, key, text)` says whether words fit a slot. A joined slot
takes the name of one of its things, and a closed set one of its values. A name takes words
that are not a question, an act, an attribute or a relation word of the world, so "makes a
cow" is not a name. A title takes any words, and a text anything. The result is
`{ ok, as, id?, value?, why? }`.

```js run
const know = new World();
know.tell('@i k.ex.instrument name=violin');
const t = typedWorldFor({ kinds: [{ type: 'ex.player', keys: [{ key: 'instrument', join: { type: 'k.ex.instrument', by: 'name' } }] }] }, know);
print(fitsSlot(t, 'ex.player', 'instrument', 'the violin').ok, fitsSlot(t, 'ex.player', 'instrument', 'makes a cow').why);
```

```output
true there is no instrument called "makes a cow"
```

### readFrames(world, text, options?) and senseOf(world, id)

Reading by the frames of a language world, as a reader next to machine translation. A language
world declares frames (`<lang>.frame name= en= act= mode= priority=`) as ordered parts
(`<lang>.part frame= at= is= ...`):
- `lead` or `phrase`: an item of `<lang>.phrase name=`;
- `word`: one of its words;
- `verb act=`: a word whose lemma's sense is a verb of that act;
- `det`: a determiner (`<lang>.det form=`);
- `lexicon`: a word of a list (`<lang>.lex name= item=`, or the host's `lexicons`);
- `role`, which takes words (`max_words`), a number (`<lang>.numeral form= value=` or digits),
  a preposition (`<lang>.prep form= rel=`), a list (`<lang>.lex name= item=`) or the rest.

A verb with no dictionary sense is read through the world's `k.actions.verb text= act=` facts (a
verb of several acts is each of them). `needs(name) -> boolean` keeps only the frames whose
`needs` class the host has; `open: true` lets a list the language world does not hold (a host's
lexicon, such as the values of its worlds) take any one to three words, at a cost to the reading.
A frame's fixed values (`<lang>.fixed frame= role= value=`) are roles of its reading, and its
roles are also given as the act's roles in `args` (`<lang>.role_map act= role= act_role=`, the
frame's own map first: make's thing is its kind).

Words are analysed by the language's morphology (`morph`, from `morphOf`, and its lazy
`dictionary` with a sense per lemma), so inflected and unaccented forms read. Items of a phrase
named `skip` are passed over wherever they stand. `readFrames(world, text, { lang, morph,
dictionary, senses, max, lexicons, needs, open })` returns `{ best, frames, tokens }`; a frame is `{ frame, en, act,
mode, roles, args, verb?, score }`, where each role has its `text` and, for words, `words: [{ form,
lemma, sense, en, pos, features }]` and `en` (the reference words). Of the frames that take
every word, the highest priority wins, and words with a known sense count. A role of words is
also cut into `items` at commas and at the language's "and" (`<lang>.particle kind=conjunction
meaning=and`), for a list. `best` is null when no frame takes the text. `senseOf(world, id)` gives `{ act?, en?, pos? }` for a sense id: a verb
fact of an act, or the id's own shape (`<prefix>.<word>.<pos>.<n>`).

```js run
const w = new World();
w.tell('@f ex.frame name=x.make act=make priority=1\n@a ex.part frame=x.make at=1 is=word word=zap\n@b ex.part frame=x.make at=2 is=role role=thing takes=words');
print(readFrames(w, 'zap a tree', { lang: 'ex' }).best.roles.thing.text);
```

```output
a tree
```

### listSums(world, list, options?) and listMeant(world, options?)

The sums of a list, computed and never stored (w.list: the total, what is left, the change,
whether it can be bought). `listSums(world, list, { itemType, link, priceOf, all, tendered })` gives
`{ list, entries: [{ id, text, quantity, price, amount }], total, missing, currency, budget?,
left?, affordable?, tendered?, change?, short?, why? }`. An entry's amount is its quantity (1
when none) times its price (its own, else `priceOf(entry)`: prices are the application's data).
Only open entries count unless `all`. The money handed over (`tendered`) is an event of the
story, such as a pay event, given by the caller. `change` is tendered − total, `short` is what is missing
when less was handed over, and `left` is budget − total. When an entry has no price, the total is
not guessed: `total` is null with `why`. `listMeant(world, { type, name, sort })` is the list a
request means when it names none: the one called `name`, else the one made last. The types and
keys default to w.list's (`w.list.list`, `w.list.item`, `list`). Why a value is so ("why is the
milk done?") is `world.why(id, key)`.

```js run
const w = new World();
w.tell('@l lst name=shop\n@a ent text=puzzle list=$l price=7');
print(listSums(w, 'l', { itemType: 'ent', tendered: 10 }).change);
```

```output
3
```

### readStatement(world, text, options?), tellStatement(world, text, options?), describeThing(world, id) and readAboutSelf(world, text, options?)

Statements about the user read by type, as taught facts (real turns: "I have two kids", "I am
40", "I like cats, dogs and horses", "my name is Ana"). A text whose mood is `statement` is read
against the keys of a person type (`type`; w.person when published): the key is named by one of
its words (`core.word text= means=<key>`, or the key itself). The value is a number, a value of
the key's closed set, a list (a many-valued key: cut at commas and "and"), or the rest of the
sentence as written. A bare number after the copula sets the host's `number` key ("I am 40" →
age). `readStatement` gives `{ mood, facts: [{ key, value | values }], unread, why? }`.
`tellStatement(world, text, { type, subject, tier })` tells the facts on the user's thing
(`subject`, `me`): a single value is replaced, a list grows. `describeThing(world, id)` is what
the world knows about a thing ("what do you know about me"); `readAboutSelf(world, text,
{ subject, ...read })` reads a question about the user through the same keys ("how many kids do
I have"). The person words (`self`, `copula`, `have`, `skip`, `numbers`) default to English.

```js run
const w = new World();
w.load('@p core.type of=ex.person  @k core.slot of=ex.person key=children kind=integer  @w core.word text=kids means=children');
print(tellStatement(w, 'I have two kids', { type: 'ex.person' }).facts, w.get('me').attrs.children);
```

```output
[{"key":"children","value":2}] ["2"]
```

### cycleOf, cycleAdd, cycleDiff, statedDay, readClock and writeClock

Cycles over the members the knowledge declares (`k.time.ordered name= cycle= n=`: weekdays,
months, seasons, parts of the day, stages): `cycleOf(world, member, { type, cycle })` gives
`{ cycle, members, at }`; `cycleAdd(world, member, steps)` the member that many steps round
(negative: before); `cycleDiff(world, from, to)` the steps forward from one to the other.
`statedDay(world, text, { cycle, today })` reads a day the user states ("today is Friday"), which
overrides the host's today. `readClock(text, { words })` reads a time of day on the 12-hour clock
into minutes after midnight ("3 o'clock", "half past 3", "quarter to 4", "10 past 6", "3:30 pm",
"noon"), and `writeClock(minutes, { ampm, words })` writes it back. The clock words default to
English. Facts such as a weekday's `weekend` or a month's season are read like any key.

```js run
const w = new World();
w.tell('@a ex.day name=Mon cycle=wk n=1  @b ex.day name=Tue cycle=wk n=2');
print(cycleAdd(w, 'Tue', 1, { type: 'ex.day' }), writeClock(readClock("3 o'clock") + 120));
```

```output
Mon 5 o'clock
```

### expandRecurrence(rule, start, options?)

The days of a repeating event (RFC 5545's RRULE, the part a calendar needs): `rule` is an RRULE
text or `{ freq, interval, byday, bymonthday, until, count }`, with `freq` daily, weekly, monthly
or yearly, every `interval` periods, on weekdays (`MO`…`SU`) or days of the month, until a date or
a count. `start` is the first day (an ISO date); `{ from, to }` keeps the days in a window, and
`max` (1000) bounds the list. A day a month or year lacks (the 31st, 29 February) is skipped and
not counted. The day names of a language are its language world's; the rule is language-free.

```js run
print(expandRecurrence('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=4', '2026-11-16'));
```

```output
["2026-11-16","2026-11-18","2026-11-30","2026-12-02"]
```

### contrastOf(world, kind, options?)

How a kind differs from its siblings ("how is a circle different from other shapes"): the facts
named for the kind are merged, its siblings are the things of the same type that share a parent
(`kind`, `class`, `is`, `is_a`, `kind_of`), and a key contrasts when few siblings hold the kind's
value. It returns `{ kind, type, parents, siblings, contrasts: [{ key, value, share, others }] }`,
rarest first (std.decide kind `contrast`), or `{ why }`. Options: `type`, `up`, `skip`, `max`.

```js run
const w = new World();
w.tell('@c sh name=circle kind=flat corners=0  @s sh name=square kind=flat corners=4  @t sh name=triangle kind=flat corners=3');
print(contrastOf(w, 'circle').contrasts[0]);
```

```output
{"key":"corners","value":"0","share":0,"others":{"3":1,"4":1}}
```

### loadWorldSet(loader, options), readTurn(set, text, context?), referentOf(set, words) and turnScope(set, owner)

The host kit: what an application needs to run worlds. `loadWorldSet(loader, { names,
language, knowledge, bindings, verbs, session })` loads each world schema of `names`
(`loader(name) -> text`) into its own World with std.acts: `set.worlds.get(name)` is `{ name,
kinds, imports, world }`. A world reads the worlds it imports (`core.module imports=`), and owns
only the kinds it declares. A world that declares no kind of its own, holds a wire of a type
nothing declares, or imports in a circle is refused. `set.schema` holds every schema in one
read-only World (words, slots, the typed world). The language world (its frames, parts, phrases,
closed words and `k.actions.verb` facts) is the reader; `session` names the worlds any turn may
change. `bindings`
maps a frame's `needs` class onto a world's entry kind and keys (`{ entries: { kind, thing,
amount, place, placeKind, placeKey } }`) until the language world says it.

`readTurn(set, text, { lang, active, criteria, morph, dictionary, reply })` reads one message
with the language world's frames, under the Reader contract: a statement or a fragment is not a
request. Every frame the reader kept is bound in turn, and every role a frame filled lands in a
request argument or its words are named as unread: words before the kind's word that are values
of its closed sets become those values ("a round table": `shape=round`); a value role fills the
key the language world's template names (`attribute=name`: "a table called family"); a place
is a referent (`referentOf`) that a slot of the kind takes, and a place the kind cannot take is
said ("A guest has no place at a table."). A required key the request leaves open is asked before
anything is made (`asks`). `undo` and `redo` frames step the live world back and forward.
`arbitrate` chooses the world, with the open tab only as the host's `criteria`. The result is
`{ status: done | ask | not-understood | refused, reading: { frame, act, roles, unread, mood,
complete }, request?, owner?, reply, changed?, asks? }`. A reply has no ids: the language
world's reply fact for the act, else a short sentence with the kind said by its word, its
article and its plural by the language world ("I made 2 tables."). A change frame ("make table 2
square") binds a referent and a value of one of its closed sets (the frames' `value` lexicon is
the set's values). A verb may say several acts (make: make, change). A Romanian reading binds by
the senses' English words ("masa" is the sense table), wherever the kind's word stands ("o masă
rotundă"); unread words are named as written. `examples/seating-app.mjs` runs w.seating in
English and Romanian.

`referentOf(set, words)` finds the thing words name: "table 1" (a kind's word and a name or
number of one of its things, else the n-th made), "the second table" (the language world's
ordinals), "it" (its anaphors: the thing the last turn made or touched), "Ann" (a thing whose
value it is).

A message is cut into clauses (`clauses`, below): "add a table called one and add a table called
two" is two requests, one step each, and nothing runs unless every clause reads. Host readers
(`context.readers`: `fn(set, text, context) -> [{ request, unread }]`) are tried before the frames
(`frames: false` skips those); the kit keeps the contract, the arbitration and the execution. A
request marked `host` (or an act in `hostActs`) goes to `context.onHost(request, set)`, such as
navigation; it is not a step of any world. `budget: { ms }` stops a turn before it runs out of
time (`too-complex`, nothing changed). A clause that does not run may be read as one of the host's
rewrites (`rewrites`: an array for a message of one clause, or `(clause, { set, index, clauses }) ->
[{ text, cost, explains, via }]`), chosen by `chooseRewrite` with std.decide's kind `intent` (`previous`:
phrases of the previous turn; `stop`: more function words; `intentCriteria` or `intentWorld`: another
order); the result then carries `rewrites: [{ said, as, via, changed, why, order }]`. `whole` names things
of several words the cutter never cuts (the schema's own are added); `dry: true` reads, binds and
chooses but runs nothing (`{ status: 'planned', clauses, plans }`). The result's `effects` say what to redraw. `turnScope(set, owner)` tells whether a change (`{ world, type }`, as `readTurn`
returns them for every world) is one a turn addressed to `owner` may make: that world and the
session worlds. A turn runs in the world that owns the kind or holds the thing, and is one step of
the set's timeline: `undo` goes to the world the last step touched. `examples/lists-app.mjs` is a second application on
the kit alone (w.list and w.tasks with a text loop).

```js
const set = loadWorldSet(loadText, { names: ['w.list', 'w.tasks'], language, bindings });
readTurn(set, 'add 2 apples to my shopping list'); // { status: 'done', request: { action: 'make', args: { kind: 'w.list.item', text: 'apples', quantity: 2, list: '$…' } } }
readTurn(set, 'make a list');                      // { status: 'ask', asks: [{ key: 'name' }], reply: 'What name?' }: nothing made
```

### openSession(set, context?), snapshotSet(set), restoreSet(set, data), whyTurn(set, result, context?), replyFrom(language, key, roles, options?) and countClass(language, n, options?)

A session over a world set: the pending question and the slot its answer fills, and the
timeline. `openSession(set, context)` returns `{ set, pending, turns, say(text) }`. A required
key a request left open becomes the pending question (the slot's `ask`, else "What key?"). The
next message fills it when it fits the slot (`fitsSlot`: a value of a closed set, a number, a name
that is not a fragment). A value that does not fit is said and asked again. A message with a verb,
or a question, drops the question and is read as a new turn. A confirmation ("There is no party
list yet. Shall I make it?") is answered by the language world's yes and no
(`w.lang.en.answer polarity=`): yes makes what was missing and runs the message again. The
language world's undo and redo phrases (`w.lang.en.phrase name=undo|redo`) step the live world's
timeline back and forward; one turn is one step.

A question of the language world that asks a reason (`w.lang.en.wh asks=reason`: "why?", "why
did you do that") is answered from the last turn's facts by `whyTurn(set, result)`: what was
asked, and how each value of the things it changed came (told, a default, knowledge), from the
world's own why. A change names only the key it changed. `snapshotSet(set)` is the set as data
(each world's log with its timeline, the steps across worlds, what "it" names), and
`restoreSet(set, data)` puts a set loaded from the same schemas back into that state, undo and
redo included; `session.snapshot()` and `session.restore(data)` keep the open question too.

`replyFrom(language, key, roles, { lang, type, dictionary, count })` says an act in the user's
language from the language world's reply facts (`type`, default `${lang}.reply`: `name=`,
`count=`, `act=`, `role=`, `text=` in std.morph's template syntax). `key` is a reply name
(`done.add`, `not_understood`) or an act. It takes the fact whose roles are all given and whose
plural class is the class of `roles.number`, the one with the most roles first. `{art}` is the
language's indefinite article, agreeing with the word it names; a plural the dictionary cannot
make comes from the language world's inflection rules. Null when there is none. With the
Romanian dictionary, `replyFrom(ro, 'done.remove', { thing: 'masă' }, { lang: 'w.lang.ro',
dictionary })` gives "Am șters masa", and `done.add` with `{ kind: 'masă', number: 20 }` gives
"Am adăugat 20 de mese". `readTurn` says make with `done.add` (a host names others in
`context.replyNames`) and a kind in the user's language through `context.wordOf(type, lang)`.

`countClass(language, n, { lang })` is the plural class of a number by the language world's
CLDR rules (`${lang}.count class= rule=`, with n, i, v, f, t, `%`, ranges, `and`, `or`); without
rules, one for 1 and other otherwise.

```js run
const L = new World();
L.load('@t core.type of=w.lang.en.reply\n@r w.lang.en.reply name=done.add act=make text="I made a new {kind}."');
print(replyFrom(L, 'done.add', { kind: 'list' }));
print(replyFrom(L, 'remove', { thing: 'list' }));
```

```output
I made a new list.
null
```

### KIT_REPLIES

Every sentence `readTurn` and `openSession` can say, by its reply name: the roles it fills and
its English default (`many` with a number). The language world's reply facts of that name
(`${lang}.reply name= count= text=`) say it in the user's language; the default is used only when
the language world has none. The names: `done.add`, `done.remove`, `done.change`, `done.undo`,
`done.redo`, `nothing.undo`, `nothing.redo`, `ask.key`, `ask.make_missing`, `ask.which_world`,
`ask.count`, `not_understood`, `not_understood.fragment`, `not_understood.statement`,
`refused.no_place`, `refused.cannot_be`, `refused.no_such`, `refused.no_world`,
`refused.no_host`, `refused.fragment`, `refused.value`, the std.acts refusal codes
(`refused.not_allowed`, `no_world_kind`, `no_key`, `not_a_number`, `missing_value`, `which`,
`no_room`, `no_world_named`, `no_kind_in`, `no_relation`, `no_aspect`, `nothing_to_show`,
`bad_value`), `refused`, `too_complex.none`,
`too_complex.rest`, `answer.no`, `why.asked`, `why.told`, `why.default`, `why.other`,
`why.nothing`, `why.none`.

A std.acts refusal carries its code and roles in `reason` (`{ code: 'no_key', roles: { kind,
key } }`) beside the English `why`, so a host says it in the user's language; the kit does so with
`refused.<code>`, a kind's roles said by the language world's word.

```js run
print(KIT_REPLIES['ask.key'].roles, KIT_REPLIES['ask.key'].en);
```

```output
["key"] What {key}?
```

### chooseRewrite(text, rewrites, options)

Chooses among a clause and other readings of it that a host proposes ("make the diagram more
beautiful" -> "improve the diagram"). `rewrites` is `[{ text, cost = 1, explains = [], via }]`;
`explains` are the words of the clause that kind of reading accounts for. `options.read(text) ->
{ issues, unfilled?, absent? }` is the host's dry reading: its points of trouble, the typed slots it
leaves open, the things it names that are not there. Each candidate (the clause itself has cost 0)
gets `uncovered` (content words, those not in `options.stop`, neither used nor explained) and
`previous` (1 when it holds every word of a phrase of `options.previous`), and `choose` decides by
the criteria of std.decide's kind `intent`: reads, covers, slots, present, previous, cost (a World's
own facts for the kind, `options.world`, or `options.criteria`, come first). A rewrite is taken only
when it reads strictly better than the clause. Returns `{ chosen, self, changed, order, why }`.
`readTurn` calls it for its option `rewrites`.

```js run
const reads = { 'improve the diagram': 0, 'tidy the diagram': 0 };
const r = chooseRewrite('make the diagram more beautiful', [{ text: 'tidy the diagram', cost: 2, explains: ['make', 'beautiful'] }, { text: 'improve the diagram', cost: 1, explains: ['make', 'beautiful'] }], { read: (t) => ({ issues: reads[t] ?? 3 }), stop: ['the', 'more'] });
print(r.chosen.text, r.why);
```

```output
improve the diagram reads 0, covers 0, slots 0, present 0, previous 0, cost 1
```

### readRequest(world, text, ctx?) and requestWires(request, options?)

Reads one message into a live `w.request`: `{ act, target, refers, text, constraints, reactions, unread,
unreadAt, used }` and, not enumerable, `facts` (the host's flat shape: `{ key, value, neg, all, n, min, max,
unit, step, of, attribute }`). A constraint is `{ on, want, value?, of?, attribute?, relation?, number?, min?,
max?, bound?, amount?, step?, unit?, words, origin: 'said', cue }` with `on` one of `REQUEST_KEYS` (kind,
count, size, extent, attribute, place, manner, layout, with, about, length) and `want` yes / no / not_all.
The words are data: the cues of the language world (`${lang}.cue name= on= lead= between= trail= takes=
priority=`, matched longest phrase first, then priority, then the longer reading with its operand; two cues
of the same words that set different keys both hold, "in a corner" = extent small and place corner), its
determiners, prepositions, number words, inflection (plurals of the kind words) and closed words. Kinds are
the world's (`std.schema.kind`, `core.word`, `std.schema.honours of=`) and the expectation facts' (the
`thing` of `k.expect.make` is a whole, its `unit` is counted, not wanted; its parts and shapes are kinds),
in the world and in `ctx.catalog`. Values are the enums of the kinds' slots and the names of the catalog's
`VALUE_TYPES` (a colour the world lacks is read, so that it can be named). The act is the first verb (the
world's `core.word` for its actions, its action names, then `k.actions.verb` facts), unless a cue phrase
starting there is longer ("make it bigger", "put it back"). What no cue, kind, value or number takes is
`unread` (closed words excepted). `ctx`: `language` (default `world`), `lang` (default w.lang.en),
`catalog`, `dialogue` (`{ last }`: what "it" is), `kinds`, `values`, `valueTypes`, `verbs`, `state` (a world with
the things that are there, default `world`). Also, a phrase that is the name of a thing of the state (its
id, or a free text value of it: a slot with no enum, no reference, not a number, such as a label or a title) is a
reference to that thing (`named: [{ ids, words, at, prep? }]`, `refers: 'named'`), never when the phrase is a value
or a verb of the world or a kind this world has (declared, or with things there); a kind word only the catalog
knows gives way to a name. `mentions`: every kind word read (`{ kind, words, at, unit?, world?, none? }`);
`question: true` when the text ends with "?" or starts with a question word of the language (`${lang}.wh`). The
plural forms of the kind words are the language world's inflection (a plural equal to the singular, "fish", is no
plural); the spelling rule is used only for a language world with no inflection. A kind after a singular indefinite
determiner of the language (`definite=no number=sg`: "a boat") with no number gets a count constraint 1 of that kind,
`origin: 'said'`, `det: true` (never named as not honoured): one is said, not assumed.
A kind after the quantifier of the whole set (the language's `${lang}.partitive mode=all`: "all the fish", "all birds")
gets `all: true` and `plural: true` whatever its form, so an act on things takes every thing of the kind (0.156).
A clause of the speaker (a subject pronoun of person 1, `${lang}.pron case=subject person=1`) whose verb is not an act
is a statement, not a request or a fragment: `statement: true`, its verb in `unread`. A wish word (`${lang}.skip
class=desire`) asks for something only after a modal (`${lang}.aux modal=`: "I would like a cat") or before an
introduced thing (a determiner, a number, "all": "I want a cat"); before a bare kind ("I like cats", "I love comics")
it is a statement (0.156).
`requestWires(request, { id })` writes the request as w.request wires (request, constraints, unread).

```js run
const words = new World();
words.tell(`@c1 ex.cue name=not on=kind want=no lead="not" lead="no" takes=kind priority=2
@c2 ex.cue name=fewer on=reaction value=reduce lead="too many" takes=none priority=3
@c3 ex.cue name=place on=place value=top lead="at the top" takes=none priority=3
@d ex.det text=a text=the`);
const toy = new World();
toy.load(`@acts core.use world=std.acts
@w std.schema.world name=toy
@t.heap core.type of=heap extends=std.schema.thing closed=true
@t.box core.type of=box extends=std.schema.thing closed=true
@t.ball core.type of=ball extends=std.schema.thing closed=true
@k1 std.schema.kind of=heap world=toy acts=make acts=remove
@k2 std.schema.kind of=box world=toy acts=make acts=remove
@k3 std.schema.kind of=ball world=toy acts=make acts=remove
@e k.expect.make thing=heap unit=thing min=4 max=8 typical=6 kinds_min=2 kinds_max=2`);
const q = readRequest(toy, 'make a heap, not balls, at the top, blorp', { language: words, lang: 'ex' });
print(q.act, q.target, q.facts, q.unread);
```

```output
make heap [{"key":"place","value":"top"},{"key":"kind","value":"ball","neg":true},{"key":"kind","value":"heap"}] ["blorp"]
```

### reviseRequest(dialogue, request, options?)

Decides whether a turn is a new request or a reaction to the last result, and revises the last request by
the `w.dialogue.revision` facts of the reaction (`options.revisions`, or `dialogue.revisions`): `flip` (the
kinds of the last result, or the wanted ones, become not wanted), `step` (`on=count`: the count by the scale's
factors, `k.expect.scale` of `options.catalog`, from the result's count; `on=size` / `extent`: one step of the
scale), `add` (the constraints said replace those of the same key), `keep` (the same request, a new seed),
`undo` (the previous request), `none`. A turn with an act and a new thing is a new request; "my expectation
was ..." carries the whole new set. A relative size said in a revision ("make it smaller") is a step from the
last one. Also, a turn with unread words and no reaction cue is never a revision (a request of its own:
its act abduced by the planner when nothing unread stands there, or not understood); an act said on things named
by their names is a request; a fragment (no verb, no reaction cue, not a question) that wants a kind not by a
definite reference ("a sun" after "draw a fish") continues the dialogue's focus: `reaction: 'continue'`, a new
request with the last act (`actFrom: 'dialogue'`; the `w.dialogue.revision reaction=continue` rows when the language
has them, else does=inherit on=act, nothing replaced); a reaction's `step` rows apply only on the keys the turn
names when it names one ("bigger" steps the size, the count stays), on all its rows otherwise.
A revision changes only what it names (0.156): a count step whose turn names kinds of the last result ("fewer cats"
after "three cats and a dog", "less trees" after a forest) steps those kinds' counts alone, every other kind of the
result keeps its count (a count constraint `of` each kind), the target, the whole and the sizes stay (the reaction's
other steps are dropped); a count step with no kind after a result counted by kind steps every kind by the scale's
factor, none below one, the total by at least one. After an act on the things that are there (`dialogue.lastPlan`
a reference plan: "make the house red"), a turn of new values only ("make it smaller", "on the left") is a new
request with the same act on the last things (`refers: 'last'`), not a remake; and an act said on things there with
a size cue that is also a reaction ("make the house bigger") is the change sense of make, a request of its own.
`dialogue`: `{ last, result: { count, kinds }, previous, seed, previousSeed }`. Returns `{ sort:
'request' | 'reaction', reaction, does, request, replace, seed, vary, reply, undo }` (`vary`: plan it varied;
`reply`: a reply name of the revision, such as sorry or welcome).

```js run
const words = new World();
words.tell(`@c ex.cue name=fewer on=reaction value=reduce lead="too many" takes=none priority=3
@v w.dialogue.revision reaction=reduce does=step on=count direction=down
@s1 k.expect.scale step=small order=2 count_factor=0.5 size_factor=0.7 extent=0.25
@s2 k.expect.scale step=default order=3 count_factor=1 size_factor=1 extent=0.6`);
const toy = new World();
toy.load('@w std.schema.world name=toy\n@t.box core.type of=box extends=std.schema.thing\n@k std.schema.kind of=box world=toy acts=make');
const last = readRequest(toy, 'make boxes', { language: words, lang: 'ex', verbs: { make: 'make' } });
const r = reviseRequest({ last, result: { count: 6, kinds: { box: 6 } } }, readRequest(toy, 'too many', { language: words, lang: 'ex' }), { revisions: words, catalog: [words] });
print(r.sort, r.reaction, r.replace, r.request.facts);
```

```output
reaction reduce true [{"key":"kind","value":"box"},{"key":"count","n":3}]
```

### planRequest(live, request, options?), runPlan(live, plan, options?), capabilitiesOf(live, opts?), declares(live, act, kind, opts?), honoursKind(h, kind, opts?), REQUEST_SOURCES, REQUEST_KEYS, VALUE_TYPES

Plans a request in any live world from what it declares, and fills every gap by one mechanism.
`declares(live, act, kind, { catalog })` says whether the world declares the kind for the act: the kind is declared in the world
knowledge base explicitly, or taken by join (`std.schema.kinds world= from=<type> key=name acts= stand_in=<type>`: every row of
the type is a kind with those acts, a row's `drawing=` is the base it is drawn as, so a villa counts through the house), or is a
subkind of one, and a `std.schema.honours` row of the act covers it (`of=` names the kind, a parent, or the joined type). The
host calls it instead of reading the honours rows. A kind taken by join is declared for its acts, it is not planned as a
whole: the catalog's `k.expect.make` of it (a tree of a trunk and a crown) is its own only when the world declares that whole (a
`k.expect.make` row of its own in the world, or the kind in `std.schema.kind`), so joining `k.objects.object` leaves "draw two
dogs and a tree" a dog, a dog and a tree. A world may have several `std.schema.kinds` rows (`from=k.objects.object`,
`from=k.people.kind`): `world` and `from` together identify a row and the kinds of all rows are merged (the first row naming a
kind wins). The acts that run a plan find the joined rows through the catalog like `capabilitiesOf` does: `planRequest`'s
fork, `runWorldPlan(live, plan, { catalog })` (the std.acts find the kind in the catalog; without it a joined kind is "no world
here has"), the binding of a step (`of=` names the kind, a parent or the type it is joined from) and `mirrorState`. A `std.tool.param` of type `kind` with no `accepts=` list takes every such
kind. A numeric attribute cue (`on=attribute takes=number unit=`, "by 30 degrees") reads as an attribute constraint with
`value`, `number` and `unit`; `readRequest` never throws on a cue.
`capabilitiesOf(live, { catalog })` reads the declarations: `std.schema.honours act= on= of=` (the constraints an act
honours, for the things named) and `std.schema.kind` (what can be made, with which acts). A constraint said
that the act does not honour is in `notHonoured` (`{ on, words, why, code }`, code `not_declared`); so is a
declared one nothing in the world takes (`no_slot`), a value a slot refuses (`value`), a kind it has not
(`no_kind`), and exclusions that would leave nothing (`nothing_left`, the oldest gives way). The gaps are
filled from the sources in the order of `options.sources` (default `REQUEST_SOURCES`: said, dialogue, induced,
world, expect, sampled; a value's place in that list is also its cost as an assumption): the target (said, the dialogue's, the world's first declared whole), the expectation of it
(`k.expect.make` / `k.expect.part` in the world, then in `options.catalog`), the count (a number, a range, a
named amount `k.expect.amount`, "about N" by its factors, else the expectation's typical count times the
size's `count_factor` of `k.expect.scale`, else one; plural kinds alone take the amount `some`), the kinds
(the shapes of a varied part, or the parts of a whole, or the kinds said; wanted / not wanted / not all), the
layout (said, the dialogue's, the expectation's, the slot's default), the size and extent factors, attributes,
place, topic and length, each put on a slot of the whole or of every item where one takes it. "random" (and
`options.vary`, a redo) samples with `options.seed` inside the range, never its minimum. The act may be left
out when nothing is unread: the dialogue's, else the only act the world declares for the thing named; an
unread word where the act stands is never guessed over.
A general whole with no expectation of its own ("a random picture", "a picture with a lake": the target has no
`k.expect.make`, its subkinds by the world's lineage do) is planned as one of those subkind wholes with its parts:
those whose parts hold every kind said with it (by lineage and `std.schema.drawn`), among them those a
`std.tool.bind act=make` names when the world declares bindings, sampled by the seed; the subkind is in `assumed`
(`{ key: 'kind', value, from: 'sampled', of }`) (0.156). Kinds counted each by a number of their own ("3 circles" of a
picture's shapes, or a revision's counts by kind) are planned with those counts, inside a whole too. An act on things
whose place is said by a thing of the view ("into the water", "next to the pond": the newest thing of that kind, by
lineage and `std.schema.drawn`) gives each step `region: '$<id>'` and `relation` (the cue's relation, "in", "next
to"), for a binding to take as `step.region` / `step.relation` (0.156). A size said as a step ("make the house
bigger") gives each step `stepped: { size: { from, dir } }`, so that `nearestAccepted` translates past the size the
thing has, in the step's direction, when the tool takes no grade in between.

A turn with an unread word that matters is never planned (0.157): `unreadThatMatters(request)` is every word of
`request.unread` (the reader leaves closed words out; the reading alone decides, no word list), inside a constraint or
role span or not, in a request or in a reaction. `planRequest` then returns `{ ok: false, steps: [], unread: [words] }`
before anything else; `runPlan` (`runWorldPlan` and the tool run) refuses such a plan with `failed: { code: 'unread',
reply: 'not_understood', roles: { words } }` and calls nothing, and `sayRequest` says `not_understood` ("I did not
understand: blorfish."). So "move a fish in the corner on the right" with a place that is not read moves nothing, in
every host, whatever else in the turn is readable. A count said with "with" ("a picture with a lake", "a lake with
three fish": `a`, `an` is one) is that many of the kind inside the whole, never the whole's count, and the plan's
`bounds.count` allows the items it adds. `reviseRequest` on "fewer X" where the last result has neither X nor a kind of X
(and has several kinds) gives `{ request: null, reply: 'refused.no_such' }` and keeps the result.

Around that plan runs one bounded reasoning cycle on the state of the live world (owner 2026-11-15), the same for
every world, a generate-and-test with constraints:
- **induce**: the common pattern of the world's things of the kinds made (anti-unification, one step, `induceStyle`:
  at least `REASONING.induceMin` = 3 things; the things `options.replace` names do not count) and of the session's
  corrections (`dialogue.corrections`, `induceCorrections`: "too many" twice makes a new thing smaller) become
  values of source `induced`, before the world's own facts and k.expect; never a constraint;
- **propose**: at most `REASONING.candidates` = 5 candidates: where the items could go (a slot of every item kind
  that refers to things, when the items do not go in a whole made with them: the things of that type, the
  dialogue's first, then the newest; a place said by a kind ("in the pond") or by a reference word ("there", "in
  it")), and once a fall-back without the induced and dialogue values when a candidate breaks a hard constraint;
- **simulate**: each candidate runs on a fork of the live world;
- **deduce**: `deduceState` on the simulated state, forward chaining to depth 2: what the world refuses (types,
  enums, deny rules, capacity), relations to things that are not there and the plan's `bounds` (kinds not wanted,
  the count said) are hard and drop the candidate; what the catalog expects of the kinds present (`KIND_FACTS`:
  k.commonsense, k.scenes, k.kinds; "a fish is at water", "a pond is a thing made of water") and open required keys
  are soft and cost;
- **abduce**: the survivors are ranked by `choose` with the criteria of kind `plan` (std.decide, or the world's own
  `std.decide.criterion of=plan`): consistent, honoured, expected (soft cost), cost (the assumptions weighted by
  their source, weighted abduction), assumptions, near (the referent).

Every value a plan fills has passed that check before it is used. Bounded by `options.candidates`, the depth 2 and
a tick budget (`options.ticks`, default `REASONING.ticks`); `options.reason: false` gives the plan alone. Returns
`{ ok, act, target, roles, steps: [{ action, args, item?, link? }], assumed: [{ key, value, from }], notHonoured,
rejected: [{ place, label, why, hard }], cannot: [{ why, words }], bounds, reasoning: { candidates, depth, ticks,
exhausted, induced, soft, derived, chosen }, seed, sources }`: when no candidate survives, `ok` is false and
`cannot` says why. Nothing is changed.
0.152: a general kind said ("books", not makeable itself) is a mix of its makeable subkinds by the world's lineage, and a
kind not wanted excludes its subkinds too; coordinated kinds ("two novels and a comic") keep each count with the kind
it stands before (a kind with no number is one); "3 necklaces" (a count of the whole) plans that many wholes; the
target is never taken from the dialogue or the world over an unread word (0.152.1); the
conditional expectations and the kept structure of a count revision are described under `expectedValue` below.
`runPlan(live, plan, { replace })` (`runWorldPlan`) runs the steps through `act` (`{ step: i }` names what step i made),
after removing the things of `replace` (the last result: a revision replaces it); it returns `{ ok, made,
failed, result: { things, items, count, kinds, whole, layout, links } }`.

```js run
const toy = new World();
toy.load(`@acts core.use world=std.acts
@w std.schema.world name=toy
@t.heap core.type of=heap extends=std.schema.thing closed=true
@t.box core.type of=box extends=std.schema.thing closed=true
@t.ball core.type of=ball extends=std.schema.thing closed=true
@k1 std.schema.kind of=heap world=toy acts=make acts=remove
@k2 std.schema.kind of=box world=toy acts=make acts=remove
@k3 std.schema.kind of=ball world=toy acts=make acts=remove
@h std.schema.honours act=make on=kind on=count of=heap
@e k.expect.make thing=heap unit=thing min=4 max=8 typical=6 kinds_min=2 kinds_max=2
@p k.expect.part of=heap part=thing group=node min=4 max=8 typical=6 shape=box shape=ball`);
const q = { act: 'make', target: 'heap', text: 'a heap at the top', unread: [], constraints: [{ on: 'place', want: 'yes', value: 'top', words: 'at the top' }] };
const p = planRequest(toy, q);
print(p.roles.count, p.roles.kinds, p.assumed, p.notHonoured.map((x) => x.code));
print(runPlan(toy, p).result.kinds, REQUEST_SOURCES);
```

```output
6 ["box","ball"] [{"key":"count","value":6,"from":"world"},{"key":"kinds","value":"box, ball","from":"world"}] ["not_declared"]
{"box":3,"ball":3} ["said","dialogue","induced","world","expect","sampled"]
```

### stateIds(live, view?, ids?)

The things of a world's state, never its declaration or knowledge rows (questions Q90): the ids of
`view` (default `factsOf(live)`; or of `ids`) whose wire's type is a `std.schema.thing`, as the acts read the
things of a world. A `std.schema.drawn kind= as=` row or a `k.expect` row has a kind but is no thing an act takes:
"remove everything" removes the things of the state and leaves every declaration. `planRequest` takes the things of
an act (by kind, by name, the whole world, the places of a candidate) and the change sense of make through it. A
world with no `std.schema.thing` type keeps every id.

```js run
const toy = new World();
toy.load(`@acts core.use world=std.acts
@w std.schema.world name=toy
@t.box core.type of=box extends=std.schema.thing closed=true
@k std.schema.kind of=box world=toy acts=make acts=remove
@d std.schema.drawn kind=box as=square
@b1 box kind=box world=toy`);
print(factsOf(toy).ofKind('box'), stateIds(toy));
```

```output
["d","b1"] ["b1"]
```

### factsOf(world), kindFactsOf(catalog, types?), deduceState(view, ids, options?), induceStyle(view, types, options?), induceCorrections(list, options?), REASONING, KIND_FACTS, REASON_RULES

The first layer of reasoning of the gap filler, on one view of any world. `factsOf(world)` is the world as facts:
every wire that is not a pattern or a matrix wire is a thing with its kinds (its type, the types it extends, its
`kind` values), its attributes `(thing, attribute, value)` and its relations `(thing, relation, thing)` (a `$`
reference, or a join a slot declares with `type= by=`). Rules are written against this view only. The view is kept
per `world.version`; a new version is built from the last view of the same history (the world's own, or that of
the world it was forked from, found by the events they share) by the events since, as a layer over it, flattened
past `REASONING.flatten` changed things. Methods: `thing(id)`, `ids()`, `ofKind(kind)`, `values(id, key)`,
`related(id, relation?)`, `inbound(id, relation?)`, `attributes(id?)`, `relations(id?)`.

`kindFactsOf(catalog, types = KIND_FACTS)` reads what a catalog says of kinds: each row of a listed type is facts
of the kind its `by` key names; a row with `key`, `value` and `parent` (k.kinds.parent) says `(kind, key, value)` and
`(kind, is_a, parent)`. `deduceState(view, ids, options)` is forward chaining as in Datalog, bottom-up to depth 2
(level 1: what the catalog says of a thing's kinds; level 2: of their is_a parents), then the constraints of
`REASON_RULES` on the things `ids`: `join` (a relation names a thing that is there; hard), `placed` (a kind the
catalog places at somewhere, by `at` or `place`, is in or on a thing that is such a place, by its kind or by the
catalog's facts of it; soft, each inference step of the chain costs `step`), `open` (a required key is open; soft),
`request` (the `bounds` of a plan: kinds not wanted, the count said; hard). Options: `catalog` or `kindFacts`,
`bounds` ({ count, not, items }), `depth`, `budget` ({ ticks, used }), `required(thing)`, `placeable(id)`. Returns
`{ hard, soft, derived, cost, ticks, exhausted }`. `induceStyle(view, types, { except, min, keys })` is
anti-unification, one step (Plotkin 1970): at the first type of `types` with at least `min` things, the attribute
values all of them share (`{ of, n, pattern }`, or null). `induceCorrections(list, { min })` does the same over the
last `min` corrections (`{ on, step, value }`). `REASONING` holds the bounds: 5 candidates, depth 2, the ticks of
one plan, 3 things to induce from, 2 corrections.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
@w std.schema.world name=toy
@t.box core.type of=box extends=std.schema.thing closed=true
@t.ball core.type of=ball extends=std.schema.thing closed=true
@s.in core.slot of=ball key=in type=box
@s.colour core.slot of=ball key=colour enum=red enum=blue
@k1 std.schema.kind of=box world=toy acts=make
@k2 std.schema.kind of=ball world=toy acts=make`);
w.act({ action: 'make', args: { kind: 'box' } });
for (let i = 0; i < 3; i++) w.act({ action: 'make', args: { kind: 'ball', colour: 'blue', in: '$box1' } });
const v = factsOf(w);
print(v.ofKind('ball'), v.relations('ball1'), v.inbound('box1').length);
print(induceStyle(v, ['ball'], { keys: () => ['colour'] }));
const kb = new World();
kb.load('@t core.type of=ex.thing\n@a ex.thing name=ball at=bag');
print(deduceState(v, ['ball1'], { kindFacts: kindFactsOf(kb, [{ type: 'ex.thing', by: 'name' }]) }).soft.map((x) => x.why));
```

```output
["ball1","ball2","ball3"] [{"thing":"ball1","relation":"in","to":"box1"}] 3
{"of":"ball","n":3,"pattern":{"colour":"blue"}}
["a ball is usually at bag, not in box1"]
```

### repairWords(tokens, options?), editCost(a, b, max?), worldWords(world), languageWords(language, lang?), SPELL, SPELL_SOURCES, SPELL_COSTS

A generic, deterministic contextual spell repair (no world ids, no per-app code). `repairWords(tokens, { worlds,
dialogue, lang, language, lexicon, dictionary, protect })` returns `{ tokens, repairs: [{ from, to, source, cost, at }],
asks: [{ from, at, candidates: [{ word, source, cost }] }] }`. Candidates: the words of the first (open) world, of the
other live worlds (`worldWords`: thing names, labels, string values and kinds from `factsOf`, plus its declared kinds,
words and actions), the dialogue's recent words (`dialogue.words`, `last.text`, `history`), then the language
dictionary (`languageWords`: the text, form and cue words of the `<lang>.*` wires, plus `dictionary`). The score is a
keyboard-aware edit cost (`editCost`, `SPELL_COSTS`: adjacent QWERTY key 0.4, missing diacritic 0.1, doubled or
dropped letter 0.5, swapped neighbours 0.6, any other edit 1) plus the source prior, DATA in `SPELL_SOURCES`
(world 0, worlds 0.1, dialogue 0.2, dictionary 0.3). The threshold applies to the edit cost alone (`SPELL`: 1.0 for
4 letters, 1.2 from 5), so a prior never lets a far word win. A token is repaired only on a unique best (the runner-up
at least `SPELL.margin` 0.25 worse); otherwise it is left and an `ask` lists the top 3. Never changed: a known word
(of any source), a number, a word under 4 letters, a capitalized word that does not start the message, quoted text,
and `protect`ed words. `readRequest(world, text, { spell: true | options })` uses it as one candidate source inside the
reader (the open world's own lexicon, `ctx.catalog`/`dialogue` and the language's closed words are passed in; names and
quotes are protected from the raw text) and returns `request.spell = { repairs, asks }`; off by default.

```js
const r = repairWords(['show', 'the', 'trubine'], { worlds: [openWorld, otherWorld] });
// r.tokens -> ['show','the','turbine']; r.repairs[0] -> { from: 'trubine', to: 'turbine', source: 'world', cost: 0.6, at: 2 }
```

### sayRequest(request, outcome, options?), ASSUMED_SAY, ASSUMED_MAX

The reply of a request as reply facts, each a reply name of the language world with its roles, and their
text by `replyFrom`: the revision's reply (`outcome.reply`: sorry, welcome), `done.revise` (`outcome.revised`, not after a step such as "fewer" or "bigger": that is said by its net result, 0.157),
`done.make` / `done.make.value` (the whole made, or each kind with its number), `assumed` (`{ key, value }`, each
default used), `not_honoured` (`{ words, why }`, also for each reason of `outcome.cannot`), `unread` (`{ words }`, after a turn that made something), `not_understood` (`{ words }`, a plan not made for unread words), `done.about` / `done.title` (`{ whole, topic | title }`, what was said of a made whole: "The story is about ancient hobbits", 0.159), `short_of` (`{ made, asked, kind | unit }`: the knowledge held fewer parts than asked, or the host's composer wrote fewer words; from `outcome.short`, a plan's `short` `{ made, asked, kind, from }` or the host's own), and `done.place.<relation>` (`{ thing, number, value }`) for a move to a thing of the view when the language has that reply ("I moved 2 fish into the lake."), else the change as before.
The values the user said are said per kind, from the request's per-kind attribute constraints (`attribute colour=red of=boat`,
`attribute colour=blue of=house`), not one value for the turn: "I drew a red boat. I drew a blue house." A run through a tool
binding says `done.add.value { kind, number, value }` for the things made (the view shows the value said; a language without
that reply falls back to `done.make.value`, then to `done.add`), a run through the acts says `done.make.value`; kinds with
different values are different facts ("2 red comics and 3 blue novels"), a value said of no kind goes to every kind as before.
`outcome` is the plan with `run` (runPlan's result). `options`: `language`, `lang` (or a language code such as
'en'), `dictionary`, `say` (the sources of an assumption that are said; default the language world's
`<lang>.reply name=assumed say=` values when it has them, else `ASSUMED_SAY`: every source but `default`, a tool
parameter's declared default, the weakest expectation a person takes for granted; one rule for every key).
The reply says only the assumptions that matter, all of it data: an assumption flagged `default: true` (a
value that is the world pattern's own declared default: the layout of a make expectation or a slot default, a tool
parameter's default, a place the world arranges) is of the source `default`, so not said unless `say` lists it; the
sources are ranked by their place in `say` (the strongest first) and at most `sayMax` are said (default `ASSUMED_MAX`
= 2, or `<lang>.reply name=assumed max=`), one per key; a list of kinds and a single kind are one fact (a fact another
says in full is dropped); the kinds, and the count, that the result lines already state are not said again; a kind
that `std.schema.drawn` draws as another (oval as ellipse) is not an assumption (`runPlan`'s `assumed` leaves it out;
`translated` keeps it). No reply carries a missing value: a changed key whose new value cannot be said (`undefined`,
`null`, `NaN`, empty) is said by its direction, the word of the request's own reaction ("bigger", "more"), or the line
is left out; a reply fact with an unfilled role is dropped, and no text contains "undefined", "null" or "NaN". A
revision of a whole (`outcome.revised`, a run with a `whole`) says the whole's net state, the parts by kind from the
run's result, as one `done.whole` fact (roles `whole`, `parts`: "The necklace now has 5 rounds, 4 squares.") instead of
the operations that re-laid it; operations (`done.add`, `done.remove`, `done.change`) remain for acts on individual
things. The English sentence is a default of the library until the language world publishes `done.whole`. The whole
is said before its parts (`done.add` / `done.remove` of the thing the plan made first, or of things of the whole's
kind, come first: "I added a forest. I added 6 trees."); a reference plan (`outcome.reference`) never says
`done.revise` (0.156). Returns `{ facts, text, missing }` (`missing`: the reply names the language world lacks).

```js run
const words = new World();
words.tell(`@r1 ex.reply name=done.make count=one text="I made a {kind}."
@r2 ex.reply name=assumed count=one role=key role=value text="I took {value} for the {key}."
@r3 ex.reply name=not_honoured count=one role=words role=why text="Not {words}: {why}."`);
const q = { text: 'make a heap at the top', unread: [], constraints: [] };
const outcome = { target: 'heap', assumed: [{ key: 'count', value: 6, from: 'world' }], notHonoured: [{ on: 'place', words: 'at the top', why: 'a heap has no place here' }], run: { result: { whole: 'heap1', kinds: {} } } };
print(sayRequest(q, outcome, { language: words, lang: 'ex' }).text);
```

```output
I made a heap. I took 6 for the count. Not at the top: a heap has no place here.
```

### runPlan(plan, bindings, primitives, opts?), toolBindings(live, opts?), toolTimeline(), toolSession(live, primitives, opts?), toolCapabilities(live, bindings?, opts?), askWorld(question, request, opts?), nearestAccepted(value, param, opts?), readView(view), stateDiff(before, after, opts?), mirrorState(live, view, opts?), runWorldPlan(live, plan, options?), TOOL_ARG_SOURCES, WORLD_QUESTIONS, STATE_FEW

Tool binding as wires (0.152; owner 2026-11-15: the glue between a live world and the generic mechanisms is
declarative, only the tool's concrete actions are code). A world declares its tool in the `std.tool` module
(`core.use world=std.tool`):

| Wire | Keys |
| --- | --- |
| `std.tool.op` | `name` (id), `world`, `param` (many), `effect` (makes, removes, changes), `doc` |
| `std.tool.param` | `op`, `name` (id together), `kind` (the value's kind: `integer`, `number`, `string`, `atom`), `type` (a kind of the world: the value is it or a subkind, or a thing of it in the view; or a scale type: rows with an order; `kind` for any kind by `accepts`), `accepts` (many: the values the tool takes), `scale`, `by` (the key naming a grade; default the type's id slot), `order` (default `order`), `min`, `max`, `default` (taken when no source gives a value, after the expectations), `required` (true / yes) |
| `std.tool.bind` | `world`, `act`, `of` (many: the kinds, by lineage; none = any), `op`, `arg` (many, the short form: `<param><-<source>|<source>...`), `needs` (many: `exists(arg)`, `absent(arg)`, or a declared constraint `name(arg, ...)`), `makes` (default: something added when the op's `effect` is makes), `removes`, `changes` |
| `std.tool.arg` | `bind` (`$` the binding), `param`, `from` (many: the sources, in order) - one argument of a binding (the review's form; the same as `arg=` inline) |
| `std.tool.needs` | `op`, `exists` (many: a thing of that kind, by lineage, is in the state), `absent` (many), `check` (many: a declared constraint), `args` - the preconditions of an op, for every binding of it |
| `std.tool.custom` | `name` (id), `world`, `kind` (constraint or search), `in` (many), `out`, `fails` (the reply name said when a constraint fails), `doc` |
| `std.tool.value` | `op`, `param`, `value` (ids together), `as` - the tool's own name for an accepted value of the world: the call gets `as` (the engine's `medium` for the world's grade `default`) |

The sources of an argument (`TOOL_ARG_SOURCES`) are `step.<key>` (the plan step's value; `step.count`: how many
steps of the same values one call takes, which groups them; `step.things`: the ids of the things they act on),
`request.<on>` / `request.attribute.<a>` (the constraint said), `state.<kind>` (the thing of that kind the request
names, else the newest one in the view), `result.<n>` (the id step n of the same plan made), `plan.<role>`, `custom.<name>` (a declared search,
called with the arguments so far and the view), `value.<atom>` (a literal of the wires) and `expect`; a conditional
expectation is always the last source. Filled in that order (said, revised, the plan's values with their
provenance, expected), each value is translated by `nearestAccepted` when the parameter does not take it as said:
a number into its range; a kind to the nearest accepted kind of its lineage (`kindLineage`: what `std.schema.drawn
kind= as=` says it is drawn as, its core.type parents, the catalog's k.kinds.parent, then an accepted kind of which it
is the parent); a grade to the nearest accepted grade of the ordered scale (k.expect.scale: tiny -> small, huge ->
big; ties in the order of `accepts`; with `opts.toward` `{ from, dir }`, a value reached by a step goes to the nearest
accepted grade past `from` in that direction, when there is one). Every value not said is in `assumed` with its source (`translated` with `was`
and `by`).

`runPlan(plan, bindings, primitives, opts)` resolves the binding of each step (by act and the nearest kind of the
lineage), fills and translates the arguments, checks the preconditions, calls the primitive (`primitives[op](args)`;
`false` or `{ ok: false, code, reply, roles }` refuses), reads the view before and after (`opts.view`, default
`primitives.view`: things `{ id, kind, ...attrs }` or facts `{ thing, attribute, value }`) and checks the effect
(`makes=` something added). The plan is all or nothing: a failing step takes back the steps before it. It owns the
timeline (`opts.timeline`, `toolTimeline()`): one plan is one entry; with `replace` (a revision) the last entry is
undone first and the plan takes its place (never for a reference plan, an act on the things that are there: it is
a step of its own, and `toolSession` says it as that act, not as a remake); `{ act: 'undo' }` / `{ act: 'redo' }` move it; a plan with `question`
is no step. Undo uses `primitives.snapshot()` / `restore(s)` when the tool has them, else the inverse of the
entry's diff through the bindings (remove what was added, make again what was removed, set back what changed).
Returns `{ ok, diff: { added, removed, changed }, same, replaced, calls, assumed, translated, failed?, result, step }`;
`diff` leaves out a thing taken away and one like it put back, so a revision that asks for what is there gives
`same` and an empty diff. With a World first, `runPlan(live, plan, { replace })` is `runWorldPlan`: the steps through
the world's own `act`, as before.

`toolBindings(live)` reads and checks the declarations (`problems`: an op, a parameter, a source or a custom
function named and not declared, a required parameter without a source). `toolCapabilities(live, bindings, { catalog })` (0.159: the kinds a world joins from the catalog are offered, as `capabilitiesOf` lists them; `askWorld` passes its catalog): the acts
a world offers (honoured and bound) with their kinds and keys. `askWorld(question, request, { live, bindings, view })`
says facts of the live world for the questions of `WORLD_QUESTIONS`: `capabilities` (the declarations) and `state`
(the things of the kinds asked, by lineage, counted per kind: `state.count`, `state.empty`; the kinds asked are the
kinds wanted and the kinds a count is of, else every kind word said, a unit such as "beads" too: a whole or a link is
counted only when its kind is said). With few things in the view (`STATE_FEW`, 4, or `opts.few`) a state answer names each
thing's said attributes, grouped per kind: `state.count.value { kind, number, value }` ("There is a red boat. There is a blue
house."; the keys are those of `VALUE_TYPES`, `opts.valueTypes`, and the attributes the question names; a language without the
reply says `state.count`); many things are only counted. 0.161: one thing of a kind with a `title` or `name` (`opts.nameKeys`) is
named by it: `state.count.named { kind, number, name }` ("There is one story, \u201cAll about the fox\u201d."). A world pattern's `about` and
`place` constraints keep `said`, the person's own words of the operand, and a reply fact names a said value by them
("The story is about a fox."). `mirrorState(live, view, { catalog })`
tells the tool's things into a fork of the declarations so that the planner's reasoning (induction, places, deny
rules) sees them. `toolSession(live, primitives, { language, catalog, revisions })` is the door with no code per
world: read, a question (a reaction of the language world named in `WORLD_QUESTIONS`), undo / redo (the acts), revise,
plan (on the mirrored state, with the last plan in the dialogue), run, say. A message read only in part executes
nothing (`not_understood` with the words). `planRequest` plans an act on things that are there (remove, change, place)
by a reference step over the state: "them" / "it" are the last result, else the things of the kind named (by lineage,
the kinds not wanted left out), filtered by the values said before the kind; the values after it are the new values;
several things for a singular kind is one question (`refused.which`, no step; "a novel" with an indefinite determiner
is any one, the newest), none is `refused.no_such`. "Everything" (a word of the language's grammar that
alone is a noun phrase of `set=all`), the world's name (`std.schema.world name=`) and every word of the kind that name
means are the whole world: an act takes every thing of a declared kind it is declared for (`plan.whole = 'world'`),
and such a word after a preposition ("on the shelf") is no place. The change sense of make: a make whose object refers
to things that are there ("it", "everything", a kind with a definite determiner of which there are things) and that
says only values after it ("make the comic blue", "make the atlas smaller": one grade from the size it has now) is
planned as `change` (`plan.act = 'change'`, `plan.sense = 'change'`) when the world honours change; a value before the
kind ("make a red comic") keeps make; `reviseRequest(..., { live })` lets such a turn be a request of its own.
`sayRequest` speaks from the run's diff (`done.add`, `done.remove`, `done.change` with roles `thing`, `number`,
`key`, `value`, `done.undo`, `why.nothing` with the reason's reply, `nothing.same`), from `outcome.capabilities`
(`can`, `can.say`) and `outcome.answer` (askWorld's facts); a fact with a `key` is said by the reply named
`<name>.<key>` when the language has one (`done.change.place`: "I moved the atlas to the left."), else by `<name>`.

The diff `runPlan` returns is the net change (0.153): `stateDiff(before, after, { match: true, keys })` matches a
thing removed and one added by kind and values (the pairs most alike first; references to redone things alike), says
a pair that differs as `changed` (with `was`), and says only the keys the plan set (of a revision: those it set
otherwise than the plan it replaced; a place the tool computes is not said unless nothing else changed); `same` is
exact (the same things with the same values, ids aside). A reference step the tool carried out whose key the view
cannot show (a move inside one region) is said from the call (`by: 'call'`); a change key is said by the request's key
the binding took it from (`arg=end<-step.place`: `as: 'place'`). A change binding's changed values are never filled
from expectations or defaults. Undo by inverse leaves out keys no change binding takes.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
@tool core.use world=std.tool
@w std.schema.world name=box
@t.ball core.type of=ball extends=std.schema.thing closed=true
@s.size core.slot of=ball key=size enum=tiny enum=small enum=big
@k std.schema.kind of=ball world=box acts=make acts=remove
@h std.schema.honours world=box act=make on=count on=size of=ball
@g1 ex.scale step=tiny order=1
@g2 ex.scale step=small order=2
@g3 ex.scale step=big order=3
@o std.tool.op name=put param=n param=size effect=makes
@p std.tool.param op=put name=size type=ex.scale by=step accepts=small accepts=big
@o2 std.tool.op name=take param=ids effect=removes
@b std.tool.bind act=make of=ball op=put arg=n<-step.count arg=size<-step.size makes=thing
@b2 std.tool.bind act=remove op=take arg=ids<-step.things removes=ids`);
let balls = [], next = 1;
const tool = { put: ({ n, size }) => { for (let i = 0; i < n; i++) balls.push({ id: `x${next++}`, kind: 'ball', size }); }, take: ({ ids }) => { balls = balls.filter((b) => !ids.includes(b.id)); }, view: () => balls.map((b) => ({ ...b })) };
const timeline = toolTimeline();
const plan = planRequest(w, { act: 'make', target: 'ball', text: '3 tiny balls', unread: [], constraints: [{ on: 'count', want: 'yes', number: 3, words: '3' }, { on: 'size', want: 'yes', value: 'tiny', words: 'tiny' }] });
const r = runPlan(plan, toolBindings(w), tool, { timeline, live: w });
print(r.calls.map((c) => [c.op, c.args]), r.translated, r.diff.added.length);
print(runPlan({ act: 'undo' }, toolBindings(w), tool, { timeline }).ok, balls.length);
```

```output
[["put",{"n":3,"size":"small"}]] [{"key":"size","was":"tiny","value":"small","by":"ex.scale"}] 3
true 0
```

### A whole with slots of parts: joined kinds as a type, values from a catalog, what a thing can be (0.162.0 to 0.164.0), canBe(live, predicate, catalog?)

A world instance that takes its kinds from a knowledge base by join can say which of its own types the joined kinds are:
`std.schema.kinds world= from=<type> key=name acts=... as=<type of the world>`. The joined kinds are then kinds of that
type: they take its slots (a part's colour, size and variant; a preset's mood), `kindLineage` holds the type, std.acts makes
them as things of it, and `mirrorState` tells the tool's things of those kinds as things of it, with the values its slots
take. Without `as=` a joined kind stays an open `std.schema.thing`, as before.

Values the reader takes from declarations and the catalog (`readRequest`):
- a slot typed by a catalog type and named by a key of its rows (`core.slot of=part key=variant type=<T> by=name`): every
  row's name is a value of that key. With `match=kind:<k>` a value belongs to the kind its row names by `<k>` (the variant
  `smile` of the slot `mouth`), so the value alone names the kind: "a big smile" is the mouth, worn as a smile, big. The
  grades of `k.expect.scale` are read by their cues, not as values;
- a value of a whole-level key ("make it happy", "make her angry") with no thing named is a value of the one thing of the
  state that has that key: a change of it. Several such things: not guessed. A pronoun never asks for a kind of the world:
  with nothing in focus the target is not guessed from the world's declarations, so a value word is never read as a kind
  made ("make her angry" never makes the world's first kind);
- the world's own kinds come first: its declared kinds, the kinds it joins, its own `core.word`, then the catalog's
  expectations; a value of the world beats a kind only the catalog knows of the same spelling ("a crown" of a hat, not the
  catalog's crown of a tree). Joined names of several words are read and made ("an old woman", "a water lily"; std.acts finds
  a quoted name);
- a kind named by a plural noun (the language's irregular pair `singular=eyes plural=eyes`) is one thing: it has no plural
  of its own, and a reply about one of it is said in the plural (`<reply>.plural` of the language, else an English
  fallback: "The eyes are big now.", "There are no glasses here."). A capability list says plurals of several words by their
  last word ("old women").

The verb and the shape of the turn:
- a verb's sense with a value (`k.actions.verb value=default`: "reset") sets every key of the thing that has a declared
  default back to it ("reset the face": the mood calm);
- "put a hat", "put on glasses": a place act said of a kind none of which is there, with no place said, is a make when the
  world makes that kind (placing needs the thing; making it is how it comes there). A particle of the verb ("put on",
  "take off") is no preposition;
- "give her a crown": a verb whose act the world does not have, said with the one it is for (an object pronoun or a
  reflexive right after the verb) and the thing given, is a make of that thing, when the world makes it;
- "make the face a robot": a thing there, then a kind of it with an indefinite determiner: the thing is made that kind.
  "make the puppet an emoji" (a word for the world or a kind, an indefinite determiner, then words the world does not have):
  `planRequest` refuses with `refused.can_be { thing, value, kinds }` from the declarations (`canBe`): "The puppet cannot be
  an emoji; it can be a boy, a robot, an old woman." Nothing runs. A world whose things can be nothing else says it did not
  understand;
- a noun phrase alone that is no reference to things there ("a big smile") asks for the thing (make), when the dialogue has
  no act that takes what it says; a value or a step said of things there with no verb ("the next mouth") is a change;
- "the next mouth" / "the previous mouth" (a cue `on=attribute step=up|down takes=thing`): the thing's slot typed by a
  catalog type whose rows (of its kind, by `match=`) have an `order` steps to the next or previous value, round the order;
- a fragment that says what the last act cannot take (values after a remove) does not continue that act; a turn with no verb
  naming a definite kind other than the last thing is a request of its own.

Two readings that keep words unread rather than guess: a topic cue whose lead is a preposition of the one a thing is for
(`prep role=beneficiary`: "for") before a possessive determiner ("for their grandma") is no topic, its words stay unread and
nothing runs; a topic ends before a verb or a pronoun. A place said with a side (a cue's `attribute=`: "the corner on the
right") keeps the side: the declared value of the place slot that holds it is the place; several are told apart by an
expectation (`k.expect.value of= on=place when.side=`), else asked (`refused.which`); a slot with no enum takes the side in a
`side` slot, else the side is named as not taken. `stateDiff` reports a change of a thing's kind (`key: 'kind'`), and the
reply says it once, naming the thing by the kind it had ("The face is a boy now.").

Added with 0.164.0 (properties in `test/referent-turns.test.mjs`):
- the thing a reply that changed nothing names (`refused.already`, `nothing.same.value`) is the referent of "it" in the next turn
  ("put on a hat", "The hat is already there.", "make it red" colours the hat): the plan of a refused make carries `referent`, and
  `toolSession` keeps the things a failed `same` run named as the dialogue's last run;
- `planRequest`: when the act read is planned as another act (a put turned into a change of the thing there) and a said constraint
  is left untaken (`not_declared`: "put a heart on the chest", the place), the plan is not ok (`turned: { from, to }`), nothing runs and
  the words are said ("Nothing changed. I could not do on the chest: ...");
- a step cue of the language that names its attribute (`on=attribute attribute=variant step=next|previous`, the published
  `attribute.variant_next` / `variant_previous`) is read like the unnamed step cue: "the next mouth", "another nose" is a step
  through the ordered values, never a place (`step=next|previous` are `up|down`); "next to" stays a place;
- an assumption of a tool call is said by the key of the world: the binding's `step.<key>` source, the argument's own name when the
  thing has such a slot, else the one slot of the kind that takes the value ("I assumed square for the variant", not "for the worn");
  the argument's name only when nothing is found;
- Q98: a kind joined `as=<type>` takes that type's slots in plans as in the mirror: genres joined as a document type keep their
  topic ("write a short letter about a villa").

Added with 0.163.0 (properties in `test/face-world.test.mjs`; the example world `FACE` has a preset `king` that wears a crown):
- a part joined `as=part` keeps its kind in the mirror, and a relative size is stepped from the size the thing has ("bigger"
  twice: big, then huge); the plan's `byKind` names `eyes`, not `part`;
- "it" after a preset is the last result's things; a value whose key none of them has ("make it happy": a mood, only the
  face has one) is a value of the whole that has the key, never of the parts the preset added; a value said of several things
  goes to those that take its key;
- `std.schema.kinds ... single=true` declares that there is at most one thing of each joined kind (a slot of a whole). A make or
  put of such a kind that is there already, with no place said, replaces what the values say ("put a crown": the hat's variant,
  said as a change) or, with no value, says `refused.already` ("The hat is already there."); it never asks where. A value
  carried over from the last turn is not carried to a kind other than the one it was said of (the hat's variant is not the
  glasses' variant);
- "the next mouth", "next mouth", "previous eyes": a noun phrase with next/previous alone, with the cue `on=attribute step=
  takes=thing` of the language, is a change by one step through the ordered values of the part's variants;
- a reset gives each thing its own declared defaults (never another's); when no slot of the things named declares a default the
  reply is `refused.no_default` ("The novel has no default to go back to."), not "To what value?";
- a variant said with a size ("big smile") is chosen at that size (variant and size, one change); a change that asks for what
  the thing has says why nothing changed: `nothing.same.value` ("The eyes are already green.", "The mouth is already big
  smile."), with `nothing.same` as the fallback. Built-in English texts exist for `nothing.same.value`, `refused.already` and
  `refused.no_default`; a language world may say them in its own words (`.plural` for a plural-noun kind).

Joined kinds at scale: the join map is built once per version of the join rows and the sources and shared by every fork
and mirror; the reader's lexicon is kept per version of the world, its language and its catalog, so a world that joins
thousands of rows reads them from that index on every turn (the host need not pass the kinds a turn says). A stand-in kind
(`stand_in=`, a villa drawn as a house) is planned with its base's expectation (`k.expect.make` / `k.expect.part`) when the
world declares that whole. Example world: `FACE` / `faceTool` / `faceBase` in `examples/tool-app.mjs`; properties in
`test/face-world.test.mjs`.

```js run
const base = new World();
base.load('@t.p core.type of=k.demo.preset\n@p1 k.demo.preset name=boy\n@p2 k.demo.preset name=old_woman');
const w = new World();
w.load(`@acts core.use world=std.acts\n@w std.schema.world name=puppet
@t.face core.type of=face extends=std.schema.thing closed=true\n@s.mood core.slot of=face key=mood default=calm
@k.face std.schema.kind of=face world=puppet acts=change
@j std.schema.kinds world=puppet from=k.demo.preset key=name acts=make as=face`);
print(canBe(w, { of: 'puppet', world: true }, [base]), kindLineage('boy', { live: w, catalog: [base] }));
```

```output
["boy","old woman"] ["boy","face"]
```

### kindLineage(kind, opts?), joinedKinds(live, catalog?), expectedValue(kind, key, known?, opts?), cutToCount(items, links, n), fillToCount(kinds, n, opts?), notAllOneKind(kinds, pool?), EXPECT_TYPES

`joinedKinds(live, catalog)` is the Map of kinds taken by join (`std.schema.kinds`): kind to `{ acts, world, from, as?, standIn? }`.
Knowledge a planner and a binding share (src/expect.mjs). `kindLineage` is the kind and its parents, nearest first
(see above). `expectedValue` reads conditional expectations, rows `k.expect.when of= key= value= [min= max=
typical=] if.<key>=<v> if.<key>.min= if.<key>.max=` (and the review's form `k.expect.value [of=] on=<key> value=
when.<key>=<v> when.<key>.min= when.<key>.max=`, `EXPECT_TYPES`; a row with no `of` is for any kind, least specific) of
the live world (source `world`) then of the catalog (`expect`):
those whose `of` is in the kind's lineage and whose conditions hold on what is `known` (the thing's other values,
`kind`, `size`, `count`, `role`); several values of one if-key are alternatives; `when.<key>=none` holds when the key
is absent (a shape in no whole: `when.in=none`). The most specific wins: the most
condition keys, then the nearest kind, then the world before the catalog. `planRequest` fills from them every slot
key nothing else filled, per item, twice (one default may condition another), with the item's role in the plan's
links (start, branch, leaf, middle); a value of the whole's count and layout before the slot's default; and an
expectation whose conditions hold here before an induced value. In `assumed` with `because`. The structure
operators: `cutToCount` keeps the first n items breadth first along the links (what stays is connected),
`fillToCount` adds kinds in the proportions there are, `notAllOneKind` makes every second item of a second kind.
`planRequest` uses them for a revision that changes only the count of the last plan (`dialogue.lastPlan`): the plan
is the last one cut or filled (`structure`), checked like any candidate.

```js run
const w = new World();
w.load(`@t.book core.type of=book\n@t.atlas core.type of=atlas extends=book
@x1 k.expect.when of=book key=end value=left
@x2 k.expect.when of=book key=end value=right if.size=big if.size=huge`);
print(expectedValue('atlas', 'end', { size: 'huge' }, { live: w }).value, expectedValue('atlas', 'end', {}, { live: w }).value, kindLineage('atlas', { live: w }));
print(cutToCount([0, 1, 2, 3], [{ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 0, b: 3 }], 2).keep, fillToCount(['a', 'a', 'b'], 6), notAllOneKind(['a', 'a'], ['a', 'b']));
```

```output
right left ["atlas","book"]
[0,1] ["a","b","a"] ["a","b"]
```

### clauses(world, text, options) and cutPoints(world, options?)

One clause splitter. Sentences end at `.`, `?`, `!` and `;`. Inside one, the cut points are a
comma, the joiners that cut (`${lang}.joiner cut=yes`; two in a row are one: "and then"), and the
place before a question word (`${lang}.wh`). Each clause is read by `read(text) -> { literal,
captured? } | null`. Among the cuttings whose every clause reads, the one with the most literal
words wins, then the fewest captured, then the fewest clauses. The result is `[{ text, reading }]`,
or null when some sentence has no cutting that reads. A thing of several words is never cut: no cut
point inside a phrase of `options.whole`, and a joiner before a determiner or a number (`${lang}.det`,
`${lang}.numeral`, digits) joins a list of things ("remove the fourth grass and the third water lily"
is one clause). On PSys2's real shop rows it cuts "I would
like a ball and a pencil and pay with 20 lei. what's the change" into three clauses: the list
stays one, and the joiner before a verb cuts.

```js run
const w = new World();
w.load('@t core.type of=ex.joiner\n@j ex.joiner text=and cut=yes');
const read = (t) => (/^(add|remove) \w+$/.test(t) ? { literal: 1 } : null);
print(clauses(w, 'add milk and remove eggs', { lang: 'ex', read }).map((c) => c.text));
```

```output
["add milk","remove eggs"]
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
- Claims come from facts about the topic itself (its name or `about`) before facts that
  only name it among their values, and relations about the topic are laid out first. Each
  frame carries its `subject`. When no layout is found within the search, the plainest one
  is used and said in `short`; the composition no longer fails with `why`.
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

A story, then a question (abstraction round, item 6; word problems of real turns). The referents
of a story and its arithmetic stay in focus, and a following question is read against them.
- Each sentence changes what an owner holds. The subject is a name, a pronoun (the last owner),
  a word of `self` (I, me: the owner "I"), or a number ("One flies away": that many of the last
  item, of the last owner). A clause with no subject ("and now has 3") keeps the last owner.
- A number, or a word of `one` (a, an) for 1, then the item. The verb's effect is data:
  `verbs` maps a word to `set`, `add`, `remove` or `give`; a give moves the quantity to the
  other name.
- A sentence with a negation changes nothing. Giving or losing more than is held is refused,
  with the reason in `refused` ("Tom only had 5 apples").
- A change before anything is known makes the start unknown; a later `set` solves it ("ate 2
  and now has 3": 5 at first). A comparison sets one owner from another ("3 more than", "2
  fewer than", "twice as many as").
- Questions: how many an owner holds, or all together (`all`); how many at first (`start`);
  how many more or fewer one holds than another; who holds the most or the least.
- `prior` (an earlier result) carries the story across turns.
- The words (`numbers`, `pronouns`, `question`, `skip`, `self`, `one`, `negations`, `more`,
  `fewer`, `times`, `than`, `start`, `most`, `least`) come from the host or its language world;
  the defaults beyond the first four are English.

The result is `{ state, steps, answers: [{ question, answer, owner?, item, why }], refused,
unread, starts, unknown, focus }`. A sentence it cannot read is listed, never guessed.

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
and on the valid related cases of its cases (`related(case)`, for example `relatedCases` of
this library). It is `admitted` only when every training case passes and the held-out share is
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

### learnFormOperators(pairs, options?), formOperator(canonical, variant), formEdits(canonical, variant), learnFormEdits(pairs), familyOf(edit) and delexicalise(world, text)

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
both a generator (for `relatedCases`) and, read forwards, a normalisation rule (for
`normalise`).

Real variants combine several operators, such as a filler, an alternation and an extra
clause. `formEdits(canonical, variant)` splits a pair into atomic edits: an alignment of
the words, and each hunk where they differ, `{ del, ins, at: start | inside | end }`.
`learnFormEdits(pairs)` clusters them and counts how many operators cover 80 % and 95 %
of the edits, and of the pairs fully (`pairsAt80`, `pairsAt95`). Each edit also gets a
family by its shape alone, with no language: filler, extra clause, insertion, deletion,
inflection or substitution (`familyOf(edit)`); `families` counts them.

**Typed** (`{ world }` on all four): content words are lifted to their types through the
world's typed lexicon before aligning, which the dialogue and NLG literature calls
delexicalisation (`delexicalise(world, text)`):
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

### canonicalise(world, text, options?), readCanonical(world, text, options?), splitRunOn(world, text, options?), fillersFrom(edits) and wordClassesOf(world)

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

`splitRunOn(world, text, { openers, splitters, fillers, read, reader, unreadCost })` cuts
run-on, noisy requests into clauses (reviewer 02:50). The cut points are punctuation, the
`openers` (words that open a clause, such as question words) and the `splitters` (which are
dropped); fillers are dropped first. Among all cuts, the one whose clauses read best wins,
by dynamic programming over the cut points. A clause scores the words its frame uses, minus
`unreadCost` (3) per unread word and 1 per typed word its frame leaves out. A clause no
reader takes stays a clause of its own, and is reported rather than merged into a readable
one. The result is `[{ text, frame, unread }]` in order. `tools/bench-runon.mjs` measures it
on PSys2's pairs.

`normalise` takes, among the rules that match, the more specific one (more literal words),
then the one told first (`n`), through `choose` (kind `rule`); `byRule: 'order'` keeps the
order alone. The innermost
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

### relatedCases(world, case, options?), ancestorsOf(world, id, options?), kindChain(world, id) and judgeOnRelated(answer, case, related)

A case is never single (abstraction round, item 0). Its related cases are perturbations of it
along named axes, as in metamorphic testing (docs/generalisation.md has the picture and the
literature). `relatedCases` goes up from a case `{ frame, text? }` (a frame of `readByTypes`)
along an axis, then down to other members. The axes:
- `filler`: up the chain of kinds (`kind`, `class`, `is`, `is_a`, then the type), and down
  to the other things below. The distance is how far up the case and the other thing must go
  to meet: 1 = the same kind, 2 = kinds that share a parent, and so on.
- `key`: the other keys of the same holder.
- `wording`: the same frame in other forms. Each form operator is run backwards and tagged
  `form:<name>`:
  - the language world's alternations (`alternations`, from `alternationsOf`);
  - noise or learnt operators (`operators`, for example from `learnFormOperators`);
  - a word for its synonym through word senses (`form:synonym`).
  - the paraphrases the language world declares (`w.lang.en.variant frame= alternation=
    canonical=`), tagged `variant:<alternation>`, for a case with `langFrame` (the frame it was
    said in) and `roles`; each is realised with `realiseFrame`.

  With these, the tester can say "fails under operator X".

A related case is valid when it is legal in the world (it has an answer), when its wording,
made by substituting the filler, reads back to the same frame, and when it is not a `known`
case. Each one is tagged with its `distance` and the `axes` changed.

The graph is layered: a thing has several parents on several axes. `edges` (`{ key: axis }`,
by default kind / class / is / is_a as `kind`) names them, and `ancestorsOf(world, id, {
depth, edges })` walks them breadth first. Related cases are deduplicated by frame and
stratified per distance and axis (`n` each). The generalisation test
`tools/generalisation-test.mjs` takes one example and a host and gives a table per distance ×
axis, naming the pattern of breaks. With `split` and `oracle` it judges every clause of a
compound text: the host's answer to the whole text must hold the world's answer to each
clause, so answering one half fails. The skill `skills/expand-and-test-case` hands the
failures to `learnRules`. `judgeOnRelated(answer, case, related)` judges a fix both ways: on
the case alone and on its valid related cases by distance (`byDistance`). Judged that way, a
fix that passes only its case shows a share of 0.

```js run
const w = new World();
w.tell(`@cow k.animal name=cow kind=bovine sound=moo  @yak k.animal name=yak kind=bovine sound=grunt
  @sheep k.animal name=sheep kind=ovine sound=baa  @bovine k.kind name=bovine is_a=ruminant  @ovine k.kind name=ovine is_a=ruminant`);
const kase = { text: 'cow sound', frame: readByTypes(w, 'cow sound').best };
print(relatedCases(w, kase).filter((c) => c.valid).map((c) => [c.distance, c.text]));
```

```output
[[1,"yak sound"],[2,"sheep sound"]]
```

### readText(world, text, options?), moodOf(world, text, options?), confidentTypo(from, to) and READERS

One Reader contract for every reader, so a host, an ensemble or a learner can swap them, and
completeness is computed from data, never claimed by a pattern. `readText(world, text, { reader,
lang, ... })` runs a reader (a name of `READERS`: `types`, `frames`, `canonical`; or a function
`(world, text, opts) -> [{ frame, unread, repaired?, cost?, specificity? }]`) and ranks its
candidates: fewer words unread, then fewer repairs, then lower cost, then more specific. It
returns `{ candidates, best, unread, repaired, mood, complete, why? }`:
- `unread` are the words the best reading did not use; a reading with words left is not
  complete, and those words are never arguments;
- `repaired` are respellings (a reader's `via: 'spelling'`), each `confident` or not
  (`confidentTypo`: the typed word and its respelling are whole words of 4 letters or more, within
  the spelling budget of 1 edit, 2 from 8 letters, with the first letter kept or the first two
  swapped). A reading whose repairs are all confident is complete and lists them in `named`, so
  the reply can say them; any other repair makes it incomplete;
- `mood` is read before the act by `moodOf`: `question` (a final ?, a question word or an
  auxiliary first), `wish` (a wish of the language world first, `<lang>.fn view=wish`: "I want a
  red circle", a request), `statement` (a first-person subject first, or a name and an
  auxiliary: "I have two kids", "Tom has 5 apples", unless the name is a thing of the world),
  `fragment` (nothing, articles and letters, or the speaker alone: "my", "an a"), else
  `imperative` (also after a polite lead: "could you add a table"). Hesitations, lead fillers and
  politeness of the language world are passed over. `detail: true` gives `{ mood, by }`. An act
  frame needs an imperative, a wish or a question.

The mood words come from the language world (`<lang>.wh`, `<lang>.aux`, `<lang>.pron
person=1`, `<lang>.det`, `<lang>.fn`), with English defaults for a world that has none.

```js run
const w = new World();
w.tell('@cow animal name=cow sound=moo  @v core.word text=makes means=sound');
const r = readText(w, 'what sound makes a cow in the shape of a house', { question: ['what'], skip: ['a'] });
print(r.complete, r.unread.join(' '), moodOf(w, 'I have two kids'));
```

```output
false in the shape of house statement
```

### readByTypes(world, text, options?), typedLexicon(world) and nearWords(world, word, options?)

Type-driven reading (abstraction round, item 1). Each content word is typed through the
world itself:
- a thing: a fact's name;
- a kind: a type, or a `kind`, `class` or `is` value;
- an attribute: a key that facts carry, or a relation the knowledge declares
  (`k.kinds.relation type= key=`). A question about a declared relation with no value yet
  is understood, and its frame says `known: false` with an empty answer;
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
`lemma`. The result also says whether the reading is **complete** (reviewer 03:20).
`left` lists the content words the best frame does not consume, and `complete` is true only
when nothing is unread or left: an incomplete reading is not final. Words the world does not know are listed in `unread`. `typedLexicon` is the
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
min_length= replace= | add= drop=`), with irregular forms first. The pairs `singular=
plural= read_only=` serve the plural and singular ops only, each in its own direction. The
forms `lemma= form= vform=|degree=|num=` serve the op's cell (past, ing, comparative and so
on); one marked `read_only=yes` or `variant=yes` is never written. Two pairs of one word in two
registers (`register=classical|common`: cacti, cactuses) are written as the common one unless
`register` is asked; `all: true` gives every form, for a reader. Rules in sets (`set=act|lemma`)
are read in the lemma set unless `set` is asked; a rule with `exception=` applies to the words of
that list (`<lang>.noun.exception kind=<name>-suffix|<name>-word`), `unless_is_singular=yes` spares a
word in -is unless it is an is-plural, and the singular of a listed pair is itself (bus, iris). A rule with keys it does
not know is not applied. `articleFor` gives the
determiner whose `before=` is the sound the word begins with, by the longest `onset`
(`begins= sound=`) that matches, else by its first letter. The types default to
w.lang.en's (`w.lang.en.inflect`, `.irregular`, `.irregular_form`, `.det`, `.onset`). `discourseRealiser`
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
a seeded weighted draw, so the first solution found is a weighted sample (with `seed: null`, by
weight, ties in the given order); weight 0 is never drawn. The search is bounded by `limit` nodes. The result is `{ values, nodes }`, or `{ why,
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

### signatureOf(world, token, options?), chunk(world, text, options?), minePatterns(world, sentences, options?) and patternReader(world, cases, options?)

Type signatures and a finite pattern inventory (reviewer 02:15, owner 18:10).
`signatureOf` gives a word's signature as three levels, `[fine, middle, coarse]`:
- knowledge types first: a thing `<its type>` / `<thing>` / `<N>`; an attribute
  `<attr:key>` / `<attr>`; a kind; an act; a verb the world declares for a key
  `<verb:key>` / `<verb>` / `<V>`;
- a number `<num>`;
- closed-class words (`closed`) stay literal;
- other words by their ending (`<w-ing>`, `<w-s>`, …).

`chunk` merges adjacent content words into one token whose signature is its head's, the
last word. `minePatterns` turns sentences into patterns over chunk signatures at a `level`
and reports `{ patterns: [{ pattern, count, example }], sentences, at80, at95 }`.
`tools/bench-patterns.mjs` measures the owner's hypothesis, "few patterns", on PSys2's
sentences.

`patternReader(world, cases, { level, closed })` learns from cases `[{ text, frame }]`
where each pattern's key and holder are (chunk positions). It returns a reader, a voice for
`readEnsemble`, that reads new sentences of a known pattern into frames and gives nothing
for an unknown pattern.

```js run
const w = new World();
w.tell('@cow k.animal name=cow sound=moo  @dog k.animal name=dog sound=woof  @v core.word text=make text=makes means=sound');
print(minePatterns(w, ['what sound does a cow make', 'what sound does a dog make'], { closed: ['what', 'does', 'a'] }).patterns[0]);
```

```output
{"pattern":"what <attr> does a <thing> <verb>","count":2,"example":"what sound does a cow make"}
```

### resolveEllipsis(world, text, previous, options?)

Ellipsis (fragment) resolution (reviewer 03:20): a verbless continuation such as "it to the top
right" or "and still up" reuses the previous act `{ act, args }` with the roles the message
gives, read by type. A thing is read by its name, and a pronoun in `pronouns` keeps the
previous thing. A value of a closed set is read by its key; multiword values like "top
right" count. The result is `{ act, args, reused: true, changed }`, or null when the message
names an act or gives no role.

Relative continuations, as in real turns ("more to the left", "a bit lower", "not the first
one, the middle one"): a direction of the language world (`<lang>.lex name=acts.dir item=...`)
goes in `args[dirKey]` (`dir`); a word of `more` marks the move as relative (`relative: { more:
true }`, and `small: true` for a word of `small`), and "even more" alone repeats the previous
direction. A position picks among the things of the previous thing's type, ordered by `x`: an
ordinal (`<lang>.ordinal text= value=`) or a word of `positions` (first, last, middle). Of
clauses split by commas, one with a negation (`<lang>.neg text=`) is the one rejected. `lang`
(`w.lang.en`) and `fold` read another language with its own words.

```js run
const w = new World();
w.load('@acts core.use world=std.acts\n@art std.schema.world name=art doc=x\n@t core.type of=shape extends=std.schema.thing\n@s core.slot of=shape key=place enum=up enum=down\n@k std.schema.kind of=shape world=art acts=place');
w.tell('@c1 shape name=cat');
print(resolveEllipsis(w, 'and still up', { act: 'place', args: { thing: 'c1', place: 'down' } }, { skip: ['and', 'still'] }).args);
```

```output
{"thing":"c1","place":"up"}
```

### readEnsemble(world, text, options?), defaultReaders(read?, canonical?), riskCoverage(rows) and calibrate(rows, options?)

Several readers, one confidence (reviewer 02:30). Readers run as parallel voices, not a
fallback chain. Each is `(world, text) -> [{ frame, unread?, cost?, specificity? }]`. The
library's own are `types` (readByTypes) and `canonical` (readCanonical, the language world's
normalisation before the typed reader). A run of one reader with other options is not a second
vote; a host adds independent readers (readFrames, parseText, patternReader) as its own voices. The candidate frames are pooled with features:
- `agreement`: the readers that proposed the frame, weighted by `weights` (default 1 each;
  learnt from cases, for example each reader's precision on a training half);
- words left unread;
- the cost of assumptions;
- specificity.

std.decide (kind `ensemble`) combines them. The result is `{ frame, confidence, voices,
candidates, ranked, ask? }`, where `confidence` is the weighted share of the readers that
proposed the winner. Coverage comes first: a reading that leaves content words unconsumed
loses to one that consumes them all, and `complete` says whether the winner does. Below
`threshold`, when the winner is incomplete, or when two readings tie, `ask` holds the
competing frames, for a question back instead of a guess.

`riskCoverage(rows)` turns `[{ confidence, correct }]` into the risk–coverage curve: for
each threshold, the share answered and the share of those that are wrong.
`tools/bench-ensemble.mjs` measures the readers alone and together on PSys2's form pairs.

`calibrate(rows, { method })` maps a reader's confidence to a probability of being right, from
held-out rows `[{ confidence, correct }]`: `isotonic` (the default: pool-adjacent-violators, a
non-decreasing step function, interpolated between steps) or `platt` (a logistic curve fit on
the log loss with Platt's smoothed targets). It returns `{ method, p(score), steps | params,
brier: { before, after } }`, so a confidence threshold can be set as a probability.

```js run
const w = new World();
w.tell('@cow k.animal name=cow sound=moo  @v core.word text=make text=makes means=sound');
const r = readEnsemble(w, 'what sound does a cow make', { read: { question: ['what', 'does'], skip: ['a'] } });
print(r.frame.answer, r.confidence, r.voices.length);
```

```output
["moo"] 1 2
```

### joinList(items, options?), clauseOf(world, fact, options?), actSentence(world, act, roles, options?) and renderFrames(frames, options?)

Saying things from facts (PSys2's handover LIB-1 to LIB-4). The words of the language come
from the language world's facts: prepositions, auxiliaries, articles, plurals and the act
templates. The few glue words are options with English defaults.
- `joinList(['a', 'b', 'c'])` gives "a, b and c" (options `and`, `sep`).
- `clauseOf(world, fact)` gives one clause for a fact, or null without a subject. Verb-like
  keys come first (an auxiliary, an act of k.actions), then a preposition ("is on the
  table"), a type ("is a bird"), a yes/no ("is not landlocked"), a count ("has 2 legs"), and
  any other key as a noun ("has a capital of lima"); at most `parts` (3). Joins to other
  worlds and `quiet` keys are left out, and `names` are said without "the".
- `actSentence(world, act, roles)` uses the act template (`w.lang.en.template`) whose slots
  are exactly the roles given, the most specific first. `{x:num=pl}` gives the plural, a/an
  follows the next word, and the sentence is capitalised; null when none fits.
- `renderFrames(frames, { world, say, failed, max })` says summarizeLog's frames as one
  sentence ("You asked me to add 3 trees and remove a house, plus 2 other changes; 1
  request was not understood.").

```js run
print(joinList(['a cat', 'a dog', 'an owl']), renderFrames([{ act: 'add', kind: 'tree', count: 3 }]));
```

```output
a cat, a dog and an owl You asked me to add 3 trees.
```

### phraseOf(world, fact, options?) and narrationOf(world)

What to say about a fact, and how, both read from the worlds (Q63). The knowledge says which
keys are narrated (`k.attributes.narration type= key= narrate=yes|no salience= form=`); the
language world says how a key or a form is phrased (`w.lang.en.phrasing key= of= form=
polarity= text=`).
- `narrationOf(world)` gives a Map from `type|key` to `{ narrate, salience, form }`.
- `phraseOf(world, fact, { key, names, lang })` says the most salient narrated key (or `key`)
  with the phrasing of that key for the fact's type, then of that key for any type, then of its
  form; `{thing}`, `{value}` and `{key}` are filled and a/an follows the next word. It returns
  `{ text, key, phrasing }`, or null when the key is not narrated or nothing phrases it.
- `compose` and `clauseOf` leave out keys marked narrate=no, and `discourseRealiser` says
  facts with the language world's phrasings when it has them.

```js run
const w = new World();
w.tell('@n1 k.attributes.narration type=t key=secret narrate=no\n@p1 w.lang.en.phrasing name=key.any.likes key=likes text="{thing} likes {value}."');
const box = { type: 't', attrs: { name: ['box'], secret: ['x'], likes: ['tea', 'cake'] } };
print(phraseOf(w, box).text, '|', phraseOf(w, box, { key: 'secret' }));
```

```output
the box likes tea and cake | null
```

### realiseFrame(world, frame, roles, options?) and paraphrasesOf(world, options?)

A text in the shape of a frame of the language world: its parts (`w.lang.en.part frame= at=
is=`) in order. A word part says its first word (or the `pick`-th), a phrase or lead part the
first item of its `w.lang.en.phrase`, a det part `det` ("the") before a role that is given, a
verb part the `verb` role or its act, and a role or lexicon part the role's words. Optional
parts are left out unless `optional` is true; null when a required role is missing.
`paraphrasesOf(world)` gives a Map from a frame to `{ alternation, canonical }`, read from
`w.lang.en.variant`: the frames it paraphrases.

```js run
const w = new World();
w.tell('@a w.lang.en.part frame=q at=1 is=word word="what is"\n@b w.lang.en.part frame=q at=2 is=det optional=yes\n@c w.lang.en.part frame=q at=3 is=role role=attribute\n@d w.lang.en.part frame=q at=4 is=word word=of\n@e w.lang.en.part frame=q at=5 is=role role=thing');
print(realiseFrame(w, 'q', { attribute: 'sound', thing: 'cow' }));
```

```output
what is the sound of cow
```

### genreOf, topicIndex, randomTopics, judgeReply, tabulate and tableText

General host code taken into the library (handover LIB-5 to LIB-8):
- `genreOf(world, type)` gives the k.genres genre a document type names (hyphens,
  underscores, spaces, or the genre's words), or null.
- `topicIndex(world, { types, min })` lists the topics a world can compose about: names
  that at least `min` (2) other facts name. `randomTopics(world, { seed, count })` draws
  topics by interest, seeded.
- A session's things are typed by `typedWorldFor(schema, knowledge, { things })` and re-read
  under the Reader contract (`readText`: a reading with a word left is not complete).
- `judgeReply(reply, expected, { numberWords, before, after })` judges a reply text: every
  expected value is said (a number also as its word), and a question changes nothing.
  `tabulate(results)` and `tableText(table)` give a distance × axis table (results `{ distance, axis | axes, pass }`).

```js run
print(judgeReply('A spider has eight legs.', ['8'], { numberWords: { 8: 'eight' } }), tableText(tabulate([{ distance: 1, axis: 'kind', pass: true }])));
```

```output
true distance 1  kind       1/1  100 %
```

### experiment(cells, run, options?) and ablation(cells, run, configs, options?)

Experiment and ablation harnesses (Round 28 item 9). `experiment` runs cells `[{ id,
input, expect, set?, class? }]` through `run(input, config)`. Each result becomes a ledger
row: `{ source, text, cell, config, set, pass, got, expect, stage? }`. The options are
`judge(got, expect, cell)` (default: equal as JSON), `stage(got, cell)`, and `name` and
`config`.

`ablation` runs every configuration on every set. It returns:
- `rows`;
- a `table` (`{ config: { set: { pass, of } } }`);
- `buys`: per configuration against the `baseline`, the cells it gains and loses;
- `causes`: per configuration, its failures grouped by cause (`signals`, as `ledgerGroups`
  takes them).

What a mechanism buys is measured by turning it off.

```js run
const cells = [{ id: 'a', input: 2, expect: 4 }, { id: 'b', input: 3, expect: 9 }];
const r = ablation(cells, (x, cfg) => (cfg.square ? x * x : x + x), { add: {}, square: { square: true } });
print(r.table, r.buys.square);
```

```output
{"add":{"all":{"pass":1,"of":2}},"square":{"all":{"pass":2,"of":2}}} {"gains":["b"],"losses":[]}
```

### choose(world, kind, candidates, options?), rankingOf(world) and learnRanking(world, kind, cases, options?)

One way to choose (reviewer 01:00). The candidates of a choice point are ordered by the
criteria declared for its kind, as data: `std.decide.criterion of=<kind> n= name= measure=
dir=hard|min|max`, from the world, else std.decide's own facts. A criterion reads a field of
the candidate (`measure`; missing counts as 0): `hard` loses on anything but 0, while `min`
and `max` compare. Ties end in a seeded order. The result is `{ best, order, ranked,
criteria }`, where each loser carries `lostTo`, `on` and `why`. The kinds std.decide
declares are `reading`, `template`, `word`, `rule`, `fact`, `parse` and `score`, and
`criteria` gives a list directly. `seed: null` keeps the given order on ties.
`rankingOf(world)` gives `RANKING`'s measures in the order of kind `score`, which
`world.score` uses.

`learnRanking(world, kind, cases, { heldOut })` learns the order of a kind's criteria from
cases `[{ candidates, expected }]` (learning to rank, by a search over orders rather than a
learnt scoring function). Every order (at most 7!) is tried on the training
cases. The best is proposed as std.decide facts, and admitted only when the held-out cases
do not drop. The criteria are tuned on data, not in code. The map of all choice points is in docs/decisions.md.

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
The check is a lookup in the world's index per (type, key, value). Here, as in all matching,
a quoted string whose text is an atom and the bare atom are the same name.
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

### str(value), valueText(value), quote(text), readValue(token), writeValue(value)

`str` gives the text of a string token (escapes decoded) and returns any other value
unchanged; `valueText` is the same as text, with '' for no value, and is how every module of
the library reads a value's text; `quote` gives the string token of a text, in the canonical spelling (the
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

