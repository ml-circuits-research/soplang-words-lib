# The standard modules

Every `std.*` module of the library, loaded with `core.use world=std.<name>` (each is
opt-in), and the services written in JavaScript that work with them. For each: what it is
for, what it loads, its types, actions and tiers, and what it costs (the bench that
measures it). Details and examples: [reference](reference.md), [capabilities](capabilities.md).

Modules are mechanisms, not worlds (see the [glossary](glossary.md#the-three-kinds-of-worlds)). `std.schema` is how a
**world schema** is written; `std.know` and the catalog read **knowledge worlds**;
`std.acts`, `std.fill`, `std.focus`, `std.relations` and `std.turn` run a **live world**.

## Modules of SOP Lang

| Module | Purpose | Loads | Types | Actions, functions | Tiers | Cost |
| --- | --- | --- | --- | --- | --- | --- |
| `std.numbers` | average, median of a few numbers | — | — | functions `average`, `median` | — | a function call |
| `std.order` | the place of a value among others | — | — | functions `rank_in`, `nth_smallest`, `nth_largest` | — | a function call |
| `std.boxes` | geometry of boxes (x y w h, y down) | — | — | functions `centre_x`, `centre_y`, `overlaps`, `contains_box`, `box_distance` | — | a function call |
| `std.fill` | a value for a key a request left out, from offers in named tiers | — | `std.fill.need`, `.offer`, `.tier`, `.best`, `.at_rank` | rules; soft deny on a tie | `user` 1, `focus` 2, `scene` 3, `taught` 3.5, `knowledge` 4, `default` 5 | `node bench/know.mjs` (with std.know) |
| `std.dialogue` | the kind of each turn (why, correction, continuation, list, ellipsis, answer, request) from the host's cue phrases; a modal world sees a turn first | `std.focus` | `std.dialogue.cue`, `.modal` | the JS `dialogueTurn`, `focusLog` | — | a pass over the tokens of one message |
| `std.decide` | one way to choose: the criteria of each choice kind (reading, template, word, rule, fact) as data, in one order (hard, coverage, cost, specificity, prior, seed) | — | `std.decide.criterion` | the JS `choose` | — | a sort of the candidates |
| `std.focus` | what a dialogue is about after each turn; completes requests | `std.fill` | `std.focus.turn`, `.mention`, `.state`, `.last` | rules, a fluent | offers at `focus` | `node bench/focus.mjs`: 400 turns ≈ 4.5 s, one more ≈ 20 ms |
| `std.relations` | relations kept between things; rows; first; each; one per place | — | `std.relations.box`, `.at`, `.keep`, `.nth`, `.each`, `.spread`, `.pair` | actions `relations.put_all`, `relations.put_pairs` | — | `node bench/rank.mjs` (the rank it uses): 400 peers ≈ 0.4 s |
| `std.schema` | a world that does things, as data: kinds, attributes, acts, aspects, views, limits | — | `std.schema.thing`, `.world`, `.kind`, `.kinds`, `.aspect`, `.view`, `.limit`, `.count` | rules (load checks, limits) | — | part of an act's cost |
| `std.acts` | the acts, the same for every schema | `std.schema` | `std.acts.link`, `.group`, `.saved`, `.shown` | actions `make`, `remove`, `change`, `place`, `connect`, `group`, `ungroup`, `pick`, `ask`, `copy`, `send`, `save`, `load`, `undo`, `redo`, `show`, `teach`, `forget`, `complete` | — | `node bench/acts.mjs`: an act on 2,000 things ≈ 10 steps, under 10 ms |
| `std.turn` | the request pipeline as data: stages, order, providers, fallbacks | — | `std.turn.stage`, `std.turn.provider` | soft denies (advice on holes); run by `turnFlow` | — | `node bench/flow.mjs`: 30 requests, the same steps as `turn` |
| `std.know` | knowledge as a filler: usual place, size, colour; `is_a`; taught facts | `std.fill` | `std.know.taught`, `std.know.from` | rules; the tier `taught` (a `core.tier`) | offers at `knowledge` or `taught` | `node bench/know.mjs`: a make on 2,000 things ≈ 220 steps, ≈ 2 ms |

`core.use world=<module> as=<name>` loads a module under another name, as many times as
wanted (see [patterns](patterns.md), the parameterised world).

## Services in JavaScript

| Export | Purpose | Works with | Cost |
| --- | --- | --- | --- |
| `turn`, `turnFlow`, `arbitrate` | one request end to end with a graded fallback (`turn` is `turnFlow` with the default stages); the world that owns a request | `std.acts`, any action | one dry run per reading on a fork |
| `schemaCard`, `schemaExamples`, `actReply`, `schemaGrid`, `gridTests` | cards, examples, replies, the coverage grid, test files | `std.schema` | the grid runs every case on a fork |
| `createCatalog`, `bundleReader` | knowledge loaded by lookup, cached, schemas first; offline bundles | any catalog in the sop-knowledge-worlds layout | one read per path |
| `ledgerAppend`, `ledgerGroups`, `ledgerKey`, `stageOf`, `STAGES` | the failure ledger | `turn` | linear in the rows |
| `PatternIndex` | a host's sentence patterns indexed by the words they need | the host's matcher | `node bench/patterns.mjs`: 51.5 of 3,000 patterns tried per sentence |

Tools: `tools/validate.mjs`, `tools/reuse.mjs`, `tools/ledger.mjs`, `tools/build-bundle.mjs`.

## Import-evidence contracts

Added with 0.169.0: `core.use world=std.knowledge` loads the closed `std.knowledge.parent` record and its typed dependencies: `std.provenance`, `std.source` and `std.import.mapping` (module `std.import`). Each module can also be loaded independently. These are structural contracts: mandatory fields use `present=true`, unknown fields and wrong reference types are refused, and referenced evidence cannot be deleted while still used. Atomic batches may contain forward references.

| Record | Fields |
| --- | --- |
| `std.source` | Required `name`, `version`, `status` (`illustrative` or `published`); optional `license`, `url`, `digest`. |
| `std.import.mapping` | Required `name`, `version`; optional `description`, `digest`. |
| `std.provenance` | Required `source` reference, `record` literal, `mapping` reference. |
| `std.knowledge.parent` | Required `child`, `parent` atoms, `provenance` reference and `status` (`candidate`, `accepted`, `rejected`). |

A loaded candidate is not an accepted inference. The contracts do not resolve concept names, prove source truth, enforce publication licences or implement the remaining phase-zero families. The executable book example and rejection cases are in `test/import-contracts.test.mjs`. This incremental release must not be treated as the full phase-zero freeze.

## Objective records

Added with 0.170.0: `core.use world=std.objective` loads closed `std.objective` and `std.objective.term` records. Every listed field is structurally mandatory (`present=true`).

| Record | Fields |
| --- | --- |
| `std.objective` | `order=lexicographic`; `direction=minimise` or `maximise`; one or more typed `term` references. Repeated references to the same identity are deduplicated by the store. |
| `std.objective.term` | `evaluator` atom; `normalisation=declared.by.evaluator`; finite nonnegative `weight`; integer `priority` from zero through Number.MAX_SAFE_INTEGER. Equal priorities are allowed. |

A zero weight explicitly disables the contribution; it does not turn missing observations for active terms into zero costs. Distinct term identities remain distinct even if they name the same evaluator. The safe-integer priority bound prevents accidental numeric collisions in the current representation.

These schemas reject malformed records and protect referenced terms. They do not resolve evaluator names, check the referenced normalization definition, execute an optimizer or select a candidate. The actual book example and counterexamples are exercised in `test/objective-contracts.test.mjs`. Other numerical/change-policy families and the full phase-zero freeze remain pending.

## Reference sample sets

Added with 0.171.0: `core.use world=std.reference` loads closed `std.reference.set` and `std.reference.sample` records and imports the provenance contracts.

| Record | Fields |
| --- | --- |
| `std.reference.set` | Mandatory `version` literal, `property` atom, `unit` atom, and one or more typed `member` references. |
| `std.reference.sample` | Mandatory finite numeric `value` and `unit` atom; optional typed `provenance` reference. Negative and zero measurements are allowed. |

Each sample identity represents one observation. Equal values on distinct samples retain multiplicity; repeating the same member reference contributes once. The old repeated-value form lost equal observations through store deduplication and is rejected by this closed schema.

A declarative deny requires exact unit-label agreement between each set and its members, including edits to shared samples. This is not unit conversion or dimensional resolution. The optional provenance link is type-checked and protected against dangling deletion, but its absence does not prove a measured source. Version is recorded metadata: replacing a sample may change every referencing set without changing the recorded version. Immutable snapshots, calibration recomputation, median checking and normalization validity are not implemented by this structural module.

`test/reference-contracts.test.mjs` loads the exact executable reference fragment of book §12.2.1 and tests multiplicity, invalid references, missing fields, unit conflicts, transactional edits, provenance and aliases. The calibration and axis fragment remains explicitly proposed.

## Legend acts and conditions

Added with 0.172.0: `core.use world=w.legend` publishes closed `w.legend.act` and `w.legend.condition` records. This initial increment covers act declarations; the structural space/axis/unit extension is described below. Points and semantic links remain pending.

Acts require an atomic name, a change (`appear`, `disappear`, `quality`, `relation`), nonempty role names and at least one typed `after` condition reference. `before` is optional. Conditions require `kind` and an `object` role name. `exists` and `absent` prohibit other arguments; `has` requires `quality`; `holds` requires `goal`. The latter receives its concrete relation from the eventual request. Unknown keys and wrong variants are rejected.

Every condition argument must name a role of every referring act; an unrelated act cannot supply that role. Edits are checked transactionally. Orphan conditions may be stored for reuse, and role names are not limited to the example vocabulary. The contract validates declarations, not request binding, planning, observed effects or closed-world absence.

## Legend spaces, axes and units

Added with 0.173.0: `w.legend` also exports closed `w.legend.space`, `w.legend.axis` and `w.legend.unit` records. Spaces require `name`, `version` and `form=axes|graph`. Axes require a typed `of` space, `name`, safe nonnegative integer `order`, explicit `kind=linear|angle` and a typed canonical `unit`. Names and orders are unique per space; gaps in order are valid. Axis and unit declaration types are shared across namespaces, so uniqueness cannot be bypassed by declaring a second member in another namespace. Distinct owner identities still permit the same public vocabulary. Graph spaces reject numerical axes.

Canonical units must reference their own axis, with factor one and offset zero. Alternative units require finite positive `factor` and finite signed `offset`; their declaration means `canonical = factor * value + offset`. Unit names are unique per axis. Forward axis/unit references load in one atomic batch.

Optional bounds must satisfy min < max when both exist; weights and normalization lengths are positive. Circular axes require an explicit positive `period`; linear axes forbid it. `scale` and `step` occur together: ratio step > 1, interval step > 0, with direction selecting multiplication/division or addition/subtraction in the future evaluator. Finite scalar parsing and reference checks apply throughout.

This validates declarations only. Frame transformations, point values, region coordinates, metric evaluation, unit conversion and semantic name resolution remain pending. Space version is metadata, not enforced immutability. Empty spaces can be declared before their axes; that does not make them complete point schemas.

## Legend concepts, degrees, relations and roles

Added with 0.174.0: `w.legend` exports closed, shared concept/degree/relation/role declarations. Concepts require an atomic name, with optional group label, explanatory question and typed singleton `specialises` parent. Declarative transitive ancestry rejects specialization cycles, including cycles across namespaces and after edits; derived ancestry retracts with its premises. The helper `w.legend.ancestor` is transient implementation data, not an asserted semantic-link API. Materializing closure can require quadratic space in the number of concepts and consumes the existing reasoning budget.

Degree records require a word, direction up/down and finite positive factor. This does not choose an application/calibration rule; factors below or equal to one remain structurally allowed. Relations require a name; space, inverse relation and test-function name are optional. Symmetric self-inverses and one-sided declarations are allowed, but two declared inverses must agree and cannot declare different spaces. Function registration, signatures and truth evaluation are not validated by a name.

Roles require name and a reference to an act or relation, using the existing reference union (`kind=ref type=w.legend.act type=w.legend.relation`). Role names are unique per owner across namespaces. An act-owned role record must occur in that act's role list; standalone relation roles need no additional owner list. Referenced owners cannot be deleted. These records do not yet resolve core.type/core.slot semantic annotations or requests.

## Resolved legend schema annotations

Added with 0.175.0: loading w.legend registers generic core.schema.link descriptors for core.type is, core.slot means (concepts), and core.slot space (spaces). Present annotations resolve strictly by explicit reference or unquoted globally unique public name. Final transactional checks allow forward declarations and reject target deletion, rename and newly ambiguous names. `semanticLinks()` exposes authored values and resolved identities without a cache.

Legacy schemas may omit annotations. Mandatory means, semantic refinements, point typing, inferred questions/defaults and behavior are not implemented. Existing ask/enum/default remain. Conflicting duplicate type/slot annotations cannot be silently dropped; intersect requires identical annotations, while explicit slot override chooses a declaration. Every authored link is validated, including overridden declarations. Module aliases preserve declared target types. The generic descriptor is usable with other annotation/target vocabularies without a legend-specific runtime branch.

## Request source, mode and targets

Added with 0.176.0: `core.use world=std.request` exports closed std.request.source, std.request and std.request.target records. Sources require text; requests require an atomic act name, explicit mood=do|propose|check|ask and a typed source reference. Targets require a typed request, mode=new|existing and an atomic kind name; optional name and determiner=definite|indefinite describe the target.

Mood has no default and grants no execution authority. Act/kind names are not resolved to capabilities or concepts by this increment. Sources may be reused. Referenced requests/sources cannot be deleted; forward references and edits are transactional. The executable book fixture covers this foundation only.

This initial foundation did not export constraint/logical/value schemas, root edges or bound targets; the graph extension below adds their structural contracts. Unknown fact types remain governed by the library's existing open-world behavior; their acceptance is not proof of a request contract. Consumers must use published exports and must not infer that full graph validation or phase zero is complete.

## Final-state contract validation

Added with 0.177.0: core.validate provides a generic hook for invariants that read multiple records. It runs registered synchronous pure boolean callbacks after ingestion, without cached results or a dependency on the parent being touched. This is a prerequisite for request topology and frame consistency, not their implementation. See the reference for strict signatures, failure behavior, cooperative budget ticks and trusted-host purity limits.

## Structural request graphs

Added with 0.178.0: std.request exports constraint, not, group, quant and value records, plus root links and bound targets. Every logical node/constraint has a typed request owner. Edges, target references, root and value-description dependencies must stay within that owner. Explicit graphs reject cycles and every unreachable node; logical nodes require a root. Rootless simple constraints form an implicit conjunction. Groups are nonempty.

Each bound target has one quantifier, distinct from its collection. A topological scope intersection checks all incoming DAG paths, allowing valid nested use but rejecting scope escape through shared nodes. Literal/operator variants require their fields and reject unrelated fields; same requires a typed value-description reference, occurred a boolean/result phase, delta a finite number, factor a positive number, and measured relations all four measurement fields. Source spans use nonempty Unicode scalar intervals into a declared exact source; unpaired surrogates are refused.

`inspectRequest(world, id, {family?, budget?})` supplements loaded schemas and World.check with detailed graph issues. It requires the request contract module. The standard validator uses core.validate and runs on final state, including child edits; aliases and root subtypes preserve family identity. Generic module loading now registers aliased function names transactionally.

Vocabulary names, eq/comparison value typing and orderability, dimensional unit compatibility, source-evidence truth, assumption justification, three-valued evaluation, effects and permission remain separate. For example an atom NaN as an eq value is structurally a literal, not proof of a valid numerical quantity. No complete phase-zero or runnable-domain release is claimed.

## Change-policy declarations

Added with 0.179.0, `core.use world=std.change` publishes `std.change.policy`. Each closed record requires four unquoted vocabulary names: `kind`, `concept`, `anchor`, and `unit`. These identify the applicable kind/property, the part held fixed, and the quantity unit. Quoted prose, references, missing fields, unknown keys and conflicting singleton values are rejected. The exact book §4.4.4 fixture is tested.

This contract stores declarations only. Names are not yet resolved against the legend; compatible units, inherited policies, explicit-request precedence and ambiguous alternatives require the future selector/evaluator. Multiple records for one kind/concept remain distinct data; their successful loading is not evidence that selection would succeed. There is no default anchor, arithmetic, interval update or effect execution.

## Historical trace inputs

Added with 0.180.0, `core.use world=std.trace` exports only `std.trace.request` and `std.trace.input`. A request stores its required `message` string. An input requires historical `source` and `version` strings, `source.type` and `key` atoms, and `values` as a JSON array of canonical SOP value-token strings. The source identity is provenance, not a live reference.

The array preserves duplicates, order and token categories. Numeric `12`, quoted text `"12"`, historical reference `$old` and quoted text `"$old"` remain distinct. Historical reference targets need not exist in the current world. An empty array records an observed slot without values; it does not assert that an entire world or query scope is closed. The snapshot does not resolve its source schema or prove the truth of the observation.

A final-state validator parses each token with the language parser and requires exactly one concrete canonical value. It rejects variables (including `$?x`), non-string JSON elements, additional keys/wires, comments appended to a token and noncanonical string escapes. Canonical refers to quoted-string spelling, not numeric normalization: `01` and `1` retain their source tokens. Payload traversal consumes validation budget; existing JSON size/depth limits also apply. Invalid edits roll back.

The 0.180.0 foundation does not establish a structured-request link, generate evidence, make records append-only, or save a journal. A stored `message` is not execution authorization. The 0.181.0 extension below supplies structural operation records; evidence verification and persistence remain separate obligations.

### Trace operation linkage

Added with 0.181.0, the same `std.trace` module also exports these closed records:

| Type | Required fields | Optional repeated links or vocabulary |
| --- | --- | --- |
| `std.trace.step` | `request` reference, `operation`, `operation.version`, `invocation` strings, `status` atom | `act` atom; `input` and `result` input references; `depends` step references |
| `std.trace.observation` | `step` reference, `invocation` string, `phase=before/after`, nonempty `input` references | None |
| `std.trace.reply` | `request` reference, `text` string | `step` references |
| `std.trace.undo` | Original `target` step, distinct `execution` step | `observation` references belonging to the execution step |
| `std.trace.correction` | Original `target` step, distinct `replacement` step | None |

Step status is `planned`, `confirmed`, `refused`, `unknown` or `partial`: it records an asserted individual-call status, not the final outcome of a multi-operation request. Planned steps reserve an invocation identifier; the record does not launch a call. Observation invocation text must match its explicit owning step. Input records carry individual source versions; independent sources need not share a revision counter. Invocation strings do not establish a global identity registry or deduplicate calls.

Final-state checks reject dependency cycles, even across requests, and validate reply membership against the reply's request. A clarification reply may have no steps. Correction links describe an accepted replacement lineage rather than proposed alternatives: no self-links, cycles or multiple direct successors for one target. A correction may be a new request about an old step. Undo observations belong to the new undo execution, not the original invocation. The execution step carries the undo attempt's status; the undo link adds no redundant status field.

The validator scans the module family's records for each trace request under the reasoning budget, including when only a child changes. No persisted or incremental graph cache is claimed. These checks do not prove that a snapshot was actually observed, that `confirmed` means the requested effect occurred, that a reply is supported, or that an undo restored state. They do not verify the temporal/concurrency preconditions for accepting a correction, impose immutable history, or perform execution. The exact §6.11 fragment loads; its example success text still requires the omitted geometric/effect evidence before an application may emit it.

### Detached reference calibration

Added with 0.182.0, `calibrateReference(world, id, options?)` captures a reference set into detached, deeply frozen JSON-serializable data and computes its positive median. Samples retain identities, multiplicity, original numeric tokens and units. Optional provenance includes its complete factual dependency closure. The source may change afterward without altering an existing snapshot. This is a calculation over captured input, not a claim that source observations are true.

The API checks the world and charges validation/capture/sort work to the reasoning budget. It avoids midpoint overflow for extreme finite samples and preserves subnormal equal samples. It refuses a nonpositive normalization. Its result does not freeze source records or register immutable published revisions, and loading JSON back does not authenticate it. Axis calibration linkage, the std.calibration wire contract and retained revision verification remain pending.
