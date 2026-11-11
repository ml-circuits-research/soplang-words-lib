# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q14 (R7.9): the namespace separator. ':' already has two meanings

The task asks for a separator with no other meaning in SOP Lang, and to ask before
coding if ':' has one. It has two:
1. inside reasons, `?n:ordinal` writes a variable through a filter (R6.5, 0.7.0);
2. inside atoms, clock times and date-times: `10:40`, `2026-11-11T10:40`.

The lexer itself gives ':' no meaning in an identifier (identifiers are letters, digits,
`_`, `-` and dots), so `$shop:b1` could be read unambiguously as a reference. But a
reader would meet ':' as a filter, as a time and as a namespace.

Options:
- (a) `:` anyway (`@shop:b1`, `$shop:b1`): the contexts do not overlap (an id or a
  reference, never a reason or an atom), and it is the usual spelling of a qualified
  name. Cost: three meanings for one sign.
- (b) `::` (`$shop::b1`): no other use anywhere in the language. Cost: two characters.
- (c) `/` (`$shop/b1`): no meaning in identifiers; inside atoms it is part of units
  (`10N/kg`). Cost: two meanings, and it reads like a path.

I recommend (b): it is the only one with no other meaning, which is the user's rule.
R7.9 waits for the answer; I continue with R7.1–R7.8 meanwhile.


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
