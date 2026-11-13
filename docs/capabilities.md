# What the library can do

By job, not by API. Each job has a paragraph, an example that runs (every example on this
page is run in CI and must print what is shown), the module and the version it came in,
and its limits. Where a job is not done yet, it says so. API details:
[api](api.md), [reference](reference.md); how worlds combine: [patterns](patterns.md).

## Describe a world

*In core: `core.type`, `core.slot`; since 0.1.*

Kinds of things are types; their attributes are slots with kinds, value lists, ranges,
defaults and questions to ask when they are missing. Everything told is checked against
them at once. **Limits:** one value per key unless the slot says
`many`; a missing required key is an open question, not a refusal.

```js run
const w = new World();
w.load(`@k1 core.slot of=room key=name id=true
  @k2 core.slot of=room key=size kind=number min=4 max=40
  @k3 core.slot of=room key=use enum=sleep enum=cook enum=work required=true ask="What is it for?"`);
print(w.tell('@r1 room name=kitchen size=12 use=cook').ok, w.tell('@r2 room name=hall size=90').violations[0].kind);
w.tell('@r3 room name=study size=10');
print(w.open().map((o) => o.ask));
```

```output
true domain
["What is it for?"]
```

## State facts and rules

*In core: `core.rule`, `core.deny`; since 0.1.*

Rules derive wires from wires; a conclusion goes when what it rests on goes. Denies
refuse a change that breaks them; soft denies only advise. **Limits:**
no rule may negate or aggregate what its own conclusions produce (stratified).

A rule joins two things through a reference by naming the other pattern
(`@r line order=$o qty=?q` with `@o order ...`): a variable (`order=?x`) would join
nothing.

```js run
const w = new World();
w.load(`@p person name=?n age=?a
  @adult core.check fn=gte args=?a args=18
  @t person core.on=$p adult=yes
  @r core.rule when=$p if=$adult then=$t`);
w.tell('@a person name=ana age=30  @b person name=bo age=9');
print(w.get('a').attrs.adult, w.get('b').attrs.adult);
w.retract('a');
print(w.ofType('person').length);
```

```output
["yes"] undefined
1
```

## Ask and explain

*In `world.query`, `world.why`; since 0.1.*

`query` answers with a status (`yes`, `no`, `unknown`, `supported`, ...) and what the
answer rests on; `why` gives the chain behind a wire or a value, back to what was told
(the rule, the act, the tier, the source).

```js run
const w = new World();
w.load(`@b box h=?h
  @c core.calc out=?y fn=sub args=100 args=?h
  @t box core.on=$b y=?y
  @r core.rule when=$b with=$c then=$t`);
w.tell('@a box h=90');
print(w.query({ about: 'a', seek: 'y' }).value, w.why('a', 'y').steps.map((s) => [s.id, s.how, s.rule ?? null]));
```

```output
10 [["a","rule","r"],["a","told",null]]
```

## Act, undo, groups

*In `world.act`, `world.undo`; since 0.5.*

Actions change the world in one transaction (declared in SOP Lang, or a host function);
several requests of one sentence go together or not at all and are one undo step; every
action returns its difference.
**Limits:** a collection replaced with `world.sync` is not given back by `undo` (take a `mark()`).

```js run
const w = new World();
w.load(`@k core.slot of=item key=name id=true
  @it item name=?x
  @to item core.on=$it place=?q
  @move core.action name=move param=x param=q when=$it set=$to`);
w.tell('@a item name=cup place=table  @b item name=pen place=table');
const r = w.act([{ action: 'move', args: { x: 'cup', q: 'shelf' } }, { action: 'move', args: { x: 'pen', q: 'shelf' } }]);
print(r.ok, r.results[0].diff.changed);
w.undo();
print(w.get('a').attrs.place, w.get('b').attrs.place);
```

```output
true [{"id":"a","key":"place","from":"table","to":"shelf","toTier":"told"}]
["table"] ["table"]
```

