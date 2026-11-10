import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, adopt } from '../tools/lib-under-test.mjs';

const trip = `
@k1 core.slot of=trip key=transport required=true enum=car enum=train default=car
@k2 core.slot of=trip key=seat required=true enum=window
@k3 core.slot of=trip key=class required=true enum=first enum=second
@t trip transport=?m days=?d
@c core.calc out=?cost fn=mul args=?d args=40
@b budget of=$t amount=?cost by=?m
@r core.rule when=$t with=$c then=$b
`;

test('tiers: every value knows how it got there, and a derived value is as weak as its weakest input', () => {
  const w = new World();
  w.load(trip);
  w.tell('@t1 trip days=3');
  assert.deepEqual([w.tier('t1', 'days'), w.tier('t1'), w.tier('t1', 'transport'), w.tier('nobody', 'x')], ['told', 'told', undefined, undefined]);
  const done = w.complete({ defaults: true, choose: true });
  assert.deepEqual(done.filled.map((f) => `${f.key}=${f.value} ${f.kind}`).sort(), ['class=first chosen', 'seat=window forced', 'transport=car default']);
  assert.deepEqual(['days', 'seat', 'transport', 'class'].map((k) => w.tier('t1', k)), ['told', 'forced', 'default', 'guessed']);
  // the budget wire was derived from days (told) and transport (a default)
  const b = w.ofType('budget')[0];
  assert.deepEqual([w.tier(b.id, 'amount'), w.tier(b.id, 'by'), w.tier(b.id)], ['default', 'default', 'default']);
  // value-level provenance: the cells a derived wire was read from
  assert.deepEqual(b.meta.cells, [['t1', 'transport'], ['t1', 'days']]);
  const e = w.explain(b.id);
  assert.deepEqual([e.tier, e.from[0].tier, e.from[0].fills.map((f) => `${f.key}:${f.tier}`).sort()], ['default', 'told', ['class:guessed', 'seat:forced', 'transport:default']]);
});

test('tiers: assumptions() lists what is only assumed, weakest first, with what rests on each', () => {
  const w = new World();
  w.load(trip);
  w.tell('@t1 trip days=3');
  assert.deepEqual(w.assumptions(), []);
  w.complete({ defaults: true, choose: true });
  const b = w.ofType('budget')[0].id;
  const list = w.assumptions();
  assert.deepEqual(list.map((a) => `${a.id}.${a.key}=${a.value} ${a.tier}`), ['t1.class=first guessed', 't1.transport=car default', 't1.seat=window forced']);
  assert.deepEqual(list[1].dependants, [{ id: b, key: null }, { id: b, key: 'of' }, { id: b, key: 'amount' }, { id: b, key: 'by' }]);
  // a query says how solid its answer is and what it rests on
  const q = w.query({ type: 'budget', seek: 'amount' });
  assert.deepEqual([q.value, q.tier, q.rests], ['120', 'default', [{ id: 't1', key: 'transport', value: 'car', tier: 'default' }]]);
  assert.deepEqual([w.query({ about: 't1', seek: 'days' }).tier, w.query({ about: 't1', seek: 'days' }).rests], ['told', undefined]);
  // next() points at what a confirmation would be worth most
  assert.deepEqual(w.next().review.map((x) => `${x.key} ${x.tier} ${x.dependants}`), ['class guessed 0', 'transport default 4', 'seat forced 0']);
});

test('tiers: a told value replaces any weaker one, and what followed from it', () => {
  const w = new World();
  w.load(trip);
  w.tell('@t1 trip days=3');
  w.complete({ defaults: true, choose: true });
  const r = w.fill('t1', 'transport', 'train');
  assert.deepEqual([r.ok, r.revised], [true, [{ id: 't1', key: 'transport', value: 'car', tier: 'default' }]]);
  const b = w.ofType('budget')[0];
  assert.deepEqual([b.attrs.by, w.tier(b.id, 'by'), w.tier('t1', 'transport')], [['train'], 'derived', 'told']);
  const g = w.fill('t1', 'class', 'second');
  assert.deepEqual([g.ok, g.revised.map((x) => `${x.key}=${x.value} ${x.tier}`)], [true, ['class=first guessed']]);
  // told against told is still a conflict
  assert.equal(w.fill('t1', 'class', 'first').violations[0].kind, 'conflict');
  // confirming an assumption makes it told
  assert.equal(w.tier('t1', 'seat'), 'forced');
  assert.ok(w.fill('t1', 'seat', 'window').ok);
  // a restored world keeps its tiers
  const again = World.fromJSON(JSON.parse(JSON.stringify(w.toJSON())));
  assert.deepEqual(['days', 'transport', 'class'].map((k) => again.tier('t1', k)), ['told', 'told', 'told']);
});

