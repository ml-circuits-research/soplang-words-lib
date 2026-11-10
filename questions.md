# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q8 — a sixth status, `refused` (G6)

G6 lists `supported`, `conflicting`, `missing`, `unknown` / `no`, `budget`. I added
`refused`: when a question is answered by supposing the thing it asks about (see the
log) and the world refuses that thing, the answer carries the violations. In the PSys2
cases this is what PSys2 reports as `conflicting` with a note ("10 lei is not enough").
Folding it into `conflicting` would mix "several values" with "cannot be"; the
compatibility runner of G8 can map `refused` to `conflicting`. Say if you prefer one name.

## Q9 — `complete=true`, not `closed=true`, decides between `no` and `unknown` (G6)

The task says existence gives `no` for a closed type. In this library `closed=true`
means "only declared keys", which says nothing about whether all instances are known.
Choice taken: a separate `complete=true` on the type ("every instance is a wire of the
world") gives `no`; otherwise `unknown`. A type map can read it from any attribute, so
`compat/psys2/mapping.sop` can map it from `closed` if that is what PSys2 means.

## Q10 — entities that live outside the session (G8)

Four of the 588 PSys2 turns are refused because they refer to `$e.user` (3) or to
`$e.tom` before he was mentioned (1), which are not wires of the session. Choice taken:
the library keeps refusing a reference to a wire that does not exist under an ordinary
key; the host must tell such entities first. For G8 the runner will tell an `e.user`
wire at the start of each session. Tell me if PSys2 expects something else.

## Closed

- Q1 (no access to the PSys2 repository): answered, the material needed is in `compat/psys2/`.
- Q2 (`imports=core` without a `core` module): withdrawn after the task list was rewritten.
- Q3 (`core.test` name clash): answered, renamed to `core.check` with `core.test` kept as an alias when linked.
- Q4 (`world.schema` is now `world.matrix`): accepted; listed under Changes in SPEC.
- Q5 (strictness of literal kinds): accepted as chosen; unknown kinds are reported by `world.schema(type).unknownKinds`.
- Q6 (no default parent in the library; `root=` in a type map): accepted.
- Q7 (one commit for G1 and G2): accepted; one commit per task from here on.
