// Requests as worlds (owner GO 2026-11-15): readRequest on the published w.lang.en cues, reviseRequest by the
// w.dialogue.revision facts, planRequest from a world's declared capabilities, sayRequest by the reply facts; the
// properties P1-P8 run over every example world by reading what it declares, not by a list of its words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, readRequest, reviseRequest, planRequest, runPlan, sayRequest, requestWires, capabilitiesOf, REQUEST_KEYS } from '../tools/lib-under-test.mjs';
import { worldsDir, worldText } from '../tools/worlds.mjs';
import { SKETCH, NOTES, exampleWorld, requestSession, requestLanguage } from '../examples/request-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await requestLanguage();
const ctx = { language, catalog: language ? [language] : [] };
const read = (w, t, extra = {}) => readRequest(w, t, { ...ctx, ...extra });
const C = (r, on) => r.constraints.filter((c) => c.on === on).map(({ at, origin, cue, ...c }) => c);

test('readRequest: negation, not all, ranges, amounts, scale, place and extent, with-lists, about, length, unread', { skip: offline }, () => {
  const w = exampleWorld(SKETCH);
  let r = read(w, 'draw a sketch, not a circle');
  assert.deepEqual([r.act, r.target], ['make', 'picture']);
  assert.deepEqual(C(r, 'kind'), [{ on: 'kind', want: 'no', value: 'circle', words: 'not a circle' }]);
  assert.deepEqual(C(read(w, 'not all circles, better layout'), 'kind').map((c) => c.want), ['not_all']);
  assert.deepEqual(C(read(w, 'not all circles, better layout'), 'layout').map((c) => c.value), ['better']);
  r = read(w, 'draw a picture with 5-10 shapes');
  assert.deepEqual(C(r, 'count').map((c) => [c.min, c.max, c.of]), [[5, 10, 'shape']]);
  assert.deepEqual(C(read(w, 'draw between 2 and 4 squares'), 'count').map((c) => [c.min, c.max]), [[2, 4]]);
  assert.deepEqual(C(read(w, 'draw a few circles'), 'count').map((c) => c.amount), ['few']);
  assert.deepEqual(C(read(w, 'draw about 6 triangles'), 'count').map((c) => [c.number, c.bound]), [[6, 'about']]);
  assert.deepEqual(C(read(w, 'draw 3 small red circles'), 'count').map((c) => [c.number, c.of]), [[3, 'circle']]);
  r = read(w, 'draw a small picture in a corner');
  assert.deepEqual([C(r, 'size')[0].value, C(r, 'extent')[0].value, C(r, 'place')[0].value], ['small', 'small', 'corner'], 'two cues of one phrase both hold');
  r = read(w, 'draw a pond with water plants and a duck');
  assert.deepEqual([r.target, C(r, 'with').map((c) => c.value)], ['pond', ['water plants', 'duck']], 'a whole of the catalog; an open phrase and a kind');
  r = read(exampleWorld(NOTES), 'write a story of 3 chapters about ancient hobbits');
  assert.deepEqual([C(r, 'length')[0].number, C(r, 'length')[0].unit, C(r, 'about')[0].value], [3, 'chapter', 'ancient hobbits']);
  r = read(w, 'draw a blorp picture, you are stupid');
  assert.deepEqual([r.unread, r.reactions.map((x) => x.value)], [['blorp'], ['frustration']]);
  r = read(w, 'make it bigger');
  assert.deepEqual([r.act, r.reactions.map((x) => x.value), C(r, 'size').map((c) => c.step)], [null, ['enlarge'], ['up']], 'a cue longer than the verb is the reading');
  // the host's flat shape and the w.request wires
  assert.deepEqual(read(w, 'not all circles').facts, [{ key: 'kind', value: 'circle', neg: true, all: true }]);
  assert.deepEqual(read(w, 'a small pond').facts, [{ key: 'size', step: 'small' }]);
  const rw = new World();
  assert.ok(rw.load(['@s core.use world=std.schema', worldText('w.request')].join('\n')).ok);
  const told = rw.tell(requestWires(read(w, 'draw a picture with 5-10 shapes, not a circle, blorp')));
  assert.ok(told.ok, JSON.stringify(told.violations?.[0]));
  assert.deepEqual([rw.ofType('w.request.constraint').length, rw.ofType('w.request.unread').length], [2, 1]);
});

