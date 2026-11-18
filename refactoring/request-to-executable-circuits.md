# From requests to executable circuits

Status: implementation proposal, not delivered runtime behaviour. This document complements the book's world patterns, knowledge worlds and instance worlds (§5.1), and their explicit composition (§5.3). The owner has authorized implementation. Each acceptance run below distinguishes operational coverage from remaining work.

## Outcome and ownership

A general library compiler consumes a modern `std.request` graph, relevant world declarations, live instance facts and conversational evidence. It produces a typed SOP circuit of concrete tool calls, their dependencies and their observable obligations. Concrete tools interpret these calls; they do not interpret language, choose referents, plan, or fill semantic omissions.

There are exactly two families of JavaScript:

1. **Generic library mechanisms:** graph validation, relevance and composition, hypothesis generation/ranking, constraint solving, planning, compilation, scheduling, transactional execution, observation comparison, queries and history. They cannot name an application world, editor, domain kind or example sentence.
2. **Concrete primitives and UI adapters:** render/project state, perform exact geometry or storage operations, access devices/services, and expose typed observations and results. Their public interfaces and limitations are declared. A primitive may implement a declared numerical algorithm; it cannot decide what an ambiguous human request meant.

Schemas, domain relationships, ordinary values, preferences, compatibility, construction decompositions and tool bindings belong in authored worlds. An app may assemble these declarations and register concrete functions; its assembly code must not become a third semantic engine.

A compiled circuit is executable only when every semantic choice and required argument is resolved, typed and justified, every world/instance and referent is bound, and every dependency and observable obligation is explicit. Mechanical result references are permitted: an allocator may return an ID that the generic scheduler binds into a later call. IDs need not all exist before execution. A missing geometry argument cannot remain a request for the handler to pick a pleasing layout.

## What exists and what is missing

| Mechanism | Existing evidence | Boundary still missing |
| --- | --- | --- |
| Typed request graphs | `src/contracts.mjs`, `request-contracts.mjs`, `request-serialize.mjs`: ownership, refs, source spans, selector/result separation, logic and quantifier scope | Serialization deliberately does not interpret actions or constructions. The reader's singleton raw target cannot represent every graph. |
| Rules and composition | `World`, `core.rule`, `core.use`, `core.module`; typed joins and imported declarations | Module composition does not automatically discover, activate and coordinate separate live instance worlds. Selection and activation need declared relevance and explicit runtime evidence. |
| Facts and deduction | `factsOf`, `deduceState`, `induceStyle`, `induceCorrections` in `src/reason.mjs` | `factsOf` indexes facts; `deduceState` has bounded reusable checks/inheritance. Neither is a complete modern-request planner. |
| Predicate/target evaluation | `evaluateRequestPredicates`, `resolveRequestTargets`: three-valued logic, complete populations, snapshot provenance and callback guards | Leaf meanings, canonical populations and name evidence are supplied by trusted callbacks. New targets return `requires-creation`; context and ordinals are not inferred. |
| Historical planning | `planRequest` in `src/request.mjs`: defaults by source, candidate forks, checks, ranking and explanation | Input is the old flat Request/`REQUEST_KEYS`, not `std.request`. Arbitrary owned targets, relations, logic and queries cannot be flattened without loss. |
| Tool execution/history | `toolBindings`, `runPlan`, `toolSession` in `src/tool.mjs`: declared arguments, previous-result sources, observations, rollback and undo | The tool path is useful machinery, not an existing modern graph compiler. Direct `runWorldPlan` is not an enclosing transactional batch. |

Keep these distinctions in public status. Reuse suitable lower-level mechanisms; do not rename `planRequest` and claim the modern compiler exists. Reuse generic mechanisms only through contracts that preserve the modern graph and its evidence losslessly. There is no legacy runtime fallback: do not erase graph nodes, unresolved material or provenance to make an old input shape appear compatible.

Existing capability tests include `test/core.test.mjs` (force/mass deduction with premises), `test/delegation.test.mjs` (imported draw/talk/knowledge declarations and contextual precedence), and `test/request.test.mjs` (fish placement, explicit contrary placement, capacity and correction-induced preferences). These establish particular mechanisms, not the complete proposed route.

## Public tool and circuit contract

Use the current public interfaces as the baseline, then publish missing generic schema/API contracts before consumers depend on them. The table specifies required meaning; it is not new SOP syntax.

