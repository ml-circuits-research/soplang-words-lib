# Glossary

One line per term. These words are used with these meanings in every document, in the
code and in the messages of the library.

| Term | Meaning |
| --- | --- |
| **wire** | One declaration: `@id type key=value ...`. The unit of everything. |
| **circuit** | Wires connected by references. |
| **fact** | A wire that says something is so. It has no variables. |
| **matrix** | The wires that say which facts may exist and what follows from them: slots, types, rules, denies and the rest. Short for *consistency matrix*. |
| **pattern** | A matrix wire that describes wires to find. Named by `when=`, `not=`, `over=`, `remove=`, or given to `ask`. |
| **template** | A matrix wire that describes a wire to make or to complete. Named by `then=`, `set=`, `add=`. |
| **variable** | `?name` in value position: a value to be found by matching. |
| **reference** | `$id` in value position: another wire. |
| **world** | A set of facts kept consistent with a matrix: the object the library gives you (`new World()`). What it holds is one of the three kinds of worlds below, usually a live world. |
| **state** | Everything a world holds at one moment. Also: a value that changes over time (see *fluent*). |
| **fork** | A second world that starts as a copy of the first. Also called a *scenario* when it is used to try something. |
| **mark** | A point in the life of a world that it can be rewound to. |
| **type** | The second token of a wire. A type may extend another. |
| **slot** | The declaration of one key of one type: what it may hold, whether it is required. |
| **kind** | What sort of literal a slot holds: `integer`, `number`, `boolean`, `string`, `atom`, `quantity.<name>`, `time.<name>`, `any`. |
| **open key** | A required key that has no value yet. An open key is a question. |
| **identity key** | A key that says which thing a wire is about (`id=true`). Two wires with the same identity keys are one wire. |
| **rule** | "If these patterns match, these templates hold." |
| **deny** | "These patterns must not match." |
| **calc** | A value computed by a named function inside a rule. |
| **check** | A condition computed by a named function inside a rule or deny. |
| **aggregate** | A calc that ranges over all matches of a pattern: count, sum, the largest. |
| **relation** | A statement that holds among several values, from which whichever is missing is computed. |
| **sequence** | The order of wires in time: by a declared key, else by arrival. |
| **fluent** | A key whose value is a state that events change. |
| **event** | A fact that changes a fluent through an effect. |
| **effect** | The declaration of how one type of event changes one fluent. |
| **derived** | Made or filled by a rule, a relation or an effect, not told. |
| **provenance** | Where a wire or value comes from: `via` (which rule), `from` (which wires), `cells` (which values). |
| **cell** | One value: a wire id and a key. |
| **tier** | How solid a value is: `told`, `derived`, `forced`, `default`, `guessed`, or a tier the matrix declares. |
| **assumption** | A value weaker than `derived`: something the world took, not something it was told or proved. |
| **default** | The value a slot offers when nobody gave one. Taken as an assumption. |
| **transaction** | One change, applied whole or not at all. |
| **patch** | Several changes judged and applied together. |
| **chase** | Running the rules until nothing new follows. |
| **violation** | The reason a change was refused, as data. |
| **issue** | A violation of a soft constraint, kept in the world as a `core.issue` wire while it lasts. |
| **soft** | Said of a deny or a bound that records an issue instead of refusing. |
| **query** | A question with a status in the answer: `world.query`. |
| **status** | How sure an answer is: `supported`, `conflicting`, `ambiguous`, `missing`, `refused`, `unsupported`, `no`, `unknown`, `budget`. |
| **supposition** | A wire the world tells itself to answer a query, and takes back. |
| **action** | An operation that changes the world on request, as a function or written as wires. |
| **producer** | A host function that computes a key when it is asked for. |
| **function** | A named piece of host or built-in code that a calc or check calls. |
| **completion** | Filling open keys: by rules, by forced values, by defaults, by choice. |
| **domain** | The values an open key may take, when they can be listed. |
| **search** | Finding values for all open keys with a listable domain at once. |
| **solver** | The strategy a search uses. |
| **abduction** | Finding what would have to be true for something to hold. |
| **abducible** | Declared as something that may be assumed in an abduction. |
| **induction** | Finding a rule or slots that explain examples. |
| **budget** | The number of steps a call may take. |
| **module** | A matrix kept in the library under a name and loaded with `core.use`. |
| **build** | The single file made from the sources; it knows its version and fingerprint. |

