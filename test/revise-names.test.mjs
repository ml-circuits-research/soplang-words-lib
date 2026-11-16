// What a revision changes and what a turn means (0.156.0): a revision changes only what it names, a count revision of
// a whole keeps the whole, a general whole is planned as one of its subkind wholes, "all the X" is every thing of the
// kind, a place said by a thing of the view is that thing with its relation, "make the X bigger" is a change, the
// whole is said before its parts, a statement of the speaker is no request. Properties over the example worlds, with
// no case keyed to a world, a kind or a sentence beyond the turns that state the property.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, toolSession, readRequest, planRequest, capabilitiesOf, sayRequest } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';
import { requestSession, requestKinds, SKETCH, NOTES, GARDEN, exampleWorld } from '../examples/request-app.mjs';
import { SHELF, NECKLACE, shelfTool, necklaceTool, toolLanguage } from '../examples/tool-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await toolLanguage();
const kinds = offline ? null : await requestKinds();
const kindsOf = (s, r) => ({ ...(r.run?.result?.kinds ?? s.timeline?.done.at(-1)?.result?.kinds ?? {}) });

// two kinds made together in each world that makes kinds of things (the kinds the world declares makeable)
const pairs = () => [
  ['shelf', () => toolSession(exampleWorld(SHELF), shelfTool(), { language, catalog: [language] }), 'add three novels and an atlas', 'novel', 'novels', 'atlas'],
  ['sketch', () => requestSession(exampleWorld(SKETCH), { language, catalog: [language, kinds], revisions: language }), 'draw 3 circles and a square', 'circle', 'circles', 'square'],
];

test('a revision changes only what it names: "fewer A" steps A alone; "fewer" steps every kind, none to zero', { skip: offline }, () => {
  for (const [name, mk, first, a, as, b] of pairs()) {
    for (const [turn, dir] of [[`fewer ${as}`, -1], [`more ${as}`, 1]]) {
      const s = mk();
      const k0 = kindsOf(s, s.say(first));
      const k1 = kindsOf(s, s.say(turn));
      assert.equal(Math.sign(k1[a] - k0[a]), dir, `${name}: ${turn}: ${JSON.stringify([k0, k1])}`);
      assert.equal(k1[b], k0[b], `${name}: ${turn}: the other kind keeps its count`);
      assert.deepEqual(Object.keys(k1).sort(), Object.keys(k0).sort(), `${name}: ${turn}: no kind removed`);
    }
    const s = mk();
    const k0 = kindsOf(s, s.say(first));
    const k1 = kindsOf(s, s.say('fewer'));
    const sum = (k) => Object.values(k).reduce((x, y) => x + y, 0);
    assert.ok(sum(k1) < sum(k0), `${name}: fewer: ${JSON.stringify([k0, k1])}`);
    assert.ok(Object.keys(k0).every((k) => k1[k] >= 1), `${name}: fewer: no kind dropped to zero`);
  }
});

test('a count revision of a whole keeps the whole, the other parts and the sizes', { skip: offline }, () => {
  for (const [name, mk, first] of [
    ['necklace', () => toolSession(exampleWorld(NECKLACE), necklaceTool(), { language, catalog: [language] }), 'make a necklace'],
    ['sketch', () => requestSession(exampleWorld(SKETCH), { language, catalog: [language, kinds], revisions: language }), 'draw a sketch'],
  ]) {
    const s = mk();
    const r0 = s.say(first);
    const k0 = kindsOf(s, r0);
    const [a, b] = Object.keys(k0);
    const as = readRequest(exampleWorld(name === 'sketch' ? SKETCH : NECKLACE), `draw 2 ${a}s`, { language }).constraints.find((c) => c.on === 'kind' && c.value === a)?.words ?? a;
    for (const turn of [`fewer ${as}`, `more ${as}`]) {
      const r = s.say(turn);
      const k1 = kindsOf(s, r);
      assert.ok(r.run?.result?.whole ?? s.timeline?.done.at(-1)?.result?.whole, `${name}: ${turn}: the whole stays`);
      if (b) assert.equal(k1[b], k0[b], `${name}: ${turn}: ${JSON.stringify([k0, k1])}`);
      assert.ok(!(r.run?.diff?.changed ?? []).some((x) => x.key === 'size'), `${name}: ${turn}: no size changed`);
      Object.assign(k0, k1);
    }
  }
});

