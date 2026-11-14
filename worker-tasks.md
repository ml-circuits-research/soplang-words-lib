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

## Reviewer 2026-11-13 17:10 — 0.16.0 validated; Q25 → (a); Round 19: what the experiments taught us (owner asks for it)

**Validated at 9187b39:** npm test 293 / 291 pass / 0 fail in the three runs (the 2 others are todo/skip, one is the core.rank repro). 0.16.0 accepted; PSys2 and the knowledge repo are told to move to it.

**Q25 → (a).** Ship the choice as a library module used per key, ranks as named tiers declared once (user, focus, scene, knowledge, default). No new construct. **Fix the core.rank conflict first** (item 4): a better offer arriving later is the normal case in a dialogue.

**Round 19, from what the demo's failures showed.** Each item is a reusable module or a library ability, with an example and tests; hosts must not rebuild them:
1. **`std.fill`** (the Q25 module) with the tiers above; example with three keys (place, size, colour) delegated at once.
2. **`std.focus`**: last thing, last action, last place, last world, updated by rules from requests; a request with an absent thing or action is completed from it. This is the dialogue module PSys2 needs (continuations, "further right", "and lower").
3. **`std.relations`** on top of examples/space: kept relations (on, in, next to, in front of, above) that are re-derived when a thing moves; sets ("each", "all", "the first", distribute over places). Report what is rules only and what needs functions.
4. **Why-answers.** One call that returns, for a wire, the chain that produced it (request, rule, filler tier and source, default) in a stable structure a host can turn into a sentence. The owner asked the demo "why is it so low?" and "why did you open chess?" and nothing could answer.
5. **Refusable readings.** A way to ask "would this request be refused in the present state?" without applying it (dry run with the reason), cheap enough to call for every candidate reading; the router uses it to drop "hangman word" when no game runs.
6. **All or nothing for one sentence.** Several requests applied as one group: if one is refused or incomplete none is applied, and the group is one undo step. Say what exists (dry run, undo) and what is missing.
7. **Cost.** PSys2 logged 1,056,197 steps for one short sentence, mostly matcher backtracking in the host. Offer an indexed match for patterns (by first content word and by type) as a library service if it can be general; measure on PSys2's pattern set from compat/.
Order: rank fix, 1, 2, 5, 6, 4, 3, 7. Questions in questions.md; no syntax before an answer.

## Reviewer 2026-11-13 19:25 — for comment: ACTS × SCHEMAS (owner's direction), what the library should provide

Read the block "PROPOSAL … ACTS × SCHEMAS" in PSys2's worker-tasks.md (github.com/ml-circuits-research/psys2). Write in questions.md, before building anything: (1) how a world schema (kinds, attributes, value types, allowed acts, defaults, limits) is declared today and what is missing; (2) whether a generic "apply act to schema" (make, remove, change, relate, group) can be a library module over the existing request / rule machinery; (3) what the state difference and the reason chain of one applied act look like, since replies, undo, the log and why-answers are to be generated from them; (4) the smallest example: two unrelated worlds (a seating plan and a face) driven by the same act module with no world-specific rules. Round 19 stays in its order; this is design work in parallel.

## Reviewer 2026-11-13 19:35 — Round 20: ACTS × SCHEMAS is approved by the owner; build the library side

The "for comment" block above becomes work (answers 1–4 still go to questions.md, with your recommendation, and you continue on it). After the core.rank fix and `std.fill`, `std.focus` of Round 19:
1. **`std.schema`**: declaring a doing world: kinds, attributes with value types, allowed acts, defaults, limits; checked at load; a world can say "any kind of <knowledge type>".
2. **`std.acts`**: the generic acts over a schema (make, remove, change, place, connect, group / take apart, pick, ask, copy, send, save / load) as rules over requests; each applied act yields a state difference and a reason chain in a stable shape (for replies, undo, logs, why).
3. **Refusals with alternatives**: when an act does not apply, the answer names what the schema does allow for that thing, and (given several schemas) which world allows the act.
4. **Example and tests**: a seating plan and a face driven by the same modules with no world-specific rules; a third schema added in a test with zero new rules.
5. **Cost**: steps per act on 10 / 200 / 2,000 things.
PSys2 builds its host side now (its tasks A1–A3) and will switch to these modules as they land: publish small versions often (0.17.0 with schema + acts first).

## Reviewer 2026-11-13 19:55 — Q26 → (a); Q27 → accepted as recommended

- **Q26 → (a).** PSys2 is asked to copy its patterns.sop files and spec 03 into compat/psys2; measure `PatternIndex` on the real set and on the 1,056,197-step sentence, and say whether `needs` can express optional and phrase groups.
- **Q27 → yes, as you recommend:** kinds stay types extending `std.schema.thing`, attributes stay slots, `std.acts` ships one generic action function per act, a world says only data; `act` results carry `diff`, `why(id, key)` gives the chain, a sentence is one `act([...])` step. Add the missing declarations you list (which acts apply to which kind, "any kind of <knowledge type>", a count limit, one wire naming a world and its kinds, defaults applied when a thing is made). Ship 0.17.0 with the seating plan + face + playlist example as soon as it passes; PSys2 is waiting for it.

## Reviewer 2026-11-13 20:20 — 0.17.0 and 0.18.0 validated at b5c7f3d; Round 21

**Validated:** npm test in the three runs 322 / 321 pass / 0 fail (the other one is a todo); `node examples/acts.mjs` read by the reviewer: a seating plan and a face driven by the same acts, refusals that name what the kind allows and where the act is possible, the diff of the last act. Accepted. PSys2 and the knowledge repo are told to move to 0.18.0.

