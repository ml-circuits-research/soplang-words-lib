# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q26 (R19 item 7): PSys2's pattern set is not in compat/

The task says to measure the indexed match on PSys2's pattern set from compat/. compat/psys2
has the legend's `core.pattern` declarations (match=, emit=, kind=, priority=, ...) but no
pattern wires (no patterns.sop, no spec 03 with the token syntax; `grep -rc match=` over
compat/psys2/worlds and matrices: 0). What I did meanwhile: `PatternIndex` (general: a
pattern is the word sets it needs, kept under its rarest set; the host's matcher stays the
host's), tests, and a synthetic bench (3,000 patterns: 51.5 tried per sentence instead of
3,000). Options:
(a) PSys2 copies its patterns.sop files and spec 03 into compat/psys2 (hand-written, so
    allowed); I write `compat/psys2/patterns.mjs` that turns `match=` into `needs` and
    measure on the real set and on the sentence that took 1,056,197 steps.
(b) Leave the measurement to PSys2: it builds `needs` from its own matcher.
I lean to (a): one real number beats a synthetic one, and the conversion shows whether
"needs" is enough to express its token patterns (optional groups, phrase groups `[$lang.yes]`).

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
- Q25 (delegation): answered (a); the pattern becomes `std.fill`, ranks as named tiers.
