// Story plans (reviewer 20:05 item 1): the elements of k.story solved jointly over the published
// catalog. The oracle is the knowledge repository's own checker (tools/story-core.mjs checkPlan,
// imported in place at the pinned commit): every plan drawn must break no hard constraint.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readStory, storyPlan, compose } from '../tools/lib-under-test.mjs';
import { worldsDir, worldText, catalogWorld, publishedWorlds } from '../tools/worlds.mjs';

const CATALOG = { 'k.story': ['k.story.element', 'k.story.goal', 'k.story.obstacle', 'k.story.constraint'], 'k.scenes': ['k.scenes.scene', 'k.scenes.has'],
  'k.actions': ['k.actions.action'], 'k.people': ['k.people.role', 'k.people.kind'], 'k.animals': ['k.animals.animal'], 'k.objects': ['k.objects.object'] };
const offline = !worldsDir() && 'offline';
const ORDER = ['setting', 'protagonist', 'goal', 'target', 'obstacle', 'attempt', 'helper', 'means', 'turning point', 'resolution', 'ending'];
const asOracle = (p) => ({ ...p, obstacle: p.obstacle.split('|')[0], attempts: p.attempt ?? [], turning_point: p['turning point'], order: ORDER });

test('storyPlan: plans drawn over the published catalog break no hard constraint (the repository checker), soft ones weighted', { skip: offline }, async () => {
  const w = await catalogWorld(CATALOG), kb = readStory(w);
  const core = await import(`${worldsDir()}tools/story-core.mjs`), okb = core.storyKb(publishedWorlds());
  const constraints = w.ofType('k.story.constraint').map((c) => ({ name: c.attrs.name[0].replace(/^"|"$/g, ''), strength: c.attrs.strength[0] }));
  let ending = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const r = storyPlan(kb, { seed });
    assert.ok(!r.why, `seed ${seed}: ${r.why}`);
    const check = core.checkPlan(okb, constraints, asOracle(r.plan));
    assert.deepEqual(check.hard, [], `seed ${seed}: ${JSON.stringify(r.plan)}`);
    if (r.soft.includes('ending reaches the goal')) ending++;
  }
  assert.ok(ending >= 24, `the soft "ending reaches the goal" held ${ending} of 30 (uniform sampling holds soft constraints rarely)`);
  const girl = storyPlan(kb, { seed: 4, fixed: { protagonist: 'girl' } });
  assert.equal(girl.plan.protagonist, 'girl');
  assert.deepEqual(core.checkPlan(okb, constraints, asOracle(girl.plan)).hard, []);
  assert.match(storyPlan({ ...kb, constraints: [...kb.constraints, { name: 'x', element: 'goal', relation: 'rhymes', other: 'setting', strength: 'hard' }] }).why, /no meaning for the relation rhymes/);
});

test('compose a story: the genre story of k.genres, its moves told from a k.story plan, the topic as the hero', { skip: offline }, async () => {
  const w = await catalogWorld(CATALOG);
  assert.ok(w.tell(worldText('k.genres').split('\n').filter((l) => !/ core\.(type|slot|module) /.test(l)).join('\n')).ok);
  const c = compose(w, 'girl', { genre: 'story', seed: 2 });
  assert.equal(c.story.plan.protagonist, 'girl');
  assert.deepEqual(c.parts.map((p) => p.part), ['orientation', 'complication', 'climax', 'resolution', 'ending']);
  const told = c.parts.flatMap((p) => p.moves.map((m) => m.element));
  assert.ok(['setting', 'protagonist', 'goal', 'obstacle', 'helper', 'means', 'resolution', 'ending'].every((e) => told.includes(e)), told.join(' '));
  assert.ok(told.indexOf('means') < told.indexOf('resolution'), 'what is set up comes before it is used');
  assert.equal(c.short, undefined);
});
