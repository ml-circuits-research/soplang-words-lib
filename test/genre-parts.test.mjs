// 0.165.0 (PSys2 Q102): the parts of a whole come from its own kind's knowledge (a genre's parts), the topic of every text
// is said, short / long scale a text, and a step with no other value says so. Properties over the example worlds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planRequest, readRequest, toolSession } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';
import { requestSession, requestKinds, requestLanguage, STORIES, NOTES, GENRES, exampleWorld } from '../examples/request-app.mjs';
import { FACE, faceTool, faceBase, toolLanguage } from '../examples/tool-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await requestLanguage();
const kinds = offline ? null : await requestKinds();
const join = (text, as) => `${text}\n@j std.schema.kinds world=${as === 'note' ? 'notes' : 'stories'} from=k.demo.genre key=name acts=make as=${as}`;
const WORLDS = [['notes', join(NOTES, 'note')], ['stories', join(STORIES, 'story')]];
const session = (text) => requestSession(exampleWorld(text), { language, catalog: [language, kinds, exampleWorld(GENRES)], revisions: language });

test('a joined genre is planned with its own parts by name; two genres differ; the reply names them', { skip: offline }, () => {
  for (const [name, text] of WORLDS) {
    const r = session(text).say('write a letter about a fox');
    assert.deepEqual(r.plan.parts.map((p) => p.name), ['greeting', 'body', 'closing'], name);
    assert.deepEqual(r.plan.parts.find((p) => p.name === 'body').moves, ['generalise'], name);
    assert.ok(/The letter has a greeting, 2 bodies, a closing\./.test(r.reply.text), r.reply.text);
    const rep = session(text).say('write a report about owls');
    assert.deepEqual(rep.plan.parts.map((p) => p.name), ['chapter'], name);
    assert.ok(rep.plan.parts[0].count >= 3 && rep.plan.parts[0].count <= 8, name);
    assert.ok(!/chapters/.test(r.reply.text), 'a letter has no chapters');
  }
});

test('the topic is said for every genre joined as text, with the user\'s words', { skip: offline }, () => {
  for (const [name, text] of WORLDS) for (const [said, kind, about] of [['write a letter about a fox', 'letter', 'a fox'], ['write a report about ancient owls', 'report', 'ancient owls']]) {
    const r = session(text).say(said);
    assert.ok(r.reply.facts.some((f) => f.reply === 'done.about' && f.roles.whole === kind && f.roles.topic === about), `${name}: ${r.reply.text}`);
  }
});

test('short / long in a make request scale the parts of a text', { skip: offline }, () => {
  for (const [name, text] of WORLDS) {
    const count = (t) => session(text).say(t).plan.parts.find((p) => p.name === 'body' || p.name === 'chapter').count;
    const [a, b] = [count('write a short report about owls'), count('write a long report about owls')];
    assert.ok(a < b, `${name}: short ${a} < long ${b}`);
    assert.ok(count('write a short letter about a fox') < count('write a long letter about a fox'), name);
    const r = session(text).say('write a short letter about a fox');
    assert.deepEqual(r.plan.notHonoured, [], name);
  }
});

test('a step with no other value says so; with values it steps', { skip: offline }, async () => {
  const tl = await toolLanguage();
  const s = toolSession(exampleWorld(FACE), faceTool(), { language: tl, catalog: [tl, faceBase()] });
  for (const t of ['the next nose', 'another nose']) assert.match(s.say(t).reply.text, /The nose has no other variant\./);
  assert.ok(!/To what value/.test(s.say('the next nose').reply.text));
  assert.equal(s.say('the next mouth').reply.text, 'The mouth is grin now.');
});

