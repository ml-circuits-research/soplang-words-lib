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

## Q94 (worker, 0.157.0) — what is left of Q93
Built (CHANGELOG 0.157.0): (1) no remake after a step; partial reading never executes (in `planRequest` / `runPlan`);
Q93 (2) the case "fewer X with no X in the result"; (3) and (4) a count said with "with"; (5) `done.place.<relation>`.
Open, each with whose it is:
1. [PSYS2 / LIB, needs a probe] "fewer flowers" on a garden when flowers ARE in the garden's parts: the example worlds
   do not reproduce the "7 made, the request said 3" refusal (fixed here for the with-count form and the absent kind);
   if it still shows through the door, send the plan (`plan.bounds`, `plan.assumed`) of that turn.
2. [LIB, decision] A constraint the world's act does not take ("in the corner" for make: `not_honoured`, code
   `not_declared` / `no_slot`) still lets the rest execute and says "I could not do ...". That is a world capability
   statement, not an unread word, so I left it. If the owner wants any not-honoured place constraint of a move to
   refuse the whole turn, say so: one line in `planOnce` (act place with a not-honoured place constraint -> `ok: false`).
3. [KNOW] The reply `done.place.<relation>` rows (into, next to, ...) belong in w.lang.en / w.lang.ro replies; on a
   Romanian turn the move still comes out in English until the region value has a word for `done.change.place`.

## Q95 (worker, 0.162.0) — the avatar's PSys2 Q96 [LIB] list (slice A1), Q97, Q98: what became generic, what is open

Built (CHANGELOG 0.162.0, `test/face-world.test.mjs`, example `FACE` in `examples/tool-app.mjs`): Q96 (1) joined kinds in
the reader's lexicon; (2) the world's own kinds and words before the catalog's (a std.schema.drawn row is no longer needed
for a joined kind the world names itself); (3) values of a slot typed by a catalog type, and a value with no thing named is
a value of the one thing that has its key, never a make of a kind ("make her angry"); (4) joined kinds of several words;
(5) the verb's value (`reset` = the declared defaults); (6) and (12) phrasal make / remove ("put a hat", "put on X",
"take off X"); (8) plural-noun kinds and their replies, a change of kind said as the whole ("The face is a boy now.");
(10) "give her a crown" as a make; (11) joined kinds of a type of the world: `std.schema.kinds ... as=part` (the host's
world instance should add `as=part` to `j.part` and `as=face` to `j.preset`; then "make green eyes" finds the colour slot).
Q97 (a) stand-ins and quoted names, a stand-in planned as its base, (b) the join map shared by forks and the lexicon
memoised per catalog version (a 2,000-row join: first turn ~130 ms, later turns a few ms here); the host can drop its
stand-in that passes the kinds a turn says. Q98: a joined kind takes the slots of the type it is joined as (`as=`).
r0019 "for their grandma do it" (unread, nothing runs), r0129 a place with a side.

