# sopworld 0.117.0 — architecture review (src/, docs/, test/)

Clone reviewed: /tmp/review-lib at 53c484f. Read-only; nothing committed. Every finding below was checked by reading the code, and the six serious ones were also reproduced with small scripts.

## Summary (ten lines)

1. Six serious errors. Lexicon and graph caches are keyed on the wire count, so they go stale after `revise`/`fill`. The LCG used by `std.acts` "random" loses its low bits and always picks the first value. About 30 local unquote helpers mangle escaped strings. `choose` ranks only by seed unless `std.mjs` was imported first. `resolve` contradicts `std.fill`'s tier order. The default `readEnsemble` voices are correlated, so its confidence is not a confidence.
2. Duplication is the main structural debt, and the same jobs are done in several places: about 9 readers, 2 story planners, 2 motion schedulers, 2 request pipelines plus 2 world choosers, 2 typed-world builders, 3 pattern matchers, 4 kind-chain walkers, 5 clause/sentence splitters, 12 seeded RNGs and about 11 English plural-strippers.
3. The rule "one way to choose" holds only in part. `choose` is used at 8 call sites; ranking at other places is done with ad hoc sorts, and the `score` criteria live both in `RANKING` (JS) and in `std.decide` facts.
4. Knowledge leaks: English morphology, word lists and prose are built into src/; `w.lang.en`/`w.lang.ro` are given as default namespaces (with opposite defaults); src/ hard-codes catalog shapes (`k.story`, `k.people`, `k.animals`, the move names `counter|rebut`, `surprising fact`).
5. Application leaks: `handover.mjs` and `say.mjs` are PSys2's LIB-1..8 asks; `storyState` is the kids-arithmetic domain; the "open tab" is a `std.decide` criterion. The compat/psys2 suite takes 40 s of the default `npm test`.
6. The API has three act-frame shapes (`{action,args}`, `{act,args}`, `{is:'act',act,args}`), five failure conventions (throw, `{why}`, `{ok:false}`, `null`, `false`) and drifting option names (`until`/`end`, `limit`/`chooseLimit`/`budget`, `n`/`count`/`max`).
7. Layering: no import cycles. But core `World` imports `std.mjs` (1098 lines that mix 12 modules), and `rank.mjs` gets its default criteria by a side effect. `world.mjs` (2399 lines) and `query.mjs` (885) each do several jobs.
8. Docs: the d.ts `tabulate` uses removed names (`degree`/`dims`); several files say they are "language-free" when the code says otherwise; `literature.md` lacks about 15 mechanisms; `modules.md` lists about 25 of 172 exports.
9. Tests: 507 tests, 0 failures, 229.5 s wall on 2 CPUs (261 s serial). Eleven files take over 5 s; the worst are budget (40 s), story (24 s) and psys2 run/cases (40 s together). There are no contract test of the d.ts shapes, no cache-invalidation test and few property tests. `test/rank.test.mjs` is empty.
10. Counts: 6 serious errors (1-6), 37 structural findings (7-43), 6 cosmetic findings (44-49); 49 in all.

---

## A. Serious errors

1. **Caches keyed on `world.wires.size` go stale after a value changes; two caches are never invalidated.**
   Evidence: src/readtypes.mjs:17 (`typedLexicon`), :60 (`nearWords` sense index), src/say.mjs:100 (`narrationOf`), src/related-cases.mjs:18 (`namedIn`); src/compose.mjs:47 (`interestModel`) and :66 (`graph`) check nothing at all. Reproduced: tell `cow sound=moo`, then `revise('a','sound','low')`. The lexicon still has "moo" and lacks "low", so `readByTypes(w,'which animal says low')` gives `best: null` (on a fresh world the same question reads correctly).
   Why: every reader, ranker and composer built on these caches answers from an older state of a live world, without any error.
   Fix: key every per-world cache on `world.version` (src/world.mjs:882) or `world.stamp`, through one shared `memoPerWorld(world, key, build)` helper, and add a test that revises a value and reads again.

