# Changelog

## 0.199.0

- Evaluate request predicate graphs with bounded three-valued logic, scoped historical bindings and explicit population coverage. Source parsing, host truth and reply assessments remain separate.

## 0.198.0

- Add explicit owned read-only request projections for values, count, existence and selected members, with request/target ownership, ask mood and source-span validation. Query intent is separate from desired constraints.

## 0.197.0

- Grammar overlay features can copy exact provider identity with `from_id=true`, supporting source-filtered families without per-record literal mappings. General English reader compatibility integration consumes published frame/request declarations.

## 0.196.0

- Prepare complete request batches with explicit dependency DAGs and derive execution frontiers without implicit ordering or treating unverified effects as semantic success. Existing complex request graphs remain intact.

## 0.195.0

- Add typed historical population and presence evidence with `assessExistenceChange` and retained `std.reply.existence` claims. Partial absence and filtered-view transitions cannot claim creation or deletion.

## 0.185.0

- Add opt-in original Unicode source ranges to parseText, preserving existing token-index spans and default outputs. Multiword tokens retain disjoint contributing intervals.
- Unaligned rewrites, invalid Unicode and source-mapping budget exhaustion report unavailable provenance without changing parses.

## 0.184.0

- Add generic retained revisions: exact detached frozen JSON definitions keyed by identity and revision, idempotent reuse and conflict rejection.
- Preserve definitions through forks, undo/rewind and full/delta/timeline snapshots, with transactional rollback and budget accounting. Point-space and calibration bindings remain separate.

## 0.183.0

- Separate existing-target selector graphs from desired-result graphs. Validate complete context closures, independent binding scopes, ownership and operator boundaries; implicit result conjunction excludes selectors.
- Preserve candidate self-reference and joint relational descriptions without claiming resolver execution.

## 0.182.0

- Add calibrateReference: validate and capture reference samples/provenance into detached frozen data, preserving multiplicity and original tokens, then compute a finite positive median under the reasoning budget.
- Handle extreme finite midpoint arithmetic. Publication registry, persisted revision verification and axis binding remain pending.

## 0.181.0

- Add typed trace step, observation, reply, undo and correction records. Validate dependency/replacement acyclicity, reply request membership, invocation correlation and undo evidence ownership in final state.
- Distinguish an original step from the separate undo execution; retain per-source snapshot versions. Structural acceptance does not verify execution effects or response claims.

## 0.180.0

- Add std.trace.request and std.trace.input foundations. Historical inputs preserve canonical SOP token categories, duplicates and order inside JSON, without live reference dependencies. Reject malformed or variable tokens transactionally under the validation budget.
- Full trace linkage, observations, append-only persistence and evidenced reply semantics remain pending.

## 0.179.0

- Publish std.change.policy with required kind, concept, anchor and unit vocabulary names. This is a structural contract; policy selection, unit compatibility and change execution remain pending.

## 0.178.0

- Publish structural request graph schemas and inspectRequest: owner-local edges/targets, operator variants, Unicode source spans, acyclicity, reachability and all-path quantifier scope.
- Run request validation through core.validate; support aliased function registration and declared-family context for subtype roots. Truth, vocabulary compatibility and execution remain separate.


## 0.177.0

- Add core.validate for uncached, synchronous final-state invariants over typed records, including untouched parents after child edits. Missing functions, invalid results, exceptions and reentrant validation fail closed.
- Account for validator traversal and schema-link scans under the existing validation budget. Request topology validators remain pending.


## 0.176.0

- Publish request source/envelope/target structural contracts with mandatory explicit mood and typed ownership. No missing mode defaults to execution.
- Test the actual minimal book fixture, forward references, source reuse, aliases and transactional edits/deletion. Logical request graphs remain pending.


## 0.175.0

- Add generic core.schema.link descriptors, transactional reference/name resolution and semanticLinks() inspection. Legend registers is/means/space annotations with strict missing/ambiguous rejection.
- Preserve semantic annotations in schema conflict handling; legacy unannotated schemas remain valid. Full semantic behavior and mandatory annotation migration remain pending.


## 0.174.0

- Add typed legend concepts, degree metadata, relations and owner-bound roles. Reject specialisation cycles, inconsistent inverse declarations and invalid owner-role references using existing SOP mechanisms.
- Test the actual conceptual book fixture, transactional hierarchy edits, namespace crossings and module aliases. Semantic linking and evaluation remain pending.


## 0.173.0

- Extend the legend contract with versioned spaces, ordered axes and typed canonical/alternative units; validate ownership, unique names/orders and numerical parameters.
- Exercise the book's complete colour-axis fixture and transactional rejection cases. Frame/point semantics and conversion remain pending.


## 0.172.0

- Publish opt-in legend act/condition schemas, variant guards and owning-act role validation with executable book fixtures.
- Preserve explicit pattern-identity variables through module prefixing and aliases; ordinary variables and quoted text remain unchanged.


## 0.171.0

- Added std.reference sample/set structural contracts: distinct equal observations keep multiplicity, references and mandatory fields are checked, and a declarative deny enforces member/set unit agreement.
- Optional typed provenance is supported. Calibration and immutable version enforcement are not claimed.

## 0.170.0

- Added opt-in `std.objective` structural contracts with typed term references, required fields, finite nonnegative weights and exactly representable nonnegative integer priorities. Same-priority terms and zero-weight contributions are explicit.
- Load validation does not claim evaluator resolution or optimization.

## 0.169.0

- Added opt-in closed import-evidence modules: `std.source`, `std.import`, `std.provenance`, `std.knowledge`, with structural presence and typed references. No truth, licensing or concept-resolution claim.
- Module aliases now rename a type equal to the module name as well as its dotted descendants.

## 0.168.0

- Added opt-in `core.slot present=true`: structural presence validated transactionally after deduction, including inherited slots and atomic patches. Existing `required=true` completion semantics are unchanged.
- Reject malformed presence flags and prefix-presence declarations. This is a phase-zero foundation, not a completed contract-family release.

## 0.167.0

PSys2 reviewer 09:25 [LIB]. Properties in `test/genre-parts.test.mjs`.

### Fixed
- A said length grade scales the expected length (words) with the part counts, for joined genres too; its origin is `said`, so "I assumed 150 for the length" is no longer said after "short".
- "longer" / "shorter" step the length of a joined genre text; a length step the tool cannot carry out says `nothing.same.limit` / `nothing.same.length` (a primitive may return `{ length }`), never "That is what is there already."
- A revision says no count, kinds or length assumptions the user did not ask about; the topic is kept.

## 0.166.0

PSys2 Q102 follow-ups [LIB]. Properties in `test/genre-parts.test.mjs`.

### Fixed
- `step.parts` as an argument source of a `std.tool.arg` is read from the step itself (the plan puts `parts` there, not in `args`).
- `done.parts` carries `kinds` and `numbers` (as `done.whole` does), so a language composes it with its own part words; the `parts` role stays the English text.
- A primitive may return `{ parts: { name: count } }` (or `[{ name, count }]`) for what it wrote; fewer than the plan named says `short_of` once per part (fact field `part`), and `done.parts` shows what was written.
- Things said together with an unread word ("a novel and a zorp") make the read ones and name the unread one; "I baked a cake, draw it" names the clause "I baked a cake" as not understood, not the later verb.

## 0.165.0

PSys2 Q102 [LIB]. Properties in `test/genre-parts.test.mjs`.

### Fixed
- The parts of a whole come from its own kind's knowledge: a joined genre carries `plan.parts` (k.genres.part / step), named, scaled by short / long; reply `done.parts`.
- The topic / title of every text joined as a genre is said (`done.about` / `done.title`).
- "short" / "long" scale the parts of a text.
- A step with no other value says `refused.no_other` ("The nose has no other variant.") instead of "To what value?".
- Example session passes the catalog to `runPlan` (joined kinds run). Not done: Q102 (1) (spell guard) and (4) (offline word list), still the knowledge base's / the reviewer's.

## 0.164.0

PSys2 Q100 (and Q98 checked). Properties in `test/referent-turns.test.mjs`; `repos.pin` knowledge pin b57c4633 (the published step cues).

### Fixed
- The thing named by a reply that changed nothing (`refused.already`, `nothing.same.value`) is what "it" means next.
- A read act planned as another act with words left untaken (`put a heart on the chest`) runs nothing (`plan.turned`).
- "the next mouth" / "another nose" with the published cue `attribute.variant_next` / `variant_previous` is a step, not a place.
- An assumption is said by the key of the world, never by a tool argument's name.
- A kind joined `as=<type>` keeps that type's slots (`about` of a genre joined as a document type): covered by a property.

## 0.163.0

What the avatar's thirteen owner turns still failed on (PSys2 Q99). Properties in `test/face-world.test.mjs` over `FACE` (new
preset `king`, parts joined `single=true`) and the shelf.

### New
- `std.schema.kinds single=true`: at most one thing of each joined kind. "put a hat" with a hat on replaces its variant (said) or says
  `refused.already`; it never asks where.
- Replies `nothing.same.value` ("The eyes are already green."), `refused.already`, `refused.no_default` (English built in).

### Fixed
- A part joined `as=part` keeps its kind in the mirror; "bigger" steps from the size it has (Q99 1).
- "make it happy" after a preset goes to the whole (the thing with the key), not to the parts the preset added (Q99 3); a value goes
  to the things that take its key.
