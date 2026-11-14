# The kinds of worlds, and where code lives

There are three kinds of worlds, plus the library's modules (the names are defined in the
[glossary](glossary.md#the-three-kinds-of-worlds)). This page says what each kind may
contain, how they combine at run time, and where a piece of code belongs. Every example
runs in CI.

```
  world schemas (w.*)      knowledge worlds (k.*)        session state
  kinds, slots, acts,      facts, constraints,           things made, values,
  limits, rules, words     derivation rules, sources     focus, history
         \                         |                          /
          \__________ loaded into one World object ___________/
                                   |
                              LIVE WORLD  <-- turn(world, readings): read -> dry run
                                   |          (a fork) -> apply (one sentence) -> reply
                                 views          effects connect the application's tools
```

## 1. World schema

A world schema says what a kind of world is. It may contain:
- kinds of things (`core.type ... extends=std.schema.thing`) and their attributes: slots
  with value types, ranges, steps, defaults and the question to ask when one is open;
- slot groups (several `extends`), `excludes=` pairs and joins to another world
  (`type=T by=name`);
- count limits (`std.schema.limit`) and capacities (`std.schema.capacity`);
- which acts apply to which kind (`std.schema.kind ... acts=`), the aspects and views;
- rules and denies, and the words for all of it (`core.word`).

It names the functions it uses and does not contain them. Pure functions come from the
standard pack (`builtins`: arithmetic, comparisons, boxes, dates and the rest; listed in the
[reference](reference.md)). Effects are implemented by the application and declared in
the schema (`std.schema.effect of= act= action=`). A world schema holds no particular
things and no code.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts
@plan std.schema.world name=plan doc="an example: boxes on shelves"
@t.shelf core.type of=shelf extends=std.schema.thing closed=true
@s.shelf.slots core.slot of=shelf key=slots kind=integer min=1 max=6 default=3
@t.box core.type of=box extends=std.schema.thing closed=true
@s.box.name core.slot of=box key=name required=true ask="What is the box called?"
@s.box.on core.slot of=box key=on type=shelf
@k.shelf std.schema.kind of=shelf world=plan acts=make acts=change
@k.box std.schema.kind of=box world=plan acts=make acts=place acts=remove
@cap std.schema.capacity of=shelf key=slots holds=box via=on
@w.box core.word text=crate means=box`);
print(w.ofType('std.schema.kind').map((k) => [k.attrs.of[0], k.attrs.acts]));
```

```output
[["shelf",["make","change"]],["box",["make","place","remove"]]]
```

## 2. Knowledge world

A knowledge world holds facts about the world at large, true for everyone. It may contain:
- facts (`k.animal name=fish lives=water`);
- constraints (slots, `excludes`, joins);
- rules that derive more facts: habitat to usual place, carried things go with their
  carrier, "is a kind of" chains;
- the provenance of every fact (`core.source`), including facts labelled by a model.

It has no session state and no code. When a rule needs a computation the pack lacks, ask
for a function in the library (a general one goes into the standard pack); do not embed
code in the world.

```js run
const w = new World();
w.tell(`@k1 core.slot of=k.animal key=name id=true
@fish k.animal name=fish lives=water core.source="example"
@trout k.animal name=trout is_a=fish core.source="example"
@p1 k.animal name=?x is_a=?y
@p2 k.animal name=?y lives=?h
@t k.animal core.on=$p1 lives=?h
@inherit core.rule when=$p1 when=$p2 then=$t`);
print(w.get('trout').attrs.lives, w.tier('trout', 'lives'));
```

```output
["water"] derived
```

## 3. Live world

A live world is an instance of world schemas in a session. It holds the state (the
things made and their values), the focus, the history and undo, and the views that show
it. It inherits the constraints and rules of its schemas and reads knowledge worlds by
lookup (`createCatalog`, `createCatalogs`, `std.know.fill`, `std.schema.needs`). The
application's tools (renderers, engines, editors) are attached through effects.

The library keeps state and view consistent. Every act returns the difference it made to
the state (`diff`), which is what the view re-renders, and an effect's difference comes
back in `diff.effects`. What is rendered is the state, never something kept beside it.

```js run
const w = new World();
w.load(`@acts core.use world=std.acts  @desk std.schema.world name=desk
@t core.type of=note extends=std.schema.thing closed=true  @s core.slot of=note key=text
@k std.schema.kind of=note world=desk acts=make acts=change acts=remove`);
const made = w.act({ action: 'make', args: { kind: 'note', text: 'buy milk' } });
const changed = w.act({ action: 'change', args: { thing: 'note1', attr: 'text', value: 'buy bread' } });
w.act({ action: 'undo', args: {} });
print(made.diff.added.map((a) => a.id), changed.diff.changed.map((c) => [c.key, c.to]), w.get('note1').attrs.text);
```

```output
["note1"] [["text","buy bread"]] ["\"buy milk\""]
```

## 4. Library modules

The `std.*` modules are mechanisms, not worlds. Each serves one kind:

| Module | Serves |
| --- | --- |
| `std.schema` | writing a world schema |
| `std.know`, `createCatalog`, `createCatalogs` | reading knowledge worlds into a live world |
| `std.acts`, `std.fill`, `std.focus`, `std.relations`, `std.turn` (`turn`, `turnFlow`) | running a live world |
| the grammar reader (`grammarOf`, `parseText`, `nounPhrase`), `resolve` | reading a language's knowledge world, then a live world |
| `std.numbers`, `std.order`, `std.boxes`, `builtins` | pure functions any world names |

## 5. Where code lives

World schemas and knowledge worlds stay SOP Lang only, so any application can reuse them.
A general function goes into the library's standard pack. A specific tool stays in the
application and is connected through a declared effect. Three examples:

| A need | Where it ends up |
| --- | --- |
| "two boxes must not overlap" | the pack already has `overlaps`; the world schema writes a deny that names it |
| "the median of the scores" | a general computation: `median` in `std.numbers`, named by any world |
| "draw the face on the canvas" | the application's renderer, connected by `std.schema.effect of=face act=change action=draw` |

```js run
const w = new World();
w.register('action', 'draw', (ctx, args, at) => ({ diff: { drawn: at.thing }, undo: () => {} }));
w.load(`@acts core.use world=std.acts  @f std.schema.world name=face
@t core.type of=eye extends=std.schema.thing closed=true  @s core.slot of=eye key=colour
@k std.schema.kind of=eye world=face acts=make acts=change
@e std.schema.effect of=eye act=change action=draw`);
w.act({ action: 'make', args: { kind: 'eye' } });
print(w.act({ action: 'change', args: { thing: 'eye1', attr: 'colour', value: 'green' } }).diff.effects);
```

```output
[{"drawn":"eye1"}]
```
