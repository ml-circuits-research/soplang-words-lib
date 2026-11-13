// The second application, written from the documentation alone (Round 24, B7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { turn } from '../tools/lib-under-test.mjs';
import { makeApp, addIngredient } from '../examples/second-app/recipes.mjs';

test('second app: recipes scale their ingredients, the shopping view lists them with units from the catalog', () => {
  const w = makeApp();
  turn(w, [{ action: 'make', args: { kind: 'recipe', name: 'pancakes' } }]);
  turn(w, [{ action: 'make', args: { kind: 'recipe', name: 'soup' } }]);
  addIngredient(w, 'recipe1', 'flour', 60); addIngredient(w, 'recipe1', 'egg', 1); addIngredient(w, 'recipe2', 'milk', 250);
  const list = () => w.act({ action: 'show', args: { thing: 'ingredient', set: 'each', view: 'shopping' } }).result.things.map((t) => `${t.values.amount} ${t.values.unit} ${t.values.name}`);
  assert.deepEqual(list(), ['120 g flour', '2 piece egg', '500 ml milk']);
  turn(w, [{ action: 'change', args: { thing: 'recipe1', attr: 'serves', value: 6 } }]);
  assert.deepEqual(list(), ['360 g flour', '6 piece egg', '500 ml milk'], 'only the pancakes scale');
  w.undo();
  assert.deepEqual(list()[0], '120 g flour');
  assert.deepEqual(turn(w, [{ action: 'change', args: { thing: 'recipe1', attr: 'colour', value: 'red' } }]).replies, ['Did you mean to change recipe1? (a recipe has no colour)']);
});
