// Cycles, clocks and contrasts (reviewer 09:20 L2 and L4; real turns r0586/r0587 "today is Friday" / "what day is
// tomorrow", r0610/r0611 "how is a circle different from other shapes"). An invented toy world, then the
// published k.time and k.shapes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, cycleOf, cycleAdd, cycleDiff, statedDay, readClock, writeClock, contrastOf } from '../tools/lib-under-test.mjs';
import { worldsDir, catalogWorld } from '../tools/worlds.mjs';

test('cycles over member facts; a stated day; the 12-hour clock read and written', () => {
  const w = new World();
  w.tell('@a ex.day name=Mon cycle=wk n=1  @b ex.day name=Tue cycle=wk n=2  @c ex.day name=Wed cycle=wk n=3');
  const O = { type: 'ex.day' };
  assert.deepEqual([cycleAdd(w, 'Wed', 1, O), cycleAdd(w, 'Mon', -1, O), cycleDiff(w, 'Wed', 'Tue', O)], ['Mon', 'Wed', 2]);
  assert.equal(cycleOf(w, 'Tue', O).members.length, 3);
  assert.equal(statedDay(w, 'I should tell you, today is Tue', { cycle: 'wk', type: 'ex.day' }), 'Tue');
  assert.equal(statedDay(w, 'Tue was fun', { cycle: 'wk', type: 'ex.day' }), null, 'no word of today');
  assert.deepEqual(["3 o'clock", 'half past 3', 'quarter to 4', '10 past 6', '3:30 pm', 'noon'].map((t) => readClock(t)), [180, 210, 225, 370, 930, 720]);
  assert.equal(writeClock(readClock("3 o'clock") + 120), "5 o'clock", '"3 o\'clock" + 2 h');
  assert.deepEqual([writeClock(210), writeClock(225), writeClock(370), writeClock(930, { ampm: true })], ['half past 3', 'quarter to 4', '6:10', 'half past 3 pm']);
});

test('the published k.time and k.shapes: tomorrow after a stated Friday; how a circle differs from other shapes', { skip: !worldsDir() && 'offline' }, async () => {
  const w = await catalogWorld({ 'k.time': ['k.time.weekday', 'k.time.month', 'k.time.season'], 'k.shapes': ['k.shapes.shape'] });
  assert.equal(cycleAdd(w, statedDay(w, 'I should tell you, today is Friday'), 1), 'Saturday');
  assert.deepEqual([cycleAdd(w, 'Friday', 3), cycleDiff(w, 'Wednesday', 'Friday'), cycleAdd(w, 'December', 2), cycleAdd(w, 'winter', 1)], ['Monday', 2, 'February', 'spring']);
  const c = contrastOf(w, 'circle');
  assert.deepEqual(c.contrasts.slice(0, 3).map((x) => x.key), ['corners', 'sides', 'round'], 'the rarest values first');
  assert.ok(c.siblings.includes('triangle') && c.parents.includes('flat'));
  assert.match(contrastOf(w, 'nothing').why, /nothing is called/);
});
