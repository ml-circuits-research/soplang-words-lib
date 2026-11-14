// Acts on the view itself (reviewer 03:10 item 1, from a map pilot): a view's own
// attributes (zoom, the layer shown) changed and asked with the view as the thing, named
// or implicit ("zoom in" names no thing).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

const GEO = `@acts core.use world=std.acts
@geo std.schema.world name=geo
@t.c core.type of=country extends=std.schema.thing closed=true
@s.c.name core.slot of=country key=name required=true
@k.c std.schema.kind of=country world=geo acts=make acts=ask aspects=label
@a.label std.schema.aspect name=label keys=name
@t.m core.type of=map.state extends=std.schema.thing closed=true
@s.z core.slot of=map.state key=zoom kind=integer min=1 max=10 step=1 default=3
@s.l core.slot of=map.state key=layer enum=borders enum=rivers enum=none default=none
@k.m std.schema.kind of=map.state world=geo acts=change acts=ask
@v std.schema.view name=map shows=label state=map.state`;

test('view acts: "zoom in" changes the view whose state has zoom; its defaults are assumptions; its slots still check', () => {
  const w = new World(); w.load(GEO);
  const r = w.act({ action: 'change', args: { attr: 'zoom', by: 1 } });
  assert.deepEqual([r.ok, r.result.thing, r.result.value], [true, 'view_map', '4'], 'from the default 3, one step');
  assert.equal(w.tier('view_map', 'layer'), 'default');
  assert.ok(w.act({ action: 'change', args: { attr: 'layer', value: 'borders' } }).ok, '"show the borders"');
  assert.equal(w.act({ action: 'ask', args: { thing: 'map', attr: 'layer' } }).result.value, 'borders', 'the view named as the thing');
  assert.equal(w.act({ action: 'change', args: { attr: 'zoom', value: 12 } }).violations[0].why, 'must be at most 10');
  assert.equal(w.act({ action: 'change', args: { attr: 'colour', value: 'red' } }).violations[0].why, 'change what? (colour)');
  w.act({ action: 'undo', args: {} });
  assert.equal(w.get('view_map').attrs.layer[0], 'none', 'one undo step, as any act');
});
