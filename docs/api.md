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
statement of this world), `facts` (below), `fns`, `actions`, `producers`, `filters` (host functions by name; see
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
the log again, O(h) changes.

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
keys, which are then assumptions that `assumptions()` lists and a told value replaces),
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
replaced; like any retraction, what it retracted is not undone (use a mark). Options:
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
wires of `transient` types are passed over and kept. Retractions are not taken back
(use a mark). Cost: O(h) changes, since the world is rebuilt from the statements that
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
in one transaction, and everything else stays. `toJSON({ timeline: true })` also writes
the open marks and what `redo` would tell again, and `World.fromJSON` restores them, so a
host that restarts keeps undo, redo and rewind.

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
the same options that filled nothing returns that answer again at once.

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

Asks for a value, with a status. `question` is `{ type, where, seek, mode }` or
`{ about, seek }`, a `core.question` wire, or its text. Modes: `value` (default),
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

### world.words(lang?) and world.interpret(frame, options?)

`words(lang)` maps each text of a language to its `core.word` entries, with what each
means in the matrix (`meanings`: `{ kind: 'action' | 'type' | 'key' | 'value', ... }`).

`interpret(frame)` reads a language-neutral frame into candidates for `score`. A frame
is `{ lang, verb, args, numbers, question, mode, ns }`; an argument is a word or `{ word,
role }`, where `role` is a word for a key (`with`, `on`). A verb that means an action
gives `{ action, args }`, one that means a type gives `{ wires, refer }` (a slot that
holds a wire gets a described referent), and `question: true` gives `{ question }`. An
argument with no word wire is read as an entity it names by an identifying key, or an
enum value spelled as is. Returns `{ candidates, unresolved, dropped }`; each candidate
also has `reading` (which word went where), `used`, `unused` and `unresolved`. Nothing
is invented: every value comes from a word or a number of the frame. Options: `limit`
(default 50 candidates), `id` (of the new wire, default `new`).

One message may be several frames ("reserve the pen and order ink"). A list of frames
is one split of it; a list of lists is alternative splits. Each candidate is then `{
parts, split }`, one reading per frame (new wires `new1`, `new2`, ...), and `score`
judges the parts in order, each on the world with the parts before it, as one whole:
consistent when every part is, with the parts' lacks, assumptions and referents (each
marked `part`) and `parts`, the score of each. A split that leaves a word out loses on
`words`.

```js run
const w = new World();
w.load(`@k1 core.slot of=item key=name id=true
  @k2 core.slot of=order key=item kind=ref to=item required=true
  @k3 core.slot of=order key=qty kind=integer min=1 default=1`);
w.tell('@i1 item name=pen  @w core.word lang=en text=order means=order');
const r = w.interpret({ lang: 'en', verb: 'order', args: ['pen', 'spoon'], numbers: [2] });
print(r.candidates[0].wires, r.candidates[0].refer, r.unresolved);
```

```output
@new order item=$r1 qty=2 {"r1":{"type":"item","where":{"name":"pen"}}} ["spoon"]
```

### world.score(candidates, options?)

Judges candidate readings of one utterance against the world and tells nothing. A
candidate is any of `{ wires, refer }` (a statement; `refer` maps a reference name used
in `wires` to `{ type, where, ns }`, a description resolved against the state), `{
action, args }`, or `{ question }` (as for `query`). Returns `{ candidates, order }`;
each scored candidate has `ok`, `violations`, `referents` (`{ name, ids, unique, fits }`:
`fits` are the ids that keep the statement consistent when the description alone is
ambiguous), `lacks` (referents nothing matches, required keys still open, missing
arguments), `assumes` (defaults the statement would rest on), `action` (`{ available,
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

### world.check(patch?, options?)

With a patch: what `applyPatch(patch)` would return, without changing anything. Without
one: validates the whole world and returns `{ ok, violations, issues }`.

With `{ query }` or `{ ask }` (a question for `query`, patterns for `ask`) the patch is
applied in a transaction that is then undone, and the result also has `answer` (what
`query` gives on the world with the patch) or `rows` (what `ask` gives there). The same
from the other side: `query(q, { given: patch })` and `ask(patterns, { given: patch })`
answer on the world as it would be with the patch; a patch the world refuses gives the
status `refused` with the violations. Nothing changes.

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
`World.fromJSON`.

```js run
const w = shop();
w.tell('@pen item name=pen price=2');
print(w.toSOP(), Object.keys(w.toJSON()));
```

```output
@pen item name=pen price=2 ["format","version","log"]
```

### world.register(kind, name, fn, options?)

Adds a host function after the world was made. `kind` is `function` (`(args, world)
=> value`, for calcs, checks and effects), `action` (`(context, args) => value`),
`producer` (`(context) => value`) or `filter` (`(value, { world, name }) => text`, for
`?v:name` in a reason). A `function` with the name of a built-in throws
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
`withdraw`, `validate`, `complete`, `ground`, `solve`, `abduce`, `induce`).

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
