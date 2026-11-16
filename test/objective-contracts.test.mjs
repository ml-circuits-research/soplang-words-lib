import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { World } from '../tools/lib-under-test.mjs';
const example = readFileSync(new URL('../books/sop-worlds-teorie.md', import.meta.url), 'utf8')
  .match(/```sop\n(@objective.layout std.objective[\s\S]*?)\n```/)[1];
const make = () => {
  const w = new World(); w.load('@use core.use world=std.objective'); return w;
};
const term = '@t std.objective.term evaluator=cost normalisation=declared.by.evaluator weight=1 priority=0';
const objective = '@o std.objective order=lexicographic direction=minimise term=$t';

test('the exact book objective loads with forward term references under closed schemas', () => {
  const w = make(); w.load(example);
  assert.equal(w.check().ok, true);
  assert.equal(w.schema('std.objective').closed, true);
  assert.equal(w.schema('std.objective.term').closed, true);
  assert.deepEqual(w.get('objective.layout').attrs.term, ['$term.move', '$term.crowding']);
});

test('every structural field is mandatory, with atomic rollback for incomplete records', () => {
  for (const [wire, fields] of [[term, ['evaluator', 'normalisation', 'weight', 'priority']],
    [objective, ['order', 'direction', 'term']]]) {
    for (const field of fields) {
      const w = make();
      const bad = wire.replace(new RegExp(` ${field}=[^ ]+`), '');
      const result = w.tell(wire === objective ? `${term}\n${bad}` : bad);
      assert.equal(result.ok, false, `${field}: ${bad}`);
      assert.ok(result.violations.some((v) => v.kind === 'missing-key' && v.key === field));
      assert.equal(w.ofType('std.objective.term').length, 0);
    }
  }
});

test('weights and priorities reject malformed numeric data and unsafe priority integers', () => {
  for (const [field, values] of [
    ['weight', ['-1', '2kg', '"1"', 'NaN', 'Infinity', '1e999']],
    ['priority', ['-1', '0.5', '"1"', '2kg', 'Infinity', '9007199254740992', '9'.repeat(400)]],
  ]) for (const value of values) {
    const w = make();
    assert.equal(w.tell(term.replace(new RegExp(`${field}=[^ ]+`), `${field}=${value}`)).ok, false, `${field}=${value}`);
  }
});

test('unknown variants, fields and wrong reference types are rejected', () => {
  for (const wire of [
    objective.replace('lexicographic', 'random'),
    objective.replace('minimise', 'guess'),
    objective.replace('$t', '"$t"'),
    objective.replace('$t', '$missing'),
    objective.replace('$t', '$o'),
    `${objective} direction=maximise`,
    `${objective} anything=allowed`,
    term.replace('declared.by.evaluator', 'choose.afterwards'),
    `${term} weight=2`,
  ]) {
    const w = make();
    const result = w.tell(wire.startsWith('@o') ? `${term}\n${wire}` : wire);
    assert.equal(result.ok, false, wire);
  }
});

test('shared priorities, finite fractional weights and explicit zero contributions are valid', () => {
  const w = make();
  w.load(`${term}\n@u std.objective.term evaluator=other.cost normalisation=declared.by.evaluator weight=0.25 priority=0\n@disabled std.objective.term evaluator=inactive.cost normalisation=declared.by.evaluator weight=0 priority=1\n@o std.objective order=lexicographic direction=maximise term=$t term=$u term=$disabled term=$t`);
  assert.deepEqual(w.get('o').attrs.term, ['$t', '$u', '$disabled'], 'membership is by unique term identity');
  assert.equal(w.check().ok, true);
});

test('referenced terms cannot be deleted or replaced by incomplete records', () => {
  const w = make(); w.load(`${term}\n${objective}`);
  assert.equal(w.retract('t').ok, false);
  assert.equal(w.applyPatch({ replace: { id: 't', attrs: { evaluator: 'cost' } } }).ok, false);
  assert.equal(w.get('t').attrs.weight[0], '1');
  assert.equal(w.check().ok, true);
});

test('objective aliases and unrelated evaluator names use the same structural contract', () => {
  const w = new World(); w.load('@use core.use world=std.objective as=app.goal');
  w.load('@t app.goal.term evaluator=energy.loss normalisation=declared.by.evaluator weight=3 priority=9007199254740991\n@o app.goal order=lexicographic direction=minimise term=$t');
  assert.equal(w.check().ok, true);
  assert.deepEqual(w.get('t').attrs.evaluator, ['energy.loss']);
});
