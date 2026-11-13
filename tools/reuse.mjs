#!/usr/bin/env node
// A detector of reuse between worlds (Round 23), not a judgement: it reads a set of worlds
// and reports candidates for a shared module, each with a score and the evidence.
//
//   node tools/reuse.mjs [--json] [--top N] <path> ...
//
// A path is a .sop file (one world), a directory whose subdirectories are worlds (each its
// .sop files), a directory of .sop files (each a world), or an .mjs file whose exported
// strings are SOP Lang (one world per file). Both dialects are read: sopworld (core.type
// of=, core.slot of= key=, core.action) and PSys2's legends (core.type by id, core.key with
// the id <type>.<key>, core.operation inputs= outputs=).
//
// What it looks for: types with the same shape (under renaming), rules with the same shape
// (under renaming of types, keys and variables), vocabularies that overlap, actions with
// the same signature, worlds that could be one parameterised world, rules that mention only
// kinds of another world (liftable), and per world a reuse number: of the types its rules
// and slots use, how many it declares itself and how many come from elsewhere.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse } from '../src/parser.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const topAt = args.indexOf('--top');
const TOP = topAt >= 0 ? Number(args[topAt + 1]) : 20;
const paths = args.filter((a, i) => !a.startsWith('--') && (topAt < 0 || i !== topAt + 1));

// ---- reading ---------------------------------------------------------------------------
const sopFiles = (dir) => readdirSync(dir).filter((f) => f.endsWith('.sop')).map((f) => join(dir, f));
async function worldsOf(path) {
  const st = statSync(path);
  if (st.isFile() && extname(path) === '.sop') return [{ name: basename(path, '.sop'), texts: [readFileSync(path, 'utf8')] }];
  if (st.isFile() && extname(path) === '.mjs') {
    const log = console.log; console.log = () => {}; // an example that prints when imported says nothing here
    let m;
    try { m = await import(pathToFileURL(resolve(path)).href); } finally { console.log = log; }
    const texts = Object.values(m).flatMap((v) => (typeof v === 'string' ? [v] : v && typeof v === 'object' && !Array.isArray(v) ? Object.values(v).filter((x) => typeof x === 'string') : [])).filter((t) => /(^|\s)@[\w.]+ [\w.]+/.test(t));
    return texts.length ? [{ name: basename(path, '.mjs'), texts }] : [];
  }
  const subs = readdirSync(path).map((f) => join(path, f)).filter((p) => statSync(p).isDirectory());
  const withSop = subs.filter((p) => sopFiles(p).length || (statSync(p).isDirectory() && readdirSync(p).some((f) => f === 'shards')));
  if (withSop.length) return withSop.map((p) => ({ name: basename(p), texts: sopFiles(p).map((f) => readFileSync(f, 'utf8')) }));
  const files = sopFiles(path);
  if (files.length) return files.map((f) => ({ name: basename(f, '.sop'), texts: [readFileSync(f, 'utf8')] }));
  const mjs = readdirSync(path).filter((f) => f.endsWith('.mjs')).map((f) => join(path, f));
  const out = [];
  for (const f of mjs) out.push(...(await worldsOf(f))); // bounded: the files of one directory
  return out;
}

