import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, format } from '../tools/lib-under-test.mjs';
import { warehouse, fns } from '../examples/warehouse.mjs';

const world = (options = {}) => {
  const w = new World({ fns, ...options });
  w.load(warehouse);
  w.load('@i1 item name=bolt shelf=$s1 stock=40 price=0.5  @i2 item name=nut shelf=$s1 stock=15  @i3 item name=gear');
  return w;
};

test('query: one value is supported, with the wires it came from', () => {
  const w = world();
  const r = w.query({ type: 'item', seek: 'stock', where: { name: 'bolt' } });
  assert.deepEqual([r.status, r.value, r.from, r.wires], ['supported', '40', ['i1'], ['i1']]);
  assert.equal(w.query({ about: 'i2', seek: 'stock' }).value, '15');
  assert.equal(w.query({ about: '$i2', seek: 'item.stock' }).value, '15', 'a reference and a qualified key work too');
});

test('query: no value is missing, and names the open key with its question', () => {
  const w = world();
  const r = w.query({ type: 'item', seek: 'stock', where: { name: 'gear' } });
  assert.equal(r.status, 'missing');
  assert.deepEqual(r.missing, [{ id: 'i3', type: 'item', key: 'stock', ask: 'How many are in stock?' }]);
  const none = w.query({ type: 'item', seek: 'stock', where: { name: 'spring' } });
  assert.deepEqual([none.status, none.missing, none.wires], ['missing', [{ type: 'item', key: 'stock', ask: 'How many are in stock?' }], []]);
});

test('query: several distinct values are conflicting, with the alternatives; mode=list returns them all', () => {
  const w = world();
  const r = w.query({ type: 'item', seek: 'stock', where: { shelf: '$s1' } });
  assert.equal(r.status, 'conflicting');
  assert.deepEqual(r.alternatives, [{ value: '40', from: ['i1'] }, { value: '15', from: ['i2'] }]);
  const l = w.query({ type: 'item', seek: 'name', where: { shelf: '$s1' }, mode: 'list' });
  assert.deepEqual([l.status, l.values], ['supported', ['bolt', 'nut']]);
  assert.deepEqual(w.query({ type: 'item', seek: 'name', where: { shelf: '$s2' }, mode: 'list' }).status, 'missing');
});

test('query: count and exists; "no" needs a type whose instances are all known', () => {
  const w = world();
  assert.equal(w.query({ type: 'item', where: { shelf: '$s1' }, mode: 'count' }).value, '2');
  assert.equal(w.query({ type: 'item', seek: 'stock', mode: 'count' }).value, '2', 'items that have a stock');
  assert.deepEqual(w.query({ type: 'item', where: { name: 'bolt' }, mode: 'exists' }).value, 'yes');
  assert.equal(w.query({ type: 'item', where: { name: 'spring' }, mode: 'exists' }).status, 'unknown', 'items are an open type');
  assert.equal(w.query({ type: 'shelf', where: { row: 'C' }, mode: 'exists' }).status, 'no', 'shelves are declared complete');
  assert.throws(() => w.query({ type: 'item' }), /needs seek/);
});

test('query: a derived value names its rule; a producer computes what no wire has', () => {
  const w = world();
  w.load(`
    ?i item stock=?n
    @t core.check fn=lt args=?n args=20
    @low reorder of=$i
    @reorder core.rule when=$i if=$t then=$low
  `);
  const derived = w.query({ type: 'reorder', seek: 'of' });
  assert.deepEqual([derived.status, derived.value, derived.via], ['supported', '$i2', ['reorder']]);

  const v = w.query({ type: 'item', seek: 'value', where: { name: 'bolt' } });
  assert.deepEqual([v.status, v.value, v.via, v.from], ['supported', '20', ['p_value'], ['i1']]);
  assert.equal(w.get('i1').attrs.value, undefined, 'a query changes nothing');
  assert.equal(w.query({ type: 'item', seek: 'value', where: { name: 'nut' } }).status, 'missing', 'no price, the producer has no answer');
  w.fill('i1', 'value', '99');
  assert.equal(w.query({ about: 'i1', seek: 'value' }).value, '99', 'a stated value comes before the producer');
});

