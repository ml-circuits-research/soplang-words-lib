// R6.12: a patch that only changes keys no rule, deny, relation, aggregate or state reads
// (here: the text of 200 paragraphs) needs no propagation. World of 1,200 wires whose
// matrix keeps a count per document and has a deny that reads an absence.
// `node bench/unread.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('\n');
const med = (xs) => xs.sort((a, b) => a - b)[xs.length >> 1];
const time = (fn) => { const t = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - t) / 1e6; };
const w = new World();
w.load(`
  @k1 core.slot of=doc key=name id=true
  @dd doc name=?d
  @pp para doc=?d
  @cnt core.calc out=?c fn=count over=$pp
  @tally doc core.on=$dd paras=?c
  @r core.rule when=$dd with=$cnt then=$tally
  @t title doc=?d
  @untitled core.deny when=$pp not=$t why="?d has paragraphs but no title"
`);
w.load(lines(200, (i) => `@d${i} doc name=d${i}\n@t${i} title doc=d${i}`));
w.load(lines(800, (i) => `@p${i} para doc=d${i % 200} n=${i}`));
const runs = { text: [], doc: [] };
for (let round = 0; round < 2; round++) for (let i = 0; i < 31; i++) {
  const f = w.fork();
  const t = time(() => { const r = f.applyPatch({ sets: Array.from({ length: 200 }, (_, j) => ({ id: `p${j}`, key: 'text', value: `v${i}` })) }); if (!r.ok) throw new Error(JSON.stringify(r.violations)); });
  const g = w.fork();
  const d = time(() => { const r = g.applyPatch({ sets: Array.from({ length: 200 }, (_, j) => ({ id: `p${j}`, key: 'doc', value: `d${(j + 1) % 200}` })) }); if (!r.ok) throw new Error(JSON.stringify(r.violations)); });
  if (round) { runs.text.push(t); runs.doc.push(d); }
}
console.log(`${w.wires.size} wires; a patch of 200 values of a key no rule reads (text): ${med(runs.text).toFixed(2)} ms; of a key rules read (doc): ${med(runs.doc).toFixed(2)} ms`);
