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
//   m.class name= parent=? drop=? alt=<from>><to>[@vowel|@end] (rep.)   a paradigm class
//   m.ending class= suffix= alt=yes|<list>? <feature>=<value>...  one cell: features -> suffix ("_" = none)
//   m.vowel text=                                            the vowels, for alternations at the last vowel
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
  const T = { cls: 'm.class', ending: 'm.ending', irregular: 'm.irregular', fold: 'm.fold', split: 'm.split', template: 'm.template', vowel: 'm.vowel', ...types };
  const decl = new Map(world.ofType(T.cls).map((c) => [unq(c.attrs.name[0]), c]));
  const own = new Map(); // class -> Map(cellKey -> { suffix, alt, feat })
  for (const e of world.ofType(T.ending)) {
    const cls = unq(e.attrs.class[0]), feat = featOf(e.attrs), suf = unq(e.attrs.suffix?.[0] ?? '_');
    const alt = e.attrs.alt ? (e.attrs.alt.length === 1 && unq(e.attrs.alt[0]) === 'yes' ? true : e.attrs.alt.map(altOf)) : false; // yes: the class's list; or the cell's own list
    (own.get(cls) || own.set(cls, new Map()).get(cls)).set(cellKey(feat), { suffix: suf === '_' ? '' : suf, alt, feat });
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
    const alts = c?.attrs.alt ? c.attrs.alt.map(altOf) : parent?.alts || [];
    const out = { name, drop: c?.attrs.drop ? unq(c.attrs.drop[0]) : parent?.drop ?? '', alts, cells };
    classes.set(name, out);
    return out;
  };
  for (const name of new Set([...decl.keys(), ...own.keys()])) build(name);
  const irregular = world.ofType(T.irregular).map((x) => ({ lemma: unq(x.attrs.lemma[0]), form: unq(x.attrs.form[0]), feat: featOf(x.attrs) }));
  const folds = world.ofType(T.fold).map((x) => [unq(x.attrs.from[0]), unq(x.attrs.to[0])]);
  const plainOf = (t) => { let r = t; for (const [a, b] of folds) r = r.split(a).join(b); return r; }; // bounded: the folds
  const index = new Map(); // folded suffix -> [{ cls, key, cell }]: the suffix trie, flat; folded so a form typed without diacritics finds it
  for (const c of classes.values()) for (const [key, cell] of c.cells) { const k = plainOf(cell.suffix); (index.get(k) || index.set(k, []).get(k)).push({ cls: c.name, key, cell }); }
  const splits = world.ofType(T.split).flatMap((x) => (x.attrs.text || []).map(unq));
  const vowels = world.ofType(T.vowel).flatMap((x) => (x.attrs.text || []).map(unq)).join('') || 'aeiou';
  const templates = world.ofType(T.template).map((x) => ({ act: unq(x.attrs.act?.[0] ?? ''), shape: x.attrs.shape ? unq(x.attrs.shape[0]) : null, text: unq(x.attrs.text[0]) }));
  return { classes, index, irregular, folds, splits, templates, vowels };
}

/** Spelling folded (diacritics and old variants to their plain form), by the language world's folds. */
export function fold(m, text) {
  let s = String(text);
  for (const [from, to] of m.folds) s = s.split(from).join(to); // bounded: the folds
  return s;
}