## Worlds that do things, as data; refuse with alternatives

*In `std.schema`, `std.acts`; since 0.18.*

A world is a schema (`std.schema`): kinds, attributes, which acts apply. The acts
(`std.acts`: make, remove, change, place, connect, group, pick, ask, copy, send, save,
load, undo, redo, show, teach, forget) are the same everywhere; a new world needs no rule.
A refusal says what is allowed and where.  **Limits:** `place` writes a
position key; relations are std.relations' job.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @plan std.schema.world name=plan
  @t core.type of=chair extends=std.schema.thing closed=true
  @s core.slot of=chair key=colour enum=red enum=blue default=blue
  @k std.schema.kind of=chair world=plan acts=make acts=change`);
w.act({ action: 'make', args: { kind: 'chair' } });
const r = w.act({ action: 'change', args: { thing: 'chair', attr: 'size', value: 3 } });
print(r.violations[0].why, r.violations[0].reason.attrs, r.violations[0].reason.allowed);
```

```output
a chair has no size ["colour"] ["make","change"]
```

## Drive a world whose state is not wires

*In `std.schema.effect`; since 0.28.*

One act on one kind can be given to the host (a drawing board, a diagram engine, a face):
the act still checks the schema, its result and difference come back like any act's, and
a refused sentence undoes the effects done before the refusal. **Limits:** `world.undo`
of an effect act takes back its wires only; the host keeps its own history.

```js run
const board = [];
const w = new World({ actions: { draw: (ctx, args) => { board.push(args.kind); return { thing: `s${board.length}`, diff: { added: [`s${board.length}`] }, undo: () => board.pop() }; } } });
w.load(`@acts core.use world=std.acts
  @b std.schema.world name=board
  @t core.type of=circle extends=std.schema.thing
  @k std.schema.kind of=circle world=board acts=make
  @e std.schema.effect of=circle act=make action=draw`);
print(w.act({ action: 'make', args: { kind: 'circle' } }).diff.effects, w.act([{ action: 'make', args: { kind: 'circle' } }, { action: 'make', args: { kind: 'kite' } }]).ok, board);
```

```output
[{"added":["s1"]}] false ["circle"]
```

## Fill gaps from other worlds

*In `std.fill`, `std.know`; since 0.17.*

When a request leaves a key out, other modules offer values in named tiers (`std.fill`:
user, focus, scene, taught, knowledge, default); the best tier wins, the source is kept,
a tie is advice. `std.know` offers from a knowledge catalog.

```js run
const w = new World();
w.load(`@u core.use world=std.fill
  @g req thing=?t core.absent=place
  @gn std.fill.need for=$g key=place
  @gr core.rule when=$g then=$gn
  @q req thing=?t
  @n std.fill.need for=$q key=?k
  @us usual thing=?t value=?v
  @o std.fill.offer for=$n value=?v tier=knowledge source=usual
  @r core.rule when=$q when=$n when=$us then=$o`);
w.tell('@u1 usual thing=cup value=table  @q1 req thing=cup');
const n = w.ofType('std.fill.need')[0];
print(n.attrs.value, n.attrs.tier);
```

```output
["table"] ["knowledge"]
```

## Keep focus in a dialogue

*In `std.focus`; since 0.17.*

`std.focus` keeps what a dialogue is about after each turn (thing, action, place, world);
a request that leaves out its thing or action is completed from the turn before, and
earlier turns keep theirs. **Limits:** a value chosen by std.fill is not a
mention.

```js run
const w = new World();
w.load(`@u core.use world=std.focus
  @any req
  @turn std.focus.turn of=$any in=main
  @r1 core.rule when=$any then=$turn
  @sd req thing=?v
  @m std.focus.mention of=$sd kind=thing value=?v
  @r2 core.rule when=$sd then=$m
  @gap req core.absent=thing
  @n std.fill.need for=$gap key=thing
  @r3 core.rule when=$gap then=$n`);
w.tell('@q1 req thing=cup'); w.tell('@q2 req colour=red');
print(w.ofType('std.fill.need')[0].attrs.value);
```