| Contract part | Existing representation and required completion |
| --- | --- |
| Operation | `std.tool.op` has `name`, `world`, `param`, `effect`; native declarations have `id`, `params`, optional `act`, `on`. Publish a stable typed operation reference and its version/interface identity. |
| Parameters | `std.tool.param` exposes type/kind, accepted values, scale, bounds, required/default; native admission checks `type`, `required`, `nullable`, `enum`, `min`, `max`, `default`. Declare mandatory versus optional arguments and distinguish absent, null and an explicit value. Nested arrays/objects need element/property schemas, not only a generic object tag. |
| Identities and references | Distinguish literal strings from typed object/instance references and result references. Existing observations carry `instanceId`, `scope`, `version`, object `id`, `source`, `sourceType`. Bind against the observed snapshot; prohibit stale or recycled identity substitution. |
| Quantities and frames | Native operations already expose some `coordinates` metadata (dimension, unit, frame); old parameters expose scale. Publish complete units, dimensions, origin/axis and temporal-frame contracts. Normalize an extracted quantity separately from its literal source evidence. |
| Inputs and preconditions | `std.tool.bind` declares argument sources and `needs`; native `requires` lists capabilities, not a full state predicate language. Declare actual source-state predicates, expected versions and authoritative worlds. Check them immediately before committing. |
| Outputs and effects | `std.tool.bind` names makes/removes/changes; native receipts contain before/after, changed IDs, effects and data. Declare typed result slots and independently observable postconditions, including effect scope. A handler's success flag is not proof of those conditions. |
| Errors and recovery | Native admission/host returns concrete refusal reasons; tool execution supports rollback. Publish typed failure outcomes, atomicity boundaries and undo/inverse or snapshot obligations. External irreversible effects need an explicitly different transaction contract. |
| Order and time | `runPlan` already supports argument sources from earlier results. Declare dependency edges, result-slot bindings, scheduling constraints and cancellation semantics; record actual start/end, not inferred durations. Parallel execution requires proved independence. |
| Evidence | Preserve source spans for extracted content, world/declaration provenance for completion, selected alternatives and the before/after observations. Defaults are assumptions, never text-extracted values. |

Internal conceptual roles remain explicit: reader → typed graph; compiler → typed circuit plus alternatives/assumptions; executor → typed outcomes and observations; query/reply composition → claims supported by those outcomes. These are encapsulated stages, not application-facing orchestration APIs. The public boundary remains world/interface/context supply and SOP request/query compilation; this plan does not invent API names or wire spellings.

The semantic public interface is SOP Lang circuits in and executable circuits/evidence out. Queries are circuits too: their selected population, projection and dependencies are declared, not assembled by application-side JavaScript. Existing JavaScript APIs remain implementation/embedding interfaces where needed; audit their callers rather than deleting them blindly. Deprecate an application semantic-orchestration entry only when its circuit equivalent preserves behaviour, types, evidence, errors and undo. The current proliferation of application bridges, selectors and executors is evidence of the missing common compiler boundary, not a desired permanent API architecture.

The application-facing boundary stays small: supply existing world declarations, concrete tool interfaces and a versioned context of instance/conversation facts; then submit a SOP request/query circuit for compilation. The library owns the reasoning sequence. The application receives the executable circuit and its evidence, or an explicit unresolved obligation; it does not call internal deduction, target-evaluator callbacks, selector assembly or planner stages to manufacture that result. Execution uses the declared concrete interface and returns observations through the same boundary.

Current exports such as `factsOf`, `deduceState`, `resolveRequestTargets`, `evaluateRequestPredicates`, `planRequest` and `runPlan` expose useful mechanisms, but chaining them in application code is not the intended semantic public contract. Preserve them for internal use or existing embeddings until their consumers migrate with parity; do not build the new application interface around that chain. Expose only the metadata needed to correlate the supplied context, compiled circuit, calls, actual outcomes, evidence and timings; inspection observes this flow without controlling its reasoning. This paragraph defines responsibilities, not new API names.

## Migration inventory

Paths below are in the application repository `psys2`. “Remove” means remove the semantic responsibility after parity is demonstrated, not delete necessary concrete adapters.