2. **The LCG uses a float multiply, so its low bits collapse; the `std.acts` "random"/"different" values degenerate.**
   Evidence: src/std.mjs:222 `h = (h * 1103515245 + 12345) % 2147483648; return h % n` (seed from :254). The same generator is at src/rank.mjs:119, src/related-cases.mjs:154, src/space.mjs:119 and src/diagram.mjs:16. The product is above 2^53, so the low bits are rounded away. Reproduced: for seeds 1, 3, 12345 and 99991 the sequence `h % 2` is `0000000000`, so "random" on a two-value enum always gives index 0.
   Why: "change colour to random" or "make them different" is not random, and stratified sampling in `relatedCases` is biased.
   Fix: use one seeded generator (the mulberry32 already used at compose.mjs:25, sample.mjs:18 and others) from a single `src/random.mjs`, or `Math.imul` if the LCG is kept.

3. **About 30 local quote-strippers ignore escapes and disagree with `parser.str`.**
   Evidence: `const bare = (v) => String(v).replace(/^"|"$/g, '')…` at readtypes.mjs:10, say.mjs:8, compose.mjs:22, realise.mjs:13, related-cases.mjs:13, typed.mjs:14, handover.mjs:10, frames.mjs:14, std.mjs:154, morph.mjs:20/223, motion.mjs:19, segment.mjs:13, dialogue.mjs:17/77, grammar.mjs:23/191, rank.mjs:114/142 and others. Reproduced: for `name="the \"big\" one"`, `str()` gives `the "big" one` but `bare()` gives `the \"big\" one`; for `note="a\nb"`, `bare` keeps the literal `\n`.
   Why: knowledge values with quotes, newlines or Unicode escapes (phrasings, templates, names) are matched and said wrongly.
   Fix: export one `valueText(v)` built on `str` (src/parser.mjs:245) and replace every local copy (a mechanical change, about 30 sites).

4. **`choose` silently becomes a seeded shuffle unless `std.mjs` was evaluated first.**
   Evidence: src/rank.mjs:128-135 starts `STD_CRITERIA = []`; it is filled only by the side effect at src/std.mjs:1096-1098. Reproduced: importing `src/rank.mjs` alone and running `choose(null,'reading',[{unread:3},{unread:0}])` returns the worse candidate with 0 criteria; after `import 'src/std.mjs'` it returns the better one with 6 criteria.
   Why: the result depends on import order. The package exports map hides deep imports today, but tools, tests and any future split of the bundle are exposed.
   Fix: move the `std.decide` default criteria into a data module that `rank.mjs` imports directly (for example `src/std/decide.mjs`), with no mutable global.

5. **`resolve` orders tiers differently from `std.fill`, although it claims to use std.fill's names.**
   Evidence: src/resolve.mjs:7 says "with std.fill's names", but src/resolve.mjs:69 orders `['user','scene','focus','slip']` (focus weaker than scene). src/std.mjs:629-631 declares `user` rank 1, `focus` 2, `scene` 3 (scene weaker than focus).
   Why: a coordination such as "the ball and it" reports the opposite weakest tier from the one std.fill would choose; the tier order has two homes.
   Fix: read the order from the `std.fill.tier rank=` facts (one home), and give `slip` a `std.fill.tier` fact.

6. **The default `readEnsemble` voices are not independent, so the confidence over-counts.**
   Evidence: src/ensemble.mjs:16 and :18. `types` and `exact` are both `readByTypes` (exact is `near: 0`), so one reader votes twice. The worker's own measurement (worker-log.md:5136-5143) gives the ensemble 51.0 % precision, the same as `types` alone and below `canonical` alone (57.6 %); learnt weights left held-out precision unchanged (46.8 → 46.8). The defaults are still used when `readers` is omitted (src/ensemble.mjs:31).
   Why: a mechanism measured as giving no gain sits on the default path, and its `confidence` is presented as calibrated agreement.
   Fix: drop `exact` from `defaultReaders` (or count readers that share an implementation as one voice), and require callers to pass independent voices (readFrames, parseText, patternReader) until a measurement shows a gain.

## B. Structural

### B1. Duplicate or overlapping mechanisms

