// What a turn that changed nothing leaves to the next one, and what a turn that was turned into another act may not
// run (0.164.0, PSys2 Q100, Q98): the thing named by a reply that changed nothing is the one "it" means next, a read act
// planned as another act with words left untaken runs nothing, a step cue of the published words ("the next mouth"), an
// assumption said by the key of the world, a kind joined as a type of the world takes that type's slots. Properties over
// the example worlds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readRequest, planRequest, toolSession } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';
import { FACE, faceTool, faceBase, toolLanguage, exampleWorld } from '../examples/tool-app.mjs';
import { NOTES } from '../examples/request-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await toolLanguage();
const face = (text = FACE, tool = faceTool()) => ({ tool, s: toolSession(exampleWorld(text), tool, { language, catalog: [language, faceBase()] }) });
const say = (s, t) => s.say(t).reply.text;

test('the thing a reply that changed nothing names is what "it" means next, for every value said of it', { skip: offline }, () => {
  for (const value of ['red', 'blue', 'green']) {
    const { tool, s } = face();
    say(s, 'put on a hat');
    say(s, 'make the eyes black');
    assert.match(say(s, 'put on a hat'), /already there/);
    assert.match(say(s, `make it ${value}`), /^The hat is /);
    assert.equal(tool.view().find((x) => x.kind === 'hat').colour, value);
    assert.equal(tool.view().find((x) => x.kind === 'eyes').colour, 'black');
  }
  const { tool, s } = face();
  say(s, 'make the nose big');
  say(s, 'make the eyes round'); // already round: nothing changed, the eyes are the thing
  say(s, 'make the nose small');
  assert.match(say(s, 'make the nose small'), /already/);
  say(s, 'make it red');
  assert.equal(tool.view().find((x) => x.kind === 'nose').colour, 'red', 'a value already there names its thing');
});

test('a read act planned as another act with words left untaken runs nothing', { skip: offline }, () => {
  for (const t of ['put a crown on the chest', 'put a grin on the chest', 'make a crown on the chest']) {
    const { tool, s } = face();
    say(s, 'put on a hat');
    const before = JSON.stringify(tool.view());
    const r = s.say(t);
    assert.equal(r.plan.ok, false, t);
    assert.ok(r.plan.turned, t);
    assert.equal(JSON.stringify(tool.view()), before, `${t}: nothing ran`);
    assert.match(r.reply.text, /^Nothing changed\. .*on the chest/, t);
  }
  const { tool, s } = face();
  say(s, 'put on a hat');
  assert.equal(say(s, 'give her a crown'), 'The hat is crown now.', 'a turned act with everything taken still runs');
  assert.equal(tool.view().find((x) => x.kind === 'hat').variant, 'crown');
});

test('"the next mouth" / "another" is a step through the variants by the published cue, never a place', { skip: offline }, () => {
  for (const [t, dir] of [['the next mouth', 'up'], ['next mouth', 'up'], ['the previous mouth', 'down']]) {
    const r = readRequest(exampleWorld(FACE), t, { language, catalog: [language, faceBase()] });
    assert.ok(r.constraints.some((c) => c.on === 'attribute' && c.attribute === 'variant' && c.step === dir), t);
    assert.ok(!r.constraints.some((c) => c.on === 'place'), `${t}: no place`);
  }
  const { s } = face();
  assert.equal(say(s, 'the next mouth'), 'The mouth is grin now.');
  assert.equal(say(s, 'next mouth'), 'The mouth is pout now.');
  assert.equal(say(s, 'the previous mouth'), 'The mouth is grin now.');
  const r = readRequest(exampleWorld(FACE), 'put the mouth next to the nose', { language, catalog: [language, faceBase()] });
  assert.ok(r.constraints.some((c) => c.on === 'place' && c.relation === 'next_to'), 'next to is still a place');
});

test('an assumption is said by the key of the world, not by the name of a tool argument', { skip: offline }, () => {
  const text = FACE.replace('param=part param=variant param=colour', 'param=part param=worn param=colour').replace('arg=variant<-step.variant arg=colour<-step.colour arg=size<-step.size', 'arg=worn<-custom.presetWorn arg=colour<-step.colour arg=size<-step.size');
  assert.notEqual(text, FACE);
  const tool = faceTool(), put = tool.put;
  tool.put = ({ part, worn, colour, size }) => put({ part, variant: worn, colour, size });
  tool.presetWorn = ({ kind }) => (kind === 'glasses' ? 'specs' : null);
  const { s } = face(text + '\n@c std.tool.custom name=presetWorn kind=search\n', tool);
  const r = s.say('put on glasses');
  assert.equal(tool.view().find((x) => x.kind === 'glasses')?.variant, 'specs');
  assert.ok(r.run.assumed.some((a) => a.key === 'variant' && a.value === 'specs'), JSON.stringify(r.run.assumed));
  assert.ok(!/for the worn/.test(r.reply.text), r.reply.text);
});

test('a kind joined as a type of the world takes that type\'s slots: a genre joined as a note keeps its topic', { skip: offline }, () => {
  const base = exampleWorld('@t.genre core.type of=k.demo.genre\n@g.letter k.demo.genre name=letter\n@g.essay k.demo.genre name=essay\n@g.presentation k.demo.genre name=presentation');
  const w = exampleWorld(NOTES + '\n@j std.schema.kinds world=notes from=k.demo.genre key=name acts=make as=note');
  const catalog = [language, base];
  for (const [t, kind, about] of [['write a short letter about a villa', 'letter', 'villa'], ['write a presentation about owls', 'presentation', 'owls'], ['write an essay about a lake', 'essay', 'lake']]) {
    const p = planRequest(w, readRequest(w, t, { language, catalog }), { catalog });
    assert.ok(p.ok, t);
    assert.deepEqual(p.notHonoured, [], t);
    assert.deepEqual(p.steps.map((x) => x.args).filter((a) => a.kind === kind).map((a) => a.about), [about], t);
  }
});
