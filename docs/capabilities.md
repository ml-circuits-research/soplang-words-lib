# What the library can do

By job, not by API. Each job has a paragraph, an example that runs (every example on this
page is run in CI and must print what is shown), the module and the version it came in,
and its limits. Where a job is not done yet, it says so. API details:
[api](api.md), [reference](reference.md); how worlds combine: [patterns](patterns.md).

Three kinds of worlds are named throughout (see the [glossary](glossary.md#the-three-kinds-of-worlds)): a **world schema**
says what a kind of world is, a **knowledge world** holds facts true for everyone, and a
**live world** is one running instance of a schema in a session, reading knowledge
worlds. Each job below says which kind it works on; what each kind may contain and where
code lives is on [kinds of worlds](kinds-of-worlds.md).

## Describe a world

*In core: `core.type`, `core.slot`; since 0.1.*
*Works on: a world schema (its types and slots).*

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
*Works on: any world: a world schema's rules, a knowledge world's facts, a live world's state.*

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
*Works on: any world; `why` on a live world.*

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
*Works on: a live world.*

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
*Works on: a world schema (`std.schema`) and the live world it runs (`std.acts`).*

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
*Works on: a live world whose state is partly the host's.*

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
*Works on: a live world, filled from knowledge worlds.*

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

*In `std.focus`, `std.dialogue`; since 0.17.*
*Works on: a live world.*

`std.focus` keeps what a dialogue is about after each turn (thing, action, place, world);
a request that leaves out its thing or action is completed from the turn before, and
earlier turns keep theirs. `std.dialogue` (0.47) gives each turn its kind (why, correction, continuation, list,
ellipsis, answer, request) from the host's cue phrases, with `dialogueTurn` and `focusLog`.
**Limits:** a value chosen by std.fill is not a
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

*In `std.relations`, `std.boxes`, `placeFor`, `boxesOf`, `relationsOf`; since 0.16.*
*Works on: a live world.*

`std.relations`: on, in, next to, above, in front of, kept: when the other thing moves,
the place follows; rows; the first; one per place. `std.boxes` has the geometry
functions. `placeFor` (0.62) gives the spot for one thing (next to another, in a region, a default
spot) avoiding overlaps; relation kinds are declared with `std.schema.relation`.
`placeFor` (0.62) gives the spot for one thing (next to another, in a region, a default
spot) avoiding overlaps; relation kinds are declared with `std.schema.relation`.
**Limits:** boxes only; a row assumes equal widths.

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
*Works on: a live world and its views; taught facts join it at the tier `taught`.*

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
*Works on: a world schema (cards, examples, grid, tests); a live world (replies).*

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
*Works on: a live world.*

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
*Works on: world schemas.*

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

*In `createCatalog`, `bundleReader`, `bundleThenRead`, `listOf`, `loadBundles`; since 0.23.*
*Works on: knowledge worlds, loaded into a live world.*

A catalog (an index of worlds with their schemas, dependencies and shards, and a
vocabulary from words to shards) finds what a word needs, reads each shard once through
the host's `read` (a file, `fetch`, a bundle), caches it, and tells it into a world with
the schemas first. `tools/build-bundle.mjs` writes an offline bundle for a list of words
that `bundleReader` reads with the same code. `bundleThenRead` (0.49) answers from a
bundled subset first and the catalog after, with `reachable()`; `listOf` lists loaded
facts of a type; `loadBundles` tells a world's declared bundle once. **Limits:** the lemma of a
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
*Works on: a live world.*

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
*Works on: a live world (its pipeline is a world schema of its own, `std.turn`).*

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

*In `route`, `arbitrate`; since 0.24.*
*Works on: world schemas (which one a request is for).*

`route` scores the worlds of the schemas for a request by their cards, the thing it
names, a dry run, and a signal of the host's own (an encoder's score), best first with
the reasons. `arbitrate` (0.45) gives each world a verdict instead: `own`, `decline` (it has
no use for the kind: the library's rule) or `refuse` (it has the kind but not the act, or
its dry run refuses; only in the exact pass), with a `resolves` hook for ties.
**Limits:** no reading of text: the request comes from the host.

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
*Works on: world schemas and knowledge worlds.*

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

## Read noun phrases with a language's knowledge world

*In `parseText`, `nounPhrase`; since 0.29.*
*Works on: a knowledge world about a language (the grammar); `resolve` then reads a live world.*

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

## Resolve what a phrase refers to

*In `resolve`; since 0.31.*
*Works on: a live world, with a grammar (a knowledge world about a language).*

The things a noun phrase names, and how sure the reading is (`user`, `scene`, `focus`,
`slip`), with each step in `how`. It handles synonyms through `core.word`, modifiers,
names, ordinals, numbers, sets, coordination (a choice is asked), relations, pronouns and
the focus, "the other one", and parts of a set. **Limits:** time phrases wait for an order
in time; the words come from the grammar and `core.word`, so there is no language here.

```js run
const w = new World();
w.tell(`@d x.det text=the  @r x.rule lhs=NP rhs=DET? rhs=MOD* rhs=N
  @t1 std.schema.thing kind=cup colour=red  @t2 std.schema.thing kind=cup colour=blue`);
const opt = { grammar: { types: { rule: 'x.rule' }, classes: { DET: 'x.det' }, lexicon: { cup: { cat: 'N' }, blue: { cat: 'MOD' } } }, cats: { det: 'DET', mod: 'MOD', head: 'N' } };
print(resolve(w, 'the blue cup', opt).ids, resolve(w, 'the cup', opt).which);
```

```output
["t2"] ["t1","t2"]
```

## Fill any key from a catalog

*In `std.know` (`std.know.fill`); since 0.35.*
*Works on: a live world, filled from knowledge worlds.*

One line says which keys a catalog type gives when `make` leaves them out:
`std.know.fill from=<type> match=<key> key=<key> ...`. The value comes at tier `knowledge`
with its source, and a choice at a better tier wins. **Limits:** only on `make`;
`complete` applies what std.fill chose later.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts  @know core.use world=std.know  @home std.schema.world name=home
  @any std.schema.kinds world=home from=k.furniture acts=make  @kf std.know.fill from=k.furniture key=w`);
w.tell('@f k.furniture name=sofa w=200 core.source="shop list"');
print(w.act({ action: 'make', args: { kind: 'sofa' } }).result.filled);
```

```output
[{"key":"w","value":"200","tier":"knowledge","source":"shop list"}]
```

## Say what must be loaded first

*In `std.schema.needs`, `needsOf`, `turn({ load })`; since 0.39.*
*Works on: a live world and the world schemas or views it follows.*

A world or a view says which types it needs loaded before acting. An act there is
refused with the list until they are; `turn` asks the host to load them and dry-runs
again. **Limits:** "loaded" means some wire of the type exists; what to load is the
host's.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts  @home std.schema.world name=home
  @t core.type of=lamp extends=std.schema.thing  @k std.schema.kind of=lamp world=home acts=make
  @n std.schema.needs of=home type=k.furniture`);
print(needsOf(w), w.act({ action: 'make', args: { kind: 'lamp' } }).violations[0].why);
```

```output
[{"of":"home","type":"k.furniture","loaded":false}] needs k.furniture loaded first
```

## Act on a view itself

*In `std.schema.view state=`; since 0.37.*
*Works on: a live world's view.*

A view's own attributes (zoom, the layer shown) live on one thing of a declared kind,
made on first use with its defaults. "Zoom in" names no thing: the view whose state has
the attribute is meant. **Limits:** one state thing per view.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts  @geo std.schema.world name=geo
  @t core.type of=map.state extends=std.schema.thing  @z core.slot of=map.state key=zoom kind=integer min=1 max=10 step=1 default=3
  @k std.schema.kind of=map.state world=geo acts=change  @v std.schema.view name=map state=map.state`);
print(w.act({ action: 'change', args: { attr: 'zoom', by: 1 } }).result.value);
```

```output
4
```

## Ask over attributes and relations

*In `std.acts` (`ask`); since 0.38.*
*Works on: a live world and the knowledge worlds loaded in it.*

`ask` answers with the shape of the answer: a number with its unit, a value, a list, or
yes / no. It takes a thing or a knowledge fact by name, a relation either way round,
"which" and "how many" of a kind. **Limits:** one relation per question; no chains.

```js run
const w = new World();
w.load('@acts core.use world=std.acts');
w.tell('@fr k.country name=france population=68000000people borders=spain  @es k.country name=spain borders=france');
const ask = (args) => w.act({ action: 'ask', args }).result;
print(ask({ thing: 'france', attr: 'population' }).unit, ask({ kind: 'k.country', rel: 'borders', of: 'france' }).names, ask({ thing: 'spain', rel: 'borders', of: 'france' }).answer);
```

```output
people ["spain"] true
```

## Read several knowledge repositories

*In `createCatalogs`; since 0.43.*
*Works on: knowledge worlds from several repositories, loaded into a live world.*

Several catalogs in an order of precedence. Each fact keeps its catalog in its source,
and a thing two catalogs define differently is reported while the first version stays.
**Limits:** a conflict is found by id, or by type and `name`.

```js run
const cat = (name, text) => ({ name, index: { worlds: [{ id: 'k.f', shards: [{ id: 'k.f/s', path: 'k.f/s.sop' }] }] }, vocab: { sofa: ['k.f/s'] }, read: bundleReader({ files: { 'k.f/s.sop': text } }) });
const w = new World();
const r = createCatalogs([cat('one', '@a k.f name=sofa w=200'), cat('two', '@b k.f name=sofa w=210')]).intoSync(w, 'sofa');
print(r.conflicts.length, w.ofType('k.f').map((x) => x.attrs.w[0]));
```

```output
1 ["200"]
```

## Cut a message into clauses

*In `segment`, `actWords`; since 0.46.*
*Works on: a language's knowledge world (its joiners and frame leads) and the live world's acts.*

One segmenter that knows the act forms: a joiner cuts where an act word follows it, lists
and coordinations stay whole, a run of joiners is one, and a comma after a frame lead stays.
Hosts need no clause encoder. **Limits:** "it" in the second clause is resolved later (by
`resolve` and the focus), not here; corrections ("no wait") are `std.dialogue`'s.

```js run
const w = new World();
w.load('@acts core.use world=std.acts  @j g.joiner text=and card_cut=yes  @f g.frame_lead text="from now on"  @k g.joiner text="," card_cut=yes');
print(segment(w, 'from now on, make blue boxes and remove the red one').map((c) => c.text));
```

```output
["from now on, make blue boxes","remove the red one"]
```

## Inflect and analyse the words of any language

*In `morphOf`, `generate`, `analyse`, `fold`, `splitClitics`, `dictionary`, `realise`, `templateFor`; since 0.52.*
*Works on: a language's knowledge world (its paradigm classes, folds and templates) and its external dictionary.*

A language world is compact rules plus a dictionary: paradigm classes (a stem rule and the
endings per feature cell, inheritance with overrides, alternations), irregulars, spelling
folds, clitic joiners and realisation templates. The library generates and analyses forms
with the same declarations (a suffix index, no form lists) and realises a template with
agreement. **Limits:** one suffix per cell (no prefixes or infixes yet); syntax-level
agreement in the parser is still to come; `w.lang.ro` is not published yet, so the
Romanian measurements wait.

```js run
const w = new World();
w.tell('@c m.class name=n1 alt=a>e  @e1 m.ending class=n1 num=sg suffix=_  @e2 m.ending class=n1 num=pl suffix=i alt=yes');
const m = morphOf(w);
print(generate(m, 'bak', 'n1', { num: 'pl' }), analyse(m, 'beki').some((r) => r.lemma === 'bak'));
```

```output
beki true
```

## Change states over time by rules

*In `motionPlan`, `motionRun`, `readMotion`, `planMotionFacts`, `splitText`; since 0.54.*
*Works on: a live world's view (a face, a drawing, a diagram) and the rules a world schema gives it.*

Rules as data: on an event (with a condition on its fields), or repeated idly, a sequence
of steps sets keys of a state for durations. Priorities hold a key, and a new event
cancels the rest of the earlier one. A step can play one state per unit of a stream (the
generic form of lip sync). The plan is pure and seeded; the host plays it. Since 0.56 the
library also reads the knowledge repository's full format (`k.motion`: layers, during,
until, emits, holds until an event, conditions on features, via, splitters as facts). **Limits:** the
steps of one rule run in sequence (no parallel branches inside a rule); durations are
whole milliseconds.

