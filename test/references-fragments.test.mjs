// 0.154 (psys2 Q46, Q47; questions Q90): the things of an act are the things of the state, never declaration rows;
// names of things as references; a fragment with no verb continues the dialogue's act; plural + definite = all; a turn
// read in part never revises; a reaction steps only the keys the turn names; a revision that changes no key it set is
// "nothing changed"; a question about the state counts the kinds said; `when.<key>=none`; the tool's own names for
// values. Properties over the example worlds (shelf and necklace through a tool, sketch and garden through their acts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, toolSession, toolBindings, toolTimeline, runPlan, readRequest, reviseRequest, expectedValue, stateIds, factsOf, capabilitiesOf, sayRequest } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';
import { SHELF, NECKLACE, shelfTool, necklaceTool, exampleWorld, toolLanguage } from '../examples/tool-app.mjs';
import { SKETCH, GARDEN, requestSession, requestKinds } from '../examples/request-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await toolLanguage();
const kinds = offline ? null : await requestKinds();
const acts = (text) => { const w = exampleWorld(text); return { w, s: requestSession(w, { language, catalog: [language, kinds], revisions: language }) }; };
const tooled = (text, make) => { const tool = make(); return { tool, s: toolSession(exampleWorld(text), tool, { language, catalog: [language] }) }; };
const declaredKinds = (text) => [...text.matchAll(/std\.schema\.kind of=(\w+)/g)].map((m) => m[1]);
const drawnRows = (text) => declaredKinds(text).map((k, i) => `@drawn${i} std.schema.drawn kind=${k} as=${k}`).join('\n'); // a declaration row per declared kind: it has a kind, it is no thing

test('Q90: "remove everything" takes the things of the state only; every declaration row stays (all example worlds)', { skip: offline }, () => {
  // through a tool (the state mirrored into a fork of the declarations)
  for (const [text, make, fill] of [[SHELF, shelfTool, 'add 2 novels and an atlas'], [NECKLACE, necklaceTool, 'make a necklace']]) {
    const world = `${text}\n${drawnRows(text)}`;
    const { tool, s } = tooled(world, make);
    s.say(fill);
    assert.ok(tool.view().length > 0);
    const r = s.say('remove everything');
    const removes = capabilitiesOf(exampleWorld(world)).honours.some((h) => h.act === 'remove');
    if (removes) assert.deepEqual([r.plan.whole, r.run.ok, tool.view().length], ['world', true, 0], `${fill}: the view is empty`);
    else assert.deepEqual([r.plan.ok, r.plan.notHonoured[0].code], [false, 'act'], 'a world that does not remove says so, never fails on a declaration row');
    assert.ok(!(r.plan?.steps ?? []).some((x) => String(x.args?.thing ?? '').includes('drawn')), 'no declaration row is a thing of the act');
  }
  // through the world's own acts
  for (const [text, fill] of [[SKETCH, 'draw a sketch'], [GARDEN, 'add a fish']]) {
    const { w, s } = acts(`${text}\n${drawnRows(text)}`);
    const rows = w.ofType('std.schema.drawn').length;
    s.say(fill);
    assert.ok(stateIds(w).length > 0);
    const r = s.say('remove everything');
    const removes = capabilitiesOf(w).honours.some((h) => h.act === 'remove');
    if (removes) assert.deepEqual([r.plan.whole, r.run.ok, stateIds(w).length], ['world', true, 0], `${fill}: no thing is left`);
    else assert.deepEqual([r.plan.ok, r.plan.notHonoured[0].code], [false, 'act']);
    assert.equal(w.ofType('std.schema.drawn').length, rows, 'every declaration row intact');
    assert.ok(!(r.plan?.steps ?? []).some((x) => String(x.args?.thing ?? '').includes('drawn')));
  }
  // a kind said with one thing there is that thing: the declaration row of the kind is not a second one
  const { tool, s } = tooled(`${SHELF}\n${drawnRows(SHELF)}`, shelfTool);
  s.say('add an atlas');
  assert.deepEqual([s.say('remove the atlas').reply.text, tool.view().length], ['I removed the atlas.', 0]);
});

