// ACTS × SCHEMAS (Round 20): worlds declared as data (std.schema), driven by the same acts
// (std.acts); refusals say what is allowed and where; every act gives its difference.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { seating, face } from '../examples/acts.mjs';

const make = (...schemas) => { const w = new World(); w.load(['@acts core.use world=std.acts', ...schemas].join('\n')); return w; };
const act = (w, action, args) => w.act({ action, args });

test('acts: a seating plan and a face, driven by the same acts, with no rule of their own', () => {
  const w = make(seating, face);
  assert.deepEqual(act(w, 'make', { kind: 'table', name: 'family' }).result, { act: 'make', thing: 'table1' });
  assert.deepEqual(w.get('table1').attrs, { kind: ['table'], world: ['seating'], shape: ['round'], name: ['family'] }, 'defaults from the slots');
  act(w, 'make', { kind: 'seat', table: '$table1' });
  assert.equal(act(w, 'change', { thing: 'seat', attr: 'colour', value: 'red' }).ok, true);
  assert.deepEqual(w.get('seat1').attrs.colour, ['red']);
  act(w, 'make', { kind: 'eye', side: 'left' });
  const dEye = act(w, 'make', { kind: 'eye', side: 'right' }).diff;
  assert.deepEqual([dEye.added.map((a) => [a.type, a.tier]), dEye.removed.length], [[['eye', 'told'], ['std.schema.count', 'derived']], 1], 'what rules derived from it (the count under the limit) is in the difference too');
  assert.deepEqual(act(w, 'change', { thing: 'eye', nth: 2, attr: 'size', by: 'less' }).result.value, '4');
  assert.equal(act(w, 'change', { thing: 'eye1', attr: 'colour', value: 'purple' }).violations[0].kind, 'domain', 'the slot still checks');
  // the same act in both worlds: no world-specific code, one difference shape
  const d1 = act(w, 'make', { kind: 'glasses' }).diff, d2 = act(w, 'make', { kind: 'guest', name: 'Ana' }).diff;
  const told = (d) => d.added.filter((a) => a.tier === 'told').map((a) => a.type);
  assert.deepEqual([told(d1), told(d2)], [['glasses'], ['guest']]);
  const d3 = act(w, 'change', { thing: 'guest', attr: 'name', value: 'Bo' }).diff;
  assert.deepEqual(d3.changed, [{ id: 'guest1', key: 'name', from: 'Ana', to: 'Bo', toTier: 'told' }]);
  assert.deepEqual(w.why('guest1', 'name').steps[0], { id: 'guest1', key: 'name', value: 'Bo', tier: 'told', how: 'action', action: 'change' });
  w.undo();
  assert.deepEqual(w.get('guest1').attrs.name, ['Ana'], 'an act is one undo step');
});

test('acts: a refusal names what the kind allows, its attributes, and where the act or attribute is', () => {
  const w = make(seating, face);
  act(w, 'make', { kind: 'seat' });
  let v = act(w, 'change', { thing: 'seat', attr: 'size', value: 3 }).violations[0];
  assert.deepEqual([v.why, v.reason.attrs, v.reason.hasIt], ['a seat has no size', ['table', 'colour'], ['face:eye']]);
  v = act(w, 'remove', { thing: 'mouth' }).violations[0];
  assert.deepEqual([v.why, v.reason.allowed], ['there is no mouth', ['change', 'ask']]);
  act(w, 'make', { kind: 'eye' }); act(w, 'make', { kind: 'eye' });
  assert.equal(act(w, 'make', { kind: 'eye' }).violations[0].why, 'at most 2 eye', 'a limit, by rules');
  v = act(w, 'remove', { thing: 'eye' }).violations[0];
  assert.deepEqual([v.why, v.reason.which], ['which eye? there are 2', ['eye1', 'eye2']]);
  v = act(w, 'connect', { a: 'eye1', b: 'eye2' }).violations[0];
  assert.deepEqual([v.why, v.reason.elsewhere], ['a eye cannot be connected here', ['seating']]);
  assert.equal(act(w, 'make', { kind: 'hat' }).violations[0].why, 'no world here has a hat');
});

test('acts: a third schema with zero rules; links go with what they link; one sentence, one undo', () => {
  const playlist = String.raw`
@playlist std.schema.world name=playlist
@t.song core.type of=song extends=std.schema.thing closed=true
@s.song.title core.slot of=song key=title required=true
@s.song.mood core.slot of=song key=mood enum=calm enum=loud default=calm
@k.song std.schema.kind of=song world=playlist acts=make acts=remove acts=change acts=connect acts=group acts=pick acts=copy`;
  const w = make(playlist);
  assert.equal(w.matrix.size > 0 && [...w.matrix.values()].filter((x) => x.type === 'core.rule' && !x.module).length, 0, 'no rule of its own');
  const r = w.act([{ action: 'make', args: { kind: 'song', title: 'One' } }, { action: 'make', args: { kind: 'song', title: 'Two', mood: 'loud' } }]);
  assert.equal(r.ok, true);
  assert.deepEqual(act(w, 'pick', { kind: 'song', mood: 'loud' }).result.things, ['song2']);
  act(w, 'connect', { a: 'song1', b: 'song2', rel: 'then' });
  act(w, 'group', { things: ['song1', 'song2'], name: 'mix' });
  assert.deepEqual(w.get('mix').attrs.member, ['$song1', '$song2']);
  act(w, 'copy', { thing: 'song1' });
  assert.deepEqual(w.get('song3').attrs.title, ['One']);
  act(w, 'remove', { thing: 'song2' });
  assert.equal(w.ofType('std.acts.link').length, 0, 'its link went with it');
  const bad = w.act([{ action: 'make', args: { kind: 'song', title: 'Three' } }, { action: 'change', args: { thing: 'song1', attr: 'tempo', value: 3 } }]);
  assert.deepEqual([bad.ok, w.has('song4')], [false, false], 'all or nothing');
});

test('acts: a world that takes any kind a knowledge type names; schema mistakes refused at load', () => {
  const w = make(String.raw`
@draw std.schema.world name=draw
@k.any std.schema.kinds world=draw from=k.object acts=make acts=change acts=remove`);
  w.tell('@o1 k.object name=cup  @o2 k.object name=boat');
  assert.deepEqual(act(w, 'make', { kind: 'cup', colour: 'red' }).result, { act: 'make', thing: 'cup1' });
  assert.deepEqual([w.get('cup1').type, w.get('cup1').attrs.colour], ['std.schema.thing', ['red']]);
  assert.equal(act(w, 'change', { thing: 'cup', attr: 'size', value: 'big' }).ok, true, 'an open kind takes any attribute');
  assert.equal(act(w, 'make', { kind: 'unicorn' }).violations[0].why, 'no world here has a unicorn');
  const bad = new World();
  assert.throws(() => bad.load('@a core.use world=std.acts\n@k std.schema.kind of=x world=nowhere acts=make'), /no world named nowhere/);
  assert.throws(() => new World().load('@a core.use world=std.acts\n@w std.schema.world name=y\n@k std.schema.kind of=x world=y acts=fly'), /fly/);
});
