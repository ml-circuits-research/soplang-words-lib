// std.plan (Round 29) on the published k.procedures, read in place at the knowledge repository's
// commit in repos.pin. The expected act lists are those of that repository's
// tests/k.procedures.test.mjs (its reference reader is to be replaced by this planner).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planner, factStore, PlanLive } from '../tools/lib-under-test.mjs';
import { publishedWorlds } from '../tools/worlds.mjs';

const worlds = publishedWorlds();
const skip = !worlds && 'the knowledge repository cannot be read here';
const store = worlds ? factStore(worlds) : null;
const KIND_KEYS = ['is_a', 'kind_of', 'is', 'age'];
const chain = [{ type: 'k.people.kind', keys: [...KIND_KEYS, 'drawing'] }, { type: 'k.people.role', keys: [...KIND_KEYS, 'drawing'] }, { type: 'k.commonsense.thing', keys: KIND_KEYS }, { type: 'k.shapes.shape', keys: KIND_KEYS }];
const P = store ? planner(store, { chain }) : null;
const thing = (id, kind) => ({ id, kind });
const Live = (o = {}) => new PlanLive({ store, ...o });
const expect = (goal, live, method, lines) => {
  const r = P.plan(goal, live);
  assert.equal(r.method, method, JSON.stringify(r.tried ?? r.asks));
  assert.deepEqual(r.lines, lines);
  for (const e of r.effects) assert.ok(e.ok, `effect ${e.method}: ${e.fact} ${e.thing}`);
  return r;
};

test('plan: a person on a swing; an existing swing; a man on a bench; a cup on a table', { skip }, () => {
  expect({ act: 'make', roles: { kind: 'person', place: { value: 'swing', rel: 'on' } } }, Live(), 'make a thing on the anchor of another', ['make kind=swing', 'make kind=person', 'place thing=person1 place=seat of=swing1 rel=on']);
  expect({ act: 'make', roles: { kind: 'girl', place: { value: 'swing', rel: 'on' } } }, Live({ things: [thing('swing1', 'swing')] }), 'make a thing on the anchor of another', ['make kind=girl', 'place thing=girl1 place=seat of=swing1 rel=on']);
  expect({ act: 'place', roles: { thing: 'man1', place: { value: 'bench', rel: 'on' } } }, Live({ things: [thing('man1', 'man')] }), 'put a thing on the anchor of another', ['make kind=bench', 'place thing=man1 place=seat of=bench1 rel=on']);
  expect({ act: 'make', roles: { kind: 'cup', place: { value: 'table1', rel: 'on' } } }, Live({ things: [thing('table1', 'table')] }), 'make a thing on the anchor of another', ['make kind=cup', 'place thing=cup1 place=surface of=table1 rel=on']);
});

test('plan: a family photo by precondition; set a table in a picture and in w.seating', { skip }, () => {
  expect({ act: 'make', roles: { kind: 'family photo' } }, Live(), 'a family photo of a new family', ['make kind=man', 'make kind=woman', 'make kind=boy', 'make kind=girl', 'make kind=dog', 'group thing=man1,woman1,boy1,girl1,dog1 group=family photo',
    'place thing=man1 place=back_row of=group1 rel=in', 'place thing=woman1 place=back_row of=group1 rel=in', 'place thing=boy1 place=front_row of=group1 rel=in', 'place thing=girl1 place=front_row of=group1 rel=in', 'place thing=dog1 place=pet of=group1 rel=in']);
  const r = expect({ act: 'make', roles: { kind: 'family photo' } }, Live({ things: [thing('grandmother1', 'grandmother'), thing('boy1', 'boy'), thing('tree1', 'tree')] }), 'a family photo of the people there',
    ['group thing=grandmother1,boy1 group=family photo', 'place thing=grandmother1 place=back_row of=group1 rel=in', 'place thing=boy1 place=front_row of=group1 rel=in']);
  assert.deepEqual(r.methods, ['a family photo of the people there', 'arrange in a layout']);
  expect({ act: 'make', roles: { kind: 'table setting', number: 4 } }, Live(), 'set a table', ['make kind=table', 'make kind=chair number=4 place=table1 rel=around', 'make kind=plate number=4 place=surface of=table1 rel=on', 'make kind=cup number=4 place=surface of=table1 rel=on']);
  expect({ act: 'make', roles: { kind: 'table setting', number: 4 } }, Live({ world: 'w.seating' }), 'set a table in a seating plan', ['make kind=w.seating.table name=table seats=4',
    'make kind=w.seating.seat table=table1 n=1', 'make kind=w.seating.seat table=table1 n=2', 'make kind=w.seating.seat table=table1 n=3', 'make kind=w.seating.seat table=table1 n=4']);
});