test('tiers: a host states its own tier, declares its own, and an adopted explanation stays a guess', () => {
  const w = new World();
  w.load(`
    @t_sensor core.tier name=measured below=told cost=2
    @t_rumour core.tier name=rumour below=default cost=9
    @ab core.abducible of=rain
    @r rain place=?p
    @wet wet place=?p
    @rule core.rule when=$r then=$wet
    @g gauge level=?l
    @al alarm for=$g
    @c core.check fn=gt args=?l args=90
    @high core.rule when=$g if=$c then=$al
  `);
  w.tell('@g1 gauge level=95', { tier: 'measured' });
  const alarm = w.ofType('alarm')[0].id;
  assert.deepEqual([w.tier('g1', 'level'), w.tier(alarm), w.assumptions().length], ['measured', 'derived', 0], 'measured is stronger than derived: not an assumption');
  w.tell('@g2 gauge level=99', { tier: 'rumour' });
  assert.deepEqual(w.assumptions().map((a) => `${a.id} ${a.tier} ${a.cost}`), ['g2 rumour 9']);
  assert.equal(w.tier(w.ofType('alarm').find((a) => a.attrs.for[0] === '$g2').id), 'rumour');
  assert.throws(() => w.tell('@g3 gauge level=1', { tier: 'hearsay' }), /unknown tier/);
  // told replaces the rumour
  const r = w.tell('@g2b gauge level=10');
  assert.equal(r.ok, true);
  // abduction: what is adopted is marked as a guess, and what follows from it too
  const [why] = w.abduce('@x wet place=lawn');
  assert.ok(adopt(w, why).ok);
  const rain = w.ofType('rain')[0].id, wet = w.ofType('wet')[0].id;
  assert.deepEqual([w.tier(rain), w.tier(wet, 'place'), w.query({ type: 'wet', seek: 'place' }).tier], ['guessed', 'guessed', 'guessed']);
  assert.deepEqual(w.query({ type: 'wet', seek: 'place' }).rests.map((c) => c.id), [rain]);
});

test('describe: a summary as plain data; diff: what another world changes', () => {
  const w = new World();
  w.load(trip + '@kd core.slot of=trip key=days kind=number max=30 soft=true\n');
  w.tell('@t1 trip days=3  @n1 note about=$t1 text=hello');
  w.complete({ defaults: true });
  const d = w.describe();
  const b = w.ofType('budget')[0].id;
  assert.deepEqual(Object.keys(d), ['types', 'wires', 'open', 'assumed', 'issues', 'changes']);
  assert.deepEqual(d.types, { trip: { count: 1, instances: ['t1'] }, note: { count: 1, instances: ['n1'] }, budget: { count: 1, instances: [b] } });
  assert.deepEqual(d.wires.t1, { type: 'trip', tier: 'told', keys: { days: { value: '3', tier: 'told' }, transport: { value: 'car', tier: 'default' }, seat: { value: 'window', tier: 'forced' } } });
  assert.deepEqual([d.wires[b].tier, d.wires[b].via, d.wires[b].keys.amount], ['default', 'r', { value: '120', tier: 'default' }]);
  assert.deepEqual(d.open.map((o) => `${o.id}.${o.key}`), ['t1.class']);
  assert.deepEqual(d.assumed, [{ id: 't1', key: 'transport', value: 'car', tier: 'default', dependants: 4 }, { id: 't1', key: 'seat', value: 'window', tier: 'forced', dependants: 0 }]);
  assert.deepEqual([d.issues, d.changes.some((e) => e.op === 'fill' && e.via === 'core.default'), d.changes.at(-1).op], [[], true, 'derive']);
  // about a wire, with its neighbours; about a type; only what changed since
  assert.deepEqual(Object.keys(w.describe({ about: 'n1', depth: 0 }).wires), ['n1']);
  assert.deepEqual(Object.keys(w.describe({ about: 'n1' }).wires).sort(), ['n1', 't1']);
  assert.deepEqual(Object.keys(w.describe({ about: 'n1', depth: 2 }).wires).sort(), [b, 'n1', 't1'].sort());
  assert.deepEqual(Object.keys(w.describe({ about: 'budget', depth: 0 }).wires), [b]);
  const seq = w.seq;
  w.tell('@t2 trip days=40 transport=train seat=window class=first');   // over the soft bound: an issue
  const after = w.describe({ since: seq });
  assert.deepEqual(after.issues.map((i) => [i.about, i.key, i.why]), [[['t2'], 'days', 'days must be at most 30']]);
  assert.ok(after.changes.length > 0 && after.changes.every((e) => e.seq > seq));
  assert.deepEqual(Object.keys(after.types).sort(), ['budget', 'note', 'trip'], 'issue wires are listed under issues, not as instances');
  // what changes if we go by train: try it on a fork and compare
  const f = w.fork();
  f.fill('t1', 'transport', 'train');
  f.tell('@n2 note about=$t1 text=booked');
  f.retract('n1');
  const x = w.diff(f);
  assert.equal(x.same, false);
  const notes = (list) => list.filter((e) => e.type === 'note');
  assert.deepEqual([notes(x.added), notes(x.removed)], [[{ id: 'n2', type: 'note', tier: 'told' }], [{ id: 'n1', type: 'note', tier: 'told' }]]);
  // the budget by car is gone and a budget by train is there, no longer resting on a default
  assert.deepEqual([x.removed.filter((e) => e.type === 'budget').map((e) => e.tier), x.added.filter((e) => e.type === 'budget').map((e) => e.tier)], [['default'], ['derived']]);
  assert.deepEqual(x.changed.filter((c) => c.id === 't1'), [{ id: 't1', key: 'transport', from: 'car', fromTier: 'default', to: 'train', toTier: 'told' }]);
  assert.equal(World.diff(w, w.fork()).same, true);
});

