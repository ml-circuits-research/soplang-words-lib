// R21: make with knowledge as a filler on a drawing world of n things (each with its needs
// for place, size, colour): steps and time of one more make. `node bench/know.mjs`
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const { knowledge, draw } = await import('../examples/know.mjs');
for (const n of [10, 200, 2000]) {
  const w = new World();
  w.load(['@acts core.use world=std.acts', '@know core.use world=std.know', draw].join('\n'));
  w.tell(knowledge);
  w.tell(Array.from({ length: n }, (_, i) => `@f${i} std.schema.thing kind=fish world=draw`).join('\n'));
  const t = process.hrtime.bigint();
  const r = w.act({ action: 'make', args: { kind: 'fish' } });
  console.log(`${String(n).padStart(5)} things: make ${r.ok ? '' : 'REFUSED '}${w.stats().steps} steps ${(Number(process.hrtime.bigint() - t) / 1e6).toFixed(2)} ms, filled ${r.result?.filled?.length}`);
}