test('query: a question wire has the same effect as an object; record writes the answer as a wire', () => {
  const w = world();
  w.load('@q1 core.question type=item seek=stock where.name=bolt');
  assert.equal(w.query('q1').value, '40');
  assert.equal(w.query('@x core.question type=item seek=stock where.name=nut').value, '15', 'SOP Lang text');
  w.load('@k9 core.slot of=item key=unit required=true ask="Which unit?"');
  const open = w.query(w.next().questions[0]);
  assert.deepEqual([open.status, open.missing[0].ask], ['missing', 'Which unit?'], 'the shape next() produces');

  const r = w.query('q1', { record: true });
  assert.ok(r.answer.ok);
  assert.equal(format(w.get(r.answer.id)), `@${r.answer.id} core.answer to=$q1 status=supported value=40 core.from=$i1`);
  const r2 = w.query({ type: 'item', seek: 'stock', where: { name: 'gear' } }, { record: true });
  assert.equal(format(w.get(r2.answer.question)), `@${r2.answer.question} core.question type=item seek=stock where.name=gear`);
  assert.equal(w.get(r2.answer.id).attrs.status[0], 'missing');
});

test('query: the vocabulary of questions and answers can be the host\'s', () => {
  const w = world({ vocabulary: { question: 'ask', answer: 'reply', status: 'outcome', where: 'if.', to: 'for' } });
  w.load('@q1 ask type=item seek=stock if.name=bolt');
  const r = w.query('q1', { record: true });
  assert.equal(format(w.get(r.answer.id)), `@${r.answer.id} reply for=$q1 outcome=supported value=40 core.from=$i1`);
});

test('slots: a prefix slot covers every key that starts with it, also on a closed type', () => {
  const w = new World();
  w.load(`
    @t core.type of=filter closed=true
    @k1 core.slot of=filter key=on kind=atom
    @k2 core.slot of=filter key=where prefix=true kind=atom kind=number
  `);
  assert.ok(w.tell('@f1 filter on=item where.name=bolt where.stock=3').ok);
  assert.equal(w.tell('@f2 filter on=item wherever=x').violations[0].kind, 'unknown-key');
  assert.equal(w.tell('@f3 filter on=item where.name="quoted"').violations[0].kind, 'domain');
  assert.equal(w.open().length, 0);
});

test('act: an action runs in one transaction and returns its result', () => {
  const w = world();
  const r = w.act({ action: 'take', args: { item: 'bolt', count: 10 } });
  assert.deepEqual([r.ok, r.status, r.value], [true, 'done', '30']);
  assert.equal(w.get('i1').attrs.stock[0], '30');
  assert.equal(w.ofType('withdrawal').length, 1);
  assert.equal(w.act('@r1 core.request action=take arg.item=nut arg.count=5').value, '10', 'a request wire');
});

test('act: a refusal leaves the world unchanged and says why', () => {
  const w = world();
  const before = w.toSOP();
  const tooMany = w.act({ action: 'take', args: { item: 'bolt', count: 50 } });
  assert.deepEqual([tooMany.ok, tooMany.status, tooMany.violations[0].why], [false, 'refused', 'must be at least 0']);
  assert.equal(w.toSOP(), before, 'the stock change and the withdrawal are both undone');
  const unknown = w.act({ action: 'take', args: { item: 'spring', count: 1 } });
  assert.deepEqual([unknown.status, unknown.violations[0].why], ['refused', 'there is no item named spring']);
  const missing = w.act({ action: 'take', args: { item: 'bolt' } });
  assert.deepEqual([missing.status, missing.missing], ['missing', [{ action: 'take', key: 'count', ask: 'How many do you take?' }]]);
  assert.equal(w.act({ action: 'fly' }).status, 'unsupported');
  w.fns.take = () => { throw new Error('boom'); };
  assert.deepEqual([w.act({ action: 'take', args: { item: 'bolt', count: 1 } }).status, w.toSOP()], ['error', before]);
});

