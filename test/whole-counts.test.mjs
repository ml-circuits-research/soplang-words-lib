// The count of a whole is checked against wholes, never its parts; what a reply says of a made whole; a text's length
// steps the length key; a count said of one part is that part's own; "new" leaves a trace and a bare "new X" is made;
// toolCapabilities and worldThings take the catalog (0.159.0). Properties over the example worlds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, readRequest, planRequest, sayRequest, toolCapabilities } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';
import { requestSession, requestKinds, requestLanguage, STORIES, MEADOW, SKETCH, NOTES, exampleWorld } from '../examples/request-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await requestLanguage();
const kinds = offline ? null : await requestKinds();
const session = (text) => requestSession(exampleWorld(text), { language, catalog: [language, kinds], revisions: language });
const wholes = (r) => r.run?.result?.things?.length ? r.run.result.whole : r.run?.result?.whole;

test('the count of a whole is a count of wholes: "a W with N parts" is one W and N parts, in every example world with parts', { skip: offline }, () => {
  for (const [name, text, say] of [
    ['stories', STORIES, ['write a story with 5 chapters', 'write a story about a lake where a storyteller writes a story about frogs', 'write a story with a chapter']],
    ['meadow', MEADOW, ['draw a meadow with 3 flowers', 'draw a meadow with a pond']],
    ['sketch', SKETCH, ['draw a picture with 3 circles', 'draw a picture with a square']],
    ['notes', NOTES, ['write a note with 4 paragraphs']],
  ]) for (const turn of say) {
    const r = session(text).say(turn);
    assert.ok(r.run?.ok, `${name}: ${turn}: ${r.reply.text}`);
    assert.ok(!/request said/.test(r.reply.text), `${name}: ${turn}: ${r.reply.text}`);
    assert.ok(wholes(r), `${name}: ${turn}: one whole`);
    const n = Object.values(r.run.result.kinds).reduce((a, b) => a + b, 0);
    assert.ok(n >= 1, `${name}: ${turn}: its parts`);
  }
  const r = session(STORIES).say('write a story with 5 chapters');
  assert.deepEqual(r.run.result.kinds, { chapter: 5 }, 'five chapters, one story');
  assert.equal(session(STORIES).say('write a story with a chapter').run.result.kinds.chapter, 1, 'a count said with "with" is that many, a unit kind too');
});

test('the reply names the topic said of a made whole; a request the knowledge cannot reach says made N of M', { skip: offline }, () => {
  const r = session(STORIES).say('write a story about ancient hobbits with 5 chapters');
  assert.ok(/about ancient hobbits/.test(r.reply.text), r.reply.text);
  assert.ok(r.reply.facts.some((f) => f.reply === 'done.about' && f.roles.topic === 'ancient hobbits'));
  const s = session(STORIES).say('write a story with 12 chapters');
  assert.ok(s.run.ok && s.plan.short, JSON.stringify(s.plan.short));
  assert.deepEqual([s.plan.short.made, s.plan.short.asked], [8, 12]);
  assert.ok(s.reply.facts.some((f) => f.reply === 'short_of' && f.roles.made === 8 && f.roles.asked === 12), s.reply.text);
  assert.ok(/8 of the 12/.test(s.reply.text), s.reply.text);
  // the host's own shortfall (a composer that wrote fewer words than asked) is said the same way
  const said = sayRequest(s.request, { ...s.plan, run: s.run, short: { made: 77, asked: 500, unit: 'words' } }, { language });
  assert.ok(said.facts.some((f) => f.reply === 'short_of' && f.roles.unit === 'words'), said.text);
  assert.ok(!session(STORIES).say('write a story with 5 chapters').reply.facts.some((f) => f.reply === 'short_of'), 'nothing short, nothing said');
});

test('"shorter" / "longer" on a text steps the length key and keeps the count out of it', { skip: offline }, () => {
  const s = session(STORIES);
  s.say('write a story about frogs');
  const len = (r) => r.plan.steps[0].args.length;
  const a = s.say('shorter'), b = s.say('longer');
  assert.ok(a.run.ok && b.run.ok, `${a.reply.text} / ${b.reply.text}`);
  assert.ok(len(a) < len(b), `${len(a)} < ${len(b)}`);
  for (const r of [a, b]) {
    assert.ok(r.request.constraints.some((c) => c.on === 'length' && c.value), 'a step of the length');
    assert.ok(!r.request.constraints.some((c) => c.on === 'count' && !c.of), 'no count of the whole stepped');
  }
});

test('a count said of one part of a whole with several kinds of parts steps that part alone', { skip: offline }, () => {
  const s = session(MEADOW);
  const k0 = { ...s.say('draw a meadow').run.result.kinds };
  for (const [turn, dir] of [['fewer flowers', -1], ['more flowers', 1]]) {
    const r = s.say(turn);
    assert.ok(r.run?.ok, `${turn}: ${r.reply.text}`);
    const k = r.run.result.kinds;
    assert.equal(Math.sign(k.flower - k0.flower), dir, `${turn}: ${JSON.stringify([k0, k])}`);
    for (const x of Object.keys(k0)) if (x !== 'flower') assert.equal(k[x], k0[x], `${turn}: ${x} keeps its count`);
    k0.flower = k.flower;
  }
});

test('"new" leaves a trace (fresh) in the reading; a bare "new X" of a made kind is made, "X" alone is not', { skip: offline }, () => {
  const w = exampleWorld(MEADOW);
  const a = readRequest(w, 'a new meadow', { language }), b = readRequest(w, 'draw a meadow', { language }), c = readRequest(w, 'new meadow', { language });
  assert.ok(a.fresh && a.constraints.some((x) => x.on === 'kind' && x.fresh), 'the trace');
  assert.ok(!b.fresh, 'no trace without it');
  assert.deepEqual([a.act, a.actFrom, c.act], ['make', 'fresh', 'make'], 'an act of the language world cue');
  assert.equal(readRequest(w, 'a meadow', { language }).act, null, 'no act without "new"');
  assert.equal(planRequest(w, a, { catalog: [language, kinds] }).fresh, true, 'the plan carries it');
  const r = session(MEADOW).say('a new meadow');
  assert.ok(r.run?.ok && !/understand/.test(r.reply.text), r.reply.text);
});

const JOINED = String.raw`
@acts core.use world=std.acts
@tool core.use world=std.tool
@w std.schema.world name=yard doc="an example world that joins a base"
@t.thing core.type of=thing extends=std.schema.thing closed=true
@k.house std.schema.kind of=house world=yard acts=make
@j std.schema.kinds world=yard from=k.demo.item key=name acts=make
@h.make std.schema.honours world=yard act=make on=kind on=count of=thing of=k.demo.item
@op.add std.tool.op name=add world=yard param=kind effect=makes
@b.make std.tool.bind world=yard act=make of=thing of=k.demo.item op=add`;
const BASE = String.raw`
@t.item core.type of=k.demo.item
@i1 k.demo.item name=goat
@i2 k.demo.item name=swing`;

test('toolCapabilities takes the catalog: the kinds a world joins are offered, as capabilitiesOf says', () => {
  const live = new World(), base = new World();
  assert.ok(live.load(JOINED).ok && base.load(BASE).ok);
  const plain = toolCapabilities(live).find((c) => c.act === 'make')?.kinds ?? [];
  const joined = toolCapabilities(live, null, { catalog: [base] }).find((c) => c.act === 'make')?.kinds ?? [];
  assert.ok(!plain.includes('goat'), JSON.stringify(plain));
  assert.ok(joined.includes('goat') && joined.includes('swing'), JSON.stringify(joined));
});