```js run
const w = new World();
w.tell('@b mo.base key=eyes value=open  @r mo.rule name=blink repeat=3000-3000  @s mo.step rule=blink n=1 key=eyes value=closed dur=150');
print(motionPlan(w, [], { until: 7000 }).map((p) => [p.t, p.value]));
```

```output
[[0,"open"],[3000,"closed"],[3150,"open"],[6000,"closed"],[6150,"open"]]
```

## Reach a goal by methods that are knowledge

*In `planner`, `factStore`, `PlanLive`, `readMethods`, `PLAN_LIMITS`; since 0.55.*
*Works on: a knowledge world of methods (`k.procedures`) and a live world.*

Complex and planned actions come from knowledge and orchestration, not from code in live
worlds. A goal ("a person sitting on a swing", "set a table for four") is reached by
the methods of a knowledge world. The planner chooses among alternatives by fit, world,
preconditions and rank. It decomposes steps into further methods, fills roles from the
goal, earlier steps, the live world, history and knowledge, and explains each step in
one line. **Limits:** depth 3, 200 acts. The requests are named by k.actions roles: the
table that maps them onto std.acts arguments (Q44 a) and a one-call apply come next, so
for now the host applies `requests` with that mapping.

```js run
const store = factStore([{ id: 'k.procedures', schemaText: '@s core.slot of=k.procedures.method key=name id=true', shards: [{ text: '@m k.procedures.method name=x about=y act=make' }] }, { id: 'k.actions', schemaText: '', shards: [] }]);
print(planner(store).plan({ act: 'make', roles: { kind: 'cup' } }, new PlanLive({ store })).method);
```

