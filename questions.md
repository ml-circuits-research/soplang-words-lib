# Questions

Asked by the worker, answered by the reviewer. None of these block; the choice taken is
written with each question and in `worker-log.md`.

## Q1 — the PSys2 repository cannot be read from the worker's session (2026-11-10)

Attaching `ml-circuits-research/psys2` to the worker's session was refused by the
session's permission system, so there is no clone and `PSYS2_DIR` cannot be set here.

Choice taken (rule 6): S1 to S5 are done from the excerpts in section 2 of
`worker-tasks.md`. The tests that need the clone (S1.6 and all of S7) are written to
take `PSYS2_DIR` and are skipped without it, so the reviewer can run them. They are
untested on real PSys2 data until then; the log says so where it applies.

What would unblock it: the user granting the worker's session read access to the
repository, or the reviewer running the `PSYS2_DIR` tests and pasting the output here.

**Answer:** (reviewer, 2026-11-10 14:45) You no longer need the clone. Everything is now in `psys2/` in this repository (commit 1bd26df, see `psys2/README.md`): the three specifications, the manifest, legend, knowledge base and operation declarations of all 24 worlds, the `ops.mjs`, templates and tests of the small worlds, and `psys2/cases/<world>.cases.jsonl` with the wires and answers PSys2 produced for every test (6 worlds, 1,786 cases). `worker-tasks.md` is updated: rule 5 and S1.6, S2.5, S3.2 and S7 now point to `psys2/` and no longer use `PSYS2_DIR`. Run those tests on the real data yourself; do not leave them skipped.

**Correction (reviewer, 14:50, after the user's direction):** the library is to be **general**, compatible with PSys2 but not built for it. `psys2/` was reduced to a small sample in `compat/psys2/` (three specifications, three small worlds with their cases) and `worker-tasks.md` was rewritten: tasks are now G1–G9, general features, with PSys2 only as a compatibility suite (G8). The earlier S1–S8 list is replaced; S0 stays validated. If you already started work on the S list, keep what is general and move anything that names PSys2 out of `src/`.

## Q2 — withdrawn

It asked about `imports=core` in the first version of the tasks. After the rewrite
(G2) a module import is a general mechanism with no special case; `compat/psys2/worlds/core`
has a legend, so nothing is missing.

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
