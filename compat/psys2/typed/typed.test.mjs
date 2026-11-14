// A PSys2 legend (kids.animals at the pinned commit) made a typed world with the knowledge it joins
// (k.animals), so the typed readers have something to type words with (reviewer 06:55, PSys2 Q16).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { typedWorldFor, fitsSlot, readByTypes } from '../../../src/index.mjs';
import { psys2Dir, worldsDir, catalogWorld, REPOS } from '../../../tools/worlds.mjs';
import { describeLegend } from './legend.mjs';

const pin = REPOS.find((r) => r.name === 'psys2')?.pin;

test('a PSys2 legend + k.animals → a typed world: things, keys, free-text types; a slot refuses what does not fit', { skip: (!psys2Dir() || !worldsDir()) && 'offline' }, async () => {
  const text = execFileSync('git', ['-C', psys2Dir(), 'show', `${pin}:worlds/kids.animals/legend.sop`], { encoding: 'utf8' });
  const d = describeLegend(text, { joins: { 'kids.animals.animal.name': { type: 'k.animals.animal', by: 'name' } } });
  assert.ok(d.kinds.some((k) => k.type === 'kids.animals.animal' && k.keys.length >= 15));
  const know = await catalogWorld({ 'k.animals': ['k.animals.animal'] });
  const t = typedWorldFor(d, know, { text: { lives: 'text', covered: 'text', matching: 'text' } });
  assert.ok(t.counts.things > 100, `${t.counts.things} animals typed`);
  assert.equal(fitsSlot(t, 'kids.animals.animal', 'name', 'the owl').ok, true);
  assert.equal(fitsSlot(t, 'kids.animals.animal', 'name', 'makes a cow').ok, false);
  assert.equal(fitsSlot(t, 'kids.animals.animal', 'legs', 'four legs').ok, false);
  assert.equal(fitsSlot(t, 'kids.animals.animal', 'legs', '4').ok, true);
  assert.equal(t.slots.get('kids.animals.animal|summary').expects, 'text');
  const r = readByTypes(t.world, 'owl legs', {});
  assert.ok(r.frames.some((f) => f.frame.key === 'legs'), 'the key is an attribute before any fact carries it');
});
