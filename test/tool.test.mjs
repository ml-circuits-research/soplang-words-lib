// Tool binding as wires (0.152, owner 2026-11-15 19:27): std.tool.* declarations, value translation by knowledge,
// conditional expectations, structure operators, runPlan over primitives and a view (diff, preconditions, all or
// nothing, timeline), and the door (toolSession) on two invented tool worlds with zero glue; properties over both.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, toolBindings, toolTimeline, toolSession, toolCapabilities, nearestAccepted, stateDiff, runPlan, planRequest, readRequest, sayRequest, kindLineage, expectedValue, cutToCount, fillToCount, notAllOneKind } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';
import { SHELF, NECKLACE, shelfTool, necklaceTool, exampleWorld, toolLanguage } from '../examples/tool-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await toolLanguage();
const SCALE = `@t core.type of=ex.scale\n@s core.slot of=ex.scale key=step id=true\n${['tiny', 'small', 'default', 'big', 'huge'].map((x, i) => `@g.${x} ex.scale step=${x} order=${i + 1}`).join('\n')}`;
const scale = new World(); scale.load(SCALE);
const content = (v) => v.map(({ id, ...t }) => JSON.stringify(Object.entries(t).filter(([k]) => !['a', 'b', 'in'].includes(k)).sort())).sort();

test('toolBindings: the declarations read and checked (an undeclared op, parameter, source, constraint)', () => {
  const w = exampleWorld(SHELF);
  const B = toolBindings(w);
  assert.deepEqual([[...B.ops.keys()], B.binds.map((b) => `${b.act}:${b.op}`), B.problems], [['add', 'remove', 'paint', 'move'], ['make:add', 'remove:remove', 'place:move', 'change:paint'], []]);
  assert.deepEqual(B.binds[0].args.find((a) => a.name === 'n'), { name: 'n', sources: ['step.count'] }, 'a std.tool.arg wire');
  assert.deepEqual([B.params.get('add').get('n').default, B.params.get('add').get('n').kind, B.params.get('add').get('kind').required], ['1', 'integer', true]);
  const N = toolBindings(exampleWorld(NECKLACE));
  assert.deepEqual([N.problems, N.binds.find((b) => b.op === 'bead').needs.find((n) => n.name === 'some')?.kinds, N.binds.find((b) => b.op === 'bead').args.find((a) => a.name === 'on').sources], [[], ['necklace'], ['step.in', 'state.necklace']], 'std.tool.needs op= exists=; alternatives of sources');
  assert.deepEqual([nearestAccepted('atlas', B.params.get('add').get('kind'), { live: w }).value, nearestAccepted('shelf', B.params.get('add').get('kind'), { live: w }).refused], ['atlas', true], 'type=<a kind of the world>: it or its subkinds');
  const bad = new World();
  bad.load(`@tool core.use world=std.tool
@o std.tool.op name=put param=a
@b std.tool.bind act=make op=put arg=b<-step.b arg=a<-guess.x needs=room(a)
@c std.tool.bind act=remove op=drop`);
  assert.deepEqual(toolBindings(bad).problems.map((p) => p.code).sort(), ['no_custom', 'no_op', 'no_param', 'source']);
});

