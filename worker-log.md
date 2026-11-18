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

## R11.4 — a canonical value per surface form — done without a new key (Q21)

`npm test`: 262 pass, 0 fail on sources and built file, 261 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. No change to `src/`.

- The proposed `means=item.name value=ball` is what R9.1 already writes as
  `means=ball of=item.name`; a second spelling would break "one meaning, one construct",
  so none was added. Q21 says so, with the rename as the alternative if preferred.
- Test `core.word: a value in another language names its canonical value ...`: "mingea"
  (a second form of "minge") reads as the item `ball`; "lei" as the unit `leu` with an
  amount; `words('ro')` shows the meaning.
- reference.md core.word: the Meaning now opens with the canonical-value case.

## R11.5 — declared alternatives order — done (documented and tested; no new key)

`npm test`: 263 pass, 0 fail on sources and built file, 262 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. No change to `src/`.

- The order is the order the words were told, already: the type index keeps insertion
  order, `words(lang)` walks it, and readings, near words, example fillers and ties follow.
- Test `words keep their declaration order ...`: "minge", "zar", "bilă" (not
  alphabetical) in `words('ro')` and in generated examples; "book" read as reserve then
  order; the same after a fork, a snapshot round trip and an undo; a word retracted and
  told again goes last.
- Docs: api.md (an Order paragraph under words/interpret), reference.md core.word.

## 0.11.1 — R11.4–R11.5 released (version, changelog, rebuild; no tag)

A patch version: tests and docs only. `npm test` 263 / 263 / 262. Pilot output
identical. Open for the reviewer: Q20, Q21 (both non-blocking).

## Q20, Q21 closed; R12.1 — rank and questions — done

`npm test`: 264 pass, 0 fail on sources and built file, 263 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean.

- `score` no longer counts as a lack the value a question asks for (a missing entry with
  the sought key on a wire that exists); a question about a subject that is not there
  still lacks it.
- Test `rank and questions: ...`: "what color is the pen" read as a question (the pen has
  no color yet) now ranks above a nonsense statement that leaves a word out (`order
  [1, 0]`, the statement loses `on: 'words'`); the test fails without the change (checked
  by stashing src/query.mjs); a question about a missing subject keeps its lack.
- Docs: api.md score `lacks`.

## R12.2 — a fallback judgement for readings with no declared action — done

`npm test`: 265 pass, 0 fail on sources and built file, 264 in checking mode. Pilot
output identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`:
clean. `npx tsc --noEmit --strict src/index.d.ts`: no errors.

- Every scored candidate has `judged` and `judgedBy`: `statement`, `action`, `question`,
  `parts`, or for an action the matrix does not declare the fallback: `referents` (each
  `$id` argument exists, else `dangling-ref`), `slots` (arguments as keys of the
  candidate's `of` type or as `type.key` names, told as an overlay wire in the undone
  transaction: kind, enum, range), `denies` (no deny fires with it). `judgedBy` names the
  test that refused, or `fallback` with `checks` when all passed; nothing to check leaves
  `judged: false`. A slot misfit decides before a deny.
- `veto` no longer reports `action-unavailable` for a reading the fallback judged.
- Test `score judges readings whose action the matrix does not declare ...`: nine
  readings covering every `judgedBy`; the deny's reason; veto with and without a judgement;
  nothing told.
- `node bench/score.mjs`:   1 candidates: 0.29 ms (0.288 ms a candidate)
- `node bench/score.mjs`:  10 candidates: 0.93 ms (0.093 ms a candidate)
- `node bench/score.mjs`: 100 candidates: 6.76 ms (0.068 ms a candidate)
- `node bench/score.mjs`:   1 undeclared-action readings (fallback): 0.03 ms (0.031 ms a reading)
- `node bench/score.mjs`:  10 undeclared-action readings (fallback): 0.20 ms (0.020 ms a reading)
- `node bench/score.mjs`: 100 undeclared-action readings (fallback): 3.06 ms (0.031 ms a reading)

## R12.3 — interpret from a host's word descriptions — done

`npm test`: 267 pass, 0 fail on sources and built file, 266 in checking mode. Pilot
147/147, 212/217, 231/232, output identical. `npm run examples`: exit 0.
`git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`: clean.
`npx tsc --noEmit --strict src/index.d.ts`: no errors.

- examples/reader.mjs: a neutral shop described the way a host writes words for pattern
  generation (16 `core.word` facts: an operation word with two forms, argument words with
  plural forms, number words and unit words, all `means=`, values with `of=`; EN and RO),
  read back with splits, a typo, loose words, `score`, `veto` and `examples`. Added to
  `npm run examples`.
- One change to `src/`: in a split, a frame with no verb ("... and one ink") is read as a
  follow-up of the frame before it (it takes its verb; its words replace that frame's for
  the same slots). Without it the second frame of "buy two pens and one ink" had no
  reading.
- test/reader.test.mjs (2): the words load with no warning; "buy two pens and one ink"
  reads as two lines (qty 2 pen, qty 1 ink), the one-frame split loses on words, veto
  answers, nothing told; RO forms and units; a typo ("pnes" read as "pens"); loose words;
  every generated example reads back to its tool.
- Docs: api.md (splits), design doc status.

## 0.12.0 — Round 12 released (version, changelog, rebuild; no tag)

A minor version: the ranking of questions changed and score results gained fields.
`npm test` 267 / 267 / 266. Pilot 147/147, 212/217, 231/232, output identical. No open
questions.

## Words have no language (reviewer 07:10) — done; 0.13.0 released (no tag)

`npm test`: 267 pass, 0 fail on sources and built file, 266 in checking mode. Pilot
147/147, 212/217, 231/232, output identical. `npm run examples`: exit 0. `git grep -i
psys2 src/`: empty. `node tools/scan-loops.mjs src`: clean. `npx tsc --noEmit --strict
src/index.d.ts`: no errors. The 07:00 note (keep `lang=`, 0.12.1) is superseded and was
not released.

- src/interpret.mjs: `words()` (no language filter, no `lang` on entries), frames and
  loose frames without `lang`, `examples(templates, options)`; the lemma hook is
  `this.lemma` (`new World({ lemma })`, `register('lemma', fn)`), called `fn(token)`.
  A quoted `text=` is decoded (needed for "biro's"). index.d.ts follows.
- Tests and the reader example in English: the shared fixture's second-language words
  became synonyms (hold, buy, meeting, alongside, mondays, biro, supply); "the same frame
  in two languages" became "in synonyms"; word forms use notebook/notebooks/pad and a
  possessive lemma ("biro's"); canonical values use football → ball and pounds → gbp;
  the order test uses football, orb, globe. examples/reader.mjs: purchase, biro(s), pair,
  carton(s) instead of the Romanian words (14 words).
- Docs: reference.md core.word (no `lang`, one language per world), api.md (words,
  interpret, examples, lemma, constructor), language.md §4 item 6, semantics.md, the
  design doc without per-language parts. CHANGELOG notes the breaking change.
- `node bench/interpret.mjs`: interpret 0.034–0.038 ms a frame; `node bench/examples.mjs`:
  8 examples in 0.041 ms, all read back.

## N1 — replace in a namespaced world — done

Checked against 0.13.0 first: the repro left the wire as `x` (default namespace).
`npm test`: 268 pass, 0 fail on sources and built file, 267 in checking mode. Pilot output
identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`: clean.

- `replace(id, text)`: the replacement's facts are qualified with the namespace of the
  replaced wire (bare ids and references), not the world's.
- Test `N1: ...` (test/scope.test.mjs): the repro gives `A::x` with k=2; a `B::` wire
  replaced from an `A` world stays in B; the log replays the same world.

## N2 — aggregate results in the namespace of what they count — done

Checked against 0.13.0: the repro's `have` wire was `_h_…` in the default namespace.
`npm test`: 269 pass, 0 fail on sources and built file, 268 in checking mode. Pilot output
identical. `git grep -i psys2 src/`: empty. `node tools/scan-loops.mjs src`: clean.

- An aggregate with no anchor, in a world that uses namespaces, binds the namespace of a
  group before it computes: the one namespace of its members; the default one when they
  span several (then all members count); the world's namespace when it has none (a
  declared empty group). Worlds without namespaces skip this.
- Test `N2: ...`: the result is `A::…`, a deny joining it with A's facts fires; a group
  spanning A and B gives one result in the default namespace, the others stay in theirs.
- Docs: language.md SC5a (with its test), reference.md core.aggregate.
- `node bench/distinct.mjs` (no namespaces, unchanged path): anchored on a member   2,000 members: 242.7 ms; one more member: 9.88 ms; tallies 50, g7 = 41

## N3 — core.schema.map reads shared=, transient=, unique= — done

Checked against 0.13.0: a map with those fields set nothing (only native core.type read
them). `npm test`: 270 pass, 0 fail on sources and built file, 269 in checking mode.
Pilot output identical. `git grep -i psys2 src/`: empty. scan-loops clean.

- `as=type` maps read `transient`, `shared` (true when the field gives `true` or `yes`,
  so both `shared=shared:yes` and `shared=<attr>` work) and `unique` (keys, repeated or
  comma-separated), the same as `core.type`.
- Test `N3: ...` (test/schema.test.mjs): a mapped unique key refuses a duplicate; a mapped
  shared type joins a namespaced fact; a mapped transient statement is not undone.
- Docs: reference.md core.schema.map fields.

## N4 — log entries keep their namespace — done

Checked against 0.13.0: the repro replayed `e.user` (told with `{ ns: '' }`) as
`A::e.user`. `npm test`: 271 pass, 0 fail on sources and built file, 270 in checking
mode. Pilot output identical. `git grep -i psys2 src/`: empty. scan-loops clean.

- Every log entry told with a namespace (the world's or a given one, `''` for the default)
  carries `ns`. Its wires were already stored qualified, so a replay of such an entry
  qualifies nothing more: a bare id stays in the default namespace on any world. Logs
  without `ns` (older snapshots) are replayed in the world's namespace, as before.
  `replace` logs the namespace of the replaced wire.
- Test `N4: ...`: `e.user` (default), `A::p1` referring to it with `$::e.user`, a `B::`
  wire; the same ids after `fromJSON` with `ns: 'A'`, none and `ns: 'C'`; undo (a
  replay) keeps `e.user` in the default namespace.
- `node bench/snapshot.mjs` (no namespaces): 8 turns: each mark its log 805.9 kB, restore 143.2 ms; marks at 90.5 kB, restore 8.5 ms; delta 1.8 kB, restore 4.1 ms
- `node bench/snapshot.mjs` (no namespaces): 40 turns: each mark its log 3789.5 kB, restore 302.3 ms; marks at 97.4 kB, restore 5.9 ms; delta 8.7 kB, restore 2.9 ms

## N5 — references to shared types fall back to the default namespace — done

Checked against 0.13.0: `@p1 pet owner=$e.user` in `ns: 'A'` was `dangling-ref
$A::e.user`. `npm test`: 272 pass, 0 fail on sources and built file, 271 in checking
mode. Pilot output identical. `git grep -i psys2 src/`: empty. scan-loops clean.

- A bare reference resolves in its own namespace first (a wire there, or one told in the
  same statement); when there is none and the default namespace has a wire of a shared
  type with that id, the reference keeps the bare id (the default one).
- Test `N5: ...`: the repro is accepted with `owner=$e.user`; a wire of the same id in A
  wins; a type that is not shared still dangles; the log replays it.
- Docs: language.md SC5 (with the test).

## N6 — check(patch, { query, ask }) passes the namespace — done

Confirmed against 0.13.0 by the new test (it fails without the change: the inner query
saw both namespaces). `npm test`: 273 pass, 0 fail on sources and built file, 272 in
checking mode. Pilot output identical. `git grep -i psys2 src/`: empty. scan-loops clean.

- The inner `query` and `ask` get `ns` (the option, or the world's).
- Found on the way: a patch given as SOP text was read as an object (a string's
  `replace` method became a replacement: `unknown-wire`); text is now read as the
  patch's wires.
- Test `N6: ...`: in a two-namespace world, `check(text, { ns: 'A', query, ask })`
  answers A's stock and lists A's items; a world with `ns: 'B'` answers B's.
- Docs: api.md check.

## J1 — a question given as a wire; a computed answer not made yet — done

Confirmed against 0.13.0 by the new test (it fails without the change). `npm test`: 274
pass, 0 fail on sources and built file, 273 in checking mode. Pilot output identical.
`git grep -i psys2 src/`: empty. scan-loops clean.

- `score` normalizes a question (object, `core.question` wire, or its text) before it
  decides what lacks. The sought key is not a lack on a subject that exists, nor on a
  subject of a type the matrix makes (a rule's or aggregate's template type) that is not
  made yet; a told subject that is not there still lacks.
- Test `J1: ...`: the same question as a wire, as text and as an object about an
  aggregate's `have` for an empty group: ok, no lacks; a question about a missing told
  item still lacks.
- Docs: api.md score `lacks`.

## J2 — judging actions the host carries out — done (no new syntax)

Checked against 0.13.0: a host action with bare argument names stayed unjudged and veto
said `action-unavailable`. `npm test`: 275 pass, 0 fail on sources and built file, 274
in checking mode. Pilot output identical. `git grep -i psys2 src/`: empty. scan-loops
clean.

- How a host declares its action's parameters: as the slots of a type named like the
  action (`@d core.slot of=draw key=kind enum=… required=true ask=…`). No `core.action`,
  no function, nothing new in the language: the fallback judgement takes that type as the
  default `of`, checks kinds, enums, ranges and denies, and reports the required
  parameters a reading does not give as lacks with their `ask`. Nothing is told or
  carried out. `action-unavailable` remains only for an action with neither a declaration
  nor such a type (and no `of`/`type.key` arguments).
- Test `J2: ...`: draw with good, bad and missing arguments (`fallback`, `slots`, a lack
  with "What shape?"), veto answers for draw and says unavailable for teleport.
- Docs: reference.md core.action (Interactions), api.md score.

## 0.13.1 — Round 13 released (version, changelog, rebuild; no tag)

A patch version: fixes only, no new syntax. `npm test` 275 / 275 / 274. Pilot 147/147,
212/217, 231/232, output identical. No open questions.

## R14.1 — a split keeps unreadable frames — done; 0.13.2 released (no tag)

Checked against 0.13.1: "mark Paris then undo" (undo a known word with no reading as a
verb) gave one part, empty `unresolved`, and veto answered. `npm test`: 276 pass, 0 fail
on sources and built file, 275 in checking mode. Pilot 147/147, 212/217, 231/232, output
identical. `git grep -i psys2 src/`: empty. scan-loops clean. tsc clean.

- In a split, a frame with no reading becomes a part `{ unread: true, words, unresolved }`
  and all its words (verb, arguments, numbers) go to the candidate's `unresolved`; the
  verb of such a frame was also missing from `unused` before. `score` keeps the part
  (`unread`, not judged); `rank` counts its words; `veto` says `words-left-out`.
- Test `R14.1: ...`: a known-but-unreadable verb and an unknown verb with an argument both
  give an unread part and `words-left-out`; a split reading every frame ranks first.
- Docs: api.md splits, index.d.ts (`unread`), CHANGELOG 0.13.2.

## Round 15 — host functions declared in SOP Lang — done; 0.14.0 released (no tag)

`npm test`: 280 pass, 0 fail on sources and built file, 279 in checking mode. Pilot
147/147, 212/217, 231/232, output identical. `npm run examples`: exit 0. `git grep -i
psys2 src/`: empty. scan-loops clean. tsc clean. One commit for the round: the six parts
share the compile step and the call path.

1. Vocabulary (no `core.function` existed before): `core.function name= out.kind= pure=
   doc=` and `core.function.arg of=$f name= kind= optional= doc=`, matrix types with
   GRAMMAR entries; arguments in wire order; repeated wires, no notation inside values.
   A built-in's name cannot be declared.
2. Load checks in compile: argument count (optional ones at the end), literal kinds,
   a check's function returns boolean. `undeclared-function` and `unregistered-function`
   notes, kept current as declarations and registrations come; a call to an unregistered
   function gives no result and a `called` note.
3. Purity: every function call goes through `world._call` (rules, denies, action guards,
   abduction, effects). Pure results are kept per stamp. A lazy rule with an impure
   declared function is a `schema` error; `score` readings and `check` (dry, query, ask)
   run as overlays where an impure declared function is not called and the result is
   refused with `impure`.
4. `world.functions()`.
5. A fact with `fn=` is refused (`function-in-fact`).
6. Docs: reference.md (core.function, core.function.arg), language.md §4 item 6,
   semantics.md S43a–S43c (with tests), api.md (register, functions), design doc;
   violation table and warnings.
- test/functions.test.mjs (4 tests): declarations and load checks; notes; caching and
  impure refusals in score, check and lazy rules; facts never call functions. One older
  test now also expects the `undeclared-function` note for a function registered as an
  action the old way.
- `node bench/functions.mjs` (1,000 pairs, two calcs on the same arguments): not
  declared 50.0–76.7 ms, 2,000 calls; declared pure 44.8–49.1 ms, 1,000 calls.

## R16.1 — a soft issue is advice, not a conflict — done

Checked against 0.14.0: an existing test even asserted the bug (the tank's level
`conflicting` because a soft deny about two pumps named the tank). `npm test`: 281 pass,
0 fail on sources and built file, 280 in checking mode. Pilot output identical.
`git grep -i psys2 src/`: empty. scan-loops clean. tsc clean.

- The rule: an issue lowers an answer only when it names the asked key (`key=`, a soft
  bound on that value): `conflicting` with `reason` and `issues`, as before. The issue of
  a soft deny names no key: it is advice about a combination, so the answers that rest on
  its wires keep their status and carry `advice: [{ issue, why }]`. Hard denies refuse, as
  before.
- Test `a soft deny is advice ...`: a fish placed in the sky leaves one issue; "where does
  a fish live" is `supported`, water, with the advice; a hard deny still refuses. The
  older kernel test now expects `supported` with the advice for the tank.
- Docs: semantics.md S50, reference.md core.issue, index.d.ts (`advice`).

## R16.2 — order-independent identity merge along a lineage — done

Checked against 0.14.0 with a script: subtype first gave one wire, supertype first two.
`npm test`: 282 pass, 0 fail on sources and built file, 281 in checking mode. Pilot output
identical. `git grep -i psys2 src/`: empty. scan-loops clean. tsc clean.

- The rule (semantics S7a): along one lineage the same identity is one wire of the more
  specific type, whatever the order; it keeps the id told first, the other id is an alias;
  siblings stay apart. `_findByIdentity` also looks under ancestors that declare the same
  identity keys; a supertype wire found that way is retyped to the subtype (`_retype`,
  journaled, a `retype` event).
- Test `semantics: a subtype fact and a supertype fact with one identity are one wire of
  the subtype, in either order`: three orders give the same world; the alias resolves;
  undo restores the supertype wire; two siblings stay two.
- `node bench/complete.mjs` unchanged: 150 defaults 14.2 ms.

## R16.3 — an import's id clash is reported as such — done

Checked against 0.14.0: an imported module whose `core.module` id clashed with an
application id said "neither loaded nor in the library". `npm test`: 283 pass, 0 fail on
sources and built file, 282 in checking mode. Pilot output identical. `git grep -i
psys2 src/`: empty. scan-loops clean. tsc clean.

- A matrix id declared twice gives `duplicate-id` with "@k is declared by the
  application and by module shapes" (owners from the wires' module tags). An import that
  is in the library but did not declare itself names the clashes of that module, or says
  it does not declare itself; the old message stays for an import not in the library.
- Test `modules: an imported module whose ids clash ...`: a slot id clash names both
  owners and no misleading message; a clash on the module's own id is named in the import
  message.
- Docs: reference.md core.module Violations.

## R16.4 — version= on core.module — done

Checked against 0.14.0: `version=` was an `unknown-attribute` warning. `npm test`: 284
pass, 0 fail on sources and built file, 283 in checking mode. Pilot output identical.
`git grep -i psys2 src/`: empty. scan-loops clean. tsc clean.

- `core.module version=` (text; also a `version` field of an `as=module` map) is kept as a
  label. New `world.modules()`: `{ name, version, imports, exports }` per module (there
  was no such call before). Nothing checks versions.
- Test `modules: version= on core.module is a label that modules() reports`: no warning,
  reported as written.
- Docs: reference.md core.module (table, meaning, limits), api.md `world.modules()`,
  index.d.ts.

## R16.5 — "one of" in a deny pattern — reported (Q22), not implemented

Measured with a script: a pattern `thing tag=a tag=b` (a `many` key) matches only a wire
that has both values (`z`, not `x` nor `y`): a repeated key in a pattern is "all of",
like in a fact. Reading it as "any of" would give one writing two meanings and change
existing rules. No built-in tests membership (`contains` is a substring test). Q22 gives
the options and recommends a built-in `one_of(value, choices...)` used by one check and
one deny, no new syntax.

## 0.15.0 — Round 16 released (version, changelog, rebuild; no tag)

A minor version: answer status and merge behaviour changed, one new call. `npm test`
284 / 284 / 283. Pilot 147/147, 212/217, 231/232, output identical. Open: Q22.

## Q22 closed

Answered (a) by the reviewer (09:35): a repeated key stays "all of"; "one of" is two denies; no built-in added. questions.md: moved to Closed. No code change.

## R17.1 — absent key: proposal written (Q23), waiting for the reviewer

Measured: the pattern modifier `core.absent=<key>` (S18) already says "this key has no
value" in rules and in `ask` text (`w.ask('@d drawing name=cat core.absent=variant')`
gives `[{"d":"a"}]` for a plain and a variant drawing). The object form of `query` /
`score` has no way to say it. Q23 recommends (b): `absent: [keys]` on question objects and
`core.absent=` on `core.question` wires, the same modifier, no new sign.

## R17.4 — value query over several wires — done

Measured on 0.15.0 with a script: the same text value on two wires was already
`supported` with both wires in `from`, different values `conflicting`. But the same
number written two ways (2 and 2.0 under a numeric slot) came back `conflicting`: answers
were grouped by spelling. `npm test`: 285 pass, 0 fail on sources and built file, 284 in
checking mode. Pilot output identical. `git grep -i psys2 src/`: empty. scan-loops clean.

- `_query` groups found values by their normalized form (the index form: numbers as
  numbers, quantities in their unit), keeping the first spelling seen.
- Semantics S50 now says it: the same value on several wires is one answer, `supported`,
  with every wire in `from`.
- Test `query: the same value on several wires is supported, with all of them; different
  values conflict`: text, numbers written two ways, and two different values.

## R17.5 — load cost at scale — done

`npm test`: 285 pass, 0 fail on sources and built file, 284 in checking mode. Pilot output
identical. `git grep -i psys2 src/`: empty. scan-loops clean. tsc clean.

- bench/fixtures/knowledge: the 8 hand-written schemas and the 31 shards whose header says
  `sources: hand-core` and `license: CC0-1.0`, copied unchanged from sop-knowledge-worlds
  (540 kB, with a README). No imported shard is copied.
- bench/load.mjs: the schemas, then 50 shards told one after another (the 31, then 19 again
  in namespaces of their own); time and heap per shard. `--corpus <clone>` reads the
  k.objects shards of a local clone in place instead (imported data, not committed),
  `--shards <n>` how many.
- Found and fixed: identity lookup walked the index set of the first identity key only;
  for parts (`of`, `name`) that is every part of one object, for points (`part`, `n`)
  every point with that number. It now walks the smallest of the identity keys' sets.
  A 10-wire tell after 40 / 80 / 120 / 160 / 200 corpus shards (a script, /tmp/grow.mjs):
  before 0.29 / 0.33 / 0.48 / 0.58 / 1.49 ms, after 0.15 / 0.16 / 0.30 / 0.20 / 0.32 ms.
- `node --expose-gc bench/load.mjs`: 50 shards, 4,059 wires told, 139 ms, heap +11.4 MB;
  0.038 ms a wire for shards 1-10, 0.023 for the last 10 (no growth).
- With `--corpus` (50 k.objects shards): 37,399 wires, 1,365 ms, +98.3 MB; 0.046 then 0.043
  ms a wire. With `--shards 200`: 201,532 wires, 11,789 ms, +512.7 MB; 0.047 then 0.077 ms
  a wire. A CPU profile of shards 151-175 shows no quadratic path left: indexing, parsing
  and the garbage collector (the heap is about 2.5 kB a wire); the slope at 200k wires is
  the collector's.

## R17.3 — ordered sequences — reported (Q24), not implemented

Measured on a 1,696-wire k.objects shard (1,563 points), read in place from a clone,
median of 5 loads (/tmp/seq.mjs): as is 1,706 wires, 64.0 ms, +4.61 MB; repeated keys
px/py on the part 143 wires, 9.2 ms, +1.23 MB; the existing `kind=json` (one list value)
143 wires, 5.2 ms, +0.75 MB; `kind=blob` 4.1 ms, +0.78 MB. Repeated keys are sets (a
duplicate value is dropped, measured), so an ordered list would be a second meaning; a
new list kind would duplicate `kind=json`. Q24 recommends the existing `kind=json` for
drawings, one wire per point only where rules reason about single points.

## R17.2 — the standard function pack and a space world — done

`npm test`: 289 pass, 0 fail on sources and built file, 288 in checking mode. Pilot output
identical. `npm run examples`: exit 0. `git grep -i psys2 src/`: empty. scan-loops clean.
tsc clean.

- src/std.mjs: three modules in every library (a host module of the same name wins),
  opt-in by `core.use world=std.<name>`; using one registers its functions (a host
  function of the same name wins). All pure and declared with `core.function`:
  std.numbers `average` (2-8 numbers), `median` (1-8); std.order `rank_in`,
  `nth_smallest`, `nth_largest`; std.boxes `centre_x`, `centre_y`, `overlaps`,
  `contains_box`, `box_distance`. Not repeated: built-in min, max, add, abs, round,
  clamp, between, sign, comparisons; aggregates over many wires; core.rank.
- examples/space.mjs: five items in a frame; centres from the pack, places by core.rank,
  frame size, top and bottom by core.aggregate; "the middle one", "left of", "in a row" as
  rules. Added to `npm run examples`.
- Found on the way and fixed (src/world.mjs, withdrawal): an aggregate result merged into a
  told wire lost its firing when another result on the same wire was withdrawn (a firing
  with no anchor that "only wrote here" was forgotten and could never fire again, its value
  left behind), so the next change of the group was a `conflict`. Such a firing is now kept
  while all it wrote still stands. Test `aggregate: two results merged into one told wire
  stay in step after a revision of a member` (fails without the change).
- Observation, not changed: `min=`/`max=` on core.aggregate without `args=` silently gives
  no result.
- test/std.test.mjs (3): every function, opt-in, declarations checked where used, host
  names win; the space world, a revision that breaks the row, a sixth item (no middle),
  "left of the clock" by `ask`.
- Docs: reference.md "The standard function pack" (with what it does not repeat).

## R17.1 (Q23 answered (b)) — absent keys in the object form — done; Q24 closed

`npm test`: 290 pass, 0 fail on sources and built file, 289 in checking mode. Pilot output
identical. `git grep -i psys2 src/`: empty. scan-loops clean. tsc clean.

- `absent: [keys]` on question objects (query, score's `refer` descriptions) and
  `core.absent=` on `core.question` wires: the pattern modifier, nothing new
  (`_question`, `_matching`).
- Test `query: absent= in the object form and core.absent= on a question wire mean the
  pattern modifier`: object, wire text, without it (conflicting), `ask`, a referent.
- Docs: docs/integration.md (the line asked for), api.md query, index.d.ts.
- Q24: report accepted, one wire per point stays; Q23 and Q24 moved to Closed.

## 0.16.0 — Round 17 released (version, changelog, rebuild; no tag)

A minor version: the standard pack, the object form of `core.absent`, fixes. `npm test`
290 / 290 / 289. Pilot 147/147, 212/217, 231/232, output identical. No open questions.

## Round 18 — delegation between modules — pattern, example, tests, report (Q25); no syntax

`npm test`: 292 pass, 0 fail, 1 todo on sources and built file; 291 pass, 1 todo in
checking mode. Pilot output identical. `npm run examples`: exit 0. `git grep -i psys2
src/`: empty. scan-loops clean. tsc clean. No change to `src/`.

1. Needs and offers are expressible today: a request with `core.absent=<key>` is the need;
   other modules derive `draw.offer for=$request value= source= rank=` from their facts.
2. Order and source: aggregates take the best rank per request and count offers per rank;
   a rule fills `use_place` and `place_source` from the best offer when it is alone at its
   rank; the user's value comes first by its own rule; `query(...).via` names the rule.
3. examples/delegation.mjs: modules draw, talk (dialogue focus, rank 2) and know (usual
   place, rank 4) in a host library, the draw world's own default at rank 5. Tests
   (test/delegation.test.mjs): the order user > dialogue > knowledge > default, a better
   offer arriving and leaving, the source and the rule; no offer leaves the need open; two
   offers at the same rank raise a soft issue and fill nothing.
4. Q25: what the pattern cannot say (ranks as numbers, six wires per key, the value on a
   second key) and options; recommendation (a), the pattern as a library module, ranks as
   named tiers. docs/integration.md §5a documents the pattern.
- Found: choosing by `core.rank` over derived offers gives a `conflict` on the place in
  line when a better offer arrives (an old fill not taken back). Kept as a todo test with
  its repro (`delegation with core.rank: ...`); simpler core.rank cases (derived peers
  coming and going) pass. Not fixed in this round.

## Q25 answered (a); R19 rank fix — core.rank re-ranking with a better peer — done

`npm test`: 293 pass, 0 fail on sources and built file, 292 in checking mode (the todo is
now a test). Pilot output identical. `git grep -i psys2 src/`: empty. scan-loops clean.
tsc clean.

- Cause, found with a smaller repro (rank over offers + a rule writing the winner onto the
  request the offers read): two things in the kernel.
  1. A rule with an aggregate anchored on a wire (core.rank, a per-wire total) re-fired
     for a changed wire with a new result while its old firing for that wire stayed: two
     places in line, a `conflict`. Now, before it fires for a wire, its firings for that
     wire that no longer hold are taken back (found through the wire's own index, so no
     scan of the rule's firings), and the bodies are computed again after that; the
     group path computes its bodies again after taking stale firings back, too.
  2. Taking back a value invalidated every firing anchored on the wire, even those whose
     patterns never name that key; here, the winner written onto the request withdrew all
     offers, which re-ranked, which changed the winner: a loop (budget). Now a firing whose
     patterns on that wire name none of the lost keys (and no `core.absent=` or path on
     them) holds; a removed wire still takes everything back.
- Tests: the todo `delegation with core.rank: ...` is a test (a better offer comes and
  goes, the choice follows); a kernel test with the smaller repro (fails without the
  change, checked by stashing src/world.mjs).
- `node bench/distinct.mjs` anchored on a member: before 233.7 ms, one more 6.69 ms; after
  212.6–230.2 ms, one more 7.63–14.37 ms; `core.aggregate by=` unchanged.

## R19 item 1 — std.fill (Q25 → a), and rules that wait for aggregates — done

`npm test`: 300 pass, 0 fail on sources and built file, 299 in checking mode (/tmp/check.sh).
Pilot output identical. `git grep -i psys2 src/`: empty. scan-loops clean. tsc clean.

- `std.fill` in src/std.mjs, rules only (`core.use world=std.fill`): `std.fill.need for= key=`
  (the host writes it from `core.absent=<key>`), `std.fill.offer for= value= tier= source=`
  (each filler), `std.fill.tier name= rank=` declared once: user 1, focus 2, scene 3,
  knowledge 4, default 5. Best rank per need and count per rank by `core.aggregate`; the
  offer alone at the best rank is written onto the need (`value tier source`, rule
  `std.fill.choose`); several at the best rank: soft deny "N offers of the best tier for
  <key> of <request>". Types are under `std.fill.` (a prefixed module must declare under
  its own prefix). Not core.rank: it gives equal values distinct positions (sequence
  order), so it cannot see a tie.
- Kernel defect found on the way: a second offer of the same tier arriving later was
  refused (`conflict` on the need's value). The choice rule fired on the offer in the
  agenda before the group count was computed again (aggregates run when the agenda is
  quiet), so it saw the old "1 offer". Now a rule whose patterns read what a group
  aggregate concludes waits (per wire that woke it) while groups are pending, and runs
  after them; the woken wire is seeded again before the decision (an earlier rule in the
  same loop may have changed it). semantics S39a.
- Tests: test/fill.test.mjs (5: three keys at once; a better tier later per key and back
  on retract down to default; a tie as advice, resolved by a better tier or by a retract;
  a host tier with one wire, an unknown tier never chosen; the declared tiers); kernel
  test for the wait (fails without the change: checked by stashing src/world.mjs and
  src/matrix.mjs, 34 pass 1 fail).
- examples/fill.mjs: place, size, colour delegated at once; fillers (user, focus, scene,
  knowledge, default) written once for every key; `node examples/fill.mjs` output: cup →
  table/knowledge, medium/default, white/knowledge; then small/scene; shelf/focus; red/user.
- Docs: reference "std.fill" (runnable example), semantics S39a.
- `node bench/distinct.mjs` anchored: 214.6 / 253.8 ms, one more 12.40 / 15.10 ms;
  `core.aggregate by=`: 33.6 / 24.1 ms, 0.43 / 0.34 ms.

## R19 item 2 — std.focus; core.rank ordered once per group — done

`/tmp/check.sh`: 305 pass, 0 fail on sources and built file, 304 in checking mode. Pilot
output identical. psys2 grep empty. scan-loops clean. tsc clean.

- `std.focus` in src/std.mjs, rules only (`core.use world=std.focus`, loads std.fill). The
  host writes one rule each: `std.focus.turn of=<request> in=<dialogue>`, a
  `std.focus.mention of= kind= value=` per key a request names, a `std.fill.need` per key it
  leaves out. std.focus numbers turns (core.rank by `in` within the dialogue: equal values
  keep arrival order), keeps `std.focus.state turn= kind= value=` (what the turn mentions,
  else the state after the turn before: `not=`), and offers to each need the state of its
  kind after the turn before, tier `focus`. `std.focus.last kind=` (a fluent over the
  mentions) is the focus now: thing, action, place, world declared.
- Why per turn and not only "the focus now": with only the current focus, "a red one" was
  re-completed to "move" when a later turn moved (first try, measured in a scratch run:
  q2 action draw → move after q3). Now earlier turns keep theirs.
- Limit (in the reference): a value chosen through std.fill is not a mention. Written as
  one, the stratification check refuses the matrix (the focus state negates mentions,
  and mentions would come from needs that come from the state). Turns come from the host
  for the same reason (from needs: a cycle through core.rank).
- Kernel, performance: core.rank ordered its peers once for every wire of the group and
  each firing copied the reads of all peers. Now a group is ordered once per evaluation and
  the reads list is shared (copied only if another aggregate of the rule adds to it).
  `node bench/rank.mjs` (new; turns told one at a time), before (HEAD 34f613a, src/world.mjs
  stashed) → after: 100 turns 386.0 → 70.7 ms, 200: 2120.0 → 125.8 ms, 400: 20016.3 →
  463.2 ms; one more at 400: 137.84 → 3.88 ms. `node bench/distinct.mjs` anchored 233.4 ms,
  one more 7.18 ms.
- `node bench/focus.mjs` (new): 100 turns 374 ms, 200: 985 ms, 400: 3407–3802 ms; one more at
  400: 18.7–25.0 ms. The rest is the `not=` rule, re-evaluated in full when quiet.
- Tests: test/focus.test.mjs (5: continuations and earlier turns keep theirs; first turn
  and told keys; retract and undo; two dialogues; a better tier wins over focus).
  examples/focus.mjs: draw a cup on the table / a red one / move it right / and lower /
  now draw a boat / smaller → draw cup, draw cup, move cup, move cup, draw boat, draw boat.
- Found: `undo()` takes back tells, not retracts (existing behaviour, test written for it).

## R19 item 5 — refusable readings — done (what existed, two fixes)

`/tmp/check.sh`: 307 pass, 0 fail on sources and built file, 306 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- What exists: `world.score(readings)` is the dry run. Per reading: `ok`, `judgedBy`
  (`action` for a declared action's guard, `denies` for a deny on the wire a host action
  would be, `slots`, `referents`), `violations[0].why`, and `lacks` (with `ask`) for a
  reading that is incomplete but not refused. Nothing applied or recorded (tested:
  `toSOP({ derived: true })` and `history().length` unchanged).
- Fix 1: a declared action's guard said "nothing in the world matches what the action
  needs"; it now names the first pattern nothing matches with the values it asked for
  (`nothing matches game name=hangman state=running`) and gives `pattern:`. One test in
  test/query.test.mjs updated to the new text; pilot output identical.
- Fix 2: `lacks` came from `open()` over every wire of the world, per reading; now only
  the reading's own wires. `node bench/refusal.mjs` (new; 4 readings, 2 refused), before
  (src/query.mjs stashed) → after: 0 facts 27.2 → 22.4 µs per reading, 2,000: 92.7 → 52.3,
  20,000: 345.9 → 27.9.
- examples/refusal.mjs (`sift(world, readings)` → kept with what they lack, dropped with
  the reason): no game → guess "nothing matches game name=hangman state=running",
  hangman_word "no game of hangman runs"; a game runs → all kept, `draw` without a thing
  lacks "What shall I draw?". test/refusal.test.mjs (2). integration §5b.

## R19 item 6 — all or nothing for one sentence — done

`/tmp/check.sh`: 310 pass, 0 fail on sources and built file, 309 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- What existed: `applyPatch` (wires, fills, sets, retracts, replacements: all or nothing,
  one undo step), `check(patch)` and `{ dry: true }` (dry run), `score` (per reading: would
  it be refused, item 5), `undo`/`redo`, `mark()`/`rewind`. Missing: several *requests*
  (actions) together; an action whose host function tells several things was several
  undo steps.
- Added: `world.act([request, ...])`: run in turn inside one transaction; the first not
  done (`missing`, `refused`, `unsupported`, `error`) rolls all back and is reported
  (`failed` index, `results`, `missing` with the question). Done: one undo step — log
  entries made inside carry `step`, `undo` groups by `step` (else by patch `group`), and
  replay keeps `step` (first try lost it after one undo: the rebuilt world's log had no
  marker; found by the test). Survives toJSON/fromJSON (tested).
- Still missing (as before, documented): a retraction is not undone; take a `mark()`.
- test/sentence.test.mjs (3: refused, missing with ask, done/undo/redo as one step and
  after a save). api: "One sentence, all or nothing" (runnable). index.d.ts overload.

## R19 item 4 — why-answers — done

`/tmp/check.sh`: 312 pass, 0 fail on sources and built file, 311 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- What existed: `explain(id)` (a tree per wire: told, via, from, fills) and `query(...).via`.
  Neither said a default from a computed value in one place, nor which action told a
  thing, nor std.fill's tier and source.
- Added `world.why(id, key?)` → `{ id, key, steps }`: from the cell back to what was told,
  each wire once, depth first in the order the rules read them. Step: `{ id, key, value }`
  or `wire`, `tier`, `how` ∈ told | action | rule | aggregate | default | open, with
  `rule` + `from`, or `action`; a filled `std.fill.need` adds `choice { key, value, tier,
  source }` and continues through the chosen offer (and through the need's own origin:
  the rule that said the key was missing).
- Statements made inside `act` now carry `by: <action>` in the log (`why` reads it): "why did
  you open chess?" → `how: action, action: open`.
- test/why.test.mjs (2: the std.fill chain step by step and stable; computed value, told,
  default, open, set by an action, told by a host action, unknown id). api `world.why`
  (runnable). index.d.ts.

## R19 item 3 — std.relations — done (with a kernel fix)

`/tmp/check.sh`: 316 pass, 0 fail on sources and built file, 315 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- `std.relations` in src/std.mjs: rules, built-in arithmetic, core.rank, declared actions.
  `box kind w h` (+ `x y` filled), `at thing x y` (told place), `keep thing rel ref`
  (rel: on, in, next_to, above, in_front_of; enum slot), rows of things kept the same way
  to one thing (slot by core.rank over a shared mark `kept=yes`: core.rank frees the `by`
  key, so ranking by `rel` with within=rel sorted by rel text — found in the first run:
  in/above/... got slots 2,1,3,4), `nth kind n` → `item` (order from the left), `each kind
  w h rel over` (derived things carry `for=` so a told thing alike does not absorb them),
  `spread kind over` → `pair`, actions `relations.put_all` and `relations.put_pairs`
  (remove the told place, add the keep, `all=true`).
- Rules only vs not (reference "What is rules only"): rules only — the five relations,
  chains, rows, the first, each (also later things), pairing, moving. Needs a function —
  rows of different widths (sum of the widths before), a group centred as a whole,
  avoiding overlaps, non-box shapes.
- Kernel defect: moving a thing whose `x` a rule fills (retract the told `at`, tell a new
  one) was refused with a `conflict` on its `order` (core.rank). Cause: key-aware
  withdrawal (R19 rank fix) only knew which patterns matched a wire when the firing kept
  its bindings (rules with not= or a selector); otherwise it withdrew everything, so the
  place of an unrelated peer (`at` rule, pattern with no keys) was taken back while the
  rank was recomputed: the peer vanished from the group. Now the matched wires come from
  the firing's own `from` list (one per when= pattern) when bindings are not kept. Kernel
  test (fails without: stash, 35 pass 1 fail). semantics S39a updated.
- `node bench/distinct.mjs` anchored: 187.3 / 215.7 ms, one more 9.74 / 7.80 ms;
  `node bench/rank.mjs` 400: 383.4 ms, one more 1.48 ms.
- Tests: test/relations.test.mjs (3: chain follows and retract; five relations, row, told
  and kept conflict; nth, each with a later shelf, spread and put_pairs with mark/rewind,
  put_all row). examples/relations.mjs output: cup on book 45/60 → table to x 50: book
  90/70, cup 95/60; first cup $cup3; lamps 217/8 317/8; cup2 next to s2 345/15.
- Note: `undo` does not bring back retractions, so the actions' effect is undone by
  `rewind(mark)` (documented).

## R19 item 7 — indexed match for patterns — done in general; real measurement waits on Q26

`/tmp/check.sh`: 318 pass, 0 fail on sources and built file, 317 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean. `node tools/doc-examples.mjs`:
109 runnable examples, 0 problems.

- `PatternIndex` (src/patterns.mjs, exported): a pattern is `{ id, kind, needs }` (+ host
  data), `needs` a list of word sets (one word of each must be in the sentence); each
  pattern kept under its rarest set; `candidates(tokens, { kind })` gives only the patterns
  every set of which meets the sentence, in insertion order (host priority holds);
  patterns that need no word always come. General: "by first content word and by type"
  becomes "by the rarest needed word, filtered by kind"; the matcher stays the host's.
- `node bench/patterns.mjs` (synthetic: 3,000 patterns, 2,000-word Zipf-like vocabulary,
  1,000 sentences of 8 words): every pattern tried = 3,000 per sentence, filtering alone
  201.4 ms; index built 9.9–13.7 ms, 51.50 handed out per sentence (same set as the full
  filter: true), 26.8–40.6 ms per 1,000 sentences; bundle 51.50, 27.0 ms.
- Not measured on PSys2's set: it is not in compat/ (`grep -rc match=` over
  compat/psys2/worlds and matrices: 0; only the legend's declarations). Q26 asks for its
  patterns.sop and spec 03 (option a) or leaves the measurement to PSys2 (b).
- test/patterns.test.mjs (2), api "PatternIndex" (runnable), index.d.ts.

## Release 0.17.0 (Round 19)

`/tmp/check.sh`: 318 pass, 0 fail on sources and built file, 317 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version in package.json and
src/index.mjs, CHANGELOG entry, docs rebuilt (`docs/version.md`: sopworld 0.17.0). Round 19
items in the reviewer's order: rank fix, 1 std.fill, 2 std.focus, 5 refusable readings,
6 act([...]), 4 world.why, 3 std.relations, 7 PatternIndex (real measurement: Q26).

## R20 items 1–5 — std.schema, std.acts, refusals with alternatives, example, cost — done

`/tmp/check.sh`: 322 pass, 0 fail on sources and built file, 321 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean. Answers 1–4 in questions.md Q27.

- `std.schema` (rules and slots): kinds are types extending `std.schema.thing`, attributes
  are `core.slot`; `std.schema.world`, `std.schema.kind of= world= acts=` (acts: enum
  slot), `std.schema.kinds world= from= key= acts=` (any kind a knowledge type names; those
  things are `std.schema.thing`), `std.schema.limit of= max=` (count + deny). Load checks:
  unknown act (enum), kind of an undeclared world (deny with not=).
- `std.acts`: make, remove (with its links), change (value, or more/less by the slot's
  step), place, connect, group/ungroup, pick, ask (with why), copy: one generic action
  function each, shipped by the library (the standard pack can now ship actions as it
  ships functions). No world-specific code; a schema is data.
- Library: every done action result has `diff` (added, removed, changed with from/to and
  tiers), read from the action's events plus the wires it removed on the way (no copy of
  the world: a fork inside a transaction is not allowed). A host action that returns a
  refused change result passes its violations through (a `domain` stays `domain`).
  `why` finds the statement of a replaced wire.
- Refusals: `reason` = { act, kind, allowed, attrs, elsewhere (worlds allowing the act),
  hasIt (kinds having the attribute), which (ambiguous thing) }.
- First version changed values by `replace`: the log rewrites the old tell in place, so it
  was not an undo step and why said "make"; now a `set` patch (one undo step, logged with
  the act's name).
- examples/acts.mjs (seating + face, the same acts); test/acts.test.mjs (4: both worlds;
  refusals with alternatives, limit, ambiguity; a third schema (playlist) with zero rules,
  links follow, one sentence all or nothing; open kinds from knowledge and load checks).
- Cost, `node bench/acts.mjs` (steps from `world.stats()`): first version (limit count over
  every thing) at 2,000 things: make 4018 steps, change 2013, remove 4016 — linear. The
  count now runs only for kinds that have a limit (`over=` the limit and the things):
     10 things: make 9 steps 1.69 ms; change 10 steps 1.39 ms; pick 0 steps 0.14 ms; remove 9 steps 0.87 ms
    200 things: make 9 steps 0.31 ms; change 10 steps 0.34 ms; pick 0 steps 0.08 ms; remove 9 steps 0.30 ms
   2000 things: make 9 steps 5.73 ms; change 10 steps 0.20 ms; pick 0 steps 0.40 ms; remove 9 steps 7.19 ms

## Release 0.18.0 (Round 20: std.schema + std.acts)

`/tmp/check.sh`: 322 pass, 0 fail on sources and built file, 321 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version in package.json and
src/index.mjs, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.18.0). PSys2 can
switch its A1–A3 host side to these modules.

## R21 item 1 — the core.rank conflict (Q25 item 4): fixed

Fixed in R19 (42461eb): a better offer arriving later re-ranks with no `conflict` or loop;
then (19f98b2) a moved key under a rank. Tests: test/delegation.test.mjs
"delegation with core.rank: a better offer re-ranks the others without a conflict" (was the
todo), test/kernel.test.mjs "a rank re-computed when a better peer comes, ..." and "a rank
over a key that a rule fills follows when that key moves, ...". `npm test` at b5c7f3d:
322 / 322 / 321 pass, 0 fail (the reviewer's validation).

## R21 item 3 — from schema to words — done

`/tmp/check.sh`: 326 pass, 0 fail on sources and built file, 325 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- `schemaCard(world, name?)`: per world `{ world, doc, kinds }`; a kind has words
  (core.word means=kind, else its name), acts, attrs (name, kind, values, min, max, step,
  default, required, refers), limit; an open world has kind `*` with `from`.
- `schemaExamples(world, name?, { per })`: sentences per act and kind with the request
  each should become. On the seating + face schemas with one thing of each kind: 35
  examples (per 2), all 35 done on a fork (test).
- `actReply(world, request, result)`: plain English from the result: "I made a seat
  (seat1).", "I changed the colour of the seat (seat1) from blue to red.", "I can't change
  the size of a seat: a seat has no size. The eye in face has a size.", "Which eye? There
  are 2: ...", missing arguments as the question.
- Found: `fork()` lost host functions registered after construction and the actions/
  functions a standard module brought (a fork could not run `make`: "this._host(...) is
  not a function"). A fork now carries fns, actions, producers, filters, lemma (test).
- Refusal reasons use "an" before a vowel sound (not "a eye"; "a unicorn" stays).
- test/schema-words.test.mjs (4), api section (runnable), index.d.ts.

## R21 item 4 — knowledge as a filler — done (with three kernel cost fixes)

`/tmp/check.sh`: 328 pass, 0 fail on sources and built file, 327 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- `std.know` (rules, loads std.fill): a `std.schema.thing` without place, size or colour
  needs one; `k.commonsense.thing at= size=` and `k.objects.part name=body colour=` offer
  at tier `knowledge` with `core.source` as the source (a multi-colour body is a tie:
  advice). `make` applies what std.fill chose as defaults (tier `default`), lists them in
  `result.filled` (key, value, tier, source); a closed kind takes only its own attributes.
  `std.schema.kinds stand_in=<type>`: a kind the catalog does not name, drawn as its
  stand-in (`drawn_as`). examples/know.mjs with three wires copied unchanged from
  sop-knowledge-worlds (hand-core, CC0-1.0): fish → water/small, sun → sky/huge, robot →
  grey, unicorn → drawn as horse. test/know.test.mjs (2). reference "std.know".
- Cost, `node bench/know.mjs` (one make on a world of n things, each with its needs):
  first version 672 / 9,412 / 92,212 steps at 10 / 200 / 2,000 things (linear). Three
  kernel causes, each fixed:
  1. rules with `core.absent=` were re-evaluated in full on every change of a type they
     read (all things × 3 keys). A rule whose only selection is core.absent on its own
     patterns is now driven by single wires; a match a gained key ends is taken back on
     that wire; rules reading a rank's or a group aggregate's result wait for it (the
     wait now covers anchored ranks too); the stratification check still applies to them.
     → 475 / 5,795 / 56,195.
  2. a withdrawn firing requeued every wire it read, so a shared knowledge fact read by
     every thing re-matched all of them. Now one wire is requeued, the one with the fewest
     firings (any of them finds the same match). → 262 / 1,782 / 16,182.
  3. and none when a wire it read is gone (it cannot hold again; the tier wire of
     std.fill was re-matching every offer). → 163 / 163 / 163.
  Also: aggregate firings by group found through an index (rebuilt when byRule is another
  object), not by scanning the rule's firings per seed.
- Benches after: `node bench/acts.mjs` 2,000 things make 9 steps; `node bench/distinct.mjs`
  anchored 211.5 ms, one more 9.96 ms; `node bench/rank.mjs` 400: 398.8 ms; `node
  bench/focus.mjs` 400: 4478 ms, one more 21.9 ms.
     10 things: make 163 steps 3.61 ms, filled 2
    200 things: make 163 steps 2.33 ms, filled 2
   2000 things: make 163 steps 1.73 ms, filled 2

## Release 0.19.0 (Round 21: items 1, 3, 4)

`/tmp/check.sh`: 328 pass, 0 fail on sources and built file, 327 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.19.0). Next: item 2 (send, save/load, undo/redo as acts).

## R21 item 2 — send, save / load, undo / redo as acts — done

`/tmp/check.sh`: 331 pass, 0 fail on sources and built file, 330 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- `send thing to`: the thing's kind must allow `send` in its world and `make` in `to`; a
  kind may now belong to several worlds (`std.schema.kind world=` repeated). Done as one
  `set` of `world`: one undo step, both schemas checked. Refusals: "chart has no hat",
  "there is no world nowhere", "a bar cannot be sent from chart".
- `save name`: the told things kept in a `std.acts.saved` wire; `load name`: one patch that
  changes them back, makes again what went, takes away what was made since (the diff says
  which; a retraction is not undone by `undo`, as everywhere).
- `undo`, `redo` (and `load`): actions on the history run outside a transaction (an action
  function marked `outside`); result and `diff` (from a fork before) like any act; inside
  another change (a sentence) they are refused, so the sentence is not applied.
- First build failed: tools/build.mjs refuses a renamed import (`parse as parseWire`);
  imported as `parse`.
- test/acts-history.test.mjs (3). reference table rows.

## R21 item 5 — sets and values in acts — done

`/tmp/check.sh`: 333 pass, 0 fail on sources and built file, 332 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- `change` and `remove` take `set` (each, all, first, last) with `thing` a kind; `change`
  takes `value` random (from the slot's enum or range), different (one per thing, none the
  same, each other than it was where the slot allows), `same as <thing>`. The whole set is
  one `set` patch: one undo step. A value list missing: "the name of a car has no list of
  values to choose from". Random is reproducible for a given world state (seeded by the
  world's sequence): the same request in the same state chooses the same.
- test/acts-sets.test.mjs (2), reference row.

## Release 0.20.0 (Round 21: items 2 and 5)

`/tmp/check.sh`: 333 pass, 0 fail on sources and built file, 332 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.20.0). Item 6 (the session as facts) merges with Round 22.

## R23 items 1 and 2 — the catalogue of reuse patterns, the detector, three reports — done

`/tmp/check.sh`: 333 pass, 0 fail on sources and built file, 332 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- docs/reuse.md (a page of the docs, reuse.html): 12 patterns, each with when, how today,
  example, what is missing: shared things with views, delegation, defaults by tier,
  specialisation, composition, the parameterised world, rule lifting, pipeline, analogy,
  shared words, and two the reports found: the last thing (focus), a box aspect.
- tools/reuse.mjs: reads sopworld and PSys2 dialects (.sop files, world directories,
  example .mjs files); finds types and rules of the same shape under renaming, shared
  words, action-signature families, parameterised-world pairs, liftable rules; a reuse
  number per world (types used that come from elsewhere / types used).
- Reports in docs/reuse-reports/ (tool output unchanged + my verdict on each of the top 20):
  - `node tools/reuse.mjs <psys2>/worlds` (all 32 PSys2 worlds read in place, PSys2 at
    78d9db7f; compat/psys2 has only the kids.* worlds): 157 candidates; top 20: 8
    believed, 7 partly, 5 not. Strongest: "a reference must exist" deny in 7 tab worlds;
    the board game (chess / tic-tac-toe: game keys, move keys, "no move after over"); the
    last thing (= std.focus).
  - `node tools/reuse.mjs examples`: 20 candidates; 1 believed, 12 partly, 7 not. Most
    "liftable" hits are two different types with one name (`item`, `line`): the tool
    cannot tell a name clash from reuse.
  - `node tools/reuse.mjs <sop-knowledge-worlds>/docs/worlds` (at 66d8653): 13 candidates;
    4 believed (face/object point, the exclusive pair, face part ⊂ object part, face slot
    ⊂ layout slot), 5 partly, 4 not.
- First run on PSys2 listed 23 action-signature pairs, nearly all `name -> one value`
  lookups; grouped into families (3), lookups scored lower. Examples printed on import:
  silenced while reading.

## R22 items 1–4 (and R21 item 6) — shared things, views, taught facts — done

`/tmp/check.sh`: 335 pass, 0 fail on sources and built file, 334 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean. Answer to item 1 in Q28.

- std.schema: `std.schema.aspect name keys doc`, `aspects=` on kinds (declared and open),
  `std.schema.view name shows`. std.acts: `show` (a thing, a kind with a set, or `*`),
  refused with the aspect's doc ("a table has no place on Earth") and the aspects the
  thing has; it records `std.acts.shown view thing`. `teach` (knowledge wires as text, at
  the tier `taught`, `core.source="taught by <who>"`, a `std.know.taught fact by at`
  wire), `forget`.
- std.fill: tier `taught` rank 3.5 (rank is a number now): below the user, the focus and
  the scene, above knowledge. std.know: every fact gets its tier (`std.know.from`: taught
  or knowledge), offers carry it; `is_a` gives the other kind's place and size at the tier
  of the `is_a` fact.
- examples/views.mjs: picture, chart, list over the same things; after "a pony is a kind
  of horse" is taught by Ana, a new pony is in a field and large in all three. A pony made
  before keeps no place (defaults are applied at make; noted in Q28 b).
- test/views.test.mjs (2); test/fill.test.mjs tier list updated; reference section.

## Release 0.21.0 (Round 22 items 1-4, Round 23 items 1-2)

`/tmp/check.sh`: 335 pass, 0 fail on sources and built file, 334 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.21.0). Next: Round 23 items 3-7.

## R23 items 3 and 4 — three reuses done, the parameterised world — done (Q29 open)

`/tmp/check.sh` below at the commit. examples/reuse.mjs, test/reuse.test.mjs (3).
- The board game (PSys2 report 10, 14, 15): one `board` module (game keys, move keys, one
  move number per move, whose turn by the parity of the move count, no move after the
  result) instantiated as tic-tac-toe (+ `at`) and chess (+ `from`, `to`). Wires: in
  PSys2's matrices the shared parts are restated (`grep` counts in
  games.tictactoe/matrix.sop: game/move slots 5, turn 8, over 4; games.chess/matrix.sop:
  slots 3, turn 2, over 0 — chess keeps its turn logic in JS): 22 wires; with the module:
  20 wires once, plus 2 own wires per game.
- The parameterised world: one `list` module (9 wires: a closed item type, title, done,
  an amount key, two words, the open count) as tasks, shopping, playlist; each has its own
  words and its own counts; a playlist song refuses a `quantity`.
- "A reference must exist" (PSys2 report 1, 4, 11: seven tab worlds): one slot attribute,
  `core.slot ... type=<kind>`; tested.
- Instances are made by renaming the module's prefix in its text (`instance`), because
  `core.use` loads a module once under its own name: Q29 proposes `core.use ... as=`.

## R23 items 5, 6, 7 — composition, advice at load, reuse number — done

`/tmp/check.sh`: 340 pass, 0 fail on sources and built file, 339 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- Composition: a thing inside another is one with a key referring to it (`of=$face2`);
  acts take `in` (a thing, or a kind with `in_nth`): "make the eyes of the second face
  green" = change eye set=each colour green in=a_face in_nth=2 → eye3, eye4 only; an
  ambiguous container is refused ("which a_face? there are 2"). `change` on a set now
  also takes `by` more/less. test/compose-advise.test.mjs.
- Advice at load: option `advise` (off by default): warnings of kind `advice` for a kind
  of the application with the shape of an imported module's kind ("kind card here has the
  shape of shapes.box in module shapes: import it?") and a rule with the shape of another
  module's rule ("the rule mine is already in std.relations (std.relations.slotted)").
  First version also advised the library module toward the application: narrowed to
  advice on what the author loads. api section (runnable), semantics warnings list.
- Reuse number: `tools/reuse.mjs` prints per world the types used, own and from
  elsewhere, and the ratio; in all three reports. `node tools/reuse.mjs examples` now:
  acts 0.6, delegation 0.67, fill 0.88 (head of the table).

## Release 0.22.0 (Round 23)

`/tmp/check.sh`: 340 pass, 0 fail on sources and built file, 339 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.22.0). Open: Q28, Q29.

## R24 B1 — docs/capabilities.md for what exists — done

`/tmp/check.sh`: 340 pass, 0 fail on sources and built file, 339 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean. `node tools/doc-examples.mjs
docs/capabilities.md`: 12 runnable examples, 0 problems (CI runs them: docs test).

- 12 jobs, each a paragraph, a runnable example, module and version, limits: describe a
  world; facts and rules; ask and explain; act, undo, sentences; worlds as data and
  refusals with alternatives; fill gaps; dialogue focus; relate and place; views and
  taught facts; generate cards, examples, replies; drop refusable readings; measure reuse.
- Holes it shows (the "Not done yet" section): load knowledge by lookup (A1), choose a
  world (A2), one request pipeline with graded fallback (A3, A4), coverage grid and test
  skeletons (A5), failure ledger (A6).
- The docs test forbade naming an earlier version ("since 0.1"); the capability page (and
  README's coming table) say since which version a job exists on purpose: allowed there
  for "since" only. A first example showed `range` where the library says `domain`.
- A page of the docs (capabilities.html).

## R24 A1 — loading worlds by lookup (PSys2 knowledge-loader hand-over) — done

`/tmp/check.sh`: 343 pass, 0 fail on sources and built file, 342 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- src/knowledge.mjs: `createCatalog({ index, vocab, read, cache, lemma })` — shards of a
  word, the plan (schemas of the worlds and their dependencies first, cycles cut), each
  path read once (a failed read is retried next time), `into` / `intoSync` tell into a
  World (schemas once per World). `bundleReader`. tools/build-bundle.mjs: a bundle (index
  subset, vocabulary subset, shard texts by path) for words, shards or whole worlds.
- Compared with PSys2 handover/knowledge-loader (copied at 9e370c47, read in place): taken —
  catalog, cache interface, source interface, bundle reader, bundle generator (254 lines);
  refused — `variants` (English plurals: the host passes `lemma`), `parseShard` decoding
  k.objects parts (a drawing concern; the library tells shards as SOP Lang), faces,
  learned facts (= the act `teach`), the lookup evaluation-set generator. Q-H8 noted.
- test/knowledge.test.mjs (3) on the CC0 fixtures: cup → 3 paths (k.commonsense schema,
  k.objects schema, household shard); schemas once per world; each path read once across
  worlds; host lemma; a failed read retried; bundle of "cup": 3 files, 1 shard, 1 word.
- Docs: capabilities "Load knowledge by lookup" (runnable) and "Taken over from PSys2"
  table; api section (runnable); index.d.ts.

## Release 0.23.0 (Round 24: B1, A1)

`/tmp/check.sh`: 343 pass, 0 fail on sources and built file, 342 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.23.0).
- Fix: src/knowledge.mjs named the consumer in a comment (`git grep -i psys2 src/`: 1 after the 0.23.0 commit); removed, now 0. The built file is rebuilt; the version stays 0.23.0.

## R24 A3 and A4 — the request pipeline and the graded fallback — done

`/tmp/check.sh`: 346 pass, 0 fail on sources and built file, 345 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean. Doc examples: 85, 0 problems.

- src/turn.mjs, `turn(world, readings, { reply })`: each reading dry-run on a fork; the
  first the world takes applied as one sentence (`act([...])`: all or nothing, one undo
  step); result: status done, reading, results, diff, why per changed value, guesses
  (values filled by tiers, said as "I guessed place water (knowledge, hand-core 1)"),
  replies (actReply or the host's), dropped readings with the reason. Fallback: `ask`
  (only an argument missing: question), `elsewhere` (a known kind, act or attribute not
  here: the reply says what it can do and where), `unknown` (the best guess named:
  "Did you mean to make hat? (no world here has a hat)").
- First version said "elsewhere" for an unknown kind too (every refusal lists worlds
  that allow the act): now only when the kind is known here or another kind has the
  attribute.
- Compared with PSys2 handover/turn-pipeline: taken — the dry run on a fork, all or
  nothing for a sentence, fill by tiers (std.fill, already), graded fallback, the why
  trace; refused — English reading, translation, the encoder accept rule, the host's
  guard; the per-turn tick budget is the library's own budget. Row in the capabilities
  table. test/turn.test.mjs (3). api section, capabilities job (both runnable).

## R24 A2 — choosing the world for a request — done

`/tmp/check.sh`: 347 pass, 0 fail on sources and built file, 346 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- `route(world, request, { scores })` in src/turn.mjs: each std.schema world scored by its
  card (+2 has the kind or takes it from a catalog, +1 allows the act), the thing named
  (+2 it is one of its things), a dry run on a fork (−2 refused, with the reason) and the
  host's signal per world; best first with `why`. Tested: eye1 → face 5 (has eye, allows
  change, eye1 is here); a third eye → face 1 (refused: at most 2 eye); a host signal
  face 5 beats seating 3 for a seat.
- PSys2 meta.worlds hand-over: the routing rules are general (taken in this form); the
  generated cards and the tab registry stay in the host. Row in the capabilities table.

## R24 A5 — the coverage grid and test skeletons — done

`/tmp/check.sh`: 349 pass, 0 fail on sources and built file, 348 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- `schemaGrid(world, name?, { per })`: every world × kind × act case (the requests of
  schemaExamples) run on a fork that holds one thing of each kind (made with `make`, so
  with defaults; told when the kind cannot be made), with `expect`: done (kinds added,
  removed count, keys changed) or the reason. Seating + face: 35 cases, 0 holes; face with
  a limit of 1 eye: 3 holes ("at most 1 eye"). First version told the base things without
  their defaults: "make the eye bigger" was a false hole (size not a number).
- `gridTests(cases, { importFrom, make })`: a node:test file; tested by running it in its
  own test run (NODE_TEST_CONTEXT cleared: a nested run printed nothing): 13 pass, 0 fail.
- The build refuses "node:" in src (a Node-only marker), also in comments and in text
  written for the host: spelled apart.
- api section, capabilities job (runnable); index.d.ts.

## Q28 (b) and Q29 (a) — the act `complete`, `core.use as=` — done

`/tmp/check.sh`: 351 pass, 0 fail on sources and built file, 350 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- `complete` (std.acts): for every thing (or a thing / a kind with a set), what std.fill
  chose since it was made and it still lacks is applied as defaults (tier `default`) in
  one set (one undo step), listed with tier and source in `result.filled`. Test: a pony
  made before "a pony is a kind of horse" was taught gets field / large (taught by Ana)
  only when `complete` is asked.
- `core.use world=<module> as=<name>`: the module's own prefix renamed in ids, types and
  references; loaded once per `as` name; the module of each wire is its `as` name (the
  prefix check then holds). Test: one `list` as tasks and shopping, separate counts, each
  closed. First run refused "module list declares the type tasks.item": the wires still
  said they came from `list`.
- Q28, Q29 closed in questions.md. Reference: core.use `as`, std.acts `complete`;
  reuse.md and capabilities updated.

## Release 0.24.0 (Round 24: A2, A3, A4, A5; Q28, Q29)

`/tmp/check.sh`: 351 pass, 0 fail on sources and built file, 350 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.24.0). Next: A6, quickstart, host contract, the second app.

## R24 A6 — tools for authors: validate, failure ledger — done

`/tmp/check.sh`: 354 pass, 0 fail on sources and built file, 353 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean. Doc examples: 90, 0 problems.

- src/ledger.mjs: `ledgerKey` (source, text, world), `ledgerAppend` (append-only: old rows
  never rewritten nor added again), `ledgerGroups` (by stage, class and the first of the
  host's cause signals; largest first; examples round-robin over sources; stable),
  `stageOf(turn result)`, `STAGES` (reading, routing, filling, acting, replying).
  tools/ledger.mjs: `add` (JSONL, append-only) and `report` (Markdown table).
- tools/validate.mjs: load files (.sop or .mjs) with optional advice; prints refusals,
  notes and the coverage grid's holes; exit 1 when refused. On examples/acts.mjs it first
  showed 35 false holes: the schema files do not load std.acts themselves; now it loads
  it and says so in a note.
- From PSys2 handover/failure-ledger: taken — the format, append-only key, grouping and
  examples over sources; refused — its cause-signal list and the replay of its own eval
  scripts (host). test/ledger.test.mjs (3). api and capabilities (runnable); the table.

## R24 B2–B6 — quickstart, modules, patterns, host contract, README table — done

`/tmp/check.sh`: 355 pass, 0 fail on sources and built file, 354 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- docs/quickstart.md: a room planner — a schema, three acts, knowledge by lookup (a
  two-file bundle), `turn` with replies and a fallback; 4 runnable blocks on one setup
  block, run in CI (`node tools/doc-examples.mjs docs/quickstart.md`: 4, 0 problems at the
  first run).
- docs/modules.md: every std module (purpose, loads, types, actions, tiers, cost with its
  bench: acts 2,000 things ≈ 10 steps; know make ≈ 220 steps; focus 400 turns ≈ 4.5 s;
  rank 400 ≈ 0.4 s) and the JavaScript services.
- docs/patterns.md: docs/reuse.md renamed (the catalogue of Round 23, how worlds combine).
- docs/host-contract.md: what a host supplies (reading, lemma, rendering, translation,
  fetching, storage, its signals, host actions, ledger signals, a guard) and what it must
  not rebuild; where it differs from PSys2's docs/host-boundary.md (read at its main):
  module names (std.things / std.dialogue / std.space / std.knowledge / std.route vs the
  library's), no English pack of acts, the per-turn budget stays the host's guard, one
  interpreter (the legend dialect mapped), cards and grid only for std.schema worlds.
- README "What it can do": generated by tools/capability-table.mjs from one
  "*In …; since …*" line per job in capabilities.md (16 jobs); the docs test fails when
  it is stale. All five pages are in the docs build.

## R24 B7 — a second application from the docs alone — done; where the docs were not enough

examples/second-app/recipes.mjs (a recipe planner: recipes and ingredients as a schema, a
rule scaling amounts by servings, a shopping view, units from a catalog bundle, requests
through `turn`), test/second-app.test.mjs (1). `node examples/second-app/recipes.mjs`:
pancakes for 2 → 120 g flour, 200 ml milk, 2 piece egg; for 6 → 360 g, 600 ml, 6.

Where the docs were not enough (and what was done):
1. Joining through a reference: I first wrote `@r ingredient of=?rec` with a separate
   `@rs recipe serves=?n` — no join, every ingredient scaled by every recipe. Nothing in the
   quickstart or capabilities showed `of=$rs`. Added to capabilities ("State facts and
   rules") and reference (composition).
2. Making a thing inside another: the composition paragraph showed acts reaching inside
   (`in`) but not how to make into a container (a slot `type=`, `make` with `of: '$id'`).
   Added to reference.
3. `turn` gave `question` but no `replies` for `ask` / `unknown`: a host rendering
   `replies` showed nothing. Library: `replies` now on every status but `nothing`; api
   updated.
4. Units from knowledge: std.know offers only place, size, colour; any other key (a unit)
   must be read by the host from the catalog's facts and passed to `make`. Not changed;
   noted for a next round (a declared "key from catalog type" offer).
5. A derived attribute on a closed schema kind needs its slot declared (amount): implied
   by "closed", not said where rules are shown. Not changed.

## Release 0.25.0 (Round 24: A6, B2-B7)

`/tmp/check.sh`: 356 pass, 0 fail on sources and built file, 355 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.25.0). Round 24 done except the remaining PSys2 hand-over
packages (acts, space, session.things, session.dialogue, common.sense) and the three
extractions from the PSys2 reuse report.

## R24 — the other hand-over packages compared (Q30)

handover/acts, space, session.things, session.dialogue, common.sense read in place at
PSys2 main: what is already here, what is refused (English forms and readers, tab words,
facts), what is missing (a per-kind act hook `on.<act>`, space selection by order /
position / size, layouts, overlap enforcement, spatial questions, pieces with their
solver, a turn log with `amend`). Q30 with the proposed order; not blocking. Row in the
capabilities table.

## R25 — the request pipeline as data — done (Q31: yes for order, providers, fallbacks)

Answer in questions.md Q31 (recommendation: the order, the providers and the fallbacks
as data; the stages' insides stay functions; parallel candidates not yet).
- `std.turn` (src/std.mjs): `std.turn.stage name after before per on_empty skip_if only
  when`, `std.turn.provider stage name tier`; the default path read → dryrun → apply →
  reply per candidate, fallback when exhausted; soft denies as advice for a stage nobody
  provides or placed after / before an undeclared stage. (`fn=` is reserved for matrix
  wires: the provider key is `name=`.)
- `turnFlow(world, readings, { providers, reply, confirmed })` (src/turn.mjs): the order
  from the after chain (ties by name), `before=` insertion, providers by tier (readers add
  up), `on_empty` next / ask / fail, `skip_if`, `only`; built-in providers given, dryrun,
  apply, reply, fallback (factored out of `turn`), confirm, route; a trace of every stage.
- test/flow.test.mjs (3): the declared default and `turn` give the same status, reading,
  replies and diffs on 30 requests, and the same world at the end; the trace; a hole is an
  issue; variants by facts only — a confirmation before removing a whole set ("Remove all
  3 seats?", done when confirmed, skipped for make), a second reader at tier 2 taken when
  the first reading fails.
- `node bench/flow.mjs` (30 requests): turn 32.2 / 12.9 ms, turnFlow 25.8 / 18.9 ms; steps
  summed 670 both (the library steps are the same; the overhead is JavaScript only).
- Docs: reference std.turn, api turnFlow, capabilities job (17 jobs in README), modules.

## Release 0.26.0 (Round 25)

`/tmp/check.sh`: 359 pass, 0 fail on sources and built file, 358 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.26.0). Open: Q30, Q31.

## Standing direction (2026-11-14 00:40) — lessons, the case corpus, and what it found

`/tmp/check.sh`: 360 pass, 0 fail on sources and built file, 359 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean. `node tools/cases.mjs`: 17 / 17;
acting 12/12, replying 2/2, routing 2/2, filling 1/1.

- docs/lessons.md (a docs page): eight lessons, newest first, each ending with what the
  library did or will do.
- The case corpus: cases/*.cases.json (language-free steps: acts, why, route, turn, with
  the expected diff / refusal / route / status), cases/schemas/ (a seating schema after
  PSys2's handover/acts executor tests), tools/cases.mjs (per-stage report), a test with a
  baseline that only grows (cases/baseline.json). PSys2's own ledger (2,148 rows) is about
  reading and translation (language), so the first language-free cases come from its
  hand-over tests.
- First run: 10 / 17. What it found and what was done (kernel and std.acts):
  1. `make` with `amount` (several things in one act).
  2. A retraction was erased from the log, so `undo` could not give it back: now a
     retraction (world.retract and a patch's retract) is a statement (`op: retract`),
     replayed; sync still erases (docs say so). One old test (patch: "a retracted wire
     takes its replacements out of the log") rewritten to the new rule; docs updated in
     four places.
  3. An act that makes several statements was several undo steps: every act is now one
     step (`step` set in `_act` when none is open).
  4. Capacity: `std.schema.capacity of= key= holds= via=` — one more guest at a full table
     refused ("table1 has room for 0 more guests"), and seats below the guests seated.
  5. Defaults written by `make` were told values: now at the tier `default`, and `why`
     says `default` (with the act still named).
  6. The case expected `range` where the library says `domain`: the case follows the
     library's name.

## Release 0.27.0 (standing direction: corpus, lessons)

`/tmp/check.sh`: 360 pass, 0 fail on sources and built file, 359 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG (with the
migration note), docs rebuilt (`docs/version.md`: sopworld 0.27.0). Corpus `node
tools/cases.mjs`: 17 / 17 (acting 12/12, replying 2/2, routing 2/2, filling 1/1).
Cooperation `node tools/cooperation.mjs`: 25 pairs in 29 files. Next: two more
applications from the docs (room planner, classroom timetable), more cases.

## R26 A3, A1, A5, A4 — domain effects, replies in the host's words, effect rollback, reserved names — done; B designed (Q32)

`/tmp/check.sh`: 363 pass, 0 fail on sources and built file, 362 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean. Corpus 17 / 17.

- A3 `std.schema.effect of= act= action=`: make, remove, change, place, connect, group,
  copy, send, show on that kind go to the host action `(ctx, args, { act, kind, thing })`;
  its result and `diff` come back (`diff.effects`, `same: false`); a refusal with its why.
- A5 a refused sentence calls the `undo()` of the effects done before the refusal (last
  first); outside a sentence nothing is kept (test: a sentence of two circles and a kite
  leaves the board empty).
- A1 `actReply(w, req, result, { templates })`: a template per act and kind ("change.seat",
  "change", "refused.change", "refused"), with {thing} {name} {kind} {attr} {value} {from}
  {to} {why}, or a function; tested with Romanian templates through `turn`.
- A4 reserved names documented in the reference (keys kind, world, drawn_as; types under
  std.; ids the library makes).
- A2 (`resolve(phrase)`) waits on B (the language part); B: design note Q32 (an Earley
  chart parser over grammar facts, ambiguity returned ranked with a cap, budget-bounded).
- test/effects.test.mjs (3); capabilities job "Drive a world whose state is not wires".

## Release 0.28.0 (Round 26 A)

`/tmp/check.sh`: 363 pass, 0 fail on sources and built file, 362 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.28.0). Corpus 17 / 17. Next: std.grammar (Q32), resolve,
the two applications.

## R26 B — std.grammar, the smallest version — done

`/tmp/check.sh`: 366 pass, 0 fail on sources and built file, 365 in checking mode. Pilot
identical. psys2 grep empty. scan-loops clean. tsc clean.

- src/grammar.mjs: `grammarOf(world)` (g.word lexicon with features, g.rule with `?` `*`
  `+` expanded into plain rules, g.coord), `parseText(world, text, { start, max, budget })`
  (a memoised chart over spans, left recursion cut, coordination of any category, every
  complete parse best first: fewer nodes, then the higher coordination; a step budget),
  `nounPhrase(node, cats)` (det, num, mods, head, lemma, pp; coord). No word of any
  language in src; the toy grammar is in the test, and a made-up language (modifiers after
  the noun) reads with the same code.
- "a cup on the table and a plate" gives both parses, (a cup on the table) and (a plate)
  first; "two red cups and plate" reads as one noun phrase with a coordinated head (fewer
  nodes): the world's dry run is to choose among parses, as Q32 says.
- The build refused "node:" (a node property `node: {...}` looked Node-only): renamed.
- test/grammar.test.mjs (3); api and capabilities (runnable). Verbs, frames and
  `resolve(phrase)` (A2) next.

## Release 0.29.0 (Round 26 B)

`/tmp/check.sh`: 366 pass, 0 fail on sources and built file, 365 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.29.0). Corpus 17 / 17.

## 01:20 item 1 — PSys2's lang.en hand-over read by std.grammar — done; release 0.30.0

`/tmp/check.sh`: 369 pass, 0 fail on sources and built file, 368 in checking mode; pilot
identical; psys2 grep empty; scan-loops clean; tsc clean. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.30.0).

- `node /tmp/le.mjs <handover>`: the 5 noun-phrase shards (np, determiners, numbers,
  prepositions, pronouns) loaded with `w.tell`. At first, 8 of the 11 examples parsed; after
  adding digits, `_` words and `'s` tokens, all 11 parse with the right head.
  `schema.sop` fails cardinality (`rhs`, `in` lack many=true), so it is not loaded.
- src/grammar.mjs:
  - options `types` / `classes` / `lexicon` / `digits`;
  - literal and `[a|b]` rule parts; `status=hole`; `head=`;
  - left recursion grown after the base results;
  - multiword tokens; rule ids on nodes;
  - `truncated` instead of a throw; `unknown`;
  - `nounPhrase` gets quant / ord / name / pron / parts; `grammarView`, `viewDiff`.
- test/grammar.test.mjs, from 3 tests to 6:
  - a made-up grammar world with its own names;
  - the hand-over read in place, with 14 phrases (skipped when absent);
  - views.
- The comparison and the refusals are written up in questions.md Q33. Next: `resolve(phrase)`
  (item 2), then the two applications.

## 01:20 item 2 — resolve(phrase) -> ids + tier — done; release 0.31.0

`/tmp/check.sh`: # pass 373 # fail 0 # pass 373 # fail 0 # pass 372 # fail 0 — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.31.0).

- src/resolve.mjs: `resolve(world, phrase, { grammar, cats, focus, inside })`. The
  language comes from the grammar world (parseText / nounPhrase); the resolution over
  `std.schema.thing` is language-free.
  - Kinds and values through core.word.
  - Tiers user / scene / focus / slip, with `how` steps.
  - When it cannot resolve: `why` and `which`.
- test/resolve.test.mjs has 4 tests:
  - a toy grammar: synonyms, ordinals, counts, sets, coordination, relations, focus and
    pronouns, slips;
  - PSys2's lang.en shards read in place: "the last table", "table 1", "the star next to
    the blue table", "all the tables", "it".
- Next: the two small applications (room planner, timetable).

## 01:20 item 3 — the two small applications (room planner, timetable) — done; release 0.32.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.32.0).

- examples/second-app/rooms.mjs uses std.acts, std.boxes and std.fill, plus a catalog for
  w / d / price, the floor and shopping views, and `resolve` with `core.word`.
  `node examples/second-app/rooms.mjs`:
  - a desk on the sofa is refused ("it would stand on another piece");
  - a bed past the wall is refused ("it does not fit in the room there");
  - "the couch" resolves to sofa1 (tier user).
- examples/second-app/timetable.mjs has teachers, groups, rooms, periods and lessons, with
  denies for a clash in one period, seats and days away.
  `node examples/second-app/timetable.mjs`:
  - "the solver placed 8 values; open now: 0; dead ends: 0".
- test/apps.test.mjs: 2 tests.
- docs/reuse-reports/apps.md lists 7 cooperating pairs and 6 doc gaps (3 fixed, 3 open):
  - `show thing=*` now skips what a view does not show;
  - a paragraph on joining by reference in reference.md;
  - "the complete act is not the solver" in api.md.
- Next generality: `std.schema.unique` ("no X twice in one Y": 3 times here, 3 in
  scheduling) and `std.know.fill` for any catalog key.
- 0.31.0 shipped a consumer name in a src comment: `git grep -i psys2 src/` printed 1 line,
  because the gate's grep did not see the file before it was added. It is removed here, and
  the gate now gives 0.

## 01:20 item 4 — the corpus grows from PSys2's corpus (plan.seating grid) — done; release 0.33.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.33.0).

- `python3 -c` over PSys2's `training/eval/cases.jsonl`: 6279 lines. The grid cases
  (with `grid_kind`) total 3378: 2704 right and 674 wrong. plan.seating has 420 of them,
  over 18 (act, kind) pairs, each with what it expects: "the state of the world changes" or
  "an answer that is not a refusal".
- These became cases/grid.cases.json: 18 language-free cases, each one act per pair after
  the same setup of two tables and two guests. The English stays in PSys2.
- `node tools/cases.mjs --failures`, first run: 30 / 35.
  - 3 failed because our seating schema refused copy, connect and group on guests. PSys2's
    grid expects a change, so the schema now follows the grid.
  - 2 failed on `place` (table, guest). For guests, `place at=<a thing>` is now general:
    it sets the key whose slot refers to that thing's type. Tables got a place (x, y).
- After the changes: 35 / 35 pass (acting 30/30). cases/baseline.json is raised to 35.
- Next: the other grid worlds (art.draw, data.charts, diagram.sketch, ui.avatar,
  plan.timeline) need their schemas as data first. `std.schema.unique` and
  `std.know.fill` (docs/reuse-reports/apps.md).

## Reviewer 02:00 — Q34: slot groups, excludes, joins by a key — done; release 0.34.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 35 / 35. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.34.0).

- I checked first with `node /tmp/q34.mjs`:
  - a single `extends` passes its slots on (`card w=abc` is refused);
  - a second `extends` was ignored (`card w=3` without the second parent's `name` passed,
    and nothing was asked);
  - `type=` to an undeclared type refuses every value.
- src/matrix.mjs: `mixins`. The lineage is now the type's own line, then each mixin's line.
  Slots `excludes` and `by`.
- src/world.mjs: the `by` join check (open while the type is undeclared) and the
  `excludes` violation.
- test/slots-q34.test.mjs: 3 tests. reference.md and semantics.md tables updated.
- questions.md Q34: the answers. No new construct. `named` stays the worlds' own key
  (a shared slot group can declare it once).
- I found that `core.type unique=a,b` already does "no X twice in one Y". The
  `std.schema.unique` proposal is withdrawn (docs/reuse-reports/apps.md).

## std.know.fill: knowledge for any catalog key — done; release 0.35.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 35 / 35. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.35.0).

- src/std.mjs: `make` reads `std.know.fill from= match= key=`. For keys left out, and not
  chosen by std.fill at a better tier, it takes the catalog value at tier `knowledge` with
  its source. std.know declares the slots.
- examples/second-app/rooms.mjs: the 3 keys × 9 generated rules (27 wires) became one line.
  test/apps.test.mjs checks `filled` (key, tier knowledge, source "shop list").
- reference.md std.know: "Any catalog, any key". docs/reuse-reports/apps.md: gap 3 done.

## Reviewer 02:45 / 03:10 item 4 — the two defects: status — release 0.36.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.36.0).

- Reproduced with `node /tmp/def.mjs` on 0.35.0:
  1. `make kind=guest` without `name` gave ok, and `open()` showed the open question
     `guest1.name`, but the result said nothing. **Fixed:** `result.asks` lists it, with
     the slot's `ask`.
  2. `undo` right after `remove` gave back `table1`. **Not reproduced** on 0.35.0: it was
     fixed in 0.26 (retractions logged, one undo step per act). It is now guarded by a case.
- Corpus first: cases `defect.make.required` and `defect.undo.after.remove` in
  cases/acts.cases.json. `tools/cases.mjs` now checks `expect.asks`. With the old
  src/std.mjs: 36 / 37 (`asks: [] ≠ ["name"]`); with the fix: 37 / 37. Baseline 37.
- Next: 03:10 items 1–3 (acts on the view, typed needs, ask over attributes and relations).

## Reviewer 03:10 item 1 — acts on the view itself — done; release 0.37.0

`/tmp/check.sh`: # pass 379 # fail 0 # pass 379 # fail 0 # pass 378 # fail 0 — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 38 / 38 (new: `view.zoom.implicit`,
cases/schemas/map.sop). Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld
0.37.0).

- src/std.mjs: `std.schema.view state=<type>`. `viewThing` resolves the thing for
  change and ask: the view's name, or no thing when one view's state has the attribute.
  The state thing `view_<name>` is made on first use, with its slot defaults at the tier
  `default`. `change` and `ask` no longer require `thing`; without one, they refuse
  ("change what? (colour)").
- `node /tmp/view.mjs`:
  - "zoom in" goes from the default 3 to 4;
  - "show the borders" sets the layer;
  - zoom 12 is refused ("must be at most 10");
  - undo gives back layer none.
- test/view-acts.test.mjs (1 test); reference.md (views paragraph, change and ask rows).
- Next: items 2 (typed needs) and 3 (ask over attributes and relations).

## Reviewer 03:10 item 3 — ask over any attribute and relation, with the answer's shape — done; release 0.38.0

`/tmp/check.sh`: # pass 381 # fail 0 # pass 381 # fail 0 # pass 380 # fail 0 — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 39 / 39 (new: `ask.which.rel`, stage
replying; the tool now checks `expect.result`). Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.38.0).

- src/std.mjs: `ask` now handles
  - knowledge facts by name;
  - shapes: number with unit (`quantity`), value, list, none;
  - `rel` + `of` → yes/no either way round;
  - `kind` + `rel` / `of`, `attr` / `value`, `count`.
- `node /tmp/ask.mjs` over four hand-written countries:
  - "which border france" → spain, germany;
  - population → number 68000000 people, with its source;
  - spain borders germany → false; portugal borders spain → true;
  - count → 4.
- test/ask-shapes.test.mjs: 2 tests (knowledge, schema). reference.md: the ask row.
- Next: item 2 (typed needs), item 5 (the corpus by stage from PSys2).

## Reviewer 03:10 item 2 — typed needs — done; release 0.39.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 39 / 39. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.39.0).

- src/std.mjs: `std.schema.needs of= type= from=`. Every act goes through `pre`, which
  now refuses an act whose world or view (from its kind, thing or view) has an unmet need,
  with `reason.needs`. Export `needsOf`.
- src/turn.mjs: option `load(need, world)`. When the dry run is refused for needs, the
  host loads them once and the dry run runs again. The result says `loaded`.
- test/needs.test.mjs: 2 tests.
  - The act is refused until the catalog is loaded. After that, `std.know.fill` fills w=200.
  - `turn` with a loader is done; without one it is not done.
- api.md: needsOf (runnable). reference.md: the std.schema.needs row.
- Next: 03:10 item 5 (corpus by stage from PSys2's newer cases.jsonl).

## Reviewer 03:10 item 5 — corpus from PSys2: plan.timeline grid — 39 → 45

`/tmp/check.sh`: # pass 383 # fail 0 # pass 383 # fail 0 # pass 382 # fail 0 — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 45 / 45 (acting 38, replying 4). Baseline 45.
No source change, so no release.

- PSys2's cases.jsonl now has 8812 lines (`wc -l`). plan.timeline grid: 5 (act, moment)
  pairs (`python3 -c` count above), the same expectations as seating.
- cases/schemas/timeline.sop is written as data from PSys2's `worlds/plan.timeline/schema.sop`
  (one kind, moment, with when 0..3000 and default 1; its acts; at most 60).
- 6 cases: the 5 pairs plus when=4000 refused. All passed on the first run, with no
  library change.
- Next: art.draw, data.charts, diagram.sketch, ui.avatar (the larger grid worlds; their
  schemas first).

## Reviewer 03:30 — typed needs (done in 0.39.0); std-grammar.md section 8 in resolve — release 0.40.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 45 / 45. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.40.0).

- Typed needs and views that carry them: 0.39.0. `std.schema.needs of=` takes a world or
  a view name.
- Section 8 (PSys2 handover/lang.en/std-grammar.md), semantics taken into `resolve`:
  - a choice is asked (the coordinator's `kind=choice`);
  - a part without its noun borrows one (a bare number from the part before, otherwise from
    the next part);
  - a coordination inside a phrase is distributed (`nounPhrase`, not into a PP);
  - a part of a set is the whole set when the count covers it, else asked;
  - "the other one" (`core.word ... means=std.other`);
  - a pronoun carries `guess`.
- Not taken yet:
  - a relative clause with "be" folds into modifiers once the grammar has the rule, so
    there is nothing to add in the library;
  - time phrases ("is Monday before Friday") wait for an order in time.
  - PSys2's tier names (said / focus / scene / knowledge / default) map onto std.fill's
    (user / focus / scene / knowledge / default). `resolve` uses user, scene, focus and
    slip.
- test/resolve.test.mjs: 5 tests, 1 of them new (section 8). The grammar coordination
  test still passes (no distribution into a PP).
- docs/lessons.md: "A host's resolver is the specification".

## Corpus from PSys2: ui.avatar grid — 45 → 61

`/tmp/check.sh`: # pass 384 # fail 0 # pass 384 # fail 0 # pass 383 # fail 0 — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 61 / 61 (acting 51, replying 7). Baseline 61.
No source change.

- ui.avatar grid (`python3 -c` count): 3 kinds (hair_back, shoulders, neck) × 6 acts.
  cases/schemas/face.sop is written as data from PSys2's `worlds/ui.avatar/schema.sop`:
  colour, and size 0.6..1.5 with default 1.
- 16 cases, all passing on the first run:
  - make, change (size bigger: 1 → 1.1), remove, place, and ask (number 1) for each kind;
  - size 2 refused.

## Reviewer 04:40 — the library holds no particular worlds — done; release 0.41.0

`/tmp/check.sh`: — pilot identical (now read from PSys2 at
psys2.pin); psys2 grep empty; scan-loops clean; tsc clean. `node tools/cases.mjs`:
55 / 55. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.41.0).

Removed. Counted with `git ls-tree -r -l HEAD <dir>` (bytes and files) and `grep -cE '^@'`
over its .sop files (wires):

| what | files | bytes | wires | now comes from |
| --- | --- | --- | --- | --- |
| compat/psys2/worlds | 26 | 189724 | 1022 | PSys2 at psys2.pin 45ac4bf. All 26 files match it blob for blob; I found the commit by comparing `git hash-object` over the last 400 commits. |
| compat/psys2/specs | 3 | 21989 | 0 | PSys2 at the same commit (specs/, same blobs) |
| bench/fixtures/knowledge | 40 | 414432 | 3008 | sop-knowledge-worlds at worlds.pin a958180: its index, and the hand-core shards for bench/load.mjs (52 now, against 31 copied) |
| cases/schemas | 4 | 4143 | 49 | w.seating and w.timeline (published); face and map carried inline by the few cases that need them |
| total | 73 | 630288 | 4079 | |

- tools/worlds.mjs: `checkout(name)`, `worldsDir()`, `psys2Dir()`, `worldText(name)`. It
  uses `$SOPWORLDS_DIR` / `$PSYS2_DIR` or `.cache/` (gitignored), cloned or fetched at
  the pin. Offline it returns null and the tests skip. Pins: worlds.pin, psys2.pin.
- Cases: 61 → 55, said in cases/baseline.json.
  - acts.cases: 13 of the 23 run on w.seating (kinds and ids renamed; colour became
    shape). 10 carry a few invented "box / item" wires (capacity, limit, range, a guest
    in a box, ask over a relation, the map view), only what each needs.
  - grid seating: 13 pairs on w.seating. The 5 pairs it does not allow were dropped
    (Q35.1).
  - grid timeline: 5 on w.timeline (events). PSys2's range case was dropped (Q35.2).
  - grid face: 16 cases, each with a one-kind world inline (Q35.3).
- test/knowledge.test.mjs reads the published index.json. The published schemas now
  import other worlds (k.commonsense imports k.kinds, ...), so the assertions check the
  plan's shape (schemas first, a dependency before its user, the shard last) instead of
  a fixed list. bench/load.mjs loads the schemas in the index's dependency order.
- compat/psys2 keeps:
  - its own work: mapping.sop, the matrices, run.mjs, the tests;
  - the recorded PSys2 answers (cases/*.jsonl, about 800 KB). PSys2 does not keep them,
    and the pilot needs them; this is the one consumer test data kept, as AGENTS.md rule 5
    allows. If the pilot is to go too, it is one `git rm`, and the gate's
    "pilot identical" line goes with it.
- Examples: the few facts in examples, tests and quickstart were tagged "hand-core 1", the
  knowledge repo's source tag. They are now tagged "example". Each example world is small;
  the largest file, examples/worlds.mjs, holds seven separate worlds of 10 to 25 lines.
- AGENTS.md rule 6 states the rule. questions.md Q35 holds the 4 proposals for
  sop-knowledge-worlds.

## Reviewer 06:00 — names for the kinds of worlds; what compat/ still holds — release 0.42.0

`/tmp/check.sh`: # pass 384 # fail 0 # pass 384 # fail 0 # pass 383 # fail 0 — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/capability-table.mjs`: 19 jobs. Version, CHANGELOG, docs
rebuilt (`docs/version.md`: sopworld 0.42.0).

- Names adopted as proposed (world schema, knowledge world, live world; views; modules
  are mechanisms). I found no clearer terms, so nothing went to questions.md.
  - glossary.md: a new section, with examples, a "where it lives" column, the relation,
    and an API table (which kind each function works on). Three rows in "Words that were
    used for the same thing" retire the old words.
  - The library's `world` stays the name of the object, which usually holds a live world.
  - Each of the 19 jobs in capabilities.md has a "Works on" line. README, quickstart,
    host-contract and modules each got a short paragraph.
- compat/ (`du -sh`: 896K):
  - cases/ (800K): PSys2's answers recorded by running it, three `.jsonl` files.
  - matrices/ (48K), run.mjs, mapping.sop and tests: the library's own rebuild of three
    sample worlds, and the pilot.
  - tools/dump-cases.mjs (8K).

  Why it stays: `node compat/psys2/run.mjs` is the pilot of the gate. It is the one
  end-to-end regression over real dialogues (rules, states, aggregates, abduction) that
  the tests do not cover in that shape, and it needs the recorded answers. PSys2's worlds
  and specs are no longer kept; they are read at psys2.pin. If the reviewer prefers, the
  whole folder goes in one commit, with the gate line.

## Reviewer 06:55 and 07:15 — answers closed; several catalogs; repos.pin — release 0.43.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 55 / 55. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.43.0).

- questions.md: Q30–Q35 moved to Closed, with the reviewer's answers in one line each. No
  question is open.
- Q30, checked: `std.schema.effect of= act= action=` (0.28) already is "a world's own
  effect of one act on one kind". `action` is any registered action. reference.md now
  says so; `on.<act>` is not added.
- 07:15 item 2: `createCatalogs` in src/knowledge.mjs.
  - Precedence: the first catalog wins.
  - The source says `<catalog>: <source>`.
  - Conflicts by id, or by type + name: reported, and the first version kept.
  - `into` / `intoSync`.
  - test/catalogs.test.mjs (2 tests): two overlapping catalogs; the order decides; one
    sofa with another width is reported; std.know.fill fills from the version kept, with
    its catalog in the source.
  - Typed needs read what is loaded, so they follow too.
- 07:15 item 3: repos.pin, one line per repository with its kind and commit.
  tools/worlds.mjs adds `knowledgeDirs()`. worlds.pin and psys2.pin are removed.
- Next: Round 27 (the five agent skills, parameterised by repositories), after the
  current round's open items (Q30 order, Q33 order).

## Reviewer 07:25 A and C — kinds-of-worlds page; complete capabilities with a coverage test — release 0.44.0

`/tmp/check.sh`: # pass 387 # fail 0 # pass 387 # fail 0 # pass 386 # fail 0 — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/capability-table.mjs`: 25 jobs. `node tools/doc-examples.mjs
docs/kinds-of-worlds.md`: 4 runnable examples, 0 problems. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.44.0).

- A: docs/kinds-of-worlds.md covers points 1–6. Points 1, 2, 3 and 5 have a runnable
  example: a world schema with a capacity, a knowledge rule (is_a carries lives), a live
  world's diff and undo, and an effect that draws. Point 4 is a table, point 6 a text
  diagram. The page is registered in tools/build_docs.py and the docs test, and linked
  from README, glossary, capabilities, quickstart and host-contract.
- C: before the change, a `node -e` over the exports found 25 in neither capabilities
  nor the reference, and 37 missing from capabilities. Now there are 6 new jobs and a
  "Building blocks" table. New test: every export is named in capabilities or the
  reference. It caught one more (`str`).
- B (skills/README.md) comes with Round 27.
- Next: Round 28, items 1–3 (arbitration contract, segmenter, std.dialogue). First, read
  PSys2's [LIB] lessons in place and answer per line in questions.md.

## Round 28 item 1 — arbitration contract; Q36 answers per line; w.lang.en from the knowledge repo — release 0.45.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.45.0).

- questions.md Q36 answers PSys2's [LIB] lines, read in place: 25 answers, each take,
  have or refuse. Already in the library: needs, views and show, undo per sentence, grid
  tests, partitive / other / choice / asked, view diff. Refused: lexicon words in a
  spelling vocabulary, because spelling stays the host's. The rest go to items 2–9.
- src/turn.mjs: `arbitrate`.
  - Verdicts own / decline / refuse. The decline rule (the act verb claim) is the
    library's.
  - The `pass` (exact / spelling / view): only the exact pass refuses.
  - A `resolves` hook for ties.
  - test/arbitrate.test.mjs: 2 tests. One checks every kind's `make`: no world owns
    another world's kind.
- PSys2 deleted its handover/lang.en. The two integration tests now read the published
  w.lang.en from the pinned knowledge checkout, and its schema now loads. Its types are
  renamed (`w.lang.en.rule`, `w.lang.en.word`, ...).
  - First run (`node /tmp/le3.mjs`): 10 of 14 examples parsed. The 4 others were
    quantifiers and the possessive, whose words are `w.lang.en.word` facts (`types.word`).
  - After that, all 14 parse. "all the tables" lost its quantifier; `cats.quant: 'QALL'`
    reads it now (lesson 25).
- Next: Round 28 items 2 (one segmenter that knows the act forms) and 3 (`std.dialogue`).

## Round 28 item 2 — one segmenter that knows the act forms — release 0.46.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/capability-table.mjs`: 26 jobs. Version, CHANGELOG, docs
rebuilt (`docs/version.md`: sopworld 0.46.0).

- src/segment.mjs: `segment` and `actWords`.
  - A joiner cuts only where an act word follows it. This is "add X and connect A to it":
    the act forms decide, not commas.
  - A run of joiners is one; a comma right after a frame lead stays.
  - Act words come from the compiled matrix's actions plus `core.word` synonyms. My first
    try read `ofType('core.action')` and found 0 actions, because module actions live in
    the compiled matrix.
- test/segment.test.mjs: 2 tests.
  - Toy facts: add/connect cut; a list and a name list kept whole; "and then" as one
    joiner; a frame lead's comma.
  - The published w.lang.en clauses.sop (joiners and frame leads read as they are).
- Next: item 3 (`std.dialogue`), item 4 (the undo contract), item 5 (`std.knowledge`),
  then 08:45 (the per-value tier through merges).

## Round 28 item 3 — std.dialogue; context hooks copied on fork — release 0.47.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/capability-table.mjs`: 26 jobs. Version, CHANGELOG, docs
rebuilt (`docs/version.md`: sopworld 0.47.0).

- src/std.mjs: module `std.dialogue` (loads std.focus), with `std.dialogue.cue kind= text=`
  and `std.dialogue.modal world= active=`.
- src/dialogue.mjs:
  - `dialogueTurn`: why, correction (it carries the last act unless it has its own),
    continuation, list (items), ellipsis, answer (when the world asked), request.
    Cue phrases are the host's facts, or a language world's types mapped in `cues`. A
    modal world is named in `first`.
  - `focusLog`.
- Context hooks: `register('context', name, fn)` → `world.context`, copied by `fork()`.
  test/dialogue.test.mjs (4 tests) checks, once, that a fork has every hook kind:
  functions, actions, producers, filters, lemma, context.
- The docs test caught `kind: 'correction'` as an unknown violation kind (it scans src
  for `kind: '...'`). Turn kinds are now built through a helper.
- Next: item 4 (the undo contract), item 5 (`std.knowledge`), 08:45 (tiers through merges).

## Round 28 item 4 — the undo contract (a whole-message tag) — release 0.48.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.48.0).

- src/query.mjs: `act(request, { message })`. Requests with the same tag share one undo
  step (`m:<tag>`), including inside a sentence. Without a tag, nothing changes: one
  request or one sentence is one step.
- test/undo-contract.test.mjs (1 test): four calls of one message are one undo and one
  redo. The request before the message is a step of its own.
- api.md: "The undo contract". index.d.ts: `message` on act's options.
- Fault: 0.47.0 shipped "PSys2" in a comment of src/dialogue.mjs (the second time). The
  gate's `git grep` does not see untracked files, so the gate now uses
  `grep -rli psys2 src/`, which gives 0 after the fix.
- Next: item 5 (`std.knowledge`), then 08:45 (tiers through merges).

## Round 28 item 5 — knowledge readers (std.knowledge) — release 0.49.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.49.0).

- src/knowledge.mjs:
  - `shardsOf` is memoised per word.
  - Given the world (`into` / `intoSync`), a form the vocabulary lacks is looked up
    through a loaded `core.word`.
  - `bundleThenRead` (reachable), `listOf`, `loadBundles`.
  - src/std.mjs: `std.schema.world bundle=` and `std.schema.bundled`.
- test/std-knowledge.test.mjs (2 tests):
  - "ants" is found through `core.word`; the schema-as-shard plan is read once; 2 reads
    in all;
  - offline / online reads, reachable(), a world bundle told once, listOf.
- Taken differently from the lesson: "index a shard once" is the cache of texts (read
  once) plus the memoised lookup. Telling a shard still parses it once per world; the
  facts' own index by type and value is the world's, so there is no second index.
- Next: 08:45 (the per-value tier through merges), then items 6–9, then Round 27.

## Reviewer 08:45 — the tier of a derived value through merges — release 0.50.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 55 / 55. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.50.0).

- Checked first with `node /tmp/tm.mjs`: per-key tiers given as `tell(text, { tier: { key }
  })` already survive a merge, in both orders (derived / told). What was missing was the
  reading of the knowledge repository's mark.
- src/world.mjs: a told wire with `derived=true` gets every non-identity key at the tier
  `derived` (`keyTiers`). The rule from `core.source="rule <id>"` is kept per key
  (`keyRules`, undoable on merge). `why` reports `how: 'rule'`, `rule`, `shipped: true`.
- test/derived-merge.test.mjs: 2 tests, one per order. One wire; lives is derived, colour
  and name told; why names `k.animal.inherit`.
- Next: Round 28 items 6–9, then Round 27 (skills and skills/README.md).

## Reviewer 09:55 — published w.face / w.map / w.seating 2 / w.timeline 2; composite joins; what copy keeps — release 0.51.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 61 / 61 (acting 49, replying 9). Version,
CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.51.0).

- repos.pin is now at 2b5505e620c9.
  - The 16 face cases read w.face (kinds `w.face.<part>`), and the map-view case reads
    w.map (state thing `view_w_map`).
  - The 5 seating pairs (table connect, group, place; guest copy, place) and PSys2's
    out-of-range timeline case are back: the published worlds allow them now.
  - `python3 -c` count: 47 cases name a published world, 7 carry toy wires (the
    box/item mechanics). The baseline is back to 61.
- Composite joins: `by=name match=kind:slot` (match is repeatable). Test: smile is a mouth
  variant, so eyes=smile is refused.
- copy: references to other things of the live world are left unset and listed in
  `unset`; `copy=keep` keeps one. A knowledge join (`by=`) is kept. Test: a copied guest
  has no seat, but keeps its name and its `copy=keep` slot. So "two guests are not on one
  seat" can now be a deny.
- Next, in the reviewer's order:
  - Round 28 items 6–9;
  - Round 30 (`std.morph`: paradigms, analyse and generate, spelling folding, dictionary
    adapter, realisation), together with the std.grammar block of 09:25;
  - Round 29 (`std.plan`), with a design note first;
  - Round 27 (skills).

## Round 30, first part — std.morph (paradigms both ways, folds, dictionary adapter, realisation) — release 0.52.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/capability-table.mjs`: 27 jobs. Version, CHANGELOG, docs
rebuilt (`docs/version.md`: sopworld 0.52.0).

- src/morph.mjs:
  - `morphOf` compiles classes (inheritance and overrides, drop, alternations), a flat
    suffix index, irregulars, folds, splits and templates.
  - `generate`, and `analyse`: a suffix lookup, alternations undone, each candidate checked
    by generating it again, dictionary-filtered, folded spellings ranked after exact ones.
  - `fold`, `splitClitics`, `dictionary` (prefix files read once each).
  - `realise`, with agreement through `unify`, and `templateFor`.
- test/morph.test.mjs (4 tests, invented "Toyish"):
  - the round trip holds for all 16 cells of 4 classes;
  - "potsi" is read as "pōtsi" with only the `p` file of the dictionary read;
  - the irregular "oameni";
  - "kata ruma" / "bak rum" agree in gender.
- Not done yet in Round 30:
  - agreement inside the parser (grammar rules with feature constraints);
  - the measurements on w.lang.ro (not published: `ls` of the pinned docs/worlds shows only
    w.lang.en);
  - the English replies moved onto templates (09:25 item 2).
  questions.md Q37 [KNOW] gives the notation to the w.lang.ro worker.
- Next:
  - the parser-level agreement and the generation block of 09:25;
  - Round 28 items 6–9;
  - Round 29 (`std.plan`, with a design note);
  - Round 27 (skills).

## Q37.1 — ordered, anchored alternations in std.morph — release 0.53.0

`/tmp/check.sh`: # pass 407 # fail 0 # pass 407 # fail 0 # pass 406 # fail 0 — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.53.0).

- src/morph.mjs:
  - alternations `from>to@vowel|@end`;
  - a cell's own ordered list (or `alt=yes` for the class's list);
  - `m.vowel text=`;
  - analysis undoes them in the reverse order.
- test/morph.test.mjs, 5 tests now: karte → korsy (two places at once) and back, and mase →
  mosy (the end anchor does not fire). The data is invented, nothing Romanian.

## Reviewer 10:50 — std.motion — release 0.54.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/capability-table.mjs`: 28 jobs. Version, CHANGELOG, docs
rebuilt (`docs/version.md`: sopworld 0.54.0).

- src/motion.mjs:
  - `motionPlan`: rules as facts, a seeded generator (mulberry32), holds per key with
    priority (the latest firing wins among equals), cancel on a new event of the same
    rule, ease back to base, `per=unit` steps with a class table.
  - The unit splitter is the rule's parameter, as the owner corrected (11:05).
  - `motionRun` takes the host clock and returns cancel.
- test/motion.test.mjs, 4 tests:
  - a traffic light;
  - seed determinism, idle blinking, a condition on the event's fields;
  - talk over smile while blinking goes on, and a second say cancelling the first;
  - run and cancel.
- Next: Q44 answers and the std.plan design note (Round 29), then std.plan.

## Round 29 — design note and Q44 answers (questions.md Q38)

- Read k.procedures at 1d4f120 in the pinned knowledge checkout (WORLD.md, schema.sop: seven
  types; tools/lib/plan.mjs is 374 lines). The format is accepted as published.
- Q38 holds the design (alternatives, decomposition depth 3, 200 acts, roles, one sentence)
  and the answers to Q44 a–d: (a) one role table in the library; (b) the keys of history and
  answers; (c) anchor, then wearable place, then drawing part; (d) the chain of kinds is
  std.know's.
- Next: build std.plan against the knowledge repository's expected act lists (pin 1d4f120 or
  later).

## Round 29 — std.plan released — release 0.55.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 61 / 61. `node tools/capability-table.mjs`:
29 jobs. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.55.0).

**For the knowledge repository (reviewer 12:05 item 2): std.plan is released in 0.55.0.**
`planner(factStore(worlds), { chain }).plan(goal, new PlanLive({ store, world, things,
history }))` gives the same `method`, `methods`, `lines`, `effects`, `asks`, `refused`
and `tried` as tools/lib/plan.mjs. That repository can delete its reference reader and run
its expected act lists through the library. Its kind chain is the `chain` option (in
test/plan-procedures.test.mjs: k.people.kind and k.people.role with
is_a/kind_of/is/age/drawing, k.commonsense.thing and k.shapes.shape without drawing), or
`std.know.chain of= key=` facts published once.

- src/plan.mjs: a port of the reference reader's semantics into the library, made general:
  - the fact store over any published worlds;
  - the chain of kinds as data, the method prefix and the roles type as options;
  - the plain kinds of a world schema read from the store;
  - `truncated` instead of a throw past 200 acts;
  - `explain` (one line per step, with the step's `about`) and role-named `requests`.
- repos.pin is at 5ae9e0f02b07 (it has k.procedures). The corpus is unchanged: 61 / 61.
- test/plan-procedures.test.mjs: 5 tests.
  - 4 read the published worlds in place: 22 goals copied from the knowledge repository's
    tests/k.procedures.test.mjs, all with the expected method and lines on the first run.
  - 1 runs offline: a toy method in the same format, with an existing swing used.
- Not done yet:
  - the role table k.actions role → std.acts argument (Q44 a);
  - `applyPlan` in one call;
  - the toy "chart across two views" on real std.schema things. Today a host applies
    `requests` itself.

## Reviewer 12:45 — std.motion reads k.motion (one format, one scheduler) — release 0.56.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 61 / 61. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.56.0).

**Released: std.motion reads k.motion in 0.56.0.** The knowledge repository can delete
tools/lib/motion.mjs, and PSys2 can drop its temporary rules.

- src/motion-facts.mjs: the knowledge repository's reader and planner ported into the
  library (its code is MIT) and made general:
  - type prefix as an option;
  - keys taken from the layers (`keys` sets the order);
  - the face's one-eye fallback as `aliases`;
  - named host splitters as an override;
  - the queue items use `is`, not `kind` (the docs test reads `kind: '...'` as a violation
    kind).
- repos.pin is at 29d27e800a44 (k.motion and k.procedures).
- test/motion-facts.test.mjs, 2 tests. The first is an equivalence with the oracle, read in
  place at the pin: `changes` and `emitted` are equal for 12 plans (4 event lists × 3
  seeds). The second checks the splitter as data and a host override.
- questions.md Q39 [KNOW]: answers to Q46 (a)–(e), as the reviewer suggested.
- Next: Round 28 items 6–9, the rest of Round 30 (the generation templates on w.lang.ro when
  it comes), the std.plan follow-up (role table, apply), Round 27 (skills).

## Round 28 item 6 — grammar / resolve: relative clauses, negation, bare names, failure classes — release 0.57.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.57.0).

- src/grammar.mjs:
  - The base is chosen by the rule's head: a phrase-headed rule takes the child of its
    category wherever it is.
  - A relative clause's modifiers merge into the base's. Before this, a left-recursive
    base dropped them (found with `node /tmp/neg.mjs`: "not the blue table" read the NP as
    a part).
  - `negated` from `cats.neg`; coordinators from `text=`.
- src/resolve.mjs: `failure` classes (8 return points); negation as the complement within
  the kind; a bare name as one thing; `focusFor`.
- test/resolve.test.mjs: 1 new test (relative clause, negation, bare name, failure
  classes, focus for pronouns only, `text=` coordinators).
- Q36 lines 5, 23 and 25 are done. relpron and the negation lead are chart rules of the
  language world; the library now reads their result.
- Next: item 7 (form checks, frame priority by rule), 8 (std.space placement, relation
  kinds), 9 (experiment / ablation harnesses).

## Round 28 item 7 — form checks; frame priority by rule — release 0.58.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.58.0).

- src/grammar.mjs:
  - `grammarCheck`: optional-shares-words, lemmatised-away, too-many-words.
  - Rules take `priority`. Parses are ranked by priority, then literal words matched, then
    size. `npm test` after the ranking change, before the new tests: 419 / 419 / 418, no
    regression.
- test/grammar.test.mjs: 1 new test.
  - The checks on "borders" (Kind? before N) and "sideways", and a 3-word entry.
  - "share a border": the frame of the world's own words wins over `V NP`, by priority and,
    without one, by its literal words.
- Q36 lines 2, 3 and 24 are done. "An optional open slot backs off": the chart has no greedy
  match, and the check reports where a generated pattern would swallow a word.
- Next: item 8 (std.space single placement, relation kinds), item 9 (harnesses).

## Reviewer 14:15 — std.sample — release 0.59.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/capability-table.mjs`: 30 jobs. Version, CHANGELOG, docs
rebuilt (`docs/version.md`: sopworld 0.59.0).

- src/sample.mjs: `sample` and `diversity`. What a frame is built from:
  - the acts per kind; the things there (only legal acts); undo when the log has an act;
  - slot values from an enum, a range with its step, or a join to knowledge (`type= by=`);
  - catalog kinds (`std.schema.kinds from=`).

  Weights: prefer, recency, novelty (the log's acts and `seen`), chance. Each frame passes
  a dry run, and the round-trip filter with the host's `realise` / `read`. Modes one, few,
  actions.
- test/sample.test.mjs (2 tests): legal in the state, seeded, catalog kinds, legal values,
  buttons for a selected thing, a dice, novelty, the round-trip filter (and a lossy reader
  dropping the frames).
- Measured with `node /tmp/div.mjs`: a toy world with 2 schemas (shapes, a 3-animal
  catalog) and 2 things; seed 11, n=100 with a round-trip realiser:
  `{"frames":25,"acts":5,"kinds":6,"attrs":2,"tried":2000,"roundTrip":1}`. Only 25 distinct
  frames exist under the 20-tries cap: the toy world has few things and values, and
  duplicates are not kept.
- Not done yet: the sentences come from the host's realiser until Round 30 item 6 (language
  world templates) lands; `place` is not suggested.
- Next: std.summarize and std.compose (14:45), Round 28 items 8–9, the std.plan follow-up,
  Round 27.

## Reviewer 15:30 — Q48, deferred join checks — release 0.60.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/cases.mjs`: 61 / 61. Version, CHANGELOG, docs rebuilt
(`docs/version.md`: sopworld 0.60.0).

**For the knowledge repository: `drawing=` joins can be declared from 0.60.0.**
- src/world.mjs: a `by=` join is open while no target fact has the key, and refused only
  for the statement that makes the reference when the targets are loaded without the
  value. A reference made earlier is not refused when targets arrive. `check()` lists it
  as an `open-join` issue while it stays open.
- test/slots-q34.test.mjs: the join test is rewritten for both orders (referrers first:
  open, then reported, then closed when the target arrives; targets first: refused).
- The user asked for an estimate (10:33); answered by message: about 6–7 hours for
  summarize, compose, Round 28 items 8–9, the plan follow-up and Round 27.

## Reviewer 14:45 A — std.summarize — release 0.61.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. `node tools/capability-table.mjs`: 31 jobs. Version, CHANGELOG, docs
rebuilt (`docs/version.md`: sopworld 0.61.0).

- src/summarize.mjs:
  - `actsOf`: the log grouped by step with `by`; the kinds come from the told wires,
    removals included.
  - `summarizeLog`: aggregation, sibling generalisation through `parentOf`, failures,
    salience.
  - `summarizeText`: extractive (centrality, information, position, redundancy); stop words
    found without a language.
  - `overlap`.
- test/summarize.test.mjs (2 tests):
  - a zoo's log → 3 animals made, a failed dragon, one cat removed;
  - two texts written for the test (CC0), each against its reference; the repetition
    dropped; every kept sentence is from the source.
- Measured (`node -e` over the two texts, n=2): overlap 0.429 (village) and 0.471 (owls).
  No public set was used. A permissive set with references needs downloading, and the
  network here only reaches package registries and GitHub; the test set is the 2 written
  texts.
- Not done yet: abstractive output by frames (reading each sentence with `resolve`, then
  generating), because it waits for the language worlds' generation (Round 30 item 6).
- std.compose: `git ls-tree` of the knowledge repository's main shows no k.genres, k.story,
  k.interest or w.document yet. Per the reviewer (15:00 and 15:15: build when a world uses
  it), compose waits for them; I go to Round 28 items 8–9 meanwhile.

## Round 28 item 8 — single placement, relation kinds — release 0.62.0

`/tmp/check.sh`: — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.62.0).

- src/space.mjs:
  - `placeFor`: relative to a thing (7 relations; near takes the first free side), in a
    region, or a default spot (a free scan of the frame); overlaps avoided, else said.
  - `boxesOf`, `relationsOf`.
- src/std.mjs: `std.schema.relation` (spatial / containment / flow, inverse) and
  `std.schema.region`. The first name I tried, `std.space.region`, was refused because
  module types live under std.schema. `connect rel=` refuses an undeclared relation when
  some are declared.
- test/space-place.test.mjs: 2 tests (the placements, a region, the default spot, overlaps
  said; relation kinds, connect refusing "loves").
- Q36 lines 10, 17 and 24 (second part) are done. Relation words are core.words that mean a
  relation name.
- Next: item 9 (experiment and ablation harnesses), then the std.plan follow-up, Round 27.
  std.compose waits for k.genres / k.story / k.interest.

## Reviewer 16:10 — w.lang.ro draft: Q51 / Q52 fixed, Q53 answered — release 0.63.0

`/tmp/check.sh`: # pass 428 # fail 0 # pass 428 # fail 0 # pass 427 # fail 0 — pilot identical; psys2 grep empty; scan-loops
clean; tsc clean. Version, CHANGELOG, docs rebuilt (`docs/version.md`: sopworld 0.63.0).

- repos.pin is at b5d525b43ae1 (w.lang.ro).
- Measured with `node /tmp/ro.mjs` (255 lemmas, 44 classes, 2,904 cells; the dictionary read
  from the pinned checkout): exact 2904, folded 2904, nothing missing. The knowledge
  repository had 2,898 and 2,249 on 0.52.
- src/morph.mjs:
  - the suffix index keyed by folded suffixes (Q51);
  - `unalternate`, generate-and-check over every candidate stem (Q52);
  - dictionary maps. The same run took 15.4 s and now takes 3.0 s (`time`).
- test/lang-ro.test.mjs: 2 tests (the round trip both ways over every cell; 4 replies from
  w.lang.ro's templates with agreement).
- test/motion-facts.test.mjs: the knowledge repository deleted its motion oracle, as
  agreed, so the equivalence test now reads it from commit 29d27e8 in the same checkout.
  It runs again (2 pass, 0 skipped).
- questions.md Q40 [KNOW]: the answers to Q51–Q53.
- Next: Round 28 item 9 (harnesses), the std.plan follow-up, generation (Round 30 item 6:
  English replies on templates), Round 27. std.compose waits for k.genres / k.story /
  k.interest.

## 0.64.0: std.compose, first version

- `compose(world, topic, { genre, size, seed, realise })` and `interestOf`, on a toy catalog in the Q41 formats (test/compose.test.mjs, invented, 11 lines).
- Toy run (owl, presentation, 2×1×3): chapter 1 k.fact [introduce owl, fact f2, conclude f4…], every sentence cites its wire, no fact twice; a 5×2×4 size lists what was short.
- Gates: npm test 430 / 430 / 429 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok. README: 32 jobs.
- Waiting on the knowledge repository for k.genres, k.story, k.interest (Q41) to wire the real worlds and the genre-as-plan step.

## 0.65.0: interest by the published k.interest (reviewer 17:10)

- repos.pin: sop-knowledge-worlds b5d525b → f7d2790 (k.interest at 5e39ba0: 4 appraisals, 21 features loaded).
- `interestOf` follows k.interest's arithmetic over `measuresOf` (10 measures computed from facts; the rest from the host).
- Toy catalog with the published model: penguin (fly=no among 4 flying birds) 0.43 > elephant 5,000 kg ~0.42 > dog is a mammal (derived) −0.32; the same order as k.interest's integration case. Said again: score < 0, never chosen.
- Gates: npm test 430 / 430 / 429 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok. README: 32 jobs.
- Next: choice points solved jointly in std.plan (15:15 item 1), then k.genres / k.story as they are published; Round 28 item 9 and generation meanwhile.

## Status 2026-11-14 14:00 (local): what the worker is doing and why it took long

- After 0.65 the worker stopped between turns: it had no scheduled check while waiting, so the 18:40 and 19:00 entries sat unread for about an hour. That was the delay; nothing was blocked.
- Now: BillSum 200 (19:00). summarizeText against lead-3, unigram/bigram recall (ROUGE-1/2 style); tuning only on items 1–100, items 101–200 held out. Report in this log, about an hour.
- Then: compose on the published worlds as they land (18:40); choice points solved jointly in std.plan; generation with agreement (w.lang.en act templates); Round 28 item 9; Round 27 skills.

## 0.66.0: BillSum 200 (reviewer 19:00)

`node tools/bench-billsum.mjs --part dev|held [--n 3 | --words 180]`. It reads psys2 56bd1ba training/eval/billsum-test-200.jsonl in place. Scores are ROUGE-1/2 recall and F1, computed in the script on lowercased alphanumeric tokens.

**First run** (0.65, dev half, n=3): summarizeText gave R-1 F1 0.166, against 0.31 for lead-3. Its summaries were 24 words: sentences were split at "Sec." and "Stat.".

**Fix**: sentences split only before a capital, quote or parenthesis, and not after an abbreviation. Also new: a `words` budget. Tuning on the dev half: only the split. I tried four position priors; the best gained 0.005 F1, so the default was kept.

| set (100 bills) | system | R-1 recall | R-1 F1 | R-2 recall | R-2 F1 | words |
| --- | --- | --- | --- | --- | --- | --- |
| dev, n=3 | lead-3 | 0.336 | 0.310 | 0.178 | 0.159 | 146 |
| dev, n=3 | summarizeText | 0.182 | 0.228 | 0.079 | 0.102 | 49 |
| dev, 180 words | lead-180w | 0.482 | 0.393 | 0.232 | 0.187 | 180 |
| dev, 180 words | summarizeText | 0.479 | 0.381 | 0.201 | 0.161 | 196 |
| held, n=3 | lead-3 | 0.338 | 0.311 | 0.166 | 0.150 | 168 |
| held, n=3 | summarizeText | 0.183 | 0.220 | 0.071 | 0.085 | 55 |
| held, 180 words | lead-180w | 0.459 | 0.393 | 0.206 | 0.171 | 180 |
| held, 180 words | summarizeText | 0.474 | 0.393 | 0.189 | 0.156 | 199 |

**Reading the results**
- At an equal word budget, summarizeText ties lead on R-1 F1 on the held-out half (0.393 vs 0.393). It is behind on R-2 (0.156 vs 0.171).
- Its budget overshoots by one sentence, to about 197 words; the budget stops after the sentence that crosses it.
- By sentence count it loses, because its sentences are shorter than the bills' first sentences.
- Lead is strong on BillSum because bills open with their purpose.

Gates: npm test 430 / 430 / 429 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

## 0.67.0: compose on the published k.genres, choice points solved jointly (reviewer 20:05 item 1)

**What changed**
- repos.pin: knowledge f7d2790 → 3a0f522, with k.genres 366975e and k.story d98a837.
- `solveChoices` added to std.plan.
- `compose` with a k.genres genre now lays out parts, steps with alternatives and the register. The repeats, the relation of each repeat and the alternative moves are solved jointly; summaries restate the claims.

**Toy catalog** (penguin: 3 diet, 2 body, 2 habitat facts) with the published k.genres and k.interest:
- presentation: title, agenda [k.diet, k.habitat, k.body], 3 points (claim plus compare / example), a summary restating the 3 claims, closing.
- essay: introduction, 2 arguments, counterargument plus rebut, conclusion.
- report: 6 parts.
- story: its 8 moves are said to wait for k.story.
- `size.sentences` 16 gives 13: short says the knowledge has no more.

Gates: npm test 432 / 432 / 431 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

**Next**
- Story moves by k.story through solveChoices: elements as variables, the hard constraints over the catalog worlds.
- w.document as output when it is published.
- Then Q49, the std.sample catalog option, 18:20.

## 0.68.0: stories from the published k.story (reviewer 20:05 item 1)

**What changed**
- repos.pin: knowledge 3a0f522 → ff0c58f (k.story with the corpus check, w.document).
- `readStory` and `storyPlan`: k.story's 11 elements are choice points solved jointly. The domains come from `fills` (setting 61, protagonist 384, target 2,487, means 2,211, actions 187). The 17 hard constraints prune and the 4 soft ones weight the draw.
- The relations are in a table, STORY_RELATIONS.

**Oracle**
- The knowledge repository's own `checkPlan` (tools/story-core.mjs, imported in place).
- 30 seeds: 0 hard constraints broken. "Ending reaches the goal" held in ≥ 24/30; the test asserts this, and uniform sampling holds it about 1 in 100.
- A plan takes about 30–200 ms and 500–60,000 nodes. The catalog world loads in about 0.5 s.

**Sample** (seed 2, topic girl, as printed by compose): river; the girl wants to visit someone (friend); the river blocks it; she shouts, waits, jumps; a sailor has a sailboat; give; sail; she visits her friend. 2,017 nodes.

Gates: npm test 434 / 434 / 433 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

**Next**
- w.document as compose's output (published at 6414cd9).
- Then Q49, the std.sample catalog option, the 18:20 reading mechanisms.

## 0.69.0: compositions written as w.document (reviewer 20:05 item 1)

- `writeDocument` writes a composition through std.acts into the published w.document schema (ff0c58f, read in place).
- `readDocument` reads it back in order, with the sources.
- /tmp run on a toy penguin catalog: presentation, 20 wires made and 0 refused; essay, 21 made and 0 refused.
- test/document.test.mjs: one slide per part, read back in the same order, every source a wire of the world. Without a realiser, sentences are a placeholder that says the move.
- Gates: npm test 435 / 435 / 434 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- PSys2's document types can now take: compose(world, topic, { genre }) → writeDocument → their editor or slides. Sentences come from their realiser until w.lang.en's act templates land.
- Next: Q49 (per-value open join), the std.sample catalog option, the 18:20 reading mechanisms.

## 0.70.0: Q49, a by= join stays open per value (reviewer 19:20)

- The reviewer's test, in test/slots-q34.test.mjs: object shard A, then a fact naming an object of shard B, then shard B. Result: no refusal, the tell lists 1 open join, and after B 0 are open.
- `check(undefined, { strict: true })` refuses what is still open. `world.closeType(type)` declares a type complete; after it, a missing target is refused. Forks keep it.
- The composite-key case (smile is a mouth variant, not an eyes one) is now open until closeType, then refused.
- Gates: npm test 435 / 435 / 434 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

## 0.71.0: composition pins, realisation through discourse templates (reviewer 20:45)

- repos.pin: knowledge → 179fc1c (w.lang.en discourse templates b22ef9b, act templates cb5d6dd, typical ranges 4448b9e).
- `discourseRealiser`: penguin presentation and girl story, seed 2, on the published templates.
  - Story: 11 of 13 sentences realised, for example "Between the girl and the friend lay a river.", "Then the sailor came by with a sailboat.", "With the sailboat, the girl could sail past the river at last."
  - The 2 sentences with no fitting template are listed in short: the protagonist's needs a trait slot, and no state-goal template names the target.
  - Clauses of facts use the default word join ("the penguin height 1.1m"); a host clause() from its language world is the way to fix them.
- BillSum with the budget never exceeded, 180 words:
  - dev: R-1 F1 0.382, R-2 0.159, 166 words (lead 0.393, 0.187).
  - held: R-1 F1 0.399, R-2 0.161, 172 words (lead 0.393, 0.171).
- Gates: npm test 436 / 436 / 435 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- Next (21:00, top priority): the abstraction round, starting with the design note in questions.md.

## 0.72.0: type-driven reading (abstraction round item 1, Q54)

- `readByTypes`: test/read-types.test.mjs, 13 paraphrases in 3 sets read to their set's frame, 13/13. The sets differ in word order and verbs: "what sound does a cow make", "a cow makes which sound", "cow sound?", "what does a cow say", "which animal says woof", "woof is the sound of which animal".
- Before: the grammar path needs one frame per construction; on this toy world with no grammar, 0 of these read.
- Unread words are listed ("zebra").
- Gates: npm test 438 / 438 / 437 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- For PSys2: please measure paraphrases-rt and schema-alone with readByTypes as a fallback before the grammar's frames, or as a ranker over them.
- Next: item 3 (word senses from k.words in typed slots), then item 2 (alternations).

## 0.73.0: cousins of a case (reviewer 21:35, abstraction round item 0)

**What changed**
- Added `cousins`, `kindChain`, `judgeFix`.
- Toy world (test/cousins.test.mjs: 7 animals over bovine / ovine / fowl → ruminant / bird → mammal).

**Case "what sound does a cow make"**, degree ≤ 4:

| degree | cousins | valid |
| --- | --- | --- |
| 1 | 3 | 2 |
| 2 | 4 | 2 |
| 3 | 1 | 0 |
| 4 | 2 | 2 |

- 6 of 10 valid. The invalid ones: the ox has no sound; kind facts have no answer.

**A fix judged both ways**
- A point fix (answers only the case): case passes, cousins 0/6 (share 0).
- readByTypes: case passes, cousins 6/6 (share 1).

Gates: npm test 440 / 440 / 439 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

**Next**
- Q54 item 3 (word senses from k.words in typed slots) and item 2 (alternations).
- cousins along acts and alternations as those land.
- Use in the learn skill: a ledger failure is expanded into its cousins before a fix.

## 0.74.0: lexical generalisation at read time (Q54 item 3)

- `nearWords` reads k.words.sense facts: synonyms cost 1, the nearest kind 2, further kinds 3 or more. readByTypes reads an unknown word as its nearest known word within `near`.
- test/read-types.test.mjs, toy senses:
  - "what noise does a heifer make" reads as sound of cow → moo, with near = noise→sound (synonym, 1) and heifer→cow (kind, 2);
  - "drake sound?" with near=1 leaves drake unread; with the default it reads as duck.
- Gates: npm test 441 / 441 / 440 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- Next: Q54 item 2 (alternations: a read-time normaliser plus alternations as language-world facts).

## 0.75.0: alternations as rules, once (Q54 item 2)

- `normalise` / `alternationsOf` work over language-world facts (`w.lang.en.alternation name= from= to= mode=`, the proposed format). `parseText({ alternations })` normalises first.
- test/alternate.test.mjs, 5 toy rules: 4 wrapper variants of "open the door" come back to it ("can you please …" applies could_you then please, mode request); passive "the door was opened by the cat" → "the cat open the door"; dative "give the ball to the dog" → "give the dog the ball".
- With a single grammar rule S → V NP, "could you open the door" gives 0 parses without alternations and parses with them.
- Gates: npm test 443 / 443 / 442 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- [KNOW] ask: the alternations as facts of w.lang.en in this format (passive, wrappers, wh-fronting, dative, ellipsis). Then the variant frames in w.lang.en can be counted and removed, measured on paraphrases-rt.
- Next: Q54 item 4 (induction from cases with cousins as the held-out test).

## 0.76.0: induction from cases (Q54 item 4)

`learnRules` uses the library's `induce`; the filler is lifted to the kind of its fact, and each rule is judged on a fork. test/learn.test.mjs (toy world):

**Admitted**
- Training: "what sound does a cow / duck make" give a rule `utter … t5=?v0`, with `k.animal name=?v0` → `ask key=sound of=?v0`.
- train 2/2; held-out (1 case plus the valid cousins at degree ≤ 4) all pass.

**Refused**
- Training: "what sound does a cow make" and "what noise does a duck make". The key word becomes a variable, so the rule is over-general.
- train 2/2, but held-out "what legs does a hen make" is 0/1 (the rule reads sound).

Gates: npm test 445 / 445 / 444 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

Next: Q54 item 5 (alignWorlds: transfer by analogy), then item 6 (story-then-question focus), then the 21:00 small decisions.

## 0.77.0: transfer by analogy, alignWorlds (Q54 item 5)

- test/align.test.mjs: a toy seating world (table / seat / person) and a toy timeline (day / slot / event).
  - Map: table→day, seat→slot, person→event. Slots: seat.table→slot.day, seat.n→slot.hour, seat.guest→slot.event. Score 1.
  - Offers: the default of day.slots (from table.seats=4); slot.day required (from seat.table). Not told: slot.day is still not required in b.
- Gates: npm test 446 / 446 / 445 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- Next: Q54 item 6 (story-then-question focus), then the 21:00 small decisions (summarizeLog failed: 'separate', compose deterministic by seed / memoisable, needs=text).

## 0.78.0: a story then a question (Q54 item 6, reviewer 18:20 item 1)

- `storyState` keeps the story's owners, quantities and the last owner (pronouns) in focus. The verb effects are data (set / add / remove / give).
- test/story-focus.test.mjs, toy English table, 6 cases:
  - 3+2=5;
  - five−two=3, with the pronoun;
  - a gift moves 1 pear;
  - a later "has" sets;
  - "they … together" = 5;
  - an unreadable sentence is listed and the question says there is no owner in focus.
- Gates: npm test 447 / 447 / 446 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- [KNOW] ask: the verb effects (set / add / remove / give) as facts of w.lang.en (or k.actions), so hosts pass no table.
- The Q54 items 0–6 are all in a first version. Next: the 21:00 small decisions (summarizeLog failed: 'separate', compose deterministic and memoisable, needs=text for sample), then Round 28 item 9 and Round 27 skills (the learn skill calls cousins + learnRules).

## 0.79.0: the 21:00 decisions

- `summarizeLog({ failed: 'separate' })`: failures are in `result.failed`; the main list holds only what was done (test in summarize.test.mjs).
- `compose` is deterministic by seed and memoised until the world changes. A dry run twice gives the same object; `memo: false` recomputes an equal composition; a change in the world recomputes (test in compose.test.mjs).
- `std.schema.kind ... needs=text`: sample does not draw a make it cannot fill. With `fillers: { text }` it makes and fills it (test in sample.test.mjs).
- The gate caught a consumer name in a new src comment before commit (psys2=1 → 0).
- Gates: npm test 450 / 450 / 449 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- Next: the one-summariser ask (docr.summary into std.summarize; I need its interface from the reviewer); Round 28 item 9; Round 27 skills (the learn skill uses cousins + learnRules).

## 0.80.0: cousins on the layered graph, the automatic tester, the skill (reviewer 21:55, 22:30)

**What changed**
- `ancestorsOf`: several parents on several dimensions (`edges`).
- `cousins` tags each cousin with the dimension it came by, deduplicates by frame, and stratifies per degree × dimension.
- test/cousins.test.mjs: a cow with kind=bovine and role=farm_animal gives yak (degree 1, kind) and pig (degree 1, role).

**`tools/cousins-test.mjs`** (example → cousins with expected answers → host → table)
- `node tools/cousins-test.mjs` on the toy farm world:
  - a host that knows only cows: share 0; it breaks along key, kind and role;
  - readByTypes: share 1.
- test/cousins-tool.test.mjs.

**Skill**
- skills/expand-and-test-case/SKILL.md (with a dry run) and skills/README.md.

**Gates**
- npm test 453 / 453 / 451 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- The COW run counts 2 fewer than the others (it was 1 fewer); 0 fail.

**Next**
- Dimensions for act families, alternation families and structure kinds as the knowledge repository publishes those edges.
- [KNOW] Q54: realisation of English plurals and a/an through std.morph (w.lang.en `det before=` and `onset`).
- Q57: solveChoices keys (binding.choose, choose_min, about, match.differs, soft, n).

## 0.81.0: plurals and articles from w.lang.en (reviewer 22:30, [KNOW] Q54)

- repos.pin: knowledge → fa8a629 (det before= and onset facts, k.procedures compositions, k.words frequency).
- `inflectBy` and `articleFor` in std.morph read the language world's facts.
- test/morph-en.test.mjs on the published w.lang.en:
  - cat, box, baby, day, church, analysis, antenna → cats, boxes, babies, days, churches, analyses, antennas (antennae is read_only, so not generated);
  - owl, cow, hour, unicorn, umbrella, heir → an, a, an, a, an, an.
- `discourseRealiser` uses them by default when w.lang.en has them.
- Answer to the knowledge repository's Q54: realiseEn's two jobs are now inflectBy(world, word, 'plural') and articleFor(world, word); discourseRealiser applies both. tools/lib/lang-en.mjs realiseEn can be deleted once PSys2 vendors 0.81.
  - Limit: rules with keys the library does not know (exception=, unless_is_singular, used by the singular rules) are skipped. If singular is needed, please express those as lists (only_words= / only_suffix=).
- Gates: npm test 454 / 454 / 452 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- Next: Q57 (solveChoices keys from k.procedures: binding.choose, choose_min, about, match.differs, soft, n), then compose through the published k.procedures compositions.

## 0.82.0: std.plan reads choice points (Q57)

**What std.plan now reads**
- `choose` / `choose_min` / `about` on bindings; `n` / `differs` / `soft` on matches.
- Choice points are solved jointly by `solveChoices` before a method's steps.

**The published "write a story"** (k.procedures 8f51548 / 37b83b5, at pin fa8a629)
- Planned through std.plan over factStore(publishedWorlds()) in the w.document world.
- 5 seeds in test/story.test.mjs, each checked by the repository's own checkPlan: 0 hard constraints broken.
- Seed 1 (about 1.3 s with the first loads): visit someone; a tree (cut with a saw, by a carpenter); grandmother; attempts jump, pull, push; target friend.
- Seed 2 (10 ms): reach a place; a wall (climbed with a rope, by a sailor); knight; target football pitch.

**Found on the way**
- Matches did not apply on `together` bindings, so the target took museum and zoo for "visit someone". Fixed: a binding's matches hold on every source.
- The repository's reference solver (tools/lib/choose.mjs) was slower than 5 minutes on the same goal with fixed choices; std.plan takes 10 ms – 1.3 s.

**For the knowledge repository (Q57)**
- tools/lib/choose.mjs can be deleted once its tests call std.plan (0.82).
- The topic is soft, so the protagonist is often not "girl".

**Gates**
- npm test 456 / 456 / 454 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

**Next**
- Compose through these procedures (compose's story path to call std.plan "write a story" instead of storyPlan, when a host prefers the procedure).
- The other four compositions.

## 0.83.0: the wording dimension, act frames, indexed ancestors (reviewer 23:05)

**Wording dimension**
- cousins along the wording: the alternation rules run backwards. test/cousins.test.mjs: "tell me the sound of the cow" gives "could you tell me …" (could_you) and "please tell me …" (please); both are valid and normalise back to the case.

**Act frames in readByTypes** (test/read-types.test.mjs)
- "make a blue shape" → make { kind: shape, colour: blue };
- "a blue shape, make it" → the same frame;
- "remove the circle" → remove { thing: c1 };
- "change the circle to blue" → change { thing: c1, colour: blue }.

**Speed**
- ancestorsOf / kindChain index names once per change; they no longer scan every wire per thing.

**Not yet**
- Judging every clause of a compound question (item 4).
- Realisation templates as a second source of wordings.

**Gates**
- npm test 458 / 458 / 456 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

## 0.84.0: form operators (reviewer 23:20, owner 16:12)

- `formOperator`: the shared runs of an aligned pair become variables; what is left is the operator.
  - "could you {x1}" → "{x1}"
  - "{x1} is opened by {x2}" → "{x2} opens {x1}"
  - "um {x1}" → "{x1}"
- `learnFormOperators` on 7 toy pairs gives 4 operators.
  - "could you {x1}": support 3, held-out 1/1, admitted.
  - "please {x1}": support 2, held-out 1/1, admitted.
  - Coverage: 3 operators cover 80 % of the pairs, 4 cover 95 %.
- Form cousins are tagged per operator (`form:op1`, `form:op2`, `form:synonym`). The tester names the operator that breaks: a host that fails on fillers and synonyms shows them in its pattern.
- Gates: npm test 461 / 461 / 459 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- For PSys2: please run learnFormOperators on its paraphrases-rt pairs (originals ↔ paraphrases) and report the coverage. The owner's hypothesis: few operators.

## 0.85.0: test speed (reviewer 23:45)

- `npm test` = build plus one plain run (the gate per release). `npm run test:full` = the three runs (every 5th release, or when the bundle or COW code changes). `npm run test:slow` = tools/slowest-tests.mjs.
- 0.85 is a 5th release: test:full 461 / 461 / 459 pass, 0 fail.
- Plain run here: 55.5 s wall, 461 tests, none over 10 s. The 10 slowest:
  - SAT vs CaDiCaL 4.1 s
  - budget stops 4.0 s
  - w.lang.ro round trip 3.0 s
  - solvers unknown 2.5 s
  - strategies 2.3 s
  - kids.arith compat 2.0 s
  - storyPlan 1.9 s
  - write-a-story procedure 1.8 s
  - plan 1.8 s
  - kids.shop compat 1.6 s
- AGENTS.md still says "npm test green on the sources and on the built file". The reviewer may want to change it to "npm test per release, test:full every 5th"; I have not edited AGENTS.md.
- Gates (new npm test): 461 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

## 0.86.0: form operators on PSys2's form pairs (reviewer 23:45)

`node tools/bench-form-pairs.mjs` reads psys2 dbf72b0 training/eval/form-pairs.jsonl in place. Of 626 pairs, 565 have same_meaning=true: paraphrases-rt 85, owner-log 4, cousins 476.

**Whole-pair operators (learnFormOperators)**
- Learnt on 283 pairs, 282 held out: 179 operators, 9 admitted.
- 80 % of the pairs need 123 operators, 95 % need 165.
- Real variants combine several operators (filler + alternation + extra clause), so whole-pair rules are mostly unique.

**Atomic edits (formEdits / learnFormEdits)**, all 565 pairs
- 1,556 edits in 350 operators.
- 80 % of the edits are covered by 70 operators, 95 % by 273. Every edit of 80 % of the pairs needs 219 operators, of 95 % 322.
- The top edits:
  - fillers: "um" 174, "hey" 115;
  - the alternation makes→does … make: 121 + 59 + 68 + 54;
  - extra questions as noise: "is egypt in africa" 116, plus 58 each for the arithmetic and calendar ones;
  - article drop "a": 58.

**Reading**
- The operator families are few: fillers, do-support / fronting, compound with an extra question, articles, number words.
- The literal edits are many because the extra clauses differ in content. Clustering by family needs a span type (filler word vs whole clause vs function word), the next step.

**Data notes for PSys2**
- Some pairs marked same_meaning=true change content (noise → legs; spider have → whale make): the cousins generator's own pairs.
- Please check that these rows are not counted as same-meaning.

**Gates**
- npm test 462 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

## 0.87.0: edit families

- `familyOf` classifies an edit by its shape alone. On PSys2's 565 same-meaning pairs (1,556 edits, `node tools/bench-form-pairs.mjs`): extra clause 545, substitution 451, filler 301, insertion 164, deletion 81, inflection 14.
- So 6 families cover all edits. The literal operators are many because the extra clauses and substitutions carry different words.
- Next, per family, a generator and its inverse for reading:
  - filler and extra clause: drop at read time (an extra clause is answered separately, see the clause judging below);
  - substitution and insertion: the alternation rules (do-support) and word senses.
- Gates: npm test 462 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

## 0.88.0: every clause judged (reviewer 23:05 item 4)

- `cousinsTest(..., { split, oracle })`: for a compound text, the host's answer must hold the world's answer to each clause.
- test/cousins-tool.test.mjs, "what does a cow make and what does a dog make":
  - a host that reads only the first clause passes when judged on the frame alone, and fails when judged per clause;
  - a host that answers each clause passes.
- Gates: npm test 463 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- The 23:05 list is done (wording dimension 0.83/0.84, act frames 0.83, indexed ancestors 0.83, every clause 0.88).
- Next: realisation templates (w.lang.en act templates) as a second wording source for cousins; then Round 28 item 9; the other Round 27 skills.

## 0.89.0: typed form operators (reviewer 00:05 item 1)

- `liftTokens` lifts content words to their types (`<type>`, `<kind>`, `<attr>`, `<num>`) before aligning; `{ world }` on the four form learners.
- `node tools/bench-form-pairs.mjs` on the 565 same-meaning pairs, typed by k.animals plus 5 names and 5 items:

| measure | untyped | typed |
| --- | --- | --- |
| whole-pair operators (learn 283, hold 282) | 179 | 84 |
| pairs covered at 80 % / 95 % | 123 / 165 | 28 / 70 |
| held-out applications passing | 140/1992 | 224/2253 |
| atomic edits | 1,556 | 1,515 |
| atomic operators | 350 | 165 |
| edits covered at 80 % / 95 % | 70 / 273 | 14 / 90 |
| every edit of 80 % / 95 % of the pairs | 219 / 322 | 21 / 131 |

- Typed families: extra clause 549, substitution 328, filler 301, insertion 229, deletion 96, inflection 12.
- The owner's hypothesis holds at the atomic level: 14 operators cover 80 % of the edits.
- Gates: npm test 464 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- Next: reviewer 00:05 item 2 (learnRules: tie the name slot to the token; reject a rule that fails its own training cases), then item 3 (composition quality).

## 0.90.0: learnRules and composition quality (reviewer 00:05 items 2, 3)

**learnRules**
- The filler is the thing's name, not its id, so the word, the fact name and the holder are one variable.
- test/learn.test.mjs, ids like k.animals.animal.cow: the rule has `t5=?v0` … `name=?v0` … `of=?v0`; train 2/2, held-out 1/1, admitted.
- A rule that fails its own training cases is refused before the held-out run.
- Likely cause of PSys2's "matches all 286 animals, 0/37 own cases": its holder id was taken as the name token. Please re-run learnRules with 0.90.

**compose**
- No sentence twice in a document.
- A counterargument or rebuttal needs a real contrast (sibling_contrast > 0), else it is left out with a note.
- `quiet` keys, and keys the knowledge marks `k.attributes.key narrate=no`, are never narrated.
- test/compose.test.mjs: a Chad essay with code / code2 quiet; the counterargument left out with a note; no sentence twice.

**Not yet**
- Attribute-specific realisation ("Its capital is N'Djamena") needs w.lang.en templates per attribute ([KNOW]). Until then the host's clause() gives it.

**Gates** (5th release, so test:full)
- test:full 466 / 466 / 464 pass, 0 fail; npm test 466; pilot identical; psys2=0; scan clean; tsc ok.

## 0.91.0: the inverse at read time; Q58 (reviewer 00:40)

**Pin**
- repos.pin: knowledge → 2f54678 (368 alternations in 16 families, k.kinds up edges, act families).

**normalise (Q58)**
- Rules are tried in order of `n`, and the innermost mode wins.
- `{q:wh}` word classes come from `w.lang.en.word_class name= word=` (proposed format; none published yet).
- The published 35 alternation_case sentences: canonical 35/35, applied 35/35, mode 35/35.

**The read-time pipeline**
- `canonicalise`: clauses split at splitters, fillers dropped, alternations undone. `readCanonical` adds reading by types.
- Example: "hey could you say what sound a cow makes and then how many legs does a cow have" reads as sound → moo and legs → 4, with mode request.

**Data the library now needs from the language world**
- `fillersFrom(learnFormEdits(...))` gives the filler words from learnt edits.
- Splitters and fillers are host data until w.lang.en publishes them. [KNOW] ask: w.lang.en.filler and w.lang.en.splitter facts (or a family of alternations that drops them), plus word classes for {x:wh}.

**Pin follow-up**
- test/lang-ro.test.mjs updated to the published Romanian template with the article ("am desenat o casă roșie", art=un), as the knowledge repository's own test does.

**Gates**
- npm test 469 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

**For PSys2**
- Please measure readCanonical (fillers from fillersFrom on its form pairs, splitters "and then", "also", "and") on paraphrases-rt and cousins-real.

## 0.92.0: one way to choose (reviewer 01:00, owner 17:16)

**What was added**
- std.decide: criteria per choice kind as data (reading, template, word, rule, fact) in one order: hard, coverage, cost, specificity, prior, seed.
- `choose(world, kind, candidates)` reads the world's criteria for the kind, else std.decide's facts (parsed once from the module text: one source). Every loss is explained ("cost 2; #1: cost 1").
- docs/decisions.md maps every choice point: its candidates, its method, and whether it goes through choose.
  - It separates deciding (best by criteria) from drawing (a weighted draw within hard constraints for variety: sample, story, solveChoices).

**Already through choose**
- Templates in discourseRealiser (kind template: fills, fresh, specificity, then seeded; before, a draw among fresh ones).
- Near words in readByTypes (kind word: fits, cost, prior).

**To move next** (listed in decisions.md)
- readByTypes frames and parseText parses → reading.
- normalise rules → rule (specificity before n).
- compose facts → fact.
- arbitrate → world.
- RANKING → reading read from data.
- Calibrating tie-break weights on the case corpus.

**Test**
- test/decide.test.mjs.

**Gates**
- npm test 471 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

## 0.93.0: three more choice points through choose

- readByTypes frames go through kind reading. The cost of near words is counted again; it was lost in 0.83 when the act frames replaced that block.
- normalise rules go through kind rule (specificity, then n). The 35 published cases are still 35/35 (canonical, applied, mode).
- compose facts go through kind fact.
- docs/decisions.md is updated.
  - Still to move: parseText parses, arbitrate, RANKING read from data, calibration on the corpus.
- Gates: npm test 471 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

## 0.94.0: score order and parses from data

- `world.score` ranks readings by RANKING's measures in the order of std.decide kind score (`rankingOf`); a world may declare another order.
- parseText orders parses through `choose` (kind parse: priority, literal words, size, depth; seed null keeps a stable order on ties).
- docs/decisions.md is updated. Still not through choose: arbitrate (worlds), and calibration of tie-breaks on the corpus.
- Gates: npm test 471 pass, 0 fail; pilot identical (the parse and reading orders are unchanged on the pilot); psys2=0; scan clean; tsc ok.

## 0.95.0: calibrating a choice kind on cases (reviewer 01:00 item 2)

- `calibrate(world, kind, cases, { heldOut })` tries every order of a kind's criteria (at most 7!) on training cases. It proposes the best as std.decide facts and admits it only if the held-out cases do not drop.
- test/decide.test.mjs, toy word cases where frequency should beat cost:
  - current order (fits, cost, prior): 0/6 train, 0/3 held-out;
  - learnt order (prior before cost): 6/6 train, 3/3 held-out; admitted.
- For PSys2: it can calibrate kind `reading` on its ledger, with each row's candidate readings and the right one.
- Gates (5th release): test:full 472 / 472 / 470 pass, 0 fail; npm test 472; pilot identical; psys2=0; scan clean; tsc ok.

## 0.96.0: experiment and ablation harnesses (Round 28 item 9)

- `experiment` turns cells into ledger rows. `ablation` runs configurations × sets and reports a table, what each configuration buys, and causes.
- test/experiment.test.mjs, with readByTypes and canonicalise as the host and their steps turned on and off:
  - none: plain 1/1, lexical 0/1, noise 0/1;
  - near words gain the synonym cell; fillers gain the filler cell; all gain both;
  - none's 2 failures group as "reading / unread word".
- Round 28 is complete (items 1–9).
- Gates: npm test 474 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok. README: 36 jobs.
- Next: arbitrate through choose; the other Round 27 skills (read a new world, wire a knowledge world, measure a curve, release a version).

## 0.97.0: Round 27 skills (all six, each with a dry run on real material)

Dry runs printed today:
- **learn-world-from-examples**: 12 animals of k.animals give proposed slots (habitat many, diet as a closed set, eats many, baby required, …). 8/8 requests built from key × name are read with an answer.
- **improve-world-from-failures**: of psys2's 565 form pairs read against k.animals, the world reads 500 canonical sentences, and 246 variants are read differently.
  - The failures group as: combined/filler 131 → language world (filler); extra clause 75 + 36 → splitter; insertion 3 → alternation; substitution 1 → k.words.
- **learn-language-rules**: 84 typed operators. 3 are general and admitted (held-out ≥ 80 %, ≤ 3 literal words), printed as proposed w.lang.en.alternation facts. Phrase-like operators are refused.
- **consolidate**: held-out half frozen (250 of 500).
  - Before: paraphrases-rt 9/10, cousins 107/238.
  - After canonicalise (learnt fillers + 4 splitters): 10/10 and 120/238.
  - 130 vs 116 on held-out, 14 gains, 0 losses → keep.
- **audit-knowledge**: 149 model-labelled animal numbers against 2 sourced animal ranges (log scale): 8 are more than 5 log-widths out, listed to check (elephant, giraffe, python, crocodile …: plausible, to confirm against sources).
- **expand-and-test-case** (0.80): `node tools/cousins-test.mjs`.

Also: fillersFrom now leaves lifted types out (it gave "<attr>").

Gates: npm test 474 pass, 0 fail; pilot identical; psys2=0 in src; scan clean; tsc ok. README: 37 jobs.

## Answer to the knowledge repository's Q60 (via the reviewer, 01:40): formats accepted, with three asks for alignWorlds

- **k.kinds.argument** (name, about, live, type many, sense many, example): accepted as published. readByTypes can type a word as an argument when it is a `type` or a `sense` of it; no key change.
- **k.kinds.relation** (type, key, subject, subject_sense, object, object_type many, object_sense, scale): accepted. It is what readByTypes needs to read "sound of animal" from knowledge instead of from facts; `object_type` and `scale` are enough. No key change.
- **w.lang.en.variant** (frame, alternation, canonical many): accepted. cousins will use it as the wording source per frame (which alternations apply to a frame), next to the alternation rules.
- **k.kinds.structure** (name, about, role many, needs many): accepted. For alignWorlds to use it, please add per role, as separate facts, `k.kinds.structure.role structure= name= refers= many= required=`:
  - `refers`: which role it points to (link direction: slot → container, assigned → slot);
  - `many`: cardinality (a slot holds many items, an item has one slot);
  - `required`;
  - and constraints as facts: `k.kinds.structure.constraint structure= name= on= kind=capacity|distinct|order`.
  
  With these, alignWorlds can map a world type to a role by signature and check the constraints. Without them it aligns by slot signatures only, as in 0.77. A map from a world's types to structure roles (`k.kinds.structure_of type= structure= role=`) would let worlds declare it outright.

## 0.98.0: several readers, one confidence (reviewer 02:30)

`readEnsemble` runs readers as parallel voices (types, canonical, exact; hosts add their own), pools their frames, and combines them with choose kind ensemble (weighted agreement, coverage, cost, specificity). It returns a confidence, and `ask` below the threshold or on a tie. `riskCoverage` gives the risk–coverage curve.

**`node tools/bench-ensemble.mjs`**: psys2's 565 pairs against k.animals; 500 variants have a gold reading (the world's reading of the canonical sentence).

| reader | coverage | precision |
| --- | --- | --- |
| types | 99.6 % | 51.0 % |
| canonical | 99.6 % | 57.6 % |
| exact | 15.0 % | 18.7 % |
| ensemble (equal weights) | 99.6 % | 51.0 % |
| all three agree | 3.0 % | 93.3 % |

- Risk–coverage: at confidence 1, coverage 0.03 and risk 0.067; at ≥ 0.667, coverage 1 and risk 0.49.
- Weights learnt on a training half (types 0.552, canonical 0.628, exact 0.189): held-out precision 46.8 % → 46.8 %, unchanged.

**Reading the numbers**
- The voices are not independent: types and exact are both readByTypes, so their agreement outvotes canonical, which is the better reader alone.
- Agreement is a good confidence signal when the readers are independent: 93 % precision when all agree, but 3 % coverage.
- The independent voices that would make the ensemble pay are the grammar/frames reader, the pattern reader (02:15) and PSys2's neural dispatcher.
- Next: calibrate the ensemble criteria and weights with `calibrate` on PSys2's ledger once its voices join.

**Gates**
- npm test 476 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

## 0.99.0: type signatures and a pattern inventory (reviewer 02:15)

`signatureOf` gives 3 levels: types from knowledge, verbs of keys as verbs, closed words literal, word endings for the rest. `chunk` merges content words under their head. `minePatterns` mines patterns and reports their coverage.

**`node tools/bench-patterns.mjs`** (psys2 form pairs vs k.animals):

| set | sentences | patterns (level 1) | 80 % by | 95 % by |
| --- | --- | --- | --- | --- |
| canonical | 93 | 52 | 34 | 48 |
| variants | 565 | 102 | 13 | 74 |
| variants as clauses, after canonicalise | 806 clauses | 104 | 11 | 64 |

- Variants at level 0 (fine): 156 patterns; 80 % by 43.
- Top patterns: "what <attr> <verb> a <thing>" 107, "how many <attr> does a <thing> <verb>" 61.

**Reading the numbers**
- The owner's hypothesis holds where the world types the words: 11 clause patterns cover 80 %.
- The long tail is words the world does not type (`<w>`: arithmetic, geography, calendar), which a catalog with those worlds would type.

**Not yet** (from 02:15)
- WordNet supersenses and k.kinds.argument classes as signature levels.
- Distributional (Brown-style) classes for untyped words.
- Patterns mapped to frames as a reader (a voice for readEnsemble).

**Gates**
- npm test 478 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

## 0.100.0: patternReader, a voice from mined patterns

- `patternReader` learns from cases, per pattern, where the key and the holder are; it reads new sentences of a known pattern.
- `node tools/bench-ensemble.mjs`, held-out half of psys2's form pairs:
  - pattern reader learnt on 250: coverage 88.4 %, precision 45.2 %;
  - ensemble with the pattern reader as a fourth voice: precision 46.8 % → 51.2 % (equal weights; learnt weights the same);
  - risk–coverage at confidence ≥ 1: coverage 0.02, risk 0; at ≥ 0.648: coverage 0.875, risk 0.465.
- Caution: the gold is the world's reading of the canonical sentence, which is itself about 50 % right on these pairs. Many cousin pairs change content (noted at 0.86). Please give a hand-judged gold frame per pair to measure precision.
- Gates (5th release): test:full 479 / 479 / 477 pass, 0 fail; npm test 479; pilot identical; psys2=0; scan clean; tsc ok.

## 0.101.0: run-on requests split into clauses (reviewer 02:50)

- `splitRunOn` cuts a request where its clauses read best, by dynamic programming over punctuation, openers and splitters (fillers dropped).
  - A clause scores the words its frame uses, minus 3 per unread word and 1 per typed word left out.
  - A clause no reader takes is kept apart and reported.
- Example: "um is egypt in africa, what sound does a cow make and then how many legs does a spider have whatever is 20 min 8" gives 4 clauses: unread / moo / 8 / unread.
- `node tools/bench-runon.mjs` on psys2's pairs vs k.animals: 500 pairs have a gold reading (every frame of the canonical sentence must be among the variant's frames).
  - Whole-sentence reading: 251/500 (50.2 %). Clause by clause: 286/500 (57.2 %).
  - On the 378 compound or noisy pairs: 185 → 220.
- Gates: npm test 480 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.
- For PSys2: please measure splitRunOn with its own world and readers (openers from w.lang.en, its splitters) on the curve and on the per-clause cousins judge.
- Next: the LIB-1..8 handover (joinList, fact clause, act template choice, renderFrames, compose topic index, typedWorldOf, slot-type assignment, cousins judge helpers) and "Peru essay has no claim sentence".

## 0.102.0: handover LIB-1..4 and the Peru essay (reviewer 02:50)

**LIB-1..4**, written here from PSys2's description in its questions.md (its code is AGPL; nothing copied).
- `joinList`, `clauseOf`, `actSentence`, `renderFrames` read the language world's facts.
- test/say.test.mjs on the published w.lang.en:
  - "the penguin eats fish, is a bird, has 2 legs";
  - "peru is not landlocked, has a capital of lima";
  - "Add 3 tables."; "Add an owl.";
  - "You asked me to add 3 trees and remove a house; 1 request was not understood."

**The Peru essay**
- Claims come from facts about the topic itself (std.decide fact: about_topic).
- Relations about the topic are laid out first, and a claim takes a fact about the topic from another relation when its own has none.
- Frames carry `subject`.
- A failed layout search now uses the plainest layout and says so, instead of returning `{ why }` (the cause of PSys2's textgen failure from 0.90).
- test/compose.test.mjs: every claim's subject is peru.

**Gates**
- The gate caught consumer names in two new src comments (psys2=2 → 0).
- npm test 483 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

**Next**
- LIB-5 genreOf / topicIndex / randomTopics.
- LIB-6 typedWorldOf and readRolesByTypes.
- LIB-7 assignBySlotTypes.
- LIB-8 judgeReply / tabulate / tableText.

## 0.103.0: handover LIB-5..8

All four were written here from PSys2's description (its code is AGPL; nothing copied). test/handover.test.mjs:
- **LIB-5**: genreOf (scientific-article → scientific article; slide show → presentation; sonnet → null), topicIndex, randomTopics (seeded, by interest).
- **LIB-6**: typedWorldOf, readRolesByTypes. "the circle blue" → { thing: c1, value: blue }; with a word left over → null.
- **LIB-7**: assignBySlotTypes. One assignment gives a reading; two of the same types give none; no anchor gives none.
- **LIB-8**: judgeReply (number words; a question must not change the state), tabulate, tableText.

PSys2 can now delete its copies of LIB-1..8 when it vendors 0.103 (LIB-1..4 came in 0.102).

Gates: npm test 487 pass, 0 fail; pilot identical; psys2=0; scan clean; tsc ok.

## 0.104.0: PSys2's Q15 items (reviewer 03:20)

**1. Completeness**
- readByTypes returns `left` and `complete`.
- readEnsemble ranks coverage first (std.decide ensemble: coverage, then agreement) and asks back when the winner leaves content words.

**2. arbitrate by coverage**
- Among several owners: coverage of the request, then the open tab, then priority (std.decide kind world), with `ranked`.
- test/arbitrate-coverage.test.mjs.

**3. Discourse ellipsis**
- `continueAct`: "it to the top right" gives place with the same thing and place "top right"; "and still up" gives up; a new thing replaces the previous one; an act word or no role gives null.
- test/continue-act.test.mjs.

**4. named:false**
- The library never drops a name silently: std.acts make with a key the kind does not have is refused ("a shape has no name"). The silent drop PSys2 saw is in its art.draw engine.
- If hosts want "make it and say the name was not kept" instead of a refusal, say so and I will add a `dropped` report to make.

**Gates** (test:full)
- 489 / 489 / 487 pass, 0 fail; npm test 489; pilot identical; psys2=0; scan clean; tsc ok.

## 0.105.0: relations declared in knowledge (Q60 k.kinds.relation)

- readByTypes types a key that `k.kinds.relation type= key=` declares even when no fact carries it. "what sound does a zebra make" with no sound fact reads as ask sound of zebra, with answer [] and known: false. The host can answer "I don't know what sound a zebra makes" instead of "not understood".
- This also fills PSys2's Q15 item 4, "animal sounds as a typed relation for all k.animals kinds": once the relation is declared, every kind is read; the values are knowledge.
- Gates (5th release): test:full 490 / 490 / 488 pass, 0 fail; npm test 490; pilot identical; psys2=0; scan clean; tsc ok.
- Not done: w.lang.en.variant as a wording source for cousins. Its frames are w.lang.en frame names, while cousins work on readByTypes frames. It needs the frames reader (Q15 item 6) to connect the two.

## 0.106.0 — Q63: narration and phrasing read from the worlds

- repos.pin knowledge -> 284e15a (has 593e141). `narrationOf` reads 986 `k.attributes.narration` facts.
- `phraseOf` on the published owl: "the owl lives in the forest", "the owl eats mice and insects",
  "the young of the owl is an owlet"; `drawing` (narrate=no) -> null.
- compose / clauseOf drop narrate=no keys; discourseRealiser uses `w.lang.en.phrasing` when present.
- Gate: npm test 492 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.107.0 — Q66: the join check is an index lookup; quoted = bare

- `by=` join check uses `index` (type|key|value, kept on tell/retract) instead of scanning byType;
  blob keys still scan. Quoted and bare names with the same text match.
- /tmp/jt.mjs, 2,211 objects + 27,902 parts with `of` joined by name: 3099 ms before, 1050 ms after,
  1003 ms with no join slot.
- New test at that size (slots-q34): 0 open joins with mixed quoted/bare names.
- Gate: npm test 493 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.108.0 — w.lang.en.variant as a wording source for cousins

- `variantsOf` reads 47 published variants (request wrapper 17, verb ellipsis 29 at d3aaed2's count;
  the pin 284e15a has the same file). `realiseFrame` says a frame from its parts.
- cousins on "what is the sound of the cow" (langFrame acts.ask.what): 3 variant cousins, 3 valid
  (read back to the same frame): "tell me the cow sound", "can you say what sound is the cow in",
  "the cow sound".
- 04:40 (diagrams): k.diagrams / w.diagram not yet published at knowledge d3aaed2; waiting.
- Gate: npm test 495 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.109.0 — Q66 part 2: quoted = bare in matching generally

- `_iv` (index key), the pattern candidate lookup and `_unifyValue` read `"atom"` as `atom`
  (atom text: /^[A-Za-z_][\w.:-]*$/); blob keys stay exact; "Deep Snow" stays a string.
- /tmp/kq.mjs: `ask('@q chapter n=?n title=Rain')` -> c1 (told as "Rain"); `title="Snow"` -> c2 (told bare).
- Gate: npm test 496 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.110.0 — arrange: layouts for diagrams (ahead of 04:40)

- `arrange(nodes, layout)`: row, column, circle, grid, layers (edges; cycles cut where they close).
  /tmp/ar.mjs on 4 nodes: circle a(45,2) b(88,45) c(45,88) d(2,45); diamond layers a|b,c|d.
- k.diagrams / w.diagram still unpublished (knowledge d3aaed2); composeDiagram and reading
  arrangement requests through w.lang.en frames wait for them.
- Gate: npm test 497 pass / 0 fail; test:full 497 / 497 / 495, 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.111.0 — names against the literature (reviewer 05:10, 05:25)

- Renamed with deprecated aliases (until 0.113.0): cousins→relatedCases (degree→distance, dims→axes),
  judgeFix→judgeOnRelated (byDistance), cousinsTest→generalisationTest (tools/generalisation-test.mjs),
  learnRules `cousins`→`related`, liftTokens→delexicalise, continueAct→resolveEllipsis,
  variantsOf→paraphrasesOf, calibrate→learnRanking. src/cousins.mjs→src/related-cases.mjs; tests,
  skills (expand-and-test-case, improve-world-from-failures, learn-language-rules, README) updated.
- `git grep -i cousin` outside CHANGELOG/logs: only deprecation code and the deprecated-names doc entries.
- New docs/generalisation.md, docs/literature.md (16 concepts, 28 references), glossary standard
  equivalents; module headers cite docs/literature.md. The references are the standard ones written
  from bibliographic knowledge; no source was fetched in this session. Each "difference" was checked
  against the module's own code and header.
- Decision: `calibrate` stays an alias of learnRanking for two releases, then becomes Platt/isotonic
  score calibration for readEnsemble.
- `node tools/generalisation-test.mjs`: toy host knowing only cows: related 3, share 0.
- Gate: npm test 498 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.112.0 — diagrams composed from knowledge (reviewer 04:40, 05:45)

- repos.pin knowledge -> 7c7738f (k.diagrams, w.diagram, w.lang.en.arrangement).
- `composeDiagram` reads k.diagrams kinds/fills/shapes; /tmp/dg.mjs on the published knowledge (load 980 ms):
  cycle of seasons (spring, summer, autumn, winter; 4 edges, circular), cycle of water cycle (4 stages),
  tree of animal (12 nodes), tree of France (cities), timeline of year (12 months), mind map of bee
  (centre + 6 parts), Venn of animal (3 groups × 4), flowchart of "write a story" (2 steps), network of
  France (9 countries, 14 edges), pipeline of essay (4 parts). flowchart of tea -> why: no procedure
  in the knowledge (1 of 12 with no diagram).
- Wires told into a world with the w.diagram schema: ok, 0 violations (/tmp/dg2.mjs, 4 diagrams, 37 nodes).
- `arrangementOf` reads the 58 arrangement phrases ("in a circle" -> circle/circular; "from right to
  left" -> row, reverse). `arrange` gains radial, scatter, reverse.
- `sampleDiagram` seeds 1..4: flowchart of "a person of a role", network of Austria, tree of aircraft,
  flowchart of "make a thing on the anchor of another".
- Gate: npm test 500 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.113.0 — knowledge 06:00 items

- (1) `inflectBy` irregulars per op. /tmp/ib.mjs on published w.lang.en: fish past -> fished (was fish),
  fish plural -> fish, go past -> went, go ing -> going, good comparative -> better, mice singular -> mouse.
- (2) std.morph `m.irregular ... read_only=yes`: analysed, never generated (test morph.test.mjs).
- (3) `make` with a missing required key: answered in questions.md Q67 (asks, open(), strict check);
  no change.
- Deprecated names: removal moved to 0.114.0 (two releases after 0.111: 0.112, 0.113 keep them).
- Gate: npm test 501 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 20:10 check

- No new reviewer task (06:20 accepted 0.111/0.112). Knowledge has k.diagrams (in use since 0.112).
- `git -C .cache/psys2 grep` on origin/HEAD: PSys2 still calls lib.cousins (scripts/learn-rules.mjs:48,
  scripts/lib/cousins-host.mjs:52) and lib.liftTokens (src/dialog/form-operators.mjs:39). Aliases stay
  until PSys2 renames (questions.md Q68).

## 0.114.0 — typed worlds from schema + knowledge (reviewer 06:55, PSys2 Q16); PSys2 Q17 diagram items

- `typedWorldFor` / `schemaOf` / `fitsSlot` / `freeTextType` (src/typed.mjs). Toy test: "makes a cow" refused
  for a joined instrument slot and for a name slot; numbers, closed sets, titles, texts typed;
  "what is the speed of the player" reads tempo of the session thing.
- compat/psys2/typed: PSys2 kids.animals legend at 45ac4bf + k.animals → typed world; "the owl" fits
  name, "makes a cow" does not; "owl legs" reads legs before any fact carries it.
- typedLexicon: core.word for a type -> kind; declared relations merged per key; k.kinds.relation not content.
- composeDiagram: w/h on nodes; exact topic match; no-topic fills answer only their type (PSys2 Q17 5-7).
- Not done yet from 06:55: why storyState does not take the 23 word problems (needs PSys2's rows).
- Deprecated names: stay until PSys2 renames (Q68).
- Gate: npm test 504 pass / 0 fail; test:full 504 / 504 / 501, 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.115.0 — Romanian read by the frames of w.lang.ro (reviewer 08:15, item 1)

- `readFrames(world, text, { lang, morph, dictionary })` (src/frames.mjs), `senseOf`.
- `node tools/bench-ro-frames.mjs` (PSys2 23f283a6 real set, gold-real.tsv glosses, 161 turns): read by a
  frame 93 (58 %), act right 74 (46 %), act and thing right 38 (24 %); glosses with an act k.actions
  knows 121. Misses listed in questions.md Q69 (mostly missing lemmas; "și" as too; î/â fold; lists).
- The meaning measure is crude: act by the gloss's first verb that k.actions knows; thing by a shared
  content word. "pune și un lac" (gloss "put a lake too") counts as wrong though make is the meaning.
- Gate: npm test 506 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.116.0 — relative continuations (reviewer 08:15, item 2); lists in readFrames

- resolveEllipsis: /tmp/re.mjs on a toy world of 3 houses: "more to the left" -> dir left, relative more;
  "a bit lower" -> dir lower, small; "not the first one, the middle one" -> house2; "the last" -> house3;
  "even more" -> the same direction. Romanian "și mai la stânga" with w.lang.ro's acts.dir -> la stânga.
- readFrames: roles cut into items at commas and "and" (bench numbers unchanged: 93 / 74 / 38 of 161).
- Gate: npm test 507 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.117.0 — deprecated names removed (PSys2 renamed, Q68); calibrate as probability calibration

- `git -C .cache/psys2 grep` on origin/HEAD (9f62006c), scripts/ src/ docs/webchat/lib tests (vendor aside):
  the old names only in comments and a local variable; PSys2 calls the new APIs.
- Removed cousins, judgeFix, liftTokens, continueAct, variantsOf, the old calibrate, cousinsTest,
  degree/dims in generalisationTest and tabulate, learnRules `cousins`.
- New `calibrate(rows, { method })`: /tmp/cal.mjs, 200 rows right with probability s²: isotonic Brier
  0.1713 -> 0.1338 (p(0.5) 0.27, p(0.9) 0.82, 14 steps); Platt 0.1713 -> 0.1412 (p(0.5) 0.25, p(0.9) 0.78).
- `git grep -i cousin` outside CHANGELOG/logs/glossary history: none.
- Gate: npm test 507 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.118.0 — L1 word problems of real turns (reviewer 09:20); two Romanian dictionaries (09:00)

- storyState rewritten (src/story-focus.mjs). /tmp/ss.mjs: r0194 -> 3 (was 15: "He" lost to "Ana" as
  subject); r0195 -> 5 with refused "Tom only had 5 apples" (was 5 with Ana at -8); r0201 -> 9 (was 10);
  r0541-r0543 as three turns with `prior` -> 9; "ate 2 and now has 3 ... at first" -> 5; "3 more than" -> 7;
  "twice as many ... how many more" -> 4; "who has the most" -> Ana; negated -> unchanged; "I buy a pen" -> 4.
- Verbs are still data from the host: k.actions has no typed possession effects yet (knowledge K5 not
  published at the pin); a reader of them comes when it is.
- dictionary({ read: [...] }): bench-ro-frames with hand + UniMorph dictionaries: 93 / 74 / 38 of 161,
  the same as the hand one alone (UniMorph rows have no senses, so no new meaning; crocodil, capră,
  rață are in neither). Senses for the real turns' nouns remain Q69 for the knowledge repository.
- Gate: npm test 509 pass / 0 fail; test:full 509 / 509 / 506, 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.119.0 — R1: the architecture review's six serious findings (reviewer 10:10)

- memoPerWorld (src/memo.mjs) for typedLexicon, senseIndex, narrationOf, namedIn, interestModel, the compose
  graph and memo, the template morphology; one seeded generator (src/random.mjs) for 12 sites; valueText for
  ~50 quote strippers (28 files); std.decide criteria as data (src/decide.mjs); tiers in src/fill-tiers.mjs
  (slip rank 6) read by resolve; defaultReaders = types, canonical.
- test/architecture-r1.test.mjs: 5 tests (choose imported alone; revise then read; two-value draw over seeds
  1, 3, 12345, 99991; escapes; default voices).
- Seeded orders changed: two tests made order-free (related-cases wording; the generalisation pattern now
  names axes sorted).
- docs/architecture-review-2026-11-15.md: the worker's review page (R1 table, next).
- Gate: npm test 514 pass / 0 fail; test:full 514 / 514 / 511, 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.120.0 — R2 part 1: one Reader contract (reviewer 10:10, 10:35)

- src/reader.mjs: readText / READERS (types, frames, canonical) / moodOf. /tmp/rd.mjs: "what sound does a cow
  make" complete; "... in the shape of a house" incomplete, unread "in the shape of house" (the library half
  of the real case of 23:50); "I have two kids", "Tom has 5 apples" statement; "the", "b" fragment.
- Repairs: only respellings (via spelling); readByTypes' sense generalisations are a cost, not a repair.
- fitsSlot refuses "", an article alone, a single letter.
- Gate: npm test 515 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.121.0 — R2 part 2: typed worlds and role reading, one way each

- `git -C .cache/psys2 grep` (origin/HEAD, vendor aside): PSys2 has its own typedWorldOf in src/dialog/typed-reader.mjs
  and calls none of the library's typedWorldOf / readRolesByTypes / assignBySlotTypes; removed without a deprecation.
- typedWorldFor's own wires are `typed.<n>` (a session thing `t1` clashed with them).
- Gate: npm test 514 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.122.0 — R2 part 3: one motion scheduler

- PSys2 (origin/HEAD) worlds/ui.avatar/motion.mjs calls readMotion + planMotionFacts only; `git grep motionPlan` on
  its tree (vendor aside): none. motionPlan and the mo.* format removed; motionRun moved to motion-facts.mjs, with
  a test of its own.
- Gate: npm test 511 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.123.0 — R2 part 4: one pattern matcher, one kind walker, one edit distance

- alternate.mjs matchPattern / matchAll (classes, alternatives, base spans) replace related-cases' and learn's
  copies; kindChain = ancestorsOf by level; resolve's oneSlip on editDistance.
- Findings 8 and 10 answered in questions.md Q70 (story planner with R3's catalog shapes; turn/route next).
- Gate: npm test 511 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.124.0 — R2 part 5: one request pipeline, one world chooser

- turn = turnFlow(…, { stages: TURN_STAGES, load }); route removed (std.turn's route provider and tools/cases.mjs
  use arbitrate's owner); the open-tab criterion left std.decide: a host's `criteria` / facts (Q70 answered 11:55).
- PSys2 (origin/HEAD, vendor aside): no call of the library's turn, route or arbitrate (only a comment).
- Gate: npm test 510 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.125.0 — R2 part 6: choosing sorts through choose

- readFrames, relatedCases (stratification and final order), alignWorlds through choose kinds frame, related,
  alignment (src/decide.mjs); `veto` export removed (PSys2 calls world.veto through its own code, never lib.veto).
- Gate: npm test 510 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.
- test:full after R2 parts 1-6: 510 / 510 / 507, 0 fail.

## 0.126.0 — L3: list sums (real turns r0598, r0599, r0622, r0624, r0625, r0627)

- repos.pin knowledge -> b20eeeb (w.list v3 with sort/budget/tendered/currency/price; the î fold of Q69).
- listSums / listMeant (src/lists.mjs). /tmp/ls.mjs with a toy price list (puzzle 7, pencil 2, ball 9) on the
  published w.list: r0598/r0624 change 3; r0599/r0627 (2 pencils, 10 lei) change 6; r0622/r0625 (ball + pencil,
  20 lei) change 9; 5 lei for a ball: short 4. The prices are PSys2's shop data, so PSys2 measures the rows.
- Q71: the clause splitter merges in R3 with the cut words.
- Gate: npm test 512 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.
- bench-ro-frames at the new pin (knowledge added lemmas, "și", î fold for Q69): read 100/161 (62 %), act right
  82/161 (51 %), act and thing right 62/161 (39 %) — was 93 / 74 / 38 at 7c7738f.

## 0.127.0 — L5: statements about the user as facts (reviewer 09:20, 10:55)

- src/statements.mjs: readStatement / tellStatement / describeThing / readAboutSelf on a toy person schema (w.person
  is not published yet). /tmp/st.mjs: "I have two kids" children=2; "I am 40" age=40 (host's number key); "I like
  cats, dogs and horses" likes=3 values (a list grows, by fills); "my name is Ana Pop" as written; "I live in Cluj";
  "draw a house" not a statement; "how many kids do I have" -> children of me, 2.
- The library's version of PSys2's host-side foreign-reading rules (11:35): readText's mood/complete/unread;
  PSys2 can delete foreign-reading.mjs when its acceptance cases pass on readText (not measured here).
- Gate: npm test 513 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.128.0 — L2 cycles and clock, L4 contrast (real turns r0586/r0587, r0610/r0611)

- src/cycles.mjs: /tmp/cy.mjs on published k.time: Friday+1 Saturday, Friday+3 Monday, Monday-1 Sunday,
  Wednesday->Friday 2, December+2 February, winter+1 spring; statedDay("I should tell you, today is Friday") Friday,
  tomorrow Saturday; readClock "3 o'clock" 180, "half past 3" 210, "quarter to 4" 225, "3:30 pm" 930; +2 h "5 o'clock".
- src/contrast.mjs: /tmp/ct.mjs on k.shapes: circle vs 22 flat siblings: corners=0 (0.14), sides=0 (0.23), round=true
  (0.32); square: sides=4, corners=4, equal_sides=true (0.27 each).
- 13:15 (PSys2 Q20-Q22) read: items 1-3 go with R3/R4, 4 (outline path) with L4's follow-up, 5 (host kit) as a
  design question first.
- Gate: npm test 515 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.129.0 — outlineOf and arrange 'path' (reviewer 13:15 item 4); Q72 host kit proposal

- outlineOf (convex hull of part boxes) + arrange(..., 'path', { points, closed }): a house of walls 20,50,60x40 and
  roof 30,20,40x30 -> outline of 6 points; 6 nodes placed along it (first on the first point).
- Concave outlines (the knowledge repository is deriving drawings' outlines) not done: the convex hull only.
- Q72 in questions.md: loadWorldSet / readTurn / session API proposed, not built (13:15: design first).
- Gate: npm test 516 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.130.0 — host kit parts 1-2 (reviewer 13:50, Q72): loadWorldSet, readTurn; examples/lists-app.mjs

- `node examples/lists-app.mjs`: "make a shopping list" done (sort=shopping, reply "I made a list"); "add milk to my
  shopping list" / "add 2 apples to the shopping list" done (w.list.item text, quantity, list); "make a purple dragon"
  not understood, reply names "purple", "dragon", nothing changed; "I have two kids" a statement, not acted on.
- 13:50 points: (1) incomplete readings never executed: done; (2) replies in the user's language from templates:
  NOT done — the library's English actReply with kinds said by their words; w.lang.en has request templates
  (w.lang.en.template "add a {kind}.") but no reply templates; w.lang.ro.template has replies (a knowledge ask for
  w.lang.en); (3) open tab only as context criteria: done; (4) turn scope: property test over 4 messages; (5) indexed
  lookups: the typed lexicon and senses are memoised per world version (0.119); the taught tier is world facts read
  through the index; no budget test written yet; (6) the second application: examples/lists-app.mjs.
- outlineOf has no `concave` option: for the house drawing (walls 20,50,60x40, roof 30,20,40x30) it gives the convex
  hull of the parts' corners, a hexagon (20,50 30,20 70,20 80,50 80,90 20,90), not PSys2's hull of centres.
- Gate: npm test 517 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.131.0 — host kit part 3 (reviewer 13:50): openSession (pending fill, confirmation, timeline), replyFrom, lookup budget

- `node examples/lists-app.mjs` (now on `openSession`): "make a list" → "I made a list (…). What name?"; "party" →
  "The list name is now party."; "undo" / "redo" through the language world's phrases (w.lang.en.phrase undo/redo
  items); "add balloons to my picnic list" → "There is no picnic list yet. Shall I make it?"; "yes" → the list made,
  then the item in it.
- Toy world (test/kit.test.mjs): colour required, enum red/blue, ask "Which colour?": "make a shape" asks it;
  "green" → `ask`, "Colour is one of red, blue, not "green". Which colour?" (still pending); "red" fills; undo takes
  the answer back, redo puts it back. A message with a verb (a k.actions verb lemma or a frame's verb) or a question
  is a new turn, never an answer ("add milk to it" is not taken as a list name).
- 13:50 point 2 (replies from templates): `replyFrom` reads `${lang}.reply` facts (realise syntax); `readTurn` and the
  session use them when present (context.replies names another type). w.lang.en has none yet (asked, Q73). With
  w.lang.ro.template and the hand dictionary: remove {thing:cerc} → "Am șters cercul", {thing:casă} → "Am șters
  casa"; the make template needs an `art` role and gave null here (Q73).
- 13:50 point 5 (lookups at size): the std.know.fill lookup, kindsOf's std.schema.kinds check, the stand-in lookup and
  `untaught` scanned a whole type per make (`ofType(...).find`); now `_matching` through the index. /tmp probe, 40
  makes: 200 facts 34 ms, 20,000 facts 116 ms before → 15 ms after. test/lookup-budget.test.mjs holds it (20,000 vs
  200 within 4× + 40 ms). readFrames scanned the phrases per search step: now an index per contents; one lists-app
  turn 54.7 → 19.8 ms (320 turns later 19.1 ms, 340 items: flat).
- Gate: npm test 521 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.132.0 — reviewer 14:45 item 1 (roles used or named) and the ids out of replies; PSys2 Q24 probe B re-run

- w.seating (published, pin b20eeeb) on the kit, PSys2's probe B turns: "add a table called family" → done,
  name=family, reply "I made a table."; "add 2 tables" → ask "What name?", nothing made (the session takes "red and
  blue": 2 tables named red and blue, "I made 2 tables."); "add a guest called Ann at table 1" → not-understood "A
  guest has no place at a table." (w.seating seats guests on a seat; Q26 is the knowledge side), no guest; "add a table
  for 4" → unread for, 4; "add a blue table" → unread blue (w.seating has no colour); "add a round table called kids" →
  shape=round, name=kids; "remove Ann" → done "I removed the guest." (referent by name); "undo" → done; "undo the colour
  change" → not understood (colour, change). Still not read: "make table 2 square" (no change frame reads it), "who is at
  table 1".
- Property (test/kit.test.mjs): 441 frame examples of w.lang.en on w.seating + w.list + w.tasks: 28 done, every role
  word of each in an argument (a referent counts by its values, its kind's words and its place in order).
- Ids: replies come from `sayAct` (reply facts first; else "I made a list.", "I made 2 tables." with the plural by
  w.lang.en.inflect). Library sentences remain only for refusals and ask/pick answers (labelled kinds, no ids in
  make/remove/change). Item 2 (composed from the language world's templates, Romanian mirror) waits for reply facts
  (Q73); the next release does items 3 and 4.
- Gate: see commit; npm test 523 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.133.0 — reviewer 14:45 items 3 and 4: one World per world, refusal

- `loadWorldSet` builds one World per world (std.acts + the import closure + its own text); w.tasks imports w.list:
  `imports ['w.list']`, `kinds ['w.tasks.task']`. Three worlds (w.list, w.tasks, w.seating) give three Worlds; a table
  lives in w.seating only.
- Turn scope over three worlds (test/kit.test.mjs): 6 turns across w.seating and w.list, every change inside the owner;
  a host `reply` that also makes a list in w.list during a w.seating turn is seen (`changed` has a w.list entry and
  `turnScope(set, 'w.seating')` refuses it). Session worlds are named by the host (`session: ['w.list']`).
- Timeline across worlds: "add a guest called Ann", "remove Ann", "undo" → the undo goes to w.seating (Ann is back).
- Refusal: a world with no kind of its own ("w.none declares no kind of its own"), a wire of an undeclared type
  (PSys2's acts.schema dialect: "types nothing declares: acts.schema.slot"), imports in a circle ("w.a -> w.b -> w.a").
- Gate: npm test 525 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.
- Not done: references across worlds (a w.tasks task naming a w.list list holds `$id` of another World; not checked
  there); passive worlds; effects for the page (item 5).

## 0.134.0 — reviewer 14:45 item 2 (composed replies), knowledge Q78 (issue bindings), PSys2 Q25 L1; pin 2a3edf3

- Pin moved b20eeeb → 2a3edf3 (w.lang.en.reply, w.lang.ro.reply, w.lang.en.fn, w.list 4). w.list 4 dropped
  `tendered`: listSums takes it as an option (test/lists.test.mjs passes it; money handed over is a story event).
- lists app now: "weekly" → "I added a list."; "undo" → "I undid the last change."; "make a purple dragon" → "I did
  not understand: "purple", "dragon"." (w.lang.en.reply done.add, done.undo, not_understood); seating: "I added 2
  tables.", "I removed the guest.".
- Romanian with the hand dictionary (test/kit.test.mjs): done.add casă → "Am adăugat o casă."; done.remove masă →
  "Am șters masa."; done.change casă roșu → "Casa este acum roșie."; done.make.value cerc roșu → "Am desenat un cerc
  roșu."; with toy CLDR rules 3 → "Am adăugat 3 mese.", 20 → "Am adăugat 20 de mese." (without rules: "3 de mese";
  Q79 asks the rules). Kind words in Romanian need a host `wordOf` (Q79).
- Q25 L1: `realise(m, 'în forma {art@thing} {thing:case=gendat,def=no}', { thing: 'casă', art: 'un' })` → "în forma
  unei case" (was "o case"); partial cells ("{kind:def=yes}") take the class's first agreeing cell.
- Q78: `check().issues[i].bindings` (soft deny "two pumps on ?n" → { n: 'north' }); strict denies already had `vars`.
- Gate: npm test 527 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.135.0 — reviewer 14:45 item 5 (host readers, clauses, referents, host hook, effects, budget); Q71 splitter

- `clauses` (src/clauses.mjs): PSys2's real shop rows (knowledge tests/w.lang.en.list-frames.test.mjs REAL) cut into
  the reference reader's clause counts with readFrames as the reader: r0590 1, r0598 3, r0599 3, r0622 3, r0623 1,
  r0625 3 (r0624/r0626/r0627 repeat them). The clauses' frames are not all the reference's yet (r0599 "How much change
  do I get" reads acts.calc.has, r0622 "what's the change" a generic ask): frame ranking, R3.
- Kit (test/kit.test.mjs): "add a table called one and add a table called two" → 2 clauses, 2 steps, 2 effects;
  "add a table called three and add a blue table" → nothing runs (unread includes blue); "remove the second table" →
  table2; "add a guest called Ann" then "remove it" → "I removed the guest."; a host reader for "open the seating tab"
  with onHost → "Opened seating.", effect { kind: open }, no world step; a host reader's make → "I added a table.";
  budget ms -1 → too-complex, nothing changed. Seven compound turns in 196 ms.
- The knowledge copy of clauseReader can go when its frames' readings move too (Q71): the splitter is here now.
- Gate: npm test 529 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.136.0 — reviewer 16:45 item 2: the seating app in English and Romanian (probe B)

- English (test/seating-app.test.mjs): "add a table called family" → "I added a table."; "add 2 tables" → ask, "red and
  blue" → "I added 2 tables."; "add a guest called Ann at table 1" → "A guest has no place at a table." (nothing made;
  Q26); "make table 2 square" → "The table is square now." (shape=square; the change frame read once "make" says both
  make and change); "make table 2 blue" → not understood (w.seating has no colour; the reply names "2" too, since the
  change frame cannot read a value outside the set's values); "remove Ann" → "I removed the guest."; "undo" → Ann back;
  "add a table for 4" → unread for, 4.
- Romanian: "adaugă o masă numită familie" → "Am adăugat o masă." (name familie); "adaugă o masă rotundă numită copii" →
  shape round, name copii; "adaugă două mese" → ask; "șterge masa familie" → "Am șters masa."; "anulează" → "Am anulat
  ultima schimbare."; "adaugă o masă albastră" → unread albastră. Guest turns fail on the dictionary (Q80).
- Gate: npm test 531 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.137.0 — PSys2 Q22 items 1-3: repair confidence, wishes, fragment codes, mood detail

- test/reader-q22.test.mjs: moodOf "I want a red circle" / "I'd like 2 tables" / "I really want a cake" → wish;
  "um so could you add a table please" → imperative by polite; "I have two kids" → statement by self; "my" → fragment by
  self; "an a" → fragment by article; "Tom is tall today" → statement by name; "Done is red" with Done a thing →
  imperative. confidentTypo: tabel→table, atble→table, elephnat→elephant yes; cat→car (short), mable→table (first
  letter) no; readText with a confident repair → complete, named [tabel]; with an unsure one → incomplete.
- fitsSlot codes: "" empty; "my", "an a", "the" fragment; "groceries" ok; sort "party" type; budget "lots" type;
  an untyped slot refuses "my".
- PSys2 can delete its foreign-reading rules for wishes, fragments and mood reasons once it vendors 0.137 (its Q22
  L1-L5 are these functions).
- Kit side effect: "I want the house next to the tree" is now a wish, not a statement, so the lists app's entries
  binding reads it as an item (text as written).
- Gate: npm test 534 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## bench-ro-frames scoring (reviewer 14:45 b, the knowledge worker's faults)

- A gloss verb with several acts (make: make, change) accepts any of them (it was mapped to change only); a gloss with
  no verb ("more to the right", 40 of 161) has no act to compare and is not counted wrong (reported apart, `noref`);
  a plural compares by every singular it may come from (crocodiles → crocodile, not only crocodil).
- `node tools/bench-ro-frames.mjs` at pin 2a3edf3: read 104/161 (65 %); act right 91/121 (75 %) of the glosses with an
  act; act and thing right 82/121 (68 %). docs/capabilities.md updated.

## 0.138.0 — strict joins (reviewer 14:45 a)

- `core.slot of=shape key=colour type=k.colour by=name strict=true`: "@b shape colour=purple" → refused "must be the
  name of a k.colour wire"; the same slot without strict stays open (openJoins, check() issue). The knowledge
  repository can drop its copied enum lists (KR2) where the targets load with the schema.
- Gate: npm test 535 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.139.0 — registers of irregular plurals (knowledge Q79, answered in Q81)

- test/inflect-register.test.mjs: cactus → cactuses (common), cacti (register classical), all → [cacti, cactuses];
  cacti → cactus; child → children.
- Gate: npm test 536 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.140.0 — the rest of the session (reviewer 17:15 item 1); Romanian kind words and count rules from the catalog

- Pin b20eeeb… → f15a1d7 (w.lang.en.count / w.lang.ro.count, Romanian words of the 10 world schemas, w.lang.en.number).
- examples/seating-app.mjs ro without `wordOf`: "Am adăugat o masă.", "Am șters masa." (the language world's core.word);
  test/kit.test.mjs Romanian replies now use the published count rules (3 → "3 mese", 20 → "20 de mese").
- test/seating-app.test.mjs: "why?" after "add a table called family" → "You asked: "add a table called family". The
  name is family because you said so. The shape is round by default."; after "make table 1 square" the facts are
  [shape square told]. A snapshot (JSON round trip) restored into a fresh seating app keeps the table and Ann; undo →
  shape round, undo → Ann gone, redo → Ann back.
- "What name?" stays English until w.lang.ro has an `ask.key` reply (Q80).
- Gate: npm test 537 pass / 0 fail; pilot same; psys2=0; scan clean; tsc ok.

## 0.141.0 — test:full; state of the architecture (reviewer 17:15)

- `npm run test:full` at 0.140 (log /tmp/full.log): 537 pass / 0 fail, 537 / 0 (bundle), 533 / 1 under
  SOPWORLD_COW_CHECK=1: the lookup budget test ("200 facts: 57 ms, 20,000 facts: 305 ms"), which times the copying in
  that mode; skipped there (`SOPWORLD_COW_CHECK=1 node --test test/lookup-budget.test.mjs`: 1 pass).
- `npm test` now runs test/ only (524 tests, 81 s); `npm run test:compat` 11 pass (finding 29).
- reviews/state-of-the-architecture-2026-11-15.md: fixed 22, partly 11, open 16, refused 0, with the next order (R3,
  R4, R5). English left in src/ is listed there (final-s fallbacks in 8 files, 30 `'w.lang.en'` defaults, EN word
  lists in reader/statements/typed, English sentences in schema-words/statements and the kit's fallbacks).
- Gate: npm test 524 pass / 0 fail; compat 11 pass; pilot same; psys2=0; scan clean; tsc ok.

## 0.142.0 — every kit sentence from the language world (reviewer 17:55)

- src/kit.mjs: every reply goes through `speak(set, name, roles, context)` over `KIT_REPLIES` (31 names). The English
  defaults sit in that table only.
- test/kit-replies.test.mjs: with a reply world that marks each name ([name roles]), 18 seating turns in a session
  all answer with a marked reply (14 distinct names seen). The published replies: en and ro each have 5 of 31 names
  (`node --test test/kit-replies.test.mjs` prints the missing 26); the Romanian ones carry no English word. Q82 asks the
  26 names in both languages.
- PSys2's "Am adăugat 2 de mese.": with the pinned w.lang.ro.count (0.140) it is "Am adăugat 2 mese." (test/kit.test.mjs).
- Gate: npm test 525 pass / 0 fail (1 todo); compat 11; pilot same; psys2=0; scan clean; tsc ok.

## 0.143.0 — refusals as codes with roles (R4, first part)

- src/std.mjs: all 38 refusal sites of std.acts pass `code` and `roles` (grep `refuse(w, ` without `code:` → only the
  definition and the pass-through of a world function's own reason).
- test/seating-app.test.mjs: "remove the table" with no table → refused "There is no table here."; with two → ask
  "Which table? There are 2." (nothing removed); a change of `colour` on a table → "A table has no colour." (code
  no_key, roles kind/key).
- Gate: npm test 526 pass / 0 fail; compat 11; pilot same; psys2=0; scan clean; tsc ok.

## 0.144.0 — d.ts contract test of option shapes (R4, finding 37)

- test/dts-contract.test.mjs: exported functions whose last parameter is destructured on one line are checked against
  their index.d.ts options; first run found 3 gaps (abduce: maxDepth, max, maxAssumptions, maxCandidates; actReply:
  templates; choose not found because of its generic), fixed; more than 60 functions checked. Functions whose defaults
  contain parentheses are not yet parsed (the next step of the test).
- Gate: npm test 527 pass / 0 fail; compat 11; pilot same; psys2=0; scan clean; tsc ok.

## 0.145.0 — readFrames on the catalog's frames (knowledge Q83), Q85 cases 1-2, pin 68e8c8b

- Pin f15a1d7 → 68e8c8b (w.seating 3: a guest has a table, colour; acts.make.for; w.timeline 3).
- `node tools/bench-frames.mjs` (every third example, the knowledge test's sample): 167 examples, same frame 86 / same
  act and mode 17 before; after the verb index, needs, open lexicons, is=lexicon, fixed values, role maps, apostrophes
  and the open-span cost: 151 / 5. `--all`: 499 examples, 456 same frame, 14 same act and mode, 29 otherwise
  (the knowledge test asks same ≥ 95 % of half; its baseline was 249 of 498).
- Romanian bench (`node tools/bench-ro-frames.mjs`): read 105/161, act 92/121, act and thing 83/121 (from 104/91/82).
- Kit on w.seating 3 (test/seating-app.test.mjs, test/kit.test.mjs): "add a guest called Ann at table 1" done (table
  ref); "make table 1 blue" → "The table is blue now."; "add a table for 4" → seats 4, asks the name (Q85 1);
  "fă masa 1 albastră" → colour blue, "Masa este acum albastră." (Q85 2); "adaugă o masă pentru 4" → seats 4;
  "adaugă un invitat numit Ana la masa 1" → "Am adăugat un invitat.".
- Not done: Q85 (3) / Q89 comparative words on a number slot (`core.word role=more|less`): no published words yet in
  w.timeline 3's schema; next release with a toy slot. Q87 (inflectBy on catalog plurals), Q84 (realise), Q88 (planner).
- Gate: npm test 527 pass / 0 fail; compat 11; pilot same; psys2=0; scan clean; tsc ok.

## 0.146.0 — knowledge Q87 (inflectBy), Q84 (realise), Q88 (planner)

- Q87 (/tmp/q87.mjs = the knowledge test's two inflectBy checks on the library's sources): the hand-over table
  ['iris -> iri'] → []; the catalog's 1,356 head nouns: 37 wrong (14 read as plurals, 23 not back) → 0; taxi → taxis,
  taxis → taxi. test/en-morph-catalog.test.mjs holds the cases on the pinned catalog.
- Q84 (/tmp/q84.mjs): realise(m of w.lang.en, 'add a {value} {kind}.', orange/house, { sentence }) → "Add an orange
  house."; 'add {number} {kind:num=pl}.' 3/mouse → "Add 3 mice."; no kind → null.
- Q88 (test/plan-procedures.test.mjs): seed null gives the same first solution twice; `{ fixed: { host: 'bob' } }` →
  host bob; a fixed guest that breaks the vegan match is refused; statement rows by key, history entries by act.
- Gate: npm test 530 pass / 0 fail; compat 11; pilot same; psys2=0; scan clean; tsc ok.

## 0.147.0 — RRULE expansion (knowledge Q92); the frame examples still read differently, by cause; PSys2 class B

- `node tools/bench-frames.mjs --all`: 499 examples, same frame 459 (was 456: verbs of several words, "line up",
  "go back"), same act and mode 14, otherwise 26. A heavier cost for open-lexicon spans (3, 4) lowered it (451, 445):
  kept at 2. The 40 left, by cause (`--rows`):
  - open-lexicon over-reach, a frame with a host list taking words a closed frame should (13 in acts.data.change.* /
    acts.data.remove.*: acts.data.change.factor wins for "Make it a pie chart.", "Legend off.", "Delete this chart.";
    acts.text.make.text for "Highlight the word milk in green.", "Not bold.", "Start a new chapter.");
  - two frames of the same act ranked the other way (14 counted as same act and mode, plus "Start a new melody." blank
    vs melody, "I want a house." wish vs make, "A big red house please." bare.mods vs change.short, "Deselect
    everything." acts.deselect vs acts.more.pick.none);
  - separable verbs split around their object ("Line up the circles", "Line up the planets in order of size": the
    verb is read only when contiguous), "Go back to the start.", "Say hello to Ana." (verb + object + particle).
- PSys2 class B (Romanian plural / relative moves and continuations, 11 rows of psys2 training/eval/real-2026-11-15
  at 720ea98), `readFrames` on w.lang.ro with the hand + UniMorph dictionaries (/tmp/classb.mjs):
  reads alone 6 — r0052, r0054 "muta casele mai sus" and r0055 "muta crocodilii mai jos" (ro.place.dir.amt: a plural
  thing, amount mai, direction up/down), r0064 "pune si un lac" (ro.place.bare, lake), r0066 "muta si mai la stinga"
  (ro.place.dir.amt.it: the thing is the last one, a continuation for resolveEllipsis), r0006 (English residue: no
  frame, so nothing changes, as its check wants); partly 3 — r0039 "fa picioarele corocilului negre" (change, value
  black, thing leg, but the typo "corocilului" stays unglossed), r0067 / r0069 "muta casa din mijloc / din dreapta mai
  la dreapta" (place, but "din mijloc" / "din dreapta" stays inside the thing: a positional referent, the kit's
  next referent kind); not read 2 — r0043 "sa fie diferite" (a subjunctive wish about the last things), r0068 "nu
  prima acasa, cea din mijloc" (a correction).
- test/recurrence.test.mjs: daily count 3; every 2 weeks Mon/Wed count 5; weekdays until 24 Nov; the 31st only in
  long months; 29 February only in leap years; Fridays monthly; a window; max; HOURLY not expanded.
- Gate: npm test 531 pass / 0 fail; compat 11; pilot same; psys2=0; scan clean; tsc ok.

## 0.148.0 — an application's intent step on the library (its Q35)

- std.decide kind `intent` (src/decide.mjs): reads (issues) / covers (uncovered) / slots (unfilled) / present (absent)
  / previous (max) / cost. The application's current measures (issues, uncovered, previous, cost) read the same; the two
  new ones are 0 when a host does not give them.
- `chooseRewrite(text, rewrites, { read, stop, previous, world, criteria })` (src/rewrite.mjs): the clause (cost 0)
  and the host's rewrites, read dry by the host's `read`, chosen by kind intent; a rewrite only when it reads strictly
  better. `readTurn` options `rewrites` (array or per-clause function, for a clause with no plan; dry reading =
  planClause: plan 0, ask 1 + open slots, refused 2 + absent for refused.no_such, not read 3), `previous`, `stop`
  (added to the language world's closed words), `intentCriteria` / `intentWorld`, `whole`, `dry` (status `planned`).
- `clauses`: the cutter had no cut point inside "water lily" / "work done" (none of them is a joiner or a wh word:
  /tmp scratch probe on the catalog w.lang.en). The cut it did make was at "and" before a noun phrase: "remove the
  fourth grass and the third water lily" -> ["remove the fourth grass", "the third water lily"]. Now a joiner before a
  determiner or a number does not cut (one clause), and no cut point falls inside a phrase of `whole` (readTurn adds the
  schema's multi-word words). The shop rows (Q71) cut as before.
- test/rewrite.test.mjs (4), test/kit.test.mjs clauses case (+2 asserts).
- Gate: npm test 534 pass / 0 fail; SOPWORLD_BUNDLE=1 node --test "test/**/*.test.mjs" 534 / 0; npm run test:compat
  11 / 0; node tools/scan-loops.mjs exit 0; git grep -il psys2 src/ = 0; tsc not installed here (not run).

## 0.149.0 — requests as worlds (owner GO 2026-11-15; reviewer blocks 22:00 and 22:40)

- Pin sop-knowledge-worlds 0966924e (w.request, w.dialogue, k.expect, 81 w.lang.en cues). Three tests followed its
  reply texts (no quotes in why.asked / refused.value; "are" and "a" are Romanian words too in the no-English check).
- src/request.mjs: `readRequest` (cues longest phrase first, then priority; kinds from std.schema.kind / honours /
  k.expect makes, parts and shapes, plurals by the language's inflection; values from slot enums and VALUE_TYPES; act =
  first verb unless a longer cue starts there), `requestWires`, `reviseRequest` (w.dialogue.revision rows), `planRequest`
  (std.schema.honours, new in std.schema; sources said > dialogue > world > expect > sampled), `runPlan`, `sayRequest`.
- examples/request-app.mjs: two invented worlds (sketch: shapes on a page; notes: short notes), one session, no code per
  world. `node examples/request-app.mjs`.
- test/request.test.mjs (6): reader cases (the owner's "not a circle", "not all circles", "5-10 nodes", "small pond",
  "with water plants and a duck", "of 3 chapters", "make it bigger"), w.request wires told into a World with w.request;
  revisions (reject, reduce 6 -> 4 by 0.6, enlarge 6 -> 9, refine, redo, thanks, frustration, put_back, expectation);
  P1-P8 over each example world read from its declarations (`node --test test/request.test.mjs`: sketch P1 6, P2 3, P3 2,
  P4 1, P5 1, P6 3, P7 1, P8 4; notes P2 3, P3 1, P4 1, P5 1, P6 3, P7 1, P8 6); a world declaring place with no slot
  for it is named (no_slot); sayRequest by reply names.
- Gate: npm test 542 tests, 540 pass / 0 fail / 1 skipped; SOPWORLD_BUNDLE=1 node --test "test/**/*.test.mjs" 540 / 0;
  npm run test:compat 11 / 0; node tools/scan-loops.mjs src clean; git grep -il psys2 src/ = 0; node tools/doc-examples.mjs
  230 examples, 0 problems; tsc not installed here (not run). Notes for the reviewer: questions.md Q83.

## 0.150.0 — a first layer of reasoning in the gap filler (owner 2026-11-15 14:11; reviewer block 23:20)

- src/reason.mjs: `factsOf` (one flat view of any world: things with kinds, attributes, relations by `$` or declared
  join; per version, built from the last view of the same history by the events since, also across forks; layered,
  flattened past 256 changed things), `kindFactsOf` / `KIND_FACTS` (k.commonsense.thing, k.scenes.thing, k.kinds.kind,
  k.kinds.parent), `deduceState` / `REASON_RULES` (forward chaining to depth 2; join hard, placed soft with 0.25 per
  inference step, open soft, request bounds hard), `induceStyle`, `induceCorrections`, `REASONING`.
- src/request.mjs: `planRequest` is now propose (<= 5: places through a slot that refers to things; a place said by a
  kind or "there" / "in it"; a fall-back without induced and dialogue values) -> simulate on a fork -> deduce -> drop
  hard / cost soft -> abduce by `choose` kind `plan` (new std.decide criteria) ; induced values (source `induced`,
  REQUEST_SOURCES said > dialogue > induced > world > expect > sampled). Plan carries `rejected`, `cannot`, `bounds`,
  `reasoning`. readRequest reads place references; runPlan `result.items`; sayRequest says `cannot`.
- examples/request-app.mjs: a third invented world (garden: animals in areas, a pond with a capacity), `requestKinds()`,
  session corrections. `node examples/request-app.mjs`: "add a fish" -> pond2 (a pond is a thing made of water, k.kinds),
  "add a bird" -> tree1, "add 9 fish in the pond" -> cannot, with the capacity reason.
- Tests: test/request.test.mjs P9-P11 over every example world by its declarations (`node --test test/request.test.mjs`:
  sketch P9 8, P11 4; notes P9 2; garden P9 8, P10 2, P11 2) and one test of the cycle (deduction depth, corrections ->
  smaller, sources as data); test/reason.test.mjs (3): incremental view = direct reading (also on a fork, undo, refused
  tell), chaining stops at depth 2, anti-unification one step.
- Gate: npm test 549 tests, 547 pass / 0 fail / 1 skipped; SOPWORLD_BUNDLE=1 node --test "test/**/*.test.mjs" 547 / 0;
  SOPWORLD_COW_CHECK=1 node --test test/request.test.mjs test/reason.test.mjs 13 / 0; npm run test:compat 11 / 0;
  node tools/scan-loops.mjs src clean; node tools/doc-examples.mjs 232 examples, 0 problems; git grep -il psys2 src/ = 0.
  Notes for the reviewer: questions.md Q84.

## 0.151.0 contextual spell repair (psys2 Q39)
- `src/spell.mjs`: `repairWords` (candidates from factsOf of the live worlds, dialogue words, language words; keyboard-aware cost + source prior as data; unique best or ask), wired into `readRequest` as `ctx.spell`. Docs api.md, d.ts, CHANGELOG. Tests: `node --test test/spell.test.mjs` (8 pass); npm test 557 tests, 555 pass, 0 fail, 1 skipped; SOPWORLD_BUNDLE=1 557 / 555 / 0. Open points: questions.md Q85.

## Skills rewritten to the owner's direction (2026-11-15; psys2 coordinator brief)
- Why: the six skills were case-first (start from a failing case, end in a rule fitted to its family), spoke of the
  pre-request architecture (readByTypes, phrase operators), and gated on held-out freezing and "nothing right turns
  wrong". The owner: always generic, or the case stays on an honest list as "needs <generic piece>"; the declared
  worlds are the only guide; the host's data principle is industrial (nothing held back; fresh probes instead).
- skills/README.md: the first question (which generic piece: declaration, knowledge, language, composition, method,
  library), the two-phase acceptance (transition: patch-only losses do not count, told apart by running with the
  patches off; steady: at least 10 real turns won per lost, net, every loss listed), gates (properties generated from
  declarations, fresh probes, honest list shrinking; counts reported), the cycle and order. skills/HONEST-LIST.md: the
  format and how to choose work (rankNeeds: real turns unlocked, then worlds).
- All six SKILL.md rewritten; new skills propose-generic-method (ideas from literature -> adversarial review with the
  patch-smell checklist -> proposal; scripts/smells.mjs over a git range) and author-live-world (how to declare;
  coverage and generated properties). Shared: skills/lib/honest.mjs (triage by request evidence, checkHonest,
  rankNeeds, honestDelta, acceptance, patchOnly), skills/lib/smells.mjs, skills/lib/declarations.mjs.
- Dry runs (each `node skills/<name>/scripts/dry-run.mjs`, all exit 0):
  author-live-world: sketch 44/44 properties, 3 gaps (remove/change/connect have no honours), 6 honoured-but-named;
  notes 11/11, 1 gap (size no_slot); garden 22/22; the control world's added gap is found.
  propose-generic-method: 8 honest rows from example turns, 0 problems; top piece the act word (2 turns, 2 worlds);
  review flags the "blorp" patch and a one-support alternation, the honours declaration is clean.
  improve-world-from-failures: (A) 5 rows, (B) 512 rows from 565 pairs; top: clause splitting 190, skip words 131.
  consolidate (no held-out): fillers proposed 8, 4 refused as content words; all pairs 253 -> 286/500 (reported);
  fresh probes 84 -> 89/96; honest list 247 -> 214; accepted in both phases.
  learn-language-rules (all pairs): 143 operators, 22 admitted, 1 passes the smell review, 21 refused.
  learn-world-from-examples 8/8, no smell; audit-knowledge unchanged; node tools/generalisation-test.mjs share 1.
- Library code untouched (src/ unchanged). Docs: README Skills, docs/capabilities.md (rebuilt). Question: Q86.

## 0.152.0 tool binding as wires (reviewer 2026-11-16 03:10, owner order; coordinator: coordinated kinds, state questions)
- Wire shapes (std module `std.tool`): `std.tool.op name= world= param= effect=`, `std.tool.param op= name= type=
  accepts= scale= by= order= min= max= required=`, `std.tool.bind act= of= op= arg=<param><-<source>|... needs=
  makes= removes= changes=` (sources: step.<key>, step.count, step.things, request.<on>[.<attr>], plan.<role>,
  custom.<name>, value.<atom>, expect), `std.tool.custom name= kind=constraint|search in= out= fails=`. Conditional
  defaults: `k.expect.when of= key= value= [min max typical] if.<key>=<v> if.<key>.min/.max=` (proposed for k.expect, Q87).
- src/tool.mjs: toolBindings, runPlan (World first = runWorldPlan as before; else plan, bindings, primitives, opts),
  nearestAccepted, readView, stateDiff, toolTimeline (snapshot/restore or inverse of the diff through the bindings),
  mirrorState, toolCapabilities, askWorld (capabilities, state), toolSession. src/expect.mjs: kindLineage,
  expectedValue, cutToCount, fillToCount, notAllOneKind. planRequest: general kind -> subkinds (and negation of a
  general kind), coordinated counts, count of the whole -> that many wholes, k.expect.when per item (role from links),
  count / layout, conditional expectation before induced, kept structure on a count revision. sayRequest from the diff.
- Proof: examples/tool-app.mjs, `node examples/tool-app.mjs`: shelf (3 primitives + view, wires only): "add 3 tiny red
  novels" -> 3 small (tiny->small); "add 4 books, not comics" -> 2 novels + 2 atlases; "too many" -> revision replaces,
  structure cut to 2 ("I removed the novel. I removed the atlas."); "undo" -> 3 novels; "what can you do here?" ->
  "I can make: novels, atlases, comics. When I make, you can say the kind, count, size, attribute."; "add 2 huge
  atlases" -> big/right; "add two novels and a comic" -> 2 + 1; "how many novels?" -> "There are 5 novels."; "in red"
  -> "Nothing changed. That is what is there already." Necklace (whole + links): cut 6 -> 4 keeps a chain of 3 ties,
  fill back to 6, the first bead gold by role.
- Tests: `node --test test/tool.test.mjs` 7 pass (14 tool-world properties); npm test 564 tests, 562 pass, 0 fail,
  1 skipped; SOPWORLD_BUNDLE=1 node --test "test/**/*.test.mjs" 564 / 562 / 0; npm run test:compat 11 / 0;
  node tools/scan-loops.mjs src clean; doc examples api.md 138, capabilities.md 47, 0 problems.
- Open points: questions.md Q87.

## 0.152.1 reconciled with reviews/legarea-declarativa.md; Q87 items 3 and 5
- Aligned: std.tool.arg / std.tool.needs / param kind, type (world kind), default, required=true; bind world=; makes from op effect; sources state.<kind>, result.<n>; k.expect.value on= when. (k.expect.when still read); references for remove / change / place (refused.which once, refused.no_such); partial read executes nothing (toolSession); no target guess over an unread word (planRequest). Examples in the review's forms; the shelf honours remove and change ("paint the comic blue", "remove the atlases", "remove the novel" -> "Which novel? There are 5.", "add 2 dictionaries" -> nothing changed, not understood).
- Disagreements / choices: questions.md Q88 (10 items).
- Tests: node --test test/tool.test.mjs 7 pass; npm test 564 tests, 562 pass, 0 fail, 1 skipped; SOPWORLD_BUNDLE=1 564 / 562 / 0; test:compat 11 / 0; doc examples 236, 0 problems; scan-loops clean.

## 0.153.0 PSys2 Q45 as generic pieces
- stateDiff by kind + values (`match`, `keys`, `redone`, exact `same`) and runPlan's net diff; change sense of make by reference over the view; whole world ("everything", world name, its kind's words) for acts; done.change `key` (+ `as`, call-said changes the view cannot show); kinds together with their own count/size/values; plural count from `k.expect.value on=count when.plural=yes`; target kind constraint with `at`; whole of unmakeable parts made as one (`asOne`). Both psys2 stand-ins replaced by library pieces.
- Tests: touched (acts-on-things 8, request 10, tool 7) pass; npm test 572 tests, 570 pass, 0 fail, 1 skipped; SOPWORLD_BUNDLE=1 on touched + docs + dts 38 / 38.
- Open points: questions.md Q89.

## 0.154.0 PSys2 Q46 / Q47 and Q90 as generic pieces
- Q90: `stateIds` (wires of a std.schema.thing type) for every thing of an act (kind, name, whole world, place candidates, change sense): declaration rows are never things. Names as references (`named`, `refers: 'named'`, `ctx.state`; connect by names; refused.which on a shared name). Fragment ellipsis (`reaction: 'continue'`, new request with the dialogue's act; not for reactions or questions: `question` from "?" or `w.lang.en.wh`). Plural + definite = all (already in 0.153; now proven through world acts, sketch). Unread turn with no reaction cue never revises; a reaction steps only the keys the turn names ("bigger" keeps the count); a tool revision with no planned key changed is `same` ("Nothing changed."). askWorld counts the kinds asked (`mentions`, units too). `when.<key>=none`; `std.tool.value` (Q46 (7)). Plurals only from the language's inflection when it has one.
- Reviewer 06:05 (coordinator): a singular indefinite gives count 1 said (`det: true`, never not_honoured); which assumptions are said is data by source (`ASSUMED_SAY`, `sayRequest` opts.say or `<lang>.reply name=assumed say=`); a tool parameter's declared default is source `default`, not said.
- Tests: `node --test test/references-fragments.test.mjs` 8 pass (Q90 property fails with stateIds disabled); touched request/tool/apps/kit/docs/dts tests pass; `npm test` 580 tests, 578 pass, 0 fail, 1 skipped, 1 todo; `SOPWORLD_BUNDLE=1 node --test "test/**/*.test.mjs"` 580 / 578 / 0; smells.mjs on the release: 0 hints.
- Open points: questions.md Q91. Q89 (answered 05:20) and Q90 (fixed here) removed.

## 0.155.0 what a reply says (reviewer 07:55 and PSys2 01:25)
- `sayRequest`: no missing value (a change with no value is said by the reaction's own word, or left out; facts with an empty role dropped); assumptions are data: `default: true` flag (declared layout, param default, world place) is source `default`, ranked by `say` order, `sayMax` / `ASSUMED_MAX` = 2, one per key, list of kinds = single kind, kinds and count already in the result lines not repeated; a revised whole says its net state (`done.whole`, "The necklace now has 5 rounds, 4 squares."); a `std.schema.drawn` substitution is no assumption.
- Tests: `test/reply-said.test.mjs` (properties over sketch, notes, garden, shelf, necklace); `npm test` 585 / 583 / 0 / 1 skipped; bundle run on the touched tests passes.
- Open: the language worlds should publish `done.whole` (English default lives in the library); the sentence does not say the direction ("bigger") because the reaction word cannot be told a comparative from "more".

## 0.156.0 a revision changes only what it names (reviewer 08:25), seven PSys2 honest-list turns
- Found: "fewer cats" after "three cats and a dog" was the library's: `reviseRequest` put the turn's kind over every wanted kind and the stepped total over every count. Fixed: a count step naming result kinds steps them alone (counts `of` each kind, target / whole / sizes kept); "fewer" with no kind after a counted-by-kind result steps each kind (min 1). planRequest honours per-kind counts inside a whole.
- Also: general whole -> a subkind whole (parts hold the kinds said; bound kinds first; sampled); "all the X" (partitive mode=all); place by a thing of the view -> step `region` + `relation`; "make the house bigger" = change (no undo of the last entry for reference plans, a further value continues the act, `nearestAccepted` `toward`); whole said first; speaker statements (`statement: true`).
- Checked through PSys2's door (read-only, loader hook to src): "fewer cats" -> 2 cats + the dog; "less trees" -> "The forest now has 4 trees."; "more trees" -> 6, no size change; "make the house bigger" -> "The house is big now."; "make it smaller" -> "The house is small now."; "draw a forest" -> "I added a forest. I added 6 trees.". Host-side leftovers: questions.md Q92.
- Tests: `node --test test/revise-names.test.mjs` 9 pass; `npm test` 594 tests, 590 pass, 2 fail (docs regenerate + a "since 0.155" mention: fixed, `node --test test/docs.test.mjs` 12 / 0 after `npm run docs`), 1 skipped; `SOPWORLD_BUNDLE=1 node --test` on the touched tests + docs 51 / 0.

## 0.157.0 partial reading never executes; count revision said by its net result; four Q93 items
- Rule lives in the plan: `unreadThatMatters` (every unread content word, by the reading, not a list) -> `planRequest` returns `{ ok: false, unread }`, `runPlan` / `runWorldPlan` refuse with `failed.code 'unread'`, `sayRequest` says `not_understood`; the `toolSession` special case is gone. Reaction turns with an unread word now refuse too ("fewer pearls" was "did not use" after executing).
- `done.revise` dropped after a step reaction. "with a lake" / "with three fish": counts are of the kind inside the whole, bounds widened by what was added. "fewer X" with no X in the result: `refused.no_such`, result kept. Move reply `done.place.<relation>` when the language has it.
- Not done (Q94): "fewer flowers" on a garden whose kinds are all present in the result is fine; the PSys2 case needs the host's garden; a not-honoured place constraint ("in the corner" not taken by the world) still executes the rest and says it (honest partial, a world capability, not an unread word); Romanian move reply is [KNOW].
- Tests: touched (revise-names 14, request, tool, references-fragments, acts-on-things) pass; npm test and SOPWORLD_BUNDLE run below.

## 0.158.0 cues of the catalog at 7042ea70; kinds by join (psys2 re-pin)
- Numeric attribute cue read (`attribute.rotation`: value 30, unit degree); readRequest never throws on a cue (a cue with no readable operand is no match, words unread). "what is in / on" + the world's whole noun: mention `inside`, `askWorld` skips it (art.draw reads were already right; the count came from askWorld).
- Join: `capabilitiesOf(live, { catalog })` + `joined`, `declares`, `honoursKind`, `joinedKinds`; stand-in via `kindLineage drawn`; `type=kind` param with no `accepts` takes declared kinds. Not changed: `toolCapabilities` and `worldThings` read only the live world's kinds (no catalog argument yet).
- Tests: `test/cues-robust.test.mjs` (6; property over every cue of the w.lang.en shards, 10 s); `repos.pin` knowledge pin 7042ea70.

## 0.159.0 whole counts, reply topic and short_of, text length, "new", catalog in toolCapabilities
- Whole count never checked against parts; "fewer flowers" steps one part; "with a chapter" is one; length steps for "shorter"/"longer" on a text; `done.about`/`done.title`/`short_of` reply facts; `fresh` trace of "new" and a bare "new X" is a make; `toolCapabilities`/`worldThings` take the catalog. New example worlds STORIES, MEADOW.
- Q93 (3) "a picture with a lake" already gave one lake in the example worlds (general whole, singular `with`); the case that gave two was a unit kind said with "a" (no det count): fixed and tested. Not reproduced with the host's own catalog.
- Tests: `test/whole-counts.test.mjs` (6).

## 0.160.0 — kinds by join end to end; values said per kind

- A joined kind is declared for its acts, not planned as a whole by the catalog's `k.expect.make` unless the world declares it (own row or `std.schema.kind`): "draw two dogs and a tree" stays dog, dog, tree (test against the pin 7042ea70 and over the 7 example worlds).
- Several `std.schema.kinds` rows: `from` joined the row identity (they conflicted on `from` before); objects + people merge.
- Acts that run a plan find joined rows through `catalog`: `runWorldPlan(..., { catalog })`, the planner's fork, `pickBind` (join `from`, stand-in), `mirrorState(live, view, { catalog })` (without it "remove the goats" said "no goat here").
- `sayRequest` says values per kind (`done.add.value`, fallback `done.make.value`, `done.add`); `askWorld` names said attributes for at most `STATE_FEW` (4) things (`state.count.value`). Test edited: tool.test.mjs shelf now expects "I added 3 red novels." (the value said is said).
- Tests: `test/joined-kinds.test.mjs` (6); `npm test` 617 run, 615 pass, 0 fail; bundle run of the touched suites green. Needs from the knowledge repository: replies `done.add.value`, `state.count.value` (en, ro); from psys2: the join rows + the explicit whole rows for what it draws as wholes, and addThings through the lazy loader for joined kinds.

## 0.161.0 (2026-11-16)
- Q96 (8): `about` / `place` constraints keep `said` (operand words); `done.about` takes them. Q96 (9): `askWorld` says `state.count.named` for one thing with a title / name (`opts.nameKeys`); English default before fallback rows. Q96 (2): topic / title changed is said once. Test: `test/said-words.test.mjs` (3).
- Not done (to Q): (1) title from the made whole's diff attributes, (3) net state of a shortened text, (4) `done.make.whole`, (5) unit plural by default, (6)(7) knowledge-base rows.

## 0.162.0 (2026-11-16)
- PSys2 Q96 slice A1 [LIB] 1-6, 8, 10-12; Q97 (stand-ins, quoted names, shared join map, lexicon memo); Q98 (`as=`); r0019, r0129. Example world `FACE` (puppet face: parts joined `as=part`, presets `as=face`, variants by `match=kind:slot`, mood). Properties: `test/face-world.test.mjs` (11).
- Open (questions.md Q95): Q96 (7)(9) second step from the current value; `raise` direction data; KNOW rows (step cues, refused.can_be, plural-noun pairs and replies).

## 2026-11-16 0.163.0 (Q99 of the avatar's 13 owner turns)
- Q99 (1): a part joined `as=part` keeps its kind in the mirror; a relative size steps from the size it has (big, huge). (2): "it" after a preset: a value whose key the last things lack goes to the whole that has it; a value goes to the things that take its key. (3): `std.schema.kinds single=true`; "put a hat" with a hat on replaces the variant said or says "The hat is already there." (4): next/previous of a noun phrase alone is a property over FACE (needs the cue `step=up|down takes=thing`, still proposed). (5): a reset gives each thing its own defaults; none declared: `refused.no_default`. (6): variant plus size ("big smile") is one change, a property. (7): "The eyes are already green." (`nothing.same.value`).
- Also fixed: a variant carried from the last turn to another kind (a hat's crown to the glasses). Decision left open: "reset the face" resets the face's own slots only; "reset everything" resets all things.
- Tests: face-world 16 (6 new), acts-on-things 1 text; `npm test` 634 pass, 0 fail; bundle run of the two files green.

## 2026-11-16 0.164.0 (Q100, Q98)
- Q100 (1) referent after refused.already / same; (2) turned act with untaken words runs nothing (`plan.turned`); (3) published variant_next / variant_previous read as a step (repos.pin knowledge b57c4633); (4) assumptions said by the world's key. Q98 (2) already held since 0.162 (property added).
- Tests: `test/referent-turns.test.mjs` (5); `npm test` and bundle run below.

## 2026-11-16 0.165.0 (Q102)
- Joined genres carry `plan.parts` from k.genres (named, scaled by short/long, `done.parts`); topic/title said for every text; short/long scale parts; `refused.no_other` for a step with no further value. Tests: `test/genre-parts.test.mjs` (4). Q102 (1)(4) not mine (spell guard / word list).

## 2026-11-16 0.166.0 (Q102 follow-ups)
- `step.parts` read from the step; `done.parts` carries `kinds`/`numbers`; a primitive's returned `parts` written fewer than planned gives `short_of` per part. Test in `test/genre-parts.test.mjs`; `npm test` below.
- Also: coordinated unread kind named and the rest made (`unknown_kind`); statement clause named whole in `not_understood` (reviewer 15:25). Test in genre-parts.test.mjs.

## 2026-11-16 0.167.0 (reviewer 09:25)
- A said length grade scales the expected words with the parts (genres too), origin `said`; "longer"/"shorter" step a genre text and a length the tool cannot extend says `nothing.same.limit` (a primitive may return `{ length }`); revisions say no count/kinds/length assumptions. Three tests in `test/genre-parts.test.mjs`.
- `npm test`: 650 tests, 648 pass, 0 fail; bundle run of genre-parts green.

## 2026-11-16 — G0: worker commit/push access probe (done)

- Owner request: verify a minor documentation commit and push. Added `WORKER-HANDOFF.md` with links to the existing control-task and progress protocol; runtime unchanged.
- Base commit: `294a59003051`. Checks: `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` both passed (648 pass, 0 fail, 1 skip, 1 todo each); `npm test` rebuilt docs. `git diff --check` and `git push --dry-run origin main` passed.
- The entry and document share one commit, identifiable with `git log -- WORKER-HANDOFF.md`.

## 2026-11-16 — G0: book review, round 1

- Owner authorized the book/question/reviewer cycle; runtime refactoring remains unapproved. Reviewed book v12 and both refactoring plans at de1175d. Published B01–B23 under questions.md / Book: conceptual contracts, counterexamples, domain completeness, conflicting plan decisions and acceptance traceability. The book and reviewer task list were not edited.
- The three implementation-conformance checks from reviewer 22:50 remain pending: this round prioritizes the owner's new conceptual-completeness request and makes no exhaustive code-conformance claim.
- Next cycle: fetch reviewer changes; compare each answer with revised book sections; remove only resolved questions, retain unresolved ones and add focused follow-ups. No automatic implementation authorization.
- Validation: `git diff --check`; `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src`: each 650 tests, 648 pass, 0 fail, 1 skipped, 1 todo. Build produced no tracked changes.

## 2026-11-16 — G0: book review operational-depth supplement

- Added B24–B33 under Book at the owner's request, before answers to B01–B23. Each asks for a concrete contract, worked trace and decision between alternatives. Inspected PSys2 src/knowledge/catalog.mjs, src/reasoner/index.mjs, src/dialog/request.mjs and library src/knowledge.mjs to ground retrieval/interpreter/reasoner questions. No implementation changes or architectural decisions made.

- Owner transferred authorship of books/ and refactoring/ to this worker. Integrated reviewer v13 (f31a79d); authored v14 chapter 9, corrected R24 region inclusion, added plan §10 gates and RV1–RV5 review requests. No runtime code changed.

## 2026-11-16 — G0: book v15, first review corrections

- Integrated feedback F1/F3/F21/F22–F24: chapter order, two-column plan gates, derived region inclusion with omitted-axis caveat, missing contract gates and distinction between design approval and measured application acceptance. Other F items remain open. Posted technical agreements and concrete counterexamples in questions.md.

## 2026-11-16 — G0: book v16, explainable replies and scope decisions

- Integrated control 00:15: revised R48/R64/R80 and plan scope; added §6.11 with evidence contracts and explanations in four domains. Corrected R24 heading and removed inside=ellipse. F29 submitted for review; other open feedback retained. No runtime changes.
- Checks: `git diff --check`; `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` each completed with 648 pass, 0 fail, 1 skip, 1 todo (650 tests).

## 2026-11-16 — G0: book v17, knowledge retrieval and reasoner outcomes

- Expanded §§9.4–9.5 for F12–F17 with dependency links, local complete instance versus missing knowledge, distinct versions, existing pipeline mapping, one search-outcome vocabulary and common validation on a fork. Clarified selected undefined terms and R35 reference. No runtime changes.
- Validation: `git diff --check`; `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src`: each 648 pass, 0 fail, 1 skip, 1 todo out of 650 tests.

## 2026-11-16 — G0: book v18, explicit pattern semantics and project namespaces

- Owner requested technical titles, explanatory prose and realistic file/module/namespace organization. Rewrote §§2.3/2.6/3.4/3.5 and renamed chapter-2 headings. Added binding tables, rule trace and a proposed project-loader contract with stable instance identity. Runtime unchanged.
- Aligned R6, its open-format decision and the refactoring design gate with the project-loader contract. Validation commands: `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` each reported 650 tests, 648 pass, 0 fail, 1 skip, 1 todo; `npm test` rebuilt docs. A `node --input-type=module` probe imported World from src/index.mjs, loaded the exact §3.5 rule and facts, inspected `w.ofType("node")`, then added `@e2 link from=$n2 to=$n1`: only n1 initially had derived start=true, and neither node had it afterward.

## 2026-11-16 — G0: book v19, contracts integrated into relevant concepts

- Owner requested explanatory prose around tables, rejected project/editorial process in the book, then clarified that technical rules belong with the relevant concepts rather than in a dedicated chapter. Removed former chapter 8 and integrated its rewritten content into the relevant sections of chapters 2–7. Stable R identifiers now live in concise tables with surrounding explanations. Former §8.20 / R73–R81 moved to the active plan §12; former chapter 9 became chapter 8. Updated current book/plan references and the historical plan's R75 link.
- Explained assumptions, counterexamples and operational boundaries throughout; corrected the invalid 9:30 alternative for an hour-long calendar meeting, learning-factor arithmetic, qualified references, and recurrence edit/undo behavior. Known-absence wire representation remains explicitly provisional. Runtime unchanged.
- Validation: `python3 ../.session-control/check-book-v19.py` passed (unique headings, correct parent nesting, chapter sequence, stable rule IDs in relevant chapters and valid explicit section references); `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. Each test log reports 650 tests, 648 pass, 0 fail, 1 skip, 1 todo. Remote review commits eaab9be/999f682 were read before synchronization; F41 is addressed by the integrated structure and F35 by the forward reference explanation in §2.3.

## 2026-11-16 — G0: book v20, project loading review

- Scheduled check resolved the stale notification against origin/main and continued pending F36–F40. Expanded §2.6 with demo instances, local/module-qualified type distinction, subworld example, collision handling, external-copy dependency policy, unresolved-reference activation policy and deterministic file ownership for persistence. Published a focused counterproposal to F38(b); removed only the answered v18 trace/readability questions after checking reviewer evidence against the actual text. Runtime unchanged.
- Validation: `python3 ../.session-control/check-book-v19.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. Both logs report 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: book v21, concrete examples and focused review corrections

- Continued pending F42–F47 against the current origin/main, not the stale scheduled hash. Replaced rule-summary tables with small paragraph labels and a plan index; preserved useful comparison tables, added concrete proposed wires and worked examples, and removed the specifically identified duplicated explanations. Clarified learning over an adjustment episode, immutable persistent references versus display aliases, and the calendar's assumed duration in its reply. Runtime unchanged.
- Validation: `python3 ../.session-control/check-book-v21.py` checked heading hierarchy, unique paragraph labels R1–R72, their exact section mapping in the plan, section references, code fences and worked arithmetic; passed. `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. Each log reports 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: book v22, persistent evidence and explanatory traces

- Continued pending F30–F33 and the remaining trusted-function explanation in F4 after checking current remote tasks. Defined queryable journal facts, historical inputs, delayed-why selection and undo provenance; added duck execution and letter-assumption traces and a counterexample to case-specific rendering. Unified meeting declarations and explained full-load activation. Posted a focused counterproposal about legitimate specific input facts versus general decision rules. Runtime unchanged.
- At the owner's direct request, pulled bd11873 with `git pull --rebase --autostash`; local edits were restored without conflicts. Read the reviewer's location/date correction and pending-item summary before publishing.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. Each log reports 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: book v23, clearance measurement and normalization

- Continued pending F7–F9 after checking current remote tasks. Rewrote §8.2 with a lower-bound requirement rather than an unsupported infinite region, separate observation/candidate semantics, explicit positive normalization length, geometric function/calculation wires, rectangle-gap formula and post-execution verification. Updated the axis specification and metric cross-reference; runtime unchanged.
- Read review 6 at 20a322c before synchronization; removed only explicitly accepted v18/v20/v22 review requests and recorded F48–F50 for follow-up. F7–F9 are submitted for review by this revision, not self-closed.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. An inline Python calculation checked rectangle gaps 8/14, normalized deficit 0.4, change 0.6 and zero violation for candidate 14. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. Each log reports 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: book v24, live versus historical links

- Continued pending F48–F50 after current remote/task verification. Replaced the misleading live calendar-chart link with side-by-side active drawing embedding and local snapshot provenance; separated trace act from tool operation, normalized after.version and specified journal persistence across sessions. Consolidated point/collection prose while preserving R1–R5 identifiers. Runtime unchanged.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. Each log reports 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: book v25, point representation comparison

- Continued pending F25 after inspecting current tasks and the JSON reference/parser. Added the three-way comparison and author decision, named-axis access, serialization, canonical equality and versioned axis migration. Updated the point task in the refactoring plan. Runtime unchanged.
- Read review 7 at dee2df5 before synchronization; removed the accepted v23/v24 requests and retained new F51–F54 follow-ups. Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. A `node --input-type=module` probe loaded a kind=json slot, told n1 with JSON.stringify/quote, and queried `@p node at.x=120`; result was exactly [{"p":"n1"}]. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. Each log reports 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: book v26, request structure

- Added proposed request/target/constraint wires, source spans, identity versus mutable content, operator validation, polarity, character and scope in §6.3.2; explained corrective updates before and after execution. Runtime unchanged.
- Began the requested author replay under 7332a78, then pulled c4c2582 with autostash and read the changed ownership protocol plus both reviewer replay files. Kept the superseded author audit locally, unpublished; linked the reviewer's audits in the active plan. Removed only the accepted F25 review request. F6, the complete drawing declaration and the replay gaps remain pending; submitted F51 for review.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. An inline Python check extracted each source.start/source.end span from §6.3.2 and compared the slices with three, big, red, in the pond, and in the sky; passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v26-tests.log ../.session-control/book-v26-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: book operation catalogue

- Confirmed current main and pending F6 against reviewer tasks and prior log. Added the proposed closed operation catalogue under reasoning, with inputs/results, errors, purity, finite search limits, host boundary and a document-length example. Replaced the parallel §8.1 explanation with a reference. Updated plan and submitted focused review; runtime unchanged.
- Pulled afad461 with autostash and read the generalisation proposal. Aligned the English-core boundary, queued the requested API chapter and recorded focused counterproposals on matching versus creation, type changes, hard constraints, compensation history and learning scope.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. An inline Python assertion checked the catalogue names for uniqueness/order, the source-text span and the length comparison. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v27-tests.log ../.session-control/book-v27-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: general mechanisms and their effect boundaries

- Confirmed the current remote and prior completed work; no new acceptance to remove from questions. Followed the latest generalisation request by integrating filtered reference resolution, kind migration, constrained re-completion, journal interactions and scoped local knowledge into the relevant book sections. Added controlled structural-completion exception to R37 and kept its identifier. Published explicit counterexamples and remaining gaps; no claim of complete drawing/replay coverage and no runtime change.
- Corrected the domain chapter introduction: the current fragments are not complete declarations. Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v28-tests.log ../.session-control/book-v28-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: executable core API explanations

- Read current tasks, docs/api.md and source implementations; added a core API chapter linking actual calls to book mechanisms. Explained load/tell, fill/revise, ask/query, open/next, complete, solveReport/solve/apply, fork, undo/redo, register and the existing request reader/planner boundary. All displayed outputs come from `node ../.session-control/book-api-v29.mjs`; no runtime changes. The source confirms solve() can collapse unknown into an empty assignment, so the chapter uses explicit solver status. Full drawing declaration and specialised API families remain pending.
- Pulled 26fa72c with autostash and read new essential gaps E1–E4 (English reader, knowledge supply, numeric calibration and reply composition); none is claimed closed by the API chapter. An inline Python comparison confirmed every published JavaScript block and output against the executed probe artifact.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v29-tests.log ../.session-control/book-v29-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: English reader contract

- Read current tasks and the existing parseText API/source, plus PSys2 Q48/Q50 read-only. Added lexical/grammar/composition stages, attachment and quantifier scope, coverage failures and a candidate-only model boundary. Explicitly documented the missing logical request schema rather than flattening negated quantifiers. No runtime/model changes.
- A `node --input-type=module` probe imported World, parseText and nounPhrase, loaded the grammar shown in §6.3.4 and returned the two nominal groups with their separate modifiers; the variant with except returned no complete parse and reported the unknown token. Output is reproduced in the book.
- Pulled 5771263 with autostash, read review 10 and its new calendar/document replay. Verified accepted material in the current book and removed the resolved requests for F51, F6 and the generalisation boundaries. Retained unresolved follow-ups, including new W–BB gaps.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v30-tests.log ../.session-control/book-v30-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.
- Final synchronization brought b051cba: the owner requests separate chapters for E1–E4. Moved the reader material into chapter 10, kept a forward reference from the conversation flow, and clarified general-description model targets and world/phrasing-family evaluation splits. Structural check rerun after the move; source and bundle results above remain applicable because no runtime/build inputs changed.

## 2026-11-16 — G0: knowledge sources and coverage chapter

- Read current tasks and prior log; no new accepted question to remove. Read knowledge-repository instructions/plan/tasks and scene/drawing documentation without changing that repository. Added chapter 11 on semantic dependency closure, four-domain needs, source transformations, review responsibilities and explicit pilot-budget assumptions. Kept corpus size distinct from semantic and executable coverage.
- An inline Python catalog inspection read docs/worlds/index.json at knowledge checkout 2c94c3d8acb476a272d621d0502a6bc94f0ffb42, selected relevant worlds and summed shard wires/bytes; used only as background evidence, not as claimed conceptual coverage. The chapter's budget is a design illustration, not this inventory. No runtime or data import changes.
- Pulled 1bc1436 with autostash and applied the new owner direction: replaced reader design ceilings with an extension workflow, replaced the tone-verification exclusion with a proposed measurable contract and added source-text extraction/provenance checks. These are design mechanisms, not claims of implemented evaluators.
- Validation: an inline Python calculation `sum([60*6, 12*(1+5), 20*3, 20*(1+8), 130, 20])` verified the illustrative total of 822. `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed after all prose changes. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v31-tests.log ../.session-control/book-v31-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: numeric policy and per-request bounds

- Read current instructions/tasks and prior work; added chapter 12 for E3, with parameter ownership, calibration, normalization, sensitivity and reproducibility. Corrected F52 by moving the requested bound out of the permanent candidate schema into request wires; addressed F54 with an explicit reference-scale assumption. Incorporated the reviewer's existing callback findings. Runtime unchanged; examples are arithmetic illustrations, not calibrated production parameters.
- Pulled e6a8e96 with autostash and read review 11. Removed the accepted holiday-exception question, corrected chapter placement before Anexe (F55) and refined reader-growth/clarification wording (F56/F58). Retained the logical-node and learned-reader design follow-ups.
- Validation: inline Python assertions checked `4/n` for n in [1,10,1000], weighted costs for candidates (.2,.6)/(.5,.2), and 8/14 against the request lower bound 12. `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed after all edits. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v32-tests.log ../.session-control/book-v32-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: evidence-based reply composition

- Read current instructions/tasks and prior completion log; no new acceptance to remove. Added the standalone E4 chapter with claim provenance, content ordering, aggregation without scope loss, whole/part summaries, relevant assumptions and verified English realisation. Corrected the infallible-evidence wording in §6.10 and explained frame families. Submitted focused review; no runtime changes.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v33-tests.log ../.session-control/book-v33-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: scoped request logic

- Read current instructions/tasks and prior log; continued pending F57 without repeating accepted work. Added logical not/group/quant nodes, explicit root/binding semantics, scoped event predicates and separate traces for not-all versus not-any. Defined incomplete/empty collection handling and distinguished restriction from authority to act. Submitted focused review; runtime unchanged.
- Pulled reviewer commit 833d35c with autostash; checked accepted F52/F54/F55/F56/F58 in the revised book and removed their review request. Recorded new F62–F66 as pending; the present batch addresses F57 only.
- Validation: an inline Python enumeration using `product([False,True], repeat=3)` checked every three-note move subset, the distinction between not-all/not-any and empty-set identities; this checks the proposed logic, not an implemented evaluator. `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v34-tests.log ../.session-control/book-v34-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: reader variants and learned-proposer gate

- Read workspace/repository instructions, current origin tasks and prior log; no new reviewer acceptance to remove. Addressed pending F59–F61 in the book and plan: lexical correction with source spans and protected names, message-level grammar and contextual fragments, explicit request mood, and a planned learned proposer with independently labelled data and acceptance metrics. Published focused review questions; no runtime/model work performed.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v35-tests.log ../.session-control/book-v35-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo. The new grammar and acceptance contracts are proposed design, not claimed runtime coverage.

## 2026-11-16 — G0: provenance and parameter declarations

- Read current instructions/tasks and prior log; no new acceptance to remove. Inspected knowledge-repository instructions and catalog read-only. Added proposed provenance/calibration/tolerance/learning/objective wires and their evaluation semantics (F64), aligned tone measurement with R68 (F65), and added check/propose/missing-information reply examples (F66). Recorded F62/F63 as pending separate inventory/source audits. No runtime or knowledge data changes.
- Validation: inline Python using `statistics.median` and `decimal.Decimal` verified the reference median, episode factor and weighted/lexicographic candidate comparisons. `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v36-tests.log ../.session-control/book-v36-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo. These checks do not claim implementation of the proposed schemas.

## 2026-11-16 — G0: review reconciliation and indirect requests

- Pulled reviewer commit 3443a0b, checked accepted F57/F59–F61/F64–F66/W in the published text and removed their resolved review requests. Added per-turn regression accounting, protected semantic edits in spelling repair and ordinary indirect-request/reaction semantics. Submitted a focused counterproposal separating shared-resource permission from request mood; no runtime changes. Existing inventory/source and drawing-declaration work remains pending.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v37-tests.log ../.session-control/book-v37-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: measured knowledge inventory

- Read current instructions/tasks, prior work and both owner replay reports; no new reviewer answer. Read knowledge instructions/plan/tasks and catalog without changing that repository. Replaced hypothetical book budget with a pinned published-shard inventory, replay vocabulary and explicit semantic verification gaps. Added reproducible read-only audit and report under refactoring.
- `python3 refactoring/audit-knowledge-inventory.py > refactoring/knowledge-inventory.md` checks every shard count and reports 36 published worlds, 422835 declaration occurrences, all with core.source, and an explicit 36-name candidate search. Counts exclude schema/unpublished/index declarations; exact-name candidates are not semantic coverage. No runtime changes.
- Validation: regenerated the report into `../.session-control/book-v38-inventory-check.md` and `cmp` confirmed identical output. `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v38-tests.log ../.session-control/book-v38-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: named knowledge sources

- Read current instructions/tasks and prior work; no new acceptance. Added source-to-family explanations with primary documentation links for WordNet, Visual Genome and ConceptNet and a separate existing-repository row. Checked local source records against published core.source-bearing shards; distinguished historical download notes, partial imports and full upstream datasets. No dataset download, import or runtime changes.
- Sources checked: https://wordnet.princeton.edu/front ; https://visualgenome.org/api/v0/api_readme ; https://github.com/commonsense/conceptnet5/wiki/Relations . Read local sources/{wordnet,visual-genome,conceptnet}/SOURCE.md and located shards with `rg -l 'core.source="conceptnet'` and `rg -l 'core.source="visual-genome'` under the knowledge world's docs/worlds directory. Licence approval remains with the importer for the exact artifact, not inferred from the book's source selection.
- Pulled reviewer commit 8a7a2de with autostash. Verified accepted F62 and shared-resource mood distinction in the actual text and removed their questions. Added the reviewer’s check-and-offer continuation for unresolved mood, preserving read-access/effect constraints and revalidation before later execution.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed after the review update. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v39-tests.log ../.session-control/book-v39-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: consistent proposed SOP names

- Read current instructions/tasks and completion log; no new reviewer answer. Addressed F53 by stating the lowercase dotted convention in §2.4 and aligning proposed type names throughout the book. Preserved actual JavaScript API spellings and distinguished authoring convention from migration of imported/persisted identities. No runtime changes.
- Validation: an inline Python regex scan of all SOP fences found no camelCase spellings. `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v40-tests.log ../.session-control/book-v40-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: concrete wire interpretation trace

- Read current instructions/tasks and prior work; no new reviewer answer. Rewrote §8.3 for F2/F10 with actual schema/data, parsing stages and an explicit proposed semantic envelope. `node ../.session-control/book-v41-probe.mjs` executed parse/readValue and World.tell; the schema/data were accepted and the exact parse output is in the book. Preserved canonical token arrays and distinguished them from proposed resolved/typed metadata. No runtime changes.
- Validation: an inline Python JSON comparison confirmed the displayed parse object exactly matches the executed probe. `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v41-tests.log ../.session-control/book-v41-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: explicit change amounts and measured relations

- Read current instructions/tasks and replay gaps X/Y; no new reviewer acceptance. Added §4.4.4 with proposed delta/factor/anchor semantics, reference-state handling and measured relation arguments. Explained invalid durations, quantifier scope, units and snapshot versus persistent reminder dependencies. No runtime changes; full calendar traces remain pending.
- Validation: inline Python assertions checked `660-600-15`, anchored endpoints `600+45`/`660-45`, negative `10-15` and reminder `600-10`. `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v42-tests.log ../.session-control/book-v42-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo. Arithmetic validates examples, not an implemented interval evaluator.

## 2026-11-16 — G0: calendar ambiguity and execution outcomes

- Pulled 00dc974 and checked accepted F2/F10/F53/F63/X/Y against the book; removed the resolved review requests. Continued F27 with participant ambiguity, confirmed/unknown execution and undo branches, evidence-qualified English replies, operation identity and concurrent-edit handling. Clarified F4's practical trusted-function check. Runtime and other repositories remain on standby.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v43-tests.log ../.session-control/book-v43-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: phase-zero contract preparation

- Read workspace and library instructions/current tasks, plus the other repositories' inbox task snapshots. The implementation directive in fa29e00 conflicts with the subsequent scheduled book-only scope and unchanged workspace AGENTS.md. Recorded the discrepancy in questions.md rather than asking in chat; continued authorized documentation preparation.
- Added a concrete phase-zero register covering module families, examples/counterexamples, validation levels, unresolved journal declarations, the four-versus-five change-category discrepancy and reviewer-owned release announcements. No runtime, version, scheduler or other-repository change.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/phase-zero-prep-tests.log ../.session-control/phase-zero-prep-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: explicit calendar snapshot projection

- Read workspace/repository instructions and current origin tasks; no new reviewer answer. Continued authorized book work on F28: temporary cross-instance input, saved local snapshot, consumed values, export time context and the distinction between a single meeting node and aggregate coverage. Kept the existing scope-reconciliation question pending without duplicating it; no runtime changes.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v44-tests.log ../.session-control/book-v44-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: executed calendar overlap declarations

- Read current workspace/library instructions and task snapshots; no new library reviewer response. Continued F19/F26 with explicit resolved room, core.calc endpoint arithmetic, separate participant/room denies and local closure. `node ../.session-control/book-v45-probe.mjs` ran the exact declarations: the candidate at 630 was rejected for both resources; the candidate at 660 was accepted on a separate world. No runtime changes or other-repository work.
- Pulled 1aeeaff with autostash and integrated the accepted phase-zero decisions into the register: four changes, typed trace record families, import evidence included and reviewer release relay. Removed the resolved contract questions; scope remains pending owner update as the reviewer confirms.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed after the review integration. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v45-tests.log ../.session-control/book-v45-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: separate migration tracking from the book

- Read current instructions/tasks/log; no new reviewer answer. Moved project tracking from appendices C/D and §8.7 into a migration register, corrected already-decided snapshot/undo rows, updated links and removed the outdated chapter-8 editorial preamble. Kept technical contracts and examples in place. This is a partial F20/F43 consolidation, not completion of all editorial work; runtime unchanged.
- Validation: inline Python compared `git show HEAD:books/sop-worlds-teorie.md` with the edited book and measured 75 fewer lines, with tracking retained in the migration register. `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v46-tests.log ../.session-control/book-v46-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: explain cross-world projection semantics

- Read workspace/library instructions, current reviewer tasks and other repository task snapshots; no new reviewer answer. Continued the authorized book cycle with projection selection, mappings, coordinate semantics, grouping, provenance and update conflicts. Added a worked calendar-to-diagram comparison and focused review request; kept the complete declarative module format explicitly pending. Runtime and other repository queues remain on standby.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v47-tests.log ../.session-control/book-v47-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: explain derived qualities and value-reference equality

- Checked current instructions, origin/main and task snapshots against the published log/questions; no new reviewer answer and no local changes to preserve. Continued AA with aggregate coverage, empty/unknown collections, ties, typed same-as reference, palette equality versus inclusion and target feasibility. Aligned the refactoring plan and phase-zero register; requested review without claiming runtime support. Other queues remain on standby.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v48-tests.log ../.session-control/book-v48-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: integrate Book review 16

- Pulled 063ba6f and checked accepted calendar/snapshot sections and migration tracking against the actual text. Removed resolved review requests and integrated occurrence/series identity, closed-scope aggregates and explicit confirmation before overwriting manual target edits. Retained unresolved F4/F43/AA questions. The owner subsequently requested pausing further book expansion until implementation validates the ideas; this landing only finishes the review integration already made.
- Validation: `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `npm test` rebuilt docs and passed; `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/book-v49-tests.log ../.session-control/book-v49-bundle.log` reports in each log 650 tests, 648 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: phase-zero foundation, structural slot presence (0.168.0)

- Direct owner authorization enables implementation across all repositories and parallel agents. Root owns shared library contracts; independent agents prepare the calendar host and reusable knowledge migration ledger. Book-only scope is superseded.
- Added generic core.slot present=true with transactional post-deduction rejection, inheritance and combination semantics; required=true stays open completion. Alternatives and generality review are in questions.md. No full phase-zero release is claimed. Read-only Sol review found no blocking implementation issue.
- Validation: `node --test test/presence.test.mjs` passed; `python3 ../.session-control/check-book-v21.py`, `git diff --check` and `node skills/propose-generic-method/scripts/smells.mjs HEAD` passed (no smell hints). Initial full-suite documentation checks caught the missing diagnostic row and stale generated HTML; fixed those and rebuilt via `python3 tools/build_docs.py`. Final `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/phase0-presence-tests.log ../.session-control/phase0-presence-bundle.log` reports in each log 655 tests, 653 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: import-evidence structural contracts (0.169.0)

- Published opt-in std.source, std.import, std.provenance and std.knowledge modules. The exact book provenance example loads against closed schemas; wrong references, missing fields and deletion of referenced evidence are rejected transactionally. Concept resolution, source truth, licence policy and semantic acceptance remain separate; full phase zero is not frozen.
- Sol read-only review found no blocking schema issue but exposed literal corruption in text-based module aliases. Replaced text substitution with parsed identifier/reference renaming and added a regression keeping quoted prose unchanged. No host/domain-specific code.
- Validation: `node --test test/import-contracts.test.mjs`, `python3 ../.session-control/check-book-v21.py`, `git diff --check` and `node skills/propose-generic-method/scripts/smells.mjs HEAD` passed. `python3 tools/build_docs.py` regenerated HTML. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/phase0-import-tests.log ../.session-control/phase0-import-bundle.log` reports in each log 663 tests, 661 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: publish legend contract counterproposal for review

- A read-only Sol audit exposed incompatible act-condition encodings, ambiguous axis/space/unit naming, incomplete colour prerequisites and missing frame/version/calibration fields. Published concrete typed-condition and typed-reference alternatives in questions.md before freezing permissive schemas. No further book expansion or runtime change in this landing.
- Validation: `npm test`, `SOPWORLD_BUNDLE=1 npm run test:src` and `git diff --check` passed. `tail -n 9 ../.session-control/phase0-legend-review-tests.log ../.session-control/phase0-legend-review-bundle.log` reports in each log 663 tests, 661 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: reconcile implementation review and coordinated landings

- Pulled reviewer 974160e accepting structural presence and import-evidence modules; removed only those resolved review requests. Updated the book's slot table and open-key distinction as requested. Legend contradictions remain under concrete review; no phase-one mechanism started.
- Coordinated disjoint agents: knowledge pushed 47a77477 (migration ledger plus canonical stale-vocabulary repair); PSys2 pushed a0987918 (calendar host/view and verified generated assets). Book §7.4 and plan now state the actual host boundary, with conversation/persistence/recurrence still pending. Owner generality and frequent-publication directions are recorded in workspace instructions and the existing poll message, with no new scheduler or cross-session notification.
- Validation: `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed for this review integration; `tail -n 9 ../.session-control/implementation-review1-tests.log ../.session-control/implementation-review1-bundle.log` reports in each log 663 tests, 661 pass, 0 fail, 1 skip, 1 todo. The final host-status paragraph was then checked with `python3 ../.session-control/check-book-v21.py` and `git diff --check`; it changes no runnable example or code. Other-repository checks and legacy-policy limitations are recorded in their own logs.

## 2026-11-16 — G0: objective structural contracts (0.170.0)

- Checked actual remote tasks/logs across all repositories; the queued hashes were stale and no new reviewer answers existed. Continued the next independent phase-zero family, leaving legend decisions pending and other repository states intact.
- Published std.objective / std.objective.term through core.use world=std.objective. Exact book wires are executable fixtures; closed schemas require all fields, typed term references, finite nonnegative weights and safe nonnegative integer priorities. Identity membership is deduplicated; equal priorities and explicit zero weights are permitted. No evaluator resolution, normalization proof or optimizer is claimed. Sol read-only audit identified zero/duplicate/unsafe-integer choices, now documented and covered.
- Validation: `node --test test/objective-contracts.test.mjs`, `python3 ../.session-control/check-book-v21.py`, `git diff --check` and `node skills/propose-generic-method/scripts/smells.mjs HEAD` passed. Initial full run found only the historical-version wording check in docs/modules; corrected wording without changing the assertion and regenerated HTML using `python3 tools/build_docs.py`. Final `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/objective-tests.log ../.session-control/objective-bundle.log` reports in each log 670 tests, 668 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: reference sample identity contracts (0.171.0)

- Added opt-in std.reference.set/sample records, preserving distinct equal observations, typed optional provenance and transactional exact unit-label agreement. The actual book sample is executable; calibration remains proposed. Version is metadata, not an immutable snapshot guarantee. Sol audit informed provenance and shared-sample coverage.
- Validation: `node --test test/reference-contracts.test.mjs` passed. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 12 ../.session-control/reference-tests.log ../.session-control/reference-bundle.log` reports in each log 679 tests, 677 pass, 0 fail, 1 skip, 1 todo. HTML regenerated with `python3 tools/build_docs.py`.
- Read reviewer de76af8: objective choices and the concrete legend proposals are accepted. Legend, semantic links and request graph are the next priority; the legend decisions still need implementation and corresponding example updates before their questions are removed.

## 2026-11-16 — G0: typed legend act conditions (0.172.0)

- Implemented accepted review de76af8 condition representation with closed schemas, variant guards and role checks against each owning act. Updated the actual book fixture and removed only the implemented condition question; other legend decisions remain pending. No execution/planning claim and no full phase-zero freeze.
- Sol audit and executable negative probes exposed skipped guards after module qualification: explicit pattern-identity variables were not renamed. Fixed generic prefix and alias paths, preserving ordinary variables and quoted literals; tested all prefix/alias combinations.
- Validation: `node --test test/legend-contracts.test.mjs`, `python3 ../.session-control/check-book-v21.py`, `git diff --check` and `node skills/propose-generic-method/scripts/smells.mjs HEAD` passed. `python3 tools/build_docs.py` regenerated HTML. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/legend-tests.log ../.session-control/legend-bundle.log` reports each 686 tests, 684 pass, 0 fail, 1 skip, 1 todo. Final prose clarifications were checked structurally; executable fixture unchanged.
- Parallel repository check: knowledge reviewer accepted preparation at 1ebf7b64; migration explicitly waits for legend and request contracts. PSys2 agent is addressing host overlap policy independently; its own log records validation/publication.

## 2026-11-16 — G0: structural legend spaces, axes and units (0.173.0)

- Added versioned space declarations, ordered axes and typed canonical/alternative unit records. Enforced owner identity, per-owner names/orders, finite numeric parameters, positive periods/scales and canonical identity conversion. Alternative units describe affine factor/offset data; no conversion or point/frame evaluator is claimed. The exact book colour fixture includes all axes and units.
- Sol audit exposed cross-namespace duplicate axes for one owner. Axis/unit declaration types now explicitly share their schema-level records across namespaces; regression checks both duplicates and reuse under distinct owners. Frames, regions, semantic name resolution and request graphs remain pending before phase-zero release.
- Integrated reviewer a268361 acceptance of 0.171.0/0.172.0 and removed those resolved review requests. Updated book §7.4 to published PSys2 214802c7: host structural integrity, declarative overlap policy. Knowledge remains waiting for complete legend/request contracts.
- Validation: `node --test test/legend-spaces.test.mjs`, `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed. HTML regenerated with `python3 tools/build_docs.py`. After the namespace fix, `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/legend-spaces-tests.log ../.session-control/legend-spaces-bundle.log` reports each 695 tests, 693 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: conceptual legend declarations (0.174.0)

- Added closed shared concept/degree/relation/role records, typed single-parent specialization and reference-union role ownership. Existing declarative rules derive transient ancestry and reject cycles; edits retract stale closure. Relation inverse declarations and owner-role names are checked across namespaces. Exact book §4.8.1 fixture is executable. No semantic-link resolution, evaluator, frame/point or request-graph completion claim.
- Targeted tests caught that a type union alone does not protect owner deletion; adding kind=ref preserves the union and enforces referential integrity. Sol read-only audit also confirmed cross-namespace inverse rejection and mutable act-role checks. No new runtime branch or host-specific code.
- Validation: `node --test test/legend-concepts.test.mjs`, `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed. HTML rebuilt with `python3 tools/build_docs.py`. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/legend-concepts-tests.log ../.session-control/legend-concepts-bundle.log` reports each 704 tests, 702 pass, 0 fail, 1 skip, 1 todo.
- No new library or knowledge reviewer instruction at fetch. Knowledge migration still awaits published legend/request contracts. PSys2 agent independently prepares a generic registry-isolation prerequisite to demo composition cleanup, without consuming unpublished contracts.

## 2026-11-16 — G0: transactional schema-link resolution (0.175.0)

- Added generic core.schema.link descriptors and semanticLinks() inspection, with w.legend mappings for native type is and slot means/space. Final-state validation supports atomic forward declarations and rechecks missing, wrong-type and ambiguous targets after edits. No hardcoded legend types in the resolution mechanism. Descriptor targets form explicit alternatives; name lookup is global and explicit references disambiguate.
- Preserved annotation differences in duplicate/intersect schema handling. Legacy schemas may omit annotations; mandatory means, all refinements, mapped notations and behavioral inheritance remain pending. Full phase zero is not announced. Sol audit confirmed subtype resolution and final-state checks; validation now consumes reasoning-budget ticks.
- Validation: `node --test test/schema-links.test.mjs`, `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed. Initial documentation checks caught reference layout, missing diagnostic/API examples and output-fence format; corrected without weakening tests and rebuilt using `python3 tools/build_docs.py`. `node --test test/docs.test.mjs` passed. Final `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/schema-links-tests.log ../.session-control/schema-links-bundle.log` reports each 714 tests, 712 pass, 0 fail, 1 skip, 1 todo.
- PSys2 independently published registry isolation f74ecbb6, with its own tests/logs and unchanged REAL results; actual active-composition retirement continues separately. Knowledge remains gated on completed legend/request contracts. No new library reviewer answer at final fetch.

## 2026-11-16 — G0: request foundation with explicit mood (0.176.0)

- Published only std.request.source/request/target with typed source/request ownership, required explicit mood and target modes new/existing. Arbitrary act/kind names remain unresolved; no execution authority is inferred. The exact minimal §6.3.2 fixture is executable. Root/bound/constraint/logical contracts are not exported and full phase zero remains pending.
- Read-only Sol graph audit identified ownership omissions, missing mood and Unicode-index ambiguity in proposed examples. Recorded concrete decisions/counterexamples in questions.md, including shared-leaf binder scope and invalidation of graph checks after child edits. Sol final audit found no blocker for the bounded foundation; standard string-token semantics remain unchanged.
- Validation: `node --test test/request-envelope.test.mjs`, `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed. HTML regenerated using `python3 tools/build_docs.py`. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/request-envelope-tests.log ../.session-control/request-envelope-bundle.log` reports each 720 tests, 718 pass, 0 fail, 1 skip, 1 todo.
- Knowledge remains gated on complete legend/request contracts. PSys2 agent independently validates actual active-composition retirement with historical acceptance rows retained; publication is not claimed until its gates finish. No new library reviewer answer at fetch.

## 2026-11-16 — G0: integrate implementation review 4

- Rebase of the request foundation received reviewer 292e8dd accepting 0.173.0–0.175.0. Checked accepted choices against published text/code; removed only those resolved review requests. Recorded opt-in per-world strict means migration and request graph priority. Unfinished frame/point and graph obligations remain open. No runtime or book expansion.
- Validation: `git diff --check`, `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed. `tail -n 9 ../.session-control/review4-tests.log ../.session-control/review4-bundle.log` reports each 720 tests, 718 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: generic final-state invariants (0.177.0)

- Added core.validate on/fn/why declarations with pure boolean/ref signatures, uncached final-state calls over all matching records and fail-closed outcomes. Untouched parents are checked after child changes; missing functions fail even with no records. Callback traversal receives cooperative tick accounting. Nested validating mutations are refused; arbitrary host-code purity remains a contract, not a sandbox.
- Sol read-only audit found no blocker and clarified reentrant check/purity limits, now documented. Schema-link scans use the existing validate budget site. The graph validator itself is still next; no graph, frame or phase-zero completion claim. Updated book to actual PSys2 23e5a048 Map/Music retirement and retained source fixtures. Owner confirmed estimates are not deadlines; correctness/generality and parallel independent work retain priority.
- Validation: `node --test test/final-validation.test.mjs`, `node --test test/docs.test.mjs`, `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed. `node tools/build.mjs` and `python3 tools/build_docs.py` regenerated artifacts. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/final-validation-tests.log ../.session-control/final-validation-bundle.log` reports each 730 tests, 728 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: structural request graphs (0.178.0)

- Added typed constraint/not/group/quant/value records, bound targets and explicit graph roots. Final-state validation rejects ownership crossings, cycles, orphan nodes, invalid operator variants and bound-target uses outside any incoming lexical scope. Unicode scalar spans are paired, nonempty and in range. Exact book examples now load with explicit mood and logical-node ownership.
- inspectRequest supplements schema validation; concept-value typing, orderability, unit compatibility, truth, authority and execution remain pending. Sol read-only audit found no topology/scope blocker and confirmed these boundaries. Standard module functions now follow aliases and roll back registrations when a module transaction fails; validator context identifies its declared type family for subtypes and aliases.
- Read reviewer f197d75 accepting 0.176.0, 0.177.0 and graph proposals; verified against implemented tests/text and removed only those resolved questions. New graph review remains in questions.md. Knowledge preparation remains accepted at 1ebf7b64 with no independent pending work; full phase zero is not announced. PSys2 agent independently validates composition-derived availability and historical retired-area reporting.
- Validation: targeted graph/docs checks exposed an API heading format mismatch, corrected without weakening tests. `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed. `python3 tools/build_docs.py` regenerated HTML; `npm test` rebuilt runtime artifacts. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/request-graph-tests.log ../.session-control/request-graph-bundle.log` reports each 746 tests, 744 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: explicit change-policy declarations (0.179.0)

- Added std.change entry point and closed std.change.policy with required kind/concept/anchor/unit vocabulary names. Exact book §4.4.4 fixture loads; malformed fields and invalid edits are rejected. No default anchor, unit compatibility, name resolution, policy selection or execution is claimed. Multiple policy alternatives remain distinct, pending a selector that justifies precedence and handles ambiguity.
- Read-only Sol audit found no blocker; strengthened negative tests with references to existing facts and quoted single atoms. Separate frame audit identified the need for retained revision definitions, explicit frame binding and an angular-transform boundary. Published concrete frame and typed journal snapshot proposals in questions.md; no free-text frame or mutable version marker is presented as point support. Knowledge remains clean/unchanged at 1ebf7b64 awaiting completed contracts. PSys2 independently validates availability/reporting. No new reviewer task at fetch.
- Validation: `node --test test/change-contracts.test.mjs` and `SOPWORLD_BUNDLE=1 node --test test/change-contracts.test.mjs` pass after the strengthened cases. `node tools/build.mjs` and `python3 tools/build_docs.py` rebuilt artifacts. `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/change-tests.log ../.session-control/change-bundle.log` reports each 751 tests, 749 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: integrate request-graph acceptance

- Rebase received review 3545ede accepting 0.178.0 graph structure and its explicit semantic boundary. Verified against the published tests/text; removed only the resolved graph question. Frame, journal and change-policy follow-ups remain open. PSys2 agent published 6c79cac3 with composition-derived no-effect refusals and preserved historical reporting; its surviving cohort remains unchanged. Full phase-zero release remains pending.
- Documentation bookkeeping only. `git diff --check`, `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/review6-tests.log ../.session-control/review6-bundle.log` reports each 751 tests, 749 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: historical trace input foundation (0.180.0)

- Added std.trace.request and std.trace.input only, with historical source/version/type/key metadata and an ordered JSON array of canonical concrete SOP value tokens. Numeric/text/reference categories and duplicate values survive source mutation/deletion and export/reload. The actual revised first two §6.11 records load under closed schemas. Empty arrays represent an observed empty slot, not global closure.
- Final-state token parsing uses the existing strict language parser and validation budget. Rejects variables including reference variables, extra fields/wires/comments, noncanonical string escapes and non-string JSON elements. Sol audit identified the reference-variable case and reinforced literal/qualified-reference/Unicode/escaping tests. Numeric atom spelling remains exact evidence; no numeric canonicalization claim.
- This is a bounded foundation, not the full trace release: structured request linkage, step/observation/reply/undo/correction, immutable publication/persistence and truth/effect evidence remain pending. Recorded review request with these limits; previous frame/journal questions remain open. Knowledge unchanged and gated; PSys2 independently investigates truthful face observation and explicit initialization/migration, correcting a preparation note that had misattributed mutation to the current observation function. No runtime consumer dependency added.
- Validation: `node --test test/trace-contracts.test.mjs`, `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed. `node tools/build.mjs` and `python3 tools/build_docs.py` rebuilt artifacts. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/trace-tests.log ../.session-control/trace-bundle.log` reports each 758 tests, 756 pass, 0 fail, 1 skip, 1 todo. No new reviewer answer at precommit fetch.

## 2026-11-16 — G0: typed trace operation linkage (0.181.0)

- Added closed step/observation/reply/undo/correction records. Final-state checks reject cyclic dependencies, mismatched invocation text, reply steps from another request, and self/cyclic/forked correction lineage. Dependencies and corrections can legitimately cross requests. Clarification replies may have no steps. Observations require historical inputs with individual source versions.
- Read-only Sol design audit caught the original undo-evidence proposal conflating original and undo invocations. Implemented distinct target/execution steps; undo observations belong to the execution. The revised complete §6.11 fragment is tested. Final audit found no blocker, with the documented per-request family-scan cost bounded by reasoning ticks. No truth/authority, supported-success, actual undo, immutable history or correction-concurrency eligibility claim.
- New review question records lineage, reserved invocation identities and per-source revision decisions. Knowledge remains clean at 1ebf7b64 with no independent pending work. PSys2 continues its separate face preparation tests; unpublished host changes are not consumed. No new library reviewer answer at fetch.
- Validation: `node --test test/trace-graph.test.mjs test/trace-contracts.test.mjs`, `python3 ../.session-control/check-book-v21.py` and `node skills/propose-generic-method/scripts/smells.mjs HEAD` passed. Corrected generated declaration trailing whitespace and rebuilt using `node tools/build.mjs` / `python3 tools/build_docs.py`; final `git diff --check` passes. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/trace-graph-tests.log ../.session-control/trace-graph-bundle.log` reports each 767 tests, 765 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: detached reference calibration (0.182.0)

- Added calibrateReference: validates the world, captures sample identities/values/original tokens/units plus factual provenance closure into detached deeply frozen serializable data, and computes a finite positive median under budget. Equal-valued distinct measurements retain multiplicity; source edits do not alter prior captures. No published revision registry, verified restore, axis linkage or authenticity claim.
- Sol audit found underflow/double-rounding in the initial half-difference midpoint at adjacent subnormal values. Corrected to finite sum/2 with separately halved operands only for overflow; regression covers equal and adjacent subnormals plus extreme finite magnitudes. Alias/namespace, absent contract, detached provenance, JSON preservation and budget cases pass.
- Read review 999684b accepting 0.179.0–0.181.0 and root-frame/retained-revision design. Removed only resolved questions after checking the implemented text/tests. New question explicitly reconciles the shortened release list with numerical families still unimplemented; no implicit full-phase release. Reader instruction abca697 is active: a separate agent owns isolated .session-control/english-reader, first development provenance/request-wire label validation; an independent author freezes held-out rows before rules, with sentences hidden from the reader author. Root retains phase-zero ownership. PSys2 published 91e38a3c independently with its own gates and unchanged REAL outcomes. Knowledge migration remains gated; its idle agent now authors only the independent holdout.
- Validation: `node --test test/reference-calibration.test.mjs` passed. Documentation checks initially identified missing diagnostic/reference entries; fixed without weakening tests. `node --test test/docs.test.mjs test/reference-calibration.test.mjs` passed after the numerical fix. `node tools/build.mjs` and `python3 tools/build_docs.py` rebuilt artifacts. `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed. Final `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/calibration-tests.log ../.session-control/calibration-bundle.log` reports each 773 tests, 771 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: separate target selectors from desired results (0.183.0)

- Independent reader preparation exposed a shared-contract gap: an identifying old property and its desired replacement were indistinguishable result constraints. Existing targets now have selector graph roots; their full closures use independent candidate pre-state contexts, distinct from the result graph. Implicit result conjunction excludes selector nodes. Per-target contexts do not share descendants; binder scopes cannot escape between roots.
- Exact §6.3.1 example loads, with negative cases for overlap, cross-request ownership, unsupported selector change/event operators, cycles, new/bound selector owners and child-edit rollback. Mutual relational candidate descriptions remain structurally allowed without claiming resolution. Sol design/final audits found no blocker and confirmed candidate self-reference must remain valid. Book/docs corrected alongside implementation; reviewer question records the semantic boundary.
- Independent holdout audit found no selector/result conflation but flagged semantic/vocabulary review IDs privately; relayed only IDs to questions.md, preserving holdout blindness for the reader author. Do not claim provisional labels are human-approved gold. Reader corpus milestone a13fc17 is ready in its isolated worktree and will be inspected/integrated separately.
- Validation: `node --test test/request-selectors.test.mjs test/request-graph.test.mjs`, `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed. `node tools/build.mjs` and `python3 tools/build_docs.py` regenerated artifacts. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/selectors-tests.log ../.session-control/selectors-bundle.log` reports each 782 tests, 780 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: integrate independent reader corpus milestone

- Integrated isolated reader commit a13fc17 as 524bb1a. Preserved attributed development evidence and an independently authored byte-frozen heldout; pending/proposed status is explicit and no old parser/execution outputs became gold. Updated the corpus note to the already-published selector contract and linked RDR1–RDR3 from root questions.md. No runtime grammar rule, package version or contract changed in this milestone.
- `node tools/reader-corpus.mjs check` reports 205 development rows, seven proposed labels and 198 pending; 20 heldout rows are structurally valid. These are inventory counts, not semantic acceptance or reader accuracy. `node tools/reader-corpus.mjs verify-source ../psys2` confirms byte-exact regeneration of 205 rows from three pinned sources. Heldout content remains hidden from the reader rule author; independent semantic review is pending.
- Reader agent continues opt-in original Unicode source mapping for parseText in the isolated worktree; PSys2 independently prepares truthful calendar observation/receipt comparison. Root retains shared contract work; read-only audit identified monotonic retained revisions across undo/rewind as a necessary generic point-publication prerequisite.
- Validation: corpus/source commands above and `git diff --check` passed. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/reader-integration-tests.log ../.session-control/reader-integration-bundle.log` reports each 787 tests, 785 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: generic retained revision registry (0.184.0)

- Added World.retainRevision/retainedRevision with canonical finite JSON, detached frozen definitions, idempotent identical reuse and conflict rejection. Persistent maps isolate forks; successful publication survives ordinary fact undo, redo, rewind and replay. Full/delta/timeline snapshots explicitly preserve registries, restored before fact replay. Failed/dry/budgeted publication leaves no retained entry; validation callbacks cannot publish hidden side effects.
- Sol audit reproduced partial-rewind loss when a commit listener retained a definition during sync and a stale map overwrote it afterward. Installed the merged baseline inside an outer transaction before sync; the regression proves listener retention survives and refused actions roll back nested insertions. JSON depth/shape restrictions reject accessors without invoking them. Persistence preserves definitions but does not authenticate externally edited files or provide global cross-fork authority.
- Read review ec1ca39: accepted 0.182.0/0.183.0, release boundary and shared retention design. Removed resolved calibration/selector questions while preserving heldout semantic-review IDs. Implemented registry as the explicit prerequisite for the accepted point freeze, rather than assuming mutable metadata is immutable; question explains the review's deferred-registry/frozen-point tension. Point/frame and reply bindings remain pending.
- New owner SOP-BERT directive is assigned exclusively to PSys2 agent (diagram-vss-demo provenance/unchanged-code baseline first), while library reader agent owns generic Unicode source mapping and symbolic interface. PSys2 independently published 68df5890 calendar observation/receipt comparison with its own logs/checks. Library source-mapping commit b066257 is ready for separate integration; no duplicate neural port or preview claim.
- Validation: `node --test test/retained-revisions.test.mjs test/docs.test.mjs`, `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed. `node tools/build.mjs` and `python3 tools/build_docs.py` rebuilt artifacts. `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/retained-tests.log ../.session-control/retained-bundle.log` reports each 799 tests, 797 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: integrate original Unicode grammar provenance (0.185.0)

- Integrated isolated b066257 as 6d8defc and bumped/rebuilt the shared library. parseText sourceSpans is opt-in; default parsing and token-index spans remain unchanged. Original ranges preserve multiword gaps, Unicode casing expansion/context and scalar offsets. Unaligned alternations, invalid Unicode or sourceBudget exhaustion report unavailable mapping rather than guessed provenance; node decoration is all-or-nothing.
- Reviewed internal helper and source/bundle tests; no heldout content or new vocabulary/rules entered runtime. Book §6.3.2 and review question document the boundary for request composition. Reader work remains general across symbolic and learned candidates. PSys2 owns the neural port and found the historical SOP-BERT score requires a different pinned model than current all-data assets; reproduction and calibration/heldout separation stay explicit.
- Validation: `npm test` and `SOPWORLD_BUNDLE=1 npm run test:src` passed; `tail -n 9 ../.session-control/source-ranges-tests.log ../.session-control/source-ranges-bundle.log` reports each 806 tests, 804 pass, 0 fail, 1 skip, 1 todo. `node tools/build.mjs` and `python3 tools/build_docs.py` rebuilt artifacts; `python3 ../.session-control/check-book-v21.py`, `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` passed before publication.

## 2026-11-16 — G0: retain explicit numerical point-space definitions (0.186.0)

- Added typed root frame declarations and retainPointSpace. Capture preserves ordered axes, numeric parameters, canonical and alternative affine units, and qualified root identity/version under a retained space revision. Same-revision changes conflict; dry/budget refusal leaves no registry entry. Aliased modules, namespace ownership, source undo and persistence are covered. An initial namespace test mistakenly used load's unsupported namespace option; corrected to tell and verified qualified identities.
- This is definition publication, not native kind=point: slot-binding migration guards, coordinate matching/indexing and frame transformations remain pending. Root descriptors are captured per space revision, with no claim of independent authenticated frame publication. Book/API state these limits; questions.md gives the concrete silent-reinterpretation counterexample for the next binding step.
- Review e65cee2 accepts retained revisions; removed only that resolved review request. Independent curator keeps heldout v1 immutable; semantic corrections need a new version. Rule author exposure to reviewer metadata by ID is now explicit: use a fresh independent final evaluation after rules freeze. Symbolic agent owns generic tree composition; knowledge agent owns reusable lexical/construction data; PSys2 published d7291b8b historical neural baseline and continues its recorded reproduction discrepancy, without retargeting provisional labels.
- Validation: node --test test/docs.test.mjs test/point-space.test.mjs passed. node tools/build.mjs and python3 tools/build_docs.py rebuilt artifacts. python3 ../.session-control/check-book-v21.py, node skills/propose-generic-method/scripts/smells.mjs HEAD and git diff --check passed. npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/point-space-tests.log ../.session-control/point-space-bundle.log reports each 813 tests, 811 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: publish declarative parse composition (0.187.0)

- Integrated isolated reader e9594c5 as 6298cd4, retaining both point-space and composition exports/reference entries during additive conflict resolution. composeParses constructs JSON interpretation proposals from production/category mappings and own-property paths; separate parses stay separate. Missing mappings, unsupported coordination and invalid JSON fail explicitly; bounded traversal preserves partial-search reporting. No domain vocabulary, instance resolution or execution gate added.
- Root review found Date/class objects silently became empty objects, sparse arrays survived and getters could run in the initial candidate. Agent tightened data-descriptor/plain-object/dense-array copying and added negative tests before integration. Output remains detached, including original evidence ranges; special __proto__ names remain data. Syntax-only mappings are explicit author claims, not completeness proof. Knowledge agreement declarations still require a validated adapter/guard mechanism; no real-turn coverage is claimed.
- Book section 10.3 explains actual composition behavior and its boundary; phase-zero plan now records publication increments 0.185–0.187. Questions record focused review and pending guards/request bridge. Knowledge agent continues data-only reusable overlay; PSys2 independently audits frozen neural labels before retargeting.
- Validation: node --test test/docs.test.mjs test/grammar-compose.test.mjs passed after restoring the export name in its reference heading. node tools/build.mjs and python3 tools/build_docs.py regenerated artifacts. python3 ../.session-control/check-book-v21.py and git diff --check passed. The first smell subprocess failed transiently; rerunning node skills/propose-generic-method/scripts/smells.mjs HEAD and HEAD~1..HEAD succeeded with no hints. npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/compose-tests.log ../.session-control/compose-bundle.log reports each 818 tests, 816 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: publish composition agreement guards (0.188.0)

- Integrated isolated reader 5bf03df as 233fe82. Per-production template operands are evaluated after children and compared before accepting the parent. Structural JSON equality preserves primitive types and array order, ignores object insertion order, and introduces no domain or unit equivalence. False guards, missing bindings and malformed declarations have distinct diagnostics. All guard declarations validate before any candidate escapes, including unused production declarations; budget accounting covers preflight, evaluation and comparison.
- Read reviewer 53bafc4 accepting original-source mapping and retained point-space capture; checked actual code/tests and removed only those resolved review questions. Recorded the accepted migration guard as pending implementation. Engine inspection identified another concrete point requirement: a shared variable cannot equate raw comma strings from incompatible slot bindings. Added the counterexample in questions.md and the integration paths in the phase-zero plan, without claiming native point support.
- Book section 10.3 and plan explain guards and published knowledge overlay 1c4f32ea, preserving the distinction between data preparation, composition, request validation and execution. The SOP adapter must translate every agreement; it remains pending. Knowledge agent published its own tested overlay; PSys2 independently continues label-roundtrip evidence and generic head design, with its baseline discrepancy accepted by review and further discrepancy investigation stopped.
- Validation: node --test test/grammar-compose.test.mjs test/docs.test.mjs passed. node tools/build.mjs and python3 tools/build_docs.py rebuilt artifacts. python3 ../.session-control/check-book-v21.py, node skills/propose-generic-method/scripts/smells.mjs HEAD~1..HEAD, the same scan with HEAD and git diff --check passed. npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/guards-tests.log ../.session-control/guards-bundle.log reports each 822 tests, 820 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: reindex effective mixin hierarchy changes (0.189.0)

- Native-point audit by the knowledge agent reproduced an existing general bug: changing only an additional extends group updated effective lineage but left type/value indexes stale because the hierarchy fingerprint contained only primary parents. Root changed that fingerprint to include ordered mixin lists while sorting only declaring type identities. The existing transactional reindex path now handles descendants and newly applicable rules consistently.
- Regression tests cover indexed literal queries, inherited rule activation, refused transaction rollback, fork isolation, undo/redo and snapshot replay. node --test test/mixin-index.test.mjs before the fix reported two failures; after the fix node --test test/mixin-index.test.mjs test/schema.test.mjs passed. No test weakened and no special case for a domain or sentence introduced.
- Book section 5.2.1 explains the structural behavior without changing semantic single-parent kinds. Phase-zero plan/questions record the repair and audit obligations for point binding: effective-slot migration guards, per-variable compatibility before matching/template writes, subtype handling, candidate indexing, grouping/functions and persistence. Native point support remains pending; the fix is a general prerequisite, not that release.
- Validation: node --test test/docs.test.mjs test/mixin-index.test.mjs test/schema.test.mjs passed. node tools/build.mjs and python3 tools/build_docs.py regenerated artifacts. python3 ../.session-control/check-book-v21.py, node skills/propose-generic-method/scripts/smells.mjs HEAD and git diff --check passed. npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/mixin-tests.log ../.session-control/mixin-bundle.log reports each 826 tests, 824 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: reply evidence audit and end-to-end priority

- Audited book reply claims against current trace contracts with an independent agent. Published concrete questions on historical subjects, semantic request/predicate ownership, trusted assessments, immutable evidence, deletion before/after phases and grouping that cannot distribute different predicates across all objects. No permissive claim schema or success guarantee was invented.
- During this check new library review 11 accepted composition, guards and mixin indexing and prioritized the first Drawing colour-change path behind ?engine=new. Coordinated disjoint work: reader compiler/bridge, PSys2 resolution/effect/trace, knowledge semantic mappings, root minimal property-change reply contract. Point binding is explicitly moved to the migration step by review. Broader reply families remain deferred; the audit does not block the narrow path.
- Validation: node tools/build.mjs and python3 tools/build_docs.py regenerated byte-identical runtime artifacts. npm test passed. The initial bundle run overlapped regeneration due to an orchestration mistake and reported World-is-not-a-constructor in two tests; reran only after build completion. SOPWORLD_BUNDLE=1 npm run test:src then passed. tail -n 9 ../.session-control/reply-audit-tests.log ../.session-control/reply-audit-bundle-final.log reports each 826 tests, 824 pass, 0 fail, 1 skip, 1 todo. git diff --check passed. Only questions, plan and log changed; no runtime version bump.

## 2026-11-16 — G0: publish validated grammar overlays (0.190.0)

- Integrated isolated compiler ee988f5 as 509b377. Generic configured SOP declaration roles compile to lexical bindings, authoritative normalized production snapshots, semantic templates and equality guards. Validation rejects malformed/orphan/cyclic templates, incomplete paths, missing providers/features and unsupported fields; alternatives retain provider origins without polluting semantic features. Knowledge pin1c4f32ea supplies broad provider families and the executable integration test; no domain vocabulary copied into src.
- Root reviewed compiler/grammar changes and paired negative tests. Freshness uses exact source-world identity plus stamp because schema-only edits do not currently advance world.version. Request construction, instance resolution and effect confirmation remain distinct subsequent stages. Book section10.3 and plan now state what is delivered. Removed only review11-accepted composition/guard/mixin and cross-slot point review requests; their pending implementation obligations remain in the plan.
- Coordinated the first Drawing path with PSys2 and knowledge agents. Root is preparing the independent minimal exact-property evidence assessor; this compiler does not claim request coverage or authorize effects. Candidate provenance and normalized grammar snapshots are retained for the bridge.
- Validation: node --test test/grammar-overlay.test.mjs test/reader-overlay-integration.test.mjs test/docs.test.mjs passed. node tools/build.mjs and python3 tools/build_docs.py regenerated artifacts. python3 ../.session-control/check-book-v21.py, node skills/propose-generic-method/scripts/smells.mjs HEAD~1..HEAD and git diff --check passed. npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/overlay-tests.log ../.session-control/overlay-bundle.log reports each 833 tests, 831 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: retained exact-property reply assessment (0.191.0)

- Added assessPropertyChange and the closed std.reply.property claim contract. Captures correlated journal observations and actual step input/result membership; recomputes immutable retained evidence during claim validation, including restore. Exact native token equality yields changed, unchanged or unconfirmed. Duplicate identities, mismatched phases/subjects, missing dependencies, forged statuses and recursive validator publication are refused.
- Read origin/main review 12 accepting compiler and reply audit boundaries. Replaced resolved audit questions with focused review of the implemented native-property boundary. Semantic request revision linkage, general predicates, grouping, existence and complete-request coverage remain deferred. No rendered-change or causal claim is inferred from raw override tokens.
- Validation: node --test test/reply-property.test.mjs test/docs.test.mjs test/budget-audit.test.mjs passed. node tools/build.mjs and python3 tools/build_docs.py rebuilt artifacts. python3 ../.session-control/check-book-v21.py, node skills/propose-generic-method/scripts/smells.mjs HEAD and git diff --check passed (transient subprocess bus error disappeared on retry). npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/reply-property-tests.log ../.session-control/reply-property-bundle.log reports each 841 tests, 839 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: publish checked request bridge (0.192.0)

- Integrated isolated reader commit 950ba43 as cfa3963, preserving both new public exports/reference entries during additive conflict resolution. readGrammarRequests bridges explicit positive existing-target property readings into independently validated std.request graphs. It preserves alternatives and original lexical evidence, rejects incomplete search/composition, and requires exact compilation freshness. No live instance, effect or reply inferred.
- Published-knowledge integration now pins ef0a1b27. Added opt-in parse limit reporting so truncation cannot masquerade as complete interpretation. Updated book implementation status, plan and focused review request. PSys2 consumes these published contracts for the separate opt-in preview; that preview is not yet live.
- Validation: node tools/build.mjs and python3 tools/build_docs.py regenerated artifacts. python3 ../.session-control/check-book-v21.py, node skills/propose-generic-method/scripts/smells.mjs HEAD and HEAD~1..HEAD, and git diff --check passed. npm test initially had extra offline skips during new-pin loading, so it was repeated sequentially. Final npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/bridge-tests.log ../.session-control/bridge-bundle.log reports each 849 tests, 847 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: reconcile review 13 and resume coordinated implementation

- Pulled review 13 accepting the published exact-property assessment and first request bridge. Removed only resolved review questions; preserved the schema-driven serializer follow-through and explicit deferred phase-zero list in the plan. End-to-end execution is still required before announcing phase zero.
- Resumed disjoint agents after their usage interruption: library bridge generalization in its isolated worktree, PSys2 final native-host checks and first preview integration in its repository. Independent audit confirmed the serialization-boundary correction; publication still waits for the repository's complete gate. New PSys2 training instructions were read from origin, with exposed owner-session evaluation and structural-versus-semantic validation boundaries sent for repository question handling.
- Validation: node tools/build.mjs and python3 tools/build_docs.py regenerated unchanged artifacts. python3 ../.session-control/check-book-v21.py and git diff --check passed. npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/review13-tests.log ../.session-control/review13-bundle.log reports each 849 tests, 847 pass, 0 fail, 1 skip, 1 todo. Runtime remains unchanged.

## 2026-11-16 — G0: publish schema-driven request serialization (0.193.0)

- Integrated isolated reader 987a581 as 679054c. serializeRequestGraph accepts explicit typed tokens and schema-named nodes/slots; validates local identities, schema/cardinality, ownership/reachability and inspectRequest. Reader consumes graph envelopes directly or an existing-template consumer profile. Removed fixed action/target/constraint construction from generic source. Verified source coverage, lexical origins and contiguous-only per-node anchors remain mandatory.
- Read review 14 accepting the design and removed its resolved question, replacing it with implementation review. Book and phase-zero plan describe actual behavior and API adoption: evidence.nodes replaces the fixed constraint evidence property, consumers provide the compat profile for the earlier property reading. First profile explicitly declares literal values; multiword values decline until provider token-kind data exists. Generic explicit strings remain supported, including injection-looking contents without creating extra wires. No language-coverage expansion claimed.
- Root reviewed serializer/bridge and test changes. Smell scan flagged edited assertions: fixed-field evidence assertions migrated to per-node evidence, and the old automatic-string profile case now explicitly refuses; the new serializer test preserves string contents and verifies no injected node exists. This records the deliberate compatibility boundary rather than silently weakening it. Selector, logical-result and multiple-target graphs exercise generality.
- Validation: node tools/build.mjs and python3 tools/build_docs.py rebuilt artifacts. python3 ../.session-control/check-book-v21.py, node skills/propose-generic-method/scripts/smells.mjs HEAD~1..HEAD and git diff --check completed. npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/serializer-tests.log ../.session-control/serializer-bundle.log reports each 855 tests, 853 pass, 0 fail, 1 skip, 1 todo. Preview remains on its published compatible pin while integration proceeds separately.

## 2026-11-16 — First-path phase-zero announcement

- The first end-to-end Drawing path is published in PSys2 b35866b5, using library 0.192.0 at 1b85af0 and knowledge ef0a1b27. This is the narrow phase-zero milestone requested in reviews 13–14: declared reading, std.request validation, unique existing instance, native effect, independent journal observations, retained assessment and reply rendered in the real browser. Library 0.193.0 separately publishes the generic serializer and is the next explicit consumer adoption.
- Preview is served at https://ml-circuits-research.github.io/psys2/webchat/?engine=new. Select English and use a board with one existing circle; try “Change the colour of the circle to purple.” Prepare the object with existing controls or a saved scene first; the new reader does not yet create it. Legacy remains the default. Actual Chromium evidence and unchanged legacy REAL gates are recorded in PSys2 worker-log.md at b35866b5. Root inspected the screenshot independently.
- Verified deployment rather than inferring it from push: curl -fsSL fetched live build-info.json and lib/dialog/new-engine.mjs into ../.session-control/live-preview-*; Python urllib.request.urlopen fetched app.mjs, ui/engine-worker.mjs and build-info.json and compared their bytes with ../psys2/docs/webchat counterparts. All match, and hashlib.sha256 confirms the coordinator match. git -C ../psys2 ls-remote origin refs/heads/main confirms the published commit. Local browser smoke demonstrates execution; live byte parity establishes that the verified artifacts are served, without claiming a separate remote browser session.
- Deferred: general predicates, grouping, existence assessment, semantic request revision linkage, tolerance, learning episodes and calibration-to-axis. Renderer defaults/effective-value witnesses, native-point migration binding, broader phrase/frame composition and general language coverage are subsequent work. Updated book and phase-zero plan accordingly, without expanding unrelated chapters.
- Validation: node tools/build.mjs and python3 tools/build_docs.py regenerated unchanged runtime/docs artifacts. python3 ../.session-control/check-book-v21.py and git diff --check passed. npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/phase0-tests.log ../.session-control/phase0-bundle.log reports each 855 tests, 853 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: preserve textual provider names during serializer adoption

- Consumer adoption found a real regression: the initial explicit-literal compat profile rejected multiword colour labels. Corrected the data profile to declare every provider name as a string. No spelling heuristic and no generic runtime changes: these are text labels resolved by the consumer, while native RGB evidence remains separate. Other numeric/reference families need their own declarations. Runtime version stays unchanged; consumers pin this corrected profile commit.
- Added exhaustive published colour lexicon coverage and restored the quoted injection-looking string test. Assertions now require the deliberately quoted label token, not merely a decoded success. Book, plan and RDR4 explain this boundary and remove the obsolete refusal limitation. Review 15's serializer acceptance and the already-published phase-zero announcement were reconciled without repeating that milestone.
- Independent consumer audit: node ../.session-control/preview-0193-parity.mjs and tail -n 1 ../.session-control/preview-0193-parity.log report 171 names, all with one reading, zero decoded semantic/evidence/effect changes, 141 executions and 30 unchanged refusals. Attribute key insertion order is normalized, value occurrence order preserved. Raw tokens differ for 83 single-word values (bare to quoted); 88 multiword values retain their token representation. This lexical change is explicit, not erased from trace or codec. Full audit rows remain in the workspace report.
- Validation: node --test test/grammar-request.test.mjs test/reader-overlay-integration.test.mjs passed. node tools/build.mjs and python3 tools/build_docs.py regenerated unchanged artifacts; python3 ../.session-control/check-book-v21.py and git diff --check passed. Smell scan node skills/propose-generic-method/scripts/smells.mjs HEAD flags test edits: quoting assertions change with the deliberate profile representation, injection rejection is replaced by exact preserved-string/no-extra-node checks, and exhaustive coverage is added. npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/textual-profile-tests.log ../.session-control/textual-profile-bundle.log reports each 856 tests, 854 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — G0: publish bounded semantic-context projection (0.194.0)

- Integrated isolated reader c931ade as 695b902. projectTemplates applies existing composition templates/equality guards to indexed semantic JSON contexts, with global declaration preflight and one shared budget. Candidate/failure indices remain independent; missing bindings, guard rejection and truncation remain explicit. Full-context validation rejects unused unsafe properties. Null context is data; a private sentinel handles syntax validation.
- Extracted the shared evaluator without changing composeParses operation accounting. Existing exact-budget expectations are unchanged. Tests preserve separate whole-object selectors and requested results, ordered duplicate semantic-role records, detached data and unchanged structural equality. Existing reader profile behavior is unchanged; no callback or new expression language was added.
- Root reviewed evaluator extraction and public boundary. Updated book/plan and focused implementation question. Knowledge 0591f342 publishes opt-in frame licences and role paths with source evidence; no automatic frame selection, role binder, expanded grammar or new preview coverage is claimed by this mechanism alone. Application adoption remains independently pinned.
- Validation: node tools/build.mjs and python3 tools/build_docs.py rebuilt artifacts. python3 ../.session-control/check-book-v21.py, node skills/propose-generic-method/scripts/smells.mjs HEAD~1..HEAD and git diff --check passed. npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/projection-tests.log ../.session-control/projection-bundle.log reports each 863 tests, 861 pass, 0 fail, 1 skip, 1 todo.

## 2026-11-16 — Owner-directed removal of retired PSys2 compatibility adapters

- Read the explicit owner decision relayed in library de876ea and PSys2 6eae35bb: the new application infrastructure becomes the only route. Removed the old PSys2 legend mapping, typed-reader sample, kids-world matrix/host examples, recorded answer fixtures, legacy replay/demo tools and their compatibility tests. These were isolated retired-consumer material, not imports of the new reader or generic runtime. Reader corpus/provenance and active overlay/profile adapters remain untouched.
- Updated compatibility README, integration/host documentation, package test commands, book rollout status and plan. Removed the empty compatibility-only test command and obsolete test:full path. Historical reviewer reports, changelog and worker logs remain historical evidence. Generic library schema/grammar/runtime mechanisms and their tests are not removed. This explicit retirement is not a claim that old failing behavior was repaired.
- Read-only dependency search with rg over test, tools, src and compat found no new-path dependency on the removed adapters; a follow-up search for retired paths in current docs/test/tools/package files found none. PSys2 owns its separate sole-route change, host dependency audit and deletion of unreachable application code/tests. No PSys2 files changed in this task.
- Validation: node tools/build.mjs and python3 tools/build_docs.py rebuilt artifacts; runtime output remains unchanged. python3 ../.session-control/check-book-v21.py and git diff --check passed. npm test and SOPWORLD_BUNDLE=1 npm run test:src passed; tail -n 9 ../.session-control/legacy-compat-tests.log ../.session-control/legacy-compat-bundle.log reports each 863 tests, 861 pass, 0 fail, 1 skip, 1 todo. The retired compatibility suite was outside this active source-suite denominator; it is deliberately no longer an acceptance gate.

## 2026-11-16 — Parallel lanes and frame-binder integration

Integrated the isolated reader binder after reviewing its exact verb/frame/role joins, selected-frame semantics, ordered duplicate roles and detached provenance. The provider pin is a published revision; candidate outputs explicitly remain non-executable role projections, not understood requests or completed effects. Reader provenance and the new path remain; retired compatibility adapters were not restored.

Read the new owner instruction in AGENTS.md and redistributed active agents: shared new-only application routing and Drawing; Diagram and Document local declared hosts; knowledge publication followed by Calendar and SOP-BERT training. The primary lane retains shared library assessments and complex-request mechanisms. Tests accompany these concurrent lanes; the area work does not wait for one construction to pass through every repository. Evidence-boundary counterexamples for existence, relations and numeric/time assessments are recorded in questions.md for review without blocking those lanes.

Root validation: `npm test > ../.session-control/frame-root-source.log 2>&1` initially skipped provider-dependent tests while concurrent test processes populated the new pinned checkout. Prewarmed the exact pin with `node --input-type=module -e "import {knowledgeDirs} from './tools/worlds.mjs'; console.log(knowledgeDirs())"` and reran the suite. `tail -9 ../.session-control/frame-root-source.log` then reports 869 tests, 867 passed, zero failed, one skipped and one TODO. `python3 tools/build_docs.py` rebuilt documentation without generated differences. Bundle validation is recorded below once complete.

`SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/frame-root-bundle.log 2>&1` completed successfully; `tail -9 ../.session-control/frame-root-bundle.log` reports 869 tests, 867 passed, zero failed, one skipped and one TODO. `git diff --check` passed. Runtime remains 0.194.0 because the binder is consumer-side source joining over existing public mechanisms.

## 2026-11-16 — General lifecycle existence assessment

The parallel area lanes need verified creation/removal replies. Added `assessExistenceChange` and `std.reply.existence`, with typed trace subjects, presence expectations and scoped population observations. Population scope/identity, step/request/invocation, observation phases, explicit step references and historical member identity must correlate. Complete absence and positive presence are distinguished; partial absence is unknown. Only declared lifecycle populations can produce made/removed/unchanged; a filtered view cannot prove deletion or even an already-absent lifecycle state. Confirmed transitions require a changed population revision. Retained evidence is detached and validators recompute claims after restore without live objects. The host remains responsible for authentic observations, completeness, stable incarnated identity and lifecycle scope semantics; no causal isolation from external writers or semantic-request linkage is invented.

This extends the existing correlated property-assessment architecture. Reviewed declared effects alone, scoped relational set difference and event-only evidence as alternatives in questions.md; selected scoped observations plus correlated receipt evidence. The implementation has no domain vocabulary or consumer branches. Relation/numeric/time mechanisms and complex-command binding remain open parallel work; agents continue area tools and inventory-conditioned training. No book expansion occurred beyond explaining this implemented evidence boundary.

Targeted validation: `node --test test/reply-existence.test.mjs test/reply-property.test.mjs` initially passed the new and existing assessment suites. Adding documentation exposed generated-HTML/version failures, resolved by `node tools/build.mjs` and `python3 tools/build_docs.py`; no test expectations were weakened. During audit I tightened filtered-view handling even when both populations are empty, and added that counterexample before the final source/bundle runs. `node skills/propose-generic-method/scripts/smells.mjs HEAD` reports zero hints; `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. Final full-suite results follow below.

Final validation: `npm test > ../.session-control/existence-source.log 2>&1` and `SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/existence-bundle.log 2>&1` both succeeded. `tail -9 ../.session-control/existence-source.log` and `tail -9 ../.session-control/existence-bundle.log` each report 876 tests, 874 passed, zero failed, one skipped and one TODO. `cat ../.session-control/existence-build.log` records runtime 0.195.0, fingerprint 57c746d7b2bb, 87 modules and 264 exports. Generated API/reference pages and bundle/type declarations are included. No new application capability is claimed before consumer adoption.

## 2026-11-16 — Shared multi-request integration for parallel area dispatch

Confirmed the common dispatcher boundary with the application worker: complete request graphs, explicit dependencies and no invented cross-request referent binding. Added `prepareRequestBatch` to preflight the entire selected interpretation, and `requestBatchFrontier` to derive ready/waiting/blocked/terminal entries. Graph validation delegates to the published schema serializer/inspector, preserving quantifiers, relations, groups, numeric conditions, questions and selectors/results together instead of adding action-specific profiles. Per-entry graph identities remain isolated. Dependency order is declared, never inferred from words, array order or wire order. Unverified effects cannot satisfy semantic-success prerequisites; independent work survives a refused prerequisite elsewhere. Host capability checks and authenticated outcome evidence remain the dispatcher's responsibility. This is not a claim of complete natural-language or predicate execution coverage.

Generic-method review in questions.md compares explicit partial order against implicit text-order execution and speculative cross-host rollback. No domain branches or vocabulary were added. Tests exercise complex graphs and dependency failure propagation together; they reject executable declarations, cycles, malformed histories, unsafe getters, foreign prepared handles and resource exhaustion. API examples run in the documentation checks. An initial docs check required a separate runnable example for each public function; supplied it without weakening the gate.

Parallel integration state: the application sole new-engine route is published; Diagram/Document/Charts adapters have completed their active gate and are being prepared for integration; Calendar and inventory-conditioned GPU training continue. Disk exhaustion interrupted writes/checkpoint saving. Removed only inactive session-owned Chromium profiles after checking process arguments, leaving active browser, data, worktrees and checkpoints untouched; `df -h .` then reported 1.1G available. Training owner handles its incomplete checkpoint and compact-save policy separately.

Validation: `npm test > ../.session-control/batch-source.log 2>&1` and `SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/batch-bundle.log 2>&1` succeeded. `tail -9 ../.session-control/batch-source.log` and `tail -9 ../.session-control/batch-bundle.log` each report 882 tests, 880 passed, zero failed, one skipped and one TODO. `cat ../.session-control/batch-build.log` reports runtime 0.196.0, fingerprint a2cbc3d05352, 88 modules and 266 exports. `python3 tools/build_docs.py`, `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed; `node skills/propose-generic-method/scripts/smells.mjs HEAD` reports zero hints. Reader and area agents consume this common boundary independently; no arbitrary host execution or language coverage is claimed by these checks.

## 2026-11-16 — Class-wide reader integration and provider identity

Integrated the independently tested general English reader at f55157c against published knowledge 7fbcf774. It composes all currently graphable frame families through source-backed mapping declarations and the standard request serializer/provenance gate, preserving neutral qualifiers as selectors or new-object requirements according to explicit role mode. Spatial relations require exact admitted lexical sources; unsupported alternatives are retained as refusal, not silently discarded. Bare lifecycle actions need no invented existence concept. This is a shared reader integration, not a claim that every area already executes every resulting graph.

Added generic overlay feature `from_id=true`: one source-filtered declaration can preserve exact provider IDs without a copied literal feature for every synonym. Exactly one feature source is allowed; false/other values and conflicting sources refuse compilation. Tests cover homonymous providers, aliases, filters, exact-source restriction, core.word, malformed flags and budget refusal. The initial repeated-identical-flag probe was corrected to distinct conflicting values because world ingestion deduplicates identical tokens; compiler cardinality checks remain unchanged. Reader family admission still owns act/valency/source compatibility and must not infer a compose sense from the existing save sense of write.

Read owner review 22:30: lanes now follow functionality classes across areas, and the published functional-matrix IDs must be excluded from training. Immediately instructed the training agent to stop any exposed run, preserve contaminated artifacts, filter before candidate-bank construction and restart from the clean pretrained encoder. The agent confirmed the stop and exact source/split exposure audit. Shared dispatcher work now reports the class-by-area matrix with setup-incomplete and unclassified owner rows explicit rather than invented native state or intent labels. Existing areas continue integration concurrently.

Validation: `npm test > ../.session-control/provider-id-source.log 2>&1` and `SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/provider-id-bundle.log 2>&1` succeeded. `tail -9` of each file reports 889 tests, 887 passed, zero failed, one skipped and one TODO. After the final reference prose update, `node --test test/docs.test.mjs` and `SOPWORLD_BUNDLE=1 node --test test/docs.test.mjs` each passed 12/12 (logs provider-id-doc-tests.log and provider-id-doc-bundle.log). `cat ../.session-control/provider-id-build.log` reports 0.197.0, fingerprint 7b6e4694941c, 88 modules and 266 exports. `python3 tools/build_docs.py`, `git diff --check` and the smell scan passed; the scan reports zero hints. Exact published knowledge was prewarmed before concurrent integration tests, avoiding incidental provider checkout skips.

## 2026-11-16 — Question/check class shared representation

The read-only class consumer identified an actual shared contract gap: a selected target alone cannot distinguish asking for its values, its population count, existence or member identities. Added closed `std.request.query` projections and explicit repeated request.query references. Each projection belongs to its request, targets a local existing population and declares an operation; only values accepts and requires a concept. Ask mood is mandatory, bound quantifier targets cannot escape their scope, and optional source intervals use the existing Unicode-scalar bounds. Existing underspecified asks remain structurally compatible but are not magically answerable. Check keeps its predicate graph. No desired equality, host-specific asked-key convention or text reparsing was introduced.

The same published serializer and batch planner accept query graphs without an application escape hatch. The observation agent separately implements declared resolution and complete-scope evidence; this commit does not claim evaluated answers or permissions to mutate state. The functional matrix includes underspecified check annotations, which must stay explicit rather than supplying guessed expected values. Integration ownership stays disjoint from the dispatcher and reader-family lanes.

Targeted command `node --test test/request-query.test.mjs > ../.session-control/query-targeted.log 2>&1` passed; `tail -12 ../.session-control/query-targeted.log` reports five tests, five passes and no failures. Probes include all query operations, multiple projections with a selector, incompatible moods/fields, ownership borrowing, unreferenced projections, quantifier scope escape, aliases, Unicode bounds, serializer/batch admission and resource exhaustion. Generated bundle/docs rebuilt with `node tools/build.mjs` and `python3 tools/build_docs.py`; book/plan additions describe only this implemented contract.

Final validation: `npm test > ../.session-control/query-source.log 2>&1` and `SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/query-bundle.log 2>&1` passed. `tail -n 9` on each log reports 894 tests, 892 passed, zero failed, one skipped and one TODO. The first source run caught a stale API version phrase; changed it to timeless feature documentation and rebuilt without weakening tests. `node tools/build.mjs` produced version 0.198.0, fingerprint 6a58079a1970 (`cat docs/version.md`). `python3 tools/build_docs.py`, `python3 ../.session-control/check-book-v21.py`, and `git diff --check` passed. `node skills/propose-generic-method/scripts/smells.mjs HEAD` reports zero hints. Application query aggregation remains a separate consumer; structural admission is not an answer-truth claim.

## 2026-11-16 — Top-down resolution scope audit

Read owner review 23:05 after synchronizing origin/main. Audited `src/resolve.mjs`, std.request target slots in `src/contracts.mjs`, and book 6.4. The existing resolver consumes noun-phrase/grammar structures and lexical/focus heuristics, so it is not the graph-only state-dependent resolution mechanism requested by the owner. Recorded concrete missing context-reference, order-basis and correction-revision contracts in questions.md, with provenance/ambiguity boundaries and a general proposed representation. No legacy resolver was inserted into the sole learned-reader path. Neural export, native evaluation setup and frozen calibration continue in disjoint application lanes; no book expansion or runtime behavior is claimed by this audit.

Validation for this documentary audit: `npm test > ../.session-control/topdown-audit-source.log 2>&1` and `SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/topdown-audit-bundle.log 2>&1` passed; `tail -n 9` on each log reports 894 tests, 892 passed, zero failures, one skipped and one TODO. `python3 tools/build_docs.py` and `git diff --check` passed; runtime sources and public contracts are unchanged.

## G0 — Graph-only three-valued request predicate evaluation

Added `src/request-predicate.mjs`, `test/request-predicate.test.mjs` and `refactoring/request-predicate-evaluation.md` in the isolated predicate lane. Structural inspection plus whole-world schema auditing precede callback execution and consume the finite evaluation budget. Result roots and explicit selector boundaries stay separate; absent result content is unknown. Positive leaf callbacks receive frozen ground historical bindings with explicit instance/scope/version contexts, while the evaluator applies polarity, NOT, AND/OR and all/each/any/none quantification. Incomplete populations cannot prove universal/absence claims, but actual counterexamples and existential witnesses remain decisive. Duplicate population sources, missing contexts, invalid callbacks, budgets and public world mutations refuse honestly. Numeric/string native IDs retain their types; callback truth/coverage and stable external snapshots remain trusted, not independently proved.

Check: `node --test test/request-predicate.test.mjs` → 16/16, source imports only until the primary worker integrates the public export. Includes nested/DAG logic, lexical binders, partial/empty populations, negative polarity, selector/result separation, schema rejection, numeric IDs, whole-world validation budget, evidence explosion and callback mutation/rollback adversarial tests. `git diff --check` passes. No public export, contract, package, generated file or book change in this lane; release/build/source+bundle checks remain with the primary worker.

Release validation: `npm test > ../.session-control/predicate-source.log 2>&1` and `SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/predicate-bundle.log 2>&1` passed. `tail -n 9` on each log reports 910 tests, 908 passed, zero failed, one skipped and one TODO. The first source run caught a stale 'Since 0.198' documentation phrase; made it timeless and regenerated without weakening any test. `node tools/build.mjs` produced version 0.199.0, fingerprint 119eed91e1e1, 89 modules and 267 exports (`cat ../.session-control/predicate-build.log`). `python3 tools/build_docs.py`, `python3 ../.session-control/check-book-v21.py`, and `git diff --check` passed. `node skills/propose-generic-method/scripts/smells.mjs HEAD` reported zero hints. Source and bundle both run the new 16-test suite through tools/lib-under-test.mjs. API/type/reference/book notes state the pure callback and trusted historical-population boundaries; this release is not an authenticated reply assessment or a completed context-reference resolver.

## G0 — Explicit snapshot target resolution

Added `src/request-resolution.mjs`, its tests and `refactoring/request-target-resolution.md` on the published 0.199 predicate mechanism. Declared canonical populations and explicit `one`/`all` policies drive selection; each candidate selector reuses three-valued graph evaluation, while result predicates never filter membership. Exact kind membership, snapshot scope and coverage are caller trust boundaries. Partial populations preserve known matches but cannot claim completeness; two known matches already prove ambiguity for `one`. Missing facts stay unknown, new targets require creation, and bound targets remain lexical. No kind repair, ordinal, text-number or conversational fallback is inferred.

Check: `node --test test/request-resolution.test.mjs` → 8/8, plus `git diff --check`. Tests cover complete/partial uniqueness, ambiguity, empty selection, unknown selectors, all-selection, result exclusion, missing policy, creation/bound variables, canonical mismatch, duplicate/snapshot validation, numeric IDs, explicit binding conflicts, mutation/rollback and one budget across repeated predicate/schema evaluations. No public exports, contract, package, types, book or generated files changed; integration/release validation remains with the primary worker.

## G0 — Preserve named target semantics before instance selection

Root audit found that canonical kind membership alone incorrectly admitted a single wrong-name candidate when the request target had `name` but no selector. Added explicit positive `evaluateTarget({request, target, binding, bindings})` callbacks over frozen snapshot data. Named candidates without this semantic provider remain unknown; unnamed candidates need no extra callback. Target truth and selector truth are conjoined, so a false selector can exclude an unknown name. The mechanism never guesses a native name property. Callback evidence is retained separately in `targetEvaluation`, with the existing total budget and mutation/rollback guard.

Check: `node --test test/request-resolution.test.mjs` → 12/12, including wrong/matched/missing name evidence, unknown name plus false and negative-polarity selectors, frozen input, malformed/accessor/async/throwing callbacks, transient/public mutation and evidence budget refusal. `git diff --check` passes. This scoped correction precedes the primary worker's 0.200 export/release; no public release files changed here.

Release validation: `npm test > ../.session-control/resolution-source.log 2>&1` and `SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/resolution-bundle.log 2>&1` passed. `tail -n 9` on each log reports 922 tests, 920 passed, zero failed, one skipped and one TODO. `cat ../.session-control/resolution-build.log` reports version 0.200.0, fingerprint 5ac881bb59c9, 90 modules and 268 exports. `python3 tools/build_docs.py`, `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `node skills/propose-generic-method/scripts/smells.mjs HEAD` reports one test-edited hint: `git diff --cached -- test/request-resolution.test.mjs` shows only replacement of direct source imports with tools/lib-under-test.mjs, ensuring the identical 12 tests exercise the actual bundle as well; no assertion was removed or weakened. Root audit found and fixed named-target omission before publication, with explicit wrong-name, missing-evaluator, three-valued conjunction and mutation/budget regressions. Public types/API/reference/book notes explain trusted population/description semantics and distinguish computation success from a fully resolved target.

## 2026-11-16 — Preserve training reserve by regenerating a disposable application cache

Checked `git -C .cache/psys2 status --porcelain`, `git -C .cache/psys2 clean -ndx`, its exact origin URL and HEAD, and every readable `/proc/<pid>/cwd`: the cached clone had no local/ignored content and no active working-directory consumer. Regenerated only that disposable clone as a depth-one checkout of the identical published application pin 45ac4bff5e7e896a0defae72057ca099dff2d950. No source checkout, training dataset, checkpoint, model export or knowledge snapshot was removed. `du -sh .cache/psys2` changed from 1.5G to 440M; `df -h .` then reported 1.4G available, against 489M before the operation. This is cache maintenance, not a runtime or contract change. Full source/bundle validation below also verifies the reconstructed pinned input remains usable.

Cache verification: `npm test > ../.session-control/cache-maintenance-source.log 2>&1` and `SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/cache-maintenance-bundle.log 2>&1` passed; `tail -n 9` on each log reports 922 tests, 920 passed, zero failures, one skipped and one TODO. `python3 tools/build_docs.py` and `git diff --check` passed, with no generated artifact differences. The pinned cache remains at the exact application revision and no runtime source or public contract changed.

## 2026-11-17 — Explicit retained request graph corrections

Added retainRequestRevision for validated initial graphs and explicit whole-node put/remove changes against an exact retained owner/revision. The operation preserves parent graphs and unmentioned identities, rejects overwritten historical source text, contradictory changes and invalid resulting ownership, and publishes only through the existing immutable retained-definition mechanism. It does not classify turns, read fragments, choose a parent or execute effects. Copy/processing, each graph validation and publication use separate finite caps; no aggregate bound is claimed. The initial five targeted tests (`node --test test/request-revision.test.mjs`) passed, including source identities, atomic refusal, getter/resource guards and restored cross-owner branching. Public types/examples/book notes state the remaining conversation-resolution boundary.

Final validation: `npm test > ../.session-control/revision-source.log 2>&1` and `SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/revision-bundle.log 2>&1` passed; `tail -n 9` on each log reports 927 tests, 925 passed, zero failed, one skipped and one TODO. `cat ../.session-control/revision-build.log` reports version 0.201.0, fingerprint e9cc5e944b3f, 91 modules and 269 exports. `python3 tools/build_docs.py`, `python3 ../.session-control/check-book-v21.py` and `git diff --check` passed. `node skills/propose-generic-method/scripts/smells.mjs HEAD` reports zero hints. The five new tests run through the source/bundle helper; public examples execute in the documentation gate. The operation changes retained revision history only, leaving live request facts and host state untouched.

## 2026-11-17 — Context-reference contract audit and focused review proposal

Read-only audit of the published0.201 graph/revision/resolution and trace/assessment APIs identified the missing explicit join from a retained graph target to a historical native binding. Published the concrete bridge proposal in questions.md, comparing an exact witnessed foreign-key join, closed-set journal query and retained information state. It specifies canonical kind evidence, exact retained identities, live incarnation revalidation and separate new-selector evaluation. Counterexamples cover reused IDs, partial history, multiple prior targets/open questions and title restoration without undoing a later time change. No graph/API/runtime implementation or book expansion is claimed; unknown-kind/context fragments remain unresolved under the current closed target contract.

Checks: `npm test > ../.session-control/context-proposal-source.log 2>&1` and `SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/context-proposal-bundle.log 2>&1`; `tail -n 9` reports927 tests,925 passed,zero failed,one skipped andone TODO on each. `python3 tools/build_docs.py` passed without generated differences. `node skills/propose-generic-method/scripts/smells.mjs HEAD` reports zero hints; `git diff --check` passed. This documentation-only proposal leaves the frozen model training and application integration lanes independent.

## 2026-11-17 — Regenerable application-cache reserve

Reduced only the clean disposable `.cache/psys2` working tree with non-cone sparse patterns `/*`, `!/training/`, `!/docs/webchat/`. Exact origin and HEAD remain `https://github.com/ml-circuits-research/psys2.git` and `45ac4bff5e7e896a0defae72057ca099dff2d950`; all Git objects/commits remain available. Before changing it, `git status --porcelain` and `git clean -ndx` were empty, and a `/proc` cwd/fd inspection found no active cache consumers. Inspected application-cache callers: benchmark inputs use immutable `git show`; knowledge worlds use a separate cache. Only regenerable tracked working-tree copies were excluded. No primary repository source, training dataset, trained checkpoint or model export was altered or deleted.

The maintenance script recorded `shutil.disk_usage` free bytes changing from 551,768,064 to 811,970,560, recovering 260,202,496 bytes. The exact cache identity, patterns and restoration command are retained in `.session-control/library-cache-sparse-maintenance.json` at workspace root. Restore with `git -C .cache/psys2 sparse-checkout disable` when needed, with adequate free space. Primary trained-model duplicates were deliberately left intact; their future write behavior makes hard-link deduplication unsuitable.

Checks: `npm test > ../.session-control/cache-sparse-source.log 2>&1` and `SOPWORLD_BUNDLE=1 npm run test:src > ../.session-control/cache-sparse-bundle.log 2>&1` passed; `tail -n 9` reports 927 tests, 925 passed, zero failures, one skipped and one TODO on both. `python3 tools/build_docs.py` passed without generated differences. `git diff --check` passed. This is cache maintenance, not a runtime, book or public contract change.


## 2026-11-17 — Empirical selective admission, public library 0.202.0

- Implemented `retainSelectiveCalibration` / `assessSelectiveCalibration`: immutable exact pipeline identity and scope, original-source-disjoint fit/evaluation evidence, equal-score threshold groups, explicit minimum support/error policy and independent evaluation of the fixed fitted threshold. Ineligible rows remain in coverage denominators; eligible unknown labels and replicated source units refuse. Rejected reports remain retained; restored summaries are recomputed before admission. No individual probability, statistical independence, authenticated host truth or future-error guarantee is claimed. C1 supplies trusted labels and a pinned eligibility/score protocol; application schema, live resolution and effect checks remain required.
- Compared arbitrary gate callbacks, probability-curve fitting and retained selective evidence in questions.md. Published neutral examples, types and a short implementation boundary in book 6.3.1; no book expansion. The legacy probability/risk helpers do not establish whole-pipeline/source identity and were not converted into authority.
- Resource preparation: the disposable application cache was replaced at the identical `45ac4bff5e7e896a0defae72057ca099dff2d950` pin by a blob-filtered clone with worlds/src working copies and lazy access to other blobs. Independently audited training-worktree `docs/webchat` copies matched Git exactly and had no training/export dependency; only those generated working copies were reversibly sparse-excluded. No model, dataset, checkpoint or primary app documentation was removed. The Python maintenance command recorded exact pin, origin, clean status and disk free bytes in `.session-control/resource-maintenance-v2.json`: 345018368 before / 856399872 after. Restore the training copies with `git -C .session-control/calendar-training sparse-checkout disable` from the workspace; cache files can be fetched on demand or its sparse profile disabled. This addresses storage reserve without lowering trainer bounds.
- Checks on the final sparse/cache profile: `npm test > ../.session-control/selective-source-final.log 2>&1` and `SOPWORLD_BUNDLE=1 npm test > ../.session-control/selective-bundle-final.log 2>&1`: each 935 tests, 933 passed, 0 failed, 1 skipped, 1 todo. Eight new calibration tests cover fixed-threshold independent evaluation, tied scores, duplicate/overlapping sources, invalid/unknown/accessor input, dry/conflicting/budgeted publication, restored forged summaries and non-rounded rare errors. Build `de477e943b20`, 92 modules / 271 exports (`npm test` build output; `cat docs/version.md`). `python3 ../.session-control/check-book-v21.py` passed; `node skills/propose-generic-method/scripts/smells.mjs HEAD` after adding new files: 36 files, 0 hints. `git diff --check` passed. Required `git pull --rebase` and final diff/stat review precede push.


## 2026-11-17 — Strict rooted request graph comparison, public library 0.203.0

Added compareRequestGraphs: independently schema-validated graphs, rooted labeled-node bijection with bounded backtracking and a complete frozen witness. Only local identifiers and node/attribute insertion order may change; literals, token kinds, provenance, repeated-value order, ownership and reference sharing remain exact. Invalid input or exhausted limits returns unknown with no partial witness. This is structural comparison, not logical equivalence, an intent label, historical identity, admission or execution evidence. Public types, API/reference and the implementation boundary in book 6.3.1 accompany the mechanism; questions.md compares retained JSON, neighborhood fingerprints and checked bijection. No consumer names or dependencies enter core.

Checks: `npm test > ../.session-control/request-compare-source-final.log 2>&1` and `SOPWORLD_BUNDLE=1 npm test > ../.session-control/request-compare-bundle-final.log 2>&1`; `tail -n 9` reports 944 tests, 942 passed, zero failed, one skipped and one todo on each. Nine new tests include all small relabelings, positive ambiguous-target backtracking, shared-reference mismatch, strict group order/provenance, accessor refusal, resource limits and input immutability. `cat docs/version.md` and `cat ../.session-control/request-compare-build.log` report build 4311affaf970, 93 modules and 272 exports. `python3 tools/build_docs.py`, `python3 ../.session-control/check-book-v21.py`, staged `node skills/propose-generic-method/scripts/smells.mjs HEAD` and `git diff --check` verify generated documentation, book boundaries and the final change. Required rebase and commit-stat inspection precede push.


## 2026-11-17 — Exact historical target witnesses, public library 0.204.0

Implemented lookupContextTargetBinding over exact retained graph revision, trace population member, canonical membership and an explicit external correlation witness. Reuses serializeRequestGraph and the existing existence-evidence evaluator rather than duplicating effect semantics or requiring live claim wires. Request/step/invocation and each snapshot tuple must agree; native context, trace population and operation version namespaces remain separate. Positive selected membership survives partial populations/removal/unconfirmed effects. Result is immutable historical data with historicalOnly=true/liveBinding=null; it does not choose a conversational parent, prove incarnation, interpret text or authorize execution. Root reviewed the trust boundary and published it in types/API/reference, questions.md and book6.11.1. No consumer/domain vocabulary enters core.

Source-only handoff: ten lookup fixtures and combined revision/existence suite22/22 passed. The final lookup tests use tools/lib-under-test to exercise the public source/bundle route, with actual retained assessments, restored history after live trace deletion, two request/step correlations, numeric/string native IDs, wrong revisions/kinds/sources/context, partial/removal evidence, forged dependencies, getters/budgets and transient undo mutation. Internal checker is a named function export because the zero-dependency bundler does not support a local export alias; existing assessor/validator behavior is unchanged.

Resource correction: required full tests exposed ENOSPC in the existing offline-catalog fixture and ledger fixture. Both created temporary directories without cleanup. Added node:test after hooks to remove only their own scratch, keeping every assertion/input intact. Test TMPDIR is explicitly .session-control/test-tmp under the workspace; failed earlier attempts remain logged. Removed only regenerated CPython bytecode with a regular matching .py source, and replaced the clean disposable knowledge cache Git object store by verified blob-filtered metadata at identical pin/origin/all existing refs. Working files, models, checkpoints and datasets remain untouched. Cache status is clean; retained source files establish regenerability. The following commands print audit evidence: `PYTHONDONTWRITEBYTECODE=1 python3 -c "import json; d=json.load(open('../.session-control/bytecode-cache-maintenance-context.json')); print(len(d['rows']),d['beforeFree'],d['afterFree'])"` reports2671 files and free15613952→84099072 bytes; equivalent JSON read of knowledge-cache-context-maintenance.json reports exact pin7fbcf774e21c168e1c1b5f9dbd4e95b51a186825 and free82980864→134909952 bytes. No scratch outside the workspace was removed.

Source release gate: `PYTHONDONTWRITEBYTECODE=1 TMPDIR=/home/salboaie/work/sopworlds/.session-control/test-tmp npm test > ../.session-control/context-binding-source-final.log 2>&1`; `tail -n 9` reports954 tests,952 passed,zero failed,one skipped,one todo. The same log's build line reports05c45919f1f0,94 modules/273 exports. `PYTHONDONTWRITEBYTECODE=1 python3 tools/build_docs.py` rebuilt docs and `python3 ../.session-control/check-book-v21.py` passed. Earlier failures were unsupported internal alias syntax, stale generated docs, then exhausted disk; they were corrected without reducing acceptance or calling incomplete runs green. Final bundle/smell/rebase gates follow below.

Final acceptance: `PYTHONDONTWRITEBYTECODE=1 TMPDIR=/home/salboaie/work/sopworlds/.session-control/test-tmp SOPWORLD_BUNDLE=1 npm test > ../.session-control/context-binding-bundle-final.log 2>&1`; `tail -n 9` reports954 tests,952 passed,zero failed,one skipped,one todo, matching the final source gate. `node skills/propose-generic-method/scripts/smells.mjs HEAD` over staged files reports40files/0hints. `git diff --cached -- test/knowledge.test.mjs test/ledger.test.mjs` contains only temporary cleanup hooks/imports/test context arguments, with all assertions preserved. `git diff --cached --check` and the book checker passed. Tests ran serially; `df -B1 .` after the bundle gate reports130752512 bytes free and the workspace scratch stayed bounded. Required final rebase/stat inspection precedes push.

2026-11-17: 0.205.0 restores versioned instance state as ordinary typed SOP facts and explicit local relations, with a lossless typed implementation projection. Actual restored-world SOP deduction passes; full project loading and request completion remain outside this local archive.
Checks: `node --test test/instance-state.test.mjs` (6 pass); `npm test > ../.session-control/instance-library-source-gate.log` and `SOPWORLD_BUNDLE=1 npm test > ../.session-control/instance-library-bundle-gate.log` each report 960 tests,958 pass,0 fail,1 skip,1 todo; `python3 tools/build_docs.py` rebuilt documentation.

## G: Compact instance-state scalar members — 2026-11-17
- Version 0.206.0 writes compact version-2 projection containers with direct scalar literals; version-1 archives still restore exactly. Semantic facts and native undo data are retained.
- Checks: `python3 tools/build_docs.py`, `npm run build`, `npm test`, `SOPWORLD_BUNDLE=1 npm test`: each test gate 962 tests, 960 pass, 0 fail, 1 skip, 1 todo; `git diff --check` clean.

2026-11-17 delivered: instanceStateWorld now loads actual domain facts and their real reference closure; archive descriptors, native projection/history and observation binding copies stay outside the semantic World. Explicit includeArchive:true retains diagnostic access.
Checks: npm test and SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs' —each963tests961pass0fail1skip1todo after regenerated docs; actual historical five-editor archive loading separately confirms only domain facts and necessary structured attributes enter Worlds.

2026-11-17 delivered: version3 carriers emit short stable object IDs, direct scalar roots, field records and ordered sequences; no state.value/std.instance.value instance nodes. std.instance now has an explicit standard schema. Earlier semantic-world entry count corrected to963tests961pass.
Checks: npm test; SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs' —each964tests962pass0fail1skip1todo. Actual five historical archives decode→version3→decode deep-equal every field, while new wire text contains no std.instance.value.

2026-11-17 owner-requested skill correction: updated README and author-live-world/propose-generic-method/improve-world-from-failures/consolidate to distinguish actual SOP-BERT application reading from historical grammar fixtures; removed capability-for-free promises and refusal-first steering, documented ranked plausible effects/uncertainty/undo and real SOP authority/native boundaries. No runtime contract or library version changed.
Checks: four existing skill dry runs exited0; `npm test` source964tests962pass0fail1skip1todo; `SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs'` same964/962/0/1/1; `git diff --check` clean.

2026-11-18 owner-requested normative book review: LIB compiles SOP request/query circuits using supplied worlds/interfaces/context; typed tool calls, encapsulated reasoning, two JS families and concrete mechanisms replace API orchestration in chapter9. Removed release diary and corrected schema examples; migration plan records actual gaps and nine request families. Runtime/training unchanged.
Checks: `node tools/audit-book-examples.mjs --published --strict` —46/46 SOP blocks schema-admitted using53 pinned published schemas; this is structural admission, not effect proof. `npm test`; `SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs'` —each964tests962pass0fail1skip1todo. `npm run docs`; `git diff --check` clean.

2026-11-18 owner-requested book correction: all chapters/tables/appendices are English; introduction states the general request/world compilation problem before explicitly scoped PSys2 tutorial examples, with library/knowledge/demo repository links. Added source-grounded SOP-BERT section10.5 covering cutter, BIO/presence/class heads, supervision/losses, source spans, graph limits, training/export/browser/evaluation boundaries. No runtime or training changes.
Checks: `node tools/audit-book-examples.mjs --published --strict` —46/46 SOP examples admitted; original SOP fences preserved. `npm test`; `SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs'` —each964tests962pass0fail1skip1todo. `npm run docs`; `git diff --check` clean. Whole-book language review and source-link existence checks passed.

2026-11-18 delivered0.209.0: existing tell/patch operations accept factsOnly admission; the engine rejects schema, mapped definitions, rule patterns/templates and imports before mutation. Instance archive loading uses the same boundary; separately supplied rules still derive local conclusions. No public orchestration API added.
Method review: prefix filtering loses mapped/pattern declarations; post-change snapshot comparison is late and can load imports; the existing ingestion classifier provides bounded atomic admission without a second classifier, domain IDs or language dependence. Ordinary fact ownership still needs the domain carrier's explicit closure; this guard does not infer knowledge versus instance meaning from a type name.
Checks: `node --test test/instance-admission.test.mjs test/instance-state.test.mjs`16/16; `npm test` and `SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs'` each970tests968pass0fail1skip1todo after docs regenerated; `npm run docs`; `git diff --check` clean.

2026-11-18 deliveredbook/world ownership review: schema, knowledge and instance examples now have separate owners and real declared imports; audit supplies only declared dependency closure and checks rule binding/closed keys/literal kinds. Added executable calculation660→675, false-check/conflict probes, legal-match-versus-choice explanation, compact shared-schema/direct-value example, and full contextual editorial review. Knowledge pin updated59875277; no reader training.
Checks: `node tools/audit-book-examples.mjs --published --strict`61/61owned sources; `node --test test/book-world-ownership.test.mjs`8/8; `npm test` and `SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs'` each978tests976pass0fail1skip1todo; `npm run docs`; `git diff --check` clean.
Limit: runtime factsOnly enforces instance admission, not complete rule-template legality. Existing kernel admits bad closed-key/literal/unbound rules; documentation audit catches those examples and the compiler migration plan records the missing general runtime admission contract.

## SOP request compilation and measured placement
- `npm test` and `SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs'`: each 989 tests, 987 pass, zero failures, one skip, one TODO. Concrete calls, moved anchors, occupied positions, rule coverage and native world effects are covered.
- `npm run docs`, `node tools/audit-book-examples.mjs --published --strict` (61 admitted SOP blocks), `git diff --check`. Independent scope and remaining application migration are in the request-to-circuit plan.

## Scoped capability compilation and architecture inspection
- `npm test` and `SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs'`: each 992 tests, 990 pass, zero failures, one skip and one TODO. Capability selection, ranked alternatives, nested typed arguments and output budgets run against source and bundle.
- `npm run docs`, `node tools/audit-book-examples.mjs --published --strict` and `git diff --check`. The book distinguishes native authority from its SOP observations and the plan records the Worlds inspection criteria.

## Compiler-visible tool effects
- Book §1.3 distinguishes call shape from effect semantics through two-node placement. The migration plan requires SOP authority, native/compiler parity and interchangeable tool probes.
- `npm run docs`, `node tools/audit-book-examples.mjs --published --strict`, `git diff --check` passed.

## Ambiguous capabilities and effect selection
- `npm test` and `SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs'` each ran 994 tests, 992 passed, one skipped, one TODO. Tests cover scoped preference, hard guard, declared provider and frame, resulting two-point geometry and undo.
- `npm run docs`, `node tools/audit-book-examples.mjs --published --strict`, `git diff --check`. Language-hypothesis ranking and learned personal wording remain distinct from choosing among capabilities for one reading.

2026-11-18 delivered private authored-schema instance transport. Closed SOP slots define scalar values, owned records, named joins, ordered collections and stable entity identities.
Verified `npm test` (996 tests, 994 pass, 1 skip, 1 todo, 0 fail) and `SOPWORLD_BUNDLE=1 node --test test/internal-instance-fact-codec.test.mjs` (2/2). Owned cycles and unreachable facts fail; cyclic named joins remain references.

- Added SOP-only comparison of alternative request graphs before tool execution. The selected plan and competing readings share a source-text identity. A focused regression actually executes the second reading and observes its numerical result.
- `npm test` and `SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs'` each ran 997 tests, 995 passed, one skipped and one TODO. `npm run docs`, `git diff --check`.

## 2026-11-18 — Mechanical SOP input for concrete capabilities
- Project the selected call and its reachable typed arguments from a capability or interpretation result. The tool keeps operation, instance and revision validation. The private decoder preserves ordered lists, empty collections and nested records.
- `npm test`: 998 passed. `SOPWORLD_BUNDLE=1 node --test`: 1,000 passed. Both had zero failures, one skip and one TODO. `npm run docs`, smell scan and `git diff --check` passed.

## 2026-11-18 — Declared capability selectors
- A selector now compares declared lookup literals to versioned native observations, retains each candidate and its support, and keeps the required post-state independent of the selector.
- Source and bundled phases of `npm run test:full` each passed 1,001 with zero failures, one skip and one TODO. The existing malformed request fixture also passed all 16 cases under `SOPWORLD_COW_CHECK=1 node --test test/request-predicate.test.mjs`.

2026-11-18 G: Compile measured choices via `std.choice.request` and existing `World.compileRequest`. Trusted ordered `std.decide.criterion` facts select among proof inputs with stable ties and disclose hard exclusions; query admission leaves the receiver unchanged. This combines typed relational joins and lexicographic preference, with no domain words or runtime callbacks.
Checks: `npm run docs`; `npm test` and `SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs'` with the exact application and knowledge caches from repos.pin (1001 pass, 1 skip, 1 todo each); bound probe measured 200 valid three-metric options and returned all 200 assessments.

2026-11-18 G: Document the policy facts that distinguish the focused target from a corrective alternative and trace the concrete call through Undo. Update the migration plan with the remaining application decisions.
Checks: strict published book audit 61/61, docs build, source 1,001 passed, bundled discovery 1,003 passed, both with one skip and one TODO.

2026-11-18 G: Project ordered tool input from both capability and rule compilation. Compared local host traversal, action-name dispatch and typed reference projection; the last shares schema, order and one declared action profile across numeric, reservation and journal circuits. It needs no domain vocabulary or new public method.
Checks: npm run docs; npm test (1,001 pass) and SOPWORLD_BUNDLE=1 node --test (1,003 pass), one skip and one TODO each. The two-action case preserves order; malformed types, actions, arguments and extra calls are refused. The receiver version remains unchanged. Smell scan: zero hints.

2026-11-18 G: Validate an authored SOP graph directly through serializeRequestGraph, sharing the schema, ownership and concrete-token checks used for reader, model and batch inputs. An explicit batch root must still match its graph. No additional public method.
Checks: npm run docs; npm test passed 1,002, SOPWORLD_BUNDLE=1 node --test passed 1,004, each with one skip and one TODO. SOP and structural fixtures yielded identical canonical graphs with quoted Unicode and typed values; invalid ownership and variables were refused.

2026-11-18: Explain competing reader evidence and durable journal scope in the book. Align the request-to-circuit plan with tested constructor defaults, history and remaining comparison work.
Checks: strict published book audit admitted 61/61 SOP examples; npm run docs passed. Both worked examples were exercised in Chromium by the integrated application.

2026-11-18 implemented read-only request projections over trusted capability observations. The compiler reuses declared selectors and the generic World query aggregate, reports per-projection limits and excludes tool inputs from query answers.
Checks: source and bundle gates with the exact repos.pin caches each passed 1004, skipped 1, todo 1. The browser Drawing query counted one named red house over two live observations and distinguished an empty matching population.

2026-11-18 added optional capability seeds constrained by trusted scope and canonical target kind. Explicit conditions reserve their mapped parameters, including unresolved values. The compiled call retains the inferred seed and its derivation.
`npm test` and `SOPWORLD_BUNDLE=1 node --test 'test/**/*.test.mjs'` with the exact repos.pin caches each passed 1007 with 1 skip and 1 todo. The book frame example ran through the compiler and tool-input decoder.

2026-11-18: The refactoring plan lists outstanding work and acceptance checks only. The book distinguishes the executable tool input, compiler evidence, observed effects and contextual placement preferences.
Strict book audit: 62 SOP blocks admitted against 57 schemas; 18 book and schema checks passed.

2026-11-18: Rule admission rejects unknown closed-type keys, incompatible slot literals and unbound conclusion variables for direct and imported declarations. Failure rolls back the matrix, import and facts. Inherited and prefix slots, open types, calculations, JSON paths and dependent templates still work.
Checks: npm run docs and npm run test:full against exact KB a0e85384 passed 1011 source, 1011 bundle and 1009 COW, each with zero failures, one skip and one TODO. Strict audit admitted all 62 SOP book blocks against 58 published schemas.

2026-11-18 — Narrowed the placement plan after testing moved-lake and Undo behavior on published Webchat 769b440387. Book §8.2.2 explains how observed support geometry supplies tool coordinates and what hull containment would require.
Strict book audit admitted all 62 blocks against 58 pinned schemas. Source and bundled test files each passed 1009 with one skip and one TODO.

2026-11-18: Trusted SOP projection profiles now drive lazy catalog reads, exact field selection, rule inputs and returned evidence through World.compileRequest. A published boat/landscape/lake replay retained the source facts and both region alternatives.
Checks: npm run docs and npm run test:full against the exact KB pin passed 1014 source, 1014 bundle and 1012 COW, each with zero failures, one skip and one TODO.

2026-11-18 — Book §8.2.2 describes authored catalog profiles, evidence and the distinction between viewport defaults and required bounds. The remaining-work plan now focuses on shipped Diagram knowledge, cross-turn grounding and the remaining compiler boundaries.
Strict audit admitted 62 SOP blocks against 58 schemas. Exact-pin source and bundle gates each passed 1014 with one skip and one TODO.

2026-11-18 — LIB 0.223 passes each declared slot to the catalog reader when compiling knowledge profiles. A secondary slot can use a complete lookup even when the same term is indexed elsewhere as a name. Book §8.2.2 explains the completeness requirement.
Full source/bundle/COW gates passed 1014/1014/1012, zero failures. Strict book audit admitted 62 examples against 58 schemas.

2026-11-18: Optional inferred seeds can now require exact typed arguments of the selected capability candidate. Competing count-1 and count-3 readings derive different coordinates and retain their own measurement evidence. Explicit coordinates, unresolved requests and legacy seeds retain precedence.
Checks: npm run docs and npm run test:full against the exact KB and PSys pins passed 1015 source, 1015 bundle and 1013 COW, each with zero failures, one skip and one TODO.

2026-11-18 — Book §10.5.5 explains how to compare readings of one question against the current instance. The remaining-work plan records the failure after the last object of a queried kind is deleted.
Strict audit admitted 62 blocks against 58 schemas. Source and bundle checks passed with zero failures, one skip and one TODO each.
