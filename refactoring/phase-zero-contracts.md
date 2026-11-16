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

### Increment 0.176.0 — request source/envelope/target foundation

std.request exports only source, request and target records, with explicit mandatory mood, unresolved act/kind names and typed source/request ownership. Target modes new/existing are supported; bound/root/logical/constraint contracts are not exported. The minimal §6.3.2 fixture is tested; the full graph examples remain proposed. No phase-zero gate is released to consumers. Full graphs need owned logical nodes, all-path binder scope, cycle/orphan checks and typed operator variants; questions.md records concrete implementation choices.

Review 292e8dd accepts 0.173.0–0.175.0 and prioritizes the complete request graph next. Mandatory means is to become opt-in per world during migration, then the default after migration; that strict profile is not yet implemented. Frames/points, traces, replies and change/calibration snapshots remain required before the phase-zero announcement.

### Increment 0.177.0 — final-state invariant hook

core.validate executes registered pure synchronous boolean validators on every matching record after final-state ingestion, uncached and under the validation budget. This closes the invalidation gap for an untouched parent when a child changes. The request graph validator itself remains next; no topology or frame acceptance is claimed from the hook. Purity is a trusted host contract, not JavaScript sandboxing.

### Increment 0.178.0 — structural request graphs

std.request now exports constraints, logical nodes, value descriptions and bound targets. Tests load exact §§6.3.2/10.3.1 fragments and reject ownership crossings, cycles, orphan nodes, invalid variants and all-path binder escapes; scalar Unicode spans are checked. inspectRequest supplements ordinary schema validation, using core.validate for child-edit invalidation. Concept typing/orderability, unit compatibility, evidence semantics, truth and execution remain pending. No full phase-zero release.

### Increment 0.179.0 — change-policy declarations

Entry point std.change exports std.change.policy with required atom kind/concept/anchor/unit and a closed schema. The exact §4.4.4 example and malformed declarations are tested. Name resolution, compatible units, policy selection (including conflicting alternatives), request precedence and execution remain pending. Frame publication/snapshot invariants and typed journal evidence still need concrete representation decisions; full phase zero is not released.

### Increment 0.180.0 — historical request/input trace foundation

std.trace exports only request/message and input/source/version/source.type/key/values. Historical inputs preserve concrete canonical SOP token strings inside a JSON array, including multiplicity/order and references whose live targets may no longer exist. Existing JSON limits and budgeted final-state parsing reject malformed, noncanonical or variable tokens. The revised first two §6.11 records are executable; the remaining fragment is explicitly proposed. Structured request linkage, step/observation/reply/undo/correction contracts, evidence truth and immutable persistence remain pending. This is not full trace or phase-zero acceptance.

### Increment 0.181.0 — typed trace operation linkage

std.trace now exports request/input/step/observation/reply/undo/correction. Final-state checks enforce DAG dependencies, invocation text correlation, reply request membership, separate undo execution evidence, and acyclic nonforking correction lineage; historical dependencies/corrections can cross requests. Observations require input snapshots with per-source versions. Full §6.11 example is structurally executable. No evaluator truth, evidence-supported reply, actual undo, immutable storage or structured semantic-request linkage is implied; full phase zero is still pending.

### Increment 0.182.0 — detached reference capture and median

calibrateReference validates the world, captures typed reference samples and their factual provenance closure into detached frozen JSON-serializable data, and computes a positive median under budget. Distinct equal measurements survive; same sample references are deduplicated. Source changes do not mutate prior captures. Extreme finite midpoint cases are tested. This does not register published immutable revisions, authenticate restored JSON, implement std.calibration/axis linkage or release phase zero.

### Increment 0.183.0 — target selector contexts

Reader development exposed that identifying pre-state properties could not be separated from desired results. Existing targets now have selector graph roots, with independent scope and disjoint full closures; implicit result conjunction excludes selectors. Selector-only logical graphs need no result root. Exact §6.3.1 example is structurally executable. Candidate binding, joint target resolution, predicate truth and historical-event selectors remain pending. This corrects a shared contract instead of hardcoding reading exceptions.

### Increment 0.184.0 — retained revision registry

World.retainRevision / retainedRevision implement the shared identity+revision→definition mechanism. Persistent frozen definitions are independent of ordinary fact undo, merged on adoption and preserved explicitly in full/delta/timeline JSON. First insertions inside refused transactions roll back; forks isolate later publications; conflicting reconciliation fails. JSON shape and budget checks precede publication. This prerequisite does not by itself implement point/frame bindings, migrations or calibration-to-axis consistency. The review's deferred registry is now delivered explicitly rather than pretending mutable source metadata can freeze point meaning.

### Increment 0.185.0 — original grammar source ranges

Opt-in parseText sourceSpans/sourceBudget preserves original Unicode scalar intervals separately from normalized token-index spans. Unaligned rewrites and exhausted mapping budgets report unavailable provenance rather than guessed source intervals. Disjoint ranges are not automatically contiguous request spans. This is shared reader infrastructure, not semantic interpretation or coverage.

### Increment 0.186.0 — retained numerical space capture

