# The standard modules

Every `std.*` module of the library, loaded with `core.use world=std.<name>` (each is
opt-in), and the services written in JavaScript that work with them. For each: what it is
for, what it loads, its types, actions and tiers, and what it costs (the bench that
measures it). Details and examples: [reference](reference.md), [capabilities](capabilities.md).

Modules are mechanisms, not worlds (see the [glossary](glossary.md#the-three-kinds-of-worlds)). `std.schema` is how a
**world schema** is written; `std.know` and the catalog read **knowledge worlds**;
`std.acts`, `std.fill`, `std.focus`, `std.relations` and `std.turn` run a **live world**.

## Modules of SOP Lang

| Module | Purpose | Loads | Types | Actions, functions | Tiers | Cost |
| --- | --- | --- | --- | --- | --- | --- |
| `std.numbers` | average, median of a few numbers | — | — | functions `average`, `median` | — | a function call |
| `std.order` | the place of a value among others | — | — | functions `rank_in`, `nth_smallest`, `nth_largest` | — | a function call |
| `std.boxes` | geometry of boxes (x y w h, y down) | — | — | functions `centre_x`, `centre_y`, `overlaps`, `contains_box`, `box_distance` | — | a function call |
| `std.fill` | a value for a key a request left out, from offers in named tiers | — | `std.fill.need`, `.offer`, `.tier`, `.best`, `.at_rank` | rules; soft deny on a tie | `user` 1, `focus` 2, `scene` 3, `taught` 3.5, `knowledge` 4, `default` 5 | `node bench/know.mjs` (with std.know) |
| `std.dialogue` | the kind of each turn (why, correction, continuation, list, ellipsis, answer, request) from the host's cue phrases; a modal world sees a turn first | `std.focus` | `std.dialogue.cue`, `.modal` | the JS `dialogueTurn`, `focusLog` | — | a pass over the tokens of one message |
| `std.decide` | one way to choose: the criteria of each choice kind (reading, template, word, rule, fact) as data, in one order (hard, coverage, cost, specificity, prior, seed) | — | `std.decide.criterion` | the JS `choose` | — | a sort of the candidates |
| `std.focus` | what a dialogue is about after each turn; completes requests | `std.fill` | `std.focus.turn`, `.mention`, `.state`, `.last` | rules, a fluent | offers at `focus` | `node bench/focus.mjs`: 400 turns ≈ 4.5 s, one more ≈ 20 ms |
| `std.relations` | relations kept between things; rows; first; each; one per place | — | `std.relations.box`, `.at`, `.keep`, `.nth`, `.each`, `.spread`, `.pair` | actions `relations.put_all`, `relations.put_pairs` | — | `node bench/rank.mjs` (the rank it uses): 400 peers ≈ 0.4 s |
| `std.schema` | a world that does things, as data: kinds, attributes, acts, aspects, views, limits | — | `std.schema.thing`, `.world`, `.kind`, `.kinds`, `.aspect`, `.view`, `.limit`, `.count` | rules (load checks, limits) | — | part of an act's cost |
| `std.acts` | the acts, the same for every schema | `std.schema` | `std.acts.link`, `.group`, `.saved`, `.shown` | actions `make`, `remove`, `change`, `place`, `connect`, `group`, `ungroup`, `pick`, `ask`, `copy`, `send`, `save`, `load`, `undo`, `redo`, `show`, `teach`, `forget`, `complete` | — | `node bench/acts.mjs`: an act on 2,000 things ≈ 10 steps, under 10 ms |
| `std.turn` | the request pipeline as data: stages, order, providers, fallbacks | — | `std.turn.stage`, `std.turn.provider` | soft denies (advice on holes); run by `turnFlow` | — | `node bench/flow.mjs`: 30 requests, the same steps as `turn` |
| `std.know` | knowledge as a filler: usual place, size, colour; `is_a`; taught facts | `std.fill` | `std.know.taught`, `std.know.from` | rules; the tier `taught` (a `core.tier`) | offers at `knowledge` or `taught` | `node bench/know.mjs`: a make on 2,000 things ≈ 220 steps, ≈ 2 ms |

`core.use world=<module> as=<name>` loads a module under another name, as many times as
wanted (see [patterns](patterns.md), the parameterised world).

## Services in JavaScript

| Export | Purpose | Works with | Cost |
| --- | --- | --- | --- |
| `turn`, `turnFlow`, `route` | one request end to end with a graded fallback (coded, or as declared with std.turn); the world for a request | `std.acts`, any action | one dry run per reading on a fork |
| `schemaCard`, `schemaExamples`, `actReply`, `schemaGrid`, `gridTests` | cards, examples, replies, the coverage grid, test files | `std.schema` | the grid runs every case on a fork |
| `createCatalog`, `bundleReader` | knowledge loaded by lookup, cached, schemas first; offline bundles | any catalog in the sop-knowledge-worlds layout | one read per path |
| `ledgerAppend`, `ledgerGroups`, `ledgerKey`, `stageOf`, `STAGES` | the failure ledger | `turn` | linear in the rows |
| `PatternIndex` | a host's sentence patterns indexed by the words they need | the host's matcher | `node bench/patterns.mjs`: 51.5 of 3,000 patterns tried per sentence |

Tools: `tools/validate.mjs`, `tools/reuse.mjs`, `tools/ledger.mjs`, `tools/build-bundle.mjs`.
