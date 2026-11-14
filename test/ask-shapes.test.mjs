// ask over any attribute and any relation (reviewer 03:10 item 3), of a knowledge world and
// of a schema, with the shape of the answer generated: number with unit, list, yes / no.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const GEO = `@k.geo.fr k.geo.country name=france population=68000000people borders=spain borders=germany core.source="hand-core"
@k.geo.es k.geo.country name=spain population=48000000people borders=france borders=portugal
@k.geo.de k.geo.country name=germany borders=france
@k.geo.pt k.geo.country name=portugal borders=spain`;

test('ask: which things relate to one (either way round), how many, a number with its unit, yes / no', () => {
  const w = new World(); w.load('@acts core.use world=std.acts'); w.tell(GEO);
  const ask = (args) => w.act({ action: 'ask', args }).result;
  assert.deepEqual(ask({ kind: 'k.geo.country', rel: 'borders', of: 'france' }).names, ['spain', 'germany'], '"which countries border France"');
  assert.deepEqual(ask({ kind: 'k.geo.country', rel: 'borders', of: 'portugal' }).names, ['spain'], 'portugal lists spain; spain lists portugal: either way');
  const pop = ask({ thing: 'france', attr: 'population' });
  assert.deepEqual([pop.shape, pop.number, pop.unit, pop.source], ['number', 68000000, 'people', 'hand-core'], '"how many people live in France"');
  assert.deepEqual([ask({ thing: 'spain', rel: 'borders', of: 'germany' }).answer, ask({ thing: 'portugal', rel: 'borders', of: 'spain' }).answer], [false, true], '"does Spain border Germany"');
  assert.deepEqual([ask({ kind: 'k.geo.country', count: true }).shape, ask({ kind: 'k.geo.country', count: true }).number], ['number', 4]);
  assert.equal(ask({ thing: 'germany', attr: 'population' }).shape, 'none');
});

test('ask: the same shapes over schema things', () => {
  const w = new World();
  w.load(`@acts core.use world=std.acts
@s std.schema.world name=seats
@t.table core.type of=table extends=std.schema.thing closed=true
@s.seats core.slot of=table key=seats kind=integer
@t.guest core.type of=guest extends=std.schema.thing closed=true
@s.name core.slot of=guest key=name
@s.at core.slot of=guest key=at type=table
@k.t std.schema.kind of=table world=seats acts=make acts=ask
@k.g std.schema.kind of=guest world=seats acts=make acts=ask`);
  w.act({ action: 'make', args: { kind: 'table', seats: 4 } });
  w.act({ action: 'make', args: { kind: 'guest', name: 'ann', at: '$table1' } });
  w.act({ action: 'make', args: { kind: 'guest', name: 'bob' } });
  const ask = (args) => w.act({ action: 'ask', args }).result;
  assert.deepEqual(ask({ kind: 'guest', rel: 'at', of: 'table1' }).things, ['guest1'], '"who sits at table 1"');
  assert.deepEqual([ask({ thing: 'table1', attr: 'seats' }).shape, ask({ thing: 'table1', attr: 'seats' }).number], ['number', 4]);
  assert.equal(ask({ thing: 'guest1', rel: 'at', of: 'table1' }).answer, true);
});
