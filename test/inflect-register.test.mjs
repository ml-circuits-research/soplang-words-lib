// Two plurals of one singular in two registers (knowledge Q79): writing takes the common one unless a register is asked;
// reading takes both.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, inflectBy } from '../tools/lib-under-test.mjs';

test('inflectBy: a register for writing, every form for reading', () => {
  const w = new World();
  w.load(`@t core.type of=w.lang.en.irregular
@a w.lang.en.irregular singular=cactus plural=cacti register=classical
@b w.lang.en.irregular singular=cactus plural=cactuses register=common
@c w.lang.en.irregular singular=child plural=children`);
  assert.equal(inflectBy(w, 'cactus', 'plural'), 'cactuses', 'the common one');
  assert.equal(inflectBy(w, 'cactus', 'plural', { register: 'classical' }), 'cacti');
  assert.deepEqual(inflectBy(w, 'cactus', 'plural', { all: true }).sort(), ['cacti', 'cactuses']);
  assert.equal(inflectBy(w, 'cacti', 'singular'), 'cactus');
  assert.equal(inflectBy(w, 'child', 'plural'), 'children');
  assert.deepEqual(inflectBy(w, 'dog', 'plural', { all: true }), ['dog'], 'no rule here: the word, as a list');
});
