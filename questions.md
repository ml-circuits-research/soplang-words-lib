# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q13 (P3): what a host action sees between two tells, once tells are batched

Today each `ctx.tell` inside an action is a full change: the chase runs and the world is
validated, so the next line of the action can read what the rules derived
(`ctx.find`, `ctx.val`), and a tell that breaks a deny is refused at that line, even if a
later tell of the same action would have repaired the state.

Batching (propagate once at commit) changes two things a host can observe:
1. a read between two tells would not see derived wires;
2. a state that is invalid only in the middle of the action would be accepted.

Choice I will take unless told otherwise: **propagate lazily**. Tells are queued; the
queue is propagated and validated as one step at the first read (`find`, `val`, `get`,
a query) and at commit. An action that only tells (the measured case: about 70 tells)
pays one propagation; an action that reads after each tell behaves exactly as today.
Point 2 is accepted as the new rule: an action is checked where it reads and at its
end, not after every tell, as `applyPatch` already is (H1). A refusal names the tell
that was queued first among the wires involved. Declarative actions already evaluate
everything against the state before the action, so for them nothing changes but the
cost.


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