const first = (w, k) => w.attrs[k]?.[0];
const unq = (v) => (typeof v === 'string' && v[0] === '"' ? v.slice(1, -1) : v);
function read({ name, texts, from }) {
  const wires = [];
  for (const t of texts) { try { wires.push(...parse(t)); } catch { /* a text that is not SOP Lang */ } }
  const byId = new Map(wires.map((w) => [w.id, w]));
  const types = new Map(); // name -> Map key -> signature
  const typeOf = (t) => types.get(t) || types.set(t, new Map()).get(t);
  const sig = (w) => {
    const en = w.attrs.enum?.length, ref = first(w, 'type'), kind = first(w, 'kind') || first(w, 'value');
    return [en ? `enum${Math.min(en, 9)}` : ref ? 'ref' : kind || 'any', (first(w, 'many') === 'true' || first(w, 'card') === 'many') ? '*' : ''].join('');
  };
  const rules = [], words = new Set(), actions = [];
  for (const w of wires) {
    if (w.type === 'core.type') typeOf(first(w, 'of') || w.id);
    else if (w.type === 'core.slot' && first(w, 'of') && first(w, 'key')) typeOf(first(w, 'of')).set(first(w, 'key'), sig(w));
    else if (w.type === 'core.key') { const i = w.id.lastIndexOf('.'); typeOf(w.id.slice(0, i)).set(w.id.slice(i + 1), sig(w)); }
    else if (w.type === 'core.word') for (const t of w.attrs.text || []) words.add(unq(t).toLowerCase());
    else if (w.type === 'core.action') actions.push({ id: w.id, name: first(w, 'name') || w.id, ins: [...(w.attrs.param || []), ...(w.attrs.required || [])], outs: w.attrs.returns || [] });
    else if (w.type === 'core.operation') actions.push({ id: w.id, name: w.id, ins: (w.attrs.inputs || []).map((x) => x.split('.').pop()), outs: (w.attrs.outputs || []).map((x) => x.split('.').pop()) });
    else if (w.type === 'core.rule' || w.type === 'core.deny') {
      const pats = (k) => (w.attrs[k] || []).map((r) => byId.get(r.replace(/^\$/, ''))).filter(Boolean);
      rules.push({ id: w.id, kind: w.type, when: pats('when'), not: pats('not'), then: pats('then'), checks: [...pats('if'), ...pats('with')] });
    }
  }
  return { name, from, wires, types, rules, words, actions };
}

// ---- shapes ----------------------------------------------------------------------------
const multisetSim = (a, b) => { // shared share of two multisets
  const m = new Map(); for (const x of a) m.set(x, (m.get(x) || 0) + 1);
  let common = 0; for (const x of b) if (m.get(x) > 0) { common++; m.set(x, m.get(x) - 1); }
  return (2 * common) / ((a.length + b.length) || 1);
};
const jaccard = (a, b) => { const A = new Set(a), B = new Set(b); let i = 0; for (const x of A) if (B.has(x)) i++; return i / ((A.size + B.size - i) || 1); };
/** A rule's shape with types, keys and variables renamed by first appearance. */
function ruleShape(r) {
  const T = new Map(), V = new Map();
  const t = (x) => (T.has(x) ? T.get(x) : (T.set(x, `T${T.size}`), T.get(x)));
  const v = (x) => (/^\$?\?/.test(x) ? (V.has(x.replace(/^\$/, '')) ? V.get(x.replace(/^\$/, '')) : (V.set(x.replace(/^\$/, ''), `v${V.size}`), V.get(x.replace(/^\$/, '')))) : 'c');
  const pat = (p) => `${t(p.type)}(${Object.entries(p.attrs).filter(([k]) => k !== 'core.on').map(([, vs]) => vs.map(v).join('|')).sort().join(',')})`;
  return [r.kind, r.when.map(pat).join(' '), r.not.length ? 'not ' + r.not.map(pat).join(' ') : '', r.checks.map((c) => first(c, 'fn') || 'calc').join(','), '=>', r.then.map(pat).join(' ')].join(' ');
}