```output
["cup"]
```

## Relate and place things

*In `std.relations`, `std.boxes`; since 0.16.*

`std.relations`: on, in, next to, above, in front of, kept: when the other thing moves,
the place follows; rows; the first; one per place. `std.boxes` has the geometry
functions. **Limits:** boxes only; a row assumes equal widths.

```js run
const w = new World();
w.load('@u core.use world=std.relations');
w.tell(`@t std.relations.box kind=table w=100 h=20  @ta std.relations.at thing=$t x=0 y=80
  @b std.relations.box kind=book w=20 h=10  @kb std.relations.keep thing=$b rel=on ref=$t`);
w.revise('ta', { x: 50 });
print(w.get('b').attrs.x, w.get('b').attrs.y);
```

```output
["90"] ["70"]
```

## Share things between views; teach facts

*In `std.schema` views, `show`, `teach`, `complete`; since 0.21.*

Several views read the same things; a view shows some aspects; showing a thing that lacks
one is refused with the reason. Facts the user teaches sit at their own tier and say who
taught them; the act `complete` applies defaults learnt later to things already made.
**Limits:** one value per key for all views (a view restyles
in its renderer).

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @z std.schema.world name=zoo
  @a std.schema.aspect name=place keys=place doc="place on Earth"
  @t core.type of=table extends=std.schema.thing closed=true
  @k std.schema.kind of=table world=zoo acts=make acts=show
  @v std.schema.view name=map shows=place`);
w.act({ action: 'make', args: { kind: 'table' } });
print(w.act({ action: 'show', args: { thing: 'table', view: 'map' } }).violations[0].why);
```

```output
a table has no place on Earth
```

## Generate cards, examples, replies, a coverage grid and tests

*In `schemaCard`, `schemaExamples`, `actReply`, `schemaGrid`, `gridTests`; since 0.19.*

From a schema: the card of a world (kinds, attributes, acts, words), example sentences per
act with their requests, the plain-English reply for a done act or a refusal, a coverage
grid (every world × kind × act case run, with its expected difference; the holes are the
cases not done) and a node:test file from the grid. **Limits:**
English only (hosts translate).

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @face std.schema.world name=face
  @t core.type of=eye extends=std.schema.thing closed=true
  @s core.slot of=eye key=colour enum=brown enum=blue default=brown
  @k std.schema.kind of=eye world=face acts=make acts=change`);
const req = { action: 'make', args: { kind: 'eye' } };
print(schemaExamples(w).map((e) => e.text), actReply(w, req, w.act(req)));
```

```output
["make an eye","make the colour of the eye blue"] I made an eye (eye1).
```

## Drop readings the present state would refuse

*In `world.score`; since 0.13.*

`score` judges candidate readings of one sentence without applying anything: which would
be refused and why, which lack something and what to ask.

```js run
const w = new World();
w.load(`@g game name=hangman state=running
  @gs game core.on=$g guess=?l
  @guess core.action name=guess param=l when=$g set=$gs`);
const r = w.score([{ action: 'guess', args: { l: 'a' } }]).candidates[0];
print(r.ok, r.violations[0].why);
```

```output
false nothing matches game name=hangman state=running
```

## Measure reuse

*In `tools/reuse.mjs`, option `advise`; since 0.21.*

`tools/reuse.mjs` finds candidates for shared modules across worlds (types and rules of
the same shape, shared words, parameterised worlds) and a reuse number per world; the
option `advise` gives the same advice to an author at load.

