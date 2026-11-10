# Changelog

## 0.5.0

The full list, with section numbers, is in SPEC.md section 9.

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
