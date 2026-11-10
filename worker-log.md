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
