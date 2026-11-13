# Worker tasks for sopworld

Written by the reviewer session (Claude, also the reviewer of PSys2) at the user's request, 2026-11-10; rewritten at 14:45 after the user's correction.

**The user's direction: sopworld is a general, useful library for self-consistent worlds of SOP Lang wires. It must be *compatible* with the PSys2 worlds, but it is not built *for* them.** Nothing PSys2-specific goes into the core: no PSys2 type names, no PSys2 envelope, no PSys2 file layout. Every feature below must make sense for any user of the library (a scheduler, a digital twin, a tutoring system, a game) and be documented with a neutral example. PSys2 is the first demanding user: its needs show what is missing, and a small compatibility suite (`compat/psys2/`) proves that such a system can sit on the library through its public, general mechanisms.

## 2026-11-12 09:55 (reviewer): 0.13.2 and 0.14.0 validated

0.13.2 (R14.1) and 0.14.0 (c7247e2, Round 15: `core.function`, `core.function.arg`, load checks, purity, `functions()`, facts never call functions) are validated:
- `npm test`: 278 pass, 0 fail.
- Pilot unchanged.
- No host names and no Romanian.

The host is told to re-vendor at c7247e2. Nothing more is queued.

## 2026-11-12 09:10 (reviewer): Round 15: host functions declared in SOP Lang (user decision)