test('query: with no matching wire the world supposes one and lets the rules answer', () => {
  const w = world();
  const before = w.toSOP();
  const r = w.query({ type: 'line', seek: 'total', where: { item: 'bolt', qty: 8 } });
  assert.deepEqual([r.status, r.value, r.via, r.from], ['supported', '4', ['line_total'], ['i1']]);
  const no = w.query({ type: 'line', seek: 'total', where: { item: 'bolt', qty: 80 } });
  assert.deepEqual([no.status, no.violations[0].why, no.from], ['refused', 'not enough in stock', ['i1']]);
  const bad = w.query({ type: 'line', seek: 'total', where: { item: 'bolt', qty: 0 } });
  assert.deepEqual([bad.status, bad.violations[0].why], ['refused', 'must be at least 1']);
  assert.equal(w.query({ type: 'line', seek: 'total', where: { item: 'nut', qty: 2 } }).status, 'missing', 'nut has no price');
  assert.equal(w.query({ type: 'line', seek: 'total', where: { item: 'bolt', qty: 8 } }, { suppose: false }).status, 'missing');
  assert.equal(w.toSOP(), before, 'supposing leaves nothing behind');
  assert.equal(w.ofType('line').length, 0);
});

test('query: a calculation that cannot be done is unsupported, with the reason; decimals set the precision', () => {
  const matrix = `
    ?q share total=?t people=?n
    @c core.calc out=?each fn=div args=?t args=?n
    @a share core.on=$q each=?each
    @r core.rule when=$q with=$c then=$a
    ?m mix a=?x b=?y
    @c2 core.calc out=?s fn=add args=?x args=?y
    @a2 mix core.on=$m sum=?s
    @r2 core.rule when=$m with=$c2 then=$a2
  `;
  const w = new World();
  w.load(matrix);
  const ask = (x, total, people) => x.query({ type: 'share', seek: 'each', where: { total, people } });
  assert.deepEqual([ask(w, 10, 4).status, ask(w, 10, 4).value], ['supported', '2.5']);
  const zero = ask(w, 10, 0);
  assert.deepEqual([zero.status, zero.reason], ['unsupported', 'division by zero']);
  const units = w.query({ type: 'mix', seek: 'sum', where: { a: '2kg', b: '3m' } });
  assert.deepEqual([units.status, units.reason], ['unsupported', 'the units differ (2kg, 3m)']);
  assert.equal(w.query({ type: 'share', seek: 'each', where: { total: 10 } }).status, 'missing', 'nothing was tried: still missing');
  // a host function can say why, too
  const h = new World({ fns: { root: ([x], world) => (Number(x) < 0 ? world.cannot('no root of a negative number') : String(Math.sqrt(Number(x)))) } });
  h.load('?q root of=?x\n@c core.calc out=?r fn=root args=?x\n@a root core.on=$q is=?r\n@r core.rule when=$q with=$c then=$a');
  assert.deepEqual([h.query({ type: 'root', seek: 'is', where: { of: 9 } }).value, h.query({ type: 'root', seek: 'is', where: { of: -9 } }).reason], ['3', 'no root of a negative number']);
  // precision: 12 significant digits by default; a world option or a matrix wire sets the decimals
  assert.equal(ask(w, 10, 3).value, '3.33333333333');
  const two = new World({ decimals: 2 });
  two.load(matrix);
  assert.deepEqual([ask(two, 10, 3).value, ask(two, 10, 4).value, ask(two, 10, 5).value], ['3.33', '2.5', '2']);
  const wired = new World();
  wired.load(matrix + '@p core.precision decimals=1');
  assert.equal(ask(wired, 10, 3).value, '3.3');
});
