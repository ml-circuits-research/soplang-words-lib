# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q3 — two wire types named `core.test` (matters for G8)

This library uses `core.test fn=<name> args=...` for a condition in a rule or deny.
PSys2 uses `core.test` for the cases in `tests.sop`. A `tests.sop` told to a `World`
would be read as matrix wires and refused (no `fn=`).

Choice taken: nothing changed. The G8 runner reads `cases/*.jsonl` and never tells test
wires to a world, so the clash does not bite there. If one name should be free, the
least disruptive change is on this side: rename the matrix wire to `core.check` and keep
`core.test` as an alias for one version. Say so and I will do it before G8.

**Answer:**

## Q4 — `world.schema` changed meaning (G2)

The task asks for `world.schema(type)`. Until now `world.schema` was the Map of matrix
wires. The Map is now `world.matrix`; `world.schema(type)` is the new method. Noted
because it is an API change that the task implied but did not state.

**Answer:**

## Q5 — how strict the literal kinds are (G2)

Choice taken: `integer` is `-?\d+`; `number` is a number without a unit; `boolean` is
`true` or `false`; `atom` is anything that is neither quoted nor a reference; `string`
is anything that is not a reference, quoted or not; `quantity.<name>` is a number with
an optional unit, and the name (`mass`, `length`) is not checked against the unit;
`time.<name>` accepts any literal until G4; a kind the library does not know accepts
any literal. Several kinds on one slot are alternatives. Tell me if `string` should
require quotes or if unknown kinds should be refused.

**Answer:**

## Q6 — the default parent of a type (G1, G8.1)

PSys2's `core` legend says a type without `extends` extends `core.thing`. As a general
rule that would put a consumer's type name in `src/`. Choice taken: no default parent in
the library; a `core.schema.map ... as=type root=<type>` gives one, and
`compat/psys2/mapping.sop` uses `root=core.thing`. A native `core.type` without a map has
no parent unless it says `extends=`.

**Answer:**

## Q7 — one commit for G1 and G2

The work was started under the first task list (S1) and reshaped after the rewrite, so
the hierarchy and the schema mapping touch the same lines of `src/matrix.mjs`. They are
in one commit, `G1, G2: ...`, with separate entries in `worker-log.md`. Later tasks get
one commit each.

**Answer:**

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
