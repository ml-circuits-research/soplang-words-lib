// std.morph (Round 30): morphology for language worlds, the same few primitives for every
// language, run in both directions. A language world declares paradigm classes as rules
// (a stem rule and endings per feature cell, a class inheriting from another and overriding
// some cells), alternations of the stem, irregular forms, spelling folds and clitic splits;
// its open lexicon lives in an external dictionary (one row per lemma with its class). The
// library generates a form, analyses a form back into lemma + class + features (through a
// suffix index built at load: no stored form lists), folds spelling variants, and realises
// a template with agreement. Nothing in this file knows a language.
//
// Facts (default type names; a language world may rename them in `types`):
//   m.class name= parent=? drop=? alt=<from>><to> (rep.)   a paradigm class
//   m.ending class= suffix= alt=yes? <feature>=<value>...    one cell: features -> suffix ("_" = none)
//   m.irregular lemma= form= <feature>=<value>...            consulted first
//   m.fold from= to=                                         a spelling variant (diacritics folding)
//   m.split text=                                            a clitic joiner ("-")
//   m.template act= shape=? text=                           a realisation template: {role}, {role:f=v,..}, {role@other}
import { unify, walk, EMPTY } from './unify.mjs';

const unq = (t) => String(t).replace(/^"|"$/g, '');
const RESERVED = new Set(['class', 'suffix', 'alt', 'lemma', 'form', 'name', 'parent', 'drop', 'from', 'to', 'text', 'act', 'shape', 'core.source', 'doc', 'note']);
const cellKey = (feat) => Object.keys(feat).sort().map((k) => `${k}=${feat[k]}`).join('.');
const featOf = (attrs) => Object.fromEntries(Object.entries(attrs).filter(([k]) => !RESERVED.has(k) && !k.startsWith('core.')).map(([k, v]) => [k, unq(v[0])]));

/** The morphology a language world declares, compiled once: classes with their inherited cells, a suffix index, folds. */
export function morphOf(world, { types = {} } = {}) {
  const T = { cls: 'm.class', ending: 'm.ending', irregular: 'm.irregular', fold: 'm.fold', split: 'm.split', template: 'm.template', ...types };
  const decl = new Map(world.ofType(T.cls).map((c) => [unq(c.attrs.name[0]), c]));
  const own = new Map(); // class -> Map(cellKey -> { suffix, alt, feat })
  for (const e of world.ofType(T.ending)) {
    const cls = unq(e.attrs.class[0]), feat = featOf(e.attrs), suf = unq(e.attrs.suffix?.[0] ?? '_');
    (own.get(cls) || own.set(cls, new Map()).get(cls)).set(cellKey(feat), { suffix: suf === '_' ? '' : suf, alt: e.attrs.alt?.[0] === 'yes', feat });
  }
  const classes = new Map();
  const build = (name, trail = new Set()) => { // bounded: each class once; a cycle is cut
    if (classes.has(name)) return classes.get(name);
    if (trail.has(name)) return null;
    trail.add(name);
    const c = decl.get(name);
    const parent = c?.attrs.parent ? build(unq(c.attrs.parent[0]), trail) : null;
    const cells = new Map(parent ? parent.cells : []);
    for (const [k, v] of own.get(name) || []) cells.set(k, v); // a class = its parent + overrides
    const alts = c?.attrs.alt ? c.attrs.alt.map((a) => unq(a).split('>')) : parent?.alts || [];
    const out = { name, drop: c?.attrs.drop ? unq(c.attrs.drop[0]) : parent?.drop ?? '', alts, cells };
    classes.set(name, out);
    return out;
  };
  for (const name of new Set([...decl.keys(), ...own.keys()])) build(name);
  const index = new Map(); // suffix -> [{ cls, key, cell }]: the suffix trie, flat
  for (const c of classes.values()) for (const [key, cell] of c.cells) (index.get(cell.suffix) || index.set(cell.suffix, []).get(cell.suffix)).push({ cls: c.name, key, cell });
  const irregular = world.ofType(T.irregular).map((x) => ({ lemma: unq(x.attrs.lemma[0]), form: unq(x.attrs.form[0]), feat: featOf(x.attrs) }));
  const folds = world.ofType(T.fold).map((x) => [unq(x.attrs.from[0]), unq(x.attrs.to[0])]);
  const splits = world.ofType(T.split).flatMap((x) => (x.attrs.text || []).map(unq));
  const templates = world.ofType(T.template).map((x) => ({ act: unq(x.attrs.act?.[0] ?? ''), shape: x.attrs.shape ? unq(x.attrs.shape[0]) : null, text: unq(x.attrs.text[0]) }));
  return { classes, index, irregular, folds, splits, templates };
}

/** Spelling folded (diacritics and old variants to their plain form), by the language world's folds. */
export function fold(m, text) {
  let s = String(text);
  for (const [from, to] of m.folds) s = s.split(from).join(to); // bounded: the folds
  return s;
}

/** Apply (or undo) a class's alternations to the last place in the stem where they fit. */
function alternate(stem, alts, back = false) {
  for (const [from, to] of alts) { // bounded: the alternations of one class
    const [a, b] = back ? [to, from] : [from, to];
    const at = stem.lastIndexOf(a);
    if (at >= 0) return stem.slice(0, at) + b + stem.slice(at + a.length);
  }
  return stem;
}
const same = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) => b[k] === v);

/** A form: the irregular one if declared, else the class's stem rule and the cell's ending. null when the class has no such cell. */
export function generate(m, lemma, cls, feat) {
  const irr = m.irregular.find((x) => x.lemma === lemma && same(x.feat, feat));
  if (irr) return irr.form;
  const c = m.classes.get(cls);
  const cell = c?.cells.get(cellKey(feat));
  if (!cell) return null;
  let stem = c.drop && lemma.endsWith(c.drop) ? lemma.slice(0, lemma.length - c.drop.length) : lemma;
  if (cell.alt) stem = alternate(stem, c.alts);
  return stem + cell.suffix;
}

