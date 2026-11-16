# Frame-role projection adapter

`frames.mjs` implements the published English licence joins using the public
`projectTemplates` and `valueText` APIs. No new generic library mechanism or
expression language is needed. The dependency is injected so the same adapter can
use a browser's pinned library bundle and both source/bundle integration tests.

```js
const binder = createEnglishFrameBinder(SOP);
const compiled = binder.compile(frameKnowledgeWorld);
const projected = binder.project(frameKnowledgeWorld, readings, { compiled });
```

`ENGLISH_FRAME_FACTS` describes the source families to load. The library's
`repos.pin` selects knowledge revision `0591f3424a0f61d98215d2808c031f04f977e409`.
Load the frame path declarations separately from syntax-template declarations:
these modules reuse node/step types, but a frame role path is not a syntax mapping.
The adapter can coexist with unrelated template nodes; it validates every path
referenced by the complete licence inventory, without claiming ownership of those
unrelated nodes. Keep the same published source revision across such static views.

## Compilation

`createEnglishFrameBinder(api, {types})` returns `compile` and `project`. The default
`ENGLISH_FRAME_TYPES` maps module, licence, role, node, step, verb, frame, part,
roleMap and actRole providers. This configuration relocates provider type names;
the English source-field joins remain consumer policy, not an inferred general
relation language.

`compile(world, {budget=200000})` validates module versions 1 and 2 only. Version 2
adds optional role target-mode metadata; absence remains unresolved. Compilation
requires exact verb identity and verb-part act agreement, an unambiguous selected
frame, complete frame-role coverage, matching frame parts, valid explicit role-map
restrictions, and a declared semantic role under the selected frame's act. It
checks unique ordered path steps and copies the whole value at each declared path.
A source frame's act is authoritative even when the licensed verb part has a
different act. Its mode and needs are also retained rather than discarded.

The result is `{ok:true, source:{world,stamp}, licences, issues:[]}` or
`{ok:false,issues:[{reason,id?}]}`. Private snapshots bind compilation to the exact
World and stamp, and cannot be changed through the public licence summary.
Unrecognised versions, valencies, role token contracts or target modes decline.
Known optional `target_mode` values are `new` and `existing`; no mode is inferred
from the verb, act or argument spelling.

## Projection and boundaries

A reading is exactly `{verb,valency,mood,context,provenance}`. Verb is an exact
licensed source identity; valency comes from syntax; mood must be explicit and is
preserved. Context is ordinary JSON, currently `{node:{object,result?,goal?}}`;
provenance is caller-supplied JSON retained without being upgraded to independent
source-coverage verification. Syntax parsing and source alignment remain separate.

`project(world, readings, {compiled,budget=200000,projectionBudget=20000})` enumerates
all matching licences, then projects one batch. It does not rank or merge them.
Output candidates retain the input index, licence identity, mood and provenance;
`value` contains frame, act, frame_mode, needs, ordered roles and source evidence.
Each role retains frame_role, act_role, marker, copied value, requirements, source
identities/metadata and its source part order. Role arrays preserve a marker and
an object sharing the same semantic role. A whole object keeps its selector or
neutral qualifiers; a result predicate stays separate. No qualifier is rewritten
into a selector or a desired-result condition here.

Every candidate is explicitly `status:'roles-projected', requestReady:false`.
`requirements` retain takes, lexicon, holds and optional target_mode, with typing
and unit applicability unresolved. This operation does not validate argument
applicability, produce `std.request`, resolve instances, execute effects or assert
new phrase coverage. In particular, the current generic phrase draft does not yet
supply the quantity/head structure needed by the increment role paths.

Failures carry the original index and licence where available. Missing paths and
unlicensed readings remain failures, including when other readings succeed. Budget
exhaustion is marked `truncated`; consumers must not choose a surviving candidate
as though alternatives were exhausted. There are separately bounded phases for
input/configuration/output copying, source joins/enumeration and compiled-data copying;
the final projection batch has its own shared `projectionBudget`. No per-role or
per-licence budget reset is used for that batch. A stale or foreign World declines.

The integration test exercises all five published licences against toy semantic
records, including the selected-frame/verb-act mismatch and marker duplication.
It is a licence-to-role contract test, not an English-to-effect acceptance test.