// 0.166.0 (PSys2 Q102): step.parts is read from the step; done.parts has a data form; a tool that wrote fewer parts says so.
const DOCS = String.raw`
@acts core.use world=std.acts
@w std.schema.world name=docs
@t.doc core.type of=doc extends=std.schema.thing closed=true
@s.about core.slot of=doc key=about kind=string
@k.doc std.schema.kind of=doc world=docs acts=make acts=remove
@h.make std.schema.honours world=docs act=make on=about on=size on=count of=doc
@op.write std.tool.op name=write world=docs param=kind param=about param=parts effect=makes
@b.make std.tool.bind world=docs act=make of=doc op=write
@a.kind std.tool.arg bind=$b.make param=kind from=step.kind
@a.about std.tool.arg bind=$b.make param=about from=step.about
@a.parts std.tool.arg bind=$b.make param=parts from=step.parts
@w.write core.word text=write means=make
@j std.schema.kinds world=docs from=k.demo.genre key=name acts=make as=doc
`;
function docTool(writeLess) {
  const things = [], seen = [];
  return { seen, write({ kind, about, parts }) { seen.push(parts); things.push({ id: `d${things.length + 1}`, kind, about }); return { parts: Object.fromEntries((parts ?? []).map((p) => [p.name, writeLess && p.name === 'body' ? Math.max(1, p.count - 1) : p.count])) }; }, view: () => things.map((t) => ({ ...t })) };
}
const docSession = (tool) => toolSession(exampleWorld(DOCS), tool, { language, catalog: [language, kinds, exampleWorld(GENRES)], revisions: language });

test('step.parts reaches the tool; done.parts carries kinds and numbers; a tool that wrote fewer parts says short_of', { skip: offline }, () => {
  const tool = docTool(false);
  const r = docSession(tool).say('write a letter about a fox');
  assert.ok(r.run.ok, r.reply.text);
  assert.deepEqual(tool.seen[0].map((p) => p.name), ['greeting', 'body', 'closing']);
  const f = r.reply.facts.find((x) => x.reply === 'done.parts');
  assert.deepEqual([f.kinds, f.numbers], [['greeting', 'body', 'closing'], [1, 2, 1]]);
  assert.ok(!r.reply.facts.some((x) => x.reply === 'short_of'));
  const less = docSession(docTool(true)).say('write a letter about a fox');
  const s = less.reply.facts.filter((x) => x.reply === 'short_of');
  assert.deepEqual(s.map((x) => [x.part, x.roles.made, x.roles.asked]), [['body', 1, 2]], less.reply.text);
  assert.deepEqual(less.reply.facts.find((x) => x.reply === 'done.parts').numbers, [1, 1, 1]);
});

// 0.166.0 (reviewer 15:25): coordination against composition, and the clause not understood.
test('a thing no source reads, said together with a read kind, is named and the rest is made; a statement clause is named whole', { skip: offline }, () => {
  for (const [name, text] of WORLDS) {
    const s = () => session(text);
    const a = s().say('write a letter and a zorp');
    assert.ok(a.plan.ok && a.run?.ok !== false, `${name}: ${a.reply.text}`);
    assert.ok(a.reply.facts.some((f) => f.reply === 'not_honoured' && f.roles.words === 'zorp'), a.reply.text);
    assert.ok(!a.reply.facts.some((f) => f.reply === 'unread'), a.reply.text);
    const c = s().say('I baked a cake, write a letter');
    assert.ok(!c.plan?.ok, name);
    const u = c.reply.facts.find((f) => f.reply === 'not_understood');
    assert.equal(u?.roles.words, 'I baked a cake', `${name}: ${c.reply.text}`);
  }
});

