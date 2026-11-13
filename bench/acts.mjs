// R20: the cost of one act on a world of n things (a seating plan): steps counted by the
// library for the call, and time. `node bench/acts.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const { seating } = await import('../examples/acts.mjs');
const total = (s) => s.steps;
for (const n of [10, 200, 2000]) {
  const w = new World();
  w.load('@acts core.use world=std.acts\n' + seating.replace('max=10', 'max=100000'));
  w.tell(Array.from({ length: n }, (_, i) => `@g${i} guest kind=guest world=seating name=n${i}`).join('\n'));
  const row = [];
  for (const [name, args] of [['make', { kind: 'guest', name: 'new' }], ['change', { thing: 'g5', attr: 'name', value: 'x' }], ['pick', { kind: 'guest', name: 'n7' }], ['remove', { thing: 'g6' }]]) {
    const t = process.hrtime.bigint();
    const r = w.act({ action: name, args });
    const ms = Number(process.hrtime.bigint() - t) / 1e6;
    row.push(`${name} ${r.ok ? '' : 'REFUSED '}${total(w.stats())} steps ${ms.toFixed(2)} ms`);
  }
  console.log(`${String(n).padStart(5)} things: ${row.join('; ')}`);
}
