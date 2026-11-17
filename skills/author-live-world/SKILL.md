---
name: author-live-world
description: Write or change a live world's rules and facts so that the library's general capabilities do the work. Declare kinds with acts, slots with types and joins, std.schema.honours for every act, wholes and parts (k.expect), capacities and decision criteria. Join knowledge by key instead of value lists, keep words in the language world, keep world ids and sentences out of host code, keep state readable by factsOf, and make composition explicit. Check coverage and the properties generated from the declarations. Use when the missing piece is a declaration, and whenever a world is written or reviewed.
---

# Author a live world

Declare reusable kinds, constraints, relations and actions so existing generic mechanisms can use them.
A declaration is an interface promise: demonstrate the matching reasoning, binding and executor in a real
run before claiming the capability. See [operational scope](../README.md#operational-scope-and-evidence)
for the application's SOP-BERT reader, uncertainty policy and native-code boundary. The library request
APIs below describe explicit library workflows, not an alternative application reader.

## Parameters

- `LIB`: this repository (`capabilitiesOf`, `planRequest`, `factsOf`, std.schema, std.acts, std.decide).
- `KNOW`: the knowledge and language worlds at the commits in `LIB/repos.pin`.
- `HOST`: the world being written, and honest-list rows with `piece: declaration` or `composition`.

## How to write it

1. **Kinds and acts.** One `core.type` per kind (`extends=` its parent, `closed=true`), and one
   `std.schema.kind of= world= acts=` with the acts each kind takes. Every act must be an action of the world
   (`core.use world=std.acts`, or the world's own).
2. **Honours for every act.** `std.schema.honours world= act= on= of=` lists the request keys (`REQUEST_KEYS`:
   kind, count, size, extent, attribute, place, manner, layout, with, about, length) the act takes, for the
   things named. A key not listed is refused by name (`not_declared`). An honoured key must have a slot to
   land on: otherwise `no_slot` (the coverage check finds it).
3. **Slots with types.** `core.slot of= key=` with `kind=`, `min=`/`max=`, `enum=` for a closed set that is the
   world's own (layouts), `type=` for a slot that refers to things (planRequest proposes places through it),
   and `required=` (open required keys cost in deduction).
4. **Join knowledge by key, do not copy values.** A slot whose values the knowledge has (colours:
   `VALUE_TYPES`; kinds of animals; units) is a join (`type= by=`) to that type, not an enum list. Facts about
   kinds (where a kind lives, what it is made of, its parents) are in k.commonsense / k.scenes / k.kinds,
   where `deduceState` reads them, not in the world.
5. **Wholes and parts.** `k.expect.make thing= unit= min= max= typical=` and `k.expect.part of= part= group=
   shape=` say what a whole is made of. Count, kinds and layout are then filled from them when not said.
   Capacities: `std.schema.capacity of= key= holds= via=`. A world's own ranking of plans:
   `std.decide.criterion of=plan`.
6. **Words in the language world.** Cues, verbs, synonyms and skip words belong in `w.lang.<lang>`,
   `k.actions` and `k.words`, where every world and every language gains them. A world keeps only its own
   names for its own kinds (`core.word` of a kind). Never sentences, never phrase patterns.
7. **No world ids or sentences in host code.** The host passes worlds and explicit bindings to the library. Routing by declared
   identifiers is allowed; semantic decisions must not branch on a world's id, kind name or sentence.
8. **State readable by factsOf.** Things are wires with a type, attributes and `$` references (or declared
   joins). Then `factsOf`, `deduceState` and `induceStyle` see them. Name the operational state authority. Facts exported from native host state are an
   observation, not proof that reasoning and tool writes operate on an authoritative SOP World.
9. **Composition is explicit.** Two worlds work together only through a composite world that `core.use`s both
   and joins them by key, or through declared delegation. Never a silent merge, never one world reading
   another's internals.

10. **A tool is bound by wires (0.152).** When the world's state lives in a tool (a board, an editor), declare the
   tool in `std.tool` (`core.use world=std.tool`): `std.tool.op` with its parameters, `std.tool.param` with
   `type=` and `accepts=` (the values the tool takes; others are translated by knowledge: the nearest grade of
   k.expect.scale, the nearest kind of the lineage or `std.schema.drawn`), `std.tool.bind act= of= op=
   arg=<param><-<source>` with `needs=` / `makes=`, and `std.tool.custom` for a constraint or search no wire can
   say. Conditional defaults use the schema actually loaded by the consumer: the library
   supports `k.expect.value on= value= when.<key>=` and `k.expect.when key= value= if.<key>=`.
   Verify the consuming mechanism and pinned declarations; do not assume either spelling is the
   application contract merely because a library example uses it. Primitive calls take concrete typed
   arguments; reasoning supplies defaults and semantic choices through the declared mechanisms. Expose
   native rendering, storage and declared custom functions as implementation boundaries, and disclose
   remaining semantic code rather than calling it world reasoning. `toolSession` is a library entry point;
   verify that the host actually uses it before attributing its guarantees to that host.
   `examples/tool-app.mjs` and `test/tool.test.mjs` demonstrate this particular library contract.

## Check it

- `coverageOf(world)` (`skills/lib/declarations.mjs`):
  - errors: an act no action defines, a kind or key that does not exist;
  - gaps: an act with no honours row, a part shape that is not a kind;
  - advice: value lists that should be joins, words that belong in the language world.
- `generatedProperties(world, { catalog })`: every request key × every kind an act honours × this world. Each
  constraint must be honoured and landed in the plan, or named (`notHonoured`, `cannot`), and never silently
  dropped. Honoured-but-named cells are declaration gaps (a promise nothing takes).
- `enabledProperties(world)`: which of P1-P11 (`test/request.test.mjs`) the declarations enable. Add the world
  to those tests' world lists when it is an example.
- The patch-smell hints on the world text (`smellsOf({ world })`).
- Accept by the phase's rule (README, Acceptance). Declaring a key a world really cannot do, to make one turn
  pass, is a patch.

## May change / must never do

- May change the world's declarations through the host's or the knowledge repository's review.
- Never conceal arbitrary host logic as a world declaration; declared primitive/custom-function bindings
  remain explicit implementation boundaries. Never value lists the knowledge has, never sentences or phrase patterns, never a
  declaration of a capability the world does not have.

## Dry run

```
node skills/author-live-world/scripts/dry-run.mjs
```

Over the invented worlds of `examples/request-app.mjs` (sketch, notes, garden) and a control world (notes plus
an honours row for a key nothing takes). Last run:
- sketch: 0 errors, 3 gaps (remove, change and connect have no honours), 5 advice (colour enums → join to
  k.colours; words); properties 44/44 hold, 6 honoured but named (extent and layout honoured for the shapes,
  where only the picture has them); P1-P9, P11 enabled;
- notes: 11/11, 1 gap (size honoured, no slot); P1-P9;
- garden: 22/22, 0 gaps; P8-P11;
- control: the new gap `make note on=layout -> no_slot` is found.
