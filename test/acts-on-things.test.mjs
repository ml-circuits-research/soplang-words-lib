// 0.153 (psys2 Q45): the net change of a revision (stateDiff by kind and values), the change sense of make decided by
// reference over the view, the whole world as the things of an act, done.change with its key, kinds said together
// each with its own count, size and values, a plural kind with no number from the expectations, the target's kind
// constraint, a whole whose parts the world cannot make. Proven on the example worlds (shelf, necklace, sketch, garden).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, toolSession, toolBindings, toolTimeline, runPlan, stateDiff, readRequest, planRequest, sayRequest } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';
import { SHELF, NECKLACE, shelfTool, necklaceTool, exampleWorld, toolLanguage } from '../examples/tool-app.mjs';
import { SKETCH, GARDEN, requestSession, requestKinds } from '../examples/request-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await toolLanguage();
const kinds = offline ? null : await requestKinds();
const shelf = () => { const tool = shelfTool(); return { tool, s: toolSession(exampleWorld(SHELF), tool, { language, catalog: [language] }) }; };
const books = (tool) => tool.view().map((b) => `${b.kind}/${b.size}${b.colour ? '/' + b.colour : ''}/${b.end}`);

test('stateDiff: by id, or matched by kind and values; only the keys given are said; `same` is exact', () => {
  const before = [{ id: 'a', kind: 'dog', place: 'left' }, { id: 'b', kind: 'dog', place: 'center' }, { id: 'c', kind: 'dog', place: 'right' }];
  const after = [{ id: 'd', kind: 'dog', place: 'left' }, { id: 'e', kind: 'dog', place: 'right' }];
  assert.deepEqual(stateDiff(before, after).removed.length, 3, 'by id: every thing removed and added again');
  let d = stateDiff(before, after, { match: true, keys: [] });
  assert.deepEqual([d.added.length, d.removed.length, d.changed.length, d.same], [0, 1, 0, false], 'fewer dogs: one dog removed, the rest matched');
  d = stateDiff([{ id: 'a', kind: 'dog', place: 'left', colour: 'red' }], [{ id: 'b', kind: 'dog', place: 'center', colour: 'blue' }], { match: true, keys: ['colour'] });
  assert.deepEqual([d.changed.map((x) => [x.key, x.to, x.was]), d.redone[0].keys.sort()], [[['colour', 'blue', 'a']], ['colour', 'place']], 'a place no key names is not said');
  d = stateDiff([{ id: 'a', kind: 'dog', place: 'left' }], [{ id: 'b', kind: 'dog', place: 'center' }], { match: true, keys: [] });
  assert.deepEqual([d.changed.map((x) => x.key), d.same], [['place'], false], 'nothing else changed: the difference is the change, and it is not the same');
  d = stateDiff([{ id: 'a', kind: 'dog', in: 'p' }, { id: 'p', kind: 'pond' }], [{ id: 'b', kind: 'dog', in: 'q' }, { id: 'q', kind: 'pond' }], { match: true });
  assert.deepEqual([d.changed.length, d.same], [0, true], 'a reference to a thing redone alike is alike: exact up to ids');
});

test('the shelf: a revision is said as its net change; a place the tool computes is not said', { skip: offline }, () => {
  const { tool, s } = shelf();
  s.say('add 4 novels');
  const r = s.say('too many');
  assert.deepEqual([r.run.diff.added.length, r.run.diff.removed.length, r.run.diff.changed.length], [0, 4 - tool.view().length, 0]);
  assert.match(r.reply.text, /^I removed (the novel|\d novels)\.$/);
  s.say('add a huge atlas');
  const m = s.say('remove the atlas');
  assert.equal(m.reply.text, 'I removed the atlas.', 'the books that moved along (`at`) are not said');
  s.say('add 2 comics');
  const red = s.say('in red');
  assert.deepEqual([red.run.diff.added.length, red.run.diff.removed.length, red.reply.text.startsWith('I made it again, the way you said. The 2 comics are red now.')], [0, 0, true], 'a revision of a value: said as the change');
  const again = s.say('in red');
  assert.deepEqual([again.run.same, again.reply.text], [true, 'Nothing changed. That is what is there already.'], 'same: exact');
});

