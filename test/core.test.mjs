import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, parse, format, str, quote, SopError, unify, walk } from '../tools/lib-under-test.mjs';
import { mechanics, family } from '../examples/worlds.mjs';

test('parser: wires, multi-line, repeated keys, strings, comments', () => {
  const ws = parse(`
    # a comment
    @b1 phys.mech.body
        mass=2kg  label="a \\"big\\" body"   # trailing comment
    ?f force on=$b1 on=$b2 magnitude=?F
  `);
  assert.equal(ws.length, 2);
  assert.deepEqual(ws[0], { id: 'b1', type: 'phys.mech.body', attrs: { mass: ['2kg'], label: ['"a \\"big\\" body"'] }, pattern: false });
  assert.equal(str(ws[0].attrs.label[0]), 'a "big" body');
  assert.equal(ws[1].pattern, true);
  assert.deepEqual(ws[1].attrs.on, ['$b1', '$b2']);
  assert.equal(quote('say "hi"'), '"say \\"hi\\""');
});

test('parser: round trip and errors', () => {
  const text = '@a t k=v s="x y" r=$b\n?p t k=?v';
  assert.equal(parse(text).map((w) => format(w)).join('\n'), text);
  assert.throws(() => parse('@a'), SopError);
  assert.throws(() => parse('k=v'), SopError);
  assert.throws(() => parse('@a t novalue'), SopError);
  assert.throws(() => parse('@a t s="open'), SopError);
});

test('unify: variables, wire references, failure', () => {
  let s = unify('?x', 'a');
  assert.equal(walk('?x', s), 'a');
  s = unify('$?p', '$w1', s);
  assert.equal(walk('?p', s), 'w1');
  assert.equal(walk('$?p', s), '$w1');
  assert.equal(unify('?x', 'b', s), null);
  assert.equal(unify('$a', '$b', s), null);
  assert.equal(unify('$?p', 'atom', s), null);
});

test('deduction: an open key is filled by a rule with a calculation', () => {
  const w = new World();
  assert.ok(w.tell(mechanics).ok);
  const r = w.tell('@b1 body mass=2  @f1 force on=$b1 magnitude=10  @a1 acceleration of=$b1');
  assert.ok(r.ok);
  assert.deepEqual(r.filled, [{ id: 'a1', key: 'magnitude', value: '5', via: 'newton2' }]);
  assert.equal(format(w.get('a1')), '@a1 acceleration of=$b1 magnitude=5');
  const why = w.explain('a1');
  assert.equal(why.fills[0].via, 'newton2');
  assert.deepEqual(why.from.map((n) => n.id).sort(), ['b1', 'f1']);
});

test('deduction: a missing wire is created, with provenance', () => {
  const w = new World();
  w.tell(mechanics);
  const r = w.tell('@b1 body mass=4  @f1 force on=$b1 magnitude=10');
  assert.equal(r.derived.length, 1);
  const a = w.get(r.derived[0]);
  assert.equal(a.type, 'acceleration');
  assert.deepEqual(a.attrs, { of: ['$b1'], magnitude: ['2.5'] });
  assert.equal(a.meta.via, 'newton2');
  assert.match(w.toSOP({ provenance: true }), /core\.via=\$newton2 core\.from=\$b1 core\.from=\$f1/);
});

test('deduction is incremental and order independent', () => {
  const a = new World(), b = new World();
  a.tell(mechanics); b.tell(mechanics);
  a.tell('@b1 body mass=2'); a.tell('@f1 force on=$b1 magnitude=10');
  b.tell('@b1 body mass=2  @f1 force on=$b1 magnitude=10');
  assert.equal(a.ask('?a acceleration magnitude=?v')[0].v, '5');
  assert.equal(b.ask('?a acceleration magnitude=?v')[0].v, '5');
  // rules told after the facts still apply
  const c = new World();
  c.tell('@b1 body mass=2  @f1 force on=$b1 magnitude=10');
  c.tell(mechanics);
  assert.equal(c.ask('?a acceleration magnitude=?v')[0].v, '5');
});

test('refusal: deny constraint, and the world is left untouched', () => {
  const w = new World();
  w.tell(mechanics);
  w.tell('@b1 body mass=2');
  const before = w.toSOP();
  const r = w.tell('@b2 body mass=0  @f2 force on=$b2 magnitude=1');
  assert.equal(r.ok, false);
  assert.equal(r.violations[0].kind, 'deny');
  assert.equal(r.violations[0].why, 'mass must be positive');
  assert.deepEqual(r.violations[0].wires, ['b2']);
  assert.equal(w.toSOP(), before);
  assert.equal(w.has('b2'), false);
  assert.equal(w.has('f2'), false);
  assert.equal(w.log.length, 2);
});

