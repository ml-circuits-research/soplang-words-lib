// Loading knowledge by lookup (Round 24, A1): a catalog (index + vocabulary) over the CC0
// knowledge fixtures; shards read once through the host's reader, schemas first; an offline
// bundle read by the same code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync as require_write } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { World, createCatalog, bundleReader } from '../tools/lib-under-test.mjs';

const DIR = new URL('../bench/fixtures/knowledge/', import.meta.url).pathname;
const index = { worlds: [
  { id: 'k.commonsense', schema: 'k.commonsense/schema.sop', depends: [], shards: [{ id: 'k.commonsense/shards/core', path: 'k.commonsense/shards/core.sop' }] },
  { id: 'k.objects', schema: 'k.objects/schema.sop', depends: ['k.commonsense'], shards: [{ id: 'k.objects/shards/household', path: 'k.objects/shards/household.sop' }, { id: 'k.objects/shards/animals', path: 'k.objects/shards/animals.sop' }] },
] };
const vocab = { cup: ['k.objects/shards/household'], fish: ['k.commonsense/shards/core'], cat: ['k.objects/shards/animals'] };
const reader = () => { const reads = []; return { reads, read: (p) => { reads.push(p); return existsSync(join(DIR, p)) ? readFileSync(join(DIR, p), 'utf8') : null; } }; };

test('catalog: a word brings its shards and their schemas (dependencies first), each read once', async () => {
  const { reads, read } = reader();
  const cat = createCatalog({ index, vocab, read });
  assert.deepEqual(cat.shardsOf('Cup'), ['k.objects/shards/household']);
  assert.deepEqual(cat.plan(cat.shardsOf('cup')), ['k.commonsense/schema.sop', 'k.objects/schema.sop', 'k.objects/shards/household.sop']);
  const w = new World();
  const r = await cat.into(w, 'cup');
  assert.deepEqual([r.ok, r.told.length], [true, 3]);
  assert.ok(w.ofType('k.objects.part').some((p) => p.attrs.of[0] === 'cup'));
  const again = await cat.into(w, 'cat');
  assert.deepEqual(again.told, ['k.objects/shards/animals.sop'], 'schemas are told once per world');
  await cat.into(new World(), 'cup');
  assert.equal(reads.filter((p) => p === 'k.objects/schema.sop').length, 1, 'read once, then from the cache');
});

test('catalog: the lemma is the host\'s; a missing shard is an error and is read again next time', async () => {
  const cat = createCatalog({ index, vocab, read: reader().read, lemma: (w) => (w.endsWith('s') ? [w.slice(0, -1)] : []) });
  assert.deepEqual(cat.shardsOf('cups'), ['k.objects/shards/household']);
  assert.deepEqual(createCatalog({ index, vocab, read: () => null }).shardsOf('cups'), [], 'no language built in');
  let n = 0;
  const flaky = createCatalog({ index, vocab, read: (p) => (++n === 1 ? null : readFileSync(join(DIR, p), 'utf8')) });
  await assert.rejects(flaky.fetch('fish'), /nothing at k.commonsense\/schema.sop/);
  assert.equal((await flaky.fetch('fish')).length, 2);
});

test('an offline bundle: tools/build-bundle.mjs writes the shards a list of words needs; bundleReader reads them', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-'));
  const cdir = join(dir, 'cat');
  execFileSync('mkdir', ['-p', cdir]);
  execFileSync('cp', ['-r', join(DIR, 'k.commonsense'), join(DIR, 'k.objects'), cdir]);
  require_write(join(cdir, 'index.json'), JSON.stringify(index));
  require_write(join(cdir, 'vocab.json'), JSON.stringify(vocab));
  const out = join(dir, 'b.json');
  const msg = execFileSync(process.execPath, ['tools/build-bundle.mjs', cdir, out, 'cup'], { encoding: 'utf8' });
  assert.match(msg, /3 files \(1 shards\), 1 words/);
  const b = JSON.parse(readFileSync(out, 'utf8'));
  const cat = createCatalog({ index: b.index, vocab: b.vocab, read: bundleReader(b) });
  const w = new World();
  assert.equal((await cat.into(w, 'cup')).ok, true);
  assert.ok(w.ofType('k.objects.part').length > 0);
  assert.deepEqual(cat.shardsOf('cat'), [], 'only what was bundled');
});
