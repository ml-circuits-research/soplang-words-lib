// One way to choose (reviewer 01:00): criteria per choice kind as data (std.decide), every loss explained;
// a world's own criteria replace std.decide's for that kind.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, choose } from '../tools/lib-under-test.mjs';

test('choose: std.decide criteria in order (hard, cost, prior, seed), every loss explained; a world declares a kind', () => {
  const C = [{ word: 'kin', cost: 2, prior: 9 }, { word: 'sound', cost: 1, prior: 1 }, { word: 'nose', cost: 1, prior: 5, misfit: true }];
  const r = choose(null, 'word', C);
  assert.equal(r.best.word, 'sound');
  assert.deepEqual(r.ranked.map((x) => [x.place, x.on ?? null]), [[1, 'cost'], [0, null], [2, 'fits']]);
  assert.deepEqual(r.criteria.map((c) => c.name), ['fits', 'cost', 'prior']);
  const w = new World(); w.load('@d core.use world=std.decide');
  w.tell('@my std.decide.criterion of=guess n=1 name=prior measure=prior dir=max');
  assert.equal(choose(w, 'guess', C).best.word, 'kin', 'a kind the world declares, as data');
  assert.equal(choose(w, 'word', C, { criteria: [{ name: 'prior', measure: 'prior', dir: 'max' }] }).best.word, 'kin', 'criteria given directly');
  assert.equal(choose(w, 'template', [{ unfilled: 1 }, { unfilled: 0, specificity: 2 }]).best.specificity, 2, 'other kinds keep std.decide');
});

test('calibrate: the order of a kind\'s criteria learnt from cases, admitted only when held-out cases do not drop', async () => {
  const { calibrate } = await import('../tools/lib-under-test.mjs');
  // cases where the cheaper word is wrong and the more frequent one right: prior should come before cost
  const mk = (n) => Array.from({ length: n }, (_, i) => ({ candidates: [{ word: `a${i}`, cost: 1, prior: 1 }, { word: `b${i}`, cost: 2, prior: 9 }], expected: 1 }));
  const r = calibrate(null, 'word', mk(6), { heldOut: mk(3) });
  assert.deepEqual(r.current, ['fits', 'cost', 'prior']);
  assert.equal(r.best.indexOf('prior') < r.best.indexOf('cost'), true);
  assert.deepEqual([r.train.current, r.train.best, r.heldOut.current, r.heldOut.best, r.admitted], [0, 6, 0, 3, true]);
  assert.match(r.facts, /std\.decide\.criterion of=word n=1/);
});
