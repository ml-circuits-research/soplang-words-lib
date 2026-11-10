import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, format } from '../tools/lib-under-test.mjs';
import { ledger } from '../examples/ledger.mjs';

const canon = (w) => w.toSOP().split('\n').sort().join('\n');
const world = (extra = '') => { const w = new World(); w.load(ledger + extra); return w; };
const balance = (w, name = 'ana') => w.query({ type: 'account', seek: 'balance', where: { name } });

test('fluent: the value is the last statement plus the effects of later events, with provenance', () => {
  const w = world();
  w.load('@acc account name=ana balance=100');
  w.load('@d1 deposit account=ana amount=50');
  w.load('@w1 withdrawal account=ana amount=30');
  assert.equal(format(w.get('acc')), '@acc account name=ana balance=120');
  const r = balance(w);
  assert.deepEqual([r.status, r.value, r.via, r.from], ['supported', '120', ['f_balance'], ['acc', 'd1', 'w1']]);
  assert.deepEqual(w.explain('acc').fills.map((f) => [f.key, f.value, f.via, f.from]), [['balance', '120', 'f_balance', ['d1', 'w1']]]);
});

test('fluent: an unknown start stays unknown until something states it', () => {
  const w = world();
  w.load('@acc account name=ana  @d1 deposit account=ana amount=50');
  assert.equal(w.get('acc').attrs.balance, undefined);
  assert.deepEqual(balance(w).missing, [{ id: 'acc', type: 'account', key: 'balance', ask: 'What is the balance?' }]);
  assert.ok(w.fill('acc', 'balance', '10').ok, 'a statement made now');
  assert.equal(w.get('acc').attrs.balance[0], '10', 'the earlier deposit is not counted twice');
  w.load('@d2 deposit account=ana amount=5');
  assert.equal(w.get('acc').attrs.balance[0], '15');
  assert.ok(w.fill('acc', 'balance', '70').ok, 'a later statement replaces the value instead of conflicting');
  assert.equal(w.get('acc').attrs.balance[0], '70');
  w.load('@au1 audit account=ana found=64');
  assert.equal(w.get('acc').attrs.balance[0], '64', 'a set effect');
});

test('fluent: an event that would break a bound is a conflict that names the event; nothing changes', () => {
  const w = world();
  w.load('@acc account name=ana balance=100  @w1 withdrawal account=ana amount=30');
  const before = canon(w);
  const r = w.tell('@w2 withdrawal account=ana amount=500');
  assert.equal(r.ok, false);
  const v = r.violations[0];
  assert.deepEqual([v.kind, v.id, v.key, v.event, v.value], ['conflict', 'acc', 'balance', 'w2', '-430']);
  assert.match(v.why, /w2 would take balance of acc below 0 \(from 70 to -430\)/);
  assert.deepEqual([...v.support].sort(), ['acc', 'w1', 'w2']);
  assert.equal(canon(w), before);
});

test('fluent: retracting or replacing an event recomputes; the log rebuilds the same state', () => {
  const w = world();
  w.load('@acc account name=ana balance=100');
  w.load('@d1 deposit account=ana amount=50  @w1 withdrawal account=ana amount=30  @d2 deposit account=ana amount=5');
  assert.equal(w.get('acc').attrs.balance[0], '125');
  w.retract('d1');
  assert.equal(w.get('acc').attrs.balance[0], '75');
  assert.ok(w.replace('w1', '@w1 withdrawal account=ana amount=70').ok);
  assert.equal(w.get('acc').attrs.balance[0], '35');
  assert.equal(w.replace('w1', '@w1 withdrawal account=ana amount=700').ok, false);
  assert.equal(w.get('acc').attrs.balance[0], '35');
  assert.equal(w.retract('d2').ok, true);
  assert.equal(w.get('acc').attrs.balance[0], '30');
  assert.equal(canon(World.fromJSON(JSON.parse(JSON.stringify(w)))), canon(w));
  // an account that appears after its events
  w.load('@d9 deposit account=bob amount=4');
  w.load('@bob account name=bob balance=1');
  assert.equal(w.get('bob').attrs.balance[0], '1', 'events before the statement are behind it');
  w.load('@d10 deposit account=bob amount=4');
  assert.equal(w.get('bob').attrs.balance[0], '5');
});

test('fluent: rules and denies follow the current value', () => {
  const w = world(`
    @x account balance=?v
    @c_rich core.check fn=gt args=?v args=1000
    @cap core.deny when=$x if=$c_rich why="accounts are capped at 1000"
  `);
  w.load('@acc account name=ana balance=30');
  assert.equal(w.ofType('warning').length, 0);
  w.load('@w1 withdrawal account=ana amount=15');
  assert.deepEqual(w.ofType('warning').map((x) => format(x).replace(/^@\S+ /, '')), ['warning for=$acc kind=low_balance']);
  w.load('@d1 deposit account=ana amount=100');
  assert.equal(w.ofType('warning').length, 0, 'the warning went when the balance rose');
  const r = w.tell('@d2 deposit account=ana amount=5000');
  assert.equal(r.violations[0].why, 'accounts are capped at 1000');
  assert.ok(r.violations[0].support.includes('d2'));
});