test('refusal: conflict with a derived value (identity key)', () => {
  const w = new World();
  w.tell(mechanics);
  w.tell('@b1 body mass=2  @f1 force on=$b1 magnitude=10');
  const r = w.tell('@a9 acceleration of=$b1 magnitude=7');
  assert.equal(r.ok, false);
  assert.deepEqual([r.violations[0].kind, r.violations[0].have, r.violations[0].want], ['conflict', '5', '7']);
  // the same statement with the right value is merged into the existing wire
  const ok = w.tell('@a9 acceleration of=$b1 magnitude=5');
  assert.ok(ok.ok);
  assert.equal(ok.merged[0].id, 'a9');
  assert.equal(w.get('a9'), w.get(ok.merged[0].into));
  assert.equal(w.ofType('acceleration').length, 1);
});

test('refusal: dangling reference, duplicate id, variables in facts', () => {
  const w = new World();
  assert.equal(w.tell('@f1 force on=$nobody').violations[0].kind, 'dangling-ref');
  w.tell('@b1 body mass=1');
  assert.equal(w.tell('@b1 body mass=3').violations[0].kind, 'duplicate-id');
  assert.equal(w.tell('@x body mass=?m').violations[0].kind, 'syntax');
});

test('matrix errors are reported, not thrown', () => {
  const w = new World();
  let r = w.tell('?p a k=?x\n@t b k=?x\n@r core.rule when=$p then=$missing');
  assert.equal(r.ok, false);
  assert.ok(r.violations.some((v) => v.kind === 'schema' && /then=\$missing/.test(v.why)));
  r = w.tell('?p a k=$typo\n@t b k=1\n@r core.rule when=$p then=$t');
  assert.match(r.violations[0].why, /unknown wire \$typo/);
  r = w.tell('?p a k=?x\n@c core.calc out=?y fn=nope args=?x\n@t b k=?y\n@r core.rule when=$p with=$c then=$t');
  assert.match(r.violations[0].why, /unknown calc function/);
  assert.equal(w.matrix.size, 0);
});

test('recursive rules reach a fixpoint; cycles are refused by a deny', () => {
  const w = new World();
  w.tell(family);
  w.tell('@e1 parent of=ana child=bogdan  @e2 parent of=bogdan child=carla  @e3 parent of=carla child=dan');
  assert.deepEqual(w.ask('?a ancestor of=?who desc=dan').map((x) => x.who).sort(), ['ana', 'bogdan', 'carla']);
  assert.equal(w.ofType('ancestor').length, 6);
  const r = w.tell('@e4 parent of=dan child=ana');
  assert.equal(r.ok, false);
  assert.equal(r.violations[0].why, 'nobody is their own ancestor');
  assert.equal(w.ofType('ancestor').length, 6);
});

test('runaway derivations are stopped by the depth budget', () => {
  const w = new World({ maxDepth: 5 });
  w.tell('?n num v=?x\n@c core.calc out=?y fn=add args=?x args=1\n@m num v=?y\n@succ core.rule when=$n with=$c then=$m');
  const r = w.tell('@n0 num v=0');
  assert.equal(r.ok, false);
  assert.equal(r.violations[0].kind, 'depth');
  assert.equal(w.ofType('num').length, 0);
});

test('negation: a rule fires only while nothing matches the negated pattern', () => {
  const w = new World();
  w.tell(`
    ?t task name=?n
    ?o owner of=$t
    @u unassigned task=$t
    @flag core.rule when=$t not=$o then=$u
  `);
  w.tell('@t1 task name=write  @t2 task name=review  @o1 owner of=$t1 who=ana');
  assert.deepEqual(w.ask('?u unassigned task=?t').map((x) => x.t), ['$t2']);
});

test('custom functions and ordering test', () => {
  const w = new World({ fns: { upper: ([a]) => a.toUpperCase() } });
  w.tell(`
    ?p person name=?n
    @c core.calc out=?N fn=upper args=?n
    @b badge for=$p text=?N
    @mk core.rule when=$p with=$c then=$b

    ?pay payment for=$ord
    ?ord order item=?i
    @t core.check fn=before args=$pay args=$ord
    @d core.deny when=$pay when=$ord if=$t why="payment before order"
  `);
  w.tell('@p1 person name=ana');
  assert.equal(w.ask('?b badge text=?t')[0].t, 'ANA');
  assert.ok(w.tell('@o1 order item=book  @pay1 payment for=$o1').ok);
  // a payment cannot even be stated before its order exists
  assert.equal(w.tell('@pay2 payment for=$o2').ok, false);
});

