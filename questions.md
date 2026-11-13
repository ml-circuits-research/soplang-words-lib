# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q22 — "one of" in a pattern: `at=sky at=grass` as "any of"? (R16.5, report only)

What a repeated key means today, measured: in a fact, `tag=a tag=b` is two values of one
key (for a `many=true` key, both hold). In a pattern, `tag=a tag=b` matches a wire that
has **both** values: with `@x thing tag=a`, `@y thing tag=b`, `@z thing tag=a tag=b`,
a rule on `thing tag=a tag=b` fires for `z` only. So a pattern lists what the wire must
have, and a repeated key there is "all of", the same reading as in a fact.

Reading `at=sky at=grass` as "any of" would give the same writing two meanings (all of
in facts and in patterns over many keys, any of in some patterns), against the rule, and
it would change what existing rules match. Options:
- (a) Keep "all of"; "one of" stays two denies (or two rules), as today.
- (b) A check with one deny: `@c core.check fn=one_of args=?at args=sky args=grass`. No
  built-in does this today (checked: `contains` is a substring test on text, so
  "skyline" would pass); it would be a new built-in `one_of(value, choices...)`, no new
  pattern syntax, one meaning.
- (c) A new pattern construct for alternatives.

**Recommendation: (b)**, a built-in `one_of`; until the reviewer answers, (a). Not
implemented, as asked.

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
