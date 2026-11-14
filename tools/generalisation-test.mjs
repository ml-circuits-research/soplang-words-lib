// The generalisation test from one example (reviewer 21:55, owner 15:03; metamorphic testing): an
// example (a sentence and its expected frame, or a ledger row) → its related cases at distance 1..3
// with expected answers computed from the lifted frame (the world is the oracle) → a host adapter that
// answers each → a table per distance × axis of where it breaks, and the pattern of breaks named.
//
//   import { generalisationTest, printTable } from './tools/generalisation-test.mjs';
//   const r = generalisationTest(world, { text, frame }, (text) => host.answer(text), { distance: 3 });
//   console.log(printTable(r));
//
// node tools/generalisation-test.mjs   runs the built-in toy example (a farm world, a host that knows only cows)

import { relatedCases, judgeOnRelated } from '../src/index.mjs';

/**
 * { table: { 'distance|axis': { pass, of, fails: [text] } }, case, pattern: [lines], related } for one example.
 * `host(text, frame) -> answer` is the system under test; a related case passes when its answer equals
 * the world's. Options go to relatedCases (distance, axes, edges, read, known, n, seed).
 */
export function generalisationTest(world, example, host, { degree, dims, ...options } = {}) {
  if (degree !== undefined) options.distance = degree; // the deprecated names (until 0.113.0)
  if (dims) options.axes = dims;
  const same = (a, b) => JSON.stringify([].concat(a ?? [])) === JSON.stringify([].concat(b ?? []));
  const list = relatedCases(world, example, { distance: 3, ...options }).filter((c) => c.valid);
  // every clause judged (reviewer 23:05 item 4): a compound text passes only when the host's answer to it
  // holds the world's answer to each of its clauses (`split(text) -> [clauses]`, `oracle(clause) -> answer`)
  const { split, oracle } = options;
  const judgeText = (text, expected, frame) => {
    const parts = split && text ? split(text) : [text];
    if (parts.length <= 1 || !oracle) { let a; try { a = host(text, frame); } catch { a = undefined; } return same(a, expected); }
    let a; try { a = host(text, frame); } catch { a = undefined; }
    const got = new Set([].concat(a ?? []).flat().map(String));
    return parts.every((p) => [].concat(oracle(p) ?? [null]).every((x) => got.has(String(x)))); // the host's answer to the whole text holds every clause's answer
  };
  const table = {};
  for (const c of list) {
    const k = `${c.distance}|${c.axes[0]}`, row = (table[k] ||= { pass: 0, of: 0, fails: [] });
    row.of++;
    if (judgeText(c.text, c.frame.answer, c.frame)) row.pass++; else row.fails.push(c.text ?? JSON.stringify(c.frame));
  }
  const judged = judgeOnRelated((t, f) => (judgeText(t, f.answer, f) ? f.answer : null), example, list);
  // the pattern: the axes that hold and the ones that break name the missing generalisation
  const byAxis = {};
  for (const [k, r] of Object.entries(table)) { const axis = k.split('|')[1]; const d = (byAxis[axis] ||= { pass: 0, of: 0 }); d.pass += r.pass; d.of += r.of; }
  const holds = Object.entries(byAxis).filter(([, d]) => d.pass === d.of).map(([k]) => k), breaks = Object.entries(byAxis).filter(([, d]) => d.pass < d.of).map(([k]) => k);
  const pattern = [];
  if (!judged.case) pattern.push('the example itself fails: fix it first');
  if (breaks.length) pattern.push(`passes when ${holds.join(', ') || 'nothing'} changes, fails when ${breaks.join(', ')} changes: a gap along ${breaks.join(', ')}`);
  else if (list.length) pattern.push('every related case passes: the fix is general at these distances');
  return { case: judged.case, table, pattern, share: judged.share, related: list.length };
}

/** The table as text: one line per distance × axis. */
export function printTable(r) {
  const lines = [`case: ${r.case ? 'pass' : 'FAIL'}   related: ${r.related}   share: ${r.share}`];
  for (const k of Object.keys(r.table).sort()) { const [d, axis] = k.split('|'), t = r.table[k]; lines.push(`distance ${d}  ${axis.padEnd(6)} ${t.pass}/${t.of}${t.fails.length ? `   fails: ${t.fails.slice(0, 3).join('; ')}` : ''}`); }
  return [...lines, ...r.pattern].join('\n');
}

/** @deprecated since 0.111.0, removed in 0.113.0: `generalisationTest`. */
export const cousinsTest = (...a) => generalisationTest(...a);

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
  console.log(printTable(generalisationTest(w, example, (t) => (/\bcow\b/.test(t) ? ['moo'] : null), { read: O, edges })));
  console.log('\nreadByTypes as the host:');
  console.log(printTable(generalisationTest(w, example, (t) => readByTypes(w, t, O).best?.answer, { read: O, edges })));
}
