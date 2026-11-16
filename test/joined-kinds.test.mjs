// Kinds taken by join (0.160.0): declared for their acts, not planned as a whole by the catalog's k.expect.make unless the
// world declares that whole; several `std.schema.kinds from=` rows per world; the acts that run a plan (the planner's fork,
// runWorldPlan, the tool binding) find the joined rows through the catalog; the reply says the values said per kind and a
// state answer names the said attributes of few things. Properties over the example worlds; one test against the catalog at its pin.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, readRequest, planRequest, runWorldPlan, sayRequest, declares, joinedKinds, toolSession, askWorld, capabilitiesOf } from '../tools/lib-under-test.mjs';
import { worldsDir, catalogWorld } from '../tools/worlds.mjs';
import { requestSession, requestKinds, requestLanguage, SKETCH, NOTES, STORIES, MEADOW, GARDEN, exampleWorld } from '../examples/request-app.mjs';
import { SHELF, NECKLACE, shelfTool, necklaceTool, toolLanguage, exampleWorld as toolWorld } from '../examples/tool-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await toolLanguage();
const kinds = offline ? null : await requestKinds();

// a toy base and its expectation: a yurt is a whole of felt in the catalog, a goat and a child are bases the world may join
const BASE = String.raw`
@t.item core.type of=k.demo.item
@t.person core.type of=k.demo.person
@t.make core.type of=k.demo.make
@i1 k.demo.item name=goat
@i2 k.demo.item name=yurt
@p1 k.demo.person name=child
@m1 k.expect.make thing=yurt made_in=drawing unit=felt min=2 max=4 typical=2
@m2 k.expect.part of=yurt part=felt group=felt min=2 max=4 typical=2 needed=yes`;
const base = () => { const w = new World(); const r = w.load(`@t0 core.type of=k.demo.make\n${BASE.replace(/@t\.make[^\n]*\n/, '')}`); assert.ok(r.ok, JSON.stringify(r.violations?.[0] ?? r)); return w; };
const nameOf = (text) => /std\.schema\.world name=(\w+)/.exec(text)[1];
const ownKind = (text) => /std\.schema\.kind of=(\w+) world=\w+ acts=make/.exec(text)?.[1];
const JOIN = (world, ...types) => types.map((t, i) => `\n@jn.${i} std.schema.kinds world=${world} from=${t} key=name acts=make acts=remove\n@jh.${i} std.schema.honours world=${world} act=make on=kind on=count of=${t}`).join('');
const WORLDS = [['sketch', SKETCH], ['notes', NOTES], ['stories', STORIES], ['meadow', MEADOW], ['garden', GARDEN], ['shelf', SHELF], ['necklace', NECKLACE]];

test('several std.schema.kinds rows per world load and merge, in every example world', () => {
  for (const [name, text] of WORLDS) {
    const live = exampleWorld(text + JOIN(nameOf(text), 'k.demo.item', 'k.demo.person'));
    const j = joinedKinds(live, [base()]);
    assert.deepEqual([...j.keys()].sort(), ['child', 'goat', 'yurt'], name);
    assert.deepEqual([j.get('goat').from, j.get('child').from], ['k.demo.item', 'k.demo.person'], name);
    for (const k of ['goat', 'yurt', 'child']) assert.ok(declares(live, 'make', k, { catalog: [base()] }), `${name}: ${k} declared for make`);
    assert.ok(!declares(live, 'change', 'goat', { catalog: [base()] }), `${name}: only the acts of the rows`);
    assert.ok(!declares(live, 'make', 'goat', { catalog: [] }), `${name}: nothing without the catalog`);
  }
});

