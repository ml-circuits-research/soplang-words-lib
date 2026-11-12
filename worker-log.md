# Worker log

One entry per task of `worker-tasks.md`. Every number comes from a command written here.
The worker's machine: Node v22.23.4, Linux; clingo 5.8.3 and PySAT (CaDiCaL) installed
through pip, so "without solvers" is simulated as described in S0.

## S0 — housekeeping — done

**1. Solver tests are skipped when the solver is missing.**

Cause: `available()` in `node/solvers.mjs` returned true whenever the command could be
started. `python3 -m clingo --version` and `python3 -c 'import pysat'` start and exit with
status 1 when the module is missing, so the tests ran and failed. It now requires exit
status 0.

Reproduction of the reviewer's result and the check after the fix, with a `python3` that
has no solver modules first on the PATH:

```
mkdir -p /tmp/fakebin
printf '#!/bin/sh\necho "No module named clingo" >&2\nexit 1\n' > /tmp/fakebin/python3
chmod +x /tmp/fakebin/python3
NODEDIR=$(dirname $(which node))
PATH=/tmp/fakebin:$NODEDIR:/usr/bin:/bin node --test                      # sources
SOPWORLD_BUNDLE=1 PATH=/tmp/fakebin:$NODEDIR:/usr/bin:/bin node --test    # built file
```

| State | tests | pass | fail | skipped |
| --- | --- | --- | --- | --- |
| before the fix (df55e3c), sources | 81 | 78 | 3 | 0 |
| after the fix, sources | 81 | 80 | 0 | 1 |
| after the fix, built file | 81 | 80 | 0 | 1 |

The one skipped test is the comparison with CaDiCaL on 40 instances. The two other tests
that failed before loop over the solvers that are available, so they now run with the two
built-in solvers only.

With the solvers installed (`npm test`): 81 pass on the sources, 81 pass on the built file.

**2. `AGENTS.md`** added: the rules of section 0 in five lines.

Deviations: none.

## G1 — type hierarchy — done

Commit: `git log --grep '^G1, G2:'` (one commit for G1 and G2, see Q7).

- `core.type` takes `extends=<type>` (one parent). Without `of=` the wire id is the type
  name, so `@vehicle core.type` and `@t core.type of=vehicle` both work.
- A pattern of type `T` matches wires of `T` and of its descendants: rules, denies,
  `ask`, `holds`, abduction goals, and the grounding of denies for the solvers.
- Slots and identity keys are inherited, the nearest declaration winning. A reference
  slot accepts wires of descendant types. `ofType(T)` includes descendants.
- Indexes follow: a wire is indexed under its type and every ancestor. A change of the
  hierarchy rebuilds the indexes inside the transaction; a refused change restores them.
- Cycles are refused (`schema` violation). Stratification of negation takes the
  hierarchy into account.
- Neutral example and tests: `fleet.vehicle` > `fleet.car`, `fleet.truck`
  (`examples/schema.mjs`, `test/schema.test.mjs`, first four tests). SPEC 3.8.

Not done: several parents per type. One parent keeps "nearest declaration wins"
unambiguous; say if multiple inheritance is wanted.

## G2 — schema vocabulary — done

- **`core.schema.map`** (SPEC 3.9): data that says how wires of another notation
  declare a slot, a type or a module. Fields are read from the foreign wire by `id`,
  `id.prefix`, `id.suffix`, `<attr>` or `<attr>:<value>`. `as=slot` maps owner, key,
  required, many, id, ask, default, enum, min, max, step, kind, type and `value` (kinds
  and `$type` references mixed); `as=type` maps name, extends, closed and `root` (default
  parent); `as=module` maps name and imports.
- **Literal kinds** are a native slot attribute, `kind=` (several are alternatives),
  checked on `tell` and `fill`; `type=` for references, descendants accepted (Q5).
- **Short and qualified key names** are one key in facts, `fill`, patterns and queries.
- **Open namespaces**: `core.` keys were already always allowed; `core.namespace
  prefix=... open=true` declares more.
- **Unknown attributes** of schema wires are kept; `world.schema(type)` returns them
  with the parent, lineage, `closed` and the keys (own and inherited, marked).
- **Unprefixed modules**: a wire mapped `as=module` loads its imports from the library
  with ids unchanged; `core.use world=<name> prefix=false` does the same for a named
  module. A missing import is a `schema` violation.
- `git grep -i psys2 src/` is empty.

G8.1 was done with it, because it is the real-data check of G2:
`compat/psys2/mapping.sop` (three map wires) and `compat/psys2/schema.test.mjs`.

Commands and numbers:

```
node tools/build.mjs
npm test                               # sources, then the built file
node compat/psys2/schema.test.mjs      # prints the compatibility report lines
git grep -i psys2 src/ | wc -l
node tools/bench.mjs                   # three runs
npm run examples
npm run test:browser
```

| Command | Result |
| --- | --- |
| `npm test`, sources | 97 tests: 97 pass, 0 fail, 0 skipped |
| `npm test`, built file | 97 tests: 97 pass, 0 fail, 0 skipped |
| `git grep -i psys2 src/ \| wc -l` | 0 |
| `npm run examples` | exit 0 |
| `npm run test:browser` | all browser checks passed |

New tests: 14 in `test/schema.test.mjs` (neutral fleet example), 2 in
`compat/psys2/schema.test.mjs`.

Compatibility (`node compat/psys2/schema.test.mjs`): the six legends in
`compat/psys2/worlds` load through `mapping.sop` in the order core, kids.common,
kids.arith, kids.shop, kids.tasks, lang.common: 47 types, 209 keys, **0 legends
refused**. The one knowledge base there (kids.shop, 26 wires) loads with **0
violations**; 104 of its 130 key values fall under a declared key and were checked
against its kind (the other 26 are `core.source`).

Before the sample was reduced I had run the same check, with the first (hard-coded)
implementation, on all 24 legends and 7 knowledge bases of the earlier `psys2/`
directory: 0 legends refused, 0 violations in 1,682 knowledge-base wires. That directory
is gone, so this number cannot be reproduced from the repository as it is now.

Cost on the existing benchmarks (`node tools/bench.mjs`, three runs, ms):

| Workload | 0.4 (one run) | run 1 | run 2 | run 3 |
| --- | --- | --- | --- | --- |
| join, 3000 parents to grandparents | 171 | 138 | 133 | 148 |
| recursion, 14,000 wires | 366 | 295 | 278 | 294 |
| 2000 separate tells | 43 | 64 | 35 | 35 |
| 1000 state changes with replace | 30 | 58 | 50 | 59 |
| six dialogue turns of completion | 139 | 122 | 125 | 135 |

`replace` looks slower (30 ms before, 50 to 59 ms now). I have not found the cause yet;
it is on my list for G7, where every loop gets a budget and a counter.

Deviations:

- **API change**: `world.schema` was the Map of matrix wires; it is now
  `world.matrix`, and `world.schema(type)` is the method the task asks for (Q4).
- **Matrix wires first**: within one `tell`, matrix wires are read before the facts
  whatever their order in the text, so that a fact told together with its schema is
  validated against it.
- **No default parent in the library** (Q6); `root=` in a type map gives one.
- **One commit for G1 and G2** (Q7).
- Seen in the PSys2 `core` legend and left for G6: keys declared with `dynamic=true`
  (prefixes such as `where.<key>` and `arg.<key>`). The general form will be a slot
  whose key is a prefix.
- Open questions: Q3 (`core.test` name clash), Q4, Q5, Q6, Q7.

## G6 — queries with a status, answers as wires — done

Commit: `git log --grep '^G6:'`. New file `src/query.mjs`; SPEC 4.10.

- **`world.query(question, { record, suppose })`**. The question is an object
  `{ type, seek, where, about, mode }`, a question wire of that shape, the `about=` /
  `seek=` wires `next()` produces, a wire id, or SOP Lang text. Returns
  `{ status, value | values, from, via, missing, alternatives, violations, wires }`.
  Statuses: `supported`, `conflicting` (alternatives listed with their sources),
  `missing` (names the open key and its `ask`), `no` / `unknown` for existence,
  `refused` (Q8). Modes: `value`, `list`, `count`, `exists`. `budget` comes with G7.
- **Resolution order**: lookup, supposition, producers, missing.
  - *Supposition* (not in the task text, added because the real questions need it): when
    no wire matches and the constraints are all values, a wire of that type with those
    keys is told in a scratch transaction, the rules run, the value is read, everything
    is undone. A question such as `type=line seek=total where.item=bolt where.qty=8` is
    then answered by the matrix rules, with no function. This is the shape of most
    questions in the PSys2 cases (`type=kids.shop.change seek=amount where.paid=10 ...`).
  - *Producers*: `core.producer of= key= fn=` declares a registered function that
    computes a key when no wire has it.
- **`{ record: true }`** writes the answer as a wire (and the question, if it was not
  one), with status, value, `core.via` and `core.from`.
- **Actions**: `core.action name= fn= required= ask.<arg>=`; `world.act({ action, args })`
  or a request wire runs the function inside one transaction. Outcomes `done`,
  `missing` (required arguments, with their questions), `refused`, `error`,
  `unsupported`; the world is unchanged in all but `done`.
- **Vocabulary** option: the wire types and key names for questions, answers and
  requests are defaults a host can replace.
- **Prefix slots** (`prefix=true`): one slot for every key `<key>.<anything>`.
- `complete=true` on a type (Q9); the kind `any`.
- Found with the PSys2 cases and fixed as a general rule: a reference under a
  bookkeeping key of an open namespace (`core.via=$pattern`, `core.in=$world`) may
  point outside the world; it is neither checked nor a dependency for `retract`.
  Before this, 0 of the 588 PSys2 turns were accepted.

Commands and numbers:

```
node tools/build.mjs
npm test
node compat/psys2/cases.test.mjs     # prints the per-world lines
git grep -i psys2 src/ | wc -l
npm run examples
npm run test:browser
```

| Command | Result |
| --- | --- |
| `npm test`, sources | 113 tests: 113 pass, 0 fail, 0 skipped |
| `npm test`, built file | 113 tests: 113 pass, 0 fail, 0 skipped |
| `git grep -i psys2 src/ \| wc -l` | 0 |
| `npm run examples` | exit 0 |
| `npm run test:browser` | all browser checks passed |

New tests: 11 in `test/query.test.mjs` (a warehouse, `examples/warehouse.mjs`), 3 in
`compat/psys2/cases.test.mjs`, 1 assertion block added to `test/schema.test.mjs`.

Compatibility (`node compat/psys2/cases.test.mjs`): the non-answer wires of every PSys2
turn, told to a world that holds the legends (one world per session):

| World | Turns accepted |
| --- | --- |
| kids.shop | 146 of 146 |
| kids.tasks | 227 of 227 |
| kids.arith | 211 of 215 |

The four refused turns (`t.arith.n15`, `n40`, `n41`, `n42`) refer to an entity that is
not a wire of the session: `$e.user` in three, `$e.tom` asked about before being
mentioned in one (Q10). This checks that the wires are accepted, not yet that the
answers are right: that is G8.

Deviations:

- A sixth status, `refused` (Q8). `complete=true` instead of `closed=true` for `no` (Q9).
- `next()` still produces questions with `about=` and `seek=` only; `query` accepts them.
- Not measured: the cost of supposition on a large world (one scratch `tell` per query).

## After the answers to Q3–Q7 — done

Commit: `git log --grep '^core.test -> core.check'`. It comes after G6 and not before
it as asked: G6 was already pushed when I read the answers.

- **Q3**: the condition wire is `core.check`. A `core.test` wire that a rule or deny
  links with `if=` still works as a condition (one more version); a `core.test` wire
  that nothing links is an ordinary fact. Sources, examples, tests, SPEC and the
  documentation pages use `core.check`; `induce` writes `core.check`. One test covers
  the alias and the fact case.
- **Q4**: SPEC has a "Changes" section (9) that lists `world.matrix` / `world.schema(type)`
  and the other changes since 0.4.0.
- **Q5**: `world.schema(type).unknownKinds` lists `{ key, kind }` for kinds the library
  does not check.
- Q3 to Q7 removed from `questions.md` (one line each under "Closed"). Open: Q8, Q9, Q10.

```
python3 tools/build_docs.py && node tools/build.mjs
npm test
npm run examples
npm run test:browser
```

| Command | Result |
| --- | --- |
| `npm test`, sources | 114 tests: 114 pass, 0 fail, 0 skipped |
| `npm test`, built file | 114 tests: 114 pass, 0 fail, 0 skipped |
| `npm run examples` | exit 0 |
| `npm run test:browser` | all browser checks passed |

On the `replace` benchmark (30 ms in 0.4, 47 to 81 ms at the reviewer, 50 to 59 ms here):
noted, to be found and fixed in G7 as asked.

## G3 — order and state over time — done

Commit: `git log --grep '^G3:'`. New file `src/time.mjs`; SPEC 3.10, 3.11, 3.12.
Neutral example: an account with deposits, withdrawals and audits (`examples/ledger.mjs`,
`examples/time.mjs`).

1. **Sequence.** `core.sequence key=<key>` declares the key that carries a wire's place;
   without it, or for a wire that lacks the key, arrival order (a wire without the key
   takes the place of the last wire that had one). `world.seqOf`, `world.compare`,
   checks `before` and `after`, and the pattern selector `core.select=latest|first`.
   A rule or deny with a selector is re-evaluated in full when the rest is quiet, and a
   firing whose selected wire was overtaken is withdrawn.
2. **Fluents and effects.** `core.fluent of= key=` and
   `core.effect on= fluent= op=add|sub|set|<fn> amount=<event key> | value=<literal>`,
   with the holder named by `for=<event key>` (a reference) or by
   `where.<holder key>=<event key>`. The value on the wire is the last statement plus
   the later effects in sequence order; an unknown start stays unknown; a told value for
   a fluent key of an existing wire is a new statement, not a conflict; an effect that
   breaks `min` / `max` is a `conflict` naming the event. Retract and replace recompute.
3. **As-of.** `world.asOf(at, fn)`, `ask(pattern, { at })`, `query(q, { at })`.

Commands and numbers:

```
node tools/build.mjs
npm test
node tools/bench-time.mjs
node tools/bench.mjs
npm run examples
npm run test:browser
git grep -i psys2 src/ | wc -l
```

| Command | Result |
| --- | --- |
| `npm test`, sources | 124 tests: 124 pass, 0 fail, 0 skipped |
| `npm test`, built file | 124 tests: 124 pass, 0 fail, 0 skipped |
| `npm run examples` | exit 0 (nine examples now, `examples/time.mjs` added) |
| `npm run test:browser` | all browser checks passed |
| `git grep -i psys2 src/ \| wc -l` | 0 |

New tests: 10 in `test/time.test.mjs`.

Cost (`node tools/bench-time.mjs`, one run):

| Workload | Time |
| --- | --- |
| 200 events on one account, told one by one | 11 ms |
| 1000 events on one account | 64 ms |
| 2000 events on one account | 100 ms |
| retract one event among 2000 | 5 ms |
| query as of the middle of 2000 events | 14 ms |
| 1000 accounts with 2 events each (3000 wires) | 77 ms |

The first version replayed the whole line of a holder for every event: 2000 events
took 2619 ms. A new event that comes last in sequence is now applied to the current
value directly. The last test of `test/time.test.mjs` compares the two paths on 300
generated events over two accounts (same state and same provenance, also after retracting
three events and after a JSON round trip). Writing it showed that the two paths listed
different events under `from` when an event changed nothing; the rule is now one for
both: `from` holds the events that changed the value since it was last set.

The existing benchmarks after G3 (`node tools/bench.mjs`, one run, ms): join 148,
recursion 275, 2000 tells 52, 1000 replaces 47, six completion turns 133.

Deviations and limits:

- `at` for as-of is a number of the declared sequence key, or an arrival number from
  `seqOf`. There is no separate clock.
- As-of sets aside every told wire after the point and re-derives; its cost grows with
  what came later, not with the size of the world.
- Selectors group by the patterns written before them in the rule: put the pattern that
  names the group first (`?s sensor`, then `?r reading of=$s core.select=latest`).
  A selector as the first pattern picks one wire of the whole type.
- Stratification is not checked for selectors as it is for negation.
- A matrix with fluents is treated as non-monotone by the solvers (a refusal is
  attributed to all assigned values, not to a small cause).
- Not yet checked against the PSys2 `kids.arith` dialogues: that is G8.

## G4 — aggregates and more arithmetic — done

Commit: `git log --grep '^G4:'`. SPEC 3.6.1 and 3.6.2. Neutral example: orders summarised
from their lines (`examples/orders.mjs`, `examples/aggregates.mjs`).

1. **Aggregates**: a `core.calc` with `over=<patterns>` computes over every match of
   those patterns under the bindings of the rule's own patterns (the group): `count`,
   `sum`, `min`, `max`, `argmin`, `argmax` (with `pick=`), `collect` (several values for
   one key). Allowed in rules and in denies. Kept up to date when a wire of an
   aggregated pattern arrives, changes or leaves; stratified like negation (a matrix
   where a rule aggregates over what it can produce is refused).
2. **Functions**: `abs`, `round`, `mod`, `idiv`, `time_add`, `time_diff`, `weekday`.
   Clock times `H:MM[:SS]`, dates `YYYY-MM-DD`, durations in `s`, `min`, `h`, `d`, `w`.
3. **Typed comparison**: `eq` / `neq` by value for numbers, clock times and dates
   (`5` = `5.0`, `9:05` = `09:05`); `lt` ... `gte` order clock times and dates.
   Kinds `time.clock`, `time.date`, `time.datetime`, `time.duration` are checked (Q5).

Commands and numbers:

```
node tools/build.mjs
npm test
node tools/bench-aggregate.mjs
node tools/bench.mjs
npm run examples
npm run test:browser
git grep -i psys2 src/ | wc -l
```