// ---- detection -------------------------------------------------------------------------
function detect(worlds) {
  const found = [];
  const declaredIn = new Map(); // type -> world
  for (const w of worlds) for (const t of w.types.keys()) if (!declaredIn.has(t)) declaredIn.set(t, w.name);
  const pairs = []; for (let i = 0; i < worlds.length; i++) for (let j = i + 1; j < worlds.length; j++) pairs.push([worlds[i], worlds[j]]);
  // 1. types with the same shape
  for (const [a, b] of pairs) {
    for (const [ta, ka] of a.types) for (const [tb, kb] of b.types) {
      if (ka.size < 2 || kb.size < 2 || ta === tb) continue;
      const shape = multisetSim([...ka.values()], [...kb.values()]), names = jaccard([...ka.keys()], [...kb.keys()]);
      const score = 0.6 * shape + 0.4 * names;
      if (score >= 0.6 && shape >= 0.6) found.push({ kind: 'type shape', score, worlds: [a.name, b.name], what: `${ta} ~ ${tb}`, evidence: `keys ${[...ka.keys()].join(',')} | ${[...kb.keys()].join(',')}; shape ${shape.toFixed(2)}, names ${names.toFixed(2)}` });
    }
  }
  // 2. rules with the same shape in different worlds
  const byShape = new Map();
  for (const w of worlds) for (const r of w.rules) { const s = ruleShape(r); (byShape.get(s) || byShape.set(s, []).get(s)).push([w.name, r.id]); }
  for (const [s, rs] of byShape) {
    const ws = [...new Set(rs.map(([w]) => w))];
    if (ws.length < 2 || s.length < 30) continue;
    found.push({ kind: 'rule shape', score: Math.min(1, 0.5 + 0.1 * rs.length + s.length / 400), worlds: ws, what: rs.slice(0, 4).map(([w, r]) => `${w}:${r}`).join(', ') + (rs.length > 4 ? ` (+${rs.length - 4})` : ''), evidence: s });
  }
  // 3. vocabularies that overlap
  for (const [a, b] of pairs) {
    if (a.words.size < 3 || b.words.size < 3) continue;
    const j = jaccard([...a.words], [...b.words]);
    if (j >= 0.15) found.push({ kind: 'shared words', score: Math.min(1, j * 1.5), worlds: [a.name, b.name], what: `${[...a.words].filter((x) => b.words.has(x)).slice(0, 8).join(', ')}`, evidence: `Jaccard ${j.toFixed(2)} over ${a.words.size} and ${b.words.size} words` });
  }
  // 4. actions with the same signature: one candidate per pair of worlds and signature (a family)
  for (const [a, b] of pairs) {
    const fam = new Map();
    for (const x of a.actions) for (const y of b.actions) {
      if (x.ins.length + x.outs.length < 2) continue;
      const ins = jaccard(x.ins, y.ins), same = x.ins.length === y.ins.length && x.outs.length === y.outs.length;
      if (!same || ins < 0.5) continue;
      const key = `${[...x.ins].sort().join(',')}>${x.outs.length}`;
      const f = fam.get(key) || fam.set(key, { ins, x: new Set(), y: new Set(), n: x.ins.length + x.outs.length }).get(key);
      f.x.add(x.name); f.y.add(y.name);
    }
    for (const [key, f] of fam) {
      const trivial = f.n <= 2; // one argument in, one value out: a lookup
      found.push({ kind: 'action signature', score: (trivial ? 0.45 : 0.55) + 0.3 * f.ins + Math.min(0.1, 0.02 * (f.x.size + f.y.size)), worlds: [a.name, b.name], what: `${[...f.x].slice(0, 3).join(', ')}${f.x.size > 3 ? ` (+${f.x.size - 3})` : ''} ~ ${[...f.y].slice(0, 3).join(', ')}${f.y.size > 3 ? ` (+${f.y.size - 3})` : ''}`, evidence: `signature ${key.replace('>', ' -> ')} outputs${trivial ? ' (a lookup)' : ''}; ${f.x.size} and ${f.y.size} actions` });
    }
  }
  // 5. worlds that could be one parameterised world
  for (const [a, b] of pairs) {
    const sa = [...a.types.values()].filter((k) => k.size).map((k) => [...k.values()].sort().join('+')), sb = [...b.types.values()].filter((k) => k.size).map((k) => [...k.values()].sort().join('+'));
    if (sa.length < 2 || sb.length < 2) continue;
    const s = multisetSim(sa, sb), ra = multisetSim(a.rules.map(ruleShape), b.rules.map(ruleShape));
    const score = a.rules.length + b.rules.length ? 0.6 * s + 0.4 * ra : s;
    if (score >= 0.5) found.push({ kind: 'parameterised world', score, worlds: [a.name, b.name], what: `${a.name} ≈ ${b.name}`, evidence: `type shapes ${s.toFixed(2)} (${sa.length} / ${sb.length} types), rule shapes ${ra.toFixed(2)}` });
  }
  // 6. liftable rules: every type they mention is declared in one other world
  for (const w of worlds) for (const r of w.rules) {
    const ts = [...new Set([...r.when, ...r.not].map((p) => p.type))];
    const homes = new Set(ts.map((t) => declaredIn.get(t)).filter(Boolean));
    if (ts.length && homes.size === 1 && !homes.has(w.name) && ts.every((t) => declaredIn.has(t))) found.push({ kind: 'liftable rule', score: 0.7, worlds: [w.name, [...homes][0]], what: `${w.name}:${r.id}`, evidence: `reads only ${ts.join(', ')} (declared in ${[...homes][0]})` });
  }
  found.sort((x, y) => y.score - x.score || x.kind.localeCompare(y.kind));
  // the reuse number of each world
  const reuse = worlds.map((w) => {
    const used = new Set();
    for (const r of w.rules) for (const p of [...r.when, ...r.not, ...r.then]) used.add(p.type);
    for (const x of w.wires) if (x.type === 'core.slot' && first(x, 'type')) used.add(first(x, 'type'));
    for (const x of w.wires) if (!x.type.startsWith('core.') && !x.pattern && !/^\$|\?/.test(x.id)) used.add(x.type);
    const own = [...used].filter((t) => w.types.has(t)).length, outside = [...used].filter((t) => !w.types.has(t) && !t.startsWith('core.')).length;
    return { world: w.name, wires: w.wires.length, types: w.types.size, rules: w.rules.length, usedTypes: used.size, own, fromElsewhere: outside, reuse: used.size ? +(outside / used.size).toFixed(2) : 0 };
  });
  return { candidates: found, reuse };
}

