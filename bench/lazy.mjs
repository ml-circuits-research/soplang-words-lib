// R7.5: lazy rules. 200 pieces; a rule makes 4 lines per piece. A turn moves one piece;
// sometimes a move is checked by a question. Eager: the lines are kept up to date on every
// turn. Lazy: they are made only when a question asks.
// `node bench/lazy.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const med = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1];
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const matrix = (lazy) => `
  @k core.slot of=piece key=name id=true
  @p piece name=?n at=?a
  @d dir step=?s
  @l line piece=?n from=?a step=?s
  @r core.rule when=$p when=$d then=$l ${lazy ? 'lazy=true' : ''}
`;
for (const lazy of [false, true, false, true]) {
  const w = new World();
  w.load(matrix(lazy));
  w.load('@d1 dir step=n  @d2 dir step=s  @d3 dir step=e  @d4 dir step=w');
  w.load(lines(200, (i) => `@p${i} piece name=p${i} at=${i}`));
  const turns = [], asks = [];
  for (let t = 0; t < 61; t++) {
    turns.push(time(() => w.revise(`p${t % 200}`, 'at', String(1000 + t))));
    if (t % 10 === 0) asks.push(time(() => w.ask(`line piece=p${t % 200} step=?s`)));
  }
  console.log(`${lazy ? 'lazy ' : 'eager'}  a turn (move one piece) ${med(turns).toFixed(2)} ms; a question about the lines ${med(asks).toFixed(2)} ms`);
}
