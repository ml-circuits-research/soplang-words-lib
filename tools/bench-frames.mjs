// readFrames on the frame examples of w.lang.en against the knowledge repository's reference frame reader (its
// tests/w.lang.en.library.test.mjs, Q83), both read at the pinned commit. Prints the counts and, with --rows, the misses.
//   node tools/bench-frames.mjs [--all] [--rows]
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { World, readFrames } from '../src/index.mjs';
import { worldsDir } from './worlds.mjs';

const K = worldsDir();
if (!K) { console.log('the knowledge repository cannot be read here'); process.exit(0); }
const { parse } = await import(`${K}tools/sopworld/sopworld.mjs`);
const { WORLDS_DIR, scanWorlds } = await import(`${K}tools/lib/worlds.mjs`);
const { frameReader } = await import(`${K}tools/lib/lang-en.mjs`);
const worlds = scanWorlds();
const both = new World({ library: Object.fromEntries(worlds.map((w) => [w.id, w.schemaText])) });
both.use('w.lang.en'); both.use('k.actions');
for (const id of ['w.lang.en', 'k.actions']) for (const s of worlds.find((w) => w.id === id).shards) both.tell(s.text);
const shards = (id) => readdirSync(join(WORLDS_DIR, id, 'shards')).filter((f) => f.endsWith('.sop')).sort().flatMap((f) => parse(readFileSync(join(WORLDS_DIR, id, 'shards', f), 'utf8')));
const tok = (t) => (t?.startsWith('"') ? JSON.parse(t) : t);
const one = (w, k) => tok(w.attrs[k]?.[0]);
const all = shards('w.lang.en'), actions = shards('k.actions');
const frames = all.filter((w) => w.type === 'w.lang.en.frame').filter((_, i) => process.argv.includes('--all') || i % 3 === 0);
let same = 0, sameAct = 0;
const rows = [];
const t0 = Date.now();
for (const f of frames) {
  const name = one(f, 'name'), ex = one(f, 'example'), needs = one(f, 'needs');
  const local = frameReader(all, actions, { openLexicons: true, needs: (n) => n === undefined || n === needs })(ex)[0];
  const lib = readFrames(both, ex, { lang: 'w.lang.en', needs: (n) => n === undefined || n === needs, open: true }).best;
  if (lib && (lib.frame === name || lib.frame === local?.frame)) same += 1;
  else if (lib && local && lib.act === local.act && (lib.mode ?? null) === (local.mode ?? null)) sameAct += 1;
  else rows.push(`${name}\t${ex}\t-> ${lib?.frame ?? '-'} (${lib?.act ?? ''})\tref ${local?.frame ?? '-'}`);
}
console.log(`${frames.length} frame examples: same frame ${same}, same act and mode ${sameAct}, otherwise ${frames.length - same - sameAct} (${Date.now() - t0} ms)`);
if (process.argv.includes('--rows')) console.log(rows.join('\n'));
