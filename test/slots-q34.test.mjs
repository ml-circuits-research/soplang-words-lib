// The knowledge repository's three questions (its Q34, reviewer 02:00): slot groups,
// a rule over two keys, joins by a key to a world that may not be loaded.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

test('slot groups: more extends= are mixins; their slots and patterns apply', () => {
  const w = new World();
  assert.ok(w.load(`@box core.type of=box  @bw core.slot of=box key=w kind=number
@named core.type of=named  @nn core.slot of=named key=name required=true
@card core.type of=card extends=box extends=named closed=true`).ok);
  assert.equal(w.tell('@c1 card w=wide name=x').violations[0].why, 'must be number', 'a slot of the first parent');
  assert.ok(w.tell('@c2 card w=3 name=a').ok);
  assert.deepEqual(w.open().filter((o) => o.id === 'c3'), []);
  w.tell('@c3 card w=4');
  assert.deepEqual(w.open().filter((o) => o.id === 'c3').map((o) => o.key), ['name'], 'a required slot of the mixin is asked');
  assert.deepEqual(w.ofType('named').map((x) => x.id).sort(), ['c2', 'c3'], 'a card is a named');
});

test('excludes: never the exact value and the approximate one together', () => {
  const w = new World();
  w.load('@x core.slot of=pic key=x kind=number  @xa core.slot of=pic key=x_about kind=number excludes=x');
  assert.ok(w.tell('@p1 pic x=3').ok);
  assert.ok(w.tell('@p2 pic x_about=3').ok);
  const r = w.tell('@p3 pic x=3 x_about=4');
  assert.deepEqual([r.violations[0].kind, r.violations[0].why], ['excludes', 'has x and x_about together']);
});

test('by: a join by a key to another world, open until a world declares the type', () => {
  const w = new World();
  w.load('@d core.slot of=pic key=drawing type=k.objects.object by=name');
  assert.ok(w.tell('@p1 pic drawing=unicorn').ok, 'the objects world is not loaded: open');
  const objects = '@o core.type of=k.objects.object  @on core.slot of=k.objects.object key=name  @h k.objects.object name=horse';
  const late = w.tell(objects);
  assert.deepEqual([late.ok, late.violations[0].id], [false, 'p1'], 'loading the world checks the joins made before it');
  assert.ok(w.tell(objects + '  @u k.objects.object name=unicorn').ok);
  assert.ok(w.tell('@p2 pic drawing=horse').ok);
  assert.equal(w.tell('@p3 pic drawing=pegasus').violations[0].why, 'must be the name of a k.objects.object wire');
});
