# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q15 (R7.2, language): the name of a deny's priority

The task offered `rank=` or `order=`. Both now have another meaning: `core.rank` is a
wire type, and `order=` is an attribute of `core.rank` (asc or desc). Under the rule
"one sign, one meaning" I used `priority=` (a number, lower reported first), which has
no other use. Options: (a) `priority=` (done), (b) `order=` anyway, (c) `rank=` anyway.
Recommendation: (a). Nothing waits on this.


## Q16 (R7.7, language): should SOP Lang v1.2 have `expr=`? Proposal, no code written

**The problem.** "Strictly between two squares" took one host 17 `core.calc` and 9
`core.check` wires: each operation is a wire of its own. With `between`, `sign` and
`clamp` (done in R7.7) that rule shrinks to about 6 wires, but any arithmetic of more
than one step still needs one wire per step.

**The proposal.** An attribute `expr=` on `core.calc` and `core.check`, holding a string:
```
@c core.calc out=?d expr="abs(?x2 - ?x1) + abs(?y2 - ?y1)"
@k core.check expr="?d > 0 and ?d < 8"
```
- Inside the string only: numbers, `?variables` of the rule, `+ - * /`, parentheses,
  `= != < <= > >=`, `and or not`, and calls of built-in functions (no host functions,
  no references, no strings). A string, so the lexer is unchanged: it is a value like
  any other, and the grammar of the string is a separate, small one.
- Bounded: at most 200 characters and 50 nodes; evaluated by the same built-ins (so
  units, rationals and precision behave as in `core.calc`); a variable without a value
  makes the calc give nothing, as today. Parsed once when the matrix is compiled; a
  mistake is a `schema` error with the position in the string.
- `core.calc` keeps `fn=`/`args=`; `expr=` is the other form, not a replacement.

**Against it (the user's rule: one language, no sign with two meanings).**
- `?x` keeps its one meaning (a variable), and `=` inside the string would mean
  equality while outside it separates a key from its value. That is a second meaning of
  `=`; writing equality as `==` avoids it but adds a sign.
- It is a second, infix notation inside the language, next to the wire form; hosts that
  generate rules would have two ways to say the same thing.
- Abduction, relations and the readers of Round 8 work on wires; an expression would be
  opaque to them unless it is compiled into calc wires (which is possible: each node
  becomes a calc, so the wire form stays the one meaning and `expr=` is notation).

**Options.**
- (a) No `expr=`; keep adding small built-ins where a pattern recurs (what R7.7 did).
- (b) `expr=` as above, with `==` for equality inside the string, compiled into the
  same calc and check wires (so everything downstream sees wires).
- (c) `expr=` with `=` for equality.

**Recommendation: (a) now, (b) if hosts keep writing long chains.** (b) is the only
form that keeps one meaning per sign, and compiling it to wires keeps one semantics; but
it is a second notation, and the built-ins remove most of the measured case. Nothing
waits on this answer.

## Q17 — words for language: a `core.word` wire? (Round 8, docs/design/formalization.md §1)

A reader needs to map surface words in one language to names the matrix has (an action,
a type, a `type.key`, an enum value). Options:
- (a) A host type, no vocabulary: the host tells `@w word lang=en text=book means=reserve`
  with its own type; `interpret` would be told the type name.
- (b) `core.word lang= text= means= of=`, read only by `interpret`; one word wire, one
  meaning (two meanings are two wires, chosen between by `score`); load warning when
  `means=` names nothing.
- (c) `word.en=` keys directly on slots, actions and values.

**Recommendation: (b).** It adds one bookkeeping type and no sign; words stay facts
(namespaces, sync, snapshots work), and (c) would put many languages on every schema
wire. Nothing is built until answered; `score` does not need it.

## Q18 — an argument's role: `role=` on `core.slot` and on action params? (§1)

A frame may mark an argument by role (a preposition or case: "on Monday", "with bob")
rather than by key. Options: (a) no role, the frame names keys through words (`means=
meeting.day`); (b) `role=` on `core.slot` (and a `role.<param>=` on `core.action`).

**Recommendation: (a) for now.** Words with `means=type.key` already carry what a role
would, with one construct; add (b) only if a language needs one role word for many keys.

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
