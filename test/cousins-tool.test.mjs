// tools/cousins-test.mjs (reviewer 21:55): one example → its cousins with expected answers → a host →
// a table per degree × dimension and the pattern of breaks named.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, readByTypes } from '../tools/lib-under-test.mjs';
import { cousinsTest, printTable } from '../tools/cousins-test.mjs';

test('cousinsTest: a host that knows only the example breaks along every dimension; a general one passes all', () => {
  const w = new World();
  w.tell(`@cow k.animal name=cow kind=bovine role=farm sound=moo  @yak k.animal name=yak kind=bovine role=wild sound=grunt
    @pig k.animal name=pig kind=suid role=farm sound=oink  @bovine k.kind name=bovine is_a=mammal  @suid k.kind name=suid is_a=mammal`);
  const O = { question: ['what', 'does'], skip: ['a'] }, text = 'what sound does a cow make', example = { text, frame: readByTypes(w, text, O).best };
  const edges = { kind: 'kind', is_a: 'kind', role: 'role' };
  const point = cousinsTest(w, example, (t) => (/\bcow\b/.test(t) ? ['moo'] : null), { read: O, edges });
  assert.equal(point.case, true);
  assert.deepEqual(Object.fromEntries(Object.entries(point.table).map(([k, r]) => [k, `${r.pass}/${r.of}`])), { '1|kind': '0/1', '1|role': '0/1' });
  assert.match(point.pattern[0], /fails when kind, role changes/);
  const general = cousinsTest(w, example, (t) => readByTypes(w, t, O).best?.answer, { read: O, edges });
  assert.equal(general.share, 1);
  assert.match(printTable(general), /every cousin passes/);
});

test('cousinsTest judges every clause of a compound text: a host that answers only one half fails it', () => {
  const w = new World();
  w.tell('@cow k.animal name=cow sound=moo  @dog k.animal name=dog sound=woof  @s core.word text=make text=makes means=sound');
  const O = { question: ['what', 'does'], skip: ['a', 'and'] };
  const text = 'what does a cow make and what does a dog make', example = { text, frame: { is: 'ask', key: 'sound', of: { id: 'cow' }, answer: ['moo'] } };
  const split = (t) => t.split(/\s+and\s+/), oracle = (c) => readByTypes(w, c, O).best?.answer;
  const firstHalf = (t) => readByTypes(w, t.split(/\s+and\s+/)[0], O).best?.answer; // reads only the first clause
  assert.equal(cousinsTest(w, example, firstHalf, { read: O, dims: [] }).case, true, 'judged on the frame alone it passes');
  assert.equal(cousinsTest(w, example, firstHalf, { read: O, dims: [], split, oracle }).case, false, 'judged per clause it fails');
  const both = (t) => split(t).flatMap((c) => readByTypes(w, c, O).best?.answer ?? []); // answers each clause
  assert.equal(cousinsTest(w, example, both, { read: O, dims: [], split, oracle }).case, true);
});
