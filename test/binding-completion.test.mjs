import test from 'node:test'; import assert from 'node:assert/strict';
import { completeStructuralBindings, populationPairs, readingOrder, POPULATION_PATTERNS, nearestRelative } from '../tools/lib-under-test.mjs';

// An invented toy interface: a sketch area whose blobs are made (kind discriminator `shape`) and changed.
const P = (operation, act, parameter, extra = {}) => ({ world: 'toy.sketch', sourceSha256: 'a'.repeat(64), wire: operation + '.' + parameter, operation, act, sourceType: 'toy.blob', parameter, kind: 'string', ...extra });
const parameters = [
  P('blob.make', 'make', 'shape', { enum: ['round', 'square_box'] }), P('blob.make', 'make', 'tint'), P('blob.make', 'make', 'x', { kind: 'number' }),
  P('blob.change', 'change', 'ids'), P('blob.change', 'change', 'tint'), P('blob.change', 'change', 'size', { kind: 'number', unit: 'px' }), P('blob.change', 'change', 'glow', { kind: 'boolean' }),
];
const kind = (lemma, canonical, binding) => ({ area: 'sketch', type: 'blob', lemma, canonical, sourceWire: 'w.' + lemma, sourceSnapshotSHA: 'b'.repeat(64), sourceWorld: 'toy', moduleVersion: '1', ...(binding ? { nativeFamilyBinding: binding } : {}) });
const table = () => ({
  families: [{ area: 'sketch', type: 'blob', canonical: 'toy.blob', sourceWire: 'w', sourceWorld: 'toy', moduleVersion: '1', sourceSnapshotSHA: 'b'.repeat(64) }],
  kinds: [kind('blob', 'toy.blob'), kind('round blob', 'toy.round', { operation: 'blob.make', sourceType: 'toy.blob', arguments: { shape: 'round' } }), kind('tall round blob', 'toy.round', { operation: 'blob.make', sourceType: 'toy.blob' })],
  properties: [{ area: 'sketch', key: 'blob.size', canonical: 'toy.blob.size', hostBinding: { sourceType: 'toy.blob', parameter: 'size', operation: 'blob.change' } }],
  coverage: [{ status: 'unbound', reason: 'no-native-parameter', area: 'sketch', key: 'blob.glow' }],
});

test('structural bindings: numbers, units, keys by name, the shared family binding, modifiers and native values', () => {
  const input = table();
  const out = completeStructuralBindings(input, { parameters, unboundParameters: ['ids', 'x'], preferActs: ['change'], discriminator: 'shape', valueWords: new Map([['square_box', new Set(['cube'])]]) });
  assert.equal(input.properties.length, 1, 'the input table is not changed');
  const prop = (key) => out.properties.find((p) => p.key === key);
  assert.deepEqual([prop('blob.size').numeric, prop('blob.size').unit], [true, 'px']);
  assert.equal(prop('blob.glow').hostBinding.parameter, 'glow');
  assert.equal(prop('blob.tint').hostBinding.operation, 'blob.change', 'a preferred act first');
  assert.ok(!prop('blob.ids') && !prop('blob.x'), 'unbound parameters never bind by name');
  assert.equal(out.families[0].nativeFamilyBinding.operation, 'blob.make');
  const lemmas = out.kinds.filter((k) => k.alignment?.kind === 'native-enum-value').map((k) => k.lemma);
  assert.deepEqual(lemmas.sort(), ['cube', 'square box', 'square_box']);
  assert.ok(Object.isFrozen(out));
});

test('structural bindings: declared key alignments with said values, families and relation pairs', () => {
  const base = table();
  base.properties.push({ area: 'sketch', key: 'blob.near', canonical: 'toy.near', projection: { kind: 'relation', values: { near: 'near' } } }, { area: 'sketch', key: 'blob.anchor', canonical: 'toy.anchor', projection: { kind: 'relation-anchor' } });
  const out = completeStructuralBindings(base, { parameters,
    keyAlignments: [{ area: 'sketch', key: 'blob.shine', operation: 'blob.change', parameter: 'glow', values: [{ said: 'on', value: 'true' }], authority: 'toy' }],
    relations: [{ id: 'r', area: 'sketch', key: 'blob.beside', anchor: 'blob.other', like: 'blob.near', values: { beside: 'near' }, sourceWorld: 'toy.policy', authority: 'toy' }],
    families: [{ area: 'sketch', type: 'spot', kind: 'toy.round', authority: 'toy' }] });
  const shine = out.properties.find((p) => p.key === 'blob.shine');
  assert.deepEqual(shine.valueMap, [{ said: 'on', value: true }]);
  assert.equal(out.properties.find((p) => p.key === 'blob.beside').projection.kind, 'relation');
  assert.equal(out.properties.find((p) => p.key === 'blob.other').projection.kind, 'relation-anchor');
  assert.equal(out.families.find((f) => f.type === 'spot').canonical, 'toy.round');
});

test('population patterns: chain, cycle, every pair, star; reading order', () => {
  const m = ['a', 'b', 'c'].map((id) => ({ id }));
  assert.deepEqual(POPULATION_PATTERNS, ['chain', 'cycle', 'all', 'star']);
  assert.deepEqual(populationPairs(m, 'chain'), [['a', 'b'], ['b', 'c']]);
  assert.deepEqual(populationPairs(m, 'cycle'), [['a', 'b'], ['b', 'c'], ['c', 'a']]);
  assert.deepEqual(populationPairs(m, 'all'), [['a', 'b'], ['a', 'c'], ['b', 'c']]);
  assert.deepEqual(populationPairs(m, 'star', { hub: 'b', hubFirst: true }), [['b', 'a'], ['b', 'c']]);
  assert.equal(populationPairs(m, 'all', { max: 2 }), null);
  assert.equal(populationPairs(m, 'spiral'), null);
  const boxes = [{ id: 'r', x: 50, y: 0, height: 10 }, { id: 'l', x: 0, y: 2, height: 10 }, { id: 'd', x: 0, y: 40, height: 10 }];
  assert.deepEqual(readingOrder(boxes).map((o) => o.id), ['l', 'r', 'd']);
});

test('nearest relative: an acceptable near parent first, else the most weighted shared traits', async () => {
  const members = new Map([['pet', new Set(['cat', 'dog', 'fish'])], ['legs', new Set(['cat', 'dog'])], ['furry', new Set(['cat'])]]);
  const own = [{ key: 'pet', parent: 'pet', dimension: 'kind' }, { key: 'legs', parent: 'legs', dimension: 'feature' }, { key: 'furry', parent: 'furry', dimension: 'feature' }];
  const drawable = new Set(['dog', 'fish', 'cat']);
  assert.deepEqual(await nearestRelative({ own, members, seen: 10, near: ['kind'], weights: { feature: 1 }, accept: (n) => drawable.has(n) }), { name: 'cat', via: 'shared', score: Math.log(10 / 2) + Math.log(10) });
  drawable.add('pet');
  assert.deepEqual(await nearestRelative({ own, members, seen: 10, near: ['kind'], weights: { feature: 1 }, accept: (n) => drawable.has(n) }), { name: 'pet', via: 'parent' });
  assert.equal(await nearestRelative({ own, members, seen: 10, accept: () => false }), null);
});