test('the change sense of make, by reference over the view; done.change says its key', { skip: offline }, () => {
  const { tool, s } = shelf();
  s.say('add a novel and a comic');
  let r = s.say('make the comic blue');
  assert.deepEqual([r.plan.act, r.plan.sense, books(tool)], ['change', 'change', ['novel/small/left', 'comic/small/blue/left']]);
  assert.equal(r.reply.text, 'The comic is blue now.');
  assert.deepEqual(r.reply.facts[0].roles.key, 'colour');
  r = s.say('make it green');
  assert.deepEqual([r.plan.act, r.revision.sort, books(tool)[1]], ['change', 'request', 'comic/small/green/left'], '"it": the last result, changed, not made again');
  r = s.say('make a red comic');
  assert.deepEqual([r.plan.act, tool.view().length], ['make', 3], 'a value before the kind describes a new thing');
  s.say('add a huge atlas');
  r = s.say('make the atlas smaller');
  assert.deepEqual([r.plan.act, tool.view().find((b) => b.kind === 'atlas').size], ['change', 'small'], 'a size step from the size it has now');
  const fresh = shelf();
  r = fresh.s.say('make the comic blue');
  assert.equal(r.plan.act, 'make', 'nothing to refer to: make');
  // a move says the place: the key the binding took the value from (arg=end<-step.place)
  r = s.say('move the atlas to the left');
  assert.deepEqual([r.reply.facts[0].roles.key, r.reply.text], ['place', 'I moved the atlas to the left.']);
  assert.equal(s.say('move the atlas to the left').reply.text, 'Nothing changed. The atlas is already left.');
});

test('a change the view cannot show is said from the call (a move inside the same region)', () => {
  const w = new World();
  assert.ok(w.load(String.raw`
@acts core.use world=std.acts
@tool core.use world=std.tool
@w std.schema.world name=board
@t core.type of=box extends=std.schema.thing closed=true
@s core.slot of=box key=place enum=top enum=bottom
@k std.schema.kind of=box world=board acts=make acts=place
@h std.schema.honours world=board act=place on=place of=box
@o std.tool.op name=nudge param=ids param=place effect=changes
@b std.tool.bind act=place of=box op=nudge arg=ids<-step.things arg=place<-step.place needs=exists(ids)`).ok);
  let y = 10; // the tool keeps a coordinate; its view says only the region
  const tool = { nudge({ place }) { y += place === 'up' ? -1 : 1; }, view: () => [{ id: 'x1', kind: 'box', place: y < 50 ? 'top' : 'bottom' }] };
  const plan = { ok: true, act: 'place', reference: true, roles: { things: ['x1'] }, steps: [{ action: 'place', args: { thing: '$x1', place: 'up' } }] };
  const r = runPlan(plan, toolBindings(w), tool, { timeline: toolTimeline(), live: w });
  assert.deepEqual([r.ok, r.diff.changed.map((x) => [x.key, x.to, x.by])], [true, [['place', 'up', 'call']]]);
  assert.deepEqual(sayRequest({ text: 'move it up', unread: [], constraints: [] }, { run: r }).facts[0], { reply: 'done.change', roles: { thing: 'box', number: 1, key: 'place', value: 'up' } });
});

test('the whole world as the things of an act: "everything", the world\'s name, the kind it means', { skip: offline }, () => {
  const { tool, s } = shelf();
  s.say('add 2 novels and an atlas');
  let r = s.say('remove everything');
  assert.deepEqual([tool.view().length, r.plan.whole, r.reply.text], [0, 'world', 'I removed 2 novels. I removed the atlas.']);
  s.say('undo');
  assert.equal(tool.view().length, 3);
  r = s.say('add a comic on the shelf');
  assert.deepEqual([r.request.constraints.some((c) => c.on === 'place'), r.request.unread, tool.view().length], [false, [], 4], 'the world itself as a place: everything is there');
  r = s.say('remove the shelf');
  assert.equal(tool.view().length, 0, 'the world\'s name');
  const sk = requestSession(exampleWorld(SKETCH), { language, catalog: [language, kinds], revisions: language });
  sk.say('draw a sketch');
  r = sk.say('delete the drawing');
  assert.deepEqual([r.plan.whole, r.run.ok, r.plan.steps.length > 4], ['world', true, true], 'a word of the kind the world\'s name means: the picture and its shapes');
  assert.match(r.reply.text, /^I removed .* I removed the picture\.$/);
});

