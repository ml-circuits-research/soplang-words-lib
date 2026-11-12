# Changelog

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
