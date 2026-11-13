# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q25 — delegation between modules: what the documented pattern cannot say (R18.4)

Built with rules, `core.absent=`, aggregates and a soft deny (docs/integration.md §5a,
examples/delegation.mjs, test/delegation.test.mjs): needs, offers from other modules, a
declared order, the source on the filled wire, ties reported, "no offer" left open. What
it cannot say cleanly:

1. **The order is numbers each module writes** (`rank=4`): nothing checks that two
   modules mean the same thing by 4, and a new kind of filler means renumbering.
2. **The choice is six wires** (two aggregates, the choose rule, the tie deny) repeated
   for every key that can be delegated.
3. **The filled value goes to another key** (`use_place`, not `place`): a rule that wrote
   `place` would end its own `core.absent=place` condition and take itself back.
4. **core.rank is not safe for this yet**: choosing by `core.rank` over the offers gave a
   `conflict` when a better offer arrived (an old place in line not taken back). It is
   kept as a todo test with its repro; aggregates were used instead.

Options:
- (a) Keep the pattern; ship the draw module's six wires as a library module that a world
  uses for each key (`core.use`), and declare the ranks once as named `core.tier`s.
- (b) One construct, `core.fill of=<type> key=<key> from=<offer type> by=<rank key>`, that
  takes the best offer, records its source and reports ties; the value can then go to the
  key itself, since the library keeps the gap open while it fills.
- (c) Nothing more: hosts copy the pattern.

**Recommendation: (a)** now: it needs no syntax, keeps one meaning per construct, and
item 4 is a bug to fix on its own (to be done before any of this is used with core.rank).
Revisit (b) if several worlds delegate more than a few keys.

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
- Q12 (the four "received" cases): answered, `count` stays `missing` and the cases stay listed; the host asks for `received` itself.
- Q13 (what a host action sees between batched tells): answered, lazy propagation accepted with three conditions (every involved tell named, `ctx.flush()` and `{ now: true }`, two tests); done in P3.
- Q14 (namespace separator): answered by the user, `::` (the only sign with no other meaning); used in R7.9.
- Q15 (name of a deny's priority): answered, `priority=` kept.
- Q16 (`expr=`): answered, not in v1.2; revisit only with a rule that still needs more than about 8 calc/check wires after the built-ins.
- Q17 (words): answered, (b) `core.word lang= text= means= of=`; built in R9.1.
- Q18 (roles): answered, (a) no `role=`; `means=type.key` carries it.
- Q19 (words left out before assumptions): answered, (b) kept.
- Q20 (`groups=` spelling): accepted, `groups=<value>` or `groups=$<pattern>`.
- Q21 (`value=` on core.word): accepted, no `value=`; `means=<value> of=<type.key>` stands.
- Q22 (one of in a pattern): answered (a); a repeated key stays "all of", "one of" is two denies, no `one_of` built-in.
- Q23 (absent key): answered (b); `absent: [keys]` in the object form and `core.absent=` on question wires, built.
- Q24 (ordered sequences): report accepted; one wire per point stays (no notation inside values).
