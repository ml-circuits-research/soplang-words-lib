# sopworld: consistency matrices for SOP Lang circuits

An overview. The language, the wire types, the behaviour and the API each have one
page, and nothing is said twice:

| Page | What it holds |
| --- | --- |
| [docs/language.md](docs/language.md) | The grammar of wires, and what a pattern, a template and a variable are |
| [docs/reference.md](docs/reference.md) | Every wire type of the matrix and every built-in function: syntax, meaning, when it is evaluated, interactions, violations, example, limits |
| [docs/semantics.md](docs/semantics.md) | How a world behaves, as numbered statements, each with the test that checks it; the table of violations |
| [docs/api.md](docs/api.md) | Every export and every method: what it takes, what it returns, errors, budget, cost, example |
| [docs/glossary.md](docs/glossary.md) | The words used, one meaning each |
| [docs/integration.md](docs/integration.md) | Putting an existing system on the library |
| [CHANGELOG.md](CHANGELOG.md) | What changed, version by version |

Every example in these pages is executed by the test suite, and the lists in them
(wire types, attributes, functions, methods, violations) are compared with the library
by tests. The HTML pages in `docs/` are generated from these files.

## Purpose

A **world** is a set of SOP Lang wires (facts) that stays consistent with a
**matrix**: a second set of wires that says which facts are possible, what follows
from them, how missing values are decided, and which states are forbidden. The matrix
is written in SOP Lang itself.

The world accepts wires from outside (a user turn, a sensor, another program), extends
itself with what follows, and refuses what its matrix does not allow. The library is
general: nothing in `src/` knows a particular application.

| Operation | Question it answers | Methods |
| --- | --- | --- |
| Deduction | What follows from what is known? | `tell`, `fill` (automatic) |
| Completion | What is missing, and which values are still possible? | `open`, `suggest`, `next`, `complete`, `step` |
| Search | Is there a way to fill everything that is open? | `solve`, `solveReport`, `check`, `applyPatch` |
| Abduction | What would have to be true for this to hold? | `abduce`, `adopt` |
| Induction | Which rule explains these examples? | `induce`, `induceSlots` |
| Revision | What changes when a fact goes away or is replaced? | `retract`, `replace`, `revise`, `undo`, `rewind` |
| Questions | What is the value, and how sure is it? | `query`, `tier`, `assumptions` |
| Explanation | Where does this wire or value come from? | `explain`, `describe`, `diff`, `history` |

## A first example

```js run
const w = new World();
w.load(`
  @k core.slot of=acceleration key=of id=true
  @b body mass=?m
  @f force on=$b magnitude=?F
  @a acceleration of=$b magnitude=?A
  @c core.calc out=?A fn=div args=?F args=?m
  @newton2 core.rule when=$b when=$f with=$c then=$a
  @heavy core.check fn=gt args=?m args=1000kg
  @limit core.deny when=$b if=$heavy why="a body of ?m is outside this model"
`);
w.tell('@b1 body mass=2kg  @f1 force on=$b1 magnitude=10N');
const a = w.ofType('acceleration')[0];
print(a.attrs.magnitude, w.explain(a.id).via, w.explain(a.id).from.map((x) => x.id));
print(w.tell('@b2 body mass=5000kg').violations[0].why);
print(w.query({ type: 'acceleration', seek: 'magnitude', where: { of: '$b1' } }).status);
```

```output
["5N/kg"] newton2 ["b1","f1"]
a body of 5000kg is outside this model
supported
```

Wires that start with `@` and hold a `?variable` are patterns and templates; a rule
names them. The rule `newton2` derived the acceleration and recorded where it came
from; the deny refused a fact, with its reason; the query answered with a status.

## Limits

- Matching is indexed and starts from what changed, but partial matches are not cached
  (no Rete network).
- Only deny constraints are turned into ruled-out combinations for the solvers. A
  conflict that arises through a rule is found when the world verifies an answer.