test('reviseRequest: new request or a revision by the w.dialogue.revision facts (flip, step, add, keep, undo, none)', { skip: offline }, () => {
  const w = exampleWorld(SKETCH);
  const last = read(w, 'draw a picture of circles');
  const d = { last, result: { count: 6, kinds: { circle: 6 } }, previous: null, seed: 1 };
  const rv = (t) => reviseRequest(d, read(w, t, { dialogue: d }), { revisions: language, catalog: [language] });
  assert.equal(rv('draw a picture').sort, 'request', 'a new thing is a new request');
  let r = rv('no');
  assert.deepEqual([r.reaction, r.replace, C(r.request, 'kind').map((c) => `${c.want}:${c.value}`)], ['reject', true, ['no:circle']]);
  r = rv('you overdid it');
  assert.deepEqual([r.reaction, C(r.request, 'count').map((c) => c.number)], ['reduce', [4]], '6 times 0.6 / 1 (k.expect.scale small / default)');
  assert.ok(C(r.request, 'extent').length, 'and the extent one step down');
  assert.deepEqual(C(rv('more').request, 'count').map((c) => c.number), [9]);
  r = rv('not all circles, better layout');
  assert.deepEqual([r.reaction, C(r.request, 'kind').map((c) => `${c.want}:${c.value}`), C(r.request, 'layout').length], ['refine', ['not_all:circle'], 1]);
  r = rv('again');
  assert.deepEqual([r.reaction, r.seed, r.vary], ['redo', 2, true]);
  assert.deepEqual([rv('thanks').request, rv('thanks').reply], [null, 'welcome']);
  r = rv('this is stupid');
  assert.deepEqual([r.reaction, r.reply, C(r.request, 'kind').map((c) => c.want)], ['frustration', 'sorry', ['no']]);
  assert.deepEqual([rv('put it back').undo, rv('put it back').request], [true, null]);
  r = rv('my expectation was a diagram with 5-10 nodes, not a circle');
  assert.deepEqual([r.reaction, r.request.target, C(r.request, 'count').map((c) => [c.min, c.max])], ['refine', 'diagram', [[5, 10]]]);
});

// ---- the properties, over every example world, by what it declares ----------------------------------------------
const WORLDS = { sketch: SKETCH, notes: NOTES };
const PHRASE = { size: 'small', extent: 'in a corner', attribute: 'in red', place: 'in the top left', manner: 'random', layout: 'in a grid', with: 'with a dragon', about: 'about bees', length: 'of 2 pages' };
/** What a world declares for make: its whole, the unit, the kinds of the unit, the keys. */
function declared(w) {
  const cap = capabilitiesOf(w);
  const h = cap.honours.find((x) => x.act === 'make');
  const whole = h.of.find((k) => w.ofType('k.expect.make').some((m) => m.attrs.thing[0] === k));
  const mk = w.ofType('k.expect.make').find((m) => m.attrs.thing[0] === whole);
  const parts = w.ofType('k.expect.part').filter((p) => p.attrs.of[0] === whole && p.attrs.group[0] !== 'link');
  const kinds = parts.flatMap((p) => p.attrs.shape ?? p.attrs.part).filter((k) => cap.kinds.get(k)?.has('make'));
  return { keys: h.on, whole, unit: mk.attrs.unit[0], kinds, min: Number(mk.attrs.min[0]), max: Number(mk.attrs.max[0]) };
}
const plan = (w, t, o = {}) => planRequest(w, read(w, t), { catalog: ctx.catalog, ...o });
const itemsOf = (p) => p.steps.filter((s) => s.item).map((s) => s.args.kind);