```js run
const w = new World({ advise: true, library: { shapes: '@s core.module name=shapes\n@b1 core.slot of=shapes.box key=x kind=number\n@b2 core.slot of=shapes.box key=y kind=number' } });
w.load('@m core.module name=app imports=shapes\n@a1 core.slot of=card key=x kind=number\n@a2 core.slot of=card key=y kind=number');
print(w.warnings[0].why);
```

```output
kind card here has the shape of shapes.box in module shapes: import it?
```

## Load knowledge by lookup

*In `createCatalog`, `bundleReader`; since 0.23.*

A catalog (an index of worlds with their schemas, dependencies and shards, and a
vocabulary from words to shards) finds what a word needs, reads each shard once through
the host's `read` (a file, `fetch`, a bundle), caches it, and tells it into a world with
the schemas first. `tools/build-bundle.mjs` writes an offline bundle for a list of words
that `bundleReader` reads with the same code. **Limits:** the lemma of a
word is the host's (`lemma` option); the library knows no language.

```js run
const index = { worlds: [{ id: 'k.things', schema: 'k.things/schema.sop', shards: [{ id: 'k.things/s1', path: 'k.things/s1.sop' }] }] };
const files = { 'k.things/schema.sop': '@k core.slot of=k.thing key=name id=true', 'k.things/s1.sop': '@cup k.thing name=cup usual=table' };
const cat = createCatalog({ index, vocab: { cup: ['k.things/s1'] }, read: bundleReader({ files }) });
const w = new World();
print(cat.intoSync(w, 'cup').told, w.get('cup').attrs.usual);
```

```output
["k.things/schema.sop","k.things/s1.sop"] ["table"]
```

## Handle one request end to end

*In `turn`; since 0.24.*

`turn` takes the candidate readings of one message, tries each on a fork, applies the
first the world takes as one sentence, and gives back the difference, the why of each
changed value, the guesses it made and the replies; when none is taken, a graded
fallback: one question, "not here but there", or the best guess named. The host reads
text into readings and renders. **Limits:** the readings are the host's;
replies are plain English unless the host passes `reply`.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @plan std.schema.world name=plan
  @t core.type of=chair extends=std.schema.thing closed=true
  @s core.slot of=chair key=colour enum=red enum=blue default=blue
  @k std.schema.kind of=chair world=plan acts=make acts=change`);
w.act({ action: 'make', args: { kind: 'chair' } });
const t = turn(w, [{ action: 'change', args: { thing: 'chair', attr: 'colour', value: 'red' } }]);
print(t.replies, t.why[0].steps[0].action);
```

```output
["I changed the colour of the chair (chair1) from blue to red."] change
```

## Change the path of a request by telling facts

*In `std.turn`, `turnFlow`; since 0.26.*

The stages of `turn` are declared with `std.turn`: an application adds a stage (a
confirmation before removing many things, a permission check), gives a stage a second
provider ranked by tier (a second reader), or skips one, by telling wires; `turnFlow` runs
the declared path and gives a trace of every stage taken. **Limits:** what a stage does is
a function; candidates are tried one after the other, not in parallel.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @t core.use world=std.turn
  @plan std.schema.world name=plan
  @c core.type of=chair extends=std.schema.thing closed=true
  @k std.schema.kind of=chair world=plan acts=make
  @p2 std.turn.provider stage=read name=second tier=2`);
const t = turnFlow(w, [{ action: 'make', args: { kind: 'sofa' } }], { providers: { second: () => [{ action: 'make', args: { kind: 'chair' } }] } });
print(t.status, t.reading, t.replies);
```

```output
done 1 ["I made a chair (chair1)."]
```

## Choose a world for a request

*In `route`; since 0.24.*

`route` scores the worlds of the schemas for a request by their cards, the thing it
names, a dry run, and a signal of the host's own (an encoder's score), best first with
the reasons. **Limits:** no reading of text: the request comes from the host.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
  @a std.schema.world name=garden
  @t core.type of=rose extends=std.schema.thing closed=true
  @k std.schema.kind of=rose world=garden acts=make`);
print(route(w, { action: 'make', args: { kind: 'rose' } }));
```

