# SOP Worlds: Theory

*SOP Worlds: the architectural and semantic contract. Examples use English identifiers and declared SOP Lang schemas.*

---

# 1. From a human request to concrete tool calls

## 1.1 The problem SOP Worlds addresses

A request states a desired result, but often leaves the means and some details unspecified. To carry it out, a system must identify the relevant objects, understand their current state, supply justified missing information, respect constraints and determine which concrete operations can produce the result. The same problem occurs in scheduling, document processing, graphical composition and many other domains. A question requires the same discipline: identify its subjects, derive or observe the requested information, and distinguish a justified answer from a guess.

Writing a separate handler for every sentence, domain and combination of actions makes this process difficult to extend and explain. The knowledge used to select an object or complete a value becomes scattered through code. Adding another domain repeats the machinery; explaining a decision requires reconstructing the program's control flow.

**SOP Worlds represents the objects, meanings, constraints and available capabilities as connected worlds expressed in SOP Lang. A general library uses those declarations to compile a request into a concrete circuit of tool calls, or to derive an evidence-backed answer.** A new domain contributes its declarations and concrete capabilities. It does not require another sentence dispatcher or another domain-specific planner inside the application.

The distinction between a request and a call is fundamental. A request can leave a target, value or method unresolved. An executable call identifies a declared operation and supplies its required typed arguments, directly or through typed results of preceding calls. A plan is the concrete circuit of such calls, with its dependencies and dataflow. A tool consumes its own instruction; it does not interpret the overall plan or decide what the request meant.

**The two public inputs are SOP Lang.** An application supplies the library with declarations of the available worlds, observations and tool interfaces, then submits request wires. The library returns concrete call wires. Each tool reads its own call wires and exposes its observed result as wires. For example, a request can identify a new object and its relation to an existing one while leaving the coordinates open. The corresponding placement instruction specifies an object identity or construction, coordinates and a coordinate frame supplied by its interface. A client can test this whole contract by submitting the request wires directly.

Executable code belongs in the general library and in concrete tools. A library-defined wire type can invoke a registered operation with declared inputs, output and semantics. For example, a rectangular intersection check takes two rectangles in the same frame and returns a Boolean. The rule that applies the check binds those rectangles from observed facts and states which pairs it concerns. A shared container, a parent and child, and the endpoint and node of an edge describe different relationships. Adding another editor changes the observations and relationship declarations that participate. The computation stays reusable. The text of a request or an ordinary instance fact cannot introduce executable code.

Natural language is one way to produce a request circuit. A reader preserves what the words express: targets, quantities, relations, conditions, negation, coordination and uncertainty. State-dependent interpretation belongs to the library and its worlds. A structured client can submit the same request representation without using a language reader. A client that already has complete instructions can submit concrete calls through the declared tool interface.

Consider two red objects, a house and a fish. The fish is in focus. A person says “make it blue,” then “no, the other one.” Both turns use the same observed identities. On the first turn a focus preference ranks the fish first. On the correction a hard criterion excludes the fish. The house is the remaining candidate. The correction carries the earlier colour requirement, restores the fish's previous colour and applies blue to the house. Undoing the correction restores the state immediately before it: a red house and a blue fish. The comparison, the resulting tool call and the observed colours answer three different questions about the turn.

A `std.choice.request` names the policy and refers to the options. Each option supplies the measurements named by the policy's `std.decide.criterion` declarations. In this example the measurements include whether the object is in focus and its order among observed objects. The compiler's result identifies the winner and records which criterion excluded an option or ranked it lower. Changing a declared preference changes the choice over exactly the same observations. A tool can then receive the concrete object and colour without knowing the conversation that selected them.

This book explains the representations and general mechanisms that make this separation possible: world composition, rule matching, reference resolution, constraint completion, hypothesis ranking, compilation and verification of effects. Its central test of generality is whether new declarations can express a new problem without adding a special semantic branch to application code.

In the JavaScript implementation, responsibilities fall into two families. The distinction between general mechanisms and concrete capabilities also applies to implementations in other languages:

| Family | Responsibility | What belongs in SOP worlds instead |
|---|---|---|
| Generic SOPWorlds LIB mechanisms | Load and validate worlds; match rules; bind references; generate and rank hypotheses; solve declared constraints; build and schedule call circuits; observe effects and retain evidence/history. A reader adapter preserves typed model output. | Domain meanings, preferences, concept/property mappings, relevance, defaults, operation applicability and semantic decompositions. |
| Concrete tools and adapters | Perform a declared state change, computation or external interaction, such as rendering geometry, storing an event, measuring a distance or accessing storage. | Selecting the intended referent, interpreting qualitative requirements or choosing a domain-specific completion policy. |

Application assembly connects worlds, interfaces and clients. Moving a sentence-specific branch into the library, or naming a JS handler from a SOP declaration, does not make it a general mechanism. A reusable numerical solver is legitimate native code; a handler that silently chooses an intended object or a domain-specific default hides a semantic decision.

## 1.2 What a world contributes

A **schema world** declares allowed fact types, keys, value domains, references and invariants. A **knowledge world** declares reusable meanings, rules, constructions, preferences and completion constraints. An **instance world** records concrete objects and their current relationships. A project world connects instances to the schemas, knowledge and capabilities they use. Importing knowledge shares its declarations; it does not copy every knowledge fact into every instance.

An architecture map can expose the distinction by tracing a single move. The tool interface declares the move instruction. Its interpreter consumes that instruction. The instance owns the object's position after the move. If the editor owns the position in a native data structure and generates SOP observations on demand, the map must identify that editor as the authority and label the SOP facts as observations. When tools commit directly to the SOP instance, the authority changes. A native array used while painting the scene belongs in the renderer's details. Its presence does not establish another world or interpreter.

For a geometric example, these roles answer different questions. A schema can require a finite width; knowledge can define a normal width range for a concept; an instance can show that the currently selected object is already 80 units wide. A request for “twice as wide” uses the instance value and produces 160. A request for “width 120” uses the explicit value. The geometric tool receives the resulting width; interpreting “twice” and choosing a normal width are upstream decisions.

A rule has named premises and a conclusion; matching binds variables to actual facts. Constraints reject or score candidate completions. A method decomposes an abstract result into subgoals and concrete capabilities. The library processes these declarations with general operators. A new domain supplies declarations and concrete adapters; it does not add verb or domain-ID branches to the engine.

## 1.3 The executable boundary

A circuit is ready for dispatch when every required semantic choice has been made: operation, compatible destination instance, targets, values, units, coordinate/time frames and dependencies. Arguments are either validated concrete values/references or typed references to outputs of earlier calls. A newly created object's identifier need not exist before its creation call returns. Binding that result to the next call is mechanical scheduling, not unfinished interpretation.

Each tool interface must state:

- which operation wires it accepts, and each argument's type, required/optional status and absence semantics;
- object/instance identity, units and frames, applicable state/version preconditions;
- typed outputs, observable postconditions, failure outcomes and undo/rollback obligations;
- dependencies and the result slots later calls may consume.

A tool author supplies the compiler with two related declarations. The **call schema** names an instruction and defines which concrete wires the interpreter accepts. The **capability declaration** connects that instruction to its semantic effect, names the input and output roles, and states the conditions under which the effect can be obtained. Both declarations belong to the tool interface and are available before the compiler chooses a tool. The interpreter and compiler use the same call schema. An implementation-specific dispatch table can associate the instruction type with its native handler.

Consider moving a selection of diagram nodes. The interface for a placement instruction must say whether its coordinates locate a bounding-box corner, a centre or another reference point. In the tutorial's Diagram tool, the coordinates locate the arithmetic mean of the selected node centres in canvas coordinates. Each selected node receives the same displacement. Given centres at (20,40) and (60,40), a requested selection centre of (100,80) therefore yields centres at (80,80) and (120,80). A tool that places every node individually at (100,80) would accept the same numbers and produce a different effect. Parameter types alone cannot distinguish these instructions.

To compile that request, LIB matches the desired effect against declared capabilities, binds the selection to live object identities, and supplies the coordinates in the declared frame. It checks the resulting wire against the input schema before dispatch. The tool returns observed object identities and positions; those observations let LIB check that the selection reached the requested centre and retained its offsets. A new tool that declares the same effect in another frame also needs a declared frame conversion before it can satisfy this request.

A colour change on the red circle illustrates the boundary between a compilation result and the tool input. The capability result retains the comparison of the red circle and the other observed circles, the chosen operation and the evidence that justified it. The selected `std.capability.call` owns typed arguments for the matching object identity and the replacement colour. Its reachable argument wires form the invocation SOP. The dispatch guard checks the observed instance, version and object source before the interpreter acts. A separate observation checks the resulting colour on the same object.

A tool may reject an invalid or stale call. It may not repair one by guessing an object, colour, size or layout. Semantic completion belongs before this boundary. A client action that already supplies a complete call uses the same validation, dispatch and observation path without another language-reading step. An editor gesture is one example of such a client action.

The application-facing boundary has two responsibilities: provide existing worlds, tool interfaces and context; submit SOP request/query circuits for compilation. Resolution, completion, ranking and planning are encapsulated within LIB. High-level explanations of these algorithms do not create additional public APIs.

This book states the architectural and semantic contract. Implementation gaps and the concrete replacement sequence belong in the separate [request-to-circuit migration plan](../refactoring/request-to-executable-circuits.md). Syntax examples must use declared schemas; an explanatory table is not an undeclared SOP interface.

## 1.4 Tutorial example: a complete, checkable request

As a tutorial example, consider a deliberately small drawing exercise. The geometry and policies below illustrate the general compilation mechanism; they do not define SOP Worlds or prescribe defaults for other domains. The drawing schema declares objects with an ID, concept, finite `x`, `y`, `width`, `height` and colour. The instance contains a house `h1` occupying the rectangle from `(400,200)` to `(520,320)`. Coordinates use a top-left origin, x increasing rightward and y downward; object positions name their top-left corner. Knowledge for this exercise assigns a tree a 60-by-100 extent and the default colour `#228B22`. Its declared “near” policy places a new object 20 units to the right of its anchor and aligns their bottom edges. The scene is 800 by 600 units and that region is empty. These are explicit example premises, not universal meanings of “tree” or “near”.

The person writes **“draw a tree near the house”**.

| Stage | Exact input and result |
|---|---|
| Read | Create one tree; “the house” is an existing anchor of the near relation. No second creation request, coordinates or size are extracted. |
| Bind | Match the house description against the live instance; retain `h1` and its observed version. Other matching houses, if present, remain ranked alternatives. |
| Complete | Read the declared tree extent and near policy. Compute `x = 520 + 20 = 540`, `y = 320 - 100 = 220`, width 60, height 100. |
| Validate | The resulting rectangle ends at `(600,320)`, stays in the scene and intersects no occupied region. Recheck `h1`'s observed version before mutation. |
| Compile | Produce a creation call with concept tree, position `(540,220)`, extent `(60,100)` and colour `#228B22`. Its output reference supplies the new object's identity to later calls. No argument still says “near”. |
| Dispatch | The generic dispatcher invokes the registered creation primitive with those concrete arguments. The primitive creates exactly that object and returns its ID. |
| Observe | Read the new object from the authoritative instance and verify concept, geometry and colour. A success flag alone does not prove the visible effect. |
| Reply | State that a tree was added near `h1`; disclose the chosen anchor or other uncertain completion when relevant. Retain alternatives and undo for correction. |

For **“draw a tree and a house”**, both nouns are new targets of the shared creation act. For **“draw a tree near a house”**, the house belongs to a relation and its mode must remain part of the reading; the library ranks compatible interpretations against the instance and declared policies. Splitting text at “and”, or treating every noun as a creation, loses the distinction. The reader must preserve ownership and relation roles before completion begins.

For **“make it bigger”**, bind “it” from the conversation/selection evidence, read its current extent and the declared comparative step, then emit concrete resize arguments. For **“no, the other one”**, revise the selected hypothesis using the retained alternatives and undo or correct the earlier effect. The default under ordinary uncertainty is the most plausible usable reversible interpretation with a brief uncertainty note, not a clarification question. Hard constraints still apply; an unresolved hard precondition is never reported as a successful effect.

## 1.5 The library, shared worlds and tutorial application

The theory distinguishes the general mechanism from the declarations it processes and the application used to demonstrate it:

- [SOPWorlds LIB — soplang-words-lib](https://github.com/ml-circuits-research/soplang-words-lib) contains the SOP Lang library and this book. Its mechanisms operate on supplied worlds and capability contracts.
- [Shared schema and knowledge worlds — sop-knowledge-worlds](https://github.com/ml-circuits-research/sop-knowledge-worlds) contains reusable declarations that applications can import. A published knowledge world is not an application instance or a copy of the library.
- [PSys2 — tutorial and demonstration application](https://github.com/ml-circuits-research/psys2) connects worlds to concrete tools and a user interface. Its Drawing, Diagram (including charts), Documents, Calendar and Avatar editors supply the recurring tutorial examples. SOP-BERT is the reader used by this demonstration; the general request boundary does not require a particular model.

Chapter 7 groups examples by these tutorial areas. Elsewhere, a house, a meeting or a document illustrates a named mechanism; its particular geometry, scheduling policy or composition rule is part of that example's premises. The general claims concern how the mechanism uses declared premises, not which objects every application must contain. The same separation applies to interface gestures: sharing a tool contract between text commands and direct manipulation is a useful demonstration, not a requirement that every SOP Worlds application have graphical tabs.

---

# 2. The SOP Lang language

This chapter defines declaration syntax, values, identity and visibility. Compact literal values stay on their owning facts; separate facts are used when something needs identity, references, rules or independent provenance.

## 2.1 Declaration syntax

SOP Lang text is a sequence of declarations. A declaration is called a **wire**. Each wire has three parts in this order:

```text
@identifier  type  key=value  key=value  ...
```

The **identifier**, written after `@`, names the wire so that other wires can refer to it. An identifier can be declared only once in a text.

The **type** names the kind of declaration. It determines which keys the wire accepts and how the library interprets it.

The **key/value pairs** carry its content. A key names a piece of information; its value supplies that information. There is no space around `=`. Repeating a key supplies several values in their written order.

A wire ends when the next declaration starts; it can span several lines. The declaration syntax has no enclosing braces or nested wires. This compact syntax is deliberate. Give a part a separate fact when it needs identity, references or its own provenance. Ordinary scalar properties stay directly on their owner; a pair of coordinates does not require two value objects.

The following teaching example has two separately owned Worlds. The schema is a reusable module; the instance imports it and owns only its current objects. Supplying the module to a loader makes it available; the instance’s `core.use` declares the actual dependency:

**Schema World — `fish/schema.sop`.**

<!-- sop-world id=fish.schema role=schema module=example -->
```sop
@t.pond core.type of=example.pond closed=true
@t.fish core.type of=example.fish closed=true
@s.fish.size core.slot of=example.fish key=size kind=number present=true
@s.fish.x core.slot of=example.fish key=x kind=number present=true
@s.fish.y core.slot of=example.fish key=y kind=number present=true
@s.fish.in core.slot of=example.fish key=in type=example.pond present=true
@book.fish.schema.module core.module name=example
```

**Instance World — `fish/instance.sop`.**

<!-- sop-world id=fish.instance role=instance uses=fish.schema -->
```sop
@pond1 example.pond
@f1 example.fish size=1.6 x=120 y=540 in=$pond1
@book.use.fish.instance.example core.use world=example prefix=false
```

`f1` identifies the fish. Its type is `example.fish`; `size`, `x` and `y` are numeric values, while `in` is a typed reference to `pond1`. The imported schema makes the distinction explicit. The `example` prefix marks teaching types, not published drawing-tool operations. The instance does not own or persist the imported type and slot declarations.

## 2.2 Lexical categories and values

Lexical analysis divides text into tokens. A value belongs to one of the categories below. Its lexical category is not yet its semantic type: `10:30` is an atom whose slot can require interpretation as a clock time.

| Category | Notation and meaning |
|---|---|
| atom | A token without spaces that does not begin with `$`, `?`, `@` or `#`: `fish`, `1.6`, `120,540`, `10:30`, `5kg`. Numbers, quantities, times and names are atoms at this level; the schema determines their meaning (section 3.2). |
| string | Quoted text such as `"Review"`; it can contain spaces. |
| reference | `$` followed by a wire identifier, such as `$pond1`: the wire with that identity. |
| variable | `?` followed by a name, such as `?n`: a value to bind during matching. Variables occur in rules and queries, not ordinary facts (section 3.4). |

For example, `label="Review"` supplies text, `source=$m1` supplies a reference, and `label=?text` binds a variable during matching. `"$m1"` remains text: quotation prevents reference interpretation. Changing the category changes the declaration's meaning even when the enclosed letters are identical.

### 2.2.1 Compound values and order

A position can be represented by two numeric slots on its owning object. There is no reason to give each coordinate a separate identity when it is only a value. The schema World declares the allowed values; a separate instance World imports it and supplies their concrete values:

**Schema World — `dot/schema.sop`.**

<!-- sop-world id=dot.schema role=schema module=example -->
```sop
@t.example.dot core.type of=example.dot closed=true
@s.example.dot.x core.slot of=example.dot key=x kind=number present=true
@s.example.dot.y core.slot of=example.dot key=y kind=number present=true
@book.dot.schema.module core.module name=example
```

**Instance World — `dot/instance.sop`.**

<!-- sop-world id=dot.instance role=instance uses=dot.schema -->
```sop
@dot example.dot x=120 y=540
@book.use.dot.instance.example core.use world=example prefix=false
```

`x=120` and `y=540` are typed values on `dot`, not objects called `state.value.1` and `state.value.2`. A request to move the dot up changes `y` according to the declared coordinate frame and retains `x`. A missing mandatory coordinate is invalid; a number is not itself a position unless the relevant schema says which axis it represents. *(R1–R4)*

Repeated values preserve order. A document's paragraph references therefore retain their sequence. If a domain treats participants as a set, its declared collection semantics must specify duplicate reduction and order-independent comparison; a repeated key alone does not assert set semantics. *(R5)*

### 2.2.2 Choosing a representation

Use scalar slots for independently typed coordinates. Use a typed referenced fact for an independently named point, reusable geometry or a measurement with its own source/history. Both choices keep the semantic structure available to rules. A point fact needs a declared type, slots and reference type; naming it `point.value` does not create a schema automatically.

`kind=json` accepts structured native values, but an opaque implementation object must not stand in for inspectable world structure. If JSON is used at an adapter boundary, its schema and conversion into domain facts must be explicit. A generic JSON tag does not establish coordinate axes, units or equality between values in different frames. Domain reasoning uses the declared facts, not private JS object fields.

### 2.2.3 Compact declarations without hidden meaning

The dot example needs three structural declarations because it introduces a type and two numeric properties. Those declarations belong to the shared schema once. Adding another dot to an instance adds another fact; it does not repeat the schema or allocate objects for the two numbers:

**Instance World — `dot/two-objects.sop`.** It reuses the schema from section 2.2.1.

<!-- sop-world id=two-dots.instance role=instance uses=dot.schema -->
```sop
@two-dots.schema core.use world=example prefix=false
@dot1 example.dot x=120 y=540
@dot2 example.dot x=160 y=540
```

The one import establishes the dependency for the whole instance. Each dot is one wire with two direct values. Moving `dot2` changes its values; no coordinate-value facts need to be rebuilt. A numeric value becomes a separately identified fact only when that identity serves a declared relationship, independent evidence or lifecycle.

The same approach applies to rules. A reusable rule is declared once in its owning schema or knowledge World and imported by instances. Its patterns and templates describe a method; repeating them in every command would increase size and obscure ownership. A concrete command already containing all arguments can remain one instruction wire under its declared tool schema. Source observations, confidence or history are separate linked records when needed, rather than copied text on every scalar.

Shorter text is not always a smaller model. Writing several wires on one physical line saves line breaks but changes no structure. Replacing a typed reference with a string can lose identity. Placing an opaque expression in a value can hide undeclared computation. Abbreviating a type requires a declared naming/import convention; a convenient spelling cannot silently acquire field access or inference semantics.

This book therefore uses compact literal properties, shared imported definitions and references to independently meaningful entities. It retains separate pattern, calculation, check and conclusion declarations where they identify different roles. Section 3.7.1 shows why those roles cannot be collapsed merely by removing lines: a calculation produces a value, a check tests a binding, and a rule decides which conclusion is justified.

## 2.3 Syntax markers and references

**Syntax** determines which character sequences form declarations. **Semantics** determines what a declaration means and how it affects a world. `@n1 node` can be syntactically correct before the properties of `node` are known. A missing required slot is a semantic completeness issue, not a mistyped character.

The lexer recognises the following markers. They distinguish identity declaration, reference, variable binding and comment. They do not execute actions by themselves.

| Marker | Meaning and position |
|---|---|
| `@` | Introduces a wire at the start of a declaration. |
| `$` | Refers to a wire by identifier; appears at the start of a value. |
| `?` | Introduces a variable at the start of a value in a rule or query. |
| `#` | Starts a comment extending to the end of the line. |

A dot is part of a name, not a field-access operator. `$p.m1` refers to the whole wire whose identifier is `p.m1`; it does not read field `m1` from `p`. A variable such as `?person` is a different syntactic category. In a pattern fragment `meeting people=?person start=?start`, matching binds `?person` and `?start` to those named attribute values. Referring to the pattern as `$p.m1` inside its rule identifies the entire matched fact. Ordinary dot-containing keys and specialised JSON-path contracts must not be confused with automatic `$object.field` navigation.

Context determines a reference's target. In a fact, `$x` denotes a fact. In `when=$p.node`, it names a declared pattern; within the rule's associated conditions it can denote the fact matched by that pattern. Section 3.5 follows these uses in one example. `::` can occur inside an identifier; section 2.6 explains its namespace role.

## 2.4 Identifiers, type names and qualification

Identifiers, types and keys are names. Names use letters, digits, hyphens and dot-separated components. `f1`, `fish`, `core.type` and `s.drawn.at` are examples.

The authoring convention for new SOP names is lowercase with dots between words: `gap.observation`, `source.snapshot`, `point.value`. It applies to authored identifiers, types and keys, including their uses in references and `of`, `kind` or `type`. This is an authoring convention, not automatic case conversion during loading. Imported names and persistent identifiers retain their spelling or receive an explicit mapping. Text values and labels can contain capitals.

**A dot does not itself give a name meaning.** `core.type` is a single name, just as `fish` is. Prefix conventions help readers identify the defining vocabulary:

| Prefix | Vocabulary |
|---|---|
| `core.` | The language's schema primitives (chapter 3). |
| `std.` | Standard library modules, including request and tool contracts. |
| `w.legend.` | The legend world's general conceptual vocabulary (chapter 4). |
| `k.` | Published knowledge (section 5.1). |
| `w.` | A published schema for a family of worlds (section 5.1). |
| none | A type local to its world, such as a tutorial's `fish`, `node` or `meeting`. |

**A type name is not a wire identifier.** Write it without `$` wherever a type is expected: as a wire's second token (`@f1 fish`) or as the value of a type-valued key (`of=fish`, `extends=fish`, `type=fish`). A declaration such as `@f1 fish size=1.6` can be admitted without a prior type declaration in an open world. Declaring the type adds constraints and relationships (section 3.1); the spelling of its name does not create them.

### 2.4.1 Identity, references and fact lifecycle

Identity recognises the same object after its label, location or storage file changes. A label helps a reader; a reference connects facts. In a tutorial example, renaming a meeting from “Review” to “Planning” must not make a diagram node point to a different meeting.

Persistent identity, reference resolution and target existence are distinct concerns. A well-formed identifier can still name no available fact.

A fact's persistent identity pairs the instance's immutable identity with the fact's local identifier. A world label, module name or filesystem path is not that identity. A loader can derive an initial readable alias from a path, but retains the instance identity separately. A readable namespace such as `calendar` resolves through the project context. Persistent references retain the identity pair, not merely the alias text. Renaming the alias to `agenda` changes presentation without changing the stored target. Importing old text containing `$calendar::m1` requires a declared alias or explicit mapping; it cannot guess a new name. Moving files preserves identities, while making an independent copy remaps identities and internal references together. Section 2.6 distinguishes persistent identity from readable prefixes. *(R6)*

In a fact, `$x` resolves locally in the instance context. A qualified `$calendar::m1` can denote a fact in another instance under the composition contract. In a rule, `when=$p.node` identifies a schema pattern; an associated condition can use the fact bound to that pattern. Resolving a declaration's identity and binding it to a fact are separate steps (section 3.5). *(R7)*

A reference must resolve by the end of the change containing it, otherwise the change is rejected as `dangling-ref`. A slot with `by=` instead permits a named association to remain pending until its target is supplied; the world retains the unresolved association explicitly (section 3.2). *(R8)*

| Event | Identity and reference behaviour |
|---|---|
| deletion | Declared dependent parts can be removed together, such as an edge whose endpoint is deleted. An independent object referring to the target can instead block deletion, with its reason reported. |
| copying | The copy has a new identifier and retains the declared kind and properties. References to other objects are retained only where their slots declare `copy=keep`; internal references of a copied structure must be remapped consistently. |
| schema import | Schema wire identifiers receive module qualification; instance facts are not thereby renamed. |
| label change | Identity remains unchanged. Updating `label` or `title` does not alter references. |
| save and reload | Identifiers are preserved. |

Lifecycle behaviour follows the declared role of each relationship. An edge cannot exist without its endpoints. A meeting, however, can have independent existence from its assigned room. Deleting that room does not authorise deleting the meeting or silently assigning another room. These are domain declarations, not universal consequences of every reference.

Copying separates a new identity from reusable content. Copying a complete diagram requires remapping links between copied nodes. Keeping an external calendar reference is a separate explicit decision. Neither operation is equivalent to importing a module or moving the files of one unchanged instance.

## 2.5 Declaration semantics: facts, schemas and patterns

**Separate ownership is mandatory.** A schema World owns type, slot, rule, pattern and constraint definitions. A knowledge World owns reusable concept, policy and interface declarations under imported schemas. An instance World owns current objects, requests, observations and relationships, with explicit imports of the definitions it uses. An import is a dependency, not an instruction to copy the imported declarations into the instance's stored facts. A temporary evaluation context may compose several sources; its combined contents must not be mistaken for one persisted instance World.

An instance document can declare dependencies with `core.use`; these directives describe its place in the world graph, not mutable object state. The compiler resolves those declared dependencies into its evaluation context before admitting the document's instance facts. The mutable fact payload excludes imports and schema declarations: an ordinary state edit cannot introduce `core.use`, `core.type`, slots or rules. Saving the instance retains its dependency description and its owned facts separately from the imported definitions. This distinction applies equally to code, persisted state and the examples.

Each teaching exercise is independent unless its declared dependencies connect it to another. Repeated module names in independent exercises are alternatives, not permission to merge their definitions into one catalog.

Each SOP example below identifies its owning World. The `sop-world` comments give the same identity, role and source dependencies to the example checker; they do not add SOP syntax. A module becomes available by its declared name, and each consuming World still imports it through real `core.use` wires. A source file containing both definitions and current facts is not a substitute for this separation.

Wires share a syntax but have different roles. A **fact** states what exists and its properties: a particular object or event. Facts change as the system works.

A **schema** contains the declarations that govern allowed facts and their consequences. It is authored for a domain and changes independently of individual instance state. It is a declared contract independent of individual instance state and concrete tools.

A wire belongs to the schema when it has a predefined schema type, such as `core.type` or `core.rule`. A rule can also designate a declaration in the same text as a condition or conclusion: a **pattern** or **conclusion template**, respectively (sections 3.4–3.5). Other declarations are facts. Fact and schema identifiers occupy separate identity spaces; a fact `p` and schema declaration `p` do not collide solely because their local names match.

## 2.6 Namespaces, modules and project organisation

A **namespace** establishes the context in which names resolve. Two objects can both have the local name `n1`; resolution must still distinguish their instances and the modules defining their types.

A path identifies storage location. A module is a reusable schema unit. An instance is concrete state governed by schemas. A local identifier names a fact within that instance. A module can serve several instances, and one instance can be stored across several files.

For a tutorial example, a diagram instance and a calendar instance have distinct persistent identities. Both may contain a local `n1`. Producing a chart from calendar data reads one instance and creates facts in another. Qualification and declared mappings expose that transition rather than merging objects with equal names.

The chapter 7 teaching examples use local types such as `node` and `meeting`. A directory named `worlds/diagram/` does not itself qualify `node`. A published module can qualify it as `diagram.node`; slot declarations, patterns and uses must follow the same qualification consistently. Type qualification is distinct from an instance's `diagram::` fact prefix.

### 2.6.1 Qualified references and historical sources

A local reference resolves within its declared instance context. A qualified reference identifies a fact in another declared context; it does not import that context, grant write access or prove that the target is loaded. A pattern reference instead names a schema pattern and is bound to the matching fact during rule evaluation (sections 3.4–3.5).

A live relationship requires a resolvable target. A derived historical result can instead retain an independent record of the source identity, observed version and consumed values. A missing live reference must never be silently converted into historical text.

For example, a chart of meeting counts reads a calendar snapshot, counts Monday=2 and Tuesday=3, and stores those counts with the captured source identity and version. Deleting the source calendar does not alter those historical counts. “Update the chart” requires another coherent source read and recomputation; an unavailable source cannot be reported as a successful update. A live embedded drawing follows a different contract: render the referenced scene at a coherent observed version, or report that it cannot be resolved.

### 2.6.2 Project ownership and file organisation

For filesystem persistence, a project descriptor identifies project roots, imported modules, schema dependencies, instance identities and the files owning their facts. These file-ownership rules apply to that storage arrangement; an in-memory or database-backed system can preserve the same identity and dependency contracts through another storage adapter. Paths are storage locations rather than semantic identities. The following teaching layout illustrates these roles; directory names do not create types or instances.

| Relative path | Declared project role |
|---|---|
| `worlds/diagram/schema.sop` | Schema of the example diagram module with an explicit stable public name. |
| `worlds/diagram/rules.sop` | Rules of the same module; a separate file does not make another instance. |
| `instances/diagram/main.sop` | Facts of an instance with persistent identity. |
| `instances/diagram/parts/nodes.sop` | More facts of that same instance if the descriptor declares that ownership. |
| `instances/calendar/main.sop` | Calendar instance facts, explicitly linked to the diagram when needed. |

The loader resolves paths against declared roots, then determines each file's role. Equivalent normalised paths must not cause duplicate loading. Imports outside allowed roots are rejected. A published dependency is identified by module and version, not the author's absolute local path.

A path-derived name is an initialisation convention. The instance retains immutable identity when directories move. Copying must explicitly choose between continuing the same identity and creating an independent instance with remapped references. Conflicting identities are not implicitly merged.

Persistence also needs a destination ownership rule. For an existing fact the descriptor identifies its owning file. For a new fact it declares a default destination or deterministic distribution rule. In the diagram example, nodes can belong to `parts/nodes.sop` and other facts to `main.sop`. Missing or ambiguous ownership stops saving without overwriting existing files.

| Load or copy situation | Required behaviour |
|---|---|
| Two paths infer the same instance name | Reject ambiguous inference and require distinct declared names; include case-only collisions on case-insensitive filesystems. |
| A referenced calendar is outside declared roots | Reject activation of the unresolved context, identifying source and missing target. Preserve stored files. |
| An independent copy refers outside itself | Keep external targets only when the copy explicitly declares those dependencies; otherwise reject copying before publication. |
| One instance spans several files | Give each fact exactly one destination; do not save competing duplicates. |

Name collisions and identity collisions are different errors. `instances/diagram/main.sop` and `instances/diagram.sop` can both suggest `diagram` without being the same instance. Choosing the first file is not a resolution policy. Conversely, different names do not justify loading conflicting states under one identity.

An active factual reference requires an available target (R8). Historical results retain autonomous source evidence; displaying them does not authorise recomputation without the source.

### 2.6.3 Subworlds and visibility boundaries

A subdirectory is not automatically a subworld. Dividing facts among files can be purely organisational. A **subworld** is a distinct declared instance with its own state and identity, linked to a containing instance. Containment does not automatically imply import, type inheritance or visibility of every fact.

As a tutorial example, a document embedding a drawing can justify this composition: the document owns the insertion's position and extent; the drawing keeps its own schema and state. A static inserted image is simply a resource, not a subworld merely because it occupies a separate file. The demonstration's tabs do not establish a required hierarchy.

A composition context declares which schemas and facts it reads, at which versions and with which modification rights. Cross-world references are explicit. Equal local names or text values do not join facts automatically. Intentional sharing must be declared; `shared=true` allows facts of a type to participate across namespaces.

Schema wires have module identities; fact namespaces are a separate concern. `diagram.node` can be a public type and `diagram::n1` an instance fact. A dot and `::` have different roles. `core.namespace` declares an open key prefix, not an instance namespace.

---

# 3. A world's schema

This chapter explains the declarations used to define and validate a schema. Each definition states its purpose, fields and an example. These are schema concepts processed within LIB, not additional public APIs for an application to orchestrate.

## 3.1 `core.type`: declaring a type

A `core.type` wire adds information about a type: its parent and structural properties. An open world can use a type without this declaration; the declaration supplies the constraints and relationships described here.

`of` names the type being described. The declaration also has its own wire identifier, but **that identifier is not the type name**. It identifies the declaration. Examples prefix it with `t.` for readability.

**Schema World — `drawn-type/schema.sop`.**

<!-- sop-world id=drawn-type.schema role=schema module=example -->
```sop
@t.drawn core.type of=example.drawn extends=std.schema.thing closed=true
@book.use.drawn-type.schema.std.schema core.use world=std.schema
@book.drawn-type.schema.module core.module name=example
```

The declaration's identifier is `t.drawn`. It describes `example.drawn`, declaring its parent `std.schema.thing` and closing its accepted keys.

| Key | Meaning |
|---|---|
| `of` | Required name of the described type. |
| `extends` | Parent type. Instances are also instances of that parent and inherit its slots, rules and restrictions. There is one lineage parent; additional repeated entries borrow key groups rather than introduce more lineage parents. |
| `closed` | `true` permits only declared keys. Without it, additional keys can be accepted. |
| `complete` | `true` asserts complete knowledge of this type in the relevant context. With no matching fact, an existence question can then yield false rather than unknown. |
| `transient` | `true` marks observational state, such as a selection or cursor, that ordinary undo skips. |
| `unique` | A key whose value must distinguish facts of this type; repeated keys define a unique combination. |
| `shared` | `true` allows facts of this type to participate across namespaces (section 2.6). |
| `is` | With `w.legend` loaded, a reference or unambiguous public name of a declared `w.legend.concept`; checked by the schema-link contract (section 4.7). |

`extends` defines **lineage**: what is common to several specialised types is declared once on their shared parent. `std.schema.thing` is a standard vocabulary type used by the tool-binding example in section 6.1. It is not a requirement that every application type inherit from it, nor does its name grant any rendering capability.

## 3.2 `core.slot`: declaring a type's key

To validate a property's values, a schema declares its value kind, whether it is required and its multiplicity. That declaration is a **slot**, expressed by `core.slot`.

The key and its slot are distinct. `size=1.6` is content on a fact. A slot is the schema wire stating that `example.drawn` has a numeric key named `size`.

Slot declarations are separate wires linked to their owning type through the type-valued `of` key. A type with five explicitly declared slots therefore uses one type declaration and five slot declarations. Slot wire identifiers are free; examples use `s.` followed by the type and key.

**Schema World — `drawn-slots/schema.sop`.**

<!-- sop-world id=drawn-slots.schema role=schema module=example -->
```sop
@t.drawn      core.type of=example.drawn extends=std.schema.thing
@s.drawn.at   core.slot of=example.drawn key=at     kind=number many=true required=true
@s.drawn.size core.slot of=example.drawn key=size   kind=number min=0.3 max=3
@s.drawn.in   core.slot of=example.drawn key=in     type=example.drawn
@book.use.drawn-slots.schema.std.schema core.use world=std.schema
@book.drawn-slots.schema.module core.module name=example
```

In the schema block, the second wire declares numeric `at` values, allows several of them and marks the key required. The third restricts `size` to numbers between 0.3 and 3. The fourth declares `in` as a reference to another `example.drawn` fact. This toy example demonstrates slot structure; coordinates in a production domain also need declared axes and frame semantics.

| Key | Meaning |
|---|---|
| `of` | Required name of the type owning the key. |
| `key` | Required key name. |
| `required` | `true` marks a missing value as an open key requiring completion (section 3.3). |
| `present` | `true` requires the exact key after deduction; its absence makes the record structurally invalid and rejects the transaction. |
| `many` | `true` permits multiple values; otherwise the key takes one. |
| `kind` | The kind of a directly supplied value, from the next table. Repeated kinds allow alternatives. |
| `type` | A type to which the value must refer. Can be repeated for alternative types. |
| `enum` | An allowed value; repeated to list alternatives. Use for a closed vocabulary; reusable concept meanings belong in knowledge (section 4.4). |
| `min`, `max` | Bounds on numeric or quantity values. |
| `step` | With bounds, restricts values to `min`, `min+step`, and so on. |
| `default` | A fallback when no value is supplied. A literal schema fallback is distinct from contextual semantic completion in knowledge (section 6.6). |
| `ask` | Explanatory wording for a missing value, not a requirement to interrupt the user. Prefer declared completion and ranked reversible action (section 6.4). |
| `soft` | `true` admits an out-of-bounds value while recording an issue (section 3.6). |
| `why` | The reason attached to rejection. |
| `id` | `true` makes the key part of fact identity: same-type facts equal on all identity keys denote one fact. |
| `unique` | `true` forbids distinct same-type facts in the same namespace from sharing this value. |
| `excludes` | Another key that cannot coexist with this one on the same fact. |
| `prefix` | `true` treats `key` as a prefix governing all keys starting with it. |
| `combine` | `intersect` or `override`: how declarations for the same slot combine (section 5.3). |
| `to` | With `kind=ref`, constrains the referenced fact's type. |
| `by` | With `type=T`, resolves a supplied name through the named key of a `T` fact. This permits a named association rather than an explicit reference. |
| `match` | Additional keys that must agree when resolving a `by` association. |
| `strict` | With `by`, rejects an unresolved name immediately rather than retaining a pending association. |
| `copy` | `keep` retains this reference when copying an object. |
| `means`, `space` | With `w.legend` loaded, a declared concept and space respectively. Names must resolve uniquely or use typed references; these are checked schema links. |

The `kind` vocabulary distinguishes the following value domains:

| `kind` | Accepted value |
|---|---|
| `integer` | An integer. |
| `number` | An integer or decimal; `5` and `5.0` represent the same number. |
| `boolean` | `true` or `false`. |
| `string` | Quoted text. |
| `atom` | A name token. |
| `quantity.<name>` | A number with a unit, such as `quantity.mass` accepting `5kg`. |
| `time.clock`, `time.date` | A clock time such as `10:40`, or date such as `2026-01-30`. |
| `ref` | A wire reference; `to=T` constrains its target type. |
| `json` | Text encoding a structured value that declared paths can inspect. |
| `blob` | A large retained value opaque to rule matching. |
| `any` | Any value. |

**Slot inheritance.** A slot applies to descendants of its owning type. A more specialised type can redeclare the key; the applicable nearest declaration and its combination policy determine the resulting constraints.

`present=true` requires the exact key at transactional validation after deduction. Its absence produces `missing-key` and rolls back the change. `required=true` instead marks an unresolved completion obligation. A provenance record without its source is structurally invalid; an unknown position in an intermediate goal can be incomplete. Presence is inherited and cannot be combined with a key prefix, since a prefix does not identify one exact mandatory key.

## 3.3 Open keys

Suppose a toy schema marks `drawn.at` with `required=true`, and the fact `@f2 example.drawn size=1` has no `at`. The fact can be retained with an explicit completion obligation. A required key without a value is an **open key**.

This uses `required=true`, not `present=true`. The schema author chooses according to the record's meaning. The word “required” must not erase the difference between an incomplete goal and an unusable evidence record.

An underspecified request is ordinary input. In a drawing example, “draw a fish” supplies neither size nor position. The system must retain that information without pretending it already has a complete drawable object. Open keys make the remaining obligations explicit.

LIB handles them through four internal activities. These explain its algorithm rather than introduce application-facing orchestration APIs:

| Activity | Result |
|---|---|
| enumeration | Identify each open fact/key pair and any explanatory slot wording. |
| completion | Derive permitted values and fill a key when its justified value is determined. |
| advice | Describe candidate values or the remaining information need without changing facts. |
| solving | Search jointly for values satisfying all applicable constraints, including dependencies between keys. A scheduling example may solve several start times together. |

The library completes from declarations and compatible live context, ranks usable alternatives and retains chosen assumptions. A missing coordinate is a completion task, not an automatic clarification question (sections 6.4, 6.6 and 6.8).

**Relationship to variables.** A variable in a schema pattern means “whichever value matches”; it does not denote missing information. An open key belongs to a fact and says that a needed value remains unknown. Solving connects these ideas by treating open keys as unknowns in a constraint problem and searching for satisfying assignments.

## 3.4 Patterns, variables and fact binding

A **pattern** is a structural condition for finding facts. It is not a machine-learning model, image or example to imitate. It states the sought type and relationships among its values.

A fact states that a particular object exists with particular properties. A pattern asks for objects satisfying conditions. Both use wire syntax, but their roles differ. A declaration named by a rule as a condition is registered in that rule's schema; it is not inserted as an instance object. The presence of `?` alone does not establish that role.

For this toy diagram, the schema World and instance World are separate:

**Schema World — `red-nodes/schema.sop`.**

<!-- sop-world id=red-nodes.schema role=schema module=example -->
```sop
@t.node core.type of=example.node closed=true
@s.node.label core.slot of=example.node key=label kind=string
@s.node.colour core.slot of=example.node key=colour kind=atom
@book.red-nodes.schema.module core.module name=example
```

**Instance World — `red-nodes/instance.sop`.**

<!-- sop-world id=red-nodes.instance role=instance uses=red-nodes.schema -->
```sop
@n1 example.node label="Review" colour=red
@n2 example.node label="Decision" colour=blue
@n3 example.node label="Finish" colour=red
@book.use.red-nodes.instance.example core.use world=example prefix=false
```

`example.node` is a declared example type, not a reserved word. `n1`, `n2` and `n3` identify the three objects; their schema permits `label` and `colour`. The next exercise owns its rule and patterns in a schema World. The instance World imports that schema and contains only the concrete nodes:

**Schema World — `red-matches/schema.sop`.**

<!-- sop-world id=red-matches.schema role=schema module=example -->
```sop
@t.node core.type of=example.node closed=true
@s.node.label core.slot of=example.node key=label kind=string
@s.node.colour core.slot of=example.node key=colour kind=atom
@t.match core.type of=example.red.match closed=true
@s.match.text core.slot of=example.red.match key=text kind=string present=true
@p.red example.node colour=red label=?text
@t.red example.red.match text=?text
@r.red core.rule when=$p.red then=$t.red
@book.red-matches.schema.module core.module name=example
```

**Instance World — `red-matches/instance.sop`.**

<!-- sop-world id=red-matches.instance role=instance uses=red-matches.schema -->
```sop
@n1 example.node label="Review" colour=red
@n2 example.node label="Decision" colour=blue
@n3 example.node label="Finish" colour=red
@book.use.red-matches.instance.example core.use world=example prefix=false
```

`p.red` names the search condition, not another diagram node. The rule derives one `example.red.match` for each matching label; `t.red` is its conclusion template. Matching searches `example.node` and its descendants. `colour=red` must agree with the fact; `?text` receives its `label`. Keys omitted from the pattern are not tested by that pattern.

| Candidate fact | Match |
|---|---|
| `n1` | Matches; `?text` binds to `Review`. |
| `n2` | Does not match: `blue` differs from `red`. |
| `n3` | A separate match; `?text` binds to `Finish`. |

**Binding** is the concrete association between variables, values and matched facts for one result. There are two independent results here, not one global variable changing from `Review` to `Finish`. A repeated variable within a rule must agree across all conditions of a match. That equality provides a **join**. Equal variable names in different rules do not join those rules automatically.

A fact without `label` does not satisfy `label=?text`; matching does not invent missing text. A pattern containing only `example.node colour=red` would not care about a missing label. Patterns can have no variables: a type and constants are sufficient conditions.

The following matching/construction metadata controls a pattern or conclusion template; it is not content on the described instance object:

| Key | Meaning |
|---|---|
| `core.absent` | A key name; the pattern matches only facts with no value for that key. |
| `core.select` | `latest` or `first` selects that matching fact among candidates. |
| `core.on` | A pattern in the same rule; applies the conclusion to its matched fact instead of creating another fact. |

## 3.5 Deduction rules: premises, matching and conclusions

A **deduction rule** states which conclusion follows from particular facts. It does not itself describe a sequence of drawing instructions. The engine finds satisfying bindings and instantiates the conclusion for each. Concrete tools are a separate boundary (chapter 6). Section 3.7.1 follows a complete rule from concrete input facts through variable binding and calculation to both a completed value and a newly generated wire.

For a diagram example, define a start node as one with no incoming link. This is an explicit definition for the example, not a meaning hidden in `example.node`. Its rule schema is:

**Schema World — `start-node/schema.sop`.**

<!-- sop-world id=start-node.schema role=schema module=example -->
```sop
@t.node core.type of=example.node closed=true
@s.node.label core.slot of=example.node key=label kind=string
@s.node.start core.slot of=example.node key=start kind=boolean
@t.link core.type of=example.link closed=true
@s.link.from core.slot of=example.link key=from type=example.node present=true
@s.link.to core.slot of=example.link key=to type=example.node present=true
@p.node  example.node
@p.in    example.link to=$p.node
@t.start example.node core.on=$p.node start=true
@r.start core.rule when=$p.node not=$p.in then=$t.start
@book.start-node.schema.module core.module name=example
```

After declaring the toy types and slots, `p.node` matches any node. `p.in` matches a link whose `to` endpoint is the fact bound to `p.node`. `$p.node` here is neither the text `p.node` nor a diagram object with that name; it identifies the rule's pattern and the fact bound to it.

`t.start` is a **conclusion template**. `core.on=$p.node` adds `start=true` to the matched node rather than creating an object called `t.start`. The rule joins its positive premise `when=$p.node`, negative premise `not=$p.in` and conclusion `then=$t.start`.

`when=$p.node` is therefore a real schema reference, not an incomplete expression to interpret freely. The loader resolves the declaration in the rule's unit. A missing or unusable pattern rejects the schema. Prefixes `p.` and `t.` are readability conventions; the rule's use establishes the roles.

The instance imports the preceding schema World and supplies these facts. It does not redeclare the types or the rule:

**Instance World — `start-node/instance.sop`.**

<!-- sop-world id=start-node.instance role=instance uses=start-node.schema -->
```sop
@n1 example.node label="Review"
@n2 example.node label="Decision"
@e1 example.link from=$n1 to=$n2
@book.use.start-node.instance.example core.use world=example prefix=false
```

| Evaluation | Result |
|---|---|
| `p.node` binds `n1` | No link with `to=$n1` exists in the read state. The negative premise holds and the rule derives `start=true`. |
| `p.node` binds `n2` | `e1` has `to=$n2`. The negative premise fails; this rule does not derive `start=true`. |

Adding an incoming link to `n1` removes this justification. The engine retracts the derived value unless another justification supports it. Explicitly stated values and deduced values must remain distinct in the evidence.

`not` tests absence in the evaluated state, not absence in facts that have not been loaded. An incomplete diagram cannot justify a definitive start-node claim. Sections 3.9 and 8.4 describe the completeness conditions for using that conclusion.

| Key | Rule-evaluation meaning |
|---|---|
| `when` | Positive pattern reference. Repeated premises require one mutually compatible binding. |
| `not` | Negative pattern reference; no extension of the current binding may satisfy it. |
| `with` | A `core.calc` result used in the current binding. |
| `if` | A computed `core.check` condition that must hold. |
| `then` | A conclusion template instantiated from the bound values and facts. |
| `lazy` | Requests deduction on demand without changing its justification. |

### 3.5.1 Constructing a rule, matching it and choosing an action

A rule author chooses a relation to express and declares its premises and conclusion. The start-node rule above expresses one specific definition: no incoming link in the observed diagram. The engine does not discover that definition by enumerating every possible arrangement of keys. Its schema determines the vocabulary; the declared rule determines which arrangement has meaning.

Before interpreting a rule, its declarations must form a closed, usable specification. The condition IDs must resolve to patterns; a pattern's type and keys must belong to the supplied schema; fixed values must have suitable kinds; and every value used in a conclusion must be supplied by a positive match or a declared calculation. A template cannot turn an unbound `?colour` into a justified colour. A negative premise can test absence within a binding, but absence must not invent a missing person or measured value. These checks concern the declaration's legality, not whether its conclusion is useful for a particular human request.

Matching supplies the next distinction. In the red-node example, `n1` and `n3` both satisfy the same pattern. The rule has two independent bindings, one for each fact, and can derive a separate conclusion for each. It has not chosen which node to edit. An “all red nodes” request can use both identities; “the selected red node” needs a selection condition; “the other one” requires retained conversation evidence. A missing selection condition cannot be supplied by taking whichever matching fact happens to be returned first.

Planning introduces alternatives of a different kind. A request can allow two objects, two placements or two methods to achieve its result. The compiler constructs candidates from applicable declared methods, available objects and permitted completion ranges. Hard constraints eliminate incompatible candidates; the declared objective ranks the survivors. If a calendar method minimises delay, 11:00 beats 11:30 after both intervals have been proved available. A different objective must be stated; no function named “best” supplies it by itself.

Schema validity alone permits many useless or unintended results. A blue shape at coordinate 200 can be valid yet fail a request for a red shape near an identified house. The candidate must satisfy the request's bound target, result predicates and declared tolerances as well as structural validity. The compiler keeps which values came from the request and which were assumptions. A plausible reversible choice can be made under the application's policy, but the chosen interpretation, alternatives and uncertainty remain available for correction.

Applying a rule is also different from learning a new rule. A deduction follows an existing declared implication. Completion searches assignments permitted by existing meanings and constraints. Proposing a new implication changes knowledge and requires its own evidence and review; it cannot be passed off as an ordinary conclusion of the old rules. The implementation plan tracks that distinction separately from reader training.

## 3.6 `core.deny`: forbidden combinations

A deny declaration forbids specified patterns from matching together. A change producing such a match is rejected atomically, preserving the earlier state.

**Example.** A scheduling schema can prohibit one participant from attending overlapping meetings:

**Schema World — `meeting-deny/schema.sop`.**

<!-- sop-world id=meeting-deny.schema role=schema module=example -->
```sop
@t.meeting core.type of=example.meeting closed=true
@s.meeting.people core.slot of=example.meeting key=people kind=string many=true
@s.meeting.start core.slot of=example.meeting key=start kind=number present=true
@s.meeting.length core.slot of=example.meeting key=length kind=number present=true
@f.over core.function name=overlaps out.kind=boolean pure=true
@f.over.1 core.function.arg of=$f.over name=start1 kind=number
@f.over.2 core.function.arg of=$f.over name=length1 kind=number
@f.over.3 core.function.arg of=$f.over name=start2 kind=number
@f.over.4 core.function.arg of=$f.over name=length2 kind=number
@p.m1   example.meeting people=?person start=?s1 length=?l1
@p.m2   example.meeting people=?person start=?s2 length=?l2
@c.two  core.check fn=neq args=$p.m1 args=$p.m2
@c.hit  core.check fn=overlaps args=?s1 args=?l1 args=?s2 args=?l2
@d.busy core.deny when=$p.m1 when=$p.m2 if=$c.two if=$c.hit why="?person already has something at that time"
@book.meeting-deny.schema.module core.module name=example
```

This schema World declares the toy meeting type, constraint and typed pure `overlaps` primitive. No concrete event is stored in it. That primitive tests half-open intervals: `s1 < s2+l2` and `s2 < s1+l1`; it does not choose people or times. The patterns are named `p.m1` and `p.m2`. Their `$p.m1` and `$p.m2` references denote the two entire matched meeting facts, allowing `neq` to test that they are distinct. Both patterns bind `people=?person`, so their common `?person` variable requires the same participant. Neither the dots in pattern IDs nor the shared variable read fields implicitly. `c.two` requires distinct meetings; `c.hit` tests interval overlap. When both patterns and checks succeed, the deny rejects the change. The declared `why` contract substitutes the bound `?person` into the explanatory message. This interpolation belongs to that field’s explanation semantics; ordinary quoted text does not generally evaluate variables or references.

| Key | Meaning |
|---|---|
| `when`, `not`, `with`, `if` | The matching and computation roles described for `core.rule`. |
| `why` | Rejection reason; `?v` substitutes the bound value of variable `v`. |
| `soft` | `true` records an issue instead of rejecting the change. |
| `priority` | A number ordering reported violations; lower values come first. |

**Hard and soft.** An ordinary deny is **hard** and rejects the change. With `soft=true`, the change is accepted but the world derives a `core.issue` identifying the condition and offending facts. The issue disappears when its cause disappears. In the tutorial scheduling profile, participant overlap is hard. A drawing profile can instead treat fish outside water as a soft issue, permitting an explicitly requested fish in the sky. These strengths belong to those declared profiles, not universally to all uses of fish or meetings.

Consider a 10-unit-wide rectangle that may start at 0, 10 or 20. Another rectangle occupies the interval from 0 to 20 on the same row. A soft overlap condition accepts all three placements and records a problem at 0 and 10. A solver that needs only a feasible assignment can therefore return 0. To prefer 20, declare an objective that minimises overlap. To distinguish two crowded positions, measure the area of intersection or the shortfall from a required clearance. Counting violated conditions gives the same score to two intersections of very different sizes.

**Violations.** A rejected change reports its violation kind, rule, affected facts and reason. The response uses that evidence rather than guessing why the operation failed.

| Kind | Condition |
|---|---|
| `domain` | A value violates a slot's kind, type, vocabulary or bounds. |
| `cardinality` | Multiple values are supplied for a single-valued key. |
| `unknown-key` | An undeclared key appears on a closed type. |
| `dangling-ref` | A reference has no available target. |
| `conflict` | Incompatible values are asserted for a single-valued key. |
| `duplicate-id` | An identifier is redeclared with different content. |
| `variable` | A variable appears in a fact. |
| `deny` | A hard deny's conditions match. |
| `schema` | A malformed or conflicting schema declaration. |
| `schema-ownership` | An instance-only payload attempts to introduce definitions, rules, templates or imports instead of referring to a separately prepared context. |

### 3.6.1 Constraints, norms and defaults

A statement about what usually happens differs from a condition needed to represent valid state. Knowledge may associate fish with water while a drawing domain deliberately permits surreal scenes. A scheduling profile can explicitly prohibit participant overlap.

The use of knowledge within a world's schema determines its enforcement strength. Rejection, issue reporting and completion are distinct operations. Confusing them either rejects useful work or hides actual violations. A knowledge statement's content alone does not make it a hard constraint. *(R49)*

| Statement role | Strength unless the applicable profile declares otherwise |
|---|---|
| General domain expectation, such as fish in water | Soft when used as a norm. |
| Structural norm, such as a letter's signature or one start node in a flow | Soft during editing; an explicit check reports unmet norms. |
| Typical value or heuristic | A completion/ranking input, not a validity constraint. |

Hard constraints are representation requirements, such as valid edge endpoints, or explicitly declared restrictions of the applicable profile. *(R50)* A soft norm permits intermediate work: a letter without a signature can be edited and saved. Checking it reports the omission rather than inventing a signature. A default proposes a missing value; it does not prove that alternatives are wrong.

If a manual or external change produces a hard conflict, observation must still describe reality. Report the conflict and apply the declared repair policy; do not falsify the observation to satisfy the schema. Observing an existing conflict differs from admitting a proposed change before execution.

## 3.7 Calculations, checks and functions

Structural matching alone cannot compute every needed value or condition: interval overlap, a sum or a word count. A schema can invoke a declared **function** for such calculations.

`core.check` calls a function returning a Boolean:

| Key | Meaning |
|---|---|
| `fn` | Required function name. |
| `args` | Ordered, repeated arguments: values, variables or matched patterns. |
| `why` | Explanation when the check fails. |

`core.calc` binds a calculated value for use in a conclusion:

| Key | Meaning |
|---|---|
| `out` | Required output variable. |
| `fn` | Required function name. |
| `args` | Ordered, repeated arguments. |
| `over` | A pattern whose matches supply an aggregate calculation. |
| `pick`, `ties` | Selection and tie-handling policy for extrema. |

**Function implementations.** Generic primitives include arithmetic (`add`, `sub`, `mul`), comparison (`eq`, `neq`, `gt`, `lt`), text/time operations and aggregation (`count`, `sum`, `min`, `max`). A capability provider can add a pure calculation under a declared `core.function` contract. It must declare its inputs and output, and perform only that computation without modifying state. This is an explicit computational boundary, not permission to conceal semantic choices in a callback.

**Schema World — `overlap-function/schema.sop`.**

<!-- sop-world id=overlap-function.schema role=schema module=example -->
```sop
@f.over   core.function name=overlaps out.kind=boolean pure=true doc="two time intervals share a moment"
@f.over.1 core.function.arg of=$f.over name=start1  kind=number
@f.over.2 core.function.arg of=$f.over name=length1 kind=number
@f.over.3 core.function.arg of=$f.over name=start2  kind=number
@f.over.4 core.function.arg of=$f.over name=length2 kind=number
@book.overlap-function.schema.module core.module name=example
```

The first wire declares the pure Boolean function `overlaps`. The following four describe its ordered arguments and refer back to the function declaration through `of`. Declaring a function's interface does not create its implementation; an appropriate registered primitive supplies the calculation.

| `core.function` key | Meaning |
|---|---|
| `name` | The name used by `fn`. |
| `out.kind` | Output value kind. |
| `pure` | `true` means equal arguments produce equal results without side effects. |
| `doc` | Explanation of the calculation. |

| `core.function.arg` key | Meaning |
|---|---|
| `of` | Function declaration reference. |
| `name` | Argument name. |
| `kind` | Argument value kind. |
| `optional` | `true` permits omission. |
| `doc` | Argument explanation. |

Tutorial examples include `overlaps` for time intervals, `covers` for overlapping shapes, `crossings` for diagram edges and `words` for text. These illustrate typed calculations; their names do not introduce implicit reasoning about a domain.

### 3.7.1 Worked example: bind, calculate, check, then derive

The connection between these declarations is a rule, not their order in the file. A pattern binds variables; a calculation produces another bound value; a check tests the current binding; the conclusion says what to assert. A calculation or check declared without a rule using it does not independently change an object.

Consider a small scheduling model. Times are integer minutes after midnight within one identified day: 630 is 10:30 and 660 is 11:00. Duration is measured in the same minute unit. This teaching model deliberately allows zero duration so the false-check case is observable; a production scheduling schema can forbid it. The arithmetic primitives `add` and `gt` are supplied by LIB.

**Schema World — `event-calculation/schema.sop`.** It defines only the accepted record structures.

<!-- sop-world id=event-calculation.schema role=schema module=example -->
```sop
@event.type core.type of=example.event closed=true
@event.start core.slot of=example.event key=start kind=integer min=0 present=true
@event.length core.slot of=example.event key=length kind=integer min=0 present=true
@event.end core.slot of=example.event key=end kind=integer min=0
@interval.type core.type of=example.interval closed=true
@interval.event core.slot of=example.interval key=event type=example.event present=true
@interval.start core.slot of=example.interval key=start kind=integer present=true
@interval.end core.slot of=example.interval key=end kind=integer present=true
@event.schema.module core.module name=example
```

**Knowledge World — `event-calculation/rules.sop`.** It imports the structures and owns the reusable deduction rules, their patterns, calculations and templates. These declarations are not concrete meetings or intervals.

<!-- sop-world id=event-calculation.knowledge role=knowledge module=example.rules uses=event-calculation.schema -->
```sop
@event.rules.schema core.use world=example prefix=false
@p.event example.event start=?start length=?length
@c.end core.calc out=?end fn=add args=?start args=?length
@c.positive core.check fn=gt args=?length args=0
@t.end example.event core.on=$p.event end=?end
@r.end core.rule when=$p.event with=$c.end if=$c.positive then=$t.end
@t.interval example.interval event=$p.event start=?start end=?end
@r.interval core.rule when=$p.event with=$c.end if=$c.positive then=$t.interval
@event.rules.module core.module name=example.rules
```

**Instance World — `event-calculation/instance.sop`.** Its dependency directive prepares the context; its mutable payload contains only the event.

<!-- sop-world id=event-calculation.instance role=instance uses=event-calculation.knowledge -->
```sop
@event.instance.rules core.use world=example.rules prefix=false
@meeting1 example.event start=630 length=30
```

The two rules share the pattern and calculation, but each has its own conclusion. For the instance above, LIB follows this binding:

| Declaration or step | Concrete meaning in this match |
|---|---|
| `when=$p.event` | Match `meeting1`; bind `?start=630` and `?length=30`. `$p.event` denotes that entire matched fact within the rule. |
| `with=$c.end` | Pass the two bound values to `add` in the order of `args`; bind `?end=660`. `out=?end` names the result variable, not a field to edit. |
| `if=$c.positive` | Evaluate `gt(30,0)`; it is true, so this binding can produce a conclusion. |
| `then=$t.end` in `r.end` | Substitute `?end` into the template. `core.on=$p.event` selects the existing `meeting1`, deriving its `end=660`. |
| `then=$t.interval` in `r.interval` | Substitute the matched event reference and numeric bindings. There is no `core.on`, so derive a new `example.interval` fact pointing to `meeting1`, with `start=630` and `end=660`. |

The resulting instance contains `meeting1` with `start=630`, `length=30`, `end=660`, and a derived interval referring to it. The engine allocates the new interval fact's identifier; `t.interval` identifies the template, not an instance object with that literal ID. Both consequences retain their rule and premise justifications. The schema and rule definitions remain in their owning Worlds.

This demonstrates two distinct operations. **Completing a value** means asserting a justified property on an existing fact through `core.on`. **Generating a wire** means instantiating a conclusion template without `core.on`. The calculation supplies the same `660` to both. No drawing or calendar tool has been called; these are deductions over the instance. A later action request still needs compilation to concrete tool instructions when an external effect is required.

If `length=0`, `gt(0,0)` is false. Neither rule derives an end or interval. A false `if` skips that rule's conclusion; it is not a rejection of the event. If the event lacks the required `length`, this schema rejects the structurally incomplete fact before these rules can use it. If length is changed from 30 to 45, the old deduction loses its premise and the new binding computes 675, or 11:15. An incompatible explicitly asserted `end` is a conflict to report, not a value the rule silently overwrites.

The same mechanism can derive a price from quantity and unit cost, an object's right edge from its position and width, or a total from a declared population. Each example needs its own schema and meanings; the matching, calculation, checking and conclusion mechanism stays the same.

## 3.8 Other predefined types

The following `core.` types provide further schema vocabulary. Detailed field contracts belong in the library reference; their roles here explain the reasoning model.

| Type | Purpose |
|---|---|
| `core.aggregate` | Aggregates matching facts, such as meetings per participant. |
| `core.rank` | Orders facts by a declared key, supporting references such as the second paragraph. |
| `core.relation` | Defines a linear relationship allowing an unknown value to be calculated. |
| `core.abducible` | Declares permissible assumptions and their costs for explanatory search. |
| `core.tier` | Defines value precedence, distinguishing explicit input, assumptions and typical values. |
| `core.issue` | Represents a derived soft-constraint issue (section 3.6). |
| `core.word` | Relates a lexical form to a declared type, key, value or act. Forms belong to an identified language vocabulary; SOP syntax does not make their meaning universal. |
| `core.use` | Imports a published schema (section 5.3). |
| `core.module` | Declares a module's name, imports and exported types (section 5.3). |
| `core.schema.map` | Maps another schema notation to type and slot declarations. |
| `core.namespace` | Declares an open key prefix, commonly for evidence metadata; it is not an instance namespace. |
| `core.sequence` | Identifies the key governing a sequence. |
| `core.fluent`, `core.effect` | Describe state-valued properties and event effects on them. |
| `core.action` | Declares an operation changing world state through wires or a registered implementation. |
| `core.producer` | Declares a value computation invoked when that value is needed. |
| `core.question`, `core.answer`, `core.request` | Retain questions, answers and action requests as facts. |
| `core.precision` | Governs precision of computed numeric values. |

Keys beginning with `core.`, such as provenance metadata `core.source`, are accepted as metadata on wires. Acceptance of a metadata key does not itself supply an inference rule or executable capability.

## 3.9 Processing a schema-governed world

**Validation.** A change can contain several wires evaluated together. Rejection rolls back that change rather than retaining its valid subset. An admitted change can retain open keys (section 3.3) and soft issues (section 3.6); those are not equivalent to rejection.

**Three semantic outcomes.** Checking distinguishes a proved violation from a condition that cannot yet be evaluated. A meeting without a duration has no proved overlap, but its interval is not proved free either. These are semantic assessment outcomes, not interchangeable success flags.

| Outcome | Meaning |
|---|---|
| valid | No hard constraint is violated and all affected hard constraints were decidable. |
| invalid | At least one hard constraint is violated. |
| undetermined | No violation is established, but at least one affected hard constraint cannot be evaluated. |

Before dispatch, affected hard constraints must be decided. For a scheduling example, a declared 30-minute completion gives a 10:30 event the interval [10:30,11:00). If that interval violates a hard reservation constraint, it is not committed. Remaining undetermined hard preconditions remain unresolved; absence of a detected violation is never proof of a successful reservation.

**Queries.** Patterns can ask which facts exist and what values they contain. Existence questions distinguish true, false and unknown according to completeness evidence.

**Undo.** Declared history and transaction boundaries govern which changes can be undone or redone.

**Candidate state.** A fork is an initially equivalent isolated state in which changes can be evaluated without altering the original. LIB uses this internally before compiling the selected circuit. The application submits a request rather than orchestrating candidate forks.

### 3.9.1 Incomplete information, negation and validation

A missing value does not explain its absence. In a scheduling example, a room may be unchosen or unnecessary. The former is unknown; the latter is positive information that no resource is required. Confusing them causes needless questions or unsupported availability claims.

“Was a violation found?” and “Is there enough information to prove validity?” are different questions. Value state, pattern matching and validation outcome must remain distinct.

A value can be known, unknown or explicitly inapplicable. The schema must represent these cases distinctly. A resource requirement of false is not the same as an unknown resource. An atom spelled `none` has no special absence semantics; the schema must declare any absence/status representation. *(R9)*

A pattern matches values actually present. Binding a resource cannot invent one when its key is missing. `core.absent` checks missing keys; it does not reinterpret arbitrary atoms as absence. Constraint evaluation checks declared applicability before deciding whether missing information makes a condition undetermined. *(R10)*

`not=$p` tests absence of a matching fact in the evaluated state. It does not establish absence in reality beyond the available population. A dependent conclusion is retracted when the missing match appears. *(R11)*

An existence query yields true for a matching fact, false for no match in a complete population, and unknown otherwise. *(R12)*

A change affects every constraint whose patterns can involve a changed fact, including joins to unchanged facts. Moving one meeting can therefore require reading other meetings with a common participant or resource. *(R13)*

A constraint remains undetermined when the relevant subject matches on known fields but lacks a field required by another premise or check. Missing evidence is not a negative result. *(R14)*

| New meeting state in the scheduling example | Overlap assessment |
|---|---|
| Start and duration known, no overlap | Valid for the checked population. |
| Overlaps another meeting of the same participant | Invalid; the violation identifies both meetings. |
| Start known, duration unknown | Undetermined until declared completion and interval checking; no reservation is claimed meanwhile. |
| Explicitly requires no resource | Resource occupancy is inapplicable by declaration; participant constraints remain. |
| Conflicting single-valued starts | Rejected as `conflict`, independently of interval checks. |

“Undetermined” is neither a parse error nor a proved violation. A 10:30 start without duration cannot establish whether a later reservation is reached. Retain the incomplete request and seek the required evidence without claiming that an interval has been booked.

Completeness identifies a search scope: instance, types and observed state. A complete calendar population does not prove that every knowledge rule has been loaded. A conclusion under `not` can be valid for the current state without becoming a claim about unread data.

## 3.10 Further distinctions

**Missing means unknown.** It does not mean false or no. A negative assertion requires an explicit representation.

**A pattern does not invent values.** A missing value required for matching prevents that match.

**A fact is not automatically a schema pattern.** A rule names its pattern declarations in the same text. Later asserting a fact with an equal local identifier does not replace that schema pattern.

**A derived fact needs support.** It disappears when no remaining justification derives it.

---

# 4. The legend World

The legend World declares meanings shared by otherwise independent schemas: identity, quantity, position, time, part, relation and change. The library reads these declarations when elaborating a request. A shared name alone supplies neither a metric nor a default, inference rule or tool implementation; each needs its own declared contract.

## 4.1 The problem

Two slots can have the same primitive value type and still require different reasoning. Conversely, differently named slots can represent the same general concept. Consider four structural slots in tutorial examples:

**Schema World — `structural-slots/schema.sop`.**

<!-- sop-world id=structural-slots.schema role=schema module=example -->
```sop
@s1 core.slot of=example.drawn   key=at    kind=number many=true
@s2 core.slot of=example.node    key=at    kind=number many=true
@s3 core.slot of=example.section key=order kind=integer
@s4 core.slot of=example.meeting key=room  type=example.room
@book.structural-slots.schema.module core.module name=example
```

These slots cannot be interchanged merely because they all answer “where?”. A page coordinate is a numeric point in a frame, document order is a discrete position in a sequence, and a meeting room is an identified resource. The shared concept identifies the semantic family. The declared space, units, ordering and target type determine the legal calculation. “Move up” may decrease a page coordinate; it cannot silently subtract one from a room identifier.

Without those declarations, a handler has to guess meaning from a slot or domain name. With them, the library follows the referenced concept and operations; a concrete tool receives the resulting typed values. The problem and mechanism apply to any domain. The drawing, document and scheduling examples give the distinctions concrete values.

## 4.2 Shared semantic declarations

A **legend World** contains the concepts through which other Worlds describe meaning. The name follows a map legend: it explains what a sign represents. It contains concept declarations, not the current objects of an application instance.

A semantic link answers the first lookup question: which meaning does this type or property represent? It does not answer every later question. The library follows the link to the concept, then finds the declared operations for that concept and checks their input contracts against the supplied values. A room relation needs an identified resource and availability evidence; a page position needs coordinates and a frame. An operation requiring coordinates is not applicable to a room reference merely because both properties concern place.

For example, suppose the reader has retained a relative upward move, context has bound its subject to object `o2`, and the supplied page profile declares a downward-positive vertical axis with an additive step of 12 page units. The instance says `o2` is at `(70,90)`. Following the position property's space identifies that axis and step; applying the requested upward direction gives `(70,78)`. The candidate keeps x unchanged, checks the allowed page region and any affected constraints, and supplies those coordinates to the move interface. Replacing that frame with an upward-positive one changes the calculation to `(70,102)`. The word “up” alone does not choose either convention.

This chain explains what the declarations buy: the schema identifies the property and admissible values, the space identifies the calculation, the knowledge/profile supplies a default step, the instance supplies the baseline, and the tool interface identifies the final arguments. If any link required for that operation is absent, it is a named completion obligation rather than an invitation to guess from `x`, `y` or a tab name.

## 4.3 General concepts

The vocabulary below identifies questions that can arise across domains. Each concept needs a defined interpretation; adding a name does not add executable semantics. The examples illustrate that vocabulary rather than define the set of applications SOP Worlds supports.

| Concept | Meaning and example |
|---|---|
| `thing` | An identifiable subject: a component, record, document part or event. |
| `kind` | What a thing is; its declared semantic classification (§5.2). |
| `whole`, `part` | An object and the components that constitute it, such as a letter and its sections. |
| `collection` | Several subjects considered together, with declared membership and ordering. |
| `name` | How a thing is referred to, distinct from its immutable identity. |
| `quality` | A property such as colour, shape, tone or duration, with a declared value space (§4.4). |
| `quantity` | A number, unit-bearing measurement or count over an identified population. |
| `relation` | A condition involving related subjects, such as containment or connection. |
| `place` | Location in a coordinate frame, sequence or typed relation (§4.7). |
| `time` | An instant, duration or temporal relation (§4.7). |
| `belonging` | Ownership or participation. |
| `change` | A transition between states (§4.6). |
| `act` | A requested change (§4.6). |
| `role` | A named position in an act or relation. In “move the duck to the lake”, the duck is the moved object and the lake is the destination. |
| `manner` | A constraint or preference on how something is done: “neatly” or “formally”. |
| `cause`, `purpose` | Why something happens or the goal it serves. |
| `topic` | What content is about. |
| `statement` | An assertion with a declared role: fact, norm, ordinary value, preference, requirement or assumption (§§5.1, 6.6). |
| `negation`, `scope` | What is negated and which subjects a condition covers: all, some, none or each. |
| `agent` | An actor, such as a person or a system. |
| `resource` | Something whose capacity or availability can be consumed, such as space, time or equipment. |

## 4.4 Conceptual spaces

**Problem.** `enum=red enum=blue enum=green` validates three symbols but says nothing about “darker”, the distance between colours or the coordinates of turquoise. A colour space defines these operations once. A tool with a restricted palette still declares its accepted values; the library computes a compatible realization without treating that finite palette as the entire space.

A **conceptual space** defines the values and comparison operations of a property. For measurable properties, a value is a point on one or more axes; words can name regions of that space. This replaces separate handlers for every adjective with declared measurements and transformations.

| Illustrative property | Axes or structure |
|---|---|
| Size | A ratio relative to an identified reference. |
| Colour | Hue, saturation and lightness in the chosen colour model. |
| Shape | Declared measurements such as elongation or roundness. |
| Page position | Horizontal and vertical coordinates in a declared frame. |
| Time | Instants on a timeline; duration is a difference on that timeline. |
| Text length | Word count under a declared segmentation method. |
| Text tone | Measured dimensions such as formality, warmth and firmness. |

A word such as “red”, “oval” or “formal” can name a **region**. Its definition gives the relevant axes, boundaries or centre and spread. A point near a colour region's centre is a typical member; a boundary point may also belong to another region. The definition must say which membership test is used.

| General operation | What it establishes |
|---|---|
| Distance between points | Similarity under the space's declared metric. |
| Nearest admissible point | A realizable candidate near the requested value, subject to exactness and substitution policy. |
| Point membership | Whether an observed or candidate value meets a regional condition. |
| Step along an axis | A comparative change such as “darker”, “bigger” or “later”. |
| Region inclusion | Whether every value admitted by one region is admitted by another. |

Some concepts require structure rather than numeric coordinates. A letter, flow diagram or assembled object can be described by a **graph of parts, roles and constraints**. The graph states which parts may occur, their cardinalities and their relationships. It is a reusable concept description, not the current objects of one instance.

| Tutorial concept | Illustrative structural description |
|---|---|
| Letter | Salutation, introduction, body, closing and signature, with required roles and order. |
| Flow diagram | Connected steps with declared entry and exit conditions. |
| Bar chart | A diagram whose bar extents encode quantities against an axis. |
| Pond scene | Water with aquatic parts and relations to its boundary. |

Graph comparison requires two known descriptions and an alignment of their part roles (§4.4.2). An absent concept description is not a graph of zero parts. Closed enumerations remain appropriate for genuinely finite formal alternatives, such as Boolean truth values; using an enumeration must not discard meaningful comparison structure.

A region test and a candidate generator have different jobs. Given a colour point, the region test decides whether it meets “red”. To choose a colour, the compiler still needs candidates: for a finite-palette tool these are its declared palette entries; for a continuous tool a declared method may propose the region centre and other permitted points. It tests those points and ranks admissible ones by the applicable preference, such as minimum change from the current colour. Knowing that a region exists does not by itself generate a point or choose a winner.

### 4.4.1 Metrics, membership and region inclusion

A conceptual space is usable only after its comparison rules are declared. A hue difference, a spatial difference and a duration difference have different units. Normalization supplies the scale within a metric; axis weights state their contributions.

For a linear axis with distinct finite bounds and no explicit `normalisation`, use `delta = abs(a − b) / (max − min)`. When both values lie within the bounds, delta lies between 0 and 1. The default axis weight is 1. *(R18)*

For a circular axis, use the shortest circular separation divided by half the period. With `kind=angle` and `period=360`, hues 350 and 0 differ by `10/180`, approximately 0.056. Ordinary subtraction would give the wrong distance across the origin. *(R19)*

For normalized axis differences `delta_i`, the metric is `sqrt(sum(weight_i * delta_i²))`. Weights are positive. An axis irrelevant to a region is omitted from that region's restrictions, rather than assigned an undefined distance. *(R20)*

A region may constrain only some axes. A darkness condition can restrict lightness while leaving hue and saturation unrestricted. Distance to such a region uses only the constrained axes, and membership follows its declared boundaries. *(R21)*

```text
Illustrative region description; pseudocode, not SOP Lang:
space colour: axes hue [0,360), saturation [0,1], lightness [0,1]
dark: constrain lightness to [0.15,0.35]; hue and saturation unrestricted
red: constrain circular hue to [350,360) or [0,10],
     saturation to [0.8,1], lightness to [0.4,0.6]
```

In this illustrative interval-based definition, `dark` admits lightness from 0.15 to 0.35 inclusive; it says nothing about hue or saturation. `red` restricts all three axes and wraps across the circular hue origin. These are region descriptions, not new SOP wire types.

| Point `(hue, saturation, lightness)` | Membership under the interval definitions above |
|---|---|
| `(0, 0.9, 0.25)` | In `dark`; outside `red` because lightness is below 0.4. |
| `(350, 0.9, 0.5)` | In `red`; outside `dark`. |
| `(240, 0.2, 0.35)` | On the included boundary of `dark`; hue does not affect that test. |

A different region definition can use a metric ball: distance from the centre must be at most `spread`, including its boundary. For centre `(0,0.9,0.5)` and spread 0.12, `(350,0.9,0.5)` is admitted because its distance is approximately 0.056. This ball is a separate illustrative definition; interval membership and metric-ball membership must not be silently interchanged. *(R22)*

Regions may overlap. Selection uses membership; naming a value in a reply can use the closest centre under declared naming policy. A disconnected region needs an explicit union of components. The system must retain that union rather than collapse it into a larger region that admits unintended values. *(R23)*

Region inclusion needs more than checking the inner centre. Interval [4,8] has centre 6 inside [0,7], but endpoint 8 lies outside. For two balls in the same metric, `distance between centres + inner radius ≤ outer radius` is sufficient. Compare both endpoints for intervals. For more general shapes, use an inclusion proof supported by the space's operations; otherwise retain an undetermined result. Sampling may find a counterexample, but cannot establish universal inclusion. A free inner axis must also satisfy any outer restriction: `dark` is not included in `blue` simply because an illustrative centre is blue. *(R24)*

The justification of inclusion names the definitions and metric and is invalidated when they change. Finding a blue object instead applies membership to that object's observed colour. The distinction prevents a common wrong shortcut: a blue centre in the definition of “dark” cannot make every dark object blue. The compiler chooses the test from the relation being asked about—point membership or region inclusion—not from whichever calculation is available.

When admissible candidates tie, retain them and apply declared ranking policy. A reversible operation with an omitted value may choose a stable candidate, retain the alternative and report its assumption. An exact request for 10:30 is satisfied by neither 10:00 nor 11:00; those are alternatives, not silently revised requirements. *(R25)*

For an unbounded linear axis, division by `max−min` is undefined. Use an explicit positive `normalisation` scale (§8.2.1). Circular axes continue to use half their period. For bounds 0 and 100, values 20 and 30 have normalized difference 0.1; that arithmetic comes from the axis declaration, not the spelling of a property name.

### 4.4.2 Concept structure and reuse through specialization

A concept graph declares part kinds, cardinalities and labelled relationships. Minimum cardinality 1 makes a part required; maximum cardinality bounds its permitted occurrences. Relationship labels can represent ordering, containment or connection. *(R26)*

For the illustrative overlap measure used here, align corresponding roles, count the shared parts and relationships, and divide by those present in at least one graph. Required parts have weight 2 in both intersection and union; other parts have weight 1. The score lies between 0 and 1. It answers questions such as “which document genre does this structure resemble?” only when both descriptions and their alignment are available. *(R27)*

| Available knowledge | Library behaviour |
|---|---|
| No grounded candidate for the requested concept | Preserve the unresolved role and its source. A compatible lexical or contextual hypothesis can be ranked, but no structural distance can be invented for an unknown graph. |
| Known specialization without its own composition graph | Reuse an applicable ancestor graph, retain the requested semantic kind and disclose the realization chosen. |
| Known concept with its own composition graph | Use that graph and its applicable constraints. |

Missing structural knowledge is different from missing a specialized realization. A known kind can reuse an ancestor's construction without being reclassified as that ancestor. If no plausible usable interpretation is grounded, report the unresolved obligation rather than fabricate a structure. *(R28)*

Equally specific sources can supply different graphs. Retain both, rank their compatibility with the request and instance, and record the chosen graph and uncertainty. File order is not semantic evidence. Correspondence is based on concepts and roles, not local declaration IDs: differently labelled sections can play the same role, and identical labels can play different roles.

To construct a whole from such a graph, bind each required role to either an existing part explicitly selected by the request or a new part goal. Cardinalities constrain how many bindings the role admits. Relationship requirements then connect those bindings: a flow edge needs the returned identities of its endpoint parts, and a signature role needs its declared parent document. Only after those obligations are instantiated do layout and other numerical methods receive the resulting parts. Structural resemblance can suggest a genre candidate; it does not authorise adding missing parts to a document that was only being classified.

### 4.4.3 Coordinate frames and temporal semantics

A position needs a frame; a local clock time needs a date and timezone. These dependencies must survive transfer between Worlds. Position, geometric relation, instant and recurring series are separate structures with separate checks.

Every spatial frame declares origin, axis directions and unit. In the page tutorial, the origin is top-left, x increases rightward and y downward. “Above” therefore corresponds to a smaller vertical coordinate. This convention is an example declaration, not a universal coordinate system. A contained object's coordinates remain in the declared page frame unless an explicit local-frame transform says otherwise. *(R44)*

Spatial relations have declared tests. In one tutorial policy, “near” bounds edge-to-edge distance by 0.15 of the page diagonal. In another, “above” requires vertical separation and horizontal overlap. Such thresholds and geometric choices belong to the relation definition, not a JS branch recognizing a word. *(R45)*

**Knowledge World — `page-relations/knowledge.sop`.**

<!-- sop-world id=page-relations.knowledge role=knowledge module=book.page-relations -->
```sop
@space.page w.legend.space name=page form=axes version=1
@rel.above w.legend.relation name=above space=$space.page test=page.above
@book.use.page-relations.knowledge.w.legend core.use world=w.legend
@book.page-relations.knowledge.module core.module name=book.page-relations
```

Here `space` references the page space and `test=page.above` names the geometric function contract. The function needs observed bounds for object and target in the same frame. In this example it returns true when the object's bottom is no lower than the target's top and their horizontal projections overlap by a positive length. Missing bounds produce an undetermined result. Naming a test does not supply its implementation.

| Observed bounds | Result of the declared `above` test |
|---|---|
| Object bottom 20, target top 30, positive horizontal overlap | True. |
| Object bottom 20, target top 30, disjoint horizontal projections | False: vertical order alone is insufficient. |
| Target bounds unavailable | Undetermined. |

For a scheduling example, store an absolute start instant and a duration. Interpret human clock times in the declared timezone. Use half-open intervals `[start,end)`: an event ending at 11:00 does not overlap one starting at 11:00. *(R46)*

Resolve local time with its date, timezone and timezone rules. A nonexistent seasonal-transition time cannot become an executable timestamp; report the conflict and admissible alternatives. A repeated local time has two offset candidates. Context and declared policy can choose a reversible interpretation with its offset and uncertainty retained. A tool never receives an unresolved clock-time ambiguity. *(R47)*

A recurrence retains its repetition rule, timezone and exceptions. Occurrences have stable identities. Editing one occurrence differs from editing a series or the occurrences after a boundary. Conflict checks expand only an identified finite horizon: checking eight occurrences proves nothing about all future occurrences. Persistent relations link each occurrence to its series and applicable exceptions. *(R48)*

A declared occurrence-level default can interpret an unqualified reversible “move the Monday meeting” without changing the entire series. Record the selected scope. Undo restores the affected rule, exceptions and occurrence identities. “Monday at ten” alone is not sufficient persistent temporal information.

### 4.4.4 Explicit relative amounts and measured relations

A relative change defines its result from an observed baseline. Its contract identifies operation, amount, unit, reference state and any fixed anchor. Without an anchor, shortening an interval could move its start, end or both. The applicable policy belongs to the kind and property; the request may override a default explicitly.

**Knowledge World — `duration-policy/knowledge.sop`.**

<!-- sop-world id=duration-policy.knowledge role=knowledge module=book.duration-policy -->
```sop
@policy.duration std.change.policy kind=meeting concept=duration anchor=start unit=minute
@book.use.duration-policy.knowledge.std.change core.use world=std.change
@book.duration-policy.knowledge.module core.module name=book.duration-policy
```

This meeting-duration policy keeps the start fixed. A size policy could instead keep an object's centre fixed. `kind` and `concept` identify applicability, `anchor` names the fixed reference and `unit` fixes the measure. LIB resolves these declarations, filters incompatible policies and ranks compatible ones by specificity and context. An explicit anchor wins over a default. Both endpoints cannot stay fixed while duration changes.

For “shorten the review by 15 minutes”, assume `review` identifies one event in the scheduling instance:

**Instance World — `duration-change/request.sop`.**

<!-- sop-world id=duration-change.request role=instance -->
```sop
@source.shorten std.request.source text="shorten the review by 15 minutes"
@request.shorten std.request act=change mood=do source=$source.shorten
@target.review std.request.target request=$request.shorten mode=existing kind=meeting name=review
@change.duration std.request.constraint request=$request.shorten target=$target.review concept=duration operator=delta value=-15 unit=minute baseline=before anchor=start character=requirement polarity=positive source=$source.shorten
@book.use.duration-change.request.std.request core.use world=std.request
```

`operator=delta` requires the final value to equal the baseline plus the signed amount after unit conversion. `baseline=before` means the observed pre-step version, not a freshly shortened value on each retry. `anchor=start` retains the start and derives the end. Retries correlate with the operation identity; they do not repeat the semantic subtraction.

| Baseline or variant | Calculation and obligation |
|---|---|
| [10:00,11:00), shorten by 15 minutes | Duration 60 becomes 45; start stays 10:00 and end becomes 10:45. |
| Same request with explicit fixed end | End stays 11:00; duration is 45 and start becomes 10:15. |
| Initial duration 10, shorten by 15 | Result −5 is invalid. Do not silently replace an exact result with zero. |
| “Twice as long” | `operator=factor value=2`; dimensionless multiplication on a ratio scale. |
| “20% shorter” | Factor 0.8, not subtraction of 20 minutes and not an additional default step. |

For “every meeting on Friday”, resolve the date and timezone, bind the selected collection, and apply the same constraint to every member (§10.3.1). Check all constraints, including participants, resources and minimum durations. Civil-day membership differs from duration arithmetic; a civil day need not always have the same elapsed length. An incompatible member cannot be omitted from “every” to claim success.

A measured relation additionally identifies the endpoints or boundaries and the unit:

**Instance World — `reminder/request.sop`.**

<!-- sop-world id=reminder.request role=instance -->
```sop
@source.reminder std.request.source text="put a reminder 10 minutes before the review"
@request.reminder std.request act=make mood=do source=$source.reminder
@target.reminder std.request.target request=$request.reminder mode=new kind=reminder
@target.meeting std.request.target request=$request.reminder mode=existing kind=meeting name=review
@relation.reminder std.request.constraint request=$request.reminder target=$target.reminder concept=time operator=relation relation=before goal=$target.meeting measure=10 unit=minute from=instant to=start character=requirement polarity=positive source=$source.reminder
@book.use.reminder.request.std.request core.use world=std.request
```

`from=instant` names the reminder's instant, `to=start` the event's start and `measure=10` the exact directed difference. An event starting at 10:00 therefore requires 09:50. A mere “earlier than” test would wrongly admit 09:00. “At least 10 minutes before” asks for a lower bound on that directed difference, not the equality represented by `measure=10`. Its request and method must explicitly represent and evaluate that bound; adding an undeclared `comparison` field to this example is not valid SOP. Missing times or endpoint definitions leave the check undetermined.

The same mechanism supports “2 cm left of the house” after geometric endpoints and frame conversion are declared, or “two paragraphs after the introduction” with discrete sequence distance. The primitive does not infer units or endpoints from message words. A created reminder captures the calculated instant; automatically following a later event move requires an explicit persistent dependency.

In both examples, interpretation fixes the relation and endpoints before arithmetic starts. A reminder's event-start role selects the observed start instant; subtracting ten minutes gives a concrete candidate time. A geometry example must first choose whether “left of” measures edges or centres. Running the same subtraction on the wrong endpoint can return a finite, typed number while still implementing the wrong relation.

### 4.4.5 Aggregated properties and equality to a reference value

A whole's property may be derived from parts. Declare the selected population, each contribution, aggregation operator and completeness conditions. A palette, summed duration and busiest day are different operations even though each is an aggregate. `core.aggregate` supplies machinery, not their domain meanings.

For this tutorial, define palette as the set of distinct fill colours of visible shapes in one drawing, excluding outlines, background and hidden shapes. An area-weighted colour distribution would be a different property with different equality.

| Input and operator | Result |
|---|---|
| Red, red and blue fills; distinct set | `{red, blue}`. |
| Durations 30 and 60; sum | 90 minutes. Occupied clock time instead needs interval union when events overlap. |
| Two days tied for maximum count | Both days; selecting one requires another declared criterion. |
| Complete empty collection | Empty palette and duration sum zero; no maximum member. |
| Relevant shape with unknown fill | Palette remains incomplete; observed colours do not prove other colours absent. |

Compare typed values after normalization, not label spelling. Perceptual similarity uses the declared metric and tolerance and is not exact equality. One hour and sixty minutes compare after unit conversion.

“Make the diagram's colours match the drawing” refers to a property of an existing source, not a literal colour:

**Instance World — `palette-match/request.sop`.**

<!-- sop-world id=palette-match.request role=instance -->
```sop
@source.match std.request.source text="make the diagram's colours match the drawing"
@request.match std.request act=change mood=do source=$source.match
@target.diagram std.request.target request=$request.match mode=existing kind=diagram determiner=definite
@target.drawing std.request.target request=$request.match mode=existing kind=drawing determiner=definite
@reference.palette std.request.value target=$target.drawing concept=palette
@constraint.palette std.request.constraint request=$request.match target=$target.diagram concept=palette operator=same value=$reference.palette scope=group polarity=positive character=requirement source=$source.match
@book.use.palette-match.request.std.request core.use world=std.request
```

`std.request.value` describes a value to obtain: `target` names the source and `concept` its property. It is neither the palette nor an observation. Resolve the source identity, obtain a typed palette over a collection with known coverage and retain its World, version and derivation. Only that result becomes the destination constraint. Multiple source drawings remain ranked hypotheses; missing evidence does not authorize inventing a palette.

If the source is `{red, blue}`, a three-node destination coloured red/blue/blue satisfies palette equality; red/red/red does not. Equality requires both set inclusions. “Use only colours from the drawing” requires only destination inclusion and must remain a different predicate.

Palette equality does not choose which node becomes red. Declared legibility constraints and preferences such as minimizing changes rank the possible distributions. A single node permitting one fill cannot realize two colours without another authorized change. Do not create an unrequested node to conceal that conflict.

The source value is a planning snapshot. Later source edits do not automatically recolour the destination; refresh requires a new read and derivation. Circular property dependencies need an anchored value or remain unresolved. Execute only the authorized destination changes and verify the observed palette afterward.

## 4.5 Degree words

“Big” has no context-free numeric value. A large component in one assembly may be small in another. Degree words such as “big”, “small”, “huge”, “short”, “long” and “many” instruct a calculation relative to a **comparison class**. Concrete state retains the resulting measurement; the request and trace retain the qualitative instruction.

Candidate baselines come from compatible current instances, accepted user history, ordinary values for the kind and context, or available capacity. Their precedence is a declared policy. In the tutorial policy used below, the first applicable source in that order supplies the baseline. A current object is relevant only if its kind, property, units and context are compatible.

An initial degree factor is also declared data, not a universal constant: the example uses 1.6 for “big”. Comparatives such as “bigger” use the current value and a declared step. A correction episode can adapt a local preference, but a single adjustment does not prove which parameter caused dissatisfaction.

### 4.5.1 Contextual comparison and preference adaptation

The tutorial baseline is the median measurement of compatible members. With one member, use that value; with none, try the next baseline source. Retain member identities and the selected source. The matching conditions define compatibility before calculation: same measured property, compatible kind, unit and relevant context. Two equally applicable baseline sources remain alternatives under the declared precedence/tie policy; their file order does not choose the meaning of “big”. *(R29)*

An axis's scale determines legal operations. A ratio scale has a meaningful zero and supports multiplicative factors. An interval scale supports additive differences. The names “late” and “high” can denote regions on an interval axis; multiplying a clock time by 1.6 would not interpret them. *(R30)*

`step` declares a comparative step. For a ratio scale it is a factor, 1.25 in the example; for an interval scale it is an amount in the axis unit. A declared intensifier can request two steps. No such number follows from the word alone. *(R31)*

**Knowledge World — `size/knowledge.sop`.**

<!-- sop-world id=size.knowledge role=knowledge module=book.size -->
```sop
@sp.size w.legend.space name=size form=axes version=1
@ax.size w.legend.axis of=$sp.size name=ratio order=0 kind=linear unit=$unit.size min=0 max=10 scale=ratio step=1.25
@unit.size w.legend.unit name=ratio of=$ax.size factor=1 offset=0
@book.use.size.knowledge.w.legend core.use world=w.legend
@book.size.knowledge.module core.module name=book.size
```

The axis belongs to `$sp.size`; its canonical unit belongs to that exact axis. An upward step from 2 gives 2.5, and a downward step gives 1.6. Bounds 0 and 10 apply only to this example space. An interval-scale step would add or subtract rather than multiply or divide.

After calculation, check tool limits and the request's exactness policy. If the allowed realization is already at its limit, no mutation occurs; report the limit without claiming an enlargement. Clamping is not permission to replace an exact requirement silently. *(R32)*

An adjustment episode records subject, property, baseline and initial factor. Subsequent comparative corrections of the same property continue it. The first message that no longer corrects that value closes the episode; silence alone does not. Under the illustrative learning rule, the final value counts as operational acceptance and updates the factor once. *(R33)*

| Message and state | Object effect and learning effect |
|---|---|
| “A big fish”, baseline 1, factor 1.6 | Size becomes 1.6; retain baseline and initial factor. |
| “Bigger”, step 1.25 | Size becomes 2.0; preference is not yet changed. |
| “Bigger” | Size becomes 2.5; episode stays open. |
| Request about a different object | Close the episode: accepted factor 2.5; new factor `(1.6+2.5)/2 = 2.05`. |

The example rule is `accepted_factor = final_value / initial_baseline`, followed by `new_factor = (initial_factor + accepted_factor) / 2`. It requires a positive ratio baseline. Baseline 2 and final value 4 imply factor 2, not 4. Intermediate corrections are not independent votes.

Operational acceptance does not prove that the factor was wrong: the comparison class may have been inappropriate. Retain both. An external edit, execution failure or undo before closure invalidates the episode. Tool saturation does not establish preference for the limit. A no-op must not manufacture an execution claim or learning update.

A learned factor is a fact with source, user/profile scope and applicable World kind. Undo of the producing episode withdraws the dependent update. It never automatically becomes shared knowledge. A policy for another learning rule must declare its own update and rollback semantics. *(R34)*

## 4.6 Changes and acts

An operation name is not a semantic definition. To justify an act, the library needs its roles, preconditions, required final conditions and permitted effects. These declarations let one reasoning mechanism elaborate acts across domains and let observation verify what actually happened.

| Basic change | Meaning |
|---|---|
| `appear` | A subject absent before is present afterward. |
| `disappear` | A previously present subject is absent afterward. |
| `quality` | The subject persists while a property changes. |
| `relation` | The subject persists while a relation changes. |

An **act** requests a change. The four basic acts below have domain-independent definitions; domain methods supply their realization through declared capabilities.

| Act | Roles and conditions |
|---|---|
| `make` | Result; afterward the result exists. |
| `remove` | Object; it exists before and is absent afterward. |
| `change` | Object and property; the object exists before and has the requested value afterward. |
| `place` | Object and destination; the object exists before and satisfies the requested relation afterward. |

These definitions support composition and effect checking. An indefinite new object can require creation before placement; an existing named object must first be resolved. “Copy”, “swap” and “replace” compose changes under explicit policies (§4.6.1). Language forms such as “draw”, “add”, “create”, “write” and “schedule” can map to creation in compatible contexts; their lexical mappings do not themselves choose tools or erase domain distinctions.

### 4.6.1 Act semantics and change composition

An act describes a desired difference between states. Roles are named positions to bind to subjects, values or requirements. The before and after conditions use those bindings; explanatory prose is not an executable predicate. *(R35)*

| Condition | Meaning |
|---|---|
| `kind=exists object=<role>` | The role's subject exists in the observed population. |
| `kind=absent object=<role>` | It is absent from a population with sufficient coverage. |
| `kind=has object=<role> quality=<role>` | It has the value bound to the property requirement. |
| `kind=holds object=<role> goal=<role>` | The requested relation holds between the bound subjects. |

**Knowledge World — `acts/knowledge.sop`.**

<!-- sop-world id=acts.knowledge role=knowledge module=book.acts -->
```sop
@condition.result w.legend.condition kind=exists object=result
@condition.exists w.legend.condition kind=exists object=object
@condition.absent w.legend.condition kind=absent object=object
@condition.quality w.legend.condition kind=has object=object quality=quality
@condition.relation w.legend.condition kind=holds object=object goal=goal
@act.make w.legend.act name=make change=appear role=result after=$condition.result
@act.remove w.legend.act name=remove change=disappear role=object before=$condition.exists after=$condition.absent
@act.change w.legend.act name=change change=quality role=object role=quality before=$condition.exists after=$condition.quality
@act.place w.legend.act name=place change=relation role=object role=goal before=$condition.exists after=$condition.relation
@book.use.acts.knowledge.w.legend core.use world=w.legend
@book.acts.knowledge.module core.module name=book.acts
```

Conditions have their own declaration identities. Their role names are not object identities. `object=object` refers to the role called `object`; a concrete request later binds it. `holds` obtains the relation from the request, allowing containment, support or proximity without an invented default relation.

An acceptable act definition has valid role and condition references: every role used by a condition belongs to its act, and the act has at least one final condition. This defines what a successful transition would mean. It does not yet provide a method for achieving it.

A method must connect that desired transition to capabilities. For placement of a new object, the compiler first binds the requested object and destination roles. The placement precondition requires the object to exist. When the request authorises creation, an applicable creation method can produce that object; its returned identity then supplies the placement call. If the request refers to an existing named object, creation is not a substitute for failed reference resolution. Finally, observations are checked against the requested relation. An `absent` condition requires coverage evidence; merely failing to find a subject in a partial read cannot establish it.

Only declared effects and their justified consequences may change. Any additional observed difference is an unexpected effect and must be retained and reported. *(R36)*

Creation to satisfy a missing referent requires authorization. “Put a child on the swing” can introduce a new child; “put the child” or “put Tom” denotes an existing subject. If no compatible existing subject is found, do not silently create a substitute. Explicit structural completion is a separate authorized case (§6.4.1). *(R37)*

“Copy” creates a new identity with compatible kind/properties and the reference-copy policy of §2.4.1. “Swap” places each object at the other's position read from the shared pre-state. “Replace A with B” creates B at A's location, transfers only compatible authorized relations and removes A. New identity and effect scope remain explicit. *(R38)*

Decomposition is bounded. In the basic existence-before-placement case, creation satisfies `exists` without requiring another existence-producing act. More general methods retain visited act/subject combinations, dependency cycles and search limits. A repeated unresolved subgoal must not recurse indefinitely. These mechanisms do not claim that every planning problem has a two-step solution. *(R39)*

For a position swap, both positions are captured before either move. Reading the first object's new position during the second move would place both at the same location. The circuit therefore retains the baseline, dependencies and undo group. Existence of both subjects alone does not prove the moves feasible; tool capability, destination constraints and post-observations are still required.

A decomposition therefore needs more than a list of act names. It binds roles between steps, states which observations are shared baselines, and specifies which returned values feed later arguments. In the swap, positions come from the same pre-state; in create-then-place, identity comes from the creation result. These are different data dependencies even if both circuits contain two calls.

### 4.6.2 Changing semantic kind while preserving identity

Semantic classification and structural type are distinct. A generic subject can have a semantic-kind property without replacing its wire type. A kind change requiring another structure includes a validated migration; assigning a new word does not bypass schema checks.

| State component | Required treatment |
|---|---|
| Identity and provenance | Preserve identity when a valid migration allows it; record the new classification's source and revision. |
| Compatible values | Retain only when meanings and units remain compatible and the new schema accepts them. |
| Incompatible values or parts | Expose them in the candidate difference; withdraw assumptions only under declared policy. Do not erase explicit requirements silently. |
| Incoming and outgoing relations | Recheck both directions; identity preservation does not validate every old relation. |
| Newly required information | Complete from declared sources and validate before committing. |

A paragraph changed into a heading can retain identity and text, while an incompatible footnote role must be changed explicitly. Failed migration must not secretly delete the paragraph and create another object. `replace` is the new-identity operation. Approximate reference matching (§6.4.1) identifies a candidate; it does not authorize a kind change. Reusing an inherited drawing realization likewise leaves semantic kind unchanged.

## 4.7 Linking a World to the legend

A type or slot participating in semantic elaboration must link to its declared concept. `is` identifies a type's concept; `means` identifies a slot's concept and `space` may link its value space. Technical bookkeeping fields do not need invented conceptual meanings. Each semantic operation reports any missing information it actually requires.

A semantic link must resolve unambiguously. Otherwise consumers could interpret the same number differently. Link validation proves the concept identity, while operation contracts define measurement and transformation.

**Knowledge World — `sample-legend/knowledge.sop`.**

<!-- sop-world id=sample-legend.knowledge role=knowledge module=book.sample-legend -->
```sop
@concept.thing w.legend.concept name=thing
@concept.quality w.legend.concept name=quality
@space.size w.legend.space name=size form=axes version=1
@book.use.sample-legend.knowledge.w.legend core.use world=w.legend
@book.sample-legend.knowledge.module core.module name=book.sample-legend
```

**Schema World — `sample-links/schema.sop`.**

<!-- sop-world id=sample-links.schema role=schema module=example uses=sample-legend.knowledge -->
```sop
@type.sample core.type of=example.sample is=thing
@slot.sample core.slot of=example.sample key=value kind=number means=quality space=size
@book.use.sample-links.schema.book.sample-legend core.use world=book.sample-legend prefix=false
@book.use.sample-links.schema.w.legend core.use world=w.legend
@book.sample-links.schema.module core.module name=example
```

The schema block explicitly imports the preceding knowledge module and the `w.legend` metamodel. The knowledge module owns the concepts and size space; the schema only links its type and slot to them. An atom such as `quality` resolves to exactly one public concept name in that declared context; zero or multiple matches fail. `means=$concept.quality` chooses the exact identity and survives a public-label change. Quoted text does not become a reference. Names are resolved across the loaded World, without a hidden current-namespace preference.

Revalidate links against the final transaction state. Deletion, renaming or introduction of a competing public name cannot leave the schema linked to a missing or ambiguous declaration; failure restores the previous state. The resolved identity is retained separately from the author's spelling. This check does not prove that a numeric value belongs to the space or that a comparison has been performed.

| Concept | Information required by the applicable method |
|---|---|
| Kind | Classification and identity, not a display-label guess. |
| Name | Naming scope and distinction from identity. |
| Quality | Space and measurement, such as size, colour, shape or tone. |
| Quantity | Unit or counted population, coverage and duplicate policy. |
| Place | Coordinate frame, discrete order or typed relation. |
| Time | Instant, duration, interval, recurrence or occurrence boundary. |
| Part | Whole identity, role, cardinality and structural constraints. |
| Role | Owning act/relation and the named position. |
| Topic, manner, cause, purpose | Typed content or relation consumed by the method. |

These are semantic obligations, not additional `core.slot` keys. The four tutorial slots in §4.1 illustrate the distinction:

```text
Explanatory semantic mapping; pseudocode, not SOP declarations:
Drawing position: point in page frame, concept place
Diagram position: point in diagram frame, concept place
Document order: integer in declared section order, concept place
Meeting room: typed reference to room, concept place via relation in
```

A semantic link locates applicable methods; it does not manufacture a grammar, solver or transformation. A location fragment such as “after the introduction” requires the sequence contract and contextual binding. Selection by “in the pond” requires a relation test. “Move it up” requires a subject, frame and step. A reply requires the verified resulting relation. The same concept can support these requests across domains when those specific contracts are supplied.

Place can be expressed as a point, named region, relation to another subject or change from the current position. Which forms are meaningful depends on its space: a resource relation is not a numeric axis. Temporal methods additionally distinguish instants, intervals, durations, order and repetition. “In the afternoon” uses the date and clock-time region; the general compiler does not carry a built-in definition of afternoon for every culture and context.

In the small schema above, `means=quality` identifies the semantic family and `space=size` identifies the value space. Neither declaration says how to enlarge a value, which baseline to use or which tool field implements it. Those links must come from the applicable space operation, completion policy and capability binding. This intentionally small example proves link structure; the fuller calculations in §§4.5 and 6.6 show the additional premises needed for a concrete result.

## 4.8 Declaration types of the legend World

The legend defines concepts, acts, conditions, spaces, axes, units, degrees, roles and relations. Valid declarations describe inputs to generic interpretation; they do not establish that a tool supports a requested effect.

| Declaration | Essential fields and meaning |
|---|---|
| `w.legend.space` | `name`; `form=axes` or `form=graph`; required declared `version`. A version label alone does not establish immutability. |
| `w.legend.axis` | Typed `of` space reference, axis `name`, unique nonnegative integer `order`, `kind=linear` or `kind=angle`, and typed canonical `unit`. |
| Axis limits | Optional finite `min` and `max`; if both exist, min is strictly less than max. |
| Circular axis | Positive `period` required for angle axes, in canonical units. |
| Comparative scale | `scale` and `step` occur together: a positive additive step for interval scale or a multiplicative factor greater than 1 for ratio scale. |
| Metric parameters | Optional positive `weight`; explicit positive `normalisation` replaces the linear range denominator and is needed for normalized distance on an unbounded linear axis. |
| `w.legend.degree` | `word`, explicit `direction=up` or `down`, finite positive initial `factor`. |
| `w.legend.condition` | A structured condition and its arguments as defined in §4.6.1. |
| `w.legend.act` | `name`, basic `change`, repeated named `role`, optional typed `before` conditions and at least one typed `after` condition. |

A numeric parameter is finite. Alternative units may use a signed offset and positive factor, supporting affine conversion. The conversion itself is a typed operation, not an automatic consequence of reading a unit name.

A region description identifies its space, constrained axes and membership rule. The explicit prose and pseudocode in this chapter do not introduce an undeclared `w.legend.region` wire type. A concrete region schema and evaluator contract are required for executable region declarations. Membership and entire-region inclusion remain distinct.

The following colour declarations illustrate valid spaces, axes and units without claiming to perform a point-membership test:

**Knowledge World — `colour/knowledge.sop`.**

<!-- sop-world id=colour.knowledge role=knowledge module=book.colour -->
```sop
@sp.colour w.legend.space name=colour form=axes version=1
@ax.hue w.legend.axis of=$sp.colour name=hue order=0 kind=angle period=360 unit=$unit.degree min=0 max=360
@ax.saturation w.legend.axis of=$sp.colour name=saturation order=1 kind=linear unit=$unit.saturation min=0 max=1
@ax.lightness w.legend.axis of=$sp.colour name=lightness order=2 kind=linear unit=$unit.lightness min=0 max=1
@unit.degree w.legend.unit name=degree of=$ax.hue factor=1 offset=0
@unit.saturation w.legend.unit name=ratio of=$ax.saturation factor=1 offset=0
@unit.lightness w.legend.unit name=ratio of=$ax.lightness factor=1 offset=0
@book.use.colour.knowledge.w.legend core.use world=w.legend
@book.colour.knowledge.module core.module name=book.colour
```

`of` and `unit` are typed references, not approximate text matches. The two units named `ratio` belong to different axes and are not merged. Axis orders are unique within a space but need not be consecutive. The canonical unit belongs to the exact referring axis and has factor 1, offset 0. Circular axis/unit references load atomically. Shared axis declarations cannot evade uniqueness by moving to another namespace; different spaces may reuse the same labels.

A complete point satisfies the declared axes and units. A graph space uses typed parts and relations rather than pretending they are numerical coordinates. Cross-frame comparison requires explicit origin, orientation and scale conversion.

```text
Illustrative region description; pseudocode, not SOP Lang:
space: colour defined by sp.colour
red: hue in [350,360) or [0,10], saturation in [0.8,1], lightness in [0.4,0.6]
```

A region definition supplies a test; a degree definition supplies a transformation relative to a baseline. Loading their names alone performs neither operation.

### 4.8.1 The conceptual metamodel and loading order

The legend supplies vocabulary through which independent schemas declare meaning. Without links, `at`, `position` and `start` are local labels. Their declared concepts and spaces allow the library to select valid operations.

| Declaration | Meaning |
|---|---|
| `w.legend.concept` | `name`, optional organizing `group`, optional typed `specialises` parent and explanatory `question`. |
| `w.legend.role` | `name` and typed `of` reference to its act or relation. |
| `w.legend.relation` | `name`, optional typed `space`, optional typed `inverse` and a `test` function-contract name. |
| `w.legend.unit` | Required `name`, typed axis `of`, positive `factor` and finite `offset`; canonical conversion is `canonical_value = factor × value + offset`. |

These declarations are written with the language primitives; they do not presuppose their own semantic interpretation. *(R15)*

The loading chain begins with fixed language rules for `core.type`, `core.slot`, references and variables. Those rules let the `w.legend` schema define what a concept or axis record contains. A knowledge World then supplies particular concepts and spaces conforming to that schema. A domain schema links to those records, and instance facts conform to the domain schema. There is no recursive requirement to understand the word “concept” before the structural schema can be loaded.

**Knowledge World — `concepts/knowledge.sop`.**

<!-- sop-world id=concepts.knowledge role=knowledge module=book.concepts -->
```sop
@concept.entity w.legend.concept name=entity group=basic question="What exists?"
@concept.component w.legend.concept name=component specialises=$concept.entity
@degree.large w.legend.degree word=large direction=up factor=1.6
@relation.connected w.legend.relation name=connected inverse=$relation.connected
@role.endpoint w.legend.role name=endpoint of=$relation.connected
@book.use.concepts.knowledge.w.legend core.use world=w.legend
@book.concepts.knowledge.module core.module name=book.concepts
```

A concept has at most one specialization parent and no cycles. Removing an edge invalidates its dependent specialization conclusions. `group` organizes vocabulary and `question` explains a concept; neither answers a user's question by itself.

Role names are unique within their owner, even across namespaces. An act role record must name a role already admitted by the act's role list; a relation role record introduces its role name. Typed ownership distinguishes different acts with the same display label.

A symmetric relation may be its own inverse. If both sides declare inverses, they must be reciprocal; if both declare spaces, they reference the same space. A unilateral declaration need not fabricate the reciprocal one. Unmeasured relations may omit space. A `test` name still requires a separately defined function signature and implementation.

Loading follows dependency layers: language primitives define the metamodel; the metamodel supports schema/knowledge declarations; instance Worlds use those schemas. This order avoids defining `means` in terms of itself. It is a semantic dependency order, not a claim that every application has exactly four Worlds or four architectural boxes. *(R16)*

A slot's principal concept and its refinements must be consistent. Duration specializes time; participation supplies a role; sequence position is a location in an ordered space. Consequences follow their declared relationships rather than competing annotations or duplicate facts. Notation in explanatory prose does not add undeclared slot keys. *(R17)*

These sources also show where compactness comes from. The unit and axis are separate records because other declarations reference them and they have independent contracts. The numeric factor, offset, bounds and version remain direct values on those records; each number does not need another identity. A colour space is declared once in its knowledge World and imported by consumers. Repeating its full declaration beside every coloured instance would increase text without adding meaning.

# 5. World roles and composition

## 5.1 Schema, knowledge and instance Worlds

World roles identify what declarations contribute and how they are reused. They do not name application tabs or prescribe how many Worlds a system contains.

A **schema World** declares allowed types, slots, relationships, rules and restrictions. A **knowledge World** records reusable concepts, ordinary values, constructions and methods. An **instance World** records particular subjects and their current state. Knowledge Worlds themselves conform to schemas. An organizing project or session World is also an instance of a schema, not a fourth semantic role.

For example, a scheduling schema defines an event's required temporal fields; knowledge defines a context-dependent ordinary duration; an instance records a particular event at a particular time. In a manufacturing application, the same distinction separates component schemas, assembly knowledge and a specific work order. Neither example defines the general World model.

An instance changes when an observed or authorized state change occurs, including a tool action or external event. It does not change merely because a person sends a message. Imports share declarations through explicit dependencies; they do not copy all knowledge into every instance. A catalogue entry is not evidence that a declaration participated in reasoning.

| Knowledge role | Use |
|---|---|
| Domain fact | Supports conclusions about a kind or relationship, with source and applicability. |
| Norm | Defines expected structure or behaviour to check under a declared strength. |
| Ordinary value | Completes an omission; it does not override an explicit requirement. |
| Heuristic | Ranks otherwise admissible choices within its stated context. |

A statement's content and its strength in an application are distinct (§3.6.1). A fish habitat fact may support a soft drawing preference; it does not make a deliberately drawn fish in the sky structurally invalid. An ordinary one-hour duration is a candidate completion, not a universal event invariant.

Reusable schemas and knowledge are published with stable names, versions, validated interfaces and licences. [sop-knowledge-worlds](https://github.com/ml-circuits-research/sop-knowledge-worlds) holds reusable declarations for this project. Application Worlds declare the relevant imports and bindings. A shared vocabulary may describe drawing as a concept; it must not depend on a particular demo tab or UI implementation.

During one request, these roles meet in an evaluation context without losing their owners. If a schema requires duration, a knowledge policy proposes 30 minutes, and an instance records a free interval, the compiler can combine those premises into a candidate event. The chosen duration carries the policy as its source; it is not recast as something the user said or copied back into the shared policy. The eventual event and its observed times belong to the destination instance.

## 5.2 Semantic specialization and reuse

A semantic classification relates kinds from general to particular. A duck can specialize bird and animal; a letter can specialize text; a bar chart can specialize diagram. The classification is shared by compatible Worlds rather than copied into each tool. Other classifications, properties and roles remain explicit relationships instead of becoming hidden second parents.

The tutorial's single-parent specialization model supplies one lineage for inherited semantic definitions. It does not imply that all useful relationships form one tree. Subtype membership, part–whole composition, observed properties and contextual roles remain distinct.

| Reused declaration family | Meaning |
|---|---|
| Applicable capabilities | Reuse an operation only when its declared type and state preconditions apply to the specialization. |
| Realization | A known kind may use an applicable ancestor's construction when no more specific realization is available. Preserve its semantic kind and disclose the chosen approximation. |
| Ordinary values and structure | Inherit applicable defaults and parts; declare only the specialization's differences. |
| Vocabulary | A reference to a general class can include known specializations under declared lexical semantics. |

A taxonomy edge alone does not provide a tool implementation. A request for an unsupported construction is not satisfied by inventing one. In the drawing tutorial, using a generic bird realization for a known duck does not turn the semantic object into a bird-only object; later references still use the requested classification.

### 5.2.1 Structural inheritance, semantic knowledge and realization

Structural type controls valid facts; semantic kind classifies represented things; realization supplies a concrete construction or presentation. Reuse at one level must not silently alter another.

| Mechanism | Location and contribution |
|---|---|
| Structural inheritance | Schema `core.type extends=`; slots, rules and restrictions. |
| Semantic specialization | Knowledge lineage; applicable parts, defaults and lexical relations. |
| Realization reuse | Declared capability/construction binding; concrete representation under compatible constraints. |

Structural inheritance can import slot groups without assigning extra semantic parents. If `item` keeps parent `base` but replaces slot-group membership `left` with `right`, queries and rules must see `right` and stop seeing `left`. A rejected transaction restores schema and indexes together. Structural changes do not reinterpret coordinates in a different semantic space.

In the single-parent model, property-defined collections and inferred roles are not additional kinds: “red things” is a property selection, “start nodes” an inferred role and “things that float” a knowledge predicate. *(R40)*

A more specific applicable ordinary value or norm overrides its ancestor's corresponding definition under declared precedence. Competing knowledge sources remain alternatives requiring ranking or conflict resolution; a single parent does not eliminate source disagreement. *(R41)*

A restriction is valid only when its admitted states remain within the parent's admitted states. Region inclusion or bounds containment must be checked. A hard invariant cannot be weakened by a descendant or a request. A soft preference may yield to an explicit requirement. *(R42)*

A specific declaration is useful when it adds or changes knowledge relative to the ancestor. Repeating an identical value across siblings is a consolidation signal: move it to the appropriate common ancestor when its applicability is genuinely shared. Duplicate detection must preserve independent provenance rather than discard evidence solely because values match. *(R43)*

For example, bounds 1–5 can be restricted to 2–4; 0–6 would admit previously forbidden values and is invalid as a restriction. A missing specialized realization differs from an unknown concept. The explanation must retain the inherited path and chosen construction rather than a local “always draw ducks as birds” shortcut.

## 5.3 Composing Worlds

Composition combines reusable declarations and particular state without erasing their identities. It has three distinct forms.

**Import.** `core.use` loads a published schema or knowledge module. Pin its version in the project dependency context so another author's update does not silently change an existing request's meaning.

**Extension.** A separately owned schema can add its own types based on imported types and declare valid refinements through the supported schema mechanisms. Extension is not an ordinary instance edit and must respect module ownership. Compatible refinements preserve the parent's contract; an incompatible definition must be rejected before it can guide dispatch.

**Linking.** A typed slot can refer to a subject supplied by another World. The composition context makes the subject and its schema available and states permitted access. A bare label is not an identity. If a scheduling example has two people called Ana, retain both hypotheses, rank contextual evidence and pass the chosen identity to the tool. The primitive never receives “whichever Ana”.

Rules requiring facts from two Worlds belong in a declared composition context that imports or binds both. A reference alone does not grant cross-World search or write authority. For tutorial examples, this can connect calendar aggregation to a chart, insert a drawing into a document, or produce a chart of events per person. Historical snapshots and live dependencies remain distinct (§2.6.1).

For example, suppose a projection reads an event population and derives chart entries. Its rule binds each entry to a source event identity or aggregation key; it does not merge the event with a diagram node that happens to share its label. The candidate chart belongs to the destination context. After compilation, only the diagram calls may mutate that destination; the source remains a versioned read. The context's import and access links explain both which premises were available and where effects are allowed.

Reuse is the main declaration-level simplification: import a common schema once, keep shared concept/property definitions in one knowledge World, and store only instance-specific values and relationships locally. A specialized schema should state a difference from its parent rather than repeat all inherited slots. Shortening these declarations must preserve ownership, applicability and references; inventing an abbreviated syntax that the schema cannot read would only move ambiguity elsewhere.

## 5.4 Reasoning without a conversation interface

A request need not originate as natural-language text. Another program can supply a SOP request circuit directly; the same schemas, knowledge, instance binding and compilation apply. A graphical editor is another optional input adapter, not a necessary part of the theory.

Three tutorial examples isolate the general mechanisms:

| Example | Declared input and general mechanism |
|---|---|
| Validate a report | Schema and knowledge define section roles and a required conclusion. Match current parts, identify missing roles, report violated and undetermined constraints. Structural similarity can compare the document with known genres. |
| Allocate a timetable | Open time/resource values and declared constraints form a joint constraint problem. The generic solver searches compatible assignments and ranks declared preferences; it does not contain a calendar-specific semantic policy. |
| Validate a flow graph | Rules derive entry roles and reachability; constraints compare observed structure with declared graph requirements. |

These cases demonstrate validation, constrained completion and deduction. They are not a claim that every such request is solved by loading a type name. A usable request still needs the relevant declarations, complete-enough observations and capabilities for any requested effects.

---

# 6. Conversation and request compilation

This chapter specifies elaboration of a human request into an executable SOP circuit, followed by dispatch and observation. The library makes semantic decisions using declared Worlds. Tools consume their own concrete instructions; they do not interpret a plan or fill gaps in the user’s intention.

## 6.1 Connecting declared capabilities to concrete programs

A World description does not itself produce an external effect. A concrete program must perform that effect. The task is to keep that program small and connect it to the World without writing a new handler for every sentence. Four concepts define the boundary.

A **capability domain** groups operations over a declared family of objects and state. It supplies compatible instance Worlds, concrete tools and observations. Drawing, diagrams, documents and calendars are tutorial examples of such domains; neither a graphical editor nor this particular list is required by the general model.

A **tool** implements a concrete operation: create an object, change its geometry, assign a value or remove it. Its input is a typed instruction defined by its public wire contract, with concrete values and validated references. Values may include numbers, strings, booleans and structured arguments. The tool does not interpret the human sentence, choose a referent, infer “big”, rank meanings or expand a high-level plan.

A **capability** declares which general acts a domain can realise, over which kinds of objects, and which request roles it honours. In the tutorial, a drawing capability can create drawn objects while accounting for kind, count, properties and placement.

A **binding** connects a capability to a tool operation and states which resolved request role supplies each operation parameter.

**Knowledge World — `drawing-tools/knowledge.sop`.**

<!-- sop-world id=drawing-tools.knowledge role=knowledge module=book.drawing-tools -->
```sop
@use.schema core.use world=std.schema
@use.tools core.use world=std.tool
@world.drawing std.schema.world name=drawing
@k.drawn std.schema.kind of=drawn world=drawing acts=make acts=place acts=change acts=remove
@h.make std.schema.honours world=drawing act=make of=drawn on=kind on=size on=attribute on=place
@op.add std.tool.op world=drawing name=add effect=makes
@pa.kind std.tool.param op=add name=kind kind=atom required=true
@pa.x std.tool.param op=add name=x kind=number required=true
@pa.y std.tool.param op=add name=y kind=number required=true
@pa.size std.tool.param op=add name=size kind=number min=0.3 max=3 required=true
@pa.colour std.tool.param op=add name=colour kind=string required=true
@b.make std.tool.bind world=drawing act=make of=drawn op=add
@book.drawing-tools.knowledge.module core.module name=book.drawing-tools
```

This is a small illustrative interface, not a claim about a particular deployed Drawing tool. It declares a capability, an `add` operation, five typed required inputs and a binding. The library must supply `kind`, `x`, `y`, `size` and `colour` before dispatch. A full interface must also declare argument sources, coordinate meaning, output identity, preconditions, observations and undo. The `on` list describes capability coverage; it is not a replacement for ownership and scope in a structured request graph.

The interface must distinguish accepted argument types, mandatory arguments, bounds, units and coordinate frames from semantic defaults. The library resolves meanings and defaults before dispatch. Each instruction must also identify expected observable effects, outputs, preconditions and undo behavior. An operation name or `effect=makes` label alone is not a full effect contract.

Read the example from the request side. A creation goal over a compatible drawn kind can match `k.drawn` and `h.make`; `b.make` points to `add`; the five parameter records expose the arguments still required. A candidate with only `kind=fish` is therefore not executable: x, y, size and colour remain open. Completion supplies those values from separately identified policies and observations, and the argument binding must name how each resolved value reaches the operation. If that mapping is absent, the gap is the binding—not an instruction for the tool to interpret the original sentence. A capability declaration can thus help identify the next obligation without pretending the whole route is already supplied.

**Reading the interface.** A capability describes which requests can be elaborated for a domain; a binding connects that capability to a concrete operation. A parameter declaration fixes the tool-side input. The tables below describe these responsibilities. The library validates actual operation and parameter declarations before generating calls; a conceptual role is not an undeclared tool argument.

| `std.schema` type | Purpose and keys |
|---|---|
| `std.schema.thing` | Parent type for objects in a World with actionable capabilities. It declares no slots of its own. |
| `std.schema.world` | Declares a capability World. Keys: `name`, `doc`, `bundle`. |
| `std.schema.kind` | Declares acts applicable to a type. Keys: `of` (the type), `world`, repeated `acts`. |
| `std.schema.kinds` | Declares acts for kinds named by knowledge without enumerating each kind in application code. Keys: `world`, `from` (the kind-record type), `key`, `acts`, `stand_in`. |
| `std.schema.honours` | Declares which request roles a domain handles for an act. Keys: `act`, `of`, repeated `on` values such as `kind`, `count` and `place`. Semantic concepts and structured graph ownership remain distinct from this capability-coverage declaration. |
| `std.schema.limit` | Limits the number of objects of a kind. Keys: `of`, `max`. |
| `std.schema.capacity` | Declares how a containing object limits its contents. Keys: `of`, `key`, `holds`, `via`. |
| `std.schema.relation` | Declares a relation available in a World. Keys: `name`, `kind` (`spatial`, `containment`, `flow`), `inverse`. Its semantic meaning is declared, not inferred from its name alone. |
| `std.schema.region` | Declares a named rectangular page region. Keys: `name`, `x`, `y`, `w`, `h`. This does not define every kind of conceptual region. |
| `std.schema.effect` | Connects an act over a kind to a program action. Keys: `of`, `act`, `action`. |
| `std.schema.needs` | Declares dependencies required before acting in a World. Keys: `of`, `type`, `from`. |

| `std.tool` type | Purpose and keys |
|---|---|
| `std.tool.op` | A concrete operation. Keys: `name`, `world`, `param`, `effect` (`makes`, `removes`, `changes`), `doc`. A binding connects it to a semantic act; there is no undeclared `realises` key. |
| `std.tool.param` | An operation parameter. Keys: `op`, `name`, `kind`, `type`, `accepts` (accepted values), `scale`, `by`, `order`, `min`, `max`, `default`, `required`. Semantic spaces are linked through their schemas; `space` is not a parameter key in this interface. |
| `std.tool.bind` | Connects an act over a kind to an operation. Keys: `act`, `of`, `op`, `arg`, `needs`, `makes`, `removes`, `changes`. |
| `std.tool.arg` | A binding argument and its ordered sources. Keys: `bind`, `param`, `from`. |
| `std.tool.needs` | State conditions required before an operation. Keys: `op`, `exists`, `absent`, `check`, `args`. |
| `std.tool.custom` | A declared tool-specific constraint or search primitive with typed inputs and outputs. Keys: `name`, `world`, `kind` (`constraint`, `search`), `in`, `out`, `fails`, `doc`. |

**Acts and operations.** Capability declarations distinguish `make`, `remove`, `change`, `place`, `connect`, `group`, `pick`, `ask`, `copy`, `send`, `save`, `load`, `undo` and `redo`. Semantic methods may expand a compound act into simpler calls. Such expansion must preserve identity and observed effects; a label like `group` is not permission to infer arbitrary membership. Queries can produce results without a state-changing tool call.

**Shared context.** The declarations for filling, focus, dialogue, knowledge and turn organization identify sources and context used by the library. Their role is to make completion and reference decisions inspectable. They are not another family of domain-specific JavaScript controllers, and the existence of a module name does not prove that a particular request used it.

**Which instance is affected.** The library first finds compatible capabilities and live instances. “Schedule a meeting with Ana” can select Calendar while Drawing is visible. “A red circle” can remain compatible with Drawing and Diagram. Explicit destination, referent identity, conversational focus, schema/knowledge relevance and the visible area provide ranked evidence. The visible area cannot create a capability or discard otherwise compatible hypotheses. For a reversible choice the library acts on the best usable interpretation, reports uncertainty and retains alternatives and undo.

### 6.1.1 Domain selection and transfer between Worlds

A capability answers “which domain can realise this request?” Context answers “which compatible instance does the person intend?” Selection combines both kinds of evidence. Merely opening an editor does not give it capabilities it lacks.

Cross-world requests introduce another distinction: the source World read by a request can differ from the destination World that receives its result. Destination selection and result-refresh policy are separate declarations.

Capability compatibility filters impossible destinations. Ranking then uses the explicit destination, the World containing a resolved referent, accepted context and declared relevance. The visible area is useful evidence, not a global type clamp. With a circle creation request and Drawing visible, Drawing can be selected while Diagram remains a recorded alternative. The chosen instance and reason become part of the elaboration trace. *(R57)*

The filter is a join on declared contracts: requested act, target kind and required roles against the corresponding capability declarations. It is followed by ranking over compatible live instances. This order prevents two wrong shortcuts. A visible calendar cannot satisfy geometric creation merely because it is active, while an inactive calendar can still be the only compatible destination for an explicitly identified event. Conversely, the existence of a callable geometric primitive is not evidence that an ambiguous request meant that primitive.

A request can read one World and write another. In the tutorial, “a bar chart of meetings per person” reads the calendar and creates a diagram. Under the snapshot policy used here, it reads once during elaboration and records the source and observation time. *(R58)*

Under that snapshot policy, changing the calendar does not silently change the chart. Deleting a meeting leaves the chart intact; inspection identifies when its data was captured. “Update the chart” explicitly recomputes it. *(R59)*

The chart is based on an identified calendar state. Its provenance preserves that read so a later question can identify the consumed data. After the meetings change, the chart cannot be presented as current without a new read.

“Update the chart” is explicit, verifiable and undoable. Undo restores the previous chart, not calendar edits between the two reads. A presentation operation must not accidentally modify its source.

### 6.1.2 Declarative projection between Worlds

A **projection** builds a description in a destination World from an explicit source selection. It does not change the original objects: a meeting remains a calendar event, and its diagram node is a new object. Their correspondence is declared knowledge, not a guess based on equal slot names. Two slots called `start` can mean a time and an initial node; copying by name would be wrong.

A projection applies declared rules in a composition context: sources are versioned reads, conclusions are destination candidates. Collection retrieves named facts and rules; it neither invents a correspondence nor proves source completeness. Rule evaluation does not emit tool effects. Destination candidates are validated, elaborated into concrete calls, dispatched and observed (§6.7–6.9).

| Required declaration | What it fixes and why |
|---|---|
| Source selection | Instance, state version, interval and filter; for a week, also the time zone defining day boundaries. |
| Object correspondence | Source kind, matching conditions and destination kind; the result key distinguishes objects with equal labels. |
| Value correspondence | Source slot, transformation, unit and destination slot. A time-axis position requires an origin and scale, not a copied clock time. |
| Relation rule | The exact edge condition: temporal succession, shared participant or another declared relation. These meanings are not interchangeable. |
| Aggregation | Grouping, identity of the counted element, duplicate treatment and evidence of population coverage. |
| Result provenance | Selection, consumed values, source identities, rule versions and transformation parameters needed to explain the result. |

For “draw a diagram of my week”, the library identifies the source week and destination diagram, then considers declared projections such as temporal placement or shared participants. A reversible default can choose temporal placement without inventing arrows whose meaning is unknown. It records the selected projection and alternative. The following example uses meetings as nodes positioned on a time axis, with no connecting edges.

In this tutorial example, the weekly snapshot contains `m1`, 11:00–11:30 with Ana and Dan, and `m2`, 14:00–15:00 on the same day with Ana. The object rule produces a node per meeting-occurrence identity. A recurring series retains both occurrence and series identities. An occurrence projection uses the first as its key; grouping by series uses the second and retains group members in provenance. Thus “the Monday stand-up” can denote an occurrence or a group, according to the resolved selection and grouping, without merging them accidentally. Labels come from the observed intervals. With a 09:00 origin and two diagram units per minute, horizontal positions are `(660 − 540) × 2 = 240` and `(840 − 540) × 2 = 600`. This calculation assumes one day without a time-zone transition; the general case subtracts resolved instants, not isolated local clock readings.

The destination schema must define what those positions mean: here, the horizontal centre coordinate in the declared diagram frame. The scale is a presentation parameter retained in provenance; it does not change event durations. Another layout can use the same selection with a different scale. Overlapping nodes require a different layout or scale, not moving calendar events to make room in the diagram.

| Intended result | Rule applied to the snapshot |
|---|---|
| Node for `m1` | New diagram identity, provenance to occurrence `m1`, label `11:00–11:30`, horizontal position `240` in the chosen frame. |
| Node for `m2` | Distinct identity, provenance to occurrence `m2`, label `14:00–15:00`, horizontal position `600` in the same frame. |
| Ana’s meeting count | Distinct occurrence identities `{m1, m2}`; result `2`. |
| Dan’s meeting count | Occurrence identities `{m1}`; result `1`. |

The last two rows belong to a different projection, “a bar chart of meetings per person”. Its rule forms distinct `(person, occurrence)` pairs, groups by person and counts occurrences in each group.

This is an ordinary relational computation: the participant reference supplies the grouping key, event identity supplies the distinct-count key, and the count becomes a typed value for a bar. The chart method must then declare the conversion from that value to bar extent and the placement of axes and labels. Aggregation produces 2 and 1; it does not by itself choose a 20-unit-per-meeting scale, horizontal positions or a chart family. A shared meeting contributes once to each participant, so the bar sum counts participations, not meetings. An exact total requires a closed selection scope recorded in provenance: for example, all meetings of the selected people within the resolved week. Incomplete selection cannot yield verified weekly totals. A result explicitly labelled “based on what is loaded” can identify missing data, but is not a complete weekly chart. A zero bar also requires the intended population of people; absence from observed groups alone cannot supply it.

Each produced fact retains its justification: a node identifies the observed occurrence, an edge identifies both endpoints and its relation rule, and a bar identifies its group and selection coverage. Historical provenance records consumed values (§8.6); a temporary live calendar reference is not exported as autonomous evidence. Result identity incorporates the projection and source/group key, preventing meetings with equal labels from merging.

An explicit update rereads the source and reevaluates the declared projection. It compares results by source/group key. Removing a generated diagram node never removes its calendar event. Manual overrides remain distinct from generated values. A declared merge policy can preserve overridden fields, update unaffected fields and report which fields were kept. If an update cannot reconcile a hard constraint, the conflicting part remains unchanged with a concrete explanation; no hidden overwrite or routine clarification is required. Undo restores the previous destination snapshot, not intervening source edits.

## 6.2 The stages of a message

Section 1.4 follows one example through the process. Each stage below has an input and an output; subsequent sections explain the mechanisms.

| Stage | Input and output |
|---|---|
| 1. State | Obtain the authoritative instance facts and declared primitive observations, with version and coverage. |
| 2. Reading | Transform the sentence into a request expressed in general concepts (§6.3). |
| 3. Contextualisation | Identify how the message relates to the dialogue: new request, correction or response to an outstanding question (§6.4). |
| 4. Quantitative interpretation | Resolve qualitative expressions and align values with declared tool capabilities (§6.5). |
| 5. Completion | Generate candidates for omitted information (§6.6). |
| 6. Elaboration | Resolve targets, expand compositions, fill declared defaults, rank candidates and validate; output a concrete SOP circuit of typed tool calls and dependencies (§6.7–6.8). |
| 7. Dispatch | The generic library dispatcher binds typed outputs and schedules concrete calls. Each tool handles its own instruction; observed effects are checked (§6.9). |
| 8. Response | Compose a reply from independently established effects (§6.10). |

Completion and elaboration repeat until every effectful instruction matches a tool contract and contains no unresolved semantic choice. A typed reference to the output of an earlier call is concrete dataflow: it is bound mechanically at dispatch, not guessed by the tool. Intermediate representations contain typed values and wires, not only numbers. A fully concrete UI-generated command can enter validation and dispatch directly through the same interface.

The application's public interaction with LIB supplies existing Worlds, declared interfaces and context, then submits requests and receives results. The steps above are internal mechanisms, not JavaScript stages that each application must orchestrate. Inspection can expose their facts and evidence without exposing a second public control API.

A concrete instruction has the exact shape of its tool interface. This small invented interface uses only schema primitives; `example.move` is the tool's accepted wire type, not a new library operation:

**Schema World — `move/schema.sop`.**

<!-- sop-world id=move.schema role=schema module=example -->
```sop
@move.type core.type of=example.move closed=true
@move.object core.slot of=example.move key=object kind=string present=true
@move.x core.slot of=example.move key=x kind=number present=true
@move.y core.slot of=example.move key=y kind=number present=true
@book.move.schema.module core.module name=example
```

**Instance World — `move/instance.sop`.**

<!-- sop-world id=move.instance role=instance uses=move.schema -->
```sop
@move1 example.move object="o2" x=270.82 y=527.40
@book.use.move.instance.example core.use world=example prefix=false
```

For this example, `object` must resolve to a live object in the supplied instance, and `x,y` are centre coordinates in the declared page frame. The tool handler assigns those coordinates and returns its concrete result. The library checks the observed coordinates and records the previous values for undo. Source words, candidate referents and the reasoning trace stay linked outside the instruction; they need not become separate `value` wires inside every simple call. Removing that serialization noise does not remove the evidence.

The call wire is short because its semantic work is already finished. The schema checks that `object` is a string and the coordinates are numbers; that alone does not establish that “o2” names a live object, that the supplied frame matches the page or that the requested move was intended. Those obligations use the instance binding and interface contract. A compact terminal instruction and a detailed justification therefore serve different purposes and need not have the same size.

## 6.3 Reading: from a sentence to a request

The reader transforms words into a **request**: a small World of wires describing the intended goal or question.

The important distinction is its vocabulary. A request is not an editor-specific bag of parameters. Its graph contains an act, targets and their kinds, and constraints linked to general concepts from the legend. The same structural form therefore serves different domains.

| Sentence | Request in words |
|---|---|
| “draw three big red fish in the pond” | Act: create. Kind: fish. Count: 3. Size: degree word “big”. Colour: region “red”. Place: relation “in” with the pond. |
| “make a flowchart of how bread is baked, with no circles” | Act: create. Kind: flowchart. Topic: bread baking. Part shape: region “circle”, excluded. |
| “write a short formal letter about a late delivery” | Act: create. Kind: letter. Length: degree word “short”. Tone: region “formal”. Topic: late delivery. |
| “a long meeting with Ana tomorrow afternoon” | Act: create. Kind: meeting. Duration: degree word “long”. Participant: Ana. Time: “afternoon” region of tomorrow. |

Coordination preserves target roles. “Draw a tree and a house” introduces two new targets under the shared creation act:

**Instance World — `coordinated-creation/request.sop`.**

<!-- sop-world id=coordinated-creation.request role=instance -->
```sop
@source.pair std.request.source text="draw a tree and a house"
@request.pair std.request act=make mood=do source=$source.pair
@target.tree std.request.target request=$request.pair mode=new kind=tree
@target.house std.request.target request=$request.pair mode=new kind=house
@book.use.coordinated-creation.request.std.request core.use world=std.request
```

“Draw a tree near the house” is different: the tree is new, the house is an existing anchor, and `near` relates them. Splitting every noun into a separate creation would create a house the user did not ask for. Both the reader and the graph bridge must preserve this distinction; later tool execution cannot repair a lost target or ownership edge.

At this stage “big” and “red” retain their lexical meanings and source words. Numeric interpretation happens later because it depends on the applicable context and declarations.

**Constraints.** Each requested condition is a **constraint** of the request. To track and explain it, the graph retains its concept, polarity, target, individual/group scope, strength as requirement or preference, and source words. This is content and provenance; its **identity** is a stable identifier that survives correction. When a person later says “red, actually”, the dialogue mechanism can identify the particular condition being revised.

**Attachment.** Recognising words is not enough; the reader must preserve which target each expression describes. Small changes in attachment change meaning:

| Sentence | Required distinction |
|---|---|
| “a big pond with small fish” | Two size conditions on different targets: “big” modifies the pond and “small” modifies the fish. |
| “a report with no pictures in the introduction” | The exclusion applies to the introduction, not the whole report. |
| “two arrows from each box” versus “two arrows” | Two per node versus two in total. |
| “do not move all the meetings” versus “do not move any meeting” | Not every meeting versus no meeting at all. |
| “put the duck next to the red house” | The house is red; the duck is not necessarily red. |

These attachments are represented by the lexicon, structural reading and semantic-composition rules discussed in §§10.1–10.4. Their request-graph roles are shared across domains.

**Checking the reader.** Compare the entire request graph with independently annotated intent: targets, ownership, scope, negation, values and source spans. Reading a generated paraphrase again can reveal inconsistency, but two identical wrong readings do not prove correctness. Reader correctness, successful elaboration and observed tool effects are measured separately.

**Uninterpreted text.** The reader preserves uncertain spans and alternatives. The library applies the most plausible usable interpretation for reversible changes, reports the actual effect and the uncertainty, and retains undo. A relevant unresolved clause cannot silently disappear: it is recorded as unresolved and the response says what was not applied. An incidental remark need not become a tool argument. Unknown words can be proper names; edit distance alone never licenses replacing “man” with “moon”.

### 6.3.1 Candidate interpretations and ambiguity

Graph comparison uses a bijection between local identifiers while preserving types, typed values, shared references, repeated-value order and source evidence. Equivalence of two graphs proves neither correct reading of the human intention nor an observed effect. If comparison exceeds its budget, the result remains unknown; a timeout is not inequality.


Reading produces hypotheses about intent. Each hypothesis retains its correspondence to the source: targets, constraints and still-uninterpreted words. Discarding a hypothesis must not silently discard a requirement.

Filtering uses actual state and declared capabilities. Ranking uses linguistic and contextual evidence without erasing alternatives. A non-winning interpretation remains inspectable. The response distinguishes the selected meaning from an observed effect, and identifies uncertainty rather than asking routine clarification questions.

The reader returns one or more candidate request circuits. Each retains its constraints, unresolved source spans and attachment of words to targets. *(R51)*

Candidates incompatible with identity, hard requirements or declared capabilities are eliminated. The library ranks the compatible candidates using declared language, knowledge and contextual evidence. For a reversible request it selects the best usable candidate, retains alternatives and undo, and states the selected interpretation when uncertainty matters. An unresolved hard contradiction is reported; it is not repaired by silently deleting a requirement. *(R52)*

For “make the red and blue nodes bigger”, one reading selects the union of red and blue nodes; another selects nodes that are both red and blue. If none occupies both regions, the intersection reading has no existing referent. For “add red and blue nodes”, however, one reading creates one colour group of each kind, while another creates two-colour nodes. Only a declared tool limitation can rule out two-colour nodes; that limitation is not a universal property of diagrams.

Target identification and desired result are different evaluation contexts. In “make the red objects blue”, red selects the observed objects before the change, while blue constrains the result. Conjoining both as result requirements would incorrectly require an object to become red and blue simultaneously.

An existing target can have a `selector`, a reference to the predicate graph that filters observed candidates. A reference to that target inside its selector denotes the candidate under evaluation. `request.root` denotes desired-result conditions. Without an explicit root, constraints outside selectors form the implicit result conjunction. Selection and recolouring are separate operations even when they use the same property:

**Instance World — `selector-change/request.sop`.**

<!-- sop-world id=selector-change.request role=instance -->
```sop
@source.selection std.request.source text="make the red objects blue"
@request.selection std.request act=change mood=do source=$source.selection
@target.selection std.request.target request=$request.selection mode=existing kind=object selector=$condition.selected
@condition.selected std.request.constraint request=$request.selection target=$target.selection concept=colour operator=region value=red polarity=positive character=requirement
@condition.desired std.request.constraint request=$request.selection target=$target.selection concept=colour operator=region value=blue polarity=positive character=requirement
@book.use.selector-change.request.std.request core.use world=std.request
```

A selector can use the same conjunction, disjunction, negation and quantifier nodes as a result condition. Union or intersection of existing red and blue objects belongs in the selector, not in constraints that recolour them. Each node and its descendants belong to one context: one particular selector or the result. Sharing a predicate node across contexts is rejected. If the same property is required before and after a change, use two distinct constraints. Quantified bindings cannot escape their context.

Selectors describe observed state; `delta`, `factor` and `occurred` express changes or evidence of acts and are not simple observed-property selectors. Historical selection must use an explicit history contract. Relations and `same` descriptions can connect targets, so resolving them may require a joint search. An acyclic predicate graph alone does not prove that its referents can be found.

A relevant uninterpreted span must remain attached to the request and response. It does not force refusal of every independent reversible effect, but it cannot silently lose a negation, a required target or a condition. The library identifies exactly which part it applied and which span remains unresolved. *(R53)*

If an exceptional clarification is necessary, its pending state retains the candidates and expected value type. A matching reply resolves that pending question. A new unrelated request closes it; a stale question must not capture a later command. This conversation mechanism does not require routine clarification instead of a usable reversible interpretation. *(R54)*

The red-and-blue example distinguishes union from intersection. Preserve the readings separately until reference resolution. An empty intersection can eliminate a reading of an existing target; it does not justify dropping a requested colour from creation.

An uninterpreted word can be short and still change the request: “not” reverses a condition. Calling a word a connector does not authorise ignoring negation, order or scope. A span is irrelevant only when its declared linguistic role is irrelevant to the structured request. Any exceptional clarification retains candidates and the expected value so a later reply addresses the correct issue.

Reader evaluation compares the full structured request against annotated intent on independent examples. It measures target ownership, scope, negation, source spans and calibration, not only a verb score. A confidence number is evidence for ranking interpretations, not proof of a meaning or permission to bypass schema and effect checks. Failure on “draw a tree and a house” must be located at its actual boundary: reading the two targets, preserving them in the request graph, elaborating both, or executing the resulting calls.

### 6.3.2 Request representation and constraint identity

A request is distinct from the affected instance state: asking for three fish does not make them exist. A request target may denote a group of results yet to be created or an existing object to resolve. Elaboration binds these descriptions to concrete identities; a request-target identifier is not the identity of an actual fish.

The `std.request` declarations preserve source, named act, explicit mood and target descriptions. Here is a minimal request; the later example adds conditions:

**Instance World — `proposal/request.sop`.**

<!-- sop-world id=proposal.request role=instance -->
```sop
@request.sample std.request act=make mood=propose source=$source.sample
@target.sample std.request.target request=$request.sample mode=new kind=sample name="illustrative sample"
@source.sample std.request.source text="propose a new sample"
@book.use.proposal.request.std.request core.use world=std.request
```

`mood=propose` requests a proposal and does not authorise execution. Mood is mandatory: absence does not default to `do`. The other declared modes are `do`, `check` and `ask`; none bypasses authority or effect checks. `act` and `kind` remain names to resolve, not proof of an applicable capability or schema.

Each target has a typed reference to its request, and each request has a typed source reference. Removing a target does not delete its request, but deleting a still-referenced request or source is rejected. Several requests can share one source. A target name describes the search or intended result, not the identity of a found or created object. `new` and `existing` are structurally validated; loading an `existing` target does not by itself resolve an actual referent.

The request graph includes constraints, value descriptions, logical nodes, `root` and bound targets. Its structural invariants cover ownership, reachability, cycles and variable scope. Those checks do not evaluate predicate truth or authorize execution. A fragment is situated in dialogue before an explicit execution mood is assigned.

The following request represents “draw three big red fish in the pond”. Act, kind and concept names must resolve before evaluation and elaboration. The fixed structural fields describe the generic graph; colour, place and quantity are vocabulary data rather than a new JavaScript field per domain.

**Instance World — `fish-creation/request.sop`.**

<!-- sop-world id=fish-creation.request role=instance -->
```sop
@src1 std.request.source text="draw three big red fish in the pond"
@r1 std.request act=make mood=do source=$src1
@fish1 std.request.target request=$r1 mode=new kind=fish
@pond1 std.request.target request=$r1 mode=existing kind=pond determiner=definite
@c.count std.request.constraint request=$r1 target=$fish1 concept=quantity operator=eq value=3 scope=group polarity=positive character=requirement source=$src1 source.start=5 source.end=10
@c.size std.request.constraint request=$r1 target=$fish1 concept=size operator=degree value=big scope=each polarity=positive character=requirement source=$src1 source.start=11 source.end=14
@c.colour std.request.constraint request=$r1 target=$fish1 concept=colour operator=region value=red scope=each polarity=positive character=requirement source=$src1 source.start=15 source.end=18
@c.place std.request.constraint request=$r1 target=$fish1 concept=place operator=relation relation=in goal=$pond1 scope=each polarity=positive character=requirement source=$src1 source.start=24 source.end=35
@book.use.fish-creation.request.std.request core.use world=std.request
```

`src1` preserves the exact source. Source intervals count Unicode scalars from zero with an exclusive end, not UTF-16 code units. The bounds occur together and identify a nonempty in-range span. A multiword meaning may preserve separate contributing intervals rather than falsely claim intervening text. `r1` identifies the request, not a created object. Provenance remains distinct from whether the interpretation or requested effect is correct.

`fish1` denotes a group of new results, not an already created fish. `pond1` describes an existing pond to resolve. With two ponds, the library ranks them by context and declared relevance, records the selected interpretation and retains the alternative. It never changes `existing` to `new` merely to avoid resolving the reference.

| Constraint | Interpretation and checks |
|---|---|
| `c.count` | The group has exactly three results. `scope=group` counts results; it does not require three copies per fish. |
| `c.size` | Each result receives the size computed from degree “big”, its comparison class and source. `degree` defers numeric calculation until the context is available. |
| `c.colour` | Each result’s colour belongs to region `red`; the name resolves to a versioned region declaration. |
| `c.place` | Each result must hold relation `in` to the pond resolved from `pond1`. This is explicit source content, not a placement inferred from fish knowledge. |

`operator` selects a condition test, not a tool: count equality, degree calculation, region membership or relation. `polarity=positive` requires truth; `negative` requires falsity. `character=requirement` is obligatory, `preference` can yield to requirements, and `assumption` records a completion of omitted information. Negation does not weaken a condition: “no circles” can be a hard negative requirement. An assumption cannot fabricate a source span; it points to the declaration or reasoning step that proposed it.

The schema checks operator variants. Section 4.4.5 defines `same` with a typed description of another target’s property and a separately resolved versioned observation. Section 4.4.4 defines `delta` and `factor`, reference observations and measured relation arguments. Incompatible units or undefined measurement endpoints are request errors, not tool defaults. The logic in §10.3.1 adds `occurred`: an act, checked phase and boolean value constrain evidence of a change rather than numeric equality. `relation` requires `relation` and `goal`; `eq`, `less.equal`, `greater.equal`, `degree` and `region` require values accepted by the concept. Ordered comparisons require compatible units and orderable values. A stray `goal` on numeric equality is a request-schema error. The resolver separates the target description, resolved identities and observed state version, allowing each result to be checked and ambiguity explained without changing the original meaning.

The follow-up “in the sky” is bound by contextualisation (§6.4) to the placement of the fish group in the last request. The following complete revised snapshot preserves the group and unchanged requirements; `c.place` keeps its identity and receives the new source and destination:

**Instance World — `fish-correction/request.sop`.**

<!-- sop-world id=fish-correction.request role=instance -->
```sop
@src2 std.request.source text="in the sky"
@src1 std.request.source text="draw three big red fish in the pond"
@r1 std.request act=make mood=do source=$src1
@fish1 std.request.target request=$r1 mode=new kind=fish
@sky1 std.request.target request=$r1 mode=existing kind=sky determiner=definite
@c.count std.request.constraint request=$r1 target=$fish1 concept=quantity operator=eq value=3 scope=group polarity=positive character=requirement source=$src1 source.start=5 source.end=10
@c.size std.request.constraint request=$r1 target=$fish1 concept=size operator=degree value=big scope=each polarity=positive character=requirement source=$src1 source.start=11 source.end=14
@c.colour std.request.constraint request=$r1 target=$fish1 concept=colour operator=region value=red scope=each polarity=positive character=requirement source=$src1 source.start=15 source.end=18
@c.place std.request.constraint request=$r1 target=$fish1 concept=place operator=relation relation=in goal=$sky1 scope=each polarity=positive character=requirement source=$src2 source.start=0 source.end=10
@book.use.fish-correction.request.std.request core.use world=std.request
```

This block is the complete revised request snapshot. It replaces the earlier snapshot rather than being concatenated with it: conflicting declarations under repeated identifiers would be an error. Count, size, colour and group identity remain unchanged. The journal retains the previous version and its link to the corrective message.

If the fish already exist, the binding of `fish1` to those identities is retained and the compiled circuit moves those fish. It does not create three more. Before execution, correction instead changes the destination in the unexecuted candidate. Resolving the previous group, distinguishing correction from repetition, and controlling effects are separate contextualisation and planning obligations; editing one wire does not solve them automatically.

The same graph can describe two distinct houses using one target group and a count. The meaning of “distinct” and any requested composition parts must be declared separately. This representation alone neither supplies that knowledge nor makes a domain executable.

Chapter 10 explains linguistic reading: lexical bindings, structure, semantic composition and extending interpretation.

## 6.4 Contextualisation: relating a message to previous turns

People do not always speak in complete sentences. “Draw three fish” may be followed by “bigger”, “in the sky”, “two more” or “not that one”. Each fragment depends on prior context. Contextualisation identifies the role of the new message.

The dialogue retains **focus**: current referents, explicit selections and the latest request still eligible for correction.

| Message class | Recognition and effect |
|---|---|
| New request | Introduces an act and target, such as “draw a house”; begins a new request. |
| Reaction | Evaluates the recent result: “fewer”, “too big”, “another one”, “shorter”, “later”. Changes only the indicated dimension; “fewer fish” leaves the house and pond unchanged. |
| Correction | Revises previously requested content: “red, actually”, “make that Friday”. |
| Fragment | Supplies a value for an omitted or focused role: “on the lake”, “down”, “two of them”, “with Tom too”, “after the greeting”. |
| Answer | Resolves an outstanding question, if one exists. |
| Praise or thanks | Has no state-changing effect. |

Fragments illustrate the value of shared concepts. “On the lake” describes placement because “on” denotes a spatial relation and “lake” an object kind. The library can revise the preceding placement role without a drawing-specific sentence handler.

**Resolving referents.** People identify existing objects in several ways; resolution uses the same declared concepts.

| Description form | Examples |
|---|---|
| Name | “the Start box”, “the meeting called Review”. |
| Kind and property | “the red fish”, “the round node”, “the long meeting”; property matching uses the declared region or comparison. |
| Ordinal | “the second paragraph”, “the first one”. |
| Relation | “the house next to the pond”, “the box under Start”, “the meeting before lunch”. |
| Pronoun | “it”, “them”: referents supported by focus. |
| Definite plural | “the fish”, “the arrows”: the selected compatible population when selection applies; otherwise the population supported by the declared reference policy. |

When several objects match a singular description, the library ranks them using explicit identity, focus, accepted context and declared relevance. A reversible change may use the best candidate, retain the others and say which object changed. The tool receives one resolved identity. If there is no compatible candidate, the library reports the missing referent; it does not create an existing target merely to make the command run.

Suppose the instance contains two red houses, `h1` and `h2`, and the current selection identifies `h2`. The kind and colour selector admits both. A declared selection-first reference policy ranks `h2` above `h1`; it does not make `h1` fail the colour test. The compiler binds the chosen target to `h2`, retains `h1` as an alternative and records the selection evidence. A subsequent “the other one” can exclude that prior binding and select `h1` if it still exists and remains compatible. Neither choice follows from object order in a file, and neither is proved to be the person's intention merely because a move is legal.

**Missing information.** The concept and expected type identify the missing value; declared knowledge, accepted context and instance constraints supply candidates. The library uses a plausible reversible completion, records its source and explains material uncertainty. It does not ask one question per missing parameter. A response to an already-open question is still represented as a reference to that dialogue record; it must not be mistaken for an unrelated new creation.

### 6.4.1 Descriptions and reference resolution

A description is a graph of targets and conditions: kinds, properties, relations and sources. A request adds an act to such a description. A reference uses it to find something; a document topic can use it to describe something to write about. The structure is shared but the commitments differ. Describing a fictional character neither asserts its existence in the observed World nor authorises creating it. The description’s role is declared, not inferred from the mere presence of a wire.

Resolution establishes a candidate population, applies mandatory filters, then ranks admissible matches using declared distances and evidence. There is no universal distance that compensates for every mismatch. Exact identity, required provenance and temporal bounds are hard filters; colour similarity cannot compensate for violating them. Approximation applies only where permitted and within its declared tolerance. Exact matching takes precedence over relaxation of the same description. Remaining candidates are retained and ranked; a reversible selection is reported with its uncertainty and alternatives.

| Resolution goal | Candidates, filters and selection evidence |
|---|---|
| Object by kind and properties | Objects in the declared context; exact identity and requirements filter them. Approximate kind/property matching requires an explicit policy and metric. |
| Object by provenance | Objects with creation/modification evidence. “Added by the application” selects the required event and actor, not the most similar object. |
| Historical value | Values of the same object and property in the journal, filtered by the specified time. Unqualified “before” selects the value before the latest relevant change when known. |
| Ordered member | Members under a declared flow, temporal, textual or reading order. Without an applicable unique order, “first” remains ambiguous. |
| Part participating in a relation | Parts filtered by declared support, containment or attachment role; an extreme coordinate alone does not determine the part. |
| Meaning or repaired word | Vocabulary meanings, admitted language forms and instance names. Grammatical and semantic compatibility filter before repair cost. |
| Available realisation | Declared realisations compatible with kind and requirements. Kind-tree distance can rank borrowing, but tool capability is checked independently. |

Kind-tree distance proposes a nearby match only when the domain policy permits it. In the tutorial, “the box” may identify a rectangular diagram node if it is the admissible referent; the reply states the interpretation. That neither changes the node’s type nor declares every box equivalent to every node. A local alias requires its own object, context and source record. Later reuse must not hide new ambiguity.

An expected but absent part is not an observed referent. For an edit, the library may complete a structural role when the whole is identified, the role is declared constructible, and no absence constraint forbids it. Thus “add the signature” can fill a letter’s signature role without pretending a signature already existed. Asking about the signature does not create it. For an optional role, possibility alone does not authorise creation: declared interpretation policy and context must support the edit, with uncertainty recorded. This is the controlled structural-completion exception to R37, not “not found, therefore create”.

Word repair may cross a token boundary but must yield a complete compatible reading and retain the repair as provenance. An unknown word can be a proper name; small edit distance does not authorise rewriting it. A missing realisation requires an applicable declared composition and compatible tools; selection cannot manufacture either. If a historical value is unavailable, the answer identifies that gap rather than borrowing a recent value from another object.

## 6.5 Quantitative interpretation and tool compatibility

The request may retain qualitative constraints such as “big”, “red” and “afternoon”. The library resolves them against declared spaces, baselines and instance state. Tool inputs are concrete typed values, not necessarily numbers: a label remains a string, a selection becomes identified objects, a colour can become a supported colour encoding, and a time becomes a resolved instant.

First, resolve each qualitative constraint to its declared space and region or transformation. “Red” identifies a region, not automatically one universal colour number. “Big” uses a declared comparison population and baseline. The library then generates concrete candidate values, such as a supported colour point or a numeric size, preserving the region test and baseline calculation as evidence.

Next, compare the candidate value with the tool’s declared realisable domain (§6.1). Four cases illustrate the distinction.

| Situation | Library decision |
|---|---|
| Exact value is realisable | Use it unchanged; a continuous-colour drawing tool may support the requested colour point directly. |
| A permitted nearby value is realisable | In a tutorial tool with eight shapes, an oval request may map to its ellipse. Record the substitution and mention it when perceptible. |
| Nearest realisable value is outside permitted tolerance | A two-hour meeting does not fit a half-hour opening. Do not silently shorten it; identify the conflict and alternatives. |
| Kind has no dedicated realisation | A declared borrowing policy may use a bird representation for a duck. Preserve the semantic kind duck and report the material substitution. |

**Tolerance** declares the admissible deviation between the request and a realisable value.

For ordinary reversible changes, use the best permitted interpretation and state material differences rather than asking about minor substitutions. Preserve the original requirement alongside the transformation. This supports truthful replies and later references to the requested duck even if its representation was borrowed.

### 6.5.1 Exactness, approximation and tolerance

Approximation is semantic permission, not only a distance calculation. An exact requested time cannot silently become the nearest free time. “In the afternoon” permits a choice within that region, not outside it merely for convenience.

The source class of a value must survive reading, elaboration and dispatch. Equal final numbers can have different permissible alternatives depending on what was said.

Permitted approximation depends on the precision of the source expression. *(R55)*

| How the value was specified | Permitted freedom |
|---|---|
| Exact: a number, time or identity (“at ten thirty”, “Ana”) | Preserve it. If infeasible, explain the conflict and identify alternatives rather than silently changing it. |
| Qualitative: a region or degree (“in the afternoon”, “big”) | Select within the region, or within the declared tolerance around the resolved degree value. |
| Comparative: “later”, “bigger” | Adjust the declared step within constraints while preserving direction. “Later” does not permit earlier. |
| Omitted: an assumption | Select a permitted value; disclose it when material. |

Tolerance is measured in the declared units and metric (§4.4.1). A space provides a default and a tool contract can constrain realisable approximation. Zero tolerance means exact matching. A declared interpretation policy can make “exactly” select zero and “about” widen the tolerance; these are explicit policy transformations, not universal numerical meanings. *(R56)*

For an illustrative shape space with tolerance 0.15, suppose oval-to-ellipse distance is 0.05 and triangle-to-rhombus distance is 0.4. The first approximation is admitted; the second is not. Report the unavailable triangle and available alternatives rather than drawing a rhombus as though it fulfilled the request.

Check permission before applying tolerance. It neither weakens a hard constraint nor substitutes a similar person for an exact identity. A 55-minute event does not satisfy an exact one-hour requirement merely because the numerical gap is small.

The shape distances assume a declared representation and metric. The illustrative numbers 0.05 and 0.4 are not universal meanings of “oval” or “triangle”. Without that representation the system cannot invent scores to justify a substitute.

## 6.6 Completing what the person omitted

Human requests commonly omit required execution arguments. In the tutorial, “draw a fish” leaves placement, size and colour open. Asking for every missing field is burdensome; silently guessing conceals the system’s contribution. Completion proposes values and retains the source of each choice.

**Value provenance.** Each completed value retains its **source** (explicit request, accepted context, knowledge or observed state), **strength**, **scope** (the object/context and validity period) and **cost** or uncertainty when assumed.

Strength distinguishes three obligations:

| Strength | Meaning |
|---|---|
| Requirement | Explicit content to satisfy. If incompatible, explain the conflict and retain alternatives instead of discarding it. Fish “in the sky” can be required despite being unusual. |
| Preference | Explicitly conditional content, such as “in the morning if possible”; optimise it after requirements. |
| Assumption | A completion chosen by the library. It is revisable and disclosed when material, such as an inferred location or meeting time. |

Conflicting hard requirements cannot be resolved by making the older one disappear. If Ana is unavailable throughout the explicitly requested Monday morning, the library retains both requirements, explains the concrete conflict and identifies admissible alternatives. It can still apply independently authorized reversible changes, but cannot report that the conflicting meeting was scheduled as requested.

**Candidate sources.** The declared completion policy orders evidence sources. A useful policy first considers accepted information about the same object, then justified recurring preferences, then inherited knowledge about the kind, and finally a declared varied sample within an ordinary region. For example, explicitly requested blue nodes may support a local colour preference; one isolated choice does not automatically become a universal rule.

Ordinary values may be regions rather than constants. A typical flow length can have a count distribution centred near seven; that does not require every flow to have seven steps.

Defaults fill omissions only. If the request names bread baking but knowledge supplies no baking steps, say so and offer empty steps or user-supplied content. Do not replace the topic with unrelated known steps.

Completion is performed against the required arguments of a selected capability or subgoal. For each open role, the compiler collects applicable proposals and records why each applies: same object, kind lineage, user scope, region or resource context. It combines proposals only when their units and dependencies agree, tests resulting assignments against hard constraints, and ranks the valid candidates under the declared objective. A highest-ranked ordinary value that violates the instance constraints is not a fallback to execute anyway. The next compatible candidate or a newly generated assignment must satisfy them.

**Several goals.** For “a house and a swing”, assess whether subgoals are independent: no shared constrained resource, no coupling rule and no requirement for all-or-nothing completion. If one independent part is unavailable, complete the authorised others and state what remains undone.

### 6.6.1 Local knowledge and learning preferences

Local learning produces scoped facts, not new schema declarations inside an editor's object state. An instance can own an object's name or a bounded region it contains; a separately identified session or user-profile instance can own preference and factor assertions under the appropriate shared schemas. The evaluation context reads those sources through their declared links. Reusing the structure of a published knowledge record does not grant a local assertion the same authority or copy its policy into every editor.

Each local fact retains its author, supporting evidence, scope and version. Correcting one result changes that result; becoming a future preference requires either an explicit preference request or satisfaction of a declared learning rule. The learned assertion stays with its named owner and applicability context. Nothing is automatically promoted into shared knowledge, and no type, slot or general rule is introduced through an ordinary instance edit.

| Local fact | Admission condition and scope |
|---|---|
| Object name | An identified object and assigned or confirmed name; a local alias does not change object kind. |
| Named region | A declared space and known bounds, or bounds produced by a declared rule; the name and ordering become referable in the instance. |
| Ordinary value | Explicit kind and context; one object-level requirement is not a rule for every object of that kind. |
| Degree factor | A qualifying adjustment episode (§4.5.1), retained with its justification. |

“For my reports, use a short introduction” can introduce a preference for that person’s reports. “Shorten this introduction” authorises only the selected edit. Both use a length region, but their learning scopes differ. Future exact requirements take precedence over that preference.

Undo retracts the learned contribution tied to the undone step, while retaining its historical evidence. If later evidence revised the preference, do not overwrite that revision with an old value: recompute the retracted contribution or report a conflict. The same rule protects subsequently edited aliases and regions.

### 6.6.2 Following an omission through to concrete arguments

Consider the tutorial request “add Review preparation on Monday”. Assume Monday's date and time zone and the destination calendar are already resolved. The reader supplies creation, the title and the day. The event interface still requires an absolute start and duration; no source span claims that either occurred in the sentence.

The supplied knowledge declares a 30-minute ordinary duration, working hours 09:00–17:00, and earliest-free-start as the scheduling preference. The observed instance contains one reservation [10:00,11:00) and establishes complete coverage for that working interval. Completion first proposes duration 30 from the applicable policy. It then needs a feasible start rather than a general label such as “morning”.

For this simple interval problem, merge occupied intervals, subtract them from the permitted working region, and keep free intervals at least 30 minutes long. The result is [09:00,10:00) and [11:00,17:00). Their earliest starts, 09:00 and 11:00, are candidate assignments under this objective. Both pass the duration and no-overlap checks; earliest-free-start ranks 09:00 first. The source facts, policy and calculations explain the choice without a calendar-specific sentence branch.

The concrete creation instruction contains the resolved calendar reference, title, absolute Monday 09:00 start and 30-minute duration. It contains neither “Monday” awaiting interpretation nor “first free” awaiting tool judgement. Its assumed values point to the completion policies, while the title and day point to their source words. A later observation of the created identity and interval supports the reply; the chosen candidate alone does not.

Change only the request to “after 10:30” and intersect the allowed start region with that new bound. The [10:30,11:00) trial conflicts with the reservation; 11:00 becomes the first feasible candidate. Change it to exact “at 10:30” and the start domain is a singleton: there is no authorised later substitute under the same request. Change only the ordinary duration to 90 minutes and the first free interval is too short, so 11:00 wins for a different declared reason. These variants use the same mechanism while making different premises decisive.

The interval subtraction method is appropriate to this declared scheduling fragment. A two-dimensional placement problem needs its own declared candidate generator and geometric tests; calling both tasks search does not make their numerical algorithms identical.

## 6.7 Wholes and parts

A request may name a whole while tools operate on smaller units. Knowledge declares the whole’s composition graph (§4.4), including part roles and relationships. The following are tutorial constructions, not mandatory definitions of those kinds:

| Whole | Declared example parts |
|---|---|
| Pond | Water, fish and water lilies within it, reeds at its edge. |
| Flow | One node per step, directional edges, distinct start/end roles. |
| Bar chart | One bar per value, height encoding quantity, and labels. |
| Letter | Greeting, introduction, body, closing and signature. |
| Working day | Ordered meetings under a no-overlap constraint. |

Propagate each requirement to its attached part (§6.3). A count stays with the kind it counts: in “two ducks and a swan”, two counts ducks.

Short requests such as “fewer”, “connect them” or “make it nicer” can address a whole. Applicable declared methods determine the operation; not every whole supports every edit. Each method states what must be preserved.

| Operation | Effect and preservation obligations |
|---|---|
| Fewer parts | Remove eligible parts while preserving required roles and relationships among remaining parts. A shortened flow remains connected; a shortened letter retains required greeting/signature roles under its declared template. |
| More parts | Add only parts permitted by the composition graph. |
| More variety | Change eligible properties of some parts only within permitted regions. |
| Connect the whole | Add only relationships meaningful under the declared schema. |
| Improve layout | Optimise declared arrangement objectives: for example, fewer edge crossings or suitable relative placement of water, sky and supported objects. |

The output is a **plan** in the precise sense of a concrete SOP circuit of tool calls, typed dataflow and dependencies. Elaboration resolves object identities, values, authorized effects and preconditions; no tool is expected to decide what the user meant. No effect has occurred yet. A named high-level act with unfilled roles is still an intermediate goal, not an executable plan.

### 6.7.1 Recompletion under constraints

Many whole-level edits share one procedure: start from the current result, fix protected roles, release only authorised variables, add new conditions and search for a valid assignment under a declared objective. This is **recompletion**. Hard constraints are satisfied before comparing cost. Preservation, exact counts and required relations do not become negotiable because another candidate scores better.

| Operation family | Changeable roles and constraints |
|---|---|
| Rearrange a whole | Authorised part positions; identities, counts and protected values remain fixed. Cost may combine soft violations, crossings and crowding. |
| Apply a structure | Positions and assignment to the declared structure. Required membership and explicit exceptions are hard constraints; total displacement may be a cost. |
| Produce an alternative | Choices originally left open. Preserve explicit requirements and impose a minimum difference from the rejected result in declared relevant dimensions. |
| Complete kinds or parts | Graph-permitted kinds/parts and cardinalities. Variety uses a declared generator and retains its choice source. |
| Adjust a value | The named role and direction; its axis supplies the step. Without a named dimension, compare only deviations declared commensurable. |
| Preserve explicit content | Named roles stay fixed to the reference state; optimising other roles cannot release them. |

In a three-section document, a two-column request can release positions while protecting text and logical order. A full-width section is an explicit structural exception, not permission to approximate it with a narrow column. The schema supplies allowed positions and assignment rules; the word “columns” alone does not define them.

The released variables determine the actual search problem. If the three sections have fixed identities, text and logical order, a layout candidate can assign their boxes to the declared column slots while retaining those protected values. The verifier checks assignment, extents and ordering for each candidate. It must not shorten text or remove a section to make the columns fit unless another requirement authorises that change. The objective compares only candidates that already respect the protected content.

Different reactions require different recompletion goals. “Another one” can add an object; “something else instead” replaces a rejected result. Reading fixes addition versus replacement before search; cost cannot decide intent. For “too much” without a dimension, a clearly dominant comparable deviation can support a correction. Otherwise retain ranked interpretations; a declared reversible default may select a property if the response names that choice. No undeclared property changes silently.

For variety, retain the generator and actual choices. If no valid sufficiently different result is found, distinguish budget exhaustion from proved impossibility. Do not alter firm requirements to guarantee novelty. Explain improved conditions and preserved content; lower cost alone does not prove the whole is “beautiful”.

This also explains the role of an objective. It supplies a comparison among valid assignments, not a generator and not a definition of human intention. A layout method can generate two valid arrangements; a crossing-count evaluator and a displacement evaluator score them; their declared priorities choose one. “Improve” is meaningful only relative to those named criteria. If no such method or criterion applies, the request has an unresolved operation rather than an unspecified permission to alter anything.

## 6.8 Reasoning: when and how the library chooses

Consider a speaker who says “put it by the door”. The reader may preserve two possible referents for “it” and several interpretations of “by”. Each reading is a hypothesis about this utterance. The compiler tests those hypotheses against the same observed scene before issuing a call. An attachment that requires contact has a different effect from leaving a gap. The current selection is evidence about the referent. A correction such as “by the door usually means leave a little room in my floor plans” can supply a preference about that speaker's wording, scoped to floor plans. Applying that preference to another person's diagram, or to an explicit request for contact, would change its meaning.

A profile World stores a learned association alongside its scope and the evidence that supports it. A correction to a single placement can be reversed on its own. Promoting repeated corrections into a reusable preference requires a declared learning rule that identifies comparable episodes. At decision time, keep each candidate's source spans, unsatisfied constraints and applicable preferences. Compare feasible hypotheses, select one, and keep its alternatives in the explanation. If a bounded search stopped early, its winner is the best examined candidate.

A fully specified tool instruction needs contract validation, not another interpretation. A high-level request needs elaboration whenever it has unresolved targets, missing required arguments, qualitative constraints, a composition, conflicting requirements or competing interpretations. These are properties of the request graph and declared interfaces, not a list of domain-specific sentences in JavaScript.

Reasoning mechanisms share a representation: versioned instance facts, kinds, properties interpreted in declared spaces, and relationships. Reusable operators process this structure without being rewritten for each domain.

| Mechanism | Responsibility |
|---|---|
| Deduction | Apply declared rules to derive consequences and violations: an initial node has no incoming edge; two meetings of the same person overlap. |
| Minimum-cost completion | Generate values for open roles, discard hard violations and rank the rest by declared soft costs and distance from ordinary values. This is a form of abduction; it can choose a pond placement or an admissible free event interval. |
| Induction of a shared value | Propose a local preference from sufficiently supported explicit choices for comparable objects. Blue nodes can support a future blue-node default under the learning policy. |
| Constraint solving | Assign several interdependent open values together, such as a weekly schedule (§5.4). |

**Search outcomes.** Distinguish a validated circuit; a candidate with unchecked obligations; an invalid request; proved absence of a solution in the stated domain; and budget exhaustion without a conclusion. Only a valid impossibility proof supports “cannot be done”. An exhausted search is not such a proof.

**Native calculations.** There are two JavaScript responsibility families: generic SOPWorlds LIB mechanisms and concrete primitives/adapters. A geometry or text-generation algorithm can be a registered native calculation with typed inputs, purity, limits and output contracts. The semantic choice of which relation to achieve, what may change, which facts count as evidence and which candidate to prefer belongs to library processing of declared Worlds. Moving a domain-specific handler into LIB, or naming it in a wire, does not make that decision generic.

### 6.8.1 Semantic planning and specialised functions

The library selects a compatible interpretation and elaborates its goals. A registered pure function can calculate candidates inside declared bounds. It cannot select a different semantic goal or mutate the live state during search. Its result goes through the same generic constraint checking and ranking as any other candidate. Only the final concrete effectful calls are dispatched to tools.

A function contract specifies input, output and verification. A returned candidate is not true or successful merely because a function returned it; the verifier compares it with the request and relevant state.

For example, an ordinary-location rule can propose the existing water-containing region `pond1` for a new fish. The proposal binds the destination role to that actual identity; a named habitat alone does not locate a pond on the page. A selected creation method supplies the fish's extent, and the instance supplies `pond1`'s bounds and occupied objects. Only then can `free_spot` search for coordinates. Its result remains attached to the same destination, extent and observed revision. If there are two ponds, choosing one is a reference/completion decision retained as an alternative—not a hidden choice inside the coordinate calculator.

The library selects the intended relation from request, knowledge and instance evidence. If the user did not specify a location, a declared ordinary-location rule may select the pond for fish. If the user explicitly requested the sky, that rule cannot override the request. A geometry function then searches inside the selected region and returns coordinates; it cannot change the destination because another region is easier. *(R67)*

| Example function | Inputs, output and verification |
|---|---|
| `free_spot` (drawing tutorial) | Takes the selected region/relation, object extent and existing objects. Returns coordinates or a bounded search failure. The verifier checks the returned point against the declared relation test (R45). |
| `layout` (diagram tutorial) | Takes nodes, edges and layout constraints. Returns node positions. Validate non-overlap and the other declared layout conditions. |
| `compose` (document tutorial) | Takes the part to write, supported topic claims, requested length and tone. Returns text and the claims used. |

`compose` may use only the supplied claims and declared structural formulas such as greetings and closings. Verify length by counting and claims against their sources. With no supported topic claims, only structural text is justified and the reply identifies the content gap. Tone is measured in its declared space and compared with the requested region under the measurement contract below. An uncalibrated or uncertain measurement stays explicitly uncertain; it does not justify a confident success claim. *(R68)*

A declared tone-measurement function receives text, language profile and space version, and returns estimated coordinates, textual evidence and uncertainty. Axes may describe formality, warmth and directness. Word choice, forms of address, sentence length and hedging are features, not universal definitions: long text is not necessarily formal. A symbolic or learned measurement model combines them under a declared contract calibrated against independent judgments. Compare each requested axis with its region and tolerance; uncertainty crossing a boundary produces an undetermined assessment.

| Tone-verification step | Required result |
|---|---|
| Extract features | Source spans and measurements with extractor version. |
| Project into the tone space | Coordinates, uncertainty intervals and measurement-model version. |
| Compare with the requested region | Verified membership, measured deviation, or uncertainty requiring further assessment. |
| Revise the text | A candidate preserving supported claims and hard requirements; remeasure after revision. |

Content drawn from another document also uses a declared capability. It receives versioned source text, extracts source-bound claims and their relationships, then constructs the requested result. Verification checks unsupported additions and meaning-changing omissions, including lost negations and conditions. The command reader identifies the task; the content extractor identifies what the source says. Recognising a request to summarise is not equivalent to understanding its source. A result with insufficient support remains an unverified candidate rather than a factual success.

If the selected relation places fish in a pond, `free_spot` cannot choose the sky because it is easier. It returns a verifiable point within the permitted region or reports its search outcome. Exhaustion and proved impossibility remain distinct (§8.5).

Claim verification requires source identity, not word overlap alone. If a property cannot be checked, limit the reply to properties actually verified. Correct word count proves neither the requested tone nor factual support.

### 6.8.2 Internal catalogue of general operations

Declaring a concept does not create a new computational power. A colour is usable because existing mechanisms can compare values and check regions. Naming an image recogniser does not implement one. A fixed catalogue makes the computational obligations of declarations explicit.

The following catalogue fixes the generic operations that declared methods can compose. An operation name has a defined argument and result contract; an unfamiliar name cannot introduce executable semantics. These are encapsulated mechanism contracts, not public JavaScript orchestration APIs or natural-language verbs. Applications submit requests to LIB; they do not call this catalogue step by step. For example, `make` denotes an act whose elaboration uses matching, validation, planning and concrete tool calls.

| General operation | Inputs and result |
|---|---|
| `value` | A scalar operator from `add`, `subtract`, `multiply`, `divide`, `min`, `max`, `equal`, `less`, `less.equal`, `and`, `or`, `not`, with typed operands. Returns a value or type/domain error; no mutation. |
| `collect` | A finite population, selection and `filter`, `project`, `distinct`, `join`, `count`, `sum`, `median` or `order`. Returns a population, scalar or order while preserving identities and sources. |
| `match` | A versioned state, wire pattern and initial variable bindings. Returns compatible bindings, supporting facts and enumeration-completeness evidence. |
| `traverse` | A declared graph, starting nodes, edge directions/labels and depth bound. Returns reachable nodes and supporting paths; repeated visits cannot cause an infinite loop. |
| `space` | A declared space, compatible values and `contains`, `distance`, `step` or `convert`. Returns membership, distance, stepped value or conversion under the declared axes, metric and transformations. |
| `derive` | State, rules and a budget. Returns derived facts with provenance and whether evaluation reached a fixed point or exhausted its budget. |
| `validate` | State or request, applicable schema and constraints. Returns violations, unchecked obligations and verification scope; no violations is not complete proof when checks remain unresolved. |
| `fork` | State version and proposed fact insertions, replacements or retractions with preconditions. Returns an isolated candidate and its difference from the base; invokes no effectful tools. |
| `enumerate` | Typed variables and explicit finite domains or declared bounded generators. Returns candidate assignments and whether the declared domain was exhausted. |
| `rank` | Validated candidates, declared cost criteria and explicit tie policy. Returns order, costs and remaining ties; does not invent the meaning of “better”. |
| `search` | Variables, candidate generator, constraints, objective and budget. Returns candidates, verification evidence and a search outcome from §6.8. |
| `plan` | Contextualised request, target bindings, declared acts, capabilities and base state. Returns dependent calls with pre/postconditions, authorised effects and decision sources, or unresolved obligations. |
| `call` | A registered function/tool, its contract and typed arguments. Returns invocation result and status; `observe` and `validate` establish effects. |
| `observe` | A declared adapter and state scope. Returns observed facts, version and coverage, or an explicit read error. |
| `compare` | Two state versions and relevant identities. Returns creations, removals and changed values/relations, including changes outside authorised effects. |
| `record` | An event and sources under the journal schema. Returns its retained identity or failure; does not rewrite earlier events. |
| `realise` | A declared language frame, role bindings and justified claims. Returns text with source correspondence; missing mandatory roles are reported rather than invented. |

`value` accepts no program fragment. Its operator has a known name and arity. Division by zero is an error; comparing incompatible units requires a declared conversion rather than returning false. `collect` does not execute an arbitrary function embedded in text: selection and projection use patterns and expressions built from the same operators. Sorting requires declared keys and directions. Identity breaks ties only when policy permits it, not to conceal semantic ambiguity.

`match` finds structural correspondences between patterns and state facts; it is not unrestricted sentence understanding. Language declarations can apply it to word/role facts, but those declarations must exist. Likewise `traverse` follows edges; the graph schema supplies meanings such as subtype. Kind distance alone does not authorise replacing a referent; a reference policy must permit it.

`space` dispatches only the declared family of membership, metric, step and conversion operations (§4.4). Membership uses the region rule; distance uses its metric/normalisation; a step uses the axis scale/direction; conversion uses a declared frame or unit transform. A metric requiring a different algorithm needs a registered function through `call`. Without one, report an unavailable operation rather than inventing a distance from the space name.

`derive`, `validate` and `search` have different obligations: consequences, constraint assessment and candidate assignment. A search candidate is checked on an isolated state before contributing to the circuit. Neither deduction nor trial evaluation can invoke an effectful tool. Pure functions may participate in computation; effectful calls belong to authorised dispatch.

`enumerate` cannot hide an infinite search. Exhausting a grid over a continuous interval proves only that no grid point worked. A conclusion about the entire interval requires an algorithm with that proof contract. `rank` does not promote the best tried candidate into a proved global optimum.

`plan` composes declared acts using their conditions and decomposition policy (§4.6.1); it cannot invent an action to satisfy every missing precondition. `call` is the catalogue’s only route to registered native calculation or effects, with declared name, argument types, purity and result conditions. Dispatch combines `observe`, `call`, `compare`, `validate` and `record` under the recovery rules (§6.9). Undo is a verified compensating circuit, not journal deletion.

For a concrete composition example, require an identified document section to have at most 120 words. Observation supplies its versioned text. Counting uses declared segmentation, then `collect` with `count`. This is a request constraint, not a permanent limit on every section. A shorter candidate is checked in isolation:

**Instance World — `section-limit/request.sop`.**

<!-- sop-world id=section-limit.request role=instance -->
```sop
@source.limit std.request.source text="at most 120 words"
@request.limit std.request act=change mood=do source=$source.limit
@target.section std.request.target request=$request.limit mode=existing kind=section
@constraint.length std.request.constraint request=$request.limit target=$target.section concept=length operator=less.equal value=120 unit=word scope=each polarity=positive character=requirement source=$source.limit source.start=0 source.end=17
@book.use.section-limit.request.std.request core.use world=std.request
```

These wires describe the check; they do not generate a summary. `target.section` must separately bind the chosen section. `less.equal` compares observed count with the bound; concept metadata defines word units and segmentation. A candidate of 117 words satisfies that numeric condition but does not prove meaning preservation, which needs its own contract and may remain unchecked. Without a compatible composer, counting alone cannot fulfil the request.

This distinguishes extension kinds. Changing the bound to 90 is new data. Applying the same check only to introductions is a declaration built from existing operators. Producing text or measuring an unsupported property requires a declared registered function implementation; its name alone is insufficient. Extending the generic engine is necessary only when required values, conditions or effects cannot be expressed by the operation contracts. Then revise the catalogue explicitly and recheck declaration compatibility.

When several operators are composed, intermediate results keep their role. Counting produces a number; it does not produce shorter text. Ranking returns an order over candidates; it does not make a candidate satisfy an unchecked requirement. Planning connects accepted subgoal results to call arguments; it does not cause an effect. Keeping these typed boundaries explicit is what lets one general mechanism be reused without successive wrappers that only rename an unsupported result.

## 6.9 Execution

A plan is the concrete SOP circuit of tool calls produced by elaboration. The generic library dispatcher follows its dependencies, binds typed results to later arguments and submits each instruction through the declared binding. Tools implement those instructions; they neither execute the semantic plan nor complete a vague request. A call can use a newly created object’s typed output reference without knowing its eventual identifier in advance.

A primitive may fail and the user may edit the state between planning and dispatch. The **authoritative instance state** and the **candidate state** therefore have distinct roles. A candidate is isolated until validated and committed. A renderer reads the instance; it does not become the semantic authority merely because it draws pixels. For external or native-managed resources, a declared adapter supplies observations, version and coverage, and the library reconciles those observations with the instance. No tool may silently maintain a contradictory second semantic state.

After each call, reread state and compare it with the act’s postcondition (§4.6). Distinguish completed, partially completed, rolled back, unknown effect and failed rollback. In the last two cases, neither “done” nor “nothing changed” is justified without further evidence.

An executed request can form one user-visible undo unit even when it invokes several tools. A qualifying immediate reaction may revise that unit rather than adding another. A question has no state-changing undo unit.

### 6.9.1 Execution consistency and failure recovery

A validated circuit assumes an identified base state. User edits or concurrent operations may change it before dispatch; a primitive can also fail after a partial effect. Execution tracks both observed versions and confirmed effects.

Separate calls are not necessarily semantically independent. Calls sharing a constraint or resource remain dependent even if they modify different object IDs.

Two parts are independent only when they do not share relevant reads/writes, no constraint joins facts across them, and they compete for no resource. If independence cannot be established, use the declared dependent transaction boundary rather than pretending the parts are independent. *(R60)*

Recheck state immediately before dispatch. Under the bounded retry policy used here, changed input facts trigger one recompilation. Another conflicting change stops the request with a concrete concurrency explanation. The retry bound is explicit policy, not an unbounded loop. *(R61)*

When a call fails, compensate completed calls within its dependent unit in reverse order using declared inverse operations. Retry only when the operation’s contract guarantees safe repetition. *(R62)*

If compensation fails, reread state and report confirmed residual effects and unresolved ones. Never claim complete success or complete rollback without evidence. *(R63)*

Reversible tools declare the data needed to restore the prior state and verify restoration. The tutorial exposes such undoable operations. A non-undoable tool requires an explicit execution policy and cannot inherit reversible-operation assumptions. Report undo failure under R63. *(R64)*

Two new events for one person may have different IDs yet remain dependent because no-overlap constraints connect them. Changes with disjoint data, constraints and resources can be handled separately when that independence is established.

Recovery consists of observed operations, not faith that an inverse call succeeded. Verify each compensation and reread after failure. Idempotence means repeating an invocation does not duplicate its effect. A lost reply after event creation does not authorise creating another identical event.

### 6.9.2 History, correction and undo

History retains the work units a person can revise or undo. “Bigger” may adjust a just-created result, but cannot overwrite intervening independent work. Grouping a correction into history does not erase that it is a new requested change.

Retain previous state, effects and learned contributions for each unit. The timeline below illustrates replacement of the latest unit versus creation of a new one.

A reaction replaces a work unit only if that unit is latest and its affected objects have not changed independently. Otherwise it creates a new unit. *(R65)*

| Event sequence | User-visible history |
|---|---|
| “draw a fish” | Unit 1: one fish, size 1.0. |
| “bigger” | Unit 1 revised: one fish, size 1.25. |
| The person drags the fish | Unit 2: the observed movement. |
| “bigger” | Unit 3: size 1.56 under the example step policy. It does not replace the intervening movement. |

Three undos restore size 1.25, then the previous position, then remove the fish. A learned contribution tied to an undone unit is retracted with it (R34).

An operation in another domain remains a unit of that domain. Global undo targets the latest eligible unit and names its domain and restored effect. *(R66)*

The first enlargement belongs to the creation unit, whose prior state contained no fish. Undoing that unit removes it. Manual movement interrupts the grouping; undoing a later enlargement must not undo that movement.

Global history can undo the most recent action across domains. Name the domain and effect so the person can verify restoration. If current state prevents safe restoration, use the recovery contract; history does not authorise overwriting intervening edits.

## 6.10 Composing the response

A fixed sentence for every domain-specific outcome proliferates templates and can report intended rather than actual effects. Responses instead use general semantic frames supported by observed evidence.

Correlate two sources: the **state difference**, establishing what changed, and **execution evidence**, establishing the invocation outcome. Each act has general **sentence-frame** families whose variants preserve meaning. Chapter 13 explains selection, grouping and realisation. Role, relation and region names come from language knowledge; domain implementations need not hardcode response sentences.

| Response content | Evidence source |
|---|---|
| What happened | Verified state difference. “I moved the duck to the lake” requires the observed destination relation. |
| What was assumed | Value source and strength (§6.6); disclose material choices. |
| Material substitutions | Permitted approximations and borrowed realisations (§6.5), stated without repetition. |
| Unfulfilled content | Each unsatisfied requirement, its source wording and reason. |
| Unverified content | Undetermined checks (§3.9). |
| Uninterpreted content | Relevant unresolved words, preserved as supplied. |

Questions about existing state use observations: “What is in the picture?”, “What does the diagram show?”, “What is on Friday?” Capability questions use declared interfaces. Natural descriptions can name a justified region—red rather than three colour coordinates, long relative to the applicable comparison class—without losing the underlying values.

**Provenance** connects each value to its sources and supports questions such as “why is the fish there?” Unresolved cases identify the missing concept or reusable mechanism; they guide general improvements rather than a list of sentence patches.

### 6.10.1 Observing effects and justifying claims

A response concludes an assessment of request and effect; it is not a paraphrase of the submitted call. “I moved it” requires an observed change. “It was already there” requires the condition before dispatch. Without the observation, neither claim is justified.

The following forms distinguish evidence statuses, not fixed replies for each domain. The same distinction applies to any compatible World and tool interface.

Before a call, test whether its intended postcondition already holds. If so, omit the unnecessary effect and report, for example, “The duck is already on the lake.” *(R69)*

A completed-effect claim requires both confirmed execution and the requested transition in correlated observations immediately before and after. *(R70)*

Response forms combine declared acts with general evidence statuses. *(R71)*

| Form | Evidence condition |
|---|---|
| Already satisfied | The intended postcondition held before dispatch. |
| Partially completed | Some independent parts succeeded and others did not; identify each. |
| Rejected with reason | A demonstrated hard violation or unsatisfied exact requirement. |
| interpretation with uncertainty | A reversible effect used a ranked referent or completion; state the chosen interpretation and retain alternatives and undo. |
| Unknown effect | Evidence is insufficient; see R63. |
| State answer | An observation-backed question such as “What is on Friday?” |
| Explanation | A provenance-backed question such as “Why is the fish there?” |

A technical acknowledgement may confirm receipt without proving the effect. For “put the duck on the lake”, locate both objects in the post-observation and check their relation. If neither position nor relation changed and the condition was false before, reporting “done” is false even if the handler returned success.

Conversely, a coordinate difference is not automatically the requested relation. If the duck moved from outside the lake to another outside position, the movement primitive did change state but the placement requirement remains false. The response can truthfully report the observed movement and failed destination condition; it cannot promote the primitive's narrower success into fulfilment of the higher-level request.

A later explanation reconstructs the same chain: requirement, read facts, applied rule and final observation. It distinguishes confirmed effects from planning assumptions. For partial execution, identify successful independent parts and remaining obligations rather than calling the entire circuit completed.

---

## 6.11 Explaining a response

Build explanations from retained evidence, not a plausible story invented afterward. “Why?” links the request to the rules applied and the observed result.

A **justification trace** records that chain. Each step names inputs, operation, result and its requesting parent. Inputs are source spans, identified observed facts or declarations from a fixed knowledge version. A derivation links its rule and premises; a tool observation identifies its invocation and observed state version.

The justification trace is facts in a schema-validated session World, with explicit links to requests, premises, rules, calculations, calls and observations. It is not only a temporary response object or an animation event. These facts describe interpretation and execution, not drawn objects or calendar events.

Persistence is explicit. Saving a project can include its trace World, preserving request and step identities. Loading that saved trace permits questions about earlier actions. A session without a saved trace makes no such promise: if history has been cleared or was not loaded, the library reports that the justification is unavailable rather than reconstructing an invented historical explanation.

Each response links its request and supporting steps. “Why?” resolves to the latest relevant response; an explicit historical question selects the corresponding earlier action. If several match, rank by conversation context, name the selected action and retain alternatives. Do not substitute an explanation of current state merely because it is easier to obtain.

| Retained journal data | Role in explanation |
|---|---|
| Request and reply | Message identity, received wording, structured request and communicated result. |
| Evaluation step | Operation/version, inputs, result and requesting relation. |
| Historical input | Source identity, observed version and exact consumed values. |
| Dependency | Links to supporting inputs and steps. |
| Execution observation | Invocation identity, tool confirmation, before/after state and assessed effect. |
| Undo | Target unit, restored effects and observed restoration outcome. |

A historical input preserves consumed values rather than rereading a live reference. If an event changes later, an earlier rejection explanation still uses the interval observed then. Source identity is provenance data; active references among journal facts connect records present in that journal. This is the same distinction as live sources versus snapshot provenance (§2.6.2).

Undo changes domain state and retracts tied learning, but retains evidence of the original action. Add a new undo record linked to that action. “Why did you move it?” can explain the original decision and note its later reversal. Failed undo records the remaining observed effect. Historical retention does not make an undone conclusion a current fact.

The `std.trace` schema distinguishes request, input, step, observation, reply, undo and correction. The following records express structural links. They are not sufficient evidence of the geometric relation: that requires the relevant geometry and a recorded relation check.

**Instance World — `execution-trace/instance.sop`.**

<!-- sop-world id=execution-trace.instance role=instance -->
```sop
@req1 std.trace.request message="put the duck on the lake"
@input1 std.trace.input source="drawing-instance/duck1" version="state-17" source.type=drawn key=at values="[\"120,540\"]"
@step1 std.trace.step request=$req1 act=place operation=move operation.version=1 invocation=call.move.1 status=confirmed input=$input1
@before1 std.trace.observation step=$step1 invocation=call.move.1 phase=before input=$input1
@input2 std.trace.input source="drawing-instance/duck1" version="state-18" source.type=drawn key=at values="[\"200,300\"]"
@after1 std.trace.observation step=$step1 invocation=call.move.1 phase=after input=$input2
@reply1 std.trace.reply request=$req1 step=$step1 text="I moved the duck onto the lake."
@undo.request std.trace.request message="undo that"
@undo.step std.trace.step request=$undo.request operation=restore operation.version=1 invocation=call.undo.1 status=confirmed input=$input2 depends=$step1
@input3 std.trace.input source="drawing-instance/duck1" version="state-19" source.type=drawn key=at values="[\"120,540\"]"
@undo.after std.trace.observation step=$undo.step invocation=call.undo.1 phase=after input=$input3
@undo1 std.trace.undo target=$step1 execution=$undo.step observation=$undo.after
@book.use.execution-trace.instance.std.trace core.use world=std.trace
```

`req1` identifies the message; `input1` preserves a value read from state 17. `source` is historical data, not an active `$` reference requiring the source object forever. `step1` distinguishes semantic act `place` from tool operation `move`; it and `reply1` link actual journal records. `undo1` distinguishes the undone step (`target`) from the restoring step (`execution`). The undo observation belongs to the latter invocation and retains its observed revision. Inputs preserve source type, key and an ordered JSON list of SOP tokens in `values`. Repeated tokens and categories remain distinct: numeric `12`, string `"12"` and historical reference `$object` differ. Historical references in that list do not require current objects. An empty list records no value at that key, not global completeness. Variables and injected extra keys/wires are rejected. Canonicalisation normalises string escaping, not numeric spelling: `1` and `1.0` retain their source tokens. `120,540` is a token here, not validated geometry. Trace immutability and project saving are separate obligations. The example omits lake geometry and the relation check, so `status=confirmed` alone cannot justify its reply text. Effect and claim verification remain evidence-evaluator obligations.

A step identifies operation, implementation version and invocation. Status describes that step: planned, confirmed, rejected, unknown or partial. A planned invocation ID may be reserved before dispatch; its existence does not mean a tool ran. These statuses do not replace whole-circuit outcomes (§6.9). Each observation has historical entries with their own versions; independent sources need not share a revision counter.

`depends` can reference earlier requests but cannot cycle. A reply references only steps of its own request; an exceptional clarification can have none. A correction links `target` to `replacement`, potentially in a new request. This records accepted history rather than competing hypotheses: each step has at most one direct replacement, without cycles. Further corrections continue from the current replacement. Timing and concurrency conditions (§6.9.2) are checked separately.

World authors declare rules; LIB records matches and calculations; adapters report observations. Response composition selects the supporting subgraph and expresses its meaning. It cannot add a cause absent from the trace.

| Outcome | Required explanation |
|---|---|
| Completed | Requirement, confirmed invocation, relevant difference and verified postcondition. |
| Rejected | Violated constraint, triggering facts and calculation; identify uncheckable obligations when data is missing. |
| Exceptional question | Actual ambiguity or missing value, retained candidates and why no usable choice is justified. |
| Assumption | Omitted value, chosen source and why it applies. |
| Adaptation | Requested and realised values, distance, tolerance and permission to deviate. |

In the calendar tutorial, numbers below are minutes from the start of the fixed example day, not an absolute-time storage format. Ana is busy in [600,660). The new request starts at 630 and lasts 30 minutes. This table describes recorded evidence; its column labels are not additional SOP keys.

| Step | Retained evidence |
|---|---|
| Input | Source specifies 10:30 and 30 minutes; participant resolves to Ana’s identity. |
| Fact | A versioned existing reservation for that participant occupies [600,660). |
| Calculation | Requested end is 630 + 30 = 660. |
| Rule | No overlap for that participant; both 630 < 660 and 600 < 660 hold. |
| Result | The exact requested reservation is rejected; no effectful operation ran. |

The explanation is: “Ana already has a meeting from 10:00 to 11:00. Your 30-minute meeting at 10:30 overlaps it, so I did not schedule it.” Each claim names its evidence. If two people are named Ana, the library ranks them before checking availability and records the selected identity. For example, accepted focus may select Ana Ionescu; the response then names that interpretation and retains the other Ana as an alternative. An arbitrary person must not be substituted merely because that person is free.

For the drawing tutorial, consider “put the duck on the lake”. Assume both objects exist, references are unambiguous and the relation is initially false. Every row below belongs to the same request; another request’s result cannot fill a missing proof.

| Step | Retained evidence |
|---|---|
| Request | Act `place`, requested object and destination, linked to source spans. |
| Referents | Identities `duck1`, `lake1` and the drawing version where they were resolved. |
| Condition | Required `on` relation; false in the initial state. |
| Candidate | Concrete position, geometric validation and compatible operation. |
| Invocation | Correlated call identity and tool confirmation for that duck. |
| Observation | Actual before/after position from the drawing instance. |
| Verification | Declared `on` test is true afterward; observed difference includes the required movement. |
| Reply | “I moved the duck onto the lake”, linked to invocation and effect verification. |

If confirmation arrives but observation fails the relation, the final claim is unjustified. If the relation already held, omit the move and report it was already satisfied. Explain that difference rather than merely saying a function ran.

Borrowing an image needs justification separate from placement. These explanations may yield the same drawing but expose different reasoning:

| Explanation | What makes it verifiable |
|---|---|
| “There is no duck image; duck is a kind of bird, and bird is the nearest ancestor with an available image.” | Identifies subtype evidence, available realisation and a general ancestor-search policy applicable to other kinds. |
| “Ducks are drawn as birds.” | Does not establish whether inheritance or a request-specific mapping was used. Without sources and a general rule it does not demonstrate reuse. |

Specific facts are legitimate: duck being a bird and the requested duck identity are inputs. The test is whether realisation follows a general rule over those inputs or a particular request-to-result association. A short explanation may omit details for readability, but inspection must expose them.

For a diagram minimum gap of 12 page units, an explanation can say “The nodes were 8 units apart; the layout moved them to 14, satisfying the minimum of 12.” Retain both measurements and the bound. “Best layout” requires optimisation evidence.

For the document tutorial, “write a letter about the meeting” omits length. Suppose illustrative knowledge declares 180 words as typical for this letter genre. That number is neither a program constant nor an exact source requirement.

| Step | Retained evidence |
|---|---|
| Request | Letter genre and topic; no source length constraint. |
| Preferred sources | No applicable contextual value or explicit preference under the declared source order (§4.5). |
| Knowledge | Identity/version of the typical-length declaration: 180 words for this genre. |
| Applicability | Requested genre matches or inherits the declaration without a more specific override. |
| Choice | 180 words is an assumed planning target linked to its source. |
| Explanation | “You did not specify a length; I used the declared usual length of 180 words for this kind of letter.” |

This explains target selection, not final word count. After composition, measure actual length and compare with permitted tolerance. Without that knowledge source, use another justified source, disclose uncertainty, or report unavailable completion. Do not hide unchecked tone behind “I made it formal”; claim only the transformation and properties actually verified.

In every domain, a short explanation can expand into evidence with actual identities and versions. Rule names in a book example are not evidence from a real execution. A lost trace makes justification unavailable; do not present a reconstruction as certainty.

### 6.11.1 Conversation messages and historical references

A conversational reference must link a retained request target to its historical subject and the corresponding canonical membership evidence. Request, step, invocation, host context and population snapshot identities are distinct. A justified historical reference can survive object removal, but it does not authorize modifying a newly created object that reuses a display label. Before a new edit, the library resolves the current identity and version again.

The journal is a World queried with the same patterns, references and provenance as other Worlds. A conversational message can target an earlier request, result or claim. Shared representation does not equate deleting a journal fact with undoing its effect. A correction is a new recorded event with independently checked observable consequences.

| Message intent | Consulted data and permitted effect |
|---|---|
| Explanation or objection to a claim | Supporting step/evidence; explain it or correct an unsupported statement. |
| Report of a state discrepancy | User report, previous observation and fresh read; distinguish reported from independently confirmed state. |
| Correction of the previous request | Request and revised role; rebuild the circuit under history/concurrency rules (§6.9.2). |
| Restore a historical value | Object identity, property and supported old value; apply a new change to that property only. |
| Knowledge question | Relevant facts and sources; answer supported content or identify the gap. |
| Dissatisfaction without a determined correction | Last request/result; explain the interpretation and unresolved content without changing state merely to create activity. |

“Put the title back” can restore an event’s old title while retaining a more recent time change. It is a new `change` act, not undo of all subsequent operations. If the historical title is missing, do not reconstruct it from an assumption.

A report that a result is invisible does not automatically authorise repetition. A fresh read may confirm the object and reveal a visibility or adapter-delay issue; an incomplete read leaves the effect unknown. Correct only what evidence supports, rather than creating a duplicate to silence the dialogue discrepancy. Similarly, separate an objection about the past from any explicit new correction it contains.

# 7. Tutorial: application domains and declared interfaces

This chapter uses the [PSys2 demonstration](https://github.com/ml-circuits-research/psys2) as a tutorial: Drawing, Diagram (including charts), Documents, Calendar and Avatar provide varied examples of the same general mechanisms. The examples are not the definition or scope of SOP Worlds. A new domain contributes schemas, knowledge, live instances and concrete tool bindings; it does not require another hidden semantic planner.

For every example distinguish the reader's request, the declarations consulted by LIB, the concrete circuit of tool calls, and the observed effect. Schema relationships alone do not define a tool interface: parameters, outputs, units, references, preconditions and observations must also be declared. The domain sketches below use explanatory pseudocode, not additional SOP syntax.

## 7.1 Drawing

```text
Pseudocode — model responsibilities, not SOP declarations
Drawing World: page contains drawable objects.
Drawable object: identity, kind, position, parent/group, size, colour, optional label.
Knowledge: editable representations, part roles, placement and style policies.
Tools: create concrete geometry, move, set supplied properties, remove, observe.
```

The drawing model separates the page, objects and groups. Position is not identical to a relationship such as “on the lake”: the library must derive coordinates from that relation using geometry and applicable knowledge. A free-position calculator returns candidates under a declared contract; it cannot decide by itself which object or region the user intended.

Representations belong in knowledge: a house can be a group of editable polygons, rectangles and text, rather than an opaque picture. A declared inheritance method may reuse an ancestor's representation while retaining the requested kind and recording the approximation. The drawing primitive receives concrete geometry. It does not choose the ancestor or decide where a house belongs.

| Tutorial request | Elaboration and its declared basis |
|---|---|
| “draw a landscape with water, ground, sky, clouds, sun, two different houses” | Build a whole with the named parts (§6.7). “Different” constrains the houses in declared property spaces (§4.4). Placement follows the example’s composition knowledge. |
| “put a duck” | Under a declared creation reading, expand creation and placement (§4.6). If permitted, borrow a bird realisation while retaining duck as the semantic kind (§5.2). Ordinary placement on water comes from applicable knowledge (§6.8). |
| “on the lake” | Bind a placement fragment to the relevant prior request (§6.4). |
| “move the house down”, then “down” | Apply a declared vertical step (§4.7); the second fragment repeats it for the resolved referent (§6.4). |
| “put a child on the swing” | When the reading introduces a new child, create it before placing it (§4.6). |
| “arrange everything more naturally” | Recomplete authorised positions under declared whole-level objectives (§6.7). |
| “random colours for the petals” | Sample permitted colour values for the resolved petal roles (§§6.6–6.7). |
| “what is in the picture?” | Answer from observed state and justified concept names (§6.10). |

## 7.2 Diagrams, including charts

```text
Pseudocode — model responsibilities, not SOP declarations
Diagram World: diagram contains nodes, links and groups.
Node: identity, optional label, shape, colour, position, optional data value.
Link: identity, source node, destination node, optional label and geometry.
Group: member references, layout choice and constraints.
Tools: create/update nodes and links, group/ungroup, apply concrete positions, observe.
```

The diagram model gives nodes, links and groups independent identities. An arrow's endpoints are references to the selected nodes; its label is editable content. Grouping preserves member identities and adds group properties. A layout request changes only the resolved group's coordinates according to declared constraints; a tool receives those concrete positions, not “make it nicer”.

For example, creating an arrow from selected `n1` to selected `n2` binds two different endpoint roles. The call contains those identities and the chosen direction; reversing them would express a different relationship even if both calls were structurally legal. A “connect them all” request first needs an applicable topology method—chain, hub or another declared graph—and any relevant order. The existence of an edge-creation tool does not decide which graph the person intended.

**Charts are diagram groups.** A chart groups typed data items and declares how values map to geometry. Changing bars to a line changes the group's layout while retaining data identities. LIB instantiates declared methods for axes, labels and positions; tools create or change concrete nodes and links. A new chart family using the same primitives requires declarations, not an application branch on its name. A new rendering primitive requires a documented tool extension.

| Tutorial request | Elaboration and its declared basis |
|---|---|
| “make a flowchart with six steps, no circles” | Create six linked nodes (§6.7), exclude the circle region (§4.4), and apply compatible declared start/end roles. |
| “fewer” | Resolve the reaction (§6.4), reduce eligible nodes and preserve the declared flow connectivity (§6.7). |
| “make the second one red” | Resolve the applicable order (§6.4) and compile a property change (§4.6). |
| “connect them all” | Apply a declared connection method over the selected whole (§6.7). |
| “make it nicer” | Optimise declared layout criteria, such as fewer crossings or consistent gaps (§6.7). |
| “a bar chart of meetings per person” | Aggregate observed calendar data and project it into diagram geometry (§5.3). |
| “rounder boxes” | Apply a declared comparative step on the shape space’s roundness axis (§4.4). |

## 7.3 Documents

```text
Pseudocode — model responsibilities, not SOP declarations
Document World: document contains ordered sections with optional parent sections.
Document: identity, title, genre and source material.
Section: identity, parent, role, order and text.
Knowledge: genre composition, length and tone policies.
Tools: create/update/remove/reorder concrete sections; compose under typed requirements; observe.
```

The document model distinguishes the whole document from ordered, optionally nested sections. A chapter and a subchapter share the section mechanism with different parent references. Moving a section changes its ordering relation; editing its label does not rename its persistent identity or replace its content.

Genres, mandatory and optional parts, and defaults belong in knowledge Worlds. For “add a chapter called Results”, LIB resolves the document, creates a section goal with that parent and title, derives order from the declared insertion policy, and emits a section-creation call. Composition additionally requires concrete source material, topic, section role, target length and tone parameters. The composition primitive produces text under that contract; it does not choose the document or invent facts about a meeting.

If the insertion policy says append after the last sibling, the instance's ordered sibling population supplies the predecessor. If a selected section supplies an explicit insertion anchor, that accepted context can instead determine the position under the policy. A subchapter request binds the selected chapter as parent rather than merely increasing an indentation number. Parent and sequence constraints are checked before the concrete section call; a title string alone cannot establish either relation.

| Tutorial request | Elaboration and its declared basis |
|---|---|
| “write a short formal letter about a late delivery” | Instantiate a letter composition (§6.7); resolve “short” against the applicable genre baseline (§4.5) and “formal” against a declared tone region (§4.4). |
| “longer” | Apply a length step while preserving protected parts (§§6.4, 6.7). |
| “move the apology before the explanation” | Change the ordering relation between the two resolved parts (§§4.6–4.7). |
| “a story about a fox, in three chapters” | Count chapter roles (§6.7), use available supported content and disclose content gaps (§6.6). |
| “warmer” | Apply a declared step on the tone space’s warmth axis (§4.4). |
| “what is in the document?” | Observe genre, title and section structure (§6.10). |

## 7.4 Calendar

The simplest calendar profile has one live calendar and editable events. Event creation needs a resolved title, start, duration and calendar identity. Participants and rooms are optional extensions, not mandatory complications of every calendar UI. The sketch below illustrates the room extension because it makes shared-resource constraints explicit.

```text
Pseudocode — model responsibilities, not SOP declarations
Calendar World: calendar contains events and optional resources.
Event: identity, title, absolute start, duration, optional participant/resource references.
Optional room: identity and capacity.
Knowledge: working regions, ordinary durations, overlap policy and scheduling objective.
Tools: create/update/remove the supplied event; observe events with coverage and version.
```

The optional participant/resource model links events to existing identities and describes room capacity. A participant label is not a participant reference. LIB resolves the live identity before scheduling; the event primitive receives that identity together with concrete times and content.

Overlap policy is separate from the data model. Observations may contain existing overlaps; representing that conflict must remain possible. A planning constraint can reject introducing an overlap, while another declared policy can permit it and report it. The tool validates structural integrity and applies the supplied mutation; it does not secretly choose an event to move or impose its own scheduling preferences.

Scheduling and spatial placement share a search pattern: enumerate candidates in a declared region, measure them, reject hard-constraint violations and rank the remainder by a declared objective. Measurements differ: interval intersection for time, geometric containment or distance for a page. Reuse concerns this mechanism and its contracts; minutes and page coordinates retain distinct units and semantics.

| Tutorial request | Elaboration and its declared basis |
|---|---|
| “a long meeting with Ana tomorrow afternoon” | Resolve duration against the calendar’s comparison class (§4.5), tomorrow’s afternoon region (§4.7), and a feasible interval under the declared scheduling objective (§6.8). |
| “later” | Apply a temporal step. If occupied, search a later feasible interval within the permitted region (§§6.4, 4.4). |
| “in the big room” | In the optional resource model, resolve the placement fragment and compare existing rooms under the declared size baseline (§§6.4–6.5). |
| “with Tom too” | Add the resolved participant and verify applicable availability constraints (§§6.4, 3.9). |
| “a meeting with Ana at ten thirty”, when Ana is busy | Preserve explicit 10:30. If overlap is allowed, create it and report the conflict. If overlap is forbidden, explain that constraint and retain the nearest feasible time as a proposal; do not silently substitute it. |
| “move everything on Friday to Monday” | Select Friday events and solve their new intervals under applicable constraints (§5.4). |
| “who is in the review?” | Project the participant role from the resolved event (§6.10). |
| “what is on Friday?” | Answer from the selected temporal population (§6.10). |

### 7.4.1 Applying the contracts in a calendar scenario

A complete scenario connects request representation, declared policies, candidate verification and observed effect. The model sketches identify responsibilities, while executable examples must declare their schemas and all required tool parameters. Reading the sketch alone does not create a capability.

The following independent cases use one explicitly fixed initial calendar. An undo case continues its named creation; other rows do not silently inherit effects from one another.

A complete domain supplies imports, schema types, applicable knowledge, tool signatures and bindings, observation interfaces and any registered mechanical functions. The dependency table identifies the semantic content that those declarations must provide.

| Tutorial domain | Example semantic dependencies |
|---|---|
| Drawing | Legend concepts, kind hierarchy, colour/size regions, scene compositions and language bindings. |
| Diagram | Legend concepts, shape/colour regions and diagram-family composition graphs. |
| Documents | Legend concepts, genre compositions, tone regions and source-bound topic claims. |
| Calendar | Legend concepts, optional participant schema, day regions and time units. |

A concrete example fixes a local day and time zone. The calendar contains `m1`, Review, 10:00–11:00. Knowledge declares an ordinary duration of 30 minutes, a working region 09:00–17:00 and an earliest-free-slot preference; policy forbids introducing overlaps. These are illustrative World facts, not JavaScript defaults. Each row starts independently unless it explicitly continues another.

| Request | Elaboration by LIB | Concrete effect and evidence |
|---|---|---|
| “Add Review preparation on Monday at 14:00” | Resolve Monday and zone; retain explicit 14:00; fill duration 30 from applicable knowledge; verify [14:00,14:30). | Emit an event-creation instruction with calendar, title, start and duration. Observe the returned event identity and values. |
| “Add Review preparation on Monday” | Search complete occupancy within the working region using ordinary duration and earliest-slot preference. | Create at 09:00 if free. Say “Added it at 09:00 for 30 minutes; I used the first free working slot.” Retain undo. Missing time does not automatically require a question. |
| “Move Review to Tuesday”, with two matching events | Rank identities by explicit selection, conversation binding and declared relevance; preserve both alternatives. | With a usable best candidate and reversible move, move that event and name the assumption. The tool never resolves “Review”. |
| “Add Review preparation on Monday at 10:30” | [10:30,11:00) intersects `m1`; explicit time conflicts with the hard no-overlap policy. | Do not silently rewrite 10:30 to 11:00. Explain the conflict and retain 11:00 as the nearest feasible proposal. |
| “Undo” after the first row | Resolve that invocation and created identity; compare current state against its observed result. | Delete only that event if the compensation precondition holds; reread. Independent edits and `m1` remain. |

Tool arguments contain no unresolved “Monday”, “usual” or “earliest”. They contain absolute time with its resolved interpretation, duration and unit, references and typed content. A later call may consume the earlier creation result: a new ID need not be predicted before creation. Binding returned IDs is generic dataflow, not semantic interpretation by the tool.

## 7.5 What belongs in native code and how to test generality

The architecture is useful only when domain programs remain concrete and do not secretly make semantic decisions that belong in declarations. Attractive World descriptions beside a separate case-specific implementation do not establish declarative reasoning.

There are two JavaScript responsibility families. SOPWorlds LIB implements generic parsing, matching, inference, search, elaboration, validation and dispatch. Tools and adapters perform typed effects, observe state and calculate documented mechanical functions. Application-specific choices—referents, default colours, scheduling preferences, layout policy—are declarations interpreted by LIB. Moving such choices into a callback, or naming that callback in SOP, does not make them general.

| Responsibility excluded from concrete domain handlers | Reason |
|---|---|
| Interpret the human sentence | Tools receive typed concrete arguments; the reader and LIB handle language and elaboration. |
| Store semantic synonyms or concept vocabularies as decision code | Those meanings are declared knowledge and language data. |
| Select kind, quantity, shape, location or time from a vague request | LIB derives choices from the request and Worlds and records them in the call circuit. |
| Hide ordinary semantic defaults | Defaults belong in applicable knowledge and remain attributable. |
| Hardcode situation-specific replies or clarification questions | General semantic frames and concepts provide the content and wording. |

A declaration can also be a patch. “Draw ducks with the bird image” is unnecessarily specific if a general ancestor-realisation rule accounts for the same result. Review should prefer the reusable rule plus subtype and realisation facts. Writing a special case in SOP syntax does not make its reasoning general.

**Measurement.** These checks distinguish reusable mechanisms from accumulated patches:

| Measure | What it establishes |
|---|---|
| Real user sessions | Replay actual messages against annotated intent and protected state. Report correct/wrong effects, partial results, justified conflicts, unknown effects and undo separately. Measure and correct small reversible interpretation mistakes; do not optimise apparent accuracy by refusing usable requests. |
| Unnecessary special declarations | Track redundant sentence mappings, kind-specific realisation shortcuts and unjustified one-object defaults. Legitimate domain facts remain necessary; only avoidable special mechanisms should disappear. |
| Reuse across domains | Shared language, concepts, spaces, acts, response frames, completion and validation. |
| Cost of adding a domain | Required declarations, concrete primitives and integration effort, with any generic mechanism changes identified explicitly. |
| Minimal pairs and unseen phrasing | Reading and execution on constructions not used to author the specific case. |

## 7.6 Avatar: composition of editable properties

An avatar is a live instance with addressable hair, eyes, mouth, accessories and geometry. Person and robot templates are property-bearing compositions from knowledge. The UI and language path address the same part identities and tools.

For “make the avatar happier”, the reader retains an expression degree change. Knowledge must relate expression measures to editable features. In an invented numerical example, observed smile is 0.2, a declared step is 0.1 and a declared feature mapping is `mouth.curvature = 2 × smile`. LIB derives smile 0.3 and curvature 0.6, validates a candidate and emits a change of the resolved mouth part. The tool receives the part reference and 0.6; it never receives “happy”. These numbers illustrate a mapping, not a universal psychological definition.

The chain requires two different bindings: which avatar/part the request concerns, and which measurement/mapping the expression concept uses. A feature record called `mouth` in another avatar cannot satisfy the first binding just because its label matches. A curvature setter cannot satisfy the second merely because it accepts numbers. The declared expression method joins those bindings and states any other features to preserve or adjust; observations then check the resulting feature values.

Observation confirms the mouth property, not that every viewer perceives happiness. A separate expression evaluator can support that interpretation with a measurement and uncertainty. “Give it a hat” instead expands a composition with a hat part, attachment relations and defaults. Direct UI resizing already supplies the part reference and concrete values and uses the same tool interface without semantic replanning.

---

# 8. From declarations to results: integration examples

These examples follow a concrete request through schema resolution, inference, candidate search, tool-call construction and observation. Accepting a candidate in a trial World remains distinct from observing an actual tool effect.

Read the examples as linked sources, not a single large state dump. The schema gives the allowed records, imported knowledge gives interpretations or policies, and the instance gives the observations. Calculations name the exact values they consume. A proposed call refers to the candidate values; its result must still be checked against a new observation. The same distinction applies whether a displayed example isolates one calculation or follows a whole request.

## 8.1 What the general engine must know

Section 6.8.2 defines the internal operation catalogue, contracts and boundary between new declarations and new computation. The following geometry exercise makes that distinction concrete.

## 8.2 Introducing a space: clearance between nodes

Suppose a diagram request requires at least 12 page units between two node outlines. Separate the observed distance from the desired lower bound. An actual diagram may have a gap of 8 even though the requested result requires at least 12. The observation model must represent the violation; otherwise it conceals the state that needs repair.

The `clearance` space has one nonnegative axis in page units. Screen pixels are inappropriate because display zoom must not change document geometry. “At least 12” constrains the candidate with a lower bound. A finite centre-radius ball cannot represent the unbounded interval `[12, infinity)`.

The following declarations define a one-dimensional space and keep the observed gap separate from the requested lower bound. Load `w.legend` and `std.request`; `example.gap.observation` and `example.layout.candidate` are invented local toy types. Each declared slot constrains its value without imposing the request's lower bound on all observations.

**Schema World — `clearance/schema.sop`.**

<!-- sop-world id=clearance.schema role=schema module=example -->
```sop
@book.gap.type core.type of=example.gap.observation closed=true
@book.layout.type core.type of=example.layout.candidate closed=true
@s.observed.value core.slot of=example.gap.observation key=value kind=number min=0
@s.candidate.gap core.slot of=example.layout.candidate key=gap kind=number min=0
@book.clearance.schema.module core.module name=example
```

**Knowledge World — `clearance/knowledge.sop`.**

<!-- sop-world id=clearance.knowledge role=knowledge module=book.clearance -->
```sop
@sp.clearance w.legend.space name=clearance version="1" form=axes
@ax.clearance w.legend.axis of=$sp.clearance name=distance order=0 kind=linear unit=$unit.clearance min=0 normalisation=10
@unit.clearance w.legend.unit of=$ax.clearance name=page.unit factor=1 offset=0
@book.use.clearance.knowledge.w.legend core.use world=w.legend
@book.clearance.knowledge.module core.module name=book.clearance
```

**Instance World — `clearance/instance.sop`.**

<!-- sop-world id=clearance.instance role=instance uses=clearance.schema,clearance.knowledge -->
```sop
@source.gap std.request.source text="at least 12 page units apart"
@request.gap std.request act=place mood=do source=$source.gap
@target.gap std.request.target request=$request.gap mode=existing kind=example.gap.observation
@constraint.gap std.request.constraint request=$request.gap target=$target.gap concept=clearance operator=greater.equal value=12 unit=page.unit scope=each polarity=positive character=requirement source=$source.gap
@book.use.clearance.instance.example core.use world=example prefix=false
@book.use.clearance.instance.book.clearance core.use world=book.clearance prefix=false
@book.use.clearance.instance.std.request core.use world=std.request
```

The space has a version. Its axis refers to the space and the unit by real references; the unit declares identity conversion (`factor=1`, `offset=0`). Axis order and linear kind are explicit. There is no maximum. The positive normalisation length is 10 page units, independently of the lower bound 12 on this request.

The observation and candidate slots admit nonnegative values, including 8 and 14. The request retains 12 through `greater.equal`. Its target binds the relevant node-pair measurements and state version, not every measurement in the project. On an isolated candidate state, recompute each gap and compare it with 12: 8 fails and 14 passes. A later request with another bound does not change the object schema. The trial measurement is not yet evidence of a real tool effect.

### 8.2.1 Normalising an unbounded axis

With distinct finite bounds, §4.4.1 can normalise by `max−min`. Without a maximum, that formula is unavailable. Declare a positive `normalisation` length in the axis unit and compute `abs(a−b)/normalisation`. When explicit normalisation and finite bounds coexist, the explicit length takes precedence. Zero or negative normalisation is invalid.

The space author selects a reference, such as median width 10 in a retained measurement set. Dividing a difference of 4 by 1 yields 4; dividing by 1000 yields 0.004. Equal numerical tolerances would then produce very different decisions. Section 12.2 explains calibration; the illustrative length 10 is not a threshold selected to make this case pass.

Do not confuse `normalisation` with `scale`. `scale=ratio` defines multiplicative comparative steps; `normalisation=10` defines the distance denominator. Neither is the request’s lower bound. Normalised distance may exceed 1 and is not clipped: distance from 0 to 25 is 2.5. Changing normalisation affects comparisons and tolerance, so retain its version as evidence.

| Compared values | Calculation and interpretation |
|---|---|
| Observed 8, bound 12 | Shortfall 4; normalised difference `4/10 = 0.4`. The lower bound is violated. |
| Candidate 14, bound 12 | Exceeds the minimum by 2 and satisfies it. Numeric distance to the bound is 0.2; violation is zero. |
| Observed 8, candidate 14 | Gap change is 6 units, or 0.6 normalised. This does not measure each node’s displacement. |

Distance from a bound differs from violation. For a lower bound, violation is `max(0, bound−value)`. A gap of 14 is not a violation merely because it differs from 12. Choosing the best valid arrangement requires a separate objective such as minimum total displacement; satisfying the bound does not prove optimality.

### 8.2.2 Measuring geometry and validating a candidate

The geometric function consumes observed data; it neither reads the screen nor moves nodes. This simplified example represents each node by page-frame bounds `left`, `right`, `top`, `bottom`. Curved or rotated outlines require a different geometry contract. A bounding-box approximation must be declared rather than silently presented as exact outline distance.

The instance supplies the geometry through its declared observation interface. A measurement belongs to a frame, an instance and a revision. Two independent boxes in one container can be compared for spacing. A child inside its group is a containment pair. The endpoint of an edge and its port form a contact pair. The same pair of coordinates can satisfy one relation and violate another. A box around a rotated outline establishes its bounds. An exact contact between two specified points needs observations of both points.

A placement method can generate several trial positions from the same observed anchor. Each trial carries its anchor identity and its resulting bounds. Apply hard conditions, then compare the measured costs of the surviving positions using the declared priority order. A manual move supplies a new observation and a new compilation. A tool can decline to apply an earlier circuit if the original observation has expired. Retain the rejected trials and the chosen coordinates so the decision can be inspected.

**Schema World — `measured-gap/schema.sop`.**

<!-- sop-world id=measured-gap.schema role=schema module=example -->
```sop
@type.gap.node core.type of=example.node closed=true
@slot.gap.left core.slot of=example.node key=left kind=number present=true
@slot.gap.right core.slot of=example.node key=right kind=number present=true
@slot.gap.top core.slot of=example.node key=top kind=number present=true
@slot.gap.bottom core.slot of=example.node key=bottom kind=number present=true
@type.gap.observation core.type of=example.gap.observation closed=true
@slot.gap.first core.slot of=example.gap.observation key=first kind=ref to=example.node present=true
@slot.gap.second core.slot of=example.gap.observation key=second kind=ref to=example.node present=true
@slot.gap.value core.slot of=example.gap.observation key=value kind=number min=0 present=true
@f.gap core.function name=page.gap out.kind=number pure=true doc="distance between axis-aligned rectangles in page units"
@f.gap.0 core.function.arg of=$f.gap name=a.left kind=number
@f.gap.1 core.function.arg of=$f.gap name=a.right kind=number
@f.gap.2 core.function.arg of=$f.gap name=a.top kind=number
@f.gap.3 core.function.arg of=$f.gap name=a.bottom kind=number
@f.gap.4 core.function.arg of=$f.gap name=b.left kind=number
@f.gap.5 core.function.arg of=$f.gap name=b.right kind=number
@f.gap.6 core.function.arg of=$f.gap name=b.top kind=number
@f.gap.7 core.function.arg of=$f.gap name=b.bottom kind=number
@p.a example.node left=?a.left right=?a.right top=?a.top bottom=?a.bottom
@p.b example.node left=?b.left right=?b.right top=?b.top bottom=?b.bottom
@c.distinct core.check fn=neq args=$p.a args=$p.b
@c.gap core.calc fn=page.gap args=?a.left args=?a.right args=?a.top args=?a.bottom args=?b.left args=?b.right args=?b.top args=?b.bottom out=?gap
@t.gap example.gap.observation first=$p.a second=$p.b value=?gap
@r.gap core.rule when=$p.a when=$p.b if=$c.distinct with=$c.gap then=$t.gap
@book.measured-gap.schema.module core.module name=example
```

`f.gap` declares a pure geometric calculation and the argument declarations fix its eight ordered numeric arguments. The implementation accepts the four bounds of each rectangle and returns a finite nonnegative distance. Both patterns bind nodes in the same observed revision. `neq` removes the same-node case; because calculation can precede that filter, measuring identical bounds must be valid and return zero. The rule retains both subject references in the derived observation. The toy schemas declare numeric bounds and the two observation references explicitly. Missing or inconsistent bounds produce a diagnostic rather than an invented zero.

For rectangles A and B, compute `dx = max(0, A.left−B.right, B.left−A.right)` and the analogous vertical `dy`. Distance is `sqrt(dx²+dy²)`. Touching or overlapping rectangles yield zero. Missing or inconsistent bounds make measurement unavailable; zero is not a substitute for absent data.

For example, A spans [0,10] horizontally, B spans [18,28], and their vertical projections overlap. Then `dx=8`, `dy=0`, so gap is 8. Moving B to [24,34] gives 14. A layout function may propose that change, but apply the same measurement to its candidate and the observed result after dispatch. The planned value does not replace effect measurement.

The space uses general bound, calculation, matching and validation mechanisms. Native code supplies only the declared geometric primitive and concrete movement tool. A system with measurement alone can inspect the diagram without pretending it can repair it.

## 8.3 From SOP text to a wire’s meaning

Interpretation separates written syntax from schema-defined meaning. Parsing identifies declarations, keys and tokens. Resolution binds names to instances and referents. Validation checks types, values and cardinality; conceptual links determine applicable operations. These are semantic responsibilities, not a requirement to run every check in one fixed linear order.

The next schema World defines a note belonging to a page. Its separate instance imports that schema and stores a label deliberately resembling a command and reference, showing that content is not automatically executable:

**Schema World — `note/schema.sop`.**

<!-- sop-world id=note.schema role=schema module=example -->
```sop
@type.note.page core.type of=example.page closed=true
@type.note.note core.type of=example.note closed=true
@s.note.label core.slot of=example.note key=label kind=string
@s.note.page core.slot of=example.note key=page kind=ref to=example.page
@s.note.count core.slot of=example.note key=count kind=integer min=0
@s.note.tag core.slot of=example.note key=tag kind=atom many=true
@book.note.schema.module core.module name=example
```

**Instance World — `note/instance.sop`.**

<!-- sop-world id=note.instance role=instance uses=note.schema -->
```sop
@page1 example.page
@note1 example.note
  label="Move $page1 later"
  page=$page1
  count=2
  tag=red tag=round
@book.use.note.instance.example core.use world=example prefix=false
```

`@page1` introduces the reference target. The `@note1` declaration continues across subsequent lines; indentation is only presentational. `label` contains one string token, so the embedded `$page1` is not an active reference. The `example.page` value is a reference. At parse time `count` contains atom `2`; the slot supplies its integer meaning. Repeated `tag` entries retain both values.

| Stage | Result for the same note |
|---|---|
| Tokenisation | `label="Move $page1 later"` is one string entry; intervening newlines do not terminate the declaration. Source positions locate tokens. |
| Parsing | Identity note1, type note and the declared entries. No implied request to move anything. |
| Value classification | String, reference and atom remain distinct; the count slot supplies integer semantics. |
| Reference resolution | `$page1` binds the page identity in the loaded instance; label content does not participate in this search. |
| Schema validation | Count is a nonnegative integer, page references the required type, and repeated tags are permitted. A missing target does not cause automatic page creation. |
| Use | The note can be queried or rendered. No rule or capability in this example requests movement; the label remains content. |

The decoded label is the literal text “Move $page1 later”; it contains neither an executable instruction nor an active reference. `page=$page1` is an actual reference, and `count=2` is validated against an integer slot. This distinction is preserved by the language interpreter, so a renderer does not parse natural-language-looking labels as commands.

| Resolved information | Why it is retained |
|---|---|
| Instance and wire identity | Distinguishes `note1` from a note with the same local ID in another instance. |
| Applied type and slot declarations | Explain why count is an integer and page is a reference. |
| Source text and positions | Locate the declaration or value that produced an error or interpretation. |
| Reference target and observed version | Establish which page was read and whether a later call is stale. |
| Provenance and status | Distinguish explicit facts, derived facts and unresolved assumptions. |

Invalidate schema/state-dependent interpretation metadata when the corresponding version changes. Do not rewrite canonical source or identity to hide that change. A renderer consumes the needed declared fields rather than reinterpreting labels through private rules. Likewise `before="object exists"` remains text unless an explicit schema and mechanism give it executable meaning. Structured conditions follow R35, not the accidental appearance of a sentence.

## 8.4 Collecting relevant declarations and facts

Relevant facts are not every wire containing the same word. A duck request may need kind ancestors, available realisations, properties and applicable rules. Scheduling may require other reservations of the resolved participants even when their wording appears nowhere in the request.

A **catalogue** indexes validated declarations and their loading locations. It does not infer semantic links from name similarity. Large knowledge packages can use separately loaded **shards** belonging to one published version.

| Declared link | Reachable information |
|---|---|
| `extends` | Parent declarations and rules applicable to descendants. |
| Declared conceptual mappings | The concept represented by a type or property; follow only mappings defined and checked by the corresponding schema. |
| Slot `of`, `type` | Owning type and referenced fact type. |
| `space` | Axis definitions and declared operations for the value space. |
| `when`, `not`, `if`, `with` | Pattern, condition and calculation dependencies of a rule. |
| Tool interface and binding | The accepted operation, typed parameters, outputs, dependencies and observation mapping. |
| Fact reference | The identified object, potentially in another declared instance. |

The same key spelling on different wire types need not denote the same relationship; its schema determines meaning. A **reverse index** answers which rules or declarations depend on a type. Following ancestors lets a rule over animals be located for a duck without a duck-specific lookup.

Collection starts from the requested operation and follows declared dependencies, retaining visited identities to terminate cycles. New rule dependencies trigger further reads. Each included fact retains its inclusion reason. Budget exhaustion yields incomplete coverage, not evidence that missing facts do not exist.

For a tutorial example, consider a local calendar whose relevant meetings are fully observed; no external booking service is assumed. Its type can declare that closed population:

**Schema World — `complete-meeting-scope/schema.sop`.**

<!-- sop-world id=complete-meeting-scope.schema role=schema module=example -->
```sop
@t.meeting core.type of=example.meeting complete=true
@book.complete-meeting-scope.schema.module core.module name=example
```

This toy declaration states coverage only for the observed local population. It is justified after the relevant facts are loaded. A partially read calendar cannot be made complete by attaching this flag to its type; the loader/observer must establish the coverage claim.

The declaration names type `example.meeting`; `complete=true` allows a negative existence answer when no matching fact exists in that observed instance. The observer must establish coverage before that claim is used. The declaration creates no missing facts and says nothing about whether all knowledge dependencies were loaded.

Knowledge rules have their own dependencies. The library follows declared imports and references to load those rules and their premises. A complete event population does not prove that all required policy declarations were loaded. An unavailable dependency yields an incomplete verification, not “no restriction applies”.

Two version roles remain distinct. A **state version** changes with semantic instance changes and detects stale candidates. A **published version** identifies an exact schema/knowledge package, for example by content fingerprint. Assessment retains both; “checked at V” without identifying its role is insufficient.

**Coverage scope** identifies the facts and interval for which the source establishes completeness. It differs from a capability domain. For a local calendar it may cover all relevant `example.meeting` facts; recurring events additionally require occurrence coverage for the requested interval (R48).

## 8.5 Reasoning-engine contracts

A reasoning mechanism receives versioned state, goals, constraints, preferences and a budget. Its contract declares supported operators and **logical fragment**, such as positive rules, linear constraints or calls to particular pure primitives. A mechanism lacking negation cannot ignore a negative requirement and report success.

Deduction derives consequences, constraint solving assigns missing values, and planning constructs dependent operations. These roles are not interchangeable merely because each is called reasoning.

Interpret results according to the question they answer:

| Question | Result and relationship to other stages |
|---|---|
| Is the candidate valid? | Valid, invalid or undetermined (§3.9). Finding a candidate does not validate it. |
| What did search establish? | Validated circuit, candidate with unchecked obligations, invalid request, proved no solution, or exhaustion without a conclusion (§6.8). |
| Is the operation supported? | An unsupported-operation diagnostic permits another declared compatible mechanism; otherwise stop without pretending to prove impossibility. |
| Were data and time sufficient? | Missing data leaves unchecked obligations or no conclusion. Exhausted budget does not prove no solution exists. |
| What actually happened? | Completed, partial, rolled back, unknown effect or failed rollback (§6.9). |

A feasible candidate satisfies constraints. An optimum additionally has evidence that no admitted candidate has lower cost. Running out of time does not upgrade “feasible” to “optimal”.

The coordinator belongs to SOPWorlds LIB. It reads declared execution dependencies, asks generic inference and search mechanisms to elaborate open goals, validates candidate call circuits, dispatches ready concrete calls and observes their effects. It is not an application-specific second interpreter. A diagram or calendar name must not select an undeclared semantic algorithm inside it.

For each candidate, LIB constructs a trial state with the same schema and knowledge versions, applies the proposed effects and evaluates constraints. It retains assumptions separately from observed facts. A reversible ambiguity can be resolved by the declared ranking policy; a missing required tool argument cannot. Before dispatch, the relevant state preconditions are rechecked. A changed version triggers revalidation, not a silent invocation against an obsolete object.

A geometric or numerical primitive remains an explicit trusted dependency. Generic validation can check inputs, result types and independently verifiable properties, but cannot prove every arbitrary native program correct. The contract identifies function/version, verified input domain, tests and method limits. Registration alone is no correctness proof. Missing computation is not implicitly true. Before using a result, establish that its implementation and contract evidence apply; otherwise retain an undetermined assessment.

## 8.6 A meeting worked through numerically

Fix a resolved day and time zone for this exercise; minutes are counted from midnight. Ana has [600,660), or 10:00–11:00. The request is a 30-minute meeting with Ana starting exactly at 10:30. Reading retains the participant description, start 630 and duration 30; reference resolution supplies Ana’s identity. The computed end is 660.

This example enables the optional resource profile. `room1` is already resolved, and the same interval must be checked for the participant and room. In the simpler single-calendar profile there is no room argument to fill. The need for a resource comes from the applicable schema and tool contract, not from a universal scheduling assumption.

The following separate schema and instance Worlds isolate conflict checking. `example.candidate` denotes a trial, not a committed reservation. The domain contract separately defines absolute-time conversion and tool arguments. The local snapshot contains one existing reservation, `busy`, for the same person and room.

**Schema World — `scheduling/schema.sop`.**

<!-- sop-world id=scheduling.schema role=schema module=example -->
```sop
@type.time.person core.type of=example.person closed=true
@type.time.room core.type of=example.room closed=true
@type.time.meeting core.type of=example.meeting closed=true complete=true
@type.time.candidate core.type of=example.candidate closed=true
@slot.time.meeting.people core.slot of=example.meeting key=people kind=ref to=example.person present=true
@slot.time.meeting.room core.slot of=example.meeting key=room kind=ref to=example.room present=true
@slot.time.meeting.start core.slot of=example.meeting key=start kind=number present=true
@slot.time.meeting.length core.slot of=example.meeting key=length kind=number min=0 present=true
@slot.time.candidate.people core.slot of=example.candidate key=people kind=ref to=example.person present=true
@slot.time.candidate.room core.slot of=example.candidate key=room kind=ref to=example.room present=true
@slot.time.candidate.start core.slot of=example.candidate key=start kind=number present=true
@slot.time.candidate.length core.slot of=example.candidate key=length kind=number min=0 present=true
@p.old example.meeting people=?person start=?old.start length=?old.length
@p.new example.candidate people=?person start=?new.start length=?new.length
@p.room.old example.meeting room=?room start=?old.start length=?old.length
@p.room.new example.candidate room=?room start=?new.start length=?new.length
@c.old.end core.calc out=?old.end fn=add args=?old.start args=?old.length
@c.new.end core.calc out=?new.end fn=add args=?new.start args=?new.length
@c.left core.check fn=lt args=?new.start args=?old.end
@c.right core.check fn=lt args=?old.start args=?new.end
@d.person core.deny when=$p.old when=$p.new with=$c.old.end with=$c.new.end if=$c.left if=$c.right why="participant overlap"
@d.room core.deny when=$p.room.old when=$p.room.new with=$c.old.end with=$c.new.end if=$c.left if=$c.right why="room overlap"
@book.scheduling.schema.module core.module name=example
```

**Instance World — `scheduling/instance.sop`.**

<!-- sop-world id=scheduling.instance role=instance uses=scheduling.schema -->
```sop
@ana example.person
@room1 example.room
@busy example.meeting people=$ana room=$room1 start=600 length=60
@book.use.scheduling.instance.example core.use world=example prefix=false
```

The schema World owns the types, slots and constraints. The separate instance World imports it and owns the observed person, room and busy meeting. Two pattern pairs join on shared participant and shared room separately. `c.old.end` and `c.new.end` compute each matched interval’s end, with local bindings preventing unrelated reservations from mixing. `c.left` and `c.right` express the strict overlap inequalities. Each deny uses both calculations and tests; checking one resource does not replace checking another.

The meeting population is complete only within this local exercise after loading all relevant reservations for both resources and the checked interval. This neither prevents external changes nor closes every calendar. Do not assert completeness merely to obtain a convenient free time. Dispatch checks the source version as well as its coverage.

For the trial `@trial example.candidate people=$ana room=$room1 start=630 length=30`, both deny patterns match: participant and room overlap. For start 660 they do not match, because the half-open interval [660,690) starts exactly at the old interval's end. Passing these checks establishes only this constraint result; it does not create an event or establish every other precondition.

Half-open intervals [a,b) and [c,d) overlap exactly when a < d and c < b. Here 630 < 660 and 600 < 660, so there is a conflict. The rule first joins reservations by participant, then computes interval overlap; the word “meeting” does not itself establish that fact.

A candidate beginning at 660 occupies [660,690). The test 660 < 660 is false, so the known booking does not block it. This alone does not prove availability: observe all relevant reservations through 690. An unavailable source leaves the result unknown.

The concrete binding is worth following. `p.old` matches `busy`, giving `?person=$ana`, `?old.start=600` and `?old.length=60`. The trial binds `p.new` with the same person and proposed start 630, length 30. The two `add` calculations produce 660 and 660. Both `lt` checks succeed, so `d.person` identifies this exact pair as a violation. With start 660, `?new.end` becomes 690 and `660 < 660` fails; that pair no longer violates the rule. The room rule performs the same join using `room=$room1`. These bindings, not a name-based scheduling shortcut, connect the schema to the instance facts.

The initial time was explicit. Under the declared no-overlap policy, 11:00 remains an alternative rather than a silent replacement for 10:30. A vague “later” request would instead allow LIB to choose the ranked feasible time and explain that choice. This difference follows the source and strength of the requirement, not a refusal-first treatment of all uncertainty.

To continue with a feasible creation, consider the separate request “book the next free 30-minute meeting with Ana after 10:30”. This allows a later start. LIB derives 660 under the declared objective and emits a creation instruction containing the resolved calendar, title, participant and room references, absolute date/time corresponding to 660, and duration 30 minutes. The tool does not see “next free”. Observation must find the returned event identity with those values and no alteration to the existing booking before the response says it was scheduled.

If several people have the same label, identity resolution ranks context evidence such as explicit selection and prior bindings. A freer calendar is not itself evidence of which person the user meant. With a usable reversible interpretation, LIB can act on the best supported identity, name it and retain alternatives and undo. Genuine uncertainty remains in the trace; it is not removed by presenting one candidate.

| Scenario branch | Retained state and justified response |
|---|---|
| Two people named Ana | Rank contextual evidence; preserve both candidates. If a usable reversible choice is made, name the selected identity and the assumption. Never invent distinguishing personal facts. |
| Exact 10:30 conflicts; 11:00 is verified free | Preserve the explicit time. “The requested 10:30 conflicts with Ana’s meeting; 11:00 is the nearest free alternative.” No booking is claimed. |
| A request allowing the next free time yields an observed creation at 11:00 | Retain the new event identity and invocation. “I scheduled the meeting with Ana from 11:00 to 11:30; that was the next free interval.” |
| Confirmed rejection and observed absence of the effect | No new event is attributed to the invocation. “The booking was rejected; no meeting was created.” Include a reason only when verified. |
| Lost reply and unknown effect | Do not blindly retry creation. “I could not confirm whether the meeting was created. I need to check the calendar.” |
| Undo after confirmed creation | Compensate only the correlated event. After observing its removal: “I removed the meeting I just created.” The original 10:00–11:00 booking remains. |
| Unconfirmed compensation | Keep the journal and unresolved status. “I could not confirm the cancellation; the meeting may still be present.” |

After a lost reply, locate effects by the invocation identity or idempotency key established before dispatch. Equal event values do not prove equal invocation: someone else may have created an identical event. A found correlated effect supplies its identity. Proved absence may permit a retry under the same key when policy allows. Otherwise the effect remains unknown; transport failure does not prove absence.

Undo compares the event’s current revision with the observed post-state. Do not erase subsequent independent edits under the guise of restoration; apply the compensation policy (§6.9.2). Add the observed compensation to the journal rather than deleting the episode. The execution contract is general; the calendar supplies concrete identities and observations.

After confirmed creation, represent the event as a diagram node under the example’s snapshot policy (R58–R59). Read a coherent version, preserve consumed values and provenance, then construct the diagram. Active calendar references and historical source evidence have different lifetimes (§2.6).

Within the temporary composition context, both instances are available and the calendar alias resolves to its immutable identity. This pseudocode identifies the projection input; `m2` is the new event rather than the original reservation:

```text
Pseudocode — projection input
source: calendar instance / event m2 / coherent state revision
mode: snapshot
```

The projection resolves the source event against its instance and version. That temporary read dependency is not automatically a permanent live dependency of the saved diagram. Start, duration and participant are read from one coherent snapshot. The following pseudocode shows the resulting data; a domain schema must define its concrete storage representation.

```text
Pseudocode — projected snapshot and node
snapshot: calendar-instance-id / m2 / state-18
captured values: start 660, duration 30, participant ana-id
node label: 11:00–11:30
node provenance: that snapshot
```

The snapshot retains source identity and the values supporting its label, including the resolved participant `ana-id`; it creates no person in the diagram. An independently exported snapshot also needs the fixed day, time zone and duration unit. Its label is calculated from 660 and 30, not copied from the rejected request for 10:30.

The saved node retains local provenance to the captured values. Closing the calendar need not invalidate historical provenance. Moving the source event later does not make a snapshot chart current: explicit refresh reads another coherent revision and produces new provenance. A live view instead requires declared invalidation, propagation and lifetime semantics.

A meetings-per-participant chart requires the whole declared aggregation population, not only this event. Retain source identities, versions and coverage; count each event identity once per applicable participant. A valid individual node does not prove completeness of an aggregate chart. This is the additional obligation of aggregation, not permission to copy person identities into unrelated objects.

# 9. Request classes and their resolution circuits

The public semantic boundary is SOP Lang. A request circuit states a goal or question; it is not necessarily executable. The library elaborates it using schema, knowledge and live instance Worlds. The terminal result is either a concrete circuit of typed tool calls, or a justified answer derived from observations, with any unresolved obligations retained. Internal JavaScript methods are implementation details, not a second semantic interface.

## 9.1 Questions: values, count, existence and members

A question selects existing subjects and declares its projection separately. Asking for their colour does not require changing their colour. The following independent examples use the `std.request` schema. The invented kind `sample.item` names an application vocabulary concept; it does not give that kind a renderer or imply the existence of any instance.

**Instance World — `values-query/request.sop`.**

<!-- sop-world id=values-query.request role=instance -->
```sop
@source.query.values std.request.source text="What colours are the items?"
@request.query.values std.request act=inspect mood=ask source=$source.query.values query=$query.values
@target.query.values std.request.target request=$request.query.values mode=existing kind=sample.item
@query.values std.request.query request=$request.query.values target=$target.query.values operation=values concept=colour
@book.use.values-query.request.std.request core.use world=std.request
```

**Instance World — `count-query/request.sop`.**

<!-- sop-world id=count-query.request role=instance -->
```sop
@source.query.count std.request.source text="How many items are there?"
@request.query.count std.request act=inspect mood=ask source=$source.query.count query=$query.count
@target.query.count std.request.target request=$request.query.count mode=existing kind=sample.item
@query.count std.request.query request=$request.query.count target=$target.query.count operation=count
@book.use.count-query.request.std.request core.use world=std.request
```

**Instance World — `existence-query/request.sop`.**

<!-- sop-world id=existence-query.request role=instance -->
```sop
@source.query.exists std.request.source text="Are there any items?"
@request.query.exists std.request act=inspect mood=ask source=$source.query.exists query=$query.exists
@target.query.exists std.request.target request=$request.query.exists mode=existing kind=sample.item
@query.exists std.request.query request=$request.query.exists target=$target.query.exists operation=exists
@book.use.existence-query.request.std.request core.use world=std.request
```

**Instance World — `members-query/request.sop`.**

<!-- sop-world id=members-query.request role=instance -->
```sop
@source.query.members std.request.source text="Which items are there?"
@request.query.members std.request act=inspect mood=ask source=$source.query.members query=$query.members
@target.query.members std.request.target request=$request.query.members mode=existing kind=sample.item
@query.members std.request.query request=$request.query.members target=$target.query.members operation=members
@book.use.members-query.request.std.request core.use world=std.request
```

LIB resolves the target kind against compatible instance Worlds and the schema's declared type relationships, selects a population from a coherent snapshot, evaluates any selectors, and applies the requested projection. Suppose a complete snapshot contains `a`, red, and `b`, blue. Values yields those property values with their subject identities; count yields 2; existence yields true; members yields `a` and `b`. Duplicated evidence for `a` does not create a third item. The answer retains the instance, snapshot version, selection evidence and declared coverage.

The query record therefore determines a computation, not merely the wording of the reply. `target` supplies the selected subject population. `operation=count` counts its distinct identities; `operation=values` additionally follows `concept` through the applicable property binding and projects each subject's observed value. A missing property binding is a different obligation from an empty population. Neither case should be repaired by reading a similarly named private field from an arbitrary native object.

For a partial snapshot containing only `a`, existence can still be true. Count is at least 1, not exactly 1; a full members list is unknown. If no member is observed in a partial population, existence is unknown rather than false. A values query must distinguish an absent property from a known empty value. These rules are generic consequences of coverage, independent of whether the subjects are drawing objects, calendar events or document chapters.

## 9.2 Selection and result requirements have different roles

“How many red items?” adds a selector to the target:

**Instance World — `red-count-query/request.sop`.**

<!-- sop-world id=red-count-query.request role=instance -->
```sop
@source.query.red std.request.source text="How many red items?"
@request.query.red std.request act=inspect mood=ask source=$source.query.red query=$query.red
@target.query.red std.request.target request=$request.query.red mode=existing kind=sample.item selector=$selector.red
@selector.red std.request.constraint request=$request.query.red target=$target.query.red concept=colour operator=eq value="red" polarity=positive character=requirement
@query.red std.request.query request=$request.query.red target=$target.query.red operation=count
@book.use.red-count-query.request.std.request core.use world=std.request
```

The selector tests the observed colour. In “make the selected items red”, colour is instead a requirement on the result. Filtering out blue items before recolouring would lose exactly the objects that need changing. The compiler retains these roles through every transformation: bind subjects from the selector, then instantiate property-change calls for those subjects, then observe the result predicate. A type-valid graph that swaps these roles is semantically wrong.

Schema declares what colour means for that kind and how it maps to a concrete tool field; knowledge resolves a named colour to the representation required by the tool. A string such as “red” in a request is not automatically a renderer code. A tool that accepts a hexadecimal colour receives the resolved code; the correspondence and source remain visible in the elaboration trace.

## 9.3 Rules, inference and search

Rules derive facts from matching premises; they do not inspect arbitrary sentence fragments. The following toy model states that a selected item is eligible. Its schema World owns the types and rule; its instance World imports that schema and owns the concrete items. Their temporary evaluation context can contain both sources without changing their ownership.

**Schema World — `eligibility/schema.sop`.**

<!-- sop-world id=eligibility.schema role=schema module=sample -->
```sop
@type.sample.item core.type of=sample.item closed=true
@slot.sample.id core.slot of=sample.item key=id kind=string present=true
@slot.sample.selected core.slot of=sample.item key=selected kind=boolean present=true
@type.sample.eligible core.type of=sample.eligible closed=true
@slot.sample.eligible.id core.slot of=sample.eligible key=id kind=string present=true
@pattern.sample.selected sample.item id=?id selected=true
@template.sample.eligible sample.eligible id=?id
@rule.sample.selected core.rule when=$pattern.sample.selected then=$template.sample.eligible
@book.eligibility.schema.module core.module name=sample
```

**Instance World — `eligibility/instance.sop`.**

<!-- sop-world id=eligibility.instance role=instance uses=eligibility.schema -->
```sop
@sample.a sample.item id="a" selected=true
@sample.b sample.item id="b" selected=false
@book.use.eligibility.instance.sample core.use world=sample prefix=false
```

The matcher binds `?id` to `"a"`; the rule derives `sample.eligible id="a"` with the rule and matching fact as evidence. It does not derive eligibility for `b`. If the supporting selection changes, derived eligibility must be re-evaluated. A request that operates on eligible items can consume this conclusion; derivation alone does not issue a tool call.

Notice what did not happen: the library did not infer the meaning of “eligible” from its spelling or choose a tool from that conclusion's name. The rule defines the condition, and an independently declared method can use the resulting population as an input. A second eligibility rule would add another justified route; it would not require a second sentence handler.

Search is needed when rules constrain several possible completions without forcing a single value. For “place the group without overlap”, schema supplies dimensions and coordinate units; instance facts supply members and occupied regions; knowledge supplies candidate generation and the ranking objective. LIB generates candidate positions, measures collisions, rejects forbidden intersections and ranks feasible candidates. It emits coordinates for a selected candidate, with its assumptions. A pure geometric calculation can be native; which group, which constraints and which objective to use must be declared.

## 9.4 Creation, modification and composition

“Draw a tree and a house” introduces two new targets under the shared creation act. The reader must preserve both noun groups and their local conditions. LIB selects representations, instantiates parts, derives required size and position arguments, and constructs calls with output references for newly created objects. “Draw a tree near the house” instead introduces one new target and an existing anchor. Splitting at every noun or every “and” cannot implement this distinction.

A concrete call contains only typed literals, resolved existing references, or typed outputs of earlier calls. Its operation, required arguments, units and coordinate frame are known. It has no unresolved “the other one”, “large”, “near” or “tomorrow”. Calls may have explicit dependencies and guards; their order follows those dependencies, not the order of declarations in the file. The generic dispatcher binds outputs and invokes primitives. The tools do not interpret the overall plan.

A UI command that already supplies an object reference and colour uses this same validation and dispatch boundary directly. It need not be translated into English and read again. Its training pair can still record the natural text and concrete SOP intent, without making that pair the execution mechanism.

## 9.5 Follow-ups, collective requests and transfers between Worlds

| Request class | Generic elaboration | Terminal obligation |
|---|---|---|
| “Move the other one down” | Retain compatible identities, exclude the prior referent, rank context evidence, resolve the vertical frame and declared step. | Concrete subject, coordinate change, explicit assumption if the reference remained uncertain. |
| “Make every red box smaller” | Evaluate the red-box selector on one population snapshot; bind each member; apply the declared size step and bounds. | One typed change per selected identity, or a bulk primitive with equivalent declared semantics; preserve all other properties. |
| “Add two items to each group” | Bind each group separately and instantiate a local creation quantity of two. | Returned identities are attached to the correct parent; two globally is not equivalent. |
| “Show meetings per day as a chart” | Read the declared date interval with coverage; group by resolved local day; count unique event identities; instantiate the chosen chart method. | Diagram calls contain concrete values and geometry; provenance points to the consumed calendar snapshot. |
| “Put that chart into the report” | Resolve the chart and document separately, select snapshot or live-reference semantics from declarations, instantiate the insertion method. | Concrete document insertion with explicit content/reference and observation of the inserted section. |

An uncertain but usable reversible interpretation is acted on with its actual effect and assumption stated; ranked alternatives and undo remain available. Explicit constraints are preserved. Missing evidence cannot be converted into a factual assertion, and an unbound required argument cannot be passed to a primitive as if it were concrete. The trace identifies the precise remaining obligation instead of hiding it behind “the system understands”.

# 10. The reader: from text to candidate request circuits

The reader proposes request graphs with source spans, roles, ownership and uncertainty. A neural encoder such as SOP-BERT can predict act labels and token spans; it does not generate executable tool calls by itself. A span head locates a substring using token offsets. A generic decoder builds graph nodes from those predictions under the request schema. If two target spans are found but the decoder retains only one target field, a second object is lost after recognition. More training cannot repair a representation that has discarded it.

A symbolic reader can instead obtain candidate structure through declared lexical and grammar rules. These are alternative ways to propose the same request contract. LIB's subsequent world resolution and elaboration must not depend on which reader supplied it. The constructions in this chapter define the required distinctions, rather than requiring every reader to build an identical internal syntax tree. SOP-BERT is the reader used by the PSys2 tutorial application; it is not a requirement imposed on every SOP Worlds application.

## 10.1 The lexicon: language forms linked to concepts

A reader receives text and returns candidate descriptions, not tool commands. The examples in this chapter use English. Reading requires three distinct kinds of information: a lexicon linking forms to meanings, a grammar relating fragments, and semantic composition rules that turn those relationships into requirements. Recognising every word does not establish that the relationship between the words was understood. “Before” and “after” can mention the same objects while requesting opposite changes.

Language Worlds own language forms and constructions; conceptual knowledge Worlds own the kinds, regions and relations they denote. Names introduced in an instance extend its local vocabulary without changing every World's vocabulary. A lexical entry retains its form, lemma, grammatical category, relevant features and one or more senses. Each sense identifies a concept or role; coincidentally matching names do not establish a semantic link.

The connection can be followed in either reading direction. A source form proposes a sense; that sense names a concept; a compatible schema/property binding tells the compiler how the concept applies in this World. In the other direction, a verified concept/value can select a lexical form for a reply. Both directions need an explicit lexical relation. A structural type named `red` would not by itself teach the reader the colour adjective, just as a colour word would not define a type's fields.

| Entry category | What is declared and how it is used |
|---|---|
| Nouns and names | A conceptual kind or named identity; plural morphology does not change the kind. An instance name can span several words. |
| Act verbs | A general act and its argument frames: required and optional roles and the complements that realise them. A verb does not select a tool by itself. |
| Adjectives and degrees | The modified concept and its region or degree operator; incompatible senses remain separate candidates. |
| Prepositions and relations | Possible senses, relational roles and permitted complement types. One form can have temporal and spatial senses. |
| Determiners, numbers and quantifiers | Existing reference versus introduction, quantity, distribution and quantifier scope. “Each” is not dispensable noise. |
| Pronouns and dialogue words | Referential role, person, number or relationship to an open question; the concrete object is resolved from context. |
| Negation and coordination | The logical operator and the construction it governs, rather than a global flag saying that the sentence contains “not” or “and”. |

A lexical form can have several categories or senses. Its selection depends on sentence structure and concept types. “Light” can modify a colour or an object's weight; always turning it into one number loses that distinction. An exact object name must not be spelling-corrected simply because it resembles a common word.

### 10.1.1 Matching imperfect forms

A typed message need not consist of correctly formed words. The reader preserves the original text and constructs candidate segmentations and forms, each linked to the original ranges and proposed operations. This uses the approximate-matching search from section 6.4.1 at the lexical level, before choosing a meaning. Letter distance does not replace conceptual distance: similar spellings can have incompatible meanings.

First search exact forms, including local names spanning several words. For an unresolved segment, generate candidates by insertion, deletion, substitution, transposition and movement of a word boundary. The declared policy supplies costs, tolerance and search budget, calibrated through chapter 12; these examples do not justify a universal numeric threshold. Grammatical fit and role compatibility eliminate candidates, but executability alone does not establish intent.

| Received fragment | Candidate and required check |
|---|---|
| `watter` | `water`, by removing a duplicated letter, if the original form is unknown and the sense fits the role. Preserve the link to the whole original fragment. |
| `th epond` | `the pond`, by moving the boundary without changing the letter sequence. The determiner and noun must form a valid noun group together. |
| `upper` in a change request | First retain the existing lexical sense, such as an upper region. An unusual comparative construction can also propose an increase along the vertical axis, but the readings are not synonyms: a requested region and a relative displacement have different conditions. |
| Exact object name `Watter` | Retain the reference to that object; do not turn it into `water`. Local names and quoted ranges are protected from automatic correction. |

A repair can affect several tokens, so provenance is more than a “wrong token → right token” pair. The `th epond` alternative retains original character ranges even when its resulting tree has different boundaries. Numbers, negation and units cannot disappear as noise. An approximate name can supply a candidate referent but is not silently renamed or substituted. Repair can introduce information as well as remove it: `now`/`not`, `on`/`no`, `on`/`one` and `for`/`four` are spelling neighbours that change time, negation or quantity. A repair changing a negation, number, quantifier, unit or name must retain the distinct readings and their evidence, rather than silently trusting a spelling score. Equivalent spelling normalisation does not itself change quantity. Exact forms remain the first analysis; these pairs are counterexamples to aggressive correction, not instructions to confuse their meanings.

Equivalent descriptions can merge while retaining their separate evidence. Different descriptions remain ranked alternatives. For “upper”, context can support either a comparative move or placement in an upper region. With a usable reversible interpretation, act on the best supported one, state the concrete move and retain undo. Exhausting a search budget does not prove that the retained alternative was unique.

## 10.2 Grammar and the syntax tree

A grammar rule describes how an expression is built from components. A noun group can contain a determiner, quantity, modifiers and head noun. The resulting tree retains each component and its text range. This differs from the wire pattern in section 3.4: the tree describes text structure, while a SOP pattern searches a World. The tree can subsequently be represented as wires, but the two operations are distinct.

The following explanatory grammar describes required constructions using grammar notation, not loadable SOP declarations. `NP` means noun group, `PP` prepositional group, `V` verb, `N` noun and `Adj` modifier; `?`, `*` and `+` mean optional, zero or more, and one or more occurrences respectively. `Name`, `Pron`, `Det`, `Num`, `Prep` and `Coord` are lexical categories.

```text
Message  := Command | RequestFrame | Fragment
Command  := V NP Complement*
RequestFrame := "I want" NP | "can I get" NP | "make it so" Clause
Clause   := NP Predicate
NP       := Name | Pron | Det? Num? Adj* N Modifier*
Modifier := PP | Relative
PP       := Prep NP
Relative := "that" Predicate
Group    := NP (Coord NP)+
Fragment := PP | Adj | Num | Direction | Degree | NP (Complement | Direction | Degree)+
```

This sketch shows the components without claiming to define a complete grammar. `Complement` is a role permitted by the verb frame; `Predicate` is a property or relation in the supported constructions. Coordination appears where the grammar permits it, with its group category; it does not mean cutting the message at every “and”. An operational grammar defines every category it uses and declares recursion and computation bounds.

| Construction | Structure and semantic obligation |
|---|---|
| Imperative | Link the verb to an act and complements to frame roles; an omitted role remains open. |
| Noun group with adjectives and PP | Retain the head noun and its modifiers. A preposition can modify the noun or act, so alternative attachments remain distinct. |
| Coordination | Build separate groups or shared conditions according to the coordinated category; one member's quantity does not transfer to another. |
| Restrictive relative clause | Add a selection predicate, as in “the section that contains the table”. Do not execute the act mentioned in the relative clause. |
| Pronoun | Produce a referential requirement with features; do not choose an object before consulting focus and selection evidence. |
| Ellipsis and fragment | Retain expressed and omitted roles; contextual resolution determines what can be inherited from dialogue. |
| Negation and distribution | Preserve operator scope: negating an act, property or quantifier has different results. |

The grammar entry point is `Message`, not merely an imperative. `Direction` and `Degree` are lexical categories for direction and comparative change; `Clause` expresses a requested state, and `Predicate` can be a property or relation. The frames illustrate construction families declared in language Worlds, with roles and composition rules, rather than whole-sentence equality tests. Politeness, inflection and interrogative forms extend these constructions while preserving the same roles.

| Message form | Produced description and information still needed |
|---|---|
| `down` | Direction of change on an axis; subject, frame and step come from context or remain open. |
| `more` | Increase in degree or quantity; identify the modified concept instead of automatically using the last number. |
| `on the lake` | Relation to an existing target; it can correct the active request's location without introducing another object. |
| `the pond up` | Explicit subject plus direction; infer the change act from the construction and applicable axis. |
| `I want a boat` | Desired state with an introduced target; an editing context can support creation while retaining determination and quantity. |
| `can I get a boat` | In the tutorial's drawing-editing context, this indirect frame requests creation with `mood=do`. An explicit feasibility question retains `check`. |
| `make it so the heading is above the table` | Requested final state relating referents; planning selects the change that realises it without inventing an omitted verb in the source. |

Context resolution fills omitted roles from explicit selection, dialogue bindings and applicable World declarations. For “more” after a size change, bind the prior subject and size concept and apply the declared comparative step. If count and size both remain plausible, retain and rank both interpretations, apply a usable reversible one and identify its concrete effect. A new user message authorises that adjustment; the mechanism does not autonomously repeat it forever.

Act and request mood are independent. `std.request` declares `mood=do|propose|check|ask`: effect, proposal, feasibility check or information. Only `do` dispatches mutations; `propose` and `check` evaluate candidates without claiming a real effect. Indirect requests such as “could you add a box” normally denote `do` in an editing context. The absence of an imperative verb does not justify returning only a statement of capability.

| Frame and context evidence | Mood and continuation |
|---|---|
| Request to an assistant for a result in the person's editing context | `do`; construct and validate the plan, then dispatch without a redundant question about whether a request was intended. |
| Feasibility or hypothetical-effect question, or explicit wording such as `just check` | `check`; evaluate the plan without changing live state. |
| Request for alternatives or a recommendation | `propose`; present options and their justification. |
| Several plausible conversational goals | Rank them using declared context policy. A usable reversible editing interpretation can execute with its assumption stated; preserve alternatives. |

Mood does not establish access rights. The library interprets conversational evidence and the declared policy for unresolved alternatives, while each concrete call must satisfy resource permissions and preconditions. A `check` does not become `do` because it is feasible. A vague but usable editing request does not become `check` simply because several reversible interpretations exist. The selected mood and uncertainty remain visible.

A grammar can be inspected independently of execution. In the following toy example, lexical categories and a coordination rule preserve the different quantities and modifiers. The notation is explanatory pseudocode, not a public JavaScript API.

```text
Pseudocode — declared grammar and result
Num(two) = 2; Adj(red) = red; N(cards) = card; N(note) = note; Det(a) = a
NP := Det? Num? Adj* N
Coordination marker := and
Input: two red cards and a note
Result: [{quantity: 2, modifiers: [red], kind: card},
         {determiner: a, modifiers: [], kind: note}]
```

Quantity 2 and modifier red belong only to cards; the note is a separate noun group. Source token positions must map back to character positions in `std.request.source`. Finding both nouns is insufficient if ownership or quantity is lost when the request circuit is assembled.

With that grammar, “two red cards except a note” leaves `except` unbound. The reader must preserve the unsupported relationship; executing only the cards would silently drop a possible exclusion. Unrelated remarks may be ignored under the declared relevance policy, but a fragment that changes targets, quantity, negation or scope cannot be discarded as chatter.

A reader declares a computation budget and retains whether candidate enumeration was truncated. First place in a truncated list is not proof of unique meaning. It can still be the best usable reversible interpretation under the policy, with alternatives and uncertainty retained; the trace must not pretend the search was exhaustive.

## 10.3 Semantic composition, attachment and constraint scope

Composition rules turn each candidate structure into a description. A noun introduces a target; a number constrains that target's group; an adjective constrains the concept and target identified by attachment; a preposition supplies a relation with explicit roles. The verb introduces an act whose frame binds object and result roles. Each rule consumes an identified node and produces wires with that node's source evidence. It does not search for any matching word anywhere in a message to fill a global key.

Semantic composition proceeds bottom-up over a candidate structure. A noun group introduces a target with its source; a modifier adds a constraint owned by that target; a verbal frame assigns argument roles. Map declarations copy or combine typed child results. Missing required roles remain open. A mapping cannot silently null a negation or quantity just because the resulting request would be easier to execute.

For example, a toy production with one child for an object and another for a property can construct `target` and `result` fields by copying those child results separately. Two lexical property senses produce two candidate descriptions; the mechanism neither merges them nor treats the first as certain intent. A missing child mapping or required feature rejects the analysis with its reason retained. Purely syntactic material may explicitly map to null; the declaration's author is responsible for that choice, since an incorrect null mapping can remove meaning.

Lexicon providers, grammar productions and semantic mappings belong in language Worlds. A generic compiler checks mapping references, cycles, required fields and source ownership before producing a request graph. Different senses remain alternatives. Colour names such as “dark blue” stay source-backed concepts until knowledge resolves them to the tool representation; the presence of spaces in a value does not determine its type. Serialization preserves typed literals and references, preventing a string from introducing another wire or reference.

A verbal frame distinguishes the described subject from the requested result. “Move the note beside the heading” can describe a note already beside the heading or a new destination; the frame and attachment determine which. Generic template projection preserves these roles and source paths; it does not pick the frame merely because a particular tool is available.

Agreement conditions constrain which child meanings can combine: an adjective's concept must be applicable to the target kind, and a relational goal must fill the declared role. Conditions compare typed values and explicit paths. A missing path is different from a false comparison; neither can be replaced by a domain-specific guess in the mapping engine.

Equality in these conditions is structural: object-field order does not matter, array order does, and numeric `1` differs from string `"1"`. It is not ontological concept equivalence and does not convert units. All condition declarations are validated before candidates are returned, including rules not used by the current message. A malformed declaration cannot be ignored merely because the current tree does not visit it. Knowledge specifies which concepts should agree; the mechanism performs the same general comparison for every production.

Composition produces structured content that must still be validated as a request. The adapter serializes it as `std.request` wires and validates schema, concepts, roles and references; successful composition does not replace that obligation. Original ranges can be copied as evidence without changing the source tree. Computation and depth are bounded, and exhaustion preserves an explicit incomplete status. A parser's special coordination node does not acquire semantics automatically: it requires a declared mapping. The mechanism alone does not establish coverage of every English construction illustrated here.

For “make two red cards and a note”, coordination produces two targets of the creation act. The card group receives quantity 2 and colour red; the note group receives quantity 1 from the singular determiner. Each requirement retains the fragment that introduced it. The transformation does not make the note red or interpret 2 as the total number of all results. These consequences follow from structure, not card-specific rules.

| Text structure | Description and preserved information |
|---|---|
| Number inside a noun group | Quantity constraint owned by that group's target, with `scope=group`. |
| Noun adjective | Constraint on the adjective's lexical concept, usually with `scope=each` for the group's members. |
| PP attached to the object | Relation restricting its reference or description; not automatically a movement destination. |
| PP attached to the act frame | Value for location, time, participant or another role permitted by the frame. |
| Coordination of groups | Separate targets and their relationship; local constraints remain local. |
| Negated quantifier | Explicit logical structure, rather than distributing negation over every object. |

For the two readings of “Move the note beside the heading”, rank frame, context and attachment evidence. If one gives a usable reversible move, carry it out and state which note and destination were chosen. Keep the alternative reading. A shorter parse or an executable tool binding alone is not evidence that the other reading is false.

Negation and quantifier scope use the logical nodes in section 10.3.1. Simple constraints remain leaves; explicit grouping distinguishes negating a condition from negating its quantification.

Semantic checking has separate obligations: coherent types and roles; references resolved or retained as open; coverage of every source fragment that affects intent; and feasibility assessment. An impossible request can still have been read correctly. A missing capability is reported as such, not used to replace an explicit intent with another executable one. Rephrasing and rereading can expose information loss, but components repeating the same mistake can pass that check; independent interpretations remain useful evidence.

### 10.3.1 Logical nodes and quantifier binding

Negation and quantification use an explicit logical graph. Leaves test target predicates; internal nodes compose truth values. Validation checks ownership, reachability and bound variables before evaluation. A well-formed graph is not automatically true, and truth in a candidate state is not an observed effect.

| Type | Fields and meaning |
|---|---|
| `std.request.not` | `request` references the owning request; `of` identifies exactly the negated condition. Invert true/false and retain unknown. |
| `std.request.group` | `request` references the owner; `operator=and` or `operator=or`, with repeated `member`. Combine members in the same variable scope. |
| `std.request.quant` | `request` references the owner; `kind=all`, `any`, `each` or `none`; `target` identifies the collection, `bind` the local subject bound to each member, and `body` the evaluated condition. |

`all` requires every member to satisfy its body; `any` requires at least one witness; `none` denies that existential condition. `each` has the same truth condition as `all` but retains distribution of requirements and evidence per member for planning and explanation. It is not itself another quantity: “two for each section” requires a result target local to each section and a quantity constraint inside the quantifier body.

A `mode=bound` target does not search a World independently. Its quantifier supplies each member identity in turn. An inner quantifier has its own binding and cannot accidentally capture another's target. The request identifies its logical root with `root`. When a root is present, all declared conditions and logical nodes must be reachable from it; an orphan condition, cycle, missing reference or bound target used outside its body is a schema error. A simple request without logical nodes can use the implicit conjunction from section 6.3.2; a graph containing `not`, `group` or `quant` requires an explicit root. Groups are nonempty. Each bound target has one binder and cannot carry the name or determiner of an independent search.

A node can be shared by branches only if bindings are valid along every path reaching it. A condition about a quantifier's local member cannot also appear directly in an outer branch. An inner quantifier can use an outer bound target as its collection and introduce a distinct local member target. Finding one convenient traversal path is insufficient to establish valid scope.

Request validation checks structure, ownership, reference types and variable scope. It does not resolve a name, interpret a concept's measurement or establish a population's completeness. Those are separate internal compiler obligations with evidence retained at each boundary.

Compare “do not move all the notes” and “do not move any note”. Resolve both collections from the same reference state. The leaf predicate says that the current step moves a note: candidate assessment uses the proposed difference, while post-execution assessment uses the observed difference and correlated invocation evidence. It does not mean the note was moved at some point in its history. `concept=change operator=occurred act=place phase=result value=true` represents this event predicate.

**Instance World — `not-all-notes/request.sop`.**

<!-- sop-world id=not-all-notes.request role=instance -->
```sop
@source.notes std.request.source text="do not move all the notes"
@request.notes std.request act=place mood=do source=$source.notes root=$not.all
@notes std.request.target request=$request.notes mode=existing kind=note determiner=definite
@member std.request.target request=$request.notes mode=bound
@moved std.request.constraint request=$request.notes target=$member concept=change operator=occurred act=place phase=result value=true polarity=positive character=requirement source=$source.notes
@all std.request.quant request=$request.notes kind=all target=$notes bind=$member body=$moved
@not.all std.request.not request=$request.notes of=$all
@book.use.not-all-notes.request.std.request core.use world=std.request
```

| First request stage | Preserved interpretation |
|---|---|
| Collection resolution | Identify the intended notes, state version and population coverage. |
| Body evaluation | Check whether the current step moves each note. |
| Quantification | `all` is true only if every note is moved. |
| Outer negation | `not.all` requires that not every note is moved. By itself it does not require moving even one. |

The second request preserves targets and predicate but changes the source and root; `any` and `not.any` replace `all` and `not.all`. The next block is an independent alternative revision, not declarations to concatenate with the preceding block under the same identities.

**Instance World — `not-any-note/request.sop`.**

<!-- sop-world id=not-any-note.request role=instance -->
```sop
@source.notes std.request.source text="do not move any note"
@request.notes std.request act=place mood=do source=$source.notes root=$not.any
@notes std.request.target request=$request.notes mode=existing kind=note determiner=definite
@member std.request.target request=$request.notes mode=bound
@moved std.request.constraint request=$request.notes target=$member concept=change operator=occurred act=place phase=result value=true polarity=positive character=requirement source=$source.notes
@any std.request.quant request=$request.notes kind=any target=$notes bind=$member body=$moved
@not.any std.request.not request=$request.notes of=$any
@book.use.not-any-note.request.std.request core.use world=std.request
```

| Second request stage | Preserved interpretation |
|---|---|
| Collection and body | The same notes and the same predicate about movement in the current step. |
| Quantification | `any` is true if at least one note is moved. |
| Outer negation | `not.any` requires moving no note; it is equivalent to `none` over the same body. |
| Planning consequence | Reject any candidate that moves even one note. |

With three identified notes, moving two satisfies “not all” but not “not any”. Moving all satisfies neither; moving none satisfies both. A prohibition alone does not authorise choosing arbitrary notes to move. It can restrict a plan already under discussion; a partial movement still needs its selection and destination resolved from the request or context. A negative sentence is not executed as a positive imperative merely because the request's act is `place`.

Evaluation carries true, false and unknown. `and` is false if any member is false and true if all are true; `or` is true if any member is true and false if all are false; otherwise the result is unknown. On an incompletely read collection, `all` is not true merely because every loaded member passes; a known counterexample can make it false. `any` can be true through a known witness, but the absence of a witness does not make it false without complete coverage. Negation does not turn incomplete reading into evidence.

For a demonstrably empty collection, the logical values are `all=true`, `any=false` and `none=true`. Separately, the person's definite reference can presuppose that notes exist; resolve that issue before planning instead of presenting truth over an empty set as fulfilment of the request. Logic and conversation have distinct explicit rules, without hidden quantifier exceptions.

## 10.4 Reader coverage and evaluation

Reader evaluation separates recognition, graph construction, instance resolution and concrete effects. For each failure retain the source, expected roles, produced graph and first incorrect transformation. A new mechanism must cover a family of constructions and counterexamples, not a list of whole sentences.

| Reader result | Continuation |
|---|---|
| Unknown fragment outside the task | Preserve its source and record why relevance policy excludes it. |
| Unknown fragment in a required semantic role | Keep that role open; try compatible lexical or contextual candidates with evidence. Never erase a negation or second object to claim success. |
| Several plausible meanings | Rank compatible hypotheses; act on a usable reversible one with concrete uncertainty and undo. Retain alternatives. |
| Missing location, size or style | Elaborate from applicable schema and knowledge defaults and constraints; report meaningful assumptions. |
| Explicit requirement conflicts with a hard constraint | Preserve both; explain the concrete conflict and retain a feasible alternative without silently changing the requirement. |
| Search budget exhausted | Report the best usable result and its uncertainty, or the exact unresolved obligation. Do not claim impossibility from timeout. |

In the PSys2 tutorial, SOP-BERT predicts candidate semantic structure, not renderer-specific keys. A span may contain several words; source offsets recover the substring from the original message. Coordination requires multiple target records, shared-act ownership and local constraints. “Draw a tree and a house” and “draw a tree near the house” therefore require different graphs even if they contain the same object words. Model predictions, generic graph decoding and world-based elaboration remain separately inspectable responsibilities within the processing chain.

Training data includes actual typed messages labelled with general descriptions and supporting ranges, supplemented by generated variants. Labels are reviewed independently of the existing reader; otherwise training would reproduce precisely the keys and omissions being replaced. Variants of one expression and their paraphrase family remain in one partition. Domain-separated evaluation tests transfer; construction-family separation tests readings not used during training. If acceptance messages are later used for adjustment, explicitly replace the corresponding evaluation set.

| Acceptance stage | Measurement or check |
|---|---|
| Description fidelity | Act, mood, targets, conditions, negation and quantification against reviewed labels, not just schema validity. Explicit conditions cite their source words; contextual completion has separate provenance. |
| Instance resolution | Candidate referents and senses, required roles, preserved conditions and explanation of a concrete conflict. Agreement with an old reader is not an admission criterion. |
| Baseline comparison | On identical messages and states, compare correct usable effects; report wrong effects, undo, uncertainty and real-session behaviour separately. Count clarification, abstention and regressions on previously correct requests. |
| Transfer | Separate results for held-out domains and phrasing families; an aggregate gain does not hide a damaged domain. |
| Activation | Fix model, data and policy versions together with verification results. A candidate that fails admission remains under evaluation; failures guide its next revision. |

Compare candidates message by message under the same initial state. Report improvements and regressions, including unnecessary abstentions, wrong effects, assumption quality and successful undo. Small reversible mistakes can be accepted under the declared application policy; their frequency and consequences remain measured. A higher aggregate score cannot hide that an entire request class stopped working. Complete dialogues are evaluated through their resulting state trajectories because early choices change later references.

Measure wrong executions both as a case count and relative to attempted effects on a set fixed in advance. Fewer abstentions are not progress if replaced by incorrect actions. An evaluation with no observed errors is not a universal guarantee; per-request checks remain active after admission. Model selection follows the declared application policy; evaluation does not replace that policy with an implicit refusal-first objective.

A model can produce a valid request for an intent the person did not express. World validation can establish that objects exist and an action is permitted without proving that this particular action was requested. Lexical provenance, comparison of interpretations and explicit uncertainty therefore remain necessary. Improvement only on paraphrases generated from the same frames is insufficient evidence for replacing a reader used on real messages.

## 10.5 Tutorial implementation: how SOP-BERT is trained and decoded

This section applies the general reader contract to the [PSys2 demonstration](https://github.com/ml-circuits-research/psys2). It explains that application's DistilBERT-based reader, not a requirement that every SOP Worlds application use this model or these head layouts. The model recognises source-backed structure; LIB remains responsible for world-dependent semantic elaboration. Training, export and browser inference must agree on the exact output profile.

### 10.5.1 Two learned tasks, three inference graphs

The tutorial separates message segmentation from per-request reading. Both use a pretrained DistilBERT encoder, whose contextual vector at each token is the input to smaller learned heads. The encoder is not a text generator: it returns vectors, not words or SOP declarations. Fine-tuning adjusts its weights together with the added heads. The two tasks have separate checkpoints; their encoders need not share weights after training.

| Component | Input | Learned output | Deterministic continuation |
|---|---|---|---|
| Request cutter | The complete message, without gold request ranges or semantic annotations | One `O/B/I` distribution per source token: outside, beginning or continuation of a request span | Recover ordered source intervals through tokenizer offsets. Preserve unresolved transitions and truncation. |
| Key-reader encoder | One predicted request span paired with a bounded context description | Contextual vectors, a three-label BIO distribution for each span-enabled key, and a presence logit for each declared key | Decode source mentions, check consistency and construct classification queries. |
| Mention/global classification heads | Contextual vectors, a selected token interval and its key identity | Classes from that field's declared bank | Recover a typed value or retain absent/unknown; attach source evidence and per-mention metadata. |

These are three ONNX inference graphs: cutter, key-reader encoder and classification heads. The key reader is split into two graphs because the second stage's mention intervals are known only after the first stage predicts them. One encoder pass produces vectors for the entire request; classification reuses them rather than rerunning the encoder for every property. The actual contracts are in [the cutter trainer](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/train-request-cutter.py), [the key-reader trainer](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/train-key-reader.py) and [the export wrappers](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/export-key-reader.py).

Let `L` be token count, `H` hidden width, `K` the number of BIO-enabled keys and `Q` the number of presence keys. The key encoder returns hidden vectors shaped `[1,L,H]`, BIO logits `[1,K,L,3]` and presence logits `[1,Q]`. A global classification query uses the first special-token vector. A mention query averages the vectors within its predicted interval and adds the learned embedding of that key. Each field's linear classifier maps the resulting vector to its own bank. Export combines those classifier outputs into a declared contiguous layout; offsets and widths come from the artifact configuration, not editor-specific constants in runtime code.

### 10.5.2 What the heads represent

The [authoring inventory](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/heads/inventory.json) describes potential fields. The [demo profile](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/data/demo-tool-profile/inventory.json) specialises that vocabulary to the application's tool families. A trained artifact carries its exact registry, class banks, BIO keys and metadata keys. An entry in an authoring inventory does not establish that a checkpoint contains, has learned or can decode that head.

| Registry role or head | Examples | Meaning and limit |
|---|---|---|
| Global classification | `request.request.act`, `request.request.mood`, `request.target.mode`, `request.target.type`, determiner and fill mode | Predict a request-level label. Target family is distinct from a concrete concept such as tree and from a live object identity. |
| Global source span | Target kind, name, description, count or an act's textual anchor | Identify where the relevant expression occurs. A name may span several words; token labels do not restrict it to one word. |
| Domain mention BIO | A declared object's colour, size, location, document content or event title | Find each mentioned expression for a particular schema-owned field. Several spans for one key can exist. Their ownership and relationships still need a representable request graph. |
| Per-mention metadata classification | Operator, selector/result phase, polarity, requirement/preference/assumption character, scope, step, variety and logical group when declared | State how that individual mention constrains its subject. These labels do not replace the mention's value or source. |
| Presence | Whether each supervised key is expressed in the request | A consistency signal, not a calibrated probability that the whole reading or execution is correct. |
| Derived registry entries | Structural/conceptual fields not directly supervised by a learned head | Retained in the registry without pretending they are predicted. Their values require an explicit derivation. |

The base authoring inventory names these request-level fields explicitly: `request.request.mood` and `.act`; `request.target.mode`, `.fill`, `.determiner`, `.kind`, `.name`, `.description`, `.ordinal` and `.count`; `request.logic.quantifier`; `request.question.ask` and `.asked_key`; and `conversation.turn.fragment`, `.repeat_count`, `.objection` and `.area`. A family-aware profile can additionally declare a target-family field such as `request.target.type`. These are semantic field names; a `span`, `number`, `candidate` or `class` authoring tag does not by itself identify a separate encoder or tensor. The trained configuration specifies how BIO, bank classification and literal recovery realise each field.

Mention metadata in that inventory covers `request.constraint.operator`, `.phase`, `.polarity`, `.character`, `.scope`, `.step`, `.measure`, `.unit` and `.variety`, plus `request.logic.group`. A property belongs to its own mention: “make the first box red and the second blue” must not collapse both colours or their owners into one global value. Schema-owned domain keys vary with the supplied tool/profile inventory. Derived entries such as `request.constraint.concept` and `request.logic.negated` are not additional trained outputs merely because they have names in the registry.

Each class bank starts with two distinct states, **absent** and **unknown**, followed by typed values. Absent means the field was not asserted under that supervision contract; unknown means no supported value is resolved. Neither is the literal string `"none"`, numeric zero or an empty string. Banks classify finite declared alternatives; source spans carry open text. The [layout validator](https://github.com/ml-circuits-research/psys2/blob/main/src/dialog/key-reader-layout.mjs) checks the registry, bank order, family membership and tensor dimensions together.

### 10.5.3 From vectors to the exact source substring

There is a decoder, but it is a bounded structural decoder, not an autoregressive language model. It interprets output labels and preserves their source positions. For an utterance containing “a dark blue rectangle”, a colour head can label `dark` as `B` and the following subword tokens of `blue` as `I`. Offsets then recover the complete original substring `dark blue`. A `B` starts a new span; subsequent `I` labels extend it; `O` or another `B` closes it. An `I` without an active span is an unresolved transition, not permission to guess its boundary.

The tokenizer uses BERT normalisation, pre-tokenisation and WordPiece. A word can become several subword tokens, and case/accent normalisation can change the model's internal spelling. Therefore the decoder must recover text from the original Unicode-scalar ranges, not by joining token strings and removing `##`. Special tokens, padding and context tokens supply no source evidence. The [offset authority](https://github.com/ml-circuits-research/psys2/blob/main/src/dialog/bert-source-offsets.mjs) checks the component trace against actual tokenizer IDs and attention masks, retaining a mapping back to the original source. Unsupported or lossy mappings remain unresolved.

After extraction, value recovery has distinct cases:

| Case | Correct continuation |
|---|---|
| Open text such as a label or event title | Copy the exact source substring with its range and declared string interpretation. |
| A finite canonical category | Select a value from the declared class bank and preserve its source and classification evidence. |
| A source string exactly equal to one declared canonical string | An exact literal proof can retain that string without substituting another bank label. |
| A supported positive integer literal | A deterministic codec can convert digit text to a positive safe integer while retaining the original spelling and source. |
| A quantity, time, synonym or structured value requiring another conversion | Use a declared normalisation/semantic binding with the proper unit and schema; extraction alone does not justify conversion. |
| A recognised expression absent from the bank | Preserve the extracted text and the unresolved mapping. Do not report that the word was never found, or replace it with a vaguely similar known value. |

The [key-reader inference path](https://github.com/ml-circuits-research/psys2/blob/main/src/dialog/key-reader-inference.mjs) and [literal-proof rules](https://github.com/ml-circuits-research/psys2/blob/main/src/dialog/key-reader-value-proof.mjs) make these distinctions explicit. Copying a source span is mechanical. Deciding that “large” means a particular width in the current scene belongs to knowledge-driven compilation. A numeric codec does not decide which object to resize or which comparison class to use.

### 10.5.4 Supervision: what is trained and what is masked

Training annotations specify the source message, request ranges, roles, source-backed values and mention metadata. Context is a model input only where the reading profile declares it; gold ranges, desired tool calls and sample identities are supervision or provenance, never hidden input answers. The cutter learns from complete messages. The key reader can be trained on annotated request cuts, but that is conditional supervision: at inference it receives the cutter's predictions.

The [preparer](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/prepare-key-reader.py) converts annotations into global labels, mention intervals, covered keys and unknown-BIO masks. It aligns a range only when its boundaries match token offsets. Ambiguous repeated text, unsupported boundaries and overlapping mentions under one key are diagnosed rather than arbitrarily assigned to a token. Unknown supervision is ignored by the loss, not relabelled as absent. Source tokens outside a known mention receive `O` only when that key is covered by the annotation contract. Padding, special tokens and context tokens are masked from source BIO supervision.

A useful corpus includes precise UI-equivalent commands, ordinary paraphrases, synonyms, omitted nonessential details, short fragments and composed requests. UI actions provide concrete calls and observed effects; authors separately label what their accompanying words express. A shortened phrase that omits coordinates must not be annotated as if those coordinates occurred in its text. Expected completion can be retained separately for evaluating LIB. Likewise, a compound request needs local counts, modifiers and roles, not just a bag of all words it contains.

The tutorial keeps [UI-derived examples and authoring rules](https://github.com/ml-circuits-research/psys2/tree/main/training/sop-bert/data/ui-natural-v1) separately identifiable, then uses [union preparation](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/prepare-ui-natural-union.py) to merge compatible field inventories and corpora. Related recipe/paraphrase families share a split cohort. A compound example connects the cohorts of its constituents so that one paraphrase family does not leak across partitions through composition. Training weights and source coverage remain explicit. The [request label codec](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/REQUEST-LABEL-CODEC.md) losslessly stores supplied typed graphs; it does not create gold interpretations, interpret sentences or prove that the neural head profile can emit every graph it stores.

The learned objectives are concrete:

- The cutter minimises weighted three-class token cross-entropy, ignoring masked positions. Its calibration reports exact recovered spans as well as token scores.
- The key reader minimises BIO cross-entropy per supervised key, with weights compensating for frequent `O` labels; it also learns presence through binary cross-entropy, balancing present and absent strata.
- Global and per-mention class heads minimise class cross-entropy. Their absent, unknown and known-value strata are kept distinct, so abundant missing fields do not dominate the objective.
- A configured consistency term penalises disagreement between presence and BIO evidence on eligible source positions. It does not manufacture missing semantic ownership or train a field absent from the architecture.

The [key-reader trainer](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/train-key-reader.py) fine-tunes encoder and heads with AdamW, configurable learning rate and batch size, gradient clipping and finite-loss checks. GPU training can use bfloat16 autocasting; masked BIO labels stay compact on CPU and are converted for each optimiser batch. Dynamic padding can reduce actual work without changing the meaning of the source. The cutter's trainer independently optimises its encoder and BIO head. Epoch count, minimum epochs, patience, seed and model-selection criterion are run configuration, not universal constants of SOP Worlds.

Warm-starting is semantic, not positional. The [transfer code](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/warmstart-key-reader.py) copies compatible encoder tensors, matches head rows by key identity and role/head/concept signature, and matches class rows by typed value. Newly introduced keys or values keep fresh parameters. Reusing an old row index after an inventory reorder would transfer the wrong meaning. Optimiser state is not reused by this transfer.

### 10.5.5 Graph construction, coordination and world completion

The [two-stage pipeline](https://github.com/ml-circuits-research/psys2/blob/main/src/dialog/key-reader-pipeline.mjs) validates complete cutter output before reading request-local spans. It translates local source intervals back to whole-message intervals, retains model/profile identities and passes raw structure through declared canonical bindings. The [structural bridge](https://github.com/ml-circuits-research/psys2/blob/main/src/dialog/raw-structural-bridge.mjs) maps raw kinds, properties, units and supported normalisations into the request schema. A mapping must identify its source declaration; string resemblance alone is not a canonical binding.

The distinction between spans and graph ownership is essential. A raw request record with one `target` field has one principal target. Multiple BIO spans do not by themselves turn it into a record with two independently owned targets. “Draw a tree and a house” requires either a graph with two new targets under a shared act or two complete request graphs with explicit composition. Cutting the text into `draw a tree` and `a house` is not sufficient if the second span loses its shared act. “Draw a tree near the house” instead has one new target and an existing relational anchor. Splitting on conjunctions, copying a global kind, or treating every noun span as a new object loses these distinctions.

The canonical request contract can express more than a particular neural raw profile. The profile's singleton target, supported operators and graph-projection rules are expressiveness constraints, not low confidence. More examples can improve extraction within that representation; they cannot add a missing ownership edge or target record. The decoder and supervised representation must preserve the required graph structure. No application-specific sentence patch is a valid substitute.

After a valid request graph is built, LIB uses the supplied schema, knowledge and instance Worlds to bind concrete subjects, choose compatible worlds, interpret degrees, complete dimensions, find feasible placements and compile typed calls. That work is not another hidden pass of hand-written sentence parsing. Even a perfectly recognised request still needs these world-based decisions; conversely, failed instance binding does not show that the neural reader missed its words. The retained trace must locate the first failed transformation.

### 10.5.6 Export, browser loading and meaningful evaluation

Training produces checkpoints, not browser-executable quality claims. Export preserves the trained layout, tokeniser and source/configuration identities. The [ONNX export path](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/export-reader-onnx.py) separates key encoding from span-query classification; the [selected component exporter](https://github.com/ml-circuits-research/psys2/blob/main/training/sop-bert/export-selected-reader.py) can produce dynamically quantised weights while keeping float activations and typed tensor interfaces. Export equivalence must be tested with the actual inference backend. Successful conversion or smaller files do not establish retained intent accuracy.

The browser manifest binds cutter, encoder, heads, tokenizer and canonical bindings as one compatible assembly. The [verified provider](https://github.com/ml-circuits-research/psys2/blob/main/src/dialog/verified-reader-provider.mjs) checks supplied bytes and interfaces before constructing sessions. Artifact identity establishes which model was loaded, not that its predictions are semantically correct. The [browser host](https://github.com/ml-circuits-research/psys2/blob/main/src/dialog/browser-reader-host.mjs) uses WebAssembly inference and content-addressed Cache Storage. Cached bytes are verified against the expected digest; a changed deployment references new content, while corrupt entries are discarded and fetched again. Persistent model-byte caching is separate from saving editable World state. A refresh still creates inference sessions even when no model download is needed.

Context must fit the artifact's token budget without silently shortening the person's utterance. The profile records which context rows or prior-turn content were omitted. Source truncation and unsupported offset mappings remain explicit. Attention masks distinguish valid input from padding; source masks further distinguish the actual request from paired context.

Evaluation must keep four levels separate: cutter span exactness, key/mention fidelity conditional on gold cuts, graph fidelity under predicted cuts, and actual effects after LIB compilation and tool observation. Gold-mention classification is also conditional on already correct mention locations. Token accuracy can be high because most tokens are `O`; report positive-mention errors and complete-request fidelity. Presence probabilities and selected class scores are not calibrated probabilities of whole-graph correctness. Finally replay the same utterances in controlled instance states, including short omissions, coordination, relation anchors, corrections and undo. A gain at one level does not excuse a lost target or an incorrect visible effect at the next.

# 11. Required knowledge: content, provenance and coverage

A general mechanism cannot replace information about the things it handles. Inheritance can follow ancestors only if a kind hierarchy exists; planning can preserve required parts only if those parts are declared. Saying that information “comes from knowledge” is useful only when its declarations, sources and limits can be identified. This chapter defines a usable knowledge package and distinguishes a large knowledge base from one sufficient for its advertised capabilities.

## 11.1 A minimum package is closed over dependencies

Determine the minimum package from declared capabilities and problem families. For each exposed concept, follow dependencies until required operations have known inputs: kind, relevant parents, spaces, regions, roles and realisations. This dependency closure does not require loading all knowledge about the world; it requires an offered concept not to end in a missing reference during planning.

Closing dependencies for a capability is not an instruction to import only facts appearing in a few acceptance examples. Imports should preserve justified reusable families—such as specialization, part roles or property meanings—under an explicit source/mapping policy. Particular test requests probe those families and reveal gaps; they do not define a hidden list of individually favoured facts. Runtime relevance then chooses which admitted declarations a request actually needs.

| Shared component | Information the system must obtain |
|---|---|
| Kinds and specialisations | Concept identity, parents and the meaning of each link; use distances only through a declared metric. |
| Conceptual vocabulary | Language forms, senses and their sources; grammatical categories and general constructions belong to language Worlds. |
| Spaces and regions | Axes, units, frames, domains and region definitions; a colour name alone is not a computable region. |
| Whole structures | Part roles, cardinalities and relationships; distinguish required from merely usual parts. |
| Functional relationships | Which part supports, contains or attaches another object, and under which conditions; “part of” alone does not identify its functional role. |
| Defaults and preferences | Applicability context, defeasible status and provenance; they are not hard laws for all instances. |
| Realisations and capabilities | Representations a tool can produce, parameters and limitations; a known concept may remain unrealizable. |
| Sources and versions | Each assertion's origin, producing transformation and verified version. |

For example, a letter's signature role does not identify its signer. Structure declares the role; the identity can come from the instance or request. Completion cannot invent a person merely to close the graph. A dependency can also remain an explicit unresolved obligation when no supported completion exists.

Recognition, reasoning and realisation coverage are separate. A system can recognise a kind and answer knowledge questions without drawing it. It can hold an image without knowing editable parts. These states must be declared; neither a word nor an image file implies an entire capability.

## 11.2 Knowledge required by the tutorial application areas

Shared knowledge is reused across domains. Each domain adds structures and bindings specific to its operations. The following table applies the general dependency method to the five PSys2 tutorial editors; it is not a universal list of domains or a catalogue of everything a person can mention. Each application declares its own concrete kind and operation coverage.

| Tutorial area | Required knowledge and coverage limit |
|---|---|
| Drawing | Representable kinds, own or inherited realisations, editable parts, support/containment relations, extents, layers, colours and usual proportions. Geometry alone cannot identify a functional placement without the support-part role. |
| Diagram | Node and edge kinds, graph structures, start/end roles, order, shapes and layout rules. A well-drawn graph does not prove its relationships correct. |
| Documents | Genres, section structure, content roles, length and tone regions, tone measurements with uncertainty, and sourced subject assertions. A letter template without subject information yields structure, not justified factual content. |
| Avatar | Editable part identities, attachment and proportion constraints, template compositions, mappings from expression/style concepts to feature parameters, and measurement uncertainty. A named emotion is not a primitive instruction. |
| Calendar | Event/resource types, durations, availability, temporal relations, frames and named groups. People, events and current availability are instance data, not conclusions from general knowledge. |

These dependencies have practical consequences. A temporal relation can be checked exactly after all relevant reservations are read, while document tone is measured along declared axes using a procedure, textual evidence and uncertainty, as in section 6.8.1. If the measurement interval crosses a required region boundary, the result remains unknown. This is a property of the measurement, not an exclusion of tone from verification. In drawing, a part's geometry can be known without its semantic name. A package must not hide these differences under one “supported concept” label.

Required instance data differs from general knowledge. A general holiday source needs a region and validity interval and does not automatically identify a person's non-working days. An unverifiable requested exception leaves an unresolved obligation; a missing source does not authorise dropping it from the plan.

Declare a reusable relation or role at the most general level justified by evidence. “Support surface of an object” is reusable; an instruction for one user sentence is not. Particular facts remain legitimate: identifying a particular part as the support surface of a kind is the domain information a general rule requires.

## 11.3 Sources and transformations

Knowledge has three main entry routes: authored declarations, external imports and facts entered or learned within an instance. They can share a schema without sharing authority. Imported general assertions, editorial approximations and user preferences must remain distinguishable after composition. A confidence score does not replace provenance or promote a preference into universal truth.

| Entry route | Information retained and limits |
|---|---|
| Explicit authoring | Author, reason, context and verification examples; working assumptions are marked as assumptions. |
| Deterministic import | Source identity/version, original record, mapping to the local schema and applied transformations. The same input produces the same wires. |
| Deduction | Rule and versioned premises; retract or revalidate the conclusion when support changes. |
| Model prediction or annotation | Model/procedure, input and verified/unverified candidate status; a predicted class label is not guaranteed truth. |
| Local learning | User or episode, instance and applicability scope; promotion to shared knowledge needs a separate decision. |

An import of part–whole relations can propose object structures. It does not automatically supply required cardinalities, geometry or support roles. Those need further sources or verified authoring. Likewise, colour names extend a lexicon without determining colour-region boundaries.

Before using or redistributing a source, record the conditions of the exact imported version, required attribution and permitted transformations. Public accessibility does not establish redistribution rights. The importer and source reviewer perform this check; the book does not infer a dataset's licence from its name. Imports with different conditions retain provenance and any separation needed for distribution.

Model labels can reduce authoring effort but must be checked where they affect behaviour: required roles, impossibilities, action-enabling relations and sense assignments. Sampling estimates batch quality; it does not prove every unsampled fact correct. Critical effects require verification suited to their consequences or remain weak candidates.

### 11.3.1 Concrete sources and selection of useful information

Choose sources according to the needed relation. A lexicon can connect a name to a sense, an image annotation can support a spatial observation, and commonsense knowledge can suggest a usual use. None is a universal authority over every family in section 11.1. The following restrictions concern import design: they explain what cannot follow from the available information alone.

| Candidate source | Contribution and verification before use |
|---|---|
| [Princeton WordNet](https://wordnet.princeton.edu/front) — importer verifies terms for the imported version | Synsets, hypernyms and part–whole relations supply vocabulary, kinds and structural candidates. Retain sense identity and relation type. A lexical part does not establish required cardinality, support surface or editable geometry. |
| [Visual Genome](https://visualgenome.org/api/v0/api_readme) — importer verifies terms for each imported artifact | Objects, attributes, relations and region descriptions supply scene observations and on/in/has examples. Retain image, objects, region and original predicate. A pixel bounding box is neither a general geometry rule nor an editable outline; one image observation does not impose a requirement on every object of that kind. |
| [ConceptNet](https://github.com/commonsense/conceptnet5/wiki/Relations) — importer verifies terms for the imported subset | PartOf, HasA, UsedFor and CapableOf propose parts, uses and usual behaviours. Check senses and relation direction; do not treat weights as truth probabilities. HasA can mean possession, and IsA can include instances; mapping must not automatically turn them into structural parts or kind specialisation. |
| [sop-knowledge-worlds](https://github.com/ml-circuits-research/sop-knowledge-worlds) — importer checks source and shard conditions | Reusable vocabulary, relations, scenes, parts and realisations can be located through its catalog and provenance. Schema-valid loading does not prove compliance with every semantic contract. |

An importer starts from a concrete inventory obligation, selects records capable of supporting it and writes the sense/relation mapping. For support relations, an on annotation is a candidate: it may instead express contact, coverage or another meaning. A reviewer checks the objects and context before admitting functional support. Geometry and weight-bearing parts need justified declarations or measurements; word similarity supplies neither.

A nearby kind name is likewise insufficient evidence for transfer. Part–whole and specialisation remain distinct; frequent observations stay contextual defaults with provenance. Only verified information feeds completion. Mandatory requirements need independent justification; a majority of examples does not establish necessity.

For each source, inspect the exact source description, importer and admitted facts together. A source name does not imply that all its relation families were imported. Conversely, an old note about a missing download does not establish the present contents. Import descriptions state the included families and transformations so the system can justify actual semantic reads.

Check source conditions for the exact artifact: annotations, images and derived outputs are not interchangeable. These links identify candidate sources and formats, not permission for a new import or a claim that their components share redistribution conditions. Admitted information follows the provenance chain below.

### 11.3.2 An imported fact and its provenance chain

An imported assertion and its provenance are distinct facts. The following toy example uses `std.knowledge`, which imports `std.provenance`, `std.source` and `std.import`. It illustrates an authored table, not a claim about a real external record. `duck` and `bird` are conceptual vocabulary names whose semantic identity must be resolved separately from structural validation.

**Knowledge World — `imported-kinds/knowledge.sop`.**

<!-- sop-world id=imported-kinds.knowledge role=knowledge module=book.imported-kinds -->
```sop
@source.toy std.source name=toy.kind.table version=1 status=illustrative
@map.kind std.import.mapping name=kind.parent version=1
@origin.duck std.provenance source=$source.toy record=duck.row mapping=$map.kind
@fact.duck std.knowledge.parent child=duck parent=bird provenance=$origin.duck status=candidate
@book.use.imported-kinds.knowledge.std.knowledge core.use world=std.knowledge
@book.imported-kinds.knowledge.module core.module name=book.imported-kinds
```

The schemas reject missing structural fields, undeclared keys, invalid cardinalities and wrongly typed references. Deleting a referenced source is rejected transactionally. `std.source` requires name, version and status (`illustrative` or `published`); license, url and digest are optional metadata. `std.import.mapping` requires name and version; description and digest can identify the transformation. `std.provenance` requires source, record and mapping. `std.knowledge.parent` requires child, parent, provenance and status (`candidate`, `accepted` or `rejected`). These describe record status; the library does not automatically admit a candidate. Successful loading does not check licence, relation truth or mapping suitability. Publication checks and semantic evaluation remain separate.

The one explicit `std.knowledge` import is enough here because that module declares its dependency on `std.provenance`, which declares `std.source` and `std.import`. The loader follows that named chain; it does not preload every standard schema. Removing the three redundant direct imports shortens the document without omitting any dependency.

The first wire fixes the source version. The second identifies the transformation, which must be recoverable and reproducible; its name does not replace its definition. The third links an original record to that transformation. The final wire expresses the resulting conceptual relation and retains its evidence link. `candidate` means not yet admitted to active knowledge, not false. The reviewer checks relation meaning, concept identity and source conditions before admission.

Two independent sources for the same relation provide two pieces of evidence, not two ducks or two semantic relationships. Retracting a source revalidates dependent conclusions; remaining independent evidence can still support them. Reproducible provenance does not prove truth: a perfectly repeatable importer can faithfully reproduce a false statement.

To use the illustrated parent relation, first establish that its status and source policy admit it, then resolve `duck` and `bird` to their semantic identities. A subtype traversal can follow that accepted edge and retain its provenance. A label lookup is a separate lexical dependency: the parent edge does not explain every surface form used to mention either concept. This separation keeps type declarations, semantic relations and word meanings from becoming interchangeable merely because some names coincide.

## 11.4 Review responsibilities and acceptance

Verification has distinct levels. Successful loading establishes schema compatibility, not semantic truth. A schema can admit inverted roles; valid drawing coordinates can accompany incorrectly named parts. Package acceptance therefore combines mechanical validation, semantic review and use in problems independent of the examples that motivated authoring.

| Responsibility | Required evidence |
|---|---|
| Author or importer | Identifiable source, explainable mapping, reproducible output and difference from the preceding version. |
| Schema validator | Valid types, units, cardinalities, references and restrictions; report omissions rather than filling them with arbitrary labels. |
| Semantic reviewer | Relation meanings, hard versus typical status, exceptions and consistency with sources; one passing example is insufficient. |
| Adapter author | Real capabilities and limits for the supplied data: editable parts, measurements and unverifiable properties. |
| Usage evaluation | New requests and minimal pairs, uncertain reversible choices, explicit constraint conflicts and undo; repeated success on the same wording is insufficient. |

Activate a package only with required dependencies resolved and coverage declared. An unloaded source differs from an absent assertion in a complete source. A temporarily missing shard does not establish that a catalog object does not exist. Contradictory sources remain visible; source selection is justified by scope, version or authority, not accidental load order.

A concept change requires checking direct uses and rules that inherit its properties. Making a part optional can change completion of many wholes; changing a colour region can change object selection. Versioning makes old explanations reproducible; an update does not rewrite past execution evidence.

## 11.5 Inventory and coverage measurement

Measure volume against a declared capability profile and vocabulary. First identify required things, parts, properties and relations, then locate supporting declarations. Keep contour-point counts separate from semantic relations. Otherwise a detailed drawing can appear to be rich knowledge while saying nothing about which part supports an object.

The following concrete inventory comes from the tutorial's drawing, diagram and document sessions. It is a measurable starting point, not the boundary of SOP Worlds vocabulary. Calendar additionally needs the information and relations in section 11.2; those sessions do not measure its coverage.

| Requirement family | Content to connect to declarations |
|---|---|
| Kinds and characters | Duck, bird, child, grandfather, girl, robot, man, boy, woman and frog; differences must survive in realisations, not merely names. |
| Wholes and parts | Swing/seat, flower/petal, hair/beard, story/chapter/narrator; part existence, functional role and editability are separate obligations. |
| Scene and extents | Grass, lake, pond, water, sky, ground, cloud, sun, house, fish and water plant; named layers need extent and order. |
| Diagrams and documents | Node, arrow, hexagon, circle and letter; layout is not each node's kind, and a document's name supplies no factual content. |
| Properties and relations | Green, yellow, azure, curly hair, sad/surprised expression; above, near, inside, on a support surface, first/last, higher/lower and preservation of a value. Each requires a declared space, frame or relation, not a recognised word alone. |

An inventory is indexed by semantic family, source World, schema and tool dependency. It reports availability separately from actual use: a catalog entry is not evidence that reasoning consulted it. A loaded World can contain facts irrelevant to a particular request. The trace names the facts and rules actually read or activated.

| Coverage obligation | Concrete check |
|---|---|
| A drawable tree | Resolve the requested kind, find its editable representation and part roles, fill tool arguments and observe creation. A word or static image alone is insufficient. |
| A chapter | Resolve the document/section schema, parent and order policy; create and observe that section. A lexical search for the word chapter is not a semantic coverage test. |
| A chart of calendar events | Establish the event population and interval coverage, aggregate unique identities, map values through the chart method and observe the resulting nodes. |
| A happier avatar | Resolve editable parts and expression-to-feature rules; observe changed features and retain any expression measurement uncertainty. |
| A reused relation family | Exercise the same relation and reasoning mechanism across different kinds and contexts; acceptance examples do not define the whole imported family. |

Counts of wires, geometry points and vocabulary entries measure different things and must not be summed as “intelligence”. Knowledge is usable for a capability only when dependencies close through schemas, inference and concrete tool bindings. A lexical miss does not prove a missing concept: it may be represented by a role, synonym or another property. Search and execution evidence must settle that distinction.

For each problem family, coverage measurement locates missing recognition, description, reference binding, knowledge, realisation or verification. Retain valid uncertainty outcomes too. Adding names can improve recognition without enabling another executable request; report that distinction.

# 12. Numerical parameters: origin, calibration and decision stability

Distances and costs make choices comparable only if their numbers have declared meanings. Choosing a weight to force one example's desired answer can hide the same particular rule that declarative reasoning was meant to remove from code. This chapter specifies who assigns a number, its scope and the probes that check its consequences. Parameters are versioned project data, not unsourced constants.

## 12.1 Numbers with different roles

Before calculation, classify a value's source and role. A measurement describes state; a requested bound defines a desired result; normalisation defines a comparison scale. They can occur in one formula without becoming interchangeable. Changing an optimisation weight cannot change an exact request bound.

| Category | Declaration and origin |
|---|---|
| Measurement | Observation with unit, frame, procedure and state version; for example, actual outline clearance. |
| Numeric requirement | Request and target with message evidence; for example, a minimum distance rather than a permanent limit for every object. |
| Unit conversion | Unit and transformation definition; representational change preserves physical meaning. |
| Normalisation | Space axis or metric with a reference population or geometric convention; makes differences comparable. |
| Tolerance | Applicable approximation policy and, where relevant, request; expresses permitted deviation, not truth probability. |
| Cost weight | Declared objective; preference among already valid candidates. |
| Comparative step | Axis and scale kind; default change for a comparative without explicit quantity. |
| Learned value | Instance or declared profile with episode and context; does not change every user's policy automatically. |

Declare a number once at the most general level where its meaning is shared. Reuse does not require all domains to use one value: time and position steps have different units and effects. A specialisation identifies the policy it overrides and its context rather than copying a constant into every rule. An explicit request remains separate and takes precedence in the current problem.

## 12.2 Establishing a distance scale

For a linear axis, normalised difference is raw difference divided by a positive reference length. Finite bounds defining the comparison domain can supply its span. Without a meaningful upper bound, the space author declares a typical extent from a geometric convention or reference sample. Fix that sample before evaluating target cases; do not change it per message to force acceptance.

Suppose reference objects on a page have median width 10 units. The space author can use normalisation 10 to express differences relative to that geometric scale. This is an explicit teaching assumption, not a universal drawing value. The rule is “median width in the declared reference set”, with set identity and revision retained. If the median is zero or the set is unavailable, do not invent a denominator; establish the missing reference before activating the policy.

| Normalisation for the same raw difference of 4 | Distance and consequence under tolerance 0.5 |
|---|---|
| 1 | Distance 4; outside tolerance. |
| 10 | Distance 0.4; within tolerance. |
| 1000 | Distance 0.004; the same tolerance could admit much larger physical differences. |

Normalisation and tolerance must therefore be reviewed together. A denominator is not merely a way of obtaining small numbers. Under “at least 12”, a candidate distance 8 violates the bound regardless of normalisation: selection tolerance does not automatically relax an exact requirement. Unit conversion transforms both difference and normalisation so their ratio remains unchanged.

In a kind graph, uniform specialisation-edge cost is valid only as an explicit policy. Edge count depends on taxonomy authoring: inserting an intermediate node must not increase semantic distance without a decision. Migration can preserve total path cost by dividing the old edge's cost among its replacements, or recalibrate the metric and recheck affected selections. Graph distance never replaces identity or provenance filters.

### 12.2.1 Declaring the normalisation reference

The clearance axis can derive its normalisation from an explicit reference sample. This invented sample is in page units and measures width. Independent samples retain distinct identities, including when their values are equal. Load the `std.reference` schema for the following declarations.

**Instance World — `width-observations/instance.sop`.**

<!-- sop-world id=width-observations.instance role=instance -->
```sop
@sample.width.a std.reference.sample value=8 unit=page.unit
@sample.width.b std.reference.sample value=10 unit=page.unit
@sample.width.c std.reference.sample value=12 unit=page.unit
@reference.widths std.reference.set version=1 property=width unit=page.unit member=$sample.width.a member=$sample.width.b member=$sample.width.c
@book.use.width-observations.instance.std.reference core.use world=std.reference
```

The sample values 8, 10 and 12 have median 10. The generic median algorithm sorts the finite values and selects the middle value, averaging the two central values for an even count without overflowing intermediate arithmetic. Duplicate member references do not increase sample size; distinct observations with equal values do. Unit consistency is checked before calculation, and a nonpositive normalisation is rejected.

The calibration retains the exact sample identities, values, units, sources and definition version. Published evidence is a fixed revision: later changes to source measurements create another calibration rather than rewriting the meaning of an old explanation. The consuming axis records which calibration and unit conversion it uses. A version label alone does not make mutable data immutable or prove the measurements authentic.

The resulting denominator is a value consumed by later calculations, not a new fact about the measured nodes. With this fixed normalisation, observed clearance 8 and requested clearance 12 differ by `abs(8−12)/10 = 0.4`. That number can measure deviation for an allowed comparison or objective. The exact requirement `clearance ≥ 12` is still evaluated on compatible clearance values and remains false at 8. Reusing a calibration must not blur the roles of observation, requirement and preference.

```text
Pseudocode — calibration and its consumer
reference: widths at a fixed revision, values [8, 10, 12] page units
method: median
result: 10 page units
consumer: clearance axis normalisation
reuse condition: matching calibration revision, unit and declared frame
```

## 12.3 Tolerances and comparative steps

Calibrate tolerance for a family of intent-preserving substitutions. Start with pairs judged acceptable or unacceptable in declared contexts, not a desire to execute more commands. Check exact, regional and comparative requests separately. A precisely requested value has no approximation permission merely because another value is numerically close.

A comparative step supplies the default for “bigger” or “later”. On a ratio axis it can multiply; on an interval axis it adds a quantity. The teaching factor 1.25 in section 4.5.1 is a calibration hypothesis: assess required corrections, overshoots and stability rather than retaining it because one example worked. An explicit quantity such as “by 15 minutes” replaces the default step. Interval-valued changes also require a retained anchor declared by the change contract.

| Probe | Required invariant |
|---|---|
| Positive step on an oriented axis | Move in the requested direction; clipping at a boundary does not reverse it. |
| Explicit quantity | Use the stated quantity after unit conversion; do not additionally multiply by the default step. |
| Tolerance boundary | Values immediately below, at and above it follow the declared comparison. |
| Measurement uncertainty | An interval crossing the boundary is not reduced to its centre to claim certainty. |
| Learned adjustment | Change policy only in the authorised context and episode; a later exact request can override it. |

Different contexts can have different calibrated policies when evidence supports that distinction. Calibration must not create one rule per test sentence. With too few observations, keep the parameter as an explicit design hypothesis and seek more data; missing data does not establish a principled capability limit.

### 12.3.1 Tolerance policy and a locally learned factor

A tolerance policy names its metric and scope. In this invented example the metric is absolute difference divided by normalisation 10, and the permitted bound is 0.5 for requests explicitly allowing regional approximation. Exact requirements cannot be relaxed by that policy. The following pseudocode describes the data responsibilities rather than defining new SOP types.

```text
Pseudocode — tolerance policy
metric: absolute difference / calibrated normalisation
bound: less than or equal to 0.5
application: regional approximation permitted by the request
exclusion: exact requirements
evidence: calibration revision and axis definition
```

Distance is `abs(a−b)/10`. Acceptance requires a value no greater than 0.5 and approximation permission in the actual request. Binding the calibration revision prevents silent reuse on a changed scale. The policy does not cancel a firm bound such as “at least 12”.

The learned factor has different provenance: a local episode. The following record illustrates section 4.5.1 with the drawing instance and fish kind already identified. Sizes share a ratio scale; factors are dimensionless.

```text
Pseudocode — local learning episode
scope: drawing instance / fish kind / size concept
reference: 1; initial factor: 1.6; observed accepted final value: 2.5
accepted factor: 2.5 / 1 = 2.5
updated local factor: mean(1.6, 2.5) = 2.05
retained evidence: explicit episode closure, observations and validity checks
```

An episode closes through a declared conversational event, not silence interpreted as agreement. Validity requires observed changes and no intervening external edit or undo that invalidates the example. The arithmetic is accepted factor `2.5 / 1`, then mean with 1.6, yielding 2.05. The result applies only in the recorded instance, kind and concept context; it does not become a universal fact about fish or override an explicit later size.

## 12.4 Costs, weights and candidate ties

An objective combines defined comparable terms after eliminating candidates violating hard requirements. A forbidden overlap is not a large cost that enough unrelated benefit can compensate. Weak preferences can use a weighted sum; noncompensable priorities need a declared lexicographic order. This choice is part of the objective's meaning.

Consider two valid candidates with normalised displacement and crowding. A has values 0.2 and 0.6; B has 0.5 and 0.2. Equal weights give costs 0.8 and 0.7, preferring B. Weighting displacement by 2 gives 1.0 and 1.2, preferring A. These figures demonstrate sensitivity to policy; they are not a recommended calibration for every scene.

| Objective declaration | Why it is necessary |
|---|---|
| Terms and their normalisation | Prevent adding minutes, page units and object counts without common meaning. |
| Weights and justification | Define permitted trade-offs; evaluate on independent preferences and problem families. |
| Noncompensable priorities | Prevent an improvement elsewhere from cancelling an obligation or declared priority. |
| Tie handling | An ID can stabilise display order but cannot itself choose among different intents. |
| Stopping criterion | Distinguish the best tried candidate from a proved optimum. |

Changing a weight can affect many requests using the same objective. Explanations retain the cost breakdown, not just a total score, so review can identify the term that changed candidate order and check its consistency with declared preferences. An opaque optimised score supplies no such justification.

### 12.4.1 An objective with weights and priorities

An objective combines lexicographic priorities with weighted sums inside each level. Load `std.objective` for this fragment. `displacement` and `crowding` name declared evaluators with normalised outputs; the objective does not define those measurement procedures merely by naming them.

**Knowledge World — `layout-objective/knowledge.sop`.**

<!-- sop-world id=layout-objective.knowledge role=knowledge module=book.layout-objective -->
```sop
@objective.layout std.objective order=lexicographic direction=minimise term=$term.move term=$term.crowding
@term.move std.objective.term evaluator=displacement normalisation=declared.by.evaluator weight=2 priority=1
@term.crowding std.objective.term evaluator=crowding normalisation=declared.by.evaluator weight=1 priority=2
@book.use.layout-objective.knowledge.std.objective core.use world=std.objective
@book.layout-objective.knowledge.module core.module name=book.layout-objective
```

The schema requires these fields and rejects unknown keys, wrongly typed references and incomplete structural terms. `order` is `lexicographic`; `direction` is `minimise` or `maximise`. A weight is finite and nonnegative. Zero disables a term's contribution; it does not let an active term's unknown value become zero. Priority is a nonnegative safe integer, at most 9007199254740991 in this representation, so rounding cannot merge distinct levels. That is a representation constraint, not a conceptual limit on the number of priorities.

Repeated references to the same term identity do not duplicate its contribution. Distinct term records remain distinct even if they name the same evaluator. Equal priorities deliberately allow a weighted sum within a level. A referenced term cannot be deleted. Structural validation does not resolve evaluators, perform optimisation or justify normalisation; fulfil those obligations before assessing a candidate.

Compare lower priorities first. Sum weighted terms at each level, then compare the resulting vectors lexicographically. For A=(0.2; 0.6) and B=(0.5; 0.2), vectors are (0.4; 0.6) and (1.0; 0.2), so A wins at the first level. Crowding cannot compensate displacement under this policy. Giving both terms priority 1 yields one-component vectors with the sums 1.0 and 1.2 above. Equal weights and equal priority instead prefer B, at 0.7 versus 0.8.

Weights thus permit trade-offs within one level; a positive weight on a level's only term does not change candidate ordering. Evaluators fix formula, reference and normalisation version. `declared.by.evaluator` requires that resolution, not a scale chosen after seeing the winner. An unknown value is not zero cost: the candidate remains incompletely evaluated. Hard requirements precede the objective and never become compensable terms.

## 12.5 Calibrating and checking a change

Choose parameters on calibration data and verify them on independent cases, separated by phrasing family and domain where the mechanism is general. A replay exposing a gap can become a regression test but cannot be the only criterion used to choose a new value. A setting winning that exact case while damaging another family must be explained or withdrawn.

| Probe | Detects |
|---|---|
| Unit change with consistent conversion | Decisions accidentally dependent on numeric representation. |
| Perturbation around each chosen parameter | Brittle thresholds and candidate-order reversals without a meaningful difference. |
| Minimal pairs | Loss of an exact number, negation, direction or protected object. |
| Taxonomy change without a meaning change | Distance depending on accidental intermediate-node counts. |
| New cases in other domains | A parameter memorising a situation instead of serving a general mechanism. |
| Replay with identical versions and inputs | Derivations or choices not reproducible from recorded data. |

A change record contains the parameter definition, unit, scope, old/new values, decision source and affected cases. Not every decision must stay unchanged: correcting wrong decisions is often the purpose. Differences must be visible and evaluated rather than hidden in an overall mean.

A learned parameter follows the same provenance and verification discipline with its local context included. The space and numeric-policy revisions belong in the plan's justification; reproduce an old explanation with those revisions. Better calibration then remains compatible with explaining why yesterday's choice differed.

# 13. Composing replies from effects and evidence

A useful reply does not recite tool calls. It tells the person what changed, what remains unresolved and, when relevant, which choice the system made. Construct a semantic reply plan from justified claims before selecting words. The same mechanism works across domains; each supplies identities, concepts and observations, not situation-specific responses.

## 13.1 From the journal to communicable claims

Inputs are the situated request, prior state revision, subsequent observations, invocation outcomes and constraint assessments. Each candidate reply claim has content, status and supporting sources. Invocation identity correlates confirmation with its observation; temporal proximity alone does not establish that two records describe one effect.

| Candidate claim | Required evidence and permitted wording |
|---|---|
| Confirmed change | Invocation confirmation and observed difference satisfy the requirement; the realised effect may be stated. |
| Already satisfied | Prior observation supports the condition; state that it already held without claiming a new action. |
| Proposal | A candidate was checked but not dispatched; describe a possibility or recommendation, not an accomplished fact. |
| Partial outcome | Preserve both confirmed independent effects and remaining requirements. |
| Unknown effect | Observation is missing, incomplete or not correlated with the invocation; state what could not be confirmed. |
| Assumed choice | The used value has assumption status and plan provenance; explain it when it affects the result. |
| Factual answer | Read or derived facts and question coverage support the assertion; do not attribute it to an assistant action. |

Observations and confirmations can be delayed or incomplete. A technical “success” is therefore not directly rewritten as “I moved it”. Contradictory confirmation and state evidence yield uncertainty and can require another read under the execution policy. Do not invent a cause merely to make a reply appear complete.

An internal claim retains act roles and covered requirements. Movement has an object, resulting location and checked relation; creation has a new identity and its parent whole. Roles bind objects and concepts, not UI message names. This structure permits grouping before textual realisation.

For instance, suppose a confirmed move changes `o2` from `(70,90)` to `(70,78)` in the downward-positive frame from §4.2. The state difference supports a coordinate move upward. Claiming “placed above h1” additionally requires `h1`'s observed bounds and the declared above test. The reply planner keeps that extra condition separate instead of deriving it from the move operation's name. It can then choose a short wording that covers exactly the established predicates.

Consider “Change the colour of the circle to purple”. The reader retains change, the circle description and the required colour. LIB binds the subject using instance evidence, resolves purple through knowledge and the tool's declared colour representation, and emits a concrete property-change instruction. If there are several circles, the context policy ranks them and retains alternatives; the selected identity and assumption are named. Observation checks the concrete property and the semantic mapping before claiming the effect.

Request revisions preserve unchanged nodes and the parent revision. New wording receives a distinct source identity. A correction identifies the role being changed; preserving a graph does not itself interpret “the other one”. Selector evaluation binds historical subjects from a coherent population snapshot. Logical evaluation carries true, false or unknown, with completeness required only for exhaustive conclusions.

A batch has explicit dependencies. A confirmed creation may unlock a later call that consumes its returned identity; an unknown creation effect does not. Independent requests remain eligible. Successful structural validation of a batch is not proof that all tool contracts or semantic preconditions are satisfied.

Creation and removal claims compare lifecycle populations before and after a correlated invocation. An item disappearing from a filtered view is not proof of deletion. Empty partial observations do not establish absence. Property-change evidence instead compares the resolved expected property with observations of the same subject and field, plus the invocation outcome and relevant revisions. Neither assessment substitutes for the other.

When before and after both match the expected value, status is `unchanged`: the property already held, without claiming execution of a change. `changed` requires a matching after value, a different before value, a confirmed invocation and a new source revision. Other correlated cases are `unconfirmed` with their reasons; contradictory or ambiguous correlations are rejected. Comparison retains exact tokens, order and repetition. It does not automatically convert quantities or semantic names into native property values.

Normalised evidence is retained in an immutable revision definition. A `std.reply.property` claim identifies its owner, revision and status; validation recomputes that status from the retained evidence, preventing later live-journal changes from rewriting historical assessment. This protects consistency, not the authenticity of fabricated observations. The adapter is responsible for actual reads, invocation confirmation and the declared concept-to-native-value mapping.

A native field difference does not automatically prove a visible difference. Replacing an implicit default with the same explicitly stored colour can change data without changing appearance. A reply may state that the property was set to the resolved value but must not invent perceptual change. A property assessment alone does not prove creation, removal or satisfaction of the whole request; other predicates and grouped claims need their own evidence.

### 13.1.1 Replies for proposals, checks and missing information

Request mood from section 10.2 determines which outcome can be communicated. A satisfactory `check` or `propose` candidate is not a realised effect. Evidence can come from availability observations or internal candidate-state validation without live mutation calls.

| Outcome and mood | Justified English wording |
|---|---|
| `check`, verified availability for both participants | “Monday 14:00 and Tuesday 10:00 are free for both.” This does not claim creation of a meeting. |
| `propose`, the same alternatives | “I suggest Monday at 14:00; Tuesday at 10:00 also works.” An objective must support preference for the first; otherwise present unranked options. |
| `ask`, required information unavailable | “I have no information about your holiday calendar. Loading that calendar would let me check the dates.” Identify the concrete missing evidence and relevant source. |

In the first two examples, week, time zone, duration and participants must already be resolved; wording includes any relevant assumed values. Availability evidence retains the source revision and checked interval. A later booking revalidates availability because state may have changed.

Missing information is not negation: “I have no holiday data” does not mean “there are no holidays”. It is not a claim of principled impossibility either. A proposed source must be relevant to the question. If none is known, describe that obligation without inventing a file or pretending to have consulted one. The same rules apply to drawing properties, document structures and diagram facts.

## 13.2 Selecting and ordering content

A reply plan separates information necessary to avoid misleading the person from details available on request. A length budget limits detail, not truth. An unmet firm requirement, unconfirmed effect or unexpected change cannot be omitted merely to shorten a reply.

| Communication priority | Application |
|---|---|
| Relevant uncertainty or unexpected effect | State early, before a global success claim creates a misleading impression. |
| Answer to the main question or goal | Describe the result at the requested level, not every technical stage. |
| Remaining obligations | Identify missing evidence or unmet requirements, retained alternatives and usable next actions. |
| Significant adaptations and assumptions | Explain a departure from explicit input or a choice affecting interpretation of the result. |
| Detailed justification | Retain through the journal and “why?” without automatically expanding routine confirmation. |

Order depends on outcome structure. Full success begins with the main effect; partial success identifies its extent and immediately distinguishes realised and unresolved parts; a question begins with the requested information. Do not prefix every reply with “Done” or “I understood” when that phrase adds nothing.

For a tutorial document example, “I shortened the introduction; I could not confirm the change to the conclusion” combines an observed effect with an unknown status. “I shortened the document” would wrongly generalise over the unverified part. An extra sentence is justified when it prevents that error.

## 13.3 Grouping effects without losing their scope

Claims can share a sentence when act, status and roles are compatible. Grouping uses unique identities and requirement coverage, not invocation count. Retrying an operation does not create another counted object, and updating a part does not establish recreation of the whole.

The following pseudocode groups three confirmed creation claims about sections of the same report. Its entries identify observed objects and correlated evidence; these are explanatory records, not extra SOP types.

```text
Pseudocode — response grouping
claim a: created section a in report, confirmed by evidence a
claim b: created section b in report, confirmed by evidence b
claim c: created section c in report, confirmed by evidence c
group: same act, status and parent; members [claim a, claim b, claim c]
count: distinct confirmed section identities = 3
```

`member` retains each covered claim. Compute the reported count from distinct confirmed object identities, not the requested quantity. Three confirmed sections created in one report support “I added three sections to the report.” Two confirmations and one unknown effect do not support that same count in a success statement.

| Claim situation | Grouping rule |
|---|---|
| Same act, status and parent whole | Group unique objects and express the observed quantity. |
| Same property and value | Coordinate objects and state the value once. |
| Different values or destinations | Preserve subgroup distribution; do not attribute the union of values to every object. |
| Whole and parts created in one step | Present the whole with its parts when that covers requirements; avoid redundantly enumerating both whole creation and each component. |
| Different statuses | Separate success, an already satisfied condition and unknown effects. |
| A part changed in an existing whole | Name the part and change; do not claim recreation of the whole without evidence. |

For a newly created document and its sections, “I created the report with three sections” can cover both whole and structure. If only sections were added to an existing report, use addition wording. The whole–part relation eliminates “I created a report. I created three sections” without a list of report-specific exceptions.

Do not merge different conditions into one collective description. If one section became shorter and another more formal, “I made both sections shorter and more formal” is false. A coordinated sentence can express both changes while preserving each predicate's subject.

## 13.4 Assumptions, adaptations and object descriptions

An assumption matters when it determines a property the person might correct or explains a significant result difference. Do not recite every technical value chosen during compilation. The reply plan records why a detail matters: it completed a significant role, selected among materially different alternatives or used an approximate realisation. This classification is general and inspectable in the journal.

| Information | Expression without needless repetition |
|---|---|
| Important completed value | Connect the choice to the result: “I used a one-hour duration.” Do not present it as an explicit user requirement. |
| Borrowed realisation | Explain the relevant adaptation once in context while preserving the object's semantic kind. |
| Same unchanged adaptation on the next step | Do not repeat it if referent, policy and significant difference are unchanged; evidence remains available. |
| New or changed adaptation | Explain again because the previous explanation no longer describes the result. |
| Internal technical name | Use its declared lexical form or an identifiable description; do not invent a seemingly known name. |

Use a pronoun only when its antecedent is unique in the reply context. Otherwise “the introduction” or an object name is clearer than “it”. Similar objects need enough distinguishing properties to identify them, not every slot. An approximate value's description distinguishes “within the requested region” from “the nearest available realisation”.

Assumptions do not justify dropping explicit requirements. A requested calendar exception cannot become “I assumed no exceptions” after being omitted. Planning must resolve the incompatibility first; wording cannot retroactively repair an action with changed meaning.

## 13.5 Language realisation and wording validation

From the semantic reply plan, a realiser chooses a frame family for act and status, then constructs noun groups, agreement, quantity, tense and relations. Frames are language data and can have variants preserving semantic structure. A new domain supplies concepts and lexical forms, not sentences for every object/situation combination. The examples here realise English; another language requires its own declared forms under the same semantic contract.

Realisation retains a mapping from text fragments to plan claims. Check that every sentence has support and every mandatory fact was communicated. Compare quantities, negation, names, relations and execution status structurally, not just by overall text similarity. Reject a paraphrase dropping “not” or turning “proposed” into “done”, even if the remaining words resemble the input.

| Check before display | Prevents |
|---|---|
| Every textual claim has support | Invented causes, qualities or unobserved success. |
| Required information is covered | Omitting partial failure or uncertainty to shorten a reply. |
| Numbers and scope are preserved | Confusing requested and realised quantities or distributing a property incorrectly. |
| References are identifiable | Ambiguous pronouns and unexplained internal names. |
| Linguistic form is coherent | Agreement errors, repetitions and fragments caused by concatenated templates. |

A language model, if a host application uses one, must follow the same realisation contract: receive claims and evidence, then have its wording checked before display. Meaning and style validation remain distinct. If wording loses information, reconstruct it from the semantic frame or produce another variant; never invent a success sentence as a fallback. Expression can improve without changing the source of communicated truth. This possibility does not prescribe a generative model for the PSys2 tutorial's runtime.

## 13.6 Brevity, on-demand explanation and evaluation

A routine reply communicates the result and relevant exceptions; an explanation expands its evidence on request. Brevity is not a universal word count: a simple request can need one sentence, while a partial outcome with an unknown effect can need more. The person must be able to distinguish what happened and what remains undecided.

Evaluate factual correctness, requirement coverage and communication quality separately. Use pairs differing only in status, a number, a negation, a subgroup or a whole–part relation. A shorter wording that erases these distinctions is worse than a slightly longer faithful one. Measure repetition semantically: synonyms do not make two sentences about one effect useful.

Retain the semantic plan, generated text and discrepancy identified by validation or the person for every reply problem. The case should improve a general selection, grouping or realisation rule, not add a fixed response for that example's objects. This connects section 6.11's explanation mechanism to natural replies: evidence remains complete while wording states what matters for the current step.

# Appendices

## Appendix A. Related ideas

The individual ideas have established precedents; SOP Worlds combines them under a common declarative contract. These references identify intellectual relationships rather than claiming that another system already supplies the entire architecture. Exact bibliographic details require verification before formal publication.

| Idea | Related work |
|---|---|
| Values as points, words as regions with centres | Conceptual spaces (Gärdenfors 2000); prototype theory (Rosch 1975). |
| Degree words relative to a comparison class | Semantics of gradable adjectives (Kennedy 2007). |
| Legend World | Upper ontologies (DOLCE, SUMO, BFO); thematic roles; image schemas. |
| Wire with keys and slots | Minsky's frames (1974); feature structures. |
| World as facts and schema | Description logics; integrity constraints. |
| Derived facts retracted when support disappears | Truth maintenance (Doyle 1979; de Kleer 1986). |
| Acts with conditions/effects and composite acts | STRIPS (Fikes and Nilsson 1971); PDDL; hierarchical planning (Erol, Hendler and Nau 1994). |
| Hard/soft constraints and solving | Constraint satisfaction (Mackworth 1977). |
| Usual values | Default logic (Reiter 1980). |
| Minimum-cost completion | Weighted abduction (Hobbs and colleagues 1993). |
| Request, focus and open question | Information state (Larsson and Traum 2000); GUS (Bobrow and colleagues 1977); SHRDLU (Winograd 1972). |
| Corrections changing only named content | Belief revision (Alchourrón, Gärdenfors and Makinson 1985). |
| Observed state and its projection; compensation | Updatable views (Foster and colleagues 2007); compensating transactions (Garcia-Molina and Salem 1987). |
| Provenance | Data provenance (Green and colleagues 2007). |
| Replies composed from data | Natural-language generation (Reiter and Dale 2000). |
| Declaration-derived tests and minimal pairs | Property-based testing (Claessen and Hughes 2000); contrast sets. |

## Appendix B. Vocabulary

Each term has a short definition and a reference to its detailed explanation.

| Term | Definition |
|---|---|
| Wire | A declaration consisting of identity, type and key/value pairs; it may span lines. Section 2.1. |
| Key | The name of one property on a wire. Section 2.1. |
| Reference | A value pointing to another wire, written with `$`. Section 2.1. |
| Fact | A wire asserting that something exists and describing it. Section 2.1. |
| Namespace | A context qualifying local identities and reference resolution to avoid collisions. Section 2.6. |
| World | Facts and schema held together under validation and inference. Section 1.2. |
| Schema | Declarations of permitted facts and their consequences. Section 2.5. |
| Type | A name identifying a declaration's category; the name is not itself a wire. Sections 2.1 and 2.4. |
| Slot | A schema declaration for a type's property. Section 3.2. |
| Lineage | Declarations applying to a general type also apply to its specialisations. Section 3.1. |
| Open key | A required property without a known value: an explicit completion obligation. Section 3.3. |
| Violation | A rejected change's rule, affected facts and reason. Section 3.6. |
| Valid, invalid, undetermined | The three semantic validation outcomes. Section 3.9. |
| Fork | An initially identical isolated World state used internally for candidate evaluation. Section 3.9. |
| Variable | A named `?` binding in a pattern or template, not an unknown value in an ordinary fact. Section 3.4. |
| Pattern | A structural search description; it can contain variables or constants. Section 3.4. |
| Rule | Premises and a conclusion template evaluated for matching bindings. Section 3.5. |
| Derived fact | A rule-supported fact retracted when no justification remains. Section 3.5. |
| Deny | Conditions that must not hold together. Section 3.6. |
| Hard, soft | A constraint rejecting a change versus one recording an issue. Section 3.6. |
| Function | A typed declared calculation used by rules or checks. Section 3.7. |
| Legend World | A World declaring reusable concepts, spaces, roles and relationships. Section 4.2. |
| Conceptual space | A property's value domain with numerical axes or a declared structural graph. Section 4.4. |
| Axis, region, centre | Components describing a conceptual space and locations within it. Section 4.4. |
| Degree word | A word such as “big” or “short” whose interpretation depends on context. Section 4.5. |
| Comparison class | The declared reference population for interpreting a degree. Section 4.5. |
| Basic change | Appearance, disappearance, property change or relation change. Section 4.6. |
| Act | A requested change defined through roles and before/after conditions. Section 4.6. |
| Role | A named participation in an act or structure. Sections 4.3 and 4.6. |
| Schema, knowledge and instance Worlds | The three World roles. Section 5.1. |
| Domain fact, norm, default, heuristic | Different kinds of knowledge and authority. Section 5.1. |
| Realisation | A concrete representation available through a capability. Section 5.2. |
| Import, extension, restriction, conflict, binding | World-composition operations. Section 5.3. |
| Solver | A generic internal search for compatible values of interdependent open keys. Section 5.4. |
| Capability domain, tool, capability, binding | Declared connection between a domain and concrete primitives. Section 6.1. |
| Request | Desired information or change expressed as a SOP circuit in general concepts. Section 6.3. |
| Constraint | An identified requirement on the request's subjects or result. Section 6.3. |
| Focus | Subjects and requests currently salient in conversation. Section 6.4. |
| Reaction, correction, fragment | Message forms interpreted relative to dialogue state. Section 6.4. |
| Open question | An explicitly retained conversational question, not the default response to missing values. Section 6.4. |
| Tolerance | Permitted deviation under an applicable declared approximation policy. Section 6.5. |
| Source, character, context, cost | Four aspects retained for a candidate value. Section 6.6. |
| Requirement, preference, assumption | Three semantic statuses of a candidate value. Section 6.6. |
| Whole; executable plan | A thing composed of parts; a concrete circuit of typed tool calls with dataflow and dependencies. Section 6.7. |
| Deduction, minimum-cost completion, induction | General reasoning mechanisms. Section 6.8. |
| Observed state, proposed execution state | What has actually been observed and the candidate state evaluated before dispatch. Section 6.9. |
| Act frame | General language structure realising a claim about an act. Section 6.10. |
| Provenance | Sources and derivations supporting a value or claim. Section 6.10. |
| Unresolved-case register | Cases awaiting an identified general mechanism or declaration. Section 6.10. |
