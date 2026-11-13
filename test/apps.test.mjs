// The two small applications of the 01:20 block, written from the docs: a room planner
// (space + knowledge + views) and a classroom timetable (scheduling + people + time).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from '../tools/lib-under-test.mjs';
import * as rooms from '../examples/second-app/rooms.mjs';
import * as school from '../examples/second-app/timetable.mjs';

test('room planner: the usual size from the catalog; a piece stays in its room and off other pieces; a view over every thing', () => {
  const w = rooms.makeApp();
  w.tell(rooms.GRAMMAR + '\n@syn core.word text=couch means=sofa');
  assert.ok(w.act({ action: 'make', args: { kind: 'room', w: 400, d: 300 } }).ok);
  const sofa = w.act({ action: 'make', args: { kind: 'sofa', in: '$room1', x: 0, y: 0 } });
  assert.deepEqual([w.get('sofa1').attrs.w, w.get('sofa1').attrs.d], [['200'], ['90']], 'knowledge fills what the request left out');
  assert.ok(sofa.ok);
  assert.equal(w.act({ action: 'make', args: { kind: 'desk', in: '$room1', x: 100, y: 50 } }).violations[0].why, 'it would stand on another piece');
  assert.equal(w.act({ action: 'make', args: { kind: 'bed', in: '$room1', x: 300, y: 100 } }).violations[0].why, 'it does not fit in the room there');
  const couch = resolve(w, 'the couch', rooms.words);
  assert.deepEqual(couch.ids, ['sofa1']);
  assert.equal(w.act({ action: 'change', args: { thing: 'sofa1', attr: 'y', value: 250 } }).ok, false);
  assert.ok(w.act({ action: 'change', args: { thing: 'sofa1', attr: 'y', value: 200 } }).ok);
  const plan = w.act({ action: 'show', args: { thing: '*', set: 'each', view: 'floor' } }).result;
  assert.deepEqual([plan.things.map((t) => t.id), plan.skipped], [['sofa1'], ['room1']], 'every thing in a view: the room is left out, and said');
});

test('timetable: no teacher, class or room twice in a period; seats; days away; the solver places the rest', () => {
  const w = school.makeApp();
  const lesson = (args) => w.act({ action: 'make', args: { kind: 'lesson', ...args } });
  assert.ok(lesson({ subject: 'maths', group: '$g7a', teacher: '$ana', room: '$lab', at: '$mon1' }).ok);
  assert.equal(lesson({ subject: 'physics', group: '$g7b', teacher: '$ana', room: '$hall', at: '$mon1' }).violations[0].why, 'the teacher has another lesson then');
  assert.equal(lesson({ subject: 'physics', group: '$g7b', teacher: '$ben', room: '$lab', at: '$mon2' }).violations[0].why, 'the room is too small for the class');
  assert.equal(lesson({ subject: 'art', group: '$g7a', teacher: '$ana', room: '$hall', at: '$wed1' }).violations[0].why, 'the teacher is away that day');
  assert.ok(w.act([['history', '$g7b', '$ana'], ['english', '$g7a', '$ben'], ['english', '$g7b', '$ben']].map(([subject, group, teacher]) => ({ action: 'make', args: { kind: 'lesson', subject, group, teacher } }))).ok);
  const c = w.complete({ choose: true });
  assert.equal(w.open().length, 0, 'every lesson has a period and a room');
  assert.ok(c.filled.length >= 6);
  const ls = w.ofType('lesson');
  for (const k of ['teacher', 'group', 'room']) assert.equal(new Set(ls.map((l) => `${l.attrs[k][0]}@${l.attrs.at[0]}`)).size, ls.length, `no ${k} twice in a period`);
});
