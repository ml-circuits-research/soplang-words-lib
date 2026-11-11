// R6.4: a 1 MB opaque value (kind=blob) in a world of 600 wires: the cost of telling it,
// of a fork and its first change, and of a mark, a change and a rewind, against the
// same world without it. `node bench/blob.mjs` (add `bundle` for docs/sopworld.mjs).
const { World, quote } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const med = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1];
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const big = 'word '.repeat(209716).slice(0, 1 << 20); // 1 MB of text

const make = () => {
  const w = new World();
  w.load(`
    @k1 core.slot of=analysis key=doc id=true
    @k2 core.slot of=analysis key=data kind=blob
    @k3 core.slot of=para key=doc required=true
    @p para doc=?d
    @n analysis core.absent=data doc=?d
    @todo note about=$n text="not analysed yet"
    @r core.rule when=$n when=$p then=$todo
  `);
  w.load(lines(300, (i) => `@p${i} para doc=d${i % 10} n=${i}\n@q${i} para doc=d${i % 10} n=${i + 300}`));
  w.tell('@a1 analysis doc=d1');
  return w;
};
const rows = [];
for (const withBlob of [false, true, false, true]) { // twice: the first round warms up
  const ts = { fill: [], text: [], fork: [], mark: [] };
  for (let i = 0; i < 21; i++) {
    const w = make();
    ts.fill.push(time(() => { if (withBlob) w.fill('a1', 'data', big); else w.fill('a1', 'data', 'small'); }));
    const v = make();
    const text = `@a2 analysis doc=d2 data=${withBlob ? quote(big) : '"small"'}`;
    ts.text.push(time(() => v.tell(text)));
    ts.fork.push(time(() => { const f = w.fork(); f.tell(`@x${i} para doc=d3`); }));
    ts.mark.push(time(() => { const m = w.mark(); w.tell(`@y${i} para doc=d3`); w.rewind(m); }));
    if (i === 20) rows[withBlob ? 1 : 0] = { ...Object.fromEntries(Object.entries(ts).map(([k, v]) => [k, med(v)])), json: JSON.stringify(w.toJSON()).length };
  }
}
console.log('                      | fill the value | tell as text | fork + first tell | mark + tell + rewind | toJSON size');
for (const [name, r] of [['without (6 chars)', rows[0]], ['1 MB blob', rows[1]]]) {
  console.log(`${name.padEnd(21)} | ${r.fill.toFixed(3)} ms | ${r.text.toFixed(3)} ms | ${r.fork.toFixed(3)} ms | ${r.mark.toFixed(3)} ms | ${(r.json / 1024).toFixed(0)} kB`);
}