| Current location/responsibility | Generic destination and authored declarations | Removal criterion |
| --- | --- | --- |
| `raw-structural-bridge.mjs`, `request-projection.mjs` | Typed model-output adaptation to the full request graph; declared canonical lexical bindings and ownership | No lossy flattening; coordination, multiple targets, selector/result logic and source evidence survive. Model contract limitations are reported distinctly. |
| `project-context-action.mjs`, `native-reader-context.mjs`, `native-binding-candidates.mjs`, `property-selection.mjs` | Generic contextual referent/population resolution and ranked capability binding; identity, part, selection, salience and lexical relations in worlds | Same mechanism resolves explicit IDs, labels, selected groups, parts, ordinals and corrections across varied domains without editor branches. |
| `declared-execution.mjs`, `execution-policy.mjs` | Compiler chooses operations, creates targets and completes required arguments from schemas/knowledge/policy worlds | No JS title/kind/layout/placement fallback or semantic target choice remains; complete calls have independent effect checks. |
| `new-engine.mjs`, `new-engine-areas.mjs` | General property/result compilation and typed capability interfaces | One-equality/single-target route ceases to define executable language; selectors and multi-target results use the common graph. |
| `request-composition-policy.mjs`, composition code in `src/dialog/index.mjs` | Dependency planning over explicit request/world/result references; authored compatibility and relevance | Cross-world and same-world batches share scheduling, alternatives, rollback and result binding; no conjunction-word or area-ID dispatcher. |
| `observation-query.mjs`, query/reply orchestration | Generic projection/aggregation over typed populations; declared queryable fields and output composition | Count/membership/value replies and downstream chart/document inputs share typed results and evidence, without bespoke reply heuristics. |
| `native-tool-controls.mjs`, `native-control-intent.mjs`, `native-tool-host.mjs`, domain `declared-host.mjs` | UI creates complete calls directly; common admission/transaction/observation mechanisms move to LIB where general; domain handlers stay concrete | UI and compiled text execute the same interface and agree on exact args, effects and undo. Tools consume no request graph or human text. |
| `instance-facts.mjs`, `instance-persistence.mjs`, domain `canonical-state.mjs`, undo/session paths | Authoritative domain SOP facts and refs; declared projection and history contracts; generic transaction state handling | Each migrated area reconstructs exact state from its canonical SOP authority. Derived native observations/archives are labelled and never promoted silently to authority. Audit areas individually. |

## Method choice and bounds

Three established methods inform the proposal; none alone closes the contract gap:

- **STRIPS/PDDL preconditions and effects plus partial-order planning:** extend declared operation preconditions/effects and result dependencies. This handles creation, ordering and cross-world effects, but does not itself explain language, choose salience or solve continuous layout.
- **Constraint satisfaction/optimisation:** extend typed graph constraints and world-declared spatial/temporal/property relations. This handles “near”, sizing and consistent defaults, but requires candidate referents and concrete capability contracts; it cannot invent a missing tool.
- **Generate-and-test/weighted abduction:** reuse the useful candidate-fork and source-priority principles of `planRequest`, generalised over the modern graph. This preserves competing interpretations and justified assumptions, but uncontrolled search is too expensive and the legacy flat representation loses ownership/logic.

Typed compiler lowering preserves ownership, logic and evidence while these mechanisms resolve omissions; lowering alone cannot choose them. The chosen design combines these at explicit boundaries: bounded hypotheses, declarative constraint completion, then dependency planning and typed compilation. It extends graph/predicate/resolution mechanisms and the tool executor, rather than teaching primitives semantics. Candidate/tick/depth limits are inputs to the generic mechanism; declaration relevance constrains search without clamping every request to the active editor. Preserve current complete-control behaviour while replacing each semantic app branch only after equivalent route evidence exists. A missing declaration is filled in its world; a missing general operator is implemented once with independent-domain probes.

## Implementation phases and actual acceptance

These are dependency boundaries, not a reason to pause independent bottom-up complete-control coverage. Each phase delivers working routes and tests together. No training success substitutes for execution evidence.