test('as-of: ask and query see the world at an earlier point of the sequence', () => {
  const w = world();
  w.load('@acc account name=ana balance=100');
  w.load('@d1 deposit account=ana amount=50');
  w.load('@w1 withdrawal account=ana amount=140');
  assert.equal(balance(w).value, '10');
  assert.equal(w.ofType('warning').length, 1);
  const before = canon(w);
  const at = w.seqOf('d1');
  assert.deepEqual(w.ask('@a account balance=?b', { at }).map((x) => x.b), ['150']);
  assert.equal(w.query({ type: 'account', seek: 'balance', where: { name: 'ana' } }, { at: w.seqOf('acc') }).value, '100');
  assert.deepEqual(w.asOf(at, (x) => [x.has('w1'), x.ofType('warning').length]), [false, 0]);
  assert.equal(canon(w), before, 'looking back changes nothing');
  w.fill('acc', 'balance', '500');
  assert.equal(w.query({ about: 'acc', seek: 'balance' }, { at }).value, '150', 'a later statement is set aside too');
});

test('sequence: a declared key orders wires whatever the order they are told in', () => {
  const w = world('@seq core.sequence key=core.seq');
  w.load('@acc account name=ana balance=100 core.seq=5');
  w.load('@w1 withdrawal account=ana amount=90 core.seq=9');   // told first, happens last
  assert.equal(w.get('acc').attrs.balance[0], '10');
  w.load('@d1 deposit account=ana amount=50 core.seq=7');      // told later, happens in between
  assert.equal(w.get('acc').attrs.balance[0], '60');
  w.load('@d0 deposit account=ana amount=999 core.seq=2');     // before the statement: behind it
  assert.equal(w.get('acc').attrs.balance[0], '60');
  assert.deepEqual(w.ask('@a account balance=?b', { at: 7 }).map((x) => x.b), ['150']);
  assert.deepEqual(w.ask('@a account balance=?b', { at: 5 }).map((x) => x.b), ['100']);
  assert.deepEqual(w.ask('@a account balance=?b', { at: 4 }), [], 'the account was not yet stated');
  // the order of telling does not matter: the same wires told in sequence order give the same state
  const v = world('@seq core.sequence key=core.seq');
  v.load('@d0 deposit account=ana amount=999 core.seq=2  @acc account name=ana balance=100 core.seq=5');
  v.load('@d1 deposit account=ana amount=50 core.seq=7  @w1 withdrawal account=ana amount=90 core.seq=9');
  assert.equal(canon(v), canon(w));
  // an event that only fits in one order: 120 out is refused before the deposit is known to precede it
  const u = world('@seq core.sequence key=core.seq');
  u.load('@acc account name=bob balance=100 core.seq=1');
  assert.equal(u.tell('@w1 withdrawal account=bob amount=120 core.seq=4').ok, false);
  u.load('@d1 deposit account=bob amount=50 core.seq=2');
  assert.ok(u.tell('@w1 withdrawal account=bob amount=120 core.seq=4').ok);
  assert.equal(u.get('acc').attrs.balance[0], '30');
});

test('sequence: before, after, and the selectors latest and first', () => {
  const w = new World();
  w.load(`
    @seq core.sequence key=at
    @s sensor name=?n
    @r reading of=$s core.select=latest level=?l
    @now status of=$s level=?l
    @k core.slot of=status key=of id=true
    @current core.rule when=$s when=$r then=$now

    @a reading of=?x level=?la
    @b reading of=?x level=?lb
    @c_after core.check fn=after args=$b args=$a
    @c_drop core.check fn=lt args=?lb args=?la
    @fall drop from=$a to=$b
    @falling core.rule when=$a when=$b if=$c_after if=$c_drop then=$fall
  `);
  w.load('@s1 sensor name=tank');
  w.load('@r2 reading of=$s1 level=70 at=20');
  assert.deepEqual(w.ask('@n status level=?l').map((x) => x.l), ['70']);
  w.load('@r1 reading of=$s1 level=90 at=10'); // told later, but earlier in the sequence
  assert.deepEqual(w.ask('@n status level=?l').map((x) => x.l), ['70'], 'r2 is still the latest');
  assert.deepEqual(w.ask('@d drop from=?a to=?b').map((x) => [x.a, x.b]), [['$r1', '$r2']], 'the level fell from r1 to r2');
  w.load('@r3 reading of=$s1 level=40 at=30');
  assert.equal(w.ofType('status').length, 1);
  assert.deepEqual(w.ask('@n status level=?l').map((x) => x.l), ['40'], 'the status follows the latest reading');
  assert.deepEqual(w.ask('@r reading core.select=first level=?l').map((x) => x.l), ['90']);
  assert.deepEqual(w.ask('@r reading core.select=latest level=?l').map((x) => x.l), ['40']);
  assert.ok(w.compare('r1', 'r2') < 0 && w.compare('r3', 'r2') > 0);
  assert.equal(w.seqOf('r2'), 20);
  w.retract('r3');
  assert.deepEqual(w.ask('@n status level=?l').map((x) => x.l), ['70'], 'and goes back when it is retracted');
  assert.deepEqual(w.ask('@r reading level=?l', { at: 15 }).map((x) => x.l), ['90']);
});

