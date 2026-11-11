// R6.13: a static table of 1,000 cities that rules and denies read, held as wires or
// given by the host as a fact provider. A turn: fork the world, tell one delivery (a
// rule finds its city's country, a deny checks its population).
// `node bench/facts.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const med = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1];
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const cities = Array.from({ length: 1000 }, (_, i) => ({ id: `city${i}`, name: `c${i}`, country: i % 2 ? 'fr' : 'it', pop: 1000 + i }));
const byName = new Map(cities.map((c) => [c.name, c]));
const matrix = `
  @d delivery to=?n
  @c city name=?n country=?k
  @t delivery core.on=$d country=?k
  @r core.rule when=$d when=$c then=$t
  @small city name=?n pop=?p
  @lt core.check fn=lt args=?p args=1003
  @no core.deny when=$d when=$small if=$lt why="?n is too small"
`;
const asWires = () => { const w = new World(); w.load(matrix); w.load(cities.map((c) => `@${c.id} city name=${c.name} country=${c.country} pop=${c.pop}`).join('\n')); return w; };
const asFacts = () => {
  const w = new World({ facts: { city: (where) => (where.name ? [byName.get(where.name)].filter(Boolean) : cities.filter((c) => Object.entries(where).every(([k, v]) => String(c[k]) === v))) } });
  w.load(matrix);
  return w;
};
for (const [name, make] of [['as wires', asWires], ['as a provider', asFacts], ['as wires', asWires], ['as a provider', asFacts]]) {
  let build;
  const ms = time(() => { build = make(); });
  const ts = [];
  for (let i = 0; i < 101; i++) {
    const f = build.fork();
    ts.push(time(() => { const r = f.tell(`@d${i} delivery to=c${10 + (i % 900)}`); if (!r.ok) throw new Error(JSON.stringify(r.violations)); }));
  }
  console.log(`${name.padEnd(14)} build ${ms.toFixed(1)} ms, a turn (fork + tell) ${med(ts).toFixed(3)} ms, snapshot ${(JSON.stringify(build.toJSON()).length / 1024).toFixed(0)} kB`);
}
