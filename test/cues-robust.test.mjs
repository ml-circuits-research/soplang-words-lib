// 0.158 (psys2 re-pin to the catalog at 7042ea70): readRequest never throws on a cue of the catalog; an attribute cue
// that takes a number (and a unit) is read ("rotate the X by 30 degrees"); "what is in / on" + the world's own whole
// noun asks about the whole view. Properties over the example worlds and every cue of the catalog's w.lang.en shards.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readRequest, toolSession } from '../tools/lib-under-test.mjs';
import { worldsDir } from '../tools/worlds.mjs';
import { SHELF, NECKLACE, shelfTool, necklaceTool, exampleWorld, toolLanguage } from '../examples/tool-app.mjs';
import { SKETCH, NOTES, GARDEN, requestLanguage } from '../examples/request-app.mjs';

const offline = !worldsDir() && 'offline';
const language = offline ? null : await requestLanguage();
const ctx = { language, catalog: language ? [language] : [] };
const worlds = [SKETCH, NOTES, GARDEN, SHELF, NECKLACE];
const kindOf = (text) => /std\.schema\.kind of=(\w+)/.exec(text)[1];
const unq = (v) => String(v).replace(/^"|"$/g, '');
const one = (r, k) => (r.attrs?.[k]?.[0] === undefined ? undefined : unq(r.attrs[k][0]));

test('an attribute cue that takes a number and a unit is read: the number is the value, the unit is kept (every example world)', { skip: offline }, () => {
  const cues = language.ofType('w.lang.en.cue').filter((r) => one(r, 'on') === 'attribute' && one(r, 'takes') === 'number');
  assert.ok(cues.some((r) => one(r, 'attribute') === 'rotation'), 'the catalog at 7042ea70 has the rotation cue');
  for (const text of worlds) {
    const w = exampleWorld(text), kind = kindOf(text);
    for (const cue of cues) for (const trail of cue.attrs.trail.map(unq)) {
      const r = readRequest(w, `change the ${kind} by 30 ${trail}`, ctx);
      const c = r.constraints.find((x) => x.on === 'attribute' && x.attribute === one(cue, 'attribute'));
      assert.ok(c, `${kind} / ${trail}: the attribute is read`);
      assert.deepEqual([c.value, c.number, c.unit], [30, 30, one(cue, 'unit')]);
      assert.deepEqual(r.unread, [], 'nothing of the phrase is left unread');
    }
  }
});

test('readRequest does not throw on any cue of the catalog\'s w.lang.en shards, in a template sentence (a request world)', { skip: offline }, () => {
  const cues = language.ofType('w.lang.en.cue');
  assert.ok(cues.length > 50);
  const filler = { number: '3', kind: 'circle', value: 'red', topic: 'bees', range: '2' };
  const words = (r, k) => (r.attrs?.[k] ?? []).map(unq);
  let n = 0;
  for (const text of [SKETCH]) {
    const w = exampleWorld(text), kind = kindOf(text);
    for (const cue of cues) {
      const takes = one(cue, 'takes') ?? 'none', f = filler[takes] ?? '';
      const phrases = [...words(cue, 'lead').slice(0, 2).map((l) => `${l} ${f}`), ...words(cue, 'trail').slice(0, 2).map((t) => `${f} ${t}`), ...words(cue, 'example').slice(0, 1)];
      if (takes === 'range') for (const b of words(cue, 'between')) phrases.push(`between 2 ${b} 4`, `2 ${b} 4`);
      for (const p of phrases.length ? phrases : [one(cue, 'name') ?? '']) for (const s of [`draw a ${kind} ${p}`]) {
        assert.doesNotThrow(() => { const r = readRequest(w, s, ctx); assert.ok(Array.isArray(r.constraints) && Array.isArray(r.unread)); }, s);
        n++;
      }
    }
  }
  assert.ok(n > 200, `${n} sentences read`);
});

test('a cue whose operand cannot be read is no match: its words stay unread, nothing is thrown', () => {
  const w = exampleWorld(SKETCH);
  const lang = exampleWorld('@c w.lang.en.cue name=attribute.odd on=attribute attribute=odd takes=value lead="oddly" priority=3\n@d w.lang.en.cue name=with.odd on=with takes=none lead="plus" priority=3');
  for (const t of ['draw a picture oddly', 'draw a picture plus']) assert.doesNotThrow(() => readRequest(w, t, { language: lang, catalog: [lang] }));
});

