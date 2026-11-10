import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, format } from '../tools/lib-under-test.mjs';
import { warehouse, actions, producers } from '../examples/warehouse.mjs';

const world = (options = {}) => {
  const w = new World({ actions, producers, ...options });
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
    @i item stock=?n
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
  w.register('action', 'take', () => { throw new Error('boom'); });
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
    @q share total=?t people=?n
    @c core.calc out=?each fn=div args=?t args=?n
    @a share core.on=$q each=?each
    @r core.rule when=$q with=$c then=$a
    @m mix a=?x b=?y
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
  h.load('@q root of=?x\n@c core.calc out=?r fn=root args=?x\n@a root core.on=$q is=?r\n@r core.rule when=$q with=$c then=$a');
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

test('act: an action written as wires: parameters, a guard, writes that read the state before', () => {
  const matrix = `
    @k1 core.slot of=item key=name id=true
    @k2 core.slot of=item key=stock kind=integer min=0
    @it item name=?item stock=?have
    @enough core.check fn=gte args=?have args=?count why="not enough in stock"
    @left core.calc out=?rest fn=sub args=?have args=?count
    @w1 item core.on=$it stock=?rest
    @w2 withdrawal of=$it count=?count before=?have
    @a_take core.action name=take param=item param=count when=$it if=$enough with=$left set=$w1 add=$w2 returns=?rest ask.count="How many do you take?"

    @x account name=?from balance=?fb
    @y account name=?to balance=?tb
    @c1 core.calc out=?fb2 fn=sub args=?fb args=?amount
    @c2 core.calc out=?tb2 fn=add args=?tb args=?amount
    @covered core.check fn=gte args=?fb args=?amount why="the account does not hold that much"
    @s1 account core.on=$x balance=?fb2
    @s2 account core.on=$y balance=?tb2
    @a_move core.action name=transfer param=from param=to param=amount when=$x when=$y with=$c1 with=$c2 if=$covered set=$s1 set=$s2

    @old note done=true
    @a_tidy core.action name=tidy when=$old remove=$old all=true
  `;
  const w = new World();
  w.load(matrix);
  w.load('@i1 item name=bolt stock=40  @a1 account name=ana balance=50  @a2 account name=bob balance=5');
  const r = w.act({ action: 'take', args: { item: 'bolt', count: 10 } });
  assert.deepEqual([r.ok, r.status, r.value, w.get('i1').attrs.stock], [true, 'done', '30', ['30']]);
  const out = w.ofType('withdrawal')[0];
  assert.deepEqual([out.attrs.of, out.attrs.count, out.attrs.before], [['$i1'], ['10'], ['40']], 'the new wire reads the state before the action');
  // a guard that does not hold: refused with its reason, nothing changed
  const before = w.toSOP();
  const no = w.act({ action: 'take', args: { item: 'bolt', count: 99 } });
  assert.deepEqual([no.status, no.violations[0].kind, no.violations[0].check, no.violations[0].why, w.toSOP()], ['refused', 'guard', 'enough', 'not enough in stock', before]);
  assert.match(w.act({ action: 'take', args: { item: 'spring', count: 1 } }).violations[0].why, /nothing in the world matches/);
  assert.deepEqual(w.act({ action: 'take', args: { item: 'bolt' } }).missing, [{ action: 'take', key: 'count', ask: 'How many do you take?' }]);
  assert.equal(w.act('@r1 core.request action=take arg.item=bolt arg.count=5').value, '25', 'a request wire works the same');
  // two writes at once: both read the balances as they were
  assert.ok(w.act({ action: 'transfer', args: { from: 'ana', to: 'bob', amount: 20 } }).ok);
  assert.deepEqual([w.get('a1').attrs.balance, w.get('a2').attrs.balance], [['30'], ['25']]);
  assert.equal(w.act({ action: 'transfer', args: { from: 'bob', to: 'ana', amount: 26 } }).violations[0].why, 'the account does not hold that much');
  // the changes are in the history: a restored world is the same
  const again = World.fromJSON(JSON.parse(JSON.stringify(w.toJSON())));
  assert.deepEqual([again.get('i1').attrs.stock, again.get('a2').attrs.balance, again.ofType('withdrawal').length], [['25'], ['25'], 2]);
  // remove, on every match
  w.load('@n1 note done=true  @n2 note done=true  @n3 note done=false');
  assert.ok(w.act({ action: 'tidy' }).ok);
  assert.deepEqual(w.ofType('note').map((n) => n.id), ['n3']);
  // the patch behind it is public too: sets replace, fills add
  assert.equal(w.check({ sets: [{ id: 'i1', key: 'stock', value: 7 }] }).ok, true);
  assert.equal(w.check({ sets: [{ id: 'i1', key: 'stock', value: -1 }] }).violations[0].kind, 'domain');
  assert.equal(w.check({ fills: [{ id: 'i1', key: 'stock', value: 7 }] }).violations[0].kind, 'conflict');
});

test('functions: three registries; a host name never replaces a built-in by accident', () => {
  // an action called add, as a dialogue host would have: it does not touch the arithmetic
  const w = new World({
    actions: { add: (ctx, { item }) => { ctx.tell(`@n_${ctx.world.seq} note text=${item}`); return 'added'; }, count: (ctx) => ctx.find('note').length },
    producers: { size: ({ wire, val }) => String(val(wire, 'text')).length },
  });
  w.load(`
    @a1 core.action name=notes.add fn=add required=item
    @a2 core.action name=notes.count fn=count
    @p1 core.producer of=note key=size fn=size
    @x pair a=?a b=?b
    @c core.calc out=?s fn=add args=?a args=?b
    @t pair core.on=$x sum=?s
    @r core.rule when=$x with=$c then=$t
  `);
  assert.equal(w.act({ action: 'notes.add', args: { item: 'milk' } }).value, 'added');
  assert.equal(w.act({ action: 'notes.count' }).value, '1');
  assert.equal(w.query({ type: 'note', seek: 'size', where: { text: 'milk' } }).value, '4');
  w.tell('@p pair a=2 b=3');
  assert.equal(w.get('p').attrs.sum[0], '5', 'add in a calc is still the built-in');
  assert.deepEqual(w.warnings, []);
  // a function with the name of a built-in is refused, unless it is meant
  assert.throws(() => new World({ fns: { add: () => '0' } }), /would replace the built-in/);
  assert.throws(() => w.register('function', 'count', () => 0), /would replace the built-in/);
  const meant = new World({ fns: { add: ([a, b]) => `${a}+${b}` }, override: ['add'] });
  assert.equal(meant.fns.add(['1', '2']), '1+2');
  w.register('function', 'twice', ([x]) => String(2 * Number(x)));
  assert.ok(w.tell('@y item n=?n\n@c2 core.calc out=?d fn=twice args=?n\n@t2 item core.on=$y double=?d\n@r2 core.rule when=$y with=$c2 then=$t2').ok);
  // the old place for an action still works, with a note
  const old = new World({ fns: { greet: () => 'hello' } });
  old.load('@a core.action name=greet fn=greet');
  assert.deepEqual([old.act({ action: 'greet' }).value, old.warnings.map((x) => [x.kind, x.id])], ['hello', [['deprecated', 'greet']]]);
  assert.match(new World().tell('@a core.action name=x fn=nothing').violations[0].why, /unknown action function/);
});

test('query: an answer found by supposing carries the supposed wire as the rules left it', () => {
  const w = new World();
  w.load(`
    @q quote item=?i count=?n
    @p price item=?i each=?e
    @c1 core.calc out=?t fn=mul args=?n args=?e
    @c2 core.calc out=?tax fn=mul args=?t args=0.2
    @a quote core.on=$q total=?t tax=?tax unit=lei
    @r core.rule when=$q when=$p with=$c1 with=$c2 then=$a
  `);
  w.load('@p1 price item=pen each=3');
  const r = w.query({ type: 'quote', seek: 'total', where: { item: 'pen', count: 4 } });
  assert.deepEqual([r.status, r.value], ['supported', '12']);
  // one query is enough to word the reply: total, tax and unit are all there
  assert.deepEqual(r.supposed.set, { total: '12', tax: '2.4', unit: 'lei' });
  assert.deepEqual(r.supposed.attrs, { item: ['pen'], count: ['4'], total: ['12'], tax: ['2.4'], unit: ['lei'] });
  assert.deepEqual(r.supposed.fills.map((f) => [f.key, f.via, f.from, f.tier]), [['total', 'r', ['p1'], 'derived'], ['tax', 'r', ['p1'], 'derived'], ['unit', 'r', ['p1'], 'derived']]);
  assert.equal(w.ofType('quote').length, 0, 'and nothing stays in the world');
  // when no rule answers, the supposed wire shows what was known
  const m = w.query({ type: 'quote', seek: 'total', where: { item: 'ink', count: 1 } });
  assert.deepEqual([m.status, m.supposed.set], ['missing', {}]);
  // an answer read from a wire that exists is not a supposition
  w.tell('@q9 quote item=pen count=2');
  assert.equal(w.query({ type: 'quote', seek: 'total', where: { item: 'pen', count: 2 } }).supposed, undefined);
});
