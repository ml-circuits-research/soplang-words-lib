// Induction from cases (abstraction round item 4, Q54): cases that share a frame are anti-unified by
// the library's own `induce` into one reading rule (words that differ become variables; a variable
// that fills the frame is lifted to the kind of the thing it names, by a pattern on that thing's
// fact). A rule is proposed with its support, then judged on held-out cases and on the cousins of
// its cases; it is admitted only when the training cases all pass and the held-out share does not
// fall below `admit`. Nothing is told to the host's world: a rule is text to review.

import { induce } from './induce.mjs';

const enc = (text) => '@u utter ' + String(text).toLowerCase().replace(/[?!.]+\s*$/, '').match(/[\p{L}\p{N}_'-]+/gu).map((x, i) => `t${i + 1}=${x}`).join(' ');

/**
 * Proposals of reading rules from `cases` ([{ text, frame }] with frame { is: 'ask', key, of: { id } }).
 * Options: `heldOut` (more cases, not used to induce), `cousins(case) -> [cousins]` (valid ones are
 * held out too), `admit` (the least held-out share, default 1), `min` (cases per rule, default 2).
 * Returns [{ text, support, train: { pass, of }, heldOut: { pass, of }, admitted, why? }].
 */
export function learnRules(world, cases, { heldOut = [], cousins: cousinsOf, admit = 1, min = 2 } = {}) {
  const groups = new Map();
  for (const c of cases) { const n = enc(c.text).split(' ').length; const k = `${c.frame.is}|${c.frame.key}|${n}`; (groups.get(k) || groups.set(k, []).get(k)).push(c); }
  const out = [];
  let g = 0;
  for (const [key, group] of groups) {
    if (group.length < min) continue;
    const name = `learned_${++g}`;
    // the filler as the text names it (the thing's name, not its id), so the word, the fact's name and the
    // frame's holder are one variable when induce anti-unifies (reviewer 00:05: the id was taken as the token)
    const nameOf = (id) => String(world.get(id)?.attrs.name?.[0] ?? id).replace(/^"|"$/g, '').toLowerCase();
    const examples = group.map((c) => {
      const thing = world.get(c.frame.of.id), nm = nameOf(c.frame.of.id);
      return { when: `${enc(c.text)}\n@f ${thing.type} name=${nm}`, then: `@r ask key=${c.frame.key} of=${nm}` };
    });
    let r;
    try { r = induce(examples, { name }); } catch (e) { out.push({ group: key, why: String(e.message || e), admitted: false }); continue; }
    const answer = (text) => { // the rule alone, on a fork of the world: what it reads the text as
      const f = world.fork();
      if (!f.load(r.text).ok) return null;
      f.tell(enc(text));
      const rows = f.ask('ask key=?k of=?o');
      return rows.length === 1 ? { key: rows[0].k, of: rows[0].o } : null;
    };
    const judge = (list) => { let pass = 0; for (const c of list) { const a = answer(c.text); if (a && a.key === c.frame.key && a.of === nameOf(c.frame.of.id)) pass++; } return { pass, of: list.length }; };
    const train = judge(group);
    if (train.pass < train.of) { out.push({ text: r.text, support: group.map((c) => c.text), train, heldOut: { pass: 0, of: 0 }, admitted: false, why: 'a training case fails' }); continue; } // its own cases first
    const held = [...heldOut.filter((c) => enc(c.text).split(" ").length === enc(group[0].text).split(" ").length), ...(cousinsOf ? group.flatMap((c) => cousinsOf(c).filter((x) => x.valid && x.text)) : [])];
    const ho = judge(held);
    const share = ho.of ? ho.pass / ho.of : 1;
    out.push({ text: r.text, support: group.map((c) => c.text), train, heldOut: ho, admitted: train.pass === train.of && share >= admit, ...(train.pass < train.of ? { why: 'a training case fails' } : share < admit ? { why: `held-out ${ho.pass}/${ho.of}` } : {}) });
  }
  return out;
}

// ---- form operators (owner 16:12): a request is content × form × context; the form varies by few
// operators. From aligned pairs (a canonical sentence and a variant with the same meaning), the shared
// runs of words become variables and what is left is the operator: a rule `from` (the variant's shape)
// → `to` (the canonical one), the format of the language world's alternations. Rules that come out the
// same are one operator; each is admitted only when it brings held-out variants back to their canonical
// sentences.

const toksOf = (t) => String(t).toLowerCase().replace(/[?!.,]+/g, ' ').match(/[\p{L}\p{N}_'-]+/gu) || [];
import { typedLexicon } from './readtypes.mjs';
/**
 * Content words lifted to their type before aligning (reviewer 00:05): through the world's typed lexicon
 * a thing becomes <its type>, a kind <kind>, an attribute <attr>, a number <num>;
 * function words stay. So "hey a cow makes which sound" and "hey a dog makes which noise" align as one.
 */
export function liftTokens(world, text, { senses } = {}) {
  const lex = typedLexicon(world);
  return toksOf(text).map((t) => {
    if (/^\d+([.,]\d+)?$/.test(t)) return '<num>';
    const f = [t, t.replace(/s$/, ''), t.replace(/es$/, '')].find((x) => lex.has(x));
    const ss = f ? lex.get(f) : (senses?.(t) ?? []);
    const s0 = ss.find((x) => x.cat === 'thing') ?? ss.find((x) => x.cat === 'attr') ?? ss.find((x) => x.cat === 'kind'); // values are not lifted: function words are values of some facts
    if (!s0) return t;
    return s0.cat === 'thing' ? `<${s0.type}>` : `<${s0.cat}>`;
  });
}
const tok2 = (world, t) => (world ? liftTokens(world, t) : toksOf(t));

/** The operator of one pair: { from, to } with {x1}.. for the shared runs, or null when nothing is shared. */
export function formOperator(canonical, variant, { min = 1, world } = {}) {
  const a = tok2(world, canonical), b = tok2(world, variant);
  const A = a.map(() => null), B = b.map(() => null);
  let v = 0;
  for (;;) { // bounded: each pass marks a run; at most the tokens
    let best = null;
    for (let i = 0; i < a.length; i++) if (A[i] === null) for (let j = 0; j < b.length; j++) if (B[j] === null) {
      let n = 0; while (i + n < a.length && j + n < b.length && A[i + n] === null && B[j + n] === null && a[i + n] === b[j + n]) n++; // bounded: the shorter sentence
      if (n >= min && (!best || n > best.n)) best = { i, j, n };
    }
    if (!best) break;
    v++;
    for (let k = 0; k < best.n; k++) { A[best.i + k] = v; B[best.j + k] = v; }
  }
  if (!v) return null;
  const shape = (toks, marks) => { const out = []; for (let i = 0; i < toks.length; i++) { if (marks[i] === null) out.push(toks[i]); else if (marks[i] !== marks[i - 1]) out.push(`{x${marks[i]}}`); } return out; };
  let from = shape(b, B), to = shape(a, A);
  const order = [...new Set(from.filter((t) => t.startsWith('{')))], ren = Object.fromEntries(order.map((t, i) => [t, `{x${i + 1}}`]));
  from = from.map((t) => ren[t] ?? t); to = to.map((t) => ren[t] ?? t);
  return { from: from.join(' '), to: to.join(' ') };
}

/**
 * Form operators learnt from aligned pairs [{ canonical, variant }]: the operator of each pair, clustered
 * (the same rule is one operator), each with its support and a check on held-out pairs (the rule must
 * bring the variant back to its canonical sentence, `normalise`). Returns { operators: [{ name, from, to,
 * support, heldOut: { pass, of }, admitted }], coverage: { pairs, at80, at95 } } where at80 / at95 are how
 * many operators (most frequent first) cover 80 % / 95 % of the pairs.
 */
export function learnFormOperators(pairs, { heldOut = [], normalise: norm, world } = {}) {
  const clusters = new Map();
  let none = 0;
  for (const p of pairs) {
    const op = formOperator(p.canonical, p.variant, { world });
    if (!op || op.from === op.to) { none++; continue; }
    const k = `${op.from} => ${op.to}`;
    (clusters.get(k) || clusters.set(k, { ...op, support: [] }).get(k)).support.push(p.variant);
  }
  const ops = [...clusters.values()].sort((x, y) => y.support.length - x.support.length);
  ops.forEach((o, i) => {
    o.name = `op${i + 1}`;
    const T = (x) => (world ? liftTokens(world, x) : toksOf(x)).join(' ');
    const all = (x) => (norm ? [norm(o, x)].filter((y) => y != null) : applyRuleAll(o, world ? liftTokens(world, x).join(' ') : x));
    const mine = heldOut.filter((h) => all(h.variant).length && !all(h.variant).includes(T(h.variant)));
    const pass = mine.filter((h) => all(h.variant).includes(T(h.canonical))).length; // one of its readings gives the canonical sentence
    o.heldOut = { pass, of: mine.length };
    o.admitted = o.support.length >= 2 || (mine.length > 0 && pass === mine.length);
  });
  const total = pairs.length - none;
  let acc = 0, at80 = null, at95 = null;
  ops.forEach((o, i) => { acc += o.support.length; if (at80 === null && acc >= 0.8 * total) at80 = i + 1; if (at95 === null && acc >= 0.95 * total) at95 = i + 1; });
  return { operators: ops, coverage: { pairs: total, operators: ops.length, at80, at95 }, unaligned: none };
}

function applyRule(rule, text) { return applyRuleAll(rule, text)[0] ?? null; } // the first reading

function applyRuleAll(rule, text) { // every way the rule applies (adjacent variables split differently), bounded by the tokens
  const toks = /</.test(text) ? String(text).trim().split(/\s+/) : toksOf(text), pat = rule.from.split(' '), outs = []; // a lifted text is its tokens already
  const go = (i, k, env) => { // bounded: the pattern and the tokens
    if (outs.length > 50) return;
    if (k === pat.length) { if (i === toks.length) outs.push(rule.to.split(' ').flatMap((t) => { const m = /^\{(x\d+)\}$/.exec(t); return m ? env[m[1]] : [t]; }).join(' ')); return; }
    const m = /^\{(x\d+)\}$/.exec(pat[k]);
    if (m) { for (let j = i + 1; j <= toks.length; j++) go(j, k + 1, { ...env, [m[1]]: toks.slice(i, j) }); return; }
    if (toks[i] === pat[k]) go(i + 1, k + 1, env);
  };
  go(0, 0, {});
  return [...new Set(outs)];
}

/**
 * The atomic edits of an aligned pair (reviewer 23:45: real variants combine several operators): an LCS
 * alignment of the words, and each hunk where they differ as one edit { del: variant words, ins:
 * canonical words, at: start | end | inside }. A filler is a hunk with nothing inserted.
 */
export function formEdits(canonical, variant, { world } = {}) {
  const a = tok2(world, canonical), b = tok2(world, variant);
  const L = Array.from({ length: b.length + 1 }, () => new Array(a.length + 1).fill(0));
  for (let i = b.length - 1; i >= 0; i--) for (let j = a.length - 1; j >= 0; j--) L[i][j] = b[i] === a[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]); // bounded: the two sentences
  const edits = [];
  let i = 0, j = 0, del = [], ins = [], start = 0;
  const flush = () => { if (del.length || ins.length) edits.push({ del: del.join(' '), ins: ins.join(' '), at: start === 0 ? 'start' : i >= b.length && j >= a.length ? 'end' : 'inside' }); del = []; ins = []; };
  while (i < b.length || j < a.length) { // bounded: each step consumes a word
    if (i < b.length && j < a.length && b[i] === a[j]) { flush(); i++; j++; start = i; continue; }
    if (j >= a.length || (i < b.length && L[i + 1][j] >= L[i][j + 1])) del.push(b[i++]); else ins.push(a[j++]);
  }
  flush();
  return edits;
}

/**
 * Atomic form operators: the edits of every pair clustered (the same edit is one operator), with how many
 * operators cover 80 % / 95 % of the edits, and of the pairs fully (every edit of the pair covered).
 */
export function learnFormEdits(pairs, { world } = {}) {
  const clusters = new Map(), per = [];
  for (const p of pairs) {
    const es = formEdits(p.canonical, p.variant, { world }).map((e) => `${e.at}: "${e.del}" -> "${e.ins}"`);
    per.push(es);
    for (const k of es) clusters.set(k, (clusters.get(k) || 0) + 1);
  }
  const ops = [...clusters].sort((x, y) => y[1] - x[1]).map(([edit, count]) => ({ edit, count, family: familyOf(edit) }));
  const total = ops.reduce((s, o) => s + o.count, 0);
  const families = {}; for (const o of ops) families[o.family] = (families[o.family] || 0) + o.count;
  const cover = (share) => { let acc = 0; for (let k = 0; k < ops.length; k++) { acc += ops[k].count; if (acc >= share * total) return k + 1; } return ops.length; };
  const pairsCover = (share) => { // the fewest top operators that explain every edit of `share` of the pairs
    for (let k = 1; k <= ops.length; k++) { const top = new Set(ops.slice(0, k).map((o) => o.edit)); if (per.filter((es) => es.every((e) => top.has(e))).length >= share * per.length) return k; }
    return ops.length;
  };
  return { operators: ops, edits: total, families: Object.fromEntries(Object.entries(families).sort((a, b) => b[1] - a[1])), coverage: { at80: cover(0.8), at95: cover(0.95), pairsAt80: pairsCover(0.8), pairsAt95: pairsCover(0.95) } };
}

/** The family of an edit by its shape alone (no language): filler, extra clause, insertion, deletion, inflection, substitution. */
export function familyOf(edit) {
  const m = /^(\w+): "(.*)" -> "(.*)"$/.exec(edit);
  if (!m) return 'other';
  const [, at, del, ins] = m, d = del ? del.split(' ') : [], n = ins ? ins.split(' ') : [];
  if (!n.length && d.length <= 2 && at !== 'inside') return 'filler';
  if (!n.length && d.length >= 3) return 'extra clause';
  if (!d.length) return 'insertion';
  if (!n.length) return 'deletion';
  if (d.length === 1 && n.length === 1) { const [x, y] = [d[0], n[0]]; let k = 0; while (k < Math.min(x.length, y.length) && x[k] === y[k]) k++; if (k >= Math.min(x.length, y.length) - 2 && k >= 3) return 'inflection'; } // bounded: the shorter word
  if (d.length >= 3 && n.length <= 2) return 'extra clause';
  return 'substitution';
}
