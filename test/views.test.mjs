// Shared things and views; taught facts (Round 22): three views over the same things; a
// thing that lacks a view's aspect is refused with the reason; a taught fact sits at its own
// tier, says who taught it, and can be forgotten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeWorld } from '../examples/views.mjs';

const show = (w, view, thing = '*') => { const r = w.act({ action: 'show', args: { thing, set: thing === '*' ? 'each' : undefined, view } }); return r.ok ? r.result.things.map((t) => [t.id, ...Object.values(t.values)].join(' ')) : r.violations[0].why; };

test('views: a thing made once is in every view it has the aspects for; a lacking aspect is refused with the reason', () => {
  const w = makeWorld();
  w.act({ action: 'make', args: { kind: 'fish' } });
  assert.deepEqual([show(w, 'picture'), show(w, 'chart'), show(w, 'list')], [['fish1 water fish'], ['fish1 small fish'], ['fish1 fish small water']]);
  w.act({ action: 'change', args: { thing: 'fish1', attr: 'size', value: 'large' } });
  assert.deepEqual(show(w, 'chart'), ['fish1 large fish'], 'an act in one is seen by the others');
  w.act({ action: 'make', args: { kind: 'table' } });
  assert.equal(show(w, 'picture', 'table'), 'a table has no place on Earth');
  assert.deepEqual(w.act({ action: 'show', args: { thing: 'table', view: 'picture' } }).violations[0].reason.has, ['label']);
  assert.equal(w.ofType('std.acts.shown').length, 3, 'what is shown where is a fact too');
});

test('taught facts: their own tier, who taught them, the same change in all three views, and forgetting', () => {
  const w = makeWorld();
  w.act({ action: 'make', args: { kind: 'pony' } });
  assert.deepEqual(show(w, 'list'), ['pony1 pony  '], 'nothing known about ponies');
  const t = w.act({ action: 'teach', args: { fact: '@pony.isa k.commonsense.thing name=pony is_a=horse', by: 'Ana' } });
  assert.deepEqual([t.result, w.tier('pony.isa'), w.get('pony.isa').attrs['core.source']], [{ act: 'teach', facts: ['pony.isa'], by: 'Ana' }, 'taught', ['"taught by Ana"']]);
  const m = w.act({ action: 'make', args: { kind: 'pony' } });
  assert.deepEqual(m.result.filled, [{ key: 'place', value: 'field', tier: 'taught', source: 'taught by Ana' }, { key: 'size', value: 'large', tier: 'taught', source: 'taught by Ana' }]);
  assert.deepEqual([show(w, 'picture')[1], show(w, 'chart')[1], show(w, 'list')[1]], ['pony2 field pony', 'pony2 large pony', 'pony2 pony large field']);
  assert.deepEqual(w.why('pony.isa').steps[0].action, 'teach');
  // what was just said still wins over what was taught
  assert.equal(w.get(w.act({ action: 'make', args: { kind: 'pony', size: 'small' } }).result.thing).attrs.size[0], 'small');
  assert.deepEqual(w.act({ action: 'forget', args: { fact: 'pony.isa' } }).result, { act: 'forget', fact: 'pony.isa' });
  assert.equal(w.act({ action: 'make', args: { kind: 'pony' } }).result.filled, undefined, 'forgotten: nothing to fill from');
});

test('complete: defaults learnt after a thing was made are applied on request, with tier and source; never silently', () => {
  const w = makeWorld();
  w.act({ action: 'make', args: { kind: 'pony' } });
  w.act({ action: 'teach', args: { fact: '@pony.isa k.commonsense.thing name=pony is_a=horse', by: 'Ana' } });
  assert.equal(w.get('pony1').attrs.place, undefined, 'not silently');
  const r = w.act({ action: 'complete', args: {} });
  assert.deepEqual(r.result.filled, [{ thing: 'pony1', key: 'place', value: 'field', tier: 'taught', source: 'taught by Ana' }, { thing: 'pony1', key: 'size', value: 'large', tier: 'taught', source: 'taught by Ana' }]);
  assert.deepEqual([w.get('pony1').attrs.place, w.tier('pony1', 'place')], [['field'], 'default']);
  w.undo();
  assert.equal(w.get('pony1').attrs.place, undefined, 'one undo step');
});
