// Saying things from facts (PSys2's handover LIB-1..4): a list, a fact as a clause, an act's sentence from
// the published act templates, the frames of a log summary as a sentence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, joinList, clauseOf, actSentence, renderFrames, phraseOf, narrationOf } from '../tools/lib-under-test.mjs';
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

test('phraseOf: the knowledge narrates, the language world phrases (Q63)', { skip: !worldsDir() && 'offline' }, async () => {
  const w = await catalogWorld({ 'w.lang.en': ['w.lang.en.phrasing', 'w.lang.en.det', 'w.lang.en.onset'], 'k.attributes': ['k.attributes.narration'], 'k.animals': ['k.animals.animal'] });
  assert.ok(narrationOf(w).size > 900, 'the published narration is read');
  const owl = w.ofType('k.animals.animal').find((x) => x.attrs.name[0] === 'owl');
  assert.equal(phraseOf(w, owl, { key: 'habitat' }).text, 'the owl lives in the forest');
  assert.equal(phraseOf(w, owl, { key: 'eats' }).text, 'the owl eats mice and insects');
  assert.equal(phraseOf(w, owl, { key: 'baby' }).text, 'the young of the owl is an owlet', 'a/an follows the next word');
  assert.equal(phraseOf(w, owl, { key: 'drawing' }), null, 'a key the knowledge does not narrate is never said');
});

test('phraseOf on a toy world: per-key phrasing first, then by form', () => {
  const w = new World();
  const told = w.tell([
    '@n1 k.attributes.narration type=t key=secret narrate=no',
    '@n2 k.attributes.narration type=t key=size narrate=yes salience=0.9 form=measure',
    '@p1 w.lang.en.phrasing name=form.measure form=measure text="the {key} of {thing} is {value}."',
    '@p2 w.lang.en.phrasing name=form.state.yes form=state polarity=yes text="{thing} is {key}."',
    '@p3 w.lang.en.phrasing name=key.any.likes key=likes text="{thing} likes {value}."',
  ].join('\n'));
  assert.ok(told.ok, JSON.stringify(told.errors ?? told));
  const f = { type: 't', attrs: { name: ['box'], secret: ['x'], size: ['3'], likes: ['tea'], heavy: ['yes'] } };
  assert.equal(phraseOf(w, f).text, 'the size of the box is 3', 'the most salient narrated key');
  assert.equal(phraseOf(w, f, { key: 'likes' }).text, 'the box likes tea');
  assert.equal(phraseOf(w, f, { key: 'heavy', names: new Set(['box']) }).text, 'box is heavy');
  assert.equal(phraseOf(w, f, { key: 'secret' }), null);
});