test('names as references: a thing\'s name is the object of any act, with the question when two share it', { skip: offline }, () => {
  const text = `${SHELF}\n@s.title core.slot of=book key=title kind=string`;
  const tool = shelfTool();
  tool.add({ kind: 'novel', n: 1, size: 'small', end: 'left' }); tool.add({ kind: 'atlas', n: 1, size: 'big', end: 'right' }); tool.add({ kind: 'comic', n: 1, size: 'small', end: 'left' });
  const [a, b, c] = tool.view();
  const titled = { [a.id]: 'work done', [b.id]: 'summary', [c.id]: 'summary' }; // titles the tool shows in its view
  const view0 = tool.view;
  tool.view = () => view0().map((x) => ({ ...x, title: titled[x.id] }));
  const s = toolSession(exampleWorld(text), tool, { language, catalog: [language] });
  let r = s.say('move work done to the right');
  assert.deepEqual([r.plan.act, r.plan.roles.things, r.reply.text], ['place', [a.id], 'I moved the novel to the right.']);
  r = s.say('move summary to the left');
  assert.deepEqual([r.plan.ask, r.reply.text], [true, 'Which summary? There are 2.'], 'two things share the name: the question');
  r = s.say('paint work done green');
  assert.deepEqual([r.plan.act, view0().find((x) => x.id === a.id).colour], ['change', 'green'], 'a name with a value after it: the change sense');
  r = s.say('remove work done');
  assert.deepEqual([r.run.ok, view0().some((x) => x.id === a.id), view0().length], [true, false, 2]);
  // a name never takes a kind's or a value's word: "remove the comic" is the comic
  assert.equal(readRequest(exampleWorld(text), 'remove the comic', { language, state: exampleWorld(text) }).refers, 'kind');
  // through the world's own acts: connect two things by their names
  const sk = acts(`${SKETCH}\n@s.label core.slot of=shape key=label kind=string\n@h.connect std.schema.honours world=sketch act=connect on=kind of=shape\n@n1 circle kind=circle world=sketch label=start\n@n2 square kind=square world=sketch label=end\n@n3 square kind=square world=sketch label=end2`);
  r = sk.s.say('connect start to end');
  assert.deepEqual([r.plan.ok, r.plan.steps.map((x) => [x.action, x.args.a, x.args.b])], [true, [['connect', '$n1', '$n2']]]);
  assert.ok(r.run.ok, 'the world joined them through its own act');
  r = sk.s.say('connect start to nowhere');
  assert.ok(!r.plan.ok, 'one thing named: nothing to connect it to');
});

test('a fragment with no verb continues the dialogue\'s act; never a reaction or a question', { skip: offline }, () => {
  const g = acts(GARDEN);
  g.s.say('add a fish');
  let r = g.s.say('a bird');
  assert.deepEqual([r.revision.sort, r.revision.reaction, r.plan.act, r.plan.steps.map((x) => x.args.kind)], ['request', 'continue', 'make', ['bird']], 'the last act, a new request: nothing replaced');
  assert.ok(r.plan.assumed.some((x) => x.key === 'act' && x.from === 'dialogue'));
  assert.equal(stateIds(g.w).filter((id) => factsOf(g.w).thing(id).kinds.some((k) => k === 'fish' || k === 'bird')).length, 2, 'the fish stays');
  const { tool, s } = tooled(SHELF, shelfTool);
  s.say('add a novel');
  r = s.say('two comics');
  assert.deepEqual([r.revision.reaction, tool.view().map((b) => b.kind)], ['continue', ['novel', 'comic', 'comic']]);
  // a reaction or a question is no fragment of an act
  assert.notEqual(s.say('too many').revision?.reaction, 'continue');
  for (const text of ['how many comics?', 'a comic?']) {
    const q = readRequest(exampleWorld(SHELF), text, { language });
    assert.notEqual(reviseRequest({ last: { act: 'make', target: 'novel', constraints: [] } }, q, { revisions: language }).reaction, 'continue', text);
  }
  // a fragment with no kind refines the last request, as before
  s.say('add a novel');
  assert.equal(s.say('in red').revision.reaction, 'refine');
});

test('plural + definite = every thing of the kind in the view; singular + several = the question (shelf, garden)', { skip: offline }, () => {
  const { tool, s } = tooled(SHELF, shelfTool);
  s.say('add 2 atlases'); s.say('add a novel');
  assert.equal(s.say('remove the atlas').reply.text, 'Which atlas? There are 2.');
  let r = s.say('make the atlases small');
  assert.deepEqual([r.plan.act, tool.view().filter((b) => b.kind === 'atlas').map((b) => b.size)], ['change', ['small', 'small']]);
  r = s.say('remove the atlases');
  assert.deepEqual([r.run.ok, tool.view().map((b) => b.kind)], [true, ['novel']]);
  const sk = acts(SKETCH);
  sk.s.say('draw 2 circles'); sk.s.say('draw a square');
  assert.match(sk.s.say('remove the circle').reply.text, /^Which circle\? There are 2\.$/);
  r = sk.s.say('remove the circles');
  assert.deepEqual([r.plan.roles.count, factsOf(sk.w).ofKind('circle').length, factsOf(sk.w).ofKind('square').length], [2, 0, 1], 'through the world\'s own acts');
});