test('nearestAccepted: a grade to the nearest accepted grade, a kind along its lineage or what it is drawn as, a number into its range', () => {
  const p = { name: 'size', type: 'ex.scale', accepts: ['small', 'big'] };
  const t = (v) => nearestAccepted(v, p, { catalog: [scale] });
  assert.deepEqual([t('tiny').value, t('small').value, t('huge').value, t('default').value, t('tiny').translated], ['small', 'small', 'big', 'small', true], 'ties in the order of accepts');
  assert.ok(nearestAccepted('vast', p, { catalog: [scale] }).refused);
  const w = new World();
  w.load(`@t.shape core.type of=shape\n@t.oval core.type of=oval extends=shape\n@t.ellipse core.type of=ellipse extends=shape\n@t.egg core.type of=egg extends=oval\n@d std.schema.drawn kind=oval as=ellipse`);
  const k = { name: 'kind', type: 'kind', accepts: ['ellipse', 'shape'] };
  assert.deepEqual([nearestAccepted('oval', k, { live: w }).value, nearestAccepted('oval', k, { live: w }).by, nearestAccepted('egg', k, { live: w }).value], ['ellipse', 'drawn', 'shape']);
  assert.deepEqual(kindLineage('egg', { live: w }), ['egg', 'oval', 'shape']);
  assert.deepEqual([nearestAccepted(40, { type: 'integer', min: 1, max: 12 }).value, nearestAccepted('2', { type: 'integer', min: 1 }).value], [12, 2]);
});

test('expectedValue: conditional expectations, the most specific first; the values of one if-key are alternatives', () => {
  const w = exampleWorld(SHELF);
  const e = (kind, key, known) => expectedValue(kind, key, known, { live: w })?.value;
  assert.deepEqual([e('atlas', 'size', {}), e('novel', 'size', {}), e('novel', 'end', { size: 'big' }), e('novel', 'end', { size: 'huge' }), e('novel', 'end', { size: 'small' })], ['big', 'small', 'right', 'right', 'left']);
  assert.deepEqual(expectedValue('novel', 'end', { size: 'big' }, { live: w }).because, ['size=big']);
  const old = new World(); old.load('@x k.expect.when of=book key=end value=right if.size=big');
  assert.equal(expectedValue('book', 'end', { size: 'big' }, { live: old }).value, 'right', 'the 0.152.0 form is still read');
});

test('structure operators: cut keeping it connected, fill in proportion, not all of one kind', () => {
  const links = [{ a: 0, b: 1 }, { a: 1, b: 2 }, { a: 0, b: 3 }, { a: 3, b: 4 }];
  assert.deepEqual(cutToCount([0, 1, 2, 3, 4], links, 3), { keep: [0, 1, 3], drop: [2, 4], links: [{ a: 0, b: 1 }, { a: 0, b: 3 }] });
  assert.deepEqual(fillToCount(['a', 'a', 'b'], 6), ['a', 'b', 'a']);
  assert.deepEqual(fillToCount(['a'], 3, { pool: ['a', 'b'], notAll: true }), ['a', 'b']);
  assert.deepEqual(notAllOneKind(['a', 'a', 'a'], ['a', 'b']), ['a', 'b', 'a']);
});

// a toy tool with a custom constraint and a snapshot, to check runPlan without the language
const BOX = String.raw`
@acts core.use world=std.acts
@tool core.use world=std.tool
@w std.schema.world name=box
@t.ball core.type of=ball extends=std.schema.thing closed=true
@s.size core.slot of=ball key=size enum=tiny enum=small enum=default enum=big enum=huge
@k std.schema.kind of=ball world=box acts=make acts=remove
@h std.schema.honours world=box act=make on=count on=size of=ball
@o std.tool.op name=put param=n param=size effect=makes
@p std.tool.param op=put name=size type=ex.scale accepts=small accepts=big
@o2 std.tool.op name=take param=ids effect=removes
@c std.tool.custom name=room kind=constraint in=n fails=refused.no_room
@b std.tool.bind act=make of=ball op=put arg=n<-step.count arg=size<-step.size needs=room(n) makes=thing
@b2 std.tool.bind act=remove op=take arg=ids<-step.things needs=exists(ids) removes=ids`;
function boxTool({ snapshots = false } = {}) {
  let balls = [], next = 1;
  const t = {
    put({ n, size }) { for (let i = 0; i < n; i++) balls.push({ id: `x${next++}`, kind: 'ball', size }); },
    take({ ids }) { balls = balls.filter((b) => !ids.includes(b.id)); },
    room({ n }, view) { return view.length + n <= 4; },
    view: () => balls.map((b) => ({ ...b })),
  };
  if (snapshots) Object.assign(t, { snapshot: () => JSON.stringify([balls, next]), restore: (s) => { [balls, next] = JSON.parse(s); } });
  return t;
}