| Phase and dependencies | Deliverable | Real acceptance run |
| --- | --- | --- |
| A — interface baseline; independent | Public SOP circuit input/output and typed tool/call/result/observation contracts; inventory UI actions and existing JS semantic-orchestration callers | Replay complete UI calls across all five editors. Assert exact typed args, IDs, geometry, selections, effects, failures and undo; distinguish service-dependent actions. Establish exact caller-by-caller migration/deprecation criteria before removing JS APIs. |
| B — graph preservation; uses A interfaces | Modern request/query circuit input and typed intermediate circuit; source evidence, result refs and a circuit-equivalent migration route for each semantic JS caller | Reader-independent authored graphs for coordinated creation, selectors, quantifiers and queries round-trip without semantic loss. Invalid scope, unit/frame mismatch and dangling references fail explicitly. Query selection/projection is declared in SOP; application JS does not assemble its semantics. |
| C — binding and completion; depends B | Generic bounded hypothesis generation, target creation/context resolution, declaration-based defaults and constraint solving | Run fish/house and near-house cases below from different live contexts. Assert chosen hypotheses, preserved alternatives, concrete arguments, source versus completion evidence and actual effects. |
| D — execution and composition; depends A–C | Generic circuit scheduling, fresh preconditions, transactions, independent effects and query/reply composition | Execute create→use-result, modify-all-matching, calendar→aggregate→chart→document, cancellation, stale state and injected second-step failure. Assert exact committed state, reply evidence and declared undo/rollback boundary. |
| E — remove app semantics; consumes A–D | Replace responsibilities row by row; retain only assembly and concrete adapters | Replay former application routes through the common public APIs. Inspect paths for semantic fallbacks and prove the same controls/text call contract; publish remaining gaps explicitly. |
| F — generality and learning contract; depends complete routes | Varied sixth-domain declarations/adapters and model labels aligned to the executable interfaces | Add an unrelated domain with groups, quantities, relations, a query and a dependent action. Run paraphrases, omissions and corrections with no engine world-ID/kind/sentence patches. Then evaluate reader extraction separately from completion and execution. |

## Demo request-family coverage

These are target acceptance cases spanning the five editors, not claims that the current compiler already handles them. Pair each text request with the equivalent complete UI call and replay from the same observed state.

| Family and high-level request | Generic mechanism and world declarations | Concrete acceptance |
| --- | --- | --- |
| Selection — “Select the house and circle”; “select tomorrow's review”; “select the introduction”; “select the avatar's hat” | Typed populations, ownership/part relations, context and temporal selectors | Drawing/Diagram multi-selection, Calendar event, Documents chapter and Avatar part resolve to exact observed IDs; no content mutation; selection is visible. |
| Add/edit/delete — “Add a house”; “make these boxes blue”; “move the review to eleven”; “add a subchapter”; “remove that hat” | Construction/lifecycle bindings, declared properties, units, contextual referents and reversible transactions | Drawing and Diagram objects, Calendar events, Documents hierarchy and Avatar parts change only the intended facts; omitted values carry separate completion evidence; delete and undo restore exact identities/relationships. |
| Groups and layout — “Group these shapes”; “arrange this group as a tree”; “show this data as bars” | Membership/ownership, declared layout constraints and typed chart data; bounded geometric solving | Drawing grouping/ungrouping and Diagram group/chart layout preserve members and data; concrete coordinates satisfy the declared constraints before calls execute. |
| Arrow relations — “Connect the first box to the second and label the arrow Approved” | Contextual ordering, typed endpoint relations, edge construction and label binding | Diagram emits an edge with the correct source/target IDs and label; moving a node preserves endpoint ownership; undo removes the intended relation. |
| Queries — “How many red shapes are there?”; “what meetings are tomorrow?”; “what chapters does this document have?”; “what colour is the hat?” | Declared population scope/completeness, selectors, property projections, aggregation and evidence-backed reply composition | Drawing/Diagram counts, Calendar membership, Documents ordered chapters and Avatar part properties match actual observed facts; no mutation; incomplete coverage is stated rather than treated as zero. |
| Document composition — “Add a chapter called Results with two subsections”; “put this supplied text in the introduction” | Ordered decomposition, typed creation outputs and content insertion; composition capability declared where available | Documents creates the exact hierarchy/order and inserts supplied content. Text generation requires its declared provider; absence of that service cannot be passed off as successful composition. |
| Correction — “The other one”; “a little smaller”; “keep the rest”; “undo that” | Ranked conversational references, declared degree policies, preservation constraints and history | Repeat across object/part edits, event adjustments and document changes: chosen target and concrete change are explained, untouched facts remain equal, alternatives survive, undo restores the declared transaction. |
| Cross-world — “Chart meetings per day and put the chart in the report” | World relevance/compatibility, calendar query, typed result conversion, chart construction and dependent document insertion | Calendar→Diagram→Documents result references bind without JS query assembly; source versions and actual effects remain inspectable; injected downstream failure follows the declared rollback/undo boundary. |

