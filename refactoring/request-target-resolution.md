# Explicit request target selection

`resolveRequestTargets(world, request, options)` selects existing targets from
caller-declared canonical populations. It does not interpret text, infer number
from determiners, repair kinds, apply ordinals, resolve conversational context or
create/execute anything. Membership in the exact target kind and population
coverage are trusted declarations; structural subtype compatibility is not
inferred and would need a separate declared evaluator.

Options are `populations`, `policies`, `evaluateConstraint`, `evaluateTarget`, `bindings`, `family`
(default `std.request`) and a total `budget` (default 100,000 steps). A population
is keyed by target ID and contains `{kind, context, complete, subjects, evidence}`.
Its context is `{instanceId, scope, version}`; every subject has
`{id, source, sourceType, version}` with the same snapshot version. IDs remain
strings or safe integers without coercion. Duplicate source identities within a
population are invalid. Historical identity is local to the explicit instance,
scope and version, not a global comparison of source strings.

Selection policy is explicit `one` or `all`. Without a policy the target stays
unknown. `one` resolves only a complete, unique known match with no unknown
candidates; two known matches are ambiguous even with incomplete coverage. Zero
matches are missing only with complete coverage and no unknown candidates.
`all` retains known matches but resolves only on a complete population without
unknown candidates. Empty complete `all` resolves to an empty set. Partial and
unknown memberships retain candidates/evidence and structured clarification
records; clarification choices preserve the complete context and subject.

A target selector is evaluated for each explicit candidate by the existing
three-valued predicate evaluator. The request result is never used as a selector.
Without a selector an unnamed target admits every declared canonical member,
unless an explicit `evaluateTarget` callback adds a candidate predicate. A named
target always needs this callback: canonical kind membership does not prove its
name. Missing name evidence is unknown, never an automatic kind-only match.

`evaluateTarget` receives one frozen record `{request, target, binding, bindings}`
and evaluates the positive proposition described by the target's non-selector
fields over the candidate snapshot. It returns
`{truth: 'true' | 'false' | 'unknown', evidence: [], reason?}`. The mechanism does
not choose a native name property or compare strings itself. Its truth is
conjoined with the selector using three-valued logic: a false selector excludes
a candidate even when its name is unknown. Candidate records preserve this
`targetEvaluation` separately from the selector `evaluation`. Callback calls,
input/evidence copies, exceptions and source mutation use the same total budget
and whole-operation freshness guard. Initial ground
bindings may provide other explicit subjects, but cannot override candidate
bindings or introduce lexical bound variables globally. Quantifier-bound targets
remain lexical and reject global population/policy input. New targets return
`requires-creation`, with no effects or invented instance identities.

Structural and schema checks run before selection. One total budget charges
those checks, every reused predicate evaluation, candidate/evidence copies and
output construction. Public world mutation, including temporary mutation rolled
back by a callback, invalidates the whole operation and discards all resolutions.
Both target and constraint callbacks must be pure over declared stable external snapshots; neither
the evaluator nor source-stamp checks independently prove host truth or coverage.

Successful computation returns `ok: true`, source stamp, target statuses, known
matches, all evaluated candidates, population evidence and clarification data.
This is not a guarantee that every target resolved. Whole refusal returns
`ok: false`, unknown truth, no resolved targets and explicit issues. No fallback
or English clarification wording is embedded in the mechanism.