test('history: retract removes dependants and derived wires; fork is independent', () => {
  const w = new World();
  w.tell(family);
  w.tell('@e1 parent of=ana child=bogdan');
  w.tell('@e2 parent of=bogdan child=carla');
  w.tell('@note remark about=$e2 text="check this"');
  assert.equal(w.ofType('ancestor').length, 3);
  const f = w.fork();
  const r = w.retract('e2');
  assert.deepEqual(r.removed.filter((x) => !x.startsWith('_')).sort(), ['e2', 'note']);
  assert.equal(r.removed.length, 4, 'two told wires and the two ancestor wires that rested on e2');
  assert.equal(w.ofType('ancestor').length, 1);
  assert.equal(w.has('note'), false);
  assert.equal(f.ofType('ancestor').length, 3);
  const ops = w.history().map((e) => e.op);
  assert.ok(ops.includes('derive') && ops.at(-1) === 'retract');
  // the retracted fact can be told again
  assert.ok(w.tell('@e2 parent of=bogdan child=carla').ok);
  assert.equal(w.ofType('ancestor').length, 3);
});

test('dry run evaluates without changing anything', () => {
  const w = new World();
  w.tell(mechanics);
  const r = w.tell('@b1 body mass=2  @f1 force on=$b1 magnitude=10', { dry: true });
  assert.ok(r.ok);
  assert.equal(r.derived.length, 1);
  assert.equal(w.wires.size, 0);
  assert.equal(w.log.length, 1);
  assert.equal(w.firings.size, 0);
});

test('the log keeps what was told, not what the wires grew into', () => {
  const w = new World();
  w.tell(mechanics);
  w.tell('@b1 body mass=2  @a1 acceleration of=$b1');
  w.tell('@f1 force on=$b1 magnitude=10');
  assert.equal(w.get('a1').attrs.magnitude[0], '5');
  w.retract('f1');
  assert.equal(w.get('a1').attrs.magnitude, undefined, 'the derived value went with its cause');
  assert.ok(w.tell('@f2 force on=$b1 magnitude=4').ok);
  assert.equal(w.get('a1').attrs.magnitude[0], '2');
});

test('core.check is the condition wire; core.test still works when a rule links it, and is a fact otherwise', () => {
  const w = new World();
  w.load(`
    ?b box size=?n
    @big core.check fn=gt args=?n args=10
    @old core.test fn=lt args=?n args=100
    @l large of=$b
    @r core.rule when=$b if=$big if=$old then=$l
  `);
  w.load('@b1 box size=50  @b2 box size=5  @b3 box size=500');
  assert.deepEqual(w.ask('?l large of=?b').map((x) => x.b), ['$b1'], 'both conditions apply');
  // a host's own wires of type core.test (test cases, say) are ordinary facts
  const r = w.tell('@case1 core.test input="hello" expect="world"');
  assert.ok(r.ok);
  assert.equal(w.get('case1').type, 'core.test');
  assert.equal(w.matrix.has('case1'), false);
});

test('build: the library says which version and build it is, and docs/version.md says the same', async () => {
  const lib = await import('../tools/lib-under-test.mjs');
  const { readFileSync } = await import('node:fs');
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(lib.version, pkg.version);
  assert.equal(lib.build.version, pkg.version);
  if (process.env.SOPWORLD_BUNDLE) {
    const text = readFileSync(new URL('../docs/version.md', import.meta.url), 'utf8');
    assert.match(lib.build.hash, /^[0-9a-f]{12}$/);
    assert.match(lib.build.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(text.includes(`| Version | ${pkg.version} |`) && text.includes(`| Build | ${lib.build.hash} |`) && text.includes(`| Built | ${lib.build.date} |`));
    assert.ok(readFileSync(new URL('../docs/sopworld.mjs', import.meta.url), 'utf8').startsWith(`// sopworld ${pkg.version} (build ${lib.build.hash}, ${lib.build.date})`));
  } else {
    assert.deepEqual([lib.build.hash, lib.build.date], [null, null], 'run from src/: not a build');
  }
});
