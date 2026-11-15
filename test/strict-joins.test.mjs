// Joins that refuse (reviewer 14:45 a; the knowledge repository's KR2): a slot joined to another world's values by a
// key can refuse a value that names no target (`strict=true`), instead of leaving the join open; without it the join
// stays open (lazy loading tells shards in any order) and is reported.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const schema = `@c core.slot of=k.colour key=name id=true
@s1 core.slot of=shape key=colour type=k.colour by=name strict=true
@s2 core.slot of=shape key=tint type=k.colour by=name
@red k.colour name=red`;

test('a strict join refuses a value that names no target; a plain join stays open and is reported', () => {
  const w = new World();
  assert.ok(w.load(schema).ok);
  assert.ok(w.tell('@a shape colour=red').ok);
  const bad = w.tell('@b shape colour=purple');
  assert.equal(bad.ok, false);
  assert.match(bad.violations[0].why, /must be the name of a k.colour wire/);
  const open = w.tell('@c shape tint=purple');
  assert.deepEqual([open.ok, open.openJoins?.[0]?.value], [true, 'purple'], 'left open');
  assert.equal(w.check().issues.find((i) => i.kind === 'open-join').value, 'purple');
});
