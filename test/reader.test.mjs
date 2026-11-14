// One Reader contract (reviewer 10:10 R2; 10:35 asks): candidates with their unread words, repairs, cost and
// specificity; completeness computed from them; the mood read before the act.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, readText, moodOf, READERS, typedWorldFor, fitsSlot } from '../tools/lib-under-test.mjs';

const w = new World();
w.tell('@cow animal name=cow sound=moo legs=4  @v core.word text=make text=makes means=sound');
const O = { question: ['what'], skip: ['does', 'a', 'please'] };

test('readText: one shape for every reader; words left unread make a reading incomplete (the real case of 23:50)', () => {
  const r = readText(w, 'what sound does a cow make', O);
  assert.deepEqual([r.complete, r.mood, r.best.key, r.unread], [true, 'question', 'sound', []]);
  const h = readText(w, 'what sound does a cow make in the shape of a house', O);
  assert.equal(h.complete, false, 'words the reading did not use are never taken as arguments');
  assert.deepEqual(h.unread, ['in', 'the', 'shape', 'of', 'house']);
  assert.match(h.why, /words not read/);
  assert.deepEqual(Object.keys(READERS).sort(), ['canonical', 'frames', 'types']);
  const host = readText(w, 'anything', { reader: () => [{ frame: { is: 'act', act: 'make' }, unread: ['x'] }, { frame: { is: 'act', act: 'show' }, unread: [] }] });
  assert.equal(host.best.act, 'show', 'a host reader under the contract; fewer words unread first');
});

test('moodOf: a first-person declarative is a statement, an article or a letter alone is a fragment', () => {
  assert.equal(moodOf(w, 'I have two kids'), 'statement');
  assert.equal(moodOf(w, 'my name is Ana'), 'statement');
  assert.equal(moodOf(w, 'Tom has 5 apples'), 'statement');
  assert.equal(moodOf(w, 'how many kids do I have'), 'question');
  assert.equal(moodOf(w, 'draw a house'), 'imperative');
  assert.equal(moodOf(w, 'the'), 'fragment');
  assert.equal(moodOf(w, 'b'), 'fragment');
  const st = readText(w, 'anything', { reader: () => [{ frame: { is: 'act', act: 'make' }, unread: [] }] });
  assert.equal(st.complete, true);
  const s2 = readText(w, 'I like cats', { reader: () => [{ frame: { is: 'act', act: 'make' }, unread: [] }] });
  assert.deepEqual([s2.complete, s2.why], [false, 'a statement, not a request'], 'an act frame needs an imperative or a question');
});

test('fitsSlot: an empty value, an article alone or a single letter is never a slot value', () => {
  const t = typedWorldFor({ kinds: [{ type: 'ex.p', keys: [{ key: 'owner' }, { key: 'note' }] }] });
  assert.equal(fitsSlot(t, 'ex.p', 'note', '').ok, false);
  assert.equal(fitsSlot(t, 'ex.p', 'owner', 'the').ok, false);
  assert.equal(fitsSlot(t, 'ex.p', 'owner', 'b').ok, false);
  assert.equal(fitsSlot(t, 'ex.p', 'owner', 'Bo').ok, true);
});