const worlds = [];
for (const p of paths) for (const w of await worldsOf(p)) worlds.push(read({ ...w, from: basename(resolve(p)) })); // bounded: the paths given
// two worlds of the same name from different paths: named by their path too
for (const w of worlds) if (worlds.filter((x) => x.name === w.name).length > 1) w.name = `${w.from}/${w.name}`;
const { candidates, reuse } = detect(worlds);
if (json) console.log(JSON.stringify({ worlds: worlds.map((w) => w.name), candidates, reuse }, null, 1));
else {
  console.log(`# Reuse candidates: ${worlds.length} worlds (${worlds.map((w) => w.name).join(', ')})\n`);
  console.log(`${candidates.length} candidates; by kind: ${Object.entries(candidates.reduce((m, c) => ((m[c.kind] = (m[c.kind] || 0) + 1), m), {})).map(([k, n]) => `${k} ${n}`).join(', ')}\n`);
  console.log('| # | score | kind | worlds | what | evidence |\n| --- | --- | --- | --- | --- | --- |');
  candidates.slice(0, TOP).forEach((c, i) => console.log(`| ${i + 1} | ${c.score.toFixed(2)} | ${c.kind} | ${c.worlds.join(', ')} | ${c.what.replace(/\|/g, '/')} | ${c.evidence.replace(/\|/g, '/')} |`));
  console.log('\n## Reuse per world\n\nOf the types a world uses (in rules, references and facts), how many it declares itself and how many come from elsewhere.\n');
  console.log('| world | wires | types | rules | types used | own | from elsewhere | reuse |\n| --- | --- | --- | --- | --- | --- | --- | --- |');
  for (const r of reuse) console.log(`| ${r.world} | ${r.wires} | ${r.types} | ${r.rules} | ${r.usedTypes} | ${r.own} | ${r.fromElsewhere} | ${r.reuse} |`);
}
