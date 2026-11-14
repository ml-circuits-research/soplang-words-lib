# Quickstart: a new application in an hour

A small room planner: a world schema, three acts, a knowledge world read by lookup,
replies, and one request handled end to end: by the last step it is a live world (the
three kinds are in the [glossary](glossary.md#the-three-kinds-of-worlds)). Every block on this page runs in CI against the library. A
page about what each job can do is [capabilities](capabilities.md); what a host supplies
is the [host contract](host-contract.md).

## 1. Install and load

Zero dependencies: `npm install sopworld`, or copy `docs/sopworld.mjs` (one file, Node
and browsers). `import { World, turn, createCatalog, bundleReader } from 'sopworld';`

## 2. Describe the world as data

A world that does things is a schema: kinds are types that extend `std.schema.thing`,
attributes are slots, and one wire per kind says which acts apply. Nothing else: the acts
come from `std.acts`.

```js setup
const ROOMS = `
@acts core.use world=std.acts
@know core.use world=std.know
@rooms std.schema.world name=rooms doc="rooms and the furniture in them"
@t.room core.type of=room extends=std.schema.thing closed=true
@s.room.name core.slot of=room key=name required=true
@s.room.area core.slot of=room key=area kind=number min=4 max=60 step=1 default=12
@k.room std.schema.kind of=room world=rooms acts=make acts=change acts=ask
@any std.schema.kinds world=rooms from=k.commonsense.thing acts=make acts=change acts=remove
@lim std.schema.limit of=room max=6
`;
const app = () => { const w = new World(); w.load(ROOMS); return w; };
```

```js run
const w = app();
print(schemaCard(w, 'rooms')[0].kinds.map((k) => [k.kind, k.acts]));
```

```output
[["room",["make","change","ask"]],["*",["make","change","remove"]]]
```

## 3. Three acts

`make`, `change`, `ask` (and the others) work on any schema. Each returns its difference
and is one undo step; a refusal says what is allowed.

```js run
const w = app();
w.act({ action: 'make', args: { kind: 'room', name: 'kitchen' } });
const r = w.act({ action: 'change', args: { thing: 'room', attr: 'area', by: 'more', amount: 4 } });
print(r.diff.changed, w.act({ action: 'ask', args: { thing: 'room', attr: 'area' } }).result.value);
print(w.act({ action: 'change', args: { thing: 'room', attr: 'colour', value: 'red' } }).violations[0].why);
```

```output
[{"id":"room1","key":"area","from":"12","to":"16","toTier":"told"}] 16
a room has no colour
```

## 4. Knowledge by lookup

The furniture comes from a knowledge catalog: the host says how to read a path (a file,
`fetch`, a bundle); the catalog tells the shards a word needs, schemas first. Here a
two-file bundle stands in for sop-knowledge-worlds.

```js run
const files = {
  'k.commonsense/schema.sop': '@k1 core.slot of=k.commonsense.thing key=name id=true\n@k2 core.slot of=k.commonsense.thing key=at many=true\n@k3 core.slot of=k.commonsense.thing key=size',
  'k.commonsense/shards/home.sop': '@sofa k.commonsense.thing name=sofa at=living_room size=large core.source="example"',
};
const index = { worlds: [{ id: 'k.commonsense', schema: 'k.commonsense/schema.sop', shards: [{ id: 'k.commonsense/shards/home', path: 'k.commonsense/shards/home.sop' }] }] };
const cat = createCatalog({ index, vocab: { sofa: ['k.commonsense/shards/home'] }, read: bundleReader({ files }) });
const w = app();
cat.intoSync(w, 'sofa');
const r = w.act({ action: 'make', args: { kind: 'sofa' } });
print(r.result.filled.map((f) => `${f.key}=${f.value} (${f.source})`));
```

```output
["place=living_room (example)","size=large (example)"]
```

## 5. One request end to end, with a reply

The host reads text into candidate readings (its job); `turn` tries them, applies the
first the world takes, and gives the replies; when none fits it falls back to one
question, "not here but there", or a named guess.

```js run
const w = app();
w.act({ action: 'make', args: { kind: 'room', name: 'study' } });
// "make the study bigger": two readings, best first
const t = turn(w, [{ action: 'change', args: { thing: 'study', attr: 'size', by: 'more' } }, { action: 'change', args: { thing: 'room', attr: 'area', by: 'more' } }]);
print(t.status, t.replies, t.dropped[0].violation.why);
print(turn(w, [{ action: 'make', args: { kind: 'spaceship' } }]).question);
```

```output
done ["I changed the area of room study from 12 to 13."] there is no study
Did you mean to make spaceship? (no world here has a spaceship)
```

## 6. Next

- Test the schema: `schemaGrid(world)` runs every world × kind × act case; `gridTests`
  writes a test file from it; `node tools/validate.mjs <files>` in one command.
- Share things between views, teach facts, keep a dialogue's focus, relate things:
  [capabilities](capabilities.md).
- Every standard module: [modules](modules.md). How worlds combine: [patterns](patterns.md).
