import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';

const bundle = process.env.SOPWORLD_BUNDLE === '1';
const { World, parse } = await import(bundle ? '../docs/sopworld.mjs' : '../src/index.mjs');
// The Z3 provider is optional: the tests that use it run when z3-solver is installed (experiments/ has it).
const z3Path = new URL('../experiments/node_modules/z3-solver/build/node.js', import.meta.url);
const z3 = existsSync(z3Path) ? createRequire(import.meta.url)(z3Path.pathname) : null;
const provider = z3 ? await (await import('../node/smt-z3.mjs')).z3Provider({ module: z3 }) : null;

// An invented scene: a page, a tree and a lake; a new 100 x 80 house to place.
const scene = (extra = '', options = '') => `@p std.problem.request budget=5000 ${options} var=$vx var=$vy box=$page box=$house box=$tree box=$lake ${extra.split('\n').filter(Boolean).map((l) => 'constraint=$' + l.split(' ')[0].slice(1)).join(' ')}
@vx std.problem.var name=x min=0 max=700 step=10
@vy std.problem.var name=y min=0 max=520 step=10
@page std.problem.box name=page x=0 y=0 w=800 h=600
@house std.problem.box name=house x=x y=y w=100 h=80
@tree std.problem.box name=tree x=420 y=200 w=60 h=120
@lake std.problem.box name=lake x=100 y=380 w=260 h=140
${extra}`;
const near = `@c1 std.problem.constraint name=on_page predicate=inside a=house b=page
@c2 std.problem.constraint name=near_tree predicate=near a=house b=tree gap=40
@c3 std.problem.constraint name=avoid_lake predicate=apart a=house b=lake
@c4 std.problem.constraint name=low predicate=maximise a=y strength=soft weight=1`;
const result = (text) => {
  const rows = parse(text), main = rows.find((r) => r.type === 'std.problem.result'), byId = new Map(rows.map((r) => ['$' + r.id, r]));
  const values = Object.fromEntries((main.attrs.assignment ?? []).map((t) => byId.get(t)).map((r) => [r.attrs.var[0], Number(r.attrs.value[0])]));
  return { status: main.attrs.status[0], provider: main.attrs.provider?.[0], conflict: main.attrs.conflict ?? [], values, alternatives: (main.attrs.alternative ?? []).length, reason: main.attrs.reason?.[0] };
};
const near40 = ({ x, y }) => {
  const gx = x + 100 <= 420 ? 420 - (x + 100) : 480 <= x ? x - 480 : 0, gy = y + 80 <= 200 ? 200 - (y + 80) : 320 <= y ? y - 320 : 0;
  const overlap = x < 480 && 420 < x + 100 && y < 320 && 200 < y + 80;
  return !overlap && gx <= 40 && gy <= 40;
};

test('the internal provider places a house near the tree, off the lake and on the page, preferring low', () => {
  const w = new World(), r = result(w.compileRequest(scene(near)));
  assert.equal(r.status, 'solved'); assert.equal(r.provider, 'internal');
  assert.ok(near40(r.values), JSON.stringify(r.values));
  assert.ok(r.values.x >= 0 && r.values.x + 100 <= 800 && r.values.y + 80 <= 600);
});

test('the internal provider says exhausted, not impossible, when no grid point holds', () => {
  const w = new World();
  const r = result(w.compileRequest(scene(`@c1 std.problem.constraint name=in_lake predicate=inside a=house b=lake
@c2 std.problem.constraint name=off_lake predicate=apart a=house b=lake`)));
  assert.equal(r.status, 'exhausted');
});

test('alternatives keep the next best placements for "no, the other one"', () => {
  const w = new World(), r = result(w.compileRequest(scene(near, 'depth=alternatives count=3')));
  assert.equal(r.status, 'solved'); assert.equal(r.alternatives, 2);
});

test('spans: a 60-minute meeting avoids the busy times and prefers the latest start', () => {
  const w = new World();
  const r = result(w.compileRequest(`@p std.problem.request var=$s span=$m span=$b1 span=$b2 span=$day constraint=$c1 constraint=$c2 constraint=$c3 constraint=$c4
@s std.problem.var name=start min=0 max=480 step=15
@m std.problem.span name=meeting start=start length=60
@b1 std.problem.span name=busy1 start=60 length=120
@b2 std.problem.span name=busy2 start=360 length=180
@day std.problem.span name=day start=0 length=480
@c1 std.problem.constraint name=free1 predicate=disjoint a=meeting b=busy1
@c2 std.problem.constraint name=free2 predicate=disjoint a=meeting b=busy2
@c3 std.problem.constraint name=in_day predicate=within a=meeting b=day
@c4 std.problem.constraint name=late predicate=maximise a=start strength=soft weight=1`));
  assert.equal(r.status, 'solved'); assert.equal(r.values.start, 300);
});

