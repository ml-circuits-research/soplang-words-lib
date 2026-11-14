// std.motion: states over time from rules, pure and seeded (a traffic light, a blinking dot,
// a talking mouth over an expression; priorities, cancel, seed determinism).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, motionPlan, motionRun } from '../tools/lib-under-test.mjs';

test('motion: a traffic light — steps in order with durations', () => {
  const w = new World();
  w.tell(`@b mo.base key=light value=red
@r mo.rule name=go on=button
@s1 mo.step rule=go n=1 key=light value=green dur=3000
@s2 mo.step rule=go n=2 key=light value=amber dur=1000`);
  assert.deepEqual(motionPlan(w, [{ t: 500, type: 'button' }], { until: 6000 }), [
    { t: 0, key: 'light', value: 'red' }, { t: 500, key: 'light', value: 'green' }, { t: 3500, key: 'light', value: 'amber' }, { t: 4500, key: 'light', value: 'red' }]);
});

const FACE = `@b1 mo.base key=eyes value=open  @b2 mo.base key=mouth value=rest
@blink mo.rule name=blink repeat=2000-4000 priority=1
@bs mo.step rule=blink n=1 key=eyes value=closed dur=120-180
@smile mo.rule name=smile on=feel when.feeling=happy priority=1 ease=300
@ss mo.step rule=smile n=1 key=mouth value=smile dur=2000
@talk mo.rule name=talk on=say priority=5 split=letters else=closed
@ts mo.step rule=talk n=1 key=mouth per=unit dur=100
@c1 mo.class rule=talk unit=a value=open  @c2 mo.class rule=talk unit=o value=round`;
const letters = (text) => [...text.replace(/\W/g, '')];

test('motion: the same seed gives the same plan; idle repeats; a condition on the event', () => {
  const w = new World(); w.tell(FACE);
  const a = motionPlan(w, [], { seed: 7, until: 10000 }), b = motionPlan(w, [], { seed: 7, until: 10000 });
  assert.deepEqual(a, b, 'deterministic');
  assert.notDeepEqual(a, motionPlan(w, [], { seed: 8, until: 10000 }));
  assert.ok(a.filter((p) => p.key === 'eyes' && p.value === 'closed').length >= 2, 'it blinks, again and again');
  assert.equal(motionPlan(w, [{ t: 100, type: 'feel', fields: { feeling: 'sad' } }], { until: 1000 }).filter((p) => p.key === 'mouth' && p.value === 'smile').length, 0, 'when.feeling=happy only');
});

test('motion: a talking mouth (per unit of a stream) holds over a smile; blinking goes on; a new event cancels the rest', () => {
  const w = new World(); w.tell(FACE);
  const plan = motionPlan(w, [{ t: 0, type: 'feel', fields: { feeling: 'happy' } }, { t: 500, type: 'say', stream: 'ao' }], { until: 3000, splitters: { letters }, seed: 3 });
  const mouth = plan.filter((p) => p.key === 'mouth').map((p) => [p.t, p.value]);
  assert.deepEqual(mouth, [[0, 'smile'], [500, 'open'], [600, 'round'], [700, 'smile'], [2000, 'rest'], [2300, 'rest']].filter((x, i, all) => i === 0 || x[1] !== all[i - 1][1]), 'talk over smile, then the smile again, then base');
  assert.ok(plan.some((p) => p.key === 'eyes'), 'blinking is another key: it goes on');
  const cut = motionPlan(w, [{ t: 0, type: 'say', stream: 'aaaaa' }, { t: 200, type: 'say', stream: 'o' }], { until: 1000, splitters: { letters } }).filter((p) => p.key === 'mouth').map((p) => [p.t, p.value]);
  assert.deepEqual(cut, [[0, 'open'], [200, 'round'], [300, 'rest']], 'the second say cancels what was left of the first');
});

test('motion: run plays a plan through the host clock, and can be cancelled', () => {
  const calls = [], timers = [];
  const clock = { setTimeout: (f, t) => { timers.push({ f, t }); return timers.length - 1; }, clearTimeout: (h) => { timers[h] = null; } };
  const cancel = motionRun([{ t: 0, key: 'k', value: 'a' }, { t: 10, key: 'k', value: 'b' }], (k, v) => calls.push(v), clock);
  timers[0].f(); cancel();
  assert.deepEqual([calls, timers[1]], [['a'], null]);
});
