// The automatic tester from one example (reviewer 21:55, owner 15:03): an example (a sentence and its
// expected frame, or a ledger row) → its cousins of degree 1..3 with expected answers computed from
// the lifted frame (the world is the oracle) → a host adapter that answers each → a table per degree
// × dimension of where it breaks, and the pattern of breaks named.
//
//   import { cousinsTest, printTable } from './tools/cousins-test.mjs';
//   const r = cousinsTest(world, { text, frame }, (text) => host.answer(text), { degree: 3 });
//   console.log(printTable(r));
//
// node tools/cousins-test.mjs   runs the built-in toy example (a farm world, a host that knows only cows)

import { cousins, judgeFix } from '../src/index.mjs';

/**
 * { table: { 'degree|dim': { pass, of, fails: [text] } }, case, pattern: [lines], cousins } for one example.
 * `host(text, frame) -> answer` is the system under test; a cousin passes when its answer equals the
 * world's. Options go to cousins (degree, dims, edges, read, known, n, seed).
 */
export function cousinsTest(world, example, host, options = {}) {
  const list = cousins(world, example, { degree: 3, ...options }).filter((c) => c.valid);
  const table = {};
  const same = (a, b) => JSON.stringify([].concat(a ?? [])) === JSON.stringify([].concat(b ?? []));
  for (const c of list) {
    const k = `${c.degree}|${c.dims[0]}`, row = (table[k] ||= { pass: 0, of: 0, fails: [] });
    row.of++;
    let a; try { a = host(c.text, c.frame); } catch { a = undefined; }
    if (same(a, c.frame.answer)) row.pass++; else row.fails.push(c.text ?? JSON.stringify(c.frame));
  }
  const judged = judgeFix(host, example, list);
  // the pattern: the dimensions that hold and the ones that break name the missing generalisation
  const byDim = {};
  for (const [k, r] of Object.entries(table)) { const dim = k.split('|')[1]; const d = (byDim[dim] ||= { pass: 0, of: 0 }); d.pass += r.pass; d.of += r.of; }
  const holds = Object.entries(byDim).filter(([, d]) => d.pass === d.of).map(([k]) => k), breaks = Object.entries(byDim).filter(([, d]) => d.pass < d.of).map(([k]) => k);
  const pattern = [];
  if (!judged.case) pattern.push('the example itself fails: fix it first');
  if (breaks.length) pattern.push(`passes when ${holds.join(', ') || 'nothing'} changes, fails when ${breaks.join(', ')} changes: a gap along ${breaks.join(', ')}`);
  else if (list.length) pattern.push('every cousin passes: the fix is general at these degrees');
  return { case: judged.case, table, pattern, share: judged.share, cousins: list.length };
}

/** The table as text: one line per degree × dimension. */
export function printTable(r) {
  const lines = [`case: ${r.case ? 'pass' : 'FAIL'}   cousins: ${r.cousins}   share: ${r.share}`];
  for (const k of Object.keys(r.table).sort()) { const [d, dim] = k.split('|'), t = r.table[k]; lines.push(`degree ${d}  ${dim.padEnd(6)} ${t.pass}/${t.of}${t.fails.length ? `   fails: ${t.fails.slice(0, 3).join('; ')}` : ''}`); }
  return [...lines, ...r.pattern].join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { World, readByTypes } = await import('../src/index.mjs');
  const w = new World();
  w.tell(`@cow k.animal name=cow kind=bovine role=farm sound=moo  @yak k.animal name=yak kind=bovine role=wild sound=grunt
@pig k.animal name=pig kind=suid role=farm sound=oink  @duck k.animal name=duck kind=fowl role=farm sound=quack
@bovine k.kind name=bovine is_a=mammal  @suid k.kind name=suid is_a=mammal  @fowl k.kind name=fowl is_a=bird`);
  const O = { question: ['what', 'does'], skip: ['a', 'the'] };
  const text = 'what sound does a cow make', example = { text, frame: readByTypes(w, text, O).best };
  const edges = { kind: 'kind', is_a: 'kind', role: 'role' };
  console.log('A host that knows only cows:');
  console.log(printTable(cousinsTest(w, example, (t) => (/\bcow\b/.test(t) ? ['moo'] : null), { read: O, edges })));
  console.log('\nreadByTypes as the host:');
  console.log(printTable(cousinsTest(w, example, (t) => readByTypes(w, t, O).best?.answer, { read: O, edges })));
}
