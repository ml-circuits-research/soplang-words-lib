# Phase-zero contract register

The owner has directly authorized implementation across all three repositories with parallel agents. The primary worker owns these shared contracts. Phase zero is being delivered in tested increments; no consumer should treat the whole register as a frozen release until every family has its stated evidence.

## Contract families and acceptance evidence

| Family and specification | What must be fixed and demonstrated before release |
|---|---|
| Legend: `w.legend.space`, `.axis`, `.region`, `.degree`, `.act`, `.concept`, `.role`, `.relation`, `.unit` — book chapter 4 | Define every slot, cardinality, reference target and admissible variant; load the actual examples with their dependencies. Distinguish a concept name from a reference to its declaration, and a missing definition from an open instance value. |
| Semantic links on `core.type` / `core.slot` — chapters 3–4 | Specify `is`, `means`, space/unit/role/part/relation refinements and target resolution. Unknown concepts must not silently become string metadata that never constrains anything. Preserve compatibility deliberately rather than accepting everything. |
| `kind=point` — §2.2.1 | Typed axes, numeric canonical equality, declared axis order/version, reference frame, dimension checking and axis access. Reject nonfinite coordinates, dimension mismatch and incompatible versions; do not turn a comma token into a point outside a point slot. This requires engine semantics, not just loadable declarations. |
| Request graph — §6.3.2, §10.3.1, §§4.4.4–4.4.5 | Publish source/target/constraint and not/group/quant schemas, root and local bindings, mode and mood, operator variants, units and anchors. Include the proposed typed value-reference description for `same`; keep it separate from a resolved versioned observation. Validate orphan/cyclic graphs and free bindings. Separate schema validity from three-valued evaluation and execution authority. |
| Journal: `std.trace.*` — §§6.9–6.11 | Reviewer decision at 1aeeaff: publish distinct typed records for request, step, input, observation, reply, undo and correction, with explicit slots. Current prose is richer than the concrete wire declarations: do not invent an unconstrained catch-all trace type and claim this family complete. |
| Replies: `std.reply.claim`, `.unit` — chapter 13 | Define act/status/object/whole/evidence/member fields and identity-based aggregation. Referenced evidence fixtures must be real and typed. Load tests alone do not prove that a claim is supported by an observed effect. |
| Change and numerical policy — §§4.4.4, 12.2.1–12.4.1 | Declare `std.change.policy`, `std.reference.set`, `std.calibration`, `std.tolerance`, `std.learning.episode`, `std.learned.factor`, `std.objective`, `.term`. Validate units, calibration consistency, episode support and priority/weight semantics. Explicit request bounds remain separate from permanent schemas. |
| Import evidence — §11.3.2 | Reconcile `std.source`, `std.import.mapping`, `std.provenance`, `std.knowledge.parent` with the provenance carried by existing imports. Reviewer decision at 1aeeaff: these are required phase-zero dependencies; do not leave the book examples with undefined external types. |

## Example inventory and fixtures

Each example receives a book location, the exact declaration text, a label (current executable, proposed executable, or intentionally partial), its prerequisite declarations and expected outcome. Partial fragments must name the omitted objects and functions. A fixture supplies those dependencies explicitly; a test must not make the example pass by treating every unknown slot as acceptable. Syntax-only examples remain syntax tests, while schema, reference and semantic examples exercise their respective validation paths.

Positive cases need paired counterexamples: quoted reference-looking text versus a reference; number versus numeric-looking string; valid point versus wrong dimension; constraint versus orphan; local binding versus free binding; positive normalization versus zero; exact requirement versus approximation; supported claim versus missing evidence. The expected rejection belongs in the fixture and is not an incidental thrown exception.

Reviewer decision at 1aeeaff: freeze the book's four basic changes (appear, disappear, quality change, relation change). The control task's “five” was a mistake. Kind migration remains a quality change of the kind slot with compatibility checks (§4.6.2), not a fifth primitive.

## Release boundary

A phase-zero release must publish its package/build version, the exact contract module entry points, canonical names, compatibility changes and test results in worker-log.md and the active plan. The reviewer owns worker-tasks.md and confirmed at 1aeeaff that it will relay the version to all three repositories in the same cycle; the worker must not edit it even though the other repository task files expect an announcement in that location.

There are separate acceptance claims: a declaration parses; a schema loads and rejects invalid instances; the evaluator implements its semantics; a host operation realises an effect. The release states which claim holds for each family. No “contracts frozen” announcement is justified if the public names or required slot variants remain unresolved, or if only permissive loading was tested. Later mechanism releases replace legacy constants as their generic replacement lands, with the book corrected alongside.

