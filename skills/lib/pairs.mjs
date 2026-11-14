// Shared by the skills' dry runs: psys2's aligned pairs at a fixed commit (read in place), a catalog world to
// read them against (k.animals), and the reading the world gives a sentence.
import { execFileSync } from 'node:child_process';
import { checkout, catalogWorld } from '../../tools/worlds.mjs';
import { readByTypes } from '../../src/index.mjs';
export const COMMIT = 'dbf72b0272f8b0719603d7df07bf41a1de1e82dc';
export function pairs() {
  const dir = checkout('psys2');
  try { execFileSync('git', ['-C', dir, 'cat-file', '-e', `${COMMIT}^{commit}`]); } catch { execFileSync('git', ['-C', dir, 'fetch', '-q', 'origin']); }
  return execFileSync('git', ['-C', dir, 'show', `${COMMIT}:training/eval/form-pairs.jsonl`]).toString().trim().split('\n').map((l) => JSON.parse(l)).filter((p) => p.same_meaning);
}
export async function world() {
  const w = await catalogWorld({ 'k.animals': ['k.animals.animal'] });
  w.tell('@mk core.word text=make text=makes text=say text=says means=sound  @hv core.word text=have text=has means=legs');
  return w;
}
export const READ = { question: ['what', 'which', 'how', 'many', 'does', 'do', 'is', 'are'], skip: ['a', 'an', 'the', 'of', 'in', 'and', 'then', 'also', 'too'] };
export const reading = (w, text) => { const r = readByTypes(w, text, READ); return r.best ? JSON.stringify({ is: r.best.is, key: r.best.key, of: r.best.of }) : null; };