// 0.167.0 (PSys2 reviewer 09:25): a length grade scales the expected words with the parts, and says its origin `said`;
// "longer" / "shorter" on a text a tool cannot lengthen says why; a revision keeps its topic and its counts quiet.
const LEN = String.raw`
@x.len k.expect.value of=letter on=length value=150
@x.rep k.expect.value of=report on=length value=300
`;
const TEXTS = String.raw`
@acts core.use world=std.acts
@w std.schema.world name=texts
@t.doc core.type of=doc extends=std.schema.thing closed=true
@s.about core.slot of=doc key=about kind=string
@s.length core.slot of=doc key=length kind=integer min=1
@k.doc std.schema.kind of=doc world=texts acts=make acts=remove
@h.make std.schema.honours world=texts act=make on=about on=length on=size on=count of=doc
@op.write std.tool.op name=write world=texts param=kind param=about param=length param=parts effect=makes
@b.make std.tool.bind world=texts act=make of=doc op=write
@a.kind std.tool.arg bind=$b.make param=kind from=step.kind
@a.about std.tool.arg bind=$b.make param=about from=step.about
@a.length std.tool.arg bind=$b.make param=length from=step.length
@a.parts std.tool.arg bind=$b.make param=parts from=step.parts
@h.remove std.schema.honours world=texts act=remove on=kind of=doc
@op.remove std.tool.op name=remove world=texts param=ids effect=removes
@b.remove std.tool.bind world=texts act=remove of=doc op=remove arg=ids<-step.things needs=exists(ids) removes=ids
@w.write core.word text=write means=make
@j std.schema.kinds world=texts from=k.demo.genre key=name acts=make as=doc
`;
// the tool knows only so many words about a topic (`limit`): it writes at most that many
function textTool(limit = Infinity) {
  const things = [], seen = [];
  return { seen, write({ kind, about, length, parts }) { seen.push({ kind, about, length }); things.push({ id: `d${seen.length}`, kind, about, length: Math.min(length ?? 100, limit) }); return { length: Math.min(length ?? 100, limit), parts: Object.fromEntries((parts ?? []).map((p) => [p.name, p.count])) }; }, remove({ ids }) { for (const i of [].concat(ids)) { const k = things.findIndex((t) => t.id === String(i)); if (k >= 0) things.splice(k, 1); } }, view: () => things.map((t) => ({ ...t })) };
}
const textSession = (tool) => toolSession(exampleWorld(`${TEXTS}${LEN}`), tool, { language, catalog: [language, kinds, exampleWorld(GENRES)], revisions: language });

test('a said length grade scales the expected words with the parts and is not an assumption', { skip: offline }, () => {
  const len = (said) => { const t = textTool(), r = textSession(t).say(said); return { r, length: t.seen[0].length }; };
  for (const [a, b, kind] of [['write a short letter about a fox', 'write a long letter about a fox', 'letter'], ['write a short report about owls', 'write a long report about owls', 'report']]) {
    const [s, l, d] = [len(a), len(b), len(`write a ${kind} about a fox`)];
    assert.ok(s.length < d.length && d.length < l.length, `${kind}: ${s.length} < ${d.length} < ${l.length}`);
    for (const x of [s, l]) assert.ok(!x.r.reply.facts.some((f) => f.reply === 'assumed' && f.roles.key === 'length'), x.r.reply.text);
    assert.ok(d.r.reply.facts.some((f) => f.reply === 'assumed' && f.roles.key === 'length'), 'unsaid: still an assumption');
  }
});

test('"longer" / "shorter" on a text scale it; a tool that cannot lengthen says what it knows', { skip: offline }, () => {
  const t = textTool(), s = textSession(t);
  s.say('write a short letter about a fox');
  const a = s.say('longer'), b = s.say('longer'), c = s.say('shorter');
  assert.ok(t.seen.length === 4 && t.seen[1].length > t.seen[0].length && t.seen[2].length > t.seen[1].length && t.seen[3].length < t.seen[2].length, JSON.stringify(t.seen));
  for (const x of [a, b, c]) assert.ok(!/already/.test(x.reply.text), x.reply.text);
  assert.ok(t.seen.every((x) => /fox/.test(x.about)), 'the topic is kept');
  const lim = textTool(39), l = textSession(lim);
  l.say('write a short letter about a fox');
  const r = l.say('longer');
  assert.ok(r.run.same, 'the text is the same');
  const f = r.reply.facts.find((x) => x.reply === 'nothing.same.limit');
  assert.ok(f && f.roles.made === 39 && f.roles.about === 'a fox' && f.short_of.asked > 39, r.reply.text);
  assert.match(r.reply.text, /I know nothing more about a fox; it stays at 39 words\./);
  assert.ok(!/already/.test(r.reply.text));
});

test('a revision does not say the count or the length the user did not ask about', { skip: offline }, () => {
  const s = session(join(STORIES, 'story'));
  s.say('write a story about a lake');
  for (const said of ['longer', 'shorter']) {
    const r = s.say(said);
    assert.ok(!r.reply.facts.some((f) => f.reply === 'assumed'), `${said}: ${r.reply.text}`);
    assert.ok(!r.reply.facts.some((f) => /^done\.(about|title)$/.test(f.reply)), r.reply.text);
  }
});