7. **There are about nine readers with no shared contract.**
   Evidence:
   - `world.interpret` → `score`/`veto` (src/interpret.mjs:160, src/query.mjs:78)
   - `parseText` + `resolve` (src/grammar.mjs:69, src/resolve.mjs:52)
   - `readByTypes` (src/readtypes.mjs:76)
   - `readFrames` (src/frames.mjs:35)
   - `readCanonical` and `splitRunOn` (src/alternate.mjs:103, :116)
   - `patternReader` (src/signature.mjs:72)
   - `readRolesByTypes` and `assignBySlotTypes` (src/handover.mjs:70, :92)
   - `fitsSlot` (src/typed.mjs:100)

   Each returns its own shape (`best` is a frame at readtypes.mjs:154, a scored entry at frames.mjs:109, and absent in readEnsemble, which uses `frame` at ensemble.mjs:51).
   Why: an ensemble, a related-case read-back (related-cases.mjs:149) or a rule learner cannot swap readers.
   Fix: keep `readByTypes` (typed) and `readFrames`/`parseText` (grammar) as the voices. Define one `Reader = (world, text, opts) => { candidates:[{frame,unread,cost,specificity}], best, unread }` and fold `readRolesByTypes` and `assignBySlotTypes` into `readByTypes`+`fitsSlot`. Cost: about 300 lines changed, mostly adapters.

8. **There are two story planners.**
   Evidence: `storyPlan` + `STORY_RELATIONS` (src/story.mjs:62-144) and the planner's `choose=` bindings (`solveChoose`, src/plan.mjs:182-219) both solve multi-slot choices with optional runs, distinct values and hard/soft constraints. test/story.test.mjs:15 and :46 check the same invariant (no hard k.story constraint broken) through each of them.
   Fix: keep the planner (its methods are data in k.procedures); make `compose` call it for story moves (src/compose.mjs:238-248), and delete story.mjs together with its hard-coded catalog shapes. Cost: compose's story path, and one test.

9. **There are two motion schedulers.**
   Evidence: `motionPlan` (src/motion.mjs:46, the `mo.*` format, option `until`) and `planMotionFacts` (src/motion-facts.mjs:67, the `k.motion` format, option `end`). motion-facts.mjs:3 says "one motion format and one scheduler".
   Fix: keep `planMotionFacts`, and turn `mo.*` into a reader that maps onto the same plan; remove `motionPlan`. Cost: test/motion.test.mjs, one example.

10. **There are two request pipelines and two world choosers.**
    Evidence: `turn` (src/turn.mjs:21) and `turnFlow` (src/turn.mjs:158, std.turn stages) both run dry run, apply, reply and fallback. `route` (src/turn.mjs:77, scores) and `arbitrate` (src/turn.mjs:117, verdicts) both pick the world for a request.
    Fix: keep `turnFlow` with a default stage list equal to `turn`, and make `turn` a one-line wrapper; make `route` a provider of `arbitrate`'s `coverage`.

11. **There are two typed-world builders with nearly identical names.**
    Evidence: `typedWorldOf(things,{values})` (src/handover.mjs:55) and `typedWorldFor(schema,knowledge,{things})` (src/typed.mjs:45). The `things` loop at typed.mjs:86 is the same code as handover.mjs:58.
    Fix: keep `typedWorldFor`; `typedWorldOf(t,o)` becomes `typedWorldFor({kinds:[]},null,{things:t,…})` and is then removed.

12. **There are three matchers for one pattern language (`{x}`, `{x:class}`, `[a|b]`), and they disagree.**
    Evidence: src/alternate.mjs:24 (classes and alternatives), src/related-cases.mjs:179 (no classes; `{x:base}` is accepted but ignored), src/learn.mjs:139 (no `[a|b]`). Learnt operators are therefore applied with different semantics from the alternations they are meant to join.
    Fix: one `matchPattern`/`fillPattern` in alternate.mjs, used by all three. Cost: about 40 lines.

13. **There are four kind-hierarchy walkers.**
    Evidence: `kindChain` and `ancestorsOf` (src/related-cases.mjs:27, :47, in the same file), `chainOf` (src/story.mjs:45), `siblingsOf` (src/compose.mjs:95), and the planner's `chain` option (src/plan.mjs:87). The matrix also has `isA` (used at readtypes.mjs:137).
    Fix: keep `ancestorsOf` (it handles dimensions); express `kindChain` as its grouping by level and reuse it in story, compose and plan.

14. **Rankers.**
    Evidence:
    - The `score` criteria live in `RANKING` (src/rank.mjs:15-26) and again as `std.decide.c.score.*` facts (src/std.mjs:719-723); `rankingOf` (rank.mjs:141) maps between them.
    - `veto` is just `vetoOf` (rank.mjs:76, :102).
    - Ad hoc sorts bypass `choose`: src/frames.mjs:108, src/compose.mjs:196-197 and :208, src/turn.mjs:100, src/related-cases.mjs:156-159, src/signature.mjs:88, src/align.mjs:40.

    Fix: keep `choose` as the only ranker (with `rank` as its engine, not exported). Keep the measures in JS keyed by name and the order only in std.decide facts; drop `veto` in favour of `world.veto`; route the listed sorts through `choose` kinds.

