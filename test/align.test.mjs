// Transfer by analogy (abstraction round item 5, Q54): a seating world and a timeline world, written
// here (toy, invented), aligned by structure; what one has and the other lacks is offered, not told.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, alignWorlds } from '../tools/lib-under-test.mjs';

const SEATING = `@t core.type of=table  @t1 core.slot of=table key=name  @t2 core.slot of=table key=seats kind=number default=4
@s core.type of=seat  @s1 core.slot of=seat key=table type=table required=true  @s2 core.slot of=seat key=n kind=number  @s3 core.slot of=seat key=guest type=person
@p core.type of=person  @p1 core.slot of=person key=name  @p2 core.slot of=person key=diet enum=vegan enum=meat enum=fish`;
const TIMELINE = `@d core.type of=day  @d1 core.slot of=day key=name  @d2 core.slot of=day key=slots kind=number
@x core.type of=slot  @x1 core.slot of=slot key=day type=day  @x2 core.slot of=slot key=hour kind=number  @x3 core.slot of=slot key=event type=event
@e core.type of=event  @e1 core.slot of=event key=name  @e2 core.slot of=event key=kind`;

test('alignWorlds: seating and timeline align by structure, and what one has is offered to the other', () => {
  const a = new World(); a.load(SEATING); const b = new World(); b.load(TIMELINE);
  const r = alignWorlds(a, b);
  assert.deepEqual(r.map, { table: 'day', seat: 'slot', person: 'event' });
  assert.deepEqual(r.slots.seat, { table: 'day', n: 'hour', guest: 'event' });
  assert.deepEqual(r.offers.map((o) => [o.what, o.to.type, o.to.key]).sort(), [['default', 'day', 'slots'], ['required', 'slot', 'day']]);
  assert.equal(r.score, 1);
  assert.equal(b._compiled().slots.own.get('slot').get('day').required, false, 'offered, not told');
});
