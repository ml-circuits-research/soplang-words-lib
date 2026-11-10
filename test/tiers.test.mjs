import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, adopt } from '../tools/lib-under-test.mjs';

const trip = `
@k1 core.slot of=trip key=transport required=true enum=car enum=train default=car
@k2 core.slot of=trip key=seat required=true enum=window
@k3 core.slot of=trip key=class required=true enum=first enum=second
?t trip transport=?m days=?d
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
    ?r rain place=?p
    @wet wet place=?p
    @rule core.rule when=$r then=$wet
    ?g gauge level=?l
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
  const [why] = w.abduce('?x wet place=lawn');
  assert.ok(adopt(w, why).ok);
  const rain = w.ofType('rain')[0].id, wet = w.ofType('wet')[0].id;
  assert.deepEqual([w.tier(rain), w.tier(wet, 'place'), w.query({ type: 'wet', seek: 'place' }).tier], ['guessed', 'guessed', 'guessed']);
  assert.deepEqual(w.query({ type: 'wet', seek: 'place' }).rests.map((c) => c.id), [rain]);
});