test('"what is in / on" + a word of the world\'s own whole asks about the whole view, never counts that word as a kind (every tool world)', { skip: offline }, async () => {
  const lang = await toolLanguage();
  for (const [text, make] of [[SHELF, shelfTool], [NECKLACE, necklaceTool]]) {
    const old = /std\.schema\.world name=(\w+)/.exec(text)[1], name = 'canvasboard'; // a whole noun the catalog does not know as a kind
    const world = `${text.replaceAll(`name=${old}`, `name=${name}`).replaceAll(`world=${old}`, `world=${name}`)}\n@kw std.schema.kind of=picture world=${name} acts=make\n@ww core.word text=picture text=${name} means=picture`;
    for (const noun of ['picture', name]) for (const lead of ['in', 'on']) {
      const tool = make(), s = toolSession(exampleWorld(world), tool, { language: lang, catalog: [lang] });
      s.say(old === 'shelf' ? 'add 2 novels' : 'make a necklace');
      const r = s.say(`what is ${lead} the ${noun}?`);
      assert.ok(r.reply.facts.length > 0 && r.reply.facts.every((f) => f.reply === 'state.count' && f.roles.kind !== 'picture' && f.roles.kind !== name), `${lead} the ${noun}: ${r.reply.text}`);
      assert.match(r.reply.text, /\d/);
    }
  }
});

// ---- kinds declared by join (std.schema.kinds) ------------------------------------------------------------------
import { World, capabilitiesOf, declares, planRequest, nearestAccepted, kindLineage } from '../tools/lib-under-test.mjs';

const JOINED = String.raw`
@acts core.use world=std.acts
@w std.schema.world name=yard doc="an example world that joins a base"
@t.thing core.type of=thing extends=std.schema.thing closed=true
@t.house core.type of=house extends=thing closed=true
@k.house std.schema.kind of=house world=yard acts=make acts=remove
@j std.schema.kinds world=yard from=k.demo.item key=name acts=make acts=remove stand_in=k.demo.alias
@h.make std.schema.honours world=yard act=make on=kind on=count of=thing of=k.demo.item of=k.demo.alias
@h.remove std.schema.honours world=yard act=remove on=kind of=thing of=k.demo.item of=k.demo.alias`;
const BASE = String.raw`
@t.item core.type of=k.demo.item
@t.alias core.type of=k.demo.alias
@i1 k.demo.item name=goat
@i2 k.demo.item name=child drawing=person
@i3 k.demo.item name=swing
@a1 k.demo.alias name=villa drawing=house
@a2 k.demo.alias name=cottage drawing=house`;

test('a world that joins a base declares make and remove for every row of it, with no row per kind; a stand-in is drawn as its base', () => {
  const live = new World(), base = new World();
  assert.ok(base.load(BASE).ok, 'the base');
  assert.ok(live.load(JOINED).ok, 'the world');
  const cap = capabilitiesOf(live, { catalog: [base] });
  for (const k of ['goat', 'child', 'swing', 'villa', 'cottage', 'house']) {
    for (const act of ['make', 'remove']) assert.ok(declares(live, act, k, { catalog: [base] }), `${act} ${k}`);
    assert.ok(cap.kinds.has(k));
  }
  assert.ok(!declares(live, 'make', 'dragon', { catalog: [base] }), 'a kind that is in no row is not declared');
  assert.ok(!declares(live, 'change', 'goat', { catalog: [base] }), 'an act the join does not give');
  assert.ok(!declares(live, 'make', 'goat'), 'without the base the kind is not known');
  assert.deepEqual([cap.joined.get('villa').standIn, cap.joined.get('child').standIn, cap.joined.get('goat').standIn], ['house', 'person', undefined]);
  assert.ok(kindLineage('villa', { live, catalog: [base], drawn: true }).includes('house'), 'drawn as its base');
  const plan = planRequest(live, readRequest(live, 'make a goat', { catalog: [base] }), { catalog: [base] });
  assert.ok(!plan.notHonoured.some((n) => n.code === 'act' || n.on === 'target'), JSON.stringify(plan.notHonoured));
});

test('a tool parameter of type kind with no accepts list takes every declared kind (explicit, joined, stand-in) and refuses the others', () => {
  const live = new World(), base = new World();
  assert.ok(base.load(BASE).ok && live.load(JOINED).ok);
  const param = { type: 'kind', accepts: [] };
  for (const k of ['house', 'goat', 'villa']) assert.deepEqual(nearestAccepted(k, param, { live, catalog: [base] }), { value: k });
  const r = nearestAccepted('dragon', param, { live, catalog: [base] });
  assert.ok(r.refused && r.values.includes('goat') && r.values.includes('house'));
});
