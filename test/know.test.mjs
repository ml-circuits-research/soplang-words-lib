// Knowledge as a filler (Round 21, item 4): facts of a knowledge catalog offered to
// std.fill at the tier `knowledge`, applied by `make` as defaults with their source.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { knowledge, draw } from '../examples/know.mjs';
import { face } from '../examples/acts.mjs';

const make = (...extra) => { const w = new World(); w.load(['@acts core.use world=std.acts', '@know core.use world=std.know', draw, ...extra].join('\n')); w.tell(knowledge); return w; };

test('knowledge fills what a made thing lacks: the usual place, size and colour, with the source', () => {
  const w = make();
  const r = w.act({ action: 'make', args: { kind: 'fish' } });
  assert.deepEqual(r.result.filled, [{ key: 'place', value: 'water', tier: 'knowledge', source: 'example' }, { key: 'size', value: 'small', tier: 'knowledge', source: 'example' }]);
  assert.deepEqual([w.get('fish1').attrs.place, w.tier('fish1', 'place')], [['water'], 'default'], 'an assumption, weaker than what is told');
  assert.deepEqual(w.act({ action: 'make', args: { kind: 'robot' } }).result.filled, [{ key: 'colour', value: 'grey', tier: 'knowledge', source: 'example' }]);
  // what the request says wins; a value changed later stays
  const sun = w.act({ action: 'make', args: { kind: 'sun', size: 'tiny' } });
  assert.deepEqual([w.get(sun.result.thing).attrs.size, w.get(sun.result.thing).attrs.place], [['tiny'], ['sky']]);
  w.act({ action: 'change', args: { thing: 'fish1', attr: 'place', value: 'bowl' } });
  assert.deepEqual([w.get('fish1').attrs.place, w.tier('fish1', 'place')], [['bowl'], 'told']);
});

test('knowledge: a kind the catalog cannot draw is drawn as its stand-in; a closed kind takes only its own attributes', () => {
  const w = make(face, '@kc k.commonsense.thing name=eye size=tiny');
  assert.deepEqual(w.act({ action: 'make', args: { kind: 'unicorn' } }).result, { act: 'make', thing: 'unicorn1', standIn: 'horse' });
  assert.deepEqual(w.get('unicorn1').attrs.drawn_as, ['horse']);
  const eye = w.act({ action: 'make', args: { kind: 'eye' } });
  assert.deepEqual([eye.result.filled, w.get('eye1').attrs.size], [undefined, ['5']], 'the eye has its slot default, and no key knowledge could add');
  assert.equal(w.act({ action: 'make', args: { kind: 'dragon' } }).violations[0].why, 'no world here has a dragon');
});