/** Apply (or undo) a class's alternations to the last place in the stem where they fit. */
// An alternation is `from>to`, optionally anchored: `@vowel` (at the stem's last vowel, by the
// language world's `m.vowel text=` facts), `@end` (at the end of the stem); unanchored, at
// its last occurrence. A cell applies its list in order (several places at once: a>ă@vowel
// then t>ț@end); analysis undoes them in the reverse order.
function alternate(stem, alts, back = false, vowels = 'aeiou') {
  const list = back ? [...alts].reverse() : alts;
  for (const [from, to, anchor] of list) { // bounded: the alternations of one cell
    const [a, b] = back ? [to, from] : [from, to];
    let at = -1;
    if (anchor === 'end') at = stem.endsWith(a) ? stem.length - a.length : -1;
    else if (anchor === 'vowel') { let v = -1; for (let i = stem.length - 1; i >= 0 && v < 0; i--) if (vowels.includes(stem[i]) || (back && b.includes(stem[i]))) v = i; at = v >= 0 && stem.startsWith(a, v) ? v : -1; } // bounded: the letters
    else at = stem.lastIndexOf(a);
    if (at >= 0) stem = stem.slice(0, at) + b + stem.slice(at + a.length);
  }
  return stem;
}
/**
 * Every stem an alternation list could have come from, walking it back (the reverse order):
 * the stem as it is (the lemma may already have the result), and each place the target
 * occurs (or, for a deletion, each place the source may have been). Generate-and-check
 * keeps the readings that give the form again.
 */
function unalternate(stem, alts) {
  let out = [stem];
  for (const [from, to] of [...alts].reverse()) { // bounded: the alternations of one cell, then the stem's letters
    const next = new Set(out);
    for (const s of out) {
      if (to === '') { for (let i = 0; i <= s.length; i++) next.add(s.slice(0, i) + from + s.slice(i)); continue; }
      for (let i = s.indexOf(to); i >= 0; i = s.indexOf(to, i + 1)) next.add(s.slice(0, i) + from + s.slice(i + to.length));
    }
    out = [...next];
  }
  return out;
}
const altOf = (t) => { const [pair, anchor] = unq(t).split('@'); const [from, to] = pair.split('>'); return [from, to, anchor || null]; };
const same = (a, b) => Object.keys(a).length === Object.keys(b).length && Object.entries(a).every(([k, v]) => b[k] === v);

