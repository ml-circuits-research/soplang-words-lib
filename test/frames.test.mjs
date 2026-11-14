// Reading by the frames of a language world (reviewer 08:15): parts in order, verbs by the act of their
// lemma's sense, roles by words, numbers, prepositions and lists. An invented toy language first (no
// morphology), then the published w.lang.ro with its morphology and dictionary.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { World, readFrames, senseOf, morphOf, dictionary, fold } from '../tools/lib-under-test.mjs';
import { worldsDir, catalogWorld } from '../tools/worlds.mjs';

test('readFrames on a toy language: the frame that takes every word, its act and roles', () => {
  const w = new World();
  w.tell(`@f1 ex.frame name=x.make en=acts.make act=make priority=10  @f2 ex.frame name=x.make.n en=acts.make.n act=make priority=12
@f3 ex.frame name=x.move en=acts.place.dir act=place priority=12
@p1 ex.part frame=x.make at=1 is=word word=zap  @p2 ex.part frame=x.make at=2 is=det optional=yes  @p3 ex.part frame=x.make at=3 is=role role=thing takes=words
@q1 ex.part frame=x.make.n at=1 is=word word=zap  @q2 ex.part frame=x.make.n at=2 is=role role=amount takes=number  @q3 ex.part frame=x.make.n at=3 is=role role=thing takes=words
@r1 ex.part frame=x.move at=1 is=word word=vush  @r2 ex.part frame=x.move at=2 is=role role=thing takes=words  @r3 ex.part frame=x.move at=3 is=role role=rel takes=lexicon lexicon=dir
@l ex.lex name=dir item="to left" item="up"  @d ex.det form=lo  @n ex.numeral form=dui value=2  @s ex.phrase name=skip item=plis
@c ex.particle form=ka kind=conjunction meaning=and`);
  const read = (t) => readFrames(w, t, { lang: 'ex' }).best;
  assert.deepEqual([read('zap lo tree').frame, read('zap lo tree').roles.thing.text], ['x.make', 'tree']);
  assert.deepEqual([read('zap dui trees').frame, read('zap dui trees').roles.amount.value], ['x.make.n', 2]);
  assert.deepEqual([read('vush the tree to left, plis').act, read('vush the tree to left').roles.rel.item], ['place', 'to left']);
  assert.equal(read('blorp'), null, 'no frame takes it');
  assert.deepEqual(read('zap lo tree, lo cat ka sun').roles.thing.items.map((x) => x.text), ['tree', 'lo cat', 'sun'], 'a list: cut at a comma and at the language\'s and');
  assert.deepEqual(senseOf(w, 'k.actions.verb.place.move'), { act: 'place', en: 'move', pos: 'verb' });
  assert.deepEqual(senseOf(w, 'k.words.house.noun.1'), { en: 'house', pos: 'noun' });
});

test('readFrames on the published w.lang.ro: inflected and unaccented forms read into acts and English words', { skip: !worldsDir() && 'offline' }, async () => {
  const T = ['class', 'ending', 'irregular', 'vowel', 'fold', 'split', 'det', 'pron', 'prep', 'numeral', 'frame', 'part', 'phrase', 'lex'].map((x) => `w.lang.ro.${x}`);
  const w = await catalogWorld({ 'w.lang.ro': T });
  const m = morphOf(w, { types: { cls: 'w.lang.ro.class', ending: 'w.lang.ro.ending', irregular: 'w.lang.ro.irregular', fold: 'w.lang.ro.fold', split: 'w.lang.ro.split', vowel: 'w.lang.ro.vowel' } });
  const D = `${worldsDir()}docs/worlds/w.lang.ro/dictionary/`;
  const d = dictionary({ read: (l) => (existsSync(`${D}${l}.tsv`) ? readFileSync(`${D}${l}.tsv`, 'utf8') : ''), fold: (s) => fold(m, s) });
  const say = (t) => { const b = readFrames(w, t, { morph: m, dictionary: d }).best; return b && [b.act, ...Object.entries(b.roles).map(([k, v]) => `${k}=${v.en ?? v.value ?? v.item}`)].join(' '); };
  assert.equal(say('deseneaza doua case'), 'make amount=2 thing=house');
  assert.equal(say('fa casa rosie'), 'change thing=house value=red');
  assert.equal(say('sterge casa, te rog'), 'remove thing=house');
  assert.equal(say('care este culoarea casei'), 'ask attribute=colour thing=house');
});