- A reset gives each thing its own declared defaults; none declared: said, not asked "to what value?" (Q99 5).
- A value carried over from the last turn is not carried to another kind (a hat's variant to the glasses).
- "the next mouth" and "big smile" are properties now (Q99 4, 6): the act is read from the noun phrase, the variant is chosen at the size said.

## 0.162.0

A whole with slots of parts, from the avatar's turns (PSys2 Q96 slice A1, Q97, Q98) and two wrong executions (r0019, r0129).
Properties in `test/face-world.test.mjs` over a new example world (`FACE`: one puppet face, parts joined from a small base,
variants, moods, presets) and the other example worlds.

### New
- `std.schema.kinds ... as=<type>`: joined kinds are kinds of a type of the world (its slots, its lineage); std.acts makes them
  as things of it and `mirrorState` tells them so. `canBe(live, predicate, catalog)`.
- Values of a slot typed by a catalog type (`type= by= match=kind:<k>`) are read, and name their kind ("a big smile").
- A value with no thing named is a value of the one thing that has its key ("make it happy"); a pronoun never asks for a
  kind of the world.
- `refused.can_be` for an unknown kind named for a thing ("make the puppet an emoji"), with what it can be.
- Phrasal make and remove ("put a hat", "put on glasses", "take off the glasses"), "give her a crown" as a make in a world
  with no giving, "make the face a robot", the verb's value (`reset` = the declared defaults), "the next / previous <part>"
  (a cue `on=attribute step= takes=thing`, proposed for w.lang.en), a noun phrase alone as a make.
- Plural-noun kinds (the language's irregular pair singular = plural) and their replies; plurals of kinds of several words.
- `stateDiff` reports a change of kind; the reply names the thing by the kind it had.
- A place with a side ("the corner on the right") keeps the side: composed with the place slot's values, decided by an
  expectation or asked.

### Fixed
- The world's own kinds and words come before the catalog's; a world value beats a catalog-only kind of the same spelling.
- Joined names of several words (quoted in the base) are found by std.acts; a stand-in is planned with its base's whole.
- The join map is built once per version and shared by forks; the reader's lexicon is memoised with the catalog.
- "for their grandma do it": the one a thing is for is no topic; its words stay unread and nothing runs (r0019).
- A fragment that says what the last act cannot take no longer continues it (a remove).

## 0.161.0

A reply says what the person said in their own words, and a state answer names a lone thing. Properties in `test/said-words.test.mjs` over the example worlds (STORIES, MEADOW, SKETCH, NOTES).

### Added
- `about` and `place` constraints of `readRequest` carry `said`: the words of the operand as the person wrote them ("a fox", "ancient hobbits"). `sayRequest` takes them for `done.about` (and any said value named by a constraint of the same `on`), so "The story is about a fox." No article rule in code.
- `askWorld`: when there is one thing of a kind and it has a `title` or `name` (`opts.nameKeys`, default `['title','name']`), it says `state.count.named { kind, number, name }` (fallback `state.count`); the English library default is "There is one story, \u201cAll about the fox\u201d.". The library default is tried before the fallback rows.

### Fixed
- A topic or title changed by a replacing act is said once (`done.change`), not again as `done.about` / `done.title`.

## 0.160.0

Kinds taken by join (`std.schema.kinds`) work end to end for a world instance that joins a knowledge base; properties in
`test/joined-kinds.test.mjs` over the example worlds, and one test against the catalog at pin 7042ea70.

### Fixed
- A kind declared by join is declared for its acts, not planned as a whole by the catalog's `k.expect.make` of it unless the
  world declares that whole (a `k.expect.make` row of its own, or the kind in `std.schema.kind`): joining `k.objects.object`
  no longer turns "draw two dogs and a tree" into a crown / branches plan.
- Several `std.schema.kinds` rows per world (`from=k.objects.object`, `from=k.people.kind`) no longer conflict: `from` is part
  of the row's identity and the kinds of all rows are merged.
- The acts that run a plan find joined rows through the catalog: `planRequest`'s fork and `runWorldPlan(live, plan, { catalog })`
  (std.acts), the binding picked for a step (`std.tool.bind of=` may name the type a kind is joined from), `mirrorState(live,
  view, { catalog })` (things of a joined kind are in the state the planner reads: "remove the goats" finds them).

### New
- `sayRequest` says the values said per kind ("I added a red novel. I added a blue atlas."), from the per-kind attribute
  constraints; reply `done.add.value` (falls back to `done.make.value`, then `done.add`).
- `askWorld` state answers name the said attributes of few things (`STATE_FEW`, `opts.few`): `state.count.value`.

## 0.159.0

The count of a whole is a count of wholes; what a reply says of a made whole; a text's length; "new" leaves a trace;
properties in `test/whole-counts.test.mjs` over the new example worlds `STORIES` (a story with chapters as parts) and
`MEADOW` (a whole of several kinds of parts).

### Fixed
- A count of the target whole ("a story with 5 chapters": one story) is never the count of its parts: no "3 made, the request
  said 1". A count said of one part of a whole with several kinds of parts ("fewer flowers" of a meadow) is that part's
  own count, the other parts keep theirs ("no 7 made, the request said 3"). A count said with "with" wins over the part's own
  expectation, a unit kind too ("with a chapter" is one chapter); a said count gives way to no part's own minimum.
- "shorter" / "longer" on a text (the whole's expectation has a `length`) steps the `length` key from where it was, never a count.
- `toolCapabilities(live, bindings, { catalog })` and the planner's whole-world things take the catalog (joined kinds), as
  `capabilitiesOf` does since 0.158.

### New
- `sayRequest`: `done.about` / `done.title` name the topic or title said of a made whole; `short_of` says "made N of M"
  when the knowledge holds fewer parts than asked (a plan's `short`, `outcome.short` from the host for a length it fell short of).
- "new" (a language world `det kind=modifier meaning=one-more`) leaves `fresh: true` on the kind's constraint, the request and
  the plan; a bare "new page" with no verb asks for the row's `act` (default `make`, `actFrom: 'fresh'`, not said as an assumption).

## 0.158.0

Cues of the catalog at 7042ea70 no longer break the reader; kinds taken by join count as declared (psys2 re-pin);
properties in `test/cues-robust.test.mjs`.

### Fixed
- `readRequest` reads an attribute cue that takes a number and a unit ("rotate the X by 30 degrees": `attribute.rotation`):
  the constraint is `{ on: 'attribute', attribute, value: 30, number: 30, unit }` (it threw on `o.value.entry`). It never
  throws on a cue: a cue whose operand cannot be read is no match and its words stay unread.
- "what is in / on the picture" (the whole noun of the world, a word the world's declarations give for its whole) asks about
  the whole view: the mention is marked `inside` and `askWorld` does not count it as a kind ("There are 0 pictures").

### New
- Kinds declared by join (`std.schema.kinds world= from= key= acts= stand_in=`) count as declared: `capabilitiesOf(live,
  { catalog })` lists them in `kinds` and `joined` (with the stand-in a row's `drawing=` says), `kindLineage(..., { drawn: true })`
  goes from a stand-in to its base (villa to house), honours rows may name the type a kind is joined from (`of=`), and
  `declares(live, act, kind, { catalog })` / `honoursKind(h, kind, opts)` answer for the host (explicit, joined, subkind, stand-in).
- A `std.tool.param` of type `kind` with no `accepts=` list takes every declared kind (`nearestAccepted`) and refuses the others.
- The catalog pin of the tests is 7042ea70.

## 0.157.0

Partial reading never executes, a count revision is said by its net result, and four small Q93 items; properties over
the example worlds (`test/revise-names.test.mjs`).

### Fixed
- Q93 (1): "fewer cats" no longer begins "I made it again": `done.revise` is not said after a step reaction ("fewer",
  "too many", "bigger"); only a remake ("again") says it.
- Partial reading (reviewer, r0019 / r0129): a turn with an unread word executes nothing, in `planRequest` and
  `runPlan`, not only in `toolSession` (`unreadThatMatters`: every unread content word, decided by the reading; the plan
  is `{ ok: false, unread }`, the run `failed.code: 'unread'`, the reply `not_understood`).
- Q93 (3, 4): a count said with "with" ("a picture with a lake" drew 2 lakes, "a lake with three fish" was refused
  "2 made, the request said 1") is that many of the kind inside the whole (`a` is one); the plan's bounds allow them.
- Q93 (2, partly): "fewer X" where the last result has no X (nor a kind of X) says "There is no X here." and keeps the
  result (it used to replace the whole with the count of X).

### New
- Q93 (5): a move to a thing of the view says the relation when the language has `done.place.<relation>` ("I moved 2 fish
  into the lake."); else the change as before. Rows for `into` in the tool example's language.

## 0.156.0

A revision changes only what it names, and seven more turns PSys2 reported (reviewer 08:25; psys2 worker-log honest
lists, Q42 (8), Q45 (7), Q46 (13)), each generic, proven by properties over the example worlds
(`test/revise-names.test.mjs`).

### Fixed
- A wrong execution: "fewer cats" after "three cats and a dog" removed the dog. `reviseRequest` put the turn's kind
  constraint over every wanted kind and the stepped total over every count. Now a count step whose turn names kinds of
  the last result steps those kinds alone; every other kind keeps its count (a count `of` each kind); the target, the
  whole and the sizes stay ("less trees" after a forest keeps the forest, "more trees" no longer makes them big). "fewer"
  with no kind after a result counted by kind steps every kind by the scale's factor, none below one.
- `planRequest` plans kinds counted each by a number of their own with those counts inside a whole too (the shapes of
  a picture).
- "make the house bigger" after "draw a house": a size cue that is also a reaction no longer makes a remake; it is the
  change sense of make. A reference plan (an act on the things that are there) never undoes the last entry first
  (`runPlan`, `runWorldPlan`) and is not said as a remake; after one, a turn of new values only ("make it smaller")
  is the same act on the same things.
- A stepped size is translated past the thing's own size in the step's direction (`nearestAccepted` `toward`, steps
  carry `stepped`), so "bigger" on a tool with two grades changes something.

### New
- A general whole with no expectation of its own ("a random picture", "a picture with a lake") is planned as one of
  its subkind wholes (the world's lineage): those whose parts hold the kinds said with it first, those a binding names
  next, sampled by the seed; said as an assumption of the kind.
- "all the X": `readRequest` reads the language's `partitive mode=all` before a kind: `all: true`, `plural: true`,
  whatever the form ("all the fish"); an act on things takes every thing of the kind.
- A place said by a thing of the view ("into the water", "next to the pond") gives each step `region` (the thing) and
  `relation`, for bindings (`step.region`, `step.relation`).
- `sayRequest` says the whole before its parts.
- A statement of the speaker ("I like cats", "I love comics", "I saw a bird") is no request nor fragment:
  `statement: true`, its verb unread; a wish word asks only after a modal or before an introduced thing.

## 0.155.0

What a reply says (the reviewer's three defects seen through PSys2 on 0.154.0), generic, proven by properties over the
example worlds (`test/reply-said.test.mjs`).

### Changed
- `sayRequest` never says a missing value: a changed key with no value to say (`undefined`, `null`, `NaN`, empty) is
  said by its direction, the word of the request's reaction ("bigger", "more"), or its line is left out; a fact with an
  unfilled role is dropped; no text contains "undefined", "null" or "NaN".
- Only the assumptions that matter are said, as data: `default: true` on an assumption (the world pattern's declared
  default: layout, tool parameter default, a place the world arranges) makes it of the source `default`; the sources are
  ranked by their place in `say`; at most `sayMax` (new `ASSUMED_MAX` = 2, or `<lang>.reply name=assumed max=`), one
  per key; a list of kinds and a single kind are one fact; kinds and a count the result lines state are not repeated.
- A revision of a whole says the whole's net state, one `done.whole` fact (`whole`, `parts`: "The necklace now has 5
  rounds, 4 squares."), not the operations; operations stay for acts on individual things.
- A kind drawn as another by `std.schema.drawn` is not an assumption ("I assumed oval for the kinds. I assumed ellipse
  for the kind."): `runPlan`'s `assumed` leaves it out.

## 0.154.0

Turns PSys2 lost to the request mechanisms (psys2 questions.md Q46, Q47; questions.md Q90), each a generic piece; proven
by properties on the example worlds (shelf and necklace through a tool, sketch and garden through their own acts:
`test/references-fragments.test.mjs`).

### New
- `stateIds(live, view?, ids?)`: the things of a world's state, wires of a `std.schema.thing` type, never declaration
  or knowledge rows. The things of an act (by kind, by name, the whole world, the place candidates) and the change sense
  of make go through it: "remove everything" no longer takes `std.schema.drawn` rows (Q90).
- Names as references: `readRequest` reads a phrase that is the name of a thing of the state (its id or a free text
  value: a label, a title) as a reference (`named`, `refers: 'named'`; `ctx.state`, which `toolSession` passes as the
  mirrored state). A value, a verb or a kind this world has is never a name; a kind only the catalog knows gives way.
  `planRequest` acts on the things named (remove, change, place, the change sense of make; connect joins them in the
  order said); two things of one name: `refused.which`.
- Fragment ellipsis: `reviseRequest` gives `reaction: 'continue'` for a turn with no verb, no reaction cue, not a
  question, that wants a kind not by a definite reference: a new request with the dialogue's act (`actFrom:
  'dialogue'`, in `assumed`); `w.dialogue.revision reaction=continue` rows when the language has them, else does=inherit
  on=act, nothing replaced. `readRequest` sets `question` (a final "?" or a first word of `${lang}.wh`; the examples'
  language now loads `w.lang.en.wh`).
- `readRequest`: `mentions` (every kind word read, units and the world's words too). `askWorld` counts the kinds asked:
  the kinds wanted, the kinds of a count, else the kinds mentioned ("how many beads?" counts beads, not the necklace or
  the ties).
- `when.<key>=none` in a conditional expectation: the key is absent.
- `std.tool.value op= param= value= as=`: the tool's own name for an accepted value of the world (the call gets `as`).
- A singular indefinite ("a boat") gives a count 1 of that kind with origin `said` (`det: true`): never "I assumed 1
  for the count", never a refusal in a world that does not take a count (reviewer 06:05).
- `ASSUMED_SAY` and `sayRequest(..., { say })`: which assumptions are said is data, by source (default: all but
  `default`, a tool parameter's declared default, now its own source; or the language's `<lang>.reply name=assumed
  say=` values). One rule for every key.

### Changed
- A turn with unread words and no reaction cue never revises or keeps the last result (Reviewer 05:20 B): it is a
  request of its own, planned (its act abduced when nothing unread stands where it would be) or not understood.
- A reaction's `step` rows apply only on the keys the turn names when it names one: "make it bigger" steps the size and
  keeps the count (Q45 (7), Q46 (13)).
- A revision through a tool whose net change adds and removes nothing and changes no key it set is `same`: "Nothing
  changed." (a place or an order the tool recomputed alone is no change; `diff.changed[].unsaid` marks such a key).
- Plurals of kind words are the language world's inflection only (a plural equal to the singular is none); the English
  spelling rule stays for a language world with no inflection.
- Plural + definite = every thing of the kind in the view, singular + several = the question: already so in 0.153 on
  the shelf; now also proven through the world's own acts (sketch), and no declaration row counts as a second thing.

## 0.153.0

What PSys2's Drawing still did or lost in the host (psys2 questions.md Q45), each a generic piece; proven on the example
worlds (shelf, necklace, sketch, garden: `test/acts-on-things.test.mjs`).

### New
- `stateDiff(before, after, { match, keys })`: a thing removed and one added matched by kind and values; a pair that
  differs is `changed` with `was`; only `keys` are said (the rest only when nothing else changed); `redone`, and `same`
  exact. `runPlan`'s diff is this net change, its keys the ones the plan set (of a revision: set otherwise than the plan
  it replaces), so "fewer dogs" says one dog removed and a place the tool computes is not said. A reference step whose
  key the view cannot show is said from the call (`by: 'call'`); `as`: the request's key a binding took a changed value
  from (a move says the place).
- The change sense of make (`plan.sense = 'change'`): a make whose object refers to things that are there and says only
  values after it is planned as change, by reference over the view (definite determiner: the language's
  `definite=yes`; "it"; "everything"); a size said as a step changes each thing one grade from its own size.
  `reviseRequest(..., { live })`: such a turn is a request of its own, not a revision.
- The whole world as the things of an act (`plan.whole = 'world'`): "everything" (the language grammar's NP of
  `set=all`: `requestLanguage` now loads `w.lang.en.rule`, `.construction`, `.word`), the world's name and every word of
  the kind it means; such a word after a preposition is no place (the host's `withoutSelfPlace`).
- `done.change` has the role `key`; a reply fact with a key is said by `<name>.<key>` when the language has it
  (proposed in `examples/tool-app.mjs` PROPOSED_EN: `done.change.place`, `done.change.size`).
- Kinds said together (no whole) are each one with no number, several when plural; a size or a value said of one of
  them goes to that kind only (readRequest gives it `of`: the kind word after it with no joiner between, else before).
- A plural kind with no number: the count from `k.expect.value on=count` (given `plural=yes`), then the amount "some".
- A whole of the expectations whose parts the world cannot make is made as one thing (`plan.asOne`).
- `readRequest`: the target always keeps its kind constraint with `at`; kind constraints carry `definite`,
  `indefinite`, `world`; `refers: 'all'`, `refersAt`. An indefinite singular in an act on things takes the newest one.

### Changed
- A kind said in the singular is one, as said (no `assumed count`), and the size no longer scales it ("a huge atlas"
  was two).
- A change binding's changed values are never filled from expectations or parameter defaults; undo by inverse leaves
  out keys no change binding takes; a change that asks for what is there says `nothing.same`; remove of several takes
  the things others are in last; the assumed value of a custom search that is a thing of the view is said by its kind.
- `sayRequest`: one `assumed` fact per key and value; `why.nothing` said once; reference plans run through a world's
  own acts are said (`done.remove`, `done.change`) from the plan's things.
- The examples: the shelf has `move` (act place), size on change, a computed place `at` in its view and a plural count
  expectation; the sketch honours remove and change.

## 0.152.1

Aligned with the reviewer's design (reviews/legarea-declarativa.md); disagreements in questions.md Q88.

### Changed
- `std.tool.arg bind=$<binding> param= from=...` (one wire per argument) beside the inline `arg=`; `std.tool.needs op=
  exists=<kind> absent=<kind> check=<custom>` (preconditions of an op on the state); `std.tool.param kind=` (the value's
  kind), `type=<a kind of the world>` (that kind or a subkind, or a thing of it in the view), `default=`, `required=true`;
  `std.tool.bind world=`; `makes` defaults from the op's `effect=makes`.
- Sources `state.<kind>` (the thing of that kind the request names, else the newest) and `result.<n>`.
- Conditional expectations in the review's form `k.expect.value [of=] on= value= when.<key>=` (`EXPECT_TYPES`); the
  0.152.0 `k.expect.when key= if.` is still read.
- `planRequest`: remove / change / place planned by a reference step over the state ("them", the kind named, values
  before the kind select, after it set; several for a singular kind: one question `refused.which`, no step; none:
  `refused.no_such`); the target is never guessed from the dialogue or the world over an unread word.
- `toolSession`: a message read only in part executes nothing (`not_understood`). A binding's `value.<atom>` constant is
  no assumption.
- The examples use the review's forms; the shelf honours remove and change.

## 0.152.0

Tool binding as wires, executed by the library (owner 2026-11-15 19:27: the glue between a live world and the generic
mechanisms is declarative; only tool primitives, the view and declared custom constraints / searches are code).

### New
- std module `std.tool`: `std.tool.op`, `std.tool.param` (type, accepts, scale, range), `std.tool.bind` (act, of,
  op, `arg=<param><-<source>|...`, needs, makes / removes / changes), `std.tool.custom` (constraint or search, with
  its signature and the reply it fails with). `toolBindings(live)` reads and checks them.
- `runPlan(plan, bindings, primitives, { view, timeline, replace, request, live, catalog })`: binding by act and kind
  lineage, arguments filled (said, revised, plan values with provenance, `k.expect.when`) and translated by knowledge
  (`nearestAccepted`: nearest grade of an ordered scale, kind lineage and std.schema.drawn, range), preconditions
  (exists, absent, declared constraints), the primitive called, the effect checked on the view; all or nothing; the
  result is a diff (`stateDiff`; a thing redone alike is no change: `same`). It owns the timeline (`toolTimeline`):
  one plan = one entry, a revision replaces it, undo / redo by the tool's snapshot or by the inverse of the diff
  through the bindings, a question is no step. `runPlan(live, plan, opts)` with a World is unchanged (`runWorldPlan`).
- `toolSession(live, primitives, opts)`: the door with no code per world (read, question, undo / redo, revise, plan on
  the mirrored state (`mirrorState`), run, say). `toolCapabilities`, `askWorld`, `WORLD_QUESTIONS` (capabilities,
  state): questions answered as facts of the declarations and of the view.
- src/expect.mjs: `kindLineage`, `expectedValue` (conditional expectations `k.expect.when ... if.<key>=`, the most
  specific first), the structure operators `cutToCount`, `fillToCount`, `notAllOneKind`.
- `examples/tool-app.mjs`: two invented tool worlds declared only by wires (books on a shelf: three primitives;
  beads on a necklace), and the w.lang.en cues / replies proposed for the catalog (Q87). test/tool.test.mjs (7).

### Changed
- `planRequest`: a general kind is a mix of its makeable subkinds, and a kind not wanted excludes its subkinds;
  coordinated kinds keep their counts; a count of the whole plans that many wholes; `k.expect.when` fills open slot
  keys per item (with the item's role in the links), the whole's count and layout; an expectation whose conditions
  hold here comes before an induced value; a revision that changes only the count keeps the last plan's structure
  (`plan.structure` cut / fill).
- `sayRequest`: speaks a tool run from its diff (`done.add`, `done.remove`, `done.change`, `done.undo`,
  `why.nothing` + the reason, `nothing.same`), `outcome.capabilities` (`can`, `can.say`), `outcome.answer`.

## 0.151.0

A contextual spell repair (psys2 Q39), generic and deterministic.

### New
- `repairWords(tokens, { worlds, dialogue, lang, language, ... })` -> `{ tokens, repairs, asks }`; `editCost`,
  `worldWords`, `languageWords`, `SPELL`, `SPELL_SOURCES` (the source prior as data: open world, other worlds,
  dialogue, dictionary), `SPELL_COSTS` (src/spell.mjs). Keyboard-aware edit cost; repair only on a unique best
  within the threshold, else an `ask`; names, quotes, numbers and known words never change.
- `readRequest(..., { spell: true | options })`: the repair as one candidate source of the reader; the request
  carries `spell: { repairs, asks }`. Off by default.
- test/spell.test.mjs (8): costs, sources, wrong-repair guards, ambiguity, readRequest, and a property over the
  three example worlds (a typo of a label or kind is repaired to it).

## 0.150.0

A first layer of reasoning in the gap filler (owner 2026-11-15 14:11): shallow, generic, bounded, on the state of
the live world, the same for every world.

### New
- `factsOf(world)`: one flat view of any world as `(thing, attribute, value)` and `(thing, relation, thing)` (a `$`
  reference or a declared join), with kinds from the type lineage; indexed (`ofKind`, `related`, `inbound`), kept
  per `world.version` and built from the last view of the same history by the events since (also on a fork).
- `kindFactsOf(catalog, types)`, `KIND_FACTS`: what the catalog says of kinds (k.commonsense, k.scenes, k.kinds
  parents) as `(kind, attribute, value)`.
- `deduceState(view, ids, opts)`, `REASON_RULES`: forward chaining (Datalog-style, bottom-up) to depth 2 and the
  constraints `join` (hard), `placed` (soft; a fish is at water, a pond is a thing made of water; each inference
  step costs 0.25), `open` (soft), `request` (the plan's bounds: kinds not wanted, the count said; hard).
- `induceStyle(view, types, opts)`, `induceCorrections(list, opts)`: anti-unification, one step (Plotkin 1970),
  over the things of a kind (at least 3) and over a session's last corrections (2).
- `REASONING`: the bounds (5 candidates, depth 2, a tick budget, 3 things, 2 corrections).
- std.decide kind `plan`: consistent (hard), honoured, expected (soft cost), cost (assumptions weighted by the
  place of their source), assumptions, near.
- `examples/request-app.mjs`: a third invented world (animals in the areas of a garden; a pond with a capacity),
  `requestKinds()`, and the session keeps `dialogue.corrections` and passes `replace` to the planner.

### Changed
- `planRequest`: propose (at most 5 candidates: where the items could go through a slot that refers to things, a
  place said by a kind or by a reference word, a fall-back without induced and dialogue values) -> simulate (each
  on a fork) -> deduce -> drop hard, cost soft -> abduce (`choose`, kind `plan`). New options `replace`, `ticks`,
  `candidates`, `reason: false`; the plan carries `rejected` (with why), `cannot`, `bounds`, `reasoning`. When no
  candidate survives, `ok` is false and `cannot` says why.
- `REQUEST_SOURCES` = said, dialogue, induced, world, expect, sampled: a value induced from this world's state comes
  before the world's own facts and k.expect.
- `readRequest`: a reference word for a place ("there", "here", the language world's place pronouns; "in it") is a
  place constraint with `ref`, which the planner resolves to the cheapest thing that makes the request satisfiable.
- `runPlan`: `result.items`. `sayRequest`: a `not_honoured` fact for each reason of `outcome.cannot`.
- A layout said as a value of the slot ("column") is no longer overridden by the sources of the layout.

## 0.149.0

Requests as worlds (owner GO 2026-11-15): the mechanisms readRequest, reviseRequest, planRequest and sayRequest,
one gap-filling mechanism over any live world from what it declares. Knowledge pin 0966924e (w.request,
w.dialogue, k.expect, the w.lang.en cues).

### New
- `readRequest(world, text, ctx)`: a live w.request (act, target, refers, constraints: kind wanted / not / not_all,
  count as a number, range, named amount or about N, size and extent on the scale, attribute, place, manner,
  layout, with-lists, about, length; reactions; unread words). The words are the language world's
  `${lang}.cue` facts, longest phrase first then priority; two cues of the same words that set different keys
  both hold. `facts` gives the host's flat shape; `requestWires` writes w.request wires.
- `reviseRequest(dialogue, request, { revisions, catalog })`: a new request, or the last one revised by the
  w.dialogue.revision facts of its reaction (flip, step by the k.expect.scale factors, add, keep with a new seed,
  undo, none), with `replace`, `seed`, `vary` and the revision's reply name.
- `planRequest(live, request, { catalog, dialogue, sources, seed, vary })`: from the world's declarations
  (`std.schema.honours act= on= of=`, new in std.schema; its kinds and slots; its own k.expect facts, then the
  catalog's) the acts with their roles filled, what was assumed (with its source) and what is not honoured
  (not declared, no slot, refused value, no such kind, nothing left). The order of sources is data:
  `REQUEST_SOURCES` = said, dialogue, world, expect, sampled. "random" samples in the range, never its minimum.
  An unread word where the act stands is never guessed over. `capabilitiesOf(live)`.
- `runPlan(live, plan, { replace })`: the steps through `act`, the last result removed first.
- `sayRequest(request, outcome, { language, lang })`: reply facts (the revision's reply, done.revise, done.make,
  assumed, not_honoured, unread) and their text by `replyFrom`.
- `examples/request-app.mjs`: two invented worlds (shapes on a page, short notes) through one session with no
  code per world; `test/request.test.mjs` runs P1-P8 over each by reading its declarations.

### Changed
- Tests follow the reply texts of knowledge 0966924e (no quotes around a request or a refused value).

## 0.148.0

An application's intent step (its Q35) on the library's data and one call.

### New
- std.decide kind `intent`: reads (points of trouble of a dry reading), covers (content words neither used nor
  explained), slots (typed slots left open), present (things named that are not there), previous (fits the previous
  turn), cost.
- `chooseRewrite(text, rewrites, { read, stop, previous, world, criteria })`: the clause and the host's rewrites
  ([{ text, cost, explains, via }]) read dry by `read` and chosen by kind `intent`; a rewrite wins only when it reads
  strictly better. Returns { chosen, self, changed, order, why }.
- `readTurn` options `rewrites` (an array, or a function per clause that does not run), `previous`, `stop`,
  `intentCriteria` / `intentWorld`, `whole`, and `dry` (read, bind and choose, nothing run: status `planned`). The
  result carries `rewrites`: [{ said, as, via, changed, why, order }].

### Changed
- `clauses`: no cut inside a phrase of `whole` (readTurn adds the schema's words of several words), and a joiner
  before a determiner or a number joins a list of things ("remove the fourth grass and the third water lily" is one
  clause).

## 0.147.0

### New
- `expandRecurrence(rule, start, { from, to, max })`: a repeating event's days (RFC 5545 RRULE: daily / weekly /
  monthly / yearly, interval, weekdays, days of the month, until, count; knowledge Q92).

### Changed
- `readFrames` reads verbs of several words (line up, go back): 459 of 499 frame examples as the reference reader.

## 0.146.0

Knowledge Q87, Q84, Q88: where the library fell short of the knowledge repository's local copies.

### Changed
- `inflectBy`: the singular of a listed singular is itself (bus, iris); rule sets (`set=`, the lemma set by default);
  `exception=` rules over the language's noun exception lists; `unless_is_singular`; is-plural stems (taxi, taxis).
  On the catalog: all 1,356 head nouns read both ways and the hand-over table is all right (was 37 wrong).
- `realise`: plurals of words the dictionary lacks and a / an by the language world (when morphOf had its types);
  `sentence: true` for a capital ("Add an orange house.", "Add 3 mice.").
- `planner.plan(goal, live, { fixed })`: choice points fixed by the host, still checked; `seed: null` gives the first
  solution; a chosen statement row shows by its key, a history entry by its act (no "[object Object]").
- `solveChoices` with `seed: null`: candidates by weight, ties in order.

## 0.145.0

`readFrames` reads the catalog's frames (knowledge Q83, reviewer 18:45); knowledge Q85 kit cases 1-2; pin 68e8c8b
(w.seating 3, w.timeline 3).

### Changed
- `readFrames`: `needs(name)` filters frames by the host's needs classes; `open` lets a host's list take one to three
  words at a cost; `is=lexicon` parts read; fixed values become roles; roles are also given as the act's roles in
  `args` (role maps); a verb with no dictionary sense reads through the world's `k.actions.verb` facts; apostrophes go
  as the language world writes its items. On the 499 frame examples of w.lang.en against the knowledge repository's
  reference reader (`node tools/bench-frames.mjs --all`): the same frame for 456 (was 249 at 0.130), the same act
  and mode for 14.
- The kit: a complete reading wins before a finer one that leaves words unread ("add a table for 4": seats 4); a value
  word is read by its sense and said back in the user's word ("fă masa 1 albastră": colour blue, "Masa este acum
  albastră.").

### New
- tools/bench-frames.mjs.

## 0.144.0

### New
- test/dts-contract.test.mjs (R4, finding 37): every option an exported function destructures is declared in its
  index.d.ts options; `abduce` and `actReply` declarations completed.

## 0.143.0

One failure convention for the acts (R4, findings 25 and 33, first part).

### Changed
- Every std.acts refusal carries `reason.code` and `reason.roles` (no_such, not_allowed, no_key, not_a_number,
  missing_value, which, no_room, no_world_kind, no_world_named, no_kind_in, no_relation, no_aspect, nothing_to_show,
  bad_value) beside its English `why`.
- The kit says a refusal by `refused.<code>` with the roles in the user's language ("A table has no colour."); "remove
  the table" with none says there is none, with several asks which, instead of a library question.

## 0.142.0

Every kit sentence from the language world (reviewer 17:55).

### New
- `KIT_REPLIES`: the 31 reply names `readTurn` and `openSession` can say, with their roles and English defaults. Every
  reply goes through one `speak(name, roles)`: the language world's reply fact of that name, else the default.

### Changed
- Refusals, questions, the timeline, "why" and the session's answers are named replies with roles (no English built
  inside the kit's logic); a kind, a key and a value are said in the user's language when the language world has words.

## 0.141.0

test:full run; the state of the architecture against the 49 findings (reviews/state-of-the-architecture-2026-11-15.md).

### Changed
- `npm test` runs test/ only; the compat suite runs with `npm run test:compat` and in `test:full` (finding 29).
- The kit reads singulars from the language world's rules (`w.lang.en.inflect op=singular`), not a final-s strip (21).
- The relaxed composition retry searches as far as the strict one (44); `fallbackOf` and `subjectOf` are no longer
  module exports (46).
- The lookup budget test does not time the copy-on-write check mode.

## 0.140.0

The rest of the session (Q72, reviewer 17:15 item 1); kinds named in the user's language; knowledge pin f15a1d7.

### New
- `snapshotSet(set)` / `restoreSet(set, data)`, `session.snapshot()` / `session.restore(data)`: worlds, timelines,
  steps across worlds and the open question as data; undo and redo work after a restart.
- `whyTurn(set, result)` and "why?" in a session (a wh of the language world with `asks=reason`): what was asked and how
  each value came (told, default, knowledge).

### Changed
- A kind is said by the language world's own word (`w.lang.ro.word.* core.word text="masă" means=w.seating.table`):
  the seating app needs no host `wordOf`; the plural class comes from the published `w.lang.ro.count` / `w.lang.en.count`.

## 0.139.0

### New
- `inflectBy` reads two irregular pairs of one word in two registers (knowledge Q79): `register` for writing (the
  common one by default), `all: true` for every form (reading).

## 0.138.0

Joins that refuse (reviewer 14:45 a; knowledge KR2); the Romanian bench scored right (14:45 b).

### New
- `core.slot ... by= strict=true`: a value that names no target is refused at once instead of left open.

### Changed
- tools/bench-ro-frames.mjs: verbs of several acts, glosses with no verb apart, plurals by every singular (read 104/161,
  act 91/121, act and thing 82/121).

## 0.137.0

PSys2 Q22 items 1-3 (reviewer 13:15): what the host still kept because of the library.

### New
- `confidentTypo(from, to)`; readers mark each repair `confident`; `readText` is complete after confident typos only,
  listing them in `named`.
- `moodOf` reads the language world's function words (`<lang>.fn`: wish, politeness, filler, hesitation): "I want a red
  circle" and "I'd like 2 tables" are `wish` (a request), "could you add a table" an imperative; "my" and "an a" are
  fragments; `detail: true` gives `{ mood, by }`; a name that is a thing of the world is not a speaker ("Done is red").
- `fitsSlot` returns `code` (empty | fragment | type) and refuses fragments in a slot the typed world has no type for.

### Changed
- The kit stores a list entry as the user wrote it (with its articles).

## 0.136.0

The second application extended to w.seating in English and Romanian (reviewer 16:45 item 2; PSys2 probe B).

### New
- examples/seating-app.mjs and test/seating-app.test.mjs: probe B in English ("add a table called family", "add 2
  tables" + names, "make table 2 square", "remove Ann", "undo"; "add a guest called Ann at table 1" said, not made)
  and in Romanian ("adaugă o masă numită familie" → "Am adăugat o masă.", "șterge masa familie", "anulează").
- `readFrames` option `lexicons` (a host's words for a lexicon the frames take); a verb with several acts reads as each.

### Changed
- The kit binds change frames (a referent and a value of its closed sets), reads a kind's word wherever it stands, binds
  Romanian readings by their senses' English words, names unread words as written, and asks open keys through the
  language world's `ask.key` reply when it has one.

## 0.135.0

The kit, reviewer 14:45 item 5: host readers, several requests per message, referents, a host hook, effects, a budget;
and the one clause splitter (Q71).

### New
- `clauses(world, text, { lang, read })` and `cutPoints(world)`: cuts at a comma, the language world's joiners that cut
  and before a question word; the cutting whose clauses all read, most literal words first (the knowledge
  repository's reference clauseReader, now the library's).
- `readTurn` context: `readers` (host readers under the reader contract, before the frames; `frames: false`),
  `onHost` / `hostActs` (host requests such as navigation, not a world step), `budget: { ms }` (`too-complex`).
- `readTurn` reads several clauses as several requests, one step each, none run unless all read; `effects` for the
  page; `referentOf` reads ordinals ("the second table") and anaphors ("it": the thing the last turn touched).

### Changed
- A frame role that runs over a joiner into a verb ("called three and add a blue table") is not that reading's words.

## 0.134.0

Composed replies in two languages (reviewer 14:45 item 2), issue bindings (knowledge Q78), the indefinite genitive
(PSys2 Q25 L1); knowledge pin 2a3edf3.

### Changed
- `replyFrom(language, key, roles, options)`: by reply name or act, the plural class of `roles.number` (`count=`),
  `{art}` from the language's indefinite article, plurals by the language's rules when the dictionary lacks them.
  The kit's replies (done acts, undo, not understood) come from w.lang.en.reply / w.lang.ro.reply.
- `realise`: an agreeing word takes the number and case the template gives the word it agrees with ("în forma unei
  case"); a cell left partly unsaid is the class's first agreeing cell.
- An issue in `check()` carries its rule's bindings (`bindings`).
- `listSums` takes `tendered` as an option (w.list 4 has no `tendered`: money handed over is a story event).

### New
- `countClass(language, n)`: CLDR plural rules read from `${lang}.count` facts.

## 0.133.0

One World per world, and refusal of what does not load (reviewer 14:45 items 3 and 4; the owner's isolation decision).

### Changed (breaking for the kit)
- `loadWorldSet` loads each world into its own World: `set.worlds.get(name).world`, with `imports` (a world reads the
  worlds it imports, explicitly) and `kinds` (only its own). `set.live` is gone; `set.schema` holds every schema in
  one read-only World for words and slots.
- A turn runs in the world that owns the kind (or holds the thing); `changed` lists `{ world, type }` for every
  world, so a stray change to a second world is seen.
- `turnScope(set, owner)` is a predicate over those changes: the owner and the session worlds the host names
  (`loadWorldSet(..., { session })`).
- The set keeps one timeline across worlds: undo / redo go to the world the last step touched.

### New
- `loadWorldSet` refuses a world that declares no kind of its own, holds wires of types nothing declares, or imports
  in a circle.

## 0.132.0

The kit's readings are trusted (reviewer 14:45 item 1, PSys2 Q24 probe B), and its replies carry no ids.

### Changed
- `readTurn` binds every frame the reader kept, in turn: every role a frame filled lands in a request
  argument or is named as unread (a value role fills the key the language world's template names,
  `attribute=name`; a place is a referent a slot of the kind takes, else "A guest has no place at a table.").
- A required key a make leaves open is asked before anything is made (`asks`, status `ask`); the session's
  answer fills the request and runs it (n things: n values).
- `undo` / `redo` frames step the live world's timeline; an undo with words it cannot use is not understood.
- Replies: the language world's reply fact, else a short sentence with no id, the kind by its word, article
  and plural by the language world ("I made 2 tables.", "I removed the guest.").
- actReply no longer throws on an `ask` result without attributes.

### New
- `referentOf(set, words)`: "table 1", "Ann" → a thing of the set.
- A property test: for every frame example of w.lang.en (441), a done turn used every word its roles filled.

## 0.131.0

The host kit, part 3: the session (reviewer 13:50), and lookups at size (point 5).

### New
- `openSession(set, context)`: the pending question and the slot its answer fills ("make a shape" asks
  "Which colour?", "green" is said not to fit and asked again, "red" fills it); a confirmation answered
  by the language world's yes/no (yes makes the missing list and runs the message again); undo and redo
  by the language world's phrases, through the live world's timeline.
- `replyFrom(language, act, roles, options)`: a reply from the language world's reply facts (default
  `${lang}.reply`; Romanian's `w.lang.ro.template` with its dictionary gives "Am șters casa").
- `readTurn` returns `asks` (required keys the act left open), composes replies from the language
  world when it has them, and says a/an by the language world after a type becomes its word.

### Changed
- Catalog lookups in `make` (std.schema.kinds, std.know.fill, stand-ins, untaught) go through the index:
  40 makes over 20,000 catalog facts 116 → 15 ms (test/lookup-budget.test.mjs).
- `readFrames` reads named phrases through an index built once per contents: a turn of the lists app
  55 → 20 ms.

## 0.130.0

The host kit, first two parts (reviewer 13:50: Q72 approved).

### New
- `loadWorldSet(loader, { names, language, knowledge, bindings })`: an application's worlds in one
  live world, its typed world, the language world as the reader.
- `readTurn(set, text, context)`: read by the language world's frames under the Reader contract,
  bind the frame to a request, choose the world with `arbitrate`, act only on a complete reading;
  replies name the words not understood and say kinds by their words.
- `turnScope(set, owner)`: the types a turn may change; a property test over messages.
- examples/lists-app.mjs: a second application (w.list, w.tasks, a text loop) on the kit alone.

### Changed
- `readFrames` reads a language world without morphology (each word its own lemma, verbs through
  `senses`), and closed words by `form` or `text`.

## 0.129.0

From the reviewer's 13:15 entry, item 4 (PSys2 Q21: the owner's real case "a diagram in the shape
of a house", done host-side with a hull until now).

### New
- `outlineOf(parts)`: the convex hull of parts' boxes, as a path.
- `arrange(nodes, 'path', { points, closed })`: nodes evenly along a path.

## 0.128.0

L2 and L4 of the reviewer's 09:20 block (real turns r0586/r0587, r0610/r0611).

### New
- `cycleOf`, `cycleAdd`, `cycleDiff` over k.time's ordered members; `statedDay` ("today is
  Friday" overrides the host's today); `readClock` / `writeClock` on the 12-hour clock.
- `contrastOf(world, kind)`: the keys where a kind's value is rare among its siblings (std.decide
  kind `contrast`).

## 0.127.0

L5 of the reviewer's 09:20 block (10:55: real turns of PSys2's Profile tab).

### New
- `readStatement` / `tellStatement`: a first-person statement (mood statement) read against a
  person type's keys: numbers, closed sets, lists that grow, values as written; told on the
  user's thing at the host's tier. `describeThing` ("what do you know about me") and
  `readAboutSelf` ("how many kids do I have").

## 0.126.0

L3 of the reviewer's 09:20 block (list acts; real turns r0598, r0599, r0622, r0624, r0625, r0627),
on w.list v3. The knowledge pin moves to b20eeeb.

### New
- `listSums(world, list, { priceOf })`: total (quantity × price), change, short, left, affordable,
  computed and never stored; no total guessed when a price is missing.
- `listMeant(world, { name, sort })`: the list a request means when it names none.

## 0.125.0

R2, sixth part (architecture review finding 14): every choosing sort through `choose`.

### Changed
- `readFrames`, `relatedCases` and `alignWorlds` choose through `choose`, with std.decide kinds
  `frame`, `related` and `alignment` declared as data (docs/decisions.md lists them).

### Removed
- `veto` (the same as `world.veto`, which stays); PSys2 does not call it.

## 0.124.0

R2, fifth part (architecture review finding 10; Q70 answered 11:55): one request pipeline, one
world chooser.

### Changed
- `turn` is `turnFlow` with `TURN_STAGES` (read, dry run, apply, reply; fallback when every
  reading is refused); `turnFlow` takes `stages` (used when the world declares none) and `load`.
- The open tab is no longer a std.decide criterion of the library: `arbitrate` ranks owners by
  coverage, then priority; a host passes its own `criteria` (with `active`) or declares
  `std.decide.criterion of=world` facts.

### Removed
- `route` (the one world chooser is `arbitrate`; std.turn's `route` provider uses its owner, and
  the case corpus' routing steps check `arbitrate`'s owner). PSys2 calls neither.

## 0.123.0

R2, fourth part (architecture review findings 12, 13, 18).

### Changed
- One matcher of the pattern language (`{x}`, `{x:class}`, `{x:base}`, `[a|b]`) in
  src/alternate.mjs, used by the alternations, by relatedCases' wording and by learnt form
  operators (which ignored `[a|b]` and word classes before).
- One kind walker: `kindChain` is `ancestorsOf` grouped by level.
- One edit distance: resolve's one-slip test is `editDistance(a, b, 1) <= 1`.

## 0.122.0

R2, third part: one motion scheduler (architecture review finding 9).

### Removed
- `motionPlan` and its minimal `mo.*` format: the scheduler is `planMotionFacts` over the
  knowledge repository's `k.motion` (PSys2's avatar already calls `readMotion` and
  `planMotionFacts`, never `motionPlan`). `motionRun` stays, in src/motion-facts.mjs.

## 0.121.0

R2, second part: one way per job for typed worlds and role reading (PSys2 does not use the
removed functions: `git grep` on its tree).

### Removed
- `typedWorldOf` (use `typedWorldFor(schema, knowledge, { things })`), `readRolesByTypes` and
  `assignBySlotTypes` (use `readByTypes` with `readText`, whose `complete` is false when a word
  is left, and `fitsSlot` for a slot's type).

### Changed
- `typedWorldFor` names its own wires `typed.<n>`, so a session's thing may be called `t1`.

## 0.120.0

R2, first part (reviewer 10:10, 10:35): one Reader contract.

### New
- `readText(world, text, { reader })` and `READERS` (types, frames, canonical, or a host's
  function): candidates `{ frame, unread, repaired, cost, specificity }` ranked one way; the
  result says `unread`, `repaired`, `mood` and `complete` (no word left, no respelling, a frame
  that fits the mood), with `why` when not.
- `moodOf(world, text)`: question, imperative, statement (a first-person subject, a name and an
  auxiliary), fragment (an article or a letter alone), from the language world's words.

### Changed
- `fitsSlot` refuses an empty value, an article alone and a single letter.

## 0.119.0

The architecture review's serious findings (reviewer 10:10, R1), each with a test
(test/architecture-r1.test.mjs).

### Fixed
- Per-world caches (the typed lexicon, the sense index, narration, names, the interest model,
  the name graph, compose's memo, the morphology of templates) are keyed on `world.version`
  through one `memoPerWorld` (src/memo.mjs): a revised value is read again, not the old one.
- One seeded generator (src/random.mjs, mulberry32) replaces twelve copies; the LCG whose low bits
  collapsed in floating point is gone, so "random" over two values gives both.
- `valueText(v)` (exported, on `str`) replaces about 50 local quote strippers: escaped quotes and
  newlines in values are read right.
- `choose` reads std.decide's own criteria from data (src/decide.mjs), not from a side effect of
  importing std.mjs.
- std.fill's tiers have one home (src/fill-tiers.mjs, with `slip` as a tier); `resolve` reads the
  order from it (user, focus, scene, slip) instead of its own.
- The default ensemble voices are `types` and `canonical`: `exact` was readByTypes again and
  voted twice.

### Changed
- Seeded orders differ from before (the generator changed): relatedCases' sampling,
  composeDiagram's fill order, scatter, choose's ties.

## 0.118.0

From the reviewer's 09:20 entry, L1 (word problems of real turns), and 09:00 (read both Romanian
dictionaries).

### Changed
- `storyState`: the subject is a name, a pronoun, I, or a number ("One flies away"); a clause
  with no subject keeps the last owner; "a"/"an" = 1; a negated event changes nothing; giving
  more than is held is refused with the reason (`refused`); an unknown start solved by a later
  "has" ("ate 2 and now has 3"); comparisons ("3 more than", "twice as many as"); questions of
  how many at first, how many more than, who has the most; `prior` carries a story across
  turns. Real rows it reads: PSys2 r0194, r0195, r0201, r0541-r0543.
- `dictionary({ read })`: `read` may be a list of readers, one dictionary over several sources.
- tools/bench-ro-frames.mjs reads the hand dictionary and the UniMorph-derived one.

## 0.117.0

PSys2 has renamed its uses (reviewer 06:35, Q68): the deprecated names of 0.111.0 go.

### Removed
- `cousins`, `judgeFix`, `liftTokens`, `continueAct`, `variantsOf`, the old `calibrate` (now
  `relatedCases`, `judgeOnRelated`, `delexicalise`, `resolveEllipsis`, `paraphrasesOf`,
  `learnRanking`); `cousinsTest` in tools/generalisation-test.mjs; `degree` / `dims` in
  `generalisationTest` and `tabulate`; the `cousins` option of `learnRules`.

### New
- `calibrate(rows, { method: 'isotonic' | 'platt' })`: a reader's confidence mapped to a
  probability of being right, fit on held-out rows (Platt 1999; Zadrozny and Elkan 2002), with
  the Brier score before and after.

## 0.116.0

From the reviewer's 08:15 entry, item 2 (relative continuations in real turns).

### New
- `resolveEllipsis` reads relative continuations: a direction of `<lang>.lex name=acts.dir`, words
  of more and of a small step (`relative`), a position among the things of the previous thing's
  type (ordinals, first, last, middle), and a negated clause as the one rejected ("not the first
  one, the middle one"); `lang` and `fold` for another language.
- `readFrames`: a role of words is also cut into `items` at commas and at the language's "and".

## 0.115.0

From the reviewer's 08:15 entry (the real work list: Romanian is 77 of PSys2's 190 failing real turns).

### New
- `readFrames(world, text, { lang, morph, dictionary })`: a language read by its language world's
  frames and parts (leads, words, verbs by the act of their lemma's sense, determiners, roles by
  words, numbers, prepositions, lists), through std.morph and the lemma dictionary, into the act
  and roles of the reference language. `senseOf` reads a sense id.
- tools/bench-ro-frames.mjs: PSys2's 161 real Romanian turns glossed by hand, on meaning: read
  by a frame 93 (58 %), right act 74 (46 %), right act and thing 38 (24 %).

## 0.114.0

From the reviewer's 06:55 entry (a host's Q16: runtime worlds are not typed) and the host's
Q17 diagram items.

### New
- `typedWorldFor(schema, knowledge, { things, text, max })`: the typed world a pattern/matrix
  world needs: kinds and keys with their words (keys as declared relations), closed sets, the
  joined knowledge's things, the session's things, a type for every free-text slot. `schemaOf`
  reads a World's schema as the description it takes.
- `fitsSlot(typed, type, key, text)`: whether words fit a slot (a joined thing, a value, a
  number, a name that is not a question, an act or a relation word, a title, a text).
- compat/psys2/typed: a PSys2 legend (kids.animals) made a typed world with k.animals.

### Changed
- `typedLexicon`: a `core.word` for a declared type names that kind; declared relations of
  several types all count as holders; `k.kinds.relation` facts are not content.
- `composeDiagram`: nodes carry their box (`w`, `h`); a topic matches a fill's topic key
  exactly (no word inside a longer value); a fill with no topic key answers only a topic that
  names its type, so `sampleDiagram` no longer names a story element a topic.

The deprecated names of 0.111.0 stay until the host has renamed them.

## 0.113.0

From the knowledge repository's 06:00 items.

### Fixed
- `inflectBy` takes irregulars per op: the singular/plural pairs only for plural and singular,
  each in its direction (`inflectBy('fish', 'past')` is "fished", not "fish"), and
  `w.lang.en.irregular_form lemma= form= vform=|degree=|num=` for the op's cell ("went",
  "better"); forms marked `read_only=yes` or `variant=yes` are never written.

### New
- std.morph: `m.irregular ... read_only=yes`: a form that is analysed but never generated.

The deprecated names of 0.111.0 stay in this release and go in 0.114.0.

## 0.112.0

From the reviewer's 04:40 and 05:45 entries (diagrams composed from knowledge). The knowledge
pin moves to 7c7738f (k.diagrams, w.diagram, arrangement phrases in w.lang.en).

### New
- `composeDiagram(world, { kind, topic })`: a k.diagrams kind × a topic whose knowledge has the
  kind's structure (its fills: edges, order, members, values) → w.diagram wires (nodes with
  role and shape, edges, groups) laid out by the kind's layout with `arrange`; `{ why }` when no
  knowledge fits, never placeholder nodes.
- `sampleDiagram`, `diagramTopics`, `diagramKinds`: random diagrams as kind × topic.
- `arrangementOf(world, text)`: an arrangement request read by `w.lang.en.arrangement` phrases.
- `arrange` gains `radial`, `scatter` and `reverse`.


## 0.111.0

From the reviewer's 05:10 and 05:25 entries (names against the literature).

### Renamed (old names kept as deprecated aliases through 0.113, removed in 0.114.0)
- `cousins(world, case, { degree, dims })` → `relatedCases(world, case, { distance, axes })`;
  results carry `distance` and `axes`. `judgeFix` → `judgeOnRelated` (`byDistance`).
- `tools/cousins-test.mjs` → `tools/generalisation-test.mjs`, `cousinsTest` →
  `generalisationTest` (table keys `distance|axis`, `related` count). `learnRules` option
  `cousins` → `related`. `tabulate` reads `distance` and `axis`.
- `liftTokens` → `delexicalise`, `continueAct` → `resolveEllipsis`, `variantsOf` →
  `paraphrasesOf`, `calibrate` → `learnRanking`. After the alias goes, `calibrate` is kept
  for mapping scores to probabilities.
- src/cousins.mjs → src/related-cases.mjs; tests renamed likewise.

### Docs
- docs/generalisation.md: related cases at a distance along axes, the owner's picture, the
  measure and the literature (metamorphic testing, CheckList, contrast sets).
- docs/literature.md: one line per concept with its established term, reference and how the
  library differs; module headers cite it.
- docs/glossary.md: standard equivalents of SOP Lang's names, and the renames.

## 0.110.0

Ahead of the reviewer's 04:40 entry (diagrams composed from knowledge; `k.diagrams` and
`w.diagram` are not published yet).

### New
- `arrange(nodes, layout, { edges, frame, gap, direction })` lays out many things at once: row,
  column, circle, grid, and layers by edges (cycles cut where they close).

## 0.109.0

From the reviewer's 04:05 entry ([KNOW] Q66, part 2).

### Changed
- In matching generally, a quoted string whose text is an atom (`"Rain"`) and the bare atom
  (`Rain`) are one name: in the index, in patterns (`ask`, rules, denials) and in value
  comparisons. A string with spaces or other non-atom text stays a string. Opaque (blob) keys
  compare exactly.

## 0.108.0

### New
- `realiseFrame(world, frame, roles)` says a text in the shape of a language-world frame, from
  its parts.
- `variantsOf(world)` reads `w.lang.en.variant`: which frames reword which.
- `cousins` takes the language world's rewordings as a wording source: a case with `langFrame`
  and `roles` gets `variant:<alternation>` cousins, each read back to the same frame. On "what
  is the sound of the cow" the published variants give "the cow sound" and "tell me the cow
  sound", both valid.

## 0.107.0

From the reviewer's 04:05 entry ([KNOW] Q66).

### Changed
- A join by a key (`core.slot ... type= by=`) is checked by a lookup in the index per
  (type, key, value) that tell and retract keep, not by a scan of every target wire. On 27,902
  parts joined to 2,211 objects the tell takes 1.05 s (3.10 s before; 1.00 s with no join).
- In a join, a quoted string and a bare atom with the same text are one name.

## 0.106.0

From the reviewer's 03:45 entry ([KNOW] Q63). The knowledge pin moves to 284e15a, which has
`k.attributes.narration` and `w.lang.en.phrasing` (593e141).

### New
- `narrationOf(world)` reads which keys the knowledge narrates, with salience and form.
- `phraseOf(world, fact)` says a fact with the language world's phrasing of its key or form.

### Changed
- `compose` and `clauseOf` leave out keys marked narrate=no.
- `discourseRealiser` says facts with `w.lang.en.phrasing` when the world has it; no
  host-side phrasing is used then.

## 0.105.0

### New
- `readByTypes` types the relations the knowledge declares (`k.kinds.relation type= key=`,
  Q60): a question about one with no value yet is read, with `known: false` and an empty
  answer, instead of not at all.

## 0.104.0

From PSys2's Q15 (reviewer 03:20).

### New
- Completeness: `readByTypes` returns `left` (content words the best frame does not
  consume) and `complete`. `readEnsemble` ranks coverage first (std.decide kind `ensemble`)
  and asks back when the winner is incomplete.
- `arbitrate(world, request, { coverage, active })`: among several owners, coverage of the
  request, then the open tab, then priority (std.decide kind `world`), with `ranked`.
- `continueAct(world, text, previous)`: verbless continuations reuse the previous act with
  new roles, read by type.

### Changed
- std.decide kind `ensemble`: coverage before agreement.

## 0.103.0

The rest of the host's handover (LIB-5 to LIB-8, reviewer 02:50).

### New
- `genreOf`, `topicIndex`, `randomTopics`.
- `typedWorldOf`, `readRolesByTypes`.
- `assignBySlotTypes`.
- `judgeReply`, `tabulate`, `tableText`.

## 0.102.0

PSys2's handover LIB-1 to LIB-4, and its Peru essay report (reviewer 02:50).

### New
- `joinList`, `clauseOf(world, fact)`, `actSentence(world, act, roles)` and
  `renderFrames(frames)`: lists, a fact as a clause, an act's sentence from the act
  templates, and summarizeLog's frames as one sentence, from the language world's facts.

### Changed
- `compose`:
  - claims come from facts about the topic itself first (std.decide kind `fact` gains
    `about_topic`), and relations about the topic are laid out first;
  - frames carry `subject`;
  - when no layout is found within the search, the plainest one is used and said in
    `short`; there is no `{ why }` any more.

## 0.101.0

Clause splitting of run-on, noisy requests (reviewer 02:50: the bottleneck PSys2 measured).

### New
- `splitRunOn(world, text, { openers, splitters, fillers, read, reader, unreadCost })`: the
  cut whose clauses read best (dynamic programming over punctuation, openers and splitters).
  A clause no reader takes is kept apart and reported.
- `tools/bench-runon.mjs`: on PSys2's 500 pairs with a gold reading, whole-sentence reading
  50.2 % → clause by clause 57.2 %.

## 0.100.0

### New
- `patternReader(world, cases, { level, closed })`: a reader learnt from mined patterns (key
  and holder positions per pattern), a voice for `readEnsemble`.

## 0.99.0

Type signatures and a finite pattern inventory (reviewer 02:15, owner 18:10).

### New
- `signatureOf(world, token, { closed })`: three levels, knowledge types first, closed
  words literal, endings for the rest.
- `chunk(world, text)`: adjacent content words as one token with the head's signature.
- `minePatterns(world, sentences, { level })`: patterns with their coverage (80 %, 95 %).
- `tools/bench-patterns.mjs`.

## 0.98.0

Several readers, one confidence (reviewer 02:30, owner 18:18).

### New
- `readEnsemble(world, text, { readers, weights, threshold })`: readers as parallel voices,
  pooled, combined by std.decide (kind `ensemble`), with a confidence; `ask` when below the
  threshold or tied.
- `defaultReaders(read, canonical)`: `types`, `canonical`, `exact`.
- `riskCoverage(rows)`.
- `tools/bench-ensemble.mjs`.

## 0.97.0

Round 27: the agent skills.

### New
- `skills/learn-world-from-examples`, `skills/improve-world-from-failures`,
  `skills/learn-language-rules`, `skills/consolidate` and `skills/audit-knowledge`, with
  expand-and-test-case. Each has a `SKILL.md` and a dry run on real material
  (`scripts/dry-run.mjs`); `skills/README.md` describes the cycle.

### Changed
- `fillersFrom` keeps words only (lifted types such as `<attr>` are left out).

## 0.96.0

Round 28 item 9: the experiment and ablation harnesses.

### New
- `experiment(cells, run, { config, name, judge, stage })`: cells with expectations → ledger
  rows.
- `ablation(cells, run, configs, { baseline, signals })`: configurations × sets → a table,
  what each configuration buys against the baseline, and failures grouped by cause.

## 0.95.0

### New
- `calibrate(world, kind, cases, { heldOut })`: the order of a choice kind's criteria learnt
  from cases, proposed as std.decide facts, admitted only when held-out cases do not drop
  (reviewer 01:00 item 2).

## 0.94.0

### Changed
- `world.score` ranks readings by `RANKING`'s measures in the order std.decide declares
  (kind `score`), or the world does (`rankingOf(world)`).
- `parseText` orders parses through `choose` (kind `parse`: priority, literal words, size,
  depth); ties keep a stable order.
- `choose(..., { seed: null })` keeps the given order on ties.

## 0.93.0

Three more choice points through `choose` (docs/decisions.md).

### Changed
- `readByTypes` frames: kind `reading` (words left unread, the cost of near words,
  specificity, the score as prior). The cost of near words is counted again; it had been
  lost in 0.83.
- `normalise` rules: kind `rule` (specificity, then the order told). `byRule: 'order'`
  keeps the order alone. The 35 published test sentences are unchanged.
- `compose` facts: kind `fact` (unsaid, interest).

## 0.92.0

One way to choose (reviewer 01:00, owner 17:16).

### New
- `std.decide`: criteria per choice kind as data (`std.decide.criterion of= n= name= measure=
  dir=`) for `reading`, `template`, `word`, `rule` and `fact`, in one order: hard
  constraints, coverage, assumptions' cost, specificity, priors, seed.
- `choose(world, kind, candidates, { criteria, seed })`: the world's criteria for the kind,
  else std.decide's own; every loss explained.
- `docs/decisions.md`: the map of every choice point, its candidates, its criteria and
  whether it already goes through `choose`.

### Changed
- `discourseRealiser` picks templates through `choose` (kind `template`: all slots filled,
  not said before, the more specific, then seeded). It drew among the fresh ones before.
- `readByTypes` picks a near word through `choose` (kind `word`: fits, cost, prior).

## 0.91.0

The inverse of the form operators at read time (reviewer 00:40) and Q58 of the knowledge
repository. The knowledge repository is pinned at 2f54678 (alternations, k.kinds up edges,
act families).

### New
- `canonicalise(world, text, { fillers, splitters })`: clauses split, fillers dropped,
  each clause normalised.
- `readCanonical(world, text, { read, ... })`: the same, then each clause read by types.
- `fillersFrom(edits)`: the filler words of learnt edits.
- `wordClassesOf(world)`: word classes for patterns (`{q:wh}`).

### Changed
- `normalise`:
  - tries the rules in the order told (`n`);
  - the innermost rule's mode wins ("can you tell me where …" is a question);
  - patterns may name a word class.
  - On the published w.lang.en, 35 of 35 test sentences give the right canonical text,
    rules and mode.
- `alternationsOf` returns `n` and `family`, sorted by `n`.

## 0.90.0

PSys2's first real runs (reviewer 00:05 items 2 and 3).

### Changed
- `learnRules`:
  - the filler is the thing's name, not its id, so the word, the fact name and the holder
    are one variable;
  - a rule is judged on its own training cases first and refused there if one fails.
- `compose` by a genre:
  - no sentence twice in a document;
  - a counterargument or rebuttal only with a real contrast (a fact that differs from its
    siblings), else the move is left out and said;
  - keys in `quiet` (and those marked `k.attributes.key narrate=no`) are never narrated.

## 0.89.0

Typed form operators (reviewer 00:05 item 1: content words stayed constants).

### New
- `liftTokens(world, text)`: content words lifted to their types (a thing to `<type>`,
  `<kind>`, `<attr>`, `<num>`); function words stay.
- `{ world }` on `formOperator`, `learnFormOperators`, `formEdits` and `learnFormEdits`:
  the alignment runs on the lifted words.

### Changed
- A held-out pair passes when one of the operator's readings gives its canonical sentence.

### Measured
On PSys2's pairs, typed by k.animals and a few names and items: whole-pair operators 179
→ 84 (80 % of the pairs by 28), held-out applications passing 140/1992 → 224/2253; atomic
operators 350 → 165, 80 % of the edits by 14, every edit of 80 % of the pairs by 21.

## 0.88.0

### New
- `tools/cousins-test.mjs` judges every clause of a compound text (reviewer 23:05 item 4):
  with `split(text)` and `oracle(clause)`, the host's answer must hold every clause's
  answer, so a host that answers one half fails.

## 0.87.0

### New
- `familyOf(edit)` and `learnFormEdits(...).families`: an edit's family by its shape alone
  (filler, extra clause, insertion, deletion, inflection, substitution). On PSys2's 565
  same-meaning pairs: extra clause 545, substitution 451, filler 301, insertion 164,
  deletion 81, inflection 14.

## 0.86.0

Form operators measured on PSys2's aligned pairs (reviewer 23:45).

### New
- `formEdits(canonical, variant)`: a pair split into atomic edits (an alignment of the
  words; each hunk where they differ).
- `learnFormEdits(pairs)`: the edits clustered, with their coverage of the edits and of
  the pairs.
- `tools/bench-form-pairs.mjs`: both learners on psys2's `training/eval/form-pairs.jsonl`,
  read in place.

## 0.85.0

Test speed (reviewer 23:45, owner 16:35).

### Changed
- `npm test` = build, then one run on the sources: the gate per release.
- `npm run test:full` = the three runs (sources, the built file, copy-on-write checks):
  every 5th release, or when the build or the copy-on-write code changes.
- `npm run test:slow` (`tools/slowest-tests.mjs`): the 10 slowest tests with their
  seconds; it fails when one takes over 10 s.

## 0.84.0

Form siblings: learn the operators, not the cases (reviewer 23:20, owner 16:12).

### New
- `formOperator(canonical, variant)`: the operator of an aligned pair, in the alternation
  format.
- `learnFormOperators(pairs, { heldOut })`: operators clustered, checked on held-out pairs,
  with the inventory's coverage (how many cover 80 % and 95 %).
- `cousins(..., { operators, senses })`: form cousins tagged per operator (`form:<name>`),
  and `form:synonym` through word senses.

### Changed
- The `wording` cousins are tagged `form:<operator>` (they were `wording`).
- Span names in alternation rules may have digits (`{x1}`).

## 0.83.0

What PSys2's first cousins tables asked for (reviewer 23:05).

### New
- Cousins along the **wording**: the same frame in other constructions, from the language
  world's alternation rules run backwards (`cousins(..., { alternations })`, dimension
  `wording`).
- `readByTypes` act frames: the kind to make, the thing to act on, and values of a closed
  set by their key. Act sentences were read as a one-word `find`.

### Changed
- `ancestorsOf` and `kindChain` index the facts by name once per change; they scanned
  every wire per thing.
- `cousins`' default dimensions are filler, key and wording (wording gives nothing without
  `alternations`).

## 0.82.0

std.plan reads choice points (reviewer 21:55, Q57 of the knowledge repository): one
solver, so tools/lib/choose.mjs there can be deleted.

### New
- Bindings with `choose=` / `choose_min=` are solved jointly before a method's steps
  (`solveChoices`), and the plan lists them in `chosen`.
- Matches gain `n=` (several per key), `differs=` (another binding, or the binding itself)
  and `soft=true` (a weight only).
- Bindings gain `about=` (the statements about a thing, for the types in the planner's
  `about` option).
- `planner(store, { about, seed, chooseLimit })`.

### Changed
- A binding's matches hold on every source, `together` included (they held only on `from`
  and `live`).
- A fact is shown by its name, else its scene, else its thing.

## 0.81.0

Plurals and articles from the language world (reviewer 22:30, [KNOW] Q54 of the knowledge
repository). The knowledge repository is pinned at fa8a629.

### New
- `inflectBy(world, word, op, { types, vowels })`: ordered suffix rules and irregular forms
  from facts (w.lang.en's by default).
- `articleFor(world, word, { types, vowels })`: the determiner by the sound the word begins
  with (onset facts, else its first letter).
- `discourseRealiser` uses both when the language world has them: `{x:num=pl}` gives the
  plural, and a/an follows the next word.

## 0.80.0

Cousins along the layered graph, the automatic tester and the skill (reviewer 21:55,
22:30).

### New
- `ancestorsOf(world, id, { depth, edges })`: several parents on several dimensions (`edges`
  names them), walked breadth first.
- `cousins(..., { edges })`: each cousin is tagged with the dimension it came by,
  deduplicated by frame, and stratified per degree and dimension.
- `tools/cousins-test.mjs`: one example and a host give a table per degree × dimension and
  the pattern of breaks named; `node tools/cousins-test.mjs` is a dry run.
- `skills/expand-and-test-case/SKILL.md` and `skills/README.md` (Round 27): expand, test,
  then force a rule with `learnRules`.

### Changed
- `cousins`' filler dimension is named by the edge it came by (`kind`, `type`, or the
  host's), no longer `filler`. The option `dims: ['filler', 'key']` still selects it.

## 0.79.0

PSys2's decisions from the reviewer's 21:00 list.

### New
- `summarizeLog(entries, { failed: 'separate' })`: what failed is a list of its own
  (`result.failed`).
- `compose` is memoised by topic, genre, size and seed until the world changes, and
  deterministic by seed. `memo: false` computes it again.
- `std.schema.kind ... needs=text` (any need): `sample` does not draw a make it cannot
  fill. `sample(world, { fillers: { text: (kind, rand) => ... } })` fills it.

## 0.78.0

Abstraction round, item 6 (questions.md Q54; reviewer 18:20 item 1): a story then a
question.

### New
- `storyState(text, { verbs, numbers, pronouns, question, all, skip })`:
  - the quantities owners hold follow the story, with verb effects as data (set, add,
    remove, give);
  - pronouns keep the last owner in focus;
  - the question is answered from that state, for one owner or for all together;
  - sentences it cannot read are listed.

## 0.77.0

Abstraction round, item 5 (questions.md Q54): transfer by analogy between worlds.

### New
- `alignWorlds(a, b, { min })`: two schemas aligned by structure. Types are paired by
  their slots and references, and slots by signature. Defaults, choices and required slots
  the other world lacks are offered with the map, not told.

## 0.76.0

Abstraction round, item 4 (questions.md Q54): induction from cases.

### New
- `learnRules(world, cases, { heldOut, cousins, admit, min })`:
  - cases sharing a frame are anti-unified by `induce` into a reading rule, the filler
    lifted to its kind;
  - each rule is judged on a fork, on its training cases, held-out cases and cousins;
  - it is admitted only when all its training cases pass and the held-out share holds.

## 0.75.0

Abstraction round, item 2 (questions.md Q54): alternations as general rules, written once.

### New
- `normalise(world, text, { rules, type, lemma, max })` and `alternationsOf(world)`: the
  language world's alternation rules (`w.lang.en.alternation name= from= to= mode=`)
  bring a variant back to its canonical form, and the result names the rules applied.
- `parseText(..., { alternations })` normalises first; the parses carry `applied`,
  `normalised` and `mode`.

## 0.74.0

Abstraction round, item 3 (questions.md Q54): lexical generalisation at read time.

### New
- `nearWords(world, word, { senses })`: near words through `k.words.sense` (synonyms cost
  1, the nearest kind 2, further kinds 3 or more).
- `readByTypes(..., { senses, near })`: an unknown word is read as its nearest known word
  within the cost bound; the result lists it in `near`, and the cost lowers the score.

### Changed
- `typedLexicon` leaves out the language's own facts (k.words, w.lang, k.genres,
  k.interest).

## 0.73.0

Cousins of a case (reviewer 21:35, owner 14:58: abstraction round, item 0).

### New
- `cousins(world, case, { degree, dims, known, read, n, seed })`:
  - up the chain of kinds (or along the holder's keys), then down to other members;
  - each cousin tagged with its degree and the dimensions changed;
  - valid only when it has an answer, reads back to the same frame and is not known.
- `kindChain(world, id)`.
- `judgeFix(answer, case, cousins)`: a fix judged on the case and on its cousins by degree.

## 0.72.0

Abstraction round, item 1 (reviewer 21:00; design note in questions.md Q54): type-driven
reading.

### New
- `readByTypes(world, text, { question, skip, lemma })`: content words typed through the
  world's own facts (thing, kind, attribute, value, act, known word). The frames are `ask`
  (a key of a thing or kind), `find` (holders with key=value) and `act` (arguments by
  type). Word order only ranks, and unread words are listed.
- `typedLexicon(world)`.

## 0.71.0

The composition pins (reviewer 20:45): the knowledge repository at 179fc1c, with w.lang.en's
discourse and act templates and the typical ranges of k.attributes.

### New
- `discourseRealiser(world, { seed, clause, np, inflect, fill })` and
  `discourseTemplates(world)`. A template is picked by move and register when all its slots
  fill. A story sentence tells its own element and only elements told before. No sentence
  is used twice while another fits. The template is recorded on the frame.
- `compose` realises through the templates when the world holds them. Sentences with no
  fitting template are listed in `short`. `writeDocument` keeps each sentence's
  `template`.

### Changed
- `summarizeText(text, { words })` never goes over the budget: a sentence that crosses it
  is skipped, and a shorter one may fit (reviewer 20:45). BillSum, held-out half, 180
  words: R-1 F1 0.399 against lead's 0.393, R-2 F1 0.161 against 0.171, 172 words on
  average.
- `compose` by a genre prunes more repeats than there are relations to fill them, and its
  search limit is 100,000 nodes.

## 0.70.0

Q49 (reviewer 19:20): a `by=` join stays open per value, not per type.

### Changed
- A join by a key stays open until a target with that value is told, so lazy loading may
  tell shards in any order. Before, it was refused once any target of the type existed.
  A tell lists the joins it left open (`openJoins`), and `check()` reports them as
  `open-join` issues, with `type` and `value`.
  Migration: to keep the old refusal, declare the target type complete with
  `world.closeType(type)`, or run `check(undefined, { strict: true })`.

### New
- `world.closeType(type)`, kept by forks.
- `check(undefined, { strict: true })`.

## 0.69.0

A composition written as the published `w.document` world schema (reviewer 20:05 item 1).

### New
- `writeDocument(world, composition, { title, language, realise, slides, facts })`:
  - slides when the genre's unit is slide, else chapters with paragraphs;
  - sentences with their move and the wires they state, written through std.acts;
  - `refused` lists what the schema did not accept.
- `readDocument(world, id)`: the document read back in order, with the sources of each
  sentence.
- `compose` results by a genre carry their `seed`.

## 0.68.0

Stories planned from the published `k.story` (reviewer 20:05 item 1). The knowledge
repository is pinned at ff0c58f.

### New
- `readStory(world)` and `storyPlan(kb, { seed, soft, fixed, relations, limit })`:
  - k.story's elements are choice points solved jointly; hard constraints prune and soft
    ones weight the draw;
  - attempts are made in order, each different;
  - `STORY_RELATIONS` gives the meaning of each relation over the catalog's facts.
- `compose(world, topic, { genre: 'story' })` tells the story moves from a plan, with the
  topic as the hero when it can be; `story` option: the host's own plan.
- tools/worlds.mjs `catalogWorld({ world: [types] })`: every schema, and only the facts
  of the types named.

### Changed
- `compose` without a genre keeps its toy default size; with a genre, a size is only what
  the host gives.

## 0.67.0

std.compose on the published `k.genres` (366975e), with choice points solved jointly
(reviewer 20:05 item 1, 15:15 item 1). The knowledge repository is pinned at 3a0f522.

### New
- `solveChoices(vars, { domain, ok, weight, seed, limit })` (std.plan): depth-first with
  backtracking; a seeded weighted draw orders the candidates; bounded; `why` and `deepest`
  when there is no solution.
- `compose(world, topic, { genre })` with a `k.genres` genre:
  - parts in order with their repeats; steps with alternatives; sentences per step;
  - the tense and the register;
  - repeats, relations and alternative moves solved jointly;
  - summaries restate the claims;
  - `size.sentences` as a budget; `short` says what was missing.
  The result has `parts` (the toy path keeps `chapters`).

## 0.66.0

Measured on BillSum (reviewer 19:00): `tools/bench-billsum.mjs`, read in place from psys2.

### Changed
- `summarizeText` splits sentences only before a capital, a quote or a parenthesis, and not
  after an abbreviation ("Sec. 219", "U.S.C.", "Stat. 4835"). Legal text was being cut into
  fragments.

### New
- `summarizeText(text, { words })`: a length budget in words instead of a sentence count.

## 0.65.0

Interest by the published `k.interest` (knowledge repository f7d2790, now pinned; reviewer 17:10).

### Changed
- `interestOf(world, fact, options)` follows `k.interest`'s arithmetic: each feature adds
  weight × share (by its shape) to its appraisal; the score is novelty × coping ×
  relevance − penalty. It returns `{ score, value, by, measured }`, and `why` without a model.
  Migration: the 0.64 features `number`, `link`, `distance`, `rare` and `new` and the
  options `topicType` and `used` are gone. Load `k.interest` and pass `topic` and `said`.
- `compose` scores by it, never repeats a fact (penalty 1), and accepts `measures(fact)`
  for the measures the host computes.

### New
- `measuresOf(world, fact, state)`: the measures computed from facts (world and topic
  distance, sibling contrast, range distance, sibling rank, number with unit, animacy,
  obviousness, said before, same move run, items without point).
- `shapeShare`, `interestModel`.

## 0.64.0

std.compose, first version (reviewer 14:45 B, 15:00), on a toy catalog in the formats
proposed in questions.md Q41.

### New
- `compose(world, topic, { genre, size, seed, realise })`:
  - the genre's moves; an outline from the topic's relations, those that can fill a
    chapter first, then by interest;
  - every sentence cites its wire, and no fact is used twice;
  - the size is a budget, and `short` says what the knowledge lacked.
- `interestOf(world, fact, ...)`: the features number, link, distance, rare and new, with
  weights from `k.interest.feature`, each score explained.

## 0.63.0

The knowledge repository's Q51–Q53 on the first `w.lang.ro` draft.

### Fixed
- `analyse` finds forms typed without diacritics: the suffix index is keyed by folded
  suffixes (Q51).
- `analyse` no longer always undoes an alternation. It tries every stem the alternation
  list could have come from (unchanged, each place of the target, each place of a deleted
  letter) and keeps those that regenerate the form (Q52).
- `dictionary` looks lemmas up in maps, about five times faster on the w.lang.ro round
  trip.

### Tests
- `test/lang-ro.test.mjs` reads the published `w.lang.ro`. Its round trip holds for 2,904
  of 2,904 cells, in exact spelling and typed without diacritics, and its reply templates
  agree in gender.

## 0.62.0

Round 28 item 8: single placement and relation kinds.

### New
- `placeFor(world, { w, h }, at, { frame, gap, except })` gives the spot for one thing:
  left_of, right_of, above, below, near (the first free side), on, in; in a region
  (`std.schema.region`); or a default spot. It avoids overlaps and says when it cannot.
- `boxesOf(world)`.
- `std.schema.relation name= kind=spatial|containment|flow inverse=?` and
  `relationsOf(world, kind)`. `connect rel=` refuses an undeclared relation when some are
  declared.

## 0.61.0

Reviewer 14:45 A: `std.summarize`.

### New
- `actsOf(world)`: the acts of a world's history.
- `summarizeLog(entries, { parentOf, length })` gives frames: aggregated by act and kind,
  siblings generalised up the chain of kinds, failures kept, ordered by salience.
- `summarizeText(text, { n, stop, redundancy })`: extractive (centrality, information,
  position, no repetition).
- `overlap(summary, reference)`: unigram recall.

## 0.60.0

Q48 (the knowledge repository): deferred join checks.

### Changed (migration)
- A `type=T by=<key>` join stays open while no `T` fact has the key. Before, it was
  checked as soon as a world declared `T`, which refused a lazy load that tells the
  referring facts first. It is refused when the statement making the reference finds the
  targets loaded without that value. Telling target facts no longer refuses references
  made before them: those still open are listed by `world.check()` as `open-join` issues.
  A host that relied on the refusal at load time reads `check().issues` instead.

## 0.59.0

Reviewer 14:15 (owner): `std.sample`, random but relevant commands.

### New
- `sample(world, { seed, n, mode, prefer, seen, realise, read })` gives frames legal in
  the current state.
  - The acts per kind, the slot values (enum, range, joins), the catalog kinds, the things
    there and undo when there is a step.
  - Weights: prefer, recency, novelty and chance. It is seeded.
  - Every frame works on a dry run; a round-trip filter applies with the host's realiser
    and reader.
  - Modes: one, few, actions.
- `diversity(frames)`.

## 0.58.0

Round 28 item 7: form checks, and frame priority by rule.

### New
- `grammarCheck(world, { lemma, maxWords })` reports an optional part that shares words
  with the next, lexicon words lemmatised away, and entries too long.
- Grammar rules take `priority`. Parses are ranked by priority, then by the literal words
  they matched, then by size (before: size only). With no priorities declared, a more
  specific frame now wins over a generic one with the same nodes.

## 0.57.0

Round 28 item 6: the grammar and `resolve` read what every host needed.

### New
- `resolve` gives a `failure` class (unknown-word, unread, unknown-kind, none, no-number,
  no-focus, ambiguous) and the option `focusFor: 'pronoun'`. It reads a negation lead
  (`cats.neg`) as the complement within the kind, and a bare name as one thing.
- `nounPhrase` folds a relative clause after the noun into the modifiers. When a rule
  names the phrase as its head, the base is the child of the same category wherever it is
  (`NEG NP`). It marks `negated`.
- Coordinating words are read from `text=` as well as `word=`.

## 0.56.0

Reviewer 12:45: one motion format. The knowledge repository's `k.motion` is read by the
library.

### New
- `readMotion(world, { prefix, style })` and `planMotionFacts(motion, { events, seed, end,
  base, features, aliases, splitters, keys })` cover the whole format: layers and
  priorities, during / not_during, until, emits, conditions on fields and features,
  onset / hold / back, hold_until, with, via, and splitters with letter classes as facts.
- `splitText(splitter, text)`.
- On 12 plans the library gives the same result as the knowledge repository's oracle,
  which can now be deleted. `mo.*` stays as the minimal form.

### Changed
- repos.pin is at the knowledge commit 29d27e8, which has k.motion and k.procedures.

## 0.55.0

Round 29: `std.plan`, goals reached by methods that are knowledge.

### New
- `factStore(worlds)`, `planner(store, { chain, prefix, roles })`, `PlanLive`,
  `readMethods` and `PLAN_LIMITS` read the published `k.procedures` (the Q44 format).
  - Alternatives are chosen by fit, world, preconditions, rank and name.
  - Decomposition goes to depth 3, never into the same method, with at most 200 acts.
  - Roles come from the goal, earlier steps, the live world, history and knowledge, with
    the chain of kinds.
  - Each step explains itself in one short line (`explain`).
  - The result also gives `requests`, `asks`, and `refused` with the alternatives tried.
- An integration test runs the knowledge repository's expected act lists (swing, family
  photo, set a table, take apart, build from parts, chart, report, face of a role,
  feeling, map, asks), read in place. A toy method runs offline.

## 0.54.0

Reviewer 10:50: `std.motion`, states over time from rules (the face animates by rules).

### New
- Rules as facts: `mo.base`, `mo.rule` (an event with conditions, or an idle repeat;
  priority; ease back), `mo.step` (a key, a value, a duration range; `per=unit` of a
  stream) and `mo.class` (unit → state).
- `motionPlan(world, events, { seed, until, splitters })` is pure and seeded, with
  priorities and cancel on a new event. The unit splitter is a parameter of the rule.
- `motionRun(plan, apply, clock)` plays the plan through the host's clock, with cancel.

## 0.53.0

Q37.1: Romanian-like stems change in two places at once.

### New
- `std.morph` alternations can be anchored (`@vowel`: the stem's last vowel, from `m.vowel
  text=`; `@end`: the stem end). A cell can give its own ordered list (`alt=a>o@vowel
  alt=t>s@end`). Analysis undoes them in the reverse order.

## 0.52.0

Round 30, first part: `std.morph`, compact morphology for language worlds.

### New
- A language world declares the following, for any language:
  - paradigm classes (`m.class name= parent= drop= alt=`);
  - cells (`m.ending class= suffix= <features>`);
  - irregulars, spelling folds, clitic joiners and realisation templates.
- `morphOf`, `generate`, `analyse` (a suffix index, each reading checked by generating it
  again, no form lists), `fold`, `splitClitics`.
- `dictionary` (the external lexicon: one row per lemma, prefix-split, lazy).
- `realise` and `templateFor` (templates with agreement through unification).
- Tests on an invented language: the round trip holds for every class and cell (16).

## 0.51.0

Reviewer 09:55: the knowledge repository published `w.face`, `w.map`, `w.seating` 2 and
`w.timeline` 2 (commit 2b5505e), and asked two questions.

### Changed
- repos.pin points at 2b5505e. The face and map cases read the published `w.face` and
  `w.map`, so their inline copies are gone. The 5 seating cases and 1 timeline case dropped
  in 0.41 are back, now that the published worlds allow them. The corpus is at 61 again,
  all passing.
- `copy` keeps every value except references to other things of the live world (a copied
  guest has no seat). These are listed in `result.unset`; a slot with `copy=keep` keeps
  its reference.

### New
- `core.slot ... type=T by=<key> match=<own>:<target>` (rep.): a join by a composite key.

## 0.50.0

Reviewer 08:45 (the knowledge repository's Q42): the tier of a derived value survives a
merge.

### New
- A told fact marked `derived=true` with `core.source="rule <id>"` (what a knowledge world
  ships for its rules' results) has its values at the tier `derived`, value by value; its
  identity keys stay told. Merged with a told fact of the same identity, in either order,
  each value keeps its own tier. `why` gives `how: 'rule'`, the rule's id, and
  `shipped: true`.

## 0.49.0

Round 28 item 5: what every host's knowledge reader needed.

### New
- `bundleThenRead(bundle, read)`: a bundled subset first, then the catalog, with
  `reachable()`.
- `listOf(world, type, slot, value)`: the loaded facts of a type.
- `std.schema.world ... bundle=<name>` and `loadBundles(world, bundles)`: a world-level
  bundle, told once.

### Fixed
- A catalog finds a word form its vocabulary lacks through a loaded `core.word` (`ants`
  means `ant`), and looks each word up once. A schema shard whose id is its own path is
  read once (now tested).

## 0.48.0

Round 28 item 4: the undo contract.

### New
- `world.act(request, { message })`: requests tagged with the same message are one undo
  (and redo) step together, across several calls and sentences. Without a tag, one
  request or one sentence is one step, as before.

## 0.47.0

Round 28 item 3: `std.dialogue`.

### New
- `core.use world=std.dialogue`: the host's cue phrases (`std.dialogue.cue kind= text=`)
  and modal worlds (`std.dialogue.modal world= active=`).
- `dialogueTurn(world, text, { cues, acts, last, asked })` gives the kind of one turn:
  why, correction, continuation, list, ellipsis, answer or request. It names the act it
  carries over, the text after the cue, and the modal world that sees the turn first.
- `focusLog(world, dialogue)`: what each turn mentions, in order.
- `register('context', name, fn)`: the host's context hooks (session facts, ...). They
  are copied on fork, and one test covers every hook kind a fork must copy.

## 0.46.0

Round 28 item 2: one segmenter that knows the act forms.

### New
- `segment(world, text, { types, acts })` cuts a message into clauses, one act each:
  - a joiner cuts only where an act word follows it;
  - lists and coordinations stay whole;
  - a run of joiners is one;
  - a comma after a frame lead never cuts.
  The joiners and frame leads are a language world's facts (it reads the published
  `w.lang.en` clause facts).
- `actWords(world, extra)`: the action names, the `core.word` texts that mean one, and
  the host's.

## 0.45.0

Round 28 item 1 (from PSys2's lessons): the arbitration contract.

### New
- `arbitrate(world, request, { pass, resolves, words })` gives one verdict per declared
  world: `own`, `decline` or `refuse`.
  - The decline rule is the library's: a world with no use for the kind declines the verb.
  - A refusal is given only in the exact pass; a variant pass never refuses.
  - The `resolves` hook breaks a tie between owners.
  - The verdict is returned as data, so no wrapper can erase it.
- `nounPhrase` reads a quantifier from a category the grammar names (`cats.quant`, such as
  `QALL`), not only from a literal word (PSys2's lesson 25).

### Changed
- The grammar integration tests read the published `w.lang.en` (knowledge repository, at
  its commit in repos.pin) with its schema, instead of PSys2's hand-over, which PSys2 has
  deleted.

## 0.44.0

Docs (reviewer 07:25, A and C). No change in `src/`.

### Docs
- `docs/kinds-of-worlds.md`: what a world schema, a knowledge world and a live world may
  each contain, which module serves which, and where code lives (three examples). It has a
  run-time diagram and four runnable examples. Linked from README, the glossary,
  capabilities, quickstart and the host contract.
- capabilities.md is complete: six new jobs (resolve, filling any key from a catalog,
  typed needs, acts on a view, ask over relations, several knowledge repositories) and a
  "Building blocks" table for the remaining exports. 25 jobs.
- A test fails when an export of the library has no entry in capabilities or the
  reference.

## 0.43.0

Reviewer 07:15 (there will be several knowledge repositories) and 06:55 (answers).

### New
- `createCatalogs([{ name, index, vocab, read }], { lemma })` reads several catalogs at
  once, in an order of precedence (first wins). Each fact keeps its catalog in its source.
  A thing two catalogs define differently, by id or by type and name, is reported in
  `conflicts` and the first version stays. It has `into` and `intoSync`.
- `createCatalog(...).textSync(path)`.

### Changed
- `repos.pin` replaces `worlds.pin` and `psys2.pin`: one line per repository (name, kind,
  URL, commit). Knowledge repositories are listed in order of precedence.
  `tools/worlds.mjs` adds `knowledgeDirs()`. A checkout given by environment is now
  `$<NAME>_DIR` (for example `$SOP_KNOWLEDGE_WORLDS_DIR`).

### Docs
- `std.schema.effect` is a world's own effect of one act on one kind too. No `on.<act>`
  is added (Q30).

## 0.42.0

Docs only (reviewer 06:00, the owner's question): one name for each kind of world.

### Docs
- glossary.md, "The three kinds of worlds": **world schema**, **knowledge world** and
  **live world**, with examples, where each lives, how they relate (a live world = world
  schemas + the knowledge worlds it reads + session state), views and library modules,
  which kind each part of the API works on, and the old words they replace.
- README, capabilities (each job says which kind it works on), quickstart, host contract
  and modules use the names. "Grammar world" is now "a grammar, a knowledge world about
  a language".

## 0.41.0

The reviewer's 04:40 rule: the library holds no particular worlds. No change in `src/`.

### Changed
- `tools/worlds.mjs` reads sop-knowledge-worlds at the commit in `worlds.pin`, and PSys2
  at the commit in `psys2.pin`. Each is a checkout in `.cache/`, fetched on first use; the
  tests that need one are skipped offline.
- The case corpus names published worlds (`"world": "w.seating"`) or carries its own few
  wires (`"wires"`). `cases/schemas/` is gone, and the corpus goes from 61 to 55 cases
  (questions.md Q35).
- `test/knowledge.test.mjs` and `bench/load.mjs` read the published worlds and their
  index. `bench/fixtures/knowledge/` is gone.
- `compat/psys2/` reads PSys2's worlds at the pinned commit. Its copies of worlds and
  specs are gone; the pilot output is unchanged.
- Examples: the knowledge facts in them are marked as invented examples.

## 0.40.0

Reviewer 03:30: section 8 of PSys2's std-grammar.md, one noun-phrase reading over the
facts, its semantics in `resolve`.

### New
- A choice (a coordinating word marked `kind=choice`) is asked: `ask: true` and `which`.
- A part without its noun borrows one ("tables 1 and 2", "the red or the blue house").
- `nounPhrase` distributes a coordination inside a phrase. It does not do so inside a PP.
  The coordination node carries `conj`.
- A part of a set ("two of the tables") gives the whole set when the count covers it, and
  is asked otherwise.
- "The other one": a modifier mapped to `std.other` keeps what is not in focus.
- A pronoun's answer carries `guess`.

## 0.39.0

Reviewer 03:10 item 2: typed needs.

### New
- `std.schema.needs of=<world or view> type= from=?`: what must be loaded before acting
  there. Such an act is refused with `reason.needs` while no wire of the type exists.
- `needsOf(world, { world?, view? })` lists the needs and whether each is loaded.
- `turn(world, readings, { load })` calls `load(need, world)` for each unmet need, runs
  the dry run again and says what it `loaded`. `std.know.fill` then finds the catalog
  loaded.

## 0.38.0

Reviewer 03:10 item 3: `ask` over any attribute and any relation, of a schema or a
knowledge world, with the shape of the answer.

### New
- `ask thing= attr=` gives a `shape`: `number` (with `unit`, from `68000000people`),
  `value`, `list` or `none`. A knowledge fact is found by its `name`, and its source comes
  with the answer.
- `ask thing= rel= of=` answers `yes/no`, either way round (France lists Spain, or Spain
  lists France). `ask thing= rel=` without `of` gives the list.
- `ask kind= rel= of=` ("which countries border France"), `ask kind= attr= value=`, and
  `count=true` ("how many").

## 0.37.0

Reviewer 03:10 item 1, from a map pilot: acts on the view itself.

### New
- `std.schema.view ... state=<type>`: the view's own attributes (zoom, the layer shown)
  live on one thing of that kind, made on first use with its defaults at the tier
  `default`. `change` and `ask` take the view's name as the thing, or no thing when only
  that view's state has the attribute ("zoom in").

### Changed
- `change` and `ask` no longer require `thing` in their action declaration. Without one
  and with no view that fits, they refuse ("change what? (colour)").

## 0.36.0

The two defects the knowledge repository saw on 0.26.0 (reviewer 02:45). Both are now in
the case corpus (37 cases).

### Fixed
- `make` without a `required` attribute already left an open question, but did not say
  so. Its result now lists `asks` (`key`, and the slot's `ask`).
- `undo` right after `remove` gives the thing back. This was already so since 0.26
  (retractions are logged statements, each act is one undo step). The case now guards it.

## 0.35.0

### New
- `std.know.fill from=<type> match=<key> key=<key> ...`: knowledge fills any key from any
  catalog when `make` leaves it out. It uses tier `knowledge` and the fact's source, and a
  better tier still wins. In the room planner, 27 generated rules became one line.

## 0.34.0

The knowledge repository's three questions (reviewer 02:00, questions.md Q34).

### New
- `core.type ... extends=A extends=B`: more `extends` after the first are slot groups
  (mixins). Their slots and patterns apply after the type's own line.
- `core.slot ... excludes=<key>` (rep.): a wire may not have both keys (violation
  `excludes`).
- `core.slot ... type=T by=<key>`: a join by a key value to a `T` wire. It is open until a
  loaded world declares `T`, then checked, including when that world is loaded.

### Changed (migration)
- A second `extends` on a type used to be ignored; it now takes effect. A matrix that
  carried one by mistake gets those slots: remove it to keep the old behaviour.

## 0.33.0

The reviewer's 01:20 item 4: the case corpus grows from PSys2's corpus. Its plan.seating
grid (420 English cases over 18 (act, kind) pairs) becomes 18 language-free cases in
`cases/grid.cases.json`. The corpus goes from 17 to 35, and all 35 pass.

### New
- `place thing= at=<a thing>` puts a thing into another, through the key whose slot refers
  to that thing's type (a guest at a table). `x` and `rel` / `ref` are as before.
- `tools/cases.mjs`: `expect.changes` (whether the act changed the world).

### Changed
- `cases/schemas/seating.sop` now follows PSys2's grid. Guests can be copied, connected and
  grouped, and tables have a place (`x`, `y`).

## 0.32.0

The reviewer's 01:20 item 3: two small applications written from the docs, a room planner
and a classroom timetable (`examples/second-app/`, `test/apps.test.mjs`). What they found
is in `docs/reuse-reports/apps.md`.

### Changed
- `show thing=* view=...` leaves out the things the view does not show and lists them in
  `skipped`. It is refused only when nothing is left; before, it was refused at the first
  thing without the view's aspects.

### Docs
- reference.md: joining two patterns by reference (`in=$rm`).
- api.md: the `complete` act is not the solver; `world.complete` is.
- docs/lessons.md: three new lessons.

## 0.31.0

The reviewer's 01:20 item 2 (PSys2's Q11 item 2): referents by words.

### New
- `resolve(world, phrase, options?)` gives the things a noun phrase names as `{ ids, tier,
  how }`. The tier is `user`, `scene`, `focus` or `slip`. It handles synonyms through
  `core.word` (values scoped to their key), modifiers, names, ordinals (`last` counts from
  the end), a number after the noun, a count before it, all / each / both / everything,
  coordination (the union), relations through a PP, pronouns and the focus, and
  one-letter or swapped-letter slips. When it cannot resolve, it says why and which.
- `nounPhrase`: each `pp` carries its inner `np`; `numAfter` marks a number after the
  noun.

## 0.30.0

The reviewer's 01:20 item 1: PSys2's English grammar facts (`handover/lang.en`) read by
`std.grammar` as they are.

### New
- `parseText` / `grammarOf` options: `types`, `classes` (closed classes as categories),
  `lexicon` (the host's open classes), `digits`; literal words and `[a|b]` in rules,
  `status=hole` skipped, `head=` honoured, `_` words of several parts, `'s` as a token,
  left-recursive rules. Each node carries its `rule`.
- `parseText` results say `tokens` and `unknown`.
- `nounPhrase` adds `rule`, `quant`, `ord`, `name`, `pron` and `parts`.
- `grammarView`, `viewDiff`: views of a closed class, and where two views differ.

### Changed (migration)
- Past its budget, `parseText` no longer throws. It returns what was complete, with
  `truncated: true`. Replace `try { parseText(...) } catch` with
  `const p = parseText(...); if (p.truncated) ...`.
- `nounPhrase` results now include `rule` when the node came from a rule. A test that
  compares the whole object needs that key added.

## 0.29.0

Round 26, part B: reading with a grammar world (smallest version).

### New
- `parseText`, `grammarOf`, `nounPhrase`: a grammar world's lexicon, rules and
  coordinating words applied to text; noun phrases and coordination, every parse best
  first, bounded. No language in the library.

## 0.28.0

Round 26, part A: what a host needs to drop its own executor.

### New
- `std.schema.effect of= act= action=`: an act on a kind whose state is not wires is the
  host's; its difference comes back in `diff.effects`; a refused sentence undoes the
  effects done before the refusal.
- `actReply(world, request, result, { templates })`: replies in the host's words, a
  template per act and kind.
- Reserved names documented (reference, std.acts).

## 0.27.0

The standing direction: learn from the applications. A case corpus, lessons, and what the
first cases found.

### New
- The case corpus (`cases/`, `node tools/cases.mjs`): language-free cases by pipeline
  stage, run in CI against a baseline that only grows (17 / 17).
- docs/lessons.md; tools/cooperation.mjs (worlds and modules that cooperate without code:
  25 pairs).
- `make` takes `amount`; `std.schema.capacity` (a container holds at most its own count).

### Changes (migration)
- A retraction is a statement in the log: `undo` gives the wire back, `toJSON` keeps it.
  Code that relied on `undo` passing over retractions must take that into account; a
  collection replaced with `world.sync` is still not given back.
- Every act is one undo step, however many statements it makes.
- The slot defaults `make` writes are at the tier `default` (`why` says `default`).

## 0.26.0

Round 25: the request pipeline as data.

### New
- `std.turn`: the stages of a request, their order, providers by tier and what an empty
  stage does, as wires; advice when a stage has no provider.
- `turnFlow`: runs the declared path, with a trace of every stage; the default gives what
  `turn` gives. Built-in providers include `confirm` (before an act on a whole set) and
  `route`.

## 0.25.0

Round 24, last part: tools for authors and the documentation a new project starts from.

### New
- The failure ledger: `ledgerAppend`, `ledgerGroups`, `ledgerKey`, `stageOf`, `STAGES`,
  tools/ledger.mjs; tools/validate.mjs (a world in one command).
- docs/quickstart.md, docs/modules.md, docs/patterns.md (the reuse catalogue),
  docs/host-contract.md; README's capability table generated from docs/capabilities.md
  (tools/capability-table.mjs).
- examples/second-app: a recipe planner written from the docs.

### Changes
- `turn` gives `replies` for every status but `nothing` (the question for ask and unknown).

## 0.24.0

Round 24, second part: one request pipeline, choosing a world, the coverage grid.

### New
- `turn`: the readings of one message dry-run, the first the world takes applied as one
  sentence, with diff, why, guesses and replies; a graded fallback (ask, elsewhere, a named
  guess) otherwise.
- `route`: the world for a request, scored by cards, the thing named, a dry run and a
  host signal.
- `schemaGrid`, `gridTests`: the coverage grid of the schemas and a test file from it.
- The act `complete`: defaults learnt later applied to existing things, on request (Q28).
- `core.use world= as=`: a library module loaded under another name (Q29).

## 0.23.0

Round 24, first part: what the library can do, documented; knowledge by lookup.

### New
- docs/capabilities.md: the library by job, each with a runnable example (run in CI),
  module, version and limits, and what is not done yet.
- `createCatalog`, `bundleReader`, tools/build-bundle.mjs: knowledge worlds loaded by
  lookup through the host's reader, cached, schemas first; offline bundles (from PSys2's
  knowledge-loader hand-over).

## 0.22.0

Round 23: reuse between worlds.

### New
- Acts reach inside a thing (`in`, `in_nth`): "the eyes of the second face".
- Option `advise`: advice at load for authors (a kind with the shape of another module's,
  a rule already in a module), never an error.
- examples/reuse.mjs: one board module as tic-tac-toe and chess, one list module as tasks,
  shopping and playlist.
- `change` on a set takes more / less.

## 0.21.0

Round 22 (shared things, views, taught facts) and Round 23's study of reuse.

### New
- Aspects, views and the act `show` (a reasoned refusal when a thing lacks an aspect);
  `teach` and `forget`: facts at the tier `taught`, with who taught them; std.fill's tier
  `taught` (rank 3.5); `is_a` followed by std.know.
- docs/reuse.md: a catalogue of reuse patterns; tools/reuse.mjs: a detector of reuse
  candidates between worlds; three reports in docs/reuse-reports/.

### Changes
- std.fill tier ranks are numbers.

## 0.20.0

Round 21, second part: the remaining acts, sets and values.

### New
- Acts `send` (to another world that has the kind; a kind may belong to several worlds),
  `save` / `load`, `undo` / `redo` (with `diff`, outside a transaction).
- `change` and `remove` on sets (`each`, `all`, `first`, `last`); values `random`,
  `different`, `same as <thing>`; one undo step for the set.

## 0.19.0

Round 21, first part: from schema to words, knowledge as a filler.

### New
- `schemaCard`, `schemaExamples`, `actReply`: the card of a world, example sentences per
  act with their requests, and the plain-English reply for a done act or a refusal.
- `std.know`: facts of a knowledge catalog (`k.commonsense.thing`, `k.objects.part`)
  offered to std.fill at the tier `knowledge`, with their `core.source`; `make` applies the
  choice as defaults and lists it in `result.filled`. `std.schema.kinds stand_in=`.

### Fixes
- A fork keeps host functions registered later and those a standard module brought.
- Rules whose only selection is `core.absent=` are driven by single wires, not re-run in
  full; a withdrawn firing requeues one wire, none when a wire it read is gone: a make on
  2,000 things with knowledge costs 163 steps, as on 10 (was 92,212).

## 0.18.0

Round 20: ACTS × SCHEMAS, the library side.

### New
- `std.schema`: a world that does things declared as data: kinds (types extending
  `std.schema.thing`), attributes (`core.slot`), `std.schema.world`, `std.schema.kind`
  (which acts apply), `std.schema.kinds` (any kind a knowledge type names),
  `std.schema.limit`.
- `std.acts`: make, remove, change (set, more, less), place, connect, group / ungroup,
  pick, ask, copy; the same for every schema, no world-specific rule. A refusal names what
  the kind allows, which worlds allow the act and which kinds have the attribute.
- Every done action result has `diff` (added, removed, changed, with tiers).
- The standard pack can ship actions. examples/acts.mjs (a seating plan and a face),
  bench/acts.mjs (an act costs the same steps on 10, 200 and 2,000 things).

### Fixes
- A host action that returns a refused change passes its violations through.

## 0.17.0

Round 19: what the demo's failures showed.

### New
- `std.fill`: a value for a key a request left out, from offers in named tiers (user,
  focus, scene, knowledge, default), chosen per key, with tier and source; ties are advice
  (Q25 a). examples/fill.mjs.
- `std.focus`: the dialogue focus per turn (thing, action, place, world); a request that
  leaves out its thing or action is completed from the turn before, through std.fill;
  earlier turns keep theirs. examples/focus.mjs.
- `std.relations`: relations kept between things (on, in, next_to, above, in_front_of)
  that follow when a thing moves; rows; `nth`, `each`, `spread`; actions
  `relations.put_all` and `relations.put_pairs`. examples/relations.mjs; what needs a
  function is listed in the reference.
- `world.why(id, key?)`: the chain behind a wire or a value, with std.fill's choice and the
  action that told a thing; statements made inside `act` record the action.
- `world.act([requests])`: the requests of one sentence, all or nothing, one undo step.
- `PatternIndex`: a host's sentence patterns indexed by the words they need.
- Refusable readings: `score` as the dry run (integration §5b, examples/refusal.mjs); an
  action's guard names the pattern nothing matches.

### Fixes
- core.rank re-ranks when a better peer arrives, with no `conflict` or loop; a value taken
  back withdraws only what reads that key.
- A rule that reads a group aggregate's result waits for the group to be computed again: a
  second offer arriving later is no `conflict`.
- Moving a thing whose ranked key a rule fills is no `conflict`.
- core.rank orders a group once, not once per peer (400 peers told one at a time: 20 s →
  0.4 s); `score` looks for open keys on the reading's wires only (20,000 facts: 346 →
  28 µs per reading).

Q26 (PSys2's pattern set for the index measurement) open.

## 0.16.0

Round 17: what the knowledge worlds and the coming `space` module need.

### New
- The standard function pack, declared in SOP Lang and opt-in by `core.use`:
  `std.numbers` (average, median), `std.order` (rank_in, nth_smallest, nth_largest),
  `std.boxes` (centre_x, centre_y, overlaps, contains_box, box_distance); and
  examples/space.mjs, a space world written with it and rules only (R17.2).
- `absent: [keys]` in the object form of questions and descriptions, and `core.absent=` on
  `core.question` wires: the pattern modifier, reached from objects (R17.1, Q23).
- bench/load.mjs over the hand-written CC0 knowledge shards (R17.5).

### Fixes
- The same number written two ways on several wires is one answer, `supported` (R17.4).
- Identity lookup walks the smallest identity index set: no slowdown as a world grows (R17.5).
- An aggregate result merged into a told wire keeps its firing when another result on that
  wire is withdrawn; the next change of the group is no longer a `conflict` (R17.2).

Q24 (ordered sequences) reported; one wire per point stays.

## 0.15.0

Round 16: findings of the first knowledge worlds.

### Changes
- A soft deny's issue is advice: answers that rest on its wires keep their status and list
  it under `advice`; only an issue about the asked key (a soft bound) makes an answer
  `conflicting` (R16.1).
- One identity along a lineage is one wire of the more specific type, whatever the order
  in which the subtype and supertype facts are told; siblings stay apart (R16.2).

### New
- `version=` on `core.module`, and `world.modules()` (R16.4).

### Fixes
- A matrix id declared twice names both owners; an import whose declaration lost such a
  clash says so instead of "neither loaded nor in the library" (R16.3).

Q22 (one of in a pattern) is open for the reviewer.

## 0.14.0

Round 15: host functions declared in SOP Lang (no code inside wires).

### New
- `core.function name= out.kind= pure= doc=` and one `core.function.arg of=$f name= kind=
  optional= doc=` per argument: the tools a world has are in its schema.
- Checked at load: a calc or check that names a declared function gives it the right
  number of arguments, literals of the right kind, and a check's function returns boolean.
- `pure=true`: results kept for a step; only pure functions run in lazy rules (else a
  `schema` error) and in the overlays of `score` and `check` (else `impure`).
- `world.functions()` lists the declarations.
- Notes in `world.warnings`: `undeclared-function` (registered, not declared; it still
  works) and `unregistered-function` (declared, not registered; a call gives no result).

### Changes
- A fact that names `fn=` is refused (`function-in-fact`): only matrix wires call
  functions.

## 0.13.2

### Fixes
- A split keeps a frame `interpret` cannot read as an unresolved part with its words, so
  `rank` and `veto` see what was left out ("mark Paris then undo") (R14.1).

## 0.13.1

Round 13: namespace defects and two judgement gaps, from the host's probes.

### Fixes
- `replace` keeps the namespace of the wire it replaces (N1).
- An aggregate's result is in the namespace of the wires it counts; the default one when
  they span several (N2).
- `core.schema.map as=type` reads `shared`, `transient` and `unique` (N3).
- Log entries keep their namespace; replay and restore honour it (N4).
- A bare reference to a wire of a shared type falls back to the default namespace (N5).
- `check(patch, { query, ask })` asks in the patch's namespace; a text patch is its wires (N6).
- `score`: a question given as a wire or text is understood; a computed answer not made yet
  is not a lack (J1).
- `score`: an action the host carries out is judged against the slots of a type named
  like it, with its required parameters as lacks; `veto` calls only unknown actions
  unavailable (J2).

## 0.13.0

Words have no language.

### Breaking
- `core.word` has no `lang=` any more: a word is `core.word text=… means=… [of=…]`. The
  words of a world are in the one language its matrix is written in; translation is the
  host's, outside the world. A `lang=` on an old word is ignored.
- `world.words(lang)` is `world.words()`; frames lose `lang`; `world.examples(lang,
  templates, options)` is `world.examples(templates, options)`.
- The lemma hook is one function: `new World({ lemma: fn })` or `register('lemma', fn)`,
  called as `fn(token)` (was `lemmas: { lang: fn }` and `fn(token, lang)`).

### Changed
- Every Romanian word in examples, tests and docs is replaced by English (synonyms,
  plurals, a possessive for the lemma example).
- A quoted `text=` of a word is read as its content.

## 0.12.0

Round 12: from the host's world-aware reading.

### Changes
- `score`: the value a question asks for is no longer a lack, so a question is not beaten
  by a nonsense statement.
- In a split, a frame with no verb takes the verb of the frame before it, as a follow-up.

### New
- `judged` and `judgedBy` on every scored reading; a fallback judgement for actions the
  matrix does not declare (referents, slots through `of` or `type.key` arguments, denies),
  and `veto` no longer calls such a judged reading unavailable.
- examples/reader.mjs: a shop described with `core.word` the way a host writes words for
  pattern generation, read back with splits, typos, loose words and examples.

## 0.11.1

Round 11 additions from the host's word descriptions. No change to the library's code.

### Documented
- A value in another language names its canonical value with `means=<value>
  of=<type.key>`, and `interpret` returns the canonical one (R11.4; Q21 explains why no
  `value=` key was added).
- Words keep their declaration order in `words`, readings, near words, examples and ties,
  across forks, undo and snapshots (R11.5).

## 0.11.0

Round 11: from the host's re-vendor.

### New
- Delta snapshots: `toJSON({ timeline: true, since: base })` writes only what came after
  the base, with a fingerprint; `World.fromJSON(data, { base })` forks the base and
  replays the rest. Open marks on the way of the log are written as positions and
  restored as forks taken during the one replay.
- `redo()` after `rewind(mark)` tells again what the rewind took back (also after
  `rewind(mark, { only })`), until the next statement.
- `groups=` on `core.aggregate` (values, or `$pattern`): every declared group has a
  result; empty ones get 0 or `default=`.

### Fixes
- `redo()` no longer leaves an open mark behind, and a refused redo keeps the redo stack.

## 0.10.0

Round 10: the reader core against the errors a host sees.

### New
- Near words: an unknown word is read as the nearest known words (edit distance 1 for
  short words, 2 for longer), as `assumes: [{ word, read }]`; known words are never
  corrected; `near: false` turns it off.
- Follow-ups: `interpret(frame, { previous })` with a frame, `{ frame, ids }` or `'told'`;
  marks `anaphor`, `correction`, `other`; candidates say what they inherited and
  replaced; a new candidate kind `{ revise }`; `refer.not`.
- Loose words: a frame `{ words }` with no verb order, read with each verb word and each
  implied tool; a budget site `interpret`.
- Word forms: several `text=` on `core.word`; a host `lemma` function per language
  (`lemmas` option, `register('lemma', lang, fn)`).
- `world.veto(result)` / `veto`: answer with the top reading or not, with reasons, what to
  ask and which words were read as others.

## 0.9.0

Round 9: a reader core, from design to code.

### New
- `core.word lang= text= means= of=`: words of a language as facts, one meaning each;
  an `unknown-word` warning when `means=` names nothing.
- `world.words(lang)` and `world.interpret(frame)`: a language-neutral frame read into
  candidates for `score` through words, the matrix and the state; nothing invented;
  unknown words stay `unresolved`.
- `rank(scored, criteria)` and `RANKING`: the default order as a function; every scored
  candidate has `place` and `why` (and `lostTo`, `on`).
- Splits: `interpret` of a list of frames (one split) or of lists (alternative splits);
  `score` judges `{ parts }` in order as one whole.
- `world.examples(lang, templates)`: example sentences from tools, slots and words with
  the host's templates, each with the frame and reading it should give back.

### Changes
- The default order puts words left out before assumptions (Q19).

## 0.8.1

Round 8: a design study on formalization.

### New
- `world.score(candidates)`: judges candidate readings (statements with described
  referents, actions, questions) against the world without telling anything; reports
  consistency, referents (unique, or which fit), lacks, assumptions, action availability
  and answers, and a documented order.
- docs/design/formalization.md: tool descriptions, `interpret(frame)` (design),
  scoring, generated readers, limits. Questions Q17 (`core.word`) and Q18 (roles) for
  the reviewer; no syntax change.

## 0.8.0

Round 7: namespaces and what hosts still missed after moving 18 worlds.

### New
- **Namespaces (R7.9).** `tell(text, { ns })` and `new World({ ns })`: ids become
  `ns::id`; a reference resolves in its own namespace, `$other::x` and `$::x` reach
  others; one match of a rule, deny or question is in one namespace; identity merges only
  inside one; `core.type ... shared=true` belongs to all. `query`, `ask`, `sync` take
  `{ ns }`. A module declares types and slots only under its own prefix; `core.module
  name= imports= exports=`; an `ambiguous-key` warning; a "Scope" chapter in
  docs/language.md.
- Labelled marks, `marks()`, `rewind(mark, { only })`, `toJSON({ timeline: true })`.
- `priority=` on denies; `why=` on slots, with variables and filters.
- `kind=ref to=<type>` (retraction refused while referred to); `unique=` on slots and
  key sets.
- Lists in reasons (a filter gets a many-valued variable whole).
- `lazy=true` rules.
- `between`, `sign`, `clamp`.
- `assumptions(ids)`; `world.version`.

### Fixed
- A deny over a group was not checked when a member arrived in a matrix with no rule
  that needed groups.

### Changed (may need a change in a host)
- A module from the library that declares a type or slot outside its own prefix is now
  refused.
- `::` is allowed in ids and references (it was an error).
- New violation kind `unique`.

## 0.7.1

Round 6, R6.13–R6.17.

### New
- `facts` option: facts a host keeps (a large static table), given per type by a
  provider and matched by patterns like wires; never stored, forked, logged or
  snapshotted; one budget step per fact returned.
- `world.sync(type | { prefix }, list)`: make a collection equal to a list in one
  transaction (tells, replacements in place, retractions); returns the delta.
- `kind=json`: structured values, compared and indexed in one canonical spelling, read
  in patterns by path (`center.lat=?lat`); at most 10 levels and 100,000 characters.
- `tell(text, { tier: { key: tier } })`: some keys of a statement told as assumptions;
  a told value replaces them, also in the log.
- `ties=all` on `argmax`/`argmin`: every tied pick, as several values.

### Changed (may need a change in a host)
- `ties=` other than `first` or `all` is a `schema` violation.

## 0.7.0

Round 6, R6.1–R6.12, from hosts moving their worlds onto the library.

### New
- A key declared `many=true` answers with all its values in value mode (`values`).
- `query({ ..., mode: 'check' })`: is a given value the one the world holds or derives?
  `yes`, or `no` with `actual`.
- `kind=blob`: opaque values kept as given, out of the indexes and the rules.
- Refusals carry their variables as data (`vars`); reasons write values through filters
  the host registers (`?n:ordinal`; `filters` option, `register('filter', ...)`).
- `core.aggregate`: one result even over nothing (`default=`), one per group with `by=`,
  with no anchor wire.
- `core.rank of=$p by=key within=?v out=?r`: the position of a wire among its peers.
- `core.type ... transient=true` (undo passes over it) and `world.redo(n)`.
- `applyPatch({ replace: { id, attrs } })`: replace in place, logged as its own
  statement (undo, redo, replay).
- Text functions: `matches` (bounded patterns), `contains`, `starts_with`, `ends_with`,
  `lower`.
- Questions on a hypothetical world: `check(patch, { query, ask })`, `query(q, { given })`,
  `ask(p, { given })`.

### Faster
- A value of a key that nothing reads is validated but not propagated (200 such values:
  6.9 → 1.5 ms).
- `rewind` compares only what the events since the mark name (11.9 → 0.009 ms at 6,000
  wires); `diff` and `tier` read without copying.
- `complete({ defaults })` stops at the first default that fits (150 defaults: 89 → 25 ms).
- The parser reads long strings in one pass (a 1 MB string: 77 → 5.5 ms).

### Changed (may need a change in a host)
- Several values of a `many=true` key are `supported` with `values` (they were
  `conflicting`).
- In a reason, `?name:word` names a filter (it was the value followed by ":word").
- New violation kind `nothing-to-redo`.

## 0.6.2

Performance of forks, marks and completing (Round 5). No output changes: the whole suite
and the PSys2 pilot give the same results.

### New
- `world.canComplete(id?)`: cheap; whether some empty slot has a candidate completion
  could try (a default, or for a required key an enum, a range or a type with wires).
- `next({ review: true })` returns the assumptions to review; without it they are not
  computed.
- In a host action: `ctx.flush()`, `ctx.tell(x, { now: true })`, and `ctx.get`,
  `ctx.query`, `ctx.ask`. A refusal of queued tells names them under `queued`.
- `SOPWORLD_COW_CHECK=1`: a checking mode in which any write to state shared between
  forks throws; `npm test` runs the suite once more in it.
- Benches in `bench/`: `complete.mjs`, `fork.mjs`, `act.mjs`.

### Faster
- `complete()` and `next()` look only at types that have a required slot or a default,
  and `complete()` returns its last answer at once when nothing changed: 0.30 → 0.006 ms
  with nothing to fill in a 420-wire world.
- The first change after `fork()` or `mark()` copies only the wires and index entries it
  touches (copy-on-write layers, `src/cow.mjs`): fork + first tell in a 6,000-wire world
  7.8 → 0.015 ms, within 1.5× of the same tell without a fork, at any size.
- The tells of a host action are propagated together where the action reads and at its
  end: 70 tells 3.2 → 0.9 ms with a matrix that keeps counts and reads absences.

### Changed (may need a change in a host)
- `next()` no longer includes `review` unless asked for with `{ review: true }`.
- In a host action, `ctx.tell` returns `{ ok: true, queued: true }` and the statement is
  checked with the others at the next read or at the end: a middle state that a later
  tell of the same action repairs is accepted. Use `{ now: true }` for the old check.

## 0.6.1

The language as defined in `docs/language.md` is SOP Lang v1.1: a superset of v1 (every
v1 text reads the same), with the parser as strict as v1's.

### New
- **Strings** use the escapes of JSON (`\n`, `\t`, `\uXXXX`, ...) and no others. `parse`
  stores every string in one canonical spelling (that of `JSON.stringify`), so one text
  is one value whatever escapes were written. `str()` decodes them; `quote()` writes
  the canonical spelling.
- **Every syntax error is named**, and one `SopError` lists all errors of a text in
  `errors` (`{ message, offset, line, column }`): text before the first declaration, a
  declaration without id or type, an invalid identifier (id, type, key, reference,
  variable), a token that is not `key=value`, an empty value, an unterminated string, a
  bad escape, text after a closing quote, a quote or a backslash inside an atom, an id
  declared twice in one text.
- **Canonical form**: `format(wire, { canonical: true })` and `serialize(wires,
  { canonical: true })`: entries sorted by key, repeats in order, strings in one
  spelling, one line end after each wire.
- **Values as data**: `readValue(token)` gives `{ kind: 'atom' | 'string' | 'ref' |
  'var', v }`, `writeValue` the token; for a host that parses with its own parser.
- `docs/language.md`: the grammar with identifiers by segments, the exact rule for `@`
  and atoms, the in-memory form of a wire, the list of errors, and a section "From SOP
  Lang v1 to v1.1".

### Changed (may need a change in a host)
- The parser refuses what it used to let through: an identifier with an empty segment
  (`a..b`, `a.`), a reference or variable that is not an identifier (`$`, `?`), an
  unknown escape in a string (`"\q"`), text after a closing quote (`k="a"b`), a quote or
  a backslash inside an atom, and the same id declared twice in one text.
  `parse(text, { lenient: true })` reads such texts as before.
- `str('"a\\nb"')` is now `a`, a line end, `b` (it was `anb`): escapes are JSON's.
- A string that was written with a line end inside it is stored with `\n`.

## 0.6.0

### New
- **One language (L1).** `?` is only a variable. A pattern or a template is an ordinary
  `@id` wire that a rule, deny, calc, relation or action names in the same statement.
  The old declaration `?id type ...` is still read and noted in `world.warnings`;
  `format()` writes `@`. `tools/migrate-syntax.mjs` rewrites files.
- **Registries (W1).** `fns`, `actions`, `producers` are three options;
  `world.register(kind, name, fn, { override })` adds one later.
- **What a query supposed (W2).** `supposed` on an answer found by supposing a wire:
  the wire as the rules left it, and what they set.
- **Refusals that can be explained (W3).** `involved` (the wires as they were) and
  `bindings` on a violation; a reason may quote the values (`why="?n is too much"`).
- **The whole world checked (W4).** `world.check()` without a patch: every violation
  and every standing issue; `World.audit(wires, matrix)` for wires from elsewhere.
- **Revision (W5, W6).** `world.revise(id, key, value)` replaces a told value with
  everything that followed; `world.told()` returns the facts as stated.
- **What would have to be true (W7).** `howto` on a query for a key that may be
  assumed, `mode: 'abduce'`; abduction through `core.on=` templates.
- **Taking back (W8).** `world.undo(n)`, `world.mark()`, `world.rewind(mark)`; a change
  that records a soft violation returns it under `issues`.
- **Which build (no tags).** `build = { version, hash, date }` in the built file, and
  `docs/version.md` next to it.
- **Reference documentation (D1).** `docs/language.md` (grammar), `docs/reference.md`
  (every wire type and function), `docs/semantics.md` (62 numbered statements, each
  with its test, and the table of violations), `docs/api.md` (every export and
  method), `docs/glossary.md`. Every example is executed by the tests; the lists are
  compared with the library in both directions; the HTML pages are generated from the
  markdown. `GRAMMAR`, `MODIFIERS`, `SCHEMA_TYPES` and `aggregates` are exported.

### Changed (may need a change in a host)
- A fact that contains a variable is refused with a violation of kind `variable` (it
  was `syntax`). `SopError`, thrown for text that does not parse, is the only syntax
  error, and has `line`, `column`, `offset`.
- Telling again a fact that adds nothing is accepted (it was `duplicate-id`).
- Actions and producers are given as `actions` and `producers` (they were in `fns`). A
  host function with the name of a built-in is refused unless `override` says so.
- An attribute that a matrix wire type does not read is noted in `world.warnings`
  (`unknown-attribute`).
- `docs/concepts.html`, `matrix.html`, `reasoning.html`, `usecases.html`,
  `solvers.html` and `roadmap.html` are gone; `SPEC.md` is a short overview. The text is
  in the markdown pages above.

## 0.5.0

### New
- **Types and schema.** Type hierarchy (`extends`), literal kinds, short and qualified
  key names, open namespaces, schemas in another notation through `core.schema.map`.
- **Time.** A sequence (`core.sequence`, `before`, `after`, `core.select=latest`), states
  changed by events (`core.fluent`, `core.effect`, `delta=`), the past (`asOf`).
- **Numbers.** Aggregates over patterns; more arithmetic and clock/date functions;
  comparison by value; one spelling of numbers under `integer` / `number` keys; the
  `decimals` option and `core.precision`.
- **Relations.** `core.relation`: a linear relation over cells, solved exactly for
  whichever is missing; `relation=true` on an add or sub calc. Abduction goes through
  calculations and relations.
- **Questions and actions.** `world.query` with a status (`supported`, `conflicting`,
  `ambiguous`, `missing`, `refused`, `unsupported`, `no`, `unknown`, `budget`), answers
  as wires, producers, actions as functions or written as wires.
- **Patches.** `world.check(patch)` and `world.applyPatch(patch)`: wires, fills, sets and
  retractions judged together.
- **Certainty.** Tiers (`told`, `derived`, `forced`, `default`, `guessed`, or declared
  with `core.tier`), value-level provenance (`cells`), `world.tier`,
  `world.assumptions`, `world.describe`, `world.diff`.
- **Soft constraints.** `soft=true` on a deny or a bounded slot; standing `core.issue`
  wires.
- **Patterns and templates.** `core.absent=<key>`, `core.on=$pattern`.
- **Limits.** A step budget on every call, `world.stats()`; a `fork()` that copies
  nothing until it changes.

### Changed (may need a change in a host)
- `core.test` is now `core.check` (still read as a condition when linked with `if=`).
- `world.schema` (the Map of matrix wires) is now `world.matrix`; `world.schema(type)`
  describes a type.
- A second, different declaration of the same key of the same type is refused unless
  one says `combine=intersect` or `combine=override` (it used to replace the first).
- A told value replaces a forced or chosen value for the same key, as it already
  replaced a default (it used to be a conflict); `revised` entries carry the tier.
- `complete({ defaults: true })` and `step()` apply a default to an optional key too.
- Values committed by `complete({ choose })` have `via: 'core.choose'`.
- A reference under an undeclared key of an open namespace is not checked and does not
  tie the wire to what it mentions; such a key does not conflict when a wire is told
  again.

### Fixed
- A completion that is only valid as a whole was reported `unsat` and its keys dead.
- `apply()` returned working fields and applied values one at a time.

## 0.4.0

First version published in this repository: wires, the consistency matrix (slots, rules,
denies, calcs, abducibles, modules), deduction, completion, abduction, induction,
revision, pluggable solvers, one built file for Node and browsers.