```output
[{"world":"garden","score":3,"why":["has rose","allows make"]}]
```

## Tools for authors

*In `tools/validate.mjs`, `tools/ledger.mjs`, `ledgerGroups`; since 0.25.*

Validate a world in one command (what is refused, what is noted, the grid's holes); keep
a failure ledger (append-only, grouped by the pipeline stage where a case failed and by
cause signals the host plugs in); find reuse; measure with the benches in `bench/`.
**Limits:** the cause signals and the replay of the sources are the host's.

```js run
const g = ledgerGroups([{ text: 'remove eyeglasses', source: 'logs', stage: 'routing', class: 'kind' }, { text: 'delete the box', source: 'logs', stage: 'routing', class: 'kind' }]);
print(g.map((x) => [x.key, x.count]), stageOf({ status: 'ask' }));
```

```output
[["routing / kind / other",2]] filling
```

## Read noun phrases with a grammar world

*In `parseText`, `nounPhrase`; since 0.29.*

A language is a world of facts (its lexicon, its rules, its coordinating words); the
library's parser reads text with it into noun phrases with determiners, numbers,
modifiers and a prepositional phrase, and coordinations, every parse best first. **Limits:**
noun phrases only for now (verbs and frames next); the grammar of a real language lives in
sop-knowledge-worlds, not here.

```js run
const w = new World();
w.tell(`@a g.word text=ko lemma=cup cat=N  @b g.word text=mi lemma=red cat=Adj  @r g.rule lhs=NP rhs=N rhs=Adj*`);
print(nounPhrase(parseText(w, 'ko mi', { start: 'NP' })[0].tree));
```

```output
{"span":[0,2],"rule":"r","mods":["red"],"head":"ko","lemma":"cup"}
```

## Not done yet

- **The other PSys2 hand-over packages** (acts, space, session.things, session.dialogue,
  common.sense) are compared with std.acts, std.relations, the views and std.focus as they
  are taken; until then those jobs are done by the modules above, with their limits.

## Taken over from PSys2

General modules PSys2 hands over (its `handover/` folder) land here; what is general is
taken, what is about one language, one interface or one application is refused.

| PSys2 package | here | PSys2 lines it replaces | refused (stays in the host) | since |
| --- | --- | --- | --- | --- |
| knowledge-loader | `createCatalog`, `bundleReader`, `tools/build-bundle.mjs` | 254 (catalog 105, cache 52, source 20, bundle loader 20, bundle generator 57) | English lemma rules (the host passes `lemma`), decoding k.objects parts for drawing, the avatar's faces, the evaluation-set generator; taught facts are the act `teach` | since 0.23 |
| turn-pipeline | `turn` (dry run on a fork, all or nothing, diff, why, guesses, replies, graded fallback) | the dry-run protocol, all-or-nothing holds and graded fallback (estimated 120 + 350 of its 900 general lines) | the reading of English, the per-turn tick budget wiring (the library has its own budgets), translation, the encoder accept rule | since 0.24 |
| meta.worlds | `route` (cards, referents, a dry run, a host signal) | its routing rules (the cards stay generated by the host) | the tab registry and the generated cards of one application | since 0.24 |
| failure-ledger | `ledgerAppend`, `ledgerGroups`, `stageOf`, `tools/ledger.mjs` | the format, append and counting (of its 160 generator lines) | its cause-signal list and the replay of its own evaluation scripts | since 0.25 |
| acts, session.things, session.dialogue, common.sense, space | compared (questions.md Q30): already covered by std.schema, std.acts, views, std.focus, `turn`, `createCatalog`; missing: a per-kind act hook, space selection and layouts, overlap enforcement, a turn log, pieces | — | English forms and readers, its tabs' words, facts (to sop-knowledge-worlds) | — |
