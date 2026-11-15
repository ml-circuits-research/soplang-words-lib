# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

## Q61 (knowledge repository Q60, reviewer 01:40): the structure formats for alignWorlds

The formats of k.kinds.argument, k.kinds.relation and w.lang.en.variant are accepted as
published. For k.kinds.structure, alignWorlds needs per role a direction (`refers`), a
cardinality (`many`), whether it is `required`, and constraint facts (capacity, distinct,
order). The proposed formats are in worker-log.md (answer to Q60). **Choice taken while
waiting:** alignWorlds keeps aligning by slot signatures. When the role facts are published,
it will map types to roles and check the constraints.

## Q54 (reviewer 21:00, owner 14:45): design note for the abstraction round

The diagnosis is accepted: reading follows surface forms, knowledge comes after reading, and
`induce` / `abduce` are not used on language or on the case corpus. Below, each item with
what it builds, where, and the measure that must move. PSys2 measures the four curves
(paraphrases-rt, schema-alone, grid, held-out) before and after each item. In this
repository the gate stays: npm test, pilot identical, corpus 61/61. Each item ships alone,
with its "before" number taken first.

**1. Type-driven reading** (`resolve`, `std.grammar`: new `readByTypes(world, text, { lexicon, acts })`).
- Content words are typed through the lexicon and resolve: a thing of a kind, an attribute,
  an act, a value with a unit, a question word.
- The candidate frames are every act or relation whose argument types the typed words can
  fill:
  - k.actions roles with their types;
  - schema slots (kind, ref type);
  - knowledge relations with their argument types ("sound of animal": a key whose holder
    type is animal).
- Assignment is a `solveChoices` problem: words to roles, each word at most once, types
  must fit.
- Word order, prepositions and function words only weight the candidates (Q-word plus
  copula: a question; an imperative verb first: a command), so "what sound does a cow make",
  "a cow makes which sound" and "cow sound?" give one frame.
- An unread word is said, never dropped silently.
- **Measure:**
  - PSys2 paraphrases-rt meaning kept, 16.5 % → up;
  - schema-alone, about 51 % → up;
  - here, a new case set of 30 paraphrase triples (cow / sound kind) over toy schemas.

**2. Alternations once** (`std.grammar`: `alternations` as data in the language world:
`w.lang.en.alternation name=passive from=... to=...`; the library applies them).
- Passive, wh-fronting, question vs command, wrappers ("could you", "I want you to",
  "please"), dative shift and ellipsis are rules over a canonical frame's parse.
- The grammar derives every variant of every frame at load (bounded) or matches them at
  read time by normalising the input to canonical order.
- I start with the read-time normaliser: it is cheaper and needs no growth in rules.
- A language world then writes each frame once.
- **Measure:** the number of frame rules in w.lang.en that are variants of another, which
  should drop once they can be removed, with paraphrases-rt no lower.
- **Ask to the knowledge side:** the alternations as facts of w.lang.en. Until they are
  published, I keep a toy set in the tests.

**3. Lexical generalisation at read time** (`resolve` tier `near`).
- A word unknown in a typed slot goes to the nearest sense in k.words of the slot's type:
  synonym (cost 1), hypernym or hyponym (2), derivation (2).
- The cost ranks the candidates; above a bound, the word is not read and the reply asks.
- **Measure:** paraphrases-rt on the subset whose paraphrase replaces a word, and wrong
  reads (precision), which must not rise.

**4. Induction from cases** (`learnRules(rows, { induce, heldOut })`, new in `tools/` first,
then std).
- Ledger rows and corpus cases that share an act are grouped.
- `induce` anti-unifies their successful readings (text spans → frame) into a general rule,
  and fillers are lifted to their common kind (k.kinds chain).
- The rule is proposed with its support.
- It is admitted only if the held-out half does not drop and the training half rises.
- **Measure:** the PSys2 learning curve with mechanisms frozen and only induced rules
  added. The point is rules that come from data, not hand fixes.
- This is the "learn" step the Round 27 skills call.

**5. Transfer by analogy between worlds** (`alignWorlds(a, b)`).
- Two schemas are aligned by structure:
  - items assigned to slots under constraints (seating, timeline, layout);
  - containers with ordered parts (drawing, document, diagram).
- Types are matched by their slot signatures (kinds, refs, many, constraints), with a
  `solveChoices` assignment that maximises the matched slots.
- A default, rule, procedure or question form of one world is then **offered** to the
  aligned one, with the map and a measurement, never told silently.
- **Measure:** on PSys2's worlds, the proposals accepted by the held-out curve, against the
  proposals made.

**6. Story-then-question focus** (18:20 item 1). `dialogue`'s focus log carries the
entities of a story told before a question, and resolve's `focusFor` reads them. **Measure:**
PSys2's story-question set.

**Also from the 21:00 list (decisions):**
- one summariser: docr.summary's needs go into std.summarize;
- compose's world may be a composite (session worlds plus catalog, async allowed);
- compose deterministic by seed and memoisable;
- `summarizeLog({ failed: 'separate' })`;
- one frame renderer for summarize, compose and sample, through the language world's act
  templates;
- `std.schema.kind ... needs=text`, so sample skips makes it cannot fill.

**Order:** 1, 3 (they share the typed slots), 2, 4, 5, 6. The small decisions go in
between. **Choice taken while waiting:** start item 1 on toy schemas with the cow / sound
example and the existing resolve tiers.

## Q36 (reviewer 07:40, Round 28): PSys2's [LIB] lessons, one answer each

Read in place (PSys2 questions.md, Q12 of 2026-11-14 04:30, and item 4 of "w.lang.en vs the
hand-over"). Each line: **take** (with the round 28 item it goes in), **have** (already in
the library, with the version), or **refuse** (with the reason).
1. Evidence rule for a referent's world (the world whose things hold the words, ranked as
   scene): **take**, the `resolves` hook of `arbitrate` (0.45); and `resolve` already ranks
   `scene`.