for (const [name, text] of Object.entries(WORLDS)) {
  test(`request properties P1-P8 over ${name}, read from its declarations`, { skip: offline }, () => {
    const w = exampleWorld(text);
    const D = declared(w);
    const make = `make a ${D.whole}`;
    const counted = [];
    // P1: "not X" never yields X; "not all X" yields more than one kind
    if (D.keys.has('kind') && D.kinds.length > 1) {
      for (const k of D.kinds) { assert.ok(!itemsOf(plan(w, `${make}, not ${k}s`)).includes(k), `P1 not ${k}`); counted.push('P1'); }
      for (const k of D.kinds) { assert.ok(new Set(itemsOf(plan(w, `${make}, not all ${k}s`))).size > 1, `P1 not all ${k}`); counted.push('P1'); }
    }
    // P2: a count or a range is respected
    if (D.keys.has('count')) for (const [lo, hi] of [[3, 4], [2, 2], [5, 7]]) {
      const n = itemsOf(plan(w, lo === hi ? `${make} with ${lo} ${D.unit}s` : `${make} with ${lo}-${hi} ${D.unit}s`)).length;
      assert.ok(n >= lo && n <= hi, `P2 ${lo}-${hi}: ${n}`); counted.push('P2');
    }
    // P3: small < default < big
    if (D.keys.has('size')) {
      const [s, d, b] = ['small', '', 'big'].map((x) => itemsOf(plan(w, `make a ${x} ${D.whole}`)).length);
      assert.ok(s < d && d < b, `P3 ${s} < ${d} < ${b}`); counted.push('P3');
    }
    if (D.keys.has('extent')) { const e = (x) => plan(w, `${make} ${x}`).roles.extent; assert.ok(e('in a corner') < e('filling the canvas'), 'P3 extent'); counted.push('P3'); }
    // P4: a reaction changes the last result in its direction and does not add a second one
    {
      const live = exampleWorld(text), s = requestSession(live, { ...ctx, revisions: language });
      const things = () => live.ofType('std.schema.thing').length;
      const a = s.say(make).run.result;
      const b = s.say('too many').run.result;
      assert.ok(b.count < a.count && things() === b.count + 1, `P4 reduce: ${a.count} -> ${b.count}, ${things()} things`);
      const c = s.say('more').run.result;
      assert.ok(c.count > b.count && things() === c.count + 1, `P4 enlarge: ${b.count} -> ${c.count}`); counted.push('P4');
    }
    // P5: every content word is in the request or named as unread in the reply
    {
      const s = requestSession(exampleWorld(text), { ...ctx, revisions: language });
      const r = s.say(`${make} with blorp zibble`);
      assert.ok(r.run?.ok && /blorp/.test(r.reply.text + JSON.stringify(r.plan.notHonoured)) && /zibble/.test(r.reply.text + JSON.stringify(r.plan.notHonoured)), `P5 ${r.reply.text}`); counted.push('P5');
    }
    // P6: no catch-all executes: an unread word where the act stands is never guessed over
    for (const t of [`blorp a ${D.whole}`, 'zibble wobble', `blorp it`]) {
      const s = requestSession(exampleWorld(text), { ...ctx, revisions: language });
      const r = s.say(t);
      assert.ok(!r.run, `P6 ${t}`); counted.push('P6');
    }
    // P7: "random" twice gives two different results, inside the typical range, never the minimum
    {
      const r1 = plan(w, `make a random ${D.whole}`, { seed: 1 }), r2 = plan(w, `make a random ${D.whole}`, { seed: 2 });
      const n1 = itemsOf(r1).length, n2 = itemsOf(r2).length;
      assert.notDeepEqual([itemsOf(r1), r1.roles.layout], [itemsOf(r2), r2.roles.layout], 'P7 two different results');
      for (const n of [n1, n2]) assert.ok(n > D.min && n <= D.max, `P7 ${n} in (${D.min}, ${D.max}]`); counted.push('P7');
    }
    // P8: a constraint the world does not declare is named
    for (const key of REQUEST_KEYS.filter((k) => !D.keys.has(k) && PHRASE[k])) {
      const p = plan(w, `${make} ${PHRASE[key]}`);
      assert.ok(p.notHonoured.some((x) => x.on === key), `P8 ${key}: ${JSON.stringify(p.notHonoured)}`); counted.push('P8');
    }
    // a declared key nothing in the world takes is named too (with a dragon: no such kind)
    if (D.keys.has('with')) { assert.ok(plan(w, `${make} with a dragon`).notHonoured.some((x) => x.on === 'with')); counted.push('P8'); }
    const by = counted.reduce((a, p) => ({ ...a, [p]: (a[p] ?? 0) + 1 }), {});
    console.log(`# ${name}: ${Object.entries(by).map(([p, n]) => `${p} ${n}`).join(', ')}`);
    assert.ok(['P4', 'P5', 'P6', 'P7', 'P8'].every((p) => by[p]), JSON.stringify(by));
  });
}

test('a world that declares a constraint it has nowhere to put fails: the planner names it (capabilities are checked, not trusted)', { skip: offline }, () => {
  const w = exampleWorld(NOTES.replace('on=about on=length', 'on=about on=length on=place'));
  const p = plan(w, 'write a note in the top left');
  assert.deepEqual(p.notHonoured.map((x) => [x.on, x.code]), [['place', 'no_slot']]);
});

test('sayRequest: reply facts by name, composed by the language world', { skip: offline }, () => {
  const w = exampleWorld(SKETCH);
  const q = read(w, 'draw a sketch in the top left, blorp');
  const p = planRequest(w, q, { catalog: ctx.catalog });
  const run = runPlan(w, p);
  const say = sayRequest(q, { ...p, run }, { language });
  assert.deepEqual([...new Set(say.facts.map((f) => f.reply))], ['done.make', 'assumed', 'not_honoured', 'unread']);
  assert.match(say.text, /^I drew a picture\. I assumed row for the layout\..* I could not do in the top left: .* I did not use: "blorp"\.$/);
  assert.deepEqual(say.missing, []);
});
