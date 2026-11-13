// Delegation between modules with existing constructs (Round 18): needs (a request with an
// absent key), offers from other modules, a declared order, the source recorded, ties reported.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { library } from '../examples/delegation.mjs';

const make = (lib = library) => { const w = new World({ library: lib }); assert.ok(w.tell('@app core.module name=app imports=draw imports=talk imports=know').ok); return w; };
const placeOf = (w, id) => { const a = w.get(id).attrs; return a.use_place ? [a.use_place[0], a.place_source[0]] : null; };

test('delegation: the declared order of fillers (user, dialogue, knowledge, own default) and the source of the value', () => {
  const w = make();
  w.tell('@u1 know.usual thing=cup place=table');
  w.tell('@q1 draw.request thing=cup  @q2 draw.request thing=cup place=sky  @q3 draw.request thing=kite');
  assert.deepEqual([placeOf(w, 'q1'), placeOf(w, 'q2'), placeOf(w, 'q3')], [['table', 'know'], ['sky', 'user'], ['centre', 'draw']]);
  // the dialogue (rank 2) comes in: it takes over from knowledge (rank 4)
  assert.ok(w.tell('@f1 talk.focus thing=cup place=shelf').ok);
  assert.deepEqual(placeOf(w, 'q1'), ['shelf', 'talk']);
  // and goes: knowledge again
  w.retract('f1');
  assert.deepEqual(placeOf(w, 'q1'), ['table', 'know']);
  // the rule that filled it is named, for a reply that says where the value came from
  assert.deepEqual(w.query({ about: 'q1', seek: 'use_place' }).via, ['draw.choose']);
});

test('delegation: no offer leaves the need open; two offers at the same rank are reported, not picked', () => {
  const bare = make({ ...library, draw: library.draw.split('\n').filter((l) => !/^@draw\.(own|default|gap) /.test(l)).join('\n') });
  bare.tell('@q1 draw.request thing=kite');
  assert.deepEqual([placeOf(bare, 'q1'), bare.ofType('draw.offer').length], [null, 0]);
  const w = make();
  w.tell('@u1 know.usual thing=cup place=table  @u2 know.usual thing=cup place=cupboard');
  const r = w.tell('@q1 draw.request thing=cup');
  assert.deepEqual([r.ok, placeOf(w, 'q1')], [true, null]);
  assert.deepEqual(w.ofType('core.issue').map((i) => i.attrs.why[0]), ['"2 offers at the same rank for $q1"']);
});

// Found while writing the example: choosing by core.rank instead of aggregates. When a better
// offer arrives, re-ranking the offers gives a `conflict` on in_line (an old place in line is
// not taken back). Kept as a todo with its repro for the reviewer.
const RANKED = `${library.draw.slice(0, library.draw.indexOf('# the best rank offered'))}
${String.raw`# the place of each offer in line for its request (1 = the best rank; equal ranks share it)
@draw.o draw.offer for=?req rank=?r
@draw.best core.rank of=$draw.o by=rank within=?req out=?pos
@draw.ob draw.offer core.on=$draw.o in_line=?pos
@draw.ranked core.rule when=$draw.o with=$draw.best then=$draw.ob

# how many offers are first in line, per request
@draw.f1 draw.offer for=?req in_line=1
@draw.count core.aggregate over=$draw.f1 by=?req count=?n then=$draw.fs
@draw.fs draw.firsts req=?req n=?n

# take the first offer when it is the only one first in line
@draw.req draw.request thing=?t core.absent=place
@draw.first draw.offer for=$draw.req value=?v source=?s in_line=1
@draw.alone draw.firsts req=$draw.req n=1
@draw.take draw.request core.on=$draw.req use_place=?v place_source=?s
@draw.choose core.rule when=$draw.req when=$draw.first when=$draw.alone then=$draw.take

`}
@draw.k.req core.slot of=draw.firsts key=req id=true`;
test('delegation with core.rank: a better offer re-ranks the others without a conflict', { todo: 'core.rank leaves an old in_line behind here' }, () => {
  const w = new World({ library: { ...library, draw: RANKED } });
  assert.ok(w.tell('@app core.module name=app imports=draw imports=talk imports=know').ok);
  w.tell('@u1 know.usual thing=cup place=table');
  w.tell('@q1 draw.request thing=cup');
  assert.equal(w.tell('@f1 talk.focus thing=cup place=shelf').ok, true);
});
