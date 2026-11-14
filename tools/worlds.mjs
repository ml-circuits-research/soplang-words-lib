// The published worlds, read at a pinned commit (reviewer 04:40: the library holds
// mechanisms, tests and toy examples only; particular worlds and knowledge live in
// sop-knowledge-worlds, and applications' worlds in the applications).
//
// `worldsDir()` returns a checkout of sop-knowledge-worlds at the commit in `worlds.pin`:
// $SOPWORLDS_DIR when set (it must be at that commit), else `.cache/sop-knowledge-worlds`,
// cloned or fetched from GitHub on first use. `psys2Dir()` does the same for PSys2 (the
// pilot) with `psys2.pin`. Both return null when the checkout cannot be had (offline): the
// tests that need them are skipped, and say why.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, mkdirSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const REPOS = {
  worlds: { url: 'https://github.com/ml-circuits-research/sop-knowledge-worlds.git', pin: 'worlds.pin', env: 'SOPWORLDS_DIR', cache: '.cache/sop-knowledge-worlds' },
  psys2: { url: 'https://github.com/ml-circuits-research/psys2.git', pin: 'psys2.pin', env: 'PSYS2_DIR', cache: '.cache/psys2' },
};
const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { stdio: ['ignore', 'pipe', 'ignore'], timeout: 120000 }).toString().trim();
const cache = new Map();

/** A checkout of one of the REPOS at its pinned commit, or null. */
export function checkout(name) {
  if (cache.has(name)) return cache.get(name);
  const r = REPOS[name], pin = readFileSync(root + r.pin, 'utf8').trim();
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
export const worldsDir = () => checkout('worlds');
export const psys2Dir = () => checkout('psys2');

/** The SOP text of a published world: its schema and its shards, in order. */
export function worldText(name) {
  const dir = worldsDir();
  if (!dir) return null;
  const base = `${dir}docs/worlds/${name}/`;
  if (!existsSync(base)) throw new Error(`no published world ${name} at ${readFileSync(root + 'worlds.pin', 'utf8').trim()}`);
  const parts = [readFileSync(base + 'schema.sop', 'utf8')];
  if (existsSync(base + 'shards')) for (const f of readdirSync(base + 'shards').filter((x) => x.endsWith('.sop')).sort()) parts.push(readFileSync(base + 'shards/' + f, 'utf8'));
  return parts.join('\n');
}
