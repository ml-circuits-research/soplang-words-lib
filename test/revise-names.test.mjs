// What a revision changes and what a turn means (0.156.0): a revision changes only what it names, a count revision of
// a whole keeps the whole, a general whole is planned as one of its subkind wholes, "all the X" is every thing of the
// kind, a place said by a thing of the view is that thing with its relation, "make the X bigger" is a change, the
// whole is said before its parts, a statement of the speaker is no request. Properties over the example worlds, with
// no case keyed to a world, a kind or a sentence beyond the turns that state the property.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, toolSession, readRequest, planRequest, capabilitiesOf } from '../tools/lib-under-test.mjs';
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