test('kinds said together: each its own count, size and values; a plural kind with no number from the expectations', { skip: offline }, () => {
  let { tool, s } = shelf();
  s.say('add a tiny novel and a big atlas');
  assert.deepEqual(books(tool), ['novel/small/left', 'atlas/big/right']);
  ({ tool, s } = shelf());
  s.say('add a red novel and a blue comic');
  assert.deepEqual(books(tool), ['novel/small/red/left', 'comic/small/blue/left']);
  ({ tool, s } = shelf());
  s.say('add a novel and a comic');
  assert.deepEqual(tool.view().map((b) => b.kind), ['novel', 'comic'], 'no number: one of each');
  ({ tool, s } = shelf());
  let r = s.say('add novels');
  assert.deepEqual([tool.view().length, r.plan.assumed.find((a) => a.key === 'count')], [3, { key: 'count', value: 3, from: 'world' }], 'k.expect.value of=book on=count when.plural=yes');
  ({ tool, s } = shelf());
  s.say('add novels and comics');
  assert.deepEqual(tool.view().map((b) => b.kind).join(' '), 'novel novel novel comic comic comic');
  ({ tool, s } = shelf());
  r = s.say('add a huge atlas');
  assert.deepEqual([tool.view().length, r.plan.assumed.some((a) => a.key === 'count')], [1, false], 'a kind said in the singular is one: the size does not scale it');
  const g = requestSession(exampleWorld(GARDEN), { language, catalog: [language, kinds], revisions: language });
  r = g.say('add a grey fish and a white bird');
  assert.deepEqual(r.plan.steps.map((x) => `${x.args.kind}/${x.args.colour}`), ['fish/grey', 'bird/white'], 'the garden, through its own acts');
});

test('the target keeps its kind constraint; a whole whose parts the world cannot make is made as one thing', { skip: offline }, () => {
  // the atlas as a whole of the expectations, of pages this world cannot make
  const text = `${SHELF}\n@e.atlas k.expect.make thing=atlas unit=page min=40 max=90 typical=60\n@e.page k.expect.part of=atlas part=page group=node min=40 max=90 typical=60 needed=yes`;
  const w = exampleWorld(text);
  const q = readRequest(w, 'add two novels and an atlas', { language, catalog: [language] });
  assert.deepEqual([q.target, q.constraints.filter((c) => c.on === 'kind').map((c) => [c.value, typeof c.at])], ['atlas', [['novel', 'number'], ['atlas', 'number']]]);
  const p = planRequest(w, q, { catalog: [language] });
  assert.deepEqual([p.ok, p.asOne, p.steps.map((x) => x.args.kind).join(' ')], [true, 'atlas', 'novel novel atlas'], 'each kind with its own count');
  const tool = shelfTool(), s = toolSession(w, tool, { language, catalog: [language] });
  s.say('add an atlas');
  assert.deepEqual(tool.view().map((b) => b.kind), ['atlas'], 'one atlas, not sixty pages');
  const r = s.say('change the atlas to blue');
  assert.deepEqual([r.plan.act, tool.view()[0].colour], ['change', 'blue'], 'the value after the kind\'s word is the new value');
});

test('the necklace: a revision of a whole with links is said as its net change', { skip: offline }, () => {
  const beads = necklaceTool();
  const n = toolSession(exampleWorld(NECKLACE), beads, { language, catalog: [language] });
  n.say('make a necklace');
  const r = n.say('too many');
  assert.deepEqual([r.run.diff.added.length, r.run.diff.changed.length, r.run.diff.removed.length], [0, 0, 4], 'two beads and their two ties; the rest matched');
  const red = n.say('in red');
  assert.ok(red.run.diff.changed.length && red.run.diff.changed.every((x) => x.key === 'colour' && x.to === 'red') && !red.run.diff.added.length, 'only the colour is said');
});