- Search covers keys with a closed domain (`enum`, a reference type, a range). Other
  open keys become questions.
- Where the matrix reads what is absent (negation, `core.absent=`, selectors), no value
  is tried on its own: the search enumerates whole assignments, and answers `unknown`
  where that proves nothing ([S46](docs/semantics.md#search)).
- Relations are linear and conclude one unknown at a time; actions written as wires
  have no aggregates in their calcs.
- One justification is recorded per value; invalidation is by wire.
- Abduction inverts `add`, `sub`, `mul`, `div` only, one unknown per calc, not through
  aggregates.
- Induction is exact generalisation: it does not handle noise or learn negation.
- A wire holds in the whole world; a fork is the only context. `asOf` costs a withdrawal
  of everything after the point asked about.
- `undo` and `fromJSON` replay the log; `fork`, `mark` and `rewind` do not.
- The budget counts steps of the library's own loops. A host function or an outside
  solver that loops by itself is outside it.
- The limits of each wire type are in its entry in the
  [reference](docs/reference.md).

## Architecture

| Module | Responsibility |
| --- | --- |
| `parser.mjs` | Text to wires and back |
| `unify.mjs` | Values and unification |
| `matrix.mjs` | Compiles matrix wires into slots, rules, denies, relations and actions; the table of attributes; stratification; modules |
| `world.mjs` | Kernel: store and indexes, transactions, matching, chase, validation, patches |
| `revise.mjs` | `retract`, `replace`, `undo`, `mark`, `rewind`, `fork`, assumptions that give way |
| `complete.mjs` | Open keys, suggestions, questions, `step` and `answer` |
| `solve.mjs` | The completion problem in neutral form, the SAT solver, the solver strategies |
| `query.mjs` | Queries with a status, answer wires, producers, actions |
| `time.mjs` | Sequence, fluents and effects, as-of |
| `tiers.mjs` | Certainty of each value and what rests on it |
| `describe.mjs` | `describe` and `diff` |
| `abduce.mjs`, `induce.mjs` | Abduction and induction, built on the public kernel operations |
| `builtins.mjs` | Functions, aggregates, quantities with units, exact linear solving |
| `budget.mjs` | The step and time budget of a call |
| `cow.mjs` | Copy-on-write maps, sets and lists, shared between forks |
| `bin/sopworld.mjs` | `check`, `run`, `ask` on `.sop` files |
| `node/solvers.mjs` | Starts outside solvers as processes (Node only) |

How the kernel keeps its promises:

- A change keeps a journal of undo steps; a refusal runs it backwards, so the world is
  exactly what it was.
- Forks share their state; a world that changes after a fork writes on a
  copy-on-write layer, and the suite is run once more in a mode where any write to
  shared state throws (`SOPWORLD_COW_CHECK=1`).
- Everything speculative (dry run, suggestion, search, abduction, supposing a wire for
  a query) is the ordinary change inside a transaction that is rolled back.
- The id of a derived wire is a hash of the rule and its bindings, so deriving it again
  gives the same id.
- The log alone rebuilds the world.
- `world.stamp` identifies the state: it changes with every committed change and is
  restored by a rollback, so what was computed for a state can be cached.
- No answer of a solver is used before the world has verified it.

## Build and version

`npm run build` writes the library as one file with no dependency at build time or at
run time: `docs/sopworld.mjs` (ES module, browsers and Node), `docs/sopworld.js`
(classic script with the global `sopworld`, and CommonJS), `docs/sopworld.d.ts`.
`npm test` runs the suite on the sources and again on the built file.
`python3 tools/build_docs.py` writes the HTML pages from the markdown.

There are no release tags. The version is `version` in the library and in
`package.json`; a built file also carries `build = { version, hash, date }`, where
`hash` is a fingerprint of the bundled sources. The same three are in
[docs/version.md](docs/version.md), next to the built files.
