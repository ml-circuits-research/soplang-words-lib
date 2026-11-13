// R17.5: load cost at scale. The schemas of eight knowledge worlds, then 50 shards told one
// after another into one world: the 31 hand-written CC0 shards in bench/fixtures/knowledge,
// then the first 19 again, each in a namespace of its own (so they are new wires, not
// merges). Time and heap per shard, and whether it grows with what is already loaded.
// `node --expose-gc bench/load.mjs` (add `bundle` for docs/sopworld.mjs). With
// `--corpus <a clone of sop-knowledge-worlds>`, the first 50 shards of its k.objects world
// are told instead (imported data, read in place, not copied here): the full-size case.
import { readFileSync, readdirSync } from 'node:fs';
const { World } = await import(process.argv.includes('bundle') ? '../docs/sopworld.mjs' : '../src/index.mjs');
const N = Number(process.argv[process.argv.indexOf('--shards') + 1]) || 50; // --shards <n>, for the corpus
const corpus = process.argv.includes('--corpus') ? process.argv[process.argv.indexOf('--corpus') + 1].replace(/\/?$/, '/') : null;
const dir = corpus ? new URL(`file://${corpus}docs/worlds/`) : new URL('./fixtures/knowledge/', import.meta.url);
const worlds = ['k.commonsense', 'k.animals', 'k.body', 'k.food', 'k.objects', 'k.space', 'k.time', 'k.units'];
const read = (p) => readFileSync(new URL(p, dir), 'utf8');
const shards = corpus
  ? readdirSync(new URL('k.objects/shards/', dir)).sort().slice(0, N).map((f) => ({ name: f, text: read(`k.objects/shards/${f}`) }))
  : worlds.flatMap((w) => readdirSync(new URL(`${w}/shards/`, dir)).sort().map((f) => ({ name: `${w}/${f}`, text: read(`${w}/shards/${f}`) })));
const w = new World();
for (const name of worlds) { const r = w.load(read(`${name}/schema.sop`)); if (!r.ok) throw new Error(`${name}: ${JSON.stringify(r.violations[0])}`); }
const gc = globalThis.gc || (() => {});
const heap = () => { gc(); return process.memoryUsage().heapUsed / 1048576; };
const rows = [];
let h0 = heap();
for (let i = 0; i < N; i++) {
  const s = shards[i % shards.length];
  const t = process.hrtime.bigint();
  const r = w.tell(s.text, i < shards.length ? {} : { ns: `r${i}` });
  const ms = Number(process.hrtime.bigint() - t) / 1e6;
  if (!r.ok) throw new Error(`${s.name}: ${JSON.stringify(r.violations[0])}`);
  const h = heap();
  rows.push({ i, wires: (s.text.match(/^@/gm) || []).length, ms, mb: h - h0, total: w.wires.size });
  h0 = h;
}
const per = (xs) => xs.reduce((a, r) => a + r.ms / r.wires, 0) / xs.length;
const first = rows.slice(0, 10), last = rows.slice(-10);
console.log(`${N} shards, ${rows.reduce((a, r) => a + r.wires, 0)} wires told, ${w.wires.size} wires in the world`);
console.log(`total ${rows.reduce((a, r) => a + r.ms, 0).toFixed(0)} ms; heap +${rows.reduce((a, r) => a + r.mb, 0).toFixed(1)} MB`);
console.log(`ms per wire: shards 1-10 ${per(first).toFixed(3)}, last 10 ${per(last).toFixed(3)}`);
for (const r of rows.filter((x) => x.i % 7 === 0 || x.i === 49)) console.log(`  shard ${String(r.i + 1).padStart(2)}: ${String(r.wires).padStart(4)} wires ${r.ms.toFixed(1).padStart(7)} ms (${(r.ms / r.wires).toFixed(3)} ms a wire), heap ${r.mb >= 0 ? '+' : ''}${r.mb.toFixed(2)} MB, world ${r.total}`);
