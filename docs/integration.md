# Putting a system on sopworld

How a system that already has its own schema, its own questions and its own operations
can sit on the library, without the library knowing anything about it. The steps are
general. The worked example at the end is `compat/psys2/`, a dialogue system whose three
sample worlds were rebuilt this way.

The idea in one sentence: your wires go in unchanged, a small matrix says what they
mean, and the answers come from `world.query` and `world.act`.

## 1. Schema: declare it, or map the one you have

If you start fresh, write `core.type` and `core.slot` wires (SPEC 3.1, 3.2, 3.8, 3.9).

If you already have schema wires in another notation, do not translate them. Tell the
world how to read them, once, with `core.schema.map` wires, then load your schema as it
is:

```
# wires of type `field` declare a key of the type and key named by their id (book.title)
@m1 core.schema.map from=field owner=id.prefix key=id.suffix
    value=is many=multi:yes required=must ask=prompt default=usually
# wires of type `class` declare a type
@m2 core.schema.map from=class as=type name=id extends=parent closed=sealed:yes root=object
# wires of type `package` are modules with imports
@m3 core.schema.map from=package as=module name=name imports=needs
```

Check: every schema file loads with `tell(...).ok === true`, and `world.schema(type)`
shows the keys you expect.

Bookkeeping keys (source, sequence number, provenance) belong in an open namespace:
`core.` is one, `@n core.namespace prefix=audit. open=true` declares another. They are
accepted on closed types and are not validated unless a slot declares them.

## 2. Facts: tell them as they are

`world.tell(text)` takes your wires with your ids. Three declarations make them behave:

| You have | Declare | Effect |
| --- | --- | --- |
| A key that says "this is the same thing" | `core.slot ... id=true` | Telling it again completes the same wire; the old id becomes an alias |
| A key that carries the order of events | `core.sequence key=<key>` | `before`, `after`, `core.select=latest`, `asOf` and states use it |
| A value that changes over time | `core.fluent`, `core.effect` | The wire shows the current value; events and later statements move it |

A change that the matrix does not allow is refused whole, with the reason and the wires
it rests on. Your system decides what to say to its user; the world stays as it was.

## 3. Questions: `world.query`

A question is `{ type, seek, where }` or a wire of the same shape
(`@q core.question type=item seek=stock where.name=bolt`). The answer has a status:
`supported`, `conflicting`, `missing`, `refused`, `no`, `unknown`, `budget` (SPEC 4.10).
Map them to what your system calls them; a `missing` answer carries the question to ask.

If your wire types or key names differ, pass them: `new World({ vocabulary: { question,
answer, request, type, seek, where, status, ... } })`.

## 4. Operations: rules first, functions last

Most "operations" compute a value from facts. Write them as rules, in this order of
preference:

1. **A rule that fills a key on the thing asked about.** The question type is a wire
   type; when no such wire exists the world supposes one with the question's keys, runs
   the rules, reads the answer and undoes it. Use `core.on=$pattern` to put the result
   on the supposed wire:

   ```
   @q quote item=?i count=?n
   @p price item=?i cost=?c
   @c core.calc out=?t fn=mul args=?n args=?c
   @a quote core.on=$q total=?t
   @r core.rule when=$q when=$p with=$c then=$a
   ```

   `world.query({ type: 'quote', seek: 'total', where: { item: 'pen', count: 3 } })`
   answers with the total, `missing` when the price is unknown, and nothing is recorded.
2. **A deny for what cannot be.** "Paid less than the cost" is a `core.deny` over the
   supposed wire: the answer is `refused`, with your `why`.
3. **A state** (`core.fluent`) for anything that is replayed today: balances, counts,
   progress. Undo is `retract`; the past is `asOf`.
4. **An aggregate** (`over=`) for totals, counts, the largest of a group.
5. **`core.absent=<key>`** for "when this was not given": on a pattern, in `ask` text,
   on a `core.question` wire, and as `absent: ['key']` in the object form of `query`
   and `score` (a wire that has no value for that key).
6. **A producer** (`core.producer`) for a value that only a function can compute.
7. **An action** (`core.action`) for an operation that changes the world: written as
   wires where it is "check, then update", else a function registered under `actions`
   (its own registry: an action named `add` does not replace the arithmetic) that runs in one transaction with `find`, `val`, `tell`, `fill`, `replace`,
   `retract`. Declare its required arguments and the question for each; a call without
   them returns `missing` with those questions.

What stays outside the matrix: turning text into wires, wording of replies, string
handling (splitting "milk, eggs and bread"). Keep those in your own code or in actions.

## 5. Sessions, what-if, persistence

- One `World` per session or per device. Build one with the schema and matrix loaded,
  and `fork()` it for each session: a fork copies nothing until it changes.
- `world.trial(fn)` and `{ dry: true }` try a change and undo it. `world.asOf(at, fn)`
  reads the past.
- `world.toJSON()` and `World.fromJSON(data, options)` save and restore.
- `world.on(listener)` receives the committed events.

## 6. Limits

Every call takes `{ budget: { steps, ms } }` (SPEC 4.11). A call that runs out returns a
`budget` result and leaves the world as it was. Set a default for all calls with
`new World({ budget })`. `world.stats()` says where the steps of the last call went.

## 7. Prove it: a runner over your own tests

Take the dialogues or transactions your system already tests, dump for each turn the
wires it produced and the answers it gave, and write a small runner: tell the wires,
`query` each question, `act` each request, compare status and value. Keep every
failure in the report with its reason. A failure is usually one of three things: a rule
still to write, a convention of the old system that is not a fact (worth dropping), or
logic that rules do not express (keep it in an action, and say so).

## Worked example: `compat/psys2/`

PSys2 is a dialogue system with its own legends (schema), question wires, and
operations written in JavaScript. Nothing in `src/` names it.

| Step | File | What it shows |
| --- | --- | --- |
| 1 | `compat/psys2/mapping.sop` | Three `core.schema.map` wires read its legends unchanged (0 violations) |
| 2, 4 | `compat/psys2/matrices/kids.shop/matrix.sop` | Prices as states with an identity key, baskets summed with aggregates, the wallet as a state changed by events, answers put on supposed question wires with `core.on=`, denies for "not enough" |
| 4 | `compat/psys2/matrices/kids.arith/matrix.sop` | Counts per person as states with `min=0`, "everybody or the two named" with `core.absent=`, operator precedence as rules over step wires |
| 4.7 | `compat/psys2/matrices/kids.tasks/` | Lists whose logic is text handling: 18 lines of matrix declare the actions, 86 lines of functions do them on wires |
| 7 | `compat/psys2/run.mjs` | The runner; `refused` is mapped to that system's `conflicting` |
| | `compat/psys2/demo.mjs` | A question for a missing argument, a default withdrawn, undo, an explanation, an abduction |

Result of `node compat/psys2/run.mjs` (cases passed of total; lines without blanks and
comments against the JavaScript replaced):

| World | Cases | Matrix + functions | Replaced JavaScript |
| --- | --- | --- | --- |
| kids.shop | 147 of 147 | 71 + 0 | 148 |
| kids.arith | 207 of 217 | 114 + 0 | 217 |
| kids.tasks | 231 of 232 | 18 + 86 | 192 |

The eleven failures and their reasons are listed in `worker-log.md` (G8): three are an
impossible event that the library refuses when told and the old system reports when
asked; four are a reply convention; the rest are a rounding rule, a division by zero, a
tie, and an operation of another world.
