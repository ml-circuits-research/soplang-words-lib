// All or nothing for one sentence (Round 19, item 6): the requests of one sentence are
// applied together or not at all, and they are one step for undo and redo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const make = () => {
  const w = new World({ actions: { put: ({ tell }, { thing, place }) => { tell(`@${thing} item name=${thing} place=${place}`); tell(`@log_${thing} moved thing=$${thing}`); return true; } } });
  w.load(String.raw`
@a core.action name=put fn=put required=thing required=place ask.place="Where?"
@k core.slot of=item key=name id=true
@k2 core.slot of=item key=place enum=table enum=shelf enum=floor
@it item name=?x place=?p
@to item core.on=$it place=?q
@move core.action name=move param=x param=q when=$it set=$to
`);
  w.tell('@z item name=old place=table');
  return w;
};
const PUT = (thing, place) => ({ action: 'put', args: place ? { thing, place } : { thing } });

test('one sentence: a refused request keeps the others out', () => {
  const w = make();
  const before = w.toSOP({ derived: true });
  const r = w.act([PUT('cup', 'table'), PUT('boat', 'sea')]);
  assert.deepEqual([r.ok, r.status, r.failed, r.results.map((x) => x.status), r.violations[0].kind], [false, 'refused', 1, ['done', 'refused'], 'domain']);
  assert.equal(w.toSOP({ derived: true }), before);
  assert.equal(w.history().length, 1);
});

test('one sentence: a request that lacks an argument keeps the others out, and says what to ask', () => {
  const w = make();
  const r = w.act([PUT('cup', 'table'), { action: 'move', args: { x: 'old', q: 'shelf' } }, PUT('boat')]);
  assert.deepEqual([r.ok, r.status, r.failed, r.missing], [false, 'missing', 2, [{ action: 'put', key: 'place', ask: 'Where?' }]]);
  assert.deepEqual([w.has('cup'), w.get('z').attrs.place], [false, ['table']]);
});

test('one sentence: done together, undone and redone as one step', () => {
  const w = make();
  const r = w.act([PUT('cup', 'table'), { action: 'move', args: { x: 'old', q: 'shelf' } }, PUT('boat', 'floor')]);
  assert.deepEqual([r.ok, r.results.map((x) => x.status)], [true, ['done', 'done', 'done']]);
  w.tell('@n note text=after');
  w.undo();
  assert.deepEqual([w.has('n'), w.has('cup'), w.has('boat')], [false, true, true], 'the statement after it is its own step');
  const u = w.undo();
  assert.equal(u.ok, true);
  assert.deepEqual([w.has('cup'), w.has('boat'), w.has('log_cup'), w.get('z').attrs.place], [false, false, false, ['table']]);
  w.redo();
  assert.deepEqual([w.has('cup'), w.has('boat'), w.get('z').attrs.place], [true, true, ['shelf']]);
  // saved and restored: still one step
  const back = World.fromJSON(w.toJSON(), { actions: { put: () => true } });
  back.undo();
  assert.deepEqual([back.has('cup'), back.has('boat'), back.get('z').attrs.place], [false, false, ['table']]);
});
