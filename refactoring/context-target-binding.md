# Exact historical target binding

## Piece and approved method

This is the historical foreign-key join proposed in questions.md, “Context
references: exact retained target-to-subject join”. It fills one part of the
conversation boundary, not a conversation solver. Three candidate methods were
considered: an explicit witnessed join over retainRequestRevision/retainedRevision
(chosen); a closed-set query using resolveRequestTargets (larger, needs policy and
coverage); and retained information-state/focus selection (std.focus, insufficient
for exact graph/native identities). The chosen relational join preserves exact
identities without selecting a turn, interpreting a fragment or modifying a graph.

## Input

`lookupContextTargetBinding(world, {owner, revision}, {budget=100000,
graphBudget=20000})` reads an existing retained record. It publishes nothing.
The record's definition has this exact shape:

```
{
  format: 'sop.context-target.binding', schemaVersion: 1,
  graph: {owner, revision, target},
  evidence: {owner, revision, phase: 'before' | 'after', member},
  membership: {owner, revision},
  witness: {
    authority, graphRequest, traceRequest, step, invocation,
    context: {instanceId, scope, version},
    population: {source, scope, version}
  }
}
```

Graph points to an existing sop.request.revision/1 retained by
retainRequestRevision. Existing serializeRequestGraph checks its schema and local
ownership; target must be its explicit target with a canonical kind. A bound
quantifier target does not become a global context reference.

Evidence points to an actual sop.reply.existence/1 assessment produced by
assessExistenceChange. The existing pure evaluateExistenceEvidence implementation
rechecks its dependencies and verdict consistency; a removed, unchanged or
unconfirmed verdict remains usable historical evidence. A property-only snapshot
lacks population/member/context facts and is insufficient. No live claim or trace
wire is required. Selected phase/member is explicit, never the first matching item.

Membership points to the existing published resolveRequestTargets population
shape `{kind, context, complete, subjects, evidence}`. Subjects use the exact native
shape `{id, source, sourceType, version}`. String IDs and safe integer IDs stay
distinct. Kind must equal the validated graph target kind; every subject version
must equal its own native context version. Duplicate sources, even identical
ones, refuse. The selected trace member's source/type/version must match a known
subject. Partial populations do not invalidate this selected positive witness.

## Trusted correlation boundary

The bridge is an **external trusted declaration** correlating graph.target to
that exact trace member. Witness.graphRequest must equal the validated graph root;
traceRequest/step/invocation must equal the retained assessment. The graph request
ID and trace request ID may differ; the library does not prove their relationship
by equal strings. Authority names a declaration; it is not authentication or a
callback granting authority.

The trace has no native instance/incarnation field. Witness.context must exactly
match retained native membership context; witness.population must exactly match
the retained trace population source/scope/version. Their relationship is declared,
not inferred. Native context version, subject version, trace population version
and operation version are separate namespaces. The mechanism never substitutes
one for another. A lying external correlation or membership declaration cannot be
independently disproved here. Stable external snapshots are a host obligation.

## Output and bounds

Success returns status bound-historically, historicalOnly=true, liveBinding=null,
canonicalKind, immutable binding/evidence/membership/witness copies and exact
retained references. Unknown/missing/conflicting evidence returns status unknown,
no binding and explicit reason. A reused ID/source in a current world is never
looked up or treated as incarnation proof. New selectors and live identity require
separate explicit revalidation; historical success grants no execution authority.

Budget bounds copied data, comparisons and lookup/evidence evaluation. Fixed data
descriptors select the allowance without invoking accessors before the options
copy, so a tiny allowance also governs that copy. Graph validation has its separate
finite graphBudget through the existing serializer; returned steps describes
copy/lookup work, not the serializer's internal work or memory. All copies use
retainedDefinition (plain finite JSON, getter/cycle refusal, depth bound). Stamp
and monotonic clock changes invalidate the entire read, even transient writes
followed by undo. No facts, retained definitions, executor or source input mutate.

## Probes and acceptance boundary

Ten neutral tests use actual World, retainRequestRevision and assessExistenceChange,
including two real retained steps, two targets/subjects, partial and removed
membership, restored history after trace deletion, numeric/string IDs, reuse and
cross-instance/version mismatches, forged dependencies, getters/budgets and
transient source mutation. The test imports tools/lib-under-test so root can run
identical checks on source and bundle. No public release, full context resolution
or application success is claimed by these source files.

The mechanism names no consumer, domain, sentence or language. An unrelated
world can retain the same declared shapes; a different language changes no join.
No existing behavior is replaced. The smaller alternative—an unqualified source
or latest-turn ID—fails source reuse and two simultaneous same-kind targets.
Explicit data supplies correlation; the library supplies only bounded validation.
