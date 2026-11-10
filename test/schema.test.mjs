import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, format } from '../tools/lib-under-test.mjs';
import { notation, packages } from '../examples/schema.mjs';

const world = (extra = '') => {
  const w = new World({ library: packages });
  w.load(notation);
  w.load(packages.fleet + extra); // needs `base`, loaded from the library
  return w;
};

// ------------------------------------------------------------------ type hierarchy

test('types: extends gives a hierarchy; ofType and patterns include descendants', () => {
  const w = world();
  w.load('@c1 fleet.car plate="B-01" seats=5  @t1 fleet.truck plate="B-02" seats=2 axles=3  @v1 fleet.vehicle plate="B-03" seats=1');
  assert.deepEqual(w.ofType('fleet.car').map((x) => x.id), ['c1']);
  assert.deepEqual(w.ofType('fleet.vehicle').map((x) => x.id).sort(), ['c1', 't1', 'v1']);
  assert.deepEqual(w.ask('?v fleet.vehicle plate=?p').map((x) => x.p).sort(), ['"B-01"', '"B-02"', '"B-03"']);
  assert.deepEqual(w.ask('?v fleet.truck plate=?p').map((x) => x.p), ['"B-02"']);
  assert.deepEqual(w.schema('fleet.truck').lineage, ['fleet.truck', 'fleet.vehicle']);
});

test('types: rules and denies written for a type apply to the types that extend it', () => {
  const w = world(`
    ?v fleet.vehicle seats=?n
    @t core.check fn=gt args=?n args=7
    @bus licence.needed for=$v class=D
    @big core.rule when=$v if=$t then=$bus

    ?x fleet.vehicle seats=?m
    @t0 core.check fn=lt args=?m args=1
    @no_seats core.deny when=$x if=$t0 why="a vehicle has at least one seat"
  `);
  w.load('@t1 fleet.truck plate="B-02" seats=9');
  assert.ok(w.holds('?l licence.needed for=$t1'), 'the rule for vehicles fired for a truck');
  assert.equal(w.tell('@c9 fleet.car plate="B-09" seats=0').violations[0].why, 'a vehicle has at least one seat');
});

test('types: a hierarchy told after the facts re-indexes them; a refused change restores the indexes; cycles are refused', () => {
  const w = new World();
  w.load('@p1 pet.dog name=rex  @p2 pet.cat name=tom');
  assert.equal(w.ofType('pet.animal').length, 0);
  const bad = w.tell('@pet.dog core.type extends=pet.animal\n@pet.cat core.type extends=pet.animal\n@x pet.dog owner=$nobody');
  assert.equal(bad.ok, false);
  assert.equal(w.ofType('pet.animal').length, 0, 'the refused hierarchy left no trace');
  assert.deepEqual(w.ask('?d pet.dog name=?n').map((x) => x.n), ['rex']);
  w.load('@pet.dog core.type extends=pet.animal\n@pet.cat core.type extends=pet.animal');
  assert.deepEqual(w.ask('?a pet.animal name=?n').map((x) => x.n).sort(), ['rex', 'tom']);
  w.retract('p1');
  assert.deepEqual(w.ask('?a pet.animal name=?n').map((x) => x.n), ['tom']);
  assert.equal(new World().tell('@a core.type extends=b\n@b core.type extends=a').violations[0].kind, 'schema');
});

test('types: slots and identity keys are inherited, the nearest declaration winning', () => {
  const w = new World();
  w.load(`
    @vehicle core.type
    @car core.type extends=vehicle
    @k1 core.slot of=vehicle key=plate id=true
    @k2 core.slot of=vehicle key=wheels default=4 required=true
    @k3 core.slot of=car key=wheels default=4 required=true enum=3 enum=4
  `);
  w.load('@c1 car plate=B01  @v1 vehicle plate=B02');
  assert.equal(w.tell('@c2 car plate=B01 colour=red').merged[0].into, 'c1', 'identity declared on vehicle holds for cars');
  assert.equal(w.fill('c1', 'wheels', '6').violations[0].kind, 'domain', 'the car declaration of wheels wins');
  assert.ok(w.fill('v1', 'wheels', '6').ok);
});

// ------------------------------------------------------------------ slots in another notation

