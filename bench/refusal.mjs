// R19 item 5: score as the dry run for every candidate reading: the cost per candidate in a
// world of n facts (a declared action, a host action with a deny, a host action, one that lacks).
// `node bench/refusal.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const { GAMES, READINGS } = await import('../examples/refusal.mjs');
for (const n of [0, 2000, 20000]) {
  const w = new World();
  w.load(GAMES);
  if (n) w.tell(Array.from({ length: n }, (_, i) => `@f${i} fact n=${i}`).join('\n'));
  w.score(READINGS);
  const runs = 200, t = process.hrtime.bigint();
  for (let i = 0; i < runs; i++) w.score(READINGS);
  const us = Number(process.hrtime.bigint() - t) / 1e3 / (runs * READINGS.length);
  console.log(`${String(n).padStart(6)} facts: ${us.toFixed(1)} µs per candidate (no game running: 2 of 4 refused)`);
}
