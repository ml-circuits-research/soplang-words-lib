// Statements read by type as taught facts (reviewer 09:20 L5, 10:55: PSys2's Profile tab, 30 real turns). An
// invented toy person schema; w.person replaces it when published.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, readStatement, tellStatement, describeThing, readAboutSelf } from '../tools/lib-under-test.mjs';

const person = () => {
  const w = new World();
  w.load(`@p core.type of=ex.person  @n core.slot of=ex.person key=name  @k core.slot of=ex.person key=children kind=integer  @a core.slot of=ex.person key=age kind=integer
@l core.slot of=ex.person key=likes many=true  @c core.slot of=ex.person key=city  @m core.slot of=ex.person key=mood enum=happy enum=sad
@w1 core.word text=kids text=kid text=children means=children  @w2 core.word text=like text=love means=likes  @w3 core.word text="live in" means=city  @w4 core.word text=feel means=mood`);
  return w;
};
const O = { type: 'ex.person', number: 'age' };

test('first-person statements become facts on the user\'s thing; lists grow; other moods are not statements', () => {
  const w = person();
  assert.deepEqual(tellStatement(w, 'I have two kids', O).facts, [{ key: 'children', value: 2 }]);
  assert.deepEqual(tellStatement(w, 'I am 40', O).facts, [{ key: 'age', value: 40 }], 'a bare number after the copula: the host\'s number key');
  tellStatement(w, 'I like cats, dogs and horses', O);
  tellStatement(w, 'I love horses and owls', O);
  assert.deepEqual(w.get('me').attrs.likes, ['cats', 'dogs', 'horses', 'owls'], 'a list grows, without repeats');
  assert.deepEqual(tellStatement(w, 'my name is Ana Pop', O).facts, [{ key: 'name', value: 'Ana Pop' }], 'the value as written');
  assert.deepEqual(tellStatement(w, 'I live in Cluj', O).facts, [{ key: 'city', value: 'Cluj' }]);
  assert.match(readStatement(w, 'I feel tired', O).why, /one of happy, sad/);
  assert.match(readStatement(w, 'draw a house', O).why, /imperative, not a statement/);
  assert.match(readStatement(w, 'I am happy', O).why, /no key/);
  assert.deepEqual(describeThing(w, 'me').map((x) => x.key), ['children', 'age', 'likes', 'name', 'city'], 'what do you know about me');
  assert.deepEqual(readAboutSelf(w, 'how many kids do I have', { question: ['how', 'many'], skip: ['do', 'have'] }).best, { is: 'ask', key: 'children', of: { id: 'me' }, answer: ['2'] });
});
