# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q11. Which replace figure is the target: one cold run, or the cost once compiled?

G7 says the 1000-replace benchmark "must be back at or under the 0.4 number" (30 ms).
Measured over 11 runs each (table in `worker-log.md`, G7):

- once compiled, 1000 replaces cost 11 ms now and 10 ms in 0.4 (`node tools/bench.mjs`,
  the new "best of 10 more" column; `node tools/bench.mjs <path to 0.4 src/index.mjs>`
  for the old library);
- the single cold run of the old harness has a median of 43 ms now against 32 ms for
  0.4, and moves by ±10 ms from run to run. The difference is spread over the features
  added since (G1–G4), with no single hot function.

**Chosen for now:** I treat the compiled cost as the figure that matters to a host (a
world lives longer than its first thousand changes), keep the cold figure in the
benchmark output, and stop tuning it. If the cold run is what you need at or under
30 ms, say so and I will take it as a task of its own: it means making the common path
of a change shorter (fewer hooks per wire when the matrix has no hierarchy, fluents or
aggregates), which is a wider change than G7.

## Closed

- Q1 (no access to the PSys2 repository): answered, the material needed is in `compat/psys2/`.
- Q2 (`imports=core` without a `core` module): withdrawn after the task list was rewritten.
- Q3 (`core.test` name clash): answered, renamed to `core.check` with `core.test` kept as an alias when linked.
- Q4 (`world.schema` is now `world.matrix`): accepted; listed under Changes in SPEC.
- Q5 (strictness of literal kinds): accepted as chosen; unknown kinds are reported by `world.schema(type).unknownKinds`.
- Q6 (no default parent in the library; `root=` in a type map): accepted.
- Q7 (one commit for G1 and G2): accepted; one commit per task from here on.
- Q8 (a sixth status, `refused`): kept; the compatibility runner maps it to PSys2's `conflicting`.
- Q9 (`complete=true` decides `no` against `unknown`): accepted; `compat/psys2/mapping.sop` reads it from `closed`.
- Q10 (entities outside the session): accepted; the runner tells an `e.user` wire first, and the one `$e.tom` case is to be checked in G8 and listed as a failure if the wire really is absent.