retainPointSpace captures a validated axes space, ordered axes, numeric parameters, all declared affine units and an explicit typed root frame into the retained registry. The owner is point.space: followed by the qualified space ID; version selects the immutable definition. Conflicting reuse fails and source undo cannot erase it. Frames are descriptors captured per space revision, not independent authenticated publications. Native point slots, canonical coordinate matching/indexing, axis paths, explicit migration guards and child-frame transforms remain pending; phase zero is not released.

### Increment 0.187.0 — declarative parse-tree composition

composeParses maps exact production IDs and lexical categories to structured JSON templates, independently for each parse candidate. Required child/feature mappings fail closed; alternatives and source ranges remain separate. Explicit syntax-only mappings are author assertions, not semantic coverage proofs. Own-property copying rejects exotic/non-JSON containers and accessors; budgets bound traversal. This mechanism does not itself emit or validate std.request wires, resolve domain references, rank alternatives or authorize execution. Knowledge declarations and a validated request adapter are separate follow-up work.


### Review 10 — accepted publication and migration boundary

Reviewer 53bafc4 accepted original source ranges and retained point-space capture after running their tests. Native binding must refuse a slot revision change while values exist unless a complete-value migration explicitly runs; declaring a new slot is the safe alternative. This accepted guard is still an implementation obligation, not a delivered native point feature. The exposed provisional reader set is development material; freeze a fresh independent final set only after development rules freeze, with its semantic review kept away from rule authors.

### Increment 0.188.0 — composition equality guards

composeParses accepts per-production template pairs that must compare equal after child composition and before parent construction. Structural JSON equality preserves primitive types and array order while ignoring object key order. All guard declarations are checked before returning candidates, including unused rules, and share the traversal budget. Guards reject incompatible proposals; they do not infer concept equivalence, convert units or validate a complete request. The SOP adapter must faithfully translate every agreement declaration to these guards.

### Native point integration checklist from engine inspection

The next runtime slice must cover the entire value path: matrix slot compilation and inherited bindings; World._iv canonical indexing; _same and _unifyValue (including a variable reused across incompatible point slots); _matchPaths named-axis reads; domain validation; index rebuilding after schema changes; and persisted binding identity across fork/replay/adoption. A canonical comma token alone cannot carry its binding through the generic string substitution environment. Keep literal comparison local to its slot and preserve/check binding compatibility for shared variables. The accepted migration guard must also cover changing type inheritance or removing/readding a declaration, rather than only direct edits to space.revision. Cross-binding conversion remains explicit; no implicit unit/frame conversion is authorized by numeric equality.

### Increment 0.189.0 — structural inheritance index consistency

The point-binding audit reproduced stale indexes when only an additional extends/mixin changed: effective lineage moved from [item,base,left] to [item,base,right], but stored item facts were absent from ofType(right). The hierarchy fingerprint now includes ordered mixin lists, triggering the existing transactional reindex path for descendants and value indexes. Regression tests cover queries, newly applicable rules, refusal rollback, fork isolation, undo/redo and snapshot replay. This repairs an existing general engine invariant; it does not yet implement point bindings.

Further native-point audit obligations: candidate lookup must use point canonicalization rather than only the current numeric/unquoted literal shortcuts; pattern and actual subtype slot bindings must be compatible; template writes through then.on must check the actual target type. A variable's binding must survive matching, aliases and template construction before walk erases its origin. Deduplication/firing signatures must include semantic binding distinctions when equal tokens can have different meanings. An incompatible inherited point override must be explicitly refused or migrated, not silently followed.

Point audit also identified aggregate grouping, rank caches and function/check operands as consumers of walked values. A first native slice must carry/check binding identity through these paths or explicitly refuse whole-point operands there; named-axis projection is the scalar boundary. Per-cell mutable bindings, if introduced, belong to ordinary undoable World state and its detach/adopt/persistence paths, not the undo-independent retained-definition registry. Prefer deriving effective bindings from restored schema and retained definitions under an invariant-preserving occupied-cell migration guard. Pair tests for both pattern orders, aliases/branches, subtype template writes, point-to-untyped laundering and all persistence modes before claiming the native contract complete.

### Reply-claim audit awaiting a concrete ownership decision

The book's proposed live object/whole references cannot preserve history after domain deletion. Typed historical subject descriptors are needed. Existing std.trace correlates observations with invocations but does not link a trace request to a versioned semantic request/predicate or record evaluator assessments. questions.md proposes these ownership boundaries before claiming supported replies. A structural candidate-claim schema alone is not proof of an effect and must not enable success realization. No reply module is declared released by this audit.

### Review 11 — first end-to-end path takes priority

The reviewer accepted composition, equality guards and mixin reindexing and explicitly moved native point binding to the migration-guard step, outside the immediate phase-zero boundary. The next shared deliverable is Drawing property change behind ?engine=new: symbolic overlay, std.request validation, instance resolution, actual effect, correlated trace and a minimal evidence-backed reply. Old engine remains default. Implement the exact property-change evidence contract needed by this path first; broader claim kinds and group realization stay named deferred rather than blocking the preview or being falsely implied by a confirmed status.

