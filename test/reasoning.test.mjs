import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, format, induceRule, induceSlots, parse } from '../tools/lib-under-test.mjs';
import { garden, meetings } from '../examples/worlds.mjs';

const bodies = (es) => es.map((e) => e.assume.map((h) => format({ ...h, id: 'h' })).sort().join(' & ')).sort();

// ------------------------------------------------------------------ abduction

test('abduction: two alternative explanations through a two-step chain', () => {
  const w = new World();
  w.tell(garden);
  assert.deepEqual(bodies(w.abduce('@g slippery place=lawn')), ['@h rain place=lawn', '@h sprinkler place=lawn']);
  assert.equal(w.wires.size, 0, 'abduction leaves the world untouched');
});

test('abduction: a deny constraint eliminates an explanation', () => {
  const w = new World();
  w.tell(garden);
  w.tell('@now season name=winter');
  assert.deepEqual(bodies(w.abduce('@g wet place=lawn')), ['@h rain place=lawn']);
});

test('abduction: nothing to assume when the goal already holds; nothing found when impossible', () => {
  const w = new World();
  w.tell(garden);
  w.tell('@r1 rain place=lawn');
  assert.deepEqual(w.abduce('@g slippery place=lawn').map((e) => e.assume.length), [0]);
  assert.deepEqual(w.abduce('@g frozen place=lawn'), []);
  assert.deepEqual(w.abduce('@g slippery place=lawn', { maxDepth: 0 }).length, 1);
  assert.deepEqual(w.abduce('@g slippery place=street', { maxDepth: 1 }), [], 'two steps needed');
});

test('abduction: adopting an explanation makes the observation derivable', () => {
  const w = new World();
  w.tell(garden);
  const [e] = w.abduce('@g slippery place=street');
  assert.ok(w.tell(e.assume).ok);
  assert.ok(w.holds('@g slippery place=street'));
});

test('abduction: a conjunction of goals needs a joint explanation', () => {
  const w = new World();
  w.tell(garden);
  const es = w.abduce('@a wet place=lawn  @b wet place=street');
  assert.equal(es.length, 4); // rain or sprinkler, independently for each place
  assert.ok(es.every((e) => e.assume.length === 2));
});

// ------------------------------------------------------------------ induction

const grandparentExamples = [
  { when: '@a parent of=tom child=bob  @b parent of=bob child=ann', then: '@c grandparent of=tom child=ann' },
  { when: '@a parent of=eve child=joe  @b parent of=sue child=eve', then: '@c grandparent of=sue child=joe' },
];

test('induction: co-reference is recovered and wire order does not matter', () => {
  const rule = induceRule(grandparentExamples, { name: 'gp' });
  const [p0, p1, t0, x, r] = parse(rule);
  assert.equal(x.type, 'core.check', 'the two parent patterns must match different wires');
  assert.equal(p0.attrs.child[0], p1.attrs.of[0], 'the middle person is one variable');
  assert.equal(t0.attrs.of[0], p0.attrs.of[0]);
  assert.equal(t0.attrs.child[0], p1.attrs.child[0]);
  assert.equal(r.type, 'core.rule');
});

test('induction then deduction: the learned rule works on unseen facts', () => {
  const w = new World();
  assert.ok(w.tell(induceRule(grandparentExamples, { name: 'gp' })).ok);
  w.tell('@p1 parent of=ion child=maria  @p2 parent of=maria child=vlad  @p3 parent of=vlad child=nicu');
  const got = w.ask('@g grandparent of=?a child=?b').map((x) => `${x.a}>${x.b}`).sort();
  assert.deepEqual(got, ['ion>vlad', 'maria>nicu']);
});

test('induction: constants shared by all examples stay constants; references between wires are kept', () => {
  const rule = induceRule([
    { when: '@o order item=book status=paid  @c customer of=$o tier=gold', then: '@s shipment for=$o speed=express' },
    { when: '@o order item=lamp status=paid  @c customer of=$o tier=gold', then: '@s shipment for=$o speed=express' },
  ], { name: 'ship' });
  assert.match(rule, /@ship_p0 order item=\?v0 status=paid/);
  assert.match(rule, /@ship_p1 customer of=\$ship_p0 tier=gold/);
  assert.match(rule, /@ship_t0 shipment for=\$ship_p0 speed=express/);
  const w = new World();
  w.tell(rule);
  w.tell('@o9 order item=pen status=paid  @c9 customer of=$o9 tier=gold  @o8 order item=cup status=open  @c8 customer of=$o8 tier=gold');
  assert.deepEqual(w.ask('@s shipment for=?o').map((x) => x.o), ['$o9']);
});