test('schema map: foreign key declarations become slots; required keys are questions', () => {
  const w = world();
  w.load('@c1 fleet.car plate="B-01"');
  assert.deepEqual(w.open('c1'), [{ id: 'c1', type: 'fleet.car', key: 'seats', ask: 'How many seats?' }]);
  const q = w.next().questions[0];
  assert.equal(format(q), '@q_c1_seats core.question about=$c1 seek=seats text="How many seats?"');
  assert.ok(w.answer(q, 5).ok);
  assert.equal(w.open().length, 0);
});

test('schema map: literal kinds and reference types are checked; a many-valued key takes several values', () => {
  const w = world();
  w.load('@d1 base.driver name="Ana" licence=B  @rock stone');
  assert.ok(w.tell('@c1 fleet.car plate="B-01" seats=5 driver=$d1 load=450kg tag=red tag=fast electric=true').ok,
    'a driver is a person; 450kg is a quantity; two tags');
  const why = (text) => w.tell(text).violations.map((v) => `${v.key}: ${v.why || v.kind}`);
  assert.deepEqual(why('@c2 fleet.car plate="B-02" seats=five'), ['seats: must be integer']);
  assert.deepEqual(why('@c2 fleet.car plate="B-02" seats=2.5'), ['seats: must be integer']);
  assert.deepEqual(why('@c2 fleet.car plate="B-02" seats=4 driver=$rock'), ['driver: must refer to a base.person wire']);
  assert.deepEqual(why('@c2 fleet.car plate="B-02" seats=4 driver=ana'), ['driver: must refer to a base.person wire']);
  assert.deepEqual(why('@c2 fleet.car plate="B-02" seats=4 load=heavy'), ['load: must be quantity.mass']);
  assert.deepEqual(why('@c2 fleet.car plate="B-02" seats=4 electric=yes'), ['electric: must be boolean']);
  assert.deepEqual(why('@c2 fleet.car plate="B-02" seats=4 seats=5'), ['seats: cardinality']);
  assert.deepEqual(why('@c2 fleet.car plate="B-02" seats=4 colour=red'), ['colour: unknown-key']);
});

test('slots: kind= is a native slot attribute too', () => {
  const w = new World();
  w.load('@k1 core.slot of=box key=items kind=integer min=0\n@k2 core.slot of=box key=ref kind=atom type=box');
  assert.ok(w.tell('@b1 box items=3 ref=none').ok);
  assert.ok(w.tell('@b2 box items=0 ref=$b1').ok, 'an atom or a reference to a box');
  assert.equal(w.tell('@b3 box items=many').violations[0].kind, 'domain');
  assert.equal(w.tell('@b3 box items=-1').violations[0].why, 'must be at least 0');
  assert.equal(w.tell('@b3 box items=1 ref="quoted"').violations[0].why, 'must be atom or a box wire');
});

test('schema: attributes the engine does not use are kept and readable; inherited keys are marked', () => {
  const w = world();
  const s = w.schema('fleet.vehicle');
  assert.equal(s.extends, null);
  assert.equal(s.closed, true);
  assert.equal(s.note, '"Anything with a plate"');
  assert.deepEqual(
    { is: s.keys.seats.is, audited: s.keys.seats.audited, prompt: s.keys.seats.prompt, required: s.keys.seats.required },
    { is: 'integer', audited: 'true', prompt: '"How many seats?"', required: true },
  );
  assert.equal(s.keys.plate.example, '"B-01-XYZ"');
  const truck = w.schema('fleet.truck');
  assert.deepEqual(Object.keys(truck.keys).sort(), ['axles', 'driver', 'electric', 'load', 'plate', 'seats', 'tag']);
  assert.equal(truck.keys.plate.inherited, true);
  assert.equal(truck.keys.axles.inherited, false);
  assert.equal(w.schema('no.such.type'), null);
  assert.deepEqual(s.unknownKinds, []);
  w.load('@fleet.vehicle.colour field is=colour is=integr');
  assert.deepEqual(w.schema('fleet.car').unknownKinds, [{ key: 'colour', kind: 'colour' }, { key: 'colour', kind: 'integr' }], 'a typo in a kind is visible');
});

