// A whole with slots of parts (0.162.0, PSys2 Q96 slice A1, Q97, Q98): kinds joined as a type of the world (as=), values
// of a slot typed by a catalog type (a variant of a part, matched by the part's kind), values of a whole-level key, a
// world's own words before the catalog's, plural-noun kinds, what a thing can be, phrasal make / remove, the verb's
// value (reset), a step through ordered values (next), stand-ins with names of several words, a joined world of 2,000
// rows within a budget, the one a thing is for, a place with a side. Properties over the example worlds.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, readRequest, planRequest, runWorldPlan, toolSession, joinedKinds } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';
import { SHELF, NECKLACE, FACE, shelfTool, necklaceTool, faceTool, faceBase, toolLanguage, exampleWorld } from '../examples/tool-app.mjs';
import { SKETCH, GARDEN } from '../examples/request-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await toolLanguage();
const face = () => { const tool = faceTool(); return { tool, s: toolSession(exampleWorld(FACE), tool, { language, catalog: [language, faceBase()] }) }; };
const say = (s, t) => s.say(t).reply.text;
const TOOL_WORLDS = [['shelf', SHELF, shelfTool], ['necklace', NECKLACE, necklaceTool], ['puppet', FACE, faceTool]];
const session = (text, make) => { const tool = make(); return { tool, s: toolSession(exampleWorld(text), tool, { language, catalog: [language, faceBase()] }) }; };
const enumValues = (text) => [...new Set([...text.matchAll(/ enum=(\w+)/g)].map((m) => m[1]))].filter((v) => !/^(tiny|small|default|big|huge|left|right)$/.test(v)); // the values of the world's enum slots (the grades and ends are read by their cues)

test('a value word is never read as a kind made: "make her <value>" adds nothing in every tool example world', { skip: offline }, () => {
  for (const [name, text, make] of TOOL_WORLDS) {
    const values = [...enumValues(text), ...(name === 'puppet' ? ['happy', 'angry', 'sad'] : [])];
    assert.ok(values.length, name);
    for (const v of values) for (const t of [`make her ${v}`, `make it ${v}`]) {
      const { tool, s } = session(text, make);
      const before = tool.view().map((x) => `${x.id}:${x.kind}`).join(' ');
      s.say(t);
      assert.equal(tool.view().map((x) => `${x.id}:${x.kind}`).join(' '), before, `${name}: "${t}" made or re-kinded nothing`);
    }
  }
  const { tool, s } = face();
  assert.equal(say(s, 'make her angry'), 'The face is angry now.');
  assert.equal(say(s, 'make it happy'), 'The face is happy now.');
  assert.equal(tool.view()[0].kind, 'face', 'never a preset');
});

test('values of a slot typed by a catalog type name their kind; a preset with a whole-level value is made as one', { skip: offline }, () => {
  const { tool, s } = face();
  assert.equal(say(s, 'make a big smile'), 'The mouth is big now.');
  assert.deepEqual(tool.view().find((x) => x.kind === 'mouth'), { id: 'mouth', kind: 'mouth', variant: 'smile', size: 'big' });
  assert.equal(say(face().s, 'a grin'), 'The mouth is grin now.', 'a noun phrase alone asks for the thing');
  assert.equal(say(s, 'make an angry boy'), 'The face is a boy now. The face is angry now.');
  assert.deepEqual(tool.view()[0], { id: 'face', kind: 'boy', mood: 'angry' });
  const r = readRequest(exampleWorld(FACE), 'make a big smile', { language, catalog: [language, faceBase()] });
  assert.deepEqual(r.constraints.filter((c) => c.on !== 'count').map((c) => [c.on, c.value ?? c.attribute]), [['size', 'big'], ['attribute', 'smile'], ['kind', 'mouth']]);
});

test("a world's own value beats a catalog kind of the same spelling; kinds of several words; plural-noun kinds said as such", { skip: offline }, () => {
  const live = exampleWorld(FACE), catalog = [language, faceBase()];
  const r = readRequest(live, 'add a crown', { language, catalog });
  assert.deepEqual(r.constraints.filter((c) => c.on === 'kind').map((c) => c.value), ['hat'], 'the variant crown of the hat, not the catalog\'s crown');
  const { s } = face();
  assert.equal(say(s, 'make an old woman'), 'The face is an old woman now.');
  assert.equal(say(s, 'make the eyes big'), 'The eyes are big now.');
  assert.equal(say(s, 'take off the glasses'), 'Nothing changed. There are no glasses here.');
  assert.match(say(s, 'what can you do?'), /I can make: boys, robots, old women, kings, mouths, eyes, noses, hats, glasses\./);
});