test('induction: a learned rule that contradicts the world is refused by it', () => {
  const w = new World();
  w.tell(`
    @s shipment for=?k
    @x order status=open ref=?k
    @d core.deny when=$s when=$x why="never ship an open order"
  `);
  w.tell('@o1 order status=open ref=$o1x  @o1x tag');
  const bad = induceRule([
    { when: '@o order status=open ref=$k  @k tag', then: '@s shipment for=$k' },
    { when: '@o order status=open ref=$j  @j tag', then: '@s shipment for=$j' },
  ], { name: 'bad' });
  const r = w.tell(bad);
  assert.equal(r.ok, false);
  assert.equal(r.violations[0].why, 'never ship an open order');
  assert.equal(w.matrix.has('bad'), false);
});

test('induction: slots from observations', () => {
  const slots = induceSlots(`
    @r1 room capacity=4
    @r2 room capacity=12
    @m1 meeting room=$r1 time=10:00
    @m2 meeting room=$r2 time=14:00
    @m3 meeting room=$r2 time=10:00 title="Budget"
  `);
  assert.match(slots, /of=meeting key=room required=true type=room/);
  assert.match(slots, /of=meeting key=time required=true enum=10:00 enum=14:00/);
  assert.match(slots, /of=meeting key=title$/m);
  assert.ok(new World().tell(slots).ok, 'the output is a valid matrix');
});

test('induction: examples of different shape are rejected', () => {
  assert.throws(() => induceRule([
    { when: '@a parent of=x child=y', then: '@c g of=x' },
    { when: '@a sibling of=x with=y', then: '@c g of=x' },
  ]));
});

// ------------------------------------------------------------------ completion (chat)

function office() {
  const w = new World();
  assert.ok(w.tell(meetings).ok);
  assert.ok(w.tell('@m0 meeting room=$big time=10:00 people=8 duration=60').ok);
  return w;
}

test('completion: open keys are the required slots without a value', () => {
  const w = office();
  w.tell('@m1 meeting people=9');
  assert.deepEqual(w.open('m1').map((o) => o.key), ['room', 'time', 'duration']);
  assert.equal(w.open('m0').length, 0);
});

test('completion: suggestions are filtered by the constraints', () => {
  const w = office();
  w.tell('@m1 meeting people=9');
  assert.deepEqual(w.suggest('m1', 'room').map((c) => c.value), ['$big']);
  // one step ahead both times look fine; with lookahead 10:00 is out, because the only
  // room that fits is taken then
  assert.deepEqual(w.suggest('m1', 'time', { deep: false }).map((c) => c.value).sort(), ['10:00', '14:00']);
  assert.deepEqual(w.suggest('m1', 'time').map((c) => c.value), ['14:00']);
});

test('completion: forced values propagate, defaults are assumptions, rules add wires', () => {
  const w = office();
  w.tell('@m1 meeting people=9');
  const n = w.next();
  assert.deepEqual(n.fills.map((f) => [f.key, f.value, f.kind]), [['room', '$big', 'forced'], ['time', '14:00', 'forced'], ['duration', '30', 'default']]);
  assert.equal(w.get('m1').attrs.room, undefined, 'next() changes nothing');

  const step = w.complete();
  assert.deepEqual(step.filled.map((f) => `${f.key}=${f.value}`), ['room=$big', 'time=14:00']);
  assert.deepEqual(step.pending.map((f) => f.key), ['duration']);
  assert.ok(w.holds('@c confirmation for=$m1'), 'a rule reacted to the completed wire');
  assert.equal(w.explain('m1').fills.find((f) => f.key === 'time').via, 'core.complete');

  w.complete({ defaults: true });
  assert.equal(w.get('m1').attrs.duration[0], '30');
  assert.equal(w.open().length, 0);
});

test('completion: what cannot be decided becomes a question wire with the consistent options', () => {
  const w = office();
  w.tell('@m2 meeting people=3');
  const { questions } = w.complete({ defaults: true });
  // options are ordered by how often the value is already used in the world
  assert.deepEqual(questions.map((q) => format(q)), [
    '@q_m2_room core.question about=$m2 seek=room option=$big option=$small text="Which room?"',
    '@q_m2_time core.question about=$m2 seek=time option=10:00 option=14:00 text="What time?"',
  ]);
  assert.ok(w.fill('m2', 'room', '$small').ok);
  assert.ok(w.fill('m2', 'time', '10:00').ok);
  assert.equal(w.open().length, 0);
});

