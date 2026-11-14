// Loading knowledge by lookup (Round 24, A1): a catalog (index + vocabulary) over the published
// knowledge worlds (sop-knowledge-worlds at the commit in worlds.pin, read in place; skipped offline); shards read once through the host's reader, schemas first; an offline
// bundle read by the same code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync as require_write } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { World, createCatalog, bundleReader } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';

const ROOT = worldsDir();
const DIR = ROOT ? `${ROOT}docs/worlds/` : '';
const skip = !ROOT && 'sop-knowledge-worlds cannot be read here (offline)';
const index = ROOT ? JSON.parse(readFileSync(`${DIR}index.json`, 'utf8')) : { worlds: [] }; // the published index: worlds, their schemas, dependencies and shards
const vocab = { cup: ['k.objects/shards/household'], fish: ['k.commonsense/shards/core'], cat: ['k.objects/shards/animals'] };
const reader = () => { const reads = []; return { reads, read: (p) => { reads.push(p); return existsSync(join(DIR, p)) ? readFileSync(join(DIR, p), 'utf8') : null; } }; };

test('catalog: a word brings its shards and their schemas (dependencies first), each read once', { skip }, async () => {
  const { reads, read } = reader();
  const cat = createCatalog({ index, vocab, read });
  assert.deepEqual(cat.shardsOf('Cup'), ['k.objects/shards/household']);
  const plan = cat.plan(cat.shardsOf('cup'));
  assert.equal(plan[plan.length - 1], 'k.objects/shards/household.sop', 'the shard last');
  assert.ok(plan.indexOf('k.commonsense/schema.sop') < plan.indexOf('k.objects/schema.sop'), 'a dependency before the world that needs it');
  assert.ok(plan.slice(0, -1).every((x) => x.endsWith('/schema.sop')), 'schemas first');
  const w = new World();
  const r = await cat.into(w, 'cup');
  assert.deepEqual([r.ok, r.told.length], [true, plan.length]);
  assert.ok(w.ofType('k.objects.part').some((p) => p.attrs.of[0] === 'cup'));
  const again = await cat.into(w, 'cat');
  assert.deepEqual(again.told, ['k.objects/shards/animals.sop'], 'schemas are told once per world');
  await cat.into(new World(), 'cup');
  assert.equal(reads.filter((p) => p === 'k.objects/schema.sop').length, 1, 'read once, then from the cache');
});

test('catalog: the lemma is the host\'s; a missing shard is an error and is read again next time', { skip }, async () => {
  const cat = createCatalog({ index, vocab, read: reader().read, lemma: (w) => (w.endsWith('s') ? [w.slice(0, -1)] : []) });
  assert.deepEqual(cat.shardsOf('cups'), ['k.objects/shards/household']);
  assert.deepEqual(createCatalog({ index, vocab, read: () => null }).shardsOf('cups'), [], 'no language built in');
  let n = 0;
  const flaky = createCatalog({ index, vocab, read: (p) => (++n === 1 ? null : readFileSync(join(DIR, p), 'utf8')) });
  const first = flaky.plan(flaky.shardsOf('fish'))[0];
  await assert.rejects(flaky.fetch('fish'), new RegExp(`nothing at ${first}`), 'the first file of the plan failed');
  assert.equal((await flaky.fetch('fish')).length, flaky.plan(flaky.shardsOf('fish')).length, 'read again: all of it');
});

test('an offline bundle: tools/build-bundle.mjs writes the shards a list of words needs; bundleReader reads them', { skip }, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'bundle-'));
  const cdir = join(dir, 'cat');
  execFileSync('mkdir', ['-p', cdir]);
  const plan = createCatalog({ index, vocab, read: () => null }).plan(['k.objects/shards/household']);
  for (const world of new Set(plan.map((x) => x.split('/')[0]))) execFileSync('cp', ['-r', join(DIR, world), cdir]);
  require_write(join(cdir, 'index.json'), JSON.stringify(index));
  require_write(join(cdir, 'vocab.json'), JSON.stringify(vocab));
  const out = join(dir, 'b.json');
  const msg = execFileSync(process.execPath, ['tools/build-bundle.mjs', cdir, out, 'cup'], { encoding: 'utf8' });
  assert.match(msg, new RegExp(`${plan.length} files \\(1 shards\\), 1 words`));
  const b = JSON.parse(readFileSync(out, 'utf8'));
  const cat = createCatalog({ index: b.index, vocab: b.vocab, read: bundleReader(b) });
  const w = new World();
  assert.equal((await cat.into(w, 'cup')).ok, true);
  assert.ok(w.ofType('k.objects.part').length > 0);
  assert.deepEqual(cat.shardsOf('cat'), [], 'only what was bundled');
});
