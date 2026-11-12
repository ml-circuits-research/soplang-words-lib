// R11.1: snapshots with a timeline over a 1,000-wire base, after 8 and 40 turns (a mark,
// a note and a revision per turn). "each mark its log" is the format before 0.11 (every
// open mark replayed from scratch); "marks at" writes marks as positions in the one log;
// "delta" writes only what came after the base (toJSON({ since: base })).
// `node bench/snapshot.mjs` (add `bundle` for docs/sopworld.mjs).
const { World } = await import(process.argv[2] === 'bundle' ? '../docs/sopworld.mjs' : '../src/index.mjs');
const time = (f) => { const s = process.hrtime.bigint(); const r = f(); return [Number(process.hrtime.bigint() - s) / 1e6, r]; };
const base = new World();
base.load('@k core.slot of=item key=name id=true  @t core.slot of=note key=text');
base.tell(Array.from({ length: 1000 }, (_, i) => `@i${i} item name=n${i} stock=${i % 9}`).join('\n'));
for (const turns of [8, 40]) {
  const w = base.fork();
  for (let t = 0; t < turns; t++) { w.mark('t' + t); w.tell(`@n${t} note text="turn ${t}"`); w.revise(`i${t}`, 'stock', String(100 + t)); }
  const at = w.toJSON({ timeline: true });
  const old = { ...at, timeline: { ...at.timeline, marks: w.marks().map(({ label, seq, mark }) => ({ label, seq, log: mark.world.log })) } };
  const delta = w.toJSON({ timeline: true, since: base });
  const row = (name, data, opts) => {
    const text = JSON.stringify(data);
    const [ms, r] = time(() => World.fromJSON(JSON.parse(text), opts));
    if (r.toSOP() !== w.toSOP() || r.marks().length !== turns) throw new Error('not the same world');
    return `${name} ${(text.length / 1024).toFixed(1)} kB, restore ${ms.toFixed(1)} ms`;
  };
  console.log(`${turns} turns: ${row('each mark its log', old)}; ${row('marks at', at)}; ${row('delta', delta, { base })}`);
}