test('defaults: a default on an optional key is applied by complete({ defaults }) too, as an assumption', () => {
  const w = new World();
  w.load(`
    @k core.slot of=line key=qty kind=number default=1
    @l line price=?p qty=?q
    @c core.calc out=?t fn=mul args=?p args=?q
    @f line core.on=$l total=?t
    @r core.rule when=$l with=$c then=$f
  `);
  w.tell('@l1 line price=7');
  assert.deepEqual([w.open(), w.get('l1').attrs.total], [[], undefined], 'optional: not a question, and nothing is assumed by tell alone');
  assert.deepEqual(w.next().fills.map((f) => `${f.key}=${f.value} ${f.kind}`), ['qty=1 default']);
  w.complete({ defaults: true });
  assert.deepEqual([w.get('l1').attrs.total, w.tier('l1', 'qty'), w.tier('l1', 'total')], [['7'], 'default', 'default']);
  const r = w.fill('l1', 'qty', 3);
  assert.deepEqual([r.revised.map((x) => x.key), w.get('l1').attrs.total, w.tier('l1', 'total')], [['qty'], ['21'], 'derived']);
});

test('revise: a told value is replaced in one step, with everything that followed from it', () => {
  const w = new World();
  w.load(`
    @l line qty=?q price=?p
    @c core.calc out=?t fn=mul args=?q args=?p
    @f line core.on=$l total=?t
    @r core.rule when=$l with=$c then=$f
    @big line total=?t2
    @over core.check fn=gt args=?t2 args=100
    @cap core.deny when=$big if=$over why="?t2 is over the limit"
  `);
  w.tell('@l1 line qty=1 price=7 note=first');
  assert.equal(w.fill('l1', 'qty', 3).violations[0].kind, 'conflict', 'fill does not replace what was told');
  const r = w.revise('l1', 'qty', 3);
  assert.deepEqual([r.ok, r.revised, w.get('l1').attrs.qty, w.get('l1').attrs.total, w.tier('l1', 'qty')], [true, [{ id: 'l1', key: 'qty', value: '1', tier: 'told' }], ['3'], ['21'], 'told']);
  // several keys at once; refused as a whole when the result is not allowed
  assert.deepEqual(w.revise('l1', { qty: 2, price: 10 }).revised.map((x) => `${x.key}=${x.value}`), ['qty=3', 'price=7']);
  assert.equal(w.get('l1').attrs.total[0], '20');
  const no = w.revise('l1', { qty: 20 });
  assert.deepEqual([no.ok, no.violations[0].why, w.get('l1').attrs.qty, w.get('l1').attrs.total], [false, '200 is over the limit', ['2'], ['20']]);
  assert.equal(w.revise('l1', 'qty', 2).revised, undefined, 'the same value revises nothing');
  assert.equal(w.revise('nobody', 'qty', 1).violations[0].kind, 'unknown-wire');
  // the revision is part of the history
  const again = World.fromJSON(JSON.parse(JSON.stringify(w.toJSON())));
  assert.deepEqual(again.get('l1').attrs, w.get('l1').attrs);
});

