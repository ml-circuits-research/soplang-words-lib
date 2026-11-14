// std.grammar (Round 26 B, smallest version): language-free machinery that applies a
// grammar world to text. The world holds the language as facts — `g.word text= lemma= cat=`
// (the lexicon), `g.rule lhs= rhs= ...` (categories in order; `X?` optional, `X*` any
// number, `X+` one or more), `g.coord word=` (coordinating words) — and `parse` reads text
// with them: a chart of the categories each span can be (memoised, budget-bounded),
// coordination of a category ("A and B"), and every complete parse returned, best first,
// with its spans. No word of any language is in the library.


/**
 * The grammar a world holds: rules (with ? * + expanded), lexicon by text, coordinating
 * words. By default the types are `g.rule`, `g.word`, `g.coord`; a grammar world with its
 * own names says them (`types: { rule, word, coord }`), its closed classes become categories
 * (`classes: { DET: 'w.det', ... }`: the `text` of each wire is a word of that category),
 * and the open classes come from the host (`lexicon: { word: [{ cat, lemma }] }`). In a
 * rule, a lower-case part or a quoted one is a literal word and `[a|b]` is one of several.
 */
export function grammarOf(world, { types = {}, classes = {}, lexicon = {}, digits } = {}) {
  const T = { rule: 'g.rule', word: 'g.word', coord: 'g.coord', ...types };
  const lex = new Map(), rules = new Map(), coord = new Set();
  const unq = (t) => String(t).replace(/^"|"$/g, '').replace(/_/g, ' '); // next_to is the words next to
  const addWord = (text, e) => { const t = unq(text).toLowerCase(); (lex.get(t) || lex.set(t, []).get(t)).push(e); };
  for (const w of world.ofType(T.word)) for (const t of w.attrs.text || []) addWord(t, { cat: w.attrs.cat[0], lemma: w.attrs.lemma?.[0] ?? unq(t).toLowerCase(), feat: Object.fromEntries(Object.entries(w.attrs).filter(([k]) => !['text', 'lemma', 'cat'].includes(k) && !k.startsWith('core.')).map(([k, v]) => [k, v[0]])) });
  for (const [cat, type] of Object.entries(classes)) for (const w of world.ofType(type)) for (const t of w.attrs.text || []) addWord(t, { cat, lemma: unq(w.attrs.value?.[0] ?? t).toLowerCase(), feat: Object.fromEntries(Object.entries(w.attrs).filter(([k]) => !['text', 'in', 'note', 'doc'].includes(k) && !k.startsWith('core.')).map(([k, v]) => [k, v[0]])) });
  for (const [word, es] of Object.entries(lexicon)) for (const e of [].concat(es)) addWord(word, { cat: e.cat, lemma: e.lemma ?? word.toLowerCase(), feat: e.feat || {} });
  for (const w of world.ofType(T.coord)) for (const t of w.attrs.word || []) coord.add(unq(t).toLowerCase());
  const add = (lhs, rhs) => (rules.get(lhs) || rules.set(lhs, []).get(lhs)).push(rhs);
  for (const w of world.ofType(T.rule)) {
    if (w.attrs.status?.[0] === 'hole') continue; // a rule the grammar marks as not yet read
    const lhs = w.attrs.lhs[0];
    let variants = [[]];
    for (const raw of w.attrs.rhs || []) { // bounded: the parts of one rule (2^optional variants)
      const item = unq(raw);
      const m = /^(.+?)([?*+])?$/.exec(item), mark = m[2];
      let base = m[1];
      if (/^\[.*\]$/.test(base)) base = `=${base.slice(1, -1).split('|').map((x) => x.trim().toLowerCase()).join('|')}`; // one of several words
      else if (/^[^A-Z]/.test(base)) base = `=${base.toLowerCase()}`; // a literal word
      const unit = mark === '*' || mark === '+' ? `${base}+` : base;
      if (mark === '*' || mark === '+') { if (!rules.has(unit)) { add(unit, [base]); add(unit, [base, unit]); } }
      variants = variants.flatMap((v) => (mark === '?' || mark === '*' ? [v, [...v, unit]] : [[...v, unit]]));
    }
    for (const v of variants) if (v.length) { v.rule = w.id; v.head = w.attrs.head?.[0]; add(lhs, v); } // the rule's id travels with each expansion
  }
  const multi = [...lex.keys()].filter((t) => /\s/.test(t)).sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length);
  return { lex, rules, coord, multi, digits };
}

