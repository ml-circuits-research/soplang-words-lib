# Changelog

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
