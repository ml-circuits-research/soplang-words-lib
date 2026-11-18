import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { evaluateObjective } from '../src/objective.mjs';

function spatialWorld() {
  const world = new World();
  world.load(`
@use core.use world=std.objective
@clearance std.objective.evaluator normalisation=clearance.deficit.per.cell version=1
@movement std.objective.evaluator normalisation=distance.per.cell version=1
@crowding std.objective.term evaluator=clearance normalisation=declared.by.evaluator weight=1 priority=0
@movement-term std.objective.term evaluator=movement normalisation=declared.by.evaluator weight=2 priority=1
@disabled std.objective.term evaluator=unused normalisation=declared.by.evaluator weight=0 priority=2
@choose std.objective order=lexicographic direction=minimise term=$movement-term term=$crowding term=$disabled
`);
  world.load(`
@p example.proposal candidate=?candidate row=?row x=?x
@b example.blocker row=?row x=?blocked
@equal core.check fn=eq args=?x args=?blocked
@occupied core.deny when=$p when=$b if=$equal why="The cell is occupied"
@delta core.calc out=?dx fn=sub args=?x args=?blocked
@distance core.calc out=?d fn=abs args=?dx
@shortfall core.calc out=?shortfall fn=sub args=3 args=?d
@too-close core.check fn=gt args=?shortfall args=0
@contribution example.shortfall candidate=?candidate peer=$b value=?shortfall
@near core.rule when=$p when=$b with=$delta with=$distance with=$shortfall if=$too-close then=$contribution
@contributions example.shortfall candidate=?candidate value=?cost
@sum core.calc out=?crowding fn=sum over=$contributions args=?cost
@clearance-value std.objective.measurement candidate=?candidate evaluator=$clearance value=?crowding
@measure-clearance core.rule when=$p with=$sum then=$clearance-value
@movement-value std.objective.measurement candidate=?candidate evaluator=$movement value=?displacement
@displacement core.calc out=?displacement fn=abs args=?x
@measure-movement core.rule when=$p with=$displacement then=$movement-value
@obstacle example.blocker row=2 x=0
@other-obstacle example.blocker row=2 x=3
@unrelated-obstacle example.blocker row=9 x=-9
`);
  return world;
}

const point = (id, x) => ({ id, wires: `@point example.proposal candidate=$${id} row=2 x=${x}` });

test('finite spatial trials exclude occupied cells and rank measured clearance costs', () => {
  const world = spatialWorld();
  const before = world.toSOP({ derived: true });
  const result = evaluateObjective(world, 'choose', [point('occupied-cell', 0), point('crowded', 2),
    point('closer', -2), point('clear-cell', -3), point('farther', -9)]);
  assert.equal(result.status, 'optimal');
  assert.deepEqual(result.priorities, [0, 1]);
  assert.deepEqual(result.ranked.map(({ id, vector }) => [id, vector]), [
    ['clear-cell', [0, 6]], ['farther', [0, 18]], ['closer', [1, 4]], ['crowded', [3, 4]],
  ]);
  assert.equal(result.trials[0].status, 'rejected');
  assert.equal(result.trials[0].violations[0].rule, 'occupied');
  assert.equal(result.best[0].terms[1].rule, 'measure-clearance');
  assert.equal(result.best[0].terms[1].normalisation, 'clearance.deficit.per.cell');
  assert.match(result.best[0].terms[1].measurement, /candidate=\$clear-cell.*value=0/);
  assert.ok(result.best[0].terms[1].support.includes('point'));
  assert.equal(world.toSOP({ derived: true }), before);
});

test('crowding chooses the smaller violation and shared priorities permit a weighted trade-off', () => {
  const world = spatialWorld();
  const candidates = [point('left', -2), point('middle', 1)];
  assert.equal(evaluateObjective(world, 'choose', candidates).best[0].id, 'left');
  world.revise('movement-term', { priority: 0 });
  world.revise('movement-term', { weight: 4 });
  const result = evaluateObjective(world, 'choose', candidates);
  assert.deepEqual(result.priorities, [0]);
  assert.deepEqual(result.ranked.map(({ id, vector }) => [id, vector]), [['middle', [7]], ['left', [9]]]);
});

