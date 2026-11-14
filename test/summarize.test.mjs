// std.summarize (reviewer 14:45 A): a log of acts aggregated and generalised up the chain of
// kinds, ordered by salience; a text summarised extractively, measured against references
// written for this test (CC0, invented).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, actsOf, summarizeLog, summarizeText, overlap } from '../tools/lib-under-test.mjs';

test('summarize: the acts of a world, aggregated; siblings generalised; failures kept; salience order', () => {
  const w = new World();
  w.load(`@acts core.use world=std.acts  @zoo std.schema.world name=zoo  @any std.schema.kinds world=zoo from=k.animal acts=make acts=remove
@a1 k.animal name=cat  @a2 k.animal name=dog  @a3 k.animal name=horse  @a4 k.animal name=tree`);
  for (const k of ['cat', 'dog', 'horse', 'dog']) w.act({ action: 'make', args: { kind: k } });
  w.act({ action: 'remove', args: { thing: 'cat1' } });
  const acts = actsOf(w);
  assert.deepEqual(acts.map((a) => [a.act, a.kind]), [['make', 'cat'], ['make', 'dog'], ['make', 'horse'], ['make', 'dog'], ['remove', 'cat']]);
  const parentOf = (k) => (['cat', 'dog', 'horse'].includes(k) ? 'animal' : null);
  const all = summarizeLog([...acts, { act: 'make', kind: 'dragon', failed: true }], { parentOf, length: 'bullets' });
  assert.deepEqual(all.map((f) => [f.act, f.kind, f.count, f.kinds ?? null, !!f.failed]), [
    ['make', 'animal', 4, ['cat', 'dog', 'horse'], false], ['make', 'dragon', 1, null, true], ['remove', 'cat', 1, null, false]]);
  assert.equal(summarizeLog(acts, { parentOf, length: 'line' }).length, 1);
});

const TEXTS = [
  { text: 'The village of Brambly has 312 people. It sits on a river with an old stone bridge. Every summer the village holds a fair on the bridge. The fair sells honey, apples and wool. People come from three towns to the fair. The bridge was built in 1702 and still carries carts.',
    reference: 'Brambly, a village of 312 people on a river, holds a summer fair on its old stone bridge, built in 1702.' },
  { text: 'Owls hunt at night. Their eyes are large and face forward. An owl can turn its head about 270 degrees. Owls fly almost silently because of soft edges on their feathers. Most owls eat mice and insects. Some owls live in barns.',
    reference: 'Owls hunt at night with large forward eyes, turn their heads about 270 degrees and fly silently.' },
];

test('summarize: a text, extractive; redundancy dropped; measured against references', () => {
  const scores = TEXTS.map(({ text, reference }) => overlap(summarizeText(text, { n: 2 }).picked.join(' '), reference));
  assert.ok(scores.every((x) => x >= 0.35), JSON.stringify(scores));
  const twice = summarizeText('Owls hunt at night. Owls hunt at night, mostly. Mice hide in barns. Barns are warm.', { n: 2 });
  assert.equal(twice.picked.filter((s) => s.startsWith('Owls hunt')).length, 1, 'the same thing twice is said once');
  for (const { text } of TEXTS) for (const s of summarizeText(text).picked) assert.ok(text.includes(s), 'every sentence is from the source');
});

test("summarizeLog({ failed: 'separate' }): what failed is a list of its own (PSys2 21:00)", async () => {
  const { summarizeLog } = await import('../tools/lib-under-test.mjs');
  const r = summarizeLog([{ act: 'make', kind: 'cat' }, { act: 'make', kind: 'dog', failed: true }, { act: 'remove', kind: 'cat' }], { failed: 'separate' });
  assert.ok(r.every((f) => !f.failed));
  assert.deepEqual(r.failed.map((f) => [f.act, f.kind, f.failed]), [['make', 'dog', true]]);
});