test('keys: short and qualified names are one key, in facts, fills, patterns and queries', () => {
  const w = world(`
    ?v fleet.vehicle fleet.vehicle.seats=?n
    @t core.check fn=gt args=?n args=60
    @too_many core.deny when=$v if=$t why="no vehicle has that many seats"
  `);
  w.load('@d1 base.driver base.person.name="Ana"');
  assert.equal(w.get('d1').attrs.name[0], '"Ana"', 'a key of an ancestor, written in full');
  w.load('@c1 fleet.car plate="B-01" fleet.vehicle.seats=5');
  assert.equal(format(w.get('c1')), '@c1 fleet.car plate="B-01" seats=5');
  assert.deepEqual(w.ask('?v fleet.car fleet.vehicle.seats=?n').map((x) => x.n), ['5']);
  assert.deepEqual(w.ask('?v fleet.car seats=?n').map((x) => x.n), ['5']);
  w.load('@c2 fleet.car plate="B-02"');
  assert.equal(w.fill('c2', 'fleet.vehicle.seats', '99').violations[0].why, 'no vehicle has that many seats');
  assert.ok(w.fill('c2', 'fleet.vehicle.seats', '4').ok);
  assert.equal(w.get('c2').attrs.seats[0], '4');
  assert.equal(w.tell('@c3 fleet.car plate="B-03" seats=1 fleet.vehicle.seats=2').violations[0].kind, 'cardinality');
});

test('keys: an open namespace is always allowed and not validated unless a slot declares it', () => {
  const w = world('@ns core.namespace prefix=audit. open=true');
  const r = w.tell('@c1 fleet.car plate="B-01" seats=5 core.seq=1 core.source="import" audit.by=ana');
  assert.ok(r.ok, 'the type is closed; core.* and audit.* keys still pass');
  assert.equal(w.get('c1').attrs['audit.by'][0], 'ana');
  assert.ok(w.tell('@c9 fleet.car plate="B-09" seats=5 core.source=$import.batch7 audit.by=$staff.ana').ok,
    'bookkeeping keys may point outside the world');
  assert.equal(w.tell('@c8 fleet.car plate="B-08" seats=5 driver=$staff.ana').violations[0].kind, 'domain', 'ordinary keys may not');
  w.load('@note1 remark core.source=$c9');
  w.retract('c9');
  assert.ok(w.has('note1'), 'a bookkeeping reference does not tie a wire to the one it mentions');
  assert.equal(w.tell('@c2 fleet.car plate="B-02" seats=5 other.by=ana').violations[0].kind, 'unknown-key');
  w.load('@k core.slot of=fleet.vehicle key=core.seq min=1');
  assert.equal(w.tell('@c3 fleet.car plate="B-03" seats=5 core.seq=0').violations[0].why, 'must be at least 1');
});

test('schema map: native slots and mapped ones mix on one type', () => {
  const w = world('@k_site core.slot of=fleet.vehicle key=site enum=north enum=south default=north required=true');
  w.load('@c1 fleet.car plate="B-01" seats=5');
  assert.deepEqual(w.complete({ defaults: true }).filled.map((f) => `${f.key}=${f.value}`), ['site=north']);
  assert.equal(w.tell('@c2 fleet.car plate="B-02" seats=5 site=moon').violations[0].kind, 'domain');
});

test('schema map: a type declared in another notation, with a default parent', () => {
  const w = new World();
  w.load(`
    @m core.schema.map from=class as=type name=id extends=parent closed=sealed:yes root=object
    @shape class
    @circle class parent=shape sealed=yes
    @k core.slot of=circle key=radius kind=number
  `);
  assert.deepEqual(w.schema('circle').lineage, ['circle', 'shape', 'object']);
  w.load('@c1 circle radius=2.5');
  assert.deepEqual(w.ofType('object').map((x) => x.id), ['c1']);
  assert.equal(w.tell('@c2 circle colour=red').violations[0].kind, 'unknown-key');
});

// ------------------------------------------------------------------ modules

