// Host functions declared in SOP Lang (Round 15): core.function and core.function.arg.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const DECL = `
  @f.distance core.function name=distance out.kind=number pure=true doc="how far apart two positions are"
  @f.distance.a core.function.arg of=$f.distance name=a kind=number
  @f.distance.b core.function.arg of=$f.distance name=b kind=number
  @f.near core.function name=near out.kind=boolean pure=true
  @f.near.a core.function.arg of=$f.near name=a kind=number
  @f.near.b core.function.arg of=$f.near name=b kind=number
  @f.near.within core.function.arg of=$f.near name=within kind=number optional=true
  @f.now core.function name=now out.kind=number
`;
const fns = () => {
  const calls = { distance: 0 };
  let clock = 100;
  return { calls, fns: {
    distance: ([a, b]) => { calls.distance++; return String(Math.abs(Number(a) - Number(b))); },
    near: ([a, b, w = 3]) => Math.abs(Number(a) - Number(b)) <= Number(w),
    now: () => String(clock++),
  } };
};

test('core.function: declarations are listed and checked at load (count, kinds, a check returns boolean)', () => {
  const { fns: f } = fns();
  const w = new World({ fns: f });
  w.load(DECL);
  assert.deepEqual(w.functions().map((x) => [x.name, x.args.map((a) => `${a.name}${a.optional ? '?' : ''}:${a.kind}`), x.out.kind, x.pure, x.registered]), [
    ['distance', ['a:number', 'b:number'], 'number', true, true],
    ['near', ['a:number', 'b:number', 'within?:number'], 'boolean', true, true],
    ['now', [], 'number', false, true],
  ]);
  assert.deepEqual(w.warnings, []);
  const refused = (text) => { const v = new World({ fns: f }); v.load(DECL); try { v.load(text); return null; } catch (e) { return e.message; } };
  assert.match(refused('@p pair a=?a\n@c core.calc out=?d fn=distance args=?a\n@r core.rule when=$p with=$c then=$t\n@t pair core.on=$p d=?d'), /gives distance 1 argument\(s\); it takes 2/);
  assert.match(refused('@p pair a=?a\n@c core.calc out=?d fn=distance args=?a args=far\n@r core.rule when=$p with=$c then=$t\n@t pair core.on=$p d=?d'), /gives distance far as b, which must be number/);
  assert.match(refused('@p pair a=?a b=?b\n@k core.check fn=distance args=?a args=?b\n@r core.deny when=$p if=$k'), /is a check, but distance returns number, not boolean/);
  assert.equal(refused('@p pair a=?a b=?b\n@k core.check fn=near args=?a args=?b\n@r core.deny when=$p if=$k'), null, 'an optional argument may be left out');
  assert.match(refused('@g core.function name=add'), /built-in/);
  assert.match(refused('@g.x core.function.arg of=$nothing name=x'), /is not a core.function/);
});

test('core.function: undeclared and unregistered functions are notes, not errors; a call to an unregistered one gives no result', () => {
  const v = new World({ fns: { twice: ([x]) => String(2 * x) } });
  v.load('@k core.slot of=item key=name');
  assert.deepEqual(v.warnings.map((x) => [x.kind, x.id]), [['undeclared-function', 'twice']]);
  v.load('@f core.function name=twice out.kind=number pure=true\n@f.x core.function.arg of=$f name=x kind=number');
  assert.deepEqual(v.warnings, [], 'declared now: the note goes');
  const u = new World();
  u.load('@f core.function name=ghost out.kind=number\n@f.a core.function.arg of=$f name=a\n@p pair a=?a\n@c core.calc out=?g fn=ghost args=?a\n@t pair core.on=$p g=?g\n@r core.rule when=$p with=$c then=$t');
  assert.deepEqual(u.warnings.map((x) => x.kind), ['unregistered-function']);
  u.tell('@x pair a=1');
  assert.deepEqual([u.get('x').attrs.g, u.warnings.filter((x) => x.called).map((x) => x.id)], [undefined, ['ghost']]);
});

test('core.function: pure results are kept for a step; impure functions are refused in lazy rules and in score and check overlays', () => {
  const { fns: f, calls } = fns();
  const w = new World({ fns: f });
  w.load(DECL + `
    @p pair a=?a b=?b
    @c1 core.calc out=?d fn=distance args=?a args=?b
    @c2 core.calc out=?e fn=distance args=?a args=?b
    @t pair core.on=$p d=?d e=?e
    @r core.rule when=$p with=$c1 with=$c2 then=$t
    @s stamp at=?x
    @cn core.calc out=?n fn=now
    @ts stamp core.on=$s t=?n
    @rs core.rule when=$s with=$cn then=$ts
  `);
  w.tell('@x pair a=2 b=7');
  assert.deepEqual([w.get('x').attrs.d, w.get('x').attrs.e, calls.distance], [['5'], ['5'], 1], 'two calcs, one call');
  // a reading that is only tried: a pure function runs, an impure one refuses it
  const r = w.score([{ wires: '@y pair a=1 b=4' }, { wires: '@z stamp at=1' }]);
  assert.deepEqual(r.candidates.map((c) => [c.ok, c.violations[0]?.kind]), [[true, undefined], [false, 'impure']]);
  assert.equal(w.check({ wires: '@z stamp at=1' }).violations[0].kind, 'impure');
  assert.equal(w.tell('@z stamp at=1').ok, true, 'told for real, it runs');
  // a lazy rule may call only pure functions
  const v = new World({ fns: f });
  assert.throws(() => v.load(DECL + '@q pair a=?a\n@cn core.calc out=?n fn=now\n@tq pair core.on=$q t=?n\n@rq core.rule when=$q with=$cn then=$tq lazy=true'), /lazy rule may call only pure functions; now/);
});

test('core.function: facts never call functions', () => {
  const { fns: f } = fns();
  const w = new World({ fns: f });
  w.load(DECL);
  const r = w.tell('@n note fn=distance args=1 args=2');
  assert.deepEqual([r.ok, r.violations[0].kind, w.has('n')], [false, 'function-in-fact', false]);
});