The other repositories can prepare migration ledgers and adapters independently. Their binding to the new schemas uses the published contract version, not a mutable draft of this register. The first foundation is library 0.168.0: `core.slot present=true` rejects structurally missing fields after deduction, while `required=true` continues to describe open completion keys. Contract-family modules and full phase-zero acceptance remain pending.

## Increment: import-evidence records (0.169.0)

Entry point: `core.use world=std.knowledge`, importing `std.provenance`, `std.source`, `std.import`. Canonical record names: std.source, std.import.mapping, std.provenance, std.knowledge.parent. The exact book example loads under closed schemas; paired tests reject missing fields, wrong reference targets, quoted reference-looking strings, duplicate singleton values, unknown fields/statuses and deletion of referenced evidence. Atomic forward references and module aliases are tested.

Acceptance: these records parse, load and reject structural invalidity. Concept-name resolution, truth of relations, source licence policy and semantic acceptance are not implemented by these records. No full phase-zero freeze: legend, point, semantic links, request, trace, reply and numerical/change families remain pending.

## Legend decisions requiring reconciliation before freeze

Implementation audit exposed conflicting act-condition forms (§4.6.1 versus §4.8), name-versus-reference ambiguity for spaces/axes/units, undeclared coordinates in the short colour example, and missing version/frame/unit/calibration fields. The concrete condition-record and typed-reference counterproposal is published in questions.md. These are schema-design blockers for the legend/point families, not permission to load arbitrary metadata or claim semantic validation from parsing alone. Other independent contract families can proceed.

Implementation review 1 (974160e) accepts 0.168.0 structural presence and 0.169.0 import-evidence contracts/parsed alias renaming. The book slot table and open-key explanation now explicitly distinguish present from required. Remaining phase-zero families retain priority over phase-one evaluators; the concrete legend counterproposal remains open.

## Increment: objective records (0.170.0)

Entry point `core.use world=std.objective`; canonical types std.objective and std.objective.term. The exact §12.4.1 wires load with typed forward references. Missing fields, invalid variants/numeric values, unsafe priority integers and wrong/deleted term references are rejected. Repeated term identity references are deduplicated; equal priorities and explicit zero weights are allowed. Structural-only acceptance: evaluator binding, normalization evidence, cost computation and optimization remain phase-one obligations. Other numerical policies are still pending.

## Increment: reference sample records (0.171.0)

Entry point std.reference; types std.reference.set and std.reference.sample. Replaced repeated literal values with typed member identities because the existing store deduplicates equal values and would corrupt sample multiplicity. Presence, numeric fields, optional provenance, references and unit-label agreement are validated, including shared-member edits. The exact executable reference fragment is tested separately from the proposed calibration/axis fragment. Version remains recorded metadata; immutable publication and calibration validation remain pending.

### Increment 0.172.0 — legend acts and conditions

Published subset: w.legend.act/condition through core.use world=w.legend. Variant arguments and owning-act role names are checked with existing declarative denies; no planner or effect evaluator. Spaces, axes, semantic links and request graphs remain pending. Implementation exposed missing qualification of explicit pattern-identity variables, now corrected in generic module loading.

### Increment 0.173.0 — structural spaces, axes and units

Entry point w.legend now includes space/axis/unit with typed ownership and canonical unit references, unique axis name/order, finite parameters and affine unit metadata. Exact book §4.8 colour declarations are tested. Numerical axes on graph spaces are rejected. No frame/point, region-coordinate checking, conversion, metric or semantic name-resolution claim; those contracts remain required before full phase-zero publication. Version is metadata, not immutable state.

Review a268361 accepts reference-sample identity (0.171.0) and typed act conditions/module qualification (0.172.0). Immutable snapshots before reproducible calibration remain pending; these acceptances do not close the frame, semantic-link or request-graph obligations.

### Increment 0.174.0 — concepts, degrees, relations and roles

Closed shared declaration schemas with typed references, acyclic single-parent specialization, inverse consistency and owner-role membership. Closure is transient derived data using existing reasoning budgets; it is not semantic resolution on core.type/core.slot. Group/question and relation test names remain explicit metadata; no function binding, degree evaluation or request graph claim. Frames, point values and regions remain pending.

### Increment 0.175.0 — resolved schema annotation identities

Generic core.schema.link descriptors register native type/slot annotations; w.legend provides is/means/space target mappings. Final-state validation rejects missing/ambiguous/wrong-type identities and invalidating edits. semanticLinks() exposes current resolutions without cached fact dependencies. Explicit references disambiguate global public names; module aliases work through descriptor remapping. Mandatory means, all semantic refinements, mapped-notation semantics and behavior remain pending; no full phase-zero release claim.
