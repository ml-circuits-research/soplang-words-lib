# Phase-zero contract register

This is preparation for the control task at fa29e00, not a published library contract or an implementation release. The current scheduled instruction and workspace AGENTS.md still limit this worker to book review. That scope discrepancy is recorded in questions.md / Book. No consumer should treat this document as a version it can vendor.

## Contract families and acceptance evidence

| Family and specification | What must be fixed and demonstrated before release |
|---|---|
| Legend: `w.legend.space`, `.axis`, `.region`, `.degree`, `.act`, `.concept`, `.role`, `.relation`, `.unit` — book chapter 4 | Define every slot, cardinality, reference target and admissible variant; load the actual examples with their dependencies. Distinguish a concept name from a reference to its declaration, and a missing definition from an open instance value. |
| Semantic links on `core.type` / `core.slot` — chapters 3–4 | Specify `is`, `means`, space/unit/role/part/relation refinements and target resolution. Unknown concepts must not silently become string metadata that never constrains anything. Preserve compatibility deliberately rather than accepting everything. |
| `kind=point` — §2.2.1 | Typed axes, numeric canonical equality, declared axis order/version, reference frame, dimension checking and axis access. Reject nonfinite coordinates, dimension mismatch and incompatible versions; do not turn a comma token into a point outside a point slot. This requires engine semantics, not just loadable declarations. |
| Request graph — §6.3.2, §10.3.1, §4.4.4 | Publish source/target/constraint and not/group/quant schemas, root and local bindings, mode and mood, operator variants, units and anchors. Validate orphan/cyclic graphs and free bindings. Separate schema validity from three-valued evaluation and execution authority. |
| Journal: `std.trace.*` — §§6.9–6.11 | Freeze concrete type names and slots for requests, operations, before/after observations, evidence, corrections and compensation. Current prose is richer than the concrete wire declarations: do not invent an unconstrained catch-all trace type and claim this family complete. |
| Replies: `std.reply.claim`, `.unit` — chapter 13 | Define act/status/object/whole/evidence/member fields and identity-based aggregation. Referenced evidence fixtures must be real and typed. Load tests alone do not prove that a claim is supported by an observed effect. |
| Change and numerical policy — §§4.4.4, 12.2.1–12.4.1 | Declare `std.change.policy`, `std.reference.set`, `std.calibration`, `std.tolerance`, `std.learning.episode`, `std.learned.factor`, `std.objective`, `.term`. Validate units, calibration consistency, episode support and priority/weight semantics. Explicit request bounds remain separate from permanent schemas. |
| Import evidence — §11.3.2 | Reconcile `std.source`, `std.import.mapping`, `std.provenance`, `std.knowledge.parent` with the provenance carried by existing imports. Record whether these are required phase-zero dependencies or the next contract batch; do not leave the book examples with undefined external types. |

## Example inventory and fixtures

Each example receives a book location, the exact declaration text, a label (current executable, proposed executable, or intentionally partial), its prerequisite declarations and expected outcome. Partial fragments must name the omitted objects and functions. A fixture supplies those dependencies explicitly; a test must not make the example pass by treating every unknown slot as acceptable. Syntax-only examples remain syntax tests, while schema, reference and semantic examples exercise their respective validation paths.

Positive cases need paired counterexamples: quoted reference-looking text versus a reference; number versus numeric-looking string; valid point versus wrong dimension; constraint versus orphan; local binding versus free binding; positive normalization versus zero; exact requirement versus approximation; supported claim versus missing evidence. The expected rejection belongs in the fixture and is not an incidental thrown exception.

The book currently defines four general acts (`make`, `remove`, `change`, `place`) and four basic change categories in §4.6, while the phase-one control task says “five basic changes”. Freeze the existing distinction unless a fifth is specified; kind migration is currently a change of a value with compatibility checks, not automatically a new primitive. This is a contract reconciliation item, not a reason to duplicate operations.

## Release boundary

A phase-zero release must publish its package/build version, the exact contract module entry points, canonical names, compatibility changes and test results in worker-log.md and the active plan. The reviewer owns worker-tasks.md and can relay the version there; the worker must not edit it even though the other repository task files expect an announcement in that location.

There are separate acceptance claims: a declaration parses; a schema loads and rejects invalid instances; the evaluator implements its semantics; a host operation realises an effect. The release states which claim holds for each family. No “contracts frozen” announcement is justified if the public names or required slot variants remain unresolved, or if only permissive loading was tested. Later mechanism releases replace legacy constants as their generic replacement lands, with the book corrected alongside.

The other repositories can prepare migration ledgers and adapters independently. Their binding to the new schemas uses the published contract version, not a mutable draft of this register. No runtime change, version bump or consumer notification is performed by this documentation preparation.