## Concrete compiler walkthroughs

1. **“Add three fish and two houses.”** Preserve both requested kinds and counts as owned graph content; do not select a singleton global kind. Relevant world bindings determine which live instance can realise them. Expand declared constructions/counts into allocations and part relationships; solve missing size/placement under authored policy. Emit concrete calls with typed outputs and dependencies. The emitted list and grouping must reflect the chosen interpretation, with uncertainty if the text does not prescribe grouping.
2. **“Add a fish near the house.”** Bind an existing house using current instance evidence; if several fit, rank context-compatible hypotheses and choose the most plausible usable one. The house is an anchor, not an extra creation request. Declared relation/frame constraints must produce concrete geometry before the drawing primitive runs. Move or resize the house and repeat: a fixed centre coordinate or nearest string match cannot satisfy this test.
3. **“Move those nearer it; keep their colours.”** Carry explicit conversation/selection evidence, resolve plural targets and the anchor, preserve the negative obligation on colour, and declare a bounded degree adjustment. Record the chosen referents, assumptions and alternatives. Execute reversibly; the reply states the actual effect and concrete uncertainty rather than asking a clarification question by default.
4. **“Show meetings per day as a chart, then add it to the report.”** Use calendar population/query semantics, typed aggregation, chart construction/layout and document insertion capabilities. Bind intermediate outputs generically. Only activate worlds actually consulted; log those real activations. Missing declared conversions remain missing mechanisms, not JS guesses or fabricated data.

## Review

Bound candidates, deduction/solver work, graph size, plan depth and execution time; expose exhaustion distinctly from impossibility. Declarative knowledge is the simplest fix when an interface/mechanism already supports the need. Hard constraints protect actual safety/invariants; ambiguity does not reinstate a refusal-first policy. Choose a plausible usable reversible interpretation, retain alternatives and uncertainty, state what changed, and offer undo.

Review requires new-world and new-language probes, no domain IDs/sentences in generic mechanisms, independently observed effects, and explicit authority/projection boundaries. Completion and reader errors are measured separately. Acceptance is demonstrated complete routes plus declared limits, never an unsupported universal accuracy claim.

## Declaration admission and compactness

The separation work adds instance-only admission (`factsOnly`) and separately owned book/schema/knowledge sources. That guard does not certify arbitrary rule declarations. Direct probes of the existing kernel admit a closed-type pattern with an unknown key, an incompatible literal kind and an unbound conclusion variable without a schema error. General compilation must type-check patterns/templates and their bindings before accepting supplied worlds; a source that parses or imports successfully is insufficient. Preserve this as an explicit implementation gap until those probes are rejected by the runtime admission boundary, not only by documentation checks.

Compactness should first remove duplicate ownership and scalar wrappers: shared type/slot/rule declarations are imported once, ordinary properties remain direct literals, and source/version context is not repeated on every scalar. The two-dot book example adds one fact per object under one schema dependency. Whitespace removal alone reduces characters, not graph size. Inline rule expressions, implicit property navigation and unnamed nested values would change language semantics and need a separate schema/grammar design; no such syntax is introduced by this delivery.

## Implementation tasks for observations, shared geometry and soft placement

The entry case is an authored modern request with one new target, one existing anchor and an owned spatial relation. Repeat the identical circuit after manually moving the anchor. An independent reader test can later measure whether text produces that input.

| Task | Acceptance evidence |
| --- | --- |
| Project live instance geometry into a reusable 2D vocabulary. | Derive bounds in a named frame from current objects, including groups. Retain source identity, instance, revision and relation endpoints. Refresh on mutation. Two editors can use the same calculations without combining unrelated scenes or copying imported rules. |
| Declare applicability by relation and scope. | Independent peers in the same container prefer a positive clearance. A member may occupy its group. An edge endpoint meets its declared node. An attached avatar part follows its anchor. Distinguish bounding boxes from actual contours and unknown geometry from empty space. |
| Rank valid proposals by a declared objective. | Hard conditions exclude candidates. Soft violations carry a measurable cost. Prefer zero cost when available and a smaller violation under crowding. Retain alternatives, ties, exhaustion and measured evidence. A first satisfying assignment alone cannot certify an optimum. |
| Declare profile preferences and their learning evidence. | An exact edit affects the current object. An explicit scoped preference, or qualifying repeated comparable corrections under a declared policy, can affect later choices. Inspect the scope and evidence, reverse the contribution, and preserve hard requirements. |
| Compile and dispatch a concrete request from observed worlds. | Compare the same request before and after moving the anchor or occupying the preferred region. Verify the typed call, observed result and undo on the normal application route. Prevent stale geometry from authorizing a move. Show the actual worlds, participants, evaluated relation and winning cost in Worlds. |
| Test the mechanism independently of Drawing. | Change the scene, selected roles and preference while keeping the library unchanged. Include an attached pair, a crowded scene and a nonspatial candidate objective. A temporal placement test has its own interval and availability declarations. |

