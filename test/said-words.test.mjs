// A reply fact that names a said value takes the person's own words; a state answer names a lone thing by its title (0.161.0).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askWorld } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';
import { requestSession, requestKinds, requestLanguage, STORIES, MEADOW, SKETCH, NOTES, exampleWorld } from '../examples/request-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await requestLanguage();
const kinds = offline ? null : await requestKinds();
const session = (text) => requestSession(exampleWorld(text), { language, catalog: [language, kinds], revisions: language });

test('the topic is said as the user said it (the constraint keeps its operand words)', { skip: offline }, () => {
  for (const [said, words] of [['write a story about a fox with 5 chapters', 'a fox'], ['write a story about ancient hobbits with 5 chapters', 'ancient hobbits']]) {
    const r = session(STORIES).say(said);
    const c = r.request.constraints.find((x) => x.on === 'about');
    assert.equal(c.said, words);
    assert.ok(r.reply.facts.some((f) => f.reply === 'done.about' && f.roles.topic === words), r.reply.text);
    assert.ok(r.reply.text.includes(`about ${words}`) && !/about about/.test(r.reply.text), r.reply.text);
  }
  for (const w of [MEADOW, SKETCH, NOTES]) { const r = session(w).say('draw a boat'); assert.ok(!r.request.constraints.some((c) => c.on === 'about'), 'no topic invented'); }
});

test('a state answer names a lone thing by its title or name; several things are only counted', () => {
  const live = { _: 0 };
  const view = (rows) => () => rows;
  const one = askWorld('state', { constraints: [] }, { live, view: view([{ id: 's1', kind: 'story', title: 'All about the fox' }]), catalog: [] });
  assert.deepEqual(one.facts.map((f) => [f.reply, f.roles.name]), [['state.count.named', 'All about the fox']]);
  const two = askWorld('state', { constraints: [] }, { live, view: view([{ id: 's1', kind: 'story', title: 'A' }, { id: 's2', kind: 'story', title: 'B' }]), catalog: [] });
  assert.deepEqual(two.facts.map((f) => f.reply), ['state.count']);
  const own = askWorld('state', { constraints: [] }, { live, nameKeys: ['label'], view: view([{ id: 's1', kind: 'story', label: 'L', title: 'T' }]), catalog: [] });
  assert.equal(own.facts[0].roles.name, 'L');
});

test('a topic changed is said once (the change, not the change and the topic)', { skip: offline }, () => {
  const s = session(STORIES);
  s.say('write a story about a fox with 5 chapters');
  const r = s.say('write a story about frogs');
  assert.ok(r.reply.facts.filter((f) => /^done\.(change\.)?about$|^done\.change$/.test(f.reply) && (f.reply !== 'done.change' || f.roles.key === 'about')).length <= 1, r.reply.text);
});