test('told(): the facts as stated; telling them again changes nothing, telling them elsewhere gives the same world', () => {
  const matrix = `
    @k1 core.slot of=line key=sku id=true
    @k2 core.slot of=line key=qty kind=number default=1
    @l line qty=?q price=?p
    @c core.calc out=?t fn=mul args=?q args=?p
    @f line core.on=$l total=?t
    @r core.rule when=$l with=$c then=$f
    @x line total=?t2
    @s summary of=$x amount=?t2
    @r2 core.rule when=$x then=$s
  `;
  const w = new World();
  w.load(matrix);
  w.tell('@l1 line sku=a price=7  @l2 line sku=b price=2 qty=5');
  w.complete({ defaults: true });            // qty=1 on l1, by default
  w.fill('l2', 'colour', 'red');             // told later
  w.revise('l2', 'price', 3);                // revised
  w.tell('@n1 note text="keep"');
  w.tell('@gone note text="drop"');
  w.retract('gone');
  assert.deepEqual(w.told(), [
    { id: 'l1', type: 'line', attrs: { sku: ['a'], price: ['7'] } },
    { id: 'l2', type: 'line', attrs: { sku: ['b'], price: ['3'], qty: ['5'], colour: ['red'] } },
    { id: 'n1', type: 'note', attrs: { text: ['"keep"'] } },
  ]);
  assert.deepEqual(w.get('l1').attrs, { sku: ['a'], price: ['7'], qty: ['1'], total: ['7'] }, 'get() shows what the world added');
  // told again here: nothing changes, nothing conflicts
  const before = w.toSOP();
  const r = w.tell(w.told());
  assert.deepEqual([r.ok, r.added, r.filled, w.toSOP()], [true, [], [], before]);
  // told to a fresh world with the same matrix: the same world, once the same defaults are taken
  const fresh = new World();
  fresh.load(matrix);
  assert.ok(fresh.tell(w.told()).ok);
  fresh.complete({ defaults: true });
  // the same wires with the same values (the order of keys and of wires follows the order of telling)
  const content = (x) => [...x.wires.values()].map((v) => `${v.id} ${v.type} ${Object.keys(v.attrs).sort().map((k) => `${k}=${v.attrs[k].join(',')}`).join(' ')}`).sort();
  assert.deepEqual(content(fresh), content(w));
});

test('undo, mark and rewind: taking statements back, and returning to an exact earlier world', () => {
  const w = new World();
  w.load(`
    @k core.slot of=line key=qty kind=number max=10 soft=true
    @l line qty=?q price=?p
    @c core.calc out=?t fn=mul args=?q args=?p
    @f line core.on=$l total=?t
    @r core.rule when=$l with=$c then=$f
  `);
  assert.equal(w.undo().ok, true, 'the matrix was a statement too');
  assert.equal(w.matrix.size, 0);
  assert.deepEqual(w.undo().violations[0].kind, 'nothing-to-undo');
  w.load(`
    @k core.slot of=line key=qty kind=number max=10 soft=true
    @l line qty=?q price=?p
    @c core.calc out=?t fn=mul args=?q args=?p
    @f line core.on=$l total=?t
    @r core.rule when=$l with=$c then=$f
  `);
  w.tell('@l1 line qty=2 price=5');
  const start = w.mark();
  const snapshot = w.toSOP();
  // a soft tell says what it put on record
  const soft = w.tell('@l2 line qty=50 price=1');
  assert.deepEqual([soft.ok, soft.issues.map((i) => [i.about, i.key, i.why])], [true, [[['l2'], 'qty', 'qty must be at most 10']]]);
  w.revise('l1', 'qty', 4);
  w.fill('l1', 'note', 'rush');
  assert.equal(w.get('l1').attrs.total[0], '20');
  // undo the fill; then the revision: the total follows
  const u1 = w.undo();
  assert.deepEqual([u1.ok, u1.undone, w.get('l1').attrs.note], [true, [{ op: 'fill', id: 'l1', key: 'note', value: 'rush' }], undefined]);
  const u2 = w.undo();
  assert.deepEqual([u2.undone[0].op, w.get('l1').attrs.qty, w.get('l1').attrs.total], ['set', ['2'], ['10']]);
  assert.deepEqual(u2.changed.map((c) => `${c.key}:${c.from}->${c.to}`).sort(), ['qty:4->2', 'total:20->10']);
  // undo two at once: the soft wire and its issue go, and the first line
  const u3 = w.undo(2);
  assert.deepEqual([u3.undone.map((e) => e.ids?.[0]), w.has('l1'), w.has('l2'), w.ofType('core.issue').length], [['l2', 'l1'], false, false, 0]);
  // rewind: exactly the marked world, as often as needed, whatever was done in between
  assert.equal(w.rewind(start).ok, true);
  assert.equal(w.toSOP(), snapshot);
  w.tell('@l3 line qty=1 price=1');
  w.retract('l1');
  const back = w.rewind(start);
  assert.deepEqual([back.added, back.removed, w.toSOP()], [['l1'], ['l3'], snapshot]);
  assert.ok(w.tell('@l4 line qty=3 price=3').ok, 'the world goes on from there');
  assert.equal(w.get('l4').attrs.total[0], '9');
  assert.equal(w.history().at(-2).op === 'rewind' || w.history().some((e) => e.op === 'rewind'), true);
  assert.throws(() => w.rewind({}), /needs a mark/);
});
