// R7.4: a count per distinct value. Anchored on a member, a rule computes the count once
// per member of the group; core.aggregate by= computes it once per distinct value.
// 50 groups of 40 members. `node bench/distinct.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const facts = lines(2000, (i) => `@m${i} member group=g${i % 50}`);
const member = `
  @m member group=?g
  @peer member group=?g
  @n core.calc out=?c fn=count over=$peer
  @t tally group=?g count=?c
  @r core.rule when=$m with=$n then=$t
`;
const distinct = `
  @m member group=?g
  @a core.aggregate over=$m by=?g count=?c then=$t
  @t tally group=?g count=?c
`;
for (const [name, matrix] of [['anchored on a member', member], ['core.aggregate by=', distinct], ['anchored on a member', member], ['core.aggregate by=', distinct]]) {
  const w = new World();
  w.load(matrix);
  const ms = time(() => w.load(facts));
  const one = time(() => w.tell('@extra member group=g7'));
  const t = w.ofType('tally').find((x) => x.attrs.group[0] === 'g7');
  console.log(`${name.padEnd(22)} 2,000 members: ${ms.toFixed(1)} ms; one more member: ${one.toFixed(2)} ms; tallies ${w.ofType('tally').length}, g7 = ${t.attrs.count[0]}`);
}
