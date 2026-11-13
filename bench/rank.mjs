// R19: core.rank over one group, told one wire at a time (as turns of a dialogue arrive),
// then one more. The peers of a group are ordered once per group, not once per peer.
// `node bench/rank.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const matrix = `
  @c turn in=?d
  @r core.rank of=$c by=in within=?d out=?p
  @t turn core.on=$c pos=?p
  @rule core.rule when=$c with=$r then=$t
`;
for (const n of [100, 200, 400]) {
  const w = new World();
  w.load(matrix);
  const all = time(() => { for (let i = 0; i < n; i++) w.tell(`@t${i} turn in=main`); });
  const one = time(() => w.tell('@last turn in=main'));
  console.log(`${String(n).padStart(4)} turns one at a time: ${all.toFixed(1)} ms; one more: ${one.toFixed(2)} ms; its position ${w.get('last').attrs.pos[0]}`);
}
