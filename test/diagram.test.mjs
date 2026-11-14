// Diagrams composed from knowledge (reviewer 04:40, 05:45): a kind × a topic whose knowledge has the
// kind's structure, as w.diagram wires laid out by arrange. An invented toy world first, then the
// published k.diagrams with the knowledge it names.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, composeDiagram, sampleDiagram, diagramTopics, diagramKinds, arrangementOf } from '../tools/lib-under-test.mjs';
import { worldsDir, catalogWorld } from '../tools/worlds.mjs';

test('composeDiagram on a toy world: a cycle from next= facts, a tree of kinds; no placeholder when nothing fits', () => {
  const w = new World();
  w.tell(`@kc k.diagrams.kind name=cycle form=cycle layout=circular edges=directed role=stage
@kt k.diagrams.kind name=tree form=tree layout=top_down edges=undirected role=root role=item
@fc k.diagrams.fill kind=cycle type=ex.stage key=next gives=edges topic=cycle
@ft k.diagrams.fill kind=tree type=ex.sort key=is_a gives=edges topic=is_a
@sh k.diagrams.shape kind=cycle role=stage shape=circle
@s1 ex.stage name=egg cycle=moth next=larva  @s2 ex.stage name=larva cycle=moth next=pupa  @s3 ex.stage name=pupa cycle=moth next=adult  @s4 ex.stage name=adult cycle=moth next=egg
@t1 ex.sort name=fruit is_a=food  @t2 ex.sort name=apple is_a=fruit  @t3 ex.sort name=pear is_a=fruit  @t4 ex.sort name=bread is_a=food`);
  const c = composeDiagram(w, { kind: 'cycle', topic: 'moth' });
  assert.deepEqual(c.nodes.map((n) => n.label), ['egg', 'larva', 'pupa', 'adult']);
  assert.deepEqual(c.edges.map((e) => [e.from, e.to]), [['d1.n1', 'd1.n2'], ['d1.n2', 'd1.n3'], ['d1.n3', 'd1.n4'], ['d1.n4', 'd1.n1']], 'next= points on, and the cycle comes round');
  assert.equal(c.nodes[0].shape, 'circle');
  assert.equal(c.layout, 'circular');
  const t = composeDiagram(w, { kind: 'tree', topic: 'food' });
  assert.deepEqual(t.nodes.map((n) => [n.label, n.role]), [['food', 'root'], ['fruit', 'item'], ['bread', 'item'], ['apple', 'item'], ['pear', 'item']]);
  assert.ok(t.nodes[0].y < t.nodes[3].y, 'top down: the root above the leaves');
  assert.match(t.text, /@d1\.n4 w\.diagram\.node label=apple diagram=\$d1 role=item n=4 x=[\d.]+ y=[\d.]+ parent=\$d1\.n2/);
  assert.match(composeDiagram(w, { kind: 'cycle', topic: 'tea' }).why, /no knowledge of the structure of a cycle about tea/);
  assert.match(composeDiagram(w, { kind: 'spiral', topic: 'moth' }).why, /no diagram kind/);
  assert.deepEqual(diagramTopics(w, 'tree').map((x) => x.topic), ['food', 'fruit']);
  assert.equal(diagramKinds(w).length, 2);
  const s = sampleDiagram(w, { seed: 3 });
  assert.ok(!s.why && s.nodes.length >= 3, 'a random diagram is a kind × a topic from the world');
});

test('composeDiagram over the published k.diagrams: cycle of seasons, mind map of bee, Venn of animal, network of France', { skip: !worldsDir() && 'offline' }, async () => {
  const w = await catalogWorld({ 'k.diagrams': ['k.diagrams.kind', 'k.diagrams.fill', 'k.diagrams.shape'], 'k.time': ['k.time.season'], 'k.parts': ['k.parts.usual'], 'k.kinds': ['k.kinds.parent'], 'k.geo': ['k.geo.country'], 'w.lang.en': ['w.lang.en.arrangement'], 'w.diagram': [] });
  assert.deepEqual(composeDiagram(w, { kind: 'cycle', topic: 'seasons' }).nodes.map((n) => n.label), ['spring', 'summer', 'autumn', 'winter']);
  const m = composeDiagram(w, { kind: 'mind map', topic: 'bee' });
  assert.equal(m.nodes[0].role, 'centre');
  assert.ok(m.nodes.some((n) => n.label === 'wing' && n.role === 'branch'));
  const v = composeDiagram(w, { kind: 'Venn diagram', topic: 'animal' });
  assert.ok(v.groups.length >= 2 && v.groups.every((g) => g.members.length));
  const n = composeDiagram(w, { kind: 'network', topic: 'France', into: w });
  assert.ok(n.told.ok, JSON.stringify(n.told.violations));
  assert.ok(n.nodes.some((x) => x.label === 'Spain'));
  const a = arrangementOf(w, 'put the seasons in a circle');
  assert.deepEqual([a.as, a.diagramLayout], ['circle', 'circular']);
  assert.equal(arrangementOf(w, 'from right to left').reverse, true);
  assert.equal(arrangementOf(w, 'make it red'), null);
});
