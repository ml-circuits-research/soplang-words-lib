// The facts view and the three shallow steps of the reasoning cycle (owner 2026-11-15 14:11), on toy worlds written
// here: factsOf is the same whether built at once or from the last view by the changes since (also across forks);
// deduceState chains to depth 2 and no further; induceStyle and induceCorrections generalise one step.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, factsOf, kindFactsOf, deduceState, induceStyle, induceCorrections, REASONING, valueText } from '../tools/lib-under-test.mjs';

const TOY = `@acts core.use world=std.acts
@t.box core.type of=box extends=std.schema.thing closed=true
@t.ball core.type of=ball extends=std.schema.thing closed=true
@s.in core.slot of=ball key=in type=box
@s.colour core.slot of=ball key=colour enum=red enum=blue
@w std.schema.world name=toy
@k.box std.schema.kind of=box world=toy acts=make acts=remove
@k.ball std.schema.kind of=ball world=toy acts=make acts=remove acts=change acts=connect`;
const toy = () => { const w = new World(); assert.ok(w.load(TOY).ok); return w; };

/** The facts of a world read directly from its wires, for comparison. */
function reference(w) {
  const out = [];
  for (const [id, x] of w.wires) {
    if (x.pattern || x.type.startsWith('core.')) continue;
    for (const [k, vs] of Object.entries(x.attrs)) if (!k.startsWith('core.')) for (const v of vs) out.push(typeof v === 'string' && v[0] === '$' ? `${id} ${k} -> ${v.slice(1)}` : `${id} ${k} = ${valueText(v)}`);
  }
  return out.sort();
}
const flat = (v) => [...v.attributes().map((f) => `${f.thing} ${f.attribute} = ${f.value}`), ...v.relations().map((f) => `${f.thing} ${f.relation} -> ${f.to}`)].sort();

test('factsOf: one flat view of any world, the same built at once or from the changes since, also on a fork', () => {
  const w = toy();
  const v0 = factsOf(w);
  assert.equal(factsOf(w), v0, 'kept while the version stays');
  w.act({ action: 'make', args: { kind: 'box' } });
  w.act({ action: 'make', args: { kind: 'ball', colour: 'red', in: '$box1' } });
  const v1 = factsOf(w);
  assert.ok(v1.depth >= 1, 'built from the last view');
  assert.deepEqual(flat(v1), reference(w));
  assert.deepEqual([v1.ofKind('ball'), v1.related('ball1', 'in'), v1.inbound('box1')], [['ball1'], ['box1'], ['ball1']]);
  const f = w.fork();
  for (let i = 0; i < 4; i++) f.act({ action: 'make', args: { kind: 'ball', colour: i % 2 ? 'red' : 'blue', in: '$box1' } }); // bounded: four
  f.act({ action: 'connect', args: { a: '$ball1', b: '$ball2' } });
  f.act({ action: 'remove', args: { thing: '$ball3' } });
  f.undo();
  f.act({ action: 'change', args: { thing: '$ball2', colour: 'red' } });
  const vf = factsOf(f);
  assert.deepEqual(flat(vf), reference(f), 'the fork, from the view of the world it came from');
  assert.deepEqual(flat(factsOf(w)), reference(w), 'the world it came from is untouched');
  assert.deepEqual(vf.ofKind('ball'), ['ball1', 'ball2', 'ball3', 'ball4', 'ball5']);
  // a rollback (a refused change) and a rewind give the same view as a fresh reading
  f.tell('@x ball colour=green');
  assert.deepEqual(flat(factsOf(f)), reference(f));
});

const KF = new World();
KF.load(`@t1 core.type of=ex.thing
@t2 core.type of=ex.parent
@a ex.thing name=ball at=box
@b ex.thing name=box material=card
@p ex.parent name=bag is_a=box key=kind
@q ex.parent name=crate is_a=bag key=kind
@r ex.parent name=bin is_a=crate key=kind`);
const KINDS = [{ type: 'ex.thing', by: 'name' }, { type: 'ex.parent', by: 'name', key: 'key', value: 'value', parent: 'is_a' }];

