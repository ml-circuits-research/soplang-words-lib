// Runs the PSys2 test dialogues against matrices built on the library, and compares the
// status and value of every answer with what PSys2 answered.
//
//   node compat/psys2/run.mjs [world ...] [--failures] [--json]
//
// One world per session, as in PSys2. For each turn the wires are taken in order: a
// question or request wire is answered with world.query / world.act, every other wire
// is told. PSys2's own core.answer wires are left out.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const here = fileURLToPath(new URL('.', import.meta.url));
const lib = await import(process.env.SOPWORLD_BUNDLE ? '../../docs/sopworld.mjs' : '../../src/index.mjs');
const { World, parse } = lib;

export const WORLDS = ['kids.shop', 'kids.arith', 'kids.tasks'];
const read = (...p) => readFileSync(join(here, ...p), 'utf8');
const legend = (name) => read('worlds', name, 'legend.sop');
const heads = (text) => parse(text).find((x) => x.type === 'core.legend');

/** A fresh world for one session: mapping, the legends in import order, the knowledge base, the matrix. */
export async function build(name) {
  const dir = join(here, 'matrices', name);
  const fns = existsSync(join(dir, 'fns.mjs')) ? (await import(pathToFileURL(join(dir, 'fns.mjs')).href)).fns : {};
  const order = [];
  const visit = (ns) => { // bounded: each legend once
    if (order.includes(ns) || !existsSync(join(here, 'worlds', ns, 'legend.sop'))) return;
    order.push(ns); // placeholder against import cycles
    for (const i of heads(legend(ns))?.attrs.imports || []) visit(i);
    order.splice(order.indexOf(ns), 1);
    order.push(ns);
  };
  visit(name);
  const texts = [read('mapping.sop'), ...order.map(legend)];
  if (existsSync(join(here, 'worlds', name, 'kb.sop'))) texts.push(read('worlds', name, 'kb.sop'));
  // PSys2 keeps the user as a built-in agent of every session
  texts.push('@e.user core.agent');
  texts.push(read('matrices', name, 'matrix.sop'));
  return () => {
    const w = new World({ fns, vocabulary: { status: 'core.status' } });
    for (const t of texts) w.load(t);
    return w;
  };
}

const num = (v) => (v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null);
// a reference is written $id in a wire and id in PSys2's envelope
const bare = (v) => String(v).replace(/^\$/, '');
const same = (a, b) => (num(a) !== null && num(b) !== null ? Math.abs(num(a) - num(b)) < 1e-9 : bare(a) === bare(b));
/** PSys2 has five statuses; the library's sixth, `refused` (the thing asked about cannot be), is its `conflicting`. */
const statusOf = (r) => (r.status === 'refused' ? 'conflicting' : r.status === 'done' ? 'supported' : r.status);

function compare(got, want) {
  if (statusOf(got) !== want.status) return `status ${statusOf(got)}${got.status === 'refused' ? ' (refused)' : ''}, PSys2 ${want.status}`;
  if (want.status !== 'supported') return null;
  if (want.values) {
    const mine = got.values || (got.value !== undefined ? [got.value] : []);
    const ok = mine.length === want.values.length && want.values.every((v) => mine.some((m) => same(m, v)));
    return ok ? null : `values ${JSON.stringify(mine)}, PSys2 ${JSON.stringify(want.values)}`;
  }
  if (want.value === null || want.value === undefined) return null;
  return same(got.value, want.value) ? null : `value ${got.value}, PSys2 ${want.value}`;
}

export async function run(name) {
  const fresh = await build(name);
  const cases = read('cases', `${name}.cases.jsonl`).trim().split('\n').map((l) => JSON.parse(l));
  const sessions = new Map();
  const failures = [];
  let answers = 0;
  const started = performance.now();
  for (const c of cases) {
    let w = c.session ? sessions.get(c.session) : null;
    if (!w) { w = fresh(); if (c.session) sessions.set(c.session, w); }
    const wanted = new Map(c.psys2.answers.map((a) => [a.to, a]));
    const why = [];
    for (const wire of parse(c.wires)) {
      if (wire.type === 'core.answer') continue;
      // a wire without a source is not from the dialogue: PSys2's own operation wrote it. Here the action must.
      if (!wire.attrs['core.source']) continue;
      const asked = wire.type === 'core.question' || wire.type === 'core.request';
      let got;
      try {
        if (!asked) {
          const r = w.tell([wire]);
          if (!r.ok) why.push(`${wire.id} (${wire.type}) refused: ${r.violations[0].kind} ${r.violations[0].why || r.violations[0].key || ''}`.trim());
          continue;
        }
        got = wire.type === 'core.question' ? w.query(wire) : w.act(wire);
        // an action answers with an object: { status?, value?, values? }; no status means it was done
        if (got.status === 'done' && got.result && typeof got.result === 'object') got = { status: 'supported', ...got.result };
      } catch (e) {
        why.push(`${wire.id}: ${e.message}`);
        continue;
      }
      const want = wanted.get(wire.id);
      if (!want) continue;
      answers++;
      const diff = compare(got, want);
      if (diff) why.push(`${wire.id} ${wire.attrs.type?.[0] || wire.attrs.action?.[0]}: ${diff}`);
    }
    if (why.length) failures.push({ id: c.id, input: c.input, why });
  }
  const ms = performance.now() - started;
  return { name, cases: cases.length, passed: cases.length - failures.length, answers, failures, ms, msPerCase: ms / cases.length };
}

/** Lines that say something: not blank, not a comment. */
export const codeLines = (text, comment) => text.split('\n').filter((l) => l.trim() && !l.trim().startsWith(comment)).length;
export function size(name) {
  const dir = join(here, 'matrices', name);
  const matrix = codeLines(read('matrices', name, 'matrix.sop'), '#');
  const fns = existsSync(join(dir, 'fns.mjs')) ? codeLines(read('matrices', name, 'fns.mjs'), '//') : 0;
  return { matrix, fns, ops: read('worlds', name, 'ops.mjs').split('\n').length - 1, opsCode: codeLines(read('worlds', name, 'ops.mjs'), '//') };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const names = args.filter((a) => !a.startsWith('--'));
  const out = [];
  for (const name of names.length ? names : WORLDS) {
    if (!existsSync(join(here, 'matrices', name, 'matrix.sop'))) continue;
    const r = await run(name);
    const s = size(name);
    out.push({ ...r, size: s });
    if (args.includes('--json')) continue;
    console.log(`${name}: ${r.passed} of ${r.cases} cases pass (${(100 * r.passed / r.cases).toFixed(1)}%), ${r.answers} answers compared, ${r.msPerCase.toFixed(1)} ms per case`);
    console.log(`  matrix ${s.matrix} lines + fns ${s.fns} lines = ${s.matrix + s.fns}; ops.mjs ${s.ops} lines (${s.opsCode} without blank lines and comments)`);
    if (args.includes('--failures')) for (const f of r.failures) console.log(`  ${f.id}: ${f.why.join('; ')}\n      ${JSON.stringify(f.input)}`);
  }
  if (args.includes('--json')) console.log(JSON.stringify(out, null, 1));
}