test('plan: take apart; build from parts; a chart and a report; a face of a role; a feeling; the map; asked and refused', { skip }, () => {
  expect({ act: 'take apart', roles: { thing: 'car1' } }, Live({ things: [thing('car1', 'car')] }), 'take apart a drawn thing', ['make kind=window place=left_window of=car1 rel=at', 'make kind=window place=right_window of=car1 rel=at', 'make kind=wheel place=left_wheel of=car1 rel=at', 'make kind=wheel place=right_wheel of=car1 rel=at']);
  const none = P.plan({ act: 'take apart', roles: { thing: 'idea1' } }, Live({ things: [thing('idea1', 'idea')] }));
  assert.ok(none.refused && none.tried.some((t) => t.method === 'take apart a drawn thing'), 'an idea has no parts: refused, with the alternatives tried');
  expect({ act: 'make', roles: { kind: 'house', material: 'parts' } }, Live(), 'build from parts', ['make kind=roof', 'make kind=wall', 'make kind=door', 'make kind=window', 'make kind=chimney', 'connect thing=roof1 target=wall1', 'connect thing=chimney1 target=roof1', 'group thing=roof1,wall1,door1,window1,chimney1 group=house']);
  expect({ act: 'make', roles: { kind: 'chart' } }, Live({ world: 'w.list', things: [thing('tree1', 'tree'), thing('tree2', 'tree'), thing('sun1', 'sun')] }), 'a chart of the things there', ['ask topic=count thing=tree1,tree2,sun1', 'make kind=w.list.list name=chart', 'make kind=w.list.item text=sun quantity=1 list=list1', 'make kind=w.list.item text=tree quantity=2 list=list1']);
  const history = [{ act: 'make', thing: 'tree1' }, { act: 'change', thing: 'tree1' }, { act: 'remove', thing: 'sun1' }];
  expect({ act: 'make', roles: { kind: 'report' } }, Live({ world: 'w.timeline', history }), 'a report on a timeline', ['make kind=w.timeline.timeline name=report', 'make kind=w.timeline.event title=make about=tree1 at=1 timeline=timeline1', 'make kind=w.timeline.event title=change about=tree1 at=2 timeline=timeline1', 'make kind=w.timeline.event title=remove about=sun1 at=3 timeline=timeline1']);
  expect({ act: 'make', roles: { kind: 'pirate' } }, Live({ world: 'w.face' }), 'a face of a role', ['make kind=w.face.face', 'make kind=w.face.hat variant=pirate hat face=face1', 'make kind=w.face.beard variant=full face=face1', 'make kind=w.face.moustache variant=handlebar face=face1']);
  expect({ act: 'change', roles: { thing: 'face1', value: 'hurt' } }, Live({ world: 'w.face', things: [thing('face1', 'face')] }), 'show a feeling on a face', ['change thing=face1 attribute=expression value=sad', 'change thing=cheeks of=face1 attribute=variant value=tear']);
  expect({ act: 'ask', roles: { thing: 'Peru' } }, Live({ world: 'w.map' }), 'show a country on the map', ['make kind=w.map.place name=Peru sort=country highlight=true', 'change thing=view attribute=centre value=Peru']);
  assert.ok(P.plan({ act: 'ask', roles: { thing: 'Peru' } }, Live()).refused, 'only in a map');
  assert.deepEqual(P.plan({ act: 'group', roles: { group: 'row' } }, Live()).asks, ['thing'], 'a needed role missing is asked');
});