// a toy world: a general whole (a scene) with no expectation of its own, and two subkind wholes that have one
const SCENES = String.raw`
@acts core.use world=std.acts
@w std.schema.world name=scenes doc="an example world: scenes of things"
@t.scene core.type of=scene extends=std.schema.thing closed=true
@t.shore core.type of=shore extends=scene closed=true
@t.wood core.type of=wood extends=scene closed=true
@t.item core.type of=item extends=std.schema.thing closed=true
@s.in core.slot of=item key=in type=scene
@t.boat core.type of=boat extends=item closed=true
@t.wave core.type of=wave extends=item closed=true
@t.oak core.type of=oak extends=item closed=true
@k.scene std.schema.kind of=scene world=scenes acts=make
@k.shore std.schema.kind of=shore world=scenes acts=make
@k.wood std.schema.kind of=wood world=scenes acts=make
@k.boat std.schema.kind of=boat world=scenes acts=make
@k.wave std.schema.kind of=wave world=scenes acts=make
@k.oak std.schema.kind of=oak world=scenes acts=make
@h.make std.schema.honours world=scenes act=make on=kind on=count on=with on=manner of=scene of=shore of=wood of=boat of=wave of=oak
@e.shore k.expect.make thing=shore unit=item min=2 max=4 typical=3
@p.shore1 k.expect.part of=shore part=wave min=1 max=3 typical=2 needed=yes
@p.shore2 k.expect.part of=shore part=boat min=0 max=1 typical=1
@e.wood k.expect.make thing=wood unit=item min=2 max=4 typical=3
@p.wood1 k.expect.part of=wood part=oak min=2 max=4 typical=3 needed=yes
`;

test('a general whole is planned as one of its subkind wholes; "with X" picks the subkind whose parts hold X', { skip: offline }, () => {
  const w = exampleWorld(SCENES);
  const subs = [...capabilitiesOf(w).kinds.keys()].filter((k) => k !== 'scene' && ['shore', 'wood'].includes(k));
  for (let seed = 1; seed <= 4; seed++) {
    const p = planRequest(w, readRequest(w, 'make a random scene', { language }), { catalog: [language], seed });
    assert.ok(p.ok && subs.includes(p.target), JSON.stringify([p.target, p.notHonoured]));
    assert.ok(p.assumed.some((a) => a.key === 'kind' && a.value === p.target && a.from === 'sampled'));
    assert.ok(p.steps.some((st) => st.item), 'the subkind with its parts');
    const q = planRequest(w, readRequest(w, 'make a scene with a boat', { language }), { catalog: [language], seed });
    assert.equal(q.target, 'shore', 'the subkind whose parts hold the kind said with it');
  }
});

test('"all the X" is every thing of the kind, a plural equal to its singular too', { skip: offline }, () => {
  for (const text of [SKETCH, NOTES, GARDEN, SHELF, NECKLACE]) {
    const w = exampleWorld(text);
    for (const k of capabilitiesOf(w).kinds.keys()) {
      const word = String(k).replace(/_/g, ' ');
      const r = readRequest(w, `remove all the ${word}`, { language });
      const c = r.constraints.find((x) => x.on === 'kind' && x.value === k);
      if (!c) continue;
      assert.ok(c.all && c.plural, `${k}: ${JSON.stringify(c)}`);
      assert.deepEqual(r.unread, [], `${k}: "all" is read`);
    }
  }
  const s = toolSession(exampleWorld(SHELF), shelfTool(), { language, catalog: [language] });
  s.say('add 3 novels');
  s.say('remove all the novels');
  assert.equal(s.timeline.done.at(-1).diff.removed.length, 3);
});

