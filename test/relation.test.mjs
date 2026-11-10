import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, solvers, adopt } from '../tools/lib-under-test.mjs';

const till = `
?p payment paid=?paid total=?total change=?chg
@r core.relation when=$p sum=?paid sub=?total sub=?chg equals=0
`;

test('relation: paid - total - change = 0 is solved for whichever of the three is missing', () => {
  const w = new World();
  w.load(till);
  let n = 0;
  for (let total = 1; total <= 11; total++) {
    for (let change = 0; change <= 5; change++) {
      const paid = total + change;
      const full = { paid, total, change };
      for (const missing of ['paid', 'total', 'change']) {
        const id = `p${n++}`;
        const given = Object.keys(full).filter((k) => k !== missing).map((k) => `${k}=${full[k]}`).join(' ');
        assert.equal(w.tell(`@${id} payment ${given}`).ok, true);
        assert.equal(w.get(id).attrs[missing]?.[0], String(full[missing]), `${given} -> ${missing}`);
        assert.equal(w.tier(id, missing), 'derived');
      }
    }
  }
  assert.equal(n, 198);
  // provenance names the relation and the cells
  const fill = w.get('p0').meta.fills.find((f) => f.key === 'paid');
  assert.deepEqual([fill.via, fill.cells], ['r', [['p0', 'total'], ['p0', 'change']]]);
});

test('relation: satisfied, conflicting, waiting; exact decimals; a kind the value does not fit', () => {
  const w = new World();
  w.load(till + '@k core.slot of=ticket key=seats kind=integer\n?t ticket seats=?s rows=?rw\n@r2 core.relation when=$t sum=?s sub=2*?rw equals=1');
  assert.equal(w.tell('@ok payment paid=20 total=15 change=5.0').ok, true, 'all known and true: nothing to do');
  const bad = w.tell('@bad payment paid=20 total=15 change=4');
  assert.deepEqual([bad.ok, bad.violations[0].kind, bad.violations[0].id, bad.violations[0].via], [false, 'conflict', 'bad', 'r']);
  // two unknown: the relation waits, nothing is invented; then one more value settles it
  w.tell('@wait payment paid=20');
  assert.deepEqual(Object.keys(w.get('wait').attrs), ['paid']);
  assert.ok(w.fill('wait', 'change', '0.1').ok);
  assert.equal(w.get('wait').attrs.total[0], '19.9', 'exact: 20 - 0.1 is 19.9');
  // a value that follows from an assumption is as weak as it
  assert.ok(w.tell('@g payment paid=10').ok);
  assert.ok(w.fill('g', 'total', 7, { tier: 'guessed' }).ok);
  assert.deepEqual([w.get('g').attrs.change, w.tier('g', 'change')], [['3'], 'guessed']);
  // retract what it rested on and it goes
  w.tell('@h payment paid=9 total=4');
  assert.equal(w.get('h').attrs.change[0], '5');
  w.replace('h', '@h payment paid=9');
  assert.equal(w.get('h').attrs.change, undefined);
  // seats = 2*rows + 1; with a coefficient, both ways; an integer cell does not take a half
  w.tell('@t1 ticket rows=4');
  assert.equal(w.get('t1').attrs.seats[0], '9');
  w.tell('@t2 ticket seats=11');
  assert.equal(w.get('t2').attrs.rows[0], '5');
  w.load('@k2 core.slot of=ticket key=rows kind=integer');
  const half = w.tell('@t3 ticket seats=10');
  assert.deepEqual([half.ok, half.violations[0].kind, half.violations[0].key], [false, 'domain', 'rows']);
});

test('relation: a chain of relations is propagated to a fixpoint; units must agree', () => {
  const w = new World();
  w.load(`
    ?a cell name=x v=?x
    ?b cell name=y v=?y
    ?c cell name=z v=?z
    @xy core.relation when=$a when=$b sum=?x sum=?y equals=10
    @yz core.relation when=$b when=$c sum=?y sum=?z equals=8
  `);
  w.tell('@x cell name=x  @y cell name=y  @z cell name=z');
  assert.deepEqual(['x', 'y', 'z'].map((id) => w.get(id).attrs.v), [undefined, undefined, undefined], 'undetermined: nothing is invented');
  assert.ok(w.fill('z', 'v', 3).ok);
  assert.deepEqual(['x', 'y', 'z'].map((id) => w.get(id).attrs.v[0]), ['5', '5', '3']);
  assert.deepEqual(w.explain('x').fills.map((f) => `${f.key} via ${f.via} ${f.tier}`), ['v via xy derived']);
  assert.equal(w.fill('x', 'v', 6, { dry: true }).violations[0].kind, 'conflict', 'x is determined: another value is refused');
  assert.ok(w.stats().steps < 500);
  const u = new World();
  u.load('?m mix a=?a b=?b all=?t\n@sum core.relation when=$m sum=?a sum=?b sub=?t');
  u.tell('@m1 mix a=2kg b=3kg');
  assert.equal(u.get('m1').attrs.all[0], '5kg');
  u.tell('@m2 mix a=2kg b=3m');
  assert.equal(u.get('m2').attrs.all, undefined, 'kilograms and metres do not add up');
});

test('relation: relation=true on a calc of a rule solves the rule backwards too; abduction uses it', () => {
  const w = new World();
  w.load(`
    @ab core.abducible of=order key=net
    ?o order net=?n tax=?t
    @c core.calc out=?g fn=add args=?n args=?t relation=true
    @inv invoice of=$o gross=?g
    @r core.rule when=$o with=$c then=$inv
  `);
  w.tell('@o1 order net=100 tax=19');
  assert.equal(w.ofType('invoice')[0].attrs.gross[0], '119', 'forwards, as any rule');
  w.tell('@o2 order tax=19  @i2 invoice of=$o2 gross=238');
  assert.equal(w.get('o2').attrs.net[0], '219', 'backwards: the net follows from the gross');
  assert.deepEqual([w.get('o2').meta.fills[0].via, w.tier('o2', 'net')], ['c', 'derived']);
  w.tell('@o3 order tax=5');
  const [why] = w.abduce('?i invoice of=$o3 gross=105');
  assert.equal(why.text, 'o3.net=100');
  assert.ok(adopt(w, why).ok);
  assert.equal(w.tier(w.ofType('invoice').find((i) => i.attrs.of[0] === '$o3').id, 'gross'), 'guessed');
  assert.match(new World().tell('?o x a=?a\n@c core.calc out=?g fn=mul args=?a args=2 relation=true\n@t y of=$o g=?g\n@r core.rule when=$o with=$c then=$t').violations[0].why, /fn=add or fn=sub/);
});

test('relation: propagation is local; what needs search is left to the search', () => {
  // x != y, y != z, z != x over {0, 1}: each pair alone is satisfiable, the three together are not
  const w = new World();
  w.load(`
    @s core.slot of=node key=v required=true enum=0 enum=1
    ?a node v=?x
    ?b node v=?x
    @e core.edge a=$a b=$b
    ?edge link a=$a b=$b
    @d core.deny when=$a when=$b when=$edge why="neighbours must differ"
  `);
  w.tell('@x node  @y node  @z node  @l1 link a=$x b=$y  @l2 link a=$y b=$z  @l3 link a=$z b=$x');
  for (const solver of [solvers.cdcl(), solvers.backtrack()]) assert.equal(w.solveReport({ solver }).status, 'unsat', solver.name);
  assert.equal(w.retract('l3').ok, true);
  assert.equal(w.solveReport().status, 'sat', 'a path of three can be coloured');
});
