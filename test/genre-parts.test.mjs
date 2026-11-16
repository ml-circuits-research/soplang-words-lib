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