test('an unknown kind named for a whole is refused with what it can be; a world whose things can be nothing else says it did not understand', { skip: offline }, () => {
  const { tool, s } = face();
  assert.equal(say(s, 'make the puppet an emoji'), 'The puppet cannot be an emoji; it can be a boy, a robot, an old woman, a king.');
  assert.equal(say(s, 'make the face an emoji'), 'The face cannot be an emoji; it can be a boy, a robot, an old woman, a king.');
  assert.equal(tool.view()[0].kind, 'face');
  assert.equal(say(s, 'make the face a robot'), 'The face is a robot now.');
  const shelf = session(SHELF, shelfTool).s;
  assert.match(say(shelf, 'make the shelf an emoji'), /did not understand: emoji/);
});

test('put / put on / take off / give: a phrasal make or remove of a part on the whole, in every tool world that makes the kind', { skip: offline }, () => {
  const { tool, s } = face();
  assert.equal(say(s, 'put a hat'), 'I added a hat.');
  assert.equal(say(s, 'take off the hat'), 'I removed the hat.');
  assert.equal(say(s, 'put on glasses'), 'I added glasses.');
  assert.equal(say(s, 'take off the glasses'), 'I removed the glasses.');
  assert.equal(say(s, 'give her a crown'), 'I added a crown hat.');
  assert.deepEqual(tool.view().find((x) => x.kind === 'hat'), { id: 'hat', kind: 'hat', variant: 'crown', size: 'default' });
  const shelf = session(SHELF, shelfTool);
  assert.match(say(shelf.s, 'put a novel'), /^I added a novel\./, 'nothing of it there and no place: it is made');
  assert.match(say(shelf.s, 'put the novel on the right'), /moved|right/, 'a thing there with a place: placed');
});

test('reset = the declared defaults; next / previous = a step through the ordered values of the kind', { skip: offline }, () => {
  const { tool, s } = face();
  s.say('make it happy');
  assert.equal(say(s, 'reset the face'), 'The face is calm now.');
  s.say('make the eyes big');
  assert.equal(say(s, 'reset the eyes'), 'The eyes are default now.');
  assert.equal(say(s, 'the next mouth'), 'The mouth is grin now.');
  assert.equal(say(s, 'the next mouth'), 'The mouth is pout now.');
  assert.equal(say(s, 'the next mouth'), 'The mouth is smile now.', 'round the order');
  assert.equal(say(s, 'the previous mouth'), 'The mouth is pout now.');
  assert.equal(tool.view().find((x) => x.kind === 'mouth').variant, 'pout');
});

test('a fragment that says what the last act cannot take does not continue it', { skip: offline }, () => {
  const { tool, s } = face();
  s.say('put a hat'); s.say('take off the hat');
  assert.equal(say(s, 'a big smile'), 'The mouth is big now.');
  assert.ok(tool.view().some((x) => x.kind === 'mouth'));
});

const STAND = String.raw`
@t.item core.type of=k.demo.item
@t.stand core.type of=k.demo.stand
@i1 k.demo.item name=house
@i2 k.demo.item name="water lily"
@s1 k.demo.stand name=villa drawing=house
@s2 k.demo.stand name="tree house" drawing=house`;
const YARD = (extra = '') => String.raw`
@acts core.use world=std.acts
@w std.schema.world name=yard
@t.thing core.type of=thing extends=std.schema.thing closed=true
@j.item std.schema.kinds world=yard from=k.demo.item key=name acts=make acts=remove stand_in=k.demo.stand
@h.make std.schema.honours world=yard act=make on=kind on=count` + extra;

test('stand-ins and joined names of several words are made; a stand-in is planned as its base', { skip: offline }, () => {
  const base = exampleWorld(STAND), cat = [language, base];
  for (const t of ['make a water lily', 'make a villa', 'make a tree house']) {
    const live = exampleWorld(YARD());
    const plan = planRequest(live, readRequest(live, t, { language, catalog: cat }), { catalog: cat });
    assert.ok(plan.ok, `${t}: ${JSON.stringify(plan.cannot)}`);
    assert.ok(runWorldPlan(live.fork(), plan, { catalog: cat }).ok, t);
  }
  const live = exampleWorld(YARD('\n@m k.expect.make thing=house unit=wall min=4 max=4 typical=4\n@p k.expect.part of=house part=wall min=4 max=4 typical=4 needed=yes\n@t.wall core.type of=wall extends=std.schema.thing\n@k.wall std.schema.kind of=wall world=yard acts=make'));
  const plan = planRequest(live, readRequest(live, 'make a villa', { language, catalog: cat }), { catalog: cat, reason: false });
  assert.deepEqual(plan.steps.map((x) => x.args.kind), ['villa', 'wall', 'wall', 'wall', 'wall'], 'the villa has the parts of a house');
});