test('a place said by a thing of the view is that thing (`region`) with the relation said', { skip: offline }, () => {
  const s = toolSession(exampleWorld(SHELF), shelfTool(), { language, catalog: [language] });
  s.say('add 2 novels and an atlas');
  const atlas = s.timeline.done.at(-1).diff.added.find((t) => t.kind === 'atlas').id;
  const r = s.say('move the novels next to the atlas');
  assert.ok(r.plan.steps.length === 2 && r.plan.steps.every((st) => st.args.region === `$${atlas}` && st.args.relation), JSON.stringify(r.plan.steps));
});

test('"make the X bigger" after making X is a change of its size, the same thing kept; a further value goes on changing it', { skip: offline }, () => {
  const s = toolSession(exampleWorld(SHELF), shelfTool(), { language, catalog: [language] });
  const id = s.say('add a novel').run.result.things[0];
  let r = s.say('make the novel bigger');
  assert.equal(r.plan.act, 'change');
  assert.deepEqual(r.run.diff.removed, [], 'nothing removed first');
  assert.ok(r.run.diff.changed.some((x) => x.id === id && x.key === 'size'), JSON.stringify(r.run.diff));
  assert.doesNotMatch(r.reply.text, /again/);
  r = s.say('make it smaller');
  assert.equal(r.plan.act, 'change');
  assert.ok(r.run.diff.changed.some((x) => x.id === id && x.key === 'size'), JSON.stringify(r.run.diff));
});

test('the whole is said before its parts', { skip: offline }, () => {
  const s = toolSession(exampleWorld(NECKLACE), necklaceTool(), { language, catalog: [language] });
  const r = s.say('make a necklace');
  assert.equal(r.reply.facts.find((f) => f.reply === 'done.add')?.roles.kind, 'necklace', r.reply.text);
});

test('a statement of the speaker with a verb of its own is no request; a wish is', { skip: offline }, () => {
  for (const text of [SKETCH, GARDEN, SHELF]) {
    const w = exampleWorld(text);
    for (const k of capabilitiesOf(w).kinds.keys()) {
      const r = readRequest(w, `I like ${k}`, { language });
      if (!r.constraints.length && !r.unread.length) continue;
      assert.ok(r.statement && r.unread.includes('like'), `${k}: ${JSON.stringify(r)}`);
      const q = readRequest(w, `I want a ${k}`, { language });
      assert.ok(!q.statement && !q.unread.length, `${k}: a wish: ${JSON.stringify(q.unread)}`);
    }
  }
  const s = toolSession(exampleWorld(SHELF), shelfTool(), { language, catalog: [language] });
  s.say('add a novel');
  const r = s.say('I love comics');
  assert.ok(!r.run?.ok || !r.run.diff.added.length, r.reply.text);
});

test('the toy world loads', () => { const w = new World(); assert.ok(w.load(SCENES).ok); });

// ---- 0.157.0 ----------------------------------------------------------------------------------------------------
const WORLDS = () => [
  ['shelf', () => toolSession(exampleWorld(SHELF), shelfTool(), { language, catalog: [language] }), 'add three novels and an atlas'],
  ['necklace', () => toolSession(exampleWorld(NECKLACE), necklaceTool(), { language, catalog: [language] }), 'make a necklace'],
  ['sketch', () => requestSession(exampleWorld(SKETCH), { language, catalog: [language, kinds], revisions: language }), 'draw 3 circles and a square'],
  ['garden', () => requestSession(exampleWorld(GARDEN), { language, catalog: [language, kinds], revisions: language }), 'add 2 fish'],
];

test('a count revision is said by its net result, never as a remake ("I made it again")', { skip: offline }, () => {
  for (const [name, mk, first] of WORLDS()) {
    const s = mk(); s.say(first);
    for (const turn of ['too many', 'fewer', 'more']) {
      const r = s.say(turn);
      assert.ok(!r.reply.facts.some((f) => f.reply === 'done.revise'), `${name}: ${turn}: ${r.reply.text}`);
    }
  }
});