| Command | Result |
| --- | --- |
| `npm test`, sources | 136 tests: 136 pass, 0 fail, 0 skipped |
| `npm test`, built file | 136 tests: 136 pass, 0 fail, 0 skipped |
| `npm run examples` | exit 0 (ten examples) |
| `npm run test:browser` | all browser checks passed |
| `git grep -i psys2 src/ \| wc -l` | 0 |

New tests: 12 in `test/aggregate.test.mjs`.

"Maintained incrementally" took two attempts (`node tools/bench-aggregate.mjs`, orders
with 4 lines each, every wire told on its own, two aggregate rules in the matrix):

| Orders | Tells | First version: every group re-evaluated | Now: only the groups that changed |
| --- | --- | --- | --- |
| 100 | 500 | 913 ms (1.83 ms per tell) | 94 ms (0.19 ms per tell) |
| 400 | 2000 | 14,163 ms (7.08 ms per tell) | 225 ms (0.11 ms per tell) |
| 1000 | 5000 | 94,484 ms (18.90 ms per tell) | 522 ms (0.10 ms per tell) |

How: when a wire of an aggregated pattern is added, changed or removed, the bindings it
shares with the rule's own patterns name its group; only those groups are evaluated
again (for rules and for denies). One test compares this with a world where every rule
is evaluated in full (facts first, matrix afterwards) after 72 tells, 15 retractions and
10 replacements; another checks that a deny over a group fires when a wire leaves it.

Along the way, a general improvement: a rule with negation or a selector is now
re-evaluated in full only when a wire of a type it reads was touched in the change,
not after every change.

The existing benchmarks after G4 (`node tools/bench.mjs`, one run, ms): join 157,
recursion 324, 2000 tells 70, 1000 replaces 38, six completion turns 126.

Deviations and limits:

- Pattern matching stays textual: a pattern value `5` does not match a wire value `5.0`.
  Comparison by value is in the checks (`eq`, `lt`, ...). Say if matching should
  normalise numbers too; it would touch the indexes.
- Rules that combine an aggregate with `not=` or a selector fall back to full
  re-evaluation (when a type they read changed).
- `sum` over values with different units is not applicable (the rule does not fire).
- "season after n" from the first task list is not a built-in: it is a cyclic lookup that
  `mod` and a small table of facts express; it will be shown in G8 if a case needs it.
- `collect` is ordered by the sequence of the matched wires, so a replaced wire moves to
  the end.


## G7 — budgets everywhere, structural fork, numbers in one spelling — done

| Command | Result |
| --- | --- |
| `npm test` | sources: 150 pass, 0 fail, 0 skipped; built file: 150 pass, 0 fail, 0 skipped |
| `node --test compat/psys2/*.test.mjs` | 7 pass, 0 fail |
| `npm run examples` | exit 0 |
| `npm run test:browser` | all browser checks passed |
| `node docs/selftest.mjs` | 14 passed, 0 failed |
| `node tools/scan-loops.mjs src` | clean |
| `git grep -i psys2 src/ \| wc -l` | 0 |
| `node tools/build.mjs` | `docs/sopworld.mjs` 184.1 kB, gzip 52.3 kB |

New tests: 12 in `test/budget.test.mjs`, 2 in `test/schema.test.mjs` (numbers).

**Budgets.** `src/budget.mjs`: one `Budget` (`steps`, default 5,000,000; optional `ms`)
per public call, owned by the outermost call (`World._guard`) and ticked at 12 sites
(`grep -c "tick(" src/*.mjs` sums to 23 tick lines): match, chase, negation, aggregate,
fluent, withdraw, validate, complete, ground, solve, abduce, induce. Out of budget, the
call undoes what it did and returns its normal shape with a `budget` violation (table
in SPEC 4.11); solvers answer `unknown`. `world.stats()` gives the steps per site of the
last call.

How it is tested: for each call, `sweep()` runs it on a fresh world under **every**
budget from 1 step up to what the whole call needs (sampled for the three largest) and
checks, each time, that the budget is reported as exhausted at exactly `n + 1` steps,
that the result has the refusal shape, and that `JSON.stringify(world.toJSON())` is what
it was before. The test then requires that some run stopped in each site the call goes
through. Sites reached that way: all twelve (`tell` on a matrix with an aggregate rule
and a `not=` rule covers match, chase, negation, aggregate, validate; the ledger covers
fluent; `retract`/`replace` cover withdraw; `suggest`/`next`/`complete`/`solveReport`
with both built-in solvers cover complete, ground, solve; `abduce`; `induce`). Separate
checks: a 200×200×200 join is cut at 20,000 steps, a rule that would derive 40,000 wires
is refused with the world unchanged, `ms: 20` stops a four-way join.

The static test (`tools/scan-loops.mjs`, run by the test suite) reads `src/` and reports
every `while`, `for (;;)` and function that calls itself unless its block ticks or a
`// bounded: <reason>` comment is on it (`grep -c "bounded:" src/*.mjs` sums to 32).
The test also feeds the scan a file with two unmarked cases and checks it reports both;
it caught a real slip while I worked (a method inserted between a comment and its
function).

**Fork.** `fork()` now shares the state (a token with a holder count) and copies nothing;
whichever world first commits a change copies the indexes for itself (no replay, no rule
fires again). `node tools/bench-fork.mjs`, world of 2,100 wires (100 orders × 20 wires,
aggregate rules): fork median 0.0045 ms (max 0.041 ms over 101 forks); first write after
a fork median 0.72 ms; second write 0.032 ms; for comparison a replay (`fromJSON`) of the
same world 31 ms. The test asserts fork < 1 ms (best of 200) and independence in both
directions, including forks of forks. Cost to know: after a fork the original also
copies once at its next write, unless the fork wrote first (a world cannot tell that a
fork was thrown away).

**Numbers in one spelling** (the reviewer's note on G4). Done as asked: under a key
whose every kind is `integer` or `number` the wire keeps its text and the indexes hold
the canonical spelling; pattern constants, joins through variables, identity keys,
repetition, conflict and `enum` go by the value (SPEC 3.9). Keys without such a kind
stay text. When no slot declares such a kind the cost is one `Set.size` test per match.

**The replace benchmark.** Not fully met as the task states it; the numbers:

The benchmark is one cold run inside a harness that has just run other benchmarks. Its
figure varies by ±10 ms between runs on this machine, so I took 11 runs of each and
report min / median / max. Old harness (`/tmp/wt_823e3b3/tools/bench.mjs <library>`,
worktrees made with `git worktree add /tmp/wt_<sha> <sha>`):

| Library | join | 2000 tells | 1000 replaces |
| --- | --- | --- | --- |
| S0 `c583bfa` (0.4 as published here) | 106 / 130 / 148 | 36 / 52 / 63 | 20 / 32 / 51 |
| G4 `823e3b3` | 136 / 148 / 194 | 40 / 62 / 95 | 26 / 45 / 59 |
| now (before the numbers work) | 130 / 148 / 164 | 41 / 60 / 83 | 26 / 43 / 54 |

Per commit (9 runs each, medians, join / tells / replace): S0 130 / 48 / 32, G1+G2
146 / 63 / 38, G6 137 / 58 / 35, G3 150 / 60 / 44, G4 154 / 72 / 45. So the slowdown came
in steps with G1–G4, not from one change, and G7's budgets added nothing measurable.

Why: once the engine has compiled the code the two versions cost the same. I added a
"best of 10 more" column to `tools/bench.mjs` (the first figure is still the single
cold run) and ran the new harness on both libraries, 11 runs, medians:

| Library (`node tools/bench.mjs [path]`) | 2000 tells cold / warm | 1000 replaces cold / warm |
| --- | --- | --- |
| S0 `c583bfa` | 47 / 14 ms | 17 / 10 ms |
| now | 62 / 16 ms | 17 / 11 ms |

Warm, 1000 replaces cost 11 ms against 10 ms (30,000 replaces in one loop: 19.1 ms per
1000 before this work, measured the same way 16.3 ms for 0.4; after it the two are
within 1 ms). Cold, the new code is slower because there is more of it on the path of
every change (lineage indexes, sequence stamps, fluent and aggregate hooks, the log
index), and the first thousand calls run before the engine has optimised it. The cold
profile (`node --cpu-prof`) shows no single hot function, only garbage collection
(about 23 ms of 100) and many functions at 1–3 ms.

What I did fix on the way, each measured with `--cpu-prof`:
- the result object no longer has six working fields removed with `delete` (27 ms of
  913 ms in the tell loop); the caller gets a fresh object;
- the chase skips "what changed" bookkeeping when the matrix has no rule with negation,
  a selector or an aggregate;
- a budget is created without object spreads; firing records keep ids, not closures;
  the log has an index by wire id, so `replace` no longer scans the log.

So: in the benchmark as it now stands the cold figure for replace is 16–21 ms (it runs after
ten warm repetitions of the tells), under 30; in the old harness it is 43 ms median
against 32 for S0, which is not "at or under". I have put this as Q11 rather than keep
tuning a cold-start number without knowing whether that is what matters to a host.

Deviations and limits:

- `load()` throws on a budget refusal, as it does on any refusal.
- `solveReport`, `solve` and `satisfiable` take the step budget as `limit`, because
  `budget` was already the solver's search budget there.
- A host function in `fns` or an outside solver that loops by itself is not bounded by
  the budget, and `ms` cannot interrupt it.
- The depth limit (`maxDepth`, default 12) still stops a self-feeding rule before the
  step budget does; the violation kind is `depth` there, as before.
- Induction with more alignments than its cap keeps the wires in the order given
  instead of trying them all (it was so before; now decided before any list is built).
- Numbers: a number with an exponent (`1e3`) is not rewritten; `quantity.*` kinds are
  not canonicalised (only `integer` and `number`), so `5.0kg` and `5kg` stay different
  texts for matching and equal for the checks. Say if quantities should follow.
- Along the way: `apply()` returned working fields (`_fluents`, `_types`, ...) in its
  result; fixed.

## G5 — abduction through calculations — done

| Command | Result |
| --- | --- |
| `npm test` | sources: 155 pass, 0 fail, 0 skipped; built file: 155 pass, 0 fail, 0 skipped |
| `npm run examples` | exit 0 |
| `npm run test:browser` | all browser checks passed |
| `node docs/selftest.mjs` | 14 passed, 0 failed |
| `node tools/scan-loops.mjs src` | clean |
| `git grep -i psys2 src/ \| wc -l` | 0 |
| `node tools/build.mjs` | `docs/sopworld.mjs` 187.8 kB, gzip 53.4 kB |

New tests: 5 in `test/abduce.test.mjs`. Run against the code before this task
(`git stash; node --test test/abduce.test.mjs`) all 5 fail; now all 5 pass.

What changed (`src/abduce.mjs` only): the calcs of every rule the backward search goes
through are kept as equations over the renamed variables. When a search branch is
through, they are solved to a fixpoint: forwards when all arguments are known (and the
branch is dropped if the result contradicts a value already known), backwards for
`add`, `sub`, `mul`, `div` when exactly one argument is unknown, in any place and for
any number of arguments. A value of an abducible key may now stay a variable during
the search; if no equation settles it, the slot's `enum` or range is tried, one branch
per value. The keys of an assumed wire are settled the same way. Verification forwards
is unchanged.

The task's cases:
1. One step: "change = paid − total", total 15, goal `change amount=5` gives
   `p1.paid=20`; plus each place of each of the four functions (7 assertions).
2. Chain: two rules, and two calcs in one rule: `(qty × 4 + 5) × 1.2 = 30` gives
   `l1.qty=5`; a non-integer result (`qty=4.5`).
3. An abducible numeric key without an enum: the two cases above have none.
4. A function without an inverse (a host function `square`, and `abs`) with an `enum`
   and with a `min`/`max`/`step` range: `area v=9` gives `side=3`; `distance v=2` gives
   both `offset=-2` and `offset=2`.
5. No solution: a goal the equations can meet only by breaking a deny returns `[]`, with
   `stats().exhausted === false` and under 1,000 steps; a goal no rule produces and a
   key that is not abducible return `[]`; with a budget of 3 steps the call returns an
   empty list with a `budget` property.
6. Extra: an assumed wire (`core.abducible of=discount`) gets its computed `amount=20`.

Deviations and limits:

- One unknown per calc. Two unknowns in one equation are not solved, unless one of them
  has a domain to try.
- Aggregates are not inverted.
- A built-in name that the host replaced with its own function is not inverted (tested).
- Results keep 12 significant digits, so a division that does not come out even can
  fail the forward check (`x / 3 = 3.33333333333` is not 10 when multiplied back).
- A side effect worth knowing: a rule pattern with a variable on an abducible key
  (`?p patient condition=?c`) used to block the backward step; now the variable is
  settled by a later pattern, a calc, or the slot's domain. The existing abduction
  tests pass unchanged.

## G8 — compatibility suite — done

`node compat/psys2/run.mjs kids.shop --failures`: 147 of 147 cases pass (100.0%), 145
answers compared; matrix 69 lines, no `fns.mjs`, against 159 lines of `ops.mjs` (148
without blank lines and comments). `npm test`: 159 pass, 0 fail on sources and built
file (the runner is now a test, `compat/psys2/run.test.mjs`, with the 95% and half-the-
lines thresholds as assertions). `git grep -i psys2 src/ | wc -l`: 0.

The shop needed four general additions to the library (each with a neutral test in
`test/kernel.test.mjs` and a paragraph in SPEC), none of which names the consumer:
- `core.on=$pattern` on a template: add keys to the wire a pattern matched (3.3);
- a stratification check that knows which keys such a template adds, so "sum the lines
  of a basket, then write the total on the basket" is not taken for a cycle;
- a bookkeeping key that no slot declares does not conflict when a wire is told again;
- the sequence key may be declared after wires arrived, and a wire told again moves
  the sequence on.

Second world: `node compat/psys2/run.mjs kids.arith --failures`: 207 of 217 cases pass
(95.4%), 211 answers compared; matrix 114 lines, no `fns.mjs`, against 237 lines of
`ops.mjs` (217 without blank lines and comments). One more general addition:
`core.absent=<key>` in a pattern (SPEC 3.10, test in `test/kernel.test.mjs`), needed to
say "a question that names nobody is about everybody" and "a sum without a second
operator". The ten failures, none hidden:
- t.arith.n17, n18, n19: an impossible event (giving or eating more than one has). The
  library refuses the event when it is told (`conflict ... below 0`); PSys2 records it
  and answers `conflicting` when asked later. Same finding, at a different moment.
- t.arith.ell2, n24, t.kids.arith.d02, dm102: PSys2 answers "received 2" (supported,
  value 2) for someone whose starting count is unknown. The matrix answers `missing`:
  writing what was received into `count` would be a rule that fills a key it requires
  to be absent.
- t.arith.n31: 5 divided by 0. PSys2 `unsupported`; the calc gives nothing, so `missing`.
- t.arith.n34: 10 divided by 3. PSys2 rounds a division that does not terminate to two
  decimals (3.33); the library keeps 12 digits (3.33333333333).
- t.arith.n37: a tie for "who has the most". PSys2 `ambiguous`; `argmax` picks the first.

Third world and summary. Commands: `npm test` (162 pass, 0 fail on sources and on the
built file), `node compat/psys2/run.mjs --json`, `SOPWORLD_BUNDLE=1 node
compat/psys2/run.mjs` (same pass counts on the built file), `node compat/psys2/demo.mjs`,
`git grep -i psys2 src/ | wc -l` (0), `node tools/scan-loops.mjs src` (clean),
`npm run examples` (exit 0), `npm run test:browser` (all passed).

| World | Cases passed | Answers compared | Matrix + fns lines | `ops.mjs` lines (without blanks and comments) | ms per case |
| --- | --- | --- | --- | --- | --- |
| kids.shop | 147 of 147 (100.0%) | 145 | 71 + 0 = 71 | 159 (148) | 5.4 |
| kids.arith | 207 of 217 (95.4%) | 211 | 114 + 0 = 114 | 237 (217) | 3.6 |
| kids.tasks | 231 of 232 (99.6%) | 449 | 18 + 86 = 104 | 231 (192) | 1.7 |

My line counts leave out blank lines and comments. Against the task's figures (159, 237,
231, which are whole files) all three are at most half. Counted the same way on both
sides, the shop is (71 against 148); arith (114 against 217) and tasks (104 against
192) are a little over half.