test('deduceState: forward chaining to depth 2 (a ball is at a box; a bag is a box; a crate is a bag; a bin is too far), joins, bounds', () => {
  const kindFacts = kindFactsOf(KF, KINDS);
  assert.deepEqual(kindFacts.get('ball'), [{ attribute: 'at', value: 'box', from: 'ex.thing' }]);
  const w = new World();
  w.load(`${TOY}
@t.bag core.type of=bag extends=std.schema.thing closed=true
@t.crate core.type of=crate extends=std.schema.thing closed=true
@t.bin core.type of=bin extends=std.schema.thing closed=true
@s.on core.slot of=ball key=on type=std.schema.thing`);
  w.tell('@box1 box kind=box  @bag1 bag kind=bag  @crate1 crate kind=crate  @bin1 bin kind=bin');
  w.tell('@b1 ball kind=ball in=$box1  @b2 ball kind=ball on=$bag1  @b3 ball kind=ball on=$crate1  @b4 ball kind=ball on=$bin1  @b5 ball kind=ball');
  const v = factsOf(w);
  const d = deduceState(v, ['b1', 'b2', 'b3', 'b4', 'b5'], { kindFacts, placeable: () => true });
  assert.deepEqual(d.soft.map((x) => x.thing), ['b4', 'b5'], 'b1 by its kind, b2 in one step, b3 in two; b4 would need three; b5 is nowhere');
  assert.equal(d.cost, 2 + 0.25 * 1 + 0.25 * 2, 'two soft violations, and the chains of b2 and b3 cost their steps');
  assert.deepEqual(deduceState(v, ['b2', 'b3'], { kindFacts, depth: 1, placeable: () => true }).soft.map((x) => x.thing), ['b3'], 'depth 1: no parent of a parent');
  // a relation to a thing that is not there is hard; so are the bounds of the request
  // (a World refuses such a reference when told; a view of any other source is checked the same way)
  const loose = { thing: (id) => (id === 'l' ? { id, kinds: ['link'], attrs: new Map(), rels: [{ relation: 'b', to: 'b9' }] } : undefined), related: () => [] };
  assert.match(deduceState(loose, ['l'], { kindFacts }).hard[0].why, /b9, which is not there/);
  const h = deduceState(v, ['b1'], { kindFacts, bounds: { count: [2, 3], not: ['ball'], items: ['b1'] } }).hard.map((x) => x.why);
  assert.deepEqual(h, ['b1 is of a kind not wanted', '1 made, the request said 2 to 3']);
  // the tick budget stops the chaining
  assert.equal(deduceState(v, ['b1', 'b2', 'b3', 'b4'], { kindFacts, budget: { ticks: 1, used: 0 } }).exhausted, true);
  assert.ok(REASONING.depth === 2 && REASONING.candidates === 5);
});

test('induceStyle and induceCorrections: anti-unification, one step', () => {
  const w = toy();
  w.act({ action: 'make', args: { kind: 'ball', colour: 'blue' } });
  w.act({ action: 'make', args: { kind: 'ball', colour: 'blue' } });
  assert.equal(induceStyle(factsOf(w), ['ball']), null, 'two are not enough');
  w.act({ action: 'make', args: { kind: 'ball', colour: 'blue' } });
  assert.deepEqual(induceStyle(factsOf(w), ['ball'], { keys: () => ['colour'] }), { of: 'ball', n: 3, pattern: { colour: 'blue' } });
  assert.deepEqual(induceStyle(factsOf(w), ['ball'], { keys: () => ['colour'], except: new Set(['ball1']) }), null, 'the things a revision replaces do not count');
  w.act({ action: 'make', args: { kind: 'ball', colour: 'red' } });
  assert.deepEqual(induceStyle(factsOf(w), ['ball'], { keys: () => ['colour'] }).pattern, {}, 'they differ: nothing is induced');
  assert.deepEqual(induceCorrections([{ on: 'count', step: 'up' }, { on: 'size', step: 'down' }, { on: 'size', step: 'down' }]), { on: 'size', step: 'down', n: 2 });
  assert.equal(induceCorrections([{ on: 'size', step: 'up' }, { on: 'size', step: 'down' }]), null);
});