The initial probes establish the boundary. A hard rectangular collision rule and finite-domain search find a free coordinate. With soft=true the same collision yields a standing issue and the satisfiability solver may select the occupied coordinate even when a free coordinate exists. The native near-placement helper embeds a directional order in JS. Close these gaps through the normal compiler and declared worlds. Record the specific behaviour verified for each task before marking it complete.


## Public SOP-only boundary and migration inventory

A client loads its schema, knowledge, tool interfaces and live observations through SOP declarations and submits request wire text. The compiler returns a circuit of concrete SOP tool instructions plus inspectable evidence. A registered method may perform bounded generic computation behind a declared wire type. The same restrictions apply to an embedding in JS and to another implementation language. A native tool accepts a SOP instruction and returns observed changes as SOP. UI event collection, rendering and device access belong to concrete adapters. A semantic decision hidden inside an adapter, a sentence branch moved to LIB or an application callback that chooses a result still violates this boundary.

Use the caller inventory above as a removal checklist. Migrate and replay ordinary controls as well as spatial composition. For every migrated route, cover a real tool call, unusable or stale input, state inspection and undo. Inspect both the normal runtime route and imports to identify remaining JS orchestration. Keep the learning task independent of reader training.

### Verified library and knowledge routes

The SOP-only compile entry consumes an owned request graph and produces call wires. The regression suite exercises a rule-generated numerical call, an ordered two-step interval operation, and a rectangular placement compiled using the published spatial world. In the §1.4 fixture the call has tree geometry (540,220,60,100) and the stated colour. Moving a reference and introducing a blocker change the chosen coordinates. Returned placement options reference measured SOP facts, including a violated hard condition when the kernel returns the witness. The finite trial objective compares costs over the offered placements. It makes no optimality claim for the entire continuous canvas. A general, complete compiler for every request family in the migration table remains an open task.

Run `node --test test/placement-compiler.test.mjs test/rule-circuit.test.mjs test/objective.test.mjs` from LIB. The placement tests use the knowledge commit in `repos.pin`. The shared catalog's own tests exercise scoped clearance, hard containment and contact, plus the learning and retraction of comparable corrections. Application acceptance additionally requires the observed editor effect.

### Worlds architecture acceptance

The map has a single Tools/Interpreters layer. Distinguish each native implementation from its SOP interface, its live instance facts and the schema that validates them. Derive the legend from the same role, glyph and colour definitions that draw the nodes. When a compiler method replaces an application decision, remove the old runtime registration and its graph node together. Verify surviving native nodes against actual calls and verify that a user can follow one call from the compiler through the tool to the changed instance. Count duplicate representations separately from removed implementations.

For each editor, determine where a move or edit commits before declaring the instance authoritative. Follow the native state adapter and the source of its observations. If semantic state still lives in JS, migrate the schema, round-trip every supported edit and undo, and switch the writer and readers together. A new graph label cannot close that task. Calendar and Avatar already expose a canonical state World through their host interface. Drawing, Diagram and Documents require separate authority checks against their real edit paths.

### Tool interfaces as compiler inputs

Inventory each runtime operation across the five editors. Compare the SOP operation sources, the actual host bindings and the compiler's projected capability declarations. Record which source owns each field. Make the call schema and semantic capability authoritative in SOP. Derive compiler input and native validation from these same declarations. Preserve ordered collections, units, frames, applicability, outputs, observations, undo and concurrency guarantees.

Use the concrete multi-node placement in book §1.3 as a discriminating test. Supply two tool interfaces with identical parameter types but different declared placement effects. Verify the compiler picks the compatible effect, rejects incompatible frames before dispatch, retains a concrete reason when a required binding is missing, and checks both resulting node positions. Then add another compatible interface through SOP alone and repeat without editing library selection code. Structural schema validation alone does not close this task.