test('plan: each step explains itself in one short line; requests for std.acts', { skip }, () => {
  const r = P.plan({ act: 'make', roles: { kind: 'person', place: { value: 'swing', rel: 'on' } } }, Live());
  assert.ok(r.explain.every((x, i) => x.startsWith('make a thing on the anchor of another') && x.endsWith(`: ${r.lines[i]}`)), 'one short line per step: the method (and what the step is for), then the act');
  assert.deepEqual(r.requests[0], { action: 'make', args: { kind: 'swing' } });
  assert.deepEqual(r.requests[2], { action: 'place', args: { thing: 'person1', place: 'seat', of: 'swing1', rel: 'on' } });
});

// offline: a toy method in the same format, in an invented picture world
test('plan: a toy method, offline — make the anchor first when there is none, then place on it', () => {
  const procedures = `@m k.procedures.method name="sit on" about="a person sitting on a seat" act=make
@g1 k.procedures.goal method="sit on" role=kind kind=person
@g2 k.procedures.goal method="sit on" role=place from=k.toy.anchor by=of
@b1 k.procedures.binding method="sit on" name=what goal=kind
@b2 k.procedures.binding method="sit on" name=on goal=place
@b3 k.procedures.binding method="sit on" name=there live=any
@x3 k.procedures.match method="sit on" binding=there key=kind equals=on
@b4 k.procedures.binding method="sit on" name=anchor from=k.toy.anchor
@x4 k.procedures.match method="sit on" binding=anchor key=of equals=on
@b5 k.procedures.binding method="sit on" name=made step=1
@b6 k.procedures.binding method="sit on" name=seat together=there together=made
@b7 k.procedures.binding method="sit on" name=person step=2
@c1 k.procedures.condition method="sit on" n=1 when=before step=1 fact=absent thing=there
@s1 k.procedures.step method="sit on" n=1 act=make
@a1 k.procedures.arg method="sit on" step=1 role=kind binding=on
@s2 k.procedures.step method="sit on" n=2 act=make after=1
@a2 k.procedures.arg method="sit on" step=2 role=kind binding=what
@s3 k.procedures.step method="sit on" n=3 act=place after=2
@a3 k.procedures.arg method="sit on" step=3 role=thing binding=person
@a4 k.procedures.arg method="sit on" step=3 role=place binding=anchor key=name of=seat rel=on`;
  const ids = { method: ['name'], goal: ['method', 'role'], binding: ['method', 'name'], match: ['method', 'binding', 'key'], step: ['method', 'n'], arg: ['method', 'step', 'role'], condition: ['method', 'n'] };
  const schema = Object.entries(ids).flatMap(([t, keys]) => keys.map((k, i) => `@${t}${i} core.slot of=k.procedures.${t} key=${k} id=true`)).join('\n');
  const store = factStore([{ id: 'k.procedures', schemaText: schema, shards: [{ text: procedures }] }, { id: 'k.toy', schemaText: '@s core.slot of=k.toy.anchor key=name id=true', shards: [{ text: '@a k.toy.anchor name=seat of=swing' }] }, { id: 'k.actions', schemaText: '', shards: [] }]);
  const P = planner(store, { chain: [] });
  const r = P.plan({ act: 'make', roles: { kind: 'person', place: { value: 'swing', rel: 'on' } } }, new PlanLive({ store }));
  assert.deepEqual([r.method, r.lines], ['sit on', ['make kind=swing', 'make kind=person', 'place thing=person1 place=seat of=swing1 rel=on']]);
  const again = P.plan({ act: 'make', roles: { kind: 'person', place: { value: 'swing', rel: 'on' } } }, new PlanLive({ store, things: [{ id: 'swing7', kind: 'swing' }] }));
  assert.deepEqual(again.lines, ['make kind=person', 'place thing=person1 place=seat of=swing7 rel=on'], 'an existing swing is used: the precondition skips step 1');
});