test('runPlan: grouped calls, translation with provenance, a custom constraint, all or nothing, the timeline by snapshot or by inverse', () => {
  const w = exampleWorld(BOX);
  for (const snapshots of [false, true]) {
    const tool = boxTool({ snapshots }), B = toolBindings(w, { catalog: [scale] }), tl = toolTimeline();
    const q = { act: 'make', target: 'ball', text: '3 tiny balls', unread: [], constraints: [{ on: 'count', want: 'yes', number: 3, of: 'ball', words: '3' }, { on: 'size', want: 'yes', value: 'tiny', words: 'tiny' }] };
    const plan = planRequest(w, q);
    const r = runPlan(plan, B, tool, { timeline: tl, live: w, catalog: [scale] });
    assert.ok(r.ok, JSON.stringify(r.failed));
    assert.deepEqual([r.calls.length, r.calls[0].args, r.diff.added.length, r.translated[0]], [1, { n: 3, size: 'small' }, 3, { key: 'size', was: 'tiny', value: 'small', by: 'ex.scale' }]);
    assert.ok(r.assumed.some((a) => a.from === 'translated' && a.was === 'tiny'));
    // two more do not fit: the custom constraint refuses, nothing changes, the reply names it
    const r2 = runPlan(planRequest(w, { ...q, constraints: [{ on: 'count', want: 'yes', number: 2, words: '2' }] }), B, tool, { timeline: tl, live: w, catalog: [scale] });
    assert.deepEqual([r2.ok, r2.failed.code, r2.failed.reply, tool.view().length, tl.done.length], [false, 'room', 'refused.no_room', 3, 1]);
    assert.deepEqual(sayRequest(q, { run: r2 }).facts.map((f) => f.reply), ['why.nothing', 'refused.no_room']);
    // a revision replaces the last step; undo takes it back; redo puts it again; a question is no step
    const r3 = runPlan(planRequest(w, { ...q, constraints: [{ on: 'count', want: 'yes', number: 1, words: '1' }] }), B, tool, { timeline: tl, live: w, catalog: [scale], replace: true });
    assert.deepEqual([r3.ok, r3.step, tool.view().length, tl.done.length], [true, 'replaced', 1, 1]);
    assert.deepEqual([runPlan({ act: 'undo' }, B, tool, { timeline: tl }).ok, tool.view().length], [true, 0]);
    assert.deepEqual([runPlan({ act: 'undo' }, B, tool, { timeline: tl }).failed.reply, runPlan({ act: 'redo' }, B, tool, { timeline: tl }).ok, tool.view().length], ['nothing.undo', true, 1]);
    const ask = runPlan({ act: 'ask', question: 'state', ok: true, steps: [] }, B, tool, { timeline: tl });
    assert.deepEqual([ask.ok, ask.question, tl.done.length, tool.view().length], [true, 'state', 1, 1]);
  }
  // a step no binding covers: nothing is called
  const r = runPlan({ ok: true, act: 'make', steps: [{ action: 'make', args: { kind: 'cube' }, item: true }] }, toolBindings(w), boxTool(), {});
  assert.deepEqual([r.ok, r.failed.code, r.calls.length], [false, 'no_binding', 0]);
  assert.deepEqual(stateDiff([{ id: 'a', kind: 'k', c: 1 }], [{ id: 'a', kind: 'k', c: 2 }, { id: 'b', kind: 'k' }]), { added: [{ id: 'b', kind: 'k', attrs: {} }], removed: [], changed: [{ id: 'a', kind: 'k', key: 'c', from: 1, to: 2 }] });
});