test('invalid packets are refused before any search', () => {
  const w = new World(), reason = (text) => result(w.compileRequest(text)).reason;
  assert.equal(reason(scene(near).replace('predicate=near', 'predicate=teleport')), 'invalid-constraint');
  assert.equal(reason(scene(near).replace('a=house b=tree', 'a=house b=forest')), 'invalid-constraint-box');
  assert.equal(reason(scene('@c1 std.problem.constraint name=low predicate=maximise a=y')), 'objective-must-be-soft');
});

test('Z3 solves the same placement and the read-back confirms it', { skip: provider ? false : 'z3-solver unavailable' }, async () => {
  const w = new World(), r = result(await w.compileRequest(scene(near), { provider }));
  assert.equal(r.status, 'solved'); assert.equal(r.provider, 'z3');
  assert.ok(near40(r.values), JSON.stringify(r.values));
});

test('Z3 proves an impossible request and names the conflicting constraints', { skip: provider ? false : 'z3-solver unavailable' }, async () => {
  const w = new World();
  const r = result(await w.compileRequest(scene(`@c1 std.problem.constraint name=in_lake predicate=inside a=house b=lake
@c2 std.problem.constraint name=off_lake predicate=apart a=house b=lake`), { provider }));
  assert.equal(r.status, 'unsatisfiable');
  assert.deepEqual([...r.conflict].sort(), ['in_lake', 'off_lake']);
});

test('Z3 returns distinct alternatives', { skip: provider ? false : 'z3-solver unavailable' }, async () => {
  const w = new World(), r = result(await w.compileRequest(scene(near, 'depth=alternatives count=3'), { provider }));
  assert.equal(r.status, 'solved'); assert.equal(r.alternatives, 2);
});

test('a provider may decline a model, and the internal search answers under its own name', async () => {
  const w = new World();
  const declined = result(await w.compileRequest(scene(near), { provider: async () => null }));
  assert.equal(declined.status, 'solved'); assert.equal(declined.provider, 'internal');
  assert.equal(result(await w.compileRequest(scene(near), { provider: () => undefined })).provider, 'internal');
});

test('the browser Z3 provider loads nothing where Z3 cannot run, declines, and is strict on request', async () => {
  const dir = bundle ? '../docs/' : '../browser/';
  const { z3Provider, z3Supported, z3Base, z3Version } = await import(dir + 'smt-z3.mjs');
  assert.ok(z3Base.endsWith(`/vendor/z3-solver-${z3Version}/`));
  if (z3Supported()) return;   // a runtime with workers and SharedArrayBuffer is checked by tools/browser-z3-check.mjs
  const loads = [], provider = z3Provider({ onLoad: (info) => loads.push(info.status) });
  assert.equal(result(await new World().compileRequest(scene(near), { provider })).provider, 'internal');
  assert.deepEqual(loads, ['failed']);
  assert.equal(await provider.preload(), false);
  await assert.rejects(z3Provider({ strict: true }).preload(), /z3-unsupported/);
});

// align and on: a house beside the tree keeps the tree's ground line; a house on the lake rests on its top band.
const beside = `@c1 std.problem.constraint name=on_page predicate=inside a=house b=page
@c2 std.problem.constraint name=right_of_tree predicate=right a=house b=tree gap=60
@c3 std.problem.constraint name=ground_line predicate=align a=house b=tree axis=y edge=1 strength=soft weight=1`;
const resting = `@c1 std.problem.constraint name=on_page predicate=inside a=house b=page
@c2 std.problem.constraint name=on_lake predicate=on a=house b=lake share=0.2`;
const checkBeside = ({ x, y }) => { assert.ok(x >= 480 && x <= 540, 'right of the tree ' + x); assert.equal(y + 80, 320, 'bottom on the tree bottom'); };
const checkResting = ({ x, y }) => {
  assert.ok(y + 80 >= 380 && y + 80 <= 380 + 0.2 * 140, 'bottom in the top band of the lake ' + y);
  assert.ok(x + 50 >= 100 && x + 50 <= 360, 'centre over the lake ' + x);
};
test('align as a soft term costs the distance: the internal search keeps the ground line; on rests on the top band', () => {
  const w = new World(), a = result(w.compileRequest(scene(beside))), b = result(w.compileRequest(scene(resting)));
  assert.equal(a.status, 'solved'); checkBeside(a.values);
  assert.equal(b.status, 'solved'); checkResting(b.values);
  assert.equal(result(w.compileRequest(scene(beside.replace('axis=y', 'axis=z')))).reason, 'invalid-constraint');
});
test('Z3 keeps the same ground line and rests the house on the lake', { skip: provider ? false : 'z3-solver unavailable' }, async () => {
  const w = new World(), a = result(await w.compileRequest(scene(beside), { provider })), b = result(await w.compileRequest(scene(resting), { provider }));
  assert.equal(a.status, 'solved'); assert.equal(a.provider, 'z3'); checkBeside(a.values);
  assert.equal(b.status, 'solved'); assert.equal(b.provider, 'z3'); checkResting(b.values);
});

