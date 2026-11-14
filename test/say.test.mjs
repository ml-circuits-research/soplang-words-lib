// Saying things from facts (PSys2's handover LIB-1..4): a list, a fact as a clause, an act's sentence from
// the published act templates, the frames of a log summary as a sentence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, joinList, clauseOf, actSentence, renderFrames, phraseOf, narrationOf, realiseFrame, paraphrasesOf, relatedCases, readByTypes } from '../tools/lib-under-test.mjs';
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

test('realiseFrame and paraphrasesOf on a toy language world', () => {
  const w = new World();
  assert.ok(w.tell([
    '@f1 w.lang.en.part frame=ask.what at=1 is=word word="what is"',
    '@f2 w.lang.en.part frame=ask.what at=2 is=det optional=yes',
    '@f3 w.lang.en.part frame=ask.what at=3 is=role role=attribute',
    '@f4 w.lang.en.part frame=ask.what at=4 is=word word=of',
    '@f5 w.lang.en.part frame=ask.what at=5 is=det optional=yes',
    '@f6 w.lang.en.part frame=ask.what at=6 is=role role=thing',
    '@g1 w.lang.en.part frame=ask.short at=1 is=lead phrase=lead.polite optional=yes',
    '@g2 w.lang.en.part frame=ask.short at=2 is=role role=thing',
    '@g3 w.lang.en.part frame=ask.short at=3 is=role role=attribute',
    '@p w.lang.en.phrase name=lead.polite item=please',
    '@v w.lang.en.variant frame=ask.short alternation="verb ellipsis" canonical=ask.what',
  ].join('\n')).ok);
  assert.equal(realiseFrame(w, 'ask.what', { attribute: 'sound', thing: 'cow' }), 'what is the sound of the cow');
  assert.equal(realiseFrame(w, 'ask.short', { attribute: 'sound', thing: 'cow' }), 'cow sound');
  assert.equal(realiseFrame(w, 'ask.short', { attribute: 'sound', thing: 'cow' }, { optional: true }), 'please cow sound');
  assert.equal(realiseFrame(w, 'ask.what', { attribute: 'sound' }), null, 'a required role missing');
  assert.deepEqual(paraphrasesOf(w).get('ask.short'), { alternation: 'verb ellipsis', canonical: ['ask.what'] });
});

test('relatedCases: the published paraphrases of a frame (w.lang.en.variant), read back to the same frame', { skip: !worldsDir() && 'offline' }, async () => {
  const w = await catalogWorld({ 'w.lang.en': ['w.lang.en.frame', 'w.lang.en.part', 'w.lang.en.phrase', 'w.lang.en.variant'], 'k.animals': ['k.animals.animal'] });
  const text = 'what is the sound of the cow', frame = readByTypes(w, text).best;
  const cs = relatedCases(w, { frame, text, langFrame: 'acts.ask.what', roles: { attribute: 'sound', thing: 'cow' } }, { axes: ['wording'] }).filter((c) => c.axes[0].startsWith('variant:'));
  assert.ok(cs.some((c) => c.valid && c.text === 'the cow sound' && c.axes[0] === 'variant:verb ellipsis'), JSON.stringify(cs.map((c) => c.text)));
  assert.ok(cs.some((c) => c.valid && c.text === 'tell me the cow sound'));
});
