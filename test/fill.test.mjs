// std.fill (Round 19, Q25 → a): a value for each key a request left out, from offers in
// named tiers (user, focus, scene, knowledge, default), chosen per key, with the source.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';
import { matrix, KEYS } from '../examples/fill.mjs';

const make = (extra = '') => { const w = new World(); w.load(matrix + extra); return w; };
const valuesOf = (w, id) => {
  const req = w.get(id), out = {};
  for (const k of KEYS) {
    if (req.attrs[k]) { out[k] = `${req.attrs[k][0]}/told`; continue; }
    const n = w.ofType('std.fill.need').find((x) => x.attrs.for[0] === '$' + id && x.attrs.key[0] === k);
    out[k] = n?.attrs.value ? `${n.attrs.value[0]}/${n.attrs.tier[0]}` : null;
  }
  return out;
};

test('std.fill: three keys delegated at once, each filled from its best tier, with the source', () => {
  const w = make();
  w.tell('@u1 know.usual thing=cup key=place value=table  @u2 know.usual thing=cup key=colour value=white');
  assert.ok(w.tell('@q1 draw.request thing=cup').ok);
  assert.deepEqual(valuesOf(w, 'q1'), { place: 'table/knowledge', size: 'medium/default', colour: 'white/knowledge' });
  const need = w.ofType('std.fill.need').find((n) => n.attrs.key[0] === 'place');
  assert.deepEqual([need.attrs.source, w.query({ about: need.id, seek: 'value' }).via], [['know'], ['std.fill.choose']]);
  // a key the user told needs nothing
  w.tell('@q2 draw.request thing=cup colour=green');
  assert.deepEqual(valuesOf(w, 'q2'), { place: 'table/knowledge', size: 'medium/default', colour: 'green/told' });
  assert.equal(w.ofType('std.fill.need').filter((n) => n.attrs.for[0] === '$q2').length, 2);
  assert.deepEqual(w.ofType('core.issue'), []);
});

test('std.fill: a better tier coming later takes over, per key; when it goes, the next one is back', () => {
  const w = make();
  w.tell('@u1 know.usual thing=cup key=place value=table  @q1 draw.request thing=cup');
  for (const [fact, place, colour] of [
    ['@s1 scene.has thing=cup key=place value=tray', 'tray/scene', 'black/default'],
    ['@f1 talk.focus thing=cup key=place value=shelf', 'shelf/focus', 'black/default'],
    ['@p1 user.said key=colour value=red', 'shelf/focus', 'red/user'],
    ['@p2 user.said key=place value=floor', 'floor/user', 'red/user'],
  ]) {
    const r = w.tell(fact);
    assert.deepEqual([r.ok, valuesOf(w, 'q1').place, valuesOf(w, 'q1').colour], [true, place, colour], fact);
  }
  for (const [id, place] of [['p2', 'shelf/focus'], ['f1', 'tray/scene'], ['s1', 'table/knowledge'], ['u1', 'centre/default']]) {
    w.retract(id);
    assert.equal(valuesOf(w, 'q1').place, place, `without ${id}`);
  }
});

test('std.fill: two offers of the best tier are advice and nothing is chosen, until one goes or a better tier comes', () => {
  const w = make();
  w.tell('@u1 know.usual thing=cup key=place value=table  @q1 draw.request thing=cup');
  // the second offer of the same tier comes later: no conflict, the choice is taken back
  const r = w.tell('@u2 know.usual thing=cup key=place value=cupboard');
  assert.deepEqual([r.ok, valuesOf(w, 'q1').place], [true, null]);
  assert.deepEqual(w.ofType('core.issue').map((i) => JSON.parse(i.attrs.why[0])), ['2 offers of the best tier for place of $q1']);
  w.tell('@f1 talk.focus thing=cup key=place value=shelf');
  assert.deepEqual([valuesOf(w, 'q1').place, w.ofType('core.issue').length], ['shelf/focus', 0]);
  w.retract('f1');
  w.retract('u2');
  assert.deepEqual([valuesOf(w, 'q1').place, w.ofType('core.issue').length], ['table/knowledge', 0]);
});

test('std.fill: a host adds a tier with one wire; an offer of an unknown tier is never chosen', () => {
  const w = make(String.raw`
@t.rule std.fill.tier name=rule rank=0
@law draw.law key=?k value=?v
@o.law std.fill.offer for=$n value=?v tier=rule source=law
@r.law core.rule when=$q when=$n when=$law then=$o.law
@odd draw.odd key=?k value=?v
@o.odd std.fill.offer for=$n value=?v tier=whim source=odd
@r.odd core.rule when=$q when=$n when=$odd then=$o.odd
`);
  w.tell('@p1 user.said key=size value=big  @l1 draw.law key=size value=tiny  @x1 draw.odd key=colour value=pink');
  w.tell('@q1 draw.request thing=kite');
  assert.deepEqual(valuesOf(w, 'q1'), { place: 'centre/default', size: 'tiny/rule', colour: 'black/default' });
});

test('std.fill: the tiers are declared once in the module, best first', () => {
  const w = make();
  assert.deepEqual(w.ofType('std.fill.tier').map((t) => [t.attrs.name[0], t.attrs.rank[0]]),
    [['user', '1'], ['focus', '2'], ['scene', '3'], ['taught', '3.5'], ['knowledge', '4'], ['default', '5']]);
});
