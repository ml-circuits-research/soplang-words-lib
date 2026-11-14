// std.motion, the full format (reviewer 12:45): the published k.motion read by the library;
// the same plan as the knowledge repository's test oracle, read in place at the pinned commit
// (one scheduler, no copies). Skipped when the knowledge repository cannot be read.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { World, readMotion, planMotionFacts, splitText } from '../tools/lib-under-test.mjs';
import { worldText, worldsDir } from '../tools/worlds.mjs';

const dir = worldsDir();
const oraclePath = dir ? `${dir}tools/lib/motion.mjs` : null;
const skip = (!oraclePath || !existsSync(oraclePath)) && 'the knowledge repository (with its motion oracle) cannot be read here';
const BASE = { mouth: 'neutral', eyebrows: 'neutral', eyes: 'open' };
const features = (key, value) => (key === 'eyes' && value === 'closed' ? { shape: ['closed'] } : {});

test('k.motion: the library plans what the oracle plans (changes and emitted events), for replies, outcomes and seeds', { skip }, async () => {
  const oracle = await import(oraclePath);
  const w = new World();
  assert.ok(w.tell(worldText('k.motion')).ok);
  const mine = readMotion(w), theirs = oracle.readMotion(w);
  assert.equal(mine.rules.length, theirs.rules.length);
  const cases = [
    [{ t: 300, name: 'reply', fields: { outcome: 'done', text: 'Done, I moved it.' } }],
    [{ t: 0, name: 'reply', fields: { outcome: 'refused', text: 'I cannot do that.' } }],
    [{ t: 100, name: 'reply', fields: { outcome: 'done', text: 'Okay.' } }, { t: 900, name: 'reply', fields: { outcome: 'asked', text: 'Which one?' } }],
    [],
  ];
  let compared = 0;
  for (const events of cases) for (const seed of [1, 3, 7]) {
    const a = planMotionFacts(mine, { events, seed, end: 8000, base: BASE, features, aliases: { one_eye: 'eyes' }, keys: ['mouth', 'eyebrows', 'eyes', 'one_eye'] });
    const b = oracle.planMotion(theirs, { events, seed, end: 8000, base: BASE, features });
    assert.deepEqual(a.changes, b.changes, `changes, seed ${seed}, ${JSON.stringify(events)}`);
    assert.deepEqual(a.emitted, b.emitted, `emitted, seed ${seed}`);
    compared++;
  }
  assert.equal(compared, 12);
});

test('k.motion: the splitter is data; a named host function overrides it (Q46 a)', { skip }, () => {
  const w = new World(); w.tell(worldText('k.motion'));
  const m = readMotion(w);
  const name = [...m.splitters.keys()][0];
  const units = splitText(m.splitters.get(name), 'Mo!');
  assert.deepEqual(units.map((u) => u.char), ['M', 'o', '!']);
  const talk = m.rules.find((r) => r.steps.some((s) => s.per));
  const field = talk.steps.find((s) => s.per).per;
  const plan = planMotionFacts(m, { events: [{ t: 0, name: talk.on, fields: { outcome: 'done', [field]: 'ab' } }], end: 3000, base: BASE, splitters: { [name]: () => [{ char: 'x', group: 'x', class: [...m.visemes.keys()][0], min: 50, max: 50 }] } });
  assert.ok(plan.segments.some((s) => s.char === 'x'), 'the host function was used instead of the facts');
});