test('a joined kind is not planned as a whole by the catalog unless the world declares that whole, in every example world', { skip: offline }, () => {
  for (const [name, text] of WORLDS) {
    const own = ownKind(text);
    if (!own) continue;
    const plural = own.endsWith('s') ? own : `${own}s`;
    const withJoin = text + JOIN(nameOf(text), 'k.demo.item');
    const live = exampleWorld(withJoin), cat = [language, base()];
    const req = readRequest(live, `make two ${plural} and a yurt`, { language, catalog: cat });
    const plan = planRequest(live, req, { catalog: cat });
    const made = plan.steps.map((s) => s.args.kind);
    assert.ok(!made.includes('felt'), `${name}: no felt: ${JSON.stringify(made)}`);
    assert.ok(!plan.steps.some((s) => s.args.kind === 'yurt' && !s.item) || !plan.steps.some((s) => s.args.kind === 'felt'), name);
    // the world that declares the whole gets the catalog's parts
    const declared = exampleWorld(withJoin + '\n@own.tree k.expect.make thing=yurt made_in=drawing unit=felt min=2 max=4 typical=2\n@own.crown k.expect.part of=yurt part=felt group=felt min=2 max=4 typical=2 needed=yes');
    const p2 = planRequest(declared, readRequest(declared, 'make a yurt', { language, catalog: cat }), { catalog: cat });
    assert.ok(p2.steps.some((s) => s.args.kind === 'yurt') && p2.steps.every((s) => s.args.kind !== 'goat'), `${name}: a declared whole is planned whole`);
  }
});

const YARD = String.raw`
@acts core.use world=std.acts
@tool core.use world=std.tool
@w std.schema.world name=yard
@t.thing core.type of=thing extends=std.schema.thing closed=true
@j.item std.schema.kinds world=yard from=k.demo.item key=name acts=make acts=remove
@j.person std.schema.kinds world=yard from=k.demo.person key=name acts=make acts=remove
@h.make std.schema.honours world=yard act=make on=kind on=count of=k.demo.item of=k.demo.person
@h.remove std.schema.honours world=yard act=remove on=kind on=count of=k.demo.item of=k.demo.person
@op.add std.tool.op name=add world=yard param=kind param=n effect=makes
@pa.kind std.tool.param op=add name=kind required=true
@pa.n std.tool.param op=add name=n kind=integer min=1 max=12 default=1
@op.remove std.tool.op name=remove world=yard param=ids effect=removes
@b.make std.tool.bind world=yard act=make of=k.demo.item of=k.demo.person op=add arg=kind<-step.kind arg=n<-step.count
@b.remove std.tool.bind world=yard act=remove of=k.demo.item of=k.demo.person op=remove arg=ids<-step.things needs=exists(ids) removes=ids`;

test('the acts that run a plan find joined rows through the catalog: the planner\'s fork, runWorldPlan, the tool binding', { skip: offline }, () => {
  const live = toolWorld(YARD), cat = [language, base()];
  const plan = planRequest(live, readRequest(live, 'make two goats and a child', { language, catalog: cat }), { catalog: cat });
  assert.ok(plan.ok, JSON.stringify(plan.cannot));
  const bare = runWorldPlan(live.fork(), plan);
  assert.equal(bare.ok, false, 'without the catalog the world cannot find the kind');
  assert.match(String(bare.failed.why), /no world here has/);
  const run = runWorldPlan(live.fork(), plan, { catalog: cat });
  assert.ok(run.ok, JSON.stringify(run.failed));
  assert.equal(live._actCatalog, undefined, 'the catalog is set only while the plan runs');
  let things = [], n = 1;
  const tool = { add({ kind, n: c }) { for (let i = 0; i < (c || 1); i++) things.push({ id: `t${n++}`, kind }); }, remove({ ids }) { things = things.filter((t) => !ids.includes(t.id)); }, view: () => things.slice() };
  const s = toolSession(live, tool, { language, catalog: cat });
  const r = s.say('make two goats and a child');
  assert.equal(r.reply.text, 'I added 2 goats. I added a child.');
  assert.deepEqual(things.map((t) => t.kind), ['goat', 'goat', 'child']);
  assert.equal(s.say('remove the goats').reply.text, 'I removed 2 goats.');
  assert.deepEqual(things.map((t) => t.kind), ['child']);
});

