// A story then a question (abstraction round item 6; reviewer 18:20 item 1): the story's referents and
// its arithmetic stay in focus and the question is read against them. The verbs, number words and
// question words are data (here a toy English table, written for the test).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storyState } from '../tools/lib-under-test.mjs';

const EN = { verbs: { has: 'set', have: 'set', buys: 'add', gets: 'add', finds: 'add', eats: 'remove', loses: 'remove', gives: 'give' },
  numbers: { one: 1, two: 2, three: 3, four: 4, five: 5 }, pronouns: ['she', 'he', 'they'], question: ['how', 'many'], all: ['together', 'altogether', 'total'], skip: ['more', 'the', 'a', 'to', 'does', 'do', 'now', 'left', 'in', 'of'] };

test('storyState: quantities follow the story, pronouns keep the owner in focus, the question is answered from it', () => {
  const ask = (t) => storyState(t, EN).answers[0].answer;
  assert.equal(ask('Ana has 3 apples. She buys 2 more apples. How many apples does Ana have?'), 5);
  assert.equal(ask('Tom has five cookies. He eats two cookies. How many cookies does he have left?'), 3);
  assert.equal(ask('Ana has 4 pears. Ana gives 1 pear to Ben. Ben has 2 pears. How many pears does Ben have?'), 2, 'a later "has" sets');
  assert.equal(ask('Ana has 4 pears. Ana gives 1 pear to Ben. How many pears does Ben have?'), 1, 'a gift moves the quantity');
  assert.equal(ask('Ana has 3 shells. Ben has 2 shells. How many shells do they have together?'), 5);
  const r = storyState('Ana sings. How many apples does Ana have?', EN);
  assert.deepEqual([r.unread, r.answers[0].why], [['Ana sings.'], 'no owner in focus']);
});
