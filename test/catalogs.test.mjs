// Several knowledge repositories at once (reviewer 07:15): catalogs in an order of
// precedence; each fact keeps its catalog in its source; two catalogs that define the same
// thing differently are reported and the first one's version stays; std.know.fill then
// fills from what was kept.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, createCatalogs, bundleReader } from '../tools/lib-under-test.mjs';

const src = (x) => String(x.attrs['core.source'][0]).replace(/^"|"$/g, '');

const schema = '@s1 core.slot of=k.furniture key=name id=true\n@s2 core.slot of=k.furniture key=w kind=number';
const catalog = (files, words) => ({ index: { worlds: [{ id: 'k.furniture', schema: 'k.furniture/schema.sop', shards: Object.keys(files).filter((f) => f.includes('shards')).map((f) => ({ id: f.replace(/\.sop$/, ''), path: f })) }] },
  vocab: words, read: bundleReader({ files: { 'k.furniture/schema.sop': schema, ...files } }) });
const A = catalog({ 'k.furniture/shards/a.sop': '@f.sofa k.furniture name=sofa w=200 core.source="shop A"\n@f.bed k.furniture name=bed w=160' }, { sofa: ['k.furniture/shards/a'], bed: ['k.furniture/shards/a'] });
const B = catalog({ 'k.furniture/shards/b.sop': '@g.sofa k.furniture name=sofa w=210 core.source="shop B"\n@g.lamp k.furniture name=lamp w=30\n@f.bed k.furniture name=bed w=160' }, { sofa: ['k.furniture/shards/b'], lamp: ['k.furniture/shards/b'], bed: ['k.furniture/shards/b'] });

test('catalogs: precedence, each fact\'s catalog in its source, conflicts reported, the first version kept', async () => {
  const cats = createCatalogs([{ name: 'repoA', ...A }, { name: 'repoB', ...B }]);
  assert.deepEqual(cats.shardsOf('sofa'), ['repoA:k.furniture/shards/a', 'repoB:k.furniture/shards/b']);
  const w = new World();
  const r = await cats.into(w, 'sofa');
  assert.equal(r.ok, true);
  assert.deepEqual(r.conflicts.map((c) => [c.id, c.kept, c.dropped, c.keys]), [['g.sofa', 'repoA', 'repoB', ['w']]], 'the same sofa, another width: reported');
  assert.deepEqual(w.ofType('k.furniture').filter((x) => x.attrs.name[0] === 'sofa').map((x) => [x.id, x.attrs.w[0], src(x)]), [['f.sofa', '200', 'repoA: shop A']]);
  assert.equal(src(w.get('f.bed')), 'repoA: no source', 'the same bed, the same values: told once, no conflict');
  assert.equal(src(w.get('g.lamp')), 'repoB: no source', 'only in the second: taken from it');
  const swapped = createCatalogs([{ name: 'repoB', ...B }, { name: 'repoA', ...A }]);
  const w2 = new World(); await swapped.into(w2, 'sofa');
  assert.equal(w2.ofType('k.furniture').find((x) => x.attrs.name[0] === 'sofa').attrs.w[0], '210', 'the order decides');
  assert.throws(() => createCatalogs([{ name: 'x', ...A }, { name: 'x', ...B }]), /distinct name/);
});

test('catalogs: std.know.fill fills from the version kept, with its catalog in the source', async () => {
  const w = new World();
  w.load(`@acts core.use world=std.acts\n@know core.use world=std.know\n@home std.schema.world name=home
@any std.schema.kinds world=home from=k.furniture acts=make\n@kf std.know.fill from=k.furniture key=w`);
  await createCatalogs([{ name: 'repoB', ...B }, { name: 'repoA', ...A }]).into(w, 'sofa');
  const m = w.act({ action: 'make', args: { kind: 'sofa' } });
  assert.deepEqual(m.result.filled.map((f) => [f.key, f.value, f.source]), [['w', '210', 'repoB: shop B']]);
});
