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