test('modules: a module that declares its imports loads them from the library, ids unchanged', () => {
  const w = new World({ library: packages });
  w.load(notation);
  assert.ok(w.load(packages.fleet).ok);
  assert.ok(w.schema('base.driver'), 'the imported module is loaded, its ids are not prefixed');
  assert.deepEqual([...w._compiled().modules.keys()].sort(), ['base', 'fleet']);
  assert.ok(World.fromJSON(JSON.parse(JSON.stringify(w)), { library: packages }).schema('base.driver'));

  const inOrder = new World(); // told in dependency order, no library needed
  inOrder.load(notation); inOrder.load(packages.base); inOrder.load(packages.fleet);
  assert.ok(inOrder.schema('fleet.truck'));

  const missing = new World();
  missing.load(notation);
  const bad = missing.tell(packages.fleet);
  assert.equal(bad.ok, false);
  assert.match(bad.violations[0].why, /module fleet imports base, which is neither loaded nor in the library/);
});

test('modules: core.use prefix=false loads a module whose ids are already qualified', () => {
  const w = new World({ library: { ...packages, notation } });
  w.load('@u0 core.use world=notation prefix=false  @u1 core.use world=base prefix=false');
  assert.ok(w.matrix.has('base.person.name') && !w.matrix.has('base.base.person.name'));
  w.load('@d1 base.driver name="Ana"');
  assert.equal(w.open().length, 0);
  assert.equal(w.schema('base.driver').keys.name.inherited, true);
});

