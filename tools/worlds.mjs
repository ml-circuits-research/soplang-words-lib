// The published worlds, read at a pinned commit (reviewer 04:40: the library holds
// mechanisms, tests and toy examples only; particular worlds and knowledge live in
// sop-knowledge-worlds, and applications' worlds in the applications).
//
// repos.pin lists the repositories (knowledge repositories in order of precedence, and
// applications), each with its commit. `checkout(name)` returns a checkout at that commit:
// $<NAME>_DIR when set (it must be at that commit), else `.cache/<name>`, cloned or fetched
// on first use. `worldsDir()` is the first knowledge repository, `psys2Dir()` the pilot's. Both return null when the checkout cannot be had (offline): the
// tests that need them are skipped, and say why.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, mkdirSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
/** The repositories in repos.pin: [{ name, kind, url, pin, env, cache }], in order. */
export const REPOS = readFileSync(root + 'repos.pin', 'utf8').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => {
  const [name, kind, url, pin] = l.trim().split(/\s+/);
  return { name, kind, url, pin, env: `${name.replace(/\W/g, '_').toUpperCase()}_DIR`, cache: `.cache/${name}` };
});
const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000 }).toString().trim();
const cache = new Map();

/** A checkout of one of the REPOS at its pinned commit, or null. */
export function checkout(name) {
  if (cache.has(name)) return cache.get(name);
  const r = REPOS.find((x) => x.name === name), pin = r.pin;
  let dir = process.env[r.env] || root + r.cache, out = null;
  try {
    if (!existsSync(dir + '/.git')) { mkdirSync(dir, { recursive: true }); execFileSync('git', ['clone', '--quiet', r.url, dir], { stdio: 'ignore', timeout: 300000 }); }
    let head = '';
    try { head = git(dir, 'rev-parse', 'HEAD'); } catch { head = ''; }
    if (head !== pin) {
      if (process.env[r.env]) throw new Error(`${r.env} is at ${head || 'nothing'}, not ${pin}`); // a checkout the user gave is not moved
      try { git(dir, 'cat-file', '-e', `${pin}^{commit}`); } catch { git(dir, 'fetch', '--quiet', 'origin'); }
      git(dir, 'checkout', '--quiet', '--detach', pin);
    }
    out = dir.replace(/\/?$/, '/');
  } catch { out = null; }
  cache.set(name, out);
  return out;
}
/** The knowledge repositories, in order of precedence: [{ name, dir }] (dir null offline). */
export const knowledgeDirs = () => REPOS.filter((r) => r.kind === 'knowledge').map((r) => ({ name: r.name, dir: checkout(r.name) }));
/** The first knowledge repository (the one the published w.* and k.* worlds come from today). */
export const worldsDir = () => knowledgeDirs()[0]?.dir ?? null;
export const psys2Dir = () => checkout('psys2');

/** The SOP text of a published world: its schema and its shards, in order. */
export function worldText(name) {
  const dir = worldsDir();
  if (!dir) return null;
  const base = `${dir}docs/worlds/${name}/`;
  if (!existsSync(base)) throw new Error(`no published world ${name} in ${REPOS.find((r) => r.kind === 'knowledge').name} at its pinned commit`);
  const parts = [readFileSync(base + 'schema.sop', 'utf8')];
  if (existsSync(base + 'shards')) for (const f of readdirSync(base + 'shards').filter((x) => x.endsWith('.sop')).sort()) parts.push(readFileSync(base + 'shards/' + f, 'utf8'));
  return parts.join('\n');
}

/** Every published world of the first knowledge repository, as [{ id, schemaText, shards: [{ id, text }] }] (for factStore). */
export function publishedWorlds() {
  const dir = worldsDir();
  if (!dir) return null;
  const root = `${dir}docs/worlds/`;
  return readdirSync(root).filter((d) => /^[kw]\./.test(d) && existsSync(`${root}${d}/schema.sop`)).sort().map((id) => ({
    id, schemaText: readFileSync(`${root}${id}/schema.sop`, 'utf8'),
    shards: existsSync(`${root}${id}/shards`) ? readdirSync(`${root}${id}/shards`).filter((f) => f.endsWith('.sop')).sort().map((f) => ({ id: `${id}/shards/${f.slice(0, -4)}`, text: readFileSync(`${root}${id}/shards/${f}`, 'utf8') })) : [],
  }));
}

/**
 * A World with every schema of the first knowledge repository and, of the worlds named, only the
 * facts of the types named (a 46 MB world is read for its object names alone). `facts`:
 * { world: [types] }. Returns the World, or null offline.
 */
export async function catalogWorld(facts) {
  const dir = worldsDir();
  if (!dir) return null;
  const { World } = await import('../src/index.mjs');
  const D = `${dir}docs/worlds/`, w = new World();
  const schemas = readdirSync(D).filter((d) => /^[kw]\./.test(d) && existsSync(`${D}${d}/schema.sop`)).map((d) => readFileSync(`${D}${d}/schema.sop`, 'utf8')).join('\n');
  if (!w.tell(schemas).ok) throw new Error('the schemas of the knowledge repository do not load together');
  for (const [name, types] of Object.entries(facts)) {
    const lines = [];
    const walk = (d) => { for (const f of readdirSync(d, { withFileTypes: true })) { if (f.isDirectory()) walk(`${d}${f.name}/`); else if (f.name.endsWith('.sop') && f.name !== 'schema.sop') for (const l of readFileSync(d + f.name, 'utf8').split('\n')) if (types.some((t) => l.includes(` ${t} `))) lines.push(l); } };
    walk(`${D}${name}/`);
    const r = w.tell(lines.join('\n'));
    if (!r.ok) throw new Error(`${name}: ${JSON.stringify(r.violations?.slice(0, 1))}`);
  }
  return w;
}