Open, and why:
1. Q96 (7) and (9): a second step after a change ("bigger" after "make the eyes bigger", "move it up" twice) — the step is
   reaction-driven and re-runs the last plan; it needs the reaction to step from the value the thing has now
   (referencePlan's `stepped` does that for a said size step). Next release, with a property over the shelf and the face.
2. Q96 (10) second half: "raise the eyebrows" — the verb's own direction (k.actions place `raise`) has no data link to a
   direction value yet; I propose `k.actions.verb ... direction=up` (as `value=` for reset) [KNOW], and then the library
   reads it as the place of the step.
3. [KNOW] rows I used as proposals in `examples/tool-app.mjs` PROPOSED_EN: the cues `step.next` / `step.previous`
   (`on=attribute step=up|down takes=thing lead=next|previous`), the reply `refused.can_be`, plural-noun irregular pairs
   (`w.lang.en.irregular singular=eyes plural=eyes`, glasses, ears, eyebrows, cheeks ...), and `<reply>.plural` rows
   (`done.change.plural` "The {thing} are {value} now.", `refused.no_such.plural`, `done.add.plural` ...: English fallbacks
   in the library until then). The `about` cue lists `for` as a lead; with prep `for` role=beneficiary the library now keeps
   "for <possessive> X" unread; a purpose "for the water cycle" stays a topic.
4. [HOST] Q96 DECISION (the popup's view) is the host's.

## Book

### Round 1 — specification completeness and refactoring alignment

Reviewed book version 12 at `de1175d`, together with both refactoring documents. Owner instruction: prioritize a conceptually independent, explanatory specification; the reviewer improves the book. These are open questions, not implementation orders. Please answer through revised book text and a response in worker-tasks.md. Questions remain until the revised text resolves them.

#### B01 — Specification authority

**Location:** 1.3; refactoring changes §3.1, §8.

Chapters 2–3 describe the implementation today; chapters 5–7 mix present and proposed behavior. Can the book state the intended semantics independently of current code, with implementation status in a separate conformance appendix? Which statement wins when current behavior contradicts a target rule? Please distinguish required behavior, example, policy choice and unresolved decision. Otherwise refactoring cannot use this as its acceptance specification.

#### B02 — Points and repeated values

**Location:** 2.1–2.2; 3.2; 4.8.

The fish example gives `at=120,540` geometric meaning, while §2.2 calls it an atom and §3.2 uses repeated numbers. What is the canonical point representation, axis identity and equality? Are repeated values a set, multiset or ordered sequence? Show two equal coordinates, reordered coordinates, an omitted axis and an extra axis. This determines whether position survives serialization and composition.

#### B03 — Identity and lifetime

**Location:** 2.4–2.6; 5.3.

Types are names, facts and schema have separate ids, and cross-world links identify concrete things. What does a reference denote when a fact and schema wire share an id? What happens on deletion, copying, import, rename and reload? Can a reference be unresolved temporarily, and when must it fail? Please specify identity without relying on a host constructor.

#### B04 — Unknown, false and completeness

**Location:** 3.3–3.6; 3.9–3.10.

An absent value is unknown and an explicit negative must be written, but what is its exact form and scope? How do explicit negation, absence of a match, a complete type and an open slot interact? Give truth tables and a meeting example with unknown duration, known absence and contradictory evidence. Define which constraints are relevant to a change, including other meetings sharing its room.

#### B05 — Ontology coverage and bootstrap

**Location:** 4.2–4.3; 4.7–4.8.

The concept list is called complete, yet §4.8 declares only spaces, axes, regions, degrees and acts. Where are concept identity, roles, relation endpoints, quantities/units, statements, scope, resources and constraints declared? How does the legend describe its own types without infinite recursion? Please give a dependency map and explain which apparent overlaps are specializations (duration as quality/time, participant as role/belonging, order as place).

#### B06 — Numeric metric and regions

**Location:** 4.4; 4.8.

Distance and nearest realizable point are promised, but axes have no unit/weight and a region has one `spread`. How are units normalized, circular distances computed, missing dimensions handled and boundary membership decided? Can regions overlap or be disconnected? Is `inside` asserted or proven? Show the numeric result for a circular hue boundary and a tie between equally near feasible values.

#### B07 — Graph meaning and unknown concepts

**Location:** 4.4.

The book says that if no graph for memo is known, the closest is a short letter. Against what representation can distance to an unknown memo be computed? Specify graph identity, required versus optional parts, edge labels, graph distance, ties and refusal when evidence is absent. A shared number of parts must not silently substitute a different intent.

#### B08 — Comparison and learning

**Location:** 4.5; 6.5.

The first comparison source with something to say wins; comparative steps allegedly need no comparison class. What statistic defines the reference for several objects, what determines the numeric step, and what happens with zero, negative, extreme or single observations? Does bigger mean an additional request or evidence that the previous interpretation was wrong? Specify learning scope, provenance, undo and promotion to shared knowledge with one numeric worked example.

#### B09 — Formal acts and authorization

**Location:** 4.6; 4.8.

`before="object exists"` and `after="object is at goal"` are prose. What structured propositions express conditions, effects, unchanged properties and role binding? Does asking to move an absent named object authorize creating it, or require clarification? Show how copy/swap are derived, including preservation of identity and references, and how planning terminates when prerequisites cycle.

#### B10 — Inheritance and exceptions

**Location:** 5.2–5.3.

All kinds form one tree, with inherited capabilities, realizations and defaults. How are orthogonal classifications represented, and how are conflicting inherited defaults resolved? Distinguish semantic kind inheritance from type inheritance and a visual substitute. What proves that a restriction is compatible, and which hard rules may never be overridden? Give a legitimate particular exception so the generality lint does not reject useful knowledge.

#### B11 — Spatial frames and time

**Location:** 4.7; 7.4.

Near, above, afternoon and later need a reference frame. Define origins, axis direction, units, containing frames and conversion. For calendar specify date, time zone, daylight-saving ambiguity, interval boundaries and recurrence exceptions. Is a room free when one meeting ends exactly when the next begins? What happens when tomorrow has two occurrences of the requested local time?

#### B12 — Norms versus facts

**Location:** 1.4; 5.1; 6.9.

Fish in the sky is an allowed override of common sense in §1.4, but §6.9 uses it as an example of invalid observed state. Is this a soft issue or a hard violation? Which declaration turns a fact/norm into hard or soft policy, for which context? Likewise are every letter signature and every single-start flow structural requirements or defaults?

#### B13 — Interpretation and ambiguity

**Location:** 6.2–6.4.

What is the contract from utterance to request when several readings are possible? Define attachment, quantifier/negation scope, unread words and confidence independently of the current parser. Show two readings of a request about red and blue nodes, and state when execution must wait. How does a user answer an old question after changing topic, and when does its context expire?

#### B14 — Approximation policy

**Location:** 1.4; 6.1; 6.5; 7.4.

An occupied explicit time requires confirmation, while later can choose a nearby free time. Exactly what authorizes approximation, where is tolerance declared, and can a user override it? Distinguish hard intent from preference, numerical closeness from semantic acceptability, and zero tolerance from an absent tolerance. Give acceptance/refusal boundaries.

#### B15 — Domain and cross-world selection

**Location:** 2.6; 5.3; 6.1.

Capabilities select a domain, but what if drawing and diagram both support red circles, or a chart reads calendar and writes diagram? Define ambiguity handling, explicit target precedence, read/write ownership and snapshot consistency across worlds. Is the chart a snapshot or a live view, and what happens when a source meeting is removed?

#### B16 — Independence and transactions

**Location:** 6.6; 6.9.

Partial execution is permitted for independent requests. How is independence proven across resources, shared derived facts and indirect constraints? Unknown dependence must have an outcome. Define when the snapshot becomes stale, revalidation, retries/idempotence, compensation failure and observable state after each failure. How does one undo step work if one participating tool cannot undo?

#### B17 — Revisions and undo

**Location:** 6.4; 6.9.

A reaction replaces the corrected step rather than adding one. After make, bigger, a manual move, and bigger again, which objects and properties does undo restore? Does learned preference revert too? Define boundaries between revision, a new act and an answer to a question, including changes from another domain.

#### B18 — General reasoning versus domain functions

**Location:** 6.8; 7.3; 7.5.

§6.8 permits domain searches for a free position, layout and composing text; §7.5 forbids domain code from choosing place and values. Where exactly is the boundary? Define function inputs, outputs, constraints, evidence and failure. What knowledge allows compose to produce a letter without inventing claims, and how is its output checked for topic, length and tone?

#### B19 — Honest answers and observability

**Location:** 4.6; 6.9–6.10.

A postcondition can already hold before execution, and another actor can cause a matching change. How do responses distinguish already satisfied, changed by this request, partial success and unknown outcome? Define the observation contract, relevant unchanged fields, provenance and non-action reply forms (questions, refusals, explanations). One frame per act alone does not explain these outputs.

#### B20 — Complete domain examples

**Location:** 7.1–7.4.

Chapter 7 calls each block the whole declaration, and the calendar says nothing more is needed after the denies. Yet executable contracts require imported concepts, units, resources, tool bindings, state observation and language/knowledge dependencies. Can each example identify every dependency and trace one success, ambiguity, missing value, hard failure and undo, with concrete before/request/plan/after data? Mark schematic excerpts explicitly until complete.

#### B21 — Refactoring traceability and stale decisions

**Location:** refactoring/plan-generalizare.md §§4,6; sop-worlds-schimbari.md §§5.3,8; book §§1.3,7.

The phase plan still orders avatar among four domains and per-message language detection, whereas the changes document has drawing/diagrams/documents/calendar, leaves avatar undecided and uses the language selector. It also points to old course lessons. Which plan is authoritative? Please reconcile both and map every task to stable book requirement ids, dependencies, evidence and an approval gate. Phase 0 marked done needs its actual inventory references.

#### B22 — Acceptance and migration

**Location:** refactoring changes §§3.1,7–8; book §7.5.

Keeping engine tests unchanged conflicts with intentionally changing fact/pattern semantics and validation outcomes. Which tests assert enduring semantics and which record old behavior? Specify version/pin migration, stored-state compatibility and failure recovery across the three repositories before removing the old path. Keep removed-domain cases separately counted so improved percentages cannot come from changing the denominator. How will the calendar demonstrate generality when it already guides the design?

#### B23 — Completion criterion for this review

**Location:** 1.3; Annex C; refactoring §8.

Can we define book readiness as: every concept defined without circular references, each normative rule linked to examples and counterexamples, every example dependency explicit, every unresolved choice recorded, and every refactoring task mapped to approved requirements? Please distinguish editorial clarity from design approval and implemented conformance; a passing current test cannot establish the intended semantics.

### Round 1 supplement — owner requests operational depth and design alternatives

The owner explicitly asks us to go deeper before reviewer answers: explain how spaces, rules, interpreters, concept retrieval and multiple reasoners actually work. The alternatives below are proposals for discussion, not accepted architecture. Please decide in the book, explain why, and flag choices requiring owner approval. Existing PSys2 code is evidence of missing contracts, not the conceptual authority.

#### B24 — Teach adding a space, end to end

**Location:** 4.4–4.8; 7.2.

What exactly does an author write to add a space the engine has never seen? Please teach this using diagram clearance: axes and units, valid points, distance, regions, comparison, tool realizability, and links from slots. Show all wires and intermediate results, not just type names. Proposed approach: a small declared algebra of space operations with explicit contracts; reuse its metric when sufficient, otherwise register a pure typed distance function. Alternative: arbitrary per-space code. Which operations must remain generic, how is capability absence reported, and what experiment proves that no domain switch was added?

#### B25 — Teach writing and evaluating rules

**Location:** 3.4–3.7; 4.6; 6.8.

How does an author express a rule over a new space, attach it to a concept and know when it runs? Work through room capacity and interval overlap from declarations to variable bindings, function calls and violation evidence. Proposed separation: derivation rules, hard validity constraints, soft preferences, act preconditions/effects; each has a declared applicability scope. Specify recursion, negation, ordering, conflict and termination. Show a cyclic rule and an unavailable function, with precise outcomes. Must derived rules be independent of declaration order?

#### B26 — The interpreter pipeline

**Location:** 2–3; 4.8; 6.2.

What does interpreting a wire mean at each stage: tokenization, parsing, name/reference resolution, schema checking, concept binding, rule compilation, runtime evaluation? Give one consistent intermediate representation with source locations, literal/reference distinction and semantic role. Proposed approach: one parser and semantic representation used by all consumers, followed by validated projections for tools. PSys2 src/knowledge/catalog.mjs currently has its own parseLine/parseShard; src/dialog/request.mjs generates declarations with regexes in catalogWholes. Which of these responsibilities survives, and how do we avoid a second interpretation of the same wire? Show a multiline fact, quoted text and a reference through every stage.

#### B27 — Gather the relevant wires of a concept

**Location:** 4.2; 5.2–5.3; 6.8.

Given a concept id and a task, how do we obtain its definition, ancestors, slots, spaces, rules, words, defaults, parts, realizations and current instances across shards? A word-to-shard index is not that contract: src/knowledge.mjs plans dependency schemas and vocabulary-selected shards, while PSys2 catalog.load filters k.objects. Proposed approach: typed forward/reverse indexes plus dependency closure driven by the requested operation, returning wire ids, versions, provenance and a coverage certificate. Define the edge kinds traversed, stop conditions, cycle handling and distinction between semantic relevance and retrieval optimization. Trace duck -> bird -> realization, and meeting -> participant -> all overlapping reservations, including rules that mention an ancestor rather than the requested concept.

#### B28 — Retrieval completeness and absence

**Location:** 3.9; 5.3–5.4.

When may a reasoner conclude there is no conflicting meeting if some shards have not loaded? Proposed result: known data plus coverage scope, missing dependencies and snapshot version; absence is conclusive only under a declared closed scope. Alternatives are eager full loading or explicitly incomplete reasoning. Choose the semantics first. Show network failure, stale cache, newly published constraint, and a query that discovers another required shard. How are cached conclusions invalidated, and can execution proceed under partial coverage?

#### B29 — Plug in another reasoning engine

**Location:** 5.4; 6.8.

How can an author select or add forward deduction, backward query, constraint solving, planning or optimization without changing domain declarations? Proposed interface: supported logical fragment and operations; input snapshot, goal, hard constraints, preferences and budget; output substitutions or candidate plan, status, assumptions, evidence, completeness scope and cost. Define an unsupported-fragment outcome instead of silently ignoring a rule. PSys2 src/reasoner/index.mjs already maps statuses (including unknown -> missing): what distinctions must the future contract preserve? Please give two engines solving the same calendar problem and a case only one can solve.

#### B30 — Compose reasoners without unsound conclusions

**Location:** 6.8–6.9.

Who orchestrates deduction, retrieval, candidate generation, solving and validation? Proposed policy: engines propose against a versioned snapshot; shared semantic validation checks hard constraints and applicability before effects run. A timeout never proves impossibility; an optimizer must distinguish feasible from optimal. What evidence can a validator check, what remains trusted in an engine, and how are contradictory results resolved? Show the full loop with newly fetched knowledge, derived facts, solver backtracking, budget exhaustion and a stale snapshot.

#### B31 — Reuse without copying and name-based adaptation

**Location:** 5.1–5.3; 6.1.

How does a new domain bind to an existing concept and inherit knowledge without copying declarations or using strings such as made_in=drawing? In PSys2 catalogWholes currently copies expectations and creates types/honours from a matched world name. Proposed replacement: stable concept identity, explicit typed mappings to domain projections, and queryable capability bindings. Please show which facts remain in the shared base, which are local observations, and which are mappings; explain conflicts between two bases and exact version dependencies. Can the same meeting participate in a calendar and a diagram without becoming two unrelated facts?

#### B32 — Semantics of extension and its limits

**Location:** 4.2–4.8; 7.5.

Which novelty requires only new data, which requires a new schema, and which requires a genuinely new engine primitive? Proposed distinction: new instances/regions; new compositions of existing concepts; new semantic operations requiring a reviewed contract. Give a decision tree and an example of each within the four domains. Otherwise the promise that every concept automatically receives all behavior merely relocates hidden case code into an interpreter. What is the explicit finite semantic kernel, and how is its adequacy challenged?

#### B33 — A pedagogical, reproducible vertical example

**Location:** 1.4; 6.2; 7.4.

Could the reviewer add one complete worked meeting example followed by its reuse as a diagram: declarations, input wires, concept-resolution closure, interpreter output, applicable rules, chosen engine, candidate/rejected bindings, valid plan, tool arguments, observed state and justified reply? Include an ambiguous participant, an unloaded constraint and an execution failure. Provide actual small tables and numbers at every step, with a glossary before new terms. The reader should be able to reproduce the result with pencil and paper. Proposed acceptance: a reader can point to the declaration or general rule justifying every step; no transition may be explained only as the system understands or deduces it.

### Review request — authorship transferred by the owner

The owner now assigns this worker authorship of books/ and refactoring/. Please act as reviewer: return concrete objections, counterexamples and suggested corrections in worker-tasks.md. To avoid concurrent edits, leave the book and plans to this worker unless coordinated. Runtime refactoring remains unapproved.

- **RV1:** Review v14 chapter 9 for pedagogical completeness: identify any unexplained step, circular definition or implementation-shaped assumption. In particular challenge retrieval coverage and the reasoner boundary.
- **RV2:** Check the R24 correction: a region centre inside another does not prove inclusion. Check the sufficient metric-ball condition and the undetermined outcome for unsupported shapes.
- **RV3:** Review the new plan §10 dependency gates against chapter 9. Which contract is missing before implementation can start?
- **RV4:** Revisit v13 R1–R4: a comma-encoded point conflicts with the principle that compound information is represented by linked wires. Compare explicit point/coordinate wires with a new primitive value syntax before adopting either; neither should silently become settled policy.
- **RV5:** Review the numerical calendar trace and its cross-domain reuse, especially the difference between checking one known reservation and proving availability over a complete scope.

B01–B23 remain pending verification against v13; no question is closed merely because the answer table says fixed. B24–B33 are proposed design questions, now also the work agenda for the author.

### Author response to Book review 1 — v15, first batch

F1, F3, F21 and F22–F24 addressed: chapter 9 moved before annexes; plan §10 uses two columns and adds missing contracts and approval ownership; R24 handles omitted axes and inclusion is derived, with the declaration key withdrawn. Acceptance distinguishes the design gate from later measured implementation acceptance. Please review these exact changes. F2, F4–F20 and F25–F28 remain open; no claim of full resolution.

Technical decisions: accept derived inclusion, instance-local learned factors with no automatic promotion, and snapshot charts. These agreements still need consistent propagation through the book, not merely this note.

Counterexamples for the proposed defaults: (1) a name plus a counter is insufficient unless the counter is persisted and unique across imported instances; prefer an immutable instance identity separate from its display name; (2) the ordinary atom `none` can be a legitimate domain label, so known absence needs an unambiguous typed representation; (3) comma points need specified escaping, named-axis projection and stable axis order across schema versions before acceptance. I will compare the three representations in the book. Please counter once with a concrete case if you disagree.

Executing a non-undoable tool and removing recurrence affect visible behavior; I will not silently settle those as formatting choices. The same applies to changing comparative step policy. They remain visibly identified proposals until reconciled with existing owner direction. A/B scope, map, avatar and fifth proof domain remain owner decisions.

### Review request — v16 / F29 and control decisions 00:15

Integrated full redesign scope, recurrence in scope, map removal, face within drawing and textual explanations instead of a fifth domain. R48 now states bounded recurrence verification; R64 requires undo for demo tools; R80 points to new §6.11. Corrected the R24 heading and removed the inline inside=ellipse example. Please review F29 against §6.11: recorded evidence per reply class, numeric calendar derivation and examples in all four domains. The section explicitly distinguishes explanatory trace from a proof of generality and does not fabricate runtime evidence.

This is a focused batch, not completion of F2/F4–F20/F25–F28. The point representation and known-absence representation still need the promised comparison and concrete schema. No implementation started.

### Review request — v17, retrieval and reasoning contracts

Addressed F12–F17 in §§9.4–9.5: typed dependency/index table, explicit local calendar closure with a core.type wire, separate knowledge-fragment coverage, state versus published versions, terminology, outcome mapping and fork-based validation. Clarified F11 by pointing at R35 and part of F4 by defining renderer/projection/logical fragment/coordinator/index/shard. Please check that complete=true is used only after full instance loading and does not claim knowledge-rule completeness. No new result vocabulary is introduced for search.

PSys2 control 13:30 agrees with scope decisions already integrated in v16; no runtime work started. F2/F6–F10 and calendar trace F18–F19/F26–F28 remain for subsequent writing; this batch is not a claim that all chapter-9 feedback is closed.


### Review request — v19, contracts integrated into the relevant concepts

Owner rejected both the enumerated-rule chapter and the presence of editorial/project process inside the book. The former chapter 8 has been removed. Its technical content is rewritten with concise tables, introductory reasoning and detailed application/counterexample discussion, then integrated as subsections of the relevant concepts in chapters 2–7. R1–R72 remain stable table identifiers. Former §8.20 / R73–R81 moved into refactoring/sop-worlds-schimbari.md §12. Former chapter 9 is now chapter 8; current book and active-plan references have been updated. Historical questions still refer to the versions they reviewed.

Review the explanations in context: point semantics (§2.2.1), identity (§2.4.1), incomplete information (§3.9.1), constraints (§3.6.1), metrics/graphs/frames (§§4.4.1–4.4.3), learning (§4.5.1), acts (§4.6.1), metamodel (§4.8.1), inheritance (§5.2.1), routing (§6.1.1), interpretation (§6.3.1), approximation (§6.5.1), specialised functions (§6.8.1), execution/undo (§§6.9.1–6.9.2), observed replies (§6.10.1), calendar scenario (§7.4.1). Check each table against surrounding prose and flag contradictions or unnecessary duplication with the parent section.

In particular challenge the calendar's corrected 9:30 alternative, learning factor versus realised-size arithmetic, qualified-reference semantics, and recurrence edit scope/finite checking/undo (§4.4.3, F34). Known-absence serialization is explicitly provisional rather than presented as implemented atom behavior. Other architecture/representation review items remain open; this rewrite does not close them implicitly.

Integrated reviewer commits eaab9be and 999f682: F41 matches the owner-directed dissolution now completed; F35 also has an explicit forward explanation in §2.3. F36–F40 remain open for the namespace/terminology cycle. Please review the final integrated structure, not the intermediate standalone-chapter rewrite.


### Review request — v21, examples instead of rule-index tables

Addressed F42: moved the R1–R72 index to the active plan §13 and placed each identifier after its explanatory paragraph; retained real comparison/state tables and added concrete value, region, geometry and learning-episode examples. Addressed the named duplications in F43 (degree introduction, dark axes, half-open intervals), though further consolidation with parent sections remains reviewable. F44 now has proposed region, axis and relation wires with line-by-line semantics and explicit dependency on the geometric function contract, not a claim of implemented support.

Review 6 accepted the learning episode, persistent identity decision and calendar assumption. Remaining follow-up here is F43 consolidation; F50 adds the concrete point/value rewrite. Other unaddressed architecture items remain open.




Review 7 at dee2df5 accepted F7–F9 and F48–F50 after checking the revised text; the corresponding v23/v24 requests were removed. New follow-ups F51–F54 remain open: conceptual request/constraint wires, per-request clearance bound, consistent lower-case dotted names, and justification of the normalization magnitude. Reviewer also verified the clearance rule in the current engine and noted that calc evaluation precedes the neq check and custom functions receive token arrays; those details must be reflected in the next example revision.

### Remaining follow-ups after review 10

Review 10 at 5771263 accepted F51, F6, the generalisation boundaries and the controlled R37 extension after reading the text; their review requests are removed. Remaining work includes F53 naming consistency, region-valued extent/layers, composition from parts, the full description schema and complete drawing declaration. The newly supplied replay gaps W–BB remain open; none is closed merely by the operation catalogue. E1 is submitted below; E2–E4 remain pending.

### Review request — v29, library API chapter with executed examples

Added chapter 9 for the requested core world APIs and the existing/proposed conversation boundary. Every displayed example/result pair was run through the local sources using `node ../.session-control/book-api-v29.mjs`. Please challenge particularly: solveReport's three statuses versus solve()'s lossy empty-array result, derived values that inherit default provenance, fork isolation versus host effects, and library undo versus external compensation. The actual request API uses REQUEST_KEYS/w.request; the proposed std.request graph is not presented as shipped. This is the core API chapter, not yet an explanation of every specialised export in docs/api.md. Full drawing declaration remains pending.

### Review request — v30, English reader contract (E1)

Added §§10.1–10.4: lexical categories, grammar constructions, syntax-to-description composition, attachment/scope, failure handling and model-proposal boundary. A complete minimal parseText example was executed; unsupported “except” is reported rather than dropped. Please challenge the distinction between syntax ranking and semantic uniqueness, and the explicit remaining gap: each/group plus polarity cannot encode nested quantifier scope. The full request schema needs logical nodes before those sentences may execute. This is not a claim of a complete shipped grammar.

Read PSys2 Q48/Q50 and its accepted decision: the previous proposer remains off; no new model training or activation is implied. The book permits a future candidate-only interface subject to independent real/held-out-domain evidence, and says schema validity cannot prove fidelity to the user's words. Please review that decision against E1. E2–E4 and the complete drawing declaration remain open.



### Review request — v31, knowledge supply and coverage (E2)

Chapter 11 now defines dependency closure, the minimum semantic families for all four domains, sources/import versus model-labelled candidates/local learning, reviewer responsibilities and coverage measurement. The volume calculation is explicitly a hypothetical pilot budget, not a claim that the existing corpus satisfies the design or that every replay turn is covered. Please challenge whether the minimum misses a dependency, and whether the counting model separates semantic relations from drawing geometry sufficiently.

Read-only inspection of the knowledge repository confirms it already contains kinds, scenes, drawing primitives and related corpora; its categorical labels and drawings still need semantic migration/review for the proposed spaces. No knowledge import or schema change was performed. E3 and E4 remain next as separate chapters; the complete drawing declaration remains open.

Applied the owner direction at 1bc1436: chapter 10 now describes extensibility rather than a ceiling on understanding. R68 now proposes measurable tone axes, textual evidence, uncertainty and region/tolerance comparison; source-document composition has an extraction-and-evidence contract. Please review calibration and source-support checking as open design work, not assumed implemented capabilities. Runtime uncertainty remains reported for the individual request.

### Follow-ups after review 12

Review 12 at 833d35c accepted F52, F54, F55, F56 and F58; checked the revised bounds, normalization rationale, chapter placement and reader extension/clarification text and removed that review request. The chapter 12 design now needs concrete declaration wires (F64), while F53 and F57/F59–F61 remain open. The reviewer independently verified the solveReport/apply example. Chapters 11–13 received positive direction, with specific outstanding work F62–F66: measured inventory, named sources, provenance/parameter wires, consistent tone measurement and propose/check/unknown-information replies. These are pending rather than closed by the chapter additions.

### Review request — v33, reply composition (E4)

Chapter 13 defines evidence-backed claims, selection/order, grouping by act/status/roles with unique object counts, whole/part compression, meaningful assumptions/adaptations, reference choice and English realisation with semantic coverage checks. Replaced §6.10's infallible-source claim and one-frame wording with correlated evidence and equivalent frame families. Please challenge mixed confirmed/unknown outcomes, duplicate attempts, different destinations/properties and creating a whole versus editing its parts: these must not produce broader success claims. The reply-wire fragment is explicitly proposed; no runtime evaluator is claimed.

### Follow-ups after review 13

Review 13 at 3443a0b accepted F57, F59–F61, F64–F66 and W after checking the published sections. Checked those decisions against the actual logical-node, reader, calibration, tone and reply text; removed their resolved review requests. Kept the earlier unresolved questions. F62/F63 and the complete drawing declaration remain pending.

### Follow-ups after review 14

Review 14 at 8a7a2de accepted the measured inventory (F62) and the shared-resource mood counterproposal. Checked §11.5 and §10.2 and removed the resolved requests. Integrated check-and-offer for unresolved mood, conditional on an available authorised read without external effects; intended mood remains unresolved until the answer. The inventory's semantic migration ledger remains implementation work, not a claimed completed mapping.

### Follow-ups after review 15

Review 15 at 00dc974 accepted F2/F10, F53, F63 and replay gaps X/Y. Checked the actual sections and removed their resolved requests; the reviewer independently executed the §8.3 example. Source boundaries were accepted without a counter. Implementation remains unauthorised; other book and consolidation items remain open.

### Review request — trusted functions (F4, remaining)

§8.5 specifies the integrator action: check implementation version, contract evidence and input domain before relying on the result, otherwise keep it undetermined. Please review this remaining F4 point. The calendar failure/undo part F27 was accepted in review 16 and is removed from the question queue.


### Remaining editorial consolidation (F43)

Review 16 accepts F20 and the move of project tracking into refactoring/book-migration-register.md. The broader F43 repetition cut remains open; acceptance of the move does not claim the rest of that consolidation is complete.

### Review request — v48, derived whole qualities and same-as (AA)

Added §4.4.5: aggregate membership/operation/coverage, empty versus unknown input, ties, units, palette equality versus subset, and a proposed typed value reference for operator=same. The worked palette request distinguishes the unresolved value description from its versioned observation and from the target assignment. Please review whether std.request.value is the right shared representation, whether exact set equality matches the accepted interpretation, and the conflict case where the destination cannot realise both colours. No live dependency or runtime support is claimed; remaining source-content work BB is separate.

### Review 16 integrated — projection decisions

Checked the accepted calendar and snapshot contracts in §8.6 and the relocated migration register. Removed the resolved F19/F20/F26/F27/F28 and Z requests. §6.1.2 now explicitly retains occurrence plus series identity, permits totals only over a closed scope (otherwise an explicitly labelled partial-data proposal), and asks before overwriting manually changed target values, including deleting an edited node. These apply your decisions; F4, F43 and the v48/AA review remain open.

### Phase-zero design negotiation — legend contracts exposed by implementation

Review de76af8 accepted all proposals. The act-condition encoding is now implemented and removed from this open list. The remaining accepted decisions below still need implementation and example alignment before closure:

| Issue and counterexample | Proposed contract and alternative considered |
| --- | --- |
| Axis of=colour names a space, whose declaration ID is sp.colour; unit of=ratio cannot distinguish ratio axes of two spaces. | Use typed declaration references among legend records (of=$sp.colour, space=$sp.page, unit.of=$ax.page.x). Public name remains vocabulary data. For legacy consumer annotations, resolve names explicitly with missing/ambiguous rejection; do not silently accept an unchecked atom/ref union. Strict joins by qualified names are a possible alternative, but unqualified axis names are insufficient. |
| §4.8 declares only hue but the same region uses saturation/lightness; numerical examples add axis unit/calibration absent from the field table. | Supply all prerequisite axes in runnable fixtures and freeze unit/calibration fields with real typed dependencies. Omitted coordinates may describe a region; undeclared coordinates must be rejected. |
| Point semantics require versioned axis order and frames, but the space table has only name/form. | Freeze a versioned space and explicit frame descriptor before claiming dimension/version/frame validation. Do not call a comma-token recognizer full point support. |

Please challenge these choices with a concrete reusable counterexample if you prefer the qualified-name alternative or another condition representation. I am not declaring these families frozen or adding permissive schemas while these contradictions remain. The already-published import records are structurally validated; they do not depend on a guessed resolution here.

The independently authored heldout reader set is frozen as a candidate evaluation asset, not semantically approved gold. Structural validation alone cannot approve vocabulary or ambiguous intent. Independent audit flagged independent.diagram.2, independent.diagram.5, independent.documents.5 and independent.calendar.4 for vocabulary/meaning review; the latter needs ambiguity review. Please review those IDs without sending their sentence content to the rule author, so they remain held out. No selector/result conflation was found in the heldout rows. Publication should preserve this provisional status until reviewed.

### Reader corpus milestone — review entry points

Imported isolated agent commit a13fc17: see compat/psys2/reader/questions.md (RDR1–RDR3), README and development/labels.jsonl. RDR1's representation is now published in 0.183.0; proposed labels still need semantic review. RDR2 asks how non-action objections/clarifications and contextual fragments should be labeled without invented action envelopes. RDR3 requests review of source language eligibility, area attribution and the seven proposed labels among 205 preserved development rows. Pending rows remain in the denominator; no reader coverage success is claimed. The original independent set stays byte-frozen and provisional, but reviewer metadata reached the rule author; it is now development material, not the final unseen evaluation. Original-source Unicode mapping is published in 0.185.0; generic declarative tree composition follows in 0.187.0. Review 9 accepted English-only eligibility and unassigned unknown areas. Its dialogue guidance is retained for the forthcoming request adapter; missing question-content and correction representations must not be invented by a labeler.

### Textual provider names — corrected profile boundary

Review 15 accepted generic serialization; the phase-zero announcement is already published in worker-log at 42a05ec. During consumer adoption, exhaustive name comparison exposed the initial literal-only compat profile regression. The correction declares colour/shape provider name labels as explicit strings uniformly, while the generic serializer remains unchanged. See compat/psys2/reader/questions.md RDR4 for the name-label versus canonical-value boundary. Consumers must compare decoded labels and retain resolved native values separately; other value families need explicit token semantics.

### Retired consumer compatibility cleanup

Review 16 accepted semantic-context projection; its resolved review request is removed. The subsequent owner decision removes the old application path. The library has removed old PSys2 legend adapters, typed-reader sample, matrices, recorded-answer fixtures and replay tests, retaining reader corpus/provenance and adapters consumed by the new path. Generic schema/grammar/runtime mechanisms are preserved. Historical measurements remain in Git and worker-log, not current gates. PSys2 separately audits which host/UI dependencies the declared tools still call.

### Parallel reply assessments — evidence boundaries for review

The new parallel area lanes are proceeding while the general assessors are developed. Proposed existence contract: retain a typed, explicitly complete population observation for a declared scope, with its revision, phase, invocation and historical member identities. Absence from a partial query is unknown. Membership changes prove an observed appearance/disappearance within that scope; they justify creation/deletion only when the recorded operation and the declared population semantics establish lifecycle, rather than movement across a filtered view. Counterexample: moving an object out of the viewport must not produce “removed” merely because the visible population no longer contains it. A reused host ID must include an incarnation/lifetime discriminator.

For relation assessments, retain both historical endpoints and the declared predicate identity/revision; do not equate native coordinate changes with “in” or “next to” without an evaluator defining that relation. Numeric/time comparisons need a declared dimension, units and frame; a larger raw token across a unit change or local-clock transition does not establish “later” or “bigger”. Host adapters can already record those observations and perform supported declared effects, with explicitly unverified replies until the general evidence checks are published. Please challenge these boundaries with a concrete counterexample or a simpler equally sound representation; they do not block the independent area and training lanes.

### Existence assessment implementation for parallel review

The lifecycle proposal above is now implemented for publication as `assessExistenceChange`. Candidate methods considered: (1) STRIPS-style declared effect completion, insufficient alone because a successful call is not observation; (2) relational set difference under an explicit closed-world scope, selected for before/after membership; (3) event-log evidence alone, insufficient when a receipt is replayed or the event says nothing about retained state. The implementation combines typed scoped population observations with the correlated journal step; it does not infer scope completeness or authenticate host observations.

Adversarial checks: a view losing a member does not yield removed; incomplete absence stays unknown; changed scope/population identity and duplicate subject identities reject; subject incarnation is an adapter obligation; all captured data survives live-trace edits and claim validation recomputes rather than trusting status. The mechanism contains no domain IDs, vocabulary or sentence matching, works identically for any declared lifecycle population and is independent of input language. Existing property assessment remains unchanged. Capture/evaluation/retention use the world budget. Data declarations alone could describe populations but could not validate a retained immutable assessment against forged statuses. Numeric/time and relation evaluation remain parallel pending mechanisms, not hidden behind this API. Please review the explicit trusted completeness/lifecycle boundary; claiming causation against external concurrent writers is deliberately outside this contract.

### Common multi-request integration boundary

The application coordinator confirmed it needs a general explicit dependency envelope for its shared operation dispatcher. Added `prepareRequestBatch` / `requestBatchFrontier`: all existing request graph forms pass through the same structural validation, while dependencies are a separate DAG. This uses the standard partial-order planning model instead of inferring sequence from wire order, and a dependency frontier instead of a global stop-on-first-failure loop. Alternatives considered were ordered text execution (would invent sequence and hide ambiguity), full speculative transactions (cannot generically roll back external hosts), and explicit partial order (selected). No atomic rollback or exactly-once execution is claimed.

Important boundary agreed with the application worker: unverified effects do not satisfy a semantic-success dependency. Independent requests remain ready; descendants are blocked with explicit causes. Preparation does not interpret language, select alternatives, bind follow-up pronouns or implement every predicate. It preserves those structures for the shared declared-capability dispatcher. Host execution and evidence remain separate. Please review the dependency semantics as a whole, including refusal propagation and independent progress, rather than treating each example as another supported command. Cross-request referent/result bindings need explicit grounded declarations and must not be guessed from ordering.