// Fractional geometry: a subject drawn smaller to fit (112.5 x 57.75), a region with fractional bounds, real
// weights, gaps and grid steps. Z3 mixes the integer and real terms and reads the real values back exactly.
const fractional = `@p std.problem.request budget=5000 var=$vx var=$vy box=$frame box=$boat box=$water box=$lake box=$tree constraint=$c1 constraint=$c2 constraint=$c3 constraint=$c4 constraint=$c5 constraint=$c6
@vx std.problem.var name=x min=0 max=887.5 step=15.625
@vy std.problem.var name=y min=0 max=567.25 step=15.625
@frame std.problem.box name=frame x=0 y=0 w=1000 h=625
@boat std.problem.box name=boat x=x y=y w=112.5 h=57.75
@water std.problem.box name=water x=692.5 y=461.25 w=295 h=127.5
@lake std.problem.box name=lake x=680 y=445 w=320 h=160
@tree std.problem.box name=tree x=0 y=445 w=160 h=160
@c1 std.problem.constraint name=in_water predicate=inside a=boat b=water
@c2 std.problem.constraint name=centred predicate=align a=boat b=water axis=x edge=0.5 strength=soft weight=0.2
@c3 std.problem.constraint name=on_page predicate=inside a=boat b=frame
@c4 std.problem.constraint name=peer predicate=apart a=boat b=tree gap=12 strength=soft weight=100
@c5 std.problem.constraint name=close predicate=near a=boat b=tree gap=40.5 strength=soft weight=0.5
@c6 std.problem.constraint name=resting predicate=on a=boat b=lake gap=4 share=0.25 strength=soft weight=1.5`;
test('Z3 solves a problem with fractional sizes, regions and weights, and the read-back confirms it', { skip: provider ? false : 'z3-solver unavailable' }, async () => {
  const w = new World(), r = result(await w.compileRequest(fractional, { provider })), internal = result(w.compileRequest(fractional));
  assert.equal(r.status, 'solved'); assert.equal(r.provider, 'z3'); assert.equal(internal.provider, 'internal');
  const { x, y } = r.values;
  assert.ok(x >= 692.5 && x + 112.5 <= 987.5 && y >= 461.25 && y + 57.75 <= 588.75, JSON.stringify(r.values));
  assert.equal(x + 56.25, 692.5 + 147.5, 'centred on the water, exactly');
});

// outside: the negation of inside. A soft outside of a window around the tree's centre, grown by the house's size,
// keeps the house's centre off the tree's centre while the house still goes near it.
test('outside keeps a centre off a point, with the internal search and with Z3', async () => {
  const offCentre = `@c1 std.problem.constraint name=on_page predicate=inside a=house b=page
@c2 std.problem.constraint name=centred predicate=align a=house b=tree axis=x edge=0.5 strength=soft weight=1
@c3 std.problem.constraint name=off predicate=outside a=house b=window strength=soft weight=50
@c4 std.problem.constraint name=low predicate=align a=house b=tree axis=y edge=0.5 strength=soft weight=1`;
  const packet = scene(offCentre).replace('box=$lake', 'box=$lake box=$window') + '\n@window std.problem.box name=window x=380 y=200 w=140 h=120';
  const check = ({ x, y }) => { const cx = x + 50, cy = y + 40; assert.ok(Math.abs(cx - 450) > 20 || Math.abs(cy - 260) > 20, JSON.stringify({ cx, cy })); };
  const r = result(new World().compileRequest(packet));
  assert.equal(r.status, 'solved'); check(r.values);
  if (provider) { const z = result(await new World().compileRequest(packet, { provider })); assert.equal(z.provider, 'z3'); check(z.values); }
});
