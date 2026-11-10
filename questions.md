# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q12. The four "received" cases: should the runner count them as passed?

G14 is in: `delta=received` on the count gives `received=2` for someone whose starting
count is unknown, and `query(seek=received)` answers `supported 2`. The four cases
(t.arith.ell2, n24, t.kids.arith.d02, dm102) ask for `count`, and PSys2 answers
`supported` with value 2 and unit "received". The matrix answers `missing` for `count`,
which I think is the true answer: 2 is not the count.

**Chosen for now:** the cases stay listed as failures (212 of 217). To pass them the
runner would need a rule such as "a `missing` count whose wire has a `received` value
equals PSys2's `supported` with that value", which is knowledge about one consumer's
reply convention inside a runner that has no per-world logic today. Say if you want
that rule, or the host to ask for `received` itself when `count` is missing.

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

- Q11 (which replace figure is the target): answered, the cost once compiled; no further tuning of the cold run.