## The three kinds of worlds

One name per kind, used in every document and in the repositories around the library
(sop-knowledge-worlds, the applications). In Romanian: *schema lumii*, *lume de
cunoaștere*, *lume vie*.

| Kind | What it is | Example | Where it lives |
| --- | --- | --- | --- |
| **world schema** | What a kind of world is: its kinds of things, their attributes and value types, the acts that apply, limits, rules and the words for them. No particular things. Reusable. | a seating plan: tables, seats and guests, at most 50 tables, `make`, `change`, `connect` | sop-knowledge-worlds, as `w.*` (`w.seating`, `w.timeline`, `w.list`); written with `std.schema` |
| **knowledge world** | Facts about the world at large, true for everyone, with no session state. | animals, places, colours, units; `w.lang.en` is a knowledge world about a language | sop-knowledge-worlds, as `k.*` (and `w.lang.en`); read with `createCatalog`, `std.know` |
| **live world** | One running instance of a world schema in a session: the things the user made, their current values, the focus, the history and undo. Temporary and particular. It follows its schema and reads knowledge worlds. | the plan for Saturday's dinner: table 1 is round, Ann sits at seat 2, undo gives back the table just removed | the application's session, in one `World` object |

How they relate: **a live world = world schemas + the knowledge worlds it reads + session
state.** A host loads one or more world schemas (`core.use`, or the published text) and
what it needs of the knowledge worlds (`createCatalog`, `std.schema.needs`) into a
`World`. The acts of the user then make it a live world. A **view** is how an application
shows a live world (a tab, a floor plan, a map): it shows some aspects of the same things
(`std.schema.view`) and may have attributes of its own (`state=`).

**Library modules** (`std.*`: `std.schema`, `std.acts`, `std.fill`, `std.focus`,
`std.relations`, `std.know`, `std.turn`; and the grammar reader) are mechanisms, not
worlds. A world schema is written with them, and a live world runs on them.

Which kind each part of the API works on:

| Works on | API |
| --- | --- |
| a world schema | `std.schema` wires, `schemaCard`, `schemaExamples`, `schemaGrid`, `gridTests`, `world.schema(type)` |
| a knowledge world | `createCatalog`, `bundleReader`, `std.know` (`std.know.fill`), `grammarOf`, `parseText`, `grammarView` (the grammar is a knowledge world about a language), `ask` on a fact by name |
| a live world | `act` and the acts of `std.acts`, `turn`, `turnFlow`, `route`, `resolve`, `why`, `undo` / `redo`, `fork`, `std.focus`, `std.fill`, `needsOf` (what a live world still needs loaded) |
| any world | `tell`, `load`, `ask`, `query`, `check`, `complete`, `snapshot` |

## Words that were used for the same thing

The code, the specification and the pages used to differ in these places. The left
column is no longer used.

| Was | Is | Where it changed |
| --- | --- | --- |
| `core.test` | `core.check` | wire type; the old name is still read when a rule links it with `if=` |
| `world.schema` (the Map of matrix wires) | `world.matrix` | property; `world.schema(type)` now describes a type |
| "schema wire", "schema" (for rules and denies too) | "matrix wire", "matrix" | documents; *schema* is kept for slots and types (`world.schema(type)`, `core.schema.map`) and as the violation kind `schema` for an error in the matrix |
| "pattern wire `?id`" | "pattern", written `@id` | the language (0.6) |
| "test" (a condition in a rule) | "check" | documents |
| "instance" (layer of fact wires) | "facts" | documents |
| "question" (for an open key) and "open key" | "open key"; a *question* is the `core.question` wire made for one | documents |
| violation kind `syntax` (a fact with a variable) | `variable` | violation (0.6); `SopError` is the only syntax error |
| `fns` for actions and producers | `actions`, `producers` | options (0.6) |
| "schema world", "schema" (for a reusable world), "world template" | **world schema** | documents (0.42) |
| "knowledge base", "catalog world", "knowledge" (as a world) | **knowledge world**; the *catalog* is the index that loads one | documents (0.42) |
| "session world", "the user's world", "instance" | **live world** | documents (0.42) |
