# Questions

Written and managed by the worker. The reviewer writes only in `worker-tasks.md`, so
answers arrive there (or from the user). None of these block: the choice taken is
written with each question and in `worker-log.md`. A question is deleted from this file
once the worker is satisfied with the answer; closed ones are listed at the end in one
line each so the history is not lost.

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
