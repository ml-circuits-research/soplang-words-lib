# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q23 — a condition for "this key has no value" (R17.1; not blocking)

It exists already for patterns: `core.absent=<key>` (a pattern modifier, semantics S18,
reference "Patterns"). A rule's pattern `@x drawing name=?n core.absent=variant` matches
only a drawing with no `variant`, and is kept up to date; `ask` takes the same text:
`w.ask('@d drawing name=cat core.absent=variant')` returns only the plain drawing
(measured: `[{"d":"a"}]` with `@a drawing name=cat` and `@b drawing name=cat variant=2`).

What is missing is the object form used by `query`, `score` and `check({ query })`:
`where` holds only values, so a host building questions as objects cannot say it.
Options, against the current syntax:
- (a) Nothing new; hosts write `ask` text or a rule with `core.absent=`.
- (b) The object form of the same modifier: `{ type, where, absent: ['variant'], seek }`,
  and `core.absent=variant` on a `core.question` wire. It means exactly what the pattern
  modifier means; no new sign, no second meaning (a key named `absent` inside `where`
  would stay an ordinary key).
- (c) A special value in `where` (`variant: null` or `variant=_`): a value with a second
  meaning, against the rule.

**Recommendation: (b).** It is the existing construct reached from the object form; one
line in docs/integration.md would also have told the knowledge worker about
`core.absent=`. Implemented after the reviewer's answer.

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