The user asked for something like `jsEval` / `jsAssert` wires. We already have `core.calc fn=` and `core.check fn=` over functions the host registers. The user agreed with the reviewer's proposal: **no code inside wires**. Instead, every host function is **declared in SOP Lang**, so the schema says which tools a world has. This is also the formal description of tools that formalization was missing.
1. **`core.function`, as wires, like the rest of the schema.** Example: `@f.distance core.function name=distance out.kind=number pure=true doc="…"`, plus one `core.function.arg` per argument (`of=$f.distance name=a kind=number`, `optional=true`). Use repeated keys only; there is no notation inside values (the rule from E3). Check the vocabulary against existing names: there is no `core.function` in `src` today.
2. **Checked at load.** A `core.calc fn=` or `core.check fn=` names a declared function, with the right number of arguments and compatible kinds. A `core.check`'s function returns a boolean. A registered function with no declaration gives a warning, not an error, for compatibility. A declared function that is never registered gives a warning at load and an issue when it is called.
3. **`pure=true`** lets the library cache results within a stamp and use the function in lazy rules and in `score`/`check` overlays. Impure functions are refused there, with a reason.
4. **Visible to readers.** `world.functions()` lists the declarations, so a host can derive tool descriptions and examples (Round 9's `examples`) from them.
5. **Facts never call functions.** Only matrix wires (rules, calcs, checks, denies) do. A told fact that names `fn=` is refused. This keeps instances as pure data: users' words never run code.
6. Docs: language.md (the vocabulary), semantics.md (when a function runs, purity, budget), api.md (`register` and `functions()`). Neutral examples only. Release 0.14.0.

## 2026-11-12 08:50 (reviewer): 0.13.1 validated; one item from the host's reader route

**0.13.1 (e586ac5) validated.** `npm test`: 273 pass, 0 fail. Pilot unchanged (the per-case times are higher only because the box was loaded). No host names, no Romanian. N1–N6, J1 and J2 accepted. The host is told to re-vendor at e586ac5.

**R14.1 A split must not drop a frame it cannot read.** "mark Paris then undo": `interpret` of the split returns a reading for "mark Paris" and silently drops the "undo" part, with `unresolved` and `words` empty. So `rank` and `veto` cannot see that a word was left out, and the host has to count frames against parts itself. Fix: a frame with no reading stays in the result as an unresolved part, with its words. `veto` then reports `words-left-out` for the whole message. Add a test, and release 0.13.2.

## 2026-11-12 07:45 (reviewer): Round 13: namespace defects and two judgement gaps, with repros from the host

The host vendored 0.12.0 and probed its use of namespaces. These are defects with minimal repros, as the host wrote them; it says none is fixed in 0.10–0.12. Check each against 0.13.0 first, then fix it, one commit each, with a test per repro. Release 0.13.1.

- **N1 `replace` in a namespaced world.** `w = new World({ ns: 'A' }); w.load('@t core.type\n@t.k core.slot of=t key=k kind=number'); w.tell('@x t k=1'); w.replace('A::x', '@x t k=2')` leaves the wire as `x` (default namespace); expected `A::x`. A bare id in the replacement text belongs to the namespace of the replaced wire.
- **N2 Aggregate results land in the default namespace.** In a world with `ns: 'A'`, a `core.aggregate over=… by=?k count=?c then=…` tells its `have` wire as `_hk_…` in the default namespace, so a deny that joins `have` with the namespace's facts never matches. Results belong to the namespace of the wires they count. When a group spans namespaces, use the default namespace, and document that.
- **N3 `core.schema.map` ignores `shared=`, `transient=` and `unique=`.** Only native `core.type` reads them. The map needs those fields.
- **N4 Log entries forget their namespace.** `tell('@e.user agent', { ns: '' })` on a world with `ns: 'A'`, then a replay on a second `ns: 'A'` world, gives `A::e.user`. Store `ns` per log entry, and make restore and replay honour it.
- **N5 References to shared types do not fall back to the default namespace.** `@agent core.type shared=true`, `tell('@e.user agent', { ns: '' })`, then in `ns: 'A'` the reference `@p1 pet owner=$e.user` is `dangling-ref $A::e.user`. For `shared=true` types, a bare reference falls back to the default namespace, as docs/language.md section 12 promises for shared facts.
- **N6 `check(patch, { query })` runs the inner query without `ns`.** Pass it through. The host read this in the source; confirm it with a test.
- **J1 A question given as a wire.** `score({ question: <core.question wire with seek=count, type=… where.…> })` about a computed answer that does not exist yet still reports the sought key as a lack. R12.1 only covers `{ type, seek }` objects with an existing subject. Accept a question wire (`seek` in its attrs) and a missing subject whose type and key are the sought ones.
- **J2 Judging actions the host carries out.** The fallback judgement needs `type.key` argument names or `of=`. A host action with bare argument names (`kind`, `color`) stays unjudged, and `veto` reports `action-unavailable` for every one of them. Document and test how a host declares an action's parameters as slots without making the library carry the action out (`core.action name=… param.kind=draw.kind …`, or whatever `param=` already supports), so that the fallback judges it and `action-unavailable` is only reported for actions really unknown.

## 2026-11-12 07:25 (reviewer): 0.13.0 validated

0.13.0 (8b9a46b) is validated:
- `npm test`: 265 pass, 0 fail. Pilot unchanged.
- No host names in `src/`, no Romanian anywhere in `src`, `docs`, `examples` or `test`, and no `lang=` left in `src`.
- `examples/reader.mjs` reads synonyms, a typo and loose words in English.

The host is told to re-vendor at 8b9a46b. Nothing more is queued.

## 2026-11-12 07:10 (reviewer): words have no language (supersedes the 07:00 note)

The user asked why the library should care about several languages at all. It should not: translation is the host's job, done outside the world. The `lang=` key and the per-language machinery were the reviewer's idea (Q17, R10.4). The reviewer's decision, under the user's rule (simplest, nothing unneeded):
1. **`core.word` drops `lang=`.** A word is `core.word text=… means=… [of=…]`. The words of a world are in one language, the one its matrix is written in.
2. **`words(lang)` becomes `words()`.** `interpret(frame)` and `examples(templates)` lose their language argument.
3. **Word forms stay** (several `text=` per meaning; plurals and the like are useful in any one language). **The host lemma hook stays**, as `lemma(token)`.
4. Replace every Romanian word in examples, tests and docs with English.
5. Update docs/language.md, docs/semantics.md and docs/api.md, remove the language parts of docs/design/formalization.md, and release 0.13.0. The `lang=` removal is a breaking change: note it in the changelog.

## 2026-11-12 07:00 (reviewer): the user's decision on languages, one small task

The user decided that nothing in Romanian goes into SOP Lang. Translation is always a separate layer of the host: the browser's translation APIs. For the library:
- **Keep** the language-neutral mechanism: `core.word lang=`, word forms, a host lemma function. A host may use it for any language it chooses.
- **Change** the library's own examples, tests and docs so that they use English words only. Today some hold Romanian words ("cumpără", "pixuri", "minge", "lei" in the reader example, R10.4 and R11.4). Where a second language is needed to show `lang=` or word forms, show the mechanism with English inflection instead (plurals, "-'s"), or with an invented placeholder language, `lang=xx`.
- Keep the tests passing with the same coverage, then cut a patch release, 0.12.1.

## 2026-11-12 04:45 (reviewer): 0.12.0 validated; the library can idle

**0.12.0 (7a49329) validated.** `npm test`: 265 pass, 0 fail. Pilot unchanged. No host names in `src/`. `examples/reader.mjs` reads "buy two pens and one ink" as two lines, every word used, plus a Romanian phrase, a typo, and loose words. R12.1–R12.3 accepted. The host is told to re-vendor at 7a49329.

**Nothing more is queued.** The next library work should come from what the host measures with 0.12.0: world-aware reading with splits, the reader core on its 760 description words, and the Romanian pack. Stop here until a new block appears. Thank you for a very productive night: 0.6.1 → 0.12.0, every release validated, and no host names in the core.

## 2026-11-12 04:15 (reviewer): 0.11.1 validated; Q20, Q21

**0.11.1 (f9959ee) validated.** `npm test`: 261 pass, 0 fail. Pilot unchanged. No host names in `src/`.

**Language answers** (the reviewer's, under the user's rule: simplest, one meaning per construct):
- **Q20: accepted as taken.** `groups=<value>` (repeated) or `groups=$<pattern>`. `$` keeps its one meaning. Close it.
- **Q21: you are right, no `value=`.** `means=<value> of=<type.key>` already says it, and a second spelling would break the rule. My task text was wrong; thank you for checking. Close it.

Next: Round 12 (R12.1–R12.3).

## 2026-11-12 04:05 (reviewer): 0.11.0 validated; R11.4–R11.5 still open; Round 12 from the host's E2

**0.11.0 (c09292a) validated.** Tests and pilot are unchanged (numbers in the commit message of this note). R11.1–R11.3 are accepted. R11.4 (`value=` on `core.word`) and R11.5 (declaration order) are not in 0.11.0. Do them next, as 0.11.1.

The host ran world-aware reading on `score`, `rank` and `veto`, behind a flag. On about 8,400 judged messages it turned 28 wrong answers into not understood or right, with no new wrong answer and 3 right answers lost. Two library limits showed up.

**Round 12.**
- **R12.1 `rank` and questions.** The default order counts, as a "lack", the value a question asks for and cannot have yet. So a statement that tells nonsense ranks above the question that was meant ("a gretel goes what" above "what did gretel say"). The host zeroes `lacks` for question readings. Fix it in the library: the sought key of a question is not a lack. Add a test with a question against a nonsense statement.
- **R12.2 `score` says "not judged" too often.** `judged=false` comes back for most readings, because a reading counts only when the matrix declares the action. Add a cheap fallback judgement that needs no declared action:
  - every referenced id exists;
  - every told value fits its slot's kind, enum and range;
  - no deny fires on the overlay.

  Report which test decided (`judgedBy`). The host's two working vetoes (no referent, no game) are of this kind, written by hand per world.
- **R12.3 `interpret` from a host's descriptions.** The host now has about 760 `core.word` facts over three worlds. Add an example and a test that load words of that shape (an action word, argument words, unit words, all with `means=`) for a neutral shop. Show `interpret` plus splits on "buy two pens and one ink", to make sure the reader core works on descriptions written for pattern generation.

## 2026-11-12 03:20 (reviewer): Round 11 additions from the host's word descriptions

The host moved its operation descriptions to `core.word`: about 760 words over three worlds, plus a Romanian pack measured as an opt-in. It lists what `core.word` cannot carry yet. Two of the points are general and belong here:
- **R11.4 A canonical value per surface form.** A word in another language must name the matrix value it stands for. Example: Romanian "minge" names the item value `ball`, "lei" names the unit `leu`. Today `means=` can name a type, a key or a value, but a slot value written in another language has no link to its canonical spelling. Proposal: `core.word lang=ro text=minge means=item.name value=ball` (one wire, one meaning, as Q17 decided). `interpret` then returns the canonical `ball`. Keep it to this one key: no other new construct.
- **R11.5 Declared alternatives order.** When several words mean the same thing, the host needs a stable order for generated examples and for ties: the most usual form first. Use the existing order of wires, with no new key: document that `words(lang)` and `examples` keep the declaration order, and test it.

The host's other points stay with the host:
- the grammatical role of a word (verb, rest, unit) is its own description vocabulary, not the library's (Q18 stands);
- per-language joiners for its clause splitter belong to the host's tokenizer.

## 2026-11-12 02:30 (reviewer): 0.10.0 validated; Round 11 from the host's re-vendor

**0.10.0 (335309f) validated.**
- `npm test`: 256 pass, 0 fail. Pilot 147/147, 212/217, 231/232. `git grep -i psys2 src/` is empty.
- R10.1 has the test "known words are never corrected". R10.3 runs under the budget guard.
- R10.1–R10.5 accepted. The host is told to re-vendor at 335309f.

The host vendored 0.9.0. Its gap against hand-written code went from +3.0 to about +2.0 ms per turn, and its workarounds are gone (canComplete, replace in place, filters, aggregate, blob, the kb as wires again). It reports three general items, with repros.

**Round 11.** One commit each, plus a release.
- **R11.1 Delta snapshots.** `toJSON({ timeline: true })` writes the whole log, base included: 507 kB for one instance after eight turns. `fromJSON` takes 96 ms, plus a full replay per open mark. Add:
  - `toJSON({ timeline: true, since: base })`: only the entries after the base's own log;
  - `World.fromJSON(data, { base })`: forks the base, replays the rest, and restores the marks as forks.

  Show the size and the restore time for 8 and 40 turns over a 1,000-wire base.
- **R11.2 Redo after a rewind.** `m = w.mark(); w.tell(x); w.rewind(m); w.redo()` gives `nothing-to-redo`. A rewind must keep what it took back, so `redo()` re-applies it, until the next change, as after `undo()`. Check that R7.1's `rewind({ only })` composes with it.
- **R11.3 Groups with zero members.** `core.aggregate by=?k` gives no tally for a group with no member, and hosts need 0. Add `groups=` (a set of values, or a type whose instances are the groups) so that every declared group gets a result, with `default=` for the empty ones.

## 2026-11-12 01:25 (reviewer): 0.9.0 validated; Q19; Round 10

**0.9.0 (f062052) validated.** `npm test`: 250 pass, 0 fail. Pilot 147/147, 212/217, 231/232. `git grep -i psys2 src/` is empty. R9.1–R9.4 are accepted. The host is told to re-vendor at f062052.

**Q19: (b) is right, keep it.** Leaving out part of what was said is worse than resting on a declared default. The host's audit has a real case of exactly this: in one language, "make the hair red" was read as "make it red" with "hair" dropped, and the wrong thing changed. Close Q19.

**Round 10: the reader core against the errors a host actually sees.** The host audited about 1,160 formalization errors. Beyond compounds (done in R9.3) and state-based choice (`score`/`rank`), these classes are general and belong in `interpret`. They are listed in order of size. Use neutral examples, one commit each, and add tests that show **no wrong reading where there was none before**.
1. **R10.1 Near words (typos).** Typos are the largest class: 222 errors, every one a word that is not in the lexicon. When a frame word is not a `core.word`, propose the nearest words of that language: a bounded edit distance (at most 2, and 1 for short words), only among the words the schema can use in that slot. Each such candidate carries `assumes: [{ word, read }]`, so `rank` puts exact readings first and the host can say "(I read X as Y)". Never correct a word that is itself a known word.
2. **R10.2 Follow-ups and ellipsis.** About 40 errors are follow-ups: "no, a red one", "make it yellow", "the other one", "and the price?". Add `interpret(frame, { previous })`: a frame with no verb, or with a pronoun or "one", inherits the verb, type and missing arguments from the previous frame or the last told statement, and replaces what it states. Candidates say what they inherited. Corrections ("no, X") replace the value of the previous frame's matching slot instead of adding to it.
3. **R10.3 Loose words.** About 240 errors are word salad: "red house big", "pen two buy". `interpret` of a bag of words, with no verb order: try each action whose words or argument types match. Return candidates ranked by words used. Leave the host to ask when the top two tie. Bound the search, and charge it to the budget.
4. **R10.4 Word forms.** One language needs inflected forms: plural, definite article attached to the word ("părul", "copacii"). Do not build any language into the core. Let `core.word` carry several `text=` forms, and accept an optional host-registered `lemma(lang, token)` function used before lookup. Document the contract.
5. **R10.5 Veto report.** `rank` already explains places. Add `world.veto(scored, { minWords })`, which says for the top candidate whether a host should answer or not, with the reasons: inconsistent, no referent, words left out, action not available. A host must be able to turn a would-be wrong answer into "not understood" or a question. This is the host's first use of the reader core.

## 2026-11-12 00:40 (reviewer): 0.8.0/0.8.1 validated; answers to Q15–Q18

**Validated at 23f81b0 (0.8.1).**
- `npm test`: 242 pass, 0 fail. Pilot 147/147, 212/217, 231/232. `git grep -i psys2 src/` is empty.
- Benches:
  - fork + first tell: 0.015–0.03 ms, flat up to 6,000 wires.
  - `score`: 0.26 ms for one candidate, 5.8 ms for 100 candidates.
  - lazy rules: a turn 0.01 ms against 1 ms eager, but a question that needs them takes 8–20 ms against 0.05 ms. That is the right trade only for structures that are rarely asked; say so in the docs next to `lazy=true`.
- Namespaces with `::` and the Scope chapter (section 12) are accepted.
- R7.1–R7.8 and R8 are accepted.

The host is told to re-vendor at 23f81b0.

**Answers. The user delegated language decisions to the reviewer, with the rule: nothing complicated, never one sign or construct with several meanings.**
- **Q15: `priority=`, accepted.** It has no other use.
- **Q16: no `expr=` in v1.2.** Your own analysis decides it: it brings a second notation, and `=` with a second meaning (or a new `==`). `between`, `sign` and `clamp` remove most of the measured case, and readers and abduction work on wires. Revisit only if a host shows a rule that still needs more than about 8 calc/check wires after the built-ins, with the example. Close Q16.
- **Q17: (b) `core.word lang= text= means=` (and `of=` where needed), accepted.** One wire per meaning. A load warning when `means=` names nothing. Words are facts, so namespaces, sync and snapshots apply. Build it as Round 9 item 1 together with `interpret`.
- **Q18: (a) no `role=` for now, accepted.** `means=type.key` carries it with one construct.

**Round 9: from design to a usable reader core.** Do these in order, one commit each, with a release at the end.
1. **`core.word` and `world.interpret(frame)`**, as in docs/design/formalization.md: words to candidate wires through the schema and the state, with nothing invented. Use a neutral example: shop and calendar, EN and RO words.
2. **`score` ranking helpers.** A documented default order, as a function hosts can call: consistent first, then unique referents, then fewest missing required arguments, then fewest assumptions, then all words used. Each candidate also carries the explanation of its rank. A wrong reading must be explainable as to why it lost.
3. **Segmentation candidates.** `interpret` of a frame list must be able to score alternative splits of one message into several frames, for "do X and Y" messages. One host found about 30 of 57 errors in English are compound messages split wrongly.
4. **A generator sketch.** From actions, slots and words, produce example sentences per language (for tests and for a host's pattern generator). Templates come from the host; the library only supplies the slots and words to fill them.

## 2026-11-11 23:25 (reviewer): 0.7.1 validated; Round 7

**0.7.1 (93362d7) validated.**
- `npm test`: 228 pass, 0 fail. Pilot 147/147, 212/217, 231/232. `git grep -i psys2 src/` is empty.
- `bench/facts.mjs`, a large table as a provider instead of wires: build 1.6 ms against 58 ms, snapshot 1 kB against 113 kB, and the turn is no slower.
- R6.13–R6.17 accepted. The host is told to re-vendor at 93362d7.

**Round 7.** The host has now moved 18 worlds and grouped its notes into ten proposals. Most of them are already in 0.7.0/0.7.1, which the host has not vendored yet. The items below are what is still missing. The reviewer checked each against 93362d7. Same rules as before: general, neutral examples, one commit each, no host names, a release at the end.
- **R7.1 Labelled marks and a timeline that can be saved.**
  - `mark(label)` and `world.marks()`: the labels and order of the open marks.
  - `rewind(mark, { only: type | prefix })`: undo one unit, for example one note, not the whole step.
  - `toJSON({ timeline: true })` / `fromJSON`: carry the marks and redo stack, so a host that restarts its worker keeps undo and redo.
- **R7.2 Refusals that rank and explain.**
  - (a) A priority on denies (`rank=` or `order=`), so that when one change breaks several denies the first reason is the most specific one. Today hosts rank the reasons with regexes.
  - (b) `why=` on slot violations (type, domain, dangling reference), with the same vars and filters as R6.5.
- **R7.3 Integrity as slot kinds.**
  - `kind=ref to=<type>`: the value must be the id of a wire of that type, refused with a reason otherwise, and checked on retract too.
  - `unique=true` on a slot, or on a set of keys: no two wires of the type share the value.

  In one host these replace 8 of 17 hand-written denies.
- **R7.4 Lists in reasons, and distinct anchors.**
  - A reason can write a many-valued variable as a list through a filter: `?xs:list` with a registered joiner ("A, B and C" in the host's language). Make sure the filter receives the whole list, not one value.
  - `core.distinct` (or `distinct=` on an aggregate) gives one anchor per distinct value, so a count is not computed once per member. The host measured a count anchored on a member at 433 ms against 11 ms.
- **R7.5 Lazy rules.** `lazy=true` on a rule: it is derived only when a query, check or deny needs its output, and not propagated on every change. Use case: a structure re-derived every turn (attack lines on a board) that is read only when a move is checked. The answers must be the same as eager.
- **R7.6 Pure actions.** `core.action pure=true`: an action that reads no cell skips the assumptions pass. Measure the gain; drop the item if it is below noise.
- **R7.7 Small expressions.** One rule today needs 17 `core.calc` and 9 `core.check` wires to say "strictly between two squares".
  - Add `between`, `sign` and `clamp` builtins (`abs`, `min`, `lower`, `matches` and `startsWith` exist).
  - **Propose, in questions.md, before writing any code,** whether an `expr=` attribute (arithmetic and comparison over `?vars` only, no calls except builtins, bounded) belongs in SOP Lang v1.2. It is a language change and the user decides; the user wants one language, without two meanings for one sign.
- **R7.8 Host API clean-up.**
  - `assumptions(ids)` filtered to some wires.
  - A change stamp that does not move when a fork is born or when wires the world already holds are re-told.
  - Document both.

## 2026-11-11 23:40 (reviewer): Round 8, a design study on formalization (after R7.9; proposal only, the user decides)

The user's direction: beyond keeping modelled worlds consistent, find other uses for the library and extend it toward **formalization**, that is reading natural language into wires, and toward **generating the interpreters**. The library knows the schema (types, slots, kinds, enums, ranges, required arguments, actions with their asks) and the current state. That is most of what a reader needs to choose between readings and to guess an intent. What is missing is a formal description of the "tools" (actions and questions) and of their words.

**Write `docs/design/formalization.md`** with a neutral example (a small shop and a calendar, nothing from the host). Prototype only what makes the design concrete. Cover:
1. **Tool descriptions.** A minimal SOP Lang vocabulary that makes a type, slot or action describable for language:
   - argument roles;
   - which slots identify an entity;
   - words per language as wires (`core.word` or similar), registered by the host, not built in;
   - examples.

   Reuse what exists (`core.action required= ask.`, slots, enums) and add as little as possible.
2. **Frames to wires.** `world.interpret(frame)`: from a language-neutral frame (a verb word, argument words, numbers, a question flag), produce candidate wires using the words, the schema and the state. Unknown words stay unresolved; nothing is invented.
3. **Scoring candidates against the world.** `world.score(candidates)`: for each candidate, return consistency (with violations), the referents it resolves (and whether they are unique), the required arguments it lacks, the assumptions it needs, and whether its action is available. It tells nothing. This is the "guess the intent from the state" primitive. Hosts choose by a documented order.
4. **Generating readers.** From tool descriptions plus words, how a host could generate patterns or a grammar per language. Say what the library should own (descriptions, interpret, score) and what stays in the host (tokenizing, morphology, a learned model).
5. **Limits.** What this cannot do (free text, metaphors, long discourse), the cost per candidate, and the tests that would prove it.

Prototype `world.score(candidates)` behind no flag (it is read-only), with tests and a bench at 1, 10 and 100 candidates. Leave the rest as design. **Do not change SOP Lang syntax in this round.** If the design needs syntax, put it in questions.md for the user.

### R7.9: namespaces (user decision, 2026-11-11 23:12; do this first in Round 7)

The user asked for namespaces, so that facts from different worlds or different requests are never combined or confused when schemas and facts are joined. Today variables are local to a rule or question, facts and matrix wires have separate id spaces, and `core.use` prefixes module ids. What is missing:
1. **Fact namespaces.** Add a namespace per instance or per `tell(text, { ns })`. Ids are qualified with `::` (`shop::b1`; Q14, the user's choice). A reference resolves in its own namespace first; another namespace only when written out (`$shop::b1`). Merging by identity keys happens only inside one namespace, unless a type is declared shared. Snapshots, marks, providers and `sync` respect namespaces.
2. **Ownership of names.** A module may declare types and slots only under its own prefix; otherwise an error at load naming both.
3. **Exports.** `exports=` on a module lists the types other modules may read. A module that reads another sees only those. Today one host's `reads=` sees everything.
4. **Ambiguity check.** After modules are joined, report short keys that now resolve to more than one qualified key, as a load warning with both names.
5. **A "Scope" chapter in docs/language.md.** State exactly what is local to a rule, a question, a request (one `tell`), a namespace, an instance and a module. Every statement is tied to a test, as in docs/semantics.md.

Spelling: `::`, decided (Q14).

**Language decisions from now on.** The user delegated these to the reviewer, with one rule: do not complicate anything, and never give one sign or construct several meanings. Put a language question in questions.md as before, with options and your recommendation. The reviewer answers in worker-tasks.md and applies that rule; the user can overrule in the morning.

## 2026-11-11 23:00 (reviewer): 0.7.0 (72a96dd) validated

- `npm test`: 224 pass, 0 fail. Pilot 147/147, 212/217, 231/232. `git grep -i psys2 src/` is empty.
- Benches:
  - fork + first tell: 0.02 ms, flat from 60 to 6,000 wires.
  - Rewind: flat at about 0.015 ms. Note (a) is fixed.
  - `complete({ defaults })` with 150 defaults: 160 → 20 ms. Note (b) is fixed.
  - `complete()` with nothing changed: 0.002 ms.
  - 70 action tells: 0.8–1.8 ms.
  - A 1 MB blob: forks and rewinds at 0.08 ms.
  - 200 unread values: 2.7 ms, against 13 ms for values that rules read.
- R6.4–R6.12 accepted.

The host is told to re-vendor at 72a96dd. R6.13–R6.15 (at 1fdbab0) will be checked with R6.16–R6.17 at the end of the round, as 0.7.1.

## 2026-11-11 22:15 (reviewer): Round 5 (0.6.2) and R6.1–R6.3 validated

- `npm test`: 213 pass, 0 fail, 1 skipped. Pilot: 147/147, 212/217, 231/232 (unchanged). `git grep -i psys2 src/` is empty.
- **P1** (`bench/complete.mjs`): `complete()` with nothing changed takes 0.006 ms (was about 0.17); `canComplete()` takes 0.04 ms.
- **P2** (`bench/fork.mjs`): fork + first tell takes 0.06, 0.03 and 0.02 ms at 60, 600 and 6,000 wires, so it no longer grows with size. Its ratio to a plain tell is 2.15 and 2.56 at 60 and 600 wires, a little above the 2× target, but the absolute cost is tiny. Accepted.
- **P3** (`bench/act.mjs`): 70 tells in a fresh fork take 1.1–1.9 ms with one propagation (was about 4–5 ms).
- **Two notes for later**, no task yet:
  - (a) "the same, after a rewind" still grows with size: 0.06, 0.07 and 0.10 ms. Hosts rewind on every undo and every dry run.
  - (b) `complete({ defaults })` filling 150 defaults takes 160 ms, about 1 ms per default. A host that loads a form with many defaults would feel it. Look at both when R6.12 is done.
- R6.1, R6.2 and R6.3 are accepted as described in their commits. Thank you.

The host has been told to re-vendor at 89bf69d. Continue with R6.4–R6.12 in order.

## 2026-11-11 21:35 (reviewer): Round 6, queued after Round 5. It grows as the host reports.

The user's direction: the host (PSys2) is now moving **every** world to the library, one world at a time, and compares each against its hand-written code on correctness and speed. Where the library cannot express a world or is slower, the host files a concrete, general improvement. The reviewer collects them here, checks each against the current source, and adds them below. **Finish Round 5 first.** Each item gets one commit, a neutral example in the docs (no PSys2 names in `src/` or the docs), tests, and the release recorded as before. No tag.

### R6.1: keys with several values answer as a list in value mode
- **Repro.** `@animal core.type`; `@animal.habitat core.slot of=$animal key=habitat multi=yes` (or however the library spells a multi-valued slot; use that spelling); `@a1 $animal name=dog habitat=home habitat=farm`. Then `query({ type: 'animal', where: { name: 'dog' }, seek: 'habitat' })` returns `conflicting` with `alternatives [home, farm]`.
- **Expected.** A key declared multi-valued answers `supported` with `values: [home, farm]` in value mode too, as `mode=list` already does. `conflicting` stays for single-valued keys.
- **Why it matters.** A host whose questions carry no mode cannot use multi-valued facts at all. Habitats, colours and tags all hit this.

### R6.2: ask whether a derived value equals X
- **Repro.** A rule derives `is_a` from `class`. `query({ seek: 'is_a', where: { name: 'whale', is_a: 'fish' } })` answers `supported fish`: it supposes the `where` value instead of checking it.
- **Expected.** A `mode=check` (name it as you see fit) compares the given value with what the world holds or derives. It answers `yes`, or `no` together with the actual value(s) and their `from`, or `missing`. This is the natural form of "is a whale a fish?" questions.

### R6.4–R6.11: from a document editor and a document reader moved onto the library

The host reports these, and the reviewer checked each against 0.6.1: none of them exists today. The only string builtin is `concat`; there is no `rank`, no blob kind, no transient flag, no `redo`, no upsert and no overlay. Use neutral examples, such as a text editor and a reader.
- **R6.4 Opaque values.** Add `kind=blob` on a slot. The value is kept as given, compared by length plus hash, never tokenized, and excluded from rule matching, but it is part of marks and rewind. Use case: a large immutable analysis (tens of kB to MB) that must undo with the rest. Show the cost of a tell and of a fork with a 1 MB blob.
- **R6.5 Bound variables in refusals.** Add `violations[i].vars = { n: 3, c: 2 }` next to `why`, plus simple filters in the template (`?c:words`, `?n:ordinal`), so hosts do not post-process the string. Keep the filters minimal and pluggable per language, with no English hard-coded in the core: register filters like functions.
- **R6.6 Aggregates that always give one result.** Add `core.aggregate over=… count=?c default=0 then=…`: one result, even over an empty set, and no firing once per match. Today the same count needs one rule copy per kind.
- **R6.7 Rank.** Add `core.rank of=<pattern> by=<key> out=?r`, the position of a wire among matching wires ordered by a key ("the 2nd chapter").
- **R6.8 Transient state and redo.** A type flag, `transient=true`, marks state that is looked at but not edited: a selection, a cursor, a focus. `undo` skips steps that changed only transient wires. Add `world.redo()` as a first-class operation; today `rewind` returns a function.
- **R6.9 Replace in place.** Add `applyPatch({ replace: { id, attrs } })`, which adds or removes keys while keeping the id. Today that takes a retract plus a tell under a new id, and the host maps ids back.
- **R6.10 String checks.** Add `matches` (a bounded regex, refused if it can match empty and loop), `startsWith`, `endsWith`, `lower` and `contains` as builtins for `core.check` and `core.calc`. Example: "a heading that says Chapter 3 is chapter 3".
- **R6.11 Evaluate without telling.** Add `check({ wires, overlay: true })` or `world.ask(question)`. It evaluates denies and rules on the world plus a hypothetical set of wires, and changes nothing.
- **R6.12 Skip the rule pass for values no rule reads.** A patch that only changes slots no rule or deny mentions should not run the propagation. Detect it from the compiled matrix, with no new syntax if possible. Builds on P2 and P3.

### R6.13–R6.17: from a map and a chart world moved onto the library

The reviewer checked these against the source at a1af19d: none of them exists, except that `ties` is already an option on argmax/argmin (see R6.17). Two of the host's other points are already covered: copy-on-write per change (P2; the host measured it before re-vendoring and will measure again) and redo (R6.8).
- **R6.13 External fact source.** Today rules and denies cannot read a large static table (about 1,000 cities) without holding it as wires: 37 ms per turn as wires against 6 ms without. Add a host-provided provider per type, for example `new World({ facts: { city: (where) => [...] } })`, whose results are matched in rule bodies and denies like wires but never copied, forked or logged. Document what a provider must guarantee (pure, bounded) and how it counts against the budget.
- **R6.14 Bulk sync of a collection.** Add `world.sync(type | prefix, wires)`: in one transaction it computes retract, set and tell by id between what the world holds and the given list, and returns the delta. Hosts each write the same 100-line diff today.
- **R6.15 JSON value kind.** Add `kind=json` (or `kind=object`) with path access in patterns (`center.lat=?lat`), so structured values are not flattened into keys plus a duplicate string. Keep it bounded: depth and size limits, and a stable canonical form for comparison.
- **R6.16 Tier from the host.** A host must be able to tell a value as an assumption, for example `tell(text, { tier: 'default' })` or a per-key annotation, so that `assumptions()` lists it ("I assumed a bar chart") and a later told value replaces it.
- **R6.17 Ties in aggregates.** Check whether `ties` on argmax/argmin (in the matrix vocabulary) already returns every tied pick inside a rule. If it does, document it with an example in docs/semantics.md and close the item. If not, add `ties=all`.

### R6.3: check first, then do only what is still missing
Several of the host's older workarounds may already be covered: `register` refusing to replace built-ins, `revise`, `told()`, `check(patch)`. Verify these two and fix only what is still missing:
- (a) `query` on a supposed answer returns the derived answer-wire attributes (the keys set by `core.on`) and a non-empty `from`/`wires`.
- (b) A deny's `why` can carry values from the match, a template with `?vars`, instead of one fixed string.

If both already work, say so in the log with the test that shows it, and close the item.

## 2026-11-11 19:55 (reviewer): answer to Q13

**Q13 (P3, lazy propagation): accepted, with three conditions.**
1. A refusal names **every** queued tell involved in the broken deny or slot, not only the first. The first one goes first in the list.
2. Give hosts a way to keep today's check after each tell: `ctx.flush()`, which propagates and validates the queue now, and `ctx.tell(x, { now: true })`. Document both in SPEC next to the H1 rule ("an action is checked where it reads and at its end").
3. Add tests for both:
   - an invalid middle state repaired by a later tell of the same action is accepted;
   - an action that reads after each tell gives exactly today's results.

   Show in the bench that the 70-tell action pays one propagation.

You may close Q13 when this is done.

## 2026-11-11 19:15 (reviewer): Round 5, performance of forks and completing. Read this first.

0.6.1 is still validated. A demanding host (PSys2, now on the library by default) profiled its turns. It fixed what was on its side and found three costs inside the library. All three are general: any host that forks or marks per request, or completes after every tell, pays them. The reviewer confirmed each one in the code. Do them in order, one commit each, with a bench in `bench/` and **no change in any output** (all tests plus `compat/psys2/run.mjs` identical).

### P1: `complete()` / `next()` with nothing to fill must be cheap
- **Problem.** `_next()` (src/complete.mjs) calls `this.assumptions()` at the top, before it looks at any fill. That is a pass over every cell of every wire. It runs on every loop of `complete()`, even when no slot can ever be filled. Measured: about 1 ms per call in a world of about 300 wires, and about 0.17 ms when nothing changed at all.
- **Change.**
  - Compute `review` only when the caller asks for it, for example `next({ review: true })`. `complete()` does not need it.
  - Add a fast exit: if nothing changed since the last `complete` (compare the world's stamp or version), return at once.
  - Add a public, cheap `canComplete()`, or `next({ count: true })`, that says whether any empty slot has a candidate: a default, or for a required slot an enum, a type or a range. Today hosts read the private `world._compiled().slots` to find this out. Give them a documented API.

### P2: the first change after `fork()` or `mark()` must not copy the whole world
- **Problem.** `_detach()` (src/revise.mjs) copies every wire and every index on the first change after a fork or a mark: wires, `byType`, `index`, `refs`, `byWire`, `byRule`, `matrix`, `alias`, `used`, `firings`, logs and events. This happens even when the change is one fact. Measured: 0.07 ms for a base of 60 wires and about 0.5 ms for a few hundred. It grows with the size of the base, and hosts that mark per turn and fork per dry run pay it several times per request.
- **Change.** Copy-on-write per structure. The matrix, alias and rule indexes do not change when a plain fact is told, so share them until a rule or matrix wire is loaded. Copy only the wires and index sets that a change touches.
- **Alternative.** Make `mark()` journal-based: an undo log, so that a tell after a mark copies nothing.
- **Target.** fork + first one-wire tell within 2× the cost of a tell on a detached world, independent of the base size. Show this in the bench at 60, 600 and 6,000 wires.

### P3: `act` and many tells in a fresh fork
- **Problem.** A declarative action that tells about 70 wires in a fresh fork costs about 4 ms: the detach, then a propagation after each `ctx.tell`.
- **Change.** Inside one action or transaction, batch the tells and propagate once at commit, with the same results and the same refusals. Measure the cost with 70 tells in a fork.

When P1–P3 are done, record the release as before: package.json, docs/version.md and a changelog entry on main. No tag. The host will pin the commit.

## Where things stand (reviewer, 2026-11-10 15:15) — read this first

The reviewer's first two commits to this repository were a false start; ignore them. One list is valid: **G1–G9 below**. The earlier S1–S8 list and the `psys2/` directory no longer exist; only `compat/psys2/` does.

| Task | State |
| --- | --- |
| S0, G1, G2 | validated |
| G12 + G13 (e0d09d7), G14 (8c90f27), H3 tiers and value provenance (7921fce), H4 describe / diff (10d6314) | **validated** (reviewer, 18:40): `npm test` 175 pass, 0 fail, 1 skipped; pilot 147/147, **212/217**, 231/232; no PSys2 name in `src/`. Reviewer probe: a cost derived from a defaulted quantity reports tier `default`; `assumptions()` lists the default with its dependants; telling the quantity replaces it (`revised`) and the cost becomes `derived`; `describe` and `diff` return what they should. **Q12 answered:** your choice is right. `count` stays `missing`; the four cases stay listed as failures of parity, with the note that the library's answer is the more truthful one; the PSys2 host will ask for `received` when `count` is missing (no consumer rule in the runner). Close it. **Two notes:** (1) **G11 (soft constraints) is still to do** — do it next, before H5; the PSys2 integration needs it for the three "impossible event" cases and for dialogue in general. (2) In the reviewer's probe a `default=` on a slot that is **not** `required` was never applied by `complete({defaults:true})`, so a rule that reads the key did not fire. Either apply a default when the key is optional but some rule or relation reads it (tier `default`), or state the rule in SPEC and offer `core.slot ... default=1 apply=always`; say which you chose. |
| H1 atomic patches and sound search (d762dc8), H2 slot conflicts (90116e1), G10 ties are ambiguous (d23b20f) | **validated** (reviewer, 18:20): `npm test` 167 pass, 0 fail, 1 skipped; the reviewer's two repros now give `sat` with both keys forced, and a `schema` conflict naming both declarations; pilot 147/147, **208/217** (was 207), 231/232; no PSys2 name in `src/`. Continue with G11–G14, then H3–H6. |
| G8 pilot (feeb300, 5f80fe7, ed4d9f6), G9 docs (09d310f) | **validated** (reviewer, 17:05): `npm test` 161 pass, 0 fail, 1 skipped; `node compat/psys2/run.mjs`: kids.shop 147/147, kids.arith 207/217, kids.tasks 231/232; `demo.mjs` shows the five demonstrations; no PSys2 name in `src/`; the runner has no per-world logic. The report is honest about the line counts and the tasks world (text handling stays code). Thank you: this is what was asked. |
| G7 budgets, stats, structural fork, one spelling of numbers (455f4a3); G5 abduction through calcs (3ef1b78) | **validated** (reviewer, 16:45): `npm test` 154 pass, 0 fail, 1 skipped; compat tests pass; no PSys2 name in `src/`. Reviewer probes: fork of a 2,000-wire world 0.007 ms and isolated; the shop abduction now answers `b1.paid=19` for "change of 5" (was `[]`); a self-feeding rule is refused in 2 ms. **Q11 answered:** your choice is right — the compiled cost is the figure that matters (reviewer run: cold 33 ms, best of ten 24 ms on a slower host). Close it; no further tuning. |
| G4 aggregates, arithmetic, time (823e3b3); Q8–Q10 applied (cb4f036) | **validated** (reviewer, 16:00): `npm test` 135 pass, 0 fail, 1 skipped; compat tests pass; no PSys2 name in `src/`. On your G4 note: keep pattern matching textual (`5` does not match `5.0`); instead normalise numeric literals **on tell** for slots whose kind is `integer` or `number` (store `5.0` as given but index its canonical form), so hosts never meet the difference. Do it in G7 with the index work, or say why not. |
| `core.check` rename (1b4541b), G6 queries (0d2cb6a), G3 sequence and fluents (5519782) | **validated** (reviewer, 15:50): `npm test` 123 pass, 0 fail, 1 skipped on sources and built file; `compat/psys2` schema and cases tests pass; `git grep -i psys2 src/` empty. |

**Answers to your open questions:**
- **Q8** (`refused` as a sixth status): keep it. "Cannot be" and "several values" are different things; the compatibility runner maps `refused` to PSys2's `conflicting`.
- **Q9** (`complete=true` decides `no` against `unknown`): accepted, and it is the right separation. In the PSys2 mapping read it from `closed`: PSys2 uses `closed=true` to mean "the world knows every instance".
- **Q10** (references to entities outside the session): accepted. The library keeps refusing a reference to a wire that does not exist. In PSys2 `e.user` is a built-in agent that every session has from the start, so the runner telling an `e.user` wire first is correct. The one `$e.tom` case: check whether the agent wire is created by an earlier turn of the same session in the cases file (PSys2 creates an agent wire on first mention, in the same turn); if the wire really is absent from `wires`, list the case as a failure with that reason and I will look at the dump.

**Do next, in this order, one commit each:**
**Round 3 (reviewer, 17:45).** The user sent an outside design review of the library (made at commit e9a6551, before G7 and G5) and asked the reviewer to judge it and organise the work. The reviewer checked each claim on the current code. The result is the order below, one commit each. Finish what you have in hand of G10–G14 first if a commit is nearly done; otherwise follow this order.

## Round 4 (reviewer, 19:05) — read this block first; it replaces the order below

**Validated now:** H5 relations (ff4846c), H6 declarative actions (71f58a0), defaults on optional keys (97d8a7a), 0.5.0 (93a5c5d). Reviewer rerun: `npm test` 182 pass, 0 fail, 1 skipped; pilot 147/147, 212/217, 231/232; no PSys2 name in `src/`. The tag could not be pushed from your session: leave it, the reviewer or the user will tag; the PSys2 worker pins commits meanwhile.

**Validated at 20:35:** L1 one language (8b6a219) and the build identity (533d75a, 59941ab). Reviewer rerun: `npm test` 184 pass, 0 fail, 1 skipped; pilot unchanged (147/147, 212/217, 231/232); no `?id` declaration left in the matrices, examples and tests. Reviewer probe in the new syntax: multi-line `@p purchase … qty=?q` pattern, a fact with the same id `p` does not clash, the rule derives the cost, a fact with a variable is refused, and the old-syntax probe still runs. This is the form the user asked for. **G11 is still missing** (it was first in the order): do it now, then W1–W8, D1, 0.6.0.

**Validated at 20:50:** W1 (3191b63), W2 (b9d5d4f), W3 (b6a5fec), W4 (07d3074), W5 + W6 (9aa0f3e), W7 (305e9fb). Reviewer rerun: `npm test` 192 pass, 0 fail, 1 skipped; pilot unchanged; no PSys2 name in `src/`. Reviewer probe: `revise` of a told quantity recomputes the cost and lists `revised`; `told()` returns the facts as stated and re-telling them is idempotent; a deny's reason quotes the value ("63 lei is too much") with the bindings; `check()` of the whole world; a host function named `add` is refused. **Remaining: W8 (undo / mark / rewind), G11 (soft constraints — asked three times now; the host needs it, please do it next), D1, tag 0.6.0.**

## 2026-11-11 11:50 (reviewer)

**0.6.1 (775dfe7) validated:** the seven notes on `docs/language.md` are done. Reviewer rerun: `npm test` 207 pass, 0 fail, 1 skipped; pilot unchanged; no PSys2 name in `src/`. Probes: JSON escapes in strings, `a..b` refused as an identifier, `k=` refused, a bad escape refused, text before the first declaration refused, a duplicate id refused (each with line and column), and `x@y` kept as one atom. Sections 8 (canonical form), 10 (the old pattern syntax) and 11 (v1 to v1.1) are present.

**Nothing is open for this session now.** The PSys2 host is integrating `main` at 775dfe7 (SOPWORLD-1b). Its next report may bring new requests; until then, no work is needed.

## End of day, 2026-11-10 21:25 (reviewer) — where to resume

**Validated:** everything through **0.6.0** (c1aca9f): S0, G1–G14, H1–H6, L1, W1–W8, D1 parts 1–4. Reviewer rerun at c1aca9f: `npm test` 205 pass, 0 fail, 1 skipped; pilot 147/147, 212/217, 231/232; no PSys2 name in `src/`; `docs/version.md` says 0.6.0, build 7015034cd985.

**The one open item for the next session:** the reviewer's seven notes on `docs/language.md` (in the block "Validated at 21:10" below), which make the language a strict superset of PSys2's SOP Lang v1:
1. JSON string escapes;
2. segment identifiers;
3. the named, strict syntax errors with offset, line and column;
4. the atom rule and `@` inside a value;
5. canonical serialization;
6. the in-memory value kinds for a host parser;
7. a "v1 to v1.1" section.

Do these as 0.6.1, with tests. After that, wait for the PSys2 host's next report (it is integrating at your `main`).

**No git tags (user, 21:14).** The tag idea was the reviewer's and it only caused a stall: your session cannot push tags and the PSys2 worker was waiting for one. Drop it everywhere. A release is: the `version` in `package.json`, `docs/version.md` (version, build hash, date — you already write it) and the changelog entry, on `main`. Hosts pin a **commit hash** and record the version from `docs/version.md`. Wherever this file says "tag", read "bump the version in `package.json` and `docs/version.md`". Do not wait for anyone before bumping to 0.6.0 when D1 is done.

**Validated at 21:10, with a correction.** G11 (ddfcec5) and W8 (280aec2) are in: the reviewer wrongly listed G11 as missing three times; it was done before L1. Sorry. `npm test` 202 pass, 0 fail, 1 skipped. D1 parts 1–3 read (language, reference, semantics): the right shape, executed examples, statements tied to tests.

**Notes on `docs/language.md`, since PSys2 will adopt it as SOP Lang v1.1** (compare with `compat/psys2/specs/01-soplang.md`, which is v1; v1.1 must be a superset where v1 is stricter, or the difference must be stated):
1. **Strings:** v1 uses JSON string escapes (`\n`, `\t`, `\uXXXX`, …) and rejects a bad escape. The grammar here lists only `\"` and `\\`. Adopt JSON escapes exactly, and say what `str()` and `quote()` do.
2. **Identifiers:** v1 is "one or more segments `[A-Za-z_][A-Za-z0-9_-]*` joined by `.`". The grammar here (`name = (letter | "_") { letter | digit | "_" | "." | "-" }`) also accepts `a..b` and a trailing dot. Use the segment form; say whether non-ASCII letters are allowed (v1: no).
3. **Errors:** v1 names every syntax error (text before the first `@`, a declaration without id or type, a token that is not `key=value`, an empty value `key=`, an unterminated string, a bad escape, an invalid identifier, a duplicate id in one parse unit) with offset, line and column, and repairs nothing silently. State the same list and the error shape; where the library is more lenient today, make it strict (an option `lenient` may keep the old behaviour).
4. **Atoms:** v1 excludes `"`, `@`, `$`, `=` and `\` from atoms; here `colour=#fff` and a value containing `=` are allowed. Decide and state it; `@` inside an atom must not be read as a new declaration (give the exact rule: a declaration starts with `@` only at the start of a token).
5. **Canonical serialization** (v1 has it: entries sorted by key keeping the order of repeats, JSON re-escaping, `\n` line ends): include it, `format(wire, { canonical: true })`.
6. **Short and full keys**, and the **value kinds as data** (`{ kind: 'atom' | 'string' | 'ref' | 'var', v }`): describe the in-memory form a host parser must hand over, since PSys2 will parse with its own parser and pass wires.
7. A short **"v1 to v1.1" section**: what is new (variables, comments), what changed, what a v1 file needs (nothing).

Then finish D1 (API reference checked against `index.d.ts`, the generated HTML pages, the test that fails on an undocumented wire type or method) and tag **0.6.0**.

**The first real host has reported.** PSys2 integrated the library (at a7a8e16) behind a switch for three worlds and measured both strategies. On its per-turn consistency audit, turns that leave the world in violation fell from 2.8% (its own code) to 0.3% (matrix); undo, revision and abduction cases started passing; turn time rose 9%. It also sent ten workarounds it needed. They are general API gaps; fix them as W1–W8 below.

**Order from here, one commit each: G11, L1, W1–W8, D1, then tag 0.6.0** (L1 changes the syntax, so it is a minor version).

- **G11 — soft constraints** (as specified below). The host needs it: today an impossible event is refused when told and the user hears "OK"; the host wants the statement recorded with a standing issue.
- **L1 — one language** (as specified below).
- **W1 — functions do not share one registry.** A host action named `add` or `count` replaced the built-in used by effects and calcs. Built-ins, host calc/check functions and host actions live in separate namespaces; a host name that would shadow a built-in is refused at registration unless `{ override: true }`.
- **W2 — a query returns what it derived.** For an answer obtained by supposing a question or request wire, the result carries the supposed answer wire with every key the rules set on it (and `from`), so a host does not need second queries to word the reply.
- **W3 — violations stay explainable after rollback.**
  - A `refused` result names wires as they were (id, type, attrs snapshot), not ids that no longer exist.
  - A deny's `why` may contain `?variables` that are filled from the match ("?m lei is not enough for ?t"), and the violation carries the bindings as data.
- **W4 — `world.check()` with no patch:** validates the whole current state and returns every violation (also soft issues); `World.audit(wires, matrix)` for a foreign set of wires. And a deny over a fluent must be able to refuse the *event* that breaks it at `tell` time (the host saw a purchase that left money negative accepted, and refused only when the balance was asked): document and test the pattern, fix it if the engine cannot do it.
- **W5 — `world.revise(id, key, value)`:** replace a **told** value in one transaction: everything derived from the old value is withdrawn and recomputed, the result lists `revised`. Today `fill` on a told key is a conflict and the host had to rebuild the whole wire for "three of them".
- **W6 — told wires stay as told.** `world.told()` (and `toJSON`) return each told wire exactly as it was stated; values filled later by rules are visible in `get()` with their tier, but re-telling the export to a fresh world must be idempotent (the host got 26 false conflicts).
- **W7 — abduction through `query`:** `query({ ..., mode: 'abduce' })`, or a `missing` result that offers `howto`: when the sought key is open and abducible, the answer lists the explanations, so a host needs no special path for "what did I pay?".
- **W8 — session helpers a dialogue host needs:**
  - `world.undo(n = 1)`: withdraw the last told change(s) as one transaction, returning what went;
  - `world.mark()` / `world.rewind(mark)` for a host that keeps its own snapshots, so its undo and the world's cannot diverge;
  - a refused `tell` in soft mode returns the issue so the host can say it.
- **D1 — the reference documentation** (as specified below), written after L1 so that it uses the final syntax, and covering W1–W8.

The remaining pilot failures (five in arith) are parity differences already judged: no work.

**L1 — one language, and `?` means one thing (user decision, 18:38). Do this right after the task you have in hand, before H5.**

The user's objection, and he is right: `?` is used for two different things. `?p purchase …` *declares* a pattern wire, and `qty=?q` is a *variable* bound by matching. It reads as if a declaration and a variable were the same kind of thing. PSys2's SOP Lang (`compat/psys2/specs/01-soplang.md`) has only `@id type key=value`, and the user wants **one** SOP Lang for facts and rules.

1. **`?name` is only a variable, in value position.** A declaration always starts with `@`.
2. **Pattern wires are ordinary `@` wires.** A wire is a pattern because a rule, deny, relation, action or query names it in `when=`, `not=`, `then=` (the way templates already work: `@a acceleration of=$b magnitude=?A` is a template because the rule lists it), not because of its first character. A pattern with no variable (for example one that only says `core.absent=b`) is still a pattern for that reason. A wire with a variable that nothing names is refused, as today.
3. **Id spaces.** Matrix wires and facts keep separate id spaces as now. Inside a rule, `$p` keeps meaning "the wire that pattern `@p` matched", or the wire that template `@p` produced.
4. **Queries:** `ask('@c change for=$b1 amount=?a')`, or without an id where none is needed (`ask('change for=$b1 amount=?a')`); the bindings are returned by variable name, and the matched wire id under the pattern's id as now.
5. **Comments:** PSys2's v1 has none (`doc=` entries instead). Keep `#` comments: they are useful in rule files and the user's spec will adopt them. A `#` inside a quoted string is text.
6. **Migration:** the parser accepts the old `?id type …` declaration for one version with a deprecation note (`world.warnings`); `format()` and every document, example, test matrix, the playground and `compat/psys2/matrices/` are rewritten to the new form; `tools/migrate-syntax.mjs` converts a file. Add a section "The language" to SPEC that is the single grammar (facts, patterns, variables, references, comments), written so that PSys2 can adopt it verbatim as SOP Lang v1.1.
7. Tests: both forms parse to the same matrix; a `?id` declaration warns; a fact with a variable is still refused; the pilot numbers are unchanged.

**D1 — the reference documentation: syntax and semantics of everything (user, 18:43). After L1, before the 0.5.0 tag; keep it current with every later task.**

The user wants the library well documented, so that its language and behaviour are stated once, precisely, and uniformly. Today the knowledge is spread over SPEC.md, several HTML pages, `docs/integration.md` and the worker log, and parts still describe 0.4.

1. **`docs/language.md` — the language reference** (normative; the source for PSys2's SOP Lang v1.1).
   - Lexical grammar in EBNF: declaration, identifier, entry, value kinds (atom, string, reference `$id`, variable `?name`), comments, whitespace, multi-line declarations.
   - What is an error and how it is reported: offset, line, column.
   - The three signs and their single meanings: `@` declares, `$` refers, `?` is a variable.
   - Id spaces: facts, matrix, modules.
   - Qualified and short keys; the bookkeeping namespace; repeated keys.
   - Canonical serialization.
2. **`docs/reference.md` — one entry per wire type of the matrix language and per built-in function**, all in the same shape:
   - **Syntax:** every attribute, with type, default, whether repeatable.
   - **Meaning:** stated as a rule, not as an example.
   - **When it is evaluated:** on tell, in the chase, at validation, on query.
   - **Interactions:** with inheritance, negation, tiers, budgets, soft constraints.
   - **Violations it can raise.**
   - **Example:** a three-line neutral one.
   - **Limits.**

   It covers: `core.type`, `core.slot`, `core.schema.map`, `core.use` / modules, `core.rule`, `core.deny`, `core.calc`, `core.check`, `core.absent`, selectors, aggregates, `core.fluent` / effects / `delta`, `core.relation`, actions, `core.abducible`, `core.question`, `core.answer`, `core.issue`, tiers, and every function (arithmetic, comparison, time, units) with its domain and what happens when it is not applicable.
3. **`docs/semantics.md` — how a world behaves**, as numbered statements a test can cite:
   - the transaction (ingest, chase, validate, commit or roll back);
   - identity and merging;
   - fixpoint and termination (depth, budget);
   - stratified negation and what "absent" means (open world; `complete`, `closed`);
   - defaults and revision;
   - tiers and their propagation;
   - provenance and retraction;
   - sequence, fluents and as-of;
   - aggregates;
   - relations and propagation against search (what is complete and what is not);
   - the statuses of a query and exactly when each is returned;
   - `sat` / `unsat` / `unknown`;
   - `fork`, `check`, `applyPatch`, `diff`;
   - persistence and replay;
   - the invariants (a refused change leaves the world unchanged; no solver answer unverified; and so on).

   Each statement names the test that checks it (`test/…: "name"`). A statement without a test gets one.
4. **`docs/api.md` — every public method and option:** signature, parameters, result shape (each field), errors, budget behaviour, complexity note, one example. Generated from, and checked against, `src/index.d.ts` by a test, so the two cannot drift.
5. **`docs/glossary.md`** — one line per term, used consistently everywhere: wire, fact, pattern, template, variable, reference, matrix, world, state, scenario / fork, slot, kind, tier, assumption, issue, fluent, effect, relation, action, patch, violation, status. Fix the places where the code, SPEC and pages use different words for the same thing (the log already shows "schema" against "matrix", "test" against "check"); list the renames.
6. **One source.**
   - SPEC.md becomes a short overview that links to these files, or is replaced by them.
   - The HTML pages are generated from the same markdown (`tools/build_docs.py`), so nothing says "0.4" or "seven wire types" any more.
   - A test fails when a wire type, attribute, function or public method exists in `src/` but not in the reference, or the reverse.
7. **Examples are executed:** every code block in the docs that is marked as runnable is run by a test (`tools/doc-examples.mjs`), and its printed output is the one shown.

Write it for a reader who has never seen the code. Where the behaviour is a choice (for example defaults on optional keys, ties, soft constraints), state the choice and the reason in one sentence.

**A. Two defects the review found, reproduced by the reviewer on a7a8e16. Do these first.**

1. **H1 — a whole assignment is checked atomically; search must not reject on invalid prefixes.**
   - Repro:
     ```
     @s1 core.slot of=box key=a required=true enum=1
     @s2 core.slot of=box key=b required=true enum=1
     ?x box a=?v core.absent=b
     @d1 core.deny when=$x why="a without b"
     ?y box b=?v2 core.absent=a
     @d2 core.deny when=$y why="b without a"
     ```
     then `tell('@b1 box')`. `tell('@t box a=1 b=1', {dry:true})` is accepted, but `solveReport()` says **`unsat`** and `next()` reports both keys **dead**. The domains are filtered by trying each value alone, and a solution is verified by applying values one after another, so an intermediate state that a deny (with absence or negation) refuses kills a valid joint completion.
   - Fix:
     - a public `world.check(patch)` (a list of fills and wires applied together in one scratch transaction; returns ok, violations, support; always rolled back) and `world.applyPatch(patch)`;
     - the solvers' oracle verifies whole assignments with it;
     - single-value filtering is used only where it is sound (no deny or rule with negation / absence / selector reads the key), otherwise the value stays in the domain and the search decides;
     - `unsat` is reported only with a complete justification in the declared finite fragment; anything else is `unknown`;
     - `next()` and `suggest()` must not call a key dead on single-value trials in that situation.
   - Tests: the repro; a three-key variant; a random comparison against brute-force enumeration with `check` on small problems with absence-based denies.
2. **H2 — two declarations of one slot are a composition conflict, not "last one wins".**
   - Repro: `@k1 core.slot of=t key=color enum=red enum=blue` and `@k2 core.slot of=t key=color enum=blue enum=green` in one matrix are accepted, and then `red` is refused and `green` accepted: the second silently replaced the first.
   - Rule:
     - identical declarations are shared;
     - different declarations of the same type and key are refused with a `schema` violation naming both, unless one says how to combine: `combine=intersect` (enums and numeric bounds intersect; an empty result is itself a violation) or `combine=override` (explicit replacement, recorded).
     - A subtype redeclaring an inherited key is the existing "nearest wins" and stays.
     - The same for `core.schema.map` mappings and module loads.
     - Check that the PSys2 legends in `compat/psys2` still load (they should have no duplicates; if they do, list them in the log: they are real findings).

**B. The general follow-ups from the pilot (already given): G10 ties → `ambiguous`; G11 soft constraints; G12 calc failure reasons; G13 precision option; G14 fluent delta.** Then rerun the pilot and say which of the ten arith failures closed.

**C. What the user asked for next, and what the review rightly proposes.**

3. **H3 — certainty tiers and value-level provenance.** The user wants the world to know which of its data is solid and which is only guessed, because that is where attention must go.
   - Every value (wire, key, value) carries a **tier**: `told` > `derived` (from told only) > `forced` (the only value a closed domain left) > `default` > `guessed` (chosen by `complete({choose})`, a solver, or adopted abduction). A derived value takes the weakest tier among its inputs (propagated through rules, calcs, aggregates, fluents). Tiers are an ordered set a host may extend (declared as wires), with an optional numeric `cost`; they are ranks, not probabilities.
   - Provenance at value level: the justification of a value names the cells it came from (wire and key), the rule / calc / relation, and the tier; alternative justifications are kept (it already works for wires: keep that behaviour, extend it to values). Changing one input cell invalidates only what depends on that cell.
   - API: `world.tier(id, key)`, `world.assumptions()` (everything below `derived`, weakest first, with what depends on each), `query` results carry the tier and the weakest inputs, `explain` shows tiers, `next()` orders its questions by "weakest value with the most dependants first".
   - A told value always replaces a weaker one for the same key (the existing default revision, generalised to every tier below `told`), with the `revised` list.
4. **H4 — `world.describe()`.** A structured summary a host can turn into text, as plain data (no prose): per type the count and the instances; per instance the keys with value and tier; what is open; what is assumed; standing issues (soft violations); the last N changes with their cause. Options: `{ about: id | type, depth, since: seq }`. And `world.diff(a, b)` between two states or forks ("what changes if we choose B").
5. **H5 — relations that solve in more than one direction** (the review's first extension; G5 already inverts calcs inside abduction, this makes it a first-class, forward mechanism).
   - `core.relation` wires over cells of matched wires, linear in the first version: `sum` / `sub` with constant coefficients, written as wires (your syntax; it must be data), with exact rational arithmetic and unit checks.
   - Semantics (the review's table): after substituting known cells — no unknown and true: satisfied; no unknown and false: conflict naming the cells; **one** unknown with non-zero coefficient: the value is derived (tier = weakest input) if it fits the cell's kind and domain (an integer cell does not take 3/2: conflict); several unknowns: the relation is kept, nothing invented.
   - Propagation by a queue over the relations that use a changed cell, to a fixpoint or a conflict, inside the transaction and under the budget. Finite-domain relations may prune domains by support (table constraint); **this is local propagation, not a complete solver**: the search of H1 still decides (test: the x≠y, y≠z, z≠x triangle over {0,1} must come out `unsat` from search, not from propagation, and not `sat`).
   - A `core.calc` with an invertible function may be declared `relation=true` to get the same behaviour without rewriting matrices. `abduce` uses relations.
   - Tests from the review's prototype: paid − total − change = 0 solved for each of the three (198 cases), the chain x+y=10, y+z=8, z=3 → x=5, y=5; undetermined and conflict cases.
6. **H6 — declarative actions** (the concrete half of the review's second extension). An action declared as wires: parameters, a guard (conditions over cells and parameters), and **simultaneous writes** (every expression reads the state before the action), executed as one patch through `check` / `applyPatch`. It replaces registered JavaScript functions where the logic is "check and update values"; functions stay for everything else. A refused guard returns `refused` with the failing condition. Use it in the pilot where it fits (the shop purchase) and report the lines of `fns.mjs` or matrix it removes.

**D. Postponed, with the reviewer's reasons (do not start):**
- **Symbolic execution of actions and invariant proofs** (conservation and so on): coherent and feasible on top of H5 + H6, but no user of the library needs proofs over families of inputs yet. Revisit after H6 with one concrete use.
- **Bounded planning** (breadth-first over declared actions): after H6, when a host asks for it.
- **A persistent structure of contexts / scenarios:** `fork()` is structural since G7 (0.007 ms at 2,000 wires); scenarios are forks plus a list of assumptions (H3 gives that list).
- **E-graphs, general abstract interpretation, a probabilistic or causal engine, epistemic or deontic logic, general induction, holographic algorithms, VSA retrieval:** agreed with the review, not now; each lacks a concrete problem here.
- The review's point about abduction missing `paid=15` is **already fixed** by G5 (reviewer rerun: `p1.paid=15`), and its recursion worry (p→q, q→p after retracting the last outside premise) **already behaves correctly** (both gone).

**E. Housekeeping at the end of this round:** old HTML pages; version **0.5.0** and a tag, with a short changelog. The PSys2 worker pins that tag.

**Order:** H1, H2, G10–G14 (those not yet done), H3, H4, **G11, L1**, H5, H6, **D1**, housekeeping + tag (D1's files are updated by every task after it). Report the pilot numbers again after G10–G14 and after H6.

Working rules for commits: pull with rebase before each commit; the reviewer only ever changes `worker-tasks.md` (tasks and answers) and, when you ask for more material, files under `compat/psys2/` — never `src/`, tests, docs, `questions.md` or your log. If a reviewer commit lands while you work, rebase onto it; it will not touch your files.

## 0. Protocol

| File | Who writes | What it is |
| --- | --- | --- |
| `worker-tasks.md` (this file) | reviewer only | The tasks. `git pull` before each task. Validated tasks move to "Validated" at the end. |
| `worker-log.md` | worker only | One entry per task: status, commands run, numbers, commit hash, deviations. Push when a task is done. |
| `questions.md` | worker only | Non-blocking questions: take the most reasonable choice, note it, continue. The reviewer answers in this file, under "Where things stand". |

Rules:
1. Everything on disk is in English.
2. Commit after each task (`Gn: <summary>`); `npm test` stays green on the sources and on the built file; rebuild `docs/`.
3. Every number in the log comes from a command written in the log.
4. Zero dependencies, one built file, browser and Node.
5. **Generality test for every change:** could a user who has never heard of PSys2 want this, and is it named and documented without PSys2 words? If not, it belongs in `compat/psys2/` (test code and mapping files), not in `src/`.
6. `compat/psys2/` holds a small sample of PSys2 (see its README): three specifications and three small worlds with their test cases. It is reference and test material. If you need more of PSys2, ask in `questions.md`.

## 1. What the first real user showed is missing (reviewer's check of 0.4, commit 72e22c7)

- The parser already reads PSys2's `.sop` files (13,759 wires in 114 files, no error), and a 15-line matrix reproduces the core of its shop world. Speed is fine (1–2 ms per `tell` / `step`).
- Gaps, all general: no type inheritance; the schema can only be written as `core.slot`; no order or state over time; no aggregates; abduction does not go through calculations; budgets do not cover every loop; `fork()` replays the log.

## 2. Tasks (general features)

### G1 — type hierarchy
`core.type` gets `extends=<type>` (several allowed if you can keep it sound; one is enough). A pattern of type `T` matches wires of `T` and of its descendants; slots are inherited (nearest declaration wins); reference slots (`type=`) accept descendants; indexes follow. Cycles are refused. Neutral example: `vehicle` > `car`, `truck`.

### G2 — schema vocabulary: slots can be declared in more than one notation
Many systems already have their own schema wires. Give the library a **declared mapping from foreign schema wires to its own**, written as wires, so that a user loads an existing schema unchanged:
```
@m core.schema.map from=<wire type of the foreign key declaration>
     of=<how to get the owning type>  key=<how to get the key name>
     required=<attr>  many=<attr or attr=value>  ask=<attr>  type=<attr holding a reference>  kind=<attr holding a literal kind> ...
```
(the syntax is yours; it must be data, not code, and documented). With it:
- literal kinds (`integer`, `number`, `boolean`, `string`, `atom`, quantities, times) are a general slot attribute (`kind=`), checked on tell;
- keys may be written short (`count=`) or qualified (`<type>.count=`); a declared namespace prefix for keys that validation always allows (for bookkeeping keys such as provenance or sequence);
- unknown attributes of schema wires are kept and readable through `world.schema(type)`, never refused;
- a module can be loaded **without** id prefixing when its ids are already qualified (an option of `core.use` or of the library entry).

### G3 — order and state over time
Version 0.4 has no notion of time (SPEC section 6). Add, as wires:
1. **Sequence.** Every told wire has a sequence number (taken from a declared key when present, else the tell order). Tests `before`, `after`; selectors `latest`, `first` in patterns.
2. **Fluents and effects.** A key declared as a state that events change; effect wires say how an event type changes it (`set`, `add`, `sub`, custom function). The current value is derived by applying effects in sequence order from the last explicit statement; an unknown start stays unknown; an effect that breaks a slot bound is a `conflict` naming the event. Retract or replace of an event recomputes incrementally.
3. **As-of queries:** `ask(pattern, { at: seq })`.
Neutral example in the docs: a warehouse stock with deliveries and withdrawals, or an account.

### G4 — aggregates and more arithmetic
1. Aggregates as calc over a pattern, grouped by bound variables: `count`, `sum`, `min`, `max`, `argmin`, `argmax`, `collect`. Maintained incrementally; stratified like negation.
2. Functions: `mod`, `abs`, `round`, integer division; clock and date arithmetic (add a duration, difference, weekday).
3. Typed comparison (`5` equals `5.0`; `10:00` before `14:30`).

### G5 — abduction through calculations
Today `abduce('?x change amount=5')` on a "paid − total = change" rule returns `[]`: the backward step ignores `core.calc`.
1. Invert `add`, `sub`, `mul`, `div` when all but one argument is known; for other functions and enumerable domains, try candidates forwards.
2. An abducible numeric key without an enum can be solved for when one calc chain determines it.
3. Tests: one-step and two-step chains, a non-invertible function with an enum, and a case with no solution (returns `[]` within the budget).

### G6 — queries with a status, and answers as wires
A general query call for "what is the value of key K of the thing matching these constraints": `world.query({ type, seek, where, about, mode })` (also accepted as a `core.question` wire, the shape `next()` already produces) returning `{ status, value | values, from, missing, alternatives }` with statuses `supported` (one value), `conflicting` (several, listed), `missing` (none; names the open key and its `ask`), `unknown`/`no` for existence by open/closed type, `budget`. Optionally it records a `core.answer` wire with provenance. Registered functions can be declared as producers of a key (`outputs=`), tried when lookup finds nothing. Actions (`core.request`-like wires that run a registered function) execute inside one transaction: refusal leaves the world unchanged and returns the violations.
Keep the names neutral and configurable where another system's vocabulary differs (which key holds the status, which wire type is the answer): that is what the compatibility suite will configure.

### G7 — compute budgets everywhere, and cheap forks
1. One deterministic `budget` (`{ steps }`, optional `ms`) per call, ticked in every loop: joins, chase, negation re-evaluation, lookahead, `suggest`, all solvers and the SAT solver, abduction, induction alignment, retraction, aggregates, replay.
2. Out of budget is never a hang and never an exception: `{ ok: false, violations: [{ kind: 'budget', site, steps }] }` (or `unknown` for solvers), world unchanged. `world.stats()` gives steps per site of the last call.
3. A test per site with a matrix built to explode; a static test that every `while`, `for(;;)` and recursion in `src/` ticks the budget or carries `// bounded: <reason>`.
4. `fork()` becomes structural (snapshot or copy-on-write), not a replay: a fork of a 2,000-wire world in < 1 ms. Hosts make many what-if copies per user message.

### G8 — compatibility suite and proof of value (`compat/psys2/`, test code only)
Shows that a real system can sit on the general library **without changes to `src/` that name it**.
1. `compat/psys2/mapping.sop`: the G2 schema mapping for PSys2 legends (`core.key` with `value`, `card`, `ask`, `required`; `core.type` with `extends`; `core.legend` with `imports`), the bookkeeping namespace (`core.*`), and the G6 vocabulary (PSys2's `core.question` / `core.answer`, `core.status`). Loading the legends in `compat/psys2/worlds/` through it gives 0 violations.
2. Three small worlds rebuilt as matrices in `compat/psys2/matrices/<world>/matrix.sop` (rules, fluents, aggregates, denies, defaults; a small `fns.mjs` only where really needed): `kids.shop`, `kids.arith`, `kids.tasks`. The existing `ops.mjs` there shows what must be computed; the goal is to replace its logic, not call it.
3. Runner `compat/psys2/run.mjs`: for each line of `cases/<world>.cases.jsonl` (same `session` = same World), tell the non-answer wires, run the query or action for each question or request wire, and compare status and value(s) with `psys2.answers` (reply wording is not compared).
4. Report per world: cases passed / total (147, 217, 232), lines of matrix + fns against the lines of the `ops.mjs` logic replaced (159, 237, 231), ms per case; and one demonstration each of what the matrix adds: a missing argument asked as a question, a default withdrawn by a later statement, `retract` as undo, `explain` of an answer, one abduction.
5. **Done when** each world passes ≥ 95% with at most half the code, every failure is listed with its reason, and `git grep -i psys2 src/` is empty.

### G9 — documentation
SPEC and docs updated for G1–G7 with neutral examples; `docs/integration.md`: how a host system maps its schema, its questions and its operations onto the library (the general recipe), with `compat/psys2/` as the worked example.

## 3. Order

G1, G2, G6, G3, G4, G7, G5, G8, G9. G8 for the shop world can start as soon as G1, G2, G4 and G6 are in.

## Validated

- S0 (c583bfa): tests that need an outside solver are skipped when it is missing; `AGENTS.md` added. Accepted from the log (80 pass, 1 skipped, 0 fail).
- G1 + G2 (23f238b): type hierarchy; schema mapping as data, literal kinds, qualified keys. Reviewer rerun: 96 pass / 0 fail / 1 skipped twice, compat schema test 2 pass, no PSys2 name in `src/`. Open from it: the `replace` benchmark is slower than 0.4 (goes to G7).
- `core.check` rename (1b4541b), G6 (0d2cb6a), G3 (5519782): reviewer rerun 123 pass / 0 fail / 1 skipped twice; compat tests pass; no PSys2 name in `src/`.
- G4 (823e3b3), Q8–Q10 applied (cb4f036): reviewer rerun 135 pass / 0 fail / 1 skipped; compat tests pass.
- G7 (455f4a3) and G5 (3ef1b78): reviewer rerun 154 pass / 0 fail / 1 skipped; fork 0.007 ms at 2,000 wires; shop abduction answers paid=19; runaway rule refused in 2 ms. Q11 closed (compiled cost is the target).
- G8 pilot and G9 docs (feeb300, 5f80fe7, ed4d9f6, 09d310f): reviewer rerun 161 pass / 0 fail / 1 skipped; pilot 147/147, 207/217, 231/232; five demonstrations run.
- H1 (d762dc8), H2 (90116e1), G10 (d23b20f): reviewer rerun 167 pass / 0 fail / 1 skipped; repros fixed; pilot arith 208/217.
- G12–G14, H3, H4 (e0d09d7, 8c90f27, 7921fce, 10d6314): reviewer rerun 175 pass / 0 fail / 1 skipped; pilot arith 212/217; tier probe passes. Q12 closed. Open: G11, default on an optional key.
- H5 (ff4846c), H6 (71f58a0), optional-key defaults (97d8a7a), 0.5.0 (93a5c5d): reviewer rerun 182 pass / 0 fail / 1 skipped; pilot unchanged.
- L1 (8b6a219) + build identity (533d75a, 59941ab): reviewer rerun 184 pass / 0 fail / 1 skipped; pilot unchanged; new-syntax probe passes.
- W1–W7 (3191b63 … 305e9fb): reviewer rerun 192 pass / 0 fail / 1 skipped; probes pass.
- G11 (ddfcec5), W8 (280aec2), D1 parts 1–3 (1221361, 599e6de, e81f470): reviewer rerun 202 pass / 0 fail / 1 skipped. Notes on the language reference for v1.1 given.
- D1 parts 3b–4 (e387c51, 6e60fe7) and 0.6.0 (c1aca9f): reviewer rerun 205 pass / 0 fail / 1 skipped; pilot unchanged.
- 0.6.1 (775dfe7): language v1.1 notes done; reviewer rerun 207 pass / 0 fail / 1 skipped; probes pass.

## Round 16 (reviewer, 2026-11-13): findings of the first knowledge worlds (sop-knowledge-worlds Round 1, worker-log there)

1. **Advice must not make knowledge conflicting (bug).** After a soft issue (a fish placed in the sky), the answer to "where does a fish live" comes back `conflicting`, because it rests on the wire named by the issue. A soft issue (`soft=true`) is advice about the *placed* fact; it must not lower the status of the knowledge wires it read. Fix and add a test; hard denies keep today's behaviour.
2. **Order-dependent merge across modules (bug).** A fact of a subtype told before the supertype fact of the same identity becomes one wire; told after, two. The result must not depend on the order. Decide the simplest rule, document it, test both orders.
3. **Misleading error.** A module loaded through `imports=` whose short matrix ids clash with the application's ids reports "neither loaded nor in the library". Report the real cause (id clash, both ids, both modules).
4. **`version=` on `core.module`** is an unknown attribute today. Accept it (a string, reported by `modules()`), nothing more.
5. **"One of" in a deny pattern** (`at` is sky or grass) needs two denies today. Only report: is a repeated value on a pattern key (`at=sky at=grass` = any of) consistent with the existing meaning of repeated keys? Do not implement before the reviewer answers.
Gates as usual: npm test, compat run, benches, no application names in src.

## Reviewer 2026-11-13 09:35 — 0.15.0 (Round 16) validated at 782cd0c

npm test passes (283, 283, 282), compat run unchanged (kids.arith 212/217, kids.tasks 231/232), no application names in src. Accepted. PSys2 and sop-knowledge-worlds are told to move to 782cd0c.
- **Q22:** (a). A repeated key stays "all of" everywhere; "one of" is two denies. No `one_of` built-in for now: two short denies are easier to read than a check, and nobody has needed a third yet.

## Round 17 (reviewer, 2026-11-13): what the knowledge worlds and the coming `space` module need

Context: sop-knowledge-worlds now has 10 worlds (2,003 drawable objects, about 337,000 wires in 654 shards) and reported limits; PSys2 starts a shared `space` module (selection by position, relative moves, layouts) used by several worlds.

1. **A condition for "this key has no value"** in queries and patterns. Today a query cannot ask for facts without a key (the knowledge worker could not keep two drawings of one name apart). Propose the simplest form that adds no second meaning to an existing sign, show it against the current syntax, implement after the reviewer answers in this file (write the proposal as Q23; not blocking for items 2–4).
2. **A standard function pack, declared in SOP Lang** (`core.function`, pure), shipped with the library and opt-in by `core.use`: numbers (min, max, sum, average, median, abs, round, clamp, between), order (rank of a value in a set, nth smallest/largest), boxes (overlap of two boxes, centre, distance, contains). Each with its declaration, tests, and a note on what `core.aggregate` and `core.rank` already cover so nothing is duplicated. The `space` module must be writable with these and rules only: add a small example world `examples/space` (5 items in a frame; "the middle one", "left of", "in a row") with tests.
3. **Report only: ordered sequences.** One wire per point makes 80% of the wires of the drawable objects (`k.objects.point of= n= x= y=`). Options, with the cost of each in load time and memory on a shard of 1,700 wires, and whether each stays inside "no notation inside values": keep as is; a repeated key that keeps its order; a typed list kind. Recommend one. Do not implement.
4. **Value query over several wires.** A `value` query that finds the same answer on several wires returns `conflicting`; hosts must use `list`. Decide and document: same value on several wires = `supported` (with all the wires as support); different values = `conflicting`. Tests.
5. **Load cost at scale.** Bench: tell 50 knowledge shards (take real ones from sop-knowledge-worlds `docs/worlds/k.objects/shards`, copied into `bench/fixtures`, CC0 hand-written ones only) one after another into one world; report time and memory per shard, and whether it grows with the number already loaded. Fix what is quadratic.
Gates as usual: npm test, compat run, benches, no application names in src. Release as 0.16.0.

## Reviewer 2026-11-13 14:55 — answers Q23, Q24 (Round 17 in progress)

- **Q23:** (b). `absent: ['key']` in the object form and `core.absent=key` on a `core.question` wire, with exactly the meaning of the pattern modifier. Add the line to docs/integration.md.
- **Q24:** report accepted. Decision: keep one wire per point for now. Load time (64 ms for the largest shard) and size are not a problem yet, and the owner's rule for the knowledge worlds is "no notation inside values". `kind=json` stays allowed in the language as it is; the knowledge worlds do not use it. If drawing shards become a real cost on a phone, the reviewer reopens this with the numbers of your table.

## Reviewer 2026-11-13 16:45 — Round 18 (after 0.16.0): delegation between modules (owner)

**Owner's direction:** worlds are reusable modules; a world delegates and gets reasoning, defaults and gap filling from other worlds. PSys2 gets the host side as WORLDS-AS-MODULES (see its worker-tasks.md, M3). Propose the library side, smallest that works, one meaning per construct:
1. **Needs and offers.** A module states what a request needs when a key is absent (a typed gap); another module states what it can offer for that type. Check whether rules + `core.absent` + imports already express it; if yes, write the documented pattern and an example, no new construct.
2. **Order and source.** A fixed, declared order of fillers (user > dialogue focus > scene > knowledge > own default) and the source recorded on the filled wire, so a reply can say where a value came from.
3. **Example** in examples/: a tiny draw world that asks a knowledge module for the usual place of a thing and a dialogue module for the last thing; tests for order, for "no offer", and for two offers at the same rank (must be reported, not picked silently).
4. Report in questions.md what cannot be said today and the options; do not add syntax before the reviewer answers.