15. **There are five clause/sentence splitters.**
    Evidence: `canonicalise` (src/alternate.mjs:73), `splitRunOn` (src/alternate.mjs:116, a different filler rule), `segment` (src/segment.mjs:28), `sentencesOf` (src/summarize.mjs:70), and `storyState`'s split (src/story-focus.mjs:23).
    Fix: one `sentences(text, lang)` and one `clauses(world, text, {cuts})` whose cut points (joiners, splitters, openers, fillers) are language-world facts. `splitRunOn` then becomes a scorer over those cut points.

16. **Realisation is spread over overlapping helpers.**
    Evidence:
    - `clauseOf` and `phraseOf` both say a fact as one clause (src/say.mjs:26, :114).
    - `actSentence`, `realiseFrame`, `discourseRealiser` and `morph.realise` all fill templates (say.mjs:60, :141; realise.mjs:29; morph.mjs:184).
    - The a/an fix-up regex appears three times (say.mjs:74, :130; realise.mjs:99).
    - An English article heuristic appears twice (std.mjs:17, schema-words.mjs:10).
    - The list joiner appears three times (say.mjs:14, schema-words.mjs:11, realise.mjs:56).

    Fix: keep `phraseOf` (data-driven phrasings) and drop `clauseOf`; use one `fillTemplate(world, text, roles, {lang})` that does articles and inflection once, called by the other three.

17. **`compose` holds two composition algorithms with two result shapes.**
    Evidence: `composeOnce` (src/compose.mjs:178, result `chapters`) and `composeGenre` (:228, result `parts`). The plain path hard-codes the moves `introduce, fact, fact, conclude` (:184).
    Fix: express the default as a built-in genre so there is a single `composeGenre` and a single result shape.

18. **Similarity and alignment are each written twice.**
    Evidence: `editDistance` (src/interpret.mjs:23) and `oneSlip` (src/resolve.mjs:29; `oneSlip(a,b)` is the same as `editDistance(a,b,1) <= 1`). `formOperator` aligns by greedy longest common run (src/learn.mjs:83) while `formEdits` aligns the same pairs by LCS (:157).
    Fix: use `editDistance` in resolve, and build `formOperator` on the LCS alignment of `formEdits`.

19. **There are three lexicons built from the same facts.**
    Evidence: `typedLexicon` (src/readtypes.mjs:15), `world.words()` (src/interpret.mjs:51) and `grammarOf().lex` (src/grammar.mjs:20) all read `core.word` texts.
    Fix: make `world.words()` the single source, with `typedLexicon` adding categories on top of it.

20. **There are twelve seeded RNGs of two kinds.**
    Evidence: mulberry32 at compose.mjs:25, realise.mjs:16, sample.mjs:18, motion.mjs:23, plan.mjs:424 and handover.mjs:43; the LCG at rank.mjs:119, related-cases.mjs:154, space.mjs:119, diagram.mjs:16 and std.mjs:222 (see finding 2).
    Fix: one `src/random.mjs` exporting `rng(seed)` and `weightedOrder`.

### B2. Knowledge in the library

21. **English morphology is hard-coded in about 11 places.**
    Evidence: `x.replace(/s$/,'')` and `/es$/` at readtypes.mjs:80, signature.mjs:19/:74, handover.mjs:75-77, typed.mjs:105, alternate.mjs:133/:137, dialogue.mjs:82, learn.mjs:73 and say.mjs:38/:47/:124. Also the `-ed/-ied/-s` base form (alternate.mjs:45), the `ing|ed|ly|er|est|s` classes (signature.mjs:32), and `ies→y` (story-focus.mjs:9).
    Fix: one `formsOf(world, word)` that uses the language world's `inflect` rules (`inflectBy(world, w, 'singular')` already exists at morph.mjs:236), and returns `[word]` when no language world is loaded.

22. **Default language namespaces are baked in, with opposite defaults.**
    Evidence: `lang = 'w.lang.en'` at say.mjs:26, :60, :114, :141, :165, related-cases.mjs:81, space.mjs:140 and dialogue.mjs:74; `w.lang.en.*` types at alternate.mjs:14/:20, realise.mjs:19/:31, compose.mjs:236, morph.mjs:237/:268. `readFrames` defaults to `lang = 'w.lang.ro'` (frames.mjs:35) and names its pivot field `en`.
    Fix: no default. Resolve `lang` from the world (the loaded `w.lang.*` module, or a `core.use … as=lang` declaration), and rename `en` to `ref` (the reference-language word).

