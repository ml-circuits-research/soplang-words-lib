# Changelog

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
