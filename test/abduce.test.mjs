import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, adopt } from '../tools/lib-under-test.mjs';

// change = paid - total; what was paid may be assumed
const till = `
@k_paid core.slot of=payment key=paid kind=number
@ab_paid core.abducible of=payment key=paid
@p payment paid=?paid total=?total
@c_change core.calc out=?chg fn=sub args=?paid args=?total
@ch change of=$p amount=?chg
@give_change core.rule when=$p with=$c_change then=$ch
`;

test('abduction through a calc: the missing argument is computed from the result', () => {
  const w = new World();
  w.load(till);
  w.load('@p1 payment total=15');
  const found = w.abduce('@x change amount=5');
  assert.deepEqual(found.map((e) => e.text), ['p1.paid=20']);
  assert.deepEqual(found[0].fills, [{ id: 'p1', key: 'paid', value: '20' }]);
  assert.ok(adopt(w, found[0]).ok);
  assert.equal(w.ask('@x change amount=?a')[0].a, '5');
  // every place of every invertible function
  const solve = (fn, args, out) => {
    const x = new World();
    x.load(`@k core.slot of=m key=x kind=number\n@ab core.abducible of=m key=x\n?m m x=?x a=?a b=?b\n@c core.calc out=?o fn=${fn} ${args}\n@r result of=$m v=?o\n@rule core.rule when=$m with=$c then=$r`);
    x.load('@m1 m a=12 b=4');
    return x.abduce(`@r result v=${out}`).map((e) => e.text);
  };
  assert.deepEqual(solve('add', 'args=?x args=?a args=?b', 20), ['m1.x=4']);
  assert.deepEqual(solve('sub', 'args=?x args=?a args=?b', 20), ['m1.x=36']);
  assert.deepEqual(solve('sub', 'args=?a args=?x args=?b', 5), ['m1.x=3']);
  assert.deepEqual(solve('mul', 'args=?a args=?x', 30), ['m1.x=2.5']);
  assert.deepEqual(solve('div', 'args=?x args=?b', 7), ['m1.x=28']);
  assert.deepEqual(solve('div', 'args=?a args=?x', 4), ['m1.x=3']);
  assert.deepEqual(solve('mul', 'args=?x args=0', 30), [], 'nothing times zero is thirty');
});

const invoice = `
@k_qty core.slot of=line key=qty kind=number
@ab_qty core.abducible of=line key=qty
@l line qty=?q price=?p
@c_sub core.calc out=?sub fn=mul args=?q args=?p
@st subtotal of=$l amount=?sub
@r_sub core.rule when=$l with=$c_sub then=$st
@s subtotal of=$l2 amount=?a
@l2 line order=$o
@o order shipping=?ship
@c_tot core.calc out=?tot fn=add args=?a args=?ship
@c_tax core.calc out=?due fn=mul args=?tot args=1.2
@t total of=$o amount=?due
@r_tot core.rule when=$s when=$l2 when=$o with=$c_tot with=$c_tax then=$t
`;

test('abduction through a chain: two rules and two calcs in one rule', () => {
  const w = new World();
  w.load(invoice);
  w.load('@o1 order shipping=5  @l1 line order=$o1 price=4');
  // (qty * 4 + 5) * 1.2 = 30  ->  qty = 5
  const found = w.abduce('@t total amount=30');
  assert.deepEqual(found.map((e) => e.text), ['l1.qty=5']);
  assert.ok(adopt(w, found[0]).ok);
  assert.deepEqual([w.ask('@s subtotal amount=?a')[0].a, w.ask('@t total amount=?a')[0].a], ['20', '30']);
  // the first rule alone
  const v = new World();
  v.load(invoice);
  v.load('@o1 order shipping=5  @l1 line order=$o1 price=4');
  assert.deepEqual(v.abduce('@s subtotal amount=18').map((e) => e.text), ['l1.qty=4.5']);
});

test('abduction through a calc: a wire that may be assumed gets its computed value', () => {
  const w = new World();
  w.load(`
    @ab core.abducible of=discount
    @i item price=?p
    @d discount on=$i amount=?off
    @c core.calc out=?net fn=sub args=?p args=?off
    @f final of=$i price=?net
    @r core.rule when=$i when=$d with=$c then=$f
  `);
  w.load('@i1 item price=100');
  const found = w.abduce('@f final of=$i1 price=80');
  assert.deepEqual(found.map((e) => e.text.replace(/^@\S+ /, '')), ['discount on=$i1 amount=20']);
  assert.ok(adopt(w, found[0]).ok);
  assert.equal(w.holds('@f final price=80'), true);
});

test('abduction through a function that has no inverse: the values of the slot are tried', () => {
  const w = new World({ fns: { square: ([x]) => String(Number(x) * Number(x)) } });
  w.load(`
    @k1 core.slot of=tile key=side kind=integer enum=1 enum=2 enum=3 enum=4 enum=5
    @k2 core.slot of=tile key=offset kind=integer min=-3 max=3 step=1
    @ab1 core.abducible of=tile key=side
    @ab2 core.abducible of=tile key=offset
    @t tile side=?s
    @c1 core.calc out=?area fn=square args=?s
    @a area of=$t v=?area
    @r1 core.rule when=$t with=$c1 then=$a
    @u tile offset=?o
    @c2 core.calc out=?far fn=abs args=?o
    @d distance of=$u v=?far
    @r2 core.rule when=$u with=$c2 then=$d
  `);
  w.load('@t1 tile');
  assert.deepEqual(w.abduce('@a area v=9').map((e) => e.text), ['t1.side=3']);
  assert.deepEqual(w.abduce('@a area v=10').map((e) => e.text), [], 'no side has that area');
  assert.deepEqual(w.abduce('@d distance v=2').map((e) => e.text).sort(), ['t1.offset=-2', 't1.offset=2'], 'a range is a domain too');
  // a host function named like a built-in is not inverted
  const x = new World({ fns: { add: ([a, b]) => String(Number(a) + Number(b) + 1) } });
  x.load('@ab core.abducible of=n key=v\n?n n v=?v\n@c core.calc out=?o fn=add args=?v args=1\n@s succ of=$n v=?o\n@r core.rule when=$n with=$c then=$s');
  x.load('@n1 n');
  assert.deepEqual(x.abduce('@s succ v=5'), []);
});

test('abduction through a calc: no solution is an empty list, within the budget', () => {
  const w = new World();
  w.load(till);
  w.load('@k_min core.slot of=payment key=total kind=number\n?q payment paid=?x total=?y\n@over core.check fn=gt args=?x args=100\n@cash_limit core.deny when=$q if=$over why="no payment above 100 in cash"');
  w.load('@p1 payment total=15');
  // 15 + 200 = 215 would have to be paid: the deny refuses it
  const none = w.abduce('@x change amount=200');
  assert.deepEqual([none.length, none.budget, w.stats().exhausted], [0, undefined, false]);
  assert.ok(w.stats().steps < 1000, `${w.stats().steps} steps`);
  // a goal no rule produces, and a key that may not be assumed
  assert.deepEqual(w.abduce('@x refund amount=5'), []);
  const v = new World();
  v.load(till.replace('@ab_paid core.abducible of=payment key=paid', ''));
  v.load('@p1 payment total=15');
  assert.deepEqual(v.abduce('@x change amount=5'), []);
  // out of budget it says so instead
  const cut = w.abduce('@x change amount=5', { budget: { steps: 3 } });
  assert.deepEqual([cut.length, cut.budget.kind, cut.budget.site], [0, 'budget', w.stats().site]);
  assert.equal(w.abduce('@x change amount=5').length, 1);
});
