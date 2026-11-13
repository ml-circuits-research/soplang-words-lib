// The remaining acts (Round 21, item 2): send to another world (both schemas checked, one
// undo step), save / load, undo / redo as acts with the same diff.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const make = () => {
  const w = new World();
  w.load(String.raw`@acts core.use world=std.acts
@a std.schema.world name=avatar
@f std.schema.world name=face
@c std.schema.world name=chart
@t core.type of=hat extends=std.schema.thing closed=true
@s core.slot of=hat key=colour enum=red enum=blue default=red
@k std.schema.kind of=hat world=avatar world=face acts=make acts=send acts=change acts=save
@t2 core.type of=bar extends=std.schema.thing closed=true
@k2 std.schema.kind of=bar world=chart acts=make`);
  return w;
};
const act = (w, action, args = {}) => w.act({ action, args });

test('send: to a world that has the kind, one undo step; refused with the reason otherwise', () => {
  const w = make();
  act(w, 'make', { kind: 'hat', world: 'avatar' });
  const r = act(w, 'send', { thing: 'hat', to: 'face' });
  assert.deepEqual([r.result, r.diff.changed], [{ act: 'send', thing: 'hat1', from: 'avatar', to: 'face' }, [{ id: 'hat1', key: 'world', from: 'avatar', to: 'face', toTier: 'told' }]]);
  assert.equal(act(w, 'send', { thing: 'hat', to: 'chart' }).violations[0].why, 'chart has no hat');
  assert.equal(act(w, 'send', { thing: 'hat', to: 'nowhere' }).violations[0].why, 'there is no world nowhere');
  act(w, 'make', { kind: 'bar' });
  assert.equal(act(w, 'send', { thing: 'bar', to: 'face' }).violations[0].why, 'a bar cannot be sent from chart');
  w.undo(); // the bar
  w.undo(); // the send, as one step
  assert.deepEqual([w.has('bar1'), w.get('hat1').attrs.world], [false, ['avatar']]);
});

test('undo and redo as acts, with their difference; not inside another change', () => {
  const w = make();
  act(w, 'make', { kind: 'hat', world: 'avatar' });
  act(w, 'change', { thing: 'hat', attr: 'colour', value: 'blue' });
  const u = act(w, 'undo');
  assert.deepEqual([u.ok, u.result.act, u.diff.changed.map((c) => [c.key, c.from, c.to])], [true, 'undo', [['colour', 'blue', 'red']]]);
  const r = act(w, 'redo');
  assert.deepEqual([r.result.act, w.get('hat1').attrs.colour], ['redo', ['blue']]);
  const both = w.act([{ action: 'change', args: { thing: 'hat', attr: 'colour', value: 'red' } }, { action: 'undo' }]);
  assert.deepEqual([both.ok, both.failed, w.get('hat1').attrs.colour], [false, 1, ['blue']]);
});

test('save and load: the things as they were saved come back; what was made since goes', () => {
  const w = make();
  act(w, 'make', { kind: 'hat', world: 'avatar' });
  assert.deepEqual(act(w, 'save', { name: 'start' }).result, { act: 'save', name: 'start', things: 1 });
  act(w, 'change', { thing: 'hat1', attr: 'colour', value: 'blue' });
  act(w, 'make', { kind: 'hat', world: 'face' });
  const r = act(w, 'load', { name: 'start' });
  assert.deepEqual([r.ok, w.get('hat1').attrs.colour, w.has('hat2')], [true, ['red'], false]);
  assert.deepEqual(r.diff.removed.map((x) => x.id), ['hat2']);
  assert.equal(act(w, 'load', { name: 'other' }).violations[0].why, 'nothing is saved as other');
});