### Increment 0.190.0 — validated SOP grammar overlay compiler

compileGrammarOverlay validates configured declaration families, provider bindings, graph attachments/paths, agreement roots and mappings; emits a normalized production snapshot, lexical alternatives with origin IDs, composition templates/guards and detached provenance. Knowledge1c4f32ea integration exercises broad provider families and property/value agreement. Exact source-world identity plus stamp is the freshness boundary (version alone misses schema-only edits). The request bridge and real Drawing effect remain subsequent work, not compiler coverage claims.

### Increment 0.191.0 — exact native-property reply evidence

assessPropertyChange plus std.reply.property provide the first-path reply slice: exact token expectation, same-property before/after observations, request/step/invocation correlation, explicit operation input/result membership, source-version change for changed status, and immutable retained snapshots recomputed by the claim validator. Unchanged and unconfirmed remain distinct. This supports the native field-setting claim only; semantic resolution, causal/authentic observation guarantees, visual change, broader predicate assessments and grouped/full-request claims are not implied. Both trace and reply modules must be loaded; aliases are explicit.

### Increment 0.192.0 — checked grammar-to-request bridge

readGrammarRequests accepts explicit positive property assignment readings over existing targets, preserving alternatives and exact original-source evidence. It checks exact compilation freshness, parse pruning, composition failures and lexical coverage before returning structurally validated request graphs. Terminal punctuation is consumer policy; unsupported profiles decline. Published knowledge integration uses ef0a1b27. Instance resolution, effects and reply realization remain consumer work; no end-to-end success is claimed by this bridge.

### Review 13 — accepted narrow slice and next serializer boundary

The reviewer accepted the exact-property assessment and first-path request bridge. Before adding another construction, replace its fixed semantic shape and wire template with schema-driven graph serialization: composition supplies nodes/edges using published std.request type/slot identities, the serializer preserves values and references, and inspectRequest determines graph validity. Consumer profile declarations constrain supported interpretations; source coverage and lexical provenance remain general checks.

Announce the phase-zero release only after the first path runs end to end. Its deferred list must explicitly include general predicates, grouped replies, existence assessment, semantic request revision linkage, tolerance, learning episodes and calibration-to-axis binding. Existing native-token claims do not imply these capabilities. Native point binding remains in the subsequent migration-guard step.

### Increment 0.193.0 — schema graph serialization and consumer profiles

serializeRequestGraph validates explicit literal/string/ref tokens, schema-owned types/slots, local identities, cardinality and owned/reachable graph membership before inspectRequest. readGrammarRequests consumes schema graph envelopes and derives only verified contiguous source anchors. Legacy property shape is now a compat data profile, not generic source logic. The property-name profile declares colour/shape provider labels uniformly as strings, correcting the initial literal-only rejection of multiword names. Other value families require their own explicit token semantics. Existing consumers must adopt the new profile and evidence.nodes interface deliberately. Review 14 settled the design; implementation is submitted for review without announcing broader language coverage or completed end-to-end execution.

### First-path phase-zero milestone — published and served

PSys2 b35866b5 executes the first path using library 0.192.0 (1b85af0) and knowledge ef0a1b27: declared reading, validated request, unique existing Drawing object, exact native colour mutation, independent observations, immutable property assessment and journal-backed reply. The opt-in application is served at https://ml-circuits-research.github.io/psys2/webchat/?engine=new; legacy remains default. With one existing circle on the board and English selected, try “Change the colour of the circle to purple.” Creating that circle through the new reader is not part of this milestone; prepare the board through existing controls or a saved scene first.

This is the narrow phase-zero milestone authorized by reviews 13–14, not complete language or area coverage. General predicates, grouping, existence assessment, semantic request revision linkage, tolerance, learning episodes and calibration-to-axis remain deferred. Renderer-default observations, native point migration/binding and generic frame-based language composition are subsequent work. Library 0.193.0 is separately published with generic graph serialization; the preview stays on its verified pin until explicit profile/evidence API adoption, before another construction.

### Increment 0.194.0 — direct bounded semantic template projection

projectTemplates projects indexed JSON contexts through the existing $get/$literal template and structural equality-guard semantics. It shares the evaluator with composeParses while preserving that API's exact budget tests. Global declaration validation precedes jobs; contexts are copied/validated, alternatives stay indexed, and one shared budget exposes truncation. Null context is legitimate data rather than a syntax-validation sentinel. No reader profile, frame selection, request schema or preview behavior changes. Optional knowledge frame licences at 0591f342 supply source-grounded data; a separate generic binder is still needed to consume them.

### Owner decision — retire the former application path

The owner decision relayed in PSys2 at 21:45 supersedes the historical legacy-default rollout above. The new infrastructure becomes the only application route; unsupported requests stay honest and cannot fall back to old readers. PSys2 owns route removal, host dependency audit and deletion of obsolete application code/tests. The library removes only retired consumer adapters and their fixtures/replay tests from compat/psys2, preserving reader data/provenance and current adapters. Generic library capabilities remain intact. Old measurements are historical records, not current acceptance gates.