test('a world joining a base of 2,000 rows: the join is built once and shared by forks; a turn within the budget', { skip: offline }, () => {
  const names = Array.from({ length: 2000 }, (_, i) => `k${i.toString(36).replace(/\d/g, (d) => 'abcdefghij'[d])}x`);
  const base = new World(); assert.ok(base.load('@t.item core.type of=k.demo.item\n' + names.map((n, i) => `@i${i} k.demo.item name=${n}`).join('\n') + '\n@g k.demo.item name=goat').ok);
  const live = exampleWorld(YARD()), cat = [language, base];
  assert.equal(joinedKinds(live.fork(), cat), joinedKinds(live.fork(), cat), 'one map for every fork');
  let t0 = performance.now();
  const p1 = planRequest(live, readRequest(live, 'make two goats', { language, catalog: cat }), { catalog: cat });
  const first = performance.now() - t0;
  t0 = performance.now();
  const p2 = planRequest(live, readRequest(live, `make a ${names[1234]}`, { language, catalog: cat }), { catalog: cat });
  const next = performance.now() - t0;
  assert.ok(p1.ok && p2.ok, 'both planned');
  assert.ok(first < 2000, `first turn ${first.toFixed(0)} ms (the index is built)`);
  assert.ok(next < 150, `a later turn ${next.toFixed(0)} ms`);
});

test('the one a thing is for is no topic: its words stay unread and nothing runs; a place with a side keeps the side', { skip: offline }, () => {
  for (const text of [SKETCH, GARDEN]) {
    const live = exampleWorld(text);
    const r = readRequest(live, 'for their grandma do it', { language, catalog: [language] });
    assert.ok(r.unread.includes('grandma') && !r.constraints.some((c) => c.on === 'about'), JSON.stringify(r.constraints));
    assert.equal(planRequest(live, r, { catalog: [language] }).ok, false);
    assert.ok(readRequest(live, 'draw a picture about bees', { language, catalog: [language] }).constraints.some((c) => c.on === 'about'), 'a topic is still read');
  }
  const POND = (x = '') => String.raw`
@acts core.use world=std.acts
@w std.schema.world name=pond
@t.fish core.type of=fish extends=std.schema.thing closed=true
@s.place core.slot of=fish key=place enum=middle enum=top_left enum=top_right enum=bottom_left enum=bottom_right
@k.fish std.schema.kind of=fish world=pond acts=make acts=place
@h.make std.schema.honours world=pond act=make on=kind on=count on=place
@h.place std.schema.honours world=pond act=place on=kind on=place
@f1 fish kind=fish world=pond place=middle` + x;
  const plan = (x, t) => { const live = exampleWorld(POND(x)); return planRequest(live, readRequest(live, t, { language, catalog: [language] }), { catalog: [language] }); };
  const amb = plan('', 'move the fish in the corner on the right');
  assert.deepEqual([amb.ok, amb.replies?.[0]?.reply, amb.replies?.[0]?.roles.number], [false, 'refused.which', 2], 'top or bottom: asked');
  const exp = '\n@e k.expect.value of=fish on=place value=bottom_right when.side=right';
  assert.equal(plan(exp, 'move the fish in the corner on the right').steps[0].args.place, 'bottom_right', 'the expectation decides');
  assert.equal(plan(exp, 'draw a fish in the right corner').steps[0].args.place, 'bottom_right');
  assert.equal(plan('', 'draw a fish in the right corner').ok, false, 'never made without its side');
});

test('0.163: a size step of a part continues from the size it has, the kind kept in the mirror (as=part)', { skip: offline }, () => {
  const { tool, s } = face();
  assert.equal(say(s, 'make the eyes bigger'), 'The eyes are big now.');
  assert.equal(say(s, 'bigger'), 'The eyes are huge now.');
  assert.equal(say(s, 'smaller'), 'The eyes are big now.');
  const r = s.say('bigger');
  assert.deepEqual(r.plan.roles.byKind, { eyes: 1 }, 'the plan names the kind, not the type part');
  assert.equal(tool.view().find((x) => x.kind === 'eyes').size, 'huge');
});

