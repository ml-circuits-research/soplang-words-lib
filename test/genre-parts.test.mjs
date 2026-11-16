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
