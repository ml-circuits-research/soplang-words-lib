// Round 28 item 5 (from a host's lessons): knowledge readers every host needs. A lookup made
// once; a word form known only as a core.word; a schema shard whose id is its own path; a
// bundled subset first, then the catalog, with reachable(); listOf; a world-level bundle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, createCatalog, bundleReader, bundleThenRead, listOf, loadBundles } from '../tools/lib-under-test.mjs';

const files = { 'k.a/schema.sop': '@s core.slot of=k.animal key=name id=true', 'k.a/insects.sop': '@ant k.animal name=ant legs=6\n@bee k.animal name=bee legs=6 flies=yes' };
const index = { worlds: [{ id: 'k.a', schema: 'k.a/schema.sop', shards: [{ id: 'k.a/insects', path: 'k.a/insects.sop' }] }] };

test('knowledge: a form known only as a core.word; a schema shard that is its own path; one lookup per word', () => {
  let reads = 0;
  const cat = createCatalog({ index, vocab: { ant: ['k.a/insects'], schema: ['k.a/schema'] }, read: (p) => { reads++; return files[p] ?? null; } });
  const w = new World();
  w.tell('@wf core.word text=ants means=ant');
  assert.deepEqual(cat.shardsOf('ants'), [], 'the vocabulary alone lacks it');
  const r = cat.intoSync(w, 'ants');
  assert.deepEqual([r.ok, r.shards, w.get('ant').attrs.legs], [true, ['k.a/insects'], ['6']], 'found through the loaded core.word');
  assert.deepEqual(cat.plan(['k.a/schema']), ['k.a/schema.sop'], "a shard id that is the schema's own path is read once");
  assert.equal(cat.shardsOf('ant'), cat.shardsOf('ant'), 'the same lookup, made once');
  assert.equal(reads, 2);
});

test('knowledge: a bundled subset first, then the catalog; reachable(); listOf; a world-level bundle', () => {
  const offline = bundleThenRead({ files: { 'k.a/schema.sop': files['k.a/schema.sop'] } }, () => null);
  assert.equal(offline('k.a/schema.sop'), files['k.a/schema.sop'], 'the bundled part answers at once');
  assert.equal(offline.reachable(), true);
  assert.equal(offline('k.a/insects.sop'), null);
  assert.equal(offline.reachable(), false, 'the catalog did not answer');
  const online = bundleThenRead({ files: {} }, (p) => files[p] ?? null);
  assert.equal(online('k.a/insects.sop'), files['k.a/insects.sop']);
  const w = new World();
  w.load('@acts core.use world=std.acts\n@z std.schema.world name=zoo bundle=insects');
  assert.deepEqual(loadBundles(w, { insects: files['k.a/schema.sop'] + '\n' + files['k.a/insects.sop'] }).told, ['insects']);
  assert.deepEqual(loadBundles(w, { insects: 'x' }).told, [], 'told once');
  assert.deepEqual([listOf(w, 'k.animal'), listOf(w, 'k.animal', 'flies', 'yes')], [['ant', 'bee'], ['bee']]);
});
