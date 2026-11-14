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

test('storyState on real word problems (PSys2 r0194, r0195, r0201, r0541-r0543) and the cases around them', () => {
  const O = { ...EN, verbs: { ...EN.verbs, flies: 'remove', flyes: 'remove', ate: 'remove', eat: 'remove', buy: 'add' }, skip: [...EN.skip, 'away', 'did', 'have', 'has', 'at', 'as', 'and'] };
  const one = (t) => storyState(t, O).answers[0];
  assert.equal(one('Tom has 15 apples. He gives 12 to Ana. How many apples does Tom have?').answer, 3, 'the pronoun is the subject, Ana the one given to');
  const r = storyState('Tom has 5 apples. He gives 8 to Ana. How many apples does Tom have?', O);
  assert.deepEqual([r.answers[0].answer, r.refused[0].why], [5, 'Tom only had 5 apples'], 'giving more than held is refused, with the reason');
  assert.equal(one('Tom has 10 bees. One flyes away. How many bee Tom has ?').answer, 9, 'a number as the subject');
  assert.equal(one('Tom ate 2 apples and now has 3. How many apples did Tom have at first?').answer, 5, 'an unknown start, solved');
  assert.equal(one('Tom has 4 apples. Ana has 3 more apples than Tom. How many apples does Ana have?').answer, 7);
  assert.equal(one('Tom has 4 apples. Ana has twice as many apples as Tom. How many more apples does Ana have than Tom?').answer, 4);
  assert.equal(one('Tom has 4 apples. Ana has 7 apples. Who has the most apples?').answer, 'Ana');
  assert.equal(one('Tom has 4 apples. He did not eat 2 apples. How many apples does Tom have?').answer, 4, 'a negated event changes nothing');
  assert.equal(one('I have 3 pens. I buy a pen. How many pens do I have?').answer, 4, 'I as owner, a = 1');
  const t1 = storyState('Tom has 10 bees.', O), t2 = storyState('One flyes away.', { ...O, prior: t1 }), t3 = storyState('How many bee Tom has ?', { ...O, prior: t2 });
  assert.equal(t3.answers[0].answer, 9, 'a story carried across turns');
});
