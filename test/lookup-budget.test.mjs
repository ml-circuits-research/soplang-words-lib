// Lookups at size (reviewer 13:50 point 5; PSys2's LEARNED-MEM-INDEX: a per-lookup scan made 39 real turns run out
// of budget): a make that reads a catalog (std.schema.kinds, std.know.fill) goes through the index, so 100 times
// more catalog facts do not make it slower in proportion.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../tools/lib-under-test.mjs';

function build(n) {
  const w = new World();
  const facts = Array.from({ length: n }, (_, i) => `@f${i} k.furniture name=item${i} w=${(i % 300) + 10}`).join('\n'); // bounded: n
  w.load(`@acts core.use world=std.acts\n@know core.use world=std.know\n@s1 core.slot of=k.furniture key=name id=true\n@s2 core.slot of=k.furniture key=w kind=number
@home std.schema.world name=home\n@any std.schema.kinds world=home from=k.furniture acts=make\n@kf std.know.fill from=k.furniture key=w\n${facts}`);
  return w;
}
const makes = (w, n) => { const t0 = performance.now(); for (let i = 0; i < 40; i++) assert.ok(w.act({ action: 'make', args: { kind: `item${(i * 37) % n}` } }).ok); return performance.now() - t0; }; // bounded: 40

test('catalog lookups through the index: 40 makes over 20,000 catalog facts cost about what they cost over 200', () => {
  const small = build(200), big = build(20000);
  makes(small, 200); // warm
  const a = makes(small, 200), b = makes(big, 20000);
  assert.ok(b < a * 4 + 40, `200 facts: ${a.toFixed(0)} ms, 20,000 facts: ${b.toFixed(0)} ms`);
  const m = big.act({ action: 'make', args: { kind: 'item19999' } });
  assert.deepEqual(m.result.filled.map((f) => [f.key, f.value]), [['w', String((19999 % 300) + 10)]], 'and the catalog value is still found');
});