2. A frame naming the world's own words beats generic act forms, by rule and not by numbers:
   **take** (item 7). "What is X" for a named thing of the open view: **take**, with
   item 3 (std.dialogue) and the focus.
3. Form compiler checks (an optional slot before a required one; lemmatised lexicon words;
   `words(n)`): **take** (item 7). These are PSys2's pattern compiler; the library's
   counterpart is the grammar reader and `schemaExamples`, where the checks will go.
4. Facts lookup first (views, inflect, fragment, agent), then the algorithms, then the chart,
   and `grammar.diff`: **have** views and diff (`grammarView`, `viewDiff`, 0.30) and the
   chart (0.29–0.30). **take** inflect, fragment and agent (item 6, in Q33's order).
5. `relpron`, `partitive`, `other`, `choice` and the negation lead as chart rules, with
   "asked instead of guessed" as a result kind: **have** partitive, other, choice and
   asked (`ask: true`, 0.40). **take** relpron and the negation lead as chart rules, and the
   failure class as a field (item 6).
6. An arbitration contract (claim, decline, focus) and a test that no schema world takes
   another world's sentence: **take, built** (`arbitrate`, 0.45).
7. One undo step for several acts of one sentence: **have** (`act([...])`, 0.26).
   Generated-world tests (a world reads its own canonical examples): **have** (`gridTests`,
   0.27).
8. Index a shard once and memoise lookups within a turn: **take** (item 5).
9. One segmenter that knows the act forms: **take** (item 2).
10. A relation kind (spatial, containment, flow) declared in a schema: **take** (item 8).
11. Views, aspects and `show` in a things module: **have** (`std.schema.view`, `show`, 0.21).
    The experiment harness as a library tool: **take** (item 9).
12. The act verb claim: **take, built** (the decline rule of `arbitrate`, 0.45).
13. "Bundled subset then catalog" with `reachable()` and a synchronous first read, and the
    two reader bugs (a word form only as `core.word`; a schema shard id that is its own
    path): **take** (item 5). A sync read already exists (`intoSync`, 0.23).
14. The segmenter as the cut point (so hosts need no encoder); the ablation harness:
    **take** (items 2 and 9).
15. Turn kinds and the focus log as `std.dialogue`; a modal world sees a turn first:
    **take** (item 3).
16. A fork copies every context hook, tested once: **take** (item 3). Forks already copy
    functions, actions, producers and filters (0.26). The test will cover them all.
17. `std.space` single placement (to a thing, to a region, a default spot): **take**
    (item 8).
18. `listOf(type, slot, value)` over a loaded catalog, and a world-level `bundle=`: **take**
    (item 5).
19. An undo contract per request, with an optional whole-message tag: **take** (item 4).
20. A three-valued verdict, a `resolves(words)` hook, and a verdict a wrapper may not erase
    (tested once): **take, built** (`arbitrate` returns the verdict itself, 0.45). A
    decline must not become a refusal on spelling variants or one-world views: **built**
    (`pass`).
21. Typed lexicons for form slots (a switch accepts only booleans), cuts at a frame lead
    inside a rest slot, a hook that asks and takes the next bare sentence as its answer,
    and lexicon words in the spelling vocabulary: **take** in items 2 and 3. The spelling
    vocabulary is **refused**: spelling stays the host's, by the rule of std-grammar.md
    section 7.
22. `needs` as a declared, typed list, and a view's declaration and needs as one object:
    **have** (`std.schema.needs`, 0.39, takes a view's name).
23. `resolve` reads a bare name (NP -> NAME), takes coordinators from `coord.sep`-like
    facts, reports the failure class as a field, and has a focus option "only for a
    pronoun": **take** (item 6). The first two are the grammar's own options (`types`,
    `classes`), so they need only a test.
24. An optional open slot backs off when the next element would fail: **take** (item 7).
    Attribute words and relation verbs as different kinds in `std.schema`: **take**
    (item 8, with relation kinds).
25. Reading the whole catalog grammar changed 14 of 6,972 results: a quantifier found only
    as a literal, a coordination read as its first part, "the other table" as the focus.
    **take** (item 6): quantifier categories as categories (`quant` from a class, not only
    from a literal), coordination as a list, "other" from the focus.
Not blocking.

## Q37 [KNOW] (Round 30): the morphology notation the library reads, for w.lang.ro

For the reviewer to forward to the knowledge repository's w.lang.ro worker. The library
reads this notation since 0.52 (src/morph.mjs, test/morph.test.mjs with an invented
language). The type names can be renamed by the language world (`morphOf(world, { types })`),
so w.lang.ro may use `w.lang.ro.class` and so on.
- `m.class name=<class> parent=<class>? drop=<what the lemma loses to give the stem>?
  alt=<from>><to> (rep.)`. A class inherits its parent's cells and overrides some.
- `m.ending class= suffix= alt=yes? <feature>=<value>...`. One cell: the features (num,
  def, case, gender, person, tense: any names) and the suffix (`_` = none). `alt=yes`
  applies the class's alternation to the stem.
- `m.irregular lemma= form= <features>` (consulted first), `m.fold from= to=` (ă→a, â→a,
  î→i, ș→s, ț→t, and the cedilla forms), `m.split text="-"`, `m.template act= shape=?
  text=` (slots `{role}`, `{role:f=v,...}`, `{role@other}` for agreement).
- The dictionary is not SOP Lang: one row per lemma, `lemma<TAB>class<TAB>gender?<TAB>sense?`
  (sense = a k.words or k.actions sense id), sorted, split into files by the first letter
  of the folded lemma, read lazily. A header comment gives the source and licence.
Questions for the worker:
1. Are prefixes or stem changes outside the stem's last alternation needed for the first
   draft? The notation has only suffixes and one alternation per class cell.
2. Which feature names, and which values, will w.lang.ro use (so the templates and
   agreement can name them)?
Not blocking.

## Q38 (Round 29): std.plan — design note, and answers to the knowledge repository's Q44 a–d

**What it is.** `plan(world, goal, { knowledge, budget })` takes a goal (an act on a kind,
or a named task with roles) and the methods of a knowledge world (`k.procedures`, read as
it is published at 1d4f120). It gives a plan: an ordered list of `std.acts` requests, plus
the explanation (the method of each step, and the alternatives it rejected and why).
`applyPlan(world, plan)` runs the plan as one `act([...])`: one undo step, all or nothing.
It is language-free, budgeted and deterministic.
- **Choice among alternatives**, as the format says: the methods of one goal whose goal
  facts fit and whose `world` is the live world's schema (or none), then those whose
  preconditions hold, then the lowest `rank`, then the first by name. When none fits,
  the result is a refusal that names the alternatives and why each failed (a missing
  needed role becomes one question).
- **Decomposition**: a step is expanded by a method whose goal fits it (unless
  `expand=false`), to depth 3. No method is used inside its own expansion.
- **Cost bound**: at most 200 acts and the world's step budget; past either, it returns
  `truncated: true`, never a partial apply.
- **Roles** are filled from the goal, from earlier steps (what they made), from the live
  world (`live`), from history (acts before the plan) and from knowledge facts, through
  bindings and matches. The library resolves plain kind names through the live world's
  schema (`table` → `w.seating.table`). A role still empty goes to `std.fill` /
  `std.know.fill`, as a `make` does.
- **Integration tests**: the expected act lists of the knowledge repository's
  tests/k.procedures.test.mjs, read in place at the pinned commit (farm, swing, family
  photo, set a table, take apart, a chart of the things, a face of a role, Peru on the
  map). Toy tests here: a person on a swing in a toy picture schema, a table for four in
  w.seating, a chart across two views.

**Q44, the format: accepted as published** (seven types, facts only). Answers:
- (a) The map from k.actions roles to std.acts arguments (number → amount, place →
  at / rel / ref, thing → kind or thing, value → attr + value) lives in the library, as
  data beside std.acts: one table (`std.acts.role` facts), not one per host.
- (b) Keys: a history entry is `{ act, kind, thing, args }` (the request and what it
  made), oldest first. An ask step's answer rows are `ask`'s result as of 0.38:
  `things` / `names` for a list, `number` (+ `unit`), `answer` for yes/no.
- (c) The lookup order of `of` is anchor (k.layouts), then wearable place (k.wearables),
  then drawing part (k.objects). The first one that names it wins, and the order is data
  (a `rank` on the source) if the knowledge repository wants to change it.
- (d) Yes: matching up the chain of kinds (is_a, kind_of, a role's `is`) is `std.know`'s.
  It gets a function the planner and `resolve` both use.
Building next unless the reviewer objects. Not blocking.

## Q39 [KNOW] (reviewer 12:45): answers to the knowledge repository's Q46 (the motion format)

The format is accepted as published. `readMotion` and `planMotionFacts` read k.motion as it
is (0.56), and they give the same changes and emitted events as tools/lib/motion.mjs for 12
plans (4 event lists × 3 seeds, test/motion-facts.test.mjs). The knowledge repository can
delete its oracle; PSys2 can drop its temporary rules.
- (a) The splitter is data (`k.motion.splitter`, `k.motion.letters`). A named host function
  (`options.splitters[name]`) overrides it.
- (b) `via` is in the plan's segments. A switching host shows it during onset and back; a
  blending host ignores it.
- (c) The base is the host's current state (`options.base`).
- (d) A cancelled step eases back from where it is: its onset is cut at the cancel time,
  and its back starts then.
- (e) A repeat timer waits from the end of the last run (or from now when it did not run).
Two generalisations, for any face or not:
- the keys are those the layers name (`keys` sets the order of changes at one time);
- the face's "one eye shown as the eyes" is the `aliases` option (`{ one_eye: 'eyes' }`).
Not blocking.

## Q40 [KNOW] (reviewer 16:10): answers to the knowledge repository's Q51–Q53 (w.lang.ro)

Built in 0.63 (src/morph.mjs, test/lang-ro.test.mjs). Read in place at b5d525b: 255 lemmas,
44 classes, 2,904 cells.
- **Q51 (folds): fixed.** The suffix index is keyed by folded suffixes. Round trip typed
  without diacritics: 2,904 / 2,904 (was 2,249).
- **Q52 (alternations): fixed** by generate-and-check over every stem the alternation list
  could have come from:
  - the stem as it is (the lemma already had the result: uriaș, englez, îngroșa);
  - each place the target occurs (two-letter targets such as `o>oa@vowel`);
  - each place a deleted letter may have been.

  Exact round trip: 2,904 / 2,904 (was 2,898). The test's Q52 exception list can go.
- **Q53:**
  - Features: accepted as chosen (num, case, def, gender, person, tense with the values in
    the draft).
  - Articles: the enclitic article is a cell of the noun (`{thing:def=yes}`, as the
    templates do). A separate article word is a closed-class slot only where the language
    writes it apart (the possessive-genitive al / a / ai / ale: a later notation question).
  - Variants: two irregular facts for one cell is the intended way (este / e). `generate`
    returns the first; `analyse` reads both.
- Also: the dictionary indexes each file by lemma and folded lemma; the full round trip
  runs in about 3 s (it was 15).
Not blocking.

## Q41 (for the reviewer, 2026-11-14): std.compose is waiting for knowledge worlds; a reference set for summaries

1. **std.compose waits for the knowledge repository.** At b5d525b, `git ls-tree` of the
   knowledge repository's docs/worlds/ shows no k.genres, k.story, k.interest or w.document.
   Compose (15:00) is a plan of a genre's procedure with choices weighted by k.interest and
   checked against k.story, so it needs those worlds, or at least their formats. Meanwhile
   I build compose's mechanism (a genre's outline as a std.plan procedure, choice points by
   std.sample restricted by constraints, weights from interest facts, sizes as a budget,
   every claim citing a wire) on a toy catalog in the format I propose here:
   `k.genres.genre name= move= (rep., in order) register=`, `k.interest.feature name=
   weight=`, `k.story.constraint name= ...`. I wire it to the real worlds when they are
   published. If the knowledge repository has chosen other formats, please forward them.
2. **A permissive reference set for summaries (16:30 follow-up 2).** The network here only
   reaches package registries and GitHub. Please fetch a small summarisation set with a
   checked licence (for example a CC-BY news or Wikipedia-lead set with reference
   summaries) into the knowledge repository or a pinned repository; the library will read
   it in place.
Blocking only std.compose's integration and the summary measurement; the rest continues.

## Closed

- Q1 (no access to the PSys2 repository): answered, the material needed is in `compat/psys2/`.
- Q2 (`imports=core` without a `core` module): withdrawn after the task list was rewritten.
- Q3 (`core.test` name clash): answered, renamed to `core.check` with `core.test` kept as an alias when linked.
- Q4 (`world.schema` is now `world.matrix`): accepted; listed under Changes in SPEC.
- Q5 (strictness of literal kinds): accepted as chosen; unknown kinds are reported by `world.schema(type).unknownKinds`.
- Q6 (no default parent in the library; `root=` in a type map): accepted.
- Q7 (one commit for G1 and G2): accepted; one commit per task from here on.
- Q8 (a sixth status, `refused`): kept; the compatibility runner maps it to PSys2's `conflicting`.
- Q9 (`complete=true` decides `no` against `unknown`): accepted; `compat/psys2/mapping.sop` reads it from `closed`.
- Q10 (entities outside the session): accepted; the runner tells an `e.user` wire first, and the one `$e.tom` case is to be checked in G8 and listed as a failure if the wire really is absent.

- Q11 (which replace figure is the target): answered, the cost once compiled; no further tuning of the cold run.
- Q12 (the four "received" cases): answered, `count` stays `missing` and the cases stay listed; the host asks for `received` itself.
- Q13 (what a host action sees between batched tells): answered, lazy propagation accepted with three conditions (every involved tell named, `ctx.flush()` and `{ now: true }`, two tests); done in P3.
- Q14 (namespace separator): answered by the user, `::` (the only sign with no other meaning); used in R7.9.
- Q15 (name of a deny's priority): answered, `priority=` kept.
- Q16 (`expr=`): answered, not in v1.2; revisit only with a rule that still needs more than about 8 calc/check wires after the built-ins.
- Q17 (words): answered, (b) `core.word lang= text= means= of=`; built in R9.1.
- Q18 (roles): answered, (a) no `role=`; `means=type.key` carries it.
- Q19 (words left out before assumptions): answered, (b) kept.
- Q20 (`groups=` spelling): accepted, `groups=<value>` or `groups=$<pattern>`.
- Q21 (`value=` on core.word): accepted, no `value=`; `means=<value> of=<type.key>` stands.
- Q22 (one of in a pattern): answered (a); a repeated key stays "all of", "one of" is two denies, no `one_of` built-in.
- Q23 (absent key): answered (b); `absent: [keys]` in the object form and `core.absent=` on question wires, built.
- Q24 (ordered sequences): report accepted; one wire per point stays (no notation inside values).
- Q25 (delegation): answered (a); the pattern becomes `std.fill`, ranks as named tiers.
- Q26 (PSys2's pattern set): answered (a); PSys2 copies patterns.sop and spec 03 into compat/psys2, then the index is measured on them.
- Q27 (ACTS × SCHEMAS): accepted as recommended; shipped in 0.18.0.
- Q-H8 (PSys2 hand-over, knowledge-loader): (a) done in 0.23: `createCatalog` (index, vocabulary, host reader, cache, host lemma, schemas first) and `tools/build-bundle.mjs` writing bundles in the shard format, read by `bundleReader`; refused: English lemma rules, k.objects drawing decode, faces, the evaluation-set generator.
- Q28 (shared store): (a) one value per key, a view restyles in its renderer; (b) the act `complete`, done in 0.24.
- Q29 (instances): (a) `core.use ... as=`, done in 0.24; words told after loading.
- Q30 (the other PSys2 hand-over packages, what to port first): yes to the order, with a check of std.schema.effect against `on.make` first (reviewer 06:55).
- Q31 (the request pipeline as a world): accepted, built in 0.26.
- Q32 (std.grammar design): accepted (a chart over grammar facts, ambiguity ranked, budgeted).
- Q33 (lang.en compared with std.grammar): accepted. The knowledge repo fixes w.lang.en's schema and adds `priority`; then the integration test loads the schema. Continue in the proposal's order.
- Q34 (slot groups, excludes, joins by a key): accepted. The knowledge repo is asked to use them.
- Q35 (proposals to the knowledge repo): forwarded. The inline versions stay until the worlds are published.
- Q67 (`make` and a missing required key): agreed, an open required key is a question (`asks`), no flag (reviewer 06:35).
- Q68 (when the deprecated names of 0.111 go): in the release after PSys2 has renamed, with `calibrate` as score calibration (reviewer 06:35).

## Q69 (for the knowledge repository): what limits Romanian read by frames on PSys2's real turns

`node tools/bench-ro-frames.mjs --rows` (0.115, w.lang.ro at the pin): of 161 real glossed turns, 93 read by a
frame, 74 with the right act, 38 with the right act and thing. The misses are mostly knowledge:
(1) nouns of the real turns missing from the 256-lemma dictionary: crocodil, minge, capră, rață, iarbă, fetiță,
bunic, vilă, leagăn, masă, pește, pământ, baltă (the thing then stays as typed); (2) "și" meaning "too/also"
before the object ("pune și un lac", "mută și mai la stânga") is not a skip word, so no frame takes it;
(3) "stînga" (î for â, the old spelling) does not fold to "stânga"; (4) lists ("un lac, o rață, nori") and
"mai" + direction ("mai la stânga", "mai în dreapta") are one role or none. The library side: (4) lists as
several things of one role is mine (next); (1)-(3) are facts of w.lang.ro.

## Q70 (architecture review findings 8 and 10): the story planner and the request pipeline, not merged yet

Finding 8 (story.mjs and the planner's choice points do one job): agreed, but `compose` works on a World and
the planner on a fact store over published worlds (`factStore(worlds)`) with `k.procedures`' method "write a
story" loaded; moving compose's story moves onto it needs a World-backed store and k.procedures in every
composing host. STORY_RELATIONS is also the one place that knows catalog shapes (k.people holds/uses, k.scenes
has), which R3 takes out anyway. Choice taken: do it in R3 with the catalog shapes, as one change.
Finding 10 (turn / turnFlow, route / arbitrate): agreed; PSys2 has its own route (meta-worlds) and cites
`arbitrate` only in a comment (src/formalizer/routing.mjs:44), so the merge can drop the library's `turn`
and `route` without a deprecation. Choice taken: next release, with the "open tab" criterion made a host
criterion (R3), since both touch std.decide kind `world`.

## Q71 (architecture review finding 15): one clause splitter, with R3

The five splitters (canonicalise, splitRunOn, segment, sentencesOf, storyState's) differ mostly in their cut
words (joiners, openers, fillers, sentence ends), which are language: the fix is one `clauses(world, text)` whose
cut points are language-world facts. That is R3's work (knowledge out of src/), and R3 asks the knowledge
repository for the facts. Choice taken: the splitter merges in R3, together with the cut words; L3 (real rows)
goes first, as 11:35 orders.

## Q72 (reviewer 13:15 item 5, PSys2 Q20): a host kit — the proposed API before building

What every application needs to run worlds, as library parts (PSys2 keeps 96 files for it today):
- `loadWorldSet(loader, { names, lang })` -> `{ worlds: Map(name -> { world, legend, manifest, typed }), catalog }`:
  `loader(path) -> text` (fetch, fs, bundle); parses each world, reads its legend and manifest, builds its typed
  world (`typedWorldFor` with the knowledge its slots join, through `createCatalog`), lazily per world.
- `readTurn(set, text, context)` -> `{ reading (readText under the contract, per world), owner (arbitrate with
  coverage from the readings' unread words), act, reply, asks, trace }`, with the tier policy as data
  (`std.fill.tier` facts and a host's `std.decide.criterion of=world` facts), no host code in the path.
- The session: `session(set)` holds the live world, the timeline (undo / redo / marks: World already has them) and
  the pending fill (a question asked and the slot its answer fills), so "red" after "which colour?" fills it.
- LIB-7 `assignments`: gone in 0.121 (readText + fitsSlot); a lemma function is `readByTypes`' `lemma` option, and
  "any literal is an anchor" is a pattern of the host's reader, not the library's.
Choice proposed: build `loadWorldSet` and `readTurn` first (the compat suite then tests that surface), the session
part after. Waiting for the reviewer's answer before building.

## Q73 ([KNOW], host kit replies, reviewer 13:50 point 2): reply facts for w.lang.en, and an article for w.lang.ro's make

The kit now composes replies from the language world (`replyFrom`: facts of `${lang}.reply` with `act=` and `text=` in
std.morph's template syntax, the fact whose slots are all given, most slots first; else the library's English).
(1) w.lang.en has request templates (w.lang.en.template "add a {kind}.") and no replies: could the knowledge
repository publish `w.lang.en.reply act= text=` for make / remove / change / undo / redo and the open question
("I made a {kind}.", "What {key}?")? (2) w.lang.ro.template make is "am desenat {art@kind} {kind:…} {colour@kind}":
`art` is a role the caller must give as a lemma; a reply fact with the article in the cell (`{kind:…,def=no}` with the
indefinite article as a determiner fact of w.lang.ro.det chosen by gender) would let the library say it without
knowing Romanian. Remove already works with the hand dictionary ("Am șters casa"). Non-blocking: until then the
library's English stays.

## Q79 ([KNOW], composed replies): the plural rules of w.lang.ro and w.lang.en as facts

w.lang.ro.reply has `count=one|few|other` (thank you: "Am adăugat 3 mese." / "20 de mese." both read in 0.134). Which
class a number is in is CLDR's plural rule, i.e. language data. The library reads `${lang}.count class= rule=` (CLDR's
rule syntax: n, i, v, f, t, `%`, `=`, `!=`, ranges `a..b`, lists, `and`, `or`; the first rule that holds, else
`other`). Asked: `w.lang.ro.count` (one: `i = 1 and v = 0`; few: `v != 0 or n = 0 or n % 100 = 2..19`) and
`w.lang.en.count` (one: `i = 1 and v = 0`). Until then a Romanian 3 is `other` ("3 de mese"). Also: a kind's word in
each language (w.seating.table → "table" / "masă"): the schema's core.word is English; the kit takes a host
`wordOf(type, lang)` until a language world maps kinds to its lemmas.

## Q80 ([KNOW], seating in Romanian, reviewer 16:45 item 2): what w.lang.ro lacks for probe B

On examples/seating-app.mjs ro (0.136): "adaugă o masă numită familie", "adaugă o masă rotundă numită copii",
"șterge masa familie", "anulează" read and run, with replies from w.lang.ro.reply. Missing: (1) the noun `invitat`
(guest) in the hand dictionary: "adaugă un invitat numit Ana" reads `invitat` as the participle of `invita` (no sense),
so the guest turns fail; (2) replies for an open key and an empty timeline: `ask.key` ("What {key}?" / "Ce {key}?")
and `nothing.undo` / `nothing.redo` (the kit uses them when present, English otherwise); (3) a kind's lemma per
language (Q79): the host gives table→masă today.

## Q81 (answer to the knowledge repository's Q79: two plurals for one singular)

Yes, from 0.139: give each pair its register (`w.lang.en.irregular singular=cactus plural=cacti register=classical` and
`... plural=cactuses register=common`). `inflectBy` writes the common one (or the one with no register) unless the caller
asks a `register`; `inflectBy(..., { all: true })` gives both for a reader; the singular of either is cactus.

## Q82 ([KNOW], reviewer 17:55): the kit's reply names, in w.lang.en.reply and w.lang.ro.reply

The kit now says every sentence by a reply name (`KIT_REPLIES` in src/kit.mjs: roles and an English default). The
catalog has 5 of the 31 (done.add, done.remove, done.change, done.undo, not_understood). Asked, in both languages, with
`count=` where a number comes: done.redo, nothing.undo, nothing.redo, ask.key {key}, ask.make_missing {name, kind},
ask.which_world {worlds}, ask.count {given, number}, not_understood.fragment, not_understood.statement,
refused.no_place {kind, rel, place}, refused.cannot_be {thing, value}, refused.no_such {thing}, refused.no_world,
refused.no_host, refused.fragment {value}, refused.value {key, value, values}, refused {why}, too_complex.none,
too_complex.rest, answer.no, why.asked {request}, why.told {key, value}, why.default {key, value}, why.other {key, value,
tier}, why.nothing, why.none, and (0.143) the std.acts refusal codes refused.not_allowed {kind}, refused.no_world_kind
{kind}, refused.no_key {kind, key}, refused.not_a_number {key, thing}, refused.missing_value {key}, refused.which {kind,
number}, refused.no_room {kind}, refused.no_world_named {world}, refused.no_kind_in {kind, world}, refused.no_relation
{relation}, refused.no_aspect {kind, aspect}, refused.nothing_to_show {view}, refused.bad_value {key}. test/kit-replies.test.mjs realises every name the catalog has (no English word in a
Romanian one) and lists the rest as a todo. Also words for keys (w.seating.table.name → nume) for `{key}`.

## Q35 of PSys2 (worker, 0.148.0) — for the reviewer
Answered in 0.148.0: std.decide kind `intent`, `chooseRewrite`, readTurn `rewrites` / `dry`, and the cutter. Note: the
library's `clauses` never cut inside "water lily" or "work done" (no cut point there); the cut the application saw is
either its own splitter or the cut at "and" before "the third water lily", which no longer happens. PSys2 does not read
through a kit set today, so `chooseRewrite` with its own `_understands` as `read` is the call that replaces its loop;
`readTurn({ rewrites })` is the same choice for a host on the kit. Delete when satisfied.

## Q83 (worker, 0.149.0) — requests as worlds: for the reviewer, PSys2 and the knowledge repository

0.149.0 has readRequest / reviseRequest / planRequest / runPlan / sayRequest (api.md "readRequest", CHANGELOG). Choices
taken while waiting, each open to a decision:
- **Capabilities** are declared with a new std.schema type, `std.schema.honours act=<act> on=<key>... of=<thing>...
  [world=]` (keys = the w.request constraint keys). PSys2's `w.honour act= keys=a,b target=` maps one to one (keys -> on,
  target -> of). A world's own defaults are facts of the k.expect shapes (`k.expect.make`, `k.expect.part`, `k.expect.scale`,
  `k.expect.amount`) told in the live world; they come before the catalog's (`sources` order). [KNOW] should
  std.schema.honours be published in a w.* schema instead (the library would read either)?
- **Why texts** of not_honoured (`{why}`) are short English phrases made by the library ("this world does not take
  attribute for make"); `code` (not_declared, no_slot, value, no_kind, nothing_left, one_kind, no_act, no_target, act,
  unit, not_allowed) is given with each. [KNOW] reply names `not_honoured.why.<code>` in w.lang.en / w.lang.ro would let
  sayRequest say them in Romanian; it uses them as soon as they exist (planned, not yet read).
- **Reject** flips every kind of the last result to not wanted (the revision fact says "the kinds said, or the kinds of
  the last result"); exclusions that would leave nothing give way, the oldest first, and are named (nothing_left).
- **Redo** (does=keep) and reject plan with `vary` (sampled like "random") so that "again" gives another result.
- **put_back** returns the previous request with its seed (`undo: true`); the host runs it in place of the last result.
- Colour words the world lacks are read through `VALUE_TYPES` (k.colours.basic / k.colours.colour names in the catalog)
  so that "in red" is named, not dropped.
- PSys2's Q36 (clauses joins two requests across "and the") is not done in this release.

## Q84 (worker, 0.150.0) — the reasoning cycle in planRequest: choices taken, for the reviewer and PSys2

0.150.0 (CHANGELOG, api.md "factsOf", capabilities "Reason a little") has factsOf and the propose -> simulate ->
deduce -> abduce cycle, with induction before it. Choices taken while waiting, each open to a decision:
- **What is a candidate.** Generic dimensions only: where the items go (a slot of every item kind that refers to things,
  `type=` of the slot, when they do not go in a whole made with them), a place said by a kind ("in the pond") or by a
  reference word ("there", "here", the language's place pronouns, "in it"), and a fall-back without induced/dialogue
  values when a candidate breaks a hard constraint. Random variants (other seeds) are not candidates yet.
- **Hard vs soft.** Hard: what the world refuses in the dry run (types, enums, deny, std.schema.capacity), a relation to
  nothing, the plan's `bounds` (kinds not wanted, the count said). Soft: catalog expectations (`placed`) and open
  required keys (a missing value is an open question, not a contradiction). Catalog knowledge is never hard.
- **Weights.** An assumption costs the index of its source in `sources` (said 0 ... sampled 5); an inference chain costs
  0.25 per step (container's own kind 0, a fact of its kind 1, of an is_a parent 2). Criteria order (std.decide kind
  `plan`): consistent, honoured, expected, cost, assumptions, near. A world can declare its own `of=plan` criteria.
- **Reference words.** Only places are resolved by the cycle; "it" as the target stays the dialogue's last target, as
  before. "the rest" is not read yet (no generic meaning found without a selection world); say if you want one.
- **Induction** works on enum keys and `size` of the item kinds (not identity, not references, not std.schema.thing keys)
  and on the whole's `layout`; corrections: the last two with the same `on` and step (size or count) make a new request
  one step smaller / bigger. PSys2's session must keep `dialogue.corrections` ([{ on, step }]) and pass `replace` (the
  ids a revision removes) for both to work; `examples/request-app.mjs` shows it.
- **Kind facts** come from the catalog worlds passed in `catalog`: load k.commonsense.thing, k.scenes.thing,
  k.kinds.parent there (`requestKinds()` in the example; 0.5 s here). [KNOW] a compact `k.kinds.place` (kind -> the
  places it is usually at, and which kinds are such places) would make `placed` cheaper and cleaner than reading
  material / is_a rows; the rule reads any type listed in KIND_FACTS.
- std.acts' capacity message says "fishs" (plural by +s); not changed here.

## Q85 (spell repair 0.151.0)
- Thresholds (`SPELL`) and priors are first guesses, not tuned on real user typos; PSys2 phrase logs should calibrate them (maxCost, margin, minLength 4).
- Words of 3 letters or fewer are never repaired; multi-word joins/splits ("greencircle", "sh ape") are not handled.
- The language dictionary is the `<lang>.*` wires of the language world passed (`language`); a large external morph `dictionary` is not enumerable, so pass its word list as `dictionary` if wanted.
- Should an `ask` flow into `sayRequest` ("did you mean X?") and the dialogue? Today `request.spell.asks` is only data; the host decides.
- Typos that are themselves known words (e.g. "fist" for "fish") are never changed by design.

## Q86 (worker, 2026-11-15) — the rewritten skills: your opinion, please
The skills were rewritten to the owner's direction (worker-log, "Skills rewritten"). What I would like your view on:
1. The order of pieces (declaration, knowledge, language, composition, method, library) and the triage by request
   evidence (`skills/lib/honest.mjs` `triage`): is a `not_declared` refusal rightly `piece: none` unless the user
   expected it?
2. The honest-list format (skills/HONEST-LIST.md): should it live in each host, or should the library publish a
   `w.honest` schema so rows can be wires?
3. The patch-smell hints (`skills/lib/smells.mjs`) are heuristics; are there smells you see in reviews that are
   missing (e.g. a threshold tuned to one case)?
4. The generated properties (`skills/lib/declarations.mjs`) found real declaration gaps in the example worlds (sketch
   honours extent/layout for shapes that have no such slot; notes honours size with no slot; remove/change/connect
   have no honours). Should the example worlds be corrected, or kept as they are as teaching material?
**Choice taken while waiting:** the example worlds and src/ are unchanged; the skills and their dry runs are in use.

## Q87 (worker, 0.152.0 tool binding) — open points
1. **Catalog proposals** (I cannot write sop-knowledge-worlds): the cues `ask.capabilities` / `ask.state` (reaction
   values `capabilities`, `state`) and the replies `can`, `can.say`, `state.count`, `state.empty`, `nothing.same` are in
   `examples/tool-app.mjs` PROPOSED_EN, told into the language world by the example and the tests; please publish them
   in w.lang.en. Also the shape `k.expect.when` (today read untyped from the world and the catalog; no schema).
2. **Primitive call style**: one object of named arguments (`add({ kind, n, size })`), not positional. Say if PSys2 wants positional.
3. **Plans of remove / change** are bound and used by undo, but `planRequest` still plans only make (and connect);
   "remove the comics", "paint them blue" need a planner step over the view (a reference resolver on the mirrored state).
4. A no-op revision ("in red" after the same) is detected after the fact (redo alike, `same`), and the tool did undo +
   redo with new ids; a pre-check of the revised request against the last would avoid the calls.
5. An unread noun where the kind stands ("add 2 dictionaries") still falls back to the dialogue's target (existing
   planner policy: the act is never guessed over unread words, the target is). Should an unread content word block the
   target fallback, like the act?
6. Induction over the mirrored state (3 red novels -> the next books red) is the designed source order (induced > world >
   expect); an unconditional kind expectation (an atlas is big) loses to it, a conditional one whose conditions hold wins.
7. The lint for live-world JS (reviewer item 7, skills/lib/smells.mjs) is not extended here; the tool-world property
   checks a primitive's source names no declared kind and reads no request.

## Q88 (worker, 0.152.1) — reconciling 0.152 with reviews/legarea-declarativa.md: what I aligned, what I did differently and why
Aligned (0.152.1): `std.tool.arg bind= param= from=` (the inline `arg=` kept as a short form: one parser, no cost);
`std.tool.needs op= exists=` (plus `absent=`, `check=<custom>`); `std.tool.param kind= type=<world kind> default=
required=true`; `std.tool.bind world=`; `makes` from the op's `effect=makes`; sources `state.<…>` and `result.<n>`;
`k.expect.value on= value= when.<key>=` (0.152.0's `k.expect.when key= if.` still read); §24 references for remove /
change (one question when ambiguous, `refused.no_such` when nothing matches); §35 "a message read only in part executes
nothing" (in `toolSession`); the review's order for executor steps (binding by lineage, sources, default, preconditions,
call, effect on the view). Not aligned, or a choice I made where the review is open:
1. **`type=` has two readings.** In §11 (d) `type=box` on `kind` means "a kind of box" and `type=shelf` on `on` means
   "a thing that is a shelf". I resolve by the value: an id found in the view is checked by its kind, anything else is
   read as a kind name and checked by lineage; a `type` whose rows have an `order` is a scale. Would you rather
   have two keys (`type=` for things, `of=` for kind names)? That would be clearer, and it would need you to edit §11.
2. **`state.<relation>` (§25) is `state.<kind>` here**: the thing of that kind that the request names, else the
   newest one in the view. A relation path (`state.on`: what the step's thing is on) needs the step's thing to
   exist first, so it is not done. Is the kind form enough for now?
3. **`k.diagram.role role=start shape=ellipse` (§20)**: I did not add a second shape. The same fact is `k.expect.value
   of=node on=shape value=ellipse when.role=start`, and planRequest gives each item its role from the plan's links.
   A table per domain would be a second mechanism for one job, which is on the smell list (§42). Proposal: one form.
4. **Order of a parameter's declared `default=` and the expectations.** The expectations (knowledge, `k.expect.value`)
   come before the parameter default (§25 step 2 puts the default on whatever is missing). Reason: the default is the
   tool's, while the expectation is knowledge about the thing and may be conditional. Do you agree?
5. **§35 "a partly read message executes nothing"** is applied in the tool door (`toolSession`) only. `planRequest`
   itself now refuses only to guess the target over an unread word. The World-native session of
   `examples/request-app.mjs` and its tests (P1-P11) still act when some words are unread and report them. Should
   the rule move into `reviseRequest` / `planRequest`, so that every host gets it?
6. **The question of §24 ("which circle?")** is said (`refused.which`, no step). The answer to it ("the red one",
   "the second") is not yet resolved against the open question in the dialogue. That is a dialogue piece (an open
   question in `w.dialogue`), and it is next if you agree.
7. **Constraint keys as wires (owner question 2, §IX):** not done. `REQUEST_KEYS` and the `on=` enum of
   `std.schema.honours` stay fixed. Proposal: `std.schema.key name= value_kind= scale=`, read by readRequest,
   planRequest and the honours check, so that a domain can bring `tempo`.
8. **Names (owner question 1):** kept `std.tool.*`. If the owner chooses `std.schema.*`, aliases are cheap
   (rowsOf over two type names).
9. **"The abduction of the place" (§39, the first shelf with room)** happens in `planRequest`'s cycle on the mirrored
   state (`mirrorState`), not in the binding. A binding takes the place from the plan (`step.<key>`) or from
   `state.<kind>`. That keeps the choice in one mechanism.
10. **The review's §11 example keeps colour as `kind=atom` with no join.** The author-live-world skill asks for a join to
   k.colours. My examples keep a short enum, because they are toy worlds under 60 lines. Tell me if the examples
   should show the join.

## Q91 (worker, 0.154.0) — PSys2 Q46 / Q47: what became generic pieces, what is open

Built (CHANGELOG 0.154.0, `test/references-fragments.test.mjs`): Q90 (`stateIds`), Q46 (4) askWorld kinds, (5)
`when.<key>=none`, (7) `std.tool.value op= param= value= as=` (forward only: a view that reports the tool's name is
not mapped back yet), (8) names as references, (9) = Q90, (10) fragment continues the last act, (13) / Q45 (7) a size
reaction keeps the count; reviewer 05:20 A (proven through world acts too) and B.

Open, for the reviewer:
1. [KNOW] `w.dialogue.revision`: please add `reaction=continue` (and `does=inherit`) to the enums so a language can
   declare the continuation row; the library defaults to does=inherit on=act, nothing replaced. And "more" is a cue of
   reaction enlarge with no key, so it still steps count and size: a `w.lang.en.cue` "more" on=count step=up (twin of
   the reaction) would make it count only by the 0.154 key rule, no code.
2. Q46 (1) links for parts with none, (2) labels / topic of a whole from k.diagrams, (3) kind by role in the links
   (expectedValue on `kind`, yielding to kinds not wanted), (6) layout translation by k.layouts parents, (11) "with
   arrows" as the whole's links, (12) a layout said over things there = arrange: each a planRequest piece of its own;
   not small. My order if you agree: (3), (1), (12), (6), (2), (11).
3. Q47 (1) Romanian reply rows for `assumed`, (2) the "how many" lead of ask.state: [KNOW] only.
4. Names: a thing's name is any free-text value or its id. A world that wants only one key as the name would need a
   declaration (e.g. `std.schema.key name=label names=yes` with the planned `std.schema.key`); not added before
   `std.schema.key` lands.
5. A fragment says "I assumed make for the act" (the act from the dialogue is an assumption like any other). Keep, or
   silence the act assumption when the source is a continuation?
6. Still in your order from 04:10: unread-word rule inside planRequest, `std.schema.key`, open question as a
   w.dialogue fact.

## Q92 (worker, 0.156.0) — what is left of the PSys2 honest lists after 0.156, and what is the host's

Built in 0.156.0 (CHANGELOG, `test/revise-names.test.mjs`): the reviewer's 08:25 wrong execution ("fewer cats" kept
the dog out: it was mine, in `reviseRequest`), a count revision of a whole keeps the whole and the sizes, a general
whole as one of its subkind wholes, "all the X", a place by a thing of the view (`region` / `relation` on the steps),
"make the house bigger" as change, the whole said first, "I like cats" a statement. Checked through PSys2's door probe
(`scripts/request-probe.mjs` run read-only with a loader hook that swaps its vendored file for `src/index.mjs`).
Open, each with whose it is:
1. [PSYS2] "a random picture" / "a picture with a lake": the plan is now a forest / a pond with parts, but the door's P9
   check refuses it because the request's determiner count is `of=picture` and `plan.target` is the subkind. The check
   should accept a count of a kind the plan's target is a subkind of (`kindLineage(plan.target)` includes `c.of`; the
   plan's assumption `{ key: 'kind', of: 'picture' }` says it).
2. [PSYS2] "move all the fish into the water": the steps now carry `region: '$<lake>'` and `relation: 'in'`; art.draw
   binds `anchor<-custom.thingAt` and has no relation. Bind `anchor<-step.region` (and a relation argument when the
   engine can put a thing in a region rather than next to it).
3. [PSYS2] "fewer cats" through the door still begins "I made it again, the way you said." (the host's own revised
   flag; the library's `toolSession` drops it for a whole and for reference plans).
4. [KNOW] The wish words: w.lang.en.skip class=desire mixes want / need / wish (a wish) with like / love (a preference
   unless after a modal). The library now reads a wish only after a modal or before an introduced thing, so "I want
   cats" (bare plural) is read as a statement too. A split row (class=preference, or `after=` modals) would let it go
   back; I read it when it is published.
5. [LIB, not done] "and higher" after a move: with 0.156 a turn of new values only after an act on things is the same
   act on the same things, so it should now be a further move; not verified on the Romanian turn (T12). The layers
   arrangement ("break in 3 layers: water, land and sky") as an arrange by declared regions, and "add arrows" (links for
   the parts that have none, Q46 (1)) are structure operators I have not built: next, if you agree.
6. [LIB, small] "I'd like 2 birds": the tokenizer keeps "i'd" as one token (unread, honest); a clitic split from the
   language world (w.lang.en contractions) would make it a wish.