```output
x
```

## Suggest random commands that work

*In `sample`, `diversity`; since 0.59.*
*Works on: a live world, its world schemas and the knowledge they join.*

Randomness as a mechanism, with no example lists: small commands chosen from what the
worlds allow in the current state, with values legal for their slots and kinds from the
catalogs the worlds join. Recency and novelty weigh in, it is seeded, and every
suggestion is checked by a dry run (and, with the host's language world, by reading it
back). **Limits:** `place` is not suggested (it needs a space the host knows); the
sentences come from the host's realiser until the generation templates of Round 30 land.

```js run
const w = new World();
w.load('@acts core.use world=std.acts  @zoo std.schema.world name=zoo  @any std.schema.kinds world=zoo from=k.animal acts=make  @a k.animal name=owl');
print(sample(w, { mode: 'one', seed: 1 }).frames[0].args);
```

```output
{"kind":"owl"}
```

## Summarise a log or a text

*In `actsOf`, `summarizeLog`, `summarizeText`, `overlap`; since 0.61.*
*Works on: a live world's history; any text.*

A history of acts becomes a few frames: acts and kinds counted, siblings generalised up
the chain of kinds, failures kept, the most salient first, for the language world to
render. A text gets an extractive summary by centrality, information and position, with
nothing said twice and every sentence from the source. **Limits:** text summaries are
extractive; regenerating sentences from frames waits for the language worlds'
generation; the reference set is small and written for the tests.