/** Tokens, with the lexicon's words of several parts ("next to") kept as one. */
function tokenize(text, g) {
  const raw = String(text).toLowerCase().match(/'s\b|[\p{L}\p{N}]+(?:'(?!s\b)[\p{L}]+)?|[&]/gu) || [];
  const out = [];
  for (let i = 0; i < raw.length; i++) { // bounded: the words
    const m = g.multi.find((t) => { const ws = t.split(/\s+/); return ws.every((x, k) => raw[i + k] === x); });
    if (m) { out.push(m); i += m.split(/\s+/).length - 1; } else out.push(raw[i]);
  }
  return out;
}

/**
 * Parse text as a category of the world's grammar (default `S`, or `start`). Returns the
 * complete parses, best first (fewer nodes, then fewer coordinations): [{ tree, size }],
 * with `tokens`, `unknown` (words no lexicon entry, literal or digit reads) and, past the
 * step budget, `truncated: true` and what was complete by then (it never throws);
 * a node is { cat, span: [i, j], word?, lemma?, feat?, children?, coord? }.
 */
export function parseText(world, text, { start = 'S', max = 8, budget = 20000, ...grammar } = {}) {
  const g = grammarOf(world, grammar), tok = tokenize(text, g);
  const memo = new Map();
  let steps = 0;
  let over = false;
  const tick = () => { if (++steps > budget) over = true; }; // past the budget the chart stops growing: what is complete is returned, with truncated=true
  const active = new Set(); // (cat, i) being expanded: a left-recursive rule is cut there
  /** Every way `cat` can start at token i: [{ end, node }], at most `max` * 4. */
  function at(cat, i) {
    const key = `${cat}\u0001${i}`;
    if (memo.has(key)) return memo.get(key);
    if (active.has(key) || over) return [];
    active.add(key);
    tick();
    const out = [];
    if (i < tok.length && cat.startsWith('=')) { if (cat.slice(1).split('|').includes(tok[i])) out.push({ end: i + 1, at: { cat, span: [i, i + 1], word: tok[i], lemma: tok[i] } }); active.delete(key); memo.set(key, out); return out; } // a literal word
    if (i < tok.length && cat === g.digits && /^\d+$/.test(tok[i])) out.push({ end: i + 1, at: { cat, span: [i, i + 1], word: tok[i], lemma: tok[i], feat: { value: Number(tok[i]) } } }); // digits, when the grammar names their category
    if (i < tok.length) for (const e of g.lex.get(tok[i]) || []) if (e.cat === cat) out.push({ end: i + 1, at: { cat, span: [i, i + 1], word: tok[i], lemma: e.lemma, ...(Object.keys(e.feat).length ? { feat: e.feat } : {}) } });
    const own = (g.rules.get(cat) || []).filter((rhs) => rhs[0] !== cat), left = (g.rules.get(cat) || []).filter((rhs) => rhs[0] === cat);
    for (const rhs of own) { // bounded: the rules of one category
      let partial = [{ end: i, children: [] }];
      for (const part of rhs) { // bounded: the parts of one rule
        const next = [];
        for (const p of partial) for (const r of at(part, p.end)) { tick(); next.push({ end: r.end, children: [...p.children, r.at] }); }
        partial = next.slice(0, max * 4);
        if (!partial.length) break;
      }
      for (const p of partial) out.push({ end: p.end, at: { cat, span: [i, p.end], ...(rhs.rule ? { rule: rhs.rule } : {}), ...(rhs.head ? { head: rhs.head } : {}), children: p.children.flatMap((c) => (c.cat.endsWith('+') ? c.children || [c] : [c])) } });
    }
    // a left-recursive rule (NP -> NP PP): grows each result found so far, until nothing new
    for (let k = 0; k < out.length && left.length && k < max * 8; k++) { // bounded: the results, capped
      const base = out[k];
      for (const rhs of left) {
        let partial = [{ end: base.end, children: [base.at] }];
        for (const part of rhs.slice(1)) { const next = []; for (const p of partial) for (const r of at(part, p.end)) { tick(); next.push({ end: r.end, children: [...p.children, r.at] }); } partial = next.slice(0, max * 4); if (!partial.length) break; }
        for (const p of partial) out.push({ end: p.end, at: { cat, span: [i, p.end], ...(rhs.rule ? { rule: rhs.rule } : {}), ...(rhs.head ? { head: rhs.head } : {}), children: p.children.flatMap((c) => (c.cat.endsWith('+') ? c.children || [c] : [c])) } });
      }
    }
    // coordination: C coord C (coord C ...), when the grammar declares coordinating words
    if (g.coord.size && !cat.endsWith('+')) for (const first of out.slice()) {
      let items = [first];
      for (;;) { // bounded: the tokens
        const last = items[items.length - 1];
        if (!g.coord.has(tok[last.end])) break;
        const more = at(cat, last.end + 1).filter((r) => !r.at.coord);
        if (!more.length) break;
        items = [...items, more.sort((a, b) => b.end - a.end)[0]];
        out.push({ end: items[items.length - 1].end, at: { cat, span: [i, items[items.length - 1].end], conj: tok[items[0].end], coord: items.map((x) => x.at) } });
      }
    }
    active.delete(key);
    memo.set(key, out);
    return out;
  }
  const size = (n) => 1 + (n.children || n.coord || []).reduce((s, c) => s + size(c), 0);
  const coordDepth = (n, d = 0) => (n.coord ? d : Math.min(99, ...(n.children || []).map((c) => coordDepth(c, d + 1)))); // a coordination high in the tree reads first
  const full = at(start, 0).filter((r) => r.end === tok.length).map((r) => ({ tree: r.at, size: size(r.at), depth: coordDepth(r.at) }));
  const seen = new Set();
  const literal = new Set([...g.rules.values()].flat(2).filter((x) => x.startsWith('=')).flatMap((x) => x.replace(/\+$/, '').slice(1).split('|')));
  const unknown = tok.map((word, at) => ({ word, at })).filter(({ word }) => !g.lex.has(word) && !literal.has(word) && !g.coord.has(word) && !(g.digits && /^\d+$/.test(word)));
  const parses = full.filter((p) => { const k = JSON.stringify(p.tree); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.size - b.size || a.depth - b.depth || JSON.stringify(a.tree).localeCompare(JSON.stringify(b.tree))).slice(0, max).map(({ depth, ...p }) => p);
  // no noun is owned: a word the lexicon does not have is reported, not judged
  return Object.assign(parses, { tokens: tok, ...(unknown.length ? { unknown } : {}), ...(over ? { truncated: true, steps } : {}) });
}

/** A noun phrase node read as roles: { det, num, mods, head, lemma, span, pp? } (categories named by the grammar: `cats`). */
export function nounPhrase(node, cats = {}) { // bounded: the depth of the tree
  const C = { det: 'Det', num: 'Num', mod: 'Adj', head: 'N', pp: 'PP', ord: 'Ord', name: 'Name', pron: 'Pron', quant: 'Quant', ...cats };
  if (node.coord) return { coord: node.coord.map((n) => nounPhrase(n, cats)), span: node.span, ...(node.conj ? { conj: node.conj } : {}) };
  // a coordination inside the phrase ("tables 1 and 2", "red and blue cups"): distributed, one phrase per part
  const inner = (n) => (n !== node && (n.cat === node.cat || n.cat === C.pp) ? null : n.coord && n !== node ? n : (n.children || []).map(inner).find(Boolean) || null); // bounded: the depth of the tree; not into a PP or a phrase of the same category
  const split = inner(node);
  if (split) {
    const swap = (n, c) => (n === split ? c : n.children ? { ...n, children: n.children.map((x) => swap(x, c)) } : n);
    return { coord: split.coord.map((c) => nounPhrase(swap(node, c), cats)), span: node.span, ...(split.conj ? { conj: split.conj } : {}) };
  }
  const kids = node.children || [];
  // a phrase built on a phrase of its own category (NP -> NP PP, NP -> NP of NP): the first is the base
  // ... unless the rule names another head (NP -> NP 's N: the N)
  const base = kids[0]?.cat === node.cat && (!node.head || node.head.startsWith(node.cat)) ? nounPhrase(kids[0], cats) : null;
  const leaves = [], pps = [], parts = [];
  let link = null;
  const walk = (n, top) => { // bounded: the depth of the tree
    if (n.cat === C.pp) { pps.push(n); return; }
    if (n !== node && n.cat === node.cat) { parts.push({ ...(link ? { link } : {}), ...nounPhrase(n, cats) }); link = null; return; }
    if (n.word) { if (n.cat.startsWith('=') && !top) link = n.word; leaves.push(n); }
    for (const c of n.children || []) walk(c, n === node && c === kids[0]);
  };
  for (const [k, c] of kids.entries()) { if (base && k === 0) continue; walk(c, k === 0); }
  if (!kids.length) walk(node, true);
  const of = (cat) => leaves.filter((l) => l.cat === cat), first = (cat) => of(cat)[0];
  const quant = leaves.find((l) => (l.cat === C.quant || l.cat.startsWith('=')) && l.span[0] === node.span[0]); // a quantifier: a category the grammar names (cats.quant), or a literal word
  const head = of(C.head).pop();
  const own = { span: node.span, ...(node.rule ? { rule: node.rule } : {}),
    ...(quant ? { quant: quant.word } : {}), ...(first(C.det) ? { det: first(C.det).lemma } : {}), ...(first(C.num) ? { num: first(C.num).lemma, ...(head && first(C.num).span[0] > head.span[0] ? { numAfter: true } : {}) } : {}),
    ...(first(C.ord) ? { ord: first(C.ord).lemma } : {}), ...(first(C.name) ? { name: first(C.name).word } : {}), ...(first(C.pron) ? { pron: first(C.pron).lemma } : {}),
    mods: of(C.mod).map((l) => l.lemma), ...(head ? { head: head.word, lemma: head.lemma } : {}),
    ...(pps.length ? { pp: pps.map((p) => { const inner = (p.children || []).find((c) => c.cat === node.cat); return { span: p.span, words: leavesOf(p), ...(inner ? { np: nounPhrase(inner, cats) } : {}) }; }) } : {}), ...(parts.length ? { parts } : {}) };
  if (!base) return own;
  const allPp = [...(base.pp || []), ...(own.pp || [])], allParts = [...(base.parts || []), ...(own.parts || [])];
  return { ...base, span: node.span, ...(node.rule ? { rule: node.rule } : {}), ...(allPp.length ? { pp: allPp } : {}), ...(allParts.length ? { parts: allParts } : {}) };
}
const leavesOf = (n) => (n.word ? [n.word] : (n.children || n.coord || []).flatMap(leavesOf));

/**
 * The words of a view: the `text` of every wire of `type` whose `in=` names `view` (every
 * wire when no view is given), sorted. Views keep each caller's list exact until its owner
 * unifies them; `viewDiff` says which words two views disagree on.
 */
export function grammarView(world, type, view) {
  const unq = (t) => String(t).replace(/^"|"$/g, '').replace(/_/g, ' ');
  return [...new Set(world.ofType(type).filter((w) => view === undefined || (w.attrs.in || []).includes(view)).flatMap((w) => (w.attrs.text || []).map(unq)))].sort();
}
export function viewDiff(world, type, a, b) {
  const A = new Set(grammarView(world, type, a)), B = new Set(grammarView(world, type, b));
  return { only: { [a]: [...A].filter((x) => !B.has(x)), [b]: [...B].filter((x) => !A.has(x)) }, both: [...A].filter((x) => B.has(x)) };
}