/** A form: the irregular one if declared, else the class's stem rule and the cell's ending. null when the class has no such cell. */
export function generate(m, lemma, cls, feat) {
  const irr = m.irregular.find((x) => x.lemma === lemma && same(x.feat, feat));
  if (irr) return irr.form;
  const c = m.classes.get(cls);
  const cell = c?.cells.get(cellKey(feat));
  if (!cell) return null;
  let stem = c.drop && lemma.endsWith(c.drop) ? lemma.slice(0, lemma.length - c.drop.length) : lemma;
  if (cell.alt) stem = alternate(stem, cell.alt === true ? c.alts : cell.alt, false, m.vowels);
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
      const base = plain.slice(0, plain.length - n);
      const stems = cell.alt ? unalternate(base, (cell.alt === true ? c.alts : cell.alt).map(([a, b]) => [fold(m, a), fold(m, b)])) : [base];
      for (const stem of stems) {
        const lemmaPlain = stem + fold(m, c.drop);
        const entries = dictionary ? dictionary.byFolded(lemmaPlain).filter((e) => e.class === cls) : [{ lemma: lemmaPlain, class: cls }];
        for (const e of entries) {
          const g = generate(m, e.lemma, cls, cell.feat);
          if (g !== null && fold(m, g) === plain) push({ lemma: e.lemma, class: cls, features: cell.feat, form: g, exact: g === form }); // generate-and-check
        }
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
  const files = new Map(); // prefix -> { rows, byLemma, byPlain }
  const load = (p) => {
    if (!files.has(p)) {
      const rows = String(read(p) ?? '').split('\n').filter((l) => l.trim() && !l.startsWith('#')).map((l) => { const [lemma, cls, gender, sense] = l.split('\t'); return { lemma, class: cls, ...(gender ? { gender } : {}), ...(sense ? { sense } : {}) }; });
      const byLemma = new Map(), byPlain = new Map();
      for (const e of rows) { if (!byLemma.has(e.lemma)) byLemma.set(e.lemma, e); const k = f(e.lemma); (byPlain.get(k) || byPlain.set(k, []).get(k)).push(e); }
      files.set(p, { rows, byLemma, byPlain });
    }
    return files.get(p);
  };
  const key = (lemma) => f(lemma).slice(0, prefix);
  return {
    lookup: (lemma) => load(key(lemma)).byLemma.get(lemma) ?? null,
    byFolded: (plain) => load(plain.slice(0, prefix)).byPlain.get(plain) ?? [],
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

// ---- suffix rules and articles read from a language world's facts (reviewer 22:30, [KNOW] Q54):
// the plural (or any op) of a word by ordered suffix rules, irregular forms first; the article
// before a word by the sound it begins with. Language-free: the rules, irregulars, articles and
// onsets are the language world's facts.

const q = (v) => String(v).replace(/^"|"$/g, '');
const one1 = (w, k) => (w.attrs[k] ? q(w.attrs[k][0]) : undefined);
const KNOWN_RULE_KEYS = new Set(['op', 'order', 'suffix', 'after', 'unless_suffix', 'min_length', 'replace', 'add', 'drop', 'set']);

/**
 * A word changed by ordered suffix rules (`<rule type> op= order= suffix=... after=consonant|vowel
 * unless_suffix= min_length= replace= | add= drop=`), irregular forms first (`<irregular type>
 * singular= plural= read_only=`). A rule with keys it does not know is not applied (said in
 * `skipped`). Types default to w.lang.en's: { rule: 'w.lang.en.inflect', irregular: 'w.lang.en.irregular' }.
 * Returns the form (lower case), or the word when no rule applies.
 */
export function inflectBy(world, word, op = 'plural', { types = {}, vowels } = {}) {
  const T = { rule: 'w.lang.en.inflect', irregular: 'w.lang.en.irregular', ...types };
  const w = String(word).toLowerCase();
  const from = op === 'plural' ? 'singular' : 'plural', to = op === 'plural' ? 'plural' : 'singular';
  const irr = world.ofType(T.irregular).find((x) => one1(x, from) === w && (op !== 'plural' || one1(x, 'read_only') !== 'yes'));
  if (irr) return one1(irr, to);
  const V = new RegExp(`[${vowels ?? 'aeiou'}]$`);
  const rules = world.ofType(T.rule).filter((r) => one1(r, 'op') === op && Object.keys(r.attrs).every((k) => k.startsWith('core.') || KNOWN_RULE_KEYS.has(k))).sort((a, b) => Number(one1(a, 'order')) - Number(one1(b, 'order')));
  for (const r of rules) { // bounded: the rules
    if (one1(r, 'min_length') && w.length < Number(one1(r, 'min_length'))) continue;
    const sfx = (r.attrs.suffix || []).map(q);
    const hit = sfx.length ? sfx.find((s) => w.endsWith(s) && (!one1(r, 'after') || (one1(r, 'after') === 'consonant') === !V.test(w.slice(0, -s.length)))) : '';
    if (hit === undefined) continue;
    if ((r.attrs.unless_suffix || []).map(q).some((s) => w.endsWith(s))) continue;
    const base = one1(r, 'replace') != null && hit ? w.slice(0, w.length - hit.length) : w.slice(0, w.length - Number(one1(r, 'drop') ?? 0));
    return base + (one1(r, 'replace') ?? one1(r, 'add') ?? '');
  }
  return w;
}

/**
 * The article before a word: the determiner whose `before=` is the sound the word begins with,
 * by the longest `<onset type> begins= sound=` that matches, else by its first letter (vowels:
 * `aeiou` unless given). Types default to w.lang.en's: { det: 'w.lang.en.det', onset: 'w.lang.en.onset' }.
 */
export function articleFor(world, word, { types = {}, vowels } = {}) {
  const T = { det: 'w.lang.en.det', onset: 'w.lang.en.onset', ...types };
  const w = String(word).toLowerCase();
  const on = world.ofType(T.onset).filter((x) => w.startsWith(one1(x, 'begins'))).sort((a, b) => one1(b, 'begins').length - one1(a, 'begins').length)[0];
  const sound = on ? one1(on, 'sound') : new RegExp(`^[${vowels ?? 'aeiou'}]`).test(w) ? 'vowel' : 'consonant';
  const d = world.ofType(T.det).find((x) => one1(x, 'before') === sound);
  return d ? one1(d, 'text') : null;
}