What the tasks world is, said plainly: its logic is text handling (list names, "milk,
eggs and bread", matching "the cat" to "feed the cat"), which rules do not express, so
it is 86 lines of actions in `fns.mjs` and 18 lines of matrix. What the library takes
over there: the entries are wires and the only state (PSys2 keeps a second copy in
`ctx.state` and mirrors it), every action is one transaction, removing is `retract`,
`progress` is a declared state, a missing argument comes back as a question. The one
failure, t.tasks.n50 ("Hello"), is an operation of another world (`chat.greet` from
kids.common), not rebuilt.

Conventions of the runner, all in `compat/psys2/run.mjs`: a wire without `core.source`
is PSys2's own output for the turn and is not told (the action must produce it);
`refused` counts as PSys2's `conflicting`; a reference is `$id` in a wire and `id` in
PSys2's envelope; an action answers with an object `{ status?, value?, values? }`;
`@e.user core.agent` is told first. The `$e.tom` case (t.arith.n41) passes: the answer
is `missing` on both sides.

Known difference that no case tests: PSys2 prices a purchase at the price in force when
it was made; the matrix prices it at the current price of the item.

Demonstrations (`node compat/psys2/demo.mjs`, output copied):
1. Missing argument: `act tasks.add` without an item gives `missing` with
   `{"action":"tasks.add","key":"item","ask":"What shall I put on the list?"}`.
2. Default withdrawn: "I buy a ball" assumes `count=1`, money left 15 of 20; "three of
   them" (`fill`) replaces the assumption, money left 5.
3. Retract as undo: retracting the purchase removes 5 wires (the purchase, its part,
   line, cost and spending); money left 20 again.
4. Explain: the cost of a purchase is traced through `shop.r.cost` and `shop.r.part3`
   down to the told purchase wire.
5. Abduction: "I got 5 lei back for a book. What did I pay?" gives `c.paid=17`.

## G9 — documentation — done

| Command | Result |
| --- | --- |
| `npm test` | sources: 162 pass, 0 fail; built file: 162 pass, 0 fail |
| `npm run docs` | pages rebuilt, `docs/matrix.html` added |
| `npm run test:browser` | all browser checks passed (the new page is in the list) |
| `git grep -i psys2 src/ \| wc -l` | 0 |

- SPEC was updated with each task (3.8–3.12, 4.6, 4.10, 4.11, 9 Changes); nothing left
  to add there for G1–G8.
- New page `docs/matrix.html` ("More of the matrix"): type hierarchy and kinds, state
  over time and as-of, aggregates, `core.on=` and `core.absent=`, queries with a status
  and actions, budgets and forks. Neutral examples (vehicles, an account, orders, a
  warehouse). Every snippet and every quoted result was run first (a throwaway script;
  the same worlds are in `examples/ledger.mjs`, `orders.mjs`, `warehouse.mjs`).
- New `docs/integration.md`: the recipe in seven steps (schema, facts, questions,
  operations, sessions, limits, a runner over one's own tests), then `compat/psys2/` as
  the worked example with its results. Its two code samples (the schema map and the
  `quote` rule) were run: the map loads `class`/`field` wires with `ok: true`; the quote
  answers 9, `missing` for an unknown item, and leaves 0 `quote` wires behind.
- README links both.

Not done: the older HTML pages (Concepts, API, roadmap) still say "seven matrix wire
types" and "version 0.4" limits in places; the new page and SPEC are the current word.

## H1 — a whole assignment is checked atomically — done

| Command | Result |
| --- | --- |
| `npm test` | sources: 166 pass, 0 fail; built file: 166 pass, 0 fail |
| `node --test test/patch.test.mjs` | 4 pass; the random test compares 60 problems |
| `node compat/psys2/run.mjs` | kids.shop 147/147, kids.arith 207/217, kids.tasks 231/232 (unchanged) |
| `node tools/scan-loops.mjs src` | clean |
| `git grep -i psys2 src/ \| wc -l` | 0 |

The repro from the task, before: `solveReport()` `unsat` with both solvers, `next()`
both keys dead, `suggest` empty. After: `sat` with `a=1 b=1` from both solvers,
`next()` gives both as forced with nothing dead, `complete()` commits them together.

What changed:
- `world.check(patch)` and `world.applyPatch(patch)` (SPEC 4.9.1): wires and fills in
  one transaction, one chase, one validation. In the log the parts of a patch carry a
  group, and both replays (`fromJSON`, the fallback of `retract`) apply a group as one
  patch (tested: a world restored from JSON after such a completion is the same).
- `Problem.verify` checks a whole assignment as one patch (it used to fill value after
  value). `apply()` is the same patch, so it is atomic too.
- Single-value trials (`_shallow`, the backtrack solver's `push`) are used only when the
  matrix reads nothing that is absent: no rule or deny with `not=`, `core.absent=`, a
  selector or an aggregate, and no fluent. Otherwise domains stay whole, the built-in
  backtrack solver enumerates whole assignments (pruned by the grounded denies, which
  stay sound), and cdcl blocks each refused assignment.
- `unsat` now needs a complete justification: when absence matters and a required key
  has no closed domain, the answer is `unknown` with a `reason`.
- `next()`, `suggest()` and `complete()` follow: nothing is dead on a single trial, and
  forced values that depend on each other are committed as one patch.

Tests (`test/patch.test.mjs`): the repro; a three-key ring (a needs b, b needs c, c needs
a, a≠b) that is `sat`, then made `unsat` by one more deny, then a variant with a free
required key that is `unknown`; `check`/`applyPatch` with wires and fills, all or
nothing; and the random comparison: 60 problems of four binary keys with 6 to 29 denies
(absence, forbidden pairs, equalities), each compared with brute force over the 16
whole assignments judged by `check`: status from both solvers, the answer being one of
the solutions, and `suggest` giving exactly the values that occur in some solution
(33 satisfiable and 27 unsatisfiable problems; the seed is fixed).

Deviation: the test for soundness of single trials is global (one such rule anywhere in
the matrix turns them off for every key), not per key as the task words it. Per key
would need to follow what each rule can reach; the global test is the safe side and
costs pruning only in matrices that mix negation with large search problems. The
scheduling benchmark (no negation) is unchanged: cdcl 18 ms, 1 oracle call.

## H2 — two declarations of one slot are a composition conflict — done

| Command | Result |
| --- | --- |
| `npm test` | sources: 167 pass, 0 fail; built file: 167 pass, 0 fail |
| `node compat/psys2/run.mjs` | kids.shop 147/147, kids.arith 207/217, kids.tasks 231/232 |
| `npm run examples`, `node docs/selftest.mjs` | exit 0; 14 passed, 0 failed |
| `git grep -i psys2 src/ \| wc -l` | 0 |

The repro (`color` declared as red/blue and as blue/green) is now refused: "k2: t.color
is already declared by k1 with different content (say combine=intersect or
combine=override on one of them)". Rules as in the task (SPEC 3.1): equal declarations
are shared; `combine=intersect` (enums, kinds, reference types, numeric bounds; an empty
result is refused); `combine=override` (recorded); a subtype redeclaring an inherited
key is unchanged. Also refused: one type with two parents, two different
`core.schema.map` wires for one wire type, one module name with different imports.
`world.schema(type).keys[key].combined` shows `{ how, from }`. One test with 14
assertions in `test/schema.test.mjs`, including the same conflict through two library
modules.

Findings in `compat/psys2`: the legends have no duplicate declarations among themselves
(the schema test still loads them with 0 violations). The duplicates were mine: the
three pilot matrices declare eight keys that the legends already declare, to add
`id=true`, `min=0`, an enum and a default. Before this task they replaced the legend's
declaration silently; they now say `combine=intersect`, which is what they are
(refinements), and the pilot numbers are unchanged.

## G10 — ties and ambiguity — done

`npm test`: 168 pass, 0 fail on sources and built file. `node compat/psys2/run.mjs`:
kids.shop 147/147, kids.arith 208/217, kids.tasks 231/232 (t.arith.n37 now passes).

`argmax` / `argmin` with several best wires: the wire still gets the first pick (so
rules that read the key keep working), the tied picks are kept with the value, and
`query` answers `ambiguous` with them as alternatives. The tied set is part of what a
firing concluded, so it follows the facts: a third wire joining the tie, a tie that
appears after a single winner, and a tie broken by a replace are all in the test
(`test/aggregate.test.mjs`). `ties=first` on the calc is the old behaviour.

## G11 — soft constraints — done

`npm test`: 169 pass, 0 fail on sources and built file. `node compat/psys2/run.mjs`:
kids.shop 147/147, kids.arith 210/217, kids.tasks 231/232. `node tools/scan-loops.mjs
src`: clean. `git grep -i psys2 src/ | wc -l`: 0.

- A deny with `soft=true` is compiled as a rule whose conclusion is a `core.issue` wire
  (`rule`, `about` each matched wire, `why`), so it is maintained by the same machinery
  as any derived wire (negation, selectors, retraction).
- A slot with `min`/`max` and `soft=true` accepts the value and keeps an issue wire per
  wire and key, written and removed in validation; a fluent effect no longer refuses on
  such a slot.
- `query`: when a wire the answer rests on is the `about` of an issue, the status is
  `conflicting` with `reason`, `issues` and the value under `alternatives`.
- Test in `test/kernel.test.mjs`: a soft bound through an event (accepted, issue stands,
  query conflicting, gone after retract), a soft deny over three wires, strict default.

Pilot: the count in kids.arith is now `min=0 soft=true`. t.arith.n17 and n19 pass (the
impossible event is kept, the question about that person is `conflicting`). n18 does
not: it asks about the *receiver* of an impossible gift, whose own count is unknown, so
the answer is `missing`; PSys2 marks both people as in conflict.

## G12, G13 — calc failures have a reason; precision is the host's — done (one commit)

`npm test`: 170 pass, 0 fail on sources and built file. `node compat/psys2/run.mjs`:
kids.shop 147/147, kids.arith 212/217, kids.tasks 231/232. `npm run examples`: exit 0.
`node tools/scan-loops.mjs src`: clean. `git grep -i psys2 src/ | wc -l`: 0.

One commit for two tasks: both are a few lines in the same functions (`_bodies`,
`builtins.mjs`, the query), and splitting them by hand would have meant committing a
state that was never tested on its own.

- G12: `world.cannot(reason)`; the built-in arithmetic uses it for division by zero and
  for differing units; `query` answers `unsupported` with the `reason` when it finds no
  value and a function said why. Functions still return nothing, so nothing else changes
  (rules, effects, abduction).
- G13: `new World({ decimals })` or a `core.precision decimals=N` wire rounds the numbers
  that calcs, aggregates and effects produce. Default unchanged.
- Test in `test/query.test.mjs` (division by zero, units, a host function, `missing`
  stays `missing` when nothing was tried, three precisions).

Pilot: kids.arith declares `core.precision decimals=2`. t.arith.n31 (5 divided by 0:
`unsupported`) and n34 (10 divided by 3: 3.33) now pass. PSys2's rule is narrower
(two decimals only when the division does not terminate); no case in the pilot has a
terminating result with more than two decimals, so the difference does not show.

## G14 — the known change of a state with an unknown start — done; pilot rerun

`npm test`: 171 pass, 0 fail on sources and built file. `node tools/scan-loops.mjs src`:
clean. `git grep -i psys2 src/ | wc -l`: 0.

`core.fluent ... delta=<key>`: the holder gets a second key with the sum of the `add` and
`sub` effects since the last statement, present also when the state itself is unknown,
reset by a statement, recomputed on retract (test in `test/time.test.mjs`, including a
holder that exists only as the supposed wire of a question). A fluent with `delta=` is
always recomputed in full (no single-event fast path).

Pilot after G10–G14 (`node compat/psys2/run.mjs --failures`):

| World | Before | Now |
| --- | --- | --- |
| kids.shop | 147 of 147 | 147 of 147 |
| kids.arith | 207 of 217 | 212 of 217 |
| kids.tasks | 231 of 232 | 231 of 232 |

Of the ten arith failures: closed n37 (G10, tie → `ambiguous`), n17 and n19 (G11, soft
bound → `conflicting`), n31 (G12, `unsupported`), n34 (G13, two decimals). Still open:
- n18: the question is about the receiver of an impossible gift; his own count is
  unknown, so `missing`; PSys2 marks both people `conflicting`.
- ell2, n24, d02, dm102: the matrix now knows `received=2` (G14), but the question asks
  for `count`, which is `missing`. Whether the runner should count that as PSys2's
  "supported, 2 received" is Q12 in `questions.md`.

## H3 — certainty tiers and value-level provenance — done

| Command | Result |
| --- | --- |
| `npm test` | sources: 175 pass, 0 fail; built file: 175 pass, 0 fail |
| `node --test test/tiers.test.mjs` | 4 pass |
| `node docs/selftest.mjs`, `npm run test:browser` | 14 passed, 0 failed; all browser checks passed |
| `node compat/psys2/run.mjs` | 147/147, 212/217, 231/232 (unchanged) |
| `node tools/bench.mjs` | join 149 ms; 2000 tells 85 ms cold, 14 ms warm; 1000 replaces 17 ms cold, 11 ms warm |
| `node tools/scan-loops.mjs src`, `git grep -i psys2 src/ \| wc -l` | clean; 0 |

What is there (`src/tiers.mjs`, SPEC 4.12):
- Tiers `told > derived > forced > default > guessed`; a host adds its own with
  `core.tier name= below= cost=` and states one with `{ tier }` on `tell`, `fill`,
  `applyPatch`. The tier of a statement is kept in the log (a restored world has the
  same tiers; tested).
- A derived value takes the weakest tier of what it was read from. The tier is computed
  on demand from the provenance, not stored: nothing has to be propagated or repaired
  when an input changes.
- Value-level provenance: every derived wire and every value a rule or effect filled
  records `cells`, the `[wire, key]` pairs it was read from (the keys each pattern
  names; the wires an aggregate ranged over; for a state, its events and the wire that
  stated it).
- `world.tier(id, key)`, `world.assumptions()` (weakest first, then by number of
  dependants, each with the cells that rest on it), `tier` and `rests` in query
  results, tiers in `explain`, `review` in `next()`.
- A told value replaces any weaker value for the key (default, forced, guessed, or
  derived from one), with `revised` carrying the tier. Narrow first (only what the
  conflicting value rests on), then, if that is not enough, every assumption on the
  wires involved (the old behaviour for defaults). An adopted explanation is `guessed`
  and gives way the same way, as a whole wire.

Behaviour that changed, and the tests updated for it:
- `test/reasoning.test.mjs` "a later statement about the same key is checked against
  the completed value" expected a `conflict` when a forced value was contradicted. By
  H3 the told value now replaces it; the test asserts that, and the `revised` entry.
- `revised` entries have a `tier` field (two tests and `docs/selftest.mjs` updated).
- `complete({ choose })` records `via: 'core.choose'` instead of `core.default`.

Not done as the task words it:
- **Alternative justifications of a value are not listed.** When two rules give the
  same value, the first is recorded; if it is withdrawn the value is derived again by
  the other (as before), so behaviour is right, but `explain` and `tier` see one
  justification at a time. For wires this is unchanged (also one recorded). Listing
  all of them needs a record per (value, firing) with its own withdrawal; I left it
  out rather than do it half.
- **Invalidation is by wire, not by cell.** Changing one input withdraws what was
  derived from that wire and derives again what still holds (the existing mechanism).
  The result is the same as cell-precise invalidation; the work done is more. `cells`
  is there to make the precise version possible.
- `next()` does not reorder its questions (they are about keys that have no value, so
  they have no tier); it adds the `review` list instead.

## H4 — world.describe() and world.diff() — done

`npm test`: 176 pass, 0 fail on sources and built file. `node tools/scan-loops.mjs src`:
clean. `git grep -i psys2 src/ | wc -l`: 0.

`src/describe.mjs`, SPEC 4.13. `describe()` returns `{ types, wires, open, assumed,
issues, changes }` as plain data: per type the count and instances; per wire its tier
and each key with value and tier; open keys; assumptions weakest first; standing issues
(soft violations); the last events. Options `about` (a wire with its neighbours up to
`depth`, or a type), `since`, `last`. `world.diff(other)` / `World.diff(a, b)` gives
`{ same, added, removed, changed }` with tiers. One test in `test/tiers.test.mjs`
(scopes, an issue from a soft bound, "what changes if we go by train" on a fork).

Note: a derived wire's id depends on what it was derived from, so when its inputs
change, `diff` shows the old wire removed and a new one added, not a changed value.

## After the reviewer's notes of 18:40 — done

`npm test`: 177 pass, 0 fail on sources and built file. Pilot unchanged (147/147,
212/217, 231/232). `npm run examples`: exit 0. `node docs/selftest.mjs`: 14 passed.

- **G11 is done** (commit ddfcec5, pushed before H3; the entry "G11 — soft constraints"
  is above in this log). It closed t.arith.n17 and n19: that is the step from 208 to
  210 of 217 in the pilot.
- **A default on an optional key.** Chosen: the first of the two options, without a
  flag. `complete({ defaults: true })` and `step()` apply a slot's default whether the
  key is required or not, as tier `default` (SPEC 4.5). Reason: "optional with a
  default" has one sensible reading, and a second attribute (`apply=always`) would only
  ask the author to say it twice. `open()` still lists required keys only. Test in
  `test/tiers.test.mjs` (the total of a line with an assumed quantity is `default`;
  telling the quantity replaces it and the total becomes `derived`).
- Q12 closed.

## H5 — relations that solve in more than one direction — done

| Command | Result |
| --- | --- |
| `npm test` | sources: 182 pass, 0 fail; built file: 182 pass, 0 fail |
| `node --test test/relation.test.mjs` | 5 pass |
| `node compat/psys2/run.mjs` | 147/147, 212/217, 231/232 (unchanged) |
| `node tools/scan-loops.mjs src`, `git grep -i psys2 src/ \| wc -l` | clean; 0 |

How it is built: a `core.relation` wire (`when=` patterns, `sum=` / `sub=` terms with
optional coefficients, `equals=`) is compiled into one rule per cell. Each rule matches
the patterns without that cell, computes it from the others with the new exact function
`linsolve` (fractions of BigInts), and puts it on the matched wire with `core.on`. So
the semantics of the task's table come from what rules already do:
- one unknown: derived, with `via` the relation, `cells`, and the weakest tier of the
  inputs (tested with a guessed input);
- none and false: the rule's value meets a different one on the wire: `conflict`;
- none and true: the value is already there: nothing;
- several unknown: no rule can fire;
- propagation to a fixpoint is the chase, inside the transaction, under the budget;
- withdrawal when an input goes is the ordinary withdrawal of a firing (tested);
- a value that does not fit the slot is refused by validation (an integer cell asked to
  take 4.5: `domain`).

Tests (`test/relation.test.mjs`): paid − total − change = 0 for each of the three
missing, 198 cases; satisfied / conflict / waiting; exact decimals (20 − 0.1 = 19.9);
a coefficient both ways; the chain x + y = 10, y + z = 8, z = 3 giving x = 5, y = 5, and
nothing invented before z is known; units (2kg + 3kg = 5kg; kg and m do not add);
`relation=true` on a calc (gross = net + tax backwards) and abduction through it; the
triangle x ≠ y, y ≠ z, z ≠ x over {0, 1}: `unsat` from both solvers, `sat` once one edge
is removed.

Deviations and limits:
- No separate propagation queue and no domain pruning by support: the chase is the
  queue, and finite domains are left wholly to the search (which is what the triangle
  test asks for). Say if table-constraint pruning is wanted as a speed-up later.
- A conflict names the wire, the key, the value it has and the value wanted, with the
  wires involved; it does not list every cell of the relation in the violation (the
  `cells` are on the derived value when there is one).
- A result whose decimal does not end (1/3) is written with 12 significant digits; in
  an `integer` cell it is refused, in a `number` cell it is accepted as that decimal.
- `relation=true` covers `add` and `sub` (linear). The rule's `if=` and `not=` are not
  carried into the backward direction.
- A variable that names the same cell in two patterns (a join variable) is read, never
  solved for.

## H6 — declarative actions — done; pilot numbers

| Command | Result |
| --- | --- |
| `npm test` | sources: 183 pass, 0 fail; built file: 183 pass, 0 fail |
| `node compat/psys2/run.mjs` | kids.shop 147/147 (71 lines), kids.arith 212/217 (115 lines), kids.tasks 231/232 (18 + 86 lines) |
| `node compat/psys2/demo.mjs` | six demonstrations; the sixth is an action written as wires |
| `node tools/scan-loops.mjs src`, `git grep -i psys2 src/ \| wc -l`, `npm run examples` | clean; 0; exit 0 |

A `core.action` without `fn=` is written as wires (SPEC 4.10): `param=` (variables bound
from the request), `when=` patterns, `with=` calcs, `if=` checks as the guard, `set=`
templates with `core.on=` (replace a key of a matched wire), `add=` templates (new
wires), `remove=` (retract a matched wire), `returns=`, `all=true` to act on every
match. It is compiled like a rule and run on request: everything is evaluated on the
state before the action, then applied as one patch. For that the patch got two more
parts, public as well: `sets` (replace what a key holds) and `retract`. A set is kept in
the log, so a restored world is the same (tested). A failed guard returns `refused` with
`{ kind: 'guard', check, why }`.

Test in `test/query.test.mjs`: `take` (guard, a set and a new wire that records the stock
*before*), a transfer between two accounts (two sets from the old balances), `tidy`
(`remove` on every match), a missing parameter, a request wire, restore from JSON, and
the public `sets` against `fills`.

**In the pilot it removes no lines, and I have not forced it in.**
- In the shop dialogues a purchase is not a request: PSys2 writes a `kids.shop.purchase`
  event wire and the matrix already turns that into a debit with a rule and an effect
  (no function to replace). What a declarative "buy" adds is the guard *before* the
  purchase is recorded; that is demonstration 6 in `compat/psys2/demo.mjs` (6 lines of
  wires: buy a book with 20 lei, done; buy another, refused "there is not enough money
  for it", money left 8).
- In kids.tasks every action starts by normalising text (list names, "milk, eggs and
  bread", matching by words), which stays code; the only body that is pure "check and
  update" is `notDone`, one line.
- The comparison I can give is the neutral one: the warehouse `take` function in
  `examples/warehouse.mjs` is 8 lines of JavaScript (`sed -n '/^  take: /,/^  },/p'
  examples/warehouse.mjs | wc -l`); the same action in the test is 6 lines of wires and
  also states its guard as data.

Limits: no aggregates in an action's calcs; `set` writes one value per key.

## Housekeeping — version 0.5.0 — done

| Command | Result |
| --- | --- |
| `npm test` | sources: 183 pass, 0 fail; built file: 183 pass, 0 fail |
| `node tools/build.mjs` | `docs/sopworld.mjs` 235.9 kB, gzip 67.3 kB |
| `npm run test:browser`, `node docs/selftest.mjs` | all browser checks passed; "sopworld 0.5.0: 14 passed, 0 failed" |
| `node compat/psys2/run.mjs` | kids.shop 147/147, kids.arith 212/217, kids.tasks 231/232 |
| `git grep -i psys2 src/ \| wc -l` | 0 |

- Version 0.5.0 in `package.json`, `src/index.mjs`, the pages and SPEC. The tag `v0.5.0` exists
  locally on commit 93a5c5d but could not be pushed from this session (`git push origin
  v0.5.0`: HTTP 403; branch pushes work, tag pushes are not permitted here). It has to
  be created by someone with that right: `git tag v0.5.0 93a5c5d && git push origin v0.5.0`.
- `CHANGELOG.md`: new, changed (what a host may have to adapt), fixed.
- Old pages: "seven wire types" is now "the core wire types" with a pointer to the page
  for the rest; the API page lists the calls added since 0.4; the roadmap page has a
  "What 0.5 added" table and its limits are the current ones (three rows that were no
  longer true are replaced); "More of the matrix" gained relations, patches, tiers, soft
  constraints and actions written as wires. SPEC section 6 is "Limits of version 0.5".

Pilot at the tag: 590 of 596 cases (147 + 212 + 231). The six that differ: n18 (the
receiver of an impossible gift), the four "received" answers (kept as failures by the
reviewer's answer to Q12), and "Hello" (an operation of another world).

## The user's decision on versions (20:20): no tags, a version file and a self-describing build — done

`npm test`: 184 pass, 0 fail on sources and built file (after a fix: the first push of
this entry, 533d75a, had the new test failing because the test helper did not export
`build`; the next commit corrects it). `node docs/selftest.mjs`:
"sopworld 0.5.0 (build …, 2026-11-10): 14 passed, 0 failed". `npm run test:browser`: all
passed.

The user asked to leave tags aside. Instead:
- `tools/build.mjs` writes `docs/version.md` next to the built files (version, build
  fingerprint, date, sizes, how to read it from code);
- the built library exports `build = { version, hash, date }` besides `version` (in a
  page: `sopworld.build`); the first line of each built file carries the same;
- `hash` is the first 12 hex digits of the SHA-256 of the bundled sources, so it changes
  exactly when the code does; the date is kept while the hash is the same, so building
  the same sources twice gives identical files (checked with `cmp`);
- a test compares the loaded build with `docs/version.md` and the banner; from `src/`
  `hash` and `date` are null.

The local tag `v0.5.0` is deleted; "tag 0.6.0" in the task list means: bump the version,
rebuild, and `docs/version.md` says it. A host can pin either the commit or the build
hash.

## Round 4 — first, about G11

G11 (soft constraints) has been done and pushed since commit ddfcec5, before H3; its
entry is above ("G11 — soft constraints — done"). It is what took the arith pilot from
208 to 210 (n17, n19). The one thing round 4 asks beyond it (a soft tell returns the
issue so the host can say it) is part of W8 and will be logged there.

## L1 — one language: `?` is only a variable — done

| Command | Result |
| --- | --- |
| `npm test` | sources: 185 pass, 0 fail; built file: 185 pass, 0 fail |
| `node compat/psys2/run.mjs` | kids.shop 147/147, kids.arith 212/217, kids.tasks 231/232 (unchanged) |
| `node compat/psys2/demo.mjs`, `npm run examples`, `npm run test:browser`, `node docs/selftest.mjs` | six demonstrations; exit 0; all passed; 14 passed, 0 failed |
| `node tools/migrate-syntax.mjs --check <tracked files>` | nothing left to change except two places that describe the old form on purpose |
| `node tools/scan-loops.mjs src`, `git grep -i psys2 src/ \| wc -l` | clean; 0 |

What changed:
1. A pattern is written `@id type ...` like every wire. It is a pattern (or a template)
   because a rule, deny, calc (`over=`), relation or action told with it names it. The
   engine already recognised templates that way; the same test now covers patterns, so
   a pattern without a variable is a pattern too (tested with `core.absent=`).
2. `?name` is only a variable, in value position.
3. Id spaces are unchanged: a fact may have the id of a pattern (tested).
4. Queries: `ask('@c change of=$b1 amount=?a')`, or without an id
   (`ask('change of=$b1 amount=?a')`, several declarations allowed); bindings come back
   by variable name, the matched wire under the pattern's id when it has one.
5. `#` comments stay; a `#` inside a string is text (tested).
6. Migration: `?id type ...` is still read, marked `legacy`, noted once per id in
   `world.warnings` (`{ kind: 'deprecated', id, why }`), and written back as `@id` by
   `format()`. `tools/migrate-syntax.mjs` converts files (also wires inside program
   strings) and has `--check`. Converted with it: 36 files, 442 declarations (the sum of the `--check` listing; README,
   SPEC, `docs/integration.md`, the docs generator and the pages it builds, the
   playground and selftest, all examples, all tests, the benchmark, the two pilot
   matrices that have rules, the pilot demo).
7. SPEC 2.1 "The language" is now the single grammar: EBNF, the three signs with one
   meaning each, what makes a wire a fact or part of the matrix, id spaces, queries,
   canonical form, errors, and the old form. It is written to be lifted as it stands.

Tests: both forms of the same matrix give the same world and the same matrix ids; the
old form warns once per id and the new form not at all; a wire with a variable that
nothing names is refused; a pattern with no variable; a fact with a pattern's id; the
three query forms; the parser round trip.

Two things a host should know (both in SPEC 2.1):
- A rule and the wires it names are told together, in one text. That was already true
  of templates; with `?` gone it is true of patterns too. A wire with a pattern's id
  told later on its own is a fact.
- The migration tool works on text: it also rewrites a `?name word` that stands in a
  comment. It found one such line in `src/unify.mjs` ("?x  variable"), left as it is.

## W1 — functions do not share one registry — done

`npm test`: 186 pass, 0 fail on sources and built file. Pilot unchanged (147/147,
212/217, 231/232). `npm run examples`: exit 0. `git grep -i psys2 src/ | wc -l`: 0.

- Three registries: `fns` (calcs, checks, effect ops), `actions`, `producers`; options
  of the same names and `world.register(kind, name, fn, { override })` (SPEC 3.6).
- A function with the name of a built-in function **or aggregate** is refused at
  registration unless `override` is true or lists the name.
- An action or producer found only in `fns` still runs, with a `deprecated` note in
  `world.warnings` (one version, like the old pattern form).
- Test (`test/query.test.mjs`): a world with actions named `add` and `count` and a
  producer, whose rule still adds with the built-in; the refusals; `override`; the note.
- The pilot's kids.tasks was hit by exactly this (its actions are called `add`,
  `count`, ...): `fns.mjs` now exports `actions`, and the runner passes whatever of
  `fns`, `actions`, `producers` a world exports. The warehouse example is split the same
  way.

## W2 — a query returns what it derived — done

`npm test`: 187 pass, 0 fail on sources and built file. A result obtained by supposing
a wire carries `supposed: { type, attrs, set, fills }`: the supposed wire after the
rules ran, the keys they added, and each added value with `via`, `from`, `tier`
(SPEC 4.10). Test: one query for the total of a quote also gives the tax and the unit
the same rule set; a `missing` answer shows an empty `set`; a lookup has no `supposed`.

## W3 — violations stay explainable after rollback — done

`npm test`: 188 pass, 0 fail on sources and built file. Pilot unchanged.

- Every violation has `involved`: the wires it names, as `{ id, type, attrs }` snapshots
  taken before the rollback (the test tells a payment that is refused: the payment is
  not in the world afterwards, and is in the violation).
- `why=` of a deny may contain its variables; the violation has the filled text and
  `bindings` as data. Same for a soft deny (the issue's `why`) and for the guard of an
  action written as wires. A name followed by punctuation ("?t.") is handled; an
  unbound variable stays as written.

## W4 — the whole state can be checked; a deny over a state refuses the event — done

`npm test`: 190 pass, 0 fail on sources and built file. Pilot unchanged.
`node tools/scan-loops.mjs src`: clean.

- `world.check()` with no argument validates every wire and every deny and returns
  `{ ok, violations, issues }`. In this mode, and when the matrix itself changes, every
  match of a deny is listed (once per set of wires); a normal change still stops at the
  first match per deny.
- `World.audit(wires, matrix, options)` for wires from elsewhere.
- **The deny over a fluent: the engine already does it; no fix was needed.** Probe
  (`/tmp/w4.mjs`, now a test): a wallet with `amount` as a fluent, a `spend` effect and a
  deny "amount below 0" on the wallet. Telling a spend of 40 against 6 returns
  `ok: false`, `why: "that would leave -34"`, support `[w1, s2, s1]`; the event is not
  in the world and the amount is still 6. What the host saw comes from how the pilot's
  shop matrix is written: its denies are on the *question* wires (balance, left-after),
  because PSys2's own behaviour is to record the purchase and report the conflict when
  asked, and the pilot was matching that. SPEC 4.9.1 now states the pattern: put the
  deny on the state to refuse the event; `soft=true` to keep it and flag it.
- Tests in `test/patch.test.mjs`: a valid world with one soft issue; a tightened matrix
  refused with both offending wires; two wire objects changed behind the world's back,
  both found by `check()`; `World.audit` on good, bad and badly-formed input; the
  deny-over-state pattern.

## W5, W6 — world.revise; told wires stay as told — done (one commit, 9aa0f3e: they share the patch code)

`npm test`: 192 pass, 0 fail on sources and built file. Pilot unchanged.

- **W5** `world.revise(id, key, value)` / `revise(id, { key: value })`: one transaction
  (a patch of `sets`); the result has `revised` with the old values and their tiers; a
  revision whose result a deny refuses changes nothing; it is in the log and survives a
  restore. Test in `test/tiers.test.mjs`.
- **W6** `world.told()`: the told wires with the values they were told with and those
  told later (fills and revisions), without anything a rule, a default or a search
  added. For idempotence one behaviour changed: **a wire stated again under its id that
  says nothing new is accepted** (it used to be `duplicate-id`); saying something
  different for an existing id is still `duplicate-id`. Test: a world with an identity
  key, a default, a rule that fills a total, a later fill, a revision and a retraction;
  `tell(told())` on the same world adds and fills nothing; on a fresh world with the
  same matrix it gives the same wires and values. `toJSON` was already "as told" (it is
  the log). Limit, stated in SPEC: a state stated several times between events needs
  the order of statements, which `toJSON` keeps and a list of wires cannot.

## W7 — abduction through query — done

`npm test`: 193 pass, 0 fail on sources and built file. Pilot unchanged.

- A `missing` answer for a key that is declared abducible carries `howto`: the values
  that would make the other keys of the question hold (`[{ value, cost, fills,
  assume }]`). With `mode: 'abduce'` that is the answer: `supported` (one value) or
  `ambiguous` (several), tier `guessed`. Nothing is recorded (SPEC 4.10).
- It needed one fix in abduction itself: a goal that names more keys than a `core.on=`
  template sets found nothing (the extra keys were compared with the template, not
  with the wire the template fills). Now they are put to the pattern the template
  writes on. Probe before: `abduce('@g change item=book amount=5')` gave `[]`; after:
  `c1.paid=17`.
- Test in `test/abduce.test.mjs`: forwards as before; "5 back for a book" gives `missing`
  with `howto` 17; as an abduction `supported 17`, tier `guessed`; on an existing wire
  the explanation names it; plain `missing` when there is nothing to aim at or the key
  may not be assumed.

## W8 — undo, mark and rewind; a soft change returns its issue — done

`npm test`: 194 pass, 0 fail on sources and built file. Pilot unchanged (147/147,
212/217, 231/232). `node tools/scan-loops.mjs src`: clean. `git grep -i psys2 src/ |
wc -l`: 0. `npm run examples`: exit 0. `npm run test:browser`: all passed.

- `world.undo(n = 1)`: takes back the last n statements (tell, fill, revise, an action's
  patch; a patch is one), by rebuilding the world from the statements that remain.
  Returns `{ ok, undone, removed, added, changed }`. Cost grows with the history.
- `world.mark()` / `world.rewind(mark)`: a mark is a copy-on-write fork of the world;
  rewind adopts it, so it is exact (also across retractions, which undo does not take
  back), constant time, and reusable. This is the pair for a host that keeps its own
  snapshots.
- A change that records a soft violation returns it: `issues: [{ id, rule, about, key,
  why }]` on the result of `tell`, `fill`, `applyPatch`, `revise` (this is the part of
  G11 that round 4 added).
- Test in `test/tiers.test.mjs`: undo of a fill, of a revision (the derived total
  follows), of two statements at once (a soft wire and its issue go), of the matrix
  itself, nothing left to undo; rewind to a mark twice, once after a retraction; the
  world works on after a rewind.

W1–W8 are done. Next: D1, then 0.6.0 (version bump and rebuild; no tags, by the user's
decision of 20:20, see above).

## D1 (2 of 4) — docs/reference.md, checked against the library — done

`npm test`: 198 pass, 0 fail on sources and built file (28 documented examples run, 22
of them in the reference). `git grep -i psys2 src/ | wc -l`: 0.

- `docs/reference.md`: one entry per matrix wire type (18, the keys of `GRAMMAR`), the
  three modifiers, `core.question`/`core.answer`/`core.request`, `core.issue`, and every
  built-in function (24) and aggregate (7). Each type entry has Syntax (attribute
  table), Meaning, When it is evaluated, Interactions, Violations, Example, Limits.
  Every example was run first; the outputs in the file are what
  `node tools/doc-examples.mjs --write` printed.
- Writing it corrected five things I would have stated from memory: the violation for an
  undeclared key on a closed type is `unknown-key` (not `closed`); a range domain is
  capped at 2,000 values (`RANGE_CAP`), not 10,000; a second `core.sequence` is not
  refused (the one compiled last holds); the recorded `core.answer` carries `status`
  and `value` (not `core.status`); `abduce` wants a goal with an `@id`.
- Three tests in `test/docs.test.mjs`: every type of `SCHEMA_TYPES`/`GRAMMAR` has an
  entry with all seven parts, and every `core.*` heading is a type the library knows;
  the attribute table of each type equals `GRAMMAR[type]` in both directions
  (`core.schema.map` excepted: its fields are the host's); the function tables equal
  the keys of `builtins` and `aggregates` in both directions. Checked that they bite:
  with the `delta` row and the `weekday` row removed, two tests fail naming them.
- `tools/lib-under-test.mjs` now also exports `GRAMMAR`, `MODIFIERS`, `SCHEMA_TYPES`,
  `aggregates`, so these tests run on the built file as well.

Left of D1: semantics.md (numbered statements, each naming its test), api.md (checked
against index.d.ts), SPEC as overview with the HTML generated from the markdown.

## D1 (3 of 4, first half) — docs/semantics.md, every statement tied to a test — done

`npm test`: 203 pass, 0 fail on sources and built file.

- `docs/semantics.md`: 62 numbered statements (S1–S62) in 14 sections (transaction,
  identity and merging, fixpoint and termination, negation and absence, defaults /
  completion / revision, certainty, provenance and retraction, sequence / states /
  as-of, aggregates, relations, search, queries, worlds side by side, persistence and
  replay), five invariants, and the table of violations (`#violations`, 19 kinds).
  Where a choice was made, the statement gives the reason in one sentence (`Why:`).
- Three statements had no test; `test/semantics.test.mjs` adds them: identity by keys
  (merge, conflict, restatement, duplicate id); every accepted change leaves a world
  that passes `check()` and every refused one leaves wires, stamp and log untouched
  (9 changes, 5 of them refused); `check(patch)` changes nothing and `applyPatch`
  gives what a fork that applied the patch has, and the snapshot rebuilds it.
- Two tests in `test/docs.test.mjs`: every statement is numbered in order and cites at
  least one test, and every cited name is the name of a test in `test/`; every
  `kind: '...'` in `src/` is in the table of violations.
- Corrected while writing: an unknown module is a `schema` violation (I had written
  `unknown-world` in the reference; no such kind exists).

## D1 (3 of 4, second half) — docs/api.md, checked against index.d.ts and the library — done

`npm test`: 204 pass, 0 fail on sources and built file (79 documented examples run: 51
in api.md, 22 in reference.md, 6 in language.md). `npx -p typescript tsc --noEmit
--strict src/index.d.ts`: no output (no errors).

- `docs/api.md`: every export (27) and every public method of a world (50 on the
  prototype, 3 static), each with what it takes, what it returns, errors, budget
  behaviour and cost where it computes, and an example. Small readers that belong
  together share an entry (`get`/`has`/`resolve`/`ofType`, `mark`/`rewind`,
  `solve`/`solveReport`/`satisfiable`); `solveAsync` has the only example that is not
  executed (the runner is synchronous).
- `tools/doc-examples.mjs`: a block fenced ```` ```js setup ```` stands in front of the
  run blocks that follow it, so the page shows its example world once.
- Test `docs: api.md, index.d.ts and the library agree on every export and every public
  method`: both directions for exports and for methods (prototype and static), and
  every entry has an example.
- `src/index.d.ts` repaired: a broken line in `QueryResult`; the violation kinds
  (`variable` in place of `syntax`, plus `guard`, `refused`, `error`, `unknown-action`,
  `nothing-to-undo`); `involved`, `bindings`, `issues`, `review`; `SopError` fields;
  the missing exports `unify`, `walk`, `GRAMMAR`, `MODIFIERS`, `SCHEMA_TYPES`,
  `aggregates`.
- Behaviour I had wrong and the examples corrected (documented as it is, not changed):
  `retract` also removes the facts that refer to the retracted one (S30 reworded);
  `unsupported` is only answered when the world supposed the wire (S54 reworded) — for
  a wire that exists the status is `missing`; an action's `find` returns an array;
  `unify` takes values, not wires; a patch is several log entries that `undo` takes
  back as one.

## D1 (4 of 4) — one source: SPEC is an overview, the HTML is generated from the markdown — done

`npm test`: 206 pass, 0 fail on sources and built file (80 documented examples run).
`npm run test:browser`: all browser checks passed (9 pages load, all 11 local links
resolve, four pages fit a 390 px screen). Pilot: kids.shop 147/147, kids.arith 212/217,
kids.tasks 231/232. `node tools/scan-loops.mjs src`: clean. `git grep -i psys2 src/ |
wc -l`: 0. `npm run examples`: exit 0.

- `SPEC.md` went from 1,249 lines to an overview: the table of pages, the purpose, one
  executed example, the limits, the architecture, build and version. Everything else
  it held now has exactly one place: language.md, reference.md, semantics.md, api.md.
  `tools/doc-examples.mjs` runs the example in SPEC.md too.
- `tools/build_docs.py` no longer contains documentation text. It renders SPEC.md and
  the six markdown pages to `docs/index.html`, `language.html`, `reference.html`,
  `semantics.html`, `api.html`, `glossary.html`, `integration.html` (headings with the
  anchors GitHub gives them, tables, lists, fenced code, links rewritten from `.md` to
  `.html`), and still writes the playground and the self-test, which are programs. The
  version in the page header is read from package.json. Each generated page carries
  the hash of its source.
- Removed, because they were a second, hand-written telling of the same things:
  `docs/concepts.html`, `matrix.html`, `reasoning.html`, `usecases.html`,
  `solvers.html`, `roadmap.html` (the last one said "What 0.4 added"). The use cases
  remain as the runnable programs in `examples/`.
- Two tests: every HTML page carries the hash of the current text of its markdown file
  (so a page cannot go stale unnoticed; no Python needed to check), every markdown
  page has an HTML page and the reverse; no documentation file says "seven wire types",
  names a version other than the current one (except "before version N", which is
  history), or declares a pattern as `?id type ...` (the language page shows the old
  form once, as something still read).
- README and `tools/browser-check.mjs` point at the new pages.

D1 is complete: language.md, glossary.md, reference.md, semantics.md, api.md, one
source, and tests that fail when a wire type, attribute, function, method or violation
kind exists on one side only. Next: 0.6.0.

## 0.6.0 — version, changelog, rebuild; no tag — done

`npm test`: 206 pass, 0 fail on sources and built file. `npm run test:browser`: all
browser checks passed. Pilot: kids.shop 147/147, kids.arith 212/217, kids.tasks
231/232 (unchanged since 0.5.0). `git grep -i psys2 src/ | wc -l`: 0.

- `package.json` and `src/index.mjs`: 0.6.0. `docs/version.md`: version 0.6.0, build
  7015034cd985, built 2026-11-10 (258.7 kB, 73.8 kB gzipped). No git tag, by the
  user's decision; a host pins the commit and reads `build` from the file it loaded.
- `CHANGELOG.md`: 0.6.0 — new: L1, W1–W8, the build identity, D1; changed: the
  `variable` violation kind, restatement accepted, the three registries, `SopError`
  fields, `unknown-attribute` notes, the removed HTML pages.
- The HTML pages were regenerated (their header reads the version from package.json;
  the docs test fails if they are not).

Rounds 1–4 are complete. Nothing is open in `questions.md`.

## Language v1.1: the reviewer's seven notes on docs/language.md; 0.6.1 — done

I read the notes of 21:10 only after 0.6.0 (c1aca9f) was pushed, so they are a version
of their own: **0.6.1**, because a stricter parser can need a change in a host and two
different builds should not both be called 0.6.0.

`npm test`: 208 pass, 0 fail on sources and built file (83 documented examples run).
`npm run test:browser`: all browser checks passed. Pilot: 147/147, 212/217, 231/232
(unchanged; the whole PSys2 corpus in `compat/psys2` is read by the strict parser).
`node tools/scan-loops.mjs src`: clean. `git grep -i psys2 src/ | wc -l`: 0.
`npm run examples`: exit 0. `tsc --noEmit --strict src/index.d.ts`: no errors.
`docs/version.md`: 0.6.1, build c034e3804d4e.

1. **Strings.** JSON escapes exactly; a bad escape is an error. `parse` stores each
   string in the spelling `JSON.stringify` gives its text, so `"café"` and
   `"café"` are one value. `str()` decodes, `quote()` writes that spelling. Stated
   difference from v1: a line end may also stand in a string as it is (stored as `\n`).
2. **Identifiers.** Segments joined by single dots, ASCII only; `a..b` and `a.` are
   errors. One stated difference from v1: a segment after the first may start with a
   digit, because the PSys2 corpus itself has `$pat.kids.shop.price.q.2` and
   `@t.arith.2` (with v1's rule 2 compat tests fail on PSys2's own wires).
3. **Errors.** 13 named errors (the 8 of v1, split by cause, plus three about quotes
   and backslashes), each with offset, line and column; one `SopError` carries all of
   a text's errors in `errors`. Nothing is repaired. `parse(text, { lenient: true })`
   keeps the old reading; `world.tell(text)` is always strict. No test, example or
   matrix in the repository needed the lenient mode.
4. **Atoms.** Decided: an atom may contain anything except white space, `"` and `\`,
   and may not start with `$`, `?`, `@`, `#`. So `a=b`, `ann@example.org`, `#fff` after
   `=` stay text (v1 forbids `@`, `$`, `=` anywhere; v1.1 is the superset). The rule
   for `@`: a declaration starts only with a token whose first character is `@`.
5. **Canonical serialization.** `format(wire, { canonical: true })` and the new
   `serialize(wires, { canonical })`: as in v1 (sorted by key, repeats in order, JSON
   spelling, `\n`, a line end after each wire).
6. **Keys and values as data.** language.md section 3 gives the in-memory wire and the
   `{ kind, v }` form; new `readValue` / `writeValue` convert. Short and qualified keys
   are section 6; the parser never resolves them.
7. **"From SOP Lang v1 to v1.1"**: section 11, a table of the differences with the
   reason for each; a v1 file needs no change.

Tests: `parser: every syntax error is named, with its place, all in one error; nothing
is repaired` and `parser: identifiers, atoms, JSON escapes, one spelling per string,
the canonical form, values as data` in `test/core.test.mjs`. api.md, index.d.ts and
CHANGELOG follow (the docs tests enforce the first two).

Changed for a host: `str('"a\\nb"')` now gives a line end where it gave `n`.

## P1 — complete() / next() with nothing to fill are cheap; canComplete() — done

`npm test`: 209 pass, 0 fail on sources and built file. Pilot output identical to the
run before the change (`diff` of `node compat/psys2/run.mjs` without the timings:
empty): 147/147, 212/217, 231/232. `node tools/scan-loops.mjs src`: clean.
`git grep -i psys2 src/ | wc -l`: 0.

`node bench/complete.mjs` (420 wires, slots that offer nothing to fill), before → after:

| | before | after |
| --- | --- | --- |
| `complete()`, nothing changed | 0.304 ms | 0.006 ms |
| `next()` | 0.276 ms | 0.043 ms |
| tell + `complete()` | 0.362 ms | 0.030 ms (tell alone 0.013) |
| `canComplete()` | absent | 0.019 ms |
| `complete({ defaults })` filling 150 defaults | 220 ms | 130 ms |

- `review` is computed only for `next({ review: true })`; `complete()` never computes
  it. This changes `next()`'s default result (no `review` key); the one test that read
  it now asks for it, and api.md, index.d.ts and the changelog say so. I followed the
  reviewer's wording here rather than keeping the old default, because the point is
  that a host calling `next()` does not pay for a pass it does not use.
- The compiled matrix caches a fill plan per type: the required slots and the optional
  ones with a default. `open()`, `next()` and `canComplete()` look only at those; when
  the matrix has none, they return at once.
- `complete()` returns its previous answer (a copy) when the state stamp and the
  options are those of a previous call that filled nothing. The stamp never repeats
  within one world (a rollback restores the stamp of the same state; `_adopt` takes a
  fresh one); the cache is per world and not shared with forks, whose clocks can give
  equal stamps to different states; `register` clears it.
- `world.canComplete(id?)`, public and documented: an optional key with a default, or a
  required key with a default, an enum, a range, or a type that has wires. Hosts need
  not read `_compiled().slots` any more.
- Test `complete: with nothing to fill it is cheap, and its answer is the one a full
  run gives` (budget.test.mjs): the second call does 0 steps, returns an equal copy,
  equals a world rebuilt from JSON; options, matrix changes and forks are looked at
  again; `review` only on request.
- Bench in `bench/complete.mjs` (the new `bench/` directory; the older benches stay in
  `tools/`).

## P2 — the first change after fork() or mark() copies only what it touches — done

`npm test`: 211 pass, 0 fail on sources, 211 on the built file, 210 with
`SOPWORLD_COW_CHECK=1` (the new third run, below). Pilot output identical to the run
before Round 5 (`diff` without timings: empty). `node tools/scan-loops.mjs src`:
clean. `npm run examples`: exit 0. `npm run test:browser`: all browser checks passed.
`git grep -i psys2 src/ | wc -l`: 0.

`node bench/fork.mjs` (median of 201 runs; a base of n/2 people and n/2 visits, a rule
that marks each person), the old sources (`git stash push src`) → the new ones:

| wires | tell, nothing shared | fork + first tell | mark + first tell | the same, after a rewind | fork + tell / tell |
| --- | --- | --- | --- | --- | --- |
| 60 | 0.016 → 0.019 ms | 0.078 → 0.023 ms | 0.116 → 0.032 ms | 0.099 → 0.067 ms | 4.99 → 1.20 |
| 600 | 0.012 → 0.012 ms | 0.541 → 0.017 ms | 0.433 → 0.028 ms | 0.424 → 0.064 ms | 46.4 → 1.44 |
| 6,000 | 0.012 → 0.011 ms | 7.845 → 0.015 ms | 7.961 → 0.017 ms | 5.586 → 0.077 ms | 633 → 1.34 |

The target (fork + first tell within 2× a tell on a world that shares nothing,
independent of the base size) is met: 1.20, 1.44, 1.34. A mark followed by a tell is
1.4–2.5× and flat in the size. The column "after a rewind" is a tell that follows a
`rewind`; it is flat in the size too (0.064–0.077 ms) but slower, because `rewind`
itself walks both worlds to compute its diff, and the next tell runs after that pass
(a plain O(n) pass between tells slows the next one in the same way without any fork).

What changed:
- `src/cow.mjs`: `CowMap`, `CowSet` and `CowList` read through to a base and keep their
  own changes; iteration gives exactly the order a plain Map, Set or array would give.
  `WireMap` copies a wire the first time `get()` returns it, so whatever the caller then
  changes changes only this world; `has()`, `peek()` and iteration do not copy. Chains
  are kept short: an empty layer is skipped, small maps and sets (32 entries or fewer)
  are copied instead, and a chain deeper than 8 is merged from the top while the next
  layer is not much bigger than what was merged (so a change is merged a logarithmic
  number of times), or flattened when the changes are a quarter of the base.
- `fork()` shares as before. `_detach()` (at a shared world's first `_begin`, also for
  dry runs, since it is now constant) puts a layer on the wires, the five index maps,
  matrix, alias, used, firings, `_logOf` and the history; the log (statements, short)
  is copied when it is first appended to. Index sets are copied on write, one by one,
  through `_setOf` / `_setFor`; there is no "last holder owns the state" any more,
  since the shared state is the base of the other world's layers.
- Two places wrote wires that came from iteration (as-of, and re-stamping when the
  sequence key is declared late); they now take the world's own copy with `get()`.
- **Checking mode.** With `SOPWORLD_COW_CHECK=1`, every committed change forks the
  world (and drops the fork), and `fork()` deep-freezes the shared wires and makes
  every write to the shared maps, sets, log and history throw. `npm test` runs the
  whole suite (and the PSys2 compat tests) once more this way: 210 pass. It found the
  two places above, and nothing else.
- Tests: `cow: layered maps, sets and lists behave as plain ones, in order, and never
  change what they were made over` (120 random rounds of 25 generations each, against
  plain Map/Set/array, checking every earlier generation at the end, and the depth of
  chains); `cow: forks of a large world are independent in both directions, after any
  number of forks and marks` (60 forks of forks of a 1,200-wire world, fills, tells and
  retractions, each checked against its parent and against a rebuild from its log;
  five mark/tell/rewind rounds).
- Docs: S58 in semantics.md (with the reason and the new test), the fork and mark
  entries of api.md, the architecture in SPEC.

## P3 — the tells of an action are propagated together (Q13, with its three conditions) — done

`npm test`: 213 pass, 0 fail on sources, 213 on the built file, 212 in checking mode.
Pilot output identical to the run before Round 5. `node tools/scan-loops.mjs src`:
clean. `npm run examples`: exit 0. `git grep -i psys2 src/ | wc -l`: 0.

`node bench/act.mjs` (a host action that tells 70 headings, in a fresh fork of a
600-wire world whose matrix keeps a heading count per document and has a deny that reads
an absence; median of 101 after a warm-up round), before P3 (`git stash push
src/query.mjs`, so with P1 and P2) → after:

| action | before | after |
| --- | --- | --- |
| 70 tells, no reads | 3.190 ms, 70 propagations | 0.910 ms, 1 propagation |
| 70 tells, a read after each | 3.938 ms, 70 propagations | 4.460 ms, 70 propagations |

The second line is the case that must not change: it propagates at each read, as
before; the difference is within the run-to-run noise of this bench (the same line
measured 1.5–2.0 ms across runs with a lighter matrix). With a matrix that has no
aggregate and no negation the batch gains little (0.72 → 0.69 ms), because then each
tell's propagation only looks at that tell's wires; the cost of propagating after each
tell is in what is evaluated again in full after every change.

- In a host function, `ctx.tell` parses at once (a syntax error still fails the action
  where it is) and queues; `_tellQueued` takes the queued statements in one by one (one
  log entry each, as before), then runs the rules and validates once. The queue is
  flushed at the first read through the context (`find`, `val`, `vals`, and the new
  `get`, `query`, `ask`), before `fill`, `replace` and `retract`, at the end, and on any
  use of `ctx.world` (a proxy): the PSys2 tasks world reads `ctx.world.seq` between two
  tells to name the next one, and gets the same names as before.
- Condition 1: a refusal names every queued tell involved, under `queued: [{ index,
  ids }]`, in the order told: a tell whose wires (or the wire they merged into) appear in
  the violation's `id`, `wires`, `support` or `involved`, and the tell whose intake
  raised it.
- Condition 2: `ctx.flush()` and `ctx.tell(x, { now: true })`, documented in S57
  (semantics.md), the `act` entry of api.md, the core.action entry of reference.md and
  the kernel list in SPEC.
- Condition 3: tests `act: tells are checked where the action reads and at its end; a
  middle state a later tell repairs is accepted` (a negative balance repaired by a
  credit told after it is accepted; with `{ now: true }` it is refused as before;
  `flush()` refuses at the flush and names the one queued tell; a conflict between two
  tells names both, [0, 1]) and `act: an action that reads after each tell gives exactly
  the results of telling one by one` (the world with provenance, the log and the value
  equal those of the same action with `{ now: true }` and of five plain tells). The
  bench shows the one propagation.
- Q13 closed in questions.md.

## 0.6.2 — Round 5 released (version, changelog, rebuild; no tag) — done

`npm test`: 213 pass, 0 fail on sources, 213 on the built file, 212 in checking mode.
`npm run test:browser`: all browser checks passed. Pilot 147/147, 212/217, 231/232,
output identical to before Round 5. `docs/version.md`: 0.6.2, build b1133a1396f7,
built 2026-11-11.

Next: Round 6 (R6.1–R6.12), in the order worker-tasks.md gives.

## R6.1 — a multi-valued key answers with all its values in value mode — done

`npm test`: 214 pass, 0 fail on sources and built file, 213 in checking mode. Pilot
output identical (`diff` without timings: empty). The library spells a multi-valued
slot `many=true`.

- In value mode, several distinct values of a key whose slot says `many=true` are
  `supported`, returned as `values` with their `from`, as `mode=list` already did; one
  value is a plain `value`; a key without `many` keeps `conflicting`.
- Test `query: a key that may hold several values answers with all of them in value mode;
  a single-valued key still conflicts` (the habitat repro, one value, several wires, a
  key without `many`). S50 in semantics.md states the rule and the reason.

## R6.2 — mode=check: is a held or derived value the one given — done

`npm test`: 215 pass, 0 fail on sources and built file, 214 in checking mode. Pilot
output identical. `tsc --noEmit --strict src/index.d.ts`: no errors.

- `query({ ..., mode: 'check' })`: the value to check is `where[seek]` (or `value`); it
  is taken out of `where`, the rest of the question is asked in list mode, and the value
  is compared with what the world holds or derives (as numbers under a numeric slot):
  `supported` with `value: 'yes'`; `no` with `actual` (the values it has), `from`, `via`
  and `checked`; `missing` when there is nothing to compare with; any other status
  passes through. The value is never supposed. The same from a `core.question` wire with
  `mode=check where.<key>=<value>`.
- Test `query: mode=check says whether a held or derived value is the one given, and if
  not, what it is` (whale/fish: `no` with `mammal`, from `w1` via `r`; `yes`; `0.0`
  against `0` under an integer slot; `missing`; the question-wire form; nothing changed).
  S55a in semantics.md (with the reason), the query entry of api.md, index.d.ts.

## R6.3 — checked: both already work; closed with the tests that show it — done

`npm test`: 215 pass, 0 fail on sources and built file, 214 in checking mode.

- (a) A query answered by supposing a wire returns `supposed.set` (every key the rules
  set, here `total`, `tax`, `unit`), `supposed.attrs`, `supposed.fills` with their
  `from`, and a non-empty `from` and `via` on the answer (`['p1']`, `['r']`). `wires`
  is, by definition, the existing wires the question is about, so it stays empty for a
  supposed wire; the wire itself is `supposed`. Test `query: an answer found by supposing
  carries the supposed wire as the rules left it` (W2), which now also asserts `from`,
  `via` and `wires`.
- (b) A deny's `why` may quote the match: `why="?n is ?b"` gives "ann is -3", and the
  violation carries `bindings` as data. Test `violations: explainable after the change is
  undone; a reason may quote the values` (W3, kernel.test.mjs).
- The older workarounds the reviewer listed are also in place: `register` refuses to
  replace a built-in without `override` (W1), `revise` (W5), `told()` (W6),
  `check(patch)` (H1).

## R6.4 — opaque values: kind=blob — done

`npm test`: 216 pass, 0 fail on sources and built file, 215 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

`node bench/blob.mjs` (600-wire world; median of 21 after a warm-up round):

| | fill the value | tell as text | fork + first tell | mark + tell + rewind | toJSON |
| --- | --- | --- | --- | --- | --- |
| 6 characters | 0.131 ms | 0.081 ms | 0.053 ms | 1.001 ms | 51 kB |
| 1 MB blob | 3.639 ms | 5.490 ms | 0.072 ms | 1.182 ms | 1,075 kB |

- `core.slot ... kind=blob`: the value is kept as given; text given to `fill` is quoted
  into a string value whatever it contains; it is not indexed (`_link`, `_unlink`,
  `_reindex` skip it); a pattern of a rule or deny that names the key is a `schema`
  violation, except `core.absent=<key>`; two values are the same only when equal. It
  is an ordinary value for marks, rewind, undo, forks, snapshots and queries (strings
  are shared, never copied, between forks).
- One choice differs from the task's wording: values are compared by length and then
  exact equality, not by a hash. A hash of a 1 MB string costs a pass over it every time
  it is computed (a string cannot carry a cached hash in JavaScript), and equality of
  two strings of equal length is the same pass without the chance of a collision.
- Telling a 1 MB string as text first cost 77 ms in the parser (a loop per character,
  and decoding that built the text one character at a time). The scanner now jumps to
  the next quote, backslash or line end inside a string, and a string without escapes
  is sliced; one with escapes is read by `JSON.parse` (the escapes are JSON's). Now
  5.5 ms. Every parser test passes unchanged.
- Test `slots: kind=blob keeps an opaque value as given, out of the indexes and of
  rules, and it undoes with the rest`. Documented in the core.slot entry of
  reference.md, with the reason and the bench figures.

## R6.5 — the variables of a refusal as data, and filters in reasons — done

`npm test`: 217 pass, 0 fail on sources and built file, 216 in checking mode. Pilot
output identical. `tsc --noEmit --strict src/index.d.ts`: no errors.

- A deny's violation (and an action guard's) has `vars`: its variables as data, strings
  as their text, plain numbers as numbers, without the ids of the matched wires (those
  stay in `bindings`, which is unchanged).
- `?n:name` in a reason writes the value through the filter `name`: `new World({ filters
  })` or `world.register('filter', name, fn)`, `fn(value, { world, name })` returns the
  text. No filter is built in, so no language is in the core; the test registers an
  English `ordinal` and `words`. A filter that is not registered is a `schema` violation
  of the rule. A colon not followed by a name stays text (`?n: too many`). The same
  filling applies to soft denies (their issue's `why`) and to guards.
- Test `violations: a reason writes values through registered filters, and carries the
  variables as data` ("the 2nd chapter is told twice (Rain, two)", `vars` `{ n: 2, t:
  'Rain' }`, the unregistered filter, the colon as text). Documented in the core.deny
  entry of reference.md, the violations section of semantics.md, `register` and the
  options in api.md, index.d.ts.
- A change a host may notice: a reason that wrote `?x:word` meaning the value followed
  by ":word" now names a filter; I found no such reason in the repository.

## R6.6 — core.aggregate: one result even over nothing, one per group with by= — done

`npm test`: 218 pass, 0 fail on sources and built file, 217 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

- `@n core.aggregate over=$t count=?c then=$all`: an aggregate with no pattern to anchor
  it. Without `by` there is exactly one result at all times (over nothing, `count` and
  `sum` are 0 and the others take `default=`); with `by=?s` one result per value of
  `?s` among the matches, and a value that no match has any more has none. The result is
  any aggregate by name (`count=?c`, `sum=?s args=?x`, ...) or `fn=` with `out=`.
- It compiles to a rule with no `when=` and one aggregating calc, so it is kept up to
  date by the existing aggregate machinery (the group is the `by` variables), fires once
  per distinct result, withdraws the old conclusion when the result changes, and has
  provenance (`via` = the aggregate's id).
- Note for hosts, now in the reference: a template that has every entry of an existing
  wire is that wire, so the templates of a total and of a per-kind tally should differ
  in type or in a key (my first test wrote both as `summary of=tasks count=2` and the
  total folded into a tally).
- Test `core.aggregate: one result even over nothing, one per group with by=, kept up to
  date, with no anchor wire`. Reference entry (all seven parts, the attribute table
  checked against `GRAMMAR` by the docs tests), S38 in semantics.md.

## R6.7 — core.rank: the position of a wire among its peers — done

`npm test`: 219 pass, 0 fail on sources and built file, 218 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

- `@r core.rank of=$c by=at within=?b out=?pos`, named in a rule's `with=`: the position
  (from 1) of the wire `$c` matched among its peers ordered by `at`, as numbers when
  both values are numbers, else as times or text, equal values in sequence order;
  `order=desc` for largest first.
- One addition to the task's syntax: `within=?v`. Which wires are peers cannot be read
  from the pattern alone: in `chapter book=?b at=?a` the book is the group, in `score
  player=?p points=?n` the player is the identity. So peers are the wires that fit the
  pattern's fixed values, and `within` names the variables they must share; every other
  variable is free. (My first version took all the pattern's variables as the group and
  ranked every score 1st.)
- It compiles to an aggregate over a copy of the pattern, so positions are kept up to
  date by the aggregate machinery: a new chapter moves the ones after it, a retracted
  one moves them back.
- Test `core.rank: the position of a wire among its peers ordered by a key, kept up to
  date` (grouped by book, a new peer, a retraction, no `within`, descending with ties,
  the schema error). Reference entry with its example; cited in S38.

## R6.8 — transient types; undo passes over them; redo — done

`npm test`: 220 pass, 0 fail on sources and built file, 219 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

- `core.type ... transient=true`: state that is looked at, not edited (a selection, a
  cursor). A statement (a tell, a fill, a patch) that only told or changed wires of such
  types does not count for `undo(n)` and is not taken back: after the undone statements
  are gone it is told again, where it still fits (a cursor on a line that is gone is
  dropped).
- `world.redo(n = 1)`: tells again, as the statements they were, what the last `n`
  undos took back. A new statement that is not transient makes the undo final; a
  transient one does not. If a statement cannot be told again, nothing is
  (`rewind` to a mark) and the result says why. New violation kind `nothing-to-redo`.
- Test `undo passes over transient state (a cursor, a selection); redo tells again what
  undo took back`. S24 (semantics, with the reason), reference (core.type), api.md
  (`redo`, `undo`), index.d.ts. The task mentions that `rewind` returns a function: it
  does not here (it returns the diff); `redo` is the first-class operation asked for.

## R6.9 — replace in place inside a patch — done

`npm test`: 221 pass, 0 fail on sources and built file, 220 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean. `tsc --noEmit --strict
src/index.d.ts`: no errors.

- `applyPatch({ replace: { id, attrs } })` (or a list): the told wire keeps its id and
  gets exactly the keys in `attrs` (missing keys are dropped, values with spaces or
  quotes are quoted); the wires that refer to it stay; what was derived from the old
  content is withdrawn and derived again from the new; with the patch's other parts,
  all or nothing. The result lists `replaced`; the id is not under `added`.
- `world.replace(id, text)` already kept the id when the new text did, but it rewrote
  the old statement in the log, so undo could not take it back. A replacement in a patch
  is logged as a statement of its own (`{ op: 'replace', id, wire }`), so undo takes it
  back (with the rest of its patch), redo tells it again, replay applies it, `told()`
  returns the new content, and retracting the wire later drops its replacements from the
  log.
- Test `patch: replace in place keeps the id and what refers to it, changes and drops
  keys, and undoes as one statement`. S59 (semantics, with the reason), applyPatch in
  api.md, `Patch` in index.d.ts.

## R6.10 — text functions: matches, contains, starts_with, ends_with, lower — done

`npm test`: 222 pass, 0 fail on sources and built file, 221 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

- Built-ins for `core.check` and `core.calc`: `matches(text, pattern, [n])` (in a check,
  whether it matches; in a calc, the match or its n-th group), `contains`,
  `starts_with`, `ends_with`, `lower`. A string argument is read as its text; a text
  result is a number token when it is one ("Chapter 3" gives chapter `3`, which compares
  as a number), else a string. Named like the other built-ins (`time_add`), hence
  `starts_with`/`ends_with` rather than the task's camelCase.
- Bounded patterns (`safeRegex`): at most 200 characters, no back-references, and no
  repeated group that can repeat or match nothing (`(a+)+`, `(a*)*`, `(a?)+`, `(|a)+`);
  texts up to 100,000 characters. The rule is conservative (it also refuses `(?:x+y)*`,
  which is safe); the reference says so and how to rephrase. A pattern written in the
  matrix is checked when the matrix is read (`schema`); one from a wire is checked when
  used, through `world.cannot`, so a query answers `unsupported` with the reason.
- Test `text functions: matches with a bounded pattern, contains, starts_with,
  ends_with, lower`. Reference: a "Text" table with an executed example (the docs test
  checks the function tables against `builtins` both ways).

## R6.11 — evaluate without telling: questions on the world plus a patch — done

`npm test`: 223 pass, 0 fail on sources and built file, 222 in checking mode. Pilot
output identical. `tsc --noEmit --strict src/index.d.ts`: no errors.

- `check(patch)` already evaluated rules and denies on the world plus a patch and changed
  nothing; what was missing was asking questions there. Now `check(patch, { query, ask })`
  returns the change result plus `answer` (what `query` gives on the world with the
  patch) and/or `rows` (what `ask` gives), and `query(q, { given: patch })` and
  `ask(patterns, { given: patch })` answer on that hypothetical world directly. A patch
  the world refuses gives `refused` with the violations. All of it runs in one
  transaction that is undone: the wires, the stamp and the log are as before.
- I used `given` on `query` and `ask` rather than adding `overlay: true` to `check`,
  since `check` already has that meaning and the questions are what is new.
- Test `patch: evaluate without telling: check(patch, { query, ask }) and query/ask with
  given answer on the world plus the patch`. S59, the check entry of api.md, index.d.ts.

## R6.12 — values of keys that nothing reads are not propagated — done

`npm test`: 224 pass, 0 fail on sources and built file, 223 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

`node bench/unread.mjs` (1,200 wires, a count per document and a deny that reads an
absence; a patch of 200 sets; median of 31 after a warm-up round), before (`git stash
push src`) → after: a key no rule reads (text) 6.85 → 1.47 ms; a key rules read (doc)
8.75 → 8.67 ms (unchanged, as it must be).

- The compiled matrix knows, per type, the keys that something reads: every key a
  pattern of a rule, deny, relation (compiled to rules), aggregate or rank names
  (`when`, `not`, `over`, `core.absent`), the keys of fluents and of effects on their
  events, identity keys, and the sequence key. `c.reads(type, key)` (with inheritance,
  cached). No new syntax.
- A value added to a key that is not read is validated (it stays in `_touched`) but the
  wire is not put on the agenda, so no rule is matched for it. A new wire is always
  propagated (a pattern without keys may match it).
- Test `patch: values of keys that nothing reads are validated but not propagated, with
  the same result` (no chase steps for the unread key, a domain violation still caught,
  a read key propagated, the world equal to its replay). S11a in semantics.md.

The reviewer's two notes for after R6.12 (rewind growing with size, defaults costing
about 1 ms each) come next.

## The reviewer's two notes after R6.12: rewind, and many defaults — done

`npm test`: 225 pass, 0 fail on sources and built file, 224 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

(a) Rewind. `node bench/fork.mjs`, before (`git stash push src`) → after, with a new
column for the rewind itself:

| wires | the same (mark + tell), after a rewind | the rewind |
| --- | --- | --- |
| 60 | 0.060 → 0.023 ms | 0.371 → 0.012 ms |
| 600 | 0.095 → 0.022 ms | 1.364 → 0.012 ms |
| 6,000 | 0.077 → 0.012 ms | 11.895 → 0.009 ms |

- The rewind compared the two worlds wire by wire (to return what it removed, added and
  changed), and rebuilt the set of all ids and copied the whole history twice. Now the
  events since the mark name what may have changed, and only those wires are compared
  (`_diffOf`). When the world was rebuilt as a whole since the mark (an undo, a
  retraction by replay: their events are marked `rebuilt`), everything is compared, as
  before. The history is extended as a copy-on-write list instead of copied.
- `diff()` and `tier()` read wires without making them a world's own copy (`_peek`);
  `diff()` used to copy every wire of a forked world into its layer.
- Test `cow: rewind names exactly what a full comparison names, after any mix of changes
  since the mark` (40 rounds of tells, fills, retractions, revisions, replacements,
  undos and transient-looking tells; each rewind's lists equal a full `diff`, and the
  world equals the mark).

(b) Many defaults. `node bench/complete.mjs`, `complete({ defaults })` filling 150
defaults: 88.7 → 24.7 ms (before R6.12's commit the figure was 130 ms; the reviewer
measured 160). Each round of `complete` tried every remaining optional default in a dry
run, but uses only the first that fits: now it stops at that one (the result is the
same: forced values still come first, and the list of pending defaults is computed in
full where it is returned).

## 0.7.0 — R6.1–R6.12 and the two notes released (version, changelog, rebuild; no tag) — done

`npm test`: 225 pass, 0 fail on sources and built file, 224 in checking mode.
`npm run test:browser`: all browser checks passed. Pilot 147/147, 212/217, 231/232,
output identical. `docs/version.md`: 0.7.0, build 7df4580b3a63, built 2026-11-11.
A minor version: new wire types (`core.aggregate`, `core.rank`), a new slot kind, and
two answers that change (`many` keys in value mode; `?x:word` in reasons).

Next: R6.13–R6.17.

## R6.13 — facts a host keeps: providers matched like wires — done

`npm test`: 226 pass, 0 fail on sources and built file, 225 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean. `tsc`: no errors.

`node bench/facts.mjs` (1,000 cities read by a rule and a deny; a turn is fork + one
delivery; second round): as wires, build 28.1 ms, a turn 0.029 ms, snapshot 113 kB; as
a provider, build 0.2 ms, a turn 0.026 ms, snapshot 1 kB. (Since P2 a turn no longer
grows with the table even as wires; the host's 37 ms was measured before it.)

- `new World({ facts: { city: (where, world) => [...] } })`: a pattern of that type asks
  the provider with the values it fixes and matches the facts it returns (`{ id, ...keys
  }` or `{ id, attrs }`) like wires, in rules, denies, aggregates, ranks, queries and
  `ask`. They are `told` for tiers, come before the world's wires in sequence order (by
  id), and are never stored, forked, logged or snapshotted; returned facts are kept by
  id for the life of the world.
- What a provider must guarantee, documented in api.md and S11b: pure and stable (a
  conclusion drawn from its facts is not re-examined), may return more than asked
  (patterns check every value), and bounded: each returned fact costs one budget step
  (site `match`), so a pattern that fixes nothing pages through the table under the
  budget. A rule needs a wire of the world to fire; provider facts alone start nothing.
- Test `facts: a host provider is matched by rules, denies and questions like wires, and
  never stored, forked or logged` (a rule, a deny, an aggregate over 500 provider facts,
  `ask`, `query` with tier `told`, nothing in the snapshot, a fork, the budget).

## R6.14 — world.sync: make a collection equal to a list — done

`npm test`: 227 pass, 0 fail on sources and built file, 226 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean. `tsc`: no errors.

- `world.sync('row', list)` or `world.sync({ prefix: 'ui.' }, list)`: compares the told
  facts of the type (with subtypes), or of the id prefix, with the list by id and builds
  one patch: new ids are told, changed ones are replaced in place (R6.9: the id and the
  wires that refer to it stay), equal ones are left, missing ones are retracted. All or
  nothing. Returns the change result plus `told`, `replaced`, `retracted`, `same`.
- One thing a host should know, in api.md: `undo` takes back what sync told and
  replaced, but, as for every retraction, not what it retracted (a mark does).
- Test `sync: a collection is made equal to a list in one transaction, and the delta is
  returned` (the delta, a referring wire kept, other types untouched, the same list
  again is a no-op, by prefix, a refused sync changes nothing). api.md (with an executed
  example), S59, index.d.ts.

## R6.15 — kind=json: structured values read by path — done

`npm test`: 228 pass, 0 fail on sources and built file, 227 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

- `core.slot ... kind=json`: the value is a string whose text is JSON, at most 10 levels
  deep and 100,000 characters (else `domain`). It is compared and indexed in one
  canonical form (keys sorted, no spaces), so the same object in another spelling is the
  same value (a restatement is accepted, an index lookup finds it).
- Patterns read into it by path: `center.lat=?lat`, `center.tags.0=?first`. The path
  entries are taken out of the pattern's keys (so the indexes are not asked for them)
  and checked after the rest of the pattern matched; a number or boolean is an atom
  (compared as a number: `9.190` matches `9.19`), a string a string, an object or array
  its canonical JSON. The base key counts as read for R6.12, so a revision propagates.
- Test `slots: kind=json holds a structured value that patterns read by path, compared
  in one spelling, within limits`. Reference: "Structured values", with an executed
  example.

## R6.16 — a host tells some keys as assumptions — done

`npm test`: 229 pass, 0 fail on sources and built file, 228 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean. `tsc`: no errors.

- Already there (H3): `tell(text, { tier: 'default' })` for a whole statement and
  `fill(id, key, value, { tier })` for one value; `assumptions()` lists them and a told
  value replaces them (checked again here).
- New: a tier per key in one statement: `tell('@c1 chart name=sales kind=bar', { tier:
  { kind: 'default' } })` tells `name` and assumes `kind`. The wire keeps the per-key
  tiers (`meta.keyTiers`); for a statement that merges into an existing wire each key's
  value carries its own tier. When a told value replaces such an assumption (by a later
  tell, a revise, or a fill), the value and what followed from it are withdrawn as for
  any assumption, and the logged statement is rewritten without it, so a replay gives
  the same world (my first version left `kind=bar` in the log and the replay conflicted).
- Test `tiers: a statement may tell some of its keys as assumptions; assumptions() lists
  them and a told value replaces them`. S28 (semantics, with the reason), tell in
  api.md, `ChangeOptions` in index.d.ts.

## R6.17 — ties in aggregates: ties=all added — done

`npm test`: 230 pass, 0 fail on sources and built file, 229 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

- Checked first: inside a rule, `argmax`/`argmin` gave only the first of the tied picks
  (the others were kept for queries, which answer `ambiguous`); `ties=first` only hid
  the tie. So a rule could not get every leader.
- Added `ties=all`: the result is every tied pick, in sequence order, as several values
  of the key the rule writes (as `collect` does); a query on a `many` key then answers
  with all of them (R6.1). `ties=` other than `first` or `all` is a `schema` violation.
- Test `aggregates: ties=all gives a rule every tied pick of argmax or argmin, as several
  values`. S41 (semantics), core.calc, core.aggregate and the aggregates table in
  reference.md.
- A trap found while writing the test, for the reviewer: in `@g game name=?g`, the
  variable `?g` is the same as the pattern's own binding `?g` (the matched wire's id), so
  the pattern can never match and nothing says why. Worth a `schema` warning; I have not
  added one, since it was not asked and a host might rely on `?p` meaning the wire.

## 0.7.1 — R6.13–R6.17 released (version, changelog, rebuild; no tag) — done

`npm test`: 230 pass, 0 fail on sources and built file, 229 in checking mode.
`npm run test:browser`: all browser checks passed. Pilot 147/147, 212/217, 231/232,
output identical. `docs/version.md`: 0.7.1, build 08e2627de8d4, built 2026-11-11.

Round 6 as written so far is done. Nothing is open in `questions.md`.

## R7.9 — namespaces, ownership of names, exports, ambiguity, the Scope chapter — done

`npm test`: 235 pass, 0 fail on sources and built file, 234 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean. `tsc`: no errors. Benches
unchanged (`bench/fork.mjs` 6,000 wires: fork + first tell 0.014 ms; the namespace
check costs nothing until some fact is in a namespace).

Separator: `::`, the user's answer to Q14 (`:` already meant a filter in reasons and was
part of clock times). The question went through questions.md; the user asked that from
now on questions go to the reviewer only.

1. **Fact namespaces.** `tell(text, { ns })`, `new World({ ns })`; also `applyPatch`,
   `sync`, the tells of an action, and the wire a query supposes. Ids become `ns::id`; a
   reference without a namespace points into the statement's namespace; `$other::x`
   reaches another, `$::x` the default one. One match of a rule, deny or question is in
   one namespace: a hidden binding carries the namespace through the match, so wires
   joined by a value must share it; a wire reached through a written reference may be
   in another. Identity merges only inside one namespace. `core.type ... shared=true`
   and facts from a host's provider belong to every namespace. Derived wires are named
   in the namespace of their match. `query`/`ask` take `{ ns }`. Snapshots, marks, forks
   and rewind carry it (the log holds the qualified ids). Parser: `::` is allowed once
   in an id or a reference; types and keys cannot carry it.
2. **Ownership of names.** A module loaded from the library (by `core.use` or
   `imports`) may declare types and slots only under its own prefix; otherwise a
   `schema` violation naming the module and the type (and the module whose prefix it
   is). Two examples in the docs declared unprefixed types in a module and were updated.
3. **Exports.** New `core.module name= imports= exports=` (and an `exports` field on a
   `core.schema.map as=module`). A rule or deny of another module may read only the
   exported types and their subtypes; the host's own matrix reads everything; a module
   without `exports` exports all its types, as before.
4. **Ambiguity.** After compiling, a short key that two modules declare along one type's
   lineage is a warning `ambiguous-key` with both qualified names.
5. **Scope.** docs/language.md section 12: seven statements (rule, question, statement,
   facts vs matrix, namespace, world, module), each citing its test; a docs test checks
   the citations. Section 11 (v1 → v1.1) gains a line for namespaces.

Tests (test/scope.test.mjs): `scope: a variable is local to its rule or question...`,
`scope: facts in different namespaces are never joined by value nor merged by identity;
written references and shared types cross`, `scope: a world given a namespace puts
every statement in it...`, `modules: ownership of names, exports, and a warning for keys
two modules declare`; the composition test now also checks ownership.

Limits stated in the docs: a `core.aggregate` with no anchor counts across namespaces;
anchor it (a rule over a wire of the namespace) to count within one.

## R7.1 — labelled marks, rewind of one unit, a timeline that can be saved — done

`npm test`: 236 pass, 0 fail on sources and built file, 235 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean. `tsc`: no errors.

- `mark(label)`; `world.marks()` lists the open marks, oldest first, as `{ label, seq,
  mark }`. A full rewind closes the marks made after the one it goes back to.
- `rewind(mark, { only: 'note' })` or `{ only: { prefix: 'ui.' } }`: the told wires of
  that type (with subtypes) or id prefix become what they were at the mark, the rest
  stays; it is a `sync` of that collection to the mark's told wires, so one transaction,
  replacements in place, and the same delta shape as a rewind.
- `toJSON({ timeline: true })` adds `timeline: { marks: [{ label, seq, log }], redo }`;
  `World.fromJSON` rebuilds each mark from its log and restores the redo stack, so after
  a restart `marks()`, `rewind` and `redo` work as before. A plain `toJSON()` is
  unchanged.
- Test `marks: labelled, listed, rewound for one unit only, and saved with the
  timeline`. S24, api.md (mark, marks, rewind, timeline), index.d.ts (`Mark`,
  `Snapshot.timeline`).

## R7.2 — refusals that rank and explain — done

`npm test`: 237 pass, 0 fail on sources and built file, 236 in checking mode.

- (a) `core.deny ... priority=1`: when a change breaks several denies, the refusal lists
  them by `priority` (lower first; denies without one after, in their old order). The
  violation carries `priority`. Named `priority`, not `rank=` or `order=`, since both now
  mean something else (`core.rank`, and `order=` on it); Q15 asks the reviewer to
  confirm, nothing waits on it.
- (b) `core.slot ... why="?value:quoted is not a square of the board"`: the slot's own
  reason for every value it refuses (kind, type, enum, bounds, cardinality, and a
  dangling reference under it), with the variables `value`, `key`, `id`, `type` as data
  (`vars`) and the filters of R6.5. The library's own text stays under `detail`.
- Test `violations: denies say which reason leads (priority=), and slots give their own
  reasons with variables`. Reference: both attributes in their tables.
- Correction: 95cabba was pushed with one docs test failing (the printed `GRAMMAR`
  example in api.md did not yet show `priority`). Fixed in the next commit; `npm test`
  237 pass, 0 fail on both builds, 236 in checking mode; pilot identical.

## R7.3 — integrity as slot kinds: kind=ref to=, unique= — done

`npm test`: 238 pass, 0 fail on sources and built file, 237 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

- `core.slot ... kind=ref to=room`: the value must refer to a wire of type `room` (with
  subtypes), refused with the slot's `why` if it has one (R7.2). A told wire whose
  `kind=ref` slot refers to another makes the retraction of that other refused
  (`dangling-ref`, "s1 still refers to r1") instead of spreading to it, which is what
  plain references (and `type=`) do. `to=` without `kind=ref` is a `schema` error.
- `unique=true` on a slot: no other wire of the slot's type (in the same namespace,
  unless the type is shared) has that value. `core.type ... unique=row unique=col`: no two
  wires share those values together. New violation kind `unique`, with `with` (the
  other wire).
- Test `slots: kind=ref to=<type> and unique= keep integrity without hand-written
  denies`. Reference tables (core.slot, core.type, kinds), the violations table.

## R7.4 — lists in reasons; distinct anchors; and a bug found on the way — done

`npm test`: 240 pass, 0 fail on sources and built file, 239 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

- A variable with several values (`collect`, `ties=all`) is now part of a reason: a
  filter receives it as one list (`?names:list` with a host's joiner gives "pen, ink and
  cap"), `vars` holds it as a list, and written without a filter its values are joined
  with ", ". Before, such variables were left out of `bindings` and `vars` and stayed as
  `?names` in the text.
- Distinct anchors: `core.aggregate ... by=?g` (R6.6) is already one result per distinct
  value. `node bench/distinct.mjs` (2,000 members in 50 groups): a count anchored on a
  member (one rule firing per member) 238 ms to load, 4.7 ms for one more member;
  `core.aggregate by=` 15 ms and 0.31 ms, the same 50 tallies. So no new construct: the
  reference now says that `by=` is the way, with these figures.
- **Bug fixed:** a deny over a group (an aggregate in a deny) was not checked when a
  member arrived if the matrix had no rule with negation, a selector or an aggregate:
  the groups were only noted for such rules. Found while testing lists; the refusal only
  showed up in `check()`. Now the groups are noted whenever an aggregate exists. Test
  `aggregates: a deny over a group is checked when a member arrives, also in a matrix
  with no rule at all`; S40 cites it.
- Test `violations: a variable with several values reaches a filter as one list`.

## R7.5 — lazy rules — done

`npm test`: 241 pass, 0 fail on sources and built file, 240 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

`node bench/lazy.mjs` (200 pieces, a rule making 4 lines per piece; a turn revises one
piece; second round): eager, a turn 0.86 ms, a question about the lines 0.04 ms; lazy,
a turn 0.01 ms, a question 8.77 ms.

- `core.rule ... lazy=true`: left out of the chase. `ask`, `query` and `check()` run all
  lazy rules to a fixpoint inside a transaction that is undone, then answer. A deny that
  reads what lazy rules make is checked the same way whenever a wire of a type it or the
  lazy rules read was touched, so refusals are exactly those of eager rules. What a lazy
  rule makes never stays. An eager rule that reads lazy output is a `schema` error (it
  would need them on every change).
- Honest limit, in the reference: a question runs all lazy rules, not only what it
  needs (no goal-directed evaluation), so the gain is for structures read by questions
  less often than about one change in ten, not for ones a deny reads on every change.
- Test `lazy rules: made only when a question, a check or a deny needs them, with the
  answers of eager rules` (60 random moves and pieces through a chain of two lazy rules
  and a deny: the same refusals and the same answers as an eager world; nothing stays).
  S11c, the core.rule entry of reference.md.

## R7.6 — pure actions: dropped, below noise — done

`node bench/pure.mjs` (600 wires; an action that reads no cell and tells one wire,
against the same tell made directly; median of 301, second round, two runs): the
action 0.0122 ms, the tell 0.0102–0.0103 ms, so the action's own cost is about
0.002 ms. The library has no assumptions pass in `act` to skip (the only place that
reads assumptions after a change is the retry of a refused tell, which a successful
action never reaches); the cost is the context object and the queue. A `pure=` flag
would save nothing measurable, so, as the task allows, the item is dropped and no
attribute is added. The bench stays in `bench/pure.mjs` so the host can compare with
what it measured.

## R7.7 — between, sign, clamp; the expr= proposal (Q16, no code) — done

`npm test`: 242 pass, 0 fail on sources and built file, 241 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean.

- Built-ins: `between(x, a, b)` (strictly between, whichever bound is larger; numbers,
  clock times, dates), `sign(x)` (-1, 0, 1), `clamp(x, lo, hi)` (with x's unit; no
  result when units differ). "Strictly between two squares" is now one check. Test
  `small functions: between, sign, clamp`; reference tables.
- `expr=`: proposed in questions.md as Q16 before any code, as the task asks: a bounded
  infix expression inside a string (so the lexer is unchanged), compiled into the same
  calc and check wires; the cost is a second notation and a second meaning for `=`
  (avoidable with `==`). Recommendation: no `expr=` for now, built-ins where a pattern
  recurs; option (b) if hosts keep writing long chains. Nothing waits on it.

## R7.8 — host API: assumptions(ids), a version to cache by — done

`npm test`: 243 pass, 0 fail on sources and built file, 242 in checking mode. Pilot
output identical. `node tools/scan-loops.mjs src`: clean. `tsc`: no errors.

- `assumptions(ids)`: only what the given wires rest on (dependants among them), with no
  pass over the world.
- `world.version`: the same in a world and a fork just made from it; unchanged by a
  statement that adds nothing (re-telling what the world holds), by a dry run and by a
  refused change; after any change (tell, fill, revise, retract, replace, patch, undo,
  sync) a number no world of the process had before, so two forks that change never
  share one; a rewind takes the mark's version. `stamp` stays as it was and is now
  documented as internal (it moves with every step and two forks may reuse a number).
- Test `version: the same in a world and a fork just made, unchanged by a statement that
  adds nothing, new after any change` (also checks `assumptions(ids)`). S61a, api.md
  (properties; tier and assumptions), index.d.ts. The API docs test now treats getters
  as properties.

## 0.8.0 — Round 7 released (version, changelog, rebuild; no tag)

A minor version: namespaces change the language (`::` in ids and references) and
modules that declare outside their prefix are now refused. Pilot 147/147, 212/217,
231/232, output identical. Next: Round 8, the design study (docs/design/formalization.md
and `world.score`).

## R8 — design study on formalization; `world.score` prototyped — done

`npm test`: 244 pass, 0 fail on sources and built file, 243 in checking mode. Pilot
output identical (`node compat/psys2/run.mjs`, timings stripped, diffed against
/tmp/pilot-before.txt). `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- `world.score(candidates)` (src/query.mjs): candidates are `{ wires, refer }`,
  `{ action, args }` or `{ question }`; each is judged in a transaction that is undone
  (each choice of ambiguous referents too, up to 50). Reports `ok`, `violations`,
  `referents` (`ids`, `unique`, `fits`), `lacks`, `assumes`, `action`, `answer`, and
  `order` (consistent, referents settled, fewer lacks, fewer assumptions, as given).
- Test test/score.test.mjs: seven candidates (a value outside the enum, a referent
  settled by the world, a default assumed, a referent nothing matches, a refused action,
  a missing argument, a question); order `[1, 6, 2, 5, 3, 0, 4]`; toSOP, version and log
  unchanged.
- `node bench/score.mjs` (300 items, 40 people, four kinds of candidate): 1 candidate
  0.26–0.31 ms, 10 candidates 1.17–1.57 ms, 100 candidates 5.87–6.50 ms (two runs);
  `node bench/score.mjs bundle`: 0.31, 0.96, 6.63 ms.
- docs/design/formalization.md: tool descriptions, `interpret(frame)` (design only),
  scoring and its order, what the library owns versus the host, limits and the tests
  that would prove the design. No syntax change; Q17 (`core.word`, recommend a single
  bookkeeping type) and Q18 (roles, recommend none for now) for the reviewer.
- api.md and index.d.ts document `score`. Released as 0.8.1 (package.json, src/index.mjs,
  CHANGELOG, docs/version.md); no tag.

## Answers to Q15–Q18 applied

Q15 (`priority=`) kept; Q16 closed (no `expr=` in v1.2); Q17 (b) and Q18 (a) taken into
R9.1. questions.md: the four moved to Closed. The reference table now says next to
`lazy=true` that it suits only structures rarely asked.

## R9.1 — core.word and world.interpret(frame) — done

`npm test`: 248 pass, 0 fail on sources and built file, 247 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- `core.word lang= text= means= of=` (a fact type, not a matrix wire): one wire, one
  meaning; `means` is an action, a type (declared, or one the world holds wires of), a
  `type.key`, or a value (an enum value, or any value with `of=`). A word whose `means`
  names nothing gives an `unknown-word` warning when told and when the matrix changes.
- `world.words(lang)` and `world.interpret(frame)` (src/interpret.mjs): a verb meaning an
  action gives `{ action, args }` (arguments placed by the param's position in the
  action's pattern), a type gives `{ wires, refer }` (slots that hold a wire get a
  described referent), `question: true` gives `{ question }`. Arguments without a word
  wire are read as entities by identifying keys or enum values spelled as is; others stay
  `unresolved`. A role word (`{ role: 'with', word: 'bob' }`) restricts the key. Each
  candidate carries `reading`, `used`, `unused`, `unresolved`. Identical readings are
  given once; at most `limit` (50), the rest counted in `dropped`.
- Tests test/interpret.test.mjs (4): two meanings of "book" give two candidates and score
  puts the order first when ink is out of stock (`order [1, 0]`); EN and RO frames give
  the same candidates; unknown words stay unresolved, and no value of any candidate of
  three mixed frames comes from outside the frame; unknown-word warnings, and words undone
  like facts.
- `node bench/interpret.mjs` (300 items, 40 people): interpret 0.039–0.063 ms a frame,
  score of its candidates 0.026–0.269 ms; `bundle`: 0.026–0.045 ms and 0.016–0.421 ms.
- Docs: reference.md `core.word`, api.md `words`/`interpret`, semantics.md warnings,
  index.d.ts, design doc status.

## R9.2 — ranking helpers: rank(scored, criteria), RANKING, an explanation per place — done

`npm test`: 250 pass, 0 fail on sources and built file, 249 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- src/rank.mjs: `RANKING` (consistent, referents left ambiguous, lacks, assumes, words left
  out), each `{ name, measure, say }`; `rank(scored, criteria)` returns `{ order, ranked }`
  with `place`, `why`, `lostTo`, `on`. Exported from the library.
- `score` ranks with it (option `criteria`) and puts `place`, `why`, `lostTo`, `on` on each
  candidate; candidates from `interpret` carry `words` (used, unused, unresolved) into the
  score. The referent criterion is now a count (was all-or-nothing); the R8 test order is
  unchanged.
- Explanations are against the winner ("why not this one"): e.g. `inconsistent: ink is
  out of stock; #1: consistent with the world`, `ambiguous: who could be p1 or p2 or p3;
  #1: every referent settled`; a tie says it is one.
- Tests (test/score.test.mjs, 2 new): explanations, the function and a host's own
  criteria (`actionsFirst` puts the action first), a tie; the referent criterion.
- `node bench/score.mjs`: 0.26 / 1.21 / 6.68 ms at 1 / 10 / 100 candidates (R8: 0.26–0.31
  / 1.17–1.57 / 5.87–6.50), so ranking adds no measurable cost.
- Docs: api.md (score fields, `rank` and `RANKING`), index.d.ts, design doc §3.

## R9.3 — segmentation candidates: splits of one message scored as wholes — done

`npm test`: 251 pass, 0 fail on sources and built file, 250 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- `interpret(frames)`: a list of frames is one split, a list of lists alternative splits;
  each candidate is `{ parts, split }` (one reading per frame, new wires `new1`, `new2`,
  ...), with the words of all parts (a frame with no reading leaves its words out).
- `score` of `{ parts }`: the parts in order in one transaction that is undone, each
  judged with the parts before it applied (its best choice of referents); consistent when
  every part is; violations, referents, lacks and assumptions marked `part`; `parts` holds
  each part's score.
- RANKING order changed: `words` now before `assumes`. With the given order the wrong
  split of "reserve the pen and order ink" (one frame, "ink" left out) beat the right
  one (which assumes the declared default qty=1). Q19 for the reviewer; one line to change
  back.
- Test `interpret: alternative splits of one message are scored as wholes; later parts
  see earlier ones`: the two-frame split wins (`order [0, 1]`, loser `on: words`); a
  second part's referent is the wire the first part made; version, log and wires
  unchanged.
- `node bench/interpret.mjs`: two splits of "book n17 and meet q3 on monday", 4
  candidates: interpret 0.108 ms, score 0.870 ms, the two-frame reading first.
- Docs: api.md (splits), index.d.ts (`parts`, `split`), design doc order.

## R9.4 — a generator sketch: world.examples(lang, templates) — done

`npm test`: 252 pass, 0 fail on sources and built file, 251 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- `world.examples(lang, templates, { per, all, sample })`: for each action, type and
  key that has a word, fills the host's template (a string with `{verb}`, `{args}`,
  `{<key>}`, or a function) with the slots and words; an argument with a key word is
  written `role word`. Values only from words and from names the world holds (`sample`
  per type); a number slot takes its declared `min` (or 1). Each example has `frame`
  (what a front end should give interpret) and `expect` (the reading it should give).
- Test `examples: ...`: nine RO sentences from the shop and calendar (actions,
  statements with a role word, questions with the host's template `cât {verb} are
  {args}?`); every one reads back through interpret to the reading it expects; a
  function template with `all: true` writes the qty number.
- `node bench/examples.mjs` (300 items, 40 people, 6 EN words): 8 examples in
  0.054–0.073 ms (two runs), 0.080 ms with `bundle`; all 8 read back with candidates.
- Docs: api.md `examples`, index.d.ts (`Template`, `Example`), design doc §4.

## 0.9.0 — Round 9 released (version, changelog, rebuild; no tag)

A minor version: `core.word` is new vocabulary and the default ranking order changed
(Q19). `npm test` 252 / 252 / 251 (sources, built file, checking mode). Pilot 147/147,
212/217, 231/232, output identical. Open for the reviewer: Q19.

## Q19 closed; R10.1 — near words (typos) — done

`npm test`: 253 pass, 0 fail on sources and built file, 252 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- A word with no reading (no word wire, no name the world holds, no enum value) is read
  through the nearest known words: edit distance with adjacent swaps (bounded, stops past
  the limit), at most 1 for words of 4 letters or fewer, 2 for longer, only the smallest
  distance found. Verb: words meaning an action, a type or a key. Argument: any word, enum
  values, values of identifying keys (kept per version). The schema then places them as
  any reading. Known words are never corrected; `near: false` turns it off.
- Candidates carry `assumes: [{ word, read }]`; score keeps them in `assumes`, rank says
  `assumes pne is pen`, so exact readings rank first (`on: 'assumes'`).
- Test `near words: ...`: verb and argument typos, a role-marked name and an enum word,
  exact first, the bounds (`oxk` stays unresolved; `ordxx` is read as order), and five
  frames of known words give identical candidates with and without near words.
- `node bench/interpret.mjs`: a verb typo 0.031 ms; a name typo among 300 names 0.363 ms
  (22 candidates: the synthetic names n0..n299 have many neighbours at distance 1).
- Docs: api.md (interpret, near words), index.d.ts.

## R10.2 — follow-ups and ellipsis — done

`npm test`: 254 pass, 0 fail on sources and built file, 253 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- `interpret(frame, { previous })`. A follow-up is a frame with no verb or no arguments,
  or marked by the host's front end `anaphor`, `correction` or `other` (the core does not
  detect pronouns: that is language). It inherits the previous frame's verb, question flag
  and words; its own words come first, so they take the slot (a correction blocks the
  inherited value even in a many slot; a plain follow-up adds there).
- `previous` is a frame, `{ frame, ids }` (for `other`: the referent becomes another wire
  of the same type, `refer.not: ids`, honoured by score), or `'told'`: the last told
  statement, read as `{ revise: { id, values } }`, a new candidate kind score judges with
  `revise` inside its undone transaction.
- Candidates carry `inherited: { verb, words, wire }` and `replaced`.
- Test `follow-ups: ...`: "no, red" replaces blue and keeps pen and the verb; many slot add
  versus correction; "and the price?" keeps pen and answers 2; "the other one" gives p1
  after p2; "tuesday" after a told meeting revises it, scored and not told; a full frame
  with `previous` reads exactly as without.
- `node bench/interpret.mjs`: follow-up (previous frame): 1 candidate, interpret 0.029 ms, score 0.128 ms, ok true
- `node bench/interpret.mjs`: follow-up (last told): 1 candidate, interpret 0.018 ms, score 0.027 ms, ok true

## R10.3 — loose words — done

`npm test`: 255 pass, 0 fail on sources and built file, 254 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- A frame `{ lang, words, numbers, question }`: each word that may be a verb (means an
  action, a type or a key, or is near one) is tried as the verb with the rest as
  arguments (`verbWord`); then each action and type with a word in the language as an
  implied verb with all the words (`implied`; kept only when it uses a word; not for
  questions). Identical readings once. Ranked by score and rank as any candidates (words
  used, then assumptions).
- Budget: a new site `interpret` (placements tried and verbs tried); `interpret` now runs
  under the budget like other calls and returns `{ candidates: [], budget }` when it runs
  out. `stats().sites` lists it (budget test updated).
- Test `loose words: ...`: "pen order 2" reads order first, reserve (implied) second on
  words; "bob monday meet"; "monday bob" by an implied meeting; "pen" alone: reserve,
  then order on assumes (qty); a question bag; a budget of 20 steps runs out; a frame with
  a verb gets no loose marks.
- `node bench/interpret.mjs`: loose ["n17","book"]: 2 candidates, interpret 0.150 ms, score 0.121 ms, steps 18
- `node bench/interpret.mjs`: loose ["q3","monday"]: 1 candidates, interpret 0.107 ms, score 0.068 ms, steps 14
- `node bench/interpret.mjs`: loose ["n17","q3","monday","book"]: 3 candidates, interpret 0.168 ms, score 0.247 ms, steps 30

## R10.4 — word forms — done

`npm test`: 256 pass, 0 fail on sources and built file, 255 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- `core.word` takes several `text=`: each is a form of the one word (`text=caiet
  text=caietul text=caiete`). `examples` writes a word in its first form.
- A host lemma function per language: `new World({ lemmas: { ro: fn } })` or
  `register('lemma', 'ro', fn)` (`'*'` for any). Contract: `fn(token, lang)` is pure,
  returns a form or a list of forms to look up, and knows nothing of the world. Order of
  lookup: the token's own word; else the lemma forms; else names and enum values; else
  near words. A known word is never lemmatized. No language in the core.
- Test `word forms: ...`: forms read to the same word; "pixul" is a near word (an
  assumption) without a lemma function and exact with one; a word whose own text is
  "pixul" wins over the lemma; English untouched; examples use the first form.
- Docs: api.md (constructor `lemmas`, `register('lemma')`, interpret word forms),
  reference.md (`text` repeatable, limits), index.d.ts.

## R10.5 — veto report — done

`npm test`: 258 pass, 0 fail on sources and built file, 257 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- `world.veto(result, { minWords, leftOut, criteria })` and the exported `veto`: for the
  top reading of `score`, `{ answer, index, reasons, ask, read }`. Reasons (field
  `reason`, not `kind`, since they are not violations): nothing, inconsistent (a refusing
  guard included, so it is not reported twice), no-referent, ambiguous, action-unavailable
  (an action the world does not have), words-left-out (more than `leftOut`, default 0),
  too-few-words (fewer than `minWords`, default 1), tie. `ask`: what the reading lacks
  with its question (a missing argument is a question, not a veto). `read`: near words
  ("I read X as Y").
- Tests (test/score.test.mjs, 2): an answer; ink out of stock; a word left out and
  `leftOut: 1`; a near word in `read`; an open referent; no reading; a missing argument
  asked; a tie; an unknown action.
- Docs: api.md (`veto`), index.d.ts (`Veto`, `VetoOptions`).

## 0.10.0 — Round 10 released (version, changelog, rebuild; no tag)

A minor version: new frame shapes (`words`), options (`previous`, `near`, `lemmas`), a
candidate kind (`revise`) and a budget site. `npm test` 258 / 258 / 257 (sources, built
file, checking mode). Pilot 147/147, 212/217, 231/232, output identical. No open
questions.

## R11.1 — delta snapshots — done

`npm test`: 259 pass, 0 fail on sources and built file, 258 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- `toJSON({ timeline: true, since: base })`: only the log after the base's log, with
  `base: { length, last }` (FNV-1a of the base's last entry); refused if this world did not
  grow from the base. Marks whose log is a beginning of the world's log are written as a
  position (`at`), in both modes; others keep their own log (`whole` when it does not start
  with the base).
- `World.fromJSON(data, { base })`: checks the fingerprint, forks the base, replays the
  rest once, and takes each mark as a fork when the replay reaches its position (no replay
  per mark). Snapshots in the old format (each mark its log) are still read.
- Test `snapshots: ...`: delta size and round trip, rewinds to both restored marks, the
  base untouched, a wrong or missing base refused, a mark an undo went past, the old format.
- `node bench/snapshot.mjs` (1,000-wire base; per turn a mark, a note, a revision), two
  runs: 8 turns: each mark its log 805.9 kB / 139.9–147.2 ms, marks at 90.5 kB /
  7.0–21.0 ms, delta 1.8 kB / 4.5–6.2 ms; 40 turns: 3789.5 kB / 301.0–311.7 ms, 97.4 kB /
  6.3–8.7 ms, 8.7 kB / 2.8–6.6 ms. `bundle`: delta 3.8 ms (8 turns), 2.4 ms (40 turns).
- Docs: api.md (toJSON options, fromJSON with base), index.d.ts.

## R11.2 — redo after a rewind — done

`npm test`: 260 pass, 0 fail on sources and built file, 259 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- `rewind(mark)`: when the mark is on the way of the log, the entries it takes back go on
  the redo stack as one group; `redo()` tells them again until the next statement (which
  clears the stack, as after undo). After an undo past the mark there is nothing to redo.
- `rewind(mark, { only })`: the sync is a statement (it clears older redo); then the
  statements that put the unit back as it was are computed on a fork and pushed, so
  `redo()` restores the unit.
- `redo()` no longer leaves an open mark behind (it used `mark()` internally; now a private
  fork), and a refused redo keeps the redo stack.
- Test `redo after a rewind ...`: rewind then redo of two statements; nothing more to redo;
  `only: 'note'` then redo; a statement after a rewind makes it final; a refused redo
  leaves world, stack and marks as they were.
- `node bench/fork.mjs` (rewind column, 60 / 600 / 6,000 wires): 0.0131 / 0.0099 / 0.0104
  ms, flat as before (0.009–0.015 ms in R6/R7).
- Docs: api.md (rewind and redo), the rewind doc comment.

## R11.3 — groups with zero members: `groups=` on core.aggregate — done

`npm test`: 261 pass, 0 fail on sources and built file, 260 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- `groups=` (repeated) with exactly one `by=` variable: values, or `$pattern`, the wires
  a matrix pattern matches (as `$id`, what a reference value is). Every declared group gets
  a body; an empty one gives `count` 0, or `default=` when given (for any aggregate). A
  group wire that arrives or goes seeds its group (a `groupsOf` entry beside the aggregate's
  over patterns), so its result comes and goes with it. Undeclared groups behave as before.
- The spelling `groups=$pattern` for "a type whose instances are the groups" is Q20 for
  the reviewer (keeps `$` as a wire of the matrix; a pattern can narrow the groups).
- Test `aggregate groups=: ...`: declared groups at 0 before any member; members counted;
  pattern groups with default; last member gone (group stays); group wire gone (result
  gone); a new group wire; an undeclared empty group still has none; two by variables
  refused.
- `node bench/distinct.mjs` unchanged in shape: by= 20.9–26.4 ms for 2,000 members, one
  more 0.26–0.38 ms (R6: 15–25 ms).
- Docs: reference.md core.aggregate (table, meaning, evaluation, violations, example).

## 0.11.0 — Round 11 released (version, changelog, rebuild; no tag)

A minor version: a new aggregate attribute (`groups=`) and new snapshot options.
`npm test` 261 / 261 / 260 (sources, built file, checking mode). Pilot 147/147, 212/217,
231/232, output identical. Open for the reviewer: Q20 (non-blocking).
