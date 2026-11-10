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
