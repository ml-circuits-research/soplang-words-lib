// What a host still kept because of the library (PSys2 Q22, reviewer 13:15 items 1-3): a repair's confidence, wishes
// as requests, fragment codes, the reason of a mood.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, moodOf, fitsSlot, typedWorldFor, schemaOf, confidentTypo, readText } from '../tools/lib-under-test.mjs';

const L = new World();
L.load(`@t1 core.type of=ex.fn
@w1 ex.fn text="i want" view=wish at=lead
@w2 ex.fn text="id like" view=wish at=lead
@w3 ex.fn text="want" view=wish at=any
@p1 ex.fn text="please" view=politeness at=any
@p2 ex.fn text="could you" view=politeness at=lead
@h1 ex.fn text="um" view=hesitation at=any
@f1 ex.fn text="so" view=filler at=lead`);

test('moodOf: a wish is a request, a polite lead too; the speaker alone and articles are fragments; the reason with detail', () => {
  const m = (t, o = {}) => moodOf(L, t, { lang: 'ex', detail: true, ...o });
  assert.deepEqual(m('I want a red circle'), { mood: 'wish', by: 'wish' });
  assert.deepEqual(m("I'd like 2 tables"), { mood: 'wish', by: 'wish' });
  assert.deepEqual(m('I really want a cake'), { mood: 'wish', by: 'wish' });
  assert.deepEqual(m('um so could you add a table please'), { mood: 'imperative', by: 'polite' });
  assert.deepEqual(m('I have two kids'), { mood: 'statement', by: 'self' });
  assert.deepEqual(m('my'), { mood: 'fragment', by: 'self' });
  assert.deepEqual(m('an a'), { mood: 'fragment', by: 'article' });
  assert.deepEqual(m('Tom is tall today'), { mood: 'statement', by: 'name' });
  assert.deepEqual(m('Done is red', { things: (w) => w === 'Done' }), { mood: 'imperative', by: 'verb' }, 'a name that is a thing of the world is not a speaker');
  assert.equal(moodOf(L, 'add a table', { lang: 'ex' }), 'imperative', 'without detail: the mood alone');
});

test('a respelling is confident when the typed word is a near whole word: 4+ letters, within the budget, the first letter kept or the first two swapped; readText names them', () => {
  assert.equal(confidentTypo('tabel', 'table'), true);
  assert.equal(confidentTypo('atble', 'table'), true, 'the first two swapped');
  assert.equal(confidentTypo('cat', 'car'), false, 'too short');
  assert.equal(confidentTypo('mable', 'table'), false, 'another first letter');
  assert.equal(confidentTypo('elephnat', 'elephant'), true);
  const reader = () => [{ frame: { is: 'act', act: 'make' }, unread: [], repaired: [{ from: 'tabel', to: 'table', confident: true }] }];
  const r = readText(L, 'add a tabel', { reader, lang: 'ex' });
  assert.deepEqual([r.complete, r.named.map((x) => x.from)], [true, ['tabel']]);
  const unsure = readText(L, 'add a mable', { reader: () => [{ frame: { is: 'act', act: 'make' }, unread: [], repaired: [{ from: 'mable', to: 'table', confident: false }] }], lang: 'ex' });
  assert.deepEqual([unsure.complete, unsure.why], [false, 'read after respelling mable']);
});

test('fitsSlot: a code for each refusal (empty, fragment, type); fragments are refused in a slot with no type too', () => {
  const w = new World();
  w.load('@a core.type of=shop.list extends=std.schema.thing\n@s1 core.slot of=shop.list key=name kind=string\n@s2 core.slot of=shop.list key=sort enum=shopping enum=any\n@s3 core.slot of=shop.list key=budget kind=number');
  const typed = typedWorldFor(schemaOf(w));
  const fit = (k, t) => { const r = fitsSlot(typed, 'shop.list', k, t); return r.ok ? 'ok' : r.code; };
  assert.deepEqual(['', 'my', 'an a', 'the', 'groceries'].map((t) => fit('name', t)), ['empty', 'fragment', 'fragment', 'fragment', 'ok']);
  assert.deepEqual([fit('sort', 'party'), fit('budget', 'lots'), fit('budget', '30')], ['type', 'type', 'ok']);
  assert.deepEqual([fit('note', 'my'), fit('note', 'buy milk')], ['fragment', 'ok'], 'a slot the typed world does not know');
});