test('against the catalog at its pin: joining k.objects.object does not turn "draw two dogs and a tree" into a crown plan; people join by a second row', { skip: offline }, async () => {
  const cat = await catalogWorld({ 'k.objects': ['k.objects.object', 'k.objects.stand_in'], 'k.people': ['k.people.kind'], 'k.expect': ['k.expect.make', 'k.expect.part', 'k.expect.value'], 'k.kinds': ['k.kinds.parent'], 'k.colours': ['k.colours.basic'] });
  const live = toolWorld(YARD.replace(/k\.demo\.item/g, 'k.objects.object').replace(/k\.demo\.person/g, 'k.people.kind'));
  const catalog = [language, cat];
  assert.ok(joinedKinds(live, catalog).has('dog') && joinedKinds(live, catalog).has('child'), 'objects and people, merged');
  const plan = planRequest(live, readRequest(live, 'draw two dogs and a tree', { language, catalog }), { catalog });
  assert.deepEqual(plan.steps.map((s) => s.args.kind), ['dog', 'dog', 'tree'], 'no crown, no branches');
  let things = [], n = 1;
  const tool = { add({ kind, n: c }) { for (let i = 0; i < (c || 1); i++) things.push({ id: `t${n++}`, kind }); }, remove({ ids }) { things = things.filter((t) => !ids.includes(t.id)); }, view: () => things.slice() };
  const s = toolSession(live, tool, { language, catalog });
  assert.equal(s.say('draw two dogs and a tree').reply.text, 'I added 2 dogs. I added a tree.');
  assert.equal(s.say('draw a child').reply.text, 'I added a child.');
  assert.deepEqual(things.map((t) => t.kind), ['dog', 'dog', 'tree', 'child']);
});

test('a make says the values said per kind, in the tool path and the world path', { skip: offline }, () => {
  const shelf = () => { const tool = shelfTool(); return { tool, s: toolSession(toolWorld(SHELF), tool, { language, catalog: [language] }) }; };
  const a = shelf();
  assert.match(a.s.say('add a red novel and a blue atlas').reply.text, /^I added a red novel\. I added a blue atlas\./);
  assert.match(a.s.say('add 2 red comics and 3 blue novels').reply.text, /^I added 2 red comics\. I added 3 blue novels\./);
  assert.match(a.s.say('add 3 green novels').reply.text, /^I added 3 green novels\./);
  assert.match(a.s.say('add a novel and an atlas').reply.text, /^I added a novel\. I added an atlas\./, 'nothing said, no value');
  const r = requestSession(exampleWorld(SKETCH), { language, catalog: [language, kinds], revisions: language }).say('draw a red circle and a blue square');
  assert.match(r.reply.text, /^I drew a red circle\. I drew a blue square\./);
});

test('a state answer names the said attributes of few things, and only counts many', { skip: offline }, () => {
  const tool = shelfTool(), s = toolSession(toolWorld(SHELF), tool, { language, catalog: [language] });
  s.say('add a red novel and a blue atlas');
  assert.equal(s.say('what is on the shelf?').reply.text, 'There is a red novel. There is a blue atlas.');
  assert.equal(s.say('how many novels?').reply.text, 'There is a red novel.');
  s.say('add 5 comics');
  assert.equal(s.say('what is on the shelf?').reply.text, 'There is one novel. There is one atlas. There are 5 comics.', 'many things: counted only');
  const live = toolWorld(SHELF);
  const view = [{ id: 'a', kind: 'novel', colour: 'red' }, { id: 'b', kind: 'novel' }];
  assert.deepEqual(askWorld('state', { constraints: [] }, { live, view, catalog: [language] }).facts.map((f) => [f.reply, f.roles.number, f.roles.value]), [['state.count.value', 1, 'red'], ['state.count', 1, undefined]]);
  assert.deepEqual(askWorld('state', { constraints: [] }, { live, view, few: 1, catalog: [language] }).facts.map((f) => f.reply), ['state.count'], 'the threshold is a policy');
});