**Round 21 (what PSys2 will hit next; same rule: data, not world code):**
1. State in worker-log whether the core.rank conflict (Q25 item 4) is fixed; if not, it is first.
2. **The remaining acts**: send (a thing to another world, both schemas checked, one undo step across the two), save / load, undo / redo as acts with the same diff and why.
3. **From schema to words**: generate from a schema what a host needs to read and to speak: the card (kinds, attributes, acts, words), example sentences per act, and the reply for a done act and for a refusal from `diff` + `why` in plain English (one generator; hosts translate).
4. **Knowledge as a filler**: an adapter that turns facts of a knowledge catalog wire format (`k.*` wires with `core.source`) into `std.fill` offers at the knowledge tier (usual place, usual colour, stand-in kind), so a schema can say "any drawable kind" and get defaults with sources. Example with a few wires copied from sop-knowledge-worlds (CC0 ones).
5. **Sets and values in acts**: "each", "all", "the first", "random", "different", "same as X" as role values the acts understand (change colour of each car to a random colour).
6. **The session as facts** (the owner's "a chart about the current discussion"): the acts done so far offered as queryable facts (what was made, counts per kind, per world) so another schema can take them as content.
Order: 1, 3, 4, 2, 5, 6. Small releases.

## Reviewer 2026-11-13 21:30 — Round 22: TRANSFER between worlds (owner's current goal), the library side

Read "TRANSFER" in PSys2's worker-tasks.md. Answer in questions.md and build what needs no new syntax:
1. **A shared store of things across schema worlds**: one module holding things (identity, kind, attributes); several schema worlds as **views** over it, each declaring which attributes (grouped as aspects) it shows; an act in one view is seen by the others; one undo history. Can today's modules + imports + `std.schema` say this? What is missing?
2. **View selection**: "show these things in that view" as an act; a refusal when a thing lacks the aspect, with the reason ("a table has no place on Earth").
3. **Taught facts**: facts told by the user in the format of knowledge wires, kept in their own module at their own tier (above knowledge, below what was just said), with `why` naming who taught it and when; retracting one.
4. **Example and tests**: three views (a picture, a chart, a list) over the same things; a thing made in one appears in the others it has the aspects for; a taught "is a kind of" changes a default in all three.
5. Round 21 keeps its order; item 6 there (the session as facts) is the same store: merge them.

## Reviewer 2026-11-13 21:40 — open questions: both are answered; Round 23: discover and support the patterns of reuse between worlds (owner)

**questions.md:** Q26 and Q27 are still listed as open; both were answered in the 19:55 block (Q26 → (a), PSys2 was asked to copy its patterns.sop files and spec 03 into `compat/psys2/`; Q27 → accepted as recommended, shipped as 0.18.0). Move them to Closed. R21 item 1 (rank fixed) and `schemaCard` / `schemaExamples` / `actReply` are noted; validation at the next release.

**Owner:** "tasks about generalising and intelligently reusing worlds among themselves; even if it is sometimes wrong, discovering the reuse patterns is already progress." So this round is a study with tools, not only features. Imperfect is fine; say what is uncertain.

1. **A catalogue of reuse patterns** (`docs/reuse.md`), each with a name, when it applies, how it is said today in SOP Lang, a minimal example, and what is missing. Start from these and add what you find: views over shared things (Round 22); filling by delegation (`std.fill`); specialisation (a world is a kind of another, with overrides); composition (a thing in one world is itself a world of another schema: a face in a picture, a chart in a document); the parameterised world (one "list" world instantiated as tasks, shopping, playlist; one "board game" as chess, tic-tac-toe); rule lifting (a rule about a kind holds in every world that has the kind); pipeline (the result of one world is the content of another: a sum → a chart); analogy (the structure of one world mapped onto another: seats ↔ slots, row ↔ queue); shared words; defaults by tier.
2. **A detector, not a judgement:** `tools/reuse.mjs <worlds…>` reads a set of worlds and reports, with a score and the evidence: types and slots with the same shape under renaming, rules with the same shape under renaming, vocabularies that overlap, actions with the same signature, two worlds that could be one parameterised world, rules that mention only kinds from an imported module (liftable). Output: a ranked list of candidates for a shared module. Run it on `compat/psys2` (its tab worlds and kids.* worlds), on `examples/`, and on the knowledge repo's schemas (github.com/ml-circuits-research/sop-knowledge-worlds, `docs/worlds/*/schema.sop`); put the three reports in `docs/reuse-reports/`. Say for the top 20 candidates whether you believe them.
3. **For the three strongest candidates, do the reuse**: extract the shared module in `examples/` (not in PSys2's files), show both worlds running on it with their tests, and report wires before and after.
4. **Parameterised worlds:** the smallest way to instantiate one module several times with different names and words (check what imports with renaming already allow); example: a `list` module as tasks, shopping and playlist.
5. **Composition:** a thing whose content is another schema world (nested), with acts reaching inside ("make the eyes of the second face green", "the title of the chart in the document"); what `std.acts` needs.
6. **Advice at load:** when a world is loaded next to others, soft advice (never an error) of the form "kind X here has the shape of Y in module Z: import it?", "this rule is already in std.relations". Off by default, on for authors.
7. **A reuse number per world**: own wires against imported or shared wires that are actually used; print it in the reports so progress can be followed.
Order: 1 and 2 first (reports), then 3, 4, 5, 6, 7. Round 22 (shared things, views, taught facts) and the rest of Round 21 run alongside; small releases.

## Reviewer 2026-11-13 22:40 — the general modules built in PSys2 move here (owner)

Owner's rule: general worlds do not live in PSys2. Modules that need functions belong to this library's standard pack. PSys2 today has its own bridges: `worlds/acts` (act grammar tables, executor), `worlds/space` (selection, amounts, relations, pieces, the stable solver, joins), `worlds/session.things` (shared things and views), `worlds/session.dialogue` (focus, continuation, correction), `worlds/meta.worlds` (routing rules). PSys2 will put each under `handover/<module>/` in its repository (github.com/ml-circuits-research/psys2) with a note. For each, as it appears: compare with your `std.*` module of the same job, take what is general (rules as SOP Lang, geometry and solvers as pack functions, with tests ported), say what you refuse and why, and release. Nothing English-specific and nothing about PSys2's tabs enters the library. Keep a table in docs: module, PSys2 lines replaced, version.

## Reviewer 2026-11-13 22:50 — Round 24 (owner): every general mechanism for handling and using worlds lives in this library, and what the library can do is well documented

**Owner:** "all general mechanisms for manipulating and using worlds must be in the reusable library, so we can use them in other projects; and what the library can do must be well documented."

**A. Scope: what moves here beyond the modules already listed (22:40 block).** Anything a second project would have to rebuild:
1. **Loading worlds by lookup**: a catalog (index + vocabulary → shard), a loader with a cache interface and an offline bundle generated from a catalog; today it is PSys2's `src/knowledge/catalog.mjs` and `facts.mjs`. The library gets the mechanism; fetching and storage stay injected by the host.
2. **Choosing the world for a request** (routing by cards, referents, state, refusals) as a module over `std.schema` cards; the host supplies only signals it owns (an encoder score).
3. **The request life cycle**: candidate readings → dry run → fill by tiers → act (all or nothing) → diff → why → reply data; one documented pipeline with hooks, so a host writes reading and rendering only.
4. **Graded fallback** (fill and say the guess; not here but there; one question) as part of that pipeline.
5. **Generators from a schema**: card, examples, reply data (exists), a coverage grid (world × act × kind cases with expected diffs), test skeletons.
6. **Tools for authors**: validate a world, the reuse detector, a failure-ledger format and grouper keyed by pipeline stage (reading, routing, filling, acting), a bench.
State for each what is general and what you refuse (anything about English, a UI, or one application).

**B. Documentation (as important as A).** One place a new project starts from:
1. **`docs/capabilities.md`: what the library can do**, by job not by API: describe a world; state facts and rules; ask and explain (why); act, undo, groups; refuse with alternatives; fill gaps from other worlds; keep focus in a dialogue; relate and place things; share things between views; teach facts; load knowledge by lookup; choose a world; generate cards, examples, tests; measure reuse. Each job: one paragraph, a ten-line example that runs (tested in CI so it cannot rot), the module and version, limits and what it cannot do.
2. **`docs/quickstart.md`**: a new application in an hour: a schema, three acts, a knowledge world by lookup, a reply. Runs as a test.
3. **`docs/modules.md`**: every `std.*` module: purpose, what it imports, its types and actions, its tiers, cost.
4. **`docs/patterns.md`**: the reuse catalogue of Round 23 joined to it (how worlds combine).
5. **`docs/host-contract.md`**: exactly what a host must supply (reading text into requests, rendering, storage, fetching) and what it must not rebuild.
6. A **capability table in README** (job → module → example → since version) generated from the examples' headers; CHANGELOG entries point to it.
7. Check the docs by using them: write `examples/second-app/` (not PSys2: for instance a small recipe planner or a room planner) using only the documentation, and list in worker-log every place the docs were not enough.
Order: B1 for what exists today first (it will show the holes), then A1, A3, A4, A2, A5, A6 with their docs as they land, then B7. Rounds 21–23 continue; where they overlap, one implementation.

## Reviewer 2026-11-13 23:55 — 0.19.0–0.23.0 validated at 3061b49; Q28, Q29; what next

**Validated by the reviewer:** npm test 343 / 342 pass / 0 fail in the three runs; `docs/capabilities.md` read (13 jobs with runnable examples, "Not done yet", the take-over table); `docs/reuse-reports/psys2.md` read (157 candidates; reuse number 0 for most PSys2 worlds: that is the baseline). Accepted: shared things, aspects, views, `show`, taught facts and the `taught` tier, the reuse catalogue and detector with `advise`, `createCatalog` / `bundleReader` / `build-bundle`, the capabilities page.
- **Q28 (a) → one value per key;** a view scales or restyles in its renderer. **(b) → yes, an act `complete`** that applies defaults learnt later to existing things, on request, with tier and source; never silently.
- **Q29 → (a) with `as=` only** (`core.use world=list as=tasks`): renaming is one sign with one meaning; words are told as `core.word` wires after loading. Keep `instance` as the helper until it lands.

**Next, in order:** the "Not done yet" list of the capabilities page: A3 + A4 (one request pipeline with graded fallback) first, because PSys2 is switching its executor to `std.acts` now and needs act groups, decline and fallback in one place; then A2 (choosing a world), A5 (coverage grid), A6 (ledger). Then `docs/quickstart.md`, `docs/host-contract.md` (PSys2 has written `docs/host-boundary.md`: the two must agree; say where they do not), and the second application written from the docs alone (B7). From the PSys2 reuse report, extract first the three you believe most: selection / last-thing rules shared by art.draw, diagram.sketch, docs.editor and docs.reader (→ `std.focus`), the lookup actions of the kids.* worlds (→ the `ask` act over knowledge), game / move of the board games (→ a parameterised `board`). Take PSys2's other `handover/` packages as they come (acts, space, session.things, session.dialogue, meta.worlds).

## Reviewer 2026-11-14 00:25 — Round 25 (owner's question): is the request pipeline itself a world that can be made more flexible?

0.24.0 validated by the reviewer (354 tests, 0 fail): `turn`, `route`, `schemaGrid`, `complete`, `core.use as=`, ledger tools. Accepted.

The owner saw the path of a message as six fixed steps (kind of turn → world → act → things → what is missing → apply and reply) and asked whether that path is not itself a world. Answer in questions.md first (design, with your recommendation), then build the smallest version:
1. **The pipeline as data.** Declare the stages of `turn` in SOP Lang: each stage with what it needs, what it yields, which modules may offer it, and what happens when it yields nothing (ask, fall back, go back to an earlier stage). The order and the fallbacks become rules, not code. An application changes the path by telling facts: add a stage (a permission check, a translation, a confirmation before a destructive act), remove one, give one stage two competing providers ranked by tier.
2. **What flexibility is worth having** (say which you believe): skipping stages already answered (the message names the world); going back (filling fails → reread with the next candidate); several candidates carried in parallel and judged at the end by refusal and cost; a stage that asks the user; per-world differences (a rule world skips "which things").
3. **What must stay fixed**: one undo step per request, all-or-nothing, the step budget, determinism (same input and state → same path), and a trace that names every stage taken; `why` should explain the path as it explains a value.
4. **Cost and risk**: steps per turn against the coded `turn`; how an author is told that a declared pipeline has a hole (a need nobody offers) at load, as advice.
5. **Example**: the default pipeline as a module (`std.turn` stages), and two variants obtained only by telling facts: one with a confirmation stage before `remove` of many things, one with a second reader competing at the reading stage. Tests: the same 30 requests through the coded and the declared default give the same diffs.
If your recommendation is "not yet" or "only stages 1 and 2 as data", say so with reasons; the owner wants to know what is real.

## Reviewer 2026-11-14 00:40 — STANDING DIRECTION; 0.25.0 and 0.26.0 validated at 4c33e81; Q31 accepted

**Owner, 2026-11-13 22:54 (standing direction for all three repositories):** the goal is to accumulate experience in how worlds are made, to improve sopworld, to generalise, to accumulate cases, and to learn how to combine worlds so that coverage grows. Everything else is secondary. Small regressions are acceptable when generality and learning are gained.

**Validated:** npm test 358 / 357 pass / 0 fail. Read: Q31 (accepted exactly as recommended: order, providers, fallbacks, skip, ask, per-action stages as data; insides of stages stay functions; parallel candidates not yet). Accepted: quickstart, modules, patterns, host contract, README capability table, the second application (recipes) from the docs, `std.turn` / `turnFlow`, hand-over comparison (Q30).

**What this means here:**
1. **The library learns from the applications.** Keep `docs/lessons.md`: what each round taught about how worlds are made and combined (from your own work, from PSys2's `docs/lessons.md` and its ledger, from the second application). Each lesson ends with what the library did or will do about it.
2. **A case corpus in the library**: language-free cases (wires in, expected diff / refusal / route out) taken from PSys2's ledger and pilots through its hand-over, grouped by pipeline stage; every release runs it and reports per stage. It only grows.
3. **More applications, small ones:** after recipes, write two more from the docs alone, chosen to stress combination (for instance a room planner that uses space + knowledge + views, and a classroom timetable that uses scheduling + people + time). Each lists the doc gaps and the missing mechanisms.
4. **Combination first:** prioritise mechanisms that make two worlds cooperate without code (views, fill, lookup, send, composition, `as=` instances) over features inside one module. Report per release how many example pairs cooperate.
5. Continue the take-over of PSys2's hand-over packages (acts, space, things, dialogue, route, turn pipeline, ledger); small API breaks are acceptable when they make the library more general, with the migration note in CHANGELOG.

## Reviewer 2026-11-14 01:00 — 0.27.0 validated at 37a2dee (359 tests); Round 26: what PSys2 still needs to drop its bridge, and std.grammar

Lessons page and the case corpus: good (the corpus found 7 failures your tests did not: keep feeding it). Accepted.

**A. PSys2's Q11 (what keeps its executor a bridge), in its words:**
1. Replies from the diff in the host's words: `act(req, { say })` with a template per act and kind, or `explain(diff)` over the changed wires keeping the user's words.
2. Referents by words: a `resolve(phrase) -> ids + tier` over synonyms, ordinals, slips, coordination, focus (the language part comes from B; the resolution over things is yours).
3. Domain effects: `std.acts.effect(kind, act, fn)` returning a diff, so `act()` drives worlds whose state is not wires (a drawing board, a diagram engine, a face).
4. All bookkeeping under one key; reserved names documented.
5. Group rollback including effects.
Take these in that order (3 first: it unblocks the most).

**B. `std.grammar` (owner-agreed "English as a world", PSys2 Q10):** the grammar of a language lives as facts and rules in sop-knowledge-worlds (`w.lang.en`, being written); the library provides the language-free machinery that applies such a world to text: tokens and lemmas from a lexicon world, a parser driven by grammar facts (noun phrases with determiners, quantifiers and modifiers; coordination and ellipsis; anaphora candidates; argument frames of verbs mapped to act roles), producing act + roles with spans. No English in the library: tests use a toy grammar plus, as an integration test, the published `w.lang.en` when it exists. Design note in questions.md first (chart parser or rule-driven, cost bound, how ambiguity is returned), then the smallest version for noun phrases + coordination.

**C.** Keep going with the two small applications (room planner, timetable) and the hand-over take-over.

## Reviewer 2026-11-14 01:20 — 0.28.0 and 0.29.0 validated at d1f8121 (365 tests, 0 fail)

Accepted: domain effects with sentence rollback, reply templates, reserved names, Q32 design, `std.grammar` smallest version. PSys2 has published its English as facts (`handover/lang.en/` in github.com/ml-circuits-research/psys2: 10 shards, 176 argument frames, 79 grammar groups, and `std-grammar.md`, a proposal of 13 functions with reference implementations). Compare with your `std.grammar`, take what is general, refuse with reasons, and test against those facts as the integration test (the knowledge repo will publish them as `w.lang.en`). Then: `resolve(phrase) -> ids + tier` (Q11 item 2), the two small applications, the case corpus growing from PSys2's corpus (`training/eval/cases.jsonl` there, 5,081 cases).

## Reviewer 2026-11-14 02:00 — 0.30.0 validated (366 pass, 0 fail); three questions from the knowledge repository (its Q34)

Accepted: `std.grammar` reading PSys2's lang.en facts in place. The knowledge repository ran your reuse detector on its 22 schemas: every world has reuse 0 (joins by name only). Three of its candidates need the library (answer in questions.md, then build what you recommend):
1. **Slot groups**: several types share the same slots (name, about; size, x, y, w, h); a type cannot take in a group of slots today. Is `extends` enough (and documented for this), or is a slot group (a mixin) worth one construct?
2. **A rule over key names**: "never the exact number and the approximate one" (`x` and `x_about`) is written as the same `core.deny` in three worlds and as a convention in all; a rule that ranges over pairs of keys by a naming pattern, or a slot property (`approx_of=x`) that the library checks.
3. **Provenance and join keys**: `named=model` is declared in 14 worlds and `drawing=` (a join to `k.objects`) in 8, each as a plain atom; should `named` be a core key like `core.source`, and should a join be `kind=ref to=<type>` checked when the target world is loaded (and left open when it is not)?
Then continue: `resolve()`, the two small applications, the corpus from PSys2.

## Reviewer 2026-11-14 02:45 — two defects seen by the knowledge repository on 0.26.0 (check on 0.30.0)

1. `make` accepts a thing without a `required` attribute (it should refuse with the question to ask, or leave an open question, consistently with `core.slot required=true ask=`).
2. `undo` right after `remove` undoes the step before it instead of the remove.
Add both to the case corpus first (they are exactly what the corpus is for), fix, release.

## Reviewer 2026-11-14 03:10 — 0.31.0–0.35.0 validated (377 tests, 0 fail); next from PSys2's geo.map pilot

Accepted: `resolve`, room planner and timetable (the docs held: good), corpus 35, slot groups / excludes / joins by key, `std.know.fill`. Next, from what PSys2's geo.map move showed:
1. **Acts on the view itself**: a view has attributes of its own (zoom, centre, pan, which layer is shown) and requests about them have an implicit thing ("zoom in", "show the borders"); today two thirds of a map's language is this. Declare view attributes in `std.schema.view` and let `std.acts` change them with the view as the thing.
2. **Typed needs and views that carry their needs**: a world or view says what it needs loaded (wires of a type, from a world) before acting; the host loads them; `std.know.fill` and `turnFlow` respect it.
3. **`ask` over any attribute and any relation of a schema or a knowledge world** ("which countries border X", "how many people live in X"), with the answer shape generated (number with unit, list, yes / no).
4. The two defects of 02:45 (make without required, undo after remove): state their status in worker-log.
5. Keep growing the corpus from PSys2 (its `training/eval/cases.jsonl`, 7,496 cases now): take the language-free ones by stage.

## Reviewer 2026-11-14 03:30 — 0.36.0–0.38.0 validated (380 tests, 0 fail)

Accepted: `make` lists the required keys it leaves open (both 02:45 defects in the corpus), acts on the view itself (`std.schema.view state=`), `ask` over any attribute and relation of schemas and knowledge worlds with the answer's shape. Fast and on target. PSys2 is told to vendor 0.38 for its geo.map pilot. Next: typed needs and views carrying their needs (item 2 of 03:10), then `std-grammar.md` section 8 from PSys2's hand-over (one noun-phrase reading over the facts), then the corpus growth from PSys2. Keep the lessons page current.

## Reviewer 2026-11-14 04:40 — the library must not hold particular worlds (owner's question)

The owner looked at this repository and asked whether the library is building particular worlds that belong in sop-knowledge-worlds. Reviewer's check: `src/` holds no particular knowledge (good). But there are copies and look-alikes outside `src/`:
- `compat/psys2/` (1.2 MB, last changed 11-10): copies of PSys2's kids.* worlds, matrices, lang.common, core;
- `bench/fixtures/knowledge/`: copies of sop-knowledge-worlds shards (k.objects, k.animals, k.food, k.space, k.time, ...);
- `cases/schemas/`: face, seating, timeline, map written again "after PSys2's worlds", while `w.seating`, `w.timeline`, `w.list` are published in sop-knowledge-worlds in your own `std.schema` format;
- `examples/` and `examples/second-app/`: toy applications (recipes, rooms, timetable, warehouse, twin, workflow).
**Rule from now on:** the library holds mechanisms, tests and minimal toy examples only. Particular worlds and knowledge live in sop-knowledge-worlds (or in an application); the library may *read* them for integration tests and benchmarks, never keep its own versions.
1. **Integration tests read the published worlds, pinned:** a test helper that fetches (or reads from a pinned checkout in `node_modules` / a git submodule-like folder fetched at test time from GitHub, which this box reaches) sop-knowledge-worlds at a pinned commit; `cases/schemas/seating|timeline` are replaced by `w.seating`, `w.timeline` from there; a face and a map schema, if they are reusable, are proposed to that repository instead of kept here (write the proposal; the reviewer forwards it).
2. **`bench/fixtures/knowledge/`**: read the same pinned checkout instead of copies; delete the copies.
3. **`compat/psys2/`**: PSys2 now vendors the library and runs its own world tests; delete the copies unless a test truly needs them, and then say which and why (and read from PSys2 at a pinned commit instead).
4. **Examples stay toys**: each example world under ~60 lines, clearly invented, named as an example; any example that grows into something reusable goes to sop-knowledge-worlds as a `w.*` schema.
5. **The case corpus stays language-free and minimal**: a case carries only the wires it needs; when it needs a real world, it names the published world and commit, not a copy.
Report wires and bytes removed, and what now comes from where. AGENTS.md gets the rule.

## Reviewer 2026-11-14 06:00 — 0.41.0 validated (381 pass, 0 fail); NAMES for the kinds of worlds in the library docs (owner)

Accepted: no particular worlds in the library, published worlds read at a pinned commit (about 10,500 lines removed). `compat/` still holds 896 KB: say in worker-log what remains and why, or remove it.

**Names for the three kinds of worlds (owner asked; reviewer proposal, to be used in every repository and in the library docs):**
1. **world schema** — what a kind of world is: its kinds of things, attributes, value types, acts, limits, rules and the words for them; no particular things. Reusable; lives in sop-knowledge-worlds as `w.*` (seating plan, timeline, list, and the schemas of the demo tabs once general). In the library: `std.schema`.
2. **knowledge world** — facts about the world at large (animals, places, colours, English grammar), true for everyone, no session state; lives in sop-knowledge-worlds as `k.*` (and `w.lang.en` is a knowledge world about a language).
3. **live world** — one running instance of a world schema in a session: the things the user made, their current values, the focus, the history and undo, temporary and particular; it reads knowledge worlds and follows its schema. A tab shows a live world through a **view**.
Plus **library modules** (`std.*`: acts, fill, focus, relations, turn, know, grammar): mechanisms, not worlds.
In Romanian (for the owner): schema lumii, lume de cunoaștere, lume vie.

Task: adopt these names in `docs/glossary.md` (definitions with a short example each and how they relate: a live world = schema + knowledge + session state), in `docs/capabilities.md`, `docs/quickstart.md`, `docs/host-contract.md`, README and the module docs; the API keeps its names but the docs say which kind each function works on. If you think another term is clearer, propose it in questions.md with the reason before changing; one name per kind, no synonyms.

## Reviewer 2026-11-14 06:55 — answers to Q30–Q35 (move them to Closed); 0.42.0 noted

- **Q30 → yes to the order, with one check:** before adding `std.schema.kind … on.make=<action>`, say whether `std.schema.effect` (0.28) already covers a world's own effect for one act on one kind; if it does, document that and add nothing; if not, add `on.<act>` as proposed. Then space selection and layouts (rules + std.boxes), overlap enforcement, the turn log and `amend`, pieces and the solver (compare with your solvers first). `find` by aspect: not needed now.
- **Q31 → accepted** (already built as 0.26; close).
- **Q32 → accepted** (Earley over grammar facts, ambiguity returned ranked, budgeted; close).
- **Q33 → accepted.** The knowledge repo is asked to fix `w.lang.en`'s schema (`many=true` on `rhs` and `in`) and to add `priority` on rules where order matters; then load the schema in your integration test. Continue in the proposal's order (`inflect`, `fragment`, `agent`, clause functions, `refer` with `resolve`, `frames` / `read`).
- **Q34 → accepted** (repeatable `extends` as slot groups, `excludes=`, joins `type= by=`); the knowledge repo is asked to use them (one `k.named` group, `excludes` for every `_about` pair, `drawing=` as a join).
- **Q35 → forwarded** to the knowledge repo: `w.seating` acts (connect, group, place on table; copy, place on guest), a range for `w.timeline` `at` and the "inside its timeline" deny, a `w.face` world schema and a map view schema. Keep the inline versions until they are published, then switch and drop them.
0.42.0 (names of the three kinds of worlds in the docs): accepted on reading the commit; the reviewer runs the tests at the next release.

## Reviewer 2026-11-14 07:05 — Round 27, after the current round: reusable AGENT SKILLS for learning worlds (owner)

**Owner's idea:** coding agents are the learning layer ("system 1" in his words), sopworld worlds the deliberate run-time layer ("system 2"): the system runs on the worlds and periodically learns from use and consolidates. The skills that let any coding agent do that for any application built on sopworld live here, next to the tools they call, versioned with the API.
Write them under `skills/<name>/SKILL.md` (frontmatter `name` and a `description` of when to use it; the body as concise steps with checks; scripts under `skills/<name>/scripts/` when needed, using the library's tools), each tested by a dry run on real material: the knowledge repository and PSys2 (its ledger, case corpus, failures export v3):
1. **`learn-world-from-examples`**: from a description and example requests, write a world schema in `std.schema` format that reuses knowledge worlds and published `w.*` schemas (never a value list knowledge already has), with words, an example session and a catalog entry for sop-knowledge-worlds; measure with requests written without seeing the schema.
2. **`improve-world-from-failures`**: take failures (ledger / corpus format, with the user's expectation), group by cause and pipeline stage, decide where the fix belongs (knowledge world, world schema, language world, library mechanism, application), make the smallest general change (never a phrase-specific rule), gate it (corpus: no right-to-wrong; held-out set untouched; invariants), write the lesson.
3. **`learn-language-rules`**: from reading-stage failures, add facts to the language world (`w.lang.en` or a sibling) and verbs / synonyms to the knowledge worlds, check `std.grammar` reads them.
4. **`consolidate`**: the periodic cycle: ingest new failures, freeze held-out rows, run 2 and 3, rerun the measures and the learning curve, open the changes for review in each repository with the before / after table; stop when the held-out curve does not rise.
5. **`audit-knowledge`**: sample model-labelled facts, check against sources, fix or flag.
Each skill says what it may change and what it must never do (no restricted data, no phrase lists, no editing tests to pass). Sources for the steps: `docs/lessons.md` of the three repositories (the skills are the lessons made executable) and the reviewer's rules in the three `worker-tasks.md`. The reviewer reads every skill and runs one dry run of each before acceptance.

## Reviewer 2026-11-14 07:15 — owner: there will be several knowledge repositories; the library stays one

The owner confirms the skills belong here because the library is unique and reusable while there will be **more knowledge repositories** in the future. Consequences:
1. Skills (Round 27) take the target repositories as parameters (one or several knowledge repositories, one application); nothing in a skill names sop-knowledge-worlds or PSys2 except in its dry-run examples.
2. **Several catalogs at once**: `createCatalog` (and `std.know.fill`, typed needs, the word index) must load from several catalogs with an order of precedence, report when two catalogs define the same thing differently, and keep each fact's catalog in its source; a test with two small catalogs that overlap.
3. The pinned published worlds (`worlds.pin`) become a list of repositories with their commits.

## Reviewer 2026-11-14 07:25 — documentation (owner): what each kind of world may contain, where code lives, and everything the library and its skills can do

**A. A page `docs/kinds-of-worlds.md`** (linked from README, glossary, capabilities, quickstart, host contract), in detail and with a small runnable example for each point:
1. **World schema**: what it may contain: kinds of things, attributes with types, ranges, defaults and questions, count limits, slot groups, `excludes`, joins, which acts apply to which kind, rules and denies, words; how it **names** the functions it uses: pure functions of the standard pack (which ones exist), and effects the application provides (`std.schema.effect`, and `on.<act>` if added): declared in the schema, implemented outside it. It holds no particular things and no code.
2. **Knowledge world**: facts, constraints (slots, `excludes`, joins), rules (derivations such as habitat → usual place, carried things go with their carrier, "is a kind of" chains), provenance (`core.source`, model-labelled facts); no session state, no code; what to do when a rule needs a computation (ask the library for a function; never embed code).
3. **Live world**: an instance of a schema in a session: state, focus, history and undo, the view that shows it; it inherits constraints and rules from its schema and reads knowledge worlds by lookup; the application's tools (renderers, engines, editors) are attached to it through effects; how the library keeps state and view consistent (state difference after each act; rendered = state).
4. **Library modules** (`std.*`): mechanisms, not worlds; which module serves which kind of world.
5. **Where code lives, as a rule:** world schemas and knowledge worlds stay SOP Lang only so any application can reuse them; a general function goes into the standard pack; a specific tool stays in the application, connected through a declared effect. With three examples of a need and where it ends up.
6. A diagram (text or SVG) of how the three combine at run time: schema + knowledge + session state = live world; a request goes through `turn`.

**B. Skills documentation (Round 27):** `skills/README.md`: what each skill is for, when to use it, its inputs (repositories, failure batches), what it changes and what it must never do, its outputs (changes per repository, the before / after table, lessons), how to run a dry run, and how the skills form the consolidation cycle; each `SKILL.md` self-contained. Link it from README and capabilities.

**C. Keep `docs/capabilities.md` complete:** every module and tool the library has, with a runnable example, its version and its limits, including the newest (grammar, resolve, know.fill, needs, view acts, ask over relations, several catalogs, turnFlow, ledger, corpus, reuse, bundle); a test fails when an exported function has no entry in capabilities or the reference.
Order: A and C now (they document what exists), B with Round 27.

## Reviewer 2026-11-14 07:40 — Round 28: the lessons PSys2 forwards to the library (read them in place)

PSys2 forwarded every line of its `docs/lessons.md` marked **[LIB]** in its `questions.md`, section "Q12 (worker, 2026-11-14 04:30) — lessons to forward", plus item 4 of the section "w.lang.en vs the hand-over" (github.com/ml-circuits-research/psys2, main). Read them, answer per line in questions.md (take / already have it / refuse with reason), and build in this order (reviewer's priority by how many worlds each unblocks):
1. **Arbitration contract**: a documented three-valued verdict (own / decline / refuse) with an optional `resolves(words)` hook, the decline rule shipped by the library, the "act verb claim" (a world with no use for a kind declines the verb), and a test that no schema world takes another world's sentence; the arbiter knows which pass it is in.
2. **One segmenter that knows the act forms** (clause cuts, commas after a rule frame, "add X and connect A to it"), so hosts need no encoder for clause cuts (the ablation showed this is what the encoder bought).
3. **`std.dialogue`**: turn kinds (why, correction, ellipsis, continuation, list) and the focus log; hosts only name cue phrases; a modal world declares that the dialogue sees a turn first; a dry-run fork copies every context hook (tested once).
4. **Undo contract per request with an optional whole-message tag.**
5. **`std.knowledge`**: index a shard once and memoise lookups within a turn; "bundled subset then catalog" with `reachable()` and a synchronous first read; `listOf(type, slot, value)`; a world-level `bundle=`; the two reader bugs every host would hit (a word form only as `core.word`; a schema shard id that is its own path).
6. **`std.grammar` / `resolve`**: read QALL and other quantifier categories as categories, coordination as a list, "the other" from focus (PSys2 item 4: 14 of 6,972 results differ when the catalog grammar is read whole); the constructions `relpron`, `partitive`, `other`, `choice`, the negation lead as chart rules, with "asked instead of guessed" as a result kind.
7. Form compiler checks (optional slot before a required one, lemmatised lexicon words, `words(n)` limits); a frame naming the world's own words beats generic act forms by rule, not by numbers.
8. `std.space` single placement; a relation kind (spatial, containment, flow) declarable in a schema.
9. Library tools: the experiment harness (cells with expectations → ledger rows) and the ablation harness.
Rounds 24–27 items still open stay in their order after 1–3.

## Reviewer 2026-11-14 08:30 — 0.43.0 and 0.44.0 validated (388 tests, 0 fail)

Accepted: several catalogs at once (`createCatalogs` with precedence, sources, conflicts; `repos.pin`), `docs/kinds-of-worlds.md` (world schema, knowledge world, live world, library modules, where code lives), capabilities complete (25 jobs) with the export coverage test. Next: Round 28 in its order (arbitration contract first), then Round 27 (skills, with `skills/README.md`).

## Reviewer 2026-11-14 08:45 — from the knowledge repository (its Q42): the tier of a derived value must survive a merge

The knowledge repository now ships the facts its rules derive in generated shards (`derived=true`, `core.source="rule <id>"`) so tools and hosts see them. When a host merges a derived wire with a told wire of the same identity, the mark ends up on the whole wire. Keep the origin per value (told / derived / default / knowledge tier, as `std.fill` and the act diff already do) through loading and merging, with `why` naming the rule; a test with one told and one derived value on the same identity. Add it to Round 28 after item 5 (`std.knowledge`).

## Reviewer 2026-11-14 09:10 — Round 29 (after Round 28 items 1–3): `std.plan`, orchestration from knowledge (owner)

**Owner (05:59): complex and planned actions should come from knowledge and orchestration, not from rules inside live worlds.** Today composite behaviours are code in live worlds: art.draw `engine.mjs` (2,272 lines) composes scenes, takes things apart and builds groups; "a chart / a document about the discussion", "draw a person on the swing" (make swing, make person, place on its seat anchor), "arrange them like a family photo" are each a hand path. Knowledge already holds pieces: `k.scenes` (what a scene has, where), `k.layouts` (arrangements, anchors, joins), `k.actions` (verbs, result, opposite, undone by), `k.parts`. Missing: **how to reach a goal**: procedures as knowledge, and a planner that applies them over the acts.
**`std.plan`**: a planner over `std.acts` that takes a goal (an act or a named task) and **methods from a knowledge world** (`k.procedures`, format agreed with the knowledge repository through questions.md), decomposes it into acts (hierarchical, method by method), checks preconditions against the live world, fills roles through `std.fill` and `std.know.fill` (anchors, layouts, the things of a scene), applies the plan as one `act([...])` (one undo step, all or nothing), and explains it: `why` names the method and each step; a step that cannot be done yields a refusal with the method's alternative or one question. Language-free, budgeted, deterministic. Example and tests: "a person sitting on a swing" in a toy picture schema, "set a table for four" in a seating schema, "a chart of the things in the picture" across two views. Design note in questions.md first (decomposition depth, choice among alternatives by preconditions then tier, cost bound).

## Reviewer 2026-11-14 09:25 — `std.grammar` language-neutral for reading and generation (owner's translation-by-grammar experiment); after Round 28 items 1–3

The owner wants to try translation by grammar worlds: Romanian (`w.lang.ro`, being written in the knowledge repository) read directly into act + roles, and replies generated in Romanian from the act, roles and state difference. Make `std.grammar` serve any language world:
1. **Reading:** morphology from the language world (inflection classes, enclitic articles, cases, agreement) through `inflect` / lemma lookup, accepted spellings without diacritics, word order and clitics as grammar facts; the same output structure for every language.
2. **Generation (realisation):** from an act, its roles and the diff (and from `ask` answers and refusals) to a sentence in a given language world: choosing forms by agreement (gender, number, case), articles, word order; a template per act and answer shape in the language world, filled and inflected by the library. English replies move to the same mechanism.
3. Tests with a toy second language plus integration tests on `w.lang.en` and `w.lang.ro` when published.
4. The `learn-language-rules` skill (Round 27) must work on any language world.

## Reviewer 2026-11-14 09:35 — language worlds vs domain worlds

**Clarification (owner, 06:09): which worlds may hold Romanian.** The rule "no Romanian in SOP Lang or in worlds" stays for every domain world: knowledge worlds about things (k.*), world schemas (w.*), live worlds, the library. Their identifiers, keys, comments and words stay English, and they do not grow when a language is added. The only exception is a **language world**: `w.lang.ro` is a knowledge world *about* the Romanian language, so Romanian words appear in it as data, exactly as English words appear in `w.lang.en` (its keys, comments and structure stay English). It joins to the domain worlds only through sense ids and the shared frame vocabulary (a Romanian lemma → a k.words sense / a k.actions verb sense), never by adding Romanian words to them. Size: `w.lang.ro` is loaded only when the selected language is Romanian (lazy loading, by the word index); inflection is stored as rules and classes plus the lemmas the app needs, not as a list of every form; its shards are split so a session loads only what its words need. Report its size and what a Romanian session loads.

## Reviewer 2026-11-14 09:45 — language worlds: compact rules + external dictionaries

**Owner (06:11): a language world is compact rules plus external dictionaries, not a huge listing of words.** Design for `w.lang.ro` (and later for `w.lang.en` / `k.words` where it pays off):
1. **SOP Lang wires hold only what is general or exceptional:** inflection paradigms as classes and rules (endings, the enclitic article, case and agreement rules), syntax facts, frames, closed classes (pronouns, prepositions, determiners, numerals), and the irregular forms that no paradigm covers.
2. **An external dictionary** holds the open lexicon compactly: one row per lemma with its paradigm class (and gender, stress or alternation codes where the paradigm needs them) and its sense link (a k.words sense id or a k.actions verb sense), in a documented compact format (a sorted table split by prefix, loaded by the word index; or a compact binary/trie form generated from it), with its source and licence. No form lists: forms are generated by the paradigm rules when needed.
3. **The library reads it:** `std.grammar` gets a dictionary adapter (lookup lemma → paradigm, generate and analyse forms by the language world's rules), the same for every language; the format is part of the library docs.
4. Measure: wires in the language world, dictionary size, what a session loads, and coverage (share of words in the Romanian sets analysed correctly) before adding any hand list.

## Reviewer 2026-11-14 09:55 — the knowledge repository published `w.face`, `w.map`, `w.seating` 2, `w.timeline` 2 (commit 2b5505e)

1. Pin that commit and **drop the inline face and map cases' copies**: the knowledge worker checked on your 0.45 that the corpus passes and the 17 inline cases pass when they name `w.face` and `w.map`.
2. Two questions from it: **joins by a composite key** (a k.faces variant is identified by slot + name; a map place by kind + name) — extend `type= by=` to several keys; and **what `copy` keeps**: a copied guest keeps its seat, so "two guests are not on one seat" cannot be a deny; decide (copy leaves references to containers unset, or a `copy` mode per slot) and document.

## Reviewer 2026-11-14 10:20 — Round 30: a compact notation for language worlds (owner, 06:19); after Round 28 items 1–3, together with the `std.grammar` block of 09:25

**Owner (06:19):** translation/language worlds need special support from the library so they are written elegantly and compactly. Today the library has no morphology mechanism (no paradigm, inflection or agreement code in `src/`), so a language world would have to spell out forms as wires. Give language worlds a small set of general primitives, the same for every language, documented in `docs/` with a toy language:
1. **Paradigm classes as rules** (`std.morph`): one declaration per class = a stem rule (alternations such as a→ă, t→ț, stem-final deletion) plus a table of endings per feature cell (number, case, definiteness, person, tense). Inheritance between classes (a class = parent + overrides) so the near-duplicates collapse. The same declaration is run in **both directions**: `generate(lemma, class, features)` and `analyse(form) → [{lemma, class, features}]` (suffix trie built at load, no stored form lists). Irregulars are an override table, consulted first.
2. **Features and agreement through `unify`** (already in `src/unify.mjs`): a feature bundle per word, agreement as constraints in a grammar rule (noun–adjective gender/number/case, subject–verb person/number), not as one rule per combination.
3. **Clitics and enclitics as segmentation rules** of the language world (enclitic article, clitic pronouns, hyphenated forms), applied by `segment` before analysis.
4. **Spelling variants as a rule** (diacritics folding: ă/â→a, î→i, ș→s, ț→t; old ş/ţ cedilla forms) with a ranking toward the diacritic form, not as listed alternatives.
5. **Dictionary adapter** (09:45 item 3): the compact external lexicon (lemma, class code, gender/alternation codes, sense id), prefix-split, lazy; the adapter feeds `analyse`/`generate`.
6. **Realisation templates per act and answer shape** in the language world (09:25 item 2): slots filled from roles, forms chosen by agreement, word order a property of the language world.
7. **Acceptance, measured:** round trip `analyse(generate(x))` contains x for every class and cell; the toy language plus the first `w.lang.ro` draft from the knowledge repository; report wires per language world before and after the notation, dictionary bytes, and the share of words in the Romanian sets analysed correctly. Nothing Romanian in the library itself: the notation and the toy language only.
8. Coordinate the notation with the knowledge repository's `w.lang.ro` worker through questions.md ([KNOW] tag); the reviewer forwards.

## Reviewer 2026-11-14 10:50 — `std.motion`: states over time from rules (owner, 06:32: the avatar animates by rules); small, before Round 29

A general scheduler for anything that changes over time by rules (the avatar's face first; later a drawing that moves, a diagram that highlights steps, the Motion of a timeline):
1. **Rules as data:** `on <event> [when <condition on the event's fields>] → a sequence of steps`; a step sets keys of a state (a slot to a variant, a number) for a duration given as a range; `repeat every <range>` for idle behaviour (blinking); priorities so a talking mouth overrides an expression mouth but blinking still happens; `ease back to base after <duration>`.
2. **Driven by a token stream:** a step can be `per unit of <stream>` (a reply's text split into units by a language world's rule, each unit mapped to a state by a class table): the generic form of lip sync.
3. **Pure and seeded:** `plan(rules, events, seed) → [{t, key, value}]` for tests; `run(plan, apply, clock)` for the host; cancel on a new event. No DOM, no timers inside the plan.
4. Docs with a toy example (a traffic light, a blinking dot) and the avatar as the second app; tests for priorities, cancel, seed determinism.

## Reviewer 2026-11-14 11:05 — acceptance 0.47–0.51 and Q44 forwarded

1. **Accepted 0.47–0.51** (reviewer ran `npm test` on 0.50: 398/399 pass, 0 fail; on 0.51: 401/402 pass, 0 fail). Published w.face/w.map/w.seating 2/w.timeline 2 pinned and composite-key joins: thank you.
2. **[KNOW] Q44 from the knowledge repository:** `k.procedures` proposes the method format for `std.plan` (seven types: method, goal, binding, match, step, arg, condition; facts only, no notation; see its questions.md Q44). Answer it when Round 29 starts: accept or amend, in your questions.md; the reviewer forwards. Correction to `std.motion` item 2 (owner): the text → mouth class table is the animation world's, not a language world's; the stream's unit splitter is a parameter of the rule.

## Reviewer 2026-11-14 11:20 — 0.52 `std.morph` accepted; Q37 answers

1. **Accepted 0.52** (reviewer ran `npm test`: 405/406 pass, 0 fail). Fast and to the point.
2. **Q37.1:** no inflectional prefixes are needed for Romanian (ne-, re- are derivation; leave them out). But **one alternation per cell is not enough**: Romanian stems often change in two places at once (carte → cărți: a→ă and t→ț; masă → mese; fată → fete; poartă → porți), and the alternation applies to the last stem vowel, not to the end of the stem. Allow an ordered list of alternations per cell, each optionally anchored to the last vowel or to the stem end (`alt=a>ă@vowel alt=t>ț@end`). Fully irregular verbs (a fi, a avea, a lua, a vrea) stay `m.irregular`.
3. **Q37.2:** forwarded to the knowledge repository's w.lang.ro worker, which chooses; the reviewer's suggestion: `num` sg/pl, `case` nomacc/gendat/voc, `def` yes/no, `gender` m/f/n (n = m in sg, f in pl as a rule of agreement, not a third ending set), `person` 1/2/3, `tense` pres/impf/perf/pqp/subj/imper/inf/ger/part.

## Reviewer 2026-11-14 11:35 — [KNOW] `k.procedures` published (23 methods as facts); Q44 a–d for Round 29

The knowledge repository published `k.procedures` (commit 1d4f120): 23 methods in the Q44 format plus `binding.together`, `match.not`, history = acts before the plan; a reference reader `tools/lib/plan.mjs` used only by its tests (expansion depth 3, a method never inside its own expansion, at most 200 acts; alternatives by goal fit, world, preconditions, rank, name). Coverage measured there: 61/61 scenes, 60/60 roles, 105/105 wearables, 30/30 feelings, 17/17 layouts, 50/50 wholes, 1,643/1,643 take-apart. `std.plan` (Round 29) reads this; use its expected act lists as your integration tests. Its questions: (a) where the map from k.actions roles to std.acts arguments lives (number → amount, place → at/rel/ref); (b) the keys of history and of an ask step's answer; (c) lookup order of `of` (anchor, wearable place, drawing part); (d) is matching up the kind chain `std.know`'s job. Answer in your questions.md; the reviewer's view: (a) in the library, as data beside std.acts (one table, not per host); (d) yes, std.know.

## Reviewer 2026-11-14 11:50 — 0.53 and 0.54 accepted

Reviewer ran `npm test` on 0.54: 410 pass, 0 fail, exit 0. Ordered anchored alternations (Q37.1) and `std.motion` accepted. PSys2 is asked to replace its temporary scheduler with `std.motion`; the knowledge repository's `k.motion` is being written in your format.

## Reviewer 2026-11-14 12:05 — Q38 (std.plan design) approved; build it

Approved as written, including (a)–(d). Two additions: (1) the plan's explanation must be renderable as one short line per step (the Talk summary and "why" show it); (2) when `std.plan` is released, say so in your worker-log so the knowledge repository can delete its test-only reference reader `tools/lib/plan.mjs` and run its expected act lists through the library instead (one planner, no copy).

## Reviewer 2026-11-14 12:25 — 0.55 `std.plan` accepted

Reviewer ran `npm test` on 0.55: 415/416 pass, 0 fail. Accepted. PSys2 is asked to vendor it for multi-step requests; the knowledge repository to delete its reference reader. Next: Round 28 (arbitration first), the rest of Round 30 (generation templates with agreement on the first w.lang.ro draft when it comes).

## Reviewer 2026-11-14 12:45 — [KNOW] `k.motion` published (43cb081) in a richer format than 0.54 `mo.*`: one format, read by the library (Q46 there)

The knowledge repository wrote `k.motion` before it saw 0.54 (20 KB of facts, 10 tests, and a test-only oracle `tools/lib/motion.mjs`). Its format (its questions.md Q46) has what the face needs and `mo.*` lacks: **layers** with priorities over keys (a key shows the highest running layer), `during`/`not_during` (blink while talking), `until` (events that cancel), `emits` (an event when done: `spoken`), conditions on a **feature of the shown value** (no blink when the eyes are already closed), onset/hold/back ranges, `hold_until=<event>`, `via` for hosts that only switch, a splitter and letter classes as facts.
Do: extend `std.motion` to read that format as published (type names renamable as in `morphOf`; keep `mo.*` as the minimal form or map it), use k.motion's tests and its strip as integration cases, and answer Q46: the reviewer's view is (a) the splitter as data (facts), with a named host function allowed as an override; (b) `via` is returned in the plan for switching hosts, blending hosts ignore it; (c) base = the host's current state; (d) a cancelled step eases back from where it is; (e) repeat timers from the end of the last run. When released, say so: the knowledge repository deletes its oracle and PSys2 drops its temporary rules (one scheduler, no copies).

## Reviewer 2026-11-14 13:15 — 0.56 accepted (Q39)

Reviewer ran `npm test` on 0.56: 417/418 pass, 0 fail. std.motion reading k.motion as published, checked against the oracle on 12 plans: accepted. PSys2 is told to vendor it; the knowledge repository to delete its oracle. Next: Round 28 (arbitration first), then the rest of Round 30 when the w.lang.ro draft comes.

## Reviewer 2026-11-14 13:55 — 0.57 accepted

Reviewer ran `npm test` on 0.57: 418/419 pass, 0 fail. Accepted (relative clauses, negation leads, bare names, failure classes, pronoun focus). PSys2's plans from knowledge run on 0.55: 19 → 51 of 60 multi-step requests, no regressions.

## Reviewer 2026-11-14 14:15 — `std.sample`: random but relevant commands from knowledge and constraints (owner, 09:42); next after Round 28 item 1

The owner wants randomness as a general world: no hard-coded example lists anywhere; small commands generated at random, constrained by what the worlds allow. A library mechanism, the same for any host and language:
1. **`sample(context, { seed, n, prefer })` → frames** (act + roles, language-free): choose a compatible world (the open view's schema, or one of the recently used ones), an act legal on that schema **in the current state** (preconditions hold: remove/move only existing things, undo only when there is something to undo), objects and attributes from the knowledge the schema joins (drawable kinds from k.objects, colours legal for the attribute from k.values, places from k.geo for a map, guests and seats for seating), values legal for the slot (types, ranges, `excludes`, denies).
2. **Weights as data:** recency (things and worlds seen recently in the session), novelty (acts, kinds and attributes rarely used so far boosted: "less usual things from the worlds"), plain randomness; seeded and reproducible.
3. **Realisation:** each frame is rendered in the session's language world by `std.grammar` generation (templates per act, Round 30 item 6). **Round-trip filter:** a sample is kept only if reading the sentence back gives the same frame and a dry run of the act is not refused. So every suggestion is understood and works.
4. Modes: `one` (a dice), `few` (3–4 examples for a context), `actions` (the acts relevant to a selected or recent thing, for buttons).
5. Tests and docs with the toy apps; report the round-trip rate and diversity (distinct acts, kinds, attributes per 100 samples).

## Reviewer 2026-11-14 14:45 — two new mechanisms (owner, 09:53): `std.summarize` and `std.compose`; order: std.sample (14:15), then these two

No LLM (owner: not for this demo); everything from frames, knowledge and the language worlds, measured.
**A. `std.summarize` — summarise any text or log.**
1. *Logs of acts* (a session's turns, a world's history): aggregate by act, world and kind, generalise up the kind chain of k.kinds when several siblings occur (cat, dog, horse → three animals), keep counts, numbers and what was taught or failed, order by salience (how much state changed, recency, repetition); output frames, rendered by the language world (`std.grammar` generation). Length is a parameter (one line / a paragraph / bullets).
2. *Any text*: segment (std.segment), read each sentence into frames where the grammar can (`resolve`), score sentences by centrality (shared referents and content words across sentences), position and information (numbers, names), drop redundancy (same frame twice), and produce either the top sentences (extractive) or regenerated sentences from the kept frames (abstractive by frames). Report on a small set of texts with reference summaries (choose a permissive set, licence checked) using an overlap measure, plus "every output sentence reads back" and "no fact not in the source".
**B. `std.compose` — write an essay/composition that combines worlds in an interesting way.**
1. Input: a topic (or none: random via std.sample), a size (chapters, subchapters per chapter, words or sentences per section), a language world, a seed.
2. *Outline from knowledge*: chapters from the topic's relations across worlds (its kinds, parts, places, times, uses, numbers, the worlds it links to), chosen by an **interest** score read from the knowledge world `k.interest` (the knowledge repository writes it: novelty, contrast, surprising links between distant worlds, concrete numbers, questions, comparisons…).
3. *Content selection and order*: facts from the catalog per section, each true by the knowledge (cited as the wires they come from); transitions and coherence by focus (std.dialogue's focus log: pronouns, "the other"), no fact twice.
4. *Realisation*: rhetorical moves (introduce, compare, surprising fact, example, question, conclude) as templates of the language world; sizes respected exactly.
5. Checks as tests: every sentence reads back by the grammar, every claim traces to a wire, the requested shape holds, repetition below a bound, interest score reported per section. Docs with a toy catalog.

## Reviewer 2026-11-14 15:00 — AMENDS 14:45 B (owner, 10:02): `std.compose` = a genre's procedure, choices by interest, not free random

`std.compose(topic, { genre, size, language, seed })`: the genre comes from `k.genres` (structure, moves, register); the composition is a **plan** (`std.plan`) of the genre's procedure in `k.procedures` ("write a story", "write a presentation about X", …), whose choice points (a protagonist that can have the goal, an obstacle that blocks it, a setting where both exist; the chapters of a presentation) are resolved by `std.sample` restricted to the candidates the constraints allow and weighted by `k.interest`. Realisation uses the genre's register templates of the language world. Stories must satisfy `k.story` constraints (the obstacle blocks the goal, the resolution uses something set up earlier): checked as tests. Same checks as 14:45 B5, per genre.

## Reviewer 2026-11-14 15:05 — 0.58 accepted (Round 28 item 7)

Reviewer ran the three phases of `npm test` on 0.58: 419/420, 419, 418 pass, 0 fail in each. grammarCheck and priority-ranked parses accepted. Round 28 left: item 8 (`std.space`), item 9 (harnesses); then std.sample, std.summarize, std.compose (14:15, 14:45, 15:00).

## Reviewer 2026-11-14 15:15 — what the new worlds need from the library (owner, 10:05); provisional, revise when the worlds exist

Beyond `std.sample`, `std.summarize`, `std.compose` (14:15–15:00), the reviewer expects these general mechanisms to be needed. Build each only when a world actually uses it (an integration case from the knowledge repository), and say in questions.md which ones turned out unnecessary:
1. **Choice points solved jointly (std.plan + std.solve).** A procedure's choices are related (k.story: the obstacle blocks the goal, the helper has what is missing, the resolution uses something set up earlier). Greedy step-by-step choice dead-ends. Add a `choose` binding (candidates from knowledge, constraints between choices as conditions) solved as one finite-domain problem with the existing solver, then sampled among the solutions by weight (seeded). Explanations name the constraint that removed a candidate.
2. **Interest scoring as data (`std.rank` / a small `std.interest`).** Evaluate k.interest features generically over facts: graph distance between the worlds or kinds a fact links (an index over the catalog's joins), rarity of a kind (counts in the catalog), a number's distance from the typical range of its attribute (k.attributes numbers), contrast with a k.commonsense rule, repetition against what the text already said. Weights read from k.interest; every score explained by feature.
3. **Generation with register and sentence planning (std.grammar realisation).** Register parameters from k.genres (person, tense, voice where the language world has it, sentence length range); **aggregation** of several frames into one sentence (coordination, a relative clause, "both … and"), and splitting when too long: the reverse of reading.
4. **Referring expressions in generation.** From the focus log: name vs pronoun vs definite description vs a new indefinite, so a text does not repeat full names or lose its referents; the same mechanism the reader uses for pronouns, run the other way.
5. **Quantified and generalised noun phrases** for summaries ("three animals", "most of the guests", "a farm with a barn and two cows"): counts and the kind chain (std.know) to frames that std.morph can inflect (number agreement).
6. **A document as frames.** Chapters, sections, paragraphs, slides as a world schema (the knowledge repository is asked for `w.document`), so compose writes a live world any host renders (PSys2's editor, slides) and summarize can read a document back.
7. **Length control as a budget**: the requested words/sentences per section turned into a content budget before selection (not trimmed after), so sizes are exact.

## Reviewer 2026-11-14 15:30 — [KNOW] Q48: deferred join checks (small, before std.summarize)

The knowledge repository cannot declare `drawing=` joins (`type=k.objects.object by=name`): 0.52+ checks a `by=` join when the fact is told, and imports/lazy loading tell 400 animal and food facts before any object, so each is refused. Make a join **open while its target type has no fact with that key**, checked when such a target fact arrives, and reported (not refused) by `world.check()` / a load report when still open. Refusal stays for a target that is loaded and lacks the key. Test with a lazy load in both orders.

## Reviewer 2026-11-14 15:55 — 0.59 `std.sample` accepted

Reviewer ran `npm test` on 0.59 (timeout 1500 s): 421, 421, 420 pass, 0 fail, exit 0. Accepted. Next: Q48 (deferred joins), then `std.summarize` and `std.compose` (PSys2's host side is waiting for them: it declines plainly until they exist), Round 28 items 8–9 after.

## Reviewer 2026-11-14 16:10 — [KNOW] first `w.lang.ro` draft published (2e6ef36); Q51–Q53 from the knowledge repository (Round 30 continued)

`w.lang.ro` in your notation: 44 classes with inheritance, 341 cells, 213 irregulars, 14 folds, closed classes, 3 templates (936 wires, 14.3 kB gzipped) plus a 255-lemma TSV dictionary (14.8 kB). Round trip exact spelling 2,898/2,904; coverage on 240 PSys2 Romanian commands 99.5 % exact, 92.2 % typed without diacritics. Its questions, in order of value:
- **Q51:** `analyse` with folds misses every diacritic suffix (-ă, -ează, -ește): the suffix index is keyed by unfolded suffixes. Index folded suffixes too (or fold both sides). This blocks typing without diacritics (2,249/2,904 today).
- **Q52:** analysis always undoes an alternation even when the lemma already had the result (uriași, englezi, îngroși): generate-and-check should keep the reading that regenerates the form; undo anchored two-letter targets (`o>oa@vowel`) and deletions.
- **Q53:** feature names as chosen (accept or amend); how a template realises an article agreeing with its noun (`{thing:def=yes}` vs a separate slot); whether two irregular facts for one cell (este / e) is the intended way to give variants (reviewer: yes, with the first as the generation default).
Use w.lang.ro's tests as integration cases. Then the generation side (templates with agreement) for Romanian replies.

## Reviewer 2026-11-14 16:30 — 0.60, 0.61, 0.62 accepted; summarize follow-ups

Reviewer ran `npm test` on 0.62: 425, 425, 424 pass, 0 fail, exit 0. Accepted: deferred joins (Q48), `std.summarize` (logs and extractive text), `std.space` single placement (Round 28 item 8). Follow-ups for summarize, after std.compose's first version: (1) the abstractive-by-frames path (14:45 A2: regenerate sentences from kept frames), (2) a measured overlap on a permissive reference set: ask the reviewer if downloading is blocked, the reviewer can fetch a set with a checked licence; two hand texts (0.43, 0.47 unigram recall) are not a measurement. Next: `std.compose` (15:00 + the 15:15 list as the knowledge repository's worlds arrive), Q51–Q53, Round 28 item 9.

## Reviewer 2026-11-14 16:50 — 0.63 accepted (Q51–Q53)

Reviewer ran `npm test` on 0.63: 427, 427, 426 pass, 0 fail, exit 0. Folded suffixes and generate-and-check alternations accepted: w.lang.ro round trip 2,904/2,904 exact and without diacritics. Next: `std.compose`, Round 28 item 9, summarize follow-ups.

## Reviewer 2026-11-14 17:10 — do not wait for all the composition worlds; start `std.compose` now

The knowledge repository now works on them in parallel (four workers) and publishes each as soon as it passes: `k.interest` is out (5e39ba0); `w.document`, `k.genres`, `k.story`, composition procedures, register/act templates in w.lang.en and typical ranges follow one by one. Start now with what exists: the choice-point solving in std.plan (15:15 item 1), interest scoring over k.interest (item 2), length as a budget (item 7), against a toy genre and story in your own tests; switch to the published worlds as they arrive (read in place at the pinned commit). Meanwhile Round 28 item 9 and generation (Round 30 item 6) fill any gap.

## Reviewer 2026-11-14 17:30 — Q41 answered; std.sample content from the catalog

**Q41.1:** the knowledge repository published `k.interest` (5e39ba0) and is writing `w.document`, `k.genres`, `k.story`, composition procedures and register templates in parallel; use your proposed formats for the toy catalog and switch to theirs as each lands (they read your 15:15 block; differences go through questions.md). **Q41.2:** the reviewer will fetch a permissive reference set for summaries into the knowledge repository (sources/) and tell you the commit.
**std.sample follow-up (from PSys2's first use):** samples are generic ("Add a pin.", "Add a shape.", "Undo that."): 72 distinct of 207. Give `sample` a **catalog option**: fill kind and value roles from the knowledge the schema joins (k.objects kinds for a drawing, k.geo places for a map, k.values colours/sizes legal for an attribute) through the knowledge readers, weighted by novelty and k.interest when present; `undo` only when the host's history has a change. Report distinct texts / kinds / attributes per 200 samples on the toy apps.

**Q41.2 update (17:40):** the reviewer's sandbox cannot reach the data hosts either; PSys2's machine is asked to fetch 200 BillSum test items (public domain / CC0) into its `training/eval/billsum-test-200.jsonl`; read it in place from your psys2 checkout when it lands.

## Reviewer 2026-11-14 17:55 — datasets come through PSys2's machine

Your sandbox reaches only package registries and GitHub. When you need a dataset or examples, write it in questions.md tagged **[DATA]** (what, why, size, licence constraints); the reviewer asks PSys2's machine to fetch it into psys2 `data/external/<name>/` with a SOURCE.md and licence, and you read it in place from a psys2 checkout (/tmp/wt2 is the reviewer's; clone your own read-only copy if needed). Already requested: BillSum 200 (summaries), Wikidata typical numbers (CC0), arXiv metadata 2,000 (CC0), UniMorph Romanian (CC-BY-SA), English word frequencies, a permissive short-story set, ConceptNet English relations (CC-BY-SA). Import only what you use, keeping the source licence (share-alike data in its own shard with its licence).

## Reviewer 2026-11-14 18:20 — from PSys2's measurements: two general reading mechanisms, and Romanian reading

PSys2's learning curve is flat on unseen formulations (paraphrases with the meaning kept: 14 of 85). Its failures grouped by cause point to two library mechanisms (after std.compose's real-world wiring, before Round 28 item 9):
1. **A story then a question:** a word problem's question after its story is not routed ("I cannot talk about that here"; 10 rows) and the arithmetic focus is lost. `std.dialogue`: the story's referents and the arithmetic frame stay in focus, and a following question is read against them.
2. **Relations from knowledge in any word order** ("what sound makes a cow", "a cow makes which sound", compound and broken orders; 13 rows): `resolve`/grammar reading a relation question by the relation's arguments and the knowledge, not by one fixed order.
3. **Romanian reading (09:25 block item 1):** PSys2 measured w.lang.ro with std.morph alone: 12.2 % of 9,328 meaning rows kept. Morphology is there; a language-neutral reading over a language world's syntax/frames layer is not. When the knowledge repository adds Romanian frames to w.lang.ro, read Romanian into the same act frames as English through std.grammar.
Also: 0.64/0.65 std.compose first version noted; acceptance after the reviewer's run.

## Reviewer 2026-11-14 18:40 — 0.64/0.65 accepted (std.compose first version, interestOf on k.interest)

Reviewer ran `npm test` on 0.65: 429, 429, 428 pass, 0 fail, exit 0. Accepted. Switch compose to the published worlds as they land (w.document, k.genres, k.story, procedures, register templates). The sampler's English realisation shows the need for w.lang.en's act templates (being written): PSys2's samples include "What is the seats of table 1?", "Set the dog fill to outlined." — agreement and attribute-specific phrasing belong to the templates + generation, not to hosts.

## Reviewer 2026-11-14 19:00 — [DATA] BillSum 200 is in psys2 (Q41.2)

`training/eval/billsum-test-200.jsonl` + `billsum-test-200.SOURCE.md` in psys2 main (public domain / CC0). Measure `summarizeText` on it (ROUGE-1/2 or your unigram/bigram recall, with a lead-3 baseline for comparison) and report; no tuning on it beyond the first 100 (keep the second 100 as held-out).

## Reviewer 2026-11-14 19:20 — [KNOW] Q49: a join stays open per value, not per type (correction to 0.60)

0.60 keeps a `by=` join open only while no target fact of the type exists; lazy loading by words loads object shards in any order, so an animal told after the cat's shard and before the owl's is refused. Intended (Q48): open **until a target with that key value** is told; `world.check()` / the load report lists the still-open ones; refusal only for an explicit full check (or when the host declares the target type complete). Test: object shard A, then a fact naming an object in shard B, then shard B: no refusal, 0 open after B. Also: k.genres (366975e) and k.story (d98a837) are published; BillSum is in psys2.

## Reviewer 2026-11-14 20:05 — priority after waking: compose on the published worlds first, BillSum second

Thanks for the status. Order, please: (1) choice points solved jointly in std.plan + `std.compose` on the published `k.genres` (366975e) and `k.story` (d98a837), with k.interest, and w.document / composition procedures / register templates as they land: PSys2's five document types wait for this release and the owner wants to test them; (2) BillSum measurement (an hour is fine, after 1); (3) Q49 per-value join (small); (4) std.sample catalog option; (5) 18:20 reading mechanisms; then Round 28 item 9, Round 27. To avoid stopping between turns, keep a short self-check (your own scheduled reminder or a loop) while waiting for inputs.

## Reviewer 2026-11-14 20:45 — 0.66/0.67 accepted; the rest of the composition worlds are published

Reviewer ran `npm test` on 0.67: 431, 431, 430 pass, 0 fail, exit 0. Accepted: BillSum measured honestly (held-out half, equal 180-word budget: R-1 F1 0.393 = lead's 0.393, R-2 0.156 vs 0.171; the budget overshoot of one sentence is worth fixing: stop before the sentence that crosses it, or say so), `solveChoices`, compose on k.genres. **Published since your pin** (knowledge main): `w.document` (6414cd9), k.story checked against 40 tales + 40 TinyStories (ff0c58f), w.lang.en **act generation templates** (cb5d6dd: 34 templates for the 16 acts) and **discourse templates** (b22ef9b: 116 sentences, 43 moves, 5 registers), k.attributes **typical ranges** (4448b9e: 56 over 34 kinds); the five composition procedures in k.procedures are about to be pushed. Next release: pin them, stories through k.story + procedures, realisation through the register templates, compose writes a `w.document`; then sample's realisation through the act templates (fixes PSys2's "What is the seats of table 1?").

## Reviewer 2026-11-14 21:00 — ABSTRACTION ROUND (owner, 14:45): the system does not learn by abstraction; general mechanisms are missing. TOP PRIORITY after 0.68 (the composition pins)

Evidence (PSys2 Q14): four learning-curve points, ~39 mechanisms added, paraphrases with the meaning kept 14.1 → 16.5 %, the schema-alone world ~51 % flat, while per-case sets rose (plans 51 → 56/60). Fixes cover the cases they were made for; unseen formulations do not move. Diagnosis: reading is driven by surface forms (a frame per construction, a word list per world), knowledge is used after reading, not to read; and **the library's own abstraction mechanisms (`induce`: anti-unification; `abduce`) are not used on language or on the case corpus at all** (PSys2 uses them only in one kids world). Build, in this order, each measured by PSys2 on the same curve (paraphrases-rt, schema-alone, grid, held-out) before and after:
1. **Type-driven reading** (`resolve`/`std.grammar`): assemble an act frame from the content words by the *types* of the roles (k.actions roles, schema kinds, knowledge relations and their argument types), word order and function words only rank the candidates. "what sound does a cow make" = "a cow makes which sound" = "cow sound?" read by the relation `sound of animal`, not by one fixed order (this generalises the 18:20 item 2).
2. **Alternations as general rules, once**: passive, wh-fronting, questions vs commands, "I want you to / could you / please" wrappers, dative shift, ellipsis — applied to every canonical frame by the grammar, so a language world writes each frame once in canonical form and never its variants.
3. **Lexical generalisation at read time**: an unknown or rare word in a typed slot goes to its nearest sense in k.words (synonym, hypernym, derivation) of the slot's type, with a cost; paraphrases mostly replace words.
4. **Induction from cases**: run `induce` over the case corpus / ledger rows that share an act: anti-unify successful readings into general rules, lift fillers to their common kind (k.kinds), propose the rule, admit it only if the held-out curve does not drop. This is the general "learn" step the skills (Round 27) should call, instead of hand-written point rules.
5. **Transfer by analogy between worlds**: align world schemas by structure (items assigned to slots under constraints: seating ↔ timeline ↔ layout; a container with parts: drawing ↔ document ↔ diagram) so a default, rule, procedure or question form that exists in one world is offered to the aligned world (proposal + measurement, never silent).
6. The story-then-question focus (18:20 item 1).
Write a design note first (questions.md), with the measure each item must move.
Also from PSys2's asks (decisions): **one summariser** (`docr.summary` moves to std.summarize too); the composer's `world` = a composite of the session's worlds and the catalog (async route allowed); `compose` deterministic by seed and memoisable (hosts dry-run twice); `summarizeLog({ failed: 'separate' })`; a frame renderer in the language world (generation) used by summarize/compose/sample, no host verb tables; `std.schema.kind … needs=text` so `sample` does not draw a make it cannot fill.

**21:00 addendum (owner 14:49: where do these methods live and how are they used?)** Code of every mechanism in the library (std.*), language- and domain-free; what they read is knowledge (role and relation types, k.words senses, k.kinds, a language world's alternation forms, schema structure descriptions); **when they run is data**: add them as steps of the pipeline-as-data world (Round 25: read by types → alternations → lexical generalisation → abduction → ask back) so hosts do not order them in code; and **what induction/analogy learns is written back as knowledge facts** (proposed rule wires with provenance, admitted by the curve), never as code. Document this split in docs/kinds-of-worlds.md and capabilities.

**From the knowledge repository (21:20):** `w.lang.en` sets `priority` only where parses really tie (possessive "of", "two big ones", "one yellow"; 0a22936), but the grammar does not read `priority` on rules yet: read it when ranking parses (it belongs with ABSTRACTION ROUND item 2).

## Reviewer 2026-11-14 21:35 — COUSINS: every case is a class (owner, 14:58); part of the ABSTRACTION ROUND, item 0

Owner: a discovered case is never single; it has **siblings** (same structure, other fillers at the same level) and **cousins** (go up k levels of abstraction, then down k levels; the further up, the more distant the cousin). Build `cousins(case, { degree, dims, seed, n })`:
- **Up**: lift the case's frame one level at a time along each dimension: a filler to its kind and the kind's parent (k.kinds), a value to its aspect (k.values/k.attributes), an act to its act family (k.actions), a construction to its alternation family (grammar), a world to its structure kind (the knowledge repository's structural descriptions), a relation to its argument types.
- **Down**: instantiate the lifted frame again with other members at each level (knowledge readers + `std.sample`'s legality in a state + the language world's generation), giving concrete cases tagged with their degree (1 = siblings, 2 = first cousins, …) and the dimensions changed.
- **Keep only valid ones**: legal in a state of the world, read back to the same frame where the wording was generated, not identical to a known case.
Uses (write them into the docs and the learn skill): (1) a ledger failure is expanded into its cousins **before** a fix; a fix is judged on held-out cousins at degree 1–2, never on the case alone (this is the measure of generality per fix); (2) induction (`induce`) proposes the "up", cousins test the "down"; (3) PSys2's grid and the learning curve get a cousins set built from real cases; (4) analogy between worlds is the cousin step along the "world → structure kind" dimension. Report on the toy apps: cousins per degree, share valid, and a fix judged both ways.

## Reviewer 2026-11-14 21:55 — COUSINS as a skill and an automatic tester (owner, 15:03); Q54 approved with cousins as item 0

**Q54 approved** as written (1 readByTypes — 0.72 already out, 2 alternations as w.lang.en facts, 3 lexical `near`, 4 learnRules with induce), with **item 0 = cousins** first-class, because it is how every other item is measured.
Owner's refinements (15:03):
- The abstraction space is **a layered graph, not a binary tree**: a node has several parents on several dimensions (a cow is an animal, a farm animal, a thing with legs, a noun of k.words; a question is a construction with several alternations; seating is "items in slots" and "a plan"). Going up 2–3 layers and down again already covers many cases: enumerate **in breadth**, budgeted, stratified per degree and per dimension, deduplicated by frame.
- **Absurd cousins are filtered by the world schemas and knowledge**, not by hand: types and slot kinds, denies, `excludes`, typical ranges (k.attributes), k.commonsense rules, legality in a state; what passes is plausible by construction.
- **Automatic testing from one example**: give an example (a sentence + its expected act/outcome, or a ledger row); the tool generates its cousins of degree 1–3 with their **expected frames computed from the lifted frame** (the world is the oracle: execute in a fresh state, compare states), runs them through a host, and reports per degree × dimension where it breaks. The pattern of breaks names the missing generalisation ("passes when the kind changes, fails when the construction changes" = an alternation gap; "fails when the act family changes" = a frame gap).
- **Forced generalisation**: when cousins fail along dimension D, `learnRules` proposes a rule at the common ancestor on D; rerun the cousins; admit only if held-out cousins pass and the curve does not drop.
Deliver: (a) `cousins(case, { degree: 1..3, dims, budget, seed })` in the library with the graph read from knowledge (k.kinds multi-parent, k.actions act families, aspects, alternation families, structure kinds); (b) `tools/cousins-test.mjs` (example → generated cases with expected outcomes → host adapter → table per degree × dimension); (c) a **skill** `expand-and-test-case` in skills/ (Round 27) that does a→b and hands failures to `learnRules`; (d) docs. PSys2 writes the host adapter. Also [KNOW] Q57 (third worker): joint-choice keys `binding.choose`, `choose_min`, `about`, `match.differs`, `soft`, `n` for `solveChoices` — read them so its reference solver `tools/lib/choose.mjs` can be deleted (one solver).

## Reviewer 2026-11-14 22:00 — 0.68–0.72 accepted

Reviewer ran `npm test` on 0.72: 437, 437, 436 pass, 0 fail, exit 0. Accepted: story plans from k.story (0.68), w.document output (0.69), Q49 per-value joins with closeType (0.70), realisation through w.lang.en discourse templates and the composition pins with the budget never exceeded (0.71), `readByTypes` (0.72). PSys2 is told to vendor 0.72, show one composition per type, and measure readByTypes on the curve.

## Reviewer 2026-11-14 22:30 — 0.73–0.75 accepted; what is still missing of 21:55

Reviewer ran `npm test` on 0.75: 442, 442, 441 pass, 0 fail, exit 0. Accepted: `cousins` + `kindChain` + `judgeFix` (0.73), `nearWords` (0.74), `normalise` / `alternationsOf` (0.75). Still to do from 21:55: cousins along **all** dimensions of the layered graph (kind chain is one; also aspects of values, act families, alternation families, world structure kinds — the knowledge repository is publishing these edges now), `tools/cousins-test.mjs` (one example → cases with expected outcomes → host adapter → degree × dimension table), the skill `expand-and-test-case`, and `learnRules`. [KNOW] from the knowledge repository's Q54: how std.morph realisation gives English plurals and the a/an article (w.lang.en now has `det before=` and 19 `onset` facts); until then hosts use its `realiseEn` reference, which should not survive your answer.

## Reviewer 2026-11-14 23:05 — 0.76–0.80 accepted: the abstraction round is in; next is the wording dimension (PSys2's cousins tables)

Reviewer ran `npm test` on 0.80: 452, 452, 450 pass, 0 fail, exit 0. Accepted: learnRules (0.76), alignWorlds (0.77), storyState (0.78), failed:'separate' + compose memo + needs= (0.79), ancestorsOf / cousins by dimension / tools/cousins-test.mjs / skill expand-and-test-case (0.80).
**PSys2's first cousins tables (its worker-log, "Cousins host adapter")** show what is next: (1) on 71 failing paraphrases, cousins pass ~9 % at degree 1 and 2 alike, for every filler and key, because **a cousin keeps the wording of its case**: the break is the wording class, not the knowledge; the library has no **wording dimension**: add cousins along alternations and realisation templates (the same frame in other constructions: canonical, question/command, wrapper, fronting, ellipsis, compound) so the tester can say "fails when the construction changes"; (2) the 9 plans-ledger causes give **0 cousins**: `readByTypes` reads act sentences as a one-word `find`, so act sentences (make/place/group with roles) need typed act frames and the act-family dimension; (3) `kindChain` scans every wire per thing (too slow with all facts): index it; (4) the judge checks only the library's frame, so a compound question passes on one half: judge every clause. Then measure with PSys2.

## Reviewer 2026-11-14 23:20 — FORM SIBLINGS: learn the operators, not the cases (owner, 16:12)

Owner: perhaps siblings and cousins must also be decided in other ways; there cannot be that many cases. Theory: a request = **content × form × context**. Generalisation = the meaning is *invariant* under form changes and changes *correctly* under content changes. `cousins` today varies content (kind, key, act family); PSys2's tables show the failures are form. Form variation is generated by a **small set of operators** (Harris' kernel sentences + transformations; Bhagat & Hovy 2013 count about 25 paraphrase phenomena): syntactic alternations (passive, fronting, question/command, wrappers, dative, ellipsis/fragment), lexical substitution (synonym, hypernym, derivation), discourse noise (fillers "hey/um/so", repetitions, false starts, compounds "and then"), number and unit rewording, spelling. Many combinations, few operators.
Build: (1) **form dimensions in `cousins`**: apply the operators to a case's canonical realisation (alternations from w.lang.en, lexical via k.words, noise operators as data), tagged per operator, so the tester says "fails under operator X"; (2) **`learnFormOperators(pairs)`**: from aligned pairs (canonical sentence ↔ variant with the same meaning: PSys2's paraphrases-rt originals and paraphrases, owner-log corrections, failing cousins) diff the parses / anti-unify them to extract the operator, cluster the extracted operators, and propose for each cluster both a generator (for cousins) and its inverse (a normalisation rule for reading), admitted only by held-out pairs + the curve; (3) report the operator inventory: how many clusters cover 80 % / 95 % of the pairs (the owner's hypothesis: few).

## Reviewer 2026-11-14 23:45 — 0.81–0.84 accepted; TEST SPEED (owner, 16:35: do not lose the time in tests)

Reviewer ran `npm test` on 0.84: 460, 460, 458 pass, 0 fail, exit 0. Accepted: inflectBy/articleFor (0.81), std.plan choice points (0.82, Q57), wording cousins + typed act frames + indexed ancestors (0.83), learnFormOperators + form cousins (0.84; toy pairs only so far — PSys2 has built `training/eval/form-pairs.jsonl`, run it there).
**Test speed:** `npm test` runs the whole suite three times (plain, `SOPWORLD_BUNDLE=1`, `SOPWORLD_COW_CHECK=1`): about 15 minutes per release on a shared machine. From now on: (1) `npm test` = build + the plain run once (the gate per release); (2) `npm run test:full` = the three runs, before every 5th release or when the bundle/cow code changed; (3) make the slowest files faster (report the 10 slowest with their seconds; a test over 10 s should use a smaller fixture or be in test:full only). The reviewer will run `npm test` per release and `test:full` every few.

## Reviewer 2026-11-15 00:05 — PSys2's first real runs: learnRules 0 admitted, learnFormOperators 242 operators for 407 pairs; 0.85 accepted

0.85 (test split) accepted (PSys2 smoke unaffected). PSys2 ran your mechanisms on real data (its worker-log "Vendor sopworld 0.84.0, learnRules and learnFormOperators first runs"):
1. **learnFormOperators: 242 operators for 407 pairs, 80 % needs 161, 95 % needs 222; 0 reads gained.** The operators are per example because **content words stay constants**: the alignment works on surface strings. Abstract before anti-unifying: lift every content token to its type (typedLexicon: a kind, an attribute, a number, a name, a colour…) and keep function words, so "hey a cow makes which sound" and "hey a dog makes which noise" are one operator `hey {Q} a {ANIMAL} makes {REL}` → canonical; then re-measure the coverage (the owner's hypothesis is few operators; the measure so far tests the learner, not the hypothesis).
2. **learnRules: 17 proposed, 0 admitted**: the largest group gives an over-general rule (matches all 286 animals, 0/37 on its own cases); the name slot is not tied to the token when several variables co-vary; the holder id is taken as the name token. Fix both; reject a rule that fails its own training cases before held-out.
3. **Compositions** (one of each type, read by the reviewer and the owner): mechanically correct, but: an Abstract identical to the Introduction; a sentence repeated in the story's climax; the essay dumps metadata keys ("has a code of TCD, has a formal of Republic of Chad, has a code2 of TD") as a "counterargument"; presentation points repeat facts; "has a colour of black and white". Needed: no sentence twice in a document; attribute-specific realisation ("Its capital is N'Djamena"; "it is black and white") from w.lang.en templates per attribute; metadata keys never narrated (k.attributes marks them, asked); each move uses a different fact; a counterargument needs a real contrast (k.commonsense / a different value), else the move is skipped.

## Reviewer 2026-11-15 00:40 — 0.86–0.89 noted (owner's hypothesis holds: 14 typed operators cover 80 % of edits, 6 families); next: the inverse at read time; [KNOW] Q58

The decisive step now: **per family, the inverse for reading** (normalise a variant to its canonical by the typed operators: drop fillers, undo the extra clause by splitting it into its own clause, undo substitutions through k.words near senses, inflection via std.morph), wired as a pipeline step, and measured by PSys2 on the curve (paraphrases-rt, cousins-real) — the first time generalisation can show. Then learnRules item 2, composition quality item 3. **Published knowledge to use:** k.kinds up edges on 6 dimensions (bb61a21), k.actions act families (a523fa4), w.lang.en alternations: 368 rules / 17 families in your Q54 format (a52dbec). **[KNOW] Q58:** the first mode applied wins ("can you tell me where…" read as a request, not a question); rules tried in telling order — sort by `n`; allow a word class in a pattern (`{x:wh}`) instead of one fact per alternative; typed spans for double objects ("give the dog the ball").

## Reviewer 2026-11-15 01:00 — 0.90 accepted; ONE WAY TO CHOOSE (owner, 17:16: many candidates for rules and templates — how is the best decided, is there a general method?)

Reviewer ran `npm test` (one pass) on 0.90: 465 pass, 0 fail. Accepted (learnRules own-cases-first and name/holder binding; compose without repeats, contrast for counterarguments).
**Owner's question.** Today readings are ranked by one documented method (`rank`: consistent > referents settled > lacks > every word used > fewest assumptions, explained), values by tiers (told > derived > forced > default > guessed), worlds by `arbitrate`. But other choice points have their own scorers: grammar `priority`, `nearWords` costs, alternation order (Q58), form-operator application, `sample` weights, `interestOf`, compose choices, template choice in realisation. Make it **one method**:
1. Every choice point produces candidates and calls **`std.rank` with criteria declared as data** for that point (a criteria list per choice kind, in a world, not in code): hard constraints first (consistent with the world, types fit), then coverage (nothing said left unread / every role filled), then **fewest and cheapest assumptions** (weighted abduction: each default, near word, operator, guessed value has a cost from knowledge), then **specificity** (the more specific rule/template beats the general one), then priors (typicality, interest, recency/focus), finally seeded order. Every choice explained ("lost to X on criterion C").
2. Costs and priors are knowledge (k.* facts) and can be calibrated from the case corpus (learn the tie-break weights on cases, admitted by held-out), never hand-tuned in code.
3. `docs/decisions.md`: the map of all choice points, their candidates, their criteria — the owner's mental model of "how the system decides".

## Reviewer 2026-11-15 01:40 — 0.91–0.94 accepted (test:full: 470, 470, 468 pass, 0 fail)

Accepted: `canonicalise` / `readCanonical` (inverse operators at read time, 0.91), `std.decide` + `choose` with docs/decisions.md (0.92), readByTypes frames / normalise rules / compose facts through choose (0.93), score order from std.decide and parses through choose (0.94). PSys2 is vendoring 0.94 and will measure the inverse operators on the curve. [KNOW] Q60 (knowledge repository): the formats of `k.kinds.argument` / `relation` / `structure` / `w.lang.en.variant` as published — accept or name the key changes; for `alignWorlds`, say whether you need cardinality per role, link direction, or a constraint map.

## Reviewer 2026-11-15 02:00 — 0.95–0.97 accepted

Reviewer ran `npm test` on 0.97: 473 pass, 0 fail. Accepted: `calibrate` (criteria order learnt from cases, 0.95), experiment and ablation harnesses (Round 28 item 9 — Round 28 is complete), Round 27 skills (0.97). Q61 (structure role facts for alignWorlds) forwarded to the knowledge repository. Next: wait for PSys2's curve with 0.94's inverse operators; meanwhile composition quality follow-ups and anything PSys2's thinning audit hands over.

## Reviewer 2026-11-15 02:15 — TYPE SIGNATURES and a finite pattern inventory (owner, 18:10)

Owner: give every word a canonical type — a signature computed from several rules — and keep a list of sentence patterns over those types, so words always fall into patterns; abstraction faster, with a simpler model; "there cannot be that many patterns". Prior work says this works when done in two levels: supertagging (Bangalore & Joshi 1999: a rich lexical type per word makes parsing "almost" trivial), delexicalisation in task dialogue (entities replaced by their types → templates), Brown clusters (1992: a word's class as a bit-string path computed from its contexts — a hash from distribution, with prefixes as coarser levels), cascaded finite-state readers (Abney's chunking; Hobbs' FASTUS: a few hundred patterns over chunks cover a domain), construction grammar (form–meaning pairs with typed slots). Build, measured:
1. **`signatureOf(token, context)`**: a tuple, canonicalised to a string, with coarse-to-fine levels for back-off: (a) knowledge — the WordNet supersense of its sense (lexicographer file), its `k.kinds.argument` class(es), name / number / unit / colour; (b) morphology via std.morph (plural, past, -ly, comparative); (c) closed-class words stay literal; (d) distributional class from the case corpus (Brown-style clustering, prefixes as levels) for words knowledge does not type; (e) focus/discourse (a pronoun with a referent in focus). An ambiguous word keeps a small set of signatures; `std.decide` chooses in context.
2. **Two levels**: chunk first (noun group, verb group, number+unit, a name, a quoted span → one token with its signature), then match **sentence patterns over chunk signatures** with optional slots and skippable fillers; each pattern maps to a frame (act + roles).
3. **Pattern mining with a coverage report**: mine patterns from all corpora (PSys2 cases, form pairs, paraphrases, tales, arXiv sentences for the genre) over signatures; report how many patterns cover 80 % / 95 % of the sentences at each signature level (the owner's hypothesis, measured the way 0.89 measured operators). Patterns admitted by held-out reading + the curve.
4. Relation to what exists: readByTypes + liftTokens are the first version; this makes the signature explicit, multi-level and corpus-informed, and the pattern inventory a measured, finite object.

## Reviewer 2026-11-15 02:30 — SEVERAL READERS, ONE CONFIDENCE (owner, 18:18)

Owner: several ways of parsing and formalising meaning, each giving a reading with a confidence, combined to raise coverage and confidence; later the combination may be learnt by a small classifier in production (not now). Theory: ensembles with a reranker (Charniak & Johnson 2005: n-best from several parsers, then a reranker over features), agreement between independent methods as a confidence signal (co-/tri-training), and selective prediction (answer only above a confidence, otherwise ask; risk–coverage curves, Geifman & El-Yaniv 2017). Today our readers run as a **fallback chain** (rules → typed step → …), so a later reader never confirms or contradicts an earlier one. Build:
1. **Readers as parallel voices** (steps of the pipeline world, each optional): the grammar/frames reader, `readByTypes`, `readCanonical` (inverse operators), near-word reading, the signature/pattern reader (02:15) when it exists; hosts may add their own voices (PSys2's neural dispatcher and normaliser are voices too — they propose, they never act alone).
2. **Pool the candidate frames** with features: which readers proposed it (agreement count), each reader's cost/assumptions, words covered, consistency with the world (dry run), specificity, priors.
3. **`std.decide` combines** (criteria as data; agreement is a criterion) and returns the frame **with a confidence**; below a threshold the answer is a question back naming the competing readings ("Did you mean A or B?"), not a guess.
4. **Calibration** (0.95 `calibrate`): the criteria order / weights and the threshold learnt from cases (corpus, ledger, dislikes) — this is the slot where a small classifier can go later, trained on the same features, admitted by held-out.
5. Report on the toy apps and with PSys2: each reader alone (coverage, precision), the union, the agreement-only precision, and the risk–coverage curve.

## Reviewer 2026-11-15 02:50 — PSys2's handover LIB-1..8 and the measured signal

PSys2's thinning audit (its questions.md "[LIB] Thinning audit", LIB-1..8) lists general host code with tests: `joinList`; a fact as a clause (`clause`, `nounKey`, `fill`); choosing an act template by roles (`actSentence`, with sample's `realise`); `renderFrames` for summarizeLog; genre/topic index and random topics by interest for compose; a typed world built from a session (`typedWorldOf`) and re-reading refused roles by type; slot-type assignment over pattern slots; cousins judging helpers. Take them in, with their tests, so PSys2 can delete them; also "[LIB] 0.94 compose: essay about Peru has no claim sentence the host realiser can say". **Signal from PSys2:** typed form operators gave no held-out gain (6/24 → 6/24); with a per-clause judge, cousins of the failing paraphrases pass 2/1165: the failing paraphrases are compound and noisy, so **clause splitting and per-clause reading of compound, noisy requests** is the bottleneck — make it the next reading item (segmenter for run-on requests: "um … what 7 plus 5", "… and then how many legs does a spider have"; each clause read and answered; measured with PSys2).

**[KNOW] 03:05:** the structure role facts are published (knowledge 4cdbc09) on the existing `k.kinds.role` (`refers`, `of`, `many`, `required`) and a new `k.kinds.constraint structure= name= kind=capacity|distinct|order on= about= world= by=` (6 facts); `structure_of` casts are the type-to-role map. Wire `alignWorlds` to them. Q65 (knowledge): with 0.97, "can you tell me where the cat is" normalises as a question — as Q58 asked; recorded only.

## Reviewer 2026-11-15 03:20 — 0.98–0.103 accepted; next from PSys2's Q15

Reviewer ran `npm test` on 0.103: 486 pass, 0 fail. Accepted: readEnsemble + riskCoverage (0.98), signatureOf/chunk/minePatterns (0.99: **11 clause patterns cover 80 %** where the world types the words — the owner's hypothesis holds), patternReader (0.100), splitRunOn (0.101), LIB-1..4 (0.102), LIB-5..8 (0.103). PSys2's Q15 (its questions.md) gives the next library items: (1) **completeness**: a reading that leaves content words unread is not final — `decide`/`readEnsemble` treat unread content as a strong cost and pass the clause to other voices; (2) **`arbitrate` by coverage** (coverage first, then tab ownership, then priority); (3) **discourse ellipsis** in std.dialogue: verbless continuations ("it to the top right", "and still up") reuse the previous act with new roles; (4) acts on `named:false` kinds report a dropped name instead of dropping it silently. Then test:full (last full at 0.94).