test('completion: answers that break the world are refused; dead ends are reported', () => {
  const w = office();
  w.tell('@m1 meeting people=9');
  let r = w.fill('m1', 'room', '$small');
  assert.equal(r.ok, false);
  assert.equal(r.violations[0].why, 'room too small');
  r = w.fill('m1', 'time', 'noon');
  assert.equal(r.violations[0].kind, 'domain');
  r = w.tell('@m9 meeting people=2 colour=red');
  assert.equal(r.violations[0].kind, 'unknown-key');

  w.complete();
  w.tell('@m3 meeting people=10 time=14:00');
  assert.deepEqual(w.next().dead.map((d) => `${d.id}.${d.key}`), ['m3.room']);
});

test('completion: a later statement about the same key replaces the completed value, and says so', () => {
  const w = office();
  w.tell('@m1 meeting people=9');
  w.complete();
  const forced = w.get('m1').attrs.time[0];
  assert.equal(w.tier('m1', 'time'), 'forced');
  const r = w.fill('m1', 'time', '10:00');
  assert.equal(r.ok, true, 'what is told is stronger than what was only forced');
  assert.ok(r.revised.some((x) => x.key === 'time' && x.value === forced && x.tier === 'forced'));
  assert.deepEqual([w.get('m1').attrs.time, w.tier('m1', 'time')], [['10:00'], 'told']);
});

// ------------------------------------------------------------------ second iteration

test('lookahead: a value with no joint completion is not offered, and the rest is forced', () => {
  const w = office();
  w.tell('@m1 meeting people=9');
  w.complete(); // big room at 14:00
  w.tell('@m2 meeting people=3');
  // the big room is taken at both times, so it is not an option for m2
  assert.deepEqual(w.suggest('m2', 'room', { deep: false }).map((c) => c.value).sort(), ['$big', '$small']);
  assert.deepEqual(w.suggest('m2', 'room').map((c) => c.value), ['$small']);
  assert.deepEqual(w.complete().filled.map((f) => `${f.key}=${f.value}`), ['room=$small']);
});

test('solve and satisfiable: joint assignment of the open keys, without changing the world', () => {
  const w = office();
  w.tell('@m1 meeting people=9');
  assert.deepEqual(w.solve(), [{ id: 'm1', key: 'room', value: '$big' }, { id: 'm1', key: 'time', value: '14:00' }]);
  assert.equal(w.get('m1').attrs.room, undefined);
  w.complete();
  w.tell('@m3 meeting people=10 time=14:00');
  assert.equal(w.satisfiable(), false);
  assert.equal(w.solve(), null);
});

test('strict mode refuses a statement that leaves no possible completion', () => {
  const w = office();
  w.tell('@m1 meeting people=9');
  w.complete();
  const r = w.tell('@m3 meeting people=10 time=14:00', { strict: true });
  assert.equal(r.ok, false);
  assert.equal(r.violations[0].kind, 'dead-end');
  assert.equal(w.has('m3'), false);
  assert.ok(w.tell('@m3 meeting people=3 time=14:00', { strict: true }).ok);
  const s = new World({ strict: true });
  s.tell(meetings);
  assert.equal(s.tell('@m9 meeting people=50').violations[0].kind, 'dead-end');
});

test('defaults are assumptions: a later statement replaces them and what followed from them', () => {
  const w = new World();
  w.tell(`
    @k1 core.slot of=order key=shipping required=true default=standard
    @o order shipping=?s
    @c core.calc out=?d fn=concat args=?s args=_label
    @l label for=$o kind=?d
    @mk core.rule when=$o with=$c then=$l
  `);
  w.tell('@o1 order item=book');
  w.complete({ defaults: true });
  assert.deepEqual(w.ask('@l label kind=?k').map((x) => x.k), ['standard_label']);

  const r = w.fill('o1', 'shipping', 'express');
  assert.ok(r.ok);
  assert.deepEqual(r.revised, [{ id: 'o1', key: 'shipping', value: 'standard', tier: 'default' }]);
  assert.deepEqual(w.get('o1').attrs.shipping, ['express']);
  assert.deepEqual(w.ask('@l label kind=?k').map((x) => x.k), ['express_label'], 'the old consequence is gone');
  assert.ok(w.history().some((e) => e.op === 'revise'));

  // a value that was told (not assumed) is still protected
  assert.equal(w.fill('o1', 'shipping', 'standard').violations[0].kind, 'conflict');
});

