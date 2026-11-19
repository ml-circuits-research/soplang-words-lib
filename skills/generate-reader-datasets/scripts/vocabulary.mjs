// vocabulary.mjs — extract the catalog-declared request vocabulary: for every
// canonical value the knowledge worlds own (object kinds, colours, scenes), the
// NATURAL SURFACES people may use (core.word wires: text=… means=…). This is the
// value-level diversity engine of dataset generation: the reader trains on the
// words the worlds KNOW, not on type names.
//
// Usage: node vocabulary.mjs --catalog <sop-knowledge-worlds/docs/worlds> [--out vocabulary.json]
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : def; };
const CATALOG = arg('catalog');
const OUT = arg('out', 'vocabulary.json');
if (!CATALOG || !existsSync(CATALOG)) { console.error('usage: vocabulary.mjs --catalog <docs/worlds>'); process.exit(1); }

// means -> [surfaces], grouped by the world that owns the value
const collect = (shardPath, re) => {
  const map = new Map();
  for (const f of readdirSync(shardPath).filter((f) => f.endsWith('.sop')).sort()) {
    for (const line of readFileSync(`${shardPath}/${f}`, 'utf8').split('\n')) {
      const m = line.match(/core\.word\s/);
      if (!m) continue;
      const text = /text="([^"]+)"|text=(\S+)/.exec(line);
      const means = /means="([^"]+)"|means=(\S+)/.exec(line);
      const of = /of=(\S+)/.exec(line);
      if (!text || !means || !of) continue;
      if (!re.test(of[1] || of[2] || '')) continue;
      const key = means[1] || means[2];
      const surface = text[1] ?? text[2];
      if (!map.has(key)) map.set(key, []);
      if (!map.get(key).includes(surface)) map.get(key).push(surface);
    }
  }
  return map;
};

const out = { format: 'sopskill.vocabulary/1', source: 'sop-knowledge-worlds (core.word declarations)' };
for (const [name, dir, re] of [
  ['objects', 'k.objects/shards', /k\.objects\.object|k\.objects\.kind/],
  ['colours', 'k.colours/shards', /k\.colours\.colour/],
  ['kinds', 'k.kinds/shards', /k\.kinds\.kind|k\.kinds\.parent/],
  ['scenes', 'k.scenes/shards', /k\.scenes\.(thing|place)/],
  ['commonsense', 'k.commonsense/shards', /k\.commonsense/],
  ['faces', 'k.faces/shards', /k\.faces/],
]) {
  const p = `${CATALOG}/${dir}`;
  if (!existsSync(p)) continue;
  const map = collect(p, re);
  out[name] = Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, { surfaces: v }]));
}

writeFileSync(OUT, JSON.stringify(out));
const count = (o) => Object.keys(o).length;
console.log(`vocabulary -> ${OUT}`);
console.log('objects:', out.objects ? count(out.objects) : 0, '| colours:', out.colours ? count(out.colours) : 0, '| kinds:', out.kinds ? count(out.kinds) : 0, '| scenes:', out.scenes ? count(out.scenes) : 0, '| faces:', out.faces ? count(out.faces) : 0);
const rich = Object.entries(out.objects || {}).filter(([, v]) => v.surfaces.length >= 3).slice(0, 5);
console.log('sample multi-surface values:', JSON.stringify(rich));