test('fluent: an event can name its holder by reference, and an effect can be a registered function', () => {
  const w = new World({ fns: { double: ([v]) => Number(v) * 2 } });
  w.load(`
    @f core.fluent of=tank key=level
    @e1 core.effect on=fill fluent=$f op=add amount=litres for=tank
    @e2 core.effect on=boost fluent=$f op=double value=0 for=tank
  `);
  w.load('@t1 tank level=10l  @t2 tank level=1l');
  w.load('@f1 fill tank=$t1 litres=5l');
  assert.equal(w.get('t1').attrs.level[0], '15l', 'units are kept');
  assert.equal(w.get('t2').attrs.level[0], '1l');
  w.load('@t3 tank level=4  @b1 boost tank=$t3');
  assert.equal(w.get('t3').attrs.level[0], '8');
});

test('fluent: events applied one by one give the same state and provenance as a full replay', () => {
  const events = [];
  let x = 7;
  for (let i = 0; i < 300; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    const kind = x % 5 === 0 ? 'audit' : x % 2 ? 'deposit' : 'withdrawal';
    const key = kind === 'audit' ? 'found' : 'amount';
    const amount = kind === 'withdrawal' ? x % 7 : kind === 'audit' ? 4000 + (x % 90) : x % 90; // never below zero
    events.push(`@ev${i} ${kind} account=${x % 3 ? 'ana' : 'bob'} ${key}=${amount}`);
  }
  const head = '@a account name=ana balance=5000  @b account name=bob balance=5000';
  const step = world(); step.load(head);
  for (const e of events) assert.ok(step.tell(e).ok, e);       // each event applied to the current value
  const batch = world(); batch.load(head); batch.load(events.join('\n')); // one replay of the whole line
  assert.equal(canon(step), canon(batch));
  for (const id of ['a', 'b']) assert.deepEqual(step.explain(id).fills, batch.explain(id).fills, `${id}: same provenance`);
  // and after taking events out of the middle
  for (const id of ['ev10', 'ev150', 'ev299']) { step.retract(id); batch.retract(id); }
  assert.equal(canon(step), canon(batch));
  assert.equal(canon(World.fromJSON(JSON.parse(JSON.stringify(step)))), canon(step));
});

test('fluents: delta= exposes the known change since the last statement, also when the start is unknown', () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=shelf key=item id=true
    @f core.fluent of=shelf key=stock delta=change
    @e1 core.effect on=delivery fluent=$f op=add amount=n where.item=item
    @e2 core.effect on=sale fluent=$f op=sub amount=n where.item=item
  `);
  w.load('@s1 shelf item=tea');                       // nobody said how many there are
  w.tell('@d1 delivery item=tea n=5');
  w.tell('@x1 sale item=tea n=2');
  assert.deepEqual([w.get('s1').attrs.stock, w.get('s1').attrs.change], [undefined, ['3']], 'the stock is unknown, the change is known');
  assert.equal(w.query({ type: 'shelf', seek: 'stock', where: { item: 'tea' } }).status, 'missing');
  const q = w.query({ type: 'shelf', seek: 'change', where: { item: 'tea' } });
  assert.deepEqual([q.status, q.value, q.from], ['supported', '3', ['s1', 'd1', 'x1']]);
  // a statement starts the count again
  w.fill('s1', 'stock', 10);
  assert.deepEqual([w.get('s1').attrs.stock, w.get('s1').attrs.change], [['10'], undefined]);
  w.tell('@d2 delivery item=tea n=4');
  assert.deepEqual([w.get('s1').attrs.stock, w.get('s1').attrs.change], [['14'], ['4']]);
  assert.ok(w.retract('d2').ok);
  assert.deepEqual([w.get('s1').attrs.stock, w.get('s1').attrs.change], [['10'], undefined]);
  // a shelf nobody has mentioned: the question itself is enough to know what came in
  w.tell('@d3 delivery item=salt n=7');
  assert.deepEqual([w.query({ type: 'shelf', seek: 'change', where: { item: 'salt' } }).value, w.query({ type: 'shelf', seek: 'stock', where: { item: 'salt' } }).status], ['7', 'missing']);
});
