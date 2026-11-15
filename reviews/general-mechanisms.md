# The general mechanisms, on one page (reviewer, 2026-11-15; owner's direction)

**Principle.** A live world is its state (facts) plus its capabilities (the acts it can carry out with its tools). Every decision — what was meant, which values, whether it is allowed — comes from knowledge worlds, schema worlds and general reasoning. A tool only executes. Nothing is decided in code that names a world, a kind or a sentence.

## What a live world declares (and nothing else)
1. **Kinds and slots** — its schema (types, required keys, ranges, joins to knowledge worlds).
2. **Capabilities** — `std.schema.honours`: for each act, the constraints it can honour (count, kinds, size, place, layout, with-parts, about, length …).
3. **Tool binding** — act + filled slots → one operation of the world. With **preconditions and effects** as facts (what must hold before, what holds after), so plans chain tools from their effects instead of fixed sequences.
4. **Constraints** — deny rules on its own state (capacity, exclusions, relations that must hold).
5. Optional **own expectations** (facts of the k.expect shapes) that come before the catalog's.

## The six steps of a turn (each a library mechanism over any live world)
0. **View** — `factsOf(world)`: any wires as `(thing, attribute, value)` and `(thing, relation, thing)`. All reasoning reads this view only.
1. **Understand** — `readRequest` → a `w.request`: act, target, constraints (also negated, ranges, scale, manner), `unread`. Sources, as data: the language world's words, the live world's kinds / acts / present things, the dialogue, `repairWords`. Every content word ends in a fact or in `unread`.
2. **Situate** — `w.dialogue`: a new request, or a reaction that revises the last one (`reviseRequest`). A revision changes only what the reaction names.
3. **Decide** — `planRequest`: fill each gap from the ordered sources (said > dialogue > induced from this world > the world's facts > expectation knowledge > sampled in the typical range); propose a few candidates, simulate on a copy, **deduce** (schema + knowledge rules + the request's constraints) and drop hard violations, **abduce** the cheapest explanation, with **induced** regularities of the present state as soft defaults.
4. **Act** — `runPlan`: the plan's steps through the tool binding; one plan = one step of the timeline (undo / redo), a revision replaces the last step, a question is no step.
5. **Say** — `sayRequest`: what was done, what was assumed, what cannot be honoured, what was not read; from the language world's replies.
6. **Keep** — the session's corrections become soft preferences in `w.dialogue`; what the generic path could not do goes to the "needs" ledger by generic piece.

## Suggestions to consolidate (proposals; object in questions.md)
- **One constraint vocabulary** for schema rules, knowledge rules and requests: type, range, count, not, requires, excludes, relation(a, b), capacity, each hard or soft with a cost. One deduction engine, one `choose`.
- **Provenance on every filled value and every rejection** (source, rule, cost): "why?" and debugging come for free, and a wrong default points at the fact to fix, not at code.
- **Capabilities carry effects** (above): "arrange after make", "link what has no link" become plans found from effects.
- **Language touches only steps 1 and 5.** English is the centre; another language is words in, words out.
- **Tests are generated from declarations**: for each world, act and honoured constraint, the properties (negation, range, scale order, revision keeps the rest, no-op said, reference resolved, no hard violation, cannot named), driven through the real door.

## Patch smells (a review refuses these)
A world id, a kind name or a user sentence in shared code · a regular expression over the user's text in a host · a default number in code · a reply as a string literal · a fallback that executes · a tool that decides · a test whose only evidence is one fixed sentence · a fix described by the sentence it repairs rather than by the piece it adds.