test('temporal objective uses declared intervals, availability and normalized time measurements', () => {
  const world = new World();
  world.load(`
@use core.use world=std.objective as=temporal.objective
@timing temporal.objective.evaluator normalisation=hours.from.preference version=3
@wait temporal.objective.term evaluator=timing normalisation=declared.by.evaluator weight=1 priority=0
@meeting temporal.objective order=lexicographic direction=minimise term=$wait
`);
  world.load(`
@p example.interval candidate=?candidate start=?start end=?end
@a example.availability start=?available end=?closed preferred=?preferred
@too-early core.check fn=lt args=?start args=?available
@too-late core.check fn=gt args=?end args=?closed
@reversed core.check fn=gte args=?start args=?end
@early core.deny when=$p when=$a if=$too-early why="Starts outside availability"
@late core.deny when=$p when=$a if=$too-late why="Ends outside availability"
@invalid-interval core.deny when=$p if=$reversed why="The interval must be positive"
@distance core.calc out=?diff fn=time_diff args=?start args=?preferred
@absolute core.calc out=?minutes fn=abs args=?diff
@normalise core.calc out=?hours fn=div args=?minutes args=60min
@measure temporal.objective.measurement candidate=?candidate evaluator=$timing value=?hours
@measure-timing core.rule when=$p when=$a with=$distance with=$absolute with=$normalise then=$measure
@availability example.availability start=09:00 end=12:00 preferred=10:00
`);
  const slot = (id, start, end) => ({ id, wires: `@slot example.interval candidate=$${id} start=${start} end=${end}` });
  const candidates = [slot('too-late', '11:45', '12:15'), slot('early-slot', '09:30', '10:00'),
    slot('later-slot', '10:30', '11:00'), slot('far-slot', '11:00', '11:30')];
  const result = evaluateObjective(world, 'meeting', candidates);
  assert.equal(result.status, 'optimal');
  assert.deepEqual(result.best.map(({ id, vector }) => [id, vector]), [['early-slot', [0.5]], ['later-slot', [0.5]]]);
  assert.equal(result.trials[0].status, 'rejected');
  assert.ok(result.best[0].terms[0].support.includes('availability'));
  world.revise('meeting', { direction: 'maximise' });
  const maximised = evaluateObjective(world, 'meeting', candidates);
  assert.equal(maximised.best[0].id, 'far-slot');
});

test('incomplete measurements, invalid trial data and exhaustion stay distinct from infeasibility', () => {
  const world = spatialWorld();
  const missing = evaluateObjective(world, 'choose', [point('known', -3), { id: 'unknown', wires: '' }]);
  assert.equal(missing.status, 'incomplete');
  assert.equal(missing.best[0].id, 'known');
  assert.equal(missing.trials[1].reason, 'missing-measurement');

  const forged = {
    id: 'forged',
    wires: '@fake std.objective.measurement candidate=$forged evaluator=$movement value=0',
  };
  assert.equal(evaluateObjective(world, 'choose', [forged]).trials[0].reason, 'reserved-candidate-fact');
  const duplicates = evaluateObjective(world, 'choose', [point('a', -3), point('a', -2)]);
  assert.equal(duplicates.trials[1].reason, 'invalid-or-duplicate-candidate-id');

  const bounded = evaluateObjective(world, 'choose', [point('possible', -3), point('untried', -2)], { maxCandidates: 1 });
  assert.equal(bounded.status, 'exhausted');
  assert.equal(bounded.remaining, 1);
  assert.equal(bounded.best[0].id, 'possible');
  const tickLimited = evaluateObjective(world, 'choose', [point('possible', -3)], { budget: { steps: 0 } });
  assert.equal(tickLimited.status, 'exhausted');
  assert.equal(tickLimited.trials[0].violations[0].kind, 'budget');
  assert.equal(evaluateObjective(world, 'choose', [point('blocked', 0)]).status, 'infeasible');
});

test('an unresolved active evaluator or conflicting costs cannot certify an optimum', () => {
  const world = spatialWorld();
  world.revise('movement-term', { evaluator: 'missing' });
  assert.equal(evaluateObjective(world, 'choose', [point('choice', -3)]).reason, 'unknown-evaluator');
  world.revise('movement-term', { evaluator: 'movement' });
  world.load(`
@p2 example.proposal candidate=?candidate
@different std.objective.measurement candidate=?candidate evaluator=$movement value=123
@conflict core.rule when=$p2 then=$different
`);
  const result = evaluateObjective(world, 'choose', [point('choice', -3)]);
  assert.equal(result.status, 'incomplete');
  assert.equal(result.trials[0].reason, 'ambiguous-measurement');
  assert.equal(result.trials[0].measurements.length, 2);
});