test('a turn with an unread word executes nothing and says what was not understood, in the plan and not only in the door', { skip: offline }, () => {
  for (const [name, mk, first] of WORLDS()) {
    const s = mk(); s.say(first);
    for (const turn of [`${first} blorfish`, 'fewer blorfish', 'make a zorp blorfish']) {
      const before = JSON.stringify(s.timeline?.done.length ?? s.dialogue.lastRun?.made);
      const r = s.say(turn);
      assert.ok(r.plan?.ok === false && r.plan.unread?.length && !r.plan.steps.length, `${name}: ${turn}: planned nothing`);
      assert.ok(!r.run?.ok && !(r.run?.made?.length) && !(r.run?.calls?.length), `${name}: ${turn}: ran nothing`);
      assert.deepEqual(r.reply.facts.map((f) => f.reply).filter((x) => x !== 'why.nothing'), ['not_understood'], `${name}: ${turn}: ${r.reply.text}`);
      assert.equal(JSON.stringify(s.timeline?.done.length ?? s.dialogue.lastRun?.made), before, `${name}: ${turn}: nothing kept or re-laid`);
    }
    // planRequest/runPlan on their own: the same rule without any session
    const live = exampleWorld(name === 'shelf' ? SHELF : name === 'necklace' ? NECKLACE : name === 'sketch' ? SKETCH : GARDEN);
    const q = readRequest(live, `${first} blorfish`, { language, catalog: [language] });
    const p = planRequest(live, q, { catalog: [language, kinds] });
    assert.deepEqual([p.ok, p.steps.length, p.unread], [false, 0, ['blorfish']], `${name}: planRequest`);
  }
});

test('a count said with "with" is that many of the kind inside the whole, never the whole\'s count', { skip: offline }, () => {
  const s = requestSession(exampleWorld(SKETCH), { language, catalog: [language, kinds], revisions: language });
  const n = (r, k) => r.run.result.items.length === 0 ? 0 : Object.entries(r.run.result.kinds).find(([x]) => x === k)?.[1] ?? 0;
  let r = s.say('draw a picture with a circle');
  assert.equal(n(r, 'circle'), 1, 'a circle said in the singular is one');
  r = s.say('draw a picture with 3 squares');
  assert.equal(n(r, 'square'), 3);
  r = s.say('draw a circle with three squares');
  assert.deepEqual([r.run.ok, n(r, 'circle'), n(r, 'square')], [true, 1, 3], 'the bounds say what was said, with what was added');
});

test('"fewer X" where the last result has no X names it and keeps the result', { skip: offline }, () => {
  const s = requestSession(exampleWorld(SKETCH), { language, catalog: [language, kinds], revisions: language });
  s.say('draw 3 circles and a square');
  const before = JSON.stringify(s.dialogue.result);
  const r = s.say('fewer triangles');
  assert.deepEqual([r.revision.request, r.reply.facts.map((f) => f.reply), r.reply.text, JSON.stringify(s.dialogue.result)], [null, ['refused.no_such'], 'There is no triangle here.', before]);
});

test('a move to a thing of the view says the relation with that thing, when the language has the reply; else the key\'s own', { skip: offline }, () => {
  const run = { ok: true, diff: { added: [], removed: [], changed: [{ id: 'a', kind: 'fish', key: 'place', from: 'top', to: 'bottom' }, { id: 'b', kind: 'fish', key: 'place', from: 'top', to: 'bottom' }] }, assumed: [], result: { kinds: {} } };
  const plan = (relation) => ({ ok: true, act: 'place', reference: true, roles: { place: 'lake', region: '$l1', relation } });
  const say = (relation) => sayRequest({ unread: [], reactions: [], constraints: [] }, { ...plan(relation), run }, { language });
  assert.equal(say('into').text, 'I moved 2 fish into the lake.');
  assert.equal(say('next to').text, 'I moved 2 fish to the bottom.', 'no reply for that relation: the change as before');
  assert.equal(say(undefined).text, 'I moved 2 fish to the bottom.');
});