```js run
print(summarizeText('Owls hunt at night. Their eyes are large. An owl can turn its head about 270 degrees. Some owls live in barns.', { n: 1 }).picked);
```

```output
["Owls hunt at night."]
```

## Compose a text from knowledge

*In `compose`, `discourseRealiser`, `discourseTemplates`, `inflectBy`, `articleFor`, `writeDocument`, `readDocument`, `solveChoices`, `readStory`, `storyPlan`, `STORY_RELATIONS`, `interestOf`, `measuresOf`, `shapeShare`, `interestModel`; since 0.64.*
*Works on: knowledge worlds (facts about a topic, genres, interest features).*

A composition with the moves of a genre: an outline from the topic's relations across the
worlds, chosen by interest (the published `k.interest`: appraisals and features over measures computed from facts, each score explained), facts that each cite
their wire and never repeat, and an exact size or a list of what the knowledge lacked.
With the published `k.genres`, the layout follows the genre's parts, steps and register,
and its choice points are solved jointly. A story is planned from `k.story`: its elements
are solved jointly under its constraints over the catalog. **Limits:** measures of words
and sentences (word band, concreteness, words over the register's maximum) come from the
host. The sentences come from the language world's discourse templates when it has them
(the clause of a fact is the host's). A composition is written as a `w.document` live world (`writeDocument`) and read
back in order (`readDocument`). The procedures of `k.procedures` come next. The sentences come from
the host's realiser.

```js run
const w = new World();
w.tell('@owl k.animal name=owl  @f1 k.fact about=owl eggs=4');
print(compose(w, 'owl', { size: { chapters: 1, sections: 1, sentences: 2 } }).chapters[0].sections[0].sentences.map((x) => x.cites));
```

```output
["owl","f1"]
```

## Read a question by the types of its words

*In `readByTypes`, `typedLexicon`, `nearWords`, `normalise`, `alternationsOf`, `storyState`; since 0.72.*
*Works on: any world with facts (names, keys, values) and acts.*

"what sound does a cow make", "a cow makes which sound" and "cow sound?" read to one frame,
the attribute `sound` of the thing `cow`, because the words are typed through the world's
own facts and order only ranks. Inverse questions ("which animal says moo") and acts with
arguments by type are read too.
An unknown word is read as its nearest known word through k.words senses (a synonym,
a kind), with a cost. Variants (passive, "could you", "please", dative shift) are brought
back to the canonical form by the language world's alternation rules, written once. A
question after a word problem's story is answered from the story's quantities
(`storyState`).
**Limits:** a first version. The alternation rules are a toy set until the language world
publishes them; induced rules are the next item (questions.md Q54).

```js run
const w = new World();
w.tell('@cow k.animal name=cow sound=moo  @dog k.animal name=dog sound=woof');
print(readByTypes(w, 'which animal makes woof', { question: ['which'] }).best.answer);
```

```output
["dog"]
```

## Judge a fix on the cousins of its case

*In `cousins`, `ancestorsOf`, `kindChain`, `judgeFix`, `learnRules`, `learnFormOperators`, `formOperator`, `formEdits`, `learnFormEdits`, `familyOf`, `liftTokens`; since 0.73.*
*Works on: worlds with kinds (kind, class, is, is_a) and facts with keys.*

A failing case is expanded into its siblings and cousins (up the kinds, then down to other
members), valid ones only. A fix is then judged on the case and on its cousins by degree,
which measures how general it is. `learnRules` induces reading rules from cases (the
library's `induce`, fillers lifted to their kind) and admits them only on held-out cases
and cousins. `learnFormOperators` extracts the few operators of form (wrappers, fillers,
passive) from aligned pairs and counts how many cover 80 % and 95 % of them. Each is a
cousin generator and a normalisation rule.
**Limits:** the dimensions are fillers and keys. The others (act families, alternations,
world structure kinds) come with the items of Q54. A cousin's wording is the case's text
with the filler replaced, until generation is used.

```js run
const w = new World();
w.tell('@cow k.animal name=cow kind=bovine sound=moo  @yak k.animal name=yak kind=bovine sound=grunt');
const kase = { text: 'cow sound', frame: readByTypes(w, 'cow sound').best };
print(judgeFix((t) => (t === 'cow sound' ? ['moo'] : null), kase, cousins(w, kase)).share);
```

```output
0
```

## Align two worlds by structure

*In `alignWorlds`; since 0.77.*
*Works on: any two world schemas.*

A seating world and a timeline world align: table to day, seat to slot, guest to event.
Types are paired by the shape of their slots and references, not by their names. What one
has and the other lacks (a default, a closed set of choices, a required slot) is offered
with the map, never told.
**Limits:** the offers are defaults, choices and required slots. Rules, procedures and
question forms come next. The pairing is greedy (the best pairs first).

```js run
const a = new World(); a.load('@s core.type of=seat  @s1 core.slot of=seat key=n kind=number default=1');
const b = new World(); b.load('@s core.type of=slot  @s1 core.slot of=slot key=hour kind=number');
print(alignWorlds(a, b).map);
```

```output
{"seat":"slot"}
```

## Building blocks

*In the core exports; since 0.1 (each as listed).*
*Works on: any world.*

The functions and constants the jobs above are made of, for hosts and tools that need
them directly. Each is in [api](api.md) or [reference](reference.md) with its example.

| Export | What it is for | Since |
| --- | --- | --- |
| `parse`, `serialize`, `tokenize`, `quote`, `str`, `readValue`, `writeValue`, `SopError` | read and write SOP Lang text and values (`str`: a value token as plain text) | 0.1 |
| `unify`, `walk`, `PatternIndex` | match patterns against wires | 0.1 |
| `builtins`, `quantity` | the standard function pack; numbers with units | 0.1 |
| `solvers`, `Problem`, `Sat`, `toDimacs`, `toASP` | search: pluggable solvers and exports for outside ones | 0.3 |
| `abduce`, `adopt` | what would have to be true; taking one explanation | 0.4 |
| `induce`, `induceRule`, `induceSlots` | rules and slots from examples | 0.5 |
| `aggregates`, `rank`, `RANKING`, `veto` | aggregates; ranking readings with reasons; vetoes | 0.13 |
| `GRAMMAR`, `MODIFIERS`, `SCHEMA_TYPES` | what each matrix wire type reads (the reference is checked against them) | 0.6 |
| `grammarOf`, `grammarView`, `viewDiff`, `grammarCheck` | the grammar a world holds; the views of a closed class and where two differ; checks of a grammar | 0.29, 0.30, 0.58 |
| `ledgerAppend`, `ledgerGroups`, `ledgerKey`, `stageOf`, `STAGES` | the failure ledger: rows, groups, keys, pipeline stages | 0.25 |
| `needsOf` | the typed needs of a world or view | 0.39 |

```js run
const [w1] = parse('@cup thing size=2kg');
print(serialize([w1]).trim(), quantity('2kg'), STAGES.length > 3);
```

```output
@cup thing size=2kg {"n":2,"unit":"kg"} true
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
