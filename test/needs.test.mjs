// Typed needs (reviewer 03:10 item 2): a world or a view says which wires it needs loaded
// before acting; an act there is refused with the list; turn loads them through the host
// and tries again; std.know.fill then finds its catalog.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World, needsOf, turn } from '../tools/lib-under-test.mjs';

const SHOP = `@acts core.use world=std.acts
@know core.use world=std.know
@home std.schema.world name=home
@any std.schema.kinds world=home from=k.known acts=make
@kn k.known name=sofa
@kf std.know.fill from=k.furniture key=w
@need std.schema.needs of=home type=k.furniture from=k.furniture`;
const CATALOG = '@f.sofa k.furniture name=sofa w=200 core.source="shop list"';

test('needs: refused with what to load; needsOf lists them; loaded, the act goes and the catalog fills', () => {
  const w = new World(); w.load(SHOP);
  assert.deepEqual(needsOf(w, { world: 'home' }), [{ of: 'home', type: 'k.furniture', from: 'k.furniture', loaded: false }]);
  const r = w.act({ action: 'make', args: { kind: 'sofa' } });
  assert.deepEqual([r.ok, r.violations[0].why], [false, 'needs k.furniture from k.furniture loaded first']);
  w.tell(CATALOG);
  assert.equal(needsOf(w)[0].loaded, true);
  const m = w.act({ action: 'make', args: { kind: 'sofa' } });
  assert.deepEqual([m.ok, w.get('sofa1').attrs.w], [true, ['200']]);
});

test('needs: turn asks the host to load, then reads again', () => {
  const w = new World(); w.load(SHOP);
  const asked = [];
  const t = turn(w, [{ action: 'make', args: { kind: 'sofa' } }], { load: (need, world) => { asked.push(need.type); world.tell(CATALOG); } });
  assert.deepEqual([t.status, asked, t.loaded.map((n) => n.type)], ['done', ['k.furniture'], ['k.furniture']]);
  assert.equal(w.get('sofa1').attrs.w[0], '200');
  const bare = new World(); bare.load(SHOP);
  const without = turn(bare, [{ action: 'make', args: { kind: 'sofa' } }]);
  assert.notEqual(without.status, 'done', 'no loader: not done');
});
