// Saying things from facts (PSys2's handover LIB-1..4): a list, a fact as a clause, an act's sentence from
// the published act templates, the frames of a log summary as a sentence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, joinList, clauseOf, actSentence, renderFrames } from '../tools/lib-under-test.mjs';
import { worldsDir, catalogWorld } from '../tools/worlds.mjs';

test('joinList and renderFrames', () => {
  assert.equal(joinList(['a', 'b', 'c']), 'a, b and c');
  assert.equal(joinList(['a']), 'a');
  assert.equal(joinList(['a', 'b'], { and: 'și' }), 'a și b');
  assert.equal(renderFrames([{ act: 'add', kind: 'tree', count: 3 }, { act: 'remove', kind: 'house', count: 1 }, { act: 'add', kind: 'cat', count: 1, failed: true }]), 'You asked me to add 3 trees and remove a house; 1 request was not understood.');
  assert.equal(renderFrames([]), 'Nothing was changed.');
});

test('clauseOf and actSentence over the published w.lang.en', { skip: !worldsDir() && 'offline' }, async () => {
  const w = await catalogWorld({ 'w.lang.en': ['w.lang.en.template', 'w.lang.en.prep', 'w.lang.en.aux', 'w.lang.en.det', 'w.lang.en.onset', 'w.lang.en.inflect', 'w.lang.en.irregular'], 'k.actions': ['k.actions.action'] });
  assert.equal(clauseOf(w, { type: 'k.animal', attrs: { name: ['penguin'], class: ['bird'], legs: ['2'], eats: ['fish'] } }), 'the penguin eats fish, is a bird, has 2 legs');
  assert.equal(clauseOf(w, { type: 'k.place', attrs: { name: ['peru'], landlocked: ['false'], capital: ['lima'] } }, { names: new Set(['peru']) }), 'peru is not landlocked, has a capital of lima');
  assert.equal(clauseOf(w, { type: 'x', attrs: { colour: ['red'] } }), null, 'no subject: no clause');
  assert.equal(actSentence(w, 'make', { number: 3, kind: 'table' }), 'Add 3 tables.');
  assert.equal(actSentence(w, 'make', { kind: 'owl' }), 'Add an owl.');
  assert.equal(actSentence(w, 'make', { colour: 'x', size: 'y', weight: 'z', kind: 'k' }), null, 'no template with these roles');
});