test('numbers: under a key declared integer or number, 5 and 5.0 are one value', () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=item key=sku id=true kind=integer
    @k2 core.slot of=item key=price kind=number
    @k3 core.slot of=item key=size kind=number many=true
    @k4 core.slot of=item key=label
    @k5 core.slot of=item key=grade kind=integer enum=1 enum=2 enum=3
    ?i item price=5
    @c cheap of=$i
    @r core.rule when=$i then=$c
    ?a item price=?p
    ?b offer price=?p
    @m match item=$a offer=$b
    @j core.rule when=$a when=$b then=$m
  `);
  w.load('@a item sku=7 price=5.0 label=1.0 size=2.50 grade=02  @b item sku=8 price=5  @c1 item sku=9 price=6');
  assert.equal(w.get('a').attrs.price[0], '5.0', 'the value stays as it was told');
  // a pattern with a constant, either spelling
  assert.deepEqual(w.ask('?x item price=5').map((r) => r.x).sort(), ['a', 'b']);
  assert.deepEqual(w.ask('?x item price=5.00').map((r) => r.x).sort(), ['a', 'b']);
  assert.deepEqual(w.ask('?x item price=05').map((r) => r.x).sort(), ['a', 'b']);
  assert.deepEqual(w.ask('?x item price=6.0').map((r) => r.x), ['c1']);
  assert.deepEqual(w.ask('?x item size=2.5').map((r) => r.x), ['a'], 'a key with many values');
  assert.equal(w.ask('?x item sku=7 price=?p')[0].p, '5.0', 'a variable gets the value as told');
  // rules: a constant in the pattern, and a join through a variable
  assert.deepEqual(w.ofType('cheap').map((x) => x.attrs.of[0]).sort(), ['$a', '$b']);
  w.load('@o1 offer price=5.000  @o2 offer price=6');
  assert.deepEqual(w.ofType('match').map((x) => `${x.attrs.item[0]} ${x.attrs.offer[0]}`).sort(), ['$a $o1', '$b $o1', '$c1 $o2']);
  // identity, repetition and conflict go by the value
  assert.deepEqual(w.tell('@again item sku=7.0 label=1.0').merged, [{ id: 'again', into: 'a' }], 'the same identity');
  assert.equal(w.tell('@again2 item sku=07 price=5').ok, true, 'the same price is not a conflict');
  assert.equal(w.get('a').attrs.price.length, 1);
  assert.equal(w.tell('@again3 item sku=7 price=5.5').violations[0].kind, 'conflict');
  assert.equal(w.tell('@again4 item sku=7 size=2.5').ok, true);
  assert.deepEqual(w.get('a').attrs.size, ['2.50'], 'no second spelling of a value it has');
  // a key that is not declared as a number stays text
  assert.deepEqual(w.ask('?x item label=1').length, 0);
  assert.deepEqual(w.ask('?x item label=1.0').map((r) => r.x), ['a']);
  // retraction takes the wire out of the index under the same spelling
  assert.ok(w.retract('b').ok);
  assert.deepEqual(w.ask('?x item price=5.0').map((r) => r.x), ['a']);
});

test('numbers: declaring the kind later re-indexes what is there; subtypes', () => {
  const w = new World();
  w.load('@t1 tank level=10.0  @t2 tank level=10  @p1 pressure_tank level=10.50');
  assert.deepEqual(w.ask('?x tank level=10').map((r) => r.x), ['t2'], 'no declaration: text');
  w.load('@pt core.type of=pressure_tank extends=tank  @k core.slot of=tank key=level kind=number');
  assert.deepEqual(w.ask('?x tank level=10').map((r) => r.x).sort(), ['t1', 't2']);
  assert.deepEqual(w.ask('?x tank level=10.5').map((r) => r.x), ['p1'], 'an inherited slot');
  assert.deepEqual(w.ask('?x pressure_tank level=10.500').map((r) => r.x), ['p1']);
  // a refused change that would have declared another key leaves the index as it was
  const before = JSON.stringify(w.toJSON());
  assert.equal(w.tell('@k9 core.slot of=tank key=name kind=number  @t3 tank name=x level=10').ok, false);
  assert.equal(JSON.stringify(w.toJSON()), before);
  assert.deepEqual(w.ask('?x tank level=10.0').map((r) => r.x).sort(), ['t1', 't2']);
  const f = w.fork();
  f.load('@t4 tank level=010');
  assert.deepEqual([f.ask('?x tank level=10').length, w.ask('?x tank level=10').length], [3, 2]);
});

test('composition: two different declarations of one key are a conflict unless one says how they combine', () => {
  const a = '@k1 core.slot of=t key=color enum=red enum=blue';
  const refused = new World().tell(`${a}\n@k2 core.slot of=t key=color enum=blue enum=green`);
  assert.equal(refused.ok, false);
  assert.match(refused.violations[0].why, /k2: t\.color is already declared by k1 with different content/);
  // the same declaration twice is one declaration
  const same = new World();
  same.load(`${a}\n@k1b core.slot of=t key=color enum=red enum=blue`);
  assert.deepEqual([same.tell('@x t color=red').ok, same.tell('@y t color=green').ok], [true, false]);
  // intersect: what both allow
  const both = new World();
  both.load(`${a}\n@k2 core.slot of=t key=color enum=blue enum=green combine=intersect\n@n1 core.slot of=t key=size kind=number min=0 max=10\n@n2 core.slot of=t key=size kind=number min=5 max=20 combine=intersect`);
  assert.deepEqual(['red', 'blue', 'green'].map((v) => both.tell(`@c_${v} t color=${v}`).ok), [false, true, false]);
  assert.deepEqual([3, 7, 12].map((v) => both.tell(`@s_${v} t size=${v}`).ok), [false, true, false]);
  assert.deepEqual(both.schema('t').keys.color.combined, { how: 'intersect', from: ['k1', 'k2'] });
  // an empty intersection is itself refused
  assert.match(new World().tell(`${a}\n@k2 core.slot of=t key=color enum=green combine=intersect`).violations[0].why, /allows no value/);
  // override: an explicit replacement, recorded
  const over = new World();
  over.load(`${a}\n@k2 core.slot of=t key=color enum=green combine=override`);
  assert.deepEqual([over.tell('@x t color=red').ok, over.tell('@y t color=green').ok], [false, true]);
  assert.deepEqual(over.schema('t').keys.color.combined, { how: 'override', from: ['k1', 'k2'] });
  // a subtype that declares an inherited key again is the nearest declaration, as before
  const sub = new World();
  sub.load(`${a}\n@ty core.type of=u extends=t\n@k3 core.slot of=u key=color enum=green`);
  assert.deepEqual([sub.tell('@x u color=green').ok, sub.tell('@y t color=green').ok], [true, false]);
  // loaded as two modules, the same rule applies
  const lib = new World({ library: { one: a, two: '@k2 core.slot of=t key=color enum=green' } });
  assert.ok(lib.use('one').ok);
  assert.equal(lib.use('two').ok, false);
  // types and schema maps
  assert.match(new World().tell('@a core.type of=car extends=vehicle\n@b core.type of=car extends=toy').violations[0].why, /already declared by a with another parent/);
  assert.match(new World().tell('@m1 core.schema.map from=field key=name\n@m2 core.schema.map from=field key=label').violations[0].why, /already mapped differently by m1/);
});