test('defaults give way when a deny involves them', () => {
  const w = new World();
  w.tell(`
    @k1 core.slot of=trip key=transport required=true default=car
    @t trip transport=car
    @s strike on=roads
    @d core.deny when=$t when=$s why="roads are closed"
  `);
  w.tell('@t1 trip to=cluj');
  w.complete({ defaults: true });
  const r = w.tell('@s1 strike on=roads');
  assert.ok(r.ok);
  assert.deepEqual(r.revised, [{ id: 't1', key: 'transport', value: 'car', tier: 'default' }]);
  assert.deepEqual(w.open('t1').map((o) => o.key), ['transport'], 'the key is an open question again');
  assert.deepEqual(w.next().questions.map((q) => q.attrs.seek[0]), ['transport']);
});

test('matrix and facts have separate id spaces', () => {
  const w = new World();
  w.tell('@m1 meeting room=?r\n@c1 check of=$m1\n@r1 core.rule when=$m1 then=$c1');
  const r = w.tell('@m1 meeting room=a  @c1 note text="unrelated"');
  assert.ok(r.ok);
  assert.ok(w.holds('@c check of=$m1'));
  assert.equal(w.tell('@m1 meeting room=?r').violations[0].kind, 'duplicate-id');
});

test('negation must be stratified', () => {
  const w = new World();
  const r = w.tell(`
    @a item name=?n
    @b mark of=$a
    @m mark of=$a
    @loop core.rule when=$a not=$b then=$m
  `);
  assert.equal(r.ok, false);
  assert.match(r.violations[0].why, /not stratified/);
});

test('abduction: explanations are ranked by the cost of what they assume', () => {
  const w = new World();
  w.tell(garden.replace('@ab_rain core.abducible of=rain', '@ab_rain core.abducible of=rain cost=5'));
  const es = w.abduce('@g wet place=lawn');
  assert.deepEqual(es.map((e) => [e.assume[0].type, e.cost]), [['sprinkler', 1], ['rain', 5]]);
});

test('index: joins on a fixed value do not scan the whole type', () => {
  const w = new World();
  w.tell('@p1 parent of=?x child=?y\n?p2 parent of=?y child=?z\n@g grandparent of=?x child=?z\n@gp core.rule when=$p1 when=$p2 then=$g');
  let text = '';
  for (let i = 0; i < 2000; i++) text += `@e${i} parent of=n${i} child=n${i + 1}\n`;
  const t = Date.now();
  assert.ok(w.tell(text).ok);
  assert.equal(w.ofType('grandparent').length, 1999);
  assert.ok(Date.now() - t < 3000, `took ${Date.now() - t} ms`);
});

test('lazy rules: made only when a question, a check or a deny needs them, with the answers of eager rules', () => {
  const M = (lazy) => `
    @k core.slot of=piece key=at id=true
    @p piece at=?a color=?c
    @l line from=?a color=?c
    @r core.rule when=$p then=$l ${lazy ? 'lazy=true' : ''}
    @l2 line from=?a color=?c
    @far reach from=?a color=?c
    @r2 core.rule when=$l2 then=$far ${lazy ? 'lazy=true' : ''}
    @m move to=?a color=?c
    @x reach from=?a color=?o
    @diff core.check fn=neq args=?c args=?o
    @no core.deny when=$m when=$x if=$diff why="?a is attacked"
  `;
  const eager = new World(), lazy = new World();
  eager.load(M(false));
  lazy.load(M(true));
  let seed = 5;
  const r = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 60; i++) {
    const sq = `s${Math.floor(r() * 12)}`, color = r() < 0.5 ? 'white' : 'black';
    const text = r() < 0.5 ? `@p${i} piece at=${sq} color=${color}` : `@m${i} move to=${sq} color=${color}`;
    const a = eager.tell(text), b = lazy.tell(text);
    assert.deepEqual([b.ok, b.violations.map((v) => v.why)], [a.ok, a.violations.map((v) => v.why)], text);
    assert.deepEqual(lazy.ask('@x reach from=?a color=?c').map((x) => `${x.a} ${x.c}`).sort(), eager.ask('@x reach from=?a color=?c').map((x) => `${x.a} ${x.c}`).sort());
  }
  assert.equal(lazy.ofType('line').length + lazy.ofType('reach').length, 0, 'nothing a lazy rule made stays in the world');
  assert.ok(eager.ofType('reach').length > 0);
  const q = lazy.query({ type: 'reach', where: { from: 's1' }, seek: 'color', mode: 'list' });
  assert.deepEqual(q.values?.sort(), eager.query({ type: 'reach', where: { from: 's1' }, seek: 'color', mode: 'list' }).values?.sort());
  // a rule that is not lazy may not read what a lazy one makes
  assert.match(new World().tell('@p piece at=?a\n@l line from=?a\n@r core.rule when=$p then=$l lazy=true\n@l2 line from=?a\n@t tag at=?a\n@e core.rule when=$l2 then=$t').violations[0].why, /a rule that is not lazy cannot/);
});