test('a turn read in part never revises; a reaction steps the keys it names; a revision that changes no key it set is "nothing changed"', { skip: offline }, () => {
  const { tool, s } = tooled(SHELF, shelfTool);
  s.say('add a novel');
  let r = s.say('blorpish novel please');
  assert.deepEqual([r.revision.sort, r.plan.ok, r.plan.steps.length, tool.view().length], ['request', false, 0, 1], 'not understood: nothing planned, nothing kept, nothing re-laid');
  assert.match(r.reply.text, /blorpish/);
  // "bigger" names the size: the count stays (sketch, through its acts)
  const sk = acts(SKETCH);
  sk.s.say('draw a square');
  r = sk.s.say('make it bigger');
  assert.deepEqual([r.revision.does.map((d) => d.on), r.plan.steps.length], [['size'], 1]);
  // a revision whose net change is only what the tool recomputed is "nothing changed"
  const t2 = shelfTool(), view0 = t2.view; let k = 0;
  t2.view = () => view0().map((b) => ({ ...b, at: b.at + (k * 10) }));
  const s2 = toolSession(exampleWorld(SHELF), t2, { language, catalog: [language] });
  s2.say('add 2 novels');
  k = 1;
  r = s2.say('in small');
  assert.deepEqual([r.run.same, r.reply.text], [true, 'Nothing changed. That is what is there already.']);
});

test('askWorld: "how many X?" counts things of kind X only, a unit word too', { skip: offline }, () => {
  const { s } = tooled(NECKLACE, necklaceTool);
  s.say('make a necklace');
  const r = s.say('how many beads?');
  assert.deepEqual(r.reply.facts.map((f) => [f.reply, f.roles.kind]), [['state.count', 'bead']], 'not the necklace, not the ties');
  assert.match(r.reply.text, /^There are \d beads\.$/);
});

test('when.<key>=none: the key is absent; the tool\'s own name for a value (std.tool.value)', () => {
  const w = new World();
  assert.ok(w.load(String.raw`
@x.free k.expect.value of=box on=layout value=row when.in=none
@x.in k.expect.value of=box on=layout value=grid when.in=yes`).ok);
  assert.deepEqual([expectedValue('box', 'layout', {}, { live: w })?.value, expectedValue('box', 'layout', { in: 'yes' }, { live: w })?.value], ['row', 'grid']);
  const t = new World();
  assert.ok(t.load(String.raw`
@tool core.use world=std.tool
@op std.tool.op name=grow param=size effect=makes
@p std.tool.param op=grow name=size accepts=small accepts=default accepts=big
@v std.tool.value op=grow param=size value=default as=medium
@b std.tool.bind act=make op=grow arg=size<-step.size`).ok);
  const calls = [];
  const tool = { grow(a) { calls.push(a); }, view: () => [] };
  runPlan({ ok: true, act: 'make', steps: [{ action: 'make', args: { kind: 'box', size: 'default' } }] }, toolBindings(t), tool, { timeline: toolTimeline(), live: t });
  assert.deepEqual(calls, [{ size: 'medium' }]);
});

test('a singular indefinite says count 1 (said, not assumed); the reply says an assumption by its source, as data', { skip: offline }, () => {
  for (const [text, turn] of [[SKETCH, 'draw a square'], [GARDEN, 'add a fish']]) {
    const { s } = acts(text);
    const r = s.say(turn);
    const c = r.request.constraints.find((x) => x.on === 'count');
    assert.deepEqual([c.number, c.origin, r.plan.assumed.some((a) => a.key === 'count'), /for the count/.test(r.reply.text)], [1, 'said', false, false], turn);
  }
  const { s } = tooled(SHELF, shelfTool);
  assert.doesNotMatch(s.say('add an atlas').reply.text, /for the count/);
  // which assumptions are said is data: a declared parameter default (source `default`) is not, unless asked
  const out = { assumed: [{ key: 'n', value: 1, from: 'default' }, { key: 'size', value: 'small', from: 'world' }] };
  const q = { text: 'x', unread: [], constraints: [] };
  assert.deepEqual(sayRequest(q, out, { language }).facts.map((f) => f.roles.key), ['size']);
  assert.deepEqual(sayRequest(q, out, { language, say: ['default', 'world'] }).facts.map((f) => f.roles.key), ['n', 'size']);
});
