# Experiments: which technology can compile SOP intent circuits into tool circuits?

Not part of the shipped library. This folder is a comparative experiment built for one
question: if elaboration is "open parameters become variables, intent relations become
constraints, preferences become the objective", which solver technology carries all the
demo domains — drawing (continuous placement), calendar (disjunctive intervals) and
storage (integer assignment) — with the least bespoke code per domain?

Each experiment implements the same compiler interface over the same 14-case corpus
(`common/corpus.mjs`):

- **input**: an intent packet — several `x.*` wires linked by `$` references
  (intent, targets, relations, options), plus the case's World (schema + facts).
- **output**: elementary state circuits — creation facts (`draw.thing`, `cal.event`),
  assignment facts (`store.put`), one state change (`x.set`) — wires a World accepts.

The experiments:

| folder | technology | what it is |
| --- | --- | --- |
| `baseline/` | none — hand-written bounded searches per family | the control: today's approach, a little custom code per domain |
| `z3/` | `z3-solver` (SMT/Z3, integer variables, Optimize + unsat cores) | the general candidate: intents as one constraint problem |
| `cassowary/` | `kiwi.js` (Cassowary, linear constraints with strengths) | continuous placement and soft preferences; no native disjunctions |
| `milp/` | `glpk.js` (GLPK MILP over WASM) | integer scheduling/assignment with big-M disjunctions |

Install and run (Node 22):

```sh
cd experiments
npm install            # kiwi.js, glpk.js, z3-solver — nothing else
node common/run.mjs baseline z3 cassowary milp
```

The runner writes `results/<exp>.json` (status, timing, determinism) and
`results/<exp>.cases.jsonl` (one compact record per compiled case).
The judge has two layers, on purpose:

1. **Mechanical** (`common/judge.mjs`): only what is beyond opinion — the output
   parses, and a fresh World with the case's schema accepts the wires (`tellOk`).
2. **Agent** (run by the assistant, not in this folder): each compiled case is judged
   for plausibility by an agent that sees the intent, the rubric, the state before and
   the state after — "did it position the object decently, did it schedule the meeting
   sensibly". A purely mechanical judge was deliberately avoided: it would reject
   good-but-unusual placements.

The verdict, the plausibility scores, the timing/determinism table and the honest
per-technology notes are in [`RESULTS.md`](RESULTS.md).

Two z3-solver quirks found while building this are documented in `z3/compiler.mjs`
and reproducible from the probes: `addAndTrack` on `Optimize` leaves its tags free
(the optimizer silently switches constraints off to minimise the objective), and
`term.add(...)` is not variadic (a spread sum collapses to its first element).
Both are the kind of finding this experiment exists to surface: the encoding cost of
a technology includes its binding, not just its mathematics.
