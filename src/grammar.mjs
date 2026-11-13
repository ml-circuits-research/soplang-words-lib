// std.grammar (Round 26 B, smallest version): language-free machinery that applies a
// grammar world to text. The world holds the language as facts — `g.word text= lemma= cat=`
// (the lexicon), `g.rule lhs= rhs= ...` (categories in order; `X?` optional, `X*` any
// number, `X+` one or more), `g.coord word=` (coordinating words) — and `parse` reads text
// with them: a chart of the categories each span can be (memoised, budget-bounded),
// coordination of a category ("A and B"), and every complete parse returned, best first,
// with its spans. No word of any language is in the library.

const tokensOf = (text) => String(text).toLowerCase().match(/[\p{L}\p{N}'-]+/gu) || [];

/** The grammar a world holds: rules (with ? * + expanded), lexicon by text, coordinating words. */
export function grammarOf(world) {
  const lex = new Map(), rules = new Map(), coord = new Set();
  for (const w of world.ofType('g.word')) for (const t of w.attrs.text || []) {
    const text = String(t).replace(/^"|"$/g, '').toLowerCase();
    (lex.get(text) || lex.set(text, []).get(text)).push({ cat: w.attrs.cat[0], lemma: w.attrs.lemma?.[0] ?? text, feat: Object.fromEntries(Object.entries(w.attrs).filter(([k]) => !['text', 'lemma', 'cat'].includes(k)).map(([k, v]) => [k, v[0]])) });
  }
  for (const w of world.ofType('g.coord')) for (const t of w.attrs.word || []) coord.add(String(t).replace(/^"|"$/g, '').toLowerCase());
  const add = (lhs, rhs) => (rules.get(lhs) || rules.set(lhs, []).get(lhs)).push(rhs);
  for (const w of world.ofType('g.rule')) {
    const lhs = w.attrs.lhs[0];
    let variants = [[]];
    for (const item of w.attrs.rhs || []) { // bounded: the parts of one rule (2^optional variants)
      const m = /^(.+?)([?*+])?$/.exec(item), base = m[1], mark = m[2];
      const unit = mark === '*' || mark === '+' ? `${base}+` : base;
      if (mark === '*' || mark === '+') { if (!rules.has(unit)) { add(unit, [base]); add(unit, [base, unit]); } }
      variants = variants.flatMap((v) => (mark === '?' || mark === '*' ? [v, [...v, unit]] : [[...v, unit]]));
    }
    for (const v of variants) if (v.length) add(lhs, v);
  }
  return { lex, rules, coord };
}

/**
 * Parse text as a category of the world's grammar (default `S`, or `start`). Returns the
 * complete parses, best first (fewer nodes, then fewer coordinations): [{ tree, size }];
 * a node is { cat, span: [i, j], word?, lemma?, feat?, children?, coord? }.
 */
export function parseText(world, text, { start = 'S', max = 8, budget = 20000 } = {}) {
  const g = grammarOf(world), tok = tokensOf(text);
  const memo = new Map();
  let steps = 0;
  const tick = () => { if (++steps > budget) throw Object.assign(new Error(`sopworld: grammar: more than ${budget} steps`), { budget: true }); };
  const active = new Set(); // (cat, i) being expanded: a left-recursive rule is cut there
  /** Every way `cat` can start at token i: [{ end, node }], at most `max` * 4. */
  function at(cat, i) {
    const key = `${cat}\u0001${i}`;
    if (memo.has(key)) return memo.get(key);
    if (active.has(key)) return [];
    active.add(key);
    tick();
    const out = [];
    if (i < tok.length) for (const e of g.lex.get(tok[i]) || []) if (e.cat === cat) out.push({ end: i + 1, at: { cat, span: [i, i + 1], word: tok[i], lemma: e.lemma, ...(Object.keys(e.feat).length ? { feat: e.feat } : {}) } });
    for (const rhs of g.rules.get(cat) || []) { // bounded: the rules of one category
      let partial = [{ end: i, children: [] }];
      for (const part of rhs) { // bounded: the parts of one rule
        const next = [];
        for (const p of partial) for (const r of at(part, p.end)) { tick(); next.push({ end: r.end, children: [...p.children, r.at] }); }
        partial = next.slice(0, max * 4);
        if (!partial.length) break;
      }
      for (const p of partial) out.push({ end: p.end, at: { cat, span: [i, p.end], children: p.children.flatMap((c) => (c.cat.endsWith('+') ? c.children || [c] : [c])) } });
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
        out.push({ end: items[items.length - 1].end, at: { cat, span: [i, items[items.length - 1].end], coord: items.map((x) => x.at) } });
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
  return full.filter((p) => { const k = JSON.stringify(p.tree); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.size - b.size || a.depth - b.depth || JSON.stringify(a.tree).localeCompare(JSON.stringify(b.tree))).slice(0, max).map(({ depth, ...p }) => p);
}

/** A noun phrase node read as roles: { det, num, mods, head, lemma, span, pp? } (categories named by the grammar: `cats`). */
export function nounPhrase(node, cats = { det: 'Det', num: 'Num', mod: 'Adj', head: 'N', pp: 'PP' }) { // bounded: the depth of the tree
  if (node.coord) return { coord: node.coord.map((n) => nounPhrase(n, cats)), span: node.span };
  const leaves = [], pps = [];
  const walk = (n) => { if (n.cat === cats.pp) { pps.push(n); return; } if (n.word) leaves.push(n); for (const c of n.children || []) walk(c); }; // bounded: the depth of the tree
  walk(node);
  const of = (cat) => leaves.filter((l) => l.cat === cat);
  const head = of(cats.head).pop();
  return { span: node.span, ...(of(cats.det)[0] ? { det: of(cats.det)[0].lemma } : {}), ...(of(cats.num)[0] ? { num: of(cats.num)[0].lemma } : {}), mods: of(cats.mod).map((l) => l.lemma), head: head?.word, lemma: head?.lemma, ...(pps.length ? { pp: pps.map((p) => ({ span: p.span, words: leavesOf(p) })) } : {}) };
}
const leavesOf = (n) => (n.word ? [n.word] : (n.children || n.coord || []).flatMap(leavesOf));