test('the shelf: declared only by wires and three primitives, through the door (make with count, negation, revision, undo, questions)', { skip: offline }, () => {
  const tool = shelfTool();
  const s = toolSession(exampleWorld(SHELF), tool, { language, catalog: [language] });
  const kinds = () => tool.view().map((b) => b.kind);
  let r = s.say('add 3 tiny red novels');
  assert.deepEqual([kinds(), tool.view().map((b) => `${b.size}/${b.colour}`)], [['novel', 'novel', 'novel'], ['small/red', 'small/red', 'small/red']], 'tiny -> small: the nearest grade the tool takes');
  assert.match(r.reply.text, /^I added 3 novels\./);
  r = s.say('add 4 books, not comics');
  assert.deepEqual([kinds().length, kinds().includes('comic'), new Set(kinds().slice(3)).size], [7, false, 2], 'a general kind: its subkinds, not the one negated, a mix');
  r = s.say('too many');
  assert.deepEqual([r.revision.sort, r.run.step, kinds().length, s.timeline.done.length, r.plan.structure], ['reaction', 'replaced', 5, 2, 'cut']);
  assert.match(r.reply.text, /^I removed/, 'a count revision is said by its net diff, not as a remake');
  r = s.say('undo');
  assert.deepEqual([kinds().length, r.reply.text], [3, 'I undid the last change.']);
  r = s.say('what can you do here?');
  assert.deepEqual([r.run.question, s.timeline.done.length, r.reply.facts[0].reply], ['capabilities', 1, 'can']);
  assert.match(r.reply.text, /novels, atlases, comics/);
  r = s.say('add 2 huge atlases');
  assert.deepEqual(tool.view().slice(3).map((b) => `${b.kind}/${b.size}/${b.end}`), ['atlas/big/right', 'atlas/big/right'], 'huge -> big; a big book at the right end (a conditional expectation)');
  r = s.say('add two novels and a comic');
  assert.deepEqual(kinds().slice(5), ['novel', 'novel', 'comic'], 'each count stays with its kind');
  assert.equal(s.say('how many novels?').reply.text, 'There are 5 novels.');
  assert.match(s.say('what is on the shelf?').reply.text, /There are 2 atlases\. There is one comic\./);
  const n = s.timeline.done.length, before = content(tool.view());
  r = s.say('in red');
  assert.deepEqual([r.run.same, r.reply.text, content(tool.view())], [true, 'Nothing changed. That is what is there already.', before], 'a revision with no effect');
  assert.equal(s.timeline.done.length, n);
  // acts on things that are there: a reference step over the view (selector before the kind, new value after)
  r = s.say('paint the comic blue');
  assert.deepEqual([tool.view().find((b) => b.kind === 'comic').colour, r.reply.text], ['blue', 'The comic is blue now.']);
  r = s.say('remove the atlases');
  assert.deepEqual([kinds().includes('atlas'), r.reply.text], [false, 'I removed 2 atlases.']);
  const steps = s.timeline.done.length;
  r = s.say('remove the novel');
  assert.deepEqual([r.reply.text, s.timeline.done.length, kinds().filter((k) => k === 'novel').length], ['Which novel? There are 5.', steps, 5], 'several and none in focus: one question, no step');
  assert.equal(s.say('remove the atlas').reply.text, 'Nothing changed. There is no atlas here.');
  s.say('undo');
  assert.ok(kinds().includes('atlas'), 'undo of a remove makes them again through the make binding');
  // a message read only in part executes nothing, and the target is never guessed over an unread word
  r = s.say('add 2 dictionaries');
  assert.deepEqual([r.run.ok, r.reply.text.startsWith('Nothing changed. I did not understand'), s.timeline.done.length], [false, true, steps - 1]);
});

// ---- properties over every tool example world, by what it declares -------------------------------------------------
const TOOL_WORLDS = { shelf: [SHELF, shelfTool], necklace: [NECKLACE, necklaceTool] };
const plural = (k) => (/(s|x|ch|sh)$/.test(k) ? `${k}es` : `${k}s`);