test('0.163: "it" after a preset is the whole; a whole-level value goes to the whole, not to the parts the preset added', { skip: offline }, () => {
  const { tool, s } = face();
  assert.match(say(s, 'make a king'), /I added a hat\. The face is a king now\./);
  assert.equal(say(s, 'make it happy'), 'The king is happy now.');
  assert.equal(tool.view()[0].mood, 'happy');
  assert.ok(tool.view().slice(1).every((x) => x.mood === undefined), 'no part got a mood');
  s.say('make everything red'); assert.equal(say(s, 'make it sad'), 'The king is sad now.', 'a value goes to the things that take its key');
});

test('0.163: a kind declared single is there once: put a hat again replaces its variant or says it is there, never asks where', { skip: offline }, () => {
  const { tool, s } = face();
  assert.equal(say(s, 'put a hat'), 'I added a hat.');
  assert.equal(say(s, 'put a hat'), 'Nothing changed. The hat is already there.');
  assert.equal(say(s, 'put a cap'), 'The hat is cap now.');
  assert.equal(say(s, 'put a crown'), 'The hat is crown now.');
  assert.equal(say(s, 'put a crown'), 'Nothing changed. The hat is already crown.');
  assert.equal(tool.view().filter((x) => x.kind === 'hat').length, 1);
  assert.equal(say(s, 'put on glasses'), 'I added glasses.');
  assert.equal(say(s, 'put glasses'), 'Nothing changed. The glasses are already there.');
  assert.equal(tool.view().find((x) => x.kind === 'glasses').variant, null, 'the hat\'s variant is not carried to the glasses');
});

test('0.163: the next / previous of a noun phrase alone steps the variant of the part', { skip: offline }, () => {
  const { tool, s } = face();
  assert.equal(say(s, 'the next mouth'), 'The mouth is grin now.');
  assert.equal(say(s, 'next mouth'), 'The mouth is pout now.');
  assert.equal(say(s, 'previous mouth'), 'The mouth is grin now.');
  assert.equal(say(s, 'the next eyes'), 'The eyes are sleepy now.');
  s.say('put a hat'); assert.equal(say(s, 'the next hat'), 'The hat is cap now.');
});

test('0.163: reset gives each thing its own declared defaults; with none declared it says so instead of asking to what value', { skip: offline }, () => {
  const { tool, s } = face();
  s.say('make it angry'); s.say('make the eyes huge'); s.say('make the nose red');
  assert.equal(say(s, 'reset everything'), 'The face is calm now. The eyes are default now.');
  assert.deepEqual(tool.view().map((x) => [x.id, x.mood, x.size]), [['face', 'calm', undefined], ['mouth', undefined, 'default'], ['eyes', undefined, 'default'], ['nose', undefined, 'default']], 'no thing got another thing\'s default');
  assert.equal(say(s, 'reset the face'), 'Nothing changed. The face is already calm.');
  const shelf = session(SHELF, shelfTool).s; shelf.say('add a novel');
  assert.equal(say(shelf, 'reset the novel'), 'Nothing changed. The novel has no default to go back to.');
});

test('0.163: a variant said with a size is chosen at that size (a smile, big); a value already there says why nothing changed', { skip: offline }, () => {
  const { tool, s } = face();
  s.say('a grin');
  assert.match(say(s, 'big smile'), /The mouth is smile now\. The mouth is big now\./);
  assert.deepEqual(tool.view().find((x) => x.kind === 'mouth'), { id: 'mouth', kind: 'mouth', variant: 'smile', size: 'big' });
  assert.match(say(s, 'big smile'), /^Nothing changed\. The mouth is already big smile\./);
  assert.equal(say(s, 'make the eyes green'), 'The eyes are green now.');
  assert.equal(say(s, 'make the eyes green'), 'Nothing changed. The eyes are already green.');
  s.say('make the eyes huge');
  assert.equal(say(s, 'make the eyes bigger'), 'Nothing changed. The eyes are already huge.');
  const shelf = session(SHELF, shelfTool).s; shelf.say('add a novel'); shelf.say('paint the novel blue');
  assert.equal(say(shelf, 'paint the novel blue'), 'Nothing changed. The novel is already blue.');
});
