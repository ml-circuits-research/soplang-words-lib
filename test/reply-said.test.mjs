// What a reply says (0.155.0): never a missing value, only the assumptions that matter, the net state of a revised whole.
// Properties over every example world, with no case keyed to a world, a kind or a sentence.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, toolSession, sayRequest, nearestAccepted, runPlan, toolBindings, ASSUMED_MAX } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';
import { requestSession, requestLanguage, requestKinds, SKETCH, NOTES, GARDEN, exampleWorld } from '../examples/request-app.mjs';
import { SHELF, NECKLACE, shelfTool, necklaceTool, toolLanguage } from '../examples/tool-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await toolLanguage();
const kinds = offline ? null : await requestKinds();
const BAD = /\b(undefined|null|NaN)\b|\{\w+\}|\s{2,}|: ?\.|\( ?\)/;
const TURNS = ['make it', 'bigger', 'more', 'smaller', 'too many', 'make it bigger', 'add 3 of them', 'undo', 'make it again', 'in red'];
const sessions = () => [
  ['sketch', 'draw a sketch', requestSession(exampleWorld(SKETCH), { language, catalog: [language, kinds] })],
  ['notes', 'write a note', requestSession(exampleWorld(NOTES), { language, catalog: [language, kinds] })],
  ['garden', 'add a fish', requestSession(exampleWorld(GARDEN), { language, catalog: [language, kinds] })],
  ['shelf', 'add some books', toolSession(exampleWorld(SHELF), shelfTool(), { language, catalog: [language] })],
  ['necklace', 'make a necklace', toolSession(exampleWorld(NECKLACE), necklaceTool(), { language, catalog: [language] })],
];

test('every reply of every example world: no missing value, no duplicated assumption, at most ASSUMED_MAX assumptions', { skip: offline }, () => {
  let said = 0;
  for (const [name, first, s] of sessions()) for (const t of [first, ...TURNS]) {
    const r = s.say(t).reply;
    said++;
    assert.doesNotMatch(r.text, BAD, `${name}: ${t}: ${r.text}`);
    for (const f of r.facts) assert.ok(Object.values(f.roles ?? {}).every((v) => v !== undefined && v !== null && String(v) !== '' && String(v) !== 'NaN'), `${name}: ${t}: ${JSON.stringify(f)}`);
    const a = r.facts.filter((f) => f.reply === 'assumed');
    assert.ok(a.length <= ASSUMED_MAX, `${name}: ${t}: ${a.length} assumptions`);
    assert.equal(new Set(a.map((f) => `${f.roles.key.replace(/s$/, '')}`)).size, a.length, `${name}: ${t}: one fact said once`);
  }
  assert.ok(said > 40);
});

test('a changed key with no value to say is named by its direction, or left out', () => {
  const diff = (to) => ({ added: [], removed: [], changed: [{ id: 'a', kind: 'tree', key: 'size', from: 'small', to }] });
  const run = (to) => ({ ok: true, diff: diff(to), assumed: [], result: { kinds: {} } });
  const facts = (to, request) => sayRequest(request, { run: run(to), revised: true }, {}).facts.filter((f) => f.reply === 'done.change');
  const up = { reactions: [{ step: 'up', words: 'bigger' }], unread: [] };
  assert.deepEqual(facts(undefined, up).map((f) => f.roles.value), ['bigger']);
  assert.deepEqual(facts(null, up).map((f) => f.roles.value), ['bigger']);
  assert.deepEqual(facts(undefined, { reactions: [], unread: [] }), [], 'no direction: the line is omitted');
  assert.deepEqual(facts('big', up).map((f) => f.roles.value), ['big']);
});

test('a kind drawn as another (std.schema.drawn) is no assumption; a default layout is not news', { skip: offline }, () => {
  const w = new World();
  w.load(`@t.shape core.type of=shape\n@t.oval core.type of=oval extends=shape\n@t.ellipse core.type of=ellipse extends=shape\n@d std.schema.drawn kind=oval as=ellipse`);
  assert.equal(nearestAccepted('oval', { name: 'kind', type: 'kind', accepts: ['ellipse'] }, { live: w }).by, 'drawn');
  const say = sessions()[0][2].say('draw a sketch').reply;
  assert.ok(!say.facts.some((f) => f.reply === 'assumed' && f.roles.key === 'layout'), 'the world\'s declared layout is a default');
  assert.ok(say.facts.some((f) => f.reply === 'assumed'), 'a sampled count is still said');
});

test('assumptions: the strongest by source first, a list and a single kind are one fact, `say` and `sayMax` are data', () => {
  const plan = { assumed: [{ key: 'count', value: 5, from: 'sampled' }, { key: 'kind', value: 'tree', from: 'world' }, { key: 'kinds', value: 'tree, bush', from: 'world' }, { key: 'size', value: 'big', from: 'dialogue' }], run: null };
  const f = (opts) => sayRequest({ unread: [] }, plan, opts).facts.filter((x) => x.reply === 'assumed').map((x) => `${x.roles.key}=${x.roles.value}`);
  assert.deepEqual(f({}), ['kinds=tree, bush', 'size=big'], 'two strongest, the list says the single kind');
  assert.deepEqual(f({ sayMax: 3 }), ['count=5', 'kinds=tree, bush', 'size=big']);
  assert.deepEqual(f({ say: ['sampled'] }), ['count=5']);
});

test('a revised whole says its net state, not the operations', { skip: offline }, () => {
  const s = toolSession(exampleWorld(NECKLACE), necklaceTool(), { language, catalog: [language] });
  s.say('make a necklace');
  const r = s.say('more').reply;
  assert.deepEqual(r.facts.map((f) => f.reply), ['done.whole']);
  assert.match(r.text, /^The necklace now has \d+ rounds?, (\d+ squares?|a square)\.$/);
  const k = s.timeline.done.at(-1).result.kinds;
  assert.equal(r.facts[0].roles.parts.replace(/\D+/g, ' ').trim().split(' ').map(Number).reduce((a, b) => a + b, 0), Object.values(k).reduce((a, b) => a + b, 0));
});