test('properties over every tool example world: bindings sound, primitives free of the world\'s words, count, negation, revision, undo, questions', { skip: offline }, () => {
  let checked = 0;
  for (const [name, [text, make]] of Object.entries(TOOL_WORLDS)) {
    const w = exampleWorld(text);
    const B = toolBindings(w);
    assert.deepEqual(B.problems, [], `${name}: the bindings name only what is declared`);
    const caps = toolCapabilities(w, B);
    const kinds = caps.find((c) => c.act === 'make').kinds;
    // zero glue: no primitive holds a kind of the world as a literal, none reads a request
    const declaredKinds = w.ofType('std.schema.kind').map((k) => String(k.attrs.of[0]));
    for (const [op, fn] of Object.entries(make())) {
      const src = String(fn);
      assert.ok(!/request|constraint/.test(src), `${name}.${op} reads no request`);
      for (const k of declaredKinds) assert.ok(!new RegExp(`['"\`]${k}['"\`]`).test(src), `${name}.${op} names no kind (${k})`);
    }
    for (const kind of kinds) {
      for (const n of [1, 3]) { // P-T1: a count said is made, or named
        const tool = make(), s = toolSession(w, tool, { language, catalog: [language] });
        const r = s.say(`add ${n} ${n > 1 ? plural(kind) : kind}`);
        const made = r.run?.diff?.added.filter((t) => t.kind === kind).length ?? 0;
        const named = [...(r.plan?.notHonoured ?? []), ...(r.plan?.cannot ?? [])].length > 0 || r.run?.failed;
        assert.ok(made === n || named, `${name}: add ${n} ${kind} -> ${made}`);
        // P-T4: undo gives the state before
        s.say('undo');
        assert.deepEqual(tool.view(), [], `${name}: undo after add ${n} ${kind}`);
        checked++;
      }
    }
    // P-T2, P-T3, P-T5: negation, a revision replaces (one step), a question is no step and changes nothing
    const target = w.ofType('k.expect.make')[0]?.attrs.thing[0] ?? caps[0].kinds[0];
    const general = w.ofType('std.schema.honours').flatMap((h) => h.attrs.of).map(String).find((k) => !declaredKinds.includes(k));
    const what = general ? plural(general) : target;
    const tool = make(), s = toolSession(w, tool, { language, catalog: [language] });
    const neg = kinds.find((k) => k !== target);
    s.say(`add ${what}, not ${plural(neg)}`);
    assert.ok(tool.view().length && !tool.view().some((t) => t.kind === neg), `${name}: not ${neg}`);
    const steps = s.timeline.done.length;
    const r = s.say('too many');
    assert.deepEqual([r.revision.sort, s.timeline.done.length], ['reaction', steps], `${name}: a revision replaces the last step`);
    assert.ok(!tool.view().some((t) => t.kind === neg), `${name}: the revision keeps what it does not touch`);
    const v = JSON.stringify(tool.view());
    for (const q of ['what can you do here?', 'what is there?']) { const a = s.say(q); assert.deepEqual([JSON.stringify(tool.view()), s.timeline.done.length, a.reply.missing], [v, steps, []], `${name}: ${q}`); }
    // P-T6: coordinated counts
    const parts = kinds.filter((k) => k !== target);
    if (parts.length >= 2) {
      const t2 = make(), s2 = toolSession(w, t2, { language, catalog: [language] });
      const r2 = s2.say(`add 2 ${plural(parts[0])} and 1 ${parts[1]}`);
      const got = (k) => t2.view().filter((t) => t.kind === k).length;
      assert.ok((got(parts[0]) === 2 && got(parts[1]) === 1) || r2.plan?.notHonoured?.length || r2.plan?.cannot?.length, `${name}: every count said is in the result or named`);
    }
    checked++;
  }
  console.log(`# ${checked} tool-world properties`);
});
