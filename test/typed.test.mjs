// Typed worlds from a schema and the knowledge it joins (reviewer 06:55): kinds, keys and their words,
// closed sets, the joined things, and a type for every free-text slot, so the typed readers can fire and
// a slot can refuse what does not fit it. An invented toy schema.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, typedWorldFor, schemaOf, fitsSlot, freeTextType, readByTypes } from '../tools/lib-under-test.mjs';

const know = new World();
know.tell('@i1 k.ex.instrument name=piano kind=keyboard  @i2 k.ex.instrument name=violin kind=strings');
const schema = {
  kinds: [{ type: 'ex.player', words: ['player'], keys: [
    { key: 'instrument', value: 'string', join: { type: 'k.ex.instrument', by: 'name' }, words: ['instrument'] },
    { key: 'tempo', value: 'number', words: ['tempo', 'speed'] },
    { key: 'loop', value: 'string', enum: ['on', 'off'] },
    { key: 'owner', value: 'string' }, { key: 'title', value: 'string' }, { key: 'note', value: 'string' }] }],
  words: [{ text: 'makes', means: 'sound' }],
};

test('typedWorldFor: joined things, closed sets, numbers and free text get types; fitsSlot refuses what does not fit', () => {
  const t = typedWorldFor(schema, know, { things: [{ id: 'p1', label: 'player', kind: 'ex.player', attrs: { tempo: 90 } }] });
  assert.deepEqual(t.counts, { kinds: 1, keys: 6, things: 3, values: 2, words: 5 });
  assert.deepEqual(fitsSlot(t, 'ex.player', 'instrument', 'the violin'), { ok: true, as: 'thing', id: 't20', value: 'violin' });
  assert.match(fitsSlot(t, 'ex.player', 'instrument', 'makes a cow').why, /no instrument called "makes a cow"/);
  assert.equal(fitsSlot(t, 'ex.player', 'tempo', '120').value, 120);
  assert.equal(fitsSlot(t, 'ex.player', 'tempo', 'fast').ok, false);
  assert.equal(fitsSlot(t, 'ex.player', 'loop', 'off').ok, true);
  assert.equal(fitsSlot(t, 'ex.player', 'owner', 'Ann Lee').ok, true);
  assert.match(fitsSlot(t, 'ex.player', 'owner', 'makes a cow').why, /"makes" in "makes a cow" is a word for sound/);
  assert.equal(fitsSlot(t, 'ex.player', 'owner', 'what is it').ok, false, 'a question is not a name');
  assert.equal(fitsSlot(t, 'ex.player', 'title', 'What a Wonderful World').ok, true, 'a title takes any words');
  assert.equal(fitsSlot(t, 'ex.player', 'note', 'makes a cow, what?').ok, true, 'a text takes anything');
  assert.deepEqual([freeTextType('aka'), freeTextType('summary'), freeTextType('owner')], ['title', 'text', 'name']);
  const r = readByTypes(t.world, 'what is the speed of the player', { question: ['what'], skip: ['is', 'the', 'of'] });
  assert.deepEqual(r.best, { is: 'ask', key: 'tempo', of: { id: 'p1' }, answer: ['90'] }, 'a word of the key reads the key');
});

test('schemaOf: a World with core.type / core.slot / core.word as the description typedWorldFor takes', () => {
  const s = new World();
  s.load('@t core.type of=ex.room  @a core.slot of=ex.room key=size kind=number  @b core.slot of=ex.room key=light enum=on enum=off  @w core.word text=chamber means=ex.room');
  const d = schemaOf(s);
  assert.deepEqual(d.kinds.map((k) => [k.type, k.keys.map((x) => [x.key, x.value, x.enum])]), [['ex.room', [['size', 'number', []], ['light', null, ['on', 'off']]]]]);
  const t = typedWorldFor(s);
  assert.equal(t.lexicon.get('chamber')[0].cat, 'kind');
  assert.equal(fitsSlot(t, 'ex.room', 'light', 'on').ok, true);
});
