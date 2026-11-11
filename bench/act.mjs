// P3: a host action that tells 70 wires, run in a fresh fork of a world of 600 wires
// whose matrix keeps a count per document and has a deny that reads an absence.
// Prints the median time and how many times the rules were run and the world validated
// (`_settle`) per action: tells are propagated together, at the first read and at the end.
// `node bench/act.mjs` (add `bundle` to measure docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const med = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1];
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };

let settles = 0;
const settle = World.prototype._settle;
World.prototype._settle = function (...a) { settles++; return settle.apply(this, a); };

const actions = {
  // writes only: 70 tells
  outline: (ctx, { n }) => { for (let i = 0; i < Number(n); i++) ctx.tell(`@h${i} heading doc=d1 level=${1 + (i % 3)} text="part ${i}"`); return Number(n); },
  // the same, reading after each tell
  careful: (ctx, { n }) => { for (let i = 0; i < Number(n); i++) { ctx.tell(`@h${i} heading doc=d1 level=${1 + (i % 3)} text="part ${i}"`); ctx.find('heading'); } return Number(n); },
};
const w = new World({ actions });
w.load(`
  @k1 core.slot of=heading key=level kind=integer min=1 max=6
  @k2 core.slot of=doc key=name id=true
  @h heading doc=?d level=?l
  @dd doc name=?d
  @top doc core.on=$dd headed=yes
  @r core.rule when=$dd when=$h then=$top
  # what a document editor keeps up to date: the number of headings of each document,
  # and a deny that reads what is absent (both are looked at again after every change)
  @hh heading doc=$dd
  @cnt core.calc out=?c fn=count over=$hh
  @tally doc core.on=$dd headings=?c
  @r2 core.rule when=$dd with=$cnt then=$tally
  @title title doc=?d
  @untitled core.deny when=$h not=$title why="?d has headings but no title"
  @outline core.action name=outline fn=outline required=n
  @careful core.action name=careful fn=careful required=n
`);
w.load(lines(300, (i) => `@d${i} doc name=d${i}\n@t${i} title doc=d${i}`));

for (const name of ['outline', 'careful', 'outline', 'careful']) { // twice: the first round warms up
  const ts = [];
  let s = 0;
  for (let i = 0; i < 101; i++) {
    const f = w.fork();
    settles = 0;
    ts.push(time(() => { const r = f.act({ action: name, args: { n: 70 } }); if (!r.ok) throw new Error(JSON.stringify(r.violations)); }));
    s = settles;
  }
  console.log(`${name.padEnd(8)} 70 tells in a fresh fork of ${w.wires.size} wires: ${med(ts).toFixed(3)} ms, ${s} propagation${s === 1 ? '' : 's'} per action`);
}
