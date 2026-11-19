import test from 'node:test';
import assert from 'node:assert/strict';

const bundle = process.env.SOPWORLD_BUNDLE === '1';
const { World, parse } = await import(bundle ? '../docs/sopworld.mjs' : '../src/index.mjs');

// An invented policy: knowledge steps cost 0.5, spelling repair is admitted up to 2,
// and a candidate of another reader family is a secondary preference.
const policy = `
@use.ground core.use world=std.ground
@use.choice core.use world=std.choice
@use.decide core.use world=std.decide
@kinds std.ground.policy name=example.kind measure=distance maxSpelling=2 stepCost=0.5 maxSteps=3 follow=kind_of
@c1 std.decide.criterion of=example.kind n=1 name=lexical measure=distance dir=min
@c2 std.decide.criterion of=example.kind n=2 name=family measure=otherType dir=min
`;
function setup() {
  const world = new World();
  assert.equal(world.tell(policy).ok, true);
  return world;
}
const packet = (mention, lemmas, edges = []) => [
  `@g std.ground.request policy=example.kind mention="${mention}" ${lemmas.map((_, i) => 'candidate=$k' + i).join(' ')} ${edges.map((_, i) => 'edge=$e' + i).join(' ')}`,
  ...lemmas.map((lemma, i) => `@k${i} std.ground.candidate lemma="${lemma}" measurement=$t${i}\n@t${i} std.choice.measurement metric=otherType value=0`),
  ...edges.map(([from, to], i) => `@e${i} std.ground.edge from="${from}" to="${to}" relation=kind_of`),
].join('\n');
const outcome = text => {
  const rows = parse(text), result = rows.find(row => row.type === 'std.ground.result');
  const lemmaOf = token => token && /lemma="([^"]+)"/.exec(currentPacket.split('\n').find(line => line.startsWith('@' + token.slice(1) + ' ')))?.[1];
  return { result, rows, selected: lemmaOf(result?.attrs.selected?.[0]), ties: (result?.attrs.tie ?? []).map(lemmaOf),
    alternatives: (result?.attrs.alternative ?? []).map(lemmaOf) };
};
let currentPacket = '';
const run = (world, ...args) => outcome(world.compileRequest(currentPacket = packet(...args)));

test('a knowledge relation keeps a semantic candidate that spelling repair alone would drop', () => {
  const world = setup(), before = world.toJSON();
  // "man" -> person is 4+ edits away, but the knowledge declares man kind_of person.
  const { selected, alternatives, rows } = run(world, 'man', ['person', 'moon', 'sun'], [['man', 'person']]);
  assert.equal(selected, 'person');
  assert.deepEqual(alternatives, ['moon', 'sun']);
  const evidence = rows.filter(row => row.type === 'std.ground.evidence').map(row => [row.attrs.route[0], row.attrs.cost?.[0]]);
  assert.deepEqual(evidence, [['knowledge', '0.5'], ['spelling', '1.5'], ['spelling', '2']]);
  assert.deepEqual(world.toJSON(), before);
});

test('without the relation the same spelling policy chooses by repair cost', () => {
  const { selected } = run(setup(), 'man', ['person', 'moon', 'sun']);
  assert.equal(selected, 'moon');
});

test('an exact tie stays visible and does not depend on enumeration order', () => {
  const world = setup();
  const forward = run(world, 'cap', ['cat', 'car']), reverse = run(world, 'cap', ['car', 'cat']);
  assert.equal(forward.selected, reverse.selected);
  assert.equal(forward.ties.length, 1);
  assert.deepEqual([forward.selected, ...forward.ties].sort(), ['car', 'cat']);
});

test('an inflected form and an exact match outrank more distant candidates', () => {
  const world = setup();
  assert.equal(run(world, 'houses', ['horse', 'house', 'mouse']).selected, 'house');
  assert.equal(run(world, 'House', ['house', 'mouse']).selected, 'house');
});

test('traversal is bounded by maxSteps and follows only declared relations', () => {
  const world = setup(), chain = [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'person']];
  const far = run(world, 'a', ['person'], chain);
  assert.equal(far.result.attrs.status[0], 'unavailable');
  const near = run(world, 'a', ['d'], chain);
  assert.equal(near.selected, 'd');
});

test('grounding rejects unknown policies, unowned wires and measurements that override the policy measure', () => {
  const world = setup(), reason = text => parse(world.compileRequest(text))[0].attrs.reason?.[0];
  const valid = packet('man', ['person'], [['man', 'person']]);
  assert.equal(reason(valid.replace('policy=example.kind', 'policy=missing')), 'ground-policy');
  assert.equal(reason(valid + '\n@x std.ground.edge from="a" to="b" relation=kind_of'), 'unowned-ground-wire');
  assert.equal(reason(valid.replace('metric=otherType', 'metric=distance')), 'invalid-ground-measurement');
});

test('a large candidate set is filtered by admission before the choice budget', () => {
  const world = setup(), lemmas = Array.from({ length: 1000 }, (_, i) => 'zz' + i.toString(36) + 'q');
  const { selected, result } = run(world, 'house', [...lemmas, 'house', 'horse']);
  assert.equal(selected, 'house');
  assert.equal(result.attrs.dropped, undefined);
});