23. **English word lists live in src/.**
    Evidence:
    - typed.mjs:16 (TITLE/TEXT key names), :100 (`a an the`), :116 (question words)
    - dialogue.mjs:74 (pronouns, `more`, `bit`, `centre`)
    - summarize.mjs:69 (`e.g`, `etc`, `No`, US-legal abbreviations)
    - grammar.mjs:53 (the `'s` token)
    - signature.mjs:31 (`length <= 4` treated as closed class)

    Fix: move them into w.lang.en (`w.lang.en.word_class name=question` and similar) and read them through `wordClassesOf`.

24. **Catalog and domain shapes are hard-coded in src/.**
    Evidence:
    - story.mjs:18-30 (k.people.role, k.animals.animal, k.objects.object, k.scenes), :29 (`'animal'`), :52 (`goal`/`ending`), :73 (`give`)
    - compose.mjs:130 (`/animal|person|people/` as "animacy"), :274 (`compare`), :309 (`'surprising fact'`), :346 (`/counter|rebut/`)
    - realise.mjs:54-68 (story slots and the English glue `its`, `get to`, `past`)
    - frames.mjs:21 (the `k.actions.verb.<act>.<word>` id shape)
    - readtypes.mjs:12 and handover.mjs:29 (the `k.words.`, `k.genres.`, `k.interest.` namespaces)

    Fix: express each as a knowledge fact (a move's `needs=contrast`, an `animate` feature on kinds, a `content=false` flag on types), and delete the literals.

25. **The library writes English prose for users.**
    Evidence: turn.mjs:39 ("I guessed"), :57 ("What X?"), :66 ("Did you mean to"); turn.mjs:139 (`request.action + 'd'`); std.mjs:220-349 (refusals with `art()`); schema-words.mjs (the whole module, which says "in plain English"); say.mjs:85 ("You asked me to"); typed.mjs:102-122 (fitsSlot `why`); rank.mjs:17-25.
    Fix: return a code with its data (`{ code:'missing', key }`) and realise the text through the language world's templates (`actSentence`/`phraseOf`). English becomes w.lang.en data.

### B3. The application in the library

26. **`handover.mjs` and `say.mjs` are one host's asks (PSys2 LIB-1..8).**
    Evidence: the module headers handover.mjs:1-4 and say.mjs:1; `judgeReply`, `tabulate`, `tableText` (handover.mjs:115-133) are a test harness for one host's cousins judge; `renderFrames` (say.mjs:84) is a chat recap; `randomTopics` (handover.mjs:42) is a suggestion button.
    Fix: move the harness helpers to tools/ (next to tools/generalisation-test.mjs) and the chat-recap helpers to the application. Keep `topicIndex` and `genreOf` in compose.mjs.

27. **The "open tab" is a library decision criterion.**
    Evidence: src/std.mjs:727 (`std.decide.c.world.2 name=tab measure=active … "the open tab owns a tie"`) and src/turn.mjs:112-117, :138-140 (`active`).
    Fix: rename the criterion to a neutral `focus` (the world in focus), declared by the host. A UI tab is application vocabulary.

28. **`storyState` is the kids-arithmetic domain.**
    Evidence: src/story-focus.mjs:17-55. It takes no world, has its own tokenizer, recognises names by capitalisation, uses an English lemma, and its result is the PSys2 `kids.arith` task ("Ana has 3 apples…", test/story-focus.test.mjs:13).
    Fix: express it as a world (owners as things, verbs as `core.effect` on a fluent, std.focus for pronouns) in the knowledge repository or the application, and remove it from the library.

29. **One consumer's compatibility suite runs in the default `npm test`.**
    Evidence: compat/psys2/run.test.mjs (22.3 s) and compat/psys2/cases.test.mjs (17.4 s) are picked up by `node --test` (package.json `test`). They replay `kids.*` dialogues and check line-count targets (run.test.mjs:19). The pinned PSys2 commit 45ac4bf imports nothing from sopworld (`git grep sopworld 45ac4bf` is empty).
    Fix: move them to `test:full` or `test:compat`; the fast path should test the library.

### B4. Layering and file size

30. **Core depends on std, and std is one 1098-line file.**
    Evidence: src/world.mjs:16 imports `STD` from src/std.mjs. std.mjs holds 12 modules (std.numbers through std.turn) as SOP text, plus the JS implementation of std.acts with English messages (:17-550), plus the rank side effect (:1097). There is a mid-file import at std.mjs:1097 and another at learn.mjs:62.
    Fix: create `src/std/<module>.mjs`, one per module; World finds them through a registry, and std/decide.mjs feeds rank (finding 4).

31. **Several modules do several jobs.**
    Evidence:
    - world.mjs: 2399 lines
    - query.mjs: 885 lines (query, score, act, check)
    - compose.mjs: the interest model, the name graph and two composers
    - plan.mjs: the planner, `PlanLive`, `factStore`, and the general weighted CSP sampler `solveChoices` (:422), which compose.mjs:16 and story.mjs:9 import from the planner
    - alternate.mjs: normalise, readCanonical, splitRunOn
    - learn.mjs: rule induction and form operators
    - handover.mjs: six unrelated helpers

    Fix: move `solveChoices` to src/choices.mjs; split `query.mjs` into query and act/score; dissolve handover.mjs (finding 26).

### B5. API uniformity

32. **There are three act-frame shapes.**
    Evidence: `{action,args}` (turn.mjs:21, sample.mjs:45, dialogue.mjs:25, turn.mjs:117); `{act,args}` (`resolveEllipsis`, dialogue.mjs:75; summarize.mjs:33); `{is:'act',act,args}` (readtypes.mjs:141); the planner takes `{act,roles}` (test/story.test.mjs:54).
    Fix: one `{ act, args }` everywhere, with `action` accepted for one release.

33. **There are five failure conventions.**
    Evidence:
    - throw: typed.mjs:89
    - `{why}`: compose.mjs:181, story.mjs:87, rank.mjs:162
    - `{ok:false,why}`: typed.mjs:102, std acts
    - `null`: handover.mjs:82, say.mjs:30, dialogue.mjs:75
    - `false`: handover.mjs:118

    Reader errors are swallowed at ensemble.mjs:36.
    Fix: every call returns `{ ok, …, why?, code? }`; throw only on programmer error (a `SopError` for bad arguments).

34. **Option names and positionals drift.**
    Evidence:
    - Time limit: `until` (motion.mjs:46) and `end` (motion-facts.mjs:67).
    - Search limit: `limit` (plan.mjs:422), `chooseLimit` (plan.mjs:87), `budget` meaning steps (grammar.mjs:69) and `budget` as an object (World).
    - Counts: `n` per distance (related-cases.mjs:81), `count` (handover.mjs:42), `n` total (sample.mjs:45), and `max` with five meanings (frames.mjs:35, alternate.mjs:42, grammar.mjs:69, typed.mjs:45, diagram.mjs:102).
    - Type names: `type` (alternate.mjs:14, realise.mjs:19), `types` (grammar.mjs:20, morph.mjs:26, segment.mjs:28) and `prefix` (motion-facts.mjs:19, plan.mjs:87).
    - Positionals: `readMethods(k, prefix)` is positional; `kindChain(world, id, depth)` is positional while `ancestorsOf` takes options; `placeFor(world, size, at, opts)` takes three positionals.
    - Spelling mixes British and American: normalise, realise, analyse versus summarizeLog, summarizeText.
    - `world.resolve(id)` (world.mjs:122) collides with the export `resolve(world, phrase)` (resolve.mjs:52).
    - `overlap` (summarize.mjs:111) is ROUGE-1 recall.

    Proposed convention:
    - Signatures are `fn(world, input, options)`; world-free helpers are `fn(input, options)`; never more than two positionals.
    - Result fields: `best` (always the candidate object), `candidates`, `why`, `trace`.
    - Option names: `lang` (no default), `types` (a map of type names), `seed` (default 1), `limit` (search nodes), `max` (results returned), `reader` (a function).
    - Verb prefixes: `read*`, `plan*`, `learn*`, `realise*`, and `*Of` for derived views; one spelling variety (British, the majority).
    - Literature names: `rouge1Recall`, `damerauLevenshtein`.

### B6. Dead or unmeasured code

35. **Seventeen exports have no test and no user anywhere in the repo.** Their only reference is the re-export list in tools/lib-under-test.mjs.
    The exports: `tokenize` (the SOP lexer), `rankingOf`, `actWords`, `boxesOf`, `measuresOf`, `shapeShare`, `interestModel`, `STORY_RELATIONS`, `nearWords`, `ancestorsOf`, `wordClassesOf`, `defaultReaders`, `familyOf`, `readMethods`, `PLAN_LIMITS`, `ledgerKey`, `STAGES`.
    Also unused: `applyRule` at src/learn.mjs:137.
    Why: 172 exports is a large surface for one worker to keep consistent, and these are not checked by anything.
    Fix: unexport whatever is internal (most of the list); add a contract test for each export that stays.

36. **Two of the six reading criteria never discriminate for the main reader.**
    Evidence: src/readtypes.mjs:145 passes `violations: 0` and `missing: 0` to `choose(world,'reading')`, whose criteria 1 and 3 (src/std.mjs:699, :701) read exactly those fields.
    Fix: either compute them (a typed-slot misfit from `fitsSlot`, empty roles in act frames) or declare a separate `typed-reading` kind without them.

### B7. Docs and tests

37. **The d.ts disagrees with the code, and the docs test cannot see it.**
    Evidence: src/index.d.ts:742 and docs/sopworld.d.ts:742 declare `tabulate(results: { degree, dim?, dims? … })`, but the code reads `distance`, `axis` and `axes` (src/handover.mjs:126); docs/glossary.md:132 lists `degree`/`dims` as removed names. test/docs.test.mjs:114 compares names only.
    Fix: correct the declaration, and add a contract test that compares each function's destructured option keys (and return keys, on a sample call) with its d.ts.

38. **The two slowest test files spend their time on repetition.**
    Evidence: test/budget.test.mjs takes 40.3 s; `sweep` runs up to 400 budgets per call (:22-41) to assert only that each site is reached (:44). test/story.test.mjs takes 24.4 s: 30 seeds against the external checker (:20), and two planners proved against the same invariant (:15, :46).
    Fix: sample 30 budgets per call, or bisect for each site's first step; with one story planner (finding 8), test 5 seeds in `npm test` and 30 in `test:full`.

39. **Property and contract tests are missing for the public API.**
    Evidence:
    - `choose` has one test (test/decide.test.mjs:7) and `alignWorlds` one (test/align.test.mjs:14).
    - Nothing tests that renaming the types in `b` leaves `alignWorlds` unchanged, although "structure, not names" is the claim at align.mjs:4.
    - Nothing tests that duplicating a reader leaves `readEnsemble`'s winner unchanged (finding 6), that `calibrate` isotonic output is monotonic, that caches are invalidated after `revise` (finding 1), or the RNG's distribution (finding 2).
    - test/rank.test.mjs is 0 bytes (created empty in 6ed34e9).

    Fix: add these as small property tests over generated inputs; delete the empty file.

### B8. Generalisation opportunities

40. **One content-type predicate instead of six skip lists.**
    Evidence: readtypes.mjs:12, :21, :32; handover.mjs:29, :34; compose.mjs:70, :74, :187, :254; typed.mjs:26; align.mjs:14. Each decides "is this type content?" with its own prefix list.
    Fix: one `isContent(world, type)` read from a declaration on the type or module (`core.module … content=false`). New knowledge namespaces then need no library change.

41. **One `Reader` contract** (finding 7). `splitRunOn` already takes a `reader` (alternate.mjs:116). Give `readCanonical`, `readEnsemble`, `relatedCases`' read-back (related-cases.mjs:149) and `learnRules`' judge (learn.mjs:36-43) the same parameter. The grammar and frames readers then become the independent voices the ensemble measurement asks for (worker-log.md:5145).

42. **`solveChoices` as the general weighted CSP sampler.** It is already domain-free (plan.mjs:422). With `story.mjs` gone (finding 8) and composeGenre's layout already using it, it serves the planner, compose, diagrams (`sampleDiagram`) and `randomTopics`, replacing their ad hoc weighted draws (handover.mjs:46).

43. **One pattern engine with classes** (finding 12) would serve `normalise`, related-case wordings, learnt operators and `morph.realise` templates. Learnt operators could then be told straight into the language world as `alternation` facts, closing the learn → read loop.

## C. Cosmetic

44. **The relaxed composition retry searches fewer nodes than the strict one.** src/compose.mjs:312 uses `limit: 100000`; the retry at :313 omits `limit` and so gets the default 20000 (plan.mjs:422). Fix: pass the same limit.

45. **Four copies of the meta-key set.** src/say.mjs:10, src/realise.mjs:14, src/compose.mjs:59 and :231. Fix: one exported `META_KEYS`, ideally a knowledge declaration (`k.attributes.key narrate=no` already exists).

46. **Module exports that are not public.** `fallbackOf` (turn.mjs:49), `subjectOf` (compose.mjs:62), `editDistance` (interpret.mjs:23), `vetoOf` and `setStdCriteria` (rank.mjs:76, :135). Fix: unexport them or make them public on purpose.

47. **Headers claim more language-freedom than the code has.** grammar.mjs:9 says "No word of any language", but :53 handles `'s`. morph.mjs:8 says "Nothing in this file knows a language", but :236-273 default to w.lang.en types and `aeiou`. summarize.mjs:7 says "Language-free", but :69 holds English abbreviations. story-focus.mjs:6 says "Language-free", but :9 is an English lemma. turn.mjs:8-9 claims only actReply is English, but :39, :57 and :66 are too. motion-facts.mjs:3 says "one scheduler", but motion.mjs has another. Fix: correct the headers when the code moves (findings 21-25).

48. **Gaps in docs/literature.md.** It has no entries for `readByTypes` (type-driven semantic parsing), `readFrames` (frame semantics and construction grammar), `parseText` (chart parsing), `normalise`/`canonicalise` (paraphrase normalisation), `splitRunOn`/`segment` (clause segmentation), `solveChoices` (weighted sampling, Efraimidis-Spirakis, cited in plan.mjs:425 but not in the docs), `summarizeText` (extractive summarisation and MMR redundancy), `overlap` (ROUGE, Lin 2004), `editDistance` (Damerau-Levenshtein), `nearWords` (WordNet synonymy and hypernymy), `choose` (lexicographic preference), `dialogueTurn` (dialogue act classification), `focusLog` (centering), `cdcl` (Marques-Silva and Sakallah) and `time` (event calculus). It also lists `generalisationTest` (literature.md:8), which lives in tools/, not the library. Fix: add the rows and mark tool-only entries.

49. **docs/modules.md and repository housekeeping.**
    - The "Services in JavaScript" table (modules.md:32-40) covers about 25 of 172 exports, and the std.decide row (modules.md:21) names 5 of the 9 choice kinds the code declares (std.mjs:699-735).
    - tools/lib-under-test.mjs duplicates the export list of index.mjs by hand.
    - Built copies are committed twice (docs/sopworld.mjs and docs/sopworld.js are both about 15k lines; src/index.d.ts is identical to docs/sopworld.d.ts).
    - 88 lines in src/ are over 250 characters; the longest is 555, at readtypes.mjs:38.

    Fix: generate the modules table from capabilities.md, use `import * as lib` in lib-under-test.mjs, build the copies in CI rather than committing them, and wrap the long lines.

---

### Test timings (one `timeout 900 npm test -- --test-reporter=tap` run; then each file timed serially)

`npm test`: 507 tests, 506 pass, 1 skipped, 0 fail, 229.5 s wall (real 3 m 50 s on 2 CPUs, 68 s user CPU).

Files over 5 s (serial wall time, including about 0.3 s of process start):

| s | file | slowest test inside (from the TAP run) |
| --- | --- | --- |
| 40.3 | test/budget.test.mjs | "suggest, next and complete stop…" 17.5 s; "the solvers answer unknown" 12.4 s |
| 24.4 | test/story.test.mjs | the k.procedures story plan 8.7 s; storyPlan over the catalog 8.5 s |
| 22.3 | compat/psys2/run.test.mjs | kids.arith 12.9 s; kids.shop 8.9 s; kids.tasks 5.9 s |
| 17.4 | compat/psys2/cases.test.mjs | |
| 11.8 | test/lang-ro.test.mjs | round trip for every lemma and cell 10.4 s |
| 8.4 | test/say.test.mjs | |
| 8.2 | test/plan-procedures.test.mjs | |
| 8.2 | test/realise.test.mjs | discourse realiser 6.8 s |
| 7.4 | test/cow.test.mjs | |
| 6.4 | test/diagram.test.mjs | |
| 5.3 | test/cases.test.mjs | |

Counts by severity: 6 serious errors (1-6), 37 structural (7-43), 6 cosmetic (44-49). Total 49.