/**
 * The readings of a form: [{ lemma, class, features, form, exact }]. Through the suffix
 * index (no form list); each candidate is checked by generating it again. With a dictionary,
 * only lemmas it has, in its class (a folded spelling finds the lemma with its diacritics,
 * ranked after an exact match). Without one, every reading the rules allow.
 */
export function analyse(m, form, { dictionary } = {}) {
  const out = [], seen = new Set();
  const plain = fold(m, form);
  const push = (r) => { const k = `${r.lemma}|${r.class}|${cellKey(r.features)}`; if (!seen.has(k)) { seen.add(k); out.push(r); } };
  for (const x of m.irregular) if (fold(m, x.form) === plain) push({ lemma: x.lemma, class: dictionary?.lookup(x.lemma)?.class ?? null, features: x.feat, form: x.form, exact: x.form === form });
  for (let n = 0; n <= plain.length; n++) { // bounded: the suffix lengths of one form
    const suffix = plain.slice(plain.length - n);
    for (const { cls, cell } of m.index.get(suffix) || []) {
      const c = m.classes.get(cls);
      let stem = plain.slice(0, plain.length - n);
      if (cell.alt) stem = alternate(stem, c.alts.map(([a, b]) => [fold(m, a), fold(m, b)]), true);
      const lemmaPlain = stem + fold(m, c.drop);
      const entries = dictionary ? dictionary.byFolded(lemmaPlain).filter((e) => e.class === cls) : [{ lemma: lemmaPlain, class: cls }];
      for (const e of entries) {
        const g = generate(m, e.lemma, cls, cell.feat);
        if (g !== null && fold(m, g) === plain) push({ lemma: e.lemma, class: cls, features: cell.feat, form: g, exact: g === form });
      }
    }
  }
  return out.sort((a, b) => Number(b.exact) - Number(a.exact));
}

/** Clitics split by the language world's joiners ("give-me" -> ["give", "me"]), before analysis. */
export function splitClitics(m, word) {
  for (const j of m.splits) if (word.includes(j)) return word.split(j).filter(Boolean); // bounded: the joiners
  return [word];
}

/**
 * An external dictionary, compact and lazy: one row per lemma, `lemma<TAB>class<TAB>gender?<TAB>sense?`
 * (`#` starts a comment), split into files by the first `prefix` letters of the folded lemma.
 * `read(prefix)` gives a file's text (or null); each file is read once, when a word needs it.
 */
export function dictionary({ read, prefix = 1, fold: f = (s) => s }) {
  const files = new Map(); // prefix -> rows
  const load = (p) => {
    if (!files.has(p)) {
      const rows = String(read(p) ?? '').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => { const [lemma, cls, gender, sense] = l.split('\t'); return { lemma, class: cls, ...(gender ? { gender } : {}), ...(sense ? { sense } : {}) }; });
      files.set(p, rows);
    }
    return files.get(p);
  };
  const key = (lemma) => f(lemma).slice(0, prefix);
  return {
    lookup: (lemma) => load(key(lemma)).find((e) => e.lemma === lemma) ?? null,
    byFolded: (plain) => load(plain.slice(0, prefix)).filter((e) => f(e.lemma) === plain),
    loaded: () => [...files.keys()],
  };
}

/**
 * Realise a template: `{role}` is the role's lemma in its base form, `{role:f=v,..}` in
 * that cell, `{role@other}` agrees with another role (its gender and number, through
 * unification of their feature bundles). Roles are lemmas; their class and gender come
 * from the dictionary. Returns the sentence, or null when a form cannot be made.
 */
export function realise(m, template, roles, { dictionary, base = {}, agree = ['gender', 'num'] } = {}) {
  const info = (lemma) => dictionary?.lookup(lemma) ?? null;
  let failed = false;
  const text = template.replace(/\{([\w.]+)(?::([^}@]*))?(?:@(\w+))?\}/g, (_, role, cells, other) => {
    const lemma = roles[role];
    if (lemma === undefined) { failed = true; return ''; }
    const e = info(lemma);
    if (!e) return lemma; // a word the dictionary lacks (a name): as given
    let feat = { ...base, ...Object.fromEntries((cells || '').split(',').filter(Boolean).map((x) => x.split('='))) };
    if (other) { // agreement: this word's bundle unified with the other's
      const o = info(roles[other]);
      let s = EMPTY;
      for (const k of agree) {
        const mine = feat[k] ?? `?${k}`, theirs = k === 'gender' ? o?.gender ?? `?${k}` : (feat[k] ?? `?${k}`);
        s = s && unify(mine, theirs, s);
      }
      if (!s) { failed = true; return ''; }
      for (const k of agree) { const v = walk(`?${k}`, s); if (v[0] !== '?') feat[k] = v; }
      if (o?.gender && feat.gender === undefined) feat.gender = o.gender;
    }
    const cls = m.classes.get(e.class);
    if (!cls) return lemma;
    // the cell that fits: every feature the class's cells use, taken from feat
    const cell = [...cls.cells.values()].find((c) => Object.entries(c.feat).every(([k, v]) => feat[k] === v));
    const g = cell ? generate(m, lemma, e.class, cell.feat) : null;
    if (g === null) { failed = true; return ''; }
    return g;
  });
  return failed ? null : text;
}

/** The template a language world gives for an act (and an answer shape). */
export const templateFor = (m, act, shape = null) => m.templates.find((t) => t.act === act && t.shape === shape)?.text ?? m.templates.find((t) => t.act === act)?.text ?? null;
